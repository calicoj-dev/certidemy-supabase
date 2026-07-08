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

## 0. The two scaffold migrations

A new cert `X` (uuid `U`, code `CODE`) needs two editor-first migrations:

- **`NNN_seed_<code>.sql`** — SECTION 0 category (if founding a family) + SECTION 1
  cert + SECTION 2 idempotency reset + SECTION 3 domains + SECTION 4 concepts +
  SECTION 5 tasks + SECTION 6 task_concepts + a commented verification query.
- **`NNN+1_seed_<code>_modules.sql`** — the modules (one per domain, aligned by
  `order_index`).

Both are **editor-first** (paste + run in the Supabase SQL editor to affect the
live DB; commit the file as the versioned record) and **idempotent** (fixed ids +
`on conflict do update`; SECTION 2 wipes only this cert's children before reseed).

---

## 1. `cert_categories` — the family table (from 048)

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

## 2. `certifications` — the cert row (065 + 048 + 069 columns)

Insert column set (all real, verified in 084):

```
certifications (
  id                     uuid   -- fixed, repeating-digit convention (see §6)
  code                   text   -- OUR code, e.g. 'AIGRM-I' (never a third party's)
  name                   text   -- 'Certidemy <Name> I - AI'
  provider               text   -- 'Certidemy'
  description            text   -- dollar-quoted prose
  exam_duration_minutes  int    -- 60 (SM) / 90 (SPO,SD,AIGRM); confirm at publish
  passing_score_pct      numeric-- 80.00 for I-tier
  num_questions          int    -- 80 for I-tier
  difficulty_level       int    -- 1 (I-tier)
  tier                   smallint  -- 1 (from 048; I-tier)  [note: distinct from difficulty_level]
  is_published           boolean-- false at scaffold (legacy flag; kept in sync with status)
  category_slug          text   -- FK -> cert_categories.slug (REQUIRED for catalog)
  sort_order             smallint  -- position within the family (1 = first)
  status                 text   -- lifecycle (see §3); 'draft' at scaffold
)
```
Upsert by fixed `id` with `on conflict (id) do update set ... updated_at = now()`.

**Status vs is_published:** 069 replaced the boolean with a 4-state `status`.
Scaffold sets `status='draft'` AND `is_published=false` (keep both consistent
until 069-part-2 drops the boolean). Do not rely on is_published for new reads;
`status` is the source of truth.

---

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
- **id** deterministic: `aNNNNNNN-0000-0000-0000-00000000000K` where `NNNNNNN`
  mirrors the cert's repeating digit and `K` is the module number
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

## 7. UUID convention (repeating-digit)

Human-readable, collision-free by inspection:

| Cert | UUID |
|---|---|
| SM-AI-I | `11111111-…` |
| GAIPC stub | `22222222-…` (CertiProf-era; not ours) |
| SPO-AI-I | `33333333-…` |
| SD-AI-I | `44444444-…` |
| **AIGRM-I** | `55555555-…` |
| *next cert* | `66666666-…` |

Module ids reuse the cert's digit: `a<digit×7>-0000-0000-0000-00000000000K`.

---

## 8. Paste-safety (large scaffold migrations)

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
