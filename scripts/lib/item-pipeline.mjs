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
// Shared grounding + the canonical English validator (moved here from the
// generators so there is one definition).
// ---------------------------------------------------------------------------
const GROUNDING = `Ground each question in the concept(s) provided and in established Scrum and
product-ownership practice (the 2020 Scrum Guide where it applies). Some concepts
extend beyond the Scrum Guide - product strategy, backlog craft, value and
measurement, and AI-assisted product ownership; for those, ground the question in
the concept description and sound product-management practice rather than forcing
a Scrum Guide citation. Do NOT reference any specific certification provider or brand.`;

export function validateEnglish(q) {
  if (!q || typeof q !== "object") return false;
  if (typeof q.question_text !== "string" || q.question_text.length < 10) return false;
  if (!["single_choice", "true_false"].includes(q.question_type)) return false;
  if (!Array.isArray(q.options) || q.options.length < 2) return false;
  if (!q.options.every((o) => o && typeof o.id === "string" && typeof o.text === "string")) return false;
  const ids = new Set(q.options.map((o) => o.id));
  if (ids.size !== q.options.length) return false;
  if (!Array.isArray(q.correct_answer) || q.correct_answer.length !== 1) return false;
  if (!q.correct_answer.every((id) => ids.has(id))) return false;
  if (typeof q.difficulty !== "number" || q.difficulty < 1 || q.difficulty > 5) return false;
  if (typeof q.explanation !== "string" || q.explanation.length < 5) return false;
  return true;
}

// Difficulty guidance differs slightly by pool, mirroring the originals.
function difficultyLine(kind) {
  return kind === "secure"
    ? `Difficulty 1..5, distributed about 30% level 2, 50% level 3, 20% level 4.
Avoid level 1 (trivial recall) and level 5 (overly tricky) - test applied
judgment. Favor scenario and Apply/Analyze items.`
    : `Difficulty 1=trivial recall .. 5=tricky multi-step. Favor Apply/Analyze
(3-4) over recall: aim ~40% level 2, ~40% level 3, ~20% level 4.`;
}

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
function draftSystem(kind, certName) {
  return `${personaLine(kind, certName)}

Strict requirements for every question:
  - question_type is ONLY "single_choice" or "true_false". Never more than one
    correct answer. Prefer single_choice with 4 options for assessable depth.
  - Exactly ONE defensibly correct answer. There must be no second option a
    knowledgeable person could argue for.
  - DISTRACTOR QUALITY IS THE PRIORITY. Each of the 3 distractors must be built on
    a DISTINCT, real misconception - a wrong mental model a candidate actually
    holds - drawn from the provided misconception list (or an equally specific one
    you supply). No throwaway options, no obviously-wrong options, no joke options,
    no "all/none of the above".
  - PARALLEL OPTIONS: write all four options in the same grammatical form, the
    same level of specificity, and closely matched length. The correct answer must
    not stand out as longer, more qualified, or more "balanced/reasonable" than the
    distractors. A well-written distractor is as substantial as the key.
  - Option ids "a","b","c","d" (or "a","b" for true_false); correct_answer is an
    array with one option id.
  - Explanation: 1-3 sentences stating why the key is correct AND, where natural,
    why a tempting distractor is wrong. Refer to options by their CONTENT or
    substance, never by letter (do not write "option a", "option b", etc.); the
    options are reshuffled after writing, so letter references would be wrong.
  - ${difficultyLine(kind)}
  - ${GROUNDING}
${CUE_NEUTRALITY_RULES}
Output strict JSON, top level an array, NO prose, NO markdown fences:
[{"question_text":string,"question_type":"single_choice"|"true_false","options":[{"id":"a","text":string}],"correct_answer":[string],"explanation":string,"difficulty":1|2|3|4|5}]`;
}

