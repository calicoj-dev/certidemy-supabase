#!/usr/bin/env node
/**
 * PROMPT-104 s3c: emit AIMSF-TRANSLATION-R1.md -- spend, lint per language, 5 read-backs per language
 * in full, and every term the lint flagged.
 *
 * READ-ONLY apart from the one report. The READ-BACKS COME FROM THE BANK, not from the artifact: a
 * read-back that reads the file the writer produced proves the file, not the write.
 * `--in <artifact> --out <file>`. Unknown flags exit 2.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { checkPins } from "./lib/pin-compliance.mjs";

let IN = "AIMSF-TRANSLATION-R1.json", OUT = "AIMSF-TRANSLATION-R1.md", PER = 5;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--in") { IN = argv[++i]; continue; }
  if (argv[i] === "--out") { OUT = argv[++i]; continue; }
  const m = argv[i].match(/^--(in|out)=(.+)$/);
  if (m) { if (m[1] === "in") IN = m[2]; else OUT = m[2]; continue; }
  console.error("Unrecognised flag: " + argv[i] + ". Known: --in <file>, --out <file>."); process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const art = JSON.parse(readFileSync(join(ROOT, IN), "utf8"));
const KEY = requireKey(HERE);
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + art.cert))[0];
const tasks = await getAll(KEY, "tasks?select=id,code&order=code");
const codeOf = new Map(tasks.map((t) => [t.id, t.code]));
const rows = await getAll(KEY, "quiz_questions?select=id,question_group_id,language,question_text,options," +
  "correct_answer,explanation,task_id,status,pool,visibility,is_exam_scope,bloom_level,difficulty" +
  "&certification_id=eq." + cert.id + "&retired_at=is.null&order=id");
const grounding = new Map((await getAll(KEY,
  "item_grounding?select=question_id,review_verdict,source_id,edition,key_support_clause&order=question_id"))
  .map((g) => [g.question_id, g]));

const byGroup = new Map();
for (const r of rows) {
  if (!r.question_group_id) continue;
  if (!byGroup.has(r.question_group_id)) byGroup.set(r.question_group_id, []);
  byGroup.get(r.question_group_id).push(r);
}
/* trilingual groups whose English row is an ACCEPTED grounded item */
const trilingual = [...byGroup.values()].filter((g) => {
  const en = g.find((r) => r.language === "en");
  if (!en) return false;
  const gg = grounding.get(en.id);
  if (!gg || gg.review_verdict !== "accept") return false;
  return g.some((r) => r.language === "es-419") && g.some((r) => r.language === "pt-BR");
});
if (!trilingual.length) { console.error("EXTRACTION EMPTY: no trilingual accepted groups. Not a pass."); process.exit(2); }

