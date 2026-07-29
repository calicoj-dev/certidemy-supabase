// supabase/functions/_shared/enginebrief.ts
//
// Renders "How the examination works" as a PDF (A4 portrait, multi-page), per
// certification, in en / es-419 / pt-BR.
//
// WHAT THIS DOCUMENT IS FOR
//
// The fact sheet says what the certification is. The blueprint sheet says how
// the examination is composed. The JTA sheet says what the credential claims.
// This says HOW THE EXAMINATION IS CONDUCTED AND WHY IT IS BUILT THIS WAY - the
// document for the buyer whose next question is "and how do I know it can't be
// gamed?".
//
// Most certification bodies will not answer that question in writing. Being able
// to is the point.
//
// ============================================================================
// THIS IS NOT THE CONSOLE BRIEFING
// ============================================================================
//
// /console/engine exists for the internal team and contains coaching: what not
// to claim, what we gave up by building our own engine, how to frame the fraud
// analytics without overstating it. NONE of that belongs in a document a
// representative attaches to an email.
//
// What crosses over is the mechanism, the ISO/IEC 17024 alignment, and the
// capability argument for building rather than buying. What does not cross over:
//
//   NO COMPETITOR NAMES. The console page names commodity quiz platforms because
//   a rep needs the comparison in their head. A client-facing document asserting
//   what a named competitor does or does not do is a Class D claim under
//   CLAIMS-POLICY - unevidenced, undated, and exactly the kind of thing that
//   invites a rebuttal. The argument here is stated as requirements we had, not
//   as failings others have.
//
//   NO CLAIMS BLACKLIST. Telling a buyer what we are careful not to say reads as
//   either naive or evasive.
//
//   NO INTERNAL FRAMING. "Do not describe this as catching cheaters" is guidance
//   for a person on a call, not content.
//
// PER CERTIFICATION, NOT GENERIC. Every structural claim is paired with this
// certification's real numbers - form size, pass mark, domain count, declared
// versus examined tasks. A generic brochure about "our engine" is marketing; a
// document stating that THIS examination declares N tasks and examines N-k of
// them, and names the gap, is evidence.
//
// STILL DELIBERATELY OMITTED
//   NO PRICE. NO ITEM CONTENT - not one question, not one distractor. NO PASS
//   RATES. The mechanism is described; the item bank is never exposed.
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
 * Bump on ANY change to this file or to the font payload. It is part of the
 * storage path, so bumping it invalidates every cached brief.
 *
 * 1 - initial
 */
export const ENGINE_BRIEF_RENDERER_VERSION = "1";

const INK = rgb(0x1d / 255, 0x1d / 255, 0x1f / 255);
const INK_SOFT = rgb(0x42 / 255, 0x42 / 255, 0x47 / 255);
const INK_MUTE = rgb(0x86 / 255, 0x86 / 255, 0x8b / 255);
const ACCENT = rgb(0xbe / 255, 0x18 / 255, 0x5d / 255);
const ACCENT_DEEP = rgb(0x9d / 255, 0x17 / 255, 0x4d / 255);
const HAIRLINE = rgb(0xd2 / 255, 0xd2 / 255, 0xd7 / 255);

const A4_W = 595.28;
const A4_H = 841.89;
const M = 52;
const CW = A4_W - M * 2;
const FOOT = 92;

export interface EngineBriefData {
  code: string;
  name: string;
  status: string;
  numQuestions: number;
  passingScorePct: number;
  examDurationMinutes: number;
  maxExamAttempts: number | null;
  attemptWindowMonths: number | null;
  validityDays: number | null;
  domainCount: number;
  /** Tasks declared in the analysis. */
  totalTasks: number;
  /** Tasks actually examined by the multiple-choice form. */
  examScopeTasks: number;
  /** Languages this certification is genuinely delivered in. */
  languages: string[];
  blueprintComputedAt: string | null;
  cognitiveModelVersion: string | null;
}

/** Display-only. Leaves the DB value alone, same as the catalog navigator. */
function stripBrand(value: string): string {
  return value.replace(/^Certidemy\s+/i, "");
}

interface Strings {
  eyebrow: string;
  intro: string;
  comingSoon: string;

  paramsHeading: string;
  pQuestions: string;
  pDuration: string;
  pPass: string;
  pDomains: string;
  pDeclared: string;
  pExamined: string;
  pAttempts: string;
  pWindow: string;
  pValidity: string;
  pLanguages: string;
  unlimited: string;
  months: string;
  days: string;
  minutes: string;

