-- 313_canonical_item_hash.sql
--
-- THE STORED REVIEW HASHES WERE COMPUTED OVER A JSON SERIALISATION.
--
-- 311 stored en_hash for 30 reviews using the packet generator's definition:
--   sha256(question_text + JSON.stringify(options) + explanation)
-- and the byte form of that serialisation is an implementation detail of
-- whatever last wrote the row. A re-translation that rewrote the options jsonb
-- without changing one character of option TEXT moved the hash.
--
-- MEASURED, NOT ASSUMED, on group 0a73efe4 before this was built: stem
-- identical, explanation identical, all four option texts identical, option
-- order identical - and the hash different. So the content a reviewer read had
-- not moved; only its encoding had. Had that gone unchecked, verify-cert's new
-- i18n.reviewed invariant would have reported all 30 approvals STALE and put a
-- red gate on two live certifications for a reason that was not true.
--
-- THE NEW DEFINITION IS OVER WHAT A REVIEWER ACTUALLY READ: question_text, then
-- each option's TEXT in id order, then explanation, edge-trimmed and separated.
-- No ids, no JSON, no key order. If two items would read identically to the
-- person who approved one of them, they hash the same - which is the only
-- property that makes the hash mean anything.
--
-- ONE FUNCTION, scripts/lib/item-hash.mjs, imported by BOTH the packet
-- generator and verify-cert. Two copies is how they diverged in the first place.
-- Behaviour-tested 8/8, including that option key order, option array order and
-- edge whitespace are all irrelevant while any change to option text, stem or
-- explanation is not.
--
-- 30 of 30 stored hashes change here. Both sides move together:
-- this migration and the shared function ship in the same commit.
--
-- Run in the Supabase SQL editor.

-- 1. GUARD. Expect 30 rows.
select count(*) as reviews, count(distinct en_hash) as distinct_hashes
from public.item_translation_reviews;

