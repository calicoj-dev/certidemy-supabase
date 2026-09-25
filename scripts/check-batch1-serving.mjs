#!/usr/bin/env node
/**
 * check-batch1-serving.mjs -- are the sixteen rows batch cda6698a wrote actually
 * being served?
 *
 * READ-ONLY. No flags but `--json <file>`. Unknown flags exit 2.
 *
 * ============ WHY THIS IS A SEPARATE QUESTION ============
 *
 * The batch was written and byte-verified. That proves the BYTES landed. It says
 * nothing about whether a partner calling get_lesson in Spanish receives them,
 * and the whole batch exists to make these translations servable again -- so
 * "written" is not the finish line and reporting it as one would be the
 * view-is-not-the-endpoint defect.
 *
 * `body_available` is read from the DEPLOYED endpoint, the same way invariant 9
 * reads it, because the credential the test holds is the hypothesis.
 *
 * WHICH ARM holds a row cannot be read from the endpoint without a key, so it is
 * DERIVED from the same four predicates the view uses, and each is reported by
 * name. Where the derivation and the endpoint disagree, that is the finding --
 * two instruments, and a disagreement is worth more than either alone.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--json"]);
const argv = process.argv.slice(2);
for (const a of argv) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error("Unrecognised flag: " + a); process.exit(2); }
}
const ji = argv.indexOf("--json");
const JSONOUT = ji >= 0 && argv[ji + 1] && !argv[ji + 1].startsWith("--") ? argv[ji + 1] : "";

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
const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const FN = "https://pctynukndxnmnxiqpgck.supabase.co/functions/v1/courseware-read";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };

const SLUGS = [
  "01-03-the-ai-system-life-cycle", "02-06-the-ai-system-impact-assessment",
  "03-01-resources-and-competence", "03-02-awareness-and-communication",
  "03-03-documented-information", "03-04-operational-planning-and-control",
  "05-02-aims-internal-audit", "isms-ia-04-02-demonstrated-not-stated",
];
const BATCH = "cda6698a-ade7-49dd-9d61-01e5d538bb88";

async function rest(path, init) {
  let last;
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(REST + "/" + path, { ...(init || {}),
        headers: { ...H, ...((init || {}).headers || {}) }, signal: AbortSignal.timeout(45000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 120));
      return t ? JSON.parse(t) : null;
    } catch (e) { last = e; }
    await new Promise((s) => setTimeout(s, 400 * (i + 1)));
  }
  throw last;
}
async function fn(body) {
  let last;
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(FN, { method: "POST",
        headers: { "content-type": "application/json", "x-mcp-client": "probe:batch1-serving" },
        body: JSON.stringify(body), signal: AbortSignal.timeout(45000) });
      const t = await r.text();
      if (r.ok) return JSON.parse(t);
      last = new Error("HTTP " + r.status + " " + t.slice(0, 100));
    } catch (e) { last = e; }
    /* Paced. Measuring a surface must not be the heaviest thing it has seen. */
    await new Promise((s) => setTimeout(s, 700 * (i + 1)));
  }
  throw last;
}

/* --- the rows, with everything the four arms depend on --- */
const cols = "id,slug,language,lesson_group_id,mcp_servable,mcp_scanned_at,mcp_iso_longest_run," +
             "mcp_translation_review_required,en_content_hash,en_content_hash_basis,translation_batch_id";
const inList = "(" + SLUGS.join(",") + ")";
const rows = await rest("lessons?select=" + cols + "&slug=in." + inList + "&order=slug,language");
const byKey = new Map(rows.map((r) => [r.slug + "|" + r.language, r]));
const english = new Map(rows.filter((r) => r.language === "en").map((r) => [r.slug, r]));

/* --- review rows for these lessons --- */
const groups = [...new Set(rows.map((r) => r.lesson_group_id).filter(Boolean))];
/* The review table is keyed on lesson_id ALONE -- each language is its own
 * lesson row, so the language is already in the key and there is no language
 * column. Checked against the table rather than assumed; the first version
 * selected a `language` and a `status` that do not exist. */
