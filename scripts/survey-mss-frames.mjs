#!/usr/bin/env node
/**
 * survey-mss-frames.mjs -- which constructions do our near-floor runs keep
 * reaching for, and are they the same few?
 *
 * READ-ONLY. Takes --json. Unknown flags exit 2. Recommends; changes nothing.
 *
 * ============ WHY ============
 *
 * `aia-interested-party-requirements` reproduced *determine the interested
 * parties relevant to the AI management system* (42001 cl.4.2). The rewrite
 * batch's #9 reproduced *determine the internal and external communications
 * relevant to the AI management system* (cl.7.4). Same frame, different
 * clause:
 *
 *     determine the ___ relevant to the ___
 *
 * That is harmonised management-system boilerplate. It recurs across clauses
 * and across standards, it is the natural English for the thing, and it is
 * what a rewrite reaches for precisely BECAUSE it is natural.
 *
 * So the question is not whether any one span reproduces. It is whether a
 * small number of frames account for most of what we keep tripping over -- in
 * which case knowing them is worth something -- or whether it is a long tail,
 * in which case a frame list is busywork.
 *
 * ============ WHAT COUNTS AS A FRAME ============
 *
 * A matched run that (a) we produce MORE THAN ONCE across the corpus, or
 * (b) appears in MORE THAN ONE indexed standard. The second is the stronger
 * signal: a phrase present in 27001 and 42001 and 27002 is boilerplate by
 * definition, and a reproduction of it is not evidence that anyone copied from
 * any particular document.
 *
 * Reported with counts, because a recommendation without the number behind it
 * is the thing this repository keeps having to withdraw.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSources, score, matchingSources, runUnits, MIN_RUN } from "./lib/leak-score.mjs";

const KNOWN = new Set(["--json"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
}
const JSON_OUT = process.argv.includes("--json");
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

/* Every English body we serve: lesson bodies and concept descriptions. The
 * NAME is excluded -- a concept name is supposed to be the defined term, and
 * counting it would fill the survey with correct titles. */
const lessons = (await allRows("lessons?select=slug,language,content_md")).filter((l) => l.language === "en");
const concepts = (await allRows("concepts?select=slug,description,retired_at")).filter((c) => !c.retired_at);
const bodies = [
  ...lessons.map((l) => ({ kind: "lesson", slug: l.slug, text: l.content_md || "" })),
  ...concepts.map((c) => ({ kind: "concept", slug: c.slug, text: c.description || "" })),
];

/* Collect every matched run at or above the noise floor, per unit. */
const seen = new Map();
for (const b of bodies) {
  for (const unit of runUnits(b.text)) {
    for (const [key, src] of sources) {
      const s = score(unit, new Map([[key, src]]));
      for (const r of s.runs ?? []) {
        if (r.len < MIN_RUN) continue;
        const rec = seen.get(r.text) ?? { text: r.text, len: r.len, uses: 0, where: new Set() };
        rec.uses++; rec.where.add(b.kind + ":" + b.slug);
        seen.set(r.text, rec);
      }
    }
  }
}

const frames = [...seen.values()].map((r) => ({
  ...r, where: [...r.where], docs: matchingSources(r.text, sources),
})).filter((r) => r.uses > 1 || r.docs.length > 1);

frames.sort((a, b) => (b.docs.length - a.docs.length) || (b.uses - a.uses) || (b.len - a.len));

const total = [...seen.values()].reduce((n, r) => n + r.uses, 0);
const covered = frames.reduce((n, r) => n + r.uses, 0);

console.log("");
console.log("MSS FRAME SURVEY -- recommends, changes nothing");
console.log("");
console.log("  English bodies scanned          " + bodies.length + "   (" + lessons.length + " lessons, " + concepts.length + " concepts)");
console.log("  distinct matched runs >= " + MIN_RUN + "w     " + seen.size);
console.log("  total run occurrences           " + total);
console.log("");
console.log("  FRAMES -- reused by us, or present in more than one standard: " + frames.length);
console.log("  they account for " + covered + " of " + total + " occurrences (" + (100 * covered / total).toFixed(0) + "%)");
const top20 = frames.slice(0, 20).reduce((n, r) => n + r.uses, 0);
console.log("  the TOP TWENTY account for " + top20 + " (" + (100 * top20 / total).toFixed(0) + "%)");
console.log("");
console.log("  docs  uses  len  frame");
for (const f of frames.slice(0, 25)) {
  console.log("  " + String(f.docs.length).padStart(4) + String(f.uses).padStart(6) + String(f.len).padStart(5) + "  " +
    f.text.slice(0, 74) + (f.docs.length > 1 ? "   [" + f.docs.join(", ") + "]" : ""));
}

if (JSON_OUT) {
  writeFileSync(join(ROOT, "MSS-FRAMES.json"), JSON.stringify({
    measured: new Date().toISOString(), bodies: bodies.length, distinctRuns: seen.size,
    totalOccurrences: total, frames: frames.length, coveredOccurrences: covered,
    top: frames.slice(0, 60),
  }, null, 2), "utf8");
  console.log("");
  console.log("  wrote MSS-FRAMES.json");
}
