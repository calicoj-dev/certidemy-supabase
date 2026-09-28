/**
 * shape-cues.mjs - four CODE checks for classic item-writing cues.
 *
 * EVERY ONE OF THESE FLAGS. NONE OF THEM REJECTS. They feed the de-cue retry, which rewrites
 * distractors only; a flag that survives the retry is reported and the item still ships.
 *
 * ============ WHY CODE AND NOT THE PROBE ============
 *
 * The options probe is a model call, and measured against the authored bank it picks the key 98
 * percent of the time -- so it is largely reading examiner convention rather than a defect. These
 * four are the opposite kind of instrument: each names a MECHANICAL property of the option set that
 * item-writing literature has called a flaw for fifty years, and each is decidable without a model.
 *
 * ============ EACH ONE'S FIRING COUNT IS PART OF ITS DEFINITION ============
 *
 * A guard that fires on the normal case is deleted by the first person it inconveniences, and its
 * deletion takes the real assertion with it. So every check here is written to fire on a MINORITY and
 * its count on the live corpus is reported in the same commit that adds it. Where a wider definition
 * was available and fired on nearly everything, the narrow one is used and the wide count is recorded
 * beside it so the narrowing is visible rather than silent.
 */

/* Function words and examiner boilerplate. A "distinctive" stem word must not be one of these -- a
 * clang check keyed on "the" fires on every item ever written. */
const STOP = new Set(`a an and are as at be been being but by can cannot could did do does doing for
from had has have having he her him his how i if in into is it its may might must my no nor not of
off on once only or other our out over own same shall she should so some such than that the their
them then there these they this those through to too under until up very was we were what when where
which while who whom why will with would you your organization organizations which_of following
must_be`.split(/\s+/).filter(Boolean));

const words = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean);
const contentWords = (s) => words(s).filter((w) => w.length >= 5 && !STOP.has(w));

const optTexts = (item) => (item.options || []).map((o) => String((o && o.text) || ""));
/* ============ THE KEY IS FOUND IN THREE SHAPES, AND MISSING THE THIRD MADE EVERY RULE SILENT ======
 *
 * Generator items carry `correct_index`. Gated artifacts carry `is_correct` on the option. A row read
 * from `quiz_questions` carries NEITHER: the key is `correct_answer`, a jsonb ARRAY OF OPTION IDS
 * (`["d"]`), and the options are `{id, text}`.
 *
 * So every one of these rules returned null for every live row, and `shapeCues` returned an empty list
 * -- which is indistinguishable from a clean item. It was caught because the director found a cue by
 * eye in AIE-I item 560dcf1d (three distractors opening `Proceed`, the key opening `Use AI`), the
 * odd-verdict control built from that exact shape fired, and the live row did not. Two instruments
 * disagreeing about one item.
 *
 * A bank-wide count run before this fix would have reported ZERO cues across every certification and
 * read as a clean bank.
 */
const keyIndex = (item) => {
  if (typeof item.correct_index === "number") return item.correct_index;
  const flagged = (item.options || []).findIndex((o) => o && o.is_correct);
  if (flagged >= 0) return flagged;
  const ca = item.correct_answer;
  const ids = Array.isArray(ca) ? ca.map(String) : (typeof ca === "string" ? [ca] : []);
  if (ids.length !== 1) return -1;           // a multi-select has no single key to be long or hedged
  return (item.options || []).findIndex((o) => o && String(o.id) === ids[0]);
};

/**
 * CLANG. The key repeats a distinctive word from the stem that NO distractor repeats.
 *
 * The classic form: an examiner writes the key by restating the stem and the distractors from
 * scratch, so a content word echoes from stem to key and nowhere else. A candidate who knows nothing
 * matches the words.
 *
 * NARROWED DELIBERATELY: a word counts only if it is >= 5 characters, not a function word, and
 * absent from EVERY distractor. The wide form -- any shared token -- fires on almost everything,
 * because an option set about one subject shares its subject's vocabulary.
 */
export function clangCue(item) {
  const ki = keyIndex(item);
  const texts = optTexts(item);
  if (ki < 0 || texts.length < 2) return null;
  const stem = new Set(contentWords(item.question_text));
  if (!stem.size) return null;
  const keyW = new Set(contentWords(texts[ki]));
  const distractorW = texts.map((t, i) => (i === ki ? null : new Set(contentWords(t)))).filter(Boolean);
  const echoes = [...keyW].filter((w) => stem.has(w) && distractorW.every((d) => !d.has(w)));
  if (!echoes.length) return null;
  return { id: "clang", cue: "the key echoes " + echoes.slice(0, 4).map((w) => JSON.stringify(w)).join(", ")
    + " from the stem and no distractor does", words: echoes };
}

