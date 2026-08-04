-- ============================================================================
-- 173_isms_f_exam_blueprint.sql
-- ISMS-F - exam blueprint (Cognitive Model v2.0)
--
-- Cert UUID: 0bb3878a-fb89-455d-a84c-bdb9a26b1643
-- Closes verify-cert.mjs FAIL: "Blueprint equals the profile computed from the
-- JTA - no exam_blueprint.cognitive_profile: the exam makes no cognitive claim,
-- so nothing can be verified against it."
--
-- WHY THIS MIGRATION EXISTS AS A THIRD FILE:
-- CERT-SCHEMA-GUIDE.md S0 says a new cert needs TWO scaffold migrations. That is
-- incomplete - AIHR-I shipped four (145 seed, 146 modules, 147 blueprint, 148 a
-- statement-verb fix). The blueprint is a required third file, not optional.
-- S0 is corrected in the same commit.
--
-- THE PROFILE IS READ FROM public.v_cognitive_profile, NOT TYPED.
-- `derived_from` below claims the profile is computed from the JTA. A hand-typed
-- literal would make that sentence descriptive rather than true, and would create
-- a second copy that can drift - COGNITIVE-MODEL.md S4 already carries a
-- hand-typed table that no longer matches the database (open since v3.8). One
-- copy, read at write time.
--
-- CLAIMS-POLICY S4 approves: "The examination's cognitive profile is computed
-- from the job task analysis, not asserted over it." This migration is what makes
-- that claim true for ISMS-F.
--
-- EDITOR-FIRST. IDEMPOTENT (fixed id, UPDATE). ASCII-ONLY.
-- ============================================================================

-- Domain allocation is NOT stored here. It is derived at assembly time from
-- domains.weight_pct (see assembly.sample_by), which for ISMS-F at 40 items
-- gives 6 / 7 / 9 / 11 / 7 with zero rounding. Storing it would be a second
-- copy of a number the domains table already holds.

update public.certifications c
set
  exam_blueprint = jsonb_build_object(
    'version', '2.0',
    'basis',
      'Certidemy Cognitive Model v2.0: an item''s cognitive level EQUALS its task''s declared level, so the form''s profile is a computed consequence of the JTA, not a target asserted over it.',
    'derived_from',
      'tasks.bloom_level x domains.weight_pct over exam-scope tasks (see public.v_cognitive_profile)',
    'computed_at', '2026-08-04',
    'assembly', jsonb_build_object(
      'sample_by', 'domain weight_pct, then across tasks within each domain',
      'cognition', 'follows automatically: every item carries its task''s bloom_level, so a domain-proportional draw reproduces cognitive_profile without needing to enforce it',
      'balance',   'difficulty spread within each task''s items'
    ),
    'difficulty_mix', jsonb_build_object('easy', 30, 'moderate', 50, 'hard', 20),
    'difficulty_note',
      'Difficulty is orthogonal to cognitive level. An easy Analyze item and a hard Analyze item are both Analyze items. Items are made harder by subtler content, closer distractors, or less familiar situations - NEVER by raising the cognitive level.',
    'task_counts', (
      select jsonb_object_agg(v.bloom_level::text, v.tasks)
      from public.v_cognitive_profile v
      where v.certification_id = c.id
    ),
    'cognitive_profile', (
      select jsonb_object_agg(v.bloom_level::text, v.pct_of_form)
      from public.v_cognitive_profile v
      where v.certification_id = c.id
    )
  ),
  updated_at = now()
where c.id = '0bb3878a-fb89-455d-a84c-bdb9a26b1643';

-- ---------------------------------------------------------------------------
-- VERIFICATION
-- ---------------------------------------------------------------------------
-- 1. Read it back. cognitive_profile must be 1_remember 10.39 / 2_understand
--    56.77 / 3_apply 22.68 / 4_analyze 10.17; task_counts 5 / 28 / 11 / 5.
--    ISMS-F is the first cert in the catalog carrying all four Bloom levels.
--
-- select jsonb_pretty(exam_blueprint) from public.certifications
--  where code = 'ISMS-F';
--
-- 2. Prove the stored profile still equals the view - this is the invariant
--    verify-cert checks. Expect zero rows.
--
-- select v.bloom_level, v.pct_of_form as view_pct,
--        (c.exam_blueprint->'cognitive_profile'->>v.bloom_level::text)::numeric as stored_pct
--   from public.v_cognitive_profile v
--   join public.certifications c on c.id = v.certification_id
--  where c.code = 'ISMS-F'
--    and v.pct_of_form is distinct from
--        (c.exam_blueprint->'cognitive_profile'->>v.bloom_level::text)::numeric;
--
-- 3. Domain allocation sanity - must be 6 / 7 / 9 / 11 / 7 summing to 40.
--
-- select code, weight_pct, round(weight_pct * 40 / 100.0) as items
--   from public.domains
--  where certification_id = '0bb3878a-fb89-455d-a84c-bdb9a26b1643'
--  order by order_index;
--
-- 4. Re-run the gate:  node scripts\verify-cert.mjs --cert ISMS-F --strict
--    The blueprint FAIL clears. The five content/item failures remain and are
--    correct at this stage - no lessons, no items yet.
