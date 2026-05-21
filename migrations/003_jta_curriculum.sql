-- =============================================================================
-- Migration 003: JTA framework, sectioned lessons, widgets, format preferences
-- =============================================================================
-- Run AFTER 001 and 002. Idempotent on extensions only — re-running will error
-- on duplicate tables/columns. For a fresh start, run after a clean DB reset.
--
-- Sections:
--   1. Schema fixes (SMPC passing score 70 -> 80)
--   2. JTA tables (domains, tasks, task_concepts)
--   3. Quiz question additions (bloom_level, is_exam_scope, task_id)
--   4. Lesson sectioning (lesson_sections, lesson task mapping)
--   5. Widget definitions
--   6. Lesson format preferences
--   7. Simulation scaffolding (Phase 2)
--   8. Translation grouping (lesson_group_id)
--   9. RLS policies for new tables
--  10. Seed data: 5 domains and 34 tasks for SMPC
--  11. Seed data: new concepts identified in JTA v2
--  12. Seed data: link tasks to concepts
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Schema fixes
-- -----------------------------------------------------------------------------
-- SMPC actually requires 80% (32/40) to pass — verified from CertiProf.
-- Our initial schema had 70%. Fix it.
update public.certifications
set passing_score_pct = 80.00
where code = 'SMPC';

-- GAIPC also typically 80% on CertiProf; align it too.
update public.certifications
set passing_score_pct = 80.00
where code = 'GAIPC';


-- -----------------------------------------------------------------------------
-- 2. JTA tables
-- -----------------------------------------------------------------------------

-- Domains: 4-6 per certification, weights sum to 100%.
create table public.domains (
  id                uuid primary key default uuid_generate_v4(),
  certification_id  uuid not null references public.certifications(id) on delete cascade,
  code              text not null,                -- 'D1', 'D2', ...
  title             text not null,
  description       text,
  weight_pct        numeric(5,2) not null check (weight_pct >= 0 and weight_pct <= 100),
  order_index       integer not null,
  created_at        timestamptz not null default now(),
  unique (certification_id, code),
  unique (certification_id, order_index)
);

-- Sanity constraint: weights per cert must sum to 100. Enforced by trigger
-- because Postgres doesn't support cross-row CHECK constraints.
create or replace function check_domain_weights_sum() returns trigger language plpgsql as $$
declare
  total numeric(6,2);
begin
  select coalesce(sum(weight_pct), 0) into total
  from public.domains
  where certification_id = coalesce(new.certification_id, old.certification_id);
  -- Allow small floating-point slop (99.95 to 100.05).
  if abs(total - 100) > 0.05 then
    raise exception 'Domain weights for certification % sum to %, must equal 100',
      coalesce(new.certification_id, old.certification_id), total;
  end if;
  return null;  -- AFTER trigger, return value ignored
end$$;

-- Note: we attach the trigger DEFERRABLE so seed-inserts work as a batch.
create constraint trigger trg_domain_weights_sum
  after insert or update or delete on public.domains
  deferrable initially deferred
  for each row execute function check_domain_weights_sum();

-- Tasks: 4-10 per domain. Each task is the foundation for one or more lessons
-- and one or more questions. Tasks ARE the JTA — the rest of the schema maps
-- back to them.
create type criticality   as enum ('high','medium','low');
create type task_frequency as enum ('daily','weekly','per_sprint','per_exam','occasional');
create type bloom_level    as enum ('1_remember','2_understand','3_apply','4_analyze','5_evaluate','6_create');

create table public.tasks (
  id                 uuid primary key default uuid_generate_v4(),
  certification_id   uuid not null references public.certifications(id) on delete cascade,
  domain_id          uuid not null references public.domains(id)         on delete cascade,
  code               text not null,                  -- '1.1', '1.2', '2.5' ...
  statement          text not null,                  -- action-verb-led task statement
  criticality        criticality not null,
  frequency          task_frequency not null,
  bloom_level        bloom_level not null,           -- highest Bloom level the task targets
  is_exam_scope      boolean not null default true,  -- false = mastery-tier only
  is_simulation_candidate boolean not null default false,  -- flagged for Phase 2 AI sims
  knowledge          text,                            -- what they must KNOW
  skills             text,                            -- what they must be able to DO
  abilities          text,                            -- behavioral traits required
  notes              text,                            -- author notes / terminology drift / exam tips
  order_index        integer not null,
  created_at         timestamptz not null default now(),
  unique (certification_id, code),
  unique (domain_id, order_index)
);

-- Many-to-many: tasks <-> concepts. A task typically tags 1-5 concepts.
create table public.task_concepts (
  task_id    uuid not null references public.tasks(id)    on delete cascade,
  concept_id uuid not null references public.concepts(id) on delete cascade,
  primary key (task_id, concept_id)
);

create index on public.tasks (certification_id, domain_id);
create index on public.tasks (bloom_level);


-- -----------------------------------------------------------------------------
-- 3. Quiz question additions
-- -----------------------------------------------------------------------------
alter table public.quiz_questions
  add column bloom_level     bloom_level not null default '2_understand',
  add column is_exam_scope   boolean     not null default true,
  add column task_id         uuid        references public.tasks(id) on delete set null,
  add column status          text        not null default 'approved'
    check (status in ('pending_review','approved','rejected'));

create index on public.quiz_questions (task_id);
create index on public.quiz_questions (status) where status <> 'approved';
create index on public.quiz_questions (bloom_level);


-- -----------------------------------------------------------------------------
-- 4. Lesson sectioning
-- -----------------------------------------------------------------------------
-- Lessons keep their original row (for backwards compatibility and for the
-- legacy `content_md` field). We add structured sectioning on top.
--
-- A lesson now has:
--   - lessons.content_md (legacy, can store the FULL markdown source w/ DSL)
--   - lesson_sections rows (parsed sections for the dual renderer)

