#!/usr/bin/env node
/**
 * backfill-review-verdicts.mjs -- the earlier director reads, recorded on `item_grounding`.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * Ruled PROMPT-98 s1b. The 46 R4/R5 accepts were written by `apply-97-accept-verdicts.mjs`. This records the
 * reads that happened BEFORE those columns existed: batch 1, batch 2, R2, R3, their revisions, and the four
 * named rejects.
 *
 * ============ THE LISTS ARE DERIVED FROM THE ARTIFACTS, NOT TYPED ============
 *
 * Ruled: *"Derive the lists from the artifacts and dispositions. Don't type ids by hand, except the named
 * rejects."* So a batch-1 survivor is whatever `AIMSF-ROLLOUT-B1.json` says survived, resolved to its bank row
 * through the stem hash -- the same link every other instrument here uses, via `lib/item-id.mjs`.
 *
 * A REVISION INHERITS THE ACCEPT OF THE RULING THAT ORDERED IT, also ruled. A revision carries `revision_of`,
 * so the inheritance is derived too: the revision's own row gets the accept, and the id it superseded is NOT
 * given one, because that row is not in the bank.
 *
 * ============ `reviewed_at` IS THE DATE OF THE PROMPT, NOT TODAY ============
 *
 * Ruled explicitly. A clock timestamp would say the director read batch 1 tonight, which is false and would
 * make the record useless for the one question it exists to answer -- when was this item last looked at.
 *
 * The dates are DERIVED from git: the earliest commit whose message names the prompt. That is the moment the
 * ruling was recorded, it is auditable, and it cannot drift from the history the way a typed date would.
 *
 * ============ AND THESE COLUMNS HOLD THE LATEST VERDICT ONLY ============
 *
 * Ruled: the prompts in git are the history. Every note names its prompt, so a row's provenance is readable
 * from the row. If a verdict ever CHANGES, the old one is appended to the note (`was: accept, PROMPT-95`)
 * rather than lost -- this script refuses to overwrite a different existing verdict without `--force`, and
 * when forced it carries the old one into the note.
 */
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { itemIdOfStem } from "./lib/item-id.mjs";

