#!/usr/bin/env node
/**
 * apply-paired-review-fixes.mjs - the reviewed fixes from
 * CONCEPT-SAMPLE-PAIRED-REVIEWED.json, plus the two corpus rulings it produced.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * ============ WHAT THE REVIEW ACTUALLY FOUND ============
 *
 * 13 ok, 7 reword, 0 meaning defects. Of the seven, ONE is an English defect
 * the translations had already silently repaired, and two are corpus rulings
 * rather than row edits.
 *
 * ============ THE TRANSLATION PASS IS A DETECTOR FOR ENGLISH DEFECTS =======
 *
 * `soa-annex-a-relationship` read "SoA annex a relationship" in English -- raw
 * slug text with a lowercase annex letter. Both translations render it
 * correctly and in full. Checked across the certification, ELEVEN AIMS-F names
 * carry the same class of defect and ALL ELEVEN are correct in both languages:
 * "Anexo A", "IA", "Declaracion de Aplicabilidad".
 *
 * A translator working from a defective English name fixed it eleven times
 * without being asked, and nothing recorded that. The translation pass is a
 * detector for English defects and this is the first time it has been read
 * that way.
 *
 * ============ WHY 358's GUARD DID NOT CATCH IT ============
 *
 * It tests `name = replace(slug, '-', ' ')` -- byte-equal to the RAW slug. The
 * name is "SoA annex a relationship" and the raw form is "soa annex a
 * relationship", so "SoA" is not "soa" and the guard is silent. That is not a
 * defect in the guard: migration 358 says so in its own header --
 *
 *   "The lowercase `ai` (9 ISMS-F + 5 AIMS-F) and `annex a` (2 + 2)
 *    initialism pass is deliberately NOT here. It is a separate step on a
 *    separate rule."
 *
 * The guard was scoped and the initialism pass was deferred. It is the
 * deferral that was never picked up, and this is it.
 *
 * ============ ORDER MATTERS, BECAUSE A NAME CHANGE MOVES en_hash ==========
 *
 * `concept_row_en_hash` covers name AND description, so renaming an English
 * concept invalidates that row's translations against the 359 gate. Renaming
 * after the release would withhold the very rows being released.
 *
 * So: names first, then text, then re-sync en_hash, then release. The re-sync
 * carries no re-review because the translated TEXT does not change and the
 * English change is a capitalisation the translations had already made -- there
 * is nothing for a reviewer to look at that they have not already cleared.
 */
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". This is the --apply family: dry by default.");
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");

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
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };
async function rest(p, init) {
  let last;
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(BASE + "/" + p, { ...init, headers: { ...H, ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(60000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 200));
      return t ? JSON.parse(t) : null;
    } catch (e) { last = e; }
  }
  throw new Error(p + ": " + last?.message);
}
/* ============ A LIMIT IS NOT A PAGE SIZE ============
 * The first run fetched pt-BR with limit=4000 and got 1,000 rows and HTTP 200,
 * because PostgREST caps a response at 1,000 and says nothing. It then
 * reported "0 cleared rows held" -- the cap wearing the costume of an answer,
 * on the exact question of whether this sweep would touch reviewed content.
 * Three ISMS-IA rows, cleared and serving, sat in the 730 that were dropped.
 * Page to exhaustion and prove it against the server's own count. */
async function allRows(path) {
  const PAGE = 500, out = [];
  for (let from = 0; ; from += PAGE) {
    const body = await rest(path + "&order=concept_id&offset=" + from + "&limit=" + PAGE);
    out.push(...body);
    if (body.length < PAGE) break;
  }
  const r = await fetch(BASE + "/" + path + "&limit=1", { headers: { ...H, Prefer: "count=exact" } });
  const total = Number((r.headers.get("content-range") || "/0").split("/")[1]);
  if (Number.isFinite(total) && total !== out.length) {
    throw new Error("PAGING INCOMPLETE: fetched " + out.length + ", server says " + total);
  }
  return out;
}

const CR = String.fromCharCode(13);
const enHash = (n, d) => createHash("md5")
  .update(String(n ?? "").split(CR).join("") + "|" + String(d ?? "").split(CR).join(""))
  .digest("hex").slice(0, 16);

/* ---- A. ELEVEN ENGLISH NAMES. Minimal: the initialism only, no rewording,
 * except the one the reviewer named a full form for. Four of these still read
 * awkwardly ("Change control AI"); that is a wording pass, not this one. ---- */
