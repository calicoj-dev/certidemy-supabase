# CERTIFICATE-LAYOUT-v4.md

Geometry of the certificate as rendered by `_shared/certificate.ts` at
`CERTIFICATE_RENDERER_VERSION = "3"`. Approved 2 August 2026.

Supersedes `CERTIFICATE-DESIGN-SPEC.md` (v3.2 §9), which describes a layout that
no longer exists.

Page: **A4 landscape, 841.89 × 595.28 pt**. Every coordinate below is
**design space** — origin top-left, y increasing downward — which is what
`cert-art.ts` is baked in and what the renderer's `Y()` helper converts from.
pdf-lib's own origin is bottom-left: `y_pdf = 595.28 − y_here`.

Centre line is **x = 421**.

The approved design arrived as an 843 × 596 px mockup against a page of
841.89 × 595.28 pt — one pixel to the point. These numbers were measured off it,
not estimated.

---

## 1. Palette

| Token | Hex | Used for |
|---|---|---|
| Brand magenta | `#E40064` | Frame ornament, accent rule, specimen band |
| Magenta text | `#be185d` | Eyebrow, code mark, specimen watermark |
| Ink | `#111114` | Holder name, certification name, field values, signatory |
| Signature ink | `#1a1a1a` | Signature paths only |
| Muted | `#6e6e73` | Field labels, lead-in lines, role, QR caption |
| Keyline | `#dddde1` | Name rule, signature rule |

`#E40064` is the logo's magenta and is canonical. `#be185d` is the WCAG-tuned
variant `globals.css` documents for **type** on white. Artwork takes the former,
small type takes the latter.

**`#0066CC` does not appear.** It was retired from both PDF renderers in v3.7
and re-entered through the design mockup. It is out.

---

## 2. Field map

| Element | x | y | Detail |
|---|---|---|---|
| Frame ornament | full page | — | `CERT_FRAME_PATHS`, fill `#E40064` |
| **Badge** | ink box at **85** | ink box **92 → 200** | 85.06 × 108 of ink; see §4 |
| Wordmark | centred, 193 wide | top **78** | `wordmark.ts`, trimmed to ink |
| Eyebrow | 421 | **131** | 8.5pt SemiBold, `#be185d`, tracking 2.2 |
| Accent rule | 403 → 439 | **142.5** | 36 × 2, `#E40064` |
| Lead-in 1 | 421 | **196** | 10.5pt Regular, muted |
| **Holder name** | 421 | **252** | SemiBold, auto-shrink **38 → 20pt**, fits 400pt |
| Name rule | 221 → 621 | **264** | 400 × 0.75, keyline |
| Lead-in 2 | 421 | **300** | 10.5pt Regular, muted |
| **Certification name** | 421 | **344** | SemiBold, auto-shrink **24 → 14pt**, fits 480pt |
| **Code mark** | 421 | **374** | see §3 |
| ISSUED label / value | 85 | **462** / **477** | 6.5pt SemiBold tracking 1.3 / 10pt SemiBold |
| EXPIRES label / value | 196 | **462** / **477** | same; omitted entirely if `expires_at` is null |
| CREDENTIAL ID label / value | 85 | **501** / **516** | same label; value 9pt mono, tracking 0.3 |
| Signature | 371 → 471 | baseline seated **486** | `CERT_SIGNATURE_PATHS`, `#1a1a1a` |
| Signature rule | 351 → 491 | **490** | 140 × 0.75, keyline |
| Signatory | 421 | **502** | 8.5pt SemiBold |
| Role | 421 | **513** | 7pt Regular, muted, tracking 0.4 |
| QR block | 681 → 759 | **445 → 523** | 78pt including quiet zone; see §6 |
| QR caption | 720 | **537** | 6pt Regular, muted |

Auto-shrink steps by **0.25pt**, not 1pt. At a whole-point step a 27.5pt name
snaps to 27 and reads noticeably light against the rule beneath it.

