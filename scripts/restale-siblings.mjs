#!/usr/bin/env node
/**
 * restale-siblings.mjs -- delete the es-419 / pt-BR siblings of items whose ENGLISH text has changed,
 * so the translator regenerates them. WRITES with `--apply`; dry by default. Unknown flags exit 2.
 *
 * Ruled by necessity in PROMPT-121 s2b: the de-cue rewrote option texts on 45 live English rows, and
 * their siblings now translate SUPERSEDED TEXT. That is the worst kind of stale, because the siblings
 * are fluent and the lint has nothing to object to -- a reviewer reading only the Spanish would see a
 * clean item saying something the English no longer says.
 *
 * ============ A RECOVERY FILE IS WRITTEN BEFORE THE FIRST DELETE ============
 *
 * Every row is dumped in full first, and the script REFUSES if the recovery file already exists --
 * the same discipline `verify-367` uses. A delete without a recovery file is not reversible, and
 * "re-translate it" is not a reversal: it produces different words.
 *
 * ============ AND IT ONLY EVER TOUCHES A NON-ENGLISH, PENDING_REVIEW SIBLING ============
 *
 * Asserted per row before the delete: not English, not approved, not retired, and its group's English
 * row is one of the named items. A row failing any of those is skipped and reported.
 *
 *   --cert=<CODE>     required
 *   --from=<file>     required: a <SLUG>-DECUED.json-shaped record naming the rows
 *   --apply           delete
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let CERT = null, FROM = null, APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  let m = a.match(/^--cert=(.+)$/); if (m) { CERT = m[1]; continue; }
  m = a.match(/^--from=(.+)$/); if (m) { FROM = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=, --from=, --apply (dry by default).");
  process.exit(2);
}
if (!CERT || !FROM) { console.error("--cert= and --from= are both required."); process.exit(2); }
const SLUG = CERT.replace(/-/g, "");

const rec = JSON.parse(readFileSync(join(ROOT, FROM), "utf8"));
const named = new Set();
for (const r of (rec.rounds || [])) for (const d of (r.de_cued || [])) named.add(d.row);
if (!named.size) { console.error("REFUSING: " + FROM + " names no de-cued rows."); process.exit(2); }
console.log("English rows whose text changed: " + named.size);

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
const all = await getAll(KEY, "quiz_questions?select=*&certification_id=eq." + cert.id + "&order=id");
const groups = new Set(all.filter((r) => named.has(r.id)).map((r) => r.question_group_id).filter(Boolean));
console.log("their question groups: " + groups.size);

const victims = [], skipped = [];
for (const r of all) {
  if (!r.question_group_id || !groups.has(r.question_group_id)) continue;
  if (r.language === "en") continue;
  if (r.status === "approved") { skipped.push({ id: r.id, why: "APPROVED -- never deleted here" }); continue; }
  if (r.retired_at !== null) { skipped.push({ id: r.id, why: "retired" }); continue; }
  victims.push(r);
}
console.log("");
console.log("RESTALE SIBLINGS   " + CERT + (APPLY ? "   --apply" : "   dry run (default)"));
console.log("  sibling rows to delete  " + victims.length + "   (expected " + (groups.size * 2) + ")");
console.log("  skipped                 " + skipped.length);
for (const s of skipped.slice(0, 8)) console.log("      " + s.id.slice(0, 8) + "  " + s.why);
const byLang = {};
for (const v of victims) byLang[v.language] = (byLang[v.language] || 0) + 1;
console.log("  by language             " + JSON.stringify(byLang));
if (victims.length !== groups.size * 2) {
  console.log("  NOTE: not exactly two per group. That is reported, not corrected.");
}
if (!victims.length) { console.log("Nothing to delete."); process.exit(0); }
if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing deleted. Re-run with --apply."); process.exit(0); }

/* ---- the recovery file, BEFORE the first delete ---- */
const recPath = join(ROOT, SLUG + "-RESTALE-RECOVERY.json");
if (existsSync(recPath)) {
  console.error("REFUSING: " + recPath.split(/[\\/]/).pop() + " already exists. A second run would");
  console.error("overwrite the only copy of the rows the first one deleted. Move it aside first.");
  process.exit(2);
}
writeFileSync(recPath, JSON.stringify({ _what: "Full dump of the sibling rows deleted by " +
  "restale-siblings.mjs so the translator could regenerate them. Ruled PROMPT-121 s2b. Re-insertable " +
  "as-is if a regeneration goes wrong.", cert: CERT, from: FROM, at: new Date().toISOString(),
  rows: victims }, null, 1) + "\n");
console.log("  wrote " + recPath.split(/[\\/]/).pop() + " (" + victims.length + " row(s)) BEFORE deleting");

let gone = 0;
for (const v of victims) {
  const res = await fetch(REST_URL + "/quiz_questions?id=eq." + v.id, { method: "DELETE", headers: H });
  if (!res.ok) { console.error("  DELETE failed " + v.id.slice(0, 8) + ": " + res.status + " " + (await res.text()).slice(0, 140)); continue; }
  gone++;
}
console.log("  deleted " + gone + " of " + victims.length);

/* ---------------------------------------------------- POST-CONDITIONS */
const after = await getAll(KEY, "quiz_questions?select=id,language,question_group_id,status,retired_at" +
  "&certification_id=eq." + cert.id + "&order=id");
const left = after.filter((r) => r.question_group_id && groups.has(r.question_group_id) && r.language !== "en");
const englishLeft = after.filter((r) => named.has(r.id)).length;
console.log("");
console.log("POST-CONDITIONS");
console.log("  siblings remaining in those groups   " + left.length + "   (expected 0)");
console.log("  the ENGLISH rows are untouched       " + englishLeft + " of " + named.size);
/* THE NEGATIVE HALF: no row outside those groups was deleted */
const before = all.length, nowCount = after.length;
console.log("  rows on " + CERT + "                     " + before + " -> " + nowCount +
  "   fell by " + (before - nowCount) + "   (expected " + gone + ")");
const ok = left.length === 0 && englishLeft === named.size && (before - nowCount) === gone;
console.log("  " + (ok ? "all three hold" : "A POST-CONDITION FAILED -- see above"));
console.log("");
console.log("  NOW RE-RUN translate-grounded-items.mjs: these " + named.size + " item(s) are back in scope.");
if (!ok) process.exitCode = 2;
