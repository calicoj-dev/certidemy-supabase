# HANDOFF v13.3 — the rule was written down and it was never the mechanism

2026-09-17. 341 ran and is verified as `mcp_reader`. This handoff leads with the
three-instance pattern you asked for, and the lead is not the rule.

---

## 1. Three migrations, one failure: a post-condition run as the wrong role

| | object | asserted as | who actually calls it | outcome |
|---|---|---|---|---|
| **329** | `mcp.resolve_oauth_caller` | `service_role` | `mcp_reader` | first OAuth read: `500 permission denied` |
| **330** | the fix for 329 | `set role mcp_reader` | — | correct by construction |
| **339** | `task_ksa_is_withheld` | migration's own role (superuser) | `mcp_reader` | **`explain_task` 500 in es-419 and pt-BR, ~2 hours** |

339's post-condition asserted *"mcp.task serves 49 es-419 knowledge fields"*. It
did — for a role that can read every table. `mcp.task` is not `security_invoker`,
so tables it queries directly are checked as the view owner, **but a function
called inside it is not**: without `SECURITY DEFINER` the body runs with the
caller's privileges, and `mcp_reader` has no grant on `task_translations`.

English never broke — that branch has a literal `false as ksa_withheld` and calls
no function. So the surface anyone checks first stayed green.

---

## 2. What would actually have caught it

**Not the rule.** `CLAUDE.md` has said *"RUN THE CHECK AS THE PARTY THE PROPERTY
IS ABOUT"* since 330, in capitals, with 329 as the worked example. It was read
this session. It was broken this session, by the same author, on the next object.

### 2a. The rule was never what saved 329

This is the part worth keeping. Ask why 329 and 330 were caught and 339 was not,
and the answer is not diligence:

- **329 broke a NEW path.** Nothing worked before it. The first person to try
  OAuth was the person who wrote it, minutes later, and the path failed on its
  first use because it had no other use. Trying the new feature *is* running the
  check as the caller. It happens for free.
- **339 broke an EXISTING path.** `explain_task` in Spanish had served for weeks.
  339 modified it and moved on to 340 and a handoff. Nobody called it, **because
  it already worked.**

So the variable is not memory, it is maturity. A new path gets exercised because
nothing works until you do. A modified path does not. The rule described what had
already saved us; it was never the mechanism, and writing it down conferred none
of the protection the original save came from.

**A post-condition also runs exactly once.** If it is wrong, nothing re-runs it.
339's was wrong and there was no second chance — which is the difference between
a post-condition and a test, and the reason the first cannot substitute for the
second.

### 2b. The instrument existed, covered the exact call, and was not run

`scripts/smoke-courseware.mjs` section B:

```js
await expectRows("get_syllabus -> task (es-419)", { resource: "task", language: "es-419", ... })
const es = await post({ resource: "task", language: "es-419", task_code: "1.1", limit: 1 });
```

It goes through the deployed function, which queries on its own reader pool **as
`mcp_reader`** — so it already satisfies the rule, without anyone invoking the
rule. Under 339 both calls returned 500. It would have failed loudly.

**It was not run after 339.** That is the whole gap. Not a missing check, a
missing step: running a migration and running the smoke test are two acts, and
only the first is forced by the work.

### 2c. And it was already red, which is why running it had stopped feeling useful

Run today, before any change:

```
passed: 29
failed: 2
  X held certification "ISMS-F" refused -- HTTP 200, expected 400
  X held certification "SM-AI-I" refused -- HTTP 200, expected 400
```

Both are **stale test expectations, not defects**. 334 admitted ISMS-F, 336
admitted AIMS-IA, 337 emptied `held` entirely. Nobody updated section C.

So this suite has reported RED since 334 — and **a suite that is red by default
cannot report a new red.** On the night 339 broke es-419, the one assertion in
this repository that would have caught it sat three lines above two failures
everyone had learned to expect.

`CLAUDE.md` says *"a guard that cries wolf gets loosened next time."* It does not
have to be loosened by an edit. Two stale expectations loosen it by attrition,
and nothing in a failing run distinguishes the stale half from the live half.

**That is the answer to your question.** The durable fix is not another rule about
roles. It is: *after a migration that touches an mcp view, run the suite that
calls the endpoint* — and keep that suite green, because a red suite is a
disabled one.

---

## 3. Two things I did about it, and one I deliberately did not

**Done — the probe now separates RAN from EFFECTIVE.** 339 *ran*: the DDL was in
the database and its 98 rows were written. It was not *effective*: nothing
reached a partner. Those are different questions and only one of them was being
asked.

```
339  RAN        task_translation_reviews = 98 row(s), expected 98
     EFFECTIVE  ISMS-F 2.1 es-419 returns knowledge to mcp_reader
```

`effective` is measured through the deployed endpoint, because that is what runs
as `mcp_reader`. A fingerprint that checks only the artifact reports RAN for a
migration whose entire purpose is dead.

**Done — the tip is gone from `CLAUDE.md`,** replaced by
`scripts/check-migration-state.mjs`. A migration with no fingerprint reports
**"no probe"**, never "not run": silence about a thing is not a claim about it.

