-- 324_mcp_requests_lesson_resources.sql
--
-- mcp.log_request does not know the lesson resources exist, so every successful
-- lesson read has been filed as a REJECTION.
--
-- ===================== MEASURED, NOT SUSPECTED =====================
--
-- select resource, requested_resource, status, count(*)
--   from public.mcp_requests group by 1,2,3;
--
--   resource   requested_resource  status  n
--   rejected   lesson_index        200     3
--   rejected   lesson              200     2
--
-- FIVE ROWS THAT SERVED A CATALOGUE OR A BODY AND ARE RECORDED AS REFUSALS.
--
-- ===================== HOW =====================
--
-- 321 classifies by outcome, and its 200 branch is an ALLOWLIST:
--
--   when p_status <> 200 then 'rejected'
--   when p_resource in ('certification','task','concept','search','log')
--        then p_resource
--   else 'rejected'          -- every lesson 200 lands here
--
-- The `else` exists so an unexpected resource cannot violate the CHECK and lose
-- the row entirely, which was the right call: a mislabelled row beats no row.
-- But it converts "this list is out of date" into a silent relabel, and the
-- list went out of date the moment 322 added lesson and lesson_index.
--
-- SO THE GUARD THAT PROTECTED THE INSERT IS WHAT HID THE DEFECT. 321's own
-- verification asserts that `status = 200 and resource in ('rejected','failed')`
-- must be zero. It was, when 321 ran. Nothing re-ran it afterwards, and a
-- one-shot invariant is a measurement rather than a guard.
--
-- ===================== WHY IT IS MORE THAN A LABEL =====================
--
-- The lesson resources are the PAID ones. "How many lesson bodies were served,
-- and to whom" is the commercial question this table exists to answer, and it
-- currently answers zero -- while `resource = 'rejected'` reports five refusals
-- that never happened. Both numbers are wrong in opposite directions, which is
-- the shape that gets believed: neither looks anomalous on its own.
--
-- ===================== THE VOCABULARY NOW LIVES IN ONE PLACE =====================
--
-- The CHECK and the CASE listed the same vocabulary twice and drifted together.
-- Both are now built from a single array declared once below, so the next
-- resource is added in one place or not at all.

begin;

do $mig$
declare
  -- ONE LIST. The CHECK and the classifier are both generated from it.
  served  text[] := array['certification','task','concept','search','log','lesson','lesson_index'];
  classes text[] := array['certification','task','concept','search','log','lesson','lesson_index','rejected','failed'];
  n_fixed int;
  n_bad   int;
begin
  -- ------------------------------------------------------------- the CHECK

  execute 'alter table public.mcp_requests drop constraint if exists mcp_requests_resource_check';
  execute format(
    'alter table public.mcp_requests add constraint mcp_requests_resource_check check (resource = any (%L::text[]))',
    classes
  );

  -- -------------------------------------------------------- the classifier
  --
  -- One CASE branch changes. Everything else is 321's body verbatim, including
  -- the `else 'rejected'` backstop, which stays: the next unknown resource
  -- should still be recorded rather than dropped.

  execute format($outer$
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
    ) returns void
    language plpgsql
    security definer
    set search_path = ''
    as $body$
      begin
        insert into public.mcp_requests (
          resource, requested_resource, tool, language, query_text, query_len,
          slug, task_code, domain_code, limit_requested, contract_version,
          status, rows_returned, duration_ms, error, refused_certification,
          caller_hash, client_name
        ) values (
          case
            when p_status >= 500 then 'failed'
            when p_status <> 200 then 'rejected'
            when p_resource = any (%L::text[]) then p_resource
            else 'rejected'
          end,
          left(p_resource, 40),
          p_tool, p_language, left(p_query_text, 400), p_query_len,
          left(p_slug, 200), left(p_task_code, 20), left(p_domain_code, 10), p_limit,
          p_contract_version, p_status, p_rows, p_duration_ms, left(p_error, 500),
          left(p_refused_certification, 40), left(p_caller_hash, 128),
          left(p_client_name, 80)
        );
      end;
    $body$
  $outer$, served);

  execute 'alter function mcp.log_request(text, text, text, text, int, text, text, text, int, int, int, int, int, text, text, text, text) owner to mcp_logger';
  execute 'revoke all on function mcp.log_request(text, text, text, text, int, text, text, text, int, int, int, int, int, text, text, text, text) from public';
  execute 'grant execute on function mcp.log_request(text, text, text, text, int, text, text, text, int, int, int, int, int, text, text, text, text) to mcp_reader, mcp_holder';

  -- ------------------------------------------------------------ the repair
  --
  -- Only rows that SERVED and were relabelled. requested_resource holds the
  -- truth, which is exactly why 321 kept that column: the rows are recoverable
  -- rather than merely known to be wrong.

  update public.mcp_requests
     set resource = requested_resource
   where status = 200
     and resource = 'rejected'
     and requested_resource = any (served);
  get diagnostics n_fixed = row_count;

  if n_fixed <> 5 then
    raise notice 'repaired % row(s), not the 5 measured on 2026-09-14', n_fixed;
  end if;

  -- ============ BOTH DIRECTIONS, AND NEITHER IS A COUNT ============
  --
  -- The positive half alone would pass on an update that relabelled every
  -- rejection as whatever it had asked for.

  select count(*) into n_bad from public.mcp_requests
   where status = 200 and resource in ('rejected','failed');
  if n_bad <> 0 then
    raise exception 'still % served row(s) filed as a failure', n_bad;
  end if;

  select count(*) into n_bad from public.mcp_requests
   where status <> 200 and resource = any (served);
  if n_bad <> 0 then
    raise exception 'still % failed row(s) naming a served resource', n_bad;
  end if;

  raise notice 'lesson and lesson_index are servable classes; % row(s) recovered', n_fixed;
