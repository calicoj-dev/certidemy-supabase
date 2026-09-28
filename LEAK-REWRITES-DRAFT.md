# Leak rewrites: drafts, scored, nothing written

**DRAFTS. Nothing in this document has been written to any table.** 11 live concept
descriptions that fire the leak gate against the widened nine-source index, each with a proposed
replacement and both texts scored by `lib/leak-score.mjs` -- the same scorer the production gate
uses, in one run, so the before and the after are the same instrument.

Regenerate: `node scripts/score-leak-rewrite-drafts.mjs` (read-only, no database).

| | |
|---|---|
| drafts scored | 11 |
| firing before | 10 |
| firing after | 0 |
| cleared by the draft | 10 |
| **made WORSE by the draft** | **0** |

**A score of 0 means no reproduction of the INDEXED documents**, never no reproduction. The index
is English-only, so a translated sibling of any of these is outside every leak instrument here.

**And two of these are not really leak findings.** `management-practice` and
`governance-definition` are ITIL's definitions word for word at coverage 1.00 -- a licensing
question about served text, not a drafting one. The rest are mostly four to six word descriptions
that restate their own names, where the high coverage is a symptom of terseness: they would fail
the anti-gloss rule at a leak score of zero, and the rewrite is owed on that ground whatever the
scorer says.

---

## AISM-I / `management-practice`

**Why it fires:** The whole description is ITIL's definition word for word: 13 contiguous words, coverage 1.00. ITIL is licensed, and this is served unauthenticated through get_concept.

| | run | coverage | words | source | matched span |
|---|---|---|---|---|---|
| current | 13 | 1 | 13 | itil4:2019 | `a set of organizational resources designed for performing work or accomplishing an objective` |
| **draft** | 0 | 0 | 43 | - | - |

verdict: current **FIRES**, draft **clean**

**current**

> a set of organizational resources designed for performing work or accomplishing an objective.

**draft**

> ITIL groups capability into practices rather than processes, so a practice carries the people, tools, information and suppliers a piece of work needs and not only its steps. Asking which practice owns an activity is how you find who is accountable for it.

---

## AISM-I / `governance-definition`

**Why it fires:** Ten contiguous words, coverage 1.00 -- again the entire description is the source's definition.

| | run | coverage | words | source | matched span |
|---|---|---|---|---|---|
| current | 10 | 1 | 10 | itil4:2019 | `the means by which an organization is directed and controlled` |
| **draft** | 0 | 0 | 39 | - | - |

verdict: current **FIRES**, draft **clean**

**current**

> the means by which an organization is directed and controlled.

**draft**

> Governance sets direction and holds management to it; it does not do the work. The examinable distinction is that governance decides what the organization is for and evaluates whether management delivered it, while management runs the practices that deliver.

---

## AISM-I / `incident-management`

**Why it fires:** Eight words of ITIL's own incident definition. Under the ten-word floor and distinctive enough that a reader would recognise it.

| | run | coverage | words | source | matched span |
|---|---|---|---|---|---|
| current | 8 | 0.667 | 12 | itil4:2019 | `restoring normal service operation as quickly as possible` |
| **draft** | 0 | 0 | 35 | - | - |

verdict: current **FIRES**, draft **clean**

**current**

> restoring normal service operation as quickly as possible after an unplanned interruption.

**draft**

> Restoration is the goal rather than diagnosis: an incident closes when the service works again, even if nobody yet knows why it broke. That is what separates it from problem management, which owns the cause.

---

## AISM-I / `guiding-principles`

**Why it fires:** Six words of ITIL's phrasing, coverage 0.67 over a nine-word description. The terseness is what makes the coverage high.

| | run | coverage | words | source | matched span |
|---|---|---|---|---|---|
| current | 6 | 0.667 | 9 | itil4:2019 | `guide an organization in all circumstances` |
| **draft** | 0 | 0 | 48 | - | - |

verdict: current **FIRES**, draft **clean**

**current**

> universal recommendations that guide an organization in all circumstances.

**draft**

> A principle holds whatever the organization happens to be doing, which is what makes it a principle and not a practice. All seven apply in every situation, though not all are equally relevant each time, so the skill being tested is weighing them together rather than choosing one.

---

## AIGRM-I / `gpai-obligations`

**Why it fires:** Eight words of the Regulation. The AI Act is public law rather than licensed text, so the reproduction question is weaker here -- but the anti-gloss rule is not, and this says nothing the Regulation does not.

| | run | coverage | words | source | matched span |
|---|---|---|---|---|---|
| current | 8 | 0.727 | 11 | euact:2024/1689 | `obligations on providers of general purpose ai models` |
| **draft** | 6 | 0.12 | 50 | euact:2024/1689 | `and places it on the market` |

