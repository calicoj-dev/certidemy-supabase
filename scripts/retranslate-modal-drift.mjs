#!/usr/bin/env node
/**
 * retranslate-modal-drift.mjs -- repair the sibling FIELDS that state a requirement the English only
 * recommended. WRITES with `--apply`; dry by default. Unknown flags exit 2.
 *
 * Ruled PROMPT-117 s4: "re-translate only the sibling fields behind the findings". So:
 *
 * ============ THE TARGET LIST IS DERIVED, NEVER TYPED ============
 *
 * The fields come from `lib/modal-drift.mjs` run against the LIVE rows at the moment of the repair. A
 * hand-kept list would repair what the measurement said yesterday, and the thing being asserted
 * afterwards is that the measurement now reports zero -- which a stale list cannot deliver.
 *
 * ============ ONE FIELD AT A TIME, AND NOTHING ELSE MOVES ============
 *
 * The model is given the English sentence, the current translation and the modal rule, and returns the
 * corrected translation of THAT FIELD. Option ids, `correct_answer`, the other options and every other
 * column are untouched, and the write asserts it. A fresh whole-item translation would re-word text
 * nobody asked about -- every regenerated word is an unreviewed word.
 *
 * ============ A REPAIR THAT DOES NOT CLEAR THE FINDING IS NOT WRITTEN ============
 *
 * The returned text is re-measured before it is accepted. If it still reads as a requirement, or if it
 * no longer aligns sentence-for-sentence with the English, the field is left ALONE and reported. The
 * point is a measured zero, not a second guess written over a first.
 *
 *   --cert=<CODE>     required
 *   --max-usd=<n>     required (PROMPT-117 s3's rule, applied here too)
 *   --only-new        limit to the rows named in <SLUG>-INSERTED.json (default: the whole cert)
 *   --kept            limit to the AUDIT-KEPT rows in <SLUG>-SURVIVORS.json -- the population
 *                     PROMPT-118 s4 deferred to after the cutover. Same resolution as
 *                     check-modal-drift's --kept, so repair and measurement cover one population.
 *   --limit=<n>       repair only the first n fields
 *   --apply           write
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { driftInField, driftInItem, MODAL_BRIEF, modalDriftControls, LANGS } from "./lib/modal-drift.mjs";
import { itemIdOfStem } from "./lib/item-id.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
let CERT = null, APPLY = false, LIMIT = 0, MAXUSD = null, PRINTED = false, ONLY_NEW = false, KEPT = false;
let IDS = [], ALL_CERT = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  let m = a.match(/^--cert=(.+)$/); if (m) { CERT = m[1]; continue; }
  m = a.match(/^--limit=([0-9]+)$/); if (m) { LIMIT = Number(m[1]); continue; }
  m = a.match(/^--max-usd=([0-9.]+)$/); if (m) { MAXUSD = Number(m[1]); continue; }
  if (a === '--only-new') { ONLY_NEW = true; continue; }
  if (a === '--kept') { KEPT = true; continue; }
  if (a === '--all-cert') { ALL_CERT = true; continue; }
  { const mi = a.match(/^--ids=(.+)$/); if (mi) { IDS = mi[1].split(',').map((x) => x.trim()).filter(Boolean); continue; } }
  console.error("Unrecognised flag: " + a +
    ". Known: --cert=, --max-usd=, --limit=, --only-new, --kept, --ids=, --all-cert, --apply.");
  console.error("(This directory has two flag conventions: this script is the --apply family, dry by default.)");
  process.exit(2);
}
if (!CERT) { console.error("--cert=<CODE> is required."); process.exit(2); }

/* ============ THE SCOPE MUST BE EXPLICIT (ruled PROMPT-128 s3) ============
 *
 * `--cert ISMS-IA` alone meant THE WHOLE CERTIFICATION, and in PROMPT-127 that silently repaired 88
 * translated fields on live approved AUTHORED rows -- items already ruled for replacement -- then
 * stopped at its ceiling leaving 209 findings, a half-repaired bank. The default was the widest
 * possible blast radius, which is backwards for a script that edits served text.
 *
 * There is no default any more. `--all-cert` still does the wide run; it just has to be typed. */
