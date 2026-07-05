# TRANSLATION-PIPELINE.md

**The canonical path for translating a certification's lessons into es-419 and
pt-BR.** Read this before starting any lesson translation — it captures the DSL
schema the translator must preserve, so you begin knowing the rules rather than
rediscovering them per cert.

> **Read-first rule.** If the task is "translate lessons," open this document
> first. It is the playbook: the tool, the frozen/translated schema, the load
> step, and the verification. Do not reconstruct this by inspecting files live.
> (Same discipline as `LESSON-PIPELINE.md` for scaffold→lessons→questions and
> `LESSON_AUTHORING_SPEC.md` for authoring.)

> **Status:** English lessons are the source of truth. es-419 / pt-BR lesson
> localization is a **post-launch content gap** for every cert (the scheme docs
> state this transparently; practice + exam item banks are already trilingual, so
> a candidate can test in any language before lesson study is fully localized).

---

## 0. The one-paragraph version

Lessons are a strict custom DSL (block directives, glossary spans, embedded JSON
widgets/checkpoints). Translate the **prose only**, preserve **everything
structural byte-for-byte**. The tool `supabase/scripts/translate-lessons.mjs`
(cert-agnostic) does this and **validates every file against its English source**,
skipping anything that fails rather than writing a broken lesson. Disk-first:
translated `.md` files land under `content/<cert>/_i18n/<lang>/`, get committed
(the git history is the change-control evidence), then load via the canonical
`load-lessons-direct.mjs`. **No re-wire** — translations share the English
`lesson_group_id` and inherit its concept/task links automatically.

---

## 1. Canonical tool

| Tool | Path | Role |
|---|---|---|
| `translate-lessons.mjs` | `supabase/scripts/` | Cert-agnostic translator; validate-by-graft; writes translated `.md` (disk-first) |
| `load-lessons-direct.mjs` | `supabase/scripts/` | Canonical loader (API, paste-proof) — loads the translated files |

**Do NOT** pair the translator with any `gen-*-lesson-sql.mjs` path. That SQL
route is the paste-prone method the direct loader exists to replace (see the
web-editor corruption warning in `LESSON-PIPELINE.md` §2, Stage 2).

The tool is named `translate-lessons.mjs`, not `translate-<cert>-lessons.mjs`, on
purpose: it is cert-agnostic (`--in` selects the content dir; nothing inside names
a cert). A tool used for multiple certs must not be named for one.

---

## 2. What the translator preserves vs. translates (the DSL schema)

This is the schema the validator enforces. It is the reason a naive
"translate this file" would destroy the lesson.

### FROZEN — copied byte-for-byte (a mismatch fails validation and skips the file)

- **Frontmatter keys** except `title` / `subtitle` / `preview`:
  `lesson_id`, `module_slug`, `certification_code`, `lesson_group_id`,
  `order_index`, `duration_minutes`, `task_codes`, `concept_slugs`,
  `prerequisites`, `authors`, `status`. These are join keys and the
  group-uuid seed — changing any breaks loading or linking.
- **`language`** is force-set to the target deterministically (not trusted from
  the model).
- **Block-directive structure**: every `::<keyword>` marker (`::hook`,
  `::concept`, `::callout`, `::interactive`, `::checkpoint`, `::summary`,
  `::diagram`, `::deep-dive`, …), the marker *sequence*, and every `::` closer.
- **Marker attributes** except `title=` and `caption=` (those are prose):
  `type=`, `widget=`, `id=`, `concept_slugs=` stay verbatim.
- **Glossary slugs**: in `[label]{glossary="slug"}`, the `slug` is frozen (the
  `label` translates).
- **Embedded JSON structural keys**: `id`, `type`, `widget`, `bloom_level`,
  `diagram_type`, `next`, `correct`, `correct_order`, `depends_on`, `best_path`,
  `concept_slugs`, `difficulty`, `minimum_correct`, `completion_threshold`,
  `x`, `y`, `is_correct`, `allowReuse`. The validator blanks all *other* string
  leaves and requires the two JSON blocks to be structurally identical after
  blanking — so a moved `id`/`correct`/`type` is caught.
- **highlight-mistake widget**: each `highlights[].span` must remain a verbatim
  substring of the translated `text`.

### TRANSLATED — natural, professional target language

- Frontmatter `title`, `subtitle`, `preview`.
- All body prose, list items, callouts, summaries.
- `::concept title="…"`, `::deep-dive title="…"`, `::diagram caption="…"`.
- The bracketed **label** in `[label]{glossary="slug"}`.
- Every human-readable JSON string: `text`, `question`, `explanation`, `label`,
  `intro`, `scenario_title`, `situation`, `feedback`, `span`, `alt_text`,
  `off_consequence`, `on_consequence`, `reflection_prompt`, `reflection_answer`,
  and the `text` of any `options`/`items`/`targets` entry.

### KEPT IN ENGLISH (inside translated prose)

Scrum proper nouns / framework terms / acronyms: Scrum, Sprint, Sprint
Planning/Review/Retrospective, Sprint Backlog, Sprint Goal, Product Backlog,
Product Backlog Item, Product Owner, Scrum Master, Developers, Scrum Team,
Increment, Product Goal, Definition of Done, Daily Scrum, Scrum Guide, INVEST,
ROI, MVP, DoD, KPI, OKR, TDD, CI, CD, and the brand name Certidemy.

