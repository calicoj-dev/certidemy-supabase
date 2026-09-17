# Friday: what Hexasec can pull

Written 2026-09-17. Everything below was measured against the live endpoint, not
inferred from the code.

**Read this first: the Spanish courseware depends on tonight's queue.** The
syllabi are ready in every language right now. The AIMS-F lesson bodies in
Spanish are not, and the **32 Spanish rows** in `BILINGUAL-QUEUE.json` are
exactly what unlocks them. Nothing else on this page is contingent.

---

## 1. The syllabus — ready now, no credential, all three languages

A prospect with no key and no account can pull all of this today:

| | ISMS-F | AIMS-F |
|---|---|---|
| certification record | yes | yes |
| domains, weights, tasks | yes | yes |
| task knowledge / skills / abilities | yes | yes |
| concepts and what they attach to | yes | yes |
| lesson catalogue (titles, order, duration) | yes | yes |
| search across tasks and concepts | yes | yes |

Available in **English, Spanish (es-419) and Portuguese (pt-BR)** for task
statements, domain titles and the lesson catalogue.

**CORRECTED AND THEN FIXED, 2026-09-17.** An earlier draft of this page said the
task knowledge, skills and abilities were available in all three languages. They
were not: `task_translations.knowledge`, `.skills` and `.abilities` were NULL on
all 70 AIMS-F rows and all 88 SM-AI-II rows.

**They were translated the same afternoon and now serve.** Verified against the
live view: a Spanish pull of AIMS-F task 5.3 returns `knowledge`, `skills` and
`abilities` where it returned nulls that morning. 35 tasks x 3 fields x 2
languages for AIMS-F, 44 x 3 x 2 for SM-AI-II.

Nothing had broken. The tool has an `ONLY=ksa` mode that is deliberately NOT
part of `ONLY=all`, so it is a separate pass that has to be run per
certification — it had been run for eight and skipped for two.

**The ordering mattered and is worth knowing if anyone asks.** The translation
was made from the REPAIRED English, so the Spanish carries our recasts rather
than ISO's sentences. Spot-checked on three clauses: the Spanish for clause 10.2
reads *"de modo que el mismo fallo no se repita"*, which is our rewrite, not
ISO's phrasing. Doing this a week ago would have translated ISO's sentences into
Spanish and put them somewhere no instrument here can see.

Concepts are English-only across every certification — there is no concept
translation table at all. Pre-existing, and unchanged.

**This is the part of the demo that cannot go wrong.** It needs no credential,
it is complete, and it is the surface a partner actually uses to decide whether
a certification is worth selling.

---

## 2. The lesson bodies — needs a `courseware:lessons` API key

Measured, per language, right now:

| | English | Spanish | Portuguese |
|---|---:|---:|---:|
| **ISMS-F** (49 lessons) | **49 of 49** | 46 of 49 | 46 of 49 |
| **AIMS-F** (35 lessons) | **30 of 35** | **1 of 35** | 1 of 35 |

**ISMS-F is effectively complete.** Three lessons are held in Spanish and
Portuguese pending your read; everything else serves.

**AIMS-F English is four modules complete out of five:**

| module | lessons | serve |
|---|---|---|
| 1. AI management systems and the AI landscape | 6 | **all 6** |
| 2. Context, leadership and planning | 8 | **all 8** |
| 3. Support and operation | 8 | **all 8** |
| 4. Annex A controls: structure and selection | 7 | 2 of 7 |
| 5. Performance evaluation, improvement and certification | 6 | **all 6** |

A partner clicking into modules 1, 2, 3 or 5 sees a complete module. Module 4 is
the visible stop.

**AIMS-F Spanish is 1 of 35 until the queue is worked.** Not because the Spanish
is wrong — because 29 lessons had their English repaired this week and the
system refuses to serve a translation nobody has re-read. That is the gate
working as designed, and it is the single biggest thing standing between now and
a Spanish demo.

---

