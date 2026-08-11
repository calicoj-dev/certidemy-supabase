# HANDOFF v6.6

**Session date:** 2026-08-11
**Supersedes:** HANDOFF-v6.5
**Migration tip:** 199 · next free number is **200**
**Conformance:** nine live certs 0 fail; ISMS-IA 5 fail (Stage 9 in progress, expected)

Two repos under `C:\Users\Juan\Documents\certidemy\`:
- `certidemy-web\` -> GitHub `calicoj-dev/certidemy` -> auto-deploys to Cloudflare Pages on push to main
- `supabase\` -> GitHub `calicoj-dev/certidemy-supabase`

Supabase project ref: `pctynukndxnmnxiqpgck`. Deploy edge functions from the
PARENT `certidemy\` folder; run git from INSIDE each repo folder.

---

## 1. What this session was

Two unrelated pieces of work.

**A full database reset.** Every account, credential, exam record, company,
voucher and audit row created before today was deleted. **August 11 2026 is the
platform's zero date.** Certification content was untouched.

**Migration 199 — console-settable voucher purchase links.** The "Buy exam
voucher" CTAs pointed at the CertiGlobal home page via a hardcoded default. They
now resolve a per-certification product URL that a platform admin sets from
`/console/certifications`.

### Commits

| repo | commit | what |
|---|---|---|
| `supabase` | `d4f881d` | 199 + `set-cert-link` edge function |
| `certidemy-web` | `555d0f2` | console link editor, resolver, call sites, ingest ownership fix |
| `certidemy-web` | `cd5255b` | drop patch backups from the tree; ignore `*.bak` |

---

## 2. THE RESET — what was deleted and what survived

### Survivors (exactly two accounts)

| account | why it stays |
|---|---|
| `info@certiglobal.org` (`9bec43f7…`) | platform_admin. The console access path. |
| `specimen@certidemy.com` (`34891cae…`) | **Forced by the schema.** All 7 SPEC credentials hang off it, and `credentials.user_id` is NO ACTION, so deleting this account is impossible while they exist and would take the Specimens with it. |

`jroman.mobile@gmail.com` was deleted along with everyone else. **Note it was
`learner`, not platform_admin** — the two admins were `jroman.movil@gmail.com`
(the dormant test account) and CertiGlobal. An early read of this session got it
backwards; the profile row is the source of truth, not the account that looks
primary.

Post-wipe counts: users 2, profiles 2, credentials 7 (all SPEC), everything
transactional 0, **`quiz_questions` 22,211 — unchanged**.

### Six real credentials were destroyed

`AIE-I-S3EK-YYM3` (Lizeth Lopez), `AIE-I-NY7S-49XP` (Laura Atehortua Giraldo),
`AIE-I-XHSN-R28Y` (Jairo Casallas), `AIE-I-B9A6-QD3D` (Julian Duque),
`SM-AI-I-I-2DUC` and `SD-AI-I-SMS4-XFC6` (both Juan's, both malformed or
throwaway).

**Any verify URL those holders shared now 404s.** Deliberate — the reset was the
instruction — but if any of them surfaces, the credential has to be reissued from
scratch. There is no undo.

### The delete order, and why it took four corrections

The order below is the one that runs clean. It was reached by hitting three
`23503`s first, each from a foreign key the initial recon could not see.

```
0.  update vouchers set credential_id = null          -- BREAKS THE CYCLE
1.  credentials (except specimen user), exam_attempts
2.  exam_session_items, appeals, fsrs_reviews, fsrs_cards, quiz_attempts,
    mock_exam_results, pass_predictions, simulation_attempts, quiz_sessions,
    user_concept_mastery, user_lesson_progress, user_progress,
    lesson_format_preferences, chat_messages, chat_sessions, asset_downloads,
    study_plan_items, study_plans
3.  vouchers, company_invites, team_members, seat_batches,
    company_certifications, companies
4.  admin_actions, audit_logs, user_certifications
5.  null out quiz_questions.retired_by, comparison_cells.updated_by,
    source_documents.uploaded_by, platform_integrations.connected_by
