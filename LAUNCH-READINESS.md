# LAUNCH-READINESS

The sales and marketing team's ten pre-launch blockers, mapped to what exists,
where it lives, and what is missing.

Status as of 2026-07-29 (second revision), migration tip 162.

Legend: **DONE** · **PARTIAL** · **MISSING** · **DECISION** (no code will
produce it; it needs a person to decide)

---

## 1. Identidad institucional — **DONE**

| Ask | Answer | Where |
|---|---|---|
| Qué entidad legal opera Certidemy | RC Capital Partners LLC | Privacy §intro, Terms §intro |
| Registered where | State of New Jersey, United States | Privacy §intro |
| Postal address | 210 Westervelt Ave, North Plainfield, NJ 07060 | Privacy §14, Terms §14 |
| Quién emite la certificación | RC Capital Partners LLC, trading as Certidemy | Terms §3 |
| Quién es dueño de los esquemas | The Company; Certidemy and CertiGlobal marks | Terms §7 |
| Qué función cumple CertiGlobal | Voucher marketplace serving multiple certification bodies, including independent ones such as CertiProf. Certidemy is one participant | Footer badge, business copy |
| Quién procesa los pagos | Shopify, using Stripe for card processing | Privacy §sub-processors |
| Quién conserva los registros | The Company | Privacy §retention |
| Contacto | info@certidemy.com | Everywhere |

Certidemy and CertiGlobal are both brands of RC Capital Partners LLC. That
sentence is now stated in the privacy policy and the terms.

**One nuance worth being able to explain on a call.** A reader sees "brands of
the same company" in the privacy policy and "A CertiGlobal Partner" in the
footer. Both are true — the first is corporate ownership, the second is
marketplace participation — but the pairing invites a question about issuer
independence, which the AIHR-I curriculum itself teaches buyers to ask. The
answer is that the examination does not discriminate: a fixed 80% pass mark, a
published blueprint, and items drawn mechanically from a protected pool. There
is no lever an incentive could act on. **This belongs in the battlecard**, because
it sounds evasive if improvised.

**Still open:** no dedicated institutional page. `/about` is positioning copy —
hero, contrast, principles — with no entity information. The legal pages carry
the facts; a footer line and a short section on `/about` would put them where a
buyer looks first.

---

## 2. Legales terminados — **PARTIAL** (substantially done)

Terms and Privacy are complete documents in `lib/legal/content.ts` — GDPR legal
bases, LGPD, data subject rights, credential revocation, limitation of
liability, governing law.

| Ask | Status |
|---|---|
| Términos de servicio | ✓ `/[locale]/terms` |
| Política de privacidad | ✓ `/[locale]/privacy` |
| Política de cookies | ✓ Privacy §6. **No consent banner needed** — a codebase sweep found no analytics, advertising or non-essential cookies of any kind |
| Política de reembolsos | ✓ Terms §5 — **DRAFT, unreviewed** |
| Datos completos de la entidad | ✓ Name, NJ registration, postal address |
| Jurisdicción | ✓ New Jersey, with a mandatory-consumer-protection carve-out — **DRAFT, unreviewed** |
| Correo de contacto | ✓ info@certidemy.com |

**Two clauses are drafted, not transcribed**, and both are flagged in a comment
inside `content.ts`:

- **§5 refunds** — refundable within 14 days while the voucher is unredeemed;
  non-refundable once redeemed, since redemption is when the examination is made
  available.
- **§12 courts** — exclusive jurisdiction of New Jersey state and federal courts,
  preserving mandatory consumer protections in the user's country of residence.

Both are conventional. Neither has been read by counsel.

**Language position: English only, with a request mechanism.** The pages carry a
notice offering the document in the reader's language on request. This is
defensible and keeps one authoritative text rather than three that can drift.
**Worth asking counsel:** Colombia's Estatuto del Consumidor and Brazil's CDC
both require consumer information in the local language, and the Company now
contracts directly with consumers in both. The request mechanism may satisfy it;
the question is cheap to ask and expensive to get wrong.

`gen-legal-translations.mjs` exists in the supabase repo, unused, if the position
changes.

**Inconsistency still open:** `/[locale]/pricing` exists on Certidemy while every
generated asset deliberately carries no price, because vouchers are sold through
CertiGlobal. Those two facts need to agree.

---

## 3. Especificaciones únicas por certificación — **PARTIAL** (9 of 13)

The master table is `public.certifications`; the fact sheet renders from it in
three languages.

Present: nombre, código, preguntas, duración, puntaje, intentos, vigencia del
voucher, vigencia de la credencial, estado.

| Gap | Detail |
|---|---|
| Idiomas | **Asserted in renderer code, not stored.** All three sheets hardcode the three languages |
| Modalidad | **Asserted in renderer code.** Blueprint sheet hardcodes "Multiple choice, single answer, online" |
| Precio | **Not in Certidemy by design** — vouchers sell through CertiGlobal |
| Política de renovación | **MISSING** — no column, no policy |
| "Beta" | **Not a status we have.** `status` holds `draft` / `coming_soon` / `available` / `unavailable`. If beta is real it is a migration plus display handling everywhere |

---

## 4. JTA y blueprint visibles — **DONE** (7 of 8)

Both documents generate from live rows in three languages via the sales library.

Present: dominios, tareas, pesos, nivel cognitivo, número de preguntas, versión,
fecha.

**Missing: fuentes principales** — no column. The JTA markdown headers carry
sources outside the database.

