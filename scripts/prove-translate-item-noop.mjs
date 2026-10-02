#!/usr/bin/env node
/**
 * PROMPT-104 s3a: prove lib/translate-item.mjs is a NO-OP for its two former callers.
 *
 * The OLD inline bodies are reproduced here VERBATIM from gen-cert-secure.mjs and
 * backfill-practice.mjs as they stood at d400255, and compared byte-for-byte against the module over
 * a fixed English item. A copy in a proof is the one place a second copy is correct: it is the
 * BEFORE, and it is what makes "unchanged" a measurement rather than a claim.
 *
 * READ-ONLY. Unknown flags exit 2.
 */
import { graftTranslation, translateUser, translateItemControls } from "./lib/translate-item.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". This script is READ-ONLY and takes none.");
  process.exit(2);
}

/* ---- OLD, verbatim from gen-cert-secure.mjs @ d400255 ---- */
function oldGraft(enQ, tr) {
  if (!tr || typeof tr !== "object") return null;
  if (typeof tr.question_text !== "string" || tr.question_text.length < 5) return null;
  if (typeof tr.explanation !== "string" || tr.explanation.length < 3) return null;
  if (!Array.isArray(tr.options)) return null;
  const trById = new Map(tr.options.filter((o) => o && o.id).map((o) => [o.id, o.text]));
  const options = [];
  for (const o of enQ.options) {
    const text = trById.get(o.id);
    if (typeof text !== "string" || text.length === 0) return null;
    options.push({ id: o.id, text });
  }
  return {
    question_text: tr.question_text,
    question_type: enQ.question_type,
    options,
    correct_answer: enQ.correct_answer,
    explanation: tr.explanation,
    difficulty: enQ.difficulty,
  };
}
function oldTranslateUser(enQuestions) {
  const payload = enQuestions.map((q) => ({
    question_text: q.question_text,
    options: q.options.map((o) => ({ id: o.id, text: o.text })),
    explanation: q.explanation,
  }));
  return `Translate these ${payload.length} questions:\n\n${JSON.stringify(payload, null, 2)}\n\nReturn the JSON array now.`;
}

/* ---- the fixed item, and every refusal case, so the proof covers both directions ---- */
const EN = {
  question_text: "An organization is planning its AI management system internal audits. What does the standard require?",
  question_type: "single_choice",
  options: [
    { id: "a", text: "An audit programme covering frequency, methods and responsibilities" },
    { id: "b", text: "A single annual audit of every control" },
    { id: "c", text: "A register of auditor qualifications only" },
    { id: "d", text: "A management review of the audit results" },
  ],
  correct_answer: ["a"],
  explanation: "Clause 9.2.2 requires the organization to plan and maintain an audit programme.",
  difficulty: 4,
};
const CASES = [
  ["a good translation, options REORDERED", {
    question_text: "Una organizacion planifica sus auditorias internas. Que exige la norma?",
    options: [
      { id: "c", text: "Solo un registro de calificaciones de auditores" },
      { id: "a", text: "Un programa de auditoria con frecuencia, metodos y responsabilidades" },
      { id: "d", text: "Una revision por la direccion de los resultados" },
      { id: "b", text: "Una unica auditoria anual de todos los controles" },
    ],
    explanation: "El apartado 9.2.2 exige planificar y mantener un programa de auditoria.",
  }],
  ["null", null],
  ["not an object", "a string"],
  ["missing question_text", { explanation: "xxx", options: [{ id: "a", text: "x" }] }],
  ["question_text too short", { question_text: "abcd", explanation: "xxx", options: [{ id: "a", text: "x" }] }],
  ["missing explanation", { question_text: "a long enough question text", options: [{ id: "a", text: "x" }] }],
  ["explanation too short", { question_text: "a long enough question text", explanation: "xx", options: [{ id: "a", text: "x" }] }],
  ["options not an array", { question_text: "a long enough question text", explanation: "xxx", options: "nope" }],
  ["an option id missing", { question_text: "a long enough question text", explanation: "xxx",
    options: [{ id: "a", text: "x" }, { id: "b", text: "y" }, { id: "c", text: "z" }] }],
  ["an option text empty", { question_text: "a long enough question text", explanation: "xxx",
    options: [{ id: "a", text: "x" }, { id: "b", text: "y" }, { id: "c", text: "z" }, { id: "d", text: "" }] }],
  ["an option id the English lacks", { question_text: "a long enough question text", explanation: "xxx",
    options: [{ id: "a", text: "x" }, { id: "b", text: "y" }, { id: "c", text: "z" }, { id: "d", text: "w" }, { id: "e", text: "v" }] }],
];

let diffs = 0, compared = 0;
console.log("NO-OP PROOF: lib/translate-item.mjs against the OLD inline bodies");
console.log("");
for (const [label, tr] of CASES) {
  const a = JSON.stringify(oldGraft(EN, tr));
  const b = JSON.stringify(graftTranslation(EN, tr));
  compared++;
  const same = a === b;
  if (!same) { diffs++; console.log("  DIFFERS  graftTranslation: " + label); console.log("    old " + String(a).slice(0, 140)); console.log("    new " + String(b).slice(0, 140)); }
  else console.log("  identical  graftTranslation: " + label + "   -> " + (b === "null" ? "refused (null)" : "grafted"));
}
/* and the prompt text, byte for byte, for one and for several items */
for (const [label, list] of [["one item", [EN]], ["three items", [EN, EN, EN]]]) {
  const a = oldTranslateUser(list), b = translateUser(list);
  compared++;
  if (a !== b) { diffs++; console.log("  DIFFERS  translateUser: " + label + "  (" + a.length + " vs " + b.length + " chars)"); }
  else console.log("  identical  translateUser: " + label + "   " + b.length + " chars, byte for byte");
}

/* A PROOF OVER NOTHING IS NOT A PROOF, and at least one case must GRAFT and one must REFUSE --
 * twelve refusals and no graft would compare two functions that both return null. */
const grafted = CASES.filter(([, tr]) => graftTranslation(EN, tr) !== null).length;
const refused = CASES.length - grafted;
console.log("");
console.log("  compared        " + compared + " case(s)");
console.log("  of which graft  " + grafted + "   refuse  " + refused);
console.log("  byte differences " + diffs);
const ctl = translateItemControls();
console.log("  module controls " + ctl.examined + " case(s), " + ctl.fails.length + " fail");
for (const f of ctl.fails) console.log("     FAIL " + f);
if (!compared || !grafted || !refused) { console.error("VACUOUS: the proof must contain at least one graft and one refusal."); process.exitCode = 2; }
else if (diffs || ctl.fails.length) { console.error("NOT A NO-OP."); process.exitCode = 2; }
else console.log("\nNO-OP CONFIRMED: byte-identical on every case, both directions.");
