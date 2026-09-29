#!/usr/bin/env node
/**
 * sweep-42006-extension-claim.mjs -- find every place we claim ISO/IEC 42006 is NOT an extension of
 * ISO/IEC 17021-1, which is false: 42006 specifies additional requirements TO 17021-1.
 *
 * READ-ONLY. No flags, no writes, no model calls. Unknown flags exit 2.
 *
 * Ruled 2026-09-29 from aa74ddac, whose explanation carries the claim. AIMS-F and AIMS-IA, items,
 * concepts and lessons, all three languages.
 *
 * ============ A NEGATIVE CLAIM NEEDS A POSITIVE CONTROL ============
 *
 * "Nothing else says this" is verified by FAILING to find something, which is exactly what a broken
 * search does. So the sweep asserts it CAN find aa74ddac's own explanation first. If that control fails
 * the absence result is discarded rather than reported -- this repository has printed a confident
 * "0 hits" from a dead detector before.
 *
 * ============ AND THE PATTERN IS TWO-SIDED, BECAUSE THE DEFECT IS A NEGATION ============
 *
 * The false claim is a NEGATED relationship: "not an extension of", "does not extend", "independent of",
 * "separate from", "stands alone". A search for "42006" and "17021" together finds every CORRECT mention
 * too -- and the correct ones are the majority, since 42006 cannot be discussed without 17021-1. So
 * co-occurrence is the CANDIDATE filter and the negation is the finding, and every candidate is printed
 * with its sentence so a human decides. A count here would be worthless: this repository's own rule is
 * that a lexical class is a draft until someone reads its members.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { requireKey, getAll } from "./_pg.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const CERTS = ["AIMS-F", "AIMS-IA"];

/* 42006 and 17021 in the same field: the candidate filter */
const MENTIONS_BOTH = (t) => /42006/i.test(t) && /17021/i.test(t);
/* the negation, on the relationship. Built with alternation rather than one loose regex so each hit
 * says WHICH form it matched -- a hit with no named form is not actionable. */
const NEGATIONS = [
  ["not an extension", /\bnot\b[^.]{0,40}\bextension\b/i],
  ["does not extend", /\b(does not|doesn't|do not|don't)\b[^.]{0,30}\bextend/i],
  ["not based on", /\bnot\b[^.]{0,30}\b(based on|built on|derived from)\b/i],
  ["independent of", /\bindependent(ly)?\s+(of|from)\b/i],
  ["separate from", /\bseparate\b[^.]{0,20}\bfrom\b/i],
  ["stands alone / standalone", /\b(stands?\s+alone|stand-?alone|self-?contained)\b/i],
  ["replaces / supersedes", /\b(replaces?|supersedes?|instead of)\b/i],
  ["unrelated to", /\bunrelated\b/i],
  ["no additional requirements", /\bno\b[^.]{0,30}\badditional requirements?\b/i],
];
const negationsIn = (t) => NEGATIONS.filter(([, re]) => re.test(t)).map(([name]) => name);

const KEY = requireKey(HERE);
const certs = (await getAll(KEY, "certifications?select=id,code&order=code"))
  .filter((c) => CERTS.includes(c.code));
const certIds = new Set(certs.map((c) => c.id));
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
console.log("certifications: " + certs.map((c) => c.code).join(", "));

const rows = [];
const push = (surface, cert, lang, id, field, text) =>
  rows.push({ surface, cert, lang, id: String(id).slice(0, 8), field, text: String(text) });

/* ---- items: every translated text field, all three languages ---- */
const items = await getAll(KEY, "quiz_questions?select=id,certification_id,language,question_text," +
  "options,explanation,status,pool,retired_at&order=id");
let nItems = 0;
for (const q of items) {
  if (!certIds.has(q.certification_id)) continue;
  nItems++;
  const fields = [["question_text", q.question_text], ["explanation", q.explanation]];
  for (const [i, o] of (Array.isArray(q.options) ? q.options : []).entries()) {
    fields.push(["options[" + i + "]", (o && o.text) || ""]);
  }
  for (const [f, t] of fields) {
    if (t && MENTIONS_BOTH(t)) push("item", codeOf.get(q.certification_id), q.language, q.id, f, t);
  }
}

/* ---- concepts: English on the concept, translations in concept_translations ---- */
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code&order=id"))
  .filter((t) => certIds.has(t.certification_id));
const taskIds = new Set(tasks.map((t) => t.id));
const certOfTask = new Map(tasks.map((t) => [t.id, t.certification_id]));
const tcs = (await getAll(KEY, "task_concepts?select=task_id,concept_id&order=task_id,concept_id"))
  .filter((r) => taskIds.has(r.task_id));
const conceptCert = new Map();
for (const r of tcs) conceptCert.set(r.concept_id, certOfTask.get(r.task_id));
const concepts = (await getAll(KEY, "concepts?select=id,slug,name,description&order=id"))
  .filter((c) => conceptCert.has(c.id));
