# HANDOFF v8.5 — Claude Code, console i18n, and a blocked commerce path

**Delta on v8.4.** v8.2 is still the substance; v8.4 covers the email
infrastructure built earlier the same day. This file covers what happened after
it: Claude Code came into the workflow, the partner-facing console became
trilingual, and a live constraint turned out to block the thing everyone assumed
was merely stale.

**Migration tip: 243. Next free: 244.**

---

## 1. The finding that matters most

**An admin cannot save a `go.certidemy.com` buy link. The database rejects it.**

`public.certifications` carries two CHECK constraints from
`migrations/199_cert_purchase_links.sql`:

```
certifications_exam_link_valid       CHECK (is_valid_purchase_url(exam_link))
certifications_exam_link_i18n_valid  CHECK (is_valid_purchase_url_map(exam_link_i18n))
```

and `public.is_valid_purchase_url(u text)` is:

```sql
select u is null or u ~ '^https://([a-z0-9-]+\.)*certiglobal\.org(/|$)';
```

Verified by running the predicate against the live database:

| URL | accepted |
|---|---|
| `https://go.certidemy.com/aims-ia` | **false** |
| `https://certidemy.com/buy` | **false** |
| `https://certiglobal.org/products/x` | true |
| `https://www.certiglobal.org/x` | true |
| `https://certiglobal.org.evil.com/x` | false |
| `http://certiglobal.org/x` | false |
| `https://CertiGlobal.org/x` | **false** — the match is `~`, not `~*` |

`is_valid_purchase_url_map` additionally restricts `exam_link_i18n` keys to
exactly `en`, `es-419`, `pt-BR` and runs each value through the same host check.

**This was mis-diagnosed once already.** The first read was "a stale fallback
sends buyers to the retired store." That's the wrong shape. The write fails with
a constraint violation, so the admin team physically cannot paste the correct
link — the retirement of CertiGlobal is blocked at the database, not merely
un-done in the copy.

**And two live certifications currently fall through anyway.** All 11 rows in
`public.certifications` are `status = 'available'`; there are no drafts.
`exam_link_i18n` is null on all 11. Two have a null `exam_link`:

- **AIMS-IA** — ISO/IEC 42001:2023 Internal Auditor
- **ISMS-IA** — ISO/IEC 27001:2022 Internal Auditor - AI

Per the resolution chain at `199_cert_purchase_links.sql:18`
(`exam_link_i18n[locale]` → `exam_link` → `https://certiglobal.org`), a buy click
on either lands on the bare CertiGlobal homepage — not a product page, not a
Certidemy surface.

**244 is therefore the constraint change**, not the email wiring. Widening
`is_valid_purchase_url` to accept `go.certidemy.com` unblocks the admin team;
setting the two null links is then a data fix they can do themselves. Note the
constraint is doing real work — it rejects `certiglobal.org.evil.com` and plain
`http://` — so widening it means adding a host, not removing the check.

---

## 2. Claude Code is now part of the workflow

Installed via `npm install -g @anthropic-ai/claude-code`. Runs on the Max plan
and **draws from the same usage pool as claude.ai** — not the Console API credits
that fund the item generator. If it ever offers an API-credit option at login,
decline it; accepting bills at API rates.

Two `CLAUDE.md` files were written, one per repo, and both are committed:

- `certidemy-web/CLAUDE.md` — created `90d9cb1`, amended four times since
- `supabase/CLAUDE.md` — created `6c1b3bf`, 198 lines

**The `#` prefix writes to whichever repo the session is rooted in.** That is the
correction loop: when it does something wrong, type `# don't do X` rather than
carrying the correction into the next session by hand.

### The Supabase MCP

Configured in `supabase/.mcp.json` (untracked, OAuth so no secret in it):

```
https://mcp.supabase.com/mcp?project_ref=pctynukndxnmnxiqpgck&read_only=true&features=database,docs,debugging
```

**Read-only and project-scoped, deliberately.** Write access would bypass the
editor-first rule for migrations, and Supabase's own guidance is not to point
the MCP at production. `read_only=true` disables `apply_migration`,
`deploy_edge_function` and branch operations.

**The OAuth consent grants Secrets:READ** even though the `features` parameter
doesn't load secrets tools. A session rule is in place: never read Vault or
function secrets, and **never select from item, question or answer-bearing
tables** — the secure item banks are the one asset whose exposure invalidates a
certification.

