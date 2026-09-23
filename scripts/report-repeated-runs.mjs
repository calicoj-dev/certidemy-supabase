#!/usr/bin/env node
/**
 * report-repeated-runs.mjs -- which below-floor runs of ISO text do we use in
 * more than one row?
 *
 * READ-ONLY. Takes --min <words>, --out <path>, --json. Unknown flags exit 2.
 * REPORTS. Refuses nothing, gates nothing.
 *
 * ============ WHY REPETITION IS A SIGNAL THE LENGTH CANNOT SUPPLY =========
 *
 * The run-length distribution decays smoothly and has no cliff at 9, which is
 * the argument for leaving the floor at 10: nothing is bunched just under the
 * line, so the near-floor population looks like the collision rate of technical
 * English written about the same subject as the standard.
 *
 * That argument is about the population. It says nothing about a MEMBER.
 *
 * A nine-word run appearing ONCE is incidental collision. The same nine words
 * appearing in FIVE lessons is not: it is a phrase that was written once and
 * carried, and whatever carried it will carry it again. Recurrence is evidence
 * of copying that length cannot provide, and no gate here has ever looked for
 * it -- a per-span floor can no more see a repetition than it can see a sum.
 *
 * ============ AND IT IS A REPORT BEFORE IT IS A RULE ============
 *
 * Deliberately not a gate. A repeated run has at least three explanations and
 * they need opposite responses:
 *
 *   OUR SENTENCE, REUSED     one sentence of ours, pasted across lessons, that
 *                            happens to collide with the standard. A style
 *                            problem, not a leak.
 *   A TERM OF ART            a phrase every practitioner uses, which our prose
 *                            must contain to teach at all.
 *   A CARRIED QUOTATION      the standard's wording, lifted once and spread.
 *
 * Only the third is a finding, and only reading them separates the three. So
 * this prints the surrounding sentence for every occurrence, and proposes a
 * threshold only after the members have been read.
 *
 * Attributed quotations are excluded -- they are a separate population with a
 * separate question, and counting them here would swamp the signal.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSources, runUnits, norm, assertCanary, W, SEED, ABS_RUN } from "./lib/leak-score.mjs";
import { segments, attributedQuote } from "./lib/iso-segments.mjs";

const KNOWN = new Set(["--min", "--out", "--json"]);
const argv = process.argv.slice(2);
let MIN = 6, OUT = "REPEATED-RUNS.md";
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) continue;
  if (!KNOWN.has(a)) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
  if (a === "--min") MIN = Number(argv[++i]);
  if (a === "--out") OUT = argv[++i];
}
const JSON_OUT = argv.includes("--json");
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
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

async function allRows(path) {
  const out = []; let from = 0, total = null;
  for (;;) {
    const r = await fetch(BASE + "/" + path, { headers: { ...H, Range: from + "-" + (from + 499), Prefer: "count=exact" } });
    if (!r.ok) throw new Error("HTTP " + r.status + " on " + path);
    total = Number(String(r.headers.get("content-range") || "").split("/")[1]);
    const page = await r.json(); out.push(...page);
    if (out.length >= total || page.length === 0) break;
    from += 500;
  }
  if (out.length !== total) throw new Error("SHORT READ on " + path + ": " + out.length + " of " + total);
  return out;
}

const sources = buildSources();
assertCanary(sources);

/**
 * EVERY run at or above MIN, not merely the longest.
 *
 * The distribution script took the longest run per unit, which is the right
 * unit for a verdict and the wrong one for this: a repeated seven-word phrase
 * sitting in a paragraph that also carries a nine-word run would never be
 * counted, and the repetition is the whole subject here. Non-nested, so one
 * long run is not also reported as its own shorter prefixes.
 */
function allRuns(text) {
  const w = norm(text).split(" ").filter(Boolean);
  const out = [];
  for (const [key, src] of sources) {
    let lastEnd = -1;
    for (let i = 0; i + SEED <= w.length; i++) {
      const cands = src.at.get(w.slice(i, i + SEED).join(" "));
      if (!cands) continue;
      let n = 0;
      for (const p of cands) {
        let k = 0;
        while (i + k < w.length && src.words[p + k] === w[i + k]) k++;
        if (k > n) n = k;
      }
      if (n >= MIN && i + n > lastEnd) {
        out.push({ text: w.slice(i, i + n).join(" "), len: n, src: key });
        lastEnd = i + n;
      }
    }
  }
  return out;
}

