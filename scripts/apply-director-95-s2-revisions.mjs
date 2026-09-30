#!/usr/bin/env node
/**
 * apply-director-95-s2-revisions.mjs -- the three PROMPT-95 s2 revisions, and the two rejections.
 *
 * `--apply` writes the revised artifact. DRY BY DEFAULT, printing every edit as a before/after. Unknown flags
 * exit 2. It writes a FILE, never the database: the revised items are re-gated by the generator's `--from`,
 * so this script's only job is to produce the artifact the gates then judge.
 *
 * ============ THE RULING ============
 *
 *   REJECT   c590b702 (4.1) -- anchored in A.6.2, a container, and its options are Annex A category numbers,
 *                              so it is a recall item in disguise.
 *   REJECT   43882b06 (5.5) -- a near-duplicate of c45a02f1 (1.1): same clause 3.4, same question, weaker
 *                              distractors.
 *   REVISE   3d1d332c        -- the stem rewrite the clause-number gate proposed.
 *   REVISE   b25f378f (5.1)  -- option B's text is IDENTICAL to the key of dfc8a1bf in the same task.
 *   REVISE   6984516f        -- explanation only: "instead" becomes "also".
 *
 * A REJECTION IS RECORDED HERE AND ENFORCED AT THE INSERT. This script writes no rejection into the source
 * artifacts, because a verdict belongs with the insert that acts on it; what it does is assert that both ids
 * EXIST and are survivors, so a typo in an id cannot silently reject nothing. The insert path reads this
 * file's `rejected` list.
 *
 * ============ EDIT THE NAMED FIELDS AND NOTHING ELSE, ASSERTED ============
 *
 * For every revised item, each field NOT named is compared byte-for-byte against the original and the run
 * aborts on any difference. A revision script that quietly reformatted an option is indistinguishable from
 * one that did its job -- and every regenerated word is an unreviewed word.
 *
 * Option edits address an option BY ITS CURRENT TEXT, never by index, so a reordered artifact cannot rewrite
 * the wrong option. (The balanced-order pass reorders options at insert; this runs before it, but the rule
 * costs nothing and the alternative fails silently.)
 *
 * ============ THE GATE PROPOSED NO REWRITE, SO I AUTHORED ONE AND SAY SO ============
 *
 * The ruling says *"apply the stem rewrite that the clause-number gate proposed"*. `clause-number-recall.mjs`
 * proposes nothing -- it is a detector, and its output is a construction id and the matched text. What it DOES
 * carry is a declared NEGATIVE control, the shape it accepts:
 *
 *   "A team reuses its ISMS operational-control framework for AI operation. Which element does Clause 8.1 add
 *    that the reused framework would not already deliver?"
 *
 * -- the clause as AUTHORITY, and the question about SUBSTANCE. 3d1d332c's stem instead asks "which set of
 * determinations matches that clause", which is the container relation: answerable only by knowing what sits
 * at a number. The rewrite below is authored against that shape and drops the number from the stem entirely,
 * because the citation belongs in the EXPLANATION, where 7.4 is already named. The rewritten stem is re-gated
 * like any other, including the solver twice and the options probe.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let APPLY = false, OUT = "AIMSF-S2-REVISED-raw.json";
for (const a of process.argv.slice(2)) {
  let m;
  if (a === "--apply") { APPLY = true; continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply, --out=. DRY by default.");
  console.error("Note the convention: this script is dry unless --apply. `--dry` is not a flag here.");
  process.exit(2);
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const idOf = (t) => createHash("sha256").update(String(t || "").replace(/\s+/g, " ").trim())
  .digest("hex").slice(0, 8);

/* THE SOURCE ARTIFACTS, all of them, because the three revisions are not in one file: 3d1d332c and 6984516f
 * are batch 2, b25f378f is R2. Naming one `--in` would have found two of three and reported the third as a
 * missing id, which is the coverage gap that reads as a pass. */
const FILES = ["AIMSF-ROLLOUT-B1.json", "AIMSF-ROLLOUT-B2.json", "AIMSF-R2-PROBE.json",
  "AIMSF-R2-REST.json", "AIMSF-R3-PROBE.json", "AIMSF-R3-REST.json"];

const REJECT = [
  { id: "c590b702", task: "4.1", why: "anchored in A.6.2, a container, and its options are Annex A category " +
    "numbers, so it is a recall item in disguise" },
  { id: "43882b06", task: "5.5", why: "a near-duplicate of c45a02f1 (1.1): same clause 3.4, same question, " +
    "weaker distractors" },
];

