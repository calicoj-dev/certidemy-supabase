# PATCH C — `CERT-SCHEMA-GUIDE.md`: correct §2 and §6 from live schema

**Date:** 4 August 2026
**Trigger:** `171_seed_isms_f.sql` failed on `column "is_published" ... does not exist`.
**Source of truth:** `information_schema.columns`, queried 4 August 2026, and the
column set that `171` then ran clean against.

## Why this patch exists

`CERT-SCHEMA-GUIDE.md` exists so the next cert's scaffold is written from a
reference rather than re-derived by reading old migrations. For `certifications`
it could not do that job: §2 documented `is_published` as present, with a note
saying it was "kept in sync with status until 069-part-2 drops the boolean."
069-part-2 has shipped. The column is gone.

**Two stale sections were found in one sitting** — this one and the
repeating-digit UUID convention (Patch B). The guide is authoritative-by-claim
and was wrong twice. §0 therefore gains a standing verification instruction, so
the next build catches drift before writing SQL rather than after a failed paste.

Four column names in §2 were also wrong relative to reality, and all four were
copied faithfully into a broken migration:

| Guide said | Actually |
|---|---|
| `duration_minutes` *(implied)* | `exam_duration_minutes` |
| `total_questions` *(implied)* | `num_questions` |
| `is_published` | **does not exist** |
| — | `price_usd`, `exam_link`, `exam_blueprint`, `max_exam_attempts`, `attempt_window_months`, `validity_days` all undocumented |

---

## C0 — new standing instruction, insert at the top of §0

```
+## 0a. Verify before you write — every time
+
+**This guide is a reference, not an oracle. Confirm it against the live schema
+at the start of every cert build, before writing a line of SQL.** It has been
+stale twice: `certifications.is_published` (dropped by 069-part-2, documented as
+present) and the repeating-digit UUID convention (exhausted, documented as
+current). Both were copied into a migration that failed on paste.
+
+```sql
+select table_name, ordinal_position, column_name, data_type, is_nullable, column_default
+from information_schema.columns
+where table_schema = 'public'
+  and table_name in ('certifications','domains','concepts','tasks','modules')
+order by table_name, ordinal_position;
+```
+
+A gap in `ordinal_position` means a dropped column — that is the signature of a
+guide section that has gone stale.
+
+Also confirm the family slot before founding a family, because `sort_order` is
+claimed by existing rows:
+
+```sql
+select slug, label, sort_order from public.cert_categories order by sort_order;
+```
```

---

## C1 — replace §2 entirely

