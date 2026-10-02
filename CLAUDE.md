# Certidemy — supabase

Postgres migrations and Deno edge functions for Certidemy, an ISO/IEC 17024-aligned certification
platform issuing Open Badges 3.0 credentials.

> **THE REASONS ARE IN `docs/CLAUDE-HISTORY.md`** — 390k chars, ~620 rule paragraphs with their
> measurements; `[H:x]` names the section. **Read it before arguing with a rule here**: nearly every one
> exists because an instrument reported success while being wrong. `docs/CLAUDE-METHOD.md` holds 103
> method rules; `docs/CLAUDE-RULE-MAP.md` maps every rule to its home.

## 1. Layout

| | |
|---|---|
| this folder | `supabase/` — commit functions from **inside** it: `functions/<name>/index.ts` |
| deploy from | the **parent** dir (`../`); the CLI expects `supabase/` beneath the cwd |
| project ref | `pctynukndxnmnxiqpgck` |
| sibling repos | `../certidemy-web` (Next.js/Cloudflare, own CLAUDE.md); `certidemy-credentials` (Worker) |
| `migrations/` | record of what ran. **Not a buildable sequence** |
| `functions/` | Deno edge functions; `_shared/` is the shared half |
| `scripts/` | Node ESM; conventions differ per script |
| licensed PDFs | `iso-corpus/` (outside repo), `sources/incoming/` (inside, gitignored) |

## 2. Standing rules `[H:working style]`

1. **Juan pushes. Never push.**
2. **You run every build** (§3).
3. **Never print a key.**
4. Don't make the MCP worker worse.
5. Name `status`, `visibility`, `is_exam_scope` on every item write, then read the row back.
6. Licensed text stays gitignored — enforced by content (`check-licensed-text`), not by name.
7. Commit messages go through the file tool.
8. End every report with the deploy table.

## 2b. Write less

- **Code comments: 3 lines max.** What and why, not how it was found.
- **Commit messages: 10 lines max.** What changed, the counts, what's next.
- **Reports: one screen.** Counts table, then decisions needed, then the deploy table.
- **A mistake you fixed gets ONE line**: what it was, what now prevents it.
- **No new standalone `.md`** unless a prompt asks. Use the handoff.
- **Don't re-explain a rule that is already here. Cite it.**

## 3. Build, deploy, push `[H:build rule]`

Juan runs only `git push`, `supabase functions deploy <name> --dns-resolver https`, and SQL in the editor.

- Web commit ready-to-push ⇒ `npm run build` in `certidemy-web` first (runs `i18n:check`, then `next build`).
- Changed edge function ⇒ `deno check --node-modules-dir=auto functions/<name>/index.ts`. Two
  fontkit/QRCode import errors are pre-existing in anything importing `_shared/certificate.ts`.
- Fix and re-run until green. Never hand Juan a build to run.
- `git status --short` before every commit. Build and commit are separate steps.
- `npm run cf:deploy` does NOT deploy certidemy.com; CI builds from `origin/main`.
- `x-certidemy-build` is the only thing that answers which commit is serving.

**Deploy table:** per repo — local HEAD / `origin/main` / live `x-certidemy-build` / **build green at HEAD
(yes-no + when)** / functions changed since last deploy.

## 4. Migrations `[H:Migrations]`

**Run the probe. There is no migration number in this file.**

```
node --dns-result-order=ipv4first scripts/check-migration-state.mjs
```

Next free number from the folder; has-it-run from the DB and the deployed function. Fingerprint a new
migration in the same commit; no fingerprint reports "no probe", not "not run".

- Never describe schema from the folder. Ask `pg_catalog`: `pg_constraint`, `pg_attribute`, `pg_proc.prosrc`.
- Base schema is not in this repo; replay from zero never worked. **Never `supabase db reset`.**
- Editor-first: SQL runs in the browser editor first; the file records what already ran.
- ASCII only (CERT-SCHEMA-GUIDE §8). Accented content goes through an API loader.
- One statement at a time when handing SQL to a human, each block independently copyable.
- Keep single-quoted plpgsql strings short; split across `message` / `detail` / `hint`.
- If the human edits the SQL, the file records THEIR version — read back `pg_proc.prosrc`, md5 CRs stripped.
- `cron.schedule` is not transactional: outside `begin/commit`, commented, run separately.
- A migration that must be atomic is ONE statement — one `DO` block, state in a variable, never a temp table.
- A NOT NULL column must NAME EVERY WRITER in its header: grep `from("<table>")` in **both** repos, state
  per site whether it writes the column, name the rare path nothing exercises.
