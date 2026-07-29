/**
 * fix-about-claims.mjs
 *
 * Rewrites five keys of the `about` namespace in all three message files so the
 * page stops making unevidenced claims about competitors.
 *
 * WHY. The about page asserted "Their blueprints sit behind paywalls" and
 * "Blueprint hidden behind a paywall". ITIL's syllabus, PMI's Exam Content
 * Outline, ISTQB's syllabi and the Scrum Guide are all free downloads. The claim
 * is largely false, any prospect who has certified in one of those knows it, and
 * a competitor could rebut it in a sentence. "AI ignored entirely" was
 * defensible eighteen months ago and weakens every month.
 *
 * Both are Class D under CLAIMS-POLICY §3: statements about a competitor's
 * practice that we cannot evidence and date.
 *
 * WHAT THE KEYWORD SWEEP MISSED, AND WHY THAT MATTERS. The 2026-07-29 sweep
 * checked every file and the certification tables for accreditation,
 * equivalence, global recognition, psychometric validation and pass-rate
 * language in all three languages, and came back clean. It could never have
 * caught this: the exposure is a false claim made entirely in permitted words.
 * That finding is why CLAIMS-POLICY governs claim TYPES rather than vocabulary.
 *
 * THE REFRAME. The left column stops counting competitors and starts describing
 * an approach - "The old model", not "Most certifications". Describing a method
 * is fair comment; asserting what other organisations charge for is not. old1
 * ("Memorize the framework") and old4 ("Pass, then forget") survive untouched
 * because they describe the approach rather than anyone's business practice.
 *
 * The page does not get weaker. Every removed line is replaced by a Class A
 * claim about us that is true and checkable: we publish the full analysis and
 * blueprint, and every question traces to a task inside them. "We publish ours"
 * cannot be rebutted and says something rarer than "they hide theirs".
 *
 * METHOD. Exact string replacement on the raw file text, not JSON re-encoding -
 * rewriting these files through JSON.stringify would reformat every line and
 * bury a five-key change in a whole-file diff. Each anchor must appear exactly
 * once or the file is left untouched and the run exits non-zero.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\certidemy-web
 *   $env:DRY_RUN="1"; node ..\supabase\scripts\fix-about-claims.mjs
 *   Remove-Item Env:\DRY_RUN; node ..\supabase\scripts\fix-about-claims.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const WEB = "C:/Users/Juan/Documents/certidemy/certidemy-web/messages";
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

/**
 * Per locale: [key, exact current value, replacement].
 * The key is carried only for reporting; matching is on the value, which is
 * unique in these files.
 */
