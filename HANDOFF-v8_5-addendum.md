# HANDOFF v8.5 — addendum

**v8.5 is still accurate. This is the delta on top of it**, covering the work
that followed: the CertiGlobal wind-down closed out in code, and a second
translation system found spanning 42 files.

**Migration tip: 244. Next free: 245.**

---

## 1. The CertiGlobal wind-down is complete in code

v8.5 §1 recorded that the database rejected `go.certidemy.com` buy links. That's
fixed, and so is everything downstream of it. **What remains is two links the
admin team pastes in — nothing in either repo.**

### Migration 244 — `migrations/244_purchase_url_hosts.sql`

106 lines, ASCII-only, one `create or replace`, no `drop`. Editor-first: the SQL
ran live on 2026-08-23, and the file is the record rather than a script anyone
executes.

```sql
select u is null or u ~* '^https://([a-z0-9-]+\.)*(certidemy\.com|certiglobal\.org)(/|$)';
```

**Both hosts, not a swap.** Nine of eleven live certifications hold
`certiglobal.org` URLs. Replacing a function does **not** revalidate existing
rows, so a Certidemy-only check would fail *dormant* — invisible until someone
edited an unrelated field on one of those rows, then a constraint violation with
no apparent connection to the edit. Narrowing to Certidemy-only is a later,
smaller migration once the table is clean.

**`~*` replaced `~`.** DNS hosts are case-insensitive, and the old operator
rejected `https://CertiGlobal.org/x` with a bare constraint violation. The
`(/|$)` anchor is what stops `certidemy.com.evil.com`, and it still holds under
case-insensitive matching; the literal `https` still requires the `s`.

**Verified rather than asserted.** `md5(regexp_replace(prosrc, E'\r', '', 'g'))`
on the live function is `20730762f684dbf084d55343921cd450`; the same hash over
the body extracted from the file matches. The 13-byte length difference is CRs —
live body is CRLF, file is LF. That hash is recorded in the file header,
replacing an earlier unverified "byte-for-byte" claim.

**Neither constraint was dropped or recreated.** `certifications_exam_link_valid`
(oid 25797) and `certifications_exam_link_i18n_valid` (oid 25798) both retain
their original oids and `convalidated = true`. A CHECK calling a function by name
picks up the replacement. `is_valid_purchase_url_map` is unchanged because it
delegates.

**Behavioural parity across 12 URLs**, live function vs the JS regex, identical
verdicts on all of them. True on both including `https://GO.CERTIDEMY.COM/x`;
false on both for `certidemy.com.evil.com`, `certiglobal.org.evil.com`,
`http://certiglobal.org/x` and `notcertidemy.com`.

### The mirrored regex — the thing that would have made 244 useless

`functions/set-cert-link/index.ts` carries a copy of the same rule and **400s
before the database is ever asked**. Widening the SQL alone would have unblocked
nothing.

```
const URL_RE = /^https:\/\/([a-z0-9-]+\.)*(certidemy\.com|certiglobal\.org)(\/|$)/i;
```

The `i` flag mirrors `~*`. Deployed from the parent directory: version 4, ACTIVE,
2026-08-24 02:05:37 UTC. `deno check` clean.

Its error strings were widened too — they said "must be an https:// URL on
certiglobal.org", which would have told an admin the accepted host set was
narrower than it is.

**SQL first, then the function.** The reverse order turns a clean 400 into a
constraint violation surfacing as a 500.

### `migrations/199_cert_purchase_links.sql` — two notes, no SQL touched

**A `SUPERSEDED` marker** above the validator definitions. 199's body still reads
`~ certiglobal\.org`, which looks current to anyone opening it first.

**A `DEPENDENCY GAP` note**, and it's a real trap: `is_valid_purchase_url_map`
calls `is_valid_purchase_url` in a quoted-string body, which Postgres stores as
text and never parses. **The edge appears nowhere in `pg_depend`**, so
`DROP FUNCTION public.is_valid_purchase_url(text)` succeeds silently under the
default `RESTRICT`. The map function survives and throws at runtime on the next
write touching `exam_link_i18n` — surfacing as a check constraint failure that
looks unrelated to its cause.

The two CHECK constraints *are* recorded (`deptype = 'n'`) and would block a
drop. Only the function-to-function edge is invisible.

