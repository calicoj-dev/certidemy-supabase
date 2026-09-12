# HANDOFF v9.8 addendum — SM-AI-II is visible, and the policy that hid it

**Date:** 2026-09-11
**Covers:** everything after `HANDOFF-v9_8.md` — migrations 292, 293, 294,
translation review round one, the tier-3 document, `verify-cert` invariant 23
**Repos:** `supabase` (this one) and `../certidemy-web`

**The one-line state:** `SM-AI-II` went from **46 pass / 5 fail / 2 warn** to
**52 pass / 1 fail / 3 warn**, and the row is now readable by `anon` — it appears on
`/certifications` as `coming_soon`. The single remaining failure is `i18n.approved`,
which needs a bilingual human and not a script.

**If you read one section of this document, read §2.** It is the only place the RLS
finding is written down in prose; everywhere else it exists only in commit messages.

---

## 1. WHAT `verify-cert --cert SM-AI-II` SAYS NOW

```
52 pass · 1 fail · 3 warn · 3 skip
```

| was, at v9.8 | now |
|---|---|
| `items.vocabulary` — 2 secure items, one keyed | **fixed**, and the check now reads all three languages |
| `catalogue.claim` | **fixed**, three languages |
| `catalogue.description` | **fixed**, three languages |
| `jta.translated` | **fixed** — 5 domains x 44 tasks x 2 languages |
| `samples.public` | **fixed** — six samples, six distinct tasks |
| — | **`i18n.approved` FAILS: 71 of 98 rows provisional.** See §5 |

The three warnings are declared in `SCHEME` §12 and one is new: `items.vocabulary`
now warns on **42 `ceremony`/`ceremonia`/`cerimonia` hits across three languages**,
which is the soft half of the vocabulary gate and is expected to include ordinary
language ("a commitment ceremony" in reported speech). Read them, do not gate on them.

Bank unchanged: **2,376 items, 792 groups**, both floors met.

---

## 2. THE RLS FINDING — the catalogue policy and the docblock disagreed for months

**This is the section a future reader most needs, and until now it existed only in a
commit message.**

`certifications` carries three policies. The catalogue one read:

```
catalog read certifications   SELECT   PUBLIC   (status = 'available' OR is_platform_admin())
```

Meanwhile `../certidemy-web/lib/certifications/data.ts` — written to migration 069's
status lifecycle — documents, in its file docblock:

```
 *   draft        - hidden everywhere (scaffold / not announced). Resolves to null.
 *   coming_soon  - resolves + shows in catalog w/ badge; NOT enrollable/examinable.
 *   available    - fully live.
 *   unavailable  - resolves + shows w/ badge; lessons/practice stay open; exam frozen.
```

and `getCertByCode` returns *"the row for any non-draft cert (coming_soon / available /
unavailable) so its pages resolve and render."*

**The application layer believed the database admitted three of four status values. The
database admitted one.** Everything above the policy was correct and consistent —
the resolver, the sort rank, the badge, the switcher's deliberate exclusion of
`coming_soon`, the console status table. The policy was the half nobody moved when 069
introduced the vocabulary.

### Why it survived

**The policy's second branch admits the one account that would ever check.**
`is_platform_admin()` meant the owner — the only person likely to open `/certifications`
and notice a missing certification — always saw the row. Every other reader saw eleven
certifications and had no way to know a twelfth existed.

**The check and the blind spot were the same clause.** This is the same shape as the
`create-lti-platform` defect recorded in `CLAUDE.md`: *the one row that disproves the
rule got in by bypassing the rule.* Here, the one reader who could disprove the policy
was exempted by it.

### What migration 294 changed

```sql
alter policy "catalog read certifications"
  on public.certifications
  using (status <> 'draft' OR is_platform_admin());
```

`ALTER POLICY`, not `DROP` + `CREATE` — no window with no catalogue policy, and the
PUBLIC role list is not silently re-derived from whatever the `CREATE` happened to say.
`status` is NOT NULL with a CHECK over exactly four values, so `<>` is total; that was
checked against `pg_attribute` and `pg_constraint`, not assumed. A nullable `status`
would have needed `is distinct from` and would have silently hidden every NULL row.

Verified by **behaviour**, under `set local role anon`, never by reading the policy text
back: anon sees 12, `SM-AI-II` true, **`ZZ-TEST-I` false**, the eleven `available` codes
identical as a string rather than as a count. Both the pre- and post-conditions run
inside the transaction that alters the policy, so a wrong outcome raises and takes the
`ALTER` with it.

