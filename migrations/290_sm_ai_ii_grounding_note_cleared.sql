-- 290: the last Stage 9 blocker is cleared, and the stored note must stop saying otherwise
--
-- ONE STATEMENT, THREE GUARDS.
--
-- ============================================================================
-- WHY THIS MIGRATION EXISTS AT ALL
-- ============================================================================
--
-- exam_blueprint.item_model.grounding_note is not a comment. It is the copy an
-- assessor reads, it travels with the certification row rather than with a
-- document, and migration 278 deliberately stored the Stage 9 pre-conditions
-- there so they could not be lost the way SM-AI-II_BoK_v1.1.md was.
--
-- Its second half has said STILL BLOCKING since 2026-09-03:
--
--   "scripts/lib/item-profile.mjs resolves profileFor() from the certification
--    NAME by a word-boundary match on scrum and takes no tier argument, so this
--    cert inherits Level I tier profile. Fix before any item is generated."
--
-- That became false on 2026-09-10. profileFor(certName, tier) now resolves TIER
-- FIRST, before any name match, and returns PROFESSIONAL_L2 for tier 2.
--
-- A stored note that names a blocker which no longer exists is worse than no
-- note: it is a record that lies, and the next session reads it as current.
-- Migration 284 corrected the first half for the same reason.
--
-- ============================================================================
-- WHAT THE DEFECT COULD AND COULD NOT DO - MEASURED, NOT ASSUMED
-- ============================================================================
--
-- The note asserted that this certification would GENERATE against Level I
-- difficulty guidance. That was checked before the fix rather than repeated.
--
-- The only live consumer of item-profile.mjs was difficultyLineFor(), which
-- item-pipeline.mjs passes into bloomDirective(task, kind, legacyLine). That
-- function returns the legacy line ONLY when the task declares no bloom_level.
--
--   select count(*) from public.tasks where bloom_level is null;   ->  0
--   ...across 509 tasks and 13 certifications, on 2026-09-10.
--
-- gen-cert-secure additionally hard-skips any task without a declared level. So
-- the wrong profile was UNREACHABLE on every generation path in the repo, and
-- the fix changes no prompt that is being emitted today.
--
-- THAT IS NOT AN ARGUMENT FOR HAVING LEFT IT. The fallback fires exactly when a
-- task has lost its declared level - a state that is already broken - and it
-- fires SILENTLY, handing a Level II bank Level I instructions at the worst
-- possible moment. It is a trapdoor, and this closes it.
--
-- The note is rewritten to say what was measured. "Cleared" without the
-- measurement would leave the next reader believing a bank had been at risk.
--
-- ============================================================================
-- THE SECOND DEFECT CLEARED HERE, WHICH THE NOTE NEVER MENTIONED
-- ============================================================================
--
-- isL2(task, tier) is tier >= 2 AND bloom_level = 4_analyze. That is correct for
-- the four-defensible-options CONTRACT, which belongs where the candidate
-- weighs. It is wrong for the OPTION COUNT.
--
-- This certification has 16 tasks at 3_apply. All 16 fell through isL2() to a
-- draft prompt reading:
--
--   question_type is ONLY "single_choice" or "true_false"
--
-- and validateEnglish accepted true_false with two options. verify-cert
-- invariant 19 FAILS THE WHOLE SECURE BANK on a single surviving two-option
-- item - "a guesser scores 50% on a two-option item" - and it would not have
-- surfaced until 1056 rows had been generated and inserted.
--
-- The scheme documents already said every item is four-option. Only the
-- generator disagreed. The option floor is now a TIER property, enforced in the
-- draft prompt, the critique prompt and validateEnglish.
--
-- ============================================================================
-- NO SCHEMA CHANGE. NO bloom_level touched. NO JTA version bump. Nothing but
-- one key inside one jsonb column on one row.
--
-- THE NEW STRING CONTAINS NO APOSTROPHE, and it is assembled from short
-- concatenated literals rather than one long line, so no fragment can be
-- truncated in transit between terminal and SQL editor.
--
-- GUARD 1 WAS WRONG ON ITS FIRST RUN AND ABORTED THIS MIGRATION. It searched
-- the whole note for STILL BLOCKING, which the new note deliberately QUOTES in
-- order to say what it corrected. The note was right and the guard was wrong.
-- The guard is now positional, and the episode is recorded inside it rather
-- than fixed quietly: a check that would edit the content it checks is worth a
-- paragraph.
--
-- Run in the Supabase SQL editor. One statement, then three guards.
-- ============================================================================


