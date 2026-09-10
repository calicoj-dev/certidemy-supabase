-- 287_task_3_8_knowledge.sql
--
-- SM-AI-II task 3.8's knowledge line: the section hedge comes out, and a fact
-- the local Scrum Guide made findable goes in.
--
-- ============================================================================
-- THIS ONE WAS APPLIED THROUGH cert.yml, NOT THROUGH THIS FILE.
-- ============================================================================
--
-- content/sm-ai-ii/cert.yml declares itself the source of truth and the database
-- a projection of it - "Edit here, run the importer, never the reverse." Every
-- D3 change before this one went the other way: SQL editor first, cert.yml
-- second, drift closed by hand. This one ran
--
--   cert.yml -> npm run content:plan -> npm run content:apply -- --apply
--
-- and the planner reported exactly one operation: `update task 3.8 (knowledge)`.
--
-- SO STATEMENT 1 BELOW IS EXPECTED TO REPORT **UPDATE 0**, and that is the
-- proof rather than a failure. Its where clause requires the OLD text to still
-- be present; the importer has already replaced it. If the importer were ever
-- skipped, the same statement writes the value instead. A migration that races
-- the declared path would be a second writer; this one verifies it.
--
-- ============================================================================
-- WHAT CHANGED, AND WHY THE HEDGE EXISTED
-- ============================================================================
--
-- WAS: "The Guide recommends teams on one product share a Product Owner, and
--       says nothing IN THE PRODUCT OWNER OR SCRUM TEAM SECTIONS about how that
--       attention is apportioned"
--
-- NOW: "The Guide recommends teams on one product share a Product Owner and
--       says nothing anywhere about how that attention is divided between them;
--       its only requirement across such teams is a shared Definition of Done"
--
-- THE SECTION HEDGE WAS HONEST AND IS NO LONGER NECESSARY. Migration 286 and
-- STYLE-GUIDE-SM-AI-II.md section 0.1 record why it was there: every Guide
-- verification went through a URL fetch answered by a summarizer, which cannot
-- establish an absence. Naming the two sections read was what made the claim
-- checkable - a reader could disprove it by pointing at a section nobody read.
--
-- The Guide is now a local file at reference/scrum-guide-2020.txt, 4,050 words,
-- CC BY-SA 4.0, with its provenance and four verification checks in
-- reference/README.md. An absence is now a positive result over a bounded
-- corpus:
--
--   grep -ci attention  reference/scrum-guide-2020.txt   ->  0
--
-- and the one occurrence of "capacity" is about the Developers' upcoming
-- capacity at Sprint Planning, not a Product Owner's.
--
-- THE ADDED CLAUSE IS THE PART THAT MAKES THE LINE BETTER RATHER THAN SHORTER.
-- Grepping the whole document for multi-team language returns three sentences
-- and only three:
--
--   "If Scrum Teams become too large, they should consider reorganizing into
--    multiple cohesive Scrum Teams, each focused on the same product."
--   "Therefore, they should share the same Product Goal, Product Backlog, and
--    Product Owner."
--   "If there are multiple Scrum Teams working together on a product, they must
--    mutually define and comply with the same Definition of Done."
--
-- THE THIRD IS A **must**, AND IT IS NOT SCOPED TO THE TOO-LARGE CASE. It opens
-- on the general condition - "If there are multiple Scrum Teams working together
-- on a product" - where the Product Owner sentence is a "should" reachable only
-- through a reorganization. So the Guide knows how to require something of
-- several teams on one product, and for the Product Owner it chose not to.
--
-- That silence is a choice rather than an oversight, which is exactly what a
-- Level II task wants, and it is also the evidence that migration 285's
-- correction to task 3.7 was right. 3.7 was rewritten from "One product has one
-- Product Backlog, one Product Goal and one Product Owner" to "The Guide
-- recommends that..." on the argument that a "should" had been stated as a rule.
-- The should/must contrast was found afterwards and confirms it.
--
-- Recorded in jta/SM-AI-II_JTA_v1.4.md section 8.5.
--
-- NO SCHEMA CHANGE. NO bloom_level touched, so v_cognitive_profile does not
-- move and exam_blueprint needs no re-derivation.
--
-- THE JTA VERSION IS NOT BUMPED. v1.4's snapshot froze 3.8's previous wording
-- and that stands as the record of what v1.4 was. A knowledge-line correction
-- of this size does not warrant a fifth row before module 3 is authored; the
-- next bump collects this with whatever module 3 finds.
--
-- Run in the Supabase SQL editor. Three statements, in order.
-- ============================================================================


