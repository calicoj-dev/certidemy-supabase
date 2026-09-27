# The sources Juan supplied, loaded through one extractor

Measured 2026-09-26. Read-only measurements unless stated; every write is named.

> **One extractor, one completeness check.** No second pipeline was built. The six new
> documents go through `scripts/extract-source-passages.mjs` and
> `scripts/check-library-completeness.mjs` alongside the ten that were already there, and
> every defect below was found because they share the code.

---

## What is held now

```
                                 passages     words   edition pinned to
  ISO/IEC 42001 2023                  185    20,798
  ISO/IEC 27001 2022                  119     7,543
  ISO/IEC 27001 2022/Amd1:2024          2       903
  ISO/IEC 27002 2022                  214    60,749
  ISO 19011 2026                      121    20,299
  Scrum Guide 2020                     26         -
  EU AI Act 2024/1689                 951    95,427   OJ L series, 12.7.2024
  NIST AI RMF 1.0                     111    16,230   January 2023
  EBM Guide 2024                        38     4,602   May 2024
  ITIL 4 Foundation 2019              134    69,828   AXELOS 2019
  ISO/IEC 42006 2025                   98    15,306   BS ISO/IEC 42006:2025
  ISO/IEC 17021-1 2015                249    22,982   BS EN ISO/IEC 17021-1:2015
  TOTAL                             2,248
```

Loaded to `public.source_passages`: **2,248 rows, 0 missing, 0 undescribed** — and the load
**pruned 21 stale rows** (see *What the prune removed*).

**Editions are exactly what you pinned.** The 42006 DIS draft is not loaded; the Singapore
preview extract stays `indexed: false` with its reason rewritten, because two editions of one
standard in the index would attribute a run to whichever matched first. ISO/IEC 17021-3 is not
loaded. BSI national forewords and cover pages are stripped and the extractor **asserts the body
begins at ISO clause 1** — it refuses the document otherwise.

**Licensing convention held:** ITIL, 42006 and 17021-1 extracts join `SOURCE-PASSAGES.json`,
which stays gitignored. The AI Act and NIST are public and use the same file anyway, so one
loader reads all of them.

---

## §1 Extraction: nine defects, and every one was mine

Each was found by a check, not by reading the output and hoping. The order is the order they
surfaced.

**1. The two positive controls that failed were wrong about the documents, not about the
extraction.** `EBM Guide / Unrealized Value` named an id the 2024 edition does not head — the
guide heads its section titles and its individual measure names, not its four Key Value Areas.
`ISO/IEC 42006 / 7.2` named a **container**: 7.2.1, 7.2.2.1 and 7.2.2.2 carry the text. Both
re-pointed at real ids, and the 42006 case is now also covered by a **container control** so
that "5.2 is absent" and "5.2 is a clause with children" cannot be confused — I watched it
refuse a write before believing it.

**2. A junk passage occupying a real address.** 42006 `7.4` had its own statement in the
**title** and the text of `7.5` in its **text**. `ISO_HEADING` caps a heading remainder at 90
characters to keep a decimal in prose out, and in this document a whole clause fits on the
heading line:

```
7.4 Personnel records The requirements of ISO/IEC 17021-1:2015, 7.4 apply.     74 chars  -> under the cap, whole line became the TITLE
7.5 Outsourcing Outsourcing in accordance with ... not permitted ...          150 chars  -> over the cap, not a heading at all
```

Fixed without a heuristic: **the document declares its own titles** in the contents list this
extractor otherwise only skips, so a line whose number is followed by that number's declared
title is a heading at any length, and everything after the declared title is text *by
construction*. Both rows are now correct.

**3. The contents harvest read one form and there are two.** A BS contents list puts a
top-level number on a line of its own and the title on the next; a subclause keeps both on one
line. And `-layout` renders it as columns, so a `\s{1,6}` gap matched nothing — 17021-1
harvested **zero** titles while 42006 harvested 50. The per-mode figure was also being printed
only for the first mode, which is why a harvest that worked in one mode and failed in the other
looked like one that never worked. Now 52 and 56.

**4. 72 passages carried a running page header mid-sentence.** `stripFurniture` knows the ISO
form `ISO/IEC 42001:2023(E)`; a BS adoption prints `8 BS ISO/IEC 42006:2025` and
`9 BS EN ISO/IEC 17021-1:2015 ISO/IEC 17021-1:2015(E)`, neither of which that pattern matches.
Removed at **whole-line grain before anything joins lines**, so the interrupted sentence closes
up. **72 -> 0.**

