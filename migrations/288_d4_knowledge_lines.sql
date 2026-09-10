-- 288: D4's knowledge lines, before module 4 is authored
--
-- Four defects found by the pre-authoring recon, in four tasks and three
-- concepts. SEVEN STATEMENTS, NOT FOUR - and the difference is the finding.
--
-- THE SWEEP FOUND A FIFTH SITE, IN A DIFFERENT DOMAIN. The 2017 phrase "to best
-- achieve goals and missions" is in task 4.4 AND in the concept
-- `product-backlog-ordering`, which belongs to D1 TASK 1.2 - the task migration
-- 283 rewrote and whose concept set jta/SM-AI-II_JTA_v1.4.md section 8.1
-- explicitly reviewed and kept. It survived that review, and it would have
-- survived this one too if the sweep had been scoped to D4.
--
-- 285's third guard is the reason this was caught, re-aimed. That guard scanned
-- for the D2 and D3 phrasings; nothing scanned for these. A guard that only
-- covers the phrasings you already knew about is a guard against repetition,
-- not against recurrence.
--
-- ============================================================================
-- WHAT WAS WRONG, verified by grep against reference/scrum-guide-2020.txt
-- ============================================================================
--
--   4.4 AND product-backlog-ordering CARRY 2017 TEXT.
--   "The Product Owner orders items to best achieve goals and missions."
--   grep -oi "best achieve goals"  -> 0
--   grep -oi "goals and missions"  -> 0
--   Neither phrase is in the 2020 Guide. It is the 2017 wording. The 2020
--   edition reduces it to one bullet - "Ordering Product Backlog items;" - with
--   NO criterion attached at all.
--
--   This is load-bearing for the task. 4.4 diagnoses "ordering that no longer
--   reflects value", and the 2020 Guide never says ordering should reflect
--   value. The knowledge line's own second half already said "the Guide does
--   not define value", which its first half contradicted by importing a
--   criterion the Guide dropped. The line argued with itself.
--
--   4.6 AND risk-containment CARRY THE DEFECT 285 ALREADY FIXED IN 2.4.
--   "the Sprint bounds risk to one Sprint" / "The Sprint bounds risk to one
--   calendar month of cost." That is task 2.4's retired wording, and the same
--   replacement applies: the Guide's sentence is about SHORTER Sprints, not
--   about the Sprint as such - "Shorter Sprints can be employed to generate
--   more learning cycles and limit risk of cost and effort to a smaller time
--   frame." The correction landed in D2 on 2026-09-10 and the identical claim
--   sat in D4 in a task and a concept.
--
--   4.1 HARDENS THE GUIDE, AND HARDENS A LEVEL I FLOOR THAT WAS CORRECT.
--   "it is not a presentation" against the Guide's "The Sprint Review is a
--   working session and the Scrum Team SHOULD AVOID LIMITING IT TO a
--   presentation." A should-avoid-limiting stated as an is-not - the same
--   should/must class as 3.7. SM-AI-I 03-04 states it correctly, so this is
--   the inverse of the 3.2 case: there Level I was inconsistent and Level II
--   took the wrong half; here Level I is right and the Level II task hardened
--   it.
--
--   4.2 AND transparency DROP BOTH THE SUBJECT AND THE MODAL.
--   "Low transparency leads to decisions that diminish value" against
--   "ARTIFACTS THAT HAVE low transparency CAN lead to decisions that diminish
--   value AND INCREASE RISK." The same subject-drop corrected in lesson 03-03
--   on 2026-09-10, three commits before this one, in a different row.
--
-- 4.2's second clause becomes checkable rather than asserted. "Scrum prescribes
-- no metric" is true - grep -oi metric -> 0 - and the replacement names the
-- searched term so the next reader re-runs the check instead of trusting it,
-- which is section 0.1's standing rule since the Guide became a local file.
--
-- NO SCHEMA CHANGE. NO bloom_level touched, so v_cognitive_profile does not
-- move and exam_blueprint needs no re-derivation. The JTA version is not
-- bumped; v1.4's snapshot froze these lines and that is the record of what v1.4
-- was.
--
-- NONE OF THE SEVEN NEW STRINGS CONTAINS AN APOSTROPHE.
--
-- Run in the Supabase SQL editor. Seven statements, then three guards.
-- ============================================================================


