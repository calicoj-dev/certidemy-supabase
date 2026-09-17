/**
 * lesson-repairs-aimsf-m3.mjs - AIMS-F module 3, the seven withheld lessons.
 *
 * 37 runs, the largest batch. Clause 7 is support -- resources, competence,
 * awareness, communication, documented information -- and clause 8 is
 * operation, so this module restates more of the standard's machinery than any
 * other. Nine of the 37 reuse wording already checked in an earlier batch or in
 * the blueprint pass; seven more are LIST REORDERS.
 *
 * Module 4 is NOT in this file and stops here deliberately: four complete
 * modules with a visible stop is the shape a partner reads as work in progress,
 * and the bilingual queue settles at about 96 rows rather than 108.
 */

export const REPAIRS = [
  {
    cert: "AIMS-F", slug: "03-01-resources-and-competence", address: "42001 clauses 7.1, 7.2, A.4",
    note: "6 runs; the 30-word expertise list is the longest and is an ordering",
    en: {
      before: "resources can be provided by the organization itself, by its customers, or by third parties",
      after: "resources may come from the organization itself, from its customers, or from third parties",
    },
    also: [
      { before: "are competent on the basis of appropriate education, training or experience",
        after: "are competent, grounded in suitable education, training or experience" },
      { before: "the organization should consider the need for **diverse expertise** and include the types of roles",
        after: "the organization should weigh its need for **diverse expertise** and name the kinds of role" },
      // LIST, 30 words of ISO ordering and nothing else.
      { before: "Data scientists. Roles related to human oversight of AI systems. Experts on trustworthiness topics such as safety, security and privacy. AI researchers and specialists, and domain experts relevant to the systems in question.",
        after: "Domain experts for the systems in question. Data scientists. AI researchers and specialists. Experts on trustworthiness topics such as security, privacy and safety. Roles carrying human oversight of AI systems." },
      { before: "that different resources can be necessary at different stages of the",
        after: "that different resources may be needed at different points in the" },
      { before: "and understand the instructions and other documentation associated with the",
        after: "and understand whatever instructions and documentation accompany the" },
    ],
  },
  {
    cert: "AIMS-F", slug: "03-02-awareness-and-communication", address: "42001 clauses 7.3, 7.4, A.3.3",
    note: "6 runs; the clause 7.4 four-way list is an ordering",
    en: {
      /* `Persons` -> `Anyone` was not enough: the run is "doing work under the
       * organization's control shall be aware of", and swapping the first word
       * leaves ten of its words intact. The verb and the modal had to move too.
       * Third time this shape has bitten -- changing what introduces a run
       * never removes the run. */
      before: "Persons doing work under the organization's control shall be aware of:",
      after: "Anyone working under the organization's control must be aware of:",
    },
    also: [
      { before: "**Their contribution to the effectiveness of the AI management system**, including the benefits of improved AI performance",
        after: "**What they contribute to making the AI management system effective**, including what better AI performance buys" },
      { before: "determine the internal and external communications relevant to the AI management system, and",
        after: "work out which internal and external communications bear on the AI management system, and" },
      // LIST.
      { before: "**What** it will communicate. **When** to communicate. **With whom** to communicate. **How** to communicate.",
        after: "**What** it will communicate. **With whom**. **When**. And **how**." },
      { before: "their contribution to the effectiveness of the management system, including",
        after: "what they contribute to making the management system effective, including" },
      { before: "a process for people to report concerns about the organization's role with respect to an AI system throughout its life cycle",
        after: "a route for people to raise concerns about whatever role the organization holds around an AI system, at any point in its life" },
    ],
  },
  {
    cert: "AIMS-F", slug: "03-03-documented-information", address: "42001 clause 7.5.3",
    note: "4 runs",
    en: {
      before: "is available and suitable for use where and when it is needed, and",
      after: "is on hand and fit to use wherever and whenever it is needed, and",
    },
    also: [
      { before: "from loss of confidentiality, improper use, or loss of integrity",
        after: "against lost confidentiality, misuse, or lost integrity" },
      { before: "as applicable: distribution, access, retrieval and use; storage and preservation, including",
        after: "so far as each applies: access, retrieval, distribution and use; storage and preservation, including" },
      { before: "Documented information of external origin, determined by the organization to be necessary for the planning and operation of the AI management system",
        after: "Documented information that came from outside, where the organization has decided it is needed to plan and run the AI management system" },
    ],
  },
  {
    cert: "AIMS-F", slug: "03-04-operational-planning-and-control", address: "42001 clause 8.1",
    note: "5 runs; two carry `shall` and both hold it",
    en: {
      before: "plan, implement and control the processes needed to meet requirements and to implement the actions determined in clause 6",
      after: "plan, put in place and control whatever processes are needed to meet requirements and to carry out the actions clause 6 determined",
    },
    also: [
      { before: "**the effectiveness of these controls shall be monitored, and corrective actions shall be considered if the intended results are not achieved.**",
        after: "**how well these controls work shall be monitored, and corrective action shall be considered where the intended results do not follow.**" },
      { before: "be available to the extent necessary to have confidence that the processes",
        after: "be kept to whatever extent gives confidence that the processes" },
      { before: "operations, new or modified intended uses, or other changes in",
        after: "operations, intended uses that are new or altered, or other shifts in" },
      { before: "the organization shall ensure that externally provided processes, products or services that are relevant to the AI management system are controlled",
        after: "the organization shall make sure that any externally provided process, product or service bearing on the AI management system is controlled" },
    ],
  },
  {
    cert: "AIMS-F", slug: "03-05-third-party-ai-supply", address: "42001 A.10 supplier and allocation controls",
    note: "7 runs; three reuse earlier recasts",
    en: {
      before: "for use on its own or as part of another product",
      after: "whether used standalone or embedded in another product",
    },
    also: [
      { before: "what they supply, and **the varying level of risk this can pose to the system and",
        after: "what each supplies, and **how much risk that can carry for the system and" },
      { before: "of services, products or materials provided by suppliers aligns with",
        after: "of supplier-provided services, products or materials lines up with" },
      { before: "the organization can decide to work with the supplier to achieve this",
        after: "the organization may choose to work with the supplier to get there" },
      /* Same lesson again. The reorder fixed the TAIL of the list and left
       * "the AI system life cycle are allocated between the organization"
       * standing -- ten words before the reorder even begins. The span had to
       * start at `Responsibilities`. */
      { before: "Responsibilities within the AI system life cycle are allocated between the organization, its partners, suppliers, customers and third parties",
        after: "Responsibilities across the life of an AI system are allocated between the organization and its suppliers, partners, customers and other third parties" },
      { before: "life cycle, responsibilities can be split between parties providing data, parties providing algorithms and models",
        after: "life cycle, responsibilities may be split between whoever supplies the data, whoever supplies algorithms and models" },
      { before: "Where the organization supplies an AI system to a third party, the",
        after: "Where the organization is itself the supplier of an AI system, the" },
    ],
  },
  {
    cert: "AIMS-F", slug: "03-06-data-for-ai-systems", address: "42001 A.7 data controls",
    note: "6 runs; two are inside the acquisition enumeration",
    en: {
      before: "the organization understands the role and impacts of data in AI systems",
      after: "the organization grasps what data does, and does to people, across its AI systems",
    },
    also: [
      { before: "determine and document details about the acquisition and selection of the data used in its AI systems",
        after: "settle and record how the data used in its AI systems was acquired and chosen" },
      { before: "static, streamed, gathered, machine generated. Data subject demographics and characteristics",
        after: "static, streamed, gathered or machine generated. The demographics and characteristics of data subjects" },
      { before: "known or potential biases or other systematic errors**. Prior handling",
        after: "biases known or suspected, and other systematic errors**. Prior handling" },
      { before: "that the quality of training, validation, test and production data",
        after: "that the quality of the training, validation, test and production sets" },
      { before: "that the organization should consider **the impact of bias on system performance and",
        after: "that the organization should weigh **what bias does to system performance and" },
    ],
  },
  {
    cert: "AIMS-F", slug: "03-07-what-carries-over-from-an-isms", address: "42001 Annex D.2",
    note: "3 runs, all three already recast elsewhere",
    en: {
      before: "integration of the AI management system with generic or sector-specific management system standards",
      after: "bringing the AI management system together with generic or sector-specific standards",
    },
    also: [
      { before: "**essential** for responsible development and use of an AI system, and",
        after: "**essential** to developing and using an AI system responsibly, and" },
      { before: "be aware of unique requirements related to AI systems or individual components",
        after: "stay alert to requirements unique to AI systems or to individual components" },
    ],
  },
];
