-- 253_lti_registration.sql
--
-- LTI 1.3, phase 1: the tables a Tool needs to be registered with a Platform.
--
-- Editor-first: this ran live in the SQL editor on 2026-08-26, one statement at
-- a time. The file is the record of what already ran, not a script anyone
-- executes.
--
-- ============================ HOW THIS ONE IS VERIFIED ===================
--
-- No function body, so no md5. The verifiable artefacts are the constraint and
-- index definitions, recorded verbatim in section 10 as pg_get_constraintdef
-- and pg_indexes returned them. Same discipline as 247, 248, 251 and 252.
--
-- ============================ SCOPE ======================================
--
-- PHASE 1 ONLY: registration, JWKS, OIDC login, Deep Linking. An instructor
-- adds Certidemy as an external tool, launches it, gets a picker, chooses a
-- certification, and we return a signed deep-linking response that plants a
-- link to the PUBLIC /{locale}/certifications/<code> page.
--
-- No student launch, no AGS, no NRPS, no session minting. Those are phase 2 and
-- they are where the identity and entitlement work lives -- creating users we
-- did not create, logging them in without a password, and deciding what a
-- launched student is entitled to. Phase 1 is complete without any of it
-- because the planted link needs no session.
--
-- ============================ THE ARCHITECTURE THIS ENCODES ==============
--
-- From the variance research (see HANDOFF, and 1EdTech LTI 1.3 core spec):
--
-- NO BRANCHING ON VENDOR, EVER. There is no if (platform === 'canvas') and
-- there must never be one. product_family_code is recorded for diagnostics and
-- support tickets; if it ever appears in a conditional, that is a review
-- failure. Every difference is a capability recorded per registration and
-- discovered from what the platform actually sends or advertises. A new LMS is
-- a new ROW, never a new code path.
--
-- WHY (iss, client_id) AND NOT iss. All Instructure-hosted Canvas shares one
-- issuer, https://canvas.instructure.com, regardless of the institution's own
-- domain -- plus canvas.beta and canvas.test, so ONE INSTITUTION CAN PRESENT
-- THREE iss VALUES for the same tool. iss alone identifies nothing. The
-- 1EdTech implementation guide states a platform instance is identified by
-- issuer, client_id and deployment_id; (iss, client_id) is the registration and
-- deployment_id is the subdivision beneath it.
--
-- Canvas beta/test become three ordinary rows. No special case.
--
-- WHY deployments ARE AUTO-REGISTERED. Canvas issues many deployment_ids per
-- developer key -- one per placement. Brightspace requires them configured
-- explicitly and fails the launch without one. An unknown deployment_id on a
-- KNOWN platform is attested by that platform's own signature, so refusing it
-- would turn every new Canvas placement into a support ticket. The launch
-- handler inserts it.
--
-- TRI-STATE, AND WHY unknown IS THE ABSENCE OF A ROW. A boolean defaulting to
-- false asserts that everything untested is unsupported, which is false and
-- which silently disables features at institutions nobody has looked at yet.
-- lti_capabilities.value is CHECKed to ('true','false') so 'unknown' can never
-- be written as a value and then compared as a string; unknown is expressed by
-- there being no row.
--
-- CAPABILITIES ARE RUNTIME-WRITABLE, NOT ADMIN-CONFIGURED. Some differences can
-- only be learned by trying and failing: whether an AGS line item must be
-- created or already exists (Moodle and Blackboard auto-create a gradebook
-- column; Brightspace does NOT and expects the tool to create it), whether a
-- score POST is rejected for an unknown user, whether cookies survived an
-- iframe. The code that discovers the limitation writes the row and takes the
-- other path next time. If that were admin-configured, the first institution
-- with a new quirk becomes a support ticket and then a patch -- which is the
-- failure mode this whole design exists to avoid.
--
-- SERVICE AVAILABILITY IS PER-INSTALL, NOT PER-PRODUCT. Moodle omits the AGS
-- claim entirely unless ltiservice_gradebookservices is enabled in plugin
-- settings. "Moodle supports AGS" is false as a statement about a product and
-- only ever true about a deployment. That alone justifies the capability model.
--
-- SKEW IS A PER-REGISTRATION NUMBER. The LTI spec defers to OIDC and states no
-- normative tolerance; the industry norm is 30-60 seconds. So it is a column
-- with a default of 60, not a constant. Leeway belongs on exp; leeway on iat
-- accepts tokens issued in the future, which is a replay signal rather than
-- clock drift.
--
-- ============================ THE TWO-TABLE LOG SPLIT ====================
--
-- lti_launch_evidence holds the RAW JWT as well as the decoded claims. Decoded
-- claims are what we THINK arrived; the raw token can be re-verified against
-- the platform's JWKS months later, which is the difference between "our log
-- says the roles claim was Instructor" and "here is the signed evidence." For a
-- disputed exam attempt only the second is worth anything.
--
-- It is also PII: name, email, sub, roles, context title, possibly SIS ids.
-- Retention is 30 days, which is the real diagnosis window -- nobody debugs a
-- launch from March in November.
--
-- lti_launch_skeleton holds no PII at all: identifiers, message type, outcome,
-- error code, timing, and claim_presence -- a boolean map of WHICH claims
-- arrived, never their values. It is retained indefinitely, and it is what
-- feeds capability inference ("this registration has never released an email in
-- 40 launches"). Permanent statistics from a table with nothing personal in it,
-- and an expiring half that can be defended to an institution's DPO.
--
-- ONE EXCEPTION, NOT SOLVED HERE: if an LTI launch ever becomes an issuance
-- trigger, that launch's evidence is provenance rather than diagnostics and
-- must live as long as the credential -- which on this platform means forever.
-- The answer is to copy the needed claims onto the credential at mint time, not
-- to extend this table's retention. Phase 2.
--
-- ============================ WHAT IS DELIBERATELY ABSENT ================
--
-- THE pg_cron SWEEP. lti_nonces and lti_launch_evidence both accumulate rows
-- that must be deleted on a schedule. cron.schedule is NOT transactional, so it
-- never belongs inside a migration block -- the same rule 235 and 243 record.
-- It also must not be scheduled before the endpoints that populate those tables
-- exist, or the first thing it does is nothing, forever, unnoticed. It goes in
-- commented, in its own migration, once /lti/login and /lti/launch are live.
--
-- THE VAULT FUNCTIONS. lti_store_tool_key and lti_get_tool_key were in the plan
-- for this migration and were omitted from the statements that were actually
-- run. They are migration 254. Until they exist, lti_tool_keys can hold a row
-- but there is nowhere to put the private half, so no key can be minted.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).
-- Idempotent: every statement is if-not-exists or drop-if-exists first.

