/**
 * item-pipeline.mjs - the v2 item-generation pipeline. Quality-first.
 *
 * WHY THIS EXISTS
 * ---------------
 * The single-pass generator produced items where the correct answer was the
 * longest ~75-83% of the time. The length cue was a SYMPTOM: the model wrote one
 * airtight, fully-qualified correct answer and three thinner distractors.
 * Prompt nudges did not move it (a measured pilot stayed at 75-83%). The cure is
 * not to pad distractors - that buys cue-neutral mediocrity - it is to make the
 * distractors GOOD: each one a real, specific misconception, articulated as
 * substantially as the key. When distractors are genuine misconceptions, the
 * item becomes diagnostic, the options become parallel in substance, and length
 * parity falls out for free.
 *
 * THE PIPELINE (per task)
 * -----------------------
 *   1. sourceMisconceptions()  - one call per task: the real wrong mental models
 *                                candidates hold about these concepts.
 *   2. draft (in buildCleanItems) - items whose distractors are each built on a
 *                                distinct sourced misconception, all four options
 *                                parallel in structure / specificity / length.
 *   3. critiqueAndRevise()     - a hostile expert reviewer pass against the
 *                                item-writing-flaw checklist (cueing, multiple
 *                                defensible answers, throwaway distractors,
 *                                triviality/trickery). Repairs or rejects. This
 *                                is the AI analog of SME review and is where
 *                                amateur items become professional ones.
 *   4. structural guards       - validateEnglish + auditItem + shuffleOptions
 *                                from item-cue-guard.mjs, as the final safety net
 *                                UNDER good items (not carrying the whole load).
 *
 * HONEST CEILING: this produces professionally drafted, internally reviewed,
 * cue-neutral DRAFT items. It is not a human SME panel and not real item
 * statistics (difficulty/discrimination from live candidates). Those remain the
 * genuine validators and are correctly flagged as pending in the scheme docs.
 *
 * Cost: ~1 source call per task + (1 draft + 1 critique) per round, on top of
 * the 2 translation calls. Worth it for the flagship line.
 *
 * Pure of secrets: callClaude is injected by the caller.
 */

import { CUE_NEUTRALITY_RULES, auditItem, shuffleOptions } from "./item-cue-guard.mjs";

// ---------------------------------------------------------------------------
// ATTRIBUTION - for certs whose subject matter is a published standard or
// framework. Interpolated into the draft prompt and enforced by the critique
// stage. Added 2026-08-06 after ISMS-F shipped items asserting requirements
// that the standard does not contain (HANDOFF v5.5 section 2). verify-cert
// checks structure, coverage, cue neutrality, firewall and Bloom - it does NOT
// check whether a factual claim is true. This is the only guard on that class.
// ---------------------------------------------------------------------------
export const ATTRIBUTION_RULES = `ATTRIBUTION - applies only where the subject matter is a published
standard, framework, or named body of knowledge:
  - State what a document REQUIRES only where it is a requirement in that
    document text. Preserve the modal: "shall" is a requirement, "should" is
    guidance, and a NOTE is neither.
  - Where a widely-taught rule is an IMPLICATION of the text rather than the
    text itself, attribute it to practice - "in practice", "commonly", "most
    certification bodies" - never to the standard.
  - Where the real source is a DIFFERENT document, name that document. Audit
    conduct rules are ISO 19011. Certification cycles and certificate validity
    are ISO/IEC 17021-1 and the scheme-specific requirements standard. Do not
    attribute either to the management system standard being taught.
  - NEVER write "the standard requires X" where X is common professional
    vocabulary rather than text. A risk register, maturity levels, a
    three-year certificate and a RACI matrix are practice, not requirements.
  - A DISTRACTOR may be a false attribution - that is a real misconception and
    makes a good distractor. The KEY and the EXPLANATION must never contain
    one.`;

