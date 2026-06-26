/**
 * item-cue-guard.mjs — the single, shared answer-cue neutrality control.
 *
 * WHY THIS EXISTS
 * ---------------
 * Both generators (gen-spo-i-secure.mjs, backfill-practice.mjs) let the model
 * choose which option is correct and write it however it liked. The result was
 * a bank where the correct answer could be found WITHOUT knowing the material,
 * via three independent surface cues measured across the live pools:
 *   - LENGTH: the correct option was the longest ~75% (practice) / ~82% (secure)
 *             of the time, against a 25% chance baseline.
 *   - POSITION: the correct id was "b" ~70-74% of the time and "d" ~0.2%.
 *   - SEMANTIC: the correct option was disproportionately the "balanced /
 *               inspect-and-adapt" phrasing; distractors the "rigid / absolute"
 *               phrasing — pickable by rhetoric, not knowledge.
 *
 * A multiple-choice item must be answerable ONLY by knowing the content. This
 * module is the one place that enforces that, so the secure generator, the
 * practice generator, and every future cert use byte-identical rules.
 *
 * WHAT IT DOES
 * ------------
 *   CUE_NEUTRALITY_RULES   prompt fragment injected verbatim into BOTH system
 *                          prompts (length parity, no positional habit, no
 *                          rhetorical tell).
 *   auditItem(q)           returns {ok, reason} — drops items whose KEY is
 *                          dominantly the longest, whose options are not
 *                          length-homogeneous, or that show the absolute-word
 *                          tell. Run on the ENGLISH skeleton before translation.
 *   shuffleOptions(q)      Fisher-Yates reorder + id relabel + correct_answer
 *                          remap. Lands the correct answer in a uniformly random
 *                          slot. Pure structural transform; the correct TEXT is
 *                          preserved. Run before translation so all languages
 *                          inherit the same neutral layout.
 *   remapGroupOrder(rows)  the in-place remediation primitive: one permutation
 *                          per question_group_id applied to every language row,
 *                          so a stored item's languages stay aligned.
 *
 * Design note (the trap we deliberately avoid): we do NOT enforce "the correct
 * answer is never the longest." That would drive correct-is-longest to 0% — also
 * non-chance — and create a reverse cue ("never pick the longest"). Instead we
 * enforce option-length HOMOGENEITY (tight spread) plus a small margin: the key
 * may be marginally longest, never dominantly. Length stops carrying signal
 * without inverting it.
 */

// ---------------------------------------------------------------------------
// Tunable thresholds (env-overridable). Defaults chosen against the observed
// bias: biased items had the key 40-80 chars longer than its rivals and option
// spreads of 90+ chars; clean homogeneous items sit well inside these.
// ---------------------------------------------------------------------------
function int(v, d) {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : d;
}
export const CUE_CFG = {
  // Reject if (longest option − shortest option) exceeds this many characters.
  LEN_SPREAD_MAX: int(process.env.LEN_SPREAD_MAX, 70),
  // The KEY may exceed its longest rival by the LARGER of:
  //   - KEY_LEN_MARGIN chars (a small absolute floor, so short options are
  //     judged on chars), or
  //   - KEY_LEN_PCT % of the rival length (so long options are judged on
  //     proportion — 12 chars on a 150-char option is noise, not a cue).
  // This matches the "within ~25%" rule the prompt already gives the model, so
  // the guard and the prompt agree instead of the guard over-rejecting.
  KEY_LEN_MARGIN: int(process.env.KEY_LEN_MARGIN, 12),
  KEY_LEN_PCT: int(process.env.KEY_LEN_PCT, 25),
};

