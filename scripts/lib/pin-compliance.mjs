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
export function checkPins(text, lang) {
  const t = String(text ?? "");
  const out = [];
  for (const r of PIN_RULES) {
    if (!r.langs.includes(lang)) continue;
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
  for (const [name, lang, text, expect] of CASES) {
    const hits = checkPins(text, lang);
    const got = hits.length ? hits[0].id : null;
    const ok = got === expect;
    if (!ok) bad++;
    console.log(`${ok ? "  ok  " : "FAIL  "}${name.padEnd(42)} ${lang.padEnd(7)} -> ${got ?? "clean"}${ok ? "" : `  (wanted ${expect ?? "clean"})`}`);
  }
  console.log(`\n${CASES.length - bad}/${CASES.length} behaviour cases pass`);
  process.exit(bad ? 1 : 0);
}