No certification name currently triggers the shrink: the widest is AIGRM-I at
419.3pt against a 480pt budget.

---

## 3. The code mark

The certification code as a trademark, e.g. `AIGRM-I™`, centred at y = 374.

Drawn as **two runs at computed x**, never as one string with an inline size
change. pdf-lib has no tspan and no superscript — and the SVG proof of this
design demonstrated exactly why it matters: a size-changing inline run reserved
advance width at the **parent's** 16pt size while drawing the glyph at 8.8pt,
opening a **35.5pt hole** before the ™ against 3.0pt between the letters.

```
size    = 16pt, Inter Bold, #be185d, tracking 1.6
tmSize  = size * 0.55   =  8.8pt
tmRise  = size * 0.32   =  5.12pt   (drawn above the baseline)
tmGap   = size * 0.06   =  0.96pt

codeW = trackedWidth(code, size, bold, 1.6)
total = codeW + tmGap + widthOf("™", tmSize)
x0    = 421 - total / 2

draw code at (x0, 374), tracking 1.6
draw "™"  at (x0 + codeW + tmGap, 374 - tmRise), no tracking
```

Resulting widths: AIE-I 51.1pt, AIHR-I 65.5pt, AISM-I 68.4pt, SD-AI-I 74.1pt,
SM-AI-I 77.5pt, AIGRM-I 82.0pt, SPO-AI-I 86.9pt. All comfortable.

**The code mark is not localised.** It is the trademark and renders identically
in all three languages.

**U+2122 is in the font subset.** Verified by base64-decoding the format-4 cmap
in `fonts.ts` rather than trusting its header comment: there is a segment with
start U+2122 and end U+2122, in all three Inter weights. Inter Bold is embedded,
so the 700 weight is available.

---

## 4. The badge

`badges.ts` carries the **full 501 × 501 canvas** with its transparent margin,
so the drawn rectangle is **not** the visible artwork. Ink occupies roughly
x 72..427, y 24..475 — uniform to within a pixel across all seven, and near
enough centred that centring the canvas on the intended ink box lands within
0.15pt of measuring each margin individually.

```
INK_H  = 108
INK_W  = 108 * 356/452 = 85.06
canvas = 108 * 501/452 = 119.73
x      = 85 - (canvas - INK_W) / 2
yTop   = 92 - (canvas - INK_H) / 2
```

**108pt is the ceiling, not a preference.** 452 source pixels into 108pt is
exactly 301 dpi. Enlarging the badge makes it *worse*: 130pt would be 250 dpi and
the small type inside would soften. More prominence requires design to resupply
above 501 × 501, not a layout change.

If a resupplied set changes the trim, this is the constant to revisit.

---

## 5. Label table

The one part authored rather than derived.

| key | en | es-419 | pt-BR |
|---|---|---|---|
| eyebrow | CERTIFICATE OF COMPETENCE | CERTIFICADO DE COMPETENCIA | CERTIFICADO DE COMPETÊNCIA |
| presentedTo | This certifies that | Se certifica que | Certifica-se que |
| hasEarned | has successfully earned the | ha obtenido satisfactoriamente la certificación | obteve com êxito a certificação |
| issued | ISSUED | EMITIDO | EMISSÃO |
| expires | EXPIRES | VENCE | VALIDADE |
| credentialId | CREDENTIAL ID | ID DE CREDENCIAL | ID DA CREDENCIAL |
| role | Managing Director | Director General | Diretor-Geral |
| verifyHint | Scan to verify | Escanea para verificar | Escaneie para verificar |

**Dates are a hand-rolled month table, not `toLocaleDateString`.** With
`month: "long"`, Spanish gives "30 de septiembre de 2026" — **127.4pt** at 10pt
against **111pt** between the ISSUED and EXPIRES columns. It would collide. The
compact form is 61pt, and a local table is also immune to ICU data differing
between runtimes. UTC components are read on purpose so a late-evening issue
date cannot render as the previous day.