create type lesson_section_kind as enum (
  'hook','concept','diagram','interactive','deep_dive','callout','checkpoint','summary'
);

create table public.lesson_sections (
  id            uuid primary key default uuid_generate_v4(),
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  kind          lesson_section_kind not null,
  order_index   integer not null,
  title         text,
  body_md       text,            -- markdown body for text-bearing kinds
  config        jsonb,           -- widget config, callout type, diagram type, checkpoint qs
  created_at    timestamptz not null default now(),
  unique (lesson_id, order_index)
);
create index on public.lesson_sections (lesson_id, order_index);

-- Lessons can teach multiple tasks; tasks can be taught by multiple lessons.
create table public.lesson_tasks (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  task_id   uuid not null references public.tasks(id)   on delete cascade,
  primary key (lesson_id, task_id)
);
create index on public.lesson_tasks (task_id);


-- -----------------------------------------------------------------------------
-- 5. Widget definitions
-- -----------------------------------------------------------------------------
-- The six widget primitives plus future additions. Frontend reads this table
-- to know which widgets are available and their JSON config schemas.
create table public.widget_definitions (
  id              uuid primary key default uuid_generate_v4(),
  slug            text not null unique,        -- 'drag-match', 'sort-into-order', ...
  display_name    text not null,
  description     text,
  config_schema   jsonb,                       -- JSON Schema for `config` validation
  supported_bloom bloom_level[],               -- which Bloom levels this widget can test
  created_at      timestamptz not null default now()
);


-- -----------------------------------------------------------------------------
-- 6. Lesson format preferences
-- -----------------------------------------------------------------------------
-- Stored per (user, certification). If no row, defaults are applied client-side:
-- mobile + new = focus; desktop or returning = review.
create type lesson_format as enum ('focus','review','auto');

create table public.lesson_format_preferences (
  user_id          uuid not null references public.profiles(id)        on delete cascade,
  certification_id uuid not null references public.certifications(id)  on delete cascade,
  preference       lesson_format not null default 'auto',
  updated_at       timestamptz not null default now(),
  primary key (user_id, certification_id)
);


-- -----------------------------------------------------------------------------
-- 7. Simulation scaffolding (Phase 2)
-- -----------------------------------------------------------------------------
-- Empty for now. The schema is here so Phase 2 work doesn't require another
-- migration; we just start inserting rows when we build simulations.
create type simulation_kind as enum (
  'coach_team',              -- play a team in distress, learner coaches
  'write_dod',               -- learner drafts a DoD, AI evaluates
  'run_retrospective',       -- learner facilitates, AI plays team members
  'impediment_triage',       -- present impediments, learner categorizes + acts
  'find_anti_pattern',       -- transcript / scenario, learner identifies issue
  'boundary_diagnosis'       -- who-should-do-this scenarios
);

create table public.simulations (
  id                uuid primary key default uuid_generate_v4(),
  certification_id  uuid not null references public.certifications(id) on delete cascade,
  task_id           uuid not null references public.tasks(id)          on delete cascade,
  kind              simulation_kind not null,
  title             text not null,
  description       text,
  setup_prompt      text not null,   -- system prompt context for Claude
  rubric            jsonb,           -- scoring criteria
  difficulty        smallint not null default 3 check (difficulty between 1 and 5),
  estimated_minutes integer,
  created_at        timestamptz not null default now()
);

create table public.simulation_attempts (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id)     on delete cascade,
  simulation_id  uuid not null references public.simulations(id)  on delete cascade,
  transcript     jsonb not null,        -- full conversation history
  score          numeric(4,3),          -- 0-1
  feedback_md    text,
  completed_at   timestamptz,
  started_at     timestamptz not null default now()
);
create index on public.simulation_attempts (user_id, completed_at desc);


-- -----------------------------------------------------------------------------
-- 8. Translation grouping
-- -----------------------------------------------------------------------------
-- Lessons (and later, questions) translated into ES-419 / PT-BR are stored as
-- separate rows pointing to a shared lesson_group_id. The canonical English
-- lesson IS the group "head" — its lesson_group_id = its own id.
alter table public.lessons
  add column lesson_group_id uuid,
  add column language         text not null default 'en';

create index on public.lessons (lesson_group_id);

-- Same for questions, in case we translate the question bank later.
alter table public.quiz_questions
  add column question_group_id uuid,
  add column language           text not null default 'en';

create index on public.quiz_questions (question_group_id);


-- -----------------------------------------------------------------------------
-- 9. Row Level Security for new tables
-- -----------------------------------------------------------------------------
alter table public.domains                    enable row level security;
alter table public.tasks                      enable row level security;
alter table public.task_concepts              enable row level security;
alter table public.lesson_sections            enable row level security;
alter table public.lesson_tasks               enable row level security;
alter table public.widget_definitions         enable row level security;
alter table public.lesson_format_preferences  enable row level security;
alter table public.simulations                enable row level security;
alter table public.simulation_attempts        enable row level security;

-- Catalog tables: readable by all authenticated users; admin-only writes.
create policy "auth read domains"             on public.domains              for select using (auth.role() = 'authenticated');
create policy "admin write domains"           on public.domains              for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "auth read tasks"               on public.tasks                for select using (auth.role() = 'authenticated');
create policy "admin write tasks"             on public.tasks                for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "auth read task_concepts"       on public.task_concepts        for select using (auth.role() = 'authenticated');
create policy "admin write task_concepts"     on public.task_concepts        for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "auth read lesson_sections"     on public.lesson_sections      for select using (auth.role() = 'authenticated');
create policy "admin write lesson_sections"   on public.lesson_sections      for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "auth read lesson_tasks"        on public.lesson_tasks         for select using (auth.role() = 'authenticated');
create policy "admin write lesson_tasks"      on public.lesson_tasks         for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "auth read widget_definitions"  on public.widget_definitions   for select using (auth.role() = 'authenticated');
create policy "admin write widget_definitions" on public.widget_definitions for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "auth read simulations"         on public.simulations          for select using (auth.role() = 'authenticated');
create policy "admin write simulations"       on public.simulations          for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- User-owned data.
create policy "own format prefs" on public.lesson_format_preferences for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own simulation_attempts" on public.simulation_attempts for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "team_admin read simulation_attempts" on public.simulation_attempts for select
  using (public.is_team_admin_of(user_id) or public.is_platform_admin());


