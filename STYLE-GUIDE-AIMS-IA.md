# STYLE-GUIDE-AIMS-IA.md

**What this is:** the quality contract for AIMS-IA lesson authoring, derived from
module 1 and the external review that accepted it at 9.0/10. It is the CERT-CREATION
Stage 7 artifact: module 1 was authored, reviewed, and the accepted feedback turned
into an explicit reusable contract so that modules 2 to 5 are written to a proven
standard rather than re-litigated per module.

**Scope.** This guide is specific to AIMS-IA. It does not restate
`LESSON_AUTHORING_SPEC.md`, which governs the section-marker DSL, widget schemas and
frontmatter for every cert. Where the two speak to the same thing, the spec governs
and this document adds only what module 1 established.

**Status:** locked for modules 2 to 5.

---

## 1. The shape module 1 proved

Every lesson runs 13,000 to 16,500 characters and 11 to 13 `duration_minutes`.
Section order:

```
::hook                    one or two sentences, a concrete puzzle
::concept x 3-4           titled, claim-based (see section 2)
::callout                 one or two, interleaved between concepts
::interactive             one widget, JSON body
::deep-dive               one, extending rather than repeating
::checkpoint              exactly one, four questions
::summary                 exactly one, six bullets
```

`::callout` placement is not fixed. It belongs where the misconception it corrects
would occur to the reader - after the concept that provokes it, not collected at the
end.

---

## 2. Concept titles state a claim, never a topic

This is the rule the review flagged, and the one most easily lost.

A `::concept` title asserts the teaching point in the reader's memory. A descriptive
title makes them read the section to find out what it said.

| Do not write | Write |
|---|---|
| What clause 4.6 actually says | Independence is asked for wherever practicable, not absolutely |
| What ISO 19011 says about its own status | ISO 19011 states no requirements, and says so itself |
| What counts as criteria | Criteria include the organization's own requirements, named first |
| What clause 9.2 asks you to produce | Clause 9.2 asks for information, not a decision |
| What an internal audit of an AIMS is for | An internal audit answers against two sets of criteria, not one |

The test: read the title alone. If it tells the reader something true and useful
about auditing, it is claim-based. If it tells them only what the section is about,
rewrite it.

---

## 3. Attribution discipline

This is what the credential certifies, so the lessons model it rather than merely
describing it.

- **Never write that ISO 19011 requires or mandates anything.** Write *recommends*,
  *calls for*, *advises*, or name the clause and quote its modal. ISO 19011:2026 has
  one `shall` (patent boilerplate) and 264 `should`.
- **Never write that the standard states there is no precedence** among the
  principles. Write that it *presents them without ranking them*. An absence in the
  text is not an assertion by the text.
- **Never assert a Table A.1 control unconditionally.** Annex A.1 records that not
  all controls are required to be used. Write *where A.2.2 is selected, the
  organization shall document an AI policy*, never *ISO/IEC 42001 requires an AI
  policy*.
- **Never describe Annex B as informative.** It is normative and written in
  `should`, binding through clause 6.1.3 e).
- **Never attribute major/minor grading to ISO/IEC 42001.** It uses only
  *nonconformity*. Grading comes from certification practice; ISO 19011 clause 6.4.8
  permits it where the criteria are defined and communicated.
- **Never cite a clause of a document the body does not hold** - ISO/IEC 22989,
  ISO/IEC 42006, ISO/IEC 17021-1. Name them and their scope; cite no clause numbers.

**Where a lesson quotes a clause, it quotes the clause's own modal.** A `shall`
stays a `shall` and a `should` stays a `should`, in bold where the distinction is
the teaching point.

---

## 4. Checkpoint questions

- **Exactly four**, all with `bloom_level` matching the lesson's task. A task at
  `3_apply` produces four apply questions; a task at `4_analyze` produces four
  analyze questions. This is not a target to average toward - `trg_item_bloom_matches_task`
  enforces it at database level for items, and the lessons should not disagree.
- **`difficulty` 3 to 5.** Module 1 landed on 3/4/4/4 and 4/4/5/5. A difficulty-2
  question in a Level II cert is usually a recall question wearing an apply verb.
- **Distractors are real auditor errors**, not near-misses of wording. The best ones
  in module 1: citing a guidance document as criteria, asserting an independence rule
  that does not exist, accepting a certification body's audit as discharging clause
  9.2, treating an impact assessment and a risk assessment as one activity.
- **`single_choice` by default.** Module 1's one `multi_choice` was the weakest item
  in the module and was replaced. Multi-select tests recall of a list; single-best
  tests judgement.
- **Explanations say why the wrong answers are wrong**, not only why the right one is
  right - and stop there. Three to five sentences. Module 1's longest ran to seven and
  the review asked for them tightened.
- **`concept_slugs` on each question** must be slugs the lesson declares in its
  frontmatter.

---

## 5. Interactives

