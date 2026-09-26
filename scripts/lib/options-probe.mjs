/**
 * options-probe.mjs -- what would a test-wise candidate pick from the OPTIONS ALONE?
 *
 * No stem. No passages. No key. Four option texts and nothing else.
 *
 * ============ WHY THIS IS NOT A HARDER GATE ============
 *
 * The director's position, and Juan's: the exam should be fair and feel good to take. This probe
 * does not look for items that are too easy -- it looks for items a candidate with ZERO
 * KNOWLEDGE can answer, which is a different thing. Item #15 of the first pilot is the example:
 * all three distractors ended with the same clause about what the definition preserves, and the
 * stem excluded exactly that, so the key was findable without knowing anything about the
 * subject. An item like that does not make an exam easy. It makes the score mean nothing.
 *
 * The remedy is never to add trickery, lengthen the stem or raise difficulty. It is to rewrite
 * the cue out. Difficulty is set by the cut score.
 *
 * ============ FLAGGED, NEVER REJECTED ============
 *
 * A model picking the key from four options is not proof of a cue: with four options it is right
 * one time in four by luck, and it will always produce a story about why. So this flags for a
 * human read and only when BOTH hold:
 *
 *   it picked the key, AND it named a CONCRETE structural cue
 *
 * "It sounded most complete" is not concrete. The cue has to be checkable -- a shared phrase, a
 * length difference, the only negation, the only one that hedges. That is how #16's odd-one-out
 * by verdict gets caught without a brittle rule: three options said "carries over unchanged" and
 * only the key said "redo", which no lexical test of mine would have found.
 */

/** The payload: option texts only, in the item's own order. */
export function optionsPayload(item) {
  return {
    options: (item.options || []).map((o, i) => ({
      label: String.fromCharCode(65 + i), text: String((o && o.text) || ""),
    })),
  };
}

/**
 * Assert the probe is as blind as it claims. Structural, not a word scan -- a guard that
 * searches prose for "correct" fires on an option about correctness, which is the defect this
 * repository records and which the blind solver's first version committed.
 */
const ALLOWED_KEYS = new Set(["options", "label", "text"]);
export function assertOptionsOnly(payload, item) {
  const keys = new Set();
  const walk = (n) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (n && typeof n === "object") for (const k of Object.keys(n)) { keys.add(k); walk(n[k]); }
  };
  walk(payload);
  const extra = [...keys].filter((k) => !ALLOWED_KEYS.has(k));
  const bad = [];
  if (extra.length) bad.push("field(s) outside the allowlist: " + extra.join(", "));
  const flat = JSON.stringify(payload);
  if (item.question_text && String(item.question_text).length >= 30 &&
      flat.includes(String(item.question_text).slice(0, 30))) {
    bad.push("the STEM is in the payload -- this probe must not see it");
  }
  if (item.explanation && String(item.explanation).length >= 30 &&
      flat.includes(String(item.explanation).slice(0, 30))) {
    bad.push("the explanation is in the payload");
  }
  for (const o of (payload && payload.options) || []) {
    for (const k of Object.keys(o || {})) {
      if (/correct|is_key|answer/i.test(k)) bad.push("an option carries the property " + JSON.stringify(k));
    }
  }
  if (bad.length) throw new Error("OPTIONS PROBE PAYLOAD IS NOT OPTIONS-ONLY: " + bad.join("; "));
  return true;
}

export const OPTIONS_PROBE_SYSTEM = `You are shown ONLY the four answer options of a
multiple-choice question. You are NOT shown the question. You do not know the subject.

Your job is to guess which option is the intended answer using ONLY the SHAPE of the options --
the kind of guessing a test-wise candidate does when they do not know the material.

Return ONE JSON object and nothing else:

{
  "pick": "A",
  "cue": "the one-sentence structural reason, or null",
  "cue_kind": "shared-phrase" | "length" | "only-negation" | "only-hedged" | "odd-verdict" | "grammar" | "none",
  "confident": true | false
}

RULES
- "cue" must be CHECKABLE by someone looking at the options. "It sounded most complete" is not a
  cue. "Three options end with the same clause and one does not" is.
- If nothing about the shape favours any option, set "cue" to null, "cue_kind" to "none" and
  "confident" to false, and pick whichever you like. SAYING THERE IS NO CUE IS THE USEFUL
  ANSWER most of the time -- a well-built item has none.
- Do not guess the subject matter. Do not reason about which statement is true.`;

