-- 341_ksa_functions_security_definer.sql
--
-- HOTFIX. 339 took `explain_task` down in Spanish and Portuguese.
--
-- ============ WHAT BROKE ============
--
-- 339 rebuilt `mcp.task` so its non-English branch calls
-- `public.task_ksa_is_withheld(tt.id)`, which reads `public.task_translations`
-- and `public.task_translation_reviews`.
--
-- The VIEW is not `security_invoker`, so tables it queries DIRECTLY are checked
-- as the view owner. A function called inside it is not: without
-- `SECURITY DEFINER`, the function body executes with the CALLER's privileges,
-- and `mcp_reader` and `mcp_holder` have no grant on either table.
--
-- Result, measured against the deployed endpoint:
--
--   task / en        HTTP 200    (that branch has `false as ksa_withheld`,
--                                 no function call, so it never broke)
--   task / es-419    HTTP 500  "read failed"
--   task / pt-BR     HTTP 500  "read failed"
--   certification, concept, search, lesson   HTTP 200
--
-- So every blueprint read in both translated languages failed -- which is the
-- exact surface a partner's agent uses -- while English kept working, which is
-- why it looked healthy from the side anyone would check first.
--
-- ============ AND 339's POST-CONDITIONS PASSED ============
--
-- They ran inside the migration, as the migration's role, which can read
-- everything. They asserted "mcp.task serves 49 es-419 knowledge fields" and it
-- did -- for a superuser. Nothing asked whether `mcp_reader` could read it.
--
-- CLAUDE.md records this exact failure against 329 and 330: "RUN THE CHECK AS
-- THE PARTY THE PROPERTY IS ABOUT", after `mcp.resolve_oauth_caller` was granted
-- to a role that never calls it and the post-conditions passed while the path
-- could not run. 339 is the same mistake with a different object, and the
-- post-conditions below are the corrected form: they `set local role` and ask as
-- the role.
--
-- ============ THE FIX ============
--
-- `task_ksa_is_withheld` and `task_ksa_en_hash` become SECURITY DEFINER, keeping
-- `search_path = ''`. `ksa_en_hash(text,text,text)` stays as it is: it touches no
-- table and needs no elevated rights.
--
-- EXECUTE is revoked from PUBLIC and granted explicitly. A SECURITY DEFINER
-- function that anyone may call is a way to read a table they were not granted,
-- and the two here are narrow -- a boolean and an 8-character hash -- but narrow
-- is not the same as harmless.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  n      int;
  n_es   int;
  n_pt   int;
  n_en   int;
begin

  -- ------------------------------------------------- pre-conditions
  select count(*) into n
    from information_schema.columns
   where table_schema = 'mcp' and table_name = 'task' and column_name = 'ksa_withheld';
  if n <> 1 then
    raise exception 'mcp.task has no ksa_withheld column; 338 has not run';
  end if;

  select count(*) into n from public.task_translation_reviews;
  if n <> 98 then
    raise exception 'task_translation_reviews holds % row(s), expected 98 from 339', n;
  end if;

  -- ------------------------------------------------- the functions
  create or replace function public.task_ksa_en_hash(p_task_id uuid)
  returns text
  language sql
  stable
  security definer
  set search_path = ''
  as $fn$
    select public.ksa_en_hash(t.knowledge, t.skills, t.abilities)
      from public.tasks t
     where t.id = p_task_id
  $fn$;

  create or replace function public.task_ksa_is_withheld(p_tt_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = ''
  as $fn$
    select tt.ksa_is_provisional
       and not exists (
         select 1
           from public.task_translation_reviews r
          where r.task_translation_id = tt.id
            and r.verdict = 'approved'
            and r.en_hash = public.task_ksa_en_hash(tt.task_id)
       )
      from public.task_translations tt
     where tt.id = p_tt_id
  $fn$;

  comment on function public.task_ksa_is_withheld(uuid) is
    'SECURITY DEFINER because mcp.task calls it and mcp_reader has no grant on task_translations. 339 omitted that and every non-English blueprint read returned 500 until 341.';

  -- ------------------------------------------------- the grants
  --
  -- Narrow is not harmless: a definer function anyone may call is a way to read
  -- a table they were not granted.
  revoke all on function public.task_ksa_en_hash(uuid) from public;
  revoke all on function public.task_ksa_is_withheld(uuid) from public;
  grant execute on function public.task_ksa_en_hash(uuid) to mcp_reader, mcp_holder, service_role;
  grant execute on function public.task_ksa_is_withheld(uuid) to mcp_reader, mcp_holder, service_role;

  -- ===================== POST-CONDITIONS =====================
  --
  -- AS THE ROLE. This is the whole point of the migration: 339's checks passed
  -- as a superuser while the path was dead for everyone who actually uses it.

  -- 1. AS mcp_reader, the non-English blueprint must be readable AT ALL. Under
  --    339 this raised 42501 and the function answered 500.
  execute 'set local role mcp_reader';
  select count(*) into n from mcp.task where language <> 'en';
  execute 'reset role';
  if n < 900 then
    raise exception 'mcp_reader sees only % non-English task row(s)', n
      using hint = 'Expected ~1016. The definer change did not take.';
  end if;
  raise notice 'ok: mcp_reader reads % non-English task row(s)', n;

  -- 2. AS mcp_reader, ISMS-F's reviewed KSAs are actually served, and the
  --    certifications that were NOT reviewed are still dark. Both halves, as
  --    the role, because 339 proved neither.
  execute 'set local role mcp_reader';
  select count(*) filter (where language = 'es-419' and btrim(coalesce(knowledge, '')) <> ''),
         count(*) filter (where language = 'pt-BR'  and btrim(coalesce(knowledge, '')) <> '')
    into n_es, n_pt
    from mcp.task where certification = 'ISMS-F' and language <> 'en';
  select count(*) into n
    from mcp.task
   where language <> 'en'
     and certification in ('AIMS-F', 'SM-AI-II', 'AIMS-IA', 'ISMS-IA')
     and btrim(coalesce(knowledge, '')) <> '';
  execute 'reset role';
  if n_es < 49 or n_pt < 49 then
    raise exception 'ISMS-F serves % es-419 and % pt-BR knowledge field(s) to mcp_reader, expected 49 each',
      n_es, n_pt;
  end if;
  if n <> 0 then
    raise exception '% KSA field(s) on an unreviewed certification are reachable by mcp_reader', n;
  end if;
  raise notice 'ok: ISMS-F serves % es / % pt KSA field(s); unreviewed certifications still dark', n_es, n_pt;

  -- 3. AS mcp_holder, the same, since it is the role that reads lesson bodies
  --    and would hit the identical function.
  execute 'set local role mcp_holder';
  select count(*) into n_en from mcp.task where language = 'en';
  execute 'reset role';
  if n_en < 400 then
    raise exception 'mcp_holder sees only % English task row(s)', n_en;
  end if;

  -- 4. AND THE PAYWALL IS UNTOUCHED.
  if has_table_privilege('mcp_reader', 'mcp.lesson', 'SELECT') then
    raise exception 'mcp_reader can select mcp.lesson -- the paywall is open';
  end if;

  raise notice '341 ok: non-English blueprint readable as mcp_reader again';
end
$mig$;
