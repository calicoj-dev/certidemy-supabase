/**
 * Build the context `runCodeGates` needs, for any certification, from the library and the DB.
 * ONE implementation: regate-pilot, fix-102-conditionals and the recorder all had it inline and a
 * fourth copy would drift. Nothing certification-specific is hard-coded -- the standard and edition
 * come from the task map's own rows.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getAll } from "../_pg.mjs";
import { runCodeGates } from "./grounded-gates.mjs";
import { gateItemOf, id8 } from "./stored-item.mjs";
import { cueConfigFor } from "../../functions/_shared/item-rules/item-cue-guard.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");

/**
 * @param {string} key service-role key
 * @param {string} certCode e.g. "AIMS-F"
 * @param {{standard?:string, edition?:string}} [opts] override the inferred (source, edition)
 */
export async function buildGateContext(key, certCode, opts = {}) {
  const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
  const annexGaps = lib.annex_gaps || [];
  const sequenceGaps = lib.sequence_gaps || [];
  let declaredGaps = [];
  try {
    const compl = JSON.parse(readFileSync(join(ROOT, "LIBRARY-COMPLETENESS.json"), "utf8"));
    declaredGaps = (compl.sources || []).map((s) => ({ holes: s.missing || [] }));
  } catch { /* absent: a real-but-unheld clause is refused as absent, which is the safe direction */ }

  const cert = (await getAll(key, "certifications?select=id,code,exam_blueprint&code=eq." + certCode))[0];
  if (!cert) throw new Error("buildGateContext: no certification " + certCode);
  const cueCfg = cueConfigFor(cert.exam_blueprint);

  const tasks = (await getAll(key, "tasks?select=id,certification_id,code&order=code"))
    .filter((t) => t.certification_id === cert.id);
  const codeOfTask = new Map(tasks.map((t) => [t.id, t.code]));
  const taskIdOfCode = new Map(tasks.map((t) => [t.code, t.id]));

  const tsRows = await getAll(key, "task_sources?select=task_id,passage_id,role&order=task_id");
  const passRows = await getAll(key, "source_passages?select=id,clause,source_id,edition&order=id");
  const pById = new Map(passRows.map((r) => [r.id, r]));
  const mapByTask = new Map();
  const stdSeen = new Map();
  for (const r of tsRows) {
    if (!taskIdOfCode.has(codeOfTask.get(r.task_id))) continue;
    const p = pById.get(r.passage_id);
    if (!p) continue;
    if (!mapByTask.has(r.task_id)) mapByTask.set(r.task_id, { primary: [], supporting: [] });
    mapByTask.get(r.task_id)[r.role].push(p.clause);
    const k = p.source_id + "|" + p.edition;
    stdSeen.set(k, (stdSeen.get(k) || 0) + 1);
  }
  /* The (source, edition) to key passages on is the one this certification's map uses MOST, not a
   * literal. A tie or an empty map is an error rather than a silent default. */
  let standard = opts.standard, edition = opts.edition;
  if (!standard || !edition) {
    const ranked = [...stdSeen.entries()].sort((a, b) => b[1] - a[1]);
    if (!ranked.length) throw new Error("buildGateContext: " + certCode + " has no task_sources rows; the gates would be UNASSERTED");
    if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) {
      throw new Error("buildGateContext: " + certCode + " maps two standards equally (" +
        ranked[0][0] + " / " + ranked[1][0] + "); pass {standard, edition} explicitly");
    }
    [standard, edition] = ranked[0][0].split("|");
  }
  const passagesByKey = new Map(lib.passages
    .filter((p) => p.source_id === standard && p.edition === edition).map((p) => [p.clause, p]));
  if (!passagesByKey.size) throw new Error("buildGateContext: no library passages for " + standard + " " + edition);

  const leak = await import("./leak-score.mjs");
  const sources = leak.buildSources();   /* throws rather than leaving reproduction UNASSERTED */

  const rows = await getAll(key, "quiz_questions?select=id,question_text,options,correct_answer,explanation," +
    "task_id,status,visibility,is_exam_scope,pool&certification_id=eq." + cert.id +
    "&language=eq.en&retired_at=is.null&order=id");
  const liveByTask = new Map();
  for (const r of rows) {
    if (!liveByTask.has(r.task_id)) liveByTask.set(r.task_id, []);
    liveByTask.get(r.task_id).push({ id: id8(r), stem: r.question_text || "" });
  }
  const grounding = new Map((await getAll(key,
    "item_grounding?select=question_id,key_support,key_support_clause,source_id,edition&order=question_id"))
    .map((g) => [g.question_id, g]));

  const gateRow = (row, overrides = {}) => {
    const g = grounding.get(row.id);
    if (!g) throw new Error("gateRow: " + id8(row) + " has no item_grounding row");
    const base = gateItemOf({ ...row, ...overrides });
    const code = codeOfTask.get(row.task_id);
    return runCodeGates({
      ...base,
      key_support: overrides.key_support ?? g.key_support,
      key_support_clause: overrides.key_support_clause ?? g.key_support_clause,
      explanation: overrides.explanation ?? row.explanation,
    }, {
      passagesByKey, annexGaps, sequenceGaps: [...sequenceGaps, ...declaredGaps],
      cert: certCode, cueCfg,
      primaryClauses: (mapByTask.get(row.task_id) || {}).primary || null,
      supportingClauses: (mapByTask.get(row.task_id) || {}).supporting || null,
      sources, leak,
      liveStemsForTask: (liveByTask.get(row.task_id) || []).filter((x) => x.id !== id8(row)),
    });
  };

  return { cert, standard, edition, passagesByKey, annexGaps, sequenceGaps, declaredGaps, cueCfg,
    tasks, codeOfTask, taskIdOfCode, mapByTask, rows, grounding, liveByTask, sources, leak, gateRow };
}
