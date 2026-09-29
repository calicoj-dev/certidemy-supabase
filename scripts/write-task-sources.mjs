#!/usr/bin/env node
/**
 * write-task-sources.mjs -- turn the judged proposals into `task_sources`, under the director's rules.
 *
 * DRY BY DEFAULT. `--apply` writes. Unknown flags exit 2.
 *
 * ============ THE RULES, VERBATIM FROM THE RULING ============
 *
 *  1. ROLE: high or medium confidence becomes `primary`, low becomes `supporting`.
 *  2. ISO/IEC 17021-1 and 42006 are primary ONLY where the task statement is about certification,
 *     certification bodies or the certification cycle; otherwise supporting. 17021-1 CLAUSE 10 -- the
 *     CB's own management system -- is DROPPED entirely unless the task is about a CB's management
 *     system. That removes the ISMS-F 5.2, 5.3 and 5.4 links to 10.2.x.
 *  3. ISO/IEC 42001 Annex B, and the 27001/27002 clause 0.x introductions, are `supporting`.
 *  4. ISMS-F 2.2: the high-confidence 4.1 and 4.2 resolve to the 2022 BASE edition, the medium pair
 *     to Amd1.
 *  6. AIMS-F: keep the reviewed links as they are, and add the judge's proposals that are not already
 *     linked as `supporting`.
 *
 * Rows are tagged `added_by = "judged 2026-09-29, director sample read"`. There is no `provenance`
 * column on this table and none is added: `added_by` is text, NOT NULL, and already carries exactly
 * this kind of tag -- every existing row reads `director ruling 2026-09-26`.
 *
 * ============ THE SUBJECT TEST IS LEXICAL, SO IT IS PRINTED AND NOT TRUSTED ============
 *
 * Rule 2 turns on whether a task statement is "about certification". That is a judgement rendered as
 * a word list, which is the lexical-proxy trap this repository has paid for repeatedly -- a detector
 * keyed on words standing in for a property it cannot see.
 *
 * So the classification is not hidden inside the run. Every task carrying a 17021-1 or 42006 proposal
 * is printed with its statement and its verdict, in the dry run, before anything is written. If a
 * verdict is wrong it is wrong where you can see it.
 *
 * ============ AND A ROW ALREADY LINKED IS NEVER TOUCHED ============
 *
 * The primary key is (task_id, passage_id), so one row per pair. An existing link is SKIPPED rather
 * than upserted: "keep the 150 reviewed links as they are" means this script must not be able to
 * change a role a human set, and the cheapest way to guarantee that is to insert only what is absent.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { standardsFor } from "./lib/iso-cert-standards.mjs";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". DRY BY DEFAULT; --apply to write.");
    console.error("NOTE: some scripts here take --dry and are LIVE without it. This is not one.");
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const ADDED_BY = "judged 2026-09-29, director sample read";
const CERTS = ["AIMS-F", "ISMS-F", "ISMS-IA", "AIMS-IA"];
const CB_SOURCES = new Set(["ISO/IEC 17021-1", "ISO/IEC 42006"]);

/* ============ THE TWO LEXICAL PREDICATES ============
 * Both are printed per task in the dry run. `aboutCertification` is deliberately broad -- it decides
 * primary vs supporting, and the safe error is supporting. `aboutCbManagementSystem` is deliberately
 * narrow -- it decides whether a clause survives at all, and the safe error is dropping. */
/* ============ `audit programme` WAS IN HERE AND IT WAS WRONG ============
 *
 * The first version included a bare `audit programme`, and printing the verdicts caught it
 * immediately: it made **ISMS-F 5.2, "Explain the internal audit programme and its purpose"** a
 * certification subject, along with AIMS-IA 1.5, 2.1 and 2.4 -- all of which are about the
 * ORGANISATION'S OWN internal audit programme under clause 9.2, not about certification.
 *
 * The ruling says "certification, certification bodies or the certification cycle". An internal audit
 * programme is none of the three. Removed, and `certification audit` kept as the one phrase where an
 * audit really is the certification one.
 *
 * This is the lexical-proxy trap arriving on schedule, and the only reason it is a corrected regex
 * rather than 30 wrongly-primary rows is that the verdicts are printed before anything is written. */