6.  auth.users  (cascades profiles + enrollments)
```

**There is a genuine FK cycle** that no delete order can satisfy:

```
vouchers.credential_id      -> credentials
credentials.exam_attempt_id -> exam_attempts
exam_attempts.voucher_id    -> vouchers
```

It has to be broken with an UPDATE first. That is step 0 and it is not optional.

### THE RECON QUERY THAT WOULD HAVE BEEN RIGHT

The first two recon queries were scoped to `auth.users` and `companies` as
parents. Every failure came from a **public -> public** edge those queries could
not return: `exam_attempts.session_id`, the cycle above, `exam_session_items`,
`study_plan_items`.

Before any multi-table delete, run this instead:

```sql
select tgt.relname as parent, src.relname as child, a.attname as col
from pg_constraint con
join pg_class src on src.oid = con.conrelid
join pg_class tgt on tgt.oid = con.confrelid
join pg_namespace sn on sn.oid = src.relnamespace
join pg_namespace tn on tn.oid = tgt.relnamespace
join unnest(con.conkey) with ordinality k(attnum, ord) on true
join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k.attnum
where con.contype = 'f' and sn.nspname = 'public' and tn.nspname = 'public'
order by parent, child;
```

**And the reason the `auth.users` map looked so reassuringly short: most
user-scoped FKs point at `profiles`, not `auth.users`.** `profiles` cascades from
`auth.users`, so children of `profiles` must be gone before the account delete —
but they never appear in a map keyed on `auth.users`.

A related trap worth stating plainly: several user-scoped tables have **no FK at
all** back to `auth.users` (`vouchers.assigned_user_id`, `team_members.user_id`,
`exam_attempts.user_id`, `quiz_sessions`, `fsrs_cards`, `user_lesson_progress`,
`user_concept_mastery`). Deleting an account does not clean them and does not
error — it leaves rows pointing at a UUID that no longer exists. They must be
deleted explicitly or they orphan silently.

### Still outstanding from the reset

- **Orphaned PDFs in the `certificates` bucket.** Row deletes do not touch
  storage. Five folders belong to deleted credentials. Keep these four:
  `37b9415d…` (SM-AI-I SPEC), `6ab043a1…` (AIGRM-I SPEC), `4d5cf0f6…` (AIE-I
  SPEC), `261724e4…` (AISM-I SPEC).
- **GoHighLevel contacts.** Separate system, untouched. Anyone pushed from the
  old census is still a CertiGlobal contact.
- **`quiz_questions.retired_by` is now null** on migration 194's 76 retirements.
  `retired_at` and `retire_reason` survive and the migration file is the real
  record. A deliberate loss, not an accident.

### The window the reset opened

`quiz_attempts` is 0, so **migration 089's trigger blocks nothing.** Any item can
be rewritten in place rather than retired-and-superseded. This includes ISMS-IA's
three two-option `'corrective action'` items. **The window closes the first time
a candidate answers an item.**

---

## 3. MIGRATION 199 — PER-CERT VOUCHER PURCHASE LINKS

### Shape

`certifications.exam_link` already existed, unused and null across all ten certs,
so it became the default link rather than a new column. `exam_link_i18n` (jsonb)
is new and carries optional per-locale overrides.

```
exam_link_i18n[locale]  ->  exam_link  ->  https://certiglobal.org
```

Implemented once in `lib/certifications/buy-link.ts` (`resolveBuyUrl`) and
mirrored in the edge function. **One helper, used everywhere, so the fallback
chain cannot drift between surfaces.** It always returns a usable absolute URL,
so a caller can drop it into an href with no guard, and a cert with no configured
link behaves exactly as everything did before this shipped.

### Host lock

Two check constraints, backed by two IMMUTABLE validators:

- `certifications_exam_link_valid` — `https://` on `certiglobal.org` or null
- `certifications_exam_link_i18n_valid` — object, keys limited to
  `en` / `es-419` / `pt-BR`, every value a valid purchase URL

A purchase link that accepts any string is a way to point a paying buyer at a
domain someone else owns. The edge function validates too, but the constraint is
what holds when a future surface writes the column directly. **Both were proven
to reject before being trusted** — a constraint nobody watched fire is a
constraint nobody knows works.

### `set-cert-link` edge function

Copied from `set-cert-status`. platform_admin only, service-role write,
idempotent, audited to `admin_actions` as `set_cert_link` with a full from/to.
Empty string normalizes to null, so clearing a field is how a link is removed.

### Console UI

`components/console/cert-status-table.tsx` gained a second control per row: a
default link input with a Save button, plus a "Language-specific links" toggle
revealing three optional per-locale fields. Save is disabled until the draft
differs from the server row, and the local draft is dropped after a successful
save so the dirty check re-baselines against fresh data.

### Call sites

| surface | wired |
|---|---|
| `learn/[cert]/exam/page.tsx` | yes — `resolveBuyUrl(meta, locale)` |
| `learn/[cert]/dashboard/page.tsx` | yes — `resolveBuyUrl(cert, locale)` |
| `(app)/dashboard/page.tsx` | **no, deliberately** — it passes `hideBuyWhenNoVoucher`, so its BUY branch never renders |

Both wired sites take their cert from `getCertByCode`, which now selects the
column. **This was verified rather than assumed**: `resolveBuyUrl` takes optional
fields, so it compiles fine against a source lacking them and silently returns
the CertiGlobal home page. Green build, wrong link.

---

## 4. OWNERSHIP RULING — `exam_link` BELONGS TO THE CONSOLE

`scripts/ingest/plan.ts` listed `"exam_link"` in `diffCertification`'s
`diffFields` array. Any blueprint YAML omitting the key reads as *null vs console
value*, and the apply nulls it. **Every purchase link on the platform would
silently vanish on the next routine content pass.**