It earned itself immediately: §1 above was answered by running the constraint
predicate against the live database rather than inferring from a migration file.

### What this changes about handoffs

Claude Code has the commits and the diffs; this chat has the reasons. The split
that works: **ask it for the factual record, write the handoff from that.** This
file was produced that way, from two separate factual records.

---

## 3. The two-repo blind spot

**A finding recorded in one repo's `CLAUDE.md` is invisible to a session rooted
in the other.**

Concretely: the five "Known issues outside the i18n waves" — including the
buy-link item — live in `certidemy-web/CLAUDE.md`. Asked about item 1, the
supabase session grepped its own `CLAUDE.md`, found no such item, and correctly
reported that. It was right; the file it could see genuinely doesn't contain it.

But the *fix* for that item is a CHECK constraint in the supabase repo. The
finding and its remedy are in different repositories, and neither session sees
both by default.

`/add-dir ../supabase` (or `../certidemy-web`) bridges it per-session. The
durable fix is that anything spanning both repos belongs in a HANDOFF, which
lives in `supabase/` and is the one document both sessions can be pointed at.

---

## 4. Console i18n — waves 2, 3, 4

**The partner-facing console is complete.** Verified by reading the role gate in
all 15 console pages rather than trusting the nav: a `team_admin` can reach only
`/console`, `/console/seats`, `/console/people` and `/console/issuing`. All four
are translated. Everything remaining is admin-only or marketing-only.

### Commits (certidemy-web, all on main, all pushed)

| SHA | Effect |
|---|---|
| `8a5a7b9` | New `consoleCommon`; `openVerification` replaces a hardcoded `title=` in **5** files |
| `1bcec7b` | CLAUDE.md: corrected `issuing-panel.tsx` line count and the "done" claim for `roster-table.tsx` |
| `505419f` | Bug fix: `consoleAssign.certification` rendered the literal "Certification" in es-419 and pt-BR on a live surface |
| `1f43a7a` | **Wave 2** — `consoleSeats` (84 keys) |
| `824ad8f` | **Wave 3** — `consolePeople` (119 keys) |
| `67640c8` | CLAUDE.md: CRLF rule reversal, pt-BR readiness split, state refresh |
| `07cf1b7` | **Wave 4** — `consoleOverview` (8) + `consoleIssuing` (158); deletes esco-picker's STR table; fixes the `useRouter` import |
| `c036e76` | CLAUDE.md: `t` shadowing rule, "Verifying a wave" subsection |

### Namespaces

All 36 namespaces in `messages/` have **identical key sets across all three
locales**. Console total: **435 keys × 3 locales**.

`consoleNav` 21 · `consoleAssign` 22 · `consoleRoster` 17 · `consoleCommon` 6 ·
`consoleSeats` 84 · `consolePeople` 119 · `consoleOverview` 8 ·
`consoleIssuing` 158

`consoleCommon` holds `openVerification`, `cancel`, `done`, `close`,
`errGeneric`, `errNetwork`.

### Still English

3 files partially translated (they carry only the shared verify tooltip):
`companies/[id]/page.tsx`, `platform-credentials-table.tsx`,
`credential-revoke-table.tsx`.

17 files untranslated, ~654 scan candidates. The largest:
`engine/page.tsx` (96), `library-flow.tsx` (86), `objections/page.tsx` (68),
`integration-card.tsx` (50), `coverage-analyzer.tsx` (46).

**`engine`, `objections` and `library-flow` hold about a quarter of what remains
and are their own wave.** `objections` is verbatim say-this-not-that scripting
including the accreditation answer; `engine` carries a literal *Never claim
these* list. Translating them means re-deriving where the claim boundary sits in
Spanish and Portuguese — "acreditado" has to stay as carefully unclaimed as
"accredited" — which is a review pass, not a wording pass.

---

## 5. What the waves taught

### `t` shadowing — three waves, three occurrences, two silent

`t` is the conventional name for a translator *and* for a task, tag, target or
type. It collided in wave 2 (`.map((t) =>` in the census push preview), wave 3
(four `t` bindings across three namespaces in one file), and wave 4 (four
callbacks over `TaskDraft` and `OB3_TYPES` in `achievement-modal`). One broke the
build outright; the rest shadowed silently, which is worse. Now a rule in
`CLAUDE.md`: name each binding for its namespace (`t`, `tc`, `tn`) and never bind
`t` to anything but a translator.

### A dead key is the same evidence as a string left in English