const CERT_SUBJECT = /\b(certification|certifying|certified|certificate|accreditation|accredited|certification body|certification bodies|surveillance\s+audit|recertification|stage\s*[12]|three[-\s]?year)\b/i;
const CB_MS_SUBJECT = /\b(certification body'?s?\s+(own\s+)?management\s+system|impartiality\s+committee|competence\s+of\s+(the\s+)?certification\s+body)\b/i;

{
  const fails = [];
  if (!CERT_SUBJECT.test("Recognize the certification process - stage 1, stage 2, surveillance")) {
    fails.push("the certification subject test missed an obviously certification task");
  }
  if (CERT_SUBJECT.test("Explain awareness and communication requirements")) {
    fails.push("the certification subject test fired on an unrelated task");
  }
  /* the live false positive: an INTERNAL audit programme is not the certification cycle */
  if (CERT_SUBJECT.test("Explain the internal audit programme and its purpose.")) {
    fails.push("`audit programme` is back: an internal audit programme is not a certification subject");
  }
  if (!CERT_SUBJECT.test("Distinguish certification from accreditation, and the roles of the certification body")) {
    fails.push("the test missed a plainly certification task");
  }
  if (CB_MS_SUBJECT.test("Apply nonconformity and corrective action")) {
    fails.push("the CB-management-system test fired on an ordinary clause-10 task");
  }
  if (!CB_MS_SUBJECT.test("Audit the certification body's own management system")) {
    fails.push("the CB-management-system test missed its own subject");
  }
  console.log("subject-test controls: 6 case(s), " + fails.length + " fail");
  if (fails.length) { fails.forEach((f) => console.error("   " + f)); process.exit(3); }
}

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };

const certRows = await getAll(KEY, "certifications?select=id,code&order=code");
const idOf = new Map(certRows.map((c) => [c.code, c.id]));
const allTasks = await getAll(KEY, "tasks?select=id,certification_id,code,statement&order=code");
const sp = await getAll(KEY, "source_passages?select=id,source_id,edition,clause,title&order=id");
const existing = await getAll(KEY, "task_sources?select=task_id,passage_id,role,added_by&order=task_id");
const already = new Set(existing.map((r) => r.task_id + "|" + r.passage_id));

/* (source, clause) -> passages, so an address held in two editions can be resolved by edition */
const byAddr = new Map();
for (const p of sp) {
  const k = p.source_id + "|" + p.clause;
  if (!byAddr.has(k)) byAddr.set(k, []);
  byAddr.get(k).push(p);
}

/* ---------------------------------------------------------------- build the plan */
const plan = [];
const dropped = [];
const unresolved = [];
const subjectVerdicts = [];
const notes = [];