- BEFORE INSERT triggers fire ahead of the constraint, so the error may not be `23502`.

**Post-conditions.**

- Name a property, not a count.
- Assert BOTH directions — the columns that must stay ungranted, the rows a backfill must not touch.
- An assertion about a count must not contain a count: capture before, compare after, assert unchanged.
- Strongest form is a checksum of rows the migration may not change; a count passes on a swap.
- A post-condition guards a WRITE; a check script watches a PROPERTY (`scripts/sql/check-*.sql`).
- A post-condition sees its own writes; a query after an abort sees none.
- Emit the offending set via `string_agg`, not its cardinality.
- A grant migration enumerates every role that held the privilege, derived from the outgoing grant list.
- Never propose a destructive statement to verify a privilege hypothesis; the check IS the damage.

## 5. Database rules `[H:database rules]`

- A dropped read must not become an answer. `READ-FAILURE-AUDIT.md` — **read §4–§5 before "fixing" a site.**
- RLS is not a grant: RLS+no grant = closed; grant+no policies = open.
- Column-scoped `GRANT SELECT` must list columns; table-wide overrides a column-level revoke.
- `security_invoker` is stored as `on`, not `true`.
- PostgREST types to-one embeds as ARRAYS unless FK uniqueness is provable. Use `firstOf()`.
- Keep every PostgREST select one unbroken literal; concatenation gives `GenericStringError`.
- `count(*)` / `row_number()` return bigint and `JSON.stringify` throws. Cast `::int` at the source.
- Translation tables, two conventions: `module_/domain_/task_translations` → `language`;
  `certification_i18n`, `cert_categories_i18n` → **`lang`**. `concepts` has neither.
- The `mcp` schema is not PostgREST-exposed; reach it via base tables or a declared RPC.
- A group by over a nullable key buckets every NULL together.
- `count(*) filter (...)` over a LEFT JOIN counts the unmatched left rows.
- Mojibake detection is blunt SQL: `content_md like '%â€%'`.

**Privileges.**

- Every privilege assertion uses `has_*_privilege`, passed the OID; `aclexplode` misses `pg_read_all_data`.
- Never build an identifier inside a WHERE clause.
- A view's grant list must not be wider than the function it calls — `sql/check-view-function-grant-gap.sql`.
- A SECURITY INVOKER function is only as reachable as everything its body touches.
- Report EXECUTE as the hard gap, SECURITY INVOKER separately as an advisory.
- A role filter in a privilege check is a coverage gap that reports clean. Report HARD GAP and INERT apart.
- Never grant `USAGE ON SCHEMA public` to `mcp_reader`; use thin `mcp.` wrappers that delegate.

**Reads that feed a number.** An unpaged PostgREST read is a FLOOR: the cap is 1,000 rows at HTTP 200.
`Prefer: count=exact`, terminate on REACHING THE TOTAL, throw on mismatch. Copy `_pg.mjs`
(`getAll` / `countWhere`); to count, never fetch rows. `[8 more in METHOD]`

## 6. Edge functions `[H:Edge functions]`

- `verify_jwt` must be pinned in `config.toml` for every public function; a redeploy drops a CLI flag.
- `config.toml` is applied for `[functions.*]` and nothing else.
- **Never run `supabase config push`** — no dry run. Change auth in the dashboard, then re-read the file.
- Three Management API fields are polarity-inverted: `disable_signup`, `mailer_autoconfirm`, `sms_autoconfirm`.
- Annotate `Uint8Array<ArrayBuffer>` on helpers returning bytes for `crypto.subtle` (TS2769).
- Use `arrayBuffer()`, never `.text()`, in any pass-through proxy.
- Set `autoRefreshToken: false` on service-role clients in scripts.
- A pair inside ONE repo shares a module; reserve mirrored-pair discipline for what spans two repos.
- `check-cross-repo-vocabulary` compares both repos' shared word lists; it reads SOURCE, not behaviour.
- `contractVersion` is the MINIMUM version whose validator accepts the payload. Evolution is additive-only.
- A required field is a breaking change even though adding a field looks additive.
- One supported version per tool unless declared in `BRANCHES_ON_CONTRACT_VERSION` (empty).
- A view change that multiplies rows deploys WITH its readers; view-first is wrong answers at HTTP 200.
- Grep `from mcp.` before changing any view; the resource map enumerates resources, not call sites.
- Five rules on probing a live surface are in `docs/CLAUDE-METHOD.md` § Probing a live surface.
- Pooler bound is live isolates × 2; an evicted isolate's connections linger ~100s.

