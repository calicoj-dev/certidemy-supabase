-- 293: SM-AI-II's exam_blueprint becomes publishable
--
-- ONE PASTE. Pre-conditions ABORT, they do not print.
--
-- ============================================================================
-- WHY THE PRE-GUARDS ARE A do BLOCK AND NOT TWO SELECTS
-- ============================================================================
--
-- This was drafted as four readable guards: two selects to run and read, then
-- the update, then two more. That shape is wrong for a single paste, because
-- THE SQL EDITOR RETURNS ONLY THE LAST RESULT SET. Both pre-guards would have
-- executed, their output would have been discarded, and the update would have
-- run regardless of what they found. A pre-condition nobody can read before the
-- write is not a pre-condition; it is decoration.
--
-- So the pre-conditions raise instead. A failure aborts the transaction and the
-- update never commits, which is strictly stronger than a human comparing two
-- numbers - and it is the same reason this repo's guards abort rather than warn.
-- The single visible result set is the verification, after the fact.
--
-- ============================================================================
-- WHY THE CHANGE
-- ============================================================================
--
-- exam_blueprint is a COLUMN ON certifications, and anon holds `anon=r/postgres`
-- - a table-wide SELECT with no column-level privileges (relacl, checked). So
-- the moment a row is readable, its blueprint is published. Migration 294 makes
-- SM-AI-II readable. This one makes the blueprint fit to read first, and the
-- order is not cosmetic: 294 without 293 publishes the engineering history
-- below.
--
-- Measured across all thirteen certifications on 2026-09-11: SM-AI-II is the
-- ONLY blueprint naming repository internals. The other twelve are clean, and
-- eleven of them are already 'available' and therefore already public. The
-- house norm is not "short" - AIMS-IA runs to 2,868 characters and ISMS-IA to
-- 2,712, both of them careful cue-tolerance rationales. The norm is NO
-- ENGINEERING HISTORY, and twelve of thirteen already hold to it.
--
-- THE RULE, DECIDED FOR EVERY CERTIFICATION AND NOT JUST THIS ONE:
--
--   grounding_note states what the item model rests on and what a reader needs
--   in order to judge the credential. It is not where engineering history
--   lives. Scheme documents and commit messages are.
--
-- verify-cert.mjs invariant 23 (blueprint.publishable, s12) now enforces this
-- on every run, so a blueprint written the old way fails the release gate
-- rather than reaching the catalogue.
--
-- ============================================================================
-- WHAT IS CUT, AND WHERE EACH PIECE ALREADY LIVES
-- ============================================================================
--
-- Confirmed by grep against the files on 2026-09-11, per item, before cutting.
-- NOTHING BELOW EXISTS ONLY IN THE NOTE.
--
--   groundingFor() routing, SCRUM_L2 composing SCRUM_CORE          SCHEME line 55
--   "35 entries - 31 plus 4 [derived]"                             SCHEME 587, BoK s9, mig 291
--   nine added / three corrected / audit vs 285-289                mig 291 header, BoK s4.1
--   N4 and N11 wrong; "Developers accountable for the Increment"   mig 291 header, BoK s4.1
--   JTA v1.2 section 7 never committed, not recoverable            JTA v1.4 line 270
--   item-profile tier-routing defect, profileFor(name, tier)       SCHEME 63-64, JTA 312, mig 290
--   509 tasks / unreachable / no emitted prompt changed            SCHEME 63-64, JTA 312
--   verify-profile BYTE-IDENTICAL, AIE-I reaches LITERACY          mig 290 header
--   true_false reachable, isL2, invariant 19, "1056 rows"          JTA s7.4, mig 290 header
--   option floor is a TIER property, three enforcement sites       mig 290, SCHEME, JTA
--   cueConfigFor per-key fallback (named as a function)            kept as a PROPERTY, below
--   the v6.5 note: ISMS-IA ran at len_spread_max 130, not 100      mig 200 header (DECIDED there,
--                                                                  with the reason); HANDOFF-v6_5
--                                                                  149; SCHEME-ISMS-IA s11
--
-- THE CRITIQUE PASS IS KEPT, in mechanism-free wording. "Every item is checked
-- against this list a second time, independently of its authoring" is the
-- strongest quality claim in the note and exactly what an assessor needs.
-- CLAIMS-POLICY and BoK v2.0 already disclose that items are pipeline-drafted
-- and that the bank is unvalidated pending a panel, so this discloses nothing
-- new - and omitting it here would make the blueprint the one place we were coy
-- about it.
--
-- ============================================================================
-- THE THIRD EDIT: cue_guard's last clause is CUT, NOT REWRITTEN
-- ============================================================================
--
-- It read: "ISMS-IA's blueprint says it does; that description is wrong and is
-- a known open item." ISMS-IA is 'available', so its blueprint is ALREADY
-- public - that sentence publishes "a live certification's public blueprint
-- contains a wrong description" under a DIFFERENT credential's row, which is
-- the worst available place for it. It is recorded against ISMS-IA instead, in
-- SCHEME-ISMS-IA section 11, and its text is fixed in its own migration.
--
-- The finding is not lost by cutting it here: SCHEME-SM-AI-II line 509 already
-- states that no qualification-density control has ever existed.
--
-- ============================================================================
-- THE STATEMENT
-- ============================================================================
-- Dollar-quoted on purpose. The new text contains apostrophes, and doubling
-- them across a paste into the SQL editor is exactly the transport failure
-- CLAUDE.md warns about. Dollar quoting needs no escaping, and the paragraph
-- breaks are explicit rather than introduced by terminal wrapping.

