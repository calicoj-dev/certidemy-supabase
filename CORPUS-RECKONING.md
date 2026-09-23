# The reckoning: what is held, blocked, unread or unverified

Measured 2026-09-22. **Read-only. Nothing was fixed in this pass.**

Commissioned because a week was spent on concept translations and the endpoint
serving them had been down since 364. The question is what else is in that
state.

**Four things in here change the order of section 8.** They are marked
**[REORDER]** and collected at the end.

---

## 0. The headline

| | |
|---|---|
| **12.8M characters** of non-English lesson body are **serving right now** | a human has read **41 lessons** of it |
| **375 of 479** non-English lessons per language serve with **no review required at all** | the bilingual gate was only ever armed on 104 |
| `domain_translations` and `module_translations` — 232 rows — are **100% cleared** | **no review table exists** for either; nothing can ever have read them |
| AIMS-F's item bank was generated from the stub concept descriptions | the descriptions were rewritten 2026-09-21; **the bank was last written 2026-09-13** |
| ~~`open-badge` returns the same 622 bytes for any code~~ | **WITHDRAWN** — its parameter is `doc`; it verifies, a bogus code gets 404 |
| The paid surfaces had never been exercised from outside | **DONE** — key minted, used, revoked in 17s; paywall and tools both proven |

---

## 1. Every translated surface

### 1.1 Concepts — the surface we spent the week on

| language | rows | cleared | provisional | cleared but hash-stale |
|---|---:|---:|---:|---:|
| es-419 | 1,729 | 1,532 | 197 | **0** |
| pt-BR | 1,729 | 1,486 | 243 | **0** |

Never-generated: **0**. Every live concept has a row in both languages.

**Human reading:** 21 live review rows (11 es approved + 1 blocked, 10 pt
approved + 2 blocked). Each review is a **sample** of 20 slugs standing for a
whole certification — so the corpus is *cleared* by sampling, not *read*.
Rows actually read by a human this week: roughly 480 + 80 renderings.

The blocked draws are AIE-I pt-BR (47 rows) and ISMS-F in both languages
(191 + 191), each with a named defect in the review row.

### 1.2 Lesson bodies — the large corpus nobody has opened

**FRIDAY-READINESS says non-English lesson bodies are "held pending a bilingual
read". That is substantially false, and it is false in the dangerous
direction.**

| language | rows | **serving** | withheld | review required | has an approved review | characters |
|---|---:|---:|---:|---:|---:|---:|
| en | 479 | 479 | 0 | 0 | 0 | 5,877,474 |
| es-419 | 479 | **392** | 87 | 104 | 17 | **6,501,530** |
| pt-BR | 479 | **399** | 80 | 104 | 24 | **6,294,146** |

The gate is `public.lesson_body_is_servable`:

```
mcp_servable AND (language = 'en'
                  OR NOT mcp_translation_review_required
                  OR an approved review whose en_hash AND tr_hash both match)
```

**The middle clause is the finding.** `mcp_translation_review_required` is true
on only **104 of 479** rows per language. The other **375 serve without any
review being required**, and 41 review rows exist in total across both
languages. So:

> **12,795,676 characters of Spanish and Portuguese lesson body are being
> served to anyone with a `courseware:lessons` key, and a human has read 41
> lessons' worth of it.**

This is an order of magnitude more unread served text than the concept layer,
and unlike the concept layer it is **paid content**. **[REORDER]**

**And I measured it wrong the first time, in this document's own research.** My
first query counted `mcp_servable` and reported 479/479 servable in all three
languages. `mcp_servable` is a column; the gate is a function that ANDs it with
two more clauses. Same defect this file exists to catalogue, committed while
cataloguing it.

### 1.3 Tasks, domains, modules

| surface | rows/lang | cleared | provisional | review table |
|---|---:|---:|---:|---|
| `task_translations` | 508 | 508 | 0 | `task_translation_reviews`, 98 rows |
| `domain_translations` | 58 | 58 | 0 | **none exists** |
| `module_translations` | 58 | 58 | 0 | **none exists** |

**232 rows are marked cleared and approved with no mechanism that could ever
have recorded a human reading them.** `review_status = 'approved'` on a table
with no review table is a value nobody set deliberately — it is the column
default doing the work of a claim. **[REORDER]**

Task translations are 1,016 rows against 98 review rows, and the 98 are
KSA-field reviews keyed on an English hash.

### 1.4 Items

`quiz_questions` carries `language` directly. See §4 — the question there is
not whether they are translated but what they were translated *from*.

### 1.5 Certification and category copy

`certification_i18n` (27 rows) and `cert_categories_i18n` use the **`lang`**
key column, not `language`. Neither has a review table, an `is_provisional`
column, or a hash gate. They are served by the public site.

---

## 2. What serves, measured at the endpoint

### 2.1 Covered by `check-mcp-wire.mjs` — 75 cells, 0 fail

`certification`, `task`, `concept`, `search`, `lesson_index` × en/es-419/pt-BR
× 5 certifications, unauthenticated, against the deployed function.