export const L2_CONTRACT = `LEVEL II ITEM CONTRACT - this task is tier 2. It REPLACES the
single-defensible-answer rule above.

  - FOUR options, ALL of them defensible on the facts given. One is BEST.
  - The best answer must be better than the second-best for a reason a competent
    practitioner could state in ONE SENTENCE. If you cannot write that sentence,
    the item is a coin flip between two good answers and must be rewritten.
  - The second-best must be GENUINELY DEFENSIBLE, not merely wrong. An item whose
    second choice is incorrect is a Level I item in the wrong bank. Ask of it:
    would a competent practitioner who chose this be making a defensible call, or
    a mistake? It must be the former.
  - The two remaining options are also defensible positions - narrower, or resting
    on a premise the scenario undercuts, or correct in a neighbouring situation.
    None is a throwaway.
  - WHAT SEPARATES THEM is qualification, scope, or what the evidence actually
    supports - not one option being right and three wrong. Typical shapes:
      * the best answer states what the evidence establishes; the second states
        slightly more than it establishes;
      * the best answer names the requirement that actually applies; the second
        names a real requirement that applies to a neighbouring situation;
      * the best answer is bounded by a condition the scenario supplies; the
        second omits the condition and is right only when it happens to hold.
  - THE BEST ANSWER MAY THEREFORE BE LONGER, because a qualifying clause is often
    exactly what makes it best. Do not pad the others to match, and do not strip
    the qualification to shorten it. Match them in SUBSTANCE: every option carries
    its own reasoning, so no option is thin.
  - The explanation must say why the best answer is better THAN THE SECOND-BEST
    specifically, naming both by their content. "The others are wrong" is not an
    acceptable explanation at this tier, because they are not wrong.`

// ---------------------------------------------------------------------------
// Shared grounding + the canonical English validator (moved here from the
// generators so there is one definition).
// ---------------------------------------------------------------------------
// GROUNDING is no longer a single hardcoded (Scrum) constant. It is resolved PER
// CERT - see ./item-grounding.mjs. The Scrum text is preserved verbatim there for
// the Scrum certs, so their generation is unchanged; other certs get grounding that
// matches their actual audience. A hardcoded Scrum grounding was producing
// sprint-backlog scenarios inside an AI-literacy exam aimed at HR/marketing/ops -
// a construct-irrelevant validity defect that passed every other gate.
import { groundingFor } from "./item-grounding.mjs";
// Difficulty/Bloom guidance is likewise per-cert: a literacy tier WANTS recall items
// and must never exceed its declared ceiling. See ./item-profile.mjs.
import { difficultyLineFor } from "./item-profile.mjs";
// The JOB-TASK ANALYSIS finally reaches the item writer. Items are written to assess
// a TASK at the cognitive level the JTA declares for it - not to cover a bag of
// concepts at a difficulty level someone invented. See ./item-task-context.mjs.
import { taskBlock, bloomDirective } from "./item-task-context.mjs";

/**
 * Does THIS task get the Level II item contract?
 *
 * Tier alone is too broad. ISMS-IA is tier 2, but 13 of its 38 tasks sit at
 * 2_understand or 3_apply, and there the four-defensible contract is dishonest.
 * A dry run on task 5.3 - "select the nonconformity statement that correctly
 * links evidence to requirement" - showed it plainly: the wrong options prescribe
 * a remedy, attribute intent, or substitute consequence for evidence. Those are
 * real auditor errors and excellent distractors, but they are NOT defensible
 * calls. A competent auditor does not write "the procurement team disregarded
 * supplier policy". That task has one right answer by construction.
 *
 * The contract belongs where the candidate WEIGHS things: analyze-level tasks,
 * where two principles pull against each other or the evidence supports one
 * conclusion better than another. Verified on task 1.2, which produced four
 * options each naming a real tension, with a best answer beatable in one
 * sentence.
 *
 * Bloom alone would be too broad the other way: nine tier-1 certs hold 37
 * 4_analyze tasks between them, and switching their contract would leave their
 * banks internally inconsistent - old items one-right-three-wrong, new items
 * four-defensible. Both conditions, therefore.
 */
