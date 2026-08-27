-- 258_lti_sweep.sql
--
-- The sweep for lti_nonces, lti_launch_evidence and lti_launch_sessions.
--
-- Editor-first: this ran live in the SQL editor on 2026-08-26, one statement at
-- a time. The file is the record of what already ran, not a script anyone
-- executes. The body was read back from live prosrc and verified by md5 with
-- CRs stripped: 3e4303711620ae7c894ca8ba3f4fcc11 (571 bytes).
--
-- ============================ DELIBERATELY LATE ==========================
--
-- Kept out of 253, 255, 256 and 257 on purpose. cron.schedule is NOT
-- transactional -- the rule 235 and 243 both record -- so it never belongs
-- inside a migration block. And scheduling a sweep before the endpoints that
-- populate these tables existed would have meant its first act was to do
-- nothing, forever, unnoticed: a cleanup job that never cleans looks exactly
-- like a cleanup job that works.
--
-- /lti/login, /lti/launch and the deep-linking flow are all live now, so the
-- tables will accumulate and this is due.
--
-- ============================ THREE TABLES, THREE GRACE PERIODS ==========
--
-- The differences are the point, not an inconsistency.
--
-- lti_launch_evidence DELETES EXACTLY AT expires_at. That column carries the
-- 30-day PII retention -- raw JWT, decoded claims, name, email, sub, roles. A
-- grace period here would quietly turn a 30-day promise into a 31-day one, and
-- a retention commitment that drifts by a day because of a convenience is a
-- commitment nobody can state accurately to an institution's DPO.
--
-- lti_nonces AND lti_launch_sessions GET A DAY PAST EXPIRY. Both are ALREADY
-- UNUSABLE the moment they expire -- lti-launch checks lti_nonces.expires_at
-- and lti-deep-link checks the session's, and both refuse -- so keeping the row
-- briefly grants nothing to anyone.
--
-- What it buys is the ability to answer "why did this instructor's launch fail
-- at 09:14" WITH THE ROW STILL PRESENT. Deleting on the stroke of expiry would
-- erase the evidence of a failure at exactly the moment somebody starts asking
-- about it, and neither row holds PII: a nonce is two random strings and a
-- session is launch context with no user in it (257).
--
-- ============================ WHY IT RETURNS COUNTS ======================
--
-- jsonb rather than void, so a manual run says what it did. A sweep that
-- reports {"nonces":0,"evidence":0,"sessions":0} on a database with rows in it
-- is a broken sweep, and a void return would look identical to a working one.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).
-- Idempotent: create or replace; the grants are re-runnable.

-- ---------------------------------------------------------------------------
-- 1. The sweep.
--    Live body md5, CRs stripped: 3e4303711620ae7c894ca8ba3f4fcc11
-- ---------------------------------------------------------------------------

create or replace function public.lti_sweep_expired()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_nonces   integer;
  v_evidence integer;
  v_sessions integer;
begin
  delete from public.lti_nonces where expires_at < now() - interval '1 day';
  get diagnostics v_nonces = row_count;

  delete from public.lti_launch_evidence where expires_at < now();
  get diagnostics v_evidence = row_count;

  delete from public.lti_launch_sessions where expires_at < now() - interval '1 day';
  get diagnostics v_sessions = row_count;

  return jsonb_build_object(
    'nonces', v_nonces, 'evidence', v_evidence, 'sessions', v_sessions,
    'swept_at', now()
  );
end;
$function$;

-- ---------------------------------------------------------------------------
-- 2. service_role only. It deletes rows from three tables that a browser
--    cannot read in the first place.
-- ---------------------------------------------------------------------------

revoke all on function public.lti_sweep_expired() from public, anon, authenticated;
grant execute on function public.lti_sweep_expired() to service_role;

-- ---------------------------------------------------------------------------
-- 3. Verification. Observed live 2026-08-26.
-- ---------------------------------------------------------------------------

-- select p.proname, p.prosecdef, p.proacl::text
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.proname = 'lti_sweep_expired';
--
-- OBSERVED:
--   lti_sweep_expired  true  {postgres=X/postgres,service_role=X/postgres}

-- select public.lti_sweep_expired();
--
-- OBSERVED:
--   {"nonces":0,"evidence":0,"sessions":0,"swept_at":"2026-08-26T23:48:47.14064+00:00"}
--
-- RUN MANUALLY BEFORE SCHEDULING, and that ordering is the point: a sweep that
-- errors on its first cron firing fails silently forever, because nobody
-- notices a cleanup job that never cleaned. One manual call proves it executes
-- at all.

-- ---------------------------------------------------------------------------
-- 4. THE SCHEDULE. RUN SEPARATELY, after section 1 committed.
--
--    cron.schedule is NOT transactional, so it is commented here rather than
--    executed as part of any block -- the same treatment 235 and 243 give it.
--
--    03:17 UTC, deliberately off the hour: every other cron on the planet fires
--    at :00.
-- ---------------------------------------------------------------------------

--   select cron.schedule(
--     'lti-sweep-expired',
--     '17 3 * * *',
--     $$ select public.lti_sweep_expired(); $$
--   );
--
--   OBSERVED: returned jobid 3.

--   select jobid, jobname, schedule, active
--   from cron.job where jobname = 'lti-sweep-expired';
--
--   OBSERVED: 3 | lti-sweep-expired | 17 3 * * * | true
