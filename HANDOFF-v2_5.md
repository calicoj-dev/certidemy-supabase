# HANDOFF-v2.5 — JTA Translation Backfill + a Correction

Delta from HANDOFF-v2.4, same session. Everything below is committed and pushed.

**Migration tip: 117. Next migration is 118.**

---

## 0. CORRECTION TO v2.4 — read this first

v2.4 recorded, under "STILL OPEN, AND IT IS THE BIG ONE":

> *In-lesson checkpoints do not reach the server... the learning loop is open.*

**That was wrong.** The loop is closed. `ConceptQuizButton` sits directly below
every checkpoint in both FocusMode and ReviewMode; it calls
`fetchConceptPractice` for the lesson's concepts, receives a real `session_id`,
and hands it to `QuizPlayer` — which submits through the engine. **Mastery and
FSRS update there.**

The design is a deliberate split:

| | what it is | reaches the engine |
|---|---|---|
| **Checkpoint** | formative — self-check while reading | no |
| **Concept quiz** | summative — the one that counts | **yes** |

That is legitimate instructional design. The only actual defect was that
**nothing told the learner which was which**: they finish a checkpoint, read
"You got 3 out of 4 correct", and reasonably assume it counted. Fixed with one
line of copy on the completion panel, trilingual.

**DO NOT wire `CheckpointView` to `submit-quiz-answer`.** Checkpoint questions
are authored in lesson frontmatter with ids local to the lesson (`q1`, `q2`),
not `quiz_questions` UUIDs — there is nothing to submit against. Promoting them
into the bank would be a content-model change with practice/secure pool
implications, not a plumbing fix. The misleading SCOPE WARNING comment at the
top of `checkpoint.tsx` has been corrected in place for the same reason.

---

## 1. JTA translation backfill — COMPLETE

The gap v2.4 called "the largest remaining, and the one thing standing between
this and something a Spanish speaker would pay for" is closed.

| cert | tasks | es-419 | pt-BR |
|---|---|---|---|
| AIE-I | 18 | 18 | 18 |
| AIGRM-I | 51 | 51 | 51 |
| AISM-I | 61 | 61 | 61 |
| SD-AI-I | 45 | 45 | 45 |
| SM-AI-I | 53 | 53 | 53 |
| SPO-AI-I | 46 | 46 | 46 |

**19 domains + 175 tasks + 4 stragglers, both languages. ~392 strings.**
Zero mojibake.

### `scripts/load-jta-i18n.mjs`

One script, keyed by cert code. `--cert <CODE> [--dry] [--approve]`.

**Through the API, never the SQL editor** — every string carries accents, and
the editor is this project's known source of double-encoded UTF-8. **All
non-ASCII is `\uXXXX`-escaped in the source**, so the file itself is pure ASCII
and cannot corrupt in transit; Node decodes at runtime. Worth copying that
habit for any future content loader.

### Translation policy — these are exam-bearing strings

A JTA task statement is the exact wording an item is built against, so:

**Bloom verbs map one-to-one and stay put.** Distinguish→Distinguir,
Recall→Recordar, Apply→Aplicar, Choose→Elegir/Escolher, Recognize→Reconocer/
Reconhecer. Never substitute a more natural synonym: the verb carries the
cognitive level, and `bloom_level` is checked against it.

**Regulatory terms follow the OFFICIAL language versions**, not literal
translation. The EU AI Act exists in Spanish and Portuguese:
- provider → *proveedor* / *prestador*
- deployer → *responsable del despliegue* / *responsável pela implantação*
- GPAI → *IA de uso general* / *IA de finalidade geral*
- NIST AI RMF, ISO/IEC 42001 — proper names, untranslated.

