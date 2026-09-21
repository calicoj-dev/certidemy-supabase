certidemy-supabase

Supersedes the earlier PROMPT-2.md, which was written before the sibling check. The English
repair is now first and larger, because five defect classes turned out to be rooted in the
English rather than in either rendering.

## 0 — The ordering rule this prompt is built on

**A faithful rendering of a defective English is not a translation defect.** Fixing the
rendering while leaving the English ambiguous re-manufactures the defect on the next pass. So
English first, then retranslate only the affected rows, then the translation-only sweeps.

## 1 — English repair, eight items

Report each before changing it, and show me the proposed new text for the first four — those
are meaning changes, not typography.

**1.1 `ISMS-F / tool-misuse` — attachment ambiguity, inherited by both languages.**
Current: *"legitimate tools bent to destructive or unintended outputs by a compromised agent"*.
On nearest attachment, *by a compromised agent* modifies *unintended*, not *bent*. Spanish and
Portuguese both reproduced it exactly, which is the evidence it is upstream. Rewrite so the
agent is unambiguously the one doing the bending.

**1.2 `SM-AI-II / complementary-practice` — "adds to it" parsed as "adds it" by both.**
Current: *"A practice wrapped around Scrum that adds to it without replacing any of its
elements."* es produced `que lo suma`, pt produced `que o acrescenta` — both say *adds Scrum*
rather than *adds to Scrum*. Rewrite to a form that cannot collapse: *"that adds to Scrum"*, or
*"that supplements Scrum"*.

**1.3 `AIHR-I / institution-proxy` — "background" narrowed identically in both.**
Both languages produced *origen social* / *origem social*, dropping the educational and
socioeconomic senses. The English word is doing two jobs. Say which senses are meant.

**1.4 `SD-AI-I / daily-backlog-update` — bare noun pointing at the wrong artifact.**
Its task is 2.3, *"Own and maintain the Sprint Backlog"*, but the concept name is *"Daily
Backlog Update"*. Bare *backlog* defaults to Product Backlog in both English and the target
languages. Rename to *"Daily Sprint Backlog Update"*. This is the only one of the 7 bare-backlog
concepts whose referent is the Sprint Backlog; do not touch the other six.

**1.5 `SPO-AI-I / refinement-ongoing` teaches deprecated vocabulary.**
Its description is *"Continuous grooming of the backlog"* while the same certification family
carries `self-organizing (deprecated)`, `ceremonies-vs-events-terminology` and
`servant-vs-true-leader` to teach candidates that this vocabulary was retired.
`backlog-refinement` already exists and is correct. Rewrite, or retire into `backlog-refinement`
if they are the same concept. Then sweep all twelve certifications for deprecated Scrum
vocabulary appearing outside a concept whose job is to flag it: `grooming`, `self-organizing`,
`ceremonies`, `servant leader`, and `commitment` used of the Sprint Backlog.

**1.6 `ISMS-IA` duplicate concepts.**
`ia-ai-evaluation-tools-in-auditor-competence-7-2-3` and
`ia-ict-and-emerging-technology-competence-7-2-3` have identical descriptions apart from
*giving* versus *naming*. Check both task mappings before merging, keep one, retire the other
through the path migration 345 established. Guard: no two concept slugs in one certification
share a normalized description.

**1.7 `ISMS-F` concept names are raw slug text.**
"annex a themes", "acceptable use ai", "saas ai in scope", "ai asset inventory" — lower-cased,
`ai` where `AI` belongs, `annex a` where `Annex A` belongs. The translations quietly repaired
most of these; the English is what a partner reads over MCP. Fix ISMS-F, then check the other
eleven.

**1.8 `AISM-I / keep-it-simple-and-practical` is titled "Keep IT Simple and Practical".**
The slug title-cased into the IT department. It is the ITIL guiding principle *"Keep it simple
and practical"*. Add `it` to the title-casing exception list beside whatever handles `ai`.

**Guard for 1.7 and 1.8, one assertion covering both:** no concept name is byte-equal to its
slug with hyphens replaced by spaces and the first letter capitalised.

## 2 — Retranslate only what 1 changed

Every English edit in section 1 makes its translations stale. The `en_hash` gate should withhold
them automatically — confirm that it did, per row, rather than assuming it. Then regenerate those
rows and send me a file of just them, both languages side by side. Small enough that I read all
of it.

## 3 — Translation-only sweeps, whole corpus

**3.1 The 11 FULL-class bare nouns.** Goal 2, Done 2, Retrospective 3, Review 4 — the list you
produced. Restore the full Guide term in the translated name only. **Do not apply this check to
English names.** Bareness that is benign in English is defective in translation, because `el
Goal` reads as the proper name of an artifact where *the Goal* reads as ordinary prose. Record
that asymmetry beside `PIN_FULL`.

**3.2 Spanish `aplicar` missing its reflexive.** `aplica a` / `aplican a` → `se aplica a` /
`se aplican a`. Three rows in a 480-row sample, so expect roughly twenty corpus-wide. Portuguese
already has it right, so this is Spanish-only.

**3.3 One rendering per term per language, now confirmed to need both languages.**
- *model card* — four renderings stand: `model card`, `cartões de modelo`,
  `Model Card (Ficha do Modelo)` (pt), `fichas de modelo` (es). Pin one per language.
- *accountability* — `prestação de contas` vs `responsabilidade` in pt, **and** `rendición de
  cuentas` vs `responsabilidad` in es. The review reported this as pt-only; the sibling check
  found it in both. Pick one per language, say which and why, then apply.
- Build the term-rendering table and assert one target rendering per source term corpus-wide.
  Report every other collision it finds — the sample saw 14% of the corpus, so there will be more.

**3.4 Metalinguistic modal references.** `aia-nonconformity-needs-a-shall` renders the English
modal raw in pt (`enunciadas em "shall"`) and localised in es (`en forma de «debe»`).
`aia-finding-against-a-note` uses «debería»/«debe» in es and `um convém que` in pt. Both
approaches are defensible; using both is not. Pin one convention for quoting a modal as a term.

**3.5 Report, do not fix, the remaining judgment rewords.** They need a reading, not a regex.

**Withdraw one reword from the review.** `SM-AI-I / agile-values` was flagged on the claim that
the Spanish Manifesto uses *por encima de*. It does not — the official Spanish text reads
*"Individuos e interacciones **sobre** procesos y herramientas"*, and the pt `mais que` matches
its own official Manifesto. Both renderings are correct. Mark it withdrawn with the reason, do
not silently drop it.

## 4 — Record two rules

**Rule — bareness is not symmetric across languages.** A bare English noun that reads as
ordinary prose in English becomes a code-switch in Spanish or Portuguese, naming no particular
artifact. Mechanism: the `PIN_FULL` truncation check runs on translated names only. Measured:
11 of 31 census hits, all with equally bare English.

**Rule — a faithful rendering of a defective source is not a translation defect, and does not
block the draw.** It is fixed upstream and retranslated. Four classes so far reached both
languages identically because the English carried the fault: attachment ambiguity, a verb phrase
that collapses, a word doing two jobs, and a bare noun with a specific referent. Mechanism: before
a defect blocks a draw, check the sibling — if both languages carry it, the finding is against
the English.

## 5 — Out of scope

Nothing about AIMS-F, the item pipeline, or the 631 items. Prompt 3 is being rewritten around
that and nothing there moves until it lands.
