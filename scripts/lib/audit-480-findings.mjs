/**
 * audit-480-findings.mjs -- the director's read of the 480-item audit sample,
 * declared once so every downstream script scores the same set.
 *
 * Source: AUDIT-FINDINGS-480.md, 2026-09-26. Every Tier A finding was verified by
 * the director against the cited source before being listed; 42001 and 19011 were
 * checked against the project PDFs.
 *
 * IDS ARE PREFIXES OF **ENGLISH** ROWS. The 342-read findings were es-419 rows
 * because those were the rows PRESENTED; these come from an English-only sample.
 * Retirement is still by `question_group_id` across all languages, for the same
 * reason: `correct_answer` is a machine field and does not drift between siblings,
 * so a wrong key is wrong in every language.
 */

export const AUDIT480_TIER_A = [
  { n: 61, id: "05e3cd2e", cert: "AIGRM-I",
    why: "EU AI Act Art. 50 places labelling duties on providers (50(2)) and deployers (50(4)). No provision labels a redistributor that used no AI. The key invents that duty." },
  { n: 62, id: "1331b1f7", cert: "AIGRM-I",
    why: "Art. 53(2) exempts open-source GPAI without systemic risk from the DOCUMENTATION duties in 53(1)(a)-(b), and they keep copyright policy and the training summary. The key says the reverse." },
  { n: 81, id: "9bcd2f15", cert: "AIHR-I",
    why: "A hand-written keyword filter is not an AEDT/AI system under NYC LL144, Colorado SB 24-205 or AI Act Art. 3(1). The key calls it in scope." },
  { n: 123, id: "3f0430cf", cert: "AIMS-F",
    why: "42001 9.3.2 has NO AI-specific review input -- a-e are the harmonised list, re-read from the PDF. No option is correct." },
  { n: 152, id: "1dddb20e", cert: "AIMS-F",
    why: "The stem cites a 42001 control requiring responses to AI-specific incidents such as drift. No such control exists: A.8.4 is about communicating incidents to users." },
  { n: 249, id: "e7d7e400", cert: "ISMS-F",
    why: "Amd 1:2024 requires determining WHETHER climate change is relevant, with no documentation requirement. The key says documenting it is a standing requirement." },
  { n: 349, id: "57eb5129", cert: "SD-AI-I",
    why: "ioutil.ReadAll was DEPRECATED, not removed, in Go 1.16. It still compiles. The stem and key premise are false, and distractor a is true." },
  { n: 382, id: "66de9c82", cert: "SM-AI-I",
    why: "\"Traumatic and rare\" cancellation is 2017 text, removed in 2020. No option is correct against the 2020 Guide." },
  { n: 400, id: "c10b3203", cert: "SM-AI-I",
    why: "The 2020 Guide: Scrum TEAMS \"internally decide who does what, when, and how\". The key says Developers only, and distractor c is the Guide's wording." },
  { n: 220, id: "de570ed8", cert: "AISM-I",
    why: "The stem says the policy RAISES the risk threshold (more tolerance), but the key lowers the autonomous limit. The key reads the opposite of the stem." },
  { n: 475, id: "a3f8c31e", cert: "SPO-AI-I",
    why: "There is no target date, and for any reasonable target the higher-throughput team B is more likely to finish. The key (A) depends on information that is not there." },
];

