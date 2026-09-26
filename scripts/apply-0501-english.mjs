/**
 * apply-0501-english.mjs -- land the two approved English spans in
 * `05-01-aims-monitoring-and-measurement`.
 *
 * WRITES. `--apply`; DRY BY DEFAULT. Unknown flags exit 2.
 *
 * Approved by the director 2026-09-26 with one word changed in span 2: `drift`
 * became `go wrong`, because drift is a technical term this certification teaches
 * (concept and data drift) and using it for a change in USE blurs the exact
 * distinction the paragraph draws. Both of B.6.2.6's cases stay joined by `or`.
 *
 * ============ WHAT THIS DOES AND DOES NOT DO ============
 *
 * It writes ENGLISH ONLY. The two translations still carry the reproduction and are
 * NOT touched: their spans are drafted separately and go to the director before
 * anything is written. All three rows are already withheld, so nothing that is
 * serving stops serving.
 *
 * `trg_lessons_clear_mcp_servable` nulls `mcp_scanned_at` on any content_md change,
 * so the row stays withheld until `scan-iso-leaks` runs again. That is fail-closed
 * and SILENT -- no error, no queue -- so the re-scan is named in this script's own
 * output rather than left to memory.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { score, buildSources, runUnits, ABS_RUN } from "./lib/leak-score.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (!KNOWN.has(a)) {
    console.error("unknown flag " + JSON.stringify(a));
    console.error("DRY BY DEFAULT; --apply writes. There is no --dry.");
    process.exitCode = 2; process.exit();
  }
}
const APPLY = process.argv.includes("--apply");
const SLUG = "05-01-aims-monitoring-and-measurement";

const EDITS = [
  {
    name: "span 1 (the 12w blocker)",
    from: "The guidance warns against a specific error in choosing performance criteria: the organization should consider the performance of non-AI systems or processes already in operation and use them as relevant context. A model with 88% accuracy sounds mediocre until you learn the manual process it replaced ran at 71%. Absolute numbers without a baseline mislead in both directions.",
    to: "ISO/IEC 42001 Annex B, B.6.2.6 warns against a specific error in choosing performance criteria. Whatever the AI system displaced is usually still running somewhere -- a manual workflow, a rule engine, an older model -- and how well it performs should be treated as context when the criteria are set. A model with 88% accuracy sounds mediocre until you learn the manual process it replaced ran at 71%. Absolute numbers without a baseline mislead in both directions.",
    keep: ["should", "performance criteria", "context"],
  },
  {
    name: "span 2 (9w, drafting margin)",
    from: "The guidance adds a related item that is easy to miss: where systems are being used for purposes other than those they were designed for, or in ways nobody anticipated, whether those uses are appropriate should be considered. That is a monitoring obligation about **use**, not about the model, and no technical metric surfaces it.",
    /* `go wrong`, not `drift`: the director's change. */
    to: "B.6.2.6 adds a related item that is easy to miss. A system can go wrong because people started pointing it at something else, not because the model moved: a job it was never designed to do, or one nobody foresaw. Whether such a use is still appropriate should itself be considered. That is a monitoring obligation about **use**, not about the model, and no technical metric surfaces it.",
    keep: ["should", "appropriate", "use", " or "],
  },
];

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

const rows = await getAll(KEY, "lessons?select=id,slug,language,content_md,mcp_servable,mcp_iso_longest_run&slug=eq." + SLUG + "&order=language");
const en = rows.find((r) => r.language === "en");
const problems = [];
if (!en) problems.push("no English row for " + SLUG);

let body = en ? String(en.content_md) : "";
const before = body;
for (const e of EDITS) {
  const n = body.split(e.from).length - 1;
  if (n !== 1) { problems.push(e.name + ": anchor occurs " + n + " times, expected exactly 1"); continue; }
  body = body.replace(e.from, e.to);
  const lower = e.to.toLowerCase();
  for (const k of e.keep) {
    if (!lower.includes(k.toLowerCase())) problems.push(e.name + ": replacement lost `" + k.trim() + "`");
  }
  if (/\b(shall|must)\b/i.test(e.to) && !/\b(shall|must)\b/i.test(e.from)) {
    problems.push(e.name + ": replacement PROMOTED the modal -- B.6.2.6 is guidance");
  }
}
/* The director's word change, asserted rather than assumed present. */
if (!EDITS[1].to.includes("can go wrong")) problems.push("span 2 does not carry the approved `go wrong`");
if (/\bdrift\b/i.test(EDITS[1].to)) problems.push("span 2 still uses `drift`, which the director replaced");