-- =============================================================================
-- 10. Seed data: domains for SMPC
-- =============================================================================
-- Using fixed UUIDs so future migrations / seeds can reference them stably.

set constraints trg_domain_weights_sum deferred;

insert into public.domains (id, certification_id, code, title, description, weight_pct, order_index) values
  ('d0d10001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'D1',
   'Agile Foundations & Empirical Thinking',
   'The why beneath Scrum: Agile values and principles, empirical process control, Scrum values, lean thinking, and complexity framing.',
   12.50, 1),
  ('d0d10001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'D2',
   'The Scrum Team & Accountabilities',
   'Composition, the three accountabilities, self-management, cross-functionality.',
   22.50, 2),
  ('d0d10001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'D3',
   'Scrum Events',
   'The five Scrum events: purpose, timeboxes, attendees, outputs, anti-patterns.',
   25.00, 3),
  ('d0d10001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'D4',
   'Scrum Artifacts & Commitments',
   'The three artifacts plus their commitments (Product Goal, Sprint Goal, Definition of Done), refinement, INVEST, burndowns.',
   17.50, 4),
  ('d0d10001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'D5',
   'Scrum Master in Practice & Organizational Context',
   'Facilitation, coaching, impediment removal, psychological safety, organizational adoption, scaling basics, terminology drift.',
   22.50, 5);


-- =============================================================================
-- 11. Seed data: new concepts identified in JTA v2
-- =============================================================================
-- The original schema already had a few concepts (agile-values, sm-accountabilities,
-- sprint-events, definition-of-done, etc). We add the rest here.

