# HANDOFF v9.1 — the homepage is fixed, and the site runs on Workers

**Migration tip: 266. Next free: 267.** Read the disk, not this line —
`ls migrations/ | tail -1`. **No SQL was written this session.**

**`HANDOFF-v9_0.md` OPENS ON TWO FACTS THAT ARE NOW FALSE.** It opens on a
homepage returning 500 to every non-browser client, and on a build tool that is
archived with no fix available. **Both were true when it was written and neither
is true now.**

v9.0 remains **correct as a diagnosis and misleading as a status.** Its §1–§4
are the record of how the failure was found and are worth reading; its §5 is a
proposal that has since been executed. **Do not read any of it as the current
state of the deploy.**

**The plan, its execution and its reasoning live in `OPENNEXT-MIGRATION.md`.**
This document does not restate them. Where something here has a "why" behind it,
the pointer goes there rather than duplicating it — that duplication is how two
documents drift into disagreeing.

---

## 1. What shipped

**`certidemy.com` serves from Cloudflare Workers.**

| | before | after |
|---|---|---|
| adapter | `@cloudflare/next-on-pages` (archived) | `@opennextjs/cloudflare` 1.20.4 |
| Next | 15.1.4 | **15.5.24** |
| wrangler | 3.114.17 | v4 |
| platform | Pages project | Worker `certidemy-worker` |
| edge pins | 81 | **0** |
| homepage | **500** | **200** |

**Zero application logic changed.** There were no `@cloudflare/next-on-pages`
API call sites to migrate — no `getRequestContext`, no adapter imports, only two
comments mentioning it. The migration touched build configuration and 81
one-line exports. **Wide and shallow, not deep** (`OPENNEXT-MIGRATION.md` §2).

**The fix is measured, not assumed.** `npm run deploy:check https://certidemy.com`
prints **ALL PASS**: three locale roots at **7,506 / 8,311 / 8,108** visible
characters script-stripped, the Supabase ref and anon key present in the served
bundle, canonical correct, the carrier route passing and the control failing all
five assertions.

**`credentials.certidemy.com` was never involved.** Separate Worker, separate
repo (`calicoj-dev/certidemy-credentials`), deliberately not git-connected, and
untouched throughout. The four Open Badges identifier URLs it serves are
immovable, which is why this was confirmed before any DNS step was written.

---

## 2. The two-repo commit state

**`certidemy-web` — `main` at `32c6db6`, pushed.** The migration merged as a
fast-forward `fdf8180..32c6db6`, 86 files. The Worker's production branch is
repointed to `main`.

**`supabase` — this file and `OPENNEXT-MIGRATION.md`.** No migrations, no edge
function changes, no deploys.

**One number in v9.0 is wrong and this is the correction.** v9.0 §7 item 2 says
**"84 pins"**. **It is 81 files and 81 pins.** The over-count was five files —
`CLAUDE.md`, two scripts carrying the string in a literal, and two `.bak` files
that carry real export statements Next never compiles, untracked, with `*.bak`
at `.gitignore:64`. **The working tree was counted where git's index should have
been.** Recorded here because a reader landing on v9.0 first will otherwise
carry the wrong number forward; the full working is in
`OPENNEXT-MIGRATION.md` §2.

---

## 3. THE PAGES PROJECT IS A LIVE ROLLBACK TARGET

**It has not been deleted, and deleting it is the only irreversible step in the
whole migration.** Do not delete it until the soak decision in §4.

**AND THE ROLLBACK IS NOT ONE STEP.** Cloudflare refuses a direct hostname move
in either direction:

```
Hostname already has externally managed DNS records.
```

So rollback is **remove `certidemy.com` from the Worker**, *then* **add it to
the Pages project** — with a window between the two where **the apex is attached
to nothing and the site is down**. Apex only; there is no `www` record.

**The length of that window has not been measured**, and the cutover was not a
rehearsal for it: step 3.1 ran under no time pressure with the old site still
serving until the moment of removal. **No number is put on it anywhere**, and
none should be quoted during an incident.

**Read `OPENNEXT-MIGRATION.md` § Rollback before acting on this.** It is written
for someone under pressure and it is the section most likely to be read that
way.

**Rollback restores the homepage 500.** It trades a working site for a
known-broken one, deliberately, and only to escape something worse.

