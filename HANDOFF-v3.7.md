# HANDOFF-v3.7.md

**Previous:** HANDOFF-v3.6.md
**Migration tip:** 160 · **next free number: 161**
**Session date:** 28 July 2026 (continuation of the v3.6 session)
**Repos touched:** both

v3.6 was written mid-session and was stale within the hour. This supersedes it
for everything after the sales library page shipped.

Headline: **SALES-LIBRARY-SPEC §8 is closed.** Specimen credentials exist, are
excluded from every count, cannot verify as genuine, and render a certificate
nobody could mistake for a real one.

---

## 1. What shipped

### Specimen credentials — the full chain

Seven specimens, one per published certification, `<CODE>-SPEC-0001`, owned by a
dedicated service account (`specimen@certidemy.com`) because
`credentials.user_id` is `NOT NULL`.

Four guards, and each one closes a hole the previous one would have relocated
rather than fixed:

1. **Excluded from every aggregate.** `census.ts`, `get-governance-snapshot` and
   `list-credentials` read `v_credentials_real`. Migration 160 granted the
   service role SELECT on that view — 155 had granted only `authenticated`, and
   every consumer is an edge function. Without it the console would have
   rendered zeros while looking like a working feature.
2. **Cannot verify as genuine.** A specimen keeps `status = 'active'` so the
   certificate renders through the normal path. `verify-credential` therefore
   returns a distinct `"specimen"` effective status and `valid: false`. The
   verify page has its own state, offers the certificate download, and does
   **not** offer "Add to LinkedIn".
3. **The PDF is marked.** A solid band across the top plus a large watermark,
   both localised, both drawn last (pdf-lib paints in call order). Threaded
   through **both** `get-credential-certificate` and `regenerate-certificate` —
   the second was found by grepping every caller of `renderCertificate` rather
   than assuming.
4. **Not a person in the census.** See §2 — this one is shared with the CRM.

Wired into the library as the second working asset. `render-asset` does **not**
render it: it resolves the specimen credential and asks
`get-credential-certificate` for a signed URL, so certificate storage stays
owned by one function.

### PDF renderers

**Brand palette.** Both renderers were drawing in blue. `certificate.ts` carried
`// palette (Apple-derived, matches app tokens)` and `#0066CC` — true when
written, false since the brand moved to `#be185d`. `factsheet.ts` inherited it
deliberately, so the two documents would read as one family; they did, one
off-brand family. Accent, accent-deep, keyline, seal fill and seal inner ring
all moved. The same stale "Pro Blue" comment still sits in `globals.css:34`.

**Fonts.** Regenerated from Inter 4.1 + JetBrains Mono 2.304 with full Latin-1,
**Latin Extended-A** and symbols. The previous subset was cut for the
certificate, which deliberately never prints a score and so never needed `%` —
the moment the fact sheet drew "12.5%" it rendered a missing-glyph box, and the
text layer dropped the character silently too. Verified by regenerating a real
certificate and comparing pixel-by-pixel: **zero differing pixels**.

**Certificate cache path.** Was `{id}/certificate.pdf` — no renderer version and
no locale. Now `{id}/v{VERSION}/{locale}/certificate.pdf`, and the cache probe
signs the *computed* path rather than reading the stored `certificate_path`
column, which cannot answer the question once one credential has an object per
language.

**Fact sheet v3.** Renderer version in the cache key, weight-bar grouping fixed
(the bar sat equidistant between its own title and the next), three weighted
section anchors, localised number formatting.

### Other

- `"Proctored Run"` → `"Exam Run"` on the governance flow. There is no
  proctoring; `exam-leave-guard` is a UX guard, not invigilation. It was the
  only hand-typed claim on a page whose credibility rests on everything else
  being rendered from live data.
- `marketing` console role, and the four gates that leaked a sales seat into
  partner surfaces (see v3.6 §1).

---

## 2. Open loops

**Service accounts in the census — patch written, verify after deploy.**
`census.ts` is shared: its own header notes `sync-to-ghl` computes the identical
census in-process. So the specimen service account was not merely an extra row
on an admin page — it would have been **pushed to the CRM as a contact**, an
unconfirmed permanently-dormant one skewing every funnel figure. Filter is on
`user_metadata.service_account`, set at creation by `mint-specimens.mjs`.
**Both `list-users` and `sync-to-ghl` must be redeployed.**

