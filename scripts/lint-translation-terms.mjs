#!/usr/bin/env node
/**
 * lint-translation-terms.mjs -- the house glossary, checked against every live translated item.
 *
 * READ-ONLY. There is no `--apply`. Unknown flags exit 2.
 *
 *   --pool=secure|practice|all   default all
 *   --out=TRANSLATION-LINT.md    the report (COUNTS, plus quoted spans -- see the gitignore note)
 *   --json=TRANSLATION-LINT.json the enumeration
 *
 * ============ WHAT IT REPORTS, AND WHY THREE CLASSES AND NOT ONE ============
 *
 *   FORBIDDEN    a variant the glossary forbids for that language. A failure in the pipeline gate.
 *   MIXED        one row using two variants of one term for the same thing. A flag.
 *   UNTRANSLATED an English glossary term left in a translated row. A flag unless the glossary
 *                forbids the bare English, which it does for the Act's name and for `deployer`.
 *
 * Folding them together would make the gate either useless or unusable: a forbidden variant is a
 * meaning error somebody decided against, and a mixed row is usually a row written before the ruling.
 *
 * ============ THE MODAL RULE IS RELATIVE TO THE ENGLISH, AND ABSTAINS WITHOUT IT ============
 *
 * `deveria` is only wrong where the English sentence carries `should`. A rule that cannot see the
 * source guesses, so this one reports UNCHECKED for a row whose English sibling is missing rather
 * than assuming either way -- the same reason pin-compliance's inserted-cadence rule abstains.
 *
 * ============ SCOPE IS PART OF EVERY TERM ============
 *
 * A word list applied outside its subject refuses correct work: the superseded-Scrum-wording list
 * refused two ISO/IEC 42001 items for `development-team`. Every family declares the certifications it
 * applies to, and a row outside that list is not examined for that family at all.
 *
 * ============ CONTROLS ============
 *
 * Synthetic rows with known verdicts, one per class and one that must stay quiet. If any verdict is
 * wrong the script prints nothing and exits 2, because a lint that cannot fire reports a clean corpus.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let POOL = "all", OUT = "TRANSLATION-LINT.md", JSONOUT = "TRANSLATION-LINT.json";
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--pool=(secure|practice|all)$/.exec(a))) { POOL = m[1]; continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  if ((m = /^--json=(.+)$/.exec(a))) { JSONOUT = m[1]; continue; }
  console.error("unknown flag " + JSON.stringify(a) + ". Known: --pool=, --out=, --json=");
  console.error("READ-ONLY: there is no --apply and no --dry, because it writes no table.");
  process.exitCode = 2; process.exit();
}

/* ONE IMPLEMENTATION. The glossary is data and `lib/translation-term-lint.mjs` is the only code
 * that reads it, so this runner, the pipeline gate in retranslate-item-rewrite.mjs and any bulk
 * pass cannot drift apart. The first wiring imported `lintRow` from THIS file, which would have run
 * the whole corpus pass and rewritten both reports every time one row was checked. */
import { lintRow, translationLintControls, GLOSSARY_VERSION } from "./lib/translation-term-lint.mjs";

const ctl = translationLintControls();
console.log("CONTROLS  " + ctl.examined + " case(s), " + ctl.fails.length + " fail");
if (ctl.fails.length) {
  for (const f of ctl.fails) console.error("  FAIL " + f);
  console.error("REFUSING TO REPORT -- a lint that cannot fire reports a clean corpus.");
  process.exitCode = 2; process.exit();
}

/* ---------------------------------------------------------------- the corpus */
const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&order=code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));

const poolFilter = POOL === "all" ? "" : "&pool=eq." + POOL;
const SELECT = "id,certification_id,question_group_id,language,pool,question_text,options,explanation";
const rows = await getAll(KEY, "quiz_questions?select=" + SELECT +
  "&status=eq.approved&retired_at=is.null&language=in.(es-419,pt-BR)" + poolFilter + "&order=id");
const enRows = await getAll(KEY, "quiz_questions?select=" + SELECT +
  "&status=eq.approved&retired_at=is.null&language=eq.en" + poolFilter + "&order=id");
const enByGroup = new Map();
for (const r of enRows) if (r.question_group_id && !enByGroup.has(r.question_group_id)) enByGroup.set(r.question_group_id, r);

const findings = [];
let examined = 0, noEnglish = 0;
for (const r of rows) {
  const code = codeOf.get(r.certification_id);
  if (!code) continue;
  examined++;
  const en = r.question_group_id ? enByGroup.get(r.question_group_id) || null : null;
  if (!en) noEnglish++;
  const v = lintRow(r, code, en);
  for (const cls of ["forbidden", "mixed", "untranslated", "unchecked"]) {
    for (const f of v[cls]) findings.push({ cls, id: String(r.id).slice(0, 8), code, language: r.language, pool: r.pool, ...f });
  }
}

/* ---------------------------------------------------------------- the report */
const key = (f) => f.code + "|" + f.language;
const cells = new Map();
for (const f of findings) {
  if (!cells.has(key(f))) cells.set(key(f), { forbidden: 0, mixed: 0, untranslated: 0, unchecked: 0, rows: new Set() });
  const c = cells.get(key(f));
  c[f.cls]++; c.rows.add(f.id);
}
const byTerm = new Map();
for (const f of findings) {
  const k = f.family + "." + f.key + " [" + f.cls + "]" + (f.variant ? " " + f.variant : "");
  byTerm.set(k, (byTerm.get(k) || 0) + 1);
}

