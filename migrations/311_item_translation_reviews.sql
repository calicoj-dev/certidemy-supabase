-- 311_item_translation_reviews.sql
--
-- THERE IS NOWHERE TO RECORD THAT A HUMAN READ A TRANSLATION.
--
-- quiz_questions has no review column. item_origin='translated' records how a
-- row was PRODUCED and says nothing about whether anyone read it. Until now the
-- only evidence that 28 rows were read was a markdown file and a commit message
-- - the same state module_translations was in before 302.
--
-- A TABLE, NOT A COLUMN, AND THE RPC ARGUMENT INVERTS.
-- create_practice_questions carries a FIXED insert list that has dropped three
-- columns on the floor already, each added back after the fact:
--   bloom_level    "was dropped on the floor; the column default silently
--                   stamped 93.6% of the practice pool"
--   bank_revision  ADDED later
--   item_origin    ADDED by 301
-- A fourth would be a coin flip. But each of those failed because the RPC was
-- supposed to SET them and did not. A review column is the opposite: a freshly
-- generated item is unreviewed, so the correct behaviour is exactly the one that
-- broke bloom_level - leave it alone.
--
-- So it would not fail the 301 way. It would fail worse: NULL means unreviewed
-- AND NULL is what a dropped field leaves, so the two states are
-- indistinguishable. A COLUMN WHOSE FAILURE MODE IS IDENTICAL TO ITS CORRECT
-- DEFAULT HAS NO FAILURE SIGNAL AT ALL. That is the argument for a table, and it
-- is stronger than "the RPC might drop it".
--
-- APPEND-ONLY, AND THE FIRST ROWS ARE WHY. Group 0987a554 was rejected and then
-- approved. A single mutable row would have erased the rejection, and the
-- rejection is the evidence that the inserted-cadence defect recurred across two
-- regenerations - which is the whole reason pin-compliance gained a relative
-- rule. History here is not bookkeeping; it is the finding.
--
-- HASH RATHER THAN TRIGGER, DIVERGING FROM 302 ON PURPOSE. 302 invalidates a
-- module translation when its source changes. Here en_hash records the English
-- the approval was made against, and verify-cert recomputes and compares. A
-- moved English then reads "approved against en#abc, English is now en#def -
-- STALE" instead of a silently cleared flag. It DETECTS staleness rather than
-- ERASING the record, it survives an edit that bypasses a trigger, and it keeps
-- the fact that the row was ever approved and against what.
--
-- reviewed_by IS TEXT AND NOT NULL, AND THAT IS DELIBERATE. These reviews were
-- done by the platform owner and by an external model reading the packet.
-- Neither is cleanly an auth.users row and one of them cannot be. A foreign key
-- that resolves for one reviewer and is NULL for the other would make the record
-- claim less than what happened. The optional uuid is there for when a reviewer
-- IS a platform user, and the text is there always.
--
-- WHAT COULD NOT BE RECONSTRUCTED HONESTLY. The packet was read three times. The
-- first read found four English key defects; the second found ten pt-BR and one
-- es-419 rejections from the cuestao pin leak. THOSE ELEVEN ROWS ARE NOT
-- BACKFILLED: it is known how many there were and why, but not WHICH rows, and
-- inventing the ids would put a claim in an evidence table that nobody could
-- check. Only the third read - 26 approved, group 9 rejected in both languages -
-- and group 9's approval after 310 are recorded here.
--
-- Run in the Supabase SQL editor, one block at a time.

-- ============================================================================
-- 1. THE TABLE
-- ============================================================================

create table if not exists public.item_translation_reviews (
  question_id  uuid not null references public.quiz_questions (id) on delete cascade,
  reviewed_at  timestamptz not null default now(),
  reviewed_by  text not null,
  reviewed_by_user_id uuid references auth.users (id),
  en_hash      text not null,
  verdict      text not null,
  note         text,
  primary key (question_id, reviewed_at)
);

alter table public.item_translation_reviews
  add constraint itr_verdict_check check (verdict in ('approved', 'rejected'));

-- An 8-hex prefix of a sha256, as gen-item-translation-review.mjs prints it.
alter table public.item_translation_reviews
  add constraint itr_hash_shape check (en_hash ~ '^[0-9a-f]{8}$');

