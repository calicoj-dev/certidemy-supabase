// supabase/functions/_shared/factsheet.ts
//
// Renders a certification fact sheet as a PDF (A4 portrait, multi-page).
//
// v2. v1 was a spec sheet: exam length, pass mark, attempts, validity. Correct
// for a procurement reader who has already decided to evaluate us, wrong for
// the first email, which is what this artifact is for. It answered none of the
// questions a reader actually has.
//
// WHAT v2 ADDS, all of it derived from rows we already own:
//   - the domains and their exam weights, as bars. The single most interesting
//     thing about a certification, and v1 omitted it entirely.
//   - preparation reality: modules, lessons, estimated study hours.
//   - how the certification is built. Four checkable statements. This is the
//     genuinely differentiating material and v1 had none of it.
//   - related certifications in the same category, so one sheet sells a family.
//
// WHAT IT DELIBERATELY STILL OMITS:
//
//   NO PRICE. CertiGlobal's, varies by bundle, and a printed price in a
//   twice-forwarded PDF reads as a commitment. Spec §3.4.
//
//   NO DELIVERY MODALITY. Proctoring, camera, AI policy are open decisions.
//   Printing "online, unproctored" would settle exam-operation policy by
//   accident, in a buyer's hands, ahead of the Candidate Handbook.
//
//   NO LABOUR-MARKET CLAIMS. No "leads to roles like", no salary data, no
//   "recognised by". Every line on this page is checkable against a row or a
//   public document, and that is the only reason the page is credible. One
//   unsupportable sentence and a sharp reader discounts all of it.
//
//   NO "WHO IT'S FOR". There is no audience column. Inventing one per
//   certification is authored marketing copy, not derived fact.
//
// Same machinery as certificate.ts: pure pdf-lib, app typefaces from
// _shared/fonts.ts. Bare esm.sh imports, no ?target=deno -- that sweep was
// attempted and reverted because it regresses these libraries.

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

const INK = rgb(0x1d / 255, 0x1d / 255, 0x1f / 255);
const INK_SOFT = rgb(0x42 / 255, 0x42 / 255, 0x47 / 255);
const INK_MUTE = rgb(0x86 / 255, 0x86 / 255, 0x8b / 255);
const ACCENT = rgb(0x00 / 255, 0x66 / 255, 0xcc / 255);
const ACCENT_DEEP = rgb(0x00 / 255, 0x4a / 255, 0x99 / 255);
const HAIRLINE = rgb(0xd2 / 255, 0xd2 / 255, 0xd7 / 255);
const TRACK = rgb(0.93, 0.95, 0.98);

const A4_W = 595.28;
const A4_H = 841.89;
const M = 52;
const CW = A4_W - M * 2;
const FOOT = 92;

export type AssetLocale = "en" | "es-419" | "pt-BR";

export interface FactSheetDomain {
  title: string;
  weightPct: number;
}

export interface FactSheetSibling {
  code: string;
  name: string;
}

export interface FactSheetData {
  code: string;
  name: string;
  claim: string;
  description: string;
  status: string;
  domains: FactSheetDomain[];
  numQuestions: number;
  passingScorePct: number;
  examDurationMinutes: number;
  maxExamAttempts: number;
  attemptWindowMonths: number;
  validityDays: number;
  moduleCount: number;
  lessonCount: number;
  studyMinutes: number;
  siblings: FactSheetSibling[];
  blueprintComputedAt: string | null;
  cognitiveModelVersion: string | null;
}

