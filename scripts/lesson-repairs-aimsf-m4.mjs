/**
 * lesson-repairs-aimsf-m4.mjs - AIMS-F module 4, the last five withheld lessons.
 *
 * 23 runs. This closes the visible stop: AIMS-F goes to 35/35 English rather
 * than four complete modules and a gap.
 *
 * ELEVEN OF THE 23 REUSE WORDING ALREADY CHECKED elsewhere in this pass --
 * Annex A optionality, the Annex B documentation sentence, the AI policy
 * phrase, the concern-reporting route, the event-log determination, the data
 * objective, the responsible-AI list, the allocation split. Module 4 is where
 * the Annex A controls are enumerated, so it restates what modules 1-3 and the
 * blueprint already had to recast.
 *
 * 04-06 carries ONE span covering two runs: they sit in the same sentence, and
 * repairing them separately would have left the first recast's output as the
 * second's `before`. One span, one sentence.
 */

export const REPAIRS = [
  {
    cert: "AIMS-F", slug: "04-01-annex-a-structure", address: "42001 Annex A intro, Annex B general clause",
    note: "3 runs; two reuse blueprint 4.1's recasts",
    en: {
      before: "provides a reference set of controls for meeting organizational objectives and addressing risks related to the design and operation of AI systems",
      after: "provides a reference set of controls that serve organizational objectives and address the risks arising in how AI systems are designed and run",
    },
    also: [
      { before: "organizations **do not have to document or justify inclusion or exclusion of the implementation guidance** in the Statement of Applicability",
        after: "an organization is **not required to document or justify which parts of that guidance it adopted** in the Statement of Applicability" },
      { before: "**Not all the control objectives and controls listed are required to be used**, and the organization can design and implement its own controls.",
        after: "**Not every listed control objective and control must be used**, and an organization may design and implement its own." },
    ],
  },
  {
    cert: "AIMS-F", slug: "04-03-governing-apparatus-controls", address: "42001 A.2, A.3.3",
    note: "3 runs, two of them already recast in module 3",
    en: {
      before: "**Documenting a policy** for the development or use of AI systems.",
      after: "**Documenting a policy** covering how AI systems get developed or used.",
    },
    also: [
      { before: "by organizational values and culture and the amount of risk the organization is willing to carry",
        after: "by organizational values and culture, by how much risk the organization is prepared to carry" },
      { before: "a process for people to report concerns about the organization's role with respect to an AI system, throughout its life cycle.",
        after: "a route for people to raise concerns about whatever role the organization holds around an AI system, at any point in its life." },
    ],
  },
  {
    cert: "AIMS-F", slug: "04-04-impact-and-life-cycle-controls", address: "42001 A.5, A.6",
    note: "3 runs; the event-log one is the `should` that must stay a `should`",
    en: {
      before: "**Establish a process** to assess the potential consequences for individuals or groups",
      after: "**Establish a process** for working out what a system could do to individuals or to groups",
    },
    also: [
      { before: "**Documentation of design and development**, based on organizational objectives, documented requirements and specification criteria.",
        after: "**Documentation of design and development**, grounded in organizational objectives, the documented requirements and the specification criteria." },
      { before: "**determine at which phases of the life cycle record keeping of event logs should be enabled**",
        after: "**determine at which life-cycle phases event logs should be kept**" },
    ],
  },
  {
    cert: "AIMS-F", slug: "04-05-data-and-information-controls", address: "42001 A.7, A.8",
    note: "EIGHT runs -- the densest lesson in the module, because A.7 and A.8 are both enumerations",
    en: {
      before: "whose objective is that the organization understands the role and impacts of data in AI systems across their life cycles",
      after: "whose objective is that the organization grasps what data does, and does to people, across its AI systems and their life cycles",
    },
    also: [
      { before: "determining and documenting details about the acquisition and selection of the data used",
        after: "settling and recording how the data it uses was acquired and chosen" },
      { before: "the information they need to understand and assess the risks and their impacts, **both positive and negative.**",
        after: "the information they need to grasp and weigh the risks and what those risks do, **good and bad alike.**" },
      { before: "**that the user is interacting with an AI system**; how to interact with it",
        after: "**that they are dealing with an AI system at all**; how to work with it" },
      { before: "Capabilities for interested parties to report adverse impacts of the system.",
        after: "Ways for interested parties to flag harm the system has done." },
      { before: "the timeline for notification, whether and which authorities must be notified",
        after: "how quickly notification must happen, and which authorities if any must hear of it" },
      /* THE FIRST DRAFT DROPPED A `should` AND THE GUARD DID NOT CATCH IT.
       * "but should be aware of unique requirements" became "while staying
       * alert to requirements unique", which turns ISO's advice into a
       * description of what happens. The profile went weak 1 -> 0, and the
       * weak-loss rule only fires when the STRONG count is also zero -- here
       * `requirements` kept strong at 1 and masked it.
       *
       * That masking is a consequence of adding nominalisations to the strong
       * list this afternoon: a noun that is not the modal can hold the strong
       * count up while the modal leaves. Recorded in obligation-guard.mjs.
       * The fix is the text, not the guard: keep `should`. */
      { before: "incident management activities, **but should be aware of unique requirements** related to AI systems or their individual components",
        after: "incident management activities, **but should stay alert to requirements unique** to AI systems or to their individual components" },
      { before: "although AI systems can be complex, it is critical that users understand",
        after: "AI systems may be complex, but it matters greatly that users understand" },
    ],
  },
  {
    cert: "AIMS-F", slug: "04-06-use-and-third-party-controls", address: "42001 A.9, A.10",
    note: "6 runs in 5 spans -- two of them sit in ONE sentence and are repaired together",
    en: {
      // LIST, the third time this one has come up.
      before: "fairness, accountability, transparency, explainability, reliability, safety, robustness and redundancy, privacy and security, accessibility",
      after: "fairness, accountability, transparency and explainability, reliability, safety, robustness, redundancy, privacy, security and accessibility",
    },
    also: [
      { before: "**including having authority to override decisions made by the AI system**. Ensuring",
        after: "**including the authority to overturn what the AI system decided**. Ensuring" },
      /* ONE SPAN, TWO RUNS. Both sit in A.10's objective sentence; separate
       * spans would have made the first recast's output the second's `before`
       * and the second would never have matched. */
      { before: "Category A.10's objective is that the organization understands its responsibilities and remains accountable, and that risks are appropriately apportioned when third parties are involved at any stage of the life cycle.",
        after: "Category A.10's objective is that the organization knows what it is responsible for and stays accountable, and that risk is shared out properly wherever third parties take part at any point in the life cycle." },
      { before: "responsibilities can be split between parties providing data, parties providing algorithms and models",
        after: "responsibilities may be split between whoever supplies the data, whoever supplies algorithms and models" },
      { before: "consider whether automated decision-making is appropriate for a responsible approach to the use of an AI system and its intended use",
        after: "consider whether automating a decision at all fits a responsible approach to using the system for its intended purpose" },
    ],
  },
];
