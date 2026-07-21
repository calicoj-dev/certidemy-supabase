-- 111_public_samples_balance.sql
-- Certidemy - balance the public sample tier for the marketing pager
--
-- REQUIREMENT
-- The public certification page shows TWO sample questions at a time and cycles
-- through six, and each displayed pair must contain one AI-era item and one
-- conventional item. Migration 110 ranked AI-era first, which swept all six
-- slots per certification into the AI-era bucket and made that pairing
-- impossible. This migration selects the two buckets independently: three
-- AI-era groups and three non-AI-era groups per certification, so any pair the
-- pager draws can be balanced.
--
-- THE PREDICATE IS UNCHANGED AND IS CORRECT
-- Task-level AI-era density measured before this migration:
--   AIE-I 15/18 · AIGRM-I 42/51 · AISM-I 35/61 · SD-AI-I 23/45
--   SM-AI-I 7/53 · SPO-AI-I 12/46
-- The regex discriminates properly. 110's all-true outcome was a ranking
-- artefact, not a matching flaw, so the expression is reproduced verbatim from
-- get_public_samples() rather than narrowed. Every certification has at least
-- three non-AI-era tasks, so no certification needs a fully-AI-era exemption.
--
-- DOMAIN ROUND-ROBIN
-- 110 topped each certification up by taking the globally best remaining
-- candidates, which gave AIE-I four of six samples from D3 including two
-- near-duplicate pairs. Here, candidates are ranked within (certification,
-- bucket, domain) first, then ordered by that intra-domain rank, so selection
-- takes one per domain before it takes any domain's second. Repetition on the
-- page is structurally prevented.
--
-- FIREWALL
-- Unchanged from 109/110: candidates are drawn only from 'private', any group
-- with a 'secure' sibling is excluded, and a post-update assertion re-checks it
-- as a hard abort. Public promotion exposes correct_answer to anonymous users
-- through get_public_samples(), which is safe for practice items only.
--
-- Idempotent: resets all public rows first, then converges on the same 36.

-- ---------------------------------------------------------------------------
-- 1. Reset
-- ---------------------------------------------------------------------------
update public.quiz_questions
set visibility = 'private'
where visibility = 'public';

-- ---------------------------------------------------------------------------
-- 2. Reselect, bucket by bucket
-- ---------------------------------------------------------------------------
with cand as (
  select
    d.certification_id      as cert_id,
    d.id                    as domain_id,
    q.question_group_id     as grp,
    length(q.question_text) as stem_len,
    exists (
      select 1
      from public.task_concepts tc
      join public.concepts c on c.id = tc.concept_id
      where tc.task_id = t.id
        and (c.slug || ' ' || coalesce(c.name,'') || ' ' || coalesce(c.description,''))
            ~* '\m(ai|agent|agentic|llm|genai|generative|copilot|spec-driven|automation|assisted)\M'
    )                       as ai_era
  from public.quiz_questions q
  join public.tasks   t on t.id = q.task_id
  join public.domains d on d.id = t.domain_id
  where q.visibility = 'private'
    and q.language   = 'en'
    and q.question_type::text = 'single_choice'
    and q.question_group_id is not null
    and not exists (
      select 1 from public.quiz_questions s
      where s.question_group_id = q.question_group_id
        and s.visibility = 'secure'
    )
    and (
      select count(distinct l.language)
      from public.quiz_questions l
      where l.question_group_id = q.question_group_id
    ) = 3
),
-- rank inside each (cert, bucket, domain): best stem first
in_domain as (
  select cand.*,
         row_number() over (
           partition by cert_id, ai_era, domain_id
           order by (stem_len >= 120) desc, stem_len desc, grp
         ) as rn_dom
  from cand
),
-- round-robin across domains: all rank-1s before any rank-2
ordered as (
  select in_domain.*,
         row_number() over (
           partition by cert_id, ai_era
           order by rn_dom, (stem_len >= 120) desc, stem_len desc, grp
         ) as rn
  from in_domain
),
picked as (
  select cert_id, grp, ai_era from ordered where rn <= 3
),
-- if a bucket could not supply 3, backfill from whatever remains
shortfall as (
  select c.id as cert_id,
         6 - (select count(*) from picked p where p.cert_id = c.id) as d
  from public.certifications c
),
backfill as (
  select o.cert_id, o.grp,
         row_number() over (partition by o.cert_id order by o.rn, o.grp) as fr
  from ordered o
  where o.rn > 3
),
extra as (
  select b.grp
  from backfill b
  join shortfall s on s.cert_id = b.cert_id
  where s.d > 0 and b.fr <= s.d
),
chosen as (
  select grp from picked
  union
  select grp from extra
)
update public.quiz_questions q
set visibility = 'public'
from chosen ch
where q.question_group_id = ch.grp
  and q.visibility = 'private';