-- ---------------------------------------------------------------------------
-- 1. Our RSA keypairs. PLATFORM-LEVEL, not per-issuer.
--
--    The LTI signing key is the TOOL's identity: it answers "is this request
--    really from Certidemy". The Ed25519 key on issuers answers a different
--    question -- "who attests this credential" -- and that one is the partner's
--    and must stay theirs.
--
--    They cannot be the same key, and not only on principle: the platform
--    issues ONE client_id to ONE tool. A per-issuer LTI key would mean
--    registering N tools with each LMS, one per partner, each needing its own
--    developer key from that LMS admin. That does not degrade; it does not work.
--
--    issuers also models exactly one key -- a single vault_secret_id, key_id
--    and public_key_multibase, overwritten in place by issuer_store_key. This
--    table exists because that shape is deliberate and should not be bent.
--
--    MULTIPLE NON-RETIRED ROWS ARE THE POINT. Rotation means serving two kids
--    from the JWKS while platforms re-fetch. A tool that can only hold one key
--    cannot rotate without an outage.
--
--    kid is the RFC 7638 thumbprint of the public JWK -- DERIVED from the key,
--    never invented, so it cannot drift from the material it names.
-- ---------------------------------------------------------------------------

create table if not exists public.lti_tool_keys (
  id              uuid primary key default gen_random_uuid(),
  kid             text not null unique,
  alg             text not null default 'RS256',
  public_jwk      jsonb,
  vault_secret_id uuid,
  status          text not null default 'active',
  created_at      timestamptz not null default now(),
  activated_at    timestamptz,
  retired_at      timestamptz
);

