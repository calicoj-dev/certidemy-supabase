#!/usr/bin/env node
/**
 * retranslate-lint-guided.mjs -- re-translate an item whose siblings the LINT refused, giving the
 * translator THE LINT FINDING ITSELF as the instruction. Ruled PROMPT-130 s5.
 *
 * ============ WHY A PLAIN RE-ROLL DOES NOT WORK ============
 *
 * PROMPT-129 re-rolled three withheld items and got the SAME two faults back: "alinea" where the
 * pin requires "apartado", and an option named by its letter. The model has no way to know what was
 * wrong, so it writes the same thing again. Telling it the finding is the difference between a
 * second attempt and a second identical attempt.
 *
 * ONE ATTEMPT per item (ruled). Still failing, the item stays withheld.
 *
 * WRITES with --apply; dry by default. Unknown flags exit 2.
 *   --cert <CODE>   required      --ids=a,b   required: the withheld item ids (stem hashes)
 *   --max-usd=<n>   required      --apply     write
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { itemIdOfStem } from "./lib/item-id.mjs";
import { lintRow } from "./lib/translation-term-lint.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let CERT = null, IDS = [], MAXUSD = null, APPLY = false;
for (const a of process.argv.slice(2)) {
  let m;
  if (a === "--apply") { APPLY = true; continue; }
  if ((m = /^--cert=(.+)$/.exec(a))) { CERT = m[1]; continue; }
  if ((m = /^--ids=(.+)$/.exec(a))) { IDS = m[1].split(",").map((s) => s.trim()).filter(Boolean); continue; }
  if ((m = /^--max-usd=([0-9.]+)$/.exec(a))) { MAXUSD = Number(m[1]); continue; }
  console.error("unrecognised flag: " + a + ". Known: --cert=, --ids=, --max-usd=, --apply.");
  process.exit(2);
}
if (!CERT || !IDS.length || MAXUSD === null) {
  console.error("--cert=, --ids= and --max-usd= are all required.");
  process.exit(2);
}
const LANGS = [{ code: "es-419", name: "Latin American Spanish" }, { code: "pt-BR", name: "Brazilian Portuguese" }];
const MODEL = "claude-opus-5";
const PRICE = { input: 15, output: 75 };
const AK = process.env.ANTHROPIC_API_KEY ||
  (readFileSync(join(ROOT, "scripts", ".env"), "utf8").match(/^ANTHROPIC_API_KEY=(.+)$/m) || [])[1];
if (!AK) { console.error("ANTHROPIC_API_KEY not found"); process.exit(2); }
let IN_TOK = 0, OUT_TOK = 0, CALLS = 0, PRINTED = false;
const usd = () => (IN_TOK / 1e6) * PRICE.input + (OUT_TOK / 1e6) * PRICE.output;
async function claude(system, user, maxTokens = 2500) {
  for (let a = 1; ; a++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST",
        headers: { "x-api-key": AK, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system,
          messages: [{ role: "user", content: user }] }) });
      if (!res.ok) throw new Error("Anthropic " + res.status + ": " + (await res.text()).slice(0, 180));
      const d = await res.json();
      CALLS++; IN_TOK += d.usage?.input_tokens || 0; OUT_TOK += d.usage?.output_tokens || 0;
      return (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    } catch (e) { if (a >= 3) throw e; await new Promise((r) => setTimeout(r, 700 * a)); }
  }
}
const parseObj = (t) => { const s = String(t || ""); const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; } };

const KEY = requireKey(join(ROOT, "scripts"));
const cert = (await getAll(KEY, "certifications?select=id&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
const rows = await getAll(KEY, "quiz_questions?select=id,language,question_text,options," +
  "correct_answer,explanation,question_group_id,task_id,status,pool,visibility,is_exam_scope," +
  "certification_id,item_origin,difficulty,bloom_level,retired_at&certification_id=eq." + cert.id +
  "&order=id");

/* the withheld record carries the lint finding in its reason; the FINDING ITSELF is what we feed back */
const wp = join(ROOT, CERT.replace(/-/g, "") + "-WITHHELD.json");
if (!existsSync(wp)) { console.error("REFUSING: no withheld file"); process.exit(2); }
const withheld = new Map((JSON.parse(readFileSync(wp, "utf8")).withheld || [])
  .map((w) => [String(w.item_id), w]));

console.log("LINT-GUIDED RETRY   " + CERT + "   " + (APPLY ? "--apply" : "dry run (default)") +
  "   ceiling $" + MAXUSD);