## 7. Credential identity — immovable `[H:credential identity]`

Identifiers inside signed documents live on `credentials.certidemy.com`, nested under the issuer slug:

```
/credentials/[code]   /issuers/[slug]   /issuers/[slug]/achievements/[code]   /issuers/[slug]/status/[N]
```

`certidemy.com` serves the same bytes at the shorter **unnested** paths (`/issuer`, `/achievements/[code]`,
`/credentials/[code]`, `/status/[N]`) by proxying `open-badge`. **Unnested paths exist ONLY there.**

- Read the URLs OUT OF THE SIGNED DOCUMENT and resolve those: `id`, `issuer.id`,
  `credentialSubject.achievement.id`, `credentialStatus.id`, `credentialStatus.statusListCredential`.
- **These URLs can never move.** `open-badge`'s parameter is `doc`, defaulting to `issuer`.
- No frozen copy of an achievement exists; an edit reaches every credential already issued.
- Renderer change → `DOC_VERSION` → `material_updated_at` → anchor rebuild. Four move together.
- Byte-hash `SM-AI-I-ZZMV-JPC8` before and after any `open-badge` deploy:
  `366981ac5a547b6c7aa943f66eecd3c8f75ccf5078bdc30b594f4784a109a796`.
- Grep BOTH repos for readers before changing a credential document's shape.

## 8. Email `[H:Email]`

Migration 243: `email_queue`, `email_suppressions`, `claim_email_sends`, `complete_email_send`,
`enqueue_email`, `record_email_event`. `dispatch-emails` sends via Resend on a one-minute pg_cron;
`resend-webhook` ingests Svix-signed events.

- Templates live in `_shared/email-templates.ts`, in git, not the database.
- `render()` is pure over `(key, locale, payload)` and must not read the database.
- Suppression is checked inside `claim_email_sends`, at send time, not at enqueue.
- Only a HARD bounce suppresses.
- The `from` display name carries the ISSUER's name (§11).
- Nothing calls `enqueue_email` yet; wiring belongs in SQL, not in TypeScript after the mint.

## 9. Partner onboarding `[H:partner onboarding]`

- Two verification methods (250): `'domain'` requires `verification_domain`, `'attested'` requires it NULL.
  Acquiring a domain means re-verifying through it, in one statement.
- `verification_method` is displayed NOWHERE, and that is the decision. A gate, not a claim.
- MIRRORED PAIR, OUT OF STEP: `create-partner-issuer` refuses `certidemy.com` **and `certiglobal.org`**
  and allows absence; web `create-issuer-modal.tsx` is narrower on both. **The function is the real gate.**
- `create_company_with_admin()` (245) does all four writes atomically and grants membership immediately
  when a profile exists. The `profiles` trigger handles invite-first.
- Both paths use `on conflict (company_id, user_id) do update set role`.
- "Already signed up" is the normal case, not the edge case.
- `company_invites.role` has a CHECK against `team_role`.
- `on_profile_created_claim_vouchers` and `on_auth_user_created` exist only in the live database.

## 10. Issuing `[H:Issuing]`

- One mint, two callers: `_shared/issue.ts` owns resolution, dates, the insert with its 5-attempt `23505`
  retry, and the webhook queue. `issue-partner-credential` (API key) and `issue-credential-console`
  (JWT + `requireIssuerAccess`) are thin callers. **No second copy of the mint.**
- A THIRD mint exists and is not shared: `score-mock-exam`; `mint-missing-credentials` is a fourth.
  Known debt, deliberately deferred. Not to be done under time pressure.
- `credentials` gains a column → FIVE inserts change: `_shared/issue.ts`, `score-mock-exam`,
  `mint-missing-credentials`, **`../certidemy-web/scripts/mint-specimens.mjs`**, any backfill.
  Grep `from("credentials")` in both repos. `issue-credential-batch` is correctly NOT on the list.
