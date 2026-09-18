/**
 * item-profile.mjs - per-cert TIER profile for the shared item pipeline.
 *
 * WHY THIS EXISTS
 * ---------------
 * Sibling to item-grounding.mjs, and the same class of bug. The pipeline carried a
 * single hardcoded difficulty instruction - "~30% L2, 50% L3, 20% L4; AVOID level 1
 * (trivial recall); favor scenario and Apply/Analyze items" - injected into the draft
 * prompt for EVERY cert. That is correct for an 80-item professional Scrum exam. It
 * is wrong for a literacy tier.
 *
 * The damage on AIE-I (JTA: Bloom 44/40/16 Remember/Understand/Apply, ceiling 3):
 *   - 0% Remember items (the prompt forbids L1, and gen-cert-secure's bloomFor maps
 *     difficulty<=2 -> 2_understand, so 1_remember was structurally unreachable)
 *   - 67% Apply, and 9 items at 4_analyze - ABOVE the JTA's declared ceiling
 *   - a 25-item exam form drawn from that pool cannot satisfy its own blueprint
 *
 * A credential whose item bank contradicts its published blueprint is not defensible
 * under ISO/IEC 17024. The generator must serve the blueprint, not silently redefine
 * it. So the tier profile is now resolved PER CERT, exactly like grounding.
 *
 * Scrum + governance keep today's behavior byte-for-byte (no regression on top-up
 * runs). Unknown certs get a neutral default rather than inheriting the Scrum tier.
 *
 * Matching is on the cert NAME the generators already pass as `certName`, AND on the
 * certification's TIER, which is the same shape `groundingFor(certName, tier)` already
 * uses. Tier is resolved FIRST: a Level II certification's difficulty profile is a
 * property of its ITEM CONTRACT, not of its subject matter, so it must not be reached
 * through a name match. A fix that special-cased Scrum here would have re-encoded the
 * defect it was written to remove.
 *
 * WHY TIER WAS ADDED (2026-09-10). `profileFor()` took a name and no tier, so SM-AI-II -
 * "Scrum Master II - AI" - matched /\bscrum\b/ and inherited SM-AI-I's Level I profile:
 * "avoid level 1, 30/50/20, favor Apply/Analyze". That is the Level I text and this is a
 * Level II credential with no Remember or Understand tasks at all.
 *
 * WHAT THE DEFECT COULD AND COULD NOT DO, measured before the fix rather than assumed.
 * The ONLY live consumer of this module is `difficultyLineFor`, which
 * `item-pipeline.mjs` passes to `bloomDirective(task, kind, legacyLine)` - and that
 * function returns the legacy line ONLY when the task declares no `bloom_level`.
 * Counted 2026-09-10 across public.tasks: 509 tasks, 13 certifications, ZERO with a null
 * bloom_level. `gen-cert-secure` additionally hard-skips any task without one.
 *
 * So the wrong profile was UNREACHABLE on every generation path in the repo, and this
 * change alters no prompt that is being emitted today. It closes a trapdoor: the
 * fallback fires exactly when a task has lost its declared level, which is already a
 * broken state, and it fires SILENTLY. That is the worst moment to hand a Level II bank
 * Level I's instructions.
 *
 * THE REGRESSION SURFACE IS THE TIER-1 CERTS, and it is guarded by
 * `scripts/verify-profile.mjs`, which asserts the tier-1 Scrum difficulty string is
 * BYTE-IDENTICAL rather than merely that it still routes to `professional`. A check that
 * only confirms SM-AI-II now gets Level II passes cleanly on a change that also moved
 * SM-AI-I.
 */

const BLOOM = {
  1: "1_remember",
  2: "2_understand",
  3: "3_apply",
  4: "4_analyze",
  5: "5_evaluate",
};

/**
 * PROFESSIONAL tier (Scrum: SM/SPO/SD, and AIGRM-I governance).
 * Difficulty text is the ORIGINAL, preserved verbatim so a top-up run on any
 * existing bank generates exactly as it did before this change.
 */
