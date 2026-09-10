-- 286_sm_ai_ii_jta_v1_4.sql
--
-- SM-AI-II published JTA version - v1.4, snapshot projected from live rows.
-- Retires v1.3. Plus the one exam_blueprint correction that must precede the
-- freeze.
--
-- WHY A NEW ROW RATHER THAN AN EDIT TO v1.3. Migration 285 rewrote five task
-- knowledge lines and six concept descriptions in D3. v1.3's snapshot froze the
-- superseded text, which is correct: a snapshot records what that version was.
-- Editing it would destroy the only queryable record of the state the D3 recon
-- was run against.
--
-- ============================================================================
-- THE SHAPE OF jta_versions, READ FROM THE SCHEMA RATHER THAN FROM 284.
-- ============================================================================
--
-- THE FIRST DRAFT OF THIS MIGRATION WAS WRONG HERE, and the insert failed on
-- it. It said: jta_versions is UNIQUE on (certification_id, version_string), so
-- v1.3 and v1.4 coexist as two published rows. The first half is true. The
-- conclusion is false, because that is not the only index:
--
--   CREATE UNIQUE INDEX jta_versions_cert_version_uq
--     ON public.jta_versions USING btree (certification_id, version_string)
--
--   CREATE UNIQUE INDEX jta_versions_one_published
--     ON public.jta_versions USING btree (certification_id)
--     WHERE (status = 'published'::text)
--
-- Migration 062 states the model in one line above the second index: "At most
-- one PUBLISHED version per certification at any time." MANY ROWS, ONE CURRENT.
-- That is what lets a credential forever render the blueprint it was earned
-- against - the old rows have to survive, and exactly one has to be current.
-- status is CHECK-constrained to draft / published / retired; there is no
-- 'superseded', and 'retired' already means "not current" everywhere it is read.
--
-- THE INDEX IS NOT A FORMALITY. score-mock-exam/index.ts:543 resolves the
-- version to stamp on a certification attempt with
--
--   .eq("status", "published").maybeSingle()
--
-- maybeSingle() THROWS on more than one row. Two published rows would not have
-- picked the wrong one - they would have failed the first certification exam
-- attempt, in front of a real candidate, in a code path with a try/catch that
-- would have stamped jta_version_id null and logged a warning nobody reads.
-- The index caught at write time what would otherwise have surfaced at scoring.
--
-- 062 ALSO SHIPPED THIS EXACT TRANSITION, AND IT HAS NEVER BEEN CALLED.
-- public.publish_jta_version(p_cert, p_version) does:
--
--   update public.jta_versions set status = 'retired'
--    where certification_id = p_cert and status = 'published';
--   insert into public.jta_versions (...) values (..., 'published', v_snapshot);
--
-- Retire, then publish, atomically. Statements 2 and 3 below are that
-- transition. WE TAKE ITS TRANSITION AND NOT ITS BODY: the function builds a
-- FIVE-key snapshot - certification_id, version, captured_at, domains, tasks -
-- with tasks as a flat array. All twelve stored rows carry the SEVEN-key shape
-- migration 211 established, with tasks nested inside domains plus concepts,
-- counts and cognitive_profile. functions/_shared/ob3.ts reads that shape.
-- Calling the function would put a differently-shaped snapshot in the table and
-- break the reader. The function's snapshot builder is stale; its transition is
-- not.
--
-- This is the first retired row in the catalogue. Twelve certifications, twelve
-- rows, all published, none ever superseded - so nothing has exercised this path
-- and eleven of them will need it at launch.
--
-- v1.4 AND NOT v2.0, for 284's reason unchanged: migration 211's house rule is
-- that a JTA becomes v2.0 on locking for launch, and this certification is
-- still status draft.
--
-- ============================================================================
-- THE ORDERING HAZARD: IT APPLIES, AND FOR A DIFFERENT REASON THAN IN 284.
-- ============================================================================
--
-- `to_jsonb(c.*)` freezes the whole certifications row, exam_blueprint
-- included, so anything wrong in the blueprint is wrong in the snapshot
-- permanently. Every field was read before writing this migration:
--
--   cognitive_profile / task_counts / computed_at  NO CHANGE NEEDED. 285
--     touched no bloom_level, so v_cognitive_profile did not move. apply 16 /
--     36.28 and analyze 28 / 63.72 are still live.
--   item_model.cue_tolerance                       NO CHANGE NEEDED. Still
--     PROVISIONAL with measured_over null; no item bank exists.
--   certifications.status = draft, tier = 2        NO CHANGE NEEDED.
--   item_model.grounding_note                      CORRECTION REQUIRED.
--
-- THE NOTE'S TWO HALVES WERE CHECKED SEPARATELY, because 284 established that a
-- reader who finds one half false stops trusting the other:
--
--   (1) The CLEARED half - item-grounding.mjs routes this cert to SCRUM_L2 -
--       is still true and must survive verbatim.
--   (2) The STILL BLOCKING half - item-profile.mjs - is ALSO still true, read
--       from the file rather than from the note: profileFor(certName) takes one
--       argument, tests /\bscrum\b/ against the name, and returns PROFESSIONAL.
--       No tier parameter exists. It stays exactly as written.
--
-- WHAT IS WRONG IS NEITHER OF THOSE. The note ends "see
-- jta/SM-AI-II_JTA_v1.3.md section 7", and this version renames that file to
-- SM-AI-II_JTA_v1.4.md - the catalogue's convention, established by
-- `AIHR-I_JTA_v1.3.md -> AIHR-I_JTA_v2.0.md` and five more in c307557. After
-- the rename the path does not resolve, and a v1.4 snapshot taken before fixing
-- it would freeze a v1.4 record directing its reader to a file that is gone.
--
-- THE REPLACEMENT IS TARGETED, NOT RETYPED. 284 pasted the whole 1052-character
-- note to change part of it. This one calls replace() on the stored value, so
-- the only new characters in transit are the two file names. Verified before
-- writing: the note holds exactly ONE occurrence of "SM-AI-II_JTA_v1.3.md", and
-- its other version reference, "SM-AI-II_JTA_v1.2", carries no ".md" and cannot
-- be matched.
--
-- ALL THREE STATEMENTS ARE GUARDED TO BE NO-OPS ON RE-RUN, and that is not
-- decoration. The first attempt at this migration submitted statement 1 and the
-- failing insert together; the SQL editor wraps a submission in one
-- transaction, so statement 1 ROLLED BACK with it. Confirmed by reading the
-- stored note afterwards, which still contained v1.3. A guard that keys on the
-- OLD value is correct whether or not a prior attempt committed.
--
-- WHAT IS FROZEN. The scaffold after migration 285: 44 tasks, 131 concepts,
-- 5 domains, profile apply 36.28 / analyze 63.72 - all unchanged from v1.3 -
-- with D3's five corrected knowledge lines and six corrected concept
-- descriptions. Narrative half in jta/SM-AI-II_JTA_v1.4.md; factual half in
-- jta/SM-AI-II_JTA_generated.md, regenerated 2026-09-10.
--
-- Run in the Supabase SQL editor. Three statements, in order.
-- ============================================================================


