#!/usr/bin/env node
/**
 * test-enemy-rule.mjs -- the enemy rule's controls, plus an assembly test on the LIVE pool shape.
 *
 * READ-ONLY apart from nothing; no writes, no model calls. Unknown flags exit 2. Exits non-zero on any
 * failure, so it can gate a deploy.
 *
 * ============ WHY THIS EXISTS SEPARATELY FROM check-enemy-feasibility ============
 *
 * The feasibility script asks whether a form can still be FILLED. This asks whether the rule DOES WHAT IT
 * SAYS -- refuses the pairs it names, and refuses nothing else. Those are different questions and a pass on
 * one says nothing about the other: a rule that refuses everything is perfectly "feasible" on an infinite
 * pool and perfectly useless.
 *
 * ============ AND IT ASSERTS THE RULE CAN FIRE, ON THE REAL PAIR THAT MOTIVATED IT ============
 *
 * The clause half is exercised on a synthetic two-item form; the option half is exercised on the ACTUAL text
 * that was shared between `b25f378f`'s option B and `dfc8a1bf`'s key. A control built from the defect that
 * prompted it tests the defect rather than the class -- so both halves also carry a NEGATIVE control: a
 * different clause must be taken, a short boilerplate option must NOT make two items enemies, and clause 4.1
 * of two DIFFERENT standards must not be an enemy pair, because ISO 19011's 4.x collides with the harmonised
 * management-system 4.x and keying on the clause alone would merge two unrelated subjects.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { enemyRuleControls, enemyReason, markEnemy, freshUsed, enemyKeyOf, OPTION_TEXT_FLOOR }
  from "../functions/_shared/item-rules/enemy-rule.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". This script takes none.");
  process.exit(2);
}
void dirname(fileURLToPath(import.meta.url));

let fails = 0;
console.log("ENEMY RULE -- the shared module's own controls");
for (const r of enemyRuleControls()) {
  console.log("  " + (r.pass ? "ok  " : "FAIL") + " " + r.what + (r.pass ? "" : "   -- " + r.detail));
  if (!r.pass) fails++;
}
console.log("");

/* ============ AN ASSEMBLY TEST: THE ONE-SENTENCE-THREE-TIMES CASE, END TO END ============
 *
 * The real defect is a clause examined from three TASKS in two DOMAINS reaching one form. The module's own
 * controls are pairwise; this walks a form. */
console.log("ASSEMBLY -- a clause examined from three tasks across two domains");
{
  const item = (id, task, domain, clause, ...opts) => ({
    id, task, domain, enemy_key: clause ? "ISO/IEC 42001|2023|" + clause : null,
    options: opts.map((text) => ({ text })),
  });
  /* five items: three on 8.4 from tasks in two different domains, two on other clauses */
  const form = [
    item("i1", "2.7", "D2", "8.4", "reassess the impact when the system changes materially"),
    item("i2", "2.6", "D2", "8.4", "repeat the assessment at planned intervals as documented"),
    item("i3", "3.8", "D3", "8.4", "record the outcome of each reassessment as documented information"),
    item("i4", "3.3", "D3", "7.2", "retain evidence of competence for the persons concerned"),
    item("i5", "1.1", "D1", null, "an authored item with no grounding row at all"),
  ];
  const used = freshUsed();
  const taken = [], refused = [];
  for (const q of form) {
    const why = enemyReason(q, used);
    if (why) { refused.push({ q, why }); continue; }
    markEnemy(q, used);
    taken.push(q);
  }
  console.log("  taken   " + taken.map((q) => q.id + "(" + q.task + "/" + q.domain + ")").join(" "));
  for (const r of refused) console.log("  refused " + r.q.id + "(" + r.q.task + "/" + r.q.domain + ")   " +
    r.why);
  const okTaken = taken.map((q) => q.id).join(",") === "i1,i4,i5";
  console.log("  " + (okTaken ? "ok  " : "FAIL") + " exactly one 8.4 item survives, 7.2 survives, and the " +
    "authored item is unconstrained");
  if (!okTaken) fails++;
  const crossDomain = refused.some((r) => r.q.domain !== taken[0].domain);
  console.log("  " + (crossDomain ? "ok  " : "FAIL") + " at least one refusal is CROSS-DOMAIN, which a " +
    "per-domain rule could not have made");
  if (!crossDomain) fails++;
}
console.log("");

/* ============ THE FLOOR, MEASURED RATHER THAN ASSERTED ============
 *
 * A threshold is a claim that nothing important lies below it. State it with what it excludes. */
console.log("THE OPTION-TEXT FLOOR is " + OPTION_TEXT_FLOOR + " normalised characters");
{
  const cases = [
    ["None of the above", false],
    ["Both A and B", false],
    ["No documented information is required", false],
    ["The degree to which the activities that were planned got carried out", true],
  ];
  let floorFails = 0;
  for (const [text, shouldFire] of cases) {
    const a = { enemy_key: "ISO/IEC 42001|2023|1.1", options: [{ text }] };
    const b = { enemy_key: "ISO/IEC 42001|2023|1.2", options: [{ text }] };
    const u = freshUsed();
    markEnemy(a, u);
    const fired = !!enemyReason(b, u);
    const norm = String(text).toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    if (fired !== shouldFire) floorFails++;
    console.log("  " + (fired === shouldFire ? "ok  " : "FAIL") + " " + String(norm.length).padStart(3) +
      " chars   fires=" + fired + "   " + JSON.stringify(text.slice(0, 54)));
  }
  if (floorFails) fails += floorFails;
  console.log("  measured by measure-option-overlap-floor.mjs: every REAL collision in the corpus is 76+");
  console.log("  characters and the shortest option in the bank is 20, so the floor changes nothing about the");
  console.log("  corpus as it stands -- 14 colliding texts at floor 0 and at floor 60 alike. It is there for");
  console.log("  future boilerplate only.");
}
console.log("");

/* the clause-collision guard, named once more because it is the one that would merge two standards */
console.log("KEY SHAPE  " + JSON.stringify(enemyKeyOf({ source_id: "ISO 19011", edition: "2026",
  key_support_clause: "4.1" })) + " against " + JSON.stringify(enemyKeyOf({ source_id: "ISO/IEC 42001",
  edition: "2023", key_support_clause: "4.1" })));
console.log("  clause 4.1 is 'principles of auditing' in one and 'context of the organization' in the other.");
console.log("  A clause address is not a key.");
console.log("");
console.log(fails ? fails + " FAILURE(S)" : "all checks pass");
if (fails) process.exitCode = 1;
