-- ============================================================================
-- 229_partner_leads.sql
--
-- Inbound partner enquiries from the public marketing form.
--
-- RUN IN THE SQL EDITOR FIRST, THEN COMMITTED HERE AS THE RECORD.
-- Committing this file does not apply it -- there is no migration runner.
--
-- ---------------------------------------------------------------------------
-- WHY THE REVOKE IS THE SECURITY, NOT THE RLS
--   The table-level GRANT is checked BEFORE row-level security. Enabling RLS
--   alone would leave `anon` able to reach this table if any grant existed, and
--   a failure-tolerant loader would swallow the resulting 42501 silently.
--   `revoke all ... from anon` is what makes the browser unable to touch it at
--   all. RLS then narrows what a signed-in caller can SEE.
--
--   Verified after running: `anon` holds NO privileges on this table.
--   `authenticated` holds SELECT only -- deliberately no INSERT, so even a
--   signed-in learner cannot write. Only the service role writes, and only
--   through the submit-partner-lead edge function.
--
-- WHY MARKETING CAN READ
--   lib/console/access.ts describes `marketing` as the sales-library seat,
--   existing so a rep never needs a role that can flip certification status or
--   issue vouchers. Leads are precisely what that seat is for.
--
-- WHY THE CHECK CONSTRAINTS EXIST WHEN THE FUNCTION ALREADY VALIDATES
--   The function validates to return a useful 400 instead of a raw Postgres
--   error. The constraints exist because the function is not the only thing
--   that could ever write, and because a malformed row must fail LOUDLY.
--   phone_e164 in particular: GoHighLevel will not accept "+57 300 123 4567",
--   so a non-E.164 value has to be rejected at the boundary rather than
--   discovered later in the CRM.
-- ============================================================================

create table public.partner_leads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  name            text not null check (length(btrim(name)) between 2 and 120),
  email           text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  organization    text check (organization is null or length(btrim(organization)) <= 160),
  country_alpha2  text check (country_alpha2 is null or country_alpha2 ~ '^[A-Z]{2}$'),
  phone_e164      text check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  whatsapp_ok     boolean not null default false,
  org_type        text check (org_type is null or org_type in
                    ('university','institute','training_center','consultancy','independent','internal_ld','other')),
  message         text check (message is null or length(message) <= 4000),
  locale          text not null default 'en' check (locale in ('en','es-419','pt-BR')),
  source          text not null default 'home' check (length(source) <= 40),
  status          text not null default 'new' check (status in ('new','contacted','qualified','archived')),
  ghl_contact_id  text,
  ghl_pushed_at   timestamptz
);

comment on table public.partner_leads is
  'Inbound partner enquiries from the public marketing form. Written ONLY by the submit-partner-lead edge function (service role). Never written from the browser.';

create index partner_leads_created_idx on public.partner_leads (created_at desc);

create index partner_leads_status_idx on public.partner_leads (status, created_at desc);

alter table public.partner_leads enable row level security;

revoke all on public.partner_leads from anon, authenticated;

grant select on public.partner_leads to authenticated;

create policy partner_leads_staff_read on public.partner_leads
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.platform_role in ('platform_admin','marketing')
    )
  );

-- ---------------------------------------------------------------------------
-- VERIFICATION RUN AFTER APPLYING (both returned as expected)
--
--   select tablename, rowsecurity from pg_tables where tablename = 'partner_leads';
--     -> partner_leads | true
--
--   select grantee, privilege_type from information_schema.role_table_grants
--   where table_name = 'partner_leads' order by grantee, privilege_type;
--     -> authenticated SELECT
--     -> postgres      (all)
--     -> service_role  (all)
--     -> anon          ABSENT   <-- the line that matters
-- ---------------------------------------------------------------------------
