/**
 * lesson-repairs-aimsia-m4a-fix.mjs - one correction to my own repair.
 *
 * ============ `should` AS INVERSION IS NOT A MODAL ============
 *
 * 04-04's clause 6.1.2 d) recast ended "...**for societies** should an
 * identified risk come about". That `should` is a CONDITIONAL CONJUNCTION -- it
 * means "if", not "ought" -- and both Portuguese and Spanish render it with
 * `caso`, correctly carrying no modal at all.
 *
 * The obligation guard cannot tell the two apart, and neither can the
 * modal-inflation check, which would later read the English as weak-modal and
 * ask why the translation is not. It refused a faithful translation twice.
 *
 * TEACHING THE GUARD THIS DISTINCTION IS THE WRONG FIX. Separating conditional
 * inversion from deontic `should` is a parsing problem, and the guard's value
 * is that it is a word list anyone can read. The English is mine, not ISO's, so
 * the cheap and honest move is to write `if ... came about` and leave the guard
 * blunt.
 *
 * Applied as its own batch because m4a's own `before` strings are the ISO
 * originals, which are no longer in the content -- regenerating that file after
 * it has landed would find nothing to match.
 */

export const REPAIRS = [
  {
    cert: "AIMS-IA", slug: "aims-ia-04-04-criteria-before-assessment", address: "42001 clause 6.1.2 d) 1)",
    note: "corrects a conditional `should` introduced by the module 4a repair",
    en: {
      /* `what would follow ... should X come about` -> `what might follow ... if
       * X came about`. The guard refuses a bare `should` -> `if` as a dropped
       * modal, and it is RIGHT to: it cannot see that this `should` was a
       * conjunction. Rather than override it, the sentence is given a real weak
       * modal -- `might`, which is also the more accurate word for a potential
       * consequence -- so both sides carry one and the guard agrees honestly. */
      before: "weigh what would follow **for the organization, for individuals and for societies** should an identified risk come about",
      after: "weigh what might follow **for the organization, for individuals and for societies** if an identified risk came about",
    },
  },
];