### 2.2 NOT covered, and never checked from outside until today

| surface | status | note |
|---|---|---|
| `get_lesson` / `mcp.lesson` | **EXERCISED 2026-09-22** | key minted, used, revoked 17s later. 401 without, 200 with: 6 blocks in en, es-419 and pt-BR |
| `get_rubric` | **partly** | the paid rubric path answers 200 with a key through `courseware-read`; the MCP tool is still unexercised -- I sent `task_code` and it accepts `code` |
| the credential path | **checked today, first time from outside** | below |

**The paid surfaces were the untested ones. They are now tested.** Every
refusal the suites recorded was equally consistent with a working paywall and
with a tool that serves nobody — `check-mcp.mjs` said so in its own output for
as long as it has run. A key minted, used and revoked within 17 seconds settled
it: **401 without, 200 with, in all three languages, and the Spanish lesson
body is real text.** The cells return to NOT EXERCISED now the key is revoked,
which is correct — the measurement is recorded here, not asserted by the suite.

### 2.3 The credential path — checked from outside, today

Resolved by reading the identifier URLs **out of the signed document** rather
than from documentation:

| URL the document names | result |
|---|---|
| `id` → `/credentials/SM-AI-I-ZZMV-JPC8` | **200**, 55,527 B, `application/vc+ld+json` |
| `issuer.id` → `/issuers/certidemy` | **200**, 622 B |
| `achievement.id` → `/issuers/certidemy/achievements/SM-AI-I` | **200**, 49,554 B |
| `credentialStatus.id` → `/issuers/certidemy/status/1#15` | **200**, 1,521 B |
| `statusListCredential` → `/issuers/certidemy/status/1` | **200**, 1,521 B |

**All five resolve. The credential identity path is healthy.**

**CLAUDE.md paired the right paths with the wrong host — CORRECTED.** Its
"Credential identity — immovable" section lists `/issuer`,
`/achievements/[code]`, `/status/[N]` on `credentials.certidemy.com`. Those
three 404 there. **They are real paths on `certidemy.com`**, which proxies the
same bytes through `lib/openbadge/proxy.ts`; the authoritative host nests them
under `/issuers/[slug]/`.

So neither half was wrong on its own and the combination 404s — which is worse
than a plainly wrong note, because each half survives a spot check. Corrected,
with the method recorded: read the URLs out of the signed document.

**The mandated byte-hash passes — on a different object than the instruction
names.** CLAUDE.md says to byte-hash before and after any `open-badge` deploy,
expecting `366981ac…`. That hash is the **credentials.certidemy.com**
document, measured today and matching exactly. The `open-badge` function
returns 622 bytes hashing to `cac1a733…`.

**~~And `open-badge` ignores its input~~ -- WITHDRAWN 2026-09-22, same day.**

The three observations below are real; the conclusion drawn from them was
wrong. **The function's parameter is `doc`, not `code`, and `doc` defaults to
`issuer`** -- so all three requests asked for the issuer profile and correctly
got it. Tested properly: `doc=credential` with a bogus code returns **404 not
found**, an empty code **400 code required**, an unknown doc **400**. It
verifies; nothing to fix.

Third time this week a probe's own malformed request was reported as a defect
in the thing probed, after `list_lessons` (a stale connector schema) and
`lesson_index` (a pooler I had exhausted myself). The shape is identical every
time: **the instrument was mis-aimed and the target was blamed.**

One small real item survives: a non-existent issuer slug answers **503 `issuer
not configured`**, which says *try again* about something that will never
exist. A 404 is the honest status.

The original, wrong finding:

```
open-badge?code=SM-AI-I-ZZMV-JPC8   HTTP 200   622B
open-badge?code=TOTALLY-BOGUS-CODE  HTTP 200   622B   (identical bytes)
open-badge                          HTTP 200   622B   (identical bytes)
```

A bogus credential code is answered with HTTP 200 and a document. Whether this
matters depends on whether anything routes to it — the four identifier URLs all
point at the Worker, which behaves correctly — but it is deployed, public, and
answers 200 to anything. **[REORDER]**

`verify-credential` works and takes `code`, not `credential_code`; the wrong
key gets a clean 400.

---

## 3. Every gate, and whether it can be seen to fire

32 gates. **18 carry a positive or negative control; 14 do not.**

**This census is LEXICAL and is a draft, not a measurement.** It greps for
control vocabulary. Its first run reported `check-mcp-wire.mjs` as having no
control — a script whose controls I wrote myself two turns ago — because I had
written them as `POSITIVE --` rather than `positive control`. A detector that
misses a known instance is the exact instrument failure this repository has
recorded three times. The counts below are a starting list for reading, not a
verdict.

**No control found:**

```
verify-invariants.mjs          audit-review-gate.mjs
verify-citations.mjs           audit-quotations.mjs
verify-rdfc-proof.mjs          audit-quotations-unmarked.mjs
verify-aimsf-translations.mjs  audit-grounding-compliance.mjs
check-anchor-proof.mjs         check-citation-correspondence.mjs
check-jsonld-safe-mode.mjs     check-migration-state.mjs
smoke-courseware.mjs           check-term-consistency.sql
```