const ABS_WORDS =
  /\b(always|never|must|only|all|none|cannot|can't|every|any|impossible|guarantees?|guaranteed|without exception)\b/i;

const LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h"];

// ---------------------------------------------------------------------------
// Prompt fragment — injected identically into both generators' system prompts.
// ---------------------------------------------------------------------------
export const CUE_NEUTRALITY_RULES = `
ANSWER-CUE NEUTRALITY (critical — the answer must be findable ONLY by knowing the content):
  - LENGTH PARITY: All options must be close in length, and the correct answer
    must NOT be the single longest option. Concretely: make at least one
    DISTRACTOR as long as, or longer than, the correct answer. Write every
    distractor as fully and specifically as the key; never pair an elaborated,
    fully-qualified correct answer with short, clipped distractors. Keep every
    option within roughly 25% character-length of the others.
  - NO POSITIONAL HABIT: Do not favor any option id for the correct answer. Spread
    the correct id across a/b/c/d. (The system reshuffles positions after you
    write, but do not lean on "b" or "c".)
  - NO RHETORICAL TELL: Do not make the correct answer always the "balanced,
    flexible, inspect-and-adapt" option with the distractors always the "rigid,
    absolute" option. Vary the stance: sometimes the correct answer is the
    specific, decisive choice and a distractor is the vague "it depends" hedge.
    Do not cluster absolute words (always, never, must, only, all, none) in the
    distractors as a giveaway.
  - Distractors must be wrong ON THE MERITS to someone who knows the material —
    not subtly-worse-but-defensible. This is an entry ("I") tier exam: test
    knowledge plainly, do not set traps and do not reward test-wiseness.
`;

// ---------------------------------------------------------------------------
// Audit (run on the English skeleton, single_choice with >=3 options).
// true_false and <3-option items are exempt (no length/position cue surface).
// ---------------------------------------------------------------------------
export function auditItem(q, cfg = CUE_CFG) {
  if (!q || !Array.isArray(q.options) || q.options.length < 3) return { ok: true };
  if (!Array.isArray(q.correct_answer) || q.correct_answer.length !== 1) return { ok: true };

  const correctId = q.correct_answer[0];
  const byId = new Map(q.options.map((o) => [o.id, (o.text || "").trim()]));
  const correct = byId.get(correctId);
  if (typeof correct !== "string") return { ok: true };

  const lens = [...byId.values()].map((t) => t.length);
  const max = Math.max(...lens);
  const min = Math.min(...lens);
  if (max - min > cfg.LEN_SPREAD_MAX) {
    return { ok: false, reason: `length spread ${max - min} > ${cfg.LEN_SPREAD_MAX} (min ${min}, max ${max})` };
  }

  const others = [...byId.entries()]
    .filter(([id]) => id !== correctId)
    .map(([, t]) => t.length);
  const maxOther = Math.max(...others);
  const allowed = Math.max(cfg.KEY_LEN_MARGIN, Math.round((cfg.KEY_LEN_PCT / 100) * maxOther));
  if (correct.length - maxOther > allowed) {
    return { ok: false, reason: `key dominates on length (key ${correct.length} vs rival ${maxOther}, allowed +${allowed})` };
  }

  // Absolute-word tell: every distractor uses an absolute, the key does not.
  const distractors = [...byId.entries()].filter(([id]) => id !== correctId).map(([, t]) => t);
  const keyAbs = ABS_WORDS.test(correct);
  if (!keyAbs && distractors.length >= 2 && distractors.every((d) => ABS_WORDS.test(d))) {
    return { ok: false, reason: "absolute-word tell: every distractor uses an absolute, key does not" };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Position de-bias for a SINGLE item (generation path). Reorders option texts,
// relabels ids a.., remaps correct_answer. Correct TEXT is tracked through the
// shuffle by flag, so identical option texts can't break it.
// ---------------------------------------------------------------------------
export function shuffleOptions(q, rng = Math.random) {
  if (!q || !Array.isArray(q.options) || q.options.length < 3) return q;
  if (!Array.isArray(q.correct_answer) || q.correct_answer.length !== 1) return q;

  const correctId = q.correct_answer[0];
  const arr = q.options.map((o) => ({ oldId: o.id, text: o.text, correct: o.id === correctId }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const options = arr.map((o, i) => ({ id: LETTERS[i], text: o.text }));
  const correctIdx = arr.findIndex((o) => o.correct);
  const out = { ...q, options, correct_answer: [LETTERS[correctIdx]] };

  // Any "(option a)" letter references in the explanation were written against
  // the PRE-shuffle order; remap them through the permutation so they stay
  // correct. (Explanations should reference content, not letters - this is a
  // safety net for any that slip through.)
  if (typeof q.explanation === "string" && /\boption\s+[a-h]\b/i.test(q.explanation)) {
    const oldToNew = new Map(arr.map((o, i) => [o.oldId, LETTERS[i]]));
    out.explanation = q.explanation.replace(/\boption\s+([a-h])\b/gi, (m, L) => {
      const n = oldToNew.get(L.toLowerCase());
      return n ? `option ${n}` : m;
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Position de-bias for a GROUP of stored rows sharing one question_group_id
// (remediation path). One permutation per group, applied identically to every
// language row, so es-419 / pt-BR stay aligned with en. Rows must share the same
// option-id set and the same correct_answer (they do, by construction).
//
// Returns [{ id, options, correct_answer }] ready to write back per row.
// ---------------------------------------------------------------------------
export function remapGroupOrder(rows, rng = Math.random) {
  const base = rows.find((r) => Array.isArray(r.options) && r.options.length >= 3);
  if (!base) return null; // nothing shuffleable in this group

  const oldIds = base.options.map((o) => o.id);
  if (oldIds.length < 3) return null;

  // Permute positions, then assign new letters by new position.
  const order = [...oldIds];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const oldToNew = new Map();
  order.forEach((oldId, i) => oldToNew.set(oldId, LETTERS[i]));

  const out = [];
  for (const r of rows) {
    if (!Array.isArray(r.options) || !Array.isArray(r.correct_answer)) return null;
    // every row must carry exactly the same id set
    if (r.options.length !== oldIds.length) return null;
    const newOptions = r.options
      .map((o) => {
        const nid = oldToNew.get(o.id);
        if (nid === undefined) return null;
        return { id: nid, text: o.text };
      });
    if (newOptions.some((o) => o === null)) return null;
    newOptions.sort((a, b) => a.id.localeCompare(b.id));
    const newCorrect = oldToNew.get(r.correct_answer[0]);
    if (newCorrect === undefined) return null;
    out.push({ id: r.id, options: newOptions, correct_answer: [newCorrect] });
  }
  return out;
}

// Convenience: is the keyed option the strict longest? (for reporting only)
export function keyIsStrictLongest(q) {
  if (!q || !Array.isArray(q.options) || q.options.length < 3) return false;
  if (!Array.isArray(q.correct_answer) || q.correct_answer.length !== 1) return false;
  const correctId = q.correct_answer[0];
  const byId = new Map(q.options.map((o) => [o.id, (o.text || "").trim().length]));
  const cl = byId.get(correctId);
  if (cl === undefined) return false;
  const others = [...byId.entries()].filter(([id]) => id !== correctId).map(([, l]) => l);
  return cl > Math.max(...others);
}
