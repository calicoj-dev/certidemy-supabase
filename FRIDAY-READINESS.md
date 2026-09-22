# Friday: what Hexasec can pull

Written 2026-09-17. Everything below was measured against the live endpoint, not
inferred from the code.

> **[CORRECTION 2026-09-22 — THE CONCEPT ROWS DO NOT SERVE IN SPANISH OR
> PORTUGUESE, AND HAVE NOT SINCE MIGRATION 359.]**
>
> Every non-English read of `mcp.concept` answers **HTTP 500**
> (`permission denied for schema public`). Measured against the deployed
> endpoint, unauthenticated, across five certifications and both languages:
> 10 of 10 cells fail. English is unaffected and every other resource —
> certification, task, search, lesson catalogue — is unaffected.
>
> **The sentence above this box is what made it possible.** "Measured against
> the live endpoint" was true of the resources on this page in September. The
> concept-translation work that followed was measured by querying the VIEW as
> an admin, which reports what the gate decided and not what a partner
> receives. The gate was right; the claim was about the endpoint.
>
> Migration 365 fixes it. `scripts/check-mcp-wire.mjs` is the instrument that
> should have existed: every view, every language, against the deployed
> function, holding no credential. **Nothing on this page should be restated
> as serving until that matrix is green.**

**Read this first: English is complete on three certifications; every
non-English lesson body is held pending a bilingual read.** The syllabi are
ready in all three languages right now. The lesson BODIES in Spanish and
Portuguese are held by a review gate nobody has worked yet. That is the one
contingency on this page, and it is a decision you already took: withhold
rather than guess.

[Updated 2026-09-17 evening. The paragraph this replaces named 32 Spanish rows
in `BILINGUAL-QUEUE.json` as the unlock. That queue was superseded: the
paragraphs were RE-TRANSLATED from repaired English rather than reviewed, which
is a different and better answer to the same problem.]

---

## 1. The syllabus — ready now, no credential, all three languages

A prospect with no key and no account can pull all of this today:

| | ISMS-F | AIMS-F |
|---|---|---|
| certification record | yes | yes |
| domains, weights, tasks | yes | yes |
| task knowledge / skills / abilities | yes | yes |
| concepts and what they attach to | yes | yes |  <!-- [CORRECTED 2026-09-22: English only. es-419 and pt-BR answer HTTP 500 until migration 365 runs. See the correction at the top.] -->
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

> **[SUPERSEDED 2026-09-22, IN BOTH DIRECTIONS.]** `concept_translations`
> exists and carries **2,542 gate-passing rows** across twelve certifications.
> So this paragraph understates what has been written. It also, by accident,
> describes what a partner actually receives today: the rows exist and the
> endpoint answers 500 for every non-English concept read, so concepts are
> English-only ON THE WIRE for a different reason than the one given here.
> Both halves change when 365 runs.

**This is the part of the demo that cannot go wrong.** It needs no credential,
it is complete, and it is the surface a partner actually uses to decide whether
a certification is worth selling.

---

## 2. The lesson bodies — needs a `courseware:lessons` API key

Measured, per language, right now:

| | English | Spanish | Portuguese |
|---|---:|---:|---:|
| **ISMS-F** (49 lessons) | **49 of 49** | 43 of 49 | 43 of 49 |
| **AIMS-F** (35 lessons) | **35 of 35** | 1 of 35 | 1 of 35 |
| **AIMS-IA** (40 lessons) | 40 of 40 *(not reachable yet)* | 1 of 40 | 1 of 40 |
| **ISMS-IA** (38 lessons) | 38 of 38 *(needs 337)* | 1 of 38 | 1 of 38 |

**Three certifications are complete in English.** ISMS-F, AIMS-F and AIMS-IA
serve every lesson body to a key holder. AIMS-F module 4, the visible stop
described in the version of this page written earlier today, is gone. Six ISMS-F
lessons are held in Spanish and Portuguese pending your read.

**AIMS-IA IS REPAIRED BUT NOT YET REACHABLE, and the table above says
`40 of 40` about the CONTENT, not about what a partner can pull today.** It is a
40-lesson ISO/IEC 42001 internal-auditor certification, every lesson measured
clean this evening, and if Hexasec's interest is auditing rather than
foundation-level awareness it is the most valuable thing here. Three changes
have to land before anyone can pull it, in this order:

1. **Migration 336** admits AIMS-IA to the mcp views. Written, NOT RUN. Until it
   runs the certification is invisible: no record, no blueprint, no catalogue,
   no bodies, even though every one of its 120 lesson rows is marked servable.
2. **Deploy `courseware-read`** so the function accepts `AIMS-IA`. Edited, not
   deployed. Migration first: deploying ahead of it makes the function accept
   the code and the view return nothing, so a partner is told the certification
   has no lessons.
3. **A web session** to add `AIMS-IA` to `certidemy-web/lib/mcp/registry.ts`.
   The Worker currently emits ten certifications and would refuse AIMS-IA before
   the request ever reaches the function.

Until all three land, AIMS-IA behaves exactly as it did this morning: a request
for it is refused rather than answered from a neighbour. **That refusal is
correct and safe to demo.** What is not safe is saying AIMS-IA is available and
having it refuse in the room.

**ISMS-IA no longer stops.** 38 of 38 in English, and the display change it
was waiting on turned out not to be needed. The position was amended instead:
clause text that is quoted AND attributed is permitted output, so its 48
blockquotes stay exactly as written. Its 79 prose runs were recast and its 19
bare blockquotes -- quoted but not attributed -- were given a clause address.

**Every ISO-derived certification on the platform now measures 0 refused.**

Like AIMS-IA, it needs migration 337 run and `courseware-read` deployed before
a partner can pull it, plus `AIMS-IA` and `ISMS-IA` both present in the web
Worker's list. 337 is written and has not run.

**Spanish and Portuguese bodies are 1 of 35 and 1 of 40 because of the gate, not
because of the translations.** Every repaired paragraph HAS been re-translated
from the repaired English and mechanically checked for dropped obligations,
wrong language, changed glossary keys and altered emphasis. What has not
happened is a human who reads both languages confirming it. The system refuses
to serve a translation nobody has re-read, which is the decision you took, and
it is the single thing standing between now and a Spanish demo.

About twenty paragraphs could not be re-translated cleanly and are held
separately: short list items the language check cannot decide either way, and a
Portuguese construction where a list's obligation sits in its lead-in rather
than in each bullet. They are named in `HANDOFF-v12_9.md` section 8.

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

**[The last clause of that refusal body is currently false for a non-English
caller — concepts are not available at all until 365 runs. The refusal text
lives in the function and needs no change once it does.]**

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
