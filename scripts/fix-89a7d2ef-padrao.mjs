#!/usr/bin/env node
/**
 * fix-89a7d2ef-padrao.mjs -- restore "standard" to SD-AI-I 89a7d2ef's pt-BR explanation.
 *
 * `--apply` to write, DRY BY DEFAULT, unknown flags exit 2.
 *
 * Ruled PROMPT-90 s2. The English reads "a standard trunk-based development pattern" -- TWO words that
 * both render as `padrao`, which is how "padrao padrao" arose. Removing the duplicate was the right first
 * move and lost "standard"; this restores it as `um padrao comum de desenvolvimento trunk-based`, keeping
 * the dev term in English as elsewhere in this bank.
 *
 * The edit is asserted to be exactly this substitution and nothing else: the old phrase occurs once, the
 * new text differs from the current text only at that span, and the rest of the explanation is unchanged
 * character for character. A translated field is reviewed text and every regenerated word is an
 * unreviewed word.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply (dry by default).");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const PREFIX = "89a7d2ef";
const FROM = "um padrão do desenvolvimento baseado em trunk";
const TO = "um padrão comum de desenvolvimento trunk-based";

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq.SD-AI-I");
const rows = await getAll(KEY, "quiz_questions?select=id,language,question_group_id,question_text," +
  "options,explanation,pool,status,visibility,is_exam_scope&certification_id=eq." + certs[0].id +
  "&order=id");
const row = rows.find((r) => String(r.id).startsWith(PREFIX) && r.language === "pt-BR");
if (!row) { console.error("ABORT: " + PREFIX + " pt-BR not found"); process.exit(2); }

const before = String(row.explanation || "");
const n = before.split(FROM).length - 1;
if (n !== 1) {
  console.error("ABORT: the phrase " + JSON.stringify(FROM) + " occurs " + n + " time(s); expected 1.");
  console.error("current: " + before.slice(0, 220));
  process.exit(2);
}
const after = before.replace(FROM, TO);
/* the ONLY difference must be that span: everything before and after it is identical */
const at = before.indexOf(FROM);
if (before.slice(0, at) !== after.slice(0, at) ||
    before.slice(at + FROM.length) !== after.slice(at + TO.length)) {
  console.error("ABORT: the edit changed text outside the intended span.");
  process.exit(2);
}
const sib = rows.find((r) => r.question_group_id === row.question_group_id && r.language === "en");
console.log(PREFIX + " pt-BR explanation   pool=" + row.pool + " status=" + row.status);
console.log("  BEFORE: " + before.slice(0, 190).replace(/\s+/g, " "));
console.log("  AFTER : " + after.slice(0, 190).replace(/\s+/g, " "));
console.log("  en    : " + String((sib || {}).explanation || "(no sibling)").slice(0, 190).replace(/\s+/g, " "));

if (!APPLY) {
  console.log("\nDRY RUN -- nothing written. Re-run with --apply.");
} else {
  const res = await fetch(REST_URL + "/quiz_questions?id=eq." + row.id, {
    method: "PATCH",
    headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
      Prefer: "return=representation" },
    /* the three columns are named and unchanged, so no default can decide one behind this edit */
    body: JSON.stringify({ explanation: after, status: row.status, visibility: row.visibility,
      is_exam_scope: row.is_exam_scope }),
  });
  if (!res.ok) throw new Error("patch failed: " + res.status + " " + (await res.text()));
  const got = await res.json();
  if (got.length !== 1) throw new Error("patch touched " + got.length + " rows");

  const back = (await getAll(KEY, "quiz_questions?select=id,explanation,status,visibility,is_exam_scope" +
    "&certification_id=eq." + certs[0].id + "&language=eq.pt-BR&order=id")).find((r) => r.id === row.id);
  let fails = 0;
  const ok = (what, cond) => { console.log((cond ? "  ok   " : "  FAIL ") + what); if (!cond) fails++; };
  console.log("\nread-back:");
  ok("reads exactly as planned", String(back.explanation) === after);
  ok("carries \"padrão comum\"", String(back.explanation).includes("padrão comum"));
  ok("no doubled padrão remains", !/padrão\s+padrão/.test(String(back.explanation)));
  ok("status/visibility/is_exam_scope unchanged",
    back.status === row.status && back.visibility === row.visibility &&
    back.is_exam_scope === row.is_exam_scope);
  console.log("\n  pt-BR: " + String(back.explanation).replace(/\s+/g, " ").slice(0, 200));
  console.log("  en   : " + String((sib || {}).explanation || "").replace(/\s+/g, " ").slice(0, 200));
  writeFileSync(join(ROOT, "FIX-89A7D2EF.json"), JSON.stringify({
    id: PREFIX, field: "explanation", from: FROM, to: TO,
    after: back.explanation, english_sibling: (sib || {}).explanation || null,
  }, null, 1) + String.fromCharCode(10), "utf8");
  console.log("wrote FIX-89A7D2EF.json");
  if (fails) { console.error("\n" + fails + " read-back assertion(s) FAILED"); process.exitCode = 1; }
}