function isL2(task, tier) {
  return Number(tier) >= 2 && String(task?.bloom_level || "") === "4_analyze";
}

export function validateEnglish(q, tier = 1, task = null) {
  if (!q || typeof q !== "object") return false;
  if (typeof q.question_text !== "string" || q.question_text.length < 10) return false;
  if (!["single_choice", "true_false"].includes(q.question_type)) return false;
  if (!Array.isArray(q.options) || q.options.length < 2) return false;
  if (!q.options.every((o) => o && typeof o.id === "string" && typeof o.text === "string")) return false;
  const ids = new Set(q.options.map((o) => o.id));
  if (ids.size !== q.options.length) return false;
  if (!Array.isArray(q.correct_answer) || q.correct_answer.length !== 1) return false;
  if (!q.correct_answer.every((id) => ids.has(id))) return false;
  // DIFFICULTY IS REPAIRABLE METADATA, NOT A VALIDITY CONDITION.
  //
  // Instrumenting the draft filter showed roughly 9 of 22 rejects on ISMS-IA task
  // 1.2 were items with sound stems and options comfortably inside the ceiling,
  // discarded solely because the model omitted "difficulty". Every other field was
  // present and well-formed. Throwing away a defensible analyze-level item over a
  // missing integer is pure waste: the field is a dial for form assembly, not a
  // property that makes the item right or wrong.
  //
  // So repair it in place. 3 is the middle of the 1-5 range and the modal value the
  // generators actually produce; a mis-set difficulty costs a slightly off-target
  // difficulty mix, while a rejected item costs a whole generation round.
  //
  // Out-of-RANGE difficulty is still a rejection - that is the model asserting
  // something wrong rather than omitting something.
  if (q.difficulty === undefined || q.difficulty === null) q.difficulty = 3;
  if (typeof q.difficulty !== "number" || q.difficulty < 1 || q.difficulty > 5) return false;
  if (typeof q.explanation !== "string" || q.explanation.length < 5) return false;

  // LENGTH CEILING. The prompt asks; this enforces. An item that cannot be read inside
  // the exam's per-item budget measures reading speed, not competence - and measures it
  // most harshly in es-419 and pt-BR, which run 15-25% longer for identical content.
  //
  // THE CEILING IS PER TIER, and it has to be. A Level II option names two positions
  // and what separates them. "Independence against due professional care: independence
  // requires distance from the audited activity, yet due professional care requires the
  // competence only this person holds" is 25 words for the SHORTEST honest version of
  // that option - and it has not yet said why the alternative is weaker.
  //
  // Under the Level I ceiling, six consecutive live runs on ISMS-IA task 1.2 produced
  // five usable items and reported "no valid drafts this round" fifteen times. The
  // drafts were dying HERE, before critique or the cue guard ever saw them, because the
  // contract asks for reasoning the ceiling forbids. The survivors were the ones that
  // squeaked under - which selects for thin options, the exact shape Level II exists to
  // avoid.
  //
  // The reading-time argument survives the change; it is a budget, not a bound. Four
  // 45-word options and a 90-word stem is roughly 90 seconds of reading before any
  // thinking, so a 60-item Level II form needs about 150 minutes rather than 90. That
  // is a scheme decision with a stated reason - comparing two defensible positions IS
  // the competence being measured - not a number to preserve by discarding good items.
  const l2 = isL2(task, tier);
  const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;
  if (words(q.question_text) > (l2 ? 90 : 60)) return false;
  if ((q.options || []).some((o) => words(o.text) > (l2 ? 45 : 25))) return false;
  return true;
}

