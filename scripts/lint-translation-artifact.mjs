#!/usr/bin/env node
/**
 * Re-run the glossary and letter-reference lint over a saved translation artifact. READ-ONLY, no
 * model calls -- the run is already paid for, so a display defect must never cost a second run.
 * `--in <file>`. Unknown flags exit 2.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { checkPins } from "./lib/pin-compliance.mjs";
import { explanationOptionRef } from "./lib/explanation-option-ref.mjs";

let IN = "AIMSF-TRANSLATION-R1.json";
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--in") { IN = argv[++i]; continue; }
  const m = argv[i].match(/^--in=(.+)$/);
  if (m) { IN = m[1]; continue; }
  console.error("Unrecognised flag: " + argv[i] + ". Known: --in <file>."); process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const art = JSON.parse(readFileSync(join(HERE, "..", IN), "utf8"));
const KEY = requireKey(HERE);
const cert = (await getAll(KEY, "certifications?select=id&code=eq." + art.cert))[0];
const rows = new Map((await getAll(KEY, "quiz_questions?select=id,question_text,options,explanation," +
  "correct_answer&certification_id=eq." + cert.id + "&language=eq.en&retired_at=is.null&order=id"))
  .map((r) => [r.id, r]));

const LANGS = ["es-419", "pt-BR"];
const out = {};
for (const lang of LANGS) out[lang] = { checked: 0, pins: [], letters: [] };
for (const rec of art.items || []) {
  const en = rows.get(rec.en_id);
  if (!en) continue;
  for (const lang of LANGS) {
    const g = rec.langs && rec.langs[lang];
    if (!g) continue;
    out[lang].checked++;
    const fields = [["question_text", g.question_text, en.question_text],
      ["explanation", g.explanation, en.explanation],
      ...g.options.map((o, i) => ["option " + o.id, o.text, (en.options[i] || {}).text])];
    for (const [what, text, enText] of fields) {
      for (const h of checkPins(text, lang, enText) || []) {
        out[lang].pins.push({ id: String(rec.en_id).slice(0, 8), what, rule: h.id, hit: h.hit, why: String(h.why || "") });
      }
    }
    const v = explanationOptionRef({ question_text: g.question_text, explanation: g.explanation,
      options: g.options.map((o) => ({ text: o.text, is_correct: (en.correct_answer || []).includes(o.id) })) });
    if (v && v.pass === false) out[lang].letters.push({ id: String(rec.en_id).slice(0, 8), reason: String(v.reason) });
  }
}
if (!out["es-419"].checked && !out["pt-BR"].checked) { console.error("EXTRACTION EMPTY: nothing linted. Not a pass."); process.exit(2); }

console.log("TRANSLATION LINT   " + art.cert + "   from " + IN + "   (read-only, no model calls)");
console.log("");
for (const lang of LANGS) {
  const l = out[lang];
  console.log("  " + lang.padEnd(7) + " checked " + String(l.checked).padStart(3) +
    "   glossary findings " + String(l.pins.length).padStart(3) + "   letter references " + l.letters.length);
}
console.log("");
console.log("  EVERY GLOSSARY FINDING, READ -- a count nobody has read is UNREAD:");
for (const lang of LANGS) {
  for (const p of out[lang].pins) {
    console.log("    " + lang + "  " + p.id + "  " + p.what.padEnd(14) + " rule=" + String(p.rule) +
      "  hit=" + JSON.stringify(p.hit));
    console.log("        " + p.why.slice(0, 150));
  }
}
for (const lang of LANGS) for (const p of out[lang].letters) console.log("    " + lang + "  " + p.id + "  LETTER REF: " + p.reason.slice(0, 160));
const byRule = {};
for (const lang of LANGS) for (const p of out[lang].pins) byRule[p.rule] = (byRule[p.rule] || 0) + 1;
console.log("");
console.log("  by rule: " + JSON.stringify(byRule));
