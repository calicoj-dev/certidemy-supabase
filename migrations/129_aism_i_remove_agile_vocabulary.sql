-- 129_aism_i_remove_agile_vocabulary.sql
--
-- Remove Scrum event names from four AISM-I distractors, in all three languages.
--
-- Editor-first: paste + run in the Supabase SQL editor (project pctynukndxnmnxiqpgck),
-- then commit this file as the versioned record.
--
-- ASCII-CLEAN. The Spanish and Portuguese replacements carry accented characters,
-- which are written as SQL standard unicode escapes (U&'...' with \00xx) rather
-- than literal bytes. Pasting literal multibyte text into the SQL editor is the
-- documented mojibake source on this project; this file cannot introduce it.
--
-- Idempotent: every UPDATE is guarded on the text being replaced.
--
-- ===========================================================================
-- THE FINDING
-- ===========================================================================
-- verify-cert.mjs invariant "No out-of-domain (agile) vocabulary" flagged 4 of
-- 1,098 English AISM-I items (0.4%) as carrying Scrum vocabulary. AISM-I is a
-- service-management cert; its candidates are not taught Scrum.
--
-- Checked against the keys: in all four items the agile term appears ONLY in a
-- distractor, never in the correct answer (keys are d, d, b, d). So the
-- verifier's own criterion - "verify no KEY depends on it" - was already
-- satisfied, and no candidate could have been scored on Scrum knowledge.
--
-- It is still worth fixing. Three of the four use real Scrum EVENT names
-- ("sprint retrospective", "next sprint review", "next development sprint") as
-- the reason a distractor is wrong. A candidate with no Scrum exposure may
-- reject those options for unfamiliarity rather than on service-management
-- grounds - mild construct-irrelevant variance (Messick). Rewriting the same
-- distractors in service-management language makes them BETTER distractors:
-- equally wrong, but wrong for a reason the candidate was taught.
--
-- Nothing about the correct answer, the difficulty, or the competence changes.
-- No item is retired or regenerated.
--
-- ---------------------------------------------------------------------------
-- BEFORE: expect 12 rows (4 groups x 3 languages), 4 of them English.
--
-- select question_group_id, language, options::text ilike '%sprint%' as has_agile
--   from public.quiz_questions
--  where question_group_id in (
--    'f619e028-b920-4f68-84d9-5b44372b4385',
--    '7a84201e-dfe4-4a4e-9939-8293a8c23177',
--    '27af7c07-79ba-48b3-9736-54847fad3a58',
--    '51af5a11-c6ad-49ec-8833-a1c26e2eb794')
--  order by question_group_id, language;
-- ---------------------------------------------------------------------------


-- ===========================================================================
-- GROUP f619e028 | task 3.9 | "sprint retrospective" as an SLA review cadence
-- ===========================================================================

update public.quiz_questions
   set options = replace(options::text, 'sprint retrospective', 'service review meeting')::jsonb
 where question_group_id = 'f619e028-b920-4f68-84d9-5b44372b4385'
   and language = 'en' and options::text like '%sprint retrospective%';

update public.quiz_questions
   set options = replace(options::text, 'Sprint Retrospective',
                         U&'reuni\00f3n de revisi\00f3n del servicio')::jsonb
 where question_group_id = 'f619e028-b920-4f68-84d9-5b44372b4385'
   and language = 'es-419' and options::text like '%Sprint Retrospective%';

update public.quiz_questions
   set options = replace(options::text, 'Sprint Retrospective',
                         U&'reuni\00e3o de revis\00e3o do servi\00e7o')::jsonb
 where question_group_id = 'f619e028-b920-4f68-84d9-5b44372b4385'
   and language = 'pt-BR' and options::text like '%Sprint Retrospective%';


-- ===========================================================================
-- GROUP 7a84201e | task 5.9 | "next development sprint" as a deferral
-- ===========================================================================

update public.quiz_questions
   set options = replace(options::text, 'next development sprint', 'next development cycle')::jsonb
 where question_group_id = '7a84201e-dfe4-4a4e-9939-8293a8c23177'
   and language = 'en' and options::text like '%next development sprint%';

