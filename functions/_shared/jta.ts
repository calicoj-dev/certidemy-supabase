// supabase/functions/_shared/jta.ts
//
// Renders a Job Task Analysis as a PDF (A4 portrait, multi-page).
//
// WHAT THIS DOCUMENT IS FOR
//
// The fact sheet says what the certification is. The blueprint sheet says how
// the examination is composed. This says what the credential actually claims a
// person can do — every task, at its declared level, with the knowledge and
// skills behind it. It is the document for the buyer who has read the blueprint
// and wants to see the thing it was derived from.
//
// It is long by nature, and that is the point. A syllabus fits on a page; a
// competence analysis does not.
//
// RELATIONSHIP TO gen-jta-doc.mjs. That script renders the same rows to
// markdown as an internal audit artifact. This is the client-facing cut, and it
// differs in three deliberate ways:
//
//   CONCEPT SLUGS ARE EXCLUDED. `cynefin-framework`, `servant-vs-true-leader`
//   and their kin are internal taxonomy identifiers. In a buyer's hands they
//   read as a database dump and expose internal structure that serves nobody
//   outside the building.
//
//   EVERY TASK APPEARS, IN SCOPE OR NOT. Listing only exam-scope tasks would
//   look tidier and would throw away the strongest thing here: a certification
//   body that declares more competence than it examines, and marks exactly
//   which is which, is making a claim most of this market cannot. It also
//   explains why the blueprint sheet's task count is smaller than this one's.
//
//   SOURCE MATERIAL IS ABSENT. The team's checklist asks for principal sources
//   and no column holds them — the JTA markdown headers carry them, outside the
//   database. Omitted rather than invented. This is a known gap, not an
//   oversight.
//
// BLOOM LABELS ARE IMPORTED, NOT REDECLARED. A second copy of the level names
// in this file is a drift waiting to happen, and drift between two hand-kept
// copies of the same table is the exact failure COGNITIVE-MODEL.md exists to
// record. blueprint.ts owns them.
//
// TASK ORDER is the caller's responsibility and must be numeric on the code
// segments — "3.10" sorts after "3.9", which a string comparison gets wrong.
//
// STILL DELIBERATELY OMITTED
//   NO PRICE. NO DELIVERY MODALITY. NO PASS RATES. NO ITEM CONTENT — not one
//   question, not one distractor, in any tier. A JTA describes what is measured
//   and never how.
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
import { bloomEntry, type AssetLocale } from "./blueprint.ts";

/**
 * Bump on ANY change to this file or to the font payload. It is part of the
 * storage path, so bumping it invalidates every cached JTA sheet.
 *
 * 1 - initial
 */
export const JTA_RENDERER_VERSION = "1";

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

export interface JtaTask {
  code: string;
  statement: string;
  /** Raw enum: high | medium | low. Null renders as a dash. */
  criticality: string | null;
  /** Raw enum: daily | weekly | occasional | per_sprint | per_exam. */
  frequency: string | null;
  /** Raw enum from tasks.bloom_level, e.g. "3_apply". */
  bloomLevel: string;
  isExamScope: boolean;
  isSimulationCandidate: boolean;
  knowledge: string | null;
  skills: string | null;
  abilities: string | null;
}

export interface JtaDomain {
  code: string;
  title: string;
  description: string;
  weightPct: number;
  /** Questions allocated to this domain, for cross-reading with the blueprint. */
  seats: number;
  /** Already ordered by numeric code segments. */
  tasks: JtaTask[];
}

export interface JtaData {
  code: string;
  name: string;
  status: string;
  numQuestions: number;
  domains: JtaDomain[];
  totalTasks: number;
  examScopeTasks: number;
  blueprintComputedAt: string | null;
  cognitiveModelVersion: string | null;
}

/* Enum -> display, per locale. An unmapped value THROWS rather than falling
   back: this document is an audit artifact and a silently wrong label is worse
   than a failed render someone will notice. Same rule gen-jta-doc.mjs applies. */
