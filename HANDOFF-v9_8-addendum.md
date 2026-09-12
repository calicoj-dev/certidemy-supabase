# HANDOFF v9.8 addendum — SM-AI-II is visible, and the policy that hid it

**Date:** 2026-09-11
**Covers:** everything after `HANDOFF-v9_8.md` — migrations 292, 293, 294, 295,
translation review rounds one AND two, `verify-cert` invariants 23 and the
three-state `i18n.approved`
**Repos:** `supabase` (this one) and `../certidemy-web`

**The one-line state:** `SM-AI-II` went from **46 pass / 5 fail / 2 warn** to
**53 pass / 0 fail / 3 warn** — `verify-cert` reports *All certs conform. Safe to
publish.* The row is readable by `anon` and appears on `/certifications` as
`coming_soon`. **All 98 blueprint translation rows have been read by a human, the four
rejections repaired, and the repairs re-read and approved on 2026-09-11.**

**If you read one section of this document, read §2.** It is the only place the RLS
finding is written down in prose; everywhere else it exists only in commit messages.

---

## 1. WHAT `verify-cert --cert SM-AI-II` SAYS NOW

```
53 pass · 0 fail · 3 warn · 3 skip      All certs conform. Safe to publish.
```

| was, at v9.8 | now |
|---|---|
| `items.vocabulary` — 2 secure items, one keyed | **fixed**, and the check now reads all three languages |
| `catalogue.claim` | **fixed**, three languages |
| `catalogue.description` | **fixed**, three languages |
| `jta.translated` | **fixed** — 5 domains x 44 tasks x 2 languages |
| `samples.public` | **fixed** — six samples, six distinct tasks |
| — | **`i18n.approved` PASSES: 98 rows, all approved.** Was 71 provisional; two review rounds plus four repairs cleared every one. See §5 |

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

## 5. TRANSLATION REVIEW, TWO ROUNDS — and the finding that generalises

**98 rows** (5 domains + 44 tasks, two languages). `scripts/gen-translation-review-doc.mjs`
emits a markup-able document; `apply-translation-review.mjs` reads it back and clears
`is_provisional` only for approved rows.

**Round one covered 28 rows — the two highest-consequence tiers.** Result: **27 approved,
1 rejected.** The 17 approved task rows were D5's nine statements in both languages,
minus the one rejection.

**Round two covered the remaining 70** — D1–D4 task statements, read by the scheme owner
with Grok. Result: **67 approved, 3 rejected.** Current state, read from the database:

```
domain_translations   10 rows,  0 provisional
task_translations     88 rows,  4 provisional
```

**All four remaining provisional rows are re-translations awaiting a re-read. Not one is
unreviewed.** That inversion is what earned migration 295 — see §6.

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

### Round two's three, and the second contract entry

| row | defect |
|---|---|
| **1.9 es-419** | *"mejora **de** la Sprint Retrospective"* reads as improving the **event**. The task is an improvement **identified at** the Retrospective that would require omitting a Scrum element. |
| **1.9 pt-BR** | Same defect, same repair — *"uma melhoria identificada **na** Sprint Retrospective"*. |
| **3.8 es-419** | *"compromiso"* is the 2020 Spanish for **COMMITMENT**. The English is *engagement*. |

**3.8 is sharper than round one's `throughput`/`rendimiento`, because `compromiso` is not
a wrong word — it is the CORRECT rendering of a DIFFERENT Scrum term this credential
tests by name.** Measured rather than recalled: **eleven SM-AI-II tasks across D1, D2, D4
and D5** turn on an artifact commitment, so a candidate meeting *"pierde el compromiso del
Product Owner"* in D3 has a live ambiguity. Repaired to `involucramiento`.

**1.9 is not a false friend at all**, and it got its own heading in the contract for that
reason. Every word of *"mejora de la Sprint Retrospective"* is correct; the **preposition**
moves the subject of the task. **It failed in both languages identically** — a defect
reproducing across two independent translations is not a slip, it is the shortest natural
rendering beating the accurate one, and filing it under vocabulary would have taught the
next translator to check words.

`lib/item-translation.mjs` now carries four false friends and a separate **ATTACHMENT**
block.

All three re-translations are written and **left provisional on purpose** — a
re-translation has not been reviewed, and clearing the flag would make it mean "a script
is confident".
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

## 6. MIGRATION 295 — `is_provisional` GETS A THIRD STATE

> **STATUS: RAN CLEAN, 2026-09-11.** Pre-conditions and post-conditions both silent,
> behaviour probe passed. Final counts exactly as predicted: `domain_translations`
> approved 116; `task_translations` approved 1,010, rejected 4, unreviewed 2.

After round one this was written up as a proposal and **held on purpose**: one rejection
in 28 rows is not evidence, and hardening schema around a single observation is how a
threshold gets set from three banks. Two rounds now exist.

