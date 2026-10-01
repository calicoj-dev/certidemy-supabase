#!/usr/bin/env node
/**
 * emit-pilot-read-doc.mjs -- the rows carrying `read`, in full, with today's gate results, for a verdict.
 *
 * READ-ONLY apart from one report. No database writes, no model calls. Unknown flags exit 2.
 *
 * Ruled PROMPT-100 s1b: *"I read them before they're accepted. No blanket upgrade... I can't confirm from
 * memory that 'read' in the pilot meant 'accept', and a verdict I didn't give must not be recorded as mine."*
 *
 * ============ WHY THIS CANNOT BE A LIST OF IDS ============
 *
 * The director is being asked for a verdict per item, so the document has to contain the item: stem, all four
 * options with the key marked, and the explanation. An id and a task code would make him open something else to
 * rule, and the thing he would open is the bank.
 *
 * ============ AND THE GATES ARE RE-RUN AGAINST THE LIBRARY AS IT IS TODAY ============
 *
 * These rows were written before 38 Annex A passages were de-columned, twelve anchors were re-cut and A.5.4 was
 * repaired from character coordinates. A gate result from the run that produced them is a fact about a document
 * that has since changed -- which is the condition the approval script re-checks for exactly this reason.
 *
 * Five gates, named by the ruling: quote-noise, verbatim, anchor-is-primary, clause-number-recall and the
 * letter-reference check. Each prints PASS, FAIL with its reason, or UNASSERTED -- never a blank, because a
 * gate that could not run is not a gate that passed.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { gateVerbatim, gateAnchorIsPrimary } from "./lib/grounded-gates.mjs";
import { gateQuoteNoise } from "./lib/quote-noise.mjs";
import { clauseNumberRecall } from "./lib/clause-number-recall.mjs";
import { explanationOptionRef } from "./lib/explanation-option-ref.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY apart from the report; takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KEY = requireKey(HERE);
const CERT = "AIMS-F";

const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const MAP = JSON.parse(readFileSync(join(ROOT, CERT + "-TASK-SOURCES.json"), "utf8"));
/* the generator's own view: this standard and edition. Keyed on the bare clause, as the gates are TODAY --
 * the (source, edition, clause) re-key is PROMPT-100 s2 and this document must describe the items as the
 * current gates see them, not as a future refactor will. */
const passagesByKey = new Map(lib.passages
  .filter((p) => p.source_id === MAP.standard && p.edition === MAP.edition)
  .map((p) => [p.clause, p]));
const titleOf = (c) => (passagesByKey.get(c) || {}).title || null;

const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
const qs = await getAll(KEY, "quiz_questions?select=id,task_id,question_text,options,correct_answer," +
  "explanation,status,visibility,pool,is_exam_scope,created_at&certification_id=eq." + cert.id +
  "&language=eq.en&retired_at=is.null&order=created_at");
const tasks = (await getAll(KEY, "tasks?select=id,code,statement,certification_id&order=code"))
  .filter((t) => t.certification_id === cert.id);
const taskById = new Map(tasks.map((t) => [t.id, t]));
const ig = new Map((await getAll(KEY, "item_grounding?select=question_id,source_id,key_support_clause," +
  "key_support,edition,review_verdict,reviewed_at,review_note,solver&order=question_id"))
  .map((g) => [g.question_id, g]));

/* the task's primary and supporting clauses, for anchor-is-primary */
const sp = await getAll(KEY, "source_passages?select=id,source_id,edition,clause&order=id");
const spById = new Map(sp.map((p) => [p.id, p]));
const ts = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id,passage_id");
const primOf = new Map(), suppOf = new Map();
for (const r of ts) {
  const p = spById.get(r.passage_id);
  if (!p) continue;
  const m = r.role === "primary" ? primOf : suppOf;
  if (!m.has(r.task_id)) m.set(r.task_id, []);
  m.get(r.task_id).push(p.clause);
}

/* ---- the population: every grounded row whose verdict is `read`, PLUS the one with none ---- */
const subject = [];
for (const q of qs) {
  const g = ig.get(q.id);
  if (!g) continue;
  if (g.review_verdict === "read") subject.push({ q, g, why: "verdict `read`" });
  else if (!g.review_verdict) subject.push({ q, g, why: "NO verdict recorded" });
}
console.log("rows awaiting a verdict: " + subject.length +
  "   (read " + subject.filter((s) => s.why !== "NO verdict recorded").length +
  ", none " + subject.filter((s) => s.why === "NO verdict recorded").length + ")");

const optText = (o) => String((o && (o.text ?? o.label)) ?? o ?? "");
const optId = (o) => String((o && (o.id ?? o.key)) ?? "");