-- 1. the stored note, both halves cleared
update public.certifications c
set exam_blueprint = jsonb_set(
  c.exam_blueprint,
  '{item_model,grounding_note}',
  to_jsonb(
    'STAGE 9 PRE-CONDITIONS - BOTH CLEARED. ' ||
    '(1) CLEARED 2026-09-09: scripts/lib/item-grounding.mjs routes this certification ' ||
    'correctly. groundingFor() reads tier and returns SCRUM_L2 for tier 2, which composes ' ||
    'SCRUM_CORE with SCRUM_GUIDE_FACTS. That constant holds the 26 never-assert entries - ' ||
    '22 plus 4 labelled [derived] - with the paired-error rule inside the third derived ' ||
    'entry. The 26 live in CODE: SM-AI-II_JTA_v1.2 section 7 was never committed and ' ||
    'cannot be produced, and jta/SM-AI-II_BoK_v2.0.md section 4 is the readable copy. ' ||
    '(2) CLEARED 2026-09-10 by migration 290: scripts/lib/item-profile.mjs now takes ' ||
    'profileFor(certName, tier) and resolves TIER FIRST, before any name match, returning ' ||
    'PROFESSIONAL_L2 for tier 2. This note read STILL BLOCKING until today, on the ground ' ||
    'that a word-boundary match on scrum caught the name and no tier was read. ' ||
    'WHAT THE DEFECT COULD NOT DO, measured rather than repeated: the only live consumer ' ||
    'of that module was difficultyLineFor, which reaches a prompt through bloomDirective, ' ||
    'and that function returns it ONLY when a task declares no bloom_level. All 509 tasks ' ||
    'across 13 certifications declare one, so the wrong profile was unreachable and no ' ||
    'emitted prompt changed. The fix closes a trapdoor that fires silently, exactly when a ' ||
    'task has lost its declared level. scripts/verify-profile.mjs asserts the tier-1 ' ||
    'difficulty text BYTE-IDENTICAL and that AIE-I still reaches LITERACY, because a check ' ||
    'confirming only that this cert moved passes on a change that moved SM-AI-I too. ' ||
    'ALSO CLEARED HERE, and never named in this note: a two-option true_false item could ' ||
    'reach the SECURE pool from any of the 16 apply-level tasks, because isL2 requires ' ||
    'tier 2 AND 4_analyze and the 16 fell to the Level I branch. verify-cert invariant 19 ' ||
    'fails the WHOLE secure bank on one such row, and it would not have surfaced until ' ||
    '1056 rows existed. The option floor is now a TIER property, enforced in the draft ' ||
    'prompt, the critique prompt and validateEnglish.'
  )
)
where c.code = 'SM-AI-II';


