-- 219_analyzer_runs_and_findings.sql
--
-- Curriculum Coverage Analyzer: the run record and the findings it produces.
-- Companion to 218 (authority_sources, authority_citations, drift_rules).
--
-- CORE PRINCIPLE OF THIS MIGRATION
--   The suppressions are STRUCTURAL, not renderer-dependent. A suppressed run
--   cannot carry a coverage number, because a CHECK forbids it. The SCRUMstudy
--   14% has nowhere to live in this schema. A renderer filter is one refactor
--   away from being bypassed; a CHECK is not.
--
-- WHAT IS NOT STORED
--   The analysed document. Only its URL, its content hash, its word count, and
--   derived findings. Evidence excerpts are capped at 300 characters by CHECK,
--   the same bound as authority_citations.
--
-- ASCII-only prose (CERT-SCHEMA-GUIDE section 8 paste-safety rule).
-- Editor-first: paste and run in the Supabase SQL editor, commit as the record.
--
-- Tip before this migration: 218. This is 219.


-- =====================================================================
-- SECTION 1 - analysis_runs
-- =====================================================================

create table if not exists public.analysis_runs (
  id                       uuid primary key default gen_random_uuid(),

  -- ---- source side (the document is NOT persisted) ----
  source_kind              text not null,
  source_url               text,
  source_content_hash      text not null,
  source_title             text,
  source_lang              text not null,
  source_word_count        integer not null,

  -- ---- reference side (mode-agnostic; see reference_kind CHECKs) ----
  reference_kind           text not null default 'certidemy_certification',
  reference_certification_id uuid references public.certifications(id) on delete restrict,
  reference_lang           text not null,

  -- ---- gates ----
  density_ok               boolean not null,
  density_threshold_words  integer not null default 200,
  framework_expected       text,
  framework_detected       text,
  framework_match          boolean,
  coverage_suppressed      boolean not null default false,
  suppression_reason       text,

  -- ---- results ----
  coverage_pct             numeric(5,2),
  segment                  text,
  outreach_disposition     text,
  clean_pass               boolean,

  -- ---- reproducibility ----
  engine_version           text not null,
  drift_ruleset_size       integer,

  -- ---- calibration (the 5 hand-scored documents become rows here) ----
  is_calibration              boolean not null default false,
  expected_coverage_pct       numeric(5,2),
  expected_suppression_reason text,

  -- ---- ownership and CRM ----
  owner_company_id         uuid references public.companies(id) on delete set null,
  ghl_contact_id           text,
  created_by               uuid references auth.users(id) on delete set null,

  -- ---- lifecycle ----
  status                   text not null default 'pending',
  error_message            text,
  created_at               timestamptz not null default now(),
  completed_at             timestamptz,

  -- ================= vocabulary =================

  constraint analysis_runs_source_kind_check
    check (source_kind in ('url', 'pdf', 'paste')),

  constraint analysis_runs_source_lang_check
    check (source_lang in ('en', 'es-419', 'pt-BR')),

  constraint analysis_runs_reference_lang_check
    check (reference_lang in ('en', 'es-419', 'pt-BR')),

  constraint analysis_runs_reference_kind_check
    check (reference_kind in ('certidemy_certification', 'external_scheme')),

  constraint analysis_runs_suppression_reason_check
    check (suppression_reason is null
           or suppression_reason in ('density', 'framework_mismatch')),

  constraint analysis_runs_segment_check
    check (segment is null
           or segment in ('training_provider', 'certification_body',
                          'marketplace_instructor', 'university',
                          'consultancy', 'unknown')),

  constraint analysis_runs_outreach_check
    check (outreach_disposition is null
           or outreach_disposition in ('contact', 'do_not_contact', 'review')),

  constraint analysis_runs_status_check
    check (status in ('pending', 'complete', 'failed')),

  -- ================= structural rules =================

  -- a url run must record the url it fetched
  constraint analysis_runs_url_requires_url
    check (source_kind <> 'url' or source_url is not null),

  -- Certidemy-referenced runs name a certification; external-scheme runs do not.
  -- The external branch is a SEAM: reference_kind accepts it, but there is
  -- nothing to point at until the scheme table exists. The engine interface is
  -- mode-agnostic from day one; the schema does not pretend otherwise.
  constraint analysis_runs_reference_shape
    check (
      (reference_kind = 'certidemy_certification' and reference_certification_id is not null)
      or
      (reference_kind = 'external_scheme' and reference_certification_id is null)
    ),

  -- THE TWO SUPPRESSIONS, made unstorable rather than merely unrendered
  constraint analysis_runs_suppressed_has_no_coverage
    check (coverage_suppressed = false or coverage_pct is null),

  constraint analysis_runs_suppressed_states_reason
    check (coverage_suppressed = false or suppression_reason is not null),

  constraint analysis_runs_reason_implies_suppressed
    check (suppression_reason is null or coverage_suppressed = true),

  -- a failed density gate IS a suppression; they cannot disagree
  constraint analysis_runs_density_implies_suppressed
    check (density_ok = true or coverage_suppressed = true),

  -- a framework mismatch IS a suppression; likewise
  constraint analysis_runs_framework_implies_suppressed
    check (framework_match is not false or coverage_suppressed = true),

  -- THE SEGMENT GATE. A certification body is a peer, not a prospect.
  -- See the note in the comment below: this is the one judgment call in this
  -- migration and it is one line to drop if it proves too rigid.
  constraint analysis_runs_peer_not_prospect
    check (segment is distinct from 'certification_body'
           or outreach_disposition = 'do_not_contact'),

  -- ranges and sanity
  constraint analysis_runs_coverage_range
    check (coverage_pct is null or (coverage_pct >= 0 and coverage_pct <= 100)),

  constraint analysis_runs_expected_coverage_range
    check (expected_coverage_pct is null
           or (expected_coverage_pct >= 0 and expected_coverage_pct <= 100)),

  constraint analysis_runs_word_count_nonneg
    check (source_word_count >= 0),

  constraint analysis_runs_complete_has_timestamp
    check (status <> 'complete' or completed_at is not null),

  constraint analysis_runs_failed_has_message
    check (status <> 'failed' or error_message is not null)
);

