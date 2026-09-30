# Deploying the option-order shuffle (PROMPT-95 s1e)

**Juan runs these. Nothing here has been run by me.** Supabase CLI 2.98.2.

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

## The commands

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

### Order does not matter, and I checked rather than guessing

Both orders expose exactly the same window — a session created **and** resumed in the gap between the two
deploys would see its options move. With zero live sessions and a gap of seconds, neither order is safer.
What does matter is deploying both back to back rather than leaving one live overnight.

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
2. **Start a simulator attempt** on any certification and confirm the options render with letters A–D in
   order and text beside each. The letters come from the option `id`, so A–D in sequence is the signal that
   the ids were reassigned correctly rather than the array reordered underneath them.
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
