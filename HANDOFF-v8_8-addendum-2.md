# HANDOFF v8.8 addendum 2 — the iframe test, and how this work runs

**Migration tip: 261. Next free: 262.**

Two things, and the second is the one that doesn't exist anywhere else.

§1 is the next real test: **the Moodle sandbox**, which produces the iframe case
`lti-ri` structurally cannot.

§2 is **the working method** — how this build actually operates across three
windows and two Claude Code sessions. Every handoff so far records *what* was
built. None records *how*, and a new chat starting cold has to rediscover it.

---

## 1. The Moodle sandbox — the iframe case, free

Everything provable against the 1EdTech reference implementation is proven. What
remains is what that rig **structurally cannot produce**: `lti-ri` navigates the
top-level window rather than embedding, so `certidemy.com` is first-party for the
entire flow. `state_cookie_survives` read `true` across eight launches **with
third-party cookies blocked in Chrome** — the setting did not apply rather than
failing to bite.

The picker has only ever rendered top-level. Its own header calls an LMS iframe
*"the most hostile rendering context we ship to"* — blocked storage, restrictive
CSP, ancient embedded browsers — and it has never been in one.

**Moodle produces it.** There is a public sandbox at `demo.moodle.net` with
admin credentials `admin` / `sandbox`, and the registration path is
Site Administration → Plugins → Activity modules → External tool → Manage tools →
*Configure a tool manually*. Moodle also has an explicit setting for whether a
tool displays **inside an iframe on the platform** rather than in a new window,
which is the switch that creates the case.

> **The sandbox resets on a schedule** (reported hourly). Registrations do not
> survive it. That is fine for a test run and useless for anything you want to
> keep — so do the whole sequence in one sitting, and expect to redo it if you
> come back tomorrow.

`LTI-SETUP.md` Part Two is the runbook for this and **carries a banner saying it
was written from the specification and never executed.** Whoever does this first
should correct it from what they actually see and move the banner. **Make that a
numbered step in the task, not a note** — a banner cannot enforce a correction
pass, and the likely outcome otherwise is someone hits a mismatch, works around
it, and never comes back.

### What it tests that nothing else has

| Untested | What Moodle gives |
|---|---|
| the picker in a real iframe | set the launch container to embed |
| third-party cookie drop | genuinely third-party in a frame; `state_cookie_survives` may finally read `false` |
| the **mixed capability row** — `varies` styling, `changed_at`, `previous_value` | a `true` then a `false` on one key is the first real flip |
| `product_family_code` populated | Moodle sends a vendor name; lti-ri sends an empty string |
| `unsubstituted` custom variables | ask for a Moodle substitution it can't resolve |
| whether AGS/NRPS claims arrive at all | they are per-install, not per-product — leave both **off** |
| `deep_linking_settings.data` | **Moodle does not send one**, which is why migration 259's gap went unnoticed |

That last row is worth reading twice. **Moodle would have made the `data` path
look finished.** The column exists only because we chose not to leave a named gap
sitting in a header, and lti-ri is what proved it.

### The one thing still open on the old rig — closed 2026-08-28

The `data` echo. Their confirmation page decodes our entire outbound payload,
`data` claim included, and **two deep-linking runs have now read `iss`, `aud` and
`message_type` off that page without capturing that one line.** It is the last
unproven item in Part One and it costs one glance at a page you are already
looking at. **[CLOSED 2026-08-28 — the third run read that line. The claim is on
the wire, and `a2b5895` records it rather than inferring it:
`claim_presence.data` from the signed payload and `.data_requested` from the
session column. `true`/`true` observed; `false`/`false` still unproven and needs
a platform that sends no `data`.]**

---

## 2. How this work runs

Not documented anywhere else, and a new chat starting cold will otherwise
reinvent it badly.

### Three windows

| Window | What it is | What it does |
|---|---|---|
| **Claude Code — web** | rooted in `certidemy-web` | routes, components, i18n scripts, `lib/`, `CLAUDE.md` |
| **Claude Code — supabase** | rooted in `supabase` | edge functions, migrations *as files*, `scripts/`, handoff docs |
| **PowerShell** | wherever | `git push`, `supabase functions deploy`, `curl`, file moves |

Plus **this chat**, which is none of those. It holds the whole picture across
both repos, writes the prompts, and writes the SQL.

**Every prompt is labelled with its target session.** *"Supabase session:"* or
*"Web session:"* on the line before the block. Two sessions and no label is how
a migration ends up in the wrong repo.

### The label has to be INSIDE the prompt, on its first line

**A label outside the prompt is not carried by the thing being pasted.** The
sentence above the block stays in this window; the block travels alone. So the
target repo goes in the **first line of the prompt itself** — *"Supabase
session:"* as line one of what gets copied, not as the line above it.

**Three misroutes in one night, all in the same direction, none caught by the
label.** A web-session plan about `console-kit` button states, a set of
decisions about outcome rendering and an "item 2" that existed only in the web
session's plan, and a third earlier the same evening. Every one was caught by
the **receiving** session noticing it did not hold the plan being approved.

**The tell is a specific phrase: *"as you proposed"*, attached to something the
session never proposed.** Also *"as we discussed"*, *"the plan you sent"*, or a
numbered decision answering items the session cannot see. Any message crediting
a session with a plan it does not hold is **a routing error, not a memory
lapse** — and the distinction decides what to do about it.

**THE FAILURE MODE IS NOT CONFUSION. IT IS A COOPERATIVE SESSION INVENTING
CONSENT.** A session that treats this as its own gap will do the obliging thing:
read the files, reconstruct a plausible plan, and build it — and the result is
**an approval trail for decisions nobody made.** The commit message says the
decision was approved. The handoff records it as settled. Nothing in the repo
distinguishes it from a decision that was actually taken, because from inside
the artifacts it is identical.

