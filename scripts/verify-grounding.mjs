/**
 * verify-grounding.mjs - zero-cost proof that grounding routes correctly per cert.
 * Calls no API. Run BEFORE spending tokens on a generation run.
 *
 *   node scripts\verify-grounding.mjs
 *
 * WRAP-INSENSITIVE MATCHING, AND WHY THE STRINGS WERE NOT EDITED INSTEAD.
 * Every grounding is a template literal wrapped by hand at ~80 columns, so a
 * phrase assertion can straddle a newline. `NEUTRAL` reads "...in established
 * professional\npractice for this subject area...", and the `must` phrase
 * "professional practice" was therefore NEVER SATISFIABLE on any version of the
 * string - it failed for a line break, not for a routing defect. The fix belongs
 * in the checker: `norm()` collapses runs of whitespace on BOTH sides before
 * comparing, so a future re-wrap cannot invent a phantom failure. Editing the
 * strings was rejected because their hashes are the regression baseline that
 * proves the three shipped Level I Scrum banks still generate identically.
 */
import { groundingFor } from "./lib/item-grounding.mjs";

/** Collapse every run of whitespace to one space, so a line wrap cannot hide a phrase. */
const norm = (s) => String(s).replace(/\s+/g, " ");
const has = (haystack, phrase) => norm(haystack).includes(norm(phrase));

// certName as the generators compute it: certifications.name minus "Certidemy ".
// `tier` is what groundingFor routes the Scrum branch on - NOT a numeral in the name.
const CASES = [
  { certName: "Scrum Master I - AI",                  tier: 1, expect: "SCRUM",      must: ["Scrum Guide"],                 mustNot: ["second-best", "[derived]", "BORDERLINE"] },
  { certName: "Scrum Product Owner I - AI",           tier: 1, expect: "SCRUM",      must: ["Scrum Guide"],                 mustNot: ["second-best", "[derived]", "BORDERLINE"] },
  { certName: "Scrum Developer I - AI",               tier: 1, expect: "SCRUM",      must: ["Scrum Guide"],                 mustNot: ["second-best", "[derived]", "BORDERLINE"] },
  { certName: "AI Governance & Risk Management I",    tier: 1, expect: "GOVERNANCE", must: ["governance"],                  mustNot: ["Scrum Guide"] },
  { certName: "AI Essentials I",                      tier: 1, expect: "WORKPLACE",  must: ["NON-TECHNICAL", "HR coordinator"], mustNot: ["Scrum Guide", "backlog craft"] },
  { certName: "Some Future Cert I",                   tier: 1, expect: "NEUTRAL",    must: ["professional practice"],       mustNot: ["Scrum Guide"] },

  // TIER, BOTH DIRECTIONS, ON ONE NAME. `\bscrum\b` cannot tell SM-AI-I from
  // SM-AI-II, so the ONLY thing separating these two rows is the tier argument.
  // A regression that ignored tier would make them identical and both would have
  // to fail - which is the point of asserting the same name twice.
  { certName: "Scrum Master II - AI",                 tier: 2, expect: "SCRUM_L2",
    must: ["2020 Scrum Guide", "WHO THE SECOND-BEST ANSWER MUST BE DEFENSIBLE TO",
           "Only the Product Owner has that authority", "[derived]", "What makes them BORDERLINE"],
    mustNot: ["NON-TECHNICAL", "ISO 19011"] },
  { certName: "Scrum Master II - AI",                 tier: 1, expect: "SCRUM",
    must: ["Scrum Guide"],
    mustNot: ["second-best", "[derived]", "BORDERLINE", "Only the Product Owner has that authority"] },
];

// SCRUM_L2 IS TESTED FIRST. It contains the whole of SCRUM_CORE, so it also
// contains "2020 Scrum Guide" - the discriminator this function used to lead
// with, which made SCRUM_L2 label as SCRUM and left the tier branch invisible.
// The heading below appears in SCRUM_L2_JUDGMENT and in nothing else.
const label = (g) =>
  has(g, "WHO THE SECOND-BEST ANSWER MUST BE DEFENSIBLE TO") ? "SCRUM_L2"
  : has(g, "2020 Scrum Guide") ? "SCRUM"
  : has(g, "NON-TECHNICAL") ? "WORKPLACE"
  : has(g, "AI governance,") ? "GOVERNANCE"
  : "NEUTRAL";

