/**
 * lesson-repairs-aimsf-m1.mjs - AIMS-F module 1, the three withheld lessons.
 *
 * 14 runs. Sequencing is now BY MODULE, not by cost: a partner clicking into a
 * module and hitting withheld lessons reads as broken, where a complete module
 * with a visible stop reads as work in progress. Modules 1, 2 and 5 are each
 * three lessons from complete, so 1 -> 2 -> 5 yields three whole modules for
 * fewer edits than module 3 alone would take.
 *
 * These are the EXPENSIVE lessons. Batches 1 and 2 took every one-and
 * two-passage lesson wherever it sat, which is why nothing was complete and why
 * what remains averages five runs a lesson rather than one.
 *
 * Six of the fourteen reuse wording already checked by the leak index and the
 * obligation guard in an earlier batch or in the blueprint pass. Three are LIST
 * REORDERS, where the run was ISO's ordering and nothing else.
 */

export const REPAIRS = [
  {
    cert: "AIMS-F", slug: "01-03-the-ai-system-life-cycle", address: "42001 A.4 resources, clause 8",
    note: "5 runs; one inside a ::checkpoint explanation",
    en: {
      // LIST. The run is the life-cycle ordering; resequenced into the order the
      // lesson itself walks, which changes nothing about what is listed.
      before: "development, deployment, operation, change management, maintenance, transfer and decommissioning, as well as verification and integration",
      after: "development, verification and validation, integration, deployment, operation, maintenance, change management, transfer and decommissioning",
    },
    also: [
      { before: "production data and output data are used to further train the model",
        after: "output and production data are fed back to train the model further" },
      { before: "assessments at planned intervals, or when significant changes are proposed or occur",
        after: "assessments at planned intervals, and again whenever a significant change is proposed or occurs" },
      { before: "allocated across the organization, its partners, suppliers, customers and third parties",
        after: "allocated across the organization and its suppliers, partners, customers and other third parties" },
      { before: "performed at planned intervals or when significant changes are proposed or occur.",
        after: "performed at planned intervals, and again whenever a significant change is proposed or occurs." },
    ],
  },
  {
    cert: "AIMS-F", slug: "01-04-harmonised-structure", address: "42001 harmonised structure, Annex D.2",
    note: "6 runs; the Annex D.2 sentence carries three of them",
    en: {
      before: "— identical clause numbers, clause titles, text, and common terms and core definitions — developed to align",
      after: "— the same clause numbering and titles, the same core text, and a shared vocabulary — built to align",
    },
    also: [
      { before: "integration of the AI management system with generic or sector-specific management system standards for relevant topics is **essential**",
        after: "bringing the AI management system together with generic or sector-specific standards on relevant topics is **essential**" },
      { before: "**essential** for responsible development and use of an AI system",
        after: "**essential** to developing and using an AI system responsibly" },
      { before: "objectives such as safety, security, privacy and environmental impact should be managed holistically",
        after: "objectives such as security, privacy, safety and environmental impact should be handled as one whole" },
      { before: "because both use the high-level structure their integrated use is facilitated and of great benefit",
        after: "because both share the high-level structure, using them together is easier and well worth doing" },
      { before: '"text": "As essential for responsible development and use of an AI system"',
        after: '"text": "As essential to developing and using an AI system responsibly"' },
    ],
  },
  {
    cert: "AIMS-F", slug: "01-06-what-an-aims-is-not", address: "42001 A.6 design, clause 1 scope",
    note: "3 runs, two of them lists",
    en: {
      before: "requirements specification, data acquisition, data conditioning, model training, verification and validation",
      after: "requirements specification, data acquisition and conditioning, model training, then verification and validation",
    },
    also: [
      { before: "provides requirements and guidance from an **AI technology specific** view",
        after: "sets out requirements and guidance from an **AI-technology-specific** angle" },
      { before: "fairness, accountability, transparency, explainability, reliability, safety, robustness and redundancy, privacy and security, accessibility",
        after: "fairness, accountability, transparency and explainability, reliability, safety, robustness, redundancy, privacy, security and accessibility" },
    ],
  },
];
