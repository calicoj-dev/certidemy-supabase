#!/usr/bin/env node
/**
 * diagnose-practice-locale.mjs -- why a Spanish practice URL serves English items.
 *
 * READ-ONLY. Fixes nothing. Unknown flags exit 2. Ruled PROMPT-95 follow-up 1.
 *
 * ============ (a) THE ANSWER: IT DOES NOT FALL BACK. ONE HALF IGNORES THE LOCALE. ============
 *
 * The client chain carries the locale correctly, end to end:
 *
 *   components/quiz/quiz-mode-picker.tsx:147   locale -> lang
 *   components/quiz/quiz-mode-picker.tsx:189   language: lang, into startSession
 *   lib/engine/sessions.ts:113                 language: options.language, into getReviewBatch
 *   lib/engine/client.ts:226                   args passed through to the function verbatim
 *
 * `get-review-batch` then serves TWO halves, and only one of them filters language:
 *
 *   NEW ITEMS      functions/get-review-batch/index.ts:79   .eq('language', language)   CORRECT
 *   DUE REVIEWS    functions/get-review-batch/index.ts:42-54  NO language filter at all
 *
 * So a learner with due FSRS cards is served whatever language those ROWS are in. A card created during an
 * English session points at an English row and keeps serving it in every locale, forever. That is not a
 * fallback -- a fallback implies the Spanish row was looked for. It was not.
 *
 * The file's own header states the opposite at line 12: "and in the requested language, so a review/practice
 * slate can never surface...". That sentence is true of the new-items half and false of the file.
 *
 * ============ AND THE SAME BRANCH IS MISSING THREE MORE FILTERS ============
 *
 * The new-items half filters pool, status and retired_at -- the last two added 2026-09-18 after 132 withdrawn
 * items were found still reachable. The due-reviews half filters NONE of them. Whether that is live exposure
 * depends on what the cards actually point at, which is measured below rather than argued: cards are written
 * by `submit-quiz-answer`, which refuses pool=secure, so the guarantee currently rests on the WRITER. A
 * guarantee that depends on another component staying correct is the shape this repository keeps paying for.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn } from "./_pg.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const KEY = requireKey(HERE);

console.log("(a) WHAT THE DUE-REVIEWS BRANCH ACTUALLY POINTS AT");
console.log("");
const cards = await getAll(KEY, "fsrs_cards?select=question_id,user_id,due&order=question_id");
console.log("  fsrs_cards rows                " + cards.length);
if (!cards.length) {
  console.log("  VACUOUS: no cards exist, so the unfiltered branch cannot be exercised and this says nothing");
  console.log("  about the defect -- which is in the query, not in the data.");
} else {
  const ids = [...new Set(cards.map((c) => c.question_id).filter(Boolean))];
  const rows = await getAllIn(KEY, "quiz_questions",
    "id,language,pool,status,retired_at,certification_id", "id", ids, "&order=id");
  const byId = new Map(rows.map((r) => [r.id, r]));
  const lang = {}, pool = {}, status = {};
  let retired = 0, missing = 0;
  for (const c of cards) {
    const r = byId.get(c.question_id);
    if (!r) { missing++; continue; }
    lang[r.language] = (lang[r.language] || 0) + 1;
    pool[r.pool] = (pool[r.pool] || 0) + 1;
    status[r.status] = (status[r.status] || 0) + 1;
    if (r.retired_at) retired++;
  }
  console.log("  cards whose question is gone   " + missing);
  console.log("  by LANGUAGE of the row they point at:");
  for (const [k, v] of Object.entries(lang).sort((a, b) => b[1] - a[1])) {
    console.log("      " + String(v).padStart(6) + "  " + k);
  }
  console.log("  by POOL:    " + Object.entries(pool).map(([k, v]) => k + ":" + v).join("  "));
  console.log("  by STATUS:  " + Object.entries(status).map(([k, v]) => k + ":" + v).join("  "));
  console.log("  RETIRED rows a due review could still serve: " + retired);
  console.log("");
  const nonEn = Object.entries(lang).filter(([k]) => k !== "en").reduce((s, [, v]) => s + v, 0);
  console.log("  " + (lang.en || 0) + " of " + cards.length + " cards point at an ENGLISH row. A learner in");
  console.log("  es-419 or pt-BR with any of those due is served English, because the branch never asks.");
  if (nonEn) console.log("  " + nonEn + " point at a non-English row, so the reverse happens too.");
}
console.log("");

/* ---------------------------------------------------------------- (b) sibling coverage */
console.log("(b) PRACTICE POOL: SHARE WITH AN APPROVED es-419 AND pt-BR SIBLING");
console.log("");
console.log("  cert         en approved   with es-419   with pt-BR   both");
console.log("  " + "-".repeat(68));
const certs = await getAll(KEY, "certifications?select=id,code&order=code");
let te = 0, tes = 0, tpt = 0, tb = 0;
for (const c of certs) {
  const qs = await getAll(KEY, "quiz_questions?select=id,language,status,question_group_id" +
    "&certification_id=eq." + c.id + "&pool=eq.practice&retired_at=is.null&order=id");
  /* grouped by question_group_id, which is the trilingual sibling key. A row with NO group id can have no
   * sibling by construction and is counted as lacking one rather than excluded -- excluding it would
   * flatter the share. */
  const groups = new Map();
  for (const q of qs) {
    const k = q.question_group_id || ("solo:" + q.id);
    if (!groups.has(k)) groups.set(k, {});
    if (q.status === "approved") groups.get(k)[q.language] = true;
  }
  let en = 0, es = 0, pt = 0, both = 0;
  for (const g of groups.values()) {
    if (!g.en) continue;                 /* the English row is the unit being counted */
    en++;
    if (g["es-419"]) es++;
    if (g["pt-BR"]) pt++;
    if (g["es-419"] && g["pt-BR"]) both++;
  }
  if (!en) continue;
  te += en; tes += es; tpt += pt; tb += both;
  const pc = (n) => (en ? Math.round((n / en) * 100) + "%" : "-");
  console.log("  " + c.code.padEnd(12) + String(en).padStart(11) +
    ("  " + es + " " + pc(es)).padStart(14) + ("  " + pt + " " + pc(pt)).padStart(13) +
    ("  " + pc(both)).padStart(7));
}
console.log("  " + "-".repeat(68));
console.log("  TOTAL       " + String(te).padStart(11) +
  ("  " + tes + " " + Math.round((tes / te) * 100) + "%").padStart(14) +
  ("  " + tpt + " " + Math.round((tpt / te) * 100) + "%").padStart(13) +
  ("  " + Math.round((tb / te) * 100) + "%").padStart(7));
console.log("");
console.log("  Counted by question_group_id over APPROVED, NOT-RETIRED practice rows, with the English row as");
console.log("  the unit. A row with no group id cannot have a sibling and counts as lacking one -- excluding");
console.log("  those would flatter the share.");