insert into public.concepts (certification_id, slug, name, description) values
  -- Domain 1 additions
  ('11111111-1111-1111-1111-111111111111', 'agile-principles',          'Twelve Agile principles',                    'The twelve principles behind the Agile Manifesto.'),
  ('11111111-1111-1111-1111-111111111111', 'empirical-process',         'Empirical process control',                  'Knowledge from experience and decisions from observation.'),
  ('11111111-1111-1111-1111-111111111111', 'inspection',                'Inspection',                                 'Frequent inspection of artifacts and progress.'),
  ('11111111-1111-1111-1111-111111111111', 'adaptation',                'Adaptation',                                 'Adjusting process or work based on inspection.'),
  ('11111111-1111-1111-1111-111111111111', 'cynefin-framework',         'Cynefin framework',                          'Sense-making framework distinguishing simple/complicated/complex/chaotic problems.'),
  ('11111111-1111-1111-1111-111111111111', 'complex-vs-complicated',    'Complex vs complicated',                     'When iteration is required vs when planning suffices.'),
  ('11111111-1111-1111-1111-111111111111', 'empirical-vs-predictive',   'Empirical vs predictive process',            'Choosing between iterative and plan-driven approaches.'),
  ('11111111-1111-1111-1111-111111111111', 'lean-thinking',             'Lean thinking',                              'Small batches, flow, waste reduction, deferred commitment.'),
  ('11111111-1111-1111-1111-111111111111', 'iterative-incremental',     'Iterative and incremental development',      'Building in iterations that each add increments of value.'),
  ('11111111-1111-1111-1111-111111111111', 'artifact-transparency',     'Artifact transparency',                      'Artifacts must be visible to support inspection and adaptation.'),

  -- Domain 2 additions
  ('11111111-1111-1111-1111-111111111111', 'scrum-team-composition',    'Scrum Team composition',                     'One PO + one SM + Developers; no sub-teams.'),
  ('11111111-1111-1111-1111-111111111111', 'team-size',                 'Scrum Team size',                            'Typically 10 or fewer people.'),
  ('11111111-1111-1111-1111-111111111111', 'sm-accountability-team-effectiveness', 'Scrum Master accountability for team effectiveness', 'The central accountability of the Scrum Master per 2020 Guide.'),
  ('11111111-1111-1111-1111-111111111111', 'sm-serves-team',            'Scrum Master serves the Scrum Team',         'Coaching, facilitating events, helping focus on DoD, removing impediments.'),
  ('11111111-1111-1111-1111-111111111111', 'sm-serves-po',              'Scrum Master serves the Product Owner',      'Helping with Product Goal, Product Backlog, planning, stakeholder collaboration.'),
  ('11111111-1111-1111-1111-111111111111', 'sm-serves-org',             'Scrum Master serves the organization',       'Leading, training, coaching Scrum adoption; planning implementations; removing barriers.'),
  ('11111111-1111-1111-1111-111111111111', 'po-accountability',         'Product Owner accountability',               'Maximizing product value resulting from the work of the Scrum Team.'),
  ('11111111-1111-1111-1111-111111111111', 'product-value',             'Product value',                              'The value the PO is accountable for maximizing.'),
  ('11111111-1111-1111-1111-111111111111', 'po-one-person',             'Product Owner is one person',                'PO is one person, not a committee.'),
  ('11111111-1111-1111-1111-111111111111', 'developer-accountability',  'Developer accountabilities',                 'Sprint Backlog, DoD, daily adaptation, mutual accountability.'),
  ('11111111-1111-1111-1111-111111111111', 'self-managing',             'Self-managing teams',                        '2020 term: teams decide who, how, and what to work on within their boundaries.'),
  ('11111111-1111-1111-1111-111111111111', 'self-organizing-deprecated', 'Self-organizing (deprecated)',              'Pre-2020 term; replaced by self-managing.'),
  ('11111111-1111-1111-1111-111111111111', 'accountability-boundaries', 'Accountability boundaries',                  'What each accountability owns and does not own.'),
  ('11111111-1111-1111-1111-111111111111', 'sm-vs-pm-anti-pattern',     'Scrum Master vs project manager anti-pattern','SM acting like a PM is a common dysfunction.'),
  ('11111111-1111-1111-1111-111111111111', 'cross-functional',          'Cross-functional team',                      'The team collectively has all skills needed to deliver value.'),
  ('11111111-1111-1111-1111-111111111111', 't-shaped-skills',           'T-shaped skills',                            'Depth in one area, breadth across many — a useful pattern within cross-functional teams.'),
  ('11111111-1111-1111-1111-111111111111', 'developer-broad-definition','Developer broad definition',                 'Developer means anyone contributing to the Increment, not just software engineers.'),

  -- Domain 3 additions
  ('11111111-1111-1111-1111-111111111111', 'timeboxes',                 'Timeboxes',                                  'Maximum durations for each Scrum event.'),
  ('11111111-1111-1111-1111-111111111111', 'sprint',                    'The Sprint',                                 'Fixed-length container for all other events.'),
  ('11111111-1111-1111-1111-111111111111', 'sprint-container',          'Sprint as container',                        'The Sprint contains all other events; no gaps between Sprints.'),
  ('11111111-1111-1111-1111-111111111111', 'sprint-planning',           'Sprint Planning',                            'Event where the Scrum Team plans the Sprint.'),
  ('11111111-1111-1111-1111-111111111111', 'sprint-planning-topics',    'Sprint Planning topics: Why, What, How',     'The 2020 Guide adds Why (Sprint Goal) as the first topic.'),
  ('11111111-1111-1111-1111-111111111111', 'sprint-goal-crafting',      'Crafting the Sprint Goal',                   'Writing a coherent, outcome-focused Sprint Goal.'),
  ('11111111-1111-1111-1111-111111111111', 'daily-scrum',               'Daily Scrum',                                '15-minute Developer-owned event for inspecting progress toward Sprint Goal.'),
  ('11111111-1111-1111-1111-111111111111', 'daily-scrum-purpose',       'Daily Scrum purpose',                        'Progress inspection and next-day plan; not a status report.'),
  ('11111111-1111-1111-1111-111111111111', 'sprint-review',             'Sprint Review',                              'Event to inspect the Increment and adapt the Product Backlog.'),
  ('11111111-1111-1111-1111-111111111111', 'sprint-review-vs-demo',     'Sprint Review is not a demo',                'The Review is a working session with stakeholders, not a sign-off ceremony.'),
  ('11111111-1111-1111-1111-111111111111', 'sprint-retrospective',      'Sprint Retrospective',                       'Event to inspect the Scrum Team itself.'),
  ('11111111-1111-1111-1111-111111111111', 'retrospective-format',      'Retrospective formats',                      'Liked/Learned/Lacked, Start/Stop/Continue, 4Ls, sailboat, etc.'),
  ('11111111-1111-1111-1111-111111111111', 'retrospective-actions',     'Retrospective actionable improvements',      'Turning observations into concrete experiments.'),
  ('11111111-1111-1111-1111-111111111111', 'sprint-cancellation',       'Sprint cancellation',                        'Only the Product Owner can cancel a Sprint; happens when the Sprint Goal becomes obsolete.'),
  ('11111111-1111-1111-1111-111111111111', 'timebox-violations',        'Timebox violations',                         'Events that run past their timebox; common anti-pattern.'),
  ('11111111-1111-1111-1111-111111111111', 'sprint-goal',               'Sprint Goal',                                'Singular objective for the Sprint, committed to as part of Sprint Backlog.'),
  ('11111111-1111-1111-1111-111111111111', 'goal-vs-items',             'Sprint Goal vs selected items',              'Goal is the why; items are the means; items can change while goal remains.'),
  ('11111111-1111-1111-1111-111111111111', 'event-anti-patterns',       'Scrum event anti-patterns',                  'Status-reporting Dailies, demo-only Reviews, blame-game Retros.'),
  ('11111111-1111-1111-1111-111111111111', 'daily-scrum-status-report', 'Daily Scrum as status report (anti-pattern)','Treating Daily Scrum as a manager update.'),
  ('11111111-1111-1111-1111-111111111111', 'review-as-demo',            'Sprint Review as demo (anti-pattern)',       'Treating Review as a one-way demonstration instead of collaborative inspection.'),
  ('11111111-1111-1111-1111-111111111111', 'retro-blame-game',          'Retrospective as blame game (anti-pattern)', 'Retro that produces blame instead of improvements.'),

  -- Domain 4 additions
  ('11111111-1111-1111-1111-111111111111', 'commitments',               'Artifact commitments',                       'Product Goal, Sprint Goal, Definition of Done; added in 2020 Guide.'),
  ('11111111-1111-1111-1111-111111111111', 'product-goal',              'Product Goal',                               'Long-term objective for the product; committed to by the Product Backlog.'),
  ('11111111-1111-1111-1111-111111111111', 'product-backlog',           'Product Backlog',                            'Emergent, ordered list of what is needed to improve the product.'),
  ('11111111-1111-1111-1111-111111111111', 'product-backlog-ordering',  'Product Backlog ordering',                   'PO determines order; ordering reflects value-based decisions.'),
  ('11111111-1111-1111-1111-111111111111', 'product-backlog-ownership', 'Product Backlog ownership',                  'Single PO accountable for content, ordering, and visibility.'),
  ('11111111-1111-1111-1111-111111111111', 'sprint-backlog',            'Sprint Backlog',                             'Sprint Goal + selected PBIs + plan for delivery; created by Developers.'),
  ('11111111-1111-1111-1111-111111111111', 'sprint-backlog-ownership',  'Sprint Backlog ownership',                   'Owned and updated by the Developers; updated daily.'),
  ('11111111-1111-1111-1111-111111111111', 'increment',                 'Increment',                                  'Concrete step toward the Product Goal; must meet DoD to be an Increment.'),
  ('11111111-1111-1111-1111-111111111111', 'dod-creation',              'Definition of Done creation',                'Created by the Scrum Team (2020 change from Developers-only).'),
  ('11111111-1111-1111-1111-111111111111', 'dod-application',           'Applying the Definition of Done',            'Work that does not meet DoD is not an Increment and returns to backlog.'),
  ('11111111-1111-1111-1111-111111111111', 'product-goal-relationship-to-sprint-goal','Product Goal vs Sprint Goal','Each Sprint Goal moves the team closer to the Product Goal.'),
  ('11111111-1111-1111-1111-111111111111', 'imperfect-but-transparent', 'Imperfect but transparent artifacts',         'Artifacts can be partial yet still transparent.'),
  ('11111111-1111-1111-1111-111111111111', 'refinement-as-activity',    'Refinement as activity (not event)',         'Ongoing activity; not one of the five Scrum events.'),
  ('11111111-1111-1111-1111-111111111111', 'refinement-not-event',      'Refinement is not a Scrum event',            'Common misconception clarified.'),
  ('11111111-1111-1111-1111-111111111111', 'burndown-charts',           'Burndown charts',                            'Common (but not Scrum-prescribed) tool for visualizing remaining work.'),
  ('11111111-1111-1111-1111-111111111111', 'velocity',                  'Velocity',                                   'Points completed per Sprint; forecasting tool, not performance metric.'),
  ('11111111-1111-1111-1111-111111111111', 'metrics-not-targets',       'Metrics are not targets (Goodhart\'s Law)',  'Treating metrics as targets corrupts them.'),
  ('11111111-1111-1111-1111-111111111111', 'invest-criteria',           'INVEST criteria',                            'Independent, Negotiable, Valuable, Estimable, Small, Testable.'),
  ('11111111-1111-1111-1111-111111111111', 'pbi-quality',               'Product Backlog Item quality',               'Characteristics of a well-formed PBI.'),

  -- Domain 5 additions
  ('11111111-1111-1111-1111-111111111111', 'impediment-management',     'Impediment management',                      'Identifying, categorizing, and removing impediments.'),
  ('11111111-1111-1111-1111-111111111111', 'impediment-types',          'Impediment types',                           'Internal vs external; immediate vs systemic.'),
  ('11111111-1111-1111-1111-111111111111', 'impediment-vs-problem',     'Impediment vs team-owned problem',           'When the SM should intervene vs let the team resolve.'),
  ('11111111-1111-1111-1111-111111111111', 'team-ownership',            'Team ownership of problems',                 'Self-managing teams own their problems.'),
  ('11111111-1111-1111-1111-111111111111', 'coaching-self-management',  'Coaching toward self-management',            'Helping a team take more ownership over time.'),
  ('11111111-1111-1111-1111-111111111111', 'coaching-stances',          'Coaching stances',                           'Teach, mentor, coach, facilitate — knowing when to use each.'),
  ('11111111-1111-1111-1111-111111111111', 'servant-leadership',        'Servant leadership',                         'Greenleaf concept: leaders serve the team first.'),
  ('11111111-1111-1111-1111-111111111111', 'true-leadership',           'True leadership (2020 term)',                'Scrum Guide 2020 phrasing; servant-leadership substance retained.'),
  ('11111111-1111-1111-1111-111111111111', 'servant-vs-true-leader',    'Servant vs true leader',                     'Terminology drift between Scrum Guide 2020 and CertiProf materials.'),
  ('11111111-1111-1111-1111-111111111111', 'psychological-safety',      'Psychological safety',                       'Edmondson: the team-level belief that interpersonal risk is safe.'),
  ('11111111-1111-1111-1111-111111111111', 'team-trust',                'Team trust',                                 'Trust as foundation for self-management and conflict tolerance.'),
  ('11111111-1111-1111-1111-111111111111', 'coaching-po',               'Coaching the Product Owner',                 'Helping the PO grow without taking ownership.'),
  ('11111111-1111-1111-1111-111111111111', 'po-coaching-techniques',    'PO coaching techniques',                     'Practical patterns for SM-to-PO coaching.'),
  ('11111111-1111-1111-1111-111111111111', 'ceremonies-vs-events-terminology', 'Ceremonies vs Events (terminology)', 'CertiProf sometimes uses "ceremonies"; Scrum Guide 2020 uses "events".'),
  ('11111111-1111-1111-1111-111111111111', 'org-coaching',              'Coaching the organization',                  'SM serves the organization through training and coaching.'),
  ('11111111-1111-1111-1111-111111111111', 'scrum-adoption',            'Scrum adoption',                             'Introducing Scrum at the organizational level.'),
  ('11111111-1111-1111-1111-111111111111', 'org-impediments',           'Organizational impediments',                 'Functional silos, command-and-control, project funding, etc.'),
  ('11111111-1111-1111-1111-111111111111', 'scaling-multiple-teams',    'Scaling: multiple teams, one product',       'One Product Backlog, one PO, one Product Goal regardless of team count.'),
  ('11111111-1111-1111-1111-111111111111', 'single-product-owner-rule', 'Single Product Owner rule',                  'One product = one Product Owner, no exceptions.'),
  ('11111111-1111-1111-1111-111111111111', 'scaling-frameworks-overview','Scaling frameworks overview',               'Nexus, SAFe, LeSS at a high level.');


