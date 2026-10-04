#!/usr/bin/env node
/**
 * approve-grounded-items.mjs -- promote a NAMED set of grounded items to status='approved'.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2. **Not run yet: specified, controlled, and dry.**
 *
 * Ruled PROMPT-97 s4, amended by PROMPT-98: condition 1 is now `item_grounding.review_verdict = 'accept'` for
 * the English row, and a `reserve:` note BLOCKS approval.
 *
 * ============ WHY THIS SCRIPT IS THE ONE THAT HAS TO BE PARANOID ============
 *
 * `docs/CERT-PIPELINE.md` stage 6 (was `AIMSF-PATH-TO-LIVE.md`, deleted PROMPT-109) names it the missing step, and `generate-mock-exam` filters `status='approved'`
 * exactly -- so this is the only script in the repository whose output a candidate can be examined on. Every
 * other guard in this directory protects a draft. This one promotes.
 *
 * So: nothing is approved by rule. Items are named by id, each condition is asserted per item, and a refusal
 * names the item and the condition.
 *
 * ============ THE SEVEN CONDITIONS, AND WHY EACH ============
 *
 *   1  review_verdict = 'accept' on the ENGLISH row's item_grounding
 *          A human read it and accepted it. `read` is NOT enough -- 379 keeps them apart because a read with
 *          findings is not an acceptance. `tier_a`/`tier_b`/`tier_c` are findings, and `reject` is a refusal.
 *   2  the review note carries no `reserve:` prefix
 *          PROMPT-98's amendment. `fc0000a0` is accepted AND held: the item is good and its clause is at the
 *          cap, so approving it would put a third item on a clause ruled to carry two. An accept is a judgement
 *          about the ITEM; the reserve is a fact about the FORM.
 *   3  an item_grounding row exists, with a solver verdict
 *          An ungrounded item promoted through this path would inherit the grounded pool's guarantees and none
 *          of its evidence.
 *   4  the code gates pass NOW, against the library as it is today
 *          The library moves: 38 Annex A passages have been de-columned and twelve anchors re-cut. An item
 *          approved against last week's library is approved against a document that changed. This is the
 *          condition most likely to refuse something, and it is the reason the script re-gates rather than
 *          trusting the artifact.
 *   5  the row is not in AIMSF-DIRECTOR-REJECTIONS.json
 *          A rejection is the one disposition no artifact carries, so the standing list must be read.
 *   6  status, visibility, pool and is_exam_scope are NAMED on the write and read back
 *          Standing rule. `quiz_questions` defaults to `status='approved'`, so an insert or update that omits
 *          status lands LIVE.
 *   7  the NEGATIVE half: no row outside the named set changed status
 *          A filtered PATCH over N ids can touch an N+1th only through a bad filter, and a positive-only check
 *          passes on exactly that.
 *
 * ============ AND IT REFUSES THE WHOLE BATCH, NOT THE ITEM ============
 *
 * If any named item fails any condition, nothing is written. A partial approval is the worst outcome available
 * here: the rows that landed look reviewed, and the ones that did not are indistinguishable from rows nobody
 * asked about.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { itemIdOfStem } from "./lib/item-id.mjs";

let APPLY = false, IDS = null, SELFTEST = false, CERT = null;
{
  const av = process.argv.slice(2);
  for (let i = 0; i < av.length; i++) {
    const a = av[i];
    let m;
    if (a === "--apply") { APPLY = true; continue; }
    if (a === "--self-test") { SELFTEST = true; continue; }
    if ((m = /^--ids=(.+)$/.exec(a))) { IDS = m[1].split(",").map((s) => s.trim()).filter(Boolean); continue; }
    /* `--cert CODE` and `--cert=CODE`. It does NOT approve by rule: it DERIVES the candidate id list from
     * the certification's grounded English rows and then puts every one through the same conditions. */
    if ((m = /^--cert(?:=(.+))?$/.exec(a))) { CERT = m[1] || av[++i]; if (!CERT) { console.error("--cert needs a code"); process.exit(2); } continue; }
    console.error("Unrecognised flag: " + a);
    console.error("  --ids=<id8>,...   the items to approve, by content id.");
    console.error("  --cert <CODE>     derive the candidate set from that certification's grounded rows.");
    console.error("  --apply           write. Dry by default.");
    console.error("  --self-test       run the condition controls and exit. No database write.");
    process.exit(2);
  }
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

