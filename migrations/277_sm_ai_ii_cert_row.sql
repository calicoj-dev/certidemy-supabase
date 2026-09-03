-- 277_sm_ai_ii_cert_row.sql
--
-- SM-AI-II (Scrum Master II - AI) - certification row ONLY.
--
-- SCOPE: one row in public.certifications. No domains, no tasks, no concepts,
-- no modules. Those land through the ingest path from
-- certidemy-web/content/sm-ai-ii/cert.yml, which is the source of truth for the
-- blueprint (CERT_YML_SPEC.md:5). This migration exists only to create the row
-- the importer needs to already exist.
--
-- WHY THE ROW MUST PRE-EXIST. scripts/ingest/plan.ts:473 emits an INSERT op only
-- when the certification is absent from the database, and scripts/ingest/apply.ts:370
-- forces status: "available" on that insert path. cert.yml carries no status field,
-- so there is no way to author around it: an ingest-created certification publishes
-- itself the moment it is created, empty. Creating the row here at status 'draft'
-- routes the importer down the UPDATE path instead, where status is untouched.
--
-- exam_blueprint IS NULL ON PURPOSE, AND THIS IS A DEPARTURE FROM 205.
-- Migration 205 wrote AIMS-IA's blueprint as a hand-pasted literal computed from the
-- locked JTA before any row existed, then added proof block 7 to recompute the profile
-- from the landed rows and demand it match, with "IF THIS DISAGREES WITH THE
-- BLUEPRINT, STOP". That check is necessary precisely because the blueprint was
-- written first and can therefore be wrong.
--
-- Here the order is inverted. The blueprint is written in migration 278, AFTER the
-- tasks land and AFTER v_cognitive_profile is computed from them, using that computed
-- figure. The blueprint becomes a recorded result rather than an asserted target -
-- which is what COGNITIVE-MODEL.md says it is - and verify-cert invariant 17
-- (blueprint == the profile computed live) becomes true by construction instead of
-- by inspection. Recommended as the order for every subsequent tier-2 build.
--
-- PUBLICATION GATE: exam_blueprint must be non-null and status must not be flipped
-- off 'draft' while it is null.
--
-- SOURCE: SM-AI-II_JTA_v1.2.md (lock candidate, two Stage-3 review passes) and
-- SM-AI-II_BoK_v1.1.md (Stage 1, signed 2026-09-02).
--
-- THE JTA IS NOT LOCKED YET. It locks only if the profile computed in step 3 below
-- clears analyze >= 55 with remember = 0. Predicted 61.49 / 38.51 / 0 / 0. If it
-- misses, this row is deleted and the build stops - which is the point of creating
-- nothing but the row here.
--
-- Run in the Supabase SQL editor. Blocks separated so they can be run one at a time.

-- ============================================================================
-- 0. PRE-FLIGHT. Run this FIRST. Expect: zero rows from both.
--    (a) SM-AI-II must not already exist.
--    (b) sort_order 4 must be free within category_slug 'scrum'
--        (live today: SM-AI-I:1, SPO-AI-I:2, SD-AI-I:3).
select 'code collision' as check, code, name, status
from public.certifications where code = 'SM-AI-II'
union all
select 'sort_order collision', code, name, status
from public.certifications where category_slug = 'scrum' and sort_order = 4;

-- Confirm the issuer id below is the one every live certification uses.
-- Expect a single row, and expect its id to equal the issuer_id in block 1.
select id, count(*) over () as distinct_issuers
from (select distinct issuer_id as id from public.certifications) s;