-- =============================================================================
-- 12. Seed data: 34 tasks for SMPC
-- =============================================================================

-- Convenience macro for domain UUIDs.
do $$
declare
  cert_id  uuid := '11111111-1111-1111-1111-111111111111';
  d1 uuid := 'd0d10001-0000-0000-0000-000000000001';
  d2 uuid := 'd0d10001-0000-0000-0000-000000000002';
  d3 uuid := 'd0d10001-0000-0000-0000-000000000003';
  d4 uuid := 'd0d10001-0000-0000-0000-000000000004';
  d5 uuid := 'd0d10001-0000-0000-0000-000000000005';
begin

-- Domain 1 — Foundations
insert into public.tasks (certification_id, domain_id, code, statement, criticality, frequency, bloom_level, is_simulation_candidate, knowledge, skills, abilities, order_index) values
  (cert_id, d1, '1.1', 'Articulate the Agile Manifesto''s four values and twelve principles',
   'high', 'occasional', '2_understand', false,
   'Manifesto text; 4 values; 12 principles; origin (Snowbird, 2001)',
   'Map a real situation to a specific principle',
   'Reading between the lines — recognizing when a behavior aligns or violates a value', 1),

  (cert_id, d1, '1.2', 'Explain the three pillars of empirical process control (Transparency, Inspection, Adaptation)',
   'high', 'daily', '3_apply', false,
   'Definitions of all three pillars; their interdependence',
   'Diagnose which pillar is broken in a described scenario',
   'Comfort with iterative course-correction; intellectual honesty', 2),

  (cert_id, d1, '1.3', 'Identify the five Scrum Values in workplace behaviors',
   'high', 'daily', '3_apply', false,
   'Commitment, Courage, Focus, Openness, Respect',
   'Recognize which value is being lived (or violated) in a scenario',
   'Modeling values personally; calling them out when missing', 3),

  (cert_id, d1, '1.4', 'Distinguish complex problems suited to Scrum from problems suited to predictive approaches',
   'high', 'occasional', '4_analyze', false,
   'Cynefin framework (simple / complicated / complex / chaotic); when waterfall makes sense',
   'Categorize a real problem accurately',
   'Resisting the "Scrum for everything" anti-pattern', 4),

  (cert_id, d1, '1.5', 'Explain lean thinking principles as they apply to Scrum',
   'medium', 'occasional', '2_understand', false,
   'Small batches, flow, reducing waste, deferred commitment; Scrum''s lean lineage',
   'Identify waste in a Scrum implementation',
   'Bias toward smaller/simpler', 5),

  (cert_id, d1, '1.6', 'Recognize when transparency is compromised and trace consequences',
   'high', 'daily', '4_analyze', true,
   'What transparent artifacts look like; common ways teams hide work or progress',
   'Identify hidden information or inflated status reports',
   'Courage to surface uncomfortable truths', 6);