create index if not exists analysis_runs_certification_idx
  on public.analysis_runs (reference_certification_id, created_at desc);

create index if not exists analysis_runs_hash_idx
  on public.analysis_runs (source_content_hash);

create index if not exists analysis_runs_company_idx
  on public.analysis_runs (owner_company_id) where owner_company_id is not null;

create index if not exists analysis_runs_ghl_idx
  on public.analysis_runs (ghl_contact_id) where ghl_contact_id is not null;

create index if not exists analysis_runs_calibration_idx
  on public.analysis_runs (reference_certification_id, engine_version)
  where is_calibration;

comment on table public.analysis_runs is
  'One analysis of one third-party document against one reference blueprint. The document itself is never persisted: URL, hash, word count and derived findings only.';

comment on column public.analysis_runs.coverage_suppressed is
  'When true, coverage_pct MUST be null and suppression_reason MUST be set. Enforced by CHECK so a renderer bug cannot leak a number the engine refused to compute.';

comment on column public.analysis_runs.owner_company_id is
  'Tenant seam. Null means Certidemy internal. Added inert; nothing derives from it until Renderer B exists. Same playbook as migration 216.';

comment on column public.analysis_runs.ghl_contact_id is
  'Prospects live in GoHighLevel, not here. This column is the whole CRM link: attach a run to a contact, start a run from a contact website field, or push the verdict back as a funnel-stage tag via sync-to-ghl. A GHL note is an internal surface, so CLAIMS-POLICY Class B does not bite; outbound email copy is a different matter.';

comment on column public.analysis_runs.engine_version is
  'Stamped on every run so a regression against the calibration set is attributable to a specific engine and ruleset rather than to an unknown point in time.';

comment on column public.analysis_runs.is_calibration is
  'The hand-scored regression corpus lives in this table as rows. Engine-versus-hand divergence becomes a query, not a spreadsheet.';

