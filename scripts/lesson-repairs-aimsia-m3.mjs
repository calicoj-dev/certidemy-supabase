/**
 * lesson-repairs-aimsia-m3.mjs - AIMS-IA module 3, seven withheld lessons.
 *
 * 39 runs, the largest module in this certification. 03-07 is already clean and
 * is absent from this file rather than passed through it.
 *
 * ============ THIS MODULE IS WHERE `should` CARRIES THE MOST WEIGHT ==========
 *
 * Clause 6.4.7's "only information that can be subject to some degree of
 * verification should be accepted as audit evidence" is the rule the whole
 * module turns on, and it is ADVICE. So is Annex A.13's caution about working
 * documents, and 6.4.8's review of nonconformities. Twenty-one of these 39 runs
 * carry a `should` and every one of them stays a `should` -- an auditor
 * certification that hardens 19011's guidance into a requirement is teaching
 * the opposite of the standard it cites.
 *
 * ============ RUNS THAT SHARE A LINE ============
 *
 * 03-02's planning sentence carries two, 03-03's sampling definition two and
 * its clause 4.7 sentence two more, 03-04's verification rule two and its
 * Annex A.5 paragraph two. Where they sit inside one sentence they are ONE
 * span; where they sit in separate sentences of the same line they are two.
 *
 * 03-08's guide sentence crossed a line break into the observer paragraph and
 * is written as a single-line span ending at the full stop.
 */

