# Next session — AIMS-IA (ISO/IEC 42001:2023 Internal Auditor)

Paste this at the start of the new chat.

---

Continuing Certidemy. Read **HANDOFF-v6_8.md**, then **v6.7**, **v6.6** and
**v6.5** — v6.5 through v6.7 are the Level II pipeline build, v6.8 is what
publishing ISMS-IA actually took. Also **CERT-PUBLISH-CHECKLIST.md**,
**CERT-CREATION.md** and **TERMINOLOGY-POLICY.md** (Rule 17 is new).

**State:** ten certifications live. ISMS-IA published last session — the first
Level II, 912 secure items and 1,140 practice across three languages, 39 verify
checks passing. Migration tip **204**, next free **205**. Supabase `13193aa`,
web `a02aa7f`.

**This session: build AIMS-IA — ISO/IEC 42001:2023 Internal Auditor.** It is the
Level II sibling of AIMS-F and the direct analogue of ISMS-IA. Most of what
ISMS-IA needed now exists; this should be configuration and content, not
discovery.

---

## Before generating anything

**Three fixes that will otherwise cost yield or repeat known defects.**

1. **Add the ISO 19011 annex list to the AUDIT grounding.** The critique reviewer
   has the edition set but not the contents, so it rejects correct citations to
   annexes it cannot verify — it threw out a correct reference to Annex A.17
   ("Conducting interviews", which the 2026 edition does contain) during the
   ISMS-IA run. Same grounding block serves AIMS-IA.

2. **Decide the grounding edition set for 42001 and verify it against the PDF in
   the project**, not from memory. ISO/IEC 42001:2023, ISO/IEC 42006 for
   certification bodies, ISO 19011:2026 as the audit methodology, ISO/IEC 27001
   where the scopes overlap. Check the modal language the way 19011 was checked —
   `grep -c` for "shall" against "should" — before any item asserts a requirement.

3. **Declare `cue_tolerance` on AIMS-IA's `exam_blueprint.item_model`** in its
   seed migration. Level II options carry a qualifying clause; the L1 default of
   5 chars / 10% rejects correct items. ISMS-IA uses 25 / 15 / spread 100 with the
   measured justification in migration 200 — reuse the reasoning, and re-measure
   once the bank exists rather than assuming the same numbers fit.

---

## The build, in order

**Stage 1–8 per CERT-CREATION.md** — JTA, domains, tasks, concepts, lessons.
AIMS-F's JTA is the closest reference for subject matter; ISMS-IA's is the closest
for shape, since both are internal-auditor schemes with the same five-domain
arc: the audit function, the programme, conducting the audit, auditing the
management system against its standard, and findings through follow-up.

**Stage 9, generation.** Working settings from ISMS-IA:

```
CHUNK=3
BANK_REVISION=v3-l2
```

Cue tolerance now comes from the blueprint, not env — do **not** set
`KEY_LEN_MARGIN` / `KEY_LEN_PCT` / `LEN_SPREAD_MAX`. If the generator prints
`(default)` rather than `(blueprint)`, the seed migration did not declare it.

The tier gate is `tier >= 2 AND bloom_level = '4_analyze'`, per task. Apply and
understand tasks correctly stay on the Level I contract — do not force
four-defensible onto a task with one right answer.

**Then the six surfaces**, all of which `verify-cert` now checks:

| Surface | How |
|---|---|
| Catalogue claim ×3 | English in a migration, es-419 + pt-BR via `load-cert-i18n.mjs` |
| Long-form description ×3 | copy `load-isms-ia-descriptions.mjs` |
| Domain + task translations | `gen-jta-translations.mjs`, `CERT_ID` + `ONLY=all` |
| Public samples | 6 groups, 6 **distinct** tasks, blueprint-weighted |
| Badge | `certidemy-web/public/badges/AIMS-IA.png` |
| Translation review | `gen-translation-review.mjs`, then flip `is_provisional` |

**Scheme decisions to make deliberately, not inherit:**

- **Validity.** ISMS-IA is 730 days; 42001 is a 2023 standard with no amendment
  yet, so the multi-year-revision argument is weaker. Decide on 42001's own
  revision picture and record the reasoning in the migration.
- **Exam duration.** ISMS-IA is 150 minutes for 50 items at 3.00 min/item, from a
  measured reading load. Re-derive from AIMS-IA's own item lengths and cognitive
  profile rather than copying the number.
- **`num_questions` and `passing_score_pct`.** ISMS-IA is 50 at 75%.

---

## How I want this session run

**Single-line anchors only** for any patch. Six of seven patch failures last
session involved multi-line matching, and line endings differ per repo — the
supabase `.md` files are LF, the web repo's scripts are CRLF.

**Post-check the shape, not just the presence.** A patch whose block collapsed
onto one line passed `node --check` and did nothing, twice. Read the file back as
lines and fail if the block is one long line.

**`node --check` parses, it does not resolve.** After any patch touching imports,
run `node -e "import('./path.mjs')"`.

**One variable per measurement.** Last session four generator settings were
changed at once and the result attributed to one of them. It was wrong.

**Read before overwriting.** A seeded description was replaced without being read
first, and the replacement dropped a distinction the JTA exists to test.

**Verify claims against the source, not against a reviewer's verdict.** An
external review's top finding on ISMS-IA was refuted by one query. Accept
concrete craft notes; check named-document claims yourself.

---

## Also owed, lower priority

- **K/S/A review pass** for ISMS-IA. `ksa_is_provisional` is a separate flag; the
  site withholds those fields until reviewed, so the blueprint drawer shows
  nothing for them in es-419 and pt-BR.
- `exam_blueprint.item_model.cue_guard` documents a qualification-density guard
  that does not exist — the guard measures characters.
- LESSON_AUTHORING_SPEC §7.4 missing (highlight-mistake cites it).
- 16 tasks across the catalogue with create-verb skills fields (WARN).
- **ISMS-F task 2.3** says "environmental-conditions"; Amd 1:2024 says "climate
  change". Visible in the live Open Badges Achievement JSON, not just a DB row.
- CAIP-I (Level II slot in the AI Essentials ladder) — unbuilt.
- PL 2338 (Brazil) — re-verification trigger for AIHR-I Domain 2 if it passes.
