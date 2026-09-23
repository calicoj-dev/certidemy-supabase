#!/usr/bin/env node
/**
 * list-english-moved.mjs -- which lessons had their ENGLISH body edited by this
 * programme, and are their translations still serving?
 *
 * READ-ONLY. Takes --json. Unknown flags exit 2.
 *
 * ============ WHY NOT `updated_at` ============
 *
 * The obvious query is "English row newer than its translations". It returns
 * ZERO, and the reason is worth recording: `scan-iso-leaks --apply` writes
 * `mcp_servable` and `mcp_scanned_at` to all 1437 rows, and `set_updated_at`
 * fires on any UPDATE. So a metadata stamp bumps the timestamp exactly like a
 * content edit, and within minutes of a scan every row in the corpus looks
 * equally fresh.
 *
 * **A TIMESTAMP IS NOT A CONTENT SIGNAL.** That is the whole argument for a
 * content hash, demonstrated by the instrument that was supposed to substitute
 * for one.
 *
 * ============ SO IT IS DERIVED FROM THE SCRIPTS THAT DID THE EDITING ======
 *
 * Every English repair in this programme landed through a script in this
 * directory, and each names the slugs it touches. That is an artifact, not a
 * recollection -- the distinction this repository keeps paying for.
 *
 * What it CANNOT see, stated so its silence is not read as coverage: an edit
 * made by hand in the SQL editor, or by a script since deleted. The count is a
 * floor.
 */
import { readFileSync, existsSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

const lessons = await allRows("lessons?select=id,slug,language,lesson_group_id,mcp_servable,mcp_translation_review_required");
const enSlugs = new Set(lessons.filter((l) => l.language === "en").map((l) => l.slug));

/* Scripts that PATCH a lesson body. Identified by the write, not by the name,
 * so a future repair script is found without being added to a list. */
const files = readdirSync(HERE).filter((f) => f.endsWith(".mjs"));
const WRITES = ["lessons?id=eq.", "lessons?slug=eq.", 'from("lessons")'];
const found = new Map();
for (const f of files) {
  const src = readFileSync(join(HERE, f), "utf8");
  const writesLessons = WRITES.some((w) => src.includes(w));
  const patches = src.includes("PATCH") || src.includes(".update(");
  if (!writesLessons || !patches) continue;
  /* A slug is a known English lesson slug appearing literally in the source.
   * Matching against the CORPUS rather than a pattern means a typo in a script
   * cannot invent a lesson, and a slug-shaped string that is not a lesson
   * cannot enter the list. */
  for (const slug of enSlugs) {
    if (!src.includes(slug)) continue;
    if (!found.has(slug)) found.set(slug, new Set());
    found.get(slug).add(f);
  }
}

const byGroup = new Map();
for (const l of lessons) {
  const k = l.lesson_group_id ?? ("SOLO:" + l.id);
  if (!byGroup.has(k)) byGroup.set(k, []);
  byGroup.get(k).push(l);
}
const groupOfSlug = new Map();
for (const l of lessons) if (l.language === "en") groupOfSlug.set(l.slug, l.lesson_group_id ?? ("SOLO:" + l.id));

/* The gate, asked of the function rather than read off the column. The column
 * has been mistaken for the verdict three times; it is an INPUT to
 * `lesson_body_is_servable`, not its answer. */
const ids = [];
for (const slug of found.keys()) {
  for (const row of byGroup.get(groupOfSlug.get(slug)) || []) if (row.language !== "en") ids.push(row.id);
}
const gate = new Map();
for (let i = 0; i < ids.length; i += 40) {
  const chunk = ids.slice(i, i + 40);
  const res = await Promise.all(chunk.map(async (id) => {
    const r = await fetch(BASE + "/rpc/lesson_body_is_servable", {
      method: "POST", headers: { ...H, "content-type": "application/json" },
      body: JSON.stringify({ p_lesson_id: id }),
    });
    return [id, r.ok ? await r.json() : null];
  }));
  for (const [id, v] of res) gate.set(id, v);
}

const rows = [];
for (const slug of [...found.keys()].sort()) {
  for (const row of byGroup.get(groupOfSlug.get(slug)) || []) {
    if (row.language === "en") continue;
    rows.push({ slug, language: row.language, id: row.id,
                column: row.mcp_servable === true, gate: gate.get(row.id) === true,
                reviewRequired: row.mcp_translation_review_required === true,
                scripts: [...found.get(slug)] });
  }
}
const serving = rows.filter((r) => r.gate);

console.log("");
console.log("LESSONS WHOSE ENGLISH MOVED IN THIS PROGRAMME");
console.log("  derived from the scripts that write lesson bodies, not from memory");
console.log("  `updated_at` is unusable: the scan stamped all 1437 rows minutes ago");
console.log("");
console.log("  English lessons edited          " + found.size);
console.log("  their translated rows           " + rows.length);
console.log("  column says servable            " + rows.filter((r) => r.column).length);
console.log("  GATE says servable              " + serving.length + "   <- the ones actually on the wire");
console.log("  withheld by the review gate     " + rows.filter((r) => r.column && !r.gate).length);
console.log("");
console.log("  SERVING A TRANSLATION OF TEXT THAT MAY NO LONGER EXIST IN ENGLISH:");
const bySlug = new Map();
for (const r of serving) {
  if (!bySlug.has(r.slug)) bySlug.set(r.slug, []);
  bySlug.get(r.slug).push(r.language);
}
for (const [slug, langs] of [...bySlug.entries()].sort()) {
  console.log("    " + slug.padEnd(48) + langs.sort().join(", "));
}
console.log("");
console.log("  (scripts are listed in the JSON; a lesson may appear in several)");

if (JSON_OUT) {
  writeFileSync(join(ROOT, "ENGLISH-MOVED.json"), JSON.stringify({
    measured: new Date().toISOString(),
    note: "Derived from scripts that PATCH lessons. Cannot see hand edits in the SQL editor. A floor, not a total.",
    lessons: found.size, translatedRows: rows.length, serving: serving.length, rows,
  }, null, 2), "utf8");
  console.log("  wrote ENGLISH-MOVED.json");
}
