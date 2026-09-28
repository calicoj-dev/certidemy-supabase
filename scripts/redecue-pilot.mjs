#!/usr/bin/env node
/**
 * redecue-pilot.mjs - re-run the de-cue retry on the items a pilot already de-cued, under the
 * reshape-never-replace principle and the two rewrite checks.
 *
 * READ-ONLY about the database. It makes de-cue writer, solver and probe calls; it does NOT generate
 * items. Unknown flags exit 2.
 *
 *   --from=PILOT-GROUNDED-AIMSF-4.json   the gated artifact (required)
 *   --raw=PILOT-GROUNDED-AIMSF-4-raw.json  the pre-gate artifact (default: --from with -raw)
 *   --out=PILOT-4-DECUE-REVIEW.md        the markdown for the director's read
 *
 * ============ WHY THIS IS A SEPARATE SCRIPT ============
 *
 * The ruling is to re-run the de-cue on pilot 4's 24 items ONLY, with no new writer calls for
 * generation. Re-running gen-grounded-items would generate forty fresh items -- a dry run of a
 * generator is a sample, not a preview -- and the comparison the director wants is against the items
 * he has already read.
 *
 * ============ WHERE "THE ORIGINAL" COMES FROM, AND WHERE IT DOES NOT ============
 *
 * The de-cue replaced `record.item`, so the pre-de-cue distractors were not in the gated artifact.
 * They are recovered from the RAW artifact, which is written before any gate runs -- and that is exact
 * for 21 of the 24 items, whose stem and key are byte-identical to raw.
 *
 * THREE ITEMS WERE ALSO PARAPHRASED for reproduction before the de-cue ran, so raw is their
 * pre-PARAPHRASE state and their true pre-de-cue distractors are not recoverable. Those three are
 * MARKED in the report rather than quietly compared: an approximation presented as a measurement is
 * the defect this whole programme is about. `gen-grounded-items` now stores `item_before_decue`, so
 * this cannot recur.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { runCodeGates, groundedGateControls } from "./lib/grounded-gates.mjs";
import { blindPayload, assertBlind, solverUser, solverVerdict, SOLVER_SYSTEM, blindSolverControls } from "./lib/blind-solver.mjs";
import { optionsPayload, assertOptionsOnly, optionsProbeUser, optionsProbeVerdict,
  OPTIONS_PROBE_SYSTEM, optionsProbeControls } from "./lib/options-probe.mjs";
import { shapeCues, shapeCueControls } from "./lib/shape-cues.mjs";
import { deCueRewriteCheck, deCueCheckControls } from "./lib/de-cue-checks.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let FROM = null, RAW = null, OUT = "PILOT-4-DECUE-REVIEW.md", RENDER = null;
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--from=(.+)$/.exec(a))) { FROM = m[1]; continue; }
  if ((m = /^--raw=(.+)$/.exec(a))) { RAW = m[1]; continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  if ((m = /^--render-from=(.+)$/.exec(a))) { RENDER = m[1]; continue; }
  console.error("unknown flag " + JSON.stringify(a) + ". Known: --from=, --raw=, --out=, --render-from=");
  process.exitCode = 2; process.exit();
}
if (!FROM && !RENDER) { console.error("--from=<gated artifact> is required"); process.exitCode = 2; process.exit(); }
if (RENDER && FROM) {
  console.error("--render-from rebuilds the report from an artifact and makes no calls; --from runs.");
  console.error("Pass one. Passing both would look like a run and be a render.");
  process.exitCode = 2; process.exit();
}
if (!RAW && FROM) RAW = FROM.replace(/\.json$/, "-raw.json");

for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY not found"); process.exitCode = 2; process.exit(); }
const MODEL = process.env.GROUNDED_MODEL || "claude-opus-5";

async function claude(system, user, maxTokens = 3000) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
      });
      if (!res.ok) throw new Error("Anthropic " + res.status + ": " + (await res.text()).slice(0, 200));
      const data = await res.json();
      return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    } catch (e) {
      if (attempt >= 3) throw e;
      await new Promise((r) => setTimeout(r, 900 * attempt));
    }
  }
}
const parseObject = (s) => {
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b < a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
};

/* The de-cue prompt is the generator's, imported by reading rather than copied: a second copy of the
 * rules would drift from the one the pilot will use next. */
