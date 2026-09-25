#!/usr/bin/env node
/**
 * apply-batch-hand-edits.mjs -- the reviewer's corrections to BATCH-MOVED-ENGLISH.json.
 *
 * HAND-EDIT, NOT REGENERATE, AND THE DISTINCTION IS THE WHOLE REASON THIS FILE
 * EXISTS. The generator is not deterministic: two consecutive runs of the same
 * command produced different text and different gate outcomes while this batch
 * was being prepared. Re-running it to fix four defects would replace fourteen
 * rows a human has read with fourteen nobody has.
 *
 * So every correction below is an EXACT STRING REPLACEMENT with a one-hit
 * assertion. If any anchor does not match exactly once, nothing is written --
 * because an anchor that has drifted means the file is not the file that was
 * reviewed.
 *
 * ============ WHAT THE REVIEW FOUND, AND WHAT IT SAYS ABOUT THE PIN =========
 *
 * Three of the four defects are ONE defect: `convem que` placed wrong.
 *
 * The modal pin said `should -> convem que`. In Portuguese that is not a word
 * swap, it is a CONSTRUCTION -- `Convem que [subject] [subjunctive]`, opening
 * the clause. Dropped into the modal's slot it produces ungrammatical
 * sentences, and it did so three times: twice inside quotations attributed to
 * ISO, once in our own prose where the pin should never have applied at all.
 *
 * The gate passed all three because it checked that the right TOKEN was
 * present. It was. The property is PLACEMENT, and a token test cannot see it --
 * the same shape as every other check in this repository that asked about a
 * component of the property instead of the property.
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "BATCH-MOVED-ENGLISH.json";
const APPLY = process.argv.includes("--apply");
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && a !== "--apply") { console.error("Unrecognised flag: " + a); process.exit(2); }
}

const batch = JSON.parse(readFileSync(FILE, "utf8"));
const row = (slug, language, kind) => {
  const hits = batch.rows.filter((r) => r.slug === slug && r.language === language && (!kind || r.kind === kind));
  if (hits.length !== 1) throw new Error(slug + "/" + language + ": " + hits.length + " rows");
  return hits[0];
};

/* Accented text is authored here and reaches the file through fs, never through
 * a shell. Four transport surprises this week say that matters. */
const EDITS = [
  /* ---- 1.1 to 1.3: `convem que` is a construction, not a modal slot ---- */
  { why: "1.1 convem que must open the clause; and audit evidence is a mass noun in pt",
    slug: "isms-ia-03-02-what-the-sample-supports", language: "pt-BR", field: "to_block",
    from: "> As evidências de auditoria **convém que sejam verificáveis**.",
    to: "> **Convém que** a evidência de auditoria **seja verificável**." },

  { why: "1.2 our own prose, not a quotation -- the pin should never have applied",
    slug: "isms-ia-05-03-the-statement-that-survives", language: "pt-BR", field: "add_paragraph",
    from: "duas coisas que um relatório **convém que** contenha",
    to: "duas coisas que um relatório **deveria** conter" },

  { why: "1.3 convem que must open the clause",
    slug: "isms-ia-03-01-degree-of-verification", language: "pt-BR", field: "to_block",
    from: "> Somente informações que possam ser submetidas a **algum grau de verificação** convém que sejam aceitas como evidência de auditoria.",
    to: "> **Convém que** somente informações que possam ser submetidas a **algum grau de verificação** sejam aceitas como evidência de auditoria." },

  /* ---- 1.4: a CIA term used for something that is not a CIA property ---- */
  { why: "1.4 integridad is INTEGRITY in an ISMS course; completeness check is completitud",
    slug: "isms-ia-04-03-the-whole-of-clause-6", language: "es-419", field: "add_paragraph",
    from: "como verificación de integridad",
    to: "como verificación de completitud" },

  /* ---- 3: rewords. Correct already, but they read badly. ---- */
  { why: "3.1 `por lo que lo que` stutters",
    slug: "isms-ia-03-02-what-the-sample-supports", language: "es-419", field: "add_paragraph",
    from: "por lo que lo que el equipo examina",
    to: "de modo que lo que el equipo examina" },

  { why: "3.2 natural adjective order; the model moved `posibles` to keep the bold on one word",
    slug: "isms-ia-04-03-the-whole-of-clause-6", language: "es-419", field: "to_block",
    from: "una lista de controles de seguridad de la información **posibles**",
    to: "una lista de **posibles** controles de seguridad de la información" },

  { why: "3.3 the same, in pt",
    slug: "isms-ia-04-03-the-whole-of-clause-6", language: "pt-BR", field: "to_block",
    from: "uma lista de controles de segurança da informação **possíveis**",
    to: "uma lista de **possíveis** controles de segurança da informação" },

  { why: "3.4 the NOTE belongs to the clause, not the clause to the NOTE",
    slug: "isms-ia-04-03-the-whole-of-clause-6", language: "es-419", field: "add_paragraph",
    from: "El apartado 6.1.3, NOTA 2 continúa dirigiendo a los usuarios al Anexo A",
    to: "La NOTA 2 del apartado 6.1.3 remite además a los usuarios al Anexo A" },

  { why: "3.5 the same, in pt",
    slug: "isms-ia-04-03-the-whole-of-clause-6", language: "pt-BR", field: "add_paragraph",
    from: "A Seção 6.1.3, NOTA 2 orienta os usuários",
    to: "A NOTA 2 da Seção 6.1.3 orienta ainda os usuários" },
];

