/**
 * lesson-repairs-aimsia-m4c.mjs - AIMS-IA module 4, lessons 04-09 to 04-13.
 *
 * 32 runs, finishing module 4.
 *
 * ============ 04-09 IS A MINIMAL PAIR AND MUST STAY ONE ============
 *
 * The lesson quotes Table A.1's control A.2.2 and Annex B's control B.2.2 on
 * consecutive lines:
 *
 *     A.2.2  The organization SHALL  document a policy for the development
 *            or use of AI systems.
 *     B.2.2  The organization SHOULD document a policy for the development
 *            or use of AI systems.
 *
 * Identical but for one word, and THAT is the lesson -- normative against
 * informative, a finding against no finding. So both lines get the SAME recast,
 * differing only in the modal. Recasting them independently would have produced
 * two sentences that differ in several ways, and the pair would have stopped
 * teaching anything.
 *
 * The same discipline applies to 04-09's two internal-`should` controls and to
 * 04-10's `shall`/`should` contrast, which is the same point applied to a
 * finding an auditor might draft.
 *
 * ============ NEGATIONS ARE WHERE A RECAST GOES WRONG QUIETLY ============
 *
 * Annex A.1 says "NOT ALL control objectives and controls listed in Table A.1
 * ARE REQUIRED to be used", and B.1 says organizations "DO NOT HAVE TO document
 * or justify" implementation guidance. Both are permissions written as
 * negations, and a recast that tidies the negation away inverts the meaning
 * while reading perfectly well. Each is rewritten as a negation:
 * "not every control ... has to be used", "no organization has to document or
 * justify". The guard counts modals and cannot see a flipped polarity.
 */