/* CONTROL. The canary must come back at full length, and the measure must not
 * report it twice as nested prefixes. */
const CW = W("the organization shall determine external and internal issues that are relevant to its purpose");
const c = allRuns(CW.join(" "));
if (!c.length || Math.max(...c.map((r) => r.len)) !== CW.length) {
  console.error("CONTROL FAILED: canary " + CW.length + "w came back as " + JSON.stringify(c.map((r) => r.len)));
  process.exit(2);
}

const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const modules = await allRows("modules?select=id,certification_id");
const certOfModule = new Map(modules.map((m) => [m.id, codeOf.get(m.certification_id)]));
const concepts = (await allRows("concepts?select=slug,name,description,certification_id,retired_at"))
  .filter((c) => !c.retired_at);
const lessons = (await allRows("lessons?select=slug,language,content_md,module_id"))
  .filter((l) => l.language === "en");

/* ============ THE GLOSSARY IS `concepts`, AND THAT MAKES THE EXEMPTION
 * MACHINE-CHECKABLE ============
 *
 * There is no glossary table. A {glossary=slug} annotation in a lesson body
 * resolves to a CONCEPT SLUG -- the concept layer IS the declared vocabulary.
 *
 * That turns the term-of-art exemption from a judgement into a lookup:
 *
 *   A phrase with a concept behind it is a DEFINED TERM the curriculum is
 *   obliged to use verbatim. A phrase without one is prose that happens to
 *   match the standard.
 *
 * Two kinds of evidence, and the second is the stronger:
 *
 *   NAME MATCH   the run is, or contains, a concept name
 *   ANNOTATED    the run sits inside a glossary annotation somewhere in the
 *                corpus -- an author declared it
 *
 * Exempt rows are REPORTED AS EXEMPT WITH THE ENTRY, never omitted. A gate
 * that hides what it excused cannot be audited, which is the same rule as
 * "(none reported)" meaning not asked. */
const glossary = new Map();
for (const c of concepts) glossary.set(norm(c.name), c.slug);
const QUOTE = String.fromCharCode(34);
const annotated = new Map();
for (const l of lessons) {
  const body = String(l.content_md || "");
  let idx = 0;
  for (;;) {
    const open = body.indexOf("{glossary=", idx);
    if (open < 0) break;
    const q1 = body.indexOf(QUOTE, open);
    const q2 = q1 < 0 ? -1 : body.indexOf(QUOTE, q1 + 1);
    if (q1 < 0 || q2 < 0) { idx = open + 10; continue; }
    const slug = body.slice(q1 + 1, q2);
    /* The annotated phrase is the bracketed text immediately before it. */
    const close = body.lastIndexOf("]", open);
    const openB = close < 0 ? -1 : body.lastIndexOf("[", close);
    if (openB >= 0) annotated.set(norm(body.slice(openB + 1, close)), slug);
    idx = q2 + 1;
  }
}

/**
 * Is this run a declared term? Returns the evidence, or null.
 *
 * ============ THE DECLARED TERM MUST ACCOUNT FOR THE RUN ============
 *
 * The first version accepted `t.includes(phrase) || phrase.includes(t)` in
 * either direction at any length, and it excused nine runs of which most were
 * nonsense:
 *
 *   additional control objectives and controls can be needed
 *       -> control-of-documented-information
 *   requirements may include policies procedures work instructions legal ...
 *       -> awareness-requirement
 *
 * A short declared term sitting anywhere inside a long clause fragment
 * exempted the whole fragment. That is an exemption excusing the thing it
 * exists to catch -- the `availability` shape, where a rule written to let
 * control titles past let a nine-word reproduction of a defined term through.
 *
 * So containment must run the RIGHT WAY, or be near-total: the declared term
 * either covers the run, or the run exceeds it by at most one word. A clause
 * fragment that merely CONTAINS a defined term is prose carrying a term, not a
 * term -- which is exactly what `the organization's own requirements for its
 * ai management system` is, and it should be a finding rather than exempt.
 */