export const REPAIRS = [
  {
    cert: "AIMS-IA", slug: "aims-ia-03-01-the-order-of-an-audit", address: "19011 clauses 6.2.3, 6.6, 6.7",
    note: "5 runs; the follow-up phrasing repeats in the checkpoint",
    en: {
      before: "sufficient and appropriate information for planning and conducting the audit",
      after: "enough suitable information to plan and conduct the audit",
    },
    also: [
      { before: "an alternative should be proposed to the audit client, in agreement with the auditee",
        after: "an alternative should be put to the audit client, agreed with the auditee" },
      { before: "the audit is complete when all planned audit activities have been carried out, or as otherwise agreed with the audit client",
        after: "the audit is complete once every planned audit activity has been done, or when the audit client agrees otherwise" },
      { before: "these are usually decided and undertaken by the auditee within an agreed time frame",
        after: "these are normally settled and carried out by the auditee inside a time frame both have agreed" },
      { before: "that actions are usually decided and undertaken by the auditee within an agreed time frame",
        after: "that actions are normally settled and carried out by the auditee inside an agreed time frame" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-03-02-enough-to-plan-against", address: "19011 clauses 6.3.1, 6.3.2, 6.4.7, Annex A.13",
    note: "7 runs; the clause 6.3.2 sentence carries two and is one span",
    en: {
      before: "to establish an overview of the extent of the documented information",
      after: "to build an overall picture of how much documented information there is",
    },
    also: [
      { before: "the audit team leader should inform the audit client, the individual(s) managing the audit programme and the auditee",
        after: "the audit team leader should tell the audit client, whoever manages the audit programme, and the auditee" },
      { before: "provides the basis for agreement among the audit client, the audit team and the auditee. Its detail should reflect the scope and complexity of the audit, and the risks and opportunities associated with it.",
        after: "provides what the audit client, the audit team and the auditee then agree on. Its detail should match the audit's scope and complexity, and the risks and opportunities that go with it." },
      { before: "or of risks or opportunities, these should be addressed by the audit team accordingly",
        after: "or of risks or opportunities, the audit team should deal with them accordingly" },
      { before: "**should not restrict the audit activities**, which can change as a result of information collected during the audit",
        after: "**should not restrict the audit activities**, since those may change with what the audit turns up" },
      { before: "Working documents should not restrict the audit activities, which can change as a result of information collected.",
        after: "Working documents should not restrict the audit activities, since those may change with what the audit turns up." },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-03-03-what-the-sample-supports", address: "19011 Annex A.6.1, clauses 4.7, 6.5.1 k",
    note: "7 runs across four lines; two lines carry two each",
    en: {
      before: "it takes place when it is not practical or cost-effective to examine all available information",
      after: "it is used where examining all the available information is impractical or too costly",
    },
    also: [
      { before: "of the items within the population to obtain and evaluate evidence about some characteristic of that population, in order to form a conclusion concerning the population",
        after: "of the items in a population, so that evidence about some characteristic of it can be gathered and weighed, and a conclusion about the whole drawn" },
      { before: "**the samples are not necessarily representative** of the population from which they are selected",
        after: "**the samples are not necessarily representative** of the population they came from" },
      { before: "audit evidence should be verifiable and based on samples of the information available, since an audit runs for a specified duration with finite resources, and appropriate sampling should be applied because this is closely related to the confidence that can be placed in the conclusions",
        after: "audit evidence should be verifiable and drawn from samples of what is available, because an audit runs for a set time on finite resources, and sampling should be done appropriately, since how much confidence the conclusions can carry turns on it" },
      { before: "Annex A.6.1 says sampling takes place when it is not practical or cost-effective to examine all available information",
        after: "Annex A.6.1 says sampling is used where examining all the available information is impractical or too costly" },
      { before: "**a statement that audits are by nature a sampling exercise; as such there is a risk that the audit evidence examined is not representative.**",
        after: "**a statement that auditing is by its nature a sampling exercise, and so the evidence examined carries a risk of not being representative.**" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-03-04-demonstrated-not-described", address: "19011 clauses 3.9, 3.10, 4.7, 6.4.7, Annex A.5",
    note: "TEN runs. The verification rule is advice and stays advice.",
    en: {
      before: "as records, statements of fact or other information which are relevant to the audit criteria and verifiable",
      after: "as records, statements of fact or other information that bears on the audit criteria and can be verified",
    },
    also: [
      { before: "**only information that can be subject to some degree of verification should be accepted as audit evidence.** Where the degree of verification is low, the auditor should use professional judgement to determine the degree of reliance that can be placed on it.",
        after: "**nothing should be accepted as audit evidence unless it can be verified to some degree.** Where that degree is low, the auditor should judge professionally how far it can be relied on." },
      { before: "- **complete** - all expected content is contained in the documented information;",
        after: "- **complete** - the documented information holds everything expected of it;" },
      { before: "- **correct** - the content conforms to other reliable sources such as standards and regulations;",
        after: "- **correct** - its content squares with standards, regulations and other reliable sources;" },
      { before: "- **consistent** - the documented information is consistent in itself and with related documented information;",
        after: "- **consistent** - it agrees with itself and with the documented information related to it;" },
      { before: "or in alternate media - the **integrity of the audit evidence should be assessed**. And specific care should be taken for the security of data",
        after: "or in alternate media - the **integrity of that evidence should be assessed**. And particular care should go to keeping the data secure" },
      { before: "as the rational method for reaching **reliable and reproducible** audit conclusions in a systematic audit process",
        after: "as the rational way to reach **reliable and reproducible** audit conclusions within a systematic process" },
      { before: "Annex A.5 asks whether documented information is consistent in itself and with related documented information",
        after: "Annex A.5 asks whether documented information agrees with itself and with the information related to it" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-03-05-the-question-that-finds-evidence", address: "19011 Annex A.17",
    note: "5 runs; A.17 a) is quoted three times in the lesson and all three are recast the same way",
    en: {
      before: "to be carried out in a manner adapted to the situation and the individual interviewed",
      after: "to be conducted in a way suited to the situation and to the person interviewed",
    },
    also: [
      { before: "- interviews **held with individuals from appropriate levels and functions** performing activities or tasks within the audit scope;",
        after: "- interviews **held with people at the levels and functions that fit** who carry out work inside the audit scope;" },
      { before: "- conducted **during the interviewees' defined working hours** and, where practical, at their normal workplace;",
        after: "- conducted **within the interviewee's defined working hours** and, where practical, at their normal workplace;" },
      { before: "interviews be held with individuals from **appropriate levels and functions performing activities or tasks within the audit scope**",
        after: "interviews be held with people at **the levels and functions that actually carry out work inside the audit scope**" },
      { before: "- Annex A.17 asks that interviews be held with individuals from appropriate levels and functions performing activities within the audit scope.",
        after: "- Annex A.17 asks that interviews be held with people at the levels and functions that carry out work inside the audit scope." },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-03-06-what-a-screen-share-establishes", address: "19011 Annex A.16, Annex A.5",
    note: "2 runs; the Annex A.5 recast is the one used in 03-04",
    en: {
      before: "that they can introduce **additional risks and opportunities** to the audit process",
      after: "that they can bring **additional risks and opportunities** into the audit process",
    },
    also: [
      { before: "or in alternate media - the **integrity of the audit evidence should be assessed.**",
        after: "or in alternate media - the **integrity of that evidence should be assessed.**" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-03-08-opening-and-closing", address: "19011 clauses 6.4.2, 6.4.8, 6.4.10",
    note: "3 runs; the guide sentence crossed into the observer paragraph and stops at the full stop",
    en: {
      before: "The clause is clear that a guide should not influence or interfere with the conduct of the audit.",
      after: "The clause is clear that a guide should neither sway nor obstruct how the audit is run.",
    },
    also: [
      { before: "Nonconformities should be **reviewed with the auditee to obtain acknowledgement that the audit evidence is accurate and that the nonconformities are understood**. Every attempt should be made to resolve any diverging opinions concerning the audit evidence or audit findings, and **unresolved issues should be recorded in the audit report**.",
        after: "Nonconformities should be **gone through with the auditee until they acknowledge that the evidence is accurate and that they understand the nonconformities**. Every effort should go into settling any disagreement about the evidence or the findings, and **whatever stays unresolved should be recorded in the audit report**." },
      { before: "A guide accompanies and clarifies and should not influence or interfere with the conduct of the audit;",
        after: "A guide accompanies and clarifies and should neither sway nor obstruct how the audit is run;" },
    ],
  },
];
