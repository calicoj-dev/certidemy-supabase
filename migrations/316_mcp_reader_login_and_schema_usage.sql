-- 316_mcp_reader_login_and_schema_usage.sql
--
-- Follow-up to 315. Two things: mcp_reader becomes a LOGIN role, and the mcp
-- schema stops depending on table-level grants for its boundary.
--
-- A FOLLOW-UP RATHER THAN AN EDIT TO 315, deliberately. 315 has run. Editing it
-- would leave a file that does not match what was applied, and the next reader
-- would take the edited version for the record of what happened. The sequence
-- is the record.
--
-- ===================== WHY LOGIN, AND WHY IT REVERSED =====================
--
-- 315 shipped both roles NOLOGIN on the plan that an edge function would mint a
-- short-lived JWT carrying `role: mcp_reader` from SUPABASE_JWT_SECRET, and
-- reach the views through PostgREST as `authenticator`. That plan is dead, and
-- the reason is worth recording because the FIRST decision was the worse one:
--
--   The project signs ES256. The JWKS endpoint returns one current key
--   (kid 88AAF3F3-...), and the legacy HS256 shared secret is the PREVIOUS key:
--   it VERIFIES unexpired tokens and does not SIGN. A token minted with it would
--   not be accepted, and the dashboard advises revoking it once the outstanding
--   tokens expire. Building on it means building on something scheduled for
--   deletion.
--
-- An edge function holding a signing secret could mint `service_role`, so that
-- boundary constrained the Worker, the route and every prompt, but not code
-- inside the function. A PASSWORD FOR mcp_reader GRANTS EXACTLY mcp_reader: it
-- cannot escalate, cannot reach mcp.lesson, and cannot mint anything. The option
-- ranked as the fallback has the smaller residual. See MCP-COURSEWARE.md
-- section 2.
--
-- THE PASSWORD IS NOT IN THIS FILE AND MUST NEVER BE. It is set by a separate
-- statement, as a pre-hashed SCRAM verifier, documented at the foot of this file.
--
-- mcp_holder STAYS NOLOGIN. The holder path does not exist yet, and a login role
-- with no caller is a credential with no owner. It gets LOGIN in the migration
-- that builds that path, not in advance.
--
-- ===================== THE REAL SUBJECT: SCHEMA USAGE =====================
--
-- 315's boundary rested on table-level grants: mcp_reader and mcp_holder were
-- granted SELECT on named views, and anon and authenticated were granted
-- nothing. That is correct today and it is CONFIGURED rather than STRUCTURAL,
-- which was precisely the property 315 claimed to have and did not.
--
-- The hosted project has "Automatically expose new tables" ON, which applies
-- default privileges to Data API roles. Whether that reaches a non-public schema
-- is a question about Supabase's behaviour, and the honest answer is that it
-- must be measured rather than assumed -- the verification at the foot of this
-- file does that. But the better move is to make the answer NOT MATTER:
--
--   SCHEMA USAGE IS A SINGLE CHOKE POINT. Without USAGE on schema mcp, a role
--   cannot reference any object inside it, whatever table-level privilege it is
--   later handed. One revoke covers every table that will ever exist here,
--   including ones created by a future migration that forgets.
--
-- So this revokes USAGE from anon and authenticated BY NAME. 315 revoked it from
-- PUBLIC, which is a different thing: a privilege granted directly to anon is
-- not removed by revoking from PUBLIC, and exposing a schema through the
-- dashboard is exactly the sort of action that grants directly.
--
-- `authenticator` KEEPS USAGE. PostgREST introspects as that role to build its
-- schema cache, and a schema it cannot see is a schema whose views do not appear
-- in the API at all. It is granted USAGE and no table privilege: it can see that
-- the views exist and cannot read a row from them.
--
-- Editor-first: run this in the SQL editor, then commit the file as the record.

begin;

-- ------------------------------------------------------------------ login

alter role mcp_reader login;

comment on role mcp_reader is
  'Courseware MCP, public tier. LOGIN since 316: the edge function connects as '
  'this role directly. Reads the AISM-I blueprint. No lesson bodies.';

-- ------------------------------------------------------- schema usage

-- By name, not via PUBLIC. Revoking from PUBLIC does not remove a privilege
-- granted directly to a role, and exposing a schema in the dashboard is exactly
-- the sort of action that grants directly.
revoke usage on schema mcp from anon, authenticated;

-- PostgREST introspects as authenticator. Usage only: it must be able to SEE
-- the views to serve them, and must not be able to READ them itself.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticator') then
    execute 'grant usage on schema mcp to authenticator';
  end if;
end
$$;

