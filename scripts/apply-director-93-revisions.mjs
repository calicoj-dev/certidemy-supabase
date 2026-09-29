#!/usr/bin/env node
/**
 * apply-director-93-revisions.mjs -- the six batch-1 revisions PROMPT-93 s1 names.
 *
 * `--apply` writes the revised artifact. DRY BY DEFAULT, printing every edit as a before/after. Unknown
 * flags exit 2. It writes a FILE, never the database: the revised items are re-gated and inserted by the
 * generator, so this script's only job is to produce the artifact the gates then judge.
 *
 * ============ EDIT THE NAMED FIELDS AND NOTHING ELSE, ASSERTED ============
 *
 * The ruling says "Edit the fields named below and nothing else." That is asserted rather than intended: for
 * every revised item, each field NOT named is compared byte-for-byte against the original and the run aborts
 * on any difference. A revision script that quietly reformatted an option would be indistinguishable from
 * one that did its job -- and every regenerated word is an unreviewed word.
 *
 * ============ ONE PREMISE WAS FALSIFIED AND THAT EDIT IS NOT MADE ============
 *
 * 568cbf03 was returned because the explanation says the internal-context examples come from "the same note"
 * as the external ones, and the ruling says they sit in a different note. Read out of the passage: BOTH are
 * in NOTE 2, as sub-lists a) external and b) internal. The note number was already right.
 *
 * So the substantive correction is declined, with its evidence, and the edit made instead is the precision
 * the explanation genuinely lacks -- naming a) and b). Making the ruled change would have introduced the
 * error it was written to remove.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let APPLY = false, IN = "AIMSF-ROLLOUT-B1.json", OUT = "AIMSF-B1-REVISED-raw.json";
for (const a of process.argv.slice(2)) {
  let m;
  if (a === "--apply") { APPLY = true; continue; }
  if ((m = /^--in=(.+)$/.exec(a))) { IN = m[1]; continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply, --in=, --out=. DRY by default.");
  console.error("Note the convention: this script is dry unless --apply. `--dry` is not a flag here.");
  process.exit(2);
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const idOf = (t) => createHash("sha256").update(String(t || "").replace(/\s+/g, " ").trim())
  .digest("hex").slice(0, 8);

/* ---------------------------------------------------------------- the declared edits
 * `fields` names exactly what may change. `option` edits address one option by its current text, never by
 * index, so a reordered artifact cannot silently rewrite the wrong option. */
const EDITS = [
  {
    id: "19ce57e0", why: "PROMPT-93 s1: the key overstated A.1. 6.1.3 still requires comparison against " +
      "Annex A, so own controls are ADDITIONAL, not a replacement -- 'instead' was the defect.",
    fields: ["key text", "option B text"],
    key: "It is a reference set: not every control in it is required, and an organization can also design " +
      "and implement controls of its own.",
    options: [{
      from: "It forms a fixed baseline that has to be adopted in full, and controls an organization devises " +
        "itself are not accepted.",
      to: "It lists the controls that apply to AI providers only, and organizations in other roles use " +
        "their own.",
      why: "B was an exact mirror of the key and the probe named it. Wrong for a different reason now, " +
        "keeping a limiter ('only').",
    }],
  },
  {
    id: "568cbf03", why: "PROMPT-93 s1 asked for the note numbers to be corrected. CHECKED AGAINST THE " +
      "PASSAGE: both lists are in NOTE 2, sub-lists a) external and b) internal, so the note number was " +
      "already right and the ruled correction is DECLINED. The edit made is the precision the explanation " +
      "lacked -- naming the sub-lists.",
    fields: ["explanation"],
    explanation: "NOTE 2 to clause 4.1 splits its examples into two sub-lists: a) external context " +
      "related considerations, which include policies, guidelines and decisions from regulators that have " +
      "an impact on the interpretation or enforcement of legal requirements; and b) internal context " +
      "related considerations. The other three options are all drawn from sub-list b) -- contractual " +
      "obligations, the intended purpose of the AI system, and organizational governance, objectives, " +
      "policies and procedures.",
  },
  {
    id: "b90e65f1", why: "PROMPT-93 s1: the stem asked what sits at a numbered clause. Rewritten to name " +
      "the topic, on the director's own example. The 27001 mapping framing is kept; naming 27001 is allowed.",
    fields: ["question_text"],
    question_text: "An organisation already certified to ISO/IEC 27001 is mapping its existing " +
      "arrangements onto an AI management system. Which description matches the AIMS requirement for " +
      "internal audit?",
  },
  {
    id: "90fff510", why: "PROMPT-93 s1: same defect, written on the same pattern as the director's example " +
      "for b90e65f1.",
    fields: ["question_text"],
    question_text: "An organisation already certified to ISO/IEC 27001 is mapping its existing " +
      "arrangements onto an AI management system. Which description matches the AIMS requirement for " +
      "management review?",
  },
  {
    id: "ce7cd810", why: "PROMPT-93 s1: rewritten on the director's own example, which names both topics " +
      "and needs no number to answer.",
    fields: ["question_text"],
    question_text: "ISO/IEC 42001 divides improvement between continual improvement and the handling of " +
      "nonconformities, as ISO/IEC 27001 does. Which of these obligations is part of continual improvement " +
      "rather than of handling a nonconformity?",
  },
  {
    id: "e11bd9f1", why: "PROMPT-93 s1: same defect. The topic is determining context, which is what " +
      "separates the key from the interested-parties, scope and establishment options.",
    fields: ["question_text"],
    question_text: "An organisation that has determined context for its ISMS is now doing so for an AI " +
      "management system. Which requirement does ISO/IEC 42001 add when an organisation determines its " +
      "context?",
  },
];