/* ============ THE CONDITIONS AS PURE FUNCTIONS, SO THEY CAN BE TESTED WITHOUT A DATABASE ============ */
export function condVerdict(g) {
  if (!g) return { ok: false, why: "no item_grounding row" };
  if (g.review_verdict !== "accept") {
    return { ok: false, why: "review_verdict is " + JSON.stringify(g.review_verdict) + ", not 'accept'" };
  }
  return { ok: true };
}
export function condNotReserved(g) {
  const note = String((g && g.review_note) || "");
  /* the marker is a PREFIXED FIELD in the note, `reserve: <reason>`, written by record-97-addendum-verdicts.
   * Matched with a word boundary rather than a bare `includes`, so a note that merely discusses a reserve
   * does not block -- the same lexical-proxy trap this repository records for `to anon`. */
  if (/\breserve:/i.test(note)) {
    return { ok: false, why: "the review note marks this a RESERVE: " + JSON.stringify(note.slice(0, 80)) };
  }
  return { ok: true };
}
export function condSolver(g) {
  if (!g || g.solver === null || g.solver === undefined) return { ok: false, why: "no solver verdict recorded" };
  return { ok: true };
}
export function condNotRejected(id8, rejectedIds, file = "the director's rejections") {
  if (rejectedIds.has(id8)) return { ok: false, why: "named in " + file };
  return { ok: true };
}
/**
 * Is this row already in the state this script exists to produce? Then there is nothing to do and
 * nothing to refuse. Extracted so the control exercises the routing rather than a copy of it.
 */
export function isAlreadyLive(q) {
  return !!q && q.status === "approved";
}
/** Is this refusal reason a RECORDED DISPOSITION (tolerated in --cert mode) or a real failure? */
export function isRecordedDisposition(why) {
  return /^verdict: review_verdict is |^not-rejected: named in |^withheld: /.test(String(why || ""));
}

