-- 184_aie_i_distinct_tasks.sql
-- AIE-I had six public sample questions across only FIVE distinct tasks: task
-- 2.4 held two. CERT-PUBLISH-CHECKLIST section 2 requires six DISTINCT tasks,
-- and names this exact defect as AIHR-I's migration 149, corrected by 150.
-- AIE-I has the same defect and nobody caught it until a catalogue-wide count
-- was run on 2026-08-07.
--
-- THE SWAP
--   OUT  task 2.4, difficulty 2 - hedging language as a confidence signal.
--   IN   task 3.3, difficulty 4 - a team leader disagrees with an AI
--        recommendation to put someone on a performance improvement plan.
--
-- Why that pair. The two 2.4 items were both about trusting output - one on
-- hedging, one on fabricated citations - and the fabrication item is the more
-- concrete of the two, so it stays. The replacement is human oversight where
-- the stakes are real and the pressure to defer is strong, which is the
-- AI-literacy question that matters most for a non-technical audience: knowing
-- you are allowed to override.
--
-- It also improves the mix. AIE-I's showcase was four 2_understand of six; this
-- makes it three, and adds the only difficulty-4 item in the set.
--
-- Practice pool only. The firewall invariant is untouched.
--
-- ASCII only.

begin;

-- out: the 2.4 hedging item
update public.quiz_questions q
set visibility = 'private'
from public.quiz_questions src
join public.tasks t on t.id = src.task_id
join public.certifications c on c.id = src.certification_id
where q.question_group_id = src.question_group_id
  and q.pool = 'practice'
  and c.code = 'AIE-I'
  and src.language = 'en'
  and src.visibility = 'public'
  and t.code = '2.4'
  and src.question_text like '%hedges with phrases%';

-- in: the 3.3 oversight item
with pick as (
  select src.question_group_id
  from public.quiz_questions src
  join public.tasks t on t.id = src.task_id
  join public.certifications c on c.id = src.certification_id
  where c.code = 'AIE-I'
    and src.pool = 'practice'
    and src.language = 'en'
    and t.code = '3.3'
    and src.question_text like '%performance improvement plan%'
  order by src.id
  limit 1
)
update public.quiz_questions q
set visibility = 'public'
from pick p
where q.question_group_id = p.question_group_id
  and q.pool = 'practice';

commit;

-- ============================================================
-- VERIFICATION (run separately)
-- ============================================================
-- select t.code, t.bloom_level, q.difficulty, left(q.question_text, 80) as stem
-- from public.quiz_questions q
-- join public.tasks t on t.id = q.task_id
-- join public.certifications c on c.id = q.certification_id
-- where c.code = 'AIE-I' and q.visibility = 'public' and q.language = 'en'
-- order by t.code;
-- EXPECT 6 rows, six DISTINCT task codes: 1.3, 1.6, 2.4, 2.5, 3.3, 3.5
--
-- Catalogue-wide, the check that found this:
-- select c.code,
--        count(*) filter (where q.visibility='public' and q.language='en') as public_en,
--        count(distinct q.task_id) filter (where q.visibility='public') as distinct_tasks
-- from public.certifications c
-- left join public.quiz_questions q on q.certification_id = c.id
-- group by c.code order by c.code;
-- EXPECT 6 and 6 on all nine certs.
