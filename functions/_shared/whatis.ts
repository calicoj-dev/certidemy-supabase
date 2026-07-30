// supabase/functions/_shared/whatis.ts
//
// "What is Certidemy?" - a one-page introduction, in en / es-419 / pt-BR.
//
// ============================================================================
// THE FIRST PLATFORM-LEVEL ASSET
// ============================================================================
//
// Every other document in the library answers a question about ONE certification,
// for someone already engaged. This one answers "who are you and why do you
// exist" for a stranger, and it is not scoped to a certification at all.
//
// Its cache key covers the whole catalogue: add a certification and this document
// changes.
//
// ============================================================================
// v2 - WHAT CHANGED AND WHY
// ============================================================================
//
// THE CLOSING SECTION IS NOW AFFIRMATIVE. v1 was headed "what we do not claim"
// and spent its last paragraph explaining that we are not accredited. Accurate,
// and wrong for this document: a first-contact page that argues against itself
// before anyone has raised an objection is bad selling, and the sentence is not
// needed to stay honest - "built to the structure of ISO/IEC 17024" claims
// nothing about accreditation on its own.
//
// The full distinction still exists, in the engine brief, which is where a buyer
// who actually asks the question is sent. That is a deliberate split: the
// one-pager states the structure, the detailed document handles the nuance.
//
// "A VOUCHER BUYS THE EXAMINATION" became "what you pay for is an examination
// attempt". The first reads as though the exam itself is the product on sale;
// what a voucher actually confers is an attempt, and the credential follows only
// on passing. More accurate and it sets the right expectation.
//
// "DECLARACIONES DE COMPETENCIA DECLARADAS" was doubly redundant Spanish - an
// authoring error, not a layout one. Now "Declaraciones de competencia" across
// all three languages.
//
// SPACING. The catalogue numbers sat too close to their rule, and the page thinned
// out into grey-on-white at the bottom. The numbers now have air, the labels
// track their actual line count instead of reserving three lines, and the closing
// section sits in a soft panel so the page ends deliberately rather than fading.
//
// ============================================================================
// ONE PAGE MEANS ONE PAGE
// ============================================================================
//
// Written to a vertical budget, not to a length, and there is NO pagination logic
// on purpose. If content ever overflows, the fix is to cut words. A two-page
// one-pager is a different document that nobody asked for.
//
// ============================================================================
// CLAIMS
// ============================================================================
//
// NO COMPETITOR CLAIMS, not even soft ones - unevidenced and undated is Class D
// under CLAIMS-POLICY. Everything is stated as what WE do; the reader compares.
//
// NO PRICE. Pricing is CertiGlobal's and varies by bundle.
//
// THE NUMBERS ARE LIVE, counted from the catalogue at render time across
// client-safe certifications only. A brochure asserts; a document that counts its
// own catalogue is checkable.
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
import { type AssetLocale } from "./blueprint.ts";

/**
 * Bump on ANY change to this file or the font payload - it is part of the storage
 * path.
 *
 * 1 - initial
 * 2 - affirmative closing section, attempt wording, redundant Spanish label
 *     fixed, catalogue spacing
 * 3 - the credential box reads as success rather than as a second paid step
 */
export const WHATIS_RENDERER_VERSION = "3";

const INK = rgb(0x1d / 255, 0x1d / 255, 0x1f / 255);
const INK_SOFT = rgb(0x42 / 255, 0x42 / 255, 0x47 / 255);
const INK_MUTE = rgb(0x86 / 255, 0x86 / 255, 0x8b / 255);
const ACCENT = rgb(0xbe / 255, 0x18 / 255, 0x5d / 255);
const ACCENT_DEEP = rgb(0x9d / 255, 0x17 / 255, 0x4d / 255);
const ACCENT_SOFT = rgb(0xfd / 255, 0xf2 / 255, 0xf6 / 255);
const HAIRLINE = rgb(0xd2 / 255, 0xd2 / 255, 0xd7 / 255);

