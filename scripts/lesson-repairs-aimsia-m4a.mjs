/**
 * lesson-repairs-aimsia-m4a.mjs - AIMS-IA module 4, lessons 04-01 to 04-04.
 *
 * Module 4 is 93 runs across 13 lessons, the largest in the platform, and it is
 * split into three batch files rather than one. A batch that cannot be finished
 * leaves a lesson half-repaired; three that can be finished leave a boundary
 * after each. 04a is 29 runs.
 *
 * ============ THESE ARE REQUIREMENT ENUMERATIONS, NOT PROSE ============
 *
 * Clauses 4.1, 5.1, 5.2 and 6.1.2 are bulleted lists of `shall`s, quoted here
 * nearly item for item, so most runs CROSS LINE BREAKS between bullets. A run
 * that spans three bullets cannot be broken by recasting one of them: the tail
 * of the first and the head of the third still adjoin. So where a run crosses,
 * EVERY line it touches is recast, and each is written as its own single-line
 * span because the applier splices per line.
 *
 * 04-03's clause 5.1 list is the worst case -- six consecutive bullets, five
 * runs, every one crossing. 04-03 d) had to be recast for a reason that is not
 * visible from its own text: the run began in the PREVIOUS bullet's "are
 * available;", so changing only the bullet the run appears to be about left
 * eleven words adjoining.
 *
 * ============ EVERY `shall` STAYS A `shall`, AND ONE `can` STAYS A `can` =====
 *
 * 04-04's NOTE under 6.1.2 d) is the exception that proves it: the organization
 * "can utilize an AI system impact assessment", and the lesson's next sentence
 * is *"That is a `can` - permission, not a requirement"*. The recast moves the
 * words around `can` and leaves the modal untouched, because the modal IS the
 * lesson.
 */

