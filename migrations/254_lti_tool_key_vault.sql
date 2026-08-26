-- 254_lti_tool_key_vault.sql
--
-- Vault storage for the platform-level RSA key Certidemy signs LTI 1.3 messages
-- with. The half of 253 that was planned and not run.
--
-- Editor-first: this ran live in the SQL editor on 2026-08-26, one statement at
-- a time. The file is the record of what already ran, not a script anyone
-- executes. Both bodies below were read back from live prosrc and verified by
-- md5 with CRs stripped:
--
--   lti_store_tool_key   821847e07c6d3b8ce24151c2d12bb8f5   (578 bytes)
--   lti_get_tool_key     ee95f6af95590b2481641e9e03247483   (351 bytes)
--
-- They are the live bodies, modulo line endings.
--
-- ============================ WHY THIS IS A SEPARATE MIGRATION ===========
--
-- NOT A DESIGN DECISION. These two functions were in the plan for 253 and were
-- omitted from the statements that were actually handed over and run. The split
-- is a mistake preserved rather than tidied away, because renumbering a
-- migration that has already executed would make the record disagree with the
-- database -- and a migration file that does not match what ran is worse than
-- no file, since the next person edits from it.
--
-- The consequence was contained but real: functions/lti-mint-tool-key was
-- written, type-clean, and UNRUNNABLE. It calls lti_store_tool_key, so until
-- this landed there was nowhere to put the private half of a minted key. It was
-- committed in that state deliberately, with the omission recorded in 253's own
-- header, rather than held back to make the history look tidier.
--
-- ============================ WHY A DUPLICATE kid IS REFUSED =============
--
-- issuer_store_key (185) UPDATES IN PLACE: it looks for an existing
-- vault_secret_id for that slug and overwrites the secret. That is right there,
-- because an issuer has exactly one key and rotating it means replacing what
-- that issuer signs with.
--
-- This function refuses instead, and the difference is not stylistic.
--
-- A kid here is the RFC 7638 thumbprint of the public JWK -- DERIVED from the
-- key material, not assigned. So the same kid with different material is a
-- contradiction in terms: either the thumbprint was not computed, or the key it
-- names is not the key being stored. Overwriting would make that contradiction
-- silent and permanent.
--
-- It is also wrong for rotation. A platform caches our JWKS BY kid. A rotation
-- must produce a NEW row with a NEW kid, so the old key stays serveable while
-- platforms re-fetch; replacing the material behind a kid an LMS already holds
-- breaks verification for every launch until every platform happens to
-- re-fetch. That is why lti_tool_keys deliberately allows several non-retired
-- rows, and why lti-jwks serves 'active' and 'retiring' both.
--
-- So: raise, and let the caller mint a fresh key.
--
-- ============================ WHY THE REVOKE IS DOING REAL WORK ==========
--
-- Postgres grants EXECUTE on a new function to PUBLIC by default. Some of this
-- schema's SECURITY DEFINER helpers keep that deliberately -- is_platform_admin
-- and is_company_admin carry a bare `=X/postgres` entry because RLS policy
-- expressions call them and would fail for authenticated callers otherwise.
--
-- These two must NOT. One returns decrypted private key material. The revoke is
-- not boilerplate copied from a neighbour; it is the difference between a
-- signing key that only service_role can reach and one any authenticated
-- session could ask for by kid.
--
-- Observed after the grants (section 3): both ACLs are
-- {postgres=X/postgres,service_role=X/postgres} with NO bare =X entry.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).
-- Idempotent: create or replace, and the grants are re-runnable.

-- ---------------------------------------------------------------------------
-- 1. Store. Vault first, then the row.
--
--    lti_tool_keys_active_requires_material (253) refuses a non-retired row
--    without both halves, so this order is not a preference: the reverse is
--    rejected by the database.
--
--    Live body md5, CRs stripped: 821847e07c6d3b8ce24151c2d12bb8f5
-- ---------------------------------------------------------------------------

create or replace function public.lti_store_tool_key(
  p_kid         text,
  p_private_key text,
  p_public_jwk  jsonb,
  p_activate    boolean default false
)
returns void
language plpgsql
security definer
set search_path to 'public', 'vault'
as $function$
declare
  v_secret_id uuid;
  v_name      text := 'lti:tool:' || p_kid;
begin
  if exists (select 1 from public.lti_tool_keys where kid = p_kid) then
    raise exception 'lti_store_tool_key: kid % already exists', p_kid;
  end if;

  v_secret_id := vault.create_secret(
    p_private_key, v_name, 'Certidemy LTI 1.3 tool signing key: ' || p_kid
  );

  insert into public.lti_tool_keys
    (kid, alg, public_jwk, vault_secret_id, status, activated_at)
  values
    (p_kid, 'RS256', p_public_jwk, v_secret_id, 'active',
     case when p_activate then now() else null end);
end;
$function$;

-- ---------------------------------------------------------------------------
-- 2. Read. Retired keys never sign.
--
--    The `status <> 'retired'` filter is the same shape as
--    issuer_get_signing_key filtering on is_active: a key that has been taken
--    out of circulation must not be able to sign even if something later asks
--    for it by kid. Returns NULL rather than raising, so the caller decides
--    whether an unknown kid is an error or an expected miss.
--
--    Live body md5, CRs stripped: ee95f6af95590b2481641e9e03247483
-- ---------------------------------------------------------------------------

create or replace function public.lti_get_tool_key(p_kid text)
returns text
language plpgsql
security definer
set search_path to 'public', 'vault'
as $function$
declare
  v_secret_id uuid;
  v_key       text;
begin
  select vault_secret_id into v_secret_id
    from public.lti_tool_keys
   where kid = p_kid and status <> 'retired';

  if v_secret_id is null then
    return null;
  end if;

  select decrypted_secret into v_key
    from vault.decrypted_secrets
   where id = v_secret_id;

  return v_key;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 3. Lock them down. See the header on why this is not boilerplate.
-- ---------------------------------------------------------------------------

revoke all on function public.lti_store_tool_key(text, text, jsonb, boolean) from public, anon, authenticated;
revoke all on function public.lti_get_tool_key(text) from public, anon, authenticated;
grant execute on function public.lti_store_tool_key(text, text, jsonb, boolean) to service_role;
grant execute on function public.lti_get_tool_key(text) to service_role;

-- ---------------------------------------------------------------------------
-- 4. Verification. Observed live 2026-08-26 after the statements above.
--    These strings ARE the record.
-- ---------------------------------------------------------------------------

-- select p.proname, p.prosecdef, p.proacl::text
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.proname like 'lti\_%'
-- order by p.proname;
--
-- OBSERVED, verbatim:
--   lti_get_tool_key    true  {postgres=X/postgres,service_role=X/postgres}
--   lti_store_tool_key  true  {postgres=X/postgres,service_role=X/postgres}
--
-- No bare =X entry on either, so PUBLIC cannot execute. That is the check that
-- matters here: a leading =X/postgres would mean any authenticated session
-- could call lti_get_tool_key and receive a decrypted private key.
