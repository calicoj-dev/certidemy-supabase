/**
 * pin-compliance.mjs - do the translations actually obey the pins?
 *
 * ISO_MS_VOCABULARY states four terminology pins. On 2026-09-13 one of them was
 * violated BY THE RUN THAT CARRIED IT: group 20c4e95d's pt-BR was regenerated
 * with the apartado pin in the prompt and came back saying "apartado 6.1.3"
 * anyway. A PIN IS AN INSTRUCTION, NOT A GUARANTEE. Nothing checked the output
 * against the contract, so the contract was advisory.
 *
 * Same shape as the agreement pass that died with its script: a rule that exists
 * only where it was written is a rule the next run is free to ignore.
 *
 * EVERY RULE IS PER-LANGUAGE, AND THAT IS THE WHOLE DIFFICULTY. The detector
 * this replaces flagged four correct es-419 rows because it tested for the WORD
 * "apartado" when the property is "apartado IN PORTUGUESE" - apartado is the
 * pinned, correct rendering for es-419 sub-items under Rule 17. A checker that
 * cannot tell those apart makes the pins unenforceable, because its output is
 * mostly noise and gets ignored.
 */

/**
 * The four pins, each as {id, langs, re, why}. `langs` is the set the rule
 * applies to - the rest are not merely tolerated, they are NOT TESTED, because
 * in those languages the same string can be correct.
 */
