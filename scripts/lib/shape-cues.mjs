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
const keyIndex = (item) => {
  if (typeof item.correct_index === "number") return item.correct_index;
  const i = (item.options || []).findIndex((o) => o && o.is_correct);
  return i;
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

export const SHAPE_CUES = [clangCue, agreementCue, oppositePairCue, keyLengthCue];

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

  return { examined: 11, fails };
}