/* ============ SELF-TEST: every condition in BOTH directions, and fc0000a0's refusal by name ============ */
export function approvalControls() {
  const cases = [];
  const ok = (what, pass, detail = "") => cases.push({ what, pass, detail });

  ok("accept passes condition 1", condVerdict({ review_verdict: "accept" }).ok);
  ok("read is REFUSED by condition 1", !condVerdict({ review_verdict: "read" }).ok);
  ok("tier_a is REFUSED", !condVerdict({ review_verdict: "tier_a" }).ok);
  ok("reject is REFUSED", !condVerdict({ review_verdict: "reject" }).ok);
  ok("a null verdict is REFUSED", !condVerdict({ review_verdict: null }).ok);
  ok("a missing grounding row is REFUSED", !condVerdict(null).ok);

  /* ---- THE RESERVE, by name. PROMPT-98: "Add a test showing that fc0000a0 is refused." ---- */
  const RESERVE_NOTE = "reserve: over cap";
  const r = condNotReserved({ review_note: RESERVE_NOTE });
  ok("fc0000a0's note `reserve: over cap` BLOCKS approval", !r.ok, r.why || "");
  ok("...and the refusal says why, naming the note", /RESERVE/.test(r.why || ""));
  ok("an ordinary accept note does not block",
    condNotReserved({ review_note: "ruled_in: PROMPT-97 addendum s2: read with R4/R5 and accepted" }).ok);
  /* THE NEGATIVE DIRECTION OF THE MARKER ITSELF: a note that mentions the word without the field must not
   * block, or the guard fires on prose. This repository aborted a migration once on a comment that quoted the
   * phrase it forbade. */
  ok("a note merely discussing a reserve does not block",
    condNotReserved({ review_note: "kept rather than held as a reserve, because its clause has room" }).ok);
  /* AND AN ACCEPTED-BUT-RESERVED ITEM MUST FAIL ONLY ON CONDITION 2 -- if it also failed condition 1 the test
   * would pass for the wrong reason and the reserve rule would be untested. */
  const reserved = { review_verdict: "accept", review_note: RESERVE_NOTE, solver: { verdict: "accept" } };
  ok("the reserve is a VALID accept that condition 2 alone refuses",
    condVerdict(reserved).ok && condSolver(reserved).ok && !condNotReserved(reserved).ok);

  ok("a recorded solver verdict passes", condSolver({ solver: { agree: true } }).ok);
  ok("a null solver is REFUSED", !condSolver({ solver: null }).ok);
  ok("a rejected id is REFUSED", !condNotRejected("3a3d26fa", new Set(["3a3d26fa"])).ok);
  ok("an unrejected id passes", condNotRejected("2741d373", new Set(["3a3d26fa"])).ok);

  /* THE WITHHELD DISPOSITION (PROMPT-123 s4), both directions. */
  ok("a withheld refusal is a RECORDED disposition and does not refuse the batch",
    isRecordedDisposition("withheld: fails the cue guard (PROMPT-123 s4)"));
  ok("a gate failure is NOT a recorded disposition",
    !isRecordedDisposition("gates: FAILED [structure]"));
  ok("a rejection IS a recorded disposition",
    isRecordedDisposition("not-rejected: named in ISMSF-DIRECTOR-REJECTIONS.json"));
  ok("an unrecognised reason is NOT a recorded disposition",
    !isRecordedDisposition("resolves to 2 English bank row(s)"));
  ok("a withheld reason that does not use the prefix is NOT tolerated",
    !isRecordedDisposition("this item is withheld because of the cue guard"));

  /* ALREADY APPROVED IS A NO-OP (PROMPT-124 s1), both directions through the real predicate. */
  ok("an approved row is already live -- a no-op, not a promotion",
    isAlreadyLive({ status: "approved" }));
  ok("a pending_review row is NOT a no-op; it is what this script promotes",
    !isAlreadyLive({ status: "pending_review" }));
  ok("a draft row is NOT a no-op", !isAlreadyLive({ status: "draft" }));
  ok("a missing row is NOT a no-op", !isAlreadyLive(null));
  /* and the reason string must never become a tolerated refusal: that was the old shape, and it
   * blocked 257 of 258 items on the first re-run after go-live */
  ok("`already approved` is still NOT a recorded disposition",
    !isRecordedDisposition("already approved -- nothing to do"));

  /* ---- THE --cert TOLERANCE, both directions. A gate failure must NEVER read as a disposition. ---- */
  ok("a reject verdict IS a recorded disposition",
    isRecordedDisposition("verdict: review_verdict is \"reject\", not 'accept'"));
  ok("a named rejection IS a recorded disposition",
    isRecordedDisposition("not-rejected: named in AIMSF-DIRECTOR-REJECTIONS.json"));
  ok("a GATE failure is NOT a disposition and must stop the batch",
    !isRecordedDisposition("gates: FAILED [structure]"));
  ok("a missing sibling is NOT a disposition",
    !isRecordedDisposition("siblings: missing pt-BR"));
  ok("a glossary pin is NOT a disposition",
    !isRecordedDisposition("siblings: glossary pins pt-BR option a roles-in-pt"));
  ok("an already-approved row is NOT a disposition",
    !isRecordedDisposition("already approved -- nothing to do"));
  ok("an unresolvable id is NOT a disposition",
    !isRecordedDisposition("resolves to 2 English bank row(s)"));
  ok("a reserve is NOT a disposition tolerated here (it blocks and must be seen)",
    !isRecordedDisposition("not-reserved: the review note marks this a RESERVE: ..."));

  return { cases, allPass: cases.every((c) => c.pass) };
}

if (SELFTEST) {
  const r = approvalControls();
  console.log("APPROVAL CONDITION CONTROLS   " + r.cases.length + " case(s)");
  for (const c of r.cases) console.log("  " + (c.pass ? "pass  " : "FAIL  ") + c.what + (c.detail ? "   " + c.detail : ""));
  console.log("");
  console.log(r.allPass ? "all pass" : "SOME FAILED");
  process.exitCode = r.allPass ? 0 : 2;
  /* a self-test must not fall through into the live path */
  process.exit(process.exitCode);
}

