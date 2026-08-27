-- 260_lti_platform_status_vocab.sql
--
-- One CHECK: lti_platforms.status in ('active','inactive').
--
-- Editor-first: run these in the SQL editor, one statement at a time. This file
-- is the record of what ran. No function body, so no md5 -- section 4 records
-- the observed constraint definition verbatim.
--
-- ============================ WHY IT WAS MISSING =========================
--
-- 253 created lti_tool_keys.status WITH a vocabulary constraint
-- (lti_tool_keys_status_vocab, 'active'/'retiring'/'retired') and then created
-- lti_platforms.status forty lines later WITHOUT one. Same migration, same
-- pattern, one of the two got the guard.
--
-- So the vocabulary has lived in TypeScript only. create-lti-platform hardcodes
-- 'active' and never reads the column back, which is why nothing has gone wrong
-- yet: there has been no writer capable of putting anything else there.
--
-- update-lti-platform is that writer. It is the first code that can set status
-- to a value an operator chose, and a typo reaching a text column with no
-- vocabulary does not fail -- it succeeds, and the registration silently stops
-- matching lti-login's `.eq("status", "active")` filter. The platform goes dark
-- and the console renders the typo back as the status, which reads as a state
-- the system understands.
--
-- ============================ EVERY WRITER OF lti_platforms ==============
--
-- Required by the rule in CLAUDE.md: a constraint added today does not fail the
-- writers that predate it until one of them next runs. Grepped
-- `from("lti_platforms")` across BOTH repos on 2026-08-27.
--
--   functions/create-lti-platform/index.ts:185   INSERT
--       Writes status: "active", a string literal, on every insert. Passes.
--       It is not settable through that function at all.
--
--   functions/lti-launch/index.ts:426            UPDATE
--       Sets product_family_code ONLY, from a discovered value. Never names
--       status, so the column keeps whatever it had. Passes.
--       THIS IS THE RARE PATH the rule is about: it runs only when a launch
--       carries a tool_platform.product_family_code we have not stored, so it
--       can go weeks without firing. It is safe here because it does not write
--       the constrained column -- not because it was exercised.
--
--   functions/update-lti-platform/index.ts       UPDATE  (new, this change)
--       The only writer that can set status to an operator-chosen value. It
--       validates against the same two-value vocabulary in TypeScript before
--       writing, so this CHECK is the second of two agreeing layers rather
--       than the only one.
--
-- READERS, which a CHECK cannot break, listed so the grep is accounted for:
--   functions/lti-login/index.ts:131        filters .eq("status","active")
--   functions/lti-launch/index.ts:274       reads status, refuses if not active
--   functions/lti-deep-link/index.ts:208    reads id, iss, client_id only
--   ../certidemy-web/lib/console/lti.ts:185 reads status for display
--
-- ============================ WHY TWO VALUES AND NOT THREE ===============
--
-- lti_tool_keys needs 'retiring' because a key being rotated must still verify
-- signatures it already made while no longer making new ones. A registration
-- has no such half-state: either an institution may initiate a login into us or
-- it may not. Adding a third value now would be inventing a state no code
-- reads.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).
-- Idempotent: drop-then-add, the same shape 253 used for its own vocab checks.

-- ---------------------------------------------------------------------------
-- 1. Confirm every existing row passes BEFORE adding the constraint.
--
--    Run this first. Expect ONE row: active | 1. If anything else appears,
--    STOP -- the add below will fail on it, and a failed add is the good
--    outcome only if you were expecting it.
-- ---------------------------------------------------------------------------

-- select status, count(*) from public.lti_platforms group by status;
--
-- OBSERVED 2026-08-27:  active | 1

-- ---------------------------------------------------------------------------
-- 2. Drop first, so the file is re-runnable.
-- ---------------------------------------------------------------------------

alter table public.lti_platforms
  drop constraint if exists lti_platforms_status_vocab;

-- ---------------------------------------------------------------------------
-- 3. The constraint.
-- ---------------------------------------------------------------------------

alter table public.lti_platforms
  add constraint lti_platforms_status_vocab
  check (status in ('active', 'inactive'));

-- ---------------------------------------------------------------------------
-- 4. Verification. Record the OBSERVED definition, not the one written above.
-- ---------------------------------------------------------------------------

-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'public.lti_platforms'::regclass
--   and conname = 'lti_platforms_status_vocab';
--
-- OBSERVED:
--   (paste the verbatim pg_get_constraintdef output here after running)

-- ---------------------------------------------------------------------------
-- 5. No grant follows, and that is not an omission.
--
--    253 gave `authenticated` SELECT on lti_platforms and nothing else; every
--    write goes through an edge function under service_role. A CHECK changes
--    no privilege. Adding a constraint to a table leaves its grants alone.
-- ---------------------------------------------------------------------------
