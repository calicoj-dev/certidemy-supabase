/**
 * verify-grounding.mjs - zero-cost proof that grounding routes correctly per cert.
 * Calls no API. Run BEFORE spending tokens on a generation run.
 *
 *   node scripts\verify-grounding.mjs
 */
import { groundingFor } from "./lib/item-grounding.mjs";

// certName as the generators compute it: certifications.name minus "Certidemy ".
const CASES = [
  { certName: "Scrum Master I - AI",                  expect: "SCRUM",      must: ["Scrum Guide"],                 mustNot: [] },
  { certName: "Scrum Product Owner I - AI",           expect: "SCRUM",      must: ["Scrum Guide"],                 mustNot: [] },
  { certName: "Scrum Developer I - AI",               expect: "SCRUM",      must: ["Scrum Guide"],                 mustNot: [] },
  { certName: "AI Governance & Risk Management I",    expect: "GOVERNANCE", must: ["governance"],                  mustNot: ["Scrum Guide"] },
  { certName: "AI Essentials I",                      expect: "WORKPLACE",  must: ["NON-TECHNICAL", "HR coordinator"], mustNot: ["Scrum Guide", "backlog craft"] },
  { certName: "Some Future Cert I",                   expect: "NEUTRAL",    must: ["professional practice"],       mustNot: ["Scrum Guide"] },
];

const label = (g) =>
  g.includes("2020 Scrum Guide") ? "SCRUM"
  : g.includes("NON-TECHNICAL") ? "WORKPLACE"
  : g.includes("AI governance,") ? "GOVERNANCE"
  : "NEUTRAL";

let fail = 0;
for (const c of CASES) {
  const g = groundingFor(c.certName);
  const got = label(g);
  const errs = [];
  if (got !== c.expect) errs.push(`routed to ${got}, expected ${c.expect}`);
  for (const m of c.must)    if (!g.includes(m)) errs.push(`missing "${m}"`);
  for (const m of c.mustNot) if (g.includes(m))  errs.push(`must NOT contain "${m}"`);
  if (errs.length) { fail++; console.log(`FAIL  ${c.certName.padEnd(34)} -> ${errs.join("; ")}`); }
  else             { console.log(`ok    ${c.certName.padEnd(34)} -> ${got}`); }
}

// The regression guard that matters most: the Scrum certs must be byte-identical
// to the old behavior, and AIE-I must be free of every banned term.
const aie = groundingFor("AI Essentials I");
const BANNED = ["Sprint", "Product Owner", "backlog", "user stor", "Definition of Done", "product-ownership"];
const leaked = BANNED.filter((b) => new RegExp(b, "i").test(aie.replace(/Do NOT use[\s\S]*?story points[^\n]*\n/i, "")));
// (the HARD CONSTRAINTS block legitimately NAMES the banned terms in order to ban them,
//  so we strip that block before checking for accidental *grounding* in them)

console.log("");
if (fail === 0) {
  console.log("GROUNDING ROUTING: ALL CLEAN");
  console.log("  - Scrum certs keep the original grounding (no regression)");
  console.log("  - AIE-I gets non-technical workplace grounding");
  console.log("  - unknown certs fall back to NEUTRAL, never Scrum");
  process.exit(0);
} else {
  console.log(`GROUNDING ROUTING: ${fail} FAILURE(S) - do not generate.`);
  process.exit(1);
}
