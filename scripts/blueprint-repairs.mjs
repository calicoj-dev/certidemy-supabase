/**
 * blueprint-repairs.mjs - the blueprint passages, as data.
 *
 * Separated from the applier so the EDITS can be read without reading the
 * machinery.
 *
 * ============ IT IS 26 RUNS, NOT 18 ============
 *
 * The first count came from a scan that reported the LONGEST run per field, and
 * was written up as though longest-per-field meant one-per-field. Repairing the
 * longest run in `tasks.knowledge` then exposed a second one underneath it in
 * eight of the seventeen AIMS-F tasks.
 *
 * Same grain error as counting 484 runs where there were 271 passages, made in
 * the opposite direction: there the unit was too fine, here it was too coarse.
 * A maximum is not a count, and neither is a count a maximum.
 *
 *   ISMS-F   1 run   (1 concept description)
 *   AIMS-F  25 runs  (17 task knowledge fields, 8 of them carrying two)
 *
 * ============ WHAT A BLUEPRINT LEAK IS ============
 *
 * `mcp.task` exposes `tasks.knowledge`; `mcp.concept` exposes
 * `concepts.description`. Both are returned by get_syllabus, explain_task,
 * get_concept and search_blueprint -- the tools a partner uses to evaluate a
 * certification BEFORE buying it, and the ones needing no lesson licence.
 *
 * Every AIMS-F run is 10-17 words inside an otherwise-original 60-120 word
 * paragraph, so each repair is a phrase-level recast rather than a rewrite.
 *
 * ============ THE RECAST STRATEGY, PER SHAPE ============
 *
 * Two are LISTS whose run is nothing but ISO's ordering (2.4, 4.6). Reordering
 * breaks the n-gram and changes no meaning at all -- the cheapest correct
 * repair available, and available only because the defect was an ordering.
 *
 * The rest restate a requirement, and are recast in our own syntax WITH THE
 * MODAL HELD CONSTANT: `shall` may become `requires`, never `should`; `should`
 * may not become `must`. 4.4 is the case that nearly went wrong -- ISO says
 * event logging SHOULD be enabled and the first draft wrote `must have logging
 * switched on`, inventing an obligation on a control that offers one.
 */

