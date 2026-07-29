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
// v2 CHANGES
//
//   1. ORPHAN CONTROL. v1 checked page space per ROW, so a section could open
//      30pt from the foot of a page and strand its first row there. AIGRM-I
//      shipped with page 2 beginning on three unlabelled bars — a reader
//      arriving there had no idea what the percentages measured. `heading()`
//      now reserves the heading plus enough of the section to be legible and
//      breaks first if it will not fit.
//
//   2. DOMAIN DESCRIPTIONS. v1 printed a weight and a question count per
//      domain and nothing about its content. "22.5%, 18 questions" tells a
//      buyer how much a domain counts, not what is in it. With descriptions
//      the section stops being a weights table and becomes a published
//      syllabus.
//
//   3. VERB LABELS ON EACH LEVEL. A reader who has never met Bloom's taxonomy
//      saw four words and four percentages. Each level now carries the verbs
//      that define it — three words, no extra section — and the taxonomy
//      explains itself in place.
//
//   4. COMPUTED CEILING. v1 hard-coded "4 (Analyze)". On a document whose
//      whole argument is that facts are derived rather than asserted, a
//      hand-typed number is the one that eventually lies. Read off the
//      profile now.
//
//   5. BRAND PREFIX STRIPPED for display. "Certidemy AI Governance & Risk
//      Management I" wrapped to two lines and said Certidemy twice, since the
//      footer already stamps it. DB values untouched — same rule the catalog
//      navigator uses.
//
//   6. DERIVATION SECTION REWRITTEN. v1 said a verification invariant "fails
//      the build", which is repository vocabulary in a client document, and
//      spent its bullets describing machinery instead of making the argument.
//
// THE ARGUMENT, AND WHY IT IS NOT "WE USE BLOOM"
//
// Everyone in this market uses Bloom or says they do. Arguing that Bloom is a
// good taxonomy buys parity, not advantage. The differentiator is Rule 5 of
// COGNITIVE-MODEL.md — the profile is a mathematical consequence of the domain
// weights and the declared task levels, so nobody gets to choose it — and the
// claim underneath it that almost no certification body will state publicly:
// an exam that under-tests is as invalid as one that over-tests. That is what
// this section argues. The taxonomy itself is explained in passing, in the row
// labels, because it is table stakes rather than the case.
//
// SHARED LINEAGE WITH gen-jta-doc.mjs. That script renders sections 1-3 of its
// output from exactly these rows. If the numbers here ever disagree with that
// script, one of them has drifted and the tasks table is the arbiter.
//
// SEAT ALLOCATION IS PORTED, NOT REIMPLEMENTED. `allocate()` in render-asset
// is a verbatim port of gen-jta-doc's, which itself matches
// generate-mock-exam's largest-remainder rounding.
//
// TASK COUNTS COME FROM LIVE ROWS, never from exam_blueprint.task_counts.
//
// STILL DELIBERATELY OMITTED
//   NO PRICE. NO DELIVERY MODALITY. NO PASS RATES. NO ITEM CONTENT.
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
 * 2 - orphan control, domain descriptions, verb labels, computed ceiling,
 *     brand prefix stripped, derivation section rewritten
 */
export const BLUEPRINT_RENDERER_VERSION = "2";

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
  /** Localized where a translation exists, English otherwise. May be empty. */
  description: string;
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

/* Level names and the verbs that define them. The verbs are the whole reason a
   reader who has never heard of Bloom can still read the profile: "2 ·
   Understand — explain, distinguish, classify" needs no glossary. Taken from
   Rule 1 of COGNITIVE-MODEL.md, which assigns a task's level from its own verb
   when the task is written.

   An unmapped level THROWS rather than falling back — the same discipline
   gen-jta-doc.mjs applies, for the same reason: a silent fallback renders a
   wrong label into a document a client keeps, instead of failing where someone
   will see it. */
