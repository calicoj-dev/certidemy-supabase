#!/usr/bin/env node
/**
 * thin-map-proposals.mjs -- proposals for the 14 AIMS-F tasks below 4 effective primaries.
 *
 * READ-ONLY. No writes beyond one markdown file, no model calls, no database writes, unknown flags exit 2.
 * Ruled PROMPT-87 s4 / PROMPT-91 s4: PROPOSE, do not promote. `promote-13-lifecycle-controls.mjs` already
 * refuses to write a clause its verdict file does not list, and the same discipline applies here.
 *
 * ============ THE CANDIDATE SET IS THE TASK'S OWN SUPPORTING LINKS, FIRST ============
 *
 * That is how 1.3 was fixed: all seven promoted clauses were already supporting for it. A supporting link
 * has already been judged relevant enough to attach, so it is the cheapest honest candidate. Library
 * clauses are proposed only where the supporting set cannot reach four -- and where that happens it is
 * stated plainly, because the ruling says a lower floor for a task is a better answer than a stretched map.
 *
 * ============ TWO RULES ARE APPLIED MECHANICALLY, NOT BY JUDGEMENT ============
 *
 *   42001 Annex B stays SUPPORTING. It is implementation guidance for an Annex A control; an item anchors
 *   on the control and the guidance feeds the explanation and the distractors. It also keeps `should`
 *   guidance from being keyed as a requirement.
 *
 *   ISO/IEC 17021-1 and 42006 are primary ONLY where the task is about certification, certification bodies
 *   or the certification cycle. None of these 14 is, so every CB-standard candidate here is out of scope.
 *
 * Everything else is a human verdict with its one line, recorded so the promotion is auditable.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { classifyPrimaries, MIN_WORDS } from "./lib/effective-primary.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const FLOOR = 4;

/* ---- the verdicts. clause -> [in|out, one line] per task ---- */
const V = {
  "1.2": {
    _note: "Roles with respect to AI systems: who the organization IS in the AI value chain.",
    "3.2": ["in", "the role allocation is expressed in terms of interested parties, so the definition is the task's vocabulary"],
    "4.3": ["out", "determining the SCOPE is task 2.2's subject, not the organization's role"],
    "A.3.2": ["in", "AI roles and responsibilities is the control the task is named after"],
    "A.10.2": ["in", "allocating responsibilities between the organization, its partners, suppliers and customers IS the role question"],
    "B.10.2": ["out", "Annex B guidance for A.10.2 -- stays supporting by rule"],
    "B.10.4": ["out", "Annex B guidance -- stays supporting by rule"],
  },
  "2.1": {
    _note: "Context and interested parties. Its supporting set cannot reach four; two library clauses are the task's literal subject.",
    "3.2": ["in", "the definition of interested party is the second half of the task statement"],
    "4.3": ["out", "scope belongs to 2.2"],
    "4.1": ["in", "LIBRARY: Understanding the organization and its context is the first half of the task, verbatim"],
    "4.2": ["in", "LIBRARY: Understanding the needs and expectations of interested parties is the second half, verbatim"],
  },
  "2.2": {
    _note: "Scope of the AIMS.",
    "4.1": ["in", "the scope is determined from the context, and 4.3 requires it to consider 4.1's issues"],
    "4.2": ["in", "4.3 requires the scope to consider interested-party requirements"],
    "4.4": ["in", "the AI management system clause is what the scope bounds"],
    "17021-1 9.1.1": ["out", "the certification body's application process; this task is the organization's own scope"],
    "42006 9.1.3": ["out", "scope of CERTIFICATION is a different object from scope of the AIMS, and 42006 is primary only on a certification task"],
  },
  "2.4": {
    _note: "Assigning roles, responsibilities and authorities.",
    "3.3": ["in", "top management is the party clause 5.3 assigns from, so the definition carries the task's subject"],
    "A.3.3": ["in", "reporting of concerns is an authority the organization must define and allocate"],
    "B.3.2": ["out", "Annex B guidance for A.3.2 -- stays supporting"],
    "B.3.3": ["out", "Annex B guidance for A.3.3 -- stays supporting"],
  },
  "2.7": {
    _note: "Risk assessment versus impact assessment. Both normative clauses are already linked and neither is primary.",
    "8.2": ["in", "the AI risk assessment clause is one of the two things the task differentiates"],
    "8.4": ["in", "the AI system impact assessment clause is the other"],
    "A.5.2": ["in", "the Annex A control for impact assessment, which is where its process requirements sit"],
  },
  "2.8": {
    _note: "Risk treatment and the Statement of Applicability.",
    "6.1.1": ["in", "planning general: the SoA is produced inside the 6.1 planning process"],
    "8.3": ["in", "AI risk treatment is the operational half of the task"],
    "A.1": ["in", "Annex A's own introduction states that not every control must be used, which is the SoA's whole point"],
    "B.1": ["out", "Annex B general guidance -- stays supporting"],
  },
  "3.1": {
    _note: "Resources and competence. Five Annex A resource controls are linked and all are supporting.",
    "A.4.2": ["in", "resource documentation is the first of the resource controls the task covers"],
    "A.4.3": ["in", "data resources"],
    "A.4.4": ["in", "tooling resources"],
    "A.4.5": ["in", "system and computing resources"],
    "A.4.6": ["in", "human resources, which is the competence half of the task"],
    "B.4.2": ["out", "Annex B guidance -- stays supporting"],
    "B.4.3": ["out", "Annex B guidance -- stays supporting"],
    "B.4.4": ["out", "Annex B guidance -- stays supporting"],
    "B.4.5": ["out", "Annex B guidance -- stays supporting"],
    "B.4.6": ["out", "Annex B guidance -- stays supporting"],
  },
  "3.2": {
    _note: "Awareness and communication.",
    "5.2": ["in", "the AI policy shall be communicated within the organization and available to interested parties -- the communication requirement in normative text"],
    "A.3.3": ["in", "reporting of concerns is the organization's internal communication channel"],
  },
  "3.4": {
    _note: "Operational planning and control.",
    "6.1.3": ["in", "8.1 implements the risk treatment 6.1.3 plans, so the treatment clause carries the control criteria"],
    "6.2": ["in", "AI objectives and the planning to achieve them are what operational control is measured against"],
    "6.3": ["in", "planning of changes is operational control over change"],
  },
  "4.2": {
    _note: "Annex A and the Statement of Applicability. The supporting set cannot reach four; two library clauses are the SoA itself.",
    "42006 9.1.3": ["out", "a CB standard on a non-certification task"],
    "A.1": ["in", "Annex A's introduction: the controls are a reference and not all are required, which is what the SoA records"],
    "B.1": ["out", "Annex B general guidance -- stays supporting"],
    "6.1.3": ["in", "LIBRARY: 6.1.3 f) is the clause that REQUIRES a statement of applicability to be produced"],
    "3.26": ["in", "LIBRARY: the definition of statement of applicability -- documentation of all necessary controls and the justification for inclusion or exclusion"],
  },
  "5.1": {
    _note: "Monitoring, measurement, analysis and evaluation.",
    "6.2": ["in", "objectives are what 9.1 evaluates performance against"],
    "A.6.2.6": ["in", "AI system operation and monitoring is the control carrying the monitoring requirement"],
    "B.6.2.6": ["out", "Annex B guidance for A.6.2.6 -- stays supporting"],
  },
  "5.2": {
    _note: "The internal audit requirement. One supporting link only; the two normative clauses must come from the library.",
    "3.18": ["in", "the definition of audit is the task's subject term"],
    "9.2.1": ["in", "LIBRARY: the internal audit requirement itself"],
    "9.2.2": ["in", "LIBRARY: the internal audit programme, which is what the requirement obliges"],
  },
  "5.3": {
    _note: "Management review inputs and results.",
    "10.1": ["in", "continual improvement is where the review's results go, and at 15 words it just clears the floor"],
    "9.3.2": ["in", "LIBRARY: management review INPUTS, the first half of the task statement"],
    "9.3.3": ["in", "LIBRARY: management review RESULTS, the second half"],
  },
  "5.4": {
    _note: "Nonconformity and corrective action. Nine supporting links, and most are the certification body's process rather than the organization's.",
    "17021-1 3.11": ["out", "the CB standard's definition; the organization's own is 42001 3.16"],
    "42001 3.13": ["out", "effectiveness is 13 words, under the " + MIN_WORDS + "-word floor, so it cannot carry a key"],
    "42001 3.16": ["in", "the definition of nonconformity, the task's first subject"],
    "42001 3.17": ["in", "the definition of corrective action, the task's second subject"],
    "17021-1 9.4.5.3": ["out", "recording audit findings is the CB's audit process"],
    "17021-1 9.4.9": ["out", "cause analysis by the CB, not by the organization"],
    "17021-1 9.4.10": ["out", "the CB's judgement of effectiveness, not the organization's action"],
    "42001 10.1": ["in", "continual improvement is the clause corrective action feeds"],
    "A.7.4": ["out", "quality of data is not about nonconformity"],
    "A.10.3": ["out", "suppliers is not about nonconformity"],
    "10.2": ["in", "LIBRARY: Nonconformity and corrective action is the clause the task is named after"],
  },
};