```
-## 2. `certifications` — the cert row (065 + 048 + 069 columns)
-
-Insert column set (all real, verified in 084):
-
-```
-certifications (
-  id                     uuid   -- fixed, repeating-digit convention (see §6)
-  ...
-  is_published           boolean-- false at scaffold (legacy flag; kept in sync with status)
-  ...
-)
-```
-Upsert by fixed `id` with `on conflict (id) do update set ... updated_at = now()`.
-
-**Status vs is_published:** 069 replaced the boolean with a 4-state `status`.
-Scaffold sets `status='draft'` AND `is_published=false` (keep both consistent
-until 069-part-2 drops the boolean). Do not rely on is_published for new reads;
-`status` is the source of truth.
+## 2. `certifications` — the cert row
+
+**Verified against `information_schema` on 4 August 2026** and confirmed by
+`171_seed_isms_f.sql` running clean. Re-verify per §0a before the next build.
+
+```
+certifications (
+  id                     uuid      NOT NULL  default uuid_generate_v4()
+  code                   text      NOT NULL  -- OUR code, e.g. 'ISMS-F' (never a third party's)
+  name                   text      NOT NULL
+  provider               text      NOT NULL  default 'Certidemy'
+  description            text      NULL      -- dollar-quoted prose
+  price_usd              numeric   NOT NULL  default 0
+  exam_link              text      NULL
+  exam_duration_minutes  integer   NULL
+  passing_score_pct      numeric   NULL      default 70.00   -- SET EXPLICITLY, see below
+  num_questions          integer   NULL
+  difficulty_level       smallint  NULL      -- 1 for I-tier
+  created_at             timestamptz NOT NULL default now()
+  updated_at             timestamptz NOT NULL default now()
+  category_slug          text      NULL      -- FK -> cert_categories.slug; REQUIRED for catalog visibility
+  tier                   smallint  NOT NULL  default 1
+  sort_order             smallint  NOT NULL  default 0       -- position WITHIN the family
+  status                 text      NOT NULL  default 'draft' -- lifecycle, see §3
+  exam_blueprint         jsonb     NULL
+  max_exam_attempts      integer   NOT NULL  default 6
+  attempt_window_months  integer   NOT NULL  default 12
+  validity_days          integer   NOT NULL  default 365
+)
+```
+
+**`is_published` no longer exists.** 069 introduced `status`; 069-part-2 dropped
+the boolean. `status` is the sole source of truth. Any migration or script still
+writing `is_published` will fail on paste.
+
+**`passing_score_pct` defaults to 70.00, not 80.00.** Every I-tier cert is 80.
+Omitting the column silently seeds a cert that passes at 70. **Always write it.**
+
+**`sort_order` is position within the family, not a global position.** It is
+distinct from `cert_categories.sort_order`, which orders the families themselves.
+First cert in a new family = 1.
+
+**`tier` and `difficulty_level` are distinct.** Both are 1 for an I-tier cert.
+
+**`validity_days` is 365 platform-wide** and matches the scheme decision that
+credential validity tracks the content re-review cadence. Write it explicitly so
+a future change to the column default cannot silently move a locked scheme term.
+
+Safe to omit at scaffold (defaults are correct): `price_usd`, `exam_link`,
+`exam_blueprint`, `max_exam_attempts`, `attempt_window_months`, `created_at`,
+`updated_at`.
+
+Upsert by fixed `id` with `on conflict (id) do update set ... updated_at = now()`.
+
+**Reference implementation: migration 171** (`ISMS-F`). It is the current best
+template for a cert row — 084 predates the `is_published` drop.
```

---

## C2 — §6 `modules`, replace the id bullet

Consequential to Patch B: module ids no longer mirror a cert digit.

```
-- **id** deterministic: `aNNNNNNN-0000-0000-0000-00000000000K` where `NNNNNNN`
-  mirrors the cert's repeating digit and `K` is the module number
-  (AIGRM-I: `a5555555-0000-0000-0000-00000000000{1..5}`). Enables `on conflict (id)`.
+- **id** — generate five UUIDs at authoring time and hardcode them as literals, so
+  `on conflict (id) do update` still works. The old `a<digit x7>-...-K` pattern is
+  retired with the repeating-digit convention (§7); it was cosmetic. **`order_index`
+  is what carries domain alignment**, and that is unchanged. Do not call
+  `gen_random_uuid()` inside the migration — a fresh uuid on re-run breaks
+  idempotency and duplicates the modules.
```

---

## C3 — §8 paste-safety, append

```
+**Prove it rather than trust it.** A generated migration should be checked for
+non-ASCII before it is pasted, not after it corrupts a row:
+
+```powershell
+Select-String -LiteralPath <migration.sql> -Pattern '[^\x00-\x7F]'   # expect no output
+```
+
+Migrations generated by parsing a locked JTA inherit whatever the JTA contains —
+em-dashes, curly quotes and ellipses are normal in a markdown document and fatal
+in a large SQL paste. Sanitize at generation time, then prove it.
```

---

## Order of operations

C0–C3 are documentation only. No DB effect, nothing to run.

Land them in the same commit as Patch A (17024 pin) and Patch B (UUID
retirement), alongside migrations 171–172.

## Carried into the handoff

**Do not treat `CERT-SCHEMA-GUIDE.md` as verified for a cert build until §0a has
been run for that build.** Two of its sections were stale simultaneously, and
both failures reached a migration. The guide is a good reference and a bad
oracle; the introspection query is what makes it trustworthy again each time.
