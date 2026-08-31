# HANDOFF v9.2 — the site is on Workers, and three agent surfaces went live

**Migration tip: 266. Next free: 267.** Read the disk, not this line —
`ls migrations/ | tail -1`.

**No SQL this session. THAT IS NOW THREE SESSIONS IN A ROW WITH NO
MIGRATIONS** — worth stating, because a tip line that never moves is exactly the
kind of thing that goes stale without anyone noticing it has stopped being
checked. The number above is unchanged since v9.0, and it is unchanged because
nothing was written, not because nobody looked.

**`HANDOFF-v9_1.md` IS ACCURATE ABOUT THE MIGRATION AND SILENT ABOUT FOUR THINGS
THAT NOW EXIST.** It was written the night the OpenNext migration landed and
before anything that followed. **That is the same failure mode v9.0 had once the
migration shipped, arriving exactly one document later** — correct about what it
covers, misleading as a statement of where the platform is.

v9.1 stays on disk and is still the record of the migration's outcome. **Read it
for the migration. Read this for the state.**

---

## 1. What shipped since v9.1

**Three agent-facing surfaces and one shared contract, all live on production.**
The detail lives in two topic documents; this section points at them rather than
becoming a third copy.

**`llms.txt` now points agents at the machine credential endpoint.** It names
`credentials.certidemy.com`, the `application/vc+ld+json` content type, the open
CORS, and the privacy contract. **This was the highest value per unit of effort
of anything built tonight**: it reaches every agent that can fetch a URL,
**today**, with no browser, no origin trial and no protocol.

**A WebMCP tool on `/[locale]/verify`.** Chrome 149 origin trial token served as
`<meta http-equiv>`, and **verified read on production with the local testing
flag DISABLED** — the only configuration in which that check means anything. The
privacy contract is enforced in `execute`, **not** in the schema. →
**`WEBMCP.md`**

**`certidemy.com/mcp` — a remote MCP server.** Spec revision `2026-07-28`, one
tool, public, no auth. **Discovered, listed and called by a real Claude custom
connector, with both credentials verified end to end through it.** →
**`MCP-SERVER.md`**

**`lib/verify/tool-contract.ts` — the shared contract both surfaces read.** The
one item of the four with no document of its own, so it gets its sentence here:
the tool name, description, schema and error messages live in a single module,
**so the description an agent sees cannot drift between the browser tool and the
network server.** Two surfaces describing the same capability differently is a
defect an agent would surface as inconsistency and nobody would surface as a
bug.

**The through-line of both records, in one line:** the same verification logic,
behind the same contract, over two transports — **one reaches zero agents and
the other reached a production agent within hours.** `WEBMCP.md` §2b holds that
measurement.

---

## 2. The two-repo commit state

**`certidemy-web` — `main` at `5c7cbd7`**, eight commits past the migration
merge: `23c57c8` (llms.txt), `cb8648d` (trial token), `00fcfc0` (WebMCP tool),
`441d6d7` (enforcement in `execute`), `7bd503b` (webmcp-types), then `10dad73`,
`2a5c173`, `5c7cbd7` (the MCP server).

**`supabase` — `main`, current and pushed.** Carries `OPENNEXT-MIGRATION.md`,
`WEBMCP.md`, `MCP-SERVER.md` and this file. No migrations, no edge function
changes, no deploys.

**`credentials.certidemy.com` — untouched.** Separate Worker, separate repo,
deliberately not git-connected. It is referenced by `llms.txt` and by the MCP
tool's output, and neither required changing it. **See §4 item 4 for the one
open question that does belong to it.**

---

## 3. THE SOAK IS STILL RUNNING

The 72-hour soak on the OpenNext migration started 2026-08-30. **`deploy:check`
is owed at the end**, and it is the second of the two runs — the first proved
the cutover, only the second proves it held.

**THE PAGES PROJECT IS STILL THE ROLLBACK TARGET AND MUST NOT BE DELETED.**

**New since v9.1: its automatic production deployments are now DISABLED.** It
will no longer accumulate failed builds against `main`, which removes a source
of noise in the dashboard.

**That is not the same as the project being retired, and the distinction matters
enough to state plainly.** "Deployments off" reads like "finished with"; it is
not. The last successful deployment (the `4a175a0` build) is still sitting there
and is still the artifact a rollback restores. **Turning deployments off made it
quieter, not less load-bearing.**

