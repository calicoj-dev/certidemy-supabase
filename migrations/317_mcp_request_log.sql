-- 317_mcp_request_log.sql
--
-- Observability for the courseware MCP. The endpoint has been serving since
-- 2026-09-13 and writes to nothing, so "what did partners ask this week" has no
-- answer and every day without this loses data that cannot be bought back.
--
-- ===================== HOW THE WRITE HAPPENS =====================
--
-- mcp_reader MUST NOT GAIN WRITE ACCESS. That role holding no write grant
-- anywhere is what makes the read path provably safe, and widening it to log
-- would trade the property for the telemetry.
--
-- So: a SECURITY DEFINER function, and the OWNER is the whole safety argument.
--
--   mcp_logger          NOLOGIN, never connects, no password. INSERT and only
--                       INSERT on public.mcp_requests. Not even SELECT -- the
--                       logging identity cannot read the log back.
--   mcp.log_request()   SECURITY DEFINER, OWNED BY mcp_logger. EXECUTE granted
--                       to mcp_reader, revoked from PUBLIC.
--
-- mcp_reader therefore gains EXECUTE ON ONE FUNCTION and INSERT on nothing. The
-- distinction is not cosmetic: it is asserted at runtime by courseware-read's
-- cold-start check, beside the mcp.lesson assertion, so it is provable rather
-- than merely true.
--
-- A SECURITY DEFINER function is an escalation channel by construction. Owned by
-- postgres, a defect in its body would run with full rights. Owned by
-- mcp_logger, whose only privilege is INSERT on one table, a defect is bounded
-- to writing bad log rows. THE OWNER IS ASSERTED IN THE POST-CONDITIONS so a
-- later `create or replace` by the wrong role fails loudly rather than silently
-- re-owning the function to whoever ran it.
--
-- Hardened: `set search_path = ''` with every object fully qualified, scalar
-- arguments only, no dynamic SQL, returns void.
--
-- ===================== WHY THE TABLE IS IN public =====================
--
-- Deliberately NOT in schema mcp. service_role has no USAGE there -- measured
-- 2026-09-14 and load-bearing, because it is what stops the convenient
-- credential reading the courseware views. Putting telemetry in mcp would force
-- granting service_role USAGE on that schema to read our own data, trading a
-- boundary for a convenience. public.issuer_api_requests is the model and this
-- sits beside it.
--
-- ===================== PRIVACY, SETTLED BEFORE THERE IS DATA =====================
--
-- SEARCH QUERIES ARE STORED VERBATIM, minus one redaction. They are the feedback
-- loop the endpoint exists to produce -- "risk management" typed at an AI
-- service-management certification is the signal -- and no aggregate substitutes
-- for the phrase.
--
-- THE REDACTION IS EMAIL-ONLY and happens in the function before this is called.
-- Narrow on purpose: a fuzzy "looks like a person" filter would silently eat
-- legitimate queries and corrupt the signal the table exists for. It is not
-- hypothetical -- this repo's own instrument wrote someone@example.com to disk
-- from a tool designed to refuse email addresses, and a search box is the
-- obvious place for "find John Smith's certification".
--
-- THE IP IS NEVER STORED RAW. caller_hash is an HMAC with a salt rotated
-- monthly: distinct-caller counts within a month, no re-identification across
-- months or from this table alone. A raw IP is an identifier and buys nothing
-- the hash does not.
--
-- RETENTION IS 90 DAYS, ENFORCED BY pg_cron RATHER THAN BY INTENTION. The
-- schedule is at the foot of this file, outside the transaction, because
-- cron.schedule is not transactional.
--
-- NEVER STORED: raw IP, header dumps, request bodies, anything from a
-- credential. The route already learned this the expensive way -- its header
-- dump held caller geolocation to five decimal places.
--
-- Editor-first: run this in the SQL editor, then commit the file as the record.

begin;

-- ------------------------------------------------------------------ role

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'mcp_logger') then
    create role mcp_logger nologin noinherit;
  end if;
end
$$;

comment on role mcp_logger is
  'Owns mcp.log_request and holds INSERT on public.mcp_requests. Never connects, '
  'has no password, and cannot read the log it writes.';