**Five library assets still stubs.** Fact sheet and specimen certificate work.
Blueprint sheet, JTA sheet, samples sheet, scheme PDF and comparison sheet
render as disabled buttons with "Not built yet" — visible on purpose, so the
derivation chain stays legible.

**Two real certificates are stale in storage.** Lizeth's and the SD-AI-I one are
still blue at the old unversioned path. Regenerate them through the console
(the audited path). Objects at the old `{id}/certificate.pdf` are orphaned —
harmless in a private bucket, worth a sweep before launch.

**`fix-mojibake.mjs` has a gap.** It matches punctuation and symbol sequences but
**not `Ã`-prefixed accented characters** (`Ã³` for ó, `Ã©` for é, `Ã§` for ç).
It reported clean on files that could still carry that damage. Extend before
trusting it again.

**Fact sheet is two pages** for six-domain certs, and page 1 now ends mid-table.
A keep-together rule on section blocks would fix the break; getting to one page
means dropping a section.

**Badge codes still wrong** (design team): `SMAI-I` → `SM-AI-I`, `SPOAI-I` →
`SPO-AI-I`, `SDAI-I` → `SD-AI-I`. Also unresolved on the artwork: permanent
"2026" against 365-day validity, what "Founders" means in the handbook, no
expiry on the certificate face, and "Certificate of Achievement" being
course-completion language for a competence certification.

**Wordmark PNG pending.** Insertion point marked in `factsheet.ts` with the
exact lines. pdf-lib embeds PNG/JPG, not SVG.

**The seal is weak in magenta.** It read as a seal in blue; at `#be185d` on
`#fce7f1` it is a pale disc with a letter in it. Leave it — the design team's
badge replaces it.

**Data hygiene:** `laura atehortua giraldo` stored lowercase (certificates render
`holder_name` verbatim in display type); `SM-AI-I-I-2DUC` does not match the
`CODE-XXXX-XXXX` format; confirm AIGRM-I and AISM-I genuinely completed Stage 9.

---

## 3. Rules learned this session

**A guard must be code-shaped, never English prose.** This cost time twice:

- `patch-certificate-cache-path.mjs` guarded on
  `.createSignedUrl(path, SIGNED_URL_TTL`, which already existed further down
  the same function. The edit skipped, the probe was left calling
  `createSignedUrl(cred.certificate_path)` on a nulled column, and every
  certificate request returned `certificate generation failed`.
- `patch-specimen-asset.mjs` guarded on `marked as a specimen`, which appears in
  that file's own explanatory prose. The edit skipped and the button stayed
  disabled while the backend was fully wired.

Guard on a property name plus its literal, or distinctive punctuation. These
files are full of comments that say in English exactly what the code says.

**Every cached artifact path needs a renderer version.** Fact sheets got
`FACTSHEET_RENDERER_VERSION` after a stale object served missing-glyph boxes;
certificates then turned out to have the same defect **plus** no locale segment,
so two languages fought over one object. Anything written to storage and read
back needs the version of the code that produced it in its path.

**Terminal output is not evidence about file bytes.** PowerShell mangles UTF-8
on display. `certificate.ts` showed `certificaciÃ³n` and was perfectly fine —
proven by the rendered PDF. A byte-level script is the only reliable check, and
even then only for sequences it knows about.

**Rasterize before judging a PDF.** Reading a glyph off a screenshot produced a
wrong call about the percent sign. Render it, measure it, then say something.

**Edge functions are live on deploy; the web app is not live until pushed.**
Cloudflare builds from GitHub. Most checks this session were on functions, which
is why this only bit once.

**Corrections to v3.6:** the `security_invoker` note stands — it reads `true` on
this instance, not `on`, and the documented rule is inverted here. Verify
per-instance.

---

## 4. Start here next session

1. `git status --short` in both repos.
2. Deploy `list-users` **and** `sync-to-ghl` after the census patch; confirm
   `/console/people` drops by exactly one.
3. Regenerate Lizeth's and the SD-AI-I certificate so no blue ones remain.
4. Extend `fix-mojibake.mjs` with the `Ã`-prefixed sequences and re-sweep.
5. Next library assets in value order: blueprint sheet, then scheme PDF.

Decisions still owed are unchanged from v3.6 §5: legal entity, attempt cap, who
authorizes issuance, AI/internet policy in the exam.

Standing discipline unchanged: `--dry` first, grep to verify an edit landed,
`npm run build` green before any web push, editor-first migrations, separate
commits per repo, and verify on the live surface rather than on a script's
success message.