**`verify-invariants.mjs` is on that list and it is the platform invariant
checker.** It has the VACUOUS mechanism — a check examining zero rows reports
its own emptiness — which is a real and valuable guard, and it is **not** a
positive control: nothing proves any of its seven invariants can still fail.
One of the seven is vacuous by construction today. **[REORDER]**

**"Last time it refused something" is not answerable for any of them.** No gate
here persists its outcomes. What is known is only what this session watched:
`verify-invariants` was seen red and then green; `check-hash-writers` refused
three scripts and was satisfied by declaring them; the grant-gap check moved
7 → 2 → 0; `_pg.mjs`'s count assertion was made to fire deliberately under
`_PG_TRUNCATE_AFTER_PAGES=1`. Everything else is a pass with no observed
failure, which is a candidate rather than a result.

---

## 4. The item bank still reflects the stubs

**Nothing downstream of a concept description was regenerated after the
rewrites.**

| | |
|---|---|
| AIMS-F concept descriptions rewritten | **2026-09-21** (migration 363, 154 descriptions) |
| AIMS-F practice items last written | **2026-09-13** |
| AIMS-F secure items last written | **2026-08-07** |
| live generated items on AIMS-F | **0** |

AIMS-F carries 350 live practice and 280 live secure items per language, all
written from the concept layer as it stood before the rewrite — the layer whose
154 descriptions were *"the concept's own name followed by a fixed tail,
byte-exact"*.

**The clearance that let those items through was sound on its own terms and
answered a different question.** The bank showed no signal against a control;
that is a fact about the items' measurable properties, not about whether the
source they were drafted from said anything. `CONCEPT-REVIEW-VERDICT` recorded
the hollowness on the concept side and did not carry the inference downstream.

**This is not an argument for regenerating 630 items.** It is an argument that
"AIMS-F is clean" currently rests on a measurement taken before its source
changed, and nobody has said what the bank would look like if drafted from the
descriptions now in place. **[REORDER]**

The same question applies, unmeasured, to every certification whose concept
descriptions were edited this week: ISMS-F (21 initialism fixes + batch
rewrites), AIMS-IA and ISMS-IA (batches B–E).

---

## 5. What I claimed this week on database evidence alone

Listed because the director asked for it, and because the pattern is the point
rather than any single row.

| claim | evidence at the time | status now |
|---|---|---|
| "AIMS-F released and serving 2,544 rows" | view query | **was false on the wire** for every non-English caller from 364 until 365 |
| "AIMS-IA es-419 158/158 serving" and the three siblings | `mcp.concept` as admin | **was false on the wire**; corrected, now verified at the endpoint |
| "2,542 cleared rows serve" | gate predicate in SQL | **now true and endpoint-measured** (87.3%, 3,018/3,458) |
| lesson body counts in FRIDAY-READINESS (43/49, 1/35, …) | view/column query | **not re-verified**; §1.2 shows the column-vs-function trap sits under exactly this number |
| "the three latent views" | `has_schema_privilege` reasoning | **withdrawn** — never latent |
| "a partner cannot read the whole catalogue" | one unpaced run vs one paced run | **withdrawn** — confound was rest, not pacing |
| "`list_lessons` returns fields its schema forbids" | a connector's cached schema | **withdrawn** — zero tools do |
| ISMS-F / AIE-I blocked-draw reasons | review-row query | **consistent with the wire**: fallback counts match refusals exactly |

**Eight claims. Three were false, three were withdrawn, two survived.** Every
one of the false or withdrawn claims had a database query or a single
observation behind it, and every correction came from either the endpoint or a
second measurement with the confound removed.

**The claims still outstanding on database evidence alone are the lesson-body
numbers in FRIDAY-READINESS**, and §1.2 says the trap they were computed
through is live.

---

## Section 8, re-ordered against this

The monolingual leak gap is a real coverage limit and it is **not** the most
important thing on this list. It concerns text nobody can currently measure.
Everything above concerns text that is being served now.

Proposed order, for the director to rule on:

1. **The 12.8M characters of unread served lesson body** (§1.2). Largest
   unreviewed corpus on the platform, it is paid content, and the gate that
   was believed to hold it is armed on 22% of it.
2. **Exercise the paid surfaces** (§2.2). `get_lesson` and `get_rubric` have
   never been called with a key from outside. One key turns two permanent
   "NOT EXERCISED" cells into evidence.
3. **CLAUDE.md's credential paths** (§2.3). One-line documentation fix on the
   most safety-critical URLs on the platform; and decide whether `open-badge`
   answering 200 to a bogus code is live or vestigial.
4. **The 232 domain/module rows** (§1.3) — cleared by column default, with no
   review table in existence.
5. **`verify-invariants` has no positive control** (§3), and it is the thing
   that tells us the platform is sound.
6. **The AIMS-F bank against its rewritten source** (§4) — a measurement, not a
   regeneration.
7. Then the original section 8: monolingual leak gap, ISMS-F quality tail, the
   916-row read, 42006.
