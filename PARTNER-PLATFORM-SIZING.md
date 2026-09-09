# PARTNER-PLATFORM-SIZING.md

**What this is:** the measured size of one change — partner-authored
certifications, delivered on this platform, under a partner issuer, operated by
partner admins. Every number here was queried against the live database or
grepped from both repositories on **2026-09-08**.

**This is a scoping record, not a design.** It says how big the change is, what
order the pieces have to come in, and which questions are still open. It
proposes no schema.

---

## 0. The governance decision, made

> **PARTNERS ARE THE CERTIFICATION BODY FOR THEIR OWN SCHEMES. Certidemy is the
> platform.**

Under ISO/IEC 17024 the certification body owns the competence claim: it defines
what the credential attests, sets the standard, and decides who meets it.
Certidemy cannot own that for a scheme it did not design.

**Adjudicating an appeal on a partner's subject matter would mean asserting
competence Certidemy does not have, in a domain it did not write the JTA for.**
A candidate appealing a result on a partner's scheme is disputing a judgement
about that partner's competence model. There is no honest way for the platform
to uphold or deny that.

**The same reasoning runs in the other direction, and it is the half that
protects us.** A partner's indefensible cut score, unvalidated JTA or thin item
bank is the partner's exposure. If Certidemy adjudicated their appeals it would
be adopting their standard-setting as its own, and every defect in their scheme
would become a defect in ours.

**This settles the only genuinely ambiguous item in the recon.** The two
`appeals` policies are **not** body-level. They join the operational set and are
scoped to the partner through `can_read_issuer()`, exactly as
`issuer_api_keys` and `issuer_webhooks` already are.

**The operational count is therefore 17 + 2 = 19 policies**, not 17.

The four LTI policies remain genuinely open (§6). Everything else is decided.

---

## 1. The finding that matters: half of this is already built and running

**The credential half is done. It is in production. Nothing has connected it to
a certification.**

That is the whole gap, and it is why this change is smaller than it looks from
the `is_platform_admin()` count.

### What already works, today, multi-tenant

**A partner issuer holds its own keys and signs its own credentials.**

| issuer | company | verification | key + Vault | certs | credentials | achievements |
|---|---|---|---|---|---|---|
| `certidemy` | — | — | yes | **13** | 15 | 12 |
| `durgical` | yes | attested | yes | 0 | 0 | 1 |
| `test-partner-02` | yes | domain | yes | 0 | **6** | 2 |

`test-partner-02` holds **six live credentials**, each signed with its own
Ed25519 key from its own Vault secret. All six carry
`certification_id IS NULL` — the column is nullable, and three of the fifteen
achievements have no certification behind them at all.

**The tenant predicate exists in the database and is in use.**
`can_read_issuer(uuid)` — `STABLE SECURITY DEFINER` — resolves
issuer → `company_id` → `team_members` with `role = 'team_admin'`, and its own
comment names the scoping property: *"holding the role at company A is not
permission to read company B's keys."* It backs **eight policies**:
`issuers`, `achievements`, `achievement_alignments`, `achievement_results`,
`credential_results`, `issuer_api_keys`, `issuer_webhooks`,
`webhook_deliveries`.

**The same predicate exists in application code.**
`functions/_shared/authorize.ts:80` exports `requireIssuerAccess(svc, actorId,
issuerId)`, which performs the identical resolution and refuses any issuer whose
`company_id` is null — *"That is the certidemy issuer itself, which belongs to
no partner."* It backs **eight functions**: `create-issuer-api-key`,
`create-partner-achievement`, `update-partner-achievement`,
`issue-credential-batch`, `issue-credential-console`, `revoke-issuer-api-key`,
`upload-achievement-image`, `lti-launch`.

**Every Open Badges 3.0 identifier is already issuer-parameterised.**
`functions/_shared/ob3.ts`:

```
issuerUrl(i)        = ${i.base_url}/issuers/${i.slug}
achievementUrl      = ${issuerUrl(i)}/achievements/${code}
statusListUrl       = ${issuerUrl(i)}/status/${n}
credentialUrl       = ${i.base_url}/credentials/${code}
verificationMethod  = ${i.base_url}/issuers/${i.slug}#${i.key_id}
```

`buildIssuerProfile(issuer)` emits the `Profile` document — `id`, `name`, `url`,
and a `Multikey` verification method — entirely from the `issuers` row.
`issuers_active_requires_keys` refuses to let an issuer go active without
`vault_secret_id`, `public_key_multibase` and `key_id`.