The most useful verification wasn't looking for untranslated strings — it was
looking for **keys nothing references**. That found `dropPng` and `wideImage`
still hardcoded in a file already declared finished.

### A `MUST_BE_GONE` post-condition can only catch what its author remembered

Wave 4's post-conditions passed while eight strings were still English, seven of
them in one component. The guard listed the strings its author had already
thought about. What actually found them:

- grep for `(label|hint|placeholder)="[A-Z]…"`
- grep for `? "A" : "B"` ternaries
- grep for backtick template literals
- the dead-key check above

None of those are JSX text nodes or quoted attributes, which is why string
scanners miss them.

### The attribute gap

Wave 1 read JSX text and never looked at `title=`, `placeholder=` or
`aria-label=`. `roster-table.tsx` was marked done while still carrying
`title="Open public verification page"` — and the same literal sat in four other
files. **A file marked done in an early wave may still have English attributes.**

### esco-picker had a parallel translation system

`esco-picker.tsx` was never untranslated: it carried a hand-rolled `STR` table
keyed by `useLocale()` with all three locales inline. Invisible to anyone
reviewing `messages/`, and outside the guarantee that a key can't exist in `en`
without `es-419`. Its 12 strings were lifted into `consoleIssuing` and verified
character-for-character (36/36 identical) before the table was deleted.

### CRLF — the line-endings rule was reversed

`core.autocrlf=true` means git materializes a file as CRLF whenever it re-checks
it out, and it hits one file and not its neighbours. After wave 2,
`readiness-roster-table.tsx` was CRLF while its whole directory was LF, and a
patch script anchored on LF aborted for a reason unrelated to its edit.

**The rule is now: normalize for matching, restore on write.** Mixed endings
*inside* one file are still an abort — that's a real defect, not a checkout
artifact.

---

## 6. Translation decisions worth not re-litigating

**Vocabulary is anchored to what the marketing site already says**, not
re-derived per wave. Checked across every namespace: pt-BR uses
*parceiro/parceiros/parceira* in 13 of 13 keys; es-419 uses *socio/socios/socia*
in 12 of 13. `consoleNav.scopePartner` — the badge under a partner's email, the
one string that actually reaches them — already matched both.

**English overloads "partner", and only one locale absorbs it.** It means both
the customer organisation whose admin logs in and a channel reseller who sells on
Certidemy's behalf. Spanish separates them (*socio* vs the loanword *partner*);
Portuguese collapses both into *parceiro*, so `business.contactBody` reads in
pt-BR as "we, or one of our customer organisations, will put together a
package" — which is not what's on offer. **This is a naming problem in English.**
Don't fix it by editing the Portuguese.

**Agency-carrying strings keep second person.** Spanish and Portuguese both allow
dropping the subject pronoun, which is exactly how "what you award" becomes "what
we award" silently. `qué otorgues` / `que você conceda`, `las certificaciones de
Certidemy que ya vendes`.

**`a través de Certidemy`, never `por Certidemy`.** The preposition is the claim:
*through* is infrastructure, *by* inverts who issued the credential — on the one
screen that explains the product.

**`POWERED BY` stays English; `ISSUED BY` is translated.** The first is painted
into the badge PNG beside the Certidemy mark, frozen into an image that travels
to LinkedIn and Credly. It's a maker's mark stating who runs the infrastructure.
The second is an editable default describing the partner's own thing in the
partner's own words. A mixed lockup is correct because the two lines do different
jobs.

**Three English strings were fixed before translating, because translating them
would have frozen an error into three languages:**

1. `adminSubtitle` named CertiGlobal → now `go.certidemy.com`
2. `emptyBody3` said "a DNS file" — the mechanism isn't DNS at all.
   `activate-partner-issuer` fetches
   `https://<domain>/.well-known/certidemy-issuer.txt` over HTTPS and says so in
   its own comment ("HTTPS well-known file, not DNS TXT"). "DNS record" would
   have been wrong too, and would have sent a partner to their DNS provider. Now
   "a file on your domain".
3. `emptyBody1` shifted person mid-sentence — third for the organisation, second
   for the possessives. English absorbs it because "your" is unmarked; Spanish
   marks su/tu and the shift is audible. Fixed at the source: second person
   throughout.

**`tu equipo` / `sua equipe`, not `tus personas` / `suas pessoas`.** The
possessive reads wrong, and `business.*` and `home.*` have used *equipo/equipe*
in nine keys each since before the console existed. The nav *label*
"Personas"/"Pessoas" is fine — it isn't possessive.