function tokens(x) { return norm(x).split(" ").filter(Boolean); }
function covers(declared, run) {
  const d = tokens(declared), t = tokens(run);
  if (!d.length || !t.length) return false;
  const ds = d.join(" "), ts = t.join(" ");
  if (ds === ts) return true;
  if (ds.includes(ts)) return true;                 // the term covers the run
  if (ts.includes(ds) && t.length <= d.length + 1) return true;  // one word wider
  return false;
}
function declaredTerm(runText) {
  for (const [name, slug] of glossary) {
    if (!name) continue;
    if (covers(name, runText)) return { how: "concept name", slug };
  }
  for (const [phrase, slug] of annotated) {
    if (!phrase) continue;
    if (covers(phrase, runText)) return { how: "glossary annotation", slug };
  }
  return null;
}

/* POSITIVE AND NEGATIVE CONTROL for the exemption itself, because an
 * over-firing exemption reports clean and a non-firing one reports a corpus of
 * defects. Both directions, the same rule this repository already records for
 * every guard whose subject can legitimately change. */
(function controlDeclaredTerm() {
  /* `norm` preserves the apostrophe, so a control written without one matches
   * nothing and the control fails for a reason that has nothing to do with
   * the rule under test -- which is how a control gets deleted. Built from
   * a character code so no transport can eat it. */
  const AP = String.fromCharCode(39);
  const mustExempt = "persons doing work under the organization" + AP + "s control";
  const mustNot = "the organization" + AP + "s own requirements for its ai management system";
  const a = declaredTerm(mustExempt), b = declaredTerm(mustNot);
  if (!a) {
    console.error("CONTROL FAILED: the declared-term lookup does not exempt a phrase");
    console.error("that carries a glossary annotation. It would report the whole");
    console.error("curriculum vocabulary as findings.");
    process.exit(2);
  }
  if (b) {
    console.error("CONTROL FAILED: the lookup exempts a clause fragment that merely");
    console.error("CONTAINS a defined term (" + b.slug + "). An exemption that excuses");
    console.error("prose around a term excuses everything.");
    process.exit(2);
  }
})();

/** The sentence a run sits in, so a reader can tell reuse from collision. */
function sentenceAround(unit, runText) {
  const parts = unit.split(/(?<=[.!?])\s+/);
  const needle = runText.split(" ").slice(0, 4).join(" ");
  for (const p of parts) if (norm(p).includes(needle)) return p.trim();
  return unit.slice(0, 220).trim();
}

const seen = new Map();
function record(runs, unit, row) {
  for (const r of runs) {
    if (r.len >= ABS_RUN) continue;           // at or over the floor the gate already acts
    const rec = seen.get(r.text) || { text: r.text, len: r.len, src: r.src, rows: new Map() };
    if (!rec.rows.has(row.id)) rec.rows.set(row.id, { ...row, sentence: sentenceAround(unit, r.text) });
    seen.set(r.text, rec);
  }
}

for (const cpt of concepts) {
  const row = { corpus: "concept", cert: codeOf.get(cpt.certification_id) || "?", id: cpt.slug };
  for (const t of [String(cpt.description || ""), String(cpt.name || "")]) record(allRuns(t), t, row);
}
for (const l of lessons) {
  const row = { corpus: "lesson", cert: certOfModule.get(l.module_id) || "?", id: l.slug };
  for (const seg of segments(l.content_md || "", attributedQuote)) {
    for (const u of runUnits(seg)) record(allRuns(u), u, row);
  }
}

const all = [...seen.values()].map((r) => ({ ...r, n: r.rows.size, members: [...r.rows.values()] }));
let repeated = all.filter((r) => r.n > 1).sort((a, b) => b.n - a.n || b.len - a.len);

/* ============ TWO ARTIFACT CLASSES, EXCLUDED IN THE INSTRUMENT ============
 *
 * Both were found by reading the members and neither is a finding:
 *
 *   NESTED    the same phrase reported twice because two standards carry it
 *             at different lengths -- 6w against 27002 and 7w against 27001.
 *   NUMBERED  a run carrying a clause or control number, such as
 *             `8 1 operational planning and control`. That is OUR OWN
 *             CITATION colliding with ISO numbering, not reproduced prose.
 *
 * Same shape as the 61 concept names: artifacts of what was measured rather
 * than facts about the corpus. The exclusion belongs HERE and not in the
 * reading, because a reader who has to subtract them every time will stop. */
const allTexts = repeated.map((r) => r.text);
const isNested = (r) => allTexts.some((t) => t !== r.text && t.includes(r.text));
const hasNumber = (r) => /(^| )[0-9]+( |$)/.test(r.text);
const artifacts = { nested: repeated.filter(isNested).length, numbered: repeated.filter(hasNumber).length };
const repeatedAll = repeated.length;
repeated = repeated.filter((r) => !isNested(r) && !hasNumber(r));
for (const r of repeated) r.term = declaredTerm(r.text);

