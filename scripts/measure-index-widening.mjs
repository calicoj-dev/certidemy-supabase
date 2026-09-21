#!/usr/bin/env node
/**
 * measure-index-widening.mjs - score the same rows against the OLD index and
 * the NEW one, and report the delta.
 *
 * READ-ONLY. No --apply, no --dry, unknown flags exit 2.
 *
 * ============ WHY A DELTA AND NOT A RUN ============
 *
 * A single run of the widened index produces a number with nothing to disagree
 * with. Every row that fires would have to be read from scratch to find out
 * whether the corpus changed or the instrument did.
 *
 * Scoring the SAME rows under BOTH indices separates those: a row that fired
 * before and still fires is unchanged, and a row that fires only now is a
 * reproduction of a standard we did not previously hold. The second set is the
 * finding; the first is context.
 *
 * ============ THE ROWS TO WATCH WERE NAMED BEFORE THIS RAN ============
 *
 * `list-defined-term-glosses.mjs` produced 23 tier-A candidates by matching
 * concept NAMES against defined-term vocabularies, two of which were TYPED
 * FROM KNOWLEDGE because ISO/IEC 27000 and ISO/IEC 22989 were not on disk.
 * Those identifications were explicitly unverifiable at the time.
 *
 * They are now machine-checkable, and this script reports them SEPARATELY --
 * predicted first, measured second. A hit rate against a list written before
 * the evidence arrived means something; the same rows found by searching after
 * the fact would not.
 */
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, CITATION_SOURCES, pdftotextAvailable, expectedWords, verifyCorpus, MANIFEST } from "./lib/citation-index.mjs";

const KNOWN = new Set(["--out"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY; no --apply, no --dry. Known: --out.");
    process.exit(2);
  }
}