**Two caveats.** K/S/A renders in English only; the columns exist (migration 161)
but are empty. And the 66 translated domain descriptions are
`is_provisional = true`, so Spanish and Portuguese sheets fall back to English
domain sections until a native read flips the flag.

---

## 5. Candidate Handbook — **MISSING** as a document

Mechanics exist for registro, resultados, retakes, credencial, revocación.
Nothing exists for identificación, apelaciones, quejas, adaptaciones,
renovación. Uso de IA is a §6 decision.

---

## 6. Operación del examen — **DECISION** (7 of 10 unanswered)

**The honest answer to "is there proctoring" is no.** `exam-leave-guard` is a UX
guard, not invigilation — no identity verification, no camera, tab switching
detected but not prevented.

Answerable today: no proctoring, no identity verification, no camera, credential
issued automatically on pass.

Unanswered: AI use, internet use, disconnect handling (behaviour unverified),
fraud detection, incident review.

**This gates item 10.** Everything on the team's "sin afirmar todavía" list
depends on answering these accurately.

---

## 7. Decisión de certificación — **PARTIAL** (2 of 5 operate, none declared)

Approval condition is `passing_score_pct`, 80% across the catalog, enforced.
Issuance is automatic on pass — that is an answer, but undeclared. Revocation is
implemented, platform-admin gated. No incident process, no appeals reviewer.

---

## 8. Credencial de demostración — **PARTIAL** (7 of 9)

Seven specimen credentials shipped — real rows rendered by the real certificate
function, excluded from every count, unable to verify as genuine, banded and
watermarked.

Present: diploma, ID, verification page, date, expiry, status, **QR** (vector,
drawn from the module matrix, encoding the verification URL).

| Gap | Detail |
|---|---|
| Competencias | Not on the certificate. Recommend domain names only — a 51-task list makes it a report, not a diploma |
| Versión del esquema | Not on the certificate. Should be: it tells a verifier which scheme version the credential was issued against |
| Badge | Deliberate. Credly is the intended system of record; no throwaway badge ships first |

---

## 9. Política de claims — **DONE**

`CLAIMS-POLICY.md` — claim classes with evidence requirements, approved texts in
three languages, forbidden formulations, review procedure.

**Both halves of the review were run and every violation fixed:**

- About page asserted competitors' blueprints sit behind paywalls. False —
  ITIL, PMI, ISTQB and the Scrum Guide all publish syllabi free. Removed in
  three languages.
- `home.subhead` and `auth.showcase.headline` said "globally-recognized
  certifications". Removed in three languages.
- `home.heroSubhead` said most certifications pretend AI doesn't exist. Removed.
- "Built on the work nobody else does" and "An AI tutor that can't hallucinate"
  replaced with claims that survive scrutiny.
- 37 superseded `home` keys pruned, including the PSM I / SMPC scoring-weight
  comparison — the last unsourced competitor claim in the repo.

**Two lessons are recorded in §7.1.** A vocabulary sweep found nothing while the
paywall claim was live, because it was false in permitted words. And the first
sweep missed "globally-recognized" entirely — it searched for the unhyphenated
form, and for `reconocimiento global` against copy that said `reconocidas
mundialmente`. **A clean sweep proves the absence of Class C vocabulary and
nothing else.**

---

## 10. Etiqueta de lanzamiento — **PARTIAL**

Prelanzamiento + primera cohorte is the right framing and survives an honest
answer to item 6.

**Ready:** platform, certifications, JTA, blueprints, preparation, registration.
**Missing:** lista de espera, participación en primera cohorte.
**Not ours:** precios de lanzamiento — CertiGlobal's.

**Must not assert** — validación psicométrica, reconocimiento global,
acreditación, tasas de aprobación, equivalencia. ✓ None present.

---

## Summary

| # | Item | Status | Movement |
|---|---|---|---|
| 1 | Identidad institucional | **DONE** | was: nothing |
| 4 | JTA y blueprint | **DONE** | — |
| 9 | Política de claims | **DONE** | was: sweep only |
| 2 | Legales | **PARTIAL** (substantial) | was: 2 of 7, unverified |
| 8 | Credencial de demostración | 7 of 9 | QR confirmed |
| 3 | Especificaciones | 9 of 13 | — |
| 7 | Decisión de certificación | 2 of 5 operate | — |
| 5 | Candidate Handbook | mechanics only | — |
| 6 | Operación del examen | 3 of 10 | — |
| 10 | Etiqueta de lanzamiento | content ready | — |

**Three of ten are closed.**

**Blocked on code:** fuentes principales, two certificate fields, a waitlist, and
"beta" status if it is real.

**Blocked on a decision:** item 6 entirely, and it gates 5 and 10. Item 7 needs
declaring rather than building.

**Blocked on counsel:** the two draft clauses, and the English-only language
position.

---

## Trademark

™ is correct and ® would not be — ® is reserved for marks registered with the
USPTO, and using it on an unregistered mark is itself unlawful in the US. ™
requires no registration.

Convention is **once per page**, at the first or most prominent use, plus the
wordmark. On every mention it reads as amateurish and adds nothing.

**Mark the codes, not the Scrum-derived names.** `AIGRM-I`, `AISM-I`, `AIE-I`,
`AIHR-I` are coined and distinctive. "Scrum Master I — AI" is built on an
industry term others have interests in, and asserting a mark over it invites the
argument you least want.

Surfaces: `certifications.name`, `certification_i18n.name`, the three PDF
renderers, the catalog, the console, the verify page. Terms §7 already reads
"the Certidemy and CertiGlobal marks" and is where they are asserted.
