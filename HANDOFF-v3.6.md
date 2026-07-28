# HANDOFF-v3.6.md

**Previous:** HANDOFF-v3.5.md
**Migration tip:** 159 · **next free number: 160**
**Session date:** 27–28 July 2026
**Repos touched:** both

Session opened as a marketing/sales readiness review, became a sales-asset
export layer, and detoured twice into defects found along the way. Both detours
were worth taking: one had been shipping wrong for three weeks, the other would
have opened four admin surfaces to a sales seat.

---

## 1. What shipped

### Module i18n — a three-week-old silent bug

The reported symptom was that module titles and subtitles were untranslated on
the newer certifications. The actual defect was larger and older.

- **`module_translations` already existed** (created 2026-07-08) and was
  backfilled for the three Scrum certs only. AIE-I, AIGRM-I, AIHR-I and AISM-I
  had zero rows. **36 rows authored and loaded** via
  `certidemy-web/scripts/load-module-i18n.mjs`.
- **`lib/modules/dashboard-data.ts` never read the table at all.** It takes a
  `locale`, applies it to the lessons query, then reads `title`/`description`
  straight off `modules`. So `/learn/[cert]/module/[module]` rendered English
  **on every certification including Scrum**, where the translations had existed
  since 8 July. Patched.
- `lib/catalog/data.ts` was already wired correctly — its overlay covers the
  catalog, journey, drawer and progress. `lib/dashboard/data.ts` never reads
  title, so it needed nothing.
- **Migration 153**: `is_provisional`, `updated_at`, an invalidation trigger on
  `modules`, and `v_module_i18n_coverage`.

**Why it went unnoticed for three weeks:** every other trilingual surface has an
invariant holding it up — lessons have three-row group checks, tasks and domains
have staleness triggers plus a `verify-cert` gate, claims have a publish
checklist step. Modules had none. Four certs shipped with zero module
translations and nothing anywhere failed.

The new coverage view is the missing signal. It is deliberately **not** wired
into `verify-cert` as a publish blocker: a task statement defines what the
credential attests, a module title is teaching chrome, and a gate that blocks a
release over a subtitle is one people route around. WARN, not FAIL.

### Sales library — the export layer

`SALES-LIBRARY-SPEC.md` committed. The premise: marketing is not missing
content, they are missing any way to get it **out** of the app and into an email
attachment. Every asset is generated at click time from the rows the website
reads; none is authored.

Shipped this session:

- **Migrations 154–159**: `marketing` platform_role; `credentials.is_specimen` +
  `v_credentials_real`; `comparison_cells`; `asset_downloads`;
  `certifications.validity_days`; `sales-assets` storage bucket.
- **`render-asset` edge function** (v3) — fact sheet, all three languages,
  content-versioned cache, download logging, staff-gated.
- **`/console/library`** — certification picker, then a lineage graph built on
  `GovFlow` (which was already generic; extended additively with an optional
  `actions` array). Confirm dialog before every generation.
- **`marketing` role wired into `loadConsoleAccess`** plus four console gates
  closed — see §3.

### Fonts

`_shared/fonts.ts` regenerated. The previous subset was cut for `certificate.ts`
only, and **the certificate deliberately never prints a score**, so the payload
had no `%` glyph. The moment the fact sheet drew "12.5%" it rendered a
missing-glyph box, and the text layer dropped the character silently — copy,
paste and search all lost it.

New subsets: Inter 4.1 + JetBrains Mono 2.304, 393 glyphs each, ~209 kB total.
Full Latin-1, **Latin Extended-A**, and the symbol set.

Latin Extended-A is not optional. Certificates render `holder_name` verbatim in
large display type. A tofu box in a candidate's own name is the worst defect
this system could ship, and it costs ~15 kB to make impossible.

**Verified, not assumed:** a certificate was regenerated after the change and
compared pixel-by-pixel against the pre-change render. **Zero differing pixels**
across 2.1 M. The metric risk did not materialise because the old subset came
from the same font releases; the character set was simply widened.

### Mojibake

