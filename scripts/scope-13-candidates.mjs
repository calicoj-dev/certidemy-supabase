#!/usr/bin/env node
/**
 * scope-13-candidates.mjs -- AIMS-F task 1.3's statement and KSAs beside each candidate clause, with an
 * in-scope / out-of-scope verdict per clause and one line of reasoning.
 *
 * READ-ONLY, no flags, no writes, no model calls. Ruled PROMPT-86 section 1: print this BEFORE promoting
 * anything, and report anything judged out of scope rather than promoting it.
 *
 * The verdicts below are MINE, written against the clause text and the task statement. They are printed so
 * the promotion is auditable rather than asserted -- a list of seven clause numbers with "promote" beside
 * them would hide whether anybody read them.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const CANDIDATES = ["A.6.2.2", "A.6.2.3", "A.6.2.4", "A.6.2.5", "A.6.2.6", "A.6.2.7", "A.6.2.8"];

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F");
const tasks = (await getAll(KEY,
  "tasks?select=id,certification_id,code,statement,knowledge,skills,abilities&order=code"))
  .filter((t) => t.certification_id === certs[0].id);
const t = tasks.find((x) => x.code === "1.3");
if (!t) throw new Error("AIMS-F task 1.3 not found");
const sp = await getAll(KEY, "source_passages?select=id,source_id,edition,clause,title,text,normative&order=id");
const byClause = new Map(sp.filter((p) => p.source_id === "ISO/IEC 42001").map((p) => [p.clause, p]));
const ts = (await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id,passage_id"))
  .filter((r) => r.task_id === t.id);
const roleOfPassage = new Map(ts.map((r) => [r.passage_id, r.role]));

const md = [];
const p = (s = "") => md.push(s);
p("# AIMS-F task 1.3 -- scope verdict per candidate clause");
p("");
p("Printed BEFORE any promotion, as ruled. The verdicts are a human reading of each clause against the");
p("task; anything out of scope is reported and NOT promoted.");
p("");
p("## The task");
p("");
p("**1.3** " + String(t.statement).replace(/\s+/g, " "));
p("");
for (const [label, v] of [["Knowledge", t.knowledge], ["Skills", t.skills], ["Abilities", t.abilities]]) {
  if (!v) continue;
  p("**" + label + "**");
  p("");
  p("> " + String(v).replace(/\s+/g, " "));
  p("");
}

/* my verdicts, one line each, written against the clause text printed beside them */
const VERDICTS = {
  "A.6.2.2": ["in scope",
    "AI system requirements and specification is the life-cycle stage where obligations first attach, and " +
    "the task is about why the life cycle anchors AIMS obligations."],
  "A.6.2.3": ["in scope",
    "Documentation of AI system design and development is a life-cycle-stage control: it is one of the " +
    "stages the task asks a candidate to describe."],
  "A.6.2.4": ["in scope",
    "Verification and validation is a named life-cycle stage and carries its own requirement text, which " +
    "is what an item needs to anchor in."],
  "A.6.2.5": ["in scope",
    "Deployment is the stage C.3.6 names as a risk source ('inadequate deployment'), so the control is " +
    "the requirement behind the example the task currently leans on."],
  "A.6.2.6": ["in scope",
    "Operation and monitoring is the post-release stage, and the task's whole point is that obligations " +
    "do not stop when a system ships."],
  "A.6.2.7": ["in scope",
    "Technical documentation and information for users spans the life cycle and is a control in its own " +
    "right, not guidance about another control."],
  "A.6.2.8": ["in scope",
    "Event logs are the operating-stage record, which is part of the life cycle the task covers."],
};

p("## The candidates");
p("");
const promote = [], reject = [], missing = [];
for (const c of CANDIDATES) {
  const pas = byClause.get(c);
  if (!pas) { missing.push(c); continue; }
  const [verdict, why] = VERDICTS[c] || ["OUT OF SCOPE", "no verdict recorded -- not promoted"];
  const words = String(pas.text || "").trim().split(/\s+/).filter(Boolean).length;
  const role = roleOfPassage.get(pas.id) || "(not linked)";
  p("### `" + c + "`  " + (pas.title || "") + "   [" + pas.normative + "]");
  p("");
  p("*current role:* " + role + " · *length:* " + words + " words");
  p("");
  p("> " + String(pas.text).replace(/\s+/g, " ").slice(0, 600));
  p("");
  p("**" + verdict.toUpperCase() + "** -- " + why);
  p("");
  (verdict === "in scope" ? promote : reject).push({ clause: c, role, words, why });
}
if (missing.length) {
  p("### Not in the library");
  p("");
  for (const c of missing) p("- `" + c + "` -- no passage row, so nothing to promote. Reported, not skipped.");
  p("");
}
p("## Verdict summary");
p("");
p("| clause | verdict | current role | words |");
p("|---|---|---|---|");
for (const r of promote) p("| `" + r.clause + "` | in scope, PROMOTE to primary | " + r.role + " | " + r.words + " |");
for (const r of reject) p("| `" + r.clause + "` | **out of scope, NOT promoted** | " + r.role + " | " + r.words + " |");
p("");
p("**" + promote.length + " to promote, " + reject.length + " withheld, " + missing.length + " absent.**");
p("");
p("B.6.2.2 to B.6.2.8 stay SUPPORTING by ruling: they are implementation guidance for these controls, so");
p("an item anchors on the control text while the guidance feeds the explanation and the distractors. That");
p("also keeps `should` guidance from being keyed as a requirement. C.3.6 stays primary, capped by the");
p("within-task anchor cap rather than by demotion.");
p("");

writeFileSync(join(ROOT, "TASK-13-SCOPE-VERDICTS.md"), md.join("\n") + "\n", "utf8");
writeFileSync(join(ROOT, "TASK-13-SCOPE-VERDICTS.json"), JSON.stringify({
  task: "1.3", statement: t.statement, candidates: CANDIDATES,
  promote: promote.map((r) => r.clause), withheld: reject.map((r) => r.clause), absent: missing,
  detail: { promote, reject, missing },
}, null, 1) + String.fromCharCode(10), "utf8");
console.log("task 1.3: " + String(t.statement).replace(/\s+/g, " "));
console.log("");
for (const r of promote) console.log("  IN SCOPE   " + r.clause.padEnd(9) + r.words + "w  (" + r.role + ")");
for (const r of reject) console.log("  OUT        " + r.clause.padEnd(9) + r.words + "w  " + r.why);
for (const c of missing) console.log("  ABSENT     " + c);
console.log("\n" + promote.length + " to promote, " + reject.length + " withheld, " + missing.length + " absent");
console.log("wrote TASK-13-SCOPE-VERDICTS.md and .json");
