-- 218_analyzer_provenance_spine.sql
--
-- Curriculum Coverage Analyzer: provenance and drift-rule spine.
--
-- WHAT THIS IS FOR
--   Three consumers share one provenance spine:
--     1. drift_rules            - every rule must cite actual standard text
--     2. CLAIMS-POLICY Class B  - competitor-derived assertions need source + verified_as_of
--     3. future concept extraction from a Body of Knowledge
--
-- NAMING NOTE - READ THIS BEFORE ADDING TABLES HERE
--   public.source_documents ALREADY EXISTS. It came from 002_rag_and_chat.sql and
--   is the AI tutor RAG corpus: certification-scoped, stores content_md, chunked
--   into document_chunks by the ingest-document function. It is NOT this feature's
--   table and must not be extended for it. Hence authority_sources.
--
-- WHAT THIS DELIBERATELY DOES NOT DO
--   It does not store third-party source documents. authority_citations holds a
--   length-capped excerpt only, enforced by CHECK, not by habit. An analysed
--   syllabus is embedded in memory and discarded; it never lands in
--   source_documents or document_chunks.
--
-- ASCII-only prose throughout (CERT-SCHEMA-GUIDE section 8 paste-safety rule).
-- Editor-first: paste and run in the Supabase SQL editor, commit this file as
-- the versioned record.
--
-- Tip before this migration: 217. This is 218.


-- =====================================================================
-- SECTION 1 - authority_sources
-- A citable, versioned authority: standards, guides, bodies of knowledge.
-- NOT a store of analysed syllabi, and NOT the RAG corpus.
-- =====================================================================

