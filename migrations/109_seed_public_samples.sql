-- 109_seed_public_samples.sql
-- Certidemy - populate the public sample pool
--
-- THE GAP THIS FIXES
-- public.quiz_questions holds only 'private' and 'secure' rows. There is not a
-- single 'public' item in the catalogue, so get_public_samples() returns an
-- empty set for every certification in every language and the marketing sample
-- component renders nothing. Migration 108 made all six certifications visible
-- to anonymous visitors, which makes that gap user-facing.
--
-- SELECTION RULE
-- One question_group per domain per certification: 3 for AIE-I, 5 for AIGRM-I /
-- SD-AI-I / SM-AI-I / SPO-AI-I, 6 for AISM-I. 29 groups, 87 rows.
-- Chosen deterministically (lowest group uuid within each domain) so this
-- migration is reproducible and reviewable rather than random.
--
-- WHY question_group_id IS THE UNIT
-- A group holds exactly one row per language (en / es-419 / pt-BR). Promoting by
-- group therefore promotes all three translations together, so a Spanish or
-- Portuguese visitor sees the same sample question an English visitor sees.
-- Selecting per-row could publish an item in one language only.
--
-- FIREWALL
-- Promotion exposes correct_answer to anonymous users through
-- get_public_samples(), which is that function's purpose. It is safe ONLY for
-- practice items. This migration therefore:
--   * draws exclusively from visibility = 'private'
--   * excludes any group that has ANY sibling row marked 'secure'
--   * asserts, after the update, that zero secure rows became public
-- A secure item promoted here would be an unrecoverable exam-integrity breach,
-- so the assertion is a hard abort, not a warning.
--
-- Promoted items remain practice items and stay linked in question_concepts.
-- That is intentional: they are still valid practice, they are simply also
-- visible on the marketing page.
--
-- Idempotent: re-running re-selects the same groups and changes nothing.

-- ---------------------------------------------------------------------------
-- 1. Promote
-- ---------------------------------------------------------------------------
with cand as (
  select
    d.certification_id,
    d.id   as domain_id,
    q.question_group_id
  from public.quiz_questions q
  join public.tasks   t on t.id = q.task_id
  join public.domains d on d.id = t.domain_id
  where q.visibility = 'private'
    and q.language   = 'en'
    and q.question_type::text = 'single_choice'
    and q.question_group_id is not null
    -- never touch a group with any secure sibling
    and not exists (
      select 1
      from public.quiz_questions s
      where s.question_group_id = q.question_group_id
        and s.visibility = 'secure'
    )
    -- group must carry all three languages
    and (
      select count(distinct l.language)
      from public.quiz_questions l
      where l.question_group_id = q.question_group_id
    ) = 3
),
chosen as (
  select distinct on (domain_id)
    domain_id,
    question_group_id
  from cand
  order by domain_id, question_group_id
)
update public.quiz_questions q
set visibility = 'public'
from chosen ch
where q.question_group_id = ch.question_group_id
  and q.visibility = 'private';

-- ---------------------------------------------------------------------------
-- 2. Verify - firewall first, then completeness
-- ---------------------------------------------------------------------------
do $verify$
declare
  n int;
  n_domains int;
  n_groups int;
  r record;
begin
  -- FIREWALL: no secure item may have become public
  select count(*) into n
  from public.quiz_questions
  where visibility = 'public'
    and question_group_id in (
      select question_group_id from public.quiz_questions where visibility = 'secure'
    );
  if n > 0 then
    raise exception '109 ABORT: % public row(s) share a group with secure items', n;
  end if;

  -- every public group must carry exactly 3 rows, one per language
  select count(*) into n
  from (
    select question_group_id
    from public.quiz_questions
    where visibility = 'public'
    group by question_group_id
    having count(*) <> 3 or count(distinct language) <> 3
  ) q;
  if n > 0 then
    raise exception '109 ABORT: % public group(s) are not 3 rows across 3 languages', n;
  end if;

  -- one public group per domain, per certification
  for r in
    select c.code,
           (select count(*) from public.domains d where d.certification_id = c.id) as domains,
           (select count(distinct q.question_group_id)
              from public.quiz_questions q
              join public.tasks t   on t.id = q.task_id
              join public.domains d on d.id = t.domain_id
             where d.certification_id = c.id
               and q.visibility = 'public') as groups
    from public.certifications c
  loop
    if r.groups <> r.domains then
      raise exception '109 ABORT: % has % domain(s) but % public group(s)',
        r.code, r.domains, r.groups;
    end if;
  end loop;

  -- all public items must be single_choice, or get_public_samples filters them out
  select count(*) into n
  from public.quiz_questions
  where visibility = 'public'
    and question_type::text <> 'single_choice';
  if n > 0 then
    raise exception '109 ABORT: % public item(s) are not single_choice', n;
  end if;

  raise notice '109 OK: public sample pool seeded';
end
$verify$;

-- ---------------------------------------------------------------------------
-- 3. Readout - pool shape
-- ---------------------------------------------------------------------------
select c.code, q.language, q.visibility, count(*) as items
from public.certifications c
join public.quiz_questions q on q.certification_id = c.id
where q.visibility = 'public'
group by c.code, q.language, q.visibility
order by c.code, q.language;

-- ---------------------------------------------------------------------------
-- 4. End-to-end proof: exercise the actual function anon traffic hits,
--    in all three languages, for two certifications.
-- ---------------------------------------------------------------------------
select 'AIGRM-I' as code, 'en'     as lang, count(*) from public.get_public_samples('AIGRM-I','en')
union all
select 'AIGRM-I', 'es-419', count(*) from public.get_public_samples('AIGRM-I','es-419')
union all
select 'AIGRM-I', 'pt-BR',  count(*) from public.get_public_samples('AIGRM-I','pt-BR')
union all
select 'AISM-I',  'en',     count(*) from public.get_public_samples('AISM-I','en')
union all
select 'AISM-I',  'es-419', count(*) from public.get_public_samples('AISM-I','es-419')
union all
select 'AISM-I',  'pt-BR',  count(*) from public.get_public_samples('AISM-I','pt-BR')
order by 1, 2;

-- ---------------------------------------------------------------------------
-- 5. The actual sample text, for eyeball review before it goes on a public page
-- ---------------------------------------------------------------------------
select c.code, d.code as domain, q.question_text
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
join public.tasks t   on t.id = q.task_id
join public.domains d on d.id = t.domain_id
where q.visibility = 'public'
  and q.language = 'en'
order by c.code, d.code;