comment on constraint analysis_runs_peer_not_prospect on public.analysis_runs is
  'THE ONE JUDGMENT CALL IN THIS MIGRATION. A certification body classified as such cannot carry a contactable disposition. TUV SUD is a certification body and might one day be a legitimate partner target, which is the argument for relaxing this. It is deliberately a CHECK rather than engine logic because a do_not_contact a renderer can override is worth nothing. Dropping it later is one line.';


-- =====================================================================
-- SECTION 2 - analysis_findings
--
-- One table, typed rows. The visibility column is the Renderer A / Renderer B
-- split expressed as data, so a commercial note or a segment classification
-- cannot reach a partner because somebody forgot a filter in a component.
-- =====================================================================

create table if not exists public.analysis_findings (
  id                     uuid primary key default gen_random_uuid(),
  run_id                 uuid not null references public.analysis_runs(id) on delete cascade,
  finding_type           text not null,

  -- ---- subject (which one is populated depends on finding_type) ----
  concept_id             uuid references public.concepts(id) on delete cascade,
  task_id                uuid references public.tasks(id) on delete cascade,
  domain_id              uuid references public.domains(id) on delete cascade,
  drift_rule_id          uuid references public.drift_rules(id) on delete set null,
  label                  text,

  -- ---- evidence ----
  confidence             numeric(4,3),
  confidence_band        text,
  evidence_excerpt       text,
  evidence_locator       text,

  -- ---- weighting ----
  source_weight_pct      numeric(5,2),
  blueprint_weight_pct   numeric(5,2),
  divergence_pct         numeric(6,2) generated always as
                           (source_weight_pct - blueprint_weight_pct) stored,

  -- ---- disposition ----
  severity               text,
  visibility             text not null default 'internal',

  -- ---- human review ----
  requires_human_review  boolean not null default false,
  reviewed_by            uuid references auth.users(id) on delete set null,
  reviewed_at            timestamptz,
  review_outcome         text,

  created_at             timestamptz not null default now(),

  -- ================= vocabulary =================

  constraint analysis_findings_type_check
    check (finding_type in ('concept_match', 'drift', 'weight_divergence',
                            'reverse_gap', 'structural_note')),

  constraint analysis_findings_band_check
    check (confidence_band is null
           or confidence_band in ('strong', 'probable', 'ambiguous', 'absent')),

  constraint analysis_findings_severity_check
    check (severity is null or severity in ('high', 'medium', 'low')),

  constraint analysis_findings_visibility_check
    check (visibility in ('internal', 'partner', 'both')),

  constraint analysis_findings_review_outcome_check
    check (review_outcome is null
           or review_outcome in ('confirmed', 'rejected', 'amended')),

  -- ================= per-type shape =================

  constraint analysis_findings_concept_match_shape
    check (finding_type <> 'concept_match'
           or (concept_id is not null and confidence_band is not null)),

  constraint analysis_findings_drift_shape
    check (finding_type <> 'drift' or drift_rule_id is not null),

  constraint analysis_findings_weight_shape
    check (finding_type <> 'weight_divergence'
           or (domain_id is not null
               and source_weight_pct is not null
               and blueprint_weight_pct is not null)),

  -- a reverse gap is what THEY teach that WE do not assess.
  -- By definition it maps to nothing of ours.
  constraint analysis_findings_reverse_gap_shape
    check (finding_type <> 'reverse_gap'
           or (label is not null
               and concept_id is null
               and task_id is null
               and domain_id is null)),

  constraint analysis_findings_structural_note_shape
    check (finding_type <> 'structural_note' or label is not null),

  -- ================= evidence and review discipline =================

  -- same bound as authority_citations: evidence, not content
  constraint analysis_findings_excerpt_bounded
    check (evidence_excerpt is null or char_length(evidence_excerpt) <= 300),

  -- anything a partner can see must be traceable to text in their own document
  constraint analysis_findings_external_needs_evidence
    check (visibility = 'internal'
           or evidence_excerpt is not null
           or evidence_locator is not null),

  -- the ambiguous band exists precisely because it needs a human
  constraint analysis_findings_ambiguous_needs_review
    check (confidence_band is distinct from 'ambiguous'
           or requires_human_review = true),

  constraint analysis_findings_review_pairing
    check ((reviewed_by is null) = (reviewed_at is null)),

  constraint analysis_findings_confidence_range
    check (confidence is null or (confidence >= 0 and confidence <= 1))
);

