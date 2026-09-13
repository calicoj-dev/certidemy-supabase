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

ARTICLE GENDER ON THE FROZEN ENGLISH NOUNS, BOTH LANGUAGES. The nouns stay in
English, but the article in front of them is a choice, and the catalogue has
already made it. Measured 2026-09-12 across lessons and module headings:

    es-419   el Daily Scrum      33 uses      la Daily Scrum      0
    pt-BR    o Daily Scrum       26 uses      a Daily Scrum       0

    Masculine in both: el/o Sprint Backlog, Product Backlog, Sprint Goal,
    Product Goal, Increment, Scrum Team, Sprint Planning.
    Feminine in both: la/a Sprint Review, Sprint Retrospective - they are
    reuniones / reunioes.

  Pinned because one repair returned "a Daily Scrum" AND "la Daily Scrum", each
  of which would have been the only instance of its form in the corpus. A frozen
  noun with a wandering article is still an inconsistency: freezing the noun does
  not freeze the sentence around it.

  THIS PIN WAS IGNORED TWICE WHERE IT SITS. Two dry runs after it was added
  returned the feminine form again, and both rows were corrected
  deterministically instead. It is 14% of the way through a 7,600-character
  block, which is a long way from the generation - the same recency problem as
  the target-language instruction. Treat article gender as something to ASSERT
  AFTER generation, not something to ask for. Do not assume this paragraph is
  doing the work.

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

  PLAN is not PRONOSTICO / PREVISAO, and this one is a RETIRED CONCEPT wearing a
  false friend's clothes. The 2017 Guide called the Sprint Backlog a forecast.
  The 2020 Guide replaced that with PLAN: "The Sprint Backlog is a plan by and
  for the Developers." So rendering plan as pronostico / previsao does not merely
  pick a weaker word - it restores the term the edition retired, through a word
  no retired-vocabulary pattern looks for, because the retired term is in the
  TARGET language and the English is clean.

  Caught 2026-09-12 on SD-AI-I task 2.3, which had sat unreviewed since
  2026-07-22: EN "Own and maintain the Sprint Backlog as a living plan",
  es-419 "como un pronostico vivo", pt-BR "como uma previsao viva". The JTA task
  statement - the authoritative competence claim - was on the 2020 word and both
  translations were not.

  Use plan / plano. Never pronostico, never previsao, for the Sprint Backlog.
  FORECAST as an ordinary English verb elsewhere ("items they forecast they can
  complete") is fine and is not this.

THE PATTERN IN ALL FIVE: the English word was chosen to carry a distinction, and
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

FOUR PINS ADDED 2026-09-13 AFTER A BILINGUAL REVIEW OF 28 REWRITTEN ITEM ROWS.
Each was a real divergence in the packet, not a hypothetical. THIS BLOCK BREAKS
THE FILE'S ASCII HABIT ON PURPOSE - three of the four are about ORTHOGRAPHY, and
a pin that cannot show the glyph it is pinning is not a pin.

  1. SECTION, pt-BR: write "Seção". One spelling, c-cedilla and a-tilde, per ABNT.
     Nine groups in the packet disagreed with each other - Seção, Secão and Secao
     all appeared. A candidate reading two items sees two spellings of the same
     structural word and cannot tell which is the term.

  2. "ISSUES" (clause 4.1), es-419: write "cuestiones". NOT problemas, NOT
     asuntos. The packet mixed all three. This is not a style preference: the
     Spanish-language adoptions render clause 4.1 as "cuestiones internas y
     externas", so cuestiones IS THE STANDARD'S OWN WORD and the other two read
     as paraphrase. "problemas" is actively wrong - an issue in clause 4.1 is a
     factor to be determined, not a problem to be solved.

  3. CLAUSE SUB-ITEMS: es-419 "apartado", pt-BR "alínea" or "item".
     NEVER "apartado" INSIDE PORTUGUESE. Two pt-BR rows in the packet used it;
     it is a Spanish word and ABNT uses alínea. See also Rule 17 in CLAUDE.md,
     which pins capítulo for the top level and apartado for subdivisions on the
     es-419 side - this extends that rule across the language boundary it did
     not previously name.

  5. "ISSUES" IN PORTUGUESE IS questão / questões, NEVER cuestão / cuestões.
     Pin 2 fixes es-419 on "cuestiones". Ten pt-BR rows then came back saying
     "cuestões", which is the Spanish pin leaking across the language boundary -
     the pin working against itself. A pin names a word AND a language; the word
     without the language is how es-419's correct term becomes pt-BR's defect.

  7. FALSE FRIEND - "RE-ESCALATE" IS NOT reescalonar.
     pt-BR reescalonado / reescalonamento means RESCHEDULED. Re-escalating a
     risk to top management is reencaminhar à alta direção or escalar
     novamente. The sentence stays fluent and the OBJECT changes, which is the
     class the language guard cannot see at all - both words are Portuguese.
     Same shape as rendering "exposure" as vulnerabilidade.

    6. ISMS IS "SGSI" IN es-419 AND pt-BR, AND "ISMS" IN ENGLISH.
     Measured across the live catalogue rather than preferred: en carries ISMS
     569 times and SGSI 0; es-419 carries SGSI 567 and ISMS 4; pt-BR carries
     SGSI 565 and ISMS 4. The convention already exists and the eight ISMS
     occurrences in translated rows are the outliers.
     AIMS IS DIFFERENT AND KEEPS ITS CODE EVERYWHERE - no established
     translation exists, which is exactly why SGAI had to be coined and is
     forbidden by pin 4. Do not reason by analogy from SGSI to SGAI.

    4. AIMS AND ISMS KEEP THEIR CODES in every language. Never expand them, and
     never coin an expansion. One pt-BR row invented "SGAI" for AIMS - a
     plausible-looking acronym that appears nowhere else in the catalogue, in no
     standard, and in no other item. A coined acronym is worse than an
     untranslated one: it reads as established terminology the candidate has
     somehow missed.

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


/**
 * Carried by EVERY domain, including "general".
 *
 * It lived inside ISO_MS_VOCABULARY for about an hour, and the first repair that
 * needed it proved that wrong: AIGRM-I resolves to the "general" domain, which
 * carries no vocabulary block, so the entry was unreachable for the one
 * certification whose subject IS the distinction - and the title collapsed to
 * "responsable" a second time. Scrum needs it too: the 2020 Guide replaced the
 * word ROLES with ACCOUNTABILITIES, so a contract that cannot say what
 * accountable means is missing a 2020 term in both families.
 */
export const ACCOUNTABLE_FALSE_FRIEND = `FALSE FRIEND - ACCOUNTABLE IS NOT RESPONSABLE / RESPONSAVEL.

  Same class as compromiso and rendimiento in the Scrum contract: a CORRECT
  rendering of a DIFFERENT concept. responsable/responsavel is RESPONSIBLE -
  who does the work. ACCOUNTABLE is who answers for the outcome, and cannot
  be delegated or shared. Collapsing them erases the distinction that the
  governance certifications exist to teach.

  es-419   responsable (quien ejecuta)  vs  quien rinde cuentas /
           la rendicion de cuentas  for accountable / accountability
  pt-BR    responsavel (quem executa)   vs  quem presta contas /
           a prestacao de contas    for accountable / accountability

  CAUGHT IN REVIEW, 2026-09-12. AIGRM-I's module title "The AI Lifecycle &
  Accountable Deployment" came back with accountable collapsed to
  responsable / responsavel in BOTH languages - on the certification whose
  subject is that distinction, and whose own module DESCRIPTION had already
  rendered it correctly as "rendicion de cuentas por etapa" / "prestacao de
  contas por etapa". The paragraph got it right and the heading above it did
  not, which is the shape to watch: a short string has less context to
  disambiguate from, so a TITLE is where a false friend lands first.`;

/**
 * STATE THE TARGET LANGUAGE NEAREST THE GENERATION, NOT ONLY AT THE TOP.
 *
 * Read this before writing or editing any prompt that interpolates one of these
 * blocks. It is a finding about prompt SHAPE, not a scar on one script.
 *
 * 2026-09-12: retranslate-module-rejection.mjs wrote fluent SPANISH into a pt-BR
 * row. Its system prompt opened with "You translate ... into Brazilian
 * Portuguese", then interpolated a contract block that quotes Spanish and
 * Portuguese side by side for roughly a hundred lines, then stopped. The target
 * language was stated once, furthest from the point of generation, and the
 * bilingual block won on recency. It did this TWICE in a row on the same input.
 *
 * The fix was to end the prompt with the target language rather than begin with
 * it. That worked first try. The contract was not changed.
 *
 * ANY prompt that interpolates RETIRED_VOCABULARY, ISO_MS_VOCABULARY or
 * ACCOUNTABLE_FALSE_FRIEND has this shape, because all three are bilingual by
 * construction - they teach a distinction by showing both languages. The longer
 * and better the contract, the more it competes with the instruction that says
 * which language to produce.
 *
 * AND THE HALF THAT GENERALISES BEYOND LANGUAGE: every post-condition on that
 * script passed the Spanish output. Not identical to the rejected text. Not the
 * English. Not quoted. Not multi-line. Each of those asks "DID THE MODEL CHANGE
 * THE TEXT" - and a guard set built around that question has no concept of
 * "changed it into the wrong thing". The output was a correct, fluent,
 * non-identical translation of the right source. It was simply not the artifact
 * that was asked for.
 *
 * So when the output is generated rather than transformed, at least one
 * post-condition must assert what the artifact IS, not merely that it moved.
 * That script now carries a wrong-language guard, behaviour-tested in both
 * directions on the exact row it broke.
 *
 * ---------------------------------------------------------------------------
 * OPEN, AND THE NEXT MEMBER OF THIS FAMILY: AN ARTICLE-GENDER ASSERTION
 * ---------------------------------------------------------------------------
 *
 * NOT BUILT. Specified here on 2026-09-12 so it is not re-derived, and placed
 * beside the language guard because it is the same failure and the same fix.
 *
 * THE FAILURE. A repair returned "a Daily Scrum" in pt-BR and "la Daily Scrum"
 * in es-419. Each would have been the ONLY instance of its form in the
 * catalogue: es-419 uses "el Daily Scrum" 33 times and "la" zero; pt-BR uses
 * "o Daily Scrum" 26 times and "a" zero. Every post-condition passed both,
 * because each asks whether the model CHANGED the text - and a guard set built
 * around that question has no concept of "changed it into something the corpus
 * has never said".
 *
 * They were caught by eye, then fixed deterministically. The Spanish one was
 * caught SECOND, after the Portuguese, because the first measurement covered
 * one language - so this cost two measurements where one lookup would have done.
 *
 * WHY IT IS NOT A CONTRACT PARAGRAPH. It already is one, immediately above, with
 * the counts - and it was IGNORED TWICE after being added. It sits 14% of the
 * way through a 7,600-character block, far from the generation. A contract entry
 * that quietly does not work is worse than none, because the next person assumes
 * it is handling this.
 *
 * WHAT IT WOULD LOOK LIKE. A post-condition with a lookup table, not a prompt:
 *
 *   const GENDER = {
 *     "es-419": { masculine: ["Daily Scrum", "Sprint Backlog", "Product Backlog",
 *                             "Sprint Goal", "Product Goal", "Increment",
 *                             "Scrum Team", "Sprint Planning"],
 *                 feminine:  ["Sprint Review", "Sprint Retrospective"] },
 *     "pt-BR":  { ... same split, o/a instead of el/la },
 *   };
 *   // For each frozen noun present in the output, assert the article before it
 *   // is the one the corpus voted for. ABORT on a mismatch; never auto-fix in
 *   // place without printing before/after.
 *
 * The table is not a judgement call - THE CORPUS HAS ALREADY VOTED, the counts
 * are in the pin above, and a 33-to-0 split is not a close reading. Anything the
 * table does not know about is not asserted on, so it fails silent rather than
 * loud on an unfamiliar noun, which is the right direction for a check that runs
 * on every repair.
 *
 * IT WOULD HAVE CAUGHT BOTH OF TODAY'S WITHOUT A SECOND MEASUREMENT, which is
 * the argument for it: the cost of the miss was not the wrong article, it was
 * having to measure each language separately to find out.
 */

/** The framing noun and vocabulary block for a domain. */
export function contractForDomain(domain) {
  const join = (...parts) => parts.filter(Boolean).join("\n\n");
  if (domain === "scrum") {
    return { subject: "Scrum certification content", vocabulary: join(RETIRED_VOCABULARY, ACCOUNTABLE_FALSE_FRIEND) };
  }
  if (domain === "iso") {
    return { subject: "ISO management-system certification content", vocabulary: join(ISO_MS_VOCABULARY, ACCOUNTABLE_FALSE_FRIEND) };
  }
  return { subject: "professional certification content", vocabulary: ACCOUNTABLE_FALSE_FRIEND };
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

${RETIRED_VOCABULARY}

The contract above quotes Spanish and Portuguese side by side at length. A
sibling script that named its target only at the TOP produced fluent SPANISH for
a pt-BR row, twice, on 2026-09-12 - so the instruction below is genuinely the
last thing in this prompt, with nothing after it. Do not append to it.

OUTPUT LANGUAGE: ${langName}. NOTHING ELSE.`;
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