### `unavailable` now opens as a class, with zero members

`status <> 'draft'` admits `coming_soon`, `available` **and `unavailable`**. There are no
`unavailable` rows today, so nothing changed on the day — but **the first withdrawn
credential becomes publicly listed the moment someone sets that status.**

That is probably right. A credential people hold should not vanish from the catalogue
when it stops being sold; the web layer already renders it with a badge and keeps
lessons and practice open while freezing the exam. **The point of recording it here is
that it is now a decision rather than a silent consequence.** If a future reader wants
withdrawn certifications hidden, the policy needs a third value named explicitly, not a
tweak to `<>`.

### The one thing the change genuinely publishes

`exam_blueprint` is a **column on `certifications`**, and `anon` holds `anon=r/postgres`
— a table-wide SELECT with no column-level privileges (read from `relacl`). **There is
no state in which the catalogue card renders and the blueprint does not.** That is why
293 had to run first, and why invariant 23 exists (§4).

Nothing else followed. **No policy anywhere in this database references
`certifications.status` in a subquery** — checked across all 54 policies on 48 tables —
so no chain opens because a certification row became readable. `domains` and `tasks`
already carry `qual: true` SELECT policies and have been world-readable for every
certification, drafts included, all along.

---

## 3. MIGRATIONS 292, 293, 294 — ALL RUN CLEAN

### 292 — SM-AI-II gets an achievement

`CERT-PUBLISH-CHECKLIST` §6.7: **nothing creates an achievement.** No trigger, no
function, no edge function. Migration 231 inserted one per certification as a one-time
backfill over the eleven that existed on 2026-08-19 and left no forward mechanism, so
every certification created since has needed a hand-written row. Without it a passing
candidate receives nothing.

### 293 — the blueprint becomes publishable

**The rule, decided for every certification:** `grounding_note` states what the item
model rests on and what a reader needs in order to judge the credential. **It is not
where engineering history lives.** Scheme documents and commit messages are.

| field | before | after |
|---|---|---|
| `grounding_note` | 2,385 | 1,846 |
| `cue_tolerance.rationale` | 909 | 640 |
| `cue_guard` | 313 | 227 |
| blueprint | 5,730 | **4,805** |

**Everything cut was confirmed per item to exist in `SCHEME`, the BoK, the JTA or a
migration before it was cut.** Nothing existed only in the note — that was looked for
specifically, and the closest thing was `verify-profile.mjs`'s byte-identity assertion,
which lives in migration 290 and nowhere else.

**Kept, in mechanism-free wording:** *"Every item is checked against this list a second
time, independently of its authoring."* It is the strongest quality claim in the note,
and `CLAIMS-POLICY` and BoK v2.0 already disclose that items are pipeline-drafted and
that the bank is unvalidated pending a panel — omitting it here would have made the
blueprint the one place the platform was coy about something it already states.

**Cut, not rewritten:** `cue_guard`'s clause saying ISMS-IA's blueprint describes the
guard wrongly. ISMS-IA is `available`, so **its blueprint is already public**, and
publishing *"a live certification's public blueprint contains a wrong description"*
under a **different** credential's row is the worst available place for that sentence.
It is now recorded against ISMS-IA in `SCHEME-ISMS-IA` §11, with an inline marker on the
false §8.3 sentence. The original §8.3 wording is preserved, per the rule that a record
stops being a record when you edit the text around a correction.

**The one verification row that fired, and what it taught.** Row 17 read **1856** against
a predicted **1846**. The ten characters were **transport**: this file is LF, the note is
six paragraphs and therefore ten newline characters, and the browser paste normalised
every one to CRLF. Rows 18 and 19 matched exactly because `rationale` and `cue_guard` are
single-line strings with no newline to normalise — the mechanism confirming itself rather
than luck. `CLAUDE.md` already states the rule, for `pg_proc.prosrc`: read the body back
and md5 it **with CRs stripped, as 244, 245 and 249 do.** It applies verbatim to jsonb
text. Rows 17–19 now strip `chr(13)` before counting.