-- 1. task 4.1 - the Guide's modal restored
update public.tasks t
set knowledge = 'The Sprint Review is a working session and the Scrum Team should avoid limiting it to a presentation; the Product Backlog may also be adjusted to meet new opportunities'
from public.certifications c, public.domains d
where t.certification_id = c.id and t.domain_id = d.id
  and c.code = 'SM-AI-II' and d.code = 'D4' and t.code = '4.1';

-- 2. task 4.2 - subject and modal restored, and the absence names its term
update public.tasks t
set knowledge = 'Artifacts that have low transparency can lead to decisions that diminish value and increase risk; the word metric does not appear in the Guide'
from public.certifications c, public.domains d
where t.certification_id = c.id and t.domain_id = d.id
  and c.code = 'SM-AI-II' and d.code = 'D4' and t.code = '4.2';

-- 3. task 4.4 - the 2017 criterion removed, and the line stops contradicting itself
update public.tasks t
set knowledge = 'Ordering Product Backlog items is one of the four Product Backlog management accountabilities the Guide gives the Product Owner, and the Guide attaches no criterion to the ordering and does not define value'
from public.certifications c, public.domains d
where t.certification_id = c.id and t.domain_id = d.id
  and c.code = 'SM-AI-II' and d.code = 'D4' and t.code = '4.4';

-- 4. task 4.6 - 285's replacement, applied to the second site
update public.tasks t
set knowledge = 'Scrum artifacts and progress toward agreed goals must be inspected frequently and diligently; Sprint length limits risk of cost and effort to a smaller time frame'
from public.certifications c, public.domains d
where t.certification_id = c.id and t.domain_id = d.id
  and c.code = 'SM-AI-II' and d.code = 'D4' and t.code = '4.6';

-- 5. product-backlog-ordering - THE D1 SITE, on task 1.2
update public.concepts co
set description = 'Ordering Product Backlog items is one of the four Product Backlog management accountabilities the Guide gives the Product Owner. The Guide attaches no criterion to the ordering.'
from public.certifications c
where co.certification_id = c.id and c.code = 'SM-AI-II'
  and co.slug = 'product-backlog-ordering';

-- 6. risk-containment
update public.concepts co
set description = 'Sprint length limits risk of cost and effort to a smaller time frame.'
from public.certifications c
where co.certification_id = c.id and c.code = 'SM-AI-II'
  and co.slug = 'risk-containment';

-- 7. transparency
update public.concepts co
set description = 'The emergent process and work must be visible to those performing the work as well as those receiving it; artifacts that have low transparency can lead to decisions that diminish value and increase risk.'
from public.certifications c
where co.certification_id = c.id and c.code = 'SM-AI-II'
  and co.slug = 'transparency';


-- ============================================================================
-- GUARD 1 - the four rewritten tasks, and the five D4 tasks that must not move.
-- Named rows, not a count: a total of five unchanged would pass on the wrong
-- five.
-- ============================================================================
do $$
declare bad text;
begin
  select string_agg(t.code, ', ' order by t.code) into bad
  from public.tasks t
  join public.domains d on d.id = t.domain_id
  join public.certifications c on c.id = t.certification_id
  where c.code = 'SM-AI-II' and d.code = 'D4'
    and (   (t.code = '4.1' and t.knowledge not like '%should avoid limiting it to a presentation%')
         or (t.code = '4.2' and t.knowledge not like 'Artifacts that have low transparency can%')
         or (t.code = '4.4' and t.knowledge not like '%attaches no criterion%')
         or (t.code = '4.6' and t.knowledge not like '%Sprint length limits risk%')
         or (t.code = '4.3' and t.knowledge not like '%against which progress is measured')
         or (t.code = '4.5' and t.knowledge not like '%usable step toward the Product Goal%')
         or (t.code = '4.7' and t.knowledge not like '%where each commitment originates')
         or (t.code = '4.8' and t.knowledge not like '%plan by and for the Developers%')
         or (t.code = '4.9' and t.knowledge not like '%adaptation must follow inspection'));
  if bad is not null then
    raise exception 'D4 knowledge check failed'
      using detail = 'tasks: ' || bad,
            hint = 'four rewritten, five must be untouched';
  end if;
