#!/usr/bin/env node
/**
 * PROMPT-107 s1: rewrite the cue out of two items and re-scenario a third, re-gate, and write.
 * WRITES with `--apply`; dry by default. Unknown flags exit 2.
 *
 * THE SPEC IS DECLARED, NOT COMPUTED. Each change names the item by uuid prefix, states the gate it
 * is answering, and carries the replacement text. A revision that cannot be read beside the original
 * is a revision nobody can check.
 *
 * The solver is NOT run here: `solve-one-item.mjs` already runs it twice over a stored row, so this
 * writes first and that is run after, against what actually landed.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { gateItemOf, storedItemControls } from "./lib/stored-item.mjs";
import { cueConfigFor, keyLengthEscape } from "./lib/item-cue-guard.mjs";
import { buildGateContext } from "./lib/gate-context.mjs";

let APPLY = false, CERT = "AIMS-F", SPECFILE = null;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  let m = a.match(/^--cert=(.+)$/);
  if (m) { CERT = m[1]; continue; }
  m = a.match(/^--spec=(.+)$/);
  if (m) { SPECFILE = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=<CODE>, --spec=<file.json>, --apply (dry by default).");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
let NOTE_SUFFIX = " | revised: PROMPT-107";

/* ============ THE DEFAULT SPEC (PROMPT-107 s1), overridden by --spec ============ */
let SPEC = [
  {
    uuid: "99524730", id8: "3973e1ff", task: "5.2",
    gate: "structure -- key was longest at 1.42x the distractor mean",
    why: "Key shortened to the clause's three elements in fewer words; distractors a, b and d say the " +
      "same things at fuller length. No option's assertion changes.",
    options: {
      a: "Whether interested parties outside the organization have a usable route for reporting harmful effects caused by the AI system",
      b: "Whether the topics, the timing, the audiences and the channels for internal and external messaging have been settled",
      c: "Whether the system meets the organization's own requirements and this document, and is effectively implemented and maintained",
      d: "Whether the criteria for entering and for leaving every stage of the AI system life cycle have been written down",
    },
  },
  {
    uuid: "c49f7c97", id8: "182229d1", task: "1.3",
    gate: "structure -- key was longest at 1.32x the distractor mean",
    why: "Key states the same record-keeping obligation without the 'grounded in' frame; the three " +
      "distractors are restated at fuller length. No option's assertion changes.",
    options: {
      a: "Recording the system's design and build choices against organizational objectives, documented requirements and specification criteria",
      b: "Setting out the elements needed to keep the system in operation, covering monitoring, repairs, updates and support for end users",
      c: "Fixing the measures and the criteria by which the system will later be verified and validated before it is accepted",
      d: "Recording a release plan and confirming that the relevant requirements have been satisfied before the system is put live",
    },
  },
  {
    uuid: "89c5536c", id8: "1d659dfc", task: "1.4",
    gate: "near-duplicate -- 94% of the shorter stem shared with a3841bda",
    why: "A different organisation and a different situation. The question, the key and the anchor are " +
      "untouched, as ruled.",
    question_text: "A hospital group has run its AI management system for a year and is drawing up the " +
      "cycle of oversight activities for the year ahead. Which description matches the AIMS requirement " +
      "for management review?",
  },
];

if (SPECFILE) {
  const loaded = JSON.parse(readFileSync(join(HERE, "..", SPECFILE), "utf8"));
  SPEC = loaded.items || loaded;
  if (loaded.note_suffix) NOTE_SUFFIX = loaded.note_suffix;
  console.log("spec: " + SPECFILE + "   " + SPEC.length + " item(s)   marker " + JSON.stringify(NOTE_SUFFIX));
}
/* the marker is DERIVED from the suffix, so a new round cannot mark one string and test for another */
const MARKER = NOTE_SUFFIX.replace(/^[\s|]+/, "").trim();

for (const [label, c] of [["adapter", storedItemControls()]]) {
  if (c.fails.length) { console.error("REFUSING: " + label + " controls fail"); process.exit(2); }
  console.log(label + " controls: " + c.examined + " cases, all pass");
}

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const ctx = await buildGateContext(KEY, CERT);
const ig = new Map((await getAll(KEY, "item_grounding?select=question_id,review_verdict,review_note&order=question_id"))
  .map((g) => [g.question_id, g]));

/* THE CUE ARITHMETIC, from `keyLengthEscape` -- the one rule (PROMPT-109 s1). The mean-based ratio
 * this used to print came from the deleted second implementation and would now mislead. */
const cfg = cueConfigFor(ctx.cert.exam_blueprint);
const cueOf = (row) => {
  const e = keyLengthEscape(row, cfg);
  if (!e) return "no single key / no rival -- UNJUDGED";
  return "key " + e.keyLen + " vs rival " + e.maxRival + ", allowed +" + e.allowed +
    "  -> " + (e.escaped ? "ESCAPES by " + (e.over - e.allowed) : "inside by " + (e.allowed - e.over));
};