-- ============================================================================
-- 1. The certification row.
--
--    id is a generated v4. Repeating-digit slots are retired (205 header); the
--    '9999' slot in particular stays unspent.
--
--    THE NAME IS LOAD-BEARING IN TWO PLACES, AND ONE OF THEM IS BROKEN TODAY:
--      - scripts/lib/item-grounding.mjs routes grounding on the name. There is no
--        SCRUM entry, so this certification currently resolves to NEUTRAL, which
--        carries no edition set and no never-assert list. SM-AI-II_JTA_v1.2 section 7
--        is the content of the SCRUM entry that must exist before Stage 9.
--      - scripts/lib/item-profile.mjs:101-118 routes profileFor() on the name via
--        /\bscrum\b/ and does NOT read tier. "Scrum Master II - AI" matches, so it
--        would inherit SM-AI-I's Level I profile. This is the same defect shape v6.9
--        fixed in item-grounding.mjs, one layer up. MUST be resolved before Stage 9.
--    Neither blocks this migration. Both block item generation.
--
--    tier = 2. difficulty_level = 3 is the spec's 1-5 INFORMATIONAL scale
--    (CERT_YML_SPEC.md:43, "1=intro, 5=expert"), NOT a tier mirror. HANDOFF-v6_2.md:77-79,
--    CERT-SCHEMA-GUIDE.md:179-184 and migrations/187:17-20 record the two columns as
--    correlated; they are not, and were not when written - SM-AI-I has carried the
--    spec's default of 2 at tier 1 since before this repository existed. Those three
--    documents are owed a correction; nothing reads the column.
--
--    validity_days = 365, not the 730 both Internal Auditors carry. Validity is a
--    commitment to re-review the body of knowledge on that schedule. The 2020 Scrum
--    Guide moves slowly; the AI half of this scheme does not, and D5 is 22.5% of it.
--
--    exam_duration_minutes = 150 at 50 items is 3.00 min/item, the tier-II floor
--    (v7.1). It is a FLOOR, not a measurement: re-measure against this bank's own
--    es-419 item lengths before publication and adjust UPWARD if the reading load
--    warrants. Note that SD-AI-I, SM-AI-I and SPO-AI-I all sit at exactly 1.50, i.e.
--    set to the tier-I floor rather than measured to it - do not repeat that here.
--
--    exam_link / price_usd omitted: no storefront product exists, and the purchase-URL
--    constraint now admits certidemy.com only.
insert into public.certifications (
  id, code, name, provider, description, price_usd, tier, sort_order, status,
  category_slug, difficulty_level, issuer_id, validity_days, num_questions,
  passing_score_pct, exam_duration_minutes, max_exam_attempts, attempt_window_months,
  exam_blueprint
) values (
  'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46',
  'SM-AI-II',
  'Scrum Master II — AI',
  'Certidemy',
  'Advanced Scrum Master certification. The 2020 Scrum Guide states that the framework is purposefully incomplete, defining only the parts required to implement Scrum theory. Level I certifies that a holder knows what the Guide defines; this credential certifies that they act competently in the space it deliberately leaves open — resolving tensions between its own rules, coaching a team that performs Scrum correctly and still fails, holding accountability boundaries against the organization, restoring empiricism where inspection has gone fake, and exercising judgment when models and agents are part of how the work gets done.',
  0,
  2,          -- tier II
  4,          -- sort_order, per-category: scrum holds SM-AI-I:1, SPO-AI-I:2, SD-AI-I:3
  'draft',
  'scrum',
  3,          -- difficulty_level: the 1-5 informational scale, NOT the tier. See header.
  'b2b35e1e-fb05-484d-9065-5deeb400492a',   -- verify against block 0
  365,        -- see header
  50,
  75.00,      -- tier-II convention. NOT comparable to a market 85% measured on a
              -- partial-credit, multi-answer, open-book instrument. See BoK v1.1 §6.1.
  150,        -- 3.00 min/item = the tier-II FLOOR. Re-measure before publication.
  6, 12,
  NULL        -- exam_blueprint: migration 278, computed. See header.
);

-- ============================================================================
-- 2. PROOF - immediately after block 1. Expect exactly one row, status 'draft',
--    tier 2, exam_blueprint null, and the three Scrum siblings beside it.
select code, name, status, tier, difficulty_level, sort_order, category_slug,
       num_questions, passing_score_pct, exam_duration_minutes,
       round(exam_duration_minutes::numeric / nullif(num_questions, 0), 2) as min_per_item,
       validity_days,
       (exam_blueprint is null) as blueprint_null
