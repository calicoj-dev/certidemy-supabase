# HANDOFF v8.2 — What a credential means, on the page

**Session date:** 2026-08-21 → 22 (continuous with v7.6 through v8.1)
**Migration tip:** 242. Next free: 243. **No new migrations this stretch.**
**Certificate renderer: 6.**
**Repos pushed:** `certidemy-supabase`, `certidemy-web`.

---

## 0. WHAT THIS STRETCH WAS

v8.1 finished the partner console. This stretch answered a different question:
**what does a credential MEAN to somebody who receives one?**

Three things came out of it. The verify page now shows what a credential covers
instead of hiding it in a modal. The dashboard shows who issued what. And a
partner can attach real, recognised skills that an employer's tooling
understands.

---

## 1. THE COVERAGE SECTION — OUT OF THE MODAL

Every competency, its domain, and that domain's share of the exam already
travelled inside the credential. It was reachable only through a button called
"Check Open Badge data", in a tab called Competencies, inside a modal that opens
on a developer-facing Checks tab.

**Credly's entire value proposition is telling an employer what a badge means.**
Certidemy carries richer data — a blueprint with weights, not skill chips
somebody typed — and had it filed under diagnostics.

Now server-rendered on the page. No client JavaScript: an employer following a
link should not need a round trip and a click, and a page whose substance only
exists after hydration cannot be indexed.

### The source changed, and this is the important part

First built reading the credential DOCUMENT. Wrong for a certification:

| | document | blueprint |
|---|---|---|
| language | one, no language map | `?lang=` returns es-419 / pt-BR |
| passing score | absent | `passingScorePct` |
| provenance | a projection | the authored scheme |

A Spanish verify page was showing English domain titles **beside a fully
translated modal**. The blueprint reads from the database, which has the
translations.

So: **certification → blueprint, partner → credential document.** Not a
workaround. A certification's coverage is a published scheme; a partner's is
whatever they wrote into their achievement.

The partner path stays untranslated because there is nothing to translate to —
`achievements.criteria_narrative` is a single column. Making partner
achievements multilingual is a schema change.

### Layout

`max-w-xl` on a 1920px screen is a column with two thirds of the viewport empty.
Now two columns above `lg`: verdict full width, then credential detail beside
coverage. Mobile unchanged.

A sticky coverage column was considered and rejected — 53 competencies across
five disclosures is taller than most viewports, so it would stick and then
scroll anyway, which reads as a bug.

---

## 2. ESCO SKILLS — THE WHOLE INVESTIGATION

### What Credly actually does

An LLM reads the badge description and criteria and suggests skills; the issuer
selects from those or types their own. Typed skills are matched against a
normalized skills database — Pearson's ontology, 5,000+ occupations and 200,000+
job titles. Matched skills get a checkmark and carry labour-market data.
Unmatched ones still display, without it. Guidance is 6–10 skills, three words
or less.

So: LLM-suggested → picked from an ontology → or free-form.

### A holder can already import a Certidemy badge into Credly

**No partnership, no integration, no fee.** Credly accepts external badges
meeting OB 2.0 or 3.0, uploaded as .png, .svg or .json — the baked PNG is
exactly that. Credly parses the metadata, verifies authenticity, and extracts
**any skills listed in the metadata**, matching them to its ontology.

Two limits: imported badges are excluded from a Credly transcript, and
issuer-specific endorsements cannot be verified.

**This is why the picker is worth building.** "Any skills in the metadata" means
`alignment[]`. A free-typed syllabus will not match Pearson's ontology.
"Agile project management", picked from ESCO, very likely will.

### AUTOMATIC MATCHING WAS TRIED AND IT FAILED

Certidemy's 107 curriculum concepts were run against ESCO's search API. Twenty
sampled. **Roughly three were defensible.**

| concept | ESCO returned |
|---|---|
| Cynefin framework | manufacture framework sections |
| Empiricism under acceleration | control the performance of the vehicle |
| Scrum Master serves the Product Owner | **audio mastering** |
| Adaptation | utilise machine learning |
| The five Scrum Values | software design methodologies |

**Embeddings would not have fixed this.** The problem is not the matching, it is
the vocabulary: ESCO describes occupations — operate machinery, manage budgets —
and the concepts are agile methodology theory. There is no ESCO skill for
"Cynefin framework" because it is not a job-market skill; it is a thinking model
taught inside one.

**Do not try this again.** "Audio mastering" on a Scrum Master credential is a
reputational failure, and the cost of finding out was one afternoon.

### What ESCO actually has for this market