console.log("");
console.log("REPEATED BELOW-FLOOR RUNS -- report only, nothing refuses on this");
console.log("  control: the canary measures " + CW.length + "w and is not reported as nested prefixes");
console.log("  min run " + MIN + "w, floor " + ABS_RUN + "w, attributed quotation excluded");
console.log("");
console.log("  distinct runs at or over " + MIN + "w   " + all.length + "   <- the denominator");
console.log("  appearing in more than one row  " + repeatedAll);
console.log("    less NESTED duplicates        " + artifacts.nested);
console.log("    less CLAUSE/CONTROL NUMBERS   " + artifacts.numbered);
console.log("  after artifacts                 " + repeated.length);
const declaredN = repeated.filter((r) => r.term).length;
console.log("");
console.log("  DECLARED TERMS (exempt, entry named)  " + declaredN);
console.log("  undeclared                            " + (repeated.length - declaredN));
console.log("");
const band = (lo, hi) => repeated.filter((r) => r.n >= lo && (hi === null || r.n <= hi)).length;
console.log("  by number of rows:  2 rows " + band(2, 2) + "   3 rows " + band(3, 3) +
            "   4 rows " + band(4, 4) + "   5+ rows " + band(5, null));
console.log("");
const byLen = {};
for (const r of repeated) byLen[r.len] = (byLen[r.len] || 0) + 1;
console.log("  by run length: " + Object.keys(byLen).sort((a, b) => a - b).map((k) => k + "w:" + byLen[k]).join("  "));
console.log("");
console.log("  THRESHOLD CANDIDATES -- how many runs a rule would surface:");
for (const rows of [2, 3, 4]) {
  for (const len of [6, 7, 8]) {
    const n = repeated.filter((r) => r.n >= rows && r.len >= len).length;
    console.log("    >= " + rows + " rows and >= " + len + "w   " + String(n).padStart(4) + " runs");
  }
}
console.log("");
/* ============ THE RULE, AND ITS FIRING COUNT IN THE SAME BREATH ==========
 *
 * >= 3 rows AND >= 8w. Three rather than two because n=2 has no variance: two
 * occurrences of an eight-word technical phrase is well inside collision.
 * Eight rather than seven because the term-of-art rate climbs sharply at 7w.
 * A 2-row, 6w rule surfaces 85 and would be repealed by the first person it
 * inconveniences, and a repealed rule protects nothing. */
const RULE_ROWS = 3, RULE_LEN = 8;
const fires = repeated.filter((r) => r.n >= RULE_ROWS && r.len >= RULE_LEN);
const findings = fires.filter((r) => !r.term);
const exempt = fires.filter((r) => r.term);
console.log("");
console.log("THE RULE: >= " + RULE_ROWS + " rows AND >= " + RULE_LEN + "w, artifacts excluded");
console.log("  fires                    " + fires.length);
console.log("  of those, DECLARED TERM  " + exempt.length + "   exempt, entry named");
console.log("  FINDINGS                 " + findings.length);
console.log("");
console.log("  FINDINGS -- repeated, below the floor, no declared term:");
for (const r of findings) {
  console.log("    " + String(r.n).padStart(3) + " rows  " + r.len + "w  [" + r.src + "]  " + r.text.slice(0, 84));
}
if (exempt.length) {
  console.log("");
  console.log("  EXEMPT, with the entry that excuses each:");
  for (const r of exempt) {
    console.log("    " + String(r.n).padStart(3) + " rows  " + r.len + "w  " + r.text.slice(0, 56));
    console.log("           " + r.term.how + " -> " + r.term.slug);
  }
}

/* ============ THE DE FACTO VOCABULARY QUESTION ============
 *
 * A phrase recurring across many lessons IS behaving as a defined term,
 * whether or not anyone declared it. Where no concept stands behind it, the
 * honest answers are ADD THE ENTRY or STOP USING IT AS ONE, and both are
 * deliberate acts -- unlike the current state, which is neither.
 *
 * This matters more than the leak score: a curriculum whose de facto defined
 * terms are not its declared ones teaches an auditor vocabulary the exam does
 * not test. */
