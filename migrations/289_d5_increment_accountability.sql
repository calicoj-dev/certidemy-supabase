-- 289: who is accountable for the Increment
--
-- FIVE STATEMENTS: three D5 tasks, one D5 concept, and ONE D2 CONCEPT the
-- domain-scoped recon did not look at.
--
-- ============================================================================
-- THE DEFECT
-- ============================================================================
--
-- The 2020 Guide assigns the Increment to the Scrum Team and gives the
-- Developers a different verb:
--
--   "The entire Scrum Team is accountable for creating a valuable, useful
--    Increment every Sprint."
--   "Developers are the people in the Scrum Team that are COMMITTED TO creating
--    any aspect of a usable Increment each Sprint."
--
-- And the Developers' own always-accountable-for list is four items, with the
-- Increment not among them: creating a plan for the Sprint, instilling quality
-- by adhering to a Definition of Done, adapting their plan each day toward the
-- Sprint Goal, and holding each other accountable as professionals.
--
-- Five sites said the Developers are accountable for the Increment.
--
-- THIS IS TASK 3.2'S DEFECT, WHICH MIGRATION 285 FIXED IN D3, SURVIVING IN D5.
-- There it was self-management attributed to the Developers where the Guide
-- gives it to the Scrum Team; here it is the Increment. Same shape, same
-- direction, different noun.
--
-- IT IS LOAD-BEARING FOR 5.3. That task's entire subject is who is accountable
-- when a model wrote the code, and a lesson keying "the Developers are
-- accountable" would assert something the Guide does not say in the one task
-- about accountability. The rewrites keep BOTH verbs rather than flattening to
-- one, because the distinction is 5.3's subject: the Scrum Team is accountable,
-- the Developers are committed to creating any aspect of it.
--
-- SM-AI-I 06-01 ALREADY HAS IT RIGHT - "a single team of people accountable for
-- creating a valuable Increment each Sprint" - so this is Level II hardening a
-- correct Level I floor, the same inversion as task 4.1's presentation defect
-- in migration 288.
--
-- ============================================================================
-- THE FIFTH SITE, AND WHY THE SWEEP IS SCOPED TO THE CERTIFICATION
-- ============================================================================
--
-- `developer-accountability` belongs to D2 TASK 2.6. The recon that found this
-- was reading D5. A sweep scoped to D5 finds four sites; scoped to the
-- certification it finds five. That is the second time in two migrations - 288
-- found the 2017 ordering phrase in D1 while correcting D4.
--
-- MODULES 2 AND 3 WERE AUTHORED AGAINST THAT DEFECTIVE CONCEPT AND DID NOT
-- INHERIT IT. Every lesson mention reads "accountable for creating a plan for
-- the Sprint" or "accountable for the Sprint's plan", which is the Guide's own
-- list. The lesson authors reached past the concept description to the Guide.
-- That is luck rather than method, and it is why the concept is corrected here
-- rather than left as harmless.
--
-- `absence-handling` MUST NOT BE TOUCHED. Its sentence - "The Developers are
-- accountable for creating a plan for the Sprint" - names only the first item
-- of the four and is correct. It matches the same search and is not the same
-- defect. Guard 2 names it.
--
-- NO SCHEMA CHANGE. NO bloom_level touched. No JTA version bump; v1.5 is
-- deferred to the end of module 5 by the decision recorded in migration 288.
--
-- NONE OF THE FIVE NEW STRINGS CONTAINS AN APOSTROPHE.
--
-- Run in the Supabase SQL editor. Five statements, then three guards.
-- ============================================================================


-- 1. task 5.3 - both verbs, because the distinction is the task
update public.tasks t
set knowledge = 'The entire Scrum Team is accountable for creating a valuable, useful Increment every Sprint; the Developers are committed to creating any aspect of a usable Increment each Sprint, and the three Scrum accountabilities are held by people'
from public.certifications c, public.domains d
where t.certification_id = c.id and t.domain_id = d.id
  and c.code = 'SM-AI-II' and d.code = 'D5' and t.code = '5.3';

-- 2. task 5.6
update public.tasks t
set knowledge = 'The Developers instil quality by adhering to the Definition of Done and are committed to creating any aspect of a usable Increment each Sprint; the entire Scrum Team is accountable for the Increment'
from public.certifications c, public.domains d
where t.certification_id = c.id and t.domain_id = d.id
  and c.code = 'SM-AI-II' and d.code = 'D5' and t.code = '5.6';

-- 3. task 5.9
update public.tasks t
set knowledge = 'The Developers are always accountable for instilling quality by adhering to the Definition of Done; the entire Scrum Team is accountable for creating a valuable, useful Increment'
from public.certifications c, public.domains d
where t.certification_id = c.id and t.domain_id = d.id
  and c.code = 'SM-AI-II' and d.code = 'D5' and t.code = '5.9';

-- 4. developer-accountability-for-generated-work  (D5, task 5.3)
update public.concepts co
set description = 'The Developers are committed to creating any aspect of a usable Increment regardless of what produced the work in it, and the entire Scrum Team is accountable for the Increment either way.'
from public.certifications c
where co.certification_id = c.id and c.code = 'SM-AI-II'
  and co.slug = 'developer-accountability-for-generated-work';