export const REPAIRS = [
  {
    cert: "AIMS-IA", slug: "aims-ia-04-09-normative-and-should", address: "42001 Annex A.1, Table A.1, Annex B.1, clause 6.1.3 e), 3.26",
    note: "SIXTEEN runs. A.2.2 and B.2.2 are a minimal pair and are recast identically but for the modal.",
    en: {
      before: "| D | Use of the AI management system across domains or sectors | informative | `should`, `can` |",
      after: "| D | Using the AI management system across domains or sectors | informative | `should`, `can` |",
    },
    also: [
      { before: "**Table A.1, control A.2.2:** *The organization shall document a policy for the development or use of AI systems.*",
        after: "**Table A.1, control A.2.2:** *The organization shall document a policy covering how AI systems are developed or used.*" },
      { before: "**Annex B, control B.2.2:** *The organization should document a policy for the development or use of AI systems.*",
        after: "**Annex B, control B.2.2:** *The organization should document a policy covering how AI systems are developed or used.*" },
      { before: "to **consider the guidance in Annex B for the implementation of controls determined in b) and c)**",
        after: "to **consider the guidance in Annex B when implementing the controls settled at b) and c)**" },
      { before: "- relates to the controls listed in Table A.1 and supports their implementation and the meeting of the control objective;",
        after: "- bears on the controls listed in Table A.1, supporting how they are implemented and the control objective met;" },
      { before: "- **but organizations do not have to document or justify inclusion or exclusion of implementation guidance in the statement of applicability** (see 6.1.3);",
        after: "- **but no organization has to document or justify including or excluding implementation guidance in its statement of applicability** (see 6.1.3);" },
      { before: "- **is not always suitable or sufficient in all situations** and does not always fulfil an organization's specific control requirements;",
        after: "- **is not always suitable or sufficient in every situation** and does not always meet an organization's specific control requirements;" },
      { before: "- **can be regarded as a starting point** for developing organization-specific implementation.",
        after: "- **can be treated as a starting point** for developing an organization's own implementation." },
      { before: "B.1 states expressly that organizations do not have to document or justify inclusion or exclusion of implementation guidance in the statement of applicability.",
        after: "B.1 states expressly that no organization has to document or justify including or excluding implementation guidance in its statement of applicability." },
      { before: "Annex A.1 records that not all control objectives and controls listed in Table A.1 are required to be used.",
        after: "Annex A.1 records that not every control objective and control in Table A.1 has to be used." },
      { before: "established to address them shall be reflected in the statement of applicability",
        after: "established to address them shall appear in the statement of applicability" },
      { before: "at a minimum this **should** include system and performance monitoring, repairs, updates and support.",
        after: "at a minimum this **should** cover monitoring of the system and its performance, repairs, updates and support." },
      { before: "event log record keeping **should** be enabled, but at the minimum when the AI system is in use",
        after: "event log record keeping **should** be enabled, and in any case while the AI system is in use" },
      { before: "clause B.1 states that organizations do not have to document or justify inclusion or exclusion of implementation guidance in the statement of applicability",
        after: "clause B.1 states that no organization has to document or justify including or excluding implementation guidance in its statement of applicability" },
      { before: "the organization should document a policy for the development or use of AI systems and has not done so",
        after: "the organization should document a policy covering how AI systems are developed or used and has not done so" },
      { before: "the treatment process shall consider the guidance in Annex B for the implementation of controls determined in b) and c), and no consideration occurred",
        after: "the treatment process shall consider the guidance in Annex B when implementing the controls settled at b) and c), and no consideration occurred" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-04-10-justifying-both-directions", address: "42001 clause 6.1.3 f), Annex A.1, 19011 clause 6.5.1",
    note: "5 runs; the 60w blockquote of Annex A.1 is the second-longest in the certification",
    en: {
      before: "to produce a statement of applicability that **contains the necessary controls** and **provides justification for inclusions and exclusions**",
      after: "to produce a statement of applicability **holding the necessary controls** and **justifying both inclusions and exclusions**",
    },
    also: [
      { before: "because Annex A.1 states that not all controls listed in Table A.1 are required to be used",
        after: "because Annex A.1 states that not every control in Table A.1 has to be used" },
      { before: "> The controls detailed in Table A.1 provide the organization with a reference for meeting organizational objectives and addressing risks related to the design and operation of AI systems. **Not all the control objectives and controls listed in Table A.1 are required to be used, and the organization can design and implement their own controls (see 6.1.3).**",
        after: "> The controls set out in Table A.1 give the organization a reference for meeting its objectives and handling risks that arise from designing and operating AI systems. **Not every control objective and control in Table A.1 has to be used, and an organization can design and implement controls of its own (see 6.1.3).**" },
      { before: "- **Right:** *Where A.2.2 is selected, the organization shall document a policy for the development or use of AI systems.*",
        after: "- **Right:** *Where A.2.2 is selected, the organization shall document a policy covering how AI systems are developed or used.*" },
      { before: "a statement on the degree to which the audit criteria have been fulfilled",
        after: "a statement of how far the audit criteria have been fulfilled" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-04-11-a-determination-not-an-answer", address: "42001 clauses 4.1, 4.2 and its NOTE",
    note: "4 runs; the NOTE's `can` is the lesson's subject and is preserved",
    en: {
      before: "> The organization **shall determine whether climate change is a relevant issue.**",
      after: "> The organization **shall determine whether climate change is, for it, a relevant issue.**",
    },
    also: [
      { before: "a **NOTE** - relevant interested parties can have requirements related to climate change",
        after: "a **NOTE** - interested parties may have requirements that relate to climate change" },
      { before: "the organization shall determine which of the identified interested party requirements will be addressed through the AI management system, and",
        after: "the organization shall determine which of the identified interested party requirements the AI management system will address, and" },
      { before: "- Clause 4.2 carries a NOTE that relevant interested parties can have requirements related to climate change",
        after: "- Clause 4.2 carries a NOTE that interested parties may have requirements that relate to climate change" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-04-12-declared-and-operated", address: "42001 control A.6.2.8",
    note: "1 run; `should` is left standing because A.6.2.8's internal `should` is the point",
    en: {
      before: "which addresses at which phases log record keeping should be enabled and states at the minimum when the AI system is in use.",
      after: "which addresses at which phases log record keeping should be enabled and says that in any case this covers the time the AI system is in use.",
    },
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-04-13-competence-the-organization-claims", address: "42001 clause 7.2",
    note: "the 43w span crosses all four of clause 7.2's requirements; all four recast",
    en: {
      before: "- **determine the necessary competence** of persons doing work under its control that affects its AI performance;",
      after: "- **determine the necessary competence** of anyone working under its control whose work affects AI performance;",
    },
    also: [
      { before: "- **ensure that these persons are competent** on the basis of appropriate education, training or experience;",
        after: "- **ensure those people are competent**, on the strength of suitable education, training or experience;" },
      { before: "- where applicable, **take actions to acquire the necessary competence, and evaluate the effectiveness** of the actions taken;",
        after: "- where applicable, **act to acquire the competence needed, and evaluate how well those actions worked**;" },
      { before: "- and **appropriate documented information shall be available as evidence of competence**.",
        after: "- and **appropriate documented information shall be kept as evidence of competence**." },
      { before: "A further note points to implementation guidance for human resources including consideration of necessary expertise at B.4.6.",
        after: "A further note points to implementation guidance on human resources at B.4.6, which covers the expertise needed." },
      /* A ::concept TITLE, which is display text rather than a key. It quotes
       * clause 7.2 a) on purpose -- the term being explained IS ISO's phrase --
       * and the rule does not move for that. */
      { before: "::concept title=\"Persons doing work under its control that affects its AI performance\"",
        after: "::concept title=\"Persons whose work under the organization's control affects AI performance\"" },
      { before: "states that as part of resource identification the organization shall document information about the human resources and their competences used for the development, deployment, operation, change management, maintenance and transfer of AI systems.",
        after: "states that as part of identifying resources the organization shall document which human resources and competences are used for developing, deploying, operating, change-managing, maintaining and transferring AI systems." },
      { before: "appropriate documented information shall be available as evidence of competence, and job titles",
        after: "appropriate documented information shall be kept as evidence of competence, and job titles" },
    ],
  },
];