| round | rejected | rows | rate |
|---|---|---|---|
| one — domains + D5 | 1 | 28 | 3.6% |
| two — D1–D4 | 3 | 70 | 4.3% |
| **both** | **4** | **98** | **4.1%** |

**The rate is not what decided it.** Rejection is rare and steady — it neither exploded
nor vanished. What decided it is that **the state persists and the boolean's meaning has
inverted**. `5.7 es-419` was rejected in round one, repaired within the hour, and was
still provisional after round two — it survived an entire review cycle without being
re-read. By then all four provisional rows were re-translations awaiting re-read, so the
check said this, and **every word was false for every row it was failing on**:

```
FAIL §11  4 of 98 provisional - the English moved, or they were never reviewed
```

**A column that cannot express the state produces a check that misdescribes 100% of the
rows it fails on. That is worse than imprecision.**

**Rarity argues FOR the column, not against it.** A failure reading 71 of 98 gets worked;
a failure reading 4 of 98 reads as *nearly done* and gets deferred — and those four are
the highest-risk rows in the set, each a known meaning defect whose repair nobody has
checked. All four defects were **meaning**; none was a typo.

### Sticky rejected

`review_status` is **the worst thing known about this row until cleared.** Only a human
approval clears `rejected` — a re-translation does not, because returning the row to
`unreviewed` would discard the single most useful thing known about it.

```
any rejected                    -> FAIL, naming the rows
none rejected, some unreviewed  -> WARN with the fraction
all approved                    -> PASS
```

**SD-AI-I is the worked example of why this is not cosmetic.** Task 2.3 is provisional in
both languages because *nobody has read it*. Today it produces the same FAIL as a
known-wrong translation still being served. After 295, SD-AI-I **warns** and SM-AI-II
**fails** — which is the difference the whole column exists for.

### The writer list, and the two writers no grep of application code finds

Nine writers of `task_translations` / `domain_translations`, enumerated across both
repos. **Two of them are database triggers** — `trg_invalidate_task_translations` and
`trg_invalidate_domain_translations` — which set `is_provisional = true` when the
**English** moves, and appear in no search for `from("task_translations")`. **That is the
rare path**: it fires during a JTA revision and at no other time.

**Seven of nine writers would have left the new column stale, and six of those write
text.** Editing seven call sites across two repos is the drift-prone option and
guarantees the eighth writer nobody has written yet gets it wrong. So the invariant is
enforced **structurally**, by a trigger on the translation tables themselves: *if the
translated text changes and the row said approved, it is no longer approved.* That holds
for writers nobody has enumerated and writers that do not exist yet. The two triggers on
`tasks`/`domains` are updated in the same migration to demote `approved` alongside the
boolean.

**Scope stated rather than left implicit:** `review_status` pairs with `is_provisional`,
the statement/title half. `task_translations` also carries K/S/A under a separate
`ksa_is_provisional`, which is **not** addressed — it would need its own column and its
own backfill of a review state nobody has ever recorded.

**The backfill inherits a claim it does not audit.** `not is_provisional -> approved`
maps 1,126 rows across thirteen certifications. `is_provisional = false` is *already*
defined as "a human compared this to the English", so the mapping makes an existing claim
explicit rather than making a new one. If that claim was ever optimistic, it was
optimistic before 295.

### THE DEMOTE TRIGGER WILL SURPRISE SOMEONE — read this before you file a bug

**If you re-run `gen-jta-translations.mjs` or `load-jta-i18n.mjs` against AIMS-IA,
ISMS-IA or any other certification, its `i18n.approved` check will move from PASS to
WARN and its approved rows will read `unreviewed`.**

**That is the trigger working, not a regression.** The generator rewrites the translated
text; nobody has re-read the new text; therefore it is not approved. Before 295 the same
run silently left rows marked as reviewed while replacing the words a human had reviewed
— which is precisely the lie the column exists to stop telling.

What it looks like:

```
before   PASS  §11  Translations reviewed against current English   98 rows, all approved
after    WARN  §11  Translations reviewed against current English   0 of 98 reviewed; 98 not yet read by a human
```

**It is a WARN, not a FAIL**, because unreviewed is not the same as known-wrong — that
distinction is the entire point of the column. The fix is a review round, not a
migration, and the review documents are generated by
`scripts/gen-translation-review-doc.mjs`.

**Nothing demotes a `rejected` row**, and nothing is demoted by an approval: the trigger
fires only on a text change and touches only `approved`. Running
`apply-translation-review.mjs` or `retranslate-review-rejection.mjs` cannot trip it.

### The blast radius, observed rather than assumed

`verify-cert --all` after 295. **Exactly one certification moved, and it moved the way it
was supposed to:**

```
SD-AI-I    2 fail, 2 warn  ->  1 fail, 3 warn
```

