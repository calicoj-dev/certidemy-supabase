/**
 * lesson-repairs-ismsia-m4c.mjs - ISMS-IA 04-06, the last lesson.
 *
 * 14 runs in one lesson -- clauses 8.1, 8.2 and 9.1 side by side, which is what
 * "defined versus running" is about. One attribution edit, thirteen recasts.
 *
 * ============ CLAUSE 8.2's TRIGGER APPEARS FOUR TIMES ============
 *
 * In the comparison table, in the prose that presses on it, in a checkpoint's
 * feedback and in an option. The lesson's whole point is that the trigger has
 * TWO limbs and annual scheduling discharges only one, so every one of the four
 * has to keep both limbs while losing ISO's wording. All four take the recast
 * used on AIMS-IA 04-08 and 05-06: "at planned intervals, and whenever
 * significant change is proposed or happens".
 *
 * ============ AN INLINE ITALIC QUOTATION IS STILL MEASURED ============
 *
 * "**And note the confidence standard for documentation:** *to the extent
 * necessary to have confidence the processes have been carried out as
 * planned.*" is a quotation, in italics, with clause 8.1 named two lines above.
 * It is not a blockquote, and the exemption is blockquote-scoped, so it is
 * recast -- the same call made on 02-01 and recorded there.
 *
 * ============ CLAUSE 9.1's SIX LETTERED ITEMS ADJOIN IN TWO PLACES ==========
 *
 * a)+b) are one 30-word run and c)-f) another 19. FIVE of the six are recast
 * and d) stays: once c), e) and f) break the chain, "who shall monitor and
 * measure" stands alone at five words.
 *
 * f) was going to stay too. The first attempt broke the c)-f) chain by dropping
 * `shall` from c) and e), which the guard refused -- clause 9.1 is a list of
 * requirements and a paraphrase that loses the modal is worse than the
 * quotation. Keeping both `shall`s put "shall be analysed and evaluated f) who
 * shall analyse and evaluate these results" back at thirteen words, so f) had
 * to move after all: "who shall do that analysis and evaluation" breaks it at
 * eight and keeps its own modal.
 *
 * AND THEN THE TWO CLAUSE 8.1 BULLETS I HAD ALREADY RECAST STILL ADJOINED.
 * "...ran as planned" running into "The organization shall control planned
 * changes and review" is ten ISO words across the junction, both halves of it
 * already rewritten. Ending the first "ran the way they were planned to" breaks
 * it at eight. Rewriting both sides of a boundary is not the same as breaking
 * the boundary.
 */

export const REPAIRS = [
  {
    cert: "ISMS-IA", slug: "isms-ia-04-06-defined-versus-running", address: "27001:2022 clauses 8.1, 8.2, 9.1",
    note: "ATTRIBUTION for the two clause 9.1 closing sentences; 13 prose recasts",
    en: {
      before: "**Two more sentences close the clause:**",
      after: "**Two more sentences close clause 9.1:**",
    },
    also: [
      /* Clause 8.2's two-limbed trigger, all four appearances. */
      { before: "| 6.1.2 - define and apply a risk assessment process | **8.2** - perform assessments at planned intervals or when significant changes are proposed or occur |",
        after: "| 6.1.2 - define and apply a risk assessment process | **8.2** - perform assessments at planned intervals, and whenever significant change is proposed or happens |" },
      { before: "at planned intervals **or when significant changes are proposed or occur**. Two triggers.",
        after: "at planned intervals **and whenever significant change is proposed or happens**. Two triggers." },
      { before: "Clause 8.2 requires risk assessments at planned intervals OR when significant changes are proposed or occur.",
        after: "Clause 8.2 requires risk assessments at planned intervals, AND whenever significant change is proposed or happens." },
      { before: "Assessments at planned intervals or when significant changes are proposed or occur; the migration",
        after: "Assessments at planned intervals, and whenever significant change is proposed or happens; the migration" },
      /* Clause 8.1. */
      { before: "Clause 8.1 requires the organization to plan, implement and control the processes needed to meet requirements and implement the clause 6 actions, by:",
        after: "Clause 8.1 requires the organization to plan, run and control the processes it needs in order to meet requirements and carry out the clause 6 actions, by:" },
      { before: "- **establishing criteria for the processes**",
        after: "- **setting criteria for those processes**" },
      { before: "- **implementing control of the processes in accordance with the criteria**",
        after: "- **controlling the processes against those criteria**" },
      { before: "- **Documented information shall be available** to the extent necessary to have confidence the processes have been carried out as planned.",
        after: "- **Documented information shall be kept** so far as is needed to give confidence that the processes ran the way they were planned to." },
      { before: "- The organization shall **control planned changes and review the consequences of unintended changes**, taking action to mitigate adverse effects as necessary.",
        after: "- The organization shall **control planned changes and review what unintended changes bring about**, acting to soften adverse effects as needed." },
      { before: "- The organization shall ensure that **externally provided processes, products or services** relevant to the ISMS **are controlled.**",
        after: "- The organization shall see that **externally provided processes, products or services** bearing on the ISMS **are controlled.**" },
      { before: "**And note the confidence standard for documentation:** *to the extent necessary to have confidence the processes have been carried out as planned.*",
        after: "**And note the confidence standard for documentation:** *so far as is needed to give confidence that the processes ran as planned.*" },
      /* Clause 9.1 a), b), c), e). d) and f) stay. */
      { before: "- a) **what needs to be monitored and measured**, including information security processes and controls",
        after: "- a) **what is to be monitored and measured**, information security processes and controls included" },
      { before: "- b) the **methods** for monitoring, measurement, analysis and evaluation, as applicable, to ensure valid results",
        after: "- b) the **methods** used to monitor, measure, analyse and evaluate, as applicable, so results are valid" },
      { before: "- c) **when** the monitoring and measuring shall be performed",
        after: "- c) **when** monitoring and measuring shall be done" },
      { before: "- e) **when** the results shall be analysed and evaluated",
        after: "- e) **when** those results shall be analysed and evaluated" },
      /* f) HAD TO MOVE AFTER ALL. Keeping `shall` in c) and e) -- which the
       * guard rightly demanded, since clause 9.1 is a list of requirements --
       * left "shall be analysed and evaluated f) who shall analyse and evaluate
       * these results" adjoining for thirteen words. Recasting f) to "who shall
       * do that analysis and evaluation" breaks it at eight AND keeps its own
       * `shall`. The first attempt dropped the modal from c) and e) to break the
       * leak, which is the trade the guard exists to refuse. */
      /* Note b)'s validity standard, stated twice. */
      { before: "Note b)'s standard: methods should produce **comparable and reproducible results** to be considered valid.",
        after: "Note b)'s standard: methods should give **comparable and reproducible results** if they are to count as valid." },
      { before: "- Methods must produce comparable and reproducible results to be considered valid.",
        after: "- Methods must give comparable and reproducible results if they are to count as valid." },
      { before: "- f) **who shall analyse and evaluate** these results",
        after: "- f) **who shall do that analysis and evaluation**" },
    ],
  },
];