**Credential-side uniqueness is already issuer-scoped:**
`achievements_issuer_code_unique (issuer_id, code)`,
`credentials_idempotency_unique (issuer_id, idempotency_key)`,
`credentials_status_list_index_uniq (issuer_id, status_list_index)`.

### What is missing

`certifications.issuer_id` is `NOT NULL` and **every one of the 13 rows points
at `certidemy`**. The column is already the tenant key. Nothing uses it as one.

Downstream of it, fourteen tables carry **neither** `company_id` nor
`issuer_id` and reach a tenant only by joining upward:

`domains` · `tasks` · `concepts` · `task_concepts` · `modules` · `lessons` ·
`lesson_sections` · `lesson_tasks` · `quiz_questions` · `question_concepts` ·
`jta_versions` · `simulations` · `source_documents` · `document_chunks`

**So the work is not building multi-tenancy. It is extending a multi-tenancy
that already carries real credentials to the content and examination side.**

---

## 2. The four steps, in order

The order is not preference. Step 1 is a hard prerequisite for step 4, and steps
2 and 3 are independently safe to do at any time.

### Step 1 — Two constraints and a publication gate

**This is the largest step, it is worth doing regardless of partners, and the
framing this document first used for it was wrong.**

> **"MOVE THE INVARIANTS INTO THE DATABASE" IS NOT THE INSTRUCTION.** Four of the
> six are not integrity constraints at all. **A constraint says this state is
> impossible; a gate says this state cannot be published.** A constraint has to
> hold at every instant, including while a bank is half-built — and enforcing the
> item floors at write time would forbid writing the first item. Treating all six
> as constraints would make the tables unwritable.

**The firewall, the item floors, the trilingual-group rule, the four-option
floor, the cue guard and the blueprint-fill check all live in
`scripts/verify-cert.mjs` — a script run from a terminal, by hand, by whoever
remembers.**

What the database actually enforces on `quiz_questions`:

- `trg_item_bloom_matches_task` — an item's Bloom level must equal its task's
- `trg_prevent_delete_presented_item` — an answered item cannot be deleted
- four CHECK constraints, all vocabulary: `pool IN ('practice','secure')`,
  `status IN (...)`, `visibility IN (...)`, `difficulty 1-5`

**`question_concepts` — the join table the firewall is defined over — has zero
triggers and zero CHECK constraints.** No database function references the
secure-pool rule; the only routine mentioning both `pool` and `secure` is
`get_session_review`.

So the firewall holds today for one reason: **the generator does not write
concept links onto secure items**, and `verify-cert` notices afterwards if
something does.

> **THE CASE FOR DOING THIS WITHOUT PARTNERS AT ALL.** A wrong statement typed
> into the SQL editor — the way every migration in this repository is run —
> breaks the firewall on a live certification, and **nothing objects.** No
> constraint fires, no trigger raises, no error appears. The break is visible
> only when a person remembers to run a script, and this repository's recorded
> failure mode is silent success. The invariants are correct. They are simply not
> enforced anywhere a mistake can reach them.

> **AND WHY IT IS A HARD PREREQUISITE FOR PARTNERS.** A partner authoring in a
> browser never runs `verify-cert.mjs`. They will not clone the repository, set
> `CERT_ID`, or read the baseline table. **Until these rules are enforced by the
> database, a partner-authored bank has no guard at all** — not a weaker guard,
> none. Every rule that makes a Certidemy bank defensible would be absent from
> theirs, and the platform would be hosting and signing credentials backed by an
> examination nothing checked.

#### The six, classified by what the database can express

| invariant | mechanism | validates against live data? |
|---|---|---|
| Secure pool carries no concept links | **2 row triggers** | **yes** — 0 violations today |
| Four-option floor | **CHECK** | **no** — 36 live items below it |
| Per-item length-cue escape | **row trigger** | changes the rule (see below) |
| Trilingual group holds 3 language rows | **publication gate** | 151 items carry a null group id |
| Item floors, >=8 secure / >=10 practice per task per language | **publication gate** | n/a |
| Pool can fill a form at the declared blueprint | **publication gate** | n/a |

**Two are constraints.** The firewall is cross-table, so not a CHECK, but a
`BEFORE INSERT OR UPDATE` row trigger on `question_concepts` that looks up
`quiz_questions.pool` — plus a second on `quiz_questions.pool` itself, because
the violation can be created from either side by flipping an item
practice-to-secure while links already exist. Both are single-row lookups, and
both validate immediately: **zero secure items carry a concept link today.** The
four-option floor is `CHECK (jsonb_array_length(options) >= 4)`, a pure function
of the row.