---

## 7. Email — unchanged since v8.4, and still unwired

**`enqueue_email` has zero callers.** Grep across `*.ts`, `*.tsx`, `*.mjs`,
`*.sql` in the supabase repo returns nothing outside `243_email_queue.sql`
itself. `email_queue` is empty. The cron job (jobid 2, `* * * * *`) is active and
firing every minute against an empty queue.

`render()` handles exactly one template key — `issuance.credential`. Anything
else throws `unknown template_key`, which `dispatch-emails` treats as terminal
and walks straight to `abandoned`.

Live state verified: both tables have `relrowsecurity = true`, zero policies, and
ACLs granting only `postgres` and `service_role`. All four functions have
`prosecdef = true` with the same ACL shape.

`config.toml` now pins 19 functions. `dispatch-emails` at line 529 and
`resend-webhook` at line 535, both `verify_jwt = false`. **34 of 53 function
directories are unpinned** and rely on the `verify_jwt = true` default — fine for
authenticated functions, and the recurring defect class is a public one that
loses its pin.

---

## 8. Open items

**Next, and in this order:**

1. **Migration 244 — widen `is_valid_purchase_url`** to accept
   `go.certidemy.com` alongside `certiglobal.org`. Keep the rest of the check;
   it correctly rejects `certiglobal.org.evil.com` and plain `http://`. Then the
   admin team can set `exam_link` on AIMS-IA and ISMS-IA.
2. **Wire issuance to `enqueue_email`** — in SQL, inside the issuance statement
   or a trigger on the credentials insert, not from TypeScript after the mint. A
   crash between the two otherwise leaves a credential nobody was told about.
   Needs a read of which tables hold `issuer_name`, `achievement_name`, and the
   holder's email and locale at issuance time — and whether a holder email is
   stored at all for partner credentials.
3. **The claims-sensitive i18n wave** — `engine`, `objections`, `library-flow`.

**Recorded in `certidemy-web/CLAUDE.md` § Known issues:**

- Ten message keys still name CertiGlobal in all three locales: `pricing.ctaBody`,
  `pricing.ctaButton`, `howitworks.heroBody/f2Body/ecoBody/eco2Title/eco2Body`,
  `business.b2Body/s2Body/vf1Body`
- The overloaded "partner" naming problem (§6)
- `consoleRoster.emptyBody` carries the possessive defect wave 4 corrected;
  shipped since wave 1
- `our-standard/page.tsx:254` — hardcoded English `ctaTitle: "Partner with us."`
  on a live marketing page

**Not in either CLAUDE.md:**

- `integration-card.tsx:4` imports `useRouter` from `next/navigation` — the same
  hard-rule breach fixed in `issuing-panel`. Admin-only, still present.
- `auth/callback/route.ts` — open redirect, `${origin}${next}` unfiltered.
  `auth/confirm` has `safeNext`; callback doesn't.
- `console-kit.tsx` — `invokeFn`'s two English default fallbacks are reached by
  any caller that doesn't pass translated ones. `issue-direct-modal.tsx` is the
  only such caller left.
- `census.ts` maps `platform_role = 'marketing'` to `learner`, so a marketing
  seat shows as a learner in the People census. Derivation question, not i18n.
- pt-BR renders *readiness* as both `Preparação` (blueprint, dashboardEmpty) and
  `Prontidão` (workspace, team, progressStrip). Live learner surfaces; wants its
  own change.
- The login page still ignores the `#error=` fragment, so an expired recovery
  link shows a bare login screen while the real message sits in the address bar.
- TLS on the Resend domain may still be Opportunistic rather than Enforced.
- The auth account is keyed to `info@certiglobal.org`, on the domain being
  retired.
- DMARC is still `p=none`.

**Untracked in supabase/:** `.mcp.json`, `deno.lock`,
`scripts/fix-aims-ia-translations.mjs`, `scripts/probe-rdfc.ts`. Note
`probe-rdfc.ts` imports `jsonld@8.3.2` while `deno.lock` pins `jsonld@9.0.0`.

**Deliberate residue — not defects.** A finished file does not scan to zero:
`POWERED BY` in the badge PNG, the 11 `OB3_TYPES` identifiers and the ESCO
framework constant in `achievement-modal`, `#E40064`, `KB`, the Certidemy brand
in the console layout, and `email@example.com` as a placeholder.
