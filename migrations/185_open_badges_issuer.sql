-- 185_open_badges_issuer.sql
--
-- Open Badges 3.0 / W3C Verifiable Credentials — issuer identity and the
-- credential columns a signed credential needs.
--
-- Nothing here changes what a credential ASSERTS. It adds who signs it, a
-- stable proof timestamp, a privacy-preserving subject identifier, and a
-- revocation index. The competence claim, the JTA version, the score and the
-- dates are untouched.
--
-- ============================ WHY AN ISSUERS TABLE =========================
--
-- One row today. It is a table rather than a constant because a whitelabel
-- tenant is an insert plus a keypair, whereas a hardcoded issuer would mean
-- touching every route, the key storage, the status lists and the achievement
-- namespace later. Same work now, none later.
--
-- ============================ TWO issuer_id COLUMNS ========================
--
-- certifications.issuer_id  — who issues this certification TODAY.
-- credentials.issuer_id     — who issued THIS credential, snapshotted at mint.
--
-- Deliberately denormalised, same principle as credentials.jta_version_id and
-- jta_versions.blueprint_snapshot (v5.8 §3): reassigning a certification to a
-- different issuer must never retroactively rewrite credentials already in the
-- world. A signed credential asserting a different issuer than the one who
-- signed it is not a cosmetic drift, it is a broken signature.
--
-- ============================ material_updated_at ==========================
--
-- A DataIntegrityProof carries a `created` timestamp inside the signed bytes.
-- If that reads now(), the document differs on every fetch, nothing caches, and
-- two verifiers comparing the same credential see different bytes.
--
-- So it reads material_updated_at, which changes ONLY when the signed material
-- changes. Today exactly one field can do that: holder_name (a spelling fix).
-- The trigger below bumps it. Status changes must NOT bump it — that is what
-- the status list is for, and re-signing on revocation would invalidate every
-- copy already distributed instead of marking it revoked.
--
-- The bump lives in a trigger and not in update-credential-name because this
-- project's recurring defect is rules that live in prose and depend on someone
-- remembering them at the right moment.
--
-- ============================ subject_salt =================================
--
-- credentialSubject.identifier carries a SALTED HASH of the holder's email, per
-- the OB 3.0 IdentifierEntry pattern. A verifier who already knows the email
-- can confirm the match; anyone else learns nothing. Without an identifier the
-- credential cannot be matched to an employee record by any receiving system.
--
-- The salt is per-credential and immutable. Rotating it would silently break
-- every previously-issued match.
--
-- ============================ status_list_index ============================
--
-- One bit per credential in a Bitstring Status List. Unique per issuer, never
-- reused, assigned to every credential including specimens (specimens are never
-- served, but a nullable index is a branch waiting to be forgotten).

begin;

-- ---------------------------------------------------------------- issuers --