/* ---------------------------------------------------------------- the declared edits */
const EDITS = [
  {
    id: "3d1d332c", task: "3.7",
    why: "PROMPT-95 s2: the stem asked which set of determinations MATCHES clause 7.4, which is the " +
      "container relation the clause-number gate rejects -- answerable by knowing what sits at a number. " +
      "Rewritten to ask the same substantive question with no clause number in the stem; 7.4 is cited in the " +
      "explanation, which is where a citation belongs.",
    fields: ["stem"],
    stem: "An auditor reviews an inherited ISMS communication plan that is to serve the AI management " +
      "system. The plan fixes what will be communicated, when, and to whom. Which set of determinations " +
      "must the organization make about its internal and external communications?",
  },
  {
    id: "b25f378f", task: "5.1",
    why: "PROMPT-95 s2: option B's text was IDENTICAL to the key of dfc8a1bf in the same task, so a form " +
      "carrying both would hand over one item's answer with the other. Rewritten to be wrong for its OWN " +
      "reason, drawn from 3.11's Note 2 rather than from another term's definition -- the explanation moves " +
      "with it, because it described the option it replaced.",
    fields: ["option B text", "explanation"],
    options: [{
      from: "The degree to which the activities that were planned got carried out and the intended results " +
        "reached.",
      to: "Measurable results about the managing of activities and processes, with products and services " +
        "outside the term.",
      why: "The old text restated 3.13's definition of effectiveness verbatim, which is also dfc8a1bf's " +
        "key. The new text misreads Note 2, which expressly extends performance to products, services, " +
        "systems and organizations -- a reason that belongs to this item's own anchor.",
    }],
    explanation: "Clause 3.11's third note to the definition of performance explains that, for the purposes " +
      "of this document, the word takes in both the results that come from using AI systems and the results " +
      "associated with the AI management system, with context showing which reading applies. The term " +
      "therefore spans both at once. The option restricting the term to the managing of activities and " +
      "processes contradicts Note 2, which extends performance to products, services, systems and " +
      "organizations as well; and the remaining options each discard part of what Note 3 includes.",
  },
  {
    id: "6984516f", task: "1.6",
    why: "PROMPT-95 s2, following the 19ce57e0 ruling: 6.1.3 still requires comparison against Annex A, so " +
      "controls an organization designs itself are ADDITIONAL, not a replacement. 'instead' was the defect.",
    fields: ["explanation"],
    explanation: "Clause A.1 presents Table A.1 as a reference set rather than a compulsory checklist: the " +
      "organization need not adopt every listed control objective and control, and it may also " +
      "'design and implement their own controls' (A.1), working through the risk treatment process in 6.1.3.",
  },
];

/* ---------------------------------------------------------------- locate everything */
const found = new Map();   /* id8 -> {file, rec} */
const src = { certification: null, model: null, standard: null, edition: null };
for (const f of FILES) {
  const p = join(ROOT, f);
  if (!existsSync(p)) continue;
  const art = JSON.parse(readFileSync(p, "utf8"));
  for (const k of Object.keys(src)) if (!src[k] && art[k]) src[k] = art[k];
  for (const r of art.items || []) {
    const id = String(r.item_id || idOf(r.item && r.item.question_text)).slice(0, 8);
    if (!found.has(id)) found.set(id, { file: f, rec: r });
  }
}

let fails = 0;
console.log("PROMPT-95 s2 -- 2 rejection(s), " + EDITS.length + " revision(s)");
console.log("");

/* ---- the rejections: assert they exist and are survivors, so a typo cannot reject nothing ---- */
console.log("REJECTIONS (recorded here, enforced at the insert -- a verdict belongs with the act on it)");
for (const x of REJECT) {
  const hit = found.get(x.id);
  if (!hit) { console.error("  ABORT " + x.id + ": no such item in any artifact"); fails++; continue; }
  if (hit.rec.verdict !== "survivor") {
    console.error("  ABORT " + x.id + ": verdict is " + JSON.stringify(hit.rec.verdict) +
      ", not survivor -- rejecting it would be a no-op dressed as a decision");
    fails++; continue;
  }
  if (String(hit.rec.task_code) !== x.task) {
    console.error("  ABORT " + x.id + ": the ruling names task " + x.task + " and the item is task " +
      hit.rec.task_code + " -- a numbering drift, not a typo to wave through");
    fails++; continue;
  }
  console.log("  " + x.id + "  task " + x.task + "  " + hit.file);
  console.log("      " + x.why);
}
console.log("");

