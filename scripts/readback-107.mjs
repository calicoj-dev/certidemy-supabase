#!/usr/bin/env node
/* Read-only. Prints a group in every language so a sibling can be checked against its English. */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const WANT = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!WANT.length) { console.error("usage: readback-107.mjs <uuid-prefix>..."); process.exit(2); }
const KEY = requireKey(HERE);
const cert = (await getAll(KEY, "certifications?select=id&code=eq.AIMS-F"))[0];
const rows = await getAll(KEY, "quiz_questions?select=id,question_group_id,language,question_text,options," +
  "correct_answer,explanation,status,pool,visibility,is_exam_scope&certification_id=eq." + cert.id +
  "&retired_at=is.null&order=id");
for (const p of WANT) {
  const en = rows.find((r) => String(r.id).startsWith(p) && r.language === "en");
  if (!en) { console.log("\n!! no English row for " + p); continue; }
  const fam = rows.filter((r) => r.question_group_id && r.question_group_id === en.question_group_id);
  console.log("\n================ group of " + p + "   (" + fam.length + " row(s))");
  for (const l of ["en", "es-419", "pt-BR"]) {
    const r = fam.find((x) => x.language === l);
    if (!r) { console.log("  " + l + ": MISSING"); continue; }
    console.log("  --- " + l + "   status=" + r.status + " pool=" + r.pool + " vis=" + r.visibility +
      " exam=" + r.is_exam_scope + " key=" + JSON.stringify(r.correct_answer));
    console.log("    Q: " + String(r.question_text).replace(/\s+/g, " "));
    for (const o of r.options || []) {
      console.log("      " + o.id + " " + String(o.text).replace(/\s+/g, " "));
    }
    console.log("    E: " + String(r.explanation || "").replace(/\s+/g, " ").slice(0, 260));
  }
}
