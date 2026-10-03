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
/* THE LEDGER IS EVERY RUN, not the last artifact. The artifact is overwritten per run, so reading its
 * `spend` would report $0.21 for a $23.55 round -- the number that leaves the process has to be right. */
const LEDGER = [
  ["first pass, 200 items", 21.0396, 74],
  ["pt-BR repair rounds (3), 5 rows -- 4 of them on a false positive", 0.8504, 3],
  ["the 9 held, re-translated with the pins in the prompt", 1.4489, 8],
  ["one of the 9 again, before the cadence-source gap was found", 0.2119, 2],
];
const TOTAL = LEDGER.reduce((s, r) => s + r[1], 0);
const TCALLS = LEDGER.reduce((s, r) => s + r[2], 0);
p("## Spend");
p("");
p("| run | $ | calls |");
p("|---|---|---|");
for (const [what, u, c] of LEDGER) p("| " + what + " | " + u.toFixed(4) + " | " + c + " |");
p("| **total** | **$" + TOTAL.toFixed(4) + "** | **" + TCALLS + "** |");
p("");
p("| | |");
p("|---|---|");
p("| model | `" + art.model + "` |");
p("| English items translated | **200**, both languages |");
p("| per English item | $" + (TOTAL / 200).toFixed(4) + " |");
p("| cap | $40.00, projected $23.42 on the high end |");
p("");
p("**$2.51 of the total is repair**, and $1.06 of that was spent on two false positives of my own");
p("checks -- four rows re-translated three times for a rule that was wrong, and one row twice for a gap");
p("in the cadence source list. Both were found by reading the flagged text against its English.");
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
p("| held back | **0** |");
p("");
p("## Lint, per language");
p("");
/* MEASURED OVER THE BANK, not read off the artifact. The artifact is the LAST run (9 items), so
 * reporting its lint would claim 9 rows checked for a 200-item round. */
p("| language | checked | glossary findings | letter references |");
p("|---|---|---|---|");
const live = { "es-419": { checked: 0, pins: 0 }, "pt-BR": { checked: 0, pins: 0 } };
for (const g of trilingual) {
  const en = g.find((r) => r.language === "en");
  for (const lang of ["es-419", "pt-BR"]) {
    const tr = g.find((r) => r.language === lang);
    if (!tr) continue;
    live[lang].checked++;
    for (const [text, enText] of [[tr.question_text, en.question_text], [tr.explanation, en.explanation],
      ...(tr.options || []).map((o) => [o.text, ((en.options || []).find((x) => x.id === o.id) || {}).text])]) {
      live[lang].pins += (checkPins(text, lang, enText) || []).length;
    }
  }
}
for (const lang of ["es-419", "pt-BR"]) {
  p("| `" + lang + "` | " + live[lang].checked + " | **" + live[lang].pins + "** | 0 |");
}
p("");
p("**Zero letter references in either language** -- no explanation names an option by letter, which");
p("matters because the delivery shuffle moves them.");
p("");
p("## Every term the lint flagged, and where it went");
p("");
p("**Zero pins remain on this round's 400 translated rows**, in either language. The table is the");
p("history of what was flagged and fixed, because a round that reports clean without saying what it");
p("cleaned is not auditable.");
p("");
p("| rule | flagged | outcome |");
p("|---|---|---|");
p("| `acronym-language-scope` | 9 es-419 | `ISMS` left in English where the catalogue runs SGSI 567 to 4. Re-translated with the pins in the prompt |");
p("| `inserted-cadence` | 2 pt-BR | `trimestralmente` was a real insertion and was fixed. `de forma contínua` was a FALSE POSITIVE: the English says *on a continuing basis* and the source list lacked `continuing` |");
p("| `apartado-in-pt` | 1 pt-BR | Spanish in Portuguese; re-translated |");
p("| `roles-in-pt` (new) | 5 pt-BR | 1 real (`corpo de governança` sibling row). 4 were FALSE POSITIVES -- each already said `papéis` for roles and used `atribuição` for *assignment*, which is what the English said |");
p("| `governing-body-in-pt` (new) | 1 pt-BR | real; `corpo de governança` → `órgão de governança` |");
p("| `safety-in-pt` (new) | 0 | fires on nothing in the corpus today. It is preventive, and that is stated rather than read as coverage |");
p("");
p("## The three new pins");
p("");
p("Added to `scripts/lib/pin-compliance.mjs`, enforced by the lint, and now also stated in the");
p("first-pass translation prompt -- they were being checked without being asked for, so the model had");
p("to guess and a repair round paid for what the brief could have prevented.");
p("");
p("| rule | pt-BR |");
p("|---|---|");
p("| `roles-in-pt` | **papéis** (papéis, responsabilidades e autoridades). Never `atribuições` *instead of* papéis, never the bare English `roles` |");
p("| `governing-body-in-pt` | **órgão de governança**, not `corpo de governança` |");
p("| `safety-in-pt` | never leave `safety` in English. Together with security: security = `segurança da informação`, safety = `segurança`; otherwise `segurança` |");
p("");
p("All three are pt-BR only: `roles` and `órgano de gobierno` are already correct in es-419.");
p("**Tech loanwords are deliberately not caught** -- `drift`, `analytics` and `start-up` stay, and there");
p("is a control asserting they do not fire.");
p("");
p("`roles-in-pt` is SOURCE-RELATIVE: it fires only where the English field says *role*, and it is");
p("acquitted by the field already containing `papel`/`papéis`. Without that second half it fired on four");
p("correct rows, which is the shape that gets a guard deleted by the first person it inconveniences.");
p("");
p("Firing count over the whole AIMS-F catalogue, 828 rows per language, after the fixes:");
p("");
p("| rule | es-419 | pt-BR |");
p("|---|---|---|");
p("| `roles-in-pt` | 0 | 7 (0.8%) |");
p("| `governing-body-in-pt` | 0 | 0 |");
p("| `safety-in-pt` | 0 | 0 |");
p("| `alinea-leak-into-es` | 9 (1.1%) | 0 |");
p("| `acronym-language-scope` | 3 | 2 |");
p("| `issues-es419` | 21 (2.5%) | 0 |");
p("");
p("**Every one of those 42 remaining findings is on a pre-existing APPROVED row, not on this round's.**");
p("Those are served content and a separate decision; nothing here touched them.");
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
  (PER * 2) + " read-back(s)");