if (!ONLY_NEW && !KEPT && !IDS.length && !ALL_CERT) {
  console.error("REFUSING: no scope. This script EDITS SERVED TEXT, so the scope is never implied.");
  console.error("  --only-new    the rows in <SLUG>-INSERTED.json");
  console.error("  --kept        the audit-kept rows in <SLUG>-SURVIVORS.json");
  console.error("  --ids=a,b     named item ids");
  console.error("  --all-cert    EVERY row of the certification, authored and served included");
  console.error("");
  console.error("PROMPT-127 ran this without a scope and repaired 88 fields nobody had asked for.");
  process.exit(2);
}
{
  const named = [ONLY_NEW && "--only-new", KEPT && "--kept", IDS.length && "--ids", ALL_CERT && "--all-cert"]
    .filter(Boolean);
  if (named.length > 1) {
    console.error("REFUSING: " + named.join(" and ") + " name different scopes. Pass exactly one.");
    process.exit(2);
  }
}
if (MAXUSD === null) { console.error("--max-usd=<n> is required (PROMPT-117 s3). 0 means no ceiling and must be typed."); process.exit(2); }

{
  const c = modalDriftControls();
  if (!c.examined) { console.error("REFUSING: modal-drift controls examined NOTHING."); process.exit(2); }
  if (c.fails.length) { console.error("REFUSING: modal-drift controls fail: " + JSON.stringify(c.fails)); process.exit(2); }
  console.log("modal-drift controls: " + c.examined + " case(s), all pass");
}

const MODEL = process.env.GROUNDED_MODEL || "claude-opus-5";
const PRICE = { input: 15, output: 75 };
const AK = process.env.ANTHROPIC_API_KEY ||
  (readFileSync(join(HERE, ".env"), "utf8").match(/^ANTHROPIC_API_KEY=(.+)$/m) || [])[1];
if (!AK) { console.error("ANTHROPIC_API_KEY not found"); process.exit(2); }
let IN_TOK = 0, OUT_TOK = 0, CALLS = 0;
const usd = () => (IN_TOK / 1e6) * PRICE.input + (OUT_TOK / 1e6) * PRICE.output;
async function claude(system, user, maxTokens = 900) {
  for (let a = 1; ; a++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST",
        headers: { "x-api-key": AK, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system,
          messages: [{ role: "user", content: user }] }) });
      if (!res.ok) throw new Error("Anthropic " + res.status + ": " + (await res.text()).slice(0, 200));
      const d = await res.json();
      CALLS++; IN_TOK += d.usage?.input_tokens || 0; OUT_TOK += d.usage?.output_tokens || 0;
      return (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    } catch (e) { if (a >= 3) throw e; await new Promise((r) => setTimeout(r, 800 * a)); }
  }
}
const parseObj = (t) => { const s = String(t || ""); const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; } };

const LANG_NAME = { "es-419": "Latin American Spanish", "pt-BR": "Brazilian Portuguese" };
const SYSTEM =
  "You are correcting ONE FIELD of an already-translated examination item. The translation states a " +
  "REQUIREMENT where the English only recommends or permits. Correct the modal force and change " +
  "NOTHING ELSE: same meaning, same register, same terminology, same length as far as the language " +
  "allows.\n\n" + MODAL_BRIEF + "\n\n" +
  "Return ONE JSON object and nothing else:\n" +
  '{ "text": "the corrected translation of this field", "what_changed": "the modal words you changed" }';

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
/* ============ THE SELECT CARRIES EVERY COLUMN THE POST-CONDITIONS ASSERT ON ============
 *
 * THIRD INSTANCE of this defect in this repository. `verify-cert` tested `retired_at` without
 * selecting it and skipped 2,127 rows; `check-task-map` omitted `question_group_id` and read AIMS-F
 * as 0 at floor; here `pool`, `visibility` and `is_exam_scope` were missing, so the "before" value was
 * `undefined` and the post-condition reported A NAMED COLUMN MOVED on a row where nothing had moved.
 * The names are listed beside the assertion below so the two cannot drift apart again. */
const ASSERTED_COLS = ["status", "pool", "visibility", "is_exam_scope", "question_group_id",
  "correct_answer", "question_text", "explanation", "options"];
const rows = await getAll(KEY, "quiz_questions?select=id,language,retired_at," + ASSERTED_COLS.join(",") +
  "&certification_id=eq." + cert.id + "&retired_at=is.null&order=id");