begin;

-- --- PRE-CONDITIONS. These abort; they do not report. ----------------------
do $pre$
declare
  bp     jsonb;
  dirty  int;
  total  int;
begin
  select exam_blueprint into bp
    from public.certifications where code = 'SM-AI-II';

  if bp is null then
    raise exception using
      message = 'SM-AI-II has no exam_blueprint',
      hint    = 'wrong database, or the row is gone';
  end if;

  -- POSITIONAL, not lexical: the note 293 replaces opens on its own label.
  if bp->'item_model'->>'grounding_note' not like 'STAGE 9 PRE-CONDITIONS%' then
    raise exception using
      message = 'grounding_note is not the note 293 expects',
      detail  = left(bp->'item_model'->>'grounding_note', 60),
      hint    = 'already applied, or edited since - stop and read it';
  end if;

  -- THE NEGATIVE HALF. Asserting only that SM-AI-II is dirty would pass on a
  -- catalogue where a sibling had also drifted. Both counts are named.
  select count(*) filter (where exam_blueprint::text ~ '\.mjs|\.ts|HANDOFF|migration [0-9]|scripts/|verify-cert'),
         count(*) filter (where exam_blueprint is not null)
    into dirty, total
    from public.certifications;

  if dirty <> 1 or total <> 12 then
    raise exception using
      message = 'the catalogue is not in the state 293 was written against',
      detail  = format('dirty %s (expect 1), with_blueprint %s (expect 12)', dirty, total),
      hint    = 'a sibling blueprint moved - investigate before editing';
  end if;
end
$pre$;

