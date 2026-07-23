# HANDOFF-v2.7 — Number Accuracy Pass

Delta from HANDOFF-v2.6, same session. Everything below is committed and pushed.

**Migration tip: 121. Next migration is 122.**

Context: beta testing with real users is near, so this stretch was spent making
every number on screen defensible rather than adding surface.

---

## 1. Migration 121 — distinct concept totals

`concepts_total` / `concepts_seen` in `v_user_exam_readiness` summed PER-DOMAIN
counts. A concept linked to tasks in two domains counted twice — SM-AI-I
reported 112 against an actual 107 (seven such concepts).

**Coverage and `predicted_score_pct` were unaffected and did not move.** Both are
computed per-domain then weighted; each domain's denominator was already right,
and a concept genuinely *does* contribute to both domains it links to. Only the
summed display columns were wrong. Nothing rendered them yet — fixed before they
reached a screen.

Confirmed at the same time: `concepts.certification_id` and the `task_concepts`
path agree (107 = 107), so there are **no shared concepts across certs** on this
instance, and the dashboard's mastery scoping is correct.

---

## 2. "36 / 31" — the cert dashboard lesson count

`loadDashboardData` queried `user_lesson_progress` filtered by user and **not by
certification**, so `completed` counted every lesson finished across ALL certs
against one cert's denominator. 36 was SM-AI-I + SD-AI-I + SPO-AI-I. It inflated
with each cert a learner added, on every cert dashboard.

**The dedupe was NOT the bug** — progress rows are per-language and were already
collapsed by `lesson_group_id`. That logic is untouched.

**The more consequential half:** the same unscoped set fed `completedGroups`,
which marks STUDY-PLAN ITEMS done. A wrong count is embarrassing; a wrongly
ticked plan item means a learner skips work they have not done.

Also removed the `?? r.lesson_id` fallback that made it silent — an unresolvable
lesson counted as its own group instead of being dropped.

---

## 3. Blueprint drawer labels

The cert detail page passed `triggerLabel="Blueprint"` and
`subtitle="Job-Task Analysis"` as literals, with a comment claiming both were
"proper feature/method names". **Half right, and that is why it survived:**

- `transpBlueprintCta` = **"Blueprint" in every language** — a product name,
  correctly untranslated.
- `transpJtaSubtitle` = "Job-Task Analysis" / **"Análisis de Tareas (JTA)"** /
  **"Análise de Tarefas (JTA)"** — a method name, and it IS translated.

The marketing home already passed both correctly to the same component from the
`home` namespace. Two callers, two conventions. Now reuses the existing keys
rather than duplicating strings into `certifications`.

---

## 4. CertiGlobal badge follows the theme

`variant` was a static prop chosen per caller for the surface they assumed —
fine when the console was always dark and the footer always light. Once the app
became themeable it produced a pale wordmark on a pale background.

Both PNGs now render and CSS hides one, keyed off `[data-theme="dark"]` on
`<html>` — which the server sets from the cookie, so the right mark is correct
in the **first paint**. A JS swap would flash the wrong logo on every load.
`variant` survives as an override for a genuinely fixed surface; no current
caller needs it.

---

## 5. The pattern behind four of today's bugs

**A fallback that never errors is where the wrong answer comes from.**

| | looked like | actually |
|---|---|---|
| readiness sigmoid | a backup for `pass_predictions` | the only thing that ever ran |
| `?? r.lesson_id` | defensive default | counted foreign lessons as their own group |
| RLS without GRANT | a policy protecting a table | every read failed 42501, silently |
| static `variant` | caller knows its surface | caller's assumption outlived the surface |

**Standing rule:** when a lookup can miss, decide what a miss MEANS before
writing `??`. If it means *wrong scope* or *not available*, skip or surface it —
do not substitute something plausible.

**Second rule, learned expensively:** enumerate consumers BEFORE changing a
shared type's shape. Changing `DashboardData.passPrediction` cost three build
cycles because consumers were fixed as the compiler surfaced them, one per
rebuild. One grep up front would have found all five.

---

## 6. Queued next

1. **Grok review of the ~392 provisional JTA translations**, then `--approve`
   per cert. Unchanged as the top item.
2. **`/certifications/family/[slug]`** — still "family" in a public URL after
   the program rename. Needs a redirect from the old path, not just a rename,
   since it is public and may already be linked. **Worth doing BEFORE beta**, so
   testers never share a URL that later breaks.
3. **Recalibrate the mastery→score mapping** once real exam attempts exist.
4. **Claims + terminology policy into the six `SCHEME-<CODE>.md` files.**
5. Lint noise: `latestExam`, `TrendingUp`, `canStart`, `Users`, `tTeam`,
   `isTeamAdmin` are now unused. Harmless, but a clean build output makes real
   warnings visible.

### Beta readiness

Every number a beta tester sees is now derived from something real: readiness
from the blueprint with a confidence band, lesson counts scoped to their cert,
concept totals counted once. The remaining known gap is that the JTA
translations are live but unreviewed.