> **The six POSITIONAL rows are why this was a footnote and not an investigation.**
> Rows 01–08 passed, so no content had been lost; only the count was wrong, and **the
> count was the single row on the page expressed as a NUMBER rather than as a PROPERTY.**
> That is `CLAUDE.md`'s post-condition rule arriving from the other direction.

### 294 — the catalogue policy

See §2. Ten rows, all true.

**A shape worth reusing.** Both 293 and 294 are **one paste**, because the SQL editor
returns only the last result set: two pre-guards written as readable `select`s would
have executed with their output discarded and the write would have run regardless. **A
pre-condition nobody can read before the write is not a pre-condition; it is
decoration.** So the pre-conditions are a `do $$ … raise exception $$` block and the
single visible result set is the verification. 294 goes further and puts the
post-conditions inside the transaction too, so the paste reverts itself.

---

## 4. `verify-cert` INVARIANT 23 — `blueprint.publishable` (§12)

A blueprint naming repository internals now **FAILS the release gate**.

```
/\.mjs\b|\.ts\b|\bHANDOFF|\bmigration [0-9]|\bscripts\/|\bverify-cert\b|\bcommit [0-9a-f]{7}/
```

**Measured against all thirteen certifications before it shipped:** exactly one failure,
SM-AI-II — the only blueprint not yet public. Eleven PASS, one SKIP (ZZ-TEST-I has a
NULL blueprint). That is why it is a FAIL and not a WARN: **it is not a bar nobody
clears, it is a bar twelve of thirteen were already clearing silently, and the
thirteenth was about to be published.** After 293 it fires on nothing.

**The house norm is not "short".** AIMS-IA's blueprint runs to 2,868 characters and
ISMS-IA's to 2,712, both careful cue-tolerance rationales, and both pass. Length is not
the property. Provenance is.

**`commit ` is deliberately not the pattern.** The bare verb would fail *"commit to the
Sprint Goal"* — correct Scrum prose in a blueprint that had done nothing wrong. This
repo's recurring guard failure is a check that matches an English word, so the pattern
wants a git SHA. The tight and loose forms were verified to agree across all thirteen,
and no blueprint contains the bare word at all.

It reports **which fields**, not just that the blueprint is dirty. A reader told "dirty"
without a field reads several thousand characters of JSON to find it, which is how a
real failure gets triaged as noise.

> **Note for whoever re-runs this:** `verify-cert` connects with the service role and
> bypasses RLS, so invariant 23 is unaffected by 294. Re-running it after the policy
> change confirms the blueprint content is still clean — **it does not exercise the
> anon read path.** That is what 294's own guards are for, and they are the only place
> the anon behaviour is asserted.

---

## 5. TRANSLATION REVIEW, ROUND ONE — and the finding that generalises

**98 rows** (5 domains + 44 tasks, two languages). `scripts/gen-translation-review-doc.mjs`
emits a markup-able document; `apply-translation-review.mjs` reads it back and clears
`is_provisional` only for approved rows.

**Round one covered 28 rows — the two highest-consequence tiers.** Result: **27 approved,
1 rejected.** Current state, read from the database:

```
domain_translations   10 rows,  0 provisional
task_translations     88 rows, 71 provisional
```

The 17 approved task rows are D5's nine statements in both languages, **minus the one
rejection**.

### The rejection, and why no check could have caught it

Task 5.7's English: *"Analyze rising throughput accompanied by falling Increment
usability."* The competence is **two movements in opposite directions**.

```
pt-BR    Analisar o aumento de throughput acompanhado pela queda na usabilidade
es-419   Analizar un aumento en el RENDIMIENTO acompanado de una disminucion en la usabilidad
```

**`rendimiento` reads as PERFORMANCE in es-419** — which is the *other half* of the pair
the task exists to separate. A Spanish candidate was answering a different question.

> **Neither translation is wrong on its own.** Read the Spanish alone and it is fluent
> and correct. **The defect exists only in the relationship between them**, and a
> reviewer working one language at a time has nothing on the page to compare against.

**The reviewer caught it because the Portuguese sat two lines above the Spanish. That is
a property of the document, not of the reader.** The layout did the work. It is written
up as `TRANSLATION-PIPELINE.md` §3.6 and it **generalises to every trilingual credential
this platform ships**: one document, every language for a row adjacent, one shared
English above them. Never one file per language.

