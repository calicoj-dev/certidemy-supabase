#!/usr/bin/env node
/**
 * measure-review-branch-exposure.mjs -- what `get-review-batch`'s due-reviews branch can serve today.
 *
 * READ-ONLY. No writes, no model calls, no credential printed. Unknown flags exit 2.
 *
 * Ruled PROMPT-96 s1a. The due-reviews branch filters `user_id`, `certification_id` and `due <= now` and
 * NOTHING ELSE -- no `status`, no `pool`, no `retired_at`, no `language`. The new-items branch beside it
 * filters all four. So this measures the exposure per certification, before the fix, from the rows
 * themselves.
 *
 * ============ WHAT "DUE" MEANS HERE, AND WHY TWO POPULATIONS ARE COUNTED ============
 *
 * The branch serves a card when `due <= now`, so the live exposure is the DUE set. But a card not yet due
 * becomes due on its own schedule with no further action, so counting only the due set reports a number that
 * grows while nobody changes anything. Both are counted and named apart: `due now` is what a learner can be
 * served today, `all cards` is what the branch will serve eventually.
 *
 * ============ AND THE LANGUAGE QUESTION IS ABOUT THE REQUEST, NOT ABOUT THE ROW ============
 *
 * A card points at a question in whatever language the learner first saw. Serving it back is only wrong
 * RELATIVE TO THE LANGUAGE NOW REQUESTED, which this script cannot know -- there is no record of the locale
 * a learner is currently on. So the language column is reported as a DISTRIBUTION, not as a defect count: an
 * es-419 learner is exposed to every card pointing at a non-es-419 row, and an English learner to every card
 * pointing at a non-English one. Reporting "N wrong-language cards" would be a number about a request nobody
 * made. Stated rather than guessed at.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn } from "./_pg.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". This script is READ-ONLY and takes none.");
  process.exit(2);
}
const KEY = requireKey(dirname(fileURLToPath(import.meta.url)));

const cards = await getAll(KEY, "fsrs_cards?select=id,user_id,question_id,due,state&order=id");
const qIds = [...new Set(cards.map((c) => c.question_id).filter(Boolean))];
const qs = await getAllIn(KEY, "quiz_questions",
  "id,certification_id,language,pool,status,retired_at,item_origin,question_group_id,task_id",
  "id", qIds, "&order=id");
const byId = new Map(qs.map((q) => [q.id, q]));
const certs = await getAll(KEY, "certifications?select=id,code&order=code");
const certCode = new Map(certs.map((c) => [c.id, c.code]));

/* THE JOIN MUST BE PROVABLY COMPLETE. A card whose question could not be read would silently drop out of
 * every count below, and the report would be about the cards that happened to resolve. */
const unresolved = cards.filter((c) => !byId.has(c.question_id));
if (unresolved.length) {
  console.error("ABORT: " + unresolved.length + " of " + cards.length + " card(s) point at a question this " +
    "read could not resolve. Every count below would be about the cards that happened to join.");
  process.exit(2);
}

const now = Date.now();
const isDue = (c) => new Date(c.due).getTime() <= now;

const rows = new Map();   /* certCode -> tallies */
const bump = (code, key, n = 1) => {
  if (!rows.has(code)) {
    rows.set(code, { cards: 0, due: 0, retired: 0, notApproved: 0, notPractice: 0, secure: 0,
      dueRetired: 0, dueNotApproved: 0, dueNotPractice: 0, dueSecure: 0, byLang: {}, dueByLang: {},
      generated: 0, dueGenerated: 0, users: new Set() });
  }
  rows.get(code)[key] += n;
};