verdict: current **FIRES**, draft **clean**

**current**

> Documentation and transparency obligations on providers of general-purpose AI models.

**draft**

> These fall on the provider of the model -- whoever develops it and places it on the market, and equally a downstream party whose substantial modification makes it the provider for that modification. They attach to the model itself, so they apply even where no high-risk use has been declared.

---

## AIGRM-I / `minimal-risk`

**Why it fires:** Five words, coverage 0.625 over eight. Predicted tier B by the calibration.

| | run | coverage | words | source | matched span |
|---|---|---|---|---|---|
| current | 5 | 0.625 | 8 | euact:2024/1689 | `the majority of ai systems` |
| **draft** | 5 | 0.074 | 68 | euact:2024/1689 | `voluntary codes of conduct are` |

verdict: current **FIRES**, draft **clean**

**current**

> The majority of AI systems; no specific obligations.

**draft**

> Most systems land here, and that means no risk-tier obligations rather than no obligations at all: the AI-literacy duty in Article 4 reaches providers and deployers of every AI system, and voluntary codes of conduct are encouraged. So a claim of minimal risk is a claim about how the system is used, and it is the provider who has to be able to defend the classification.

---

## AIGRM-I / `synthetic-content-labeling`

**Why it fires:** Five words of the Regulation over an eight-word description.

| | run | coverage | words | source | matched span |
|---|---|---|---|---|---|
| current | 4 | 0.5 | 8 | euact:2024/1689 | `ai generated or manipulated` |
| **draft** | 4 | 0.108 | 37 | euact:2024/1689 | `the provider of the` |

verdict: current **clean**, draft **clean**

**current**

> Marking AI-generated or manipulated content as artificial.

**draft**

> The duty is to make the artificiality detectable, which means machine-readable marking rather than a visible caption alone. It falls on the provider of the generating system, separately from any duty on whoever publishes the output.

---

## SPO-AI-I / `product-ecosystem-actors`

**Why it fires:** Four words, and the match is ordinary English. The real defect is that the description is a LIST: it teaches nothing and would fail the anti-gloss rule at a leak score of zero.

| | run | coverage | words | source | matched span |
|---|---|---|---|---|---|
| current | 4 | 0.8 | 5 | itil4:2019 | `customers users and sponsors` |
| **draft** | 5 | 0.094 | 53 | 27002:2022 | `the person who uses the` |

verdict: current **FIRES**, draft **clean**

**current**

> Stakeholders, customers, users, and sponsors.

**draft**

> A user is not a customer and a sponsor is neither: the person who uses the product, the person who pays for it and the person funding the team can be three people with conflicting definitions of value. That is why a Product Owner has to name all three rather than say stakeholders.

---

## SPO-AI-I / `story-independence`

**Why it fires:** Four words of ordinary English. Again the description is a restatement of its own name.

| | run | coverage | words | source | matched span |
|---|---|---|---|---|---|
| current | 4 | 0.667 | 6 | itil4:2019 | `that can be delivered` |
| **draft** | 0 | 0 | 35 | - | - |

verdict: current **FIRES**, draft **clean**

**current**

> Items that can be delivered independently.

**draft**

> Independence is what lets the Product Owner reorder the backlog without renegotiating a bundle. Where two items can only ship together they are usually better treated as one item, or split along a different line.

---

## SM-AI-I / `scrum-adoption`

**Why it fires:** Four words matching NIST, which is a collision rather than a reproduction. The description restates its own name.

| | run | coverage | words | source | matched span |
|---|---|---|---|---|---|
| current | 4 | 0.667 | 6 | nist-ai-rmf:1.0 | `at the organizational level` |
| **draft** | 4 | 0.095 | 42 | ebm:2024 | `the difference between a` |

verdict: current **FIRES**, draft **clean**

**current**

> Introducing Scrum at the organizational level.

**draft**

> Beyond one team, Scrum meets structures it does not control -- budget cycles, reporting lines, annual planning -- so the Scrum Master's work shifts from coaching events to influencing those. That is the difference between a team adopting Scrum and an organization doing so.

---

## AIGRM-I / `explainability-for-stakeholders`

**Why it fires:** Four words matching a BSI adoption. A collision, and the description restates its own name.

| | run | coverage | words | source | matched span |
|---|---|---|---|---|---|
| current | 4 | 0.667 | 6 | 17021-1:2015 | `appropriate to the audience` |
| **draft** | 0 | 0 | 40 | - | - |

verdict: current **FIRES**, draft **clean**

**current**

> Providing explanations appropriate to the audience.

**draft**

> One explanation cannot serve an auditor, an affected individual and an engineer: the auditor needs the process, the individual needs the reason for their own outcome, and the engineer needs the mechanism. Choosing the audience first is the whole task.

