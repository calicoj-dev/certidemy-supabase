// supabase/functions/_shared/certificate.ts
//
// Renders a Certidemy credential certificate as a PDF (A4 landscape).
//
// pdf-lib only. The border ornament and the signature are vector paths
// (cert-art.ts); the wordmark and the certification badge are the only two
// rasters (wordmark.ts, badges.ts). The QR is drawn from its module matrix as
// rectangles, so it is vector too. Fonts are Inter + JetBrains Mono, subset and
// base64-embedded in fonts.ts, so the certificate renders identically whatever
// the reader has installed.
//
// No headless browser, no native deps -- Deno/edge-safe. The score is never
// rendered: a certificate states the credential was earned, not the grade.
//
// IMPORT STYLE IS LOAD-BEARING. Do not add `?target=deno` to pdf-lib, fontkit
// or qrcode. That sweep was attempted and reverted because it regresses the PDF
// render libraries (SALES-LIBRARY-SPEC s11).
import {
  PDFDocument,
  rgb,
  type PDFFont,
  type PDFPage,
} from "https://esm.sh/pdf-lib@1.17.1";
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1";
import QRCode from "https://esm.sh/qrcode@1.5.3";
import {
  INTER_REGULAR_B64,
  INTER_SEMIBOLD_B64,
  INTER_BOLD_B64,
  JETBRAINS_MONO_B64,
  b64ToBytes,
} from "./fonts.ts";
import {
  PAGE_W,
  PAGE_H,
  CERT_FRAME_PATHS,
  CERT_SIGNATURE_PATHS,
} from "./cert-art.ts";
import { WORDMARK_ASPECT, wordmarkBytes } from "./wordmark.ts";
import { badgeDataUri } from "./badges.ts";

// ---- palette ----
//
// The logo's magenta is #E40064 and that is canonical. #be185d is the
// contrast-tuned variant globals.css documents for TYPE on white. So: artwork
// sits at #E40064, small type sits at #be185d. #0066CC ("Pro Blue") does not
// appear -- it was retired from both PDF renderers in v3.7 and re-entered
// through a design mockup; it is out.
const MAGENTA = rgb(0xe4 / 255, 0x00 / 255, 0x64 / 255); // #E40064 artwork
const MAGENTA_TEXT = rgb(0xbe / 255, 0x18 / 255, 0x5d / 255); // #be185d type
const INK = rgb(0x11 / 255, 0x11 / 255, 0x14 / 255);
const INK_SIG = rgb(0x1a / 255, 0x1a / 255, 0x1a / 255);
const MUTE = rgb(0x6e / 255, 0x6e / 255, 0x73 / 255);
const RULE = rgb(0xdd / 255, 0xdd / 255, 0xe1 / 255);
const WHITE = rgb(1, 1, 1);

/**
 * Bump on ANY change to this renderer, to cert-art.ts, to wordmark.ts, to
 * badges.ts, or to the font payload: layout, palette, typeface, wording, the
 * specimen marks. It forms part of the storage path, so bumping it invalidates
 * every stored certificate and the next request re-renders.
 *
 * 1 - initial
 * 2 - specimen band and watermark; brand magenta palette
 * 3 - approved design: traced frame, wordmark, badge, code mark, expiry,
 *     vector signature, QR with a real quiet zone
 * 4 - wording keyed to achievementType; no Certidemy signature on a
 *     certificate Certidemy did not issue
 */
export const CERTIFICATE_RENDERER_VERSION = "4";

export interface CertificateData {
  id: string;
  credential_code: string;
  holder_name: string;
  certification_name: string;
  certification_code: string;
  issued_at: string;
  /**
   * Credentials are 365-day. When present this renders as EXPIRES beside
   * ISSUED, which is what makes the document read as a certification rather
   * than a course completion. Optional so a caller that has not been updated
   * still compiles -- but a caller that omits it produces a certificate with no
   * expiry on its face, so BOTH callers must pass it. See the note in
   * CERT-PUBLISH-CHECKLIST.
   */
  expires_at?: string | null;
  /**
   * Marketing specimen. Renders through this same path so it cannot drift from
   * a real certificate, but carries an unmistakable mark. Optional so existing
   * callers keep compiling; a caller that omits it produces an UNMARKED
   * document, so every caller must be checked.
   */
  is_specimen?: boolean;

