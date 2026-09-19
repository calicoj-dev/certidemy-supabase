# HANDOFF v13.5 — the rubric is live, and a check that covers half its subject reports a pass

2026-09-19. The arc that started as "scope an item-generation tool" ends with
the rubric surface live and byte-identical to what the generators use, at both
tiers, verified with a real partner key.

---

## 1. The two rules this arc paid for

v13.4 recorded that four written rules failed to prevent their own recurrence,
each closed by a mechanism. These two are about the mechanisms themselves.

### A coverage gap in a check reads as a PASS, not as a gap

The green-result rule says an instrument that cannot fire reports nothing. This
is sharper: **an instrument that fires on half its subject reports success.**

`check-prompt-parity` stage D asserts the rubric a partner receives is
byte-identical to the rubric the generators use. It exercised **ISMS-F, tier 1**.
A tier-2-only change went undeployed and:

```
stage C (AIMS-IA,  tier 2)   FAIL   21807 vs 21979 chars
stage D (ISMS-F,   tier 1)   PASS   against the same stale deployment
```

**Both were correct.** D compared a part of the prompt that had not changed.
Nothing in its output suggested it had looked at one tier, because a check does
not report the variants it did not try.

So: **when the thing under test branches, exercise every branch, and write the
branch list down.** D now runs ISMS-F and SM-AI-II; the tier-2 certification
reported the same 172-character delta immediately. Closed by the defect it
missed rather than by a synthetic case, which is the only evidence worth having.

### Compare a shared block against ITSELF, at two variants

Every other comparison here asks whether **two implementations agree** — two
repositories' vocabularies, Node against Deno, the deployed function against the
generators, a guard against itself in another language. This one asks whether
**one implementation says the same thing to two audiences it should not.**

`CUE_NEUTRALITY_RULES` ended *"This is an entry ("I") tier exam: test knowledge
plainly, do not set traps"* and shipped identically to every tier-2
certification. The clause before it — *"not subtly-worse-but-defensible"* — is
the exact inversion of `L2_CONTRACT`. **The prompt instructed a tier-2 generator
to do the one thing the tier-2 contract forbids, in the same document as the
contract.**

**The tier ternaries everywhere else are what made it invisible.**
`draftSystem` branches on tier in a dozen places and every branch is correct, so
reading the file gives every impression tier is handled. One unconditional
string in a sibling module is not visible from there.

Found by a human reading a tier-2 payload after a tier-1 one. Stage E now
assembles both tiers per certification and fails on any sentence asserting a
tier that appears in both. **Generalise it: wherever a prompt, policy or message
is assembled for several audiences from one source, diff the assembled OUTPUTS.**
The source shows the branches that exist; only the outputs show what did not
branch.

Both are in `CLAUDE.md`.

---

## 2. State, measured

```
check-prompt-parity --runtime    43 pass, 0 fail, 0 skip   ONE SOURCE
check-cross-repo-vocabulary       0 problems, 7 pairs
check-migration-state             342-347 all RAN
```

**Both paid tools pass in one run for the first time.** Stage D2 fired against a
real `courseware:rubric` key and compares byte-for-byte at tier 1 and tier 2.

The rubric resource: `courseware:rubric` scope, reads `mcp.task` so the
served-certification gate, the language dimension and 338's KSA withholding all
apply for free, `kind` deliberately not an accepted field so the secure
difficulty contract is not purchasable, `post_back: false` in the payload.

`update-issuer-key-scopes` — function and script — closes the operation
`get_rubric`'s refusal had been promising with no implementation on either side.

**Keys, from the table rather than a note:** `cdk_test_471cec76` revoked
2026-09-19 19:02:34Z with a revoker recorded; `cdk_test_777afa61` live with all
three scopes, created 45 seconds later.

---

## 3. What the consolidation actually bought, measured

345 retired 158 pre-consolidation generated items. Ten new ones have been
written since by the live weak-concepts route:

| | the old 158 | the new 10 | authored baseline |
|---|---|---|---|
| cue-guard failures | **53.8%** | **0%** | 9.5% |
| grouped | 140 ungrouped | **10 of 10** | n/a |
| `true_false` | 25.9% | 1 of 10, both certs tier 1 (in contract) | 0% |