/**
 * GRAMMATICAL AGREEMENT. The stem's last word forces an article or a number that only the key fits.
 *
 * Two forms, both mechanical:
 *   ARTICLE  the stem ends in "a" or "an", which fixes whether the option may start with a vowel
 *            sound. If exactly one option fits, the grammar answers the question.
 *   NUMBER   the stem's trailing verb is singular or plural and only the key's head noun agrees.
 *
 * The number arm is deliberately limited to the clearest signal -- a trailing "are"/"is" -- because
 * inferring the head noun of an arbitrary option needs a parser, and a guess there would be the
 * lexical-proxy error this repository already records.
 */
export function agreementCue(item) {
  const ki = keyIndex(item);
  const texts = optTexts(item);
  if (ki < 0 || texts.length < 2) return null;
  const stem = String(item.question_text || "").trim().replace(/[\s:?.]+$/, "");
  const last = words(stem).slice(-1)[0] || "";
  const firstWord = (t) => (words(t)[0] || "");

  if (last === "a" || last === "an") {
    const wantsVowel = last === "an";
    const fits = texts.map((t) => /^[aeiou]/.test(firstWord(t)) === wantsVowel);
    if (fits[ki] && fits.filter(Boolean).length === 1) {
      return { id: "agreement", cue: "the stem ends in " + JSON.stringify(last) +
        " and only the key begins with " + (wantsVowel ? "a vowel" : "a consonant") };
    }
  }
  if (last === "are" || last === "is") {
    const plural = (t) => /s\b/.test(firstWord(t)) && !/ss\b/.test(firstWord(t));
    const wantPlural = last === "are";
    const fits = texts.map((t) => plural(t) === wantPlural);
    if (fits[ki] && fits.filter(Boolean).length === 1) {
      return { id: "agreement", cue: "the stem ends in " + JSON.stringify(last) +
        " and only the key's first word agrees in number" };
    }
  }
  return null;
}

const NEG = /\b(not|no|never|cannot|can't|without|neither|nor)\b/;
/**
 * OPPOSITE PAIR. Two options are direct negations of each other and one of them is the key.
 *
 * A candidate who spots the pair knows the answer is one of the two, which halves the field, and
 * examiners who write a pair usually key one of them. The test is textual: the two options share most
 * of their distinctive vocabulary and differ in POLARITY.
 *
 * "Not only", "not just" and "not limited to" are excluded -- they WIDEN scope rather than negate a
 * verdict, which is the same false positive the odd-one-out rule was corrected for.
 */
export function oppositePairCue(item) {
  const ki = keyIndex(item);
  const texts = optTexts(item);
  if (ki < 0 || texts.length < 3) return null;
  const widener = /\bnot (only|just|limited to)\b/;
  const polarity = (t) => (NEG.test(t.toLowerCase()) && !widener.test(t.toLowerCase())) ? 1 : 0;
  const set = texts.map((t) => new Set(contentWords(t)));
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      if (polarity(texts[i]) === polarity(texts[j])) continue;
      if (i !== ki && j !== ki) continue;
      const a = set[i], b = set[j];
      const smaller = a.size <= b.size ? a : b;
      if (smaller.size < 3) continue;
      const shared = [...smaller].filter((w) => (smaller === a ? b : a).has(w)).length;
      /* Half the smaller option's distinctive words, which is the relative form: an absolute count
       * would select by length rather than by similarity. */
      if (shared >= Math.max(3, Math.ceil(smaller.size / 2))) {
        return { id: "opposite-pair", cue: "options " + String.fromCharCode(65 + i) + " and " +
          String.fromCharCode(65 + j) + " are the same statement in opposite polarity, and one is the key" };
      }
    }
  }
  return null;
}

export const KEY_LENGTH_TOLERANCE = 1.25;
/**
 * KEY LENGTH. The key may not exceed 1.25x the MEDIAN distractor length, in words.
 *
 * The median rather than the mean, because one very long distractor would otherwise licence a long
 * key -- and it is length in WORDS rather than characters, since that is what a candidate scanning
 * the option set actually sees.
 */
