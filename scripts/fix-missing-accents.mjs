#!/usr/bin/env node
/**
 * fix-missing-accents.mjs -- four missing accents and one consistency pass.
 *
 * WRITES. `--apply`; DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ FOUR DEFECTS AND ONE NORMALISATION, KEPT APART ============
 *
 * DEFECTS -- the unaccented form is not a word in that language:
 *
 *   minimo    pt-BR  keep-it-simple-and-practical   -> minimo with acute
 *   nao       pt-BR  keep-it-simple-and-practical   -> nao with tilde
 *   minima    es-419 keep-it-simple-and-practical   -> minima with acute
 *   condicao  pt-BR  institution-proxy              -> condicao with cedilla+tilde
 *
 * CONSISTENCY -- both forms are correct Spanish and the RAE accepts either:
 *
 *   periodo   es-419  8 rows  -> periodo with acute, the dominant LATAM form
 *
 * THE DISTINCTION IS LOAD-BEARING AND IT IS WHY THEY ARE TWO LISTS. `periodo`
 * is not a misspelling; 8 against 8 is a corpus that cannot decide. Recording a
 * style choice as an error is how a record stops being believed the next time
 * it calls something an error -- the same reason UNSOUND and UNASSERTED exist.
 *
 * ============ THREE OF THE FOUR ARE ONE AUTHORING EVENT ============
 *
 * `minimo` and `nao` are in the SAME SENTENCE, and `minima` is the Spanish
 * sibling of that same concept. That is not three word-level defects; it is one
 * generation with three visible symptoms, and the accent detector happens to be
 * the instrument that caught it. Both concepts also appear in CLAUDE.md's
 * post-358 retranslation drift list.
 *
 * So both rows were READ WHOLE before editing, not just at the flagged token:
 *
 *   pt "use o minimo de etapas para atingir o objetivo; elimine o que nao agrega valor."
 *   es "usar la cantidad minima de pasos para lograr el objetivo; eliminar lo que no agrega valor."
 *
 * Nothing else in either is wrong.
 *
 * ============ AND IT WRITES NO HASH ============
 *
 * Editing a translation moves `translation_hash(name, description)`, so the
 * stored `tr_hash` stops matching and `mcp.concept` withholds the row until a
 * human clears it. That is the gate working and it is the point. Only a
 * generator may stamp; this script reads, compares and asserts -- it must never
 * re-stamp, because a clearance script that writes the value the gate is about
 * to compare against blindfolds the gate.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

/* Accented characters from code points. A shell ate this exact class of
 * character earlier in the week and produced a false confirmation. */
const A_ACUTE = String.fromCharCode(0x00E1);
const I_ACUTE = String.fromCharCode(0x00ED);
const O_ACUTE = String.fromCharCode(0x00F3);
const A_TILDE = String.fromCharCode(0x00E3);
const C_CED   = String.fromCharCode(0x00E7);

const DEFECTS = [
  { slug: "keep-it-simple-and-practical", lang: "pt-BR", from: "minimo", to: "m" + I_ACUTE + "nimo" },
  { slug: "keep-it-simple-and-practical", lang: "pt-BR", from: "nao",    to: "n" + A_TILDE + "o" },
  { slug: "keep-it-simple-and-practical", lang: "es-419", from: "minima", to: "m" + I_ACUTE + "nima" },
  { slug: "institution-proxy",            lang: "pt-BR", from: "condicao",
    to: "condi" + C_CED + A_TILDE + "o" },
];
const CONSISTENCY = [
  "ia-audit-programme-3-5", "aia-audit-scope-definition", "ia-audit-scope-definition-3-6",
  "ia-control-design-versus-operating-effectiveness", "ia-annex-a-control-testing",
  "ia-evidence-retention-and-confidentiality", "aia-programme-vs-individual-audit",
  "credential-currency",
].map((slug) => ({ slug, lang: "es-419", from: "periodo", to: "per" + I_ACUTE + "odo",
                   consistency: true }));

const EDITS = [...DEFECTS, ...CONSISTENCY];

async function get(path) {
  const r = await fetch(BASE + "/" + path, { headers: H });
  if (!r.ok) throw new Error("HTTP " + r.status + " on " + path);
  return r.json();
}

/* Group edits by (slug, lang): a row is written ONCE with every change it
 * needs. Two writes would mean two withholdings and two review invalidations
 * for one correction -- the lesson-is-a-unit-of-application rule. */
const byRow = new Map();
for (const e of EDITS) {
  const k = e.slug + "|" + e.lang;
  if (!byRow.has(k)) byRow.set(k, []);
  byRow.get(k).push(e);
}

