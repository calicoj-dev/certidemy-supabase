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

/**
 * Management-system AUDITING certs (ISMS-IA and successors).
 *
 * WHY THIS IS SEPARATE FROM GOVERNANCE. The governance grounding was catching
 * these certs through /audit/ in the name, and it knows nothing about EDITIONS.
 * A dry run on ISMS-IA task 5.3 produced two items citing ISO 19011:2018 - the
 * superseded third edition - and one asserting that "major classification
 * requires current evidence independently supporting a significant breach", a
 * severity scheme ISO/IEC 27001 does not contain.
 *
 * Neither was a prompt failure. 101 of this cert's 169 concept descriptions name
 * no document at all, so the drafter filled the gap from training data. The
 * edition set and the dismantled claims have to reach the prompt, because the
 * concepts cannot carry them alone.
 *
 * Each correction below was established by reading the standard text directly,
 * not from secondary sources. See the JTA attribution map.
 */
const AUDIT = `Ground each question in the work of an INTERNAL auditor examining their own
organization's management system - planning an audit, gathering and weighing
evidence, testing a control against what the Statement of Applicability claims,
writing a finding, following up a corrective action. The candidate audits their
own organization; they are not a certification-body auditor and do not make
certification decisions.

EDITIONS - cite these and no others:
  - ISO/IEC 27001:2022, INCLUDING Amendment 1:2024. The amendment adds one
    sentence to clause 4.1 (determine whether climate change is a relevant issue)
    and NOTE 2 to clause 4.2. Nothing else.
  - ISO 19011:2026, the FOURTH edition. NEVER cite ISO 19011:2018 - it is
    superseded, and its clause numbering differs.
  - ISO/IEC 17021-1 for anything about certification bodies, certification
    cycles, or certificate validity.
  - ISO/IEC 27000 for defined terms.

CLAIMS THAT MUST NEVER APPEAR IN A KEY OR AN EXPLANATION - each is widely taught
and none is in the text:
  - That a standard forbids auditing your own work. ISO/IEC 27001 does not say
    it; ISO 19011:2026 clause 4.6 asks auditors to be independent of the activity
    audited WHEREVER PRACTICABLE, and where internal auditors cannot be, to make
    every effort to remove bias.
  - That any clause requires a RISK REGISTER. No clause does. Clauses 6.1.2 and
    6.1.3 require documented information about the PROCESSES; clauses 8.2 and 8.3
    require it of the RESULTS.
  - That ISO/IEC 27001 defines MAJOR and MINOR nonconformities. It defines no
    severity scheme at all. Those categories come from third-party certification
    practice under ISO/IEC 17021-1, and an internal programme may adopt any
    scheme it declares.
  - That "planned intervals" carries a numeric value. It never does, anywhere in
    the standard.
  - That ISO 19011 REQUIRES anything. It is a guidance document - its scope says
    so - and it contains no normative requirement at all: 264 instances of
    "should" and not one operative "shall". Never write "ISO 19011 requires",
    "the standard mandates", or a stem asking "what does ISO 19011 require?".
    Write "recommends", "calls for", "advises", or name the clause and quote its
    modal.
  - That the standard STATES there is no precedence among the seven principles.
    It states nothing of the kind. The words "precedence", "hierarchy" and "rank"
    appear nowhere in the document. Clause 4.1 says only that adherence to the
    principles is fundamental, and that Clauses 5 to 7 are based on the seven
    outlined in 4.2 to 4.8. The absence of a ranking is not a stated rule of no
    ranking - the first is an observation about the text, the second is a claim
    the text does not make. Write "the standard presents all seven as fundamental
    without ranking them", never "the standard states no precedence".

WHERE TWO PRINCIPLES PULL AGAINST EACH OTHER - the analyze-level heart of this
cert - the resolution is professional judgement, because nothing in the text
ranks them. These are the pairs that genuinely collide, drawn from the clause
text itself:
  - evidence-based (4.7, sampling and verifiability) against risk-based (4.8,
    which "should substantively influence the planning and implementation of the
    audit programme");
  - independence (4.6, "wherever practicable", with the explicit internal-auditor
    carve-out: where it is not possible, "every effort should be made to remove
    bias and encourage objectivity") against due professional care (4.4,
    competence and reasoned judgement);
  - integrity (4.2, honesty) against fair presentation (4.3, which requires the
    communication to be "truthful, accurate, objective, timely, clear and
    complete");
  - fair presentation (4.3, completeness) against confidentiality (4.5,
    discretion in the use and protection of information).
A DISTRACTOR built on one of these is excellent - they are exactly the
misconceptions this exam exists to detect. The KEY and the EXPLANATION must be
clean.

Where an item turns on what a document says, name the document and preserve the
modal: "shall" is a requirement, "should" is guidance, and a NOTE is neither.
${NO_BRAND}`;

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

  // Management-system auditing certs. MUST precede the governance test, which
  // catches "Internal Auditor" via /audit/ and knows nothing about editions.
  if (/auditor|internal audit/.test(n)) return AUDIT;

  // AI governance / risk / compliance.
  if (/governance|risk|compliance|audit/.test(n)) return GOVERNANCE;

  return NEUTRAL;
}

/** Exported for tests / inspection. */
export const GROUNDINGS = { SCRUM, GOVERNANCE, AUDIT, WORKPLACE, NEUTRAL };
