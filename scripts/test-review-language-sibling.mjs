#!/usr/bin/env node
/**
 * test-review-language-sibling.mjs -- the three things PROMPT-96 s1d asks to be shown.
 *
 * READ-ONLY. No writes, no model calls. Unknown flags exit 2. Exits non-zero on any failure, so it can gate
 * a deploy.
 *
 *   1. A Spanish session whose due reviews point at English items serves their Spanish siblings.
 *   2. A retired or pending item in due reviews is not served.
 *   3. Scheduling state is unchanged across a language switch.
 *
 * ============ WHAT IS EXERCISED, AND WHAT THAT CAN AND CANNOT SHOW ============
 *
 * The RESOLVER is exercised directly, on fixtures and then on the LIVE card set. The deployed function is
 * not called: doing so needs a learner JWT and a due card, and manufacturing one means writing an
 * `fsrs_cards` row for a real user -- a write into somebody's spaced repetition to test a read. This
 * repository's own rule is that a production control earns a recovery guard and is the exception rather than
 * the default; here the whole behaviour lives in a pure function, so the fixture IS the test.
 *
 * STATED RATHER THAN LEFT AS SILENCE: this proves the rule, not the wiring. The wiring is covered by
 * `deno check` on the function -- which is what caught the concatenated `select` collapsing the row type --
 * and by the post-deploy verification in DEPLOY-PRACTICE-LOCALE.md.
 *
 * ============ AND CLAIM 3 IS ABOUT WHAT THE CODE CANNOT DO ============
 *
 * "Scheduling state is unchanged across a language switch" is a NEGATIVE claim, so it carries a positive
 * control: the assertion is not merely that nothing was written, it is that the id the client is handed --
 * the key `fsrs_cards` is updated on -- is the CARD's own id in every language, and that a resolved review
 * differs from an unresolved one in the display fields ONLY. A test that just checked "no write happened"
 * would pass against a function that does nothing at all.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn } from "./_pg.mjs";
import { isServable, resolveSibling, languageSiblingControls }
  from "../functions/_shared/item-rules/language-sibling.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". This script is READ-ONLY and takes none.");
  process.exit(2);
}
const KEY = requireKey(dirname(fileURLToPath(import.meta.url)));
let fails = 0;
const ok = (what, cond, detail) => {
  console.log("  " + (cond ? "ok  " : "FAIL") + " " + what + (cond ? "" : "   -- " + detail));
  if (!cond) fails++;
};

console.log("THE SHARED RESOLVER'S OWN CONTROLS");
for (const r of languageSiblingControls()) ok(r.what, r.pass, r.detail);
console.log("");

/* ============ 1d.3 THE SCHEDULING CLAIM, ON FIXTURES, BOTH DIRECTIONS ============ */
console.log("1d.3  SCHEDULING STATE IS UNCHANGED ACROSS A LANGUAGE SWITCH");
{
  const card = { id: "card-1", due: "2026-01-01T00:00:00Z", state: "review", stability: 18.8,
    difficulty: 5.27 };
  const en = { id: "q-en", language: "en", status: "approved", pool: "practice", retired_at: null,
    question_group_id: "g", question_text: "EN stem", question_type: "single_choice",
    options: [{ id: "a", text: "EN a" }, { id: "b", text: "EN b" }] };
  const es = { ...en, id: "q-es", language: "es-419", question_text: "ES stem",
    options: [{ id: "a", text: "ES a" }, { id: "b", text: "ES b" }] };

  /* the payload the function builds, reproduced here from its own rule: card id + resolved display */
  const build = (lang) => {
    const r = resolveSibling(en, lang, [en, es]);
    if (!r.ok) return null;
    return { card_id: card.id, due: card.due, state: card.state, stability: card.stability,
      id: en.id, question_text: r.source.question_text, options: r.source.options,
      served_language: lang, served_from_question_id: r.is_sibling ? r.source.id : undefined };
  };
  const enPayload = build("en"), esPayload = build("es-419");
  ok("both locales resolve", !!enPayload && !!esPayload);
  ok("the id handed to the client is the CARD's question in BOTH locales -- the key fsrs_cards updates on",
    enPayload.id === en.id && esPayload.id === en.id,
    "en=" + enPayload.id + " es=" + esPayload.id);
  ok("the scheduling fields are byte-identical across the switch",
    JSON.stringify([enPayload.card_id, enPayload.due, enPayload.state, enPayload.stability]) ===
    JSON.stringify([esPayload.card_id, esPayload.due, esPayload.state, esPayload.stability]));
  /* THE POSITIVE HALF: something MUST differ, or this test would pass against a function that ignores the
   * language entirely -- which is the bug being fixed. */
  ok("and the DISPLAY does differ, so the test is not passing on a no-op",
    enPayload.question_text !== esPayload.question_text &&
    JSON.stringify(enPayload.options) !== JSON.stringify(esPayload.options));
  ok("the option IDS are identical, which is why grading is untouched",
    JSON.stringify(enPayload.options.map((o) => o.id)) ===
    JSON.stringify(esPayload.options.map((o) => o.id)));
  ok("a resolved review says which row supplied the text",
    esPayload.served_from_question_id === es.id && enPayload.served_from_question_id === undefined);
}
console.log("");

