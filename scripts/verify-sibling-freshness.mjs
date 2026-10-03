#!/usr/bin/env node
/**
 * READ-ONLY. For named groups: the English KEY option beside each sibling's key option, so a sibling
 * still carrying the pre-revision wording is visible. Includes retired rows. No --apply exists.
 *
 * The lint proves zero glossary pins. It does NOT prove the sibling tracks the CURRENT English -- a
 * faithful translation of text that no longer exists passes every pin.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
let CERT = "AIMS-F";
const WANT = [];
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--cert=(.+)$/);
  if (m) { CERT = m[1]; continue; }
  if (a.startsWith("--")) { console.error("Unrecognised flag: " + a); process.exit(2); }
  WANT.push(a);
}
const KEY = requireKey(HERE);
const cert = (await getAll(KEY, "certifications?select=id&code=eq." + CERT))[0];
const all = await getAll(KEY, "quiz_questions?select=id,language,question_group_id,options," +
  "correct_answer,status,pool,visibility,is_exam_scope,retired_at&certification_id=eq." + cert.id + "&order=id");

for (const p of WANT) {
  const en = all.find((r) => String(r.id).startsWith(p) && r.language === "en");
  if (!en) { console.log("\n" + p + "  NO ENGLISH ROW"); continue; }
  const fam = all.filter((r) => r.question_group_id && r.question_group_id === en.question_group_id);
  const keyId = (en.correct_answer || [])[0];
  console.log("\n==== " + p + "   group of " + fam.length + "   key=" + keyId);
  for (const l of ["en", "es-419", "pt-BR"]) {
    const r = fam.find((x) => x.language === l);
    if (!r) { console.log("  " + l + "  MISSING"); continue; }
    const o = (r.options || []).find((x) => x.id === keyId);
    console.log("  " + l.padEnd(7) + " retired=" + (r.retired_at ? "YES" : "no") +
      " status=" + r.status + " pool=" + r.pool + " vis=" + r.visibility + " exam=" + r.is_exam_scope);
    console.log("    key(" + String(o && o.text || "").length + "c): " +
      String(o && o.text || "").replace(/\s+/g, " "));
  }
}
