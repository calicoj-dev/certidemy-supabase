-- 234_anchor_block_hash.sql
--
-- Two unrelated things that arrived in the same session.
--
-- 1. The Bitcoin block HASH on credential_anchors.
-- 2. The achievement criteria floor (already run in the editor; recorded here).
--
-- ============================ WHY THE BLOCK HASH ===========================
--
-- txid holds 'block:963090' -- the HEIGHT. A block explorer URL takes the
-- HASH: /block/<hash> renders a page, /block-height/<height> returns the hash
-- as plain text and nothing else.
--
-- ots-upgrade.mjs already fetches the hash. It prints it and throws it away.
-- Storing it turns a green tick the reader has to take on trust into a link
-- they can follow to a third party who has never heard of Certidemy, and see
-- the number sitting in a block. That is the entire value of the anchor and it
-- was one column away.
--
-- The hash is ALSO the explorer-independent artifact. Rendered in monospace
-- beneath the link, anyone running their own node can check it without
-- touching a website. Do not hardcode a single explorer as the only path.
--
-- ============================ WHY NOT REPLACE txid ========================
--
-- 'block:963090' is what was written, what the endpoint has been serving, and
-- what any consumer that read it already holds. It stays. The height is also
-- recorded separately as an integer so a consumer does not have to parse a
-- string with a prefix in it.
--
-- ============================ THE CRITERIA FLOOR ==========================
--
-- Run in the editor on 2026-08-19, recorded here.
--
-- A certification-backed achievement takes criteria.narrative from
-- certification_i18n.claim, which open-badge already guards HARD: an available
-- certification with no English claim throws rather than emitting the generic
-- fallback. That guard exists because the fallback once shipped silently and
-- every smoke test passed against a document whose most important sentence was
-- boilerplate.
--
-- A partner achievement has no claim and no such guard. Without a floor it can
-- go active with criteria_narrative NULL and the fallback ships again, this
-- time under someone else's name. Twenty characters is arbitrary but not
-- meaningless: any real sentence clears it, 'completed' does not.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).

begin;

-- ============================================================ 1. block hash

alter table public.credential_anchors
  add column if not exists btc_block_hash   text,
  add column if not exists btc_block_height bigint;

comment on column public.credential_anchors.btc_block_hash is
  'Bitcoin block hash. The explorer-independent artifact: a reader with their own node can verify without trusting any website. Written by ots-upgrade.mjs, which already fetches it.';
comment on column public.credential_anchors.btc_block_height is
  'Block height as an integer. txid keeps its "block:<height>" string form for consumers that already read it.';

-- A hash is 64 lowercase hex characters. Bitcoin block hashes carry leading
-- zeros, so this must never be stored as a number.
alter table public.credential_anchors drop constraint if exists credential_anchors_btc_hash_format;
alter table public.credential_anchors add constraint credential_anchors_btc_hash_format
  check (btc_block_hash is null or btc_block_hash ~ '^[0-9a-f]{64}$');

-- The two roots confirmed together in block 963090 on 2026-08-18 18:37:30 UTC.
-- Backfilled by hand because the value was printed by the upgrade run and not
-- stored; every future upgrade writes it directly.
update public.credential_anchors
set btc_block_hash   = '0000000000000000000232317d293880bd89613e729530c979456be56cab6f6b',
    btc_block_height = 963090
where txid = 'block:963090'
  and btc_block_hash is null;

-- Height and hash travel together or not at all. A height with no hash is a
-- link that cannot be built; a hash with no height is a page with no label.
alter table public.credential_anchors drop constraint if exists credential_anchors_btc_pair;
alter table public.credential_anchors add constraint credential_anchors_btc_pair
  check ((btc_block_hash is null) = (btc_block_height is null));

-- ============================================================ 2. criteria floor
-- ALREADY RUN IN THE EDITOR on 2026-08-19. Repeated here idempotently so this
-- file is a complete record of the schema at this tip.

alter table public.achievements drop constraint if exists achievements_active_requires_criteria;
alter table public.achievements add constraint achievements_active_requires_criteria
  check (status <> 'active'
         or certification_id is not null
         or length(btrim(coalesce(criteria_narrative,''))) >= 20);

commit;

-- Verification (run separately, one at a time):
--
--   select left(merkle_root,16) as root, leaf_count, chain, txid,
--          btc_block_height, left(btc_block_hash,16) as block_hash,
--          anchored_at
--   from public.credential_anchors order by built_at;
--   -- expect both rows: 963090 / 0000000000000000 / 2026-08-18 18:37:30+00
--
-- Prove the pair constraint bites. This MUST raise:
--
--   update public.credential_anchors set btc_block_hash = null
--   where txid = 'block:963090';
--
-- Prove the hash format constraint bites. This MUST raise:
--
--   update public.credential_anchors set btc_block_hash = '963090'
--   where txid = 'block:963090';
--
-- Prove the criteria floor bites. This MUST raise:
--
--   insert into public.achievements (issuer_id, code, achievement_type, name, description, status)
--   select id, 'CRIT-TEST', 'Course', 'x', 'y', 'active'
--   from public.issuers where slug = 'certidemy';