from public.certifications
where category_slug = 'scrum' or code = 'SM-AI-II'
order by sort_order;

-- Nothing else may have moved. Expect 13 rows total (12 before this migration,
-- including ZZ-TEST-I at status 'draft').
select count(*) as total_certifications from public.certifications;

-- ============================================================================
-- 3. THE INGEST RUN. NOT SQL. Run from certidemy-web after blocks 0-2 pass.
--
--    npm run content:validate -- --cert sm-ai-ii
--    npm run content:apply    -- --cert sm-ai-ii              # dry-run, DEFAULT
--    npm run content:apply    -- --cert sm-ai-ii --apply
--
--    READ THE DRY-RUN PLAN BEFORE APPLYING. Three things to check specifically:
--      (a) The certifications op is "update" and NOT "insert". An insert op means
--          block 1 did not land, and apply.ts:370 would publish this cert live.
--      (b) The plan proposes ZERO deletions. There is nothing to delete; any
--          deletion op means the plan is reading the wrong certification.
--      (c) task order_index. cert.yml numbers tasks per-domain (1..9 within each),
--          matching content/sm-ai-i/cert.yml. CERT-SCHEMA-GUIDE.md says globally
--          sequential 1..N across the cert. The two disagree and the guide has not
--          been reconciled against the only real example. Whichever the plan shows
--          is what lands; decide deliberately rather than by default.
--
--    Expected to land: 5 domains, 131 concepts, 44 tasks, 132 task_concepts, 5 modules.