- Audit rows are deliberately not shared: `issuer_api_requests` cannot represent a JWT caller,
  `admin_actions` cannot represent a machine.
- `issue-credential-console` takes `issuer_id` from the body. `requireIssuerAccess` is the only thing
  between a learner JWT and minting under another organisation's signature. **Never bypass it.**
- Open decision: the `credential.issued` payload carries `recipient_email` / `recipient_name`.

## 11. The claims discipline `[H:claims]`

- The platform must never assert something the issuer did not. Certidemy appears only as infrastructure.
- Never state an exam score outside the holder's own surfaces.
- ESCO auto-matching was tried and failed. A human picks. **Do not try it again.**

## 12. Generated items `[H:generated items]`

> Generated items are practice, reviewed by architecture. The examination bank is authored and reviewed by people.

- `generate-mock-exam` excludes `item_origin = 'generated'` on both modes; on `exam` it changes nothing
  today, because a guarantee resting on a second column staying true is not a guarantee.
- The simulator is a PROXY for the examination and inherits its evidentiary bar.
  `certidemy-web/lib/console/readiness.ts` is a progress signal and does not; generated items reach it
  through `user_concept_mastery`, by design, and that stays.
- Next surface showing a number against `passing_score_pct`: proxy, or progress report?

## 13. The item pipeline and its gates `[H:grounded generator]`

> **An item is only as true as the passage it can point to, and the pointing is checked by code, not a
> model.** The model may write the item. It may not decide the item is supported.

`gen-grounded-items.mjs` is a NEW path beside `gen-cert-secure.mjs`, untouched. Six code gates
(`lib/grounded-gates.mjs`, no model) plus a blind solver (`lib/blind-solver.mjs`). Survivors land
`status='draft'`, **never approved**.

| gate | rule |
|---|---|
| `gateClauseExists` | address resolves; **`pass: null`** where the library DECLARES it missing — not cleared, not blamed |
| `gateVerbatim` | the anchor is quoted verbatim from a held passage |
| `gateAnchorIsPrimary` | **the anchor is a primary passage of the TASK**, not merely a real clause |
| `gateQuoteNoise` | the quoted span carries no extraction furniture |
| modal fidelity | the claim is read from the **key and explanation**, never the stem or distractors |
| `gateNearDuplicate` | similarity **relative to the shorter stem's** distinctive terms, floor two |

- The solver is blind by allowlist and the blindness is asserted: no key, explanation or context.
  `assertBlind` walks PROPERTY NAMES against an allowlist; VALUES compare against the item's own text.
- A leak is loud and per item, not fatal to the run.
- The solver's failure is structural: recall vs the director's read of 40 was solver 5–7 of 14,
  **anchor-or-flag 7 of 14**.
- The item's claim needs a deontic VERB; the anchor's force needs a modal VERB. A noun never counts.
- A lettered sub-item inherits its list's modal, found upstream IN THE PASSAGE, only when the anchor
  BEGINS a list item. A full stop inside a list item does not close the list. 42001 uses em dashes.
- A definition imposes nothing whatever its notes contain: `informative` by POSITION.
- The five-word anchor floor is on the KEY only; distractors stay verbatim.
- Odd-one-out fires on the first CONTENT word. `not only` / `not just` / `not limited to` are WIDENERS.
- `gateNearDuplicate` compares STEMS; same answer with a different stem is invisible to it.
- Reproduction in served fields: stem and options at most a 9-word run shared with any source;
  explanation 9 unquoted plus ONE attributed quotation; `key_support` exempt. The reason is QUALITY.
- Cue flags: a length cue outside 60–160% of the median distractor. Odd-one-out by category is NOT a
  code gate — a lexical version fired 23/192 and missed its own case.
- One implementation: runs come from `lib/leak-score.mjs`; the quotation allowance is a MODE, not a copy.
  The index is wider than the task map, deliberately.
