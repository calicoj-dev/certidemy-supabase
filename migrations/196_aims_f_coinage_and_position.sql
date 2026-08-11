-- 196_aims_f_coinage_and_position.sql
--
-- TWO DEFECTS IN THE AIMS-F ITEM BANK, ONE PASS.
--
-- A. INVENTED ACRONYMS - 402 rows.
--
-- The Spanish and Portuguese banks call the AI management system SGSIA, SGIA or
-- SGAI. None of these terms exists. They were coined independently by two
-- translators from a shared fixed-rendering rule, exactly as commits 6b93649
-- and 3e5d70a recorded for the LESSON layer - where they were fixed. Nobody
-- swept the item bank, so 402 rows still carry them, including live secure exam
-- items a candidate sits.
--
-- The correct rendering is the one the cleaned lessons use, spelled out:
--   es-419  sistema de gestion de IA      (with accent: gestion -> gestio'n)
--   pt-BR   sistema de gestao de IA       (with tilde: gestao -> gesta~o)
--
-- SGSI stays. It is the correct Spanish and Portuguese rendering for an
-- ISO/IEC 27001 ISMS, and AIMS-F legitimately discusses 27001 integration in
-- several items. AIMS untranslated also stays - 35 of 35 lessons per language
-- use it, so it is the established convention, not a defect.
--
-- SAFETY OF A BLIND REPLACE. Every one of the 402 occurrences was checked for
-- its preceding word: del, do, un, um, su, seu, el, o, de, al, ao, no, pelo,
-- nuevo, unico, proyecto. All masculine-agreeing, zero feminine, zero plural.
-- "sistema" is masculine in both languages, so a bare token swap preserves every
-- article and possessive. SGSIA is replaced before SGIA so the shorter pattern
-- cannot clip the longer one.
--
-- B. ANSWER-POSITION BIAS - chi2 11.8 against a 11.34 threshold.
--
-- The secure English distribution is 50/64/88/78 on 280 items; expected 70 each.
-- A candidate who guesses c on every uncertain item gains a measurable edge over
-- one who guesses a. Migration 193 already moved three keys off b; this closes
-- the rest.
--
-- 18 groups keyed c and 4 keyed d have their option TEXT swapped with position
-- a, and the key updated to follow. Option ids stay in place, so nothing that
-- references them breaks. Applied to all three language rows of each group,
-- because the languages are position-aligned.
--
-- Result: 72 / 64 / 70 / 74, chi2 ~0.9 - clear rather than scraping the line.
--
-- Zero attempts exist on any AIMS-F item, so both operations are safe.
--
-- EDITOR NOTE: each statement runs on its own connection. Run them in order.

-- ============================================================================
-- 1. BEFORE. Record the counts. Expect sgsia 41, sgia 75, sgai 286.
-- ============================================================================

select
  count(*) filter (where q.question_text || q.options::text ~ '\mSGSIA\M') as sgsia,
  count(*) filter (where q.question_text || q.options::text ~ '\mSGIA\M')  as sgia,
  count(*) filter (where q.question_text || q.options::text ~ '\mSGAI\M')  as sgai,
  count(*) filter (where q.question_text || q.options::text ~ '\mSGSI\M')  as sgsi_keep
from public.quiz_questions q
where q.certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4'
  and q.retired_at is null and q.language <> 'en';

-- ============================================================================
-- 2. es-419 COINAGE. SGSIA first, then SGIA, then SGAI.
-- ============================================================================

update public.quiz_questions q
set question_text = regexp_replace(
      regexp_replace(
        regexp_replace(q.question_text, '\mSGSIA\M', 'sistema de gestion de IA', 'g'),
      '\mSGIA\M', 'sistema de gestion de IA', 'g'),
    '\mSGAI\M', 'sistema de gestion de IA', 'g'),
    options = replace(replace(replace(q.options::text,
      'SGSIA', 'sistema de gestion de IA'),
      'SGIA',  'sistema de gestion de IA'),
      'SGAI',  'sistema de gestion de IA')::jsonb,
    explanation = regexp_replace(
      regexp_replace(
        regexp_replace(coalesce(q.explanation, ''), '\mSGSIA\M', 'sistema de gestion de IA', 'g'),
      '\mSGIA\M', 'sistema de gestion de IA', 'g'),
    '\mSGAI\M', 'sistema de gestion de IA', 'g')
where q.certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4'
  and q.retired_at is null and q.language = 'es-419'
  and (q.question_text || q.options::text || coalesce(q.explanation, '')) ~ '\m(SGSIA|SGIA|SGAI)\M';

-- ============================================================================
-- 3. pt-BR COINAGE.
-- ============================================================================

update public.quiz_questions q
set question_text = regexp_replace(
      regexp_replace(
        regexp_replace(q.question_text, '\mSGSIA\M', 'sistema de gestao de IA', 'g'),
      '\mSGIA\M', 'sistema de gestao de IA', 'g'),
    '\mSGAI\M', 'sistema de gestao de IA', 'g'),
    options = replace(replace(replace(q.options::text,
      'SGSIA', 'sistema de gestao de IA'),
      'SGIA',  'sistema de gestao de IA'),
      'SGAI',  'sistema de gestao de IA')::jsonb,
    explanation = regexp_replace(
      regexp_replace(
        regexp_replace(coalesce(q.explanation, ''), '\mSGSIA\M', 'sistema de gestao de IA', 'g'),
      '\mSGIA\M', 'sistema de gestao de IA', 'g'),
    '\mSGAI\M', 'sistema de gestao de IA', 'g')
where q.certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4'
  and q.retired_at is null and q.language = 'pt-BR'
  and (q.question_text || q.options::text || coalesce(q.explanation, '')) ~ '\m(SGSIA|SGIA|SGAI)\M';

-- ============================================================================
-- 4. ACCENTS. The replacements above are ASCII so the migration file stays
--    ASCII-safe; restore the correct orthography here.
-- ============================================================================

update public.quiz_questions q
set question_text = replace(q.question_text, 'sistema de gestion de IA', 'sistema de gesti' || chr(243) || 'n de IA'),
    options       = replace(q.options::text, 'sistema de gestion de IA', 'sistema de gesti' || chr(243) || 'n de IA')::jsonb,
    explanation   = replace(coalesce(q.explanation, ''), 'sistema de gestion de IA', 'sistema de gesti' || chr(243) || 'n de IA')
where q.certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4'
  and q.language = 'es-419'
  and (q.question_text || q.options::text || coalesce(q.explanation, '')) like '%sistema de gestion de IA%';

update public.quiz_questions q
set question_text = replace(q.question_text, 'sistema de gestao de IA', 'sistema de gest' || chr(227) || 'o de IA'),
    options       = replace(q.options::text, 'sistema de gestao de IA', 'sistema de gest' || chr(227) || 'o de IA')::jsonb,
    explanation   = replace(coalesce(q.explanation, ''), 'sistema de gestao de IA', 'sistema de gest' || chr(227) || 'o de IA')
where q.certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4'
  and q.language = 'pt-BR'
  and (q.question_text || q.options::text || coalesce(q.explanation, '')) like '%sistema de gestao de IA%';

-- ============================================================================
-- 5. POSITION: 18 GROUPS c -> a. Swaps the TEXT of options a and c, then moves
--    the key. All three language rows of each group move together.
-- ============================================================================

with listed(question_group_id) as (values
    ('026019a6-d792-4745-9432-f08779fcd2da'::uuid),
    ('04503d37-bd29-4aa7-8176-cfdef94f6ac4'::uuid),
    ('0696d500-09f7-4618-8aa9-145692489a7d'::uuid),
    ('120c8d2a-5b93-4fae-9919-7751ad1fece7'::uuid),
    ('169a753a-c530-40ee-97d5-4fcc792d9628'::uuid),
    ('19cfe1a8-e380-4ccd-985c-4d5702527495'::uuid),
    ('1bea1c5d-2195-4087-8fdf-5cda8ce556ee'::uuid),
    ('1e47611e-fa45-4fc2-a4e1-829e2d37aa57'::uuid),
    ('2599c725-5f56-4d2d-94c6-b8bec958694e'::uuid),
    ('27b36526-a345-4552-804c-4d84a61d6d49'::uuid),
    ('287086de-aff4-4a13-a846-8faae4158ef0'::uuid),
    ('28e39de2-b9c9-41cb-9ad1-075b0e9759b1'::uuid),
    ('2ee9b0fe-0476-4700-8c0a-8805aa1bbd9f'::uuid),
    ('2fbfcf36-e514-4535-a8bd-934a519a089f'::uuid),
    ('3004a725-25b0-4b35-a40d-7a1a7efd5d3f'::uuid),
    ('3454e95d-3fc3-4278-956e-4eb95adb3f78'::uuid),
    ('38c31103-66d8-4091-970f-46af30695165'::uuid),
    ('3ab92365-c76b-4b46-9c12-2b2deb97e104'::uuid)
)
update public.quiz_questions q
set options = (
      select jsonb_agg(
        case o->>'id'
          when 'a' then jsonb_set(o, '{text}', (select o2->'text' from jsonb_array_elements(q.options) o2 where o2->>'id' = 'c'))
          when 'c' then jsonb_set(o, '{text}', (select o2->'text' from jsonb_array_elements(q.options) o2 where o2->>'id' = 'a'))
          else o end
        order by ord)
      from jsonb_array_elements(q.options) with ordinality t(o, ord)),
    correct_answer = '["a"]'::jsonb
from listed l
where q.question_group_id = l.question_group_id
  and q.retired_at is null
  and q.correct_answer = '["c"]'::jsonb;

-- ============================================================================
-- 6. POSITION: 4 GROUPS d -> a.
-- ============================================================================

with listed(question_group_id) as (values
    ('0180a589-fc14-4e26-80e2-e23d9aaa0416'::uuid),
    ('01b5e03b-3309-4cf3-98db-4fb91165b8a3'::uuid),
    ('01d41bd7-1553-46c1-b957-ab1def83ebd6'::uuid),
    ('03650bbc-2c21-44c0-8df2-e5911acc0cfc'::uuid)
)
update public.quiz_questions q
set options = (
      select jsonb_agg(
        case o->>'id'
          when 'a' then jsonb_set(o, '{text}', (select o2->'text' from jsonb_array_elements(q.options) o2 where o2->>'id' = 'd'))
          when 'd' then jsonb_set(o, '{text}', (select o2->'text' from jsonb_array_elements(q.options) o2 where o2->>'id' = 'a'))
          else o end
        order by ord)
      from jsonb_array_elements(q.options) with ordinality t(o, ord)),
    correct_answer = '["a"]'::jsonb
from listed l
where q.question_group_id = l.question_group_id
  and q.retired_at is null
  and q.correct_answer = '["d"]'::jsonb;

-- ============================================================================
-- PROOF
-- ============================================================================

-- 7. No coinage remains; SGSI survives. Expect 0 / 0 / 0 and sgsi_keep > 0.
select
  count(*) filter (where q.question_text || q.options::text || coalesce(q.explanation,'') ~ '\mSGSIA\M') as sgsia,
  count(*) filter (where q.question_text || q.options::text || coalesce(q.explanation,'') ~ '\mSGIA\M')  as sgia,
  count(*) filter (where q.question_text || q.options::text || coalesce(q.explanation,'') ~ '\mSGAI\M')  as sgai,
  count(*) filter (where q.question_text || q.options::text || coalesce(q.explanation,'') ~ '\mSGSI\M')  as sgsi_keep
from public.quiz_questions q
where q.certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4'
  and q.retired_at is null and q.language <> 'en';

-- 8. Every key still resolves, and every item still has four options.
--    Expect 0 rows.
select q.id, q.language, q.correct_answer, jsonb_array_length(q.options) as n
from public.quiz_questions q
where q.certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4'
  and q.retired_at is null
  and (jsonb_array_length(q.options) <> 4
       or not exists (select 1 from jsonb_array_elements(q.options) o
                      where o->>'id' = q.correct_answer->>0));

-- 9. New secure-en distribution. Expect roughly 72 / 64 / 70 / 74.
select q.correct_answer->>0 as key, count(*) as n
from public.quiz_questions q
where q.certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4'
  and q.pool = 'secure' and q.language = 'en' and q.retired_at is null
group by 1 order by 1;

-- 10. Languages still agree on key position within each group. Expect 0 rows.
select q.question_group_id, count(distinct q.correct_answer::text) as distinct_keys
from public.quiz_questions q
where q.certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4'
  and q.retired_at is null and q.question_group_id is not null
group by q.question_group_id having count(distinct q.correct_answer::text) > 1;
