/**
 * balanced-key-order.mjs -- permute an item's options so key positions are balanced within a task.
 *
 * Ruled PROMPT-95 s1c, on the finding that 73 percent of grounded keys sat at option A while the authored
 * banks are uniform. Always answering A scored about 75 percent on grounded items, and nothing shuffles at
 * insert or at delivery, so the skew reached the bank verbatim.
 *
 * ============ WHY THE ids MUST BE REASSIGNED AND NOT JUST THE ARRAY ============
 *
 * Measured in s1a: `certidemy-web/components/exam/exam-runner.tsx:897` renders the letter from
 * `opt.id.toUpperCase()`, not from the array index. So permuting the array alone would display A, C, B, D --
 * which reads as broken. The ids are therefore reassigned a..d IN DISPLAY ORDER and `correct_answer` is set
 * to the id the key ends up holding.
 *
 * Grading is unaffected by construction: `score-mock-exam` and `submit-quiz-answer` compare id SETS, so what
 * matters is that `correct_answer` and the key's id agree, which is asserted rather than assumed.
 *
 * ============ ROUND-ROBIN, SEEDED BY ITEM ID ============
 *
 * The target position walks A, B, C, D, A, ... in the order items are processed within a task, so a
 * 12-item task holds three keys at each position. WITHIN that constraint the remaining options are ordered
 * by a hash of the item id, so the result is REPRODUCIBLE: the same artifact permutes the same way on every
 * run, and a re-gate or a resumed insert cannot produce a different bank. Math.random would make the
 * inserted rows unreproducible from the artifact the director read.
 *
 * ============ AND THE WALK STARTS AT A PER-TASK OFFSET, WHICH THE FIRST VERSION MISSED ============
 *
 * Without an offset, every task's FIRST item goes to position A. Measured on the 49 inserted rows, which sit
 * across some twenty tasks at one or two items each: a pure per-task round-robin moved them from 78 percent
 * A to 65 percent -- balanced within each task exactly as ruled, and nowhere near the bank-level target of
 * within five points of chance. The two goals are not the same goal, and the per-task rule alone reaches
 * only the first.
 *
 * So the walk starts at `hash(taskSalt) % n`. Within a task the key still steps A, B, C, D in order, which
 * is what the 12-item control asserts; across tasks the starting point varies, which is what balances the
 * bank. One line, and it is the difference between a rule that reads correct and a bank that is.
 *
 * ============ WHAT THIS DOES NOT TOUCH ============
 *
 * No option text changes, none is added or removed, and the key's text is the same string it was. The
 * function returns a NEW item; it never mutates its input.
 */
import { createHash } from "node:crypto";

export const LETTERS = ["a", "b", "c", "d", "e", "f"];

/** Deterministic 32-bit hash of a string -- used only to order the non-key options. */
function h32(s) {
  const d = createHash("sha256").update(String(s)).digest();
  return d.readUInt32BE(0);
}

/**
 * @param item        { question_text, options:[{text,is_correct}], correct_index?, ... }
 * @param seq         0-based index of this item WITHIN ITS TASK -- the round-robin position
 * @param itemId      the item's content hash, for reproducible ordering of the non-key options
 * @param taskSalt    the task code. Offsets where the task's walk STARTS, so that tasks holding one or two
 *                    items do not all put their key at A. Defaults to "" -- which is the unoffset behaviour,
 *                    kept only so the controls can show what it costs.
 * @returns { item, targetIndex, keyText } a new item with permuted options and ids a..d in display order
 */
export function balanceKeyOrder(item, seq, itemId, taskSalt = "") {
  const opts = (item.options || []).map((o) => ({ ...o }));
  if (opts.length < 2) throw new Error("balanceKeyOrder: fewer than two options");
  const keyIdx = typeof item.correct_index === "number"
    ? item.correct_index
    : opts.findIndex((o) => o.is_correct === true);
  if (keyIdx < 0 || keyIdx >= opts.length) throw new Error("balanceKeyOrder: no key to place");
  const keyText = String(opts[keyIdx].text);

  /* the round-robin target, offset by the task so one-item tasks do not all land on A, and wrapped to the
   * option count so a 3-option item still balances across its own three positions */
  const offset = taskSalt ? h32("task|" + taskSalt) % opts.length : 0;
  const target = ((seq + offset) % opts.length + opts.length) % opts.length;

  /* the non-key options, ordered deterministically by (hash of id + their own text) */
  const rest = opts.filter((_, i) => i !== keyIdx)
    .map((o) => ({ o, k: h32(itemId + "|" + o.text) }))
    .sort((a, b) => (a.k - b.k) || String(a.o.text).localeCompare(String(b.o.text)))
    .map((x) => x.o);

  const out = [];
  let ri = 0;
  for (let i = 0; i < opts.length; i++) out.push(i === target ? opts[keyIdx] : rest[ri++]);

  /* ids follow DISPLAY ORDER, so the letter the candidate sees matches the position */
  const withIds = out.map((o, i) => ({ ...o, id: LETTERS[i] }));

  /* ---- assertions, in the function, because a silent mis-permutation is unrecoverable ---- */
  if (withIds.length !== opts.length) throw new Error("balanceKeyOrder: option count changed");
  const keyAt = withIds.findIndex((o) => o.is_correct === true);
  if (keyAt !== target) throw new Error("balanceKeyOrder: the key did not land at its target position");
  if (String(withIds[keyAt].text) !== keyText) throw new Error("balanceKeyOrder: the key's TEXT changed");
  const before = opts.map((o) => String(o.text)).sort();
  const after = withIds.map((o) => String(o.text)).sort();
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    throw new Error("balanceKeyOrder: the multiset of option texts changed");
  }
  if (new Set(withIds.map((o) => o.id)).size !== withIds.length) {
    throw new Error("balanceKeyOrder: duplicate option ids");
  }

  return {
    item: { ...item, options: withIds, correct_index: keyAt },
    targetIndex: keyAt,
    keyId: withIds[keyAt].id,
    keyText,
  };
}