/* ============ SCOPE IS A DECISION, AND THE DEFAULT IS THE WHOLE CERTIFICATION ============
 *
 * The dry run over ISMS-F named 104 fields, not the 12 the ruling is about: ~92 of them are in the
 * AUTHORED bank, translated long before this and already approved and served. Repairing those is a
 * separate decision with a separate blast radius, so `--only-new` limits the run to the English rows
 * in <SLUG>-INSERTED.json. The scope is printed either way -- a repair that silently covered the
 * served bank would be the worst version of this script. */
const SLUG = CERT.replace(/-/g, "");
let wantGroups = null;
if (ONLY_NEW) {
  const p = join(HERE, "..", SLUG + "-INSERTED.json");
  if (!existsSync(p)) { console.error("--only-new needs " + SLUG + "-INSERTED.json"); process.exit(2); }
  const ins = new Set(JSON.parse(readFileSync(p, "utf8")).batches.flatMap((b) => b.ids));
  wantGroups = new Set(rows.filter((r) => ins.has(r.id)).map((r) => r.question_group_id).filter(Boolean));
  console.log("SCOPE: --only-new   " + ins.size + " inserted English row(s) -> " + wantGroups.size + " group(s)");
} else if (KEPT) {
  /* --kept: the AUDIT-KEPT items, the population PROMPT-118 s4 ruled the post-cutover repair for.
   * Identical resolution to check-modal-drift's --kept, so the repairer and the measurement cover
   * the same rows: THE KEEP IDS ARE UUID PREFIXES, not stem hashes. A stem-hash match resolved
   * 0 of 143 when that was first written, and the refusal below is what caught it. */
  const p = join(HERE, "..", SLUG + "-SURVIVORS.json");
  if (!existsSync(p)) { console.error("--kept needs " + SLUG + "-SURVIVORS.json"); process.exit(2); }
  const keep = new Set((JSON.parse(readFileSync(p, "utf8")).keep_ids || []).map(String));
  if (!keep.size) { console.error("REFUSING: the keep list is empty, so --kept would repair nothing."); process.exit(2); }
  const en = rows.filter((r) => r.language === "en");
  wantGroups = new Set(en.filter((r) => [...keep].some((k) => String(r.id).startsWith(k)))
    .map((r) => r.question_group_id).filter(Boolean));
  console.log("SCOPE: --kept   " + keep.size + " keep id(s) -> " + wantGroups.size + " group(s) resolved");
  if (!wantGroups.size) { console.error("REFUSING: no keep id resolved to a live group."); process.exit(2); }
} else if (IDS.length) {
  /* --ids: named item ids, resolved through the ENGLISH row's stem hash the way every other
   * id-taking script in this directory does it. A named id that resolves to nothing is a surprise. */
  const en = rows.filter((r) => r.language === "en");
  const hit = en.filter((r) => IDS.includes(itemIdOfStem(r.question_text)));
  wantGroups = new Set(hit.map((r) => r.question_group_id).filter(Boolean));
  console.log("SCOPE: --ids   " + IDS.length + " id(s) -> " + wantGroups.size + " group(s) resolved");
  const missing = IDS.filter((i) => !en.some((r) => itemIdOfStem(r.question_text) === i));
  if (missing.length) {
    console.error("REFUSING: " + missing.length + " named id(s) resolve to no live English row: " +
      missing.join(", "));
    process.exit(2);
  }
} else {
  /* --all-cert, and it has to have been typed: see the scope refusal above. */
  console.log("SCOPE: --all-cert   THE WHOLE CERTIFICATION, including the authored bank already " +
    "approved and served. This was the silent default until PROMPT-128 s3.");
}
const per = new Map();
for (const r of rows) {
  if (!r.question_group_id) continue;
  if (wantGroups && !wantGroups.has(r.question_group_id)) continue;
  if (!per.has(r.question_group_id)) per.set(r.question_group_id, []);
  per.get(r.question_group_id).push(r);
}