  chainHeading: string;
  chainLead: string;
  chainFlow: string;
  chainBody1: string;
  chainBody2: string;

  serverHeading: string;
  serverLead: string;
  server1: string;
  server2: string;
  server3: string;

  continuityHeading: string;
  continuityLead: string;
  continuity1: string;
  continuity2: string;
  continuity3: string;

  securityHeading: string;
  securityLead: string;
  security1: string;
  security2: string;
  security3: string;
  security4: string;

  langHeading: string;
  langLead: string;
  langBody: string;

  credHeading: string;
  credLead: string;
  cred1: string;
  cred2: string;
  cred3: string;
  cred4: string;

  notHeading: string;
  notLead: string;
  not1: string;
  not2: string;
  not3: string;

  isoHeading: string;
  isoLead: string;
  iso1: string;
  iso2: string;
  iso3: string;
  iso4: string;
  isoNote: string;

  whyHeading: string;
  whyLead: string;
  why1: string;
  why2: string;
  why3: string;
  why4: string;

  generated: string;
  currentVersion: string;
  blueprintNote: string;
  page: string;
  of: string;
}

const STRINGS: Record<AssetLocale, Strings> = {
  "en": {
    eyebrow: "How the examination works",
    intro:
      "How this examination is conducted, what the platform records while it runs, and why it was built rather than bought. Every mechanism described here can be checked against the published blueprint and job task analysis.",
    comingSoon: "Coming soon - not yet open for examination",

    paramsHeading: "This examination",
    pQuestions: "Questions per form",
    pDuration: "Time limit",
    pPass: "Pass mark",
    pDomains: "Domains",
    pDeclared: "Tasks declared",
    pExamined: "Tasks examined",
    pAttempts: "Attempts per voucher",
    pWindow: "Attempt window",
    pValidity: "Credential validity",
    pLanguages: "Languages",
    unlimited: "Unlimited",
    months: "months",
    days: "days",
    minutes: "minutes",

    chainHeading: "Where the questions come from",
    chainLead: "Every link is a record, not a document somebody maintains.",
    chainFlow:
      "job task analysis  ->  domains and weights  ->  tasks at cognitive levels  ->  item bank  ->  assembled form  ->  recorded form  ->  score  ->  credential",
    chainBody1:
      "The job task analysis declares what a certified person can do. Domains carry weights. Each task carries a cognitive level, a criticality and a frequency. Items are written against tasks and cannot claim a level their task does not have.",
    chainBody2:
      "The examination's cognitive profile is therefore computed from the analysis rather than asserted over it. The blueprint sheet publishes the result and can be compared with this document.",

    serverHeading: "The examination is defined by the server",
    serverLead: "Not by the candidate's browser.",
    server1:
      "When a candidate begins, the platform assembles a blueprint-weighted form and records exactly which items were served, in which order, in which language.",
    server2:
      "Scoring grades that record. The number of questions is the number the platform issued, so it cannot be reduced by submitting fewer answers, and an unanswered item is scored as incorrect because it was on the form.",
    server3:
      "An item that was never served cannot be scored at all. Practice material, whose answers are shown openly during study, therefore has no path into a certification result.",

    continuityHeading: "An interruption costs time, not the attempt",
    continuityLead: "Connectivity is uneven. A credential should not depend on it.",
    continuity1:
      "Answers are written to the platform as they are given, not held in the browser until submission. A device failing mid-examination does not discard the work.",
    continuity2:
      "A candidate who returns resumes the same form, in the same order, with their own answers in place. Because the form was recorded they are not issued a new sample.",
    continuity3:
      "The clock is anchored to the server's start time and continues while the candidate is away. Interruption is permitted; additional time is not.",

    securityHeading: "Item security",
    securityLead: "What protects the meaning of the credential.",
    security1:
      "If the secure pool cannot fill the blueprint for a domain in the requested language, the examination is refused with an explanation rather than issued short or unbalanced.",
    security2:
      "Multiple choice has a ceiling. Tasks that a multiple-choice question cannot honestly measure are declared in the analysis and marked as not examined, reserved for simulation. The job task analysis shows exactly which.",
    security3:
      "Practice items and examination items are separate pools. Examination items are not linked into the study engine, so no practice path can surface one.",
    security4:
      "Item exposure - how much of a pool a single sitting reveals, and what repeated attempts accumulate to - is measured rather than assumed.",

    langHeading: "Three languages, one measurement",
    langLead: "Not three examinations that resemble each other.",
    langBody:
      "Translated items share their answer key and option identifiers with their source, so a score means the same thing in any language offered. A certification examination will not silently substitute another language: if the pool cannot fill the blueprint in the language requested, the attempt is refused.",

    credHeading: "What the credential carries",
    credLead: "A score is a number. A credential has to survive scrutiny later.",
    cred1:
      "It is issued in the same operation as the examination record, so a pass cannot exist without the attempt behind it.",
    cred2:
      "It is stamped with the version of the job task analysis it was assessed against, so a verifier years later sees the scope as it stood at issue.",
    cred3:
      "The holder's name and the certification name are captured at issue, so later changes never rewrite issued history.",
    cred4:
      "Anyone can verify it on a public page, from the code or the QR on the certificate, without contacting us.",

    notHeading: "What this examination does not do",
    notLead: "Stated plainly, because a buyer is entitled to know.",
    not1:
      "It is not proctored at this level. There is no camera, no identity verification and no screen recording. The credential's meaning rests on a published pass mark, a published blueprint and items drawn mechanically from a protected pool - not on supervision.",
    not2:
      "It does not attempt to block screenshots. No web application can; the operating system controls the screen, and a camera defeats any measure that existed.",
    not3:
      "It does not attempt to block copying. Such measures are trivially bypassed and they break assistive technology, which would trade genuine accessibility for no security. Instead, timing and interaction are recorded per item, and an attempt whose pattern is inconsistent with reasoning can be reviewed by a person under a documented process.",

    isoHeading: "Alignment with ISO/IEC 17024",
    isoLead:
      "The framework for bodies certifying persons. Alignment, not accreditation - see the note below.",
    iso1:
      "Competence is defined before assessment. The job task analysis is authored, reviewed and published, and the examination is derived from it rather than assembled first and described afterwards.",
    iso2:
      "The examination measures what is declared. Every item traces to a declared task at that task's declared level, enforced when the item is created, not audited afterwards.",
    iso3:
      "The scope of the claim matches the scope of the measurement. Tasks above the ceiling of the question format are declared and marked as not examined, so the credential does not claim what it did not test.",
    iso4:
      "Records are retained. Each examination keeps its item-level record - what was served, what was answered, how long each item took - and unenrolment archives rather than deletes.",
    isoNote:
      "Certidemy is designed to the ISO/IEC 17024 framework. It is not accredited to it. Accreditation is a formal third-party assessment by an accreditation body, and any claim of it would be false until such an assessment has taken place. That distinction is stated here because a buyer who cannot find it stated tends to assume the stronger claim.",

    whyHeading: "Why this was built rather than bought",
    whyLead: "Four requirements no general-purpose assessment tool satisfies.",
    why1:
      "The blueprint has to build the examination, not describe it. A form assembled from declared domain weights and task levels every time is a different object from a question bank with a document beside it.",
    why2:
      "Practice and examination material must be separable at the data level, with the study engine unable to reach examination items. A single bank cannot express that.",
    why3:
      "Multilingual delivery has to be one measurement, not parallel examinations. Shared answer keys and option identifiers across languages are a property of the item model, not something added later.",
    why4:
      "The credential and its provenance have to belong to the certification body. A tool returns a score; the version stamping, language fidelity, retention and public verification described above are the certification.",

    generated: "Generated",
    currentVersion: "Current version",
    blueprintNote: "blueprint computed",
    page: "Page",
    of: "of",
  },

  "es-419": {
    eyebrow: "Cómo funciona el examen",
    intro:
      "Cómo se administra este examen, qué registra la plataforma mientras se desarrolla y por qué se construyó en lugar de contratarse. Cada mecanismo descrito aquí puede verificarse contra el blueprint y el análisis de tareas publicados.",
    comingSoon: "Próximamente - aún no abierta a examen",

    paramsHeading: "Este examen",
    pQuestions: "Preguntas por forma",
    pDuration: "Límite de tiempo",
    pPass: "Puntaje de aprobación",
    pDomains: "Dominios",
    pDeclared: "Tareas declaradas",
    pExamined: "Tareas evaluadas",
    pAttempts: "Intentos por voucher",
    pWindow: "Ventana de intentos",
    pValidity: "Vigencia de la credencial",
    pLanguages: "Idiomas",
    unlimited: "Ilimitados",
    months: "meses",
    days: "días",
    minutes: "minutos",

    chainHeading: "De dónde vienen las preguntas",
    chainLead: "Cada eslabón es un registro, no un documento que alguien mantiene.",
    chainFlow:
      "análisis de tareas  ->  dominios y pesos  ->  tareas con nivel cognitivo  ->  banco de ítems  ->  forma armada  ->  forma registrada  ->  puntaje  ->  credencial",
    chainBody1:
      "El análisis de tareas declara qué puede hacer una persona certificada. Los dominios llevan pesos. Cada tarea lleva un nivel cognitivo, una criticidad y una frecuencia. Los ítems se escriben contra tareas y no pueden declarar un nivel que su tarea no tiene.",
    chainBody2:
      "Por lo tanto, el perfil cognitivo del examen se calcula a partir del análisis en lugar de declararse sobre él. El blueprint publica el resultado y puede compararse con este documento.",

    serverHeading: "El examen lo define el servidor",
    serverLead: "No el navegador del candidato.",
    server1:
      "Cuando un candidato comienza, la plataforma arma una forma ponderada por el blueprint y registra exactamente qué ítems se entregaron, en qué orden y en qué idioma.",
    server2:
      "La calificación evalúa ese registro. La cantidad de preguntas es la que emitió la plataforma, así que no puede reducirse enviando menos respuestas, y un ítem sin responder se califica como incorrecto porque estaba en la forma.",
    server3:
      "Un ítem que nunca se entregó no puede calificarse. El material de práctica, cuyas respuestas se muestran abiertamente durante el estudio, no tiene entonces ninguna vía hacia un resultado de certificación.",

    continuityHeading: "Una interrupción cuesta tiempo, no el intento",
    continuityLead: "La conectividad es desigual. Una credencial no debería depender de ella.",
    continuity1:
      "Las respuestas se escriben en la plataforma a medida que se dan, no se retienen en el navegador hasta el envío. Si un equipo falla a mitad del examen, el trabajo no se descarta.",
    continuity2:
      "Quien regresa retoma la misma forma, en el mismo orden, con sus propias respuestas en su lugar. Como la forma quedó registrada, no se emite una muestra nueva.",
    continuity3:
      "El reloj está anclado a la hora de inicio del servidor y continúa mientras el candidato está ausente. La interrupción se permite; el tiempo adicional no.",

    securityHeading: "Seguridad de los ítems",
    securityLead: "Lo que protege el significado de la credencial.",
    security1:
      "Si el banco seguro no puede completar el blueprint de un dominio en el idioma solicitado, el examen se rechaza con una explicación en lugar de emitirse incompleto o desbalanceado.",
    security2:
      "La opción múltiple tiene un techo. Las tareas que una pregunta de opción múltiple no puede medir con honestidad se declaran en el análisis y se marcan como no evaluadas, reservadas para simulación. El análisis de tareas muestra exactamente cuáles.",
    security3:
      "Los ítems de práctica y los de examen son bancos separados. Los ítems de examen no están vinculados al motor de estudio, así que ninguna ruta de práctica puede exponer uno.",
    security4:
      "La exposición de ítems - cuánto de un banco revela una sola aplicación y cuánto acumulan los intentos repetidos - se mide en lugar de suponerse.",

    langHeading: "Tres idiomas, una sola medición",
    langLead: "No tres exámenes que se parecen entre sí.",
    langBody:
      "Los ítems traducidos comparten su clave de respuesta y los identificadores de sus opciones con el original, así que un puntaje significa lo mismo en cualquier idioma ofrecido. Un examen de certificación no sustituye otro idioma en silencio: si el banco no puede completar el blueprint en el idioma solicitado, el intento se rechaza.",

    credHeading: "Qué lleva la credencial",
    credLead: "Un puntaje es un número. Una credencial tiene que resistir el escrutinio después.",
    cred1:
      "Se emite en la misma operación que el registro del examen, así que una aprobación no puede existir sin el intento que la respalda.",
    cred2:
      "Lleva sellada la versión del análisis de tareas contra la que se evaluó, así que quien la verifique años después ve el alcance tal como estaba al momento de emisión.",
    cred3:
      "El nombre de la persona y el nombre de la certificación se capturan en la emisión, así que los cambios posteriores nunca reescriben el historial emitido.",
    cred4:
      "Cualquiera puede verificarla en una página pública, desde el código o el QR del certificado, sin contactarnos.",

    notHeading: "Qué no hace este examen",
    notLead: "Dicho con claridad, porque un comprador tiene derecho a saberlo.",
    not1:
      "No es supervisado en este nivel. No hay cámara, ni verificación de identidad, ni grabación de pantalla. El significado de la credencial se apoya en un puntaje de aprobación publicado, un blueprint publicado e ítems extraídos mecánicamente de un banco protegido, no en la vigilancia.",
    not2:
      "No intenta bloquear capturas de pantalla. Ninguna aplicación web puede hacerlo; el sistema operativo controla la pantalla, y una cámara vence cualquier medida que existiera.",
    not3:
      "No intenta bloquear la copia. Esas medidas se eluden con facilidad y rompen la tecnología asistiva, lo que cambiaría accesibilidad real por ninguna seguridad. En su lugar, se registran el tiempo y la interacción por ítem, y un intento cuyo patrón sea inconsistente con el razonamiento puede ser revisado por una persona bajo un proceso documentado.",

    isoHeading: "Alineación con ISO/IEC 17024",
    isoLead:
      "El marco para organismos que certifican personas. Alineación, no acreditación: véase la nota al final.",
    iso1:
      "La competencia se define antes de la evaluación. El análisis de tareas se redacta, se revisa y se publica, y el examen se deriva de él en lugar de armarse primero y describirse después.",
    iso2:
      "El examen mide lo que se declara. Cada ítem se remonta a una tarea declarada, en el nivel declarado de esa tarea, exigido al crear el ítem y no auditado después.",
    iso3:
      "El alcance de la afirmación coincide con el alcance de la medición. Las tareas por encima del techo del formato de pregunta se declaran y se marcan como no evaluadas, así que la credencial no afirma lo que no midió.",
    iso4:
      "Los registros se conservan. Cada examen mantiene su registro a nivel de ítem - qué se entregó, qué se respondió, cuánto tardó cada ítem - y la baja de inscripción archiva en lugar de eliminar.",
    isoNote:
      "Certidemy está diseñada conforme al marco ISO/IEC 17024. No está acreditada bajo él. La acreditación es una evaluación formal por parte de un organismo de acreditación, y afirmarla sería falso hasta que esa evaluación ocurra. Esta distinción se declara aquí porque quien no la encuentra declarada suele asumir la afirmación más fuerte.",

    whyHeading: "Por qué se construyó en lugar de contratarse",
    whyLead: "Cuatro requisitos que ninguna herramienta de evaluación de propósito general satisface.",
    why1:
      "El blueprint tiene que construir el examen, no describirlo. Una forma armada cada vez a partir de pesos de dominio y niveles de tarea declarados es un objeto distinto de un banco de preguntas con un documento al lado.",
    why2:
      "El material de práctica y el de examen deben ser separables a nivel de datos, y el motor de estudio no debe poder alcanzar los ítems de examen. Un banco único no puede expresar eso.",
    why3:
      "La entrega multilingüe tiene que ser una sola medición, no exámenes paralelos. Las claves de respuesta y los identificadores de opción compartidos entre idiomas son una propiedad del modelo del ítem, no algo agregado después.",
    why4:
      "La credencial y su procedencia tienen que pertenecer al organismo certificador. Una herramienta devuelve un puntaje; el sellado de versión, la fidelidad de idioma, la retención y la verificación pública descritas arriba son la certificación.",

    generated: "Generado",
    currentVersion: "Versión vigente",
    blueprintNote: "blueprint calculado",
    page: "Página",
    of: "de",
  },

  "pt-BR": {
    eyebrow: "Como funciona o exame",
    intro:
      "Como este exame é aplicado, o que a plataforma registra enquanto ele acontece e por que foi construído em vez de contratado. Cada mecanismo descrito aqui pode ser verificado contra o blueprint e a análise de tarefas publicados.",
    comingSoon: "Em breve - ainda não aberta para exame",

    paramsHeading: "Este exame",
    pQuestions: "Questões por forma",
    pDuration: "Limite de tempo",
    pPass: "Nota de aprovação",
    pDomains: "Domínios",
    pDeclared: "Tarefas declaradas",
    pExamined: "Tarefas avaliadas",
    pAttempts: "Tentativas por voucher",
    pWindow: "Janela de tentativas",
    pValidity: "Vigência da credencial",
    pLanguages: "Idiomas",
    unlimited: "Ilimitadas",
    months: "meses",
    days: "dias",
    minutes: "minutos",

    chainHeading: "De onde vêm as questões",
    chainLead: "Cada elo é um registro, não um documento que alguém mantém.",
    chainFlow:
      "análise de tarefas  ->  domínios e pesos  ->  tarefas com nível cognitivo  ->  banco de itens  ->  forma montada  ->  forma registrada  ->  nota  ->  credencial",
    chainBody1:
      "A análise de tarefas declara o que uma pessoa certificada é capaz de fazer. Os domínios carregam pesos. Cada tarefa carrega um nível cognitivo, uma criticidade e uma frequência. Os itens são escritos contra tarefas e não podem declarar um nível que sua tarefa não tem.",
    chainBody2:
      "Portanto, o perfil cognitivo do exame é calculado a partir da análise em vez de declarado sobre ela. O blueprint publica o resultado e pode ser comparado com este documento.",

    serverHeading: "O exame é definido pelo servidor",
    serverLead: "Não pelo navegador do candidato.",
    server1:
      "Quando um candidato começa, a plataforma monta uma forma ponderada pelo blueprint e registra exatamente quais itens foram entregues, em que ordem e em que idioma.",
    server2:
      "A correção avalia esse registro. A quantidade de questões é a que a plataforma emitiu, então não pode ser reduzida enviando menos respostas, e um item não respondido é corrigido como incorreto porque estava na forma.",
    server3:
      "Um item que nunca foi entregue não pode ser corrigido. O material de prática, cujas respostas são mostradas abertamente durante o estudo, não tem então nenhum caminho até um resultado de certificação.",

    continuityHeading: "Uma interrupção custa tempo, não a tentativa",
    continuityLead: "A conectividade é desigual. Uma credencial não deveria depender dela.",
    continuity1:
      "As respostas são gravadas na plataforma conforme são dadas, não retidas no navegador até o envio. Se um equipamento falha no meio do exame, o trabalho não é descartado.",
    continuity2:
      "Quem retorna retoma a mesma forma, na mesma ordem, com suas próprias respostas no lugar. Como a forma foi registrada, não é emitida uma nova amostra.",
    continuity3:
      "O relógio está ancorado ao horário de início do servidor e continua enquanto o candidato está ausente. A interrupção é permitida; tempo adicional não.",

    securityHeading: "Segurança dos itens",
    securityLead: "O que protege o significado da credencial.",
    security1:
      "Se o banco seguro não puder preencher o blueprint de um domínio no idioma solicitado, o exame é recusado com uma explicação em vez de emitido incompleto ou desequilibrado.",
    security2:
      "A múltipla escolha tem um teto. As tarefas que uma questão de múltipla escolha não consegue medir com honestidade são declaradas na análise e marcadas como não avaliadas, reservadas para simulação. A análise de tarefas mostra exatamente quais.",
    security3:
      "Itens de prática e itens de exame são bancos separados. Os itens de exame não estão vinculados ao motor de estudo, então nenhum caminho de prática pode expor um deles.",
    security4:
      "A exposição de itens - quanto de um banco uma única aplicação revela e quanto as tentativas repetidas acumulam - é medida em vez de suposta.",

    langHeading: "Três idiomas, uma única medição",
    langLead: "Não três exames que se parecem entre si.",
    langBody:
      "Os itens traduzidos compartilham a chave de resposta e os identificadores de opção com o original, então uma nota significa a mesma coisa em qualquer idioma oferecido. Um exame de certificação não substitui outro idioma silenciosamente: se o banco não puder preencher o blueprint no idioma solicitado, a tentativa é recusada.",

    credHeading: "O que a credencial carrega",
    credLead: "Uma nota é um número. Uma credencial precisa resistir ao escrutínio depois.",
    cred1:
      "É emitida na mesma operação que o registro do exame, então uma aprovação não pode existir sem a tentativa que a sustenta.",
    cred2:
      "Carrega selada a versão da análise de tarefas contra a qual foi avaliada, então quem a verificar anos depois vê o escopo como ele estava na emissão.",
    cred3:
      "O nome da pessoa e o nome da certificação são capturados na emissão, então mudanças posteriores nunca reescrevem o histórico emitido.",
    cred4:
      "Qualquer pessoa pode verificá-la em uma página pública, pelo código ou pelo QR do certificado, sem falar conosco.",

    notHeading: "O que este exame não faz",
    notLead: "Dito com clareza, porque um comprador tem o direito de saber.",
    not1:
      "Não é supervisionado neste nível. Não há câmera, verificação de identidade nem gravação de tela. O significado da credencial se apoia em uma nota de aprovação publicada, um blueprint publicado e itens extraídos mecanicamente de um banco protegido, não em vigilância.",
    not2:
      "Não tenta bloquear capturas de tela. Nenhuma aplicação web consegue; o sistema operacional controla a tela, e uma câmera vence qualquer medida que existisse.",
    not3:
      "Não tenta bloquear a cópia. Essas medidas são facilmente contornadas e quebram a tecnologia assistiva, o que trocaria acessibilidade real por nenhuma segurança. Em vez disso, o tempo e a interação são registrados por item, e uma tentativa cujo padrão seja inconsistente com o raciocínio pode ser revisada por uma pessoa sob um processo documentado.",

    isoHeading: "Alinhamento com a ISO/IEC 17024",
    isoLead:
      "A estrutura para organismos que certificam pessoas. Alinhamento, não acreditação: veja a nota ao final.",
    iso1:
      "A competência é definida antes da avaliação. A análise de tarefas é redigida, revisada e publicada, e o exame é derivado dela em vez de montado primeiro e descrito depois.",
    iso2:
      "O exame mede o que é declarado. Cada item remete a uma tarefa declarada, no nível declarado dessa tarefa, exigido na criação do item e não auditado depois.",
    iso3:
      "O escopo da afirmação coincide com o escopo da medição. As tarefas acima do teto do formato de questão são declaradas e marcadas como não avaliadas, então a credencial não afirma o que não mediu.",
    iso4:
      "Os registros são preservados. Cada exame mantém seu registro em nível de item - o que foi entregue, o que foi respondido, quanto tempo cada item levou - e o cancelamento da inscrição arquiva em vez de excluir.",
    isoNote:
      "A Certidemy é projetada conforme a estrutura ISO/IEC 17024. Ela não é acreditada por ela. A acreditação é uma avaliação formal por um organismo de acreditação, e afirmá-la seria falso até que essa avaliação ocorra. Esta distinção é declarada aqui porque quem não a encontra declarada tende a assumir a afirmação mais forte.",

    whyHeading: "Por que foi construído em vez de contratado",
    whyLead: "Quatro requisitos que nenhuma ferramenta de avaliação de uso geral atende.",
    why1:
      "O blueprint precisa construir o exame, não descrevê-lo. Uma forma montada a cada vez a partir de pesos de domínio e níveis de tarefa declarados é um objeto diferente de um banco de questões com um documento ao lado.",
    why2:
      "O material de prática e o de exame devem ser separáveis no nível dos dados, e o motor de estudo não deve conseguir alcançar os itens de exame. Um banco único não consegue expressar isso.",
    why3:
      "A entrega multilíngue precisa ser uma única medição, não exames paralelos. Chaves de resposta e identificadores de opção compartilhados entre idiomas são uma propriedade do modelo do item, não algo adicionado depois.",
    why4:
      "A credencial e sua procedência precisam pertencer ao organismo certificador. Uma ferramenta devolve uma nota; o selo de versão, a fidelidade de idioma, a retenção e a verificação pública descritas acima são a certificação.",

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

export async function renderEngineBrief(
  data: EngineBriefData,
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

  /** Orphan control: a heading reserves enough of its own section. */
  const heading = (t: string, lead?: string, reserve = 170) => {
    if (y - reserve < FOOT) newPage();
    y -= 6;
    page.drawText(t.toUpperCase(), { x: M, y, size: 9, font: mono, color: ACCENT });
    y -= 9;
    page.drawLine({
      start: { x: M, y },
      end: { x: A4_W - M, y },
      thickness: 0.8,
      color: ACCENT,
    });
    y -= 16;
    if (lead) {
      for (const line of wrap(lead, semi, 10.5, CW)) {
        page.drawText(line, { x: M, y, size: 10.5, font: semi, color: ACCENT_DEEP });
        y -= 14;
      }
      y -= 4;
    }
  };

  const body = (t: string, size = 10) => {
    for (const line of wrap(t, regular, size, CW)) {
      need(size + 5);
      page.drawText(line, { x: M, y, size, font: regular, color: INK_SOFT });
      y -= size + 3.8;
    }
    y -= 6;
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

  // ---- header -------------------------------------------------------------
  //
  // WORDMARK GOES HERE. When the brand PNG lands, use the same block as
  // factsheet.ts - everything below already flows from `y`.
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

  for (const line of wrap(S.intro, regular, 12, CW)) {
    page.drawText(line, { x: M, y, size: 12, font: regular, color: INK_SOFT });
    y -= 16.5;
  }

  if (data.status === "coming_soon") {
    y -= 5;
    page.drawText(S.comingSoon, { x: M, y, size: 9, font: semi, color: ACCENT });
    y -= 9;
  }
  y -= 14;

  // ---- this examination ---------------------------------------------------
  //
  // Numbers first, so every structural claim that follows is anchored to this
  // certification rather than reading as a generic brochure.
  heading(S.paramsHeading, undefined, 200);
  row(S.pQuestions, String(data.numQuestions));
  row(S.pDuration, `${data.examDurationMinutes} ${S.minutes}`);
  row(S.pPass, `${data.passingScorePct}%`);
  row(S.pDomains, String(data.domainCount));
  row(S.pDeclared, String(data.totalTasks));
  row(S.pExamined, String(data.examScopeTasks));
  row(
    S.pAttempts,
    data.maxExamAttempts === null ? S.unlimited : String(data.maxExamAttempts),
  );
  if (data.attemptWindowMonths !== null) {
    row(S.pWindow, `${data.attemptWindowMonths} ${S.months}`);
  }
  if (data.validityDays !== null) {
    row(S.pValidity, `${data.validityDays} ${S.days}`);
  }
  row(S.pLanguages, data.languages.join(", "));
  y -= 6;

  // ---- the chain ----------------------------------------------------------
  heading(S.chainHeading, S.chainLead, 200);
  for (const line of wrap(S.chainFlow, mono, 8, CW)) {
    need(14);
    page.drawText(line, { x: M, y, size: 8, font: mono, color: ACCENT_DEEP });
    y -= 12;
  }
  y -= 8;
  body(S.chainBody1);
  body(S.chainBody2);

  // ---- server authority --------------------------------------------------
  heading(S.serverHeading, S.serverLead, 190);
  bullet(S.server1);
  bullet(S.server2);
  bullet(S.server3);

  // ---- continuity ---------------------------------------------------------
  heading(S.continuityHeading, S.continuityLead, 190);
  bullet(S.continuity1);
  bullet(S.continuity2);
  bullet(S.continuity3);

  // ---- item security ------------------------------------------------------
  heading(S.securityHeading, S.securityLead, 220);
  bullet(S.security1);
  bullet(S.security2);
  bullet(S.security3);
  bullet(S.security4);

  // ---- languages ----------------------------------------------------------
  heading(S.langHeading, S.langLead, 150);
  body(S.langBody);

  // ---- credential ---------------------------------------------------------
  heading(S.credHeading, S.credLead, 200);
  bullet(S.cred1);
  bullet(S.cred2);
  bullet(S.cred3);
  bullet(S.cred4);

  // ---- what it does not do ------------------------------------------------
  //
  // Deliberately BEFORE the 17024 section. A reader who meets the limits first
  // and the framework alignment second reads the alignment as a considered
  // position. The other order reads as a claim being walked back.
  heading(S.notHeading, S.notLead, 220);
  bullet(S.not1);
  bullet(S.not2);
  bullet(S.not3);

  // ---- 17024 --------------------------------------------------------------
  heading(S.isoHeading, S.isoLead, 240);
  bullet(S.iso1);
  bullet(S.iso2);
  bullet(S.iso3);
  bullet(S.iso4);
  y -= 2;
  // The accreditation distinction, in a box, because it is the single sentence
  // most likely to be skimmed past and most damaging to get wrong.
  {
    const lines = wrap(S.isoNote, regular, 9.5, CW - 24);
    const h = lines.length * 13 + 20;
    need(h + 6);
    page.drawRectangle({
      x: M,
      y: y - h + 14,
      width: CW,
      height: h,
      borderColor: ACCENT,
      borderWidth: 0.8,
    });
    let ny = y;
    for (const line of lines) {
      page.drawText(line, { x: M + 12, y: ny, size: 9.5, font: regular, color: INK });
      ny -= 13;
    }
    y = y - h + 6;
  }
  y -= 10;

  // ---- why built ----------------------------------------------------------
  heading(S.whyHeading, S.whyLead, 220);
  bullet(S.why1);
  bullet(S.why2);
  bullet(S.why3);
  bullet(S.why4);

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
