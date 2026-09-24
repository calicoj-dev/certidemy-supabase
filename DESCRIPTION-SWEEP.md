# Tool descriptions against the wire

**The wire matrix tests what the server does. Nothing tested what the server says it
does.** A partner integrates against the description, so a false description is a defect
in the product whether or not the code is correct.

Measured 2026-09-24 by calling the deployed MCP server. Only **behavioural** claims —
what gets searched, what falls back, what is refused, what a field means. Structural
claims (field names, enums) are covered by the schema itself.

**UNTESTED is a row, not an omission.** A claim nobody exercised is reported as such
rather than assumed true, which is the third-state rule this repository has paid for five
times.

| # | tool | claim | measured | verdict |
|---|---|---|---|---|
| 1 | `search_blueprint` | *"Concepts are searched in English, whatever language is requested"* | es-419 `management` → **0 rows**; `gestión` → 10 incl. concepts; `concept`/es-419 returns Spanish | **FALSE — corrected** |
| 2 | `search_blueprint` | *"the response reports which corpora were actually searched"* | `searched: ["tasks","concepts"]`, and `["tasks"]` where a language has no cleared concepts | **true** — reports KINDS, which is what it says |
| 3 | `search_blueprint` | *"a term matches at a word boundary with any suffix… `AI` does not match `explain`"* | `AI`/AISM-I → task 1.1 via **`AI-augmented`** (hyphen is a boundary, intended). `totals` 36 tasks / 60 concepts — the exact figures CLAUDE.md records for word-boundary matching | **true** |
| 4 | `search_blueprint` | *"up to half the limit reserved for each kind; a reserved slot one kind cannot fill is given to the other"* | limit 10, concepts matched 2 → returned tasks **8**, concepts **2** | **true**, exactly |
| 5 | `search_blueprint` | *"`totals` … and `returned` … so a thin result can be told from a truncated one"* | both present and consistent | **true** |
| 6 | `search_blueprint` | *"It searches the blueprint only: it does not search lesson text"* | — | **UNTESTED** |
| 7 | `get_concept` | *"Where a concept has no cleared translation … the English is returned and `descriptionIsFallback` is true"* | `keep-it-simple-and-practical`/pt-BR, edited an hour earlier: English body, `descriptionIsFallback: true` | **true** |
| 8 | `list_lessons` | *"Every response also carries `lessonAccess`"* | present on every call | **true** |
| 9 | `list_lessons` | *"`bodyAvailable` false means the lesson EXISTS and its body is withheld … get_lesson will refuse that one with a reason"* | `aims-ia-04-06`: listed, `body_available` false, get_lesson refuses with a full reason naming ISO redistribution and saying it is not a credential problem | **true** |
| 10 | `list_lessons` | `lessonAccess.note`: *"get_lesson will return the body of any lesson listed here."* | `aims-ia-04-06` **is listed** and get_lesson **refuses** it | **FALSE — corrected** |
| 11 | `list_lessons` | *"needs no credential"* | this connector holds a `courseware:lessons` key, so an unauthenticated call was not made from here | **UNTESTED** |
| 12 | `get_lesson` | *"no tool on this server returns exam questions or any scored assessment"* | — | **UNTESTED** |
| 13 | all | *"Responses carry contractVersion 3 … pinning anything else is REFUSED by name"* | `contractVersion: 3` on every response; the refusal path was verified on 2026-09-22, not re-verified here | **partly** |

---

## The two corrections

**#1 is the serious one.** An agent reads that sentence, holds English vocabulary from the
English docs, queries a Spanish blueprint and gets **zero** — and concludes the
certification covers nothing about management. The `es-419 = 0` shape again: a silent
empty answer that looks like an answer.

**#10 contradicted the tool's own description in the same payload.** The description
explains `bodyAvailable: false` two sentences before `lessonAccess.note` promises the
body of *any* listed lesson. Both shipped.

## Why #1 expired, which is the part worth keeping

The sentence was rewritten on 2026-09-20, **specifically so it would not expire**. Its
commit says each sentence now describes what comes back *"because that is the part a
caller can act on **and the part that stays true when the table fills**."*

It did not. Filling `concept_translations` changed the **behaviour**, not only the data —
concepts began to be searched and served in the requested language — so a sentence
rewritten to survive that exact event expired at it.

> **"Describes what a caller receives" is durable against a DATA change and not against a
> BEHAVIOUR change, and here one event caused both.**

## One more shape, not a false claim

A wrong `module_slug` returns `{"lessons": [], "count": 0}` with no error — indistinguishable
from an empty module. Nothing in the description promises otherwise, so it is not a
defect against this table, but it is the silent-empty class and worth a decision.

## What this sweep cannot do

It reads the descriptions **as this connector has them cached**. CLAUDE.md records that a
connector's tool list is a claim about its cache, not about the server — the cache here
matched the repository state, which is why the results are usable, but that was checked
rather than assumed.
