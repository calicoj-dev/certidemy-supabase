// supabase/functions/_shared/blueprint.ts
//
// Renders an exam blueprint sheet as a PDF (A4 portrait, multi-page).
//
// WHAT THIS DOCUMENT IS FOR
//
// The fact sheet answers "what is this certification". This answers "is the
// examination well constructed", which is the question a procurement reader
// and a sceptical buyer actually ask. Almost nobody in this market publishes
// it, which is exactly why it is the strongest asset in the library.
//
// It carries four things and nothing else: the examination's composition, how
// questions are allocated across domains, the cognitive profile, and the
// derivation chain that makes the profile checkable rather than asserted.
//
// SHARED LINEAGE WITH gen-jta-doc.mjs. That script renders sections 1-3 of its
// output from exactly these rows. This is the same computation with a PDF
// layout instead of a markdown one, and the JTA sheet is the same fetch plus
// per-task detail. If the numbers here ever disagree with that script, one of
// them has drifted and the tasks table is the arbiter.
//
// SEAT ALLOCATION IS PORTED, NOT REIMPLEMENTED. `allocate()` in render-asset
// is a verbatim port of gen-jta-doc's, which itself matches
// generate-mock-exam's largest-remainder rounding. A subtly different
// implementation here would publish per-domain question counts that the live
// examination does not use, which is a worse failure than publishing nothing.
//
// TASK COUNTS COME FROM LIVE ROWS, never from exam_blueprint.task_counts.
// Invariant 17 fails the build when the stored blueprint diverges from the
// computed profile, but a document should not depend on a check having been
// run before it was generated. This is the failure mode gen-jta-doc.mjs was
// written to end; see its header for the SPO-AI-I case.
//
// STILL DELIBERATELY OMITTED
//   NO PRICE. Same rule as the fact sheet.
//   NO DELIVERY MODALITY. Proctoring, camera and AI policy are open decisions;
//   printing them would settle exam-operation policy by accident.
//   NO PASS RATES. Publishing approval statistics is on the forbidden list
//   until there is a defensible sample, and there is not one.
//   NO ITEM CONTENT. Not one question, not one distractor, in any tier.
//
// WORDMARK: insertion point marked below, matching factsheet.ts.

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
 * storage path, so bumping it invalidates every cached blueprint sheet.
 *
 * 1 - initial
 */
export const BLUEPRINT_RENDERER_VERSION = "1";

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

export interface BlueprintDomain {
  code: string;
  title: string;
  weightPct: number;
  /** Questions allocated to this domain by largest-remainder rounding. */
  seats: number;
  /** Exam-scope tasks in this domain, counted from live rows. */
  taskCount: number;
}

export interface BlueprintBloomRow {
  /** The raw enum from tasks.bloom_level, e.g. "3_apply". Localized here. */
  level: string;
  tasks: number;
  pctOfForm: number;
}

export interface BlueprintData {
  code: string;
  name: string;
  status: string;
  numQuestions: number;
  passingScorePct: number;
  examDurationMinutes: number;
  domains: BlueprintDomain[];
  bloom: BlueprintBloomRow[];
  /** Exam-scope tasks across all domains, counted from live rows. */
  examScopeTasks: number;
  blueprintComputedAt: string | null;
  cognitiveModelVersion: string | null;
}

/* Bloom labels per locale. Explicit, and an unmapped level THROWS rather than
   falling back — the same discipline gen-jta-doc.mjs applies, for the same
   reason: a silent fallback renders a wrong label into an audit artifact
   instead of failing loudly where someone will see it. */
const BLOOM: Record<AssetLocale, Record<string, string>> = {
  "en": {
    "1_remember": "Remember",
    "2_understand": "Understand",
    "3_apply": "Apply",
    "4_analyze": "Analyze",
    "5_evaluate": "Evaluate",
    "6_create": "Create",
  },
  "es-419": {
    "1_remember": "Recordar",
    "2_understand": "Comprender",
    "3_apply": "Aplicar",
    "4_analyze": "Analizar",
    "5_evaluate": "Evaluar",
    "6_create": "Crear",
  },
  "pt-BR": {
    "1_remember": "Lembrar",
    "2_understand": "Compreender",
    "3_apply": "Aplicar",
    "4_analyze": "Analisar",
    "5_evaluate": "Avaliar",
    "6_create": "Criar",
  },
};

function bloomLabel(level: string, locale: AssetLocale): string {
  const n = level.split("_")[0];
  const word = BLOOM[locale][level];
  if (!word) {
    throw new Error(
      `unmapped bloom_level "${level}" - add it to BLOOM in _shared/blueprint.ts`,
    );
  }
  return `${n} · ${word}`;
}