/** Tier B from the 480 audit, for ITEM-REVIEW-QUEUE.md. SME review; no rescoring. */
export const AUDIT480_TIER_B = [
  ["AIE-I", "fdcd8167", "#3 and #5 contradict each other on whether rule-based systems are AI"],
  ["AIE-I", "494911a3", "#3 and #5 contradict each other on whether rule-based systems are AI"],
  ["AIE-I", "8523c745", "contested"],
  ["AIE-I", "3479ebab", "a \"written approval\" rule is invented"],
  ["AIGRM-I", "875f45e1", "the Annex III triage scope, plus the missing Art. 25(1)(c) provider shift"],
  ["AIGRM-I", "39d91b5b", "42001 6.1.2 covers individuals and societies too"],
  ["AIGRM-I", "6ebc2e8b", "contested"],
  ["AIHR-I", "ef0212f7", "jurisdiction-dependent"],
  ["AIHR-I", "ab1030f1", "contested"],
  ["AIHR-I", "5abec73c", "the ADA requires accommodation, not a pre-built equivalent path"],
  ["AIMS-F", "b97b25ea", "invented AI-partner definition"],
  ["AIMS-F", "66fea350", "contested"],
  ["AIMS-F", "ab6263f0", "B.7.5 says \"can include\", not must"],
  ["AIMS-F", "dd09940d", "B.7.5 says \"can include\", not must"],
  ["AIMS-F", "be876cdf", "contested"],
  ["AIMS-F", "a90aee16", "contested"],
  ["AIMS-F", "b965acf2", "there is no human-oversight Annex A control"],
  ["AIMS-F", "52004aae", "A.3.3 sits inside A.3"],
  ["AIMS-F", "591b9767", "provenance is A.7.5, not A.6.1"],
  ["AIMS-F", "430a65d2", "contested"],
  ["AIMS-F", "83f159c4", "a date-dependent AI Act fact"],
  ["AIMS-F", "f50f74e8", "contested"],
  ["AIMS-IA", "e5ac972c", "the 19011 5.3 citation should be 5.5.1 g / 5.6"],
  ["AIMS-IA", "1b3204d6", "contested"],
  ["AIMS-IA", "d3a7d8d1", "contradicts #180"],
  ["AIMS-IA", "f78251d1", "6.3.1 should be 6.4.6"],
  ["AIMS-IA", "a60747a4", "contested"],
  ["AIMS-IA", "b5cb06e4", "6.4.5 / A.16 should be 6.5.1 / 4.3"],
  ["AIMS-IA", "251b199e", "contested"],
  ["AIMS-IA", "10b5f922", "3.26 puts the justification in the SoA"],
  ["AIMS-IA", "40f77ab2", "B.1: no rationale required; and the \"Annex B is should throughout\" line is false (B.7.6 is a shall)"],
  ["AIMS-IA", "106ba660", "contested"],
  ["AIMS-IA", "1fd382be", "A.7.6 is a \"shall\", so a nonconformity is defensible"],
  ["AISM-I", "0c57c72e", "contested"],
  ["AISM-I", "0ce9ffa3", "contested"],
  ["ISMS-F", "82b3a221", "Annex A has no \"unchanged by AI\" label"],
  ["ISMS-F", "08073000", "9.3.3 names no resource outputs"],
  ["ISMS-F", "309bf077", "contested"],
  ["ISMS-IA", "62d3f05f", "contested"],
  ["ISMS-IA", "1d72ac82", "contested"],
  ["ISMS-IA", "1b990908", "the stem makes option a also correct"],
  ["ISMS-IA", "324e7cbc", "contested"],
  ["ISMS-IA", "809cfdb7", "contested"],
  ["ISMS-IA", "40e07225", "10.2 b) 3) makes c defensible"],
  ["SD-AI-I", "0a37670f", "contested"],
  ["SD-AI-I", "c55258bb", "contested"],
  ["SD-AI-I", "e5102d70", "the DoD applies to the Increment, so distractor d is Guide-correct"],
  ["SM-AI-I", "41099eea", "contested"],
  ["SM-AI-I", "59c4cd39", "contested"],
  ["SM-AI-I", "b33f6f7b", "contested"],
  ["SM-AI-I", "d199b366", "omits the PO negotiation the Guide requires"],
  ["SM-AI-II", "8313061d", "contested"],
  ["SM-AI-II", "70f3d16e", "contested"],
  ["SM-AI-II", "8ad54965", "contested"],
  ["SM-AI-II", "d43baa5d", "contested"],
  ["SM-AI-II", "75504c35", "contested"],
  ["SM-AI-II", "7940031c", "contested"],
  ["SPO-AI-I", "c08b0309", "conflicts with #455"],
  ["SPO-AI-I", "21f9d683", "contested"],
  ["SPO-AI-I", "949e36dd", "EBM lists Release Frequency under Time to Market; the key is mislabelled Lead Time"],
  ["SPO-AI-I", "f7fc872b", "contested"],
  /* Promoted from Tier C by the director: the false statement is in the KEY TEXT. */
  ["SPO-AI-I", "e9032f24", "PROMOTED FROM TIER C: one PO per PRODUCT, not per team, and the false statement is in the key text"],
];