- A word list carries a SUBJECT; an unrecognised certification gets **no** rules, not all of them.
- A lookup by name states its mode: `@definition:` / `@title:` / `@text:`.
- Range expansion asks the library. A range expanding to NOTHING is an error, not an empty list.
- A container is its own state in the map (`A.6`'s children are held, the heading has no row).
- The passage key is `(source, edition, clause)` — `lib/passage-key.mjs`, 10 controls. 42001 3.4 and
  17021-1 3.4 must differ; a missing component must not collapse two passages.
- "Not among the passages I gave you" is not "a source we do not hold."
- Re-gating old items against a changed library is an unattributable delta. Generate afresh.
- Persist raw writer output BEFORE any gate runs (`*-raw.json`, ungated); `--from` re-gates free. A dry
  run of a generator is a SAMPLE, not a preview; the grounded path persists first.
- The gates are necessary, not sufficient; a contested distractor needs an SME.
- An options-only cue is not fixed by a harder exam; **rewrite the cue out.** Difficulty is the cut score.

## 14. The source library `[H:source library]`

`extract-source-passages.mjs` → `SOURCE-PASSAGES.json` (gitignored, licensed); migration 375 is the
table, service_role only; 2,386 passages / 14 (source, edition) pairs; `check-library-completeness`
audits it. **The 23 extractor rules are in `docs/CLAUDE-METHOD.md` § Source extraction.** The three
facts, as against method:

- **Never fill 27001's missing Annex A controls from 27002** — *should* against *shall*.
- **One shared locator, `lib/iso-locator.mjs`**; a new one inherits its defences or says why not.
- **The leak index is ENGLISH-ONLY**: a score of 0 means "no reproduction of the INDEXED documents".
  `CITATION_SOURCES` is still three; widening it is a content decision.

## 15. Scripts `[H:Scripts]`

Node ESM under `scripts/`. **Conventions differ between them — read before running.**

- `node --dns-result-order=ipv4first scripts/<x>.mjs` — `db.<ref>.supabase.co` is AAAA-only and undici
  does not fall back; the 10s timeout reads as the host being down while `curl` succeeds.
- The pooler `aws-0-<region>.pooler.supabase.com` has A records and wants `<role>.<ref>`; a dedicated
  pooler and a direct connection want the bare role.
- `supabase <cmd> --dns-resolver https` — a GLOBAL CLI flag, and NOT the Node one.
- Every Supabase API call needs BOTH `apikey` and `Authorization`, same value. One-off `curl` drops it.
- `lib/fn-auth.mjs`'s retry is OPT-IN, default OFF; its callers are WRITES.

**Two flag conventions — opposites.**

| family | flag | default | which |
|---|---|---|---|
| opt into SAFETY | `--dry` | **LIVE** | `load-lessons-direct`, `update-lesson-content`, `translate-lessons`, `load-aims-ia-*`, `fix-mojibake`, `build-credential-anchor` |
| opt into WRITING | `--apply` | **dry** | ~190 — every `apply-*`, `fix-*`, `gen-*`, `pin-*` |
| env | `DRY_RUN=1/0` | varies | `gen-cert-secure`, `backfill-practice`, `wire-lessons` |

- Inferring from `--dry` that "without it nothing happens" is backwards for the first family.
- A script must ABORT on an unrecognised flag (exit 2, naming both conventions).
- New scripts take `--apply`, dry by default.

**Main scripts.**

| script | what it does |
|---|---|
| `check-migration-state` | next free number; has-it-run from DB + deployed function |
| `verify-invariants` | the invariant suite; pass / **vacuous** / fail with examined counts |
| `verify-cert` | conformance gate, 56–59 checks/cert. **Run from anywhere.** Twelve certs pass with 2–6 WARNs; **ZZ-TEST-I fails, expected** |
| `check-licensed-text` | tracked files vs library text. Baseline 285 — may shrink, never grow |
| `check-control-bytes` | invariant 10; tracked **plus** `--others --exclude-standard` |
| `check-model-refusals` | invariant 11; operator-directed second person, 3 languages |
| `check-hash-writers` | invariant 7; **only the generator may WRITE a hash column** |
| `check-cross-repo-vocabulary` | the word lists both repos send each other |
| `audit-unpaged-reads` | classifies every PostgREST read literal in `scripts/` |
| `check-open-items` | the open backlogs, including MCP scan state |
| `check-library-completeness` | declared population per source vs what is held |
| `scan-iso-leaks` | lesson-body leak scan. **Needs `pdftotext` on PATH** |
| `verify-citations` | clause refs vs held PDFs. READ-ONLY. **EXISTENCE, never MEANING** |
| `verify-claims` | every negative claim carries a POSITIVE CONTROL |
| `smoke-paywall` | runs as a STRANGER; a control proves the endpoint still serves |
| `smoke-analyzer-access` | the only script creating identities; grants expire in 15 min |
| `deploy-courseware-read` | typecheck → reachability gate → deploy → smoke; prints the ROLLBACK |
| `gen-grounded-items` | the grounded item path (§13) |
| `extract-source-passages` | builds the source library (§14) |
| `lti-mint-key` | mints the platform RSA-2048 key; RFC 7638 `kid`; refuses if a non-retired key exists. **Pair with `functions/lti-mint-tool-key`** |
| `verify-367` | net-zero, NOT read-only. Writes a recovery file first; refuses if one exists |
| `propose-match-terms` | `match_terms` is deliberately EMPTY — read `MATCH-TERMS-DECISION.md` |
| `analyze-local` | **DEAD since 2026-09-01.** Do NOT re-derive its baseline from the engine |

**`pdftotext` here is Xpdf, not poppler** — v4.00, no `-bbox`/`-tsv`/`-xml`/`-html`; run
`check-pdftotext-options` before using a flag. Coordinates come from `pdfplumber`, which reads zero
pages of `iso-iec-42001-2023.pdf` where **`pypdfium2` reads all 62**.

**The MCP scan is fail-closed and silent.** `trg_lessons_clear_mcp_servable` nulls `mcp_scanned_at` and
sets `mcp_servable = false` on ANY `content_md` change, so every lesson-body edit withholds it until
`scan-iso-leaks` runs again.

- `mcp_scanned_at IS NULL` is UNSCANNED; `mcp_servable = false` with a timestamp is REFUSED.
- Do not probe `mcp_servable IS NULL` — NOT NULL DEFAULT false, so it can never fire.
- `mcp_servable` is not the gate. Ask `lesson_body_is_servable()`.

## 16. Instrument discipline → `docs/CLAUDE-METHOD.md` `[H:method]`

**Silent success** is this system's failure mode. 103 rules in `docs/CLAUDE-METHOD.md` — **read it before
building any check, gate, probe or report.** The ones that bite most:

- A green result carries no information unless something proves the check ran. POSITIVE CONTROL, always.
- A check passing over an empty input is VACUOUS; a coverage gap reads as a PASS; name COULD-NOT-ANSWER.
- A count is READ before reporting; two instruments disagreeing is a STOP CONDITION.
- Gates on a STORED row need `lib/stored-item.mjs`, or key-relative arms are silently skipped.

## 17. Working style `[H:Working style]`

- **Complete files or fully scripted edits.** Never snippets.
- **Read a file before editing it.** Never reconstruct from a paste or **a diff** — a diff is evidence
  about a CHANGE, not a STATE. Grep the file.
- `--dry` first, always; a dry run reporting `ok` has changed nothing.
- Validate before writing, so ABORT means nothing was written.
- A quietly altered artifact is worse than two pastes; a different subject gets its own migration.
- Don't offer menus of options. Make the call and say why.
- **Claims about the present get marked; observations dated to a moment do not.** The six rules on stale
  claims, headings and compound claims are in `docs/CLAUDE-METHOD.md`.

**Transport.**

- **`<<` is blocked by a hook** (`.claude/hooks/no-heredoc.mjs`). Use the file tool, `git commit -F`, or `<`.
- `node -e` is a heredoc wearing different clothes; it halves backslashes the same way.
- Code with a backslash is written with the FILE TOOL; a mangled escape that still parses is the worst kind.
- Anything non-ASCII crossing a shell boundary is CONSTRUCTED, never typed.
- `process.exitCode = n`, never `process.exit(n)` with open keep-alive handles.
- `shell: true` re-parses `process.execPath` and dies on `C:\Program Files`.
- A watcher is stopped by whoever starts it. Use `run_in_background`.

## 18. State

**Handoff: `HANDOFF-v13_6.md`** — bank state, rulings, pending work, open backlogs. Incidents:
`INCIDENTS.md`. Order: AIMS-F → ISMS-F → ISMS-IA → AIMS-IA → Scrum → AI-general.