const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const roll = JSON.parse(readFileSync(join(ROOT, "AIMSF-ROLLOUT-SHORTFALL.json"), "utf8"));
const THIN = roll.per_task.filter((r) => r.effective < FLOOR).map((r) => r.code);

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F");
const tasks = (await getAll(KEY,
  "tasks?select=id,certification_id,code,statement,knowledge,skills,abilities&order=code"))
  .filter((t) => t.certification_id === certs[0].id);
const sp = await getAll(KEY, "source_passages?select=id,source_id,edition,clause,title&order=id");
const byId = new Map(sp.map((p) => [p.id, p]));
const clausesBySource = new Map();
for (const p of sp) {
  if (!clausesBySource.has(p.source_id)) clausesBySource.set(p.source_id, []);
  clausesBySource.get(p.source_id).push(p.clause);
}
const libBy = new Map(lib.passages.map((p) => [p.source_id + "|" + p.clause, p]));
const ts = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id,passage_id");

/* a verdict key may be bare ("A.3.2", meaning 42001) or qualified ("17021-1 3.11") */
const splitKey = (k) => {
  const m = /^(17021-1|42006|42001|ISO 19011)\s+(.+)$/.exec(k);
  if (m) return { source: m[1] === "ISO 19011" ? "ISO 19011" : "ISO/IEC " + m[1], clause: m[2] };
  return { source: "ISO/IEC 42001", clause: k };
};
const effOf = (source, clause) => {
  const full = libBy.get(source + "|" + clause);
  const [one] = classifyPrimaries([clause], () => full, clausesBySource.get(source) || []);
  return one;
};