Task 2.3 is provisional in both languages because **nobody has read it**. Before 295 that
produced the same FAIL as SM-AI-II's four known-wrong rows. It is now a WARN, and
SM-AI-II is the only certification still failing `i18n.approved` — naming its four
rejected rows rather than reporting a fraction. **No other sibling moved.** The demote
trigger has fired on nothing, because nothing has rewritten a translation since.

### The second bug, found BY that observation — a dropped read became a verdict

The first `--all` sweep after 295 reported **AIMS-IA at 3 fail**, up from 0. It was not
the trigger, and it was not AIMS-IA. Run in isolation, AIMS-IA read 49 pass / 0 fail / 5
warn — unchanged. Two further sweeps agreed.

What the bad sweep actually said:

```
PASS  §9  Every item traces to a task     0 live items, all linked to a task
FAIL  §8  secure floor >= 8/task/lang     120 below floor
FAIL  §8  practice floor >= 10/task/lang  120 below floor
FAIL  §9  Pool can fill a form            15 shortfall(s) -> forms will silently drift
```

**AIMS-IA has 2,160 healthy items.** One page of the item fetch errored,
`const { data } = await ...` discarded the error, `!data` was read as *no more pages*,
and the bank came out empty. Every downstream check then answered honestly about an empty
bank.

> **This is worse than a skip.** It names rows. It looks exactly like real content debt.
> Whoever chases it finds nothing wrong — which is how a checker teaches people to
> discount it, and this document already argues that a baseline nobody trusts turns the
> next real failure into noise.

It is the **third instance of one shape in this addendum**: a failure-tolerant read
reporting a broken query as a finding about the data. The first was the silent `42501` a
missing grant produces (`CLAUDE.md`); the second was `i18n.approved` skipping instead of
failing when `review_status` did not exist; this is the third, and it was latent long
before either.

Fixed at the boundary rather than at nine call sites: `verify(cert)` now has a `must()`
wrapper that **aborts the whole run** on any read error, naming the certification and the
query. The item paging, the secure-firewall leak count, `task_concepts` and `lessons` all
go through it. The leak count mattered most — `count ?? 0` on an errored read reports
**zero leaked links**, which is the answer that passes, and a secure-firewall check must
never fail open.

### The bug the companion edit found, which is the more useful half

Adding `review_status` to `verify-cert`'s select and running it **before** the migration
did not fail. It **skipped** — and SM-AI-II went from **1 fail to 0 fail with nothing
fixed**:

```
skip §11  Translations reviewed against current English   no translations loaded
```

PostgREST rejects the whole query when a selected column does not exist, so `data` came
back `null`, `?? []` turned it into an empty set, and an empty set reads as *this
certification has no translations*. **A failure-tolerant read reported a broken query as
progress** — the same shape as the silent `42501` a missing grant produces, one layer up.
The error is now captured and named, and the check fails on it:

```
FAIL §11  the translation tables could not be read: column task_translations.review_status
          does not exist - if this names review_status, migration 295 has not run
```

---

## 7. OPEN ITEMS CARRIED FORWARD

**The two that block SM-AI-II's release:**

1. **Four rejected rows need a re-read** — `1.9` es-419, `1.9` pt-BR, `3.8` es-419,
   `5.7` es-419. All four repairs are written; none has been reviewed. This is the last
   failing check, it is a person's ten minutes rather than a script, and **`5.7` has been
   waiting since round one** — which is the fact that earned §6.

2. **Run migration 295 and commit it with its three companion script edits.** Until it
   runs, `verify-cert` fails every certification on a read error naming the missing
   column. *(The proposal that became 295 is preserved in
   `scripts/apply-translation-review.mjs`'s docblock, alongside a note on why the
   deciding fact was not the one it predicted.)*

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

## 8. THE HONEST POSITION

SM-AI-II is **listed**, not sellable. The blueprint a reader now sees is one written to
be read by a candidate or an assessor rather than by whoever last edited the generator,
and there is a gate keeping it that way. The bank is complete, trilingual, and meets its
floors.

**What it does not have is a human panel.** The item bank is pipeline-drafted with an
independent critique pass, and the blueprint says so. That is editorial rigour; it is not
the independent SME-panel validation ISO/IEC 17024 requires, and nothing in this addendum
changes that.

**What changed is the blueprint, not the bank.** All 98 blueprint rows have now been read
by a bilingual human across two rounds, and **four of them were wrong** — 4.1%, every one
a meaning defect rather than a typo, and every one invisible to the retired-vocabulary
gate, the generator and the critique pass. A 4% human-detected defect rate on text two
independent machine passes had already approved is the most useful number in this
document, and it is a number about the **blueprint**. The 2,376 items have had no
equivalent read.

**The next thing is the four re-reads. After that, the item bank is what nobody has
looked at.**
