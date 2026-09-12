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
where the tooling can see it.

FALSE FRIENDS AND REGISTER. These are not retired terms - they are correct words
that carry the WRONG SENSE here, and every one below was caught by a bilingual
reviewer rather than by any check. A translation can be grammatical, natural, and
still be answering a different question.

  THROUGHPUT is not RENDIMIENTO. In es-419 rendimiento reads as PERFORMANCE -
  how well the thing works - which is the OTHER HALF of the pair the task exists
  to separate: throughput up, usability down. Collapsing them makes the item
  unanswerable. Keep THROUGHPUT in English, as the Portuguese already does, or
  use volumen de entrega / ritmo de entrega. Never rendimiento, never desempeno.

  SUBMITTED is not ENTREGADO. The English means submitted INTO THE INCREMENT -
  a Developer put work in. entrego is heard as delivered or released, which is a
  later and different event. Use sometio / submeteu. pt-BR already does.

  PERFORMING SCRUM is loaded and the translation should keep the load. A team
  PERFORMING Scrum passes every formal inspection and still fails - that is the
  whole subject of D2. practica / pratica is accurate and weaker: it says the
  team does Scrum, not that it does Scrum correctly and fails anyway. Prefer a
  verb that keeps the irony.

  ENGAGEMENT is not COMPROMISO, and this is the dangerous one. compromiso is the
  CORRECT es-419 rendering of Scrum's COMMITMENT: the Product Goal, the Sprint
  Goal and the Definition of Done are the three artifact commitments. Using it
  for "engagement" does not merely pick a weak word - IT SPENDS A TERM THIS
  CREDENTIAL TESTS BY NAME. Measured on SM-AI-II, 2026-09-11: eleven tasks
  across D1, D2, D4 and D5 turn on an artifact commitment, so a candidate
  meeting "pierde el compromiso del Product Owner" in D3 has a real ambiguity
  and not a stylistic one. Use participacion / involucramiento, or leave
  ENGAGEMENT in English. pt-BR's engajamento is right and stays.

THE PATTERN IN ALL FOUR: the English word was chosen to carry a distinction, and
the natural translation drops it. When a term appears in a task STATEMENT it is
usually load-bearing - check the concept slugs beside it before choosing a
synonym.

ATTACHMENT - WHAT THE PREPOSITION ATTACHES TO. Not a false friend. A structural
choice that silently moves the SUBJECT of the task while every individual word
stays correct.

  AN IMPROVEMENT IDENTIFIED AT THE RETROSPECTIVE IS NOT AN IMPROVEMENT OF THE
  RETROSPECTIVE. "mejora de la Sprint Retrospective" / "melhoria da Sprint
  Retrospective" reads as improving the EVENT. Task 1.9 is about an improvement
  the team identified there which would require omitting a Scrum element: the
  Retrospective is WHERE IT CAME FROM, not what it changes. Use "una mejora
  identificada en la Sprint Retrospective" / "uma melhoria identificada na
  Sprint Retrospective".

  THIS ONE FAILED IN BOTH LANGUAGES IDENTICALLY, which is why it is a contract
  entry and not just a correction. A defect that reproduces across two
  independent translations is not a slip - it is the shortest natural rendering
  beating the accurate one, and it will recur wherever an English noun phrase
  attaches a SOURCE to an object and the target language's default reading is
  possession.`;


/**
 * ISO management-system vocabulary, for the ISO-family certifications.
 * MEASURED FROM THE CATALOGUE, NOT AUTHORED.
 */
export const ISO_MS_VOCABULARY = `ISO MANAGEMENT-SYSTEM VOCABULARY - THIS IS AN EXISTING CONVENTION, NOT A NEW RULE.