let fail = 0;
for (const c of CASES) {
  const g = groundingFor(c.certName, c.tier);
  const got = label(g);
  const errs = [];
  if (got !== c.expect) errs.push(`routed to ${got}, expected ${c.expect}`);
  for (const m of c.must)    if (!has(g, m)) errs.push(`missing "${m}"`);
  for (const m of c.mustNot) if (has(g, m))  errs.push(`must NOT contain "${m}"`);
  const name = `${c.certName} (tier ${c.tier})`;
  if (errs.length) { fail++; console.log(`FAIL  ${name.padEnd(42)} -> ${errs.join("; ")}`); }
  else             { console.log(`ok    ${name.padEnd(42)} -> ${got}`); }
}

// ---------------------------------------------------------------------------
// THE LEAK GUARD - vocabulary from one discipline appearing in another's
// grounding. This is the defect the whole per-cert grounding split exists to
// prevent: a Scrum scenario in an AI-literacy exam is a construct-irrelevant
// variable that sails past every other gate untouched.
//
// IT WAS COMPUTED AND DISCARDED. The result landed in a `const leaked` that
// NOTHING READ, `fail` only ever incremented inside the CASES loop, and the exit
// code tested `fail` alone - so a real leak was detected, thrown away, and the
// script printed ALL CLEAN and exited 0. Wired below: a leak increments `fail`,
// names the term and the grounding it leaked into, and drives a non-zero exit.
// ---------------------------------------------------------------------------
const BANNED_SCRUM = ["Sprint", "Product Owner", "backlog", "user stor", "Definition of Done", "product-ownership"];

const LEAK_CHECKS = [
  {
    certName: "AI Essentials I",
    tier: 1,
    banned: BANNED_SCRUM,
    // The HARD CONSTRAINTS block legitimately NAMES the banned terms in order to
    // ban them, so it is stripped before checking for accidental *grounding* in
    // them. The strip is asserted below - a regex that silently matched nothing
    // would make this whole check vacuous.
    strip: /Do NOT use[\s\S]*?story points[^\n]*\n/i,
    stripMustRemove: "story points",
  },
];

for (const c of LEAK_CHECKS) {
  const full = groundingFor(c.certName, c.tier);
  const body = full.replace(c.strip, "");
  const where = label(full);

  // The strip must actually strip. If the block is ever re-worded, this check
  // becomes vacuous rather than failing, which is the worse direction.
  if (body.length >= full.length || has(body, c.stripMustRemove)) {
    fail++;
    console.log(`FAIL  leak-guard strip did not remove the HARD CONSTRAINTS block for ${c.certName} - the leak check below is vacuous`);
  }

  const leaked = c.banned.filter((b) => new RegExp(b, "i").test(body));
  if (leaked.length) {
    fail++;
    for (const b of leaked) {
      console.log(`FAIL  leak: "${b}" appears in the ${where} grounding for ${c.certName} (tier ${c.tier})`);
    }
  } else {
    console.log(`ok    leak-guard ${c.certName} (tier ${c.tier})`.padEnd(48) + `-> none of ${c.banned.length} banned terms in ${where}`);
  }
}

console.log("");
if (fail === 0) {
  console.log("GROUNDING ROUTING: ALL CLEAN");
  console.log("  - Scrum certs keep the original grounding (no regression)");
  console.log("  - tier 2 on a Scrum name gets the borderline-candidate material; tier 1 does not");
  console.log("  - AIE-I gets non-technical workplace grounding, with no Scrum vocabulary leaked");
  console.log("  - unknown certs fall back to NEUTRAL, never Scrum");
  process.exit(0);
} else {
  console.log(`GROUNDING ROUTING: ${fail} FAILURE(S) - do not generate.`);
  process.exit(1);
}