**The page number is identified by its neighbour, never by being a number.** ITIL prints a bare
page number against every page break and no header at all, so the anchor there is the **form
feed**. Six ITIL passages opened with a page number where their first sentence should be; now 0.
Stripping bare numeric lines on sight would have eaten the contents numbering the fix in (2)
depends on.

**5. My own furniture probe fired on real text.** Eight EU AI Act passages matched an
"Official Journal" pattern — the Regulation talks about publication in the Official Journal.
Zero furniture, eight false positives, and I nearly "fixed" the text of the law.

**6. 17021-1 numbers its PARAGRAPHS and 168 of 264 had no row.** That document is cited at
paragraph grain (`4.2.2`), and 147 of the misses carry a statement longer than the 90-character
cap. The cap cannot simply be raised — it is what stops a decimal in prose becoming a clause —
so the guard that replaces it is **the document's own sequence**: a paragraph is accepted only
if it is the first child of its parent or follows the sibling before it. Prose mentioning
"9.4.2" does not continue a sequence.

> **It is scoped to the two BS adoptions, deliberately.** Turning it on for ISO/IEC 42001 would
> re-grain the document every pilot item was generated and gated against, and a library that
> moves under a finished measurement makes the measurement unattributable. Nothing has been
> generated from 42006 or 17021-1 yet.

Two follow-on fixes, each caught by a check: seeding the sequence with each parent's highest
taken child **cost ten rows** (a heading at 9.6.5.3 made a legitimate 9.6.5.1 look out of
order), so the two streams are merged **by line** and the counter advances as the document does.
That recovered `10.2.4 Control of records`, which the completeness check had reported as the one
missing id in the document.

**7. A table of decimals became clause numbers.** 42006 Annex B tabulates audit-time adjustment
factors — "1.0 to 2.0", "0.5 to 1.0" — and inside an annex those became clauses `B.1.0` and
`B.0.5`, one of them ten characters long. **The loader refused the whole batch on its
20-character CHECK**, which is validate-before-writing working. Rule: no ISO clause number has a
zero component.

**The first version of that rule deleted seven real clauses.** ISO numbers an **introduction**
`0.1` to `0.7` and ISO/IEC 27002 has seven of them. Only a zero component *after* the first is a
page number. And it has to be tested **after** the annex prefix is applied, or `0.1` passes and
is then prefixed to `B.0.1` — seven copies of 27002's introduction survived inside Annex B while
the rule that should have caught them had already run.

**8. Containers are no longer rows, and that is a movement worth naming.** 12 rows went, all of
them containers whose children are every one held — `42001 7.5 / 9 / 9.3`, `19011 4 / 5 / 5.4 /
5.5 / 6 / 6.3 / 6.4 / 7 / 7.2`, `27002 3 / 4`. What disappeared was **duplicated text**, not
content, and `write-task-sources.mjs` still resolves **318 of 318 links** with 0 unresolved. The
sequence-hole report now separates **8 MISSED** from **10 CONTAINERS** instead of calling all 18
missed.

**9. Positive controls: 39 pass, plus 2 container controls.** Both container controls were
watched failing before being believed.

---

## §1 Completeness, per source

```
  ISO/IEC 42001 2023     declared 107   held 185   MISSING 0
  ISO/IEC 27001 2022     declared 137   held 119   MISSING 9  <- 9.2.1 A.5.15 A.7.11 A.8.1
                                                                 A.8.5 A.8.9 A.8.11 A.8.15 A.8.32
  ISO/IEC 27002 2022     declared 108   held 214   MISSING 0
  ISO 19011 2026         declared  74   held 121   MISSING 0
  ISO/IEC 42006 2025     declared  69   held  98   MISSING 0
  ISO/IEC 17021-1 2015   declared 115   held 249   MISSING 0
  EU AI Act 2024/1689    declared 306   held 951   MISSING 0
  NIST AI RMF 1.0                  held 111   NO DECLARED POPULATION
  EBM Guide 2024                   held  38   NO DECLARED POPULATION
  ITIL 4 Foundation 2019           held 134   NO DECLARED POPULATION
```

**The only missing ids on the platform are 27001's nine, which pre-date this job** and are
already recorded.

**`NO DECLARED POPULATION` is a third state and it is the honest one.** None of those three
prints a contents list this parser can read. Deriving their population from what the extractor
found would be circular — a count derived from the extraction cannot see what the extraction
missed, which is the whole reason the check exists — and calling them `UNVERIFIABLE` would read
as a parse defect when the document simply has no list. ITIL's is buildable (its contents uses a
page-number column rather than dot leaders) and has not been built.

