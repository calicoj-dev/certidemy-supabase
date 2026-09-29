#!/usr/bin/env node
/**
 * judge-b103-cluster.mjs -- print the 7 task-3.5 items anchored in 42001 B.10.3 so the director's rule
 * can be applied per item and SHOWN, not summarised.
 *
 * READ-ONLY, no flags, no writes, no model calls.
 *
 * ============ THE RULE, VERBATIM ============
 *
 *   "An item is DROPPED if its KEY or stem asserts the standard requires or mandates B-guidance
 *    content. It is KEPT if the verb is the organization's own action."
 *
 * 65ee65c8 is the example of a drop ("must ... document integration"); 04816f41 of a keep ("require the
 * supplier..."). The distinction is WHOSE obligation the verb expresses: the standard imposing something,
 * or the organization acting toward its supplier.
 *
 * This prints the evidence -- the stem, the key, and every deontic verb found in each with its
 * surrounding words -- and proposes a verdict. The proposal is mechanical and stated as such: it is a
 * candidate for a human to confirm, and the point of printing the surroundings is that the rule turns on
 * WHO the verb binds, which no word list can see. A verb list alone is the lexical-proxy trap.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";
import { requireKey, getAll } from "./_pg.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const surv = JSON.parse(readFileSync(join(ROOT, "AIMSF-SURVIVORS.json"), "utf8"));
const merged = JSON.parse(readFileSync(join(ROOT, "ANCHOR-OR-FLAG-AIMS-F-merged.json"), "utf8"));
const byPrefix = new Map(merged.items.map((it) => [it.prefix, it]));

const cluster = (surv.provisional_ids || []).filter((p) => {
  const it = byPrefix.get(p);
  return it && it.task === "3.5" && ((it.anchor || {}).clause === "B.10.3");
});
console.log("task 3.5 items anchored in B.10.3: " + cluster.length);

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F");
const live = await getAll(KEY, "quiz_questions?select=id,question_text,options,correct_answer,explanation" +
  "&certification_id=eq." + certs[0].id + "&language=eq.en&order=id");
const rowOf = (p) => live.find((r) => String(r.id).startsWith(p));

/* the standard imposing vs the organization acting: the SUBJECT of the deontic verb is the whole
 * question, so the surrounding words are printed and a proposal is offered, never a silent verdict */
const DEONTIC = /\b(must|shall|mandate[sd]?|require[sd]?|requirement|obliged?|has to|have to)\b/gi;
const STANDARD_SUBJECT =
  /\b(the standard|iso\/?iec\s*42001|42001|the document|annex\s*b|b\.10\.3|clause)\b[^.]{0,60}$/i;

const out = [];
for (const p of cluster) {
  const row = rowOf(p);
  const it = byPrefix.get(p);
  const keyIds = Array.isArray(row.correct_answer) ? row.correct_answer : [row.correct_answer];
  const keyText = (row.options.find((o) => keyIds.includes(o.id)) || {}).text || "";
  const stem = String(row.question_text || "");
  console.log("\n================================================ " + p);
  console.log("STEM: " + stem.replace(/\s+/g, " "));
  console.log("KEY : " + String(keyText).replace(/\s+/g, " "));
  const findings = [];
  for (const [field, text] of [["stem", stem], ["key", keyText]]) {
    const t = String(text);
    for (const m of t.matchAll(DEONTIC)) {
      const lead = t.slice(Math.max(0, m.index - 70), m.index).replace(/\s+/g, " ");
      const tail = t.slice(m.index, m.index + 60).replace(/\s+/g, " ");
      const standardIsSubject = STANDARD_SUBJECT.test(lead);
      findings.push({ field, verb: m[0], lead, tail, standardIsSubject });
      console.log("  " + field + "  " + JSON.stringify(m[0]) +
        (standardIsSubject ? "   <- the STANDARD looks like the subject" : "   (subject looks like the organization)"));
      console.log("        ..." + lead + " [" + m[0] + "] " + tail.slice(m[0].length));
    }
  }
  if (!findings.length) console.log("  no deontic verb in the stem or the key");
  const proposal = findings.some((f) => f.standardIsSubject) ? "DROP" : "KEEP";
  console.log("  PROPOSED: " + proposal + "   (" + findings.length + " deontic verb(s) examined)");
  out.push({ prefix: p, task: it.task, clause: (it.anchor || {}).clause, stem, key: keyText,
    deontic: findings, proposed: proposal });
}
const d = out.filter((x) => x.proposed === "DROP").length;
console.log("\nproposed: " + d + " DROP, " + (out.length - d) + " KEEP");
console.log("The director's two named cases are the control:");
for (const p of ["65ee65c8", "04816f41"]) {
  const r = out.find((x) => x.prefix === p);
  console.log("  " + p + "  proposed " + (r ? r.proposed : "(not in cluster)") +
    "   expected " + (p === "65ee65c8" ? "DROP" : "KEEP"));
}
const ctrl = out.find((x) => x.prefix === "65ee65c8");
const ctrl2 = out.find((x) => x.prefix === "04816f41");
if (!ctrl || ctrl.proposed !== "DROP" || !ctrl2 || ctrl2.proposed !== "KEEP") {
  console.error("\nThe proposal disagrees with a named case, so the mechanical reading is NOT reliable " +
    "here and every verdict below is a candidate for a human, not a result.");
  process.exitCode = 1;
}
writeFileSync(join(ROOT, "B103-CLUSTER-VERDICTS.json"), JSON.stringify({
  rule: "DROPPED if the KEY or stem asserts the standard requires or mandates B-guidance content; " +
    "KEPT if the verb is the organization's own action.",
  named_cases: { "65ee65c8": "DROP", "04816f41": "KEEP" },
  items: out,
}, null, 1) + String.fromCharCode(10), "utf8");
console.log("wrote B103-CLUSTER-VERDICTS.json");