end $$;


-- ============================================================================
-- GUARD 2 - the three rewritten concepts, and D1 1.2's other two, which this
-- migration reaches into D1 to fix and must not disturb further.
-- ============================================================================
do $$
declare bad text;
begin
  select string_agg(co.slug, ', ' order by co.slug) into bad
  from public.concepts co
  join public.certifications c on c.id = co.certification_id
  where c.code = 'SM-AI-II'
    and (   (co.slug = 'product-backlog-ordering' and co.description not like '%attaches no criterion%')
         or (co.slug = 'risk-containment'         and co.description not like 'Sprint length limits risk%')
         or (co.slug = 'transparency'             and co.description not like '%increase risk.')
         or (co.slug = 'developer-sizing-authority' and co.description not like '%responsible for the sizing%')
         or (co.slug = 'sprint-goal-as-commitment'  and co.description not like '%selected scope.'));
  if bad is not null then
    raise exception 'D4 concept check failed'
      using detail = 'concepts: ' || bad,
            hint = 'three rewritten, D1 1.2 siblings untouched';
  end if;
end $$;


-- ============================================================================
-- GUARD 3 - 285's sweep, RE-AIMED AND WIDENED. Every task knowledge and every
-- concept description in the certification, not just the edited rows and not
-- just D4.
--
-- THIS IS THE GUARD THAT SHOULD HAVE CAUGHT 4.6 AND COULD NOT. 285's version
-- listed the phrasings 285 was retiring. A guard scoped to the phrasings you
-- already found tells you your fix landed; it does not tell you the same claim
-- is sitting in a domain you were not looking at. The 2017 ordering phrase was
-- in D1 the whole time.
-- ============================================================================
do $$
declare n int;
declare pat text := '(best achieve goals|goals and missions|bounds risk|bounding risk|risk to one Sprint|risk to one calendar|it is not a presentation|[Ll]ow transparency leads)';
begin
  select count(*) into n
  from public.tasks t
  join public.certifications c on c.id = t.certification_id
  where c.code = 'SM-AI-II' and t.knowledge ~ pat;
  if n > 0 then
    raise exception 'retired phrasing survives in tasks'
      using detail = n || ' task(s) still match',
            hint = 'scope the sweep to the certification, not to the domain you edited';
  end if;

  select count(*) into n
  from public.concepts co
  join public.certifications c on c.id = co.certification_id
  where c.code = 'SM-AI-II' and co.description ~ pat;
  if n > 0 then
    raise exception 'retired phrasing survives in concepts'
      using detail = n || ' concept(s) still match',
            hint = 'scope the sweep to the certification, not to the domain you edited';
  end if;
end $$;


-- Read, not asserted: the seven rows as they now stand.
select 'task' as kind, t.code as id, t.knowledge as text
from public.tasks t
join public.domains d on d.id = t.domain_id
join public.certifications c on c.id = t.certification_id
where c.code = 'SM-AI-II' and d.code = 'D4' and t.code in ('4.1','4.2','4.4','4.6')
union all
select 'concept', co.slug, co.description
from public.concepts co
join public.certifications c on c.id = co.certification_id
where c.code = 'SM-AI-II'
  and co.slug in ('product-backlog-ordering','risk-containment','transparency')
order by kind, id;