The re-translation is written and **left provisional on purpose** — a re-translation has
not been reviewed, and clearing the flag would make it mean "a script is confident".
`lib/item-translation.mjs` gained a FALSE FRIENDS block recording `throughput` ≠
`rendimiento`, `submitted` ≠ `entregado`, and the load carried by *performing Scrum*.

### The tier-3 document

`jta/SM-AI-II_TRANSLATION-REVIEW-TIER3.md` — **70 rows, D1–D4 task statements, generated
and unreviewed.** It is a **separate file on purpose**: `SM-AI-II_TRANSLATION-REVIEW.md`
is now a signed record of a completed review and must not grow rows that were never in
it.

**It nearly shipped with `####` task headings under `###` domain headings.** The
write-back parser keys every row off `/^### (\S+)/`, so a nested heading would have made
it read the **domain** code as the key for all 70 task rows — silently. One heading level
per row type keeps the document and its parser in step. Caught while writing the comment
explaining the layout.

---

## 6. OPEN ITEMS CARRIED FORWARD

**The two that block SM-AI-II's release:**

1. **`i18n.approved` — 71 of 98 rows provisional.** The tier-3 document is generated and
   waiting for a bilingual reader. This is the last failing check and it is not
   automatable; §5 is the argument for why.

2. **`is_provisional` is one boolean carrying three meanings.** `verify-cert` cannot
   distinguish *"nobody has read anything"* from *"the highest-consequence rows were read
   and the rest are honestly marked"* — it fails both identically, and one of them is a
   certification doing the work in priority order. **Softening the check is not the fix**,
   because a third state must still fail: a reviewer-REJECTED row is a known wrong
   translation still being served. What would earn it is a `review_status` of
   `unreviewed | approved | rejected` alongside the boolean.
   **Held on purpose until a second round** — one rejection in 28 rows may be the steady
   rate or the first of many, and hardening schema around a single observation is how a
   threshold gets set from three banks. Run tier 3, then decide. The proposal is written
   out in full in `scripts/apply-translation-review.mjs`'s docblock.

**Also open, and larger than either:**

3. **ISMS-IA §8.3 describes a cue guard that has never existed.** Recorded in
   `SCHEME-ISMS-IA` §11 with an inline marker; the text itself needs its own migration,
   because the same wrong description is in that certification's public `exam_blueprint`.
   *(The `len_spread_max` 130-vs-100 question filed alongside it is **not** open —
   migration 200 settled it deliberately and said why. It has been rediscovered as open
   twice, which is why it is now recorded as decided.)*

4. **Retired Scrum vocabulary in LIVE secure banks.** `verify-cert`'s vocabulary
   invariant only began reading all three languages on 2026-09-11, and what it found is
   the largest known content defect on the platform:

   | cert | secure items carrying a retired term | status |
   |---|---|---|
   | **SM-AI-I** | **52**, across en / es-419 / pt-BR | `available` |
   | **SPO-AI-I** | 35 (`equipo de desarrollo`) | `available` |

   These were found separately and read as two discoveries. **They are one project** —
   same cause, same detector, same fix shape (`retranslate-retired-vocabulary.mjs`).

5. **`CLAUDE.md`'s `verify-cert --all` baseline table is stale in a way that hides #4.**
   It says *43–44 checks* and *1 cert with FAILURES*. Measured 2026-09-11: **53–57 checks,
   and SIX certs failing** — AIE-I 2, SD-AI-I 2, SM-AI-I 2, SM-AI-II 2 (1 now), SPO-AI-I 1,
   ZZ-TEST-I 11. `CLAUDE.md` warns that a clean baseline nobody re-checks turns the next
   real failure into noise someone has already decided to ignore. **That is precisely what
   happened to the 52.** Re-baseline from a saved run, not from memory.

---

## 7. THE HONEST POSITION

SM-AI-II is **listed**, not sellable. The blueprint a reader now sees is one written to
be read by a candidate or an assessor rather than by whoever last edited the generator,
and there is a gate keeping it that way. The bank is complete, trilingual, and meets its
floors.

**What it does not have is a human panel.** The item bank is pipeline-drafted with an
independent critique pass, and the blueprint says so. That is editorial rigour; it is not
the independent SME-panel validation ISO/IEC 17024 requires, and nothing in this
addendum changes that. 71 of 98 blueprint rows have never been read by a bilingual human,
and one of the 28 that were read was wrong in a way no automated check could see.

**The tier-3 review is the next thing, and it is a person's afternoon, not a script.**
