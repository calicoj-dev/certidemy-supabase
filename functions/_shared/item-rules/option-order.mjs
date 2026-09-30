/**
 * option-order.mjs -- present an item's options in a per-attempt order, with the ids UNCHANGED.
 *
 * Ruled PROMPT-95 s1e. BUILT AND TESTED, NOT DEPLOYED: Juan deploys after the director has read the diff.
 *
 * ============ WHY THIS IS SAFE, AND IT IS SAFE BY CONSTRUCTION RATHER THAN BY CARE ============
 *
 * Grading never looks at a position. Measured in s1a:
 *
 *   functions/score-mock-exam/index.ts:129    isCorrect(correct: string[], given: string[]) -- Set equality
 *   functions/submit-quiz-answer/index.ts:106 setsEqual(new Set(question.correct_answer), ...)
 *
 * Both compare option ID SETS. So reordering the ARRAY while leaving every `id` attached to its own `text`
 * cannot change any grade -- and the client agrees: `exam-runner.tsx:897` renders the letter from
 * `opt.id.toUpperCase()`, and selection posts `opt.id`.
 *
 * ============ DETERMINISTIC PER (SESSION, QUESTION), WHICH IS THE PART THAT MATTERS ============
 *
 * A naive per-request shuffle would reorder the options every time a candidate reloads or resumes --
 * `get-active-exam-session` re-serves the recorded form, so the same item would appear with its options in a
 * new order mid-exam. That is not a grading problem; it is a candidate staring at an exam that moves under
 * them, which is worse than the skew this fixes.
 *
 * So the order is a pure function of (session_id, question_id): the same attempt always renders the same
 * order, a different attempt renders a different one, and no state is stored anywhere.
 *
 * ============ WHAT IT DOES NOT DO ============
 *
 * It does not touch `correct_answer`, it does not renumber anything, and it does not reorder the options of
 * an item whose ids are not unique -- that item is returned untouched, because a reorder that cannot be
 * traced back to its ids is worse than an unbalanced one.
 */

/** FNV-1a over a string. Small, dependency-free, and stable across runtimes -- which a hash used for
 *  presentation must be, or a resumed session renders differently on a different isolate. */
