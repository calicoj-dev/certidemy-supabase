# HANDOFF v12.9 — the guard that could not see an accent

2026-09-17, continuing the same day as v12.8. AIMS-IA went from 6 of 40 lessons
servable to **40 of 40, zero refused, longest run 9 words against a threshold of
10**. Five modules, 192 runs, all committed in seven batches with a boundary
after each.

**The delivery is the smaller half of this session.** The larger half is that
the obligation guard — the instrument every translation in this arc passed
through — had five patterns that could never fire, and the way that was found is
the part worth keeping.

---

## 1. `\b` is ASCII-only, and five patterns could not fire

JavaScript defines `\b` over `[A-Za-z0-9_]`. An accented letter is **not** a word
character to it, so the boundary between `á` and a space is no boundary at all,
and `/\bdeber[áa]n?\b/` never matched `deberá` **with the accent** — ISO's
rendering of `shall`, and the form real Spanish writes.

Exactly five patterns were affected, and the rule turned out to be mechanical:
only a match that **BEGINS or ENDS** on an accented character is invisible. An
accent in the middle is fine, which is why `obligación`, `podría` and `convém`
all worked and hid the family for as long as this file has existed.

```
es strong   deberá            ISO's `shall`
pt strong   deverá            same
pt strong   deverão           not even in the character class -- a separate gap
pt strong   é necessário      leading vowel
pt weak     é recomendável    leading vowel
```

### The refusal was the lucky half

It surfaced as **two false refusals** on correct AIMS-IA module 2 translations —
`deberá considerar el propósito previsto` reported as a dropped obligation. A
refusal is loud. The silent half is that `noModalInflation` is built on these
same lists, so an English `should` rendered as `deverá` **passed the check
written to catch exactly that**.

Every modal-inflation sweep run before this date undercounted. The batch of 53
translations already accepted under the broken guard was **discarded and re-run**
rather than applied, because they had been validated by an instrument now known
to be blind in the direction that matters.

### Every existing control was written in unaccented Spanish and Portuguese

`debe`, `debería`, `Convem`, `necessarios`. That is house style in this repo, and
it is why the bug was **structurally unreachable**: the controls could not have
caught it, because they never wrote an accent.

The new controls assert the vocabulary directly, in the orthography the
translations actually use, with a negative half so `deberes`/`deveres` cannot be
counted as modals. They were **verified to fire against the old regex**, not
merely to pass against the new one — the first attempt at that verification used
lookarounds rather than `\b` and did not reproduce the defect at all, which is
its own small lesson about proving a control can fail.

---

## 2. Five more vocabulary gaps, all one family

The file already carried the rule: *every verb on a strong list needs its noun
beside it.* Today added three more forms of the same mistake and a fifth
arbitrary omission.

| form | gap | what it refused |
|---|---|---|
| participle | `exigido`, `requerido` | "provided, not required" → "fornecidos, não exigidos" scored 0 |
| subjunctive | `puedan`, `possam` | "can give" → "possam produzir" scored 0 |
| weak modal | `could` (en) | "could weaken the conclusions" read as a dropped `can` |

`can` and `might` were both on the English weak list and `could` was not. There
was no reason for that, the same way there was no reason `obligation` was on the
strong list and `requirement` was not.

**Every one of these was found by a guard refusing a faithful translation, never
by review.** That is now the established discovery mechanism for this file, and
it works because the two sides disagree out loud.

---

## 3. Overlapping patterns were double-counting

`are required to` and `required` both match the same four words, so *"are
required to be used"* scored **strong 2 for one obligation**. Recasting it to
"has to be used" printed `2 -> 1` and read as a dropped `shall`.

It never changed a **verdict**, because every rule here turns on reaching zero.
It changed what the printed numbers **mean** — and those numbers get read: the
real dropped `shall` in AIMS-IA 04-08 was caught hours earlier by noticing
`3 -> 2` in this same column.

**An instrument trusted at 3 → 2 has to be trustworthy above zero, not only at
it.** Matches are now merged by position: two patterns covering the same words
are one modal, two separate modals stay two. Both directions have a control,
because a merge that collapsed a genuine pair would be the same bug with the
opposite sign.

---

## 4. What the generator refused, and why every refusal was right

Across the five modules the spec generator refused **fourteen times**. Not one
was a false alarm.

- **Eleven were runs still adjoining after a fix.** A run spanning three bullets
  cannot be broken by recasting one of them: the tail of the first and the head
  of the third still adjoin. Each was visible only after the previous fix landed,
  so they came out one at a time.