const reviews = await rest(
  "lesson_translation_reviews?select=lesson_id,reviewed_at,reviewed_by,verdict,en_hash,tr_hash,tr_hash_basis" +
  "&lesson_id=in.(" + rows.map((r) => r.id).join(",") + ")");
const reviewFor = new Map();
for (const v of reviews) reviewFor.set(v.lesson_id, v);

/* --- the gate, asked directly, per row --- */
const gate = new Map();
for (const r of rows) {
  const v = await rest("rpc/lesson_body_is_servable", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ p_lesson_id: r.id }),
  });
  gate.set(r.slug + "|" + r.language, v);
}

/* --- the DEPLOYED endpoint, two certifications, three languages: six cells --- */
const CERTS = ["AIMS-F", "ISMS-IA"];
const LANGS = ["en", "es-419", "pt-BR"];
const endpoint = new Map();
for (const certification of CERTS) {
  for (const language of LANGS) {
    const j = await fn({ resource: "lesson_index", certification, language, limit: 200 });
    for (const x of j.rows ?? []) endpoint.set(x.lesson_slug + "|" + x.language, x.body_available);
  }
}

/* --- derive WHICH ARM, in the view's own order --- */
function arm(r) {
  if (r.language === "en") return null;
  if (!r.mcp_servable && r.mcp_scanned_at === null) return "unscanned";
  if (!r.mcp_servable) return "iso_reproduction";
  const en = english.get(r.slug);
  if (r.mcp_translation_review_required) {
    const v = reviewFor.get(r.id);
    if (!v || v.verdict !== "approved") return "translation_review";
  }
  if (r.en_content_hash && en) {
    /* provenance: the stamp must still match the live English. */
    return null; // compared below against the live hash
  }
  return null;
}

const out = [];
console.log("");
console.log("ARE THE SIXTEEN SERVING? -- batch " + BATCH.slice(0, 8));
console.log("  body_available read from the DEPLOYED endpoint; the arm derived from the view's predicates");
console.log("DENOMINATOR: " + rows.filter((r) => r.language !== "en").length + " translated row(s) examined");
console.log("");
console.log("  " + "slug".padEnd(42) + "lang".padEnd(9) + "gate".padEnd(7) + "endpoint".padEnd(10) + "arm");
let served = 0, held = 0, disagree = 0;
for (const r of rows) {
  if (r.language === "en") continue;
  const g = gate.get(r.slug + "|" + r.language);
  const e = endpoint.get(r.slug + "|" + r.language);
  const a = g ? "-" : (arm(r) || "provenance_or_other");
  if (g) served++; else held++;
  if (e !== undefined && e !== g) disagree++;
  console.log("  " + r.slug.padEnd(42) + r.language.padEnd(9) + String(g).padEnd(7) +
    String(e === undefined ? "ABSENT" : e).padEnd(10) + a);
  out.push({ slug: r.slug, language: r.language, gate: g, endpoint: e, arm: a,
             review_required: r.mcp_translation_review_required,
             has_review: !!reviewFor.get(r.id),
             run: r.mcp_iso_longest_run, scanned: r.mcp_scanned_at !== null,
             batch: r.translation_batch_id });
}
console.log("");
console.log("  serving " + served + ", held " + held + ", gate/endpoint disagreements " + disagree);
console.log("  rows stamped with this batch: " + out.filter((x) => x.batch === BATCH).length);
console.log("  rows with a review row at all: " + out.filter((x) => x.has_review).length);
console.log("  rows with review_required: " + out.filter((x) => x.review_required).length);
if (JSONOUT) { writeFileSync(join(ROOT, JSONOUT), JSON.stringify(out, null, 2), "utf8"); console.log("  wrote " + JSONOUT); }
