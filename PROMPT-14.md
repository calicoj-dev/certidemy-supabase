certidemy-supabase, then certidemy-web

366 first. Then the contract, which is the most serious thing found this week.

## 1 — 366, and the rule underneath it

Run it, then re-run the grant-gap check and the wire matrix. Firing count should go 2 → 0,
and every role that could read `mcp.concept` before 365 should read it again.

**Rule — a grant migration enumerates every role that held the privilege before, and asserts
none lost it.** 365 created wrappers, granted EXECUTE to `mcp_reader` and `mcp_holder`, and
silently removed `mcp.concept` from `supabase_read_only_user` and `supabase_etl_admin`, which
held the public originals. Mechanism: before changing what a view calls, enumerate the roles
holding EXECUTE on the outgoing function; the migration grants the incoming one to that set,
and a post-condition asserts the set is unchanged. Occasion: 365, and this is the second time
this week a change aimed at the partner path moved something adjacent — the first was a
casing fix invalidating 44 translations.

Confirm while you are there: AIE-I pt-BR at 0.0% and ISMS-F at 0.5% in both languages should
be the blocked draws and the withheld populations. I have assumed that and this week has been
unkind to my assumptions. Report the reason per cell.

## 2 — The contract lies, and that is worse than the outage

> `list_lessons contract_version=1` → `contractVersion: 1`, and the v3 payload

The outage was a failure: visible, fixable, and it never told anyone something false. This
tells a partner who pinned version 1 that they received version 1. It is the payload
asserting something the server did not do, on an unauthenticated tool, by a body whose entire
positioning is that it asserts only what it can verify.

It is the same defect class as a description reproducing a standard while claiming to cite
it. We spent the week removing those from the content. This one is in the contract.

**2.1 Fix the lie first. It is a separate problem from the capability and only one is
urgent.**

`get_lesson` already carries the honest pattern — `{current: 2, supported: [2]}` — and every
other tool accepts a pin it cannot honour. Generalize it:

- `supported` lists only the versions a tool can **actually produce**. Where a tool has one
  shape, `supported` has one entry.
- A request pinning anything else is **refused**, with a message naming what is supported.
  Never silently upgraded.
- The payload's `contractVersion` states **what was served**.

This breaks callers pinned at 1 or 2. They are already broken and cannot detect it; a refusal
they can act on beats a lie they cannot. Report which tools change and what each one's
`supported` becomes.

**2.2 Then decide what the number means, and the structural constraint decides it.**

MCP advertises one `outputSchema` per tool and these are `additionalProperties: false`, so
two shapes cannot both be legal under one advertised schema. The only honest semantics left
are **additive-only**, with `contractVersion` meaning *the minimum version whose validator
will accept this payload*.

Write that down where a partner reads it, not only in a comment. If that is what the number
means, it has to say so.

**2.3 Report what the bumps were supposed to carry.** You started looking at this and it
matters: if versions 1 and 2 of `list_lessons` differ from 3 in ways a caller could depend
on, then callers have been silently receiving a different shape than they validated against,
and we should know how different. If the bumps were cosmetic, say so — that is a smaller
problem and a different message.

**2.4 `get_concept` stays unwidened until 2.1 and 2.2 land.** Right call to stop. Widening a
tool's output while the version field is decoration would add a second untrue statement to
the first.

## 3 — Recorded from this turn

**The outage dates to 364, not 359.** A stored view holds its functions by OID, so no name
resolution happens at read time and `mcp_reader` reads `mcp.lesson_index` — which selects
`public.lesson_body_is_servable` — without any `public` USAGE. The real gate was one level
in: `public.translation_hash` is SECURITY INVOKER with `search_path = ''`, so its body
resolves `public.ksa_en_hash` at runtime in the caller's context. Correct 365's header and
the CLAUDE.md entry, which both state the wrong top-level cause.

**Section 5 of PROMPT-13 is withdrawn.** I told you to fix three views "properly" on a
diagnosis that was mine and wrong. They were never latent and there was nothing to fix. You
measured instead of complying, which is the correct response to an instruction resting on an
unverified claim, and it is worth recording as that rather than as a near-miss.

**The pooler alarm is retracted, and the retraction is worth more than the finding.** 180 of
180 unpaced, twice. The original measurement compared a run that began 45 seconds after a
120-call burst against runs that got 90, and attributed the difference to pacing. The fix
that finding implied — asking partners to pace themselves — would have made it worse, by
keeping isolates idle and spawning replacements with fresh pools. Recovery stays recorded as
*between 45 and 90 seconds*; a plausible number would be worth less than the blank.

## 4 — Then §8 of PROMPT-13 starts

Unchanged and in order: the monolingual leak gap as a decision paper, ISMS-F's quality tail,
the 916-row read, 42006.

Nothing in §8 begins until §1 and §2 of this prompt are done. The contract is partner-facing
and currently untrue; the backlog is content that is merely thin.
