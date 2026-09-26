/**
 * solve-audit-sample.mjs -- run the BLIND SOLVER over items that already exist, and compare
 * what it flags against what the director found by reading them.
 *
 * READ-ONLY. MEASURE ONLY. Nothing is written to the bank, no item is retired, no status
 * moves. `--apply` is not a flag here and passing it exits 2.
 *
 * ============ THE QUESTION ============
 *
 * Section 4 asks whether the grounded path beats the old one. That is a claim about new
 * items. This asks a different and cheaper question: of the defects a human found by
 * reading 40 items, how many would the solver have caught -- and what does it flag that a
 * human read and accepted?
 *
 * Both halves matter and the second is the one that decides whether this is usable. A
 * solver that catches every defect and flags a third of the corpus is not a gate, it is a
 * second full read.
 *
 * ============ WHAT THE SOLVER IS GIVEN, AND WHY IT IS NOT THE SAME AS THE PILOT ============
 *
 * A grounded item names its own anchor, so the solver gets exactly the passage the item
 * points at. An EXISTING item names nothing -- the old generator never opened a source. So
 * the solver is given the passages mapped to the item's TASK, which is the best available
 * approximation and is weaker in a way that has to be stated:
 *
 *   an item can be perfectly sound and rest on a clause the task mapping does not carry.
 *
 * That makes some disagreement an artifact of the mapping rather than a defect in the item,
 * and the report separates `settled_by_passages: false` from a real disagreement for exactly
 * that reason. Folding them together would blame items for the mapping's gaps.
 *
 * ============ AND n=2 HAS NO VARIANCE ============
 *
 * AIMS-F contributed 2 Tier A findings and 0 Tier B to the 480-item audit. A catch rate over
 * two cases is not a rate; it is two observations. The report says so rather than printing a
 * percentage that reads as a measurement.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { blindPayload, assertBlind, solverUser, solverVerdict, SOLVER_SYSTEM, blindSolverControls } from "./lib/blind-solver.mjs";
import { AUDIT480_TIER_A, AUDIT480_TIER_B, AUDIT480_TIER_C, AUDIT480_TIER_D, AUDIT480_TIER_E } from "./lib/audit-480-findings.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let CERT = "AIMS-F";
for (const a of process.argv.slice(2)) {
  const m = /^--cert=(.+)$/.exec(a);
  if (m) { CERT = m[1]; continue; }
  console.error("unknown flag " + JSON.stringify(a) + " -- this script is READ-ONLY and MEASURE-ONLY.");
  console.error("There is no --apply: it must not be able to change an item it disagrees with.");
  process.exitCode = 2; process.exit();
}

{
  const c = blindSolverControls();
  if (c.fails.length) {
    console.error("REFUSING TO RUN -- the solver's own controls fail:");
    for (const f of c.fails) console.error("  " + f);
    process.exitCode = 2; process.exit();
  }
  console.log("solver controls: " + c.examined + " cases, all pass");
}

function env(k) {
  const p = join(HERE, ".env");
  try {
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (m && m[1] === k && !process.env[k]) return m[2].replace(/^["']|["']$/g, "").trim();
    }
  } catch { /* no .env */ }
  return process.env[k];
}
const ANTHROPIC_API_KEY = env("ANTHROPIC_API_KEY");
if (!ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY not found"); process.exitCode = 2; process.exit(); }

const MODEL = process.env.GROUNDED_MODEL || "claude-opus-5";
async function claude(system, user, maxTokens = 1500) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
      });
      if (!res.ok) throw new Error("Anthropic " + res.status + ": " + (await res.text()).slice(0, 200));
      const d = await res.json();
      return (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    } catch (e) {
      if (attempt >= 3) throw e;
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }
}
const parseObject = (t) => {
  const s = String(t || ""); const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
};

/* ---------------------------------------------------------------- the sample */
/* PARSED FROM AUDIT-SAMPLE.md, not re-drawn. Re-drawing with the same seed would be a
 * second implementation of one selection, and the comparison is only meaningful against
 * the exact 40 items the director read. */
const sampleMd = readFileSync(join(ROOT, "AUDIT-SAMPLE.md"), "utf8");
const sampled = [];
for (const line of sampleMd.split(/\r?\n/)) {
  const m = /^###\s+(\d+)\.\s+(\S+)\s+·\s+(\S+)\s+·\s+task\s+(\S+)\s+·\s+`([0-9a-f]{8})`/.exec(line);
  if (m && m[2] === CERT) sampled.push({ n: Number(m[1]), cert: m[2], domain: m[3], task: m[4], prefix: m[5] });
}
if (!sampled.length) {
  console.error("no " + CERT + " rows parsed out of AUDIT-SAMPLE.md -- the heading format must have changed.");
  console.error("An empty parse is a fact about the parser until something proves it could have matched.");
  process.exitCode = 2; process.exit();
}

