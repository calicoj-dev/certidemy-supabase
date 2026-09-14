# HANDOFF v11.0 — 2026-09-13

**A new document, not a v10.0 addendum.** v10.0 was about how the numbers became
trustworthy. This session is about a defect one layer beneath that: **two live
certifications were generated with a grounding that named no standard**, and the
instruments built to find that then produced three false results of their own
before producing a true one.

Migrations 303 through 313. Two evidence tables. One new invariant, one new
checker, one shared hash. And the recurring lesson, four more times: *the
property is almost never lexical.*

---

## 1. IF YOU READ ONE THING

**`groundingFor()` decided the grounding from the certification's NAME, matching
the ROLE before the STANDARD.** So `ISO/IEC 27001:2022 Foundation - AI` and
`ISO/IEC 42001:2023 Foundation` matched no role pattern, fell through every test,
and landed in `NEUTRAL` — 524 characters naming no standard, no edition and no
forbidden claim — while their banks cite an ISO document **394 and 566 times**
and a clause **164 and 172 times**.

Neither the grounding nor the concepts supplied that content. **2 of ISMS-F's 192
concept descriptions name a document at all.** So the drafter supplied it from
training data, and the result is exactly what you would expect: ISO 9001 wording,
ISO/IEC 27005 vocabulary, and 27001:2013 clause numbers, all presented as
27001:2022.

The routing is fixed. The banks it produced needed reading, and that read is the
bulk of this session.

---

## 2. THE STATE

### What is true now

**Every certification resolves to a grounding that names its standard.**
`FOUNDATION_27001` and `FOUNDATION_42001` compose `CRITERIA_*` with a Foundation
frame; the auditor certs keep `AUDIT_*`. **The standard is decided BEFORE the
role**, so a future `ISO/IEC 27001:2022 Lead Implementer` cannot fall through the
way the Foundation certs did. `verify-grounding` asserts all 16 cases, both
directions.

**`3 cert(s) with FAILURES`, down from 4.** AIMS-IA's failure is cleared — it was
`ISO 19011:2026 clause 6.8`, a clause that does not exist, in a live tier-2
secure bank. The remaining three are AIE-I (ungrouped items, and a deliberate
open scheme question), SM-AI-I (ungrouped items) and ZZ-TEST-I (a test cert,
expected).

**28 translated rows have been read by a human and it is recorded.**
`item_translation_reviews` holds 30 rows — 28 approvals and 2 rejections — each
with the English hash it was approved against. `i18n.reviewed` reads it and
reports PASS on ISMS-F (18) and AIMS-F (10).

**Every citation in every bank resolves.** `items.citations` checks every clause
and annex reference against the three ISO PDFs on disk. Currently PASS on five
certifications, SKIP on the rest.

### What is not

- ISMS-F and AIMS-F were **read**, not re-generated. Their remaining content was
  written without a grounding and only the defects found by reading are fixed.
- The four Amendment 1:2024 items are **flagged and untouched** — the PDF on disk
  is the un-amended 2022 edition (0 occurrences of "climate"), so confirming them
  from `CRITERIA_27001`'s own statement would be the repo verifying itself.
- Nobody has re-read AIMS-IA or ISMS-IA's banks at the same depth.

---

## 3. THE TWO UNGROUNDED BANKS

### How the scope was decided

The reversion mechanism — critic without grounding overwrites drafter with
grounding — was traced and bounded. `groundingFor()` was called **exactly once**
in `item-pipeline.mjs`, inside `draftSystem`. `critiqueSystem` got nothing, and
critique rule 7 is FALSE ATTRIBUTION: it *instructs* the reviewer to rewrite
citations, naming ISO 19011, with no edition. Commit `e7b161a` fixed that at
2026-08-11 20:59:54 UTC.

**All 304 ISMS-IA secure items predate it. All 380 practice items postdate it.**
It is the only certification that commit splits.

But the generalisation does not hold, and that mattered: the grounding in force
for seven of the eight pre-fix banks was `1078934` — **117 lines, four generic
constants, no factual assertions at all.** Rule 7 had nothing to revert. The
exposure was never "banks whose grounding was overwritten"; it was **banks that
had no grounding**, which is a different set and a worse problem.

### What the read found

**ISMS-F: 8 defects.** Three families and five singletons.

