-- 190_isms_ia_exam_blueprint.sql
-- ISMS-IA exam blueprint.
--
-- COMPUTED, NOT TYPED. cognitive_profile and task_counts are read from
-- public.v_cognitive_profile at execution time. Nothing in this file states a
-- percentage, which is the whole point: verify-cert invariant 17 checks the
-- published blueprint against that same view, and a hand-typed number is a
-- second declaration reconciled with nothing.
--
-- Shape follows AIMS-F and ISMS-F, both read 2026-08-09 and identical to each
-- other. The boilerplate keys (basis, version, assembly, derived_from,
-- difficulty_note, difficulty_mix) are carried forward verbatim.
--
-- ONE NEW KEY: item_model. This is the catalogue's first Level II cert and
-- nothing in the database currently records that its items are built on a
-- different contract from every other cert's. Extra keys should be inert to
-- invariant 17, which reads cognitive_profile - but this is the first time a
-- blueprint has carried a key the others do not.
--
--   >> IF verify-cert INVARIANT 17 FAILS AFTER THIS MIGRATION, item_model IS
--   >> THE FIRST THING TO REMOVE. It is one key and nothing downstream reads
--   >> it yet.
--
-- difficulty_mix stays at 30/50/20, unchanged from the Level I certs. Two
-- reasons: the difficulty_note in this very blueprint states that difficulty is
-- orthogonal to cognitive level and that items are made harder by subtler
-- content and closer distractors - which is the Level II item contract by
-- construction, not an addition to it. And the pass mark is already set at 75
-- rather than 80 to account for Level II item difficulty; skewing the mix as
-- well would price the same adjustment twice.

update public.certifications c
set exam_blueprint = jsonb_build_object(

  'version', '2.0',

  'basis',
    'Certidemy Cognitive Model v2.0: an item''s cognitive level EQUALS its task''s declared level, so the form''s profile is a computed consequence of the JTA, not a target asserted over it.',

  'derived_from',
    'tasks.bloom_level x domains.weight_pct over exam-scope tasks (see public.v_cognitive_profile)',

  'computed_at', to_char(current_date, 'YYYY-MM-DD'),

  'assembly', jsonb_build_object(
    'sample_by', 'domain weight_pct, then across tasks within each domain',
    'cognition', 'follows automatically: every item carries its task''s bloom_level, so a domain-proportional draw reproduces cognitive_profile without needing to enforce it',
    'balance',   'difficulty spread within each task''s items'
  ),

  'item_model', jsonb_build_object(
    'tier', 'II',
    'format', 'single best answer among four defensible options',
    'scoring', 'dichotomous - one key, no partial credit',
    'contract', 'All four options are defensible on the facts given. The best answer must be better than the second-best for a reason a competent auditor could state in one sentence; the second-best must be genuinely defensible rather than merely wrong. An item whose second choice is incorrect is a Level I item in the wrong bank.',
    'cue_guard', 'Level II adaptation: the best option is frequently best BECAUSE it is better qualified, so a length-homogeneity guard tuned for Level I would systematically reject correct items and retain flat ones. The guard tests comparable qualification density across options instead.'
  ),

  'difficulty_mix', jsonb_build_object(
    'easy', 30,
    'moderate', 50,
    'hard', 20
  ),

  'difficulty_note',
    'Difficulty is orthogonal to cognitive level. An easy Analyze item and a hard Analyze item are both Analyze items. Items are made harder by subtler content, closer distractors, or less familiar situations - NEVER by raising the cognitive level.',

  'cognitive_profile', (
    select jsonb_object_agg(v.bloom_level, v.pct_of_form)
    from public.v_cognitive_profile v
    where v.certification_id = c.id
  ),

  'task_counts', (
    select jsonb_object_agg(v.bloom_level, v.tasks)
    from public.v_cognitive_profile v
    where v.certification_id = c.id
  )

)
where c.code = 'ISMS-IA';

-- ---------------------------------------------------------------------------
-- VERIFICATION
-- ---------------------------------------------------------------------------
--
-- Read the whole thing. cognitive_profile must show
-- 2_understand 5.00 / 3_apply 29.40 / 4_analyze 65.60, and task_counts
-- 2 / 11 / 25, with no 1_remember, 5_evaluate or 6_create key present:
--
--   select jsonb_pretty(exam_blueprint) from public.certifications where code = 'ISMS-IA';
--
-- The blueprint must agree with the view it was derived from - expect 0 rows,
-- which is the same comparison verify-cert invariant 17 makes:
--
--   select v.bloom_level,
--          v.pct_of_form as view_pct,
--          (c.exam_blueprint -> 'cognitive_profile' ->> v.bloom_level)::numeric as blueprint_pct
--   from public.certifications c
--   join public.v_cognitive_profile v on v.certification_id = c.id
--   where c.code = 'ISMS-IA'
--     and v.pct_of_form is distinct from (c.exam_blueprint -> 'cognitive_profile' ->> v.bloom_level)::numeric;
--
-- Blueprint percentages sum to 100 - expect 100.00:
--
--   select sum(value::numeric)
--   from public.certifications c,
--        jsonb_each_text(c.exam_blueprint -> 'cognitive_profile')
--   where c.code = 'ISMS-IA';
--
-- Shape parity against the two Level I blueprints. ISMS-IA should carry every
-- key they carry, plus item_model and nothing else:
--
--   select code, (select array_agg(k order by k) from jsonb_object_keys(exam_blueprint) k) as keys
--   from public.certifications where code in ('ISMS-F','AIMS-F','ISMS-IA') order by code;
--
-- THEN, before anything touches lessons:
--
--   node scripts/verify-cert.mjs --cert ISMS-IA --strict
--
-- Expect failures only on the things that genuinely do not exist yet - lessons,
-- coverage, item banks, i18n, jta_versions. A failure on the blueprint or the
-- spine means something above is wrong.
