/**
 * blind-solver.mjs -- a second model call that is given the passages and the item, and
 * NOT the key, NOT the explanation, and NOT the generation context.
 *
 * ============ WHY IT HAS TO BE BLIND, AND WHAT THAT IS WORTH ============
 *
 * The existing pipeline's `critiqueAndRevise` is a hostile reviewer holding the same
 * memory as the writer, so it can catch an incoherent item and cannot catch a false fact.
 * It is also shown the answer, which makes agreement worthless: a reviewer told which
 * option is correct will explain why it is correct.
 *
 * This one has to WORK THE ITEM OUT from the passages. That gives two signals neither the
 * writer nor a code gate can produce:
 *
 *   it answers differently from the key  -- the item is ambiguous, mis-keyed, or the key is
 *                                           not actually supported by what the item quotes
 *   it names a second defensible option  -- the item has two right answers, which is the
 *                                           defect a single-key format cannot survive
 *
 * ============ THE CREDENTIAL THE TEST HOLDS IS THE HYPOTHESIS ============
 *
 * This repository records that rule about privileges; it applies to INFORMATION here. A
 * solver that can see `is_correct`, the explanation, or the writer's reasoning is not
 * measuring solvability, it is measuring reading. So the payload is built by an explicit
 * allowlist -- stem and option texts, nothing else -- and `assertBlind` re-reads the
 * finished payload and throws if the key text, the correct index or the explanation appear
 * anywhere in it. A leak would make every agreement meaningless and nothing about the
 * output would look wrong.
 */

/** Build the payload. ALLOWLIST: only the fields named here can reach the solver. */
export function blindPayload(item) {
  const opts = (item.options || []).map((o, i) => ({
    label: String.fromCharCode(65 + i),
    text: String((o && o.text) || ""),
  }));
  return { question: String(item.question_text || ""), options: opts };
}

/**
 * Re-read the finished payload and refuse to send it if anything identifying the key is
 * present. A denylist on top of an allowlist, deliberately: the allowlist is the design and
 * this is the check that the design was implemented.
 */
/* KEYS, NOT WORDS. The first version of this scanned the serialised payload for
 * /is_correct|correct_answer|explanation|key_support/ and aborted the 40-item pilot on item
 * three -- because an option's TEXT contained one of those words. A distractor reading "the
 * explanation must be documented" is not a leak; it is an item about documentation.
 *
 * CLAUDE.md records this exact defect: guards match code shapes, never English words -- a
 * check for `to anon` once aborted on a comment saying "no grant to anon". I committed it
 * again here, inside the guard whose whole job is to be trustworthy.
 *
 * So the structural half walks the payload's PROPERTY NAMES against an allowlist, which is
 * what "the payload carries a key-bearing field" actually means, and the content half stays
 * a VALUE comparison against this item's own explanation and anchor -- those are real leak
 * tests, because they ask whether this item's key-bearing text is present, not whether a
 * word is. */
const ALLOWED_KEYS = new Set(["question", "options", "label", "text"]);

function payloadKeys(node, out = new Set()) {
  if (Array.isArray(node)) { for (const v of node) payloadKeys(v, out); return out; }
  if (node && typeof node === "object") {
    for (const k of Object.keys(node)) { out.add(k); payloadKeys(node[k], out); }
  }
  return out;
}

export function assertBlind(payload, item) {
  const bad = [];
  const keys = [...payloadKeys(payload)];
  const extra = keys.filter((k) => !ALLOWED_KEYS.has(k));
  if (extra.length) {
    bad.push("the payload carries field(s) outside the allowlist: " + extra.join(", "));
  }
  /* Value comparisons, on this item's own key-bearing text. A prefix rather than the whole
   * string, because a leak would carry the opening of it. */
  const flat = JSON.stringify(payload);
  if (item.explanation && String(item.explanation).length >= 40 &&
      flat.includes(String(item.explanation).slice(0, 40))) {
    bad.push("this item's explanation text is in the payload");
  }
  if (item.key_support && String(item.key_support).length >= 40 &&
      flat.includes(String(item.key_support).slice(0, 40))) {
    bad.push("this item's key_support anchor is in the payload");
  }
  /* And the option objects must not carry a correctness flag, whatever it is called. This is
   * a property test, so it cannot fire on prose. */
  for (const o of (payload && payload.options) || []) {
    for (const k of Object.keys(o || {})) {
      if (/correct|is_key|answer/i.test(k)) bad.push("an option carries the property " + JSON.stringify(k));
    }
  }
  /* The option ORDER must not encode the answer either. Nothing here reorders options, so
   * this asserts what it relies on rather than what it does: the solver is given the item's
   * own order, and the caller is responsible for that order not being "key first". */
  if (bad.length) throw new Error("BLIND SOLVER PAYLOAD IS NOT BLIND: " + bad.join("; "));
  return true;
}

export const SOLVER_SYSTEM = `You are sitting an examination. You are given some passages from a
published standard and one multiple-choice question. You have not seen the question before and
nobody has told you the answer.

Answer using ONLY the passages provided. If the passages do not settle the question, say so.

Return ONE JSON object and nothing else:

{
  "answer": "A",
  "answer_reason": "one sentence, citing the passage that settles it",
  "second_defensible": "B" | null,
  "second_defensible_reason": "one sentence, or null",
  "settled_by_passages": true | false
}

RULES FOR "second_defensible":
- Name an option only if a competent candidate could defend it from these passages. An option
  that is merely plausible-sounding is NOT defensible; an option that the passages also support,
  or that the question does not exclude, IS.
- If exactly one option is supportable, "second_defensible" is null.

RULES FOR "settled_by_passages":
- false if answering required knowledge that is not in the passages. Say false rather than
  guessing; an honest "not settled" is more useful than a confident answer.`;