-- Domain 2 — Team & Accountabilities
insert into public.tasks (certification_id, domain_id, code, statement, criticality, frequency, bloom_level, is_simulation_candidate, knowledge, skills, abilities, order_index) values
  (cert_id, d2, '2.1', 'Define the Scrum Team''s composition and size constraints',
   'high', 'occasional', '1_remember', false,
   'One PO + one SM + Developers; typically ≤ 10 people; no sub-teams or hierarchies',
   'Apply the rule to a described team structure',
   'Comfort with small teams', 1),

  (cert_id, d2, '2.2', 'Explain the Scrum Master''s accountability for the Scrum Team''s effectiveness',
   'high', 'daily', '2_understand', false,
   '"Effectiveness" is the SM''s central accountability per the 2020 Guide',
   'Distinguish effectiveness work from project management work',
   'Outcome focus over output focus', 2),

  (cert_id, d2, '2.3', 'List the three services the Scrum Master provides: to the Team, to the Product Owner, to the organization',
   'high', 'occasional', '1_remember', false,
   'The four ways SM serves the team, the four ways SM serves the PO, the four ways SM serves the org',
   'Identify which service is being performed in a scenario',
   'Service mindset', 3),

  (cert_id, d2, '2.4', 'Explain the Product Owner''s accountability for maximizing product value',
   'high', 'weekly', '2_understand', false,
   'PO is one person, not a committee; accountable for Product Backlog ordering, Product Goal, communication',
   'Recognize when a "Product Owner by committee" pattern emerges',
   'Respect for value-based decision making', 4),

  (cert_id, d2, '2.5', 'Explain the Developers'' four accountabilities',
   'high', 'daily', '2_understand', false,
   'Creating Sprint Backlog; instilling quality via DoD; adapting plan; holding each other accountable',
   'Recognize when developers are dodging accountability',
   'Peer accountability (not boss accountability)', 5),

  (cert_id, d2, '2.6', 'Apply "self-managing" to a described team scenario',
   'high', 'daily', '3_apply', false,
   '2020 shift from "self-organizing" (who and how) to "self-managing" (who, how, what); deprecation note',
   'Identify when a team is being managed externally vs. self-managing',
   'Releasing control as a Scrum Master', 6),

  (cert_id, d2, '2.7', 'Identify accountability boundary violations',
   'high', 'daily', '4_analyze', true,
   'Common violations: SM ordering backlog, PO assigning tasks, developers ignoring DoD, manager attending Daily Scrum',
   'Diagnose the boundary violation and prescribe the correction',
   'Diplomatic but firm', 7),

  (cert_id, d2, '2.8', 'Explain cross-functionality as a property of the whole Scrum Team',
   'medium', 'occasional', '2_understand', false,
   'Cross-functional means the team has all skills needed to deliver value; not every individual is full-stack',
   'Recognize when an apparent skills gap is really a team-formation problem',
   'Hiring/staffing for whole-team skill coverage', 8),

  (cert_id, d2, '2.9', 'Recognize that "Developer" applies to any team member, not just software engineers',
   'medium', 'occasional', '1_remember', false,
   '2020 Guide explicitly removed software-specific language',
   'Apply Scrum outside software domains',
   'Inclusive framing', 9);

