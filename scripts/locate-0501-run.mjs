/**
 * locate-0501-run.mjs -- find the exact spans holding
 * `05-01-aims-monitoring-and-measurement` at 12 words, so a draft can be written
 * against the text rather than against a memory of it.
 *
 * READ-ONLY, no writes. Unknown flags exit 2.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { score, runUnits, buildSources, SEED, ABS_RUN } from "./lib/leak-score.mjs";
import { PDFS } from "./lib/citation-index.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY, takes none");
  process.exitCode = 2; process.exit();
}

const KEY = requireKey(HERE);
const rows = await getAll(KEY,
  "lessons?select=slug,language,content_md,mcp_iso_longest_run&slug=eq.05-01-aims-monitoring-and-measurement&language=eq.en");
if (rows.length !== 1) { console.error("expected 1 English row, got " + rows.length); process.exitCode = 2; process.exit(); }
const md = String(rows[0].content_md || "");

console.log("05-01-aims-monitoring-and-measurement (en)");
console.log("  stored mcp_iso_longest_run  " + rows[0].mcp_iso_longest_run);
console.log("  body characters             " + md.length);
console.log("  SEED " + SEED + "   ABS_RUN " + ABS_RUN);
console.log("  index: " + Object.keys(PDFS).join(", "));
console.log("");

const sources = buildSources();
const units = runUnits(md);
console.log("  units measured              " + units.length);
console.log("  sources in the index        " + (Array.isArray(sources) ? sources.length : Object.keys(sources).length));
let worst = 0;
const hits = [];
for (const u of units) {
  const s = score(u, sources);
  const r = s && (s.maxRun !== undefined ? s.maxRun : s.run);
  if (!r) continue;
  if (r > worst) worst = r;
  if (r >= 8) hits.push({ unit: u, s, r });
}
console.log("  longest run found           " + worst);
console.log("  units at or over 8 words    " + hits.length);
console.log("");
hits.sort((a, b) => b.r - a.r);
let n = 0;
for (const h of hits) {
  n++;
  console.log("  --- " + n + ". run " + h.r + "w   " + JSON.stringify(
    Object.fromEntries(Object.entries(h.s).filter(([k, v]) =>
      ["coverage", "source", "bestSource", "runText", "text", "key"].includes(k) && v !== undefined))));
  console.log("      UNIT: " + h.unit.replace(/\s+/g, " ").slice(0, 400));
  console.log("");
}
if (!hits.length) console.log("  nothing at or over 8 words -- the stored run and this measurement DISAGREE.");
