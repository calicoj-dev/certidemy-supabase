# Attributed quotation of ISO standards — a ceiling, for decision

**For Juan. This is a positioning and licensing decision, not an instrument question.**
Everything below is measured; the recommendation is reasoned from pedagogy and posture,
and one part of it needs an answer we are not qualified to give.

---

## What we found

Certidemy lessons quote ISO standards in attributed blockquotes. The leak scanner
**cuts those out before measuring**, per IP-POSITION §6, so no gate has ever reported
them and no number anywhere described them.

Measured for the first time on 2026-09-23:

| standard | spans | words quoted | longest | % of whole document | **% of clauses 4–10** |
|---|---|---|---|---|---|
| ISO/IEC 27001:2022 | 52 | 706 | 30w | 9.36% | **21.80%** |
| ISO 19011:2026 | 20 | 448 | **52w** | 2.21% | *not measurable* |
| ISO/IEC 42001:2023 | 4 | 79 | 27w | 0.38% | 1.95% |
| ISO/IEC 27001:2022/Amd 1 | 5 | 51 | 11w | 5.65% | *not measurable* |

**All 60 spans of ten words or more are in one certification: ISMS-IA.** 706 of the
716 quoted words of 27001 are ISMS-IA.

### The denominator matters more than the number

9.36% divides by the whole document — foreword, scope, terms, and Annex A's 93
controls, which are the bulk of the pages. An internal-auditor course quotes the
**normative clauses**, and against that denominator the figure is **21.80%**.

> **ISMS-IA reproduces roughly a fifth of the normative text of the standard it
> certifies against.**

That is the sentence for the decision. *Our course quotes standards* and *our course
reproduces a fifth of clauses 4–10 of 27001* are different claims.

*The 19011 and Amd 1 figures are marked not measurable rather than estimated: our
clause-boundary locator could not be verified by hand for those documents, and it
produced two different confident-looking wrong answers before we caught it. An
unmeasured number left blank is worth more than a plausible one.*

---

## What is already true, and what is not

**Attribution is present.** Every one of these is a marked blockquote with a lead-in
naming the standard, and often the clause. Nobody is passing ISO's text off as ours.

**Attribution answers the plagiarism question and not the reproduction one.** Thirty
words of a copyrighted standard are the same thirty words whether or not the line above
says where they came from. An accreditation assessor reads the second question.

**Every other exemption in our system carries a ceiling.** Named lesson exemptions each
record a reason and a `maxRun`, on the stated ground that *an exemption is a ceiling,
not a waiver*. The attributed-quotation exemption is the only one that is unbounded —
and it covers the longest spans in the corpus. A 52-word blockquote passes; so would
500 words.

---

## Proposal

### 1. Per span: 25 words — this is the real control

An ISO requirement sentence, or a lettered sub-item, is the examinable unit and is
almost always under 25 words. Above that we are quoting a **whole clause**, and a whole
clause quoted is the clause *delivered* rather than taught.

**Cost: 10 spans across 8 lessons, 337 words.** A 30-word ceiling would cost only 3
lessons and we think it is too loose for the same reason.

> **Read this as the control and the percentage below as the backstop.** A reader sees a
> percentage and assumes the percentage is doing the work. It is not: the per-span
> ceiling is what prevents a whole clause being reproduced, and the aggregate only
> catches accumulation the per-span rule cannot see.

### 2. Aggregate: 10% of a standard's normative core, per certification

Reported on every scanner run so it cannot drift back up quietly.

**One breach today: 27001 / ISMS-IA at 21.80%.** Clearing it means converting roughly
340 quoted words into our own prose.

**Why 10% and not 5%:** 5% of 27001's 2,908-word normative core is 145 words across an
entire auditor certification — about six requirement sentences. That is below what
teaching clauses 4 through 10 honestly needs, and a ceiling that cannot be met is a
ceiling that gets ignored.

### 3. Both are ceilings, not waivers

Same shape as every named exemption: a reason recorded, a limit stated, exempt spans
still printed with their score.

---

## The part we cannot answer

**Neither of us knows whether 10% is defensible to ISO.**

We are reasoning from two things: what a course needs in order to teach a clause, and
what it looks like for a certification body to reproduce a fifth of the normative text
of the standard it certifies against. Both are real arguments. **Neither is a legal
opinion.**

ISO standards are copyrighted and their reproduction is licensed. We hold reading
copies, not redistribution rights, and nothing in this repository has ever assessed what
quotation is permitted.

> **Given what Certidemy is — a body positioning itself as ISO/IEC 17024-aligned — you
> may want actual counsel on this number rather than our judgement of it.** That choice
> is yours to make and we are flagging it rather than burying it.

Our judgement, if you want it: the per-span 25-word ceiling is defensible on its own
terms and we would adopt it now. The aggregate figure is the one worth asking someone
about, because 21.80% is the number that would be quoted back at us.

---

## Supporting material

- `ATTRIBUTED-QUOTATIONS.md` — all 60 spans at 10 words or more, with lead-in and text
- `QUOTATION-DENOMINATOR.json` — the per-standard split by where each span sits
- `RUN-DISTRIBUTION.json` — the full run-length distribution behind the floor decision
