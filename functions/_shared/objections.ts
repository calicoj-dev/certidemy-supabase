// supabase/functions/_shared/objections.ts
//
// "Objections, and what to say" - internal enablement, in en / es-419 / pt-BR.
//
// ============================================================================
// THIS DOCUMENT IS INTERNAL, AND THAT IS NOT A FORMALITY
// ============================================================================
//
// Every other asset in the library is written to be read by a buyer. This one is
// written to be read by a rep, and it contains a list of things we are careful
// NOT to claim - set out in quotation marks, one per objection, under the label
// "Don't say". A prospect reading that list draws precisely the wrong conclusion
// from it: a catalogue of our own disclaimers reads as a catalogue of our
// weaknesses, when it is actually a discipline.
//
// So three mechanisms, none of them decorative:
//
// 1. A BAND ON EVERY PAGE, not just the first. A band on page one does not
//    survive a cropped screenshot of page three.
//
// 2. A DIAGONAL WATERMARK ON EVERY PAGE carrying the address the copy was
//    generated for. The library modal has always told the rep this document is
//    watermarked; until this renderer existed that sentence was false, because
//    comparison_sheet was never built. An inaccurate warning teaches people to
//    skim warnings.
//
// 3. AN OBJECTION BLOCK NEVER SPLITS ACROSS A PAGE. If a break landed between
//    "Don't say" and "Say this", the last thing on that page would be a
//    forbidden claim in quotation marks with its correction overleaf - the exact
//    artifact the tier exists to prevent, manufactured by the layout engine.
//    Blocks are measured whole and moved down intact. This is why there is a
//    measure pass and why it must stay in step with the draw pass.
//
// THE WATERMARK MUST BE IN THE CONTENT HASH. A per-recipient document served
// from a cache keyed without the recipient hands rep B a file stamped with rep
// A's address. It looks correct, it is signed to the wrong person, and nothing
// logs the mismatch. See the objections branch in render-asset.
//
// ============================================================================
// CONTENT
// ============================================================================
//
// The English is the reviewed copy from /console/objections, transcribed rather
// than re-authored. If the page and this file disagree, the page is the source
// and this file is stale - there is no third version anywhere.
//
// Two deliberate deviations, both typographic rather than editorial:
//
//   - Em dashes are normalised to a spaced hyphen, matching whatis.ts,
//     factsheet.ts and enginebrief.ts. The console page is JSX and uses em
//     dashes; the renderers do not.
//   - The "what they say" line carries typographic quotes drawn by the renderer,
//     so the strings themselves hold no quotation marks.
//
// TERMINOLOGY follows the established renderers, which is why it was read before
// this file was written rather than invented alongside it:
//
//   blueprint          -> blueprint          (NOT translated, either language)
//   job task analysis  -> analisis de tareas / analise de tarefas
//   competence stmt    -> declaracion de competencia / declaracao de competencia
//   pass mark          -> puntaje de aprobacion / nota de aprovacao
//   score              -> puntaje (es) / nota (pt)          <- these differ
//   proctored          -> supervisado / supervisionado
//   secure pool        -> banco seguro
//   exam form          -> forma
//   accreditation      -> acreditacion / acreditacao        (never "certified")
//
// (Accents omitted in this comment block only, so the glossary greps cleanly.)
//
// NO NUMBERS, mirroring the console page. Pass marks, question counts, task
// counts and prices live in the generated per-certification documents, from live
// records. A number typed here drifts and then a rep quotes it.
//
// NO COMPETITOR CLAIMS. Objection 8 is specifically about refusing to make them,
// so making one here would be self-refuting.

