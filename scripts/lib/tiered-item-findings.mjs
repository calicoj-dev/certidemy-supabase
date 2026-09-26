/**
 * tiered-item-findings.mjs -- the director's read of the 342 exposed items,
 * declared once so every downstream script scores the same set.
 *
 * TIER A: the key is wrong against the item's own source. Credit every candidate.
 * TIER B: two defensible options, or the rationale conflicts with the source.
 *         SME review. Counted in the worst case, never rescored on "plausible".
 *
 * Ids are the PREFIXES the director wrote. They are resolved against the live
 * bank and an ambiguous or missing prefix is a hard error -- a prefix that
 * matches two rows would silently score the wrong item, and one that matches
 * none would silently score nothing.
 */

export const TIER_A = [
  { n: 72, id: "6c0b1bce", cert: "AIE-I",
    why: "The stem already contains a task instruction (\"List each candidate's strengths...\"). The key says the task is missing, and it refers to resumes the stem never mentions.",
    candidate_missed: true },
  { n: 334, id: "38352993", cert: "SM-AI-I",
    why: "The 2020 Guide: Scrum TEAMS \"internally decide who does what, when, and how.\" The key calls that a misreading." },
  { n: 341, id: "4282297a", cert: "SM-AI-I",
    why: "SAFe does NOT keep a single Product Backlog -- it has ART and Team backlogs. The key says all three do." },
  { n: 222, id: "f0cfcac8", cert: "SM-AI-I",
    why: "The 2020 Guide: the SCRUM TEAM creates the Definition of Done. The key says \"the Developers\" (2017 wording), and no option is correct." },
  { n: 202, id: "0896c92e", cert: "SM-AI-I",
    why: "The 2020 Guide: the Product Owner \"may delegate the responsibility to others... remains accountable.\" That is option a nearly word for word, and the key rejects it." },
];

export const TIER_B = [
  { n: 290, id: "5ea5663f", cert: "SM-AI-I", why: "Sprint Planning is whole-team in the 2020 Guide" },
  { n: 249, id: "c15bfd3c", cert: "SM-AI-I", why: "\"hardening Sprint\" called a gap", candidate_missed: true },
  { n: 189, id: "7c7c4f5f", cert: "SM-AI-I", why: "two defensible options", candidate_missed: true },
  { n: 311, id: "34c109a8", cert: "SM-AI-I", why: "two defensible options", candidate_missed: true },
  { n: 312, id: "7938f0eb", cert: "SM-AI-I", why: "two defensible options", candidate_missed: true },
  { n: 299, id: "d7d0f799", cert: "SM-AI-I", why: "\"never show undone work\" is not in the Guide" },
  { n: 300, id: "d9836819", cert: "SM-AI-I", why: "\"never show undone work\" is not in the Guide" },
  { n: 302, id: "916b683e", cert: "SM-AI-I", why: "\"never show undone work\" is not in the Guide" },
  { n: 195, id: "39dcb820", cert: "SM-AI-I", why: "two defensible options" },
  { n: 197, id: "d56397d4", cert: "SM-AI-I", why: "two defensible options" },
  { n: 241, id: "c475334f", cert: "SM-AI-I", why: "two defensible options", candidate_missed: true },
  { n: 204, id: "b898581c", cert: "SM-AI-I", why: "nobody is accountable for facilitating the Daily Scrum" },
  { n: 268, id: "83f18417", cert: "SM-AI-I", why: "the Scrum Master ends a Developer event" },
  { n: 252, id: "84acea98", cert: "SM-AI-I", why: "the 2017 \"first days\" rule" },
  { n: 261, id: "476a4a0c", cert: "SM-AI-I", why: "the 2017 \"at least one improvement\" rule" },
  { n: 256, id: "4a4569a6", cert: "SM-AI-I", why: "two defensible options" },
  { n: 176, id: "29959842", cert: "SM-AI-I", why: "two defensible options" },
  { n: 191, id: "c81b53a2", cert: "SM-AI-I", why: "two defensible options" },
  { n: 181, id: "4666275a", cert: "SM-AI-I", why: "explanation states \"Dedication replaced Commitment\", which no Guide did" },
  { n: 231, id: "e8f2dd0c", cert: "SM-AI-I", why: "explanation asserts per-item reject, contradicting #240" },
  { n: 226, id: "2faab9a1", cert: "SM-AI-I", why: "explanation contradicts #227" },
  { n: 227, id: "e7460496", cert: "SM-AI-I", why: "explanation contradicts #226" },
  { n: 342, id: "38b1d499", cert: "SM-AI-I", why: "explanation invents a \"SAFe Chief Product Owner\"" },
  { n: 128, id: "7fc0401f", cert: "AISM-I", why: "two defensible options", candidate_missed: true },
  { n: 132, id: "6902cf27", cert: "AISM-I", why: "two defensible options" },
  { n: 143, id: "e43bd6a8", cert: "AISM-I", why: "the explanation cites a fact the stem does not give" },
  { n: 127, id: "251045a1", cert: "AISM-I", why: "two defensible options" },
  { n: 74, id: "e0646031", cert: "AIE-I", why: "contradicts the logic of #72" },
  { n: 84, id: "2d1af4b4", cert: "AIE-I", why: "two defensible options" },
  { n: 96, id: "da20ee66", cert: "AIE-I", why: "the key names a person the stem never introduces" },
];

/** Identical stems -- a form that places both gives one away. */
export const DUPLICATE_STEMS = [{ a: "2dfebd3a", b: "61782aae" }];

/**
 * Resolve declared prefixes against a list of live rows.
 * Throws on a prefix that matches none or more than one: a silent miss scores
 * nothing and a silent double scores the wrong item, and both look like a pass.
 */
export function resolvePrefixes(declared, rows) {
  const out = [];
  const problems = [];
  for (const d of declared) {
    const hits = rows.filter((r) => r.id.startsWith(d.id));
    if (hits.length !== 1) {
      problems.push(d.id + " (#" + d.n + ") matched " + hits.length + " live row(s)");
      continue;
    }
    out.push({ ...d, full: hits[0].id, row: hits[0] });
  }
  if (problems.length) {
    throw new Error("prefix resolution failed:\n  " + problems.join("\n  "));
  }
  return out;
}