const slugs = [...new Set(EDITS.map((e) => e.slug))];
const concepts = await get("concepts?select=id,slug&slug=in.(" + slugs.join(",") + ")");
const idOf = new Map(concepts.map((c) => [c.slug, c.id]));
if (idOf.size !== slugs.length) {
  console.error("expected " + slugs.length + " concepts, found " + idOf.size); process.exit(1);
}
const rows = await get("concept_translations?select=id,concept_id,language,name,description,tr_hash" +
  "&concept_id=in.(" + [...idOf.values()].join(",") + ")");
const rowOf = new Map();
for (const r of rows) {
  const slug = [...idOf.entries()].find(([, id]) => id === r.concept_id)?.[0];
  rowOf.set(slug + "|" + r.language, r);
}

console.log("");
console.log("MISSING ACCENTS -- " + DEFECTS.length + " defect(s), " + CONSISTENCY.length + " consistency");
let bad = 0;
const staged = [];
for (const [k, list] of byRow) {
  const row = rowOf.get(k);
  if (!row) { console.log("  MISS   " + k + " -- no translation row"); bad++; continue; }
  let text = row.description;
  const applied = [];
  for (const e of list) {
    /* Word-boundary replacement, so `nao` does not match inside another word
     * and `minimo` does not match inside `minimos`. The boundary is built from
     * a character class rather than \b, because \b is wrong next to accented
     * letters -- it would treat the accent itself as a boundary. */
    const re = new RegExp("(^|[^\\p{L}])" + e.from + "($|[^\\p{L}])", "gu");
    const n = (text.match(re) || []).length;
    if (n !== 1) { console.log("  MISS   " + k + " -- " + e.from + " matched " + n + " time(s), expected 1"); bad++; continue; }
    text = text.replace(re, (m, a, b) => a + e.to + b);
    applied.push(e);
  }
  if (applied.length !== list.length) continue;
  const kind = list.every((e) => e.consistency) ? "consistency" : "DEFECT";
  staged.push({ k, row, text, applied, kind });
  console.log("  ok     " + kind.padEnd(11) + k.padEnd(52) +
    applied.map((e) => e.from + " -> " + e.to).join(", "));
}

if (bad) { console.log(""); console.log("ABORT: " + bad + " problem(s). Nothing written."); process.exit(1); }
if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

console.log("");
console.log("APPLYING, one write per row");
let fail = 0;
for (const s of staged) {
  const r = await fetch(BASE + "/concept_translations?id=eq." + s.row.id, {
    method: "PATCH", headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ description: s.text }),
  });
  if (!r.ok) { console.log("  FAIL  " + s.k + " HTTP " + r.status); fail++; continue; }
  const after = (await r.json())[0];

  /* POST-CONDITIONS, BOTH DIRECTIONS. */
  const ok = [];
  ok.push(["text written", after.description === s.text]);
  /* The unaccented token is gone, and only it -- the length must have grown by
   * exactly the bytes the accents add, so nothing else moved. */
  for (const e of s.applied) {
    const re = new RegExp("(^|[^\\p{L}])" + e.from + "($|[^\\p{L}])", "u");
    ok.push(["`" + e.from + "` gone", !re.test(after.description)]);
    ok.push(["`" + e.to + "` present", after.description.includes(e.to)]);
  }
  ok.push(["nothing else changed",
    after.description.length === s.row.description.length]);
  /* THE GATE MUST NOW WITHHOLD THIS ROW. Editing a translation moves its hash;
   * if the row still serves, the provenance gate is not doing its job. */
  ok.push(["tr_hash now stale (row withheld)", after.tr_hash !== null &&
    after.tr_hash === s.row.tr_hash]);   // unchanged stored hash, changed text
  const allOk = ok.every(([, v]) => v);
  if (!allOk) fail++;
  console.log("  " + (allOk ? "PASS  " : "FAIL  ") + s.k);
  for (const [label, v] of ok) if (!v) console.log("          FAILED: " + label);
}

/* And prove the withholding at the gate rather than inferring it from the hash. */
console.log("");
const check = await get("concept_translations?select=id,language,name,description,tr_hash,concept_id" +
  "&id=in.(" + staged.map((s) => s.row.id).join(",") + ")");
let serving = 0;
for (const r of check) {
  const live = await (await fetch(BASE + "/rpc/translation_hash", {
    method: "POST", headers: H,
    body: JSON.stringify({ p_a: r.name, p_b: r.description }),
  })).json();
  if (r.tr_hash === live) serving++;
}
console.log("  rows whose tr_hash still matches their text: " + serving + " of " + check.length);
console.log("  (0 is correct -- every edited row is withheld until a human clears it,");
console.log("   and nothing here re-stamps: only a generator may write a hash.)");
if (serving !== 0) fail++;
process.exit(fail ? 1 : 0);
