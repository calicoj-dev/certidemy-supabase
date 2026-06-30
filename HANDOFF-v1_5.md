# CERTIDEMY — HANDOFF v1.5 (paste this into the new chat)

_Version 1.5 — 2026-06-29. Supersedes v1.4. Since v1.4 the headline event was a
**security remediation**: a review found the entire **secure exam pool + answer
keys were anonymously readable** via the API, and it was closed with a default-deny
**tiered-visibility access-control model** (migrations 058–060). The same change
also made the **marketing sample questions DB-driven and multilingual** (they were a
hardcoded English-only array). Pairs with REFERENCE v1.4 (still the stable manual
for paths/schema/generators — read it; a v1.5 reference update is pending) and the
new **`QUIZ-VISIBILITY-SECURITY-MEMO.md`** (auditor evidence, repo root, next to
`ITEM-CUE-REMEDIATION-REPORT.md`)._

Pre-launch. Claude: act as the decisive EdTech/Scrum/UX/product expert. Deliver
COMPLETE drop-in files (never snippets, never edit a file without seeing its current
contents first), one clean PowerShell block per batch, `npm run build` locally
before every web push. I have no concept of time — never suggest breaks. Always hand
me the exact copy-paste command for anything you need to read or run — don't ask me
to find a file or recall a name from memory.

**The mission:** Certidemy is an "audit-ready by design," ISO/IEC 17024-framework
certification platform whose differentiator is certificates and lessons **built for
the age of AI**. Launch, sell, collect candidate data, then pursue formal 17024
accreditation. Until accredited we say "built to the 17024 framework," never "ISO
17024 certified." Everything must be legit and provable — people pay real money.

---

## 1. REPOS (full detail in REFERENCE §1)

