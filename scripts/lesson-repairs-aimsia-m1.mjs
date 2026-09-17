/**
 * lesson-repairs-aimsia-m1.mjs - AIMS-IA module 1, the first five lessons.
 *
 * 17 runs. AIMS-IA is the clean case of the two auditor certifications: only 4
 * of its 234 runs sit in blockquotes, against ISMS-IA's 48, so it needs no
 * ruling and the work is the shape already proven on AIMS-F.
 *
 * FIVE OF THE 17 REUSE WORDING already checked: the auditor-selection sentence,
 * the audit-programme inputs, the ISO/IEC 17021-1 title, the planned-intervals
 * phrasing.
 *
 * ============ EVERY `should` HERE IS LOAD-BEARING ============
 *
 * This is an auditor certification and clause 4.6 is built on qualifiers --
 * "wherever practicable", "in all cases", "every effort should be made". The
 * whole lesson 01-04 is about the difference between what the standard requires
 * and what it advises, so a recast that turns one into the other destroys the
 * thing being taught. Nine of these seventeen carry a `should` and all nine
 * keep it.
 *
 * ============ AND TWO RUNS SPAN TWO LINES ============
 *
 * 01-04's 12-word and 37-word runs each cross a line break between list items.
 * `apply-marking-spec` splices per line, so a multi-line `before` matches
 * nothing. They are written as separate single-line spans, which is also the
 * only form the translation pass can align positionally.
 */

export const REPAIRS = [
  {
    cert: "AIMS-IA", slug: "aims-ia-01-01-who-commissioned-it", address: "19011 clauses 3.1, 3.13",
    note: "2 runs; the second is inside a ::checkpoint explanation",
    en: {
      before: "obtaining objective evidence and evaluating it objectively to determine the extent to which the audit criteria are fulfilled",
      after: "obtaining objective evidence and weighing it objectively to judge how far the audit criteria have been met",
    },
    also: [
      { before: "in an internal audit the audit client can also be the auditee",
        after: "in an internal audit the client may also be the auditee" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-01-02-when-two-principles-disagree", address: "19011 clauses 4.1, 4.4, 4.7, 4.8",
    note: "3 runs; the bold and italic spans are preserved because the lesson turns on them",
    en: {
      before: "the guidance in Clauses 5 to 7 is **based on** the seven principles outlined in 4.2 to 4.8",
      after: "the guidance in Clauses 5 to 7 rests **on those same seven principles**, set out at 4.2 to 4.8",
    },
    also: [
      { before: "the risk-based approach should *substantively influence* the planning and implementation of the audit programme",
        after: "the risk-based approach should *substantively influence* how the audit programme is planned and carried out" },
      { before: "the **ability to make reasoned judgements in all audit situations**",
        after: "the **ability to reason out a judgement in any audit situation**" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-01-03-which-document-can-carry-a-finding", address: "42001 6.1.4, 19011 6.3.2 and intro",
    note: "3 runs, two inside ::checkpoint statements; `shall` and `should` each stay as they are",
    en: {
      before: "the result of the AI system impact assessment shall be documented",
      after: "the impact assessment's result shall be documented",
    },
    also: [
      { before: "the audit plan should reflect the scope and complexity of the audit",
        after: "the audit plan should match the audit's scope and complexity" },
      { before: "**ISO/IEC 17021-1 provides requirements for auditing management systems for third-party certification**",
        after: "**ISO/IEC 17021-1 sets the requirements a body must meet to audit and certify management systems**" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-01-04-when-you-cannot-be-independent", address: "19011 clause 4.6, 42001 clause 9.2.2 b",
    note: "SIX runs, two of which cross a line break and are written as separate single-line spans",
    en: {
      before: "describes independence as the basis for the impartiality of the audit and the objectivity of the audit conclusions",
      after: "describes independence as the ground on which the audit's impartiality and its conclusions' objectivity both rest",
    },
    also: [
      { before: "- Auditors **should be independent of the activity being audited wherever practicable**, and should in all cases act in a manner free from bias and conflict of interest.",
        after: "- Auditors **should stand apart from whatever they audit, wherever that is practicable**, and should in every case act in a way free of bias and of conflicting interest." },
      { before: "- Auditors should maintain objectivity throughout, so that findings and conclusions are based **only on the audit evidence**.",
        after: "- Auditors should stay objective throughout, so that findings and conclusions rest **only on the audit evidence**." },
      { before: "- **When it is not possible for internal auditors to be independent of the activity being audited, every effort should be made to remove bias and encourage objectivity.**",
        after: "- **Where internal auditors cannot stand apart from what they audit, every effort should go into stripping out bias and fostering objectivity.**" },
      { before: "**select auditors and conduct audits to ensure objectivity and the impartiality of the audit process**",
        after: "**select auditors and run audits in a way that keeps the process objective and impartial**" },
      { before: "- Where independence is not possible, every effort should be made to remove bias and encourage objectivity.",
        after: "- Where independence is not possible, every effort should go into stripping out bias and fostering objectivity." },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-01-05-inside-and-outside-the-remit", address: "42001 clauses 9.2.1, 9.2.2; 19011 intro",
    note: "3 runs, all three already recast elsewhere in this pass",
    en: {
      /* THE FIRST SPAN STOPPED TOO EARLY. Recasting up to "conforms to the"
       * left "information on whether the AI management system conforms to the"
       * standing -- ten words of the run beyond where the replacement ended.
       * Fifth instance of one shape: a span must cover the whole run, not the
       * part of it that caught the eye. */
      before: "conduct internal audits at planned intervals to provide **information on whether** the AI management system conforms to the organization's own requirements and to the standard's, and is effectively implemented and maintained",
      after: "run internal audits at planned intervals that establish **whether** the AI management system meets the organization's own requirements and the standard's, and whether it is effectively implemented and maintained",
    },
    also: [
      { before: "consideration of the importance of the processes concerned and the results of previous audits",
        after: "consideration of how important the audited processes are and what earlier audits found" },
      { before: "**ISO/IEC 17021-1 provides requirements for auditing management systems for third-party certification**",
        after: "**ISO/IEC 17021-1 sets the requirements a body must meet to audit and certify management systems**" },
    ],
  },
];