**Before acting on a rollback, read `OPENNEXT-MIGRATION.md` § Rollback.** It is
two steps, not one — Cloudflare refuses a direct hostname move in either
direction — with a window in between where the apex is attached to nothing.
Untimed, and no number is invented anywhere.

---

## 4. What is owed

**1. The soak's closing `deploy:check`, then the delete-or-keep decision.**
Deleting the Pages project is the only irreversible step in the migration.

**2. The WebMCP origin trial token expires 2026-11-16, and the lapse is
invisible.** Registration will silently stop in production **while continuing to
work locally behind the flag** — the developer machine, the one place anyone
would check, is the one place that keeps working. **`WEBMCP.md` §7 now carries
the detection procedure**, added after the production measurement that proved
the token was being honoured. Pointed at, not repeated, because the procedure
has one step that carries the whole thing and paraphrasing it would lose that.

**3. `app/robots.ts` still carries the stale `EDGE RUNTIME IS MANDATORY`
sentence.** Carried forward from v9.1 because it is still true and still not
done. **The same docblock records why `apple-touch-icon`, `icon.png` and
`apple-icon.png` live under `public/`, and that part is still load-bearing** —
that placement is what makes every `_headers` rule match a static asset rather
than a Worker-generated response. **Correct the sentence. Do NOT move the
icons.** Reasoning in `OPENNEXT-MIGRATION.md` §1 and §5 #6.

**4. THE OB3 STATUS LIST IS BEING RE-SIGNED ON EVERY REQUEST.** The one real
finding from tonight that has nothing to do with MCP.

Measured — an agent fetched `credentials.certidemy.com` twice, six minutes
apart, and observed `validFrom` moving:

```
2026-08-31T01:57:37Z  ->  2026-08-31T02:03:52Z
```

**That is two Ed25519 signings per verifier hit, and no verifier can cache the
status list**, because the document it receives is different every time.

**Not urgent at current volume. A real question if verification traffic grows**
— and verification traffic growing is the explicit goal of the three surfaces in
§1, so this is a question the rest of tonight's work makes more likely to
matter, not less.

**It belongs to the credentials Worker, a separate repo.** Recorded here so it
is not lost; owned there.

**5. `HANDOFF-v7_2.md:59` — SETTLED, and the way it surfaced is the part worth
keeping.** See below.

**6. `next@15.1.4`'s CVE-2025-66478 — settled.** Flagged in the Cloudflare build
log; `main` has been off it since the migration, at 15.5.24. Recorded as a
one-liner rather than dropped, so a reader of v9.2 alone knows it was handled
and does not re-investigate it.

### The badges 404 is correct behaviour, and a document caused the report

**`/badges/AIE-I-5GFT-YJ93.png` returns 404 while `/badges/AIE-I.png` returns
200. That is right.** `/badges/` is keyed by **certification** code, not
credential code.

**All six call sites in `certidemy-web` use the certification code:**

```
badge-download-dialog.tsx:146          `/badges/${certificationCode}.png`
verify/[id]/page.tsx:609               `/badges/${cred.certification_code}.png`
command-deck.tsx:242                   `/badges/${code}.png`
certifications/[code]/page.tsx:244     `/badges/${cert.code}.png`
dashboard/page.tsx:453                 `/badges/${cr.certificationCode}.png`
issuing-panel.tsx:297                  `/badges/${a.code}.png`   (a.isCertification)
```

**And two of them show where per-credential artwork actually comes from** —
`imageUrl ?? …` and `cred.image_url || …`. It is the **`image_url` column on the
credential**, never a `/badges/` path.

**`HANDOFF-v7_2.md` settles it in its own body**, 343 lines below the ambiguous
table row: `` src={`/badges/${cert.code}.png`} ``.

**So nothing emits that URL, nothing is broken, and no holder was ever given
it.**

### HOW IT SURFACED IS NEW, AND IT CHANGES WHAT A LOOSE PLACEHOLDER COSTS

**An agent verifying a credential read `HANDOFF-v7_2.md:59`, constructed
`/badges/<credential-code>.png` from it, fetched it, got a 404, and reported it
as a defect.**

The row it read:

```
  /badges/<CODE>.png                     badge artwork
```