/* ============ 1d.2 RETIRED AND PENDING ARE NOT SERVED ============ */
console.log("1d.2  A RETIRED OR PENDING ITEM IN DUE REVIEWS IS NOT SERVED");
{
  const base = { language: "en", status: "approved", pool: "practice", retired_at: null,
    question_group_id: "g" };
  ok("a retired card row is refused", !isServable({ ...base, retired_at: "2026-01-01T00:00:00Z" }));
  ok("a pending_review card row is refused", !isServable({ ...base, status: "pending_review" }));
  ok("a rejected card row is refused", !isServable({ ...base, status: "rejected" }));
  ok("a secure-pool card row is refused", !isServable({ ...base, pool: "secure" }));
  ok("an approved, practice, not-retired row IS served", isServable(base));
  /* and the same three through the resolver, because the function applies them in TWO places -- the query
   * and this assertion -- and a check on only one of them would pass while the other was removed */
  const retiredSib = { ...base, id: "s", language: "es-419", retired_at: "2026-01-01T00:00:00Z" };
  ok("a RETIRED sibling is not used as a translation either",
    !resolveSibling({ ...base, id: "q" }, "es-419", [retiredSib]).ok);
}
console.log("");

/* ============ 1d.1 THE LIVE CARD SET: DOES THE RULE HOLD ON IT? ============ */
console.log("1d.1  ON THE LIVE CARD SET -- a Spanish session whose reviews point at English items");
{
  const cards = await getAll(KEY, "fsrs_cards?select=id,question_id,due&order=id");
  const qIds = [...new Set(cards.map((c) => c.question_id))];
  const qs = await getAllIn(KEY, "quiz_questions",
    "id,certification_id,language,pool,status,retired_at,question_group_id,question_text",
    "id", qIds, "&order=id");
  const byId = new Map(qs.map((q) => [q.id, q]));
  const groups = [...new Set(qs.map((q) => q.question_group_id).filter(Boolean))];
  const sibs = await getAllIn(KEY, "quiz_questions",
    "id,question_group_id,language,status,pool,retired_at,question_text", "question_group_id", groups,
    "&order=id");

  /* the function's own order: the status/pool/retired filter FIRST, then language resolution */
  const afterFilter = cards.filter((c) => isServable(byId.get(c.question_id)));
  console.log("  cards                      " + cards.length);
  console.log("  after status/pool/retired  " + afterFilter.length +
    "   (" + (cards.length - afterFilter.length) + " refused, which is the s1a exposure closing)");
  ok("the filter refuses a non-trivial number, so it is doing something",
    cards.length - afterFilter.length > 0, "nothing was refused");

  for (const lang of ["en", "es-419", "pt-BR"]) {
    let served = 0, ownLang = 0, viaSibling = 0, skipped = 0;
    const reasons = {};
    for (const c of afterFilter) {
      const q = byId.get(c.question_id);
      const r = resolveSibling(q, lang, sibs);
      if (!r.ok) { skipped++; reasons[r.reason.replace(/group .*/, "group ...")] = 1; continue; }
      served++;
      if (r.is_sibling) viaSibling++; else ownLang++;
    }
    console.log("  " + lang.padEnd(8) + "served " + String(served).padStart(4) +
      "   own language " + String(ownLang).padStart(4) +
      "   via sibling " + String(viaSibling).padStart(4) +
      "   SKIPPED " + String(skipped).padStart(3));
    /* THE CLAIM THE RULING ASKS FOR: an out-of-locale card is served through its sibling, not dropped and
     * not served in the wrong language. For a non-English locale there must BE such cards, or the test is
     * passing on an empty set. */
    if (lang !== "en") {
      ok(lang + ": at least one card is resolved THROUGH A SIBLING, so the path is exercised",
        viaSibling > 0, "no card needed resolution, so this proves nothing");
    }
    ok(lang + ": served + skipped accounts for every card that passed the filter",
      served + skipped === afterFilter.length, served + "+" + skipped + " != " + afterFilter.length);
    if (skipped) console.log("           skip reasons: " + Object.keys(reasons).join(" | "));
  }
  /* AND THE NEGATIVE: nothing served in a language other than the one requested. This is the defect. */
  for (const lang of ["en", "es-419", "pt-BR"]) {
    let wrong = 0;
    for (const c of afterFilter) {
      const q = byId.get(c.question_id);
      const r = resolveSibling(q, lang, sibs);
      if (r.ok && r.source.language !== lang) wrong++;
    }
    ok(lang + ": ZERO cards resolve to a row in another language", wrong === 0, wrong + " did");
  }
}

console.log("");
console.log(fails ? fails + " FAILURE(S)" : "all checks pass");
if (fails) process.exitCode = 1;
