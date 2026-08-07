-- 186_issuer_signing_key_reader.sql
--
-- The read half of migration 185's key storage. issuer_store_key() writes the
-- private key into Vault; this reads it back for signing.
--
-- ============================ WHY A DEDICATED READER =======================
--
-- The obvious alternative is to select from vault.decrypted_secrets in the edge
-- function. That works and is worse: it hands the function a view over EVERY
-- secret in Vault, including every integration token, for a job that needs
-- exactly one. This function takes a slug and returns one key.
--
-- SECURITY DEFINER, service_role only. No client role can execute it, and there
-- is no code path that returns the key to a browser — the signing happens
-- server-side in the edge function and only the signature leaves.
--
-- Returns NULL rather than raising when no key is stored, so the caller can
-- distinguish "this issuer has no key yet" from "the lookup failed". An issuer
-- without a key must refuse to sign, not emit an unsigned credential.

begin;

create or replace function public.issuer_get_signing_key(p_slug text)
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
    from public.issuers
   where slug = p_slug
     and is_active = true;

  if v_secret_id is null then
    return null;
  end if;

  select decrypted_secret into v_key
    from vault.decrypted_secrets
   where id = v_secret_id;

  return v_key;
end;
$function$;

revoke all on function public.issuer_get_signing_key(text)
  from public, anon, authenticated;
grant execute on function public.issuer_get_signing_key(text) to service_role;

comment on function public.issuer_get_signing_key(text) is
  'Reads one issuer signing key from Vault. service_role only. Returns NULL when no key is stored — the caller must refuse to sign rather than emit an unsigned credential.';

commit;
