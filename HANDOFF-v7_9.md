# HANDOFF v7.9 — The console has an Issuing section, and credentials carry results

**Session date:** 2026-08-20 / 21 (continuous with v7.6, v7.7, v7.8)
**Migration tip:** 241. Next free: 242.
**Repos pushed:** `certidemy-supabase`, `certidemy-web`.

---

## 0. WHAT CHANGED

v7.8 ended with the partner backend finished and nothing but UI left. This
stretch built the UI, then discovered two things the UI could not have worked
without, then added a transcript layer that was not on any list.

| commit | repo | what |
|---|---|---|
| (web) | certidemy-web | console Issuing section |
| `45a62d6` | supabase | 239: console reads issuing tables |
| `b125aaf` | certidemy-web | console-kit modal fixes |
| `fc45019` | supabase | revoke-issuer-api-key |
| `15565a3` | supabase | 240: credential_results |
| (supabase) | supabase | ob3 emits result[], gated on visibility |
| `ee8c4f0` | supabase | 241: certification results stay private |
| `eaf235f` | supabase | public results are never edge-cached |

---

## 1. THE CONSOLE IS THE PARTNER PORTAL

There is no separate portal and there should not be. `loadConsoleAccess`
already resolves three principals and already scopes `team_admin` to one
company. A `/portal` URL space would be the same code at two addresses, and the
two would drift.

**New section: `/console/issuing`.** Same page for both principals:

| | platform_admin | team_admin |
|---|---|---|
| issuers | picker across all | their one, no picker |
| achievements | any | theirs |
| API keys | any | theirs |
| webhooks + deliveries | any | theirs |
| verify / activate | yes | **no** |

One render path, deliberately. An admin looking at a partner's issuer sees
exactly what that partner sees, because it is the same component. A separate
admin view drifts, and the drift only shows up when a partner reports something
the admin cannot reproduce.

Files: `lib/console/issuing.ts`, `components/console/issuing-panel.tsx`,
`app/[locale]/console/issuing/page.tsx`, plus one nav entry in EACH arm of
`console/layout.tsx`.

**The nav has a trap and the layout documents it**: *"add it in BOTH arrays or
marketing loses it."* Issuing is FOR partners, so adding it only to the admin
arm would hide it from the people it exists for -- and look fine, because the
person testing is an admin.

**A partner with no issuer sees a pitch, not an empty page.** Somebody who
bought seats and does not know they could be issuing their own signed,
anchored credentials will never ask for it.

### The empty state was a BUG, not an empty state

/console/issuing rendered that pitch to a platform_admin who owns two issuers.

`loadIssuing` is failure-tolerant -- any query error degrades to an empty
section rather than throwing, because a console page should render thin rather
than 500. Migration 185 had revoked `public.issuers` from `authenticated` with
the note "no client role reads this table directly". The console reads with a
USER-scoped client. So the select 42501'd and a permissions error rendered as
a product pitch.

**Both properties are real, and the second is the cost of the first.** The fix
is not to remove the tolerance. It is that *degrading silently* and *degrading
to a specific empty state* are different things: "no issuers yet" and "we could
not read your issuers" must not render identically. `IssuingSnapshot` should
grow an `error` flag. **NOT DONE.**

---

## 2. MIGRATION 239 — GRANT FIRST, THEN RLS

The trap, stated in Juan's own notes and hit anyway: **the table-level GRANT is
checked BEFORE row-level security.** 185 revoked the grant outright, so policies
alone would have changed nothing.

Seven grants, seven policies, one predicate.

**`can_read_issuer(uuid)`** — platform_admin, or the team_admin of the company
that owns THIS issuer. Every policy delegates to it. Five hand-written
predicates would be five chances to disagree, and the one that drifts is the
one that leaks. It mirrors `lib/console/access.ts` and `_shared/authorize.ts`:
three layers, one rule.

### COLUMN-SCOPED, and this is the part that matters

A table-wide `GRANT SELECT` confers every column, **including ones added
later**, and silently overrides a column-level `REVOKE`. So the grants name
their columns.

Never granted: `issuers.vault_secret_id`, `issuer_api_keys.key_hash`,
`issuer_webhooks.secret_id`. Verified live — all three `has_column_privilege`
checks return false.

A new column on any of those tables is unreadable until somebody adds it to the
grant. That is the correct default.

`verification_token` IS granted: a partner needs it to publish their well-known
file, control of the path is the proof rather than knowledge of the string, and
the policy scopes it to their own issuer.