create table if not exists public.issuers (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  name                text not null,
  -- Public site. Not the issuer identifier.
  site_url            text not null,
  -- The OB 3.0 issuer identifier. A URI that MUST resolve to the issuer
  -- Profile document. https is a valid URI; did:web resolves to the same
  -- domain and buys nothing here.
  issuer_url          text not null unique,
  -- verificationMethod fragment, e.g. '#key-1'. Rotating a key means a new
  -- fragment, not overwriting the old one — credentials signed with the old
  -- key must keep verifying.
  key_id              text not null default 'key-1',
  -- Ed25519 public key, both encodings. multibase for the OB/VC
  -- verificationMethod; JWK so the browser can importKey directly in the
  -- credential-data modal without a conversion shim.
  public_key_multibase text,
  public_key_jwk      jsonb,
  key_created_at      timestamptz,
  -- Private key lives in Vault. This is the pointer, never the key.
  vault_secret_id     uuid,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.issuers is
  'Credential issuing bodies. One row (Certidemy) today; a whitelabel tenant is an insert plus a keypair. Private keys are in Vault — vault_secret_id is a pointer, never the key.';
comment on column public.issuers.issuer_url is
  'OB 3.0 issuer identifier. MUST resolve to the Profile document.';
comment on column public.issuers.key_id is
  'verificationMethod fragment. Key rotation mints a NEW fragment; the old public key stays published so previously-signed credentials keep verifying.';

alter table public.issuers enable row level security;

-- RLS is not a grant, and in this schema the reverse also bites: Supabase
-- default privileges hand new public tables to anon/authenticated. The issuer
-- row is served by an edge function under service_role; no client role reads
-- this table directly.
revoke all on public.issuers from anon, authenticated;
grant all on public.issuers to service_role;

insert into public.issuers (slug, name, site_url, issuer_url)
values ('certidemy', 'Certidemy', 'https://certidemy.com', 'https://certidemy.com/issuer')
on conflict (slug) do nothing;

-- ------------------------------------------------- private key into Vault --

-- Mirrors integration_store_token (migration 144): rotate overwrites the
-- existing secret in place, first write creates one. The key is write-only —
-- this function never returns it and nothing else may read it.
create or replace function public.issuer_store_key(
  p_slug              text,
  p_private_key       text,
  p_public_multibase  text,
  p_public_jwk        jsonb,
  p_key_id            text default 'key-1'
)
returns void
language plpgsql
security definer
set search_path to 'public', 'vault'
as $function$
declare
  v_existing  uuid;
  v_secret_id uuid;
  v_name      text := 'issuer:' || p_slug || ':' || p_key_id;
begin
  select vault_secret_id into v_existing
    from public.issuers
   where slug = p_slug;

  if v_existing is not null then
    perform vault.update_secret(v_existing, p_private_key);
    v_secret_id := v_existing;
  else
    v_secret_id := vault.create_secret(
      p_private_key,
      v_name,
      'Certidemy issuer signing key: ' || p_slug
    );
  end if;

  update public.issuers
     set vault_secret_id      = v_secret_id,
         public_key_multibase = p_public_multibase,
         public_key_jwk       = p_public_jwk,
         key_id               = p_key_id,
         key_created_at       = now(),
         updated_at           = now()
   where slug = p_slug;

  if not found then
    raise exception 'issuer_store_key: no issuer with slug %', p_slug;
  end if;
end;
$function$;

revoke all on function public.issuer_store_key(text, text, text, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.issuer_store_key(text, text, text, jsonb, text)
  to service_role;

-- ------------------------------------------- certifications.issuer_id -----

alter table public.certifications
  add column if not exists issuer_id uuid references public.issuers(id);

update public.certifications
   set issuer_id = (select id from public.issuers where slug = 'certidemy')
 where issuer_id is null;

alter table public.certifications
  alter column issuer_id set not null;

-- ------------------------------------------------- credentials columns ----

create sequence if not exists public.credential_status_index_seq as bigint start 1;

alter table public.credentials
  add column if not exists issuer_id           uuid references public.issuers(id),
  add column if not exists material_updated_at timestamptz,
  add column if not exists subject_salt        text,
  add column if not exists status_list_index   bigint;

-- Backfill. material_updated_at starts at issued_at: no existing credential
-- has had its material changed, so the proof timestamp is the issue date.
update public.credentials
   set issuer_id = coalesce(
         issuer_id,
         (select id from public.issuers where slug = 'certidemy')
       ),
       material_updated_at = coalesce(material_updated_at, issued_at),
       -- 256 bits from two gen_random_uuid() calls. Deliberately avoids
       -- gen_random_bytes so this does not depend on where pgcrypto lives.
       subject_salt = coalesce(
         subject_salt,
         replace(gen_random_uuid()::text, '-', '') ||
         replace(gen_random_uuid()::text, '-', '')
       )
 where issuer_id is null
    or material_updated_at is null
    or subject_salt is null;

-- Indices assigned in issue order so the oldest credential holds the lowest
-- bit. Cosmetic, but it makes a status list readable by eye during debugging.
update public.credentials c
   set status_list_index = nextval('public.credential_status_index_seq')
  from (
    select id from public.credentials
     where status_list_index is null
     order by issued_at, created_at, id
  ) ordered
 where c.id = ordered.id;

alter table public.credentials
  alter column issuer_id           set not null,
  alter column material_updated_at set not null,
  alter column material_updated_at set default now(),
  alter column subject_salt        set not null,
  alter column status_list_index   set not null,
  alter column status_list_index   set default nextval('public.credential_status_index_seq');

alter table public.credentials
  add constraint credentials_status_list_index_uniq unique (issuer_id, status_list_index);

comment on column public.credentials.issuer_id is
  'Snapshotted at mint. Reassigning the certification to another issuer must never rewrite credentials already issued.';
comment on column public.credentials.material_updated_at is
  'Timestamp inside the signed proof. Bumps ONLY when signed material changes (holder_name). Status changes must not bump it — that is what the status list is for.';
comment on column public.credentials.subject_salt is
  'Per-credential salt for the hashed-email subject identifier. Immutable: rotating it silently breaks every previously-issued match.';

-- ------------------------------------------------------------- triggers ---

-- Bumps the proof timestamp when, and only when, signed material changes.
create or replace function public.credentials_bump_material()
returns trigger
language plpgsql
as $function$
begin
  if new.holder_name is distinct from old.holder_name then
    new.material_updated_at := now();
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_credentials_bump_material on public.credentials;
create trigger trg_credentials_bump_material
  before update on public.credentials
  for each row execute function public.credentials_bump_material();

-- The three fields that must never move once minted.
create or replace function public.credentials_guard_badge_identity()
returns trigger
language plpgsql
as $function$
begin
  if new.subject_salt is distinct from old.subject_salt then
    raise exception 'credentials.subject_salt is immutable (credential %)', old.id;
  end if;
  if new.status_list_index is distinct from old.status_list_index then
    raise exception 'credentials.status_list_index is immutable (credential %)', old.id;
  end if;
  if new.issuer_id is distinct from old.issuer_id then
    raise exception 'credentials.issuer_id is immutable once issued (credential %)', old.id;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_credentials_guard_badge_identity on public.credentials;
create trigger trg_credentials_guard_badge_identity
  before update on public.credentials
  for each row execute function public.credentials_guard_badge_identity();

commit;