Parent (NOT a repo): `C:\Users\Juan\Documents\certidemy\`
- **WEB** `certidemy-web\` → github.com/calicoj-dev/certidemy.git (Next 15.1.4, edge everywhere, Cloudflare Pages, live https://certidemy.pages.dev).
- **SUPABASE** `supabase\` → github.com/calicoj-dev/certidemy-supabase.git. The folder IS `supabase\` and is its own repo — no `certidemy-supabase` folder exists. Functions in `functions\<name>\index.ts`; migrations in `migrations\NNN_*.sql`; generators + `.env` in `scripts\`. Commit inside `supabase\`; deploy functions from the PARENT.

**Migrations are editor-first.** A committed `.sql` does NOT touch the live DB —
there is no runner. Paste the SQL into the **Supabase dashboard SQL Editor and run
it**; the committed file is only the versioned record. `auth.uid()` is NULL in that
editor (postgres role); `set role anon/authenticated` has quirks (a column denial
reports at table granularity — that's expected). DB ref `pctynukndxnmnxiqpgck`.
Cert UUIDs: **SM-AI-I `11111111-…`**, **SPO-AI-I `33333333-…`**, GAIPC
`22222222-…` (unpublished stub). Latest migration: **060**; next is 061.

---

## 2. WHAT CHANGED THIS SESSION (the security/visibility arc — NEW in v1.5)

**The finding (closed).** `quiz_questions` had a permissive `USING(true)` SELECT
policy for `public` AND raw table-level SELECT grants to anon+authenticated — so the
whole **secure exam pool and every `correct_answer` were anon-readable**. The
secure/practice firewall existed only in app convention, with no DB teeth.
Launch-blocking. Pre-launch, zero real candidates → remediation, not breach.

**The model (Juan's design — keep it).** A `visibility` column on `quiz_questions`,
default-deny:
- `'secure'` → **no client role** (service role / future LMS-tier credential only).
- `'private'` → authenticated only (practice / learning engine).
- `'public'` → anyone, incl. anon (the marketing samples).
`visibility` is separate from `pool` (pool = what kind of item; visibility = who may
see it). `correct_answer` is **server-only always** — column-revoked from all client
roles, served to the browser only through the gated sample rpc.

**Three migrations (applied, verified, committed, pushed):**
- **058** `058_quiz_questions_visibility_lockdown.sql` — adds `visibility`
  (NOT NULL, default `'secure'`, CHECK, index); backfills secure→secure /
  practice→private; drops the permissive policy + table grants; **column-scoped
  GRANT SELECT on all columns EXCEPT `correct_answer`** (NOT a table grant — a table
  grant re-confers the key; this was a real bug caught and fixed mid-session); two
  policies `quiz public read` (public→anon+auth) and `quiz private read`
  (public/private→auth). Admin write untouched.
- **059** `059_publish_sample_questions.sql` — flips **12 hand-picked practice
  question-groups** (3 AI-Era + 3 core per cert, all 3 langs, ≈36 rows) to
  `visibility='public'`. Chosen via the same AI-Era task detection that drives the
  blueprint badge. Stays `pool='practice'`; reversible.
- **060** `060_get_public_samples_fn.sql` — `get_public_samples(p_code, p_lang)`
  `SECURITY DEFINER` rpc returning **public rows only**, incl. `correct_answer`
  (the card reveals it on click) + **derived `is_ai_era`** + concept slugs. Gated to
  `visibility='public'` by construction → can never leak secure/private answers. The
  table-wide answer-key revoke stays intact; this rpc is the ONLY route any answer
  reaches the browser, for exactly the 12 demo items. EXECUTE to anon+authenticated.

**Verification (all passed):** after 058 — anon 0 rows, auth sees 0 secure / 2855
private, `correct_answer` denied to clients, live quizzes still work (engine =
service role). After 059 — SM 6/6/6, SPO 6/6/6, anon sees only `public|36`. After
060 — `get_public_samples('SM-AI-I','en')` = 6 (3 AI), anon `('SPO-AI-I','es-419')`
= items 6/ai 3, direct `correct_answer` still denied. Full evidence in the memo.

**The marketing samples feature (delivered by the same change).**
`components/marketing/sample-questions.tsx` was a hardcoded English-only array
(that's why language switch never changed the questions). Rewritten DB-driven: client
component, keeps its `{ certCode }` prop, uses `useLocale()`, calls
`get_public_samples` (locale, with en fallback), renders real items + grades on click
+ `↻ new questions` cycle (one AI-Era + one core), AI-Era badge **derived** from the
rpc flag. **Both call sites unchanged** (cert detail page = server, transparency-
section = client; the component self-fetches so neither needed editing). Build green,
pushed. **Confirmed live: questions now switch language.**

**Everything from v1.4 still stands:** both certs' secure + practice pools cue-clean
(mid-30s strictly-longest, ~25% positions, 0 letter refs; `ITEM-CUE-REMEDIATION-
REPORT.md` committed); per-cert silo dashboard; cert-scoped mastery; both generators
+ the shared `item-cue-guard.mjs` (KEY_LEN_MARGIN 6); `wire-lessons.mjs`; scheme
docs; the read-only lesson differ `scripts/ingest/diff-lessons.ts`; trilingual exam
end-to-end; voucher-gated cert exam; public verify; cert PDF; dark console.

---

## 3. KNOWN GAPS / DEBT (none launch-blocking)

- **NEW — Blueprint / JTA is English-only everywhere.** `domains` and `tasks` have
  **no `language` column**; `loadBlueprint` (`lib/blueprint/data.ts`) is
  locale-agnostic. So the JTA (domain titles + task statements) renders in English on
  BOTH the in-app Blueprint screen AND the marketing cert-detail drawer, even under
  es-419/pt-BR. (Lessons, practice, exam, chrome ARE localized — which is why the app
  *feels* translated.) Fix = bounded content+schema+loader project: add a `language`
  dimension to `domains`/`tasks` (or a sibling table), generate es-419 + pt-BR for
  ~10 domain titles + ~95 task statements (Scrum proper nouns untranslated), teach
  `loadBlueprint` to take a locale with EN fallback. **Bundle with the SPO trilingual
  lesson pass** — same shape of work. Not a security issue.
- **SM-AI-I stale lesson frontmatter** — 6 re-homed AI lessons still carry old `6.x`
  task codes / `SMPC` / `ai-augmented-teams` slugs in `content_md` frontmatter. The
  running system is correct (DB + join rows execute); the authoring source disagrees.
  Good warm-up before SD-AI-I (exercises `wire-lessons.mjs`).
- **Practice ≥10-per-lesson floor** — re-measure after the floor-10/task regen.
- **SPO-AI-I trilingual LESSON pass** — es-419 + pt-BR lesson rows are the real
  content gap (practice + exam already trilingual). Pair with blueprint-i18n above.
- **Live SPO-AI-I `mode='exam'`** — mint a SPO test voucher, run one real exam,
  confirm it assembles + scores + mints a `SPO-AI-I-XXXX-XXXX` credential.
- **Breadcrumb sweep** to `/learn/${cert}/dashboard` (blueprint/module/tutor pages +
  module-catalog, quiz-player, mock-exam still hit `/dashboard`).
- **`pool='practice'` hardening** in `fetchConceptPractice` (belt-and-suspenders).
- **Cross-cert mastery leak audit**; **SM pass-mark doc** reconcile (DB 80/80);
  **WCAG 2.2 AA** (design-in-now); **QTI 3** alignment (model ~80% there, serializer
  later); Credly; Framer Motion sprint; `/welcome` interstitial; admin company
  drill-down.
- **REFERENCE v1.5** — the stable manual still reads v1.4; a refresh to add the
  visibility model + the new files is pending (this handoff carries the delta).

---

## 4. RECOMMENDED NEXT

1. **REFERENCE v1.5 refresh** (fold in §2 + §3 so the stable manual is current), OR
2. **SD-AI-I (cert #3)** — the strategic prize; built on the now-proven pipeline +
   projection rule + AI-Era derivation + visibility model as templates. Needs the
   Scrum Developer JTA / source material. Optional warm-up: the SM frontmatter fix.
3. **Blueprint-i18n + SPO trilingual lesson pass** — the bundled i18n content
   project, when you want to close the localization gap.

---

## 5. WORKING RULES (full list in REFERENCE §5)

1. Never edit a file without seeing its current contents first.
2. Always hand Juan the exact copy-paste command. Querying repo/DB layout is Claude's
   job, not Juan's recall.
3. COMPLETE drop-in files via download; Juan moves from `Downloads`.
4. `npm run build` before every web push.
5. Migrations editor-first; idempotent; sequentially numbered (next = 061).
6. **Secure firewall (sacred), now DB-enforced:** secure items get no
   `question_concepts`; `visibility` default-deny is the DB teeth; `correct_answer`
   server-only; the gated `get_public_samples` rpc is the only browser answer route
   and only for public rows.
7. **Derive, don't store** (AI-Era flag, sample badges) — drift-proof.
8. Service role bypasses RLS → grading/generation unaffected by client lockdowns.
9. Scrum proper nouns + brand names never translated. Console dark; learner/marketing
   light. One PowerShell block per batch. LF→CRLF warnings harmless. Be decisive.
10. **Honesty is the brand.** Where something is provisional (cut score, SME
    validation, blueprint/lesson localization), say so — that honesty is what makes
    the rest credible.
