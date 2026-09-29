#!/usr/bin/env node
/**
 * scope-damaged-primaries.mjs -- which damaged passages are PRIMARY for a task of the four ISO
 * certifications. Ruled PROMPT-88 s1: print this list and its count first; the rest wait.
 *
 * READ-ONLY, no writes beyond one artifact, no model calls, unknown flags exit 2.
 *
 * ============ WHY THIS IS THE SCOPE AND NOT THE 125 ============
 *
 * A damaged passage only costs us where an item can anchor in it. A damaged SUPPORTING passage feeds a
 * distractor's reason and an explanation; a damaged passage nobody links to costs nothing at all. Scoping
 * the repair to primaries makes it a bounded job instead of a re-extraction of nine documents.
 *
 * The count is also the decision: if it is small the fallback (per-passage overrides) is cheaper than
 * fixing the extractor, and if it is zero the repair is off the rollout's path entirely.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const CERTS = ["AIMS-F", "AIMS-IA", "ISMS-F", "ISMS-IA"];
const census = JSON.parse(readFileSync(join(ROOT, "EXTRACTION-NOISE-CENSUS.json"), "utf8"));
const damaged = new Map();
for (const d of census.damaged) damaged.set(d.source + "|" + d.clause, d.signatures);

const KEY = requireKey(HERE);
const certs = (await getAll(KEY, "certifications?select=id,code&order=code")).filter((c) => CERTS.includes(c.code));
const certIds = new Set(certs.map((c) => c.id));
const codeOfCert = new Map(certs.map((c) => [c.id, c.code]));
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code&order=code"))
  .filter((t) => certIds.has(t.certification_id));
const taskInfo = new Map(tasks.map((t) => [t.id, { code: t.code, cert: codeOfCert.get(t.certification_id) }]));
const sp = await getAll(KEY, "source_passages?select=id,source_id,edition,clause,title&order=id");
const passageById = new Map(sp.map((p) => [p.id, p]));
const ts = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id,passage_id");

const rows = new Map();   /* source|clause -> { signatures, primaryFor:[], supportingFor:[] } */
for (const r of ts) {
  const t = taskInfo.get(r.task_id);
  if (!t) continue;
  const p = passageById.get(r.passage_id);
  if (!p) continue;
  const k = p.source_id + "|" + p.clause;
  const sig = damaged.get(k);
  if (!sig) continue;                       /* clean, or not in the census (a container) */
  if (!rows.has(k)) rows.set(k, { source: p.source_id, clause: p.clause, title: p.title,
    signatures: sig, primaryFor: [], supportingFor: [] });
  rows.get(k)[r.role === "primary" ? "primaryFor" : "supportingFor"].push(t.cert + " " + t.code);
}
const inScope = [...rows.values()].filter((r) => r.primaryFor.length);
const supportingOnly = [...rows.values()].filter((r) => !r.primaryFor.length);

inScope.sort((a, b) => b.primaryFor.length - a.primaryFor.length ||
  a.source.localeCompare(b.source) || String(a.clause).localeCompare(String(b.clause), undefined, { numeric: true }));

const md = [];
const p = (s = "") => md.push(s);
p("# Damaged passages that are PRIMARY for a task of the four ISO certifications");
p("");
p("**Read-only.** Ruled PROMPT-88 s1: this is the repair's scope; the remaining damaged passages wait.");
p("");
p("A damaged passage only costs us where an item can ANCHOR in it. A damaged supporting passage feeds a");
p("distractor's reason; a damaged passage nobody links to costs nothing.");
p("");
p("**" + inScope.length + " passage(s) in scope**, against " + census.totals.damaged +
  " damaged in the library and " + supportingOnly.length + " damaged-but-supporting-only.");
p("");
if (inScope.length) {
  p("| source | clause | signatures | primary for | also supporting for |");
  p("|---|---|---|---|---|");
  for (const r of inScope) {
    p("| " + String(r.source).replace("ISO/IEC ", "") + " | `" + r.clause + "` | " +
      r.signatures.join(", ") + " | " + r.primaryFor.join(", ") + " | " +
      (r.supportingFor.join(", ") || "-") + " |");
  }
} else {
  p("**None.** No damaged passage is primary for any task of the four ISO certifications, so the repair");
  p("is off the rollout's critical path entirely.");
}
p("");
p("## Damaged and supporting only (" + supportingOnly.length + ")");
p("");
p("Not in scope: a supporting passage cannot carry a key, so noise there reaches a distractor's recorded");
p("reason and an explanation, never an anchor.");
p("");
for (const r of supportingOnly.slice(0, 30)) {
  p("- " + String(r.source).replace("ISO/IEC ", "") + " `" + r.clause + "` -- " + r.signatures.join(", ") +
    " -- supporting for " + r.supportingFor.slice(0, 4).join(", ") + (r.supportingFor.length > 4 ? " ..." : ""));
}
p("");
writeFileSync(join(ROOT, "DAMAGED-PRIMARIES.md"), md.join("\n") + "\n", "utf8");
writeFileSync(join(ROOT, "DAMAGED-PRIMARIES.json"), JSON.stringify({
  certs: CERTS, in_scope: inScope, supporting_only: supportingOnly,
  library_damaged_total: census.totals.damaged,
}, null, 1) + String.fromCharCode(10), "utf8");

console.log("damaged in the library      " + census.totals.damaged);
console.log("damaged AND linked          " + rows.size);
console.log("  primary for a task        " + inScope.length + "   <- the repair's scope");
console.log("  supporting only           " + supportingOnly.length);
console.log("");
for (const r of inScope) {
  console.log("  " + String(r.source).replace("ISO/IEC ", "").padEnd(12) + String(r.clause).padEnd(10) +
    r.signatures.join(",").padEnd(38) + r.primaryFor.slice(0, 5).join(" "));
}
console.log("\nwrote DAMAGED-PRIMARIES.md and .json");
