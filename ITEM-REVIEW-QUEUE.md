# Item review queue

From the director's read of the 342 exposed items, 2026-09-26. **Tier A is closed
— those five are retired.** Everything here is Tier B: **two defensible options,
or a rationale that conflicts with the source. Nothing is rescored on
"plausible."**

These 30 items count in the §1 worst-case arithmetic (`TIER-A-OUTCOMES.json`) and
are otherwise live and untouched.

> **Every one of these is a defect in the ENGLISH.** The Spanish read clean across
> all 342 — no translation moved a key or made a distractor correct. So an SME
> reviewing this queue is reviewing source content, and a fix lands in all three
> languages.

---

## Closed: Tier A, retired 2026-09-26

Five items whose key is wrong against their own source. Retired from the **secure**
pool only, by `question_group_id`, all three languages — 15 rows. The practice
pool is untouched, asserted. Reversal statement in `TIER-A-RETIRED.json`.

| # | id | cert | why |
|---|---|---|---|
| 72 | `6c0b1bce` | AIE-I | the stem already contains the task instruction; the key says it is missing and refers to résumés the stem never mentions |
| 202 | `0896c92e` | SM-AI-I | the 2020 Guide lets the PO delegate and remain accountable — option a nearly verbatim — and the key rejects it |
| 222 | `f0cfcac8` | SM-AI-I | the 2020 Guide: the **Scrum Team** creates the DoD. The key says "the Developers" (2017 wording) and no option is correct |
| 334 | `38352993` | SM-AI-I | the 2020 Guide: Scrum **Teams** "internally decide who does what, when, and how." The key calls that a misreading |
| 341 | `4282297a` | SM-AI-I | SAFe does not keep a single Product Backlog. The key says all three do |

**Feasibility confirmed before retiring**, on the unit that actually binds: form
assembly allocates `num_questions` across **domains** by `weight_pct`, so a domain
that cannot fill its quota is what breaks a form. After retirement the tightest
domain holds **4.85×** its quota (SM-AI-I) and **5.22×** (AIE-I), zero short
domains in any language, and no task emptied — the thinnest task keeps 7 items.

---

## Tier B — SME review

### SM-AI-I: the 2020 Guide versus 2017 content

| # | id | why | a candidate missed it |
|---|---|---|---|
| 290 | `5ea5663f` | Sprint Planning is whole-team in the 2020 Guide | |
| 252 | `84acea98` | the 2017 "first days" rule | |
| 261 | `476a4a0c` | the 2017 "at least one improvement" rule | |
| 204 | `b898581c` | nobody is accountable for facilitating the Daily Scrum | |
| 268 | `83f18417` | the Scrum Master ends a Developer event | |
| 249 | `c15bfd3c` | "hardening Sprint" called a gap | **yes** |
| 299 | `d7d0f799` | "never show undone work" is not in the Guide | |
| 300 | `d9836819` | "never show undone work" is not in the Guide | |
| 302 | `916b683e` | "never show undone work" is not in the Guide | |

### SM-AI-I: two defensible options

| # | id | a candidate missed it |
|---|---|---|
| 176 | `29959842` | |
| 189 | `7c7c4f5f` | **yes** |
| 191 | `c81b53a2` | |
| 195 | `39dcb820` | |
| 197 | `d56397d4` | |
| 241 | `c475334f` | **yes** |
| 256 | `4a4569a6` | |
| 311 | `34c109a8` | **yes** |
| 312 | `7938f0eb` | **yes** |

### Found by the 2017-marker sweep, not by the read — added 2026-09-26

Neither was presented in any of the eight attempts, so the 342-item read could not
have reached them. Both are Tier B: **the key is still the best available option, so
nobody was scored wrongly — the rationale cites a rule the 2020 Guide removed.**
Full reasoning in `SCRUM-2017-REPORT.md`.

