/**
 * prune-dead-home-keys.mjs
 *
 * Removes 37 superseded keys from the `home` namespace in all three message
 * files. They render nowhere.
 *
 * HOW THEY WERE FOUND. A scan of all 221 .ts/.tsx source files for every leaf
 * key in messages/en.json found 73 of 674 never referenced. The home page uses
 * only `heroHeadlineLead`, `heroHeadlineTail` and `heroSubhead`; an earlier
 * design's hero, philosophy, differentiator, how-it-works, try and blueprint
 * sections are all orphaned.
 *
 * WHY ONLY 37 OF THE 73. The rest are not obviously superseded.
 * `dashboard.actionQuiz*`, `dashboard.curriculum*` and `workspace.*` may be
 * scaffolding for the dashboard rebuild that is on the roadmap, and deleting
 * someone's groundwork is a worse mistake than leaving dead strings. Those need
 * a person who knows the intent. This block does not: it was replaced.
 *
 * TWO KEYS THE SCAN CALLED ALIVE ARE INCLUDED ANYWAY.
 *   `headlineTail` - matched because auth.showcase.headlineTail is rendered.
 *   `subhead`      - matched because dashboard.subhead is rendered.
 * The scan compares LEAF names, so any key sharing a name with a live key in
 * another namespace hides. That also means the true dead count across the file
 * is higher than 73, and this script does not attempt to find the rest.
 *
 * WHY THIS IS WORTH DOING AT ALL. Two reasons, and the second is the real one.
 *
 *   Every future translation review reads copy that will never appear. A
 *   reviewer who finds a third of their work pointless starts skimming, and
 *   skimming is how the next claim slips through.
 *
 *   `philosophy*` contains a scoring-weight comparison - an
 *   unsourced Class D claim under CLAIMS-POLICY, and the last known one in the
 *   codebase. Dead code that makes claims is a landmine: one re-wire and it is
 *   live again. Deleting it closes the CLAIMS-POLICY §8 open item permanently
 *   rather than leaving it to be rediscovered.
 *
 * METHOD. Parse, delete, re-serialise with the file's own detected indentation.
 * Text-level line deletion would have to handle trailing commas at three
 * nesting depths; a round trip cannot produce invalid JSON. The byte delta is
 * printed so an unexpected reformat is visible rather than buried in a diff.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:DRY_RUN="1"; node scripts\prune-dead-home-keys.mjs
 *   Remove-Item Env:\DRY_RUN; node scripts\prune-dead-home-keys.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const WEB = "C:/Users/Juan/Documents/certidemy/certidemy-web/messages";
const FILES = ["en.json", "es-419.json", "pt-BR.json"];
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

/** Keys under the `home` namespace only. Nothing else is touched. */
const DEAD = [
  // superseded hero - replaced by heroHeadlineLead / heroHeadlineTail / heroSubhead
  "headlineLead",
  "headlineTail",
  "subhead",
  "trustLine",

  // philosophy section - also the last unsourced competitor claim in the repo
  "philosophyEyebrow",
  "philosophyHeadline",
  "philosophyBody",
  "philosophyPoint1Label",
  "philosophyPoint1Body",
  "philosophyPoint2Label",
  "philosophyPoint2Body",
  "philosophyPoint3Label",
  "philosophyPoint3Body",

  // differentiator section
  "diffSectionEyebrow",
  "diffSectionHeadline",
  "diff1Title",
  "diff1Body",
  "diff2Title",
  "diff2Body",
  "diff3Title",
  "diff3Body",
  "diff4Title",
  "diff4Body",

  // superseded how-it-works - the live one is hiw* on this page and the
  // separate /how-it-works route
  "howEyebrow",
  "howHeadline",
  "how1Title",
  "how1Body",
  "how2Title",
  "how2Body",
  "how3Title",
  "how3Body",

  // try + blueprint sections
  "tryEyebrow",
  "tryHeadline",
  "blueprintEyebrow",
  "blueprintHeadline",
  "blueprintBody",
  "blueprintCta",
];

/** Indentation of the second line, so the round trip preserves the file's own style. */
function detectIndent(text) {
  const line = text.split("\n")[1] ?? "";
  const m = line.match(/^(\s+)/);
  if (!m) return 2;
  return m[1].includes("\t") ? "\t" : m[1].length;
}

let totalRemoved = 0;
let failed = 0;

console.log(`Prune dead home keys ${DRY_RUN ? "[DRY RUN]" : "[LIVE]"} - ${DEAD.length} keys\n`);

for (const file of FILES) {
  const path = `${WEB}/${file}`;
  if (!existsSync(path)) {
    console.log(`FAIL ${file}: not found`);
    failed++;
    continue;
  }

  const before = readFileSync(path, "utf8");
  const indent = detectIndent(before);
  const data = JSON.parse(before);

  if (!data.home) {
    console.log(`FAIL ${file}: no 'home' namespace`);
    failed++;
    continue;
  }

  const removed = [];
  const missing = [];
  for (const k of DEAD) {
    if (Object.prototype.hasOwnProperty.call(data.home, k)) {
      delete data.home[k];
      removed.push(k);
    } else {
      missing.push(k);
    }
  }

  const after = JSON.stringify(data, null, indent) + "\n";
  const delta = after.length - before.length;

  console.log(`== ${file} ==`);
  console.log(`  indent detected : ${JSON.stringify(indent)}`);
  console.log(`  removed         : ${removed.length}`);
  if (missing.length) console.log(`  already absent  : ${missing.join(", ")}`);
  console.log(`  bytes           : ${before.length} -> ${after.length} (${delta})`);
  console.log(`  home keys left  : ${Object.keys(data.home).length}`);

  if (!DRY_RUN) {
    writeFileSync(path, after, { encoding: "utf8" });
    console.log("  written");
  }
  console.log("");
  totalRemoved += removed.length;
}

console.log(`${DRY_RUN ? "would remove" : "removed"} ${totalRemoved} across ${FILES.length} files, failed ${failed}`);
if (failed > 0) process.exit(1);
if (!DRY_RUN) {
  console.log("\nRun `npm run build`. next-intl types the message files, so a");
  console.log("key deleted while still referenced fails the build rather than the page.");
}
