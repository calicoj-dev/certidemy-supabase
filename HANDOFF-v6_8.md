# HANDOFF v6.8 — ISMS-IA live, and the checks that will catch the next one

**Session:** 2026-08-12, continues v6.7 (same night).
**Migration tip:** **204** · next free **205**
**Supabase:** `13193aa` · **Web:** `a02aa7f`
**Read with:** v6.5–v6.7 for the Level II pipeline build.

> **ISMS-IA is `available`.** verify-cert: 39 pass, 0 fail, 2 warn.
> Ten certifications live. The tenth is the first Level II.

---

## 1. WHAT v6.7 CALLED "COMPLETE" AND WASN'T

v6.7 ended saying ISMS-IA was one console flip from live. It was not. Flipping to
`coming_soon` and loading the certification page in Spanish showed the blueprint,
the task statements and the description all rendering in English.

**A certification needs six surfaces to be sellable. CERT-PUBLISH-CHECKLIST
covered two.**

| Surface | Where it lives | Was in the checklist |
|---|---|---|
| Catalogue claim | `certification_i18n.claim` × 3 | yes |
| Public samples | `quiz_questions.visibility` | yes |
| Long-form description | `certification_i18n.description` × 3 | **no** |
| Domain titles + descriptions | `domain_translations` | **no** |
| Task statements | `task_translations` | **no** |
| Badge | `public/badges/<CODE>.png` | **no** |

