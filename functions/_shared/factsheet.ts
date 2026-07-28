// supabase/functions/_shared/factsheet.ts
//
// Renders a certification fact sheet as a PDF (A4 portrait).
//
// The first artifact of the sales library. A rep attaches this to a first
// email; a procurement reader opens it without visiting the site.
//
// Same machinery as certificate.ts: pure pdf-lib plus the app's own subset
// typefaces from _shared/fonts.ts. Bare esm.sh imports with no ?target=deno --
// that sweep was attempted and reverted because it regresses these libraries.
//
// EVERY VALUE ON THIS PAGE IS READ FROM A ROW. Nothing is authored here except
// the field labels. That is the whole premise of SALES-LIBRARY-SPEC §2: a
// hand-maintained sheet goes stale and a rep quotes a superseded pass mark to
// a buyer. If a fact cannot be derived, it does not go on the page.
//
// TWO DELIBERATE OMISSIONS:
//
//   1. NO PRICE. Pricing is CertiGlobal's, varies by bundle, and a printed
//      price in a twice-forwarded PDF reads as a commitment. Spec §3.4.
//
//   2. NO DELIVERY MODALITY. Whether the exam is proctored, whether a camera
//      is used, and what the AI/internet policy is are still open decisions.
//      Printing "online, unproctored" before that is settled would put a claim
//      about exam operation in a buyer's hands ahead of the policy. The row
//      goes in once the Candidate Handbook locks it.

import {
  PDFDocument,
  rgb,
  type PDFFont,
  type PDFPage,
} from "https://esm.sh/pdf-lib@1.17.1";
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1";
import {
  INTER_REGULAR_B64,
  INTER_SEMIBOLD_B64,
  INTER_BOLD_B64,
  JETBRAINS_MONO_B64,
  b64ToBytes,
} from "./fonts.ts";

// Palette lifted from certificate.ts so the two documents read as one family.
const INK = rgb(0x1d / 255, 0x1d / 255, 0x1f / 255);
const INK_SOFT = rgb(0x42 / 255, 0x42 / 255, 0x47 / 255);
const INK_MUTE = rgb(0x86 / 255, 0x86 / 255, 0x8b / 255);
const ACCENT = rgb(0x00 / 255, 0x66 / 255, 0xcc / 255);
const HAIRLINE = rgb(0xd2 / 255, 0xd2 / 255, 0xd7 / 255);

const A4_W = 595.28;
const A4_H = 841.89;
const M = 56;

export type AssetLocale = "en" | "es-419" | "pt-BR";

export interface FactSheetData {
  code: string;
  name: string;
  claim: string;
  description: string;
  num_questions: number;
  passing_score_pct: number;
  exam_duration_minutes: number;
  max_exam_attempts: number;
  attempt_window_months: number;
  validity_days: number;
  status: string;
  blueprint_computed_at: string | null;
  cognitive_model_version: string | null;
}

