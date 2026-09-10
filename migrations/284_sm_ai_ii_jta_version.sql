-- 284_sm_ai_ii_jta_version.sql
--
-- SM-AI-II published JTA version - v1.3, snapshot projected from live rows.
-- Plus the correction to a stored Stage 9 pre-condition that is no longer true.
--
-- WHY THIS ROW EXISTS. Under ISO/IEC 17024 the scheme has to be able to show an
-- assessor what its exam claims to measure, as it stood when the exam was
-- built. A JTA that exists only as a markdown file cannot do that: the file can
-- be edited, and nothing ties its contents to the database the exam is
-- assembled from. jta_versions holds the frozen record.
--
-- THIS CERTIFICATION HAS ALREADY PAID FOR NOT HAVING ONE. Migration 283
-- overwrote exam_blueprint.cognitive_profile on 2026-09-09. The profile
-- SM-AI-II published between 2026-09-03 and 2026-09-09 - apply 38.51 /
-- analyze 61.49 - now survives only in migration 278's file text and in prose.
-- There is no queryable record of it. That is precisely what a snapshot
-- prevents, and it is why this row is written now rather than at launch.
--
-- VERSION STRING - AND IT IS DELIBERATELY NOT v2.0. Migration 211 states the
-- house rule: "On locking for launch, every scheme's JTA becomes v2.0." This
-- certification is status draft and has not launched, and SCHEME-SM-AI-II.md,
-- cert.yml and migrations 277 and 278 all cite v1.2. v1.3 keeps the row and the
-- documents in agreement. jta_versions is UNIQUE on (certification_id,
-- version_string), so a v2.0 row can be added at launch alongside this one -
-- which is the correct shape: two versions, two records.
--
-- [CORRECTED 2026-09-10, by migration 286, which failed on exactly this.]
-- THE SENTENCE ABOVE IS WRONG AND THE ROW THIS MIGRATION WROTE IS NOT. Only the
-- reasoning is at fault, and only its last clause: a v2.0 row CANNOT be added
-- "alongside this one" at launch while this one is published.
--
-- jta_versions carries TWO unique indexes and this header names one:
--
--   jta_versions_cert_version_uq   unique (certification_id, version_string)
--   jta_versions_one_published     unique (certification_id) WHERE status = published
--
-- Migration 062 states the model above the second: "At most one PUBLISHED
-- version per certification at any time." MANY ROWS, ONE CURRENT. status is
-- CHECK-constrained to draft / published / retired.
--
-- THE LAUNCH PATH IS RETIRE-THEN-PUBLISH, and 062 shipped it as
-- public.publish_jta_version(), which has never been called: it retires the
-- published row for the cert, then inserts the new one as published. Take its
-- transition, not its body - it builds a five-key snapshot where all twelve
-- stored rows carry seven, and functions/_shared/ob3.ts reads the seven.
--
-- WHY THIS MATTERS MORE THAN A WRONG SENTENCE. score-mock-exam/index.ts:543
-- resolves the version to stamp with .eq("status","published").maybeSingle(),
-- which THROWS on more than one row. Had someone followed this header at launch,
-- the failure would not have been a duplicate row - it would have been the first
-- certification exam attempt, inside a try/catch that stamps null and logs a
-- warning. The partial index refused the write instead.
--
-- HOW IT GOT HERE: this header described one constraint and was read as though
-- it described the schema. Migration 286 inherited the claim from these lines
-- rather than from 062, four lines of which contain the whole answer. Preserved
-- rather than rewritten - the file is a record of what ran, and what ran was
-- correct.
--
-- PROJECTED, NOT PASTED. The snapshot is built by this query FROM the live
-- domains, tasks, concepts and certification rows. Two reasons, both 211's:
--
--   1. It cannot drift. A hand-written snapshot is a second copy of the JTA
--      that can disagree with the database silently. This one is the database.
--   2. It cannot be corrupted in transit. 44 tasks with full K/S/A pasted as
--      literal JSON into the SQL editor is the exact route that has corrupted
--      multibyte characters before. Only the query text is pasted.
--
-- SEVEN KEYS, MATCHING THE OTHER TEN EXACTLY: certification, cognitive_profile,
-- counts, domains, generated_at, generated_by, jta_version. Verified against
-- ISMS-IA's and AIMS-IA's stored snapshots before writing.
--
-- ORDER MATTERS AND IS NOT ARBITRARY. `to_jsonb(c.*)` freezes the whole
-- certifications row, exam_blueprint included. Statement 1 must run FIRST or
-- the v1.3 snapshot permanently preserves a Stage 9 blocker that was already
-- cleared - a frozen record of a false statement, which is worse than no
-- record.
--
-- WHAT IS FROZEN. The scaffold after migration 283 and after the forecast
-- corrections of 2026-09-09: 44 tasks, 131 concepts, 5 domains, profile
-- apply 36.28 / analyze 63.72. Narrative half in jta/SM-AI-II_JTA_v1.3.md;
-- factual half in jta/SM-AI-II_JTA_generated.md.
--
-- APPLIED 2026-09-09, both statements in order. Proof 5 passed:
-- froze_corrected_note true, froze_stale_note false. verify-cert invariant
-- jta.published moved from FAIL "no jta_versions row at all" to
-- PASS section 5 "Certification holds a published JTA version" v1.3.
--
-- Run in the Supabase SQL editor. Two statements, in order.
-- ============================================================================


