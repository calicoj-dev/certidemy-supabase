-- 235_webhook_dispatch.sql
--
-- The delivery half of migration 232. issue-partner-credential queues rows into
-- webhook_deliveries and nothing reads them; this is what reads them.
--
-- ============================ WHY A TABLE AND NOT pgmq ====================
--
-- Supabase Queues (pgmq) exists and is the right tool for a pure queue. This is
-- not a pure queue:
--
--   - webhook_deliveries is ALSO the audit log. A queue archives or deletes;
--     "what did we send this partner, when, and what did they return" has to be
--     answerable in a year, because that is the thing a partner disputes.
--   - retry policy is custom logic either way. pgmq does not supply backoff.
--   - the columns already exist and are already written to.
--
-- What pgmq would add is a visibility timeout so two workers cannot claim the
-- same message. FOR UPDATE SKIP LOCKED below is that, in one line.
--
-- This holds to roughly thousands of deliveries per minute. Past that, raise
-- the batch size and the cron frequency; past THAT, move to pgmq or a
-- dedicated delivery service. The ceiling moves rather than arrives.
--
-- ============================ WHY A SHARED SECRET, NOT A JWT =============
--
-- The documented pg_cron -> Edge Function pattern stores an auth token in
-- Vault. Minting a real JWT from SQL is currently awkward: the static
-- service_role key is no longer issued by the CLI, pgjwt is deprecated in
-- Postgres 17, and pgsodium is not recommended for new use.
--
-- So dispatch-webhooks runs with verify_jwt = false and checks a shared secret
-- header instead. BOTH SIDES READ IT FROM VAULT -- the cron job to send it, the
-- function to compare it -- so the secret exists in exactly one place and never
-- in an env var, a config file or a deploy command.
--
-- ============================ SIGNING ====================================
--
-- Each webhook has its own HMAC secret. The receiver verifies
-- x-certidemy-signature: sha256=<hmac over the raw body>, which is the shape
-- Stripe and GitHub use, so any partner's developer already knows what to do
-- with it. Without a signature a webhook endpoint is an open POST target that
-- will eventually be fed a forged credential.issued.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).

begin;

-- ============================================================ 1. sending
-- A claimed row is neither pending nor finished. Without this state two
-- overlapping cron runs both see 'pending' and both deliver.
alter table public.webhook_deliveries drop constraint if exists webhook_deliveries_status_vocab;
alter table public.webhook_deliveries add constraint webhook_deliveries_status_vocab
  check (status in ('pending','sending','delivered','failed','abandoned'));

alter table public.webhook_deliveries
  add column if not exists claimed_at timestamptz;

-- A row stuck in 'sending' means a dispatcher died mid-flight. Reclaimed after
-- 5 minutes rather than stranded forever.
create index if not exists webhook_deliveries_stuck_idx
  on public.webhook_deliveries(claimed_at) where status = 'sending';

-- ============================================================ 2. claim
-- SKIP LOCKED is the whole concurrency story: two dispatchers running at once
-- take disjoint sets and neither waits.
create or replace function public.claim_webhook_deliveries(p_limit integer default 25)
returns table (
  delivery_id  uuid,
  webhook_id   uuid,
  event        text,
  payload      jsonb,
  attempts     integer,
  url          text,
  secret_id    uuid
)
language plpgsql
security definer
set search_path = public
as $function$
begin
  return query
  with due as (
    select d.id
    from public.webhook_deliveries d
    join public.issuer_webhooks w on w.id = d.webhook_id
    where w.is_active
      and (
        (d.status = 'pending' and coalesce(d.next_retry_at, now()) <= now())
        -- reclaim anything a dead dispatcher left behind
        or (d.status = 'sending' and d.claimed_at < now() - interval '5 minutes')
      )
    order by coalesce(d.next_retry_at, d.created_at)
    limit p_limit
    for update of d skip locked
  )
  update public.webhook_deliveries d
  set status = 'sending', claimed_at = now()
  from due, public.issuer_webhooks w
  where d.id = due.id and w.id = d.webhook_id
  returning d.id, d.webhook_id, d.event, d.payload, d.attempts, w.url, w.secret_id;
