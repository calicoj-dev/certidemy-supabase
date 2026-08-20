-- 236_webhook_url_guard.sql
--
-- Rejects webhook URLs at the boundary instead of discovering them through
-- three failed deliveries.
--
-- ============================ THE FRAGMENT ================================
--
-- A partner registered https://webhook.site/#!/view/<uuid> -- the BROWSER url
-- from their address bar, not the endpoint. Everything after `#` is a
-- client-side fragment and is never transmitted, so the POST went to
-- https://webhook.site/ and 404'd three times before anyone looked.
--
-- A URL with a fragment can NEVER be a working webhook target. That is not a
-- policy judgement, it is how HTTP works, and it will be the single most common
-- mistake in this product: everyone copies the URL they are looking at.
--
-- Same reasoning as phone_e164 in 229_partner_leads: GoHighLevel will not
-- accept "+57 300 123 4567", so a non-E.164 value is rejected where it enters
-- rather than discovered later in the CRM.
--
-- ============================ THE SSRF ====================================
--
-- More serious, and not obvious.
--
-- dispatch-webhooks POSTs to whatever URL a partner stores AND RECORDS THE
-- RESPONSE BODY in webhook_deliveries.last_error. A partner who points a
-- webhook at http://169.254.169.254/latest/meta-data/ or an internal hostname
-- turns our dispatcher into a request proxy AND a read channel: they POST,
-- we fetch, the response comes back to them in a column they can be shown.
--
-- The blast radius is the edge runtime's network rather than ours, but "a
-- feature that fetches an attacker-chosen URL and returns the body" is the
-- textbook shape and it should not be left standing because today's runtime
-- happens to be uninteresting.
--
-- Blocked: localhost, the loopback and link-local ranges, RFC1918, and the
-- .internal / .local / .localhost suffixes. https is already required, which
-- rules out file:, gopher: and the rest.
--
-- NOT a substitute for the runtime check. DNS can resolve a public name to a
-- private address, which no amount of string matching catches. This raises the
-- floor; a resolver-level check in the dispatcher would be the ceiling.
--
-- ASCII only (CERT-SCHEMA-GUIDE section 8).

begin;

-- ============================================================ 1. the test
create or replace function public.webhook_url_problem(p_url text)
returns text
language plpgsql
immutable
as $function$
declare
  v_host text;
begin
  if p_url is null or btrim(p_url) = '' then
    return 'url is required';
  end if;
  if p_url !~ '^https://' then
    return 'url must be https';
  end if;
  if position('#' in p_url) > 0 then
    return 'url must not contain a fragment: everything after "#" is never ' ||
           'sent, so this address can never receive a webhook. Copy the ' ||
           'endpoint URL, not the one in your browser address bar.';
  end if;
  if length(p_url) > 2000 then
    return 'url is too long';
  end if;

  -- host = between "https://" and the first / ? or end. Lowercased, port
  -- stripped, credentials stripped.
  v_host := lower(split_part(regexp_replace(substring(p_url from 9), '[/?].*$', ''), '@', -1));
  v_host := split_part(v_host, ':', 1);

  if v_host = '' then
    return 'url has no host';
  end if;

  if v_host in ('localhost', '127.0.0.1', '0.0.0.0', '[::1]', '::1') then
    return 'url must not point at localhost';
  end if;
  if v_host like '%.internal' or v_host like '%.local'
     or v_host like '%.localhost' or v_host like '%.home.arpa' then
    return 'url must not point at an internal hostname';
  end if;
  -- RFC1918, loopback, link-local. Literal addresses only; a public name that
  -- RESOLVES inward is not caught here and cannot be.
  if v_host ~ '^127\.' or v_host ~ '^10\.'
     or v_host ~ '^192\.168\.'
     or v_host ~ '^172\.(1[6-9]|2[0-9]|3[01])\.'
     or v_host ~ '^169\.254\.' then
    return 'url must not point at a private or link-local address';
  end if;

  return null;
end;
$function$;

comment on function public.webhook_url_problem(text) is
  'Returns a human-readable reason a webhook URL cannot be used, or NULL if it is acceptable. Fragments can never receive a POST; private hosts would make the dispatcher a request proxy with a read channel.';

-- ============================================================ 2. enforce it
-- The constraint is the guarantee. The function below returns the better
-- message, but a direct INSERT must not get past this either.
alter table public.issuer_webhooks drop constraint if exists issuer_webhooks_url_https;
alter table public.issuer_webhooks drop constraint if exists issuer_webhooks_url_usable;
alter table public.issuer_webhooks add constraint issuer_webhooks_url_usable
  check (public.webhook_url_problem(url) is null);

-- ============================================================ 3. the function
-- Same body as 235 with the check in front, so a caller gets the reason rather
-- than a constraint name.
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
  v_problem   text;
begin
  v_problem := public.webhook_url_problem(p_url);
  if v_problem is not null then
    raise exception '%', v_problem;
  end if;

  if p_secret is null or length(p_secret) < 32 then
    raise exception 'webhook secret must be at least 32 characters';
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

commit;

-- Verification (run separately, one at a time):
--
--   select public.webhook_url_problem('https://webhook.site/9b70e505-234f-4f54-bb95-7be4297b4417');
--   -- NULL. The one that works.
--
--   select
--     public.webhook_url_problem('https://webhook.site/#!/view/abc')   as fragment,
--     public.webhook_url_problem('http://example.com/hook')            as not_https,
--     public.webhook_url_problem('https://localhost/hook')             as localhost,
--     public.webhook_url_problem('https://10.0.0.5/hook')              as rfc1918,
--     public.webhook_url_problem('https://169.254.169.254/latest/')    as link_local,
--     public.webhook_url_problem('https://build.internal/hook')        as internal;
--   -- every column non-null
--
-- Prove the constraint bites. This MUST raise:
--
--   insert into public.issuer_webhooks (issuer_id, url)
--   select id, 'https://example.com/hook#fragment' from public.issuers where slug = 'test-partner-02';
--
-- Prove the existing row survived:
--
--   select url, public.webhook_url_problem(url) as problem from public.issuer_webhooks;
--   -- one row, problem NULL