/* ---------------------------------------------------- derive the target fields */
const targets = [];
for (const [g, list] of per) {
  const en = list.find((x) => x.language === "en");
  if (!en) continue;
  for (const lang of LANGS) {
    const tr = list.find((x) => x.language === lang);
    if (!tr) continue;
    const r = driftInItem(en, tr, lang);
    for (const f of r.findings) targets.push({ group: g, lang, field: f.field, en_row: en, tr_row: tr });
  }
}
console.log("");
console.log("RETRANSLATE MODAL DRIFT   " + CERT + (APPLY ? "   --apply" : "   dry run (default)") +
  "   ceiling $" + MAXUSD);
console.log("  fields the measurement names: " + targets.length);
const byField = {};
for (const t of targets) byField[t.lang + " " + t.field.replace(/ [a-h]$/, " *")] =
  (byField[t.lang + " " + t.field.replace(/ [a-h]$/, " *")] || 0) + 1;
console.log("  " + JSON.stringify(byField));
if (!targets.length) { console.log("Nothing to repair."); process.exit(0); }
const batch = LIMIT ? targets.slice(0, LIMIT) : targets;

/* a field's current text, and the English beside it */
const textOf = (row, field) => {
  if (field === "stem") return row.question_text;
  if (field === "explanation") return row.explanation;
  const id = field.replace(/^option\s+/, "");
  const o = (row.options || []).find((x) => x.id === id);
  return o ? o.text : null;
};

const repairs = [], refused = [];
for (const t of batch) {
  const enText = textOf(t.en_row, t.field);
  const trText = textOf(t.tr_row, t.field);
  if (!enText || !trText) { refused.push({ ...t, why: "the field is empty on one side" }); continue; }
  if (MAXUSD && usd() >= MAXUSD) { refused.push({ ...t, why: "ceiling reached before this field" }); continue; }
  const user = "LANGUAGE: " + LANG_NAME[t.lang] + "\nFIELD: " + t.field +
    "\n\nENGLISH (authoritative):\n" + enText +
    "\n\nCURRENT TRANSLATION (states a requirement the English does not):\n" + trText +
    "\n\nReturn the corrected translation of this field.";
  if (!PRINTED) {
    PRINTED = true;
    console.log("");
    console.log("  ---- FULL PROMPT, FIRST FIELD (standing rule, PROMPT-115) ----");
    console.log("  SYSTEM: " + SYSTEM.replace(/\n/g, "\n  "));
    console.log("  USER:   " + user.replace(/\n/g, "\n  "));
    console.log("  ---- END PROMPT ----");
    console.log("");
  }
  if (!APPLY) { refused.push({ ...t, why: "dry run: no call made" }); continue; }
  const got = parseObj(await claude(SYSTEM, user));
  const neu = got && typeof got.text === "string" ? got.text.trim() : null;
  if (!neu) { refused.push({ ...t, why: "the model returned no usable text" }); continue; }
  /* ---- re-measure BEFORE accepting ---- */
  const check = driftInField(enText, neu, t.lang, t.field);
  if (!check.aligned) {
    refused.push({ ...t, why: "the repair no longer aligns sentence-for-sentence with the English" });
    continue;
  }
  if (check.findings.length) {
    refused.push({ ...t, why: "the repair STILL states a requirement: " + neu.slice(0, 90) });
    continue;
  }
  if (neu === trText) { refused.push({ ...t, why: "the model returned the same text" }); continue; }
  repairs.push({ ...t, from: trText, to: neu, what: got.what_changed || null });
  console.log("  " + t.lang + "  " + t.field.padEnd(12) + " " + t.tr_row.id.slice(0, 8) +
    "   repaired   $" + usd().toFixed(3));
  console.log("      was: " + trText.slice(0, 150));
  console.log("      now: " + neu.slice(0, 150));
}

console.log("");
console.log("  repaired " + repairs.length + " of " + batch.length + "   refused " + refused.length);
for (const r of refused.slice(0, 12)) console.log("      " + r.lang + "  " + r.field + "  " + r.why);
console.log("  spend $" + usd().toFixed(4) + " over " + CALLS + " call(s), ceiling $" + MAXUSD);
if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written and no model call made. Re-run with --apply."); process.exit(0); }
if (!repairs.length) { console.log("Nothing to write."); process.exit(0); }

