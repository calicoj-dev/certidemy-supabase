/**
 * lesson-repairs-aimsf-m2.mjs - AIMS-F module 2, the three withheld lessons.
 *
 * 18 runs, nine of them in 02-06 alone -- the impact-assessment lesson, which is
 * the densest in the certification because clause 6.1.4 and its Annex B guidance
 * are mostly enumerations, and an enumeration reproduced in order is a run even
 * when every word around it is ours.
 *
 * FIVE OF THE EIGHTEEN ARE LIST REORDERS for exactly that reason. Where the run
 * IS the ordering, resequencing removes it and changes nothing a reader learns.
 * Where the run is a sentence, it is recast with the modal held.
 *
 * The interested-party definition appears THREE TIMES in 02-01 -- in the prose,
 * in a checkpoint explanation and in a summary bullet. All three are recast the
 * same way: a lesson whose three copies of one sentence disagree teaches the
 * disagreement.
 */

export const REPAIRS = [
  {
    cert: "AIMS-F", slug: "02-01-context-and-interested-parties", address: "42001 clauses 4.1, 4.2 and 3.x",
    note: "6 runs; the interested-party definition three times over",
    en: {
      before: "determine external and internal issues that are relevant to its purpose and that affect its ability to achieve",
      after: "work out which external and internal issues bear on its purpose and on its ability to achieve",
    },
    also: [
      { before: "that can affect, be affected by, **or perceive itself to be affected by** a decision or activity",
        after: "who can affect a decision or activity, be affected by one, **or believe themselves to be affected**" },
      { before: "are expected to change and be reviewed from time to time",
        after: "will shift over time and are meant to be revisited" },
      { before: "a person or organization that can affect, be affected by, or perceive itself to be affected by a decision or activity",
        after: "a person or organization who can affect a decision or activity, be affected by one, or believe themselves to be affected" },
      { before: '"text": "The competitive landscape and trends for new products and services using AI"',
        after: '"text": "The competitive picture, and where AI-based products and services are heading"' },
      { before: "An interested party can affect, be affected by, or perceive itself to be affected.",
        after: "An interested party can affect something, be affected by it, or believe themselves affected." },
    ],
  },
  {
    cert: "AIMS-F", slug: "02-04-roles-responsibilities-authorities", address: "42001 clause 5.3",
    note: "3 runs, one of them a long ownership list",
    en: {
      before: 'for relevant roles are assigned **and communicated** within the organization',
      after: 'attaching to each relevant role are assigned **and communicated** across the organization',
    },
    also: [
      { before: "**Reporting on the performance of the AI management system to top management.**",
        after: "**Reporting to top management on how the AI management system is performing.**" },
      // LIST. The run is the ordering; resequenced, nothing added or dropped.
      { before: "Risk management. AI system impact assessments. Asset and resource management. Security. Safety. Privacy. Development. Performance. Human oversight. Supplier relationships.",
        after: "AI system impact assessments. Security. Privacy. Safety. Development. Performance. Supplier relationships. Asset and resource management. Risk management. Human oversight." },
    ],
  },
  {
    cert: "AIMS-F", slug: "02-06-the-ai-system-impact-assessment", address: "42001 clause 6.1.4, clause 8.4, Annex B.5",
    note: "NINE runs -- the densest lesson in the certification. Four are enumerations from Annex B guidance.",
    en: {
      before: "**Define a process** for assessing the potential consequences for individuals or groups",
      after: "**Define a process** for working out what a system could do to individuals or to groups",
    },
    also: [
      /* `can` IS LOAD-BEARING HERE and the first draft dropped it. "consequences
       * that CAN result" describes what is possible; "consequences arising"
       * asserts that they do. The guard read weak 1 -> 0 and was right: an
       * impact assessment looks for what a system MIGHT do, and a paraphrase
       * that states it as fact changes the exercise. */
      { before: "and societies, that can result from the development, provision or use of AI systems",
        after: "and to societies, that can arise anywhere in how AI systems are built, supplied or used" },
      { before: "**Take into account** the specific technical and societal context where the system is deployed",
        after: "**Take into account** the particular technical and social setting the system is deployed into" },
      { before: "the organization shall consider the results of the AI system impact assessment in the risk assessment",
        after: "the impact assessment's results shall be taken into account when risk is assessed" },
      { before: "assessments are performed at planned intervals, or when significant changes are proposed to occur",
        after: "assessments are performed at planned intervals, and again whenever a significant change is proposed" },
      { before: "system affects the **legal position or life opportunities** of individuals",
        after: "system bears on an individual's **legal standing or life chances**" },
      // LIST.
      { before: "include fairness, accountability, transparency and explainability, security and privacy, safety and health, financial consequences, accessibility, and human rights",
        after: "include fairness, accountability, transparency and explainability, privacy and security, health and safety, accessibility, human rights, and financial consequences" },
      // LIST, and the longest run in the certification at 31 words.
      { before: "environmental sustainability, including natural resources and greenhouse gas emissions; economic, including access to financial services, employment opportunities, taxes, trade and commerce; government, including legislative processes, misinformation for political gain, national security and criminal justice",
        after: "economic, including access to financial services, employment, taxes, trade and commerce; environmental sustainability, including natural resources and greenhouse gas emissions; government, including legislative processes, national security, criminal justice and misinformation for political gain" },
      { before: "consider how the systems can be **misused** to create societal harms, and how they can be used to **address historical harms**",
        after: "consider how these systems might be **misused** in ways that harm society, and how they might instead **help undo historical harms**" },
    ],
  },
];