export function optionsProbeUser(payload) {
  return "OPTIONS\n\n" + JSON.stringify(payload, null, 1);
}

/**
 * The verdict. FLAG only when it picked the key AND named a concrete cue.
 * `could-not-run` is its own state: a malformed reply is not a clean item.
 */
export function optionsProbeVerdict(parsed, keyLabel) {
  if (!parsed || typeof parsed !== "object") {
    return { state: "could-not-run", reason: "the probe returned nothing parseable" };
  }
  const pick = String(parsed.pick || "").trim().toUpperCase().slice(0, 1);
  if (!/^[A-Z]$/.test(pick)) {
    return { state: "could-not-run", reason: "the probe named no option" };
  }
  const cue = parsed.cue == null ? null : String(parsed.cue).trim();
  const kind = String(parsed.cue_kind || "none").trim();
  const concrete = !!cue && cue.length >= 12 && kind !== "none";
  if (pick !== keyLabel) {
    return { state: "no-cue", pick, cue, cue_kind: kind,
      reason: "picked " + pick + ", not the key -- the options do not give it away" };
  }
  if (!concrete) {
    return { state: "no-cue", pick, cue, cue_kind: kind,
      reason: "picked the key but named no concrete cue -- one in four is luck, not evidence" };
  }
  return { state: "flag", pick, cue, cue_kind: kind,
    reason: "picked the key from the options alone and named a cue (" + kind + "): " + cue };
}

/** Controls, both directions, including the third state. */
export function optionsProbeControls() {
  const item = {
    question_text: "A stem long enough to be recognised if it ever leaked into the payload.",
    options: [{ text: "The right one", is_correct: true }, { text: "A wrong one" }],
    explanation: "An explanation long enough to be recognised if it ever leaked into the payload.",
  };
  const cases = [
    ["payload carries the option texts", () => optionsPayload(item).options.length === 2, true],
    ["payload carries no is_correct", () => JSON.stringify(optionsPayload(item)).includes("is_correct"), false],
    ["assertOptionsOnly accepts a clean payload", () => assertOptionsOnly(optionsPayload(item), item), true],
    ["assertOptionsOnly refuses a leaked stem", () => {
      try { assertOptionsOnly({ ...optionsPayload(item), q: item.question_text }, item); return "no throw"; }
      catch { return "threw"; }
    }, "threw"],
    ["prose containing the word \"correct\" is not a leak", () => {
      const p = optionsPayload({ options: [{ text: "The correct and complete register of assets" }, { text: "Another" }] });
      try { assertOptionsOnly(p, { question_text: "unrelated stem text that is long enough" }); return "accepted"; }
      catch (e) { return "threw: " + e.message; }
    }, "accepted"],
    ["flags when it picks the key AND names a cue", () =>
      optionsProbeVerdict({ pick: "A", cue: "three options end with the same clause and one does not", cue_kind: "shared-phrase" }, "A").state, "flag"],
    ["does not flag on a bare pick with no cue", () =>
      optionsProbeVerdict({ pick: "A", cue: null, cue_kind: "none" }, "A").state, "no-cue"],
    ["does not flag on a vague cue", () =>
      optionsProbeVerdict({ pick: "A", cue: "felt right", cue_kind: "length" }, "A").state, "no-cue"],
    ["does not flag when it picks a distractor", () =>
      optionsProbeVerdict({ pick: "C", cue: "three options end with the same clause", cue_kind: "shared-phrase" }, "A").state, "no-cue"],
    ["a malformed reply is could-not-run", () => optionsProbeVerdict(null, "A").state, "could-not-run"],
  ];
  const fails = [];
  for (const [name, fn, want] of cases) {
    let got;
    try { got = fn(); } catch (e) { got = "threw: " + (e && e.message); }
    if (got !== want) fails.push(name + ": expected " + JSON.stringify(want) + ", got " + JSON.stringify(got));
  }
  return { examined: cases.length, fails };
}