/* The two Scrum rewords live inside the `edits` pair arrays, not in a field. */
const TERM_EDITS = [
  { why: "3.6 `que sirve, que elimina` stacks two relatives",
    slug: "05-03-working-with-scrum-master", language: "es-419",
    from: "El SM es un verdadero líder que sirve, que elimina",
    to: "El SM es un verdadero líder que sirve y elimina" },
  { why: "3.7 the same, in pt",
    slug: "05-03-working-with-scrum-master", language: "pt-BR",
    from: "O SM é um verdadeiro líder que serve, que remove",
    to: "O SM é um verdadeiro líder que serve e remove" },
];

let bad = 0;
console.log("");
console.log("HAND EDITS -- " + (EDITS.length + TERM_EDITS.length) + " correction(s) from the review");
for (const e of EDITS) {
  const r = row(e.slug, e.language, "lesson_span");
  const cur = r[e.field] || "";
  const n = cur.split(e.from).length - 1;
  if (n !== 1) { console.log("  MISS  " + e.why + "  -- anchor matched " + n + " time(s)"); bad++; continue; }
  if (APPLY) r[e.field] = cur.replace(e.from, e.to);
  console.log("  ok    " + e.why);
}
for (const e of TERM_EDITS) {
  const r = row(e.slug, e.language, "lesson_terms");
  const hits = r.edits.filter((p) => p[1] === e.from);
  if (hits.length !== 1) { console.log("  MISS  " + e.why + "  -- " + hits.length + " matching edit pair(s)"); bad++; continue; }
  if (APPLY) hits[0][1] = e.to;
  console.log("  ok    " + e.why);
}

if (bad) {
  console.log("");
  console.log("ABORT: " + bad + " anchor(s) did not match exactly once. NOTHING WRITTEN.");
  console.log("An anchor that has drifted means this is not the file that was reviewed.");
  process.exitCode = 1;
} else if (!APPLY) {
  console.log("");
  console.log("All " + (EDITS.length + TERM_EDITS.length) + " anchors matched exactly once. Re-run with --apply.");
} else {
  batch.hand_edited = {
    at: "2026-09-24", by: "review of PAIRED-SAMPLE-BATCH.md",
    corrections: EDITS.length + TERM_EDITS.length,
    note: "Hand-edited, NOT regenerated. The generator is not deterministic, so a " +
          "re-run would replace reviewed text with unreviewed text.",
  };
  writeFileSync(FILE, JSON.stringify(batch, null, 2), "utf8");
  console.log("");
  console.log("WROTE " + FILE + ". Re-run every gate against it before --from.");
}