/* ---------------------------------------------------------------- the findings */
/* ============ TWO SHAPES, AND READING ONLY ONE ADDS NOTHING SILENTLY ============
 *
 * Tiers A and B are arrays of objects with `cert` and `id`. Tiers C, D and E are OBJECTS
 * KEYED BY FIX TYPE whose values are arrays of `[cert, id, note]` triples -- grouped that
 * way on purpose, so one pass closes a group. A loader written for the first shape iterates
 * an object as an array, finds nothing, and adds nothing: no error, no warning, and every
 * solver flag then looks like a finding the director never made.
 *
 * Same defect this repository keeps paying for, in my own comparison script. The assertion
 * below is what stops it: the map must come out non-empty and must contain the two AIMS-F
 * Tier A findings by name.
 */
const tierOf = new Map();
const put = (cert, id, tier) => { if (cert === CERT) tierOf.set(String(id).slice(0, 8), tier); };
for (const r of AUDIT480_TIER_A) put(r.cert, r.id, "A");
for (const r of AUDIT480_TIER_B) put(r.cert, r.id, "B");
for (const [grouped, tier] of [[AUDIT480_TIER_C, "C"], [AUDIT480_TIER_D, "D"], [AUDIT480_TIER_E, "E"]]) {
  if (Array.isArray(grouped)) {
    for (const r of grouped) put(r.cert, r.id, tier);
  } else {
    for (const rows of Object.values(grouped || {})) {
      for (const t of rows || []) {
        if (Array.isArray(t)) put(t[0], t[1], tier);
        else put(t.cert, t.id, tier);
      }
    }
  }
}
/* POSITIVE CONTROL. The two AIMS-F Tier A findings are known by name from the 480-item
 * audit; if this loader cannot see them, its silence about everything else is worthless. */
{
  const wantA = AUDIT480_TIER_A.filter((r) => r.cert === CERT).map((r) => String(r.id).slice(0, 8));
  const missing = wantA.filter((id) => tierOf.get(id) !== "A");
  if (!tierOf.size || missing.length) {
    console.error("REFUSING TO RUN -- the findings loader is not reading the declaration:");
    console.error("  tiers loaded for " + CERT + ": " + tierOf.size);
    if (missing.length) console.error("  Tier A findings it could not see: " + missing.join(", "));
    console.error("Every solver flag would then look like a finding the director never made.");
    process.exitCode = 2; process.exit();
  }
  console.log("findings loaded for " + CERT + ": " + tierOf.size +
    " (" + ["A", "B", "C", "D", "E"].map((t) => t + "=" +
      [...tierOf.values()].filter((v) => v === t).length).join(" ") + ")");
}

/* ---------------------------------------------------------------- inputs */
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const mapping = JSON.parse(readFileSync(join(ROOT, CERT + "-TASK-SOURCES.json"), "utf8"));
const byKey = new Map(lib.passages
  .filter((p) => p.source_id === mapping.standard && p.edition === mapping.edition)
  .map((p) => [p.clause, p]));
const mapByCode = new Map((mapping.tasks || []).map((t) => [t.code, t]));
function passagesForTask(code) {
  const m = mapByCode.get(code) || {};
  const clauses = [
    ...(m.cited || []).filter((c) => c.state === "held").map((c) => c.clause),
    ...(m.cited || []).filter((c) => c.state === "container").flatMap((c) => c.children || []),
    ...(m.candidates || []).map((c) => c.clause),
  ];
  const out = []; const seen = new Set();
  for (const c of clauses) { if (seen.has(c)) continue; seen.add(c); const p = byKey.get(c); if (p) out.push(p); }
  return out;
}

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq." + CERT);
const cid = certs[0].id;
const rows = await getAll(KEY,
  "quiz_questions?select=id,task_id,question_text,options,correct_answer,explanation,status,pool,retired_at" +
  "&certification_id=eq." + cid + "&language=eq.en&order=id");
const allTasks = await getAll(KEY, "tasks?select=id,code,certification_id&order=code");
const taskCode = new Map(allTasks.filter((t) => t.certification_id === cid).map((t) => [t.id, t.code]));

/* Resolve each prefix to exactly one row. Ambiguity is a HARD ERROR: a comparison keyed on
 * the wrong item is worse than no comparison. */
const resolved = [];
const unresolved = [];
for (const s of sampled) {
  const hits = rows.filter((r) => String(r.id).startsWith(s.prefix));
  if (hits.length === 1) resolved.push({ ...s, row: hits[0] });
  else unresolved.push({ ...s, found: hits.length });
}
if (unresolved.length) {
  console.log("");
  console.log("PREFIXES THAT DID NOT RESOLVE TO EXACTLY ONE LIVE ROW  " + unresolved.length);
  for (const u of unresolved) console.log("  #" + u.n + " " + u.prefix + "  matched " + u.found + " rows");
  console.log("  (a retired item is expected here -- the 11 Tier A retirements came out of this sample)");
}

