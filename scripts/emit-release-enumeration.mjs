#!/usr/bin/env node
/**
 * emit-release-enumeration.mjs -- the rows the position-extension fix would
 * move toward SERVED, enumerated with their text before anything is deployed.
 *
 * READ-ONLY. Takes --out <path>. Unknown flags exit 2. Writes a markdown
 * report and nothing else.
 *
 * ============ WHY AN ENUMERATION AND NOT A COUNT ============
 *
 * The fix is monotone toward served: 20 fires stop, 0 begin. A change that can
 * only move rows toward WITHHELD ships on its controls, because the worst case
 * is over-withholding -- visible, reversible, and costing only availability. A
 * change that can move ANY row toward served has the opposite failure mode:
 * text nobody cleared reaching a partner. So every such row is read first.
 *
 * ============ AND THIS IS THE POPULATION WHERE A COUNT IS WORTH LEAST =====
 *
 * The median overstatement is ONE WORD. So most of these rows carry a real,
 * verbatim, contiguous run of NINE words of ISO text -- one word under the
 * floor -- that was reported as ten and is about to be reported as nine. The
 * mechanical verdict changes; the text does not. Nothing about "9 is under 10"
 * is a statement that the row is fine, and that is exactly why the spans go in
 * front of a person rather than into a summary line.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSources, runUnits, norm, assertCanary, SEED, ABS_RUN } from "./lib/leak-score.mjs";
import { segments, attributedQuote } from "./lib/iso-segments.mjs";

const KNOWN = new Set(["--out"]);
const argv = process.argv.slice(2);
let OUT = "RELEASE-ENUMERATION.md";
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) continue;
  if (!KNOWN.has(a)) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
  if (a === "--out") OUT = argv[++i];
}
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };

async function allRows(path) {
  const out = []; let from = 0, total = null;
  for (;;) {
    const r = await fetch(BASE + "/" + path, { headers: { ...H, Range: from + "-" + (from + 499), Prefer: "count=exact" } });
    if (!r.ok) throw new Error("HTTP " + r.status + " on " + path);
    total = Number(String(r.headers.get("content-range") || "").split("/")[1]);
    const page = await r.json(); out.push(...page);
    if (out.length >= total || page.length === 0) break;
    from += 500;
  }
  if (out.length !== total) throw new Error("SHORT READ on " + path + ": " + out.length + " of " + total);
  return out;
}

const sources = buildSources();
assertCanary(sources);

function chained(words, src) {
  let best = 0, text = "";
  for (let i = 0; i + SEED <= words.length; i++) {
    if (!src.grams.has(words.slice(i, i + SEED).join(" "))) continue;
    let n = SEED;
    while (i + n + 1 <= words.length && src.grams.has(words.slice(i + n + 1 - SEED, i + n + 1).join(" "))) n++;
    if (n > best) { best = n; text = words.slice(i, i + n).join(" "); }
  }
  return { best, text };
}
function contiguous(words, src) {
  let best = 0, text = "";
  for (let i = 0; i + SEED <= words.length; i++) {
    const cands = src.at.get(words.slice(i, i + SEED).join(" "));
    if (!cands || !cands.length) continue;
    let n = 0;
    for (const p of cands) {
      let k = 0;
      while (i + k < words.length && src.words[p + k] === words[i + k]) k++;
      if (k > n) n = k;
    }
    if (n > best) { best = n; text = words.slice(i, i + n).join(" "); }
  }
  return { best, text };
}

const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const modules = await allRows("modules?select=id,certification_id");
const certOfModule = new Map(modules.map((m) => [m.id, codeOf.get(m.certification_id)]));
const lessons = await allRows("lessons?select=id,slug,language,content_md,module_id,lesson_group_id,mcp_servable,mcp_iso_longest_run");
const en = lessons.filter((l) => l.language === "en");

/* Group state, because the verdict is per group and a release moves all three
 * language rows at once. */
const groupRows = new Map();
for (const l of lessons) {
  const k = l.lesson_group_id ?? ("SOLO:" + l.id);
  if (!groupRows.has(k)) groupRows.set(k, []);
  groupRows.get(k).push(l);
}