for (const c of cards) {
  const q = byId.get(c.question_id);
  const code = certCode.get(q.certification_id) || "(no certification)";
  bump(code, "cards");
  rows.get(code).users.add(c.user_id);
  const due = isDue(c);
  if (due) bump(code, "due");
  const t = rows.get(code);
  t.byLang[q.language] = (t.byLang[q.language] || 0) + 1;
  if (due) t.dueByLang[q.language] = (t.dueByLang[q.language] || 0) + 1;
  if (q.retired_at) { bump(code, "retired"); if (due) bump(code, "dueRetired"); }
  if (q.status !== "approved") { bump(code, "notApproved"); if (due) bump(code, "dueNotApproved"); }
  if (q.pool !== "practice") { bump(code, "notPractice"); if (due) bump(code, "dueNotPractice"); }
  if (q.pool === "secure") { bump(code, "secure"); if (due) bump(code, "dueSecure"); }
  if (q.item_origin === "generated") { bump(code, "generated"); if (due) bump(code, "dueGenerated"); }
}

console.log("GET-REVIEW-BATCH, DUE-REVIEWS BRANCH -- what it can serve, per certification");
console.log("");
console.log("The branch filters user, certification and `due <= now`. It does NOT filter status, pool,");
console.log("retired_at or language. The new-items branch beside it filters all four.");
console.log("");
console.log("cert        learners  cards   due | RETIRED  not-approved  not-practice  SECURE");
console.log("                                  |  (due / all for each)");
let tot = { cards: 0, due: 0, retired: 0, notApproved: 0, notPractice: 0, secure: 0,
  dueRetired: 0, dueNotApproved: 0, dueNotPractice: 0, dueSecure: 0 };
for (const [code, t] of [...rows].sort((a, b) => b[1].cards - a[1].cards)) {
  console.log("  " + code.padEnd(11) + String(t.users.size).padStart(6) + String(t.cards).padStart(7) +
    String(t.due).padStart(6) + " |" +
    (t.dueRetired + "/" + t.retired).padStart(9) +
    (t.dueNotApproved + "/" + t.notApproved).padStart(14) +
    (t.dueNotPractice + "/" + t.notPractice).padStart(14) +
    (t.dueSecure + "/" + t.secure).padStart(9));
  for (const k of Object.keys(tot)) tot[k] += t[k];
}
console.log("  " + "TOTAL".padEnd(11) + "      " + String(tot.cards).padStart(7) +
  String(tot.due).padStart(6) + " |" +
  (tot.dueRetired + "/" + tot.retired).padStart(9) +
  (tot.dueNotApproved + "/" + tot.notApproved).padStart(14) +
  (tot.dueNotPractice + "/" + tot.notPractice).padStart(14) +
  (tot.dueSecure + "/" + tot.secure).padStart(9));
console.log("");

console.log("LANGUAGE DISTRIBUTION -- reported as a distribution, never as a defect count");
console.log("  There is no record of the locale a learner is CURRENTLY on, so \"wrong language\" is a fact");
console.log("  about a request this script cannot see. What it can say is which cards point at which");
console.log("  language: an es-419 learner is exposed to every card outside es-419, and so on.");
console.log("");
for (const [code, t] of [...rows].sort((a, b) => b[1].cards - a[1].cards)) {
  const all = Object.entries(t.byLang).sort((a, b) => b[1] - a[1]);
  const due = Object.entries(t.dueByLang).sort((a, b) => b[1] - a[1]);
  console.log("  " + code.padEnd(11) + "all: " + all.map(([k, v]) => k + " " + v).join(", ") +
    "   |   due: " + (due.length ? due.map(([k, v]) => k + " " + v).join(", ") : "none"));
}
console.log("");