const STRINGS: Record<AssetLocale, Record<string, string>> = {
  "en": {
    eyebrow: "Fact sheet",
    comingSoon: "Coming soon - not yet open for examination",
    about: "About this certification",
    covers: "What it covers",
    coversNote: "Domain weight in the examination",
    exam: "Examination",
    questions: "Questions",
    duration: "Duration",
    minutes: "minutes",
    passMark: "Pass mark",
    attempts: "Attempts included",
    attemptWindow: "Attempt window",
    months: "months",
    languages: "Languages",
    langList: "English, Spanish (LATAM), Portuguese (Brazil)",
    prep: "Preparation",
    modules: "Modules",
    lessons: "Lessons",
    studyTime: "Estimated study time",
    hours: "hours",
    prepNote: "The full course is free to study on certidemy.com. Only the examination is purchased.",
    credential: "The credential",
    validity: "Valid for",
    days: "days from issuance",
    verification: "Every credential carries a unique code and a public verification page. Anyone can confirm it without contacting us.",
    built: "How this certification is built",
    built1: "Every examination question traces to a task in a published job task analysis.",
    built2: "The examination's cognitive profile is computed from that analysis, not asserted over it.",
    built3: "Designed to the ISO/IEC 17024 framework for bodies certifying persons.",
    built4: "The blueprint and sample questions are published, not held back.",
    related: "Related certifications",
    enroll: "Getting started",
    enrollBody: "Study free at certidemy.com. Examinations are purchased at certiglobal.org.",
    generated: "Generated",
    currentVersion: "Current version",
    blueprintNote: "blueprint computed",
    page: "Page",
    of: "of",
  },
  "es-419": {
    eyebrow: "Ficha técnica",
    comingSoon: "Próximamente - aún no abierta a examen",
    about: "Sobre esta certificación",
    covers: "Qué cubre",
    coversNote: "Peso del dominio en el examen",
    exam: "Examen",
    questions: "Preguntas",
    duration: "Duración",
    minutes: "minutos",
    passMark: "Puntaje de aprobación",
    attempts: "Intentos incluidos",
    attemptWindow: "Ventana de intentos",
    months: "meses",
    languages: "Idiomas",
    langList: "Inglés, español (LATAM), portugués (Brasil)",
    prep: "Preparación",
    modules: "Módulos",
    lessons: "Lecciones",
    studyTime: "Tiempo estimado de estudio",
    hours: "horas",
    prepNote: "El curso completo es gratuito en certidemy.com. Solo se adquiere el examen.",
    credential: "La credencial",
    validity: "Vigencia",
    days: "días desde la emisión",
    verification: "Cada credencial lleva un código único y una página pública de verificación. Cualquiera puede confirmarla sin contactarnos.",
    built: "Cómo está construida esta certificación",
    built1: "Cada pregunta del examen se remonta a una tarea de un análisis de tareas publicado.",
    built2: "El perfil cognitivo del examen se calcula a partir de ese análisis; no se declara sobre él.",
    built3: "Diseñada conforme al marco ISO/IEC 17024 para organismos que certifican personas.",
    built4: "El blueprint y las preguntas de muestra son públicos, no se reservan.",
    related: "Certificaciones relacionadas",
    enroll: "Cómo empezar",
    enrollBody: "Estudia gratis en certidemy.com. Los exámenes se adquieren en certiglobal.org.",
    generated: "Generado",
    currentVersion: "Versión vigente",
    blueprintNote: "blueprint calculado",
    page: "Página",
    of: "de",
  },
  "pt-BR": {
    eyebrow: "Ficha técnica",
    comingSoon: "Em breve - ainda não aberta para exame",
    about: "Sobre esta certificação",
    covers: "O que abrange",
    coversNote: "Peso do domínio no exame",
    exam: "Exame",
    questions: "Questões",
    duration: "Duração",
    minutes: "minutos",
    passMark: "Nota de aprovação",
    attempts: "Tentativas incluídas",
    attemptWindow: "Janela de tentativas",
    months: "meses",
    languages: "Idiomas",
    langList: "Inglês, espanhol (LATAM), português (Brasil)",
    prep: "Preparação",
    modules: "Módulos",
    lessons: "Aulas",
    studyTime: "Tempo estimado de estudo",
    hours: "horas",
    prepNote: "O curso completo é gratuito em certidemy.com. Apenas o exame é adquirido.",
    credential: "A credencial",
    validity: "Validade",
    days: "dias a partir da emissão",
    verification: "Cada credencial carrega um código único e uma página pública de verificação. Qualquer pessoa pode confirmá-la sem falar conosco.",
    built: "Como esta certificação é construída",
    built1: "Cada questão do exame remete a uma tarefa de uma análise de tarefas publicada.",
    built2: "O perfil cognitivo do exame é calculado a partir dessa análise; não é declarado sobre ela.",
    built3: "Projetada conforme a estrutura ISO/IEC 17024 para organismos que certificam pessoas.",
    built4: "O blueprint e as questões de amostra são públicos, não são retidos.",
    related: "Certificações relacionadas",
    enroll: "Como começar",
    enrollBody: "Estude grátis em certidemy.com. Os exames são adquiridos em certiglobal.org.",
    generated: "Gerado",
    currentVersion: "Versão vigente",
    blueprintNote: "blueprint calculado",
    page: "Página",
    of: "de",
  },
};

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= maxW) line = next;
    else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fmtDate(iso: string, locale: AssetLocale): string {
  const tag = locale === "en" ? "en-GB" : locale === "es-419" ? "es-419" : "pt-BR";
  return new Intl.DateTimeFormat(tag, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

function fmtHours(minutes: number, locale: AssetLocale): string {
  const h = minutes / 60;
  const tag = locale === "en" ? "en-GB" : locale === "es-419" ? "es-419" : "pt-BR";
  return new Intl.NumberFormat(tag, { maximumFractionDigits: 1 }).format(h);
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

  pdf.setTitle(`${data.code} - ${S.eyebrow}`);
  pdf.setProducer("Certidemy");
  pdf.setCreator("Certidemy");

  let page: PDFPage = pdf.addPage([A4_W, A4_H]);
  let y = A4_H - M;

  const newPage = () => {
    page = pdf.addPage([A4_W, A4_H]);
    y = A4_H - M;
  };
  const need = (h: number) => {
    if (y - h < FOOT) newPage();
  };

  const heading = (t: string) => {
    need(46);
    y -= 6;
    page.drawText(t.toUpperCase(), { x: M, y, size: 8, font: mono, color: ACCENT });
    y -= 8;
    page.drawLine({
      start: { x: M, y },
      end: { x: A4_W - M, y },
      thickness: 0.5,
      color: HAIRLINE,
    });
    y -= 18;
  };

  const body = (t: string, size = 10.5, color = INK_SOFT) => {
    for (const line of wrap(t, regular, size, CW)) {
      need(size + 6);
      page.drawText(line, { x: M, y, size, font: regular, color });
      y -= size + 4.5;
    }
  };

  const row = (label: string, value: string) => {
    need(26);
    page.drawText(label, { x: M, y, size: 10.5, font: regular, color: INK_SOFT });
    const w = semi.widthOfTextAtSize(value, 10.5);
    page.drawText(value, { x: A4_W - M - w, y, size: 10.5, font: semi, color: INK });
    y -= 8;
    page.drawLine({
      start: { x: M, y },
      end: { x: A4_W - M, y },
      thickness: 0.5,
      color: HAIRLINE,
    });
    y -= 14;
  };

  // Domain title + weight bar. The track is the full 100% scale, so a 12.5%
  // domain renders as one eighth. Scaling to the largest domain would make the
  // bars prettier and the document less truthful.
  const weightBar = (title: string, pct: number) => {
    const lines = wrap(title, semi, 10.5, CW - 52);
    need(lines.length * 15 + 20);
    for (const [i, line] of lines.entries()) {
      page.drawText(line, { x: M, y, size: 10.5, font: semi, color: INK });
      if (i === 0) {
        const label = `${pct}%`;
        const w = mono.widthOfTextAtSize(label, 9);
        page.drawText(label, {
          x: A4_W - M - w,
          y,
          size: 9,
          font: mono,
          color: ACCENT_DEEP,
        });
      }
      y -= 14;
    }
    y -= 1;
    page.drawRectangle({
      x: M,
      y,
      width: CW,
      height: 4,
      color: TRACK,
    });
    page.drawRectangle({
      x: M,
      y,
      width: Math.max(2, (CW * pct) / 100),
      height: 4,
      color: ACCENT,
    });
    y -= 16;
  };

  const bullet = (t: string) => {
    const lines = wrap(t, regular, 10, CW - 16);
    need(lines.length * 15 + 4);
    page.drawCircle({ x: M + 3, y: y + 3.5, size: 1.6, color: ACCENT });
    for (const [i, line] of lines.entries()) {
      page.drawText(line, {
        x: M + 16,
        y,
        size: 10,
        font: regular,
        color: INK_SOFT,
      });
      y -= 14.5;
      if (i < lines.length - 1) need(16);
    }
    y -= 3;
  };

  // ---- header -------------------------------------------------------------

  page.drawText(`${data.code} · ${S.eyebrow.toUpperCase()}`, {
    x: M,
    y,
    size: 8,
    font: mono,
    color: ACCENT,
  });
  y -= 28;

  for (const line of wrap(data.name, bold, 22, CW)) {
    page.drawText(line, { x: M, y, size: 22, font: bold, color: INK });
    y -= 27;
  }
  y -= 4;

  for (const line of wrap(data.claim, regular, 13, CW)) {
    page.drawText(line, { x: M, y, size: 13, font: regular, color: INK_SOFT });
    y -= 18;
  }

  if (data.status === "coming_soon") {
    y -= 6;
    page.drawText(S.comingSoon, { x: M, y, size: 9, font: semi, color: ACCENT });
    y -= 10;
  }

  y -= 14;

  // ---- what it covers -----------------------------------------------------
  //
  // First substantive section on purpose. This is what a reader wants and what
  // v1 left out.

  if (data.domains.length > 0) {
    heading(S.covers);
    page.drawText(S.coversNote, { x: M, y, size: 9, font: regular, color: INK_MUTE });
    y -= 20;
    for (const d of data.domains) weightBar(d.title, d.weightPct);
    y -= 6;
  }

  // ---- about --------------------------------------------------------------

  if (data.description) {
    heading(S.about);
    body(data.description);
    y -= 10;
  }

  // ---- examination --------------------------------------------------------

  heading(S.exam);
  row(S.questions, String(data.numQuestions));
  row(S.duration, `${data.examDurationMinutes} ${S.minutes}`);
  row(S.passMark, `${Number(data.passingScorePct)}%`);
  row(S.attempts, String(data.maxExamAttempts));
  row(S.attemptWindow, `${data.attemptWindowMonths} ${S.months}`);
  row(S.languages, S.langList);
  y -= 10;

  // ---- preparation --------------------------------------------------------

  heading(S.prep);
  row(S.modules, String(data.moduleCount));
  row(S.lessons, String(data.lessonCount));
  if (data.studyMinutes > 0) {
    row(S.studyTime, `${fmtHours(data.studyMinutes, locale)} ${S.hours}`);
  }
  y -= 4;
  body(S.prepNote, 10);
  y -= 10;

  // ---- credential ---------------------------------------------------------

  heading(S.credential);
  row(S.validity, `${data.validityDays} ${S.days}`);
  y -= 4;
  body(S.verification, 10);
  y -= 10;

  // ---- how it is built ----------------------------------------------------
  //
  // The differentiating section. Four statements, every one checkable against
  // a published document or a live page. Note what is NOT here: no
  // "accredited", no "recognised by", no equivalence to any third-party
  // programme. "Designed to the framework" is the honest formulation and it is
  // the one used in the scheme documents.

  heading(S.built);
  bullet(S.built1);
  bullet(S.built2);
  bullet(S.built3);
  bullet(S.built4);
  y -= 6;

  // ---- related ------------------------------------------------------------

  if (data.siblings.length > 0) {
    heading(S.related);
    for (const s of data.siblings) {
      need(18);
      page.drawText(s.code, { x: M, y, size: 9, font: mono, color: ACCENT_DEEP });
      page.drawText(s.name, {
        x: M + 74,
        y,
        size: 10.5,
        font: regular,
        color: INK_SOFT,
      });
      y -= 17;
    }
    y -= 8;
  }

  // ---- getting started ----------------------------------------------------

  heading(S.enroll);
  body(S.enrollBody, 10.5, INK);

  // ---- provenance footer, on every page -----------------------------------
  //
  // Non-negotiable per spec §4. A document with no generation date never
  // expires in the reader's mind, which is the failure this library exists to
  // prevent. There is no "clean copy for the client" variant.

  const pages = pdf.getPages();
  const stamp = `Certidemy · ${data.code} · ${S.eyebrow} · ${locale}`;
  const meta = [
    `${S.generated} ${fmtDate(new Date().toISOString(), locale)}`,
    data.blueprintComputedAt
      ? `${S.blueprintNote} ${data.blueprintComputedAt}`
      : null,
    data.cognitiveModelVersion
      ? `Cognitive Model v${data.cognitiveModelVersion}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const verifyUrl = `${siteBase}/${locale}/certifications/${data.code.toLowerCase()}`;

  pages.forEach((p, i) => {
    const fy = M + 30;
    p.drawLine({
      start: { x: M, y: fy + 22 },
      end: { x: A4_W - M, y: fy + 22 },
      thickness: 0.5,
      color: HAIRLINE,
    });
    p.drawText(stamp, { x: M, y: fy + 8, size: 7.5, font: mono, color: INK_MUTE });
    p.drawText(meta, { x: M, y: fy - 3, size: 7.5, font: mono, color: INK_MUTE });
    p.drawText(`${S.currentVersion}: ${verifyUrl}`, {
      x: M,
      y: fy - 14,
      size: 7.5,
      font: mono,
      color: ACCENT,
    });
    if (pages.length > 1) {
      const n = `${S.page} ${i + 1} ${S.of} ${pages.length}`;
      const w = mono.widthOfTextAtSize(n, 7.5);
      p.drawText(n, {
        x: A4_W - M - w,
        y: fy + 8,
        size: 7.5,
        font: mono,
        color: INK_MUTE,
      });
    }
  });

  return await pdf.save();
}