The line was deleted. `exam_link` stays in `ySide`/`dbSide` so a brand-new cert
can still seed a link from YAML on insert; only the diff list drives updates.

**Do not add it back.** Two writers on one field always resolves to whoever ran
last.

**`price_usd` has the identical exposure** and is still in that list. SM-AI-I
carries `178.00` while every other cert is `0.00` and Certidemy sells nothing.
Unresolved.

---

## 5. CONFORMANCE AFTER THE WIPE

`node scripts/verify-cert.mjs --all --strict` — nine live certs **0 fail**, item
bank intact. ISMS-IA has 5 failures, all known Stage 9 work:

1. practice pool empty (114 task-language slots at 0)
2. "All testable concepts tested 0/169" — **a consequence of 1**, since concept
   links come from the practice pool and secure is correctly firewalled
3. secure floor short in 33 slots (3.2 at 6; 3.7 and 5.1 at 7)
4. length cue: 9% guard escapes, mean margin 13 chars, strict-longest 46.8%
5. three two-option secure items

On 4: every other cert sits at 0% escapes and ~5 chars. ISMS-IA is an outlier by
an order of magnitude, consistent with the L2 principle-tension format pushing
options long. **46.8% strict-longest means a test-wise candidate beats chance by
picking the longest option** — this is a scheme decision (raise the ceiling or
tighten the options), not a generator tweak.

### A verify-cert bug worth fixing

The summary prints `10 cert(s) with failures - DO NOT publish those until
resolved.` Only ISMS-IA has failures; the other nine are warn-only. The rollup
counts anything that is not a clean pass as a failure. **That line is what gets
read at a glance before a publish decision, so it will eventually tell you not to
publish a cert that passed.**

---

## 6. PROCESS LESSONS

**`Set-Content -Encoding UTF8` writes a BOM on PS 5.1.** Already documented,
violated again this session, caught by `Format-Hex`. Use
`[System.IO.File]::WriteAllText` with `New-Object System.Text.UTF8Encoding($false)`
and absolute paths. `-NoNewline` also strips the trailing newline; restore it.

**Do not read indentation out of a tool's decorated output.** A patch anchor was
built from a `Select-String -Context` dump, which indents every context line by
two — so the literal never matched the file. The fix is a regex with captured
leading whitespace. The anchor assertion caught it and wrote nothing, which is
the script working.

**Multi-line source edits go through a node script with per-anchor assertions.**
TypeScript pasted into a PowerShell prompt is just an error. Three patch scripts
this session (`scripts/patch-*.mjs`), all exit 2 on dry so a skipped apply is
visible, all assert each anchor matches exactly once, all refuse to write if any
anchor fails.

**A dry run that prints `ok` has changed nothing.** `data.ts` was dry-run,
reported clean, and then left unapplied while the session moved on to deploy and
build. The build passed because the file was untouched. **Grep for the target
string after every apply.**

**`git add -A` sweeps `.bak` files into the tree.** Four patch backups were
committed and had to be removed in a follow-up. `*.bak` is now in `.gitignore`.

**Editor-first held again.** 199 ran live and both constraints were watched
rejecting before a single line of app code was written against them.

---

## 7. OPEN ITEMS

**From this session:**

1. Populate purchase links for the remaining nine certs in
   `/console/certifications` (AIE-I is set as a live test).
2. End-to-end proof: set a link, open that cert's exam page as a learner with no
   voucher, click the buy button, confirm it lands on the product page.
3. Clear orphaned certificate PDFs from storage (§2).
4. Clear GoHighLevel contacts if Aug 11 is meant to be a true zero.
5. Fix the verify-cert summary rollup (§5).
6. Decide `price_usd`: zero SM-AI-I, and decide whether the field stays
   ingest-managed (§4).

**Carried:**

7. ISMS-IA Stage 9 — L2 generator (`diff=undefined`, 46–63-word option
   overruns), practice backfill, session-timeout verification before publish.
8. AIGRM-I Stage 9 — secure bank + firewall proof, practice backfill,
   translations, `SCHEME-AIGRM-I.md`, status flip.
9. GHL live push verification -> inbound provisioning -> CSV bulk provisioning.
10. Advertising vendor-enable console panel (SQL-only today).
11. CertiGlobal checkout webhook (campaign launch blocker).

---

## 8. FOR `PIPELINE-INDEX.md`

Add a row: **"Delete accounts / tenants / bulk data"** ->
`HANDOFF-v6.6 §2`. The three durable facts:

- Run the **public -> public** FK map before any multi-table delete; a map keyed
  on `auth.users` or `companies` misses the edges that will actually block you.
- Most user-scoped FKs point at **`profiles`**, not `auth.users`.
- Several user-scoped tables have **no FK at all** — they orphan silently instead
  of blocking.