/** Tier C: explanation fixes, key sound. Grouped by fix type for ITEM-FIX-QUEUE.md. */
export const AUDIT480_TIER_C = {
  "wrong clause number": [
    ["AIMS-IA", "6bb38458", "19011 6.6 misquoted"],
    ["AIMS-IA", "8f69a850", "3.11 should be 3.10"],
    ["AIMS-IA", "d2dbb301", "B.7.3 should be B.7.4; also carries the false \"Annex B is should throughout\" line"],
    ["ISMS-IA", "cc0731c2", "4.3 should be 4.6"],
    ["ISMS-IA", "a068c9c2", "4.3 should be 4.6"],
    ["ISMS-IA", "f500242f", "10.2 e should be d"],
    ["ISMS-F", "7fd48dc2", "5.2 should be 7.3 a"],
  ],
  "arithmetic": [
    ["ISMS-IA", "33570616", "3,800 of 4,000 is 95%, not half"],
  ],
  "2017 content in an explanation": [
    ["SD-AI-I", "e7b74555", "stakeholders \"the PO considers relevant\""],
    ["SD-AI-I", "288ebb29", "\"forecast\""],
    ["SD-AI-I", "ce153e80", "\"forecast\""],
    ["SM-AI-I", "a5e99117", "the 10% refinement rule"],
    ["SM-AI-I", "5535addc", "servant leadership"],
    ["SM-AI-I", "b3cf23ec", "2017 content"],
    ["SM-AI-II", "24ab3b5e", "2017 content"],
    ["SPO-AI-I", "c6f35101", "2017 content"],
    ["SPO-AI-I", "0858d045", "\"never complete\""],
  ],
  "other false statement": [
    ["SM-AI-I", "80ed1834", "the DoD is a commitment, not an artifact"],
    ["SM-AI-I", "fc76c765", "false statement"],
    ["SM-AI-I", "7d8e2f57", "false statement"],
    ["AIE-I", "6e696561", "false statement"],
    ["AIE-I", "9ab28dc8", "false statement"],
    ["AIE-I", "06a72d49", "false statement"],
    ["AIE-I", "461c2428", "false statement"],
    ["AIGRM-I", "941b4528", "false statement; also a Tier D give-away"],
    ["AIHR-I", "25724ce4", "false statement"],
    ["AIHR-I", "065f018d", "false statement"],
    ["AIHR-I", "976cd01e", "false statement"],
    ["AIMS-F", "379b53fe", "false statement"],
    ["AIMS-F", "87c740c9", "false statement; also Tier D and Tier E (B.1)"],
    ["AIMS-IA", "1a214870", "false statement"],
    ["AIMS-IA", "bcbc3ebe", "false statement"],
    ["AIMS-IA", "3db07420", "false statement; also Tier E (6.1.4, 17 words)"],
    ["AIMS-IA", "1fd382be", "the \"Annex B is should throughout\" line -- B.7.6 is a shall"],
    ["ISMS-F", "74123396", "false statement"],
    ["ISMS-F", "f23cb9f6", "clear desk/screen is ONE control, 7.7"],
    ["ISMS-F", "229609f9", "false statement"],
    ["ISMS-F", "eb32ef37", "false statement"],
    ["ISMS-F", "19903f81", "false statement"],
    ["ISMS-F", "db3fb179", "false statement"],
    ["ISMS-IA", "17c54d3c", "false statement"],
    ["ISMS-IA", "00ae33a8", "false statement"],
    ["SM-AI-II", "6481e78e", "false statement"],
    ["SM-AI-II", "cf225690", "false statement"],
    ["SM-AI-II", "94a1d8e2", "false statement"],
    ["SM-AI-II", "1e6e87d0", "false statement"],
    ["SM-AI-II", "2c7de35c", "false statement"],
    ["SPO-AI-I", "4c41886a", "false statement"],
    ["SPO-AI-I", "525e5dc3", "false statement"],
    ["SPO-AI-I", "25d1158e", "false statement"],
    ["SPO-AI-I", "afef2ca2", "false statement"],
    ["SD-AI-I", "b20540df", "false statement"],
    ["SD-AI-I", "42248e2b", "false statement"],
    ["AISM-I", "fe476461", "false statement"],
  ],
};