`scripts/fix-mojibake.mjs` in both repos. Byte-precise: it matches the exact
double-encoded sequences rather than stray high characters, because
`\u00E2` is a legitimate Portuguese letter and a blanket check would be wrong.
Repaired 3 sequences in the web repo, 10 across four edge functions — **all in
comments**, so no redeploy was needed.

---

## 2. Stale documentation corrected

Recorded because in every case the docs and the database disagreed, and the
database was right.

| Doc said | Reality found | Status |
|---|---|---|
| `module_translations` "recommended" as a future migration (addendum-8, 7 Jul) | Table was **built and half-backfilled on 8 Jul** and never recorded in any handoff | Corrected; now fully backfilled |
| JTA domain/task translation backfill: "388 strings across 4 certs with **zero** translations" | **`domain_translations` is complete** — 7/7 certs, both languages, no gaps | Domains done. Task-level strings unverified — see §3 |
| Migration tip 143 | Actual tip was **152** | Corrected; now 159 |
| `security_invoker` is stored as `on`, checking `= true` gives a false negative | On this instance it reads **`{security_invoker=true}`** | **The documented rule is inverted here.** A guardrail written against `'on'` would produce a false negative. Verify per-instance; do not trust either form |
| AIGRM-I and AISM-I pending Stage 9 before flipping to `coming_soon` | Both are **`available`**, as are all seven certs | Unresolved — see §3 |
| `CERT-SCHEMA-GUIDE.md` §2 stale (flagged in v3.5) | Confirmed stale. §6 (modules) is accurate | Standing rule holds: query `information_schema`, never the guide |

**One correction to something I asserted mid-session and got wrong:** I claimed
`components/console/gov-flow.tsx` had rendered mojibake in its JSX, based on
reading `Â·` in PowerShell output. It does not — that was the console mangling a
correct `·` on display. The byte-level script found no middot damage anywhere.
Terminal rendering is not evidence about file bytes.

---

## 3. Open loops — read before touching related code

**Do not mint a specimen credential yet.** Migration 155 added
`credentials.is_specimen` and `v_credentials_real`, but **nothing aggregates
credentials in SQL** — every count happens in TypeScript, across nine sites.
Until they read the view, a specimen would be counted as a real credential in
the governance snapshot and console totals. That is the `SD-AI-I-V-TEST-0001`
failure repeated deliberately. Full include/exclude list is in the header of
`155_credentials_specimen.sql`.

**Do not assign the `marketing` role to anyone yet.** The role and gates are in
place and the library page exists, but nobody has clicked the flow end to end as
a marketing user. Test as platform_admin first.

**Six of seven library assets are stubs.** Only `factsheet` is implemented.
Blueprint sheet, JTA sheet, samples sheet, scheme PDF, specimen certificate and
comparison sheet render as disabled buttons with "Not built yet" — deliberately
visible rather than hidden, so the derivation chain stays legible.

**Fact sheet is two pages for six-domain certs.** AIE-I and AIHR-I fit one page;
AISM-I and AIGRM-I do not. Getting to one page means dropping a section — the
candidate is the "About" paragraph, whose only unique content is the "not ITIL"
disclaimer, which could move to a single line under the credibility block.

**Minor:** the weight-bar percentage sits ~1pt low against its bar. One-line fix,
folded into the next pass.

**Badges (design team):** three codes are wrong — `SMAI-I` should be
**`SM-AI-I`**, `SPOAI-I` → **`SPO-AI-I`**, `SDAI-I` → **`SD-AI-I`**. The other
four are correct. A badge code that does not match the credential is a
verification mismatch, which is the worst place for a typo in a body that sells
verifiability. Also unresolved on the artwork: the permanent "2026" against a
365-day validity, what "Founders" means in the handbook, no expiry on the
certificate face, and "Certificate of Achievement" being course-completion
language for what is a competence certification.

**Wordmark PNG pending.** Insertion point is marked in `factsheet.ts` with the
exact four lines. pdf-lib embeds PNG/JPG, not SVG.

**Data hygiene, pre-launch:**
- `laura atehortua giraldo` is stored lowercase and certificates render
  `holder_name` verbatim in display type. Ask her; don't guess a capitalisation.
- `SM-AI-I-I-2DUC` does not match the `CODE-XXXX-XXXX` format every other
  credential uses. Oldest row (11 Jun), likely an earlier generator.
