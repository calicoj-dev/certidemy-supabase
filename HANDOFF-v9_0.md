# HANDOFF v9.0 — the homepage has been returning 500

**Migration tip: 266. Next free: 267.** Read the disk, not this line —
`ls migrations/ | tail -1`.

**v8.9 and its addendum predate everything below and are now misleading about
the state of the deploy.** They describe an LTI feature proven end to end on a
site whose homepage was, throughout, returning 500 to every non-browser client.
Both are correct about LTI and neither mentions this, because nothing knew.

---

## 1. The failure, and why nobody saw it for an unknown period

**`certidemy.com/en`, `/es-419` and `/pt-BR` have all been returning HTTP 500.**

**IT LOOKS PERFECT TO A HUMAN.** React catches the error during SSR, Next serves
its error document with a 500 status — and that document carries the **complete
RSC flight payload**. The browser reads the payload and rebuilds the page
client-side. What you see is the homepage, correctly rendered, with the right
copy and the right layout.

**Strip the scripts and 217 KB becomes 2,105 bytes**, of which the only visible
text is the `<title>`.

So the population that saw a working site is: people, in browsers, with
JavaScript. The population that saw a 500 and an empty document is **crawlers,
link unfurlers, uptime monitors, and agents** — which is to say every reader
that decides whether the site exists.

**This is the sharpest instance of the failure shape this build keeps
producing** — a correct-looking answer that is wrong for the reader who is not
in the room. It was found by looking at the bytes, not by looking at the page.

---

## 2. The cause, and there is no fix upstream

```
ReferenceError: async__chunk_82704 is not defined
```

Thrown during SSR inside the Cloudflare Worker. **`next-on-pages` emitted a
`[locale].func.js` that references a webpack chunk it never defined.**

**It is `cloudflare/next-on-pages#941`** — same error, same trigger. Reported
against 1.13.7. **Closed `not_planned` on 2025-09-26 in a mass closure, the
repository archived 2025-09-29, the npm package deprecated, and 1.13.16 is
terminal.**

**There is no version to upgrade to and nobody to report it to.** That is the
fact that decides §5: this is not a bug awaiting a patch, it is a dead
dependency with a defect in it.

### It is deterministic, and it is not what the obvious fixes assume

- **The same chunk id across three builds.** Not a hashing coincidence.
- **Unmoved by changing the only first-party dynamic import.** The obvious
  suspect is not the trigger.
- **Two source-level fixes were attempted and both reverted.** Neither assumption
  about the trigger survived contact.

**Record that as a warning rather than a to-do.** The next person will have the
same two ideas, and both are already spent.

### The Cloudflare log says the request was `Ok`

**A caught SSR error never escapes to the Worker.** React handles it, Next
returns a 500 response, and from the Worker's point of view the invocation
completed normally. The exception appears in the invocation's **console output**,
not in its status.

**So the platform's own dashboard reports this as healthy.** Two independent
instruments — the browser and the Cloudflare log — both said fine.

---

## 3. The version ceiling, which is why this cannot be sidestepped

**Next cannot be upgraded past 15.5.2.** `next-on-pages` declares
`peer next <=15.5.2`, and with the repository archived **that ceiling is
permanent.**

**15.5.2 itself failed in CI on `/_not-found`, and the local instrument could not
reproduce it.** So the top of the supported range is not usable either.

**`next` is pinned exactly at `15.1.4` for that reason** — not as caution, as the
only version observed to work under a build tool that will never move again.

### `npm install` does not catch peer violations. `npm ci` does.

**Cloudflare builds with a clean install.** A peer conflict that `npm install`
resolves silently on a developer machine is a hard failure in CI.

**That cost a deploy.** The local build was green and the remote one was not,
for a reason invisible to the command that had been run locally — the same class
as everything else in this document: the instrument was answering a different
question from the one being asked.

---

## 4. `scripts/check-deploy.mjs`, and why it asserts TWO things

Run after every deploy: `node scripts/check-deploy.mjs [origin]`.

**Assertion one: each locale root returns 200.** That catches the failure exactly
as it happened.

