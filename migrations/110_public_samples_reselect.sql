-- 110_public_samples_reselect.sql
-- Certidemy - restore the public sample tier properly
--
-- BACKGROUND
-- Migration 099 purged every quiz_questions row for the Bloom rebuild. The
-- regeneration restored the 'private' and 'secure' tiers but never restored
-- 'public', so the marketing sample pool sat empty until migration 109 seeded a
-- provisional one group per domain. This migration replaces that provisional
-- selection with the intended shape: six sample groups per certification,
-- spread across domains, with AI-era coverage guaranteed.
--
-- is_ai_era IS DERIVED, NOT STORED
-- get_public_samples() computes is_ai_era at query time by testing whether any
-- concept linked to the question's task matches
--   \m(ai|agent|agentic|llm|genai|generative|copilot|spec-driven|automation|assisted)\M
-- across slug + name + description. There is no column to flag. AI-era coverage
-- is therefore achieved by SELECTING items whose task carries AI concepts, and
-- this migration evaluates that identical predicate so the ranking here matches
-- what the function will report to the browser.
--
-- SELECTION RULE (deterministic and reproducible)
--   1. reset every current 'public' row back to 'private'
--   2. candidates: private, single_choice, group complete across all three
--      languages, and no sibling row anywhere in the group marked 'secure'
--   3. rank within each domain by: AI-era first, then applied scenario stems
--      over definitional ones (stem length as proxy), then group uuid
--   4. take the top item per domain  -> 3 for AIE-I, 5 for most, 6 for AISM-I
--   5. top up each certification to 6 with the best remaining candidates,
--      again AI-era first
-- Result: 36 groups, 108 rows (6 per cert x 3 languages).
--
-- FIREWALL
-- Public promotion exposes correct_answer to anonymous users via
-- get_public_samples(). Safe for practice items only. Any group containing a
-- 'secure' row is excluded at candidate time, and a post-update assertion
-- re-checks it as a hard abort.
--
-- Idempotent: the reset makes re-runs converge on the same 36 groups.

-- ---------------------------------------------------------------------------
-- 1. Reset the provisional selection
-- ---------------------------------------------------------------------------
update public.quiz_questions
set visibility = 'private'
where visibility = 'public';

