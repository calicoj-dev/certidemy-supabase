# LESSON-PIPELINE.md

**The canonical path from authored lesson markdown to a live, coverage-proven
cert.** This is the standard process for every certification and every language.
Follow it exactly; it is designed so a cert's lessons go live in a handful of
commands, not days.

> **Status of this document:** Written after SD-AI-I was taken end-to-end through
> this pipeline and verified live (44 lessons, 135/135 concepts taught, 0
> untaught-testing violations). Every step below has been executed and proven,
> not theorized.

---

## 0. The one-paragraph version

Author lessons as markdown under `content/<cert>/<NN-module>/*.md`. Seed the cert
**scaffold** (cert, domains, concepts, tasks, modules) via migrations. **Load** the
lessons into the `lessons` table with `scripts/load-lessons-direct.mjs` (the API
loader — **never** by pasting SQL into the Supabase web editor). **Wire** the
lessons' concept/task tags into the bridge tables with `scripts/wire-lessons.mjs`.
**Prove** it with the coverage view: `concepts_taught == concepts_total` and
`untaught_testing_violations == 0`. Then author questions and publish.

---

## 1. Canonical toolchain (all cert-agnostic)

| Tool | Repo path | Role | Status |
|---|---|---|---|
| Scaffold migrations | `supabase/migrations/NNN_*.sql` | Seed cert, domains, concepts, tasks, modules | editor-first |
| `load-lessons-direct.mjs` | `supabase/scripts/` | **CANONICAL lesson loader** — reads markdown, inserts via Supabase API | idempotent |
| `wire-lessons.mjs` | `supabase/scripts/` | Projects frontmatter `concept_slugs`/`task_codes` into `lesson_concepts`/`lesson_tasks` | idempotent |
| `gen-lesson-sql.mjs` | `certidemy-web/db/` | Generates lesson-load **SQL** (versioned/audit record; NOT the primary load path) | idempotent |
| Coverage views (migration 066) | DB views | `v_coverage_summary` etc. proves no-untaught-testing | read-only |

All four scripts take the cert as a parameter (`--cert <uuid>` or `CERT_ID` env)
and are safe to re-run — they only fill gaps. One toolchain, every cert, every
language.

---

## 2. The pipeline, stage by stage

### Stage 1 — Scaffold (cert / domains / concepts / tasks / modules)

**Source of truth:** the JTA + scheme docs, expressed as seed migrations.
**What it creates:** the cert row, its domains, the full concept list, the tasks,
`task_concepts`, and the modules.

For SD-AI-I this was migrations **065** (cert + domains + concepts + tasks +
task_concepts) and **067** (the 5 modules). Run editor-first (paste into the
Supabase SQL editor to affect the live DB), then commit the `.sql` file as the
versioned record.

> **Critical dependency:** modules must exist **before** lessons load, because a
> lesson resolves its `module_id` by `(certification_id, module_slug)`. The module
> `slug` in the migration **must** match the lesson folder name (minus the `NN-`
> prefix) and the `module_slug` in lesson frontmatter. A slug typo silently
> misfiles or drops lessons.

> **Note on the `scripts/ingest` plan→diff→apply pipeline:** that pipeline seeds
> only the cert **scaffold** from a `content/<cert>/cert.yml` blueprint. **It does
> NOT load lessons.** Do not expect `content:apply` to import lesson content. (This
> was a real source of confusion; it is scaffold tooling, not lesson tooling.)

**Discrepancy report:** verify query at the bottom of each seed migration; run it
and confirm expected row counts.

---

### Stage 2 — Load lessons (markdown → `lessons` rows)  ★ CANONICAL STEP

**Source of truth:** the version-controlled markdown in `content/<cert>/`.
**Tool:** `supabase/scripts/load-lessons-direct.mjs`.

```powershell
# from the supabase repo root (has @supabase/supabase-js + scripts\.env)
$sb = "C:\Users\Juan\Documents\certidemy\supabase"
Set-Location -LiteralPath $sb
$env:CERT_ID = "<cert-uuid>"

# DRY RUN first — reports what would insert, writes nothing
node scripts\load-lessons-direct.mjs --in <path>\content\<cert> --lang en --dry

# LIVE — inserts only missing lessons (idempotent; skips existing)
node scripts\load-lessons-direct.mjs --in <path>\content\<cert> --lang en
```

The loader reads each lesson's frontmatter, resolves `module_id` by
`(certification_id, module_slug)`, and inserts via the Supabase JS `.insert()`
call. It sets `lesson_group_id = uuid_v5(cert_uuid, slug)` — the **same
deterministic UUID** Postgres's `uuid_generate_v5` produces — so the English row
and its future `es-419`/`pt-BR` siblings share a group id with no lookups. Rows
loaded this way are byte-identical to rows the SQL generator would have produced.

**Translations:** same command, different `--lang` (`es-419`, `pt-BR`), pointed at
the translated markdown. The group-uuid math ties each translation to its English
sibling automatically.

**Discrepancy report:** the loader prints `inserted / skipped(existing) /
missing-module`. `missing-module > 0` means a lesson's `module_slug` doesn't match
any seeded module (fix Stage 1). Re-running prints `inserted: 0` once complete.