Use only widget schemas for which a working example exists in the repo. As of module
1 that is **`drag-match`** and **`toggle-and-observe`**. `highlight-mistake`,
`sort-into-order`, `scenario-mcq` and `annotated-diagram` are in the spec; before
using one, read a rendered example from an existing cert rather than authoring from
the schema alone.

**`drag-match`** suits classification - engagement to audit party, statement to
whether it can carry a finding, activity to whose remit it is. Four items, four
targets, and one of the four should be the case that catches people. The
`explanation` names which one and why.

**`toggle-and-observe`** suits dependent chains, where each step only becomes
possible once the previous one is taken. Use `depends_on`. The `reflection_answer`
should say what the exercise was really about, and it is the right place to state
that a tension was resolved by a trade rather than by a rule.

Every widget carries `concept_slugs` drawn from the lesson's frontmatter.

---

## 6. Deep-dives extend, they do not repeat

A `::deep-dive` earns its place by going somewhere the concepts did not:

- module 1 lesson 1 went to the second-party case that arrives through A.10 supplier
  relationships;
- lesson 2 went to why the precedence distinction is load-bearing for findings later
  in the credential;
- lesson 4 went to the recursive case of auditing the audit arrangement itself.

If the deep-dive restates a concept at greater length, cut it.

---

## 7. What makes an AIMS-IA lesson different from its ISMS-IA sibling

The two schemes are deliberately parallel and the lessons must not be
interchangeable. Four things carry the difference, and a lesson touching any of them
should say so explicitly:

1. **The AI system impact assessment** (6.1.4, 8.4, Annex A.5) is a required artifact
   distinct from the risk assessment, addressing consequences for individuals, groups
   and societies. No ISO/IEC 27001 analogue.
2. **Normativity is layered.** Annex A is `shall`; Annex B is normative and `should`,
   binding via 6.1.3 e); Annexes C and D are informative.
3. **Scope follows a role determination.** Clause 4.1 has the organization determine
   its roles - developer, provider, user, possibly several on one system - and 4.3
   scoping follows.
4. **Evidence types are unfamiliar.** A.4 resources, A.6 life cycle and A.7 data call
   for documentation a conventional management-system auditor has never sampled.

**The fifth, minor but frequently mis-stated:** the climate-change wording is in the
published first edition of ISO/IEC 42001. There is no amendment. ISO/IEC 27001
acquired the same wording through Amd 1:2024.

---

## 8. Voice

Module 1 established it and the review endorsed it.

- **Second person for the auditor, third for the organization.** *You ask whether...*
  / *The organization shall determine...*
- **Open on a concrete puzzle**, not a definition. The hook is a specific situation
  whose resolution is not obvious.
- **State the rule, then the exception, then what to do.** Not the reverse.
- **Name the misconception explicitly** where one exists. "You cannot audit your own
  work" and "the standard states no precedence" are both named and dismantled in
  module 1 rather than quietly avoided.
- **No filler sentences at section boundaries.** No *in this section we will look
  at...*, no *as we have seen*.
- **Localization-friendly:** no idioms, no country-specific institutions, no currency
  assumptions, metric units. These lessons are translated into es-419 and pt-BR.

---

## 9. Frontmatter conventions for this cert

```
lesson_id         aims-ia-<NN>-<NN>-<slug>
lesson_group_id   identical to lesson_id
module_slug       aia-<module>          (matches the modules table)
certification_code AIMS-IA
task_codes        exactly one task per lesson
concept_slugs     exactly the JTA slugs for that task, all of them
prerequisites     the previous lesson in the module; [] for the first
duration_minutes  11-13
status            draft
```

**One lesson per task, all 40.** `concept_slugs` must match the locked JTA exactly -
not a subset, not an addition. A lesson that wants a concept the JTA does not carry
is a signal to amend the JTA deliberately, not to add a slug locally.

---

## 10. After authoring: the step that has been missed twice

`LESSON_AUTHORING_SPEC` Section 12 is mandatory and has been skipped on two certs -
SM-AI-I's six AI lessons, and all 132 of SPO-AI-I's rows.

Frontmatter alone is inert. `wire-lessons.mjs` projects `concept_slugs` and
`task_codes` into `lesson_concepts` and `lesson_tasks`, which is what the running
system queries. **A lesson with zero rows in either is not done**, and the
traceability matrix has a hole in it.

Dry run, review the UNRESOLVED report, then apply.

## 11. Rules that generalise across modules

Established by module 1 and module 2 and their external reviews. These are the
recurring distinctions an AIMS-IA lesson has to get right, and the recurring
distractors an item writer should reach for.

**1. Programme risks are not the organization's AI risks.** ISO 19011 clause 5.3
concerns risks that the audit programme will not achieve its objectives - planning,
resources, team selection, communication, implementation, records, monitoring.
ISO/IEC 42001 clauses 6.1.2 and 8.2 concern risks to the organization's AI
objectives. Conflating them is a recurring distractor and should be used as one.