-- ---------------------------------------------------------------------------
-- 2. Reselect
-- ---------------------------------------------------------------------------
with cand as (
  select
    d.certification_id            as cert_id,
    d.id                          as domain_id,
    q.question_group_id           as grp,
    length(q.question_text)       as stem_len,
    exists (
      select 1
      from public.task_concepts tc
      join public.concepts c on c.id = tc.concept_id
      where tc.task_id = t.id
        and (c.slug || ' ' || coalesce(c.name,'') || ' ' || coalesce(c.description,''))
            ~* '\m(ai|agent|agentic|llm|genai|generative|copilot|spec-driven|automation|assisted)\M'
    )                             as ai_era
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
ranked_in_domain as (
  select cand.*,
         row_number() over (
           partition by domain_id
           order by ai_era desc, (stem_len >= 120) desc, stem_len desc, grp
         ) as rn
  from cand
),
per_domain as (
  select cert_id, domain_id, grp from ranked_in_domain where rn = 1
),
needed as (
  select c.id as cert_id,
         6 - (select count(*) from per_domain p where p.cert_id = c.id) as n
  from public.certifications c
),
topup as (
  select cand.*,
         row_number() over (
           partition by cert_id
           order by ai_era desc, (stem_len >= 120) desc, stem_len desc, grp
         ) as rn2
  from cand
  where not exists (select 1 from per_domain p where p.grp = cand.grp)
),
extra as (
  select t.grp
  from topup t
  join needed n on n.cert_id = t.cert_id
  where n.n > 0 and t.rn2 <= n.n
),
chosen as (
  select grp from per_domain
  union
  select grp from extra
)
update public.quiz_questions q
set visibility = 'public'
from chosen ch
where q.question_group_id = ch.grp
  and q.visibility = 'private';

-- ---------------------------------------------------------------------------
-- 3. Verify - firewall, then shape, then AI-era coverage
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
    raise exception '110 ABORT: % public row(s) share a group with secure items', n;
  end if;

  -- every public group: 3 rows, 3 languages
  select count(*) into n
  from (
    select question_group_id
    from public.quiz_questions
    where visibility = 'public'
    group by question_group_id
    having count(*) <> 3 or count(distinct language) <> 3
  ) q;
  if n > 0 then
    raise exception '110 ABORT: % public group(s) not 3 rows across 3 languages', n;
  end if;

  -- six groups per certification
  for r in
    select c.code,
           (select count(distinct q.question_group_id)
              from public.quiz_questions q
             where q.certification_id = c.id and q.visibility = 'public') as groups
    from public.certifications c
  loop
    if r.groups <> 6 then
      raise exception '110 ABORT: % has % public group(s), expected 6', r.code, r.groups;
    end if;
  end loop;

  -- single_choice only, or get_public_samples filters them away
  select count(*) into n
  from public.quiz_questions
  where visibility = 'public' and question_type::text <> 'single_choice';
  if n > 0 then
    raise exception '110 ABORT: % public item(s) are not single_choice', n;
  end if;

  -- at least one AI-era sample per certification
  for r in
    select c.code,
           (select count(distinct q.question_group_id)
              from public.quiz_questions q
              join public.tasks t on t.id = q.task_id
             where q.certification_id = c.id
               and q.visibility = 'public'
               and q.language = 'en'
               and exists (
                 select 1
                 from public.task_concepts tc
                 join public.concepts cc on cc.id = tc.concept_id
                 where tc.task_id = t.id
                   and (cc.slug || ' ' || coalesce(cc.name,'') || ' ' || coalesce(cc.description,''))
                       ~* '\m(ai|agent|agentic|llm|genai|generative|copilot|spec-driven|automation|assisted)\M'
               )) as ai_groups
    from public.certifications c
  loop
    if r.ai_groups < 1 then
      raise exception '110 ABORT: % has zero AI-era public samples', r.code;
    end if;
  end loop;

  raise notice '110 OK: 36 public groups, 108 rows, AI-era coverage confirmed';
end
$verify$;

-- ---------------------------------------------------------------------------
-- 4. Readout - AI-era coverage per certification
-- ---------------------------------------------------------------------------
select c.code,
       count(distinct q.question_group_id) as public_groups,
       count(distinct q.question_group_id) filter (
         where exists (
           select 1
           from public.task_concepts tc
           join public.concepts cc on cc.id = tc.concept_id
           where tc.task_id = q.task_id
             and (cc.slug || ' ' || coalesce(cc.name,'') || ' ' || coalesce(cc.description,''))
                 ~* '\m(ai|agent|agentic|llm|genai|generative|copilot|spec-driven|automation|assisted)\M'
         )
       ) as ai_era_groups
from public.certifications c
join public.quiz_questions q
  on q.certification_id = c.id and q.visibility = 'public' and q.language = 'en'
group by c.code
order by c.code;

-- ---------------------------------------------------------------------------
-- 5. End-to-end through the function anon traffic actually hits
-- ---------------------------------------------------------------------------
select 'AIE-I'    as code, l as lang, (select count(*) from public.get_public_samples('AIE-I', l))    as n from unnest(array['en','es-419','pt-BR']) l
union all
select 'AIGRM-I',  l, (select count(*) from public.get_public_samples('AIGRM-I', l))  from unnest(array['en','es-419','pt-BR']) l
union all
select 'AISM-I',   l, (select count(*) from public.get_public_samples('AISM-I', l))   from unnest(array['en','es-419','pt-BR']) l
union all
select 'SD-AI-I',  l, (select count(*) from public.get_public_samples('SD-AI-I', l))  from unnest(array['en','es-419','pt-BR']) l
union all
select 'SM-AI-I',  l, (select count(*) from public.get_public_samples('SM-AI-I', l))  from unnest(array['en','es-419','pt-BR']) l
union all
select 'SPO-AI-I', l, (select count(*) from public.get_public_samples('SPO-AI-I', l)) from unnest(array['en','es-419','pt-BR']) l
order by 1, 2;

-- ---------------------------------------------------------------------------
-- 6. The 36 stems, with derived AI-era flag, for review
-- ---------------------------------------------------------------------------
select c.code,
       d.code as domain,
       exists (
         select 1
         from public.task_concepts tc
         join public.concepts cc on cc.id = tc.concept_id
         where tc.task_id = q.task_id
           and (cc.slug || ' ' || coalesce(cc.name,'') || ' ' || coalesce(cc.description,''))
               ~* '\m(ai|agent|agentic|llm|genai|generative|copilot|spec-driven|automation|assisted)\M'
       ) as ai_era,
       q.question_text
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
join public.tasks   t on t.id = q.task_id
join public.domains d on d.id = t.domain_id
where q.visibility = 'public' and q.language = 'en'
order by c.code, ai_era desc, d.code;
