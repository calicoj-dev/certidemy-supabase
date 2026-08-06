# HANDOFF v5.3 — addendum

**Session date:** 2026-08-05 (same session as v5.3)
**Covers:** the translation review, its two findings, and one sequencing rule
that cost two round trips
**`verify-cert --strict`:** **29 pass · 0 fail · 0 warn — ALL INVARIANTS HOLD**

---

## 1. ISMS-F IS COMPLETE

The review ran, both findings were actioned, and the 108 blueprint rows are
approved. `verify-cert` reports no failures for the first time.

| | |
|---|---|
| Status | `coming_soon` — publishable |
| Lessons | 49 × 3 languages, 147 rows |
| Items | 2,646 across two banks |
| Coverage | 191/191 taught · 191/191 tested · 0 untaught |
| Translations | 108 rows, reviewed and approved |

Still outstanding from v5.3 §6, none of it blocking: `ksa_is_provisional` has no
approval path and `verify-cert` does not check it; the seven `SCHEME-*.md`
documents still carry bare `17024`; the formulation-drift ruling; the missing
family-route sitemap entries; and the clause 6.5 policy.

---

## 2. THE REVIEW, AND WHAT IT CAUGHT

The reviewer approved Part B outright, confirmed the three documented patterns
(the `capítulo`/`apartado` split, `Seção` for ISO divisions, the ISO 31000 risk
triplet) and raised one material finding.

### The finding: bare `violação` is ambiguous in pt-BR

It reads as *violation of a rule* as readily as *data breach*. Task 1.3's whole
teaching point is that a breach is a specific subset of incident involving
unauthorized disclosure, so the ambiguity sits exactly where precision matters.

### Why scoping before fixing was the whole job

`violação` appears **51 times** in the pt-BR item bank plus 10 lesson rows and 1
JTA row. A blanket change would have been catastrophic in both directions. The
collocation profile:

| Following word | Count | Verdict |
|---|---|---|
| `de dados` | 41 | already correct |
| `de política` / `da política` / `de políticas` / `de regras` / `de procedimento` / `de conformidade` | 16 | **genuine rule violations — must not change** |
| bare, followed by a verb or copula | rest | correct in context |

**Two rows needed the fix**, both outside any defining context:

- the **JTA statement** for 1.3, which renders in the blueprint sheet and the
  Blueprint Drawer with no surrounding prose
- the **lesson title**, which renders in navigation

**The lesson body was deliberately not changed.** It defines
`[violação de dados]{glossary="data-breach"}` on first use and then uses the short
form — exactly what the English does with "breach" after defining "data breach."
Changing all twelve occurrences would have made it read like a legal document.

The fix also corrected an article inconsistency the review did not flag: the
original dropped the articles on the second and third nouns.

### Both halves were necessary

The packet asked the reviewer to *"flag the term, not just the row."* They did, and
the term turned out to be right in 41 places and wrong in 2. **Without the flag we
ship an ambiguous blueprint statement; without the scoping we break 16 correct
rule-violation references.** Neither the reviewer nor the query would have got
there alone.

---

## 3. THE SEQUENCING RULE

> **Never run `load-jta-i18n.mjs --approve` without first checking the pack block
> for the rows you just corrected.**

The 1.3 fix was applied by SQL, then `--approve` ran, and the loader upserted the
**stale pack-block text back over it** and reported success. The correction was
gone and `verify-cert` said `ALL INVARIANTS HOLD`.

The check existed — it was written in the same message as the approve command, and
placed after it instead of before.

**Repair order is: block first, then database.** Patch the pack block, re-apply the
SQL, then re-run the loader and confirm the value survives the round trip. That
last step is the actual proof; anything short of it leaves a landmine for the next
`--approve`.

This is the failure HANDOFF v2.9 measured when it found that stub pack blocks
carried six stale task statements while full blocks carried none. **A full block
does not prevent staleness — it only makes staleness fixable.** Correcting the
database without correcting the block produces a value that reverts silently on the
next load.

### The same shape, three times today

| What | Intent | What was written |
|---|---|---|
| Public sample questions | "swap 1.2 for a better item" | added the new one, never untagged the old |
| The 108 approve | "review, then approve" | approved, then reviewed |
| The 1.3 fix | "check the block, then approve" | approved, then checked |

All three were caught by a verification step, and all three would have shipped
without one. **The pattern is describing an intent in prose and writing only half
of it into the command.** Every destructive or write-back operation needs its
verify query in the same breath, and the verify has to run *after* the write and
*before* the next step depends on it.

---

## 4. WHAT THE NEXT CERT INHERITS

Nothing about ISMS-F's build was unique except the standards-based subject matter.
The reusable output is:

**`STYLE-GUIDE-ISMS-F.md` v1.1** — eleven sections, four of which exist because
this build got something wrong. §1 (explain, never define) applies to every
standards-based cert and should be promoted into `LESSON_AUTHORING_SPEC.md` before
`ISMS-LI` or the 42001 ladder starts.

**Rule 17 in two generators** — `gen-jta-translations.mjs` and
`translate-lessons.mjs` both carry the ISO vocabulary block now. Any cert built on
a standard with adopted national translations inherits it.

**The glossary freeze** in `translate-lessons.mjs` — the model was adding
`[term]{glossary=...}` markers for concepts glossed elsewhere in the course, which
would have linked lessons to concepts the JTA never assigned them. Frozen in both
directions; six files failed validation on it before the fix.

**`ISMS-F-REVIEW-PACKET.md`** — the review brief format. It named the three
intentional patterns up front, which is why the reviewer confirmed them instead of
flagging them, and it asked for terms rather than rows, which is what made the
`violação` finding actionable.
