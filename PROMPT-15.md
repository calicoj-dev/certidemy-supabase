certidemy-supabase, and certidemy-web where marked

The reckoning re-orders everything. Section 8 of PROMPT-13 is now last, and the monolingual
leak gap sits behind six things that concern text being served right now.

## 0 — The cheap things first, because they make the rest measurable

**0.1 Mint an API key scoped `courseware:lessons` and `courseware:rubric`.** Two cells in
the wire matrix have read NOT EXERCISED since it was built, and every refusal recorded from
those tools is equally consistent with a working paywall and a tool that serves nobody. One
key ends that.

Mint it, use it, revoke it in the same session, and do not print it. **Revoke first, wipe
the mint output second** — the earlier attempt wiped the file before revoking and destroyed
the only copy.

**0.2 Fix CLAUDE.md's credential paths.** `/issuer`, `/achievements/[code]` and `/status/[N]`
all 404; the live paths are under `/issuers/certidemy/`. That section is what someone follows
during an incident on the platform's most safety-critical URLs, and following it today
produces three 404s and the conclusion that the host is down. Read the paths out of the signed
document, as you did, and record that as the method.

**0.3 `open-badge` does not stay in its current state.** Identical 622 bytes for a real code,
a bogus code and no code, HTTP 200 each time. Find what calls it — the Worker, the web app,
anything documented, anything a partner was ever told to use.

- If something consumes it: it verifies, and a bogus code gets a 404 or an explicit
  non-verification response.
- If nothing consumes it: it 404s.

Report which and why. An endpoint that looks like verification and is not is worse than no
endpoint, and credentials meaning something is the whole business.

## 1 — The 12.8M characters: provenance before quality

The English lesson bodies carried ISO reproductions. They were repaired — the modal defect,
the five-span repair, twelve real refusals of twenty-four. **Nobody has asked whether the
Spanish and Portuguese were regenerated afterward.**

We solved the concept version of this by fixing English first and retranslating. That step may
never have happened for lessons.

**1.1** Per lesson and language: the timestamp the translation was generated against the
timestamp of the last English repair to that lesson body. How many translated bodies predate
a repair to their source. Use the hash gate if the 352 pattern covers lesson bodies — a
translation whose `en_hash` no longer matches its English is exactly this question already
answered.

**1.2** Run the lesson-scale leak instrument over the **English** bodies and report. If
English is clean, the repairs held and this is a translation-regeneration job. If English
still fires, the repair was incomplete and that is a different and worse finding.

**1.3** State plainly what can and cannot be measured on the translated side. The index is
English-only, so a translated reproduction of ISO's English scores zero by construction. A
translation generated from reproduced English is a reproduction we cannot see — which is why
**1.1 is the whole question.** Provenance is the only instrument we have here.

Report all three before proposing any repair. If the answer is that every translated body
postdates its source's last repair, this drops to a reading backlog and the urgency goes with
it.

## 2 — The AIMS-F item bank still reflects the stubs

Descriptions rewritten 2026-09-21. Practice items last written 2026-09-13, secure 2026-08-07.
631 items were drafted from placeholder descriptions and nothing downstream was regenerated.

The earlier clearance compared AIMS-F's items against ISMS-F's on structural signals and found
none. That measured whether the items look different. It did not measure whether they test
what the concepts now say.

**Measure, do not regenerate.** For a sample of AIMS-F items: does the item test something the
current concept description supports? Is the stem answerable from the rewritten text? Send me
a sample to read — 30 items, chosen adversarially rather than randomly, weighted toward
concepts whose descriptions changed most.

AIMS-F is released. If the bank is wrong, that is an exam integrity finding and it is mine to
act on, not yours to fix.

## 3 — `verify-invariants` has no positive control

The platform invariant checker cannot be shown to fire. Fourteen of thirty-two gates are in
that state and this is the one that matters most, because everything else reports through it.

Give it one, of the kind that survives its own subject being fixed — a fixture, the way you
handled the contradiction sweep's regression control after it started forbidding the repair it
was written for.

Then work the other thirteen in whatever order makes sense, and report the count as it falls.
A gate that has never refused anything is a candidate, not a pass.

## 4 — The 232 rows cleared by column default

`domain_translations` and `module_translations` are 100% approved because the column defaults
to approved, and no review table exists for either. Nothing could ever have recorded a human
reading them.

Two steps, in order: mark them as what they are — unreviewed — so the number stops asserting
something untrue; then send me all 232 with their English beside them. They are short and I
will read the lot in one pass.

## 5 — Then the 12.8M read itself

Shape it once §1 reports, because the answer changes what the read is for. If it is a quality
read, it is a paired sample of the same shape that has worked all week. If §1 says the
translations predate the English repairs, it is a regeneration followed by a sample, and the
sample is the smaller half.

## 6 — Then section 8 of PROMPT-13

The monolingual leak gap decision paper, ISMS-F's quality tail, the 916-row read, 42006.

The leak gap moves to last for a stated reason: it concerns text nobody can currently measure,
and everything ahead of it concerns text being served now. That is a re-ordering of urgency,
not a downgrade — it stays on the list.

## 7 — One rule, from the audit measuring itself wrong

**Rule — a gate implemented as a function is not the column it reads.** The reckoning's first
query counted `mcp_servable` and reported 479 of 479 lesson bodies servable in all three
languages. The gate is `lesson_body_is_servable`, which ANDs that column with two further
clauses, and the true figure is 392 and 399. Mechanism: where a gate is a function, the
measurement calls the function; a column that feeds it is an input and never a proxy for it.
Occasion: committed inside the audit written to catalogue exactly this class of defect, and
left in the document rather than quietly corrected.
