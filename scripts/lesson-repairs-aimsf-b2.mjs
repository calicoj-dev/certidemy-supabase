/**
 * lesson-repairs-aimsf-b2.mjs - AIMS-F lessons, batch 2.
 *
 * Six lessons, TWELVE runs. The census counted two distinct PASSAGES per lesson
 * and 05-03 carries three runs, because two of its three are cuts of the same
 * clause at different lengths and merge into one passage positionally. Passages
 * are the right unit for estimating work; RUNS are the unit the gate measures.
 * Both numbers are correct and they are not the same number.
 *
 * Five of the twelve reuse wording already checked in batch 1 or the blueprint
 * pass: the relationship-controls list reorder, the conformity-evidence
 * sentence, the management-review outputs sentence, and the Annex A optionality
 * phrasing. Cross-surface reuse keeps turning up because the same dozen ISO
 * sentences are what a Foundation certification is about.
 *
 * TWO ARE INSIDE ::checkpoint JSON BLOCKS -- 05-03 and 04-02. Not bank items,
 * and not served over MCP, since courseware-read replaces content_md with
 * PUBLISHED_BLOCKS only. Repaired anyway: a learner reads them in the app, and
 * a checkpoint that contradicts the prose above it is its own defect.
 */

export const REPAIRS = [
  {
    cert: "AIMS-F", slug: "02-02-determining-the-scope", address: "42001 A.10 relationship controls",
    note: "TWO runs. The second is the harmonised-structure clause list, which the first dump missed because its output was tail-truncated -- a reminder that a scan read through `tail` is a scan read in part.",
    en: {
      before: "responsibilities to be allocated between the organization, its partners, suppliers, customers and third parties",
      after: "responsibilities to be allocated between the organization and its suppliers, partners, customers and other third parties",
    },
    also: [{
      /* A LIST whose run is the harmonised clause ORDER. Reordered into the
       * sequence the lesson itself teaches, which changes no meaning -- the
       * cheapest repair, and the third time this shape has appeared. */
      before: "the requirements on the management system, leadership, planning, support, operation, performance, evaluation, improvement, controls and objectives.",
      after: "the requirements on leadership, planning, support, operation, improvement, performance evaluation, and the controls and objectives of the management system itself.",
    }],
  },
  {
    cert: "AIMS-F", slug: "02-05-the-ai-risk-assessment", address: "42001 Annex A risk control objectives",
    note: "a list of control objectives; recast in our own words, order kept because the lesson walks them in order",
    en: {
      before: "Distinguishing acceptable from non-acceptable risks. Performing AI risk assessments. Conducting AI risk treatment.",
      after: "Separating acceptable risk from unacceptable. Running AI risk assessments. Treating the risk that results.",
    },
    also: [{
      before: "It expects the organization to first adopt a vision of risk adapted to its own context",
      after: "It expects the organization to start by adopting a view of risk that fits its own context",
    }],
  },
  {
    cert: "AIMS-F", slug: "01-01-what-an-aims-is", address: "42001 clause 0.1 and clause 1",
    note: "second span is the conformity-evidence sentence, recast as in batch 1",
    en: {
      before: "combine established frameworks, other International Standards, and its own experience to implement things like",
      after: "combine established frameworks, other standards and its own experience when implementing things like",
    },
    also: [{
      before: "can generate evidence of its responsibility and accountability regarding its role with respect to AI systems.",
      after: "can produce evidence that it is responsible and accountable for whatever role it holds around AI systems.",
    }],
  },
  {
    cert: "AIMS-F", slug: "02-08-risk-treatment-and-the-soa", address: "42001 Annex A intro and clause 6.1.3",
    note: "`can` held as `may`; `shall` held as `shall`",
    en: {
      before: "and additional control objectives and controls can be needed",
      after: "and further control objectives and controls may be needed",
    },
    also: [{
      before: "**shall obtain approval from designated management** for the AI risk treatment plan **and for acceptance of the",
      after: "**shall get sign-off from designated management** on the AI risk treatment plan **and on accepting the",
    }],
  },
  {
    cert: "AIMS-F", slug: "05-03-aims-management-review", address: "42001 clause 9.3.3",
    note: "THREE runs. Spans two and three are the same clause at different cuts; the third is inside a ::checkpoint block.",
    en: {
      before: "to include **decisions related to continual improvement opportunities and any need for changes to the AI management system.**",
      after: "to record **what was decided about improvement opportunities and about any changes the AI management system needs.**",
    },
    also: [
      { before: "Documented information must be available as evidence of the results of management reviews.",
        after: "Documented information must be kept as evidence of what management reviews produced." },
      { before: '"text": "Decisions related to continual improvement opportunities and any need for changes to the AIMS"',
        after: '"text": "What was decided about improvement opportunities and about any changes the AIMS needs"' },
    ],
  },
  {
    cert: "AIMS-F", slug: "04-02-annex-a-and-the-soa", address: "42001 Annex A note and SoA justifications",
    /* SAME LEXICAL OVERRIDE AS tasks.knowledge 4.2. "organizations may not
     * require all the controls" uses `require` to mean NEED -- the
     * organization's need for a control -- not a duty the standard imposes.
     * The guard counts the word and cannot see the subject. The recast keeps
     * the permissive sense exactly. */
    obligation_override: "the source's `require` means `need`, not a duty imposed by the standard; `may` is preserved twice over",
    note: "second span is inside a ::checkpoint explanation",
    en: {
      before: "organizations may not require all the controls listed in Annex A, **or may even exceed the list**",
      after: "an organization may need only some of the Annex A controls, **or may go beyond the list**",
    },
    also: [{
      before: "for excluding control objectives in general or for specific AI systems, whether those listed in Annex A or established by the organization.",
      after: "for excluding control objectives across the board or for particular AI systems, whether they come from Annex A or from the organization itself.",
    }],
  },
];