**The AI Act's population is declared from its own numbering**, read off the document rather
than typed: last article heading **113**, last annex **XIII**, last numbered paragraph before
Article 1 **recital 180**. 306 ids, every one held.

The container test had to learn that **the child separator is part of the id scheme**: an ISO
subclause is `8.1` under `8`, an AI Act paragraph is `Art. 5(1)` under `Art. 5`. Testing only
for a dot reported **88 of the Regulation's 113 articles missing** while every one is held — a
coverage alarm on a complete document, which is the kind that gets a real gap dismissed next to
it.

---

## §1 Parallel text: aligned to the English passage id

```
  EU AI Act es     964 rows   aligned BY ID     17 translated units unaligned
  EU AI Act pt     976 rows   aligned BY ID     11 translated units unaligned
  EBM Guide es       0 rows   NOT ALIGNED       17 translated units against 38 English
  EBM Guide pt       0 rows   NOT ALIGNED       12 translated units against 38 English
  ARTICLE STRUCTURE, EN against each translation      IDENTICAL
```

One splitter carries three languages, because only four tokens are language-dependent: `Art`
followed by non-space is `Article`, `Articulo` and `Artigo`; annexes are `ANNEX` or `ANEXO`;
recitals, paragraphs and annex points are numbered identically. No accent is typed in the source.

**The alignment check reported 116 differences on its first run and every one was a defect in my
extractor:**

| what it looked like | what it was |
|---|---|
| every Portuguese article ABSENT (81 of them) | PT writes `Artigo 1.o` as an ordinal, so my "Article 1" pattern found no article boundary and the whole document was treated as front matter. 300 rows aligned happily because recitals are numbered the same in all three languages |
| ES `Art. 3` 68 paragraphs EN vs 0 | English writes `(1)`, the Spanish edition writes `1)` — the definitions article, 68 definitions, one bracket apart |
| 83 English annex points with no Spanish row | `(a)` in English, `a)` in Spanish and Portuguese |
| EN `Art. 64` 1 paragraph vs 2 | paragraphs 1 and 2 are on the *heading line* in that edition; one line can carry several paragraphs |
| PT `Art. 98` absent | same shape, other edition |
| a spurious EN `Art. 18` | **"Article 18 of Regulation (EU) 2019/1020 shall apply mutatis mutandis"** sits inside Article 97 and was read as a heading, producing a second `Art. 18` row whose text was the next heading it swallowed. Neither translation produced it, which read as a translation gap and was an English defect. Articles are sequential; a cross-reference is not |

116 -> 4 -> **0**. **113 of 113 articles held.** Remaining, named rather than counted: 13 English
annex points have no Spanish row (`Annex X 3-4`, `Annex XII 1-2` and their letters) and 2 have no
Portuguese row (`Annex XI 1(d)`, `Annex XII 1(f)`).

**EBM is NOT aligned and nothing was written for it.** The guide has no numbering at all — its
ids are its own English headings — so a translated heading can only be matched **by position**,
which is an assumption about the document rather than a fact about the text. The heading counts
disagree (17 and 12 against 38), so it is reported `UNALIGNED`. Aligning it needs a hand-written
mapping of English heading to translated heading; that is a decision, not a fix, and I have not
taken it.

**The Spain-Spanish caveat is in the column comment, not only here.** The EU's Spanish is Spain
Spanish and ours is es-419. This is **evidence of what the Regulation says**, never a mandate for
what we write; the house glossary decides. A term lifted from an EU translation into
learner-facing content would arrive carrying the Regulation's authority for a choice it did not
make for Latin America — which is the `clausula` / `apartado` shape this repository already paid
for once.

**`migrations/377_source_passage_translations.sql` is written and NOT applied** — yours to run.
One `DO` block, service_role only, RLS on, the foreign key asserted, and the negative half
asserted with `has_table_privilege`. `aligned_by` records `id` or `order` so a positional match
can never be read as a structural one; nothing is written as `order` today.

---

## §1 The leak index, widened — and this is the half with consequences

All six English documents are in the leak index and the manifest asserts their word counts.
**`CITATION_SOURCES` is unchanged at three, deliberately**: widening it would make addresses that
`verify-cert` flags today resolve, on every certification, which is a content decision rather
than a corpus one.

Two stale claims in the manifest were **rewritten, not marked**: the 42006 coverage gap is closed
(it argued against buying something now owned), and the monolingual gap is narrower now that the
ES/PT editions are held.