-- ============ THE EXECUTING ROLE MUST BE ABLE TO SET ROLE mcp_logger ============
--
-- Without this, `alter function ... owner to mcp_logger` fails with
--   ERROR 42501: must be able to SET ROLE "mcp_logger"
-- even though this transaction just created the role.
--
-- MEASURED RATHER THAN ASSUMED, on Postgres 17.6. Supabase's `postgres` is NOT a
-- superuser but does hold CREATEROLE. Since PG16, creating a role grants the
-- creator ADMIN OPTION and NOT the SET option:
--
--   role        granted_to    admin  inherit  set
--   mcp_reader  postgres      true   false    FALSE   <- why the owner change failed
--   mcp_reader  authenticator false  false    true    <- an explicit GRANT defaults to SET TRUE
--
-- So the creator can administer the role and cannot become it. An explicit
-- GRANT supplies what CREATE ROLE withheld, and ADMIN OPTION is exactly the
-- privilege that permits it -- no superuser required.
--
-- WHY THIS DIRECTION AND NOT THE OTHER TWO:
--
--   Creating the function as owner-by-default and altering afterwards is what
--   this migration already did. The ALTER is the failing step, so it is not an
--   alternative.
--
--   Creating it while SET ROLE mcp_logger is active would avoid the ALTER
--   entirely, and needs the SAME grant to do the SET ROLE -- plus CREATE on
--   schema mcp for mcp_logger, which is more privilege for a role whose whole
--   point is that it has almost none. Rejected.
--
-- So: grant, create as the schema owner, transfer. mcp_logger never needs CREATE
-- anywhere.
--
-- INHERIT is deliberately NOT granted. The executing role must SET ROLE
-- explicitly to act as mcp_logger rather than silently acquiring its INSERT,
-- which is the same reason the owner matters at all. The grant is left in place
-- afterwards so a future migration can re-own the function; ADMIN OPTION means
-- the creator could re-grant it at any time regardless, so removing it would buy
-- nothing and cost the next author a confusing failure.
do $$
begin
  execute format('grant mcp_logger to %I with set true', current_user);
end
$$;

-- ------------------------------------------------------------------ table

create table if not exists public.mcp_requests (
  id                     uuid primary key default gen_random_uuid(),
  at                     timestamptz not null default now(),

  -- what was asked
  resource               text not null,
  tool                   text,
  language               text,
  query_text             text,
  query_len              int,
  slug                   text,
  task_code              text,
  domain_code            text,
  limit_requested        int,
  contract_version       int,

  -- what happened
  status                 int not null,
  rows_returned          int,
  duration_ms            int,
  error                  text,
  refused_certification  text,

  -- who, weakly and on purpose
  caller_hash            text,
  client_name            text,
  api_key_id             uuid,

  constraint mcp_requests_resource_check
    check (resource in ('certification', 'task', 'concept', 'search', 'log')),
  constraint mcp_requests_status_check
    check (status between 100 and 599),
  -- The redaction is applied before insert; this is the backstop that makes it
  -- a property of the table rather than a habit of one caller.
  constraint mcp_requests_no_email
    check (query_text is null or query_text !~ '[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}')
);

comment on table public.mcp_requests is
  'Courseware MCP telemetry. Search queries are stored verbatim minus emails; '
  'the IP is stored only as a rotating HMAC. 90-day retention via pg_cron.';
comment on column public.mcp_requests.caller_hash is
  'HMAC of the caller IP with a monthly salt. Never a raw address.';
comment on column public.mcp_requests.api_key_id is
  'Null until the lesson token flow exists. There is no authentication on the '
  'courseware path today, so MCP traffic cannot be attributed to a partner.';

create index if not exists mcp_requests_at_idx on public.mcp_requests (at desc);
create index if not exists mcp_requests_resource_at_idx on public.mcp_requests (resource, at desc);
create index if not exists mcp_requests_refused_idx
  on public.mcp_requests (refused_certification, at desc)
  where refused_certification is not null;

-- ------------------------------------------------------------------ grants

alter table public.mcp_requests enable row level security;
revoke all on public.mcp_requests from public;
-- By name, not via PUBLIC: 316 established that revoking from PUBLIC does not
-- remove a privilege granted directly to a role.
revoke all on public.mcp_requests from anon, authenticated;

-- INSERT only. Not SELECT: the logging identity cannot read the log back.
grant insert on public.mcp_requests to mcp_logger;

-- ------------------------------------------------------------------ function

