# HANDOFF-v5.7-addendum — AIMS-F goes trilingual, and an acronym that does not exist

**Session date:** 2026-08-07 (morning, continuing from v5.7)
**Reads with:** `HANDOFF-v5_7.md`. This continues it.
**Migration tip:** **179 applied** · next free **180**
**Repos:** both clean and pushed

v5.7 closed with the English course complete and the lessons English-only. This
half made them trilingual, filled the JTA translations, and then spent most of
its time on a single word that does not exist in any language.

---

## 0. WHERE AIMS-F STANDS

| | |
|---|---|
| Status | **`coming_soon`** (flipped 2026-08-07 14:55, not by this session) |
| Lessons | **105** — 35 each in en / es-419 / pt-BR |
| Coverage | 154 / 154 taught, `untaught_testing_violations = 0` |
| Items | 1,890 — secure 8/task/lang, practice 10/task/lang, firewall 0 |
| JTA i18n | 10 domain rows + 70 task rows, **all `is_provisional=true`** |
| cert i18n | claim + description, three languages |
| Remaining loader gap | `gen-badges-module.mjs` only |

**Everything mechanical is done.** What remains before `available` is the
`CERT-PUBLISH-CHECKLIST` step 8 human review, plus badge artwork.

---

## 1. SGSIA DOES NOT EXIST

The lesson translator and the JTA translator, running on different prompts,
**independently invented the same non-existent acronym** and used it 67 times
across the lessons and 30-odd times across the task statements.

### Where it came from

`gen-jta-translations.mjs` carried a Rule 17 fixed rendering:

> `ISMS is SGSI in both.`

Correct, and necessary for ISMS-F. With no equivalent rule for the AI management
system, both models built one by analogy — `SGSIA` — and then drifted further to
`SGSI de IA`, which is worse: it reads as *information security management system
of AI*.

**The letters give it away.** `SGSI` unpacks as *Sistema de Gestión de **Seguridad**
de la Información*. The middle `S` is *seguridad*. `SGSIA` is therefore `SGSI`
with a letter appended, not an acronym derived from *sistema de gestión de IA* —
which would give `SGIA`.

### What the market actually uses (verified 2026-08-07)

| form | who |
|---|---|
| *sistema de gestión de IA*, spelled out | BSI, DEKRA, and the official adoption |
| **SGIA** | Bureau Veritas, iso.cat |
| **AIMS**, kept in English | Intertek, G-CERTI |
| **SGSIA** | **nobody** |

The Spanish adoption is **UNE-ISO/IEC 42001**, titled *Tecnología de la
información — Inteligencia artificial — Sistema de gestión*. Spelled out, no
acronym.

### The ruling

**Spell it out.** `SGIA` is defensible but minority usage, and a learner who meets
an acronym in a task statement and never in a lesson has no way to resolve it.
The lessons already spelled it out; the JTA now matches.

### Where it hurt most

Four task statements and six lesson files had `SGSI` naming the AI management
system outright. Two were serious:

- **Task 3.7, pt-BR:** *"mecanismos de suporte e operação de um SGSI existente se
  aplicam a um SGSI de IA"* — the task whose entire point is distinguishing the
  two systems, giving both the same name.
- **Lesson 05-02 es-419, checkpoint q1 KEY:** *"los requisitos propios de la
  organización para su SGSI"* — the correct answer to a question about what
  internal audit tests, naming the wrong management system.

### What was fixed

| commit | what |
|---|---|
| `f5cd8c4` | `gen-jta-translations.mjs` terminology rule + `FORCE=1 ONLY=tasks` re-run |
| `cf73b93` | `translate-lessons.mjs` — same rule, its own prompt |
| `6b93649` | 15 lesson files re-translated, 67 `SGSIA` removed |
| `3e5d70a` | 6 files where `SGSI` named the wrong system |
| `e65a2d4` | `fix-lesson-sgsi-drift.ps1`, per-anchor counts |

**Ten `SGSI` references survive and all are correct** — `02-04`, `03-06`,
`03-07`, `04-07`, `05-06`, each in both languages, every one genuinely about the
information security management system.

### The generalisable finding

> **A fixed-rendering rule for one standard becomes a template the model extends
> to standards it has no rule for.**

Any future standards-based cert inherits that `SGSI` line and will do the same.
The rule is now stated for 42001; **the next cert on a new standard needs its own
before the first translation run, not after.**

---

## 2. WHAT THE TRANSLATOR GETS RIGHT

Worth recording, because the acronym failure is not representative.

**Rule 17 without being told.** `01-04` es-419 came back with `capítulo` 24 times,
`apartado` 8, and `cláusula` **zero** — the convention ISMS-F established,
reached independently. pt-BR used `Seções` correctly throughout.

**The validator earned its place.** `translate-lessons.mjs` validates output
against the English source and refuses to write on mismatch. It caught a
duplicated glossary marker in `05-03` es-419 and **refused seven consecutive
times**. The file was hand-written instead. Without that check, a lesson with
broken glossary rendering would have shipped silently in Spanish.

**Prose quality is genuinely good.** *"Las partes familiares no son donde debe
concentrarse tu atención"* is written Spanish, not translated English.

---

## 3. OPEN — REGISTER DRIFT

The one defect class the mechanical sweeps cannot catch.

`01-04` es-419 uses informal **tú** — *"tu atención"*, *"sabes"*.
`05-02` es-419 uses formal **usted** — *"Usted indicó"*.
ISMS-F uses informal.

Nothing is wrong per lesson; the inconsistency is across the set, and a learner
reading several in sequence will notice. **This is review work, not script work**,
and it belongs in the step 8 pass.

Worth adding a register line to the translator prompts once the convention is
confirmed — informal, matching ISMS-F.

---

## 4. CARRIED FROM v5.7, STILL OPEN

1. **`is_provisional=true` on all 80 JTA translation rows.** `render-asset`
   filters them out, so Spanish and Portuguese blueprint sheets render domain
   sections in English until a human flips the flag. That is the pipeline working
   correctly. **Note the caching caveat in the script header: neither PDF's cache
   key includes a domain stamp, so flipping the flag will not by itself refresh an
   already-generated sheet — fix `render-asset` before the flip.**
2. **The ISO/IEC 42006 claim.** A task 5.5 secure item asserts 42006 *"is a
   distinct standard, not a sector extension of ISO/IEC 17021-1."* Nobody has read
   42006. ISO/IEC 27006 supplements 17021-1 for 27001; if 42006 follows that
   pattern the explanation is wrong and its own distractor is closer to true.
3. **The item bank is 1,890 items, of which ~16 have been read.**
4. **Task 4.1's critic disagreed** with the ten-objectives finding twice. The
   critic is wrong — A.6.1 and A.6.2 each carry an objective — but expect
   pushback from anything trained on the common summary.
5. **`gen-badges-module.mjs`** — artwork pending from marketing.
6. **A rendered read of the course**, three languages. Both v5.5 UI defects were
   found by a person looking.

---

## 5. THE LESSON

v5.7 said: the instrument that could be wrong was the one producing confident
prose; the instrument that could not was the one computing an answer.

This session adds a case where **both instruments were the same kind of thing**.
Two translators, two prompts, one shared ancestor rule — and they produced the
same invented term independently. No sweep would have caught it, because the sweep
would have to know the term was wrong, and nothing in the pipeline knew that.

What caught it was reading the output and asking a question a machine cannot ask:
*is this a real word?* Then checking. The answer took one search and settled a
publishing decision.

> **A term the pipeline invents is indistinguishable from a term it knows, and
> the only test is whether it exists outside the pipeline.**
