# CERTIFICATE-LAYOUT-v4.md

Locked design for `_shared/certificate.ts`. Approved 2 August 2026.

Page: **A4 landscape, 841.89 × 595.28 pt**. All coordinates below are SVG-style —
origin top-left, y increasing downward. pdf-lib's origin is bottom-left, so
`y_pdf = 595.28 − y_here`.

Centre line is **x = 421**.

---

## 1. Palette

| Token | Hex | Used for |
|---|---|---|
| Brand magenta | `#E40064` | Frame ornament, accent rule. Matches the logo mark exactly. |
| Magenta text | `#be185d` | Title, code mark. WCAG-tuned variant for type on white. |
| Ink | `#111114` | Holder name, certification name, field values, signatory name |
| Muted | `#6e6e73` | Field labels, lead-in lines, role, QR caption |
| Keyline | `#dddde1` | Name rule, signature rule |

`#0066CC` (Pro Blue) does not appear. It was retired from both PDF renderers in
v3.7 and re-entered through the design mockup; it is out.

---

## 2. Field map

| Element | x | y | Type |
|---|---|---|---|
| Frame ornament | full page | — | `CERT_FRAME_PATHS`, fill `#E40064` |
| Badge | 85 | 92 → 200 | 85.06 × 108, from `badgeDataUri(cert.code)` |
| Wordmark | centred, 211 wide | image top 66.1 | `Certidemy-Logo.png`, ink lands y 78–111 |
| Title | 421 | 131 | 8.5pt SemiBold, `#be185d`, letter-spacing 2.2 |
| Accent rule | 403 → 439 | 142.5 | 36 × 2, `#E40064` |
| Lead-in 1 | 421 | 196 | 10.5pt Regular, `#6e6e73` |
| **Holder name** | 421 | 252 | SemiBold, **auto-shrink 38 → 20pt** to fit 400pt |
| Name rule | 221 → 621 | 264 | 400 × 0.75, `#dddde1` |
| Lead-in 2 | 421 | 300 | 10.5pt Regular, `#6e6e73` |
| **Certification name** | 421 | 344 | SemiBold, **auto-shrink 24 → 14pt** to fit 480pt |
| **Code mark** | 421 | 374 | see §3 |
| ISSUED label / value | 85 | 462 / 477 | 6.5pt SemiBold ls 1.3 `#6e6e73` / 10pt Medium `#111114` |
| EXPIRES label / value | 196 | 462 / 477 | same |
| CREDENTIAL ID label / value | 85 | 501 / 516 | same label; value 9pt mono, ls 0.3 |
| Signature | 371 → 471 | bottom at 486 | `CERT_SIGNATURE_PATHS`, fill `#1a1a1a` |
| Signature rule | 351 → 491 | 490 | 140 × 0.75, `#dddde1` |
| Signatory | 421 | 502 | 8.5pt SemiBold, `#111114` |
| Role | 421 | 513 | 7pt Regular, `#6e6e73`, ls 0.4 |
| QR | 681 | 445 | 78 × 78, inside the frame's own box |
| QR caption | 720 | 537 | 6pt Regular, `#6e6e73` |

---

## 3. The code mark

Drawn as **two separate text runs at computed x**, never as one string with a
superscript. pdf-lib has no tspan; and the SVG proof proved why it matters — a
size-changing tspan reserved advance width at the parent's size and opened a
35.5pt hole before the ™.

```
size      = 16pt, Inter Bold, #be185d, letter-spacing 1.6
tmSize    = size * 0.55      =  8.8pt
tmRise    = size * 0.32      =  5.12pt   (drawn above the baseline)
tmGap     = size * 0.06      =  0.96pt

width = adv(code, size) + 1.6 * (code.length - 1) + tmGap + adv("\u2122", tmSize)
x0    = 421 - width / 2

draw code at (x0, 374) with letter-spacing 1.6
draw "\u2122" at (x0 + adv(code,size) + 1.6*(code.length-1) + tmGap, 374 - tmRise)
```