for (const cert of CERTS) {
  const f = join(ROOT, "TASK-SOURCE-PROPOSALS2-" + cert + ".json");
  if (!existsSync(f)) { console.error("missing " + f); process.exit(2); }
  const j = JSON.parse(readFileSync(f, "utf8"));
  const std = new Set(standardsFor(cert));
  const tasks = allTasks.filter((t) => t.certification_id === idOf.get(cert));
  const byCode = new Map(tasks.map((t) => [t.code, t]));

  for (const r of j.results || []) {
    const task = byCode.get(r.task);
    if (!task) { notes.push(cert + " " + r.task + ": no such task"); continue; }
    const isCertSubject = CERT_SUBJECT.test(String(task.statement || ""));
    const isCbMs = CB_MS_SUBJECT.test(String(task.statement || ""));

    for (const x of r.primary || []) {
      if (!std.has(x.source)) { notes.push(cert + " " + r.task + ": " + x.source + " out of scope"); continue; }

      /* ---- rule 1: the base role ---- */
      let role = (x.confidence === "low") ? "supporting" : "primary";
      let why = "confidence " + (x.confidence || "?");

      /* ---- rule 2a: 17021-1 clause 10 is dropped unless the task is about a CB's own MS ---- */
      if (x.source === "ISO/IEC 17021-1" && /^10(\.|$)/.test(x.clause) && !isCbMs) {
        dropped.push({ cert, task: r.task, source: x.source, clause: x.clause,
          why: "17021-1 clause 10 is the certification body's own management system" });
        continue;
      }
      /* ---- rule 2b: CB standards are primary only on a certification task ---- */
      if (CB_SOURCES.has(x.source) && !isCertSubject && role === "primary") {
        role = "supporting";
        why += "; " + x.source.replace("ISO/IEC ", "") + " on a non-certification task";
      }
      /* ---- rule 3: 42001 Annex B and the 27001/27002 clause 0.x introductions ---- */
      if (x.source === "ISO/IEC 42001" && /^B(\.|$)/.test(x.clause) && role === "primary") {
        role = "supporting"; why += "; 42001 Annex B is guidance";
      }
      if ((x.source === "ISO/IEC 27001" || x.source === "ISO/IEC 27002") && /^0(\.|$)/.test(x.clause) &&
          role === "primary") {
        role = "supporting"; why += "; clause 0.x is an introduction";
      }

      /* ---- rule 4: ISMS-F 2.2 resolves 4.1 and 4.2 by edition ---- */
      const cands = byAddr.get(x.source + "|" + x.clause) || [];
      let passage = null;
      if (!cands.length) {
        unresolved.push(cert + " " + r.task + ": " + x.source + " " + x.clause + " not in source_passages");
        continue;
      }
      if (cands.length === 1) passage = cands[0];
      else if (cert === "ISMS-F" && r.task === "2.2" && x.source === "ISO/IEC 27001" &&
               (x.clause === "4.1" || x.clause === "4.2")) {
        const wantAmd = x.confidence === "medium";
        passage = cands.find((c) => wantAmd === /Amd/i.test(String(c.edition || "")));
        why += "; edition " + (passage ? passage.edition : "?") + " by confidence (rule 4)";
      } else {
        /* any other two-edition address: the BASE edition, and the choice is recorded */
        passage = cands.find((c) => !/Amd/i.test(String(c.edition || ""))) || cands[0];
        why += "; base edition chosen from " + cands.length + " editions";
      }
      if (!passage) {
        unresolved.push(cert + " " + r.task + ": " + x.source + " " + x.clause + " no edition matched");
        continue;
      }

      /* ---- AIMS-F: never disturb a reviewed link; anything new is supporting (rule 6) ---- */
      if (cert === "AIMS-F") {
        if (already.has(task.id + "|" + passage.id)) continue;   /* keep the reviewed links as they are */
        role = "supporting";
        why = "AIMS-F: judge proposal not in the reviewed set (rule 6)";
      } else if (already.has(task.id + "|" + passage.id)) {
        continue;
      }

      plan.push({ cert, task: r.task, task_id: task.id, passage_id: passage.id,
        source: x.source, clause: x.clause, edition: passage.edition, role, why,
        confidence: x.confidence || "?" });
    }
    if (CB_SOURCES.has("x") === false && (r.primary || []).some((x) => CB_SOURCES.has(x.source))) {
      subjectVerdicts.push({ cert, task: r.task, isCertSubject, isCbMs,
        statement: String(task.statement || "").slice(0, 110) });
    }
  }
}