/** Tier D: item-writing flaws. */
export const AUDIT480_TIER_D = {
  "odd-one-out pattern (FIX IN THE RUBRIC, not per item)": [
    ["AIE-I", "4a9fd209"], ["AIE-I", "cbbbca49"], ["AIE-I", "4d2a1e34"], ["AIE-I", "eb2175f4"],
    ["AIE-I", "1d93b7ea"], ["AIE-I", "3479ebab"], ["AIE-I", "5ac02fec"],
    ["AIGRM-I", "05e3cd2e"], ["AIGRM-I", "7d28e906"],
  ],
  "stem gives away the key, or the key is the only long option": [
    ["AIGRM-I", "941b4528"], ["AIMS-F", "87c740c9"], ["AISM-I", "0e10f3e8"], ["AISM-I", "80643999"],
    ["SM-AI-I", "bece4ebf"], ["SM-AI-I", "6ac08824"], ["SM-AI-II", "63b59512"],
  ],
  "depends on facts not in the stem": [
    ["AIHR-I", "a48fc07d"], ["AIGRM-I", "143df4b8"], ["AIMS-F", "e001ba3c"],
    ["AIMS-IA", "4b9737de"], ["SM-AI-II", "466b4336"], ["SM-AI-II", "0d9e74c0"],
  ],
  "contradictory stem or broken option": [
    ["ISMS-F", "1b1f5e01"], ["ISMS-IA", "4fa74813"], ["ISMS-IA", "5bdac5e4"],
    ["ISMS-IA", "07d2434c"], ["ISMS-IA", "75fd2b0f"], ["SM-AI-II", "0659a1b0"],
    ["SM-AI-II", "4d6e1c5e"], ["SM-AI-I", "b8c82f34"], ["SM-AI-I", "19402b7a"],
  ],
};

/**
 * Tier D near-duplicate PAIRS. Four ids were marked `?` in the source because the
 * director had only the AUDIT-SAMPLE.md position, not the id -- those are resolved
 * by position rather than guessed.
 */
export const AUDIT480_NEAR_DUPLICATES = [
  { cert: "AIMS-IA", a: "b80199aa", b: "e560d1c7" },
  { cert: "ISMS-IA", a: "cc0731c2", bSamplePosition: 283 },
  { cert: "ISMS-IA", a: "00ae33a8", bSamplePosition: 297 },
  { cert: "SM-AI-I", a: "0908734a", b: "5cc15507" },
  { cert: "SM-AI-I", a: "08766949", b: "4ba360d9" },
  { cert: "SPO-AI-I", a: "0246d9f1", b: "d182038c" },
  { cert: "SPO-AI-I", a: "238f60f7", b: "64ebf86f" },
  { cert: "SPO-AI-I", a: "bfeef7c5", b: "c08b0309" },
];

/** Tier E: reproduction. Paraphrase; the leak gate measures these. */
export const AUDIT480_TIER_E = [
  ["AIMS-F", "87c740c9", "B.1"],
  ["AIMS-F", "79209585", "9.3.3, 13 words"],
  ["AIMS-IA", "3db07420", "6.1.4, 17 words"],
  ["AIMS-IA", "18904585", "8.2, 11 words, borderline"],
  ["ISMS-IA", "12b13dd2", "the 19011 audit-evidence definition"],
];

/** The rates the director measured, for the OPEN-ITEMS answer. */
export const AUDIT480_RATES = {
  read: 480,
  A: { count: 11, rate: "2.3%" },
  B: { count: 45, rate: "~9%", approx: true },
  C: { count: 50, rate: "~10%", approx: true },
  D: { count: 35, rate: "~7%", approx: true },
  E: { count: 5, rate: "1%" },
};

/**
 * Resolve declared prefixes against live rows. Throws on a prefix that matches none
 * or more than one: a silent miss scores nothing and a silent double scores the
 * wrong item, and both look like a pass.
 */
export function resolve480(declared, rows, key = "id") {
  const out = [], problems = [];
  for (const d of declared) {
    const pre = typeof d === "string" ? d : d[key] !== undefined ? d[key] : d[1];
    const hits = rows.filter((r) => r.id.startsWith(pre));
    if (hits.length !== 1) {
      problems.push(pre + " matched " + hits.length + " live row(s)");
      continue;
    }
    out.push({ declared: d, prefix: pre, row: hits[0] });
  }
  if (problems.length) throw new Error("prefix resolution failed:\n  " + problems.join("\n  "));
  return out;
}