-- A reviewer is a person or a named tool, never a shrug.
alter table public.item_translation_reviews
  add constraint itr_reviewer_substantive check (length(btrim(reviewed_by)) >= 12);

-- A REJECTION WITHOUT A REASON IS NOT EVIDENCE. Approvals may be silent; a
-- rejection has to say what was wrong, or the next reader repeats the work.
alter table public.item_translation_reviews
  add constraint itr_rejection_has_note
  check (verdict <> 'rejected' or length(btrim(coalesce(note, ''))) >= 40);

comment on table public.item_translation_reviews is
  'Append-only log of human reviews of non-English item rows. en_hash is the English the review was made against; verify-cert recomputes it, so a moved English makes the review STALE rather than erasing it.';

-- ============================================================================
-- 2. GRANTS AND RLS. RLS is not a grant: the table-level grant is checked
--    first, so enabling RLS AND revoking is required - either alone is wrong.
--    Read only by service-role checkers, which bypass RLS.
-- ============================================================================

alter table public.item_translation_reviews enable row level security;
revoke all on public.item_translation_reviews from anon, authenticated;

-- ============================================================================
-- 3. BACKFILL - 2 rejections, then 28 approvals.
-- ============================================================================

insert into public.item_translation_reviews
  (question_id, reviewed_at, reviewed_by, en_hash, verdict, note)
