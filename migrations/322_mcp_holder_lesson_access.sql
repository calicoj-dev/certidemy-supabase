-- 322_mcp_holder_lesson_access.sql
--
-- The holder path: lesson bodies over the MCP, for a partner holding an issuer
-- API key scoped `courseware:lessons`.
--
-- ===================== THE BOUNDARY DOES NOT MOVE =====================
--
-- mcp_holder was created in 315 with SELECT on mcp.lesson and has been NOLOGIN
-- since, because a login role with no caller is a credential with no owner.
-- It now has a caller. Nothing about mcp_reader changes, and no branch decides
-- who may read a lesson -- a SECOND POOL connects as mcp_holder, and the reader
-- pool remains provably incapable of the query.
--
--   mcp_reader  ->  certification, task, concept, lesson_index
--   mcp_holder  ->  those four AND lesson
--
-- ===================== THE INDEX IS PUBLIC, THE BODY IS NOT =====================
--
-- mcp.lesson_index is mcp.lesson WITHOUT content_md: module and lesson slugs,
-- titles, language, order, duration. A table of contents, which is the same kind
-- of thing get_syllabus already publishes.
--
-- It is granted to mcp_reader ON PURPOSE. A partner deciding whether to buy
-- access has to be able to see what exists; putting the catalogue behind the
-- paywall means paying to discover what you are paying for. The grant boundary
-- carries the distinction with no code involved: the index omits the column, so
-- there is no body to leak from it.
--
-- ===================== SCOPES GAIN A VOCABULARY =====================
--
-- issuer_api_keys.scopes was an unconstrained text[] defaulting to
-- {credentials:issue}. A typo there grants nothing and fails at authorization
-- time, far from the console that made it -- silent success, the failure mode
-- this repo keeps paying for. The CHECK makes a bad scope fail where it is
-- typed. Every existing row holds credentials:issue only, measured, so nothing
-- is invalidated.
--
-- ===================== THE PASSWORD IS NOT IN THIS FILE =====================
--
-- Same discipline as 316: mcp_holder gets LOGIN here and its password is set by
-- a separate statement as a pre-hashed SCRAM verifier.
--
--   node scripts/scram-verifier.mjs --role mcp_holder
--
-- Editor-first, ONE STATEMENT.

do $mig$
declare
  n bigint;
  blocked boolean := false;