-- Domain 3 — Events
insert into public.tasks (certification_id, domain_id, code, statement, criticality, frequency, bloom_level, is_simulation_candidate, knowledge, skills, abilities, order_index) values
  (cert_id, d3, '3.1', 'State the maximum timebox for each event',
   'high', 'daily', '1_remember', false,
   'Sprint ≤ 1 month; Sprint Planning ≤ 8h; Daily Scrum 15m; Sprint Review ≤ 4h; Sprint Retrospective ≤ 3h',
   'Apply proportional rule: shorter Sprints → proportionally shorter Planning/Review/Retro',
   'Timebox discipline', 1),

  (cert_id, d3, '3.2', 'Explain the Sprint as the container for all other events',
   'high', 'occasional', '2_understand', false,
   'Sprints are fixed-length, no gaps between Sprints, all other events occur within',
   'Identify violations (gaps between Sprints, extending a Sprint)',
   'Cadence respect', 2),

  (cert_id, d3, '3.3', 'Identify the three topics of Sprint Planning (Why, What, How)',
   'high', 'per_sprint', '2_understand', false,
   'Why → Sprint Goal (NEW emphasis in 2020); What → Backlog selection; How → plan for delivery',
   'Diagnose Sprint Plannings that skip Why',
   'Holding space for purpose, not just task-listing', 3),

  (cert_id, d3, '3.4', 'Explain the Daily Scrum''s purpose and rules',
   'high', 'daily', '2_understand', false,
   '15-minute timebox; Developers only; inspect progress toward Sprint Goal; produce next-day plan',
   'Reject anti-patterns (status report to manager, SM-led standup)',
   'Stepping back to let team own it', 4),

  (cert_id, d3, '3.5', 'Describe the Sprint Review as a working session, not a status report',
   'high', 'per_sprint', '2_understand', false,
   'Inspect Increment with stakeholders; adapt Product Backlog; not a demo; not a sign-off',
   'Run a Review that produces backlog changes',
   'Inviting genuine feedback, not seeking approval', 5),

  (cert_id, d3, '3.6', 'Describe the Sprint Retrospective''s focus on team process',
   'high', 'per_sprint', '3_apply', true,
   'Inspect Scrum Team itself; identify improvements; produce actionable plan; often add improvement to next Sprint',
   'Run formats (Liked/Learned/Lacked, Start/Stop/Continue, 4Ls, sailboat)',
   'Psychological safety; vulnerability-led leadership', 6),

  (cert_id, d3, '3.7', 'Identify when a Sprint can be canceled and by whom',
   'high', 'occasional', '1_remember', false,
   'Only the PO can cancel; happens when Sprint Goal becomes obsolete; rare and traumatic',
   'Recognize when cancellation is warranted vs. overreaction',
   'Restraint with the cancellation lever', 7),

  (cert_id, d3, '3.8', 'Apply timebox rules to scenarios',
   'high', 'daily', '3_apply', false,
   'Timeboxes are maxima, not targets; events can end early; must not exceed',
   'Calculate proportional timeboxes for non-standard Sprint lengths',
   'Comfort with "finished early — let''s stop"', 8),

  (cert_id, d3, '3.9', 'Distinguish the Sprint Goal from the Product Backlog items selected for the Sprint',
   'high', 'per_sprint', '4_analyze', false,
   'Sprint Goal is the singular objective; selected PBIs are means; PBIs can change while Goal remains',
   'Write a Sprint Goal that''s coherent and outcome-focused',
   'Goal-orientation over task-orientation', 9),

  (cert_id, d3, '3.10', 'Recognize event anti-patterns',
   'high', 'daily', '4_analyze', true,
   'Daily Scrum as status to manager; Review as one-way demo; Retro as blame session; Planning that skips Why',
   'Diagnose the anti-pattern and prescribe the correction',
   'Naming uncomfortable patterns kindly but clearly', 10);

-- Domain 4 — Artifacts & Commitments
insert into public.tasks (certification_id, domain_id, code, statement, criticality, frequency, bloom_level, is_simulation_candidate, knowledge, skills, abilities, order_index) values
  (cert_id, d4, '4.1', 'Identify each artifact''s commitment',
   'high', 'occasional', '1_remember', false,
   'Product Backlog → Product Goal; Sprint Backlog → Sprint Goal; Increment → Definition of Done',
   'Map artifact to its commitment instantly',
   'Internalizing the 2020 commitments addition', 1),

  (cert_id, d4, '4.2', 'Explain the Product Backlog as an emergent, ordered list owned by the PO',
   'high', 'weekly', '2_understand', false,
   'Single source of work; ordered (not just prioritized); never "complete"',
   'Identify when ordering logic is broken',
   'Value-based prioritization', 2),

  (cert_id, d4, '4.3', 'Explain that the Sprint Backlog is created by and for the Developers',
   'high', 'per_sprint', '2_understand', false,
   'Sprint Backlog = Sprint Goal + selected PBIs + plan; updated daily by Developers',
   'Recognize when a Sprint Backlog is being managed externally',
   'Hands-off from the SM', 3),

  (cert_id, d4, '4.4', 'Define the Increment and the Definition of Done',
   'high', 'per_sprint', '3_apply', true,
   'Increment must meet DoD; multiple Increments per Sprint allowed; DoD created by the Scrum Team (2020 change)',
   'Apply DoD to determine if work is "done"; help team write a DoD',
   'Quality bar discipline', 4),

  (cert_id, d4, '4.5', 'Apply the DoD to determine completion',
   'high', 'per_sprint', '3_apply', false,
   'Anything not meeting DoD is not an Increment, returns to Product Backlog',
   'Distinguish "done" from "done-done" from "almost done"',
   'Discomfort tolerance — saying "not done"', 5),

  (cert_id, d4, '4.6', 'Explain the Product Goal as the long-term objective',
   'high', 'weekly', '2_understand', false,
   'Product Goal lives in the Product Backlog; each Sprint brings the product closer; only one Product Goal at a time',
   'Recognize when sprints are drifting from the Product Goal',
   'Long-arc thinking', 6),

  (cert_id, d4, '4.7', 'Distinguish artifact transparency from artifact perfection',
   'medium', 'daily', '4_analyze', false,
   'Artifacts can be partial, rough, or evolving — and still transparent',
   'Coach a team out of "we can''t show stakeholders until it''s polished"',
   'Vulnerability with rough work', 7),

  (cert_id, d4, '4.8', 'Explain refinement as an ongoing activity (NOT a formal event)',
   'medium', 'weekly', '2_understand', false,
   'Refinement breaks PBIs into smaller items, adds detail, estimates; NOT an event',
   'Avoid the anti-pattern of "Refinement Meeting" treated as a sixth event',
   'Comfort with embedded activities', 8),

  (cert_id, d4, '4.9', 'Interpret burndown charts and velocity metrics (CertiProf emphasis)',
   'medium', 'daily', '3_apply', false,
   'Burndowns show remaining work over time; velocity = points completed per Sprint; both are forecasting tools',
   'Read a burndown and identify what''s happening (scope creep, late completion)',
   'Resisting "velocity as productivity score"', 9),

  (cert_id, d4, '4.10', 'Apply INVEST criteria to Product Backlog Items',
   'medium', 'weekly', '3_apply', false,
   'INVEST = Independent, Negotiable, Valuable, Estimable, Small, Testable',
   'Identify which letter a poor PBI fails on',
   'Constructive editing of others'' work', 10);