Every rendering below was MEASURED across the three ISO certifications already
translated in this catalogue - ISMS-F, ISMS-IA and AIMS-F - over 111 lesson
groups on 2026-09-12. The count after each line is how many of those lesson
groups use it. They are here so you match the catalogue a candidate is already
reading, not so you pick the most natural phrase in isolation.

  ENGLISH                     es-419                        pt-BR                         seen
  Statement of Applicability  Declaracion de Aplicabilidad  Declaracao de Aplicabilidade  43 / 44
  Annex A                     Anexo A                       Anexo A                       62 / 63
  management system           sistema de gestion            sistema de gestao             59 / 58
  nonconformity               no conformidad                nao conformidade              47 / 49
  documented information      informacion documentada       informacao documentada        44 / 44
  internal audit              auditoria interna             auditoria interna             41 / 39
  interested parties          partes interesadas            partes interessadas           39 / 39
  management review           revision por la direccion     analise critica pela direcao  31 / 28
  risk treatment              tratamiento del riesgo        tratamento do risco           30 / 28
  top management              alta direccion                alta direcao                  27 / 28
  corrective action           accion correctiva             acao corretiva                22 / 23
  continual improvement       mejora continua               melhoria continua              7 / 7

TWO OF THESE WERE NOT UNANIMOUS, AND THE REASONING IS RECORDED SO IT IS NOT
RE-LITIGATED:

  nonconformity -> no conformidad, NOT incumplimiento. incumplimiento appears
  12 times and is the ordinary Spanish for non-compliance - breaking a rule.
  The ISO term is a DEFINED one: a failure to meet a requirement, which is the
  thing an auditor raises and tracks to closure. Keep incumplimiento for
  ordinary prose about breaking rules; never for the defined term.

  documented information -> informacion documentada, NOT documentacion.
  documentacion appears 33 times as the ordinary word for documentation. The
  ISO term covers the information AND its medium, and clause 7.5 is about
  exactly that distinction. A lesson that collapses them loses the clause.

ROLES - PIN. es-419 roles. pt-BR papeis.

  In the ISO clause 5.3 sense - organizational roles, responsibilities and
  authorities - pt-BR is papeis, following ABNT and the harmonized Annex SL
  heading. The catalogue currently DISAGREES WITH ITSELF here and is close to
  evenly split (funcoes 24 lesson groups, papeis 23), so this pins it going
  forward rather than describing what is there.

  DO NOT collapse it with FUNCTION. An AI governance function, an audit
  function, an organizational function is a funcion / funcao - a part of the
  organization, not a role a person holds. Both words are correct; they are
  correct for different things, which is why both appear and why counting them
  together says nothing.

CLAUSE - NEVER "clausula". This rule is here because it was VIOLATED.

  ENGLISH                       es-419                          pt-BR
  Clause 6 (top-level)          capitulo 6                      Secao 6
  clause 6.1.3 (numbered sub)   apartado 6.1.3                  Secao 6.1.3
  clause by clause              apartado por apartado           Secao por Secao
  the clause cited              el apartado citado              a Secao citada

  "clausula" reads as a CONTRACTUAL clause - a term in an agreement - and an ISO
  division is not one. This applies whether or not a number follows: "clausula
  por clausula" and "la clausula citada" are as wrong as "clausula 6.1.3".

  THE ONE EXCEPTION is the grammatical sense. "The causal clause" - a clause of
  a SENTENCE - is "la clausula causal" and is correct. The test is what the
  clause belongs to: a standard, or a sentence.

  EVIDENCE, AND THE REASON THIS MOVED HERE. The rule existed, as one bullet in
  translate-lessons.mjs's prose prompt, and across 40 AIMS-IA lessons it was
  ignored six times in two es-419 files (clausula 3.5, 3.11, 3.15, 3.16, 3.17)
  while the twelve terms in the table above were honoured 374 times out of 374
  in the same run. gen-module-translations.mjs never had the rule AT ALL, and
  its first AIMS-IA dry run produced "clausula por clausula" and "la clausula
  citada" - caught in the dry run, before any write.`;

/**
 * Which vocabulary contract a certification takes.
 *
 * NOT a guess from the code prefix: an explicit map, because the cost of a wrong
 * answer is a translator told to avoid Scrum terms in an ISO lesson or the
 * reverse. Anything unlisted gets "general" - NO framework contract at all -
 * which is the safe default: a missing contract produces a plain translation, a
 * wrong one produces a confidently mis-termed one.
 */
