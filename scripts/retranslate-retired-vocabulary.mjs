#!/usr/bin/env node
/**
 * retranslate-retired-vocabulary.mjs - re-translate rows whose translation reintroduced
 * a term the 2020 Scrum Guide retired.
 *
 * --apply TO WRITE. Dry by default. Unknown flags exit 2.
 *
 * WHY RE-TRANSLATE RATHER THAN PATCH
 * ----------------------------------
 * A patched translation and a translation of the corrected source are not the same
 * artifact. Patching swaps a word inside a sentence that was built around it; the
 * sentence keeps the shape the wrong term gave it, and the three language rows stop
 * being translations of one English item and become one English item plus two edited
 * derivatives. Re-translating from English regenerates the whole row under the fixed
 * contract, which is what `scripts/lib/item-translation.mjs` now carries.
 *
 * WHAT IS PRESERVED, AND WHY IT MUST BE
 * -------------------------------------
 * Option IDS, CORRECT_ANSWER, QUESTION_TYPE and DIFFICULTY are grafted from the English
 * row and never taken from the model. The cue guard shuffled option positions before
 * insert and the key is bound to an id; a translator that reordered or renumbered would
 * silently move the answer. This is the same graft the generators use.
 *
 * SELECTION IS BY PATTERN, NOT BY A LIST OF IDS. It finds every non-English row whose
 * text matches its own language's retired-term pattern, so it is re-runnable and works
 * on any cert. RETIRED_HARD is the same list the translation prompt forbids, so the
 * checker and the instruction read from one declaration. The AMBIGUOUS half lives in
 * RETIRED_SOFT and is never selected on: the ceremony family is ordinary language as
 * often as it is the retired term, and rewriting a correct row is a worse outcome than
 * leaving a questionable one for a human to read.
 *
 * IT DOES NOT TOUCH ENGLISH. If the English itself carries a retired term that is a
 * generation defect, not a translation defect, and it belongs in the English row where
 * verify-cert's items.vocabulary can see it.
 *
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   CERT_ID=... node scripts/retranslate-retired-vocabulary.mjs [--pool secure] [--apply]
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { translateSystem, RETIRED_HARD } from "./lib/item-translation.mjs";

const KNOWN = new Set(["--apply", "--pool"]);
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error(`Unrecognised flag: ${a}`);
    console.error("This script opts into WRITING with --apply and is DRY by default.");
    console.error("Other scripts in this repo opt into SAFETY with --dry and are LIVE without it.");
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");
const poolArg = process.argv.indexOf("--pool");
const POOL = poolArg >= 0 ? process.argv[poolArg + 1] : null;

for (const p of ["scripts/.env", ".env"]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const CERT_ID = process.env.CERT_ID;
if (!CERT_ID) { console.error("Set CERT_ID."); process.exit(2); }
const KEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) { console.error("Set ANTHROPIC_API_KEY."); process.exit(2); }
const db = createClient(process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const LANG_NAME = { "es-419": "Latin American Spanish", "pt-BR": "Brazilian Portuguese" };

async function claude(system, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 4000, temperature: 0.2, system,
      messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  let t = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (!t.startsWith("[")) { const a = t.indexOf("["), b = t.lastIndexOf("]"); if (a !== -1 && b > a) t = t.slice(a, b + 1); }
  return JSON.parse(t);
}

// --- find the rows -----------------------------------------------------------
const rows = [];
for (let from = 0; ; from += 1000) {
  let q = db.from("quiz_questions")
    .select("id, question_group_id, pool, language, question_text, options, correct_answer, question_type, difficulty, explanation")
    .eq("certification_id", CERT_ID).is("retired_at", null).neq("language", "en").order("id").range(from, from + 999);
  if (POOL) q = q.eq("pool", POOL);
  const { data, error } = await q;
  if (error) { console.error(error.message); process.exit(1); }
  if (!data?.length) break;
  rows.push(...data);
  if (data.length < 1000) break;
}
const hit = (r) => {
  // HARD ONLY. The ceremony family is ordinary language as often as it is the
  // retired term, so selecting on it would rewrite correct rows. See RETIRED_SOFT.
  const re = RETIRED_HARD[r.language];
  if (!re) return false;
  const all = [r.question_text || "", ...(Array.isArray(r.options) ? r.options.map((o) => o.text || "") : []), r.explanation || ""].join(" \u0001 ");
  return re.test(all);
};
const bad = rows.filter(hit);
console.log(`${rows.length} non-English rows scanned, ${bad.length} carry a retired term${POOL ? ` (pool=${POOL})` : ""}\n`);
if (!bad.length) process.exit(0);

let done = 0, failed = 0;
for (const r of bad) {
  const { data: enRows } = await db.from("quiz_questions")
    .select("question_text, options, correct_answer, question_type, difficulty, explanation")
    .eq("question_group_id", r.question_group_id).eq("language", "en");
  if (!enRows || enRows.length !== 1) { console.error(`  ABORT ${r.id}: ${enRows?.length ?? 0} English siblings`); failed++; continue; }
  const en = enRows[0];

  // THE ENGLISH MUST BE CLEAN FIRST. Re-translating from a defective source reproduces
  // the defect in a new language and calls it fixed.
  const enAll = [en.question_text, ...(en.options || []).map((o) => o.text), en.explanation].join(" ");
  if (RETIRED_HARD.en.test(enAll)) {
    console.error(`  SKIP ${r.language} ${r.id}: the ENGLISH carries a retired term - fix that first`);
    failed++; continue;
  }

  let out;
  try {
    out = await claude(translateSystem(LANG_NAME[r.language], r.pool === "secure" ? "secure" : "practice"),
      `Translate this 1 question:\n\n${JSON.stringify([{ question_text: en.question_text,
        options: (en.options || []).map((o) => ({ id: o.id, text: o.text })), explanation: en.explanation }], null, 2)}\n\nReturn the JSON array now.`);
  } catch (e) { console.error(`  ABORT ${r.id}: ${e.message}`); failed++; continue; }

  const tr = Array.isArray(out) ? out[0] : null;
  if (!tr || typeof tr.question_text !== "string" || !Array.isArray(tr.options) || typeof tr.explanation !== "string") {
    console.error(`  ABORT ${r.id}: malformed translation`); failed++; continue;
  }
  // GRAFT. Ids, key, type and difficulty come from English, never from the model.
  const byId = new Map(tr.options.filter((o) => o && o.id).map((o) => [o.id, o.text]));
  const options = [];
  for (const o of en.options || []) {
    const text = byId.get(o.id);
    if (typeof text !== "string" || !text.length) { options.length = 0; break; }
    options.push({ id: o.id, text });
  }
  if (!options.length) { console.error(`  ABORT ${r.id}: graft failed - option ids did not survive`); failed++; continue; }

  const after = [tr.question_text, ...options.map((o) => o.text), tr.explanation].join(" \u0001 ");
  if (RETIRED_HARD[r.language].test(after)) {
    console.error(`  ABORT ${r.id}: the retired term survived re-translation`); failed++; continue;
  }

  console.log(`  ${r.pool}/${r.language}  ${r.id.slice(0, 8)}  ${(tr.question_text || "").slice(0, 58)}`);
  if (APPLY) {
    const { error } = await db.from("quiz_questions").update({
      question_text: tr.question_text, options, explanation: tr.explanation,
      correct_answer: en.correct_answer, question_type: en.question_type, difficulty: en.difficulty,
    }).eq("id", r.id);
    if (error) { console.error(`      write failed: ${error.message}`); failed++; continue; }
    console.log("      rewritten");
  }
  done++;
}
console.log(`\n${APPLY ? "APPLIED" : "[dry]"} ${done}/${bad.length}, ${failed} failed`);
if (!APPLY) console.log("Re-run with --apply to write.");
process.exit(failed ? 1 : 0);