console.log("");
console.log("BLIND SOLVER vs THE DIRECTOR'S READ  --  " + CERT + ", measure only");
console.log("  sampled in AUDIT-SAMPLE.md   " + sampled.length);
console.log("  resolved to a live row       " + resolved.length);
console.log("  the director's findings here " +
  [...tierOf.entries()].filter(([p]) => sampled.some((s) => s.prefix === p)).length +
  "  (" + ["A", "B", "C", "D", "E"].map((t) =>
    t + "=" + sampled.filter((s) => tierOf.get(s.prefix) === t).length).join(" ") + ")");
console.log("");

/* ---------------------------------------------------------------- solve */
const out = [];
for (const r of resolved) {
  const code = taskCode.get(r.row.task_id) || r.task;
  const ps = passagesForTask(code);
  /* ============ THE KEY IS AN OPTION ID, NOT AN INDEX ============
   *
   * `correct_answer` is `string[]` of option ids -- `["c"]` -- and each option carries an
   * `id` letter. The first version of this read it as a numeric index and reported ALL 40
   * ITEMS as "could not be asked": a total measurement failure that the third state caught
   * and a two-state design would have reported as 40 clean items.
   *
   * Read from the live rows and from `functions/score-mock-exam`, which marks answers with
   * `isCorrect(q.correct_answer as string[], user_answer)`. A numeric index is still accepted
   * because nothing guarantees the whole bank is uniform, and an unresolvable key stays
   * could-not-run rather than being guessed at position 0. */
  const opts = Array.isArray(r.row.options) ? r.row.options : [];
  const ca = r.row.correct_answer;
  let ki = -1;
  if (Array.isArray(ca) && ca.length) {
    ki = opts.findIndex((o) => o && String(o.id) === String(ca[0]));
  } else if (typeof ca === "string" && ca.length === 1) {
    ki = opts.findIndex((o) => o && String(o.id) === ca);
  } else if (Number.isInteger(Number(ca))) {
    ki = Number(ca);
  }
  if (!opts.length || ki < 0 || !opts[ki]) {
    out.push({ ...stripRow(r), state: "could-not-run",
      reason: "the key could not be resolved: correct_answer=" + JSON.stringify(ca) +
        " against " + opts.length + " option(s) with ids " + JSON.stringify(opts.map((o) => o && o.id)) });
    continue;
  }
  if (!ps.length) {
    /* NO PASSAGES IS ITS OWN STATE. Sending the item with an empty PASSAGES block would
     * guarantee `settled_by_passages: false` and manufacture a disagreement. */
    out.push({ ...stripRow(r), state: "no-passages", reason: "task " + code + " has no mapped passage" });
    continue;
  }
  const item = {
    question_text: r.row.question_text,
    options: opts.map((o, i) => ({ text: String((o && o.text) || o || ""), is_correct: i === ki })),
    explanation: r.row.explanation,
  };
  const payload = blindPayload(item);
  assertBlind(payload, item);
  let parsed = null, err = null;
  try { parsed = parseObject(await claude(SOLVER_SYSTEM, solverUser(payload, ps))); }
  catch (e) { err = String(e.message).slice(0, 160); }
  const v = solverVerdict(parsed, String.fromCharCode(65 + ki));
  const rec = { ...stripRow(r), task: code, passages: ps.length,
    state: v.state, reason: v.reason, solver: parsed, error: err,
    /* The two ways a solver can disagree are different questions and are kept apart. */
    kind: v.state !== "rejected" ? null
      /* "do not settle", not "does not settle" -- the verdict text says "the passages do not
       * settle the question". The mismatched regex labelled every unsettled cell as ANSWERED
       * DIFFERENTLY, which promotes the weakest signal to the strongest and would have
       * overstated what the solver caught. */
      : /not settle/.test(v.reason) ? "unsettled by the mapped passages"
      : /defensible/.test(v.reason) ? "second defensible option"
      : "answered differently from the key" };
  out.push(rec);
  console.log("  #" + String(r.n).padEnd(4) + r.prefix + "  " + (tierOf.get(r.prefix) || "-") + "  " +
    rec.state.padEnd(13) + (rec.kind || "") + (rec.kind ? " -- " : "") + String(rec.reason).slice(0, 78));
}
function stripRow(r) { return { n: r.n, prefix: r.prefix, director_tier: tierOf.get(r.prefix) || null }; }

