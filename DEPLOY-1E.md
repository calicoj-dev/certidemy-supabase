# Deploying the option-order shuffle (PROMPT-95 s1e)

> **DEPLOYED 2026-09-30, in this order.** `certidemy-web` `ff0e394` first, confirmed live by
> `x-certidemy-build` at `https://certidemy.com/en`; then `get-active-exam-session`, then
> `generate-mock-exam`. Juan ran all three.
>
> This file is kept as the record of the sequence and the reasoning, not as a pending instruction. The
> commands below are still the right ones for a redeploy or a rollback.

**Juan runs these. Nothing here has been run by me.** Supabase CLI 2.98.2.

---

## THE WEB CHANGE SHIPS FIRST. THIS IS NOT A PREFERENCE.

Ruled PROMPT-95 addendum-2, and the reason is a defect in my original design that the director caught.

`exam-runner.tsx` rendered the chip letter from `opt.id`. With the functions live and the web unchanged, a
candidate would see **the letters scrambled — C, A, D, B down the list** — and the letter would still follow
the **stored** position, so clicking "A" selected id `a` in every attempt and **the shuffle would protect
nothing at all.** Worse, the keyboard handler matched the keypress against the option id, so pressing "a"
would have selected a *different* option from the one the chip labelled A — a mis-selection with nothing on
screen to show it.

So the order is:

| step | what | how |
|---|---|---|
| 1 | **certidemy-web** — letters from the position | `git push` to `origin/main` |
| 2 | the two edge functions | the CLI commands below |

### Step 1: how certidemy-web reaches production

**By `git push` to `origin/main`, built by Cloudflare Workers CI. It is automatic — not Vercel, and not
`npm run cf:deploy`.**

`npm run cf:deploy` pushes to `certidemy-web.jroman-mobile.workers.dev`, which is **not** the production
domain. That is a recorded defect: on 2026-09-24 a "successful" `cf:deploy` left production on the previous
commit. The header `x-certidemy-build-src: WORKERS_CI_COMMIT_SHA` is what says which commit is serving, and
`x-certidemy-build` is the only thing that answers *is my change live*.

```powershell
# from C:\Users\Juan\Documents\certidemy\certidemy-web
git push origin main
# then confirm the commit is serving before touching the functions.
# THE PATH MUST BE /en, NOT THE BARE DOMAIN -- see below.
curl.exe -sI https://certidemy.com/en | Select-String "x-certidemy-build"
```

**Wait for that header to show the pushed commit before step 2.** A local build succeeding is not evidence
that the thing you edited is live.

### The bare domain cannot answer this, and the first version of this check printed nothing

`https://certidemy.com/` returns **308 Permanent Redirect** to `/en`, and a redirect carries no build header.
So the command as originally written here printed **nothing at all** — which reads as "not live yet", or gets
shrugged off, and in either case it is a check that cannot pass rather than a check that failed. That is the
vacuous-result shape this repository already records against its own instruments, arriving in a deploy
instruction.

Measured 2026-09-30:

```
GET https://certidemy.com/     ->  308, Location: /en, NO x-certidemy-build
GET https://certidemy.com/en   ->  200, x-certidemy-build: ff0e39408f87d6ac6084c5073a7bac1443a26e03
                                        x-certidemy-build-src: WORKERS_CI_COMMIT_SHA
```

`curl.exe -sI` does not follow redirects, so the header never appeared. `-L` would also work; naming the
locale path is better, because it says which page was actually served.

### What a candidate sees if the order is reversed

| order | what happens |
|---|---|
| **web first** (correct) | between the two deploys the web change is a **no-op**: options still arrive in stored order, so index-derived letters are A, B, C, D on ids a, b, c, d — exactly today's display. Asserted by `scripts/check-letter-from-position.mjs` point 5. |
| **functions first** | every exam form served in the gap shows **scrambled letters** (C, A, D, B), and "always answer A" still finds id `a`, so the fix is inert while looking broken. Pressing a letter key selects the wrong option. Scores stay correct throughout — grading compares id sets — so **nothing would alert anyone**: it is a silent-wrongness window, not an outage. |

That asymmetry is the whole reason for the order. The safe step is the one that changes nothing until the
other lands.

---

## Preconditions, all verified read-only

| | |
|---|---|
| migration 384 applied | **yes** — the column exists and is filterable, 0 rows marked, 0 NULLs over 28,196 rows |
| exam sessions in progress | **none.** 158 rows have `completed_at IS NULL` and every one is past its expiry plus the 60-second grace. The oldest expired 2026-09-17; the newest, 2026-09-26. |
| `deno check` | clean on both changed functions |
| tests | `scripts/check-option-order-shuffle.mjs` — 600 of 600 attempts grade identically, 16 module controls pass |

