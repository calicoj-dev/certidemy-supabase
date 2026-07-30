# HANDOFF v4.1

Supersedes v4.0. Migration tip **164**, next free **165**. No new migrations this
stretch.

This is a **working handoff**: sections 4–6 carry the actual commands for the next
three items, not just descriptions of them.

---

## 1. WHAT SHIPPED SINCE v4.0

**Domain descriptions are public.** `loadBlueprint` carries `description`,
localized like titles; the certification page renders it as a native `<details>`
disclosure under each weight bar. A domain without one stays a plain card — no
arrow that opens nothing.

**Domain bars now sum to 100.** They were scaled to the largest domain, so
AIHR-I's 20/30/30/20 rendered as 67/100/100/67 under headings reading *exam
composition* and *Transparencia total*. Fixed on both the certification page and
the home transparency section. See §7.4 — this was a correctness bug, not styling.

**All 66 domain translations flipped to reviewed** (`is_provisional = false`), so
Spanish and Portuguese are live on the site and in generated documents.

**Localized 404** — `app/[locale]/[...rest]/page.tsx` catches unmatched paths and
raises `notFound()` after `setRequestLocale`. Previously every mistyped URL under
a locale threw *"No intl context found"*.

**Library modal preview.** `render-asset` returns `preview_url` (a second
signature without a download disposition) and the modal renders the PDF inline,
with an in-modal language selector. Switching language clears the generated state
— that property is load-bearing, see §7.2.

**The modal scrolls.** Capped at `92vh` as a flex column with a scrolling body, so
the footer stays reachable however tall the preview gets.

**`/console/objections`** — internal objection handling: what a buyer says, what
NOT to say back, the answer that holds, and why. Admin + marketing.

**`/console/engine` expanded** to the full briefing: build-vs-buy rationale, the
whole pipeline, item security, trilingual parity, credential provenance.

**Engine brief PDF** (`engine_brief`), per certification, trilingual, with three
vector diagrams: the chain as authoring-vs-per-sitting, the practice/secure
firewall, and the interruption timeline with the clock spanning the gap.

**"What is Certidemy?"** (`what_is_certidemy`) — the first PLATFORM-LEVEL asset.
One page, trilingual, catalogue counted live: 7 certifications, 3 programmes, 33
domains, **302 declared competence statements**, 3 languages.

---

## 2. THE THREE ITEMS AHEAD

| # | Item | Blocked by |
|---|---|---|
| A | Library tabs: certification documents vs enablement | nothing |
| B | Objections as a trilingual PDF; engine brief already is | nothing |
| C | K/S/A translated and rendered | **English editing pass** |

C is the largest and the only one with a hard prerequisite.

---

## 3. A DECISION TO TAKE FIRST

**Do the console pages get translated, or do the PDFs carry the translations?**

`/console/engine` and `/console/objections` are English. The console has been
English-only by convention (it is internal tooling). Translating them means
roughly **110 strings × 3 languages** in `messages/*.json` — mechanical, large,
and it makes every future edit a three-language edit.

**Recommended: translate the PDFs, leave the console pages English.**

- The trilingual infrastructure already exists in the renderers.
- A rep preparing for a call reads the PDF; a rep *on* a call wants Ctrl-F on a
  page, and that rep is already working in the console in English.
- Content edits stay single-language until they are published as a document,
  which is the point at which translation is worth paying for.

**If you want the pages translated too**, that is item A2 below and it is real
work — costed separately so it can be scheduled rather than discovered.

---

## 4. ITEM A — LIBRARY TABS

### A1. Split the library into two tabs

Today `/console/library` is a single cert-scoped flow with a "Platform documents"
section bolted above the language row. Two tabs instead:

- **Certification documents** — the existing picker + flow, unchanged.
- **Enablement** — platform-level assets: *What is Certidemy?*, *How the exam
  works*, *Objections*.

The tab state is local; no routing change. `LibraryFlow` already holds every piece
of machinery (`generate`, `pending`, `done`, `previewOpen`, `lang`), so both tabs
share it and only the middle of the render branches.

**Read first — the component's render root and the current platform block:**