**Four are publication gates, and the mechanism is already in the schema.**
`trg_guard_cert_has_active_achievement` fires `BEFORE INSERT OR UPDATE OF status
ON certifications` and runs one query. The floors, the blueprint fill, the
trilingual rule and the bank-level halves of the cue guard are the same shape: a
materialized count over the bank, evaluated once at the moment of publication
rather than once per row. That is what makes them affordable, and it is why they
cannot be constraints.

**A deferred constraint would not rescue the trilingual rule.** A `DEFERRABLE
INITIALLY DEFERRED` trigger checks at commit, which would work if all three
language rows landed in one transaction. They do not: `seed-questions.mjs`
upserts per language row, and translations arrive months later — pt-BR does not
exist for AIMS-IA at all.

**The cue guard is three checks wearing one name and they do not classify
together.** Position bias is a chi-square over the whole bank against a critical
value (`verify-cert.mjs:530-537`) — irreducibly statistical, a gate. The
strict-longest rate is a bank-level rate — a gate. Only the per-item escape test,
`keyLen - maxRival > max(KEY_LEN_MARGIN, KEY_LEN_PCT% of maxRival)` read from
`certifications.exam_blueprint`, is computable from a single row.

---

### The three decisions, which are the actual cost

**Almost none of this month is SQL.** The constraints are a day; the gate
function is a few queries in a pattern the schema already uses. What takes the
time is that writing them forces three decisions nobody has made.

**1. Thirty-six live items carry fewer than four options.** All `pool =
'practice'`, zero secure, across AIE-I and SM-AI-I. The CHECK is trivial to write
and cannot be enabled until they are resolved: **fix them, retire them, or add
the constraint `NOT VALID` and carry a documented exception.** Cheap to express,
not cheap to enable — and the gap between those two is the finding.

**2. Making the per-item cue check a row trigger changes the rule.** The current
bar is an escape RATE above 2%, not zero escapes; it deliberately tolerates a few
across a bank. A row trigger cannot express a rate, so enforcing it per row
tightens the standard every existing bank was generated and judged under.

> **THIS HAS ALREADY HAPPENED ONCE.** ISMS-IA generated 912 items at a 25ch/15%
> tolerance and then failed its own audit on **26 items sitting between the
> tolerance they were built with and the one they were judged by — none of them
> defective.** `verify-cert` now reads the tolerance from the same declaration
> the generator did, precisely so the two cannot diverge. **Tightening the rule
> silently, by moving it into a trigger, would repeat that failure with the
> database as the enforcer.** If the rule is to become absolute, that is a
> decision to take openly and to re-measure every existing bank against.

**3. A publication gate no partner can bypass also binds Certidemy.** That is the
point of it — a gate with an exemption for the platform is not a gate. But
Certidemy's own authoring workflow publishes by **running a script and reading
the output**, and a `BEFORE UPDATE OF status` trigger would refuse a publication
the script currently only warns about. Whether that is acceptable, and what
happens to a certification that is already live and would not pass the gate
today, is undecided.

**One more thing the data blocks:** **151 items carry `question_group_id IS
NULL`** — the ungrouped rows recorded in `CLAUDE.md` and in HANDOFF v9.5 §8. Any
companion `NOT NULL` on that column fails on live data, so the trilingual gate
has to tolerate ungrouped items, or those rows have to be resolved first.

> **STEP 1 IS CLOSER TO A MONTH THAN A WEEK, AND THE MONTH IS THE THREE DECISIONS
> RATHER THAN THE CODE.** Two constraints, one gate function, and three questions
> about what the platform is willing to forbid itself.

### Step 2 — Three global unique indexes become issuer-scoped

Only three indexes break when two certifications share a code:

| index | scope today |
|---|---|
| `certifications_code_key UNIQUE (code)` | **global** |
| `modules_slug_unique UNIQUE (slug)` | **global** |
| `lessons_slug_language_key UNIQUE (slug, language) WHERE slug IS NOT NULL` | **global** |

**Everything else is already per-certification and needs nothing:**
`concepts (certification_id, slug)`, `tasks (certification_id, code)`,
`domains (certification_id, code)`, `domains (certification_id, order_index)`,
`modules (certification_id, order_index)`,
`lessons (module_id, order_index, language)`,
`jta_versions (certification_id, version_string)`,
`certification_i18n (certification_id, lang)`.