export const REPAIRS = [
  /* ------------------------------------------------------------ ISMS-F: 1 */
  {
    cert: "ISMS-F", kind: "concept", key: "risk-appetite", field: "description",
    note: "the whole description was the ISO 27000 definition, verbatim",
    spans: [{
      before: "the amount of risk the organization is willing to pursue or retain",
      after: "How much risk an organization is prepared to seek out or to hold on to, decided deliberately rather than discovered after the fact.",
    }],
  },

  /* ----------------------------------------------------------- AIMS-F: 25 */
  { cert: "AIMS-F", kind: "task", key: "1.4", field: "knowledge",
    note: "restatement of Annex D.2",
    spans: [{ before: "is essential for responsible development and use of an AI system, and names",
              after: "is essential to developing and using an AI system responsibly, and names" }] },

  { cert: "AIMS-F", kind: "task", key: "1.5", field: "knowledge",
    note: "the conformity-evidence phrasing, which recurs at 5.5",
    spans: [{ before: "Conformity generates evidence of the organization's responsibility and accountability regarding its role with respect to AI systems, which is",
              after: "Conformity generates evidence that the organization is responsible and accountable for whatever role it holds around AI systems, which is" }] },

  { cert: "AIMS-F", kind: "task", key: "2.4", field: "knowledge",
    note: "A LIST. The run was ISO's ordering and nothing else; reordering changes no meaning.",
    spans: [{ before: "span risk management, impact assessment, resource management, security, safety, privacy, development, performance, human oversight, supplier relationships and data quality across",
              after: "span impact assessment, security, privacy, safety, data quality, development, performance, supplier relationships, resource management, risk management and human oversight across" }] },

  { cert: "AIMS-F", kind: "task", key: "2.7", field: "knowledge",
    note: "clause 6.1.4 quoted with `shall`; the modal is held as `requires`",
    spans: [{ before: "clause 6.1.4 states that the organization shall consider the results of the AI system impact assessment in the risk assessment, with",
              after: "clause 6.1.4 requires the impact assessment's results to be taken into account when risk is assessed, with" }] },

  { cert: "AIMS-F", kind: "task", key: "3.4", field: "knowledge",
    note: "clause 7.5 documented-information phrasing",
    spans: [{ before: "Documented information must be available to the extent necessary to have confidence that processes were carried out as planned.",
              after: "Documented information must be kept to whatever extent gives confidence that the processes ran as planned." }] },

  { cert: "AIMS-F", kind: "task", key: "3.5", field: "knowledge",
    note: "the supplier-scope phrasing",
    spans: [{ before: "or an entire AI system for use on its own or as part of another product.",
              after: "or an entire AI system, whether it is used standalone or embedded in another product." }] },

  { cert: "AIMS-F", kind: "task", key: "3.8", field: "knowledge",
    note: "the planned-intervals phrasing, TWICE -- once for risk assessments, once for impact assessments",
    spans: [
      { before: "AI risk assessments are performed at planned intervals or when significant changes are proposed or occur. The",
        after: "AI risk assessments are performed at planned intervals, and again whenever a significant change is proposed or occurs. The" },
      { before: "AI system impact assessments are performed at planned intervals or when significant changes are proposed to occur.",
        after: "AI system impact assessments run on the same trigger: planned intervals, plus any significant change that is proposed." },
    ] },

  { cert: "AIMS-F", kind: "task", key: "4.1", field: "knowledge",
    note: "two runs: the Annex A optionality sentence and the Annex B documentation sentence",
    spans: [
      { before: "not all are required to be used, and the organization can design and implement its own.",
        after: "not every control must be used, and an organization may design and implement its own." },
      { before: "though organizations do not have to document or justify inclusion or exclusion of the implementation guidance in the Statement of Applicability",
        after: "though an organization is not required to document or justify which parts of that guidance it adopted in the Statement of Applicability" },
    ] },

  { cert: "AIMS-F", kind: "task", key: "4.2", field: "knowledge",
    note: "the SoA scope phrasing",
    /* OBLIGATION OVERRIDE, and the reason is lexical rather than normative.
     * "Organizations may not require all controls" uses `require` to mean NEED
     * -- the organization needing a control -- not to impose a duty. The guard
     * counts the word, cannot see the subject, and scores it strong 1 -> 0.
     * The recast keeps the permissive reading exactly (`may need only some`).
     * Recorded here rather than by widening the vocabulary, because narrowing
     * `require` would blind the guard everywhere it IS normative. */
    obligation_override: "the source's `require` means `need` (the organization's need for a control), not a duty imposed by the standard; the recast preserves the permissive sense",
    spans: [{ before: "Organizations may not require all controls listed in Annex A, and may exceed that list with",
              after: "An organization may need only some of the Annex A controls, and may go beyond that list with" }] },

  { cert: "AIMS-F", kind: "task", key: "4.3", field: "knowledge",
    note: "two runs: the AI policy phrase and control A.3.3's concern-reporting route",
    spans: [
      { before: "documenting a policy for the development or use of AI systems, determining",
        after: "documenting a policy covering how AI systems get developed or used, determining" },
      { before: "putting in place a process to report concerns about the organization's role with respect to an AI system, and",
        after: "putting in place a route for raising concerns about whatever role the organization holds around a given AI system, and" },
    ] },

  { cert: "AIMS-F", kind: "task", key: "4.4", field: "knowledge",
    note: "ISO says logging SHOULD be enabled. The first draft wrote `must`, which invents an obligation. The weak modal is held.",
    spans: [{ before: "determine at which phases of the life cycle record keeping of event logs should be enabled, with",
              after: "determine at which life-cycle phases event logs should be kept, with" }] },

  { cert: "AIMS-F", kind: "task", key: "4.6", field: "knowledge",
    note: "A LIST. Reordered; no meaning changes.",
    spans: [{ before: "between the organization, its partners, suppliers, customers and third parties, establish",
              after: "between the organization and its suppliers, partners, customers and other third parties, establish" }] },

  { cert: "AIMS-F", kind: "task", key: "5.1", field: "knowledge",
    note: "two runs: the clause 9.1 evaluation duty and the note to the performance definition",
    spans: [
      { before: "It must evaluate the performance and the effectiveness of the AI management system.",
        after: "It must evaluate how well the AI management system performs and how effective it is." },
      { before: "records that performance refers both to results achieved by using AI systems and results related to the management system itself, and",
        after: "records that performance covers two things at once: what using the AI systems achieves, and how the management system itself is doing, and" },
    ] },

  { cert: "AIMS-F", kind: "task", key: "5.2", field: "knowledge",
    note: "two runs: the audit-programme inputs and the auditor-selection sentence",
    spans: [
      { before: "and considers the importance of the processes concerned and the results of previous audits. The organization defines",
        after: "and weighs how important the processes under audit are, together with what earlier audits found. The organization defines" },
      { before: "selects auditors and conducts audits to ensure objectivity and the impartiality of the audit process, and ensures",
        after: "selects auditors and runs audits in a way that keeps the process objective and impartial, and ensures" },
    ] },

  { cert: "AIMS-F", kind: "task", key: "5.3", field: "knowledge",
    note: "two runs: the review trigger and the management-review outputs",
    spans: [
      { before: "Top management reviews the AIMS at planned intervals to ensure its continuing suitability, adequacy and effectiveness.",
        after: "Top management reviews the AIMS at planned intervals, checking that it still suits the organization, is still adequate and still works." },
      { before: "Results include decisions related to continual improvement opportunities and any need for changes to the AIMS, and",
        after: "Results record what was decided about improvement opportunities and about any changes the AIMS needs, and" },
    ] },

  { cert: "AIMS-F", kind: "task", key: "5.4", field: "knowledge",
    note: "two runs: clause 10.2's recurrence phrase and its documented-information phrase",
    spans: [
      { before: "to eliminate the causes so that it does not recur or occur elsewhere, by reviewing",
        after: "to eliminate the causes, so the same failure does not come back or turn up somewhere else, by reviewing" },
      { before: "documented information must be available as evidence of the nature of the nonconformities, subsequent actions taken and the results of corrective action",
        after: "documented information must be kept showing what the nonconformities were, what was done about them, and what the corrective action achieved" },
    ] },

  { cert: "AIMS-F", kind: "task", key: "5.5", field: "knowledge",
    note: "two runs: the 17021-1 title and the same conformity-evidence phrasing as 1.5",
    spans: [
      /* `requirements` here is part of what ISO/IEC 17021-1 IS -- its title
       * names them -- rather than a duty this sentence imposes. Dropping the
       * word (an earlier draft wrote "the generic standard for bodies") read as
       * a softening to the obligation guard, and the guard was right to ask:
       * the fix is to KEEP the word and recast around it, not to override. */
      { before: "ISO/IEC 17021-1, the generic requirements for bodies providing audit and certification of management systems.",
        after: "ISO/IEC 17021-1, which states the requirements a certification body must meet when it audits and certifies management systems." },
      { before: "conforming with its requirements can generate evidence of its responsibility and accountability regarding its role with respect to AI systems, which is",
        after: "conforming with its requirements can produce evidence that it is responsible and accountable for whatever role it holds around AI systems, which is" },
    ] },
];