function gates(q, g, taskId) {
  const item = {
    question_text: q.question_text,
    options: Array.isArray(q.options) ? q.options : [],
    explanation: q.explanation,
    key_support_clause: g.key_support_clause,
    key_support: g.key_support,
    /* THE BANK HOLDS ONLY THE KEY ANCHOR. `item_grounding` has no `distractor_support` column -- distractor
     * anchors live in the generator artifact. So `verbatim` here checks the KEY, which is the anchor the
     * verdict is about, and that is stated rather than left to look like a full check. */
    distractor_support: [],
    correct_index: (Array.isArray(q.options) ? q.options : [])
      .findIndex((o) => optId(o) === String(q.correct_answer)),
  };
  const out = [];
  const add = (name, r) => {
    if (!r) { out.push({ name, state: "UNASSERTED", why: "the gate returned nothing" }); return; }
    if (r.pass === null || r.pass === undefined) {
      out.push({ name, state: "UNASSERTED", why: r.reason || "" });
    } else {
      out.push({ name, state: r.pass ? "PASS" : "FAIL", why: r.pass ? "" : (r.reason || "") });
    }
  };
  try { add("quote-noise", gateQuoteNoise(item, titleOf)); } catch (e) { add("quote-noise", null); void e; }
  try { add("verbatim", gateVerbatim(item, passagesByKey)); } catch (e) { add("verbatim", null); void e; }
  try {
    add("anchor-is-primary",
      gateAnchorIsPrimary(item, primOf.get(taskId) || [], suppOf.get(taskId) || []));
  } catch (e) { add("anchor-is-primary", null); void e; }
  try {
    const r = clauseNumberRecall(item);
    add("clause-number-recall", r);
  } catch (e) { add("clause-number-recall", null); void e; }
  try {
    const r = explanationOptionRef(item);
    add("letter-reference", r && { pass: r.pass, reason: (r.hits || []).map((h) => h.rule + ": " + JSON.stringify(h.match)).join("; ") });
  } catch (e) { add("letter-reference", null); void e; }
  return out;
}

const md = [];
const p = (s = "") => md.push(s);
p("# AIMS-F: the rows carrying `read`, for a verdict");
p("");
p("**Ruled PROMPT-100 s1b.** No blanket upgrade: *\"a verdict I didn't give must not be recorded as mine.\"*");
p("Nothing on these rows has changed. Each needs **accept** or **reject**, by id.");
p("");
p("## How to read this");
p("");
p("- **" + subject.length + " items**: the rows whose `item_grounding.review_verdict` is `read`, plus the one");
p("  carrying no verdict at all. The second is marked NO VERDICT and is a survivor of");
p("  `PILOT-AIMSF-TASK-1-3-R2.json`, an artifact no prompt ever ruled on.");
p("- **The gates were re-run today**, against the library as it is now -- after 38 Annex A passages were");
p("  de-columned, twelve anchors re-cut, and A.5.4 repaired from character coordinates. A gate result from the");
p("  run that wrote these items is a fact about a document that has since changed.");
p("- A gate prints PASS, FAIL with its reason, or **UNASSERTED**. Never a blank: a gate that could not run is");
p("  not a gate that passed.");
p("- The key is marked **(KEY)**. `read` counts toward no floor until these are ruled, which is why the");
p("  completion report stands at 11 of 35 rather than 28.");
p("");

/* ---- the summary first, so a reader can see the shape before reading 35 items ---- */
const rowsOut = [];
for (const s of subject) {
  const t = taskById.get(s.q.task_id);
  const gs = gates(s.q, s.g, s.q.task_id);
  rowsOut.push({ s, t, gs });
}
const fails = rowsOut.filter((r) => r.gs.some((g) => g.state === "FAIL"));
const unass = rowsOut.filter((r) => r.gs.some((g) => g.state === "UNASSERTED"));
p("## Summary");
p("");
p("| | |");
p("|---|---|");
p("| items awaiting a verdict | **" + rowsOut.length + "** |");
p("| clean on all five gates | " + (rowsOut.length - fails.length) + " |");
p("| at least one FAIL today | **" + fails.length + "**" +
  (fails.length ? " -- " + fails.map((r) => r.s.q.id.slice(0, 8)).join(", ") : "") + " |");
p("| at least one UNASSERTED | " + unass.length +
  (unass.length ? " -- " + unass.map((r) => r.s.q.id.slice(0, 8)).join(", ") : "") + " |");
p("");
const byGate = {};
for (const r of rowsOut) for (const g of r.gs) {
  byGate[g.name] = byGate[g.name] || { PASS: 0, FAIL: 0, UNASSERTED: 0 };
  byGate[g.name][g.state]++;
}
p("| gate | pass | fail | unasserted |");
p("|---|---|---|---|");
for (const [name, c] of Object.entries(byGate)) {
  p("| `" + name + "` | " + c.PASS + " | " + (c.FAIL ? "**" + c.FAIL + "**" : "0") + " | " + c.UNASSERTED + " |");
}
p("");
p("---");
p("");

