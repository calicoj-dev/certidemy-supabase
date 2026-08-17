# HANDOFF v7.3 - The curriculum coverage analyzer, and what its first ruleset found

**Session date:** 2026-08-17
**Supersedes:** HANDOFF-v7.2 and its addendum

**Migration tip 220. Next free 221.** Three migrations this session: 218, 219, 220.
**Repos:** supabase pushed clean (`463ebe7`). Web untouched. Worker untouched, still
without a remote (v7.2 section 0.2 - still open).

The analyzer's data layer was designed and built. Its first ruleset was authored
from the actual Scrum Guide text and, on its first real run, found **67 English
items across the three Scrum certifications carrying superseded terminology.**

**Nineteen of those were read one by one and cleared as correct. Forty-eight have
not been read. NOTHING WAS CHANGED. No item was retired, no task was edited, no
statement was rewritten.** Section 6 is an open investigation with evidence
attached, not a decision. Read it before touching anything.

---

## 0. State summary

| | |
|---|---|
| Migration tip | **220** (218 spine, 219 runs, 220 seed) |
| New tables | 8 |
| Drift rules live | 12, English only, on SM-AI-I / SPO-AI-I / SD-AI-I |
| Authority sources registered | 2 (Scrum Guide 2020, Scrum Guide 2017) |
| Calibration fixtures on disk | 6, gitignored |
| Engine code written | **none** - deliberate, see section 8 |
| Items flagged | 67 English (32 secure), 19 cleared, **48 unexamined** |
| Items changed | **0** |

---

## 1. WHAT THE ANALYZER IS

Ingest a third-party syllabus, match it against a Certidemy blueprint, report
coverage, gaps, terminology drift and weighting divergence.

**One engine, two renderers.** Renderer A is internal prospect intelligence for the
sales team. Renderer B is consent-based self-service for a signed partner. Renderer
B is out of scope until the engine is calibrated on roughly 30 documents.

Pipeline order: ingest -> density guard -> framework detection -> segment
classification -> concept match -> drift detection -> weight comparison -> reverse
gap.

**The rule-based stages come first and they are the valuable ones.** Drift and
weighting cost nothing to compute and produced the strongest finding in every
document tested, including the one nobody expected: our own item bank.

---

## 2. ARCHITECTURE DECISIONS TAKEN

### 2.1 No subdomain. It stays on certidemy.com paths.

Considered `analyzer.certidemy.com` and a future `app.` namespace. Rejected.

Cookies do not cross to a subdomain - the lesson already paid for with
`credentials.certidemy.com`, which is why apex `/credentials/<CODE>` still serves
the viewer-aware copy. Broadening the session cookie to `.certidemy.com` would ship
it to `shop.certidemy.com`, a grey-cloud CNAME to Shopify. So a subdomain today
means a second auth boundary or a security regression, plus a second build pipeline
for a one-person team.

**Product separability comes from module boundaries, not DNS.** A future standalone
product gets its own apex and talks over an API; Cloudflare Pages takes multiple
custom domains on one project, so re-hosting is a hostname map.

### 2.2 The engine must not know which mode it is in

Two comparison modes exist:

- **Mode 1** (built): third-party syllabus vs **our** blueprint. Asymmetric. They
  supply nothing structured. This is the sales product.
- **Mode 2** (future): their syllabus vs **their** JTA. Symmetric. A conformance
  tool, and a different sale.

Therefore `analyze()` takes the blueprint as an **argument** from a
`BlueprintReader` interface and never reads `certification_id` internally. The
Certidemy implementation of that reader is where the firewall lives. An external
tenant's reader is a different implementation of the same shape.

`analysis_runs.reference_kind` accepts `external_scheme` today; a CHECK forces
`reference_certification_id` null in that state. Seam present, feature absent.

### 2.3 Companies are not split into partners and employers

