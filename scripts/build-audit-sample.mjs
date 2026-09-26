/**
 * build-audit-sample.mjs -- 40 English secure items per certification, stratified
 * by blueprint weight, for the source-conformance audit decision.
 *
 * READ-ONLY. Writes only AUDIT-SAMPLE.md. Unknown flags exit 2.
 *
 * ============ WHAT MAKES THIS A SAMPLE AND NOT A PILE ============
 *
 * Stratified by DOMAIN in proportion to `domains.weight_pct`, largest remainder, so
 * each certification's 40 mirror the blueprint the exam is assembled from. A flat
 * random 40 would over-sample whatever domain happens to hold the most items, and
 * the audit question is about the exam, not about the bank's shape.
 *
 * The seed is recorded and the shuffle is deterministic, so re-running reproduces
 * the same 480 items.
 *
 * ============ AND IT DOES NOT OVERLAP THE 342 ============
 *
 * The 342 already read are es-419 rows; their English siblings share a
 * `question_group_id`. Excluding by GROUP rather than by id is what actually
 * prevents re-reading the same question in a different language -- excluding by id
 * would have let every one of the 342 back in through its English sibling.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn } from "./_pg.mjs";
import { acquireHeavyReaderLock } from "./lib/heavy-reader-lock.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY apart from the report");
  process.exitCode = 2; process.exit();
}

const SEED = 20260926;
const PER_CERT = 40;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The standard each certification cites, for the section headers. */
const SOURCE = {
  "AIE-I": "No single normative standard. Certidemy's own AI-essentials blueprint; claims about AI behaviour are checked against the cited vendor or research source in the item.",
  "AIGRM-I": "ISO/IEC 42001:2023, the EU AI Act, and the NIST AI Risk Management Framework.",
  "AIHR-I": "Certidemy blueprint plus the employment-law and fairness sources each item cites.",
  "AIMS-F": "ISO/IEC 42001:2023.",
  "AIMS-IA": "ISO/IEC 42001:2023 and ISO 19011:2026.",
  "AISM-I": "ITIL 4 and ISO/IEC 20000-1, per the item.",
  "ISMS-F": "ISO/IEC 27001:2022 (and Amd 1:2024).",
  "ISMS-IA": "ISO/IEC 27001:2022 and ISO 19011:2026.",
  "SD-AI-I": "The 2020 Scrum Guide.",
  "SM-AI-I": "The 2020 Scrum Guide.",
  "SM-AI-II": "The 2020 Scrum Guide.",
  "SPO-AI-I": "The 2020 Scrum Guide.",
};