export function keyLengthCue(item) {
  const ki = keyIndex(item);
  const texts = optTexts(item);
  if (ki < 0 || texts.length < 3) return null;
  const len = (t) => words(t).length;
  const keyLen = len(texts[ki]);
  const others = texts.filter((_, i) => i !== ki).map(len).sort((a, b) => a - b);
  if (!others.length) return null;
  const mid = others.length % 2
    ? others[(others.length - 1) / 2]
    : (others[others.length / 2 - 1] + others[others.length / 2]) / 2;
  if (!mid) return null;
  const ratio = keyLen / mid;
  if (ratio <= KEY_LENGTH_TOLERANCE) return null;
  return { id: "key-length", cue: "the key is " + keyLen + " words against a median distractor of " +
    mid + " (" + ratio.toFixed(2) + "x, tolerance " + KEY_LENGTH_TOLERANCE + "x)", ratio };
}

/* ============ ONLY-HEDGED ============
 *
 * Two shapes, and they are the same cue seen from either end: the option set makes the key the only
 * CAUTIOUS one, or the only one that is not ABSOLUTE. Either way a candidate who knows nothing picks
 * the measured-sounding option, which is examiner convention rather than knowledge.
 *
 * Both arms require the asymmetry to be TOTAL -- every distractor on one side, the key alone on the
 * other. A 2-of-3 split is ordinary English; the cue is the clean sweep. That is the same narrowing
 * the cue guard's ABS_WORDS arm already uses, and CLAUDE.md records why: a partial asymmetry fires on
 * most well-written items.
 */
const HEDGES = [
  /\bmay\b/i, /\bmight\b/i, /\bcan\b/i, /\bcould\b/i, /\btypically\b/i, /\bgenerally\b/i,
  /\busually\b/i, /\bwhere appropriate\b/i, /\bas needed\b/i, /\bin most cases\b/i,
];
const ABSOLUTES = [
  /\balways\b/i, /\bnever\b/i, /\ball\b/i, /\bonly\b/i, /\bmust\b/i, /\bentirely\b/i,
  /\bexclusively\b/i, /\bany\b/i,
];
const hasAny = (res, t) => res.some((re) => re.test(String(t || "")));
const whichAny = (res, t) => res.filter((re) => re.test(String(t || "")))
  .map((re) => String(re).replace(/^\/\\b|\\b\/i$/g, "").replace(/\\s/g, " "));

export function onlyHedgedCue(item) {
  const ki = keyIndex(item);
  const texts = optTexts(item);
  if (ki < 0 || texts.length < 3) return null;
  const key = texts[ki];
  const distractors = texts.filter((_, i) => i !== ki);

  if (hasAny(HEDGES, key) && distractors.every((t) => !hasAny(HEDGES, t))) {
    return { id: "only-hedged", arm: "hedge",
      cue: "the key is the only hedged option (" + whichAny(HEDGES, key).join(", ") + ")" };
  }
  /* The mirror: the key is the only option carrying NO absolute. */
  if (!hasAny(ABSOLUTES, key) && distractors.length >= 3 && distractors.every((t) => hasAny(ABSOLUTES, t))) {
    return { id: "only-hedged", arm: "absolute",
      cue: "every distractor carries an absolute and the key carries none (" +
        distractors.map((t) => whichAny(ABSOLUTES, t)[0]).join(", ") + ")" };
  }
  return null;
}

/* ============ ODD-VERDICT ============
 *
 * Three options open the same way and the key does not, so the option set sorts itself before a
 * candidate reads a word of substance. `Proceed, because...` three times against one `Use AI to
 * organize...` is the live instance -- AIE-I item 560dcf1d, which the director found by eye.
 *
 * ONLY THE 3-VERSUS-1 SHAPE FIRES, and that is the ruling. The 2-2 shape -- the key sharing an opening
 * with one distractor while the other two share a different one -- is not a cue: it gives a candidate
 * a pair to choose between rather than an answer, so firing on it would be firing on the normal case.
 * A 4-option item is therefore the only size this can fire on at all, which is stated rather than
 * implied because every secure item here has four.
 */
const OPENING_STOP = new Set(["the", "a", "an", "it", "is", "this", "that", "to"]);
const opening = (t) => {
  const w = words(t);
  if (!w.length) return null;
  /* One to three words, skipping a leading article so `The reasoning is sound` and `Reasoning is
   * sound` collapse. The phrase is what a candidate's eye lands on, not the determiner. */
  const start = OPENING_STOP.has(w[0]) && w.length > 1 ? 1 : 0;
  return w.slice(start, start + 3).join(" ") || null;
};

