/**
 * lesson-repairs-aimsf-m5.mjs - AIMS-F module 5, the three withheld lessons.
 *
 * 18 runs. Clauses 9 and 10 are the most quotable part of any management-system
 * standard -- they are lists of determinations, inputs and outputs -- so this
 * module is dense the way module 2's impact-assessment lesson is dense.
 *
 * SEVEN of the eighteen reuse wording already checked in the blueprint pass,
 * because `tasks.knowledge` 5.1 to 5.5 restate exactly these clauses. The same
 * dozen ISO sentences keep reappearing across surfaces, which is the one thing
 * that has made this cheaper than the run count suggested.
 *
 * Three sit inside ::checkpoint blocks. Not served over MCP, repaired anyway:
 * a checkpoint whose wording contradicts the prose above it teaches the
 * contradiction.
 */

export const REPAIRS = [
  {
    cert: "AIMS-F", slug: "05-01-aims-monitoring-and-measurement", address: "42001 clause 9.1, A.6.2.6",
    note: "7 runs; the four determinations of clause 9.1 are a list and are reordered as one",
    en: {
      before: "**What needs to be monitored and measured.** **The methods** for monitoring, measurement, analysis and evaluation, as applicable, to ensure valid results. **When** the monitoring and measuring is performed.",
      after: "**What to monitor and measure.** **Which methods** to use for monitoring, measurement, analysis and evaluation, so far as each applies, so that the results are valid. **When** monitoring and measurement happens.",
    },
    also: [
      { before: "the organization shall **evaluate the performance and the effectiveness of the AI management system.**",
        after: "the organization shall **evaluate how well the AI management system performs and how effective it is.**" },
      { before: "in this document, performance refers **both to results achieved by using AI systems and to results related to the AI management system itself.**",
        after: "in this document, performance covers **two things at once: what using the AI systems achieves, and how the management system itself is doing.**" },
      { before: "Where production data and output data are used to further train the model",
        after: "Where output and production data are fed back to train the model further" },
      { before: "confirm the system continues to meet its design goals and operates on production data as intended",
        after: "confirm the system still meets the goals it was designed for and still behaves as intended on production data" },
      { before: "or in ways not anticipated, the appropriateness of such uses should be considered",
        after: "or in ways nobody anticipated, whether those uses are appropriate should be considered" },
      { before: '"text": "Both results achieved by using AI systems and results related to the management system itself"',
        after: '"text": "Both what using the AI systems achieves and how the management system itself is doing"' },
    ],
  },
  {
    cert: "AIMS-F", slug: "05-02-aims-internal-audit", address: "42001 clauses 9.2.1 and 9.2.2",
    note: "7 runs; five reuse the blueprint recasts for tasks.knowledge 5.2",
    en: {
      before: "requires internal audits at planned intervals to provide information on whether the AI management system:",
      after: "requires internal audits at planned intervals, to establish whether the AI management system:",
    },
    also: [
      /* CHANGING THE LEAD-IN WAS NOT ENOUGH. `including` -> `covering` left the
       * five-item list intact, and the LIST is the run: ten words of ISO
       * ordering survive whatever introduces them. Reordered as well, which is
       * the repair this shape always needed. */
      { before: "including the frequency, methods, responsibilities, planning requirements and reporting.",
        after: "covering methods, frequency, responsibilities, reporting and planning requirements." },
      { before: "**the importance of the processes concerned and the results of previous audits.**",
        after: "**how important the processes under audit are, and what earlier audits found.**" },
      { before: "**Define the audit objectives, criteria and scope for each audit.**",
        after: "**Set the objectives, criteria and scope of each individual audit.**" },
      { before: "**Select auditors and conduct audits to ensure objectivity and the impartiality of the audit process.**",
        after: "**Select auditors and run audits in a way that keeps the process objective and impartial.**" },
      { before: "conducted so as to ensure objectivity and the impartiality of the audit process",
        after: "conducted so that the process stays objective and impartial" },
      { before: '"text": "The importance of the processes concerned and the results of previous audits"',
        after: '"text": "How important the processes under audit are, and what earlier audits found"' },
    ],
  },
  {
    cert: "AIMS-F", slug: "05-04-nonconformity-and-corrective-action", address: "42001 clauses 10.1 and 10.2",
    note: "4 runs, all reusing blueprint recasts for tasks.knowledge 5.4",
    en: {
      before: "it is custom or common practice for the organization and interested parties that the need or expectation",
      after: "the organization and its interested parties customarily take it as read that the need or expectation",
    },
    also: [
      { before: "so that it does not recur **or occur elsewhere** —",
        after: "so the same failure does not come back **or turn up elsewhere** —" },
      { before: "**the nature of the nonconformities and any subsequent actions taken**",
        after: "**what the nonconformities were and what was done about them**" },
      { before: "the suitability, adequacy and effectiveness of the AI management system",
        after: "how well the AI management system fits, whether it is adequate, and whether it works" },
    ],
  },
];