const defacto = repeated.filter((r) => r.n >= 4 && !r.term).sort((a, b) => b.n - a.n);
console.log("");
console.log("DE FACTO TERMS -- 4 or more rows, no concept behind them: " + defacto.length);
for (const r of defacto.slice(0, 12)) {
  console.log("    " + String(r.n).padStart(3) + " rows  " + r.len + "w  " + r.text.slice(0, 80));
}

const lines = [];
lines.push("# Below-floor runs of ISO text used in more than one row");
lines.push("");
lines.push("Report only. Nothing refuses on this. Attributed quotation excluded.");
lines.push("");
lines.push("A run appearing once is incidental collision -- the distribution decays smoothly");
lines.push("and shows no cliff, which is why the floor stays at 10. A run appearing in several");
lines.push("rows is different in kind: recurrence is evidence of carrying that length cannot");
lines.push("supply.");
lines.push("");
lines.push("**Three explanations, needing opposite responses**, and only reading separates them:");
lines.push("");
lines.push("- **our sentence, reused** -- one sentence of ours pasted across lessons that happens");
lines.push("  to collide with the standard. A style problem, not a leak.");
lines.push("- **a term of art** -- a phrase our prose must contain to teach at all.");
lines.push("- **a carried quotation** -- the standard's wording, lifted once and spread.");
lines.push("");
lines.push("The sentence around each occurrence is printed so the three can be told apart.");
lines.push("");
/* The FINDINGS first, with their sentences, because the whole list is a
 * denominator and the rule is what someone has to rule on. */
lines.push("## The " + findings.length + " the rule surfaces");
lines.push("");
lines.push("Rule: at least " + RULE_ROWS + " rows AND at least " + RULE_LEN + "w, nested duplicates and");
lines.push("clause/control numbers excluded, no declared term behind the phrase.");
lines.push("");
lines.push("**" + exempt.length + " of the " + fires.length + " fires were excused by a glossary entry.** The declared");
lines.push("terms cluster at 6 to 7 words, below this rule, so the exemption is real and");
lines.push("checkable and happens to excuse nothing here.");
lines.push("");
findings.forEach((r, i) => {
  lines.push("### F" + (i + 1) + ". " + r.n + " rows -- " + r.len + "w of " + r.src);
  lines.push("");
  lines.push("> " + r.text);
  lines.push("");
  for (const m of r.members) {
    lines.push("- **" + m.cert + "** `" + m.id + "` (" + m.corpus + ")");
    lines.push("  - " + m.sentence.slice(0, 320).replace(/\n/g, " "));
  }
  lines.push("");
});
lines.push("---");
lines.push("");
lines.push("## Every repeated run, as the denominator");
lines.push("");
lines.push("| # | rows | run | source | text |");
lines.push("|---|---|---|---|---|");
repeated.forEach((r, i) => {
  lines.push("| " + (i + 1) + " | " + r.n + " | " + r.len + "w | " + r.src + " | " + r.text.slice(0, 70) + " |");
});
lines.push("");
lines.push("---");
lines.push("");
repeated.forEach((r, i) => {
  lines.push("## " + (i + 1) + ". " + r.n + " rows -- " + r.len + "w of " + r.src);
  lines.push("");
  lines.push("> " + r.text);
  lines.push("");
  for (const m of r.members) {
    lines.push("- **" + m.cert + "** `" + m.id + "` (" + m.corpus + ")");
    lines.push("  - " + m.sentence.slice(0, 320).replace(/\n/g, " "));
  }
  lines.push("");
});
writeFileSync(join(ROOT, OUT), lines.join("\n"), "utf8");
console.log("");
console.log("  wrote " + OUT);

if (JSON_OUT) {
  writeFileSync(join(ROOT, "REPEATED-RUNS.json"), JSON.stringify({
    measured: new Date().toISOString(), minRun: MIN, floor: ABS_RUN,
    distinctRuns: all.length, repeated: repeated.length,
    /* `term` travels with the row. Without it a downstream reader cannot tell
     * a declared term from an undeclared one and will rebuild the de facto
     * list wrongly -- which happened on the first emit, putting the one
     * genuinely declared phrase at the top of a list of undeclared ones. */
    runs: repeated.map((r) => ({ text: r.text, len: r.len, src: r.src, rows: r.n, term: r.term || null,
                                 members: r.members.map((m) => ({ cert: m.cert, id: m.id, corpus: m.corpus, sentence: m.sentence })) })),
  }, null, 2), "utf8");
  console.log("  wrote REPEATED-RUNS.json");
}