**NOT done, deliberately — repairing section C of the smoke test.** I wrote a
derived version and reverted it. Deriving the served set needs an enumeration,
and there is no credential-free one: an unfiltered `certification` read returns
**one** row (it defaults to AISM-I), and `lesson_index` carries no certification
field — both measured today. The remaining source is a service-role read of
`public.certifications`, and that changes what credential the suite holds, which
is the one thing that suite is *about* (*"the credential the test holds IS the
hypothesis"*). That is a design decision, not a mechanical edit, and it is not one
to take the night before a partner meeting.

> **[CORRECTED 2026-09-17, later the same day — "there is no credential-free one"
> is false.]** The refusal body itself enumerates the served set:
> `"certification ZZ-TEST-I is not served here; must be one of: AISM-I, AIE-I,
> AIHR-I, ..."`. That is credential-free, comes from the deployed function, and
> is exactly the list a derived assertion would need. I had measured three
> candidate sources and reported the absence as a property of the system when it
> was a property of where I looked — **the same shape as every other finding in
> this file: a search that came back empty, read as an answer.**
>
> It does not change what was done — the block below is repaired with the literal
> code, on your instruction, and the literal code is the better choice here
> anyway: ZZ-TEST-I's refusal is the one that should never go stale in either
> direction. It does change the open item, which claimed a blocker that is not
> there.

**The measured partition, for whoever takes it:** 13 certifications exist, **12
served, 1 refused** (`ZZ-TEST-I`). So the boundary is real and the two failing
assertions are simply naming the wrong certifications.

---

## 4. 341 verified — as `mcp_reader`, not as superuser

Every call below goes through the deployed function, which queries on its own
reader pool as `mcp_reader`. This is the role test.

**Reviewed (339 cleared these) — served:**

```
ISMS-F 2.1  es-419   HTTP 200   knowledge 102ch  skills 89ch  abilities 86ch  ksa_withheld=false
ISMS-F 2.1  pt-BR    HTTP 200   knowledge 112ch  skills 95ch  abilities 86ch  ksa_withheld=false
```

> **knowledge (es-419):** que es un SGSI y la estructura comun de un sistema de
> gestion: politica, objetivos, procesos y mejora.
> **skills (es-419):** explica que aporta un sistema de gestion mas alla de un
> conjunto de medidas de seguridad.

**Not reviewed — still dark, both halves asserted:**

```
AIMS-F  1.1  es-419 / pt-BR   HTTP 200   knowledge null  skills null  abilities null  ksa_withheld=true
AIMS-IA 1.1  es-419 / pt-BR   HTTP 200   knowledge null  skills null  abilities null  ksa_withheld=true
```

`check-migration-state`, from its own probe rather than from anyone's say-so:

```
332 RAN   335 RAN   336 RAN   337 RAN   338 RAN
339 RAN + EFFECTIVE   340 RAN   341 RAN
NO PROBE: 330, 331, 333, 334
Every probed migration has run.
```

**A second, independent measurement was attempted and is not available.** I tried
the same property at the SQL layer (`set local role mcp_reader` over the Supabase
MCP) rather than resting on one instrument; `mcp.supabase.com` is unreachable
from this machine — the AAAA-only DNS failure `CLAUDE.md` records. There is no
direct Postgres credential in `scripts/.env` either. So the endpoint measurement
is the only one behind section 4. It is the right instrument, and it is one
instrument.

---

## 5. State

Every ISO certification: **0 refused, longest run 9w** against a threshold of 10.
479 lesson groups coherent. Marker parity 0 of 243, address parity 0 of 104.
Modal inflation 1, the known false positive. ISMS-F's 98 task KSAs and the 35
lesson rows you reviewed are cleared through recorded reviews, hash-gated, and
re-close automatically on an English edit.

**Nothing is written and unrun. `smoke-courseware.mjs` is green: 31 pass, 0 fail.**

**Open:**

1. ~~**Section C of `smoke-courseware.mjs` is red on two stale expectations.**~~
   **DONE the same day.** ISMS-F and SM-AI-I replaced with ZZ-TEST-I, on two
   resources rather than two names, and the line records what they named before.
   **The suite is 31 pass, 0 fail.** It is the suite that would have caught 339,
   and it can report a new red again.
2. **123 paragraphs across 68 rows** in `BILINGUAL-QUEUE-2.json`; 58 worked.
3. **3 refusals** from the last re-translation run, and the ~20 held paragraphs.
4. **Two guard gaps recorded and not patched**: compound `poder`
   (`habria podido`), and English `required` strong while `necesario` is narrowed
   — a designed asymmetry; fixing it means choosing a side.
5. **Fingerprints for 330, 331, 333, 334.** They report "no probe" today, which
   is honest and is not the same as verified.
6. **`get_lesson` on a reviewed Spanish row has still not been observed
   end-to-end.** It needs `CERTIDEMY_KEY`, which is not in this environment. I
   verified the gate's *inputs* — all 35 Postgres-written `en_hash` values
   reproduce under Node `md5(utf8)`, and `mcp_servable` holds on all 35 — which
   is not the same as seeing the body, and I am not going to report it as if it
   were.

---

## 6. What to distrust

Section 4 is measured. Section 5 counts were taken while working.

This session's own failure is the one to carry forward: **I reported 339 and 340
as unrun while both had run**, from a note rather than the database — the eighth
instance that day, committed by the author who had just written the rule against
it. The tip is now a probe. The same correction has not been made for the smoke
test, and §3 explains why it needs a decision rather than an edit.

```
node --dns-result-order=ipv4first scripts/check-migration-state.mjs
node --dns-result-order=ipv4first scripts/smoke-courseware.mjs      # 31 pass, 0 fail
node --dns-result-order=ipv4first scripts/scan-iso-leaks.mjs
node --dns-result-order=ipv4first scripts/audit-review-gate.mjs
node --dns-result-order=ipv4first scripts/check-attribution-parity.mjs
```