---

## 4. What is owed

1. **`deploy:check` tomorrow, and again at 72 hours.** Two runs, not one: the
   first proves the cutover, the second proves it held. The soak started
   2026-08-30.
2. **The soak decision at 72 hours** — delete the Pages project, or keep it.
   Deleting it ends the rollback path described in §3. There is no rush and no
   cost to keeping it beyond a dormant project in the dashboard.
3. **`app/robots.ts` carries a stale sentence, and "fixing" it wrongly breaks
   the site's caching.** Its docblock opens:

   > `EDGE RUNTIME IS MANDATORY. Next.js metadata files are ROUTES, and`
   > `@cloudflare/next-on-pages fails the build for any route without`
   > `export const runtime = "edge"`.

   **That is now false** — OpenNext forbids the edge runtime rather than
   requiring it, and the file has no pin.

   **BUT THE SAME DOCBLOCK RECORDS SOMETHING STILL TRUE AND STILL LOAD-BEARING:**
   *"a PNG cannot carry an export, which is why those had to move to
   `public/`."* **`icon.png`, `apple-icon.png` and `apple-touch-icon.png` live
   under `public/` and must stay there.** That placement is what makes every
   `public/_headers` rule match a static asset rather than a Worker-generated
   response — and headers in `_headers` are **not** applied to Worker responses.
   Moving the icons back into `app/` would silently drop their cache headers.

   **So: correct the first paragraph, keep the second, move nothing.** The
   reasoning is `OPENNEXT-MIGRATION.md` §1 and §5 #6. A reader who sees only the
   stale sentence and "tidies up" undoes the conclusion that made the migration
   a migration instead of a redesign.

4. **`next@15.1.4` carried a security advisory — CVE-2025-66478**, flagged in
   the Cloudflare build log. **`main` is off it as of tonight**, at 15.5.24.

   Recorded because it is a **second, independent reason the upgrade was
   owed**, and it had nothing to do with the 500. The migration was justified by
   the adapter being archived, defective and unupgradable; the CVE means the
   version ceiling that adapter imposed was also holding the site on a
   vulnerable Next. **Two unrelated problems had the same fix**, and only one of
   them was being tracked.

5. **Still standing, unchanged, from `HANDOFF-v8_9-addendum.md` §5** — carried
   forward from v9.0 §7 item 4 because none of it moved:

   - 1EdTech conformance
   - OB3 certification
   - the last-admin guard
   - `cert.yml`
   - the learn layout's translation table
   - `session_cookie_survives`
   - the Safari observation, if a Mac appears

6. **Two smaller items from the LTI work**, neither blocking:

   - the **Embed interstitial** — decided (option 3, an honest interstitial),
     unbuilt, owned by a web session
   - **`advertises_ltiresourcelink`**, a one-line addition to
     `KNOWN_CAPABILITIES`

---

## 5. The line worth carrying out of this

v9.0 §8 ended on three instruments that each said the site was fine: the
browser, because it repaired the page; the Cloudflare log, because a caught
error never reaches the Worker; and `npm run build`, because the broken graph
existed only in the adapter's output. **None was broken. Each answered a
question next to the one that mattered.**

**The instrument that found the failure is the one that confirmed the repair** —
same script, same command, same domain, two hours apart:

| | visible chars, script-stripped | result |
|---|---|---|
| before | **48 / 58 / 48** | three failures |
| after | **7,506 / 8,311 / 8,108** | **ALL PASS** |

**A DIAGNOSTIC THAT CANNOT ALSO CONFIRM THE REPAIR IS ONLY HALF AN INSTRUMENT.**

That is not a coincidence of this incident. `check-deploy.mjs` could confirm the
fix because it asserts a **property of the bytes on the wire** — visible
characters, a known string, a control that must fail — rather than the absence
of an error. **A check built around "did anything go wrong" has nothing to say
on the day something goes right**, and you are left declaring victory from the
same three instruments that missed the failure.

**And two of this migration's central predictions came true without being
explained** — the 15.5.2 CI trigger and the chunk defect's mechanism, both
recorded as **observed, not explained** in `OPENNEXT-MIGRATION.md` §5. The site
is fixed. **Neither failure is understood.** That is worth being uncomfortable
about rather than reading two confirmations as two proofs.
