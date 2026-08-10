# HANDOFF v6.2 — ISMS-IA, the catalogue's first Level II

**Session date:** 2026-08-09 into 2026-08-10
**Reads with:** `HANDOFF-v6_1.md` §0 — the working protocol is unchanged and still
governs. v6.0/v6.1 cover crawlability and `/our-standard`; nothing there is
repeated.
**Migration tip:** **192 applied** · next free **193**
**Repos:** both clean and pushed
**Commits (supabase):** `47405e2` · `380a8a8` · `b18948f` · `7a98b32`

`ISMS-IA` went from nothing to a scaffolded, verified spine in one session:
signed body of knowledge, JTA through four review rounds, 38 tasks, 169 concepts,
computed blueprint, and a `jta_versions` snapshot. **The Level I generators are
untouched and the Level II fork does not bite until Stage 9.**

---

## 0. WHERE ISMS-IA STANDS

**ISO/IEC 27001:2022 Internal Auditor - AI.** `7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417`,
family `ai-security` #2, status **`draft`**, **tier 2**.

| | |
|---|---|
| Spine | 5 domains · 5 modules · **38 tasks** · **169 concepts** · **169 links** |
| Exam | 50 items · **75%** · 90 min · blueprint 6/10/12/13/9 |
| Profile | remember **none** · understand **5.00** · apply **29.40** · analyze **65.60** |
| `verify-cert` | **17 pass, 5 fail, 0 warn** |
| `jta_versions` | v2.0 published, projected from live rows (192) |
| Scheme doc | `SCHEME-ISMS-IA.md` v1.1, pinned to **17024:2026** |

**All five failures are content nobody has authored yet** — concepts taught,
concepts tested, secure floor, practice floor, pool-can-fill-a-form. Every
structural invariant passes.

**The number that validates the build:**

| cert | remember | understand | apply | analyze |
|---|---|---|---|---|
| ISMS-F | 10.39 | 56.77 | 22.68 | 10.17 |
| AIMS-F | none | 46.93 | 41.26 | 11.80 |
| SD-AI-I *(heaviest L1)* | none | 20.10 | 49.60 | 30.30 |
| **ISMS-IA** | **none** | **5.00** | **29.40** | **65.60** |

The BoK set `analyze ≥ 55, remember 0, understand < 25` as its own falsification
test before scaffold. The database computed 65.60 independently of four versions
of hand arithmetic and matched to the hundredth.

**Next: Stage 7. 38 lessons. Its own sessions.**

---

## 1. LEVEL II — WHAT IT ACTUALLY REQUIRED

### 1.1 Less than the documents predicted

`CERT-CREATION` §5 said an L2 cert runs the whole playbook on the current machine
and stops only at Stage 9. **That held exactly.** Nothing in 187–192 is
L2-specific except three column values.

**`verify-cert` invariant 16 was never touched.** It forces
`is_exam_scope = false` on `5_evaluate` tasks, and the pre-build plan assumed a
new `tasks.is_selected_response_assessable` flag would be needed. It was not:
every ISMS-IA task is Analyze or below and all 38 are exam-scoped, so
`No exam-scope task above the MCQ ceiling` passes at 38.

> **The rule that generalises: a tier is defined by cognitive demand and item
> contract, not by reaching for a higher Bloom level.** The flag waits for
> `ISMS-LA`, where lead-auditor judgment genuinely is `5_evaluate`. **Do not
> build it speculatively.**

### 1.2 The three column values that are L2-specific

- **`tier = 2`.** Defaults to 1, and every prior cert is tier 1, so this is the
  first time the default is wrong. Omitting it records a Level II credential as
  Level I with no error.
- **`difficulty_level = 2`**, mirroring tier. Every earlier cert carries 1 and is
  also tier 1, so the two columns are perfectly correlated in the data and the
  convention cannot be read from it.
- **`passing_score_pct = 75.00`**, not the I-tier 80. A cut score is a statement
  about expected performance on *these* items, and L2 items are built so the
  minimally competent candidate finds the second-best answer attractive. Carrying
  80 across a change in item construction is a number travelling without its
  reasoning. **The bar is not lower; the items are different.**