**A widening is a re-calibration, so the delta was measured against the nine sources held before
tonight — not against the three that were the baseline in September.** Running it unchanged would
have measured 3 against 15 and welded two widenings together.

### Live concept descriptions: 1 firing before, 12 now, 11 newly

The members, read:

| certification | concept | run | source |
|---|---|---|---|
| AISM-I | `management-practice` | **13w, coverage 1.00** | ITIL 4 |
| AISM-I | `governance-definition` | **10w, coverage 1.00** | ITIL 4 |
| AISM-I | `incident-management` | 8w | ITIL 4 |
| AIGRM-I | `gpai-obligations` | 8w | EU AI Act |
| AISM-I | `guiding-principles` | 6w | ITIL 4 |
| AIGRM-I | `minimal-risk`, `synthetic-content-labeling` | 5w | EU AI Act |
| SPO-AI-I, SM-AI-I, AIGRM-I | four more | 4w, coverage 0.67 | collision, not reproduction |

The first two are the whole description, verbatim: *"a set of organizational resources designed
for performing work or accomplishing an objective"* and *"the means by which an organization is
directed and controlled"* are ITIL's definitions word for word, and **ITIL is licensed**. The 4w
cases are ordinary English (*"that can be delivered"*, *"at the organizational level"*) and are
not findings.

Nothing is withheld by this: concept withholding is driven by review state and hashes, not by
leak score. **It is a content finding and I have not acted on it.**

### Lesson bodies: 15 groups would newly be refused

```
                narrow   wide    longest before -> after
  AIGRM-I          0       6      7w -> 18w   01-05-trustworthy-ai-characteristics/en
  AISM-I           0       9      8w -> 17w   03-03-management-practices/en
  AIMS-IA          3       3     10w -> 10w   (pre-existing)
  everything else  0       0
```

**The scan was dry. Nothing was written, and `--apply` is yours to decide.** Running it would
withhold those 15 groups from the MCP surface.

### And the scanner's negative control expired

It asserted *"AISM-I (cites no ISO) stays under the threshold"* — true when written, and it went
red the moment ITIL was indexed, because **AISM-I is the AI Service Management certification and
ITIL is its subject**. The control refused to write and named the change, which is a control
working.

It was not wrong, it was **founded on a coverage gap**: its premise was a fact about what we had
not bought, and filling that gap is the goal. Re-founded on synthetic text no indexed source
contains, which **proves that about itself first** — if any of its own 4-grams are in the index it
reports `UNSOUND` rather than passing. It cannot expire when a source is bought. AISM-I is still
measured, and printed as a measurement rather than asserted as a control.

Every other control still passes: 43 grounded-gate cases, 14 blind-solver, 6 leak-quotation, 852
files clean of control bytes, 98,381 field values clean of model refusals.

---

## What the prune removed

The loader is an upsert, so a row the extractor no longer produces stayed for ever — **and it is
not inert: `source_passages` is what the gates anchor against**, so a container the extractor has
stopped emitting still answers a lookup with its children's text, and 27002's introduction
mislabelled into Annex B still answers as `B.0.1`.

`--prune` (requires `--apply`) removed exactly **21 enumerated identities**: 12 containers, 7
Annex-B copies of 27002's introduction, `42006 B.1.0`, and `27002 3 / 4`. Before deleting,
**nothing referenced them** — 0 of 318 `task_sources` rows and 0 `item_grounding` rows. Afterwards
both directions were asserted: 0 artifact identities lost, 0 undescribed rows surviving. The dry
run now prints the same enumeration, because the report you need in order to decide was behind the
decision in its first version.

---

## §2 AIMS-F tasks that can come off hold — A PROPOSAL, NOT APPLIED

`aimsf-task-sources-map.mjs` is **unchanged**. This is the proposal you asked for in the report.

**Task 5.5 — "Describe the certification route and what ISO/IEC 42006 governs."** On hold with
*"Needs ISO/IEC 42006 and 17021-1, which are not held."* **Both are now held**, 98 and 249
passages, 0 missing against their own declarations. Proposed:

```
  primary      42006 1            Scope                                  can
               42006 9.1.3        Scope of certification                 shall
               42006 8.2.2        AIMS certification documents           shall
               42006 7.1.2        Generic technical competence           shall
  supporting   42006 9.1.4.2      Audit time                             shall
               17021-1 9.6.1      Recertification, General               shall
               17021-1 5.2.1      Management of impartiality             shall
```