> ### ⚠️ WHY WE DO NOT PASTE LESSON SQL INTO THE WEB EDITOR (hard-won)
> Loading lessons by pasting generated SQL into the Supabase web SQL editor is
> **unreliable and must not be used.** The editor's paste path corrupts multibyte
> characters (em-dashes `—`, curly quotes `“ ” ‘ ’`, ellipses `…`) inside large
> statements, which breaks string literals and throws errors like
> `relation "X" does not exist` (Postgres parsing corrupted content as raw SQL).
> This cost an entire session's worth of debugging on a single module. The API
> loader (`load-lessons-direct.mjs`) sends content as bytes over the API with **no
> clipboard and no SQL string parsing**, so this class of failure cannot occur.
> `gen-lesson-sql.mjs` remains only as a versioned/audit artifact; the loader is
> the real path.
>
> (If ever loading via SQL is unavoidable, ASCII-normalize the file first —
> convert `— – “ ” ‘ ’ …` to `- - " " ' ...` — and run it via `psql -f`, never a
> web-editor paste.)

**Verify all lessons landed:**
```sql
select m.order_index, m.slug, count(l.*) as lessons
from modules m
left join lessons l on l.module_id = m.id and l.language = 'en'
where m.certification_id = '<cert-uuid>'
group by m.order_index, m.slug order by m.order_index;
```
Expect the per-module lesson counts to match the authored set.

---

### Stage 3 — Wire (project concept/task tags into bridge tables)

**Source of truth:** each lesson's frontmatter `concept_slugs` and `task_codes`.
**Tool:** `supabase/scripts/wire-lessons.mjs`.

```powershell
$env:CERT_ID = "<cert-uuid>"
$env:DRY_RUN = "1"   # report only
node scripts\wire-lessons.mjs
$env:DRY_RUN = "0"   # write
node scripts\wire-lessons.mjs
```

It reads the loaded lessons from the DB, resolves each frontmatter `concept_slug`
to a concept id and each `task_code` to a task id (scoped to the cert), and upserts
`lesson_concepts` / `lesson_tasks`. Idempotent; re-run any time.

**Discrepancy report:** it prints any frontmatter slug that does **not** resolve
(an authoring error) instead of silently dropping it. A clean run reports the full
expected link counts and **zero unresolved slugs**. If lessons were authored
against the seeded concept list (they should be), this report is empty.

---

### Stage 4 — Prove coverage (the 17024 artifact)

```sql
select * from v_coverage_summary where certification_code = '<CODE>';
```

The governance-grade proof. For a fully-taught cert:

| column | meaning | target after Stage 3 |
|---|---|---|
| `concepts_total` | concepts in the cert | N |
| `concepts_taught` | concepts with a teaching lesson | **= N** |
| `concepts_tested` | concepts with a question | 0 until questions authored |
| `untaught_testing_violations` | tested-but-not-taught | **0** (must always be 0) |
| `taught_not_yet_practiced` | taught, no practice question yet | = N until questions authored |

**`untaught_testing_violations = 0` is the ISO/IEC 17024 "no untaught testing"
guarantee, proven live and queryable.** This view is a primary feed for the
governance/admin dashboard.

Supporting views (migration 066): `v_coverage_tested_not_taught` (must be empty),
`v_coverage_taught_not_tested`.

---

## 3. After the teaching layer: questions, then publish

Once `concepts_taught == concepts_total` with 0 violations, the teaching layer is
complete. Then:

1. **Generate question banks** (cert-agnostic generators, `CERT_ID`-parameterized,
   per domain): secure generator writes **zero** `question_concepts` (the secure
   firewall); practice generator writes via the practice RPC which auto-derives
   `question_concepts` from `task_concepts`. As questions land, `concepts_tested`
   climbs toward `concepts_total` and violations stay 0 (questions are grounded in
   taught, tagged concepts).
2. **Publish**: flip `is_published = true` once every domain clears its blueprint
   in all three languages.

---

## 4. New-cert checklist (the whole thing, condensed)

For cert **X** with uuid **U**, code **CODE**, content in `content/x/`:

1. **Scaffold** — author + run seed migrations (cert/domains/concepts/tasks, then
   modules). Verify module slugs == lesson folder names == frontmatter
   `module_slug`.
2. **Load** — `CERT_ID=U node scripts\load-lessons-direct.mjs --in ...\content\x --lang en`
   (dry, then live). Repeat per language for translations.
3. **Wire** — `CERT_ID=U node scripts\wire-lessons.mjs` (dry, then live). Confirm
   zero unresolved slugs.
4. **Prove** — `select * from v_coverage_summary where certification_code='CODE';`
   → `concepts_taught == concepts_total`, `untaught_testing_violations == 0`.
5. **Questions** — run the secure + practice generators per domain.
6. **Publish** — flip `is_published`.

Stages 2–4 are three commands and one query. The heavy lift for a new cert is
**authoring** the JTA and the lessons (creative work); the plumbing is fast and
repeatable. This is deliberate: the tooling exists so per-cert activation is
cheap, so the platform can add certs at a steady pace.
