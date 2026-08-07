# HANDOFF-v5.6-addendum — after the checkpoint

**Session date:** 2026-08-06 (same session, continuing past `698d6a6`)
**Reads with:** `HANDOFF-v5_6.md`. That file is a checkpoint; this is everything after it.
**Migration tip:** **179 applied** · next free **180**
**Repos:** both clean and pushed
**Commits:** `4d6714a` · `194074d` · `20551fe` (supabase) · `b0cb7de` · `7c31e4c` · `3bf527c` · `c9a2946` · `5abe3b1` · `5967061` · `46d51f3` (web)

The checkpoint said the remaining AIMS-F work was three small items. It was six,
because three of them were invisible. This addendum is mostly about **why they
were invisible**, and the tool built so the tenth cert does not repeat it.

---

## 0. AIMS-F IS DONE THROUGH STAGE 6

| | |
|---|---|
| `jta_versions` | v2.0 / published, projected from live rows (migration 178). **All nine certs now hold one** |
| `certification_i18n` | **3/3** - claim in es-419 and pt-BR, description in all three |
| `exam_blueprint` | computed and written |
| Loaders | `load-cert-i18n.mjs` yes · `load-cert-descriptions.mjs` yes |
| Status | `draft`, `governance-service-management` #3 |

**Cognitive profile, computed:**

| cert | remember | understand | apply | analyze |
|---|---|---|---|---|
| ISMS-F | 10.39 | 56.77 | 22.68 | 10.17 |
| **AIMS-F** | **none** | **46.93** | **41.26** | **11.80** |

The JTA's own falsification test passes. **Apply is 1.8x with no recall tier.**

**Remaining gaps, all honest:** fourteen tables empty because no lesson or item
exists yet; `load-jta-i18n.mjs` (35 task statements x 2 languages - waits until
lesson authoring settles the phrasing); `gen-badges-module.mjs` (artwork, and
Yajaira is the named authority).

**Next is Stage 5. 35 lessons. Its own sessions.**

---

## 1. I DESTROYED A FILE, AND THE CHECKLIST TOLD ME TO

**`scripts/load-cert-descriptions.mjs` already existed** and already did the job:
English canonical rewrites for AIGRM-I and AISM-I, twelve translations, and a
`loadEnv()` reading `.env.local`. I concluded it did not exist, wrote a
replacement, and `Move-Item -Force` overwrote 156 lines with 79. Commit `7c31e4c`.

**Reverted by `3bf527c`.** Nothing was lost - the loader never ran, `b0cb7de` had
the original, and the database was never touched. **The only reason it surfaced
before it mattered is that my version dropped `loadEnv()`, so it failed on
missing env vars.** A working replacement would have shipped silently.

### Why I believed it

`CERT-PUBLISH-CHECKLIST.md` line 137 names `load-cert-i18n.mjs`. **It never names
`load-cert-descriptions.mjs`.** And line 26 still says `description` is *"NULL
until a long-form translation pass"* - when all 24 rows were populated in three
languages, some past 700 characters.

**The artifact that exists to prevent this told me the thing that caused it.**
Line 26 is still wrong. Fixing it is on the list below, but fixing prose is not
the answer - see §2.

### Two process failures

**`Move-Item -Force` overwrites silently.** Landing scripts now `throw` when the
destination exists. That guard is in every landing block from `179` onward.

**"This file does not exist" is a claim requiring `Test-Path`**, not an inference
from another file's scope comment. Same error as reading `/mnt/project/` (a
snapshot) instead of the working tree, which cost an earlier patch its anchors -
but in a far more expensive form.

---

## 2. `cert_inventory()` — the answer to "why do we have this conversation every cert"

Migration **179** adds `public.cert_inventory(p_code text)`. It reads
`information_schema` at call time for every table carrying `certification_id` and
counts rows per cert. `certidemy-web/scripts/cert-inventory.mjs` calls it and adds
a second half: a scan of `scripts/` for every file keyed by cert code.

**Both halves are derived. Neither can go stale.** The reference cert is computed
as whichever has rows in the most tables, so it keeps working when ISMS-F is no
longer the fullest build.

### It found three things in two seconds

1. **`certification_i18n` read 2 for AIMS-F against 3 for everything else** - no
   English row. That would have shipped.
2. **`load-jta-i18n.mjs`** - a loader named in no handoff.
3. **`gen-badges-module.mjs`** - same.

Also: **27 tables carry `certification_id`.** No document has ever listed them.

```
node scripts/cert-inventory.mjs AIMS-F
```

**Run it at the start of cert work and again before any status flip.** It answers
the question the checklist keeps answering wrongly.

### What this replaces and what it does not

It replaces the parts of `CERT-PUBLISH-CHECKLIST` that enumerate *what exists* -
tables, loaders, coverage. Those rot. It replaces nothing that is *judgment*: the
sample-question selection rules, the register conventions, the claim discipline.
**Keep those in prose. Delete or derive the inventories.**

---

## 3. THE DRY-RUN TRAP — twice in one session

A patch was dry-run, printed `DRY OK`, and the `-Apply` step was skipped. Then the
verification ran against an unpatched file. **Twice** - once on
`load-cert-i18n.mjs`, once on `load-cert-descriptions.mjs`.

Not inattention. **`exit 0` on the dry path reports "I deliberately did nothing"
with the same code as success**, in a project where every other tool exits 0 only
when work happened. A wall of green text and exit 0 is indistinguishable from a
completed patch at a glance, and chained commands continue past it.

**All four patch scripts now `exit 2` on the dry path** (`20551fe`, `46d51f3`).
**Every future patch script does the same.** The message reads `NOT APPLIED`.

