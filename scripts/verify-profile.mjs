/**
 * verify-profile.mjs - zero-cost proof of the per-cert tier profile and of the
 * tier-2 option floor. No API calls. Run BEFORE any generation run.
 *
 *   node scripts\verify-profile.mjs
 *
 * WHY THE NEGATIVE HALF IS THE POINT (2026-09-10)
 * ----------------------------------------------
 * profileFor() learned `tier` so SM-AI-II stops inheriting SM-AI-I's Level I difficulty
 * profile. A test that only confirms SM-AI-II now resolves to professional-l2 PASSES
 * CLEANLY on a change that also moved SM-AI-I - which is the regression that matters,
 * because four shipped banks were generated against PROFESSIONAL's exact text and a
 * top-up run has to reproduce it.
 *
 * So the tier-1 strings are asserted BYTE-IDENTICAL against literal copies, not with
 * .includes() on a fragment. And AIE-I is asserted to still reach LITERACY, because a
 * `tier >= 2` branch is one line away from swallowing every name branch beneath it.
 */
import { profileFor, difficultyLineFor, bloomForCert, PROFILES } from "./lib/item-profile.mjs";
import { validateEnglish, validationFault } from "./lib/item-pipeline.mjs";

const flat = (s) => (s || "").replace(/\s+/g, " ");
let fail = 0;
const ok = (cond, msg) => { if (cond) console.log(`ok    ${msg}`); else { console.log(`FAIL  ${msg}`); fail++; } };

// ---------------------------------------------------------------------------
// The tier-1 difficulty text, copied out of item-profile.mjs as it stood before
// tier routing was added. THIS IS THE REGRESSION ORACLE. If a future edit
// reflows or rewords PROFESSIONAL, these fail, and that is the intended
// behaviour: the text is preserved so top-up runs on SM-AI-I, SPO-AI-I,
// SD-AI-I and AIGRM-I generate exactly as they did before.
// ---------------------------------------------------------------------------
const PROFESSIONAL_SECURE_ORIGINAL = `Difficulty 1..5, distributed about 30% level 2, 50% level 3, 20% level 4.
Avoid level 1 (trivial recall) and level 5 (overly tricky) - test applied
judgment. Favor scenario and Apply/Analyze items.`;
const PROFESSIONAL_PRACTICE_ORIGINAL = `Difficulty 1=trivial recall .. 5=tricky multi-step. Favor Apply/Analyze
(3-4) over recall: aim ~40% level 2, ~40% level 3, ~20% level 4.`;

console.log("-- tier routing: tier 1 resolves by name, exactly as before --");
ok(profileFor("Scrum Master I - AI").id === "professional",              "Scrum Master I          -> professional");
ok(profileFor("Scrum Product Owner I - AI").id === "professional",       "Scrum Product Owner I   -> professional");
ok(profileFor("Scrum Developer I - AI").id === "professional",           "Scrum Developer I       -> professional");
ok(profileFor("AI Governance & Risk Management I").id === "professional","AIGRM-I                 -> professional");
ok(profileFor("AI Essentials I").id === "literacy",                      "AI Essentials I         -> literacy");
ok(profileFor("Some Future Cert I").id === "neutral",                    "unknown cert            -> neutral");

console.log("\n-- tier routing: tier 2 resolves by TIER, before any name match --");
ok(profileFor("Scrum Master II — AI", 2).id === "professional-l2",   "SM-AI-II       tier 2   -> professional-l2");
ok(profileFor("ISO/IEC 27001:2022 Internal Auditor - AI", 2).id === "professional-l2", "ISMS-IA        tier 2   -> professional-l2");
ok(profileFor("ISO/IEC 42001:2023 Internal Auditor", 2).id === "professional-l2",      "AIMS-IA        tier 2   -> professional-l2");
ok(profileFor("Some Future Cert II", 2).id === "professional-l2",        "unknown cert   tier 2   -> professional-l2");

console.log("\n-- NEGATIVE: it is the TIER that moved SM-AI-II, not its name --");
ok(profileFor("Scrum Master II — AI").id === "professional",          "SM-AI-II name, tier omitted -> professional (default tier 1)");
ok(profileFor("Scrum Master II — AI", 1).id === "professional",       "SM-AI-II name, tier 1       -> professional");
ok(profileFor("Scrum Master I - AI", 2).id === "professional-l2",         "SM-AI-I name, tier 2        -> professional-l2 (tier wins)");

console.log("\n-- NEGATIVE: the tier branch must not swallow AIE-I, which is tier 1 --");
ok(profileFor("AI Essentials I", 1).id === "literacy",                    "AIE-I tier 1 explicit  -> literacy");
ok(profileFor("AI Essentials I").ceiling === "3_apply",                   "AIE-I ceiling still 3_apply");
ok(flat(difficultyLineFor("secure", "AI Essentials I")).includes("Difficulty 1..3 ONLY"), "AIE-I still gets the literacy difficulty text");

console.log("\n-- REGRESSION GUARD: tier-1 professional text is BYTE-IDENTICAL --");
ok(difficultyLineFor("secure", "Scrum Master I - AI") === PROFESSIONAL_SECURE_ORIGINAL,
   "prof secure: byte-identical to the pre-tier text");
ok(difficultyLineFor("practice", "Scrum Master I - AI") === PROFESSIONAL_PRACTICE_ORIGINAL,
   "prof practice: byte-identical to the pre-tier text");
ok(PROFILES.PROFESSIONAL.secureDifficulty === PROFESSIONAL_SECURE_ORIGINAL,
   "PROFILES.PROFESSIONAL.secureDifficulty unchanged");