  /**
   * OB 3.0 achievementType. Selects the wording -- a Course is completed, a
   * Certification is earned, a Diploma is awarded.
   *
   * Optional so the existing caller compiles, and absent reads as a
   * certification, which is what every credential was before partners existed.
   * A caller that omits it on a PARTNER credential prints "CERTIFICATE OF
   * COMPETENCE" over a weekend course.
   */
  achievement_type?: string | null;

  /**
   * False when Certidemy is hosting rather than issuing.
   *
   * Controls the SIGNATURE, which is the part that matters: absent or true
   * draws Juan Roman's signature, and drawing that on a partner's document is
   * a real person's signature on a certificate they had nothing to do with.
   */
  is_certification?: boolean;

  /** The issuing organisation, printed on the signature rule for a partner. */
  issuer_name?: string | null;
}

type Locale = "en" | "es-419" | "pt-BR";

/**
 * The banner and the verb, per kind of thing.
 *
 * OB 3.0 defines achievementType and no display strings whatsoever, so this
 * table is entirely Certidemy's editorial judgement. It exists because a
 * course attendee did not demonstrate competence, and printing that they did
 * -- on a document their employer may read -- is a claim we would be making
 * for a partner who never made it.
 *
 * A type not listed falls through to the certification wording, which is the
 * conservative direction ONLY for Certidemy's own schemes. A partner using an
 * unusual type gets wording that overstates, so new types belong here.
 */
interface KindWords {
  eyebrow: string;
  verb: string;
}

const KIND_WORDS: Record<Locale, Record<string, KindWords>> = {
  "en": {
    Course: { eyebrow: "CERTIFICATE OF COMPLETION", verb: "has successfully completed" },
    LearningProgram: { eyebrow: "CERTIFICATE OF COMPLETION", verb: "has successfully completed" },
    Certificate: { eyebrow: "CERTIFICATE OF COMPLETION", verb: "has successfully completed" },
    CertificateOfCompletion: { eyebrow: "CERTIFICATE OF COMPLETION", verb: "has successfully completed" },
    Diploma: { eyebrow: "DIPLOMA", verb: "has been awarded the" },
    Assessment: { eyebrow: "CERTIFICATE OF ACHIEVEMENT", verb: "has passed the" },
    License: { eyebrow: "LICENSE", verb: "is licensed as" },
    Membership: { eyebrow: "CERTIFICATE OF MEMBERSHIP", verb: "is recognised as" },
    Badge: { eyebrow: "CERTIFICATE OF ACHIEVEMENT", verb: "has earned the" },
    MicroCredential: { eyebrow: "CERTIFICATE OF ACHIEVEMENT", verb: "has earned the" },
  },
  "es-419": {
    Course: { eyebrow: "CERTIFICADO DE FINALIZACI\u00D3N", verb: "ha completado satisfactoriamente" },
    LearningProgram: { eyebrow: "CERTIFICADO DE FINALIZACI\u00D3N", verb: "ha completado satisfactoriamente" },
    Certificate: { eyebrow: "CERTIFICADO DE FINALIZACI\u00D3N", verb: "ha completado satisfactoriamente" },
    CertificateOfCompletion: { eyebrow: "CERTIFICADO DE FINALIZACI\u00D3N", verb: "ha completado satisfactoriamente" },
    Diploma: { eyebrow: "DIPLOMA", verb: "ha recibido el" },
    Assessment: { eyebrow: "CERTIFICADO DE LOGRO", verb: "ha aprobado" },
    License: { eyebrow: "LICENCIA", verb: "est\u00E1 habilitado como" },
    Membership: { eyebrow: "CERTIFICADO DE MEMBRES\u00CDA", verb: "es reconocido como" },
    Badge: { eyebrow: "CERTIFICADO DE LOGRO", verb: "ha obtenido" },
    MicroCredential: { eyebrow: "CERTIFICADO DE LOGRO", verb: "ha obtenido" },
  },
  "pt-BR": {
    Course: { eyebrow: "CERTIFICADO DE CONCLUS\u00C3O", verb: "concluiu com \u00EAxito" },
    LearningProgram: { eyebrow: "CERTIFICADO DE CONCLUS\u00C3O", verb: "concluiu com \u00EAxito" },
    Certificate: { eyebrow: "CERTIFICADO DE CONCLUS\u00C3O", verb: "concluiu com \u00EAxito" },
    CertificateOfCompletion: { eyebrow: "CERTIFICADO DE CONCLUS\u00C3O", verb: "concluiu com \u00EAxito" },
    Diploma: { eyebrow: "DIPLOMA", verb: "recebeu o" },
    Assessment: { eyebrow: "CERTIFICADO DE APROVEITAMENTO", verb: "foi aprovado em" },
    License: { eyebrow: "LICEN\u00C7A", verb: "est\u00E1 habilitado como" },
    Membership: { eyebrow: "CERTIFICADO DE ASSOCIA\u00C7\u00C3O", verb: "\u00E9 reconhecido como" },
    Badge: { eyebrow: "CERTIFICADO DE APROVEITAMENTO", verb: "obteve" },
    MicroCredential: { eyebrow: "CERTIFICADO DE APROVEITAMENTO", verb: "obteve" },
  },
};