/* ---------------------------------------------------- write, one row at a time */
const patch = async (id, body) => {
  const res = await fetch(REST_URL + "/quiz_questions?id=eq." + id, { method: "PATCH",
    headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error("PATCH " + id + ": " + res.status + " " + text.slice(0, 200));
  return JSON.parse(text)[0];
};
/* group the repairs by row: two fields of one row are ONE patch, or the second read would overwrite
 * the first with a stale options array. */
const byRow = new Map();
for (const r of repairs) {
  if (!byRow.has(r.tr_row.id)) byRow.set(r.tr_row.id, { row: r.tr_row, fields: [] });
  byRow.get(r.tr_row.id).fields.push(r);
}
const written = [];
for (const [id, { row, fields }] of byRow) {
  const body = {};
  let options = row.options ? JSON.parse(JSON.stringify(row.options)) : null;
  for (const fr of fields) {
    if (fr.field === "stem") body.question_text = fr.to;
    else if (fr.field === "explanation") body.explanation = fr.to;
    else {
      const oid = fr.field.replace(/^option\s+/, "");
      const idx = (options || []).findIndex((x) => x.id === oid);
      if (idx < 0) throw new Error(id + ": option " + oid + " not found");
      options[idx] = { ...options[idx], text: fr.to };
      body.options = options;
    }
  }
  const back = await patch(id, body);
  written.push({ id, back, fields: fields.map((f) => f.field) });
}
console.log("");
console.log("  patched " + written.length + " sibling row(s), " + repairs.length + " field(s)");

/* ---------------------------------------------------- POST-CONDITIONS */
const ids = written.map((w) => w.id);
const after = await getAll(KEY, "quiz_questions?select=id,language,status,pool,visibility,is_exam_scope," +
  "options,correct_answer,question_group_id,question_text,explanation&id=in.(" + ids.join(",") + ")&order=id");
console.log("");
console.log("POST-CONDITIONS");
console.log("  rows read back        " + after.length + " of " + ids.length);
let bad = 0, unasserted = 0;
for (const w of written) {
  const b = after.find((x) => x.id === w.id);
  const was = w.row || byRow.get(w.id).row;
  if (!b) { console.log("      MISSING " + w.id); bad++; continue; }
  /* the key and the option set must be IDENTICAL: this repair changes words, never structure */
  if (JSON.stringify(b.correct_answer) !== JSON.stringify(was.correct_answer)) {
    console.log("      KEY MOVED on " + w.id.slice(0, 8)); bad++;
  }
  if ((b.options || []).map((o) => o.id).join(",") !== (was.options || []).map((o) => o.id).join(",")) {
    console.log("      OPTION IDS CHANGED on " + w.id.slice(0, 8)); bad++;
  }
  /* AN UNDEFINED "BEFORE" IS NOT A PASS AND NOT A FAILURE: it is a column this run never read, and
   * saying so is the difference between a defect in the data and a defect in the instrument. */
  for (const col of ["status", "pool", "visibility", "is_exam_scope", "question_group_id"]) {
    if (was[col] === undefined) {
      console.log("      COULD NOT ASSERT " + col + " on " + w.id.slice(0, 8) +
        " -- it is not in the select, so there is no before-value to compare");
      unasserted++;
      continue;
    }
    if (b[col] !== was[col]) {
      console.log("      " + col + " MOVED on " + w.id.slice(0, 8) + ": " +
        JSON.stringify(was[col]) + " -> " + JSON.stringify(b[col])); bad++;
    }
  }
  /* and the fields NOT named in this repair must be byte-identical */
  const touched = new Set(w.fields);
  if (!touched.has("stem") && b.question_text !== was.question_text) {
    console.log("      STEM CHANGED but was not a target on " + w.id.slice(0, 8)); bad++;
  }
  if (!touched.has("explanation") && b.explanation !== was.explanation) {
    console.log("      EXPLANATION CHANGED but was not a target on " + w.id.slice(0, 8)); bad++;
  }
  for (const o of (was.options || [])) {
    if (touched.has("option " + o.id)) continue;
    const now = (b.options || []).find((x) => x.id === o.id);
    if (!now || now.text !== o.text) { console.log("      OPTION " + o.id + " CHANGED but was not a target on " + w.id.slice(0, 8)); bad++; }
  }
}
console.log("  structure and untargeted fields unchanged: " + (bad ? bad + " VIOLATION(S)" : "all " + written.length + " rows"));
if (unasserted) console.log("  COULD NOT ASSERT " + unasserted + " column check(s) -- not a pass");
if (bad || unasserted) process.exitCode = 2;