- **Three were dropped modals in my own recasts** — clause 8.1's "corrective
  actions **shall** be considered" flattened to "corrective action considered",
  in both places the lesson quotes it; and clause A.2.3's "where other policies
  **can** be affected by" turned into a flat assertion that they are.

### The junctions nobody would predict

- A control's **title** adjoining its own text: `**A.2.2, AI policy**` followed by
  "the organization shall document a policy".
- A **lead-in** adjoining its first list item: "establish an AI policy that:" +
  "a) is appropriate to the".
- A list's **numbered sub-items** adjoining each other and then adjoining the
  next lettered item — 05-07 d)'s three sub-items ran to fourteen words with no
  prose between them. Short bullets are individually harmless and collectively a
  run. Breaking one of the three was enough.

---

## 5. Two defects that were mine, not the tooling's

**`should` as conditional inversion is not a modal.** My 04-04 recast ended
*"...for societies should an identified risk come about"* — `should` meaning
**if**, not **ought**. The guard reads it as a modal and cannot be taught
otherwise without parsing; the inflation check would later have asked why the
translation carries no modal.

Teaching the guard was the wrong fix — its value is that it is a word list anyone
can read. The sentence now says *"what **might** follow ... **if** an identified
risk came about"*, which carries a real weak modal, is more accurate about a
potential consequence, and lets the guard agree **honestly** rather than be
overridden.

**Negations are where a recast goes wrong quietly.** Annex A.1's *"NOT ALL
control objectives and controls ARE REQUIRED to be used"* and B.1's
*"organizations DO NOT HAVE TO document or justify"* are permissions written as
negations. A recast that tidies the negation away inverts the meaning and still
reads perfectly. Both stay negations. **The guard counts modals and cannot see a
flipped polarity** — that one is on the author, and nothing in this repo will
catch it.

---

## 6. The scan must be the last step

Applying translations writes `content_md`, which fires `clear_mcp_servable()`. So
after module 5's translations landed, AIMS-IA read **en 40/40 but es-419 33/40** —
seven groups incoherent.

That is the trigger working exactly as designed, and it means **apply, then
scan**, never scan then apply. Earlier modules healed by accident, because the
next module's scan re-measured all 1,437 rows. Module 5 had no next module.

---

## 7. Two places where the quoted words are the lesson

Recasting is mechanical until it meets a passage whose wording **is** the
teaching point. Three of those, all left intact:

- **04-09's minimal pair.** Table A.1's A.2.2 and Annex B's B.2.2 sit on
  consecutive lines, identical but for one word — `shall` against `should`,
  normative against informative, a finding against no finding. Both got the
  **same** recast, differing only in the modal. Recasting them independently
  would have produced two sentences differing in several ways, and the pair would
  have stopped teaching anything.
- **04-08 quotes clause 8.2 AND 8.4 side by side** precisely because their
  triggers differ. Only 8.2 crossed the threshold, so only 8.2 was recast. The
  contrast survives because it was never about matching ISO's wording — it was
  about the two clauses differing from **each other**.
- **04-06's and 04-04's `can`**, each followed immediately by a sentence saying
  *"that is a `can` — permission, not a requirement"*. The words around the modal
  move; the modal does not.

---

## 7b. The work was done and the door was still shut

**AIMS-IA's forty lessons are repaired, measured clean, and unreachable.**

Every mcp view filters on `c.code = any (allowed)`. Migration 334 put AIMS-IA in
`held`, and nothing since changed it. So the certification is absent from the
surface entirely -- no record, no blueprint, no catalogue, no bodies -- while all
120 of its lesson rows carry `mcp_servable = true`.

This was one sentence away from going into a partner-facing readiness note as
*"AIMS-IA now serves completely in English."* It was caught by reading 334's
array, not by any instrument.

**Both instruments were telling the truth about different things.**
`mcp_servable` is a statement about a LESSON's content. `allowed` is a statement
about a CERTIFICATION's admission. A lesson can satisfy the first and be
invisible under the second, and **nothing in this repo compares them** -- the
leak scanner has no idea what `allowed` contains, and its six post-conditions
are all about measurement.

Same family as every other entry in these handoffs: a green result that is
correct at the grain it was taken and false at the grain it was used.

### Three changes, and the order is not interchangeable

1. **`migrations/336_mcp_admit_aims_ia.sql`** -- WRITTEN, NOT RUN. Admits
   AIMS-IA, keeps ISMS-IA held. Its post-conditions assert **reachability**
   rather than servability, because counting `mcp_servable` rows would have
   passed before the migration existed. It also asserts the negative half
   (ISMS-IA still absent, non-English bodies still refused, `mcp_reader` still
   cannot select `mcp.lesson`) because a rebuild that dropped 333's or 335's
   predicate would pass every positive check.
