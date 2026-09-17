#!/usr/bin/env node
/**
 * gen-iso-repair-spec.mjs - replace quoted ISO clause text with our own words.
 *
 * READ-ONLY apart from the spec file. Unknown flags exit 2. Apply with the
 * existing applier:
 *
 *   node scripts/gen-iso-repair-spec.mjs --out iso-repair-ismsf.json
 *   node scripts/apply-marking-spec.mjs --from iso-repair-ismsf.json --apply
 *
 * ============ FOUR GUARDS, AND THE SECOND IS THE ONE THAT MATTERS ============
 *
 *   1. THE LEAK IS GONE. The replacement's longest run against the three
 *      standards must fall under the policy threshold. Obvious, and the weakest
 *      of the four, because every other failure mode also scores zero.
 *
 *   2. THE OBLIGATION SURVIVES. A paraphrase that quietly drops `shall` passes
 *      guard 1 perfectly. Caught on the very first passage drafted: clause 10.1
 *      requires continual improvement and the first attempt said the ISMS is
 *      "under review", which is fluent, leak-free and weaker than the clause.
 *      Checked in BOTH directions -- see lib/obligation-guard.mjs.
 *
 *   3. THE ADDRESS IS STILL THERE. IP-POSITION section 6 permits clause
 *      ADDRESSES and forbids clause TEXT, so a repair that removes the citation
 *      along with the quotation has answered the wrong question. Every
 *      replacement must name its clause.
 *
 *   4. NOTHING STRUCTURAL MOVED. Glossary keys, bold spans and the markdown
 *      around the passage are compared before and after. A repair that breaks
 *      a glossary link is a broken lesson that passes every content check.
 *
 * ============ THE TRANSLATIONS ARE PROPOSED, NOT PROVEN ============
 *
 * The index is English ISO text, so guard 1 scores zero on es-419 and pt-BR
 * before AND after -- it proves nothing about them. Guard 2 has real per-language
 * modal vocabularies and does bite. Guards 3 and 4 are language-neutral.
 *
 * What NONE of them can do is confirm the translation says what the English
 * says. That is rung two of CLAUDE.md's ladder -- right language, wrong object
 * -- and it needs a bilingual reader. Every spec this emits is marked
 * `needs_bilingual_read` and that is not a formality.
 */
import { readFileSync, existsSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, sourcesAvailable } from "./lib/citation-index.mjs";
import { preservesObligation, checkFaithful } from "./lib/obligation-guard.mjs";

