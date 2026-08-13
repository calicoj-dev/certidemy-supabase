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
 *
 * THE SAME DEFECT, ONE LAYER UP (August 2026)
 * -------------------------------------------
 * The single AUDIT block below was written for ISMS-IA and hardcodes ISO/IEC 27001
 * as the criteria standard - its edition set, its Statement of Applicability, its
 * absent severity scheme. Routing reached it through /auditor/ in the cert name.
 *
 * AIMS-IA is named "ISO/IEC 42001:2023 Internal Auditor". It matches /auditor/.
 * It would therefore have generated 42001 items grounded in 27001 editions - the
 * exact shape of the defect this file was created to fix, one level up: GOVERNANCE
 * caught audit certs and knew nothing about EDITIONS; AUDIT caught 42001 and knew
 * nothing about WHICH STANDARD.
 *
 * So the audit grounding is now COMPOSED, not monolithic:
 *
 *   AUDIT_METHOD     the auditing craft - ISO 19011:2026, its principles, its
 *                    annex, its modal discipline, the internal-vs-CB boundary.
 *                    True for every management-system auditor cert.
 *   CRITERIA_27001   what ISMS-IA audits against.
 *   CRITERIA_42001   what AIMS-IA audits against.
 *
 * Routing keys on the STANDARD, not on the word "auditor". An audit cert matching
 * no known standard falls back to method-only rather than silently inheriting
 * someone else's criteria - the failure mode that made this change necessary.
 *
 * KNOWN, NOT FIXED HERE: AIMS-F, ISMS-F, AISM-I and AIHR-I all fall through to
 * NEUTRAL, which carries no edition set and no never-assert list. Both Foundation
 * certs are standards-based and generated without ever being told what their
 * standard says. This is the likely mechanism behind ISMS-F task 2.3 ("environ-
 * mental-conditions" where Amd 1:2024 says "climate change"). Fixing it forward is
 * cheap - route F-tier certs to the matching CRITERIA_* block - but it implies
 * regenerating existing banks, so it is a scoped decision, not a side effect.
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
 * THE AUDITING CRAFT - shared by every management-system auditor cert.
 *
 * WHY THIS IS SEPARATE FROM GOVERNANCE. The governance grounding was catching
 * these certs through /audit/ in the name, and it knows nothing about EDITIONS.
 * A dry run on ISMS-IA task 5.3 produced two items citing ISO 19011:2018 - the
 * superseded third edition - and one asserting that "major classification
 * requires current evidence independently supporting a significant breach", a
 * severity scheme ISO/IEC 27001 does not contain.
 *
 * Neither was a prompt failure. 101 of that cert's 169 concept descriptions name
 * no document at all, so the drafter filled the gap from training data. The
 * edition set and the dismantled claims have to reach the prompt, because the
 * concepts cannot carry them alone.
 *
 * THE ANNEX LIST is here because the critique reviewer had the edition set but
 * not the CONTENTS, so it rejected citations to annexes it could not verify - it
 * threw out a correct reference to Annex A.17 during the ISMS-IA run. Verified
 * against the standard: ISO 19011:2026 has exactly ONE annex, and A.17 is
 * "Conducting interviews".
 *
 * Every correction below was established by reading the standard text directly,
 * not from secondary sources. See the JTA attribution map.
 */
const AUDIT_METHOD = `Ground each question in the work of an INTERNAL auditor examining their own
organization's management system - planning an audit, gathering and weighing
evidence, testing a control against what the Statement of Applicability claims,
writing a finding, following up a corrective action. The candidate audits their
own organization; they are not a certification-body auditor and do not make
certification decisions.

THE AUDIT METHODOLOGY - cite this edition and no other:
  - ISO 19011:2026, the FOURTH edition, "Guidelines for auditing management
    systems". NEVER cite ISO 19011:2018 - it is superseded, and its clause
    numbering differs. The fourth edition cancels and replaces the third; its
    stated changes are expanded guidance on remote auditing methods drawn from
    ISO/IEC TS 17012, and an expanded Annex A covering remote methods and
    virtual locations.
  - ISO 19011:2026 has NO normative references and names no specific management-
    system standard. It is discipline-agnostic: it supplies the METHOD, and the
    criteria standard below supplies what is audited AGAINST.
  - ISO/IEC 17021-1 for anything about certification bodies, certification
    cycles, or certificate validity. It is out of the candidate's remit and is
    named only to mark the boundary.

ISO 19011:2026 STRUCTURE - clauses:
  1 Scope | 2 Normative references (none) | 3 Terms and definitions |
  4 Principles of auditing | 5 Managing an audit programme |
  6 Conducting an audit | 7 Competence and evaluation of auditors.

ISO 19011:2026 HAS EXACTLY ONE ANNEX. There is no Annex B. Annex A is
INFORMATIVE, titled "Additional guidance for auditors for planning and conducting
audits". Cite a subsection only if it appears in this list, and never invent one:
  A.1  Applying auditing methods            A.10 Auditing risks and opportunities
  A.2  Auditing of processes                A.11 Life cycle
  A.3  Professional judgement               A.12 Audit of supply chain
  A.4  Performance results                  A.13 Preparing audit working documents
  A.5  Verifying information                A.14 Selecting sources of information
  A.6  Sampling                             A.15 Visiting the auditee's location
       A.6.1 General                        A.16 Using remote auditing methods
       A.6.2 Judgement-based sampling       A.17 Conducting interviews
       A.6.3 Statistical sampling           A.18 Audit findings
  A.7  Auditing compliance within a               A.18.1 Determining audit findings
       management system                          A.18.2 Recording conformities
  A.8  Auditing context                            A.18.3 Recording nonconformities
  A.9  Auditing leadership and commitment          A.18.4 Dealing with audit findings
                                                          related to multiple criteria

CLAIMS THAT MUST NEVER APPEAR IN A KEY OR AN EXPLANATION - each is widely taught
and none is in the text:
  - That a standard forbids auditing your own work. ISO 19011:2026 clause 4.6
    asks auditors to be independent of the activity audited WHEREVER PRACTICABLE,
    and where internal auditors cannot be, to make every effort to remove bias
    and encourage objectivity. What the criteria standard says is set out below.
  - That "planned intervals" carries a numeric value. It never does, anywhere.
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

WHERE TWO PRINCIPLES PULL AGAINST EACH OTHER - the analyze-level heart of these
certs - the resolution is professional judgement, because nothing in the text
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
    discretion in the use and protection of information).`;

/** ISMS-IA - what an ISO/IEC 27001 internal auditor audits AGAINST. */
const CRITERIA_27001 = `THE CRITERIA STANDARD - cite these and no others:
  - ISO/IEC 27001:2022, INCLUDING Amendment 1:2024. The amendment adds one
    sentence to clause 4.1 (determine whether climate change is a relevant issue)
    and NOTE 2 to clause 4.2. Nothing else.
  - ISO/IEC 27000 for defined terms.

CLAIMS THAT MUST NEVER APPEAR IN A KEY OR AN EXPLANATION:
  - That ISO/IEC 27001 forbids auditing your own work. It does not say it.
  - That any clause requires a RISK REGISTER. No clause does. Clauses 6.1.2 and
    6.1.3 require documented information about the PROCESSES; clauses 8.2 and 8.3
    require it of the RESULTS.
  - That ISO/IEC 27001 defines MAJOR and MINOR nonconformities. It defines no
    severity scheme at all. Those categories come from third-party certification
    practice under ISO/IEC 17021-1, and an internal programme may adopt any
    scheme it declares.`;

/**
 * AIMS-IA - what an ISO/IEC 42001 internal auditor audits AGAINST.
 *
 * 42001 IS NOT 19011 AND IS NOT 27001. Read from the standard directly:
 *
 *   - 121 "shall" against 166 "should", and the split is STRUCTURAL, not mixed
 *     prose. Clauses 4-10 contain 81 "shall" and ZERO "should". Annex A is
 *     "shall". Annex B is almost entirely "should". Annexes C and D are
 *     informative.
 *   - Annex B is NORMATIVE - the contents page says so - yet restates each of the
 *     38 controls under a "Control" heading using SHOULD where Table A.1 says
 *     SHALL. The paradox resolves at clause 6.1.3 e): the organization "shall
 *     consider the guidance in Annex B". Annex B binds as an input you must
 *     consider, not as text whose own sentences are requirements.
 *   - "risk register" appears zero times, exactly as in 27001.
 *   - The climate-change wording is in the PUBLISHED FIRST EDITION. There is no
 *     amendment to 42001.
 */
const CRITERIA_42001 = `THE CRITERIA STANDARD - cite these and no others:
  - ISO/IEC 42001:2023, "Information technology - Artificial intelligence -
    Management system", FIRST edition, December 2023.
  - There is NO amendment to ISO/IEC 42001. Never cite "ISO/IEC 42001:2023/Amd
    1" or "Amendment 1:2024" for this standard - unlike ISO/IEC 27001, the
    climate-change wording is in the published first edition itself: clause 4.1
    "The organization shall determine whether climate change is a relevant
    issue", and the NOTE at 4.2 that relevant interested parties can have
    requirements related to climate change.
  - ISO/IEC 22989:2022 for defined terms. It is the ONLY normative reference in
    ISO/IEC 42001, and it is a DATED reference, so a future edition of 22989 does
    not flow through. Clause 3 of 42001 itself defines the rest.
  - ISO/IEC 42006:2025 exists and supplements ISO/IEC 17021-1 with AI-specific
    requirements for bodies that AUDIT AND CERTIFY an AIMS. It governs
    certification bodies, not this candidate. NEVER cite a clause, table or annex
    of ISO/IEC 42006 - the document is not held and no citation to it can be
    verified. Name it only to mark the boundary.

THE MODAL STRUCTURE OF ISO/IEC 42001 - this is what the cert tests:
  - Clauses 4 to 10 are the requirements. They are written entirely in "shall"
    and contain no "should" at all.
  - Annex A (NORMATIVE), "Reference control objectives and controls", holds
    Table A.1: 38 controls, each stated with "shall".
  - Annex B (NORMATIVE), "Implementation guidance for AI controls", is written in
    "should". It restates each control under a "Control" heading in the SHOULD
    form. Clause 6.1.3 e) is what makes it normative: the organization "shall
    consider the guidance in Annex B". B.1 adds that organizations do not have to
    document or justify inclusion or exclusion of implementation guidance in the
    statement of applicability.
  - Annexes C and D are INFORMATIVE.

CLAIMS THAT MUST NEVER APPEAR IN A KEY OR AN EXPLANATION:
  - That ISO/IEC 42001 forbids auditing your own work. It does not say it.
    Clause 9.2.2 b) asks the organization to select auditors and conduct audits
    to ensure objectivity and the impartiality of the audit process, and names no
    independence rule beyond that.
  - That any clause requires a RISK REGISTER. The phrase appears nowhere in the
    standard. Clause 6.1.3 requires a documented risk treatment PROCESS and a
    statement of applicability; 6.1.4 requires the RESULT of the AI system impact
    assessment to be documented.
  - That ISO/IEC 42001 defines MAJOR and MINOR nonconformities. It defines no
    severity scheme. Clause 10.2 describes reacting to a nonconformity and
    corrective action without grading it.
  - That Annex B is informative. It is normative - but see the modal note above,
    and never quote an Annex B sentence as a requirement.
  - That a Table A.1 control is required unconditionally. Annex A.1 states that
    "Not all the control objectives and controls listed in Table A.1 are required
    to be used", and clause 6.1.3 b)-d) has the organization compare, consider
    and extend them. Every Table A.1 "shall" is conditional on that control being
    necessary and declared in the statement of applicability. Write "where A.2.2
    is selected, the organization shall document an AI policy", never "ISO/IEC
    42001 requires an AI policy".
  - A FINDING WHOSE EVIDENCE DOES NOT REACH THE CITED CRITERION. This is the
    commonest defect in a generated finding and it survives casual reading.
    A.2.2 requires only that the organization DOCUMENT a policy for the
    development or use of AI systems - so a policy that exists but omits some
    content does NOT breach A.2.2, and no clause requires a policy to mention
    any particular topic. Content requirements for the AI policy are at clause
    5.2 and are different. Before writing any finding, read the cited text and
    confirm the evidence would actually fail it.

CLAUSE LETTERS AND SUB-CLAUSE NUMBERS - THE HARDEST RULE IN THIS BLOCK.
Do NOT assert a sub-clause letter or number unless it appears in this grounding
block. Cite the clause at the level you can verify: "clause 6.1.2" and "clause
5.2" are safe; "6.1.2 c)" and "5.2 e)" are claims about internal structure and
are frequently wrong. Two observed failures, both from importing ISO/IEC 27001:
  - "clause 6.1.2 c) requires documented acceptance criteria" - FALSE TWICE.
    6.1.2 c) is "identifies risks that aid or prevent achieving its AI
    objectives", and the phrase "acceptance criteria" appears NOWHERE in
    ISO/IEC 42001. Risk criteria are required by clause 6.1.1, which requires
    the organization to establish and maintain AI risk criteria that support
    distinguishing acceptable from non-acceptable risks; 6.1.2 e) 1) compares
    the analysis against those criteria and points back to 6.1.1.
  - "clause 5.2 e) requires policy communication" - THERE IS NO 5.2 e).
    Clause 5.2 runs a) to d) for the policy's properties, then uses DASHES for:
    available as documented information; refer as relevant to other
    organizational policies; communicated within the organization; available to
    interested parties as appropriate. Cite "clause 5.2" and quote the dash item.

THE COMPLETE TABLE A.1 CONTROL LIST. Cite a control ONLY if it appears here.
Inventing a control number is the same defect as inventing a clause letter, and
it was observed once (A.6.1.5, which does not exist - A.6.1 has exactly two
controls). There are 38 controls in nine families:
  A.2  Policies related to AI               A.2.2  A.2.3  A.2.4
  A.3  Internal organization                A.3.2  A.3.3
  A.4  Resources for AI systems             A.4.2  A.4.3  A.4.4  A.4.5  A.4.6
  A.5  Assessing impacts of AI systems      A.5.2  A.5.3  A.5.4  A.5.5
  A.6  AI system life cycle
       A.6.1 Management guidance for AI system development   A.6.1.2  A.6.1.3
       A.6.2 AI system life cycle  A.6.2.2  A.6.2.3  A.6.2.4  A.6.2.5  A.6.2.6
                                   A.6.2.7  A.6.2.8
  A.7  Data for AI systems                  A.7.2  A.7.3  A.7.4  A.7.5  A.7.6
  A.8  Information for interested parties   A.8.2  A.8.3  A.8.4  A.8.5
  A.9  Use of AI systems                    A.9.2  A.9.3  A.9.4
  A.10 Third-party and customer relations   A.10.2 A.10.3 A.10.4
Note the numbering starts at .2 in every family - the .1 slot is the family's
own objective statement, not a control. There is no A.2.1, no A.4.1 control,
and no A.6.1.4 or A.6.1.5.
  - That ISO/IEC 42001 requires the use of ISO 19011. It does not. ISO 19011 is
    named once, in a Note to entry under clause 3.18, observing that "audit
    evidence" and "audit criteria" are defined there. Clause 9.2 sets out the
    internal audit requirement in its own words.
  - That the AI system impact assessment (6.1.4, 8.4) and the AI risk assessment
    (6.1.2, 8.2) are the same activity. They are distinct: the impact assessment
    addresses consequences for individuals, groups and societies, and 6.1.4
    requires its results to be CONSIDERED IN the risk assessment.
  - That clause 6.1.4 requires a SEPARATE or DISTINCT process, or that one
    document cannot satisfy both 6.1.4 and 6.1.2. The clause requires a defined
    process, a documented result, and consideration of that result in the risk
    assessment. It prescribes no document count and no format. Where an
    organization merges them, the available finding is that the CONSIDERATION
    cannot be evidenced - never that a merged document is forbidden.
  - That the NOTE under 6.1.2 d) 1) does not exist. It does: "When assessing the
    consequences as part of 6.1.2 d) 1), the organization can utilize an AI
    system impact assessment as indicated in 6.1.4." It is a "can" - permission
    to draw on the impact assessment inside the risk assessment, not permission
    to let one process discharge both requirements.

ONE DRAFTING ANOMALY, stated so an item does not trip on it: Note 2 to entry
under clause 3.26 (statement of applicability) contains "shall" - all identified
risks and the controls addressing them shall be reflected in the statement of
applicability. A note carrying a requirement is unusual and an item should not
turn on whether notes are normative in general. Prefer clause 6.1.3 f), which
requires the statement of applicability in the requirement text itself.`;

/** The close, appended to every composed audit grounding. */
const AUDIT_TAIL = `A DISTRACTOR built on one of these is excellent - they are exactly the
misconceptions this exam exists to detect. The KEY and the EXPLANATION must be
clean.

Where an item turns on what a document says, name the document and preserve the
modal: "shall" is a requirement, "should" is guidance, and a NOTE is neither.
${NO_BRAND}`;

/** Compose the auditing craft with the criteria standard for this cert. */
function auditGrounding(criteria) {
  return `${AUDIT_METHOD}

${criteria}

${AUDIT_TAIL}`;
}

const AUDIT_27001 = auditGrounding(CRITERIA_27001);
const AUDIT_42001 = auditGrounding(CRITERIA_42001);

/**
 * An audit cert whose criteria standard is not yet registered. Method only -
 * never someone else's editions. If you are seeing this in a generation log, add
 * a CRITERIA_* block before generating a single item.
 */
const AUDIT_METHOD_ONLY = `${AUDIT_METHOD}

THE CRITERIA STANDARD for this certification is not registered in
item-grounding.mjs. Do NOT assume one, and do NOT cite the edition of any
management-system standard. Ground every question in the concept descriptions
provided and in ISO 19011:2026 audit methodology alone.

${AUDIT_TAIL}`;

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
 *                          "ISO/IEC 42001:2023 Internal Auditor"
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
  // Route on the STANDARD, not on the word "auditor": the criteria half differs
  // per cert and inheriting the wrong one is silent and total.
  if (/auditor|internal audit/.test(n)) {
    if (/42001|\baims\b/.test(n)) return AUDIT_42001;
    if (/27001|\bisms\b/.test(n)) return AUDIT_27001;
    return AUDIT_METHOD_ONLY;
  }

  // AI governance / risk / compliance.
  if (/governance|risk|compliance|audit/.test(n)) return GOVERNANCE;

  return NEUTRAL;
}

/** Exported for tests / inspection. */
export const GROUNDINGS = {
  SCRUM,
  GOVERNANCE,
  WORKPLACE,
  NEUTRAL,
  AUDIT_METHOD,
  CRITERIA_27001,
  CRITERIA_42001,
  AUDIT_27001,
  AUDIT_42001,
  AUDIT_METHOD_ONLY,
  /** Back-compat: the old single AUDIT constant was ISMS-IA's grounding. */
  AUDIT: AUDIT_27001,
};