**Task 1.5 — "Explain the regulatory drivers for an AIMS and why certification is not
compliance."** Carries a note forbidding *"certification is not compliance"* items until the AI
Act and 42006/17021-1 were acquired. **All three are now held.** Proposed additions:

```
  supporting   Art. 6(1)   Classification rules for high-risk AI systems    shall
               Art. 17(1)  Quality management system                        shall
               Art. 43(1)  Conformity assessment                            shall
               Art. 41(1)  Common specifications                            shall
               42006 1     Scope                                            can
```

**Task 1.6** stays as it is — its note is about thin grounding in 42001 itself, which nothing here
changes, and every 1.6 item still goes to you.

Two cosmetic title blemishes in the AI Act extraction, stated because they are visible in the
proposal above: `Art. 1(1)` carries a stray backtick in its title and `Art. 40(1)` has an empty
one. Both texts are correct; only the titles are affected.

---

## §2 Secure items citing a held source versus one still not held

Live English secure items, `status='approved'`, not retired. Stem, correct option and explanation
only — a distractor is supposed to be wrong, so scanning it reports deliberate falsehoods as
citations.

```
              items   HELD only   UNHELD only   BOTH   name no source
  AIGRM-I      457        78            7         6         366
  AIHR-I       223         7            4         0         212
  AISM-I       487        20            1         0         466
  SPO-AI-I     388        56            0         0         332
```

Per source:

```
  AIGRM-I    held    EU AI Act 54    ISO/IEC 42001 27    NIST 17    ISO/IEC 27001 2
             UNHELD  ISO/IEC 23894 7    ISO/IEC 38507 7    GDPR 4    ISO/IEC 42005 3
  AIHR-I     held    NIST 7
             UNHELD  NYC Local Law 144 2    EEOC / Title VII 1    ADA 1
  AISM-I     held    NIST 17    ITIL 3
             UNHELD  GDPR 1
  SPO-AI-I   held    Scrum Guide 43    EBM Guide 8    NIST 5
```

**The dominant bucket is "names no source at all" in all four** — 366, 212, 466, 332. These are
not citation-led certifications the way AIMS-F and ISMS-IA are, so what limits the grounded path
here is not the unheld sources; it is that most items do not name a source to be anchored to.

**Two things the count cannot see, stated because the number will be read as coverage.** It
matches a NAME, so it cannot tell whether an item is *about* that source, and it cannot see an
item resting on a standard without naming it. The second is live and measurable: only **3** AISM-I
items name ITIL, while the leak scan found **9 AISM-I lesson groups reproducing ITIL at up to 17
words**. AISM-I rests on ITIL far more than it cites it.

**The four unheld instruments you named are a small number of items** — LL144 2, ADA 1, plus EEOC
1 — and the largest unheld cluster is elsewhere: **ISO/IEC 23894, 38507 and 42005, 17 AIGRM-I
items between them.** Those are ISO standards and therefore buyable, unlike a New York statute.

---

## Open, and deliberately not done

- **The lesson withholding decision.** 15 groups would newly be refused. Dry run only.
- **The 11 concept descriptions**, four of them near-verbatim licensed ITIL definitions. Reported,
  not edited.
- **EBM parallel text** needs a hand-written heading mapping or it stays unaligned.
- **A declared population for ITIL** is buildable and not built.
- **The monolingual leak index.** The ES/PT AI Act editions are now held, so closing it is a
  measured re-calibration rather than an acquisition — and it would put every translated lesson
  body in scope of a gate that has never scored one.
- **Migration 377 is not applied**, so no parallel-text row is in the database yet.
- Carried from PROMPT-76 and still blocked: the draft insert of pilot 2's 22 survivors, behind the
  undeployed `recommendNext` fix.

---

## Ready to push

Three commits on `main`, nothing pushed:

```
  54de720  six sources through one extractor, and nine defects that were all mine
             extract-source-passages, check-library-completeness, load-source-passages (--prune),
             migration 377, LIBRARY-COMPLETENESS.json, .gitignore (sources/incoming/)

  c620ddb  the leak index widens, and the negative control it broke was founded on a coverage gap
             build-iso-manifest, citation-index, measure-index-widening, scan-iso-leaks,
             iso-corpus-manifest.json, count-source-citations, this report, CLAUDE.md

  59f0bca  377 gets its probe, in the commit the migration should have had it in
             check-migration-state: 377 now reports NOT RUN and OUTSTANDING rather than NO PROBE
```

`SOURCE-PASSAGES.json` and `sources/incoming/` stay gitignored; no licensed PDF is in either
commit, checked. `migrations/377_source_passage_translations.sql` is yours to run.