### Widget coverage

The frozen JSON model covers all widget schemas by construction (it freezes
structural keys and blanks prose, rather than enumerating widgets). Known widget
types across current certs: `drag-match`, `sort-into-order`,
`toggle-and-observe`, `highlight-mistake`, `scenario-mcq`, `annotated-diagram`.
SD-AI-I uses `drag-match` and `toggle-and-observe` — both covered. If a new
widget introduces a *structural* key not in the frozen set, add it to
`STRUCTURAL` in the tool and note it here.

---

## 3. The procedure

### Stage 1 — Translate (one language per run), smoke-test on ONE lesson first

From the **certidemy-web** repo root (where `content/` lives):

```powershell
Set-Location -LiteralPath 'C:\Users\Juan\Documents\certidemy\certidemy-web'
# smoke test: one lesson, inspect before scaling
node ..\supabase\scripts\translate-lessons.mjs --in content\<cert> --lang es-419 --only <lesson_id>
# then the full run for the language
node ..\supabase\scripts\translate-lessons.mjs --in content\<cert> --lang es-419
# repeat for pt-BR
node ..\supabase\scripts\translate-lessons.mjs --in content\<cert> --lang pt-BR
```

Output lands in `content\<cert>\_i18n\<lang>\…`. The tool prints `ok` / `FAIL`
(with the exact validation error) / `skip (exists)` per lesson. **A FAIL is the
validator refusing to write a structurally broken file** — re-run that one with
`--only <lesson_id> --force` after eyeballing; do not hand-fix and load a file the
validator rejected.

### Stage 2 — Inspect the smoke-test lesson (before scaling)

Open the translated `_i18n/<lang>/<…>.md` beside its English source and confirm:
prose is translated; every `::` directive and closer is intact; the embedded JSON
still parses and its `id`/`correct`/`type`/`concept_slugs` are unchanged; glossary
slugs unchanged; Scrum nouns still English; frontmatter frozen fields unchanged and
`language:` flipped. The validator checks all of this mechanically, but a human
read of the first lesson confirms the *translation quality*, which the validator
cannot judge.

### Stage 3 — Commit the translated files (change-control evidence)

```powershell
Set-Location -LiteralPath 'C:\Users\Juan\Documents\certidemy\certidemy-web'
git add -- "content/<cert>/_i18n"
git commit -m "content: <cert> lessons es-419 + pt-BR (translated + validated)"
git push
```

### Stage 4 — Load (canonical, paste-proof), per language

From the **supabase** repo root:

```powershell
Set-Location -LiteralPath 'C:\Users\Juan\Documents\certidemy\supabase'
$env:CERT_ID="<cert-uuid>"
node scripts\load-lessons-direct.mjs --in ..\certidemy-web\content\<cert>\_i18n\es-419 --lang es-419 --dry
node scripts\load-lessons-direct.mjs --in ..\certidemy-web\content\<cert>\_i18n\es-419 --lang es-419
# repeat --lang pt-BR
```

The loader is idempotent (skips existing `(slug, language)` rows) and computes
`lesson_group_id = uuidV5(lesson_id, CERT_ID)` — the **same** id as the English
sibling — so the translated rows join the English row's group with no lookups.

### Stage 5 — Verify (count, not console)

```sql
-- Every module should now show en / es-419 / pt-BR lesson counts in lockstep.
select l.language, count(*) as lessons
from lessons l join modules m on m.id = l.module_id
where m.certification_id = '<cert-uuid>'
group by l.language order by l.language;

-- Group integrity: each lesson_group_id should hold one row per loaded language.
select rows_in_group, count(*) as groups from (
  select lesson_group_id, count(*) rows_in_group
  from lessons l join modules m on m.id = l.module_id
  where m.certification_id = '<cert-uuid>'
  group by lesson_group_id) g
group by rows_in_group order by rows_in_group;
```

**No re-wire step.** `wire-lessons.mjs` projects `lesson_concepts` /
`lesson_tasks` per `lesson_group_id`; the English row already populated those for
the group, and the translated rows share the group id, so they inherit the links.
(Confirm once per cert with a spot check if desired; do not re-run wire expecting
it to add rows for translations — it won't, and doesn't need to.)

---

## 4. New-language checklist (condensed)

For cert **X** (uuid **U**, content `content/x/`), language **L**:

1. **Smoke test** — `translate-lessons.mjs --in content\x --lang L --only <one-lesson>`; inspect.
2. **Translate all** — `translate-lessons.mjs --in content\x --lang L`; resolve any FAILs with `--only … --force`.
3. **Commit** — `git add content/x/_i18n` in certidemy-web; push (change-control evidence).
4. **Load** — `load-lessons-direct.mjs --in ...\content\x\_i18n\L --lang L` (dry, then live).
5. **Verify** — per-language lesson counts in lockstep; group integrity clean. No re-wire.

---

## 5. Why this is a 17024 artifact

ISO/IEC 17024 expects a certification body to operate **documented, controlled
procedures** so that quality is repeatable and not person-dependent. This document
+ the versioned translated `.md` files (whose git history is the change record) +
the validate-or-skip discipline (structure guaranteed by the tool, not by trust)
are the management-system evidence for how localized content is produced. The
translation step is named honestly as a post-launch content gap in each
`SCHEME-*.md`; this procedure is how that gap is closed under control.