let APPLY = false, FORCE = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  if (a === "--force") { FORCE = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply (dry by default), --force.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

/* ---- prompt dates, derived from the earliest commit naming each ---- */
function promptDate(p) {
  try {
    const out = execFileSync("git", ["log", "--format=%ad", "--date=short", "--grep=" + p, "--reverse"],
      { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean);
    return out[0] || null;
  } catch { return null; }
}
const DATE = {};
for (const p of ["PROMPT-93", "PROMPT-95", "PROMPT-96", "PROMPT-97"]) {
  DATE[p] = promptDate(p);
  if (!DATE[p]) { console.error("REFUSING: no commit names " + p + ", so its date cannot be derived."); process.exit(2); }
}
const at = (p) => DATE[p] + "T00:00:00Z";

/* ---- which artifacts belong to which ruling ---- */
const GROUPS = [
  { ruled: "PROMPT-93", files: ["AIMSF-ROLLOUT-B1.json"] },
  { ruled: "PROMPT-95", files: ["AIMSF-ROLLOUT-B2.json", "AIMSF-R2-PROBE.json", "AIMSF-R2-REST.json",
    "AIMSF-R3-PROBE.json", "AIMSF-R3-REST.json"] },
];
/* revision artifacts: a revision inherits the accept of the ruling that ordered it */
const REVISIONS = [
  { ruled: "PROMPT-93", files: ["AIMSF-B1-REVISED.json"] },
  { ruled: "PROMPT-95", files: ["AIMSF-S2-REVISED.json", "AIMSF-S2-INSERT.json", "AIMSF-S2-INSERTED.json"] },
];
/* THE ONLY HAND-TYPED IDS IN THIS FILE, as ruled, each with its prompt and reason. */
const REJECTS = [
  { id: "c590b702", ruled: "PROMPT-95", why: "rejected by ruling in PROMPT-95 s2" },
  { id: "43882b06", ruled: "PROMPT-95",
    why: "near-duplicate of c45a02f1 (1.1): same anchor 3.4, same key substance, distractors eliminable " +
      "without knowing the standard" },
  { id: "3a3d26fa", ruled: "PROMPT-96", why: "rejected by ruling in PROMPT-96 s3" },
  { id: "f92232b5", ruled: "PROMPT-97",
    why: "anchored on 42001 3.4 through the cross-standard collision: task 5.5 maps ISO/IEC 17021-1 3.4 " +
      "(certification audit) and the resolver returned 42001 3.4 (management system)" },
];

/* ---- the bank ---- */
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F"))[0];
const qs = await getAll(KEY,
  "quiz_questions?select=id,question_text,task_id,status&certification_id=eq." + cert.id +
  "&language=eq.en&retired_at=is.null&order=id");
const tasks = await getAll(KEY, "tasks?select=id,code&order=code");
const codeOf = new Map(tasks.map((t) => [t.id, t.code]));
const ig = await getAll(KEY,
  "item_grounding?select=question_id,review_verdict,reviewed_by,reviewed_at,review_note&order=question_id");
const groundedIds = new Set(ig.map((g) => g.question_id));
const igBy = new Map(ig.map((g) => [g.question_id, g]));

/* stem id -> bank row, and a refusal on an ambiguous stem */
const byStem = new Map();
for (const q of qs) {
  const id = itemIdOfStem(q.question_text);
  if (!byStem.has(id)) byStem.set(id, []);
  byStem.get(id).push(q);
}

/* ---- derive the plan ---- */
const plan = new Map();           /* question_id -> {verdict, note, at, why} */
const unresolved = [];
function want(id8, verdict, note, when, source) {
  const hits = byStem.get(id8) || [];
  if (hits.length !== 1) { unresolved.push({ id8, source, n: hits.length }); return; }
  const q = hits[0];
  if (!groundedIds.has(q.id)) { unresolved.push({ id8, source, n: 1, why: "no item_grounding row" }); return; }
  /* FIRST WRITER WINS, and a later group never downgrades an earlier accept: the artifacts overlap (an insert
   * set repeats a survivor), so the same row is reached more than once and the plan must be stable. */
  if (!plan.has(q.id)) plan.set(q.id, { verdict, note, at: when, task: codeOf.get(q.task_id), id8 });
}

for (const g of GROUPS) {
  for (const f of g.files) {
    const p = join(ROOT, f);
    if (!existsSync(p)) continue;
    for (const r of (JSON.parse(readFileSync(p, "utf8")).items || [])) {
      if (r.verdict !== "survivor") continue;
      want(String(r.item_id), "accept", "ruled_in: " + g.ruled, at(g.ruled), f);
    }
  }
}
for (const g of REVISIONS) {
  for (const f of g.files) {
    const p = join(ROOT, f);
    if (!existsSync(p)) continue;
    for (const r of (JSON.parse(readFileSync(p, "utf8")).items || [])) {
      if (r.verdict && r.verdict !== "survivor") continue;
      const id = String(r.item_id || "");
      if (!id) continue;
      want(id, "accept", "ruled_in: " + g.ruled + (r.revision_of ? " (revision of " + r.revision_of + ")" : ""),
        at(g.ruled), f);
    }
  }
}
/* the named rejects LAST and they OVERRIDE, because a reject is a later ruling about a row an earlier one
 * accepted -- f92232b5 is exactly that case */
const rejectPlan = new Map();
for (const r of REJECTS) {
  /* a reject id may be a bank uuid (f92232b5) or an artifact stem id */
  const uuidHit = qs.filter((q) => q.id.startsWith(r.id));
  const stemHit = byStem.get(r.id) || [];
  const hits = uuidHit.length ? uuidHit : stemHit;
  if (hits.length !== 1) { unresolved.push({ id8: r.id, source: "named reject " + r.ruled, n: hits.length }); continue; }
  const q = hits[0];
  if (!groundedIds.has(q.id)) {
    unresolved.push({ id8: r.id, source: "named reject " + r.ruled, n: 1, why: "no item_grounding row -- never inserted" });
    continue;
  }
  plan.delete(q.id);
  rejectPlan.set(q.id, { verdict: "reject", note: "ruled_in: " + r.ruled + " -- " + r.why, at: at(r.ruled),
    task: codeOf.get(q.task_id), id8: r.id, qid: q.id });
}

console.log("BACKFILL THE EARLIER READS");
console.log("");
console.log("  prompt dates, derived from the earliest commit naming each:");
for (const [p, d] of Object.entries(DATE)) console.log("    " + p + "  " + d);
console.log("");
console.log("  grounded rows in the bank        " + groundedIds.size);
console.log("  planned accept                  " + plan.size);
console.log("  planned reject                  " + rejectPlan.size);
console.log("  unresolved (named, not written)  " + unresolved.length);
for (const u of unresolved) {
  console.log("    " + u.id8 + "  from " + u.source + "  resolved to " + u.n + " row(s)" +
    (u.why ? "  -- " + u.why : ""));
}

/* what already carries a verdict, and whether this would CHANGE one */
const all = new Map([...plan, ...rejectPlan]);
const conflicts = [];
for (const [qid, p] of all) {
  const cur = igBy.get(qid);
  if (!cur || !cur.review_verdict) continue;
  if (cur.review_verdict === p.verdict) continue;
  conflicts.push({ qid, from: cur.review_verdict, to: p.verdict, note: cur.review_note, id8: p.id8 });
}
console.log("");
console.log("  rows whose verdict would CHANGE  " + conflicts.length);
for (const c of conflicts) {
  console.log("    " + c.id8 + "  " + c.from + " -> " + c.to + "   (note: " +
    JSON.stringify(String(c.note || "").slice(0, 60)) + ")");
}
if (conflicts.length && !FORCE) {
  console.error("");
  console.error("REFUSING: a verdict already on the row differs from the planned one. Re-run with --force to");
  console.error("change it -- the OLD verdict is then appended to the note as `was: <verdict>, <note>`, because");
  console.error("these columns hold the latest verdict only and the history must not be lost.");
  process.exit(1);
}

if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing written. Re-run with --apply.");
  process.exit(0);
}

let wrote = 0, failed = 0;
for (const [qid, p] of all) {
  const cur = igBy.get(qid);
  let note = p.note;
  if (cur && cur.review_verdict && cur.review_verdict !== p.verdict) {
    note = p.note + "  |  was: " + cur.review_verdict + ", " + String(cur.review_note || "").slice(0, 80);
  }
  const r = await fetch(REST_URL + "/item_grounding?question_id=eq." + qid, {
    method: "PATCH", headers: H,
    body: JSON.stringify({ review_verdict: p.verdict, reviewed_by: "director", reviewed_at: p.at,
      review_note: note }),
  });
  if (!r.ok) { console.error("  FAILED " + p.id8 + "  HTTP " + r.status + "  " + (await r.text()).slice(0, 140)); failed++; continue; }
  wrote++;
}

/* ---- POST-CONDITIONS ---- */
const after = await getAll(KEY,
  "item_grounding?select=question_id,review_verdict,reviewed_by,reviewed_at,review_note&order=question_id");
const aBy = new Map(after.map((g) => [g.question_id, g]));
let bad = 0;
for (const [qid, p] of all) {
  const g = aBy.get(qid);
  if (!g || g.review_verdict !== p.verdict) { console.error("POST: " + p.id8 + " is " + (g && g.review_verdict)); bad++; }
  else if (g.reviewed_by !== "director") { console.error("POST: " + p.id8 + " reviewed_by " + g.reviewed_by); bad++; }
  else if (!String(g.reviewed_at || "").startsWith(p.at.slice(0, 10))) {
    console.error("POST: " + p.id8 + " reviewed_at " + g.reviewed_at + " expected " + p.at.slice(0, 10)); bad++;
  } else if (!/ruled_in: PROMPT-/.test(String(g.review_note || ""))) {
    console.error("POST: " + p.id8 + " note names no prompt: " + JSON.stringify(g.review_note)); bad++;
  }
}
/* THE NEGATIVE HALF: no row outside the plan changed its verdict. The 46 R4/R5 accepts must still be accept
 * and must still carry their own note, and the 34 earlier `read` rows that this backfill does NOT cover must
 * still read `read`. */
let strays = 0;
for (const g of after) {
  if (all.has(g.question_id)) continue;
  const was = igBy.get(g.question_id);
  if ((was && was.review_verdict) !== g.review_verdict) {
    console.error("STRAY: " + g.question_id.slice(0, 8) + " changed from " +
      (was && was.review_verdict) + " to " + g.review_verdict);
    strays++;
  }
}
const counts = {};
for (const g of after) counts[g.review_verdict || "(none)"] = (counts[g.review_verdict || "(none)"] || 0) + 1;
console.log("");
console.log("  wrote    " + wrote + (failed ? ", FAILED " + failed : ""));
console.log("  post     " + bad + " row(s) not as planned");
console.log("  strays   " + strays + " row(s) outside the plan changed");
console.log("  verdicts now  " + JSON.stringify(counts));
if (bad || strays || failed) process.exitCode = 2;