/* ============ THE LIVE PATH ============ */
const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
{
  const r = approvalControls();
  if (!r.allPass) {
    console.error("REFUSING: the condition controls fail. A promoter whose own conditions are untested is the");
    console.error("last script in this repository that should run.");
    for (const c of r.cases.filter((x) => !x.pass)) console.error("  FAIL " + c.what);
    process.exit(2);
  }
  console.log("condition controls: " + r.cases.length + " of " + r.cases.length + " pass");
}
if (!IDS && !CERT) {
  console.error("");
  console.error("--ids or --cert is REQUIRED. Nothing is approved by rule: name the items, or name the");
  console.error("certification whose grounded rows become the candidate set.");
  console.error("Run --self-test to see the conditions exercised without a database.");
  process.exit(2);
}

const CERT_CODE = CERT || "AIMS-F";

/* ============ THE REJECTIONS FILE IS PER CERTIFICATION, AND ITS KEY NAME VARIES ============
 *
 * Condition 5 is "the row is not in the director's rejections". This read was hard-coded to
 * `AIMSF-DIRECTOR-REJECTIONS.json` and to the key `r.id`, in a script that takes `--cert`. Run on
 * ISMS-F it would have read the WRONG FILE, and even pointed at the right one it would have loaded
 * nothing: AIMS-F keys its entries on `id` and ISMS-F on `item_id`. Either way all 18 ISMS-F
 * rejections would have passed condition 5 -- the exact shape of a guard that cannot fire.
 *
 * So: the filename follows the cert, BOTH key names are read, and a file that exists but yields no
 * ids REFUSES THE RUN. "No rejections loaded" and "no rejections exist" must never look the same in a
 * script whose output a candidate can be examined on.
 */
const REJ_FILE = CERT_CODE.replace(/-/g, "") + "-DIRECTOR-REJECTIONS.json";
const rejectedIds = new Set();
{
  const p = join(ROOT, REJ_FILE);
  if (existsSync(p)) {
    const entries = JSON.parse(readFileSync(p, "utf8")).rejections || [];
    for (const r of entries) {
      const id = r.item_id ?? r.id;
      if (id) rejectedIds.add(String(id));
    }
    if (entries.length && !rejectedIds.size) {
      console.error("REFUSING: " + REJ_FILE + " lists " + entries.length + " rejection(s) and none" +
        " carries an `item_id` or an `id`. Condition 5 would pass every rejected row.");
      process.exit(2);
    }
    console.log("rejections: " + REJ_FILE + "   " + entries.length + " entr(ies), " +
      rejectedIds.size + " id(s) loaded");
  } else {
    console.log("rejections: " + REJ_FILE + " ABSENT -- condition 5 can refuse nothing");
  }
}
/* ============ THE WITHHELD LIST: A THIRD DISPOSITION, NEITHER APPROVED NOR REJECTED ============
 *
 * Eight ISMS-F items fail the cue guard's `structure` arm. They are not director rejections -- he
 * never saw them refused on content -- and they are not approvable. Until PROMPT-123 they had no
 * disposition at all, so the batch refused as a whole and nothing could go live.
 *
 * A withheld entry can only ever WITHHOLD. It cannot approve anything, it cannot relax a gate, and
 * a withheld item that would have passed anyway is still withheld -- the list is read before the
 * conditions, not instead of them. Each entry needs `ruled_in` and a `reason`, and a file that
 * exists but yields no ids REFUSES THE RUN: "no withholdings loaded" must not look like
 * "nothing is withheld" in the one script that promotes.
 */
