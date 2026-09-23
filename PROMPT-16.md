certidemy-supabase

The ruling on §1, then the rest of the reckoning's order.

## 1 — Neither regenerate nor add-provenance-and-read. Measure against our own two Englishes.

Both options you offered answer a question we do not have.

Regenerating 12.8M characters blind discards translations that may be good, costs a great
deal, and does not fix the thing — regenerated Spanish is still unmeasurable against an
English-only index and still unread. Adding `en_hash` records provenance from now forward
and says nothing about 958 rows bulk-written on 2026-09-21.

**The question is answerable without a Spanish ISO index, because the reproductions in the
English were found and repaired — so the repaired spans are a small, known set, and each has
a before text and an after text.**

For every repaired span, one question of the Spanish and the Portuguese: **does it render
the old sentence or the new one?**

**1.1 Reconstruct the repair set.** `apply-audit-sentence-rewrite.mjs`,
`retranslate-audit-sentence.mjs`, `sweep-clausula.mjs`, `revert-ismsia-citation.mjs` and
their plan files, plus anything else in git that changed an English lesson body. For each
repair: the lesson, the span before, the span after, the date, and whether a retranslation
followed.

**`retranslate-audit-sentence.mjs` existing is the positive control for this whole
exercise.** It proves at least one repair was followed by a retranslation. Which lessons it
touched, and whether those lessons' translations now track the new English, is the test that
the method works before it is trusted on the rest.

**1.2 Test each translated body at each repaired span.** Old-English or new-English. Report
per lesson and language, with the span quoted in all three languages so I can read the
judgement rather than take the verdict.

Where it is genuinely ambiguous — a repair small enough that both versions translate the same
way — say ambiguous. Do not resolve it by preference.

**1.3 Then the scope is known.** If translations track the new English, the corpus is clean
on this axis and the 12.8M drops to a quality read. If they track the old, we regenerate the
named lessons and spans — a handful, not twelve million characters.

**Stop and report after 1.2. Regenerate nothing until I have read it.**

**1.4 In parallel, `en_hash` on lessons.** Right structural fix, wrong answer to this
question, so it runs beside rather than instead. It gives the lesson gate the tooth the
concept gate has: an English repair withholds its translations automatically instead of
leaving them serving and unmarked. Propose the migration; do not run it until 1.2 reports,
because what 1.2 finds may change what the initial stamp should say.

**One thing that bounds the urgency, and belongs in the write-up:** this corpus sits behind
`courseware:lessons`. The concept reproductions were unauthenticated and anyone could pull
them; these are licensed to a currently small set of partners. Serious, and a different risk
profile — which is a reason to do it properly rather than quickly.

## 2 — Then the reckoning's order, unchanged

§2 AIMS-F item bank measured against its rewritten source — 30 adversarially chosen items to
me, not a regeneration. §3 `verify-invariants` positive control, then the other thirteen. §4
the 232 domain/module rows re-marked as unreviewed and sent to me. §5 shaped by what §1
finds. §6 the original section 8.

## 3 — Two rules to record

**Rule — before an endpoint defect is reported, the request is verified well-formed against
that endpoint's own declared interface.** Three times this week a malformed probe was
reported as a defect in the thing probed: `list_lessons` (a stale connector's cached schema),
`lesson_index` (the probe's own pooler exhaustion), `open-badge` (`doc` omitted, defaulting to
`issuer`, so all three probes asked for the issuer profile and correctly received it). Each
was caught by the session that made it, which is the pattern working — the rule makes it
cheaper. Mechanism: read the interface, construct the request against it, and only then call a
non-matching response a defect.

**Rule — a note that pairs a correct half with another correct half is worse than a wrong
note.** `CLAUDE.md` paired `certidemy.com`'s paths with `credentials.certidemy.com`'s host.
Both hosts serve; both path sets exist; the combination resolves to nothing. Each half
survives a spot check alone, so the error is invisible to any check short of following the
whole instruction. Mechanism: identifier URLs are read out of the signed document, because a
document is the only thing that knows which URLs it promised, and a check follows the whole
path rather than confirming its parts.

## 4 — Withdrawn, with the reasons

- `open-badge` ignoring its input: **withdrawn.** It verifies. Bogus code → 404, empty code →
  400, unknown doc → 400. Record the withdrawal beside the original finding in the reckoning
  rather than deleting it; the reckoning's value is partly that it shows its own errors.
- "203 es-419 bodies predate their English": **withdrawn before it was reported**, correctly.
  All 1,437 rows were written inside a twelve-second window, so `updated_at` orders nothing.
  Worth keeping as the reason §1.1 exists.

One small real item survives and should be fixed while you are there: a non-existent issuer
slug answers **503 "issuer not configured"**. A 503 invites a retry against something that
will never exist. It is a 404.