-- ============================================================================
-- STATEMENT 1 - correct the stored Stage 9 pre-condition. RUN THIS FIRST.
--
-- Migration 278 stored two blockers in exam_blueprint.item_model.grounding_note.
-- One has been cleared and the note was never updated. Because the note lives
-- in the database rather than in a file, no git diff would ever have shown it.
--
-- CLEARED: "item-grounding.mjs has no SCRUM entry, so this certification
-- resolves to NEUTRAL." groundingFor(certName, tier) now reads tier and returns
-- SCRUM_L2 for tier 2, which composes SCRUM_CORE with SCRUM_GUIDE_FACTS. True
-- when written; false since.
--
-- STILL TRUE AND MUST SURVIVE: item-profile.mjs resolves profileFor() from the
-- certification name and takes no tier argument.
--
-- A pre-condition that has been met and still reads as blocking stops Stage 9
-- for no reason, and a reader who checks one half and finds it false has been
-- taught to distrust the other half, which is the half that matters.
--
-- The regex is described in words rather than written. 278's literal arrived in
-- the stored value as /\\bscrum\\b/ with the backslashes doubled in transit -
-- the same class as the mojibake rule, and avoidable by not shipping the
-- characters at all.
-- ============================================================================

update public.certifications c
set exam_blueprint = jsonb_set(
      c.exam_blueprint,
      '{item_model,grounding_note}',
      to_jsonb('STAGE 9 PRE-CONDITIONS - ONE OF THE TWO IS CLEARED. (1) CLEARED 2026-09-09: scripts/lib/item-grounding.mjs routes this certification correctly. groundingFor() reads tier and returns SCRUM_L2 for tier 2, which composes SCRUM_CORE with SCRUM_GUIDE_FACTS. That constant holds the 26 never-assert entries - 22 plus 4 labelled [derived] - with the paired-error rule inside the third derived entry. The original note said item-grounding.mjs had no SCRUM entry and that this cert resolved to NEUTRAL; that was true when written and is no longer. NOTE ALSO: the 26 entries live in CODE. SM-AI-II_JTA_v1.2 section 7 was never committed and cannot be produced; the code is a faithful reconstruction with different entry numbering. Cite scripts/lib/item-grounding.mjs, and see jta/SM-AI-II_JTA_v1.3.md section 7. (2) STILL BLOCKING: scripts/lib/item-profile.mjs resolves profileFor() from the certification NAME by a word-boundary match on "scrum" and takes no tier argument, so this cert inherits SM-AI-I''s Level I tier profile. Fix before any item is generated.'::text),
      false)
where c.code = 'SM-AI-II'
  and c.exam_blueprint -> 'item_model' ? 'grounding_note';


-- ============================================================================
-- STATEMENT 2 - the published JTA version row. RUN AFTER STATEMENT 1.
-- ============================================================================