/**
 * Success family, for the one box in this document that represents an outcome
 * rather than a step. Far enough from the accent to read as a different signal
 * rather than a variant of it, and all three print cleanly.
 */
const SUCCESS = rgb(0x15 / 255, 0x80 / 255, 0x3d / 255);
const SUCCESS_MID = rgb(0x22 / 255, 0xc5 / 255, 0x5e / 255);
const SUCCESS_SOFT = rgb(0xf0 / 255, 0xfd / 255, 0xf4 / 255);

const A4_W = 595.28;
const A4_H = 841.89;
const M = 52;
const CW = A4_W - M * 2;

export interface WhatIsCertidemyData {
  certificationsAvailable: number;
  certificationsTotal: number;
  programs: number;
  domains: number;
  /** Declared competence statements across the whole catalogue. */
  tasks: number;
  languages: number;
}

interface Strings {
  eyebrow: string;
  title: string;
  lead: string;

  whyHeading: string;
  why1: string;
  why2: string;
  why3: string;

  doHeading: string;
  do1t: string;
  do1: string;
  do2t: string;
  do2: string;
  do3t: string;
  do3: string;
  do4t: string;
  do4: string;

  flowHeading: string;
  fLearn: string;
  fPractice: string;
  fExam: string;
  fCred: string;
  fFree: string;
  fAttempt: string;
  fPublic: string;

  catalogHeading: string;
  cCerts: string;
  cPrograms: string;
  cDomains: string;
  cTasks: string;
  cLanguages: string;
  cOf: string;

  isoHeading: string;
  iso: string;

  generated: string;
  more: string;
}

