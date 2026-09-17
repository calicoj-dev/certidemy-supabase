/**
 * lesson-attributions-ismsia.mjs - give the bare blockquotes their address.
 *
 * ============ WHAT THIS IS AND IS NOT ============
 *
 * These are NOT leak repairs. Not one word of quoted text changes. Each entry
 * edits a LEAD-IN so the quotation beneath it is attributed, which is what
 * IP-POSITION section 6 requires of a quotation and what a bare blockquote
 * lacks. The rule permits attributed quotation, not quotation.
 *
 * ============ NINE EDITS, NOT NINETEEN ============
 *
 * 19 blockquote lines in ISMS-IA carry ISO text with no designation or address
 * anywhere the detector looks. They sit under NINE lead-ins -- clause 9.2.2's
 * three lettered requirements share one, clause 10.2's five limbs share
 * another. Attribution attaches to the introduction, so the work is per lead-in.
 *
 * ============ EVERY ADDRESS IS ALREADY IN ITS OWN LESSON ============
 *
 * Not one clause number here was inferred from the quoted text. Each was read
 * back from a reference the lesson ITSELF makes within the preceding 25 lines,
 * measured rather than recalled:
 *
 *   02-04  ISO 19011:2026, clause 3      02-06  Clause 9.2.2 (x3)
 *   04-01  Clause 4.3                    04-05  Clause 7.5
 *   04-06  Clause 9.1                    04-07  ISO/IEC 27001:2022
 *   05-05  Clause 10.2
 *
 * WRITING A CLAUSE NUMBER I HAD NOT CONFIRMED WOULD BE THE WORSE DEFECT. A bare
 * quotation is a rule violation an auditor can see; a wrong citation is a
 * factual error in teaching material about citation, and `verify-cert`'s
 * `items.citations` checks item banks, not lesson prose, so nothing here would
 * have caught it. Where the lesson established only `clause 7.5` rather than
 * `7.5.3`, this uses `7.5` -- correct, and not a new claim.
 */

export const REPAIRS = [
  {
    cert: "ISMS-IA", slug: "isms-ia-02-04-choosing-the-method", address: "19011:2026 clause 3, virtual location",
    note: "1 bare quote; the lesson names ISO 19011:2026 and clause 3 above it",
    en: {
      before: "The second note defines what a virtual location is:",
      after: "ISO 19011:2026's second note defines what a virtual location is:",
    },
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-02-06-testing-the-programme", address: "27001:2022 clause 9.2.2",
    note: "6 bare quote lines under THREE lead-ins, all of clause 9.2.2",
    en: {
      before: "The second subclause governs the programme itself:",
      after: "Clause 9.2.2, the second subclause, governs the programme itself:",
    },
    also: [
      { before: "Then the sentence from lesson 02-01, and three lettered requirements:",
        after: "Then the sentence from lesson 02-01, and clause 9.2.2's three lettered requirements:" },
      { before: "**And the closing requirement:**",
        after: "**And clause 9.2.2's closing requirement:**" },
    ],
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-04-01-what-the-scope-left-out", address: "27001:2022 clause 4.3",
    note: "2 bare quote lines; the concept block above reads \"Clause 4.3 names three inputs\"",
    en: {
      before: "It is a determination the standard requires to be made from stated inputs:",
      after: "It is a determination clause 4.3 requires to be made from stated inputs:",
    },
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-04-05-competence-awareness-documents", address: "27001:2022 clause 7.5",
    note: "1 bare quote; the lesson establishes clause 7.5 above it",
    en: {
      before: "**And one sentence people skip:**",
      after: "**And one sentence of clause 7.5 people skip:**",
    },
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-04-06-defined-versus-running", address: "27001:2022 clause 9.1",
    note: "2 bare quote lines; the lesson names clause 9.1 above them",
    en: {
      before: "**Two more sentences close the clause:**",
      after: "**Two more sentences close clause 9.1:**",
    },
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-04-07-two-sentences", address: "27001:2022, the climate-change additions",
    note: "2 bare quote lines; the lesson names ISO/IEC 27001:2022 twice above them but no clause, so the designation is what is added",
    en: {
      before: "Its normative body, in full:",
      after: "Its normative body, in full, as ISO/IEC 27001:2022 now carries it:",
    },
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-05-05-fixing-it-and-fixing-it", address: "27001:2022 clause 10.2",
    note: "5 bare quote lines, all clause 10.2's limbs, under one lead-in",
    en: {
      before: "Short, and it does more than most people use:",
      after: "Clause 10.2 is short, and it does more than most people use:",
    },
  },
];