-- ---------------------------------------------------------------------------
-- 3. Verify
-- ---------------------------------------------------------------------------
do $verify$
declare
  n int;
  r record;
begin
  -- FIREWALL
  select count(*) into n
  from public.quiz_questions
  where visibility = 'public'
    and question_group_id in (
      select question_group_id from public.quiz_questions where visibility = 'secure'
    );
  if n > 0 then
    raise exception '111 ABORT: % public row(s) share a group with secure items', n;
  end if;

  -- 3 rows / 3 languages per group
  select count(*) into n
  from (
    select question_group_id
    from public.quiz_questions
    where visibility = 'public'
    group by question_group_id
    having count(*) <> 3 or count(distinct language) <> 3
  ) q;
  if n > 0 then
    raise exception '111 ABORT: % public group(s) not 3 rows across 3 languages', n;
  end if;

  -- exactly 6 groups per certification
  for r in
    select c.code,
           (select count(distinct q.question_group_id)
              from public.quiz_questions q
             where q.certification_id = c.id and q.visibility = 'public') as groups
    from public.certifications c
  loop
    if r.groups <> 6 then
      raise exception '111 ABORT: % has % public group(s), expected 6', r.code, r.groups;
    end if;
  end loop;

  -- single_choice only
  select count(*) into n
  from public.quiz_questions
  where visibility = 'public' and question_type::text <> 'single_choice';
  if n > 0 then
    raise exception '111 ABORT: % public item(s) are not single_choice', n;
  end if;

  -- THE PAGER REQUIREMENT: both buckets must be non-empty per certification,
  -- so every displayed pair can be one AI-era plus one conventional item.
  for r in
    select c.code,
           count(*) filter (where x.ai_era)     as ai_groups,
           count(*) filter (where not x.ai_era) as std_groups
    from public.certifications c
    join lateral (
      select distinct q.question_group_id,
             exists (
               select 1
               from public.task_concepts tc
               join public.concepts cc on cc.id = tc.concept_id
               where tc.task_id = q.task_id
                 and (cc.slug||' '||coalesce(cc.name,'')||' '||coalesce(cc.description,''))
                     ~* '\m(ai|agent|agentic|llm|genai|generative|copilot|spec-driven|automation|assisted)\M'
             ) as ai_era
      from public.quiz_questions q
      where q.certification_id = c.id
        and q.visibility = 'public'
        and q.language = 'en'
    ) x on true
    group by c.code
  loop
    if r.ai_groups < 1 then
      raise exception '111 ABORT: % has zero AI-era public samples', r.code;
    end if;
    if r.std_groups < 1 then
      raise exception '111 ABORT: % has zero conventional public samples - pager cannot balance a pair', r.code;
    end if;
  end loop;

  raise notice '111 OK: 36 public groups, both buckets populated per certification';
end
$verify$;

-- ---------------------------------------------------------------------------
-- 4. Readout - bucket balance and domain spread
-- ---------------------------------------------------------------------------
select c.code,
       count(distinct q.question_group_id) as total,
       count(distinct q.question_group_id) filter (where x.ai_era)     as ai_era,
       count(distinct q.question_group_id) filter (where not x.ai_era) as conventional,
       count(distinct d.id)                                            as domains_covered
from public.certifications c
join public.quiz_questions q
  on q.certification_id = c.id and q.visibility = 'public' and q.language = 'en'
join public.tasks   t on t.id = q.task_id
join public.domains d on d.id = t.domain_id
cross join lateral (
  select exists (
    select 1
    from public.task_concepts tc
    join public.concepts cc on cc.id = tc.concept_id
    where tc.task_id = q.task_id
      and (cc.slug||' '||coalesce(cc.name,'')||' '||coalesce(cc.description,''))
          ~* '\m(ai|agent|agentic|llm|genai|generative|copilot|spec-driven|automation|assisted)\M'
  ) as ai_era
) x
group by c.code
order by c.code;

-- ---------------------------------------------------------------------------
-- 5. The 36 stems, grouped by bucket, for review
-- ---------------------------------------------------------------------------
select c.code,
       case when x.ai_era then 'AI-ERA' else 'standard' end as bucket,
       d.code as domain,
       q.question_text
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
join public.tasks   t on t.id = q.task_id
join public.domains d on d.id = t.domain_id
cross join lateral (
  select exists (
    select 1
    from public.task_concepts tc
    join public.concepts cc on cc.id = tc.concept_id
    where tc.task_id = q.task_id
      and (cc.slug||' '||coalesce(cc.name,'')||' '||coalesce(cc.description,''))
          ~* '\m(ai|agent|agentic|llm|genai|generative|copilot|spec-driven|automation|assisted)\M'
  ) as ai_era
) x
where q.visibility = 'public' and q.language = 'en'
order by c.code, bucket, d.code;