const STRINGS: Record<Locale, {
  eyebrow: string;
  presentedTo: string;
  hasEarned: string;
  issued: string;
  expires: string;
  credentialId: string;
  role: string;
  verifyHint: string;
  specimenBand: string;
  specimenMark: string;
  months: readonly string[];
}> = {
  "en": {
    eyebrow: "CERTIFICATE OF COMPETENCE",
    presentedTo: "This certifies that",
    hasEarned: "has successfully earned the",
    issued: "ISSUED",
    expires: "EXPIRES",
    credentialId: "CREDENTIAL ID",
    role: "Managing Director",
    verifyHint: "Scan to verify",
    specimenBand: "SPECIMEN \u00B7 NOT A CERTIFICATION DECISION",
    specimenMark: "SPECIMEN",
    months: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ],
  },
  "es-419": {
    eyebrow: "CERTIFICADO DE COMPETENCIA",
    presentedTo: "Se certifica que",
    hasEarned: "ha obtenido satisfactoriamente la certificaci\u00F3n",
    issued: "EMITIDO",
    expires: "VENCE",
    credentialId: "ID DE CREDENCIAL",
    role: "Director General",
    verifyHint: "Escanea para verificar",
    specimenBand: "MUESTRA \u00B7 NO ES UNA DECISI\u00D3N DE CERTIFICACI\u00D3N",
    specimenMark: "MUESTRA",
    months: [
      "ene", "feb", "mar", "abr", "may", "jun",
      "jul", "ago", "sep", "oct", "nov", "dic",
    ],
  },
  "pt-BR": {
    eyebrow: "CERTIFICADO DE COMPET\u00CANCIA",
    presentedTo: "Certifica-se que",
    hasEarned: "obteve com \u00EAxito a certifica\u00E7\u00E3o",
    issued: "EMISS\u00C3O",
    expires: "VALIDADE",
    credentialId: "ID DA CREDENCIAL",
    role: "Diretor-Geral",
    verifyHint: "Escaneie para verificar",
    specimenBand:
      "AMOSTRA \u00B7 N\u00C3O \u00C9 UMA DECIS\u00C3O DE CERTIFICA\u00C7\u00C3O",
    specimenMark: "AMOSTRA",
    months: [
      "jan", "fev", "mar", "abr", "mai", "jun",
      "jul", "ago", "set", "out", "nov", "dez",
    ],
  },
};

function normalizeLocale(loc: string | null | undefined): Locale {
  if (loc === "es-419" || loc === "pt-BR") return loc;
  return "en";
}

/**
 * Compact date: "2 Aug 2026" / "2 ago 2026".
 *
 * Deliberately NOT toLocaleDateString with month: "long". ISSUED and EXPIRES
 * sit side by side with 111pt between their left edges, and "30 de septiembre
 * de 2026" is 110pt at 10pt -- it would touch the next column. A hand-rolled
 * table is also immune to ICU data differing between runtimes.
 *
 * UTC components on purpose: issued_at is a timestamptz and the edge runs UTC,
 * but reading local components would let a late-evening issue date render as
 * the previous day if that ever changes.
 */
function fmtDate(iso: string, t: (typeof STRINGS)[Locale]): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const m = t.months[d.getUTCMonth()] ?? "";
  return `${d.getUTCDate()} ${m} ${d.getUTCFullYear()}`;
}

/** Convert a design-space y (top-left origin) to a pdf-lib y. */
function Y(v: number): number {
  return PAGE_H - v;
}

/** Advance width of a tracked run, excluding the trailing track. */
function trackedWidth(
  text: string,
  size: number,
  font: PDFFont,
  track: number,
): number {
  const chars = [...text];
  if (chars.length === 0) return 0;
  let total = 0;
  for (const ch of chars) total += font.widthOfTextAtSize(ch, size) + track;
  return total - track;
}