/**
 * Why did this draft fail validation? Returns null if it passed.
 *
 * Exists so the orchestrator can ROUTE rather than discard. An item whose only
 * fault is an over-length option is repairable - normalizeOptions was written to
 * shorten options while preserving meaning - but it sat downstream of the gate
 * that made it necessary, reachable only from the stage-4 cue guard. So the
 * pipeline had two length checks with opposite consequences: the character-based
 * cue guard repaired, and the word-based ceiling destroyed.
 *
 * Measured on ISMS-IA task 1.2: items lost to options at 46, 46 and 49 words
 * against a 45 ceiling. One word over, whole item gone, three good distractors
 * with it.
 *
 * Only "option-length" is routable. Everything else here is a structural fault
 * normalizeOptions does not repair and must not be asked to.
 */
export function validationFault(q, tier = 1, task = null) {
  if (!q || typeof q !== "object") return "shape";
  if (typeof q.question_text !== "string" || q.question_text.length < 10) return "stem-missing";
  if (!["single_choice", "true_false"].includes(q.question_type)) return "type";
  if (!Array.isArray(q.options) || q.options.length < 2) return "options-missing";
  if (!q.options.every((o) => o && typeof o.id === "string" && typeof o.text === "string")) return "option-shape";
  if (new Set(q.options.map((o) => o.id)).size !== q.options.length) return "duplicate-ids";
  if (!Array.isArray(q.correct_answer) || q.correct_answer.length !== 1) return "key-count";
  if (!q.correct_answer.every((id) => new Set(q.options.map((o) => o.id)).has(id))) return "key-unresolved";
  if (q.difficulty === undefined || q.difficulty === null) q.difficulty = 3;
  if (typeof q.difficulty !== "number" || q.difficulty < 1 || q.difficulty > 5) return "difficulty-range";
  if (typeof q.explanation !== "string" || q.explanation.length < 5) return "explanation";
  const l2 = isL2(task, tier);
  const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;
  // Stem length is NOT routable: normalizeOptions leaves the stem alone by design.
  if (words(q.question_text) > (l2 ? 90 : 60)) return "stem-length";
  if ((q.options || []).some((o) => words(o.text) > (l2 ? 45 : 25))) return "option-length";
  return null;
}

/**
 * Repair-or-drop. An item failing ONLY on option length gets one normalization
 * pass - the same repair the cue guard already gets - before being discarded.
 * normalizeOptions re-validates its own output, so a repair that is still over
 * length returns null and the item drops as before. No loop.
 */
async function keepOrRepair({ callClaude, items, certName, tier, task, log, stage }) {
  const out = [];
  for (const q of items || []) {
    const fault = validationFault(q, tier, task);
    if (!fault) { out.push(q); continue; }
    if (fault !== "option-length") { log(`  drop (${stage}): ${fault}`); continue; }
    const fixed = await normalizeOptions({ callClaude, item: q, certName, tier, task, log });
    if (fixed) { out.push(fixed); log(`  repaired (${stage}): option over length, shortened`); }
    else { log(`  drop (${stage}): option-length, repair failed`); }
  }
  return out;
}

// Difficulty guidance is resolved PER CERT TIER - see ./item-profile.mjs.
// (The old hardcoded 30/50/20 + "avoid level 1" text lives there as the
// PROFESSIONAL profile, preserved verbatim for the Scrum and governance certs.)

function personaLine(kind, certName) {
  return kind === "secure"
    ? `You are a senior certification exam item writer and subject-matter expert for
Certidemy (${certName}). You write SECURE, exam-grade questions in English for the
real certification exam - they must withstand professional scrutiny and
unambiguously discriminate a competent candidate from an unprepared one.`
    : `You are a senior certification item writer and subject-matter expert for
Certidemy (${certName}). You write practice questions in English at the rigor of a
professional certification.`;
}

// ---------------------------------------------------------------------------
// JSON parsing shared with the generators' style (fences-tolerant).
// ---------------------------------------------------------------------------
function parseJsonArray(text) {
  let t = (text || "").trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (!t.startsWith("[")) {
    const a = t.indexOf("[");
    const b = t.lastIndexOf("]");
    if (a !== -1 && b !== -1 && b > a) t = t.slice(a, b + 1);
  }
  return JSON.parse(t);
}

