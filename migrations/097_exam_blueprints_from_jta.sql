-- ============================================================================
-- 097_exam_blueprints_from_jta.sql
--
-- SET EVERY EXAM BLUEPRINT FROM ITS RECONCILED JOB-TASK ANALYSIS.
--
-- Under the Certidemy Cognitive Model v2.0, a certification's cognitive profile is a
-- COMPUTED PROPERTY, never an asserted target:
--
--     profile[level] = SUM over exam-scope tasks at that level of
--                      (domain.weight_pct / count of exam-scope tasks in that domain)
--
-- It is a sum. Not a lever, not a marketing claim, and not a thing anyone gets to
-- choose. Once the JTA declares its tasks and its domain weights, the profile is
-- already determined - the only open question is whether the item bank honors it.
--
-- SO THIS MIGRATION DOES NOT TYPE THE NUMBERS IN. It computes them from the live task
-- rows and writes what it finds. A human transcribing percentages is exactly how the
-- inherited "Bloom target" tables drifted away from the tasks they were supposed to
-- summarize - and drifted for eight months without anyone noticing. Invariant 17 will
-- re-derive this same figure on every verification run and fail if the stored blueprint
-- and the live tasks disagree, so the scheme document can never again silently diverge
-- from the exam it describes.
--
-- WHAT THE BLUEPRINT CARRIES
--
--   cognitive_profile - the computed Bloom distribution. This is the DECLARATION: it is
--     what we publish on the certification page, what the scheme document states, and
--     what an auditor checks against the database. It is NOT a sampling instruction:
--     because every item carries its task's Bloom level, an assembler that samples by
--     domain weight and then across tasks within each domain REPRODUCES this profile
--     automatically. It does not need to be enforced, only verified.
--
--   difficulty_mix - a genuine assembly instruction, and a DIFFERENT axis. Within a
--     cognitive level, items vary in difficulty 1-5. A form wants a spread (roughly 30%
--     easy / 50% moderate / 20% hard) for reliability: all-easy fails to discriminate at
--     the cut score, all-hard compresses the score distribution. This has NOTHING to do
--     with Bloom, and conflating the two is what produced the original defect - the old
--     bloomFor(difficulty) mapping made 1_remember structurally unreachable and severed
--     item cognition from the JTA entirely.
--
-- NOTE ON THE PRIOR AIE-I BLUEPRINT. AIE-I already carried an exam_blueprint with
-- difficulty_mix {"1":44,"2":40,"3":16}. Those were BLOOM percentages taken from the
-- JTA's inherited target table and written into the DIFFICULTY field - two errors
-- compounded. It is overwritten here.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- The canonical computation, as a view. One definition, used by the migration,
-- by verify-cert.mjs (invariant 17), and by the governance dashboard - so all three
-- cannot drift apart.
-- ---------------------------------------------------------------------------
create or replace view public.v_cognitive_profile as
select
  t.certification_id,
  t.bloom_level::text                                        as bloom_level,
  count(*)                                                   as tasks,
  round(sum(d.weight_pct / nullif(dt.n, 0))::numeric, 2)     as pct_of_form
from public.tasks t
join public.domains d on d.id = t.domain_id
join (
  select domain_id, count(*) as n
  from public.tasks
  where is_exam_scope
  group by domain_id
) dt on dt.domain_id = t.domain_id
where t.is_exam_scope
group by t.certification_id, t.bloom_level;

comment on view public.v_cognitive_profile is
  'The cognitive profile of every certification, DERIVED from its job-task analysis (task bloom_level x domain weight_pct, exam-scope tasks only). This is the single source of truth. certifications.exam_blueprint must equal this, and verify-cert invariant 17 enforces it.';

grant select on public.v_cognitive_profile to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Write the blueprint. Computed, not transcribed.
-- ---------------------------------------------------------------------------
update public.certifications c
set exam_blueprint = jsonb_build_object(
  'version',      '2.0',
  'computed_at',  to_char(now(), 'YYYY-MM-DD'),
  'derived_from', 'tasks.bloom_level x domains.weight_pct over exam-scope tasks (see public.v_cognitive_profile)',
  'basis',        'Certidemy Cognitive Model v2.0: an item''s cognitive level EQUALS its task''s declared level, so the form''s profile is a computed consequence of the JTA, not a target asserted over it.',

  -- The declaration. Published, verified, audited.
  'cognitive_profile', (
    select jsonb_object_agg(p.bloom_level, p.pct_of_form)
    from public.v_cognitive_profile p
    where p.certification_id = c.id
  ),
  'task_counts', (
    select jsonb_object_agg(p.bloom_level, p.tasks)
    from public.v_cognitive_profile p
    where p.certification_id = c.id
  ),

  -- The assembly instruction. A DIFFERENT axis: spread of difficulty WITHIN each
  -- cognitive level, for form reliability. Nothing to do with Bloom.
  'difficulty_mix', jsonb_build_object(
    'easy',     30,   -- difficulty 1-2
    'moderate', 50,   -- difficulty 3
    'hard',     20    -- difficulty 4-5
  ),
  'difficulty_note', 'Difficulty is orthogonal to cognitive level. An easy Analyze item and a hard Analyze item are both Analyze items. Items are made harder by subtler content, closer distractors, or less familiar situations - NEVER by raising the cognitive level.',

  -- How a form is drawn.
  'assembly', jsonb_build_object(
    'sample_by',  'domain weight_pct, then across tasks within each domain',
    'cognition',  'follows automatically: every item carries its task''s bloom_level, so a domain-proportional draw reproduces cognitive_profile without needing to enforce it',
    'balance',    'difficulty spread within each task''s items'
  )
)
where exists (select 1 from public.v_cognitive_profile p where p.certification_id = c.id);

-- ---------------------------------------------------------------------------
-- Proof: the stored blueprint must equal the live computation, for every cert.
-- ---------------------------------------------------------------------------
select c.code,
       c.exam_blueprint -> 'cognitive_profile' as stored_profile,
       (select jsonb_object_agg(p.bloom_level, p.pct_of_form)
          from public.v_cognitive_profile p
         where p.certification_id = c.id)      as live_profile,
       case
         when c.exam_blueprint -> 'cognitive_profile' =
              (select jsonb_object_agg(p.bloom_level, p.pct_of_form)
                 from public.v_cognitive_profile p
                where p.certification_id = c.id)
         then 'MATCH'
         else '*** DIVERGED ***'
       end as verdict
from public.certifications c
where c.exam_blueprint is not null
order by c.code;

-- Human-readable: what each exam actually is now.
select c.code,
       c.num_questions,
       round((c.exam_blueprint #>> '{cognitive_profile,1_remember}')::numeric, 1)   as remember_pct,
       round((c.exam_blueprint #>> '{cognitive_profile,2_understand}')::numeric, 1) as understand_pct,
       round((c.exam_blueprint #>> '{cognitive_profile,3_apply}')::numeric, 1)      as apply_pct,
       round((c.exam_blueprint #>> '{cognitive_profile,4_analyze}')::numeric, 1)    as analyze_pct
from public.certifications c
where c.exam_blueprint is not null
order by c.code;