export function oddVerdictCue(item) {
  const ki = keyIndex(item);
  const texts = optTexts(item);
  if (ki < 0 || texts.length !== 4) return null;
  const keyOpen = opening(texts[ki]);
  const dOpens = texts.map((t, i) => (i === ki ? null : opening(t))).filter(Boolean);
  if (dOpens.length !== 3 || !keyOpen) return null;

  /* The three distractors must agree with each other and differ from the key. Agreement is on the
   * first token at minimum, and the reported phrase is the longest prefix all three share. */
  const firstTok = (s) => s.split(" ")[0];
  if (new Set(dOpens.map(firstTok)).size !== 1) return null;
  if (firstTok(keyOpen) === firstTok(dOpens[0])) return null;

  let shared = dOpens[0].split(" ");
  for (const o of dOpens.slice(1)) {
    const w = o.split(" ");
    let n = 0;
    while (n < shared.length && n < w.length && shared[n] === w[n]) n++;
    shared = shared.slice(0, n);
  }
  return { id: "odd-verdict",
    cue: "all three distractors open " + JSON.stringify(shared.join(" ")) +
      " and the key opens " + JSON.stringify(keyOpen) };
}

/* ============ REBUTTAL IS A KNOWN GAP, AND IT STAYS ONE ============
 *
 * The third cue type the director found by eye -- the key arguing against a distractor -- is NOT
 * detected here and is not going to be. It needs MEANING: "This option is superior to the one naming
 * the absence of a separate scope entry" is a rebuttal, and no shape distinguishes it from a key that
 * simply explains itself. A shape proxy for it would fire on every well-reasoned key, which is the
 * lexical-proxy error this file's header already warns about.
 *
 * Recorded so its silence is never read as coverage: an item whose only cue is a rebuttal passes all
 * six rules, and only a human read finds it.
 */
export const SHAPE_CUES = [clangCue, agreementCue, oppositePairCue, keyLengthCue,
  onlyHedgedCue, oddVerdictCue];

/** All four, as a flag list. Never a verdict. */
export function shapeCues(item) {
  return SHAPE_CUES.map((f) => f(item)).filter(Boolean);
}

/**
 * CONTROLS, BOTH DIRECTIONS FOR EVERY CHECK. A check that cannot fire is indistinguishable from one
 * that fired and found nothing, and a check that fires on the clean fixture is a guard that will be
 * deleted. Each case below is constructed, so no live row has to stay defective for a control to hold.
 */
