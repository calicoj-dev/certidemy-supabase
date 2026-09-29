#!/usr/bin/env node
/**
 * check-blind-fidelity.mjs -- controls for the narrowed `assertBlind`. READ-ONLY, no flags.
 *
 * `assertBlind` was LOOSENED: an explanation whose opening duplicates the item's own stem or an option
 * no longer reads as a leak, provided the payload is byte-identical to the item's visible text. A gate
 * made less strict without a demonstration that it still catches what it was loosened around is a gate
 * we have merely stopped hearing from -- so every way of actually leaking a key must still fire.
 *
 * The positive case is built from the REAL shape that was misfiring: an item whose explanation opens
 * with the same clause quotation one of its options carries. The negative cases are each of the four
 * ways the payload can stop being the item's visible text.
 */
import { blindPayload, assertBlind } from "./lib/blind-solver.mjs";

const QUOTE = "The AI policy shall be available as documented information and communicated within";
const item = {
  question_text: "An organization publishes its AI policy on an internal wiki only. Which is correct?",
  options: [
    { text: "It is sufficient, because " + QUOTE + " the organization.", is_correct: false },
    { text: "It is insufficient until interested parties can obtain it as appropriate.", is_correct: true },
    { text: "It is sufficient only if the wiki is indexed by the document register.", is_correct: false },
    { text: "It is insufficient because a policy may not be held electronically.", is_correct: false },
  ],
  explanation: QUOTE + " the organization, and clause 5.2 additionally requires it to be available " +
    "to interested parties as appropriate.",
  key_support: "The AI policy shall: be available as documented information; be communicated within " +
    "the organization; be available to interested parties, as appropriate.",
};

const cases = [];
const add = (what, mustThrow, fn) => cases.push({ what, mustThrow, fn });

/* ---- the case that was wrongly firing ---- */
add("a faithful payload PASSES even though the explanation opens with an option's own words",
  false, () => assertBlind(blindPayload(item), item));

/* ---- and every way of genuinely leaking must still fire ---- */
add("an explanation APPENDED to the question fires", true, () => {
  const p = blindPayload(item);
  p.question = p.question + "\n\n" + item.explanation;
  return assertBlind(p, item);
});
add("the explanation added as an EXTRA FIELD fires (allowlist)", true, () => {
  const p = blindPayload(item);
  p.explanation = item.explanation;
  return assertBlind(p, item);
});
add("key_support added as an extra field fires (allowlist)", true, () => {
  const p = blindPayload(item);
  p.key_support = item.key_support;
  return assertBlind(p, item);
});
add("an option carrying is_correct fires", true, () => {
  const p = blindPayload(item);
  p.options[1].is_correct = true;
  return assertBlind(p, item);
});
add("a REWRITTEN option fires on fidelity", true, () => {
  const p = blindPayload(item);
  p.options[1].text = p.options[1].text + "  (this is the key)";
  return assertBlind(p, item);
});
add("a DROPPED option fires on fidelity", true, () => {
  const p = blindPayload(item);
  p.options.splice(3, 1);
  return assertBlind(p, item);
});
add("REORDERED options fire on fidelity", true, () => {
  const p = blindPayload(item);
  const t = p.options[0].text; p.options[0].text = p.options[1].text; p.options[1].text = t;
  return assertBlind(p, item);
});
add("key_support leaking into the question fires even without the explanation", true, () => {
  const p = blindPayload(item);
  p.question = item.key_support + " " + p.question;
  return assertBlind(p, item);
});
/* an item with NO explanation at all must still pass -- absence is not a leak */
add("an item with no explanation and no key_support passes", false, () => {
  const bare = { question_text: item.question_text, options: item.options };
  return assertBlind(blindPayload(bare), bare);
});

let fails = 0;
for (const c of cases) {
  let threw = false, msg = "";
  try { c.fn(); } catch (e) { threw = true; msg = e.message; }
  const ok = threw === c.mustThrow;
  if (!ok) fails++;
  console.log((ok ? "  ok   " : "  FAIL ") + c.what +
    (threw ? "\n         -> " + msg.slice(0, 140) : ""));
}
console.log("\n" + cases.length + " case(s), " + fails + " fail");
if (fails) {
  console.error(fails + " blind-fidelity control(s) FAILED -- the guard has been loosened past the " +
    "point where it still catches a real leak.");
  process.exitCode = 1;
}
