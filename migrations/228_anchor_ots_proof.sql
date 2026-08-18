-- 228_anchor_ots_proof.sql
--
-- OpenTimestamps proof storage on credential_anchors.
--
-- APPLIED EDITOR-FIRST. This file is the record.
--
-- ============================ WHY OTS HAS NO TXID ===========================
--
-- 227 gave credential_anchors chain/txid/anchored_at on the assumption that
-- publishing means "send a transaction and record its id". That is true for
-- Polygon and NOT true for OpenTimestamps.
--
-- With OTS you never send a transaction. You hand a hash to calendar servers,
-- which aggregate thousands of submissions from everyone into their own Merkle
-- tree and commit ONE root to Bitcoin, paying the fee themselves. What comes
-- back is a .ots proof file: the chain of operations from your hash up to a
-- Bitcoin block header.
--
-- THE PROOF FILE IS THE RECEIPT. There is no transaction of ours to point at,
-- so txid stays null on the OTS path and ots_proof carries the evidence.
--
-- ============================ TWO PHASES, AND BOTH MATTER ===================
--
-- Measured against the real calendars before this migration was written:
--
--   submit  ->  840-byte proof, four independent calendars accepted it
--               (alice, bob, finney, catallaxy), ALL FOUR reporting
--               PendingAttestation
--
-- PendingAttestation means SUBMITTED, NOT YET IN A BLOCK. The calendars have
-- promised to include the hash; Bitcoin has not confirmed anything. Hours later
-- the proof must be UPGRADED to fetch the completed path down to a real block
-- header.
--
-- So there are genuinely two states and the schema has to tell them apart:
--
--   ots_proof set, ots_upgraded_at NULL   submitted, no Bitcoin timestamp yet
--   ots_proof set, ots_upgraded_at set    confirmed, anchored_at is real
--
-- A UI that reads the first state as "anchored to Bitcoin" would be claiming a
-- timestamp that does not exist. anchored_at stays NULL until upgrade for
-- exactly that reason.
--
-- ============================ WHY TEXT, NOT BYTEA ===========================
--
-- The proof is binary, ~840 bytes at submit and a few hundred more after
-- upgrade. bytea round-trips badly through PostgREST and is awkward in JSON, so
-- it is stored base64 in a text column. Small enough that the ~33% encoding
-- overhead is irrelevant.
--
-- ============================ FOUR CALENDARS IS REDUNDANCY ==================
--
-- The proof carries an independent path through each calendar that accepted it.
-- Any one of them disappearing still leaves three routes to a Bitcoin block.
-- That is the durability argument for OTS over a single transaction of our own:
-- no wallet to lose, no key to leak, no balance to run out.

alter table public.credential_anchors
  add column ots_proof       text,
  add column ots_upgraded_at timestamptz,
  add column ots_calendars   text[];

comment on column public.credential_anchors.ots_proof is
  'The OpenTimestamps .ots proof, base64. This IS the receipt - OTS submits to calendar servers that batch into their own Merkle tree and pay the Bitcoin fee, so there is no transaction of ours and txid stays null on this path. ~840 bytes at submit.';

comment on column public.credential_anchors.ots_upgraded_at is
  'When the proof was upgraded to a COMPLETE Bitcoin attestation. NULL means the calendars have accepted the hash but Bitcoin has not confirmed it - submitted, not anchored. Nothing may present a pending proof as a Bitcoin timestamp.';

comment on column public.credential_anchors.ots_calendars is
  'Which calendar servers attested, from the proof itself. Each carries an independent path to a block, so this is redundancy: one calendar disappearing does not invalidate the timestamp.';

-- Pending upgrades: submitted but not yet confirmed. The upgrade job reads this.
create index credential_anchors_ots_pending
  on public.credential_anchors (built_at)
  where ots_proof is not null and ots_upgraded_at is null;

comment on column public.credential_anchors.anchored_at is
  'When the anchor became provable ON A CHAIN. Stays NULL through the OTS pending phase and is set from the Bitcoin block time at upgrade - never from our own clock, since the whole point is a date nobody has to take our word for.';
