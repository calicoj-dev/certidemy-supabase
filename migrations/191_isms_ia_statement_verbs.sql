-- 191_isms_ia_statement_verbs.sql
-- ISMS-IA: correct 8 task statements and 7 skills fields.
--
-- WHY
--
-- verify-cert reported two FAILs and one WARN on ISMS-IA's verbs:
--
--   FAIL  Statement verb agrees with declared level
--         3.5: verb level 6 ("construct") vs declared 3_apply
--         5.3: verb level 6 ("construct") vs declared 3_apply
--
--   WARN  Statement verbs are recognisable Bloom verbs
--         3.6 "test" · 2.1 "derive" · 4.2/4.3/4.5/4.6 "audit"
--
-- This is Rule 5b (LESSON_AUTHORING_SPEC / HANDOFF v3.5): MCQ-assessability and
-- cognitive level are SEPARATE constraints, and a task statement can publish a
-- verb at a level the exam is not built to. A published JTA showing "construct"
-- on a task the exam builds at apply is a discrepancy an auditor finds by
-- reading two of our own documents side by side.
--
-- THE LARGER HALF, WHICH NO INVARIANT CHECKS
--
-- verify-cert reads tasks.statement. It does NOT read tasks.skills - and the
-- skills field is GENERATOR INPUT. ISMS-F task 5.2's skills phrasing propagated
-- a false attribution into generated exam items and survived three regeneration
-- attempts from corrected source fields.
--
-- Scanning all 38 skills fields found SEVEN instructing the generator to have a
-- candidate write, design or compose something:
--
--   3.5 "Rewrite a leading or closed question..."
--   5.3 "Write a statement naming the requirement..."
--   2.3 "Write scope, criteria and objectives..."
--   3.6 "Design a test that would establish..."
--   2.1 "Derive defensible programme objectives..."
--   2.5 "Compose a team for a described audit scope..."
--   3.9 "Record an evidence trail another auditor could follow."
--
-- None is scoreable by a selected-response instrument. Each would have shaped
-- items toward a task the exam cannot assess. Fixed here alongside the
-- statements, because fixing only what the invariant catches leaves the defect
-- in the field the generator actually reads.
--
-- ON THE FOUR "audit" VERBS
--
-- verify-cert warned rather than failed, correctly - it asks for judgment. The
-- judgment: "audit" is the job title, not a cognitive verb, and "Audit clause 5"
-- is circular in a credential about auditing. Task 4.1 already showed the better
-- pattern - "Determine whether a declared ISMS scope is complete and defensible
-- against clause 4" - and it passed clean.
--
-- WHAT DOES NOT CHANGE
--
-- No bloom_level, criticality, frequency, order_index, domain or concept link is
-- touched. The cognitive profile stays 5.00 / 29.40 / 65.60 and the blueprint
-- written by 190 remains correct. Re-run verify-cert to confirm rather than
-- assume.
--
-- Task codes are immutable and untouched (trg_guard_cert_identity guards the
-- cert row; task codes are guarded by convention and by every downstream
-- reference).

-- ---------------------------------------------------------------------------
-- 1. STATEMENTS (8)
-- ---------------------------------------------------------------------------

-- 3.5 — FAIL. "Construct" is a create verb on an apply task. The assessable
-- competence is judging which question form produces evidence, not writing one.
update public.tasks set statement =
  $$Select the question form that elicits evidence rather than confirmation in a given interview situation.$$
where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417' and code = '3.5';

-- 5.3 — FAIL. Same defect. Writing a nonconformity statement is out of scope by
-- the scheme's own section 2; judging whether one is adequate is not.
update public.tasks set statement =
  $$Select the nonconformity statement that correctly links the evidence to the requirement it fails.$$
where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417' and code = '5.3';

-- 3.6 — WARN. "Test" is an activity, not a cognitive verb.
update public.tasks set statement =
  $$Determine whether an Annex A control operates as claimed in the Statement of Applicability.$$
where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417' and code = '3.6';

-- 2.1 — WARN. "Derive" is outside the map.
update public.tasks set statement =
  $$Determine audit programme objectives from the organization's ISMS objectives, its information security risks, and the results of previous audits.$$
where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417' and code = '2.1';

-- 4.2 — WARN. "Audit" replaced, and the statement now names what the clause
-- actually asks for: evidence that top management DEMONSTRATED commitment.
update public.tasks set statement =
  $$Determine whether evidence shows top management has demonstrated the leadership, policy and role assignments clause 5 requires.$$