**"governance" → "gobernanza", not "gobierno."** Both are defensible literal
translations; the official Spanish Act uses *gobernanza* (Art. 10 is "Datos y
gobernanza de datos"), as do the Spanish ISO governance standards. A scheme
claiming to be grounded in an instrument should not diverge from it on the
most-repeated term in the cert.

**Scrum artifact and role names stay in ENGLISH in every language** — Sprint
Backlog, Increment, Definition of Done, Developers, Product Owner, Sprint Goal.
Not a preference: SM-AI-I and SPO-AI-I were already translated that way, and a
second convention inside one program is worse than any single wrong word.

**Service-management terms** use the field's established Spanish/Portuguese
forms (*sistema de valor del servicio*, *cocreación de valor*, *utilidad y
garantía*, *principios rectores*, *flujo de valor*, *mesa de servicio* /
*central de serviços*) while staying clear of ITIL's proprietary phrasing —
the same line AISM-I walks in English.
**`human-in-the-loop` / `human-on-the-loop` stay in English**: AISM-I task 4.13
turns on the distinction between them and no settled translated pair preserves
it.

### EVERYTHING IS `is_provisional = true`

All ~392 strings are AI-drafted and **unreviewed**. `--approve` per cert flips
the flag after Grok signs off. That column is a real governance artifact: the
scheme can state truthfully that AI-drafted translations are marked provisional
until an external reviewer signs off, and the flag proves it is enforced rather
than asserted. **This is the last step before the four certs can honestly claim
to be trilingual products.**

Both facts belong in the scheme docs: the terminology policy above, and the
provisional-until-reviewed process.

### Mojibake detection — use the refined query

The blunt `%Ã%` check FALSE-POSITIVES on legitimate uppercase Portuguese
(`NÃO`). The corruption signature is `Ã`/`â` followed by a NON-letter, which
never occurs in real Spanish or Portuguese:

```sql
select count(*) from public.task_translations
 where statement ~ '(Ã|â)[^A-Za-zÀ-ÿ]';
```

---

## 2. Also landed since v2.4

- **Learner home** gained the earned-credentials section, progress rings from
  deduped lesson counts, and a credential-count pill in the header.
  **EARNED stays BELOW IN PROGRESS**: the daily user opens this page to find
  what to do next, hundreds of times; achievements first makes every working
  visit scroll past a trophy case, and it degrades as credentials accumulate.
  The header pill is the compromise — pride acknowledged above the fold, work
  first.
- **Credential score removed from display.** A credential attests that the
  holder met the scheme's criteria; it does not rank holders. `score_pct`
  remains in the table and in `exam_attempts` for audit.
- **Migration 117** — `grant select on credentials to authenticated`. The RLS
  policy existed with no grant, so every read failed 42501 and a learner
  holding two credentials saw none of them anywhere in the app.
- **Rail split into global and cert scopes.** "My certifications" above the
  switcher (it is how you change cert); the five cert items below it labelled
  with the active cert code. Wordmark points at `/dashboard` again now that a
  real app home exists.

---

## 3. Scorer investigation — NO DEFECT (carried from v2.4)

Two sample credentials at 8.75% and 35% against an 80% threshold.
`score-mock-exam/index.ts:112` reads `Number(cert.passing_score_pct ?? 85)` and
line 282 compares `score_pct >= passing_threshold`. Fallback is 85 — stricter
than 80, so even a null cannot let anyone through. **The scorer is sound**;
those rows were seeded or predate a threshold change, and are slated for purge
before launch.

---

## 4. Queued next

1. **Grok review of the ~392 provisional translations**, then `--approve` per
   cert. Nothing else on this list changes what the product *claims* as much.
2. **`_shared/prompts.ts:169` says passing is 70%** while certs are at 80% —
   the study-plan model is calibrating advice to a bar that does not exist.
3. **Check `chat_sessions` / `chat_messages` / `lesson_format_preferences`
   grants** — same RLS-without-grant class as credentials. `quiz_questions`
   being locked IS load-bearing (edge functions use the service role); the
   others look like they should be user-readable.
4. **Reconcile the cert dashboard's "36 / 31"** — it counts per-language lesson
   rows; the home view dedupes by `lesson_group_id`. The home number is right.
5. **Blueprint drawer labels** hardcoded English (`triggerLabel="Blueprint"`,
   `subtitle="Job-Task Analysis"`).
6. **Claims + terminology policy into the six `SCHEME-<CODE>.md` files.**
7. **CertiGlobal logo** has no dark-on-light variant; fades out in light mode.
8. **`/certifications/family/[slug]`** still says "family" in a public URL.

### Commercial-readiness

Every domain and task on all six certs now renders in Spanish and Portuguese,
alongside the claims, descriptions and lesson chrome done earlier in the
session. The product is trilingual in substance, not just in shell.

The honest remaining caveat is item 1: those translations are **unreviewed**.
The flag is set correctly and the process is defensible, but "trilingual
certification product" is a claim that should follow the review, not precede it.