-- 2. RECOMPUTE. Expect 30 rows.
update public.item_translation_reviews r
set en_hash = v.h
from (values
  ('177ba9ad-20e6-4665-b8c5-c9c3217fb39a', timestamptz '2026-09-13T12:00:00+00:00', '09cd4bde'),
  ('dac4e0a4-6c18-47ea-a70e-7f07daa91fe3', timestamptz '2026-09-13T12:00:00+00:00', '09cd4bde'),
  ('177ba9ad-20e6-4665-b8c5-c9c3217fb39a', timestamptz '2026-09-13T23:32:48.126026+00:00', '09cd4bde'),
  ('dac4e0a4-6c18-47ea-a70e-7f07daa91fe3', timestamptz '2026-09-13T23:32:48.126026+00:00', '09cd4bde'),
  ('c55c601f-bf59-421f-aef6-85f295a7f354', timestamptz '2026-09-13T23:32:48.126026+00:00', '3b2c74bc'),
  ('db01a852-c8b4-48e4-b154-dd07d758be66', timestamptz '2026-09-13T23:32:48.126026+00:00', '3b2c74bc'),
  ('22290c5a-031b-4884-9da9-9d98d2a8ce1d', timestamptz '2026-09-13T23:32:48.126026+00:00', 'dee4f01d'),
  ('9bbc6e4f-7260-4b4c-8708-f235abd0272b', timestamptz '2026-09-13T23:32:48.126026+00:00', 'dee4f01d'),
  ('15567f07-dc48-4ced-a38d-3b802d813465', timestamptz '2026-09-13T23:32:48.126026+00:00', 'c1ce51ac'),
  ('8cc847c1-f19d-4eee-8c8e-3b57329078ea', timestamptz '2026-09-13T23:32:48.126026+00:00', 'c1ce51ac'),
  ('4552918e-152a-44b9-b28c-d43e97961e4a', timestamptz '2026-09-13T23:32:48.126026+00:00', '65e7942a'),
  ('925d5acf-8bb4-4c05-8e19-7766af434c0f', timestamptz '2026-09-13T23:32:48.126026+00:00', '65e7942a'),
  ('1411061f-92c9-4bf9-892c-46e6eed766d4', timestamptz '2026-09-13T23:32:48.126026+00:00', '3c6e481f'),
  ('44d74415-3381-4255-94c6-313f1b3cf118', timestamptz '2026-09-13T23:32:48.126026+00:00', '3c6e481f'),
  ('b6ee93c5-95ad-470e-aaea-a95de54f0538', timestamptz '2026-09-13T23:32:48.126026+00:00', 'e91ff19f'),
  ('5b67a604-1dbe-48bf-a114-c3fec8029491', timestamptz '2026-09-13T23:32:48.126026+00:00', 'e91ff19f'),
  ('19645fdf-8cf0-431d-ba68-5b28182bb062', timestamptz '2026-09-13T23:32:48.126026+00:00', 'a1192a77'),
  ('28138950-67ce-4c5a-b534-5d6232e93d88', timestamptz '2026-09-13T23:32:48.126026+00:00', 'a1192a77'),
  ('077f1509-fdbe-4d1d-bd8b-46f449f5b181', timestamptz '2026-09-13T23:32:48.126026+00:00', 'fb5151c3'),
  ('dd880f06-4436-412d-b731-1f0dad852ad7', timestamptz '2026-09-13T23:32:48.126026+00:00', 'fb5151c3'),
  ('2a5c92e1-98a1-4a12-8184-a35998a3d3c3', timestamptz '2026-09-13T23:32:48.126026+00:00', '35e3efa7'),
  ('887c5f26-f166-496e-8e61-82e91c029a46', timestamptz '2026-09-13T23:32:48.126026+00:00', '35e3efa7'),
  ('1c370940-dfb8-4591-afdb-9b10c5cdde70', timestamptz '2026-09-13T23:32:48.126026+00:00', '6670c4fe'),
  ('83c6aa86-224c-4ead-ac7e-f52b3c9623d5', timestamptz '2026-09-13T23:32:48.126026+00:00', '6670c4fe'),
  ('c98b2b62-3721-4530-8bce-d6c638a9346c', timestamptz '2026-09-13T23:32:48.126026+00:00', 'f25aac67'),
  ('2901ac2a-3771-4f5f-afb3-bf3e2edefe08', timestamptz '2026-09-13T23:32:48.126026+00:00', 'f25aac67'),
  ('75be0945-5935-48dd-9a39-14a2af587d3c', timestamptz '2026-09-13T23:32:48.126026+00:00', 'd28081a1'),
  ('4fa30eb9-7772-4fbe-9106-901961bd40a6', timestamptz '2026-09-13T23:32:48.126026+00:00', 'd28081a1'),
  ('582c8e4c-1599-44f2-9bcb-5f6a7350ac59', timestamptz '2026-09-13T23:32:48.126026+00:00', 'c7c34907'),
  ('0287c006-f9c7-481d-9bf4-6074604947fe', timestamptz '2026-09-13T23:32:48.126026+00:00', 'c7c34907')
) as v(qid, rat, h)
where r.question_id = v.qid::uuid and r.reviewed_at = v.rat;

-- 3. POSITIVE: every review still points at a live translated row. Expect 0.
select count(*) as bad
from public.item_translation_reviews r
join public.quiz_questions q on q.id = r.question_id
where q.language = 'en' or q.retired_at is not null;

-- 4. POSITIVE: the two rejections and their later approvals both survive - the
--    append-only history is not collapsed by an UPDATE of one column. Expect 2.
select count(*) as rejections from public.item_translation_reviews where verdict = 'rejected';

-- 5. NEGATIVE: no hash is malformed after the rewrite. Expect 0.
select count(*) as malformed from public.item_translation_reviews where en_hash !~ '^[0-9a-f]{8}$';

-- 6. THE REAL CHECK IS verify-cert. After this runs, i18n.reviewed must report
--    0 stale on every certification. A stale count here means the shared
--    function and these values disagree, which is the defect this migration
--    exists to remove.
