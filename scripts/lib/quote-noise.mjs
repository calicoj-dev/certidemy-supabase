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
export const NOISE = [
  ["hyphen-break", /[A-Za-z]-\s+[a-z]/,
    "a word broken across a line join, as in \"docu- mented\""],
  ["doubled-word", /\b([A-Za-z]{3,})\s+\1\b/,
    "the same word twice, as in \"and and development development\""],
  ["run-together", /[a-z]{2}[A-Z][a-z]{2}/,
    "two words joined with no space at a line join, as in \"specThe\""],
];

/* camelCase terms that are NOT damage. Declared by name -- inferring them would be the lexical-proxy trap,
 * and the cost of guessing is a real run-together excused. Shared shape with the census's own list. */
export const CAMEL_OK = [
  "DevOps", "DevGuide", "DevSecOps", "GitHub", "OWASP", "PowerShell", "JavaScript", "TypeScript",
  "MacOS", "iOS", "eIDAS", "ePrivacy", "eHealth",
];

/** Every noise signature present in one span, with the matched text. */
export function noiseIn(span) {
  const raw = String(span || "");
  let scrub = raw;
  for (const w of CAMEL_OK) scrub = scrub.split(w).join(" ".repeat(w.length));
  const out = [];
  for (const [name, re, why] of NOISE) {
    const m = re.exec(name === "run-together" ? scrub : raw);
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

  const fails = [];
  for (const [what, expect, fn] of cases) {
    let got;
    try { got = fn(); } catch (e) { got = "threw: " + e.message; }
    if (got !== expect) fails.push(what + "   expected " + JSON.stringify(expect) + ", got " + JSON.stringify(got));
  }
  if (!quiet) console.log("quote-noise controls: " + cases.length + " case(s), " + fails.length + " fail");
  return { examined: cases.length, fails };
}