export const PIN_RULES = [
  /* ============ PROMPT-105: THREE pt-BR PINS, RULED FROM THE 2.4 SAMPLE ============
   *
   * Two of the three are SOURCE-RELATIVE via `enRe`: they fire only when the ENGLISH field carries the
   * term being mistranslated. `atribuicoes` is a perfectly good Portuguese word for duties, so a bare
   * lexical rule would fire on correct text -- the defect is using it WHERE THE ENGLISH SAYS ROLES.
   * Same shape as `inserted-cadence`, which already needed the source to mean anything. */
  {
    id: "roles-in-pt",
    langs: ["pt-BR"],
    enRe: /\brole(s)?\b/i,
    /* `funcao/funcoes` added PROMPT-106: it slipped past the first version entirely -- read-back 4 said
     * "as funcoes e responsabilidades atribuidas" for "roles and responsibilities". */
    re: /\batribui[çc][ãa]o\b|\batribui[çc][õo]es\b|\bfun[çc][ãa]o\b|\bfun[çc][õo]es\b|\broles\b/iu,
    /* NARROWED AFTER READING THE MEMBERS. The first version fired on four rows that were all CORRECT:
     * each rendered roles as papeis AND used atribuicao for ASSIGNMENT, which is what the English said
     * ("earlier life-cycle roles left unassigned" -> "deixando sem atribuicao os papeis"). The field
     * carries both words, so keying on the English having "role" fires on the normal case.
     * A field that already says papel/papeis has translated roles correctly, whatever else it says. */
    unless: /\bpap[eé]is\b|\bpap[eé]l\b/iu,
    why: "ABNT usage is papeis (papeis, responsabilidades e autoridades) where the English says roles. Never atribuicoes INSTEAD of papeis, and never the bare English word. atribuicao for ASSIGNMENT is correct and is not caught once the field also says papel/papeis. es-419 'roles' is correct and this rule is pt-BR only.",
  },
  {
    /* THE es-419 HALF, PROMPT-106. One bank rendered "roles" two ways: 017478b5 says `roles` and
     * 9cbef19e says `funciones`. Same source term, same certification, two words. */
    id: "roles-in-es",
    langs: ["es-419"],
    enRe: /\brole(s)?\b/i,
    re: /\bfunci[óo]n\b|\bfunciones\b/iu,
    /* `rol(es)?`, NOT `roles?` -- the latter is rol+e+s? and never matches the bare Spanish `rol`.
     * Its own control caught that before the rule touched a row. */
    unless: /\brol(es)?\b/iu,
    why: "es-419 keeps rol/roles where the English says roles. funcion/funciones is the FUNCTION of a thing, not a role someone holds, and one AIMS-F bank used both for the same term. funciones for an actual function is not caught once the field also says rol/roles.",
  },
  {
    id: "governing-body-in-pt",
    langs: ["pt-BR"],
    re: /\bcorpos?\s+de\s+governan[çc]a\b/iu,
    why: "pt-BR is orgao de governanca, not corpo de governanca. es-419 'organo de gobierno' is already correct.",
  },
  {
    id: "safety-in-pt",
    langs: ["pt-BR"],
    enRe: /\bsafety\b/i,
    re: /\bsafety\b/i,
    why: "safety is not left in English in pt-BR. Where security and safety appear together, security is 'seguranca da informacao' and safety is 'seguranca'; otherwise 'seguranca'. Tech loanwords (drift, analytics, start-up) are deliberately NOT caught by this rule.",
  },
  {
    id: "apartado-in-pt",
    langs: ["pt-BR"],
    re: /\bapartados?\b/i,
    why: "apartado is Spanish. ABNT uses alinea or item. It is the PINNED and CORRECT word in es-419, which is why this rule is pt-BR only.",
  },
  {
    id: "coined-acronym",
    langs: ["en", "es-419", "pt-BR"],
    // SGAI was invented for AIMS in one pt-BR row. It appears in no standard and
    // nowhere else in the catalogue. SGSI is the real, established Spanish and
    // Portuguese rendering of ISMS and is NOT caught here.
    re: /\bSGAI\b/,
    why: "AIMS and ISMS keep their codes. A coined expansion reads as established terminology the candidate has missed.",
  },
  {
    id: "secao-spelling",
    langs: ["pt-BR"],
    // Any Se{c|c-cedilla}{a|a-tilde}o that is not exactly the ABNT spelling.
    // Spanish "Seccion"/"Seccion" is a different word and this rule does not
    // run on es-419 at all.
    re: /\bSe[cç][aã]o\b/u,
    ok: /\bSeção\b/u,
    why: "One spelling, Se-c-cedilla-a-tilde-o, per ABNT. Nine groups disagreed with each other.",
  },
  /**
   * EVERY PIN NEEDS TWO RULES, NOT ONE, AND THIS FILE SHIPPED WITH ONLY ONE.
   *
   * A pin says "use X in language L". That needs a POSITIVE rule - L must not
   * use the alternatives - AND A LEAK RULE - the OTHER language must not use X.
   * The first version had the positive half for `cuestiones` and no leak half,
   * so the pin propagated into Portuguese: ten pt-BR rows came back rendering
   * clause 4.1 issues as cuestao/cuestoes, which is Spanish. The checker passed
   * all 42 rows because it asked whether the pinned word was present and never
   * asked which language it was pinned FOR.
   *
   * That is the SAME DEFECT the apartado rule was built to fix, one level down:
   * a rule about a word rather than about a word in a language. The four leak
   * rules below close it for every pin that has a language scope.
   */
  {
    id: "cuest-leak-into-pt",
    langs: ["pt-BR"],
    re: /\bcuest(?:[\u00e3a]o|[\u00f5o]es|i[\u00f3o]n|iones)\b/i,
    why: "cuestiones is pinned for es-419. Portuguese is questao / questoes. A Spanish pin leaking into Portuguese is the pin working against itself.",
  },
  {
    id: "alinea-leak-into-es",
    langs: ["es-419"],
    re: /\bal[\u00ed i]neas?\b/i,
    why: "alinea is pinned for pt-BR sub-items. es-419 uses apartado. The mirror of apartado-in-pt.",
  },
  {
    id: "secao-leak-into-es",
    langs: ["es-419"],
    re: /\bSe[c\u00e7][a\u00e3]o\b/iu,
    why: "Secao is the pt-BR spelling. Spanish is Seccion. The mirror of secao-spelling.",
  },
  {
    id: "acronym-language-scope",
    langs: ["es-419", "pt-BR"],
    re: /\bISMS\b/,
    why: "MEASURED ACROSS THE LIVE CATALOGUE, not preferred: en carries ISMS 569 times and SGSI 0; es-419 carries SGSI 567 and ISMS 4; pt-BR carries SGSI 565 and ISMS 4. SGSI is the established acronym in both target languages and the eight ISMS occurrences are the outliers. AIMS is different and keeps its code everywhere, because no established translation exists - which is why SGAI had to be coined and is forbidden.",
  },
  {
    id: "issues-es419",
    langs: ["es-419"],
    // Scoped to the clause-4.1 collocation on purpose. Bare "problemas" is an
    // ordinary Spanish word and flagging it would bury the rule in noise; what
    // the pin is about is rendering clause 4.1 "issues" as anything but
    // cuestiones, and that shows up attached to interno/externo.
    re: /\b(problemas|asuntos)\s+(internos|externos)\b|\b(internos|externos)\s+y\s+(internos|externos)?\s*(problemas|asuntos)\b/i,
    why: "Clause 4.1 is 'cuestiones internas y externas' in the Spanish adoptions - cuestiones is the standard's own word. problemas is actively wrong: an issue is a factor to determine, not a problem to solve.",
  },
];

