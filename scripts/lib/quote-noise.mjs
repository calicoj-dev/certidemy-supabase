/**
 * quote-noise.mjs -- reject any key_support or distractor-support span that carries extraction noise.
 *
 * Ruled PROMPT-87 s1d. One implementation, imported by the generator's gates.
 *
 * ============ WHY THIS CANNOT BE LEFT TO THE VERBATIM GATE ============
 *
 * A key quoting "and and development development" PASSES `verbatim`, because that gate asks whether the
 * quote matches the passage -- and it does, character for character. The quote is faithful to a mangled
 * source. So the defect is invisible to every gate that exists, fails nothing, and reads wrong to a
 * candidate. This makes it impossible by construction rather than something we got lucky on: the four
 * survivors of the task 1.3 rerun happened to quote clean spans, and that was luck.
 *
 * ============ THE SPAN, NOT THE PASSAGE ============
 *
 * The test is on the QUOTED SPAN. A passage may carry noise elsewhere and still have clean sentences worth
 * anchoring in -- and refusing the whole passage would close the seven A.6.2.x controls the AIMS-F rollout
 * depends on. This is deliberately the narrower rule.
 *
 * ============ AND IT IS A DIFFERENT QUESTION FROM THE CENSUS ============
 *
 * The census asks which PASSAGES are damaged, to scope a re-extraction. This asks whether THIS QUOTE
 * carries damage. `title-bleed` is therefore not tested here: it is a property of where a passage begins,
 * not of an arbitrary span, and a quote that happens to start at the passage's first word is not thereby
 * defective.
 */

/* Each signature is a SHAPE, never a spelling: a list of known bad strings would miss the next one. */
/* Conjunctions that follow a SUSPENDED hyphen. "low- and medium-risk" is correct English; a real wrap
 * is "docu- mented", whose tail is a word continuation. Three languages, because stems are served in
 * three. */
const SUSPENDED = /[A-Za-z]-\s+(?:and|or|nor|y|o|e|ou|nem)\b/i;

/* The clause-opening words a genuine run-together joins to. Every real instance in the library does:
 * "specThe", "inforThe", "organizaThe", "commuProcesses", "prepaThe". A product name joins to a noun --
 * DataRobot, SageMaker, LangChain, WebSocket, OrderService -- which is why an allowlist of brands cannot
 * work and this list can. Declared, not inferred. */
/* SHORT PREPOSITIONS ARE OUT. "In", "On", "At", "As", "For", "It", "An" appear as the tail of ordinary
 * camelCase -- "LinkedIn" alone produced all twelve remaining hits in the served sweep. A clause opener
 * that is only two letters cannot discriminate, so the list carries only words long and specific enough
 * to be a real sentence start. Both directions are controlled. */
const OPENERS = ["The", "This", "These", "Those", "Processes", "Information", "Where", "When",
  "Organizations", "Controls", "Documented", "Records", "Evidence", "Personnel"];
const RUN_TOGETHER_RE = new RegExp("[a-z]{2}(" + OPENERS.join("|") + ")\\b");

export const NOISE = [
  /* PER OCCURRENCE, not per span. The first version exempted the WHOLE span if any suspended hyphen
   * appeared in it, so "low- and medium-risk techni- cal documentation" passed: one correct
   * construction disabled the detector for a real wrap beside it. Its own control caught that. */
  ["hyphen-break", (t) => {
    const re = /[A-Za-z]-\s+[a-z]/g;
    for (let m = re.exec(t); m; m = re.exec(t)) {
      const window = t.slice(m.index, m.index + m[0].length + 10);
      if (!SUSPENDED.test(window)) return m;
    }
    return null;
  },
    "a word broken across a line join, as in \"docu- mented\""],
  /* UNICODE-AWARE boundaries: `\b` is ASCII-only and split "excluidos" at its accent, reporting the
   * tail "dos" as a doubled word. */
  ["doubled-word", (t) => /(?<![\p{L}\p{M}])(\p{L}{3,})\s+\1(?![\p{L}\p{M}])/u.exec(t),
    "the same word twice, as in \"and and development development\""],
  ["run-together", (t) => RUN_TOGETHER_RE.exec(t),
    "a word joined to a clause opener with no space, as in \"specThe\""],
];

/* camelCase terms that are NOT damage. Declared by name -- inferring them would be the lexical-proxy trap,
 * and the cost of guessing is a real run-together excused. Shared shape with the census's own list. */
/* The camelCase ALLOWLIST IS RETIRED. It was the wrong mechanism: product names are unbounded and the
 * served bank produced eleven in one sweep. run-together now keys on the clause opener instead, which
 * needs no list of brands. Kept as an empty export so an importer breaks loudly rather than silently. */