> **Rewriting the pair is safe. Dropping is not. Use `create or replace`.**

### `certidemy-web` — the code half

**`lib/certifications/buy-link.ts`** — `CERTIGLOBAL_HOME = "https://certiglobal.org"`
became `STORE_HOME = "https://go.certidemy.com"`.

The rename is the lesson. **A constant named after a brand cannot look wrong** —
the name matched the value right up until the value stopped being true, and
that's how a link to an unpublished store survived a brand change in plain sight.
Named for its role, the next store move is a one-line edit that can't leave a
stale name behind.

**Two files carried their own hardcoded copies and bypassed `resolveBuyUrl`
entirely**, so fixing the helper wouldn't have reached them:

- `app/[locale]/(marketing)/pricing/page.tsx` — `PARTNER_URL`, a live link on the
  public pricing page
- `components/exam/voucher-status-pill.tsx` — a default parameter behind the BUY
  state (reachable only when `hideBuyWhenNoVoucher` is unset; the one call site
  that passes no `buyUrl` does set it)

Both now import `STORE_HOME`. **No `https://certiglobal.org` literal remains in
any `.ts` or `.tsx` in the repo.** Never write the store URL as a literal a
second time — that is exactly how this drifted.

**`components/console/cert-status-table.tsx` — the highest-value fix.** This is
the screen where an admin sets these links, and it was still teaching the old
rule: host "locked to certiglobal.org", a link-less cert "falls back to the
CertiGlobal home page", and `placeholder="https://certiglobal.org/products/..."`.
All three wrong as of 244. **An admin following that screen would never have
tried a `go.certidemy.com` URL** — which would have made the entire unblock
invisible to the people it was for.

Now names both accepted hosts, and adds a clause the old copy lacked: the
fallback is a working page but *not* a product page, so a link still wants
setting. Without it, "falls back to the go.certidemy.com home page" reads as
"nothing to do here."

The file is untranslated; the edits are English-only and no wave was started in
it.

### What's left

**`AIMS-IA` and `ISMS-IA` still have a null `exam_link`.** Until they're set, a
buy click on either resolves to `STORE_HOME` and lands on the store's home page
rather than a product page. Nothing in either repo can fix that — only the admin
team, via `/console/certifications`.

---

## 2. Forty-two hand-rolled translation tables

`esco-picker.tsx` carried a `STR` table with all three locales inline, deleted in
wave 4. A repo-wide sweep found **41 more**.

**42 files, ~290 strings per locale, ~870 across three — larger than
`consoleIssuing` (158) and `consolePeople` (119) combined.**

| File | Const | ~Strings/locale |
|---|---|---|
| `lib/certifications/family-content.ts` | `FAMILIES` | 64 |
| `app/[locale]/(app)/dashboard/page.tsx` | inline | 31 |
| `components/marketing/partner-lead-form.tsx` | `COPY` | 25 |
| `components/marketing/partner-block.tsx` | `COPY` | 21 |
| `app/[locale]/(app)/settings/page.tsx` | inline | 16 |
| `components/quiz/quiz-mode-picker.tsx` | `STR` | 15 |

Concentrated in marketing (~9 files) and learner surfaces (~15). **Not the
console — so no planned i18n wave will find them by accident.**

### Why this matters even though they all render correctly

This isn't a bug list, it's a structural one.

A key can exist in `en` and not in `es-419` with nothing to catch it — the
merge-script rule that makes that impossible governs only `messages/*.json`.
They're invisible to anyone reviewing the locale files, so a translation review
reads as complete while roughly a third of the product's strings were never in
front of the reviewer. And a fourth language means editing 42 files instead of
three.

### Two traps for whoever sweeps next

**Don't search for `useLocale()` — it finds 3 of 42.** Most are server components
taking `locale` from `params` and indexing `STR[locale] ?? STR.en` directly.
Search the indexing pattern.

**`family-content.ts` defeats a naive extractor.** Its locale keys point at
identifiers (`scrumEn` / `scrumEs` / `scrumPt`), not inline objects, so a scanner
reading the object under `"es-419":` finds a variable name and reports zero. It's
the largest table in the repo and the first pass scored it at 0.

### Six files use both systems at once

