-- 255_lti_record_capability.sql
--
-- The one way a Tier B or Tier C capability observation is written.
--
-- Editor-first: this ran live in the SQL editor on 2026-08-26, one statement at
-- a time. The file is the record of what already ran, not a script anyone
-- executes. The body below was read back from live prosrc and verified by md5
-- with CRs stripped: 6524b5903be5249cebc020587b9abad8 (540 bytes). It is the
-- live body, modulo line endings.
--
-- ============================ WHY THIS EXISTS AT ALL =====================
--
-- The obvious implementation is a PostgREST upsert from the launch handler:
--
--   svc.from("lti_capabilities").upsert(row, { onConflict: "..." })
--
-- THAT CANNOT WORK HERE. lti_capabilities_scope_key_unique (253) is an
-- EXPRESSION index:
--
--   (platform_id, coalesce(deployment_id, '000...000'::uuid), key)
--
-- and PostgREST's on_conflict= parameter takes COLUMN NAMES ONLY. There is no
-- syntax for naming an expression index, so the upsert has nothing to infer
-- against.
--
-- The coalesce is not incidental and cannot be dropped to make the upsert work:
-- a plain three-column unique index would NOT prevent duplicate platform-scoped
-- rows, because NULL is never equal to NULL in a unique index. The expression
-- is what makes platform-scoped and deployment-scoped capabilities share one
-- uniqueness rule.
--
-- ============================ WHY NOT SELECT-THEN-INSERT =================
--
-- The fallback would be: read the row, insert if absent, update if present.
-- That RACES.
--
-- Two launches arriving at the same institution within the same moment both
-- read "no row", both insert, and one gets a unique violation. It is a narrow
-- window and it is exactly the window that opens at a REAL institution under
-- REAL load -- thirty students clicking into a course at the start of a class.
-- It would never reproduce in testing, and the symptom would be a launch
-- failing for one student and not the next.
--
-- Postgres DOES support ON CONFLICT index inference against an expression
-- index, provided the expression matches exactly. So the operation is one
-- atomic statement here, and there is no window.
--
-- ============================ WHY THE PARAMETER IS BOOLEAN ===============
--
-- lti_capabilities.value is text, CHECKed to ('true','false'), because
-- 'unknown' must never be writable as a value -- unknown is the ABSENCE of a
-- row, which is how tri-state avoids a default that asserts everything untested
-- is unsupported.
--
-- But that discipline is only as good as every caller remembering it. So the
-- API takes a BOOLEAN and does the conversion here. A caller cannot pass
-- 'unknown', cannot pass 'yes', and cannot pass a typo: UNKNOWN IS EXPRESSED BY
-- NOT CALLING THIS FUNCTION. The tri-state survives into the interface instead
-- of living in a convention somebody has to have read.
--
-- ============================ MERGE SEMANTICS ============================
--
-- On conflict the value is REPLACED, not accumulated -- the most recent
-- observation is the truth, because a platform that starts releasing email
-- after an admin changes a privacy setting should stop being recorded as
-- withholding it.
--
-- observation_count increments, and it is the number that makes a capability
-- row worth reading: "false, observed 40 times" is a fact about an institution,
-- while "false, observed once" might have been a fluke.
--
-- last_detail is COALESCED rather than overwritten, so a caller that has
-- nothing to add does not erase the detail from the observation that did.
--
-- ============================ ACCESS =====================================
--
-- service_role only. Postgres grants EXECUTE to PUBLIC by default and some
-- helpers here keep that deliberately (is_platform_admin and is_company_admin
-- must, because RLS policies call them). This one must not: lti_capabilities
-- has no grant to anon or authenticated at all, and a function that writes it
-- should not be the way around that.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).
-- Idempotent: create or replace, and the grants are re-runnable.

-- ---------------------------------------------------------------------------
-- 1. The recorder.
--    Live body md5, CRs stripped: 6524b5903be5249cebc020587b9abad8
-- ---------------------------------------------------------------------------

create or replace function public.lti_record_capability(
  p_platform_id   uuid,
  p_deployment_id uuid,
  p_key           text,
  p_value         boolean,
  p_detail        jsonb default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.lti_capabilities as c
    (platform_id, deployment_id, key, value, last_detail)
  values
    (p_platform_id, p_deployment_id, p_key,
     case when p_value then 'true' else 'false' end, p_detail)
  on conflict (platform_id, coalesce(deployment_id, '00000000-0000-0000-0000-000000000000'::uuid), key)
  do update set
    value             = excluded.value,
    last_detail       = coalesce(excluded.last_detail, c.last_detail),
    observed_at       = now(),
    observation_count = c.observation_count + 1;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 2. Lock it down.
-- ---------------------------------------------------------------------------

revoke all on function public.lti_record_capability(uuid, uuid, text, boolean, jsonb) from public, anon, authenticated;
grant execute on function public.lti_record_capability(uuid, uuid, text, boolean, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- 3. Verification. Observed live 2026-08-26 after the statements above.
-- ---------------------------------------------------------------------------

-- select p.proname, p.prosecdef, p.proacl::text
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.proname = 'lti_record_capability';
--
-- OBSERVED:
--   lti_record_capability  true  {postgres=X/postgres,service_role=X/postgres}
--
-- No bare =X entry, so PUBLIC cannot execute.

-- ---------------------------------------------------------------------------
-- 4. First caller.
--
--    functions/lti-login records omits_client_id_on_login when a platform sends
--    a login request with no client_id. It was deployed BEFORE this function
--    existed, deliberately: the call is wrapped so a failure logs a warning and
--    the launch proceeds. Failing to record an observation must never cost a
--    launch, which is also why nothing downstream may depend on a capability
--    row existing.
-- ---------------------------------------------------------------------------