const BLOOM: Record<AssetLocale, Record<string, [string, string]>> = {
  "en": {
    "1_remember": ["Remember", "define, list, identify"],
    "2_understand": ["Understand", "explain, distinguish, classify"],
    "3_apply": ["Apply", "apply, determine, act on"],
    "4_analyze": ["Analyze", "diagnose, compare, break down"],
    "5_evaluate": ["Evaluate", "judge, justify, critique"],
    "6_create": ["Create", "design, compose, construct"],
  },
  "es-419": {
    "1_remember": ["Recordar", "definir, enumerar, identificar"],
    "2_understand": ["Comprender", "explicar, distinguir, clasificar"],
    "3_apply": ["Aplicar", "aplicar, determinar, actuar sobre"],
    "4_analyze": ["Analizar", "diagnosticar, comparar, descomponer"],
    "5_evaluate": ["Evaluar", "juzgar, justificar, criticar"],
    "6_create": ["Crear", "diseñar, componer, construir"],
  },
  "pt-BR": {
    "1_remember": ["Lembrar", "definir, enumerar, identificar"],
    "2_understand": ["Compreender", "explicar, distinguir, classificar"],
    "3_apply": ["Aplicar", "aplicar, determinar, agir sobre"],
    "4_analyze": ["Analisar", "diagnosticar, comparar, decompor"],
    "5_evaluate": ["Avaliar", "julgar, justificar, criticar"],
    "6_create": ["Criar", "projetar, compor, construir"],
  },
};

export function bloomEntry(level: string, locale: AssetLocale): [string, string] {
  const e = BLOOM[locale][level];
  if (!e) {
    throw new Error(
      `unmapped bloom_level "${level}" - add it to BLOOM in _shared/blueprint.ts`,
    );
  }
  return e;
}