`learn/[cert]/layout.tsx`, `(marketing)/certifications/page.tsx`,
`verify/[id]/page.tsx`, `(marketing)/business/page.tsx`, `(marketing)/page.tsx`,
`components/marketing/header.tsx`. `useTranslations` at the top reads as "this
file is done."

### Not tables — leave alone

`LABELS` in `locale-switcher.tsx` (language names, on the never-translate list),
and `LOCALE_TO_LANG` in `exam/page.tsx` and `tutor/page.tsx` (identity maps,
not UI copy).

**Nothing was migrated.** Migrating is mechanical and safe when strings are
lifted verbatim — wave 4 did exactly that for `esco-picker` and verified 36/36
character-for-character, so nothing rendered changed.

---

## 3. Commits

**`supabase`** — `b2f0e57..c18d011`, 4 files, +144/−8

| SHA | Effect |
|---|---|
| `747d728` | `set-cert-link`: widened the mirrored regex, case-insensitively, in step with 244 |
| `c18d011` | Migration 244; two notes added to 199; `CLAUDE.md` migration tip 243→244 |

**`certidemy-web`** — `c036e76..1e3eb9c`

| SHA | Effect |
|---|---|
| `c1c1c2b` | `CLAUDE.md`: item 1 marked fixed; added item 1a (244's SQL absent from the sibling repo) |
| `9b3d1e6` | `CERTIGLOBAL_HOME` → `STORE_HOME`, pointing at `go.certidemy.com` |
| `28f96d9` | Admin link-setting screen corrected; two bypassing call sites resolved; item 1a removed |
| `1e3eb9c` | `CLAUDE.md`: the 42-table subsection |

---

## 4. Process notes

**A guard caught its own comment.** The `cert-status-table` patch aborted on a
post-condition checking for `"locked to certiglobal.org"` — because the
replacement text explained that the screen *used to say* exactly that. Same
failure `CLAUDE.md` already documents with the `to anon` example. Nothing was
written. **The rule holds even when you're the one writing the prose the guard
reads.**

**An over-broad ASCII guard aborted a `CLAUDE.md` edit.** The ASCII-only rule is
CERT-SCHEMA-GUIDE §8 and is scoped to SQL; `CLAUDE.md` legitimately uses em
dashes. Nothing was written; the guard was scoped to `.sql` and re-run.

**`CLAUDE.md` item 1 was rewritten three times across four commits** — fixed,
narrowed, 1a added, 1a removed, rewritten. Each edit correct at the time. That
section is being maintained as a live worklist, which is fine while it's short,
but `CLAUDE.md` earns its keep as durable rules. **When it grows, resolved items
belong in a handoff and the section should keep only what's still true** —
otherwise every session pays tokens for items that resolved in a day.

**The two-repo blind spot fired again**, exactly as v8.5 §3 predicted. Item 1a
was created because the web session correctly observed that 244's SQL wasn't in
the sibling repo — true when written, false 20 minutes later. A finding recorded
in one repo about the state of the other goes stale with no mechanism to catch
it.

---

## 5. Open

**Decide:** `set-cert-link` has no `config.toml` entry and relies on the
`verify_jwt = true` default. It's one of **34 unpinned functions out of 53**, and
it was just redeployed. The repo's own comment on `create-partner-issuer` argues
that admin-gated functions are the last things that should depend on a default
staying put. A one-line pin in 245 either way.

**Stale, flagged, not edited:** `set-cert-link/index.ts` still opens *"Certidemy
sells nothing. Vouchers are purchased on certiglobal.org."* CertiGlobal is
unpublished and `go.certidemy.com` is a Shopify store, so that sentence is no
longer true. Whether Certidemy now sells directly is a business fact, and it
shapes more than a comment — it shapes the ten CertiGlobal marketing keys, the
pricing page, and what a partner is told about who they're buying from.

**Everything else from v8.5 §8 still stands**, including the ten marketing keys
naming CertiGlobal, the overloaded "partner" naming problem, `enqueue_email`
having zero callers, and the claims-sensitive i18n wave.

**Untracked in `supabase/`:** `.mcp.json`, `deno.lock`,
`scripts/fix-aims-ia-translations.mjs`, `scripts/probe-rdfc.ts`.

**Supabase CLI is v2.98.2; v2.115.0 is available.**
