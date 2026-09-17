/**
 * lesson-repairs-ismsia-m3.mjs - ISMS-IA module 3, three lessons, 4 runs.
 *
 * The smallest module in the certification, and the reason is the amended rule:
 * Conducting the Audit quotes 19011 heavily and almost all of it sits in
 * attributed blockquotes, which are now permitted output. What is left is four
 * places where ISO's wording appears in prose or in an option.
 *
 * Three of the four reuse a recast already checked on AIMS-IA -- the audit
 * definition (01-01), clause 6.4.7's degree of reliance (03-04), and Annex
 * A.16's additional risks (03-06 and ISMS-IA 02-04 this evening).
 */

export const REPAIRS = [
  {
    cert: "ISMS-IA", slug: "isms-ia-03-01-degree-of-verification", address: "19011:2026 clause 3 and 6.4.7",
    note: "2 runs, both recast as on AIMS-IA",
    en: {
      before: "and evaluating it objectively to determine the extent to which the audit criteria are fulfilled",
      after: "and weighing it objectively to judge how far the audit criteria have been met",
    },
    also: [
      { before: "Use professional judgement to determine the degree of reliance that can be placed on it as evidence.",
        after: "Use professional judgement about how far it can be relied on as evidence." },
    ],
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-03-03-what-a-screen-share-establishes", address: "19011:2026 Annex A.16",
    note: "1 run; same recast as 02-04 in this certification",
    en: {
      before: "**can introduce additional risks and opportunities to the audit process**",
      after: "**can bring additional risks and opportunities into the audit process**",
    },
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-03-07-where-the-audit-stops", address: "27001:2022 Annex A control 8.34",
    note: "1 run, in an OPTION. The lesson's blockquote of 8.34 is already attributed and stays verbatim.",
    en: {
      /* The reported run appeared in the truncated listing as ending mid-word
       * ("agreed betwee"), and a `before` copied from that would have matched
       * nothing. Read back from the row: this is the option text, not the
       * blockquote above it, which carries "8.34" in its lead-in and is
       * therefore exempt. */
      before: "which requires audit tests involving assessment of operational systems to be planned and agreed between the tester and appropriate management.",
      after: "which requires audit tests on operational systems to be planned and agreed with appropriate management, not merely notified to it.",
    },
  },
];
