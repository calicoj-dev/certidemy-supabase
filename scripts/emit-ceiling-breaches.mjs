#!/usr/bin/env node
/**
 * emit-ceiling-breaches.mjs -- the attributed quotations over the 25-word
 * ceiling, with the lines around them, so they can be converted.
 *
 * READ-ONLY. Takes --out <path>. Unknown flags exit 2.
 *
 * A conversion is NOT a truncation. A 52-word quotation cut to 25 by deleting
 * its tail is worse teaching than a 20-word quotation plus our own sentence
 * saying what the clause requires. The point of the ceiling is that we EXPLAIN
 * rather than DELIVER, so each of these comes back as a short quotation plus
 * our sentence -- and the sentence carries the examinable distinction.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSources, norm, assertCanary, SEED } from "./lib/leak-score.mjs";
import { isAttributed, isQuoteLine, QUOTATION_CEILING } from "./lib/iso-segments.mjs";

const KNOWN = new Set(["--out"]);
const argv = process.argv.slice(2);
let OUT = "CEILING-BREACHES.md";
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

function longest(text) {
  const w = norm(text).split(" ").filter(Boolean);
  let best = 0, bestText = "", bestSrc = "";
  for (const [key, src] of sources) {
    for (let i = 0; i + SEED <= w.length; i++) {
      const cands = src.at.get(w.slice(i, i + SEED).join(" "));
      if (!cands) continue;
      let n = 0;
      for (const p of cands) {
        let k = 0;
        while (i + k < w.length && src.words[p + k] === w[i + k]) k++;
        if (k > n) n = k;
      }
      if (n > best) { best = n; bestText = w.slice(i, i + n).join(" "); bestSrc = key; }
    }
  }
  return { best, bestText, bestSrc };
}

const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const modules = await allRows("modules?select=id,certification_id");
const certOfModule = new Map(modules.map((m) => [m.id, codeOf.get(m.certification_id)]));
const lessons = (await allRows("lessons?select=slug,language,content_md,module_id"))
  .filter((l) => l.language === "en");

const hits = [];
for (const l of lessons) {
  const cert = certOfModule.get(l.module_id) || "?";
  const lines = String(l.content_md || "").split(/\r?\n/);
  let leadIn = "", leadIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i], t = raw.trim();
    if (!t) continue;
    const quote = isQuoteLine(raw);
    const body = quote ? raw.replace(/^\s*>\s?/, "") : raw;
    const r = longest(body);
    if (r.best > QUOTATION_CEILING && isAttributed(raw, leadIn)) {
      hits.push({ cert, slug: l.slug, i, run: r.best, src: r.bestSrc, runText: r.bestText,
                  line: raw, leadIn, leadIdx,
                  before: lines.slice(Math.max(0, i - 4), i).filter((x) => x.trim()),
                  after: lines.slice(i + 1, i + 4).filter((x) => x.trim()) });
    }
    if (!quote) { leadIn = t; leadIdx = i; }
  }
}
hits.sort((a, b) => b.run - a.run);

const out = [];
out.push("# Attributed quotations over the " + QUOTATION_CEILING + "-word ceiling");
out.push("");
out.push("**" + hits.length + " spans, " + hits.reduce((n, h) => n + h.run, 0) + " quoted words, across " +
  new Set(hits.map((h) => h.slug)).size + " lessons.**");
out.push("");
out.push("Every one is properly attributed. What they breach is a ceiling ruled today.");
out.push("A conversion is not a truncation: each comes back as a SHORT QUOTATION plus OUR");
out.push("SENTENCE, and the sentence carries the examinable distinction.");
out.push("");
for (const [i, h] of hits.entries()) {
  out.push("## " + (i + 1) + ". " + h.cert + " / `" + h.slug + "` -- " + h.run + "w of " + h.src);
  out.push("");
  out.push("**Lead-in (line " + h.leadIdx + "):** " + (h.leadIn || "*(none)*"));
  out.push("");
  out.push("**Context before:**");
  out.push("");
  for (const b of h.before) out.push("    " + b.slice(0, 300));
  out.push("");
  out.push("**THE LINE (line " + h.i + "):**");
  out.push("");
  out.push("    " + h.line.slice(0, 1400));
  out.push("");
  out.push("**Matched run (" + h.run + "w):** " + h.runText);
  out.push("");
  out.push("**Context after:**");
  out.push("");
  for (const a of h.after) out.push("    " + a.slice(0, 300));
  out.push("");
}
writeFileSync(join(ROOT, OUT), out.join("\n"), "utf8");
console.log("");
console.log("CEILING BREACHES: " + hits.length + " spans, " + hits.reduce((n, h) => n + h.run, 0) + " words");
for (const h of hits) console.log("  " + String(h.run).padStart(3) + "w  " + h.cert.padEnd(9) + h.slug);
console.log("");
console.log("  wrote " + OUT);