-- ============================================================================
-- GUARD 1 - the note must not ASSERT the blocker. It may QUOTE it.
--
-- THIS GUARD WAS WRONG ON ITS FIRST RUN AND THE NOTE WAS RIGHT.
--
-- The first version searched the whole note for STILL BLOCKING and aborted the
-- migration. The note deliberately quotes the sentence it replaces:
--
--   "This note read STILL BLOCKING until today, on the ground that a
--    word-boundary match on scrum caught the name and no tier was read."
--
-- That quotation is what makes the record readable. A correction that does not
-- say what it corrected leaves the next reader unable to tell whether the old
-- claim was wrong or merely absent. Deleting it to satisfy the check would be
-- THE CHECK EDITING THE CONTENT, which is the wrong direction of authority.
--
-- FOURTH INSTANCE IN ONE DAY of a substring guard matching the English that
-- explains a deletion. The other three were in the scripts that produced this
-- migration: a post-condition that matched bloomForCert inside the comment
-- saying bloomForCert had been removed; one that asserted a COUNT of surviving
-- filename mentions instead of naming the property; and one that encoded LF
-- against a CRLF file. Same family as the 'to anon' guard that once aborted on
-- a comment reading 'no grant to anon or authenticated'.
--
-- THE PROPERTY IS POSITIONAL, NOT LEXICAL. A stale note asserts the blocker in
-- the sentence an assessor reads first, and at its own (2) label. A corrected
-- note carries the phrase only downstream of the clearance marker, inside the
-- clause that explains it. Four checks:
--
--   A. the opening declares both cleared - it is what a stale note would
--      contradict, and it is the only line most readers reach
--   B. no retired phrase appears BEFORE the (2) CLEARED marker
--   C. STILL BLOCKING occurs at most once, and that occurrence is the quotation
--   D. the other three phrases are absent outright, because nothing quotes them
--
-- If a later rewrite needs to quote one of D's three, MOVE IT TO C. Do not drop
-- it from the list - an unquoted retired phrase is the thing being guarded.
-- ============================================================================
do $
declare n text;
declare head text;
declare q text := 'This note read ';
declare b text := 'STILL BLOCKING';
declare p_cleared int;
declare p_block int;
declare p_quote int;
begin
  select c.exam_blueprint->'item_model'->>'grounding_note' into n
  from public.certifications c where c.code = 'SM-AI-II';

  if n is null then
    raise exception 'grounding_note missing' using hint = 'jsonb_set path wrong';
  end if;

  -- POSITIVE: it says what it must.
  if n not like 'STAGE 9 PRE-CONDITIONS - BOTH CLEARED.%' then
    raise exception 'note does not open with both cleared'
      using detail = left(n, 60);
  end if;
  if n not like '%profileFor(certName, tier)%' then
    raise exception 'note does not name the new signature';
  end if;
  if n not like '%BYTE-IDENTICAL%' then
    raise exception 'note does not name the regression guard';
  end if;
  if n not like '%16 apply-level tasks%' then
    raise exception 'note does not carry the option-floor defect';
  end if;

  p_cleared := position('(2) CLEARED' in n);
  if p_cleared = 0 then
    raise exception 'note carries no (2) CLEARED marker'
      using hint = 'the second pre-condition must be labelled cleared';
  end if;

  -- B. NOTHING RETIRED MAY SIT UPSTREAM OF THE CLEARANCE MARKER.
  -- This is what the first version was reaching for. A note appended to rather
  -- than replaced fails here: its (2) label still reads STILL BLOCKING, so the
  -- phrase lands before the marker or the marker is absent entirely.
  head := left(n, p_cleared - 1);
  if head like '%' || b || '%'
     or head like '%takes no tier argument%'
     or head like '%ONE OF THE TWO IS CLEARED%'
     or head like '%Fix before any item is generated%' then
    raise exception 'blocker asserted before the clearance marker'
      using detail = left(head, 80),
            hint = 'the note was appended to rather than replaced';
  end if;

  -- C. THE ONE PHRASE THE NOTE QUOTES, bound to its quotation.
  p_block := position(b in n);
  p_quote := position(q || b in n);
  if p_block > 0 then
    if p_quote = 0 or p_block <> p_quote + length(q) then
      raise exception 'the retired phrase appears outside its quotation'
        using detail = substr(n, greatest(p_block - 40, 1), 80),
              hint = 'it may only follow the words: This note read';
    end if;
    if position(b in substr(n, p_block + length(b))) > 0 then
      raise exception 'the retired phrase appears a second time'
        using hint = 'one quotation only; a second occurrence is an assertion';
    end if;
  end if;

  -- D. NOTHING QUOTES THESE THREE, so absence is the whole property.
  if n like '%takes no tier argument%'
     or n like '%ONE OF THE TWO IS CLEARED%'
     or n like '%Fix before any item is generated%' then
    raise exception 'an unquoted retired phrase survives'
      using hint = 'to quote one deliberately, move it to check C';
  end if;