/** Draw tracked text from a left edge. Design-space y (baseline). */
function drawTracked(
  page: PDFPage,
  text: string,
  x: number,
  yDesign: number,
  size: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
  track: number,
) {
  let cx = x;
  const y = Y(yDesign);
  for (const ch of [...text]) {
    page.drawText(ch, { x: cx, y, size, font, color });
    cx += font.widthOfTextAtSize(ch, size) + track;
  }
}

/** Draw tracked text centred on cx. Design-space y (baseline). */
function drawTrackedCentered(
  page: PDFPage,
  text: string,
  cx: number,
  yDesign: number,
  size: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
  track: number,
) {
  const w = trackedWidth(text, size, font, track);
  drawTracked(page, text, cx - w / 2, yDesign, size, font, color, track);
}

/** Draw plain text centred on cx. Design-space y (baseline). */
function drawCentered(
  page: PDFPage,
  text: string,
  cx: number,
  yDesign: number,
  size: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: cx - w / 2, y: Y(yDesign), size, font, color });
}

/** Draw plain text from a left edge. Design-space y (baseline). */
function drawAt(
  page: PDFPage,
  text: string,
  x: number,
  yDesign: number,
  size: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
) {
  page.drawText(text, { x, y: Y(yDesign), size, font, color });
}

/** Filled rectangle in design space (x, yTop, w, h). */
function drawRect(
  page: PDFPage,
  x: number,
  yTop: number,
  w: number,
  h: number,
  color: ReturnType<typeof rgb>,
) {
  page.drawRectangle({ x, y: Y(yTop + h), width: w, height: h, color });
}

/**
 * Largest size at or below `start` that fits `maxW`, stepping by 0.25.
 *
 * The quarter-point step matters. At a whole-point step a 27.5pt name snaps to
 * 27pt and the line reads noticeably light against the rule beneath it.
 */
function fitSize(
  text: string,
  font: PDFFont,
  start: number,
  min: number,
  maxW: number,
): number {
  let s = start;
  while (s > min && font.widthOfTextAtSize(text, s) > maxW) s -= 0.25;
  return s;
}

/**
 * The code mark, e.g. AIGRM-I(tm), centred on cx.
 *
 * Drawn as TWO runs at computed x, never as one string. pdf-lib has no tspan
 * and no superscript; and the SVG proof of this design showed exactly why it
 * matters -- a size-changing inline run reserved advance width at the PARENT's
 * size and opened a 35.5pt hole before the trademark. Two runs, one measured
 * gap, no surprises.
 *
 * U+2122 is in the font subset. Verified against the cmap in fonts.ts rather
 * than trusted from its header comment: segment start U+2122, end U+2122.
 */
function drawCodeMark(
  page: PDFPage,
  code: string,
  cx: number,
  yDesign: number,
  size: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
) {
  const TRACK = 1.6;
  const tmSize = size * 0.55;
  const tmRise = size * 0.32;
  const tmGap = size * 0.06;
  const TM = "\u2122";

  const codeW = trackedWidth(code, size, font, TRACK);
  const tmW = font.widthOfTextAtSize(TM, tmSize);
  const total = codeW + tmGap + tmW;
  const x0 = cx - total / 2;

  drawTracked(page, code, x0, yDesign, size, font, color, TRACK);
  page.drawText(TM, {
    x: x0 + codeW + tmGap,
    y: Y(yDesign - tmRise),
    size: tmSize,
    font,
    color,
  });
}