alter table public.lti_tool_keys drop constraint if exists lti_tool_keys_status_vocab;
alter table public.lti_tool_keys add constraint lti_tool_keys_status_vocab
  check (status in ('active','retiring','retired'));

-- Mirrors issuers_active_requires_keys (230): a key that can be SERVED must
-- have both halves. A retired key may keep its public half for archaeology or
-- lose it; either way it is never offered.
alter table public.lti_tool_keys drop constraint if exists lti_tool_keys_active_requires_material;
alter table public.lti_tool_keys add constraint lti_tool_keys_active_requires_material
  check (status = 'retired' or (vault_secret_id is not null and public_jwk is not null));

-- ---------------------------------------------------------------------------
-- 2. The registration. One row per (iss, client_id). See the header.
--
--    company_id is NULLABLE and UNREAD IN PHASE 1. It is here now because
--    phase 2 has to answer "whose seats does this launch consume", and the only
--    path to that answer is launch -> deployment -> platform -> company. Adding
--    an FK to a table that already holds live registrations is worse than
--    carrying a nullable column nobody reads yet.
--
--    product_family_code is DIAGNOSTICS ONLY. It is the one vendor-shaped field
--    in the schema. Record it, show it in support, never branch on it.
-- ---------------------------------------------------------------------------

create table if not exists public.lti_platforms (
  id                     uuid primary key default gen_random_uuid(),
  iss                    text not null,
  client_id              text not null,
  name                   text not null,
  auth_login_url         text not null,
  auth_token_url         text not null,
  jwks_url               text not null,
  company_id             uuid references public.companies(id) on delete restrict,
  product_family_code    text,
  skew_tolerance_seconds integer not null default 60,
  status                 text not null default 'active',
  created_by             uuid references public.profiles(id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create unique index if not exists lti_platforms_iss_client_unique
  on public.lti_platforms (iss, client_id);

-- ---------------------------------------------------------------------------
-- 3. updated_at, the house pattern (set_updated_at, recorded in 246).
-- ---------------------------------------------------------------------------

drop trigger if exists lti_platforms_updated_at on public.lti_platforms;
create trigger lti_platforms_updated_at
  before update on public.lti_platforms
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Deployments. Auto-registered on first launch -- see the header.
-- ---------------------------------------------------------------------------

create table if not exists public.lti_deployments (
  id            uuid primary key default gen_random_uuid(),
  platform_id   uuid not null references public.lti_platforms(id) on delete cascade,
  deployment_id text not null,
  label         text,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

create unique index if not exists lti_deployments_platform_deployment_unique
  on public.lti_deployments (platform_id, deployment_id);

-- ---------------------------------------------------------------------------
-- 5. Capabilities. unknown = no row. See the header.
--
--    THE coalesce IN THE UNIQUE INDEX IS LOAD-BEARING. A plain three-column
--    unique index on (platform_id, deployment_id, key) would NOT prevent
--    duplicate platform-scoped rows, because NULL is never equal to NULL in a
--    unique index. Substituting a fixed sentinel uuid for the NULL makes
--    platform-scoped and deployment-scoped capabilities share one uniqueness
--    rule.
-- ---------------------------------------------------------------------------

create table if not exists public.lti_capabilities (
  id                uuid primary key default gen_random_uuid(),
  platform_id       uuid not null references public.lti_platforms(id) on delete cascade,
  deployment_id     uuid references public.lti_deployments(id) on delete cascade,
  key               text not null,
  value             text not null,
  observation_count integer not null default 1,
  last_detail       jsonb,
  observed_at       timestamptz not null default now()
);

alter table public.lti_capabilities drop constraint if exists lti_capabilities_value_vocab;
alter table public.lti_capabilities add constraint lti_capabilities_value_vocab
  check (value in ('true','false'));

create unique index if not exists lti_capabilities_scope_key_unique
  on public.lti_capabilities (platform_id, coalesce(deployment_id, '00000000-0000-0000-0000-000000000000'::uuid), key);

-- ---------------------------------------------------------------------------
-- 6. Nonce and state store.
--
--    SINGLE USE. consumed_at is set at launch, and a replay presents as
--    already-consumed. That is the same condition Canvas surfaces to users as
--    "launch has expired or already been consumed" -- which in practice is
--    almost always a tool whose nonce store lost the entry to a short TTL, or
--    which is not sharing nonce state across nodes. A row in Postgres has
--    neither problem.
--
--    state is unique so a replayed state collides rather than being accepted
--    twice.
-- ---------------------------------------------------------------------------

create table if not exists public.lti_nonces (
  id               uuid primary key default gen_random_uuid(),
  state            text not null unique,
  nonce            text not null,
  platform_id      uuid not null references public.lti_platforms(id) on delete cascade,
  target_link_uri  text,
  lti_message_hint text,
  created_at       timestamptz not null default now(),
  expires_at       timestamptz not null,
  consumed_at      timestamptz
);

create index if not exists lti_nonces_expiry_idx on public.lti_nonces (expires_at);

-- ---------------------------------------------------------------------------
-- 7. Evidence. PII. 30 days. See the header.
--
--    on delete set null on both FKs: deleting a registration must not destroy
--    the record of what it sent while it existed.
-- ---------------------------------------------------------------------------

create table if not exists public.lti_launch_evidence (
  id            uuid primary key default gen_random_uuid(),
  platform_id   uuid references public.lti_platforms(id) on delete set null,
  deployment_id uuid references public.lti_deployments(id) on delete set null,
  raw_jwt       text not null,
  claims        jsonb not null,
  received_at   timestamptz not null default now(),
  expires_at    timestamptz not null default (now() + interval '30 days')
);

create index if not exists lti_launch_evidence_expiry_idx on public.lti_launch_evidence (expires_at);

-- ---------------------------------------------------------------------------
-- 8. Skeleton. No PII. Indefinite. See the header.
--
--    claim_presence is a boolean map -- which claims arrived, never their
--    values. It is the whole reason this table can be kept forever.
-- ---------------------------------------------------------------------------

create table if not exists public.lti_launch_skeleton (
  id                  uuid primary key default gen_random_uuid(),
  platform_id         uuid references public.lti_platforms(id) on delete set null,
  deployment_id       uuid references public.lti_deployments(id) on delete set null,
  message_type        text,
  outcome             text not null,
  error_code          text,
  claim_presence      jsonb,
  clock_delta_seconds integer,
  received_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 9. Grants and RLS.
--
--    FIVE OF THE SEVEN TABLES GET NO GRANT AT ALL. lti_tool_keys,
--    lti_capabilities, lti_nonces, lti_launch_evidence and lti_launch_skeleton
--    are service_role only.
--
--    This is the quiz_questions pattern: the ABSENCE OF A GRANT is the control,
--    and RLS is not relied on alone. The table-level grant is checked BEFORE
--    row-level security, so a table with RLS enabled and no grant is closed
--    whatever its policies say -- and signing keys, live nonces and holder PII
--    have no business being reachable from a browser at any role.
--
--    The two readable tables are column-scoped and admin-gated, which is enough
--    for a console registration screen.
-- ---------------------------------------------------------------------------

alter table public.lti_tool_keys        enable row level security;
alter table public.lti_platforms        enable row level security;
alter table public.lti_deployments      enable row level security;
alter table public.lti_capabilities     enable row level security;
alter table public.lti_nonces           enable row level security;
alter table public.lti_launch_evidence  enable row level security;
alter table public.lti_launch_skeleton  enable row level security;

grant select (id, iss, client_id, name, auth_login_url, auth_token_url,
              jwks_url, company_id, product_family_code,
              skew_tolerance_seconds, status, created_at, updated_at)
  on public.lti_platforms to authenticated;

grant select (id, platform_id, deployment_id, label, first_seen_at, last_seen_at)
  on public.lti_deployments to authenticated;

drop policy if exists lti_platforms_admin_read on public.lti_platforms;
create policy lti_platforms_admin_read on public.lti_platforms
  for select to authenticated using (public.is_platform_admin());

drop policy if exists lti_deployments_admin_read on public.lti_deployments;
create policy lti_deployments_admin_read on public.lti_deployments
  for select to authenticated using (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 10. Verification. Observed live 2026-08-26 after the statements above.
--     These strings ARE the record.
-- ---------------------------------------------------------------------------

-- select c.relname, c.relrowsecurity,
--        (select count(*) from pg_policy p where p.polrelid = c.oid)
-- from pg_class c join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public' and c.relname like 'lti\_%' order by c.relname;
--
-- OBSERVED, seven tables, all rls = true:
--   lti_capabilities       true   0 policies
--   lti_deployments        true   1
--   lti_launch_evidence    true   0
--   lti_launch_skeleton    true   0
--   lti_nonces             true   0
--   lti_platforms          true   1
--   lti_tool_keys          true   0
--
-- (The query also returns index rows, because pg_class holds indexes too.
--  Filter on relkind = 'r' if that is distracting.)

-- select conname, pg_get_constraintdef(oid), convalidated
-- from pg_constraint where conrelid::regclass::text like 'lti\_%' and contype = 'c'
-- order by conname;
--
-- OBSERVED, verbatim, all convalidated true:
--
--   lti_capabilities_value_vocab
--     CHECK ((value = ANY (ARRAY['true'::text, 'false'::text])))
--
--   lti_tool_keys_active_requires_material
--     CHECK (((status = 'retired'::text) OR ((vault_secret_id IS NOT NULL) AND (public_jwk IS NOT NULL))))
--
--   lti_tool_keys_status_vocab
--     CHECK ((status = ANY (ARRAY['active'::text, 'retiring'::text, 'retired'::text])))

-- select indexname, indexdef from pg_indexes
-- where schemaname = 'public' and tablename like 'lti\_%' order by indexname;
--
-- OBSERVED, verbatim (pkeys omitted here for length; all seven exist):
--
--   lti_capabilities_scope_key_unique
--     CREATE UNIQUE INDEX lti_capabilities_scope_key_unique ON public.lti_capabilities
--     USING btree (platform_id, COALESCE(deployment_id, '00000000-0000-0000-0000-000000000000'::uuid), key)
--
--   lti_deployments_platform_deployment_unique
--     CREATE UNIQUE INDEX lti_deployments_platform_deployment_unique ON public.lti_deployments
--     USING btree (platform_id, deployment_id)
--
--   lti_platforms_iss_client_unique
--     CREATE UNIQUE INDEX lti_platforms_iss_client_unique ON public.lti_platforms
--     USING btree (iss, client_id)
--
--   lti_nonces_state_key
--     CREATE UNIQUE INDEX lti_nonces_state_key ON public.lti_nonces USING btree (state)
--
--   lti_tool_keys_kid_key
--     CREATE UNIQUE INDEX lti_tool_keys_kid_key ON public.lti_tool_keys USING btree (kid)
--
--   lti_launch_evidence_expiry_idx
--     CREATE INDEX lti_launch_evidence_expiry_idx ON public.lti_launch_evidence USING btree (expires_at)
--
--   lti_nonces_expiry_idx
--     CREATE INDEX lti_nonces_expiry_idx ON public.lti_nonces USING btree (expires_at)

-- select table_name, grantee, privilege_type, column_name
-- from information_schema.column_privileges
-- where table_schema = 'public' and table_name like 'lti\_%' and grantee = 'authenticated'
-- order by table_name, column_name;
--
-- OBSERVED: authenticated holds SELECT on 6 columns of lti_deployments and 13
--           of lti_platforms, and NOTHING on the other five tables. As intended.