/* one row per (task, passage): a later proposal must not silently overwrite an earlier role */
const seen = new Map();
const collisions = [];
for (const p of plan) {
  const k = p.task_id + "|" + p.passage_id;
  if (seen.has(k)) {
    const first = seen.get(k);
    /* primary wins over supporting -- the stronger claim, and the ruling assigns by confidence */
    if (first.role === "supporting" && p.role === "primary") { first.role = "primary"; first.why += "; upgraded by a second proposal"; }
    collisions.push(p.cert + " " + p.task + " " + p.source + " " + p.clause);
    continue;
  }
  seen.set(k, p);
}
const rows = [...seen.values()];

/* ---------------------------------------------------------------- report */
console.log("");
console.log("THE CERTIFICATION-SUBJECT VERDICTS -- lexical, so printed rather than trusted");
console.log("");
for (const v of subjectVerdicts.sort((a, b) => a.cert.localeCompare(b.cert) ||
  a.task.localeCompare(b.task, undefined, { numeric: true }))) {
  console.log("  " + (v.isCertSubject ? "CERT   " : "not    ") + (v.isCbMs ? "CB-MS  " : "       ") +
    v.cert + " " + v.task.padEnd(5) + v.statement);
}

console.log("");
console.log("DROPPED BY RULE 2a -- 17021-1 clause 10, the CB's own management system: " + dropped.length);
for (const d of dropped) console.log("    " + d.cert + " " + d.task + "  " + d.clause);

console.log("");
console.log("COUNTS PER CERTIFICATION AND ROLE");
console.log("");
console.log("  cert       primary   supporting   total   (existing rows untouched)");
const tally = {};
for (const r of rows) {
  tally[r.cert] = tally[r.cert] || { primary: 0, supporting: 0 };
  tally[r.cert][r.role]++;
}
for (const c of CERTS) {
  const t = tally[c] || { primary: 0, supporting: 0 };
  const ex = existing.filter((e) => allTasks.some((k) => k.id === e.task_id &&
    k.certification_id === idOf.get(c))).length;
  console.log("  " + c.padEnd(10) + String(t.primary).padStart(7) + String(t.supporting).padStart(13) +
    String(t.primary + t.supporting).padStart(8) + "   " + ex);
}
console.log("  " + "TOTAL".padEnd(10) + String(rows.filter((r) => r.role === "primary").length).padStart(7) +
  String(rows.filter((r) => r.role === "supporting").length).padStart(13) +
  String(rows.length).padStart(8));

if (collisions.length) {
  console.log("");
  console.log("  " + collisions.length + " duplicate (task, passage) proposal(s) folded into one row " +
    "(primary wins): " + collisions.slice(0, 6).join(", "));
}
if (unresolved.length) {
  console.log("");
  console.log("  UNRESOLVED, not written: " + unresolved.length);
  for (const u of unresolved.slice(0, 10)) console.log("    " + u);
}
if (notes.length) {
  console.log("");
  console.log("  notes: " + notes.length);
  for (const n of notes.slice(0, 8)) console.log("    " + n);
}

/* zero-primary tasks, BEFORE and after -- the figure the ruling asks to confirm with */
const zeroPrimary = (linkRows) => {
  const out = {};
  for (const c of CERTS) {
    const tasks = allTasks.filter((t) => t.certification_id === idOf.get(c));
    const withPrimary = new Set(linkRows.filter((r) => r.role === "primary").map((r) => r.task_id));
    out[c] = tasks.filter((t) => !withPrimary.has(t.id)).length + " of " + tasks.length;
  }
  return out;
};
console.log("");
console.log("  tasks with ZERO primary, BEFORE: " + JSON.stringify(zeroPrimary(existing)));
console.log("  tasks with ZERO primary, if applied: " +
  JSON.stringify(zeroPrimary([...existing, ...rows])));

writeFileSync(join(ROOT, "TASK-SOURCES-PLAN.json"), JSON.stringify({
  added_by: ADDED_BY, rows: rows.length, dropped, unresolved, notes,
  subject_verdicts: subjectVerdicts, plan: rows,
}, null, 1) + String.fromCharCode(10), "utf8");
console.log("");
console.log("  wrote TASK-SOURCES-PLAN.json -- the enumeration, not just the count");