create table if not exists public.authority_sources (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  publisher       text,
  edition         text,
  published_on    date,
  canonical_url   text,
  content_hash    text,
  verified_as_of  date,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint authority_sources_slug_shape
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

comment on table public.authority_sources is
  'Authoritative, citable, versioned sources. Distinct from public.source_documents, which is the AI tutor RAG corpus from migration 002.';
comment on column public.authority_sources.verified_as_of is
  'CLAIMS-POLICY Class B. One verification of the source serves every rule and claim grounded in it.';
comment on column public.authority_sources.content_hash is
  'Hash of the text the citations were taken from. Proves which edition a rule was authored against.';


-- =====================================================================
-- SECTION 2 - certification_authorities
-- Authority is a relation, not a property of a document.
-- This is what makes the drift-rule invariant test computable: it names
-- the document a given certification treats as current truth.
-- =====================================================================

create table if not exists public.certification_authorities (
  certification_id      uuid not null references public.certifications(id) on delete cascade,
  authority_source_id   uuid not null references public.authority_sources(id) on delete restrict,
  role                  text not null,
  notes                 text,
  created_at            timestamptz not null default now(),
  primary key (certification_id, authority_source_id),
  constraint certification_authorities_role_check
    check (role in ('authoritative', 'superseded', 'comparative'))
);

create index if not exists certification_authorities_source_idx
  on public.certification_authorities (authority_source_id);

comment on table public.certification_authorities is
  'Which sources a certification treats as authoritative, superseded, or merely comparative.';
comment on column public.certification_authorities.role is
  'authoritative = current truth for this cert. superseded = a prior edition. comparative = another body model, e.g. SBOK.';


-- =====================================================================
-- SECTION 3 - authority_citations
-- A bounded excerpt with a stable locator. The CHECK is what keeps this
-- from quietly becoming a copy of somebody else's standard.
-- =====================================================================

create table if not exists public.authority_citations (
  id                   uuid primary key default gen_random_uuid(),
  authority_source_id  uuid not null references public.authority_sources(id) on delete cascade,
  locator              text not null,
  lang                 text not null default 'en',
  quote                text,
  created_at           timestamptz not null default now(),
  constraint authority_citations_lang_check
    check (lang in ('en', 'es-419', 'pt-BR')),
  constraint authority_citations_quote_bounded
    check (quote is null or char_length(quote) <= 300),
  constraint authority_citations_unique_locator
    unique (authority_source_id, locator, lang)
);

create index if not exists authority_citations_source_idx
  on public.authority_citations (authority_source_id, lang);

comment on table public.authority_citations is
  'Bounded excerpt plus stable locator. Evidence, not content.';
comment on constraint authority_citations_quote_bounded on public.authority_citations is
  'Hard 300-char cap. Storing standards bodies or competitors wholesale is not a repository we want, and a CHECK enforces that structurally rather than by discipline.';
comment on column public.authority_citations.lang is
  'Citations are per language because drift rules are per language. The Spanish edition is a different text with different wording.';


-- =====================================================================
-- SECTION 4 - drift_rules
-- Scoped to a SOURCE TRANSITION, not to a certification.
--
--   Development Team -> Developers is a fact about the 2017->2020 Scrum
--   Guide. It is not a fact about SM-AI-I. Cert-scoping it would make one
--   Scrum Guide revision a 72-row edit across three Scrum certs, which is
--   the duplication TERMINOLOGY-POLICY.md already eliminated once.
--
-- Two classes, because the calibration corpus forced it:
--   superseded    - a real transition; both source ends required.
--                   ISO control renumbering (A.9.2.1 -> A.5.16) is this.
--   non_canonical - the term appears in no authoritative edition at all.
--                   'Daily Sprint' from the AulaUtil document is this. It
--                   has no legacy source, so a strict from/to pair cannot
--                   express it.
-- =====================================================================

create table if not exists public.drift_rules (
  id                       uuid primary key default gen_random_uuid(),
  rule_class               text not null,
  authority_source_id      uuid not null references public.authority_sources(id) on delete restrict,
  superseded_source_id     uuid references public.authority_sources(id) on delete restrict,
  lang                     text not null,
  legacy_term              text not null,
  current_term             text,
  match_mode               text not null default 'phrase',
  pattern                  text,
  severity                 text not null default 'medium',
  authority_citation_id    uuid not null references public.authority_citations(id) on delete restrict,
  rationale                text,
  is_active                boolean not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  constraint drift_rules_class_check
    check (rule_class in ('superseded', 'non_canonical')),

  constraint drift_rules_lang_check
    check (lang in ('en', 'es-419', 'pt-BR')),

  constraint drift_rules_match_mode_check
    check (match_mode in ('phrase', 'regex')),

  constraint drift_rules_severity_check
    check (severity in ('high', 'medium', 'low')),

  -- a superseded rule names both ends of the transition and a replacement
  constraint drift_rules_superseded_shape
    check (
      rule_class <> 'superseded'
      or (superseded_source_id is not null and current_term is not null)
    ),

  -- a non-canonical term has no legacy source by definition
  constraint drift_rules_non_canonical_shape
    check (
      rule_class <> 'non_canonical'
      or superseded_source_id is null
    ),

  -- a source cannot supersede itself
  constraint drift_rules_distinct_ends
    check (
      superseded_source_id is null
      or superseded_source_id <> authority_source_id
    ),

  -- regex mode requires a pattern
  constraint drift_rules_pattern_required
    check (match_mode <> 'regex' or pattern is not null),

  constraint drift_rules_unique_term
    unique (authority_source_id, lang, legacy_term)
);

create index if not exists drift_rules_authority_lang_idx
  on public.drift_rules (authority_source_id, lang) where is_active;

comment on table public.drift_rules is
  'Rule-based terminology drift detection. Deterministic, near-free, and the highest-signal stage in every calibration document tested.';
comment on column public.drift_rules.authority_source_id is
  'The source that establishes the CURRENT correct term. Always required. The invariant test runs against this document text: a rule that fires against its own authority is broken.';
comment on column public.drift_rules.authority_citation_id is
  'NOT NULL deliberately. A rule grounded in model training knowledge rather than actual standard text cannot exist as a row. Same attribution rule as the item pipeline.';
comment on column public.drift_rules.lang is
  'Authored per language. Development Team / equipo de desarrollo / equipe de desenvolvimento are three separate rules, not one rule with three translations.';


-- =====================================================================
-- SECTION 5 - drift_rule_certifications
-- Which certifications care about a rule, and which task it maps to.
-- Task codes are cert-scoped, so the task link belongs here and not on
-- the rule. Resolve task_id by code in-migration via the join pattern
-- from 065/084: write the code, let the join supply the id.
-- =====================================================================

create table if not exists public.drift_rule_certifications (
  drift_rule_id     uuid not null references public.drift_rules(id) on delete cascade,
  certification_id  uuid not null references public.certifications(id) on delete cascade,
  task_id           uuid references public.tasks(id) on delete set null,
  severity_override text,
  created_at        timestamptz not null default now(),
  primary key (drift_rule_id, certification_id),
  constraint drift_rule_certifications_severity_check
    check (severity_override is null or severity_override in ('high', 'medium', 'low'))
);

create index if not exists drift_rule_certifications_cert_idx
  on public.drift_rule_certifications (certification_id);

comment on table public.drift_rule_certifications is
  'Applicability join. A rule is authored once per transition per language and attached to every certification it applies to.';


-- =====================================================================
-- SECTION 6 - drift_rule_invariant_runs
--
-- THE INVARIANT: no rule may fire against its own authority source text.
-- A rule that flags the 2020 Scrum Guide is a broken rule, and it must be
-- caught by a test, not by a partner.
--
-- The authoritative text stays on disk as an uncommitted fixture. The
-- database records only the RESULT plus the hash of the text it ran
-- against, so the gate exists without us becoming a store of standards.
--
-- rules_fired > 0 fails the build.
-- =====================================================================

create table if not exists public.drift_rule_invariant_runs (
  id                   uuid primary key default gen_random_uuid(),
  authority_source_id  uuid not null references public.authority_sources(id) on delete cascade,
  lang                 text not null,
  content_hash         text not null,
  ruleset_size         integer not null,
  rules_fired          integer not null,
  fired_rule_ids       uuid[] not null default '{}',
  passed               boolean generated always as (rules_fired = 0) stored,
  ran_at               timestamptz not null default now(),
  constraint drift_rule_invariant_runs_lang_check
    check (lang in ('en', 'es-419', 'pt-BR')),
  constraint drift_rule_invariant_runs_counts
    check (ruleset_size >= 0 and rules_fired >= 0 and rules_fired <= ruleset_size)
);

create index if not exists drift_rule_invariant_runs_source_idx
  on public.drift_rule_invariant_runs (authority_source_id, lang, ran_at desc);

comment on table public.drift_rule_invariant_runs is
  'Result-only record of the no-self-fire invariant. content_hash proves which text the run was executed against.';


-- =====================================================================
-- SECTION 7 - updated_at triggers
-- public.set_updated_at() already exists and is behaviourally identical to
-- what this feature needs. It is NOT redefined here: redefining a shared
-- function inside a feature migration is a cross-feature hazard.
-- =====================================================================

drop trigger if exists trg_authority_sources_updated_at on public.authority_sources;
create trigger trg_authority_sources_updated_at
  before update on public.authority_sources
  for each row execute function public.set_updated_at();

drop trigger if exists trg_drift_rules_updated_at on public.drift_rules;
create trigger trg_drift_rules_updated_at
  before update on public.drift_rules
  for each row execute function public.set_updated_at();


-- =====================================================================
-- SECTION 8 - RLS
--
-- Every table below is CLOSED. RLS is enabled with ZERO policies, which
-- denies anon and authenticated entirely. service_role bypasses RLS, so
-- the analyzer edge function reads and writes; the console reads through
-- that function, not directly.
--
-- No GRANT is issued to anon or authenticated. RLS is not a grant and a
-- grant is not RLS: the table-level grant is checked first, so withholding
-- it is the outer lock.
--
-- When Renderer A needs a direct console read, add a platform_admin policy
-- AND the matching column-scoped grant in a later migration. Do NOT add a
-- table-wide GRANT SELECT: it re-confers every column and overrides any
-- column-level REVOKE.
-- =====================================================================

alter table public.authority_sources            enable row level security;
alter table public.certification_authorities    enable row level security;
alter table public.authority_citations          enable row level security;
alter table public.drift_rules                  enable row level security;
alter table public.drift_rule_certifications    enable row level security;
alter table public.drift_rule_invariant_runs    enable row level security;

revoke all on public.authority_sources          from anon, authenticated;
revoke all on public.certification_authorities  from anon, authenticated;
revoke all on public.authority_citations        from anon, authenticated;
revoke all on public.drift_rules                from anon, authenticated;
revoke all on public.drift_rule_certifications  from anon, authenticated;
revoke all on public.drift_rule_invariant_runs  from anon, authenticated;


-- =====================================================================
-- VERIFICATION - run these ONE AT A TIME, after the above.
-- Commented out here so this file stays a single safe DDL paste.
-- =====================================================================

-- 1) six tables exist, and public.source_documents is untouched
-- select table_name from information_schema.tables
--  where table_schema = 'public'
--    and table_name in ('authority_sources','certification_authorities','authority_citations',
--                       'drift_rules','drift_rule_certifications','drift_rule_invariant_runs')
--  order by table_name;

-- 2) RLS is on for all six
-- select relname, relrowsecurity from pg_class
--  where relnamespace = 'public'::regnamespace
--    and relname in ('authority_sources','certification_authorities','authority_citations',
--                    'drift_rules','drift_rule_certifications','drift_rule_invariant_runs')
--  order by relname;

-- 3) anon and authenticated hold no privileges on any of the six (expect ZERO rows)
-- select table_name, grantee, privilege_type
--   from information_schema.role_table_grants
--  where table_schema = 'public'
--    and grantee in ('anon','authenticated')
--    and table_name in ('authority_sources','certification_authorities','authority_citations',
--                       'drift_rules','drift_rule_certifications','drift_rule_invariant_runs');

-- 4) the drift_rules shape CHECKs are present (expect 8)
-- select conname from pg_constraint
--  where conrelid = 'public.drift_rules'::regclass and contype = 'c'
--  order by conname;
