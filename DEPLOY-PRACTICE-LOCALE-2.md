# Deploy: the Spanish practice page, round 2

**PROMPT-99.** Copy-paste PowerShell. Run the blocks in order; the order is justified at the end.

Everything below is **one function** and **one web push**. There is no SQL: the concept name translations
already exist (1,730 concepts, 3,460 rows, zero missing), and nothing in this round changes a table.

---

## What is actually live right now

Measured, not assumed — `x-certidemy-build` is the only thing that answers which commit is serving:

```powershell
curl.exe -sI https://certidemy.com/es-419/learn | Select-String -Pattern "x-certidemy-build"
```

At the time of writing that returns `8700c9f…`, which matches `origin/main`. **Last round's lesson: the fix
was committed and never pushed, and the live build was two commits behind while being reported as live.**

---

## 1. The edge function: `score-mock-exam`

This is the one that makes the exam results page show Spanish concept names instead of English.

```powershell
cd C:\Users\Juan\Documents\certidemy
supabase functions deploy score-mock-exam --dns-resolver https
```

**Why `--dns-resolver https`:** the CLI's native resolver has failed twice on this machine with
`lookup api.supabase.com: no such host` while `nslookup` answered fine. It is a global CLI flag and it has
resolved first time, every time. `--dns-result-order=ipv4first` is a NODE flag and does nothing here.

**Why from `certidemy` and not from `supabase`:** the CLI expects to find a `supabase\` directory *beneath*
the working directory. Running it from inside `supabase\` fails.

Confirm it took:

```powershell
supabase functions list --dns-resolver https | Select-String -Pattern "score-mock-exam"
```

---

## 2. The web app

```powershell
cd C:\Users\Juan\Documents\certidemy\certidemy-web
npm run build
```

**`npm run build` now runs the i18n gate first** — it is `npm run i18n:check && next build`. If it stops
before Next starts, read what it printed: either a learner-facing string is not going through `t()`, or an
es-419/pt-BR value is still the English string. It exits 0 today; a failure means something changed.

Then, and only if the build succeeded:

```powershell
git push origin main
```

**The push is the deploy.** Workers CI builds from `origin/main`; `npm run cf:deploy` pushes to a
`workers.dev` preview and does **not** touch `certidemy.com`. Wait for CI, then verify the commit is serving:

```powershell
curl.exe -sI https://certidemy.com/es-419/learn | Select-String -Pattern "x-certidemy-build"
```

It must show the SHA you just pushed. Until it does, nothing you pushed is live.

---

## 3. Order, and why

| | | |
|---|---|---|
| 1 | `score-mock-exam` | A function change is backward-compatible with the current web build: it adds localized names to a payload field the page already renders. Deploying it first means the exam results page is correct the moment CI finishes, rather than after it. |
| 2 | `npm run build` | The gate runs here. A failed gate must stop the push, not be discovered after it. |
| 3 | `git push` | Last, because it is the irreversible half: CI starts immediately and there is no staging step between the push and production. |

**There is no order in which this round can break the live site**, which is worth saying because last round's
order mattered: the function and the client had to agree on a `language` field. This round the function only
ADDS a localized string where an English one used to be, so an old client and a new function are both correct.

---

## 4. The five-step manual check, because the rendered one cannot run from the session

**Playwright is not available here.** No `node_modules/playwright`, no `~\AppData\Local\ms-playwright`
browser cache, and no test-learner credential is declared in either repo — and a practice quiz sits behind a
login, so there is no unauthenticated route to it. Two automated checks cover the source and the catalogue;
**neither sees what a learner sees**, so this part is yours:

1. **Sign in as a learner** and open `https://certidemy.com/es-419/learn/aie-i/quiz/play?mode=practice`.
2. **Answer one question wrong.** The feedback heading must read **NO EXACTAMENTE**, and the explanation
   underneath must be in Spanish. *(That explanation is the PROMPT-96 fix, live since `f6fb8ce`.)*
3. **Finish the quiz** and read the results screen: "Cuestionario completo", the score line, "REVISA TUS
   RESPUESTAS", "Respuesta correcta:", "Nuevo cuestionario", "Volver al panel". Any English here is a finding.
4. **Open a mock exam's results** and read every row under **Desempeño por concepto**. The concept names must
   be Spanish. *(This is what step 1 of this deploy fixes — it is the one thing that needs the function.)*
5. **Repeat 1–4 at `/pt-BR/…`.** The feedback heading must read **NÃO EXATAMENTE**, with the tilde.

**Expected to stay English, and not a finding:** the brand *Certidemy*; certification codes (`AIE-I`,
`SM-AI-I`); Scrum terms (*Sprint Review*, *Product Backlog*, *Daily Scrum*, *Definition of Done*); the words
*Tutor*, *Legal* and *min*, which are the same in all three languages; and the product terms *Blueprint* and
*Quiz*, which are recorded as decisions in `scripts/check-messages-untranslated.mjs` and are the one place to
change if you want them translated.

---

## 5. What is NOT fixed by this deploy

Stated so a clean run of steps 1–5 is not read as "the locale work is done":

- **100 learner-facing strings** are still hard-coded, recorded in `scripts/i18n-baseline.json`. They are
  gated — the build fails on a NEW one — and the baseline shrinks as they are fixed. The largest remaining
  group is the hand-rolled per-locale plural tables in `dashboard/page.tsx` and `voucher-status-pill.tsx`,
  which are already translated but built by string concatenation rather than ICU.
- **The rendered check** does not exist as code. Steps 1–5 are it.
- **440 of 3,460 concept names are `is_provisional`** and are served anyway, deliberately: the concept review
  gate governs descriptions served to partners through MCP, and an unreviewed Spanish label beats a reviewed
  English one on a Spanish page. One predicate in `score-mock-exam` if that is ever ruled the other way.

---

## 6. Rollback

The function:

```powershell
cd C:\Users\Juan\Documents\certidemy
git -C supabase log --oneline -3 -- functions/score-mock-exam
git -C supabase checkout <previous-sha> -- supabase/functions/score-mock-exam
supabase functions deploy score-mock-exam --dns-resolver https
```

The web app: `git revert <sha>` then `git push origin main`. There is no faster path — CI is the only route to
production, so a rollback is a push like any other. The function rollback is independent and takes seconds,
which is the reason it is deployed first.