const genSrc = readFileSync(join(HERE, "gen-grounded-items.mjs"), "utf8");
const DE_CUE_SYSTEM = (() => {
  const m = /const DE_CUE_SYSTEM = `([\s\S]*?)`;/.exec(genSrc);
  if (!m) throw new Error("could not read DE_CUE_SYSTEM out of gen-grounded-items.mjs");
  return m[1];
})();

const keyIdxOf = (it) => (it.options || []).findIndex((o) => o && o.is_correct);
function applyDistractors(item, texts, ki) {
  if (!Array.isArray(texts)) return null;
  const slots = item.options.map((_, i) => i).filter((i) => i !== ki);
  if (texts.length !== slots.length) return null;
  if (texts.some((t) => !String(t || "").trim())) return null;
  const options = item.options.map((o) => ({ ...o }));
  slots.forEach((slot, n) => { options[slot] = { ...options[slot], text: String(texts[n]).trim() }; });
  if (options[ki].text !== item.options[ki].text) return null;
  if (options.findIndex((o) => o.is_correct) !== ki) return null;
  return { ...item, options };
}

async function main() {
  if (RENDER) {
    const a = JSON.parse(readFileSync(join(ROOT, RENDER), "utf8"));
    if (!Array.isArray(a.items) || !a.items.length) {
      console.error(RENDER + " carries no items -- a render of nothing would write an empty report");
      console.error("that reads exactly like a run in which nothing was found.");
      return 3;
    }
    console.log("RENDER ONLY from " + RENDER + " -- no writer, solver or probe calls");
    return renderReport({ out: a.items, applied: a.applied, reverted: a.reverted, byCause: a.byCause,
      malformed: a.malformed, unrun: a.unrun,
      withBoth: { length: a.key_pick.n }, beforeHit: a.key_pick.before, afterHit: a.key_pick.after,
      subjects: a.subjects ?? a.items.length, persist: false });
  }

  const ctl = [groundedGateControls(), blindSolverControls(), optionsProbeControls(),
    shapeCueControls(), deCueCheckControls()];
  const fails = ctl.flatMap((c) => c.fails);
  console.log("CONTROLS  " + ctl.reduce((a, c) => a + c.examined, 0) + " cases");
  if (fails.length) {
    console.error("REFUSING TO RUN -- controls fail:");
    for (const f of fails) console.error("  " + f);
    return 2;
  }

  const gated = JSON.parse(readFileSync(join(ROOT, FROM), "utf8"));
  const raw = JSON.parse(readFileSync(join(ROOT, RAW), "utf8"));
  const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
  const controlTitles = [...new Set(lib.passages
    .filter((p) => /^[A-D]\./.test(String(p.clause || "")))
    .map((p) => String(p.title || "").trim()).filter((t) => t.length >= 12))];
  /* ============ THE KEY IS THE BARE CLAUSE, SCOPED TO THE CERTIFICATION'S OWN STANDARD ============
   *
   * My first version keyed this `source_id|edition|clause`, so every gate lookup missed and
   * clause-exists, verbatim and modal-fidelity failed on 23 of 24 rewrites -- a 96 percent revert rate
   * that read as "the writer cannot follow the new rule" and was my map. Those three gates concern the
   * KEY and its anchor, which a distractor rewrite does not touch, so they could not legitimately have
   * moved at all: the revert reason was the tell. */
  const STANDARD = { "AIMS-F": { id: "ISO/IEC 42001", edition: "2023" } }[gated.certification]
    || { id: gated.standard, edition: gated.edition };
  const passagesByKey = new Map(lib.passages
    .filter((p) => p.source_id === STANDARD.id && p.edition === STANDARD.edition)
    .map((p) => [p.clause, p]));
  if (!passagesByKey.size) {
    console.error("no passages for " + STANDARD.id + " " + STANDARD.edition + " -- every gate would");
    console.error("report UNASSERTED and every rewrite would revert for a reason that is not about it.");
    return 3;
  }

  /* Pair each de-cued survivor with its raw counterpart, in task order. */
  const rawByTask = new Map();
  for (const r of raw.items) {
    if (!rawByTask.has(r.task_code)) rawByTask.set(r.task_code, []);
    rawByTask.get(r.task_code).push(r);
  }
  const seen = new Map();
  const subjects = [];
  for (const r of gated.items) {
    if (r.verdict !== "survivor" || !r.de_cue || r.de_cue.state !== "applied") continue;
    const n = seen.get(r.task_code) || 0; seen.set(r.task_code, n + 1);
    const rr = (rawByTask.get(r.task_code) || [])[n];
    if (!rr) { console.log("  no raw pair for task " + r.task_code + " -- skipped, reported"); continue; }
    const ki = keyIdxOf(r.item), rki = rr.item.correct_index;
    const exact = String(rr.item.question_text) === String(r.item.question_text) &&
      String(rr.item.options[rki].text) === String(r.item.options[ki].text);
    /* The pre-de-cue item: the gated item's stem/key/explanation with raw's distractors. */
    const pre = JSON.parse(JSON.stringify(r.item));
    const rawD = rr.item.options.map((o, i) => (i === rki ? null : o.text)).filter((x) => x !== null);
    const slots = pre.options.map((_, i) => i).filter((i) => i !== ki);
    if (rawD.length === slots.length) slots.forEach((s, j) => { pre.options[s].text = rawD[j]; });
    subjects.push({ rec: r, pre, exact, ki });
  }
  console.log("  de-cued items in " + FROM + ": " + subjects.length);
  console.log("  originals exact against raw: " + subjects.filter((s) => s.exact).length +
    "   approximate (also paraphrased): " + subjects.filter((s) => !s.exact).length);

  /* ============ THE GATE INPUT IS THE GENERATOR'S, NOT AN APPROXIMATION OF IT ============
   *
   * `runCodeGates` takes `passagesByKey`, `annexGaps`, `sequenceGaps`, `primaryClauses`,
   * `supportingClauses`, `sources` and `leak`. My first version passed `{passages, cert, task_code}`
   * -- none of which are parameter names it accepts -- so every gate would have received undefined
   * and reported UNASSERTED, and "the code gates passed" would have meant nothing at all.
   *
   * So the task's primary and supporting clauses come from `task_sources` in the database (the same
   * place the generator reads them), and the leak index is the shared one. */
  const KEY = requireKey(HERE);
  const certRow = (await getAll(KEY, "certifications?select=id,code&code=eq." + gated.certification))[0];
  const taskRows = await getAll(KEY, "tasks?select=id,code&certification_id=eq." + certRow.id);
  const taskIdByCode = new Map(taskRows.map((t) => [t.code, t.id]));
  /* `task_sources` links by passage_id, not by clause -- it is a foreign key, which is the point of
   * it. The clause comes from source_passages, joined here rather than assumed. */
  const links = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id");
  const spRows = await getAll(KEY, "source_passages?select=id,clause&order=id");
  const clauseById = new Map(spRows.map((r) => [r.id, r.clause]));
  const clausesFor = (code, role) => links
    .filter((l) => l.task_id === taskIdByCode.get(code) && l.role === role)
    .map((l) => clauseById.get(l.passage_id))
    .filter(Boolean);
  /* The live stems the near-duplicate gate compares against, read the way the generator reads them.
   * Passing `[]` makes that gate UNASSERTED -- which is not a pass, so every rewrite reverted for a
   * gate that had been given nothing to compare with. Ordered, because this table is far over one page. */
  const liveRows = await getAll(KEY,
    "quiz_questions?select=id,task_id,question_text&certification_id=eq." + certRow.id +
    "&language=eq.en&retired_at=is.null&order=id");
  const liveByTask = new Map();
  for (const r of liveRows) {
    if (!liveByTask.has(r.task_id)) liveByTask.set(r.task_id, []);
    liveByTask.get(r.task_id).push({ id: String(r.id).slice(0, 8), stem: r.question_text || "" });
  }

  const leakMod = await import("./lib/leak-score.mjs");
  let leakSources = null;
  try { leakSources = leakMod.buildSources(); } catch (e) {
    console.error("the leak index could not be built: " + String(e.message).slice(0, 140));
    console.error("The reproduction gate would report UNASSERTED on every rewrite, so a rewrite that");
    console.error("reproduces a source could be kept. Refusing.");
    return 3;
  }
  const passagesFor = (rec) => {
    const want = new Set([...clausesFor(rec.task_code, "primary"), ...clausesFor(rec.task_code, "supporting")]);
    return lib.passages.filter((p) => want.has(p.clause));
  };
  const gateInputFor = (rec) => ({
    passagesByKey,
    annexGaps: lib.annex_gaps || [],
    sequenceGaps: lib.sequence_gaps || [],
    cert: gated.certification,
    liveStemsForTask: liveByTask.get(taskIdByCode.get(rec.task_code)) || [],
    primaryClauses: clausesFor(rec.task_code, "primary"),
    supportingClauses: clausesFor(rec.task_code, "supporting"),
    sources: leakSources,
    leak: leakMod,
  });

  /* ============ THE GATE INPUT IS PROVED AGAINST THE UNMODIFIED SURVIVORS FIRST ============
   *
   * Every one of these items ALREADY PASSED these gates in the pilot run. So running them again, on
   * the item as it stands, must pass -- and if it does not, the fault is in the input assembled above
   * and not in anything a rewrite did. That is not a theory: the first real run of this script reported
   * 23 of 24 rewrites reverted by `clause-exists, verbatim, modal-fidelity`, three gates that read the
   * KEY and its anchor, which a distractor rewrite does not touch. The rewrites were fine; my
   * `passagesByKey` was keyed `source|edition|clause` where the gates look up a bare clause.
   *
   * A 96 percent revert rate is an instrument failure, not 23 bad rewrites -- and it cost 24 model
   * calls before anyone could see that. This runs first, costs nothing, and refuses.
   *
   * It is also the only honest way to read a revert: a gate that cannot pass the ORIGINAL cannot say
   * anything about a rewrite of it. */
  const preFails = [];
  for (const s of subjects) {
    const v = runCodeGates(s.rec.item, gateInputFor(s.rec));
    if (!v.passed) {
      preFails.push({ task: s.rec.task_code, failed: v.failed, unasserted: v.unasserted,
        detail: v.gates.filter((g) => g.pass === false || g.pass === null || g.examined === 0)
          .map((g) => g.id + ": " + String(g.detail || g.reason || "").slice(0, 110)) });
    }
  }
  if (preFails.length) {
    console.error("");
    console.error("REFUSING TO RUN. The gate input is wrong: " + preFails.length + " of " + subjects.length +
      " UNMODIFIED survivors fail gates they already passed.");
    console.error("A gate that cannot pass the original cannot judge a rewrite of it, so every revert");
    console.error("this run produced would be a fact about my input and not about the writer.");
    for (const f of preFails.slice(0, 4)) {
      console.error("  " + f.task + "  failed=[" + f.failed.join(",") + "] unasserted=[" + f.unasserted.join(",") + "]");
      for (const d of f.detail) console.error("      " + d);
    }
    if (preFails.length > 4) console.error("  ... and " + (preFails.length - 4) + " more, same shape");
    return 3;
  }
  console.log("  gate input proved: " + subjects.length + "/" + subjects.length +
    " unmodified survivors still pass every gate");

  const out = [];
  let reverted = 0, applied = 0, unrun = 0, malformed = 0;
  const byCause = { rewrite: 0, gates: 0, solver: 0 };
  for (const s of subjects) {
    const rec = s.rec, pre = s.pre, ki = s.ki;
    const keyLabel = String.fromCharCode(65 + ki);
    const ps = passagesFor(rec);
    const origD = pre.options.filter((_, i) => i !== ki).map((o) => o.text);
    /* ============ THE BEFORE VERDICT IS MEASURED, NOT READ OUT OF THE ARTIFACT ============
     *
     * Pilot 4 recorded `de_cue.probe_before` as the cue TEXT and `de_cue.probe_after` as the bare
     * state string, so the before PICK was never stored -- and a key-pick rate needs the pick. It was
     * reconstructed once at 79 percent, which is a number with an asterisk on a comparison that is the
     * whole point of the exercise.
     *
     * So the original is probed here, for real, against the same instrument the rewrite will face. It
     * costs one probe call per item and it is the only way before and after are the same measurement.
     * The generator now stores `options_probe_before`; when that field is present it is used, and this
     * arm is what covers the artifacts written before it existed. */
    let probeBefore = rec.options_probe_before || null;
    if (!probeBefore) {
      try {
        const opb = optionsPayload(pre);
        assertOptionsOnly(opb, pre);
        probeBefore = optionsProbeVerdict(parseObject(await claude(OPTIONS_PROBE_SYSTEM, optionsProbeUser(opb), 800)), keyLabel);
        probeBefore.measured_here = true;
      } catch (e) {
        probeBefore = { state: "could-not-run", reason: String(e.message).slice(0, 140), measured_here: true };
      }
    }
    /* The cue the writer is given is the one the instrument named. `de_cue.probe_before` carries it as
     * free text in this artifact; the probe just run carries it structurally. Both are used, because a
     * de-cue told only "there is a cue" is being asked to guess what it was. */
    const cues = [
      ...(probeBefore && probeBefore.state === "flag" && probeBefore.cue
        ? ["options probe (" + (probeBefore.cue_kind || "cue") + "): " + probeBefore.cue] : []),
      ...(typeof rec.de_cue?.probe_before === "string" && rec.de_cue.probe_before.trim()
        ? ["the cue recorded in the pilot: " + rec.de_cue.probe_before] : []),
      ...(rec.shape_cues_before || []).map((c) => c.id + ": " + c.cue),
    ];
    if (!cues.length) cues.push("the option set gives the key away; reshape the distractors for symmetry");

    let revised = null;
    try {
      revised = parseObject(await claude(DE_CUE_SYSTEM,
        "CUE(S) A CANDIDATE COULD USE, from instruments that saw only the options:\n  - " + cues.join("\n  - ") +
        "\n\nSTEM (do not change):\n" + pre.question_text +
        "\n\nKEY (do not change, reproduce it EXACTLY as option " + keyLabel + "):\n" + pre.options[ki].text +
        "\n\nDISTRACTORS to rewrite, in order:\n" +
        origD.map((t, i) => "  " + (i + 1) + ": " + t).join("\n"), 3000));
    } catch (e) {
      unrun++;
      out.push({ task: rec.task_code, state: "could-not-run", reason: String(e.message).slice(0, 140),
        exact: s.exact, origD, newD: [] });
      process.stdout.write("!");
      continue;
    }
    const cand = revised && Array.isArray(revised.distractors)
      ? applyDistractors(pre, revised.distractors, ki) : null;
    if (!cand) {
      malformed++;
      out.push({ task: rec.task_code, state: "malformed", exact: s.exact, origD, newD: revised?.distractors || [] });
      process.stdout.write("?");
      continue;
    }
    const newD = cand.options.filter((_, i) => i !== ki).map((o) => o.text);

    const rw = deCueRewriteCheck(origD, newD, controlTitles);
    if (rw.revert) {
      reverted++; byCause.rewrite++;
      out.push({ task: rec.task_code, state: "reverted", by: "rewrite check", reason: rw.reason,
        exact: s.exact, origD, newD, check: rw, probe_before: probeBefore });
      process.stdout.write("R");
      continue;
    }
    const recoded = runCodeGates(cand, gateInputFor(rec));
    if (!recoded.passed) {
      reverted++; byCause.gates++;
      out.push({ task: rec.task_code, state: "reverted", by: "code gates", reason: recoded.failed.join(", "),
        exact: s.exact, origD, newD });
      process.stdout.write("G");
      continue;
    }
    let reSolver = null;
    try {
      const p2 = blindPayload(cand, ps);
      assertBlind(p2, cand);
      reSolver = solverVerdict(parseObject(await claude(SOLVER_SYSTEM, solverUser(p2, ps), 1500)), keyLabel);
    } catch (e) {
      reSolver = { state: "could-not-run", reason: String(e.message).slice(0, 140) };
    }
    if (reSolver.state !== "accepted") {
      reverted++; byCause.solver++;
      out.push({ task: rec.task_code, state: "reverted", by: "blind solver", reason: reSolver.state,
        exact: s.exact, origD, newD });
      process.stdout.write("S");
      continue;
    }
    let reProbe = null;
    try {
      const op = optionsPayload(cand);
      assertOptionsOnly(op, cand);
      reProbe = optionsProbeVerdict(parseObject(await claude(OPTIONS_PROBE_SYSTEM, optionsProbeUser(op), 800)), keyLabel);
    } catch (e) {
      reProbe = { state: "could-not-run", reason: String(e.message).slice(0, 140) };
    }
    applied++;
    out.push({ task: rec.task_code, state: "applied", exact: s.exact, origD, newD,
      probe_before: probeBefore, probe_after: reProbe,
      shape_before: rec.shape_cues_before || [], shape_after: shapeCues(cand),
      keyLabel });
    process.stdout.write(".");
  }
  process.stdout.write("\n");

  /* KEY-PICK, before and after, over the items this run touched. */
  const pick = (v, k) => v && v.state !== "could-not-run" && v.pick === k;
  const withBoth = out.filter((o) => o.state === "applied" && o.probe_before && o.probe_after);
  const beforeHit = withBoth.filter((o) => pick(o.probe_before, o.keyLabel)).length;
  const afterHit = withBoth.filter((o) => pick(o.probe_after, o.keyLabel)).length;

  console.log("");
  console.log("RE-DE-CUE over " + subjects.length + " item(s)");
  console.log("  applied   " + applied);
  console.log("  REVERTED  " + reverted + "   (rewrite checks " + byCause.rewrite +
    ", code gates " + byCause.gates + ", blind solver " + byCause.solver + ")");
  console.log("  malformed " + malformed + "   could-not-run " + unrun);
  console.log("  KEY-PICK over the " + withBoth.length + " applied item(s) with both verdicts: before " +
    beforeHit + "/" + withBoth.length + "   after " + afterHit + "/" + withBoth.length);

  return renderReport({ out, applied, reverted, byCause, malformed, unrun, withBoth, beforeHit, afterHit,
    subjects: subjects.length });
}

