/**
 * lesson-repairs-ismsia-m5.mjs - ISMS-IA module 5, five lessons, 8 runs.
 *
 * ============ ONE ATTRIBUTION EDIT RETIRES THE THREE LARGEST RUNS =========
 *
 * 05-05 quotes the whole of clause 10.2 in blockquotes under the lead-in
 * "Short, and it does more than most people use:" -- no designation, no
 * address, so the detector measured all of it: runs of 42, 87 and 10 words.
 *
 * Adding "Clause 10.2 is" to that lead-in makes every one of those quotations
 * attributed, and therefore exempt. Three runs, 139 words, retired by four
 * words of lead-in and no change whatsoever to the quoted text.
 *
 * That single edit is the clearest illustration of what the amended position
 * actually bought. Under the old rule those three runs were 139 words of
 * rewriting on the certification's most heavily quoted lesson.
 *
 * ============ AND IT IS WHY THE SCANNER'S CANARY HAD TO MOVE FIRST =========
 *
 * This lesson WAS the positive control. `scan-iso-leaks` asserted that
 * `isms-ia-05-05-fixing-it-and-fixing-it` tripped at >=40 words, and it was the
 * only check proving the index is not empty. The edit below takes it to 10.
 *
 * The canary became three synthetic per-source literals before this file was
 * written, in that order deliberately: applying this first would have left the
 * scanner passing a control it could no longer fail, and nothing would have
 * said so.
 *
 * ============ WHAT REMAINS IS OPTIONS AND FEEDBACK ============
 *
 * Five runs in checkpoint options and explanation strings -- text a candidate
 * reads as the exam's words, not as a quotation, and which carries no
 * blockquote to attribute. Clause 9.3.3's decisions sentence appears twice and
 * uses the recast checked on AIMS-IA 05-07.
 */

export const REPAIRS = [
  {
    cert: "ISMS-IA", slug: "isms-ia-05-01-whose-scheme-is-it", address: "19011:2026 NOTE 1 to 3.8",
    note: "1 run, in an option; the blockquote above it carries \"3.8\" and is already exempt",
    en: {
      before: "When the audit criteria are legal, including statutory or regulatory, requirements.",
      after: "When the audit criteria are legal ones -- statutory or regulatory requirements.",
    },
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-05-03-the-statement-that-survives", address: "19011:2026 clause 6.5.1 j)",
    note: "1 run; the recast is AIMS-IA 05-05 j), which had to break the same adjacency",
    en: {
      before: "Unresolved diverging opinions between the audit team and the auditee should be reported.",
      after: "Any disagreement between the audit team and the auditee that was left unresolved should be reported.",
    },
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-05-04-what-the-report-must-disclose", address: "19011:2026 clause 6.5.1",
    note: "1 run; same recast as AIMS-IA 05-05",
    en: {
      before: "that the report provide a complete, accurate, concise and clear record of the audit",
      after: "that the report be a complete, accurate, concise and clear record of what was done",
    },
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-05-05-fixing-it-and-fixing-it", address: "27001:2022 clause 10.2",
    note: "ATTRIBUTION retires runs of 42w, 87w and 10w. One option line remains.",
    en: {
      before: "Short, and it does more than most people use:",
      after: "Clause 10.2 is short, and it does more than most people use:",
    },
    also: [
      { before: "3) determining if similar nonconformities exist, or could potentially occur.",
        after: "3) asking whether similar nonconformities exist, or could arise." },
    ],
  },
  {
    cert: "ISMS-IA", slug: "isms-ia-05-07-where-the-audit-lands", address: "27001:2022 clause 9.3.3",
    note: "2 runs, one in feedback and one in an option; recast as on AIMS-IA 05-07",
    en: {
      before: "requires the results to include decisions related to continual improvement opportunities and any need for changes.",
      after: "requires the results to include decisions on opportunities for continual improvement and on any need for change.",
    },
    also: [
      { before: "\"text\": \"Decisions related to continual improvement opportunities and any need for changes -",
        after: "\"text\": \"Decisions on opportunities for continual improvement and on any need for change -" },
    ],
  },
];