Considered. Rejected. What differs between an employer and a reseller is
entitlement, not identity, and an employer running internal onboarding material
against SM-AI-I is Renderer B working exactly as designed. No entitlement table
until there is a feature to gate.

### 2.4 Prospects live in GoHighLevel, not here

`analysis_runs.ghl_contact_id` is the entire CRM link. No shadow prospect table.
One column supports attaching a run to a contact, starting a run from a contact's
website field, and pushing a verdict back as a funnel-stage tag through the
existing `sync-to-ghl` path.

**A GHL note is an internal surface, so CLAIMS-POLICY Class B does not bite. The
moment analyzer output becomes outbound email copy, it does.**

### 2.5 How concepts would be generated (design only, nothing built)

For a future JTA-authoring tool, recorded because it was settled this session:

> **A concept is a noun from the BoK. A task is a verb over concepts.**

Not derived from KSAs - that extracts a controlled vocabulary out of uncontrolled
prose and drifts. `CERT-SCHEMA-GUIDE` already has the direction right: KSAs come
*from* the statement and its concepts.

Pipeline: BoK -> candidate terms with citations -> human curation -> domains ->
tasks written as verbs over named concepts, so `task_concepts` is a byproduct of
authoring, never a repair pass.

A BoK needs only two properties to be usable: **citable** (stable locators) and
**versioned**. Not a taxonomy.

Observed granularity band from our own certs: SM-AI-I 109/51 = 2.1 concepts per
task, AIGRM-I 165/49 = 3.4, ISMS-IA 169/38 = 4.4. An imported JTA far outside
2 to 4.5 is a granularity flag.

**Concept reuse is worth watching.** AIGRM-I has 165 concepts / 174 links (9 reuse).
ISMS-IA has 169/169 - every concept used exactly once, which means the concept layer
is functioning as a task restatement rather than a shared vocabulary. Defensible for
an audit cert where each clause is touched once; worth surfacing rather than nobody
noticing.

**On Bloom in a future authoring tool:** the author must never see a Bloom dropdown.
They pick a verb from a controlled vocabulary and the level is derived - same
"computed, never asserted" rule as the blueprint. The skills line arbitrates
(BLOOM-VERB-RECONCILIATION got 5 of 16 backwards by reading the statement verb
alone). Analyze must carry a cost: "what is the cause, and where is it NOT stated in
your curriculum?" And Evaluate/Create leave the exam by the MCQ ceiling. Then show
the computed profile immediately and let the mirror do the arguing.

---

## 3. THE MIGRATIONS

### 218 - the provenance spine

`authority_sources`, `certification_authorities`, `authority_citations`,
`drift_rules`, `drift_rule_certifications`, `drift_rule_invariant_runs`.

**Name collision, caught the hard way.** `public.source_documents` ALREADY EXISTS -
it is the AI tutor RAG corpus from `002_rag_and_chat.sql` (cert-scoped, stores
`content_md`, chunked into `document_chunks`). `create table if not exists` skipped
it silently and the migration then failed several statements later on a
`comment on column`. Hence `authority_sources`.

> **RULE EARNED: pre-flight every new table name before writing the migration.**
> Second collision of this class after `information_schema.domains`.
> `select table_name from information_schema.tables where table_schema='public' and table_name = ANY(ARRAY['a','b','c']);`

**Drift rules are scoped to a source TRANSITION, not to a certification.**
`Development Team -> Developers` is a fact about the 2017->2020 Guide, not about
SM-AI-I. Cert-scoping would make one Guide revision a 72-row edit across three
certs - the duplication TERMINOLOGY-POLICY already eliminated once.
`drift_rule_certifications` carries applicability and the task link (task codes are
cert-scoped, so the task link cannot live on the rule).

**This design earned itself immediately - see section 6.2.**

**Two rule classes**, forced by the calibration corpus:

- `superseded` - a real transition. Both source ends required. ISO control
  renumbering (A.9.2.1 -> A.5.16) is mechanically this.
