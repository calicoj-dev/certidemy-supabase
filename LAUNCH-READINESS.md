# LAUNCH-READINESS

The sales and marketing team's ten pre-launch blockers, mapped to what exists,
where it lives, and what is missing. Status as of 2026-07-29, migration tip 162.

Legend: **DONE** · **PARTIAL** · **MISSING** · **DECISION** (no code will
produce it; it needs a person to decide)

---

## 1. Identidad institucional — **DECISION**

Nothing about the legal entity exists anywhere in the platform.

| Ask | Where it stands |
|---|---|
| Qué entidad legal opera Certidemy | Nowhere |
| Quién emite la certificación | Nowhere |
| Quién es dueño de los esquemas | Nowhere |
| Qué función cumple CertiGlobal | Implied only — every asset states pricing is CertiGlobal's and examinations are purchased there, but no document says what the relationship *is* |
| Quién procesa los pagos | Nowhere (CertiGlobal by implication) |
| Quién conserva los registros | Nowhere |

`/[locale]/(marketing)/about` exists as a route. **Content unverified** — it may
already carry some of this.

**Needed:** one approved paragraph. Every renderer has a footer that could carry
it, and the three PDFs already stamp "Certidemy" with no entity behind it.

---

## 2. Legales terminados — **PARTIAL** (2 of 7)

| Ask | Route | Status |
|---|---|---|
| Términos de servicio | `/[locale]/terms` | Route exists, **content unverified** |
| Política de privacidad | `/[locale]/privacy` | Route exists, **content unverified** |
| Política de cookies | — | **MISSING** |
| Política de reembolsos | — | **MISSING** |
| Datos completos de la entidad | — | **MISSING** (see item 1) |
| Jurisdicción | — | **MISSING** |
| Correo de contacto | — | **MISSING** |

Three new routes minimum. Note that a refunds policy is awkward while Certidemy
takes no payments — it may belong on certiglobal.org instead, which is itself an
item-1 question.

**Inconsistency to resolve:** `/[locale]/pricing` exists on Certidemy while every
generated asset deliberately carries no price because pricing is CertiGlobal's.
Those two facts need to agree before launch.

---

## 3. Especificaciones únicas por certificación — **PARTIAL** (9 of 13)

The master table is `public.certifications`, and the fact sheet already renders
from it in three languages.

| Ask | Where |
|---|---|
| Nombre | `certifications.name` + `certification_i18n.name` ✓ |
| Código | `certifications.code` ✓ |
| Preguntas | `num_questions` ✓ |
| Duración | `exam_duration_minutes` ✓ |
| Puntaje | `passing_score_pct` ✓ |
| Intentos | `max_exam_attempts` ✓ |
| Vigencia del voucher | `attempt_window_months` + `v_voucher_validity` ✓ |
| Vigencia de la credencial | `validity_days` ✓ |
| Estado | `status` — but see below |
| Idiomas | **Asserted in renderer code, not stored.** All three sheets hardcode "English, Spanish (LATAM), Portuguese (Brazil)" |
| Modalidad | **Asserted in renderer code, not stored.** Blueprint sheet hardcodes "Multiple choice, single answer, online" |
| Precio | **Not in Certidemy by design** — lives on certiglobal.org |
| Política de renovación | **MISSING** — no column, no policy |

**"Beta" is not a status we have.** `status` holds `draft` / `coming_soon` /
`available` / `unavailable`. If beta is a real state with different claims
attached, it is a migration plus display handling in the catalog, the console and
all three renderers — not a word on a chip.

**The two asserted fields are a small risk.** If a certification ever ships in
two languages instead of three, or adds a non-MCQ item type, the sheets will lie
until someone remembers to edit the renderer.

---

## 4. JTA y blueprint visibles — **DONE** (7 of 8)

Shipped this session. Both documents generate from live rows in three languages
via the sales library (`/console/library`).

| Ask | Where |
|---|---|
| Dominios | Blueprint sheet + JTA sheet ✓ |
| Tareas | JTA sheet — every task, in scope or not ✓ |
| Pesos | Blueprint sheet, with question allocation ✓ |
| Nivel cognitivo | Both, computed from tasks not asserted ✓ |
| Número de preguntas | Both ✓ |
| Versión | `exam_blueprint.version` — Cognitive Model v2.0, in every footer ✓ |
| Fecha | Generation date + `computed_at` in every footer ✓ |
| Fuentes principales | **MISSING** — no column. The JTA markdown headers carry sources outside the database |

**Two caveats on the current state.** K/S/A renders in English only; the Spanish
and Portuguese columns exist (migration 161) but are empty. And the 66 translated
domain descriptions are `is_provisional = true`, so Spanish and Portuguese sheets
currently fall back to English domain sections until a native read flips the flag.

---

## 5. Candidate Handbook — **MISSING** as a document

No handbook exists. Several of its sections have working mechanics behind them,
which shortens the writing but does not replace it.

| Section | Mechanics exist? |
|---|---|
| Registro | Yes — signup/login |
| Requisitos | No stated prerequisites |
| Identificación | **No identity verification of any kind** |
| Reglas del examen | Partial — timing and submission enforced |
| Uso de IA | **DECISION** — see item 6 |
| Resultados | Yes — exam engine, scoring |
| Retakes | Yes — `max_exam_attempts`, `attempt_window_months` |
| Apelaciones | No |
| Quejas | No |
| Adaptaciones | No |
| Credencial | Yes — minting, `/verify`, public verification endpoint |
| Renovación | **No policy** (see item 3) |
| Revocación | Yes — console revoke, platform_admin gated |

