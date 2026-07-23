#!/usr/bin/env node
/**
 * gen-jta-doc.mjs - render the FACTUAL half of a Job-Task Analysis from the database.
 *
 * WHY THIS EXISTS
 *
 * The hand-written JTA documents drifted from the database they describe, twice, and
 * the second time it caused real damage: a translator worked from
 * SM-AI-I_JTA_v2.0.md instead of the live tasks, and five task statements were
 * translated into Spanish and Portuguese from wording that migration 091 had already
 * superseded. Nobody noticed for weeks because nothing compared the two.
 *
 * When the drift was finally measured it was not confined to statements. SPO-AI-I's
 * document published:
 *
 *     Bloom distribution   15 / 35 / 35 / 15   (hand-typed "target" table)
 *     computed from tasks   1.9 / 36.9 / 52.7 / 8.5
 *     Duration              90 minutes         (database: 120)
 *     Title                 "(v1.1)"           (filename: v2.0)
 *     Task 3.2              "Explain that the Product Owner is one accountable person"
 *     database              "Apply the one-Product-Owner rule: a single accountable
 *                            person, not a committee or a proxy"
 *
 * Migration 097 had already named this failure mode for exam_blueprint:
 *
 *     "A human transcribing percentages is exactly how the inherited Bloom target
 *      tables drifted away from the tasks they were supposed to summarize - and
 *      drifted for eight months without anyone noticing."
 *
 * The fix there was to COMPUTE the blueprint instead of typing it. This script applies
 * the same fix to the JTA document.
 *
 * WHAT IS GENERATED VS WHAT STAYS HUMAN
 *
 * Generated here (it duplicates the database, so it must be derived from it):
 *   - exam facts (questions, duration, pass mark) from `certifications`
 *   - domain structure, weights, descriptions, and computed MCQ seats
 *   - the cognitive profile, computed from v_cognitive_profile - never a target table
 *   - every task: statement, criticality, frequency, Bloom, exam scope, simulation
 *     candidacy, concept slugs, and the K/S/A lines
 *
 * NOT generated, and deliberately left alone:
 *   - design decisions and domain-weight rationale
 *   - sourcing, review history, sign-off records
 *   - reconciliation records (e.g. SM-AI-I_JTA_v2.0_RECONCILIATION.md)
 *
 * Those carry human judgment that no query can reconstruct. They belong in a companion
 * narrative document. This script never reads or writes them.
 *
 * OUTPUT is a NEW file - jta/<CODE>_JTA_generated.md - and no existing document is
 * touched. Verify the generated version against the hand-written one before retiring
 * anything.
 *
 * USAGE
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   node scripts\gen-jta-doc.mjs --cert SPO-AI-I
 *   node scripts\gen-jta-doc.mjs --all
 *   node scripts\gen-jta-doc.mjs --cert SPO-AI-I --stdout   # print, do not write
 */

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// env (same convention as verify-cert.mjs)
// ---------------------------------------------------------------------------
function loadEnv() {
  for (const p of ["scripts/.env", ".env"]) {
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const [, k, raw] = m;
      const v = raw.replace(/^["']|["']$/g, "");
      if (process.env[k] === undefined || process.env[k] === "") process.env[k] = v;
    }
  }
}
loadEnv();

const URL = process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required (scripts/.env or environment).");
  process.exit(1);
}

const argv = process.argv.slice(2);
const ALL = argv.includes("--all");
const STDOUT = argv.includes("--stdout");
const ci = argv.indexOf("--cert");
const CERT = ci >= 0 ? (argv[ci + 1] || "").trim() : "";
if (!ALL && !CERT) {
  console.error("Usage: node scripts/gen-jta-doc.mjs --cert <CODE> | --all  [--stdout]");
  process.exit(1);
}

const db = createClient(URL, KEY, { auth: { persistSession: false } });

// ---------------------------------------------------------------------------
// enum -> display. Kept explicit: a silent fallback would render a wrong label
// rather than failing, and this document is an audit artifact.
// ---------------------------------------------------------------------------
const CRITICALITY = { high: "High", medium: "Medium", low: "Low" };
const FREQUENCY = {
  daily: "Daily", weekly: "Weekly", occasional: "Occasional",
  per_sprint: "Per Sprint", per_exam: "Per exam",
};
const BLOOM = {
  "1_remember": "1 (Remember)", "2_understand": "2 (Understand)",
  "3_apply": "3 (Apply)", "4_analyze": "4 (Analyze)",
  "5_evaluate": "5 (Evaluate)", "6_create": "6 (Create)",
};
function label(map, v, what) {
  if (v == null) return "-";
  const out = map[String(v)];
  if (!out) throw new Error(`unmapped ${what}: "${v}" - add it to the map in gen-jta-doc.mjs`);
  return out;
}

