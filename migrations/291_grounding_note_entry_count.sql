-- 291: the never-assert list went 26 -> 35, and six records said 26
--
-- ONE STATEMENT, TWO GUARDS.
--
-- ============================================================================
-- WHY
-- ============================================================================
--
-- Migration 290 wrote a grounding_note stating that SCRUM_GUIDE_FACTS holds
-- "the 26 never-assert entries - 22 plus 4 labelled [derived]". That was true
-- when 290 ran, this morning, and it stopped being true this afternoon.
--
-- An audit of the list against migrations 285, 287, 288 and 289 added NINE
-- entries and corrected THREE. Every one of those four migrations retired a
-- claim that had reached the job-task analysis, and SCRUM_GUIDE_FACTS was
-- written before all four - so the list guarded against the errors the field
-- makes and not against the errors this credential had already made.
--
-- TWO OF THE ORIGINAL 22 WERE NOT MERELY MISSING BUT WRONG, and both were live
-- in the generation prompt:
--
--   N4  asserted "The Developers are accountable for the Increment" - the exact
--       claim migration 289 retired from five sites hours earlier. A dry run on
--       task 5.3 keyed it.
--   N11 asserted "Nobody assigns work" and gave self-management to the
--       Developers. The Guide states no prohibition, and gives the provision to
--       the SCRUM TEAM: "They are also self-managing, meaning they internally
--       decide who does what, when, and how." Both halves were retired by 285.
--
-- A never-assert list that asserts what the migrations retired is worse than a
-- short one. It is a defect with authority.
--
-- ============================================================================
-- THE COUNT HAS SIX HOMES AND THIS IS THE SIXTH
-- ============================================================================
--
-- 26 was recorded in SCHEME-SM-AI-II.md section 8.2, jta/SM-AI-II_JTA_v1.4.md
-- section 7.1, jta/SM-AI-II_BoK_v2.0.md sections 4.1 and 9, HANDOFF-v9_7.md in
-- two places, and here. The five in git moved in the same commit as the code.
-- This one is in the database and needs a migration, which is the whole reason
-- the BoK's volatility register carries the row "any change to either copy is a
-- change to both".
--
-- ============================================================================
-- SURGICAL REPLACE, NOT A REWRITE. 290 built its note from concatenated
-- literals; this one replaces ONE SPAN inside it and leaves every other byte
-- alone. A second full rewrite would put 290's positional guard properties at
-- risk for no reason - and guard 1 below re-checks them rather than assuming.
--
-- Verified before writing: the span occurs at offset 241 of a 1989-character
-- note. THE NEW STRING CONTAINS NO APOSTROPHE.
--
-- Run in the Supabase SQL editor. One statement, then two guards.
-- ============================================================================


-- 1. the count, in place
update public.certifications c
set exam_blueprint = jsonb_set(
  c.exam_blueprint,
  '{item_model,grounding_note}',
  to_jsonb(replace(
    c.exam_blueprint->'item_model'->>'grounding_note',
    'That constant holds the 26 never-assert entries - 22 plus 4 labelled [derived] - ' ||
    'with the paired-error rule inside the third derived entry. The 26 live in CODE: ' ||
    'SM-AI-II_JTA_v1.2 section 7 was never committed and cannot be produced, and ' ||
    'jta/SM-AI-II_BoK_v2.0.md section 4 is the readable copy.',
    'That constant holds 35 never-assert entries - 31 plus 4 labelled [derived]. Nine ' ||
    'were added and three corrected on 2026-09-10, after an audit against migrations ' ||
    '285 to 289: each of those retired a claim that had reached this job-task analysis, ' ||
    'the list was written before all four, and two of the original 22 were not merely ' ||
    'missing but wrong - one asserted the Developers are accountable for the Increment, ' ||
    'which 289 retired the same day. The 35 live in CODE: SM-AI-II_JTA_v1.2 section 7 ' ||
    'was never committed and cannot be produced, and jta/SM-AI-II_BoK_v2.0.md section 4 ' ||
    'is the readable copy, where the paired-error rule is now stated as a rule at 4.0 ' ||
    'rather than living inside one entry.'
  ))
)
where c.code = 'SM-AI-II';


-- ============================================================================
-- GUARD 1 - the count moved, AND 290's properties survived the replace.
--
-- The negative half is not "26 is absent". It is that a surgical replace did
-- not disturb the note around it: 290's guard 1 established that the note opens
-- BOTH CLEARED and that STILL BLOCKING appears exactly once, bound to the words
-- that quote it. A replace() with a mistyped span silently no-ops, and a
-- replace() that matched more than intended silently truncates. Both are caught
-- here rather than at the next reader.
-- ============================================================================
do $$
declare n text;
declare q text := 'This note read ';
declare b text := 'STILL BLOCKING';
declare p_block int;
declare p_quote int;
begin
  select c.exam_blueprint->'item_model'->>'grounding_note' into n
  from public.certifications c where c.code = 'SM-AI-II';

  -- positive: the new count
  if n not like '%35 never-assert entries%' then
    raise exception 'note does not carry the new count'
      using hint = 'the replace found no span and silently did nothing';
  end if;
  if n not like '%31 plus 4 labelled [derived]%' then
    raise exception 'note does not carry the new breakdown';
  end if;
  if n not like '%The 35 live in CODE%' then
    raise exception 'note still points at the old total downstream';
  end if;

  -- negative: no surviving 26
  if n like '%26 never-assert%' or n like '%The 26 live in CODE%' then
    raise exception 'the old count survives'
      using hint = 'replace matched only part of the span';
  end if;

  -- 290 STILL HOLDS. Re-checked, not assumed.
  if n not like 'STAGE 9 PRE-CONDITIONS - BOTH CLEARED.%' then
    raise exception 'the replace disturbed the opening'
      using detail = left(n, 60);
  end if;
  p_block := position(b in n);
  p_quote := position(q || b in n);
  if p_block = 0 or p_quote = 0 or p_block <> p_quote + length(q) then
    raise exception 'the quotation binding from 290 no longer holds'
      using hint = 'the replace moved or split the quoted phrase';
  end if;
  if position(b in substr(n, p_block + length(b))) > 0 then
    raise exception 'a second occurrence of the retired phrase appeared';
  end if;
end $$;


-- ============================================================================
-- GUARD 2 - one key, again. Named siblings with the values they must hold.
-- Identical to 290's guard 2: this migration touches grounding_note and
-- nothing else, and jsonb_set on a nested path rewrites the whole column.
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


-- Read, not asserted. Expect note_chars to GROW from 1989.
select c.code,
       length(c.exam_blueprint->'item_model'->>'grounding_note') as note_chars,
       substr(c.exam_blueprint->'item_model'->>'grounding_note', 241, 90) as at_the_span
from public.certifications c
where c.code = 'SM-AI-II';
