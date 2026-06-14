-- 017_seed_domain6_ai.sql  (v2 — dollar-quoted text to avoid apostrophe escaping)
-- =============================================================================
-- Seed Domain 6 — "The Scrum Master with AI-Augmented Teams" — and its 7-task
-- JTA for SM-I. Structural first brick of the AI track; concepts, lessons, and
-- exam items follow later.
--
-- v2 note: all free-text fields use dollar-quoting ($jta$...$jta$) so embedded
-- apostrophes (Scrum's, team's) and em-dashes never need escaping and cannot be
-- broken by copy/paste. Same content and structure as v1.
--
-- SAFE STAGING (must not disturb the live exam or dashboard):
--   * D6 inserted at weight_pct = 0.00, D1-D5 untouched -> the deferred
--     weight-sum trigger still sees exactly 100.00 at commit.
--   * All 7 tasks is_exam_scope = FALSE. The exam engine 409s until every
--     exam-scope task has secure items; flipping these to scope now (no items)
--     would break the live exam. They flip — and weights rebalance to the 90Q
--     split — in a LATER migration, after D6 secure items exist.
--   * 6.7 is a simulation candidate (Bloom 5), not exam-scope.
--
-- Idempotent: domain upserts on id; tasks guarded by not-exists on code.
-- order_index = (current max for the cert) + n, so D6 sorts after D5.
-- Cert SM-I = 11111111-1111-1111-1111-111111111111. D6 = ...006.
-- =============================================================================

-- ---- Domain 6 (weight 0.00 for now) ------------------------------------------
insert into public.domains (id, certification_id, code, title, description, weight_pct, order_index)
values (
  'd0d10001-0000-0000-0000-000000000006',
  '11111111-1111-1111-1111-111111111111',
  'D6',
  $jta$The Scrum Master with AI-Augmented Teams$jta$,
  $jta$Applying Scrum's empirical foundation — transparency, inspection, and adaptation — when a Scrum Team incorporates AI agents into its work: the human accountabilities that must be preserved, the new impediments automation introduces, and the Scrum Master's role in safeguarding empiricism when AI accelerates output beyond the team's capacity to inspect it.$jta$,
  0.00,
  6
)
on conflict (id) do update
  set title = excluded.title,
      description = excluded.description,
      order_index = excluded.order_index;

-- ---- Domain 6 tasks (6.1-6.7), exam_scope FALSE ------------------------------
insert into public.tasks
  (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
   is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index)
select
  '11111111-1111-1111-1111-111111111111',
  'd0d10001-0000-0000-0000-000000000006',
  v.code, v.statement,
  v.crit::criticality, v.freq::task_frequency, v.bloom::bloom_level,
  false, v.sim,
  v.knowledge, v.skills, v.abilities,
  (select coalesce(max(order_index), 0) from public.tasks
     where certification_id = '11111111-1111-1111-1111-111111111111') + v.ord