for (const c of concepts) {
  for (const [f, t] of [["name", c.name], ["description", c.description]]) {
    if (t && MENTIONS_BOTH(t)) push("concept", codeOf.get(conceptCert.get(c.id)), "en", c.id, f, t);
  }
}
const conceptIds = new Set(concepts.map((c) => c.id));
const cts = (await getAll(KEY,
  "concept_translations?select=concept_id,language,name,description&order=concept_id,language"))
  .filter((r) => conceptIds.has(r.concept_id));
for (const r of cts) {
  for (const [f, t] of [["name", r.name], ["description", r.description]]) {
    if (t && MENTIONS_BOTH(t)) {
      push("concept", codeOf.get(conceptCert.get(r.concept_id)), r.language, r.concept_id, f, t);
    }
  }
}

/* ---- lessons: title and body, all languages ----
 * `lessons` carries no certification_id: it links through module_id -> modules.certification_id.
 * Selecting the absent column 400'd, which is the loud half of this mistake. */
const modules = await getAll(KEY, "modules?select=id,certification_id&order=id");
const certOfModule = new Map(modules.map((m) => [m.id, m.certification_id]));
/* Filtered SERVER-SIDE by module: 2,208 lesson bodies average ~13.7k characters and
 * selecting them all cancels at 57014. The in.() list is bounded by two certifications'
 * modules, so this is a SAFE-SCALAR read rather than an unpaged one. */
const myModules = modules.filter((m) => certIds.has(m.certification_id)).map((m) => m.id);
if (!myModules.length) throw new Error("no modules for " + CERTS.join(", "));
const lessons = await getAll(KEY,
  "lessons?select=id,module_id,language,slug,title,content_md&module_id=in.(" +
  myModules.join(",") + ")&order=id");
for (const l of lessons) {
  for (const [f, t] of [["title", l.title], ["content_md", l.content_md]]) {
    if (t && MENTIONS_BOTH(t)) {
      push("lesson", codeOf.get(certOfModule.get(l.module_id)), l.language, l.id, f, t);
    }
  }
}

console.log("scanned: " + nItems + " items, " + concepts.length + " concepts (+" + cts.length +
  " translations), " + lessons.length + " lessons");
console.log("fields mentioning BOTH 42006 and 17021: " + rows.length);

/* ---- THE POSITIVE CONTROL: aa74ddac's own explanation must be found ---- */
const control = rows.find((r) => r.id === "aa74ddac" && r.field === "explanation");
console.log("");
if (!control) {
  console.error("POSITIVE CONTROL FAILED: aa74ddac's explanation was not found by this sweep, so its");
  console.error("absence results say nothing. Discarding the verdict rather than reporting 0 hits --");
  console.error("failing to find something is exactly what a broken search does.");
  process.exitCode = 2;
} else {
  console.log("positive control: aa74ddac's explanation FOUND, so the sweep can see the defect.");
  console.log("  negation forms matched in it: " + (negationsIn(control.text).join(", ") || "NONE"));
  if (!negationsIn(control.text).length) {
    console.error("  ...but NO negation form matched the known-false text, so the negation patterns");
    console.error("  cannot detect the very claim they were written for. Verdict discarded.");
    process.exitCode = 2;
  }
}

/* ---- the members, printed ---- */
const hits = rows.filter((r) => negationsIn(r.text).length);
console.log("\ncandidates carrying a NEGATED relationship: " + hits.length + " of " + rows.length);
for (const r of hits) {
  const forms = negationsIn(r.text);
  const sent = (String(r.text).match(/[^.]*4200?6[^.]*\./) || [String(r.text).slice(0, 260)])[0];
  console.log("\n  " + r.surface + "  " + r.cert + "  " + r.lang + "  " + r.id + "  " + r.field);
  console.log("    forms: " + forms.join(", "));
  console.log("    " + sent.replace(/\s+/g, " ").trim().slice(0, 300));
}
const clean = rows.filter((r) => !negationsIn(r.text).length);
console.log("\n" + clean.length + " field(s) mention both and carry NO negation -- listed so the");
console.log("absence is auditable rather than assumed:");
for (const r of clean) console.log("  " + r.surface + " " + r.cert + " " + r.lang + " " + r.id + " " + r.field);

writeFileSync(join(ROOT, "SWEEP-42006-EXTENSION.json"), JSON.stringify({
  claim_that_is_false: "ISO/IEC 42006 is not an extension of ISO/IEC 17021-1",
  the_truth: "ISO/IEC 42006 specifies additional requirements TO ISO/IEC 17021-1",
  certifications: CERTS,
  scanned: { items: nItems, concepts: concepts.length, concept_translations: cts.length,
    lessons: lessons.length },
  mention_both: rows.length,
  positive_control: { prefix: "aa74ddac", found: Boolean(control),
    forms: control ? negationsIn(control.text) : [] },
  hits: hits.map((r) => ({ ...r, forms: negationsIn(r.text) })),
  mention_both_no_negation: clean.map((r) => ({ surface: r.surface, cert: r.cert, lang: r.lang,
    id: r.id, field: r.field })),
}, null, 1) + String.fromCharCode(10), "utf8");
console.log("\nwrote SWEEP-42006-EXTENSION.json");