export const CAMEL_OK = [];

/** Every noise signature present in one span, with the matched text. */
export function noiseIn(span) {
  const raw = String(span || "");
  const out = [];
  for (const [name, fn, why] of NOISE) {
    const m = fn(raw);
    if (m) out.push({ name, why, at: m.index, matched: m[0] });
  }
  return out;
}
/**
 * The gate. Examines the key's support and every distractor's support.
 * @returns {{id:string, pass:boolean|null, examined:number, reason:string}}
 */
export function gateQuoteNoise(item) {
  const spans = [];
  if (item && item.key_support) spans.push({ what: "key_support", text: item.key_support });
  const ds = (item && item.distractor_support) || [];
  for (const [i, d] of (Array.isArray(ds) ? ds : []).entries()) {
    const t = d && (d.support || d.text || (typeof d === "string" ? d : ""));
    if (t) spans.push({ what: "distractor_support[" + i + "]", text: t });
  }
  if (!spans.length) {
    /* NOTHING TO EXAMINE IS NOT A PASS. An item with no support spans has not been shown clean; it has
     * not been shown at all, and a vacuous pass inflates the apparent coverage of the whole suite. */
    return { id: "quote-noise", pass: null, examined: 0,
      reason: "no support span to examine -- UNASSERTED, not clean" };
  }
  const bad = [];
  for (const s of spans) {
    for (const n of noiseIn(s.text)) {
      bad.push(s.what + " carries " + n.name + " (" + JSON.stringify(n.matched) + "): " + n.why);
    }
  }
  if (bad.length) {
    return { id: "quote-noise", pass: false, examined: spans.length,
      reason: bad.join("; ") + " -- the quote is faithful to a MANGLED source, so `verbatim` passes it" };
  }
  return { id: "quote-noise", pass: true, examined: spans.length,
    reason: spans.length + " support span(s) carry no extraction noise" };
}

/**
 * ============ SERVED FIELDS: THE ONE PLACE NOISE REACHES A CANDIDATE ============
 *
 * Ruled PROMPT-88 s0. `quote-noise` governs ANCHORS, which are internal and never served -- noise there
 * corrupts the audit trail and the reference the text gates compare against, which is bad for different
 * reasons. This governs what a candidate can actually read.
 *
 * WHICH FIELDS ARE SERVED DEPENDS ON THE POOL. A stem and its options are served for every item. An
 * explanation is served for a PRACTICE item and not for a secure one: migration 378 revokes
 * `explanation` from anon and authenticated, and records that every secure row carries
 * visibility='secure' which no read policy matches. So a secure explanation is examined as INTERNAL and
 * a practice explanation as SERVED -- the same text, two severities, decided by one column.
 */
export function servedFields(item, { pool } = {}) {
  const out = [];
  if (item && item.question_text) out.push({ what: "stem", text: item.question_text });
  for (const [i, o] of ((item && item.options) || []).entries()) {
    const t = o && (o.text || "");
    if (t) out.push({ what: "option[" + i + "]", text: t });
  }
  /* the pool decides whether the explanation is served. UNKNOWN pool is treated as SERVED: the safe
   * error is examining a field that turns out to be internal, never skipping one that is served. */
  const secure = String(pool || "") === "secure";
  if (!secure && item && item.explanation) out.push({ what: "explanation", text: item.explanation });
  return out;
}

/**
 * The gate. A hit on any served field is a FAILURE.
 * @returns {{id:string, pass:boolean|null, examined:number, reason:string}}
 */
