#!/usr/bin/env node
/**
 * apply-concept-clearance-22.mjs -- the director's read of the 22 provisional concept translations.
 *
 * WRITES. `--apply`; DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ THE RULING ============
 *
 * 19 approved as written: both languages of items 1-4 and 8-11, plus es-419 of 5, 6 and 7.
 * 3 pt-BR rows fixed and then approved -- AIGRM-I `gpai-obligations`, `minimal-risk` and
 * `synthetic-content-labeling`: `provedor(es)` becomes `prestador(es)`, and in `minimal-risk`
 * `implantadores` becomes `responsaveis pela implantacao`. These are the house EU AI Act terms.
 *
 * ============ THIS IS A DUAL-ROLE SCRIPT AND IT IS DECLARED AS ONE ============
 *
 * It AUTHORS three translated edits and CLEARS twenty-two rows, which is the shape this repository
 * calls the defect in its purest form -- the authoring half supplies the excuse for the clearing half
 * to stamp. It follows `apply-retranslation-review.mjs`, the existing precedent, exactly:
 *
 *   it stamps `tr_hash` for THE THREE ROWS IT WROTE ONLY, from the text it just wrote -- the one
 *   moment a hash records something rather than restating it;
 *   it ASSERTS `en_hash` is unchanged on all 22 and writes it nowhere, because an English-side hash
 *   is not its to vouch for;
 *   a row whose English has moved since the translation is REFUSED, not cleared.
 *
 * ============ EVERY HASH COMES FROM THE DATABASE ============
 *
 * The gate is read off `mcp.concept` itself rather than from a migration:
 *
 *   is_provisional = false
 *   AND en_hash = mcp.concept_row_en_hash(concept_id)
 *   AND tr_hash = mcp.translation_hash(name, description)
 *
 * So `tr_hash` covers the translated NAME AND DESCRIPTION, and both values are computed by calling
 * `rpc/translation_hash` and `rpc/concept_row_en_hash`. Nothing is recomputed in JavaScript. This
 * repository has already paid for a guessed formula: two task rows were stamped with a value that
 * could never match and stayed dark in both languages.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". DRY BY DEFAULT; --apply to write.");
    console.error("NOTE: some scripts here take --dry and are LIVE without it. This is not one.");
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };
const rpc = async (fn, body) => {
  const r = await fetch(REST_URL + "/rpc/" + fn, { method: "POST", headers: H, body: JSON.stringify(body) });
  if (!r.ok) throw new Error("rpc/" + fn + ": " + r.status + " " + (await r.text()).slice(0, 160));
  return JSON.parse(await r.text());
};
const patch = async (path, body) => {
  const r = await fetch(REST_URL + "/" + path, { method: "PATCH",
    headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(body) });
  const t = await r.text();
  if (!r.ok) throw new Error("PATCH " + path + ": " + r.status + " " + t.slice(0, 200));
  return t ? JSON.parse(t) : null;
};

/* ============ THE ELEVEN CONCEPTS, IN THE ORDER THE READ DOCUMENT NUMBERS THEM ============
 * Named rather than re-derived from the drafts file: the ruling refers to items by number, and a
 * clearance that renumbers its own subject cannot be checked against the instruction later. */
const ITEMS = [
  { n: 1, cert: "AISM-I", slug: "management-practice" },
  { n: 2, cert: "AISM-I", slug: "governance-definition" },
  { n: 3, cert: "AISM-I", slug: "incident-management" },
  { n: 4, cert: "AISM-I", slug: "guiding-principles" },
  { n: 5, cert: "AIGRM-I", slug: "gpai-obligations" },
  { n: 6, cert: "AIGRM-I", slug: "minimal-risk" },
  { n: 7, cert: "AIGRM-I", slug: "synthetic-content-labeling" },
  { n: 8, cert: "SPO-AI-I", slug: "product-ecosystem-actors" },
  { n: 9, cert: "SPO-AI-I", slug: "story-independence" },
  { n: 10, cert: "SM-AI-I", slug: "scrum-adoption" },
  { n: 11, cert: "AIGRM-I", slug: "explainability-for-stakeholders" },
];

/* The three pt-BR edits, as ORDERED substitutions with the count each MUST make. A substitution whose
 * count is wrong means the text is not what was read, and the run stops rather than guessing. */
const PT_EDITS = {
  "gpai-obligations": [
    { from: "provedor", to: "prestador", expect: 2 },
  ],
  "minimal-risk": [
    { from: "provedores", to: "prestadores", expect: 1 },
    { from: "implantadores", to: "responsáveis pela implantação", expect: 1 },
    { from: "provedor", to: "prestador", expect: 1 },
  ],
  "synthetic-content-labeling": [
    { from: "provedor", to: "prestador", expect: 1 },
  ],
};

