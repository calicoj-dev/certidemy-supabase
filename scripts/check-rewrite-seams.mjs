#!/usr/bin/env node
/**
 * check-rewrite-seams.mjs -- did a span replacement leave a broken sentence?
 *
 * READ-ONLY. No flags. Exit 0 clean, 1 found, 2 could not answer.
 *
 * ============ WHY ============
 *
 * The batch-1 English rewrites replaced a declared span with new prose. One
 * `from` anchor began with the word `assessments`, which was the TAIL of
 * "risk assessments and impact assessments". Replacing it ate the second noun
 * and left the modifier stranded:
 *
 *     ... run risk assessments and impact Clause 8.2 sets two independent
 *     triggers for a risk assessment: the planned intervals, or ...
 *
 * `impact` now dangles. AIMS-F `01-03-the-ai-system-life-cycle` has carried
 * that in its SERVED English since 2026-09-23.
 *
 * And it propagates: the retranslation rendered the orphan as a VERB --
 * "ejecutan evaluaciones de riesgo e impactan", "executam avaliacoes de risco e
 * impactam" -- which is a fluent sentence that says something the English never
 * did. Every gate passed it, because every gate compares the translation with
 * the English and the ENGLISH is the broken party.
 *
 * ============ THE TEST ============
 *
 * A replacement whose text begins with a CAPITAL, spliced into a position where
 * the preceding text ends MID-SENTENCE, is a seam break. That is not a
 * judgement about prose quality; it is two sentence-starts with no boundary
 * between them, which no editor would type.
 *
 * It cannot catch every bad splice -- a lowercase replacement into a broken
 * seam reads as ordinary text to this check, and only a human finds it. Stated
 * so the silence is not read as coverage.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) { console.error("Unrecognised flag: " + a + ". READ-ONLY, no flags."); process.exit(2); }
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
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set -- nothing measured, which is not a pass."); process.exit(2); }
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };

/** Every script that replaced a declared span in an English lesson body. */
const SOURCES = ["apply-rewrites-batch-1.mjs", "apply-0306.mjs",
                 "apply-audit-sentence-rewrite.mjs", "fix-broken-attribution-chain.mjs",
                 "convert-ceiling-breaches.mjs"];

function anchorsFrom(file) {
  const src = readFileSync(join(HERE, file), "utf8");
  const out = [];
  let slug = null;
  for (const m of src.matchAll(
    /slug:\s*"([^"]+)"|^\s*"([a-z0-9][a-z0-9-]{6,})":\s*\[|to:\s*"((?:[^"\\]|\\.)*)"/gm)) {
    if (m[1] !== undefined) { slug = m[1]; continue; }
    if (m[2] !== undefined) { slug = m[2]; continue; }
    if (!slug || m[3] === undefined) continue;
    const t = m[3].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    if (t.length >= 40) out.push({ slug, text: t, file });
  }
  const declared = [...src.matchAll(/to:\s*"((?:[^"\\]|\\.)*)"/g)]
    .filter((m) => m[1].replace(/\\"/g, '"').length >= 40).length;
  if (out.length !== declared) {
    throw new Error(file + ": extracted " + out.length + " of " + declared +
      " declared anchors -- a declaration shape this parser does not know");
  }
  return out;
}

/** A splice is broken when a capital-initial replacement follows text that ends
 *  mid-sentence. Trailing markdown emphasis is not punctuation. */
export function isSeamBreak(before, replacement) {
  const tail = before.replace(/[\s*_`]+$/, "");
  if (!tail) return false;
  if (!/^[A-Z]/.test(replacement)) return false;
  return /[a-z,;]$/.test(tail);
}

/* Controls, from the real instance and its correction. */
const CONTROLS = [
  ["the live 01-03 seam", "run risk assessments and impact", "Clause 8.2 sets two independent triggers", true],
  ["the same seam, repaired", "run risk assessments and impact assessments.", "Clause 8.2 sets two independent triggers", false],
  ["a normal sentence start", "is a life cycle event.", "Clause 8.2 sets two independent triggers", false],
  ["a lowercase continuation", "the organization shall", "determine the boundaries of the system", false],
  ["after a bolded lead-in", "**Assessments repeat.**", "Clause 8.2 sets two independent triggers", false],
];
const wrong = CONTROLS.filter(([, b, r, want]) => isSeamBreak(b, r) !== want).map(([n]) => n);
if (wrong.length) {
  console.error("CONTROL FAILED: " + wrong.join(", "));
  console.error("No verdict printed: a detector that reports by finding reports clean when broken.");
  process.exit(2);
}

let anchors;
try { anchors = SOURCES.filter((f) => existsSync(join(HERE, f))).flatMap(anchorsFrom); }
catch (e) { console.error(String(e.message || e)); process.exit(2); }
if (!anchors.length) { console.error("extracted ZERO anchors -- not a result"); process.exit(2); }

const slugs = [...new Set(anchors.map((a) => a.slug))];
const findings = [];
let located = 0, missing = 0;
for (const slug of slugs) {
  let rows;
  try {
    const r = await fetch(BASE + "/lessons?select=slug,content_md,id&language=eq.en&slug=eq." + slug,
      { headers: H, signal: AbortSignal.timeout(45000) });
    if (!r.ok) throw new Error("HTTP " + r.status);
    rows = await r.json();
  } catch (e) { console.error("could not read " + slug + ": " + String(e).slice(0, 80)); process.exit(2); }
  if (!rows.length) { missing++; continue; }
  const md = rows[0].content_md;
  for (const a of anchors.filter((x) => x.slug === slug)) {
    const i = md.indexOf(a.text);
    if (i < 0) { missing++; continue; }
    located++;
    if (isSeamBreak(md.slice(Math.max(0, i - 90), i), a.text)) {
      findings.push({ slug, file: a.file,
        ctx: (md.slice(Math.max(0, i - 70), i) + " >>> " + a.text.slice(0, 70)).replace(/\s+/g, " ") });
    }
  }
}

console.log("");
console.log("REWRITE SEAMS -- did a span replacement leave two sentence-starts with no boundary?");
console.log("  " + anchors.length + " declared anchor(s) across " + slugs.length + " lesson(s)");
console.log("  " + located + " located in the live English, " + missing + " not found (reported, not assumed clean)");
console.log("DENOMINATOR: " + located + " splice(s) examined");
if (!findings.length) {
  console.log("  none.");
} else {
  for (const f of findings) {
    console.log("  BREAK  " + f.slug + "   [" + f.file + "]");
    console.log("         " + f.ctx);
  }
  console.log("");
  console.log("The ENGLISH is the broken party here, so every translation gate passes: they compare");
  console.log("a translation against its English and the English is what is wrong. Repair the");
  console.log("English before retranslating, or the break is carried faithfully into both languages.");
  process.exitCode = 1;
}
