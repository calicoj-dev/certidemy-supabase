-- 179_cert_inventory_fn.sql
-- public.cert_inventory() - a DERIVED answer to "what does a new cert still need?"
--
-- WHY THIS EXISTS. Every artifact that describes this system is hand-written prose
-- describing a moment: CERT-PUBLISH-CHECKLIST, CERT-SCHEMA-GUIDE, the loader
-- headers, the handoffs. On 2026-08-06 four of them lost to the database in a
-- single session, and the publish checklist's stale line about descriptions being
-- NULL led to an existing loader being overwritten. Prose ages; the schema moves.
--
-- This function does not age. It reads information_schema at call time, finds
-- every table carrying a certification_id column, and counts rows per cert. A new
-- cert's gaps appear as zeros next to a reference cert's counts, so nobody has to
-- REMEMBER that jta_versions or certification_i18n exists.
--
-- Read-only. No dynamic SQL reaches user input - table names come from
-- information_schema and are quoted with format %I.
--
-- Usage:
--   select * from public.cert_inventory() order by table_name, cert_code;
--   select * from public.cert_inventory('AIMS-F');
-- Or via scripts/cert-inventory.mjs, which also reports loader coverage.

begin;

create or replace function public.cert_inventory(p_code text default null)
returns table (
  cert_code   text,
  table_name  text,
  row_count   bigint
)
language plpgsql
stable
as $fn$
declare
  r_tbl  record;
  r_cert record;
  n      bigint;
begin
  for r_tbl in
    select c.table_name as tname
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public'
      and c.column_name  = 'certification_id'
      and t.table_type   = 'BASE TABLE'
    order by c.table_name
  loop
    for r_cert in
      select id, code from public.certifications
      where p_code is null or code = p_code
      order by code
    loop
      execute format('select count(*) from public.%I where certification_id = $1', r_tbl.tname)
        into n
        using r_cert.id;

      cert_code  := r_cert.code;
      table_name := r_tbl.tname;
      row_count  := n;
      return next;
    end loop;
  end loop;
end;
$fn$;

grant execute on function public.cert_inventory(text) to authenticated, service_role;

commit;

-- ============================================================
-- VERIFICATION (run separately)
-- ============================================================
-- 1. what tables does it find at all:
-- select distinct table_name from public.cert_inventory() order by 1;
--
-- 2. the gap matrix for the newest cert against a complete one:
-- select table_name,
--        max(row_count) filter (where cert_code = 'ISMS-F') as isms_f,
--        max(row_count) filter (where cert_code = 'AIMS-F') as aims_f
-- from public.cert_inventory()
-- where cert_code in ('ISMS-F','AIMS-F')
-- group by table_name
-- order by table_name;
-- ANY row where the reference cert is > 0 and the new cert is 0 is an open gap.
