#!/usr/bin/env node
/**
 * check-cross-artifact-duplicates.mjs -- near-duplicate detection ACROSS artifacts and against the
 * live bank. READ-ONLY: there is no --apply and passing one exits 2.
 *
 * ============ WHY THIS EXISTS ============
 *
 * `gateNearDuplicate` runs inside one generation run, comparing a new item against the LIVE stems
 * for its task. In a crossover round -- two writers, the same tasks, the same prompt -- neither
 * artifact can see the other, so twin items pass both runs cleanly and only collide at insert.
 * PROMPT-127's R2 did exactly that: the director spotted the pairs by reading, which is the one
 * check a human should not have to be.
 *
 * Ruled PROMPT-128 s2: ANY ROUND WITH MORE THAN ONE ARTIFACT RUNS THIS BEFORE INSERT.
 *
 * It imports `nearDuplicateOf`, so it is the same similarity rule the gate uses -- not a second
 * implementation that could drift. What it adds is the COMPARISON SET: every survivor of every
 * named artifact, plus every live grounded stem for the task.
 *
 *   --cert <CODE>        required
 *   --artifacts=a,b,...  required, two or more
 *   --accept=a,b,...     optional: limit each artifact to its accept list, in the same order
 *   --out=<file>         optional: write the flagged pairs as JSON
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { nearDuplicateOf } from "./lib/grounded-gates.mjs";
import { itemIdOfStem } from "./lib/item-id.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
/* the key normaliser, declared HERE because the live-bank index below needs it and the candidate
 * comparison further down needs the same one -- two spellings of this would be two rules. */
const normKeyEarly = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ")
  .replace(/\s+/g, " ").trim();
