#!/usr/bin/env node
/**
 * PROMPT-103 s1: rewrite 5.3's three distractors off their shared "discharges it by" frame, re-gate,
 * and run the blind solver twice. Emits AIMSF-R6-ACCEPTED.json = the 4 accepts + the revised 5.3.
 * READ-ONLY against the DB; writes one artifact. `--apply` writes it, dry by default.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { runCodeGates, groundedGateControls, normClause } from "./lib/grounded-gates.mjs";
import { makePassageIndex } from "./lib/passage-index.mjs";
import { classifyPrimaries } from "./lib/effective-primary.mjs";
import { blindPayload, assertBlind, solverUser, solverVerdict, SOLVER_SYSTEM } from "./lib/blind-solver.mjs";
import { cueConfigFor } from "../functions/_shared/item-rules/item-cue-guard.mjs";

const CERT = "AIMS-F", IN = "AIMSF-R6.json", OUT = "AIMSF-R6-ACCEPTED.json";
let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply (dry by default)."); process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

/* The four ACCEPTS by item_id, and the one to revise -- named so a changed artifact cannot
 * silently insert a different item. */
const ACCEPT_IDS = ["27b6a5de", "20ec64ab", "c8619b7c", "b586304b"];
const REVISE_ID = "1fe05d59";
/* Each keeps its own reason: [0] 9.3.1 the review itself, [1] 9.3.2 a review INPUT,
 * [2] 9.3.3 a review OUTPUT. No two share an opening frame or a connective. */
const NEW_DISTRACTORS = {
  0: "Top management reviews the AIMS at planned intervals, and that review is the obligation.",
  1: "Improvement opportunities sit among the management review's required inputs, which settles the matter.",
  3: "Documented decisions on changes needed to the AIMS are what the clause demands.",
};

const c = groundedGateControls();
if (c.fails.length) { console.error("REFUSING: gate controls fail: " + JSON.stringify(c.fails).slice(0, 200)); process.exit(2); }
console.log("gate controls: " + c.examined + " cases, all pass");

const art = JSON.parse(readFileSync(join(ROOT, IN), "utf8"));
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const index = makePassageIndex(lib.passages);
const annexGaps = lib.annex_gaps || [], sequenceGaps = lib.sequence_gaps || [];
let declaredGaps = [];
try {
  const compl = JSON.parse(readFileSync(join(ROOT, "LIBRARY-COMPLETENESS.json"), "utf8"));
  declaredGaps = (compl.sources || []).map((s) => ({ holes: s.missing || [] }));
} catch { /* absent is the safe direction */ }
const leak = await import("./lib/leak-score.mjs");
const sources = leak.buildSources();

const KEY = requireKey(HERE);
const AK = process.env.ANTHROPIC_API_KEY ||
  (readFileSync(join(HERE, ".env"), "utf8").match(/^ANTHROPIC_API_KEY=(.+)$/m) || [])[1];
if (!AK) { console.error("ANTHROPIC_API_KEY not found"); process.exit(2); }
const MODEL = process.env.GROUNDED_MODEL || "claude-opus-5";

const certRow = (await getAll(KEY, "certifications?select=id,exam_blueprint&code=eq." + CERT))[0];
const cueCfg = cueConfigFor(certRow.exam_blueprint);
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code&order=code")).filter((t) => t.certification_id === certRow.id);
const idOfCode = new Map(tasks.map((t) => [t.code, t.id]));
const ts = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id");
const pById = new Map((await getAll(KEY, "source_passages?select=id,clause,source_id,edition&order=id")).map((r) => [r.id, r]));
const mapByTask = new Map();
for (const r of ts) {
  const p = pById.get(r.passage_id); if (!p) continue;
  if (!mapByTask.has(r.task_id)) mapByTask.set(r.task_id, { primary: [], supporting: [] });
  mapByTask.get(r.task_id)[r.role].push({ source_id: p.source_id, edition: p.edition, clause: p.clause });
}
const liveRows = await getAll(KEY, "quiz_questions?select=id,task_id,question_text&certification_id=eq." +
  certRow.id + "&language=eq.en&retired_at=is.null&order=id");
const liveByTask = new Map();
for (const r of liveRows) {
  if (!liveByTask.has(r.task_id)) liveByTask.set(r.task_id, []);
  liveByTask.get(r.task_id).push({ id: String(r.id).slice(0, 8), stem: r.question_text || "" });
}

const gate = (rec) => {
  const tid = idOfCode.get(rec.task_code);
  return runCodeGates(rec.item, {
    passagesByKey: index, annexGaps, sequenceGaps: [...sequenceGaps, ...declaredGaps],
    cert: CERT, cueCfg,
    primaryClauses: (mapByTask.get(tid) || {}).primary || null,
    supportingClauses: (mapByTask.get(tid) || {}).supporting || null,
    sources, leak, liveStemsForTask: liveByTask.get(tid) || [],
    assignedAnchor: rec.assigned || null,
  });
};

async function claude(system, user) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": AK, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: 1500, system, messages: [{ role: "user", content: user }] }),
      });
      if (!res.ok) throw new Error("Anthropic " + res.status + ": " + (await res.text()).slice(0, 200));
      const d = await res.json();
      return (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    } catch (e) { if (attempt >= 3) throw e; await new Promise((r) => setTimeout(r, 800 * attempt)); }
  }
}
const parseObject = (t) => { const s = String(t || ""); const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b < a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; } };

const byId = new Map((art.items || []).map((r) => [r.item_id, r]));
for (const id of [...ACCEPT_IDS, REVISE_ID]) {
  if (!byId.has(id)) { console.error("REFUSING: " + IN + " has no item " + id); process.exit(2); }
  if (byId.get(id).verdict !== "survivor") { console.error("REFUSING: " + id + " is not a survivor"); process.exit(2); }
}

