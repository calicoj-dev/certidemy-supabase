/**
 * lesson-repairs-aimsia-m4b.mjs - AIMS-IA module 4, lessons 04-05 to 04-08.
 *
 * 32 runs, including the longest on the platform: 04-06's 64-word span across
 * clause 6.1.4's first three requirements.
 *
 * ============ FOUR CLAUSES QUOTED AS LISTS ============
 *
 * 6.1.3's six lettered items, 6.1.4's five requirements, 7.5.1's two and 8.1's
 * two. Every one of these runs crosses a bullet boundary, so every line is
 * recast rather than only the line the run seems to belong to.
 *
 * ============ TWO PLACES WHERE THE QUOTED WORDS ARE THE LESSON ============
 *
 * 04-06's `can`: "the result **can** be made available to relevant interested
 * parties", followed immediately by *"a `can`, and the only permissive element
 * in the clause"*. The modal is the teaching point and is untouched; only the
 * words around it move.
 *
 * 04-08 quotes clause 8.2 AND clause 8.4 side by side precisely to show that
 * their triggers differ -- "at planned intervals or when significant changes
 * are proposed or occur" against "at planned times and when significant changes
 * occur". Recasting both would destroy the comparison. Only 8.2 crosses the
 * threshold, so only 8.2 is recast, and 8.4's shorter phrasing stands as
 * written. The contrast survives because it was never about the wording being
 * identical to ISO's -- it was about the two clauses differing from each other.
 *
 * 04-08's clause 8.1 run sits inside a BLOCKQUOTE. AIMS-IA carries only four
 * blockquoted runs against ISMS-IA's 48, which is why this certification needed
 * no ruling: four is a repair, 48 is a mechanism.
 */