if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

/* ---------------------------------------------------------------- write */
const beforeHash = createHash("sha256").update(existing
  .sort((a, b) => (a.task_id + a.passage_id).localeCompare(b.task_id + b.passage_id))
  .map((r) => r.task_id + "|" + r.passage_id + "|" + r.role + "|" + r.added_by).join("\n"))
  .digest("hex").slice(0, 16);
console.log("");
console.log("APPLYING...   existing-row checksum " + beforeHash + " over " + existing.length + " row(s)");

const CH = 200;
let wrote = 0;
for (let i = 0; i < rows.length; i += CH) {
  const batch = rows.slice(i, i + CH).map((r) => ({ task_id: r.task_id, passage_id: r.passage_id,
    role: r.role, added_by: ADDED_BY }));
  const res = await fetch(REST_URL + "/task_sources", { method: "POST",
    headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify(batch) });
  if (!res.ok) {
    console.error("INSERT FAILED at offset " + i + ": " + res.status + " " +
      (await res.text()).slice(0, 220));
    console.error("  " + wrote + " row(s) were written before this.");
    process.exitCode = 4; process.exit();
  }
  wrote += batch.length;
}
console.log("  inserted " + wrote + " row(s)");

/* ---------------------------------------------------------------- read back */
console.log("");
console.log("READ-BACK");
let fail = 0;
const ok = (l, c, d) => { console.log("  " + (c ? "PASS  " : "FAIL  ") + l + (d ? "   " + d : "")); if (!c) fail++; };
const after = await getAll(KEY, "task_sources?select=task_id,passage_id,role,added_by&order=task_id");
ok("row count grew by exactly what was planned", after.length === existing.length + rows.length,
  existing.length + " + " + rows.length + " = " + after.length);
const mineBack = after.filter((r) => r.added_by === ADDED_BY);
ok("every new row carries the provenance tag", mineBack.length === rows.length,
  mineBack.length + " of " + rows.length);
const byPair = new Map(after.map((r) => [r.task_id + "|" + r.passage_id, r]));
ok("every planned row is present with its planned role",
  rows.every((r) => (byPair.get(r.task_id + "|" + r.passage_id) || {}).role === r.role));
const exAfter = after.filter((r) => r.added_by !== ADDED_BY);
const afterHash = createHash("sha256").update(exAfter
  .sort((a, b) => (a.task_id + a.passage_id).localeCompare(b.task_id + b.passage_id))
  .map((r) => r.task_id + "|" + r.passage_id + "|" + r.role + "|" + r.added_by).join("\n"))
  .digest("hex").slice(0, 16);
ok("every pre-existing row is byte-identical", afterHash === beforeHash, afterHash);
/* the negative half of rule 2a */
const spById = new Map(sp.map((p) => [p.id, p]));
const bad10 = after.filter((r) => {
  const p = spById.get(r.passage_id);
  return p && p.source_id === "ISO/IEC 17021-1" && /^10(\.|$)/.test(p.clause) && r.added_by === ADDED_BY;
});
ok("no 17021-1 clause 10 row was written", bad10.length === 0, String(bad10.length));

console.log("");
console.log("ZERO-PRIMARY TASKS PER CERTIFICATION, after");
for (const c of CERTS) {
  const tasks = allTasks.filter((t) => t.certification_id === idOf.get(c));
  const withPrimary = new Set(after.filter((r) => r.role === "primary").map((r) => r.task_id));
  const zero = tasks.filter((t) => !withPrimary.has(t.id));
  console.log("  " + c.padEnd(10) + zero.length + " of " + tasks.length +
    (zero.length ? "   [" + zero.map((t) => t.code).join(" ") + "]" : ""));
}
console.log("");
if (fail) { console.error(fail + " read-back failure(s)."); process.exitCode = 1; }
else console.log("Applied " + wrote + " row(s). Existing rows untouched.");