The four missing ones were found by Juan loading a page, which is exactly how
AIHR-I's description gap was found three certs earlier. `load-aihr-descriptions
.mjs` even documents the mechanism in its own header — *"the graceful fallback
meant the Spanish and Portuguese pages rendered the English text silently"* — and
I read that header while using the file as a template without asking whether the
tenth cert had the same hole.

**The cause was not stale documentation. It was working from the checklist
instead of from what a certification actually needs.**

---

## 2. FIVE INVARIANTS, SO IT CANNOT RECUR

`verify-cert` had 33 checks and every one was about assessment integrity. None
was about whether a certification could be sold. CERT-PUBLISH-CHECKLIST said so
itself, proposed three of these, and closed: *"until these exist, this checklist
is the control, and it is a human one."*

Added as §12 (`645b110`):

| Check | Fails when |
|---|---|
| `catalogue.claim` | fewer than 3 languages carry a claim |
| `catalogue.description` | fewer than 3 carry the paragraph |
| `jta.translated` | any domain title or task statement missing in es-419 / pt-BR |
| `samples.public` | not 6 public practice items per language across 6 **distinct** tasks |
| `samples.firewall` | any secure item with a non-secure visibility |

**All ten certs pass all five.** Worth stating plainly: the nine live
certifications were complete. The gaps were ISMS-IA's alone, because it was the
one being built. This was not systemic rot.

`is_provisional` is deliberately **not** part of `jta.translated` — the site
renders provisional domain and task rows and withholds only the dense K/S/A prose
(`lib/blueprint/data.ts` says so and gives its reason). Review state has its own
check in §11.

---

## 3. THE BADGE TRAVELS WITH THE CREDENTIAL NOW

`ob3.ts` built the Achievement with name, criteria, creator, alignment,
description and resultDescription. **No `image`.** Grepping for "image" returned
one hit, a comment: *"An Open Badge 3.0 is not an image."*

That comment is right about what an Open Badge is, and it is why the field went
missing. The spec defines an optional `image` on Achievement precisely so
consuming platforms have something to render. Without it a holder importing to
LinkedIn or a wallet got text, while ten badge files rendered only on Certidemy's
own pages.

One field, built from the code the same way the verify page builds it, so a new
cert needs no registration step — drop `<CODE>.png` into `public/badges` and the
credential carries it. Confirmed live for ISMS-F and ISMS-IA.

**No credential was issued before the deploy**, so nothing carries a snapshot
without it.

---

## 4. AN EXTERNAL REVIEW, AND WHY ITS TOP FINDING WAS WRONG

The 86 JTA translation rows were rendered side by side with the English
(`gen-translation-review.mjs`, cert-agnostic, `a2217df`) and reviewed externally.

**Its highest-priority finding: the Spanish mixes `capítulo` and `apartado` for
clause references; pick one.**

The data refuted it. Across ISMS-IA's twelve rows carrying a clause reference:

```
apartado  ->  9.2, 9.1, 9.3, 4.1        (subdivisions)
capítulo  ->  4, 5, 6, 7, "4 al 10"     (top-level)
```

Twelve for twelve. That is the UNE Spanish convention applied correctly. The same
query across ISMS-F and AIMS-F found it holding there too — **nine rows of ten**,
with one genuine outlier the review had not looked at: AIMS-F task 3.8 said
`apartado 8` for a top-level clause, contradicting that cert's own D3 description
which says `capítulo 8` for the same clause.

**The reviewer was not careless. The rule was real, consistently applied, and
written down nowhere,** so variation was the only thing visible. This is the
recorded pattern for external review on this project: sound craft judgment,
returns verdicts rather than stated conventions.

Now **Rule 17** in TERMINOLOGY-POLICY (`13193aa`), with the note that it was
*discovered, not decided* — and that **pt-BR does not carry the distinction**
(ABNT practice uses `Seção` at every level; do not introduce a split to mirror
Spanish).

**Accepted from the review:** `elicite` → `obtenga` in ISMS-IA 3.5. A calque of
the English "elicit"; a practitioner says "obtener".

**Considered and kept:** `falla` vs `fallo`, `análise crítica independente` vs
`revisão independente`. Register preferences where the current wording is
defensible and consistent with the family. Churn on reviewed text for no gain.

Migration 204 fixed both rows by targeted UPDATE. AIMS-F's row was already
reviewed — `FORCE=1` would have replaced all eighty of that cert's approved rows
to correct one word.

**Catalogue-wide proof, zero rows:** no `apartado` of a top-level clause, no
`capítulo` of a subdivision, no `elicit` anywhere.

---

## 5. THE FLAG FLIP WAS EARNED

`86 of 86 provisional` failed §11. Every other cert reads "none provisional"
because someone read those rows.

Flipped only after: rendering all 86 beside the English, an external pass, one
substantive correction made, one finding investigated and refuted with evidence,
and the underlying convention documented. **That is a review. A generator
asserting its own output is fine is not.**

`gen-translation-review.mjs` exists so the next cert can clear this the same way.

---

## 6. OPEN

**The ISO 19011 annex list belongs in the AUDIT grounding.** The critique reviewer
has the edition set but not the *contents*, so it rejects correct citations to
annexes it cannot verify. Verified during the run: A.17 *is* "Conducting
interviews" in the 2026 edition and the concept row says so correctly — the
reviewer rejected a correct item. Cost yield on ISMS-IA; will cost the same on
AIMS-IA.

**K/S/A review pass.** `ksa_is_provisional` is a separate flag and was not touched.
The site withholds those fields until reviewed rather than rendering them, so
there is no display risk — but the blueprint drawer shows nothing for them in
es-419 and pt-BR until someone does the pass.

**ISMS-IA's secure bank predates the critique grounding fix**, so some correct
items citing 19011:2026 were rejected during that run. The bank is sound — 912
items, zero cue escapes — but thinner than it would be today. Not worth
regenerating.

**Longer-standing:** `exam_blueprint.item_model.cue_guard` still documents a
qualification-density guard that does not exist. LESSON_AUTHORING_SPEC §7.4
missing. 16 tasks with create-verb skills fields. ISMS-F task 2.3 says
"environmental-conditions" where Amd 1:2024 says "climate change" — and it is
visible in the live Achievement JSON, not just a database row.

---

## 7. METHOD NOTES

**The same generator bug twice, in one night.** `$nl` used by the `-join` when
`$work` was built and only *defined* afterwards, so the join used `$null` and a
90-line block collapsed onto one line. Because the first two characters were `//`
it became a comment: no error, `node --check` passed, and the patch did nothing.
It happened to the ob3 patch and then again to the sellability patch.

Two rules that follow, and the second is the one that would have caught both:

- **Define the separator before the joins run.** Join with LF, convert to CRLF
  after, only if the target file uses it.
- **Post-check the SHAPE, not just the presence.** Read the file back as lines
  and fail if the block is one long line. A collapsed comment is valid
  JavaScript and every syntax check passes it.

**`node --check` parses, it does not resolve.** A missing import passed every
check and failed at runtime on all 60 passes of a generation loop. The load test
— `node -e "import('./path.mjs')"` — is what catches it.

**Read before overwriting.** I replaced ISMS-IA's seeded English description with
freshly written copy without reading what was there. The seeded text drew the
distinction task 1.5 exists to test — *ISO 19011 is the methodology, ISO/IEC 27001
is the criteria* — and my replacement had dropped it. Restored byte-identical to
migration 187 so the file and the database agree.

**When a change is small, write it as flat statements.** The elaborate patch
scaffolding earns its keep on multi-file edits and actively costs on single ones.
Every failure this session was in the machinery, not the change.

---

*End of HANDOFF v6.8.*
