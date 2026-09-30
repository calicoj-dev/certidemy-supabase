#!/usr/bin/env node
/**
 * check-enemy-feasibility.mjs -- can a blueprint-valid form still be assembled under the enemy rule?
 *
 * READ-ONLY. No writes, no model calls. Unknown flags exit 2.
 *
 * Ruled PROMPT-95 s3. The cap of 2 items per clause is PER TASK, so one sentence is being examined from
 * several tasks and a single form can carry it three times -- which teaches it three times and over-weights
 * it against the blueprint. The rule is *at most one grounded item per (source, clause) on a form*, plus any
 * pair sharing an option text exactly.
 *
 * ============ THE ORDER IS MEASURE, THEN IMPLEMENT, AND THE ORDER IS THE RULING ============
 *
 * *"Measure feasibility first."* A constraint added to the assembler cannot be walked back once a candidate
 * is mid-exam: `generate-mock-exam` step 8 REFUSES to issue a certification exam whose blueprint cannot be
 * filled, which is the right behaviour and means an over-tight enemy rule converts a working exam into a
 * hard refusal. So the rule is simulated here, against the live pool, before a line of it is written.
 *
 * ============ WHAT IS SIMULATED, AND WHAT THAT CAN AND CANNOT TELL YOU ============
 *
 * The simulation reproduces the assembler's own shape: largest-remainder allocation across domains by
 * `weight_pct`, then per-domain picking. It does NOT reproduce the difficulty balancer or the shuffles,
 * because those change WHICH items are chosen and not HOW MANY are available -- and availability is the
 * question. Stated rather than left as silence: a domain reported feasible here could still fail on a
 * difficulty mix, and that is a separate measurement.
 *
 * THREE REGIMES, so the cost of each half of the rule is separable:
 *
 *   today            the stem dedupe only, which is what ships
 *   + clause         at most one grounded item per (source, clause) per form
 *   + option-overlap ...and no two items sharing a normalised option text
 *
 * A rule measured only in combination cannot say which half did the damage.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
/* ONE implementation of the floor and the normalisation. A local copy of either would let this measurement
 * and the deployed rule disagree -- and the measurement is what the floor was chosen from. */
import { optionKeys, OPTION_TEXT_FLOOR } from "../functions/_shared/item-rules/enemy-rule.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". This script is READ-ONLY and takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const KEY = requireKey(HERE);

const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();

const certs = (await getAll(KEY, "certifications?select=id,code,num_questions,status&order=code"))
  .filter((c) => c.code !== "ZZ-TEST-I");

/* ---------------------------------------------------------------- per certification */
const enemyReport = [];
for (const c of certs) {
  const tasks = await getAll(KEY, "tasks?select=id,code,domain_id&certification_id=eq." + c.id);
  const domains = await getAll(KEY, "domains?select=id,code,weight_pct&certification_id=eq." + c.id);
  const domById = new Map(domains.map((d) => [d.id, d]));
  const domByTask = new Map(tasks.map((t) => [t.id, t.domain_id]));
  const taskCode = new Map(tasks.map((t) => [t.id, t.code]));

  /* ============ TWO POOLS, AND THE SECOND IS THE ONE THE QUESTION IS ABOUT ============
   *
   * `generate-mock-exam` filters `status = 'approved'` exactly, and EVERY grounded item is
   * `pending_review`. So the pool the assembler sees today contains ZERO grounded items, the enemy rule is
   * inert, and a feasibility run against that pool would report "feasible" while measuring nothing -- the
   * vacuous pass this repository records over and over.
   *
   * The rule bites the moment these rows are APPROVED, which is the event it is being written for. So the
   * simulation runs over BOTH: `approved` (today, where the rule changes nothing) and
   * `approved + pending_review` (after approval, which is the real question). A branch held shut by DATA
   * rather than by code reads exactly like one that works. */
  const poolQuery = (statuses) => "quiz_questions?select=id,task_id,options,question_text,item_origin," +
    "difficulty,status,is_exam_scope&certification_id=eq." + c.id +
    "&language=eq.en&pool=eq.secure&retired_at=is.null&is_exam_scope=is.true&status=in.(" + statuses + ")";
  const qsToday = await getAll(KEY, poolQuery("approved"));
  const qs = await getAll(KEY, poolQuery("approved,pending_review"));
  /* the grounding rows, which is what makes an item GROUNDED and gives it its (source, clause) */
  const gr = await getAll(KEY, "item_grounding?select=question_id,source_id,edition,key_support_clause");
  const ground = new Map(gr.map((x) => [x.question_id, x]));

  const grounded = qs.filter((q) => ground.has(q.id));
  /* enemy groups: (source, clause) -> item ids, over the GROUNDED rows of this certification */
  const groups = new Map();
  for (const q of grounded) {
    const g = ground.get(q.id);
    const k = g.source_id + " " + g.edition + " :: " + g.key_support_clause;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push({ id: q.id, task: taskCode.get(q.task_id) || "?",
      domain: (domById.get(domByTask.get(q.task_id)) || {}).code || "?" });
  }
  /* option-overlap pairs, normalised, over the whole approved exam-scope pool -- not only the grounded rows,
   * because an authored item sharing an option with a grounded one is the same defect */
  const byOption = new Map();
  for (const q of qs) {
    for (const k of optionKeys(q.options)) {
      if (!byOption.has(k)) byOption.set(k, []);
      byOption.get(k).push(q.id);
    }
  }
  const overlapPairs = [...byOption].filter(([, v]) => new Set(v).size > 1);

  enemyReport.push({ cert: c, tasks, domains, domById, domByTask, taskCode, qs, qsToday, ground, grounded,
    groups, overlapPairs });
}