> **TWO OF THE THREE ALREADY HAVE HAND-MAINTAINED WORKAROUNDS, AND THE FIX
> RETIRES AN AUTHORING RULE RATHER THAN ADDING ONE.** `STYLE-GUIDE-ISMS-IA` §1
> requires a cert prefix on `lesson_id` and `module_slug`
> (`isms-ia-01-01-audit-parties`, `ia-audit-function`), and SM-AI-II's modules
> carry `smii-`. `LESSON_AUTHORING_SPEC` §2 was corrected on 2026-09-08 to state
> the rule, because the spec's own examples would have collided. **That
> convention exists only because the constraint is global.** Scope the indexes
> and the prefix becomes optional style instead of a correctness requirement
> that a human has to remember for every file.

**`certifications.code` is the one with reach beyond the database**, and it needs
its own inventory before anything moves:

- **Public marketing route** — `app/[locale]/(marketing)/certifications/[code]`
- **Learner route segment** — `app/[locale]/(learn)/learn/[cert]/...`
- **Eight files resolve a certification by code** across
  `functions/` and `scripts/`, including `_shared/issue.ts`, `open-badge`,
  `render-asset`, `issue-credential-batch`, `create-partner-achievement`,
  `gen-jta-doc.mjs` and `verify-cert.mjs`
- **`credentials.certification_code` and `certification_name`** are
  denormalised point-in-time snapshot columns on every issued credential

**The signed OB3 layer does NOT break, and the reason is worth recording.**
`achievementUrl()` builds `{issuer}/achievements/{code}` from
**`achievements.code`**, which is already scoped `(issuer_id, code)`. All 12
certification-backed achievements happen to have `achievements.code =
certifications.code` — but that equality is an **artifact of migration 231's
backfill, not a constraint**, and the credential identifiers stay correct under
issuer scoping either way.

### Step 3 — Nineteen policies move to `can_read_issuer()`

Of the **45** policies referencing `is_platform_admin()` (out of 117 public
policies):

**19 are OPERATIONAL and must become partner-scoped.** Sixteen are the identical
`ALL / is_platform_admin() / is_platform_admin()` pattern on content:

`certifications` · `domains` · `tasks` · `concepts` · `task_concepts` ·
`modules` · `lessons` · `lesson_sections` · `lesson_tasks` · `quiz_questions` ·
`jta_versions` · `simulations` · `source_documents` · `document_chunks` ·
`domain_translations` · `task_translations`

Plus `certifications / catalog read certifications` (§6), and the **two
`appeals` policies**, per §0.

**Sixteen of the nineteen are the same policy written sixteen times.** That is
the honest measure of this step: one predicate, applied repeatedly, not nineteen
decisions.

**22 are GENUINELY BODY-LEVEL and stay.** Two are shared platform furniture —
`cert_categories`, `widget_definitions`. Twenty are learner-data reads where
**`is_platform_admin()` is already an OR-branch beside a tenant branch**
(`is_team_admin_of(user_id)` or `is_company_admin(company_id)`):
`audit_logs`, `chat_messages`, `chat_sessions`, `companies` (x2),
`company_certifications`, `company_invites`, `exam_attempts`,
`mock_exam_results`, `pass_predictions`, `profiles`, `quiz_attempts`,
`quiz_sessions`, `seat_batches`, `simulation_attempts`, `study_plans`,
`team_members`, `user_concept_mastery`, `user_lesson_progress`, `user_progress`.
**These block nothing** — the partner path already exists next to them, and
`is_platform_admin()` there is support and escalation, which should stay.

**The remaining 4 are the LTI policies**, still open (§6).

**19 + 22 + 4 = 45.** The classification is reproducible: bucket `pg_policies`
by table and command and the counts fall out as 16 content-ALL, 1 catalogue
read, 2 appeals, 2 furniture, 20 learner-data, 4 LTI.

> **THE ONE PERFORMANCE QUESTION, AND IT IS THE ONLY ONE.** None of the fourteen
> content tables carries a tenant column. Every one of them reaches a tenant by
> the same climb:
>
> ```
> content row -> certification_id -> certifications.issuer_id
>             -> issuers.company_id -> team_members(user_id, role='team_admin')
> ```
>
> **Four hops, evaluated per row, inside an RLS predicate. Five for `lessons`**,
> which has no `certification_id` and must reach it through `module_id`.
> `can_read_issuer()` is `STABLE SECURITY DEFINER`, so the planner can hoist it,
> but it is still a join per distinct issuer on every read of every content
> table. Whether that is acceptable, or whether the content tables need a
> denormalised tenant column, is a measurement nobody has taken. **It is the
> only open engineering question in steps 1 to 3.**