import {
  PDFDocument,
  degrees,
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
 * Bump on ANY change to this file or the font payload - it is part of the
 * storage path.
 *
 * 1 - initial
 */
export const OBJECTIONS_RENDERER_VERSION = "1";

const INK = rgb(0x1d / 255, 0x1d / 255, 0x1f / 255);
const INK_SOFT = rgb(0x42 / 255, 0x42 / 255, 0x47 / 255);
const INK_MUTE = rgb(0x86 / 255, 0x86 / 255, 0x8b / 255);
const ACCENT = rgb(0xbe / 255, 0x18 / 255, 0x5d / 255);
const ACCENT_DEEP = rgb(0x9d / 255, 0x17 / 255, 0x4d / 255);
const ACCENT_SOFT = rgb(0xfd / 255, 0xf2 / 255, 0xf6 / 255);
const HAIRLINE = rgb(0xd2 / 255, 0xd2 / 255, 0xd7 / 255);

/**
 * Two signals that must not read as variants of the accent, because the whole
 * document is a two-column moral argument: this is wrong, that is right.
 */
const DANGER = rgb(0xb4 / 255, 0x1c / 255, 0x1c / 255);
const DANGER_SOFT = rgb(0xfe / 255, 0xf2 / 255, 0xf2 / 255);
const SUCCESS = rgb(0x15 / 255, 0x80 / 255, 0x3d / 255);

const A4_W = 595.28;
const A4_H = 841.89;
const M = 52;
const CW = A4_W - M * 2;
const FOOT = 74;
const BAND_H = 22;

export interface ObjectionsData {
  /**
   * The address this copy was generated for. Printed in the footer and set into
   * the diagonal watermark on every page.
   *
   * MUST be part of the cache key in render-asset. A per-recipient document
   * cached without it is served to the wrong person with the right appearance.
   */
  recipientEmail: string;
}

interface Objection {
  says: string;
  dont: string;
  say: string;
  why: string;
}

interface ObjGroup {
  title: string;
  items: Objection[];
}

interface Strings {
  bandText: string;
  eyebrow: string;
  title: string;
  lead: string;
  internalNote: string;
  intro: string;
  labelDont: string;
  labelSay: string;
  groups: ObjGroup[];
  rulesHeading: string;
  rules: string[];
  sourcesLabel: string;
  sources: string;
  generated: string;
  generatedFor: string;
  page: string;
  of: string;
}

const STRINGS: Record<AssetLocale, Strings> = {
  "en": {
    bandText: "INTERNAL - DO NOT FORWARD",
    eyebrow: "Objections, and what to say",
    title: "What a buyer actually says, and the answer that holds.",
    lead:
      "What a buyer actually says, what not to say back, and the answer that holds. The \u201Cdon\u2019t say\u201D line is the important one - an unprepared rep does not go quiet, they improvise, and improvised answers to hard questions are where claims we cannot support get made.",
    internalNote:
      "For Certidemy sales, marketing and support only. This document records what we are careful NOT to claim, and a prospect or client reading it draws precisely the wrong conclusion from it. Each copy is watermarked with the address it was generated for.",
    intro:
      "Every objection here follows from something true about our position. Nothing speculative. When you hear one that is not in this document, that is the signal to add it - a document full of answers to questions nobody asks is a document people stop reading.",
    labelDont: "Don\u2019t say:",
    labelSay: "Say this:",
    groups: [
      {
        title: "Credibility",
        items: [
          {
            says: "Are you accredited?",
            dont: "Yes, we\u2019re ISO 17024 certified. / We\u2019re ISO compliant.",
            say:
              "No. We\u2019re designed to the ISO/IEC 17024 framework, which is the standard for bodies that certify people - but accreditation is a formal third-party assessment by an accreditation body, and we haven\u2019t been through one. Claiming otherwise would be false. What I can show you is the whole thing the framework asks for: the job task analysis, the exam blueprint derived from it, and how the examination is conducted.",
            why:
              "A buyer who asks this knows the difference. Saying it first turns your weakest point into the most credible sentence in the conversation. Every generated document already states it, so a rep who fudges it will be contradicted by their own attachment.",
          },
          {
            says: "I\u2019ve never heard of Certidemy.",
            dont: "We\u2019re growing fast. / We\u2019re well known in LATAM.",
            say:
              "That\u2019s fair - we\u2019re new. What we offer instead of name recognition is that everything is inspectable: the full task analysis, the exam blueprint with weights and cognitive levels, and a document explaining exactly how the examination works. Most established programmes won\u2019t hand you that. Judge us on what you can read rather than on who else has heard of us.",
            why:
              "Never argue about brand awareness you don\u2019t have. Redirect to the thing that is genuinely unusual and verifiable.",
          },
          {
            says: "Who else is using this? Any case studies?",
            dont: "We have several enterprise clients. / We can\u2019t disclose names.",
            say:
              "We\u2019re pre-launch, so no - I\u2019m not going to invent a customer list. What I can do is give you the actual scheme documents and let you evaluate the substance, and talk about being part of the first cohort, which comes with direct access to us.",
            why:
              "A fabricated or vague client list is the single fastest way to lose a procurement reader, and it is trivially checkable.",
          },
        ],
      },
      {
        title: "Exam integrity",
        items: [
          {
            says: "Is it proctored? How do you know they didn\u2019t cheat?",
            dont: "It\u2019s fully secure. / Our AI detects cheating.",
            say:
              "It isn\u2019t proctored at this level - no camera, no identity check. The credential\u2019s meaning doesn\u2019t rest on surveillance: a published pass mark, a published blueprint, and items drawn mechanically from a protected pool that the study side of the platform cannot reach. On top of that, the server records the exact form it issued and grades against that record rather than anything the browser reports, and every item carries its own timing - so an attempt whose pattern doesn\u2019t look like reasoning gets reviewed by a person under a documented process.",
            why:
              "\u201CFully secure\u201D invites one question that ends the conversation. The honest answer is longer and much stronger, and it\u2019s all in the How the exam works document you can send afterwards.",
          },
          {
            says: "So your analytics catch cheaters.",
            dont: "Yes, we detect cheating automatically.",
            say:
              "They flag an attempt for human review. What happens after a flag is a process, not an automatic revocation - the candidate is contacted and has an opportunity to respond before anyone decides anything.",
            why:
              "A buyer asking this is usually testing whether we\u2019ve thought about due process. And an automated decision with legal effect carries real obligations, so overclaiming here is not just sloppy, it\u2019s exposure.",
          },
          {
            says: "What if my employee\u2019s laptop dies mid-exam? Do they lose the attempt?",
            dont: "They\u2019d need to contact support. / We\u2019d sort it out case by case.",
            say:
              "No. Answers are written to the server as they\u2019re given, not held in the browser, so they come back to the same form in the same order with their answers in place. The clock keeps running while they\u2019re away - interruption is allowed, extra time isn\u2019t. And if they never come back, the attempt is scored from what was saved rather than sitting open forever.",
            why:
              "This one lands hard with corporate buyers in LATAM specifically, because connectivity is uneven and they have all been burned by a platform that voided a paid attempt.",
          },
        ],
      },
      {
        title: "Value and comparison",
        items: [
          {
            says: "Why would I pay for this when there are free courses everywhere?",
            dont: "Our content is higher quality.",
            say:
              "The learning is free here too - every lesson, every practice question, the full blueprint. You only pay when someone is ready to sit the examination. What you\u2019re buying isn\u2019t the course, it\u2019s the assessment and the credential: a verifiable claim that this person demonstrated something specific, against a scope you can read in advance.",
            why:
              "Competing on content quality is unwinnable and unverifiable. The actual product is the assessment, and the free-to-learn model is a genuine differentiator that costs nothing to state.",
          },
          {
            says: "How is this different from [an established programme]?",
            dont: "They only test memorisation. / Their blueprint is hidden. / They ignore AI.",
            say:
              "I won\u2019t characterise their programme - I\u2019d rather show you ours. We publish the full task analysis, every domain weight, every cognitive level, and which tasks we deliberately do not examine because a multiple-choice question can\u2019t measure them honestly. Compare that against whatever you\u2019re weighing us up against and judge for yourself.",
            why:
              "Anything about a competitor\u2019s practice needs a source and a date, or it\u2019s a claim we can\u2019t support - and if it\u2019s wrong, one sentence from them undoes the whole conversation. \u201CHere\u2019s ours, compare it\u201D is stronger anyway and costs nothing.",
          },
          {
            says: "Is this just a ChatGPT wrapper? An AI course generator?",
            dont: "No, everything is human-written.",
            say:
              "The examination is built from a job task analysis that was authored and reviewed before any content existed, and every question traces to a declared task at that task\u2019s declared cognitive level - enforced when the item is created, not audited afterwards. The subject matter is AI, and AI is used in building and translating material, with human review. The structure is what makes it a certification rather than a generated quiz, and you can inspect that structure.",
            why:
              "Answer the real worry, which is rigour, not tooling. Denying AI involvement in an AI certification company reads as evasive and is also not true.",
          },
        ],
      },
      {
        title: "Commercial and practical",
        items: [
          {
            says: "Why does the credential only last a year?",
            dont: "Industry standard. / For quality control.",
            say:
              "Because the subject moves. A credential in AI governance or AI-era Scrum that stayed valid for five years would be claiming something about a body of practice that has changed underneath it. Recertification keeps the claim honest - and it\u2019s stated up front rather than buried.",
            why:
              "A short validity looks like a revenue mechanism unless you give the actual reason. The reason is good; use it.",
          },
          {
            says: "Can we get volume pricing?",
            dont: "Quote a number.",
            say:
              "Vouchers are sold through CertiGlobal, which handles group packages and volume pricing - I\u2019ll connect you. Nothing on our side carries a price, deliberately, so I\u2019m not going to quote you something that turns out to be wrong.",
            why:
              "Pricing genuinely isn\u2019t ours. Every generated document omits it on purpose, so quoting a figure contradicts the paperwork.",
          },
          {
            says: "Only three languages?",
            dont: "More are coming soon.",
            say:
              "English, Latin American Spanish and Brazilian Portuguese - and they\u2019re one examination, not three that resemble each other: translated items share their answer key, so a score means the same thing whichever language it was taken in. That\u2019s harder than adding languages, and it\u2019s why we haven\u2019t added more.",
            why:
              "\u201CComing soon\u201D is a commitment nobody has made. The parity point is the actual engineering achievement here.",
          },
          {
            says: "Is our people\u2019s data safe? Where does it live?",
            dont: "Everything is encrypted and fully compliant.",
            say:
              "The privacy policy names the controller, the processors and what\u2019s collected - I\u2019ll send it rather than paraphrase it. One thing worth flagging up front: credentials are publicly verifiable by design, so a holder\u2019s name, the certification and the dates are checkable by anyone. That\u2019s the point of a credential, and it\u2019s stated in the policy.",
            why:
              "Never improvise on data protection. And the public-verification point surprises people if they find it later rather than hearing it from you.",
          },
          {
            says: "What if we disagree with a result?",
            dont: "Results are final. / It\u2019s automated, so it\u2019s objective.",
            say:
              "Appeals go to info@certidemy.com with whatever evidence you have. A person reviews it. Certidemy management can revoke a credential where there\u2019s fraud, and the same route works in the other direction.",
            why:
              "\u201CAutomated so it\u2019s objective\u201D is exactly the wrong answer to someone worried about recourse - it says there is none.",
          },
        ],
      },
    ],
    rulesHeading: "Three rules underneath all of this",
    rules: [
      "If you don\u2019t know, say you\u2019ll find out. Every hard question here has a real answer sitting in a document you can send. Improvising is the only way to get it wrong.",
      "Never say anything about a competitor you couldn\u2019t source and date. Redirect to what we publish instead. It\u2019s stronger and it can\u2019t be rebutted.",
      "Never say accredited, psychometrically validated, globally recognised, or quote a pass rate. Not because they\u2019re unflattering - because they aren\u2019t ours to claim yet.",
    ],
    sourcesLabel: "Sources",
    sources:
      "How the exam works covers integrity and ISO/IEC 17024 alignment in detail. CLAIMS-POLICY.md is the authority on permitted wording; this document applies it to live conversation and does not override it. The blueprint sheet and job task analysis carry the numbers for each certification.",
    generated: "Generated",
    generatedFor: "Generated for",
    page: "Page",
    of: "of",
  },

  "es-419": {
    bandText: "INTERNO - NO REENVIAR",
    eyebrow: "Objeciones, y qu\u00E9 responder",
    title: "Lo que un comprador realmente dice, y la respuesta que se sostiene.",
    lead:
      "Lo que un comprador realmente dice, qu\u00E9 no responder, y la respuesta que se sostiene. La l\u00EDnea de \u201Cno digas\u201D es la importante: un representante sin preparaci\u00F3n no se queda callado, improvisa, y las respuestas improvisadas a preguntas dif\u00EDciles son donde se hacen afirmaciones que no podemos sustentar.",
    internalNote:
      "Solo para ventas, marketing y soporte de Certidemy. Este documento registra lo que tenemos cuidado de NO afirmar, y un prospecto o cliente que lo lea saca precisamente la conclusi\u00F3n equivocada. Cada copia lleva marca de agua con la direcci\u00F3n para la que se gener\u00F3.",
    intro:
      "Cada objeci\u00F3n aqu\u00ED se desprende de algo cierto sobre nuestra posici\u00F3n. Nada especulativo. Cuando escuches una que no est\u00E9 en este documento, esa es la se\u00F1al para agregarla: un documento lleno de respuestas a preguntas que nadie hace es un documento que la gente deja de leer.",
    labelDont: "No digas:",
    labelSay: "Di esto:",
    groups: [
      {
        title: "Credibilidad",
        items: [
          {
            says: "\u00BFEst\u00E1n acreditados?",
            dont: "S\u00ED, estamos certificados en ISO 17024. / Cumplimos con ISO.",
            say:
              "No. Estamos dise\u00F1ados conforme al marco ISO/IEC 17024, que es el est\u00E1ndar para organismos que certifican personas, pero la acreditaci\u00F3n es una evaluaci\u00F3n formal de un tercero realizada por un organismo de acreditaci\u00F3n, y no hemos pasado por una. Afirmar lo contrario ser\u00EDa falso. Lo que s\u00ED puedo mostrarte es todo lo que el marco pide: el an\u00E1lisis de tareas, el blueprint del examen derivado de \u00E9l, y c\u00F3mo se administra el examen.",
            why:
              "Un comprador que pregunta esto conoce la diferencia. Decirlo primero convierte tu punto m\u00E1s d\u00E9bil en la frase m\u00E1s cre\u00EDble de la conversaci\u00F3n. Todos los documentos generados ya lo declaran, as\u00ED que un representante que lo maquille ser\u00E1 contradicho por su propio adjunto.",
          },
          {
            says: "Nunca hab\u00EDa o\u00EDdo hablar de Certidemy.",
            dont: "Estamos creciendo r\u00E1pido. / Somos muy conocidos en LATAM.",
            say:
              "Es justo: somos nuevos. Lo que ofrecemos en lugar de reconocimiento de marca es que todo es inspeccionable: el an\u00E1lisis de tareas completo, el blueprint del examen con pesos y niveles cognitivos, y un documento que explica exactamente c\u00F3mo funciona el examen. La mayor\u00EDa de los programas establecidos no te entregan eso. J\u00FAzganos por lo que puedes leer y no por qui\u00E9n m\u00E1s ha o\u00EDdo hablar de nosotros.",
            why:
              "Nunca discutas sobre un reconocimiento de marca que no tienes. Redirige a lo que es genuinamente inusual y verificable.",
          },
          {
            says: "\u00BFQui\u00E9n m\u00E1s est\u00E1 usando esto? \u00BFHay casos de \u00E9xito?",
            dont: "Tenemos varios clientes empresariales. / No podemos revelar nombres.",
            say:
              "A\u00FAn no lanzamos, as\u00ED que no: no voy a inventar una lista de clientes. Lo que s\u00ED puedo hacer es darte los documentos de esquema reales para que eval\u00FAes el fondo, y hablar de formar parte de la primera cohorte, que incluye acceso directo a nosotros.",
            why:
              "Una lista de clientes inventada o vaga es la forma m\u00E1s r\u00E1pida de perder a un lector de compras, y es trivialmente verificable.",
          },
        ],
      },
      {
        title: "Integridad del examen",
        items: [
          {
            says: "\u00BFEs supervisado? \u00BFC\u00F3mo saben que no hicieron trampa?",
            dont: "Es totalmente seguro. / Nuestra IA detecta las trampas.",
            say:
              "No es supervisado en este nivel: no hay c\u00E1mara ni verificaci\u00F3n de identidad. El significado de la credencial no descansa en la vigilancia, sino en un puntaje de aprobaci\u00F3n publicado, un blueprint publicado, e \u00EDtems tomados mec\u00E1nicamente de un banco protegido que el lado de estudio de la plataforma no puede alcanzar. Adem\u00E1s, el servidor registra la forma exacta que entreg\u00F3 y califica contra ese registro y no contra lo que reporte el navegador, y cada \u00EDtem lleva su propio tiempo, as\u00ED que un intento cuyo patr\u00F3n no parece razonamiento pasa a revisi\u00F3n de una persona bajo un proceso documentado.",
            why:
              "\u201CTotalmente seguro\u201D invita a una sola pregunta que termina la conversaci\u00F3n. La respuesta honesta es m\u00E1s larga y mucho m\u00E1s fuerte, y est\u00E1 toda en el documento C\u00F3mo funciona el examen que puedes enviar despu\u00E9s.",
          },
          {
            says: "Entonces sus anal\u00EDticas detectan tramposos.",
            dont: "S\u00ED, detectamos trampas autom\u00E1ticamente.",
            say:
              "Marcan un intento para revisi\u00F3n humana. Lo que ocurre despu\u00E9s de una marca es un proceso, no una revocaci\u00F3n autom\u00E1tica: se contacta a la persona y tiene oportunidad de responder antes de que alguien decida nada.",
            why:
              "Un comprador que pregunta esto normalmente est\u00E1 probando si hemos pensado en el debido proceso. Y una decisi\u00F3n automatizada con efecto jur\u00EDdico conlleva obligaciones reales, as\u00ED que exagerar aqu\u00ED no solo es descuidado, es exposici\u00F3n.",
          },
          {
            says: "\u00BFY si a mi empleado se le apaga la laptop a mitad del examen? \u00BFPierde el intento?",
            dont: "Tendr\u00EDa que contactar a soporte. / Lo resolver\u00EDamos caso por caso.",
            say:
              "No. Las respuestas se escriben en el servidor a medida que se dan, no se guardan en el navegador, as\u00ED que vuelve a la misma forma en el mismo orden y con sus respuestas puestas. El reloj sigue corriendo mientras est\u00E1 fuera: se permite la interrupci\u00F3n, no el tiempo extra. Y si nunca vuelve, el intento se califica con lo que se guard\u00F3 en lugar de quedar abierto para siempre.",
            why:
              "Esta pega fuerte con compradores corporativos en LATAM en particular, porque la conectividad es desigual y a todos los ha quemado alguna plataforma que anul\u00F3 un intento pagado.",
          },
        ],
      },
      {
        title: "Valor y comparaci\u00F3n",
        items: [
          {
            says: "\u00BFPor qu\u00E9 pagar\u00EDa por esto si hay cursos gratis en todas partes?",
            dont: "Nuestro contenido es de mayor calidad.",
            say:
              "Aqu\u00ED aprender tambi\u00E9n es gratis: cada lecci\u00F3n, cada pregunta de pr\u00E1ctica, el blueprint completo. Solo pagas cuando alguien est\u00E1 listo para presentar el examen. Lo que compras no es el curso, es la evaluaci\u00F3n y la credencial: una afirmaci\u00F3n verificable de que esta persona demostr\u00F3 algo espec\u00EDfico, contra un alcance que puedes leer de antemano.",
            why:
              "Competir por calidad de contenido no se puede ganar ni verificar. El producto real es la evaluaci\u00F3n, y el modelo de aprender gratis es un diferenciador genuino que no cuesta nada declarar.",
          },
          {
            says: "\u00BFEn qu\u00E9 se diferencia esto de [un programa establecido]?",
            dont: "Ellos solo eval\u00FAan memorizaci\u00F3n. / Su blueprint est\u00E1 oculto. / Ignoran la IA.",
            say:
              "No voy a caracterizar su programa; prefiero mostrarte el nuestro. Publicamos el an\u00E1lisis de tareas completo, cada peso de dominio, cada nivel cognitivo, y cu\u00E1les tareas deliberadamente no evaluamos porque una pregunta de opci\u00F3n m\u00FAltiple no puede medirlas con honestidad. Compara eso contra lo que sea que nos est\u00E9s midiendo y juzga por ti mismo.",
            why:
              "Cualquier cosa sobre la pr\u00E1ctica de un competidor necesita fuente y fecha, o es una afirmaci\u00F3n que no podemos sustentar; y si est\u00E1 equivocada, una sola frase suya deshace toda la conversaci\u00F3n. \u201CAqu\u00ED est\u00E1 el nuestro, compara\u201D es m\u00E1s fuerte de todos modos y no cuesta nada.",
          },
          {
            says: "\u00BFEsto es solo un envoltorio de ChatGPT? \u00BFUn generador de cursos con IA?",
            dont: "No, todo est\u00E1 escrito por humanos.",
            say:
              "El examen se construye a partir de un an\u00E1lisis de tareas que fue redactado y revisado antes de que existiera contenido alguno, y cada pregunta se remonta a una tarea declarada en el nivel cognitivo declarado de esa tarea, algo que se aplica cuando el \u00EDtem se crea y no que se audite despu\u00E9s. La materia es la IA, y la IA se usa para construir y traducir material, con revisi\u00F3n humana. La estructura es lo que hace que sea una certificaci\u00F3n y no un cuestionario generado, y esa estructura la puedes inspeccionar.",
            why:
              "Responde a la preocupaci\u00F3n real, que es el rigor, no las herramientas. Negar la participaci\u00F3n de la IA en una empresa de certificaci\u00F3n en IA suena evasivo y adem\u00E1s no es cierto.",
          },
        ],
      },
      {
        title: "Comercial y pr\u00E1ctico",
        items: [
          {
            says: "\u00BFPor qu\u00E9 la credencial solo dura un a\u00F1o?",
            dont: "Es el est\u00E1ndar de la industria. / Por control de calidad.",
            say:
              "Porque la materia se mueve. Una credencial en gobernanza de IA o en Scrum en la era de la IA que siguiera v\u00E1lida cinco a\u00F1os estar\u00EDa afirmando algo sobre un cuerpo de pr\u00E1ctica que cambi\u00F3 por debajo. La recertificaci\u00F3n mantiene honesta la afirmaci\u00F3n, y se declara desde el principio en lugar de esconderse.",
            why:
              "Una vigencia corta parece un mecanismo de ingresos a menos que des la raz\u00F3n real. La raz\u00F3n es buena; \u00FAsala.",
          },
          {
            says: "\u00BFPodemos obtener precio por volumen?",
            dont: "Dar una cifra.",
            say:
              "Los vouchers se venden a trav\u00E9s de CertiGlobal, que maneja paquetes grupales y precios por volumen; te conecto. Nada de nuestro lado lleva precio, deliberadamente, as\u00ED que no voy a cotizarte algo que despu\u00E9s resulte estar mal.",
            why:
              "El precio genuinamente no es nuestro. Todos los documentos generados lo omiten a prop\u00F3sito, as\u00ED que citar una cifra contradice el papeleo.",
          },
          {
            says: "\u00BFSolo tres idiomas?",
            dont: "Pronto habr\u00E1 m\u00E1s.",
            say:
              "Ingl\u00E9s, espa\u00F1ol latinoamericano y portugu\u00E9s brasile\u00F1o, y son un solo examen, no tres que se parecen entre s\u00ED: los \u00EDtems traducidos comparten su clave de respuesta, as\u00ED que un puntaje significa lo mismo en el idioma en que se haya tomado. Eso es m\u00E1s dif\u00EDcil que agregar idiomas, y es la raz\u00F3n por la que no hemos agregado m\u00E1s.",
            why:
              "\u201CPronto\u201D es un compromiso que nadie ha asumido. El punto de paridad es el logro de ingenier\u00EDa real aqu\u00ED.",
          },
          {
            says: "\u00BFLos datos de nuestra gente est\u00E1n seguros? \u00BFD\u00F3nde viven?",
            dont: "Todo est\u00E1 cifrado y en pleno cumplimiento.",
            say:
              "La pol\u00EDtica de privacidad nombra al responsable, a los encargados y qu\u00E9 se recolecta; te la env\u00EDo en lugar de parafrasearla. Algo que vale la pena se\u00F1alar desde el principio: las credenciales son verificables p\u00FAblicamente por dise\u00F1o, as\u00ED que el nombre de quien la tiene, la certificaci\u00F3n y las fechas los puede comprobar cualquiera. Ese es el punto de una credencial, y est\u00E1 declarado en la pol\u00EDtica.",
            why:
              "Nunca improvises sobre protecci\u00F3n de datos. Y el punto de la verificaci\u00F3n p\u00FAblica sorprende a la gente si lo descubre despu\u00E9s en lugar de escucharlo de ti.",
          },
          {
            says: "\u00BFY si no estamos de acuerdo con un resultado?",
            dont: "Los resultados son definitivos. / Es automatizado, as\u00ED que es objetivo.",
            say:
              "Las apelaciones van a info@certidemy.com con la evidencia que tengas. Una persona la revisa. La direcci\u00F3n de Certidemy puede revocar una credencial cuando hay fraude, y la misma v\u00EDa funciona en el sentido contrario.",
            why:
              "\u201CEs automatizado, as\u00ED que es objetivo\u201D es exactamente la respuesta equivocada para alguien preocupado por el recurso: dice que no hay ninguno.",
          },
        ],
      },
    ],
    rulesHeading: "Tres reglas por debajo de todo esto",
    rules: [
      "Si no sabes, di que lo averiguar\u00E1s. Cada pregunta dif\u00EDcil de aqu\u00ED tiene una respuesta real en un documento que puedes enviar. Improvisar es la \u00FAnica forma de equivocarse.",
      "Nunca digas nada sobre un competidor que no pudieras citar con fuente y fecha. Redirige a lo que publicamos. Es m\u00E1s fuerte y no se puede rebatir.",
      "Nunca digas acreditados, validados psicom\u00E9tricamente, reconocidos globalmente, ni cites una tasa de aprobaci\u00F3n. No porque sean poco halagadores, sino porque todav\u00EDa no nos corresponde afirmarlos.",
    ],
    sourcesLabel: "Fuentes",
    sources:
      "C\u00F3mo funciona el examen cubre en detalle la integridad y la alineaci\u00F3n con ISO/IEC 17024. CLAIMS-POLICY.md es la autoridad sobre la redacci\u00F3n permitida; este documento la aplica a la conversaci\u00F3n en vivo y no la reemplaza. El blueprint y el an\u00E1lisis de tareas llevan las cifras de cada certificaci\u00F3n.",
    generated: "Generado",
    generatedFor: "Generado para",
    page: "P\u00E1gina",
    of: "de",
  },

  "pt-BR": {
    bandText: "INTERNO - N\u00C3O ENCAMINHAR",
    eyebrow: "Obje\u00E7\u00F5es, e o que responder",
    title: "O que um comprador realmente diz, e a resposta que se sustenta.",
    lead:
      "O que um comprador realmente diz, o que n\u00E3o responder, e a resposta que se sustenta. A linha do \u201Cn\u00E3o diga\u201D \u00E9 a importante: um representante despreparado n\u00E3o fica calado, ele improvisa, e respostas improvisadas a perguntas dif\u00EDceis s\u00E3o onde se fazem afirma\u00E7\u00F5es que n\u00E3o conseguimos sustentar.",
    internalNote:
      "Somente para vendas, marketing e suporte da Certidemy. Este documento registra o que temos o cuidado de N\u00C3O afirmar, e um prospecto ou cliente que o leia tira exatamente a conclus\u00E3o errada. Cada c\u00F3pia traz marca d\u2019\u00E1gua com o endere\u00E7o para o qual foi gerada.",
    intro:
      "Cada obje\u00E7\u00E3o aqui decorre de algo verdadeiro sobre a nossa posi\u00E7\u00E3o. Nada especulativo. Quando voc\u00EA ouvir uma que n\u00E3o esteja neste documento, esse \u00E9 o sinal para acrescent\u00E1-la: um documento cheio de respostas a perguntas que ningu\u00E9m faz \u00E9 um documento que as pessoas param de ler.",
    labelDont: "N\u00E3o diga:",
    labelSay: "Diga isto:",
    groups: [
      {
        title: "Credibilidade",
        items: [
          {
            says: "Voc\u00EAs s\u00E3o acreditados?",
            dont: "Sim, somos certificados na ISO 17024. / Estamos em conformidade com a ISO.",
            say:
              "N\u00E3o. Somos projetados conforme a estrutura ISO/IEC 17024, que \u00E9 o padr\u00E3o para organismos que certificam pessoas, mas a acredita\u00E7\u00E3o \u00E9 uma avalia\u00E7\u00E3o formal de terceiros feita por um organismo acreditador, e n\u00E3o passamos por uma. Afirmar o contr\u00E1rio seria falso. O que eu posso mostrar \u00E9 tudo o que a estrutura pede: a an\u00E1lise de tarefas, o blueprint do exame derivado dela, e como o exame \u00E9 aplicado.",
            why:
              "Um comprador que pergunta isso conhece a diferen\u00E7a. Dizer primeiro transforma seu ponto mais fraco na frase mais cr\u00EDvel da conversa. Todos os documentos gerados j\u00E1 declaram isso, ent\u00E3o um representante que maquiar ser\u00E1 contradito pelo pr\u00F3prio anexo.",
          },
          {
            says: "Nunca ouvi falar da Certidemy.",
            dont: "Estamos crescendo r\u00E1pido. / Somos muito conhecidos na Am\u00E9rica Latina.",
            say:
              "\u00C9 justo: somos novos. O que oferecemos no lugar de reconhecimento de marca \u00E9 que tudo \u00E9 inspecion\u00E1vel: a an\u00E1lise de tarefas completa, o blueprint do exame com pesos e n\u00EDveis cognitivos, e um documento que explica exatamente como o exame funciona. A maioria dos programas estabelecidos n\u00E3o entrega isso. Julgue-nos pelo que voc\u00EA pode ler, e n\u00E3o por quem mais j\u00E1 ouviu falar de n\u00F3s.",
            why:
              "Nunca discuta sobre um reconhecimento de marca que voc\u00EA n\u00E3o tem. Redirecione para o que \u00E9 genuinamente incomum e verific\u00E1vel.",
          },
          {
            says: "Quem mais est\u00E1 usando isso? H\u00E1 casos de sucesso?",
            dont: "Temos v\u00E1rios clientes corporativos. / N\u00E3o podemos revelar nomes.",
            say:
              "Ainda n\u00E3o lan\u00E7amos, ent\u00E3o n\u00E3o: n\u00E3o vou inventar uma lista de clientes. O que eu posso fazer \u00E9 te dar os documentos de esquema reais para voc\u00EA avaliar o conte\u00FAdo, e conversar sobre fazer parte da primeira turma, que vem com acesso direto a n\u00F3s.",
            why:
              "Uma lista de clientes inventada ou vaga \u00E9 a forma mais r\u00E1pida de perder um leitor de compras, e \u00E9 trivialmente verific\u00E1vel.",
          },
        ],
      },
      {
        title: "Integridade do exame",
        items: [
          {
            says: "\u00C9 supervisionado? Como voc\u00EAs sabem que n\u00E3o houve fraude?",
            dont: "\u00C9 totalmente seguro. / Nossa IA detecta fraudes.",
            say:
              "N\u00E3o \u00E9 supervisionado neste n\u00EDvel: sem c\u00E2mera, sem verifica\u00E7\u00E3o de identidade. O significado da credencial n\u00E3o se apoia em vigil\u00E2ncia, e sim em uma nota de aprova\u00E7\u00E3o publicada, um blueprint publicado, e itens sorteados mecanicamente de um banco protegido que o lado de estudo da plataforma n\u00E3o consegue alcan\u00E7ar. Al\u00E9m disso, o servidor registra a forma exata que entregou e corrige contra esse registro, n\u00E3o contra o que o navegador reporta, e cada item carrega o pr\u00F3prio tempo, ent\u00E3o uma tentativa cujo padr\u00E3o n\u00E3o parece racioc\u00EDnio vai para revis\u00E3o de uma pessoa sob um processo documentado.",
            why:
              "\u201CTotalmente seguro\u201D convida a uma \u00FAnica pergunta que encerra a conversa. A resposta honesta \u00E9 mais longa e muito mais forte, e est\u00E1 toda no documento Como o exame funciona que voc\u00EA pode enviar depois.",
          },
          {
            says: "Ent\u00E3o a an\u00E1lise de voc\u00EAs pega quem frauda.",
            dont: "Sim, detectamos fraude automaticamente.",
            say:
              "Ela sinaliza uma tentativa para revis\u00E3o humana. O que acontece depois de um sinal \u00E9 um processo, n\u00E3o uma revoga\u00E7\u00E3o autom\u00E1tica: a pessoa \u00E9 contatada e tem oportunidade de responder antes que algu\u00E9m decida qualquer coisa.",
            why:
              "Um comprador que pergunta isso costuma estar testando se pensamos no devido processo. E uma decis\u00E3o automatizada com efeito jur\u00EDdico traz obriga\u00E7\u00F5es reais, ent\u00E3o exagerar aqui n\u00E3o \u00E9 s\u00F3 desleixo, \u00E9 exposi\u00E7\u00E3o.",
          },
          {
            says: "E se o notebook do meu funcion\u00E1rio desligar no meio do exame? Ele perde a tentativa?",
            dont: "Ele precisaria falar com o suporte. / Resolver\u00EDamos caso a caso.",
            say:
              "N\u00E3o. As respostas s\u00E3o gravadas no servidor conforme s\u00E3o dadas, n\u00E3o ficam no navegador, ent\u00E3o ele volta para a mesma forma na mesma ordem e com as respostas no lugar. O rel\u00F3gio continua correndo enquanto ele est\u00E1 fora: a interrup\u00E7\u00E3o \u00E9 permitida, o tempo extra n\u00E3o. E se ele nunca voltar, a tentativa \u00E9 corrigida com o que foi salvo em vez de ficar aberta para sempre.",
            why:
              "Essa pega forte com compradores corporativos na Am\u00E9rica Latina em particular, porque a conectividade \u00E9 desigual e todos j\u00E1 foram queimados por uma plataforma que anulou uma tentativa paga.",
          },
        ],
      },
      {
        title: "Valor e compara\u00E7\u00E3o",
        items: [
          {
            says: "Por que eu pagaria por isso se h\u00E1 cursos gratuitos em todo lugar?",
            dont: "Nosso conte\u00FAdo \u00E9 de qualidade superior.",
            say:
              "Aprender aqui tamb\u00E9m \u00E9 gratuito: cada li\u00E7\u00E3o, cada quest\u00E3o de pr\u00E1tica, o blueprint completo. Voc\u00EA s\u00F3 paga quando algu\u00E9m est\u00E1 pronto para fazer o exame. O que voc\u00EA compra n\u00E3o \u00E9 o curso, \u00E9 a avalia\u00E7\u00E3o e a credencial: uma afirma\u00E7\u00E3o verific\u00E1vel de que essa pessoa demonstrou algo espec\u00EDfico, contra um escopo que voc\u00EA pode ler de antem\u00E3o.",
            why:
              "Competir por qualidade de conte\u00FAdo n\u00E3o se ganha nem se verifica. O produto real \u00E9 a avalia\u00E7\u00E3o, e o modelo de aprender de gra\u00E7a \u00E9 um diferencial genu\u00EDno que n\u00E3o custa nada declarar.",
          },
          {
            says: "Como isso \u00E9 diferente de [um programa estabelecido]?",
            dont: "Eles s\u00F3 testam memoriza\u00E7\u00E3o. / O blueprint deles \u00E9 escondido. / Eles ignoram a IA.",
            say:
              "N\u00E3o vou caracterizar o programa deles; prefiro mostrar o nosso. Publicamos a an\u00E1lise de tarefas completa, cada peso de dom\u00EDnio, cada n\u00EDvel cognitivo, e quais tarefas deliberadamente n\u00E3o avaliamos porque uma quest\u00E3o de m\u00FAltipla escolha n\u00E3o consegue medi-las com honestidade. Compare isso com o que quer que esteja nos avaliando e julgue voc\u00EA mesmo.",
            why:
              "Qualquer coisa sobre a pr\u00E1tica de um concorrente precisa de fonte e data, ou \u00E9 uma afirma\u00E7\u00E3o que n\u00E3o conseguimos sustentar; e se estiver errada, uma \u00FAnica frase deles desfaz a conversa inteira. \u201CAqui est\u00E1 o nosso, compare\u201D \u00E9 mais forte de qualquer forma e n\u00E3o custa nada.",
          },
          {
            says: "Isso \u00E9 s\u00F3 um wrapper do ChatGPT? Um gerador de cursos com IA?",
            dont: "N\u00E3o, tudo \u00E9 escrito por humanos.",
            say:
              "O exame \u00E9 constru\u00EDdo a partir de uma an\u00E1lise de tarefas que foi redigida e revisada antes de existir qualquer conte\u00FAdo, e cada quest\u00E3o remete a uma tarefa declarada no n\u00EDvel cognitivo declarado dessa tarefa, o que \u00E9 imposto quando o item \u00E9 criado e n\u00E3o auditado depois. O assunto \u00E9 IA, e IA \u00E9 usada para construir e traduzir material, com revis\u00E3o humana. A estrutura \u00E9 o que faz disso uma certifica\u00E7\u00E3o e n\u00E3o um question\u00E1rio gerado, e essa estrutura voc\u00EA pode inspecionar.",
            why:
              "Responda \u00E0 preocupa\u00E7\u00E3o real, que \u00E9 rigor, n\u00E3o ferramenta. Negar o envolvimento de IA em uma empresa de certifica\u00E7\u00E3o em IA soa evasivo e tamb\u00E9m n\u00E3o \u00E9 verdade.",
          },
        ],
      },
      {
        title: "Comercial e pr\u00E1tico",
        items: [
          {
            says: "Por que a credencial dura s\u00F3 um ano?",
            dont: "\u00C9 o padr\u00E3o do mercado. / Por controle de qualidade.",
            say:
              "Porque o assunto se move. Uma credencial em governan\u00E7a de IA ou em Scrum na era da IA que continuasse v\u00E1lida por cinco anos estaria afirmando algo sobre um corpo de pr\u00E1tica que mudou por baixo. A recertifica\u00E7\u00E3o mant\u00E9m a afirma\u00E7\u00E3o honesta, e isso \u00E9 declarado logo de in\u00EDcio em vez de ficar escondido.",
            why:
              "Uma vig\u00EAncia curta parece um mecanismo de receita a menos que voc\u00EA d\u00EA o motivo real. O motivo \u00E9 bom; use.",
          },
          {
            says: "Conseguimos pre\u00E7o por volume?",
            dont: "Dar um n\u00FAmero.",
            say:
              "Os vouchers s\u00E3o vendidos pela CertiGlobal, que cuida de pacotes para grupos e pre\u00E7o por volume; eu te conecto. Nada do nosso lado carrega pre\u00E7o, deliberadamente, ent\u00E3o n\u00E3o vou te passar um valor que depois se mostre errado.",
            why:
              "O pre\u00E7o genuinamente n\u00E3o \u00E9 nosso. Todos os documentos gerados o omitem de prop\u00F3sito, ent\u00E3o citar um valor contradiz a papelada.",
          },
          {
            says: "S\u00F3 tr\u00EAs idiomas?",
            dont: "Em breve teremos mais.",
            say:
              "Ingl\u00EAs, espanhol latino-americano e portugu\u00EAs brasileiro, e s\u00E3o um \u00FAnico exame, n\u00E3o tr\u00EAs que se parecem: os itens traduzidos compartilham a chave de resposta, ent\u00E3o uma nota significa a mesma coisa no idioma em que tiver sido feita. Isso \u00E9 mais dif\u00EDcil do que acrescentar idiomas, e \u00E9 por isso que n\u00E3o acrescentamos mais.",
            why:
              "\u201CEm breve\u201D \u00E9 um compromisso que ningu\u00E9m assumiu. O ponto de paridade \u00E9 a conquista de engenharia de verdade aqui.",
          },
          {
            says: "Os dados da nossa gente est\u00E3o seguros? Onde eles ficam?",
            dont: "Tudo \u00E9 criptografado e totalmente conforme.",
            say:
              "A pol\u00EDtica de privacidade nomeia o controlador, os operadores e o que \u00E9 coletado; eu envio em vez de parafrasear. Uma coisa que vale sinalizar logo: as credenciais s\u00E3o publicamente verific\u00E1veis por design, ent\u00E3o o nome de quem a tem, a certifica\u00E7\u00E3o e as datas podem ser conferidos por qualquer pessoa. Esse \u00E9 o ponto de uma credencial, e est\u00E1 declarado na pol\u00EDtica.",
            why:
              "Nunca improvise sobre prote\u00E7\u00E3o de dados. E o ponto da verifica\u00E7\u00E3o p\u00FAblica surpreende as pessoas se elas descobrirem depois em vez de ouvirem de voc\u00EA.",
          },
          {
            says: "E se discordarmos de um resultado?",
            dont: "Os resultados s\u00E3o definitivos. / \u00C9 automatizado, ent\u00E3o \u00E9 objetivo.",
            say:
              "Recursos v\u00E3o para info@certidemy.com com as evid\u00EAncias que voc\u00EA tiver. Uma pessoa analisa. A dire\u00E7\u00E3o da Certidemy pode revogar uma credencial quando h\u00E1 fraude, e o mesmo caminho funciona no sentido contr\u00E1rio.",
            why:
              "\u201C\u00C9 automatizado, ent\u00E3o \u00E9 objetivo\u201D \u00E9 exatamente a resposta errada para algu\u00E9m preocupado com recurso: diz que n\u00E3o h\u00E1 nenhum.",
          },
        ],
      },
    ],
    rulesHeading: "Tr\u00EAs regras por tr\u00E1s de tudo isso",
    rules: [
      "Se voc\u00EA n\u00E3o sabe, diga que vai descobrir. Cada pergunta dif\u00EDcil daqui tem uma resposta real em um documento que voc\u00EA pode enviar. Improvisar \u00E9 a \u00FAnica forma de errar.",
      "Nunca diga nada sobre um concorrente que voc\u00EA n\u00E3o conseguiria citar com fonte e data. Redirecione para o que publicamos. \u00C9 mais forte e n\u00E3o d\u00E1 para rebater.",
      "Nunca diga acreditados, validados psicometricamente, reconhecidos globalmente, nem cite uma taxa de aprova\u00E7\u00E3o. N\u00E3o porque sejam pouco lisonjeiros, mas porque ainda n\u00E3o nos cabe afirm\u00E1-los.",
    ],
    sourcesLabel: "Fontes",
    sources:
      "Como o exame funciona cobre em detalhe a integridade e o alinhamento com a ISO/IEC 17024. CLAIMS-POLICY.md \u00E9 a autoridade sobre a reda\u00E7\u00E3o permitida; este documento a aplica \u00E0 conversa ao vivo e n\u00E3o a substitui. O blueprint e a an\u00E1lise de tarefas carregam os n\u00FAmeros de cada certifica\u00E7\u00E3o.",
    generated: "Gerado",
    generatedFor: "Gerado para",
    page: "P\u00E1gina",
    of: "de",
  },
};

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fmtDate(iso: string, locale: AssetLocale): string {
  const d = new Date(iso);
  const tag = locale === "es-419" ? "es-419" : locale === "pt-BR" ? "pt-BR" : "en-GB";
  return d.toLocaleDateString(tag, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* Type sizes and leading, in one place because the measure pass and the draw
   pass BOTH read them. If these ever diverge, blocks split across pages exactly
   where they must not. */
const S_SAYS = 10.5;
const L_SAYS = 14;
const S_DONT = 8.6;
const L_DONT = 11.5;
const S_SAY = 9;
const L_SAY = 12.2;
const S_WHY = 8;
const L_WHY = 10.6;
const GAP_BLOCK = 15;
const IND = 16;

export async function renderObjections(
  data: ObjectionsData,
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

  pdf.setTitle(`${S.eyebrow} - INTERNAL`);
  pdf.setProducer("Certidemy");
  pdf.setCreator("Certidemy");

  const generatedAt = new Date().toISOString();
  const pages: PDFPage[] = [];
  let page!: PDFPage;
  let y = 0;

  /** Full-width band. Every page, not just the first - a band on page one does
      not survive a cropped screenshot of page three. */
  const drawBand = (p: PDFPage) => {
    p.drawRectangle({
      x: 0,
      y: A4_H - BAND_H,
      width: A4_W,
      height: BAND_H,
      color: DANGER,
    });
    p.drawText(S.bandText, {
      x: M,
      y: A4_H - BAND_H + 7.5,
      size: 8,
      font: mono,
      color: rgb(1, 1, 1),
    });
    const stamp = data.recipientEmail;
    const w = mono.widthOfTextAtSize(stamp, 7.5);
    p.drawText(stamp, {
      x: A4_W - M - w,
      y: A4_H - BAND_H + 7.7,
      size: 7.5,
      font: mono,
      color: rgb(1, 0.86, 0.86),
    });
  };

  /** Diagonal, low opacity, under the content. Carries the recipient so a
      photographed page still identifies the copy it came from. */
  const drawWatermark = (p: PDFPage) => {
    const mark = `${S.bandText}  ${data.recipientEmail}`;
    for (let i = 0; i < 4; i++) {
      p.drawText(mark, {
        x: -30,
        y: 120 + i * 190,
        size: 15,
        font: semi,
        color: INK_MUTE,
        opacity: 0.09,
        rotate: degrees(38),
      });
    }
  };

  const newPage = () => {
    page = pdf.addPage([A4_W, A4_H]);
    pages.push(page);
    drawWatermark(page);
    drawBand(page);
    y = A4_H - BAND_H - 30;
  };

  const ensure = (h: number) => {
    if (y - h < FOOT) newPage();
  };

  const heading = (t: string) => {
    ensure(34);
    y -= 4;
    page.drawText(t.toUpperCase(), { x: M, y, size: 7.5, font: mono, color: ACCENT });
    y -= 7;
    page.drawLine({
      start: { x: M, y },
      end: { x: A4_W - M, y },
      thickness: 0.7,
      color: ACCENT,
    });
    y -= 16;
  };

  /** Height of one objection block. MUST mirror drawObjection exactly. */
  const measureObjection = (o: Objection): number => {
    let h = 0;
    h += wrap(`\u201C${o.says}\u201D`, semi, S_SAYS, CW - 14).length * L_SAYS;
    h += 5;
    const dontW = CW - IND - regular.widthOfTextAtSize(`${S.labelDont} `, S_DONT);
    h += Math.max(1, wrap(o.dont, regular, S_DONT, dontW).length) * L_DONT;
    h += 4;
    const sayW = CW - IND - regular.widthOfTextAtSize(`${S.labelSay} `, S_SAY);
    h += Math.max(1, wrap(o.say, regular, S_SAY, sayW).length) * L_SAY;
    h += 5;
    h += wrap(o.why, regular, S_WHY, CW - IND - 10).length * L_WHY;
    h += GAP_BLOCK;
    return h;
  };

  /**
   * A label whose first line runs inline with the body, the remainder wrapping
   * to the indent. Same shape as titledBullet in whatis.ts.
   */
  const labelled = (
    label: string,
    body: string,
    labelColor: ReturnType<typeof rgb>,
    bodyColor: ReturnType<typeof rgb>,
    size: number,
    leading: number,
  ) => {
    const lw = semi.widthOfTextAtSize(`${label} `, size);
    page.drawText(label, { x: M + IND, y, size, font: semi, color: labelColor });
    const avail = CW - IND - lw;
    const words = body.split(/\s+/).filter(Boolean);
    let first = "";
    let i = 0;
    while (i < words.length) {
      const next = first ? `${first} ${words[i]}` : words[i];
      if (regular.widthOfTextAtSize(next, size) > avail) break;
      first = next;
      i += 1;
    }
    if (first) {
      page.drawText(first, {
        x: M + IND + lw,
        y,
        size,
        font: regular,
        color: bodyColor,
      });
    }
    y -= leading;
    const rest = words.slice(i).join(" ");
    if (rest) {
      for (const line of wrap(rest, regular, size, CW - IND)) {
        page.drawText(line, { x: M + IND, y, size, font: regular, color: bodyColor });
        y -= leading;
      }
    }
  };

  const drawObjection = (o: Objection) => {
    // Measured whole and moved intact. Never split: a page ending after the
    // "don't say" line leaves a forbidden claim as its last words.
    ensure(measureObjection(o));

    const saysLines = wrap(`\u201C${o.says}\u201D`, semi, S_SAYS, CW - 14);
    const saysTop = y;
    for (const line of saysLines) {
      page.drawText(line, { x: M + 14, y, size: S_SAYS, font: semi, color: INK });
      y -= L_SAYS;
    }
    page.drawRectangle({
      x: M,
      y: y + L_SAYS - 3,
      width: 3,
      height: saysTop - y,
      color: ACCENT,
    });
    y -= 5 - (L_SAYS - S_SAYS);

    labelled(S.labelDont, o.dont, DANGER, INK_MUTE, S_DONT, L_DONT);
    y -= 4;
    labelled(S.labelSay, o.say, SUCCESS, INK_SOFT, S_SAY, L_SAY);
    y -= 5;

    const whyLines = wrap(o.why, regular, S_WHY, CW - IND - 10);
    const whyTop = y;
    for (const line of whyLines) {
      page.drawText(line, {
        x: M + IND + 10,
        y,
        size: S_WHY,
        font: regular,
        color: INK_MUTE,
      });
      y -= L_WHY;
    }
    page.drawLine({
      start: { x: M + IND, y: whyTop + S_WHY - 1 },
      end: { x: M + IND, y: y + L_WHY - 2 },
      thickness: 0.8,
      color: HAIRLINE,
    });

    y -= GAP_BLOCK;
  };

  // ---- page 1 ------------------------------------------------------------
  newPage();

  page.drawText(S.eyebrow.toUpperCase(), {
    x: M,
    y,
    size: 8,
    font: mono,
    color: ACCENT,
  });
  y -= 22;

  for (const line of wrap(S.title, bold, 17, CW)) {
    page.drawText(line, { x: M, y, size: 17, font: bold, color: INK });
    y -= 21;
  }
  y -= 6;

  for (const line of wrap(S.lead, regular, 9.4, CW)) {
    page.drawText(line, { x: M, y, size: 9.4, font: regular, color: INK_SOFT });
    y -= 12.6;
  }
  y -= 12;

  // Internal notice panel. Deliberately the first block a reader meets.
  {
    const lines = wrap(S.internalNote, regular, 8.6, CW - 26);
    const h = lines.length * 11.4 + 18;
    page.drawRectangle({
      x: M,
      y: y - h + 12,
      width: CW,
      height: h,
      color: DANGER_SOFT,
      borderColor: DANGER,
      borderWidth: 0.8,
    });
    let ty = y;
    for (const line of lines) {
      page.drawText(line, { x: M + 13, y: ty, size: 8.6, font: regular, color: INK });
      ty -= 11.4;
    }
    y = y - h + 2;
  }
  y -= 14;

  {
    const lines = wrap(S.intro, regular, 8.6, CW - 26);
    const h = lines.length * 11.4 + 18;
    page.drawRectangle({
      x: M,
      y: y - h + 12,
      width: CW,
      height: h,
      color: ACCENT_SOFT,
      borderColor: ACCENT,
      borderWidth: 0.7,
    });
    let ty = y;
    for (const line of lines) {
      page.drawText(line, { x: M + 13, y: ty, size: 8.6, font: regular, color: INK_SOFT });
      ty -= 11.4;
    }
    y = y - h + 2;
  }
  y -= 18;

  // ---- the objections ----------------------------------------------------
  for (const g of S.groups) {
    heading(g.title);
    for (const o of g.items) drawObjection(o);
    y -= 4;
  }

  // ---- closing rules -----------------------------------------------------
  heading(S.rulesHeading);
  for (const r of S.rules) {
    const lines = wrap(r, regular, 8.8, CW - 16);
    ensure(lines.length * 11.8 + 10);
    page.drawCircle({ x: M + 2.5, y: y + 3, size: 1.8, color: ACCENT });
    for (const line of lines) {
      page.drawText(line, { x: M + 16, y, size: 8.8, font: regular, color: INK_SOFT });
      y -= 11.8;
    }
    y -= 7;
  }

  // ---- sources -----------------------------------------------------------
  y -= 6;
  {
    const lines = wrap(`${S.sourcesLabel}: ${S.sources}`, regular, 7.8, CW);
    ensure(lines.length * 10.4 + 12);
    page.drawLine({
      start: { x: M, y: y + 8 },
      end: { x: A4_W - M, y: y + 8 },
      thickness: 0.7,
      color: HAIRLINE,
    });
    y -= 4;
    for (const line of lines) {
      page.drawText(line, { x: M, y, size: 7.8, font: regular, color: INK_MUTE });
      y -= 10.4;
    }
  }

  // ---- footers, once the page count is known -----------------------------
  const total = pages.length;
  pages.forEach((p, idx) => {
    p.drawLine({
      start: { x: M, y: FOOT - 16 },
      end: { x: A4_W - M, y: FOOT - 16 },
      thickness: 0.7,
      color: HAIRLINE,
    });
    p.drawText(`${S.bandText}  \u00B7  ${siteBase.replace(/^https?:\/\//, "")}`, {
      x: M,
      y: FOOT - 29,
      size: 7,
      font: mono,
      color: DANGER,
    });
    const right = `${S.generatedFor} ${data.recipientEmail}  \u00B7  ${S.generated} ${fmtDate(generatedAt, locale)}  \u00B7  ${S.page} ${idx + 1} ${S.of} ${total}`;
    const w = regular.widthOfTextAtSize(right, 7);
    p.drawText(right, {
      x: A4_W - M - w,
      y: FOOT - 29,
      size: 7,
      font: regular,
      color: INK_MUTE,
    });
  });

  return await pdf.save();
}