export function solverUser(payload, passages) {
  const src = passages.map((p) =>
    "--- " + p.source_id + " " + p.edition + ", clause " + p.clause +
    (p.title ? " (" + p.title + ")" : "") + " [" + p.normative + "] ---\n" + p.text
  ).join("\n\n");
  return "PASSAGES\n\n" + src + "\n\nQUESTION\n\n" + JSON.stringify(payload, null, 1);
}

/**
 * The verdict. An item survives only if the solver picked the key AND named no second
 * defensible option AND said the passages settle it.
 *
 * A SOLVER THAT COULD NOT ANSWER IS NOT A SOLVER THAT DISAGREED. `could-not-run` is its own
 * state -- a malformed response, an API failure -- and it must never be folded into either
 * verdict. Folding it into "rejected" would blame the item for the transport; folding it into
 * "accepted" would clear an item nobody checked.
 */
export function solverVerdict(parsed, keyLabel) {
  if (!parsed || typeof parsed !== "object") {
    return { state: "could-not-run", reason: "the solver returned nothing parseable" };
  }
  const ans = String(parsed.answer || "").trim().toUpperCase().slice(0, 1);
  if (!/^[A-Z]$/.test(ans)) {
    return { state: "could-not-run", reason: "the solver named no option" };
  }
  if (parsed.settled_by_passages === false) {
    return { state: "rejected", reason: "the solver says the passages do not settle the question: " +
      (parsed.answer_reason || "no reason given") };
  }
  if (ans !== keyLabel) {
    return { state: "rejected", reason: "the solver answered " + ans + " and the key is " + keyLabel +
      " -- " + (parsed.answer_reason || "no reason given") };
  }
  const second = parsed.second_defensible == null ? null
    : String(parsed.second_defensible).trim().toUpperCase().slice(0, 1);
  if (second && /^[A-Z]$/.test(second) && second !== keyLabel) {
    return { state: "rejected", reason: "the solver picked the key but calls " + second +
      " defensible: " + (parsed.second_defensible_reason || "no reason given") };
  }
  return { state: "accepted", reason: "solved to the key from the passages, no second defensible option" };
}

/** Controls. Both directions, including the third state. */
export function blindSolverControls() {
  const item = {
    question_text: "Which requirement applies?",
    options: [{ text: "The right one", is_correct: true }, { text: "A wrong one" }],
    explanation: "Because clause 9.2.2 says so and this sentence must never reach the solver.",
    key_support: "The organization shall plan, establish, implement and maintain an audit programme",
  };
  const cases = [
    ["payload carries the stem", () => blindPayload(item).question === item.question_text, true],
    ["payload carries no is_correct", () => JSON.stringify(blindPayload(item)).includes("is_correct"), false],
    ["assertBlind accepts a clean payload", () => assertBlind(blindPayload(item), item), true],
    ["assertBlind refuses a leaked explanation", () => {
      try { assertBlind({ ...blindPayload(item), note: item.explanation }, item); return "did not throw"; }
      catch { return "threw"; }
    }, "threw"],
    ["assertBlind refuses a leaked anchor", () => {
      try { assertBlind({ ...blindPayload(item), src: item.key_support }, item); return "did not throw"; }
      catch { return "threw"; }
    }, "threw"],

    /* ============ THE FALSE POSITIVE THAT ABORTED THE PILOT ============
     * An item's own prose may contain any English word, including the words this guard's
     * first version searched for. Both directions, because a guard loosened without a
     * demonstration that it still catches the real thing is a guard we have merely stopped
     * hearing from. */
    ["prose containing the word \"explanation\" is not a leak", () => {
      const p = blindPayload({
        question_text: "Which record must carry an explanation of the decision?",
        options: [{ text: "The documented explanation retained as evidence", is_correct: true },
          { text: "A verbal briefing with no correct answer recorded" }],
      });
      try { assertBlind(p, { explanation: "unrelated", key_support: "unrelated" }); return "accepted"; }
      catch (e) { return "threw: " + e.message; }
    }, "accepted"],
    ["an option object carrying is_correct IS a leak", () => {
      const p = blindPayload(item);
      p.options[0].is_correct = true;
      try { assertBlind(p, item); return "did not throw"; } catch { return "threw"; }
    }, "threw"],
    ["a field outside the allowlist IS a leak", () => {
      try { assertBlind({ ...blindPayload(item), generation_context: "task 9.2" }, item); return "did not throw"; }
      catch { return "threw"; }
    }, "threw"],
    ["accepts a solver that matches the key with no second", () =>
      solverVerdict({ answer: "A", settled_by_passages: true, second_defensible: null }, "A").state, "accepted"],
    ["rejects a solver that answers differently", () =>
      solverVerdict({ answer: "B", settled_by_passages: true, second_defensible: null }, "A").state, "rejected"],
    ["rejects a second defensible option", () =>
      solverVerdict({ answer: "A", settled_by_passages: true, second_defensible: "C" }, "A").state, "rejected"],
    ["rejects an unsettled question", () =>
      solverVerdict({ answer: "A", settled_by_passages: false }, "A").state, "rejected"],
    ["a malformed response is could-not-run, not a rejection", () =>
      solverVerdict(null, "A").state, "could-not-run"],
    ["a response naming no option is could-not-run", () =>
      solverVerdict({ answer: "", settled_by_passages: true }, "A").state, "could-not-run"],
  ];
  const fails = [];
  for (const [name, fn, want] of cases) {
    let got;
    try { got = fn(); } catch (e) { got = "threw: " + (e && e.message); }
    if (got !== want) fails.push(name + ": expected " + JSON.stringify(want) + ", got " + JSON.stringify(got));
  }
  return { examined: cases.length, fails };
}
