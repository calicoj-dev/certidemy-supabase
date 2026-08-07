-- 183_isms_f_sixth_public_sample.sql
-- ISMS-F held five public sample questions where CERT-PUBLISH-CHECKLIST section
-- 2 specifies six. Adds a sixth. Public samples are free to view, so six costs
-- nothing and the carousel rotates better.
--
-- ADDITIVE, NOT A RESELECTION. The existing five are left alone deliberately.
-- They cover distinct territory - MFA reasoning, prompt egress, agent
-- attribution, awareness, review records - and read well. Four of them are
-- 2_understand, which sits against the checklist's apply-and-analyze rule, but
-- that rule was almost certainly tightened after ISMS-F shipped. Reselecting
-- five working items to satisfy a later rule would be churn.
--
-- THE PICK: task 4.8, 4_analyze, difficulty 3. Concentration risk - five models
-- from one provider is not supplier diversification. Chosen because:
--   - 4_analyze, which only one of the existing five is
--   - a task not already represented (existing: 1.2, 3.9, 4.6, 4.9, 5.3)
--   - the idea is genuinely non-obvious, which is what a showcase should show
--
-- Practice pool only. The firewall invariant is untouched.
--
-- ASCII only.

begin;

with pick as (
  select q.question_group_id
  from public.quiz_questions q
  join public.tasks t on t.id = q.task_id
  join public.certifications c on c.id = q.certification_id
  where c.code = 'ISMS-F'
    and q.pool = 'practice'
    and q.language = 'en'
    and t.code = '4.8'
    and q.question_text like '%five models from one provider%'
  order by q.id
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
-- select t.code, t.bloom_level, q.language, left(q.question_text, 80) as stem
-- from public.quiz_questions q
-- join public.tasks t on t.id = q.task_id
-- join public.certifications c on c.id = q.certification_id
-- where c.code = 'ISMS-F' and q.visibility = 'public'
-- order by t.code, q.language;
-- EXPECT 18 rows across six task codes: 1.2, 3.9, 4.6, 4.8, 4.9, 5.3
--
-- select c.code, count(*) as public_secure_leak
-- from public.quiz_questions q
-- join public.certifications c on c.id = q.certification_id
-- where q.pool = 'secure' and q.visibility <> 'secure'
-- group by c.code;
-- EXPECT no rows. Firewall check across the WHOLE catalogue, not just ISMS-F.
