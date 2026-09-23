#!/usr/bin/env node
/**
 * score-rewrites.mjs -- both gates on a DRAFT, before it is read or applied.
 *
 * READ-ONLY. No flags but --json. Unknown flags exit 2.
 *
 * ============ WHY THE DRAFT IS SCORED, NOT ONLY THE APPLIED TEXT ============
 *
 * The draft score is a FILTER and costs a minute. The applied score is the
 * RECORD. They answer different questions and running only the second means an
 * expensive human review runs on text the cheap gate would have rejected.
 *
 * This batch is the occasion: rewrite #13 restores four determinations of
 * clause 9.1 in the clause's own order, and a faithful restatement in the
 * clause's sequence is CLOSER to reproduction than the loose paraphrase it
 * replaces. Accurate is not the test. Whether we reproduce is the test.
 *
 * ============ TWO GATES, AND THE SECOND IS THE NEW ONE ============
 *
 * LEAK   scripts/lib/leak-score.mjs against the indexed ISO corpus. Fires on
 *        run >= 4 with coverage >= 0.60, or on run >= 10 regardless.
 *
 * DRIFT  does the rewrite PRESERVE what the original clause text carried --
 *        modal, conjunction, quantifier, defined term? This is the positive
 *        obligation nothing checked before this week. It is measured against
 *        the ISO text the span started as, not against the drifted version,
 *        because the drifted version is the thing being corrected.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSources, score, firesUnion, matchingSources, MIN_RUN, MIN_COV, ABS_RUN } from "./lib/leak-score.mjs";

const KNOWN = new Set(["--json"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
}
const JSON_OUT = process.argv.includes("--json");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const lc = (s) => String(s || "").toLowerCase().replace(/[*_`>|]/g, " ").replace(/\s+/g, " ");
const W = (s) => lc(s).split(/[^a-z0-9']+/).filter(Boolean);
const n = (ws, t) => ws.filter((w) => w === t).length;
const MODALS = ["shall", "should", "must", "may", "can"];
const CONJ = ["and", "or"];
const QUANT = ["all", "every", "any", "each", "not", "no"];
const TERMS = ["available", "retained", "determine", "determined", "implement", "appropriate",
  "necessary", "relevant", "ensure", "objective", "impartial", "planned", "intervals", "required"];

/* id, slug, address, iso = the text the span was BEFORE any repair (ISO's own
 * words), rewrite = the draft. The drifted middle version is not scored: it is
 * the thing being replaced. */
