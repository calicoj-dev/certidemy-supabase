-- 321_mcp_requests_status_driven_resource.sql
--
-- 320 normalised `resource` on VALIDITY and it should have been on OUTCOME.
--
-- The rule was: if the requested resource is not one we accept, store
-- 'rejected'. So `{"resource":"syllabus"}` became 'rejected' and
-- `{"resource":"task","code":"1.1"}` stayed 'task' -- with status 400. Measured
-- after the redeploy:
--
--   resource=rejected  requested=task  400  x4   (relabelled by 320)
--   resource=task      requested=task  400  x5   (written since)
--
-- So `count(*) where resource = 'task'` returns 25 of which FIVE SERVED NOTHING,
-- and every query has to remember to filter on status as well. A column that is
-- only correct when combined with another column is a column that will be read
-- wrongly.
--
-- ===================== THE RULE, AND WHY IT IS THREE VALUES =====================
--
--   resource            WHAT WAS SERVED, or why nothing was
--   requested_resource  WHAT WAS ASKED, always, whatever it was
--
--     status 200  -> the resource actually served
--     status 400  -> 'rejected'   the caller asked wrongly
--     status 5xx  -> 'failed'     we broke
--
-- A 400 AND A 500 ARE NOT THE SAME EVENT AND MUST NOT SHARE A LABEL. One is the
-- caller's fault and is feedback about the interface; the other is ours and is a
-- defect. Collapsing them here would repeat, in the table, precisely the mistake
-- just fixed in the Worker -- where 400, 500 and an unreachable host arrived as
-- one message and cost two investigations before anyone noticed. The table must
-- not re-merge what that fix separated.
--
-- Nothing is lost by moving the resource name off a failed row: requested_resource
-- holds it, so "which resource do callers get wrong most" is still answerable,
-- and "how many task reads succeeded" is now answerable WITHOUT a second
-- predicate.
--
-- ===================== THE CLASSIFICATION IS PROVEN, NOT ASSERTED =====================
--
-- 317 asserted that grants existed and never exercised a write, and two defects
-- survived it. 319 fixed that by performing the write. This does the same: after
-- replacing the function it CALLS IT three times -- once per status class -- and
-- checks the row it produced, then removes the probes. A CHECK constraint that
-- permits 'failed' proves nothing about whether anything ever stores it.
--
-- Editor-first, ONE STATEMENT.

do $mig$
declare
  n_400    bigint;
  n_500    bigint;
  got      record;
  marker   text := '321 classification probe';
begin
  -- ------------------------------------------------------------- the category
  execute 'alter table public.mcp_requests drop constraint if exists mcp_requests_resource_check';
  execute $ddl$
    alter table public.mcp_requests
      add constraint mcp_requests_resource_check
      check (resource in ('certification','task','concept','search','log','rejected','failed'))
  $ddl$;

  -- ------------------------------------------------------- outcome, not validity
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
        case
          when p_status >= 500 then 'failed'
          when p_status <> 200 then 'rejected'
          when p_resource in ('certification','task','concept','search','log') then p_resource
          -- A 200 naming a resource we do not accept should be impossible:
          -- validateArgs ran. Classed as rejected rather than allowed to violate
          -- the CHECK, because an insert that raises would lose the row entirely.
          else 'rejected'
        end,
        left(p_resource, 40),
        p_tool, p_language, left(p_query_text, 400), p_query_len,
        left(p_slug, 200), left(p_task_code, 20), left(p_domain_code, 10), p_limit,
        p_contract_version, p_status, p_rows, p_duration_ms, left(p_error, 500),
        left(p_refused_certification, 40), left(p_caller_hash, 128),
        left(p_client_name, 80)
      );
    $body$
  $ddl$;

  -- --------------------------------------------------------------- backfill
  -- requested_resource is preserved where it exists and recovered from the error
  -- text where it does not. Null stays null: a guess is worse than an absence.
  update public.mcp_requests
     set requested_resource = coalesce(
           requested_resource,
           substring(error from 'for resource ''([a-z]+)''')
         ),
         resource = case when status >= 500 then 'failed' else 'rejected' end
   where status <> 200
     and resource not in ('rejected','failed');
  get diagnostics n_400 = row_count;
  raise notice 'reclassified % row(s) that named a resource while serving nothing', n_400;

  -- ------------------------------------------------- prove the classification
  execute format('grant mcp_reader to %I with set true', current_user);
  execute 'set local role mcp_reader';
  perform mcp.log_request('task', null, 'en', null, null, null, null, null, null, null,
                          400, null, 0, marker, null, null, null);
  perform mcp.log_request('task', null, 'en', null, null, null, null, null, null, null,
                          500, null, 0, marker, null, null, null);
  perform mcp.log_request('task', null, 'en', null, null, null, null, null, null, null,
                          200, 1, 0, marker, null, null, null);
  execute 'reset role';

  select
    count(*) filter (where status = 400 and resource = 'rejected' and requested_resource = 'task') as r400,
    count(*) filter (where status = 500 and resource = 'failed'   and requested_resource = 'task') as r500,
    count(*) filter (where status = 200 and resource = 'task'     and requested_resource = 'task') as r200,
    count(*) as total
  into got
  from public.mcp_requests where error = marker;

  if got.total <> 3 or got.r400 <> 1 or got.r500 <> 1 or got.r200 <> 1 then
    raise exception 'classification is wrong'
      using detail = format('total %s, 400->rejected %s, 500->failed %s, 200->task %s',
                            got.total, got.r400, got.r500, got.r200),
            hint   = 'log_request did not classify by outcome';
  end if;

  delete from public.mcp_requests where error = marker;

  -- ------------------------------------------------------------- assertions
  if exists (select 1 from public.mcp_requests
              where status <> 200
                and resource in ('certification','task','concept','search','log')) then
    raise exception 'a row that served nothing still names a resource';
  end if;

  if exists (select 1 from public.mcp_requests
              where status = 200 and resource in ('rejected','failed')) then
    raise exception 'a successful row is labelled as a failure';
  end if;

  select count(*) into n_500 from public.mcp_requests where status >= 500 and resource <> 'failed';
  if n_500 <> 0 then
    raise exception 'a 5xx row is not labelled failed' using detail = n_500::text;
  end if;

  raise notice 'resource is now what was served; requested_resource is what was asked';
end
$mig$;

-- ===================== VERIFICATION =====================
--
-- 1. THE QUESTION THAT WAS WRONG. Expect every count to be successful reads
--    only, with no status filter anywhere in the query.
--
-- select resource, count(*) from public.mcp_requests group by 1 order by 2 desc;
--
-- 2. AND THE TWO FAILURE KINDS, SEPARATE. Expect 'rejected' and 'failed' to be
--    distinguishable; if they ever merge, the Worker's collapse has reappeared
--    here.
--
-- select resource, requested_resource, error, count(*)
--   from public.mcp_requests
--  where resource in ('rejected','failed')
--  group by 1,2,3 order by 4 desc;
--
-- 3. NO ROW BOTH SERVED AND FAILED. Expect 0 from each.
--
-- select
--   (select count(*) from public.mcp_requests
--     where status <> 200 and resource in ('certification','task','concept','search','log')) as served_but_failed,
--   (select count(*) from public.mcp_requests
--     where status = 200 and resource in ('rejected','failed')) as failed_but_served;
--
-- 4. The probe rows were removed. Expect 0.
--
-- select count(*) from public.mcp_requests where error = '321 classification probe';