```powershell
$f = "C:\Users\Juan\Documents\certidemy\certidemy-web\components\console\library-flow.tsx"
$c = Get-Content -LiteralPath $f
$i = ($c | Select-String -Pattern "platform documents" | Select-Object -First 1).LineNumber
"--- platform block at $i ---"
$c[($i-12)..($i+34)] | ForEach-Object -Begin { $n = $i - 11 } -Process { "$n  $_"; $n++ }
```

Then the tabs are one patch: a `tab` state, a two-button switcher, and the
existing flow wrapped in `{tab === "certs" && ( ... )}`.

**Note:** the modal currently hides the Certification row when
`pending.action.id === "what_is_certidemy"`. That test becomes a list as more
platform assets land — change it to `PLATFORM_ASSET_IDS.includes(...)` in the same
pass, or it silently shows a certification on the objections document.

### A2. (Optional) Translate the console pages

Only if §3 goes the other way. Shape of the work:

- New namespaces `console.engine` and `console.objections` in all three message
  files.
- `/console/engine`: ~50 strings. `/console/objections`: ~60 (15 objections × 4
  fields).
- Both pages become `getTranslations` consumers; the layout stays.

Do NOT start this before the PDFs exist — the PDF copy is the reviewed copy, and
translating the pages first means translating twice.

---

## 5. ITEM B — OBJECTIONS AS A TRILINGUAL PDF

### B1. The renderer

`supabase/functions/_shared/objections.ts`, mirroring `enginebrief.ts`:

- Same page furniture (A4, M=52, provenance footer, `OBJECTIONS_RENDERER_VERSION`).
- Content structure per objection: **what they say / don't say / say this / why**.
- Groups: Credibility, Exam integrity, Value and comparison, Commercial and
  practical, plus the three closing rules.

**This document is INTERNAL tier.** It must carry a visible watermark or header
band saying so, and the library must mark it `tier: "internal"` — the modal
already renders the "must not be forwarded" warning for that tier.

**Why that matters more here than anywhere else:** the page tells a rep what NOT
to say. A buyer reading our list of things we are careful not to claim draws
exactly the wrong conclusion, and unlike the comparison sheet this one would be
genuinely damaging in the wrong inbox.

### B2. Wire it as a platform asset

`what_is_certidemy` already established the pattern — the branch runs **before**
the certification lookup, and `PLATFORM_ASSETS` is a list precisely so the next
one is an array entry.

```powershell
Select-String -LiteralPath "C:\Users\Juan\Documents\certidemy\supabase\functions\render-asset\index.ts" -Pattern "PLATFORM_ASSETS", "IMPLEMENTED = \[", 'asset_type: "what_is_certidemy"' | ForEach-Object { "$($_.LineNumber)  $($_.Line.Trim().Substring(0,[Math]::Min(80,$_.Line.Trim().Length)))" }
```

The changes: import the renderer, add `"objections_brief"` to `IMPLEMENTED` **and**
to `PLATFORM_ASSETS`, add the branch beside the what-is one, add the action to the
Enablement tab with `tier: "internal"`.

### B3. Engine brief is already trilingual

No work. It is per-certification and lives on the certification record node. If it
should ALSO appear under Enablement, that is a second action pointing at the same
asset type with the currently selected certification — worth deciding rather than
assuming.

---

## 6. ITEM C — K/S/A

The largest remaining content item and the only one with a hard prerequisite.

### C1. The prerequisite: English editing pass

`tasks.knowledge`, `tasks.skills`, `tasks.abilities` — roughly **900 fields across
302 tasks**. Some still read as authoring notes rather than publication prose:

> *"Manifesto text; 4 values; 12 principles; origin (Snowbird, 2001)"*

Terse is acceptable in a JTA sheet a procurement reader expects to be dense. It is
not acceptable on a public page, and it is not worth translating into three
languages.

**Survey what is actually there before planning the pass:**

```sql
select c.code,
       count(*) as tasks,
       count(*) filter (where t.knowledge is null or t.knowledge = '') as no_knowledge,
       count(*) filter (where t.skills is null or t.skills = '') as no_skills,
       count(*) filter (where t.abilities is null or t.abilities = '') as no_abilities
from tasks t
join certifications c on c.id = t.certification_id
group by c.code
order by c.code;
```

```sql
select c.code, t.code, length(t.knowledge) as k_len
from tasks t
join certifications c on c.id = t.certification_id
where t.knowledge is not null
order by k_len desc
limit 15;
```