export function gateServedNoise(item, opts = {}) {
  const spans = servedFields(item, opts);
  if (!spans.length) {
    return { id: "served-noise", pass: null, examined: 0,
      reason: "no served field to examine -- UNASSERTED, not clean" };
  }
  const bad = [];
  for (const s2 of spans) {
    for (const n of noiseIn(s2.text)) {
      bad.push(s2.what + " carries " + n.name + " (" + JSON.stringify(n.matched) + ")");
    }
  }
  if (bad.length) {
    return { id: "served-noise", pass: false, examined: spans.length,
      reason: bad.join("; ") + " -- this text IS served to a candidate" };
  }
  return { id: "served-noise", pass: true, examined: spans.length,
    reason: spans.length + " served field(s) carry no extraction noise" };
}
/** Controls: a positive and a negative case for every signature, plus the vacuous case. */
export function quoteNoiseControls({ quiet = false } = {}) {
  const clean = "The organization shall document a deployment plan and ensure that appropriate " +
    "requirements are met prior to deployment.";
  const cases = [];
  const add = (what, expect, fn) => cases.push([what, expect, fn]);

  /* ---- a clean item passes ---- */
  add("a clean key_support passes", true,
    () => gateQuoteNoise({ key_support: clean }).pass);
  add("clean key and clean distractors pass", true,
    () => gateQuoteNoise({ key_support: clean,
      distractor_support: [{ support: "Event logs shall be enabled when the AI system is in use." }] }).pass);

  /* ---- hyphen-break: positive and negative ---- */
  add("hyphen-break in the KEY is rejected", false,
    () => gateQuoteNoise({ key_support: "based on organizational objectives, docu- mented requirements" }).pass);
  add("hyphen-break in a DISTRACTOR is rejected", false,
    () => gateQuoteNoise({ key_support: clean,
      distractor_support: [{ support: "what AI system techni- cal documentation is needed" }] }).pass);
  add("a legitimate hyphenated compound is NOT a hyphen-break", true,
    () => gateQuoteNoise({ key_support: "a risk-based approach to third-party suppliers" }).pass);
  add("an em-dash list is NOT a hyphen-break", true,
    () => gateQuoteNoise({ key_support: "The AI policy shall: - be available; - be communicated." }).pass);

  /* ---- doubled-word: positive and negative ---- */
  add("doubled-word in the KEY is rejected", false,
    () => gateQuoteNoise({ key_support: "document the AI system design and and development development" }).pass);
  add("doubled-word in a DISTRACTOR is rejected", false,
    () => gateQuoteNoise({ key_support: clean,
      distractor_support: [{ support: "with auditee with auditee participation participation" }] }).pass);
  /* THE THREE-LETTER FLOOR, STATED WITH WHAT IT HIDES. A repeat of one or two letters is not caught, so a
   * doubled "to", "of" or "an" would slip through. That is accepted deliberately: below three letters the
   * detector starts firing on ordinary English ("that that", "had had"), and the floor is the price. Both
   * directions are asserted so nobody has to guess where the line is. */
  add("a TWO-letter repeat is NOT caught -- the floor's cost, declared", true,
    () => gateQuoteNoise({ key_support: "it is up to to the organization to decide" }).pass);
  add("a FOUR-letter repeat IS caught", false,
    () => gateQuoteNoise({ key_support: "that that is the shape of the rule" }).pass);
  add("two different words are not a doubling", true,
    () => gateQuoteNoise({ key_support: "the organization shall determine and document" }).pass);

  /* ---- run-together: positive and negative ---- */
  add("run-together in the KEY is rejected", false,
    () => gateQuoteNoise({ key_support: "System documentation and inforThe organization shall determine" }).pass);
  add("run-together in a DISTRACTOR is rejected", false,
    () => gateQuoteNoise({ key_support: clean,
      distractor_support: [{ support: "Alignment with other organizaThe organization shall determine" }] }).pass);
  add("declared camelCase is NOT a run-together", true,
    () => gateQuoteNoise({ key_support: "practices such as Lean, Agile and DevOps are referenced" }).pass);
  add("a sentence boundary is NOT a run-together", true,
    () => gateQuoteNoise({ key_support: "records shall be retained. The organization shall review them." }).pass);

  /* ---- the third state ---- */
  add("an item with NO support span is UNASSERTED, not a pass", null,
    () => gateQuoteNoise({}).pass);
  add("the unasserted reason says it is not clean", true,
    () => /not clean/.test(gateQuoteNoise({}).reason));
  /* ---- and the real spans from the task 1.3 rerun must still pass ---- */
  add("the four task 1.3 survivors' real key spans all pass", true, () => [
    "At the minimum, this should include system and performance monitoring, repairs, updates and support.",
    "for new AI systems or material enhancements to existing systems.",
    "The organization shall document a deployment plan and ensure that appropriate requirements are met prior to deployment.",
    "To define the criteria and requirements for each stage of the AI system life cycle.",
  ].every((k) => gateQuoteNoise({ key_support: k }).pass === true));

  /* ============ THE THREE NARROWINGS, BOTH DIRECTIONS ============
   * Each was narrowed after the served sweep produced 56 hits of which ZERO were real. The risk of
   * narrowing on a false-positive sweep is over-correction, so every real shape is asserted to survive. */

  /* (1) suspended hyphen vs a real wrap */
  add("a suspended hyphen is NOT a break: 'low- and medium-risk'", true,
    () => gateQuoteNoise({ key_support: "exempts low- and medium-risk outcomes from documentation" }).pass);
  add("'pre- and post-change' is NOT a break", true,
    () => gateQuoteNoise({ key_support: "Compare pre- and post-change feature distributions" }).pass);
  add("Spanish 'corto- o largo-plazo' is NOT a break", true,
    () => gateQuoteNoise({ key_support: "aplica a horizontes corto- o largo-plazo" }).pass);
  add("a REAL wrap is still caught: 'docu- mented'", false,
    () => gateQuoteNoise({ key_support: "based on objectives, docu- mented requirements" }).pass);
  add("a real wrap next to a conjunction elsewhere is still caught", false,
    () => gateQuoteNoise({ key_support: "low- and medium-risk techni- cal documentation" }).pass);

  /* (2) the ASCII word boundary, which split an accented word */
  add("an accented word is NOT a doubling: 'excluidos dos' with an accent", true,
    () => gateQuoteNoise({ key_support: "s\u00e3o explicitamente exclu\u00eddos dos frameworks de governan\u00e7a" }).pass);
  add("'genuinas nas' with an accent is NOT a doubling", true,
    () => gateQuoteNoise({ key_support: "reflete diferen\u00e7as genu\u00ednas nas qualifica\u00e7\u00f5es" }).pass);
  add("a REAL doubling is still caught, accents present or not", false,
    () => gateQuoteNoise({ key_support: "documenta\u00e7\u00e3o and and development development based on" }).pass);
  add("a real doubling of an ACCENTED word is caught", false,
    () => gateQuoteNoise({ key_support: "a organiza\u00e7\u00e3o organiza\u00e7\u00e3o deve documentar" }).pass);

  /* (3) camelCase vs a clause opener */
  add("a product name is NOT a run-together: DataRobot", true,
    () => gateQuoteNoise({ key_support: "Must have 3+ years using DataRobot for model deployment" }).pass);
  add("TensorFlow, SageMaker, LangChain, WebSocket are not run-togethers", true,
    () => gateQuoteNoise({ key_support: "chain outputs with LangChain, deploy via SageMaker over WebSocket to TensorFlow" }).pass);
  add("an exception class name is not a run-together: NullPointerException", true,
    () => gateQuoteNoise({ key_support: "the trace shows a NullPointerException in OrderService" }).pass);
  add("LinkedIn is NOT a run-together -- a two-letter opener cannot discriminate", true,
    () => gateQuoteNoise({ key_support: "a candidate profile listed publicly on LinkedIn and pasted into a tool" }).pass);
  add("a REAL run-together is still caught: 'specThe'", false,
    () => gateQuoteNoise({ key_support: "AI system requirements and specThe organization shall specify" }).pass);
  add("'inforThe' is still caught", false,
    () => gateQuoteNoise({ key_support: "System documentation and inforThe organization shall determine" }).pass);
  add("'commuProcesses' is still caught", false,
    () => gateQuoteNoise({ key_support: "in the information and commuProcesses and procedures shall be" }).pass);
  /* ---- served-noise: the same signatures, on the fields a candidate reads ---- */
  const cleanStem = "An organization deploys a model without a monitoring plan. What does the standard require?";
  add("a clean served item passes", true, () => gateServedNoise({ question_text: cleanStem,
    options: [{ text: "Define documented monitoring elements." }, { text: "Nothing further." }] },
  { pool: "secure" }).pass);
  add("noise in the STEM is a failure", false, () => gateServedNoise({
    question_text: "What does the docu- mented requirement say?", options: [{ text: "A" }] }).pass);
  add("noise in an OPTION is a failure", false, () => gateServedNoise({
    question_text: cleanStem, options: [{ text: "System documentation and inforThe organization shall" }] }).pass);
  add("noise in a PRACTICE explanation is a failure", false, () => gateServedNoise({
    question_text: cleanStem, options: [{ text: "A" }],
    explanation: "design and and development development based on objectives" }, { pool: "practice" }).pass);
  add("the SAME explanation in a SECURE item is not a served failure", true, () => gateServedNoise({
    question_text: cleanStem, options: [{ text: "A" }],
    explanation: "design and and development development based on objectives" }, { pool: "secure" }).pass);
  add("an UNKNOWN pool treats the explanation as served -- the safe error", false, () => gateServedNoise({
    question_text: cleanStem, options: [{ text: "A" }],
    explanation: "design and and development development based on objectives" }).pass);
  add("an item with no served field is UNASSERTED, not a pass", null,
    () => gateServedNoise({}).pass);
  const fails = [];
  for (const [what, expect, fn] of cases) {
    let got;
    try { got = fn(); } catch (e) { got = "threw: " + e.message; }
    if (got !== expect) fails.push(what + "   expected " + JSON.stringify(expect) + ", got " + JSON.stringify(got));
  }
  if (!quiet) console.log("quote-noise controls: " + cases.length + " case(s), " + fails.length + " fail");
  return { examined: cases.length, fails };
}