insert into public.jta_versions (certification_id, version_string, status, blueprint_snapshot)
select
  c.id,
  'v1.3',
  'published',
  jsonb_build_object(
    'jta_version',  'v1.3',
    'generated_at', now(),
    'generated_by', 'migration 284 - projected from live rows, post task 1.2 rewrite and profile re-derivation (migration 283) and the forecast corrections of 2026-09-09',
    'counts', jsonb_build_object(
      'domains',             (select count(*) from public.domains  d where d.certification_id = c.id),
      'tasks',               (select count(*) from public.tasks    t where t.certification_id = c.id),
      'concepts',            (select count(*) from public.concepts x where x.certification_id = c.id),
      'tasks_in_exam_scope', (select count(*) from public.tasks    t where t.certification_id = c.id and t.is_exam_scope)
    ),
    'certification', to_jsonb(c.*),
    'domains', (
      select jsonb_agg(dom order by dom->>'order_index')
      from (
        select to_jsonb(d.*) || jsonb_build_object(
          'tasks', coalesce((
            select jsonb_agg(to_jsonb(t.*) order by t.order_index)
            from public.tasks t
            where t.domain_id = d.id
          ), '[]'::jsonb)
        ) as dom
        from public.domains d
        where d.certification_id = c.id
      ) s
    ),
    'cognitive_profile', coalesce((
      select jsonb_agg(to_jsonb(p.*))
      from public.v_cognitive_profile p
      where p.certification_id = c.id
    ), '[]'::jsonb)
  )
from public.certifications c
where c.id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46';


-- ============================================================================
-- PROOF
-- ============================================================================

-- 1. One published row, v1.3.
select version_string, status, created_at
from public.jta_versions
where certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46';

-- 2. The snapshot's counts match the live scaffold, and the seven keys match
--    the other ten rows. Expect domains 5, tasks 44, concepts 131,
--    tasks_in_exam_scope 44, domains_in_snapshot 5, tasks_in_snapshot 44,
--    and keys: certification, cognitive_profile, counts, domains,
--    generated_at, generated_by, jta_version.
select blueprint_snapshot -> 'counts' as counts,
       jsonb_array_length(blueprint_snapshot -> 'domains') as domains_in_snapshot,
       (select count(*) from jsonb_array_elements(blueprint_snapshot -> 'domains') d
         cross join jsonb_array_elements(d -> 'tasks')) as tasks_in_snapshot,
       (select string_agg(k, ', ' order by k) from jsonb_object_keys(blueprint_snapshot) k) as snapshot_keys
from public.jta_versions
where certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46';

-- 3. The frozen cognitive profile. Expect apply 16 / 36.28, analyze 28 / 63.72.
select jsonb_pretty(blueprint_snapshot -> 'cognitive_profile') as cognitive_profile
from public.jta_versions
where certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46';

-- 4. Task 1.2 carries its rewritten statement and 4_analyze IN THE FROZEN
--    SNAPSHOT. Expect "Analyze a situation in which the Developers' sizing of
--    an item has been set by someone else" at 4_analyze.
select t ->> 'code' as code, t ->> 'bloom_level' as bloom, t ->> 'statement' as statement
from public.jta_versions jv
cross join jsonb_array_elements(jv.blueprint_snapshot -> 'domains') d
cross join jsonb_array_elements(d -> 'tasks') t
where jv.certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46'
  and t ->> 'code' in ('1.2', '1.4', '4.8');

-- 5. ORDERING CHECK, and it is the one that matters. The frozen snapshot must
--    carry the CORRECTED note, not the stale one. Expect true, then false.
select (blueprint_snapshot -> 'certification' -> 'exam_blueprint' -> 'item_model' ->> 'grounding_note')
         like 'STAGE 9 PRE-CONDITIONS%'                                as froze_corrected_note,
       (blueprint_snapshot -> 'certification' -> 'exam_blueprint' -> 'item_model' ->> 'grounding_note')
         like 'BEFORE STAGE 9%'                                        as froze_stale_note
from public.jta_versions
where certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46';

-- 6. The whole-cert check.
--    Run: node scripts\verify-cert.mjs --cert SM-AI-II
--    Invariant jta.published (section 5) currently FAILS with "no jta_versions
--    row at all". Expect it to flip to:
--      PASS  jta.published  section 5  Certification holds a published JTA version  v1.3