const out = [];
for (const l of en) {
  for (const seg of segments(l.content_md || "", attributedQuote)) {
    for (const unit of runUnits(seg)) {
      const w = norm(unit).split(" ").filter(Boolean);
      if (w.length < SEED) continue;
      let A = { best: 0, text: "" }, B = { best: 0, text: "" }, aSrc = "", bSrc = "";
      for (const [key, src] of sources) {
        const a = chained(w, src); if (a.best > A.best) { A = a; aSrc = key; }
        const b = contiguous(w, src); if (b.best > B.best) { B = b; bSrc = key; }
      }
      /* The releasing population: over the floor as reported, under it in truth. */
      if (A.best >= ABS_RUN && B.best < ABS_RUN) {
        const k = l.lesson_group_id ?? ("SOLO:" + l.id);
        const sibs = groupRows.get(k) || [];
        out.push({
          cert: certOfModule.get(l.module_id) || "?", slug: l.slug,
          reported: A.best, reportedText: A.text, reportedSrc: aSrc,
          actual: B.best, actualText: B.text, actualSrc: bSrc,
          unit, languages: sibs.map((s) => s.language).sort().join(", "),
          servingNow: sibs.filter((s) => s.mcp_servable === true).length,
          rowsInGroup: sibs.length,
        });
      }
    }
  }
}
out.sort((a, b) => b.reported - a.reported || a.cert.localeCompare(b.cert));

const lines = [];
lines.push("# Release enumeration -- the position-extension fix");
lines.push("");
lines.push("**Nothing here is deployed.** These are the rows the fix moves toward SERVED,");
lines.push("read before the change rather than after it.");
lines.push("");
lines.push("The fix stops a run being extended through text the source does not continue.");
lines.push("It is monotone: 20 fires stop, **0 begin**. Chaining could only ever inflate.");
lines.push("");
lines.push("**The median overstatement is one word.** Most of these rows carry a real,");
lines.push("verbatim, contiguous run of NINE words of an ISO standard -- one word under the");
lines.push("floor. The mechanical verdict changes. The text does not.");
lines.push("");
lines.push("| # | cert | lesson | reported | true | source |");
lines.push("|---|---|---|---|---|---|");
out.forEach((r, i) => {
  lines.push("| " + (i + 1) + " | " + r.cert + " | `" + r.slug + "` | " + r.reported + "w | **" +
    r.actual + "w** | " + r.actualSrc + " |");
});
lines.push("");
lines.push("---");
lines.push("");
out.forEach((r, i) => {
  lines.push("## " + (i + 1) + ". " + r.cert + " / `" + r.slug + "`");
  lines.push("");
  lines.push("- reported **" + r.reported + "w** against " + r.reportedSrc + ", true contiguous **" +
    r.actual + "w** against " + r.actualSrc);
  lines.push("- group carries " + r.rowsInGroup + " row(s) (" + r.languages + "); " +
    r.servingNow + " serving now");
  lines.push("");
  lines.push("**Reported run (" + r.reported + "w) -- the chained one, which exists nowhere:**");
  lines.push("");
  lines.push("> " + r.reportedText);
  lines.push("");
  lines.push("**True contiguous run (" + r.actual + "w), verbatim in " + r.actualSrc + ":**");
  lines.push("");
  lines.push("> " + r.actualText);
  lines.push("");
  lines.push("**Our paragraph:**");
  lines.push("");
  lines.push("> " + r.unit.slice(0, 900).replace(/\n/g, " "));
  lines.push("");
});

writeFileSync(join(ROOT, OUT), lines.join("\n"), "utf8");
console.log("");
console.log("RELEASE ENUMERATION");
console.log("  rows that move toward served   " + out.length);
console.log("  distinct lessons               " + new Set(out.map((r) => r.slug)).size);
console.log("  true run still at 9w           " + out.filter((r) => r.actual === 9).length);
console.log("  true run below 9w              " + out.filter((r) => r.actual < 9).length);
console.log("");
console.log("  wrote " + OUT);
