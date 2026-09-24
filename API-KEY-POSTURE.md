# API keys: what exists, and what that posture is

Written 2026-09-24 after `lessonAccess.granted: true` revealed that the Claude connector
holds a standing key — a **discovery**, which PROMPT-15 said it should never be. That rule
was *mint, use, revoke, never print.* A standing key in a connector is a different posture,
possibly the right one, and it should be a decision.

**No key material is in this file or was printed anywhere.**

---

## The connector's key

| | |
|---|---|
| id | `9ec8bea9-b2d1-4a8a-b2c9-9a8291183ddc` |
| issuer | `test-partner-02` |
| name | `claude connector` |
| scopes | `courseware:lessons`, `courseware:rubric`, **`credentials:issue`** |
| minted | 2026-09-16 21:56 |
| expires | **never** |
| revoked | no |

**It carries `credentials:issue`.** A connector whose purpose is reading courseware holds the
scope that mints credentials under an issuer's signature. Nothing has misused it and the
issuer is a test partner, so the exposure today is small — but the scope is not needed for
anything the connector does, and least privilege is the whole argument for having scopes at
all.

---

## The population

```
total keys                                    14
active                                         8
active AND standing (no expiry)                8
active with BOTH courseware:lessons AND credentials:issue   5
keys that have ever recorded a use             1
```

**Every active key is standing.** Not one has an expiry. Several are named as one-offs —
`smoke-paywall: serves`, `demo - marketing`, `mcp check both scopes`, `mcp:check both paid
tools` — which is the mint/use/revoke shape without the revoke. The two keys that *were*
revoked are the two that carried an explicit expiry, which suggests the expiry is what
actually retires a key here, not anyone's intention to come back.

---

## `last_used_at` is not written, and that is the finding

**1 of 14 keys has ever recorded a use** — and the connector's key, which fetched a lesson
body minutes before this was measured, is **not** that one.

So the column does not reliably record use. The consequence is the one that matters for
every question above:

> **We cannot tell a live key from a dormant one.** Which means "revoke the ones nobody
> uses" is not currently an action anyone can take safely, and the sprawl above cannot be
> cleaned up without guessing.

That is an instrument gap, not a security finding, and it is the one to close first —
because it is the precondition for closing the others. `issuer_api_requests` may carry the
per-request record that `last_used_at` does not; that has not been checked.

---

## Decisions owed, none taken here

1. **Is the connector's key meant to be standing?** If yes, it should be named as such,
   scoped down to `courseware:lessons` + `courseware:rubric`, and recorded — not discovered.
2. **Drop `credentials:issue` from it.** Nothing it does needs minting.
3. **Fix or replace `last_used_at`**, then decide the sprawl. Not before.
4. **Should `mint-issuer-key` default to an expiry?** Six of eight standing keys look like
   probes. A default TTL would have retired them without anybody remembering to.

---

## What this does buy

`lessonAccess.granted: true` and a served lesson body are the **first positive evidence all
week that the paid path works end to end** from outside. Every refusal the wire matrix has
recorded from those tools was equally consistent with a working paywall and a tool that
serves nobody; `mcp:check` says so in its own output — *"UNTESTED IS NOT PASSED."*

`scripts/check-mcp-wire.mjs` can now retire its three `NOT EXERCISED` cells by reading a key
from the environment. That is the oldest open item in the matrix.