end
$mig$;

-- ============ PROVEN BY CALLING IT, NOT BY READING IT ============
--
-- 321 replaced this function and then CALLED it three times, once per status
-- class, because a classifier is behaviour. The same for the two resources that
-- were missing, plus the 403 that 323 introduces -- then it deletes exactly what
-- it wrote and proves the count is unchanged.

do $mig$
declare
  before_n int;
  got      text;
begin
  select count(*) into before_n from public.mcp_requests;

  perform mcp.log_request('lesson', 'get_lesson', 'en', null, null, null, null, null,
                          null, null, 200, 1, 1, null, null, 'probe-324', 'probe');
  select resource into got from public.mcp_requests
   where caller_hash = 'probe-324' and requested_resource = 'lesson' and status = 200;
  if got is distinct from 'lesson' then
    raise exception 'a served lesson classified as %', coalesce(got, 'nothing');
  end if;

  perform mcp.log_request('lesson_index', 'list_lessons', 'en', null, null, null, null, null,
                          null, null, 200, 3, 1, null, null, 'probe-324', 'probe');
  select resource into got from public.mcp_requests
   where caller_hash = 'probe-324' and requested_resource = 'lesson_index';
  if got is distinct from 'lesson_index' then
    raise exception 'a served lesson_index classified as %', coalesce(got, 'nothing');
  end if;

  -- AND A REFUSAL ON THE PAID RESOURCE IS STILL A REFUSAL. 401 and 403 are new
  -- statuses on this path as of 323; they must land in 'rejected' rather than
  -- become a served lesson now that 'lesson' is an accepted class.
  perform mcp.log_request('lesson', 'get_lesson', 'en', null, null, null, null, null,
                          null, null, 403, null, 1, 'scope', null, 'probe-324', 'probe');
  select resource into got from public.mcp_requests
   where caller_hash = 'probe-324' and status = 403;
  if got is distinct from 'rejected' then
    raise exception 'a 403 classified as %', coalesce(got, 'nothing');
  end if;

  delete from public.mcp_requests where caller_hash = 'probe-324';
  if (select count(*) from public.mcp_requests) <> before_n then
    raise exception 'the probe did not clean up after itself';
  end if;

  raise notice 'lesson 200 to lesson, lesson_index 200 to lesson_index, lesson 403 to rejected';
end
$mig$;

commit;

-- ===================== VERIFICATION =====================
--
-- 1. BOTH DIRECTIONS. Expect 0, 0.
--
-- select
--   (select count(*) from public.mcp_requests
--     where status = 200 and resource in ('rejected','failed')) as served_but_failed,
--   (select count(*) from public.mcp_requests
--     where status <> 200
--       and resource in ('certification','task','concept','search','log','lesson','lesson_index'))
--     as failed_but_served;
--
-- 2. THE PAID READS ARE COUNTABLE. Expect lesson 2, lesson_index 3 before any
--    new traffic reaches the deployed function.
--
-- select resource, count(*) from public.mcp_requests
--  where resource in ('lesson','lesson_index') group by 1;