-- ============================================================================
-- 4. PROOF - after the ingest run. Expect 5 / 131 / 44 / 132 / 5.
--    132 links against 131 concepts is correct: quality-adherence is shared by
--    tasks 5.6 and 5.9. (Every JTA version through v1.2 claimed 155 concepts; that
--    figure was asserted, never counted. 131 is the counted value from cert.yml.)
select
  (select count(*) from public.domains  where certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46') as domains,
  (select count(*) from public.concepts where certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46') as concepts,
  (select count(*) from public.tasks    where certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46') as tasks,
  (select count(*) from public.task_concepts tc join public.tasks t on t.id = tc.task_id
    where t.certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46')                                   as task_concepts,
  (select count(*) from public.modules  where certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46') as modules;

-- Domain weights and task counts. Expect 20.00/9, 20.00/9, 17.50/8, 20.00/9, 22.50/9;
-- weights summing to 100.00.
select d.code, d.weight_pct, count(t.id) as tasks
from public.domains d
left join public.tasks t on t.domain_id = d.id
where d.certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46'
group by d.code, d.weight_pct, d.order_index
order by d.order_index;

-- Bloom counts. Expect 3_apply 17, 4_analyze 27, and NOTHING ELSE.
-- A 1_remember or 2_understand row here means a task was authored against the
-- wrong level and Screen 1(b) leaked.
select bloom_level, count(*) as tasks
from public.tasks where certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46'
group by bloom_level order by bloom_level;

-- No exam-scope task above the MCQ ceiling (invariant 16). Expect ZERO rows.
select code, bloom_level, statement
from public.tasks
where certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46'
  and is_exam_scope and bloom_level in ('5_evaluate', '6_create');

-- Every task carries its KSA triple. Expect ZERO rows.
select code, statement
from public.tasks
where certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46'
  and (knowledge is null or skills is null or abilities is null
       or criticality is null or frequency is null);
-- (scripts/ingest/validate.ts:374,377 guards criticality and frequency only with
--  `if (t.x && ...)`, so a missing one passes validation silently even though
--  CERT_YML_SPEC.md:161-162 marks both required. This block is the backstop.)

-- No task statement enumerates its own answer set. This is the tell that a task is
-- Apply wearing Analyze (JTA v1.2 §1); 2.8 was demoted for exactly this. Read the
-- output, do not trust the count - the pattern is heuristic.
select code, bloom_level, statement
from public.tasks
where certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46'
  and bloom_level = '4_analyze'
  and statement ~ ',[^,]+, or |, or |either .* or '
order by code;

-- ============================================================================
-- 5. THE KILL SWITCH.
--
--    Predicted from the JTA by hand: 3_apply 38.51, 4_analyze 61.49, and NOTHING
--    at remember or understand. THE HAND ARITHMETIC IS NOT THE TEST. On ISMS-IA
--    four rounds of hand arithmetic were wrong before the database settled it.
--
--    PASS  = 4_analyze >= 55.00 AND no 1_remember row AND no 2_understand row.
--    FAIL  = anything else. On fail: DELETE the certification row and stop. Do not
--            relabel a verb to reach the number - that is the one move this whole
--            build has refused for three versions (BoK §4, JTA §5.1).
with per_task as (
  select t.bloom_level,
         d.weight_pct / count(*) over (partition by d.id) as w
  from public.tasks t
  join public.domains d on d.id = t.domain_id
  where t.certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46'
    and t.is_exam_scope
)
select bloom_level::text as bloom, round(sum(w), 2) as weighted_pct
from per_task group by bloom_level
union all
select 'TOTAL', round(sum(w), 2) from per_task
order by bloom;

-- Peer context for the resulting number.
-- SD-AI-I 30.30 (heaviest tier I) | ISMS-IA 65.60 | AIMS-IA 69.48.
select code, jsonb_pretty(exam_blueprint -> 'cognitive_profile') as profile
from public.certifications
where code in ('ISMS-IA', 'AIMS-IA', 'SD-AI-I')
order by code;

-- ============================================================================
-- 6. ROLLBACK, if block 5 fails.
--    Ordered child-first. Safe because nothing downstream exists yet: no lessons,
--    no questions, no credentials, no vouchers.
--
-- delete from public.task_concepts where task_id in (
--   select id from public.tasks where certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46');
-- delete from public.tasks    where certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46';
-- delete from public.concepts where certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46';
-- delete from public.modules  where certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46';
-- delete from public.domains  where certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46';
-- delete from public.certifications where id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46';
--
-- Also delete content/sm-ai-ii/cert.yml, or the next content:apply recreates it.

-- ============================================================================
-- 7. WHAT REMAINS AFTER A PASS, IN ORDER.
--
--    278  exam_blueprint, computed from block 5's output. Carry forward from 205's
--         blueprint: version, basis, assembly, item_model (tier II contract,
--         dichotomous scoring), difficulty_mix, difficulty_note. Declare
--         cue_tolerance explicitly - the generator falls back to the Level I default
--         (5 chars / 10 pct) if the blueprint does not carry one, which rejects
--         correct L2 items and keeps flat ones. Describe cue_guard ACCURATELY as
--         character-based; ISMS-IA's blueprint claims a qualification-density guard
--         that has never existed.
--    ---  jta_versions row, published, projected from the live rows. CERT-PUBLISH-
--         CHECKLIST still has no step for this and ten certs have each rediscovered it.
--    ---  SCRUM grounding entry in scripts/lib/item-grounding.mjs, from JTA v1.2 §7
--         (26 never-assert entries, four labelled [derived], with the paired-error rule).
--    ---  item-profile.mjs must learn tier before it routes /\bscrum\b/ on this name.
--    ---  Tier-2 generation constants folded into code as defaults (owed since v6.5):
--         CHUNK=3, LEN_SPREAD_MAX=130, KEY_LEN_MARGIN=25, BANK_REVISION.
--    ---  Stage 7: 44 lessons. Stage 9: 8 secure + 10 practice per task per language
--         = 1,056 secure and 1,320 practice at the floors.
--
-- End of 277.
