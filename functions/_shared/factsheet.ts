// supabase/functions/_shared/factsheet.ts
//
// Renders a certification fact sheet as a PDF (A4 portrait, multi-page).
//
// v3 CHANGES
//
//   1. RENDERER VERSION. Exported and used in the storage path. v2 keyed the
//      cache on certifications.updated_at alone, so a change to the RENDERER
//      was invisible: after the font fix, an already-generated sheet kept
//      serving the old file with missing-glyph boxes in it. Bump this constant
//      whenever the layout or the font payload changes and every object
//      invalidates on the next request.
//
//   2. WEIGHT BAR GROUPING. v2 placed each bar equidistant between its own
//      title and the next one, and put the percentage on the title line. The
//      eye could not tell which bar belonged to which domain. The percentage
//      now sits at the end of its own bar, the gap above tightens and the gap
//      below opens, so each domain reads as one block.
//
//   3. HEADING HIERARCHY. v2 rendered every section heading identically, so
//      nothing told the reader where to look. Three anchors now carry weight
//      and a rule; supporting sections recede.
//
//   4. TIGHTER RHYTHM throughout.
//
// NOT DONE, AND WHY: this is not one page for a six-domain certification.
// Header, six weighted domains, the exam table, preparation, credential, the
// credibility block and related certs come to roughly 1350pt against 697pt of
// usable page. AIE-I and AIHR-I fit on one page; AISM-I and AIGRM-I do not,
// and would only fit if a whole section were dropped. Silently cutting one to
// hit a page count would be the wrong trade.
//
// STILL DELIBERATELY OMITTED
//   NO PRICE. CertiGlobal's, varies by bundle, and a printed price in a
//   twice-forwarded PDF reads as a commitment. Spec §3.4.
//   NO DELIVERY MODALITY. Proctoring, camera and AI policy are open decisions;
//   printing them would settle exam-operation policy by accident.
//   NO LABOUR-MARKET CLAIMS. No "leads to roles like", no salary, no
//   "recognised by". Every line here is checkable, and that is the only reason
//   the document is credible.
//   NO "WHO IT'S FOR". There is no audience column, and inventing one per
//   certification is authored copy, not derived fact.
//
// WORDMARK: insertion point marked below. pdf-lib embeds PNG and JPG, not SVG.

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

/**
 * Bump on ANY change to this file or to the font payload. It is part of the
 * storage path, so bumping it invalidates every cached fact sheet.
 *
 * 1 - initial
 * 2 - domains, preparation, credibility block, siblings
 * 3 - version in cache key, bar grouping, heading hierarchy
 */
export const FACTSHEET_RENDERER_VERSION = "4";
// 4 - brand magenta palette (both renderers were drawing in blue)

const INK = rgb(0x1d / 255, 0x1d / 255, 0x1f / 255);
const INK_SOFT = rgb(0x42 / 255, 0x42 / 255, 0x47 / 255);
const INK_MUTE = rgb(0x86 / 255, 0x86 / 255, 0x8b / 255);
const ACCENT = rgb(0xbe / 255, 0x18 / 255, 0x5d / 255);
const ACCENT_DEEP = rgb(0x9d / 255, 0x17 / 255, 0x4d / 255);
const HAIRLINE = rgb(0xd2 / 255, 0xd2 / 255, 0xd7 / 255);
const TRACK = rgb(0.98, 0.92, 0.95);

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