2. **Deploy `courseware-read`** -- the `CERTIFICATIONS` list is edited, not
   deployed. **Migration first.** Deploying ahead of it makes the function
   ACCEPT `AIMS-IA` while the view returns nothing, so a partner is told the
   certification has no lessons -- a plausible empty answer. The other order
   gives a clean "not served" refusal that is true when it is said.
3. **A web session** for `certidemy-web/lib/mcp/registry.ts` -- the Worker emits
   ten certifications and would refuse AIMS-IA before the request reaches the
   function.

`scripts/check-cross-repo-vocabulary.mjs` passes in exactly this state and says
why: *"certifications: web contract emits 10, courseware-query accepts 11."* The
asymmetry is the safe direction -- the acceptor is a superset of the emitter --
which is the shape that rule was written for.

---

## 8. Where the four certifications stand

Read back from the live rows, not transcribed:

| cert | english | non-english | of those, withheld pending review |
|---|---|---|---|
| AIMS-F | 35/35 | 70/70 | 68 |
| ISMS-F | 49/49 | 98/98 | 6 |
| **AIMS-IA** | **40/40** | **80/80** | **78** |
| ISMS-IA | 7/38 | 14/76 | 0 |

AIMS-IA scans at 120 rows, **0 refused, longest run 9w**. The scanner's negative
control (AISM-I, cites no ISO, longest 8w) and positive control
(`isms-ia-05-05` trips at ≥40w, measured 87w) both hold, so the clean sweep means
something.

**This table is about CONTENT, not about what a partner can pull.** AIMS-IA's
column reads 40/40 and AIMS-IA is unreachable until 336 runs. See 7b.

**The withheld column is the honest part.** A non-English lesson is servable and
still refused, because `mcp_translation_review_required` stays true until an
approved `lesson_translation_reviews` row with a matching `en_hash` exists. 78 of
AIMS-IA's 80 translated rows are in that state. English is what a partner can
pull today.

### Paragraphs that could not be re-translated

Roughly 20 across the five modules, each withheld rather than forced:

- **LANGUAGE ties** (`want 0, avoid 0`) on short list items — *"be held as
  **documented information**"* has no distinctive token in either target
  language. The guard refuses to certify what it cannot decide, which is right.
- **Glossary keys the model kept adding** — `clause`, `clause-6-1-3`,
  `nonconformity`. Refused every time; adding an annotation changes the rendered
  lesson.
- **Portuguese list obligation carried by the LEAD-IN.** *"e que informação
  documentada apropriada **seja mantida**"* under *"a organização **deve**:"*. The
  English bullet repeats `shall` on every item, so the guard reads 1 → 0 per line.
  It is comparing line against line where the obligation is carried by the
  paragraph. **This is a real limit of a per-line guard**, not a translation
  defect.

---

## 9. Open, in the order I would take them

1. **ISMS-IA's 48 blockquotes.** The ruling is made — inline marker, not
   omit-and-report, and the measurement is the reason: **50 of 58 blockquotes
   carry an announcing lead-in**, so omission would leave a visible hole in most
   of them. That is a `contractVersion` bump and a change to `lesson-blocks.ts`,
   which is web-repo work. 31 of 38 lessons are waiting on it.
2. **The 134 modal-inflation paragraphs**, re-measured under the fixed guard:
   AIMS-IA 88, ISMS-IA 41, AIMS-F 1, ISMS-F 4. The earlier figure of 191 is **not
   comparable** — two AIMS-IA modules were re-translated in between and the prior
   findings file was never committed. 134 is the number; the delta is not
   attributable and should not be quoted as one.
3. **The ~20 withheld paragraphs above.** The Portuguese lead-in case may be
   worth a guard change (compare paragraph against paragraph, not line against
   line); the LANGUAGE ties probably are not.
4. **41 `cláusula` instances** that should read `apartado` / `seção`.
5. **The bilingual read** of everything landed in this arc. Nothing here has been
   read by a bilingual human; the guards are mechanical and they say so.

---

## 10. One thing to distrust in this document

Section 8's table was read from the live rows at the end of the session. **Every
other number here is a count I took while working**, and v12.8's whole subject
was numbers taken at one grain and used at another.

If any of them matters, take it again:

```
node --dns-result-order=ipv4first scripts/scan-iso-leaks.mjs
```

Read-only without `--apply`. Its post-conditions and its two controls are the
only evidence in this arc that does not depend on my having counted correctly.