const plan = [];
console.log("");
console.log("REVISE " + SPEC.length + " ITEM(S)   " + CERT + (APPLY ? "   --apply" : "   dry run (default)"));
for (const s of SPEC) {
  const row = ctx.rows.find((r) => String(r.id).startsWith(s.uuid));
  if (!row) { console.error("  " + s.id8 + "  NO ROW for uuid prefix " + s.uuid); process.exitCode = 2; continue; }
  const overrides = {};
  if (s.question_text) overrides.question_text = s.question_text;
  if (s.options) {
    overrides.options = (row.options || []).map((o) =>
      Object.prototype.hasOwnProperty.call(s.options, o.id) ? { ...o, text: s.options[o.id] } : o);
  }
  /* AN AUTHORED ITEM HAS NO item_grounding ROW, so the grounded gates and the blind solver cannot
   * run on it: there is no anchor to check a quote against and no key_support to give the solver.
   * The CUE check needs none of that, so it still applies and is the one that matters here. Named in
   * the output rather than skipped quietly -- a gate that could not run is not a gate that passed. */
  const grounded = ctx.grounding.has(row.id);
  console.log("");
  console.log("  " + (s.id8 || s.uuid) + "   task " + s.task + "   answering: " + s.gate);
  console.log("    " + s.why);
  console.log("    cue BEFORE  " + cueOf(row));
  console.log("    cue AFTER   " + cueOf({ ...row, ...overrides }));
  if (!grounded) {
    const escAfter = keyLengthEscape({ ...row, ...overrides }, cfg);
    console.log("    gates        NOT APPLICABLE -- no item_grounding row (authored item): no anchor to");
    console.log("                 re-gate and no key_support for the blind solver. Cue check only.");
    if (escAfter && escAfter.escaped) {
      console.log("    -> STILL ESCAPING THE CUE ALLOWANCE. Left out.");
      continue;
    }
    plan.push({ s, row, overrides });
    continue;
  }
  const vb = ctx.gateRow(row);
  const va = ctx.gateRow(row, overrides);
  console.log("    gates BEFORE  passed=" + vb.passed + (vb.failed.length ? " FAILED[" + vb.failed.join(",") + "]" : ""));
  console.log("    gates AFTER   passed=" + va.passed + (va.failed.length ? " FAILED[" + va.failed.join(",") + "]" : ""));
  if (!va.passed) {
    console.log("    -> STILL FAILING. Left out, per the ruling: one fix attempt, then it waits for a read.");
    continue;
  }
  plan.push({ s, row, overrides });
}

console.log("");
console.log("  would write " + plan.length + " of " + SPEC.length);
if (!APPLY) { console.log("\nDRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

let wrote = 0;
for (const p of plan) {
  const body = { status: p.row.status, visibility: p.row.visibility, pool: p.row.pool,
    is_exam_scope: p.row.is_exam_scope };
  if (p.overrides.question_text) body.question_text = p.overrides.question_text;
  if (p.overrides.options) body.options = p.overrides.options.map((o) => ({ id: o.id, text: o.text }));
  const r = await fetch(REST_URL + "/quiz_questions?id=eq." + p.row.id, { method: "PATCH", headers: H,
    body: JSON.stringify(body) });
  if (!r.ok) { console.error("  PATCH FAILED " + p.s.id8 + "  " + (await r.text()).slice(0, 160)); continue; }
  /* the verdict STAYS `accept`; only the note gains the marker */
  const g = ig.get(p.row.id) || {};
  const note = String(g.review_note || "");
  if (!note.includes(MARKER)) {
    const r2 = await fetch(REST_URL + "/item_grounding?question_id=eq." + p.row.id, { method: "PATCH", headers: H,
      body: JSON.stringify({ review_note: note + NOTE_SUFFIX }) });
    if (!r2.ok) console.error("  NOTE PATCH FAILED " + p.s.id8 + "  " + (await r2.text()).slice(0, 160));
  }
  wrote++;
}

/* ---- read back, and re-gate against what actually landed ---- */
const ctx2 = await buildGateContext(KEY, CERT);
const ig2 = new Map((await getAll(KEY, "item_grounding?select=question_id,review_verdict,review_note&order=question_id"))
  .map((g) => [g.question_id, g]));
console.log("");
console.log("  wrote " + wrote + " of " + plan.length);
let bad = 0;
for (const p of plan) {
  const row = ctx2.rows.find((r) => r.id === p.row.id);
  const g = ig2.get(p.row.id) || {};
  const esc = keyLengthEscape(row, cfg);
  const isGrounded = ctx2.grounding.has(p.row.id);
  /* An authored row has no verdict and no marker to carry: the condition for it is the cue only.
   * Asserting `verdict === "accept"` on it would fail a row that was never meant to have one. */
  const v = isGrounded ? ctx2.gateRow(row) : null;
  const ok = isGrounded
    ? (v.passed && g.review_verdict === "accept" && String(g.review_note || "").includes(MARKER))
    : !!esc && !esc.escaped;
  if (!ok) bad++;
  console.log("    " + p.s.id8 + "  " + (isGrounded
    ? "gates passed=" + v.passed + (v.failed.length ? " FAILED[" + v.failed.join(",") + "]" : "") +
      "  verdict=" + g.review_verdict + "  note has marker=" + String(g.review_note || "").includes(MARKER)
    : "gates n/a (authored, ungrounded)") +
    "  cue " + (esc && esc.escaped ? "ESCAPES" : "inside"));
}
/* the NEGATIVE half: no other row's text moved */
const planIds = new Set(plan.map((p) => p.row.id));
let strays = 0;
for (const r of ctx2.rows) {
  if (planIds.has(r.id)) continue;
  const was = ctx.rows.find((x) => x.id === r.id);
  if (!was) continue;
  if (was.question_text !== r.question_text || JSON.stringify(was.options) !== JSON.stringify(r.options)) {
    console.error("    STRAY: " + String(r.id).slice(0, 8) + " text moved"); strays++;
  }
}
console.log("    strays " + strays + "   post-condition failures " + bad);
if (bad || strays || wrote !== plan.length) process.exitCode = 2;
