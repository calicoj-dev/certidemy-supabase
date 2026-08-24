-- 199_cert_purchase_links.sql
--
-- Per-certification voucher purchase links, settable from /console/certifications.
--
-- WHY: Certidemy sells nothing. Vouchers are purchased on certiglobal.org, so
-- every "Buy exam voucher" CTA has to hand the buyer to the right product page.
-- Before this, those CTAs pointed at the CertiGlobal home page via a hardcoded
-- default in voucher-status-pill.tsx, and the buyer had to find the product
-- themselves.
--
-- SHAPE: `exam_link` already existed on the table, unused and null across all
-- ten certs, so it becomes the default link rather than a new column. The new
-- `exam_link_i18n` carries optional per-locale overrides for the case where
-- CertiGlobal has separate product pages per language.
--
-- RESOLUTION ORDER (implemented in lib/certifications/buy-link.ts and mirrored
-- in the set-cert-link edge function):
--   exam_link_i18n[locale]  ->  exam_link  ->  https://certiglobal.org
-- A missing locale key degrades to the default; a missing default degrades to
-- the CertiGlobal home page. A buyer is never sent nowhere.
--
-- HOST LOCK: a purchase link that accepts any string is a way to point a paying
-- buyer at a domain someone else owns. The edge function validates, and these
-- check constraints are the backstop that holds even if a future surface writes
-- the column directly. Both were proven to reject before this file was written
-- (see the verification block at the bottom).
--
-- OWNERSHIP: `exam_link` is CONSOLE-owned, not blueprint-owned. It was removed
-- from the diffFields list in scripts/ingest/plan.ts in the same commit --
-- otherwise a blueprint YAML that omits the key reads as "null vs console
-- value" and the next ingest run silently nulls every purchase link on the
-- platform. Do not add it back to that list.
--
-- Editor-first: run live in the SQL editor, then commit this file as the record.
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Validators. IMMUTABLE so a check constraint may call them.
--
-- SUPERSEDED: migration 244 widened is_valid_purchase_url to accept
-- certidemy.com as well, and moved ~ to ~*. The body below is what 199 ran, not
-- what runs today. Read 244_purchase_url_hosts.sql for the current definition.
-- ---------------------------------------------------------------------------

create or replace function public.is_valid_purchase_url(u text)
returns boolean language sql immutable as $$
  select u is null or u ~ '^https://([a-z0-9-]+\.)*certiglobal\.org(/|$)';
$$;

create or replace function public.is_valid_purchase_url_map(j jsonb)
returns boolean language sql immutable as $$
  select j is null or (
    jsonb_typeof(j) = 'object'
    and not exists (
      select 1 from jsonb_each_text(j) e
      where e.key not in ('en','es-419','pt-BR')
         or not public.is_valid_purchase_url(e.value)
    )
  );
$$;

-- DEPENDENCY GAP (recorded 2026-08-23, not a defect to fix here):
--
-- is_valid_purchase_url_map calls is_valid_purchase_url in its body, but that
-- edge is NOT in pg_depend. A quoted-string function body is opaque to the
-- dependency tracker -- it stores the body as text and never parses it -- so
-- the catalog believes the two functions are unrelated.
--
-- Consequence: DROP FUNCTION public.is_valid_purchase_url(text) succeeds
-- silently. The default RESTRICT sees nothing to restrict. The map function
-- survives the drop and then throws at runtime, on the next insert or update
-- touching exam_link_i18n, as a check constraint failing for a reason that
-- looks nothing like the cause.
--
-- The two CHECK constraints ARE recorded (deptype 'n'), so they block a drop of
-- either function. It is only the function-to-function call that is invisible.
--
-- REWRITING THE PAIR IS SAFE. DROPPING IS NOT. Use create or replace.

-- ---------------------------------------------------------------------------
-- 2. Column + constraints.
-- ---------------------------------------------------------------------------

alter table public.certifications
  add column if not exists exam_link_i18n jsonb;

comment on column public.certifications.exam_link is
  'Default CertiGlobal product page for this exam. NULL falls back to https://certiglobal.org.';
comment on column public.certifications.exam_link_i18n is
  'Optional per-locale overrides: {"es-419":"https://certiglobal.org/..."}. Keys limited to en/es-419/pt-BR. Missing key falls back to exam_link.';

alter table public.certifications drop constraint if exists certifications_exam_link_valid;
alter table public.certifications
  add constraint certifications_exam_link_valid
  check (public.is_valid_purchase_url(exam_link));

alter table public.certifications drop constraint if exists certifications_exam_link_i18n_valid;
alter table public.certifications
  add constraint certifications_exam_link_i18n_valid
  check (public.is_valid_purchase_url_map(exam_link_i18n));

-- ---------------------------------------------------------------------------
-- 3. Verification. Run each separately; the first two MUST fail with 23514.
--    A constraint nobody watched reject is a constraint nobody knows works.
-- ---------------------------------------------------------------------------

-- -- should FAIL: wrong host
-- update public.certifications set exam_link = 'https://evil.example.com/x' where code = 'AIE-I';

-- -- should FAIL: unsupported locale key
-- update public.certifications set exam_link_i18n = '{"fr":"https://certiglobal.org/x"}'::jsonb where code = 'AIE-I';

-- -- should SUCCEED
-- update public.certifications set exam_link = 'https://certiglobal.org/products/ai-essentials' where code = 'AIE-I';

-- select code, exam_link, exam_link_i18n from public.certifications order by code;