const PROFESSIONAL = {
  id: "professional",
  secureDifficulty: `Difficulty 1..5, distributed about 30% level 2, 50% level 3, 20% level 4.
Avoid level 1 (trivial recall) and level 5 (overly tricky) - test applied
judgment. Favor scenario and Apply/Analyze items.`,
  practiceDifficulty: `Difficulty 1=trivial recall .. 5=tricky multi-step. Favor Apply/Analyze
(3-4) over recall: aim ~40% level 2, ~40% level 3, ~20% level 4.`,
  // Original mapping from gen-cert-secure.mjs, unchanged.
  bloomFor: (d) => (d <= 2 ? "2_understand" : d === 3 ? "3_apply" : "4_analyze"),
  ceiling: "4_analyze",
};

/**
 * PROFESSIONAL LEVEL II tier (SM-AI-II, ISMS-IA, AIMS-IA - every cert declaring tier 2).
 *
 * A Level II scheme declares no Remember tasks and, in SM-AI-II's case, no Understand
 * tasks either: everything a candidate would recall is certified by the Level I
 * credential below it and is assumed rather than re-tested. So "avoid level 1" is too
 * weak here - level 1 is not merely dispreferred, it contradicts the credential's own
 * published cognitive profile.
 *
 * The four-option rule is stated here as well as in the pipeline because this text is
 * what a model reads when no task-level directive is available, and a two-option item
 * fails `verify-cert` invariant 19 for the whole SECURE bank rather than for itself.
 */
const PROFESSIONAL_L2 = {
  id: "professional-l2",
  secureDifficulty: `Difficulty 2..4, distributed about 30% level 2, 50% level 3, 20% level 4.

NEVER write a level 1 (trivial recall) item. A Level II certification declares no
Remember tasks; a recall item contradicts the credential's published profile, and
it is not a stylistic preference like the Level I guidance it replaces.

DIFFICULTY IS NOT COGNITIVE LEVEL, and at this tier the distinction is the design.
Every item is written AT its task's declared level; difficulty varies WITHIN that
level. An easy Analyze item and a hard Analyze item are both Analyze items. Make an
item harder by making the content subtler, the distractors closer, or the situation
less familiar - NEVER by raising the cognitive level.

FOUR OPTIONS, ALWAYS, at every cognitive level including Apply. A two-option
true/false item is a coin flip - a candidate who knows nothing scores 50% - and it
is never acceptable at this tier.`,
  practiceDifficulty: `Difficulty 2..4, aiming roughly 30% level 2, 50% level 3, 20% level 4. Never
write level 1 (trivial recall): this credential declares no Remember tasks. Vary
difficulty WITHIN the task's declared cognitive level, never by raising it. Four
options always; a two-option item is a coin flip.`,
  // Floor 2 as well as ceiling 4: 1_remember is out of scope at this tier, in the same
  // way 4_analyze is out of scope for LITERACY.
  bloomFor: (d) => BLOOM[Math.min(Math.max(d, 2), 4)],
  ceiling: "4_analyze",
};

/**
 * LITERACY tier (AIE-I). The JTA is explicit: Bloom 44/40/16
 * (Remember/Understand/Apply), ceiling at level 3. Recall is WANTED here - this is
 * an entry credential for non-technical staff, and a foundational-knowledge item is
 * a legitimate measurement, not a defect. Analyze is OUT OF SCOPE.
 */