end;
$function$;

revoke all on function public.claim_webhook_deliveries(integer) from public, anon, authenticated;
grant execute on function public.claim_webhook_deliveries(integer) to service_role;

-- ============================================================ 3. complete
-- Backoff: 1m, 5m, 30m, 2h, 12h, then abandoned. A permanently dead endpoint
-- stops being retried; issuer_webhooks.failure_count and disabled_at exist so a
-- partner who deletes their receiver does not generate traffic forever.
create or replace function public.complete_webhook_delivery(
  p_delivery_id   uuid,
  p_ok            boolean,
  p_response_code integer default null,
  p_error         text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_attempts integer;
  v_webhook  uuid;
  v_status   text;
  v_delay    interval;
begin
  select attempts + 1, webhook_id into v_attempts, v_webhook
  from public.webhook_deliveries where id = p_delivery_id;

  if v_attempts is null then
    raise exception 'no webhook delivery %', p_delivery_id;
  end if;

  if p_ok then
    update public.webhook_deliveries
    set status = 'delivered', attempts = v_attempts, response_code = p_response_code,
        last_error = null, next_retry_at = null, delivered_at = now(), claimed_at = null
    where id = p_delivery_id;

    update public.issuer_webhooks
    set failure_count = 0, updated_at = now()
    where id = v_webhook;

    return 'delivered';
  end if;

  v_delay := case v_attempts
    when 1 then interval '1 minute'
    when 2 then interval '5 minutes'
    when 3 then interval '30 minutes'
    when 4 then interval '2 hours'
    when 5 then interval '12 hours'
    else null
  end;

  v_status := case when v_delay is null then 'abandoned' else 'pending' end;

  update public.webhook_deliveries
  set status = v_status, attempts = v_attempts, response_code = p_response_code,
      last_error = left(coalesce(p_error, 'no response'), 2000),
      next_retry_at = case when v_delay is null then null else now() + v_delay end,
      claimed_at = null
  where id = p_delivery_id;

  update public.issuer_webhooks
  set failure_count = failure_count + 1,
      -- 20 consecutive failures is an endpoint that is gone, not flaky.
      disabled_at = case when failure_count + 1 >= 20 then now() else disabled_at end,
      is_active   = case when failure_count + 1 >= 20 then false else is_active end,
      updated_at  = now()
  where id = v_webhook;

  return v_status;
end;
$function$;

revoke all on function public.complete_webhook_delivery(uuid, boolean, integer, text) from public, anon, authenticated;
grant execute on function public.complete_webhook_delivery(uuid, boolean, integer, text) to service_role;

-- ============================================================ 4. secrets
-- Same pattern as issuer_store_key (185): Vault holds the value, the table
-- holds a pointer, and one narrow reader returns exactly one secret.

create or replace function public.issuer_webhook_upsert(
  p_issuer_id uuid,
  p_url       text,
  p_secret    text,
  p_events    text[] default array['credential.issued']
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'vault'
as $function$
declare
  v_id        uuid;
  v_secret_id uuid;
begin
  if p_url not like 'https://%' then
    raise exception 'webhook url must be https';
  end if;

  select id, secret_id into v_id, v_secret_id
  from public.issuer_webhooks
  where issuer_id = p_issuer_id and url = p_url;

  if v_secret_id is not null then
    perform vault.update_secret(v_secret_id, p_secret);
  else
    v_secret_id := vault.create_secret(
      p_secret,
      'webhook:' || p_issuer_id::text || ':' || md5(p_url),
      'Certidemy outbound webhook signing secret'
    );
  end if;

  if v_id is null then
    insert into public.issuer_webhooks (issuer_id, url, secret_id, events)
    values (p_issuer_id, p_url, v_secret_id, p_events)
    returning id into v_id;
  else
    update public.issuer_webhooks
    set secret_id = v_secret_id, events = p_events, is_active = true,
        failure_count = 0, disabled_at = null, updated_at = now()
    where id = v_id;
  end if;

  return v_id;
end;
$function$;

revoke all on function public.issuer_webhook_upsert(uuid, text, text, text[]) from public, anon, authenticated;
grant execute on function public.issuer_webhook_upsert(uuid, text, text, text[]) to service_role;

create or replace function public.webhook_get_secret(p_secret_id uuid)
returns text
language plpgsql
security definer
set search_path to 'public', 'vault'
as $function$
declare
  v text;
begin
  if p_secret_id is null then
    return null;
  end if;
  select decrypted_secret into v from vault.decrypted_secrets where id = p_secret_id;
  return v;
end;
$function$;

revoke all on function public.webhook_get_secret(uuid) from public, anon, authenticated;
grant execute on function public.webhook_get_secret(uuid) to service_role;

-- ============================================================ 5. dispatch key
-- Created once, read by BOTH the cron job and the edge function. It exists in
-- Vault and nowhere else: not in an env var, not in config.toml, not in a
-- deploy command.
create or replace function public.webhook_dispatch_secret()
returns text
language plpgsql
security definer
set search_path to 'public', 'vault'
as $function$
declare
  v_id  uuid;
  v_val text;
begin
  select id into v_id from vault.secrets where name = 'webhook_dispatch_key';

  if v_id is null then
    -- 256 bits from two gen_random_uuid() calls. NOT gen_random_bytes:
    -- that is pgcrypto, which lives in the `extensions` schema on Supabase and
    -- is therefore invisible under this function's search_path. Migration 185
    -- made the same choice for subject_salt and wrote down the same reason.
    v_val := replace(gen_random_uuid()::text, '-', '') ||
             replace(gen_random_uuid()::text, '-', '');
    perform vault.create_secret(v_val, 'webhook_dispatch_key',
      'Shared secret between the pg_cron dispatcher and dispatch-webhooks');
    return v_val;
  end if;

  select decrypted_secret into v_val from vault.decrypted_secrets where id = v_id;
  return v_val;
end;
$function$;

revoke all on function public.webhook_dispatch_secret() from public, anon, authenticated;
grant execute on function public.webhook_dispatch_secret() to service_role;

-- Create it now so the cron job below has something to read.
select public.webhook_dispatch_secret();

commit;

-- ============================================================ 6. the schedule
-- RUN SEPARATELY, after the transaction above. cron.schedule is not
-- transactional and a rollback would leave a job pointing at functions that
-- do not exist.
--
--   create extension if not exists pg_cron;
--   create extension if not exists pg_net;
--
--   select cron.schedule(
--     'dispatch-webhooks',
--     '* * * * *',
--     $$
--     select net.http_post(
--       url     := 'https://pctynukndxnmnxiqpgck.supabase.co/functions/v1/dispatch-webhooks',
--       headers := jsonb_build_object(
--         'content-type', 'application/json',
--         'x-dispatch-key', public.webhook_dispatch_secret()
--       ),
--       body        := '{}'::jsonb,
--       timeout_milliseconds := 55000
--     );
--     $$
--   );
--
-- Every minute. A webhook arriving up to 60 seconds after issuance is not a
-- product problem; a dispatcher that overlaps itself is, which is what the
-- 55s timeout and SKIP LOCKED are for.
--
-- Verification (run separately, one at a time):
--
--   select jobid, schedule, jobname, active from cron.job;
--
--   select name from vault.secrets where name = 'webhook_dispatch_key';
--   -- expect one row
--
--   select * from public.claim_webhook_deliveries(5);
--   -- expect 0 rows today: nothing is queued. It must NOT error.
--
-- Prove the backoff. Queue a row against a URL that will fail, then:
--
--   select public.complete_webhook_delivery(
--     (select id from public.webhook_deliveries order by created_at desc limit 1),
--     false, 500, 'test');
--   -- returns 'pending'; next_retry_at should be ~1 minute out
--
-- After the cron is scheduled, watch it work:
--
--   select status, attempts, response_code, left(last_error,60) as err,
--          next_retry_at, delivered_at
--   from public.webhook_deliveries order by created_at desc limit 10;