| defect | verified against the PDF |
|---|---|
| "27001 requires monitoring and review of context" ×2 | occurs **once** in the standard, in Annex A control 8.30. It is ISO 9001:2015's sentence |
| "clause 4.1 explicitly lists governance/culture/competitive factors" ×2 | **"competitive" 0, "cultural" 0, "socio-economic" 0** occurrences |
| "clause 6.1.3 names four treatment options" ×3 | **"modify" 0, "avoid" 0, "share" 0.** They are ISO/IEC 27005 vocabulary |
| "clause 10.2 makes improvement a requirement" | 10.1 is Continual improvement in 2022; **they swapped.** This is the 2013 numbering |
| "clause 4.3 requires exclusions and their justification" ×2 | 4.3 never mentions exclusions — that is 6.1.3 d) and the SoA |
| "27001 requires the risk register to be a living document" | no clause requires a register at all |

**AIMS-F: 5 defects**, including **two keys asserting Annex B is informative** —
one on the SECURE bank. It is normative; the contents page and body both say so.
One was repairable (the candidate's premise is true and only the inference wrong)
and was rewritten onto the modality distinction. **The other had no correct
option at all** and was retired.

### The method, and its limit

**Reading produces shapes; sweeping applies them.** Of ISMS-F's four families
only one was findable by search without reading first. AIMS-F's five were then
found in four queries with no linear reading — but its two worst came from
`CRITERIA_42001`'s own never-assert list, not from anything ISMS-F taught.

**And a sweep undercounts even the family it knows about.** The search for
`monitor and review` returned **1** where there were **four** — two rows say
"monitor*ing* and review". A morphology variant concealed three quarters of its
own family.

That produced the rule now in CLAUDE.md: **built with a never-assert list, sweep
it; built without one, read it.** The routing fix retires the second category.

---

## 4. MIGRATIONS 303–313

| # | what | note |
|---|---|---|
| 303 | ISMS-IA: 63 items relabelled 2018 → 2026 | all 23 cited locations verified against the 2026 text first. Three were **wrong, not dated** — they attributed to 2018 the Annex A remote-auditing guidance the foreword says the fourth edition *added* |
| 304 | three wrong clause addresses | AIMS-IA secure 6.8→6.7, 42001 clause 10.3 deleted, `clause 5.19`→`A.5.19` |
| 305 | `citation_exemptions` | a correct item may name a superseded edition, because a correction has to say what it corrects |
| 306 | 304 was incomplete | the same address sat in an **option**; 304's proof checked only the field it had edited |
| 307 | ISMS-F: 27005 options re-attributed, clause 10.2→10.1 | keys repaired by fixing the **attribution**, never by replacing the key |
| 308 | retired AIMS-F's no-correct-option item | deliberately turned `floors.practice` red |
| 309 | retired SM-AI-II's two `true_false` items | floor checked **first** — 15/15/10 → 14/14/10, unlike 308 |
| 310 | group 9's inserted cadence | both translations added a periodicity the English does not have |
| 311 | `item_translation_reviews` | append-only, hash not trigger |
| 313 | canonical item hash | all 30 stored hashes recomputed |

**312 was written and deleted.** Its premise — that the evidence tables lacked a
`service_role` grant — came from `information_schema.role_table_grants` returning
zero rows. That view returns zero rows for **every** table in this database,
including `quiz_questions`. It shows nothing here, and I nearly shipped a
migration against a problem that did not exist.

---

## 5. THE THREE-RUNG LADDER

Three kinds of translation defect the guards cannot see. Each is fluent, each
survived every check that existed when it landed, each was found by a bilingual
reader, and **each rung is harder to see than the last**:

| | fluent | right language | right object | changes what it requires |
|---|---|---|---|---|
| **wrong language** | ✓ | ✗ | — | — |
| **wrong object** | ✓ | ✓ | ✗ | — |
| **inserted obligation** | ✓ | ✓ | ✓ | **✗** |

1. **Wrong language** — fluent Spanish in a pt-BR row. Every post-condition
   passed because nothing asserted *which* language came back.
2. **Wrong object** — *exposure* as `vulnerabilidade`; *re-escalate* as
   `reescalonar`, which means rescheduled. Both words are Portuguese; the
   language guard is blind to this by construction.
3. **Inserted obligation** — the English said the determination is "something the
   organization returns to" with no interval, and **both translations
   independently added one, across two separate regenerations**, while each
   paragraph said two clauses earlier that the clause imposes no review interval.

**The last one changes what the item TESTS.** A candidate reading it would learn
that context must be revisited on a schedule — the exact claim the English repair
was written to kill, restored in the only two languages nobody re-read.

---

## 6. THE INSTRUMENTS, AND HOW EACH ONE WAS WRONG FIRST

Every checker built this session failed before it worked. That is the most
useful thing in this document.

**`verify-citations` reported 689 nonexistent references.** Two false-positive
sources: defined terms print their number alone on a line, so 19011's and
42001's whole clause-3 vocabulary was missing from the index; and attribution
carried the last-named standard across sentences, so `ISO 19011 clause 9.2.2` — a
27001 address — looked like a defect. **The true number was 4.**

**307's proof 7 was wrong three ways.** It concatenated fields with no separator,
so a stem ending "under ISO 27001?" sat 60 characters from the next field's
enumeration and **flagged the group the migration had just fixed**. It collided
`reten` with *log retention periods*. And per-field it still flagged an item that
names the options unattributed and separately states a true fact.

> **Attribution is a grammatical relation and no lexical proximity test captures
> it.** "Names the four options and also mentions 27001" is indistinguishable
> from "says 27001 names them" by any distance measure.

**The language guard failed its own behaviour test**, in the direction that had
already caused a wrong-language write: Spanish scored 3–1 against the pt-BR
markers and **passed**, because the want-list held tokens the two languages
*share*. Rebuilt on distinctive pairs; Spanish now scores 0 want / 6 avoid.

**`pin-compliance` had the same defect it was built to fix, one level down.** It
pinned `cuestiones` for es-419 with **no language scope**, so the Spanish pin
propagated into Portuguese and ten pt-BR rows came back saying `cuestões`. Every
pin now has a **positive half and a leak half**.

**And the checker alone was not enough.** Adding leak rules without adding them
to the *contract* produced 15 straight refusals — the translator was rejected for
a rule it had never been given. Contract plus checker: 33 rows, zero refusals,
first pass. **A guard that rejects what the prompt never asked for is not a
guard, it is a loop.**

**The item hash was computed over a JSON serialisation.** Whose byte form is an
implementation detail of whatever last wrote the row. Measured on group
`0a73efe4`: stem, explanation, all four option texts and their order **identical**
— and the hash different. Had that shipped, `i18n.reviewed` would have reported
all 30 approvals STALE and put a red gate on two live certifications for a reason
that was false.

---

## 7. CORRECTIONS I MADE TO MY OWN CLAIMS

- **"The secure path was never given the source."** False. The drafter had it
  eight minutes before the run started. The *critic* did not.
- **"The cue guard is inconsistent about its own rule."** False, and damaging to
  say. `ABS_WORDS` is fifteen words and the rule fires only when *every*
  distractor matches; the rejected item had three on the list, the passed ones
  had one. **I counted by a broader definition than the code's and blamed the
  code.** Before calling a gate unreliable, read the predicate.
- **"The single-language groups are an orphan defect."** False. The function's
  own docblock says one language per call and a group of one is correct. I
  inferred a bug from a shape without reading what produces the shape.
- **"The exemptions have never applied."** False. They load, and ISMS-IA reports
  PASS. The WARN I read predated 305 being applied. *(The read was still
  failure-tolerant and now throws.)*
- **"The thirteenth defect."** It was two, and the second had the defect in its
  **key** — where correcting the key alone would have made a distractor correct.

---

## 8. OPEN ITEMS

1. **The four Amendment 1:2024 items** — waiting on the amended text.
2. **AIE-I is still writing ungrouped items.** Unchanged from v10.0.
3. **SM-AI-I's 20 ungrouped items.**
4. **`llms.txt` has never been read** and is the de facto policy on what this
   platform tells machines about itself.
5. **The quotation audit** — `ISMS-IA_JTA_v2.0.md` quotes Amendment 1:2024
   verbatim, which departs from a rule this repo states explicitly:
   *"never reproduce standard clauses verbatim… the same facts-not-expression
   discipline that governed the Scrum work."* Nobody knows how many others there
   are. **This gates the courseware MCP.**
6. **`role_table_grants` shows nothing in this database** and the reason is
   unknown. Not blocking, but it defeated one diagnosis already.

---

## 9. THE NEXT THING

A **courseware MCP** — partner agents and holders querying lessons and BoK. The
server exists at `certidemy-web/app/mcp/route.ts`.

Three things were scoped and one is already answered by the schema:

- **The secure bank is already structurally protected.** `visibility='secure'`
  aligns perfectly with `pool` and `is_exam_scope` across 12,511 items, and **no
  RLS policy exposes it to any role**. The guarantee is: *the MCP must never hold
  `service_role`.* Then no prompt, adversarial or otherwise, can produce SQL that
  returns an exam item.
- **Credential-as-key does not authenticate.** Every credential code is published
  at `credentials.certidemy.com/credentials/{code}` — it is an identifier, not a
  secret. A holder-initiated scoped token is a real build.
- **AISM-I is the pilot.** 226 concepts, 1,098 items, **zero ISO citations**. It
  is entirely original authorship, has no IP question to resolve, and is the part
  nobody can replicate.

**Start with the quotation audit.** It is mechanical, the PDFs and the citation
index are already on disk, and it decides whether ISO-derived content can be
exposed at all.