-- --- THE UPDATE. One statement, three fields. ------------------------------
update public.certifications
set exam_blueprint = jsonb_set(
      jsonb_set(
        jsonb_set(
          exam_blueprint,
          '{item_model,grounding_note}',
          to_jsonb($note$Items for this certification are grounded against the 2020 Scrum Guide as the sole normative source for Scrum. Where the Guide is silent, this scheme's own job-task analysis governs, and no item may present a scheme judgement as though the Guide determined it.

The grounding carries an explicit list of claims the Guide DOES NOT make: 35 entries, 31 written as prohibitions and 4 labelled [derived], each one a proposition the field commonly asserts and the 2020 Guide does not. No item may turn on a claim the list forbids. Every item is checked against this list a second time, independently of its authoring. Where the grounding cannot carry the constraint for a task, that task is cut from exam scope rather than tested loosely.

Each entry carries its inverse where one exists. A prohibition that forbids only the permissive error teaches the restrictive one: an item that may not say a Scrum Master assigns work must equally not say a Scrum Master may never suggest who takes an item. Both are wrong, and a list naming only the first trains the second.

The list is maintained in the item generator's source rather than in a document, so that the guarded list and the injected list cannot drift apart. The readable copy is Body of Knowledge v2.0 section 4.

Level II item model. All four options are defensible on the facts given; the best answer is better than the second-best for a reason a competent practitioner could state in one sentence, and the second-best is genuinely defensible rather than merely wrong. An item whose second choice is simply incorrect is a Level I item in the wrong bank.

The cue-length tolerance declared for this bank is ADOPTED FROM A SIBLING LEVEL II CERTIFICATION, NOT MEASURED ON THIS ONE. It is marked provisional for that reason and is to be re-declared once measured over this bank's own secure items.$note$::text)
        ),
        '{item_model,cue_tolerance,rationale}',
        to_jsonb($cue$Level II. The best option is frequently best BECAUSE it carries a qualifying clause the others do not, so a Level I margin (5 characters / 10 percent) would reject correct items and retain flat ones. All three numeric keys are declared explicitly: the guard falls back PER KEY, so an object missing one would silently apply the Level I value for that key while still reporting the blueprint as its source. These three numbers are adopted from a sibling Level II certification as a starting point ONLY - they are NOT evidence for this bank. Re-measure over SM-AI-II secure/en once the bank exists and re-declare with measured_over populated.$cue$::text)
      ),
      '{item_model,cue_guard}',
      to_jsonb($guard$Character-based. The guard measures the key's length against the longest distractor, and the spread across all options, in CHARACTERS, applying the tolerance declared in cue_tolerance. It does NOT measure qualification density.$guard$::text)
    )
where code = 'SM-AI-II';

commit;


-- ============================================================================
-- VERIFICATION - the one visible result set. 21 rows, all ok = true.
-- ============================================================================
-- AS RUN 2026-09-11: twenty of twenty-one passed first time. Row 17 read 1856
-- against a predicted 1846, and the ten characters were TRANSPORT, not content.
--
--   stored note_len   1856   CR chars 10   LF chars 10   CRs stripped 1846
--
-- This file is LF throughout. The note body is six paragraphs, so five blank
-- lines, so TEN newline characters, and the browser paste normalised every one
-- of them to CRLF. Rows 18 and 19 matched exactly because rationale and
-- cue_guard are single-line strings with no newline to normalise - which is the
-- mechanism confirming itself rather than luck.
--
-- THE LENGTH CHECK WAS MEASURING THE TRANSPORT. CLAUDE.md already says to read a
-- body back and md5 it "(CRs stripped, as 244, 245 and 249 do)"; that rule was
-- written about pg_proc.prosrc and applies verbatim to jsonb text. Rows 17-19
-- now strip chr(13) before counting, so the assertion is about what was written
-- rather than about how it travelled.
--
-- THE SIX POSITIONAL ROWS ARE WHY THIS WAS A FOOTNOTE AND NOT AN INVESTIGATION.
-- 01-08 passed, so no content was lost; only the count was wrong, and the count
-- was the one row expressed as a NUMBER rather than as a PROPERTY. That is the
-- house rule arriving from the other direction: post-conditions name a property,
-- not a count, and the single count on the page is the single row that fired.
-- Rows 1-8 are the POSITIVE half and they are POSITIONAL, not a length check:
--   each names a fact a candidate or an assessor needs in order to judge the
--   instrument, and a note that lost any one of them would still be the right
--   length. Rows 9-16 are the NEGATIVE half in three directions - no internals,
--   no sibling named, and the DECLARED NUMBERS untouched, because this was an
--   editing change and a rewrite that quietly moved 100/25/15 would look
--   identical to every prose check above it. Rows 20-21 are the catalogue as a
--   whole: dirty must reach 0, and with_blueprint must still be 12 - jsonb_set
--   against a NULL blueprint yields NULL, so a mis-scoped update shows up as 11
--   rather than as an error.
with b as (
  select exam_blueprint as bp from public.certifications where code = 'SM-AI-II'
), cat as (
  select
    count(*) filter (where exam_blueprint::text ~ '\.mjs|\.ts|HANDOFF|migration [0-9]|scripts/|verify-cert') as dirty,
    count(*) filter (where exam_blueprint is not null)                                                      as total
  from public.certifications
), v as (
  select bp,
         bp->'item_model'->>'grounding_note'          as note,
         bp->'item_model'->>'cue_guard'               as guard,
         bp->'item_model'->'cue_tolerance'            as cue
  from b
)
select t.check_name, t.actual, t.expected, (t.actual = t.expected) as ok
from v, cat, lateral (values
  ('01 opens on the source',        (note like 'Items for this certification are grounded against the 2020 Scrum Guide%')::text,          'true'),
  ('02 keeps the count',            (note like '%35 entries, 31 written as prohibitions and 4 labelled [derived]%')::text,                'true'),
  ('03 keeps critique pass',        (note like '%independently of its authoring%')::text,                                                 'true'),
  ('04 keeps readable copy',        (note like '%Body of Knowledge v2.0 section 4%')::text,                                               'true'),
  ('05 keeps adopted disclosure',   (note like '%ADOPTED FROM A SIBLING LEVEL II CERTIFICATION, NOT MEASURED ON THIS ONE%')::text,        'true'),
  ('06 keeps the cut rule',         (note like '%cut from exam scope rather than tested loosely%')::text,                                 'true'),
  ('07 cue status untouched',       (cue->>'status' = 'PROVISIONAL - NOT YET MEASURED ON THIS BANK')::text,                               'true'),
  ('08 cue_guard ends clean',       (guard like '%does NOT measure qualification density.')::text,                                        'true'),
  ('09 still names internals',      (bp::text ~ '\.mjs|\.ts|HANDOFF|migration [0-9]|scripts/|verify-cert')::text,                         'false'),
  ('10 still names ISMS-IA',        (guard ~ 'ISMS-IA')::text,                                                                            'false'),
  ('11 len_spread_max',             cue->>'len_spread_max',                                                                               '100'),
  ('12 key_len_margin',             cue->>'key_len_margin',                                                                               '25'),
  ('13 key_len_pct',                cue->>'key_len_pct',                                                                                  '15'),
  ('14 measured_over still null',   (cue->>'measured_over' is null)::text,                                                                'true'),
  ('15 contract untouched',         (bp->'item_model'->>'contract' is not null)::text,                                                    'true'),
  ('16 difficulty_note untouched',  (bp->>'difficulty_note' is not null)::text,                                                           'true'),
  ('17 note length, CRs stripped',  length(replace(note, chr(13), ''))::text,                                                             '1846'),
  ('18 rationale length',           length(replace(cue->>'rationale', chr(13), ''))::text,                                                '640'),
  ('19 cue_guard length',           length(replace(guard, chr(13), ''))::text,                                                            '227'),
  ('20 CATALOGUE dirty',            cat.dirty::text,                                                                                      '0'),
  ('21 CATALOGUE with_blueprint',   cat.total::text,                                                                                      '12')
) as t(check_name, actual, expected)
order by t.check_name;