// ---------------------------------------------------------------------------
// Stage 1 - source the real misconceptions for a task's concepts.
// ---------------------------------------------------------------------------
export async function sourceMisconceptions({ callClaude, concepts, certName, log = () => {} }) {
  const system = `You are a senior assessment designer and subject-matter expert for Certidemy (${certName}).
Your job is to list the REAL misconceptions that competent-seeming candidates
actually hold about the given concept(s) - the wrong mental models people bring,
not strawmen. Each misconception must be:
  - genuinely tempting to someone with a shallow or partial understanding,
  - definitively wrong to someone who truly knows the material,
  - specific enough to anchor a single multiple-choice distractor.
These will be used to write distractors, so they must be substantive and distinct.

Output strict JSON: an array of 8-12 strings, each one misconception. NO prose, NO markdown fences.`;
  const user = `Concept(s):

${concepts.map((c) => `  - ${c.name}: ${c.description || ""}`).join("\n")}

List the real misconceptions now as a JSON array of strings.`;
  try {
    const raw = await callClaude({ system, user, maxTokens: 2000 });
    const arr = Array.isArray(raw) ? raw.filter((s) => typeof s === "string" && s.trim().length > 8) : [];
    if (arr.length) { log(`sourced ${arr.length} misconceptions`); return arr; }
  } catch (e) {
    log(`misconception sourcing failed: ${e.message} (drafting without a seed list)`);
  }
  return [];
}

// ---------------------------------------------------------------------------
// Stage 2 - draft items whose distractors map to real misconceptions and whose
// options are parallel in structure / specificity / length.
// ---------------------------------------------------------------------------
function draftSystem(kind, certName, task = null, tier = 1) {
  const l2 = isL2(task, tier);
  return `${personaLine(kind, certName)}

Strict requirements for every question:
  - ${l2 ? `question_type is ONLY "single_choice", with FOUR options. A two-option
    true/false item is a coin flip - a candidate who knows nothing scores 50% -
    and is never acceptable at this tier.` : `question_type is ONLY "single_choice" or "true_false". Never more than one
    correct answer. Prefer single_choice with 4 options for assessable depth.`}
  - ${l2 ? "The LEVEL II ITEM CONTRACT at the end of this prompt governs how many options are defensible - read it before writing." : `Exactly ONE defensibly correct answer. There must be no second option a
    knowledgeable person could argue for.`}
  - DISTRACTOR QUALITY IS THE PRIORITY. Each of the 3 distractors must be built on
    a DISTINCT, real misconception - a wrong mental model a candidate actually
    holds - drawn from the provided misconception list (or an equally specific one
    you supply). No throwaway options, no obviously-wrong options, no joke options,
    no "all/none of the above".
  - PARALLEL OPTIONS: write all four options in the same grammatical form, the
    same level of specificity, and closely matched length.

${ATTRIBUTION_RULES}

LENGTH CEILING - a hard limit, not a style preference:
  * The stem is at most ${l2 ? "90" : "60"} WORDS.
  * EACH option is at most ${l2 ? "45" : "25"} WORDS.${l2 ? `
    At this tier an option must name its position AND what makes it weaker or
    stronger than the alternative. That does not fit in 25 words. Use the room to
    carry reasoning, not to pad - an option that reaches 45 words by restating the
    stem is worse than one that says its piece in 30.` : ""}
An exam that cannot be READ in the time allowed measures reading speed, not competence -
and it penalises the Spanish and Portuguese versions hardest, since they run 15-25% longer
than English for the same content. Keep every option's "X, because Y" rationale - that is
what makes a distractor substantively wrong rather than merely wrong-sounding - but say it
TIGHTLY. Cut hedges, cut throat-clearing, cut restatements of the stem.

The correct answer must
    not stand out as longer, more qualified, or more "balanced/reasonable" than the
    distractors. A well-written distractor is as substantial as the key.
  - Option ids "a","b","c","d" (or "a","b" for true_false); correct_answer is an
    array with one option id.
  - Explanation: 1-3 sentences stating why the key is correct AND, where natural,
    why a tempting distractor is wrong. Refer to options by their CONTENT or
    substance, never by letter (do not write "option a", "option b", etc.); the
    options are reshuffled after writing, so letter references would be wrong.
  - ${bloomDirective(task, kind, difficultyLineFor(kind, certName))}
  - ${groundingFor(certName)}
${CUE_NEUTRALITY_RULES}
${l2 ? `\n${L2_CONTRACT}\n` : ""}
Output strict JSON, top level an array, NO prose, NO markdown fences:
[{"question_text":string,"question_type":"single_choice"|"true_false","options":[{"id":"a","text":string}],"correct_answer":[string],"explanation":string,"difficulty":1|2|3|4|5}]`;
}

