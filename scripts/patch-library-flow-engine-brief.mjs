/**
 * patch-library-flow-engine-brief.mjs
 *
 * Adds the engine brief to the library flow, on the CERTIFICATION RECORD node
 * beside the fact sheet.
 *
 * INDENTATION NOTE - THIS IS WHY THE FIRST ATTEMPT FAILED
 *
 * The details map nests: `details:` at 4 spaces, each node key at 6, `actions:`
 * at 8, the action object at 10, its fields at 12. The first version of this
 * script anchored `actions:` at 10 - one nesting level too deep - and matched
 * nothing. Whitespace in a multi-line anchor is part of the anchor.
 *
 * WHY THE cert NODE AND NOT blueprint
 *
 * The blueprint node is about the examination's COMPOSITION - domains, weights,
 * question allocation, cognitive profile. The brief is about how the examination
 * is CONDUCTED, and it spans the whole chain: the analysis it derives from, the
 * pool it draws from, the record it keeps, the credential it produces. It is not
 * downstream of the blueprint; it describes the entire pipeline.
 *
 * The practical argument agrees. The fact sheet is what a rep attaches to a
 * first email; "and here is how the examination itself works" is the second
 * attachment, not something to be found three nodes downstream.
 *
 * ALSO FIXES A STALE COMMENT. The file header enumerates which asset types are
 * implemented, and it has been wrong since the JTA sheet shipped. A comment
 * listing a set that grows is wrong by construction, so it now states the RULE:
 * enabled actions are whatever render-asset lists in IMPLEMENTED.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:DRY_RUN="1"; node scripts\patch-library-flow-engine-brief.mjs
 *   Remove-Item Env:\DRY_RUN; node scripts\patch-library-flow-engine-brief.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SRC =
  "C:/Users/Juan/Documents/certidemy/certidemy-web/components/console/library-flow.tsx";
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

/* ---- 1. the action on the cert node ----------------------------------
   Depth: actions at 8, object at 10, fields at 12. */

const A1_FROM = [
  "        actions: [",
  "          {",
  '            id: "factsheet",',
  '            label: "Fact sheet",',
  '            hint: "Claim, exam parameters, credential terms. No price.",',
  "          },",
  "        ],",
].join("\n");

const A1_TO = [
  "        actions: [",
  "          {",
  '            id: "factsheet",',
  '            label: "Fact sheet",',
  '            hint: "Claim, exam parameters, credential terms. No price.",',
  "          },",
  "          {",
  '            id: "engine_brief",',
  '            label: "How the exam works",',
  "            hint:",
  '              "How the examination is assembled, conducted and scored, what it deliberately does not do, and how it aligns with ISO/IEC 17024. Safe to send.",',
  "          },",
  "        ],",
].join("\n");

/* ---- 2. the stale implemented-list comment --------------------------- */

const A2_FROM =
  "* Only `factsheet`, `specimen_certificate` and `blueprint_sheet` are";

const A2_TO =
  "* Enabled actions are whatever render-asset lists in IMPLEMENTED. An earlier\n" +
  " * version of this comment enumerated them and was wrong from the moment the\n" +
  " * next asset type shipped, so it states the rule instead. Anything still marked\n" +
  " * `disabled` here has no branch on the server yet.\n" +
  " * (previously read: only factsheet, specimen_certificate and blueprint_sheet are";

const EDITS = [
  ["engine_brief action on the cert node", A1_FROM, A1_TO],
  ["stale implemented-list comment", A2_FROM, A2_TO],
];

if (!existsSync(SRC)) {
  console.error("library-flow.tsx not found at " + SRC);
  process.exit(1);
}

let text = readFileSync(SRC, "utf8");
const before = text.length;

console.log("library-flow engine_brief " + (DRY_RUN ? "[DRY RUN]" : "[LIVE]") + "\n");

if (text.includes("engine_brief")) {
  console.log("  already patched - 'engine_brief' is present. Nothing to do.");
  process.exit(0);
}

/* ---- phase 1: validate all anchors, touch nothing ------------------- */
let bad = 0;
for (const [label, from] of EDITS) {
  const hits = text.split(from).length - 1;
  if (hits === 1) {
    console.log("  ok   " + label);
  } else {
    console.log("  FAIL " + label + ": anchor found " + hits + " times, expected 1");
    // Printed with visible leading dots so an indentation mismatch is obvious
    // rather than something to be counted by eye. That is what went wrong the
    // first time this ran.
    console.log(
      from
        .split("\n")
        .map((l) => "         |" + l.replace(/^ +/, (m) => ".".repeat(m.length)))
        .join("\n"),
    );
    bad += 1;
  }
}
if (bad > 0) {
  console.log("\n" + bad + " anchor(s) did not match. NOTHING written across the file.");
  console.log("Leading spaces are shown as dots above - compare them with the source.");
  process.exit(1);
}

/* ---- phase 2: apply -------------------------------------------------- */
for (const [, from, to] of EDITS) {
  text = text.replace(from, to);
}

console.log("\nbytes " + before + " -> " + text.length);

if (DRY_RUN) {
  console.log("\nDRY RUN - nothing written. Both anchors matched.");
} else {
  writeFileSync(SRC, text, { encoding: "utf8" });
  console.log("\nwritten. Run `npm run build`.");
  console.log("");
  console.log("Then /console/library, pick a certification, click the");
  console.log("certification record node, generate 'How the exam works'.");
}