- `non_canonical` - the term appears in no registered edition. `Daily Sprint` is
  this; it has no legacy source, so a from/to pair cannot express it.

`authority_citation_id` is **NOT NULL**. A rule grounded in model training knowledge
rather than actual standard text cannot exist as a row.

`authority_citations.quote` is capped at 300 chars by CHECK. Bounded excerpt is
evidence; an unbounded one is a copy of somebody else's standard.

### 219 - runs and findings

`analysis_runs`, `analysis_findings`.

**The suppressions are structural.** Five CHECKs, not two: suppressed implies no
coverage; suppression states a reason; a reason implies suppression; a failed
density gate implies suppression; a framework mismatch implies suppression. The
SCRUMstudy 14% has nowhere to live in this schema.

Proven by negative test - the insert failed with
`analysis_runs_suppressed_has_no_coverage`. (Note: CHECKs evaluate before FK
triggers, so that test never validated the cert uuid; confirmed separately.)

**`analysis_findings.visibility`** (`internal` / `partner` / `both`) is the
Renderer A/B split as data, so a commercial note cannot leak because somebody forgot
a filter in a component. Anything not `internal` must carry an excerpt or a locator,
by CHECK.

**`divergence_pct` is a generated column.** Computed, never typed. This is where
TUV SUD allocating 1% to the Scrum Master role against our D5 at 22.5% lands.

**Calibration lives in the table** - `is_calibration`, `expected_coverage_pct`,
`expected_suppression_reason`, plus `engine_version` and `drift_ruleset_size` on
every run. Engine-versus-hand divergence becomes a query, not a spreadsheet.

**One judgment call, flagged in a `comment on constraint`:**
`analysis_runs_peer_not_prospect` forces `segment='certification_body'` to carry
`outreach_disposition='do_not_contact'`. TUV SUD is a certification body and might
one day be a legitimate partner target, which is the argument for dropping it. It is
a CHECK rather than engine logic because a do-not-contact a renderer can override is
worth nothing. One line to drop.

**RLS posture on all 8 tables: enabled, ZERO policies, no grant to anon or
authenticated.** Only `service_role` reaches them. The console must read through an
edge function. When Renderer A needs a direct read, add a `platform_admin` policy
AND a **column-scoped** grant - never a table-wide `GRANT SELECT`, which re-confers
every column and would expose `segment` and `outreach_disposition` to the partner
they describe.

### 220 - the seed

2 authority sources, 6 citations, 12 English rules, 36 applicability rows.

Both Scrum Guide editions were **fetched and read in full** on 2026-08-17. Every
rule was checked against both texts. Nothing was written from training knowledge.

**Deliberate omission: `Product Backlog grooming` is NOT seeded.** Neither 2017 nor
2020 uses it, so it looks like a clean `non_canonical` rule - but it may have
appeared in an earlier edition, and asserting otherwise from training knowledge is
the exact failure this schema prevents. Register the 2011 edition, run the
invariant, then add it.

**Quotes are NULL by design.** The locator ("2020 Scrum Guide, Section: Scrum Team")
is a complete citation for a report. Fill quotes later if richer evidence is wanted.

**`content_hash` is NULL on both sources.** Set it once the fixture text is on disk
and hashed, so the invariant runner can prove which bytes it tested.

---

## 4. THE RULESET

| # | class | legacy term | current term | sev |
|---|---|---|---|---|
| 1 | superseded | Development Team | Developers | high |
| 2 | superseded | self-organizing | self-managing | high |
| 3 | superseded | servant-leader | true leader who serves | high |
| 4 | superseded | potentially releasable | usable Increment | medium |
| 5 | superseded | Scrum roles | accountabilities | medium |
| 6 | superseded | Dev Team size three to nine | typically 10 or fewer | medium |
| 7 | superseded | time-box | timebox | low |
| 8 | superseded | Sprint Planning meeting | Sprint Planning | low |
| 9 | non_canonical | Daily Sprint | Daily Scrum | high |
| 10 | non_canonical | Daily Standup | Daily Scrum | medium |
| 11 | non_canonical | Sprint Zero | (none - deliberate) | low |
| 12 | non_canonical | ScrumMaster | Scrum Master | low |