### 1.3 The item contract, and where it now lives

Four options, all defensible on the facts given, one best. **Dichotomous scoring**
— one key, no partial credit, so an L2 score means what an L1 score means.

Two constraints, both required:

1. The best answer must be better than the second-best **for a reason a competent
   auditor could state in one sentence**. Longer than that and the item is a coin
   flip.
2. The second-best must be **genuinely defensible, not merely wrong**. An item
   whose second choice is incorrect is a Level I item in the wrong bank.

This is recorded in `exam_blueprint.item_model` (migration 190) — **the first
blueprint key no other cert carries.** It proved inert to invariant 17. Nothing
reads it yet; it exists so the contract is queryable rather than living only in a
markdown scheme.

### 1.4 The cue guard will need inverting at Stage 9

In L1, an unusually long key is a cue to strip. **In L2 the best option is
frequently best BECAUSE it is better qualified** — *"...provided the sample is
representative of the period under audit"* — so a length-homogeneity guard tuned
for L1 would systematically reject correct items and keep flat ones.

`item_model.cue_guard` records the intended fix: test comparable **qualification
density** across options rather than comparable length. **Not yet built and not
yet validated against real items.**

---

## 2. THE ATTRIBUTION FINDING — THREE DOCUMENTS, ONE RULE, WRONG TWICE

**"An auditor may not audit their own work" is in neither ISO/IEC 27001 nor
ISO 19011:2026.**

- `ISMS-F` lesson 05-02 attributed it to **27001**. Corrected in a prior session
  (v5.5 Finding 2) by reattributing it to *ISO 19011 guidance*.
- `ISMS-IA` JTA v0.3 carried that reattribution forward.
- **Reading ISO 19011:2026 cover to cover found it in neither.** Searched the full
  text for *own work*, *audit their own*, *audit its own*, *shall not audit*,
  *should not audit*. Zero hits.

**What clause 4.6 actually says**, and it is more useful than the maxim:

> Auditors **should be independent of the activity being audited wherever
> practicable**... **When it is not possible for internal auditors to be
> independent of the activity being audited, every effort should be made to
> remove bias and encourage objectivity.**

More permissive than the rule we were about to teach, and it *is* task 1.3's
competence — determining whether objectivity survives and what restores it.

> **The pattern is the finding, not the instance.** Three separate times in this
> build a rule everybody "knows" turned out not to live where everybody says it
> does: the own-work rule, the major/minor severity scheme (17021-1 practice, not
> 27001), and the risk register (nowhere at all). **A correction that moves a
> claim from one document to another is not verified until the receiving document
> has been read.**

---

## 3. ISO 19011:2026 — READ, AND IT CHANGED THE CREDENTIAL

Fourth edition, **published 2026-05-27**, ISO/PC 302, 56 pages. Read directly.

### 3.1 Clause 7.2.3 item 10 names AI evaluation tools

> auditors should *understand the appropriateness and consequences of using
> information and communications technology tools, and emerging technology to
> conduct audits (e.g. **artificial-intelligence-based evaluation tools**)*

**Task 3.8 — the signature task — is now assessing a competence the standard
itself declares.** Not an extrapolation, not a market position. This is the
single strongest sentence available for the scheme document and for any external
positioning, and it is a fact about the standard rather than a claim about us.

### 3.2 ISO's own change list has TWO items, not five

> — expansion of guidance on remote auditing methods through the introduction of
> guidance contained in ISO/IEC TS 17012;
> — expansion of Annex A to provide guidance on remote auditing methods and
> virtual locations.

**That is the whole list.** The BoK's first draft listed five changes — digital
competence explicit, evidence reliability expanded, risk-based strengthened —
sourced from vendor and training-provider articles. That text **exists**, but
nothing establishes it is **new**.