create or replace function mcp.log_request(
  p_resource              text,
  p_tool                  text,
  p_language              text,
  p_query_text            text,
  p_query_len             int,
  p_slug                  text,
  p_task_code             text,
  p_domain_code           text,
  p_limit                 int,
  p_contract_version      int,
  p_status                int,
  p_rows                  int,
  p_duration_ms           int,
  p_error                 text,
  p_refused_certification text,
  p_caller_hash           text,
  p_client_name           text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.mcp_requests (
    resource, tool, language, query_text, query_len, slug, task_code,
    domain_code, limit_requested, contract_version, status, rows_returned,
    duration_ms, error, refused_certification, caller_hash, client_name
  ) values (
    p_resource, p_tool, p_language, left(p_query_text, 400), p_query_len,
    left(p_slug, 200), left(p_task_code, 20), left(p_domain_code, 10), p_limit,
    p_contract_version, p_status, p_rows, p_duration_ms, left(p_error, 500),
    left(p_refused_certification, 40), left(p_caller_hash, 128),
    left(p_client_name, 80)
  );
$$;

-- THE OWNER IS THE SAFETY ARGUMENT. Asserted below.
alter function mcp.log_request(text, text, text, text, int, text, text, text, int, int, int, int, int, text, text, text, text)
  owner to mcp_logger;

revoke all on function mcp.log_request(text, text, text, text, int, text, text, text, int, int, int, int, int, text, text, text, text) from public;
grant execute on function mcp.log_request(text, text, text, text, int, text, text, text, int, int, int, int, int, text, text, text, text) to mcp_reader;

commit;

-- ===================== VERIFICATION =====================
--
-- pg_catalog only. Nothing attempts a write as any role: where the check and the
-- damage are the same action, the check IS the damage (migration 246).
--
-- 1. THE OWNER. This is the assertion that matters most: a later
--    `create or replace` run by postgres would silently re-own the function and
--    turn a bounded definer into an unbounded one. Expect mcp_logger, sql,
--    definer true, search_path ''.
--
-- select p.proname,
--        pg_get_userbyid(p.proowner) as owner,       -- expect mcp_logger
--        l.lanname                   as language,    -- expect sql
--        p.prosecdef                 as is_definer,  -- expect t
--        p.proconfig::text           as settings     -- expect {search_path=""}
--   from pg_proc p
--   join pg_namespace n on n.oid = p.pronamespace
--   join pg_language  l on l.oid = p.prolang
--  where n.nspname = 'mcp' and p.proname = 'log_request';
--
-- 1b. The grant that made the owner change possible. Expect set_option t.
--     If this is f, the owner assertion above will have failed too -- they are
--     the same fact seen from two sides.
--
-- select g.rolname as granted_to, m.admin_option, m.inherit_option, m.set_option
--   from pg_auth_members m
--   join pg_roles r on r.oid = m.roleid
--   join pg_roles g on g.oid = m.member
--  where r.rolname = 'mcp_logger';
--
-- 2. mcp_reader CAN EXECUTE AND CANNOT INSERT. Expect t, then f.
--    The second half is re-asserted at runtime by courseware-read's cold-start
--    check, so it is provable rather than merely recorded here.
--
-- select has_function_privilege('mcp_reader',
--          'mcp.log_request(text,text,text,text,int,text,text,text,int,int,int,int,int,text,text,text,text)',
--          'EXECUTE')                                          as reader_can_execute,
--        has_table_privilege('mcp_reader', 'public.mcp_requests', 'INSERT') as reader_can_insert;
--
-- 3. mcp_logger CAN INSERT AND CANNOT READ. Expect t, then f, f, f.
--
-- select has_table_privilege('mcp_logger', 'public.mcp_requests', 'INSERT') as can_insert,
--        has_table_privilege('mcp_logger', 'public.mcp_requests', 'SELECT') as can_select,
--        has_table_privilege('mcp_logger', 'public.mcp_requests', 'UPDATE') as can_update,
--        has_table_privilege('mcp_logger', 'public.mcp_requests', 'DELETE') as can_delete;
--
-- 4. THE BROWSER ROLES HAVE NOTHING. Expect four f.
--
-- select r as role,
--        has_table_privilege(r, 'public.mcp_requests', 'SELECT') as sel,
--        has_table_privilege(r, 'public.mcp_requests', 'INSERT') as ins
--   from unnest(array['anon','authenticated']) r;
--
-- 5. THE EMAIL BACKSTOP IS A CONSTRAINT, NOT A HABIT. Expect one row.
--
-- select conname from pg_constraint
--  where conrelid = 'public.mcp_requests'::regclass
--    and conname = 'mcp_requests_no_email';
--
-- 6. Empty on arrival, and the first real read once traffic exists:
--
-- select resource, count(*), max(at) from public.mcp_requests group by 1 order by 2 desc;
--
-- ===================== RETENTION, RUN SEPARATELY =====================
--
-- cron.schedule is NOT transactional and must not sit inside the block above.
-- Run this once, after the table exists:
--
-- select cron.schedule(
--   'mcp-requests-retention',
--   '17 3 * * *',
--   $job$ delete from public.mcp_requests where at < now() - interval '90 days' $job$
-- );
--
-- Confirm it registered, and that it is the only job touching this table:
--
-- select jobid, schedule, command from cron.job where jobname = 'mcp-requests-retention';