const src = JSON.parse(readFileSync(existsSync(IN) ? IN : join(ROOT, IN), "utf8"));
const byId = new Map();
for (const r of src.items || []) byId.set(r.item_id || idOf(r.item.question_text), r);

const IMMUTABLE = ["key_support", "key_support_clause", "correct_index"];
let fails = 0;
const revised = [];
for (const e of EDITS) {
  const r = byId.get(e.id);
  if (!r) { console.error("  MISSING " + e.id + " in " + IN); fails++; continue; }
  const before = JSON.parse(JSON.stringify(r.item));
  const item = JSON.parse(JSON.stringify(r.item));

  console.log("=== " + e.id + "   task " + r.task_code + "   anchor " + before.key_support_clause);
  console.log("  fields declared: " + e.fields.join(", "));
  console.log("  " + e.why);

  if (e.question_text) {
    console.log("  STEM before: " + before.question_text);
    console.log("  STEM after : " + e.question_text);
    item.question_text = e.question_text;
  }
  if (e.explanation) {
    console.log("  EXPL before: " + before.explanation);
    console.log("  EXPL after : " + e.explanation);
    item.explanation = e.explanation;
  }
  if (e.key) {
    const ki = before.correct_index;
    console.log("  KEY  before: " + before.options[ki].text);
    console.log("  KEY  after : " + e.key);
    item.options[ki] = { ...item.options[ki], text: e.key };
  }
  for (const o of e.options || []) {
    /* ADDRESSED BY TEXT, NEVER BY INDEX: a reordered artifact must not rewrite a different option. */
    const idx = before.options.findIndex((x) => x.text === o.from);
    if (idx < 0) {
      console.error("  ABORT: the option to replace was not found by its text, so the wrong option would " +
        "be edited. " + e.id);
      fails++; continue;
    }
    if (idx === before.correct_index) {
      console.error("  ABORT: that text is the KEY, not a distractor. " + e.id);
      fails++; continue;
    }
    console.log("  OPT  before: " + o.from);
    console.log("  OPT  after : " + o.to);
    console.log("         why: " + o.why);
    item.options[idx] = { ...item.options[idx], text: o.to };
  }

  /* ---- assert nothing else moved ---- */
  const touchedOptionIdx = new Set();
  if (e.key) touchedOptionIdx.add(before.correct_index);
  for (const o of e.options || []) {
    const i = before.options.findIndex((x) => x.text === o.from);
    if (i >= 0) touchedOptionIdx.add(i);
  }
  for (const k of Object.keys(before)) {
    if (k === "options") continue;
    const changed = JSON.stringify(before[k]) !== JSON.stringify(item[k]);
    const allowed = (k === "question_text" && e.question_text) || (k === "explanation" && e.explanation);
    if (changed && !allowed) { console.error("  ABORT: undeclared change to " + k); fails++; }
    if (IMMUTABLE.includes(k) && changed) { console.error("  ABORT: " + k + " must never move"); fails++; }
  }
  if (before.options.length !== item.options.length) {
    console.error("  ABORT: the option count changed"); fails++;
  } else {
    for (let i = 0; i < before.options.length; i++) {
      const changed = JSON.stringify(before.options[i]) !== JSON.stringify(item.options[i]);
      if (changed && !touchedOptionIdx.has(i)) {
        console.error("  ABORT: undeclared change to option " + String.fromCharCode(65 + i)); fails++;
      }
      if (before.options[i].is_correct !== item.options[i].is_correct) {
        console.error("  ABORT: is_correct moved on option " + String.fromCharCode(65 + i)); fails++;
      }
    }
  }
  console.log("  new item_id: " + idOf(item.question_text) +
    (idOf(item.question_text) === e.id ? "   (unchanged -- the stem was not edited)" : "   (the stem moved)"));
  console.log("");
  revised.push({ task_code: r.task_code, item, revision_of: e.id, revision_fields: e.fields });
}

console.log(EDITS.length + " revision(s) declared, " + revised.length + " prepared, " +
  fails + " abort condition(s)");
if (fails) { console.error("\nNOTHING WRITTEN. Validate before writing, so ABORT means nothing was written."); process.exit(1); }
if (!APPLY) {
  console.log("\nDRY RUN -- nothing written. Re-run with --apply to write " + OUT + ".");
  process.exit(0);
}
/* The raw shape the generator's --from reads: { items: [{ task_code, item }] }. */
writeFileSync(join(ROOT, OUT), JSON.stringify({
  certification: src.certification, model: src.model, standard: src.standard, edition: src.edition,
  generation_note: "PROMPT-93 s1 revisions of AIMSF-ROLLOUT-B1.json. NOT generated -- hand edits to the " +
    "declared fields only, asserted against the original. Re-gate before any insert.",
  items: revised,
}, null, 1) + "\n", "utf8");
console.log("\nwrote " + OUT + "  (" + revised.length + " revised item(s), UNGATED)");
console.log("Re-gate with:  node --dns-result-order=ipv4first scripts/gen-grounded-items.mjs --cert=AIMS-F" +
  " --from=" + OUT + " --exam-scope --out=AIMSF-B1-REVISED.json");