> **A vendor article describing what is IN an edition is not evidence about what
> is DIFFERENT in it.** A claim that a standard changed requires either the
> standard's own change list or both editions side by side.

The market edge survives on one true sentence: **published 2026-05-27,
superseding :2018, importing ISO/IEC TS 17012's remote auditing guidance.**
Courses teaching :2018 are teaching the prior edition. Checkable, and enough.

### 3.3 Other findings that shaped tasks

- **Clause 6.4.7 is a matter of degree, not a binary.** *Only information subject
  to some degree of verification should be accepted as audit evidence*, and where
  that degree is low the auditor uses **professional judgement to determine the
  degree of reliance**. Task 3.1 was reframed on this and it is what makes 3.8
  work — an AI summary is not disqualified, it carries low verification and the
  reliance must be stated.
- **3.9 *objective evidence* and 3.10 *audit evidence* are different defined
  terms**, and clause 3.1's definition of *audit* uses the former.
- **`remote auditing method`** (3.4) — not "remote audit method" — and the
  definition is **sourced from ISO/IEC TS 17012:2024**. Guidance lives in
  **Annex A.16**, not the body.
- **No precedence among the seven principles.** Clause 4.1 says only that
  adherence is fundamental. Verified by reading clause 4 in full.
- **The Introduction draws our own product boundary for us:** 19011 *concentrates
  on internal audits (first party)* and hands third-party certification to
  ISO/IEC 17021-1. That is the cleanest statement of why `ISMS-IA` is a real
  credential and Lead Auditor is a different one.

---

## 4. THE SKILLS-FIELD DEFECT CLASS — NEW, AND CATALOGUE-WIDE

`verify-cert` flagged two task **statements** carrying create-level verbs on Apply
tasks (Rule 5b). Fixing them exposed something larger.

**`verify-cert` reads `tasks.statement`. It does NOT read `tasks.skills` — and
skills is generator input.** `ISMS-F` task 5.2's skills phrasing propagated a
false attribution into generated items and survived three regeneration attempts
from corrected source fields.

Sweeping all 38 skills fields found **seven** instructing the generator to have a
candidate *write*, *design* or *compose* something. None is scoreable by selected
response. Each would have shaped items toward a task the exam cannot assess.

```sql
select code, statement, skills from public.tasks
where certification_id = '<U>'
  and (statement ~* '^(construct|design|compose|write|create|develop|formulate)'
    or skills     ~* '\m(rewrite|write|design|compose|create|draft|record an)\M');
-- expect 0 rows
```

**This has never been run against the other nine certs.** Migration 191 fixed
ISMS-IA; the sweep is now in `CERT-SCHEMA-GUIDE` §5 for future certs, but the
existing catalogue is unchecked.

**Two rewrites changed more than a verb, and both are improvements:**

- **4.2** now names what clause 5.1 actually asks — top management shall
  **demonstrate**. The old statement lost the word entirely.
- **5.3 narrowed rather than paraphrased.** Writing a nonconformity statement is
  generation, already out of scope by the scheme's §2. The task is now *selecting*
  the statement that correctly links evidence to requirement. **A smaller claim,
  and the honest one.**

---

## 5. TWO PROPOSED `verify-cert` INVARIANTS

Both are one query. Each would have caught a real defect **this session**, and
each has caught the same defect on a previous cert that nobody remembered.

### 5.1 Create-level verbs in `skills` and `abilities`

§4. Currently only `statement` is checked. The field that actually drives the
generator is unchecked.

### 5.2 Every cert holds a published `jta_versions` row

**`verify-cert` does not check this.** `SD-AI-I` operated without one until the
governance dashboard surfaced it on its first day (v1.9 addendum 7). It has been
owed as a `CERT-PUBLISH-CHECKLIST` step since **v5.5 §9.5**, repeated in v5.6, and
was still absent when ISMS-IA became the tenth cert to need it discovered
separately.

```sql
select c.code, j.version_string, j.status
from public.certifications c
left join public.jta_versions j on j.certification_id = c.id
where j.id is null;
-- expect 0 rows
```

