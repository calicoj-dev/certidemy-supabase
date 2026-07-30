# HANDOFF v4.2

Supersedes v4.1 (written hours earlier, and **wrong about item C** — see §3).
Migration tip **165**, next free **166**. Both repos clean and pushed.

Read v4.1 for the full findings list and the open items; this document corrects
the K/S/A record and specifies the next piece of work.

---

## 1. WHAT SHIPPED SINCE v4.1

**Migration 165** — `task_translations.ksa_is_provisional`, a review flag for
knowledge/skills/abilities separate from `is_provisional`, which covers
`statement`.

This is not tidiness. Both fields live on one row, and writing a K/S/A payload
under the shared flag would have marked **302 already-reviewed task statements
unreviewed across two languages** — every generated document silently falling
back to English. That exact failure happened to domain titles on 2026-07-29 and
took a while to diagnose because nothing broke; the system was being careful
about the wrong thing.

**`ONLY=ksa` on `gen-jta-translations.mjs`.** UPDATE only, never upsert: a K/S/A
payload omits `statement`, so an upsert on a row that does not exist yet would
INSERT a null statement. Tasks with no statement row are reported and skipped.
Same rule, same reason, as `save-exam-answer`.

**604 K/S/A rows translated and reviewed** — 302 tasks × es-419 + pt-BR, across
all seven certifications. Flags flipped; live in the JTA sheet.

**Three English fixes** — authoring asides that should not reach a buyer:
`"deprecation note"`, `"(NEW emphasis in 2020)"`, `"(2020 change)"`.

**Two translation defects found and fixed:** a concatenation (`inobtenibledespués`)
and a calque (`são não confiáveis` → `não são confiáveis`).

---

## 2. THE REVIEW PROTOCOL THAT WORKED

302 tasks × 3 fields × 2 languages is too much to read. Two queries found
everything worth finding.

**Negations, because only they can invert meaning:**

```sql
select c.code, t.code, tt.language, t.abilities as english, tt.abilities as translated
from task_translations tt
join tasks t on t.id = tt.task_id
join certifications c on c.id = t.certification_id
where tt.knowledge is not null
  and t.abilities ~* '\y(no|not|never|nothing|without|cannot)\y'
order by c.code, t.code, tt.language;
```

Repeat for `knowledge`. Read English and translation side by side — a negation
that survives in one language and vanishes in the other is invisible otherwise.
All correct across 604 rows.

**Long tokens, because concatenation is the other silent failure:**

```sql
select c.code, t.code, tt.language, w.word[1] as long_token
from task_translations tt
join tasks t on t.id = tt.task_id
join certifications c on c.id = t.certification_id
cross join lateral regexp_matches(
  coalesce(tt.knowledge,'') || ' ' || coalesce(tt.skills,'') || ' ' || coalesce(tt.abilities,''),
  '[[:alpha:]]{21,}', 'g'
) as w(word)
where tt.knowledge is not null
order by length(w.word[1]) desc;
```

21+ characters: long enough that real Spanish and Portuguese words are rare,
short enough to catch two mid-length words fused.

**Use this protocol for any future translation pass.** It is cheaper than reading
and it catches the two failure modes that matter.

---

## 3. THE CORRECTION

**v4.1 §6 said K/S/A was blocked behind an editing pass of roughly 900 fields. It
was blocked behind three.**

The estimate went 900 → 85 → 3 as each query replaced a guess. Every field on
every task already had knowledge, skills and abilities. What I read as unfinished
notes was a deliberate terse house style — knowledge averages 140 characters,
skills 65, abilities 47 — and I recognised it as such only after reading the
actual rows.

The source of the error was one remembered example (`"Manifesto text; 4 values;
12 principles"`) generalised to a catalogue I had not looked at.

**The lesson is cheap to state and was expensive to skip: query before
estimating.** Three queries settled a question that had been sitting in two
handoffs as a blocking item.

---

## 4. NEXT: THE ENABLEMENT TAB

**Goal:** *How the exam works* and *Objections* generatable from the sales
library, in their own tab, in all three languages.

### 4.1 The decision from v4.1 §3 is resolved

**The PDFs carry the translations; the console pages stay English.** Asking for
these "in the sales library, translated" is asking for the document surface — the
trilingual infrastructure already lives in the renderers, and `/console/engine`
and `/console/objections` remain English quick-reference for a rep on a call.

Do not translate the console pages. Two sources of the same content in three
languages will drift, and the PDF is the one that reaches a buyer.

### 4.2 The tab

`/console/library` is one cert-scoped flow with a "Platform documents" section
bolted above the language row. Replace that with two tabs:

- **Certification documents** — the existing picker and flow, unchanged.
- **Enablement** — *What is Certidemy?*, *How the exam works*, *Objections*.

`LibraryFlow` already holds every piece of machinery (`generate`, `pending`,
`done`, `previewOpen`, `lang`), so both tabs share it and only the middle of the
render branches. Local state, no routing change.

```powershell
$f = "C:\Users\Juan\Documents\certidemy\certidemy-web\components\console\library-flow.tsx"
$c = Get-Content -LiteralPath $f
$i = ($c | Select-String -Pattern "platform documents" | Select-Object -First 1).LineNumber
"--- platform block at $i ---"
$c[($i-12)..($i+34)] | ForEach-Object -Begin { $n = $i - 11 } -Process { "$n  $_"; $n++ }
```