```sql
select c.code, t.code, t.knowledge
from tasks t
join certifications c on c.id = t.certification_id
where t.knowledge ~ '[;]' and length(t.knowledge) < 120
order by c.code, t.code
limit 25;
```

The third query is the useful one: **semicolon-separated fragments under 120
characters are the note-shaped entries.** That count tells you the real size of the
pass, rather than assuming all 900 need rewriting.

### C2. Translation

`gen-jta-translations.mjs` already has an `ONLY` scope knob (`domains` / `tasks` /
`all`). K/S/A needs a fourth scope, `ksa`, reading `tasks.knowledge|skills|
abilities` and writing the matching columns on `task_translations` (added by
migration 161, currently empty).

```powershell
Select-String -LiteralPath "C:\Users\Juan\Documents\certidemy\supabase\scripts\gen-jta-translations.mjs" -Pattern "ONLY", "knowledge", "task_translations", "is_provisional" | ForEach-Object { "$($_.LineNumber)  $($_.Line.Trim().Substring(0,[Math]::Min(90,$_.Line.Trim().Length)))" }
```

**Reuse the glossary.** The terminology fixes from the domain pass (Developers,
Done, lean, prompt, statutory, named regulatory instruments) apply identically
here, and K/S/A is where those terms are densest.

**Dry run per certification before any live run**, as with every previous
translation pass.

### C3. Rendering

Two surfaces, and the rule is the same for both: **all or nothing per language.**
A Spanish JTA omits the K/S/A section entirely rather than mixing languages. The
PDF renderer already does this — verify it still holds once the columns are
populated, because it has never been exercised with data present.

- `jta.ts` — already coded for it. Verify.
- `BlueprintDrawer` — not built. It already receives every domain and its tasks,
  so this is a rendering change rather than a data one.

**Do not put K/S/A inline on the certification page.** AIGRM-I alone is 51 tasks
and ~150 fields; that is the JTA sheet as HTML, and it belongs behind the existing
**BLUEPRINT →** link.

### C4. Verification once loaded

```sql
select language,
       count(*) as rows,
       count(*) filter (where knowledge is not null and knowledge <> '') as with_knowledge,
       count(*) filter (where is_provisional) as provisional
from task_translations
group by language
order by language;
```

```sql
select c.code, tt.language, count(*) as translated_ksa
from task_translations tt
join tasks t on t.id = tt.task_id
join certifications c on c.id = t.certification_id
where tt.knowledge is not null and tt.knowledge <> ''
group by c.code, tt.language
order by c.code, tt.language;
```

---

## 7. FINDINGS THIS STRETCH

### 7.1 Indentation counted from a paste is wrong four times out of six

Four anchors failed tonight because leading whitespace was counted from terminal
output where a line-number prefix was in the way. The two patches that worked
first time were the ones that **derived** indentation programmatically.

**Rule:** locate by distinctive content, read the indentation from the file, never
count it from a paste. `patch-library-modal-preview.mjs` and
`patch-library-platform-docs.mjs` are the reference implementations — both print
the indent they found, so a wrong span is visible before it is written.

### 7.2 A stale preview is worse than no preview

Switching language in the library modal clears `done` and `previewOpen`. Without
that, the preview shows the previous language's document under the new language's
label — and a rep sends the wrong file *convinced they checked it*. The feature
exists to protect the distracted case; getting this backwards would weaponise it.

### 7.3 `preview_url` is a second signature, not a stripped parameter

The download URL sets `Content-Disposition: attachment`, so an iframe pointed at
it downloads instead of displaying. The `download` query parameter does not affect
the signature and could be stripped client-side — rejected, because if that
implementation detail changed, previews would silently start downloading files
with nothing in any log.

### 7.4 A formula can be correct and still lie

Domain bars scaled to the largest domain, and "7 of 7" for a fully-open catalogue.
Both were arithmetically fine and both misled — the first exaggerating weights
under a transparency heading, the second reading as a bug. Neither showed up until
real data went through them.

**Where else this shape could hide:** any ratio whose denominator is derived from
the data rather than fixed, and any "X of Y" that can have X equal Y.

### 7.5 The one-pager's closing section was rewritten from negative to affirmative

