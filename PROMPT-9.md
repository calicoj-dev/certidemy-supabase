certidemy-supabase

The 119 changes the order of work. AIMS-IA moves ahead of ISMS-F's tail. Nothing here is a
gate change — the gate is now right and it is telling us something about the content.

## 0 — The policy, which is the actual decision

98 real clause-text reproductions, and the census explains them: **137 of AIMS-IA's 158
descriptions — 87% — are shaped *"clause N.N defines/requires/states …"* followed by the
text.** At 87% that is not drift, it is the pedagogy of an internal-auditor certification,
where the thing being taught genuinely is the requirement as written.

So the instruction is not "rewrite until the gate is quiet." That pushes toward paraphrase
that loses the examinable point, and the tension is real: you cannot teach an auditor what
4.1 requires while avoiding the words *determine external and internal issues*.

**The policy:**

> A description may **name a clause** and state what it requires **in our own words**. It may
> quote a short distinctive phrase where the wording itself is the examinable thing. It may
> **not** reproduce a contiguous span of the standard's own sentence at or beyond **10
> words**.

The 10 is the absolute floor you just adopted, so the instrument enforces the policy exactly
rather than approximating it. Record the policy beside the gate parameters, and record why:
attribution answers plagiarism and does nothing about reproduction, and an accreditation
assessor reads the second question, not the first.

## 1 — The distribution, before any writing. Read only.

I am not sequencing 98 rewrites on a number I have not seen.

Report a histogram of **longest contiguous run** across the 98 clause-text rows, per
certification, in buckets: 10–12, 13–15, 16–19, 20–24, 25–29, 30+. For each bucket give the
row count and name the three longest rows in it with their run, their source and clause, and
their description length.

Also report, for the 98:

- how many name a clause number in the description text (the *"clause N.N …"* shape) versus
  how many reproduce without attribution — the second class is worse and should be done first
  within any bucket
- how many are **definitions of defined terms** (the *"clause 3.x defines it as …"* shape)
  versus **requirement statements** (*"clause 6.1.4 requires …"*). They need different
  rewrites: a defined term can be restated freely, a requirement has to keep its normative
  force
- the overlap with rows already rewritten in any batch — should be zero, but say so

Stop there. The bucket order decides the batches and that is my call, not yours.

## 2 — The 6 Annex-A structure rows

Widen the title-class exemption to cover them. Reproducing a control family's **title** is
naming the thing, not reproducing its content, and a candidate has to meet those names to
navigate Annex A at all.

State the exemption narrowly so it cannot creep: a span is title class when it matches a
heading or table-of-contents entry in the source **and** the description contains no
sentence from the clause body. Report its firing count before and after, and name any row it
newly exempts that is not one of the 6 — if it exempts more than 6, the definition is too
wide and I want to see which.

## 3 — The locator defect, and the rule it earns

You found it: the annex locator took the **first** occurrence of *"annex a normative"* — the
table of contents — putting 27001's boundary 6% into the document and finding nothing at all
in seven others. Over-reporting on two documents and under-reporting on seven at the same
time. `clauseText` already guards against exactly this.

**Rule — the table of contents is a decoy in every indexed PDF, and a new locator inherits
the existing one's defences or states why it does not need them.** Mechanism: one shared
locator in `scripts/lib/`, used by every instrument that addresses a clause or an annex
boundary. Three instruments have now been written against these PDFs and all three hit the
TOC on the first attempt. Occasion: `clauseText` (4.1 behind the watermark column), the
main-body/Annex A shadowing fix, and this.

Move the locator into the shared lib and point the existing callers at it. If any caller
cannot use the shared one, say which and why rather than keeping a private copy.

## 4 — ISMS-F, what is left of it

Its fire count is 4 and all four are with me in the batch-1 revised file. The rest of ISMS-F
is **quality**, and quality yields to exposure.

- Batch 3 is written — send it to me and I will read it while section 1 runs.
- **Do not start batch 4.** ISMS-F's remaining tail waits until AIMS-IA's reproductions are
  dealt with.

One style rule to record, because it has survived three batches: **a description may not
point at a reason it does not give.** `time-to-discovery` ends *"and why it widens here"*
without saying why; batch 1 had *"both halves matter"* and *"cuts both ways"*. Mechanism: a
description containing *why*, *both*, *the second*, *that distinction* or similar must be
readable standing alone, with no antecedent outside itself — it is served alone, and the
description it replaced is not there to supply the referent.

## 5 — Not withholding, and when that gets revisited

I am not re-provisioning the 69 AIMS-IA rows. Serving fallback for 69 concepts makes the
certification look half-built to exactly the partner we are courting, which is a worse Friday
than the reproduction risk over three days.

**That is revisited Thursday.** If the 20+ buckets are not clear by then, the longest rows
get withheld rather than shipped. Record the decision and its expiry so it is not mistaken
for a judgement that the rows are fine.

## 6 — Recorded from your last report

**The arithmetic.** 40 − 4 = 36, not 37. My verdict block and my prose disagreed and you took
the instruction over the number. That is the right precedence and I want it recorded as such:
where a count and an instruction conflict, the instruction governs and the conflict is
reported.

**`pdca-cycle`.** *plan-do-check-act* and *PDCA* appear in neither 27001:2022 nor 42001:2023;
only in 19011. So **both** mappings were unsupported — mine naming 6 and 7, and my
"correction" naming 4 through 7. I corrected an undeclared citation claim with another
undeclared citation claim, inside a ruling whose subject was unverified claims. Dropping the
mapping entirely was right. Record the instance beside the others.

## 7 — Out of scope

The 916-row full read. The monolingual leak gap. 42006. ISMS-F batches 4 and beyond. ISMS-F
retranslation.