function fnv1a(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** A deterministic 32-bit PRNG seeded from one integer. */
function mulberry32(a) {
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param options   [{ id, text, ... }]  -- returned reordered, each entry byte-identical
 * @param seedParts strings that identify THIS attempt of THIS item, e.g. [session_id, question_id]
 * @returns a new array; the input is never mutated
 */
export function orderOptionsForAttempt(options, seedParts) {
  const arr = Array.isArray(options) ? options.slice() : [];
  if (arr.length < 2) return arr;
  /* ids must be present and unique, or the reorder is untraceable and is refused */
  const ids = arr.map((o) => (o && o.id !== undefined && o.id !== null ? String(o.id) : null));
  if (ids.some((x) => x === null) || new Set(ids).size !== ids.length) return arr;

  const seed = fnv1a(seedParts.filter((x) => x !== undefined && x !== null).map(String).join("|"));
  const rnd = mulberry32(seed);
  /* Fisher-Yates, downward, so the permutation is uniform over the array */
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

/* ---------------------------------------------------------------- controls
 * The claim is "a shuffled attempt grades identically", so that is what is asserted -- against the real
 * grading predicate rather than a description of it. */

/** The grading predicate, copied in shape from score-mock-exam:129 and submit-quiz-answer:106. */
function gradesCorrect(correctIds, givenIds) {
  const c = new Set(correctIds);
  const g = new Set(givenIds);
  return c.size === g.size && [...c].every((x) => g.has(x));
}

export function optionOrderControls() {
  const out = [];
  const ok = (what, cond, detail) => out.push({ what, pass: !!cond, detail: cond ? null : detail });
  const opts = [
    { id: "a", text: "the reference-set reading" },
    { id: "b", text: "the fixed-baseline reading" },
    { id: "c", text: "the AI-providers-only reading" },
    { id: "d", text: "the build-specification reading" },
  ];
  const correct = ["c"];

  /* 1. A SHUFFLED ATTEMPT GRADES IDENTICALLY. The candidate picks the option whose TEXT is the key, whatever
   *    position it now occupies, and the grade must be the same. */
  let allGraded = true, everMoved = false;
  for (let s = 0; s < 40; s++) {
    const shown = orderOptionsForAttempt(opts, ["session-" + s, "q-1"]);
    const keyText = opts.find((o) => o.id === correct[0]).text;
    const picked = shown.find((o) => o.text === keyText);
    if (!gradesCorrect(correct, [picked.id])) allGraded = false;
    if (shown.map((o) => o.id).join("") !== "abcd") everMoved = true;
  }
  ok("a shuffled attempt grades identically, over 40 attempts", allGraded);
  ok("...and the order actually moved in at least one of them", everMoved,
    "the order never changed, so the control proved nothing");

  /* 2. A WRONG PICK STILL GRADES WRONG. A shuffle that made everything correct would also pass control 1. */
  let allWrong = true;
  for (let s = 0; s < 20; s++) {
    const shown = orderOptionsForAttempt(opts, ["sess" + s, "q-1"]);
    const wrong = shown.find((o) => o.id !== correct[0]);
    if (gradesCorrect(correct, [wrong.id])) allWrong = false;
  }
  ok("a wrong pick still grades wrong", allWrong);

  /* 3. DETERMINISTIC PER ATTEMPT: a resumed session renders the same order. */
  const a1 = orderOptionsForAttempt(opts, ["sess-A", "q-7"]).map((o) => o.id).join("");
  const a2 = orderOptionsForAttempt(opts, ["sess-A", "q-7"]).map((o) => o.id).join("");
  ok("the same (session, question) renders the same order", a1 === a2, a1 + " vs " + a2);
  const b1 = orderOptionsForAttempt(opts, ["sess-B", "q-7"]).map((o) => o.id).join("");
  ok("a different session renders a different order", a1 !== b1, "both " + a1);
  const c1 = orderOptionsForAttempt(opts, ["sess-A", "q-8"]).map((o) => o.id).join("");
  ok("a different question renders a different order", a1 !== c1, "both " + a1);

  /* 4. EVERY id KEEPS ITS OWN text. The one way this could corrupt a bank. */
  let paired = true;
  for (let s = 0; s < 30; s++) {
    for (const o of orderOptionsForAttempt(opts, ["s" + s, "q"])) {
      if (opts.find((x) => x.id === o.id).text !== o.text) paired = false;
    }
  }
  ok("every id keeps its own text", paired);

  /* 5. the multiset is identical and the input is not mutated */
  const before = JSON.stringify(opts);
  const shown = orderOptionsForAttempt(opts, ["s", "q"]);
  ok("the input array is not mutated", JSON.stringify(opts) === before);
  ok("the multiset of ids is identical",
    shown.map((o) => o.id).sort().join("") === opts.map((o) => o.id).sort().join(""));

  /* 6. REFUSALS: duplicate or missing ids are returned untouched rather than reordered untraceably. */
  const dup = [{ id: "a", text: "x" }, { id: "a", text: "y" }, { id: "b", text: "z" }];
  ok("duplicate ids are returned untouched",
    JSON.stringify(orderOptionsForAttempt(dup, ["s", "q"])) === JSON.stringify(dup));
  const noId = [{ text: "x" }, { text: "y" }];
  ok("options with no id are returned untouched",
    JSON.stringify(orderOptionsForAttempt(noId, ["s", "q"])) === JSON.stringify(noId));
  ok("a single option is returned untouched",
    JSON.stringify(orderOptionsForAttempt([{ id: "a", text: "x" }], ["s", "q"])) ===
      JSON.stringify([{ id: "a", text: "x" }]));

  /* 7. THE DISTRIBUTION IS FLAT. A shuffle that always produced the same few permutations would pass every
   *    control above and leave the skew in place. */
  const pos = { a: [0, 0, 0, 0], b: [0, 0, 0, 0], c: [0, 0, 0, 0], d: [0, 0, 0, 0] };
  const N = 4000;
  for (let s = 0; s < N; s++) {
    orderOptionsForAttempt(opts, ["sess" + s, "q-1"]).forEach((o, i) => { pos[o.id][i]++; });
  }
  const expect = N / 4;
  const worst = Math.max(...Object.values(pos).flat().map((n) => Math.abs(n - expect) / expect));
  ok("each id lands in each position about a quarter of the time (worst deviation under 15%)",
    worst < 0.15, "worst deviation " + Math.round(worst * 100) + "%");
  return out;
}