export const REPAIRS = [
  {
    cert: "AIMS-IA", slug: "aims-ia-04-05-controls-first-annex-a-second", address: "42001 clauses 6.1.3, 6.1.4, 8.1, 3.26",
    note: "THIRTEEN runs; clause 6.1.3's six lettered items recast individually",
    en: {
      before: "requires the organization to define an AI risk treatment process to:",
      after: "requires the organization to set out a process for treating AI risk that will:",
    },
    also: [
      { before: "- a) **select appropriate AI risk treatment options**, taking account of the risk assessment results;",
        after: "- a) **select appropriate AI risk treatment options**, in light of what the risk assessment found;" },
      { before: "- b) **determine all controls that are necessary** to implement the AI risk treatment options chosen, **and compare the controls with those in Annex A** to verify that no necessary controls have been omitted;",
        after: "- b) **determine all controls that are necessary** to put the chosen treatment options into effect, **and compare those controls against Annex A** to check that none needed has been left out;" },
      { before: "- c) **consider the controls from Annex A** that are relevant for the implementation of the AI risk treatment options;",
        after: "- c) **consider the controls from Annex A** bearing on how the treatment options will be implemented;" },
      { before: "- d) **identify if additional controls are necessary** beyond those in Annex A in order to implement all risk treatment options;",
        after: "- d) **identify if additional controls are necessary** past Annex A's, so that every treatment option can be implemented;" },
      { before: "- e) **consider the guidance in Annex B** for the implementation of controls determined in b) and c);",
        after: "- e) **consider the guidance in Annex B** when implementing the controls settled at b) and c);" },
      { before: "- f) **produce a statement of applicability** that contains the necessary controls and provides justification for inclusions and exclusions.",
        after: "- f) **produce a statement of applicability** listing the necessary controls, with a justification for what is in and what is out." },
      { before: "Annex A provides reference controls for meeting organizational objectives and addressing risks related to the design and use of AI systems",
        after: "Annex A offers reference controls for meeting organizational objectives and handling risks that arise from designing and using AI systems" },
      { before: "AI risk management can be integrated in other management systems",
        after: "managing AI risk can sit inside other management systems" },
      { before: "to identify if **additional controls are necessary beyond those in Annex A**",
        after: "to identify whether **controls beyond Annex A's are necessary**" },
      { before: "the organization shall implement the controls determined according to 6.1.3 that relate to the operation of the AIMS",
        after: "the organization shall implement those controls settled under 6.1.3 which bear on operating the AIMS" },
      { before: "established to address them shall be reflected in the statement of applicability",
        after: "established to address them shall appear in the statement of applicability" },
      { before: "the organization **can utilize an AI system impact assessment as indicated in 6.1.4**",
        after: "the organization **can draw on an AI system impact assessment, as 6.1.4 indicates**" },
      { before: "**consider the results of the AI system impact assessment in the risk assessment**",
        after: "**take what the AI system impact assessment found into the risk assessment**" },
      { before: "which requires the organization to implement the controls determined according to 6.1.3 that relate to the operation of the AI management system.",
        after: "which requires the organization to implement those controls settled under 6.1.3 which bear on operating the AI management system." },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-04-06-two-assessments-not-one", address: "42001 clause 6.1.4",
    note: "5 runs; the 64w span crosses three consecutive requirements and all four bullets are recast",
    en: {
      before: "- The organization **shall define a process for assessing the potential consequences for individuals or groups of individuals, or both, and societies** that can result from the development, provision or use of AI systems.",
      after: "- The organization **shall define a process for assessing what may follow for individuals, for groups of them, or both, and for societies** from developing, providing or using AI systems.",
    },
    also: [
      { before: "- The AI system impact assessment **shall determine the potential consequences** an AI system's **deployment, intended use and foreseeable misuse** has on individuals or groups of individuals, or both, and societies.",
        after: "- The AI system impact assessment **shall determine the potential consequences** that an AI system's **deployment, intended use and foreseeable misuse** carry for individuals, for groups of them, or both, and for societies." },
      { before: "- The assessment **shall take into account the specific technical and societal context** where the AI system is deployed **and applicable jurisdictions**.",
        after: "- The assessment **shall take account of the specific technical and societal context** of the place the AI system is deployed, **and the jurisdictions that apply**." },
      { before: "- The **result** of the AI system impact assessment **shall be documented**.",
        after: "- The assessment's **result shall be documented**." },
      { before: "- The organization **shall consider the results** of the AI system impact assessment **in the risk assessment** referred to in 6.1.2.",
        after: "- The organization **shall carry the results** of the AI system impact assessment **into the risk assessment** at 6.1.2." },
      { before: "the result **can** be made available to relevant interested parties as defined by the organization",
        after: "the result **can** be shared with whichever interested parties the organization names" },
      { before: "the organization shall **consider the results** of the AI system impact assessment in the risk assessment",
        after: "the organization shall **carry the results** of the AI system impact assessment into the risk assessment" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-04-07-controlled-not-merely-present", address: "42001 clauses 7.5.1, 7.5.3",
    note: "4 runs; the 7.5.3 sentence carries two and is one span",
    en: {
      before: "requires the organization's AI management system to include:",
      after: "requires the AI management system to hold:",
    },
    also: [
      { before: "- a) **documented information required by this document**;",
        after: "- a) **the documented information this document requires**;" },
      { before: "- b) **documented information determined by the organization as being necessary for the effectiveness** of the AI management system.",
        after: "- b) **whatever documented information the organization judges necessary** for the AI management system to be effective." },
      { before: "requires that documented information be **available and suitable for use where and when it is needed**, and be **adequately protected** - from loss of confidentiality, improper use, or loss of integrity.",
        after: "requires documented information to be **there and fit to use, where and when it is needed**, and to be **adequately protected** - against lost confidentiality, improper use, or lost integrity." },
      { before: "the organization shall address, as applicable: distribution, access, retrieval and use; storage and preservation, including preservation of legibility; control of changes, such as version control; and retention and disposition. Documented information of external origin determined necessary shall be identified as appropriate and controlled.",
        after: "the organization shall address, as applicable: how it is distributed, accessed, retrieved and used; how it is stored and preserved, legibility included; how changes are controlled, such as by version; and how it is retained and disposed of. Documented information of external origin judged necessary shall be identified as appropriate and controlled." },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-04-08-defined-versus-running", address: "42001 clauses 8.1, 8.2, 8.4",
    note: "10 runs; 8.2 is recast and 8.4 deliberately is not, because the lesson is their difference",
    en: {
      before: "requires the organization to plan, implement and control the processes needed to meet requirements and to implement the actions determined in Clause 6, by:",
      after: "requires the organization to plan, run and control the processes it needs in order to meet requirements and carry out what Clause 6 determined, by:",
    },
    also: [
      { before: "- **establishing criteria for the processes**;",
        after: "- **setting criteria for those processes**;" },
      { before: "- **implementing control of the processes in accordance with the criteria**.",
        after: "- **controlling the processes against those criteria**." },
      { before: "> The organization **shall implement the controls determined according to 6.1.3** that are related to the operation of the AI management system - for example, AI system development and usage life cycle related controls. **The effectiveness of these controls shall be monitored and corrective actions shall be considered** if the intended results are not achieved.",
        after: "> The organization **shall implement the controls settled under 6.1.3** that bear on operating the AI management system - controls tied to the AI system development and usage life cycle, for example. **The effectiveness of those controls shall be monitored, and corrective action shall be considered** where the intended results do not follow." },
      { before: "Documented information shall be available to the extent necessary to have confidence that processes have been carried out as planned.",
        after: "Documented information shall be kept so far as is needed to give confidence that processes ran as planned." },
      { before: "**8.2** - at planned intervals or when significant changes are proposed or occur; retain documented information of the results",
        after: "**8.2** - at planned intervals, and whenever significant change is proposed or happens; retain documented information of the results" },
      { before: "Clause 8.2 says at planned intervals or when significant changes are proposed or occur; clause 8.4 says",
        after: "Clause 8.2 says at planned intervals, and whenever significant change is proposed or happens; clause 8.4 says" },
      { before: "**the effectiveness of these controls shall be monitored and corrective actions shall be considered if the intended results are not achieved.**",
        after: "**the effectiveness of those controls shall be monitored, and corrective action shall be considered where the intended results do not follow.**" },
      { before: "**documented information shall be available to the extent necessary to have confidence that the processes have been carried out as planned.**",
        after: "**documented information shall be kept so far as is needed to give confidence that the processes ran as planned.**" },
      { before: "*Confidence that the processes have been carried out as planned* names the test",
        after: "*Confidence that the processes ran as planned* names the test" },
      { before: "which requires the organization to implement the controls determined according to 6.1.3 that relate to the operation of the AI management system.",
        after: "which requires the organization to implement those controls settled under 6.1.3 which bear on operating the AI management system." },
    ],
  },
];