**One thing to change in the same pass:** the modal hides the Certification row
when `pending.action.id === "what_is_certidemy"`. That becomes a list as more
platform assets land, or the objections document will announce itself as being
about whichever certification happened to be selected.

### 4.3 How the exam works

Already exists as `engine_brief` — per certification, trilingual, three diagrams,
on the certification record node.

**Decision needed:** does it also appear under Enablement? It is genuinely
per-certification (it prints that certification's form size, pass mark, declared
vs examined tasks), so a copy under Enablement would need a certification anyway.
Leaving it on the flow and pointing at it from the Enablement tab is probably
right, but that is a judgement about how a rep looks for things.

### 4.4 Objections

Needs a renderer. `supabase/functions/_shared/objections.ts`, mirroring
`enginebrief.ts`:

- Same page furniture — A4, M=52, provenance footer, `OBJECTIONS_RENDERER_VERSION`.
- Per objection: **what they say / don't say / say this / why**.
- Groups: Credibility, Exam integrity, Value and comparison, Commercial and
  practical, plus the three closing rules.
- Content is on `/console/objections` and is reviewed — translate that, do not
  re-author it.

**INTERNAL TIER, and this matters more here than anywhere else.** The document
tells a rep what *not* to say. A buyer reading our list of things we are careful
not to claim draws precisely the wrong conclusion. It needs a visible header band
saying internal, and `tier: "internal"` in the library so the modal renders its
"must not be forwarded" warning.

Wiring follows `what_is_certidemy` exactly — the branch runs **before** the
certification lookup, and `PLATFORM_ASSETS` is a list so the next one is an array
entry:

```powershell
Select-String -LiteralPath "C:\Users\Juan\Documents\certidemy\supabase\functions\render-asset\index.ts" -Pattern "PLATFORM_ASSETS", "IMPLEMENTED = \[", 'asset_type: "what_is_certidemy"' | ForEach-Object { "$($_.LineNumber)  $($_.Line.Trim().Substring(0,[Math]::Min(80,$_.Line.Trim().Length)))" }
```

Changes: import the renderer, add `"objections_brief"` to `IMPLEMENTED` **and**
`PLATFORM_ASSETS`, add the branch beside the what-is one, add the action to the
Enablement tab with `tier: "internal"`.

### 4.5 Then: K/S/A in the BlueprintDrawer

The remaining half of item C. The drawer already receives every domain and its
tasks, so this is rendering, not data.

**All or nothing per language**, the same rule `render-asset` already enforces at
line ~704: a task whose English has knowledge but whose translation does not drops
the whole section rather than mixing languages. Never fall back to English inside
a Spanish document.

Do **not** put K/S/A inline on the certification page — AIGRM-I alone is 51 tasks
and ~150 fields. It belongs behind the existing **BLUEPRINT →** link.

---

## 5. CARRIED FORWARD

Everything in v4.1 §7 and §8 still stands. The four that will bite soonest:

- **Derive indentation programmatically.** Four anchors failed in one session
  from counting leading spaces in terminal output where a line-number prefix was
  in the way. `patch-library-modal-preview.mjs` is the reference: locate by
  distinctive content, read the indent from the file, print what you found.
- **CRLF.** Git checks out CRLF; session-written files are LF. A multi-line
  anchor with `\n` silently finds zero in an untouched file. Detect and normalise.
- **List Downloads before every `Move-Item`.** Chrome appends `(1)`.
- **`is_provisional` on `domain_translations` is still row-level**, with `title`
  and `description` reviewed independently. `task_translations` was split by
  migration 165; the domain table was not, because nothing queued would rewrite
  one without the other. Split it or write the rule down.

---

## 6. NEXT SESSION PROMPT

> Continuing Certidemy. Read `HANDOFF-v4.2.md` in the supabase repo first — it
> supersedes v4.1, which is wrong about K/S/A being blocked. v4.1 still has the
> full findings and open-items list.
>
> Migration tip 165, next free 166. Both repos clean.
>
> **The work:** put *How the exam works* and *Objections* in the sales library
> under their own Enablement tab, in all three languages.
>
> - §4.2 — split `/console/library` into Certification documents / Enablement
>   tabs. `LibraryFlow` already has all the machinery.
> - §4.4 — build `_shared/objections.ts` (trilingual, INTERNAL tier, translate
>   the reviewed content on `/console/objections`, do not re-author it) and wire
>   `objections_brief` following the `what_is_certidemy` pattern exactly.
> - §4.3 — decide whether `engine_brief` also appears under Enablement or stays
>   on the certification flow. It prints per-certification numbers, so it needs a
>   certification either way.
> - §4.5 — then K/S/A in the BlueprintDrawer, all-or-nothing per language.
>
> **Two rules that will save time:** derive indentation programmatically rather
> than counting it from terminal output, and detect line endings before matching
> multi-line anchors. Both cost multiple failed patches last session.
>
> **And one habit:** query before estimating. The K/S/A editing pass was carried
> in two handoffs as a large blocking item and turned out to be three rows.