export async function renderCertificate(
  cred: CertificateData,
  localeRaw: string,
  verifyBaseUrl: string,
): Promise<Uint8Array> {
  const locale = normalizeLocale(localeRaw);
  const t = STRINGS[locale];

  /* Certidemy issuing, versus Certidemy hosting. Absent means true, so every
     caller written before partners existed keeps its behaviour exactly. */
  const certidemyIssued = cred.is_certification !== false;

  /* The banner and the verb. A Certidemy scheme always uses the certification
     wording regardless of what its achievement row says -- that wording is the
     product's own claim and does not follow a type field. */
  const kind = certidemyIssued
    ? null
    : KIND_WORDS[locale][cred.achievement_type ?? ""] ??
      // A PARTNER whose type is not in the table falls back to the weakest
      // honest wording, not the strongest. t.eyebrow is "CERTIFICATE OF
      // COMPETENCE" -- the conservative default for a Certidemy scheme and the
      // reckless one for anybody else, because an unrecognised type would
      // print the biggest claim we have on a document we know least about.
      KIND_WORDS[locale].Certificate ?? null;
  const eyebrowText = kind?.eyebrow ?? t.eyebrow;
  const verbText = kind?.verb ?? t.hasEarned;

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`${cred.certification_name} \u2014 ${cred.holder_name}`);
  doc.setAuthor("Certidemy");
  // Shows in a reader's document properties. Same claim, same rule.
  doc.setSubject(
    certidemyIssued ? "Certificate of Competence" : eyebrowText,
  );
  doc.setCreator("Certidemy");
  doc.setProducer("Certidemy");

  const reg = await doc.embedFont(b64ToBytes(INTER_REGULAR_B64));
  const semi = await doc.embedFont(b64ToBytes(INTER_SEMIBOLD_B64));
  const bold = await doc.embedFont(b64ToBytes(INTER_BOLD_B64));
  const mono = await doc.embedFont(b64ToBytes(JETBRAINS_MONO_B64));

  const page = doc.addPage([PAGE_W, PAGE_H]);
  const CX = 421; // design centre line

  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_W,
    height: PAGE_H,
    color: WHITE,
  });

  // ---- frame ornament (vector) ----
  // Includes the QR box outline. The renderer does not draw that box.
  for (const d of CERT_FRAME_PATHS) {
    page.drawSvgPath(d, { x: 0, y: PAGE_H, scale: 1, color: MAGENTA });
  }

  // ---- wordmark ----
  // wordmark.ts is trimmed to its ink, so the drawn rectangle IS the mark.
  {
    const w = 193;
    const h = w / WORDMARK_ASPECT;
    const img = await doc.embedPng(wordmarkBytes());
    page.drawImage(img, { x: CX - w / 2, y: Y(78 + h), width: w, height: h });
  }

  // ---- eyebrow + accent rule ----
  drawTrackedCentered(page, eyebrowText, CX, 131, 8.5, semi, MAGENTA_TEXT, 2.2);
  drawRect(page, 403, 142.5, 36, 2, MAGENTA);

  // ---- holder ----
  drawCentered(page, t.presentedTo, CX, 196, 10.5, reg, MUTE);
  const nameSize = fitSize(cred.holder_name, semi, 38, 20, 400);
  drawCentered(page, cred.holder_name, CX, 252, nameSize, semi, INK);
  drawRect(page, 221, 264, 400, 0.75, RULE);

  // ---- certification ----
  drawCentered(page, verbText, CX, 300, 10.5, reg, MUTE);
  const certSize = fitSize(cred.certification_name, semi, 24, 14, 480);
  drawCentered(page, cred.certification_name, CX, 344, certSize, semi, INK);
  if (cred.certification_code) {
    drawCodeMark(page, cred.certification_code, CX, 374, 16, bold, MAGENTA_TEXT);
  }

  // ---- badge, top left ----
  //
  // badges.ts carries the FULL 501x501 canvas with its transparent margin, so
  // the drawn rectangle is NOT the visible artwork. Ink occupies roughly
  // x 72..427, y 24..475 of 501 -- uniform to within a pixel across all seven,
  // and near enough centred that centring the canvas on the intended ink box
  // lands within 0.15pt of measuring each margin. If design ever resupplies
  // with a different trim, this is the constant to revisit.
  //
  // 108pt of ink height puts 452 source pixels into 108pt = 301 dpi. That is
  // the ceiling: making the badge LARGER makes it worse, not better. More
  // prominence needs bigger source art, not a bigger box.
  {
    const uri = badgeDataUri(cred.certification_code);
    if (uri) {
      const INK_H = 108;
      const INK_W = INK_H * (356 / 452);
      const canvas = INK_H * (501 / 452);
      const img = await doc.embedPng(uri);
      const x = 85 - (canvas - INK_W) / 2;
      const yTop = 92 - (canvas - INK_H) / 2;
      page.drawImage(img, {
        x,
        y: Y(yTop + canvas),
        width: canvas,
        height: canvas,
      });
    }
  }

  // ---- data block, bottom left ----
  const label = (s: string, x: number, y: number) =>
    drawTracked(page, s, x, y, 6.5, semi, MUTE, 1.3);

  label(t.issued, 85, 462);
  drawAt(page, fmtDate(cred.issued_at, t), 85, 477, 10, semi, INK);

  if (cred.expires_at) {
    label(t.expires, 196, 462);
    drawAt(page, fmtDate(cred.expires_at, t), 196, 477, 10, semi, INK);
  }

  label(t.credentialId, 85, 501);
  drawTracked(page, cred.credential_code, 85, 516, 9, mono, INK, 0.3);

  /* ---- signature, centre ----------------------------------------------

     CERT_SIGNATURE_PATHS is Juan Roman's actual signature. Drawing it on a
     certificate Certidemy did not issue puts a real person's signature on
     somebody else's document -- which is a different kind of wrong from
     printing the wrong noun.

     A partner certificate is UNSIGNED until they supply one. migration 233's
     issuer_branding holds signature_name, signature_title and signature_svg_d
     for exactly this and nothing reads them yet; until something does, the
     honest render is their name on the rule and nothing above it. An unsigned
     certificate is a true document. A misattributed signature is not. */
  if (certidemyIssued) {
    for (const d of CERT_SIGNATURE_PATHS) {
      page.drawSvgPath(d, { x: 0, y: PAGE_H, scale: 1, color: INK_SIG });
    }
  }
  drawRect(page, 351, 490, 140, 0.75, RULE);
  if (certidemyIssued) {
    drawCentered(page, "Juan Roman", CX, 502, 8.5, semi, INK);
    drawTrackedCentered(page, t.role, CX, 513, 7, reg, MUTE, 0.4);
  } else if (cred.issuer_name) {
    // Name only. No role -- we do not know who at that organisation stands
    // behind this, and inventing a title would be the same error one step
    // removed.
    const nameSize = fitSize(cred.issuer_name, semi, 8.5, 6, 138);
    drawCentered(page, cred.issuer_name, CX, 502, nameSize, semi, INK);
  }

  // ---- QR, bottom right ----
  //
  // Sits INSIDE the frame's own box (x 677-763, y 442-528). The 78pt block
  // INCLUDES a 4-module quiet zone on every side -- that is not optional, and
  // the first build of this design shipped without it: the box outline sat
  // inside the required clear area and the finder patterns were compromised.
  //
  // Worst realistic payload is the UUID verify URL, 65 chars, ECC M -> version
  // 5, 37 modules, 45 across 78pt = 0.611mm per module. Decodes from a full
  // page rendered at 100 dpi; a phone photographing an A4 sheet gives 3-4x.
  {
    const verifyUrl = `${verifyBaseUrl.replace(/\/+$/, "")}/verify/${cred.id}`;
    // deno-lint-ignore no-explicit-any
    const qr = (QRCode as any).create(verifyUrl, { errorCorrectionLevel: "M" });
    const n = qr.modules.size as number;
    const data = qr.modules.data as Uint8Array;

    const BLOCK = 78;
    const QUIET = 4;
    const cell = BLOCK / (n + QUIET * 2);
    const qx = 681 + QUIET * cell;
    const qyTop = 445 + QUIET * cell;

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (data[r * n + c]) {
          page.drawRectangle({
            x: qx + c * cell,
            y: Y(qyTop + (r + 1) * cell),
            width: cell,
            height: cell,
            color: INK,
          });
        }
      }
    }
    // Caption sits BELOW the box, in the only clear window there: y 530-544 by
    // x 683-752. 6pt, not 6.5 -- Portuguese is the longest at 65pt against a
    // 69pt window, and at 6.5pt it runs into the converging chevron diagonals.
    drawCentered(page, t.verifyHint, 720, 537, 6, reg, MUTE);
  }

  // ---- specimen marks ----
  //
  // LAST on purpose. pdf-lib paints in call order; drawn any earlier these
  // would be covered by the certificate body and vanish silently.
  if (cred.is_specimen) {
    page.drawRectangle({
      x: 0,
      y: PAGE_H - 30,
      width: PAGE_W,
      height: 30,
      color: MAGENTA,
    });
    drawTrackedCentered(page, t.specimenBand, CX, 20, 8.5, bold, WHITE, 2.2);

    // Light enough that the design still reads -- a specimen nobody can look
    // at is useless to the people who asked for one.
    const markSize = fitSize(t.specimenMark, bold, 120, 56, PAGE_W - 112);
    const markW = bold.widthOfTextAtSize(t.specimenMark, markSize);
    page.drawText(t.specimenMark, {
      x: CX - markW / 2,
      y: PAGE_H / 2 - markSize / 3,
      size: markSize,
      font: bold,
      color: MAGENTA_TEXT,
      opacity: 0.18,
    });
  }

  return await doc.save();
}
