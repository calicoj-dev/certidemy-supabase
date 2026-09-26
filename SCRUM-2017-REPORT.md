# How big is the 2017-Guide problem?

**Smaller than the raw count, and it found two items the 342-item read could not
reach.** Report only; nothing written.

`scripts/scan-2017-guide-markers.mjs`, read-only, over the **English secure pools**
of the four certifications that cite the 2020 Scrum Guide.

---

## The counts

**1,555 English secure items examined, 84 marker hits.**

| cert | items | BARE | CONTRASTED | distinct items flagged |
|---|---|---|---|---|
| SM-AI-I | 454 | **16** | 49 | 29 |
| SD-AI-I | 360 | **4** | 13 | 7 |
| SPO-AI-I | 389 | **1** | 0 | 1 |
| SM-AI-II | 352 | **0** | 1 | 1 |

**A hit is not a defect, which is why the split exists.** *"The 2017 Guide used
Development Team; the 2020 Guide replaced it"* is correct content — a certification
teaching the change has to name the old term. **CONTRASTED** means the hit sits
beside 2017/2020/renamed/replaced/no-longer language; **BARE** means it stands alone
as the current term.

| marker | BARE | CONTRASTED |
|---|---|---|
| `Development Team` | **0** | 11 |
| `self-organizing` | **0** | 20 |
| `servant-leader` | 11 | 29 |
| `three questions` | 4 | 1 |
| per-item accept/reject at the Sprint Review | 4 | 1 |
| `at least one high priority process improvement` | 1 | 1 |
| `first days of the Sprint` | 1 | 0 |
| single Product Backlog in SAFe or LeSS | 0 | 0 |

**`Development Team` and `self-organizing` are 31 hits and every one is
CONTRASTED.** Those two are the markers everyone expects to be the problem, and the
bank handles them correctly — it teaches the change rather than repeating the old
term.

## The ten read, and what they actually were

Of ten BARE hits read in full, **two are real, four are my regex, four are
terminology**:

**REAL — `65946c58` SM-AI-I task 3.6, explanation.** Asserts the 2017 rule as
current:

> The Scrum Guide expects the team to identify **at least one high-priority
> improvement** and add it to the next Sprint Backlog...

2017 said the Scrum Team "identifies at least one high priority process
improvement". **The 2020 Guide removed it** — it says the most impactful
improvements "**may** even be added to the Sprint Backlog for the next Sprint."
*Expects... and add it* against *may even be added* is a different obligation.

**REAL — `7c00917f` SM-AI-I task 3.3, and it is the KEY:**

> **(key, b)** A plan for building the increment, detailing enough work to cover at
> least **the first days of the Sprint**.

That qualifier is 2017 Sprint Backlog wording — work for the first days "decomposed
by the end of this meeting, often to units of one day or less." **The 2020 Guide has
no such rule.** The explanation repeats it: *"typically detailing enough work for the
first few days"*.

> **Both are TIER B, not Tier A.** In each the key is still the best available
> option — b really is the plan the *How* topic produces, and a really is the right
> retrospective action — so no candidate was scored wrongly. What is wrong is the
> **rationale**, which cites a rule the cited edition removed. That is the Tier B
> definition exactly: *the rationale conflicts with the source.* Neither is a
> credit-and-retire case.

**MY REGEX, not the bank — 3 of the 4 `per-item accept/reject` hits.** The pattern
catches *"acceptance criteria written per Product Backlog item"* and *"acceptance
criteria per item"*, which are ordinary product practice and nothing to do with the
retired Sprint Review accept/reject rule. `0aad23fd` and `8451528f` are clean;
`433eea57` is clean. **That marker is too loose and its count of 4 should be read as
roughly 1.**

**TERMINOLOGY, not content — the 11 BARE `servant-leader` hits.** The 2020 Guide
dropped the *servant-leader* label in favour of "true leaders who serve", but the
concept is unchanged and every hit read uses it substantively (`5535addc`: *"Servant
leadership does not mean passive deference"*). Dated vocabulary in a certification
that cites the 2020 Guide is worth a decision; it is not a scored-content defect.

**The `three questions` hits are mostly correct teaching.** `5ec39adf` (SD-AI-I) uses
them to make the right point — *"one possible technique, not a mandatory script"* —
with the distractor *"required by the Scrum framework"* correctly keyed wrong. The
one criticism available is that the 2020 Guide does not mention the three questions
at all, so *"The Scrum Guide offers the three questions"* attributes to the cited
edition something it does not contain. Thin, and worth an SME's minute rather than a
rewrite.

## What this tells Juan before the audit decision

- **The edition problem is real but small, and it is concentrated in rationales
  rather than keys.** Two genuine instances in 1,555 items from this marker set, both
  Tier B, both SM-AI-I.
- **It is not the `Development Team` problem anyone would have predicted.** All 31
  hits on the two obvious markers are handled correctly. Reasoning from the label
  would have got this backwards.
- **And §2 found something the 342-item read structurally could not.** Neither
  `65946c58` nor `7c00917f` was presented in any of the eight attempts, so no amount
  of reading exposed items would have reached them. That is the argument for the
  stratified audit in `AUDIT-SAMPLE.md`: the exposed set is what eight attempts
  happened to draw, and the bank is 4,166 English secure items.
- **A marker sweep is not an audit.** It finds shapes somebody already named. The
  Tier A findings in the director's read — a key contradicting its own stem, a key
  that rejects the 2020 Guide's own sentence — have no lexical signature and only a
  reader finds them. This sizes one family; it does not bound the problem.

**Both real instances are added to `ITEM-REVIEW-QUEUE.md` as Tier B**, with the
marker that found them, so the SME pass covers them alongside the 30 from the read.
