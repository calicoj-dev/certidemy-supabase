/**
 * translate-item.mjs -- the two halves of item translation, moved here UNCHANGED.
 *
 * `translateUser` and `graftTranslation` were duplicated inline in gen-cert-secure.mjs and
 * backfill-practice.mjs. A third caller (translate-grounded-items.mjs) would have been a third copy,
 * and this repository's rule is that a computation with a stated invariant has one implementation.
 *
 * THE INVARIANT `graftTranslation` ENFORCES: the ENGLISH SKELETON IS AUTHORITATIVE. Option ids,
 * question_type, correct_answer and difficulty come from the English row; only the three prose fields
 * come from the translation, and an option id the translation does not carry refuses the whole item
 * rather than leaving a hole. That is what keeps a translated sibling answerable by the same key.
 */

/** The English skeleton is authoritative; only prose comes from the translation. Returns null on any gap. */
export function graftTranslation(enQ, tr) {
  if (!tr || typeof tr !== "object") return null;
  if (typeof tr.question_text !== "string" || tr.question_text.length < 5) return null;
  if (typeof tr.explanation !== "string" || tr.explanation.length < 3) return null;
  if (!Array.isArray(tr.options)) return null;
  const trById = new Map(tr.options.filter((o) => o && o.id).map((o) => [o.id, o.text]));
  const options = [];
  for (const o of enQ.options) {
    const text = trById.get(o.id);
    if (typeof text !== "string" || text.length === 0) return null;
    options.push({ id: o.id, text });
  }
  return {
    question_text: tr.question_text,
    question_type: enQ.question_type,
    options,
    correct_answer: enQ.correct_answer,
    explanation: tr.explanation,
    difficulty: enQ.difficulty,
  };
}

/** The user half of the translation prompt. Sends ONLY the three prose fields plus option ids. */
export function translateUser(enQuestions) {
  const payload = enQuestions.map((q) => ({
    question_text: q.question_text,
    options: q.options.map((o) => ({ id: o.id, text: o.text })),
    explanation: q.explanation,
  }));
  return `Translate these ${payload.length} questions:\n\n${JSON.stringify(payload, null, 2)}\n\nReturn the JSON array now.`;
}

/**
 * CONTROLS, both directions -- and the no-op proof PROMPT-104 s3a asks for lives in
 * scripts/prove-translate-item-noop.mjs, which runs the OLD inline functions against these.
 */
export function translateItemControls() {
  const fails = [];
  const t = (what, cond) => { if (!cond) fails.push(what); };
  const en = {
    question_text: "Which clause requires an audit programme?",
    question_type: "single_choice",
    options: [{ id: "a", text: "9.2.2" }, { id: "b", text: "9.1" }, { id: "c", text: "10.1" }],
    correct_answer: ["a"],
    explanation: "Clause 9.2.2 requires an audit programme.",
    difficulty: 3,
  };
  const tr = {
    question_text: "Que apartado exige un programa de auditoria?",
    options: [{ id: "a", text: "9.2.2" }, { id: "c", text: "10.1" }, { id: "b", text: "9.1" }],
    explanation: "El apartado 9.2.2 exige un programa de auditoria.",
  };
  const g = graftTranslation(en, tr);
  t("grafts the translated prose", g && g.question_text === tr.question_text && g.explanation === tr.explanation);
  /* OPTIONS PAIR BY ID, NEVER BY POSITION -- the translation above is deliberately reordered. */
  t("options pair by ID, not position", g && g.options.map((o) => o.id).join("") === "abc" &&
    g.options[1].text === "9.1" && g.options[2].text === "10.1");
  t("the English skeleton is authoritative", g && g.question_type === en.question_type &&
    JSON.stringify(g.correct_answer) === JSON.stringify(en.correct_answer) && g.difficulty === en.difficulty);

  /* every refusal direction */
  for (const [label, bad] of [
    ["null", null],
    ["no question_text", { explanation: "x", options: tr.options }],
    ["short question_text", { question_text: "abc", explanation: "xxx", options: tr.options }],
    ["no explanation", { question_text: tr.question_text, options: tr.options }],
    ["no options array", { question_text: tr.question_text, explanation: "xxx" }],
    ["a MISSING option id", { question_text: tr.question_text, explanation: "xxx",
      options: [{ id: "a", text: "9.2.2" }, { id: "b", text: "9.1" }] }],
    ["an EMPTY option text", { question_text: tr.question_text, explanation: "xxx",
      options: [{ id: "a", text: "9.2.2" }, { id: "b", text: "" }, { id: "c", text: "10.1" }] }],
  ]) {
    if (graftTranslation(en, bad) !== null) fails.push("accepted a translation it must refuse: " + label);
  }

  const u = translateUser([en]);
  t("translateUser names the count", /Translate these 1 questions/.test(u));
  t("translateUser sends the option ids", /"id": "a"/.test(u));
  /* IT MUST NOT SEND correct_answer: a translator that can see the key can lean on it. */
  t("translateUser does NOT send correct_answer", !/correct_answer/.test(u));
  t("translateUser does NOT send difficulty", !/difficulty/.test(u));

  return { examined: 13, fails };
}