const WITHHELD_FILE = CERT_CODE.replace(/-/g, "") + "-WITHHELD.json";
const withheldIds = new Map();
{
  const p = join(ROOT, WITHHELD_FILE);
  if (existsSync(p)) {
    const doc = JSON.parse(readFileSync(p, "utf8"));
    const entries = doc.withheld || [];
    const bad = [];
    for (const w of entries) {
      const id = w.item_id ?? w.id;
      if (!id) { bad.push("an entry carries no `item_id`"); continue; }
      if (!String(w.ruled_in || "").trim()) { bad.push(id + ": no `ruled_in`"); continue; }
      if (!String(w.reason || "").trim()) { bad.push(id + ": no `reason`"); continue; }
      withheldIds.set(String(id), w);
    }
    if (bad.length) {
      console.error("REFUSING: " + WITHHELD_FILE + " has " + bad.length + " unusable entr(ies). " +
        "An unattributed withholding is an error, not a disposition.");
      for (const b of bad) console.error("  " + b);
      process.exit(2);
    }
    if (entries.length && !withheldIds.size) {
      console.error("REFUSING: " + WITHHELD_FILE + " lists " + entries.length + " withholding(s) and " +
        "none could be loaded.");
      process.exit(2);
    }
    console.log("withheld: " + WITHHELD_FILE + "   " + entries.length + " entr(ies), " +
      withheldIds.size + " id(s) loaded");
  } else {
    console.log("withheld: " + WITHHELD_FILE + " ABSENT -- nothing is withheld");
  }
}
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT_CODE))[0];
if (!cert) { console.error("No certification " + CERT_CODE); process.exit(2); }
const qs = await getAll(KEY, "quiz_questions?select=id,question_group_id,question_text,task_id,status," +
  "visibility,pool,is_exam_scope,language&certification_id=eq." + cert.id +
  "&language=eq.en&retired_at=is.null&order=id");
const ig = new Map((await getAll(KEY, "item_grounding?select=question_id,review_verdict,review_note,solver," +
  "source_id,key_support_clause,key_support&order=question_id")).map((g) => [g.question_id, g]));
const byStem = new Map();
for (const q of qs) {
  const id = itemIdOfStem(q.question_text);
  if (!byStem.has(id)) byStem.set(id, []);
  byStem.get(id).push(q);
}

/* CANDIDATE SET in --cert mode: every grounded English row. Rejected and reserved rows are INCLUDED so
 * they appear in the refusal list by name -- a candidate set filtered to the ones that will pass cannot
 * report what it skipped. */
if (!IDS) {
  IDS = [];
  for (const q of qs) if (ig.has(q.id)) IDS.push(itemIdOfStem(q.question_text));
  console.log("");
  console.log("CANDIDATE SET derived from " + CERT_CODE + ": " + IDS.length + " grounded English row(s) of " +
    qs.length + " live English row(s).");
}

const plan = [], refused = [], noop = [];
for (const id8 of IDS) {
  const hits = byStem.get(id8) || [];
  if (hits.length !== 1) { refused.push({ id8, why: "resolves to " + hits.length + " English bank row(s)" }); continue; }
  const q = hits[0];
  const g = ig.get(q.id);
  /* WITHHELD is checked first and reported as its own disposition. It can only withhold: an item on
   * this list never reaches the conditions, and nothing on this list can be approved. */
  if (withheldIds.has(id8)) {
    const w = withheldIds.get(id8);
    refused.push({ id8, why: "withheld: " + w.reason + " (" + w.ruled_in + ")" });
    continue;
  }
  for (const [name, res] of [["verdict", condVerdict(g)], ["not-reserved", condNotReserved(g)],
    ["solver", condSolver(g)], ["not-rejected", condNotRejected(id8, rejectedIds, REJ_FILE)]]) {
    if (!res.ok) { refused.push({ id8, why: name + ": " + res.why }); break; }
  }
  if (refused.some((r) => r.id8 === id8)) continue;
  /* ============ ALREADY APPROVED IS A NO-OP, NOT A REFUSAL (PROMPT-124 s1) ============
   *
   * This pushed onto `refused`, and "already approved" is deliberately NOT a recorded disposition,
   * so the batch refused as a whole. The effect: once a --cert run succeeds, EVERY later run is
   * blocked by its own earlier success -- 257 of 258 on the first re-run after go-live. The row is
   * already in the state this script exists to produce; there is nothing to refuse.
   *
   * It stays out of `plan`, so nothing is written twice, and it is counted and reported. The
   * withheld and rejection checks run BEFORE this, so an item that should never have been approved
   * is still caught by name rather than excused as a no-op. */
  if (isAlreadyLive(q)) { noop.push(id8); continue; }
  plan.push({ id8, q, g });
}