values
  ('177ba9ad-20e6-4665-b8c5-c9c3217fb39a', timestamptz '2026-09-13 12:00:00+00', 'Grok (external model), reading the same packet; findings relayed and adjudicated by the platform owner', 'fac29f5d', 'rejected',
   'Third packet read. The English explanation states no interval - deliberately, because clause 4.1 imposes none and 9.3.2 only requires the management review to consider changes - and BOTH translations independently inserted a periodicity adverb, across two separate regenerations, while each paragraph said two clauses earlier that the clause imposes no review interval. Fixed by migration 310 and pinned as inserted-cadence.'),
  ('dac4e0a4-6c18-47ea-a70e-7f07daa91fe3', timestamptz '2026-09-13 12:00:00+00', 'Grok (external model), reading the same packet; findings relayed and adjudicated by the platform owner', 'fac29f5d', 'rejected',
   'Third packet read. The English explanation states no interval - deliberately, because clause 4.1 imposes none and 9.3.2 only requires the management review to consider changes - and BOTH translations independently inserted a periodicity adverb, across two separate regenerations, while each paragraph said two clauses earlier that the clause imposes no review interval. Fixed by migration 310 and pinned as inserted-cadence.'),
  ('177ba9ad-20e6-4665-b8c5-c9c3217fb39a', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', 'fac29f5d', 'approved',
   'Approved after migration 310 deleted the inserted cadence adverb. The English did not move, so the hash is the same one the rejection was recorded against - which is the point of storing it.'),
  ('dac4e0a4-6c18-47ea-a70e-7f07daa91fe3', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', 'fac29f5d', 'approved',
   'Approved after migration 310 deleted the inserted cadence adverb. The English did not move, so the hash is the same one the rejection was recorded against - which is the point of storing it.'),
  ('c55c601f-bf59-421f-aef6-85f295a7f354', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', '631796b5', 'approved', null),
  ('db01a852-c8b4-48e4-b154-dd07d758be66', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', '631796b5', 'approved', null),
  ('22290c5a-031b-4884-9da9-9d98d2a8ce1d', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', '081593d1', 'approved', null),
  ('9bbc6e4f-7260-4b4c-8708-f235abd0272b', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', '081593d1', 'approved', null),
  ('15567f07-dc48-4ced-a38d-3b802d813465', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', '31a40f68', 'approved', null),
  ('8cc847c1-f19d-4eee-8c8e-3b57329078ea', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', '31a40f68', 'approved', null),
  ('4552918e-152a-44b9-b28c-d43e97961e4a', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', 'c876a757', 'approved', null),
  ('925d5acf-8bb4-4c05-8e19-7766af434c0f', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', 'c876a757', 'approved', null),
  ('1411061f-92c9-4bf9-892c-46e6eed766d4', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', '72e26b1e', 'approved', null),
  ('44d74415-3381-4255-94c6-313f1b3cf118', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', '72e26b1e', 'approved', null),
  ('b6ee93c5-95ad-470e-aaea-a95de54f0538', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', '7f505a4c', 'approved', null),
  ('5b67a604-1dbe-48bf-a114-c3fec8029491', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', '7f505a4c', 'approved', null),
  ('19645fdf-8cf0-431d-ba68-5b28182bb062', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', 'd758254a', 'approved', null),
  ('28138950-67ce-4c5a-b534-5d6232e93d88', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', 'd758254a', 'approved', null),
  ('077f1509-fdbe-4d1d-bd8b-46f449f5b181', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', 'b004ce91', 'approved', null),
  ('dd880f06-4436-412d-b731-1f0dad852ad7', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', 'b004ce91', 'approved', null),
  ('2a5c92e1-98a1-4a12-8184-a35998a3d3c3', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', '20f627b2', 'approved', null),
  ('887c5f26-f166-496e-8e61-82e91c029a46', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', '20f627b2', 'approved', null),
  ('1c370940-dfb8-4591-afdb-9b10c5cdde70', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', 'bf994164', 'approved', null),
  ('83c6aa86-224c-4ead-ac7e-f52b3c9623d5', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', 'bf994164', 'approved', null),
  ('c98b2b62-3721-4530-8bce-d6c638a9346c', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', 'b91291a0', 'approved', null),
  ('2901ac2a-3771-4f5f-afb3-bf3e2edefe08', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', 'b91291a0', 'approved', null),
  ('75be0945-5935-48dd-9a39-14a2af587d3c', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', '84b03020', 'approved', null),
  ('4fa30eb9-7772-4fbe-9106-901961bd40a6', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', '84b03020', 'approved', null),
  ('582c8e4c-1599-44f2-9bcb-5f6a7350ac59', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', '825544f7', 'approved', null),
  ('0287c006-f9c7-481d-9bf4-6074604947fe', now(), 'platform owner, bilingual read of ITEM-TRANSLATION-REVIEW-2026-09-13.md', '825544f7', 'approved', null)
on conflict (question_id, reviewed_at) do nothing;

-- ============================================================================
-- PROOF
-- ============================================================================

-- 4. POSITIVE: 30 rows - 28 approvals and 2 rejections. Expect 28 / 2.
select verdict, count(*) as n from public.item_translation_reviews group by 1 order by 1;

-- 5. POSITIVE: every review points at a NON-ENGLISH live row. Expect 0.
select count(*) as bad_target
from public.item_translation_reviews r
join public.quiz_questions q on q.id = r.question_id
where q.language = 'en' or q.retired_at is not null;

-- 6. POSITIVE, AND THIS IS WHAT THE HASH IS FOR. Every stored en_hash must still
--    match the English sibling as it stands today. Expect 0 stale.
select count(*) as stale
from public.item_translation_reviews r
join public.quiz_questions t on t.id = r.question_id
join public.quiz_questions e
  on e.question_group_id = t.question_group_id and e.language = 'en'
where left(encode(digest(e.question_text || e.options::text || coalesce(e.explanation, ''), 'sha256'), 'hex'), 8) <> r.en_hash;

-- 7. NEGATIVE: the append-only history survived - group 0987a554 has BOTH a
--    rejection and a later approval. Expect 2 rows, 1 rejected and 1 approved,
--    per language.
select q.language, r.verdict, r.reviewed_at
from public.item_translation_reviews r
join public.quiz_questions q on q.id = r.question_id
where q.question_group_id = '0987a554-f0fe-4219-8916-f9445eb5a230'
order by q.language, r.reviewed_at;

-- 8. NEGATIVE: the constraints bite. Each MUST raise 23514. Run one at a time.
--    insert into public.item_translation_reviews (question_id, reviewed_by, en_hash, verdict)
--    select id, 'me', 'deadbeef', 'approved' from public.quiz_questions limit 1;
--    insert into public.item_translation_reviews (question_id, reviewed_by, en_hash, verdict)
--    select id, 'platform owner review', 'NOTAHASH', 'approved' from public.quiz_questions limit 1;
--    insert into public.item_translation_reviews (question_id, reviewed_by, en_hash, verdict)
--    select id, 'platform owner review', 'deadbeef', 'rejected' from public.quiz_questions limit 1;

-- 9. NEGATIVE: nothing granted to the browser roles. Expect 0.
select grantee, privilege_type from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'item_translation_reviews'
  and grantee in ('anon', 'authenticated');