v1 ended with "what we do not claim" and explained that we are not accredited.
Accurate, and wrong for a first-contact document — it argues against itself before
anyone has objected. It now reads **"Built on ISO/IEC 17024"** and states what the
structure gives you.

The full distinction still exists in the engine brief and on `/console/objections`,
which is where a buyer who actually asks gets a straight answer. **That split is
deliberate: the one-pager states the structure, the detailed documents handle the
nuance.** Do not re-add the negative to the one-pager.

### 7.6 Carried forward from v4.0, still true

- **CRLF anchors.** Git checks out CRLF; session-written files are LF. A
  multi-line anchor with `\n` silently finds zero in an untouched file. Every
  patch script detects and normalises, and prints what it detected.
- **Chrome does not overwrite downloads.** `name (1).ext` — list before every
  move.
- **`is_provisional` is row-level** but `title` and `description` are reviewed
  independently. Re-translating one marks the other unreviewed. Unresolved; see
  §8.
- **Mounting `ActiveExamBanner` is the finalisation trigger.** Not cosmetic.

---

## 8. STILL OPEN, NOT SCHEDULED

- **The `is_provisional` decision.** Either the flag splits per field, or the rule
  is written down that nothing rewrites a row without re-reviewing every field in
  it. Drifting is the only bad option.
- **Public site ignores `is_provisional`; documents respect it.** Defensible —
  a page is correctable in a minute, a PDF in an inbox is not — but currently
  accidental. Make it explicit either way.
- **`asset_downloads.certification_id`** may be NOT NULL. Platform assets log with
  null, and a failed log only warns, so platform-asset analytics could be silently
  missing. Check the column.
- **Visibility/focus telemetry and answer-change history** — needs the privacy
  policy amendment and the GDPR Article 22 process written down first (v4.0 §3.7).
- **Certificate lacks competencies and scheme version** — small renderer changes,
  the last two gaps in the demonstration credential.
- SM-AI-I task 4.12 missing from D4; *fuentes principales* has no column;
  `listCatalogGroups` never asks `cert_categories_i18n` for a label so programme
  headings render English on the public Spanish and Portuguese catalog;
  `COGNITIVE-MODEL.md` §4 holds a stale hand-typed profile table.
- `/favicon.ico` 404s on every page load.

---

## 9. OWED BY JUAN

**Exam operation:** AI and internet use during the exam — a stated policy, since
neither is prevented. And the missing middle of the fraud process: analysis flags
a pattern → *what?* → revocation. Who is told, who decides, what recourse exists.

**Level II attestation wording.** "HR proctored" is an attestation by an
interested party. Word it as *"attested as supervised by [organisation]"* before
any certificate exists in the wild.

**Counsel:** Terms §5 (refunds) and §12 (courts) are drafts; and the English-only
legal position against Colombia's Estatuto del Consumidor and Brazil's CDC.

**Design:** wordmark PNG, corrected badge codes.

**Trademark:** ™ not ®, once per page at first prominent use, and mark the codes
not the Scrum-derived names. Full guidance in `LAUNCH-READINESS.md`.

---

## 10. CONSOLE SURFACES

| Route | Who | What |
|---|---|---|
| `/console/library` | admin + marketing | Generated documents. Gains tabs in item A. |
| `/console/engine` | admin + marketing | How the examination works — internal briefing |
| `/console/objections` | admin + marketing | Objections and what to say — internal |
| `/console/exams` | platform_admin | Live examinations, pace and integrity signals |

All English. Nav entries in `app/[locale]/console/layout.tsx`, role-branched;
`/console/engine` and `/console/objections` appear in both arrays because
marketing needs them more than admin does.

---

## 11. NEXT SESSION PROMPT

> Continuing Certidemy. Read `HANDOFF-v4.1.md` in the supabase repo first — it
> supersedes v4.0.
>
> Migration tip 164, next free 165. Both repos clean.
>
> Take §3 first — it is a decision, not a task, and items A2 and B depend on it.
> Then item A (library tabs), item B (objections PDF), item C (K/S/A, starting
> with the survey queries in §6.1 before committing to the editing pass).
>
> Two rules that will save time: derive indentation programmatically rather than
> counting it from terminal output (§7.1), and list Downloads before every
> `Move-Item` because Chrome appends `(1)` rather than overwriting.