/* ---- CONDITION 4, now EVALUATED rather than named as skipped. `gate-context` builds the input this
 * script could not build when it was written; re-gating against today's library is the condition most
 * likely to refuse, so skipping it was the weakest part of the promoter. ---- */
{
  const { buildGateContext } = await import("./lib/gate-context.mjs");
  const ctx = await buildGateContext(KEY, CERT_CODE);
  let clean = 0;
  for (const p of [...plan]) {
    const row = ctx.rows.find((r) => r.id === p.q.id);
    if (!row) { refused.push({ id8: p.id8, why: "gates: no live English row to re-gate" }); continue; }
    const v = ctx.gateRow(row);
    p.unasserted = v.unasserted;
    if (!v.passed) refused.push({ id8: p.id8, why: "gates: FAILED [" + v.failed.join(",") + "]" });
    else clean++;
  }
  for (const r of refused) { const i = plan.findIndex((p) => p.id8 === r.id8); if (i >= 0) plan.splice(i, 1); }
  console.log("  condition 4 (code gates, today's library)   " + clean + " clean of " +
    (clean + refused.filter((r) => /^gates:/.test(r.why)).length));
}

/* ---- THE SIBLINGS. A group is the unit: approving English alone makes the exam available in one
 * language and leaves the other two looking unasked-about, and the per-language post-conditions have
 * nothing to measure. Each sibling must exist and carry zero glossary pins. ---- */
const SIB_LANGS = ["es-419", "pt-BR"];
const sibs = await getAll(KEY, "quiz_questions?select=id,question_group_id,language,question_text,options," +
  "explanation,correct_answer,status,visibility,pool,is_exam_scope&certification_id=eq." + cert.id +
  "&language=neq.en&retired_at=is.null&order=id");
{
  const { checkPins } = await import("./lib/pin-compliance.mjs");
  const enById = new Map(qs.map((q) => [q.id, q]));
  for (const p of [...plan]) {
    const en = enById.get(p.q.id);
    const mine = sibs.filter((s) => s.question_group_id && s.question_group_id === en.question_group_id);
    const missing = SIB_LANGS.filter((l) => !mine.some((s) => s.language === l));
    if (missing.length) { refused.push({ id8: p.id8, why: "siblings: missing " + missing.join(",") }); continue; }
    const pins = [];
    for (const s of mine) {
      const fields = [["question_text", s.question_text, en.question_text],
        ["explanation", s.explanation, en.explanation],
        ...(s.options || []).map((o) => ["option " + o.id, o.text,
          ((en.options || []).find((x) => x.id === o.id) || {}).text])];
      for (const [what, text, enText] of fields) {
        for (const h of checkPins(text, s.language, enText) || []) pins.push(s.language + " " + what + " " + h.id);
      }
    }
    if (pins.length) { refused.push({ id8: p.id8, why: "siblings: glossary pins " + pins.slice(0, 3).join("; ") }); continue; }
    p.sibs = mine;
  }
  for (const r of refused) { const i = plan.findIndex((p) => p.id8 === r.id8); if (i >= 0) plan.splice(i, 1); }
}

console.log("");
console.log("APPROVE " + IDS.length + " CANDIDATE ITEM(S)   " + CERT_CODE);
console.log("  would approve   " + plan.length + " group(s) = " + plan.length * 3 + " row(s) across 3 language(s)");
console.log("  already live    " + noop.length + " group(s) -- approved by an earlier run, nothing to do");
console.log("  refused         " + refused.length);
for (const r of refused) console.log("    " + r.id8 + "  " + r.why);
{
  const un = plan.filter((p) => (p.unasserted || []).length);
  console.log("");
  console.log("  gates UNASSERTED on " + un.length + " of " + plan.length +
    " (a gate that could not answer is not a pass; reported, not counted as clean)");
  const tally = {};
  for (const p of un) for (const g of p.unasserted) tally[g] = (tally[g] || 0) + 1;
  if (un.length) console.log("    " + JSON.stringify(tally));
}
/* ============ BATCH REFUSAL, AND THE ONE DISTINCTION `--cert` MODE NEEDS ============
 *
 * With `--ids`, naming an item ASSERTS it should be approved, so any failure is a failed assertion and
 * the whole batch stops. With `--cert` the candidate set is DERIVED and deliberately includes the
 * director's rejects so they are reported by name -- there a `reject` verdict is the recorded
 * disposition working, not a surprise.
 *
 * So only the recorded dispositions are tolerated, and ONLY in --cert mode. A gate failure, a missing
 * sibling, an unresolvable id or an already-approved row still stops everything: those are the ones
 * that mean the caller's picture of the bank is wrong. */