/**
 * Check one field-set for one language.
 * @returns {Array<{id,why,hit}>} empty when compliant.
 */
/**
 * PERIODICITY MARKERS. The cadence rule is the only one that cannot be decided
 * from the translation alone - "periodicamente" is correct when the English says
 * "at planned intervals" and a defect when the English states no interval. So it
 * is RELATIVE, and needs the source.
 */
const CADENCE_TARGET = /\b(peri[\u00f3o]dicamente|regularmente|continuamente|de forma cont[\u00ed i]nua|de forma peri[\u00f3o]dica|anualmente|mensalmente|mensualmente|trimestralmente)\b/i;
/* `continuing` and `on a continuing basis` were MISSING, so a faithful "de forma continua" rendering of
 * "Improving, on a continuing basis" was reported as an INSERTED cadence. The source list has to carry
 * every way the English states a cadence, or the rule accuses the translation of the pattern's gap. */
const CADENCE_SOURCE = /\b(planned intervals?|at intervals?|periodic(?:ally)?|regular(?:ly)?|annual(?:ly)?|monthly|quarterly|ongoing|continu(?:al|ous|ing)(?:ly)?|each year|every year)\b/i;

/**
 * @param {string} text    the translated field-set
 * @param {string} lang    its language
 * @param {string} [enText] the ENGLISH the translation was made from. Omit it and
 *                          the cadence rule does not run - it CANNOT run, and a
 *                          rule that guesses when it lacks its input is worse
 *                          than one that abstains.
 */
export function checkPins(text, lang, enText) {
  const t = String(text ?? "");
  const out = [];

  // INSERTED OBLIGATION. Group 9's English said the determination is "something
  // the organization returns to" with no interval - and BOTH translations
  // independently added one, twice, across two separate regenerations. That is
  // the ISO 9001 cadence the English repair had just removed, coming back in
  // through translation. Both explanations even said the clause imposes no
  // review interval and then inserted one two clauses later.
  if (lang !== "en" && enText != null) {
    const m = CADENCE_TARGET.exec(t);
    if (m && !CADENCE_SOURCE.test(String(enText))) {
      out.push({
        id: "inserted-cadence",
        hit: m[0],
        why: "The English states no interval and the translation adds one. A periodicity word is correct when the source has one - 8.2's 'planned intervals' is exactly that case - and a defect when it does not. What changes is what the sentence REQUIRES.",
      });
    }
  }

  for (const r of PIN_RULES) {
    if (!r.langs.includes(lang)) continue;
    /* A SOURCE-RELATIVE RULE ABSTAINS WITHOUT THE SOURCE rather than guessing. Passing no English
     * means the rule does not run -- the same contract `inserted-cadence` already has, because a rule
     * that cannot see the source must not invent a verdict about it. */
    if (r.enRe) {
      if (enText == null) continue;
      if (!r.enRe.test(String(enText))) continue;
    }
    /* `unless` is an ACQUITTAL on the translated field: evidence that the term WAS rendered correctly
     * somewhere in it, which makes the matched word a different word doing a different job. */
    if (r.unless && r.unless.test(t)) continue;
    const m = r.re.exec(t);
    if (!m) continue;
    // A rule with `ok` is a SPELLING rule: the pattern matches every variant
    // including the correct one, so a hit only counts when the matched text is
    // not the accepted form.
    if (r.ok && r.ok.test(m[0])) continue;
    out.push({ id: r.id, why: r.why, hit: m[0] });
  }
  return out;
}

/** Convenience: every field of an item row, joined. */
export function itemText(row) {
  const opts = Array.isArray(row.options) ? row.options.map((o) => o.text || "").join(" ") : "";
  return [row.question_text, row.explanation || "", opts].join("\n");
}

