/**
 * score-0501-drafts.mjs -- draft-score the proposed 05-01 replacements BEFORE a
 * human reads them.
 *
 * READ-ONLY. It writes nothing anywhere. Unknown flags exit 2.
 *
 * ============ WHY DRAFT-SCORE AND NOT JUST APPLY-SCORE ============
 *
 * CLAUDE.md: a rewrite is scored before it is read, and again after it is
 * applied. The draft score is a FILTER and costs a minute; running only the
 * applied score means an expensive human review runs on text the cheap gate
 * would have rejected. Two of fifteen drafts in an earlier batch reproduced --
 * one of them because restoring a reserved term restored the clause's phrase
 * with it.
 *
 * A POSITIVE CONTROL runs first: the CURRENT text must score its known 12 and 9,
 * or the instrument is not measuring and no draft verdict is reported.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { score, buildSources, runUnits, ABS_RUN } from "./lib/leak-score.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY, writes nothing");
  process.exitCode = 2; process.exit();
}

const CURRENT = {
  span1: "The guidance warns against a specific error in choosing performance criteria: the organization should consider the performance of non-AI systems or processes already in operation and use them as relevant context. A model with 88% accuracy sounds mediocre until you learn the manual process it replaced ran at 71%. Absolute numbers without a baseline mislead in both directions.",
  span2: "The guidance adds a related item that is easy to miss: where systems are being used for purposes other than those they were designed for, or in ways nobody anticipated, whether those uses are appropriate should be considered. That is a monitoring obligation about **use**, not about the model, and no technical metric surfaces it.",
};

const DRAFT = {
  span1: "ISO/IEC 42001 Annex B, B.6.2.6 warns against a specific error in choosing performance criteria. Whatever the AI system displaced is usually still running somewhere -- a manual workflow, a rule engine, an older model -- and how well it performs should be treated as context when the criteria are set. A model with 88% accuracy sounds mediocre until you learn the manual process it replaced ran at 71%. Absolute numbers without a baseline mislead in both directions.",
  span2: "B.6.2.6 adds a related item that is easy to miss. A system can drift because people started pointing it at something else, not because the model moved: a job it was never designed to do, or one nobody foresaw. Whether such a use is still appropriate should itself be considered. That is a monitoring obligation about **use**, not about the model, and no technical metric surfaces it.",
};

/* The obligations the draft must not lose. `should` is the whole point: B.6.2.6
 * is Annex B GUIDANCE, so this is a recommendation and not a requirement, and a
 * draft that promoted it to `shall` or `must` would change what the standard
 * asks for. */
const MUST_KEEP = {
  span1: ["should", "performance criteria", "context"],
  span2: ["should", "appropriate", "use"],
};
const MUST_NOT = ["shall", "must", "is required"];

const sources = buildSources();
const longest = (t) => {
  let worst = 0, src = null;
  for (const u of runUnits(t)) {
    const s = score(u, sources);
    const r = s && (s.maxRun !== undefined ? s.maxRun : s.run);
    if (r && r > worst) { worst = r; src = s.source || s.bestSource || null; }
  }
  return { run: worst, source: src };
};

/* ---- positive control ---- */
const c1 = longest(CURRENT.span1), c2 = longest(CURRENT.span2);
console.log("POSITIVE CONTROL -- the current text must still score its known runs");
console.log("  span 1 current   " + c1.run + "w  (" + (c1.source || "-") + ")   expected 12");
console.log("  span 2 current   " + c2.run + "w  (" + (c2.source || "-") + ")   expected 9");
if (c1.run !== 12 || c2.run !== 9) {
  console.error("");
  console.error("CONTROL FAILED: the instrument does not reproduce the known runs.");
  console.error("No draft verdict printed -- a scorer that cannot find a reproduction that IS");
  console.error("there says nothing about a draft.");
  process.exitCode = 2; process.exit();
}

/* ---- the drafts ---- */
console.log("");
console.log("DRAFTS  (floor is ABS_RUN = " + ABS_RUN + "; 8-9w is redrafted too, drafting margin)");
let bad = 0;
for (const k of ["span1", "span2"]) {
  const d = longest(DRAFT[k]);
  const lower = DRAFT[k].toLowerCase();
  const lost = MUST_KEEP[k].filter((t) => !lower.includes(t.toLowerCase()));
  const gained = MUST_NOT.filter((t) => lower.includes(t) && !CURRENT[k].toLowerCase().includes(t));
  const verdict = d.run >= 8 ? "OVER THE DRAFTING MARGIN" : lost.length ? "LOST A RESERVED TERM"
    : gained.length ? "PROMOTED THE MODAL" : "clean";
  if (verdict !== "clean") bad++;
  console.log("");
  console.log("  " + k + ": " + d.run + "w against " + (d.source || "nothing") + "   -> " + verdict);
  if (lost.length) console.log("      LOST: " + lost.join(", "));
  if (gained.length) console.log("      GAINED (must not): " + gained.join(", "));
  console.log("      " + DRAFT[k].replace(/\s+/g, " "));
}

/* ---- and the whole body with the drafts spliced in, so a run that only exists
   ACROSS the seam cannot hide. A per-span score cannot see that. ---- */
const KEY = requireKey(HERE);
const rows = await getAll(KEY,
  "lessons?select=content_md&slug=eq.05-01-aims-monitoring-and-measurement&language=eq.en");
let body = String(rows[0].content_md || "");
let spliced = 0;
for (const k of ["span1", "span2"]) {
  if (!body.includes(CURRENT[k])) { console.error("\nANCHOR MISSING for " + k + " -- the live English moved."); process.exitCode = 2; process.exit(); }
  body = body.replace(CURRENT[k], DRAFT[k]);
  spliced++;
}
const whole = longest(body);
console.log("");
console.log("WHOLE BODY with both drafts spliced (" + spliced + " anchors replaced)");
console.log("  longest run " + whole.run + "w against " + (whole.source || "nothing") +
  (whole.run >= ABS_RUN ? "   <- STILL HELD" : whole.run >= 8 ? "   <- under the floor, over the margin" : "   <- clears both"));
if (whole.run >= 8) bad++;

console.log("");
console.log(bad ? "  " + bad + " problem(s): do not hand these over yet."
  : "  drafts clear the floor and the margin, and keep every reserved term.");
process.exitCode = bad ? 1 : 0;
