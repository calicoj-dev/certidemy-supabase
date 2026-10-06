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
  const flat = JSON.stringify(payload);
  /* ---- FIDELITY FIRST: is the payload exactly the item's own visible text? ----
   *
   * blindPayload emits {question, options} and nothing else, so this item's explanation can reach the
   * payload ONLY by being part of the stem or an option -- which the candidate sees anyway. Three
   * AIMS-F items open their explanation with the same clause quotation an option carries, and the
   * value test below read that as the key leaking and refused to solve them.
   *
   * So the payload is proved identical to the item's visible text first. Once that holds an overlap is
   * inherent to the item and a leak is impossible by construction. If ANY of it has been altered --
   * an explanation appended to the question, an option rewritten -- fidelity fails, and then the value
   * tests run exactly as before. The allowlist alone could not catch that, because `question` is an
   * allowed field. */
  const itemVisible = {
    question: String((item && item.question_text) || ""),
    options: ((item && item.options) || []).map((o, i) => ({
      label: String.fromCharCode(65 + i),
      text: String((o && o.text) || ""),
    })),
  };
  /* ============ A PERMUTATION IS FAITHFUL ============
   *
   * This was a byte-identical comparison, and PROMPT-91 s2 requires the second solver run to SHUFFLE the
   * options. The two collided: every run-two payload was refused as "not byte-identical" and the second
   * call never reached the API, so every item split by construction.
   *
   * Fidelity exists to prove no text was altered, added or removed -- which is what makes an explanation
   * overlapping the payload harmless. A permutation preserves every part of that. So: the stem must match
   * exactly, and the option texts must match as a MULTISET. A rewritten option changes a text, a dropped
   * or added one changes the count, an appended explanation changes the stem. All still caught. */
  const sameStem = String((payload || {}).question || "") === itemVisible.question;
  const bag = (arr) => (arr || []).map((o) => String((o && o.text) || "")).sort();
  const payloadBag = bag((payload || {}).options);
  const itemBag = bag(itemVisible.options);
  const sameOptions = payloadBag.length === itemBag.length &&
    payloadBag.every((t, i) => t === itemBag[i]);
  const faithful = sameStem && sameOptions;
  if (!faithful) {
    bad.push("the payload is not byte-identical to the item's own question and options");
  }
  /* Value comparisons, on this item's own key-bearing text. A prefix rather than the whole
   * string, because a leak would carry the opening of it. Skipped only when the payload has been
   * proved to be the item's visible text and nothing else. */
  if (!faithful) {
    if (item.explanation && String(item.explanation).length >= 40 &&
        flat.includes(String(item.explanation).slice(0, 40))) {
      bad.push("this item's explanation text is in the payload");
    }
    if (item.key_support && String(item.key_support).length >= 40 &&
        flat.includes(String(item.key_support).slice(0, 40))) {
      bad.push("this item's key_support anchor is in the payload");
    }
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

/* ============ THE NO-PASSAGE VARIANT (ruled PROMPT-145 s2) ============
 *
 * The Scrum family is not ISO. Where the Scrum Guide speaks, an item is judged against it and the
 * passage-bound prompt above applies. Where it is SILENT -- TDD, user stories, estimation, code
 * review, AI-assisted development -- there is no passage to point at, and an item is legit if its
 * key is right per widely accepted professional practice and exactly one answer is defensible.
 *
 * The REPLY SHAPE IS IDENTICAL, `settled_by_passages` included, so `solverVerdict` stays the one
 * verdict function and the two passes are comparable. The field means "settled by accepted
 * practice" here, which is why the prompt says so rather than leaving the solver to guess. */
export const SOLVER_SYSTEM_PRACTICE = `You are sitting a professional certification examination and
you are given one multiple-choice question. You have not seen it before and nobody has told you the
answer. No reference text is provided, because this question is about established professional
practice rather than a published standard's wording.

Answer from WIDELY ACCEPTED PROFESSIONAL PRACTICE in agile software delivery. Judge what a competent,
experienced practitioner would consider correct -- not what a particular book says, and not your
preference between defensible schools of thought.

Return ONE JSON object and nothing else:

{
  "answer": "A",
  "answer_reason": "one sentence",
  "second_defensible": "B" | null,
  "second_defensible_reason": "one sentence, or null",
  "settled_by_passages": true | false
}

RULES FOR "second_defensible":
- Name an option ONLY if a competent practitioner could actually defend it as the answer. An option
  that is merely plausible-sounding, or true-but-not-the-best-answer, is NOT defensible.
- If exactly one option is supportable, "second_defensible" is null.

RULES FOR "settled_by_passages" (here: settled by accepted practice):
- false if the question turns on a local convention, a tool-specific detail, or a genuine
  disagreement between schools of practice, so that no single answer is generally accepted.
- Say false rather than guessing.`;

/** The user half when no passages are supplied. */
export function solverUserNoPassages(payload) {
  return "QUESTION\n\n" + JSON.stringify(payload, null, 1);
}

/* ============ THE SAME USER HALF, SPLIT FOR PROMPT CACHING (ruled PROMPT-146 s1) ============
 *
 * The passage block is identical for every item of a certification -- the whole Scrum Guide, about
 * 4,000 words -- and was being resent on every call. Split in two so the caller can mark the
 * PASSAGES cacheable and keep the QUESTION last and uncached.
 *
 * THE ORDER MATTERS AND IS NOT A STYLE CHOICE: a cache entry is keyed on the exact prefix, so
 * anything that varies per item must come AFTER everything cached. A question inside the cached
 * block would make every call a cache write and cost more than no caching at all.
 *
 * `solverUser` is kept and now composes these two, so the uncached path cannot drift from the
 * cached one. */
export function solverBlocks(payload, passages) {
  const src = passages.map((p) =>
    "--- " + p.source_id + " " + p.edition + ", clause " + p.clause +
    (p.title ? " (" + p.title + ")" : "") + " [" + p.normative + "] ---\n" + p.text
  ).join("\n\n");
  return {
    passages: "PASSAGES\n\n" + src,
    question: "\n\nQUESTION\n\n" + JSON.stringify(payload, null, 1),
  };
}

/* composed from solverBlocks, so the uncached string and the cached pair cannot drift apart */
export function solverUser(payload, passages) {
  const b = solverBlocks(payload, passages);
  return b.passages + b.question;
}

/** Controls for the cache layout. The question must never sit inside a cacheable block. */
export function solverCacheControls() {
  const cases = [];
  const add = (name, pass) => cases.push({ name, pass: !!pass });
  const ps = [{ source_id: "Scrum Guide", edition: "2020", clause: "The Sprint", title: "The Sprint",
    normative: "informative", text: "word ".repeat(200) }];
  const payload = { question: "Which statement is correct?", options: [{ label: "A", text: "x" }] };
  const b = solverBlocks(payload, ps);

  add("the passage block carries the passages", /Scrum Guide 2020, clause The Sprint/.test(b.passages));
  add("the passage block does NOT carry the question", !/Which statement is correct/.test(b.passages));
  add("the question block carries the question", /Which statement is correct/.test(b.question));
  add("the question block carries NO passage text", !/word word word/.test(b.question));
  /* the composed string must be byte-identical to passages + question, in that order */
  add("composed order is passages THEN question",
    solverUser(payload, ps) === b.passages + b.question);
  add("...and the question is the TAIL, so a cached prefix ends before it",
    solverUser(payload, ps).endsWith(b.question));
  add("an empty passage list still yields a question block", solverBlocks(payload, []).question.length > 10);
  return { cases, examined: cases.length, allPass: cases.every((c) => c.pass) };
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
      /* ONE item: assertBlind's contract is that `item` is the item the payload came from, and the
       * fidelity check compares them. The earlier fixture passed a different object and could not
       * satisfy it -- the intent is the same and it is now stated against a single item. */
      const prose = {
        question_text: "Which record must carry an explanation of the decision?",
        options: [{ text: "The documented explanation retained as evidence", is_correct: true },
          { text: "A verbal briefing with no correct answer recorded" }],
        explanation: "unrelated",
        key_support: "unrelated",
      };
      try { assertBlind(blindPayload(prose), prose); return "accepted"; }
      catch (e) { return "threw: " + e.message; }
    }, "accepted"],

    /* AND AN EXPLANATION THAT QUOTES THE ITEM'S OWN OPTION IS NOT A LEAK EITHER.
     * This is the shape that refused three real AIMS-F items: the explanation opens with the same
     * clause quotation an option carries, so the value test saw the explanation "in the payload" when
     * the payload was only ever the stem and the options -- which the candidate reads anyway. */
    ["an explanation quoting the item's own option is not a leak", () => {
      const q = "The AI policy shall be available as documented information and communicated";
      const self = {
        question_text: "An AI policy sits on an internal wiki only. Which is correct?",
        options: [{ text: "Sufficient, because " + q + " within the organization." },
          { text: "Insufficient until interested parties can obtain it.", is_correct: true }],
        explanation: q + " within the organization, and it must also be available to interested parties.",
      };
      try { assertBlind(blindPayload(self), self); return "accepted"; }
      catch (e) { return "threw: " + e.message; }
    }, "accepted"],

    /* THE NEGATIVE HALF OF THE FIDELITY CHECK: a payload built from one item and checked against
     * another must be REFUSED. That mismatch is how a swapped or edited payload reaches the solver,
     * and it is what the loosening above must not have let through. */
    ["a payload that is not this item's own visible text IS refused", () => {
      const a = { question_text: "Question A?", options: [{ text: "A1" }, { text: "A2" }] };
      const b = { question_text: "Question B?", options: [{ text: "B1" }, { text: "B2" }] };
      try { assertBlind(blindPayload(a), b); return "did not throw"; } catch { return "threw"; }
    }, "threw"],
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
