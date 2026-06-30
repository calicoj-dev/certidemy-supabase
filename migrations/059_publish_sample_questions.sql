-- 059_publish_sample_questions.sql
--
-- The public-sample layer, built on 058's default-deny visibility model.
-- Flips 12 hand-picked PRACTICE question-groups to visibility='public' so the
-- marketing pages can show REAL questions (all three languages) to anonymous
-- visitors instead of a hardcoded English-only array.
--
-- 12 groups: 3 AI-Era + 3 core per cert, each with all three languages present,
-- selected with the same AI-Era task detection that drives the blueprint badge.
-- Flipping a GROUP id publishes its en/es-419/pt-BR rows together (~36 rows).
--
-- SAFETY: these stay pool='practice'; only visibility changes. correct_answer is
-- still column-revoked from client roles (058), so even public samples never ship
-- their answer key. Secure pool untouched. Idempotent; reversible (set back to
-- 'private').

begin;

update public.quiz_questions
set visibility = 'public'
where pool = 'practice'
  and question_group_id in (
    -- SM-AI-I : AI-Era
    '926b65a6-819e-43d1-8a4e-cc520194fdcb',  -- AI flow metrics in the Retrospective
    '03031884-7c68-4466-94aa-d2b67cf4606c',  -- SM responsibility when AI accelerates delivery
    'fd389acc-5be0-4ab9-be11-add98484925c',  -- AI-drafted Sprint Goal, Developers review
    -- SM-AI-I : core
    '886898d6-286d-4e9a-a963-3b78fe1a7cdc',  -- who creates the Sprint Backlog
    'b99abe78-a096-4d90-b8d5-38189813d50e',  -- Sprint Goal vs Product Goal
    '46359969-a9bc-41d8-aeb6-3926afad4e81',  -- well-crafted Sprint Goal
    -- SPO-AI-I : AI-Era
    '3736afa9-be52-405e-8100-73d1d5d258d2',  -- what an AI agent is in product development
    '6509c5d2-0398-47de-93ff-ae404c8a7982',  -- PO authorship in spec-driven development
    'c43640f1-b410-4108-aa5f-fa80f6460350',  -- Definition of Done vs AI-generated work
    -- SPO-AI-I : core
    '47f1eb45-0c3f-4242-863b-35758d0dd8bc',  -- transparency as an empirical pillar
    'c8568444-1c29-4d94-8782-6526b4d712d5',  -- stakeholders during a Sprint Review
    'aa9dd511-eb3f-4ab6-a321-c7b9304203f1'   -- outcome-based roadmap vs project plan
  );

commit;

-- ROLLBACK (un-publish): set the same 12 groups back to 'private'.
-- update public.quiz_questions set visibility='private'
-- where question_group_id in ( ...the 12 ids above... );