-- Domain 5 — SM in Practice & Org Context
insert into public.tasks (certification_id, domain_id, code, statement, criticality, frequency, bloom_level, is_simulation_candidate, knowledge, skills, abilities, order_index) values
  (cert_id, d5, '5.1', 'Identify impediments and choose removal strategies',
   'high', 'daily', '3_apply', true,
   'Internal vs. external impediments; SM "causes the removal" — not always personally; escalation paths',
   'Categorize impediment and pick the right response',
   'Persistence; comfort with bureaucratic friction', 1),

  (cert_id, d5, '5.2', 'Distinguish impediments from problems the team should resolve themselves',
   'high', 'daily', '4_analyze', false,
   'Self-managing teams should handle their own problems; SM intervention undermines self-management',
   'Resist the urge to fix everything',
   'Restraint; coaching reflex over fixing reflex', 2),

  (cert_id, d5, '5.3', 'Coach a Scrum Team toward greater self-management',
   'high', 'weekly', '3_apply', true,
   'Four coaching stances (teach / mentor / coach / facilitate); powerful questions',
   'Pick the right stance for a moment; ask powerful questions',
   'Patience; comfort with silence', 3),

  (cert_id, d5, '5.4', 'Apply servant leadership behaviors',
   'high', 'daily', '3_apply', false,
   'Servant leadership concept (Greenleaf, 1970); 2020 Guide language shift to "true leaders who serve"',
   'Recognize servant-leadership behaviors',
   'Influence without authority; ego subordination', 4),

  (cert_id, d5, '5.5', 'Recognize psychological safety and how SM behavior affects it',
   'medium', 'daily', '4_analyze', false,
   'Amy Edmondson''s research; signs of low safety (silence, blame, defensiveness)',
   'Diagnose safety issues; nudge behavior to rebuild',
   'Emotional intelligence; self-awareness', 5),

  (cert_id, d5, '5.6', 'Coach the Product Owner',
   'high', 'weekly', '3_apply', false,
   'PO common struggles: too far/close to team, "by committee", poor Product Goal articulation',
   'Coach without taking ownership',
   'Respect for PO''s authority', 6),

  (cert_id, d5, '5.7', 'Navigate CertiProf vs. Scrum Guide terminology drift',
   'medium', 'per_exam', '2_understand', false,
   'Where CertiProf prep materials use legacy terms ("ceremonies," "self-organizing," "servant-leader")',
   'Translate between the two on the exam',
   'Patience with terminology lag', 7),

  (cert_id, d5, '5.8', 'Coach the organization on Scrum adoption',
   'medium', 'occasional', '3_apply', false,
   'Common organizational impediments; SM "leads, trains, and coaches" the organization',
   'Pick battles; persuade upward without burning credibility',
   'Political savvy; long-game patience', 8),

  (cert_id, d5, '5.9', 'Apply scaling principles at a foundational level',
   'low', 'occasional', '2_understand', false,
   'Multiple Scrum Teams on one product share one Product Backlog, one PO, one Product Goal',
   'Recognize anti-patterns ("two teams, two backlogs, same product")',
   'Knowing what you don''t know about scaling', 9);

end$$;


-- =============================================================================
-- 13. Widget definitions (the six primitives)
-- =============================================================================
insert into public.widget_definitions (slug, display_name, description, supported_bloom) values
  ('drag-match',         'Drag-to-match',         'Drag items from one column onto matching targets in another.',                    array['2_understand','3_apply']::bloom_level[]),
  ('sort-into-order',    'Sort into order',       'Drag items into the correct sequence.',                                            array['2_understand','3_apply']::bloom_level[]),
  ('toggle-and-observe', 'Toggle & observe',      'Boolean toggles change a visualization in real time, revealing consequences.',    array['3_apply','4_analyze']::bloom_level[]),
  ('highlight-mistake',  'Highlight the mistake', 'Read a scenario; click the part that''s wrong.',                                   array['3_apply','4_analyze']::bloom_level[]),
  ('scenario-mcq',       'Scenario MCQ',          'Multi-step branching scenarios. Choose, see consequence, choose again.',          array['3_apply','4_analyze']::bloom_level[]),
  ('annotated-diagram',  'Annotated diagram',     'Click hotspots on a diagram to reveal info.',                                      array['1_remember','2_understand']::bloom_level[]);


-- =============================================================================
-- End of Migration 003
-- =============================================================================