**The QR caption is 6pt, not 6.5.** Portuguese is the longest at 65pt against a
69pt window; at 6.5pt it runs into the frame's converging chevron diagonals.

---

## 6. QR

Drawn from the module matrix as rectangles, so it is vector like everything else.

Sized against the worst realistic payload — the UUID verify URL, 65 characters,
ECC **M** → version 5, 37 modules — plus a **4-module quiet zone** on every side,
45 across 78pt.

| | value |
|---|---|
| module | 1.733 pt = **0.611 mm** |
| dark area | 22.6 mm |
| quiet zone | 6.9 pt each side |
| decode floor | full page rendered at **100 dpi** (1170 px wide) |

A phone photographing an A4 sheet produces 3,000–4,000 px, so roughly a 3×
margin, and it holds for a printout of a printout.

**The quiet zone is not optional.** The first build of this design used
`border: 0` and the frame's own box outline sat inside the required clear area.

The QR sits **inside the frame's own box** at x 677–763, y 442–528. That box is
part of `CERT_FRAME_PATHS`; the renderer does not draw it. **Moving the QR means
re-tracing the frame.**

---

## 7. Clearances that are not visually obvious

The frame is not a rectangle. Content collides with it in places that look empty.

- **Bottom-centre ornament begins at y = 526.** Nothing in the signature column
  may sit below ~518.
- **Bottom-left ornament begins at y = 530.**
- **Below the QR box** the only clear window is **y 530–544 by x 683–752** — the
  chevron diagonals converge at those x values and a rail segment sits at y = 546.

**Verification method:** render the frame layer and the content layer
separately, dilate the frame by 3pt, and count overlapping non-white pixels. The
shipped design returns **0** in all three languages at 0, 2 and 3pt. This catches
near-misses that look fine at screen resolution — it found the caption 2pt from
the box edge and the badge overlapping the certification name's band, neither
visible in review.

---

## 8. Resolution ceilings

| Asset | Source | At print size | Effective |
|---|---|---|---|
| Badge | 501 × 501, ink 356 × 452 | 85.06 × 108 pt | **301 dpi** |
| Wordmark | 989 × 178, trimmed to ink | 193 pt wide | ~369 dpi |
| Frame | vector | — | ∞ |
| Signature | vector | — | ∞ |
| QR | vector | — | ∞ |

The badge is at its ceiling. The wordmark has headroom.

---

## 9. Specimen marks

Unchanged in intent from v3.7, restyled to the new palette.

A solid `#E40064` band across the top 30pt with the localised band text in white
at 8.5pt Bold tracking 2.2, plus a large `#be185d` watermark at 18% opacity,
auto-shrunk 120 → 56pt.

**Both are drawn LAST.** pdf-lib paints in call order; drawn any earlier they
would be covered by the certificate body and vanish silently.

---

## 10. Constraints for anyone changing this

1. **Do not add `?target=deno`** to the pdf-lib, fontkit or qrcode imports. That
   sweep was attempted and reverted — it regresses the PDF render libraries
   (SALES-LIBRARY-SPEC §11).
2. **Do not re-scale or re-position `cert-art.ts` paths.** The signature is baked
   at 100pt wide with its baseline at y = 486; the frame is baked at full page.
3. **Bump `CERTIFICATE_RENDERER_VERSION`** on any change to this renderer,
   `cert-art.ts`, `wordmark.ts`, `badges.ts`, or the font payload. It forms part
   of the storage path `{id}/v{VERSION}/{locale}/certificate.pdf`, so bumping it
   invalidates every stored certificate.
4. **`expires_at` must reach `certData` in both callers.** The column exists,
   both callers select it, and the interface accepts it — and it still failed to
   arrive, silently, because neither caller put it in the object.
5. **Regenerate all twelve credentials** through the console after deploying —
   5 real, 7 specimen.
