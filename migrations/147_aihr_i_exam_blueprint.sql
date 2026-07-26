-- 147_aihr_i_exam_blueprint.sql
-- AIHR-I - compute the cognitive profile from LIVE task rows and set exam_blueprint.
--
-- Must run AFTER 145 (tasks must exist). This is the invariant-safe order: create
-- tasks -> recompute profile from live rows -> set blueprint from the computed
-- profile. The blueprint is never authored ahead of the tasks it describes.
--
-- Nothing in this migration is hand-typed from the JTA. Both cognitive_profile and
-- task_counts are aggregated from public.tasks x public.domains at run time, so the
-- stored blueprint cannot disagree with the database it claims to describe.
--
-- Model: Certidemy Cognitive Model v2.0 - an item's cognitive level EQUALS its
-- task's declared level (enforced by trg_item_bloom_matches_task), so a
-- domain-proportional draw reproduces the profile without enforcing it at assembly.
--
-- Editor-first. Idempotent (recomputes and overwrites on every run).
-- ASCII-only by construction.

begin;

with per_task as (
  -- each exam-scope task carries an equal share of its domain's weight
  select
    t.bloom_level::text as bloom,
    d.weight_pct::numeric / count(*) over (partition by d.id) as share
  from public.tasks t
  join public.domains d on d.id = t.domain_id
  where t.certification_id = '77777777-7777-7777-7777-777777777777'
    and t.is_exam_scope
),
profile as (
  select jsonb_object_agg(bloom, pct) as obj
  from (
    select bloom, round(sum(share), 2) as pct
    from per_task
    group by bloom
  ) p
),
counts as (
  select jsonb_object_agg(bloom, n) as obj
  from (
    select t.bloom_level::text as bloom, count(*)::int as n
    from public.tasks t
    where t.certification_id = '77777777-7777-7777-7777-777777777777'
      and t.is_exam_scope
    group by t.bloom_level
  ) c
)
update public.certifications c
set exam_blueprint = jsonb_build_object(
      'version', '2.0',
      'basis', 'Certidemy Cognitive Model v2.0: an item''s cognitive level EQUALS its task''s declared level, so the form''s profile is a computed consequence of the JTA, not a target asserted over it.',
      'computed_at', '2026-07-25',
      'derived_from', 'tasks.bloom_level x domains.weight_pct over exam-scope tasks (see public.v_cognitive_profile)',
      'cognitive_profile', profile.obj,
      'task_counts', counts.obj,
      'difficulty_mix', jsonb_build_object('easy', 30, 'moderate', 50, 'hard', 20),
      'difficulty_note', 'Difficulty is orthogonal to cognitive level. An easy Analyze item and a hard Analyze item are both Analyze items. Items are made harder by subtler content, closer distractors, or less familiar situations - NEVER by raising the cognitive level.',
      'assembly', jsonb_build_object(
        'sample_by', 'domain weight_pct, then across tasks within each domain',
        'cognition', 'follows automatically: every item carries its task''s bloom_level, so a domain-proportional draw reproduces cognitive_profile without needing to enforce it',
        'balance', 'difficulty spread within each task''s items'
      )
    ),
    updated_at = now()
from profile, counts
where c.id = '77777777-7777-7777-7777-777777777777';

commit;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- 1) Read back the stored profile. Expect cognitive_profile to sum to 100.00 and
--    task_counts to sum to 28. No 1_remember key should appear in either object.
--
-- select
--   exam_blueprint->'cognitive_profile' as profile,
--   exam_blueprint->'task_counts'       as task_counts,
--   (select round(sum(value::numeric),2)
--      from jsonb_each_text(exam_blueprint->'cognitive_profile'))  as profile_sum,   -- 100.00
--   (select sum(value::int)
--      from jsonb_each_text(exam_blueprint->'task_counts'))        as task_sum,      -- 28
--   (exam_blueprint->'cognitive_profile' ? '1_remember')           as has_remember   -- false
-- from public.certifications
-- where id='77777777-7777-7777-7777-777777777777';
--
-- 2) Cross-check the stored blueprint against the platform view. Any row returned
--    means the blueprint disagrees with v_cognitive_profile and must be re-run.
--
-- select * from public.v_cognitive_profile
--  where certification_id='77777777-7777-7777-7777-777777777777';
