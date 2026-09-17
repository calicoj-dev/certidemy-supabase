/**
 * lesson-repairs-ismsia-m1.mjs - ISMS-IA module 1, five lessons.
 *
 * 7 prose runs. THE BLOCKQUOTES ARE NOT HERE and that is the point: under
 * IP-POSITION 6 as amended, an attributed quotation is permitted output, so
 * this module's quoted clause text stays exactly as written. Only prose that
 * reproduces ISO's wording WITHOUT being marked as a quotation is repaired.
 *
 * That is the whole difference between this file and the AIMS-IA ones. The same
 * lessons under the old rule would have needed every blockquote recast too.
 *
 * ============ FIVE OF THE SEVEN REUSE A RECAST ALREADY CHECKED ============
 *
 * Clause 4.6's independence sentences and the ISO/IEC 17021-1 title were all
 * settled on AIMS-IA modules 1 and 3. ISMS-IA teaches the same 19011 clauses
 * against a different standard, so the overlap is structural rather than
 * coincidental and the wording should match where the sentence does.
 *
 * ============ EVERY `should` STAYS A `should` ============
 *
 * Clause 4.6 is the lesson subject in 01-02 and 01-03 -- "wherever practicable",
 * "every effort should be made" -- and 01-03's whole checkpoint turns on the
 * difference between what 19011 requires and what it advises.
 */

export const REPAIRS = [
  {
    cert: "ISMS-IA", slug: "isms-ia-01-01-audit-parties", address: "27001:2022 Annex A control 5.35",
    note: "1 run",
    en: {
      /* THE COMMA. `norm()` strips punctuation before matching, so the RUN
       * reads "...at planned intervals or when significant changes occur" while
       * the SOURCE has a comma after "intervals". A `before` copied from the
       * reported run does not exist in the document. First span of this pass to
       * be refused for it, and the refusal is why the file says so. */
      before: "to be reviewed independently at planned intervals, or when significant changes occur",
      after: "to be reviewed independently at planned intervals, and whenever significant change occurs",
    },
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-01-02-principles-in-tension", address: "19011:2026 clauses 4.2 to 4.8",
    note: "2 runs; both recast as on AIMS-IA 01-04",
    en: {
      before: "- **Independence** - the basis for the impartiality of the audit and the objectivity of its conclusions.",
      after: "- **Independence** - the ground on which the audit's impartiality and its conclusions' objectivity both rest.",
    },
    also: [
      { before: "Independence says the auditor should be independent of the activity being audited wherever practicable",
        after: "Independence says the auditor should stand apart from the activity audited, wherever that is practicable" },
      /* CLAUSE 4.1's REASON, QUOTED TWICE IN ONE LESSON. Both instances carry
       * the run and both are recast; the third mention ("shared principles let
       * independent auditors reach similar conclusions") is already short
       * enough and is left alone. */
      { before: "and to enabling auditors working independently of one another to reach similar conclusions in similar circumstances.",
        after: "and to letting auditors who work separately arrive at comparable conclusions in comparable situations." },
      { before: "is what enables **auditors working independently of one another to reach similar conclusions in similar circumstances**.",
        after: "is what lets **auditors who work separately arrive at comparable conclusions in comparable situations**." },
    ],
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-01-03-objectivity-of-the-assignment", address: "19011:2026 clause 4.6",
    note: "1 run, inside a checkpoint explanation; `should` preserved because the checkpoint is about it",
    en: {
      before: "states that where it is not possible for internal auditors to be independent of the activity being audited, every effort should be made to remove bias and encourage objectivity",
      after: "states that where internal auditors cannot stand apart from what they audit, every effort should go into stripping out bias and encouraging objectivity",
    },
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-01-04-competence-of-the-team", address: "19011:2026 clause 7.2.3, generic competence",
    note: "1 run",
    en: {
      before: "collecting information through effective interviewing, listening, observing and reviewing documented information",
      after: "collecting information through interviews, listening, observation and the review of documented information",
    },
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-01-05-which-document-says-what", address: "19011:2026 introduction and clause 3; 27001:2022 clause 3",
    note: "2 runs; the 17021-1 sentence is the recast used on AIMS-IA 01-03 and 01-05",
    en: {
      before: "that ISO/IEC 17021-1 provides requirements for auditing management systems for third-party certification",
      after: "that ISO/IEC 17021-1 sets the requirements a body must meet to audit and certify management systems",
    },
    also: [
      { before: "Clause 3 states that the terms and definitions given in ISO/IEC 27000 apply",
        after: "Clause 3 states that ISO/IEC 27000's terms and definitions apply" },
    ],
  },
];
