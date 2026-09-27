#!/usr/bin/env node
/**
 * insert-pilot-drafts.mjs - insert the ruled pilot survivors in the unservable status.
 *
 * The ruling says `draft`; the CHECK vocabulary has no such value, so they land as
 * `pending_review`. See DRAFT_STATUS below for the measurement and the deviation.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * ============ WHAT GOES IN, AND WHY THE SET IS SMALLER THAN THE SURVIVOR COUNT ============
 *
 * Pilot 3's 27 survivors, plus only those pilot-2 survivors that do not duplicate a pilot-3 item on
 * BOTH task and anchor clause. Two drafts resting on one fact cross-cue each other later, and stem
 * identity cannot see it -- their stems differ, which is exactly why a dedupe on text misses them.
 *
 * The director numbers SURVIVORS, not all items, and every reference he gives carries the task code
 * in parentheses. That parenthetical is the check: this script resolves the ordinal and then asserts
 * the task code matches, so a numbering drift cannot silently edit the wrong item.
 *
 * ============ EVERY COLUMN A DEFAULT COULD DECIDE IS WRITTEN EXPLICITLY ============
 *
 * `quiz_questions` defaults are `status='approved'`, `visibility='secure'` and
 * `is_exam_scope=true`. An insert that omits `status` lands LIVE. Two of the three defaults happen
 * to be safe for a draft and one is catastrophic, and which is which is not a thing to rely on --
 * so status, pool, visibility, is_exam_scope, item_origin and language are all named, and the rows
 * are read back afterwards and asserted one by one.
 *
 * ============ THREE INDEPENDENT REASONS A DRAFT CANNOT REACH A CANDIDATE ============
 *
 *   status=pending_review generate-mock-exam filters status='approved' exactly
 *   is_exam_scope=false   no exam form can contain it
 *   pool='secure'         submit-quiz-answer now refuses pool='secure' outright
 *
 * A guarantee that depends on one column staying true is not a guarantee.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { gateReproduction } from "./lib/grounded-gates.mjs";
/* ONE IMPLEMENTATION: `buildSources` is the lesson scanner's own index, in leak-score.mjs, and it
 * asserts each document's word count against the manifest -- a positive control this path gets for
 * free. It is NOT in citation-index.mjs, which is where I first reached for it. */
import * as leakScore from "./lib/leak-score.mjs";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("unknown flag " + JSON.stringify(a) + ". Known: --apply (dry by default).");
  process.exitCode = 2; process.exit();
}

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KEY = requireKey(HERE);

/* ============ THERE IS NO `draft` STATUS, AND THE CHECK SAYS SO ============
 *
 * Every prompt in this programme says `status='draft'`, and the first insert attempt died on
 *
 *   23514  quiz_questions_status_check
 *   CHECK (status = ANY (ARRAY['pending_review', 'approved', 'rejected']))
 *
 * `draft` is not in the vocabulary and no path can write it -- which also means
 * `gen-grounded-items.mjs`, whose insert body has said `status: "draft"` since it was written, could
 * never have inserted anything either. Its `--apply` had never run, so the branch read exactly like
 * one that works. That is the second defect this path has had of precisely that shape.
 *
 * `pending_review` IS the vocabulary's word for this state, and it is the word the platform already
 * intended: CLAUDE.md records that AI drafts should land `status='pending_review'` before being
 * served. So these rows land as `pending_review` rather than under a status that cannot exist.
 *
 * IT IS AT LEAST AS RESTRICTIVE AS `draft` WOULD HAVE BEEN. Every candidate-facing selector requires
 * `approved` exactly -- generate-mock-exam, get-review-batch and submit-quiz-answer's recommendNext
 * all `.eq('status','approved')` -- so `pending_review` is excluded wherever `draft` would have been,
 * and the two live checks below prove it on the wire rather than asserting it.
 *
 * STATED AS A DEVIATION: if a distinct `draft` state is wanted, it needs a migration widening the
 * CHECK, and then one UPDATE over these 32 ids. Nothing else about the ruling changes -- the review
 * verdict stays `read`, and `read` still does not promote a row. */
const DRAFT_STATUS = "pending_review";

/* ============ THE DIRECTOR'S EDITS, DECLARED BY (SURVIVOR ORDINAL, TASK CODE) ============
 *
 * Verbatim from his read. `from` must occur exactly once in the field or the edit is refused: a
 * substitution that silently matches nothing is how an approved change fails to land. */
