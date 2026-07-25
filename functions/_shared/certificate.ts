// supabase/functions/_shared/certificate.ts
//
// Renders a Certidemy credential certificate as a PDF (A4 landscape).
//
// Pure pdf-lib + a vector QR drawn from the module matrix. Uses the app's
// own typefaces (Inter + JetBrains Mono), subset and base64-embedded in
// _shared/fonts.ts, so the certificate matches the product visually and
// renders identically regardless of the viewer's installed fonts.
//
// No headless browser, no native deps — Deno/edge-safe. The score is never
// rendered: a certificate states the credential was earned, not the grade.
//
// Design note: this is the clean v1. The seal and background texture are
// intentionally restrained; richer treatment is deferred to the
// Motion & Cohesion sprint.

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

// ---- palette (Apple-derived, matches app tokens) ----
const INK = rgb(0x1d / 255, 0x1d / 255, 0x1f / 255);
const INK_SOFT = rgb(0x42 / 255, 0x42 / 255, 0x47 / 255);
const INK_MUTE = rgb(0x86 / 255, 0x86 / 255, 0x8b / 255);
const ACCENT = rgb(0x00 / 255, 0x66 / 255, 0xcc / 255);
const ACCENT_DEEP = rgb(0x00 / 255, 0x4a / 255, 0x99 / 255);
const HAIRLINE = rgb(0xd2 / 255, 0xd2 / 255, 0xd7 / 255);
const KEYLINE = rgb(0.91, 0.94, 0.98);
const SEAL_FILL = rgb(0.96, 0.98, 1);
const SEAL_INNER = rgb(0.8, 0.88, 0.97);
const WHITE = rgb(1, 1, 1);

export interface CertificateData {
  id: string;
  credential_code: string;
  holder_name: string;
  certification_name: string;
  certification_code: string;
  issued_at: string;
}

type Locale = "en" | "es-419" | "pt-BR";

const STRINGS: Record<Locale, {
  eyebrow: string;
  presentedTo: string;
  hasEarned: string;
  issued: string;
  credentialId: string;
  verifyHint: string;
}> = {
  "en": {
    eyebrow: "CERTIFICATE OF ACHIEVEMENT",
    presentedTo: "This certifies that",
    hasEarned: "has successfully earned the",
    issued: "ISSUED",
    credentialId: "CREDENTIAL ID",
    verifyHint: "Scan to verify",
  },
  "es-419": {
    eyebrow: "CERTIFICADO DE LOGRO",
    presentedTo: "Se certifica que",
    hasEarned: "ha obtenido satisfactoriamente la certificación",
    issued: "EMITIDO",
    credentialId: "ID DE CREDENCIAL",
    verifyHint: "Escanea para verificar",
  },
  "pt-BR": {
    eyebrow: "CERTIFICADO DE CONQUISTA",
    presentedTo: "Certifica-se que",
    hasEarned: "concluiu com êxito a certificação",
    issued: "EMITIDO",
    credentialId: "ID DA CREDENCIAL",
    verifyHint: "Escaneie para verificar",
  },
};

function normalizeLocale(loc: string | null | undefined): Locale {
  if (loc === "es-419" || loc === "pt-BR") return loc;
  return "en";
}

function fmtDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  const intlLoc = locale === "es-419" ? "es" : locale === "pt-BR" ? "pt-BR" : "en";
  try {
    return d.toLocaleDateString(intlLoc, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

// Draw centered text with manual letter-spacing (tracking).
function drawTracked(
  page: PDFPage,
  text: string,
  cx: number,
  y: number,
  size: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
  track: number,
) {
  const chars = [...text];
  let total = 0;
  for (const ch of chars) total += font.widthOfTextAtSize(ch, size) + track;
  total -= track;
  let x = cx - total / 2;
  for (const ch of chars) {
    page.drawText(ch, { x, y, size, font, color });
    x += font.widthOfTextAtSize(ch, size) + track;
  }
}

// Shrink-to-fit: largest size at or below `start` that fits within maxW.
function fitSize(
  text: string,
  font: PDFFont,
  start: number,
  min: number,
  maxW: number,
): number {
  let s = start;
  while (s > min && font.widthOfTextAtSize(text, s) > maxW) s -= 1;
  return s;
}

export async function renderCertificate(
  cred: CertificateData,
  localeRaw: string,
  verifyBaseUrl: string,
): Promise<Uint8Array> {
  const locale = normalizeLocale(localeRaw);
  const t = STRINGS[locale];

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`${cred.certification_name} — ${cred.holder_name}`);
  doc.setAuthor("Certidemy");
  doc.setSubject("Certificate of Achievement");
  doc.setCreator("Certidemy");
  doc.setProducer("Certidemy");

  const reg = await doc.embedFont(b64ToBytes(INTER_REGULAR_B64));
  const semi = await doc.embedFont(b64ToBytes(INTER_SEMIBOLD_B64));
  const bold = await doc.embedFont(b64ToBytes(INTER_BOLD_B64));
  const mono = await doc.embedFont(b64ToBytes(JETBRAINS_MONO_B64));

  // A4 landscape
  const W = 841.89, H = 595.28;
  const page = doc.addPage([W, H]);
  const cx = W / 2;

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: WHITE });

  const M = 36;
  page.drawRectangle({
    x: M, y: M, width: W - 2 * M, height: H - 2 * M,
    borderColor: HAIRLINE, borderWidth: 1, color: WHITE,
  });
  page.drawRectangle({
    x: M + 8, y: M + 8, width: W - 2 * (M + 8), height: H - 2 * (M + 8),
    borderColor: KEYLINE, borderWidth: 1,
  });

  // Wordmark
  const brand = "Certidemy";
  const brandSize = 15;
  const brandW = bold.widthOfTextAtSize(brand, brandSize);
  page.drawText(brand, { x: cx - brandW / 2, y: H - 92, size: brandSize, font: bold, color: INK });

  // Eyebrow (mono — echoes the app's font-label treatment)
  drawTracked(page, t.eyebrow, cx, H - 130, 9.5, mono, ACCENT, 1.5);
  page.drawRectangle({ x: cx - 18, y: H - 144, width: 36, height: 2, color: ACCENT });

  // "This certifies that"
  const ptSize = 13;
  const ptW = reg.widthOfTextAtSize(t.presentedTo, ptSize);
  page.drawText(t.presentedTo, { x: cx - ptW / 2, y: H - 196, size: ptSize, font: reg, color: INK_SOFT });

  // Holder name — hero line
  const nameSize = fitSize(cred.holder_name, semi, 46, 22, W - 2 * (M + 60));
  const nameW = semi.widthOfTextAtSize(cred.holder_name, nameSize);
  page.drawText(cred.holder_name, { x: cx - nameW / 2, y: H - 250, size: nameSize, font: semi, color: INK });
  page.drawRectangle({ x: cx - nameW / 2, y: H - 264, width: nameW, height: 0.75, color: HAIRLINE });

  // "has earned the"
  const heSize = fitSize(t.hasEarned, reg, 13, 10, W - 2 * (M + 60));
  const heW = reg.widthOfTextAtSize(t.hasEarned, heSize);
  page.drawText(t.hasEarned, { x: cx - heW / 2, y: H - 300, size: heSize, font: reg, color: INK_SOFT });

  // Certification name
  const certSize = fitSize(cred.certification_name, bold, 26, 14, W - 2 * (M + 80));
  const certW = bold.widthOfTextAtSize(cred.certification_name, certSize);
  page.drawText(cred.certification_name, { x: cx - certW / 2, y: H - 340, size: certSize, font: bold, color: ACCENT_DEEP });

  // ---- footer band ----
  const footY = M + 70;
  const leftX = M + 48;

  page.drawText(t.issued, { x: leftX, y: footY + 28, size: 8, font: bold, color: INK_MUTE });
  page.drawText(fmtDate(cred.issued_at, locale), { x: leftX, y: footY + 12, size: 11, font: reg, color: INK });
  page.drawText(t.credentialId, { x: leftX, y: footY - 14, size: 8, font: bold, color: INK_MUTE });
  page.drawText(cred.credential_code, { x: leftX, y: footY - 30, size: 11, font: mono, color: INK });

  // Seal (restrained v1)
  page.drawCircle({ x: cx, y: footY + 2, size: 30, borderColor: ACCENT, borderWidth: 1.5, color: SEAL_FILL });
  page.drawCircle({ x: cx, y: footY + 2, size: 25, borderColor: SEAL_INNER, borderWidth: 0.75 });
  const mm = "C";
  const mmSize = 26;
  const mmW = bold.widthOfTextAtSize(mm, mmSize);
  page.drawText(mm, { x: cx - mmW / 2, y: footY + 2 - mmSize / 2 + 3, size: mmSize, font: bold, color: ACCENT_DEEP });

  // QR — vector, drawn from module matrix
  const verifyUrl = `${verifyBaseUrl.replace(/\/+$/, "")}/verify/${cred.id}`;
  // deno-lint-ignore no-explicit-any
  const qr = (QRCode as any).create(verifyUrl, { errorCorrectionLevel: "M" });
  const size = qr.modules.size as number;
  const data = qr.modules.data as Uint8Array;
  const qpx = 76;
  const cell = qpx / size;
  const qx = W - (M + 48) - qpx;
  const qy = footY - 34;
  page.drawRectangle({ x: qx - 5, y: qy - 5, width: qpx + 10, height: qpx + 10, color: WHITE, borderColor: HAIRLINE, borderWidth: 0.5 });
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (data[r * size + c]) {
        page.drawRectangle({
          x: qx + c * cell,
          y: qy + (size - 1 - r) * cell,
          width: cell, height: cell, color: INK,
        });
      }
    }
  }
  const vhSize = 7.5;
  const vhW = reg.widthOfTextAtSize(t.verifyHint, vhSize);
  page.drawText(t.verifyHint, { x: qx + qpx / 2 - vhW / 2, y: qy - 16, size: vhSize, font: reg, color: INK_MUTE });

  return await doc.save();
}