const HERE = dirname(fileURLToPath(import.meta.url));
for (const p of [join(HERE, ".env"), join(HERE, "..", ".env")]) {
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
async function rest(p, init) {
  let last;
  for (let i = 0; i < 10; i++) {
    try {
      const r = await fetch(BASE + "/" + p, { ...init, headers: { ...H, ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(60000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 160));
      return { body: t ? JSON.parse(t) : null, range: r.headers.get("content-range") };
    } catch (e) { last = e; }
  }
  throw new Error(p + ": " + last?.message);
}
async function all(path) {
  const PAGE = 500, out = [];
  for (let from = 0; ; from += PAGE) {
    const { body } = await rest(path + "&order=id&offset=" + from + "&limit=" + PAGE);
    out.push(...body);
    if (body.length < PAGE) break;
  }
  const { range } = await rest(path + "&limit=1", { headers: { Prefer: "count=exact" } });
  const total = range ? Number(range.split("/")[1]) : NaN;
  if (Number.isFinite(total) && total !== out.length) throw new Error("PAGING INCOMPLETE: " + out.length + " vs " + total);
  return out;
}

const norm = (s) => String(s || "").toLowerCase()
  .replace(/[‘’]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
const W = (s) => norm(s).split(" ").filter(Boolean);
const SEED = 4, MIN_RUN = 6, MIN_COV = 0.60;

if (!pdftotextAvailable()) { console.error("pdftotext is not on PATH."); process.exit(2); }
const corruption = verifyCorpus();
if (corruption.length) {
  console.error("CORPUS CONTROL FAILED -- the index is not what the manifest describes:");
  for (const c of corruption) console.error("  " + c);
  process.exit(1);
}

function pdfText(p) {
  const o = join(mkdtempSync(join(tmpdir(), "iso-")), "t.txt");
  execFileSync("pdftotext", ["-layout", p, o]);
  return readFileSync(o, "utf8");
}

console.log("");
console.log("CORPUS -- verified byte-identical to iso-corpus-manifest.json");
const perSource = new Map();
for (const [key, p] of Object.entries(PDFS)) {
  const w = W(pdfText(p));
  if (w.length !== expectedWords(key)) {
    console.error(key + " extracted " + w.length + ", manifest says " + expectedWords(key) + ". Refusing.");
    process.exit(1);
  }
  const set = new Set();
  for (let i = 0; i + SEED <= w.length; i++) set.add(w.slice(i, i + SEED).join(" "));
  perSource.set(key, set);
  const e = MANIFEST.entries.find((x) => x.key === key);
  console.log("  " + key.padEnd(17) + String(w.length).padStart(6) + "w  " + e.standard);
}
for (const e of MANIFEST.entries.filter((x) => !x.indexed)) {
  console.log("  " + "EXCLUDED".padEnd(17) + "        " + e.standard);
}

/* NARROW is what the index held before tonight: the three standards that were
 * loose in Documents. WIDE is every manifest entry marked indexed. */
const NARROW_KEYS = CITATION_SOURCES;
const WIDE_KEYS = Object.keys(PDFS);
const NEW_KEYS = WIDE_KEYS.filter((k) => !NARROW_KEYS.includes(k));
/* ============ PER SOURCE, NEVER AGAINST THE UNION ============
 *
 * A combined gram set manufactures adjacency: a greedy run can chain out of one
 * document and into another across a junction that exists in neither, and the
 * reported length is then a property of the index rather than of any standard.
 * Measured on the lesson corpus the same night: four of eight refused groups
 * held no contiguous match in any single standard.
 *
 * So the sets stay separate and the maximum is taken afterwards. Gram counts
 * are still reported unioned, because that is a size, not a verdict.
 */
const union = (keys) => { const s = new Set(); for (const k of keys) for (const g of perSource.get(k)) s.add(g); return s; };
function score(text, keys) {
  const w = W(text);
  let best = 0, bestText = "", src = "";
  for (const k of keys) {
    const set = perSource.get(k);
    for (let i = 0; i + SEED <= w.length; i++) {
      if (!set.has(w.slice(i, i + SEED).join(" "))) continue;
      let n = SEED;
      while (i + n + 1 <= w.length && set.has(w.slice(i + n + 1 - SEED, i + n + 1).join(" "))) n++;
      if (n > best) { best = n; bestText = w.slice(i, i + n).join(" "); src = k; }
      i += n - 1;
    }
  }
  return { run: best, tot: w.length, cov: w.length ? best / w.length : 0, hit: bestText, src };
}
const fires = (s) => s.run >= MIN_RUN && s.cov >= MIN_COV;
/** Which indexed source carries the matched span. Names the finding. */
const attribute = (hit) => {
  if (!hit) return [];
  const w = hit.split(" ");
  return WIDE_KEYS.filter((k) => {
    const set = perSource.get(k);
    for (let i = 0; i + SEED <= w.length; i++) if (!set.has(w.slice(i, i + SEED).join(" "))) return false;
    return w.length >= SEED;
  });
};

/* ------------------------------------------------------------- the corpora */

const certs = (await rest("certifications?select=id,code")).body;
const byId = new Map(certs.map((c) => [c.id, c.code]));
const live = (await all("concepts?select=id,certification_id,slug,name,description,retired_at"))
  .filter((c) => c.retired_at === null)
  .map((c) => ({ cert: byId.get(c.certification_id) ?? "?", slug: c.slug, name: c.name, desc: c.description || "" }));

const proposedPath = join(HERE, "..", "AIMS-F-CONCEPT-DESCRIPTIONS.json");
const proposed = existsSync(proposedPath)
  ? JSON.parse(readFileSync(proposedPath, "utf8")).rows.map(([task, slug, name, term, desc]) => ({ cert: "AIMS-F (proposed)", slug, name, desc, term }))
  : [];

/* The predicted set, read from the file that was written BEFORE the evidence
 * arrived. Loaded rather than retyped, so the prediction cannot drift to fit. */
const candPath = join(HERE, "..", "DEFINED-TERM-GLOSS-CANDIDATES.json");
const cand = existsSync(candPath) ? JSON.parse(readFileSync(candPath, "utf8")) : { rows: [] };
const tierA = new Set(cand.rows.filter((r) => r.tier === "A").map((r) => r.cert + "/" + r.slug));
const tierB = new Set(cand.rows.filter((r) => r.tier === "B").map((r) => r.cert + "/" + r.slug));

function run(rows, label) {
  const out = rows.map((r) => {
    const n = score(r.desc, NARROW_KEYS), w = score(r.desc, WIDE_KEYS);
    return { ...r, n, w, before: fires(n), after: fires(w) };
  });
  const newly = out.filter((r) => !r.before && r.after);
  const already = out.filter((r) => r.before && r.after);
  console.log("");
  console.log("===== " + label + "   " + rows.length + " row(s)");
  console.log("  fired on the NARROW index   " + out.filter((r) => r.before).length);
  console.log("  fires on the WIDE index     " + out.filter((r) => r.after).length);
  console.log("  NEWLY FIRING                " + newly.length);
  for (const r of newly.sort((a, b) => b.w.cov - a.w.cov)) {
    const key = r.cert + "/" + r.slug;
    const tag = tierA.has(key) ? "  [PREDICTED tier A]" : tierB.has(key) ? "  [PREDICTED tier B]" : "";
    console.log("");
    console.log("  " + r.cert.padEnd(18) + r.slug + tag);
    console.log("     " + r.w.run + "w/" + r.w.tot + " cov " + r.w.cov.toFixed(2) +
      "   (narrow: " + r.n.run + "w/" + r.n.cov.toFixed(2) + ")   in " + (attribute(r.w.hit).join(", ") || "?"));
    console.log("     ours   : " + r.desc);
    console.log("     matched: \"" + r.w.hit + "\"");
  }
  if (already.length) {
    console.log("");
    console.log("  already firing before, unchanged by the widening:");
    for (const r of already) console.log("    " + r.cert.padEnd(12) + r.slug + "   " + r.w.run + "w cov " + r.w.cov.toFixed(2));
  }
  return { out, newly, already };
}

const liveRes = run(live, "LIVE CONCEPT DESCRIPTIONS");
const propRes = proposed.length ? run(proposed, "AIMS-F PROPOSED DESCRIPTIONS (not yet landed)") : { out: [], newly: [], already: [] };

/* ============ THE PREDICTION, SCORED BOTH WAYS ============
 *
 * Reported as a confusion table rather than a hit count, because "6 of 23 tier
 * A now fire" says nothing on its own about whether the prediction was any
 * good. The rows that fire and were NOT predicted are the more interesting
 * half: they are gloss candidates the name-matching approach missed. */
const liveByKey = new Map(liveRes.out.map((r) => [r.cert + "/" + r.slug, r]));
const predicted = [...tierA];
const predFired = predicted.filter((k) => liveByKey.get(k)?.after);
const unpredFired = liveRes.out.filter((r) => r.after && !tierA.has(r.cert + "/" + r.slug) && !tierB.has(r.cert + "/" + r.slug));

console.log("");
console.log("===== THE TIER-A PREDICTION, MEASURED");
console.log("  tier A named before the evidence arrived   " + predicted.length);
console.log("  of those, now firing on the wide index     " + predFired.length);
console.log("  firing but predicted by neither tier       " + unpredFired.length);
console.log("");
console.log("  NOT FIRING does not clear a row. The gate sees reproduced EXPRESSION;");
console.log("  a faithful paraphrase of a defined term scores 0 and is still a gloss.");
console.log("  The anti-gloss rule is a human read and this measurement does not make it.");
for (const k of predicted) {
  const r = liveByKey.get(k);
  if (!r) { console.log("    ?      " + k + "   not found live"); continue; }
  console.log("    " + (r.after ? "FIRES " : "quiet ") + k.padEnd(42) + r.w.run + "w/" + r.w.tot + " cov " + r.w.cov.toFixed(2));
}

const OUT = join(HERE, "..", "INDEX-WIDENING-DELTA.json");
writeFileSync(OUT, JSON.stringify({
  measured: "2026-09-21",
  narrow_sources: NARROW_KEYS, added_sources: NEW_KEYS,
  grams: { narrow: union(NARROW_KEYS).size, wide: union(WIDE_KEYS).size },
  gate: { seed: SEED, min_run: MIN_RUN, min_cov: MIN_COV },
  live: {
    rows: live.length,
    fired_narrow: liveRes.out.filter((r) => r.before).length,
    fired_wide: liveRes.out.filter((r) => r.after).length,
    newly: liveRes.newly.map((r) => ({ cert: r.cert, slug: r.slug, description: r.desc, run: r.w.run, words: r.w.tot, cov: r.w.cov, matched: r.w.hit, source: r.w.src, predicted_tier: tierA.has(r.cert + "/" + r.slug) ? "A" : tierB.has(r.cert + "/" + r.slug) ? "B" : null })),
  },
  proposed: {
    rows: proposed.length,
    newly: propRes.newly.map((r) => ({ slug: r.slug, description: r.desc, run: r.w.run, cov: r.w.cov, matched: r.w.hit, source: r.w.src })),
  },
  tier_a_prediction: { named: predicted.length, firing: predFired.length, firing_unpredicted: unpredFired.length },
}, null, 2), "utf8");
console.log("");
console.log("wrote " + OUT);