/* Score the WHOLE spliced body, because a run can exist only across a seam. */
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
const wasScore = longest(before), willScore = longest(body);

console.log(APPLY ? "APPLY -- writing English only" : "DRY RUN -- nothing will be written");
console.log("  " + SLUG);
for (const r of rows) {
  console.log("    " + r.language.padEnd(8) + "servable=" + r.mcp_servable +
    "  stored run=" + r.mcp_iso_longest_run);
}
console.log("");
console.log("  whole-body longest run  BEFORE " + wasScore.run + "w (" + (wasScore.source || "-") + ")");
console.log("  whole-body longest run  AFTER  " + willScore.run + "w (" + (willScore.source || "-") + ")");
console.log("  floor " + ABS_RUN + "w, drafting margin 8w");
if (willScore.run >= 8) problems.push("the spliced body scores " + willScore.run + "w, at or over the 8w drafting margin");
if (body === before) problems.push("the body did not change");

if (problems.length) {
  console.error("");
  console.error("ABORT -- nothing written:");
  for (const p of problems) console.error("  " + p);
  process.exitCode = 2; process.exit();
}
if (!APPLY) {
  console.log("");
  console.log("  dry run clean. --apply writes the English row only.");
  process.exitCode = 0; process.exit();
}

/* ---- write, then read the bytes back ---- */
const res = await fetch(REST_URL + "/lessons?id=eq." + en.id, {
  method: "PATCH", headers: { ...H, Prefer: "return=representation" },
  body: JSON.stringify({ content_md: body }),
});
if (!res.ok) { console.error(res.status + " " + res.statusText + "\n" + (await res.text())); process.exitCode = 1; process.exit(); }

const back = await getAll(KEY, "lessons?select=id,language,content_md,mcp_servable,mcp_scanned_at,mcp_iso_longest_run&slug=eq." + SLUG + "&order=language");
const enBack = back.find((r) => r.language === "en");
const post = [];
post.push(["the English body matches byte for byte", String(enBack.content_md) === body, "read-back differs from what was sent"]);
for (const e of EDITS) {
  post.push(["`" + e.name + "` old text is gone", !String(enBack.content_md).includes(e.from), "the anchor survived"]);
  post.push(["`" + e.name + "` new text is present", String(enBack.content_md).includes(e.to), "the replacement is absent"]);
}
post.push(["mcp_scanned_at was cleared by the trigger", enBack.mcp_scanned_at === null,
  "the trigger did not fire; the stored run is now stale rather than absent"]);
post.push(["the translations were NOT touched",
  back.filter((r) => r.language !== "en").every((r) =>
    String(r.content_md) === String(rows.find((x) => x.language === r.language).content_md)),
  "a translated body changed"]);

console.log("");
let bad = 0;
for (const [name, ok, msg] of post) {
  console.log("  " + (ok ? "PASS  " : "FAIL  ") + name + (ok ? "" : "   -- " + msg));
  if (!ok) bad++;
}

writeFileSync(join(ROOT, "APPLY-0501.json"), JSON.stringify({
  slug: SLUG, lesson_id: en.id, run_before: wasScore, run_after: willScore,
  edits: EDITS.map((e) => ({ name: e.name, from: e.from, to: e.to })),
}, null, 2) + "\n", "utf8");

console.log("");
console.log("  NEXT, and it is not optional:");
console.log("    node --dns-result-order=ipv4first scripts/scan-iso-leaks.mjs --apply");
console.log("  Until that runs, all three rows stay withheld with no error and no queue.");
process.exitCode = bad ? 1 : 0;