export function shapeCueControls() {
  const fails = [];
  const mk = (stem, opts, ki) => ({
    question_text: stem,
    options: opts.map((t, i) => ({ text: t, is_correct: i === ki })),
    correct_index: ki,
  });
  const fires = (fn, item, label) => { if (!fn(item)) fails.push(label + ": expected a flag, got none"); };
  const quiet = (fn, item, label) => { const r = fn(item); if (r) fails.push(label + ": expected no flag, got " + r.cue); };

  /* CLANG */
  fires(clangCue, mk("Which activity supports continual improvement of the management system?",
    ["It drives continual improvement through corrective action",
     "It records attendance at briefings", "It files supplier invoices", "It archives old hardware"], 0),
    "clang fires");
  quiet(clangCue, mk("Which activity supports continual improvement of the management system?",
    ["Corrective action closes a nonconformity", "Attendance records are filed",
     "Invoices are approved monthly", "Hardware is archived yearly"], 0),
    "clang quiet when the key echoes nothing unique");

  /* AGREEMENT: article. (An earlier draft of this block had a placeholder case followed by
   * `fails.pop()`, which would have silently discarded a REAL failure whenever the placeholder
   * happened to pass. A control that can eat its own findings is worse than no control.) */
  fires(agreementCue, mk("An audit finding must be supported by an",
    ["objective evidence item", "record of the meeting", "summary of the plan", "list of the controls"], 0),
    "agreement fires on the article");
  quiet(agreementCue, mk("An audit finding must be supported by a",
    ["record of the meeting", "summary of the plan", "list of the controls", "note from the auditor"], 0),
    "agreement quiet when every option fits");

  /* OPPOSITE PAIR */
  fires(oppositePairCue, mk("What does clause 7.3 require?",
    ["Persons doing work under the organization's control are made aware of the policy",
     "Persons doing work under the organization's control are not made aware of the policy",
     "Suppliers approve the annual budget", "Auditors publish their own findings"], 0),
    "opposite-pair fires");
  quiet(oppositePairCue, mk("What does clause 7.3 require?",
    ["Awareness of the policy", "Retention of a training record",
     "Approval of the annual budget", "Publication of audit findings"], 0),
    "opposite-pair quiet on four unrelated options");
  quiet(oppositePairCue, mk("Which systems are in scope?",
    ["Systems the organization develops, not only those it buys",
     "Systems the organization develops and those it buys",
     "Only systems bought from a vendor", "Only systems built in house"], 0),
    "opposite-pair quiet on a scope widener");

  /* KEY LENGTH */
  fires(keyLengthCue, mk("Q?", ["one two three four five six seven eight nine ten",
    "one two three", "one two four", "one two five"], 0), "key-length fires");
  /* THE BOUNDARY, not a comfortable middle: 5 words against a median of 4 is EXACTLY 1.25x, which the
   * ruling allows. My first fixture here was 4 against 3 -- 1.33x -- so it failed, correctly, and the
   * fixture was the thing that was wrong. Fixing the tolerance to make a bad fixture pass is how a
   * threshold gets tuned by accident. */
  quiet(keyLengthCue, mk("Q?", ["one two three four five", "one two three four", "one two three five", "one two three six"], 0),
    "key-length quiet at exactly the tolerance");

  /* ONLY-HEDGED, both arms and both directions. */
  fires(onlyHedgedCue, mk("What does the clause require of the review?",
    ["The review may be brought forward where appropriate",
     "The review is held in March", "The review is held in June", "The review is held in September"], 0),
    "only-hedged fires on the hedge arm");
  fires(onlyHedgedCue, mk("Which statement about the control is correct?",
    ["It is applied where the risk assessment indicates a need",
     "It must always be applied to every system", "It applies only to systems that never change",
     "It must be applied to all systems entirely"], 0),
    "only-hedged fires on the absolute arm");
  quiet(onlyHedgedCue, mk("What does the clause require of the review?",
    ["The review may be brought forward", "The review may be deferred once",
     "The review can be split in two", "The review might be combined"], 0),
    "only-hedged quiet when every option hedges");
  quiet(onlyHedgedCue, mk("Which statement about the control is correct?",
    ["It is applied after a risk assessment", "It must always be applied",
     "It applies to two systems", "It is applied yearly"], 0),
    "only-hedged quiet on a 1-of-3 absolute split");

  /* ODD-VERDICT: the live AIE-I shape, plus the 2-2 case that must NOT fire. */
  fires(oddVerdictCue, mk("What should the manager do instead?",
    ["Use AI to organize applicant notes, but keep a qualified human responsible",
     "Proceed, because technical capability confirms AI is the right tool",
     "Proceed, because AI applies criteria consistently",
     "Proceed, because AI rankings are unbiased"], 0),
    "odd-verdict fires on 3 distractors opening alike");
  quiet(oddVerdictCue, mk("What should the manager do instead?",
    ["Proceed, but keep a qualified human responsible", "Proceed, because the tool is capable",
     "Stop, because the tool is unvalidated", "Stop, because the data is stale"], 0),
    "odd-verdict quiet on the 2-2 shape, which is a pair to choose from and not an answer");
  quiet(oddVerdictCue, mk("Which action is required?",
    ["Reclassify the tool as in scope", "Conduct a bias audit first",
     "Request reclassification from the vendor", "Take no action"], 0),
    "odd-verdict quiet when the openings differ");
  /* A LEADING ARTICLE MUST NOT HIDE THE AGREEMENT: `The reasoning is sound` and `Reasoning is sound`
   * collapse to the same opening, which is what a candidate's eye does. */
  fires(oddVerdictCue, mk("How should the finding be judged?",
    ["It rests on a sample the auditor never examined",
     "The reasoning is sound because the criteria were met",
     "Reasoning is sound because the evidence was verified",
     "The reasoning is sound given the programme scope"], 0),
    "odd-verdict fires across a dropped leading article");

  /* ============ THE DATABASE ROW SHAPE, WHICH EVERY RULE WAS BLIND TO ============
   *
   * Same option set as the odd-verdict case above, expressed the way `quiz_questions` stores it:
   * `correct_answer: ["d"]` and options carrying `id`, with no `is_correct` anywhere. Without this
   * control the rules pass their fixtures and return nothing for every live row. */
  const dbRow = {
    question_text: "What should the manager do instead?",
    correct_answer: ["d"],
    options: [
      { id: "a", text: "Proceed, because technical capability confirms AI is the right tool" },
      { id: "b", text: "Proceed, because AI applies criteria consistently" },
      { id: "c", text: "Proceed, because AI rankings are unbiased" },
      { id: "d", text: "Use AI to organize applicant notes, but keep a qualified human responsible" },
    ],
  };
  fires(oddVerdictCue, dbRow, "odd-verdict fires on a DATABASE row (correct_answer + option ids)");
  /* And a multi-select has no single key, so the rules abstain rather than picking one. */
  quiet(oddVerdictCue, { ...dbRow, correct_answer: ["c", "d"] },
    "a multi-select row must not be scored as if it had one key");

  return { examined: 21, fails };
}
