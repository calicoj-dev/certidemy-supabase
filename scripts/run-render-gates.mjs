#!/usr/bin/env node
/**
 * run-render-gates.mjs -- G1 to G7 over a batch spec, as a table.
 *
 * READ-ONLY. `--spec <file>` (default BATCH1-RETRANSLATION.json), `--md <file>`
 * to write the table. Unknown flags exit 2.
 *
 * Run it over the AS-EMITTED batch first: every gate must fire on the rendering
 * it was written from, or it is not a gate. Then over the corrected batch,
 * which must come out clean.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runRenderGates, lessonClauseWord, renderGateControls } from "./lib/render-gates.mjs";

const KNOWN = new Set(["--spec", "--md"]);
const argv = process.argv.slice(2);
for (const a of argv) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error("Unrecognised flag: " + a); process.exit(2); }
}
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const SPEC = val("--spec", "BATCH1-RETRANSLATION.json");
const MD = val("--md", "");

const broken = renderGateControls();
if (broken.length) {
  console.error("FIXTURE FAILURES: " + broken.join("; "));
  console.error("No verdict printed: a gate that does not fire on its own example is not a gate.");
  process.exit(2);
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

async function rest(path) {
  let last;
  for (let k = 0; k < 6; k++) {
    try {
      const r = await fetch(BASE + "/" + path, { headers: H, signal: AbortSignal.timeout(45000) });
      if (r.ok) return r.json();
      last = new Error("HTTP " + r.status);
    } catch (e) { last = e; }
    await new Promise((s) => setTimeout(s, 300 * (k + 1)));
  }
  throw last;
}

const spec = JSON.parse(readFileSync(join(ROOT, SPEC), "utf8"));
const slugs = [...new Set(spec.rows.map((r) => r.slug))];
const bodies = new Map();
for (const s of slugs) {
  for (const r of await rest("lessons?select=slug,language,content_md&slug=eq." + s)) {
    bodies.set(r.slug + "|" + r.language, r.content_md);
  }
}

const rows = [];
for (const r of spec.rows) {
  const body = bodies.get(r.slug + "|" + r.language) || "";
  /* The house clause word comes from the body MINUS the block being replaced,
   * so a replacement cannot vote for its own spelling. */
  const rest0 = body.split(r.from_block).join(" ");
  /* PER LEVEL, and computed from the body MINUS the block being replaced so a
   * replacement cannot vote for its own spelling. */
  const house = {
    whole: lessonClauseWord(rest0, r.language, "whole"),
    dotted: lessonClauseWord(rest0, r.language, "dotted"),
  };
  const flags = runRenderGates(r.english_source, r.to_block, r.language, {
    houseClauseWord: house,
    existingTranslation: body,
  });
  rows.push({ slug: r.slug, lang: r.language, block: r.block_index, flags, house });
}

const GATES = ["G1", "G2", "G3", "G4", "G5", "G6", "G7"];
const tally = Object.fromEntries(GATES.map((g) => [g, 0]));
for (const r of rows) for (const f of r.flags) tally[f.gate]++;

const out = [];
const push = (s) => { out.push(s); console.log(s); };
push("");
push("RENDER GATES over " + SPEC + " -- " + rows.length + " rendering(s)");
push("  24 fixtures behave; every gate fires on the rendering it was written from");
push("DENOMINATOR: " + rows.length + " rendering(s) examined");
push("");
push("  " + "slug / lang / block".padEnd(52) + GATES.join("  "));
for (const r of rows) {
  const hit = (g) => (r.flags.some((f) => f.gate === g) ? " X" : " .");
  push("  " + (r.slug + " " + r.lang + " b" + r.block).padEnd(52) + GATES.map(hit).join("  "));
}
push("");
push("  totals: " + GATES.map((g) => g + "=" + tally[g]).join("  "));
push("  clean renderings: " + rows.filter((r) => !r.flags.length).length + " of " + rows.length);
push("");
for (const r of rows.filter((x) => x.flags.length)) {
  push("  " + r.slug + " " + r.lang + " b" + r.block);
  for (const f of r.flags) push("      " + f.gate + "  " + f.detail);
}

if (MD) {
  const md = ["# Render gates G1-G7 over `" + SPEC + "`", "",
    "24 fixtures behave, each drawn from a rendering the read rejected, each with its",
    "correction as the paired negative. A gate that does not fire on its own example is not",
    "a gate.", "",
    "| rendering | " + GATES.join(" | ") + " |",
    "|---|" + GATES.map(() => "---").join("|") + "|"];
  for (const r of rows) {
    md.push("| `" + r.slug + "` " + r.lang + " b" + r.block + " | " +
      GATES.map((g) => (r.flags.some((f) => f.gate === g) ? "**X**" : "")).join(" | ") + " |");
  }
  md.push("", "**Totals:** " + GATES.map((g) => g + " = " + tally[g]).join(", ") +
    ". Clean: " + rows.filter((r) => !r.flags.length).length + " of " + rows.length + ".", "");
  for (const r of rows.filter((x) => x.flags.length)) {
    md.push("- `" + r.slug + "` " + r.lang + " b" + r.block);
    for (const f of r.flags) md.push("  - **" + f.gate + "** " + f.detail);
  }
  md.push("");
  writeFileSync(join(ROOT, MD), md.join("\n"), "utf8");
  console.log("");
  console.log("  wrote " + MD);
}
process.exitCode = rows.some((r) => r.flags.length) ? 1 : 0;
