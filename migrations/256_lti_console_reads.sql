-- 256_lti_console_reads.sql
--
-- Console reads for the LTI registration admin: capability observations and
-- launch attempts, platform_admin only.
--
-- Editor-first: this ran live in the SQL editor on 2026-08-26, one statement at
-- a time. The file is the record of what already ran, not a script anyone
-- executes. No function body, so no md5 -- the verifiable artefacts are the
-- granted column list and the policy set, recorded verbatim in section 5. Same
-- discipline as 247, 248, 251, 252 and 253.
--
-- ============================ WHY A GRANT AND NOT A FUNCTION =============
--
-- 253 left five of the seven lti_ tables with no grant at all, on the
-- quiz_questions principle: the table-level grant is checked BEFORE row-level
-- security, so a table with RLS enabled and no grant is closed whatever its
-- policies say.
--
-- Two of those five now need to be readable by the console. The alternative was
-- an admin-gated edge function returning an assembled snapshot, and it was
-- rejected: it would be a SECOND READ PATH for data the console can safely see
-- directly, and a second read path is a second place the access rule can drift.
-- These are non-PII operational facts, RLS is already on, and a
-- platform_admin-only policy matches what lti_platforms already has.
--
-- THE OTHER THREE STAY CLOSED. lti_tool_keys, lti_nonces and
-- lti_launch_evidence keep no grant and no policy. Signing keys, live
-- single-use nonces and holder PII have no business being reachable from a
-- browser at any role, and nothing on the console needs them.
--
-- ============================ WHY last_detail IS WITHHELD =================
--
-- lti_capabilities has eight columns and seven are granted. last_detail is not.
--
-- It is the ONE COLUMN HERE WITH UNBOUNDED CONTENT THAT FUTURE CODE WILL WRITE
-- INTO. Today the only caller is lti-login, which passes null. Tomorrow a
-- launch handler recording why a capability was observed will want to put an
-- error shape in it -- and the first person who drops a claim value there
-- (a roles array, a context title, an email that failed a check) would carry it
-- onto a surface that was already open, with no review at the moment it
-- happened.
--
-- The console list needs key, value, observation_count and observed_at. That is
-- the substance. last_detail is diagnostic depth for someone with database
-- access, which is who should be looking at it.
--
-- WIDENING THIS LATER IS A DECISION. NARROWING IT AFTER SOMETHING HAS LEAKED IS
-- NOT. That asymmetry is the whole argument.
--
-- ============================ WHY THE SKELETON POLICY ADMITS NULL ========
--
-- lti_launch_skeleton.platform_id is nullable, and the policy is
-- is_platform_admin() with no per-platform scoping. That is deliberate.
--
-- A row with platform_id IS NULL is an attempt from a platform we have NO
-- REGISTRATION FOR -- outcome 'unregistered_platform'. Someone at an
-- institution added Certidemy to their LMS, clicked it, and reached us before
-- anyone told us they existed.
--
-- THOSE ARE THE MOST VALUABLE ROWS ON THE SCREEN. They are how we learn an
-- institution is trying to integrate BEFORE they email, and a scoped policy --
-- "you may read attempts belonging to a platform you can read" -- would hide
-- precisely the rows that say someone new is knocking, because by definition
-- they belong to no platform.
--
-- ============================ NON-PII BY CONSTRUCTION ====================
--
-- Every column of lti_launch_skeleton is granted, and that is safe rather than
-- lax. The table holds identifiers, an outcome, an error code, timing, and
-- claim_presence -- A BOOLEAN MAP OF WHICH CLAIMS ARRIVED, NEVER THEIR VALUES.
-- That is the property that lets the table be retained indefinitely while
-- lti_launch_evidence expires in 30 days, and it is the same property that
-- makes it safe to read here. If a future writer ever puts a claim VALUE in
-- this table, both of those decisions become wrong at once.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).
-- Idempotent: grants are re-runnable; policies are drop-if-exists then create.

-- ---------------------------------------------------------------------------
-- 1. lti_capabilities. Seven of eight columns -- see the header on last_detail.
-- ---------------------------------------------------------------------------

grant select (id, platform_id, deployment_id, key, value,
              observation_count, observed_at)
  on public.lti_capabilities to authenticated;

-- ---------------------------------------------------------------------------
-- 2. lti_launch_skeleton. All nine, safe by construction -- see the header.
-- ---------------------------------------------------------------------------

grant select (id, platform_id, deployment_id, message_type, outcome,
              error_code, claim_presence, clock_delta_seconds, received_at)
  on public.lti_launch_skeleton to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Policies. is_platform_admin() rather than a hand-written EXISTS, so every
--    LTI policy delegates to the same predicate -- 239's one-predicate rule.
--    Five hand-written predicates would be five chances to disagree, and the
--    one that drifts is the one that leaks.
-- ---------------------------------------------------------------------------

drop policy if exists lti_capabilities_admin_read on public.lti_capabilities;
create policy lti_capabilities_admin_read on public.lti_capabilities
  for select to authenticated using (public.is_platform_admin());

drop policy if exists lti_launch_skeleton_admin_read on public.lti_launch_skeleton;
create policy lti_launch_skeleton_admin_read on public.lti_launch_skeleton
  for select to authenticated using (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- 4. NOT DONE HERE, ON PURPOSE.
--
--    No partner (team_admin) access. A registration decides WHO MAY INITIATE A
--    LOGIN INTO US; lti_platforms.company_id is unread in phase 1; and phase 2
--    has not decided what a launched student is entitled to. platform_admin
--    only is the smaller claim and is easy to widen. The reverse is not.
--
--    No INSERT or UPDATE grant on lti_platforms. Creating a registration goes
--    through an admin-gated edge function that writes an admin_actions row,
--    rather than opening writes on the table that defines who may sign into us.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 5. Verification. Observed live 2026-08-26 after the statements above.
--    These lists ARE the record.
-- ---------------------------------------------------------------------------

-- select table_name, column_name from information_schema.column_privileges
-- where table_schema = 'public' and grantee = 'authenticated'
--   and table_name in ('lti_capabilities','lti_launch_skeleton')
-- order by table_name, column_name;
--
-- OBSERVED:
--   lti_capabilities     7 columns: deployment_id, id, key, observation_count,
--                        observed_at, platform_id, value
--                        (NO last_detail -- see the header)
--   lti_launch_skeleton  9 columns: claim_presence, clock_delta_seconds,
--                        deployment_id, error_code, id, message_type, outcome,
--                        platform_id, received_at

-- select c.relname, c.relrowsecurity,
--        (select count(*) from pg_policy p where p.polrelid = c.oid)
-- from pg_class c join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'lti\_%'
-- order by c.relname;
--
-- OBSERVED, all rls = true:
--   lti_capabilities       1 policy
--   lti_deployments        1
--   lti_launch_evidence    0
--   lti_launch_skeleton    1
--   lti_nonces             0
--   lti_platforms          1
--   lti_tool_keys          0
--
-- Keys, nonces and evidence still closed with no grant AND no policy. The
-- absence of the grant is the control; the absent policy is belt and braces.