### 4.1 The invariant, stated precisely

- `superseded` must not fire against its OWN authority source text.
- `non_canonical` must not fire against ANY registered edition.

The second form makes the class self-correcting: register the 2011 Guide later and a
wrong rule breaks the build automatically.

**Not yet automated.** `drift_rule_invariant_runs` exists; the runner does not. It
belongs in CI, reading a gitignored fixture and writing result plus hash.

### 4.2 POSTGRES REGEX IS NOT PCRE

Rule 11 shipped with `\b` and was **dead** - `\b` is the backspace character in
Postgres. Boundaries are `\m` (start), `\M` (end), `\y` (either). Fixed in DB and in
the committed file.

> **The self-match assertion is what caught it, and only the self-match assertion
> could have.** The smoke test passed, because a rule that never fires never
> produces a false positive. A dead rule looks exactly like a clean document.
> **This belongs in `verify-cert.mjs` as a permanent invariant** - the ruleset will
> grow to three languages and dozens of rules.

```sql
select legacy_term, match_mode, pattern,
       case when match_mode = 'phrase' then true
            else legacy_term ~* pattern end as self_match
  from public.drift_rules order by legacy_term;
```

### 4.3 es-419 and pt-BR are SMALLER than expected

Because the official translated Guides keep roles, artifacts and events in English -
TERMINOLOGY-POLICY rule 4 - **the English ruleset already fires on Spanish
documents.** The AulaUtil syllabus contains `Development Team`, `Daily Sprint`,
`Sprint Planning Meeting` and `Time-Boxing` as literal English strings.

So the es-419 ruleset is not a parallel translation of all twelve rules. It is the
small subset covering terms the official Spanish edition actually translates:
`liderazgo de servicio`, `auto-organizado`, `Equipo de Desarrollo`, and similar.

**Confirmed in our own bank:** presented item `fb13fb35` reads *"El Equipo de
Desarrollo sigue omitiendo el Sprint Retrospective"*.

**Fetching the official pt-BR Guide also settles HANDOFF-v2.9 deferred item 9**
(the pt-BR Scrum Guide title), carried unresolved for many sessions.

### 4.4 Rules 5 and 8 are mis-shaped, not mis-tuned

Measured against two calibration documents:

- **TUV SUD** was hand-scored **zero drift**. The ruleset fires twice: rule 8 on
  `Sprint Planning meeting` / `Sprint Review meeting` / `Sprint Retrospective
  meeting`, and rule 5 on *"live Scrum roles"* plus a topic block titled
  `SCRUM MASTER ROLE`.
- **The CSM blog** was hand-scored **6 drift flags**. The ruleset finds about half:
  rules 1 and 2 fire, but *"three primary roles"* misses rule 5 and *"During this
  meeting"* misses rule 8.

**So they are simultaneously too aggressive on syllabus tables and too narrow on
prose.** Loosening rule 5 is the wrong repair. Assessment: rule 8 is a genuine
finding and TUV's hand score was slightly generous (their document otherwise nails
the 2020 model including all three artifact-commitment pairings). Rule 5 needs a
different shape - "role" in ordinary English is not a terminology claim, and
flagging the cleanest document in the corpus on it is the false positive that costs
trust. **Unresolved. Needs a ruling.**

---

## 5. THE CALIBRATION CORPUS

