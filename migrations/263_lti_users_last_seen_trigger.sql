-- 263_lti_users_last_seen_trigger.sql
--
-- last_seen_at becomes owned by the database, because a convention did not
-- survive contact with a second clock.
--
-- Editor-first: this ran live in the SQL editor on 2026-08-29, one statement at
-- a time. The file is the record of what already ran, not a script anyone
-- executes.
--
-- ============================ WHAT WENT WRONG ============================
--
-- 262 gave lti_users first_seen_at and last_seen_at, both defaulting to now().
-- _shared/lti-provision.ts then wrote last_seen_at itself, from the edge
-- function's clock, via `new Date().toISOString()`. first_seen_at kept the
-- column default, which is POSTGRES's clock.
--
-- TWO CLOCKS, ONE ROW. The first live student launch (2026-08-29 00:23:36)
-- produced a row whose last_seen_at was 13 MILLISECONDS EARLIER than its
-- first_seen_at, describing a single event as having ended before it began.
--
-- ============================ IT WAS ALREADY WRITTEN DOWN ================
--
-- LTI-SETUP.md Part One section 7 documents this exact defect, by name, for
-- lti_deployments:
--
--     "first_seen_at can be LATER than last_seen_at, and that is the writer"
--
-- It was reproduced in a new table, hours later, by a session that had read
-- that document.
--
-- READING A TRAP DOES NOT INOCULATE YOU AGAINST WRITING IT. That happened twice
-- in the same working session -- this, and a distance-proxy guard rebuilt in a
-- console audit after the distance proxy had been read in CLAUDE.md the same
-- evening. The pattern is not that these traps are obscure. It is that a
-- caution has to be remembered at the exact moment you are not thinking about
-- it, which is the moment you are writing the line.
--
-- SO THIS IS A TRIGGER AND NOT A CONVENTION. The column cannot be written
-- wrongly because it cannot be written at all: every insert and update
-- overwrites whatever the caller supplied with now(). One clock, by
-- construction. The application code no longer sends a timestamp, and if some
-- future caller does, it is ignored rather than honoured.
--
-- ============================ AND THE FAST PATH GOT SIMPLER =============
--
-- linkSub()'s upsert now serves both the first sighting and every one after, so
-- the separate `update({ last_seen_at })` in the resolve fast path is gone.
-- One writer, one statement. The fix removed more code than it added.
--
-- ============================ OBSERVED, NOT ASSUMED =====================
--
-- Proven behaviourally rather than by reading pg_trigger. Second launch from
-- the same lti-ri user, 2026-08-29 00:46:47, with linkSub supplying NO
-- timestamp:
--
--   first_seen_at  2026-08-29T00:23:36.136055+00   unchanged
--   last_seen_at   2026-08-29T00:46:47.843714+00   advanced 1391.707s
--
-- The column moved with nothing sending a value, which is the trigger. It also
-- REPAIRED the inverted row as a side effect of normal use -- no backfill
-- statement was written, deliberately, so that the healing would be the proof.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).
-- Idempotent: create or replace, drop if exists.

-- ---------------------------------------------------------------------------
-- 1. The trigger function.
--
--    Named for the pair, not the table, because any table carrying
--    first_seen_at/last_seen_at wants exactly this and should reuse it rather
--    than grow a second copy with its own clock.
-- ---------------------------------------------------------------------------

create or replace function public.lti_touch_last_seen()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  new.last_seen_at := now();
  return new;
end
$$;

-- ---------------------------------------------------------------------------
-- 2. Attach it.
--
--    BEFORE INSERT OR UPDATE, not just UPDATE: on insert it makes last_seen_at
--    share first_seen_at's clock exactly, so a fresh row can never be born
--    inverted either.
-- ---------------------------------------------------------------------------

drop trigger if exists lti_users_touch_last_seen on public.lti_users;

create trigger lti_users_touch_last_seen
before insert or update on public.lti_users
for each row execute function public.lti_touch_last_seen();

-- ---------------------------------------------------------------------------
-- 3. NO BACKFILL, and that is deliberate.
--
--    The one inverted row was left alone. The next launch upserted it, the
--    trigger fired, and last_seen_at became now(). Repairing it by hand would
--    have destroyed the evidence and proven nothing about the trigger.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 4. THE CHECK THAT SHOULD HAVE CAUGHT THIS DID NOT, AND THAT IS UNRESOLVED.
--
--    A generic DO block was written to find any table with a
--    first_seen_at/last_seen_at pair and raise on any inverted row. Run in the
--    SQL editor BEFORE the fix, while the inverted row still existed, it
--    reported "Success. No rows returned" instead of failing.
--
--    A check that reports success when it should fail is precisely the failure
--    mode it was written to prevent. Two candidates remain, and one was tested
--    and EXCLUDED:
--
--      RULED OUT -- an unprivileged read returning empty rather than erroring.
--      Tested 2026-08-29: `anon` selecting lti_users gets a hard 42501, not a
--      silent zero. RLS-with-no-policies is not the mechanism here.
--
--      OPEN -- either information_schema.columns did not match the table for
--      the editor's role, or the SQL editor does not surface RAISE EXCEPTION
--      from a DO block. The second would be the more serious answer, because
--      then NO do-block guard can ever fail visibly there.
--
--    The durable fix is not a better DO block. A check must RETURN ROWS TO A
--    CALLER THAT ASSERTS ON THEM rather than raise into a console that may
--    swallow it. That is a security definer function called from the proof
--    script with the service key, and it is deliberately NOT in this migration:
--    writing it before knowing which candidate is true would be building on the
--    same guess that produced the silent pass.
-- ---------------------------------------------------------------------------