ok(difficultyLineFor("secure", "AI Governance & Risk Management I") === PROFESSIONAL_SECURE_ORIGINAL,
   "AIGRM secure: byte-identical (same profile, same string)");
ok(bloomForCert(1, "Scrum Master I - AI") === "2_understand", "prof bloom: d1 -> 2_understand (unchanged)");
ok(bloomForCert(2, "Scrum Master I - AI") === "2_understand", "prof bloom: d2 -> 2_understand (unchanged)");
ok(bloomForCert(3, "Scrum Master I - AI") === "3_apply",      "prof bloom: d3 -> 3_apply      (unchanged)");
ok(bloomForCert(4, "Scrum Master I - AI") === "4_analyze",    "prof bloom: d4 -> 4_analyze    (unchanged)");
ok(bloomForCert(5, "Scrum Master I - AI") === "4_analyze",    "prof bloom: d5 -> 4_analyze    (unchanged)");
ok(bloomForCert(4, "AI Governance & Risk Management I") === "4_analyze", "AIGRM bloom: d4 -> 4_analyze (unchanged)");

console.log("\n-- LEVEL II profile: no recall, four options, difficulty within the level --");
const l2 = flat(difficultyLineFor("secure", "Scrum Master II — AI", 2));
ok(l2.includes("Difficulty 2..4"),                        "l2 secure: difficulty floored at 2");
ok(l2.includes("NEVER write a level 1"),                  "l2 secure: level 1 forbidden, not merely avoided");
ok(l2.includes("FOUR OPTIONS, ALWAYS"),                   "l2 secure: four options at every cognitive level");
ok(l2.includes("DIFFICULTY IS NOT COGNITIVE LEVEL"),      "l2 secure: difficulty separated from Bloom");
ok(!l2.includes("Avoid level 1 (trivial recall)"),        "l2 secure: no Level I 'avoid level 1' leak");
ok(!/Difficulty 1\.\.5/.test(l2),                         "l2 secure: no Level I 1..5 range leak");
ok(!l2.includes("Difficulty 1..3 ONLY"),                  "l2 secure: no literacy leak");
ok(bloomForCert(1, "Scrum Master II — AI", 2) === "2_understand", "l2 bloom: d1 -> floored to 2_understand (no 1_remember)");
ok(bloomForCert(3, "Scrum Master II — AI", 2) === "3_apply",      "l2 bloom: d3 -> 3_apply");
ok(bloomForCert(5, "Scrum Master II — AI", 2) === "4_analyze",    "l2 bloom: d5 -> capped at 4_analyze");
ok(profileFor("Scrum Master II — AI", 2).ceiling === "4_analyze", "l2 ceiling declared as 4_analyze");

// ---------------------------------------------------------------------------
// THE TIER-2 OPTION FLOOR.
//
// isL2() is tier 2 AND 4_analyze, so SM-AI-II's 16 apply-level tasks fell through
// to a draft prompt saying question_type may be "true_false". verify-cert
// invariant 19 FAILS THE WHOLE SECURE BANK on one surviving two-option item, and
// it would not surface until 1,056 rows had been generated.
// ---------------------------------------------------------------------------
console.log("\n-- tier-2 option floor: structural, at every cognitive level --");
const tf = {
  question_text: "A Scrum Master claims the Sprint Backlog is a commitment. Is this correct?",
  question_type: "true_false",
  options: [{ id: "a", text: "True" }, { id: "b", text: "False" }],
  correct_answer: ["b"],
  explanation: "The Sprint Goal is the commitment; the Sprint Backlog is the plan.",
  difficulty: 3,
};
const three = {
  question_text: "A team's Definition of Done omits integration. Which reading is best?",
  question_type: "single_choice",
  options: [{ id: "a", text: "The definition is insufficient for a usable Increment" },
            { id: "b", text: "The definition is complete because the team wrote it" },
            { id: "c", text: "Integration belongs to the organization, not the team" }],
  correct_answer: ["a"],
  explanation: "Usable is required separately from Done.",
  difficulty: 3,
};
const applyTask = { code: "5.1", bloom_level: "3_apply" };
const analyzeTask = { code: "5.3", bloom_level: "4_analyze" };

ok(validateEnglish({ ...tf }, 1, applyTask) === true,     "tier 1: true_false still ACCEPTED (no regression)");
ok(validateEnglish({ ...tf }, 2, applyTask) === false,    "tier 2 + 3_apply:   true_false REJECTED  <- the gap");
ok(validateEnglish({ ...tf }, 2, analyzeTask) === false,  "tier 2 + 4_analyze: true_false REJECTED");
ok(validationFault({ ...tf }, 2, applyTask) === "tier2-true-false",   "fault names the tier-2 true_false case");
ok(validateEnglish({ ...three }, 1, applyTask) === true,  "tier 1: three options still ACCEPTED (no regression)");
ok(validateEnglish({ ...three }, 2, applyTask) === false, "tier 2: three options REJECTED");
ok(validationFault({ ...three }, 2, applyTask) === "tier2-option-count", "fault names the tier-2 option-count case");

console.log("");
if (fail === 0) {
  console.log("TIER PROFILE: ALL CLEAN");
  console.log("  - tier 1 keeps the original difficulty text BYTE-IDENTICAL and its bloom mapping");
  console.log("  - AIE-I still reaches LITERACY; the tier branch does not swallow it");
  console.log("  - tier 2 resolves to professional-l2 by TIER, not by name");
  console.log("  - a two-option item cannot leave the pipeline for a tier-2 cert at any Bloom level");
  process.exit(0);
} else {
  console.log(`TIER PROFILE: ${fail} FAILURE(S) - do not generate.`);
  process.exit(1);
}