function fmtNum(n: number, locale: AssetLocale): string {
  const tag = locale === "en" ? "en-GB" : locale === "es-419" ? "es-419" : "pt-BR";
  return new Intl.NumberFormat(tag, { maximumFractionDigits: 1 }).format(n);
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

  // Three anchors carry weight: what it covers, the examination, how it is
  // built. Everything else supports them.
  const heading = (t: string) => {
    need(44);
    y -= 4;
    page.drawText(t.toUpperCase(), { x: M, y, size: 9, font: mono, color: ACCENT });
    y -= 9;
    page.drawLine({
      start: { x: M, y },
      end: { x: A4_W - M, y },
      thickness: 0.8,
      color: ACCENT,
    });
    y -= 17;
  };

  const subheading = (t: string) => {
    need(34);
    y -= 2;
    page.drawText(t.toUpperCase(), { x: M, y, size: 7.5, font: mono, color: INK_MUTE });
    y -= 7;
    page.drawLine({
      start: { x: M, y },
      end: { x: A4_W - M, y },
      thickness: 0.5,
      color: HAIRLINE,
    });
    y -= 14;
  };

  const body = (t: string, size = 10, color = INK_SOFT) => {
    for (const line of wrap(t, regular, size, CW)) {
      need(size + 5);
      page.drawText(line, { x: M, y, size, font: regular, color });
      y -= size + 3.8;
    }
  };

  const row = (label: string, value: string) => {
    need(23);
    page.drawText(label, { x: M, y, size: 10, font: regular, color: INK_SOFT });
    const w = semi.widthOfTextAtSize(value, 10);
    page.drawText(value, { x: A4_W - M - w, y, size: 10, font: semi, color: INK });
    y -= 7;
    page.drawLine({
      start: { x: M, y },
      end: { x: A4_W - M, y },
      thickness: 0.5,
      color: HAIRLINE,
    });
    y -= 13;
  };

  // The percentage rides at the end of its own bar, not up on the title line.
  // Gap above the bar is tight, gap below is roughly three times larger, so
  // proximity alone tells you which title each bar belongs to.
  const BARW = CW - 52;
  const weightBar = (title: string, pct: number) => {
    const lines = wrap(title, semi, 10.5, CW);
    need(lines.length * 14 + 32);
    for (const line of lines) {
      page.drawText(line, { x: M, y, size: 10.5, font: semi, color: INK });
      y -= 14;
    }
    page.drawRectangle({ x: M, y, width: BARW, height: 5, color: TRACK });
    page.drawRectangle({
      x: M,
      y,
      width: Math.max(2, (BARW * pct) / 100),
      height: 5,
      color: ACCENT,
    });
    const label = `${fmtNum(pct, locale)}%`;
    const w = mono.widthOfTextAtSize(label, 9);
    page.drawText(label, {
      x: A4_W - M - w,
      y: y - 0.5,
      size: 9,
      font: mono,
      color: ACCENT_DEEP,
    });
    y -= 28;
  };

  const bullet = (t: string) => {
    const lines = wrap(t, regular, 10, CW - 16);
    need(lines.length * 14 + 6);
    page.drawCircle({ x: M + 3, y: y + 3.5, size: 1.7, color: ACCENT });
    for (const line of lines) {
      page.drawText(line, { x: M + 16, y, size: 10, font: regular, color: INK_SOFT });
      y -= 14;
    }
    y -= 5;
  };

  // ---- header -------------------------------------------------------------
  //
  // WORDMARK GOES HERE. When the brand PNG lands:
  //   const png = await pdf.embedPng(b64ToBytes(WORDMARK_PNG_B64));
  //   const s = png.scale(110 / png.width);
  //   page.drawImage(png, { x: M, y: y - s.height + 8, width: s.width, height: s.height });
  //   y -= s.height + 18;
  // Everything below already flows from `y`, so nothing else needs touching.

  page.drawText(`${data.code} · ${S.eyebrow.toUpperCase()}`, {
    x: M,
    y,
    size: 8,
    font: mono,
    color: ACCENT,
  });
  y -= 27;

  for (const line of wrap(data.name, bold, 21, CW)) {
    page.drawText(line, { x: M, y, size: 21, font: bold, color: INK });
    y -= 26;
  }
  y -= 3;

  for (const line of wrap(data.claim, regular, 12.5, CW)) {
    page.drawText(line, { x: M, y, size: 12.5, font: regular, color: INK_SOFT });
    y -= 17;
  }

  if (data.status === "coming_soon") {
    y -= 5;
    page.drawText(S.comingSoon, { x: M, y, size: 9, font: semi, color: ACCENT });
    y -= 9;
  }

  y -= 12;

  // ---- what it covers (anchor) --------------------------------------------

  if (data.domains.length > 0) {
    heading(S.covers);
    page.drawText(S.coversNote, { x: M, y, size: 8.5, font: regular, color: INK_MUTE });
    y -= 18;
    for (const d of data.domains) weightBar(d.title, d.weightPct);
    y -= 2;
  }

  // ---- about (supporting) -------------------------------------------------

  if (data.description) {
    subheading(S.about);
    body(data.description, 9.5);
    y -= 8;
  }

  // ---- examination (anchor) -----------------------------------------------

  heading(S.exam);
  row(S.questions, String(data.numQuestions));
  row(S.duration, `${data.examDurationMinutes} ${S.minutes}`);
  row(S.passMark, `${fmtNum(Number(data.passingScorePct), locale)}%`);
  row(S.attempts, String(data.maxExamAttempts));
  row(S.attemptWindow, `${data.attemptWindowMonths} ${S.months}`);
  row(S.languages, S.langList);
  y -= 8;

  // ---- preparation (supporting) -------------------------------------------

  subheading(S.prep);
  row(S.modules, String(data.moduleCount));
  row(S.lessons, String(data.lessonCount));
  if (data.studyMinutes > 0) {
    row(S.studyTime, `${fmtNum(data.studyMinutes / 60, locale)} ${S.hours}`);
  }
  y -= 2;
  body(S.prepNote, 9.5);
  y -= 8;

  // ---- credential (supporting) --------------------------------------------

  subheading(S.credential);
  row(S.validity, `${data.validityDays} ${S.days}`);
  y -= 2;
  body(S.verification, 9.5);
  y -= 8;

  // ---- how it is built (anchor) -------------------------------------------
  //
  // The differentiating section. Four statements, each checkable against a
  // published document or a live page. Note what is absent: no "accredited",
  // no "recognised by", no equivalence to any third-party programme.
  // "Designed to the framework" is the honest formulation and the one the
  // scheme documents use.

  heading(S.built);
  bullet(S.built1);
  bullet(S.built2);
  bullet(S.built3);
  bullet(S.built4);
  y -= 4;

  // ---- related (supporting) -----------------------------------------------

  if (data.siblings.length > 0) {
    subheading(S.related);
    for (const s of data.siblings) {
      need(17);
      page.drawText(s.code, { x: M, y, size: 8.5, font: mono, color: ACCENT_DEEP });
      page.drawText(s.name, { x: M + 72, y, size: 10, font: regular, color: INK_SOFT });
      y -= 16;
    }
    y -= 8;
  }

  // ---- getting started (supporting) ---------------------------------------

  subheading(S.enroll);
  body(S.enrollBody, 10, INK);

  // ---- provenance footer, every page --------------------------------------
  //
  // Non-negotiable per spec §4. A document with no generation date never
  // expires in the reader's mind, which is the failure this library exists to
  // prevent. There is no "clean copy for the client" variant.

  const pages = pdf.getPages();
  const stamp = `Certidemy · ${data.code} · ${S.eyebrow} · ${locale}`;
  const meta = [
    `${S.generated} ${fmtDate(new Date().toISOString(), locale)}`,
    data.blueprintComputedAt ? `${S.blueprintNote} ${data.blueprintComputedAt}` : null,
    data.cognitiveModelVersion ? `Cognitive Model v${data.cognitiveModelVersion}` : null,
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
      p.drawText(n, { x: A4_W - M - w, y: fy + 8, size: 7.5, font: mono, color: INK_MUTE });
    }
  });

  return await pdf.save();
}