### Step 4 — Browser authoring

**The actual product, and last for a reason.**

There is no write path today. RLS permits a `platform_admin` to write
`quiz_questions` from a browser, but **no console UI does**, and the only two
INSERT sites are `certidemy-web/scripts/seed-questions.mjs:218` (reads
`content/questions/*.json`) and `supabase/scripts/gen-cert-secure.mjs:497`
(generated secure items) — both service-role, both from a terminal. Lessons load
the same way, from disk, through `load-lessons-direct.mjs`.

So step 4 is: a JTA authoring surface, a lesson authoring surface, an item
authoring or generation surface, and a review queue — all in a browser, all
tenant-scoped, all writing through the two constraints and the publication gate
step 1 puts in place.

**It is last because steps 1 to 3 are what make it safe, and because it is the
only step that is genuinely new software.** Steps 1 to 3 are enforcement and
scoping of things that already exist.

---

## 3. Decisions not yet made

### 3.1 Do partner certifications appear in the Certidemy catalogue?

**Default NO, opt-in per certification.**

**A curated catalogue is a claim.** A partner exam listed beside `SM-AI-II`
implies that Certidemy stands behind it — and §0 is the decision that Certidemy
explicitly does not. Listing is an endorsement the governance model withholds,
so it cannot be the default and it cannot be automatic on publication.

What an opt-in would have to settle: who approves a listing, what it asserts,
whether the card distinguishes a partner scheme visually, and whether
`CLAIMS-POLICY` governs the wording. None of that is decided.

### 3.2 `VERIFY_SITE_URL` is hardcoded

`functions/_shared/ob3.ts:350`:

```ts
export const VERIFY_SITE_URL = "https://certidemy.com";
```

Used at `ob3.ts:815` to build `${VERIFY_SITE_URL}/verify/${credentialCode}` —
**the human-readable verify link on every credential, including a partner's.**

This is the last single-tenant constant in a chain that is otherwise fully
issuer-parameterised. It may be correct: the verify page is Certidemy's
infrastructure, and hosting a verifier is not endorsing a claim. But it is a
platform host printed on a partner's credential, and it has never been decided —
only inherited.

(`SELF_HOSTS = ["certidemy.com", "certiglobal.org"]` in
`create-partner-issuer/index.ts:113` is a different thing: a refusal to let a
partner verify against a domain we control. That one is a deliberate gate and
needs no change.)

### 3.3 A partner cannot see their own draft

`certifications / catalog read certifications`:

```sql
(status = 'available') OR is_platform_admin()
```

Under this policy a partner `team_admin` cannot read their own certification
until it is `available` — which means they cannot see it while authoring it. The
policy has to widen for step 3 regardless; **what it widens to is the decision**,
because `available` is also what the public catalogue reads, and the two
readerships want different answers.

### 3.4 The four LTI policies

`lti_platforms`, `lti_deployments`, `lti_capabilities`, `lti_launch_skeleton`
are `SELECT / is_platform_admin()`. Platform integration configuration today.

**`lti_platforms` already carries `company_id`**, so the intent to tenant-scope
LTI was recorded at some point and never completed. Whether a partner registers
their own LMS platforms, or whether LTI stays a platform-operated integration,
is undecided.

---

## 4. The size, in one paragraph

Nineteen policies, of which sixteen are one policy repeated. Three unique
indexes, two of which already have hand-maintained workarounds that the fix
retires. One four-hop RLS join that needs measuring. **Six rules that
`verify-cert.mjs` enforces and the database does not — two of them constraints,
four of them publication gates — which is the real work, and which is worth
doing whether or not a single partner ever authors anything. Its cost is three
decisions, not the SQL.** And then the product: a browser authoring surface,
which is the only genuinely new software in the list.

**The credential half — keys, signing, issuer profiles, webhooks, API keys,
tenant predicates in both SQL and TypeScript — is finished and carrying real
credentials in production.** Nobody has connected it to a certification, and
that connection is this entire project.

---

*Recon 2026-09-08. Every figure queried against the live database or grepped
from `certidemy-supabase` and `certidemy-web`. No schema is proposed here.*
