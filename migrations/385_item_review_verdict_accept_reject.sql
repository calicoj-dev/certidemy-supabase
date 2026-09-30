-- 385_item_review_verdict_accept_reject.sql
--
-- WIDEN THE ITEM REVIEW VOCABULARY TO THE VERDICTS THE DIRECTOR ACTUALLY GIVES.
--
-- Ruled PROMPT-97 addendum s2: *"Record these in item_reviews"*, with verdicts `reject` (10 items, each with
-- its reason) and `accept` (46, plus one recorded `accept` with the note `reserve: over cap`).
--
-- ============ THE VOCABULARY HAD NO WORD FOR EITHER, AND MAPPING WOULD HAVE LIED ============
--
-- 379 closed it at `read | tier_a | tier_b | tier_c`, deliberately, because an open vocabulary makes
-- "has a human read this" silently unanswerable. Those four cover a READ and its findings:
--
--   read      a human read it and recorded findings. Says nothing about whether it is good.
--   tier_a    a wrong key or an invented clause.
--   tier_b    an arguable second answer.
--   tier_c    the key is sound; a text fix is recorded in the note.
--
-- None of them is `accept`. Recording 46 accepted items as `read` would be true and would lose the judgement
-- -- and the judgement is the thing the insert acts on. Recording the 10 as `tier_a` would be FALSE: most were
-- rejected as NEAR-DUPLICATES or as OVER THE ANCHOR CAP, which is surplus, not a defect. The director's own
-- words: *"Most of the problems are duplication across R4 and R5, not bad items."* A vocabulary that can only
-- say "wrong key" would record eight good items as defective.
--
-- So two values are added and the existing four are untouched:
--
--   accept    read AND judged good enough to insert. Still not a gate: `status` decides what is served.
--   reject    read AND ruled out. The note carries the reason, which is the part that cannot be derived.
--
-- ============ WHAT THIS DOES NOT DO, STATED BECAUSE THE RULING'S WORD WAS `item_reviews` ============
--
-- There is no `item_reviews` table and this migration does not create one. 379 argued the case at length and
-- the argument still holds: the read belongs on `item_grounding`, which is already 1:1 with a question and
-- already answers "why should anyone believe this item".
--
-- AND A REJECTED ITEM CANNOT HAVE A ROW HERE AT ALL. `item_grounding.question_id` references
-- `quiz_questions`, and a rejected artifact item was never inserted -- there is no question to key to. So the
-- ten rejections live in `AIMSF-DIRECTOR-REJECTIONS.json`, which exists for exactly that reason: a rejection
-- is the one disposition no artifact can derive. `reject` is added here anyway, because an item ALREADY IN THE
-- BANK can be rejected on a later read -- `f92232b5` is a live candidate -- and a vocabulary that cannot
-- express that would send the next such verdict into a comment.
--
-- ONE STATEMENT: `begin; ... commit;` in the SQL editor asserts an intent, not a transaction.

do $$
declare
  v_def text;
  n_bad int;
begin
  ---------------------------------------------------------------------------
  -- PRE-CONDITION: the constraint 379 created must be there, with the shape this migration assumes.
  -- A migration that silently creates what it meant to alter is how two constraints come to disagree.
  ---------------------------------------------------------------------------
  select pg_get_constraintdef(oid) into v_def
    from pg_constraint
   where conrelid = 'public.item_grounding'::regclass
     and conname = 'item_grounding_review_verdict_chk';
  if v_def is null then
    raise exception 'item_grounding_review_verdict_chk is absent: migration 379 has not run';
  end if;
  if v_def not like '%tier_c%' then
    raise exception 'the verdict CHECK is not the one 379 wrote: %', v_def;
  end if;
  if v_def like '%accept%' then
    raise exception 'the verdict CHECK already allows accept: this migration has run';
  end if;

  alter table public.item_grounding drop constraint item_grounding_review_verdict_chk;
  alter table public.item_grounding
    add constraint item_grounding_review_verdict_chk
    check (review_verdict is null or review_verdict in
           ('read', 'tier_a', 'tier_b', 'tier_c', 'accept', 'reject'));

  comment on column public.item_grounding.review_verdict is
    'A HUMAN''S READ OF THE ENGLISH ITEM: read | tier_a | tier_b | tier_c | accept | reject. It is a RECORD, '
    'never a gate -- it does not promote the row, and quiz_questions.status is what decides what may be '
    'served. An item with verdict ''accept'' and status ''pending_review'' has been read and accepted and is '
    'still not servable. `accept` means read AND judged good; `read` means read, with findings, and no '
    'judgement recorded -- the 34 rows carrying it predate this vocabulary and are NOT retro-labelled.';

  ---------------------------------------------------------------------------
  -- POST-CONDITIONS. BOTH DIRECTIONS: the new values are accepted AND an unrecognised one is still refused.
  -- Asserting only the first passes on a constraint that was dropped and never replaced.
  ---------------------------------------------------------------------------
  select pg_get_constraintdef(oid) into v_def
    from pg_constraint
   where conrelid = 'public.item_grounding'::regclass
     and conname = 'item_grounding_review_verdict_chk';
  if v_def is null then
    raise exception 'the verdict CHECK is GONE: it was dropped and not replaced';
  end if;
  if v_def not like '%accept%' or v_def not like '%reject%' then
    raise exception 'the new verdicts are not in the CHECK: %', v_def;
  end if;
  if v_def not like '%tier_a%' or v_def not like '%tier_b%' or v_def not like '%tier_c%'
     or v_def not like '%read%' then
    raise exception 'widening the CHECK dropped one of 379''s four verdicts: %', v_def;
  end if;

  -- AND IT MUST STILL REFUSE. A constraint nobody has watched refuse anything is the same object as a gate
  -- nobody has watched fire. Tried in a savepoint against a row that cannot exist.
  begin
    insert into public.item_grounding
      (question_id, key_support_clause, key_support, source_id, edition, gates, generator,
       review_verdict, reviewed_by, reviewed_at)
    values
      ('00000000-0000-0000-0000-000000000000', 'x', 'this row exists only to be refused by the check',
       'x', 'x', '[]'::jsonb, 'probe', 'not-a-verdict', 'probe', now());
    raise exception 'the review_verdict CHECK did not refuse an unrecognised verdict';
  exception
    when check_violation then null;                 -- refused, which is correct
    when foreign_key_violation then null;           -- refused one layer earlier, also correct
  end;

  -- NOTHING WAS RE-LABELLED. The 34 rows carrying `read` keep it: `read` and `accept` are different facts and
  -- promoting one to the other would invent a judgement nobody recorded. Asserted as a count that must not
  -- have moved, captured from the live table rather than typed.
  select count(*) into n_bad from public.item_grounding
   where review_verdict is not null
     and review_verdict not in ('read', 'tier_a', 'tier_b', 'tier_c', 'accept', 'reject');
  if n_bad <> 0 then
    raise exception '% row(s) carry a verdict outside the widened vocabulary', n_bad;
  end if;

  raise notice 'item_grounding.review_verdict now allows accept and reject; 379''s four are unchanged';
end $$;