/** Display-only. Leaves the DB value alone, same as the catalog navigator. */
function stripBrand(value: string): string {
  return value.replace(/^Certidemy\s+/i, "");
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
    ceiling: "Cognitive ceiling",
    forMcq: "for multiple choice",
    languages: "Languages",
    langList: "English, Spanish (LATAM), Portuguese (Brazil)",
    weights: "Domains, weights and question allocation",
    weightsNote:
      "Questions are allocated across domains by weight, using the same largest-remainder rounding the live examination uses to draw a form.",
    seatsWord: "questions",
    tasksWord: "tasks",
    profile: "Cognitive profile",
    profileNote:
      "Task level weighted by domain weight, across exam-scope tasks. The level describes what kind of thinking a question demands - not how hard it is. An easy analysis question and a hard one are both analysis.",
    examScope: "Exam-scope tasks",
    derived: "How this blueprint is derived",
    derivedLead:
      "A certification claims a person can do specific things. Recording the cognitive level of each claim is how that promise is kept honest, and it is why this page exists.",
    d1: "Every task in the job task analysis declares one level, assigned from the task's own verb when it is written. That declaration is made once and lives in one place.",
    d2: "Each examination question is written at the level of the task it assesses - not above it, and not below it. A question pitched above the task fails a candidate on competence the credential never claimed. A question pitched below it certifies a claim that was never measured. Both are validity failures, and under-testing is not the safe direction.",
    d3: "The profile above is not a target. It is arithmetic: the domain weights, multiplied by the levels of the tasks inside each domain. Once the analysis is written the profile is already determined, and nobody - including us - gets to choose it.",
    d4: "Before a certification is published, an automated check recomputes the profile from the live tasks and compares it against the published one. If they differ, publication is blocked. That is what makes the numbers on this page checkable rather than asserted.",
    d5: "Multiple choice cannot honestly assess the two highest levels, evaluation and creation. Tasks at those levels are excluded from the examination and reserved for simulation, and until simulations exist they are not certified at all.",
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
    ceiling: "Techo cognitivo",
    forMcq: "para opción múltiple",
    languages: "Idiomas",
    langList: "Inglés, español (LATAM), portugués (Brasil)",
    weights: "Dominios, pesos y asignación de preguntas",
    weightsNote:
      "Las preguntas se asignan entre dominios según su peso, con el mismo redondeo de mayor residuo que usa el examen en vivo para armar una forma.",
    seatsWord: "preguntas",
    tasksWord: "tareas",
    profile: "Perfil cognitivo",
    profileNote:
      "Nivel de la tarea ponderado por el peso del dominio, sobre las tareas dentro del alcance del examen. El nivel describe qué tipo de pensamiento exige una pregunta, no qué tan difícil es. Una pregunta de análisis fácil y una difícil son ambas análisis.",
    examScope: "Tareas en alcance de examen",
    derived: "Cómo se deriva este blueprint",
    derivedLead:
      "Una certificación afirma que una persona puede hacer cosas específicas. Registrar el nivel cognitivo de cada afirmación es lo que mantiene honesta esa promesa, y es la razón de ser de esta página.",
    d1: "Cada tarea del análisis de tareas declara un nivel, asignado a partir del propio verbo de la tarea cuando se escribe. Esa declaración se hace una sola vez y vive en un solo lugar.",
    d2: "Cada pregunta del examen se escribe al nivel de la tarea que evalúa: ni por encima ni por debajo. Una pregunta por encima reprueba al candidato en una competencia que la credencial nunca afirmó. Una pregunta por debajo certifica una afirmación que nunca se midió. Ambas son fallas de validez, y evaluar de menos no es el lado seguro.",
    d3: "El perfil anterior no es una meta. Es aritmética: los pesos de los dominios multiplicados por los niveles de las tareas dentro de cada dominio. Una vez escrito el análisis, el perfil ya está determinado, y nadie - nosotros incluidos - puede elegirlo.",
    d4: "Antes de publicar una certificación, una verificación automática recalcula el perfil a partir de las tareas vigentes y lo compara con el publicado. Si difieren, la publicación se bloquea. Eso es lo que hace que las cifras de esta página sean comprobables y no simplemente declaradas.",
    d5: "La opción múltiple no puede evaluar con honestidad los dos niveles más altos, evaluar y crear. Las tareas en esos niveles quedan fuera del examen y se reservan para simulación, y mientras no existan las simulaciones no se certifican en absoluto.",
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
    ceiling: "Teto cognitivo",
    forMcq: "para múltipla escolha",
    languages: "Idiomas",
    langList: "Inglês, espanhol (LATAM), português (Brasil)",
    weights: "Domínios, pesos e alocação de questões",
    weightsNote:
      "As questões são alocadas entre os domínios pelo peso de cada um, com o mesmo arredondamento de maior resto que o exame ao vivo usa para montar uma forma.",
    seatsWord: "questões",
    tasksWord: "tarefas",
    profile: "Perfil cognitivo",
    profileNote:
      "Nível da tarefa ponderado pelo peso do domínio, sobre as tarefas no escopo do exame. O nível descreve que tipo de pensamento uma questão exige, não o quanto ela é difícil. Uma questão de análise fácil e uma difícil são ambas análise.",
    examScope: "Tarefas no escopo do exame",
    derived: "Como este blueprint é derivado",
    derivedLead:
      "Uma certificação afirma que uma pessoa é capaz de fazer coisas específicas. Registrar o nível cognitivo de cada afirmação é o que mantém essa promessa honesta, e é a razão de existir desta página.",
    d1: "Cada tarefa da análise de tarefas declara um nível, atribuído a partir do próprio verbo da tarefa quando ela é escrita. Essa declaração é feita uma única vez e vive em um único lugar.",
    d2: "Cada questão do exame é escrita no nível da tarefa que avalia: nem acima, nem abaixo. Uma questão acima reprova o candidato em uma competência que a credencial nunca afirmou. Uma questão abaixo certifica uma afirmação que nunca foi medida. Ambas são falhas de validade, e avaliar de menos não é o lado seguro.",
    d3: "O perfil acima não é uma meta. É aritmética: os pesos dos domínios multiplicados pelos níveis das tarefas dentro de cada domínio. Uma vez escrita a análise, o perfil já está determinado, e ninguém - nós inclusive - pode escolhê-lo.",
    d4: "Antes de uma certificação ser publicada, uma verificação automática recalcula o perfil a partir das tarefas vigentes e o compara com o publicado. Se divergirem, a publicação é bloqueada. É isso que torna os números desta página verificáveis, e não apenas declarados.",
    d5: "A múltipla escolha não consegue avaliar com honestidade os dois níveis mais altos, avaliar e criar. Tarefas nesses níveis ficam fora do exame e são reservadas para simulação, e enquanto as simulações não existirem elas não são certificadas.",
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

  /* ORPHAN CONTROL. `reserve` is the heading PLUS enough of the section's first
     rows that a reader who turns the page still knows what they are looking at.
     v1 reserved only the heading, so a section could open at the foot of a page
     and strand one row there — which is exactly how AIGRM-I page 2 came to
     start with three unlabelled bars. */
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

  const BARW = CW - 150;

  /* One block per domain: title, description, bar. The whole block is measured
     before anything is drawn, so a title never separates from its bar and a
     description never separates from its title. */
  const domainBlock = (d: BlueprintDomain) => {
    const titleLines = wrap(`${d.code}  ${d.title}`, semi, 10.5, CW);
    const descLines = d.description ? wrap(d.description, regular, 9, CW - 8) : [];
    need(titleLines.length * 14 + descLines.length * 12 + 38);

    for (const line of titleLines) {
      page.drawText(line, { x: M, y, size: 10.5, font: semi, color: INK });
      y -= 14;
    }
    for (const line of descLines) {
      page.drawText(line, { x: M, y, size: 9, font: regular, color: INK_MUTE });
      y -= 12;
    }
    y -= 4;

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
    y -= 30;
  };

  /* Bloom rows share the bar language so the two sections read as one system.
     The verb line is what lets someone who has never met the taxonomy read the
     profile without a glossary. */
  const bloomBlock = (b: BlueprintBloomRow) => {
    const [word, verbs] = bloomEntry(b.level, locale);
    const n = b.level.split("_")[0];
    const head = `${n} · ${word}`;
    need(46);

    page.drawText(head, { x: M, y, size: 10.5, font: semi, color: INK });
    const hw = semi.widthOfTextAtSize(head, 10.5);
    page.drawText(`— ${verbs}`, {
      x: M + hw + 8,
      y,
      size: 9,
      font: regular,
      color: INK_MUTE,
    });
    y -= 16;

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
    y -= 28;
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

  // ---- composition --------------------------------------------------------
  //
  // The ceiling is READ OFF THE PROFILE, not typed. Everything else on this
  // page is derived; a hand-typed ceiling is the line that would eventually
  // stop being true without anyone noticing.
  const levels = data.bloom.map((b) => b.level).sort();
  const topLevel = levels.length > 0 ? levels[levels.length - 1] : null;
  const ceilingValue = topLevel
    ? `${topLevel.split("_")[0]} (${bloomEntry(topLevel, locale)[0]}) ${S.forMcq}`
    : "—";

  heading(S.composition, 120);
  row(S.questions, String(data.numQuestions));
  row(S.duration, `${data.examDurationMinutes} ${S.minutes}`);
  row(S.passMark, `${fmtNum(Number(data.passingScorePct), locale)}%`);
  row(
    S.passRaw,
    `${Math.ceil((Number(data.passingScorePct) / 100) * data.numQuestions)} / ${data.numQuestions}`,
  );
  row(S.format, S.formatValue);
  row(S.ceiling, ceilingValue);
  row(S.languages, S.langList);
  row(S.examScope, String(data.examScopeTasks));
  y -= 8;

  // ---- domains ------------------------------------------------------------
  if (data.domains.length > 0) {
    heading(S.weights, 190);
    body(S.weightsNote, 9.5, INK_MUTE);
    y -= 6;
    for (const d of data.domains) domainBlock(d);
    y -= 2;
  }

  // ---- cognitive profile --------------------------------------------------
  if (data.bloom.length > 0) {
    heading(S.profile, 210);
    body(S.profileNote, 9.5, INK_MUTE);
    y -= 6;
    for (const b of data.bloom) bloomBlock(b);
    y -= 2;
  }

  // ---- derivation ---------------------------------------------------------
  //
  // The section that makes the rest of the document mean something. Without it
  // the profile is a set of percentages a reader has no reason to trust.
  heading(S.derived, 180);
  body(S.derivedLead, 10, INK);
  y -= 8;
  bullet(S.d1);
  bullet(S.d2);
  bullet(S.d3);
  bullet(S.d4);
  bullet(S.d5);

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
