#!/usr/bin/env node
/**
 * READ-ONLY, NO MODEL CALLS. Measure modal drift across a certification's translated siblings.
 *
 * Ruled PROMPT-117 s4: a REPORT, not a gate. It names its members, because the number on its own was
 * wrong twice -- first by testing whole fields, then by counting a question as a modal claim.
 *
 *   --cert=<CODE>       required
 *   --groups=<file>     limit to the groups of the rows named in a <SLUG>-INSERTED.json-shaped file
 *   --only-new          limit to the English rows recorded in <SLUG>-INSERTED.json
 *   --verbose           print every finding (default: the first 20)
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { driftInItem, modalDriftControls, LANGS } from "./lib/modal-drift.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let CERT = null, ONLY_NEW = false, VERBOSE = false;
for (const a of process.argv.slice(2)) {
  let m = a.match(/^--cert=(.+)$/); if (m) { CERT = m[1]; continue; }
  if (a === "--only-new") { ONLY_NEW = true; continue; }
  if (a === "--verbose") { VERBOSE = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=, --only-new, --verbose. READ-ONLY.");
  process.exit(2);
}
if (!CERT) { console.error("--cert=<CODE> is required."); process.exit(2); }

{
  const c = modalDriftControls();
  if (!c.examined) { console.error("REFUSING: the modal-drift controls examined NOTHING."); process.exit(2); }
  if (c.fails.length) { console.error("REFUSING: modal-drift controls fail: " + JSON.stringify(c.fails)); process.exit(2); }
  console.log("modal-drift controls: " + c.examined + " case(s), all pass");
}

const SLUG = CERT.replace(/-/g, "");
const KEY = requireKey(HERE);
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
const rows = await getAll(KEY, "quiz_questions?select=id,question_group_id,language,question_text," +
  "options,explanation,status,retired_at&certification_id=eq." + cert.id + "&retired_at=is.null&order=id");

let wantGroups = null;
if (ONLY_NEW) {
  const p = join(ROOT, SLUG + "-INSERTED.json");
  if (!existsSync(p)) { console.error("--only-new needs " + SLUG + "-INSERTED.json"); process.exit(2); }
  const ids = new Set(JSON.parse(readFileSync(p, "utf8")).batches.flatMap((b) => b.ids));
  wantGroups = new Set(rows.filter((r) => ids.has(r.id)).map((r) => r.question_group_id).filter(Boolean));
  console.log("--only-new: " + ids.size + " English row(s) -> " + wantGroups.size + " group(s)");
}

const per = new Map();
for (const r of rows) {
  if (!r.question_group_id) continue;
  if (wantGroups && !wantGroups.has(r.question_group_id)) continue;
  if (!per.has(r.question_group_id)) per.set(r.question_group_id, []);
  per.get(r.question_group_id).push(r);
}

const findings = [];
let groups = 0, pairs = 0, examined = 0, undecidable = 0, questions = 0;
const unaligned = [];
for (const [g, list] of per) {
  const en = list.find((x) => x.language === "en");
  if (!en) continue;
  groups++;
  for (const lang of LANGS) {
    const tr = list.find((x) => x.language === lang);
    if (!tr) continue;
    pairs++;
    const r = driftInItem(en, tr, lang);
    for (const f of r.findings) findings.push({ ...f, group: g, en_id: en.id, tr_id: tr.id });
    examined += r.examined; undecidable += r.undecidable; questions += r.questions;
    for (const u of r.unaligned) unaligned.push({ group: g, lang, field: u });
  }
}

const nonStem = findings.filter((f) => f.field !== "stem");
console.log("");
console.log("MODAL DRIFT   " + CERT + "   English hedge -> translated requirement");
console.log("  groups / sibling pairs        " + groups + " / " + pairs);
console.log("  hedged sentences examined     " + examined);
console.log("  excluded: questions           " + questions + "   (a question is not a modal claim)");
console.log("  excluded: both modals present " + undecidable + "   (undecidable here)");
console.log("  COULD NOT ALIGN (field pairs) " + unaligned.length + "   -- not counted clean");
console.log("  FINDINGS                      " + findings.length + "   of which non-stem " + nonStem.length);
const byLang = {}, byField = {};
for (const f of findings) {
  byLang[f.lang] = (byLang[f.lang] || 0) + 1;
  const k = f.field.replace(/ [a-h]$/, " *");
  byField[k] = (byField[k] || 0) + 1;
}
console.log("  by language                   " + JSON.stringify(byLang));
console.log("  by field                      " + JSON.stringify(byField));
console.log("");
for (const f of (VERBOSE ? findings : findings.slice(0, 20))) {
  console.log("  " + f.lang + "  " + f.field + "  group " + f.group.slice(0, 8) + "  row " + f.tr_id.slice(0, 8));
  console.log("      en: " + f.en.slice(0, 170));
  console.log("      tr: " + f.tr.slice(0, 170));
}
if (!VERBOSE && findings.length > 20) console.log("  ... " + (findings.length - 20) + " more (--verbose)");
if (unaligned.length) {
  console.log("");
  console.log("  unalignable field pairs (reported, never counted clean):");
  for (const u of unaligned.slice(0, 10)) console.log("    " + u.lang + "  " + u.field + "  " + u.group.slice(0, 8));
}
