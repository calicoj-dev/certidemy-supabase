#!/usr/bin/env node
/**
 * size-reemit.mjs -- how much of a stale batch actually has to be re-translated.
 *
 * READ-ONLY. `--spec <file>` (default BATCH1-RETRANSLATION.json). Unknown flags
 * exit 2.
 *
 * Eight renderings were emitted from English that has since changed. At BLOCK
 * grain that is eight blocks to re-emit and eight to re-read. But a checkpoint
 * block is 24 fields and the English moved in one of them, so the field grain
 * should shrink the work -- and this measures by how much rather than asserting
 * it.
 *
 * A rendering with a HAND-WRITTEN replacement does not need re-emission at all:
 * the string is the replacement, and the stale `english_source` only matters for
 * the record and for the gates that compare against it.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkpointFields } from "./lib/checkpoint-fields.mjs";

const KNOWN = new Set(["--spec"]);
const argv = process.argv.slice(2);
for (const a of argv) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error("Unrecognised flag: " + a); process.exit(2); }
}
const i = argv.indexOf("--spec");
const SPEC = i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : "BATCH1-RETRANSLATION.json";

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

/* Renderings PROMPT-55 supplied a hand-written replacement for. Declared BY
 * NAME, never inferred from shape. */
const HAND_WRITTEN = new Set([
  "01-03-the-ai-system-life-cycle|es-419|14", "01-03-the-ai-system-life-cycle|pt-BR|14",
  "02-06-the-ai-system-impact-assessment|pt-BR|9",
  "03-01-resources-and-competence|pt-BR|11",
  "03-02-awareness-and-communication|es-419|9", "03-02-awareness-and-communication|pt-BR|9",
  "03-04-operational-planning-and-control|es-419|2", "03-04-operational-planning-and-control|pt-BR|2",
  "isms-ia-04-02-demonstrated-not-stated|es-419|16", "isms-ia-04-02-demonstrated-not-stated|pt-BR|16",
]);

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
const liveEn = new Map();
for (const s of slugs) {
  const r = await rest("lessons?select=slug,content_md&language=eq.en&slug=eq." + s);
  if (r[0]) liveEn.set(s, r[0].content_md);
}

console.log("");
console.log("SIZING THE RE-EMIT -- " + SPEC);
console.log("DENOMINATOR: " + spec.rows.length + " rendering(s)");
console.log("");

let blocksStale = 0, handled = 0, needTranslate = 0, fieldsStale = 0, fieldsTotal = 0;
for (const r of spec.rows) {
  const body = liveEn.get(r.slug) || "";
  if (body.includes(r.english_source)) continue;
  blocksStale++;
  const key = r.slug + "|" + r.language + "|" + r.block_index;
  const tag = (r.slug + " " + r.language + " b" + r.block_index).padEnd(52);
  if (HAND_WRITTEN.has(key)) {
    handled++;
    console.log("  HAND-WRITTEN  " + tag + "no re-translation; the string is the replacement");
    continue;
  }
  const enFields = checkpointFields(r.english_source);
  if (!enFields) {
    needTranslate++;
    console.log("  RE-EMIT       " + tag + "prose block, whole block re-translates");
    continue;
  }
  /* A checkpoint: only the FIELDS whose English text is gone need redoing. */
  fieldsTotal += enFields.length;
  const gone = enFields.filter((f) => !body.includes(f.text));
  fieldsStale += gone.length;
  needTranslate += gone.length ? 1 : 0;
  console.log("  RE-EMIT       " + tag + gone.length + " of " + enFields.length + " field(s) stale");
  for (const g of gone) console.log("                    " + g.path);
}

console.log("");
console.log("  " + blocksStale + " stale rendering(s): " + handled + " hand-written, " +
  needTranslate + " needing re-translation");
if (fieldsTotal) {
  console.log("  checkpoint fields: " + fieldsStale + " of " + fieldsTotal + " stale -- " +
    "block grain would re-translate all " + fieldsTotal);
}