function draftUser(concepts, misconceptions, k, task = null) {
  const mis = misconceptions.length
    ? `Real misconceptions to anchor distractors (use distinct ones across items; add equally specific ones if you need more):
${misconceptions.map((m) => `  - ${m}`).join("\n")}

`
    : "";
  const tb = taskBlock(task);
  return `${tb ? tb + "\n\n" : ""}Write ${k} new questions that assess ${task ? "THAT TASK" : "the following concept(s)"}, drawing on:

${concepts.map((c) => `  - ${c.name}: ${c.description || ""}`).join("\n")}

${mis}Each distractor must be a distinct real misconception, and all four options must be
parallel in form and length. Make the items distinct from one another. Produce the
JSON array now.`;
}

// ---------------------------------------------------------------------------
// Stage 3 - hostile critique-and-revise. Returns a revised item array.
// ---------------------------------------------------------------------------
function critiqueSystem(certName, tier = 1, task = null) {
  const l2 = isL2(task, tier);
  return `You are a hostile, expert item reviewer for Certidemy (${certName}), enforcing
professional multiple-choice item-writing standards. For EACH item you receive,
check for these flaws and FIX them:
  1. ANSWER CUES: the correct answer is longer, more detailed, more hedged, or
     more "reasonable/balanced-sounding" than the distractors; or the distractors
     cluster absolute words (always/never/must/only).

REJECT any item whose stem exceeds ${l2 ? "90" : "60"} words, or any option exceeding ${l2 ? "45" : "25"} words. Do not
merely flag it - rewrite it inside the ceiling, preserving the reasoning in each option.
If an item cannot be said inside the ceiling, it is testing reading stamina rather than
the competence, and should be rejected outright.

The answer must be findable
     ONLY by knowing the content. Rewrite so all four options are parallel in
     length, specificity, and tone.
  2. ${l2 ? `DEFENSIBILITY SPREAD (tier 2, analyze-level): every option must be defensible and ONE must be
     best. Two flaws, opposite directions. (a) An option that is simply wrong - a
     throwaway a competent practitioner would never choose - must be replaced with
     a defensible position: narrower, or resting on a premise the scenario
     undercuts, or right in a neighbouring situation. (b) If the best and
     second-best are equally good the item is a coin flip: sharpen the stem or the
     qualification until one is better, and be able to say why in one sentence. Do
     NOT "fix" this by making three options wrong - that converts a Level II item
     to Level I and destroys what it tests.` : `MULTIPLE DEFENSIBLE ANSWERS: if more than one option could be argued correct,
     tighten the stem or the options so exactly one is defensible.`}
  3. WEAK DISTRACTORS: any distractor that is obviously wrong, throwaway, or not a
     real misconception must be replaced with a genuine, specific misconception
     that a real candidate would hold.
  4. TRIVIALITY / TRICKERY: pure-recall trivia or gotcha items must be rewritten to
     test applied understanding fairly. This is an entry ("I") tier exam: fair, not
     tricky.
  5. CLARITY: fix unclear stems, double negatives, and remove "all/none of the
     above".
  6. EXPLANATION REFERENCES: the explanation must refer to options by their
     content or substance, never by letter (no "option a/b/c/d"). Rewrite any
     letter reference to name what the option actually says.
  7. FALSE ATTRIBUTION: any KEY or EXPLANATION that says a standard requires
     something the standard does not contain must be rewritten. Check the
     modal - a "should" or a NOTE is not a requirement - and check the source:
     audit conduct rules belong to ISO 19011, certification cycles and
     certificate validity to ISO/IEC 17021-1. Practice vocabulary (risk
     register, maturity levels, three-year certificates) is NOT normative text.
     Attribute it to practice or cut it. A DISTRACTOR built on a false
     attribution is legitimate and should be kept.

${l2 ? `\n${L2_CONTRACT}\n` : ""}
Preserve each item's tested concept and the MEANING of its correct answer. Keep
the same number of options. If an item is unsalvageable, set "reject": true.

Return strict JSON: an array of the SAME length and order as the input. Each
element: {"reject": boolean, "reason": string, "item": {"question_text":string,
"question_type":"single_choice"|"true_false","options":[{"id":"a","text":string}],
"correct_answer":[string],"explanation":string,"difficulty":1|2|3|4|5}}.
NO prose, NO markdown fences.`;
}