const md = [];
const p = (s = "") => md.push(s);
p("# AIMS-F thin-map proposals");
p("");
p("**Read-only. Nothing is promoted.** Ruled PROMPT-87 s4. `promote-13-lifecycle-controls.mjs` refuses to");
p("write a clause a verdict file does not list, and the same discipline applies to whatever is ruled here.");
p("");
p("The candidate set is each task's own SUPPORTING links first -- that is how 1.3 was fixed, where all seven");
p("promoted clauses were already supporting. Library clauses are proposed only where the supporting set");
p("cannot reach " + FLOOR + ", and marked **LIBRARY**.");
p("");
p("Two rules are applied mechanically rather than judged: **42001 Annex B stays supporting** (guidance for");
p("an Annex A control), and **ISO/IEC 17021-1 and 42006 are primary only on a certification task** -- none");
p("of these 14 is one.");
p("");
const summary = [];
for (const code of THIN) {
  const t = tasks.find((x) => x.code === code);
  const spec = V[code] || {};
  const linked = ts.filter((r) => r.task_id === t.id).map((r) => ({ ...byId.get(r.passage_id), role: r.role }))
    .filter((x) => x.clause);
  const effNow = linked.filter((x) => x.role === "primary" && effOf(x.source_id, x.clause).effective).length;

  p("---");
  p("");
  p("## Task " + code + "   —   " + effNow + " effective primaries now");
  p("");
  p("**" + String(t.statement).replace(/\s+/g, " ") + "**");
  p("");
  if (spec._note) { p("*" + spec._note + "*"); p(""); }
  for (const [label, val] of [["Knowledge", t.knowledge], ["Skills", t.skills], ["Abilities", t.abilities]]) {
    if (!val) continue;
    p("- *" + label + ":* " + String(val).replace(/\s+/g, " ").slice(0, 400));
  }
  p("");
  p("| candidate | source | words | verdict | reasoning |");
  p("|---|---|---|---|---|");
  let gained = 0;
  const outOfScope = [];
  for (const [k, [verdict, why]] of Object.entries(spec)) {
    if (k === "_note") continue;
    const { source, clause } = splitKey(k);
    const e = effOf(source, clause);
    const isLibrary = !linked.some((x) => x.source_id === source && x.clause === clause);
    if (verdict === "in" && e.effective) gained++;
    if (verdict === "out") outOfScope.push(k + " — " + why);
    p("| `" + clause + "`" + (isLibrary ? " **LIBRARY**" : "") + " | " +
      String(source).replace("ISO/IEC ", "") + " | " + e.words + " | " +
      (verdict === "in" ? (e.effective ? "**in scope**" : "in scope but **not effective**") : "out of scope") +
      " | " + why + " |");
  }
  const after = effNow + gained;
  p("");
  p("**Effective primaries if the in-scope candidates are promoted: " + effNow + " → " + after + "**" +
    (after >= FLOOR ? "" : "  ⚠ **still below " + FLOOR + "**"));
  p("");
  if (outOfScope.length) {
    p("Withheld (" + outOfScope.length + "): " + outOfScope.length + " candidate(s) reported out of scope");
    p("rather than promoted, as ruled.");
    p("");
  }
  summary.push({ code, effNow, after, reaches: after >= FLOOR,
    promote: Object.entries(spec).filter(([k, v]) => k !== "_note" && v[0] === "in").map(([k]) => k),
    withheld: outOfScope.length });
}
p("---");
p("");
p("## Summary");
p("");
p("| task | now | if promoted | reaches " + FLOOR + " | to promote |");
p("|---|---|---|---|---|");
for (const s of summary) {
  p("| " + s.code + " | " + s.effNow + " | " + s.after + " | " + (s.reaches ? "yes" : "**no**") + " | " +
    s.promote.join(", ") + " |");
}
p("");
const short = summary.filter((s) => !s.reaches);
if (short.length) {
  p("**" + short.length + " task(s) still below " + FLOOR + " after everything in scope is promoted.**");
  p("Stated plainly, as ruled: a lower floor for these is a better answer than a stretched map.");
  for (const s of short) p("- **" + s.code + "**: " + s.effNow + " → " + s.after);
} else {
  p("**Every one of the " + summary.length + " tasks reaches " + FLOOR + "** on in-scope candidates alone.");
}
p("");
writeFileSync(join(ROOT, "THIN-MAP-PROPOSALS-AIMSF.md"), md.join("\n") + "\n", "utf8");
writeFileSync(join(ROOT, "THIN-MAP-PROPOSALS-AIMSF.json"), JSON.stringify({
  floor: FLOOR, tasks: summary,
}, null, 1) + String.fromCharCode(10), "utf8");
console.log("task   now  after  reaches   promote");
for (const s of summary) {
  console.log("  " + s.code.padEnd(5) + String(s.effNow).padStart(3) + String(s.after).padStart(7) +
    "   " + (s.reaches ? "yes" : "NO ") + "     " + s.promote.join(" "));
}
console.log("\nwrote THIN-MAP-PROPOSALS-AIMSF.md and .json   (nothing promoted)");