-- ============================================================================
-- STATEMENT 1 - repoint the grounding note at v1.4. RUN THIS FIRST.
-- Expect UPDATE 1. On a re-run, UPDATE 0: the where clause requires the OLD
-- path to still be present, so it cannot apply twice and cannot corrupt a note
-- that has already moved.
-- ============================================================================

update public.certifications c
set exam_blueprint = jsonb_set(
      c.exam_blueprint,
      '{item_model,grounding_note}',
      to_jsonb(replace(
        c.exam_blueprint #>> '{item_model,grounding_note}',
        'SM-AI-II_JTA_v1.3.md',
        'SM-AI-II_JTA_v1.4.md')),
      false)
where c.code = 'SM-AI-II'
  and c.exam_blueprint #>> '{item_model,grounding_note}' like '%SM-AI-II_JTA_v1.3.md%';


-- ============================================================================
-- STATEMENT 2 - retire v1.3. RUN BEFORE THE INSERT, NOT AFTER.
-- Expect UPDATE 1. On a re-run, UPDATE 0: nothing is published for this cert
-- until statement 3 lands, and after it lands only v1.4 is, which this
-- statement excludes by version_string.
--
-- v1.3 IS NOT DELETED. It keeps its row, its version_string and its frozen
-- snapshot; only its currency changes. A credential stamped with its id still
-- renders it - open-badge/index.ts:1014 filters by id and does not filter by
-- status on that path.
-- ============================================================================

update public.jta_versions jv
set status = 'retired'
from public.certifications c
where jv.certification_id = c.id
  and c.code = 'SM-AI-II'
  and jv.status = 'published'
  and jv.version_string <> 'v1.4';


-- ============================================================================
-- STATEMENT 3 - the published JTA version row. RUN AFTER STATEMENTS 1 AND 2.
-- Projected from live rows, never pasted. Seven keys, matching v1.3 and the
-- other eleven certifications exactly.
-- Expect INSERT 0 1. On a re-run, INSERT 0 0 rather than a unique violation.
-- ============================================================================