const CRITICALITY: Record<AssetLocale, Record<string, string>> = {
  "en": { high: "High", medium: "Medium", low: "Low" },
  "es-419": { high: "Alta", medium: "Media", low: "Baja" },
  "pt-BR": { high: "Alta", medium: "Média", low: "Baixa" },
};

const FREQUENCY: Record<AssetLocale, Record<string, string>> = {
  "en": {
    daily: "Daily",
    weekly: "Weekly",
    occasional: "Occasional",
    per_sprint: "Per sprint",
    per_exam: "Per exam",
  },
  "es-419": {
    daily: "Diaria",
    weekly: "Semanal",
    occasional: "Ocasional",
    per_sprint: "Por sprint",
    per_exam: "Por examen",
  },
  "pt-BR": {
    daily: "Diária",
    weekly: "Semanal",
    occasional: "Ocasional",
    per_sprint: "Por sprint",
    per_exam: "Por exame",
  },
};

function enumLabel(
  map: Record<AssetLocale, Record<string, string>>,
  value: string | null,
  locale: AssetLocale,
  what: string,
): string {
  if (!value) return "—";
  const out = map[locale][value];
  if (!out) {
    throw new Error(
      `unmapped ${what} "${value}" - add it to _shared/jta.ts`,
    );
  }
  return out;
}

/** Display-only. Leaves the DB value alone, same as the catalog navigator. */
function stripBrand(value: string): string {
  return value.replace(/^Certidemy\s+/i, "");
}

