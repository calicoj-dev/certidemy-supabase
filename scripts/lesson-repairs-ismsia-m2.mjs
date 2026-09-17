/**
 * lesson-repairs-ismsia-m2.mjs - ISMS-IA module 2, six lessons.
 *
 * 20 runs, and TWO KINDS OF ENTRY in one file.
 *
 *   ATTRIBUTION  02-04 and 02-06 carry bare blockquotes. Their lead-ins gain a
 *                clause address and not one word of quoted text changes. Those
 *                quotations then become exempt under IP-POSITION 6, and several
 *                of this module's runs disappear without being rewritten.
 *   PROSE        everything else -- ISO's wording reproduced OUTSIDE a marked
 *                quotation, which the amended rule still does not permit.
 *
 * They belong in one batch because a lesson has to end the batch SERVABLE, and
 * neither half gets these lessons there alone. The generator enforces that: it
 * refuses any entry whose lesson still measures at or above the threshold.
 *
 * ============ AN INLINE QUOTATION IS NOT EXEMPT, AND THAT IS A CHOICE =======
 *
 * 02-01 carries clause 9.2.2's sentence inside quotation marks in running prose:
 * *"Consider the importance of the processes concerned..." is the sentence to
 * know.* It is quoted, and the clause is named in the same paragraph.
 *
 * The exemption is BLOCKQUOTE-SCOPED. The decision that amended section 6 was
 * about "a marked, attributed blockquote", and `iso-segments.mjs` implements
 * exactly that. An inline quotation is still measured, so this one is recast.
 *
 * Widening the exemption to inline quotation marks would be a real decision with
 * a real cost -- quotation marks appear in this corpus around defined terms,
 * around an auditor's words in a scenario, and as scare quotes, so the exemption
 * would start firing on text nobody intended to mark. Flagged here rather than
 * taken quietly.
 *
 * ============ CLAUSE 9.2.2's TWO NAMED INPUTS, SIX TIMES ============
 *
 * "the importance of the processes concerned and the results of previous audits"
 * is the subject of 02-01 and recurs through 02-06. It uses the recast already
 * checked across five AIMS-IA lessons. Where a line quotes only PART of it --
 * "the results of previous audits", five words -- it is under the threshold and
 * is left exactly as written.
 */

export const REPAIRS = [
  {
    cert: "ISMS-IA", slug: "isms-ia-02-01-what-the-programme-is-for", address: "27001:2022 clause 9.2.2",
    note: "2 runs; the inline quotation is recast because inline is not exempt",
    en: {
      before: "\"Consider the importance of the processes concerned and the results of previous audits\" is the sentence to know.",
      after: "Clause 9.2.2's two named inputs -- process importance and earlier audit results -- are the thing to know.",
    },
    also: [
      { before: "{ \"id\": \"b\", \"text\": \"The importance of the processes concerned and the results of previous audits.\" },",
        after: "{ \"id\": \"b\", \"text\": \"How important the audited processes are, and what earlier audits found.\" }," },
    ],
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-02-02-where-the-effort-goes", address: "19011:2026 clause 4.8",
    note: "1 run",
    en: {
      before: "so that audits focus on matters that are significant for the audit client and for achieving the audit programme objectives",
      after: "so that audits stay focused on what matters to the audit client and on meeting the programme's objectives",
    },
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-02-03-scope-criteria-objectives", address: "19011:2026 clause 3, 42001 9.2.2 a), 27001 Clause 1",
    note: "4 runs; Clause 1's exclusion sentence is quoted twice and both are recast",
    en: {
      before: "criteria may include policies, procedures, work instructions, legal requirements, contractual obligations",
      after: "criteria may be policies, procedures or work instructions, legal requirements and contractual obligations",
    },
    also: [
      { before: "requires the organization to define the audit *objectives*, criteria and scope for each audit.",
        after: "requires the organization to set the *objectives*, criteria and scope of each individual audit." },
      { before: "**ISO/IEC 27001 Clause 1 states that excluding any of the requirements specified in Clauses 4 to 10 is not acceptable when",
        after: "**ISO/IEC 27001 Clause 1 states that leaving out any requirement of Clauses 4 to 10 is not acceptable where" },
      { before: "\"explanation\": \"Clause 1 states that excluding any of the requirements specified in Clauses 4 to 10 is not acceptable when",
        after: "\"explanation\": \"Clause 1 states that leaving out any requirement of Clauses 4 to 10 is not acceptable where" },
    ],
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-02-04-choosing-the-method", address: "19011:2026 clause 3 and Annex A.16",
    note: "ATTRIBUTION for the virtual-location quote, plus 5 prose runs",
    en: {
      before: "The second note defines what a virtual location is:",
      after: "ISO 19011:2026's second note defines what a virtual location is:",
    },
    also: [
      { before: "Remote methods can be combined with on-site methods to achieve a full and effective audit.",
        after: "Remote methods can be mixed with on-site ones to make an audit full and effective." },
      { before: "at one site of the auditee to audit another site",
        after: "at one of the auditee's sites to audit a different one" },
      { before: "defines a virtual location as one where an organization performs work or provides a service using an online environment",
        after: "defines a virtual location as one where an organization does work or delivers a service through an online environment" },
      { before: "a place where the organization performs work using an online environment",
        after: "a place where the organization does work through an online environment" },
      { before: "**can introduce additional risks and opportunities to the audit process**",
        after: "**can bring additional risks and opportunities into the audit process**" },
      { before: "as one used for conducting audit activities from any place other than the location of the auditee",
        after: "as one used to carry out audit activities from anywhere other than where the auditee is" },
    ],
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-02-05-who-does-the-audit", address: "19011:2026 clause 5.5.4",
    note: "1 run",
    en: {
      before: "treats assigning responsibility for an individual audit to the audit team leader as a distinct step",
      after: "treats handing an individual audit to its team leader as a distinct step",
    },
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-02-06-testing-the-programme", address: "27001:2022 clause 9.2.2",
    note: "THREE attribution edits retire the quoted runs; three prose runs remain and are recast",
    en: {
      before: "The second subclause governs the programme itself:",
      after: "Clause 9.2.2, the second subclause, governs the programme itself:",
    },
    also: [
      { before: "Then the sentence from lesson 02-01, and three lettered requirements:",
        after: "Then the sentence from lesson 02-01, and clause 9.2.2's three lettered requirements:" },
      { before: "**And the closing requirement:**",
        after: "**And clause 9.2.2's closing requirement:**" },
      { before: "and it names what should inform it: the importance of the processes concerned and the results of previous audits.",
        after: "and it names what should inform it: how important the audited processes are, and what earlier audits found." },
      { before: "clause 9.2.2 requires the importance of the processes concerned and the results of previous audits to be considered when establishing the programme,",
        after: "clause 9.2.2 requires how important the audited processes are and what earlier audits found to be considered when establishing the programme," },
      { before: "The clause requires documented information as evidence of **the implementation of the audit programme and the audit results.**",
        after: "The clause requires documented information showing **both that the programme was implemented and what the audits found.**" },
    ],
  },
];
