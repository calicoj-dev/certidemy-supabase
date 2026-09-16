#!/usr/bin/env node
/**
 * test-certset-predicate.mjs - the three outcomes of courseware-read's cold-start
 * certification-set check, exercised.
 *
 * READ-ONLY, no network, no database. Unknown flags exit 2.
 *
 * ============ WHY THIS EXISTS ============
 *
 * The check it mirrors currently sees expected(8) == served(8), so NEITHER new
 * branch can fire in production. Deploying it proves nothing about them, and
 * "a check that cannot fire is indistinguishable from one that ran clean" is the
 * finding this repository has paid for most often.
 *
 * So the predicate gets a positive control: each of the three outcomes is
 * produced on purpose, including the two that would otherwise never be seen until
 * the next widening -- which is the moment nobody wants to discover the logic is
 * backwards.
 *
 * IT MIRRORS THE LOGIC RATHER THAN IMPORTING IT, and that is a real limitation
 * stated rather than hidden: the check lives inside a Deno cold-start closure in
 * courseware-read/index.ts and cannot be imported from node. If the function's
 * copy is edited and this is not, this passes while the deployed code differs.
 * The three lines are short and identical on purpose; compare them by eye when
 * either changes.
 */
const KNOWN = new Set([]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". This script takes none.");
    process.exit(2);
  }
}

/** The three lines from functions/courseware-read/index.ts, verbatim in shape. */
function classify(expectedList, servedList) {
  const servedSet = new Set(servedList);
  const expectedSet = new Set(expectedList);
  const usable = expectedList.filter((c) => servedSet.has(c));
  const missing = expectedList.filter((c) => !servedSet.has(c));
  const notDeployed = servedList.filter((c) => !expectedSet.has(c));
  return { usable, missing, notDeployed };
}

const FOUR = ["AIE-I", "AIGRM-I", "AIHR-I", "AISM-I"];
const EIGHT = [...FOUR, "SD-AI-I", "SM-AI-I", "SM-AI-II", "SPO-AI-I"].sort();

let pass = 0;
const fails = [];
function check(name, cond, detail) {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fails.push(name + " -- " + detail); console.log("  FAIL  " + name + "\n        " + detail); }
}

console.log("");
console.log("1. AGREEMENT - the steady state");
{
  const r = classify(EIGHT, EIGHT);
  check("serves all eight", r.usable.length === 8, JSON.stringify(r.usable));
  check("refuses nothing", r.missing.length === 0, JSON.stringify(r.missing));
  check("logs nothing", r.notDeployed.length === 0, JSON.stringify(r.notDeployed));
}

console.log("");
console.log("2. VIEWS WIDENED, FUNCTION BEHIND - the outage of 2026-09-16");
{
  const r = classify(FOUR, EIGHT);
  check("still serves the four it knows", r.usable.length === 4, JSON.stringify(r.usable));
  check("DOES NOT REFUSE", r.missing.length === 0,
    "missing=" + JSON.stringify(r.missing) + " -- this is the branch that took production down");
  check("names the four it is behind on", r.notDeployed.length === 4, JSON.stringify(r.notDeployed));
  check("names them CORRECTLY",
    r.notDeployed.join(",") === "SD-AI-I,SM-AI-I,SM-AI-II,SPO-AI-I", JSON.stringify(r.notDeployed));
}

console.log("");
console.log("3. VIEWS NARROWED - the dangerous direction");
{
  const r = classify(EIGHT, FOUR);
  check("REFUSES", r.missing.length === 4,
    "a request for these would read a view that filters them out and answer empty");
  check("names what vanished", r.missing.join(",") === "SD-AI-I,SM-AI-I,SM-AI-II,SPO-AI-I",
    JSON.stringify(r.missing));
}

console.log("");
console.log("4. A CODE NOBODY HAS HEARD OF - the intersection is computed, not assumed");
{
  const r = classify(FOUR, [...FOUR, "ZZ-NEW-I"]);
  check("serves the four", r.usable.length === 4, JSON.stringify(r.usable));
  check("does not refuse", r.missing.length === 0, JSON.stringify(r.missing));
  check("names the stranger", r.notDeployed.join(",") === "ZZ-NEW-I", JSON.stringify(r.notDeployed));
}

console.log("");
console.log("5. BOTH AT ONCE - one vanished, one appeared. Refusal must win.");
{
  const r = classify(["AISM-I", "AIE-I"], ["AISM-I", "ZZ-NEW-I"]);
  check("refuses on the vanished one", r.missing.join(",") === "AIE-I", JSON.stringify(r.missing));
  check("still names the stranger", r.notDeployed.join(",") === "ZZ-NEW-I", JSON.stringify(r.notDeployed));
}

console.log("");
console.log("passed " + pass + "   failed " + fails.length);
for (const f of fails) console.log("  X " + f);
console.log("");
console.log(fails.length ? "PREDICATE WRONG." : "All three outcomes produced, including the two production cannot show.");
process.exitCode = fails.length ? 1 : 0;
