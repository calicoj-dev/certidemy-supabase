/**
 * item-translation.mjs - the translation contract, shared by both generators.
 *
 * WHY THIS EXISTS
 * ---------------
 * `gen-cert-secure.mjs` and `backfill-practice.mjs` each carried their own SCRUM_NOUNS
 * array and their own translateSystem(), byte-identical apart from the words "exam" and
 * "practice". CLAUDE.md's rule applies exactly: a pair inside ONE repo does not have to
 * stay a pair, and the fix belongs in one place rather than being applied twice.
 *
 * THE DEFECT THAT PROMPTED IT, MEASURED 2026-09-11
 * ------------------------------------------------
 * SM-AI-II's English secure bank was clean of prior-edition vocabulary after one fix.
 * Its Spanish was not, and the English was not the source:
 *
 *   EN  "the Scrum Team is self-managing"      ES  "el Scrum Team es autoorganizado"
 *   EN  "too new to self-manage effectively"   ES  "demasiado nuevo para autoorganizarse"
 *   EN  "the self-managing nature"             ES  "la naturaleza autoorganizada"
 *
 * THE GENERATOR WAS RIGHT AND THE TRANSLATOR WAS WRONG. The draft prompt carries
 * SCRUM_GUIDE_FACTS with its 35 never-assert entries; the translation prompt carried
 * none of it. It pinned proper nouns and said nothing about the vocabulary the 2020
 * edition changed, so a term the English had got right was reintroduced downstream.
 *
 * IT IS WORSE THAN THE ENGLISH LEAK WAS, because nothing could see it. verify-cert's
 * items.vocabulary check read the English pattern only, so it reported a bank clean
 * while a third of its rows carried the retired term.
 *
 * SCOPE OF THE PROBLEM, counted across every Scrum bank on 2026-09-11 (option text only,
 * so these are lower bounds):
 *
 *            secure es-419                     secure pt-BR
 *   SM-AI-I   11 self-organiz, 10 ceremonia    7 self-organiz, 10 cerimonia
 *   SPO-AI-I   5 self-organiz, 17 equipo de desarrollo   3 / 18 time de desenvolvimento
 *   SD-AI-I    0 / 5 ceremonia                 0 / 5
 *
 * SPO-AI-I's 17 and 18 are the sharpest: "Development Team" was REMOVED by the 2020
 * edition, not renamed, and `Developers` was never in SCRUM_NOUNS - so the translator
 * had no instruction to keep it and rendered it as the 2017 term.
 *
 * ON THE PRESCRIBED REPLACEMENTS
 * ------------------------------
 * This repository does not hold the Spanish or Portuguese editions of the Scrum Guide,
 * so nothing here claims to quote them. The forms prescribed below are the ones OUR OWN
 * banks already use correctly in the majority of cases - autogestion, autogestionado,
 * autogerenciado, autogestao - which is evidence from the corpus rather than a claim
 * about an official translation. The FORBIDDEN forms are the pre-2020 English terms'
 * direct renderings, and those are established: the 2020 edition dropped
 * self-organizing, dropped Development Team, and never used ceremony.
 */

/**
 * Terms that stay in English. Developers and Scrum Team were MISSING and are the two
 * the 2020 edition changed most consequentially - the first replaced Development Team,
 * the second is what self-management was moved to.
 */
export const SCRUM_NOUNS = [
  "Sprint", "Scrum Master", "Product Owner", "Developers", "Scrum Team",
  "Daily Scrum", "Definition of Done", "Sprint Backlog", "Sprint Goal",
  "Product Backlog", "Product Goal", "Increment", "Sprint Review",
  "Sprint Retrospective", "Sprint Planning", "INVEST",
];

/**
 * The vocabulary the 2020 edition changed, stated as a prohibition plus a replacement.
 * Interpolated into the translation prompt for Spanish and Portuguese.
 */
export const RETIRED_VOCABULARY = `2020 VOCABULARY - THIS IS A CORRECTNESS RULE, NOT A STYLE PREFERENCE.
The 2020 Scrum Guide retired several terms. A translation that reintroduces one is
wrong even when the English it came from was right, and it is wrong in a way no
English-language check can see. NEVER produce any of these:

  SPANISH
    autoorganizado / autoorganizacion / autoorganizarse   -> autogestionado /
        autogestion / autogestionarse. The property belongs to the Scrum Team.
    ceremonia / ceremonias                                 -> evento / eventos
    equipo de desarrollo                                   -> Developers, in English
    roles (for the three Scrum accountabilities)           -> responsabilidades

  PORTUGUESE
    auto-organizado / auto-organizacao                     -> autogerenciado /
        autogestao
    cerimonia / cerimonias                                 -> evento / eventos
    time de desenvolvimento / equipe de desenvolvimento    -> Developers, in English
    papeis (for the three Scrum accountabilities)          -> responsabilidades

If the ENGLISH source itself uses a retired term, translate it faithfully anyway and
do not silently correct it - a mismatch between the languages is worse than a
faithful translation of a defect, because the defect is then findable in English
where the tooling can see it.`;

/**
 * The translation system prompt. `kind` is "secure" | "practice" and changes one word.
 */
export function translateSystem(langName, kind = "practice") {
  const what = kind === "secure" ? "certification exam questions" : "certification practice questions";
  return `You translate ${what} from English to ${langName}.
Return a JSON array of the SAME length and order as the input. For each item return
an object: {"question_text":string,"options":[{"id":string,"text":string}],"explanation":string}.

Rules:
  - Translate question_text, every option's text, and explanation into ${langName}.
  - Keep each option's "id" EXACTLY as given (do not renumber or reorder).
  - Keep these Scrum proper nouns in English, untranslated: ${SCRUM_NOUNS.join(", ")}.
  - Do NOT add, drop, or merge options. Do NOT include correct_answer, difficulty,
    or question_type.
  - Output strict JSON only, NO prose, NO markdown fences.

${RETIRED_VOCABULARY}`;
}

/**
 * The retired forms, for checkers. HARD and SOFT are separated because they are not
 * equally safe to act on, and the split is measured rather than assumed.
 *
 * HARD has no innocent sense in a Scrum item. The 2020 edition dropped self-organizing
 * and removed Development Team outright, so any appearance is the retired term. These
 * are safe to FAIL a bank on and safe to select rows for automatic re-translation.
 *
 * SOFT is ordinary language as often as it is the retired term. Measured across 792
 * SM-AI-II items: "a commitment ceremony" in reported speech, "an approval ceremony",
 * "a retirement ceremony", "ceremonial compliance". A gate that failed on these would
 * fail correct items, and a re-translator that rewrote them would rewrite correct rows.
 * WARN, and read the hits.
 */
export const RETIRED_HARD = {
  en: /self-organiz\w*|\bdevelopment team\b/i,
  "es-419": /autoorganiz\w*|auto-organiz\w*|\bequipo de desarrollo\b/i,
  "pt-BR": /auto-?organiz\w*|\b(time|equipe) de desenvolvimento\b/i,
};

export const RETIRED_SOFT = {
  en: /\bceremon(y|ies)\b/i,
  "es-419": /\bceremonias?\b/i,
  "pt-BR": /\bcerim[oô]nias?\b/i,
};

/** Back-compat for any caller wanting both. Prefer the split above. */
export const RETIRED_PATTERNS = RETIRED_HARD;