Both times the verification block reported the skip correctly and it was read past
anyway - which is the argument for a non-zero exit rather than better output.

---

## 4. SWEEPS THAT FLAG THEMSELVES — seven now

v5.5 §6 recorded this. v5.6 §6 recorded five more. Two further instances:

- `no mojibake = False` - a case-insensitive `-match 'A-tilde'` matching legitimate
  accented characters. **This one masked a real signal**: it sat in the same block
  as five False results that were correctly reporting the skipped `-Apply`, and
  the noise made the block look like my usual false alarms.
- `old slug gone = False` - the comment explaining the collision.

> **A sweep must describe the POST-FIX state, and it must be `-clike` (case-
> sensitive) when the target is a specific byte.** A check that cries wolf trains
> the reader to ignore the check that matters.

---

## 5. FOUR MORE DOCUMENTS LOST TO THE DATABASE

Beyond the four in v5.6 §4:

| Doc | Said | Live |
|---|---|---|
| `CERT-SCHEMA-GUIDE` §6 | slug matches the folder name | **also GLOBALLY UNIQUE** - `modules_slug_unique` is table-wide. Patched, `b18c934` |
| `CERT-PUBLISH-CHECKLIST` line 26 | `description` NULL until a translation pass | **All 24 rows populated.** STILL WRONG - see §7 |
| `CERT-PUBLISH-CHECKLIST` line 137 | names `load-cert-i18n.mjs` | **never names `load-cert-descriptions.mjs`** - the omission that caused §1 |
| `load-cert-i18n.mjs` header | `description` stays null for now | corrected, `b0cb7de` |

**`CERT-SCHEMA-GUIDE` §2 was already fixed by another session** and the patch
script's anchor guard refused to overwrite it. Second time today an anchor check
prevented a regression rather than merely a mismatch.

---

## 6. CRAFT NOTES

**Patch scripts that carry accented content must be pure ASCII themselves.**
Every accent built as `[char]0x00F3`. The script survives download, file write and
terminal paste with nothing multibyte in transit.

**Prefer insert over replace when adding to a data structure.** The descriptions
patch locates both block-close positions by index, verifies both, then inserts
pt-BR first so the es-419 offset stays valid. A replace-based patch can eat
surrounding text; an insert cannot.

**Build anchors from a codepoint dump of the working tree**, with spaces as dots
and backticks as markers. The first attempt at the loader patch used six leading
spaces where the file had five - read from a rendering, not from bytes.

**`load-cert-descriptions.mjs` derives English.** Line 151:
`ENGLISH_REWRITES[code] ?? byCode.get(code).description`. Adding a cert to
`DESCRIPTIONS` puts it in `wanted` and generates the `en` i18n row from
`certifications.description`. **No English retyping. No `ENGLISH_REWRITES` entry
unless the canonical text is actually changing.**

**Register, for catalogue descriptions - two patterns, not interchangeable:**

- Framework-independent practitioner certs (AIGRM-I, AISM-I) open *"AI-era-native
  X certification."*
- **Standards-based certs (ISMS-F, AIMS-F) name the standard first**, because the
  standard IS the subject. *"AI-era-native ISO/IEC 42001"* says nothing - 42001 is
  already an AI standard.

**AIGRM-I needed no edit after all.** Its description already names the ISO/IEC
42001 family among its public frameworks. The distinction a buyer needs -
AIGRM-I is *grounded in* several frameworks, AIMS-F *certifies one standard* -
is carried entirely by AIMS-F's own description. **One cert changed, not two.**

---

## 7. OPEN LOOPS

### New

1. **`CERT-PUBLISH-CHECKLIST.md` is wrong in the way that caused §1.** Line 26 on
   descriptions, line 137's incomplete loader list. **Do not just fix the prose** -
   replace the enumerating sections with a pointer to `cert-inventory.mjs` and keep
   only the judgment.
2. **`load-jta-i18n.mjs` needs AIMS-F** - 35 task statements x 2 languages. After
   lesson authoring settles phrasing.
3. **`gen-badges-module.mjs` needs AIMS-F.** Yajaira is the named authority.
4. **`load-module-i18n.mjs` covers no cert at all**, not even SM-AI-I. Worth one
   look - either it is dead or module translations are unloaded everywhere.
5. **`price_usd` is 0** on AIMS-F. Harmless while draft; real before publish.

### Carried

6. **The attribution rule is untested.** First `MAX_TASKS=1` run is the test.
7. **The ISMS-F attribution audit** - the rule prevents new defects, it does not
   repair ~2,646 existing items.
8. A queryable migration tip. **`cert_inventory()` is the pattern**: derive it.
9. `ksa_is_provisional` has no approval path; 98 rows unreviewed.
10. Seven `SCHEME-*.md` carry bare `17024`. ISMS-F and AIMS-F are pinned.
11. Formulation drift - still needs a ruling.
12. Everything in v5.4 §8.

---

## 8. THE LESSON, SHARPER THAN v5.6 §10

v5.6 said: the primary source, open, during the work.

This half of the session says something narrower and more useful. **Every failure
here was a claim about the system that nobody could check cheaply.** Does that
loader exist. Is that column still there. Is that slug unique. Did the patch
apply. Each was answerable in seconds by the machine and was instead answered from
a document, an inference, or a glance at green text.

`cert_inventory()` is the shape of the fix: **do not write down what the system
contains - ask it.** The documents keep the things a query cannot answer, which is
judgment, convention, and the reasons behind decisions. Everything else should be
derived, and anything derived cannot be stale.

The tenth cert should start with `node scripts/cert-inventory.mjs`.