`C:\Users\Juan\Documents\certidemy\fixtures\calibration\` - **gitignored in both
repos** (`463ebe7`). These are competitors' copyrighted syllabi; they are fixtures
on disk, never repository history, never database rows.

| file | type | hand coverage | key finding |
|---|---|---|---|
| `csm-blog-overview-csm-syllabus.txt` | ~1,400 words prose | ~29% | 6 drift flags; no Sprint Goal, no Product Goal, no commitments, no timeboxes |
| `agileplaza-scrumstudy-smc-syllabus.pdf` | ~60 words, bullets | ~14% | **Both suppressions fire**: SBOK framework mismatch AND density |
| `bcs-exin-agile-scrum-master-syllabus-v1-2-2020-05.pdf` | ~3,000 words, weighted LOs | ~38% | V1.2 May 2020 predates the Nov 2020 Guide. Large reverse gap (estimation, ROI, information radiators) |
| `aulautil-certiprof-scrum-master-ia-40h-es.pdf` | 40h, 12h Scrum + 28h AI | ~35% | Closest direct competitor. AI module vendor-anchored (Notion/Miro/n8n/Pinecone), never assessed. `Daily Sprint` confirmed verbatim |
| `tuv-sud-scrum-master-guide-2022-07.pdf` | certification body guide | ~49% | Hand-scored zero drift; ruleset disagrees (4.4). Allocates **1%** to the Scrum Master role |
| `scrummanager-scrum-master-manual-en.pdf` | 78pp, 7MB, scrummanager.com | not scored | **New.** Full manual, not a syllabus - a different KIND of input |

**Caveat to record:** the four PDFs are the documents as of today. The blog text was
re-captured. Where a source has drifted since hand-scoring, the hand score is an
approximate anchor, not ground truth, and that document needs re-scoring before it
can fail a build.

**TUV SUD is the natural first Mode 2 test case.** Its `K1-K6` depth levels are
per-topic Bloom bands - the closest thing to a machine-readable blueprint in the
corpus.

---

## 6. THE OPEN INVESTIGATION - 48 unexamined items

### 6.1 What was found

Running the ruleset against our own item bank, respecting
`drift_rule_certifications` scope, English only:

| cert | practice | secure | total |
|---|---|---|---|
| SM-AI-I | 17 | 21 | **38** |
| SD-AI-I | 8 | 7 | **15** |
| SPO-AI-I | 10 | 4 | **14** |
| **total** | **35** | **32** | **67** |

By term: `Development Team` 26, `servant-leader` 20, `self-organizing` 13,
`time-box` 4, `Scrum roles` 4.

**Spanish and Portuguese have NOT been swept.** Those rulesets do not exist yet
(4.3). Presented item `fb13fb35` proves contamination exists there.

### 6.2 Nineteen were read and CLEARED. Do not re-open them.

All 19 `servant-leader` hits under SM-AI-I task 5.4 were read individually. **Not
one is a defect.** Four of them explicitly teach the 2020 correction:

- *"A Scrum Master insists the 2020 Scrum Guide abandoned servant leadership and
  introduced a different philosophy. What is the accurate correction?"*
- *"...because the 2020 Scrum Guide dropped 'servant-leader,' Greenleaf's philosophy
  no longer applies to the Scrum Master. How should the Scrum Master respond?"*
- *"A colleague claims servant leadership was invented within the Agile movement.
  What is the accurate position?"*

The bank is more sophisticated than the rule. It knows the term is superseded, knows
the substance survived, and tests candidates on exactly that distinction - which is
what task 5.4's K field declares (*"Servant leadership concept (Greenleaf, 1970);
2020 Guide language shift to 'true leaders who serve'"*) and what task 5.7 exists
for.

> **THE LESSON, AND IT WAS LEARNED THE EMBARRASSING WAY.** A document *teaching*
> terminology drift and a document *suffering* from it look identical to a substring
> match. This false-positive class was predicted early in the session, then
> dismissed, then confirmed. **SM-AI-I is the contrastive-teaching case and it will
> keep tripping rules 1, 2, 3 and 5 while being more correct than any competitor
> document in the corpus.**
>
> Contrastive-context detection is a real engine requirement, not a nice-to-have.

**The applicability table also proved itself.** A first sweep that ignored
`drift_rule_certifications` produced 18 hits across AIGRM-I, AIMS-F, AIMS-IA, ISMS-F
and ISMS-IA - all false. In an ISO cert, *"the development team must document..."*
is ordinary English for the people who build software. Globally-scoped rules would
have produced 18 false positives on five certifications.

### 6.3 What is genuinely unexamined: 48 items

67 minus the 19 cleared. Unknown mix of true defects and further contrastive cases.
**32 of the 67 are secure pool** and could appear on a live form.

One concrete example found incidentally: secure item `69969045` reads *"The
**Development Team** keeps skipping the Sprint Retrospective..."* - straightforward
2017 terminology with no contrastive framing. It is also a near-duplicate of secure
item `5535addc` (same scenario, same task, both secure), which is a form-assembly
concern independent of terminology.

### 6.4 Presented items - the preservation question

Five items under task 5.4 have been presented, one attempt each:

| id | pool | lang | matches drift |
|---|---|---|---|
| `894d347d` | secure | en | servant-leader (cleared) |
| `f6c628d8` | secure | en | servant-leader (cleared) |
| `68fa0d74` | practice | es-419 | servant-leader (cleared) |
| `ce76198f` | practice | es-419 | no |
| `fb13fb35` | secure | es-419 | **Equipo de Desarrollo - NOT swept, NOT cleared** |

`fb13fb35` is the one that matters: Spanish, secure, presented, legacy terminology,
and no Spanish ruleset exists to have caught it systematically.

**Only one real credential exists** (`SM-AI-I-ZZMV-JPC8`, Julio M Rodriguez Perez).
Whether these attempts are his must be established before anything is touched.

**Preservation posture:**

- `trg_prevent_delete_presented_item` (migration 089) already makes a presented item
  undeletable. The floor is in the database, not in anyone's discipline.
- Retiring an item is routine bank maintenance and requires no credential action. A
  credential rests on the form **as administered at the time**; the evidence chain
  must survive, which is why items are retired and never deleted.
- The only case that touches a credential is an item scored against a candidate
  *and* wrong, and the remedy there is documented rescoring, not revocation.
- On 17024 specifically: this handoff states substance, not clause numbers.
  `COGNITIVE-MODEL.md` already flags that clause numbering must be verified against
  the purchased text before external use. **Do not cite clause numbers from memory
  in any remediation record.**

### 6.5 Task 5.4's statement - separate, still open

Statement: *"Apply servant leadership behaviors"*, stamped `3_apply`.
Skills: *"**Recognize** servant-leadership behaviors"*.

Two tangled questions:

1. **Terminology.** The statement asserts the legacy term flatly, one task before
   5.7 (*"Translate between legacy training terminology and the 2020 Scrum Guide"*).
   The stale JTA markdown carried `(NOTE: "true leaders who serve")`; the live
   statement does not.
2. **Bloom.** *Recognize* is Understand, not Apply. Per ASSESSMENT-ENGINE and
   HANDOFF-v3.0 section 6, **the skills line arbitrates** - and the skills line here
   disagrees with the stamp. Changing the level would force a profile recompute, a
   blueprint reset and item regeneration.

**Also found:** `ksa_is_provisional` lives on `task_translations`, NOT on `tasks`.
The English K/S/A have no provisional flag at all. HANDOFF-v5.5 item 4 describes 98
unreviewed rows; that count is about translations.

**No change proposed. Both questions need a session of their own.**

---

## 7. HOW TO BUILD THE ENGINE (nothing written yet)

**Pure TypeScript modules, not an edge function first.**

```
supabase/functions/_shared/analyzer/
  types.ts        Blueprint, DriftRule, Finding, RunGates
  normalize.ts    text in, clean text + word count out
  density.ts      (text, threshold) -> gate result
  framework.ts    (text) -> detected framework + evidence
  drift.ts        (text, rules) -> findings      PURE, DETERMINISTIC
  weights.ts      (extracted pct, blueprint) -> findings
  engine.ts       orchestrates -> { gates, findings }