const STRINGS: Record<AssetLocale, {
  eyebrow: string;
  validates: string;
  exam: string;
  questions: string;
  duration: string;
  minutes: string;
  passMark: string;
  attempts: string;
  attemptWindow: string;
  months: string;
  languages: string;
  langList: string;
  credential: string;
  validity: string;
  days: string;
  verification: string;
  verificationBody: string;
  enroll: string;
  enrollBody: string;
  comingSoon: string;
  generated: string;
  currentVersion: string;
  blueprintNote: string;
}> = {
  "en": {
    eyebrow: "Fact sheet",
    validates: "What this validates",
    exam: "Examination",
    questions: "Questions",
    duration: "Duration",
    minutes: "minutes",
    passMark: "Pass mark",
    attempts: "Attempts",
    attemptWindow: "Attempt window",
    months: "months",
    languages: "Languages",
    langList: "English, Spanish (LATAM), Portuguese (Brazil)",
    credential: "Credential",
    validity: "Validity",
    days: "days from issuance",
    verification: "Verification",
    verificationBody: "Every credential carries a unique code and a public verification page.",
    enroll: "Enrolment",
    enrollBody: "Learning is free on certidemy.com. Examinations are purchased on certiglobal.org.",
    comingSoon: "Coming soon - not yet open for examination",
    generated: "Generated",
    currentVersion: "Current version",
    blueprintNote: "Exam blueprint computed",
  },
  "es-419": {
    eyebrow: "Ficha técnica",
    validates: "Qué valida",
    exam: "Examen",
    questions: "Preguntas",
    duration: "Duración",
    minutes: "minutos",
    passMark: "Puntaje de aprobación",
    attempts: "Intentos",
    attemptWindow: "Ventana de intentos",
    months: "meses",
    languages: "Idiomas",
    langList: "Inglés, español (LATAM), portugués (Brasil)",
    credential: "Credencial",
    validity: "Vigencia",
    days: "días desde la emisión",
    verification: "Verificación",
    verificationBody: "Cada credencial lleva un código único y una página pública de verificación.",
    enroll: "Inscripción",
    enrollBody: "El aprendizaje es gratuito en certidemy.com. Los exámenes se adquieren en certiglobal.org.",
    comingSoon: "Próximamente - aún no abierta a examen",
    generated: "Generado",
    currentVersion: "Versión vigente",
    blueprintNote: "Blueprint del examen calculado",
  },
  "pt-BR": {
    eyebrow: "Ficha técnica",
    validates: "O que valida",
    exam: "Exame",
    questions: "Questões",
    duration: "Duração",
    minutes: "minutos",
    passMark: "Nota de aprovação",
    attempts: "Tentativas",
    attemptWindow: "Janela de tentativas",
    months: "meses",
    languages: "Idiomas",
    langList: "Inglês, espanhol (LATAM), português (Brasil)",
    credential: "Credencial",
    validity: "Validade",
    days: "dias a partir da emissão",
    verification: "Verificação",
    verificationBody: "Cada credencial carrega um código único e uma página pública de verificação.",
    enroll: "Inscrição",
    enrollBody: "O aprendizado é gratuito em certidemy.com. Os exames são adquiridos em certiglobal.org.",
    comingSoon: "Em breve - ainda não aberta para exame",
    generated: "Gerado",
    currentVersion: "Versão vigente",
    blueprintNote: "Blueprint do exame calculado",
  },
};