const md = [];
const p = (s = "") => md.push(s);
p("# Translation term lint");
p("");
p("Read-only. `scripts/lint-translation-terms.mjs`, glossary `scripts/lib/translation-glossary.json`.");
p("Nothing was written.");
p("");
p("| | |");
p("|---|---|");
p("| rows examined | " + examined + " (approved, not retired, es-419 + pt-BR, pool=" + POOL + ") |");
p("| rows with no English sibling | " + noEnglish + " |");
p("| findings | " + findings.length + " |");
p("| FORBIDDEN (gate failure) | " + findings.filter((f) => f.cls === "forbidden").length + " |");
p("| MIXED (flag) | " + findings.filter((f) => f.cls === "mixed").length + " |");
p("| UNTRANSLATED (flag) | " + findings.filter((f) => f.cls === "untranslated").length + " |");
p("| UNCHECKED (could not run) | " + findings.filter((f) => f.cls === "unchecked").length + " |");
p("| distinct rows involved | " + new Set(findings.map((f) => f.id)).size + " |");
p("");
p("**UNCHECKED is a third state, not a pass.** It is a row carrying `deveria` whose English sibling is");
p("missing, so the relative modal rule could not run. A rule that cannot see its source abstains.");
p("");
p("**The Scrum family is EMPTY and checks nothing.** The official 2020 es-419 and pt-BR Guides ARRIVED");
p("2026-09-28 at `reference/scrum-guide-2020-es-419.pdf` and `-pt-br.pdf`, but having the guides is not");
p("having the terms: the family is still unseeded, so nothing Scrum is linted. `SCRUM-GLOSSARY-NEEDED.md`");
p("lists what to extract.");
p("");
p("**`fair presentation` in pt-BR is declared UNVERIFIED** -- the ABNT NBR ISO 19011 edition is not");
p("held, so `apresentação justa` is a house form and is only ever a flag.");
p("");
p("## Per certification and language");
p("");
p("| certification | language | forbidden | mixed | untranslated | unchecked | rows |");
p("|---|---|---|---|---|---|---|");
for (const k of [...cells.keys()].sort()) {
  const [code, lang] = k.split("|");
  const c = cells.get(k);
  p("| " + code + " | " + lang + " | " + c.forbidden + " | " + c.mixed + " | " + c.untranslated +
    " | " + c.unchecked + " | " + c.rows.size + " |");
}
p("");
p("## Per term");
p("");
p("| term | class | occurrences |");
p("|---|---|---|");
for (const [k, n] of [...byTerm.entries()].sort((a, b) => b[1] - a[1])) {
  const m = /^(.*) \[(\w+)\](?: (.*))?$/.exec(k);
  p("| " + (m ? m[1] + (m[3] ? " `" + m[3] + "`" : "") : k) + " | " + (m ? m[2] : "?") + " | " + n + " |");
}
p("");
p("## What is auto-fixable and what is not");
p("");
p("A ONE-TO-ONE substitution of a forbidden variant may go in the bulk pass. Anything whose correct");
p("replacement depends on which SENSE the row means cannot, and the glossary marks those:");
p("");
p("- `vendor` / `provider` in Spanish: `proveedor` is correct for the Regulation's ROLE and wrong for a");
p("  commercial vendor, and nothing mechanical tells the two apart. FLAG, never substituted.");
p("- `deveria`: correct wherever the English does not say `should`.");
p("- the clause word: the corpus is 104:1 for `cláusula` in items and 17:1 the other way in lessons, so");
p("  the house word is NOT imposed corpus-wide. Only a row that mixes two is reported.");
p("");
writeFileSync(join(ROOT, OUT), md.join("\n") + "\n", "utf8");
writeFileSync(join(ROOT, JSONOUT), JSON.stringify({
  glossary_version: GLOSSARY_VERSION, pool: POOL, examined, no_english_sibling: noEnglish,
  counts: {
    forbidden: findings.filter((f) => f.cls === "forbidden").length,
    mixed: findings.filter((f) => f.cls === "mixed").length,
    untranslated: findings.filter((f) => f.cls === "untranslated").length,
    unchecked: findings.filter((f) => f.cls === "unchecked").length,
  },
  findings,
}, null, 1) + "\n", "utf8");

console.log("TRANSLATION TERM LINT   pool=" + POOL);
console.log("  rows examined        " + examined + "   (no English sibling: " + noEnglish + ")");
console.log("  FORBIDDEN            " + findings.filter((f) => f.cls === "forbidden").length);
console.log("  MIXED                " + findings.filter((f) => f.cls === "mixed").length);
console.log("  UNTRANSLATED         " + findings.filter((f) => f.cls === "untranslated").length);
console.log("  UNCHECKED            " + findings.filter((f) => f.cls === "unchecked").length);
console.log("  distinct rows         " + new Set(findings.map((f) => f.id)).size);
console.log("  wrote " + OUT + " and " + JSONOUT);