**That is the consolidation working**, and it is the first evidence of it on
rows rather than on prompts.

**`status='approved'` on all ten.** CERTIDEMY-LEARNER-IA §5.5 is unchanged and
is now the only open defect on that route.

### And 345's fingerprint was wrong in 340's exact way

It asserted `live === 0` and `length === 160`, and reported **NOT RUN** the
moment two learners used the feature — a migration that had run, failing its own
probe because the product kept working. That is 340's mistake, made two days
later, in a fingerprint written by the author who fixed 340's.

It now separates RAN (158 retired, attempts preserved) from EFFECTIVE (are any
live now), and reports the live ones as expected rather than as a failure.

---

## 4. Open

1. **§5.5.** Four options scoped in v13.4. **A is nearly free** — both assemblers
   now filter `status='approved'`, and the creating learner still sees their own
   five via `.in('id', ids)`. **A without B is a drafts pile with no drain.**
   **C is a one-line revert** of the mode picker if ever needed in a hurry.
2. **The `en_hash` gap.** Both review tables hash the ENGLISH, so an English edit
   re-closes the gate and a translation edit does not. 139 approvals. **The 252
   `cláusula` references are load-bearing on this** — that sweep would invalidate
   ISMS-F's cleared rows and leave them marked `approved`.
3. **`SCHEME-SM-AI-I.md` practice counts** 525/535/520 → 520/520/520, caused by
   345. One edit; `verify-cert` has been failing on it since.
4. **Concepts have no translation table.** 1,730 concepts, ~497k characters both
   languages, 16x the ISMS-F KSA pass. The review model decides first.
5. **123 paragraphs** in `BILINGUAL-QUEUE-2.json` (58 worked); 3 refusals; ~20
   held paragraphs.
6. **Two guard gaps recorded, not patched**: compound `poder`, and English
   `required` strong while `necesario` is narrowed.
7. **Fingerprints for 330, 331, 333, 334** — they report "no probe", which is
   honest and is not verified.
8. **`get_lesson` has never been observed end-to-end** with a key from this
   machine. The gate's inputs are verified; that is not the same as the body.
9. **Capabilities surface**, scoped in this session and not built. Courseware
   coverage and the negative capabilities are the two that can be computed
   truthfully today; OB3 issuance is real as a mechanism and empty as a track
   record (1 partner API request ever); LTI is real but only against a Moodle
   sandbox and the 1EdTech reference implementation. **`/llms.txt` already
   describes the MCP server and says it exposes one tool, `verify_credential`.
   There are eight.** That is the highest-value correction outstanding and it is
   a paragraph.

---

## 5. What to distrust

§2 and §3 are measured this session. Everything in §4 is carried forward.

**Eleven times in three days a note about state was wrong** — the migration tip
eight times, then 339/340, then 345, then the key revocation. Every one was
settled in seconds by asking the database, and none by re-reading. The pattern
is not carelessness; it is that a sentence about state is a second copy, and a
second copy has no mechanism keeping it true.

**The instruments themselves are the thing to distrust next.** This session found
three defects *in checks*: a leak-regex broken by an escape, a tier pattern that
could not match the string it was written for, and a parity stage covering one
of two tiers. All three were caught by controls sitting beside them. A check
without a control that must fail is not evidence.

```
node --dns-result-order=ipv4first scripts/check-migration-state.mjs
node --dns-result-order=ipv4first scripts/check-prompt-parity.mjs --runtime
node --dns-result-order=ipv4first scripts/check-cross-repo-vocabulary.mjs
node --dns-result-order=ipv4first scripts/smoke-courseware.mjs
node --dns-result-order=ipv4first scripts/verify-cert.mjs --all
```

Operational, both costly this week: the Supabase CLI needs **`--dns-resolver
https`** (the Node flag does nothing for it), and `scripts/lib/fn-auth.mjs`
retries the sign-in but **not** `callFunction` unless asked, because its callers
are mints.