| id | cert | task | why |
|---|---|---|---|
| `65946c58` | SM-AI-I | 3.6 | the explanation asserts *"the Scrum Guide expects the team to identify at least one high-priority improvement and add it"*. 2017 said exactly that; 2020 says the most impactful improvements **may** even be added |
| `7c00917f` | SM-AI-I | 3.3 | the **key** reads *"detailing enough work to cover at least the first days of the Sprint"* — 2017 Sprint Backlog wording that 2020 removed. The explanation repeats it |

### Explanations that state something false

| # | id | cert | what the explanation asserts |
|---|---|---|---|
| 181 | `4666275a` | SM-AI-I | "Dedication replaced Commitment" — no Guide did that |
| 231 | `e8f2dd0c` | SM-AI-I | per-item reject, which contradicts #240 |
| 226 | `2faab9a1` | SM-AI-I | contradicts #227 |
| 227 | `e7460496` | SM-AI-I | contradicts #226 |
| 342 | `38b1d499` | SM-AI-I | invents a "SAFe Chief Product Owner" |
| 143 | `e43bd6a8` | AISM-I | cites a fact the stem does not give |
| 96 | `da20ee66` | AIE-I | the key names a person the stem never introduces |
| 74 | `e0646031` | AIE-I | contradicts the logic of #72, which is Tier A and now retired |

### AISM-I and AIE-I: two defensible options

| # | id | cert | a candidate missed it |
|---|---|---|---|
| 127 | `251045a1` | AISM-I | |
| 128 | `7fc0401f` | AISM-I | **yes** |
| 132 | `6902cf27` | AISM-I | |
| 84 | `2d1af4b4` | AIE-I | |

---

## The duplicate stems — and the guard that catches them in English only

**`2dfebd3a` / `61782aae`, AIE-I, both task 1.7, both domain D1, both live secure,
different `question_group_id`.** The English stems are **byte-identical**:

> Which statement correctly describes the relationship between generative AI and
> machine learning?

and both keys assert the same proposition — *"Generative AI is a subset of machine
learning that produces new content rather than only classifying or predicting"*
against *"...focused on producing new content"*. One gives the other away.

**Form assembly already guards this, and the guard is a byte comparison.**
`generate-mock-exam` dedupes on `question_text.trim().slice(0,160)` before task
grouping, shuffled so the surviving variant varies, and its comment names exactly
this case: *"Both are valid items and neither should be retired. What must never
happen is BOTH reaching one form."*

**Translation defeats it.** The Spanish renderings chose different question words —
*"¿Qué afirmación describe..."* against *"¿Cuál enunciado describe..."* — so the two
stems are different strings and both survive into the es-419 pool.

Measured across all secure pools: **9 English duplicate-stem families**, each with
two variants. How many still collide after translation:

| cert | English stem | es-419 | pt-BR |
|---|---|---|---|
| AIE-I | *generative AI and machine learning* | **ESCAPES** | caught |
| AIGRM-I | *NIST AI RMF versus ISO/IEC 42001* | caught | caught |
| AIMS-IA | *clause 9.2 audit, no nonconformities* | **ESCAPES** | caught |
| SD-AI-I | *who are the Developers* | caught | caught |
| SM-AI-I | *three topics in Sprint Planning* | caught | caught |
| SM-AI-I | *Scrum Master's central accountability* | **ESCAPES** | caught |
| SM-AI-I | *who creates the Definition of Done* | **ESCAPES** | **ESCAPES** |
| SM-AI-I | *who may cancel a Sprint* | caught | caught |
| SM-AI-I | *primary purpose of the Sprint Review* | caught | **ESCAPES** |

> **So the answer to "can form assembly place both in one exam" is: not in
> English, yes in Spanish on four families and in Portuguese on two.** The guard
> works in the language it was written in and fails in the two it was not — the
> mirror of the reachability defect this repo already records, where the only
> language that could not exercise a broken path was the one everything was
> tested in.

**The durable fix is to key the dedupe on something translation cannot move** —
the English sibling's stem, reached through `question_group_id`, or a declared
list of duplicate groups. **Not changed here:** it is an edge-function change and
this pass was measurement plus the Tier A retirement. Reported per §2.
