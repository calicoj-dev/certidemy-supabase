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

const KNOWN = new Set(["--tiers", "--out", "--modules", "--pending"]);
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
// MODULE MODE IS CROSS-CERTIFICATION AND THE OTHER TIERS ARE NOT.
//
// Tiers 1-3 are scoped to one CERT_ID because a domain title only means
// anything beside its own cert's task statements. Module headings are the
// opposite: 116 rows spread over twelve certifications, nobody has read any of
// them, and splitting that into twelve documents would tier the work by which
// file a reviewer opened rather than by consequence.
//
// So --modules takes no CERT_ID and emits one document for everything. It
// reuses this file's preamble, marks, hash convention and wrapping unchanged -
// the point of extending rather than writing a second generator is that a
// reviewer learns one format.
const MODULES = process.argv.includes("--modules");
// --pending ASKS THE QUESTION BROADLY, which is the point of it.
//
// Tiers 1-3 are scoped to one CERT_ID. That scoping is why two SD-AI-I task
// translations sat unreviewed from 2026-07-22 through two review passes: both
// passes were run against SM-AI-II, and nothing ever asked "what is unreviewed
// ANYWHERE". Same shape as the module backlog - invisible because nobody asked
// the question broadly, not because anyone decided to skip it.
//
// So this mode takes no CERT_ID and sweeps every certification's
// task_translations and domain_translations for anything not approved. If the
// answer is two rows the document is two rows and costs a minute; the value is
// that the answer comes from a generator rather than from a future session's
// scoping query.
const PENDING = process.argv.includes("--pending");
const CROSS = MODULES || PENDING;
const CERT_ID = process.env.CERT_ID;
if (!CERT_ID && !CROSS) { console.error("Set CERT_ID (or pass --modules / --pending)."); process.exit(2); }
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

const EMPTY = { data: [] };
const scoped = (q) => (CROSS ? EMPTY : q);

const { data: cert } = MODULES
  ? { data: { code: "ALL CERTIFICATIONS", name: "module titles and descriptions" } }
  : PENDING
  ? { data: { code: "ALL CERTIFICATIONS", name: "everything not yet approved" } }
  : await db.from("certifications").select("code, name").eq("id", CERT_ID).single();
const { data: domains } = await scoped(db.from("domains").select("id, code, title, weight_pct, order_index").eq("certification_id", CERT_ID).order("order_index"));
const { data: domTr } = await db.from("domain_translations").select("domain_id, language, title, is_provisional");
const { data: tasks } = await scoped(db.from("tasks").select("id, code, domain_id, statement, skills, bloom_level").eq("certification_id", CERT_ID));
const { data: taskTr } = await db.from("task_translations").select("task_id, language, statement, is_provisional");
// SCOPED, AND THAT IS LOAD-BEARING. An unfiltered select on task_concepts returns every
// cert's rows and PostgREST caps the response at 1000, so this cert's rows fell off the end
// and every task printed "(none)". The bug was invisible in the query and obvious in the
// document, which is the argument for reading the artifact before shipping the generator.
const { data: tcs } = await db.from("task_concepts").select("task_id, concept_id")
  .in("task_id", (tasks || []).map((t) => t.id));
const { data: concepts } = await scoped(db.from("concepts").select("id, slug").eq("certification_id", CERT_ID));

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
p("[r]   approved AFTER repair — was [!], re-translated, re-read. Keep the original");
p("      NOTE so the defect stays on the record; append what the repair changed.");
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