where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417' and code = '4.2';

-- 4.3 — WARN.
update public.tasks set statement =
  $$Determine whether an organization's risk assessment, risk treatment, information security objectives and planning of changes conform to clause 6.$$
where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417' and code = '4.3';

-- 4.5 — WARN. Declared apply, so "Select" rather than "Determine".
update public.tasks set statement =
  $$Select the evidence that would establish conformity with a given clause 7 requirement for competence, awareness or documented information.$$
where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417' and code = '4.5';

-- 4.6 — WARN.
update public.tasks set statement =
  $$Determine whether operational planning and control and the clause 9.1 measurement arrangements are operating as planned.$$
where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417' and code = '4.6';

-- ---------------------------------------------------------------------------
-- 2. SKILLS FIELDS (7) — generator input, checked by no invariant
-- ---------------------------------------------------------------------------

-- 3.5  was: "Rewrite a leading or closed question into one that produces evidence."
update public.tasks set skills =
  $$Determine which of several question forms would produce evidence rather than confirmation in a described interview.$$
where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417' and code = '3.5';

-- 5.3  was: "Write a statement naming the requirement, the evidence and the gap..."
update public.tasks set skills =
  $$Determine which of several candidate statements names the requirement, the evidence and the gap without prescribing the remedy.$$
where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417' and code = '5.3';

-- 2.3  was: "Write scope, criteria and objectives for a described audit..."
update public.tasks set skills =
  $$Determine whether a described audit's scope, criteria and objectives are consistent with one another and with the programme.$$
where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417' and code = '2.3';

-- 3.6  was: "Design a test that would establish whether a described control operates as claimed..."
update public.tasks set skills =
  $$Determine which evidence would establish whether a described control operates as claimed, and what a given result shows.$$
where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417' and code = '3.6';

-- 2.1  was: "Derive defensible programme objectives from a described organization's..."
update public.tasks set skills =
  $$Determine which programme objectives a described organization's ISMS objectives, risk profile and audit history support.$$
where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417' and code = '2.1';

-- 2.5  was: "Compose a team for a described audit scope and justify each role."
update public.tasks set skills =
  $$Determine an appropriate team composition for a described audit scope and what each role contributes to it.$$
where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417' and code = '2.5';

-- 3.9  was: "Record an evidence trail another auditor could follow."
update public.tasks set skills =
  $$Determine what a working-paper record must contain for a finding to remain defensible to a second auditor.$$
where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417' and code = '3.9';

-- ---------------------------------------------------------------------------
-- VERIFICATION
-- ---------------------------------------------------------------------------
--
-- Every statement changed - expect 8 rows, none starting with construct, test,
-- derive or audit:
--
--   select code, bloom_level, left(statement, 70) from public.tasks
--   where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417'
--     and code in ('2.1','3.5','3.6','4.2','4.3','4.5','4.6','5.3')
--   order by order_index;
--
-- No create-level verb survives anywhere in statement or skills - expect 0 rows:
--
--   select code, statement, skills from public.tasks
--   where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417'
--     and (statement ~* '^(construct|design|compose|write|create|develop|formulate)'
--       or skills     ~* '\m(rewrite|write|design|compose|create|draft|record an)\M');
--
-- Profile unchanged - expect 5.00 / 29.40 / 65.60:
--
--   select bloom_level, tasks, pct_of_form from public.v_cognitive_profile
--   where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417' order by bloom_level;
--
-- THEN:
--
--   node scripts\verify-cert.mjs --cert ISMS-IA
--
-- Expect the two verb FAILs and the verb WARN to clear, leaving 5 failures - all
-- of them content that does not exist yet (concepts taught, concepts tested,
-- secure floor, practice floor, pool can fill a form).
--
-- ---------------------------------------------------------------------------
-- OWED: the documents now disagree with the database
-- ---------------------------------------------------------------------------
--
-- ISMS-IA_JTA_v2.0 and SCHEME-ISMS-IA.md carry the OLD statements for these
-- eight tasks, and the JTA carries the old skills for seven. The database is
-- correct; the documents are stale. Update both before either is treated as the
-- scheme of record, and record the change as an erratum against JTA v2.0 - no
-- candidate has been assessed against anything, and no item exists.