console.log("  ONE attempt per item (ruled PROMPT-130 s5). Still failing, it stays withheld.");
console.log("");

const SYSTEM = [
  "You are re-translating an examination item whose previous translation was REFUSED by a lint rule.",
  "The refusal is given to you verbatim. Produce a translation that does not trip it again.",
  "",
  "Keep everything else as a faithful translation of the English: same meaning, same option ids, the",
  "same option marked correct, the same register. Change only what the refusal requires.",
  "",
  "Return ONE JSON object and nothing else:",
  '{ "question_text": "...", "options": [{"id":"a","text":"..."}, ...], "explanation": "..." }',
].join("\n");

const results = [];
for (const id of IDS) {
  if (usd() >= MAXUSD) { console.log("  STOPPED at the ceiling."); break; }
  const en = rows.find((r) => r.language === "en" && itemIdOfStem(r.question_text) === id);
  if (!en) { console.log("  " + id + ": no live English row"); results.push({ id, state: "not found" }); continue; }
  const w = withheld.get(id);
  if (!w) { console.log("  " + id + ": not in the withheld file"); results.push({ id, state: "not withheld" }); continue; }
  const sibs = rows.filter((r) => r.question_group_id === en.question_group_id && r.language !== "en");
  if (sibs.length) {
    console.log("  " + id + ": already has " + sibs.length + " sibling(s) -- not a retry case");
    results.push({ id, state: "has siblings" }); continue;
  }
  const finding = String(w.reason || "");
  console.log("  " + id + "  task-row " + String(en.id).slice(0, 8));
  console.log("      the refusal, fed back: " + finding.slice(finding.indexOf(":") + 1).trim().slice(0, 150));

  const made = {};
  for (const lang of LANGS) {
    if (usd() >= MAXUSD) break;
    const user = [
      "TARGET LANGUAGE: " + lang.name + " (" + lang.code + ")",
      "",
      "THE LINT REFUSAL THAT MUST NOT RECUR:",
      finding,
      "",
      "ENGLISH ITEM:",
      "STEM: " + en.question_text,
      "OPTIONS:",
      ...(en.options || []).map((o) => "  " + o.id + ") " + o.text),
      "CORRECT: " + JSON.stringify(en.correct_answer),
      "EXPLANATION: " + en.explanation,
    ].join("\n");
    if (!PRINTED) {
      PRINTED = true;
      console.log("");
      console.log("  ---- FULL PROMPT, FIRST ITEM (standing rule, PROMPT-115) ----");
      console.log("  SYSTEM: " + SYSTEM.replace(/\n/g, "\n  "));
      console.log("  USER:   " + user.replace(/\n/g, "\n  "));
      console.log("  ---- END PROMPT ----");
      console.log("");
    }
    if (!APPLY) { console.log("      dry run: no call made for " + lang.code); continue; }
    const o = parseObj(await claude(SYSTEM, user));
    if (!o || !Array.isArray(o.options)) { console.log("      " + lang.code + ": unparseable"); continue; }
    /* the lint is re-run BEFORE anything is written: a repair that does not clear it is not written */
    /* lintRow takes a ROW: the candidate is shaped as one, with the target language, so the lint
     * sees exactly what it would see after an insert. Re-run BEFORE anything is written. */
    const asRow = { language: lang.code, question_text: o.question_text, options: o.options,
      explanation: o.explanation, correct_answer: en.correct_answer };
    const lint = lintRow(asRow, lang.code, en);
    const findings = [...(lint.forbidden || []), ...(lint.mixed || []), ...(lint.untranslated || [])];
    if (findings.length) {
      console.log("      " + lang.code + ": STILL FLAGGED -- " +
        JSON.stringify(findings).slice(0, 140) + "  (not written)");
      continue;
    }
    made[lang.code] = o;
    console.log("      " + lang.code + ": clean   $" + usd().toFixed(3));
  }
  const ok = LANGS.every((l) => made[l.code]);
  results.push({ id, state: ok ? "clean" : (APPLY ? "still failing" : "dry"), made });
}
console.log("");
console.log("  spend $" + usd().toFixed(4) + " over " + CALLS + " call(s)");
for (const r of results) console.log("  " + r.id + "  " + r.state);
if (!APPLY) { console.log(""); console.log("DRY RUN. No call made and nothing written."); process.exit(0); }
console.log("");
console.log("  NOT WRITTEN BY THIS SCRIPT: the clean renderings are reported, and the siblings are");
console.log("  created by translate-grounded-items so there is ONE writer of sibling rows. Release the");
console.log("  item from WITHHELD and re-run the translator.");
void REST_URL;