```

No `Deno.*`, no `fetch`, no Supabase client inside these. Then
`scripts/analyze-local.mjs` caches rules and blueprint to a gitignored JSON, reads
the six fixtures, runs the engine, prints engine-versus-hand coverage. Iterating on
a regex must take milliseconds, not a deploy.

The edge function `analyze-curriculum` comes last and is thin: auth -> get text ->
`engine.analyze()` -> write rows.

> **INVERTED CONFIG TRAP.** Public OB3 endpoints need `verify_jwt = false` pinned.
> This function is the opposite: **`verify_jwt = true`, pinned explicitly**, because
> it is admin-only and reads competitor intelligence. Same lesson (pin by name),
> opposite value. Easy to get backwards on autopilot.

**Concepts must be OPTIONAL in `BlueprintReader`.** Stage 5 has to degrade to
task-statement matching when no concept layer exists, because external JTAs will not
have one. Build the fallback from the first commit.

**Then measure the degradation:** run against SM-AI-I twice, once normally and once
with the concept layer suppressed, across the calibration set. That number tells us
today what a Mode 2 analysis will feel like, and it is a free regression test
forever.

---

## 8. WHY NO ENGINE CODE EXISTS

Deliberate. The session ran: architecture -> schema -> ruleset -> first real run ->
**a finding large enough that writing more code would have been the wrong move.**

67 flagged items in our own bank, 32 of them secure, is a bigger deal than the
analyzer. It also validates the analyzer more convincingly than any competitor
document could.

---

## 9. NEXT SESSION - in order

1. **Sweep the Spanish and Portuguese banks.** Blocked on es-419/pt-BR rules, which
   are blocked on fetching the official translated Guides (which also closes v2.9
   item 9). Smaller than it looks - see 4.3.
2. **Read the 48 unexamined English items one at a time.** Separate true defects
   from contrastive teaching. Expect a meaningful fraction to be correct, as the 19
   were. **Do not batch-retire on a regex match.**
3. **Rule 5 needs a ruling** (4.4). Rule 8 appears sound.
4. **Establish whether the five presented attempts are Julio's** before any
   remediation touches a presented item.
5. **Automate the invariant runner** into CI, writing `drift_rule_invariant_runs`.
6. **Add the self-match assertion to `verify-cert.mjs`** (4.2). A dead rule looks
   exactly like a clean document.
7. **Then build the engine** per section 7.

**Carried from v7.2, untouched this session:**

- The worker repo (`certidemy\credentials-worker\`) still has **no remote**. It is
  the surface every credential's verification depends on and it exists on one disk.
- Julio may need to re-download his `.jsonld` if he took a copy before migration 217.

**Untracked in the supabase repo, not from this session:**
`scripts/fix-aims-ia-translations.mjs`, `scripts/probe-rdfc.ts`.

---

## 10. THE LESSON

v5.5 said the invariants cannot see whether a claim is true. This session says
something narrower and sharper.

**A rule-based detector is worth building, and the first thing it will find is your
own content.** The drift ruleset cost one migration, runs for free, and located 67
items in a bank that passed `verify-cert` at 29 pass / 0 fail. The invariants check
structure, coverage, cue neutrality, firewall isolation and Bloom alignment. **None
of them can see a superseded word.**

And the counter-lesson, which cost more:

**A detector that fires is not a detector that is right.** Nineteen of the first
nineteen hits were correct content being flagged by a correct rule, because the
content was teaching the very drift the rule detects. The rule was not wrong. The
items were not wrong. **The inference from "it fired" to "it is broken" was wrong**,
and it was made twice in one session before the item text was read.

> **Read the artifact. Every time. The rule tells you where to look, never what you
> will find.**
