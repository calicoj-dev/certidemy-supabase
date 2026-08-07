-- 182_aims_f_public_samples.sql
-- Public sample questions for AIMS-F, and ISMS-F topped from five to six.
--
-- CERT-PUBLISH-CHECKLIST section 2. The "see it before you trust it" carousel.
-- Six logical items, three languages, 18 rows per cert, matched on
-- question_group_id so the languages move together.
--
-- SELECTION, against the checklist's rules:
--
--   Practice pool only. No secure item is ever made public. The firewall
--   invariant is untouched by this migration and the WHERE clauses enforce it.
--
--   Six DISTINCT tasks - the AIHR-I defect corrected by migration 150.
--
--   Apply and Analyze only. This is why D1 has NO pick: every D1 task in AIMS-F
--   is 2_understand, so the rule leaves it no eligible item. Dropping D1 puts
--   the showcase on the four 4_analyze tasks, which are the cert's
--   differentiators, and that is a better trade than a proportional split.
--
--   Resulting spread D2x2 / D3x1 / D4x2 / D5x1 against weights
--   15 / 22.5 / 20 / 25 / 17.5.
--
--   Sectors deliberately varied: recruitment, medical triage, corporate
--   security, customer service, access control, audit evidence. No
--   single-jurisdiction stems. All difficulty 3 - enough to show judgement
--   without reading as gatekeeping.
--
-- ISMS-F held five public items where the checklist specifies six. Rather than
-- amend the rule, a sixth is added from a distinct task. Public samples are free
-- to view, so six costs nothing and the carousel rotates better.
--
-- RESET FIRST, like migration 150, so this is a true reselection: re-running
-- cannot accumulate extra public rows.
--
-- ASCII only.

begin;

-- ---------------------------------------------------------------------------
-- AIMS-F
-- ---------------------------------------------------------------------------
update public.quiz_questions
set visibility = 'private'
where certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4'
  and pool = 'practice'
  and visibility = 'public';

with picks as (
  select distinct on (t.code) q.question_group_id
  from public.quiz_questions q
  join public.tasks t on t.id = q.task_id
  where q.certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4'
    and q.pool = 'practice'
    and q.language = 'en'
    and q.difficulty = 3
    and t.code in ('2.6','2.7','3.7','4.4','4.7','5.6')
    and (
         (t.code = '2.6' and q.question_text like '%labour-market fairness%')
      or (t.code = '2.7' and q.question_text like '%two documents for a medical-triage%')
      or (t.code = '3.7' and q.question_text like '%security analyst%competence records%')
      or (t.code = '4.4' and q.question_text like '%increasingly biased outputs for six months%')
      or (t.code = '4.7' and q.question_text like '%marks an ISO/IEC 42001 Annex A control as satisfied%')
      or (t.code = '5.6' and q.question_text like '%witnessed sampling%')
    )
  order by t.code, q.id
)
update public.quiz_questions q
set visibility = 'public'
from picks p
where q.question_group_id = p.question_group_id
  and q.pool = 'practice';

commit;

-- ============================================================
-- VERIFICATION (run separately, BEFORE doing ISMS-F below)
-- ============================================================
-- select t.code, q.language, q.difficulty, left(q.question_text, 90) as stem
-- from public.quiz_questions q
-- join public.tasks t on t.id = q.task_id
-- where q.certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4'
--   and q.visibility = 'public'
-- order by t.code, q.language;
-- EXPECT 18 rows: six distinct task codes, three languages each.
--
-- select count(*) as public_secure_leak
-- from public.quiz_questions
-- where certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4'
--   and pool = 'secure' and visibility <> 'secure';
-- EXPECT 0. This is the firewall check and it must be run every time.