- Confirm AIGRM-I and AISM-I genuinely completed Stage 9 before their fact
  sheets go to a buyer.
- Verify whether task-level JTA translations still need backfilling. Domains are
  done; tasks were not checked this session.

**Governance page asserts proctoring that does not exist.** `gov-flow` node
`run` is titled "Proctored Run". There is no proctoring — no camera, no identity
verification beyond the account, no tab detection. `exam-leave-guard` is a UX
guard, not invigilation. The badge ("timed · leave-guarded") is accurate; the
title is not. It is the one hand-typed claim on a page whose credibility comes
from everything else being rendered from live data. One-string fix:
`"Proctored Run"` → `"Exam Run"`.

---

## 4. Rules learned this session

**Cache keys must include a renderer version.** The fact sheet cache was keyed
on `certifications.updated_at` alone, so a change to the *renderer* was
invisible — after the font fix, an already-generated sheet kept serving the old
file with missing-glyph boxes in it. `FACTSHEET_RENDERER_VERSION` now lives next
to the renderer and forms part of the storage path.

**supabase-js select strings must be single literals.** A string built with `+`
defeats the template-literal type parser; the response degrades to
`GenericStringError[]` and refuses to cast. Cost a build failure in
`lib/console/library.ts`. Every loader in the codebase uses one literal.

**Multi-line anchors encode an invisible assumption.** Terminal pastes arrive
with blank lines collapsed, so an anchor spanning two lines is a guess about
whitespace you cannot see. Failed twice this session. **Single-line anchors by
default.**

**`git clean -d` is too blunt for this repo.** Removed six untracked items
beyond the two intended, including `public/fonts` — which is the likely original
home of the source TTFs, and there was no generation script for `fonts.ts`.
Recoverable only because both fonts are open-licence. **Name exact paths to
`Remove-Item` instead.** Nothing deployed was affected: Cloudflare builds from
GitHub, so untracked files were never in a deploy.

**A `ConsoleRole` addition is only safe if every gate is an allowlist.** Six
console pages test `!== "platform_admin"` and were fine. Four were not, and
`seats/page.tsx` is *inverted* — it redirects admins away, so anyone who is not
platform_admin falls through into voucher assignment and seat quotas. Adding the
enum value without closing those four would have opened all of them the moment
the first marketing user was assigned.

**Terminal output is not evidence about bytes.** See §2.

---

## 5. Decisions still owed

From the marketing/sales readiness review, none of which are technical:

1. **Legal entity, jurisdiction, who issues.** Blocks the institutional page,
   the legal pages, and the Candidate Handbook. The institutional text must not
   claim an independence we do not have — Certidemy both trains and certifies,
   which is legitimate while we do not claim accreditation, but the scheme
   documents already list that separation as pending.
2. **Attempt cap.** Open since v3.0. (A) 3 attempts, defensible today, zero work
   · (B) 6 after growing banks to ~16 items/task/language · (C) 6 as-is,
   documenting exposure risk. Recommendation stands at **A** for launch.
3. **Who authorizes issuance and resolves appeals.** The certificate mockup
   carries "Yajaira Casallas, CEA" — if that is the intent it belongs in the
   scheme documents, not only on the artwork.
4. **AI/internet policy in the exam.** Recommendation: prohibited in the rules
   (so revocation has a basis), stated plainly as unproctored, proctoring on the
   roadmap for level II.
5. Sales library minor: specimen holder label, download-log retention, whether
   the objection brief exists at v1.

---

## 6. Start here next session

1. Commit anything outstanding — check both repos with `git status --short`.
2. Point the nine credential call sites at `v_credentials_real`, then mint the
   specimen. That closes spec §8 and unblocks the specimen certificate asset.
3. `"Proctored Run"` → `"Exam Run"`.
4. Next library assets in value order: blueprint sheet, then scheme PDF. Both
   are pure additions to `render-asset` following the fact sheet's shape.
5. Wordmark into the fact sheet header when the PNG arrives.

Standing discipline unchanged: `--dry` first, grep to verify an edit landed,
`npm run build` green before any web push, editor-first migrations, separate
commits per repo, and verify on the live surface rather than on a script's
success message.