/**
 * BEHAVIOUR TEST, run with: node scripts/lib/pin-compliance.mjs
 *
 * BOTH DIRECTIONS, and the negative cases are the REAL ROWS that a previous
 * detector got wrong rather than invented strings. If this file is ever
 * rewritten, these are the cases that must still pass.
 */
const CASES = [
  // --- PROMPT-105's three pt-BR pins, both directions each ---
  ["atribuicoes where the English says roles", "pt-BR",
    "A alta direcao define as atribuicoes, responsabilidades e autoridades.", "roles-in-pt",
    "Top management defines the roles, responsibilities and authorities."],
  /* THE FOUR FALSE POSITIVES THE FIRST VERSION OF THIS RULE PRODUCED, verbatim from the rows it
   * flagged. Every one renders roles as papeis AND uses atribuicao for ASSIGNMENT, which is what the
   * English says. They cost three re-translation rounds before I read them. */
  /* PROMPT-106: funcoes/funciones for ROLES, both languages, both directions. */
  ["funcoes where the English says roles, pt-BR", "pt-BR",
    "As funções e responsabilidades atribuídas são revisadas pela alta direção.", "roles-in-pt",
    "The roles and responsibilities assigned are reviewed by top management."],
  ["papeis plus funcoes for an actual FUNCTION must NOT flag", "pt-BR",
    "Os papéis são definidos e a função de auditoria interna permanece independente.", null,
    "The roles are defined and the internal audit function remains independent."],
  ["funcoes with NO role in the English must NOT flag", "pt-BR",
    "A função de auditoria interna permanece independente da área auditada.", null,
    "The internal audit function remains independent of the area audited."],
  ["funciones where the English says roles, es-419", "es-419",
    "La organización puede ocupar varias de las funciones enumeradas al mismo tiempo.", "roles-in-es",
    "The organization can hold several of the listed roles at once."],
  ["roles is CORRECT in es-419 and must not flag", "es-419",
    "La organización puede ocupar varios de los roles enumerados al mismo tiempo.", null,
    "The organization can hold several of the listed roles at once."],
  ["rol plus funciones for an actual FUNCTION must NOT flag, es-419", "es-419",
    "El rol de la organización se define y la función de auditoría interna es independiente.", null,
    "The organization's role is defined and the internal audit function is independent."],
  ["funciones with NO role in the English must NOT flag", "es-419",
    "La función de auditoría interna es independiente del área auditada.", null,
    "The internal audit function is independent of the area audited."],
  ["roles-in-es does not run on pt-BR", "pt-BR",
    "O papel da organização e a função de auditoria.", null,
    "The organization's role and the audit function."],

  ["papeis plus atribuicao for ASSIGNMENT must NOT flag", "pt-BR",
    "Os papéis e deveres de IA são recomendados nesse porte e sua atribuição pode ser postergada.", null,
    "AI roles and duties are recommended at that size and their assignment can be deferred."],
  ["papeis plus sem atribuicao must NOT flag", "pt-BR",
    "Nomear a unidade de negócio como a parte responsável, deixando sem atribuição os papéis das etapas anteriores do ciclo de vida.", null,
    "Naming the business unit as the party answerable, with earlier life-cycle roles left unassigned"],
  ["papel singular also acquits", "pt-BR",
    "Um processo para relatar preocupações sobre o papel da organização, cuja atribuição pode mudar.", null,
    "A process to report concerns about the organization's role, whose assignment can change."],
  ["papeis twice with alocados must NOT flag", "pt-BR",
    "O controle exige que os papéis e responsabilidades de IA sejam definidos e alocados conforme a organização necessita, de modo que o conjunto de papéis é moldado por ela.", null,
    "The control requires AI roles and responsibilities to be defined and allocated in line with what the organization needs, so the set of roles is shaped by it."],
  ["bare English roles in pt-BR", "pt-BR",
    "A alta direcao define os roles e as responsabilidades.", "roles-in-pt",
    "Top management defines the roles and responsibilities."],
  ["papeis is CORRECT and must not flag", "pt-BR",
    "A alta direcao define os papeis, responsabilidades e autoridades.", null,
    "Top management defines the roles, responsibilities and authorities."],
  // atribuicoes is a real word for DUTIES: with no `role` in the English the rule must abstain
  ["atribuicoes with no roles in the English must NOT flag", "pt-BR",
    "O auditor registra as atribuicoes delegadas durante a auditoria.", null,
    "The auditor records the duties delegated during the audit."],
  ["a source-relative rule abstains with NO English at all", "pt-BR",
    "A alta direcao define as atribuicoes, responsabilidades e autoridades.", null, undefined],
  /* "on a continuing basis" IS a stated cadence. The source list lacked `continuing`, so a faithful
   * rendering was accused of inserting one. Both directions, because the rule must still fire. */
  ["de forma continua rendering 'on a continuing basis' must NOT flag", "pt-BR",
    "Melhorar, de forma contínua, quão adequado e eficaz é o sistema de gestão de IA.", null,
    "Improving, on a continuing basis, how suitable and effective the AI management system is."],
  ["de forma continua with NO cadence in the English still flags", "pt-BR",
    "A organizacao revisa, de forma contínua, o seu contexto.", "inserted-cadence",
    "The organization returns to its context."],
  ["corpo de governanca in pt-BR", "pt-BR",
    "O corpo de governanca aprova a politica de IA.", "governing-body-in-pt"],
  ["orgao de governanca is CORRECT and must not flag", "pt-BR",
    "O orgao de governanca aprova a politica de IA.", null],
  ["safety left in English in pt-BR", "pt-BR",
    "A organizacao considera a safety do sistema de IA.", "safety-in-pt",
    "The organization considers the safety of the AI system."],
  ["seguranca for safety is CORRECT and must not flag", "pt-BR",
    "A organizacao considera a seguranca do sistema de IA.", null,
    "The organization considers the safety of the AI system."],
  // THE LOANWORD DIRECTION, ruled explicitly: drift, analytics and start-up stay as they are
  ["tech loanwords must NOT flag", "pt-BR",
    "A equipe monitora o drift do modelo com analytics de uma start-up.", null,
    "The team monitors model drift with analytics from a start-up."],
  // and none of the three runs on es-419, where the Spanish forms are the pinned ones
  ["roles in es-419 is CORRECT and must not flag", "es-419",
    "La alta direccion define los roles, responsabilidades y autoridades.", null,
    "Top management defines the roles, responsibilities and authorities."],
  ["organo de gobierno in es-419 must not flag", "es-419",
    "El organo de gobierno aprueba la politica de IA.", null],

  // --- must FLAG ---
  ["apartado in pt-BR", "pt-BR", "Sua conexao decorre do apartado 6.1.3, que exige que a organizacao defina um processo.", "apartado-in-pt"],
  ["coined SGAI", "pt-BR", "O SGAI da organizacao deve considerar o contexto.", "coined-acronym"],
  ["Secao without cedilla", "pt-BR", "Conforme a Secao 4.1 da norma, a organizacao determina as questoes.", "secao-spelling"],
  ["Secao with cedilla but no tilde", "pt-BR", "Conforme a Seçao 4.1 da norma.", "secao-spelling"],
  ["problemas externos in es-419", "es-419", "El equipo lista la confianza publica como problemas externos relevantes.", "issues-es419"],
  ["asuntos internos in es-419", "es-419", "Determina los asuntos internos y externos pertinentes.", "issues-es419"],

  ["cuestao leaking into pt-BR", "pt-BR", "A organizacao deve determinar as cuestoes internas e externas pertinentes.", "cuest-leak-into-pt"],
  ["cuestion leaking into pt-BR", "pt-BR", "A cuestao externa mais relevante e a confianca publica.", "cuest-leak-into-pt"],
  ["alinea leaking into es-419", "es-419", "Conforme la alinea 6.1.3 e) de la norma.", "alinea-leak-into-es"],
  ["Secao leaking into es-419", "es-419", "Conforme la Secao 4.1 de la norma.", "secao-leak-into-es"],
  ["ISMS left untranslated in es-419", "es-419", "El alcance del ISMS cubre tres unidades de negocio.", "acronym-language-scope"],
  ["ISMS left untranslated in pt-BR", "pt-BR", "O escopo do ISMS cobre tres unidades de negocio.", "acronym-language-scope"],

  // --- must NOT flag: these are the THREE FALSE POSITIVES the last detector
  // produced, taken from the actual rows, plus the correct spellings ---
  ["435fa154 correct es-419 apartado", "es-419",
   "El apartado 4.1 de ISO/IEC 42001 requiere que la organizacion determine las cuestiones internas y externas.", null],
  ["87757992 correct es-419 apartado", "es-419",
   "Un alcance acotado es permisible: el apartado 4.3 de ISO/IEC 27001 exige que la organizacion determine los limites.", null],
  ["1f0cf2a3 correct pt-BR vulnerabilidade", "pt-BR",
   "O analista registra um ativo, uma ameaca e uma vulnerabilidade no registro de riscos e seleciona um tratamento.", null],
  ["correct Secao spelling", "pt-BR", "Conforme a Seção 4.1 da norma, a organizacao determina as questoes.", null],
  ["cuestiones is the pin, not a violation", "es-419", "Determina las cuestiones internas y externas pertinentes.", null],
  ["SGSI is real and must not be flagged", "pt-BR", "O SGSI da organizacao cobre tres unidades de negocio.", null],
  ["ordinary problemas, not the 4.1 collocation", "es-419", "La opcion describe problemas de comunicacion entre equipos.", null],
  ["apartado is not tested in English", "en", "Clause 6.1.3 e) has the organization consider the guidance.", null],
  // --- INSERTED CADENCE, and the case that must NOT fire is the whole point ---
  ["cadence added where English has none", "es-419",
   "es algo a lo que la organizacion debe volver peri\u00f3dicamente.",
   "inserted-cadence", "something the organization returns to."],
  ["cadence added where English has none, pt", "pt-BR",
   "e algo a que a organizacao deve retornar periodicamente.",
   "inserted-cadence", "something the organization returns to."],
  ["8.2 planned intervals - CORRECT, must not fire", "es-419",
   "Vuelve para reevaluacion en los intervalos planificados y regularmente cuando cambia algo.",
   null, "It returns for reassessment at the planned intervals and whenever a significant change occurs."],
  ["8.2 planned intervals - CORRECT, pt", "pt-BR",
   "Retorna para reavaliacao nos intervalos planejados, periodicamente conforme definido.",
   null, "It returns for reassessment at the planned intervals and whenever a significant change occurs."],
  ["no English supplied - rule abstains rather than guesses", "pt-BR",
   "A organizacao deve retornar periodicamente a essa determinacao.", null, undefined],

  // THE PIN ITSELF MUST STILL PASS. A leak rule that also fires on the correct
  // language would make the pin unsatisfiable in both directions, which is the
  // failure this whole file exists to avoid.
  ["cuestiones correct in es-419", "es-419", "La organizacion determina las cuestiones internas y externas pertinentes.", null],
  ["questoes correct in pt-BR", "pt-BR", "A organizacao determina as questoes internas e externas pertinentes.", null],
  ["alinea correct in pt-BR", "pt-BR", "Conforme a alinea 6.1.3 e) da norma.", null],
  ["Secao correct in pt-BR", "pt-BR", "Conforme a Se\u00e7\u00e3o 4.1 da norma.", null],
  ["SGSI correct in es-419", "es-419", "El alcance del SGSI cubre tres unidades de negocio.", null],
  ["SGSI correct in pt-BR", "pt-BR", "O escopo do SGSI cobre tres unidades de negocio.", null],
  ["ISMS correct in English", "en", "The ISMS scope covers three business units.", null],
  ["AIMS keeps its code in pt-BR", "pt-BR", "O AIMS da organizacao considera o contexto.", null],
];

// A file:// comparison does not survive Windows paths - it silently matched
// nothing and the whole behaviour test ran zero cases while exiting 0, which is
// the worst failure a test file can have. Match on the basename instead.
if ((process.argv[1] || "").replace(/\\/g, "/").endsWith("lib/pin-compliance.mjs")) {
  let bad = 0;
  for (const [name, lang, text, expect, en] of CASES) {
    const hits = checkPins(text, lang, en);
    const got = hits.length ? hits[0].id : null;
    const ok = got === expect;
    if (!ok) bad++;
    console.log(`${ok ? "  ok  " : "FAIL  "}${name.padEnd(42)} ${lang.padEnd(7)} -> ${got ?? "clean"}${ok ? "" : `  (wanted ${expect ?? "clean"})`}`);
  }
  console.log(`\n${CASES.length - bad}/${CASES.length} behaviour cases pass`);
  process.exit(bad ? 1 : 0);
}