-- Belt and braces behind the choke point: even if something grants a future
-- table to these roles, and even if usage were restored by hand, the default
-- privileges here do not hand it over on creation.
alter default privileges in schema mcp revoke all on tables from anon, authenticated;
alter default privileges in schema mcp revoke all on sequences from anon, authenticated;
alter default privileges in schema mcp revoke all on functions from anon, authenticated;

-- And nothing already in the schema is reachable by them.
revoke all on all tables in schema mcp from anon, authenticated;

commit;

-- ===================== SETTING THE PASSWORD =====================
--
-- NOT IN THIS FILE, AND NOT AS PLAINTEXT IN THE SQL EDITOR EITHER.
--
-- Postgres does not redact `alter role ... password '...'` from the server log,
-- and the Supabase SQL editor keeps query history. A plaintext password typed
-- there survives in two places nobody thinks of as a secret store.
--
-- So set a PRE-HASHED SCRAM-SHA-256 verifier. Postgres stores such a string
-- verbatim rather than hashing it again, and the verifier is NOT
-- password-equivalent: SCRAM is built so that StoredKey does not permit
-- authentication, unlike the old md5 format which was directly replayable.
--
--   node scripts/scram-verifier.mjs
--
-- It prints the password ONCE, for the edge function secret, and the statement
-- to run. Then, as a single statement in the editor:
--
--   alter role mcp_reader password 'SCRAM-SHA-256$4096:....';
--
-- The password itself goes to the edge function secret store and nowhere else:
--
--   supabase secrets set MCP_READER_PASSWORD='...'
--
-- ===================== VERIFICATION =====================
--
-- pg_catalog only. Nothing below attempts a connection or a select as any role:
-- where the check and the damage are the same action, the check IS the damage
-- (migration 246).
--
-- 1. LOGIN landed on the reader and NOT on the holder. Expect exactly two rows:
--    mcp_reader t, mcp_holder f.
--
-- select rolname, rolcanlogin from pg_roles
--  where rolname in ('mcp_reader','mcp_holder') order by rolname;
--
-- 2. A password is set. Expect mcp_reader t. This reads whether a verifier
--    EXISTS, never what it is.
--
-- select rolname, rolpassword is not null as has_password
--   from pg_authid where rolname = 'mcp_reader';
--
-- 3. THE CHOKE POINT. anon and authenticated must have no USAGE on mcp;
--    authenticator and the two mcp roles must have it. Expect f, f, t, t, t.
--
-- select r as role, has_schema_privilege(r, 'mcp', 'USAGE') as usage
--   from unnest(array['anon','authenticated','authenticator','mcp_reader','mcp_holder']) r;
--
-- 4. THE QUESTION THIS MIGRATION WAS WRITTEN AROUND -- measure it rather than
--    assume it. Any row naming schema mcp with anon or authenticated in the ACL
--    means "Automatically expose new tables" DOES reach this schema, and the
--    revoke above is load-bearing rather than precautionary. Either way the
--    usage revoke in 3 holds the boundary; this tells you which.
--
-- select n.nspname as schema, pg_get_userbyid(d.defaclrole) as grantor,
--        d.defaclobjtype as objtype, d.defaclacl::text as acl
--   from pg_default_acl d
--   left join pg_namespace n on n.oid = d.defaclnamespace
--  order by 1, 2, 3;
--
-- 5. Still true from 315, and re-asserted because this migration touched grants.
--    Expect 0.
--
-- select count(*) as base_tables_reachable
--   from pg_class t
--   join pg_namespace n on n.oid = t.relnamespace
--   cross join (select unnest(array['mcp_reader','mcp_holder']) as rolname) r
--  where n.nspname = 'public' and t.relkind in ('r','v','m','p')
--    and has_table_privilege(r.rolname, t.oid, 'SELECT');
--
-- 6. And the paywall, unchanged. Expect false, then true.
--
-- select has_table_privilege('mcp_reader', 'mcp.lesson', 'SELECT') as reader_can_read_lessons,
--        has_table_privilege('mcp_holder', 'mcp.lesson', 'SELECT') as holder_can_read_lessons;
--
-- ===================== THE RESIDUAL, NAMED =====================
--
-- A LOGIN role with a password can connect from anywhere; Supabase does not
-- expose pg_hba, so there is no network restriction to add. The blast radius of
-- that password is exactly what mcp_reader can read: three views over one
-- certification's published blueprint, which is material Certidemy publishes. It
-- cannot reach lesson bodies, any base table, or any other certification.
--
-- That is a smaller residual than the signing secret it replaces, and it is not
-- zero. Rotate by re-running the script and issuing a new verifier.