/* word-bounded so `provedores` is not half-replaced by the `provedor` rule; the ORDER above puts the
 * longer form first for the same reason, and the counts prove it worked */
const B = "\\w\\-áéíóúâêôãõçüñ";
const reOf = (s) => new RegExp("(?<![" + B + "])" +
  String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![" + B + "])", "g");

{
  /* controls, both directions, before anything is read */
  const fails = [];
  const t = "alcança provedores e implantadores de todo sistema, e é o provedor quem defende";
  let s = t;
  for (const e of PT_EDITS["minimal-risk"]) s = s.replace(reOf(e.from), e.to);
  if (s !== "alcança prestadores e responsáveis pela implantação de todo sistema, e é o prestador quem defende") {
    fails.push("the minimal-risk substitution chain produced: " + s);
  }
  if ("o provedor do modelo".replace(reOf("provedor"), "prestador") !== "o prestador do modelo") {
    fails.push("provedor -> prestador failed");
  }
  if ("os provedores".replace(reOf("provedor"), "prestador") !== "os provedores") {
    fails.push("the bare `provedor` rule matched inside `provedores` -- the boundary is not holding");
  }
  console.log("substitution controls: 3 case(s), " + fails.length + " fail");
  if (fails.length) { fails.forEach((f) => console.error("   " + f)); process.exit(3); }
}

/* ---------------------------------------------------------------- read */
const certs = await getAll(KEY, "certifications?select=id,code&order=code");
const idOf = new Map(certs.map((c) => [c.code, c.id]));
const concepts = (await getAll(KEY,
  "concepts?select=id,slug,name,description,certification_id,retired_at&order=id"))
  .filter((c) => !c.retired_at);
const trs = await getAll(KEY,
  "concept_translations?select=concept_id,language,name,description,en_hash,tr_hash,is_provisional&order=concept_id");

const target = [];
for (const it of ITEMS) {
  const c = concepts.find((x) => x.slug === it.slug && x.certification_id === idOf.get(it.cert));
  if (!c) { console.error("REFUSING: no live concept " + it.cert + "/" + it.slug); process.exit(2); }
  for (const lang of ["es-419", "pt-BR"]) {
    const t = trs.find((x) => x.concept_id === c.id && x.language === lang);
    if (!t) { console.error("REFUSING: no " + lang + " row for " + it.slug); process.exit(2); }
    target.push({ ...it, concept: c, lang, row: t });
  }
}
if (target.length !== 22) { console.error("REFUSING: " + target.length + " rows, expected 22"); process.exit(2); }

/* ============ en_hash IS ASSERTED, NEVER WRITTEN ============ */
const enLive = new Map();
for (const it of ITEMS) {
  const c = concepts.find((x) => x.slug === it.slug && x.certification_id === idOf.get(it.cert));
  enLive.set(c.id, await rpc("concept_row_en_hash", { p_concept_id: c.id }));
}
const stale = target.filter((t) => t.row.en_hash !== enLive.get(t.concept.id));
if (stale.length) {
  console.error("REFUSING TO CLEAR " + stale.length + " row(s): the ENGLISH has moved since the");
  console.error("translation was generated, so a clearance would vouch for text nobody read.");
  for (const s of stale) {
    console.error("  " + s.cert + "/" + s.slug + " " + s.lang + "  stored " + s.row.en_hash +
      "  live " + enLive.get(s.concept.id));
  }
  process.exit(2);
}
console.log("en_hash asserted current on all 22 row(s) -- none is written by this script");

/* ---------------------------------------------------------------- plan */
const edits = [];
for (const t of target) {
  if (t.lang !== "pt-BR" || !PT_EDITS[t.slug]) continue;
  let next = String(t.row.description);
  const counts = [];
  for (const e of PT_EDITS[t.slug]) {
    const n = (next.match(reOf(e.from)) || []).length;
    if (n !== e.expect) {
      console.error("REFUSING: " + t.slug + " pt-BR expected " + e.expect + " occurrence(s) of `" +
        e.from + "`, found " + n + ". The text is not what was read.");
      process.exit(2);
    }
    next = next.replace(reOf(e.from), e.to);
    counts.push(e.from + " -> " + e.to + " x" + n);
  }
  /* the negative half: no forbidden form survives */
  for (const bad of ["provedor", "provedores", "implantadores"]) {
    if (reOf(bad).test(next)) {
      console.error("REFUSING: `" + bad + "` survives in " + t.slug + " after the edits");
      process.exit(2);
    }
  }
  edits.push({ ...t, before: t.row.description, after: next, counts });
}
if (edits.length !== 3) { console.error("REFUSING: " + edits.length + " edits, expected 3"); process.exit(2); }