/* ---------------------------------------------------------------- feasibility simulation */
const allocate = (domains, total) => {
  const sum = domains.reduce((s, d) => s + Number(d.weight_pct || 0), 0) || 1;
  const exact = domains.map((d) => ({ id: d.id, raw: (Number(d.weight_pct || 0) / sum) * total }));
  const floored = exact.map((e) => ({ id: e.id, n: Math.floor(e.raw), rem: e.raw - Math.floor(e.raw) }));
  let assigned = floored.reduce((s, f) => s + f.n, 0);
  const order = [...floored].sort((a, b) => b.rem - a.rem);
  let i = 0;
  while (assigned < total && order.length) { order[i % order.length].n += 1; assigned++; i++; }
  return new Map(floored.map((f) => [f.id, f.n]));
};

/** how many items a domain can supply under a regime. Greedy, which is what the assembler is. */
const supply = (pool, regime, ground, usedClause, usedOption) => {
  const seenStem = new Set();
  let n = 0;
  for (const q of pool) {
    const stem = norm(q.question_text);
    if (seenStem.has(stem)) continue;
    if (regime !== "today") {
      const g = ground.get(q.id);
      if (g) {
        const k = g.source_id + " " + g.edition + " :: " + g.key_support_clause;
        if (usedClause.has(k)) continue;
        usedClause.add(k);
      }
    }
    if (regime === "+option-overlap") {
      const keys = optionKeys(q.options);
      if (keys.some((k) => usedOption.has(k))) continue;
      for (const k of keys) usedOption.add(k);
    }
    seenStem.add(stem);
    n++;
  }
  return n;
};

console.log("ENEMY RULE FEASIBILITY -- can a blueprint-valid form still be assembled?");
console.log("");
console.log("The simulation reproduces the assembler's ALLOCATION and per-domain supply, not its difficulty");
console.log("balancer or its shuffles: those change WHICH items are picked, not HOW MANY are available, and");
console.log("availability is the question. A domain feasible here could still fail on a difficulty mix.");
console.log("");