`agile` in English returns exactly two real skills: **Agile development** and
**Agile project management**. Spanish `gestión de proyectos` returns twelve
good ones including PRINCE2 and Lean.

Coarse, but true — and `0a9acb6b` is the SAME URI for the English and Spanish
labels. One concept, one identifier, three languages.

### ESCO vs Lightcast — decided

| | ESCO | Lightcast Open Skills |
|---|---|---|
| languages | every EU language | English-first |
| access | open, public API, no key | free API, by request |
| size | ~13,000 | 32,000+, updated fortnightly |
| structure | occupational | Skill → Sub-Category → Category |

**ESCO, because it is multilingual and openly published.** Lightcast is an
excellent taxonomy built from English job postings, and storing its vocabulary
to show partners is a redistribution question needing their terms read first. A
possible US labour-market overlay later. Not a drop-in second option.

---

## 3. WHAT WAS BUILT

### `search-esco-skills` (edge function)

A proxy, because **ESCO answers 403 to any cross-origin request** — a browser
cannot call it directly.

**POST, not GET.** The first version was a GET and failed with
`error reading a body from connection`. That trace was misread twice: it is
`consumeBody` on the RESPONSE, not the request. `authenticate()` reads only
headers, never a body.

**`.text()` then `JSON.parse`, not `.json()`.** The edge runtime failed streaming
a 17 KB response that curl fetches in half a second. Collecting the bytes first
avoids the path that broke.

**A substring-noise filter.** ESCO matches inside words, so "agile" returned
"handle fragile items" and "pack fragile items for transportation". A result is
kept only when some word of its title STARTS WITH some word of the query,
accent-insensitively — which kills fr-agile, keeps "Agile development", and lets
unaccented "gestion" match "gestión" and "gestionar". It cannot hide a
legitimate hit. It does NOT re-rank; ESCO's ordering is the Commission's
judgement about its own vocabulary.

### ESCO URIs required a validation change

`http://data.europa.eu/esco/skill/<uuid>`. Not a typo and not insecure — a
data.europa.eu URI is a persistent IDENTIFIER, not a page, and the scheme is
part of the identifier. Rewriting it to https produces a string that is no
longer what the Commission published.

Both achievement functions now accept `https://` **or** an ESCO skill URI, via a
narrow regex. Not "any http://" — that would reopen the door the https rule
closed. Verified against `data.europa.eu.evil.com`, which is refused.

### The picker (`esco-picker.tsx`)

Debounced search, chips, a `?` explainer, **all three locales from the start** —
the first console component that is not hardcoded English.

The explainer states the limit as plainly as the claim: *"It does not make your
credential EU-accredited or endorsed. It only means the words are the standard
ones."* A trainer who has never heard of ESCO could otherwise read "European
Union official list" as endorsement.

### THE COLLISION THIS AVOIDED

`toGroups()` groups alignments by `targetFramework` and renders each as a
structure heading. ESCO skills are alignments with framework "ESCO".

Left alone, opening an achievement for edit would have shown them as a structure
group named ESCO — and **saving would have rewritten them as syllabus tasks with
the course URL, destroying the skill URIs.**

`toGroups` now excludes them; they live in their own state. Same table, same
OB 3.0 array, two different things in the editor.

The same split was needed on the verify page, where they rendered as a topic
group headed "ESCO" and inflated the count to "3 TOPICS" for one topic and two
skills. Now a SKILLS block with chips, and the count is topics only.

---

## 4. BUGS FOUND AND FIXED

**Per-task URLs were silently discarded on edit.** The seed was
`new Set(alignments.map(a => a.targetUrl)).size > 1` — "do tasks differ FROM
EACH OTHER". One task cannot differ from itself, so a single-task achievement
with its own URL and no course page opened as "1 task has no link", refused to
save, and was about to throw the URL away. Now: does any task differ from the
course URL. **And ESCO skills are excluded, or every achievement with a skill
would force per-task URLs onto its syllabus.**

**The blueprint modal trapped phone users.** `max-h-[88vh]`: on mobile `vh`
counts the area behind the browser chrome, and because the sheet is anchored
`items-end` the overflow goes off the TOP, taking the close button with it. A
dialog that cannot be closed is worse than one that looks wrong. `dvh` is the
visible viewport.

**The dashboard hid who issued what.** `credentials[]` already included partner
ones — fetched by `user_id`, no certification filter — and the EARNED card
showed code, name, date and a verify link with no issuer. A student holding
credentials from three partners could not tell them apart. Now: artwork, issuer
name, and lapsed state.

**Expired credentials displayed as earned.** The filter was
`status !== "revoked"`, but expiry is NEVER written to that column —
`verify-credential` derives it live from `expires_at`. Now derived in the
loader. Pre-existing, unrelated to partners.

