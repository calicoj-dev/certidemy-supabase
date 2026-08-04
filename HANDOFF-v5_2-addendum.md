# HANDOFF v5.2 — addendum

**Session date:** 2026-08-04 (same session as v5.2)
**Covers:** the ISMS-F JTA translation wave, the pack-block generator, and two
K/S/A gaps found on the way
**Migration tip:** 173 · **next free 174** — unchanged, this stretch ran no SQL
**Repos:** both clean and pushed

Read v5.2 first. This is a delta, not a replacement.

---

## 1. What shipped

**ISMS-F JTA translations: 108 rows, corrected, pack-backed.**

| | rows | flag |
|---|---|---|
| `domain_translations` | 10 (5 domains x 2 langs) | `is_provisional = true` |
| `task_translations` — statement | 98 (49 tasks x 2 langs) | `is_provisional = true` |
| `task_translations` — K/S/A | 98 rows, 3 columns each | `ksa_is_provisional = true` |

Everything is provisional. Nothing is approved. That is correct — the external
review has not run.

**ISMS-F has a FULL pack block, not a stub.** HANDOFF v2.9 measured what stubs
cost: the two certs whose blocks were stubs carried six stale task statements
between them; the four with full blocks carried zero. Block shape predicted
staleness exactly. ISMS-F is the first cert to get a full block *at the time of
translation* rather than retrofitted.

### Commits — `certidemy-web`

| commit | what |
|---|---|
| `1e4f5eb` | pack block (108 rows), `gen-i18n-pack-block.mjs`, `fix-isms-f-ksa.mjs`, two patch scripts, `load-cat-i18n.mjs` header |

### Commits — `supabase`

| commit | what |
|---|---|
| `afc1271` | Rule 17 ISO vocabulary in `gen-jta-translations.mjs`; `CERT_ID` now mandatory |

---

## 2. TWO GAPS — neither is closed

### 2.1 `verify-cert.mjs` does not check `ksa_is_provisional`

Lines 321-322 select `is_provisional` only; 564-568 filter on it alone.

**A certification can pass the `i18n.approved` invariant and publish with
unreviewed machine-translated K/S/A** rendering in the JTA sheet and the
Blueprint Drawer. That is the precise failure migration 165 was created to
prevent, and the publish gate does not enforce the flag that migration added.

Not live today — nothing is published and every ISMS-F K/S/A row is provisional.
**Catalog-wide, not ISMS-F-specific.** Patch `verify-cert` before any cert
carrying K/S/A moves to `available`.

### 2.2 Nothing flips `ksa_is_provisional` to false

`load-jta-i18n.mjs`'s upsert payload is
`{ task_id, language, statement, is_provisional }`. K/S/A columns and their flag
are untouched by `--approve` — correct behaviour, since approving statements must
not silently approve unreviewed K/S/A. But it means **no approval path exists.**

HANDOFF v4.2 records 604 K/S/A rows "translated and reviewed — flags flipped."
**Find how that was done before writing anything new.** Likely a migration.

---

## 3. New tooling

### `certidemy-web/scripts/gen-i18n-pack-block.mjs`

Emits a `load-jta-i18n.mjs` pack block for one cert, **read from the live
database**, `\uXXXX`-escaped, with a hard ASCII self-check that exits non-zero if
a single non-ASCII character leaks in.

```
node scripts/gen-i18n-pack-block.mjs --cert <CODE> --out <file>
```

Reports completeness and approval counts to stderr, block to stdout or file.
Cert-agnostic; use it for the next cert too.

### `certidemy-web/scripts/insert-isms-f-pack-block.ps1`

Inserts the block into the PACK object. **Finds the closing brace rather than
counting lines**, and refuses to write unless six guards pass: block is ASCII,
opens and closes correctly, carries the expected domain and task counts, the cert
is not already present, and exactly one closing brace is located.

A misplaced brace here does not throw — it produces a short block and the loader
reports success for whatever it found. That is the v2.9 failure, and it is
silent.

### `certidemy-web/scripts/fix-isms-f-ksa.mjs`

Targeted K/S/A corrections. UPDATE only, never upsert. **Asserts the current
value before each write** and skips with a report if a row changed since review,
rather than overwriting. Each edit carries its reasoning inline, same pattern as
`patch-domain-translations-terminology.mjs`.

---

## 4. FINDINGS

### 4.1 Dry-run output is not the text that gets stored

`gen-jta-translations.mjs` runs at temperature 0.2. **Two consecutive dry runs of
the same cert produced different strings** — `preocupação` became `ansiedade`,
`orienta a seleção entre eles` became `seleciona entre eles`.

Six defects were reported from dry-run output. Reading the stored rows:

| Reported | Verdict |
|---|---|
| 3.11 es-419 vs D3 description | **phantom** — both correctly say `evaluación del riesgo` |
| pt-BR `deployment` at 4.4/4.6 | **phantom** — both say `implantação` |
| 3 others | confirmed |
| — | **2 new defects** no dry run had shown |

**One third of the list was wrong in each direction.** A dry run shows whether
the *rules* are being obeyed. It says nothing about the text. **Review the
database.**