/* ---------------------------------------------------------------- compare */
const flagged = out.filter((o) => o.state === "rejected");
const answeredDifferently = flagged.filter((o) => o.kind === "answered differently from the key");
const secondDefensible = flagged.filter((o) => o.kind === "second defensible option");
const unsettled = flagged.filter((o) => o.kind === "unsettled by the mapped passages");
const cleared = out.filter((o) => o.state === "accepted");
const couldNot = out.filter((o) => o.state === "could-not-run" || o.state === "no-passages");

const dirAB = out.filter((o) => o.director_tier === "A" || o.director_tier === "B");
const caughtAB = dirAB.filter((o) => o.state === "rejected");
const missedAB = dirAB.filter((o) => o.state !== "rejected");
const extra = flagged.filter((o) => !o.director_tier);
const extraLesser = flagged.filter((o) => o.director_tier && o.director_tier !== "A" && o.director_tier !== "B");

console.log("");
console.log("RESULT");
console.log("  solved to the key, no second defensible option   " + cleared.length);
console.log("  flagged                                          " + flagged.length);
console.log("    answered differently from the key              " + answeredDifferently.length);
console.log("    named a second defensible option               " + secondDefensible.length);
console.log("    said the mapped passages do not settle it      " + unsettled.length +
  "   <- weakest signal: may be the MAPPING, not the item");
console.log("  could not be asked                               " + couldNot.length);
console.log("");
console.log("  AGAINST THE DIRECTOR'S TIER A/B FOR THESE ITEMS  " + dirAB.length + " finding(s)");
console.log("    caught   " + caughtAB.length + (caughtAB.length ? "   " + caughtAB.map((o) => "#" + o.n + " " + o.prefix).join(", ") : ""));
console.log("    missed   " + missedAB.length + (missedAB.length ? "   " + missedAB.map((o) => "#" + o.n + " " + o.prefix + " (" + o.state + ")").join(", ") : ""));
if (dirAB.length && dirAB.length < 5) {
  console.log("    NOT A RATE. " + dirAB.length + " case(s) is " + dirAB.length + " observations; a percentage here");
  console.log("    would read as a measurement. n=2 has no variance and this repository says so.");
}
console.log("");
console.log("  FLAGGED AND NOT IN THE DIRECTOR'S LIST AT ALL     " + extra.length);
console.log("  FLAGGED AND CARRIED A LESSER TIER (C/D/E)         " + extraLesser.length +
  (extraLesser.length ? "   " + extraLesser.map((o) => "#" + o.n + " " + o.director_tier).join(", ") : ""));
console.log("");
/* ============ AND THE UNSETTLED FLAGS ARE MOSTLY A MEASUREMENT OF THE LIBRARY ============
 *
 * Read on the first real run: of nine flags, three named a source the library DOES NOT HOLD
 * -- the EU AI Act, ISO/IEC 42006 -- and the solver said so in as many words. Those are not
 * item defects and must not be counted as any: they are the acquisition gap from section 1
 * arriving through a different door.
 *
 * So the unheld sources are named here and a flag mentioning one is reported SEPARATELY. A
 * solver cannot settle a question from passages nobody owns, and blaming the item for that
 * would turn a purchasing decision into a content finding. */
const UNHELD_MENTION = /\b(?:EU AI Act|AI Act|42006|17021|17024|ITIL|NIST AI RMF|Local Law 144|SB 24-205|22989)\b/i;
const unheldFlags = flagged.filter((o) => UNHELD_MENTION.test(String(o.reason || "")));
console.log("");
console.log("  OF THOSE FLAGS, HOW MANY NAME A SOURCE WE DO NOT HOLD      " + unheldFlags.length);
for (const o of unheldFlags) {
  console.log("    #" + o.n + " " + o.prefix + "  " + String(o.reason).replace(/\s+/g, " ").slice(0, 110));
}
if (unheldFlags.length) {
  console.log("  These are the section 1 acquisition gap, not item defects. A solver cannot settle a");
  console.log("  question from passages nobody owns.");
}
console.log("  THE EXTRA FLAGS ARE THE NUMBER THAT DECIDES USABILITY, and they are UNREAD until");
console.log("  somebody reads them. They are enumerated in the artifact, not summarised: a flag");
console.log("  count with no members is a draft.");

writeFileSync(join(ROOT, "SOLVER-VS-READ-" + CERT + ".json"), JSON.stringify({
  certification: CERT, model: MODEL, standard: mapping.standard, edition: mapping.edition,
  method: "blind solver, passages mapped to the item's TASK (an existing item names no clause)",
  sampled: sampled.length, resolved: resolved.length,
  director_tier_ab: dirAB.length, caught: caughtAB.length, missed: missedAB.length,
  extra_flags: extra.length, extra_lesser_tier: extraLesser.length,
  flags_naming_an_unheld_source: unheldFlags.length,
  could_not_be_asked: couldNot.length,
  items: out,
}, null, 1) + "\n", "utf8");
console.log("");
console.log("wrote SOLVER-VS-READ-" + CERT + ".json");