---

## 6. Operación del examen — **DECISION** (7 of 10 unanswered)

| Question | Honest answer today |
|---|---|
| ¿Hay proctoring? | **No.** `exam-leave-guard` is a UX guard, not invigilation. It was renamed from "Proctored Run" for exactly this reason |
| ¿Cómo se verifica la identidad? | It isn't |
| ¿Se usa cámara? | No |
| ¿Puede usar IA? | Undecided — nothing prevents it |
| ¿Puede usar internet? | Undecided — nothing prevents it |
| ¿Puede cambiar de pestaña? | Detected, not prevented |
| ¿Qué ocurre si se desconecta? | Exam engine handles resume — **behaviour unverified**, worth confirming before writing it down |
| ¿Cómo se detecta fraude? | Only the leave guard's signal |
| ¿Quién revisa un incidente? | Nobody defined |
| ¿Cuándo se emite la credencial? | Automatically on pass |

**This is the item that gates item 10.** Everything on the team's "sin afirmar
todavía" list depends on answering these accurately. Do not let the handbook
inherit a proctoring claim the software does not make.

---

## 7. Decisión de certificación — **PARTIAL** (2 of 5, none declared)

| Ask | Reality |
|---|---|
| Qué condición genera la aprobación | `passing_score_pct` — 80% across the catalog, enforced ✓ |
| Quién autoriza la emisión | Nobody — issuance is automatic on pass. *That is an answer*, but it is undeclared |
| Qué pasa cuando hay un incidente | No process |
| Quién puede revocar | Platform admin, via the console. Implemented but not stated as policy |
| Quién revisa una apelación | Nobody defined |

The team says this need not be published but must operate internally. Two of five
operate; none are written down.

---

## 8. Credencial de demostración — **PARTIAL** (6 of 9)

Seven specimen credentials shipped. They are real credential rows rendered by the
real certificate function, excluded from every count, cannot verify as genuine,
and print banded and watermarked.

| Ask | Status |
|---|---|
| Diploma | ✓ specimen certificate PDF, three languages |
| ID | ✓ `credential_code` |
| Página de verificación | ✓ `/verify/[id]`, public `verify-credential` endpoint |
| Fecha | ✓ |
| Expiración | ✓ `validity_days` |
| Estado | ✓ |
| QR | **Unverified** — the certificate prints a verification URL; whether it also renders a QR needs checking |
| Competencias | **Believed missing** from the certificate |
| Versión del esquema | **Believed missing** from the certificate |
| Badge | **MISSING** — deliberately. Credly is the intended system of record and no throwaway badge ships before it |

The last three are small renderer changes now and annoying later.

---

## 9. Política de claims — **PARTIAL** (sweep done, document not written)

**The audit is complete and clean.** Both halves of the surface were checked this
session:

- All `.tsx` / `.ts` / `.json` in the web app grepped for accreditation,
  equivalence, global recognition, psychometric validation and pass-rate claims
  in all three languages. **Three hits, zero violations** — one internal console
  analytics label reading "pass rate", two code comments about null handling.
- `certifications` and `certification_i18n` queried for the same patterns.
  **Zero rows.**

What remains is authorship, not searching:

| Ask | Status |
|---|---|
| Lista oficial aprobada | **MISSING** — `TERMINOLOGY-POLICY.md` exists but is not an approved permitted/forbidden list |
| Textos permitidos | **MISSING** |
| Textos prohibidos | **MISSING** |
| Versiones es/en/pt | **MISSING** |
| Revisión de toda la web | ✓ **DONE**, clean |

**One gap the sweep cannot cover:** the website is protected, but a call is where
a rep improvises. The permitted/forbidden list needs to reach the battlecard, not
just the site.

---

## 10. Etiqueta de lanzamiento — **PARTIAL**

Their recommended framing — prelanzamiento + primera cohorte — is the right one
and survives an honest answer to item 6.

**Can be presented today:** platform, certifications, JTA, blueprints,
preparation (free lessons), registration.

**Cannot yet:** lista de espera (**MISSING**), precios de lanzamiento (CertiGlobal's,
not ours), participación en primera cohorte (**MISSING** — no cohort mechanics).

**Must not assert** — validación psicométrica, reconocimiento global,
acreditación, tasas de aprobación, equivalencia. ✓ **None present**, confirmed by
the item-9 sweep.

---

## Summary

| # | Item | Status |
|---|---|---|
| 4 | JTA y blueprint | **DONE** — 7 of 8, missing only fuentes principales |
| 9 | Política de claims | Sweep **DONE** and clean; list not written |
| 8 | Credencial de demostración | 6 of 9 — QR unverified, competencias and versión del esquema likely missing, badge deliberate |
| 3 | Especificaciones | 9 of 13 — renovación missing, "beta" not a real status, precio elsewhere by design |
| 2 | Legales | 2 of 7 routes exist, content unverified |
| 7 | Decisión de certificación | 2 of 5 operate, none declared |
| 5 | Candidate Handbook | Mechanics for ~half, document for none |
| 1 | Identidad institucional | Nothing |
| 6 | Operación del examen | 3 of 10 answerable |
| 10 | Etiqueta de lanzamiento | Content mostly ready; waitlist and cohort missing |

**Blocked on code:** almost nothing. Fuentes principales, the certificate's three
missing fields, a waitlist, and the "beta" status if it is real.

**Blocked on a decision:** items 1, 6 and 7 entirely, and they gate 2, 5 and 10.