**In that same table, `<CODE>` means the credential code in three of the four
neighbouring rows** — `/credentials/<CODE>`, `/verify/<CODE>`, and
`/credentials/<CODE>` again. The one row where it means the certification code
is written identically. **Case does not disambiguate it either:
`/certifications/<code>` is lowercase and is also a certification code.**

**The inference was reasonable. The row was wrong.**

**AN AMBIGUOUS ROW IN A HANDOFF IS NOW A THING AGENTS READ AND ACT ON.** That is
new. These documents were written for humans, on the assumption that a
misreading costs a moment of confusion and gets resolved by looking at the code.
**An agent constructs the URL, fetches it, and reports the result as a
finding** — with no confusion at any point, and nothing in the report indicating
the URL came from a document rather than from an emitter.

**It raises the cost of a loose `<CODE>` from "a human might misread it" to "a
machine will."**

**Fixed in this commit:** the row now reads `<CERT-CODE>`, with a dated note
recording why. **The rest of the table is left alone** — it is a record, and the
other rows are correct.

**The general form, and it applies to every document in this repo:** a
placeholder in a routing table is not prose. **It is an instruction, and it is
now executed.** The repo's existing rule — *mark what merely describes, rewrite
what directs* — already covers this; what is new is that the population of
readers who will act on a directive has grown to include something that never
hesitates.

---

## 5. The next piece of work, so it is not re-derived

**The four-URL card on `/console/lti` is the next WebMCP-shaped candidate.** A
paste error there already cost a test session, which is a concrete,
already-paid-for reason to make those values machine-readable rather than
hand-copied. It is a page a signed-in human is already looking at, which is
exactly the shape WebMCP fits.

**THE BOUNDARY, STATED ONCE.** Anything **session-bound** — a learner's
progress, applying vouchers, the console — **is an MCP server question, not a
WebMCP one.** A public endpoint structurally cannot serve it.

**And it needs auth**: OAuth 2.1, with **RFC 9728 Protected Resource Metadata**
as the one hard server-side MUST, and an authorization server that the MCP spec
explicitly places outside its own scope. **Supabase's own documentation says MCP
auth on edge functions is "coming soon."**

**That is a separate decision with its own hosting question**, and it should not
be approached as an extension of what shipped tonight — everything that made
`verify_credential` a safe place to learn stops being true the moment a tool can
see a specific user. **The road is in `MCP-SERVER.md` §11.**

---

## 6. Still standing from v9.1 §6

Carried forward unchanged, because none of it moved:

- 1EdTech conformance
- OB3 certification
- the last-admin guard
- `cert.yml`
- the learn layout's translation table
- `session_cookie_survives`
- the Safari observation, if a Mac appears
- the **Embed interstitial** — decided (option 3, an honest interstitial),
  unbuilt, owned by a web session
- **`advertises_ltiresourcelink`**, a one-line addition to `KNOWN_CAPABILITIES`

---

## 7. The line worth carrying out of this

v9.1 ended on the instrument that found the failure being the one that confirmed
the repair. **This one is about reach.**

**Three surfaces were built for agents in one night, and effort and reach came
out inversely ordered:**

| surface | what it took | what it reaches today |
|---|---|---|
| **`llms.txt`** | a text file | **every agent that can fetch a URL** |
| **`certidemy.com/mcp`** | a wire protocol, a spec revision, a conformance pass | **one client** |
| **the WebMCP tool** | a draft spec, an origin trial token, a browser flag | **none, measured** |

**The cheapest thing built reaches the most, and the most expensive reaches
nothing yet.**

**This is not an argument against having built the other two.** `WEBMCP.md` §2
already records why the browser tool was worth building anyway — it was the
place to learn the surface on something public, unauthenticated and low-stakes,
and everything in `WEBMCP.md` §3 was found there at no cost. The MCP server
reaches one client that happens to be the one people actually use, and it works.

**The point is narrower and it is about prediction.** Nothing in the technology
of these three things predicted that ordering. The draft W3C specification with
two named backers, the ratified protocol with an SDK and a conformance suite,
and a plain text file — ranked by apparent seriousness, the list runs exactly
backwards from the list ranked by reach.

**Only measuring it produced the true order**, and the measurements were cheap:
a `curl`, a `getTools()` call with a flag disabled, and one connector added by
hand. **Reach is an empirical property of an ecosystem at a moment, not a
property of a technology** — and it is the one thing about a new surface that
cannot be reasoned out from its documentation.
