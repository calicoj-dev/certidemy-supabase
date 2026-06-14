-- 018_seed_domain6_concepts.sql
-- =============================================================================
-- Seed Domain 6 concepts + task_concepts links for SM-I.
--
-- Design: all D6 concepts are NEW and AI-specific. D6 applies Scrum's
-- foundations (transparency, inspection, adaptation, empiricism) under AI, but
-- rather than reuse the generic D1 concepts, each foundation gets a distinct
-- *applied* concept (e.g. increment-transparency-ai, empiricism-under-
-- acceleration) so D6 mastery reads as "holds Scrum together under AI," not as
-- foundational mastery.
--
-- 15 concepts across 7 tasks (2 each; 6.3 has 3 for its three impediment types).
-- All free text dollar-quoted ($jta$). Idempotent via NOT EXISTS on
-- (certification_id, slug) for concepts and (task_id, concept_id) for links —
-- no dependency on a named unique constraint.
--
-- Cert SM-I = 11111111-1111-1111-1111-111111111111. D6 = d0d10001-...-006.
-- =============================================================================

-- ---- Concepts ----------------------------------------------------------------
insert into public.concepts (certification_id, slug, name, description)
select '11111111-1111-1111-1111-111111111111', v.slug, v.name, v.description
from (values
  ($jta$ai-as-tool-not-team-member$jta$,
   $jta$AI as tool, not team member$jta$,
   $jta$AI agents are tools the Scrum Team uses; they are not members of the team and hold no Scrum accountabilities.$jta$),
  ($jta$human-held-accountabilities$jta$,
   $jta$Human-held accountabilities$jta$,
   $jta$The Product Owner, Scrum Master, and Developer accountabilities are always held by people; AI cannot own the Sprint Goal, the Definition of Done, or self-management.$jta$),
  ($jta$dod-applies-to-ai-output$jta$,
   $jta$Definition of Done applies to AI output$jta$,
   $jta$AI-generated or AI-assisted work must meet the same Definition of Done as any other work before it is part of the Increment.$jta$),
  ($jta$increment-transparency-ai$jta$,
   $jta$Increment transparency with AI$jta$,
   $jta$The Increment must remain transparent and inspectable whether a person or an AI produced the draft; provenance and review preserve that transparency.$jta$),
  ($jta$ai-review-bottleneck$jta$,
   $jta$Review bottleneck$jta$,
   $jta$An impediment in which AI generates output faster than the team can inspect it, so review — not creation — becomes the constraint on flow.$jta$),
  ($jta$automation-over-trust$jta$,
   $jta$Automation over-trust$jta$,
   $jta$An impediment in which unverified AI output is accepted into the Increment because the team over-trusts the tool.$jta$),
  ($jta$eroded-shared-understanding-ai$jta$,
   $jta$Eroded shared understanding$jta$,
   $jta$An impediment in which reliance on private AI assistance fragments the team's shared understanding of the work.$jta$),
  ($jta$empiricism-under-acceleration$jta$,
   $jta$Empiricism under acceleration$jta$,
   $jta$Empiricism depends on the team's capacity to inspect and adapt; when AI accelerates output past that capacity, the empirical pillars degrade.$jta$),
  ($jta$sm-safeguards-inspection$jta$,
   $jta$Safeguarding inspection and adaptation$jta$,
   $jta$The Scrum Master protects the cadence of inspection and adaptation rather than maximizing raw output, keeping empiricism intact under AI acceleration.$jta$),
  ($jta$delegable-ai-work$jta$,
   $jta$Delegable AI work$jta$,
   $jta$Work a team can safely delegate to AI — drafting, generation, analysis, summarization — always subject to human inspection.$jta$),
  ($jta$retained-accountabilities$jta$,
   $jta$Retained accountabilities$jta$,
   $jta$Responsibilities that must stay human: commitment to the Sprint Goal, the Definition of Done, self-management, event facilitation, and accountability for the Increment.$jta$),
  ($jta$ai-signal-informs-inspection$jta$,
   $jta$AI signal informs inspection$jta$,
   $jta$AI-surfaced metrics and patterns — flow, impediments, defects — serve as inputs to inspection, for example in the Sprint Retrospective.$jta$),
  ($jta$metrics-inform-not-decide$jta$,
   $jta$Metrics inform, not decide$jta$,
   $jta$AI-derived signal informs the team's decisions; the team interprets and decides rather than letting metrics govern.$jta$),
  ($jta$ai-augmentation-anti-patterns$jta$,
   $jta$AI-augmentation anti-patterns$jta$,
   $jta$Recognizable dysfunctions: shipping unverified AI output, treating velocity gains as the goal, and deferring human judgment to AI.$jta$),
  ($jta$coaching-restore-empiricism$jta$,
   $jta$Coaching to restore empiricism$jta$,
   $jta$Interventions that bring a team back to inspection, shared understanding, self-management, and human accountability.$jta$)
) as v(slug, name, description)
where not exists (
  select 1 from public.concepts c
  where c.certification_id = '11111111-1111-1111-1111-111111111111'
    and c.slug = v.slug
);

-- ---- task_concepts links -----------------------------------------------------
insert into public.task_concepts (task_id, concept_id)
select t.id, c.id
from (values
  ('6.1', 'ai-as-tool-not-team-member'),
  ('6.1', 'human-held-accountabilities'),
  ('6.2', 'dod-applies-to-ai-output'),
  ('6.2', 'increment-transparency-ai'),
  ('6.3', 'ai-review-bottleneck'),
  ('6.3', 'automation-over-trust'),
  ('6.3', 'eroded-shared-understanding-ai'),
  ('6.4', 'empiricism-under-acceleration'),
  ('6.4', 'sm-safeguards-inspection'),
  ('6.5', 'delegable-ai-work'),
  ('6.5', 'retained-accountabilities'),
  ('6.6', 'ai-signal-informs-inspection'),
  ('6.6', 'metrics-inform-not-decide'),
  ('6.7', 'ai-augmentation-anti-patterns'),
  ('6.7', 'coaching-restore-empiricism')
) as m(task_code, concept_slug)
join public.tasks t
  on t.certification_id = '11111111-1111-1111-1111-111111111111'
 and t.domain_id = 'd0d10001-0000-0000-0000-000000000006'
 and t.code = m.task_code
join public.concepts c
  on c.certification_id = '11111111-1111-1111-1111-111111111111'
 and c.slug = m.concept_slug
where not exists (
  select 1 from public.task_concepts tc
  where tc.task_id = t.id and tc.concept_id = c.id
);

-- ---- VERIFICATION (run separately) -------------------------------------------
-- 15 D6 concepts:
-- select count(*) from public.concepts
--  where certification_id = '11111111-1111-1111-1111-111111111111'
--    and slug in ('ai-as-tool-not-team-member','human-held-accountabilities',
--      'dod-applies-to-ai-output','increment-transparency-ai','ai-review-bottleneck',
--      'automation-over-trust','eroded-shared-understanding-ai',
--      'empiricism-under-acceleration','sm-safeguards-inspection','delegable-ai-work',
--      'retained-accountabilities','ai-signal-informs-inspection',
--      'metrics-inform-not-decide','ai-augmentation-anti-patterns',
--      'coaching-restore-empiricism');
-- 15 links, grouped by task (expect 6.1-6.7, 6.3 with 3):
-- select t.code, c.slug, c.name
--   from public.tasks t
--   join public.task_concepts tc on tc.task_id = t.id
--   join public.concepts c on c.id = tc.concept_id
--  where t.domain_id = 'd0d10001-0000-0000-0000-000000000006'
--  order by t.code, c.slug;
