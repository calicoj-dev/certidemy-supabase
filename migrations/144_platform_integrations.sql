-- 144_platform_integrations.sql
--
-- Generic encrypted-credential store for external integrations (GoHighLevel is
-- the first tenant; Stripe / Credly / ... reuse the same table + functions).
--
-- Editor-first: paste + run in the Supabase SQL editor (project pctynukndxnmnxiqpgck),
-- run the VERIFY round-trip at the bottom, THEN commit this file as the record.
--
-- ASCII-clean. Idempotent where safe.
--
-- ===========================================================================
-- THE MODEL: pointer, not payload
-- ===========================================================================
-- The token itself is NEVER stored in this table. It goes into Supabase Vault
-- (pgsodium-backed, encrypted at rest and in every backup, decryptable only via
-- the project's managed key). This table holds only:
--   - vault_secret_id : a POINTER to the encrypted secret in vault.secrets
--   - key_last4       : the last 4 chars, for a "connected, ending in xxxx" UI
--   - config          : NON-secret config (e.g. GHL location_id -- a public id
--                       from the GHL URL, deliberately NOT encrypted)
--
-- WRITE-ONLY CREDENTIAL: nothing ever reads the token back toward a browser.
-- The only reader is integration_read_token(), service-role only, called by the
-- sync/test edge functions at request time. To change a token you paste a new
-- one; you never retrieve the old one. This mirrors how Stripe/GitHub/etc.
-- surface API keys.
--
-- SERVICE-ROLE ONLY: RLS on, no authenticated policy. The console reads STATUS
-- (never the token) through an admin-gated edge function, exactly like
-- list-credentials / list-users. A learner or partner can never reach this table.

begin;

-- ---------------------------------------------------------------------------
-- 1. The table
-- ---------------------------------------------------------------------------
create table if not exists public.platform_integrations (
  slug            text primary key,                     -- 'gohighlevel', 'stripe', ...
  status          text not null default 'disconnected'
                    check (status in ('disconnected','connected','error')),
  vault_secret_id uuid,                                 -- -> vault.secrets(id); null when disconnected
  key_last4       text,                                 -- last 4 chars of the token, display only
  config          jsonb not null default '{}'::jsonb,   -- non-secret (e.g. {"location_id": "..."})
  last_error      text,                                 -- last connection error, for the card
  connected_at    timestamptz,
  connected_by    uuid,                                 -- who connected it (audit)
  updated_at      timestamptz not null default now()
);

comment on table public.platform_integrations is
  'One row per external integration. The credential lives Vault-encrypted; this table holds only a pointer (vault_secret_id), the last 4 chars for display, and non-secret config. Service-role only -- read/written exclusively through admin-gated edge functions.';

alter table public.platform_integrations enable row level security;
-- No authenticated policy ON PURPOSE. service_role bypasses RLS; everyone else
-- gets nothing. The token pointer must never be client-reachable.

-- ---------------------------------------------------------------------------
-- 2. Vault wrappers -- the ONLY interface the edge functions use
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER so they reach the vault schema; EXECUTE granted to
-- service_role only. Wrapping Vault (rather than calling it from the edge
-- functions directly) means if Vault's internals ever shift, only these three
-- functions change -- the app layer is insulated.

-- 2a. Store on first connect, ROTATE in place on reconnect. Upserts the row.
create or replace function public.integration_store_token(
  p_slug   text,
  p_token  text,
  p_config jsonb,
  p_actor  uuid
)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_existing  uuid;
  v_secret_id uuid;
  v_last4     text := right(p_token, 4);
  v_name      text := 'integration:' || p_slug || ':token';
begin
  select vault_secret_id into v_existing
    from public.platform_integrations
   where slug = p_slug;

  if v_existing is not null then
    -- rotation: overwrite the existing encrypted secret in place
    perform vault.update_secret(v_existing, p_token);
    v_secret_id := v_existing;
  else
    -- first connect: create a new encrypted secret, keep its id
    v_secret_id := vault.create_secret(
      p_token,
      v_name,
      'Certidemy integration token: ' || p_slug
    );
  end if;

  insert into public.platform_integrations
    (slug, status, vault_secret_id, key_last4, config, connected_at, connected_by, updated_at, last_error)
  values
    (p_slug, 'connected', v_secret_id, v_last4, coalesce(p_config, '{}'::jsonb), now(), p_actor, now(), null)
  on conflict (slug) do update
    set status          = 'connected',
        vault_secret_id = excluded.vault_secret_id,
        key_last4       = excluded.key_last4,
        config          = excluded.config,
        connected_at    = now(),
        connected_by    = excluded.connected_by,
        updated_at      = now(),
        last_error      = null;
end;
$$;

revoke all on function public.integration_store_token(text,text,jsonb,uuid) from public, anon, authenticated;
grant execute on function public.integration_store_token(text,text,jsonb,uuid) to service_role;

-- 2b. Read the decrypted token. Service-role only; called by sync/test funcs at
--     request time. Returns null if the integration is not connected.
create or replace function public.integration_read_token(p_slug text)
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_id    uuid;
  v_token text;
begin
  select vault_secret_id into v_id
    from public.platform_integrations
   where slug = p_slug and status = 'connected';
  if v_id is null then
    return null;
  end if;
  select decrypted_secret into v_token
    from vault.decrypted_secrets
   where id = v_id;
  return v_token;
end;
$$;

revoke all on function public.integration_read_token(text) from public, anon, authenticated;
grant execute on function public.integration_read_token(text) to service_role;

-- 2c. Disconnect: destroy the Vault secret and reset the row.
create or replace function public.integration_clear(p_slug text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_id uuid;
begin
  select vault_secret_id into v_id
    from public.platform_integrations
   where slug = p_slug;
  if v_id is not null then
    delete from vault.secrets where id = v_id;
  end if;
  update public.platform_integrations
     set status          = 'disconnected',
         vault_secret_id = null,
         key_last4       = null,
         last_error      = null,
         updated_at      = now()
   where slug = p_slug;
end;
$$;

revoke all on function public.integration_clear(text) from public, anon, authenticated;
grant execute on function public.integration_clear(text) to service_role;

commit;

-- ===========================================================================
-- VERIFY -- run these in the SQL editor now, BEFORE any app code is built.
-- If read_token returns the exact token you stored, Vault round-trips correctly
-- in this project and Stage B is safe to build.
-- ===========================================================================
--
-- (a) Vault is present (Supabase enables it by default):
--   select extname from pg_extension where extname in ('supabase_vault','vault','pgsodium');
--
-- (b) FULL ROUND-TRIP with a throwaway token:
--   select public.integration_store_token('__test__', 'tok_ABCD1234wxyz', '{"note":"test"}'::jsonb, null);
--
--   -- row shows connected, last4 = wxyz, config kept; token NOT visible here:
--   select slug, status, key_last4, config, vault_secret_id
--     from public.platform_integrations where slug = '__test__';
--
--   -- the decrypted read returns the ORIGINAL token:
--   select public.integration_read_token('__test__');        -- expect: tok_ABCD1234wxyz
--
--   -- and the raw vault row is CIPHERTEXT, not the token:
--   select id, name, left(secret, 24) as ciphertext_head
--     from vault.secrets
--    where id = (select vault_secret_id from public.platform_integrations where slug='__test__');
--
--   -- rotation overwrites in place (same vault_secret_id, new last4):
--   select public.integration_store_token('__test__', 'tok_NEW99999abcd', '{"note":"rotated"}'::jsonb, null);
--   select slug, status, key_last4 from public.platform_integrations where slug='__test__';  -- last4 = abcd
--   select public.integration_read_token('__test__');        -- expect: tok_NEW99999abcd
--
--   -- clear wipes the secret and resets the row:
--   select public.integration_clear('__test__');
--   select slug, status, vault_secret_id, key_last4 from public.platform_integrations where slug='__test__';
--                                                            -- disconnected, null, null
--   select public.integration_read_token('__test__');        -- expect: null
--
--   -- remove the test row entirely:
--   delete from public.platform_integrations where slug = '__test__';
-- ===========================================================================