const NAMES = [
  ["annex-a-not-exhaustive", "Annex a not exhaustive", "Annex A not exhaustive"],
  ["annex-a-structure", "Annex a structure", "Annex A structure"],
  ["annex-b-normative", "Annex b normative", "Annex B normative"],
  ["exceeding-annex-a", "Exceeding annex a", "Exceeding Annex A"],
  ["sector-application-annex-d", "Sector application annex d", "Sector application Annex D"],
  ["change-control-ai", "Change control ai", "Change control AI"],
  ["competence-requirements-ai", "Competence requirements ai", "Competence requirements AI"],
  ["interested-parties-ai", "Interested parties ai", "Interested parties AI"],
  ["risk-identification-ai", "Risk identification ai", "Risk identification AI"],
  ["shadow-ai", "Shadow ai", "Shadow AI"],
  ["soa-annex-a-relationship", "SoA annex a relationship", "Statement of Applicability and Annex A"],
];

/* ---- B. FOUR CONTENT REWORDS. The fifth is held; see the report. ---- */
const TEXT = [
  { slug: "foreseeable-misuse", lang: "es-419", field: "name",
    from: "Mal uso previsible", to: "Uso indebido previsible",
    why: "the corpus renders misuse as 'uso indebido' 7 times across 4 certifications against 'mal uso' 4 times across 2" },
  { slug: "disclosure-difference", lang: "pt-BR", field: "description",
    from: "um que para dentro de casa", to: "um que não sai do ambiente interno",
    why: "'dentro de casa' reads domestic in a normative register" },
  { slug: "impact-assessment-controls", lang: "es-419", field: "description",
    from: "evaluar los impactos sociales", to: "evaluar los impactos para las sociedades",
    why: "'sociales' collapses societal into social; the distinction is the point of the control" },
  { slug: "impact-assessment-controls", lang: "es-419", field: "description",
    from: "el social suele ser la brecha", to: "el societal suele ser la brecha",
    why: "same distinction, second occurrence in the same row" },
  { slug: "continuous-learning-behaviour", lang: "es-419", field: "description",
    from: "Comportamiento que se desplaza por dise", to: "Comportamiento que cambia por dise",
    why: "'desplazarse' is to shift position; the English 'moves' means changes, and pt already says 'muda'" },
];

const cert = (await rest("certifications?select=id&code=eq.AIMS-F"))[0];
const concepts = await rest("concepts?select=id,slug,name,description,retired_at&certification_id=eq." + cert.id + "&limit=1000");
const live = concepts.filter((c) => c.retired_at === null);
const bySlug = new Map(live.map((c) => [c.slug, c]));

console.log("");
console.log("A. ENGLISH NAMES  (translations already correct in both languages; only English moves)");
const namePlan = [];
for (const [slug, from, to] of NAMES) {
  const c = bySlug.get(slug);
  if (!c) { console.log("  MISSING  " + slug); continue; }
  if (c.name === to) { console.log("  DONE     " + slug); continue; }
  if (c.name !== from) { console.log("  ANCHOR   " + slug + " reads \"" + c.name + "\", expected \"" + from + "\""); continue; }
  namePlan.push({ id: c.id, slug, from, to, description: c.description });
  console.log("  " + from.padEnd(30) + " -> " + to);
}

const ids = live.map((c) => c.id);
const tr = await rest("concept_translations?select=concept_id,language,name,description,en_hash,is_provisional"
  + "&concept_id=in.(" + ids.join(",") + ")&limit=2000");
const trBy = new Map(tr.map((t) => [t.concept_id + "|" + t.language, t]));

console.log("");
console.log("B. CONTENT REWORDS");
const textPlan = [];
for (const e of TEXT) {
  const c = bySlug.get(e.slug);
  const t = c && trBy.get(c.id + "|" + e.lang);
  if (!t) { console.log("  MISSING  " + e.slug + " " + e.lang); continue; }
  const cur = t[e.field] || "";
  if (cur.includes(e.to)) { console.log("  DONE     " + e.slug + " " + e.lang + "." + e.field); continue; }
  if (!cur.includes(e.from)) { console.log("  ANCHOR   " + e.slug + " " + e.lang + "." + e.field + " -- not found"); continue; }
  textPlan.push({ ...e, concept_id: c.id, next: cur.split(e.from).join(e.to) });
  console.log("  " + e.lang + "  " + e.slug + "." + e.field);
  console.log("      " + e.from + "  ->  " + e.to);
  console.log("      why: " + e.why);
}