For `AIGRM-I` this yields a total width of **82.0 pt** and a 2.0pt gap between
the final "I" and the ™, against 3.0–3.5pt between the letters themselves.

The code mark is **not localised**. It is the trademark and renders identically
in all three languages.

---

## 4. Label table

Needs sign-off — this is the one part authored rather than derived.

| key | en | es-419 | pt-BR |
|---|---|---|---|
| title | CERTIFICATE OF COMPETENCE | CERTIFICADO DE COMPETENCIA | CERTIFICADO DE COMPETÊNCIA |
| lead1 | This certifies that | Se certifica que | Certifica-se que |
| lead2 | has successfully earned the | ha obtenido satisfactoriamente la certificación | obteve com êxito a certificação |
| issued | ISSUED | EMITIDO | EMISSÃO |
| expires | EXPIRES | VENCE | VALIDADE |
| credentialId | CREDENTIAL ID | ID DE CREDENCIAL | ID DA CREDENCIAL |
| role | Managing Director | Director General | Diretor-Geral |
| scan | Scan to verify | Escanea para verificar | Escaneie para verificar |

QR caption is **6pt, not 6.5** — Portuguese is the longest at 65pt against a
69pt clear window, and 6.5pt runs into the frame's converging chevron diagonals.

---

## 5. Clearances that are not obvious

The frame ornament is not a plain rectangle; content collides with it in places
that look empty.

- **Bottom-centre ornament begins at y = 526.** Nothing in the signature column
  may sit below ~518.
- **Bottom-left ornament begins at y = 530.**
- **The QR box is frame art**, x 677–763, y 442–528. It is not drawn by the
  renderer. Moving the QR means editing the traced frame.
- **Below the QR box** the clear window is only y 530–544 by x 683–752. The
  chevron diagonals converge at x = 683 and x = 752, and a rail segment sits at
  y = 546 directly under the caption's x-range.

Verification method: render the frame layer and the content layer separately,
dilate the frame by 3pt, and count overlapping non-white pixels. The locked
design returns **0** in all three languages at 0, 2 and 3pt.

---

## 6. QR sizing

Worst realistic payload is the UUID verify URL (65 chars) at ECC **M** →
version 5, 37 modules, plus a **4-module quiet zone** = 45 modules across 78pt.

| | value |
|---|---|
| module | 1.733 pt = **0.611 mm** |
| dark area | 22.6 mm |
| quiet zone | 6.9 pt |
| decode floor | full page rendered at **100 dpi** (1170px wide) |

A phone photographing an A4 sheet produces 3,000–4,000px, so roughly a 3× margin.

**The quiet zone is not optional.** The first build used `border: 0` and the
frame's box line sat inside the required clear area.

---

## 7. Resolution ceilings

| Asset | Source | At print size | Effective |
|---|---|---|---|
| Badge | 501 × 501, ink 356 × 452 | 85.06 × 108 pt | **301 dpi** |
| Wordmark | 1081 × 301 | 211 pt wide | ~400 dpi |
| Frame | vector | — | ∞ |
| Signature | vector | — | ∞ |

The badge is at the ceiling. Enlarging it past 108pt drops it below 300 dpi;
130pt would be 250. Making the badge more prominent requires design to resupply
above 501 × 501, not a layout change.

---

## 8. Open before ship

1. **U+2122 in the font subset.** The subset is Latin-1 + Latin Extended-A +
   symbols. ™ is General Punctuation. If absent it renders a missing-glyph box
   and the text layer drops it silently — the v3.7 `%` failure exactly.
2. **Inter Bold embedded?** The code mark is 700 weight.
3. Specimen band and watermark still draw last, over everything.
4. Bump `RENDERER_VERSION`, then Regenerate all twelve credentials (5 real,
   7 specimen). The cache path already carries `v{VERSION}/{locale}/`.
5. Do **not** add `?target=deno` to the pdf-lib / fontkit / qrcode imports.
   That sweep was attempted and reverted; it regresses the PDF libraries.