**PostgREST types a to-one embed as an ARRAY.** `credentials → issuers` came
back as `{ name }[]` and broke the build. The error only appeared because the
select stayed a single literal — inference worked well enough to object. A
`firstOf()` normaliser takes either shape, because guessing wrong yields
`undefined` rather than an error and the issuer name would simply never appear.

**Confirmed:** the service-role client returns an OBJECT — `verify-credential`
returns `issuer_name` correctly. So the three edge functions casting through
`unknown` are fine. The array typing is TypeScript being conservative.

---

## 5. OPEN

**Verify page, still:**

1. **The badge-download explainer is three paragraphs between two buttons.**
   Nobody reads it there. It belongs behind the Download badge click — a small
   dialog with the badge, the explanation, and the download.
2. The domain header wraps awkwardly: the bare item count reads as part of the
   percentage. Label it or drop it.
3. `criteria.narrative` is emitted in one language. The credential document has
   no language map; OB 3.0 supports one.

**Structural, and now overdue:**

4. **`issuing-panel.tsx` is 1,450 lines and twelve components.** It has caused
   more anchor failures than every other file combined — including one where
   three identical `const [busy, setBusy]` lines made an anchor ambiguous.
   `AchievementModal` (~300), `StructureEditor` (~170) and `NewKeyModal` (~130)
   should be their own files. The obstacle is that they share a dozen symbols
   defined at the top of that file.
5. **Console translation debt.** The ESCO picker is trilingual; everything
   around it is hardcoded English. That inconsistency is now visible rather than
   theoretical. Decision recorded in v8.1: console EN+ES, partner-reachable
   surfaces all three.
6. Super admin context switcher — still no way to see the partner view.
7. `IssuingSnapshot.error` pattern for the other console loaders — ten
   `lib/console/*.ts` queries still discard their error at the destructure.

**Product:**

8. **The issuance email.** Nothing tells a holder they have anything. With the
   dashboard now showing issuer and artwork, this is the last gap in the claim
   story — `/my-credentials` turned out to be unnecessary, since the dashboard
   already lists everything a user holds.
9. **JTA skills.** Juan's call: the JTA should carry job-market skill phrases so
   Certidemy's own certifications get chips too. 6–10 per cert, hand-written,
   phrased the way Lightcast phrases them so they map cleanly later. This is a
   cert-creation change, not a rendering one.
10. `--rebuild` on `build-credential-anchor.mjs`. Load-bearing since 242, and
    now demonstrated: adding skills to August legitimately bumped
    `material_updated_at` and the Checks tab reads "not yet hashed".
11. `set-credential-results` UI; partner-visible credentials list;
    `upsert-issuer-webhook`; resolver-level SSRF check; SVG badge sanitiser.
12. Four certifications have no specimen: AIMS-F, AIMS-IA, ISMS-F, ISMS-IA.

---

## 6. LIVE STATE

```
issuers            2   certidemy, test-partner-02
achievements      13   11 Certidemy + 2 partner
credentials       10
migration tip    242
cert renderer      6
```

`SCRUM-BOOTCAMP-2-T7ZQ-755P` now carries three alignments: one syllabus row and
two ESCO skills. Signature verifies; anchor is stale by design after the edit.

`SM-AI-I-ZZMV-JPC8` unchanged at
`366981ac5a547b6c7aa943f66eecd3c8f75ccf5078bdc30b594f4784a109a796`.

---

## 7. WHAT THIS STRETCH TAUGHT

**The data was always there.** Nothing in §1 required new data — 53
competencies with weights had been travelling inside every credential for weeks,
behind a button labelled for developers. The work was deciding it mattered.

**Check which artifact you are looking at.** Skills were added to September and
the August credential was curled. Twice.

**A filter is not a re-rank.** Dropping "handle fragile items" from an "agile"
search removes noise. Reordering ESCO's results would be inventing a taxonomy on
top of a taxonomy.

**Read the stack trace, not the function name.** `consumeBody` was assumed to be
the request body twice before it turned out to be the response.

**One giant file is a correctness problem, not a style one.** Four anchor
failures in `issuing-panel.tsx`: a component assumed to be its own file, a block
reconstructed from a paste rather than copied, an anchor matching three
identical lines, and a structure carried over from a different file entirely.

**Post-conditions must name a thing, not count things.** "Exactly one select
matches this shape" is a tally wearing a property's clothes. "The credentials
select is one unconcatenated literal" is checkable without arithmetic. Seven
aborts this project were wrong counts; zero were wrong anchors.