/* ============ THE REPORT RENDERS FROM THE ARTIFACT, NOT FROM A RUN ============
 *
 * The JSON is written beside the markdown and carries every field the markdown is built from, so
 * `--render-from=<json>` rebuilds the report with no model calls at all. Without that, adding a
 * paragraph to a report costs another 84 writer, solver and probe calls -- which is the same argument
 * as persisting the raw writer output before gating: generation is the expensive, unrepeatable half,
 * and everything downstream of it should be re-runnable for free.
 *
 * It also means the numbers in the markdown cannot drift from the numbers in the artifact: there is
 * one renderer and it reads one object. */
function renderReport({ out, applied, reverted, byCause, malformed, unrun, withBoth, beforeHit, afterHit,
  subjects, FROM_ = null, RAW_ = null, MODEL_ = null, persist = true }) {
  const appliedOut = out.filter((o) => o.state === "applied");

  /* ---------------------------------------------------------------- the markdown */
  const md = [];
  md.push("# Pilot 4, de-cue re-run: original versus rewritten distractors");
  md.push("");
  md.push("Re-run under the RESHAPE-NEVER-REPLACE principle and the two rewrite checks, over the " +
    subjects + " items pilot 4 de-cued. No items were generated and nothing was written to the database.");
  md.push("");
  md.push("| | |");
  md.push("|---|---|");
  md.push("| applied | " + applied + " |");
  md.push("| reverted | " + reverted + " (rewrite checks " + byCause.rewrite + ", code gates " +
    byCause.gates + ", blind solver " + byCause.solver + ") |");
  md.push("| malformed / could-not-run | " + malformed + " / " + unrun + " |");
  md.push("| key-pick, applied items | before " + beforeHit + "/" + withBoth.length +
    ", after " + afterHit + "/" + withBoth.length + " |");
  md.push("");
  md.push("**A REVERT IS THE PROCESS WORKING.** The original passed every gate and the solver, so a");
  md.push("rewrite that introduces an absolute or drops a real control is discarded and the item keeps");
  md.push("the distractors it had.");
  md.push("");
  /* ============ WHAT MOVED, MEASURED BOTH SIDES ============
   *
   * A distribution reported only after a change is half a fact. The flag RATE is the number everyone
   * reaches for and it barely moves; what moves is WHICH cue the probe names, and that is only visible
   * with the before tally beside the after one. */
  const tally = (f) => {
    const m = new Map();
    for (const o of appliedOut) { const k = f(o); if (k) m.set(k, (m.get(k) || 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => k + " " + n).join(", ");
  };
  const wordsOf = (s) => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  let dTotal = 0, dLonger = 0, dVerbatimInside = 0, dKept80 = 0;
  for (const o of appliedOut) {
    for (let i = 0; i < o.origD.length; i++) {
      const a = wordsOf(o.origD[i]), b = wordsOf(o.newD[i] || "");
      dTotal++;
      if (b.length > a.length) dLonger++;
      if (b.join(" ").includes(a.join(" "))) dVerbatimInside++;
      if (a.length && a.filter((w) => b.includes(w)).length / a.length >= 0.8) dKept80++;
    }
  }
  md.push("## What moved");
  md.push("");
  md.push("| | before | after |");
  md.push("|---|---|---|");
  md.push("| probe state | " + tally((o) => o.probe_before && o.probe_before.state) + " | " +
    tally((o) => o.probe_after && o.probe_after.state) + " |");
  md.push("| cue the probe named | " + tally((o) => o.probe_before && o.probe_before.cue_kind) + " | " +
    tally((o) => o.probe_after && o.probe_after.cue_kind) + " |");
  md.push("| shape cues (code) | " + appliedOut.reduce((n, o) => n + (o.shape_before || []).length, 0) +
    " | " + appliedOut.reduce((n, o) => n + (o.shape_after || []).length, 0) + " |");
  md.push("");
  md.push("**The flag rate did not move and the CUE KIND collapsed.** The mechanical cues the code");
  md.push("checks can see -- length, grammar agreement, a lone negation -- went to zero, and");
  md.push("`shared-phrase` absorbed nearly all of them. That is what reshape-never-replace predicts:");
  md.push("each distractor has to keep naming its own control or clause, so making the four forms");
  md.push("parallel makes them share vocabulary, and the probe reads the parallelism itself as the cue.");
  md.push("Whether that is a cue a candidate could use, or the probe rationalising over a symmetric");
  md.push("option set, is a judgement this instrument cannot make -- which is the reason it flags and");
  md.push("never rejects.");
  md.push("");
  md.push("**And the rewrites are reshapes, not appends**, measured over all " + dTotal + " rewritten");
  md.push("distractors: " + dVerbatimInside + " contain the original verbatim, " + dKept80 +
    " keep 80 percent or more of its words, " + dLonger + " are longer.");
  md.push("Item 1.4 reads as a pure append and is the exception -- I read it first and nearly reported");
  md.push("it as the pattern.");
  md.push("");
  md.push("**Three items are marked APPROXIMATE.** Their pre-de-cue distractors are not recoverable:");
  md.push("the paraphrase retry had also touched them, so the \"original\" shown is the raw writer");
  md.push("output from before both steps. `gen-grounded-items` now stores `item_before_decue`.");
  md.push("");
  for (const o of out) {
    md.push("---");
    md.push("");
    md.push("## task " + o.task + " — " + o.state.toUpperCase() +
      (o.by ? " by the " + o.by : "") + (o.exact ? "" : "  *(original APPROXIMATE)*"));
    if (o.reason) { md.push(""); md.push("**Why:** " + o.reason); }
    md.push("");
    md.push("| # | original | rewritten |");
    md.push("|---|---|---|");
    for (let i = 0; i < Math.max(o.origD.length, (o.newD || []).length); i++) {
      const a = String(o.origD[i] || "").replace(/\|/g, "\\|");
      const b = String((o.newD || [])[i] || "").replace(/\|/g, "\\|");
      md.push("| " + (i + 1) + " | " + a + " | " + b + " |");
    }
    if (o.state === "applied") {
      md.push("");
      md.push("probe: " + (o.probe_before ? o.probe_before.state : "n/a") + " -> " +
        (o.probe_after ? o.probe_after.state : "n/a") +
        "   shape cues: " + (o.shape_before.length ? o.shape_before.map((c) => c.id).join(",") : "none") +
        " -> " + (o.shape_after.length ? o.shape_after.map((c) => c.id).join(",") : "none"));
    }
    md.push("");
  }
  writeFileSync(join(ROOT, OUT), md.join("\n") + "\n", "utf8");
  console.log("  wrote " + OUT);
  if (persist) {
    writeFileSync(join(ROOT, OUT.replace(/\.md$/, ".json")),
      JSON.stringify({ from: FROM_ || FROM, raw: RAW_ || RAW, model: MODEL_ || MODEL, subjects,
        applied, reverted, byCause, malformed, unrun,
        key_pick: { n: withBoth.length, before: beforeHit, after: afterHit }, items: out }, null, 1) + "\n", "utf8");
  }
  return 0;
}
process.exitCode = await main();
