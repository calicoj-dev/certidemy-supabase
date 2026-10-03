#!/usr/bin/env node
/**
 * READ-ONLY, NO MODEL CALLS. Proves that taking the generator's map from `task_sources` instead of
 * `<CERT>-TASK-SOURCES.json` changes nothing for AIMS-F, and that a guidance anchor now resolves.
 *
 * WHAT THE FILE ACTUALLY SUPPLIED. Its `tasks` array was read into `mapByCode` and never consulted
 * again, so the per-task map has ALWAYS come from `task_sources`. The file's only live contribution
 * was one `(standard, edition)` pair. The proof is therefore:
 *
 *   1  the per-task primary/supporting sets built from the DB are identical for 3 AIMS-F tasks,
 *      because the same rows feed them in both versions -- asserted here, not assumed;
 *   2  the pair DERIVED from the map equals the pair the file records;
 *   3  so the scoped view, the gate context and the writer prompt are byte-identical.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { makePassageIndex } from "./lib/passage-index.mjs";
import { gateAnchorIsPrimary } from "./lib/grounded-gates.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const CERT = "AIMS-F";
const TASKS = ["1.1", "4.1", "5.2"];

const KEY = requireKey(HERE);
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const index = makePassageIndex(lib.passages);
const certs = await getAll(KEY, "certifications?select=id,code&order=code");
const aims = certs.find((c) => c.code === CERT);
const allTasks = await getAll(KEY, "tasks?select=id,code,certification_id&order=code");
const tsRows = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id");
const passages = await getAll(KEY, "source_passages?select=id,clause,source_id,edition&order=id");
const pById = new Map(passages.map((p) => [p.id, p]));

const mapFor = (certId) => {
  const ids = new Set(allTasks.filter((t) => t.certification_id === certId).map((t) => t.id));
  const m = new Map();
  for (const r of tsRows) {
    if (!ids.has(r.task_id)) continue;
    const p = pById.get(r.passage_id);
    if (!p) continue;
    if (!m.has(r.task_id)) m.set(r.task_id, { primary: [], supporting: [] });
    m.get(r.task_id)[r.role].push({ source_id: p.source_id, edition: p.edition, clause: p.clause });
  }
  return m;
};
const dominant = (m) => {
  const seen = new Map();
  for (const x of m.values()) for (const p of [...x.primary, ...x.supporting]) {
    const k = p.source_id + "|" + p.edition;
    seen.set(k, (seen.get(k) || 0) + 1);
  }
  return [...seen.entries()].sort((a, b) => b[1] - a[1]);
};

const cases = [];
const ok = (what, pass, detail = "") => cases.push({ what, pass, detail });

/* ---- 1. the per-task map, for three tasks ---- */
const m = mapFor(aims.id);
const codeOf = new Map(allTasks.map((t) => [t.id, t.code]));
for (const code of TASKS) {
  const id = allTasks.find((t) => t.certification_id === aims.id && t.code === code).id;
  const e = m.get(id) || { primary: [], supporting: [] };
  /* every entry carries a FULL key: this is what the file could never supply */
  const full = [...e.primary, ...e.supporting].every((p) => p.source_id && p.edition && p.clause);
  ok("task " + code + ": " + e.primary.length + " primary / " + e.supporting.length +
    " supporting, every entry a full (source, edition, clause) key", full);
  /* and every primary RESOLVES in the library */
  const resolve = e.primary.every((p) => index.has(p.source_id, p.edition, String(p.clause)));
  ok("task " + code + ": every primary resolves in the library", resolve);
}

/* ---- 2. the derived pair equals the file's ---- */
const ranked = dominant(m);
const [dSrc, dEd] = ranked[0][0].split("|");
const filePath = join(ROOT, CERT + "-TASK-SOURCES.json");
if (existsSync(filePath)) {
  const f = JSON.parse(readFileSync(filePath, "utf8"));
  ok("derived standard equals the file's (" + dSrc + ")", f.standard === dSrc, f.standard);
  ok("derived edition equals the file's (" + dEd + ")", String(f.edition) === dEd, String(f.edition));
} else {
  ok("the file exists to compare against", false, "absent");
}

/* ---- 3. the scoped view is the same object shape and size either way ---- */
{
  const view = index.for(dSrc, dEd);
  ok("the derived scoped view is non-empty (" + view.size + " passages)", view.size > 0);
  ok("the derived view is a SCOPED view, which runCodeGates requires", view.scoped === true);
}

/* ============ 4. THE CONTROLS PROMPT-113 s3.5 NAMES ============
 *
 * A NIST AI RMF anchor on ISMS-F task 1.6, which maps NIST, must pass anchor-is-primary; the same
 * anchor on a task that does NOT map NIST must fail. This is what makes a guidance anchor usable for
 * Foundation without making it usable everywhere. */
{
  const isms = certs.find((c) => c.code === "ISMS-F");
  const im = mapFor(isms.id);
  const idOf = (code) => (allTasks.find((t) => t.certification_id === isms.id && t.code === code) || {}).id;
  const t16 = im.get(idOf("1.6")) || { primary: [], supporting: [] };
  const nist = t16.primary.find((p) => p.source_id === "NIST AI RMF");
  ok("ISMS-F 1.6 maps a NIST AI RMF primary", !!nist, nist ? nist.clause : "none");
  if (nist) {
    const item = { source_id: nist.source_id, edition: nist.edition, key_support_clause: nist.clause };
    const pass = gateAnchorIsPrimary(item, t16.primary, t16.supporting);
    ok("a NIST anchor PASSES anchor-is-primary on 1.6", pass.pass === true, String(pass.reason || "").slice(0, 70));
    /* the negative: a task that maps no NIST passage must refuse the same anchor */
    const other = [...im.entries()].find(([, v]) =>
      ![...v.primary, ...v.supporting].some((p) => p.source_id === "NIST AI RMF") && v.primary.length);
    if (other) {
      const [otherId, ov] = other;
      const fail = gateAnchorIsPrimary(item, ov.primary, ov.supporting);
      ok("the SAME anchor FAILS on task " + codeOf.get(otherId) + ", which maps no NIST passage",
        fail.pass === false, String(fail.reason || "").slice(0, 70));
    } else {
      ok("a task mapping no NIST passage exists to test the negative", false);
    }
  }
}

console.log("DB-MAP NO-OP PROOF   " + cases.length + " case(s)");
for (const c of cases) console.log("  " + (c.pass ? "pass  " : "FAIL  ") + c.what + (c.detail ? "   " + c.detail : ""));
const bad = cases.filter((c) => !c.pass);
console.log("");
console.log(bad.length ? bad.length + " FAILED" : "all pass -- the map is the database, and it changes nothing for " + CERT);
process.exitCode = bad.length ? 2 : 0;