**2. Role determination is upstream of scope.** Clause 4.1 produces the roles;
clause 4.3 scopes in light of them. Test the determination against the actual estate
- procurement records, repositories, product documentation - before testing the scope
statement. Testing one against the other is circular and always passes.

**3. Existence of a determination is auditable; adequacy of its content may not be.**
An auditor can always test whether a required determination exists and whether records
evidence it. Judging whether the content is adequate to the work needs domain
competence the auditor may lack. **State the limit explicitly whenever a lesson reaches
it.** This applies most sharply to clause 7.2 competence in task 4.13.

**4. Method follows evidence type, not convenience.** Virtual locations and
auditor-directed sampling are the default for most AIMS evidence. On-site is not the
rigorous default and remote is not the lesser method. Reading a record establishes what
it says; testing a control requires the auditor to choose what is opened.

**5. Objectives, criteria and scope are defined before fieldwork.** Their function is to
make findings testable afterwards. Adjusting them once evidence emerges removes the only
fixed reference the finding could be measured against. Clause 9.2.2 a) is the `shall`;
ISO 19011 clause 5.5.2 is the `should`.

**6. A programme can fail while every audit in it is sound.** Deferred audits, narrowed
scopes and unreached systems leave no artifact in any individual report. This is why
ISO 19011 clauses 5.6 and 5.7 exist, and why clause 9.2.2 requires the next programme to
consider previous results and process importance.

**7. The audit can be misdirected by the thing it examines.** Where a programme allocates
effort using the organization's own impact ratings, a misrating propagates into the audit
plan. Form a view of the estate from the systems themselves, then compare it to the
organization's assessment; a divergence is worth auditing in its own right.

---

## 12. Module 4 note, carried forward

Task 4.12 tests one competence - whether a control declared in the statement of
applicability is implemented as declared - and it generalises across all nine Annex A
families. **The lesson and its items must deliberately reach A.4 (resources), A.6 (AI
system life cycle) and A.7 (data), not only A.2 (policies) and A.3 (internal
organization).**

A.2 and A.3 are the families that most resemble ISO/IEC 27001 and are the easiest to
write about. A module 4 treatment drawn only from them would teach nothing an ISO/IEC
27001 auditor did not already know, and the scheme's fourth differentiator would be
claimed in SCHEME-AIMS-IA section 4.2 and measured by nothing.

---

## 13. Rules from the module 3 review - evidence and sufficiency

Established by module 3 and its external review. These govern how any lesson or item
in modules 4 and 5 talks about evidence.

**1. Evidence establishes what it establishes, nothing more.** A demonstration
establishes what was shown. A statement of fact establishes what was said. A conclusion
about a control requires records a second auditor could re-examine.

**2. Who selected the items determines what the set can support.** Auditor-selected
means Annex A.6 sampling language is available. Auditee-selected means it is **not a
sample** in the Annex A.6 sense, and the finding can only be about the items shown.
Never apply sampling language to a set the auditee chose.

**3. The population is defined before a sample size means anything.** In AIMS work,
model versions, pipeline runs, assessment events and log slices are different
populations answering different questions. State which one is being sampled.

**4. Small populations are examined, not sampled.** Annex A.6.1 describes sampling as
the response to it being impractical or not cost-effective to examine everything. Four
heterogeneous AI systems is a census population.

**5. Operational records are frequently better evidence than purpose-built ones.**
Registries, run logs and experiment trackers were produced by the work rather than about
it. Test their retention against the organization's own clause 7.5.1 determination, not
against an assumed audit retention period.

**6. A recorded disagreement is a working audit.** Clause 6.4.8 asks that attempts be
made to resolve diverging opinions and that unresolved ones be recorded; clause 6.5.1 j)
puts them in the report. **Acknowledgement is not agreement.**

**7. The two documentation questions stay sequential.** Thin documented information is
first a planning problem under clause 6.3.1 - inform the audit client, programme manager
and auditee, decide continue or suspend. It becomes a possible clause 7.5.1 finding only
when tested with evidence during fieldwork. Reversing the order turns the auditor's
inconvenience into a nonconformity.

---

## 14. The D3/D4 boundary, confirmed in review

> **D3 asks "is this evidence sufficient?" D4 asks "sufficient for which requirement?"**

Module 3 was reviewed specifically against this and no lesson crossed it. Module 4 works
the other side and must not drift back: its lessons take evidence as given and ask what
requirement it does or does not satisfy. Where a module 4 lesson needs to discuss whether
evidence is adequate in itself, it refers to module 3 rather than re-teaching it.

---

---

*Derived from AIMS-IA module 1, externally reviewed August 2026 and accepted at
9.0/10 with four minor notes. Extended after the module 2 review (section 11,
seven rules; section 12, the module 4 sampling reminder) and after the module 3 review
(section 13, seven evidence rules; section 14, the D3/D4 boundary confirmed).*
