/**
 * lesson-repairs-aimsia-m5.mjs - AIMS-IA module 5, the last seven lessons.
 *
 * 51 runs. Findings, Reporting and Follow-up quotes clause 6.5.1's eleven
 * report elements, clause 10.2's five limbs and clause 9.3.2's five review
 * inputs -- three enumerations, every run crossing between items.
 *
 * ============ A LIST'S SUB-ITEMS ADJOIN EACH OTHER TOO ============
 *
 * 05-07 d) is the case worth naming. Recasting the lettered item's own text
 * left its three NUMBERED sub-items -- "nonconformities and corrective
 * actions", "monitoring and measurement results", "audit results" -- adjoining
 * each other and then adjoining e), for fourteen words with no line of prose
 * between them. Short bullets are individually harmless and collectively a run.
 * Breaking ONE of the three was enough.
 *
 * ============ EIGHT RUNS REUSE A RECAST ALREADY CHECKED ============
 *
 * "a statement on the degree to which the audit criteria have been fulfilled"
 * (04-10), "such actions are usually decided and undertaken by the auditee"
 * (03-01), the 3.26 note (04-05 and 04-09), the climate-change NOTE (04-11),
 * A.6.2.6's internal `should` (04-09), and the sampling statement (03-03).
 * Module 5 restates what modules 3 and 4 introduced, which is what a
 * findings-and-reporting module does.
 *
 * ============ AND THE MODALS ARE THE SUBJECT AGAIN ============
 *
 * 05-01 turns on nonconformities being gradeable -- `can`, not `shall` -- while
 * the criteria for grading `should` be defined. 05-04's whole point is a
 * `should` sitting inside a Table A.1 control and a `shall` sitting inside a
 * note to a definition. Every one of those modals is left exactly as it is.
 */