insert into public.jta_versions (certification_id, version_string, status, blueprint_snapshot)
select
  c.id,
  'v1.4',
  'published',
  jsonb_build_object(
    'jta_version',  'v1.4',
    'generated_at', now(),
    'generated_by', 'migration 286 - projected from live rows, after migration 285 corrected five D3 task knowledge lines and six D3 concept descriptions for Guide attribution. Supersedes v1.3, which is retired and not deleted.',
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
where c.id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46'
  and not exists (
    select 1 from public.jta_versions jv
    where jv.certification_id = c.id and jv.version_string = 'v1.4'
  );


-- ============================================================================
-- PROOF
-- ============================================================================

-- 1. TWO rows, and EXACTLY ONE published. Expect v1.3 retired, v1.4 published.
--    Both halves matter: a missing v1.3 row means the history was destroyed,
--    and two published rows mean the index is not doing its job.
select version_string, status, created_at
from public.jta_versions
where certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46'
order by version_string;

-- 2. The catalogue-wide invariant, which is the one the index enforces.
--    Expect twelve rows, every published_rows value exactly 1.
select c.code,
       count(*) filter (where jv.status = 'published') as published_rows,
       count(*) filter (where jv.status = 'retired')   as retired_rows,
       count(*)                                        as total_rows
from public.certifications c
join public.jta_versions jv on jv.certification_id = c.id
group by c.code
order by c.code;

-- 3. v1.4's counts match the live scaffold and its keys match v1.3's. Expect
--    domains 5, tasks 44, concepts 131, tasks_in_exam_scope 44,
--    domains_in_snapshot 5, tasks_in_snapshot 44, and keys: certification,
--    cognitive_profile, counts, domains, generated_at, generated_by,
--    jta_version.
select blueprint_snapshot -> 'counts' as counts,
       jsonb_array_length(blueprint_snapshot -> 'domains') as domains_in_snapshot,
       (select count(*) from jsonb_array_elements(blueprint_snapshot -> 'domains') d
         cross join jsonb_array_elements(d -> 'tasks')) as tasks_in_snapshot,
       (select string_agg(k, ', ' order by k) from jsonb_object_keys(blueprint_snapshot) k) as snapshot_keys
from public.jta_versions
where certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46'
  and version_string = 'v1.4';

-- 4. The profile did not move between the two versions. Expect two identical
--    results: apply 16 / 36.28 and analyze 28 / 63.72 in BOTH. 285 touched no
--    bloom_level and this is the assertion of that.
select jv.version_string,
       jsonb_pretty(jv.blueprint_snapshot -> 'cognitive_profile') as cognitive_profile
from public.jta_versions jv
where jv.certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46'
order by jv.version_string;

-- 5. BOTH DIRECTIONS, AND THIS IS THE ONE THAT MATTERS. Each version's frozen
--    snapshot must carry ITS OWN D3 knowledge lines. v1.4 must hold the
--    corrected five; RETIRED v1.3 must still hold the superseded five. If
--    v1.3's row reads like v1.4's, the snapshot is not frozen and the whole
--    mechanism is decorative - and retiring a row must not alter it.
--
--    Expect ten rows. v1.3: 3.2 "The Developers decide who does what...",
--    3.3 "...adopt an empirical approach", 3.5 "...persuade the Product
--    Owner", 3.7 "One product has one...", 3.8 "...not divisible".
--    v1.4: 3.2 "Self-management belongs to the Scrum Team...", 3.3 "...
--    understand and enact...", 3.5 "...trying to convince...", 3.7 "The Guide
--    recommends that...", 3.8 "...how that attention is apportioned".
select jv.version_string,
       jv.status,
       t ->> 'code' as code,
       left(t ->> 'knowledge', 66) as knowledge_head
from public.jta_versions jv
cross join lateral jsonb_array_elements(jv.blueprint_snapshot -> 'domains') d
cross join lateral jsonb_array_elements(d -> 'tasks') t
where jv.certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46'
  and d ->> 'code' = 'D3'
  and t ->> 'code' in ('3.2', '3.3', '3.5', '3.7', '3.8')
order by jv.version_string, t ->> 'code';

-- 6. The grounding note travelled correctly into v1.4's snapshot: it points at
--    v1.4 and still names item-profile.mjs as blocking. v1.3's snapshot still
--    points at v1.3, because it was frozen before statement 1.
--    Expect v1.3 -> false, true; v1.4 -> true, true.
select jv.version_string,
       (jv.blueprint_snapshot #>> '{certification,exam_blueprint,item_model,grounding_note}')
         like '%SM-AI-II_JTA_v1.4.md%' as points_at_v1_4,
       (jv.blueprint_snapshot #>> '{certification,exam_blueprint,item_model,grounding_note}')
         like '%item-profile.mjs%' as still_names_the_blocker
from public.jta_versions jv
where jv.certification_id = 'a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46'
order by jv.version_string;