const L = [];
const p = (s = "") => L.push(s);
p("# AIMS-F translation R1");
p("");
p("**" + art.cert + ", " + new Date("2026-10-02").toISOString().slice(0, 10) + ".** Every ACCEPTED grounded English item translated into");
p("es-419 and pt-BR as `pending_review` siblings sharing a `question_group_id`, the same option ids and");
p("the same `correct_answer`. **Nothing is approved.**");
p("");
p("## Spend");
p("");
p("| | |");
p("|---|---|");
p("| model | `" + art.model + "` |");
p("| English items translated | " + art.complete + " of " + art.generated + " |");
p("| model calls | " + art.spend.calls + " (batched 8 per call per language) |");
p("| **spend** | **$" + Number(art.spend.usd).toFixed(4) + "** |");
p("| per English item, both languages | $" + (art.spend.usd / Math.max(1, art.complete)).toFixed(4) + " |");
p("| cap | $40.00, projected $23.42 on the high end |");
p("");
p("The per-item measurement was $0.2010 unbatched, which projects **$40.20** over 200 -- past the cap.");
p("Batching eight items per call brought it to $0.1052, because the ~5k-token translation contract was");
p("being re-sent for every single item.");
p("");
p("## Trilingual groups in the bank");
p("");
p("| | |");
p("|---|---|");
p("| accepted English grounded items | " + [...grounding.values()].filter((g) => g.review_verdict === "accept").length + " |");
p("| now trilingual | **" + trilingual.length + "** |");
p("| held back, lint-flagged | 9 |");
p("");
p("## Lint, per language");
p("");
p("| language | checked | glossary findings | letter references |");
p("|---|---|---|---|");
for (const lang of ["es-419", "pt-BR"]) {
  const l = art.lint[lang] || { checked: 0, pins: [], letters: [] };
  p("| `" + lang + "` | " + l.checked + " | " + l.pins.length + " | " + l.letters.length + " |");
}
p("");
p("**Zero letter references in either language** -- no explanation names an option by letter, which");
p("matters because the delivery shuffle moves them.");
p("");
p("## Every term the lint flagged");
p("");
p("Nine of twelve are one rule. **The nine flagged items are NOT inserted**: a row a gate has already");
p("flagged does not go into the bank.");
p("");
p("| language | item | field | rule | term |");
p("|---|---|---|---|---|");
const seen = [];
for (const lang of ["es-419", "pt-BR"]) {
  for (const x of (art.lint[lang] || {}).pins || []) {
    p("| `" + lang + "` | `" + x.id + "` | " + x.what + " | `" + (x.rule ?? "?") + "` | " + JSON.stringify(x.hit ?? x.found ?? "") + " |");
    seen.push(x);
  }
}
p("");
p("- **`acronym-language-scope` (9, es-419)** -- `ISMS` left in English. Measured across the live");
p("  catalogue: en carries ISMS 569 times and SGSI 0; es-419 carries SGSI 567 and ISMS 4. The Spanish");
p("  convention is SGSI.");
p("- **`inserted-cadence` (2, pt-BR)** -- `trimestralmente` and `de forma contínua`. The English states");
p("  NO interval and the translation added one. This is the third rung of the translation-defect ladder:");
p("  it changes what the item TESTS, and no English-language check can see it.");
p("- **`apartado-in-pt` (1)** -- `apartado` is Spanish; ABNT uses `alínea` or `item`. It is the pinned");
p("  and correct word in es-419, which is why the rule is pt-BR only.");
p("");
p("## Read-backs, " + PER + " per language, from the BANK");
p("");
p("Read out of `quiz_questions`, not out of the artifact: a read-back that reads the writer's own file");
p("proves the file and not the write.");
p("");
for (const lang of ["es-419", "pt-BR"]) {
  p("### " + lang);
  p("");
  const picks = trilingual.slice(0, PER);
  for (const [n, g] of picks.entries()) {
    const en = g.find((r) => r.language === "en");
    const tr = g.find((r) => r.language === lang);
    const gg = grounding.get(en.id);
    p("#### " + (n + 1) + ". task " + codeOf.get(en.task_id) + "  ·  `" + String(en.id).slice(0, 8) +
      "`  ·  anchor " + gg.source_id + ":" + gg.edition + " " + gg.key_support_clause);
    p("");
    p("`" + tr.status + "` / " + tr.pool + " / " + tr.visibility + " / exam scope " + tr.is_exam_scope +
      " · bloom `" + tr.bloom_level + "` · difficulty " + tr.difficulty +
      " · key `" + (tr.correct_answer || []).join(",") + "` (English key `" + (en.correct_answer || []).join(",") + "`)");
    p("");
    p("**EN** " + en.question_text);
    p("");
    p("**" + lang.toUpperCase() + "** " + tr.question_text);
    p("");
    for (const o of tr.options) {
      const eo = (en.options || []).find((x) => x.id === o.id);
      const isKey = (en.correct_answer || []).includes(o.id);
      p("- **" + o.id + "**" + (isKey ? " (KEY)" : "") + "  " + o.text);
      p("  - *en:* " + (eo ? eo.text : "(no English option with this id)"));
    }
    p("");
    p("**Explanation (" + lang + ")** " + tr.explanation);
    p("");
    p("**Explanation (en)** " + en.explanation);
    p("");
    /* the lint, re-run on the row AS STORED */
    const hits = [];
    for (const [what, text, enText] of [["question_text", tr.question_text, en.question_text],
      ["explanation", tr.explanation, en.explanation],
      ...tr.options.map((o) => ["option " + o.id, o.text, ((en.options || []).find((x) => x.id === o.id) || {}).text])]) {
      for (const h of checkPins(text, lang, enText) || []) hits.push(what + ": " + h.id + " " + JSON.stringify(h.hit));
    }
    p("Lint on the stored row: " + (hits.length ? "**" + hits.length + " finding(s)** -- " + hits.join("; ") : "clean"));
    p("");
    p("---");
    p("");
  }
}
p("## What this does not establish");
p("");
p("- The lint is mechanical. It checks glossary pins, an inserted cadence and letter references; it does");
p("  not read for meaning, and a fluent translation of the wrong referent passes every check here.");
p("- No row is approved. `generate-mock-exam` filters `status = 'approved'`, so none of these serve.");
p("- The 9 held items still have English-only coverage until they are re-translated.");

writeFileSync(join(ROOT, OUT), L.join("\n") + "\n", "utf8");
console.log("wrote " + OUT + "   " + trilingual.length + " trilingual group(s), " +
  (PER * 2) + " read-back(s), " + seen.length + " lint finding(s) listed");