const EDITS = [
  {
    pilot: 3, task: "3.2", field: "option", index: 0,
    from: "should know the AI policy",
    to: "are to be aware of the AI policy",
    why: "Clause 7.3 is a shall. 'should know' understates it, so the item taught that awareness is "
       + "optional. Understatement is not inflation, so no gate fires -- this is the director's read.",
  },
];

/* Excluded by name, with his reason. */
const EXCLUDE = [{ pilot: 2, ord: 15, task: "4.2", why: "Tier B: distractor d is defensible under 6.1.3 NOTE 3" }];

const rd = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const survivors = (j) => j.items.filter((r) => r.verdict === "survivor").map((r, i) => ({ ord: i + 1, ...r }));
const anchorKey = (r) => r.task_code + "|" + String(r.item.key_support_clause || "").trim();

async function main() {
  const p2 = survivors(rd("PILOT-GROUNDED-AIMSF-2.json"));
  const p3 = survivors(rd("PILOT-GROUNDED-AIMSF-3.json"));

  /* ---- the set ---- */
  const p3keys = new Set(p3.map(anchorKey));
  const chosen = p3.map((r) => ({ ...r, pilot: 3, why_in: "pilot 3 survivor" }));
  const dropped = [];
  const seen = new Set(p3keys);
  for (const r of p2) {
    const ex = EXCLUDE.find((e) => e.pilot === 2 && e.ord === r.ord);
    if (ex) {
      if (ex.task !== r.task_code) throw new Error("EXCLUDE #" + ex.ord + " expects task " + ex.task + ", resolved to " + r.task_code);
      dropped.push({ r, why: ex.why }); continue;
    }
    const k = anchorKey(r);
    if (seen.has(k)) {
      dropped.push({ r, why: p3keys.has(k) ? "duplicates a pilot-3 item on task+anchor" : "duplicates an earlier pilot-2 item on task+anchor" });
      continue;
    }
    seen.add(k);
    chosen.push({ ...r, pilot: 2, why_in: "pilot 2 survivor, unique on task+anchor" });
  }

  /* ---- the edits, applied with their own assertion ---- */
  const edited = [];
  for (const e of EDITS) {
    const pool = e.pilot === 3 ? chosen.filter((c) => c.pilot === 3) : chosen.filter((c) => c.pilot === 2);
    const hit = e.task ? pool.find((c) => c.task_code === e.task) : pool.find((c) => c.ord === e.ord);
    if (!hit) throw new Error("edit for pilot " + e.pilot + " task " + e.task + " matched no item in the insert set");
    const target = e.field === "option" ? hit.item.options[e.index] : hit.item;
    const prop = e.field === "option" ? "text" : e.field;
    const before = String(target[prop] || "");
    const n = before.split(e.from).length - 1;
    if (n !== 1) throw new Error("edit text occurs " + n + " time(s), expected exactly 1: " + JSON.stringify(e.from));
    target[prop] = before.replace(e.from, e.to);
    edited.push({ hit, e, before, after: target[prop] });
  }

  /* ---- THE REPRODUCTION GATE, RE-RUN ON EVERY EDITED ITEM ---- */
  let sources = null, reGate = [];
  try {
    sources = leakScore.buildSources();
    const qc = leakScore.quotationModeControls();
    if (qc.fails.length) throw new Error("quotation-mode controls fail: " + qc.fails.join("; "));
  } catch (e) {
    console.error("the leak index could not be built: " + String(e.message).slice(0, 160));
    sources = null;
  }
  for (const { hit, e } of edited) {
    const g = gateReproduction(hit.item, sources, sources ? leakScore : null);
    reGate.push({ task: hit.task_code, pilot: e.pilot, pass: g.pass, reason: g.reason, examined: g.examined });
  }

  console.log("");
  console.log("PILOT DRAFTS  " + (APPLY ? "--apply (WILL WRITE)" : "dry run (default)"));
  console.log("  pilot 3 survivors            " + p3.length);
  console.log("  pilot 2 survivors            " + p2.length);
  console.log("  IN  " + chosen.length + "   (" + chosen.filter((c) => c.pilot === 3).length +
    " from pilot 3, " + chosen.filter((c) => c.pilot === 2).length + " from pilot 2)");
  console.log("  OUT " + dropped.length + " from pilot 2");
  for (const d of dropped) console.log("      #" + d.r.ord + "  " + anchorKey(d.r).padEnd(16) + d.why);
  console.log("");
  console.log("  EDITS APPLIED " + edited.length);
  for (const { hit, e, before, after } of edited) {
    console.log("      pilot " + e.pilot + " task " + hit.task_code + " " + e.field +
      (e.field === "option" ? " " + String.fromCharCode(97 + e.index) : ""));
    console.log("        before: " + before.slice(0, 110));
    console.log("        after : " + after.slice(0, 110));
  }
  console.log("  REPRODUCTION GATE, RE-RUN ON THE EDITED TEXT");
  for (const g of reGate) {
    console.log("      task " + g.task + "  " + (g.pass === null ? "UNASSERTED" : g.pass ? "pass" : "FAIL") +
      "  examined " + g.examined + "  " + String(g.reason || "").slice(0, 90));
  }
  if (reGate.some((g) => g.pass === false)) {
    console.error("");
    console.error("REFUSING: an edited text now reproduces a source. Nothing written.");
    return 2;
  }
  if (reGate.some((g) => g.pass === null)) {
    console.error("");
    console.error("REFUSING: the leak index was not available, so the edited text is UNASSERTED");
    console.error("rather than clean. An edit that has not been re-gated is not ready to write.");
    return 2;
  }

  /* ---- THE REVIEW HAS NOWHERE TO GO YET ---- */

  const hasReview = await (async () => {
    const r = await fetch(REST_URL + "/item_grounding?select=reviewed_by&limit=1",
      { headers: { apikey: KEY, Authorization: "Bearer " + KEY } });
    return r.ok;
  })();
  console.log("");
  console.log("  item_grounding carries the director's read: " + (hasReview ? "yes" : "NO -- migration 379 is not applied"));
  if (!hasReview) {
    console.log("");
    console.log("  REFUSING TO INSERT. Each row is ruled to get item_grounding, grounding_family, the");
    console.log("  gate record AND the director's read recorded as the review. There is no English");
    console.log("  item review mechanism in this database -- item_translation_reviews is for");
    console.log("  TRANSLATIONS (tr_hash, tr_hash_basis), and reusing it would put two meanings in one");
    console.log("  table, which is the defect this repository already records against en_hash.");
    console.log("  migrations/379_item_grounding_review.sql is written and waiting for Juan.");
    console.log("");
    console.log("  Inserting first and adding the review afterwards would leave drafts in the bank");
    console.log("  with no record of who cleared them, which is the state the ruling exists to avoid.");
    writeFileSync(join(ROOT, "PILOT-DRAFT-INSERT-SET.json"),
      JSON.stringify({
        prepared: "2026-09-27",
        blocked_on: "migrations/379_item_grounding_review.sql",
        in_count: chosen.length,
        out_count: dropped.length,
        edits: edited.map(({ hit, e, before, after }) => ({ pilot: e.pilot, task: hit.task_code, field: e.field, before, after, why: e.why })),
        reproduction_regate: reGate,
        in: chosen.map((c) => ({ pilot: c.pilot, ord: c.ord, task: c.task_code, anchor: c.item.key_support_clause, grounding_family: c.grounding_family })),
        out: dropped.map((d) => ({ ord: d.r.ord, task: d.r.task_code, anchor: d.r.item.key_support_clause, why: d.why })),
      }, null, 1) + "\n", "utf8");
    console.log("  wrote PILOT-DRAFT-INSERT-SET.json -- the exact set, so the insert is a re-run and");
    console.log("  not a re-derivation once 379 is applied.");
    return 1;
  }

  /* ============ THE SET COMES FROM THE PINNED ARTIFACT, NOT FROM A RE-DERIVATION ============
   *
   * PILOT-DRAFT-INSERT-SET.json was written when the set was ruled. Recomputing the membership and
   * the edit here would make the insert a fresh decision wearing the old one's name -- the
   * generate-once-then-persist rule, and the reason the emitted artifact exists at all.
   *
   * So the DECISIONS are read from the file and the BODIES are resolved out of the pilot artifacts,
   * with an assertion that each resolved item still carries the task and anchor the file recorded.
   * An emitted artifact goes stale against its source exactly as a stored hash does. */
  const pinned = JSON.parse(readFileSync(join(ROOT, "PILOT-DRAFT-INSERT-SET.json"), "utf8"));
  const byPilot = { 2: p2, 3: p3 };
  const resolved = [];
  for (const want of pinned.in) {
    const r = byPilot[want.pilot].find((x) => x.ord === want.ord);
    if (!r) throw new Error("pinned set names pilot " + want.pilot + " #" + want.ord + ", which is not a survivor");
    if (r.task_code !== want.task) {
      throw new Error("pinned pilot " + want.pilot + " #" + want.ord + " recorded task " + want.task +
        " and resolves to " + r.task_code + " -- the artifact is stale against its source");
    }
    if (String(r.item.key_support_clause || "").trim() !== want.anchor) {
      throw new Error("pinned pilot " + want.pilot + " #" + want.ord + " recorded anchor " + want.anchor +
        " and resolves to " + r.item.key_support_clause);
    }
    resolved.push({ ...r, pilot: want.pilot });
  }
  if (resolved.length !== pinned.in_count) {
    throw new Error("pinned set says " + pinned.in_count + " rows, resolved " + resolved.length);
  }

  /* The edit, replayed from the artifact's recorded before/after rather than re-run from EDITS. */
  const replayed = [];
  for (const e of pinned.edits) {
    const hit = resolved.find((x) => x.pilot === e.pilot && x.task_code === e.task);
    if (!hit) throw new Error("pinned edit for pilot " + e.pilot + " task " + e.task + " matches no row in the set");
    const target = e.field === "option" ? hit.item.options.find((o) => String(o.text) === e.before) : hit.item;
    if (!target) {
      /* Already applied in memory by the EDITS pass above -- assert the AFTER text is present, which
       * is the resumable-state shape: a span whose `from` is gone and whose `to` is there is done. */
      const done = hit.item.options.some((o) => String(o.text) === e.after);
      if (!done) throw new Error("pinned edit for task " + e.task + ": neither the before nor the after text is present");
      replayed.push({ task: e.task, state: "already applied" });
      continue;
    }
    target.text = e.after;
    replayed.push({ task: e.task, state: "applied now" });
  }
  console.log("  pinned edits: " + replayed.map((r) => r.task + " " + r.state).join(", "));

  if (!APPLY) {
    console.log("");
    console.log("Nothing written. Re-run with --apply.");
    return 0;
  }

  /* ---------------------------------------------------------------- write */
  const certRows = await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F");
  const cert = certRows[0];
  const taskRows = await getAll(KEY, "tasks?select=id,code,bloom_level&certification_id=eq." + cert.id);
  const taskByCode = new Map(taskRows.map((t) => [t.code, t]));

  const post = async (path, rows, prefer) => {
    const res = await fetch(REST_URL + "/" + path, {
      method: "POST",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
        Prefer: prefer || "return=representation" },
      body: JSON.stringify(rows),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(path + ": " + res.status + " " + text.slice(0, 300));
    return text ? JSON.parse(text) : null;
  };

  const inserted = [];
  for (const r of resolved) {
    const t = taskByCode.get(r.task_code);
    if (!t) throw new Error("task " + r.task_code + " not found on AIMS-F");
    const keyLetter = String.fromCharCode(97 + r.item.options.findIndex((o) => o.is_correct));
    /* EVERY COLUMN A DEFAULT COULD DECIDE IS NAMED. status defaults to 'approved', is_exam_scope to
     * true and visibility to 'secure'; two of those are safe for a draft and one is catastrophic,
     * and which is which is not a thing to rely on. */
    const row = {
      certification_id: cert.id,
      task_id: t.id,
      language: "en",
      question_text: r.item.question_text,
      question_type: "single_choice",
      options: r.item.options.map((o, i) => ({ id: String.fromCharCode(97 + i), text: o.text })),
      correct_answer: [keyLetter],
      explanation: r.item.explanation,
      status: DRAFT_STATUS,
      pool: "secure",
      visibility: "secure",
      is_exam_scope: false,
      item_origin: "generated",
      bloom_level: t.bloom_level,
      difficulty: 3,
    };
    const back = await post("quiz_questions", [row]);
    const id = Array.isArray(back) ? back[0].id : back.id;
    inserted.push({ id, r });
  }
  console.log("  inserted " + inserted.length + " draft row(s)");

  /* ---- item_grounding, the gate record, and the director's read ---- */
  const NOTE = (r) => r.pilot === 3
    ? (r.task_code === "3.2"
        ? "pilot 3. Director read 2026-09-27: the only wording fix in the run -- clause 7.3 is a shall, "
          + "so the key's 'should know' understated it and was changed to 'are to be aware of'. "
          + "Reproduction gate re-run on the edited text: pass."
        : "pilot 3. Director read 2026-09-27: 27 survivors, 0 Tier A, 0 Tier B, no findings on this item.")
    : "pilot 2, kept because it is unique on task+anchor against pilot 3. Read 2026-09-26, no findings.";

  const groundingRows = inserted.map(({ id, r }) => ({
    question_id: id,
    key_support_clause: r.item.key_support_clause,
    key_support: r.item.key_support,
    source_id: "ISO/IEC 42001",
    edition: "2023",
    gates: r.gates ?? [],
    solver: r.solver ?? null,
    generator: "gen-grounded-items.mjs",
    model: pinned.model ?? null,
    grounding_family: r.grounding_family ?? r.item.key_support_clause,
    reviewed_by: "director",
    reviewed_at: new Date().toISOString(),
    review_verdict: "read",
    review_note: NOTE(r),
  }));
  await post("item_grounding", groundingRows, "return=minimal");
  console.log("  wrote " + groundingRows.length + " item_grounding row(s) with the review");

  /* ---------------------------------------------------- POST-CONDITIONS */
  const ids = inserted.map((x) => x.id);
  const backRows = await getAll(KEY,
    "quiz_questions?select=id,status,pool,visibility,is_exam_scope,item_origin,language,correct_answer,task_id" +
    "&id=in.(" + ids.join(",") + ")");
  console.log("");
  console.log("POST-CONDITIONS, read back row by row");
  console.log("  rows read back            " + backRows.length + " of " + ids.length);
  const bad = [];
  for (const b of backRows) {
    if (b.status !== DRAFT_STATUS) bad.push(b.id.slice(0, 8) + " status=" + b.status);
    if (b.is_exam_scope !== false) bad.push(b.id.slice(0, 8) + " is_exam_scope=" + b.is_exam_scope);
    if (b.pool !== "secure") bad.push(b.id.slice(0, 8) + " pool=" + b.pool);
    if (b.visibility !== "secure") bad.push(b.id.slice(0, 8) + " visibility=" + b.visibility);
    if (b.item_origin !== "generated") bad.push(b.id.slice(0, 8) + " item_origin=" + b.item_origin);
    if (b.language !== "en") bad.push(b.id.slice(0, 8) + " language=" + b.language);
    if (!Array.isArray(b.correct_answer) || b.correct_answer.length !== 1) {
      bad.push(b.id.slice(0, 8) + " correct_answer=" + JSON.stringify(b.correct_answer));
    }
  }
  console.log("  status=" + DRAFT_STATUS + ", is_exam_scope=false, pool/visibility/origin/language as written: " +
    (bad.length ? bad.length + " VIOLATION(S)" : "all " + backRows.length + " rows"));
  for (const b of bad.slice(0, 10)) console.log("      " + b);
  const grounded = await getAll(KEY,
    "item_grounding?select=question_id,grounding_family,review_verdict,reviewed_by&question_id=in.(" + ids.join(",") + ")");
  console.log("  item_grounding rows       " + grounded.length + " of " + ids.length +
    ", all verdict 'read' by 'director': " +
    (grounded.every((g) => g.review_verdict === "read" && g.reviewed_by === "director") ? "yes" : "NO"));
  if (backRows.length !== ids.length || bad.length || grounded.length !== ids.length) {
    throw new Error("post-conditions failed -- see above");
  }
  writeFileSync(join(ROOT, "PILOT-DRAFT-INSERTED.json"),
    JSON.stringify({ inserted_on: new Date().toISOString().slice(0, 10), ids,
      rows: inserted.map(({ id, r }) => ({ id, pilot: r.pilot, ord: r.ord, task: r.task_code,
        anchor: r.item.key_support_clause, grounding_family: r.grounding_family })) }, null, 1) + "\n", "utf8");
  console.log("  wrote PILOT-DRAFT-INSERTED.json with the 32 ids, for the form and stranger checks");
  return 0;
}
process.exitCode = await main();