const LITERACY = {
  id: "literacy",
  secureDifficulty: `Difficulty 1..3 ONLY. Target roughly 44% level 1, 40% level 2, 16% level 3.

This is an ENTRY-LEVEL literacy exam for non-technical professionals, so the
blueprint deliberately includes recall:
  - level 1 (Remember): the candidate recalls a definition, a term, or a stated
    fact from the material. These are WANTED - do not avoid them, and do not
    inflate them into scenarios. A clean, unambiguous recall item is correct here.
  - level 2 (Understand): the candidate explains, distinguishes, or classifies -
    e.g. telling AI apart from plain automation, or recognizing why a tool
    produced a confident but wrong answer.
  - level 3 (Apply): a short, everyday workplace scenario where the candidate must
    choose the sound action. Keep these grounded and brief.

HARD CEILING: never write level 4 (Analyze) or level 5 items. Do NOT produce
multi-step reasoning chains, subtle trade-off comparisons, or items that hinge on
weighing competing frameworks. If an item feels like it needs expert judgment to
resolve, it is out of scope for this credential - simplify it or replace it.`,
  practiceDifficulty: `Difficulty 1..3 ONLY, aiming roughly 44% level 1, 40% level 2, 16% level 3.
Recall items (level 1) are wanted at this tier. Never write level 4+ items - no
multi-step analysis, no expert trade-off weighing.`,
  bloomFor: (d) => BLOOM[Math.min(Math.max(d, 1), 3)], // hard-capped at 3_apply
  ceiling: "3_apply",
};

/** Fallback: never silently inherit another tier's assumptions. */
const NEUTRAL = {
  id: "neutral",
  secureDifficulty: `Difficulty 1..4. Aim for a balanced spread appropriate to a professional
certification: some recall, a solid core of comprehension, and applied judgment.
Avoid level 5 (overly tricky).`,
  practiceDifficulty: `Difficulty 1..4. Aim for a balanced spread: some recall, a core of
comprehension, and applied judgment.`,
  bloomFor: (d) => BLOOM[Math.min(Math.max(d, 1), 4)],
  ceiling: "4_analyze",
};

/**
 * Resolve the tier profile from the cert's TIER first, then its name.
 *
 * TIER IS CHECKED BEFORE ANY NAME MATCH, and that ordering is the fix. The difficulty
 * profile follows from the item contract - four defensible options, one best - which is
 * declared by `certifications.tier` and is true of a Level II credential regardless of
 * whether its subject is Scrum, ISO/IEC 27001 or ISO/IEC 42001. Reaching the Level II
 * profile through /\bscrum\b/ would leave ISMS-IA and AIMS-IA on Level I's text for the
 * same reason SM-AI-II was on it.
 *
 * The name branches below are UNCHANGED and govern tier 1 only. AIE-I is tier 1, so the
 * tier test above cannot swallow it - `verify-profile.mjs` asserts that directly,
 * because a naive `tier >= 2` branch placed one line higher would.
 *
 * @param {string} certName e.g. "AI Essentials I", "Scrum Master I - AI"
 * @param {number} [tier=1] the certification's tier, from `certifications.tier`.
 *   Defaults to 1 so every existing caller keeps its current behaviour exactly.
 */
export function profileFor(certName, tier = 1) {
  if (Number(tier) >= 2) return PROFESSIONAL_L2;
  const n = (certName || "").toLowerCase();
  if (/\bscrum\b/.test(n)) return PROFESSIONAL;
  if (/essential/.test(n)) return LITERACY;              // before governance: both say "AI"
  if (/governance|risk|compliance|audit/.test(n)) return PROFESSIONAL;
  return NEUTRAL;
}

/** Difficulty guidance for the draft prompt. `kind` is "secure" | "practice". */
export function difficultyLineFor(kind, certName, tier = 1) {
  const p = profileFor(certName, tier);
  return kind === "secure" ? p.secureDifficulty : p.practiceDifficulty;
}

/**
 * difficulty -> bloom_level enum, per the cert's tier (bounded by its floor and ceiling).
 *
 * NOT ON THE GENERATION PATH, deliberately. Both generators stamp `bloom_level` from
 * `tasks.bloom_level` - the JTA's declared level - and throw rather than guess when it is
 * absent. This is the tier's DECLARED mapping, kept as the answer to "what would this
 * tier do with a raw difficulty score", exercised by `verify-profile.mjs` and by nothing
 * else. It is documented rather than deleted because the mapping is a property of the
 * tier; the dead wrappers that called it are gone.
 */
export function bloomForCert(difficulty, certName, tier = 1) {
  return profileFor(certName, tier).bloomFor(difficulty);
}

export const PROFILES = { PROFESSIONAL, PROFESSIONAL_L2, LITERACY, NEUTRAL };
