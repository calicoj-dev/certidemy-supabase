#!/usr/bin/env node
/**
 * print-13-keepers.mjs -- the two task 1.3 pilot items ruled KEEP, in full, with the content id --ids
 * takes. READ-ONLY, no flags, no writes, no model calls.
 *
 * Ruled PROMPT-86 s4: keep #1 (the Annex C illustration) and #4 (the insurer, three years unpatched);
 * neither carries a code cue flag. #2 and #3 are not inserted and are recorded in the artifact as
 * `rejected: anchor-cap + cue flag`.
 *
 * The ids are derived with the SAME hash the generator uses, imported rather than reimplemented -- a
 * second copy would print ids that --ids does not recognise, and the failure would look like a typo.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
/* the generator's itemId, character for character */
const itemId = (item) => createHash("sha256")
  .update(String((item && item.question_text) || "").replace(/\s+/g, " ").trim())
  .digest("hex").slice(0, 8);

const art = JSON.parse(readFileSync(join(ROOT, "PILOT-AIMSF-TASK-1-3.json"), "utf8"));
const survivors = (art.items || []).filter((r) => r.verdict === "survivor");
if (survivors.length !== 4) {
  console.error("expected 4 survivors in the artifact, found " + survivors.length +
    " -- the ruling names #1 and #4 of four and the positions would not mean the same thing.");
  process.exit(2);
}
/* the ruling identifies them by CONTENT, so they are matched by content and the match is asserted */
const WANT = [
  { n: 1, must: /offered in Annex C as an illustration/i, why: "the Annex C illustration" },
  { n: 4, must: /insurer runs an approved model for three years/i, why: "the insurer, three years unpatched" },
];
const chosen = [];
for (const w of WANT) {
  const hits = survivors.filter((r) => w.must.test(String(r.item.question_text || "")));
  if (hits.length !== 1) {
    console.error("ABORT: the ruling's item #" + w.n + " (" + w.why + ") matched " + hits.length +
      " survivors. Identifying it by position instead would insert something nobody named.");
    process.exit(2);
  }
  chosen.push({ ...w, r: hits[0] });
}
const notChosen = survivors.filter((r) => !chosen.some((c) => c.r === r));

const md = [];
const p = (s = "") => md.push(s);
p("# AIMS-F task 1.3 -- the two items ruled KEEP");
p("");
p("Matched by CONTENT against the ruling, not by position: an artifact regenerated between the read and");
p("the insert would leave positions pointing at items nobody saw. Each match is asserted to be unique.");
p("");
p("Insert with:");
p("");
p("```");
p("node --dns-result-order=ipv4first scripts/gen-grounded-items.mjs --cert=AIMS-F \\");
p("  --apply --from=PILOT-AIMSF-TASK-1-3.json --exam-scope \\");
p("  --ids=" + chosen.map((c) => itemId(c.r.item)).join(","));
p("```");
p("");
for (const c of chosen) {
  const it = c.r.item;
  p("---");
  p("");
  p("## #" + c.n + "  `" + itemId(it) + "`   (" + c.why + ")");
  p("");
  p("**anchor** `" + it.key_support_clause + "`");
  p("");
  p("> " + String(it.key_support || "").replace(/\s+/g, " "));
  p("");
  p("**Q** " + String(it.question_text).replace(/\s+/g, " "));
  p("");
  for (const [i, o] of (it.options || []).entries()) {
    p("- " + (o.is_correct ? "**" : "") + String.fromCharCode(65 + i) + ") " +
      String(o.text || "").replace(/\s+/g, " ") + (o.is_correct ? "  ← key**" : ""));
  }
  p("");
  p("*explanation:* " + String(it.explanation || "").replace(/\s+/g, " "));
  p("");
  p("*solver:* " + ((c.r.solver || {}).state || "?") + " -- " +
    String((c.r.solver || {}).reason || "").replace(/\s+/g, " "));
  p("");
  p("*options-only probe:* " + ((c.r.options_probe || {}).state || "?") +
    " -- " + String((c.r.options_probe || {}).reason || "").replace(/\s+/g, " ").slice(0, 200));
  p("");
  p("*longest served run:* " + c.r.longest_served_run + " words (ceiling 9)");
  p("");
}
p("---");
p("");
p("## Not inserted");
p("");
for (const r of notChosen) {
  p("- `" + itemId(r.item) + "`  " + String(r.item.question_text).replace(/\s+/g, " ").slice(0, 110) +
    "  -- **rejected: anchor-cap + cue flag** (" + ((r.options_probe || {}).cue_kind || "?") + ")");
}
p("");
p("Both anchor in C.3.6 like the two kept, so with the cap at 2 they are surplus, and both carry an");
p("options-only cue flag -- which is why these two rather than the other two.");
p("");

writeFileSync(join(ROOT, "TASK-13-KEEPERS.md"), md.join("\n") + "\n", "utf8");
console.log("the two ruled KEEP:");
for (const c of chosen) {
  console.log("  #" + c.n + "  " + itemId(c.r.item) + "  anchor " + c.r.item.key_support_clause +
    "  probe=" + ((c.r.options_probe || {}).state || "?"));
}
console.log("not inserted:");
for (const r of notChosen) {
  console.log("      " + itemId(r.item) + "  anchor " + r.item.key_support_clause +
    "  probe=" + ((r.options_probe || {}).state || "?") + " (" + ((r.options_probe || {}).cue_kind || "-") + ")");
}
console.log("\n--ids=" + chosen.map((c) => itemId(c.r.item)).join(","));
console.log("wrote TASK-13-KEEPERS.md");