const DRAFTS = [
  { id: 1, slug: "01-03-the-ai-system-life-cycle", address: "42001 clause 8.2",
    iso: "assessments at planned intervals, or when significant changes are proposed or occur",
    rewrite: "Clause 8.2 sets two independent triggers for a risk assessment: the planned interval, or a significant change being proposed or occurring. Either one is enough on its own." },
  { id: 2, slug: "01-03-the-ai-system-life-cycle", address: "42001 clause 8.2",
    iso: "performed at planned intervals or when significant changes are proposed or occur.",
    rewrite: "The obligation fires on the planned interval or on a significant change -- whichever comes first, and neither waits for the other." },
  { id: 3, slug: "02-06-the-ai-system-impact-assessment", address: "42001 clause 8.4",
    iso: "assessments are performed at planned intervals, or when significant changes are proposed to occur",
    rewrite: "Clause 8.4 requires the impact assessment to be performed at planned intervals or when a significant change is proposed or occurs. Two triggers, not a sequence." },
  { id: 4, slug: "03-06-data-for-ai-systems", address: "42001 A.7 data controls",
    iso: "known or potential biases or other systematic errors",
    rewrite: "A.7 asks the organization to look for biases that are known, biases that are merely potential, or other systematic errors -- any one of the three is in scope, and none of them depends on another being present." },
  { id: 5, slug: "03-03-documented-information", address: "42001 clause 7.5.3",
    iso: "is available and suitable for use where and when it is needed, and",
    rewrite: "Clause 7.5.3 requires documented information to be available -- obtainable where and when it is needed, and fit to use when it arrives. Availability is not the same obligation as retention, and 7.5.3 asks for the first." },
  { id: 6, slug: "03-04-operational-planning-and-control", address: "42001 clause 8.1",
    iso: "be available to the extent necessary to have confidence that the processes",
    rewrite: "Clause 8.1 requires documented information to be available to the extent needed for confidence that the processes were carried out as planned. The test is whether it can be produced, not whether it was archived." },
  { id: 7, slug: "03-01-resources-and-competence", address: "42001 clause 7.2",
    iso: "are competent on the basis of appropriate education, training or experience",
    rewrite: "Clause 7.2 asks the organization to establish competence on the basis of appropriate education, training or experience -- appropriate to the work in question, which is what makes it auditable against a role rather than against a qualification." },
  { id: 8, slug: "03-02-awareness-and-communication", address: "42001 clause 7.3",
    iso: "Persons doing work under the organization's control shall be aware of:",
    rewrite: "Clause 7.3 places a requirement -- shall -- on the organization: persons doing work under its control are to be made aware of the items listed below." },
  { id: 9, slug: "03-02-awareness-and-communication", address: "42001 clause 7.4",
    iso: "determine the internal and external communications relevant to the AI management system, and",
    rewrite: "Clause 7.4 requires the organization to determine the internal and external communications relevant to the AI management system -- determine is the clause's verb and it implies a recorded decision, not an impression." },
  { id: 10, slug: "03-03-documented-information", address: "42001 clause 7.5.3",
    iso: "Documented information of external origin, determined by the organization to be necessary for the planning and operation of the AI management system",
    rewrite: "Clause 7.5.3 covers documented information of external origin that the organization has determined to be necessary for planning and operating the AI management system. External origin and a recorded determination are both part of what brings a document into scope." },
  { id: 11, slug: "03-04-operational-planning-and-control", address: "42001 clause 8.1",
    iso: "plan, implement and control the processes needed to meet requirements and to implement the actions determined in clause 6",
    rewrite: "Clause 8.1 requires the organization to plan, implement and control the processes needed to meet its requirements and to carry out the clause 6 actions. Implement is the clause's word and it is the middle of three distinct obligations." },
  { id: 12, slug: "04-01-annex-a-structure", address: "42001 Annex A intro", held: "next batch, on the reserved-term ground alone",
    iso: "Not all the control objectives and controls listed are required to be used, and the organization can design and implement its own controls.",
    rewrite: "Annex A is a reference, not a checklist: the organization is not required to use every control objective and control listed, and it can design and implement controls of its own. The permission is real and the annex says so in its own opening." },
  { id: 13, slug: "05-01-aims-monitoring-and-measurement", address: "42001 clause 9.1", predicted: "expected to fire the absolute run floor",
    iso: "What needs to be monitored and measured. The methods for monitoring, measurement, analysis and evaluation, as applicable, to ensure valid results. When the monitoring and measuring is performed.",
    rewrite: "Clause 9.1 requires the organization to determine four things: what needs to be monitored and measured; the methods for monitoring, measurement, analysis and evaluation, as applicable, to ensure valid results; when monitoring and measurement are performed; and when the results are analysed and evaluated." },
  { id: 14, slug: "05-02-aims-internal-audit", address: "42001 clause 9.2.2",
    iso: "conducted so as to ensure objectivity and the impartiality of the audit process",
    rewrite: "Clause 9.2.2 b) requires the organization to select auditors and conduct audits so as to ensure the objectivity and impartiality of the audit process. Objectivity and impartiality are properties of the process the organization must secure, not dispositions of the individual auditor." },
  /* CORRECTED per the ruling: the lettered item carries the obligation and the
   * explanation follows OUTSIDE the list, so the rewrite does not keep the
   * frame it exists to remove. Scored as the two parts together, which is what
   * lands in the body. */
  { id: 15, slug: "isms-ia-04-02-demonstrated-not-stated", address: "27001 clause 5.2 g)",
    iso: "be available to interested parties, as appropriate",
    rewrite: "- g) be available to interested parties, as appropriate\n\nAvailable to is a narrower obligation than published. The clause is satisfied by furnishing the policy on request where it is appropriate to do so." },
];