**Deploying now cannot move the options under a candidate mid-exam.** Re-run
`node --dns-result-order=ipv4first scripts/check-384-and-live-sessions.mjs` immediately before deploying if
more than an hour has passed — the answer is only true as of when it was measured.

---

## Step 2: the function commands

**The CLI expects to find `supabase/` beneath the working directory, so it cannot be run from inside
`supabase/`.** These are written to be pasted while sitting in `supabase/`: `Push-Location ..` steps up,
and `Pop-Location` puts you back.

```powershell
# from C:\Users\Juan\Documents\certidemy\supabase
Push-Location ..

supabase functions deploy get-active-exam-session --project-ref pctynukndxnmnxiqpgck --dns-resolver https

supabase functions deploy generate-mock-exam --project-ref pctynukndxnmnxiqpgck --dns-resolver https

Pop-Location
```

**Run them one at a time and read each result.** PowerShell 5.1 has no `&&`, so they cannot be chained
safely — and a silent failure on the first followed by a success on the second is the worst outcome available.

`--dns-resolver https` is not optional politeness. `supabase functions deploy` has failed twice with
`lookup api.supabase.com: no such host` while `nslookup` answered normally, and once it succeeded on a blind
retry, which taught nothing. It is a global CLI flag.

### The order of these TWO does not matter, and I checked rather than guessing

This is about the two functions only — the web change still ships before both of them, for the reason at the
top of this file.

Between the two functions, both orders expose exactly the same window: a session created **and** resumed in
the gap would see its options move. With zero live sessions and a gap of seconds, neither is safer. What does
matter is deploying both back to back rather than leaving one live overnight.

---

## `functions/_shared/item-rules/option-order.mjs` IS in the bundle

**Yes, and the evidence is empirical rather than a claim about the CLI.** `generate-mock-exam` has imported
`../_shared/item-rules/stem-identity.mjs` since 2026-09-26 and is the live exam endpoint. If relative
`_shared` imports were not bundled, that function would fail at import on every request, and the trilingual
duplicate-stem rule it implements has been measured working in production.

`option-order.mjs` sits in the same directory and is imported the same way, by both functions. Nothing extra
needs to be passed to the deploy command; the bundler walks the import graph from `index.ts`.

---

## `verify_jwt` is deliberately NOT pinned for these two

Checked: neither function has a `[functions.*]` block in `config.toml`, and that is correct here. The pinning
rule exists for **public** functions, where a plain redeploy drops a `--no-verify-jwt` flag and silently
re-privatises an endpoint. These two are the opposite case: both call `authenticate(req)` and require a JWT,
and the CLI default is `verify_jwt = true`. Adding a pin would be writing down the default; omitting it keeps
the default, which is what we want.

---

## After deploying

1. **Re-run the session check** — it will now show any session created after the deploy:
   ```powershell
   node --dns-result-order=ipv4first scripts/check-384-and-live-sessions.mjs
   ```
2. **Start a simulator attempt** and confirm the options render with letters A–D in order, text beside each.
   The letters now come from the **position**, so A–D in sequence is guaranteed and proves nothing on its own.
   What to look for instead: start a **second** attempt on the same certification and check that an item you
   recognise has its option **texts** in a different order. That is the shuffle working.
3. **Reload the page mid-attempt.** The options must be in the SAME order. That is the one thing the
   deterministic seed buys, and it is the one thing a per-request shuffle would have got wrong.
4. **Submit it** and confirm the score is what you expect. Grading compares option id sets, so a changed
   order cannot change a score — but the claim is worth one real attempt.

### Rollback

```powershell
# from C:\Users\Juan\Documents\certidemy\supabase
Push-Location ..
git -C supabase revert --no-edit <the commit that added option-order.mjs>
supabase functions deploy get-active-exam-session --project-ref pctynukndxnmnxiqpgck --dns-resolver https
supabase functions deploy generate-mock-exam --project-ref pctynukndxnmnxiqpgck --dns-resolver https
Pop-Location
```

A rollback is safe at any time and needs no data change: the shuffle stores nothing. Reverting returns every
attempt to stored order, and grading is unaffected in both directions.

**A candidate mid-attempt during a rollback would see their options move once.** Same exposure as the
deploy, same mitigation: check for live sessions first.