## 3. What a refusal actually says

Three different refusals, three different messages. None of them says
"unauthorized" and none of them says "not found" unless that is true.

**A lesson whose translation is pending review** (most of AIMS-F Spanish today):

> The lesson '03-01-resources-and-competence' exists and its es-419 body is not
> available YET. Its English was recently edited to remove reproduced standard
> text, and the translation is held until a human has confirmed the same text is
> not present in it. **This is not a problem with your credential.** The English
> body is available now; the translation will follow.

**A lesson still carrying reproduced standard text** (AIMS-F module 4):

> The lesson '04-04-impact-and-life-cycle-controls' exists and its body is NOT
> available through this API. It reproduces clause text from an ISO standard,
> which Certidemy may teach from but may not redistribute. This is not a problem
> with your credential and retrying will not change it. The syllabus, tasks and
> concepts for this certification are fully available.

**A lesson that genuinely does not exist:**

> No lesson '99-99-whatever' in AIMS-F for es-419. Use list_lessons for the
> catalogue; it needs no credential.

**Why this matters in the room.** Until today all three of these returned an
empty result, which an agent reports as "this lesson does not exist." A partner
would have concluded the curriculum was thinner than it is. Now each one says
which situation it is, and two of the three say in plain words that the
credential is fine.

---

## 4. Two things that are true and worth saying out loud

**Certidemy does not redistribute ISO text.** The reason AIMS-F module 4 refuses
is that those lessons still quote clause text verbatim, and the platform will
not serve it over an API. That is a deliberate position, enforced in the
database rather than by a rule someone has to remember. If Hexasec asks how the
material relates to the standards: we teach what the clauses require, we cite
the clause so a reader can look it up, and we do not reproduce the sentences.
They hold their own copy of the standard; we never become a substitute for it.

**The Spanish gate is stricter than the English one, on purpose.** We cannot
machine-check a Spanish translation against an English standard, so instead of
assuming it is clean we withhold it until a person has read it. That is why
AIMS-F Spanish is thin today and why it will not be thin for long.

---

## 5. If the queue gets worked tonight

`BILINGUAL-QUEUE.json`, 64 rows and 222 passages, Spanish first. Working the
**32 Spanish rows** moves the table above to:

| | English | Spanish |
|---|---:|---:|
| ISMS-F | 49 of 49 | **49 of 49** |
| AIMS-F | 30 of 35 | **30 of 35** |

Re-running `node scripts/gen-bilingual-queue.mjs` refreshes the file; rows you
have cleared drop out of it.

**The 34 blueprint rows that were in this queue are gone**, for two independent
reasons: `task_translations.knowledge` is NULL on every AIMS-F row, so there was
nothing to compare the English against; and `lesson_translation_reviews` is keyed
on `lesson_id`, so no table could have held a verdict on them even once read.
They had no clearing path. The real finding underneath them is section 1's
correction.

---

## 6. Known gaps, in case they are asked about

- **AIMS-F module 4** — 5 lessons, 24 remaining passages. Next week.
- **ISMS-IA and AIMS-IA** — not offered at all. A request for either returns a
  clear message naming the ten certifications that are available. Their
  lesson bodies quote far more heavily and their repair is a programme, not a
  batch.
- **Concepts are English-only** across every certification. Pre-existing.
- **The translated KSAs are machine translation nobody has reviewed.** They
  carry `ksa_is_provisional = true`, and so do ISMS-F's 98 rows, which have
  been served since it went live. `mcp.task` filters on `is_provisional`, not
  on `ksa_is_provisional`, so unreviewed translation is served across every
  certification — AIMS-F now meets the bar already shipped rather than a new
  one. An open item with its own review programme, not a Friday one. Recorded
  in HANDOFF-v12_8 section 6 as a decision.
- **The connector's tool list** is widened by the web-side change; if that has
  not been deployed, the two new certifications are accepted by the API but not
  yet advertised in the tool descriptions.