update public.quiz_questions
   set options = replace(options::text, 'sprint de desarrollo', 'ciclo de desarrollo')::jsonb
 where question_group_id = '7a84201e-dfe4-4a4e-9939-8293a8c23177'
   and language = 'es-419' and options::text like '%sprint de desarrollo%';

update public.quiz_questions
   set options = replace(options::text, 'sprint de desenvolvimento', 'ciclo de desenvolvimento')::jsonb
 where question_group_id = '7a84201e-dfe4-4a4e-9939-8293a8c23177'
   and language = 'pt-BR' and options::text like '%sprint de desenvolvimento%';


-- ===========================================================================
-- GROUP 27af7c07 | task 5.9 | "next sprint review" as a deferral
-- ===========================================================================

update public.quiz_questions
   set options = replace(options::text, 'next sprint review', 'next service review')::jsonb
 where question_group_id = '27af7c07-79ba-48b3-9736-54847fad3a58'
   and language = 'en' and options::text like '%next sprint review%';

-- Spanish reads "para la proxima revision del sprint"; only the tail needs to move.
update public.quiz_questions
   set options = replace(options::text, 'del sprint', 'del servicio')::jsonb
 where question_group_id = '27af7c07-79ba-48b3-9736-54847fad3a58'
   and language = 'es-419' and options::text like '%del sprint%';

-- Portuguese reads "para a proxima revisao de sprint".
update public.quiz_questions
   set options = replace(options::text, 'de sprint', U&'de servi\00e7o')::jsonb
 where question_group_id = '27af7c07-79ba-48b3-9736-54847fad3a58'
   and language = 'pt-BR' and options::text like '%de sprint%';


-- ===========================================================================
-- GROUP 51af5a11 | task 5.9 | "next sprint review" as a deferral
-- ===========================================================================

update public.quiz_questions
   set options = replace(options::text, 'next sprint review', 'next service review')::jsonb
 where question_group_id = '51af5a11-c6ad-49ec-8833-a1c26e2eb794'
   and language = 'en' and options::text like '%next sprint review%';

update public.quiz_questions
   set options = replace(options::text, 'Sprint Review',
                         U&'revisi\00f3n del servicio')::jsonb
 where question_group_id = '51af5a11-c6ad-49ec-8833-a1c26e2eb794'
   and language = 'es-419' and options::text like '%Sprint Review%';

update public.quiz_questions
   set options = replace(options::text, 'Sprint Review',
                         U&'revis\00e3o de servi\00e7o')::jsonb
 where question_group_id = '51af5a11-c6ad-49ec-8833-a1c26e2eb794'
   and language = 'pt-BR' and options::text like '%Sprint Review%';


-- ---------------------------------------------------------------------------
-- VERIFY
--
-- (a) no AISM-I item carries agile vocabulary in any language. Expect 0.
-- select count(*) as agile_items
--   from public.quiz_questions
--  where certification_id = (select id from public.certifications where code='AISM-I')
--    and retired_at is null
--    and options::text ~* '\m(sprint|scrum|product backlog|user stor)';
--
-- (b) the four groups still hold valid JSON with 4 options and an unchanged key.
--     Expect 12 rows, opts = 4 throughout.
-- select question_group_id, language, jsonb_array_length(options) as opts, correct_answer
--   from public.quiz_questions
--  where question_group_id in (
--    'f619e028-b920-4f68-84d9-5b44372b4385',
--    '7a84201e-dfe4-4a4e-9939-8293a8c23177',
--    '27af7c07-79ba-48b3-9736-54847fad3a58',
--    '51af5a11-c6ad-49ec-8833-a1c26e2eb794')
--  order by question_group_id, language;
--
-- (c) no mojibake introduced. Expect 0.
-- select count(*) as mojibake
--   from public.quiz_questions
--  where certification_id = (select id from public.certifications where code='AISM-I')
--    and options::text like '%' || chr(195) || chr(162) || '%';
--
-- (d) then re-run the gate: node scripts\verify-cert.mjs --cert AISM-I
--     Expect "No out-of-domain (agile) vocabulary  0 / 1098 en items" as PASS.
-- ---------------------------------------------------------------------------