### Achievements are readable when active

An active achievement is served anonymously by open-badge at
`/issuers/<slug>/achievements/<code>`. Restricting the row while the document
is world-readable would be theatre. Drafts are the exception.

---

## 3. CONSOLE-KIT MODAL — TWO FAULTS THAT COST WORK

Shared by every console modal, not just the new ones.

**Tall forms ran off the screen.** The overlay scrolled but the modal had no
height limit, so the title was above the viewport and the buttons below it at
once. Now capped at `100vh-2rem` with the body scrolling inside, so the header
and actions stay put.

**A stray backdrop click discarded everything.** `onClick={onClose}` with no
confirmation and no draft. Now an optional `dirty` prop suppresses
close-on-backdrop **only** — the X and Cancel still work, because a modal you
cannot leave is worse than one that forgets.

`dirty` is optional and undefined by default, so CreateCompanyModal,
AddBatchModal and IssueDirectModal are unaffected.

---

## 4. THE TRANSCRIPT LAYER (240, 241)

Not on any prior list. Built because a university or a professor recording a
syllabus and marks is a real customer, and the schema was one table away.

### Two objects, constantly confused

| | what | scope |
|---|---|---|
| `achievement_results` (231) | the SHAPE. "There will be a Percent, passing is 70." | every holder |
| `credential_results` (240) | what THIS holder got. "92." | one person |

OB 3.0 calls the first `ResultDescription` and the second `Result`, and the
second lives on `credentialSubject`, not on the Achievement. Putting a mark
anywhere near the first would make one student's grade part of the course
definition every other student's credential points at.

### The privacy decision

`credentials.results_visibility`, default **`holder`**.

A credential document is fetchable by anyone holding its URL. "Cum laude" on a
diploma is meant for strangers; "62 on the midterm" is a data-protection problem
in every jurisdiction this platform sells into.

The mechanism is the one that already existed for the salted identifier: **two
separately-signed documents, decided before signing**, not one document and a
filter. A field cannot be stripped after signing — the stripped copy would fail
verification.

**Unguessable URL is not access control.** It is one forwarded email from being
a link on a noticeboard.

### 241 — Certidemy can never publish results

`list-credentials` and `get-company-detail` both carry: *"score_pct is never
selected, never returned."* An exam score does not leave the server.

240 knew nothing about that, and one UPDATE would have put a Certidemy exam
result on a public document. 241 makes it structural: `certification_id is null
or results_visibility = 'holder'`. The rule lived in two source comments and one
person's memory; now it lives in a CHECK.

### Results are inside the signed document

`trg_credential_results_bump` bumps `material_updated_at` on insert, update AND
delete of a child row — which no trigger on `credentials` could ever see.

Grades usually arrive AFTER the badge, so this is the normal path, not an edge
case. **A bump means that credential needs re-anchoring**, which is the cost of
recording a mark after the fact. With a professor entering marks weekly this
happens constantly, and `--rebuild` on `build-credential-anchor.mjs` stops being
a nice-to-have.

### THE CACHE FLAW, found and fixed

`results_visibility` is a toggle that changes the PUBLIC document **without
changing `material_updated_at`** — because the material did not change, only who
may see it. Nothing invalidated the edge copy, so flipping to public was
invisible for up to 24 hours. It was only ever observed with a cache-buster in
the URL.

Fixed: a credential with public results is served `no-store`. Those lose edge
caching; everything else keeps it.

**NOT fixed by bumping `material_updated_at`.** That timestamp is inside the
signed proof; moving it to bust a cache would re-date the document and break its
anchor for a change the document does not contain.

---

## 5. `resultType` — WHAT safe MODE IS FOR

The first credential with a result returned 500. The log said:

```
Dropping property that did not expand into an absolute IRI or keyword.
property: "resultType"
```

**`resultType` is not a property of `Result` in OB 3.0.** It belongs to
`ResultDescription`; a Result takes its type from the description it references.
It was invented.

**Without `safe: true` this would have shipped.** The property would have been
silently dropped from the N-Quads, the signature would have covered a document
missing a field, and both proofs would have verified against it. The comment
above `rdfCanonize` predicts exactly this failure — here is the instance.

Now `certidemy:resultType`, which expands because a colon makes it parse as an
absolute IRI. Same reason `certidemy:jtaVersion` and `certidemy:domainCode`
already pass.

