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
 * Matching is on the cert NAME the generators already pass as `certName`.
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
 * Resolve the tier profile from the cert name the generators already pass.
 * @param {string} certName e.g. "AI Essentials I", "Scrum Master I - AI"
 */
export function profileFor(certName) {
  const n = (certName || "").toLowerCase();
  if (/\bscrum\b/.test(n)) return PROFESSIONAL;
  if (/essential/.test(n)) return LITERACY;              // before governance: both say "AI"
  if (/governance|risk|compliance|audit/.test(n)) return PROFESSIONAL;
  return NEUTRAL;
}

/** Difficulty guidance for the draft prompt. `kind` is "secure" | "practice". */
export function difficultyLineFor(kind, certName) {
  const p = profileFor(certName);
  return kind === "secure" ? p.secureDifficulty : p.practiceDifficulty;
}

/** difficulty -> bloom_level enum, per the cert's tier (capped at its ceiling). */
export function bloomForCert(difficulty, certName) {
  return profileFor(certName).bloomFor(difficulty);
}

export const PROFILES = { PROFESSIONAL, LITERACY, NEUTRAL };