for (const R of enemyReport) {
  const { cert, domains, domById, domByTask, qs, qsToday, ground, grounded, groups, overlapPairs } = R;
  if (!grounded.length && !qs.length) continue;
  const target = Number(cert.num_questions || 40) || 40;
  const alloc = allocate(domains, target);
  const byDomain = new Map();
  for (const q of qs) {
    const d = domByTask.get(q.task_id);
    if (!d) continue;
    if (!byDomain.has(d)) byDomain.set(d, []);
    byDomain.get(d).push(q);
  }
  const groundedToday = qsToday.filter((q) => ground.has(q.id)).length;
  console.log("=== " + cert.code + "   target " + target + " item(s), " + domains.length + " domain(s)");
  console.log("    pool TODAY (approved)            " + qsToday.length + " item(s), " + groundedToday +
    " grounded" + (groundedToday ? "" : "   <- the enemy rule is INERT today: nothing for it to act on"));
  console.log("    pool AFTER APPROVAL (+pending)   " + qs.length + " item(s), " + grounded.length +
    " grounded   <- the pool the rule is being written for");
  if (!grounded.length) {
    console.log("    no grounded items -- the enemy rule changes nothing here, and that is its own state");
    console.log("");
    continue;
  }
  const regimes = ["today", "+clause", "+option-overlap"];
  const short = {};
  for (const regime of regimes) {
    /* the clause and option sets are FORM-WIDE, so they are shared across domains -- which is the whole
     * point: the defect is a clause examined from tasks in DIFFERENT domains, and a per-domain set could
     * not see it. */
    const usedClause = new Set(), usedOption = new Set();
    const rows = [];
    let miss = 0;
    for (const d of domains) {
      const quota = alloc.get(d.id) || 0;
      const pool = byDomain.get(d.id) || [];
      const have = supply(pool, regime, ground, usedClause, usedOption);
      rows.push({ code: d.code, quota, have, distinctClauses: new Set(pool.filter((q) => ground.has(q.id))
        .map((q) => ground.get(q.id).source_id + "::" + ground.get(q.id).key_support_clause)).size });
      if (have < quota) miss += quota - have;
    }
    short[regime] = { miss, rows };
  }
  console.log("    domain  weight  quota | today  +clause  +option | distinct grounded clauses");
  for (let i = 0; i < domains.length; i++) {
    const d = domains[i];
    const r0 = short.today.rows[i], r1 = short["+clause"].rows[i], r2 = short["+option-overlap"].rows[i];
    const mark = (r) => (r.have < r.quota ? "!" : " ");
    console.log("    " + String(d.code).padEnd(8) + String(d.weight_pct).padStart(5) + "%" +
      String(r0.quota).padStart(7) + " |" + String(r0.have).padStart(6) + mark(r0) +
      String(r1.have).padStart(7) + mark(r1) + String(r2.have).padStart(7) + mark(r2) + " |" +
      String(r0.distinctClauses).padStart(6));
  }
  for (const regime of regimes) {
    const s = short[regime];
    console.log("    " + regime.padEnd(16) + (s.miss ? "SHORT by " + s.miss + " item(s) -- the integrity " +
      "gate would REFUSE a certification exam" : "feasible"));
  }
  console.log("");
}

/* ---------------------------------------------------------------- the enemy groups */
console.log("ENEMY GROUPS -- (source, clause) carrying MORE THAN ONE grounded item, per certification.");
console.log("A group of one is not an enemy group and is not listed; the count of those is given, because");
console.log("a list of the interesting rows with no denominator is half a fact.");
console.log("");
for (const R of enemyReport) {
  const { cert, groups, overlapPairs, grounded } = R;
  if (!grounded.length) continue;
  const multi = [...groups].filter(([, v]) => v.length > 1).sort((a, b) => b[1].length - a[1].length);
  console.log("=== " + cert.code + "   " + groups.size + " distinct (source, clause), " + multi.length +
    " with more than one item, " + (groups.size - multi.length) + " with exactly one");
  for (const [k, v] of multi) {
    const domains = [...new Set(v.map((x) => x.domain))];
    console.log("    " + k.padEnd(34) + v.length + " item(s)   task(s) " +
      [...new Set(v.map((x) => x.task))].join(",") + "   domain(s) " + domains.join(",") +
      (domains.length > 1 ? "   <- CROSS-DOMAIN: a per-domain rule cannot see this" : ""));
    console.log("        " + v.map((x) => x.id.slice(0, 8)).join(" "));
  }
  if (!multi.length) console.log("    none -- every grounded clause carries exactly one item");
  if (overlapPairs.length) {
    console.log("    OPTION-TEXT OVERLAP  " + overlapPairs.length + " normalised option text(s) shared by " +
      "more than one item (>=" + OPTION_TEXT_FLOOR + " chars):");
    for (const [k, v] of overlapPairs.slice(0, 6)) {
      console.log("      " + JSON.stringify(k.slice(0, 70)) + "   " + [...new Set(v)].length + " items");
    }
    if (overlapPairs.length > 6) console.log("      ... and " + (overlapPairs.length - 6) + " more");
  } else {
    console.log("    OPTION-TEXT OVERLAP  none");
  }
  console.log("");
}
