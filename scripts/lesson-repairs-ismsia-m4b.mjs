/**
 * lesson-repairs-ismsia-m4b.mjs - ISMS-IA module 4, all of it except 04-06.
 *
 * 13 runs across five lessons: 04-04, 04-05, 04-07, 04-08, 04-10. 04-06 has
 * fourteen runs on its own and goes out as 4c.
 *
 * Two attribution edits here -- 04-05's clause 7.5 sentence and 04-07's climate
 * additions -- and the rest is prose or option text.
 *
 * ============ 04-04 NEEDED THE HEAD AND THE FIRST BULLET BOTH ============
 *
 * Clause 6.1.3 d)'s lead-in and its first bullet form one 17-word run, and
 * recasting only the lead-in left "the necessary controls, see 6.1.3 b) and c)"
 * standing at exactly ten. The pattern by now is familiar: a run that crosses a
 * boundary needs every line it touches, and the residue after a partial fix is
 * usually just over the threshold rather than comfortably under it.
 *
 * ============ 04-07's SENTENCE IS QUOTED AND ALSO ASSERTED ============
 *
 * "The organization shall determine whether climate change is a relevant issue"
 * appears twice: inside the blockquote, where attribution now exempts it, and
 * again in bold as the lesson's own assertion. The second is not a quotation by
 * any reading, so it is recast -- the same split AIMS-IA 04-11 needed.
 */

export const REPAIRS = [
  {
    cert: "ISMS-IA", slug: "isms-ia-04-04-tracing-the-soa-back", address: "27001:2022 clause 6.1.3 d)",
    note: "5 runs across the SoA element list; the lead-in and its first bullet are one run",
    en: {
      before: "Clause 6.1.3 d) requires the organization to produce a Statement of Applicability that contains:",
      after: "Clause 6.1.3 d) requires a Statement of Applicability holding:",
    },
    also: [
      { before: "- **the necessary controls** (see 6.1.3 b) and c))",
        after: "- **the controls determined necessary** (6.1.3 b) and c))" },
      { before: "- **justification for their inclusion**",
        after: "- **why each is included**" },
      { before: "- **whether the necessary controls are implemented or not**",
        after: "- **whether each necessary control is implemented**" },
      { before: "- **the justification for excluding any of the Annex A controls**",
        after: "- **why any Annex A control is excluded**" },
      { before: "*The necessary controls, see 6.1.3 b) and c)*",
        after: "*The controls determined necessary, 6.1.3 b) and c)*" },
      { before: "requires the SoA to contain the justification for excluding any of the Annex A controls, and that element is absent.",
        after: "requires the SoA to say why any Annex A control is excluded, and that element is absent." },
    ],
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-04-05-competence-awareness-documents", address: "27001:2022 clauses 7.2, 7.3, 7.5",
    note: "ATTRIBUTION for the 7.5 sentence; clause 7.2 b) c) and clause 7.3 recast, as on AIMS-IA 04-13",
    en: {
      before: "**And one sentence people skip:**",
      after: "**And one sentence of clause 7.5 people skip:**",
    },
    also: [
      { before: "- b) **ensure these persons are competent** on the basis of appropriate education, training, or experience",
        after: "- b) **ensure those people are competent**, on the strength of suitable education, training or experience" },
      { before: "- c) where applicable, **take actions to acquire** the necessary competence, **and evaluate the effectiveness** of the actions taken",
        after: "- c) where applicable, **act to acquire the competence needed, and evaluate how well those actions worked**" },
      { before: "**c) has a second half people miss: evaluate the effectiveness of the actions taken.**",
        after: "**c) has a second half people miss: evaluating how well those actions worked.**" },
      { before: "Clause 7.3 requires that **persons doing work under the organization's control** shall be aware of:",
        /* "...control shall be aware of" adjoins bullet a) "the information
       * security policy" for fourteen words. Adding "the following" before the
       * colon breaks it at nine and keeps `shall` -- dropping the modal to break
       * the adjacency would have traded a leak for an obligation defect, which
       * the guard would then have refused. */
      after: "Clause 7.3 requires that **anyone working under the organization's control** shall be aware of the following:" },
      { before: "- b) their **contribution to the effectiveness** of the ISMS, including the benefits of improved information security performance",
        after: "- b) how they **contribute to the ISMS's effectiveness**, including the benefits of better information security performance" },
      { before: "*Persons doing work under the organization's control* is wider than employees.",
        after: "*Anyone working under the organization's control* is wider than employees." },
    ],
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-04-07-two-sentences", address: "27001:2022, the climate-change additions to 4.1 and 4.2",
    note: "ATTRIBUTION exempts both quoted sentences; the bold restatement is recast",
    en: {
      before: "Its normative body, in full:",
      after: "Its normative body, in full, as ISO/IEC 27001:2022 now carries it:",
    },
    also: [
      { before: "**The organization shall determine whether climate change is a relevant issue.**",
        after: "**The organization shall determine whether climate change is, for it, a relevant issue.**" },
    ],
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-04-08-assets-nobody-registered", address: "27001:2022 Annex A control 5.9",
    note: "1 run, in the summary",
    en: {
      before: "- Annex A 5.9 requires an inventory of information and other associated assets, including owners.",
      after: "- Annex A 5.9 requires an inventory of information and associated assets, with their owners.",
    },
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-04-10-one-word-apart", address: "42001:2023 clause 9.2.2 a)",
    note: "1 run, in an option; same recast as 02-03 and AIMS-IA 02-05",
    en: {
      before: "The organization must define the audit objectives, criteria and scope for each audit.",
      after: "The organization must set the objectives, criteria and scope of each individual audit.",
    },
  },
];