end $;


-- ============================================================================
-- GUARD 2 - THIS MIGRATION TOUCHES ONE KEY. Named siblings, not a count.
--
-- jsonb_set on a nested path rewrites the whole column. A typo in the path
-- silently relocates the note and leaves the old one in place; a wrong column
-- reference silently drops cue_tolerance. Neither raises. So the keys that must
-- NOT have moved are named with the values they must still hold.
-- ============================================================================
do $$
declare b jsonb;
declare bad text := '';
begin
  select c.exam_blueprint into b
  from public.certifications c where c.code = 'SM-AI-II';

  if b->>'version' is distinct from '2.0' then bad := bad || 'version '; end if;
  if b->'cognitive_profile'->>'4_analyze' is distinct from '63.72' then bad := bad || 'analyze '; end if;
  if b->'cognitive_profile'->>'3_apply' is distinct from '36.28' then bad := bad || 'apply '; end if;
  if b->'task_counts'->>'4_analyze' is distinct from '28' then bad := bad || 'count_analyze '; end if;
  if b->'task_counts'->>'3_apply' is distinct from '16' then bad := bad || 'count_apply '; end if;
  if b->'item_model'->>'tier' is distinct from 'II' then bad := bad || 'tier '; end if;
  if b->'item_model'->'cue_tolerance'->>'len_spread_max' is distinct from '100' then bad := bad || 'spread '; end if;
  if b->'item_model'->'cue_tolerance'->>'key_len_margin' is distinct from '25' then bad := bad || 'margin '; end if;
  if b->'item_model'->'cue_tolerance'->>'key_len_pct' is distinct from '15' then bad := bad || 'pct '; end if;
  if b->'item_model'->'cue_tolerance'->>'measured_over' is not null then bad := bad || 'measured_over '; end if;

  if bad <> '' then
    raise exception 'blueprint keys moved that must not have'
      using detail = bad,
            hint = 'only item_model.grounding_note may change here';
  end if;
end $$;


-- ============================================================================
-- GUARD 3 - the sweep, scoped to EVERY certification rather than to this one.
--
-- 288 found a 2017 ordering phrase in D1 while correcting D4; 289 found an
-- Increment-accountability defect in D2 while reading D5. Both times the guard
-- that caught it was the one scoped wider than the edit. The analogue here is
-- the certification set: item-profile.mjs served all 13, so any other stored
-- note asserting the same blocker is now equally false.
-- ============================================================================
do $$
declare bad text;
begin
  -- SCOPED TO OTHER CERTIFICATIONS, and that exclusion is load-bearing.
  -- SM-AI-II's own note now QUOTES the retired phrase in order to say what it
  -- corrected, so an unscoped sweep matches the row it has just fixed and
  -- aborts. That is the fifth instance in one day of a check reading the
  -- English that explains a deletion - and this one was in the guard written
  -- to fix the fourth. This certification's note is checked positionally by
  -- guard 1; this sweep exists for the twelve carrying no such quotation.
  select string_agg(c.code, ', ' order by c.code) into bad
  from public.certifications c
  where c.code <> 'SM-AI-II'
    and c.exam_blueprint::text ~ '(takes no tier argument|STILL BLOCKING|item-profile\.mjs[^"]{0,120}NAME)';

  if bad is not null then
    raise exception 'the retired item-profile blocker survives in another blueprint'
      using detail = 'certifications: ' || bad,
            hint = 'these carry no quotation, so absence is the whole property';
  end if;
end $$;


-- Read, not asserted.
select c.code,
       left(c.exam_blueprint->'item_model'->>'grounding_note', 120) as opens_with,
       length(c.exam_blueprint->'item_model'->>'grounding_note') as note_chars,
       c.exam_blueprint->'cognitive_profile'->>'4_analyze' as analyze_pct,
       c.exam_blueprint->'item_model'->'cue_tolerance'->>'len_spread_max' as spread
from public.certifications c
where c.code = 'SM-AI-II';