console.log("");
console.log("THREE pt-BR EDITS");
for (const e of edits) {
  console.log("");
  console.log("  " + e.cert + "/" + e.slug + "   " + e.counts.join("; "));
  console.log("    -  " + e.before);
  console.log("    +  " + e.after);
}
console.log("");
console.log("NINETEEN APPROVED AS WRITTEN, cleared without an edit:");
for (const t of target.filter((x) => !edits.some((e) => e.slug === x.slug && e.lang === x.lang))) {
  console.log("  " + String(t.n).padStart(2) + ". " + t.cert + "/" + t.slug + "  " + t.lang);
}

/* every translation row this must NOT touch */
const ids = new Set(target.map((t) => t.concept_id || t.concept.id + "|" + t.lang));
const snap = (rows) => createHash("sha256").update(rows
  .filter((r) => !target.some((t) => t.concept.id === r.concept_id && t.lang === r.language))
  .sort((a, b) => (a.concept_id + a.language).localeCompare(b.concept_id + b.language))
  .map((r) => r.concept_id + "|" + r.language + "|" + r.description + "|" + r.is_provisional)
  .join("\n")).digest("hex").slice(0, 16);
const untouchedBefore = snap(trs);
console.log("");
console.log("  untouched-row checksum " + untouchedBefore + " over " + (trs.length - 22) +
  " other translation row(s)");
void ids;

if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

/* ---------------------------------------------------------------- write */
console.log("");
console.log("APPLYING...");
for (const e of edits) {
  /* the text first, then the hash OF THAT TEXT, computed by the database */
  const back = await patch("concept_translations?concept_id=eq." + e.concept.id +
    "&language=eq." + encodeURIComponent(e.lang), { description: e.after });
  if (!back || !back[0] || back[0].description !== e.after) throw new Error("text read-back failed on " + e.slug);
  const trHash = await rpc("translation_hash", { p_a: back[0].name, p_b: e.after });
  const back2 = await patch("concept_translations?concept_id=eq." + e.concept.id +
    "&language=eq." + encodeURIComponent(e.lang), { tr_hash: trHash });
  if (!back2 || back2[0].tr_hash !== trHash) throw new Error("tr_hash read-back failed on " + e.slug);
  console.log("  edited " + e.slug + " pt-BR, tr_hash restamped from the text just written: " + trHash);
}
for (const t of target) {
  await patch("concept_translations?concept_id=eq." + t.concept.id +
    "&language=eq." + encodeURIComponent(t.lang), { is_provisional: false });
}
console.log("  cleared is_provisional on " + target.length + " row(s)");

/* ---------------------------------------------------------------- read back */
console.log("");
console.log("READ-BACK -- the gate's own three predicates, per row");
let fail = 0;
const after = await getAll(KEY,
  "concept_translations?select=concept_id,language,name,description,en_hash,tr_hash,is_provisional&order=concept_id");
for (const t of target) {
  const r = after.find((x) => x.concept_id === t.concept.id && x.language === t.lang);
  const want = await rpc("translation_hash", { p_a: r.name, p_b: r.description });
  const okProv = r.is_provisional === false;
  const okEn = r.en_hash === enLive.get(t.concept.id);
  const okTr = r.tr_hash === want;
  if (!(okProv && okEn && okTr)) {
    fail++;
    console.log("  FAIL  " + t.cert + "/" + t.slug + " " + t.lang +
      "   provisional=" + r.is_provisional + " en=" + okEn + " tr=" + okTr);
  }
}
console.log("  " + (target.length - fail) + " of " + target.length +
  " row(s) satisfy is_provisional=false AND en_hash current AND tr_hash current");
const okUntouched = snap(after) === untouchedBefore;
console.log("  " + (okUntouched ? "PASS" : "FAIL") + "  every other translation row is byte-identical");
if (!okUntouched) fail++;
/* the negative half on the corpus: no forbidden AI Act form survives in these three */
for (const e of edits) {
  const r = after.find((x) => x.concept_id === e.concept.id && x.language === "pt-BR");
  for (const bad of ["provedor", "provedores", "implantadores"]) {
    if (reOf(bad).test(String(r.description))) { console.log("  FAIL  `" + bad + "` survives in " + e.slug); fail++; }
  }
}

writeFileSync(join(ROOT, "CONCEPT-CLEARANCE-22-APPLIED.json"), JSON.stringify({
  applied: new Date().toISOString().slice(0, 10),
  cleared: target.length, edited: edits.map((e) => e.cert + "/" + e.slug + " pt-BR"),
  untouchedHash: untouchedBefore,
  note: "en_hash asserted, never written. tr_hash restamped ONLY on the three edited rows, from the " +
    "text just written, computed by public.translation_hash.",
}, null, 2) + String.fromCharCode(10), "utf8");

console.log("");
if (fail) { console.error(fail + " read-back failure(s)."); process.exitCode = 1; }
else console.log("All 22 cleared and serving. 3 edited, 19 as written.");