**Assertion two: each locale root contains its own hero headline IN THE HTML,
outside every `<script>` tag.**

**The second exists because the first is not enough**, and the reason is the
whole design:

> The status catches the failure as it happened. It would **not** catch the same
> defect landing on a route that still returns 200 while producing no
> server-rendered markup — **which is the more dangerous half, because the
> browser repairs it and the status looks healthy.**

That is precisely the shape that hid this bug for an unknown period. A check
that only read the status would have been written by someone who had just been
bitten by it, and would still have missed its near neighbour.

**The headline is read from `messages/<locale>.json`** — the same source the page
renders from — so the assertion is **derived rather than hardcoded** and cannot
drift from the copy.

### And it carries a control

A bogus path with a timestamp in it must **fail both assertions**. If it does
not, the script prints:

> *The checks above cannot be trusted — they do not discriminate.*

**A clean run without a control is a fact about the checker, not about the
site.** This is the rule from v8.9 §6 — *a self-authored check is not
independent evidence; the control is what makes it evidence* — applied to the
one check that had to be right.

### The lesson it encodes, in its own header

**`npm run build` was green for this.** `next dev` and `next start` both
rendered the page. **The broken module graph exists only in the `next-on-pages`
output**, so no local check could see it.

**A green build is not a working deploy on this stack.** The only instrument
that catches this class is loading the page after it ships.

---

## 5. The answer: migrate to `@opennextjs/cloudflare`

Not a patch. The current build tool is archived with this defect in it.

**What is known about the scope, and it is not small:**

- **Workers, not Pages — so a NEW Cloudflare project.** Not an in-place upgrade;
  DNS, environment variables and build configuration all move.
- **84 edge pins to remove, across 84 files.** `export const runtime = "edge"` is
  a hard rule under `next-on-pages` and is not one under OpenNext.
  *(The brief said 83 files. It is 84 files and 84 pins — a naive grep reports
  86 because two files mention the pin in prose. Guards match code shapes, never
  English words.)*
- **A Next upgrade underneath it**, off the permanent 15.5.2 ceiling, which is
  the point of moving.
- **`_headers` behaviour is unverified** on the new runtime. It is not known
  whether the file is honoured, ignored, or replaced by something else.
- **The bundle fits.** The 15 MB of lesson markdown is **authoring source that is
  never imported** — one 9 KB test lesson excepted. It does not enter the
  bundle, so the Workers size limit is not the obstacle it first appears to be.

**The `_headers` question is the one to answer first**, because it is the only
item that could invalidate the plan rather than lengthen it.

---

## 6. What this changes about v8.9

**Nothing it says about LTI is wrong.** Every launch, every capability row and
every proof in v8.9 and its addendum happened and is recorded accurately.

**What is wrong is the impression.** v8.9 §1 opens on a working product and a
closed feature; it was written on a site returning 500 to every crawler, and
neither document mentions the deploy because nothing had looked at the bytes.

**Read them together with this one.** The LTI feature is proven. The site it
ships on has a build tool that is archived, defective, and cannot be upgraded.

---

## 7. Open, in order

1. **`_headers` under OpenNext.** One question, and it decides whether §5 is a
   migration or a redesign.
2. **The OpenNext migration** — new Workers project, 84 pins, the Next upgrade.
3. **Run `check-deploy.mjs` after every deploy**, starting now and continuing
   through the migration. It is the only instrument that sees this class.
4. Everything in `HANDOFF-v8_9-addendum.md` §5 stands unchanged: 1EdTech
   conformance, OB3 certification, the last-admin guard, `cert.yml`, the learn
   layout's translation table, `session_cookie_survives`, and the Safari
   observation if a Mac appears.

---

## 8. The line worth carrying out of this

Three instruments said the site was fine: **the browser** (because it repaired
the page), **the Cloudflare log** (because a caught error never reaches the
Worker), and **`npm run build`** (because the broken graph only exists in the
adapter's output).

**None of them was broken. Each was answering a question next to the one that
mattered.** The bytes on the wire were the only thing that answered it, and
2,105 of them said so immediately.