So: **a session that does not hold the plan must say so and stop**, even where
it could reconstruct one — especially there, because the ability to reconstruct
is what makes the fabrication convincing. Ask; do not infer.

**This is the fifth form of `CLAUDE.md` item 8's family** — a rendering of state
trusted over the state itself. The other four are a commit graph, a diff, a
working directory and a section banner. Here the state is **which session holds
what**, and the rendering is a prompt that arrived without its address.
Addendum 3 §5 enumerates the first four; this is the one that came after it was
written.

### SQL comes from here, never from Claude Code

**Claude Code never runs SQL and never hands you SQL to copy.** It reports what
statements it wants; this chat writes them out; you paste them into the
**Supabase SQL editor**, **one statement at a time**; you paste the results back.

That is not ceremony. Editor-first is the house rule — the `.sql` file in the
repo is *a record of what already ran*, not a script anyone executes. Which is
why:

- **Verification queries come back verbatim**, and the migration file records the
  observed output rather than the submitted statement. Postgres rewrites things:
  `status in ('active','inactive')` is stored as `status = ANY (ARRAY[...])`, and
  a file that doesn't match the live object reads like a hand-edited constraint.
- **Function bodies get md5'd from `prosrc`** with CRs stripped. This caught a
  real no-op: `CREATE OR REPLACE` refused with `42P13` because it tried to remove
  a parameter default, the old body stayed in place, every caller kept working,
  and **nothing said so.** The hash was the only thing that noticed.

### Never ask for a bearer token from a browser console

This got done twice and it was wrong both times. If something needs
`platform_admin` auth to test, **write a service-role script instead** —
`scripts/lti-mint-key.mjs` is the pattern. Claude Code has the service key; you
should not be assembling JWTs by hand in DevTools.

### Report before writing

For anything non-trivial, the prompt ends with **"report the plan before
writing"** — and the report routinely comes back with something that changes the
plan. Real examples from this session alone: `page.tsx` can't return a
`Response`; deactivation exercises `lti-login`'s filter and not
`platform_inactive`; `supports_deep_linking` was tracking message type rather
than platform capability.

**The report is where the bugs get found.** Skipping it to save a round trip
costs more than it saves.

### Files come out of this chat as artifacts

Handoffs and any long document: written here, byte count verified, downloaded,
then

```powershell
Move-Item -LiteralPath "$env:USERPROFILE\Downloads\NAME.md" -Destination "...\NAME.md" -Force
$h = [System.IO.File]::ReadAllBytes("...\NAME.md")
"bytes: $($h.Length)  (expect NNNNN)"
```

**Delete the Downloads copy before re-downloading** — the browser silently
creates `name (1).md` and you will move the wrong file.

### Commit and push

Each repo separately. **Push is always manual and always yours** — Claude Code
commits, this chat tells you when to push, you run it. Cloudflare deploys
`certidemy-web` on push; edge functions deploy explicitly.

Use `git commit -F` rather than `-m`. **Backticks in a `-m` string trigger
PowerShell command substitution** and mangle the message — this happened twice.

### The two-repo blind spot, both halves

**Writing:** a rule copied into two repos drifts. `CLAUDE.md` item 8 lists the
pairs. **A pair inside *one* repo doesn't have to stay a pair** — `create-` and
`update-lti-platform` share `_shared/lti-registration.ts` and there is nothing to
keep in step. Reserve the discipline for what actually spans repos.

**Reading:** `git log` orders by **graph, not time**. A session in one repo will
read the other's commits as pre-existing history. It happened: five web commits
were reported as predating the LTI work, and two of them were made *after* that
session's own first commit, by the other session, the same afternoon. **Check
timestamps before calling anything history, and assume the sibling repo is being
worked on right now** — it usually is.

### What makes the loop work

- **Complete drop-in files, never snippets.** Never edit a file without reading
  its current contents first.
- **Dry-run before anything destructive.** `--apply`, dry by default, and
  **abort on an unrecognised flag** — the two script conventions are opposites
  and a flag someone believed in that silently did nothing is how
  `load-lessons-direct.mjs` runs live on a typo.
- **Verify by property, not by count.** `12 = 12` passes with the wrong twelve
  columns; comparing the *sets* is what catches it.
- **The recurring failure mode is silent success.** Every rule above exists
  because something worked, reported no error, and was wrong.

---

## 3. Where things stand

**Proven:** OB2 export on every credential; LTI 1.3 phase 1 end to end against
lti-ri — registration, OIDC, RS256 verification, nonce consumption with the
replay guard firing unprompted, deployment auto-registration, the tolerant
reader, the picker, the signed deep-linking response accepted by the platform,
and the `iss`/`aud` inversion confirmed on the wire.

**Next, in order:**

1. **The Moodle sandbox** — §1. Everything left needs a real iframe.
2. **The `data` echo**, one glance away on a page already being read. **[CLOSED
   2026-08-28 — read off that page, and recorded rather than inferred:
   `claim_presence.data` and `.data_requested`, `a2b5895`.]**
3. **Phase 2** — the student launch. `profiles.email` is `NOT NULL UNIQUE` and
   feeds five downstream paths including `credentials.holder_email`, so a
   synthetic address for a withheld email gets hashed into a credential. **Settle
   that on paper before any code.** **[SETTLED 2026-08-28 — see
   `LTI-PHASE-2.md`. The identity control sits at the moment of assessment and
   nowhere else; the withheld-email case is refused with two doors and no
   address is ever invented.]**
4. **The last-admin guard**, still unnumbered and unapplied. Next free is 262.

Everything else stands as recorded in v8.8 and addendum 1.
