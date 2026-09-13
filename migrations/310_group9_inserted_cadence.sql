-- 310_group9_inserted_cadence.sql
--
-- BOTH TRANSLATIONS INSERTED A CADENCE THE ENGLISH DOES NOT HAVE, TWICE.
--
-- ISMS-F practice group 0987a554. The English explanation says the context
-- determination is "something the organization returns to" and states no
-- interval anywhere - deliberately, because clause 4.1 imposes none and 9.3.2
-- only requires the management review to CONSIDER changes. That distinction is
-- the whole repair.
--
-- es-419 rendered it "algo a lo que la organizacion debe volver periodicamente".
-- pt-BR rendered it "algo a que a organizacao deve retornar periodicamente".
--
-- INDEPENDENTLY, IN TWO LANGUAGES, ACROSS TWO SEPARATE REGENERATIONS. That is
-- not a slip. It is the translator supplying what the sentence feels like it
-- should say, and what it feels like it should say is the ISO 9001 cadence the
-- English repair had just removed.
--
-- AND EACH TRANSLATION CONTRADICTS ITSELF TWO CLAUSES EARLIER. The Spanish says
-- "El apartado 4.1 no impone un proceso de seguimiento continuo ni un intervalo
-- de revision" and then adds one. The Portuguese does the same. A reader who
-- gets to the end of the paragraph is told both things.
--
-- THE FIX IS A DELETION AND THE GRAMMAR SURVIVES IT. "debe volver" and "deve
-- retornar" are complete without the adverb - no gender, no agreement, nothing
-- that substring surgery gets wrong. This is the rare case where a regex is the
-- right tool, and it is the right tool BECAUSE the change is a removal rather
-- than a rewrite.
--
-- ASCII: " peri.dicamente" matches the accented Spanish and the unaccented
-- Portuguese alike, so no multibyte character crosses the editor.
--
-- PINNED, NOT JUST FIXED. scripts/lib/pin-compliance.mjs now carries an
-- inserted-cadence rule, and it is the first rule there that is RELATIVE to the
-- English: a periodicity word is correct when the source states an interval -
-- clause 8.2's "planned intervals", which group ecac6a36 renders correctly - and
-- a defect when it does not. Behaviour-tested both ways.
--
-- Run in the Supabase SQL editor.

-- 1. GUARD. Expect 2 rows, both carrying the adverb.
select language, explanation ~ ' peri.dicamente' as has_cadence
from public.quiz_questions
where question_group_id = '0987a554-f0fe-4219-8916-f9445eb5a230' and language <> 'en'
order by language;

-- 2. THE DELETION. Expect 2 rows.
update public.quiz_questions
set explanation = regexp_replace(explanation, ' peri.dicamente', '')
where question_group_id = '0987a554-f0fe-4219-8916-f9445eb5a230'
  and language <> 'en'
  and explanation ~ ' peri.dicamente';

-- 3. POSITIVE: the adverb is gone from both. Expect 0.
select count(*) as still_has_cadence
from public.quiz_questions
where question_group_id = '0987a554-f0fe-4219-8916-f9445eb5a230'
  and explanation ~ ' peri.dicamente';

-- 4. POSITIVE: the sentence still ends in a complete verb phrase. Expect 2.
select count(*) as verb_intact
from public.quiz_questions
where question_group_id = '0987a554-f0fe-4219-8916-f9445eb5a230'
  and language <> 'en'
  and explanation ~ '(debe volver|deve retornar)\.';

-- 5. NEGATIVE: the clause-imposes-no-interval sentence is untouched, so the
--    paragraph no longer contradicts itself. Expect 2.
select count(*) as denial_intact
from public.quiz_questions
where question_group_id = '0987a554-f0fe-4219-8916-f9445eb5a230'
  and language <> 'en'
  and explanation ~ '(ni un intervalo de revisi|nem um intervalo de revis)';

-- 6. NEGATIVE: the English row is untouched, so its hash has not moved and the
--    other 26 approvals stand without regenerating. Expect 1 and false.
select count(*) as en_rows,
       bool_or(explanation ~* 'periodic|interval') as en_mentions_cadence
from public.quiz_questions
where question_group_id = '0987a554-f0fe-4219-8916-f9445eb5a230' and language = 'en';

-- 7. NEGATIVE: nothing outside this group was touched. Expect 3.
select count(*) as rows_in_group
from public.quiz_questions
where question_group_id = '0987a554-f0fe-4219-8916-f9445eb5a230';