const STRINGS: Record<AssetLocale, Record<string, string>> = {
  "en": {
    eyebrow: "Exam blueprint",
    intro:
      "The composition of the examination, and the cognitive profile computed from the job task analysis that defines it.",
    comingSoon: "Coming soon - not yet open for examination",
    composition: "Examination composition",
    questions: "Questions",
    duration: "Duration",
    minutes: "minutes",
    passMark: "Pass mark",
    passRaw: "Pass mark (raw score)",
    format: "Format",
    formatValue: "Multiple choice, single answer, online",
    ceiling: "Bloom ceiling",
    ceilingValue: "4 (Analyze) for multiple choice",
    languages: "Languages",
    langList: "English, Spanish (LATAM), Portuguese (Brazil)",
    weights: "Domain weights and question allocation",
    weightsNote:
      "Questions are allocated across domains by weight, using the same largest-remainder rounding the live examination uses to draw a form.",
    seatsWord: "questions",
    tasksWord: "tasks",
    profile: "Cognitive profile",
    profileNote:
      "Task Bloom level weighted by domain weight, across exam-scope tasks.",
    examScope: "Exam-scope tasks",
    derived: "How this blueprint is derived",
    d1: "Every task in the job task analysis carries a criticality, a frequency and a Bloom level, reviewed before any content is written.",
    d2: "The cognitive profile above is computed from those tasks. It is a consequence of the analysis, not a target asserted over it.",
    d3: "A verification invariant fails the build if the stored blueprint and the freshly computed profile diverge, so the two cannot drift apart unnoticed.",
    d4: "Multiple-choice items are capped at Bloom 4. Levels 5 and 6 describe competence that a multiple-choice question cannot honestly measure, and are reserved for simulation.",
    generated: "Generated",
    currentVersion: "Current version",
    blueprintNote: "blueprint computed",
    page: "Page",
    of: "of",
  },
  "es-419": {
    eyebrow: "Blueprint del examen",
    intro:
      "La composición del examen y el perfil cognitivo calculado a partir del análisis de tareas que lo define.",
    comingSoon: "Próximamente - aún no abierta a examen",
    composition: "Composición del examen",
    questions: "Preguntas",
    duration: "Duración",
    minutes: "minutos",
    passMark: "Puntaje de aprobación",
    passRaw: "Aprobación (puntaje bruto)",
    format: "Formato",
    formatValue: "Opción múltiple, respuesta única, en línea",
    ceiling: "Techo Bloom",
    ceilingValue: "4 (Analizar) para opción múltiple",
    languages: "Idiomas",
    langList: "Inglés, español (LATAM), portugués (Brasil)",
    weights: "Pesos por dominio y asignación de preguntas",
    weightsNote:
      "Las preguntas se asignan entre dominios según su peso, con el mismo redondeo de mayor residuo que usa el examen en vivo para armar una forma.",
    seatsWord: "preguntas",
    tasksWord: "tareas",
    profile: "Perfil cognitivo",
    profileNote:
      "Nivel Bloom de la tarea ponderado por el peso del dominio, sobre las tareas dentro del alcance del examen.",
    examScope: "Tareas en alcance de examen",
    derived: "Cómo se deriva este blueprint",
    d1: "Cada tarea del análisis de tareas lleva una criticidad, una frecuencia y un nivel Bloom, revisados antes de escribir cualquier contenido.",
    d2: "El perfil cognitivo anterior se calcula a partir de esas tareas. Es una consecuencia del análisis, no una meta declarada sobre él.",
    d3: "Un invariante de verificación falla la compilación si el blueprint almacenado y el perfil recién calculado divergen, de modo que no pueden separarse sin que nadie lo note.",
    d4: "Los ítems de opción múltiple se limitan a Bloom 4. Los niveles 5 y 6 describen competencias que una pregunta de opción múltiple no puede medir con honestidad, y se reservan para simulación.",
    generated: "Generado",
    currentVersion: "Versión vigente",
    blueprintNote: "blueprint calculado",
    page: "Página",
    of: "de",
  },
  "pt-BR": {
    eyebrow: "Blueprint do exame",
    intro:
      "A composição do exame e o perfil cognitivo calculado a partir da análise de tarefas que o define.",
    comingSoon: "Em breve - ainda não aberta para exame",
    composition: "Composição do exame",
    questions: "Questões",
    duration: "Duração",
    minutes: "minutos",
    passMark: "Nota de aprovação",
    passRaw: "Aprovação (pontuação bruta)",
    format: "Formato",
    formatValue: "Múltipla escolha, resposta única, on-line",
    ceiling: "Teto Bloom",
    ceilingValue: "4 (Analisar) para múltipla escolha",
    languages: "Idiomas",
    langList: "Inglês, espanhol (LATAM), português (Brasil)",
    weights: "Pesos por domínio e alocação de questões",
    weightsNote:
      "As questões são alocadas entre os domínios pelo peso de cada um, com o mesmo arredondamento de maior resto que o exame ao vivo usa para montar uma forma.",
    seatsWord: "questões",
    tasksWord: "tarefas",
    profile: "Perfil cognitivo",
    profileNote:
      "Nível Bloom da tarefa ponderado pelo peso do domínio, sobre as tarefas no escopo do exame.",
    examScope: "Tarefas no escopo do exame",
    derived: "Como este blueprint é derivado",
    d1: "Cada tarefa da análise de tarefas carrega uma criticidade, uma frequência e um nível Bloom, revisados antes de qualquer conteúdo ser escrito.",
    d2: "O perfil cognitivo acima é calculado a partir dessas tarefas. É uma consequência da análise, não uma meta declarada sobre ela.",
    d3: "Um invariante de verificação falha a compilação se o blueprint armazenado e o perfil recém-calculado divergirem, de modo que os dois não podem se afastar sem que ninguém perceba.",
    d4: "Itens de múltipla escolha são limitados ao Bloom 4. Os níveis 5 e 6 descrevem competências que uma questão de múltipla escolha não consegue medir com honestidade, e são reservados para simulação.",
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

export async function renderBlueprintSheet(
  data: BlueprintData,
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

  /* One block per domain: title, then a bar whose trailing label carries the
     two numbers a reader needs together — the weight and the questions it buys.
     Same grouping rule as the fact sheet's weight bars: tight gap above the
     bar, wide gap below, so proximity alone says which title owns which bar. */
  const BARW = CW - 150;
  const domainBar = (d: BlueprintDomain) => {
    const title = `${d.code}  ${d.title}`;
    const lines = wrap(title, semi, 10.5, CW);
    need(lines.length * 14 + 34);
    for (const line of lines) {
      page.drawText(line, { x: M, y, size: 10.5, font: semi, color: INK });
      y -= 14;
    }
    page.drawRectangle({ x: M, y, width: BARW, height: 5, color: TRACK });
    page.drawRectangle({
      x: M,
      y,
      width: Math.max(2, (BARW * d.weightPct) / 100),
      height: 5,
      color: ACCENT,
    });
    const label = `${fmtNum(d.weightPct, locale)}%  ·  ${d.seats} ${S.seatsWord}  ·  ${d.taskCount} ${S.tasksWord}`;
    const w = mono.widthOfTextAtSize(label, 8.5);
    page.drawText(label, {
      x: A4_W - M - w,
      y: y - 0.5,
      size: 8.5,
      font: mono,
      color: ACCENT_DEEP,
    });
    y -= 28;
  };

  /* Bloom rows share the bar language so the two sections read as one system,
     but the scale is % of form rather than domain weight. */
  const bloomBar = (b: BlueprintBloomRow) => {
    need(32);
    page.drawText(bloomLabel(b.level, locale), {
      x: M,
      y,
      size: 10.5,
      font: semi,
      color: INK,
    });
    y -= 14;
    page.drawRectangle({ x: M, y, width: BARW, height: 5, color: TRACK });
    page.drawRectangle({
      x: M,
      y,
      width: Math.max(2, (BARW * b.pctOfForm) / 100),
      height: 5,
      color: ACCENT,
    });
    const label = `${fmtNum(b.pctOfForm, locale)}%  ·  ${b.tasks} ${S.tasksWord}`;
    const w = mono.widthOfTextAtSize(label, 8.5);
    page.drawText(label, {
      x: A4_W - M - w,
      y: y - 0.5,
      size: 8.5,
      font: mono,
      color: ACCENT_DEEP,
    });
    y -= 26;
  };

  // ---- header -------------------------------------------------------------
  //
  // WORDMARK GOES HERE. When the brand PNG lands, use the same block as
  // factsheet.ts — everything below already flows from `y`.
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

  for (const line of wrap(S.intro, regular, 12.5, CW)) {
    page.drawText(line, { x: M, y, size: 12.5, font: regular, color: INK_SOFT });
    y -= 17;
  }

  if (data.status === "coming_soon") {
    y -= 5;
    page.drawText(S.comingSoon, { x: M, y, size: 9, font: semi, color: ACCENT });
    y -= 9;
  }
  y -= 12;

  // ---- composition --------------------------------------------------------
  heading(S.composition);
  row(S.questions, String(data.numQuestions));
  row(S.duration, `${data.examDurationMinutes} ${S.minutes}`);
  row(S.passMark, `${fmtNum(Number(data.passingScorePct), locale)}%`);
  row(
    S.passRaw,
    `${Math.ceil((Number(data.passingScorePct) / 100) * data.numQuestions)} / ${data.numQuestions}`,
  );
  row(S.format, S.formatValue);
  row(S.ceiling, S.ceilingValue);
  row(S.languages, S.langList);
  row(S.examScope, String(data.examScopeTasks));
  y -= 8;

  // ---- weights ------------------------------------------------------------
  if (data.domains.length > 0) {
    heading(S.weights);
    body(S.weightsNote, 9.5, INK_MUTE);
    y -= 6;
    for (const d of data.domains) domainBar(d);
    y -= 2;
  }

  // ---- cognitive profile --------------------------------------------------
  if (data.bloom.length > 0) {
    heading(S.profile);
    body(S.profileNote, 9.5, INK_MUTE);
    y -= 6;
    for (const b of data.bloom) bloomBar(b);
    y -= 2;
  }

  // ---- derivation ---------------------------------------------------------
  //
  // The section that makes the rest of the document mean something. Without
  // it the profile is just four numbers a reader has no reason to trust.
  heading(S.derived);
  bullet(S.d1);
  bullet(S.d2);
  bullet(S.d3);
  bullet(S.d4);

  // ---- provenance footer, every page --------------------------------------
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
