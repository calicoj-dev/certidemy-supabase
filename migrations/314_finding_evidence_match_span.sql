-- 314_finding_evidence_match_span.sql
--
-- Adds the position of the matched span INSIDE evidence_excerpt, so a partner
-- UI can highlight what matched instead of searching the excerpt for it.
--
-- ===================== WHY THE SPAN IS STORED =====================
--
-- Re-deriving the highlight means searching the excerpt for the concept name.
-- That silently picks the WRONG occurrence whenever the phrase appears twice in
-- one 300-character window, and a highlight on the wrong words asserts
-- something specific and false about a partner's own document. Storing the span
-- the matcher actually used removes the guess.
--
-- It also carries information a search cannot recover. The probable and
-- ambiguous bands anchor on a single TOKEN, not on the whole concept name --
-- that is what distinguishes them from strong -- so there is no phrase in the
-- excerpt to search for at all.
--
-- ===================== EVERY WRITER OF analysis_findings =====================
--
-- Per CLAUDE.md, a column added to a table does not fail the writers that
-- predate it until one of them next runs. Both repositories were grepped for
-- inserts rather than read off any prose checklist:
--
--   grep -rn 'from("analysis_findings")' functions/ scripts/ ../certidemy-web
--
--   1. functions/analyze-curriculum/index.ts:368
--      `admin.from("analysis_findings").insert(rows.slice(i, i + 500))`
--      THE ONLY WRITER IN EITHER REPOSITORY. Updated in the same change as this
--      migration: the Finding builder in functions/_shared/analyzer/concepts.ts
--      now carries evidenceMatchStart / evidenceMatchLength, and the insert
--      maps them to the two columns below.
--
-- No other insert site exists. migrations/219 creates the table and inserts no
-- rows; 248 references it only in a comment.
--
-- ===================== WHY NULLABLE, EXPLICITLY =====================
--
-- BOTH COLUMNS ARE NULLABLE AND MUST STAY THAT WAY.
--
-- A NOT NULL column on this table would be the fourth instance of one failure:
-- bloom_level, bank_revision and item_origin each dropped silently because a
-- writer that predated the constraint was not named, and the break surfaced
-- only when a rare path next ran. Nullable removes the trap rather than
-- documenting it.
--
-- Nullable is also CORRECT here rather than merely safe. An absent concept has
-- no excerpt -- there is nothing to quote -- and therefore no span. The
-- constraint below states that relationship instead of leaving it implied:
-- a span exists only where an excerpt exists, and it must lie inside it.
--
-- Editor-first: run this in the SQL editor, then commit the file as the record.

begin;

alter table public.analysis_findings
  add column if not exists evidence_match_start  int,
  add column if not exists evidence_match_length int;

comment on column public.analysis_findings.evidence_match_start is
  'Offset of the matched span within evidence_excerpt, 0-based, in the same '
  'whitespace-collapsed space as the stored excerpt. Null when there is no '
  'excerpt, which is the absent band.';

comment on column public.analysis_findings.evidence_match_length is
  'Length of the matched span within evidence_excerpt. For the strong band this '
  'is the concept name; for probable and ambiguous it is the single anchor '
  'token, because those bands do not assert the whole phrase is present.';

-- The span must lie inside the excerpt it indexes. Asserted in BOTH
-- directions: no span without an excerpt, and no span running past its end.
-- The positive half alone would pass on a span that points outside the text.
alter table public.analysis_findings
  add constraint analysis_findings_match_span_shape
  check (
    (evidence_match_start is null) = (evidence_match_length is null)
    and (
      evidence_match_start is null
      or (
        evidence_excerpt is not null
        and evidence_match_start >= 0
        and evidence_match_length >= 0
        and evidence_match_start + evidence_match_length
            <= char_length(evidence_excerpt)
      )
    )
  );

commit;

-- ===================== VERIFICATION, after the deploy =====================
--
-- Post-conditions name a PROPERTY, not a count. The expected number of rows
-- carrying a span depends on how many analyses have run since the deploy, so a
-- count proves nothing; these assert the shape instead.
--
-- 1. Both columns exist and are nullable. Expect two rows, is_nullable = YES.
--
-- select column_name, data_type, is_nullable
--   from information_schema.columns
--  where table_schema = 'public'
--    and table_name = 'analysis_findings'
--    and column_name in ('evidence_match_start', 'evidence_match_length');
--
-- 2. The constraint is present. Expect one row.
--
-- select conname
--   from pg_constraint
--  where conrelid = 'public.analysis_findings'::regclass
--    and conname = 'analysis_findings_match_span_shape';
--
-- 3. THE NEGATIVE HALF, and the one worth running. Every existing row must
--    still have a NULL span, because nothing has written one yet. Expect 0.
--    A non-zero answer means something backfilled a span it could not know.
--
-- select count(*) as spans_that_should_not_exist
--   from public.analysis_findings
--  where evidence_match_start is not null;
--
-- 4. After analyze-curriculum next runs: no span may point outside its
--    excerpt. The CHECK enforces this, so expect 0 -- this confirms the
--    constraint is doing work rather than sitting unevaluated.
--
-- select count(*) as spans_outside_their_excerpt
--   from public.analysis_findings
--  where evidence_match_start is not null
--    and evidence_match_start + evidence_match_length
--        > char_length(evidence_excerpt);