const EDITS = {
  "en.json": [
    [
      "lead",
      "Most certifications still test whether you memorized a framework — and act as though AI never entered the room. Their blueprints sit behind paywalls. Passing proves you crammed, not that you can do the work. Certidemy is our answer: certifications for the age of AI, built in the open, that prove a skill instead of a memory.",
      "A certification should prove you can do the work, not that you memorized a framework the week before. We built ours for the age of AI, and we built it in the open — the full job task analysis and exam blueprint are published, and every question traces to a task inside them.",
    ],
    [
      "problemHeadline",
      "Most certifications are stuck in the last era.",
      "The work changed faster than the way we certify it.",
    ],
    ["contrastOldLabel", "Most certifications", "The old model"],
    ["old2", "Blueprint hidden behind a paywall", "Prepare for the question bank"],
    ["old3", "AI ignored entirely", "AI treated as an optional extra"],
  ],
  "es-419.json": [
    [
      "lead",
      "La mayoría de las certificaciones todavía evalúan si memorizaste un marco de trabajo, y actúan como si la IA nunca hubiera entrado en escena. Sus blueprints están detrás de muros de pago. Aprobar demuestra que estudiaste de memoria, no que sabes hacer el trabajo. Certidemy es nuestra respuesta: certificaciones para la era de la IA, construidas de forma abierta, que demuestran una habilidad y no un recuerdo.",
      "Una certificación debería demostrar que sabes hacer el trabajo, no que memorizaste un marco de trabajo la semana anterior. Construimos la nuestra para la era de la IA, y la construimos de forma abierta: el análisis de tareas y el blueprint del examen son públicos, y cada pregunta se remonta a una tarea dentro de ellos.",
    ],
    [
      "problemHeadline",
      "La mayoría de las certificaciones se quedaron en la era anterior.",
      "El trabajo cambió más rápido que la forma de certificarlo.",
    ],
    ["contrastOldLabel", "La mayoría de las certificaciones", "El modelo anterior"],
    [
      "old2",
      "Blueprint oculto tras un muro de pago",
      "Prepararse para el banco de preguntas",
    ],
    ["old3", "La IA ignorada por completo", "La IA como un extra opcional"],
  ],
  "pt-BR.json": [
    [
      "lead",
      "A maioria das certificações ainda avalia se você memorizou um framework — e age como se a IA nunca tivesse entrado em cena. Seus blueprints ficam atrás de muros de pagamento. Ser aprovado prova que você decorou, não que sabe fazer o trabalho. A Certidemy é a nossa resposta: certificações para a era da IA, construídas de forma aberta, que provam uma habilidade e não uma lembrança.",
      "Uma certificação deveria provar que você sabe fazer o trabalho, não que decorou um framework na semana anterior. Construímos a nossa para a era da IA, e construímos de forma aberta: a análise de tarefas e o blueprint do exame são públicos, e cada questão remete a uma tarefa dentro deles.",
    ],
    [
      "problemHeadline",
      "A maioria das certificações ficou presa na era anterior.",
      "O trabalho mudou mais rápido do que a forma de certificá-lo.",
    ],
    ["contrastOldLabel", "A maioria das certificações", "O modelo anterior"],
    [
      "old2",
      "Blueprint escondido atrás de um muro de pagamento",
      "Estudar para o banco de questões",
    ],
    ["old3", "A IA totalmente ignorada", "A IA como um extra opcional"],
  ],
};

let ok = 0;
let failed = 0;

console.log(`About-page claims ${DRY_RUN ? "[DRY RUN]" : "[LIVE]"}\n`);

for (const [file, edits] of Object.entries(EDITS)) {
  const path = `${WEB}/${file}`;
  if (!existsSync(path)) {
    console.log(`FAIL ${file}: not found at ${path}`);
    failed += edits.length;
    continue;
  }

  console.log(`== ${file} ==`);
  let text = readFileSync(path, "utf8");
  let touched = 0;

  for (const [key, from, to] of edits) {
    const hits = text.split(from).length - 1;
    if (hits === 0) {
      console.log(`  FAIL ${key}: anchor not found`);
      failed++;
      continue;
    }
    if (hits > 1) {
      console.log(`  FAIL ${key}: anchor appears ${hits} times, refusing to guess`);
      failed++;
      continue;
    }
    text = text.replace(from, to);
    touched++;
    ok++;
    console.log(`  ok   ${key}`);
    if (DRY_RUN) {
      console.log(`       - ${from.slice(0, 90)}${from.length > 90 ? "..." : ""}`);
      console.log(`       + ${to.slice(0, 90)}${to.length > 90 ? "..." : ""}`);
    }
  }

  if (!DRY_RUN && touched > 0) {
    // No BOM. A BOM in a messages file breaks the JSON import.
    writeFileSync(path, text, { encoding: "utf8" });
    console.log(`  wrote ${touched} change(s)`);
  }
  console.log("");
}

console.log(`${DRY_RUN ? "would change" : "changed"} ${ok}, failed ${failed}`);
if (failed > 0) {
  console.log("A failed anchor means the copy was edited since this script was written.");
  console.log("Re-read the key and update the EDITS entry rather than forcing it.");
  process.exit(1);
}
if (!DRY_RUN) {
  console.log("\nRun `npm run build` before committing - these files are typed by next-intl.");
}
