/**
 * item-grounding.mjs - per-cert scenario grounding for the shared item pipeline.
 *
 * WHY THIS EXISTS
 * ---------------
 * `item-pipeline.mjs` used to carry a single module-level GROUNDING constant hard-
 * coded to Scrum / product-ownership practice. Because the pipeline is SHARED by
 * every cert, that text was injected into the draft prompt for ALL certs. Certs
 * whose concepts self-anchor (AIGRM-I: risk tiers, model cards) mostly resisted it.
 * Certs whose concepts are generic (AIE-I: "what is a prompt", "hallucination") did
 * not: the drafter produced sprint-backlog and Sprint-Review scenarios for an AI
 * literacy exam aimed at HR, marketing, finance and ops staff.
 *
 * That is a VALIDITY defect, not a style nit. An item that requires a candidate to
 * parse Scrum jargon tests Scrum literacy on top of the construct we intend to
 * measure - a construct-irrelevant variable, and one that sails past every existing
 * gate (firewall, floors, cue-guard) untouched.
 *
 * The fix: grounding is selected PER CERT. The Scrum text is preserved verbatim as
 * the Scrum-cert grounding, so a future top-up run on SM/SPO/SD generates exactly as
 * before (no regression). Unknown certs get a NEUTRAL professional default rather
 * than silently inheriting Scrum - this is what makes the generator honestly
 * cert-agnostic for the certs still to come (ITIL, cyber, cloud, PM).
 *
 * Matching is on the cert NAME (what the generators already pass as `certName`,
 * with the "Certidemy " prefix stripped), so no generator signature changes.
 *
 * Every grounding string ends with the standing rule: never name a certification
 * provider or brand.
 */

const NO_BRAND = `Do NOT reference any specific certification provider or brand.`;

/** The original text, preserved verbatim - SM-AI-I / SPO-AI-I / SD-AI-I. */
const SCRUM = `Ground each question in the concept(s) provided and in established Scrum and
product-ownership practice (the 2020 Scrum Guide where it applies). Some concepts
extend beyond the Scrum Guide - product strategy, backlog craft, value and
measurement, and AI-assisted product ownership; for those, ground the question in
the concept description and sound product-management practice rather than forcing
a Scrum Guide citation. ${NO_BRAND}`;

/** AIGRM-I - AI governance, risk and compliance practitioners. */
const GOVERNANCE = `Ground each question in the concept(s) provided and in established AI governance,
risk-management and compliance practice. Scenarios should read like the real work
of governance, risk, compliance, legal, audit and data-protection professionals -
classifying a system's risk, running an impact assessment, documenting a model,
handling an incident, evidencing a control to an auditor. Where a concept extends
beyond any single framework, ground the question in the concept description and
sound governance practice rather than forcing a framework citation. Do NOT use
Scrum roles, ceremonies or artifacts (Sprint, Product Owner, backlog, Definition
of Done) - they are irrelevant to this audience. ${NO_BRAND}`;

/**
 * AIE-I - AI literacy for NON-TECHNICAL professionals. The audience is HR,
 * marketing, sales, operations, finance, leadership and education. This grounding
 * is deliberately explicit about what is OUT of bounds, because the concepts here
 * are generic enough that a drafter will otherwise import jargon from elsewhere.
 */
const WORKPLACE = `Ground each question in the concept(s) provided and in ordinary, everyday workplace
practice. The candidate is a NON-TECHNICAL professional - an HR coordinator, a
marketing associate, a sales representative, an operations lead, a finance analyst,
an office manager, a teacher, a team leader. Scenarios must be drawn from that
world: drafting an email or a report, summarizing a document, answering routine
customer questions, reviewing a supplier list, preparing a slide for a meeting,
screening applications, checking a figure before publishing it.

HARD CONSTRAINTS:
  - Do NOT use Scrum or agile roles, ceremonies or artifacts (Sprint, Sprint Review,
    Product Owner, Scrum Master, product backlog, user stories, Definition of Done,
    story points, velocity, retrospectives). They are not part of this exam and a
    candidate cannot be assumed to know them.
  - Do NOT use software-engineering, data-science or product-management craft
    vocabulary (deploying a model, fine-tuning, pipelines, APIs, prioritization
    frameworks). Assume NO technical background whatsoever.
  - Do NOT assume the candidate builds, configures or evaluates AI systems. They
    USE everyday AI tools as part of ordinary office work.
  - Keep scenarios short, plain-language, and globally neutral - no idioms, no
    country-specific institutions, no currency assumptions.

Test judgment about USING AI sensibly at work: recognizing what a tool can and
cannot do, spotting a likely fabrication, deciding what must be verified, knowing
what data must never be pasted into a public tool, and knowing when a human must
stay in the loop. ${NO_BRAND}`;

/** Fallback for any cert not yet registered - neutral, never Scrum. */
const NEUTRAL = `Ground each question in the concept(s) provided and in established professional
practice for this subject area, as described by the concept descriptions
themselves. Scenarios should reflect the real working context of the practitioner
this certification is aimed at. Do NOT import vocabulary, roles or ceremonies from
unrelated disciplines (in particular, do NOT use Scrum or agile roles, ceremonies
or artifacts unless the concepts themselves are about Scrum). ${NO_BRAND}`;

/**
 * Resolve grounding from the cert name the generators already pass.
 * Order matters: check the most specific patterns first.
 *
 * @param {string} certName e.g. "AI Essentials I", "Scrum Master I - AI",
 *                          "AI Governance & Risk Management I"
 * @returns {string} the grounding block to inject into the draft prompt
 */
export function groundingFor(certName) {
  const n = (certName || "").toLowerCase();

  // Scrum family (Scrum Master / Scrum Product Owner / Scrum Developer).
  if (/\bscrum\b/.test(n)) return SCRUM;

  // AI Essentials (literacy tier) - check BEFORE governance, since both say "AI".
  if (/essential/.test(n)) return WORKPLACE;

  // AI governance / risk / compliance.
  if (/governance|risk|compliance|audit/.test(n)) return GOVERNANCE;

  return NEUTRAL;
}

/** Exported for tests / inspection. */
export const GROUNDINGS = { SCRUM, GOVERNANCE, WORKPLACE, NEUTRAL };
