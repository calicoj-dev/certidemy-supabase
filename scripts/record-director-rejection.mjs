#!/usr/bin/env node
/**
 * record-director-rejection.mjs -- the standing list of items the director has rejected, with reasons.
 *
 * `--apply` writes. DRY BY DEFAULT. Unknown flags exit 2. Writes a FILE, never the database.
 *
 * Ruled PROMPT-96 s3 for `3a3d26fa`. The list itself exists because a rejection is the one disposition that
 * CANNOT be derived from an artifact: a gate refusal is recorded by the run that made it, a supersession by
 * the revision that caused it, but a director saying "reject this" leaves no trace anywhere unless it is
 * written down.
 *
 * ============ WHY ONE STANDING FILE RATHER THAN A BLOCK PER PROMPT ============
 *
 * The PROMPT-95 s2 rejections live inside `AIMSF-S2-REVISED-raw.json`, which is the record of that run. That
 * worked for two items and does not scale: `report-aimsf-completion` would need to know the name of every
 * artifact that ever carried a rejection, which is a hand-kept list of hand-kept lists, and the first one
 * nobody adds is the first rejection that quietly becomes awaiting again.
 *
 * So: ONE file, every entry citing the prompt that made it. The per-run artifacts keep their own `rejected`
 * blocks as the record of what happened in that run, and the report reads BOTH and unions them -- because a
 * rejection dropped from either source should still be excluded, and a union cannot lose one.
 *
 * ============ AND A REJECTION IS ASSERTED TO BE ABOUT SOMETHING THAT EXISTS ============
 *
 * Every id must match a real item in some artifact, and must not already be in the bank. Rejecting a typo
 * rejects nothing, and "rejecting" an item that is already inserted is a different act needing a different
 * mechanism (retiring a row), which this script refuses rather than half-doing.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply. DRY by default.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KEY = requireKey(HERE);
const OUT = join(ROOT, "AIMSF-DIRECTOR-REJECTIONS.json");
const idOf = (t) => createHash("sha256").update(String(t || "").replace(/\s+/g, " ").trim())
  .digest("hex").slice(0, 8);

/* ---- the declared rejections. Every entry names the prompt that made it. ---- */
const REJECTIONS = [
  {
    id: "c590b702", task: "4.1", ruled: "PROMPT-95 s2",
    why: "anchored in A.6.2, a container, and its options are Annex A category numbers -- a recall item in " +
      "disguise. Verified before acting: all four options are literally 'A.6, covering...', 'A.4, " +
      "covering...', 'A.9...', 'A.10...'.",
  },
  {
    id: "43882b06", task: "5.5", ruled: "PROMPT-95 s2",
    why: "a near-duplicate of c45a02f1 (1.1): same anchor (3.4), same key substance, and its distractors " +
      "are certificates, certification-body rules and accreditation -- eliminable without knowing the " +
      "standard, against c45a02f1's process / policy / objective. Its distractor 2's `why_wrong` also " +
      "talks about certification bodies while its support span is 3.4's Note 2 on management-system " +
      "elements: the reason and the evidence do not match.",
  },
  {
    id: "3a3d26fa", task: "3.1", ruled: "PROMPT-96 s3",
    why: "cites A.4.6 -- human resources -- for text belonging to A.5's objective: \"Assessing impacts of " +
      "AI systems Objective: To assess AI system impacts to individuals or groups...\". A.4.6's held text " +
      "used to run on into A.5, and the item anchored its distractor in that over-run. THE CITATION WAS " +
      "ALWAYS WRONG; repairing the passage is what made it refusable. It failed `verbatim` at the " +
      "PROMPT-95 s2 insert and was already excluded from the bank -- this records the VERDICT, so it " +
      "cannot return to a queue as an awaiting survivor.",
    already_gate_refused: "AIMSF-S2-INSERTED.json, verdict `rejected by code`, failed `verbatim`",
  },
];

/* ---- locate every id, and assert it is real and not already inserted ---- */
const FILES = ["AIMSF-ROLLOUT-B1.json", "AIMSF-ROLLOUT-B2.json", "AIMSF-R2-PROBE.json",
  "AIMSF-R2-REST.json", "AIMSF-R3-PROBE.json", "AIMSF-R3-REST.json", "AIMSF-S2-REVISED.json",
  "AIMSF-R4-PROBE.json", "AIMSF-R4-REST.json"];
const found = new Map();
for (const f of FILES) {
  const p = join(ROOT, f);
  if (!existsSync(p)) continue;
  for (const r of JSON.parse(readFileSync(p, "utf8")).items || []) {
    const id = String(r.item_id || idOf(r.item && r.item.question_text)).slice(0, 8);
    if (!found.has(id)) found.set(id, { file: f, rec: r });
  }
}
const certs = await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F");
const bankRows = await getAll(KEY, "quiz_questions?select=id,question_text&certification_id=eq." +
  certs[0].id + "&item_origin=eq.generated&language=eq.en&order=id");
const inBank = new Set(bankRows.map((r) => idOf(r.question_text)));

let fails = 0;
console.log("DIRECTOR REJECTIONS -- " + REJECTIONS.length + " declared");
console.log("");
for (const x of REJECTIONS) {
  const hit = found.get(x.id);
  if (!hit) {
    console.error("  ABORT " + x.id + ": no such item in any artifact. Rejecting a typo rejects nothing.");
    fails++; continue;
  }
  if (String(hit.rec.task_code) !== x.task) {
    console.error("  ABORT " + x.id + ": declared as task " + x.task + ", the item is task " +
      hit.rec.task_code + " -- a numbering drift, not a typo to wave through.");
    fails++; continue;
  }
  if (inBank.has(x.id)) {
    console.error("  ABORT " + x.id + ": this item is ALREADY IN THE BANK. Rejecting an inserted row is a " +
      "different act -- it needs retiring, which this script does not do and will not half-do.");
    fails++; continue;
  }
  console.log("  " + x.id + "  task " + x.task.padEnd(5) + hit.file);
  console.log("      ruled " + x.ruled);
  console.log("      " + x.why);
  if (x.already_gate_refused) console.log("      also refused by a gate: " + x.already_gate_refused);
  console.log("");
}
if (fails) {
  console.error("NOTHING WRITTEN. " + fails + " abort condition(s). Validate before writing.");
  process.exit(1);
}
if (!APPLY) {
  console.log("DRY RUN -- nothing written. Re-run with --apply to write AIMSF-DIRECTOR-REJECTIONS.json.");
  process.exit(0);
}
writeFileSync(OUT, JSON.stringify({
  what: "Items the director has rejected, with the prompt that ruled each. A rejection is the one " +
    "disposition that cannot be derived from an artifact: a gate refusal is recorded by the run that made " +
    "it and a supersession by the revision that caused it, but a ruling leaves no trace unless written.",
  read_by: ["scripts/report-aimsf-completion.mjs -- so a rejected item is not counted as awaiting approval"],
  and_the_per_run_blocks_stay: "AIMSF-S2-REVISED-raw.json keeps its own `rejected` block as the record of " +
    "that run. The report unions both sources, because a rejection dropped from either should still be " +
    "excluded and a union cannot lose one.",
  rejections: REJECTIONS,
}, null, 2) + "\n", "utf8");
console.log("wrote AIMSF-DIRECTOR-REJECTIONS.json   " + REJECTIONS.length + " rejection(s)");
