# HANDOFF v6.4 — ADDENDUM

**Written after v6.4, same session, 2026-08-10.**
**Migration tip: 197** · next free **198**
**Supabase:** `36bb1e8` · `aae8219` · **Web:** `9f054cc`

v6.4 §5 listed ten invariants as *earned but owed*. **Seven are now built,
deployed, and have already found more.** This addendum records what changed
after that handoff was written, and one judgement I got wrong and corrected.

---

## 1. THE SEVEN ARE LIVE

`verify-cert` went from **29 checks to 36**. Every cert now runs:

| id | clause | what it catches |
|---|---|---|
| `items.optionfloor` | §8.1 | fewer than four options. FAIL on secure, WARN on practice |
| `items.grouped` | §8 | null `question_group_id` |
| `items.variantstems` | §8 | one stem carrying several items |
| `jta.published` | §5 | no published `jta_versions` row |
| `jta.skillsverb` | §9 | a create-level verb leading `skills` |
| `lesson.widgetshape` | §11 | widget config the component cannot read |
| `lesson.spansresolve` | §11 | a `highlight-mistake` span absent from its own text |

**Board after:** nine live certs at **0 failures**, 33–35 passes each. ISMS-IA
alone fails, and only on its absent item bank.

---

## 2. WHAT THEY FOUND ON THE FIRST RUN

### 2.1 A widget that reported success while hiding a third of itself

`SPO-AI-I / 01-02-agile-manifesto`, English. The passage reads *"I **also**
stopped meeting with users weekly"*. The span read *"I stopped meeting with
users weekly"*. **One word.**

So the third highlight was not a substring, and never clickable. And because
`minimum_correct` is 2 and the other two spans resolved, **the widget rendered,
accepted input, and completed successfully** — while one of its three teaching
points was unreachable.

> A learner would have finished it and felt fine. No reviewer would have caught
> it. It took a check that compares a span against its own passage, and that
> check was one day old.

Fixed in the database and on disk (`9f054cc`) — the disk fix is the real one,
because the next translation run would otherwise regenerate the break.

### 2.2 Fifteen ungrouped items, and a decision reversed

Migration **195** kept AIE-I's 15 ungrouped es-419 items deliberately, on the
argument that retiring sound stock to satisfy a metadata check is the wrong
trade. **That was right on the evidence available then.**

What changed is a count nobody had taken:

```
task 2.3 practice    en 10    es-419 25    pt-BR 10
task 2.3 secure      en  8    es-419  8    pt-BR  8
```

All 15 sit on one task, and that task **meets the practice floor of 10 in all
three languages without them.** Their presence made the Spanish pool two and a
half times deeper than English or Portuguese for that task — so a Spanish
learner practising 2.3 drew from a materially different pool.

**The imbalance was the argument, not the metadata.** Migration **197** retires
them; the pool is now 10/10/10. Three attempts survive per 089.

---

## 3. THE JUDGEMENT I GOT WRONG

I wrote `items.nodupes` as a **FAIL**, on the assumption that a repeated stem
meant a duplicated item. It found 44 across six certs — SM-AI-I holding 25.

**Inspection of six pairs showed every one is a variant, not a duplicate.**

> *"According to the 2020 Scrum Guide, who are the Developers on a Scrum Team?"*
> one keys **a** — "Anyone on the Scrum Team who creates any aspect..."
> one keys **b** — "Team members committed to creating any aspect..."
> entirely different distractor sets, difficulty 1 and 2, separate groups.

**Retiring either would have destroyed a working item, across six live certs.**
A bank with 2,900 items across 50 tasks will ask the same basic question more
than once. That is healthy variety.

**The real defect was one layer away.** `generate-mock-exam` dedupes on `q.id`
via `chosen`; variants are different rows, so nothing stopped both landing in one
form. On SM-AI-I's secure English pool that is 10 items across 5 stems, drawn 80
at a time.

Two corrections:

- **`pickAcrossTasksBalanced` now keeps one variant per stem**, before task
  grouping, so the round-robin and difficulty balancer see a clean pool and the
  domain quota is still met. Filtering after selection would have left the quota
  short and tripped the integrity gate.
- **The check became a WARN**, renamed `items.variantstems`. The clustering stays
  visible — it concentrates on low-Bloom tasks with narrow concept sets, where
  the generator has few distinct things to ask — but it no longer blocks
  publication for a healthy state.

> **The lesson: a new invariant's severity is a hypothesis until you look at what
> it caught.** Mine would have deleted good work. The check was right to surface
> it; I was wrong about what it meant.

---

## 4. THE CREATE-VERB SWEEP IS WIDER THAN v6.4 SAID

`jta.skillsverb` reports **16 tasks across 6 certs**, not 13. The manual regex
missed three:

- `SD-AI-I 4.2` — *"Construct a prompt/context that makes correct output likely"*
- `SPO-AI-I 4.8` — *"Build a story map from a product narrative."*
- `SPO-AI-I 5.6` — *"Construct an outcome-based roadmap."*

All items behind them are clean, so it is a WARN and remains a documentation
correction owed. **It is now permanently visible instead of depending on someone
remembering to run a query.**

---

## 5. STILL OWED

Unchanged from v6.4 §9 except where noted:

- **Three invariants not yet built:** duplicate detection tuned per pool; the
  statement-verb map extended with `turn`, `produce`, `build`, `assemble`
  (SD-AI-I 2.2 opens with `Turn` and only WARNs); concept-coverage per lesson.
- **The 16 create-verb `skills` corrections** — one migration, no item impact.
- **ISMS-IA:** item banks (Stage 9, a build), translations, `price_usd`.
- **AIMS-F `price_usd` = 0.**
- **`ISMS-F` task 2.3** says *environmental-conditions*; Amd 1:2024 says
  **climate change**. **`ISMS-F` lesson 3.6** NOTE 1/NOTE 3 misnumbering.
- **`CERT-PUBLISH-CHECKLIST`** still has no `jta_versions` step — though
  `jta.published` now catches the omission, which was the point.
- **`ISMS-IA_BoK_v1.md`** §3 lists five ISO 19011 changes; the foreword names two.

---

## 6. TWO FACTS THAT COST TIME TODAY

**The content directory for SPO-AI-I is `content/spo-i/`**, not `spo-ai-i`. The
cert code and the folder name diverge for that one cert.

**`-Apply` was forgotten three times.** A dry run passing and a file changing are
different claims, and one deploy went out against unchanged code. **`git status
--short` immediately after any patch** is the check that caught it every time —
a clean tree after a patch means nothing was written.

---

*End of addendum. The next session starts at v6.4 §9: Stage 9 is a build, and
the L1 generators must not be pointed at ISMS-IA.*
