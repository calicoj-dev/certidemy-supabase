#!/usr/bin/env node
/**
 * Insert ruled (task, passage, role) rows into `task_sources`. WRITES with `--apply`; dry by default.
 *
 * THE SPEC IS DECLARED, by clause, and every clause must RESOLVE to a held passage before anything is
 * written. A clause that does not resolve is named and the whole batch refuses: a map with a silently
 * dropped row is a map whose floor derivation is wrong.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
let APPLY = false, CERT = "ISMS-F";
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  const m = a.match(/^--cert(?:=(.+))?$/);
  if (m) { CERT = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=<CODE>, --apply (dry by default).");
  process.exit(2);
}

/* ============ THE SPEC, ruled PROMPT-111 s2 ============ */
/* EDITION IS PART OF THE ADDRESS. 27001 4.1 and 4.2 exist twice -- `2022` and `2022/Amd1:2024`, the
 * climate-change amendment -- and a two-part address resolved to both and refused, which is what the
 * (source, edition, clause) key is for. */
const SPEC = [
  { task: "1.6", role: "primary", ruled: "PROMPT-111 s2", clauses: [
    ["EU AI Act", "2024/1689", "Recital 133"], ["EU AI Act", "2024/1689", "Recital 110"],
    ["EU AI Act", "2024/1689", "Recital 111"], ["EU AI Act", "2024/1689", "Art. 55(1)"],
    ["NIST AI RMF", "1.0", "MANAGE 4.3"], ["NIST AI RMF", "1.0", "MAP 5.1"],
  ] },
  /* 42001 A.6 is NOT held: it is a container heading whose children carry the text (A.6.1, A.6.2.x).
   * Ruled "add it if it matches" -- it does not resolve, so it is left out and reported. */
  { task: "1.7", role: "primary", ruled: "PROMPT-111 s2", clauses: [
    ["ISO/IEC 27002", "2022", "7.1"], ["ISO/IEC 27002", "2022", "8.15"],
    ["NIST AI RMF", "1.0", "MANAGE 4.3"],
  ] },
  /* BEYOND THE RULING, and flagged: task 2.3 IS the climate-change amendment, so it is mapped to the
   * Amd1:2024 rows rather than only to the 2022 clauses they amend. */
  { task: "2.3", role: "primary", ruled: "PROMPT-111 s2 (edition added beyond the ruling)", clauses: [
    ["ISO/IEC 27001", "2022/Amd1:2024", "4.1"], ["ISO/IEC 27001", "2022/Amd1:2024", "4.2"],
  ] },
  { task: "2.4", role: "primary", ruled: "PROMPT-111 s2", clauses: [
    ["ISO/IEC 27001", "2022", "4.1"], ["ISO/IEC 27001", "2022", "4.2"],
    ["ISO/IEC 27001", "2022", "7.5.1"],
  ] },
  /* 27001 A.5-A.8 theme HEADINGS are not held either -- only the controls beneath them. Task 4.1 keeps
   * its 27002 4.1/4.2 primaries, which are the clauses that actually describe the four themes. */
  { task: "5.9", role: "primary", ruled: "PROMPT-111 s2", clauses: [
    ["ISO/IEC 42001", "2023", "D.1"], ["ISO/IEC 42001", "2023", "D.2"],
  ] },
];

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("No certification " + CERT); process.exit(2); }
const tasks = (await getAll(KEY, "tasks?select=id,code,certification_id&order=code"))
  .filter((t) => t.certification_id === cert.id);
const byCode = new Map(tasks.map((t) => [t.code, t]));
const passages = await getAll(KEY, "source_passages?select=id,clause,source_id,edition,normative&order=id");
const existing = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id");
const have = new Set(existing.map((r) => r.task_id + "|" + r.passage_id));

const plan = [], unresolved = [];
console.log("MAP TASK SOURCES   " + CERT + (APPLY ? "   --apply" : "   dry run (default)"));
for (const s of SPEC) {
  const t = byCode.get(s.task);
  if (!t) { unresolved.push(s.task + ": no such task"); continue; }
  console.log("");
  console.log("  task " + s.task + "   " + s.role + "   " + s.clauses.length + " clause(s) ruled");
  for (const [src, ed, cl] of s.clauses) {
    const hits = passages.filter((p) => p.source_id === src && String(p.edition) === ed && String(p.clause) === cl);
    if (hits.length !== 1) {
      console.log("    " + src.padEnd(16) + cl.padEnd(14) + "UNRESOLVED -> " + hits.length + " passage(s)");
      unresolved.push(s.task + ": " + src + " " + ed + " " + cl + " resolves to " + hits.length);
      continue;
    }
    const p = hits[0];
    const already = have.has(t.id + "|" + p.id);
    console.log("    " + src.padEnd(16) + cl.padEnd(14) + (p.normative || "?").padEnd(12) +
      (already ? "already mapped" : "WOULD ADD"));
    if (!already) plan.push({ t, p, role: s.role, ruled: s.ruled, src, cl });
  }
}
if (unresolved.length) {
  console.error("");
  console.error("REFUSING: " + unresolved.length + " ruled clause(s) do not resolve to exactly one held passage.");
  for (const u of unresolved) console.error("  " + u);
  console.error("Nothing written. A map with a silently dropped row derives the wrong floor.");
  process.exit(1);
}
console.log("");
console.log("  rows to add " + plan.length);
if (!APPLY) { console.log("\nDRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

let wrote = 0;
for (const x of plan) {
  const r = await fetch(REST_URL + "/task_sources", { method: "POST", headers: H,
    /* added_by is NOT NULL with no default: the ruling IS the provenance. */
    body: JSON.stringify({ task_id: x.t.id, passage_id: x.p.id, role: x.role, added_by: x.ruled }) });
  if (!r.ok) { console.error("  INSERT FAILED " + x.t.code + " " + x.src + " " + x.cl + "  " + (await r.text()).slice(0, 160)); continue; }
  wrote++;
}
const after = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id");
const nowHave = new Set(after.map((r) => r.task_id + "|" + r.passage_id));
let bad = 0;
for (const x of plan) if (!nowHave.has(x.t.id + "|" + x.p.id)) { console.error("  POST: " + x.t.code + " " + x.cl); bad++; }
/* the NEGATIVE half: no mapping outside the plan appeared or vanished */
const planKeys = new Set(plan.map((x) => x.t.id + "|" + x.p.id));
const strays = after.filter((r) => !have.has(r.task_id + "|" + r.passage_id) && !planKeys.has(r.task_id + "|" + r.passage_id)).length
  + existing.filter((r) => !nowHave.has(r.task_id + "|" + r.passage_id)).length;
console.log("");
console.log("  added " + wrote + " of " + plan.length + "   read-back failures " + bad + "   strays " + strays);
if (bad || strays || wrote !== plan.length) process.exitCode = 2;
