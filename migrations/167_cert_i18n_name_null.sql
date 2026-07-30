-- 167_cert_i18n_name_null.sql
--
-- EXECUTED IN THE SUPABASE SQL EDITOR. This file is the versioned record, not
-- the execution. Editor-first, per standing rule.
--
-- SAFE AS SQL: writes NULL only. No string literals, no multibyte payload.
--
-- WHY
--   Certification names are product identifiers, like PMP or CSM. They are not
--   translated. This was already the documented rule --
--   scripts/load-cat-i18n.mjs:18 states it outright: "certification_i18n.name
--   is left null. The app always falls back."
--
--   All 21 rows (7 certs x 3 langs) already existed. es-419 and pt-BR were
--   correctly null. Only the `en` rows carried a name, and those went stale the
--   moment 166 ran -- a duplicated field free to drift is worse than an absent
--   one. This makes the data match a convention that had been enforced only by
--   accident in the non-English rows.
--
-- PRE-FLIGHT DONE BEFORE RUNNING
--   Nulling a column that call sites read is not safe by default. A site
--   written `row ? row.name : base.name` breaks when the row EXISTS and the
--   FIELD is null -- you get a blank certification name on a public page. Only
--   `row?.name ?? base.name` survives. All three read sites were checked by
--   reading the mapping body, not the lookup:
--
--     lib/certifications/data.ts:~119   (tr.name as string | null) ?? name    OK
--     lib/certifications/data.ts:~394   tr?.name ?? c.name                    OK
--     lib/console/library.ts:~180       pick(r.id, "name") ?? r.name          OK
--
--   library.ts's pick() helper bottoms out at `?? null` and LOOKS broken until
--   you read the call site. Read the call site.
--
-- NOT TOUCHED: claim (lives only in this table, present for all 7 x 3) and
--   description (see 168 candidate note in HANDOFF-v4.4 section 8 -- and read
--   load-cert-descriptions.mjs's header before relitigating it).

begin;

update public.certification_i18n set name = null where name is not null;

-- Verification. Expected: name null on all 21 rows, has_claim true on all 21,
-- has_description true on all except AIHR-I (filled separately by
-- scripts/load-aihr-descriptions.mjs -- run it if those still read false).
select c.code, i.lang, i.name,
       i.claim is not null       as has_claim,
       i.description is not null as has_description
from public.certification_i18n i
join public.certifications c on c.id = i.certification_id
order by c.code, i.lang;

commit;