All ten now hold one, `v2.0 published`. **The gap is the check, not the data.**

---

## 6. SCHEMA FACTS EARNED BY INTROSPECTION

All confirmed live 2026-08-09/10. `CERT-SCHEMA-GUIDE` patched in `b18948f`.

| Fact | Why it cost something |
|---|---|
| **`certifications.issuer_id`** is `NOT NULL`, no default, **and was absent from the guide** | Arrived with Open Badges (185/186). **Every pre-185 scaffold migration is an unusable template for a cert insert.** The guide named migration 171 as the reference; following it today fails |
| **`concepts.slug` is `UNIQUE (certification_id, slug)` — per cert** | The guide was right. The `ia-` prefix is convention, not protection |
| **`modules.slug` is `UNIQUE (slug)` — table-wide** | The guide was already right about this too, with the AIMS-F 23505 collision recorded. **Two adjacent tables, opposite rules** |
| `tasks_domain_id_order_index_key` is `UNIQUE (domain_id, order_index)` — **per domain** | The globally-sequential 1..N convention satisfies it trivially but **is not enforced by the database** |
| `jta_versions` uses **`version_string`**, not `version`, and has **no `published_at`** | Guessed both; both wrong |
| `tasks.notes` exists | Undocumented |

**Two of the three "corrections" I set out to make to the guide were already
there.** I was asserting from memory instead of reading — the exact failure the
guide's own §0a warns about. Only `issuer_id` was genuinely missing.

---

## 7. PROCESS — THE GUARDS CAUGHT ME FOUR TIMES

Every one failed loudly and wrote nothing. **In each case the guard was wrong,
not the thing it guarded.**

1. **Token guard checked for `7c3f1e88`** — 190 targets the cert by `code`, not
   UUID. Landing stopped at 190 of four files.
2. **`-Filter '19*_*.sql'`** excluded 187/188/189 before `Where-Object` saw them.
3. **Patch anchors built from a rendering, not from bytes.** 4.3 had an **em-dash**
   where I typed a hyphen (third time in this project); every `skills` fragment was
   **lowercase** after `· S —` where I had capitalised. Eight of fifteen failed.
4. **Diagnosed a failing anchor as CRLF without checking.** Count came back
   **0 CRLF, 363 LF**. Wrong diagnosis, killed by a two-line check before it became
   a wrong fix.

> **A verification that cannot distinguish pass from fail is worse than none.**
> These produced alarm rather than false confidence, which is the safe direction —
> but the pattern is that the guard is now the most likely thing to be wrong.

### 7.1 A loose-statement paste wrote the wrong file into the repo

Guards pasted as **separate interactive statements** each `throw` only their own
line. Execution continued, `$t` still held **17,653 bytes of `CERT-SCHEMA-GUIDE.md`**
from a check earlier in the session, and `WriteAllText` wrote it as
`SCHEME-ISMS-IA.md`. Caught before commit.

> **The multi-step-edit rule exists for exactly this.** A script has a fresh scope;
> an interactive shell carries every variable from every earlier command. If a
> block must be pasted, wrap it: `& { $ErrorActionPreference = 'Stop'; ... }`.
>
> **A length floor would not have caught it** — the file was not empty, it was the
> wrong 17 kB. A *content* assertion would have.

### 7.2 One failure left unexplained on purpose

A two-line patch anchor spanning a newline matched **0 times** against a file
whose bytes were confirmed identical, while another two-line anchor in the same
script matched. CRLF ruled out. **Cause not established.** Routed around with a
single-line anchor and the reason is a comment in the script. Calling it fixed
would have been false confidence.

---

## 8. OPEN — CARRIED INTO STAGE 7

### ⛔ Blocks one lesson only

1. **ISO/IEC 27001 Amendment 1:2024 text** for task 4.7. The copy read is the
   unamended third edition. Wording taken from the amended ISO/IEC 42001 and
   near-certainly identical, **but that is inference.** Two concepts carry the
   hedge in their live descriptions:
   ```sql
   select slug from public.concepts
   where certification_id = '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417'
     and description like '%PENDING VERIFICATION%';
   ```

