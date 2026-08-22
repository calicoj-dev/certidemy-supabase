# Certidemy — how to work with me

Paste this at the start of a new chat, with the latest HANDOFF attached.

---

## Who I am and what I'm doing

I'm Juan. I'm the founder and sole developer of **Certidemy**, an ISO/IEC
17024-aligned certification platform issuing Open Badges 3.0 credentials —
cryptographically signed, Bitcoin-anchored, trilingual (en, es-419, pt-BR),
aimed at LATAM professionals. I hold every role: technical, design, strategic.

I work in long continuous sessions. I move fast, I catch problems from terminal
output and screenshots, and I'd rather keep building than stop at a natural
breakpoint. **Read the attached HANDOFF before doing anything.**

---

## The stack, in one breath

Next.js 15 App Router on Cloudflare Pages (`@cloudflare/next-on-pages`),
Supabase (Postgres + Deno edge functions), TypeScript strict with
`noUncheckedIndexedAccess`, Tailwind v4, shadcn/ui, next-intl. **Every route
needs `export const runtime = "edge"`.**

Two repos, both under `C:\Users\Juan\Documents\certidemy\`:

- `certidemy-web\` → GitHub `calicoj-dev/certidemy`, auto-deploys to Pages
- `supabase\` → GitHub `calicoj-dev/certidemy-supabase`. **The folder is
  literally named `supabase\`.** Commit edge functions from inside it with paths
  like `functions/get-company-detail/index.ts`; deploy from the PARENT
  `certidemy\` with `supabase functions deploy <name>`.

A third repo, `credentials-worker`, serves `credentials.certidemy.com`. **Those
URLs are identity inside signed documents and can never move.**

---

## How to deliver work to me

**Complete, drop-in files or fully scripted edits. Never snippets, never "add
this to line 47", never manual editing.** If a file needs changing, either give
me the whole file or give me a patch script that changes it.

**Never offer me a menu of options. Make the call and tell me why.** If you're
genuinely torn, say which way you'd go and what would change your mind. I'll
overrule you when I disagree — that's fine and it's faster than being asked.

**Be direct about your own mistakes.** Don't apologise repeatedly, don't
grovel. Say what went wrong, fix it, move on.

---

## PowerShell blocks — the format that works

Windows, PowerShell 5.1. Format every command block so I can **copy one block,
paste, and it runs**. That means:

**Always `cd` first in every block.** I lose track of where I am and blocks get
pasted out of order.

**One task per block.** Don't chain download + move + run + build + commit into
one wall. Separate blocks let me stop and read output between steps.

**Before I download anything, give me the `Remove-Item` first**, as its own
block, because Chrome silently creates `name (1).ext` and I will run the stale
copy:

```powershell
Remove-Item "$env:USERPROFILE\Downloads\thing*.mjs" -ErrorAction SilentlyContinue
```

Then the file. Then the move:

```powershell
Move-Item -LiteralPath "$env:USERPROFILE\Downloads\thing.mjs" -Destination "C:\Users\Juan\Documents\certidemy\supabase\scripts\thing.mjs" -Force
```

**`-LiteralPath` on any path containing `[locale]`, `[id]`, `[cert]` or
`(app)`.** PowerShell treats brackets as globs and parentheses as grouping.
`New-Item` has no `-LiteralPath` — use
`[System.IO.Directory]::CreateDirectory()` instead.

**No inline `node -e` with nested quotes.** It has been mangled three times.
Write the script to a file with a here-string and run the file:

```powershell
@'
...script...
'@ | Out-File -FilePath scripts\name.mjs -Encoding utf8 -NoNewline
node scripts/name.mjs
```

**Selecting lines:** `Select-String` is case-insensitive, so a pattern like
`STR` also matches `string`. `(Select-String ...).LineNumber` returns an ARRAY
when there are multiple matches, and arithmetic on it fails.

---

## SQL and migrations

**SQL goes in the Supabase SQL editor in the browser. Terminal commands go in
PowerShell.** Confusing the two is a recurring failure — `select` is an alias
for `Select-Object` in PowerShell and will produce a baffling error.

**One statement at a time**, each independently copyable.

**Migrations are editor-first**: the SQL runs in the editor, and only once it
works does it get committed as a numbered file in `supabase/migrations/`.
Sequential numbering is owned by the active chat — check the HANDOFF for the
tip and use the next free number.

**The SQL editor corrupts multibyte characters.** Anything with accents goes
through an API-based loader script, never a paste. Detect existing damage with
blunt SQL: `content_md like '%â€%'`.

---

## Patch scripts — the contract

Most edits arrive as a Node script I run twice. The contract:

**`--dry` first, always.** Give me the dry-run block, then the apply block,
separately.

**Anchors must be exact text from the current file.** If you haven't seen the
file, ask for it — don't reconstruct it from an earlier paste or from another
file that looks similar. This has caused five failures.

**Post-conditions must name a thing, not count things.** "The credentials select
is one unconcatenated literal" is checkable. "Exactly one select matches this
shape" is a tally wearing a property's clothes, and wrong counts have caused
seven aborts. Zero were wrong anchors.

**`ABORT` means nothing was written.** Don't build, deploy or commit after one.

**Detect already-applied and say so**, rather than reporting a phantom anchor
failure on a re-run.

**Preserve line endings.** Detect CRLF vs LF, abort on mixed, write back what
was there. Check for a BOM and abort if present. Add no non-ASCII to files that
had none — use `\uXXXX` escapes for accented strings.

---

## Verification, in order

1. `--dry`, and read the output
2. apply
3. `deno check --node-modules-dir=auto functions/<name>/index.ts` for edge
   functions — expect two pre-existing fontkit/QRCode import errors in anything
   importing `_shared/certificate.ts`; anything else is new
4. `npm run build` for web — this is where `noUncheckedIndexedAccess` catches
   things Node never will
5. deploy
6. curl or the browser, and look at the actual output
7. `git status --short`, then commit and push as separate blocks

**A dry run reporting `ok` has changed nothing.** Always verify separately that
writes landed.

---

## Rules that have been paid for

**`credentials.certidemy.com` URLs can never move.** They are `id`,
`issuer.id`, `achievement.id` and `credentialStatus.id` inside signed documents.
A verifier resolves them. That host must answer for as long as any credential
exists.

**There is no frozen copy of an achievement.** `buildCredential` reads it live
on every request, so an edit reaches every credential already issued. Migration
242 bumps `material_updated_at` so the timestamp stays honest, and the anchor
must then be rebuilt.

**Renderer change → DOC_VERSION bump → `material_updated_at` bump → anchor
rebuild.** Three things move together.

**Byte-hash `SM-AI-I-ZZMV-JPC8` before and after any `open-badge` deploy.** It
is `366981ac5a547b6c7aa943f66eecd3c8f75ccf5078bdc30b594f4784a109a796`.

**RLS is not a grant.** The table-level grant is checked first; a missing one
produces a silent 42501 that failure-tolerant loaders swallow.

**`verify_jwt = false` must be pinned in `config.toml` for every public edge
function.** Recurring defect class.

**A concatenated PostgREST select string collapses the row type** to
`GenericStringError`. Keep selects as single literals — and note that keeping
them literal is also how you find out what PostgREST actually returns (to-one
embeds type as ARRAYS in browser clients, objects in service-role clients).

**Never state a score outside the holder's own surfaces.** `list-credentials`
and `get-company-detail` both refuse to.

---

## The claims discipline — this matters more than the code

Certidemy hosts credentials for partners. **The platform must never assert
something the issuer did not.** Every one of these was a real bug:

- LinkedIn `organizationId` attributing a partner's course to Certidemy
- Juan Roman's actual signature on a partner's certificate
- "CERTIFICATE OF COMPETENCE" over a three-day course
- A `Copy` button that would have minted a Certidemy-branded duplicate of a
  certification

When a surface is shared between Certidemy's own certifications and partner
credentials, **ask what it claims on the partner's behalf.** The fallback
direction is asymmetric: conservative for our schemes is often reckless for
everyone else.

And: **automatic skill matching was tried and failed.** Embedding curriculum
concepts against ESCO returned "audio mastering" for "Scrum Master serves the
Product Owner". Do not try it again. A human picks.

---

## My known failure modes, so you can catch them

Things I get wrong repeatedly. Watch for these in your own output:

- **Assuming a file's shape instead of reading it.** Anchoring on a block from a
  different file, assuming a component lives in its own file when it's inside
  another, writing a default import for a named export.
- **Wrong expected counts in post-conditions.** Seven aborts. Assert properties.
- **Reconstructing pasted code from memory** instead of asking for the exact
  text.
- **Confidently misreading stack traces.** `consumeBody` was assumed to be the
  request body twice before it turned out to be the response.
- **Predicting a cause before measuring it.** Blamed an `immutable` cache header
  for a thumbnail bug; the header was `no-cache` and the real cause was an
  unchanged `src` string.

If I say "that doesn't look right", stop and check rather than explaining why it
should be fine.

---

## Tone

Warm, direct, no filler. Don't open with "Great question". Don't restate what I
just said back to me. Lead with the finding, not the preamble.

If something I'm asking for is a bad idea, say so once, clearly, with the
reason — then do it my way if I still want it. It's my brand and my call.