const KNOWN = new Set(["--out", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY; writes only the spec.");
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const OUT = arg("out", "iso-repair-spec.json");
const VERBOSE = process.argv.includes("--verbose");
const SEED = 5;

const HERE = dirname(fileURLToPath(import.meta.url));
for (const p of [join(HERE, ".env"), join(HERE, "..", ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };
async function g(p) {
  let last;
  for (let i = 0; i < 12; i++) {
    try {
      const r = await fetch(BASE + "/" + p, { headers: H, signal: AbortSignal.timeout(60000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 200));
      return JSON.parse(t);
    } catch (e) { last = e; }
  }
  throw last;
}
const norm = (s) => String(s || "").toLowerCase()
  .replace(/[‘’]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
function pdfText(p) {
  const o = join(mkdtempSync(join(tmpdir(), "iso-")), "t.txt");
  execFileSync("pdftotext", ["-layout", p, o]);
  return readFileSync(o, "utf8");
}

/* ------------------------------------------------- the guard's own control */
const guardBad = checkFaithful();
if (guardBad.length) {
  console.error("");
  console.error("THE OBLIGATION GUARD FAILED ITS OWN CONTROL. Not proposing anything:");
  console.error("a guard that miscategorises here lets a weakened clause through, and");
  console.error("nothing downstream can see that.");
  for (const b of guardBad) console.error("  X " + b);
  process.exit(1);
}

if (!sourcesAvailable()) { console.error("standards not on disk; cannot verify a repair"); process.exit(2); }
const grams = new Set();
for (const p of Object.values(PDFS)) {
  const w = norm(pdfText(p)).split(" ").filter(Boolean);
  if (w.length < 1000) { console.error("short extraction; refusing"); process.exit(1); }
  for (let i = 0; i + SEED <= w.length; i++) grams.add(w.slice(i, i + SEED).join(" "));
}
function longestRun(text) {
  const w = norm(text).split(" ").filter(Boolean);
  let best = 0, bt = "";
  for (let i = 0; i + SEED <= w.length; i++) {
    if (!grams.has(w.slice(i, i + SEED).join(" "))) continue;
    let n = SEED;
    while (i + n + 1 <= w.length && grams.has(w.slice(i + n + 1 - SEED, i + n + 1).join(" "))) n++;
    if (n > best) { best = n; bt = w.slice(i, i + n).join(" "); }
    i += n - 1;
  }
  return { best, text: bt };
}

/* ===================== THE REPAIRS =====================
 *
 * ISMS-F, three passages, every one 27001. Each entry gives the exact line as it
 * stands today in all three languages and the line that replaces it. `before` is
 * matched against the live row and the entry is dropped if it has moved.
 */
const REPAIRS = [
  {
    cert: "ISMS-F", slug: "02-09-pdca-and-improvement", address: "clause 10.1",
    en: {
      before: '[Continual improvement]{glossary="continual-improvement"} is an obligation in the standard, not an aspiration. The organization shall continually improve the suitability, adequacy and effectiveness of the ISMS.',
      after:  '[Continual improvement]{glossary="continual-improvement"} is an obligation in the standard, not an aspiration. Clause 10.1 requires the ISMS itself to be improved on three counts: how well it fits the organisation, whether it is sufficient, and whether it works.',
    },
    "es-419": {
      before: 'La [mejora continua]{glossary="continual-improvement"} es una obligación en la norma, no una aspiración. La organización debe mejorar continuamente la conveniencia, adecuación y eficacia del SGSI.',
      after:  'La [mejora continua]{glossary="continual-improvement"} es una obligación en la norma, no una aspiración. La cláusula 10.1 exige mejorar el propio SGSI en tres aspectos: qué tan bien se ajusta a la organización, si es suficiente, y si funciona.',
    },
    "pt-BR": {
      before: 'A [melhoria contínua]{glossary="continual-improvement"} é uma obrigação na norma, não uma aspiração. A organização deve melhorar continuamente a pertinência, a adequação e a eficácia do SGSI.',
      after:  'A [melhoria contínua]{glossary="continual-improvement"} é uma obrigação na norma, não uma aspiração. A cláusula 10.1 exige melhorar o próprio SGSI em três aspectos: o quanto ele se ajusta à organização, se é suficiente, e se funciona.',
    },
  },
  {
    cert: "ISMS-F", slug: "05-02-internal-audit", address: "clause 9.2.2 b",
    en: {
      before: 'The standard requires that audits be conducted so as to ensure [objectivity and the impartiality of the audit process]{glossary="auditor-objectivity"}. It does not spell out how. Audit practice does, and the rule it arrives at is the obvious one: **an auditor does not audit their own work.**',
      after:  'The standard requires audits to be run so the process stays [objective and impartial]{glossary="auditor-objectivity"} (clause 9.2.2 b). It does not spell out how. Audit practice does, and the rule it arrives at is the obvious one: **an auditor does not audit their own work.**',
    },
    "es-419": {
      before: 'La norma exige que las auditorías se realicen de manera que garanticen la [objetividad e imparcialidad del proceso de auditoría]{glossary="auditor-objectivity"}. No especifica cómo. La práctica de auditoría sí lo hace, y la regla',
      after:  'La norma exige que las auditorías se realicen de modo que el proceso se mantenga [objetivo e imparcial]{glossary="auditor-objectivity"} (cláusula 9.2.2 b). No especifica cómo. La práctica de auditoría sí lo hace, y la regla',
      prefixOnly: true,
    },
    "pt-BR": {
      before: 'A norma exige que as auditorias sejam conduzidas de forma a garantir a [objetividade e a imparcialidade do processo de auditoria]{glossary="auditor-objectivity"}. Ela não especifica como. A prática de auditoria o faz, e a regra a',
      after:  'A norma exige que as auditorias sejam conduzidas de modo que o processo permaneça [objetivo e imparcial]{glossary="auditor-objectivity"} (cláusula 9.2.2 b). Ela não especifica como. A prática de auditoria o faz, e a regra a',
      prefixOnly: true,
    },
  },
  {
    cert: "ISMS-F", slug: "02-03-amendment-1-2024", address: "Amd.1:2024 to clause 4.1",
    en: {
      before: 'To **4.1**, on internal and external issues, it added that the organization shall determine whether climate change is a relevant issue.',
      after:  'To **4.1**, on internal and external issues, it added a requirement to decide whether climate change is relevant to the organisation.',
    },
    "es-419": {
      before: 'Al **4.1**, sobre cuestiones internas y externas, añadió que la organización debe determinar si el cambio climático es una cuestión relevante.',
      after:  'Al **4.1**, sobre cuestiones internas y externas, añadió la exigencia de decidir si el cambio climático es relevante para la organización.',
    },
    "pt-BR": {
      before: 'À **4.1**, sobre questões internas e externas, foi acrescentado que a organização deve determinar se a mudança climática é uma questão relevante.',
      after:  'À **4.1**, sobre questões internas e externas, foi acrescentada a exigência de decidir se a mudança climática é relevante para a organização.',
    },
  },
];

const LANGS = ["en", "es-419", "pt-BR"];
const policy = await g("mcp_leak_policy?select=threshold_words");
const THRESHOLD = policy?.[0]?.threshold_words;
if (!THRESHOLD) { console.error("mcp_leak_policy not readable; run 332"); process.exit(2); }
console.log("");
console.log("threshold " + THRESHOLD + "w   obligation guard: control passed (9 cases)");
console.log("");

const certs = await g("certifications?select=id,code");
const idOf = Object.fromEntries(certs.map((c) => [c.code, c.id]));

function lineSpans(md) {
  const s = []; const re = /\r?\n/g; let st = 0, m;
  while ((m = re.exec(md)) !== null) { s.push([st, m.index]); st = m.index + m[0].length; }
  s.push([st, md.length]);
  return s;
}
const glossKeys = (t) => [...String(t).matchAll(/glossary="([^"]+)"/g)].map((m) => m[1]).sort().join(",");
const boldCount = (t) => (String(t).match(/\*\*/g) || []).length;

const entries = [];
const problems = [];

for (const r of REPAIRS) {
  const mods = await g("modules?select=id&certification_id=eq." + idOf[r.cert]);
  const rows = await g("lessons?select=id,slug,language,content_md&slug=eq." + r.slug +
    "&module_id=in.(" + mods.map((m) => m.id).join(",") + ")");
  const perLang = {};
  let fail = null;

  console.log("=".repeat(76));
  console.log(r.cert + "  " + r.slug + "   (" + r.address + ")");

  for (const lg of LANGS) {
    const row = rows.find((x) => x.language === lg);
    if (!row) { fail = lg + ": row missing"; break; }
    const spec = r[lg];
    const spans = lineSpans(row.content_md);

    /* Find the line. `prefixOnly` entries were captured from a truncated
     * display, so they match the START of the live line and the tail is carried
     * through untouched -- which is safer than retyping a sentence in a
     * language the author cannot read. */
    let idx = -1, liveLine = null, after = null;
    for (let i = 0; i < spans.length; i++) {
      const t = row.content_md.slice(spans[i][0], spans[i][1]);
      if (spec.prefixOnly ? t.startsWith(spec.before) : t.trim() === spec.before.trim()) {
        idx = i; liveLine = t;
        after = spec.prefixOnly ? spec.after + t.slice(spec.before.length) : t.replace(spec.before.trim(), spec.after);
        break;
      }
    }
    if (idx < 0) { fail = lg + ": the line was not found -- it has changed since this was drafted"; break; }

    /* ---- GUARD 1: the leak is gone */
    const lr = longestRun(after);
    if (lr.best >= THRESHOLD) { fail = lg + ": replacement still carries a " + lr.best + "w run"; break; }

    /* ---- GUARD 2: the obligation survives, both directions */
    const ob = preservesObligation(liveLine, after, lg);
    if (!ob.ok) {
      fail = lg + ": OBLIGATION -- " + ob.reason +
        " (strong " + ob.before.strong + "->" + ob.after.strong + ", weak " + ob.before.weak + "->" + ob.after.weak + ")";
      break;
    }

    /* ---- GUARD 3: the address is still named */
    if (!/\b\d+\.\d+/.test(after) && !/\b(clause|cl[áa]usula)\b/i.test(after)) {
      fail = lg + ": the replacement names no clause -- addresses are permitted and must survive";
      break;
    }

    /* ---- GUARD 4: nothing structural moved */
    if (glossKeys(liveLine) !== glossKeys(after)) { fail = lg + ": glossary keys changed"; break; }
    if (boldCount(liveLine) !== boldCount(after)) { fail = lg + ": bold markers unbalanced"; break; }

    perLang[lg] = { lesson_id: row.id, line_abs: idx, before: liveLine, after };
    console.log("  [" + lg + "] line " + idx + "   leak " + longestRun(liveLine).best + "w -> " + lr.best +
      "w   obligation strong " + ob.before.strong + "->" + ob.after.strong);
    if (VERBOSE) {
      console.log("      -  " + liveLine.trim());
      console.log("      +  " + after.trim());
    }
  }

  if (fail) {
    console.log("  REFUSED: " + fail);
    problems.push(r.slug + ": " + fail);
    console.log("");
    continue;
  }
  console.log("");
  entries.push({
    cert: r.cert, slug: r.slug, block: "-", block_index: -1, line_index: -1,
    run_words: 0, run: r.address, needs_authoring: false,
    needs_bilingual_read: true,
    languages: perLang,
  });
}

console.log("entries  " + entries.length + " of " + REPAIRS.length + "   problems " + problems.length);
for (const p of problems) console.log("  X " + p);

if (problems.length) {
  console.log("");
  console.log("NOT WRITING. An entry that cannot resolve in all three languages would");
  console.log("apply in two, leaving the lesson saying different things in different");
  console.log("languages about what a clause requires.");
  process.exitCode = 1;
} else {
  writeFileSync(OUT, JSON.stringify({
    generated: "gen-iso-repair-spec.mjs", threshold_words: THRESHOLD,
    needs_bilingual_read: true, entries, blocked: [],
  }, null, 1) + "\n");
  console.log("");
  console.log("spec written to " + OUT + "   NOTHING WAS WRITTEN TO THE DATABASE.");
  console.log("");
  console.log("THE TRANSLATIONS ARE UNPROVEN. Guard 1 scores zero on them before and");
  console.log("after because the index is English. They need a bilingual read.");
}