### 4.2 Rule 17 landed at statement level and slipped in K/S/A

Every one of the 98 statements rendered `clause` correctly. But task 2.3's
es-419 **knowledge** said `los capítulos 4.1 y 4.2` where task 5.1's statement
said `apartado 9.1` — same granularity, different word, one cert.

Cause: **`ONLY=ksa` is a separate pass, and the glossary is per-call.** Not a
one-off. **Any future `ONLY=ksa` run has the same exposure**, and K/S/A is three
times the string volume of statements. Check K/S/A separately against the
glossary rules; passing statements do not vouch for it.

### 4.3 The two review queries earn their keep

From v4.2. Across 96 negation-bearing fields in ISMS-F, **zero inversions** —
including 5.8's double negation (*"la ausencia de alertas no es evidencia de
ausencia de incidente"*), which is where machine translation usually breaks.
Long-token sweep: zero. Mojibake: zero.

Run all three fields. `abilities` alone covers a third of the payload; **skills
is the truth-teller line and what item generation reads.**

### 4.4 `CERT_ID` had a silent fallback and it is now removed

`gen-jta-translations.mjs` line 96 defaulted to SM-AI-I. A forgotten env var
would have written machine translations into a cert with 116 reviewed, approved
rows — silently. Same `DEFAULT_CERT_CODE` pattern deleted from the generator
scripts after four bugs. **Now exits with instructions.**

### 4.5 Rule 17 changed six renderings in five domain rows

Before the glossary patch, the dry run produced `cláusulas 4 e 5` (pt) and
`cláusulas 4 y 5` (es). After: `Seções` and `capítulos`. Had the pass run
unpatched, the error would have propagated through all 49 statements and all 98
K/S/A rows.

**A terminology document the generator never reads is decoration.** The glossary
lives inline in `translateSystem()`; that is where a rule has to land.

---

## 5. Corrections applied to ISMS-F, with reasoning

| Where | Field | Was | Now | Why |
|---|---|---|---|---|
| D1 pt-BR | description | `superfície de ataque` | `superfície de ameaça` | English distinguishes THREAT surface (D1) from ATTACK surface (1.5). es-419 preserved it; pt-BR collapsed both |
| D3 pt-BR | description | `uma avaliação convencional` | `um processo de avaliação de riscos convencional` | Bare `avaliação de riscos` is the third step; D3's own title says `Processo de` |
| 2.3 es-419 | knowledge | `los capítulos 4.1 y 4.2` | `los apartados 4.1 y 4.2` | Rule 17 granularity — see 4.2 |
| 2.3 es-419 | abilities | `en sí mismo` | `en sí misma` | Agrees with `determinación` |
| 1.1 pt-BR | abilities | `rederivação` | `sem precisar deduzi-lo novamente` | Coinage, not Portuguese |
| 4.11 pt-BR | knowledge | `de forma relevante` | `de forma significativa` | Its own statement says `significativa`; 4.11 is the null-result task and the claim's precision is the teaching point |
| 5.4 es-419 | skills | `una instancia` | `un caso` | Anglicism; in Spanish it means a petition or court instance. pt used `ocorrência` |

---

## 6. For the reviewer — three things that look like defects and are not

1. **es-419 alternates `capítulo` and `apartado`.** `capítulo` for a whole
   top-level division (2.2, 2.6), `apartado` for a numbered sub-requirement
   (5.1). Rule 17, deliberate.
2. **Task 4.11's null result is the point.** Its teaching content is that AI does
   *not* materially change physical controls.
3. **es-419 risk vocabulary follows ISO 31000:2018**, where `evaluación` is the
   whole process and `valoración` the third step. Most Spanish 27001 material
   still uses the superseded 2010 rendering (`apreciación` / `evaluación`) and
   will look inconsistent with ours. It is the older material that is stale.

---

## 7. NEXT

1. **External review of the 108 rows.** Pull the CSV from the SQL editor, not the
   console — clean UTF-8 in transit, and it avoids the PS 5.1 ANSI display
   problem. Send §6 with it.
2. **`node scripts/load-jta-i18n.mjs --cert ISMS-F --approve`** after sign-off.
   Flips statements and domains. Will not touch K/S/A.
3. **Close gap 2.2** — find how v4.2 flipped 604 K/S/A flags, then do the same
   for ISMS-F's 98.
4. **Close gap 2.1** — patch `verify-cert` to check `ksa_is_provisional`.
   Catalog-wide; do it before any K/S/A-carrying cert reaches `available`.
5. **Stage 7 — 49 lessons.** Folders `content/isms-f/01-information-security-fundamentals/`
   … `05-evaluation-improvement-certification/`; `module_slug` in frontmatter
   equals the bare slug. **The 27000:2026 citation rule bites at D2**, where the
   definitions live: no lesson cites ISO/IEC 27000 as a definitional source, and
   task 1.4 teaches that 27000 is now the Overview rather than the vocabulary
   standard.

Everything in v5.2 §8 still stands, including the `17024` surface sweep, which
must precede `SCHEME-ISMS-F.md`.