create index if not exists analysis_findings_run_idx
  on public.analysis_findings (run_id, finding_type);

create index if not exists analysis_findings_review_idx
  on public.analysis_findings (run_id) where requires_human_review;

create index if not exists analysis_findings_concept_idx
  on public.analysis_findings (concept_id) where concept_id is not null;

create index if not exists analysis_findings_drift_rule_idx
  on public.analysis_findings (drift_rule_id) where drift_rule_id is not null;

comment on table public.analysis_findings is
  'Typed findings for one run. Bidirectional by design: reverse_gap rows are mandatory, because one-directional output reads as an attack and bidirectional reads as analysis.';

comment on column public.analysis_findings.visibility is
  'The Renderer A / Renderer B split as data rather than as component logic. Renderer B filters on this, so a commercial note or a segment classification cannot leak because somebody forgot a filter.';

comment on column public.analysis_findings.divergence_pct is
  'Computed, never typed. This is where TUV SUD allocating 1 percent to the Scrum Master role against D5 at 22.5 percent lands.';

comment on column public.analysis_findings.confidence_band is
  'Bands, not a binary match. The ambiguous band is expected and it forces requires_human_review by CHECK, because that is the band that must not reach a prospect unreviewed.';


-- =====================================================================
-- SECTION 3 - RLS
-- Closed, identical posture to 218. RLS enabled, zero policies, no grant to
-- anon or authenticated. service_role bypasses RLS: the analyzer edge function
-- reads and writes, and the console reads through that function.
--
-- Renderer B will need a partner-scoped policy on both tables joined through
-- owner_company_id, plus a column-scoped grant. Do NOT add a table-wide
-- GRANT SELECT when that day comes: it re-confers every column and overrides
-- any column-level REVOKE, which would expose segment and outreach_disposition
-- to the partner they describe.
-- =====================================================================

alter table public.analysis_runs     enable row level security;
alter table public.analysis_findings enable row level security;

revoke all on public.analysis_runs     from anon, authenticated;
revoke all on public.analysis_findings from anon, authenticated;


-- =====================================================================
-- VERIFICATION - run these ONE AT A TIME, after the above.
-- =====================================================================

-- 1) both tables exist
-- select table_name from information_schema.tables
--  where table_schema = 'public'
--    and table_name in ('analysis_runs','analysis_findings')
--  order by table_name;

-- 2) RLS on for both
-- select relname, relrowsecurity from pg_class
--  where relnamespace = 'public'::regnamespace
--    and relname in ('analysis_runs','analysis_findings');

-- 3) anon and authenticated hold nothing (expect ZERO rows)
-- select table_name, grantee, privilege_type
--   from information_schema.role_table_grants
--  where table_schema = 'public'
--    and grantee in ('anon','authenticated')
--    and table_name in ('analysis_runs','analysis_findings');

-- 4) the suppression CHECKs are present (expect 21 on analysis_runs)
-- select count(*) as run_checks from pg_constraint
--  where conrelid = 'public.analysis_runs'::regclass and contype = 'c';

-- 5) NEGATIVE TEST - this INSERT must FAIL with
--    "violates check constraint analysis_runs_suppressed_has_no_coverage".
--    If it succeeds, the suppression is not structural and this migration
--    did not do its job. Run it, confirm the error, move on.
-- insert into public.analysis_runs
--   (source_kind, source_content_hash, source_lang, source_word_count,
--    reference_kind, reference_certification_id, reference_lang,
--    density_ok, coverage_suppressed, suppression_reason, coverage_pct,
--    engine_version, status)
-- values
--   ('paste', 'negative-test-hash', 'en', 60,
--    'certidemy_certification', '11111111-1111-1111-1111-111111111111', 'en',
--    false, true, 'density', 14.00,
--    'v0-negative-test', 'pending');