-- ============================================================================
-- STATEMENT 1 - task 3.8. EXPECT UPDATE 0 if content:apply has already run,
-- which is the intended path. UPDATE 1 means the importer was skipped.
-- Either way the guards below must pass.
-- ============================================================================

update public.tasks t
set knowledge = 'The Guide recommends teams on one product share a Product Owner and says nothing anywhere about how that attention is divided between them; its only requirement across such teams is a shared Definition of Done'
from public.certifications c, public.domains d
where t.certification_id = c.id and t.domain_id = d.id
  and c.code = 'SM-AI-II' and d.code = 'D3' and t.code = '3.8'
  and t.knowledge <> 'The Guide recommends teams on one product share a Product Owner and says nothing anywhere about how that attention is divided between them; its only requirement across such teams is a shared Definition of Done';


-- ============================================================================
-- GUARD 1 - both directions on the two tasks this change touches and leans on.
--
-- 3.8 must read the new line. 3.7 MUST STILL READ "The Guide recommends that" -
-- named explicitly because this correction's argument rests on 3.7's, and a
-- sweep that touched 3.7 while fixing 3.8 would quietly remove the thing 3.8
-- now depends on. That is the negative half, and it is a named row rather than
-- a count.
-- ============================================================================

do $$
declare bad text;
begin
  select string_agg(t.code, ', ' order by t.code) into bad
  from public.tasks t
  join public.domains d on d.id = t.domain_id
  join public.certifications c on c.id = t.certification_id
  where c.code = 'SM-AI-II' and d.code = 'D3'
    and (   (t.code = '3.8' and t.knowledge not like '%shared Definition of Done')
         or (t.code = '3.8' and t.knowledge not like '%says nothing anywhere%')
         or (t.code = '3.7' and t.knowledge not like 'The Guide recommends that%'));
  if bad is not null then
    raise exception 'D3 3.7/3.8 check failed'
      using detail = 'tasks: ' || bad,
            hint = '3.8 rewritten, 3.7 must still read The Guide recommends that';
  end if;
end $$;


-- ============================================================================
-- GUARD 2 - the sweep, as 285's third guard did it. The retired phrasing must
-- be gone from EVERY task and EVERY concept of this certification, not just
-- from the row that was edited.
--
-- 285 earned this: the same quotation drift sat in four places and the recon
-- found two. A correction applied to one site looks correct at that site.
-- ============================================================================

do $$
declare n int;
begin
  select count(*) into n
  from public.tasks t
  join public.certifications c on c.id = t.certification_id
  where c.code = 'SM-AI-II'
    and t.knowledge ~ '(in the Product Owner or Scrum Team sections|attention is apportioned|not divisible)';
  if n > 0 then
    raise exception 'retired 3.8 phrasing survives in tasks'
      using detail = n || ' task(s) still match',
            hint = 'a fix applied to one site looks correct at that site';
  end if;

  select count(*) into n
  from public.concepts co
  join public.certifications c on c.id = co.certification_id
  where c.code = 'SM-AI-II'
    and co.description ~ '(in the Product Owner or Scrum Team sections|attention is apportioned|not divisible)';
  if n > 0 then
    raise exception 'retired 3.8 phrasing survives in concepts'
      using detail = n || ' concept(s) still match',
            hint = 'a fix applied to one site looks correct at that site';
  end if;
end $$;


-- ============================================================================
-- PROOF - read, not asserted. Expect 3.7 unchanged and 3.8 rewritten.
-- ============================================================================

select t.code, t.knowledge
from public.tasks t
join public.domains d on d.id = t.domain_id
join public.certifications c on c.id = t.certification_id
where c.code = 'SM-AI-II' and d.code = 'D3' and t.code in ('3.7', '3.8')
order by t.code;