begin
  -- ------------------------------------------------------------- the index

  execute $ddl$
    create or replace view mcp.lesson_index
    with (security_barrier = true) as
    select
      m.slug        as module_slug,
      m.title       as module_title,
      m.order_index as module_order,
      l.slug        as lesson_slug,
      l.title       as lesson_title,
      l.language,
      l.lesson_group_id,
      l.order_index as lesson_order,
      l.estimated_minutes
    from public.lessons l
    join public.modules m        on m.id = l.module_id
    join public.certifications c on c.id = m.certification_id
    where c.code = 'AISM-I'
  $ddl$;

  execute $ddl$
    comment on view mcp.lesson_index is
      'mcp.lesson without content_md. A catalogue, readable by mcp_reader, so a partner can see what exists before holding a key. The body stays with mcp_holder.'
  $ddl$;

  execute 'revoke all on mcp.lesson_index from public';
  execute 'grant select on mcp.lesson_index to mcp_reader, mcp_holder';

  -- ------------------------------------------------------------ the holder

  execute 'alter role mcp_holder login';

  execute $ddl$
    comment on role mcp_holder is
      'Courseware MCP, holder tier. LOGIN since 322: the second pool in courseware-read connects as this role. Reads everything mcp_reader reads, plus lesson bodies.'
  $ddl$;

  -- Telemetry from the holder pool goes through the same definer function, so
  -- the holder needs EXECUTE on it too. 317 granted it to mcp_reader only.
  execute $ddl$
    grant execute on function mcp.log_request(
      text, text, text, text, int, text, text, text, int, int, int, int, int, text, text, text, text
    ) to mcp_holder
  $ddl$;

  -- ------------------------------------------------------------- the scope

  execute 'alter table public.issuer_api_keys drop constraint if exists issuer_api_keys_scope_vocab';
  execute $ddl$
    alter table public.issuer_api_keys
      add constraint issuer_api_keys_scope_vocab
      check (scopes <@ array['credentials:issue', 'courseware:lessons']::text[])
  $ddl$;

  -- ============ PROVEN BY DOING, NOT BY READING pg_catalog ============
  --
  -- 317 asserted six things about grants and owners, all correctly, and shipped
  -- two defects. Every check it made read the catalogue; none exercised the
  -- path. So these attempt the reads.

  execute format('grant mcp_holder to %I with set true', current_user);
  execute format('grant mcp_reader to %I with set true', current_user);

  -- The holder CAN read a lesson body.
  execute 'set local role mcp_holder';
  select count(*) into n from mcp.lesson;
  execute 'reset role';
  if n < 1 then
    raise exception 'mcp_holder read no lesson rows'
      using hint = 'the grant exists but the read returns nothing';
  end if;

  -- The reader CAN read the index.
  execute 'set local role mcp_reader';
  select count(*) into n from mcp.lesson_index;
  execute 'reset role';
  if n < 1 then
    raise exception 'mcp_reader read no lesson_index rows';
  end if;

  -- AND THE READER CANNOT READ A BODY. Attempted, not inferred: a SELECT is not
  -- destructive, so the check and the damage are not the same action. The
  -- exception handler opens a subtransaction, so a refusal rolls back to here
  -- rather than aborting the migration.
  begin
    execute 'set local role mcp_reader';
    execute 'select 1 from mcp.lesson limit 1';
    execute 'reset role';
  exception when insufficient_privilege then
    blocked := true;
  end;
  execute 'reset role';

  if not blocked then
    raise exception 'mcp_reader can read lesson bodies'
      using hint = 'the paywall is open; nothing is committed';
  end if;

  raise notice 'holder reads bodies, reader reads the index and is refused the body';
end
$mig$;

-- ===================== AFTER THIS, SET THE PASSWORD =====================
--
--   node scripts/scram-verifier.mjs --role mcp_holder
--
-- then, as a single statement in the editor:
--
--   alter role mcp_holder password 'SCRAM-SHA-256$4096:....';
--
-- and store the plaintext where it is used and nowhere else:
--
--   supabase secrets set MCP_HOLDER_PASSWORD='...'
--
-- ===================== VERIFICATION =====================
--
-- 1. THE SPLIT. Expect mcp_reader f on lesson and t on lesson_index;
--    mcp_holder t on both.
--
-- select r as role,
--        has_table_privilege(r, 'mcp.lesson', 'SELECT')       as body,
--        has_table_privilege(r, 'mcp.lesson_index', 'SELECT') as index
--   from unnest(array['mcp_reader','mcp_holder','anon','authenticated']) r;
--
-- 2. THE INDEX CANNOT LEAK A BODY -- it does not project the column. Expect 0.
--
-- select count(*) from information_schema.columns
--  where table_schema = 'mcp' and table_name = 'lesson_index'
--    and column_name = 'content_md';
--
-- 3. LOGIN is on the holder and the password exists. Expect t, t.
--    Reads whether a verifier is set, never what it is.
--
-- select rolcanlogin,
--        (select rolpassword is not null from pg_authid where rolname = 'mcp_holder') as has_password
--   from pg_roles where rolname = 'mcp_holder';
--
-- 4. THE SCOPE VOCABULARY. Expect one row, and a bad scope to be refused.
--
-- select conname, pg_get_constraintdef(oid) from pg_constraint
--  where conrelid = 'public.issuer_api_keys'::regclass
--    and conname = 'issuer_api_keys_scope_vocab';