const KEY = requireKey(HERE);
const release = await acquireHeavyReaderLock("build-audit-sample");
try {
  const certs = (await getAll(KEY, "certifications?select=id,code,name,num_questions&order=code"))
    .filter((c) => c.code !== "ZZ-TEST-I");
  const domains = await getAll(KEY, "domains?select=id,code,certification_id,weight_pct&order=id");
  const tasks = await getAll(KEY, "tasks?select=id,code,statement,domain_id&order=id");
  const taskBy = new Map(tasks.map((t) => [t.id, t]));

  /* the groups already read as part of the 342 */
  const readSessions = await getAll(KEY,
    "exam_session_items?select=session_id,question_id&language=neq.en&order=session_id");
  const attempts = await getAll(KEY, "exam_attempts?select=id,session_id&order=id");
  const scored = new Set(attempts.map((a) => a.session_id));
  const readIds = [...new Set(readSessions.filter((r) => scored.has(r.session_id)).map((r) => r.question_id))];
  const readRows = await getAllIn(KEY, "quiz_questions", "id,question_group_id", "id", readIds);
  const readGroups = new Set(readRows.map((r) => r.question_group_id).filter(Boolean));

  const pool = await getAll(KEY,
    "quiz_questions?select=id,certification_id,question_group_id,task_id,question_text,options,correct_answer,explanation,difficulty"
    + "&language=eq.en&pool=eq.secure&status=eq.approved&retired_at=is.null&order=id");

  console.log("AUDIT SAMPLE -- read-only");
  console.log("  English secure items available   " + pool.length);
  console.log("  groups already read (the 342)    " + readGroups.size);
  const eligible = pool.filter((r) => !r.question_group_id || !readGroups.has(r.question_group_id));
  console.log("  eligible after excluding them    " + eligible.length +
    "   (removed " + (pool.length - eligible.length) + ")");
  if (pool.length - eligible.length < 300) {
    console.error("");
    console.error("REFUSING: excluding the 342 removed only " + (pool.length - eligible.length) +
      " English rows. Expected ~342 -- the group join is not matching, and a sample that");
    console.error("silently overlaps the already-read set is worse than none.");
    process.exitCode = 2; process.exit();
  }
  console.log("");

  const rnd = mulberry32(SEED);
  const L = [];
  L.push("# Audit sample — 40 English secure items per certification");
  L.push("");
  L.push("**Read-only. Nothing here is a finding.** This is the sample for the decision in");
  L.push("`OPEN-ITEMS.md`: *should the secure pools get a source-conformance audit before");
  L.push("more exams run?*");
  L.push("");
  L.push("English only, key marked, task code and statement, and **the source the");
  L.push("certification cites** in each section header — because the audit question is");
  L.push("whether an item is right against *its own* source.");
  L.push("");
  L.push("**Seed `" + SEED + "`**, mulberry32, Fisher–Yates over ids sorted ascending.");
  L.push("Stratified by **domain** in proportion to `weight_pct`, largest remainder, so each");
  L.push("40 mirrors the blueprint the exam is actually assembled from.");
  L.push("");
  L.push("**No overlap with the 342 already read.** Exclusion is by `question_group_id`, not");
  L.push("by id: the 342 are es-419 rows, and excluding by id would have let every one back");
  L.push("in through its English sibling. " + (pool.length - eligible.length) +
    " English rows removed, " + eligible.length + " eligible.");
  L.push("");

  const summary = [];
  const all = [];
  for (const c of certs) {
    const mine = eligible.filter((r) => r.certification_id === c.id);
    if (!mine.length) continue;
    const ds = domains.filter((d) => d.certification_id === c.id);
    const tot = ds.reduce((s, d) => s + Number(d.weight_pct), 0) || 100;
    const rows = ds.map((d) => {
      const inD = mine.filter((r) => (taskBy.get(r.task_id) || {}).domain_id === d.id);
      const exact = (PER_CERT * Number(d.weight_pct)) / tot;
      return { d, inD, exact, q: Math.floor(exact), rem: exact - Math.floor(exact) };
    });
    let left = PER_CERT - rows.reduce((s, r) => s + r.q, 0);
    for (const r of [...rows].sort((a, b) => b.rem - a.rem)) { if (left-- > 0) r.q++; }
    /* A domain with fewer eligible items than its quota gives what it has; the
     * shortfall is reported rather than silently redistributed, because moving it
     * elsewhere would quietly de-stratify the sample. */
    const chosen = [];
    const short = [];
    for (const r of rows) {
      const shuffled = [...r.inD].sort((a, b) => a.id.localeCompare(b.id));
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const take = shuffled.slice(0, r.q);
      chosen.push(...take.map((x) => ({ ...x, domain: r.d.code })));
      if (take.length < r.q) short.push(r.d.code + " gave " + take.length + " of " + r.q);
    }
    summary.push({ cert: c.code, eligible: mine.length, sampled: chosen.length, short });
    all.push({ cert: c, chosen, rows });
  }

  console.log("  cert        eligible  sampled  shortfalls");
  for (const s of summary) {
    console.log("  " + s.cert.padEnd(11) + String(s.eligible).padStart(8) +
      String(s.sampled).padStart(9) + "  " + (s.short.length ? s.short.join("; ") : "none"));
  }

  L.push("| cert | eligible | sampled | domain shortfalls |");
  L.push("|---|---|---|---|");
  for (const s of summary) {
    L.push("| " + s.cert + " | " + s.eligible + " | **" + s.sampled + "** | " +
      (s.short.length ? s.short.join("; ") : "none") + " |");
  }
  L.push("| **total** | " + summary.reduce((a, b) => a + b.eligible, 0) +
    " | **" + summary.reduce((a, b) => a + b.sampled, 0) + "** | |");
  L.push("");

  const esc = (s) => String(s == null ? "" : s).replace(/\r/g, "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  let n = 0;
  for (const { cert, chosen } of all) {
    L.push("---");
    L.push("");
    L.push("# " + cert.code + " — " + cert.name);
    L.push("");
    L.push("**Source this certification cites:** " + (SOURCE[cert.code] || "not recorded"));
    L.push("");
    L.push("**The audit question for every item below:** is the key right *against that");
    L.push("source*, and does the explanation justify it with something the source actually");
    L.push("says?");
    L.push("");
    for (const q of chosen.sort((a, b) => a.domain.localeCompare(b.domain)
      || String((taskBy.get(a.task_id) || {}).code).localeCompare(String((taskBy.get(b.task_id) || {}).code)))) {
      n++;
      const t = taskBy.get(q.task_id);
      const keys = new Set(Array.isArray(q.correct_answer) ? q.correct_answer : []);
      L.push("### " + n + ". " + cert.code + " · " + q.domain + " · " +
        (t ? "task " + t.code : "no task") + " · `" + q.id.slice(0, 8) + "`");
      L.push("");
      if (t) L.push("> " + esc(t.statement).slice(0, 220));
      L.push("");
      L.push("**" + esc(q.question_text) + "**");
      L.push("");
      for (const o of Array.isArray(q.options) ? q.options : []) {
        L.push("- " + (keys.has(o.id) ? "**`KEY` " : "") + o.id + ") " + esc(o.text) +
          (keys.has(o.id) ? "**" : ""));
      }
      L.push("");
      L.push("*explanation:* " + esc(q.explanation));
      L.push("");
    }
  }

  const path = join(ROOT, "AUDIT-SAMPLE.md");
  writeFileSync(path, L.join("\n") + "\n", "utf8");
  console.log("");
  console.log("  items rendered  " + n);
  console.log("wrote " + path);
} finally { release(); }