### Owed, catalogue-wide

2. **Run the create-verb sweep (§4) against the other nine certs.** Never done.
3. **Both invariants (§5)** into `verify-cert`.
4. **`CERT-PUBLISH-CHECKLIST`** — still no `jta_versions` step. Owed since v5.5.
5. **`ISMS-F` lesson 3.6** — the Annex A completeness claim rests on **NOTE 2 and
   NOTE 3** to 6.1.3, not NOTE 1 and NOTE 3 as v5.5 records. Check whether the
   misnumbering reached the published lesson.
6. **`ISMS-IA_BoK_v1.md`** — §3 Layer 1 still lists five 19011 changes (§3.2);
   add ISO/IEC TS 17012:2024 to the source stack; §4's own-work row is superseded
   by §2 here.
7. `price_usd` is 0 on ISMS-IA. Real before publish.
8. **ISO/IEC 27007 DIS** and **ISO/IEC 27090** (FDIS ballot closed 2026-08-18).
9. `ksa_is_provisional` still has no approval path.

---

## 9. STAGE 7 — HOW TO START

**5 modules, 38 lessons, one per task.** Content at
`certidemy-web/content/isms-ia/`, folders `01-ia-audit-function/` through
`05-ia-findings-and-follow-up/`. **Module slug must equal the folder name minus
the `NN-` prefix** and match `module_slug` in every lesson's frontmatter —
`modules.slug` is table-wide unique, which is why they carry `ia-`.

**Order, proven by AIHR-I:** module 1 (five D1 lessons) → external review →
**derive** the per-cert style guide from what module 1 actually established → then
modules 2–5. The style guide is written from the module, not in advance.

**Carry these into authoring:**

1. **All three PDFs open in another window** — ISO 19011:2026, ISO/IEC 27001:2022,
   ISO/IEC 42001:2023. Every content defect in this build's ancestry was *true and
   well taught, attributed to text that does not say it*. A second window catches
   every one.
2. **§2 is the live risk.** This credential teaches on the seam where three
   documents meet. The attribution map is JTA v2.0 §3.
3. **Task 3.8 is the signature task.** Its K field cites 19011 clause 7.2.3
   item 10 by name. Protect it.
4. **Task 4.3 is the densest**, carrying the whole of clause 6 across seven
   concepts. If the lesson proves unwieldy, **split the lesson, not the task** —
   clause 6 is one competence.
5. `load-lessons-direct.mjs` uses **`--dry`**, never `--dry-run`; unknown flags are
   silently ignored and it runs live. `wire-lessons.mjs` takes env vars, no flags.
6. **Lesson slug uniqueness is global.** Prefix with the cert.

---

## 10. NEXT SESSION PROMPT

> Continuing Certidemy. Read `HANDOFF-v6_2.md`, then v6.1 §0 for the working
> protocol, which is unchanged.
>
> **ISMS-IA is scaffolded and verified — migrations 187–192, tip 192, next free
> 193.** `verify-cert --cert ISMS-IA` reports 17 pass / 5 fail / 0 warn and all
> five failures are content not yet authored. **Do not re-scaffold anything.**
>
> **Stage 7 is next: 38 lessons.** §9 has the order and the six things to carry
> in. Module 1 first, then review, then derive the style guide, then modules 2–5.
>
> **The scheme of record is `ISMS-IA_JTA_v2.0` with erratum 1 applied.** The
> database is correct; if a document disagrees, the document is the defect.
>
> **Do not build `is_selected_response_assessable`** (§1.1) — invariant 16 holds
> untouched for a Level II and the flag waits for `ISMS-LA`.
>
> **The habit this session kept proving:** read the bytes, not the rendering, and
> read the receiving document before believing a correction. Four guards failed
> because the guard was wrong, not the thing it guarded — and a rule everybody
> knows turned out to live in neither standard that supposedly contains it.

*End of HANDOFF v6.2.*