/* ---------------------------------------------------------------- controls
 * The four the ruling names, plus reproducibility and the 3-option case. */
export function balancedKeyOrderControls() {
  const out = [];
  const ok = (what, cond, detail) => out.push({ what, pass: !!cond, detail: cond ? null : detail });
  const mk = (n, keyAt) => ({
    question_text: "stem " + n,
    correct_index: keyAt,
    options: Array.from({ length: 4 }, (_, i) => ({ text: "opt" + n + "-" + i, is_correct: i === keyAt })),
  });

  /* 1. the key's text is unchanged; 2. correct_answer points at the same text */
  const r = balanceKeyOrder(mk(1, 0), 2, "aaaa1111");
  ok("the key's text is unchanged", r.keyText === "opt1-0" &&
    r.item.options[r.item.correct_index].text === "opt1-0",
    "key text is now " + r.item.options[r.item.correct_index].text);
  ok("the key's id matches its display position",
    r.item.options[r.item.correct_index].id === LETTERS[r.item.correct_index],
    r.item.options[r.item.correct_index].id + " at index " + r.item.correct_index);

  /* 3. the multiset of option texts is identical */
  const beforeSet = mk(1, 0).options.map((o) => o.text).sort().join("|");
  const afterSet = r.item.options.map((o) => o.text).sort().join("|");
  ok("the multiset of option texts is identical", beforeSet === afterSet, afterSet);

  /* 4. across a 12-item task, each position holds 3 keys */
  const tally = {};
  for (let i = 0; i < 12; i++) {
    const x = balanceKeyOrder(mk(i, i % 4), i, "item" + i);
    tally[x.targetIndex] = (tally[x.targetIndex] || 0) + 1;
  }
  ok("across 12 items each position holds exactly 3 keys",
    [0, 1, 2, 3].every((p) => tally[p] === 3), JSON.stringify(tally));

  /* REPRODUCIBLE: the same input permutes the same way twice */
  const a = balanceKeyOrder(mk(7, 3), 5, "seed-xyz");
  const b = balanceKeyOrder(mk(7, 3), 5, "seed-xyz");
  ok("the same item and sequence permute identically (reproducible)",
    JSON.stringify(a.item.options) === JSON.stringify(b.item.options));
  /* and a DIFFERENT id orders the distractors differently, or the seed is doing nothing */
  const c = balanceKeyOrder(mk(7, 3), 5, "seed-abc");
  ok("a different item id orders the distractors differently (the seed is live)",
    JSON.stringify(a.item.options.map((o) => o.text)) !== JSON.stringify(c.item.options.map((o) => o.text)),
    "identical ordering -- the seed is not being used");

  /* the input is NOT mutated */
  const src = mk(9, 1);
  const snapshot = JSON.stringify(src);
  balanceKeyOrder(src, 3, "nomutate");
  ok("the input item is not mutated", JSON.stringify(src) === snapshot);

  /* a 3-option item still balances across its own three positions */
  const three = { question_text: "t3", correct_index: 0,
    options: [{ text: "x", is_correct: true }, { text: "y" }, { text: "z" }] };
  const t3 = {};
  for (let i = 0; i < 9; i++) {
    const x = balanceKeyOrder({ ...three, options: three.options.map((o) => ({ ...o })) }, i, "three" + i);
    t3[x.targetIndex] = (t3[x.targetIndex] || 0) + 1;
  }
  ok("a 3-option item balances across 3 positions, not 4",
    [0, 1, 2].every((p) => t3[p] === 3) && t3[3] === undefined, JSON.stringify(t3));

  /* THE PER-TASK OFFSET, both directions. Without it every one-item task puts its key at A, which is how
   * the first version reached only 65 percent A on 49 rows across twenty tasks. */
  const firstOf = (salt) => balanceKeyOrder(mk(1, 0), 0, "same-item", salt).targetIndex;
  const starts = new Set(["1.1", "2.3", "4.2", "5.4", "3.6", "1.4"].map(firstOf));
  ok("the FIRST item of different tasks does not always land at A", starts.size > 1,
    "every task started at position " + [...starts][0]);
  ok("with no salt, the first item lands at A (the unoffset behaviour, kept to show what it costs)",
    balanceKeyOrder(mk(1, 0), 0, "same-item", "").targetIndex === 0);
  /* and the offset must not break the within-task walk */
  const walk = [];
  for (let i = 0; i < 12; i++) walk.push(balanceKeyOrder(mk(i, i % 4), i, "w" + i, "2.7").targetIndex);
  const tally2 = {};
  for (const p of walk) tally2[p] = (tally2[p] || 0) + 1;
  ok("a 12-item task still holds 3 keys per position WITH the offset",
    [0, 1, 2, 3].every((p) => tally2[p] === 3), JSON.stringify(tally2));
  ok("and the walk is still consecutive within the task",
    walk.every((p, i) => i === 0 || p === (walk[i - 1] + 1) % 4), JSON.stringify(walk));

  /* an item with no key THROWS rather than silently placing option A */
  let threw = false;
  try {
    balanceKeyOrder({ question_text: "nokey", options: [{ text: "a" }, { text: "b" }] }, 0, "nokey");
  } catch { threw = true; }
  ok("an item with no marked key THROWS, never silently placed", threw);
  return out;
}