for (const { s, t, gs } of rowsOut) {
  const q = s.q, g = s.g;
  const opts = Array.isArray(q.options) ? q.options : [];
  p("## `" + q.id.slice(0, 8) + "`  task " + (t ? t.code : "?") +
    (s.why === "NO VERDICT recorded" ? "  **NO VERDICT**" : ""));
  p("");
  p("- **verdict today**: " + (g.review_verdict ? "`" + g.review_verdict + "`" : "**none**") +
    (g.reviewed_at ? ", recorded " + String(g.reviewed_at).slice(0, 10) : ""));
  p("- **anchor**: " + g.source_id + " **" + g.key_support_clause + "**" +
    (titleOf(g.key_support_clause) ? "  (" + titleOf(g.key_support_clause) + ")" : ""));
  p("- **task**: " + (t ? t.statement : "?"));
  p("- **row**: status `" + q.status + "`, visibility `" + q.visibility + "`, pool `" + q.pool +
    "`, is_exam_scope `" + q.is_exam_scope + "`");
  p("");
  p("**Stem.** " + String(q.question_text || "").replace(/\s+/g, " ").trim());
  p("");
  for (const o of opts) {
    const isKey = optId(o) === String(q.correct_answer);
    p("- " + (isKey ? "**(KEY)** " : "") + optText(o).replace(/\s+/g, " ").trim());
  }
  p("");
  p("**Explanation.** " + String(q.explanation || "(none)").replace(/\s+/g, " ").trim());
  p("");
  /* ============ A FAILING GATE GETS ITS DIAGNOSIS, NOT JUST ITS REASON ============
   *
   * `verbatim: key: not verbatim in A.9.3` is true and tells the director nothing he can rule on. The useful
   * fact is WHY: the recorded anchor may be interleaved text captured before that passage was de-columned, in
   * which case the ITEM is probably sound and its stored quotation is stale -- a re-quote, not a reject.
   *
   * So when verbatim fails, the document names what the anchor actually contains and which passage, if any,
   * does contain it verbatim. A container match is itself the tell: a container's text is its children's run
   * together, so matching only the container means the quotation spans a column boundary.
   */
  if (gs.some((x) => x.name === "verbatim" && x.state === "FAIL")) {
    const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    const q2 = norm(g.key_support);
    const holders = q2 ? lib.passages.filter((x) => norm((x.title || "") + " " + x.text).includes(q2)) : [];
    const held = passagesByKey.get(g.key_support_clause);
    p("**Why verbatim fails.** The row's stored `key_support` is:");
    p("");
    p("> " + String(g.key_support || "(none)").replace(/\s+/g, " ").trim());
    p("");
    p("The library's " + g.key_support_clause + " now reads:");
    p("");
    p("> " + (held ? String(held.text).replace(/\s+/g, " ").trim() : "(the clause is not held)"));
    p("");
    if (holders.length) {
      p("That stored text appears verbatim in: " +
        holders.map((h) => "`" + h.source_id + " " + h.clause + "`" +
          (h.title ? " (" + h.title + ")" : "")).join(", ") + ".");
      if (holders.some((h) => lib.passages.some((o) => o.source_id === h.source_id &&
        o.clause !== h.clause && o.clause.startsWith(h.clause + ".")))) {
        p("");
        p("**That is a CONTAINER**, whose text is its children's run together -- so the stored quotation spans a");
        p("column boundary. It was captured before this passage was de-columned. The likely repair is a");
        p("**re-quote from the clean clause**, not a reject: the stored anchor is stale, which says nothing");
        p("about whether the item is sound.");
      }
    } else {
      p("That stored text appears verbatim in **no held passage**, which is a stronger finding: it is not a");
      p("stale quotation of a clause that moved, it is text no indexed document contains.");
    }
    p("");
  }
  p("**Gates, re-run today**");
  p("");
  p("| gate | result |");
  p("|---|---|");
  for (const x of gs) {
    p("| `" + x.name + "` | " + (x.state === "PASS" ? "PASS" : "**" + x.state + "**" +
      (x.why ? " -- " + String(x.why).replace(/\|/g, "\\|").slice(0, 170) : "")) + " |");
  }
  p("");
  p("**Verdict:** accept / reject  _(and a reason if reject)_");
  p("");
  p("---");
  p("");
}
p("## What this document does not decide");
p("");
p("- **The gates are necessary, not sufficient.** Measured recall of the strongest instrument against the");
p("  director's own read of 40 items was 7 of 14, and 5 of the 9 that were a named defect in the key. A row");
p("  clean on all five gates can still have a wrong key.");
p("- **Nothing here is servable.** Every row is `pending_review`, and `generate-mock-exam` filters `approved`.");
p("- **A reject needs its reason recorded**, because a rejection is the one disposition no artifact can derive.");

writeFileSync(join(ROOT, "AIMSF-PILOT-READ.md"), md.join("\n") + "\n", "utf8");
console.log("");
console.log("  items            " + rowsOut.length);
console.log("  with a FAIL      " + fails.length +
  (fails.length ? "   " + fails.map((r) => r.s.q.id.slice(0, 8)).join(", ") : ""));
console.log("  with UNASSERTED  " + unass.length);
for (const [name, c] of Object.entries(byGate)) {
  console.log("    " + name.padEnd(22) + "pass " + String(c.PASS).padStart(3) +
    "   fail " + String(c.FAIL).padStart(3) + "   unasserted " + String(c.UNASSERTED).padStart(3));
}
console.log("");
console.log("wrote AIMSF-PILOT-READ.md   (nothing in the bank changed)");
