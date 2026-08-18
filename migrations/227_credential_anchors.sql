-- 227_credential_anchors.sql
--
-- The anchor spine: Merkle trees over issued credentials, chain-agnostic.
--
-- APPLIED EDITOR-FIRST. This file is the record.
--
-- ============================ WHAT THIS IS, PRECISELY ========================
--
-- Each credential's fully signed PUBLIC document is hashed. Those hashes become
-- the leaves of a Merkle tree. Only the ROOT is ever published to a chain.
--
-- NO CREDENTIAL DATA LEAVES THIS DATABASE. Not the holder's name, not the 53
-- alignments, not the identifier hash. A chain would receive 32 bytes per batch
-- and nothing else, which is why this carries no privacy exposure: a hash of a
-- credential reveals nothing about its subject.
--
-- IT IS NOT STORAGE AND NOT A BACKUP. An anchor proves "a document with this
-- exact fingerprint existed by this date". Proving anything requires STILL
-- HOLDING the document and re-hashing it. Lose the document and the anchor says
-- nothing about it.
--
-- ============================ USEFUL WITHOUT ANY CHAIN =======================
--
-- chain, txid and anchored_at are nullable and stay null until someone decides
-- to publish. The tree is worth building regardless: the leaf alone proves a
-- credential has not changed since it was hashed, which is answerable today,
-- internally, for free.
--
-- Publishing later fills three columns on rows that already exist. The same root
-- works for OpenTimestamps (free, Bitcoin, no wallet) or Polygon (~$4/yr, needs
-- a funded key), and both can anchor the same root independently.
--
-- ============================ ONE TREE, ALL ISSUERS ==========================
--
-- Deliberately NOT scoped by issuer_id, unlike status lists.
--
-- A status list must be per-issuer because it is a SIGNED DOCUMENT asserting an
-- issuer's revocations, and one issuer must not sign statements about another's
-- credentials. A Merkle leaf asserts nothing and is signed by nobody -- it is an
-- opaque 32 bytes. A shared tree leaks nothing about which issuer produced which
-- leaf, and stays one transaction per day no matter how many partners exist.
--
-- Certidemy hosts and anchors, exactly as Certidemy holds the signing keys.
-- credentials.issuer_id remains available for querying anchors by issuer.
--
-- ============================ THE VERSION COLUMN IS LOAD-BEARING =============
--
-- open-badge REBUILDS AND RE-SIGNS the credential on every fetch. There is no
-- stored document. So a leaf is only meaningful against a known emitted shape.
--
-- Adding eddsa-rdfc-2022 changed every credential in existence. Had anchors been
-- built the day before, every one would have silently stopped matching -- with
-- no error anywhere, which is this codebase's recurring failure mode.
--
-- doc_version records WHICH shape was hashed. Bump it whenever _shared/ob3.ts
-- changes what is emitted. Prior anchors stay honest: they prove what the
-- document looked like then, and a verifier can see why current bytes differ.

create table public.credential_anchors (
  id           uuid primary key default gen_random_uuid(),
  merkle_root  text        not null,
  leaf_count   int         not null check (leaf_count > 0),
  doc_version  text        not null,
  built_at     timestamptz not null default now(),
  chain        text,
  txid         text,
  anchored_at  timestamptz
);

create unique index credential_anchors_root_uniq
  on public.credential_anchors (merkle_root);

create index credential_anchors_pending
  on public.credential_anchors (built_at) where txid is null;

comment on table public.credential_anchors is
  'One Merkle tree per batch of issued credentials. Only the ROOT is ever published to a chain - no credential data leaves this database. A leaf is sha256 of the fully signed PUBLIC credential document as served, so an anchor proves that exact document existed by built_at. It is not storage and not a backup: proving anything requires still holding the document and re-hashing it.';

comment on column public.credential_anchors.doc_version is
  'Which credential document SHAPE was hashed. open-badge rebuilds and re-signs on every fetch, so a leaf is only meaningful against a known emitted shape. Adding eddsa-rdfc-2022 changed every credential and would have invalidated every prior leaf silently. Bump this when _shared/ob3.ts changes what is emitted; prior anchors stay honest about what the document looked like then.';

comment on column public.credential_anchors.chain is
  'NULL until published. The tree is built and useful without any chain: the leaf alone proves a credential has not changed since it was hashed. Anchoring later fills chain, txid and anchored_at on rows that already exist.';

alter table public.credentials
  add column anchor_id   uuid references public.credential_anchors(id),
  add column anchor_leaf text,
  add column anchor_path jsonb;

comment on column public.credentials.anchor_leaf is
  'sha256 (hex) of the fully signed PUBLIC credential document. The public copy deliberately - the holder copy carries identifier[] and hashes differently, and only the public one can be independently re-fetched and re-hashed by a third party.';

comment on column public.credentials.anchor_path is
  'Merkle inclusion proof: the sibling hashes from this leaf to the root, so a verifier can recompute the root without seeing any other credential.';
