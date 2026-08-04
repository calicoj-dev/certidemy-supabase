# CERT-SCHEMA-GUIDE.md — the scaffold contract (Stage 6, verified)

**Purpose:** the exact database shape a new certification's scaffold migrations
must fill. CERT-CREATION.md says *what* Stage 6 does ("author the scaffold
migrations, editor-first"); this doc is the *how* — the real column sets, enum
values, id conventions, and slug rules, so the next cert's scaffold is written
from this reference, not re-derived by reading old migrations.

**Provenance:** every fact here was verified live during the AIGRM-I scaffold
(migrations 084/085), which seeded **1 cert, 1 category, 5 domains, 49 tasks, 165
concepts, 174 task_concepts links, 5 modules** and passed its verification query
exactly. Reference migrations: **065** (SD-AI-I cert/domains/concepts/tasks/links),
**067** (SD-AI-I modules), **048** (cert_categories), **069** (status lifecycle),
**003** (the JTA enums). When in doubt, read 084 — it is the current best template.

---

## 0. The three scaffold migrations

A new cert `X` (uuid `U`, code `CODE`) needs THREE editor-first migrations:

- **`NNN_seed_<code>.sql`** — SECTION 0 category (if founding a family) + SECTION 1
  cert + SECTION 2 idempotency reset + SECTION 3 domains + SECTION 4 concepts +
  SECTION 5 tasks + SECTION 6 task_concepts + a commented verification query.
- **`NNN+1_seed_<code>_modules.sql`** — the modules (one per domain, aligned by
  `order_index`).
- **`NNN+2_<code>_exam_blueprint.sql`** — the exam blueprint. **Required, not
  optional:** without `exam_blueprint.cognitive_profile` the examination makes no
  cognitive claim and `verify-cert.mjs` fails the cert. Build the profile by
  reading `public.v_cognitive_profile` inside the migration, never as a typed
  literal — the object's own `derived_from` says the profile is computed from the
  JTA, and a literal makes that sentence descriptive rather than true.
  Reference: **173** (ISMS-F). 147 (AIHR-I) predates the read-from-view pattern.

Both are **editor-first** (paste + run in the Supabase SQL editor to affect the
live DB; commit the file as the versioned record) and **idempotent** (fixed ids +
`on conflict do update`; SECTION 2 wipes only this cert's children before reseed).

---

## 0a. Verify before you write - every time

**This guide is a reference, not an oracle. Confirm it against the live schema at
the start of every cert build, before writing a line of SQL.** It has been stale
twice: `certifications.is_published` (dropped by 069-part-2, documented as
present) and the repeating-digit UUID convention (exhausted, documented as
current). Both were copied into a migration that failed on paste.

```sql
select table_name, ordinal_position, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('certifications','domains','concepts','tasks','modules')
order by table_name, ordinal_position;
```

A gap in `ordinal_position` means a dropped column - that is the signature of a
guide section that has gone stale.

Also confirm the family slot before founding a family, because `sort_order` is
claimed by existing rows:

```sql
select slug, label, sort_order from public.cert_categories order by sort_order;
```

---

## 1. `cert_categories`

Certs are grouped into families. The frontend calls them "families"; the DB calls
them **categories**. Same thing. A cert with no category does **not** render in the
catalog — filing under a category is mandatory for visibility.

```
cert_categories (
  slug        text primary key,     -- e.g. 'governance'
  label       text not null,        -- e.g. 'Certidemy Governance'
  tagline     text,
  sort_order  smallint not null default 0
)
```
- Seeded families: `scrum` (1), `ai` (2), `agile-frameworks` (3), **`governance` (4)**
  (founded by AIGRM-I, migration 084).
- RLS: public SELECT (049); base-table GRANT to anon+authenticated (050). A new
  category row needs no new policy/grant — the table-level ones cover it.
- **Founding a new family** = one upsert row in the cert's SECTION 0:
  ```sql
  insert into public.cert_categories (slug,label,tagline,sort_order) values
    ('<slug>','<Label>',$$<tagline>$$,<n>)
  on conflict (slug) do update set label=excluded.label, tagline=excluded.tagline, sort_order=excluded.sort_order;
  ```
- The frontend marketing/catalog also references families by slug
  (`lib/certifications/family-content`, `FAMILY_SLUGS`, the homepage
  `FAMILY_SLUG`/`FAMILY_CODES`). A purely-DB category renders in the grouped
  catalog automatically; a *featured* family (homepage transparency section) needs
  its slug/codes added there too. Filing the cert under the category is enough for
  the standard catalog.

---

## 2. `certifications` - the cert row

**Verified against `information_schema` on 4 August 2026** and confirmed by
`171_seed_isms_f.sql` running clean. Re-verify per S0a before the next build.

```
certifications (
  id                     uuid        NOT NULL  default uuid_generate_v4()
  code                   text        NOT NULL  -- OUR code, e.g. 'ISMS-F' (never a third party's)
  name                   text        NOT NULL
  provider               text        NOT NULL  default 'Certidemy'
  description            text        NULL      -- dollar-quoted prose
  price_usd              numeric     NOT NULL  default 0
  exam_link              text        NULL
  exam_duration_minutes  integer     NULL
  passing_score_pct      numeric     NULL      default 70.00   -- SET EXPLICITLY, see below
  num_questions          integer     NULL
  difficulty_level       smallint    NULL      -- 1 for I-tier
  created_at             timestamptz NOT NULL  default now()
  updated_at             timestamptz NOT NULL  default now()
  category_slug          text        NULL      -- FK -> cert_categories.slug; REQUIRED for catalog
  tier                   smallint    NOT NULL  default 1
  sort_order             smallint    NOT NULL  default 0       -- position WITHIN the family
  status                 text        NOT NULL  default 'draft' -- lifecycle, see S3
  exam_blueprint         jsonb       NULL
  max_exam_attempts      integer     NOT NULL  default 6
  attempt_window_months  integer     NOT NULL  default 12
  validity_days          integer     NOT NULL  default 365
)
```

**`is_published` no longer exists.** 069 introduced `status`; 069-part-2 dropped
the boolean. `status` is the sole source of truth. Any migration or script still
writing `is_published` fails on paste - which is how this section was found stale.

**`passing_score_pct` defaults to 70.00, not 80.00.** Every I-tier cert is 80.
Omitting the column silently seeds a cert that passes at 70, with no error and
nothing downstream to catch it. **Always write it.**

**`sort_order` is position within the family**, distinct from
`cert_categories.sort_order`, which orders the families themselves. First cert in
a new family = 1.

**`tier` and `difficulty_level` are distinct.** Both are 1 for an I-tier cert.

**`validity_days` is 365 platform-wide** and matches the scheme decision that
credential validity tracks the content re-review cadence. Write it explicitly so a
future change to the column default cannot silently move a locked scheme term.

Safe to omit at scaffold (defaults are correct): `price_usd`, `exam_link`,
`exam_blueprint`, `max_exam_attempts`, `attempt_window_months`, `created_at`,
`updated_at`.

Upsert by fixed `id` with `on conflict (id) do update set ... updated_at = now()`.

**Reference implementation: migration 171** (`ISMS-F`). It is the current best
template for a cert row - 084 predates the `is_published` drop.
## 3. `certifications.status` — the lifecycle (from 069)

```
check (status in ('draft','coming_soon','available','unavailable'))  default 'draft'
```
- `draft` — scaffolded, hidden from catalog. **Where every new cert starts.**
- `coming_soon` — built + JTA filed, announced; shows with badge; not enrollable/examinable.
- `available` — fully live: discoverable, enrollable, examinable, mints credentials.
- `unavailable` — temporarily frozen: shows with badge; lessons/practice keep working
  for enrolled learners; **exam frozen** (no new starts/mints); issued creds stay valid.

Promote via the super-admin `/console/certifications` panel -> `set-cert-status`
edge fn. AIGRM-I is currently `draft` (dark until it has lessons + both question pools).

---

## 4. `domains`, `concepts`, `tasks`, `task_concepts` — the JTA spine

### domains
```
domains (certification_id, code, title, description, weight_pct, order_index)
```
- `code` = `D1..D5`; `weight_pct` sums to 100 across the cert; `order_index` 1..5.
- Modules align to domains by **shared `order_index`** (the reachability fallback).

### concepts
```
concepts (certification_id, slug, name, description)
```
- `slug` kebab-case, **unique within the cert**, immutable once published.
- One concept = one teachable/testable idea.

### tasks  (the KSA-bearing table — do NOT omit knowledge/skills/abilities)
```
tasks (certification_id, domain_id, code, statement,
       criticality, frequency, bloom_level,
       is_exam_scope, is_simulation_candidate,
       knowledge, skills, abilities, order_index)
```
- `domain_id` is resolved in-migration by joining `domains` on `(certification_id,
  code=v.domain_code)` — you write the domain **code** in the values list, the join
  supplies the id (see the `select ... from (values ...) v join domains d` pattern
  in 065/084).
- `code` = `D.N` (e.g. `3.2`), immutable once published.
- `order_index` is **globally sequential 1..N across the whole cert** (not per-domain).
- `is_exam_scope` = `true` for all I-tier tasks; `is_simulation_candidate` = `false`
  unless the task is a genuine simulation candidate.
- **KSA triple is required** — every task carries `knowledge` (what they must know),
  `skills` (what they can do), `abilities` (the disposition/trait). An auditor
  comparing certs expects these; a task row without them does not match the
  architecture. Derive them from the task statement + its concepts.

### task_concepts  (reachability, written at creation)
```
task_concepts (task_id, concept_id)
```
- Resolved in-migration by joining tasks (on code) and concepts (on slug), both
  scoped to the cert. Populate this in the **same** scaffold migration so the
  practice/question pipeline can find questions the moment any are seeded — never a
  later orphan-repair pass.
- A concept may be linked by multiple tasks (cross-domain reuse). Total link rows =
  sum of every task's concept-list length (AIGRM-I: 165 concepts, 174 links → 9
  reuse links).

---

## 5. The three JTA enums (from 003) — exact values, cast in-migration

Casting a value outside these lists fails the whole migration. Cast with
`v.col::type` in the tasks select.

```
criticality     : 'high' | 'medium' | 'low'
task_frequency  : 'daily' | 'weekly' | 'per_sprint' | 'per_exam' | 'occasional'
bloom_level     : '1_remember' | '2_understand' | '3_apply' | '4_analyze' | '5_evaluate' | '6_create'
```
- **`task_frequency` has no high/med/low** — map a JTA's H/M/L *frequency* onto the
  real cadences. `per_sprint` is Scrum-flavored; for non-Scrum certs use
  `daily/weekly/occasional/per_exam` by the real rhythm (AIGRM-I used
  per_exam/occasional/weekly).
- I-tier certs stay within `2_understand`/`3_apply`/`4_analyze` (avoid 1_remember
  trivia and 5/6 for an entry tier).

---

## 6. `modules` — one per domain (from 067)

```
modules (id, certification_id, title, description, order_index, estimated_minutes, slug)
```
- **id** - generate five UUIDs at authoring time and hardcode them as literals so
  `on conflict (id) do update` still works. The old pattern below is RETIRED with
  the repeating-digit convention (S7); it was cosmetic, and `order_index` is what
  carries domain alignment. Never call `gen_random_uuid()` inside the migration -
  a fresh uuid on re-run breaks idempotency and duplicates the modules.
  *(Retired pattern, for reading old migrations only:* `aNNNNNNN-0000-0000-0000-00000000000K`
  where `NNNNNNN` mirrors the cert's repeating digit and `K` is the module number
  (AIGRM-I: `a5555555-0000-0000-0000-00000000000{1..5}`). Enables `on conflict (id)`.
- **order_index** aligns 1:1 to the domains (module K ↔ domain DK) — this shared
  index is the module→domain→tasks→task_concepts reachability fallback.
- **slug** MUST equal the lesson content folder name **minus the `NN-` prefix**, and
  the `module_slug` in every lesson's frontmatter. Slug typo = lessons silently
  misfile at load. AIGRM-I slugs → folders `content/aigrm-i/01-foundations-of-ai-governance/`, etc.
- **estimated_minutes** is a placeholder at scaffold; refine to the sum of the
  module's lesson durations at lesson-load time.
- **Modules must exist before lessons load** (a lesson resolves `module_id` by
  `(certification_id, module_slug)`).

---

## 7. UUID convention - RETIRED, generate instead

**The repeating-digit convention is retired as of cert #8 (`ISMS-F`).** It ran out
of readable slots and it was never load-bearing: the UUID is an opaque internal
identifier and nothing in the platform reads meaning from it.

**New certs:** generate a UUID at authoring time, hardcode it into the seed
migration as a literal, and record it in the migration header comment. The
migration stays idempotent (`on conflict (id) do update`) exactly as before - the
id is fixed in the file, it is simply no longer patterned.

```sql
-- at authoring time, once:
select gen_random_uuid();
-- paste the result into the migration as a literal. Do NOT call
-- gen_random_uuid() inside the migration itself: the migration must be
-- idempotent and a fresh uuid on re-run would duplicate the cert.
```

**Module ids** no longer mirror a cert digit. Generate five and hardcode them the
same way, keeping `order_index` 1..N aligned to the domains. The module id pattern
was cosmetic; `order_index` is what carries the domain alignment.

**Existing certs keep their repeating digits.** They are opaque identifiers;
renaming would touch every migration, script and content folder for no gain.

| Cert | UUID |
|---|---|
| SM-AI-I | `11111111-...` |
| GAIPC stub | `22222222-...` (CertiProf-era; not ours) |
| SPO-AI-I | `33333333-...` |
| SD-AI-I | `44444444-...` |
| AIGRM-I | `55555555-...` |
| AISM-I | `66666666-...` |
| AIHR-I | `77777777-...` |
| **ISMS-F and later** | **generated - read the migration header** |

**The old trap is closed.** HANDOFF v2.1's rule - *never infer a new
certification's UUID from how many certs exist* - no longer has anything to infer
from. The free-slot query in migration 105 is vestigial for new certs.
## 8. Paste-safety (large scaffold migrations)

**Prove it rather than trust it.** A generated migration is checked for non-ASCII
BEFORE it is pasted, not after it corrupts a row:

```powershell
Select-String -LiteralPath <migration.sql> -Pattern '[^\x00-\x7F]'   # expect no output
```

Migrations generated by parsing a locked JTA inherit whatever the JTA contains -
em-dashes, curly quotes and ellipses are normal in a markdown document and fatal
in a large SQL paste. Sanitize at generation time, then prove it.

The Supabase SQL editor can corrupt multibyte characters (em-dashes, curly quotes,
ellipses) inside **large** pastes. A full scaffold (100s of rows) is a large paste.
**Author scaffold prose ASCII-only** — hyphens not em-dashes, straight quotes, no
ellipsis — so this class of failure cannot occur. (084 is fully ASCII; verify a new
scaffold with `grep -nP '[^\x00-\x7F]'` before pasting.) This is distinct from the
*lesson* loader rule (never paste lesson SQL at all — use `load-lessons-direct.mjs`);
scaffold migrations DO go through the editor, just ASCII-clean.

---

## 9. Verification query (run after both migrations)

```sql
select
  (select count(*) from certifications where id='<U>') as certs,               -- 1
  (select count(*) from cert_categories where slug='<family>') as category,     -- 1
  (select count(*) from domains   where certification_id='<U>') as domains,     -- 5
  (select count(*) from tasks     where certification_id='<U>') as tasks,       -- N
  (select count(*) from concepts  where certification_id='<U>') as concepts,    -- M
  (select count(*) from task_concepts tc join tasks t on t.id=tc.task_id
     where t.certification_id='<U>') as links;                                  -- >= M
-- modules: select count(*) from modules where certification_id='<U>';          -- 5
```
Expect the JTA's exact task/concept/link totals. AIGRM-I: `1 / 1 / 5 / 49 / 165 / 174`, modules `5`.

---

*Companion to CERT-CREATION.md (§ Stage 6). Update this when the schema changes
(new certifications column, new enum value, new lifecycle state). Add a
`CERT-SCHEMA-GUIDE.md` reference to the PIPELINE-INDEX "Add a new certification" row.*