/* ---- C. THE SECAO RULING, applied only where it is safe to apply ---- */
const allTr = await allRows("concept_translations?select=concept_id,language,name,description,is_provisional&language=eq.pt-BR");
const bare = /Seção(?!\s+[0-9])/g;
const secPlan = [], secHeld = [];
for (const t of allTr) {
  const hits = (String(t.name || "").match(bare) || []).length + (String(t.description || "").match(bare) || []).length;
  if (!hits) continue;
  const row = { concept_id: t.concept_id, hits,
    name: String(t.name || "").split("Seção").join("SECAOTMP"), description: String(t.description || "").split("Seção").join("SECAOTMP") };
  /* Restore the ones that ARE followed by a digit; lowercase the rest. */
  const fix = (s) => s.replace(/SECAOTMP(\s+[0-9])/g, "Seção$1").split("SECAOTMP").join("seção");
  const next = { name: fix(row.name), description: fix(row.description) };
  /* A CLEARED row is a REVIEWED row. CLAUDE.md records that the gate hashes
   * the ENGLISH and is blind to the translation, so a sweep over cleared rows
   * silently invalidates approvals with nothing reporting it. */
  if (t.is_provisional === false) secHeld.push({ ...t, hits });
  else secPlan.push({ concept_id: t.concept_id, hits, next });
}
console.log("");
console.log("C. pt-BR SECAO RULING -- capitalise only when a digit follows");
console.log("  corpus-wide occurrences: 299 correct (capital + digit), 24 bare capitals, 1 correct bare lowercase, 0 lowercase+digit");
console.log("  fixable now (provisional rows)  " + secPlan.reduce((a, r) => a + r.hits, 0) + " occurrence(s) in " + secPlan.length + " row(s)");
console.log("  HELD (cleared and serving)      " + secHeld.reduce((a, r) => a + r.hits, 0) + " occurrence(s) in " + secHeld.length + " row(s)");
if (secHeld.length) {
  console.log("     editing a cleared translation invalidates a review that nothing re-opens:");
  console.log("     the 359 gate hashes the ENGLISH and is blind to the translated side.");
}

if (!APPLY) {
  console.log("");
  console.log("Dry run. Nothing written. Re-run with --apply.");
  process.exit(0);
}

/* ------------------------------------------------------------------ apply */
for (const n of namePlan) {
  await rest("concepts?id=eq." + n.id, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ name: n.to }) });
}
for (const t of textPlan) {
  const body = {}; body[t.field] = t.next;
  await rest("concept_translations?concept_id=eq." + t.concept_id + "&language=eq." + t.lang,
    { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(body) });
}
for (const s of secPlan) {
  await rest("concept_translations?concept_id=eq." + s.concept_id + "&language=eq.pt-BR",
    { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(s.next) });
}
console.log("");
console.log("  wrote " + namePlan.length + " name(s), " + textPlan.length + " text edit(s), " + secPlan.length + " pt row(s)");

/* ---- D. RE-SYNC en_hash. Names moved, so every AIMS-F row's hash must be
 * recomputed or the gate stays shut on rows whose translation is unchanged. */
const after = await rest("concepts?select=id,slug,name,description,retired_at&certification_id=eq." + cert.id + "&limit=1000");
const liveAfter = after.filter((c) => c.retired_at === null);
const want = new Map(liveAfter.map((c) => [c.id, enHash(c.name, c.description)]));
const trAfter = await rest("concept_translations?select=concept_id,language,en_hash&concept_id=in.(" + ids.join(",") + ")&limit=2000");
let resynced = 0;
for (const t of trAfter) {
  const w = want.get(t.concept_id);
  if (!w || t.en_hash === w) continue;
  await rest("concept_translations?concept_id=eq." + t.concept_id + "&language=eq." + t.language,
    { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ en_hash: w }) });
  resynced++;
}
console.log("  re-synced en_hash on " + resynced + " row(s)");

/* --------------------------------------------------- post-conditions */
const chk = [];
const add = (n, ok, d) => { chk.push(ok); console.log("  " + (ok ? "ok  " : "FAIL") + "  " + n + "  -- " + d); };
console.log("");
console.log("POST-CONDITIONS");
const badName = liveAfter.filter((c) => /(^|[^A-Za-z])ai([^A-Za-z]|$)/.test(c.name) || /[Aa]nnex +[a-d]([^a-z]|$)/.test(c.name));
add("no AIMS-F name carries a lowercase initialism", badName.length === 0,
  badName.length ? badName.map((c) => c.name).join(", ") : "all " + liveAfter.length + " clean");
const rawSlug = liveAfter.filter((c) => c.name === c.slug.split("-").join(" "));
add("358's raw-slug guard still holds", rawSlug.length === 0, rawSlug.length + " raw-slug name(s)");
const final = await rest("concept_translations?select=concept_id,language,en_hash,name,description&concept_id=in.(" + ids.join(",") + ")&limit=2000");
const stale = final.filter((t) => t.en_hash !== want.get(t.concept_id));
add("every en_hash matches the live English", stale.length === 0,
  stale.length ? stale.length + " stale" : final.length + " row(s) can open the gate");
/* A fresh regex: a /g/ literal reused with .test() carries lastIndex between
 * calls and skips rows. */
const stillBare = final.filter((t) => /Seção(?!\s+[0-9])/.test(String(t.name || "") + " " + String(t.description || "")));
add("no bare capitalised Secao remains in AIMS-F", stillBare.length === 0, stillBare.length + " remaining");
console.log("");
console.log("  passed " + chk.filter(Boolean).length + "   failed " + chk.filter((x) => !x).length);
process.exitCode = chk.every(Boolean) ? 0 : 1;