const STRINGS: Record<AssetLocale, Strings> = {
  "en": {
    eyebrow: "What is Certidemy?",
    title: "Certification for AI-era professional skills.",
    lead:
      "The learning is free and open. You pay only to sit the examination. And everything the examination measures is published before you take it.",

    whyHeading: "Why it exists",
    why1:
      "Professional certification is often priced as a barrier rather than a standard - and what you pay for is usually the course, not the assessment.",
    why2:
      "The capabilities employers now ask for - working with AI, governing it, staying accountable for decisions it influences - are recent enough that established programmes were not designed around them.",
    why3:
      "Most credentials cannot tell you what they measured. A certificate with no published scope is a claim with nothing behind it.",

    doHeading: "What we do",
    do1t: "Free to learn, paid to certify.",
    do1:
      "Every lesson, every practice question and the full examination blueprint are open. What you pay for is an examination attempt - and the credential, if you pass.",
    do2t: "Built from a job task analysis.",
    do2:
      "We declare what a certified person can do, task by task, before a single question is written - and every question traces to a declared task at that task's declared cognitive level.",
    do3t: "Published in advance.",
    do3:
      "Domain weights, question allocation, the cognitive profile, and the tasks we deliberately do not examine because a multiple-choice question cannot measure them honestly.",
    do4t: "Verifiable by anyone.",
    do4:
      "Every credential checks out on a public page, stamped with the version of the analysis it was assessed against - so it still means something years later.",

    flowHeading: "How it works",
    fLearn: "Learn",
    fPractice: "Practice",
    fExam: "Examination",
    fCred: "Credential",
    fFree: "free; no account needed to read the blueprint",
    fAttempt: "one attempt",
    fPublic: "publicly verifiable",

    catalogHeading: "The catalogue today",
    cCerts: "Certifications open",
    cPrograms: "Programmes",
    cDomains: "Domains",
    cTasks: "Competence statements",
    cLanguages: "Languages",
    cOf: "of",

    isoHeading: "Built on ISO/IEC 17024",
    iso:
      "ISO/IEC 17024 is the international framework for bodies that certify persons. Our schemes are built to its structure: competence defined and published before assessment, an examination derived from that definition, a published scope that matches what is actually measured, and a retained record of every attempt.",

    generated: "Generated",
    more: "Full blueprints and task analyses for every certification:",
  },

  "es-419": {
    eyebrow: "¿Qué es Certidemy?",
    title: "Certificación para competencias profesionales en la era de la IA.",
    lead:
      "Aprender es gratis y abierto. Solo pagas para presentar el examen. Y todo lo que el examen mide se publica antes de que lo tomes.",

    whyHeading: "Por qué existe",
    why1:
      "La certificación profesional suele estar precificada como una barrera y no como un estándar, y lo que pagas normalmente es el curso, no la evaluación.",
    why2:
      "Las capacidades que hoy piden los empleadores - trabajar con IA, gobernarla, responder por las decisiones que influye - son lo bastante recientes como para que los programas establecidos no se hayan diseñado alrededor de ellas.",
    why3:
      "La mayoría de las credenciales no pueden decirte qué midieron. Un certificado sin alcance publicado es una afirmación sin nada detrás.",

    doHeading: "Qué hacemos",
    do1t: "Gratis para aprender, pago para certificar.",
    do1:
      "Cada lección, cada pregunta de práctica y el blueprint completo del examen están abiertos. Lo que pagas es un intento de examen, y la credencial si lo apruebas.",
    do2t: "Construido desde un análisis de tareas.",
    do2:
      "Declaramos qué puede hacer una persona certificada, tarea por tarea, antes de escribir una sola pregunta, y cada pregunta se remonta a una tarea declarada en el nivel cognitivo declarado de esa tarea.",
    do3t: "Publicado por adelantado.",
    do3:
      "Pesos por dominio, asignación de preguntas, el perfil cognitivo, y las tareas que deliberadamente no evaluamos porque una pregunta de opción múltiple no puede medirlas con honestidad.",
    do4t: "Verificable por cualquiera.",
    do4:
      "Cada credencial se verifica en una página pública, sellada con la versión del análisis contra la que se evaluó, así que sigue significando algo años después.",

    flowHeading: "Cómo funciona",
    fLearn: "Aprender",
    fPractice: "Practicar",
    fExam: "Examen",
    fCred: "Credencial",
    fFree: "gratis; no necesitas cuenta para leer el blueprint",
    fAttempt: "un intento",
    fPublic: "verificable públicamente",

    catalogHeading: "El catálogo hoy",
    cCerts: "Certificaciones abiertas",
    cPrograms: "Programas",
    cDomains: "Dominios",
    cTasks: "Declaraciones de competencia",
    cLanguages: "Idiomas",
    cOf: "de",

    isoHeading: "Construido sobre ISO/IEC 17024",
    iso:
      "ISO/IEC 17024 es el marco internacional para organismos que certifican personas. Nuestros esquemas se construyen según su estructura: la competencia se define y se publica antes de la evaluación, el examen se deriva de esa definición, el alcance publicado coincide con lo que realmente se mide, y se conserva el registro de cada intento.",

    generated: "Generado",
    more: "Blueprints y análisis de tareas completos de cada certificación:",
  },

  "pt-BR": {
    eyebrow: "O que é a Certidemy?",
    title: "Certificação para competências profissionais na era da IA.",
    lead:
      "Aprender é gratuito e aberto. Você paga apenas para fazer o exame. E tudo o que o exame mede é publicado antes de você fazê-lo.",

    whyHeading: "Por que ela existe",
    why1:
      "A certificação profissional costuma ser precificada como uma barreira e não como um padrão, e o que você paga normalmente é o curso, não a avaliação.",
    why2:
      "As capacidades que os empregadores hoje pedem - trabalhar com IA, governá-la, responder pelas decisões que ela influencia - são recentes o bastante para que os programas estabelecidos não tenham sido desenhados em torno delas.",
    why3:
      "A maioria das credenciais não consegue dizer o que mediu. Um certificado sem escopo publicado é uma afirmação sem nada por trás.",

    doHeading: "O que fazemos",
    do1t: "Gratuito para aprender, pago para certificar.",
    do1:
      "Cada lição, cada questão de prática e o blueprint completo do exame estão abertos. O que você paga é uma tentativa de exame, e a credencial se for aprovado.",
    do2t: "Construído a partir de uma análise de tarefas.",
    do2:
      "Declaramos o que uma pessoa certificada é capaz de fazer, tarefa por tarefa, antes de escrever uma única questão, e cada questão remete a uma tarefa declarada no nível cognitivo declarado dessa tarefa.",
    do3t: "Publicado com antecedência.",
    do3:
      "Pesos por domínio, alocação de questões, o perfil cognitivo, e as tarefas que deliberadamente não avaliamos porque uma questão de múltipla escolha não consegue medi-las com honestidade.",
    do4t: "Verificável por qualquer pessoa.",
    do4:
      "Cada credencial é verificada em uma página pública, selada com a versão da análise contra a qual foi avaliada, então continua significando algo anos depois.",

    flowHeading: "Como funciona",
    fLearn: "Aprender",
    fPractice: "Praticar",
    fExam: "Exame",
    fCred: "Credencial",
    fFree: "gratuito; não é preciso conta para ler o blueprint",
    fAttempt: "uma tentativa",
    fPublic: "verificável publicamente",

    catalogHeading: "O catálogo hoje",
    cCerts: "Certificações abertas",
    cPrograms: "Programas",
    cDomains: "Domínios",
    cTasks: "Declarações de competência",
    cLanguages: "Idiomas",
    cOf: "de",

    isoHeading: "Construído sobre a ISO/IEC 17024",
    iso:
      "A ISO/IEC 17024 é a estrutura internacional para organismos que certificam pessoas. Nossos esquemas são construídos conforme sua estrutura: a competência é definida e publicada antes da avaliação, o exame é derivado dessa definição, o escopo publicado coincide com o que é realmente medido, e o registro de cada tentativa é preservado.",

    generated: "Gerado",
    more: "Blueprints e análises de tarefas completos de cada certificação:",
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

export async function renderWhatIsCertidemy(
  data: WhatIsCertidemyData,
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

  pdf.setTitle(S.eyebrow);
  pdf.setProducer("Certidemy");
  pdf.setCreator("Certidemy");

  // ONE page. Created once, never added to.
  const page: PDFPage = pdf.addPage([A4_W, A4_H]);
  let y = A4_H - M;

  const heading = (t: string, gapAfter = 12) => {
    y -= 4;
    page.drawText(t.toUpperCase(), { x: M, y, size: 7.5, font: mono, color: ACCENT });
    y -= 7;
    page.drawLine({
      start: { x: M, y },
      end: { x: A4_W - M, y },
      thickness: 0.7,
      color: ACCENT,
    });
    y -= gapAfter;
  };

  const bullet = (t: string, size = 8.8) => {
    const lines = wrap(t, regular, size, CW - 14);
    page.drawCircle({ x: M + 2.5, y: y + 3, size: 1.5, color: ACCENT });
    for (const line of lines) {
      page.drawText(line, { x: M + 14, y, size, font: regular, color: INK_SOFT });
      y -= size + 3;
    }
    y -= 4;
  };

  /** A bullet whose first phrase is emphasised, with the body continuing inline. */
  const titledBullet = (title: string, body: string, size = 8.8) => {
    page.drawCircle({ x: M + 2.5, y: y + 3, size: 1.5, color: ACCENT });
    const tw = semi.widthOfTextAtSize(title, size);
    page.drawText(title, { x: M + 14, y, size, font: semi, color: INK });

    const firstAvail = CW - 14 - tw - 4;
    const words = body.split(/\s+/);
    let first = "";
    let i = 0;
    while (i < words.length) {
      const next = first ? `${first} ${words[i]}` : words[i];
      if (regular.widthOfTextAtSize(next, size) > firstAvail) break;
      first = next;
      i += 1;
    }
    if (first) {
      page.drawText(first, {
        x: M + 14 + tw + 4,
        y,
        size,
        font: regular,
        color: INK_SOFT,
      });
    }
    y -= size + 3;

    const rest = words.slice(i).join(" ");
    if (rest) {
      for (const line of wrap(rest, regular, size, CW - 14)) {
        page.drawText(line, { x: M + 14, y, size, font: regular, color: INK_SOFT });
        y -= size + 3;
      }
    }
    y -= 4;
  };

  const centered = (
    t: string,
    cx: number,
    ty: number,
    size: number,
    font: PDFFont,
    color = INK,
  ) => {
    const w = font.widthOfTextAtSize(t, size);
    page.drawText(t, { x: cx - w / 2, y: ty, size, font, color });
  };

  // ---- header -------------------------------------------------------------
  //
  // WORDMARK GOES HERE, same block as factsheet.ts.
  page.drawText(S.eyebrow.toUpperCase(), {
    x: M,
    y,
    size: 8,
    font: mono,
    color: ACCENT,
  });
  y -= 26;

  for (const line of wrap(S.title, bold, 20, CW)) {
    page.drawText(line, { x: M, y, size: 20, font: bold, color: INK });
    y -= 24;
  }
  y -= 2;

  for (const line of wrap(S.lead, regular, 11, CW)) {
    page.drawText(line, { x: M, y, size: 11, font: regular, color: INK_SOFT });
    y -= 15;
  }
  y -= 8;

  // ---- why it exists ------------------------------------------------------
  heading(S.whyHeading);
  bullet(S.why1);
  bullet(S.why2);
  bullet(S.why3);
  y -= 2;

  // ---- what we do ---------------------------------------------------------
  heading(S.doHeading);
  titledBullet(S.do1t, S.do1);
  titledBullet(S.do2t, S.do2);
  titledBullet(S.do3t, S.do3);
  titledBullet(S.do4t, S.do4);
  y -= 2;

  // ---- how it works -------------------------------------------------------
  heading(S.flowHeading, 14);
  {
    const BW = 108;
    const BH = 26;
    const GAP = (CW - BW * 4) / 3;
    const top = y;
    const labels = [S.fLearn, S.fPractice, S.fExam, S.fCred];
    // Three states, so not a boolean: the first two are free and open, the
    // examination is the paid gate, and the credential is the OUTCOME - a
    // different kind of thing that should not share the gate's colour.
    const tones: ("plain" | "accent" | "success")[] = [
      "plain",
      "plain",
      "accent",
      "success",
    ];

    labels.forEach((label, i) => {
      const x = M + i * (BW + GAP);
      const tone = tones[i];
      page.drawRectangle({
        x,
        y: top - BH,
        width: BW,
        height: BH,
        color:
          tone === "success"
            ? SUCCESS_SOFT
            : tone === "accent"
              ? ACCENT_SOFT
              : undefined,
        borderColor:
          tone === "success"
            ? SUCCESS_MID
            : tone === "accent"
              ? ACCENT
              : HAIRLINE,
        borderWidth: tone === "plain" ? 0.7 : 1,
      });
      centered(
        label,
        x + BW / 2,
        top - BH / 2 - 3,
        8.5,
        semi,
        tone === "success" ? SUCCESS : tone === "accent" ? ACCENT_DEEP : INK,
      );
      if (i < 3) {
        const ax = x + BW + 3;
        const bx = x + BW + GAP - 3;
        const ay = top - BH / 2;
        page.drawLine({
          start: { x: ax, y: ay },
          end: { x: bx, y: ay },
          thickness: 0.8,
          color: ACCENT,
        });
        page.drawLine({
          start: { x: bx - 3, y: ay + 2.4 },
          end: { x: bx, y: ay },
          thickness: 0.8,
          color: ACCENT,
        });
        page.drawLine({
          start: { x: bx - 3, y: ay - 2.4 },
          end: { x: bx, y: ay },
          thickness: 0.8,
          color: ACCENT,
        });
      }
    });

    y = top - BH - 12;
    page.drawText(S.fFree, { x: M, y, size: 7, font: mono, color: INK_MUTE });
    page.drawText(S.fAttempt, {
      x: M + 2 * (BW + GAP),
      y,
      size: 7,
      font: mono,
      color: ACCENT_DEEP,
    });
    // Green too, so the outcome reads as one thing rather than a box and an
    // unrelated grey note.
    page.drawText(S.fPublic, {
      x: M + 3 * (BW + GAP),
      y,
      size: 7,
      font: mono,
      color: SUCCESS,
    });
    y -= 20;
  }

  // ---- the catalogue ------------------------------------------------------
  //
  // gapAfter is larger here: 15pt numerals sitting close under a rule looked
  // cramped, and this strip is the part a reader stops on.
  heading(S.catalogHeading, 22);
  {
    const cells: [string, string][] = [
      [
        // A single number when the whole catalogue is open: "7 of 7" reads as a
        // bug rather than as completeness.
        data.certificationsAvailable === data.certificationsTotal
          ? String(data.certificationsAvailable)
          : `${data.certificationsAvailable} ${S.cOf} ${data.certificationsTotal}`,
        S.cCerts,
      ],
      [String(data.programs), S.cPrograms],
      [String(data.domains), S.cDomains],
      [String(data.tasks), S.cTasks],
      [String(data.languages), S.cLanguages],
    ];
    const colW = CW / cells.length;
    const top = y;
    let deepest = 0;

    cells.forEach(([value, label], i) => {
      const cx = M + colW * i;
      page.drawText(value, { x: cx, y: top, size: 16, font: bold, color: ACCENT_DEEP });
      const lines = wrap(label, mono, 6.2, colW - 8);
      let ly = top - 13;
      for (const line of lines) {
        page.drawText(line, { x: cx, y: ly, size: 6.2, font: mono, color: INK_MUTE });
        ly -= 8;
      }
      // Track the real depth rather than reserving a fixed three lines.
      deepest = Math.max(deepest, top - ly);
    });

    y = top - deepest - 12;
  }

  // ---- built on 17024 -----------------------------------------------------
  //
  // A soft panel rather than plain grey text. v1 ended in small grey type on
  // white and the page thinned out; this makes the close feel deliberate.
  heading(S.isoHeading, 14);
  {
    const lines = wrap(S.iso, regular, 8.6, CW - 24);
    const h = lines.length * 11.6 + 20;
    page.drawRectangle({
      x: M,
      y: y - h + 13,
      width: CW,
      height: h,
      color: ACCENT_SOFT,
      borderColor: ACCENT,
      borderWidth: 0.7,
    });
    let ny = y;
    for (const line of lines) {
      page.drawText(line, { x: M + 12, y: ny, size: 8.6, font: regular, color: INK });
      ny -= 11.6;
    }
    y = y - h;
  }

  // ---- footer -------------------------------------------------------------
  const fy = M + 22;
  page.drawLine({
    start: { x: M, y: fy + 20 },
    end: { x: A4_W - M, y: fy + 20 },
    thickness: 0.5,
    color: HAIRLINE,
  });
  page.drawText(`Certidemy · ${S.eyebrow} · ${locale}`, {
    x: M,
    y: fy + 6,
    size: 7,
    font: mono,
    color: INK_MUTE,
  });
  page.drawText(`${S.generated} ${fmtDate(new Date().toISOString(), locale)}`, {
    x: M,
    y: fy - 4,
    size: 7,
    font: mono,
    color: INK_MUTE,
  });
  page.drawText(`${S.more} ${siteBase}/${locale}/certifications`, {
    x: M,
    y: fy - 14,
    size: 7,
    font: mono,
    color: ACCENT,
  });

  return await pdf.save();
}
