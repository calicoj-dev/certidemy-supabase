#!/usr/bin/env node
/**
 * gate-existing-translations.mjs -- what the gates say about the text that is
 * ALREADY SERVING.
 *
 * READ-ONLY. `--spec <file>` (default BATCH1-RETRANSLATION.json), `--md <file>`.
 * Unknown flags exit 2.
 *
 * Writing an old translation back byte for byte is the right move when the
 * English never moved -- it discards whatever the regeneration drifted. But it
 * is not a clearance: a defect the gates flag in the OLD text was there before
 * this batch and will be there after it.
 *
 * So the old text is gated too, and its findings are reported as PRE-EXISTING.
 * Folding them in with the batch's own findings would credit this batch with
 * defects it did not cause; omitting them would carry unreviewed text under
 * cover of a clean run. They are a third list.
 *
 * NAMED PINS ARE SEPARATED FROM EVERYTHING ELSE, because only a named pin has a
 * mechanical fix. G4 and G7 say which word the house uses; the repair is a
 * substitution with an authority behind it. Every other gate reports a judgement
 * a person has to make, and those go to the director rather than into a batch.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runRenderGates, lessonClauseWord, renderGateControls } from "./lib/render-gates.mjs";
import { pairCheckpointFields, checkpointControls } from "./lib/checkpoint-fields.mjs";

const KNOWN = new Set(["--spec", "--md"]);
const argv = process.argv.slice(2);
for (const a of argv) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error("Unrecognised flag: " + a); process.exit(2); }
}
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const SPEC = val("--spec", "BATCH1-RETRANSLATION.json");
const MD = val("--md", "");

const broken = [...renderGateControls(), ...checkpointControls()];
if (broken.length) { console.error("FIXTURE FAILURES: " + broken.join("; ")); process.exit(2); }

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

/* A named pin has a mechanical repair with an authority behind it. Everything
 * else is a judgement and goes to a person. */
const MECHANICAL = new Set(["G4", "G7"]);

const spec = JSON.parse(readFileSync(join(ROOT, SPEC), "utf8"));
const slugs = [...new Set(spec.rows.map((r) => r.slug))];
const bodies = new Map();
for (const s of slugs) {
  for (const r of await rest("lessons?select=slug,language,content_md&slug=eq." + s)) {
    bodies.set(r.slug + "|" + r.language, r.content_md);
  }
}

const out = [];
const push = (s) => { out.push(s); console.log(s); };
push("");
push("GATES OVER THE TEXT THAT IS ALREADY SERVING -- " + SPEC);
push("  findings here are PRE-EXISTING: this batch neither caused them nor fixes them");
push("DENOMINATOR: " + spec.rows.length + " existing rendering(s) examined");
push("");

const pins = [], judgements = [];
for (const r of spec.rows) {
  const body = bodies.get(r.slug + "|" + r.language) || "";
  const rest0 = body.split(r.from_block).join(" ");
  const opts = {
    houseClauseWord: {
      whole: lessonClauseWord(rest0, r.language, "whole"),
      dotted: lessonClauseWord(rest0, r.language, "dotted"),
    },
    existingTranslation: body,
  };
  const tag = r.slug + " " + r.language + " b" + r.block_index;
  /* The OLD translation is r.from_block. Gate it against the English it was made
   * from, at whatever grain the block supports. */
  const paired = pairCheckpointFields(r.english_source, r.from_block);
  let flags;
  if (paired) {
    flags = [];
    for (const f of paired.pairs) {
      for (const g of runRenderGates(f.en, f.tr, r.language, opts)) {
        flags.push({ ...g, detail: f.path + ": " + g.detail, path: f.path });
      }
    }
  } else {
    flags = runRenderGates(r.english_source, r.from_block, r.language, opts);
  }
  for (const f of flags) (MECHANICAL.has(f.gate) ? pins : judgements).push({ tag, ...f });
}

push("  NAMED PINS -- mechanical repair, fixable in this batch (" + pins.length + ")");
if (!pins.length) push("      none");
for (const p of pins) push("      " + p.gate + "  " + p.tag + "  " + p.detail);
push("");
push("  JUDGEMENTS -- for the director, not for a batch (" + judgements.length + ")");
if (!judgements.length) push("      none");
for (const j of judgements) push("      " + j.gate + "  " + j.tag + "  " + j.detail);
push("");
push("  " + pins.length + " named-pin finding(s), " + judgements.length + " judgement(s)");

if (MD) {
  const md = ["# Pre-existing defects in the text already serving", "",
    "Writing an old translation back byte for byte discards the regeneration's drift. It is",
    "not a clearance: anything the gates flag here was there before this batch and will be",
    "there after it. Named pins (G4, G7) have a mechanical repair with an authority behind",
    "them. Everything else is a judgement.", "",
    "## Named pins -- fixable in this batch (" + pins.length + ")", ""];
  for (const p of pins) md.push("- **" + p.gate + "** `" + p.tag + "` — " + p.detail);
  md.push("", "## Judgements -- for the director (" + judgements.length + ")", "");
  for (const j of judgements) md.push("- **" + j.gate + "** `" + j.tag + "` — " + j.detail);
  md.push("");
  writeFileSync(join(ROOT, MD), md.join("\n"), "utf8");
  console.log("");
  console.log("  wrote " + MD);
}
