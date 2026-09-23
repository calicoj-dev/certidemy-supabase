#!/usr/bin/env node
/**
 * fix-broken-attribution-chain.mjs -- prose inserted INSIDE a quotation block
 * must carry the citation itself.
 *
 * WRITES. `--apply`; DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ WHAT THE CONVERSION BATCH BROKE ============
 *
 * `convert-ceiling-breaches` replaced an over-ceiling blockquote line with a
 * short quotation plus our sentence. Where the replaced line sat in the MIDDLE
 * of a multi-line quotation, the inserted prose became the new LEAD-IN for
 * every quote line beneath it -- and our sentence carried no citation, so the
 * rest of clause 10.2 was judged unattributed and `isms-ia-05-05` came back
 * refused at 18w.
 *
 * The 18w span is a real reproduction of 42001 and it was always there. It had
 * been exempt because the block above it was attributed; the repair cut the
 * chain, not the text.
 *
 * > **PROSE INSERTED INTO A QUOTATION BLOCK INHERITS THE BLOCK'S JOB.** It is
 * > the lead-in for everything below it, so it must name the clause. A
 * > conversion that explains a quotation in the middle of one has to re-state
 * > the citation, or it silently un-attributes the remainder.
 *
 * Same family as the segmenter defect an hour earlier: an edit made for one
 * span removed the evidence a NEIGHBOURING span depended on.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSources, norm, assertCanary, SEED } from "./lib/leak-score.mjs";
import { isAttributed, isQuoteLine, ADDRESS_RE, QUOTATION_CEILING } from "./lib/iso-segments.mjs";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". DRY BY DEFAULT; --apply to write."); process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");
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
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };

const EDITS = [
  {
    slug: "isms-ia-05-05-fixing-it-and-fixing-it",
    find: "The clause names three steps inside that evaluation:",
    replace:
      "Clause 10.2 b) names three steps inside that evaluation: reviewing what " +
      "happened, determining what caused it, and asking whether anything similar " +
      "already exists or could arise somewhere else. The clause then continues:",
  },
  {
    slug: "isms-ia-04-03-the-whole-of-clause-6",
    find: "The note goes on to direct users to Annex A as a completeness check",
    replace:
      "Clause 6.1.3's NOTE 2 goes on to direct users to Annex A as a completeness " +
      "check - a way of confirming that nothing necessary was missed, rather than a " +
      "menu to select from. NOTE 3 adds:",
  },
];

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

/** The worst REFUSABLE span: unattributed over the floor, or attributed over the ceiling. */
function worstRefusable(md) {
  const lines = String(md || "").split(/\r?\n/);
  let leadIn = "", worst = 0, worstText = "", why = "";
  for (const raw of lines) {
    const t = raw.trim();
    if (!t) continue;
    const quote = isQuoteLine(raw);
    const body = quote ? raw.replace(/^\s*>\s?/, "") : raw;
    const r = longest(body);
    if (r.best) {
      const attributed = isAttributed(raw, leadIn);
      const refusable = attributed ? r.best > QUOTATION_CEILING : r.best >= 10;
      if (refusable && r.best > worst) {
        worst = r.best; worstText = r.bestText;
        why = attributed ? "attributed, over ceiling" : "UNATTRIBUTED, over floor";
      }
    }
    if (!quote) leadIn = t;
  }
  return { worst, worstText, why };
}

const slugs = [...new Set(EDITS.map((e) => e.slug))];
const rows = await (await fetch(
  BASE + "/lessons?select=id,slug,content_md&language=eq.en&slug=in.(" + slugs.join(",") + ")",
  { headers: H })).json();
const bySlug = new Map(rows.map((r) => [r.slug, r]));

console.log("");
console.log("ATTRIBUTION-CHAIN REPAIR");
let bad = 0;
const staged = new Map();
for (const e of EDITS) {
  const row = bySlug.get(e.slug);
  if (!row) { console.log("  MISS  " + e.slug + " not found"); bad++; continue; }
  const cur = staged.get(e.slug) ?? row.content_md;
  const lines = cur.split(/\r?\n/);
  const n = lines.filter((l) => l.includes(e.find)).length;
  if (n !== 1) { console.log("  MISS  " + e.slug + " -- " + n + " anchor matches"); bad++; continue; }
  /* The replacement must itself be a citation, or it repeats the defect. */
  if (!ADDRESS_RE.test(e.replace)) {
    console.log("  FAIL  " + e.slug + " -- the replacement carries no clause address");
    bad++; continue;
  }
  const idx = lines.findIndex((l) => l.includes(e.find));
  lines.splice(idx, 1, e.replace);
  staged.set(e.slug, lines.join("\n"));
}

for (const slug of slugs) {
  const was = worstRefusable(bySlug.get(slug).content_md);
  const now = worstRefusable(staged.get(slug) ?? bySlug.get(slug).content_md);
  const ok = now.worst === 0;
  if (!ok) bad++;
  console.log("  " + (ok ? "ok   " : "FAIL ") + slug);
  console.log("        before: " + (was.worst ? was.worst + "w  " + was.why : "clean"));
  console.log("        after : " + (now.worst ? now.worst + "w  " + now.why + "  " + now.worstText.slice(0, 90) : "clean"));
}

if (bad) { console.log(""); console.log("ABORT: " + bad + " problem(s). Nothing written."); process.exit(1); }
if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

let fail = 0;
for (const slug of slugs) {
  const row = bySlug.get(slug);
  const body = staged.get(slug);
  const r = await fetch(BASE + "/lessons?id=eq." + row.id, {
    method: "PATCH", headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ content_md: body }),
  });
  if (!r.ok) { console.log("  FAIL  " + slug + " HTTP " + r.status); fail++; continue; }
  const after = (await r.json())[0];
  const w = worstRefusable(after.content_md);
  const ok = after.content_md === body && w.worst === 0;
  console.log("  " + (ok ? "PASS  " : "FAIL  ") + slug + "   refusable now: " + (w.worst || "none"));
  if (!ok) fail++;
}
process.exit(fail ? 1 : 0);