Every remaining bare key in an emitted Result is a real OB 3.0 property:
`type`, `resultDescription`, `value`, `achievedLevel`, `status`.

---

## 6. LIVE STATE

```
issuers            2   certidemy, test-partner-02
achievements      12   11 Certidemy Certifications + 1 partner Course
credentials       10   7 specimens, 2 Certidemy, 1 partner
credential_results 1   Percent 92, "Final assessment", Completed
migration tip    241
```

**`SCRUM-BOOTCAMP-2-T7ZQ-755P` is left `results_visibility = 'public'`** with a
92 on it, served `no-store`, verifying 7/7 including both tamper rejections.
Its hash no longer matches its anchor leaf — `holder_email` was edited by hand
in v7.8 and results were added since. Expected. Do not "fix" it.

Certidemy's `SM-AI-I-ZZMV-JPC8` is unchanged at
`366981ac5a547b6c7aa943f66eecd3c8f75ccf5078bdc30b594f4784a109a796` through
every change in this stretch, verified before and after each deploy.

---

## 7. OPEN

**Next, in dependency order:**

1. **Achievement structure editor** — group/task repeatable form in the New
   Achievement modal, producing `achievement_alignments`. One URL by default,
   a checkbox reveals per-task URLs. **No backend needed**;
   create-partner-achievement already accepts `alignments[]`.
2. **`set-credential-results`** — nothing writes `credential_results` except
   raw SQL, and the visibility toggle needs the same scoped authorization.
3. **A partner-visible credentials list** — `/console/credentials` is
   platform-admin-only; a partner cannot see their own issued credentials at all.
4. **Results editor** on a credential row, depends on 2 and 3.
5. **Learn-more panels** for API keys and webhooks. The audience is a person
   teaching a weekend class, not a developer.

**Still open from v7.8:**

6. `IssuingSnapshot.error` so a failed load stops looking like an empty one (§1).
7. `--rebuild` on `build-credential-anchor.mjs`, keyed on stale `doc_version`.
   Now load-bearing, because every recorded grade re-dates a credential.
8. `CERT-PUBLISH-CHECKLIST.md` §6 — the three-things-move-together rule.
9. es-419 / pt-BR accents on the six anchor strings.
10. Four certifications have no specimen: AIMS-F, AIMS-IA, ISMS-F, ISMS-IA.
11. "Hosted by, not endorsed by" on the verify page for non-certidemy issuers.
12. Super admin context switcher — a REAL `team_members` row making Certidemy
    the zeroth partner. **Currently there is no way to see the partner view.**
13. Certificate designer (233 storage ready, nothing reads it).
14. LTI 1.3 — build, claim compatibility, certify when a deal needs it.
15. `upsert-issuer-webhook` — webhooks are read-only in the console.
16. Resolver-level SSRF check in the webhook dispatcher.
17. SVG badge upload, once there is a sanitiser.
18. `normalize-eol.mjs` copied into certidemy-web.
19. `229_partner_leads` not wired to company creation.

---

## 8. WHAT THIS STRETCH TAUGHT

**Failure-tolerance and a plausible wrong answer are the same code.** The
loader's header says a console page should render thin rather than 500, and that
is right. It also turned a permissions error into a product pitch shown to
somebody who already owns two issuers. Degrading gracefully and degrading
*informatively* are separate decisions.

**A guard that only ever passes is not checking anything.** Three post-conditions
failed this stretch on a wrong EXPECTED VALUE rather than wrong code:
`readSigningKey` surviving in the status branch, `{anchorBlock.hash}` appearing
twice, `"cache-control": cache` appearing twice. Every time the guard was right
and the arithmetic was wrong. That is the tradeoff working.

**Anchors are matched against the ORIGINAL source, all of them, before any
replacement runs.** An edit whose anchor is the OUTPUT of an earlier edit can
never match. Cost one run.

**Byte-hash before and after, every time, no exceptions.** Six shape-adjacent
changes this stretch, all predicted neutral, all confirmed neutral — and two
earlier in the session predicted the same and were wrong.

**Read the error, not the symptom.** The 500 on a credential with results was
diagnosed from one log line naming the exact property. Two guesses beforehand
(missing grant, PostgREST embed) were both wrong and both plausible.

**`select` is a PowerShell alias.** SQL pasted into the terminal four or five
times this session. Anything starting with select/insert/update/alter/create
goes in the browser; anything starting with cd/git/node/curl.exe goes in the
terminal.