export const CERT_DOMAIN = {
  "SM-AI-I": "scrum", "SM-AI-II": "scrum", "SPO-AI-I": "scrum", "SD-AI-I": "scrum",
  "AIMS-F": "iso", "AIMS-IA": "iso", "ISMS-F": "iso", "ISMS-IA": "iso",
};

export function domainForCert(code) {
  return CERT_DOMAIN[String(code || "").trim().toUpperCase()] ?? "general";
}

/** The framing noun and vocabulary block for a domain. */
export function contractForDomain(domain) {
  if (domain === "scrum") return { subject: "Scrum certification content", vocabulary: RETIRED_VOCABULARY };
  if (domain === "iso") return { subject: "ISO management-system certification content", vocabulary: ISO_MS_VOCABULARY };
  return { subject: "professional certification content", vocabulary: "" };
}

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
// THE LOOKBEHIND IS LOAD-BEARING. `\b` does not stop `equipo de desarrollo`
// matching inside `sub-equipo de desarrollo`, because a hyphen is a word
// boundary - and SPO-AI-I task 2.2 is a scenario about a company splitting a
// Scrum Team into a "sub-equipo de pruebas" and a "sub-equipo de desarrollo",
// where the sub-team IS THE MISCONCEPTION UNDER TEST. Three item rows and one
// explanation matched on that, and a sweep would have produced "sub-Developers".
//
// Found 2026-09-12 by reading the nine stem hits before sweeping them, which is
// the only reason it was found: the count looked like content debt and was a
// pattern defect. Same shape as `role` matching "an unfilled role" - a term is
// not a claim, and a boundary is not a meaning.
// EVERY LANGUAGE ALSO CARRIES THE ENGLISH FORMS, and that is not belt-and-braces.
//
// The per-language patterns originally assumed a retired term would appear in
// that language's own words. A translator can simply LEAVE THE ENGLISH IN PLACE,
// and on SPO-AI-I it did: four secure rows in es-419 and pt-BR read "el
// Development Team insiste en reordenar" and "o Development Team insiste em
// reordenar". The Spanish pattern looked only for `equipo de desarrollo`, so an
// untranslated English retired term inside a Spanish row was INVISIBLE.
//
// That produced a false all-clear on 2026-09-12: the sweep reported SPO-AI-I's
// secure bank at zero affected while four rows still carried the term. Found by
// a census query that used one pattern across all languages rather than the
// per-language ones - i.e. by measuring a second way, not by the check.
const EN_FORMS = String.raw`self-organiz\w*|(?<![\w-])development team\b`;
export const RETIRED_HARD = {
  en: new RegExp(EN_FORMS, "i"),
  "es-419": new RegExp(String.raw`autoorganiz\w*|auto-organiz\w*|(?<![\w-])equipo de desarrollo\b|` + EN_FORMS, "i"),
  "pt-BR": new RegExp(String.raw`auto-?organiz\w*|(?<![\w-])(time|equipe) de desenvolvimento\b|` + EN_FORMS, "i"),
};

// SOFT = ordinary language as often as the retired term. WARN and READ; never
// gate on it. The ceremony family earned that treatment across 792 items. ROLE
// earned it on 2026-09-11 across SM-AI-II's lesson prose, where SEVEN hits were
// SIX ordinary uses - "an unfilled role", "no role in anyone's employment", "it
// supplies no interim role" - and ONE retired one: a checkpoint option calling
// Scrum Master and Product Owner "the two roles", where the 2020 Guide says
// accountabilities. A hard pattern on `role` would fail correct content six
// times out of seven, which is how a checker teaches people to skim it.
export const RETIRED_SOFT = {
  en: /\bceremon(y|ies)\b|\broles?\b/i,
  "es-419": /\bceremonias?\b|\broles?\b/i,
  "pt-BR": /\bcerim[oô]nias?\b|\bpap[eé](l|is)\b/i,
};

/** Back-compat for any caller wanting both. Prefer the split above. */
export const RETIRED_PATTERNS = RETIRED_HARD;