const unexpected = refused.filter((r) => !(CERT && isRecordedDisposition(r.why)));
if (unexpected.length) {
  console.error("");
  console.error("REFUSING THE WHOLE BATCH: " + unexpected.length + " item(s) failed a condition that is not a");
  console.error("recorded disposition. A partial approval leaves promoted rows looking reviewed and unpromoted");
  console.error("ones looking unasked-about.");
  for (const r of unexpected) console.error("  " + r.id8 + "  " + r.why);
  process.exit(1);
}
if (refused.length) {
  console.log("");
  /* name the KINDS actually present, rather than a fixed list that stopped being true */
  const kinds = [...new Set(refused.map((r) => /^withheld: /.test(r.why) ? "withheld"
    : /^not-rejected: /.test(r.why) ? "named rejection" : "non-accept verdict"))].sort();
  console.log("  " + refused.length + " refusal(s), all recorded dispositions (" + kinds.join(", ") + ").");
  console.log("  Those are the disposition working, not a surprise, so the batch proceeds.");
}
if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing written. Re-run with --apply.");
  process.exit(0);
}

const before = new Map([...qs, ...sibs].map((q) => [q.id, q.status]));
const targets = [];
for (const p of plan) { targets.push(p.q); for (const s of p.sibs) targets.push(s); }
let wrote = 0;
for (const t of targets) {
  /* item_origin='grounded' IN THE SAME WRITE as the approval (ruled PROMPT-108 s5, migration 386).
   * Approving without it lands a row that is approved, secure and in scope, and that
   * generate-mock-exam excludes because 'generated' is filtered on both modes -- the new bank served
   * to nobody. Separating the two writes is what made PROMPT-107's cutover stop at step 2b. */
  const r = await fetch(REST_URL + "/quiz_questions?id=eq." + t.id, {
    method: "PATCH", headers: H,
    body: JSON.stringify({ status: "approved", visibility: "secure", pool: "secure", is_exam_scope: true,
      item_origin: "grounded" }),
  });
  if (!r.ok) { console.error("  FAILED " + t.id.slice(0, 8) + " HTTP " + r.status + " " + (await r.text()).slice(0, 120)); continue; }
  wrote++;
}
const after = await getAll(KEY, "quiz_questions?select=id,language,status,visibility,pool,is_exam_scope," +
  "item_origin&certification_id=eq." + cert.id + "&retired_at=is.null&order=id");
const aBy = new Map(after.map((q) => [q.id, q]));
let bad = 0, strays = 0;
for (const t of targets) {
  const q = aBy.get(t.id);
  if (!q || q.status !== "approved" || q.visibility !== "secure" || q.pool !== "secure" || q.is_exam_scope !== true || q.item_origin !== "grounded") {
    console.error("POST: " + t.id.slice(0, 8) + " " + JSON.stringify(q)); bad++;
  }
}
const targetIds = new Set(targets.map((t) => t.id));
for (const q of after) {
  if (targetIds.has(q.id)) continue;
  if (before.has(q.id) && before.get(q.id) !== q.status) {
    console.error("STRAY: " + q.id.slice(0, 8) + " " + q.language + " status moved"); strays++;
  }
}
console.log("");
console.log("  wrote " + wrote + " of " + targets.length + ", post-condition failures " + bad + ", strays " + strays);
for (const l of ["en", ...SIB_LANGS]) {
  const n = after.filter((q) => q.language === l && q.status === "approved").length;
  console.log("    approved now, " + l.padEnd(7) + " " + n);
}
if (bad || strays || wrote !== targets.length) process.exitCode = 2;