let CERT = null, ARTS = [], ACCEPTS = [], OUT = null;
const AV = process.argv.slice(2);
for (let i = 0; i < AV.length; i++) {
  const a = AV[i];
  let m;
  if (a === "--apply") {
    console.error("there is no --apply: this is a MEASUREMENT. It names what to withhold; a human rules.");
    process.exit(2);
  }
  if ((m = /^--cert(?:=(.+))?$/.exec(a))) { CERT = m[1] || AV[++i]; continue; }
  if ((m = /^--artifacts=(.+)$/.exec(a))) { ARTS = m[1].split(",").map((s) => s.trim()).filter(Boolean); continue; }
  if ((m = /^--accept=(.+)$/.exec(a))) { ACCEPTS = m[1].split(",").map((s) => s.trim()).filter(Boolean); continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  console.error("unrecognised flag: " + a);
  console.error("  --cert <CODE>  --artifacts=a,b  [--accept=a,b]  [--out=file]   READ-ONLY");
  process.exit(2);
}
if (!CERT || !ARTS.length) {
  console.error("--cert and --artifacts are required.");
  process.exit(2);
}
/* ============ ONE ARTIFACT IS ALLOWED, AND NOT REDUNDANT (PROMPT-128 s6) ============
 *
 * The in-run gate compares each item against the live stems AS THEY WERE WHEN THE RUN STARTED. R3
 * generated for roughly forty minutes while R2's 25 items were being inserted and approved, so its
 * early items were gated against a smaller bank than now exists. Re-checking against the CURRENT
 * live bank is therefore a different question, not a repeat of one.
 *
 * And the same-anchor-same-key signal has never run inside a single artifact at all: with 4 items
 * asked per task against an anchor cap of 2, a task can produce two items on one clause. */
if (ARTS.length === 1) {
  console.log("ONE ARTIFACT: comparing against the CURRENT live bank, and within the artifact on the");
  console.log("anchor-and-key signal. The in-run gate saw the live bank as it was when the run began.");
}
if (ACCEPTS.length && ACCEPTS.length !== ARTS.length) {
  console.error("--accept must name one list per artifact, in the same order.");
  process.exit(2);
}

const KEY = requireKey(join(ROOT, "scripts"));
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
const tasks = await getAll(KEY, "tasks?select=id,code&order=code");
const codeOf = new Map(tasks.map((t) => [t.id, t.code]));
/* the LIVE grounded stems, per task -- the same population the in-run gate compares against */
const live = await getAll(KEY, "quiz_questions?select=id,task_id,language,question_text,item_origin," +
  "retired_at,status&certification_id=eq." + cert.id + "&language=eq.en&order=id");
const liveByTask = new Map();
for (const r of live) {
  if (r.retired_at || r.item_origin !== "grounded") continue;
  const code = codeOf.get(r.task_id);
  if (!code) continue;
  if (!liveByTask.has(code)) liveByTask.set(code, []);
  liveByTask.get(code).push({ id: r.id, stem: r.question_text, where: "LIVE (" + r.status + ")" });
}

/* ============ THE LIVE BANK INDEXED BY ANCHOR, WITH ITS KEY TEXT (PROMPT-129 s2) ============
 *
 * `item_grounding` carries the anchor per ITEM (on its English row), so the anchor comes from there
 * and the key text from the row's own options. A row with no grounding has no anchor and cannot
 * take part -- counted and reported, never silently treated as "no match". */
const liveByAnchor = new Map();
let liveNoGrounding = 0, liveNoKey = 0;
{
  const ig = new Map((await getAll(KEY, "item_grounding?select=question_id,source_id,edition," +
    "key_support_clause&order=question_id")).map((g) => [g.question_id, g]));
  /* `question_text` IS SELECTED: the live row's identity has to be its STEM HASH, not its uuid
   * prefix. The director names items by stem hash, and a uuid prefix is a different identifier
   * entirely -- the control reported 1 of 14 purely because the two could never match. */
  const full = await getAll(KEY, "quiz_questions?select=id,task_id,language,question_text,options," +
    "correct_answer,item_origin,retired_at,status&certification_id=eq." + cert.id +
    "&language=eq.en&order=id");
  for (const r of full) {
    if (r.retired_at || r.item_origin !== "grounded") continue;
    const g = ig.get(r.id);
    if (!g) { liveNoGrounding++; continue; }
    const anchor = (g.source_id || "?") + " " + (g.key_support_clause || "?");
    const ki = Array.isArray(r.correct_answer) ? r.correct_answer[0] : null;
    const opts = r.options || [];
    const hit = ki ? opts.find((o) => o && o.id === ki) : opts.find((o) => o && o.is_correct === true);
    const key = normKeyEarly(hit ? hit.text : "");
    if (!key) { liveNoKey++; continue; }
    if (!liveByAnchor.has(anchor)) liveByAnchor.set(anchor, []);
    liveByAnchor.get(anchor).push({ item_id: itemIdOfStem(r.question_text), row: String(r.id).slice(0, 8), key,
      task: codeOf.get(r.task_id) || "?", status: r.status });
  }
}

/* ---- the candidates: survivors of each artifact, optionally narrowed to its accept list ---- */
const cand = [];
ARTS.forEach((f, i) => {
  const p = join(ROOT, f);
  if (!existsSync(p)) { console.error("REFUSING: no such artifact " + f); process.exit(2); }
  const j = JSON.parse(readFileSync(p, "utf8"));
  let allow = null;
  if (ACCEPTS.length) {
    const ap = join(ROOT, ACCEPTS[i]);
    if (!existsSync(ap)) { console.error("REFUSING: no such accept list " + ACCEPTS[i]); process.exit(2); }
    allow = new Set((JSON.parse(readFileSync(ap, "utf8")).accepts || []).map((a) => a.item_id));
    if (!allow.size) { console.error("REFUSING: " + ACCEPTS[i] + " names no accepts."); process.exit(2); }
  }
  let n = 0;
  for (const it of (j.items || [])) {
    if (it.verdict !== "survivor") continue;
    if (allow && !allow.has(it.item_id)) continue;
    const o = it.item || {};
    cand.push({ artifact: f, item_id: it.item_id, task: it.task_code, stem: o.question_text || "", raw: o,
      anchor: (o.source_id || "?") + " " + (o.key_support_clause || "?"),
      writer: (j.spend && j.spend.writer_model) || j.model || "?" });
    n++;
  }
  console.log("  " + f.padEnd(30) + n + " candidate(s)" + (allow ? " (narrowed to its accept list)" : ""));
});

console.log("");
console.log("CROSS-ARTIFACT NEAR-DUPLICATES   " + CERT + "   " + ARTS.length + " artifact(s), " +
  cand.length + " candidate(s)");
console.log("  live grounded stems: " + [...liveByTask.values()].reduce((a, v) => a + v.length, 0) +
  " across " + liveByTask.size + " task(s)");
console.log("");

const flagged = [];
const undecided = [];
/* ACROSS ARTIFACTS: every pair of candidates on the same task, from DIFFERENT artifacts.
 * Same-artifact pairs are left to the in-run gate, which already saw them. */
for (let i = 0; i < cand.length; i++) {
  for (let j = i + 1; j < cand.length; j++) {
    const a = cand[i], b = cand[j];
    /* THE STEM ARM STAYS WITHIN A TASK. Only the ANCHOR arm went cross-task (PROMPT-129 s2): two
     * stems on different tasks describe different competences, and comparing them produced 90 flags
     * where the within-task comparison produces 3. The cross-task question is about the PASSAGE. */
    if (a.task !== b.task) continue;
    if (ARTS.length > 1 && a.artifact === b.artifact) continue;
    const r = nearDuplicateOf(a.stem, [{ id: b.item_id, stem: b.stem }]);
    if (r.state === "DUPLICATE") flagged.push({ kind: "cross-artifact", task: a.task, a, b, reason: r.reason });
    else if (r.state !== "DISTINCT") undecided.push({ task: a.task, a, b, state: r.state, reason: r.reason });
  }
}
/* ============ A SECOND SIGNAL, BECAUSE STEM SIMILARITY CANNOT SEE THIS ============
 *
 * The four pairs the director picked out of R2 by reading measure 32-43% stem overlap against a 70%
 * bar -- including `ab6095d6`, which he rejected as "the plain-recall version" of `22090360`. The
 * rule is working as specified: CLAUDE.md s13 already records that gateNearDuplicate compares STEMS,
 * so the same fact asked a different way is invisible to it.
 *
 * What those pairs DO share is the anchor and the answer. So: same task, same (source, edition,
 * clause), and a key that normalises to the same text => SAME ANCHOR, SAME KEY. That is not a
 * refusal -- the enemy rule keeps same-anchor items off one form, so both are serveable -- it is
 * the pair a human should look at, which is the job this script exists to take off a human.
 */
const normKey = normKeyEarly;
const keyTextOf = (it) => {
  const o = it.raw || {};
  const opts = o.options || [];
  const hit = opts.find((x) => x && x.is_correct === true);
  return normKey(hit ? hit.text : "");
};
/* ============ ACROSS ANY TASK, AND AGAINST THE LIVE BANK (PROMPT-129 s2) ============
 *
 * The first version compared only WITHIN one task and only AMONG candidates. Of the director's 17
 * duplicate and twin calls on R3, 14 share an anchor ACROSS tasks or against an item already LIVE --
 * `4f4e9379` duplicates `5a5e1d83` on 27001 9.2.2 from a different task entirely. An anchor is a
 * passage, not a task, so the comparison has to be per anchor.
 */
const keyShare = (ka, kb) => {
  const wa = [...new Set(ka.split(" "))].filter((w) => w.length > 3);
  const wb = new Set([...new Set(kb.split(" "))].filter((w) => w.length > 3));
  const shared = wa.filter((w) => wb.has(w)).length;
  const denom = Math.min(wa.length, wb.size) || 1;
  return shared / denom;
};
const SHARE_BAR = 0.6;
/* candidate against candidate, ANY task */
for (let i = 0; i < cand.length; i++) {
  for (let j = i + 1; j < cand.length; j++) {
    const a = cand[i], b = cand[j];
    /* with ONE artifact the pair is necessarily same-artifact, and that is the case this signal has
     * never covered; with two or more, same-artifact pairs were already seen by the in-run gate. */
    if (ARTS.length > 1 && a.artifact === b.artifact && a.task === b.task) continue;
    if (a.anchor !== b.anchor) continue;
    const ka = keyTextOf(a), kb = keyTextOf(b);
    if (!ka || !kb) continue;
    const share = keyShare(ka, kb);
    if (ka === kb || share >= SHARE_BAR) {
      flagged.push({ kind: a.task === b.task ? "same-anchor-same-key" : "same-anchor-ACROSS-TASKS",
        task: a.task + (a.task === b.task ? "" : " / " + b.task), a, b,
        reason: "same anchor " + a.anchor + " and the keys share " + Math.round(share * 100) +
          "% of their distinctive words" + (ka === kb ? " (identical key text)" : "") +
          (a.task === b.task ? "" : " -- DIFFERENT TASKS, same passage") +
          ". Stem overlap is below the near-duplicate bar, so no stem rule sees this pair." });
    }
  }
}
/* candidate against the LIVE GROUNDED BANK, any task, matched on the anchor */
for (const c of cand) {
  const ka = keyTextOf(c);
  if (!ka) continue;
  for (const l of (liveByAnchor.get(c.anchor) || []).filter((l) => l.item_id !== c.item_id)) {
    const share = keyShare(ka, l.key);
    if (ka === l.key || share >= SHARE_BAR) {
      flagged.push({ kind: "same-anchor-AGAINST-LIVE", task: c.task + " / live " + l.task, a: c,
        b: { artifact: "LIVE BANK", item_id: l.item_id, anchor: c.anchor, writer: l.status },
        reason: "the live item " + l.item_id + " (task " + l.task + ", " + l.status + ") already " +
          "tests this passage and the keys share " + Math.round(share * 100) + "% of their " +
          "distinctive words" + (ka === l.key ? " (identical key text)" : "") + "." });
    }
  }
}

/* AGAINST THE LIVE BANK: each candidate against the live grounded stems for its task. */
for (const c of cand) {
  /* ============ A CANDIDATE IS NOT ITS OWN DUPLICATE (PROMPT-129 s2) ============
   *
   * Once a round is inserted, every candidate has a live row with the same stem, so the against-live
   * arms matched 43 of 43 items to themselves. THIRD occurrence of this class in this repository
   * (PROMPT-122 recorded it for revise-artifact, and the stored path for row id). Excluded by STEM
   * IDENTITY, which is the identifier both sides share. */
  const pool = (liveByTask.get(c.task) || []).filter((l) => itemIdOfStem(l.stem) !== c.item_id);
  if (!pool.length) continue;
  const r = nearDuplicateOf(c.stem, pool);
  if (r.state === "DUPLICATE") flagged.push({ kind: "against-live", task: c.task, a: c, b: null, reason: r.reason });
  else if (r.state !== "DISTINCT") undecided.push({ task: c.task, a: c, b: null, state: r.state, reason: r.reason });
}

if (!flagged.length) console.log("  NO near-duplicate flagged.");
for (const f of flagged) {
  console.log("  FLAGGED  " + f.kind + "   task " + f.task);
  console.log("    A  " + f.a.item_id + "  " + f.a.anchor + "   [" + f.a.artifact + ", writer " + f.a.writer + "]");
  if (f.b) console.log("    B  " + f.b.item_id + "  " + f.b.anchor + "   [" + f.b.artifact + ", writer " + f.b.writer + "]");
  console.log("    " + String(f.reason).slice(0, 160));
}
console.log("");
/* THE THIRD STATE IS REPORTED, never folded into "clean". */
console.log("  UNDECIDABLE / no comparable item: " + undecided.length +
  (undecided.length ? " -- listed below, neither pass nor fail" : ""));
for (const u of undecided.slice(0, 10)) {
  console.log("    " + u.task + "  " + u.a.item_id + (u.b ? " vs " + u.b.item_id : " vs live") +
    "  " + u.state);
}
console.log("");
console.log("  NOTHING IS WITHHELD BY THIS SCRIPT. It names pairs; a human rules which half to keep,");
console.log("  and the kept-out half belongs in <SLUG>-WITHHELD.json -- a withholding, not a rejection.");
if (OUT) {
  /* ============ THE OUTPUT CARRIES IDS, NOT ITEMS (PROMPT-129 s2) ============
   *
   * Candidate entries hold the whole item under `raw` -- key_support and all -- so writing the
   * flag list straight out put 178 runs of ISO 19011 text into a file nothing ignored.
   * check-licensed-text caught it before any commit. This file needs identifiers and reasons;
   * it never needed the text. */
  const slim = (x) => x && { artifact: x.artifact, item_id: x.item_id, task: x.task,
    anchor: x.anchor, writer: x.writer };
  writeFileSync(join(ROOT, OUT), JSON.stringify({ cert: CERT, artifacts: ARTS,
    candidates: cand.length,
    flagged: flagged.map((f) => ({ kind: f.kind, task: f.task, a: slim(f.a), b: slim(f.b),
      reason: f.reason })),
    undecided: undecided.map((u) => ({ task: u.task, a: slim(u.a), b: slim(u.b), state: u.state })),
  }, null, 2) + "\n");
  console.log("  wrote " + OUT);
}