/** pdf-lib does not wrap. Split on measured width, never on character count. */
function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= maxW) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fmtDate(iso: string, locale: AssetLocale): string {
  const d = new Date(iso);
  const tag = locale === "en" ? "en-GB" : locale === "es-419" ? "es-419" : "pt-BR";
  return new Intl.DateTimeFormat(tag, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export async function renderFactSheet(
  data: FactSheetData,
  locale: AssetLocale,
  siteBase: string,
): Promise<Uint8Array> {
  const S = STRINGS[locale];

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const regular = await pdf.embedFont(b64ToBytes(INTER_REGULAR_B64), { subset: true });
  const semi = await pdf.embedFont(b64ToBytes(INTER_SEMIBOLD_B64), { subset: true });
  const bold = await pdf.embedFont(b64ToBytes(INTER_BOLD_B64), { subset: true });
  const mono = await pdf.embedFont(b64ToBytes(JETBRAINS_MONO_B64), { subset: true });

  const page: PDFPage = pdf.addPage([A4_W, A4_H]);
  const CW = A4_W - M * 2;
  let y = A4_H - M;

  pdf.setTitle(`${data.code} - ${S.eyebrow}`);
  pdf.setProducer("Certidemy");
  pdf.setCreator("Certidemy");

  // ---- header -------------------------------------------------------------

  page.drawText(`${data.code} · ${S.eyebrow.toUpperCase()}`, {
    x: M, y, size: 8, font: mono, color: ACCENT,
  });
  y -= 26;

  for (const line of wrap(data.name, bold, 21, CW)) {
    page.drawText(line, { x: M, y, size: 21, font: bold, color: INK });
    y -= 26;
  }
  y -= 2;

  for (const line of wrap(data.claim, regular, 12, CW)) {
    page.drawText(line, { x: M, y, size: 12, font: regular, color: INK_SOFT });
    y -= 17;
  }

  if (data.status === "coming_soon") {
    y -= 8;
    page.drawText(S.comingSoon, { x: M, y, size: 9, font: semi, color: ACCENT });
    y -= 6;
  }

  y -= 16;
  page.drawLine({
    start: { x: M, y }, end: { x: A4_W - M, y },
    thickness: 0.5, color: HAIRLINE,
  });
  y -= 30;

  // ---- helpers ------------------------------------------------------------

  const heading = (t: string) => {
    page.drawText(t.toUpperCase(), { x: M, y, size: 8, font: mono, color: INK_MUTE });
    y -= 18;
  };

  const body = (t: string, size = 11) => {
    for (const line of wrap(t, regular, size, CW)) {
      page.drawText(line, { x: M, y, size, font: regular, color: INK_SOFT });
      y -= size + 5;
    }
  };

  // Two-column rows. Label left, value right-aligned, hairline beneath.
  const row = (label: string, value: string) => {
    page.drawText(label, { x: M, y, size: 11, font: regular, color: INK_SOFT });
    const w = semi.widthOfTextAtSize(value, 11);
    page.drawText(value, { x: A4_W - M - w, y, size: 11, font: semi, color: INK });
    y -= 9;
    page.drawLine({
      start: { x: M, y }, end: { x: A4_W - M, y },
      thickness: 0.5, color: HAIRLINE,
    });
    y -= 15;
  };

  // ---- what this validates ------------------------------------------------

  heading(S.validates);
  body(data.description);
  y -= 20;

  // ---- examination --------------------------------------------------------

  heading(S.exam);
  row(S.questions, String(data.num_questions));
  row(S.duration, `${data.exam_duration_minutes} ${S.minutes}`);
  row(S.passMark, `${Number(data.passing_score_pct)}%`);
  row(S.attempts, String(data.max_exam_attempts));
  row(S.attemptWindow, `${data.attempt_window_months} ${S.months}`);
  row(S.languages, S.langList);
  y -= 14;

  // ---- credential ---------------------------------------------------------

  heading(S.credential);
  row(S.validity, `${data.validity_days} ${S.days}`);
  y -= 2;
  body(S.verificationBody, 10);
  y -= 20;

  // ---- enrolment ----------------------------------------------------------

  heading(S.enroll);
  body(S.enrollBody, 10);

  // ---- provenance footer --------------------------------------------------
  //
  // Non-negotiable per spec §4. A document without a generation date never
  // expires in the reader's mind, which is the failure this whole library is
  // built to avoid. There is no "clean copy for the client" variant.

  const fy = M + 34;
  page.drawLine({
    start: { x: M, y: fy + 22 }, end: { x: A4_W - M, y: fy + 22 },
    thickness: 0.5, color: HAIRLINE,
  });

  const stamp = `Certidemy · ${data.code} · ${S.eyebrow} · ${locale}`;
  page.drawText(stamp, { x: M, y: fy + 8, size: 7.5, font: mono, color: INK_MUTE });

  const bits = [`${S.generated} ${fmtDate(new Date().toISOString(), locale)}`];
  if (data.blueprint_computed_at) {
    bits.push(`${S.blueprintNote} ${data.blueprint_computed_at}`);
  }
  if (data.cognitive_model_version) {
    bits.push(`Cognitive Model v${data.cognitive_model_version}`);
  }
  page.drawText(bits.join(" · "), {
    x: M, y: fy - 3, size: 7.5, font: mono, color: INK_MUTE,
  });

  const verifyUrl = `${siteBase}/${locale}/certifications/${data.code.toLowerCase()}`;
  page.drawText(`${S.currentVersion}: ${verifyUrl}`, {
    x: M, y: fy - 14, size: 7.5, font: mono, color: ACCENT,
  });

  return await pdf.save();
}