function draftUser(concepts, misconceptions, k) {
  const mis = misconceptions.length
    ? `Real misconceptions to anchor distractors (use distinct ones across items; add equally specific ones if you need more):
${misconceptions.map((m) => `  - ${m}`).join("\n")}

`
    : "";
  return `Write ${k} new questions that TEST the following concept(s):

${concepts.map((c) => `  - ${c.name}: ${c.description || ""}`).join("\n")}

${mis}Each distractor must be a distinct real misconception, and all four options must be
parallel in form and length. Make the items distinct from one another. Produce the
JSON array now.`;
}

// ---------------------------------------------------------------------------
// Stage 3 - hostile critique-and-revise. Returns a revised item array.
// ---------------------------------------------------------------------------
function critiqueSystem(certName) {
  return `You are a hostile, expert item reviewer for Certidemy (${certName}), enforcing
professional multiple-choice item-writing standards. For EACH item you receive,
check for these flaws and FIX them:
  1. ANSWER CUES: the correct answer is longer, more detailed, more hedged, or
     more "reasonable/balanced-sounding" than the distractors; or the distractors
     cluster absolute words (always/never/must/only). The answer must be findable
     ONLY by knowing the content. Rewrite so all four options are parallel in
     length, specificity, and tone.
  2. MULTIPLE DEFENSIBLE ANSWERS: if more than one option could be argued correct,
     tighten the stem or the options so exactly one is defensible.
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

export async function critiqueAndRevise({ callClaude, items, certName, log = () => {} }) {
  if (!items.length) return [];
  try {
    const raw = await callClaude({ system: critiqueSystem(certName), user: critiqueUser(items), maxTokens: 12000 });
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
function normalizeSystem(certName) {
  return `You are an expert assessment editor for Certidemy (${certName}). You receive ONE
multiple-choice item whose options are uneven in length or development - typically
the correct answer is written more fully than the distractors, which is an answer
cue a test-wise candidate can exploit. Rewrite the OPTION TEXTS so that:
  - all four options are closely matched in length and depth of development;
  - the correct answer is NOT the longest option, and at least one DISTRACTOR is
    as fully developed as the correct answer;
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

async function normalizeOptions({ callClaude, item, certName, log = () => {} }) {
  try {
    const raw = await callClaude({
      system: normalizeSystem(certName),
      user: `Rewrite this item for option-length parity:\n\n${JSON.stringify(item, null, 2)}\n\nReturn the JSON array now.`,
      maxTokens: 3000,
    });
    const arr = Array.isArray(raw) ? raw : [];
    const fixed = arr[0];
    return fixed && validateEnglish(fixed) ? fixed : null;
  } catch (e) {
    log(`normalize failed: ${e.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Orchestrator - draft -> critique -> parity gate (normalize-or-drop) -> shuffle.
// Returns clean, cue-neutral English items ready for translation.
// ---------------------------------------------------------------------------
export async function buildCleanItems({ callClaude, concepts, k, certName, kind, misconceptions = [], log = () => {} }) {
  // Stage 2: draft
  let drafts;
  try {
    drafts = await callClaude({ system: draftSystem(kind, certName), user: draftUser(concepts, misconceptions, k) });
  } catch (e) {
    log(`draft failed: ${e.message}`);
    return [];
  }
  drafts = (Array.isArray(drafts) ? drafts : []).filter(validateEnglish);
  if (!drafts.length) { log("no valid drafts this round"); return []; }

  // Stage 3: hostile critique-and-revise
  const revised = await critiqueAndRevise({ callClaude, items: drafts, certName, log });
  const reviewed = (Array.isArray(revised) ? revised : []).filter(validateEnglish);
  if (!reviewed.length) { log("no items survived critique this round"); return []; }

  // Stage 4: parity gate -> normalize-or-drop -> position de-bias.
  const clean = [];
  for (const q of reviewed) {
    let item = q;
    let a = auditItem(item);
    // Length/parity failures get one repair attempt; absolute-word tells are
    // dropped (they regenerate next round - normalization is for length, not tone).
    if (!a.ok && /length|dominates|spread/i.test(a.reason)) {
      const fixed = await normalizeOptions({ callClaude, item, certName, log });
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