if (MODULES) {
  // CONSEQUENCE ORDER. Module headings sit above the lessons a candidate reads,
  // so they rank with domain titles rather than below task statements. Within
  // the tier: available certifications first, then by how many rows nobody has
  // read, then alphabetically - a stable order, so a regenerated document does
  // not reshuffle under a half-finished review.
  const { data: certs } = await db.from("certifications").select("id, code, name, status, tier");
  const { data: mods } = await db.from("modules").select("id, certification_id, slug, title, description, order_index");
  const { data: modTr } = await db.from("module_translations").select("module_id, language, title, description, is_provisional, review_status");
  const trFor = (id, l) => (modTr || []).find((r) => r.module_id === id && r.language === l);

  // SINCE MIGRATION 302 THIS READS review_status, NOT is_provisional.
  //
  // The first generation of this document had to infer "unreviewed" from
  // is_provisional, and could not: migration 153 had flipped 30 rows to false for
  // being live since 2026-07-08 while saying in the same breath that it "is not a
  // claim that a reviewer signed them off". So that generation covered every row
  // and annotated those 30. A human then read all 232 marks on 2026-09-12, which
  // retired the annotation - those rows are now approved because someone approved
  // them.
  //
  // With a real three-state column the document can do what it could not before:
  // show ONLY what still needs a reader. A regenerated document that reprints 111
  // approved rows is a document nobody finishes.
  const needsReader = (t) => !t || t.review_status !== "approved";
  const unread = (m) => LANGS.filter((l) => needsReader(trFor(m.id, l))).length;
  const rows = (mods || []).map((m) => ({
    m, cert: (certs || []).find((c) => c.id === m.certification_id),
  })).filter((r) => r.cert && unread(r.m) > 0);
  const byCert = new Map();
  for (const r of rows) {
    if (!byCert.has(r.cert.code)) byCert.set(r.cert.code, { cert: r.cert, mods: [] });
    byCert.get(r.cert.code).mods.push(r.m);
  }
  const ordered = [...byCert.values()].sort((a, b) => {
    const av = a.cert.status === "available" ? 0 : 1, bv = b.cert.status === "available" ? 0 : 1;
    if (av !== bv) return av - bv;
    const au = a.mods.reduce((n, m) => n + unread(m), 0), bu = b.mods.reduce((n, m) => n + unread(m), 0);
    if (au !== bu) return bu - au;
    return a.cert.code.localeCompare(b.cert.code);
  });

  p(`## Module headings — every certification`);
  p();
  p(`Two blocks per module: the TITLE and the DESCRIPTION are separate rows to mark,`);
  p(`because they fail differently — a title is a heading a candidate navigates by, a`);
  p(`description is a paragraph they read once. One mark covering both would make a`);
  p(`rejection ambiguous about which half is wrong.`);
  p();
  for (const { cert: c, mods: ms } of ordered) {
    const u = ms.reduce((n, m) => n + unread(m), 0);
    p(`### ~${c.code}`);
    p();
    p(`**${c.name}** — tier ${c.tier}, ${c.status}. ${ms.length} modules, ${u} of ${ms.length * LANGS.length} translation rows never read.`);
    p();
    for (const m of ms.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))) {
      for (const field of ["title", "description"]) {
        const en = m[field] ?? "";
        if (!en) continue;
        if (!LANGS.some((l) => needsReader(trFor(m.id, l)))) continue;
        p(`### ${c.code}/${m.slug}-${field}`);
        p();
        p(`    EN       ${wrap(en, 13)}`);
        p(`    en#${h8(en)}`);
        p();
        for (const l of LANGS) {
          const tr = trFor(m.id, l);
          rowCount++;
          if (!tr) { missing++; p(`    [ ] ${l.padEnd(8)} *** MISSING TRANSLATION ***`); p(`        NOTE:`); p(); continue; }
          const val = tr[field];
          if (!val) { missing++; p(`    [ ] ${l.padEnd(8)} *** MISSING ${field.toUpperCase()} ***`); p(`        NOTE:`); p(); continue; }
          if (!needsReader(tr)) { rowCount--; continue; }   // approved: not reprinted, and not counted
          // A REPAIRED row is not a fresh one. retranslate-module-rejection.mjs
          // leaves it 'unreviewed' because no one has read the new text - but the
          // reader needs to know this string replaced one they rejected, or they
          // cannot tell [x] from [r].
          const state = tr.review_status === "rejected" ? "  (you rejected this; not yet repaired)" : "";
          p(`    [ ] ${l.padEnd(8)} ${wrap(val, 17)}${state}`);
          p(`        NOTE:`);
          p();
        }
      }
    }
    p(`---`);
    p();
  }
} else if (PENDING) {
  // Every certification, both tables, anything a reviewer has not approved.
  const { data: certs } = await db.from("certifications").select("id, code, name, status, tier");
  const { data: doms } = await db.from("domains").select("id, code, title, certification_id, order_index");
  const { data: domTrA } = await db.from("domain_translations")
    .select("domain_id, language, title, review_status, is_provisional");
  const { data: tks } = await db.from("tasks").select("id, code, statement, domain_id, bloom_level");
  const { data: taskTrA } = await db.from("task_translations")
    .select("task_id, language, statement, review_status, is_provisional");

  const open = (r) => r.review_status !== "approved" || r.is_provisional;
  const certOf = new Map((certs || []).map((c) => [c.id, c]));
  const domOf = new Map((doms || []).map((d) => [d.id, d]));
  const taskOf = new Map((tks || []).map((t) => [t.id, t]));

  // Build one entry per (subject, language) that is still open, then group by
  // certification so a reader moves through one credential at a time.
  const items = [];
  for (const r of (domTrA || []).filter(open)) {
    const d = domOf.get(r.domain_id); if (!d) continue;
    const c = certOf.get(d.certification_id); if (!c) continue;
    items.push({ c, kind: "domain title", key: d.code, en: d.title, tr: r.title, lang: r.language, status: r.review_status, meta: "" });
  }
  for (const r of (taskTrA || []).filter(open)) {
    const t = taskOf.get(r.task_id); if (!t) continue;
    const d = domOf.get(t.domain_id); if (!d) continue;
    const c = certOf.get(d.certification_id); if (!c) continue;
    items.push({ c, kind: "task statement", key: t.code, en: t.statement, tr: r.statement, lang: r.language, status: r.review_status, meta: `${d.code} · ${t.bloom_level}` });
  }

  const byCert = new Map();
  for (const it of items) {
    if (!byCert.has(it.c.code)) byCert.set(it.c.code, { c: it.c, items: [] });
    byCert.get(it.c.code).items.push(it);
  }
  const ordered = [...byCert.values()].sort((a, b) => {
    const av = a.c.status === "available" ? 0 : 1, bv = b.c.status === "available" ? 0 : 1;
    if (av !== bv) return av - bv;
    if (a.items.length !== b.items.length) return b.items.length - a.items.length;
    return a.c.code.localeCompare(b.c.code);
  });

  p(`## Everything not yet approved — every certification, both tables`);
  p();
  if (items.length === 0) {
    p(`**Nothing is open.** Every domain title and task statement on every`);
    p(`certification is approved. This is the generator answering the broad`);
    p(`question, not a filter returning empty.`);
    p();
  }
  for (const { c, items: its } of ordered) {
    p(`### ~${c.code}`);
    p();
    p(`**${c.name}** — tier ${c.tier}, ${c.status}. ${its.length} row(s) awaiting a reader.`);
    p();
    const bySubject = new Map();
    for (const it of its) {
      const k = `${it.kind}|${it.key}`;
      if (!bySubject.has(k)) bySubject.set(k, []);
      bySubject.get(k).push(it);
    }
    for (const [, group] of bySubject) {
      const f = group[0];
      p(`### ${c.code}/${f.key}`);
      p();
      p(`${f.kind}${f.meta ? " · " + f.meta : ""}`);
      p();
      p(`    EN       ${wrap(f.en, 13)}`);
      p(`    en#${h8(f.en)}`);
      p();
      for (const it of group.sort((a, b) => a.lang.localeCompare(b.lang))) {
        rowCount++;
        const state = it.status === "rejected" ? "  (you rejected this; not yet repaired)" : "";
        p(`    [ ] ${it.lang.padEnd(8)} ${wrap(it.tr, 17)}${state}`);
        p(`        NOTE:`);
        p();
      }
    }
    p(`---`);
    p();
  }
} else if (TIERS.has("1")) {
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

if (!CROSS && TIERS.has("2")) {
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

if (!CROSS && TIERS.has("3")) {
  // D1-D4, grouped by domain so a reviewer reads a coherent run rather than 35
  // unrelated sentences. Lowest risk of the three tiers: these are framework
  // statements whose vocabulary the translator has rendered many times. They are
  // still candidate-facing - this cert has no interface-string tier.
  const rest = (domains || []).filter((d) => d.code !== "D5");
  const n = (tasks || []).filter((t) => rest.some((d) => d.id === t.domain_id)).length;
  p(`## Tier 3 — D1 to D4 task statements`);
  p();
  p(`${n} statements, both languages. Grouped by domain so each run reads coherently.`);
  p(`**Lowest risk of the three tiers** — framework vocabulary the translator has rendered`);
  p(`many times — but still every word a candidate reads before paying.`);
  p();
  for (const d of rest) {
    const dt = (tasks || []).filter((t) => t.domain_id === d.id)
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    // THE DOMAIN SEPARATOR IS NOT A HEADING, and that is deliberate.
    // apply-translation-review.mjs keys every row off /^### (\S+)/, so a nested
    // #### task under a ### domain would make the parser read the DOMAIN code as
    // the key for every task row beneath it - silently, and for 70 rows. One
    // heading level per row type keeps the document and its parser in step.
    p(`**${d.code} — ${d.title}**`);
    p();
    for (const t of dt) {
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
