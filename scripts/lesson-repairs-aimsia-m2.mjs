/**
 * lesson-repairs-aimsia-m2.mjs - AIMS-IA module 2, seven lessons.
 *
 * 34 runs. Clause 9.2.2's "consider the importance of the processes concerned
 * and the results of previous audits" appears FIVE TIMES in this module alone
 * -- twice in prose, twice in checkpoints, once in a bolded requirement -- and
 * uses the recast already checked on AIMS-F 5.2 and ISMS-F. A module about
 * managing an audit programme restates the programme clause constantly.
 *
 * SEVERAL RUNS SHARE A LINE. 02-06 carries two in its method sentence and two
 * more in the virtual-location paragraph; where they sit in one sentence they
 * are ONE span, and where they sit in separate sentences of the same line they
 * are two, because the spans apply cumulatively to the document.
 *
 * AND TWO SPAN A LINE BREAK between list items -- 02-04's role requirements and
 * 02-06's revision list. Written as separate single-line spans: a multi-line
 * `before` matches nothing in a per-line applier and cannot be aligned
 * positionally for the translation pass either.
 */

export const REPAIRS = [
  {
    cert: "AIMS-IA", slug: "aims-ia-02-01-a-programme-is-designed-not-scheduled", address: "19011 clauses 3.5, 5.1, 5.2",
    note: "6 runs; every `should` is guidance and stays one",
    en: {
      before: "planned for a specific time frame and directed towards a specific purpose",
      after: "planned for a set period and aimed at a particular purpose",
    },
    also: [
      { before: "the extent of a programme should be based on the size and nature of the auditee",
        after: "the extent of a programme should follow from how large the auditee is and what kind of body it is" },
      { before: "should ensure that programme objectives are established to direct the planning and conducting of audits",
        after: "should ensure that programme objectives are set so they steer how audits are planned and run" },
      { before: "Objectives should be consistent with the audit client's **strategic direction**",
        after: "Objectives should line up with the audit client's **strategic direction**" },
      { before: "- characteristics of and requirements for processes, products, services and projects, and changes to them;",
        after: "- the characteristics and requirements of processes, products, services and projects, and how those change;" },
      { before: "the extent of an audit programme should be based on the size and nature of the auditee",
        after: "the extent of an audit programme should follow from the auditee's size and character" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-02-02-where-the-effort-goes", address: "19011 clauses 4.8, 5.3; 42001 9.2.2",
    note: "4 runs; clause 4.8's `should` and 9.2.2's `shall` sit in the same lesson and must stay distinct",
    en: {
      before: "risks and opportunities related to the context of the auditee that can affect",
      after: "risks and opportunities arising from the auditee's context that can affect",
    },
    also: [
      { before: "to identify these and present them to the audit client when developing the programme",
        after: "to identify these and put them to the audit client while developing the programme" },
      { before: "**should substantively influence** the planning and implementation of the audit programme, and the planning, conducting and reporting of audits",
        after: "**should substantively influence** how the audit programme is planned and run, and how individual audits are planned, conducted and reported" },
      { before: "**consider the importance of the processes concerned and the results of previous audits**",
        after: "**weigh how important the audited processes are and what earlier audits found**" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-02-03-competence-the-team-needs", address: "19011 clauses 3.15, 3.17",
    note: "1 run",
    en: {
      before: "as a person who provides specific knowledge or expertise to the audit team.",
      after: "as a person who brings particular knowledge or expertise to the team.",
    },
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-02-04-what-roles-the-organization-holds", address: "42001 clauses 4.1, 4.3, 6.3, 9.2.2",
    note: "5 runs; the first crossed a line break and is split in two",
    en: {
      before: "- The organization **shall consider the intended purpose** of the AI systems that are developed, provided or used by the organization.",
      after: "- The organization **shall consider the intended purpose** of whatever AI systems it develops, provides or uses.",
    },
    also: [
      { before: "- The organization **shall determine its roles** with respect to these AI systems.",
        after: "- The organization **shall determine its roles** in relation to those systems." },
      { before: "to determine the boundaries and applicability of the AI management system to establish its scope",
        after: "to settle where the AI management system starts and stops, and so its scope" },
      { before: "when the organization determines the need for changes to the AI management system, the changes be carried out in a planned manner",
        after: "where the organization finds the AI management system needs changing, those changes are made in a planned way" },
      { before: "**Clause 9.2.2 requires the organization to consider the importance of the processes concerned and the results of previous audits when establishing the programme.**",
        after: "**Clause 9.2.2 requires the organization, when establishing the programme, to weigh how important the audited processes are and what earlier audits found.**" },
      { before: "requires the organization to consider the importance of the processes concerned and the results of previous audits when establishing the programme, and a new provider role",
        after: "requires the organization, when establishing the programme, to weigh how important the audited processes are and what earlier audits found, and a new provider role" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-02-05-defining-one-audit", address: "19011 clauses 3.6, 5.5.2; 42001 9.2.2 a",
    note: "5 runs; 19011's `should` and 42001's `shall` are the lesson's subject and both are held",
    en: {
      before: "each individual audit should be based on defined audit objectives, scope and criteria",
      after: "each audit should rest on objectives, scope and criteria that have been defined",
    },
    also: [
      { before: "**shall define the audit objectives, criteria and scope for each audit**",
        after: "**shall set the objectives, criteria and scope of each individual audit**" },
      { before: "- evaluating the **effectiveness** of the management system in meeting its intended results;",
        after: "- evaluating the **effectiveness** with which the management system reaches what it set out to do;" },
      { before: "a note that it generally includes a description of the **physical and virtual locations**",
        after: "a note that it usually describes the **physical and virtual locations**" },
      { before: "which requires the organization to define the audit objectives, criteria and scope for each audit",
        after: "which requires the organization to set the objectives, criteria and scope of each individual audit" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-02-06-choosing-the-method", address: "19011 clause 5.5.3, Annex A.16, virtual locations",
    note: "NINE runs. Two pairs share a line and are single spans; one pair crosses a line break and is split.",
    en: {
      before: "should select and determine the methods for conducting an audit effectively and efficiently, **depending on the defined audit objectives, scope and criteria**.",
      after: "should choose and settle the methods for running an audit effectively and efficiently, **according to the audit objectives, scope and criteria already defined**.",
    },
    also: [
      { before: "audits can be performed **on-site, remotely, or as a combination**, and that the use of these methods should be **suitably balanced, based on consideration of associated risks and opportunities**",
        after: "audits may be run **on site, remotely, or as a mix of both**, and that the mix chosen should be **suitably balanced, resting on the risks and opportunities each carries**" },
      { before: "- expansion of guidance on **remote auditing methods**, through the introduction of guidance contained in ISO/IEC TS 17012;",
        after: "- wider guidance on **remote auditing methods**, drawing in what ISO/IEC TS 17012 sets out;" },
      { before: "- expansion of **Annex A** to provide guidance on remote auditing methods and virtual locations.",
        after: "- a wider **Annex A**, now covering remote auditing methods and virtual locations." },
      { before: "**remote methods can be necessary for the audit of virtual locations**",
        after: "**remote methods may be needed when auditing a virtual location**" },
      { before: "as one where an organization performs work or provides a service using an online environment, enabling individuals to execute processes irrespective of physical location",
        after: "as one where an organization does work or delivers a service through an online environment, letting people carry out processes wherever they physically are" },
      { before: "can be used by an auditor at one site of the auditee to audit another site",
        after: "can be used by an auditor at one of the auditee's sites to audit a different one" },
      { before: "where an auditee operates two or more management systems of different disciplines, combined audits can be included in the programme",
        after: "where an auditee runs two or more management systems in different disciplines, combined audits may go into the programme" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-02-07-the-programme-audits-itself", address: "19011 clauses 4.5, 5.7; 42001 9.2.2",
    note: "4 runs, two of them the clause 9.2.2 phrase again",
    en: {
      before: "the organization **shall consider the importance of the processes concerned and the results of previous audits**",
      after: "the organization **shall weigh how important the audited processes are and what earlier audits found**",
    },
    also: [
      { before: "**documented information shall be available as evidence of the implementation of the audit programme and the audit results.**",
        after: "**documented information shall be kept showing both that the audit programme was implemented and what the audits found.**" },
      { before: "clause 9.2.2 requires the organization to consider the importance of the processes concerned and the results of previous audits when establishing the programme.",
        after: "clause 9.2.2 requires the organization, when establishing the programme, to weigh how important the audited processes are and what earlier audits found." },
      { before: "asks auditors to exercise discretion in the use and protection of information acquired during auditing",
        after: "asks auditors to use discretion in handling and protecting information obtained during auditing" },
    ],
  },
];
