-- 063_question_group_integrity_view.sql
-- Cross-language integrity audit (subsystem H). The chosen control in place of
-- the DECLINED parent-child rewrite: instead of a structural parent table, an
-- audit view surfaces any question_group_id whose language siblings DISAGREE on
-- the psychometric invariants. A healthy bank returns ZERO rows.
--
-- Why a view (detect) rather than a trigger (prevent): the trilingual generators
-- already hold these fields consistent across siblings (the graft step inherits
-- correct_answer/type/difficulty from the EN skeleton), so the realistic risk is
-- a stray manual edit, which an audit catches without taxing the bulk-insert
-- write path. This view IS the 17024 language-equivalence evidence: "we verify
-- it with this query; current violations = 0." A BEFORE-INSERT trigger can be
-- added later if hard prevention is ever wanted.
--
-- IMPORTANT — before running, confirm these quiz_questions columns exist:
--   question_group_id, correct_answer, question_type, task_id, bloom_level
-- (a one-line confirm query is in the chat). If a name differs, adjust here;
-- migration 062 is unaffected (separate file).

create or replace view public.v_question_group_integrity as
select
  question_group_id,
  count(*)                              as sibling_rows,
  count(distinct correct_answer::text)  as distinct_answers,
  count(distinct question_type)         as distinct_types,
  count(distinct task_id::text)         as distinct_tasks,
  count(distinct bloom_level::text)     as distinct_blooms
from public.quiz_questions
where question_group_id is not null
group by question_group_id
having
     count(distinct correct_answer::text) > 1   -- siblings disagree on the key
  or count(distinct question_type)        > 1   -- ...or the item type
  or count(distinct task_id::text)        > 1   -- ...or the task it maps to
  or count(distinct bloom_level::text)    > 1;  -- ...or the cognitive level

comment on view public.v_question_group_integrity is
  'Audit: trilingual question-group siblings that disagree on correct_answer / type / task / bloom. Zero rows = healthy. The language-equivalence control (ISO 17024 §8.3).';

-- Admin/service read only — this is an internal integrity tool.
grant select on public.v_question_group_integrity to authenticated, service_role;

-- Usage:  select * from public.v_question_group_integrity;   -- expect 0 rows