const STRINGS: Record<AssetLocale, Record<string, string>> = {
  "en": {
    eyebrow: "Job task analysis",
    intro:
      "The competence this certification claims, task by task. Everything the examination measures is derived from this document, and nothing it measures sits outside it.",
    comingSoon: "Coming soon - not yet open for examination",
    summary: "At a glance",
    domainsWord: "Domains",
    tasksDeclared: "Tasks declared",
    tasksExamined: "Tasks examined",
    questionsWord: "Examination questions",
    reading: "How to read this document",
    readingLead:
      "Each task states one thing a certified person can do. Four attributes qualify it, and together they decide whether and how it is examined.",
    r1: "Level - the kind of thinking the task demands. An examination question is written at the task's level, never above or below it.",
    r2: "Criticality - how much the consequence matters when the task is done badly.",
    r3: "Frequency - how often the task arises in real work.",
    r4: "Scope - whether the task is examined. Tasks above the multiple-choice ceiling are declared here and marked as not examined, because a multiple-choice question cannot honestly measure them. They are reserved for simulation and are not certified until simulations exist.",
    notExamined: "NOT EXAMINED",
    simulation: "RESERVED FOR SIMULATION",
    levelWord: "Level",
    criticalityWord: "Criticality",
    frequencyWord: "Frequency",
    knowledgeWord: "Knowledge",
    skillsWord: "Skills",
    abilitiesWord: "Abilities",
    weightWord: "weight",
    seatsWord: "questions",
    tasksWord: "tasks",
    generated: "Generated",
    currentVersion: "Current version",
    blueprintNote: "blueprint computed",
    page: "Page",
    of: "of",
  },
  "es-419": {
    eyebrow: "Análisis de tareas",
    intro:
      "La competencia que esta certificación afirma, tarea por tarea. Todo lo que el examen mide se deriva de este documento, y nada de lo que mide queda fuera de él.",
    comingSoon: "Próximamente - aún no abierta a examen",
    summary: "En resumen",
    domainsWord: "Dominios",
    tasksDeclared: "Tareas declaradas",
    tasksExamined: "Tareas evaluadas",
    questionsWord: "Preguntas del examen",
    reading: "Cómo leer este documento",
    readingLead:
      "Cada tarea enuncia algo que una persona certificada puede hacer. Cuatro atributos la califican y, en conjunto, deciden si se evalúa y cómo.",
    r1: "Nivel - el tipo de pensamiento que exige la tarea. Una pregunta del examen se escribe al nivel de la tarea, nunca por encima ni por debajo.",
    r2: "Criticidad - cuánto importa la consecuencia cuando la tarea se hace mal.",
    r3: "Frecuencia - con qué frecuencia surge la tarea en el trabajo real.",
    r4: "Alcance - si la tarea se evalúa. Las tareas por encima del techo de opción múltiple se declaran aquí y se marcan como no evaluadas, porque una pregunta de opción múltiple no puede medirlas con honestidad. Se reservan para simulación y no se certifican mientras las simulaciones no existan.",
    notExamined: "NO EVALUADA",
    simulation: "RESERVADA PARA SIMULACIÓN",
    levelWord: "Nivel",
    criticalityWord: "Criticidad",
    frequencyWord: "Frecuencia",
    knowledgeWord: "Conocimiento",
    skillsWord: "Habilidades",
    abilitiesWord: "Aptitudes",
    weightWord: "peso",
    seatsWord: "preguntas",
    tasksWord: "tareas",
    generated: "Generado",
    currentVersion: "Versión vigente",
    blueprintNote: "blueprint calculado",
    page: "Página",
    of: "de",
  },
  "pt-BR": {
    eyebrow: "Análise de tarefas",
    intro:
      "A competência que esta certificação afirma, tarefa por tarefa. Tudo o que o exame mede deriva deste documento, e nada do que ele mede está fora dele.",
    comingSoon: "Em breve - ainda não aberta para exame",
    summary: "Em resumo",
    domainsWord: "Domínios",
    tasksDeclared: "Tarefas declaradas",
    tasksExamined: "Tarefas avaliadas",
    questionsWord: "Questões do exame",
    reading: "Como ler este documento",
    readingLead:
      "Cada tarefa enuncia algo que uma pessoa certificada é capaz de fazer. Quatro atributos a qualificam e, juntos, decidem se e como ela é avaliada.",
    r1: "Nível - o tipo de pensamento que a tarefa exige. Uma questão do exame é escrita no nível da tarefa, nunca acima nem abaixo.",
    r2: "Criticidade - o quanto a consequência importa quando a tarefa é malfeita.",
    r3: "Frequência - com que frequência a tarefa aparece no trabalho real.",
    r4: "Escopo - se a tarefa é avaliada. Tarefas acima do teto da múltipla escolha são declaradas aqui e marcadas como não avaliadas, porque uma questão de múltipla escolha não consegue medi-las com honestidade. Ficam reservadas para simulação e não são certificadas enquanto as simulações não existirem.",
    notExamined: "NÃO AVALIADA",
    simulation: "RESERVADA PARA SIMULAÇÃO",
    levelWord: "Nível",
    criticalityWord: "Criticidade",
    frequencyWord: "Frequência",
    knowledgeWord: "Conhecimento",
    skillsWord: "Habilidades",
    abilitiesWord: "Atitudes",
    weightWord: "peso",
    seatsWord: "questões",
    tasksWord: "tarefas",
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

export async function renderJtaSheet(
  data: JtaData,
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

  /* Orphan control: a heading reserves enough of its own section that a reader
     turning the page always knows what they are looking at. */
  const heading = (t: string, reserve = 150) => {
    if (y - reserve < FOOT) newPage();
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
    need(lines.length * 14 + 8);
    page.drawCircle({ x: M + 3, y: y + 3.5, size: 1.7, color: ACCENT });
    for (const line of lines) {
      page.drawText(line, { x: M + 16, y, size: 10, font: regular, color: INK_SOFT });
      y -= 14;
    }
    y -= 7;
  };

  /* A domain opens a section of the document, so it gets a filled band rather
     than a rule — at fifteen pages a reader scrolling for D4 needs to find it
     without reading. */
  const domainHeader = (d: JtaDomain) => {
    const titleLines = wrap(`${d.code}  ${d.title}`, bold, 15, CW - 24);
    const descLines = d.description ? wrap(d.description, regular, 9, CW - 24) : [];
    const h = 16 + titleLines.length * 19 + descLines.length * 12 + 26;
    if (y - h < FOOT) newPage();

    page.drawRectangle({
      x: M - 10,
      y: y - h + 14,
      width: CW + 20,
      height: h,
      color: TRACK,
    });

    y -= 6;
    for (const line of titleLines) {
      page.drawText(line, { x: M, y, size: 15, font: bold, color: ACCENT_DEEP });
      y -= 19;
    }
    for (const line of descLines) {
      page.drawText(line, { x: M, y, size: 9, font: regular, color: INK_SOFT });
      y -= 12;
    }
    y -= 2;
    const meta =
      `${fmtNum(d.weightPct, locale)}% ${S.weightWord}  ·  ${d.seats} ${S.seatsWord}  ·  ${d.tasks.length} ${S.tasksWord}`;
    page.drawText(meta, { x: M, y, size: 8.5, font: mono, color: ACCENT_DEEP });
    y -= 26;
  };

  /* One task, measured whole before anything is drawn so a statement never
     separates from its attributes. */
  const taskBlock = (t: JtaTask) => {
    const stmtLines = wrap(`${t.code}   ${t.statement}`, semi, 10.5, CW - 10);
    const ksa: [string, string][] = [];
    if (t.knowledge) ksa.push([S.knowledgeWord, t.knowledge]);
    if (t.skills) ksa.push([S.skillsWord, t.skills]);
    if (t.abilities) ksa.push([S.abilitiesWord, t.abilities]);

    const ksaLines = ksa.map(([, v]) => wrap(v, regular, 9, CW - 86));
    const ksaHeight = ksaLines.reduce((n, ls) => n + ls.length * 12 + 2, 0);

    need(stmtLines.length * 14 + 16 + ksaHeight + 16);

    for (const line of stmtLines) {
      page.drawText(line, { x: M, y, size: 10.5, font: semi, color: INK });
      y -= 14;
    }

    const [word] = bloomEntry(t.bloomLevel, locale);
    const n = t.bloomLevel.split("_")[0];
    const attrs = [
      `${S.levelWord} ${n} · ${word}`,
      `${S.criticalityWord} ${enumLabel(CRITICALITY, t.criticality, locale, "criticality")}`,
      `${S.frequencyWord} ${enumLabel(FREQUENCY, t.frequency, locale, "frequency")}`,
    ].join("   ·   ");
    page.drawText(attrs, { x: M, y, size: 8, font: mono, color: INK_MUTE });
    y -= 12;

    // Only the exceptions are marked. Flagging every in-scope task would be
    // noise across two hundred rows; flagging the excluded ones is the point.
    if (!t.isExamScope) {
      const flag = t.isSimulationCandidate
        ? `${S.notExamined}  ·  ${S.simulation}`
        : S.notExamined;
      page.drawText(flag, { x: M, y, size: 8, font: mono, color: ACCENT });
      y -= 12;
    }

    y -= 2;
    ksa.forEach(([label, ], i) => {
      const lines = ksaLines[i];
      page.drawText(label, { x: M, y, size: 8, font: mono, color: ACCENT_DEEP });
      for (const line of lines) {
        page.drawText(line, { x: M + 78, y, size: 9, font: regular, color: INK_SOFT });
        y -= 12;
      }
      y -= 2;
    });

    y -= 12;
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

  for (const line of wrap(stripBrand(data.name), bold, 21, CW)) {
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

  // ---- at a glance --------------------------------------------------------
  //
  // "Tasks declared" and "tasks examined" sit next to each other on purpose.
  // The gap between them is the honest part, and a reader who has the blueprint
  // sheet in the other hand needs the two numbers reconciled here rather than
  // wondering which one is wrong.
  heading(S.summary, 120);
  row(S.domainsWord, String(data.domains.length));
  row(S.tasksDeclared, String(data.totalTasks));
  row(S.tasksExamined, String(data.examScopeTasks));
  row(S.questionsWord, String(data.numQuestions));
  y -= 8;

  // ---- how to read --------------------------------------------------------
  heading(S.reading, 180);
  body(S.readingLead, 10, INK);
  y -= 8;
  bullet(S.r1);
  bullet(S.r2);
  bullet(S.r3);
  bullet(S.r4);
  y -= 4;

  // ---- domains and tasks --------------------------------------------------
  for (const d of data.domains) {
    domainHeader(d);
    for (const t of d.tasks) taskBlock(t);
  }

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