-- 5. developer-accountability  (D2, task 2.6 - THE SITE THE D5 RECON DID NOT SEE)
update public.concepts co
set description = 'The Developers are always accountable for creating a plan for the Sprint, instilling quality, adapting the plan each day and holding each other accountable; the entire Scrum Team is accountable for the Increment.'
from public.certifications c
where co.certification_id = c.id and c.code = 'SM-AI-II'
  and co.slug = 'developer-accountability';


-- ============================================================================
-- GUARD 1 - the three rewritten D5 tasks, and the six that must not move.
-- Named rows, not a count.
-- ============================================================================
do $$
declare bad text;
begin
  select string_agg(t.code, ', ' order by t.code) into bad
  from public.tasks t
  join public.domains d on d.id = t.domain_id
  join public.certifications c on c.id = t.certification_id
  where c.code = 'SM-AI-II' and d.code = 'D5'
    and (   (t.code = '5.3' and t.knowledge not like 'The entire Scrum Team is accountable%')
         or (t.code = '5.6' and t.knowledge not like '%entire Scrum Team is accountable for the Increment')
         or (t.code = '5.9' and t.knowledge not like '%valuable, useful Increment')
         or (t.code = '5.1' and t.knowledge not like '%above an organizational floor')
         or (t.code = '5.2' and t.knowledge not like '%the Increment must be usable')
         or (t.code = '5.4' and t.knowledge not like '%independent of what produced the numbers')
         or (t.code = '5.5' and t.knowledge not like '%ownership follows from participation')
         or (t.code = '5.7' and t.knowledge not like '%volume is not a Scrum measure')
         or (t.code = '5.8' and t.knowledge not like '%inspection without transparency is misleading'));
  if bad is not null then
    raise exception 'D5 knowledge check failed'
      using detail = 'tasks: ' || bad,
            hint = 'three rewritten, six must be untouched';
  end if;
end $$;


-- ============================================================================
-- GUARD 2 - the two rewritten concepts, and absence-handling, which matches the
-- same search and is CORRECT. It names only "creating a plan for the Sprint",
-- which is the first of the Developers' four. A sweep that fixed it would be
-- the over-application the negative half exists to catch.
-- ============================================================================
do $$
declare bad text;
begin
  select string_agg(co.slug, ', ' order by co.slug) into bad
  from public.concepts co
  join public.certifications c on c.id = co.certification_id
  where c.code = 'SM-AI-II'
    and (   (co.slug = 'developer-accountability-for-generated-work' and co.description not like 'The Developers are committed to creating any aspect%')
         or (co.slug = 'developer-accountability' and co.description not like '%entire Scrum Team is accountable for the Increment.')
         or (co.slug = 'absence-handling' and co.description not like '%does not depend on who is present.')
         or (co.slug = 'tool-non-accountability' and co.description not like 'Scrum accountabilities are held by%')
         or (co.slug = 'quality-adherence' and co.description not like '%adhering to the Definition of Done.'));
  if bad is not null then
    raise exception 'D5 concept check failed'
      using detail = 'concepts: ' || bad,
            hint = 'two rewritten; absence-handling and the 5.3/5.6 siblings untouched';
  end if;
end $$;


-- ============================================================================
-- GUARD 3 - 285's sweep, re-aimed and scoped to the CERTIFICATION.
--
-- This is the guard that found the D2 site. A guard listing only the phrasings
-- of the domain you are editing tells you your fix landed; it does not tell you
-- the same claim is sitting in a domain you were not reading.
--
-- The pattern deliberately excludes "accountable for creating a plan", which is
-- the Guide's own wording and appears correctly in absence-handling and in
-- three authored lessons.
-- ============================================================================
do $$
declare n int;
declare pat text := '([Dd]evelopers are accountable for (a|the) usable Increment|[Dd]evelopers are accountable for the Increment|accountable for .{0,30}and a usable Increment)';
begin
  select count(*) into n
  from public.tasks t
  join public.certifications c on c.id = t.certification_id
  where c.code = 'SM-AI-II' and t.knowledge ~ pat;
  if n > 0 then
    raise exception 'retired Increment-accountability phrasing survives in tasks'
      using detail = n || ' task(s) still match',
            hint = 'scope the sweep to the certification, not to the domain you edited';
  end if;

  select count(*) into n
  from public.concepts co
  join public.certifications c on c.id = co.certification_id
  where c.code = 'SM-AI-II' and co.description ~ pat;
  if n > 0 then
    raise exception 'retired Increment-accountability phrasing survives in concepts'
      using detail = n || ' concept(s) still match',
            hint = 'scope the sweep to the certification, not to the domain you edited';
  end if;
end $$;


-- Read, not asserted.
select 'task' as kind, t.code as id, t.knowledge as text
from public.tasks t
join public.domains d on d.id = t.domain_id
join public.certifications c on c.id = t.certification_id
where c.code = 'SM-AI-II' and d.code = 'D5' and t.code in ('5.3','5.6','5.9')
union all
select 'concept', co.slug, co.description
from public.concepts co
join public.certifications c on c.id = co.certification_id
where c.code = 'SM-AI-II'
  and co.slug in ('developer-accountability','developer-accountability-for-generated-work','absence-handling')
order by kind, id;
