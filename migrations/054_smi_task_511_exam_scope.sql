-- 054_smi_task_511_exam_scope.sql
--
-- Completes the SM-AI-I D6 remap (see 052). Task 5.11 (formerly D6 6.7,
-- "Diagnose an AI-augmentation anti-pattern and coach the team back toward
-- empiricism and self-management") was re-homed to D5 in 052 but left
-- is_exam_scope=false because it had no secure-pool items — flipping it then
-- would have claimed exam-scope the allocator couldn't honor.
--
-- Its secure pool has since been generated via scripts/gen-spo-i-secure.mjs
-- (cert-agnostic; CERT_ID=SM-AI-I, TASK_ID=51e98735…): 8 items/language
-- (en/es-419/pt-BR), pool='secure', is_exam_scope=true, status='approved',
-- and — per the secure firewall — ZERO question_concepts links (verified at 0).
--
-- This flips 5.11 to exam-scope. Result: all 7 re-homed AI tasks are now
-- tested, D5 is 11/11 exam-scope, and AI is examined in every domain of
-- SM-AI-I. Editor-first; this is the record. Idempotent.

update public.tasks set is_exam_scope = true
where id = '51e98735-cda1-486b-8db7-537131e78872'
  and certification_id = '11111111-1111-1111-1111-111111111111'
  and is_exam_scope = false;

-- Verify (expected): D5 -> 11 tasks / 11 exam_scope; all domains fully scoped.
-- select d.code, count(t.id) as tasks,
--        count(t.id) filter (where t.is_exam_scope) as exam_scope
-- from public.domains d left join public.tasks t on t.domain_id=d.id
-- where d.certification_id='11111111-1111-1111-1111-111111111111'
-- group by d.code order by d.code;