/* ---- the revision ---- */
const rec = JSON.parse(JSON.stringify(byId.get(REVISE_ID)));
const wc = (t) => (String(t).trim().match(/\S+/g) || []).length;
const before = rec.item.options.map((o) => o.text);
for (const [i, text] of Object.entries(NEW_DISTRACTORS)) {
  const k = Number(i);
  if (k === rec.item.correct_index) { console.error("REFUSING: index " + k + " is the KEY"); process.exit(2); }
  rec.item.options[k] = { ...rec.item.options[k], text };
}
/* BOTH DIRECTIONS on the cue: the shared frame must be gone, and no NEW frame may be shared. */
const texts = rec.item.options.map((o) => o.text);
const distractors = texts.filter((_, i) => i !== rec.item.correct_index);
if (distractors.some((t) => /discharges it by/i.test(t))) { console.error("REFUSING: the shared frame survives"); process.exit(2); }
const firstTwo = (t) => String(t).toLowerCase().split(/\s+/).slice(0, 2).join(" ");
const frames = distractors.map(firstTwo);
if (new Set(frames).size !== frames.length) { console.error("REFUSING: two distractors share an opening frame: " + frames.join(" | ")); process.exit(2); }

console.log("");
console.log("5.3 options  (key is index " + rec.item.correct_index + ")");
texts.forEach((t, i) => console.log("  [" + i + "]" + (i === rec.item.correct_index ? " KEY " : "     ") +
  "(" + wc(t) + "w) " + t));
const dl = distractors.map(wc).sort((a, b) => a - b);
const med = dl.length % 2 ? dl[(dl.length - 1) / 2] : (dl[dl.length / 2 - 1] + dl[dl.length / 2]) / 2;
console.log("  key " + wc(texts[rec.item.correct_index]) + "w against median distractor " + med + "w");

const g = gate(rec);
console.log("");
console.log("GATES  passed=" + g.passed + (g.failed.length ? "  FAILED[" + g.failed.join(",") + "]" : "") +
  (g.unasserted.length ? "  UNASSERTED[" + g.unasserted.join(",") + "]" : ""));
for (const x of g.gates) if (x.pass === false) console.log("   " + x.id + ": " + String(x.reason).slice(0, 170));
const st = g.gates.find((x) => x.id === "structure");
if (st && (st.notes || []).length) for (const n of st.notes) console.log("   FLAG " + n);
if (!g.passed) { console.error("REFUSING: the revision does not clear the gates."); process.exit(2); }

/* ---- the solver, TWICE, second run shuffled and seeded by the item id ---- */
const ki = rec.item.options.findIndex((o, i) => i === rec.item.correct_index);
const marked = { ...rec.item, options: rec.item.options.map((o, i) => ({ ...o, is_correct: i === rec.item.correct_index })) };
const keyLabel = String.fromCharCode(65 + ki);
const ps = [...new Set([rec.item.key_support_clause, ...(rec.item.distractor_support || []).map((d) => d.clause)])]
  .map((cl) => index.get(rec.item.source_id, rec.item.edition, normClause(cl))).filter(Boolean);
if (!ps.length) { console.error("UNASSERTED: no passages for the solver"); process.exit(2); }
const payload = blindPayload(marked);
assertBlind(payload, marked);
const v1 = solverVerdict(parseObject(await claude(SOLVER_SYSTEM, solverUser(payload, ps))), keyLabel);

let seed = parseInt(REVISE_ID, 16) || 1;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const opts = payload.options.slice();
for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = opts[i]; opts[i] = opts[j]; opts[j] = t; }
const keyText = (payload.options.find((o) => o.label === keyLabel) || {}).text;
const p2 = { ...payload, options: opts.map((o, i) => ({ label: String.fromCharCode(65 + i), text: o.text })) };
const keyLabel2 = (p2.options.find((o) => o.text === keyText) || {}).label || keyLabel;
assertBlind(p2, marked);
const v2 = solverVerdict(parseObject(await claude(SOLVER_SYSTEM, solverUser(p2, ps))), keyLabel2);

console.log("");
console.log("SOLVER  run 1 (" + keyLabel + "): " + v1.state + "   " + String(v1.reason || "").slice(0, 140));
console.log("        run 2 (" + keyLabel2 + "): " + v2.state + "   " + String(v2.reason || "").slice(0, 140));
const ok = v1.state === "accepted" && v2.state === "accepted";
if (!ok) { console.error("REFUSING: the solver did not accept both runs."); process.exit(2); }

rec.solver = { ...v1, runs: 2, second: v2, revised_by: "PROMPT-103 s1" };
rec.verdict = "survivor";
rec.revision = { by: "PROMPT-103 s1", reason: "odd-one-out: three distractors shared the frame \"discharges it by\"",
  before, after: texts };

const out = { ...art, items: [...ACCEPT_IDS.map((id) => byId.get(id)), rec],
  generated: 5, revised: [REVISE_ID], emitted_by: "revise-r6-53.mjs (PROMPT-103 s1)" };
if (!APPLY) { console.log("\nDRY RUN. Nothing written. Re-run with --apply to write " + OUT + "."); process.exitCode = 0; }
else {
  writeFileSync(join(ROOT, OUT), JSON.stringify(out, null, 1), "utf8");
  const back = JSON.parse(readFileSync(join(ROOT, OUT), "utf8"));
  console.log("\nwrote " + OUT + "   " + back.items.length + " item(s): " +
    back.items.map((r) => r.task_code + "/" + r.item_id).join(", "));
  if (back.items.length !== 5) { console.error("READ-BACK FAILED: expected 5 items"); process.exitCode = 2; }
}