export const REPAIRS = [
  {
    cert: "AIMS-IA", slug: "aims-ia-05-01-three-things-a-finding-can-be", address: "19011 clauses 6.4.8, Annex A.18.3",
    note: "8 runs; the grading `can` and the criteria `should` both stand",
    en: {
      before: "audit evidence should be evaluated against the audit criteria in order to determine audit findings, and where the audit plan specifies, findings should include conformity and good practices with supporting evidence, opportunities for improvement, and any recommendations to the auditee.",
      after: "audit evidence should be weighed against the audit criteria so that audit findings can be determined, and where the audit plan says so, findings should cover conformity and good practice with the evidence behind them, chances to improve, and any recommendation made to the auditee.",
    },
    also: [
      { before: "- a **declaration of nonconformity**, including a description explaining **why the audit criteria are not fulfilled**;",
        after: "- a **declaration of nonconformity**, with a description setting out **where the audit criteria fall short**;" },
      { before: "records that nonconformities **can** be graded depending on the context of the organization and its risks",
        after: "records that nonconformities **can** be graded according to the organization's context and its risks" },
      { before: "**where grading is used, the criteria used by the auditing organization should be defined and communicated",
        after: "**where grading is used, the criteria the auditing organization uses should be defined and communicated" },
      { before: "Clause 6.4.8 states that nonconformities can be graded depending on the context of the organization and its risks",
        after: "Clause 6.4.8 states that nonconformities can be graded according to the organization's context and its risks" },
      { before: "states that where grading is used, the criteria used by the auditing organization should be defined and communicated.",
        after: "states that where grading is used, the criteria the auditing organization uses should be defined and communicated." },
      { before: "The declaration of nonconformity including a description explaining why the audit criteria are not fulfilled.",
        after: "The declaration of nonconformity with a description setting out where the audit criteria fall short." },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-05-02-criterion-evidence-gap", address: "19011 Annex A.18.3, clause 6.7",
    note: "2 runs, both recast the same way as their siblings elsewhere",
    en: {
      before: "a declaration of nonconformity **including a description explaining why the audit criteria are not fulfilled**",
      after: "a declaration of nonconformity **with a description setting out where the audit criteria fall short**",
    },
    also: [
      { before: "**such actions are usually decided and undertaken by the auditee** within an agreed time frame",
        after: "**such actions are normally settled and carried out by the auditee** inside an agreed time frame" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-05-03-one-finding-or-several", address: "19011 Annex A.18.4",
    note: "2 runs; the second crossed a block break and the following paragraph is recast too",
    en: {
      before: "covers **dealing with audit findings related to multiple criteria**. During an audit it is possible to identify findings relating to more than one criterion, and where an auditor identifies a finding relating to one criterion, the auditor should consider the possible effect on the corresponding or similar criteria of the other management systems.",
      after: "covers **findings that touch more than one set of criteria**. An audit may turn up findings bearing on several criteria at once, and when a finding lands against one criterion, the auditor should think about what it may mean for the matching or similar criteria of the other management systems.",
    },
    also: [
      { before: "Depending on the arrangements with the audit client, the auditor can raise",
        after: "Under the arrangements made with the audit client, the auditor can raise" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-05-04-can-this-finding-stand", address: "42001 clauses 3.14, 3.16, 3.26, controls A.6.2.6, A.6.2.8; 4.2 NOTE",
    note: "4 runs, three of them already recast in module 4",
    en: {
      before: "as a need or expectation that is stated, generally implied or obligatory",
      after: "as a need or expectation, whether stated, generally implied or obligatory",
    },
    also: [
      { before: "at a minimum this **should** include system and performance monitoring, repairs, updates and support.",
        after: "at a minimum this **should** cover monitoring of the system and its performance, repairs, updates and support." },
      { before: "- the NOTE at clause 4.2, that relevant interested parties can have requirements related to climate change;",
        after: "- the NOTE at clause 4.2, that interested parties may have requirements that relate to climate change;" },
      { before: "established to address them shall be reflected in the statement of applicability",
        after: "established to address them shall appear in the statement of applicability" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-05-05-a-report-for-someone-not-in-the-room", address: "19011 clauses 6.5.1, 4.3, 4.5",
    note: "FOURTEEN runs; clause 6.5.1's eleven report elements are recast item by item",
    en: {
      before: "states that the audit team leader should report the audit conclusions in accordance with the audit programme, and that the report should provide a **complete, accurate, concise and clear record** of the audit",
      after: "states that the audit team leader should report the audit conclusions as the audit programme provides, and that the report should be a **complete, accurate, concise and clear record** of what was done",
    },
    also: [
      { before: "- a) audit **objectives**;",
        after: "- a) the audit's **objectives**;" },
      { before: "- b) audit **scope**, particularly identification of the organization and the functions or processes audited;",
        after: "- b) the audit's **scope**, naming in particular the organization and which functions or processes were audited;" },
      { before: "- c) identification of the **audit client**;",
        after: "- c) who the **audit client** is;" },
      { before: "- d) identification of the **audit team** and auditee's participants;",
        after: "- d) who was on the **audit team**, and who took part for the auditee;" },
      { before: "- e) **dates and locations** where auditing activities were conducted;",
        after: "- e) the **dates and locations** at which auditing took place;" },
      { before: "- f) audit **criteria**;",
        after: "- f) the audit **criteria**;" },
      { before: "- g) audit **findings and related audit evidence**;",
        after: "- g) the **findings and the evidence behind them**;" },
      { before: "- h) audit **conclusions**;",
        after: "- h) the audit **conclusions**;" },
      { before: "- i) a statement on the **degree to which the audit criteria have been fulfilled**;",
        after: "- i) a statement of **how far the audit criteria have been fulfilled**;" },
      { before: "- j) any **unresolved diverging opinions** between the audit team and the auditee;",
        after: "- j) any **disagreement between the audit team and the auditee that was left unresolved**;" },
      { before: "- k) a statement that **audits are by nature a sampling exercise**, and that as such there is a risk that the audit evidence examined is not representative.",
        after: "- k) a statement that **auditing is by its nature a sampling exercise**, and so the evidence examined carries a risk of not being representative." },
      { before: "the audit plan with its time schedule, a summary of the audit process including any obstacles encountered that can decrease the reliability of the conclusions, and confirmation that the audit objectives were achieved",
        after: "the audit plan and its schedule, an account of how the audit ran including anything that got in the way and could weaken the conclusions, and confirmation that the audit objectives were met" },
      { before: "**significant obstacles encountered during the audit and unresolved diverging opinions between the audit team and the auditee should be reported**",
        after: "**significant obstacles met during the audit should be reported, as should any disagreement left unresolved between the audit team and the auditee**" },
      { before: "the communication should be **truthful, accurate, objective, timely, clear and complete",
        after: "the communication should be **truthful, accurate, objective, prompt, clear and complete" },
      { before: "Clause 4.5 describes confidentiality as security and privacy of information. Auditors should exercise **discretion in the use and protection of information acquired in the course of their auditing activities**, audit information should not be used inappropriately for personal gain or in a manner detrimental to the legitimate interests of the auditee, and the principle includes the **proper handling of sensitive or confidential information**.",
        after: "Clause 4.5 describes confidentiality as the security and privacy of information. Auditors should use **discretion in handling and protecting what they learn while auditing**, audit information should not be turned to personal gain or used in ways that damage the auditee's legitimate interests, and the principle covers the **proper handling of sensitive or confidential material**." },
      { before: "fails clause 4.5's requirement to exercise discretion in the use and protection of information acquired during auditing",
        after: "fails clause 4.5's requirement to use discretion in handling and protecting what was learned during auditing" },
      { before: "i) asks for **a statement on the degree to which the audit criteria have been fulfilled**",
        after: "i) asks for **a statement of how far the audit criteria have been fulfilled**" },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-05-06-correction-is-not-corrective-action", address: "42001 clause 10.2; 19011 clause 6.7",
    note: "10 runs; clause 10.2's five limbs recast individually",
    en: {
      before: "states that when a nonconformity occurs, the organization shall:",
      after: "states that where a nonconformity arises, the organization shall:",
    },
    also: [
      { before: "- a) **react to the nonconformity** and, as applicable, take action to control and correct it, and deal with the consequences;",
        after: "- a) **react to the nonconformity** and, where applicable, act to control and correct it, and handle what follows;" },
      { before: "- b) **evaluate the need for action to eliminate the causes** of the nonconformity, so that it does not recur or occur elsewhere, by reviewing the nonconformity, determining its causes, and determining if similar nonconformities exist or can potentially occur;",
        after: "- b) **evaluate the need for action to remove the causes** of the nonconformity, so it neither recurs nor appears elsewhere, by reviewing it, working out its causes, and asking whether similar nonconformities exist or could arise;" },
      { before: "- c) **implement any action needed**;",
        after: "- c) **take whatever action is needed**;" },
      { before: "- d) **review the effectiveness** of any corrective action taken;",
        after: "- d) **review how effective** any corrective action was;" },
      { before: "- e) **make changes to the AI management system**, if necessary.",
        after: "- e) **change the AI management system**, if that is necessary." },
      { before: "Then: **corrective actions shall be appropriate to the effects of the nonconformities encountered.** And documented information shall be available as evidence of the nature of the nonconformities and any subsequent actions taken, and of the results of any corrective action.",
        after: "Then: **corrective action shall fit the effects of the nonconformities met.** And documented information shall be kept as evidence of what the nonconformities were and what was done afterwards, and of what any corrective action achieved." },
      { before: "corrections, corrective actions or opportunities for improvement; such actions are usually decided and undertaken by the auditee within an agreed time frame; the auditee should keep the individual managing the audit programme or the audit team informed of the status",
        after: "corrections, corrective action or chances to improve; such actions are normally settled and carried out by the auditee inside an agreed time frame; the auditee should keep whoever manages the audit programme, or the audit team, informed of where things stand" },
      { before: "the completion and effectiveness of these actions should be verified. This verification can be part of a subsequent audit",
        after: "whether those actions were completed and worked should be verified, and that verification can form part of a later audit" },
      { before: "- Clause 10.2 has five limbs, and corrective actions shall be appropriate to the effects of the nonconformities encountered.",
        after: "- Clause 10.2 has five limbs, and corrective action shall fit the effects of the nonconformities met." },
    ],
  },
  {
    cert: "AIMS-IA", slug: "aims-ia-05-07-where-the-audit-lands", address: "42001 clauses 9.3.1, 9.3.2, 9.3.3, 10.1",
    note: "11 runs; 9.3.2 d)'s three NUMBERED sub-items adjoin each other and one had to be broken",
    en: {
      before: "**top management shall review the organization's AI management system, at planned intervals, to ensure its continuing suitability, adequacy and effectiveness.**",
      after: "**top management shall review the AI management system at planned intervals, so that it stays suitable, adequate and effective.**",
    },
    also: [
      { before: "states that the management review **shall include**:",
        after: "states that the management review **shall cover**:" },
      { before: "- a) the status of **actions from previous management reviews**;",
        after: "- a) where **actions from earlier management reviews** stand;" },
      { before: "- b) **changes in external and internal issues** relevant to the AI management system;",
        after: "- b) **changes in external and internal issues** bearing on the AI management system;" },
      { before: "- c) **changes in needs and expectations of interested parties** relevant to the AIMS;",
        after: "- c) **changes in what interested parties need and expect** of the AIMS;" },
      { before: "- d) **information on AI management system performance**, including **trends in**:",
        after: "- d) **information on how the AI management system is performing**, including **trends in**:" },
      /* One of the three numbered sub-items, broken so the other two cannot
       * adjoin each other and then adjoin e). */
      { before: "  - 2) **monitoring and measurement results**;",
        after: "  - 2) **what monitoring and measurement have shown**;" },
      { before: "states that the **results of the management review shall include decisions related to continual improvement opportunities and any need for changes to the AI management system**, and that **documented information shall be available as evidence of the results of management reviews**.",
        after: "states that the **management review's results shall include decisions on opportunities for continual improvement and on any need to change the AI management system**, and that **documented information shall be kept as evidence of what management reviews produce**." },
      { before: "The clause asks for decisions related to continual improvement opportunities and any need for changes to the AIMS.",
        after: "The clause asks for decisions on opportunities for continual improvement and on any need to change the AIMS." },
      { before: "the organization shall continually improve the suitability, adequacy and effectiveness of the AI management system",
        after: "the organization shall keep improving how suitable, adequate and effective the AI management system is" },
      { before: "Clause 9.3.3 asks for decisions related to continual improvement opportunities and any need for changes - and a recorded conclusion",
        after: "Clause 9.3.3 asks for decisions on opportunities for continual improvement and on any need for change - and a recorded conclusion" },
      { before: "the results of the management review shall include decisions related to continual improvement opportunities and any need for changes to the AI management system, and discussion is not a decision",
        after: "the management review's results shall include decisions on opportunities for continual improvement and on any need to change the AI management system, and discussion is not a decision" },
      { before: "Clause 9.3.3 asks for decisions related to continual improvement opportunities and any need for changes, and a recorded conclusion either way satisfies it.",
        after: "Clause 9.3.3 asks for decisions on opportunities for continual improvement and on any need for change, and a recorded conclusion either way satisfies it." },
    ],
  },
];