/* ---- the revisions ---- */
const revised = [];
for (const e of EDITS) {
  const hit = found.get(e.id);
  if (!hit) { console.error("ABORT " + e.id + ": no such item in any artifact"); fails++; continue; }
  if (String(hit.rec.task_code) !== e.task) {
    console.error("ABORT " + e.id + ": the ruling names task " + e.task + " and the item is task " +
      hit.rec.task_code);
    fails++; continue;
  }
  const before = JSON.parse(JSON.stringify(hit.rec.item));
  const item = JSON.parse(JSON.stringify(hit.rec.item));
  console.log(e.id + "  task " + e.task + "  " + hit.file + "   fields: " + e.fields.join(", "));
  console.log("  why: " + e.why);

  if (e.stem) {
    console.log("  STEM FROM " + JSON.stringify(before.question_text));
    console.log("  STEM TO   " + JSON.stringify(e.stem));
    item.question_text = e.stem;
  }
  const touched = new Set();
  for (const o of e.options || []) {
    const i = (item.options || []).findIndex((x) => String(x.text) === o.from);
    if (i < 0) {
      console.error("  ABORT: no option with that exact text -- the artifact moved since this was written");
      fails++; continue;
    }
    console.log("  OPTION " + String.fromCharCode(65 + i) + " FROM " + JSON.stringify(o.from));
    console.log("  OPTION " + String.fromCharCode(65 + i) + " TO   " + JSON.stringify(o.to));
    console.log("      " + o.why);
    if (item.options[i].is_correct) {
      console.error("  ABORT: that option is the KEY. This ruling edits a distractor.");
      fails++; continue;
    }
    item.options[i] = { ...item.options[i], text: o.to };
    touched.add(i);
  }
  if (e.explanation) {
    console.log("  EXPL FROM " + JSON.stringify(before.explanation));
    console.log("  EXPL TO   " + JSON.stringify(e.explanation));
    item.explanation = e.explanation;
  }

  /* ---- assert nothing undeclared moved ---- */
  const declared = new Set();
  if (e.stem) declared.add("question_text");
  if (e.explanation) declared.add("explanation");
  for (const k of new Set([...Object.keys(before), ...Object.keys(item)])) {
    if (k === "options") continue;
    if (declared.has(k)) continue;
    if (JSON.stringify(before[k]) !== JSON.stringify(item[k])) {
      console.error("  ABORT: undeclared change to field " + k); fails++;
    }
  }
  if ((before.options || []).length !== (item.options || []).length) {
    console.error("  ABORT: the option count moved"); fails++;
  } else {
    for (let i = 0; i < before.options.length; i++) {
      if (JSON.stringify(before.options[i]) !== JSON.stringify(item.options[i]) && !touched.has(i)) {
        console.error("  ABORT: undeclared change to option " + String.fromCharCode(65 + i)); fails++;
      }
      if (before.options[i].is_correct !== item.options[i].is_correct) {
        console.error("  ABORT: is_correct moved on option " + String.fromCharCode(65 + i)); fails++;
      }
    }
  }
  const newId = idOf(item.question_text);
  console.log("  new item_id: " + newId +
    (newId === e.id ? "   (unchanged -- the stem was not edited)" : "   (the stem moved, so the id moves)"));
  console.log("");
  revised.push({ task_code: hit.rec.task_code, item, revision_of: e.id, revision_fields: e.fields });
}

console.log(EDITS.length + " revision(s) declared, " + revised.length + " prepared, " +
  REJECT.length + " rejection(s) recorded, " + fails + " abort condition(s)");
if (fails) {
  console.error("\nNOTHING WRITTEN. Validate before writing, so ABORT genuinely means nothing was written.");
  process.exit(1);
}
if (!APPLY) {
  console.log("\nDRY RUN -- nothing written. Re-run with --apply to write " + OUT + ".");
  console.log("A dry run reporting ok has changed nothing; verify the write separately.");
  process.exit(0);
}
writeFileSync(join(ROOT, OUT), JSON.stringify({
  certification: src.certification, model: src.model, standard: src.standard, edition: src.edition,
  generation_note: "PROMPT-95 s2 revisions. NOT generated -- hand edits to the declared fields only, " +
    "asserted field by field against the original. UNGATED: re-gate before any insert.",
  rejected: REJECT,
  items: revised,
}, null, 1) + "\n", "utf8");
console.log("\nwrote " + OUT + "  (" + revised.length + " revised item(s), UNGATED; " + REJECT.length +
  " rejection(s) recorded for the insert to enforce)");
console.log("Re-gate with:  node --dns-result-order=ipv4first scripts/gen-grounded-items.mjs --cert=AIMS-F" +
  " --from=" + OUT + " --exam-scope --out=AIMSF-S2-REVISED.json");