/* ============ HAS A SECURE ITEM EVER BEEN SERVED THROUGH THIS BRANCH? ============
 *
 * The ruling asks it separately and it deserves a separate answer, because the honest one is bounded by
 * what is recorded rather than by what is possible.
 *
 * A card EXISTS only if `submit-quiz-answer` wrote it, and that function refuses `pool='secure'` before it
 * writes. So a secure card cannot be created through the practice path -- and a card pointing at a secure
 * row today would mean either the row's pool CHANGED after the card was written, or some other writer made
 * it. That distinction is the whole finding, and neither half can be read off the card.
 */
{
  const secureCards = cards.filter((c) => byId.get(c.question_id).pool === "secure");
  console.log("HAS A SECURE ITEM EVER BEEN SERVED THROUGH THIS BRANCH?");
  console.log("  cards pointing at a secure row, today:  " + secureCards.length);
  console.log("");
  if (!secureCards.length) {
    console.log("  NOT PROVEN EITHER WAY, and that is the honest answer. Zero cards point at a secure row");
    console.log("  today, so nothing is exposed NOW. What that does not establish is history: a card carries");
    console.log("  `created_at` and the question's CURRENT pool, and nothing records the pool at the time the");
    console.log("  card was written. If an item was practice then and secure now, the card would look");
    console.log("  identical to one that was always practice.");
    console.log("");
    console.log("  WHAT DOES CONSTRAIN IT: `submit-quiz-answer` refuses pool='secure' before writing a card,");
    console.log("  so the practice path cannot create one. That is a guarantee about the WRITER, which this");
    console.log("  repository already records as the weaker kind -- `a guarantee that depends on a second");
    console.log("  column staying true is not a guarantee`. The reader has never had the filter.");
    console.log("");
    console.log("  There is no answer-level audit table tying a served item to a session and a branch, so");
    console.log("  `has it ever happened` is UNANSWERABLE from what is recorded. Reported as unanswerable");
    console.log("  rather than as no.");
  } else {
    console.log("  " + secureCards.length + " card(s) point at a secure row RIGHT NOW:");
    for (const c of secureCards.slice(0, 20)) {
      const q = byId.get(c.question_id);
      console.log("    card " + c.id.slice(0, 8) + "  question " + c.question_id.slice(0, 8) + "  " +
        (certCode.get(q.certification_id) || "?") + "  status " + q.status + "  due " +
        (isDue(c) ? "NOW" : c.due.slice(0, 10)));
    }
  }
}
console.log("");

/* ---- the sibling the fix depends on: is there one, per card, in each language? ---- */
{
  const groups = [...new Set(qs.map((q) => q.question_group_id).filter(Boolean))];
  const sib = await getAllIn(KEY, "quiz_questions", "id,question_group_id,language,status,pool,retired_at",
    "question_group_id", groups, "&order=id");
  const byGroup = new Map();
  for (const s of sib) {
    if (!byGroup.has(s.question_group_id)) byGroup.set(s.question_group_id, []);
    byGroup.get(s.question_group_id).push(s);
  }
  const LANGS = ["en", "es-419", "pt-BR"];
  const servable = (s) => s.status === "approved" && s.pool === "practice" && !s.retired_at;
  console.log("THE SIBLING THE FIX DEPENDS ON -- per card, is there a SERVABLE sibling in each language?");
  console.log("  (servable = approved, practice pool, not retired. The fix resolves the language through");
  console.log("  `question_group_id`; where no servable sibling exists it must SKIP and log, never fall back");
  console.log("  to English.)");
  console.log("");
  console.log("  language   cards with a servable sibling   cards WITHOUT   no group id at all");
  for (const lang of LANGS) {
    let has = 0, missing = 0, noGroup = 0;
    for (const c of cards) {
      const q = byId.get(c.question_id);
      if (!q.question_group_id) { noGroup++; continue; }
      const found = (byGroup.get(q.question_group_id) || []).some((s) => s.language === lang && servable(s));
      if (found) has++; else missing++;
    }
    console.log("  " + lang.padEnd(10) + String(has).padStart(28) + String(missing).padStart(16) +
      String(noGroup).padStart(20));
  }
  console.log("");
  console.log("  A card with NO group id can never be language-resolved, so it is its own state: the fix");
  console.log("  must skip it in any language but the one its own row is in.");
}