function critiqueUser(items) {
  const payload = items.map((q) => ({
    question_text: q.question_text,
    question_type: q.question_type,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    difficulty: q.difficulty,
  }));
  return `Review and revise these ${payload.length} items:

${JSON.stringify(payload, null, 2)}

Return the JSON array now.`;
}

// Coerce critique output to an item array. Accepts either the wrapped
// {reject,item} shape or a bare item array (model dropped the wrapper).
function coerceCritique(raw, n, log) {
  if (!Array.isArray(raw)) return null;
  // wrapped shape
  if (raw.length && raw[0] && typeof raw[0] === "object" && ("item" in raw[0] || "reject" in raw[0])) {
    const out = [];
    for (const el of raw) {
      if (!el || typeof el !== "object") continue;
      if (el.reject === true) { if (el.reason) log(`critique rejected: ${String(el.reason).slice(0, 80)}`); continue; }
      if (el.item && typeof el.item === "object") out.push(el.item);
    }
    return out;
  }
  // bare item array fallback
  if (raw.length && raw[0] && typeof raw[0] === "object" && "question_text" in raw[0]) {
    return raw;
  }
  return null;
}

export async function critiqueAndRevise({ callClaude, items, certName, tier = 1, task = null, log = () => {} }) {
  if (!items.length) return [];
  try {
    const raw = await callClaude({ system: critiqueSystem(certName, tier, task), user: critiqueUser(items), maxTokens: 12000 });
    const coerced = coerceCritique(raw, items.length, log);
    if (coerced && coerced.length) return coerced;
    log("critique returned nothing usable; dropping this round for re-draft");
    return [];
  } catch (e) {
    log(`critique failed: ${e.message}; dropping this round for re-draft`);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Targeted normalization - one narrow rewrite call to even out option lengths
// for an item that failed the parity gate. Fixes the CAUSE (the key is more
// developed than the distractors) rather than padding. Returns a fixed item or
// null. Only invoked on items that fail the length parity gate.
// ---------------------------------------------------------------------------
function normalizeSystem(certName, tier = 1, task = null) {
  const l2 = isL2(task, tier);
  return `You are an expert assessment editor for Certidemy (${certName}). You receive ONE
multiple-choice item whose options are uneven in length or development - typically
the correct answer is written more fully than the distractors, which is an answer
cue a test-wise candidate can exploit. Rewrite the OPTION TEXTS so that:
  - all four options are closely matched in length and depth of development;
  - ${l2 ? `the correct answer MAY be the longest: at tier 2 a qualifying clause is often
    exactly what makes it best, so do NOT strip qualification to shorten it. Match
    the options in SUBSTANCE instead - every option must carry its own reasoning
    so none is thin;` : `the correct answer is NOT the longest option, and at least one DISTRACTOR is
    as fully developed as the correct answer;`}
  - every option keeps its original MEANING and the SAME option remains correct;
  - distractors stay genuine, specific misconceptions - do NOT weaken them into
    obviously-wrong throwaways just to match length.
Keep the stem unchanged. Keep the explanation's meaning and refer to options by
their content, never by letter. Preserve question_type, correct_answer (same id),
and difficulty.

Return a JSON array containing the SINGLE revised item:
[{"question_text":string,"question_type":string,"options":[{"id":"a","text":string}],"correct_answer":[string],"explanation":string,"difficulty":1|2|3|4|5}]
NO prose, NO markdown fences.`;
}

async function normalizeOptions({ callClaude, item, certName, tier = 1, task = null, log = () => {} }) {
  try {
    const raw = await callClaude({
      system: normalizeSystem(certName),
      user: `Rewrite this item for option-length parity:\n\n${JSON.stringify(item, null, 2)}\n\nReturn the JSON array now.`,
      maxTokens: 3000,
    });
    const arr = Array.isArray(raw) ? raw : [];
    const fixed = arr[0];
    return fixed && validateEnglish(fixed, tier, task) ? fixed : null;
  } catch (e) {
    log(`normalize failed: ${e.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Orchestrator - draft -> critique -> parity gate (normalize-or-drop) -> shuffle.
// Returns clean, cue-neutral English items ready for translation.
// ---------------------------------------------------------------------------
export async function buildCleanItems({ callClaude, concepts, k, certName, kind, task = null, tier = 1, misconceptions = [], log = () => {} }) {
  // Stage 2: draft
  let drafts;
  try {
    drafts = await callClaude({ system: draftSystem(kind, certName, task, tier), user: draftUser(concepts, misconceptions, k, task) });
  } catch (e) {
    log(`draft failed: ${e.message}`);
    return [];
  }
  const rawCount = Array.isArray(drafts) ? drafts.length : -1;
  drafts = await keepOrRepair({ callClaude, items: drafts, certName, tier, task, log, stage: "draft" });
  log(`  drafts: ${rawCount} returned, ${drafts.length} kept`);
  if (!drafts.length) { log("no valid drafts this round"); return []; }

  // Stage 3: hostile critique-and-revise
  const revised = await critiqueAndRevise({ callClaude, items: drafts, certName, tier, task, log });
  // The hostile reviewer is told to rewrite inside the ceiling. When its rewrite
  // lands a word over, its work was being thrown away too - same gate, same fix.
  const reviewed = await keepOrRepair({ callClaude, items: revised, certName, tier, task, log, stage: "critique" });
  if (!reviewed.length) { log("no items survived critique this round"); return []; }

  // Stage 4: parity gate -> normalize-or-drop -> position de-bias.
  const clean = [];
  for (const q of reviewed) {
    let item = q;
    let a = auditItem(item);
    // Length/parity failures get one repair attempt; absolute-word tells are
    // dropped (they regenerate next round - normalization is for length, not tone).
    if (!a.ok && /length|dominates|spread/i.test(a.reason)) {
      const fixed = await normalizeOptions({ callClaude, item, certName, tier, task, log });
      if (fixed) {
        const a2 = auditItem(fixed);
        if (a2.ok) { item = fixed; a = a2; log("normalized: evened option lengths"); }
        else { a = a2; }
      }
    }
    if (!a.ok) { log(`drop (cue): ${a.reason}`); continue; }
    clean.push(shuffleOptions(item));
  }
  return clean;
}

export { parseJsonArray };