from (values
  ('6.1',
   $jta$Explain how AI agents participate in a Scrum Team as tools, and which accountabilities must remain human$jta$,
   'high', 'per_sprint', '2_understand', false,
   $jta$AI agents are tools the Scrum Team uses, not members of it. The Scrum Guide's accountabilities — Product Owner, Scrum Master, Developers — are held by people; AI holds none of them.$jta$,
   $jta$Separate tool-use from accountability; articulate why AI cannot own the Sprint Goal, the Definition of Done, or the team's self-management.$jta$,
   $jta$Frame AI's role for a team or stakeholder without diluting human accountability.$jta$,
   1),
  ('6.2',
   $jta$Apply the Definition of Done and artifact transparency to work generated or assisted by AI$jta$,
   'high', 'per_sprint', '3_apply', false,
   $jta$The Definition of Done applies equally to AI-assisted work. An Increment is only Done when it meets the DoD and is transparent and inspectable, regardless of whether a person or an AI produced the draft.$jta$,
   $jta$Assess AI-produced output against the Definition of Done before it becomes part of the Increment.$jta$,
   $jta$Coach Developers to treat AI output as a draft subject to the DoD, never as automatically Done.$jta$,
   2),
  ('6.3',
   $jta$Identify the new impediments that arise in AI-augmented teams$jta$,
   'high', 'per_sprint', '4_analyze', false,
   $jta$AI augmentation introduces distinct impediments: review bottlenecks when generated output exceeds the team's capacity to inspect it, over-trust that lets unverified AI output enter the Increment, and erosion of shared understanding when members rely on private AI assistance.$jta$,
   $jta$Recognize these impediment patterns in a team's behavior and flow.$jta$,
   $jta$Surface and categorize AI-related impediments so they can be removed.$jta$,
   3),
  ('6.4',
   $jta$Analyze how AI-accelerated output can threaten empiricism, and how the Scrum Master safeguards inspection and adaptation$jta$,
   'high', 'per_sprint', '4_analyze', false,
   $jta$Empiricism rests on the team's ability to inspect work and adapt. When AI generates output faster than the team can inspect it, transparency and inspection degrade and adaptation lags. The Scrum Master protects the cadence of inspect-and-adapt rather than raw output.$jta$,
   $jta$Trace how output velocity without inspection erodes the empirical pillars.$jta$,
   $jta$Intervene to restore inspection and adaptation when automation outpaces them.$jta$,
   4),
  ('6.5',
   $jta$Distinguish work a team may delegate to AI from the accountabilities it must retain$jta$,
   'high', 'per_sprint', '4_analyze', false,
   $jta$Teams may delegate drafting, generation, analysis, and summarization to AI, always subject to human inspection. They may not delegate commitment to the Sprint Goal, the Definition of Done, self-management, facilitation of Scrum events, or accountability for the Increment.$jta$,
   $jta$Classify activities as safely delegable or necessarily retained.$jta$,
   $jta$Guide a team to use AI for leverage without surrendering its accountabilities.$jta$,
   5),
  ('6.6',
   $jta$Use AI-generated signal as input to inspection without ceding the team's decision-making$jta$,
   'medium', 'per_sprint', '3_apply', false,
   $jta$AI can surface flow metrics, impediment patterns, and defect trends that feed inspection — for example, in the Sprint Retrospective — but the team interprets the signal and decides. Metrics inform decisions; they do not make them.$jta$,
   $jta$Bring AI-derived signal into Scrum events while keeping interpretation and decisions with the team.$jta$,
   $jta$Use AI analysis to enrich, not replace, the team's inspection and adaptation.$jta$,
   6),
  ('6.7',
   $jta$Diagnose an AI-augmentation anti-pattern and coach the team back toward empiricism and self-management$jta$,
   'high', 'occasional', '5_evaluate', true,
   $jta$Common anti-patterns include shipping unverified AI output, treating velocity gains as the objective, and individuals deferring judgment to AI. Effective coaching restores inspection, shared understanding, and human accountability.$jta$,
   $jta$Evaluate a complex, realistic scenario and choose an intervention that restores empiricism.$jta$,
   $jta$Coach a team through an AI-augmentation dysfunction without abandoning Scrum's principles.$jta$,
   7)
) as v(code, statement, crit, freq, bloom, sim, knowledge, skills, abilities, ord)
where not exists (
  select 1 from public.tasks t
  where t.certification_id = '11111111-1111-1111-1111-111111111111'
    and t.code = v.code
);

-- ---- VERIFICATION (run separately) -------------------------------------------
-- Expect 7 D6 tasks, all is_exam_scope = false, 6.7 sim = true:
-- select code, bloom_level, criticality, is_exam_scope, is_simulation_candidate, order_index
--   from public.tasks
--  where domain_id = 'd0d10001-0000-0000-0000-000000000006'
--  order by order_index;
-- Confirm domain weights still sum to exactly 100.00 (D6 = 0.00):
-- select sum(weight_pct) from public.domains
--  where certification_id = '11111111-1111-1111-1111-111111111111';
