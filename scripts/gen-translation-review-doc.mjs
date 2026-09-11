#!/usr/bin/env node
/**
 * gen-translation-review-doc.mjs - produce ONE readable document a bilingual reviewer can
 * mark up, instead of 28 database rows and a schema lesson.
 *
 * READ-ONLY. It writes a markdown file and touches no table. The write-back that reads a
 * marked-up document and flips is_provisional is deliberately NOT built yet: a parser
 * written against a format nobody has used is a guess about how people mark things up.
 *
 *   CERT_ID=... node scripts/gen-translation-review-doc.mjs [--tiers 1,2] [--out <path>]
 *
 * WHY A DOCUMENT AND NOT A QUERY
 * ------------------------------
 * Comparing a translation to its English needs four things, and only two of them live in
 * the translation tables: the English source, the translation, WHICH TASK IT IS (a code,
 * not a uuid - so a reviewer can say "3.5's Spanish is wrong"), and WHAT THE SENTENCE IS
 * ABOUT. Without the last, a reviewer is checking grammar rather than meaning:
 * "Analizar una prevision" is only checkable against "Analyze a forecast that has become
 * a performance target" if you know the task is about target distortion. So the skills
 * line and the concept slugs travel with every row.
 *
 * THE DOCUMENT IS THE EVIDENCE, WHICH FORCES TWO DESIGN DECISIONS
 * ---------------------------------------------------------------
 * verify-cert's i18n.approved exists to record that a human compared a translation to the
 * CURRENT English. A marked-up file is what makes that claim true rather than asserted,
 * and that means it has to survive two things a checkbox alone does not.
 *
 * 1. THE ENGLISH CAN MOVE AFTER REVIEW. Every row carries a short content hash of the
 *    exact English that was reviewed - en#xxxxxxxx, the first 8 hex of a sha256. If the
 *    statement is later edited, a regenerated document shows a different hash on that row
 *    and the old tick is visibly attached to text that no longer exists. A tick without a
 *    matching hash is STALE, not approved. That is cheaper to read than a diff and it
 *    cannot be missed the way a generated-at date can.
 *
 * 2. "NOT REVIEWED" AND "REVIEWED AND REJECTED" ARE DIFFERENT STATES. An empty checkbox
 *    collapses them, and they need opposite handling - one wants a reviewer, the other
 *    wants a retranslation. So the document uses THREE marks and a mandatory note on the
 *    rejecting one:
 *
 *        [ ]  not reviewed
 *        [x]  approved
 *        [!]  rejected - and the NOTE line beneath it must say what is wrong
 *
 *    A [!] with an empty NOTE is itself an error state, and the future write-back should
 *    refuse the whole file on one.
 *
 * TIERS ARE BY CONSEQUENCE, NOT BY AUDIENCE. All of this cert's translation rows are
 * candidate-facing - certification_i18n holds the marketing copy and task_translations
 * holds the published blueprint, so there is no interface-string tier hiding in the count.
 *   Tier 1  the five domain titles - headings, read first, an error visible above nine
 *           correct statements beneath it
 *   Tier 2  D5's nine task statements - the domain the description sells, and where the
 *           vocabulary risk is highest
 *   Tier 3  the remaining 35 tasks - framework vocabulary, lowest risk
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const KNOWN = new Set(["--tiers", "--out"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error(`Unrecognised flag: ${a}`); process.exit(2); }
}
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d; };
const TIERS = new Set(arg("tiers", "1,2").split(",").map((t) => t.trim()));

for (const p of ["scripts/.env", ".env"]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const CERT_ID = process.env.CERT_ID;
if (!CERT_ID) { console.error("Set CERT_ID."); process.exit(2); }
const db = createClient(process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const LANGS = ["es-419", "pt-BR"];
const h8 = (s) => createHash("sha256").update(s ?? "", "utf8").digest("hex").slice(0, 8);
const wrap = (s, indent) => {
  const words = String(s ?? "").split(/\s+/); const out = []; let line = "";
  for (const w of words) { if ((line + " " + w).trim().length > 84) { out.push(line.trim()); line = w; } else line += " " + w; }
  if (line.trim()) out.push(line.trim());
  return out.map((l, i) => (i === 0 ? l : " ".repeat(indent) + l)).join("\n");
};

const { data: cert } = await db.from("certifications").select("code, name").eq("id", CERT_ID).single();
const { data: domains } = await db.from("domains").select("id, code, title, weight_pct, order_index").eq("certification_id", CERT_ID).order("order_index");
const { data: domTr } = await db.from("domain_translations").select("domain_id, language, title, is_provisional");
const { data: tasks } = await db.from("tasks").select("id, code, domain_id, statement, skills, bloom_level").eq("certification_id", CERT_ID);
const { data: taskTr } = await db.from("task_translations").select("task_id, language, statement, is_provisional");
// SCOPED, AND THAT IS LOAD-BEARING. An unfiltered select on task_concepts returns every
// cert's rows and PostgREST caps the response at 1000, so this cert's rows fell off the end
// and every task printed "(none)". The bug was invisible in the query and obvious in the
// document, which is the argument for reading the artifact before shipping the generator.
const { data: tcs } = await db.from("task_concepts").select("task_id, concept_id")
  .in("task_id", (tasks || []).map((t) => t.id));
const { data: concepts } = await db.from("concepts").select("id, slug").eq("certification_id", CERT_ID);

const conceptSlug = new Map((concepts || []).map((c) => [c.id, c.slug]));
const slugsFor = (taskId) => (tcs || []).filter((r) => r.task_id === taskId).map((r) => conceptSlug.get(r.concept_id)).filter(Boolean);
const domTrFor = (id, l) => (domTr || []).find((r) => r.domain_id === id && r.language === l);
const taskTrFor = (id, l) => (taskTr || []).find((r) => r.task_id === id && r.language === l);
const byId = new Map((domains || []).map((d) => [d.id, d]));

const L = [];
const p = (s = "") => L.push(s);
let rowCount = 0, missing = 0;

p(`# ${cert.code} — translation review`);
p();
p(`**Certification:** ${cert.name}`);
p(`**Generated:** ${new Date().toISOString().slice(0, 10)} — regenerate and re-check the hashes if the English has moved.`);
p(`**Scope:** tier${TIERS.size > 1 ? "s" : ""} ${[...TIERS].join(" and ")}`);
p(`**Languages:** es-419 (Latin American Spanish), pt-BR (Brazilian Portuguese)`);
p();
p(`---`);
p();
p(`## How to mark this up`);
p();
p("Three marks, not two. An empty box and a rejection are different states and need");
p("different handling — one wants a reviewer, the other wants a retranslation.");
p();
p("```");
p("[ ]   not reviewed");
p("[x]   approved — the translation says what the English says, in the right register");
p("[!]   rejected — AND write what is wrong on the NOTE line beneath it");
p("```");
p();
p("**A `[!]` with an empty NOTE is an error, not a rejection.** Say what is wrong, even");
p("briefly: *wrong register*, *reverses the meaning*, *uses the pre-2020 term*, *drops the");
p("qualifier that makes the task specific*. The note is what the next person acts on.");
p();
p("**You are not being asked to improve the English.** If the English itself reads wrong,");
p("mark the row `[!]` and say so — that is a finding about the source, and it is worth more");
p("than a corrected translation of a bad sentence.");
p();
p("### The hash on each row");
p();
p("Each row carries `en#xxxxxxxx`, a fingerprint of the exact English you are comparing");
p("against. **If that English is later edited, a regenerated document shows a different");
p("hash and your tick is visibly attached to text that no longer exists.** A tick whose");
p("hash no longer matches is stale rather than approved. You do not need to do anything");
p("with it — it exists so nobody can mistake an old review for a current one.");
p();
p("### What makes a translation wrong here, beyond the usual");
p();
p("**The 2020 Scrum Guide retired several terms, and a translation can reintroduce one");
p("even when the English is right.** This has already happened in this certification's item");
p("bank. Please flag any of these:");
p();
p("| Do not want | Want |");
p("|---|---|");
p("| `autoorganizado` / `auto-organizado` | `autogestionado` / `autogerenciado` |");
p("| `ceremonia` / `cerimônia` | `evento` |");
p("| `equipo de desarrollo` / `time de desenvolvimento` | **Developers**, left in English |");
p("| `roles` / `papéis` for the three accountabilities | `responsabilidades` |");
p();
p("**Scrum terms stay in English throughout** — Sprint, Scrum Master, Product Owner,");
p("Developers, Scrum Team, Sprint Backlog, Product Backlog, Definition of Done, Increment,");
p("Sprint Review, Sprint Retrospective, Sprint Planning, Daily Scrum, Sprint Goal,");
p("Product Goal. A translated one is a defect.");
p();
p(`---`);
p();

if (TIERS.has("1")) {
  p(`## Tier 1 — domain titles`);
  p();
  p(`Five headings, both languages. They sit above the task statements, so an error here is`);
  p(`visible above nine correct sentences. **~20 minutes.**`);
  p();
  for (const d of domains || []) {
    p(`### ${d.code} · ${d.weight_pct}% of the exam`);
    p();
    p(`    EN       ${wrap(d.title, 13)}`);
    p(`    en#${h8(d.title)}`);
    p();
    for (const l of LANGS) {
      const tr = domTrFor(d.id, l);
      rowCount++;
      if (!tr) { missing++; p(`    [ ] ${l.padEnd(8)} *** MISSING TRANSLATION ***`); p(`        NOTE:`); p(); continue; }
      p(`    [ ] ${l.padEnd(8)} ${wrap(tr.title, 17)}`);
      p(`        NOTE:`);
      p();
    }
  }
  p(`---`);
  p();
}

if (TIERS.has("2")) {
  const d5 = (domains || []).find((d) => d.code === "D5");
  const d5tasks = (tasks || []).filter((t) => t.domain_id === d5?.id).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  p(`## Tier 2 — D5 task statements`);
  p();
  p(`${d5tasks.length} statements, both languages — **${d5?.title}**.`);
  p(`The domain the catalogue`);
  p(`description sells, and the one where the retired-vocabulary risk is highest because its`);
  p(`sentences carry *generated*, *model* and *estimates*. **~1 hour.**`);
  p();
  for (const t of d5tasks) {
    p(`### ${t.code} · ${t.bloom_level}`);
    p();
    p(`    concepts ${slugsFor(t.id).join(" · ") || "(none)"}`);
    p(`    EN       ${wrap(t.statement, 13)}`);
    if (t.skills) p(`    skills   ${wrap(t.skills, 13)}`);
    p(`    en#${h8(t.statement)}`);
    p();
    for (const l of LANGS) {
      const tr = taskTrFor(t.id, l);
      rowCount++;
      if (!tr) { missing++; p(`    [ ] ${l.padEnd(8)} *** MISSING TRANSLATION ***`); p(`        NOTE:`); p(); continue; }
      p(`    [ ] ${l.padEnd(8)} ${wrap(tr.statement, 17)}`);
      p(`        NOTE:`);
      p();
    }
  }
  p(`---`);
  p();
}

p(`## When you are done`);
p();
p(`Hand this file back marked up. **It is the evidence**, not a worksheet — \`verify-cert\`'s`);
p(`\`i18n.approved\` check exists to record that a human compared these translations to the`);
p(`current English, and this document is what makes that a fact rather than an assertion.`);
p();
p(`**${rowCount} rows in scope.** Nothing is flipped in the database until a person has read`);
p(`them, and nothing is flipped for a row marked \`[!]\` at all.`);

const out = arg("out", `jta/${cert.code}_TRANSLATION-REVIEW.md`);
writeFileSync(out, L.join("\n") + "\n", "utf8");
console.log(`wrote ${out}`);
console.log(`  ${rowCount} rows in scope, ${missing} missing translations`);
if (missing) console.log(`  ! ${missing} rows have no translation to review - generate them first`);
