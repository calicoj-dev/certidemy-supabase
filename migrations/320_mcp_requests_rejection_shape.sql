-- 320_mcp_requests_rejection_shape.sql
--
-- A rejected request was recorded under the WRONG RESOURCE, which made the
-- telemetry unreadable in exactly the place it was meant to be most useful.
--
-- courseware-read logs with `args?.resource ?? 'log'`. On a rejection
-- validateArgs has thrown, so `args` is null and the fallback fires -- and EVERY
-- rejection, whatever was asked for, was stored as resource = 'log'. Seven
-- deliberate vocabulary-pin refusals from smoke-courseware section C therefore
-- read as seven failed calls to the log resource.
--
-- THE REASON WAS NEVER MISSING. `error` held it the whole time:
--   "unknown field 'certification' for resource 'task'"
--   "resource must be one of: certification, task, concept, search, log"
-- The row was legible and mislabelled, which is worse than illegible: it
-- answered a question nobody asked and looked like an answer to one they did.
--
-- A DEFAULT THAT NAMES A REAL CATEGORY IS A LIE. 'log' is a resource the caller
-- may genuinely have asked for, so the fallback was indistinguishable from the
-- truth. That is the difference between a null and a wrong value, and it is the
-- same family as every silent-success defect in this repo.
--
-- ===================== WHAT CHANGES =====================
--
--   resource gains 'rejected'   -- an explicit category, distinguishable from
--                                  every real one, that cannot be mistaken for
--                                  a request that succeeded
--   requested_resource          -- UNCONSTRAINED text holding what the caller
--                                  actually asked for, including values the
--                                  CHECK forbids
--
-- The second is the point. "Callers keep sending resource=syllabus" is precisely
-- the signal this table exists to produce, and it cannot be stored in a column
-- constrained to the values we accept. A rejected vocabulary is only visible if
-- the rejected word is kept.
--
-- Editor-first, ONE STATEMENT.

do $mig$
declare
  mislabelled bigint;
begin
  -- ------------------------------------------------------------ the columns
  execute 'alter table public.mcp_requests add column if not exists requested_resource text';

  execute 'alter table public.mcp_requests drop constraint if exists mcp_requests_resource_check';
  execute $ddl$
    alter table public.mcp_requests
      add constraint mcp_requests_resource_check
      check (resource in ('certification', 'task', 'concept', 'search', 'log', 'rejected'))
  $ddl$;

  execute $ddl$
    comment on column public.mcp_requests.requested_resource is
      'What the caller actually asked for, unconstrained, including values the resource CHECK forbids. A rejected vocabulary is only visible if the rejected word is kept.'
  $ddl$;

  -- --------------------------------------- the function classifies, not the caller
  --
  -- SAME SIGNATURE, so this is a true CREATE OR REPLACE: the owner (mcp_logger)
  -- and the EXECUTE grant to mcp_reader survive untouched. Adding an 18th
  -- parameter would have created a second function instead of replacing this
  -- one, and re-owning it would have needed the CREATE-on-schema dance 317 paid
  -- for twice.
  --
  -- p_resource now carries WHAT WAS ASKED FOR, and the normalisation lives here,
  -- beside the CHECK that enforces it -- one classification rather than two that
  -- can disagree across a repository boundary.
  execute $ddl$
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
    as $body$
      insert into public.mcp_requests (
        resource, requested_resource, tool, language, query_text, query_len,
        slug, task_code, domain_code, limit_requested, contract_version,
        status, rows_returned, duration_ms, error, refused_certification,
        caller_hash, client_name
      ) values (
        case when p_resource in ('certification','task','concept','search','log')
             then p_resource else 'rejected' end,
        left(p_resource, 40),
        p_tool, p_language, left(p_query_text, 400), p_query_len,
        left(p_slug, 200), left(p_task_code, 20), left(p_domain_code, 10), p_limit,
        p_contract_version, p_status, p_rows, p_duration_ms, left(p_error, 500),
        left(p_refused_certification, 40), left(p_caller_hash, 128),
        left(p_client_name, 80)
      );
    $body$
  $ddl$;

  -- ---------------------------------------------- relabel what is already here
  --
  -- Every existing row with status <> 200 and resource = 'log' is a rejection
  -- that never reached the log resource: the log branch runs only AFTER
  -- validateArgs succeeds, so a real log call cannot be a 400. Relabelling them
  -- is not rewriting history, it is removing a label history never had.
  --
  -- The requested resource is recovered from the error text where it names one,
  -- and left null where it does not -- null being the honest answer rather than
  -- a guess.
  update public.mcp_requests
     set resource = 'rejected',
         requested_resource = coalesce(
           requested_resource,
           substring(error from 'for resource ''([a-z]+)''')
         )
   where status <> 200
     and resource = 'log';

  get diagnostics mislabelled = row_count;
  raise notice 'relabelled % mislabelled rejection row(s)', mislabelled;

  -- ------------------------------------------------------------- assertions
  if exists (select 1 from public.mcp_requests where status <> 200 and resource = 'log') then
    raise exception 'a rejection is still labelled as the log resource'
      using hint = 'the relabel missed rows';
  end if;

  -- The inverse, which is a different claim: a REJECTION that succeeded is
  -- incoherent, and would mean the normalisation is firing on accepted requests.
  if exists (select 1 from public.mcp_requests where resource = 'rejected' and status = 200) then
    raise exception 'a rejected row carries status 200'
      using hint = 'log_request normalised a resource that was actually accepted';
  end if;
end
$mig$;

-- ===================== VERIFICATION =====================
--
-- 1. THE SHAPE. Expect requested_resource present and nullable, and the CHECK
--    listing six values including 'rejected'.
--
-- select column_name, data_type, is_nullable
--   from information_schema.columns
--  where table_schema = 'public' and table_name = 'mcp_requests'
--    and column_name = 'requested_resource';
--
-- select pg_get_constraintdef(oid) from pg_constraint
--  where conrelid = 'public.mcp_requests'::regclass
--    and conname = 'mcp_requests_resource_check';
--
-- 2. NOTHING IS LABELLED 'log' UNLESS IT SUCCEEDED. Expect 0.
--
-- select count(*) as mislabelled from public.mcp_requests
--  where resource = 'log' and status <> 200;
--
-- 3. WHAT CALLERS ACTUALLY GET WRONG -- the question the table now answers.
--
-- select requested_resource, error, count(*), max(at) as last_seen
--   from public.mcp_requests
--  where resource = 'rejected'
--  group by 1, 2
--  order by 3 desc;
--
-- 4. AND THE ONE THAT WAS THE POINT. Empty until a partner asks for a
--    certification we do not serve; a row here is the commercially interesting
--    event, not an anonymous 400.
--
-- select refused_certification, tool, count(*), max(at) as last_seen
--   from public.mcp_requests
--  where refused_certification is not null
--  group by 1, 2
--  order by 3 desc;