// largest-remainder, matching generate-mock-exam's allocation
function allocate(weights, total) {
  const sum = weights.reduce((s, w) => s + w.pct, 0) || 1;
  const exact = weights.map((w) => ({ key: w.key, e: (w.pct / sum) * total }));
  const out = new Map(exact.map((x) => [x.key, Math.floor(x.e)]));
  let left = total - [...out.values()].reduce((a, b) => a + b, 0);
  exact.sort((a, b) => (b.e - Math.floor(b.e)) - (a.e - Math.floor(a.e)));
  for (const x of exact) { if (left <= 0) break; out.set(x.key, out.get(x.key) + 1); left--; }
  return out;
}

// ---------------------------------------------------------------------------
async function render(code) {
  const { data: cert } = await db.from("certifications")
    .select("id, code, name, status, num_questions, exam_duration_minutes, passing_score_pct, exam_blueprint")
    .eq("code", code).maybeSingle();
  if (!cert) throw new Error(`no certification with code ${code}`);

  const [{ data: domains }, { data: tasks }, { data: profile }] = await Promise.all([
    db.from("domains").select("id, code, title, description, weight_pct, order_index")
      .eq("certification_id", cert.id).order("order_index"),
    db.from("tasks").select("id, code, domain_id, statement, criticality, frequency, bloom_level, is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index")
      .eq("certification_id", cert.id),
    db.from("v_cognitive_profile").select("bloom_level, tasks, pct_of_form")
      .eq("certification_id", cert.id),
  ]);

  // concept slugs per task
  const { data: concepts } = await db.from("concepts").select("id, slug").eq("certification_id", cert.id);
  const conceptById = new Map((concepts ?? []).map((c) => [c.id, c.slug]));
  const { data: tcs } = await db.from("task_concepts").select("task_id, concept_id")
    .in("concept_id", (concepts ?? []).map((c) => c.id));
  const slugsByTask = new Map();
  for (const r of tcs ?? []) {
    const s = conceptById.get(r.concept_id);
    if (!s) continue;
    if (!slugsByTask.has(r.task_id)) slugsByTask.set(r.task_id, []);
    slugsByTask.get(r.task_id).push(s);
  }

  const nq = cert.num_questions ?? 0;
  const seats = allocate((domains ?? []).map((d) => ({ key: d.id, pct: Number(d.weight_pct) })), nq);

  // task-code order, not order_index: the document reads by code, and order_index
  // uses different conventions per cert (some per-domain, some global).
  const byCode = (a, b) => {
    const [am, an] = a.code.split(".").map(Number);
    const [bm, bn] = b.code.split(".").map(Number);
    return am - bm || an - bn;
  };

  const L = [];
  const now = new Date().toISOString().slice(0, 10);

  L.push(`# ${cert.code} - Job-Task Analysis`);
  L.push("");
  L.push(`> **GENERATED FROM THE DATABASE on ${now}. Do not hand-edit.**`);
  L.push(">");
  L.push("> Every fact below is rendered from the live schema by");
  L.push("> `scripts/gen-jta-doc.mjs`. To change anything here, change the database");
  L.push("> through a migration and regenerate - the git diff on this file is then the");
  L.push("> change record.");
  L.push(">");
  L.push("> Design rationale, sourcing, review history and reconciliation records are");
  L.push("> NOT here. They carry human judgment that no query can reconstruct, and live");
  L.push("> in the companion narrative document.");
  L.push("");
  L.push(`**Certification:** ${cert.name}  `);
  L.push(`**Status:** ${cert.status}`);
  L.push("");
  L.push("---");
  L.push("");

  L.push("## Exam facts");
  L.push("");
  L.push("| Attribute | Value |");
  L.push("|-|-|");
  L.push(`| Questions | ${nq} |`);
  L.push(`| Duration | ${cert.exam_duration_minutes} minutes |`);
  L.push(`| Passing score | ${Number(cert.passing_score_pct)}% (${Math.ceil((Number(cert.passing_score_pct) / 100) * nq)}/${nq}) |`);
  L.push("| Format | Multiple choice (single answer), online |");
  L.push("| Bloom ceiling | 4 (Analyze) for MCQ; 5-6 reserved for simulation |");
  L.push("| Languages | English, es-419, pt-BR |");
  L.push("");

  L.push("## Domain structure");
  L.push("");
  L.push("| # | Domain | Weight | MCQ seats |");
  L.push("|-|-|-|-|");
  for (const d of domains ?? []) {
    L.push(`| ${d.code} | ${d.title} | ${Number(d.weight_pct)}% | ${seats.get(d.id) ?? 0} |`);
  }
  const wsum = (domains ?? []).reduce((s, d) => s + Number(d.weight_pct), 0);
  L.push(`| **Total** | | **${wsum}%** | **${nq}** |`);
  L.push("");

  L.push("## Cognitive profile");
  L.push("");
  L.push("Computed from `v_cognitive_profile`: task Bloom level weighted by domain");
  L.push("weight over exam-scope tasks. It is a **consequence** of the JTA, not a target");
  L.push("asserted over it - `certifications.exam_blueprint` must equal this, and");
  L.push("verify-cert invariant 17 fails if they diverge.");
  L.push("");
  L.push("| Bloom level | Tasks | % of form |");
  L.push("|-|-|-|");
  for (const p of (profile ?? []).sort((a, b) => String(a.bloom_level).localeCompare(String(b.bloom_level)))) {
    L.push(`| ${label(BLOOM, p.bloom_level, "bloom_level")} | ${p.tasks} | ${Number(p.pct_of_form)}% |`);
  }
  L.push("");
  L.push("---");
  L.push("");

  for (const d of domains ?? []) {
    const dTasks = (tasks ?? []).filter((t) => t.domain_id === d.id).sort(byCode);
    L.push(`# Domain ${d.code} - ${d.title} (${Number(d.weight_pct)}%)`);
    L.push("");
    if (d.description) { L.push(`**Description.** ${d.description}`); L.push(""); }
    L.push(`**Tasks:** ${dTasks.length}  |  **MCQ seats:** ${seats.get(d.id) ?? 0}`);
    L.push("");
    L.push("## Tasks");
    L.push("");
    for (const t of dTasks) {
      L.push(`### Task ${t.code} - ${t.statement}`);
      L.push("");
      L.push("| Attribute | Value |");
      L.push("|-|-|");
      L.push(`| Domain | ${d.code} |`);
      L.push(`| Criticality | ${label(CRITICALITY, t.criticality, "criticality")} |`);
      L.push(`| Frequency | ${label(FREQUENCY, t.frequency, "frequency")} |`);
      L.push(`| Bloom level | ${label(BLOOM, t.bloom_level, "bloom_level")} |`);
      L.push(`| Exam scope | ${t.is_exam_scope ? "Yes" : "No"} |`);
      if (t.is_simulation_candidate) L.push("| Simulation candidate | Yes |");
      const slugs = (slugsByTask.get(t.id) ?? []).sort();
      L.push(`| Concept slugs | ${slugs.length ? slugs.map((s) => `\`${s}\``).join(", ") : "-"} |`);
      L.push("");
      if (t.knowledge) L.push(`- **K:** ${t.knowledge}`);
      if (t.skills) L.push(`- **S:** ${t.skills}`);
      if (t.abilities) L.push(`- **A:** ${t.abilities}`);
      L.push("");
    }
    L.push("---");
    L.push("");
  }

  L.push(`*Generated ${now} by scripts/gen-jta-doc.mjs from certification ${cert.code} (${cert.id}).*`);
  L.push("");
  return L.join("\n");
}

// ---------------------------------------------------------------------------
const codes = ALL
  ? (await db.from("certifications").select("code").order("code")).data.map((c) => c.code)
  : [CERT];

for (const code of codes) {
  const md = await render(code);
  if (STDOUT) { console.log(md); continue; }
  const out = path.join("jta", `${code}_JTA_generated.md`);
  fs.mkdirSync("jta", { recursive: true });
  fs.writeFileSync(out, md, "utf8");
  const tasks = (md.match(/^### Task /gm) || []).length;
  console.log(`${code.padEnd(10)} -> ${out}  (${tasks} tasks, ${md.split("\n").length} lines)`);
}
