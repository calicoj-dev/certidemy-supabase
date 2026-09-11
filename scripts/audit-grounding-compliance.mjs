#!/usr/bin/env node
/**
 * audit-grounding-compliance.mjs - does the bank assert what SCRUM_GUIDE_FACTS forbids?
 *
 * WHY THIS EXISTS
 * ---------------
 * The 35 never-assert entries in scripts/lib/item-grounding.mjs are injected into the
 * draft AND critique prompts for every Level II Scrum item. Until now that constant has
 * only ever been reasoned about. Nothing has ever tested it against OUTPUT.
 *
 * verify-cert checks structure, coverage, cue neutrality, firewall and Bloom. It does NOT
 * check whether a factual claim is true - item-pipeline.mjs says so in its own docblock,
 * and ATTRIBUTION_RULES is the only other guard on that class. This script is the missing
 * half: it reads the bank and asks whether the prohibitions held.
 *
 * WHAT IT CHECKS, AND WHAT IT CANNOT
 * ----------------------------------
 * IT IS LEXICAL, AND THAT IS A REAL LIMIT. A never-assert entry is a claim; this script
 * matches PHRASINGS of that claim. It will miss a paraphrase and it will flag a sentence
 * that happens to contain the words. Every hit is a candidate for a human read, not a
 * verdict. A clean run is evidence, not proof.
 *
 * THE LIMIT IS MEASURED, NOT ESTIMATED. First run against SM-AI-II practice/en, 440
 * items: 25 hits, of which 23 were false and 2 were real. That is a 92% false-positive
 * rate, and the causes are worth naming because they are not fixable by tuning:
 *
 *   POLARITY. "The Scrum Guide prescribes neither ranges nor story points" and "Relaxing
 *   the Definition of Done is not permissible" are the CORRECT statements of the very
 *   entries that flagged them. A regex cannot see a negation it was not told about, and
 *   there is no general fix - each rule would need its own.
 *
 *   CLAUSE BOUNDARIES. [^.]{0,40} crosses semicolons and commas, so "Developers, and the
 *   entire Scrum Team is accountable for the resulting Increment" matched a rule about
 *   the Developers being accountable for the Increment - while saying the opposite.
 *
 * So: READ EVERY HIT. A number from this script is not a finding until someone has.
 *
 * THE KEY / DISTRACTOR ASYMMETRY IS THE WHOLE DESIGN. SCRUM_GUIDE_FACTS says a distractor
 * MAY be built on a forbidden claim - that is what makes it a good distractor - and that
 * the KEY and the EXPLANATION never may. So a match is scored by WHERE it lands:
 *
 *   key option text  -> DEFECT
 *   explanation      -> DEFECT
 *   distractor text  -> expected, and reported separately as evidence the
 *                       misconceptions are actually being used
 *
 * A run that finds forbidden claims ONLY in distractors is the intended state.
 *
 * USAGE
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   CERT_ID=... node scripts/audit-grounding-compliance.mjs [--pool practice|secure] [--lang en]
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

for (const p of ["scripts/.env", ".env"]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d; };
const CERT_ID = process.env.CERT_ID;
const POOL = arg("pool", "practice");
const LANG = arg("lang", "en");
if (!CERT_ID) { console.error("Set CERT_ID."); process.exit(2); }

const db = createClient(process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

// Each rule names the entry it enforces. `re` is deliberately narrow: a phrasing that
// ASSERTS the claim, not merely a sentence containing the vocabulary.
const RULES = [
  ["N1  sprint cancellation authority", /\b(scrum master|developers?|team|stakeholders?|manager)\b[^.]{0,60}\b(may|can|could|should)\b[^.]{0,20}cancel(s|led)?\b[^.]{0,20}\bsprint\b/i],
  ["N2  scrum master overrules ordering", /\bscrum master\b[^.]{0,60}\b(reorder|re-order|overrul\w+|overrid\w+)\b[^.]{0,30}\b(product )?backlog\b/i],
  ["N3  weakening an organizational DoD", /\b(relax|lower|weaken|reduce)\w*\b[^.]{0,40}\bdefinition of done\b/i],
  ["N4  SM accountable for increment/backlog", /\bscrum master\b[^.]{0,40}\baccountable for\b[^.]{0,30}\b(increment|product backlog|delivery)\b/i],
  ["N5  sprint extended or paused", /\b(extend|pause|lengthen|shorten)\w*\b[^.]{0,30}\bthe sprint\b[^.]{0,30}\b(once|after|mid)/i],
  ["N6  daily scrum as status report", /\bdaily scrum\b[^.]{0,50}\b(status (report|update)|report(ing)? to)\b/i],
  ["N7  the three questions as required", /\bthree questions\b/i],
  ["N8  forecast or velocity as a commitment", /\bsprint backlog\b[^.]{0,30}\b(is|as) a commitment\b/i],
  ["N9  scrum prescribes points/velocity/burndown", /\b(scrum|the guide|the framework)\b[^.]{0,40}\b(prescribes?|requires?|mandates?)\b(?![^.]{0,15}\b(no|neither|nor|not)\b)[^.]{0,40}\b(story points?|velocity|burn.?downs?|refinement)\b/i],
  ["N10 scrum defines roles", /\bscrum\b[^.]{0,25}\bdefines?\b[^.]{0,20}\broles\b/i],
  ["N11 assignment prohibition / narrowed self-management", /\b(no one|nobody)\b[^.]{0,25}\bassigns?\b|\bdevelopers\b[^.]{0,30}\bdecide who does what\b/i],
  ["N12 product owner as a committee", /\bproduct owner\b[^.]{0,40}\b(committee|group of people|shared role|multiple people)\b/i],
  ["N14 timebox as a fixed duration", /\btimebox\w*\b[^.]{0,30}\bfixed duration\b|\bmust (last|run) the full\b/i],
  ["N15 sprint review as a release gate", /\bsprint review\b[^.]{0,40}\brelease gate\b|\brelease\b[^.]{0,30}\bonly\b[^.]{0,30}\bsprint (review|end)\b/i],
  ["N16 one increment per sprint", /\bonly one increment\b|\bincrement\b[^.]{0,30}\bonce per sprint\b/i],
  ["N17 product goal == sprint goal", /\bproduct goal\b[^.]{0,30}\b(is the same as|interchangeable with|equals)\b[^.]{0,20}\bsprint goal\b/i],
  ["N18 scrum master writes the sprint goal", /\bscrum master\b[^.]{0,30}\b(writes?|crafts?|sets?|defines?)\b[^.]{0,20}\bthe sprint goal\b/i],
  // CASE-SENSITIVE ON PURPOSE. The lowercase English words "safe" and "less" are
  // not framework names, and an /i/ flag here produced 10 false hits out of 25 on
  // the first run - the single worst rule in this file.
  ["N21 a scaling framework is part of scrum", /\bSAFe\b|\bLeSS\b|\bNexus\b|\bScrum@Scale\b|\bscrum of scrums\b|\bSpotify model\b/],
  ["N22 prior-edition vocabulary", /\bself-organiz\w+|\bceremon(y|ies)\b/i],
  ["N23 developers accountable for the increment", /\bdevelopers?\b[^.]{0,40}\baccountable for\b[^.]{0,40}\bincrement\b/i],
  ["N25 the sprint bounds risk", /\bthe sprint\b[^.]{0,40}\b(bounds?|limits?|contains?)\b[^.]{0,25}\brisk\b/i],
  ["N26 2017 ordering criterion", /\bbest achieve\b[^.]{0,20}\bgoals?\b|\bgoals and missions\b/i],
  ["N27 required to share a PO / backlog / goal", /\b(must|required to|have to)\b[^.]{0,30}\bshare\b[^.]{0,40}\b(product owner|product backlog|product goal)\b/i],
  ["N28 the sprint review is not a presentation", /\bsprint review\b[^.]{0,25}\bis not a\b[^.]{0,15}\bpresentation\b|\bnever a presentation\b/i],
  ["N29 low transparency, subject and modal dropped", /\blow transparency\b\s+(leads|results|causes)\b/i],
  ["N30 empirical-approach quotation drift", /\badopt(ing)?\b[^.]{0,15}\ban empirical approach\b/i],
  ["N31 container attributed to only one object", /\bonly\b[^.]{0,20}\bscrum\b[^.]{0,20}\bis a container\b|\bthe sprint is not a container\b/i],
];

const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await db.from("quiz_questions")
    .select("id, task_id, question_text, options, correct_answer, explanation, bloom_level, difficulty, pool, language, bank_revision")
    .eq("certification_id", CERT_ID).eq("pool", POOL).eq("language", LANG)
    .is("retired_at", null).order("id").range(from, from + 999);
  if (error) { console.error(error.message); process.exit(1); }
  if (!data?.length) break;
  rows.push(...data);
  if (data.length < 1000) break;
}

const { data: tasks } = await db.from("tasks").select("id, code, domain_id").eq("certification_id", CERT_ID);
const taskCode = new Map((tasks || []).map(t => [t.id, t.code]));

let defects = [], distractorHits = 0;
const byRuleDefect = new Map(), byRuleDistractor = new Map();

for (const q of rows) {
  const keyIds = new Set([].concat(q.correct_answer || []));
  const opts = Array.isArray(q.options) ? q.options : [];
  const keyText = opts.filter(o => keyIds.has(o.id)).map(o => o.text).join(" ");
  const distText = opts.filter(o => !keyIds.has(o.id)).map(o => o.text).join(" \u0001 ");
  const asserted = `${keyText} ${q.explanation || ""}`;
  for (const [name, re] of RULES) {
    if (re.test(asserted)) {
      defects.push({ task: taskCode.get(q.task_id), id: q.id, rule: name,
        where: re.test(keyText) ? "KEY" : "EXPLANATION",
        snippet: (asserted.match(re) || [""])[0].slice(0, 120) });
      byRuleDefect.set(name, (byRuleDefect.get(name) || 0) + 1);
    }
    if (re.test(distText)) {
      distractorHits++;
      byRuleDistractor.set(name, (byRuleDistractor.get(name) || 0) + 1);
    }
  }
}

console.log(`SCRUM_GUIDE_FACTS COMPLIANCE - ${POOL}/${LANG}, ${rows.length} items, ${RULES.length} rules`);
console.log(`(lexical: a hit is a candidate for a human read, not a verdict)\n`);
console.log(`DEFECTS - forbidden claim asserted in a KEY or an EXPLANATION: ${defects.length}`);
for (const d of defects.slice(0, 40)) {
  console.log(`  task ${String(d.task).padEnd(5)} ${d.where.padEnd(11)} ${d.rule}`);
  console.log(`      "${d.snippet}"`);
}
if (defects.length) {
  console.log("\n  by rule:");
  for (const [k, v] of [...byRuleDefect].sort((a, b) => b[1] - a[1])) console.log(`    ${String(v).padStart(4)}  ${k}`);
}
console.log(`\nDISTRACTOR HITS - expected and healthy: ${distractorHits}`);
for (const [k, v] of [...byRuleDistractor].sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log(`  ${String(v).padStart(4)}  ${k}`);
process.exit(defects.length ? 1 : 0);
