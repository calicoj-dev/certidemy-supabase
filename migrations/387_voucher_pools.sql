-- 387: seat batches become cert-agnostic voucher pools.
--
-- A partner buys N vouchers; the cert is chosen per voucher at assignment (assign-voucher)
-- and may change until the first REAL exam attempt (change-voucher-cert). Read from
-- pg_catalog 2026-10-07 before writing: 1 seat_batches row, 1 company_certifications row,
-- vouchers direct 80 (68 assigned, 11 redeemed, 1 revoked) + partner 1 (redeemed).
--
-- What changes:
--   seat_batches.certification_id / company_certification_id -> NULLABLE, and the one
--     existing batch becomes a pool (both NULL). Its one redeemed voucher keeps its cert.
--   vouchers_email_cert_active_uniq -> only while status = 'assigned'. It covered
--     'redeemed' too, so re-issuing a cert to someone whose attempts ran out was a 500.
--   Two NEW invoker views for the console; v_company_cert_usage is left in place until the
--     web stops reading it (additive, so the console works between this and the web deploy).
-- What must NOT change: any vouchers row, any company_certifications row.
--
-- Writers of seat_batches.certification_id (grepped both repos): create-batch only.
-- ONE STATEMENT, so the change and its post-conditions cannot land apart.

do $$
declare
  v_vouchers_before   text;
  v_vouchers_after    text;
  v_cc_before         text;
  v_cc_after          text;
  v_terms_before      text;
  v_terms_after       text;
  v_bad               text;
  v_idx               text;
begin
  -- Fingerprints of what this migration may not change.
  select md5(coalesce(string_agg(v::text, '|' order by v.id), '')) into v_vouchers_before
    from public.vouchers v;
  select md5(coalesce(string_agg(c::text, '|' order by c.id), '')) into v_cc_before
    from public.company_certifications c;
  select md5(coalesce(string_agg(concat_ws(',', b.id, b.company_id, b.seats, b.attempts_per_seat,
           b.invoice_ref, b.expires_at, b.created_at), '|' order by b.id), '')) into v_terms_before
    from public.seat_batches b;

  -- 1. Batches no longer carry a cert.
  alter table public.seat_batches alter column certification_id drop not null;
  alter table public.seat_batches alter column company_certification_id drop not null;

  update public.seat_batches
     set certification_id = null, company_certification_id = null, updated_at = now()
   where certification_id is not null or company_certification_id is not null;

  -- 2. One usable voucher per (email, cert), not one ever.
  drop index public.vouchers_email_cert_active_uniq;
  create unique index vouchers_email_cert_active_uniq
    on public.vouchers (assigned_email, certification_id)
    where status = 'assigned' and assigned_email is not null;

  -- 3. Console rollups. Invoker, so RLS on seat_batches / vouchers scopes a partner to itself.
  create view public.v_company_pool_usage with (security_invoker = on) as
  select
      ba.company_id,
      count(*)::bigint                                              as batches,
      sum(ba.seats)::bigint                                         as seats_sold,
      sum(ba.seats_assigned)::bigint                                as seats_assigned,
      greatest(sum(ba.seats) - sum(ba.seats_assigned), 0)::bigint   as seats_idle,
      sum(ba.attempts_used)::bigint                                 as attempts_used,
      bool_or(ba.unlimited)                                         as has_unlimited,
      case when bool_or(ba.unlimited) then null::bigint
           else sum(ba.attempts_purchased)::bigint end              as attempts_purchased,
      array_remove(array_agg(ba.invoice_ref order by ba.created_at), null) as invoice_refs,
      min(ba.expires_at)                                            as earliest_batch_expiry,
      max(ba.created_at)                                            as latest_batch_created_at
  from public.v_batch_attempts ba
  group by ba.company_id;

  create view public.v_company_voucher_cert_usage with (security_invoker = on) as
  select
      v.company_id,
      v.certification_id,
      count(*) filter (where v.status = 'assigned')::bigint  as vouchers_assigned,
      count(*) filter (where v.status = 'redeemed')::bigint  as vouchers_redeemed,
      coalesce(sum(v.attempts_used), 0)::bigint               as attempts_used
  from public.vouchers v
  where v.batch_id is not null and v.status in ('assigned', 'redeemed')
  group by v.company_id, v.certification_id;

  revoke all on public.v_company_pool_usage, public.v_company_voucher_cert_usage from public, anon;
  grant select on public.v_company_pool_usage, public.v_company_voucher_cert_usage
    to authenticated, service_role;

  -- POST 1: nothing it may not touch moved.
  select md5(coalesce(string_agg(v::text, '|' order by v.id), '')) into v_vouchers_after
    from public.vouchers v;
  select md5(coalesce(string_agg(c::text, '|' order by c.id), '')) into v_cc_after
    from public.company_certifications c;
  select md5(coalesce(string_agg(concat_ws(',', b.id, b.company_id, b.seats, b.attempts_per_seat,
           b.invoice_ref, b.expires_at, b.created_at), '|' order by b.id), '')) into v_terms_after
    from public.seat_batches b;
  if v_vouchers_after <> v_vouchers_before then
    raise exception using message = '387: vouchers rows changed';
  end if;
  if v_cc_after <> v_cc_before then
    raise exception using message = '387: company_certifications rows changed';
  end if;
  if v_terms_after <> v_terms_before then
    raise exception using message = '387: seat_batches terms changed';
  end if;

  -- POST 2: every batch is a pool, and both columns now admit NULL (read from the catalogue).
  select string_agg(b.id::text, ',') into v_bad
    from public.seat_batches b where b.certification_id is not null or b.company_certification_id is not null;
  if v_bad is not null then
    raise exception using message = '387: batches still carry a cert', detail = v_bad;
  end if;
  select string_agg(a.attname, ',') into v_bad
    from pg_attribute a
   where a.attrelid = 'public.seat_batches'::regclass
     and a.attname in ('certification_id', 'company_certification_id') and a.attnotnull;
  if v_bad is not null then
    raise exception using message = '387: still NOT NULL', detail = v_bad;
  end if;

  -- POST 3: the index predicate is the narrow one, in both directions.
  select pg_get_indexdef('public.vouchers_email_cert_active_uniq'::regclass) into v_idx;
  if v_idx not like '%''assigned''%' or v_idx like '%<>%' then
    raise exception using message = '387: unexpected index predicate', detail = v_idx;
  end if;

  -- POST 4: both views are invoker, and anon cannot read them.
  select string_agg(c.relname, ',') into v_bad
    from pg_class c
   where c.oid in ('public.v_company_pool_usage'::regclass, 'public.v_company_voucher_cert_usage'::regclass)
     and not coalesce('security_invoker=on' = any (c.reloptions), false);
  if v_bad is not null then
    raise exception using message = '387: view not security_invoker', detail = v_bad;
  end if;
  if has_table_privilege('anon', 'public.v_company_pool_usage', 'select')
     or has_table_privilege('anon', 'public.v_company_voucher_cert_usage', 'select') then
    raise exception using message = '387: anon can read a usage view';
  end if;
  if not has_table_privilege('authenticated', 'public.v_company_pool_usage', 'select') then
    raise exception using message = '387: authenticated cannot read v_company_pool_usage';
  end if;
end
$$;
