/**
 * stem-identity.mjs -- the one-variant-per-stem identity, shared.
 *
 * ============ WHY THIS IS A MODULE AND NOT TEN LINES INLINE ============
 *
 * The rule lived inline in `generate-mock-exam` and compared the TRANSLATED
 * `question_text`. That works in the language it was written in and fails in the
 * other two: AIE-I's duplicate pair renders as "¿Qué afirmación describe..." and
 * "¿Cuál enunciado describe..." in es-419, so both survived into one form and a
 * candidate could be asked the same question twice with different options.
 *
 * Measured 2026-09-26 across every secure pool: 9 English duplicate-stem
 * families, 4 escaping in es-419 and 2 in pt-BR.
 *
 * It is a module so the deployed function and the fixtures import the SAME
 * implementation. A test against a reimplementation proves the reimplementation.
 *
 * `.mjs` deliberately: Deno imports it directly and Node imports it unchanged, so
 * there is no build step between what is tested and what runs -- the same reason
 * `item-cue-guard.mjs` lives here.
 */

/** Normalise a stem exactly as the original English-only guard did. */
export const normStem = (s) => String(s == null ? "" : s).trim().slice(0, 160);

/**
 * The identity two items share when they are the same question.
 *
 * `row`  { id, question_group_id, question_text }
 * `englishStemByGroup`  Map<question_group_id, normalised English stem>
 *
 * A row whose group has no English sibling gets its own id, so it is never
 * deduped against anything. That is the correct default: a duplicate must be
 * PROVEN, and with no English side there is nothing to prove it against.
 * Treating such rows as mutual duplicates would drop items from a form on no
 * evidence, which is a worse failure than missing one.
 */
export function stemIdentity(row, englishStemByGroup) {
  const g = row && row.question_group_id;
  if (g) {
    const en = englishStemByGroup && englishStemByGroup.get(g);
    if (en) return "grp:" + en;
  }
  return "row:" + String(row && row.id);
}

/** Dedupe a pool to one row per identity, preserving the caller's order. */
export function dedupeByIdentity(rows, englishStemByGroup) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const k = stemIdentity(r, englishStemByGroup);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

/**
 * Fixtures. Both directions, and the positive half uses the REAL measured
 * families rather than invented text: a control built from what the author
 * imagined tests the imagination.
 */
export function stemIdentityControls() {
  const bad = [];
  const must = (cond, what) => { if (!cond) bad.push(what); };

  /* --- the four es-419 families that escaped the old byte guard --- */
  const ESCAPED_ES = [
    ["AIE-I generative AI / machine learning",
     "Which statement correctly describes the relationship between generative AI and machine learning?",
     "¿Qué afirmación describe correctamente la relación entre la IA generativa y el aprendizaje automático?",
     "¿Cuál enunciado describe correctamente la relación entre la IA generativa y el aprendizaje automático?"],
    ["AIMS-IA clause 9.2 audit, no nonconformities",
     "An internal auditor completes a clause 9.2 AIMS audit and finds no nonconformities.",
     "Una auditora interna completa una auditoría del sistema de gestión de IA según el apartado 9.2 y no encuentra no conformidades.",
     "Un auditor interno finaliza una auditoría de la cláusula 9.2 del SGAI y no halla no conformidades."],
    ["SM-AI-I Scrum Master's central accountability",
     "According to the 2020 Scrum Guide, what is the Scrum Master's central accountability?",
     "Según la Guía Scrum 2020, ¿cuál es la responsabilidad central del Scrum Master?",
     "De acuerdo con la Guía de Scrum 2020, ¿qué responsabilidad central tiene el Scrum Master?"],
    ["SM-AI-I who creates the Definition of Done",
     "According to the 2020 Scrum Guide, who creates the Definition of Done?",
     "Según la Guía Scrum 2020, ¿quién crea la Definición de Terminado?",
     "De acuerdo con la Guía de Scrum 2020, ¿quién elabora la Definición de Terminado?"],
  ];
  /* --- the two pt-BR families --- */
  const ESCAPED_PT = [
    ["SM-AI-I who creates the Definition of Done",
     "According to the 2020 Scrum Guide, who creates the Definition of Done?",
     "De acordo com o Guia Scrum 2020, quem cria a Definição de Pronto?",
     "Conforme o Guia do Scrum 2020, quem elabora a Definição de Pronto?"],
    ["SM-AI-I primary purpose of the Sprint Review",
     "Which statement best describes the primary purpose of the Sprint Review?",
     "Qual afirmação descreve melhor o propósito principal da Sprint Review?",
     "Qual enunciado descreve melhor o objetivo principal da Sprint Review?"],
  ];

  for (const set of [ESCAPED_ES, ESCAPED_PT]) {
    for (const [name, en, a, b] of set) {
      const map = new Map([["g1", normStem(en)], ["g2", normStem(en)]]);
      const rows = [
        { id: "r1", question_group_id: "g1", question_text: a },
        { id: "r2", question_group_id: "g2", question_text: b },
      ];
      /* The old guard is the negative control: it must NOT have caught these. */
      if (normStem(a) === normStem(b)) bad.push(name + ": the two translated stems are identical, so this is not a valid fixture");
      if (dedupeByIdentity(rows, map).length !== 1) bad.push(name + ": NOT deduped -- the guard still misses it");
    }
  }

  /* --- a pair with DIFFERENT English stems must survive as two --- */
  const diff = new Map([
    ["gA", normStem("Which statement correctly describes the relationship between generative AI and machine learning?")],
    ["gB", normStem("Which statement correctly describes the relationship between supervised and unsupervised learning?")],
  ]);
  const twoRows = [
    { id: "r1", question_group_id: "gA", question_text: "texto uno" },
    { id: "r2", question_group_id: "gB", question_text: "texto dos" },
  ];
  must(dedupeByIdentity(twoRows, diff).length === 2,
    "two items with DIFFERENT English stems were wrongly collapsed into one");

  /* --- English itself still dedupes, so the fix cannot regress the case that
         already worked --- */
  const enMap = new Map([["g1", normStem("Same stem?")], ["g2", normStem("Same stem?")]]);
  must(dedupeByIdentity([
    { id: "r1", question_group_id: "g1", question_text: "Same stem?" },
    { id: "r2", question_group_id: "g2", question_text: "Same stem?" },
  ], enMap).length === 1, "English duplicates stopped being deduped");

  /* --- no English sibling: never deduped against anything --- */
  const orphans = [
    { id: "o1", question_group_id: "gX", question_text: "un texto" },
    { id: "o2", question_group_id: "gX", question_text: "un texto" },
  ];
  must(dedupeByIdentity(orphans, new Map()).length === 2,
    "rows with no English sibling were deduped against each other on no evidence");
  must(dedupeByIdentity([{ id: "o3", question_group_id: null, question_text: "x" }], new Map()).length === 1,
    "a row with a null group key was dropped");

  /* --- normalisation is the SAME as the old guard's, so behaviour on English
         is unchanged beyond the group indirection --- */
  must(normStem("  padded  ") === "padded", "normStem stopped trimming");
  must(normStem("x".repeat(200)).length === 160, "normStem stopped truncating at 160");

  return bad;
}