const sources = buildSources();
const rows = [];
for (const d of DRAFTS) {
  const s = score(d.rewrite, sources);
  const leak = {
    run: s.unionRun, cov: Number((s.unionCov ?? 0).toFixed(2)),
    /* FROM score()'s OWN `source` FIELD. The first version called
     * matchingSources(wholeText, sources), which expects a MATCHED SPAN and
     * returned [] for every row -- so every draft reported "(none reported)"
     * and the attribution looked absent rather than wrong. */
    fires: firesUnion(s), source: s.source || "(no match)",
  };
  const a = W(d.iso), b = W(d.rewrite);
  const lost = [];
  for (const [kind, list] of [["modal", MODALS], ["conj", CONJ], ["quant", QUANT], ["term", TERMS]]) {
    for (const t of list) {
      const da = n(a, t), db = n(b, t);
      if (da > 0 && db === 0) lost.push(kind + ":" + t);
    }
  }
  rows.push({ ...d, leak, lost });
}

console.log("");
console.log("DRAFT SCORES -- before apply, before review");
console.log("  leak gate: run >= " + MIN_RUN + " AND cov >= " + MIN_COV + ", OR run >= " + ABS_RUN);
console.log("  drift gate: a token the ISO span carried and the rewrite does not");
console.log("");
console.log("   #  slug                                      run   cov   FIRES   lost from the clause");
for (const r of rows) {
  console.log("  " + String(r.id).padStart(2) + "  " + r.slug.slice(0, 40).padEnd(42) +
    String(r.leak.run).padStart(3) + "w " + String(r.leak.cov).padStart(5) + "   " +
    (r.leak.fires ? "**YES**" : "  no  ") + "   " + (r.lost.join(", ") || "-"));
}

const fired = rows.filter((r) => r.leak.fires);
const nearFloor = rows.filter((r) => !r.leak.fires && r.leak.run >= 8);
const above0 = rows.filter((r) => r.leak.run > 0);

console.log("");
console.log("  FIRES the leak gate        " + fired.length + (fired.length ? "   [" + fired.map((r) => "#" + r.id).join(", ") + "]" : ""));
console.log("  run 8 or 9, under the floor " + nearFloor.length + (nearFloor.length ? "   [" + nearFloor.map((r) => "#" + r.id).join(", ") + "]  -- a span the floor did not catch, not one that passed" : ""));
console.log("  scores above zero          " + above0.length + (above0.length ? "   [" + above0.map((r) => "#" + r.id + " " + r.leak.run + "w").join(", ") + "]" : ""));
console.log("  loses a clause token       " + rows.filter((r) => r.lost.length).length);

for (const r of rows.filter((x) => x.leak.run > 0)) {
  console.log("");
  console.log("  #" + r.id + "  " + r.slug + "   [" + r.address + "]");
  console.log("     run " + r.leak.run + "w   cov " + r.leak.cov + "   fires " + r.leak.fires +
    "   source: " + r.leak.source);
  if (r.predicted) console.log("     PREDICTED: " + r.predicted);
}

if (JSON_OUT) {
  writeFileSync(join(ROOT, "REWRITE-DRAFT-SCORES.json"),
    JSON.stringify({ measured: new Date().toISOString(), gate: { MIN_RUN, MIN_COV, ABS_RUN }, rows }, null, 2), "utf8");
  console.log("");
  console.log("  wrote REWRITE-DRAFT-SCORES.json");
}
