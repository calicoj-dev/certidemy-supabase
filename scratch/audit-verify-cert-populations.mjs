#!/usr/bin/env node
/**
 * READ-ONLY. What population does each verify-cert population-variable actually hold, and how does it
 * differ from the SERVED pool (generate-mock-exam mode='exam')? No --apply exists.
 *
 * Ruled PROMPT-110 s2. Two numbers in the PROMPT-109 report disagreed: 8.1 read "3/363" while the
 * live exam pool is 357 per language. Neither was wrong about retirement -- verify-cert's fetch does
 * filter `retired_at is null` -- the gap is that 8.1's population is "secure + English + 3 options",
 * which includes secure rows that are not SERVED.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "../scripts/_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
let CERT = "AIMS-F";
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--cert=(.+)$/);
  if (m) { CERT = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=<CODE>. READ-ONLY."); process.exit(2);
}
const KEY = requireKey(join(HERE, "..", "scripts"));
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
const all = await getAll(KEY, "quiz_questions?select=id,language,pool,status,is_exam_scope,retired_at," +
  "item_origin,options,correct_answer,question_group_id&certification_id=eq." + cert.id + "&order=id");

const live = all.filter((r) => r.retired_at === null);
const enSecure3 = live.filter((r) => r.pool === "secure" && r.language === "en" &&
  Array.isArray(r.options) && r.options.length >= 3);
/* generate-mock-exam mode='exam', transcribed */
const served = live.filter((r) => r.pool === "secure" && r.language === "en" &&
  r.status === "approved" && r.item_origin !== "generated" && r.is_exam_scope === true);

console.log("POPULATIONS   " + CERT);
console.log("  all rows (incl. retired)                 " + all.length);
console.log("  live rows (retired_at is null)           " + live.length);
console.log("  verify-cert `en` = secure+en+3 options    " + enSecure3.length + "   <- what 8.1 reads today");
console.log("  SERVED pool (mode='exam', en)            " + served.length + "   <- what a candidate sees");
console.log("");
const servedIds = new Set(served.map((r) => r.id));
const extra = enSecure3.filter((r) => !servedIds.has(r.id));
console.log("  in `en` but NOT served: " + extra.length);
for (const r of extra) {
  const why = [];
  if (r.status !== "approved") why.push("status=" + r.status);
  if (r.is_exam_scope !== true) why.push("is_exam_scope=" + r.is_exam_scope);
  if (r.item_origin === "generated") why.push("item_origin=generated");
  console.log("    " + r.id.slice(0, 8) + "  " + why.join(", "));
}
const missing = served.filter((r) => !enSecure3.some((x) => x.id === r.id));
console.log("  served but NOT in `en`: " + missing.length +
  (missing.length ? "  " + missing.slice(0, 5).map((r) => r.id.slice(0, 8)).join(",") : ""));