export const REPAIRS = [
  {
    cert: "AIMS-IA", slug: "aims-ia-04-01-a-determination-or-an-assertion", address: "42001 clause 4.1",
    note: "2 runs, the second 47w across four consecutive bullets; all four recast",
    en: {
      before: "- The organization **shall determine external and internal issues** relevant to its purpose that affect its ability to achieve the intended results of its AI management system.",
      after: "- The organization **shall determine external and internal issues** bearing on its purpose which affect whether it can reach what its AI management system is meant to achieve.",
    },
    also: [
      { before: "- The organization **shall determine whether climate change is a relevant issue.**",
        after: "- It **shall determine whether climate change is a relevant issue** as well." },
      { before: "- The organization **shall consider the intended purpose** of the AI systems that are developed, provided or used by the organization.",
        after: "- The organization **shall consider the intended purpose** of whatever AI systems it develops, provides or uses." },
      { before: "- The organization **shall determine its roles** with respect to these AI systems.",
        after: "- The organization **shall determine its roles** in relation to those systems." },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-04-02-boundaries-and-applicability", address: "42001 clauses 4.2, 4.3",
    note: "4 runs; the opening sentence carries two and is one span",
    en: {
      before: "requires the organization to determine the **boundaries and applicability** of the AI management system to establish its scope. When determining the scope it shall consider the external and internal issues from 4.1 and the requirements of interested parties from 4.2. The scope shall be available as documented information.",
      after: "requires the organization to settle the **boundaries and applicability** of its AI management system, and so its scope. In settling that scope it shall take account of the external and internal issues from 4.1 and the interested-party requirements from 4.2. The scope shall be held as documented information.",
    },
    also: [
      { before: "requires the scope to be determined **considering the issues referred to in 4.1** and the requirements referred to in 4.2",
        after: "requires the scope to be settled **with the 4.1 issues in view** and with the 4.2 requirements" },
      { before: "the organization shall determine which of those requirements will be addressed through the AI management system, and",
        after: "the organization shall determine which of those requirements the AI management system will address, and" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-04-03-leadership-in-artifacts", address: "42001 clauses 5.1, 5.2, 5.3, controls A.2.2 to A.2.4",
    note: "THIRTEEN runs. Clause 5.1's six bullets and 5.2's policy list are recast item by item.",
    en: {
      before: "requires top management to demonstrate leadership and commitment with respect to the AI management system by:",
      after: "requires top management to show leadership and commitment for the AI management system by:",
    },
    also: [
      { before: "- ensuring the **AI policy and AI objectives are established** and compatible with the strategic direction of the organization;",
        after: "- ensuring the **AI policy and AI objectives are established** and sit well with where the organization is strategically headed;" },
      { before: "- ensuring the **resources needed** for the AIMS are available;",
        after: "- ensuring the **resources needed** for the AIMS are in place;" },
      { before: "- **communicating the importance** of effective AI management and of conforming to AIMS requirements;",
        after: "- **communicating the importance** of effective AI management and of meeting what the AIMS requires;" },
      { before: "- **directing and supporting persons** to contribute to the effectiveness of the AIMS;",
        after: "- **directing and supporting persons** so they contribute to how well the AIMS works;" },
      { before: "- **supporting other relevant management roles** to demonstrate their leadership as it applies to their areas of responsibility.",
        after: "- **supporting other relevant management roles** in showing leadership within the areas they are responsible for." },
      { before: "- a) is **appropriate to the purpose** of the organization;",
        after: "- a) **suits the organization's purpose**;" },
      { before: "- c) includes a **commitment to meet applicable requirements**;",
        after: "- c) carries a **commitment to meet applicable requirements**;" },
      { before: "- d) includes a **commitment to continual improvement** of the AIMS.",
        after: "- d) carries a **commitment to continually improve** the AIMS." },
      { before: "- be available as **documented information**;",
        after: "- be held as **documented information**;" },
      { before: "- **refer as relevant to other organizational policies**;",
        after: "- **point to other organizational policies where relevant**;" },
      { before: "- be **available to interested parties, as appropriate**.",
        after: "- be **open to interested parties where appropriate**." },
      { before: "control objectives and controls for establishing an AI policy are provided in A.2 in Table A.1, with implementation guidance in B.2",
        after: "the control objectives and controls for an AI policy sit at A.2 of Table A.1, with implementation guidance at B.2" },
      { before: "**A.2.2, AI policy** - the organization shall document a policy for the development or use of AI systems.",
        after: "**A.2.2, the AI policy control** - the organization shall document a policy covering how AI systems are developed or used." },
      { before: "the organization shall determine where other policies can be affected by, or apply to, the organization's objectives with respect to AI systems",
        after: "the organization shall work out which other policies can affect, or be affected by, its AI-related objectives" },
      { before: "**A.2.4, review of the AI policy** - the AI policy shall be reviewed at planned intervals or additionally as needed to ensure its continuing suitability, adequacy and effectiveness",
        after: "**A.2.4, reviewing the AI policy** - it shall be reviewed at planned intervals, and at other times as needed, so that it stays suitable, adequate and effective" },
      { before: "requires top management to ensure that responsibilities and authorities for relevant roles are assigned and communicated within the organization",
        after: "requires top management to see that responsibilities and authorities for the relevant roles are assigned and made known across the organization" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-04-04-criteria-before-assessment", address: "42001 clauses 6.1.2, 6.1.4, 8.2",
    note: "10 runs; 6.1.2's five lettered items are recast individually. The NOTE's `can` is preserved deliberately.",
    en: {
      before: "requires the organization to **define and establish an AI risk assessment process** that:",
      after: "requires the organization to **set up and define a process for assessing AI risk** that:",
    },
    also: [
      { before: "- a) is **informed by and aligned with the AI policy** (5.2) and **AI objectives** (6.2);",
        after: "- a) is **shaped by and consistent with the AI policy** (5.2) and the **AI objectives** (6.2);" },
      { before: "- b) is designed such that **repeated AI risk assessments can produce consistent, valid and comparable results**;",
        after: "- b) is designed so that **assessments repeated over time can give consistent, valid and comparable results**;" },
      { before: "- c) **identifies risks** that aid or prevent achieving its AI objectives;",
        after: "- c) **identifies risks** that help or hinder the AI objectives;" },
      { before: "- d) **analyses** the AI risks, to assess the potential consequences to the organization, individuals and societies that would result if the identified risks materialized; to assess where applicable the realistic likelihood; and to determine the levels of risk;",
        after: "- d) **analyses** the AI risks - what would follow for the organization, for individuals and for societies if an identified risk came about; how likely that realistically is, where that applies; and what the resulting risk levels are;" },
      { before: "the organization **can utilize an AI system impact assessment as indicated in 6.1.4**",
        after: "the organization **can draw on an AI system impact assessment, as 6.1.4 indicates**" },
      { before: "Clause 6.1.2 c) makes this explicit - the process identifies risks that aid or prevent achieving its AI objectives.",
        after: "Clause 6.1.2 c) makes this explicit - the process identifies risks that help or hinder the AI objectives." },
      { before: "requires the process to be designed such that **repeated AI risk assessments can produce consistent, valid and comparable results**",
        after: "requires the process to be designed so that **assessments repeated over time can give consistent, valid and comparable results**" },
      { before: "the organization shall perform AI risk assessments at planned intervals or when significant changes are proposed or occur",
        after: "the organization shall perform AI risk assessments at planned intervals, and whenever significant change is proposed or happens" },
      { before: "asks the analysis to assess the potential consequences **to the organization, individuals and societies** that would result if the identified risks materialized",
        after: "asks the analysis to weigh what would follow **for the organization, for individuals and for societies** should an identified risk come about" },
      { before: "clause 6.1.4 requires the impact assessment to determine consequences for individuals or groups of individuals, or both, and societies.",
        after: "clause 6.1.4 requires the impact assessment to determine what follows for individuals, for groups of them, or for both, and for societies." },
    ],
  },
];
