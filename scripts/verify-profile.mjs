/**
 * verify-profile.mjs - zero-cost proof of the per-cert tier profile.
 * No API calls. Run BEFORE any generation run.
 *
 *   node scripts\verify-profile.mjs
 */
import { profileFor, difficultyLineFor, bloomForCert } from "./lib/item-profile.mjs";

const flat = (s) => (s || "").replace(/\s+/g, " ");
let fail = 0;
const ok = (cond, msg) => { if (cond) console.log(`ok    ${msg}`); else { console.log(`FAIL  ${msg}`); fail++; } };

console.log("-- tier routing --");
ok(profileFor("Scrum Master I - AI").id === "professional",            "Scrum Master I         -> professional");
ok(profileFor("Scrum Product Owner I - AI").id === "professional",     "Scrum Product Owner I  -> professional");
ok(profileFor("Scrum Developer I - AI").id === "professional",         "Scrum Developer I      -> professional");
ok(profileFor("AI Governance & Risk Management I").id === "professional", "AIGRM-I              -> professional");
ok(profileFor("AI Essentials I").id === "literacy",                    "AI Essentials I        -> literacy");
ok(profileFor("Some Future Cert I").id === "neutral",                  "unknown cert           -> neutral");

console.log("\n-- REGRESSION GUARD: professional tier must be byte-identical to the old behavior --");
const prof = flat(difficultyLineFor("secure", "Scrum Master I - AI"));
ok(prof.includes("about 30% level 2, 50% level 3, 20% level 4"), "prof secure: original 30/50/20 text intact");
ok(prof.includes("Avoid level 1 (trivial recall) and level 5"),   "prof secure: original 'avoid level 1' intact");
ok(bloomForCert(1, "Scrum Master I - AI") === "2_understand", "prof bloom: d1 -> 2_understand (unchanged)");
ok(bloomForCert(2, "Scrum Master I - AI") === "2_understand", "prof bloom: d2 -> 2_understand (unchanged)");
ok(bloomForCert(3, "Scrum Master I - AI") === "3_apply",      "prof bloom: d3 -> 3_apply      (unchanged)");
ok(bloomForCert(4, "Scrum Master I - AI") === "4_analyze",    "prof bloom: d4 -> 4_analyze    (unchanged)");
ok(bloomForCert(5, "Scrum Master I - AI") === "4_analyze",    "prof bloom: d5 -> 4_analyze    (unchanged)");
ok(bloomForCert(4, "AI Governance & Risk Management I") === "4_analyze", "AIGRM bloom: d4 -> 4_analyze (unchanged)");

console.log("\n-- LITERACY tier (AIE-I): JTA says 44/40/16, ceiling 3_apply --");
const lit = flat(difficultyLineFor("secure", "AI Essentials I"));
ok(lit.includes("Difficulty 1..3 ONLY"),                  "lit secure: restricted to difficulty 1-3");
ok(lit.includes("44% level 1"),                           "lit secure: targets 44% Remember");
ok(lit.includes("HARD CEILING"),                          "lit secure: hard ceiling stated");
ok(!lit.includes("Avoid level 1"),                        "lit secure: does NOT forbid recall");
ok(!/30% level 2, 50% level 3/.test(lit),                 "lit secure: no professional 30/50/20 leak");
ok(bloomForCert(1, "AI Essentials I") === "1_remember",   "lit bloom: d1 -> 1_remember  (was UNREACHABLE)");
ok(bloomForCert(2, "AI Essentials I") === "2_understand", "lit bloom: d2 -> 2_understand");
ok(bloomForCert(3, "AI Essentials I") === "3_apply",      "lit bloom: d3 -> 3_apply");
ok(bloomForCert(4, "AI Essentials I") === "3_apply",      "lit bloom: d4 -> capped at 3_apply (ceiling)");
ok(bloomForCert(5, "AI Essentials I") === "3_apply",      "lit bloom: d5 -> capped at 3_apply (ceiling)");
ok(profileFor("AI Essentials I").ceiling === "3_apply",   "lit ceiling declared as 3_apply");

console.log("");
if (fail === 0) {
  console.log("TIER PROFILE: ALL CLEAN");
  console.log("  - Scrum + governance keep the original difficulty text and bloom mapping");
  console.log("  - AIE-I can finally emit 1_remember and is hard-capped at 3_apply");
  process.exit(0);
} else {
  console.log(`TIER PROFILE: ${fail} FAILURE(S) - do not generate.`);
  process.exit(1);
}
