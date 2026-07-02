-- 066_coverage_audit_views.sql
-- Traceability / coverage audit for the "no untaught testing" guarantee
-- (ISO 17024 §10 in the scheme docs). Cert-agnostic. Editor-first. Idempotent.
--
-- The credential's defensibility rests on a chain that is authored in two
-- independent places:
--     question --(question_concepts)--> concept <--(lesson_concepts)-- lesson
-- Practice items link to concepts; lessons tag concepts in frontmatter (wired
-- by wire-lessons.mjs). The guarantee "every tested concept is taught, and every
-- taught concept is reachable" is only TRUE if those two halves line up. These
-- views make that provable on demand rather than assumed.
--
-- Healthy state = zero rows from the two _gaps views. The _summary view is the
-- per-cert coverage snapshot for the governance dashboard.
--
-- NOTE ON THE SECURE FIREWALL: secure items deliberately carry NO
-- question_concepts links, so they are correctly invisible to these views. This
-- audit is about the PRACTICE/learning graph and its lesson coverage — exactly
-- what a learner (and an auditor) sees in review. Secure-pool blueprint coverage
-- is a separate guarantee enforced by the exam assembler.

-- ===========================================================================
-- 1. Concepts that are TESTED (a practice question links to them) but NOT
--    TAUGHT (no lesson tags them). These are "untaught testing" violations —
--    the thing 17024 §10 forbids. Expect zero rows.
-- ===========================================================================
create or replace view public.v_coverage_tested_not_taught as
select
  c.certification_id,
  c.id   as concept_id,
  c.slug as concept_slug,
  c.name as concept_name,
  count(distinct qc.question_id) as practice_questions
from public.concepts c
join public.question_concepts qc on qc.concept_id = c.id
left join public.lesson_concepts lc on lc.concept_id = c.id
where lc.concept_id is null
group by c.certification_id, c.id, c.slug, c.name;

comment on view public.v_coverage_tested_not_taught is
  'Concepts with practice questions but no lesson teaching them (untaught testing). Zero rows = 17024 no-untaught-testing guarantee holds.';

-- ===========================================================================
-- 2. Concepts that are TAUGHT (a lesson tags them) but have NO PRACTICE
--    questions yet. Not an integrity violation, but a content-completeness gap:
--    a taught concept the learner can't practice. Useful for the backfill queue
--    and for the dashboard's "content readiness" view.
-- ===========================================================================
create or replace view public.v_coverage_taught_not_tested as
select
  c.certification_id,
  c.id   as concept_id,
  c.slug as concept_slug,
  c.name as concept_name,
  count(distinct lc.lesson_id) as lessons_teaching
from public.concepts c
join public.lesson_concepts lc on lc.concept_id = c.id
left join public.question_concepts qc on qc.concept_id = c.id
where qc.concept_id is null
group by c.certification_id, c.id, c.slug, c.name;

comment on view public.v_coverage_taught_not_tested is
  'Concepts taught by a lesson but with no practice questions yet. Content-completeness gap (backfill queue), not an integrity violation.';

-- ===========================================================================
-- 3. Per-cert coverage summary — one row per certification, for the governance
--    dashboard. Every count is derived live, so it can never drift from truth.
-- ===========================================================================
create or replace view public.v_coverage_summary as
with concept_base as (
  select id, certification_id from public.concepts
),
taught as (
  select distinct c.id, c.certification_id
  from public.concepts c
  join public.lesson_concepts lc on lc.concept_id = c.id
),
tested as (
  select distinct c.id, c.certification_id
  from public.concepts c
  join public.question_concepts qc on qc.concept_id = c.id
)
select
  cert.id   as certification_id,
  cert.code as certification_code,
  cert.is_published,
  (select count(*) from concept_base b where b.certification_id = cert.id) as concepts_total,
  (select count(*) from taught t where t.certification_id = cert.id)        as concepts_taught,
  (select count(*) from tested t where t.certification_id = cert.id)        as concepts_tested,
  (select count(*) from public.v_coverage_tested_not_taught v where v.certification_id = cert.id) as untaught_testing_violations,
  (select count(*) from public.v_coverage_taught_not_tested v where v.certification_id = cert.id) as taught_not_yet_practiced
from public.certifications cert;

comment on view public.v_coverage_summary is
  'Per-cert coverage snapshot for the governance dashboard: concepts total/taught/tested, plus the two gap counts. untaught_testing_violations must be 0 for the 17024 guarantee.';

-- Read access for the app/admin + service role (internal audit tooling).
grant select on public.v_coverage_tested_not_taught to authenticated, service_role;
grant select on public.v_coverage_taught_not_tested to authenticated, service_role;
grant select on public.v_coverage_summary          to authenticated, service_role;

-- Usage:
--   select * from public.v_coverage_summary order by certification_code;
--   select * from public.v_coverage_tested_not_taught where certification_id = '...';  -- expect 0 rows
