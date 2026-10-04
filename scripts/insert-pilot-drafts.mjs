#!/usr/bin/env node
/**
 * insert-pilot-drafts.mjs -- insert NAMED accepted items from a generation artifact.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 *   --cert <CODE>        the certification
 *   --from <artifact>    the generation artifact (ISMSF-R1, ISMSF-R2, ...)
 *   --accept <file>      the accept list: item ids with their verdicts. NOTHING ELSE IS INSERTED.
 *   --limit=<n>          insert only the first n of the accepted set
 *   --note=<text>        appended to every review_note in this batch
 *   --ruled-in=<PROMPT>  REQUIRED. The ruling that admitted these rows; stamped into reviewed_by.
 *
 * ============ THE ACCEPT LIST IS THE AUTHORITY (ruled PROMPT-116 s2) ============
 *
 * Generalised from the AIMS-F pilot script, which merged two named artifacts and deduplicated them by
 * task+anchor. That selection logic WAS the ruling for that round; it cannot be reused, because a
 * selection rule and a director's accept list are different things.
 *
 * So: the list names ids. An id not in the artifact is an error, not a skip. An id in
 * `<SLUG>-DIRECTOR-REJECTIONS.json` is refused even if the list names it -- a rejection outranks an
 * accept, because the two files can disagree only by mistake.
 *
 * ============ EVERY COLUMN A DEFAULT COULD DECIDE IS NAMED ============
 *
 * `quiz_questions.status` defaults to 'approved', `is_exam_scope` to true and `visibility` to
 * 'secure'. One of those three is catastrophic for a draft and which one is not a thing to rely on.
 *
 * ============ KEYS ARE SHUFFLED AT INSERT ============
 *
 * The writer returns the key first, so every artifact item keys on 'a'. `shuffleOptions` is the
 * generator's own de-bias, which also remaps any "(option b)" reference in the explanation.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { buildGateContext } from "./lib/gate-context.mjs";
import { runCodeGates } from "./lib/grounded-gates.mjs";
import { shuffleOptions } from "../functions/_shared/item-rules/item-cue-guard.mjs";
import { CAP } from "./lib/anchor-cap.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let APPLY = false, CERT = null, FROM = null, ACCEPT = null, LIMIT = 0, NOTE = "";
/* which ruling admitted these rows. It is stamped into every item_grounding row, so it must be the
 * prompt that actually ruled them -- it was hardcoded to PROMPT-116 and would have mislabelled R3. */
let RULED = null;
{
  const av = process.argv.slice(2);
  for (let i = 0; i < av.length; i++) {
    const a = av[i];
    if (a === "--apply") { APPLY = true; continue; }
    let m = a.match(/^--cert(?:=(.+))?$/); if (m) { CERT = m[1] || av[++i]; continue; }
    m = a.match(/^--from(?:=(.+))?$/); if (m) { FROM = m[1] || av[++i]; continue; }
    m = a.match(/^--accept(?:=(.+))?$/); if (m) { ACCEPT = m[1] || av[++i]; continue; }
    m = a.match(/^--limit=([0-9]+)$/); if (m) { LIMIT = Number(m[1]); continue; }
    m = a.match(/^--note=(.+)$/); if (m) { NOTE = m[1]; continue; }
    m = a.match(/^--ruled-in=(.+)$/); if (m) { RULED = m[1]; continue; }
    console.error("Unrecognised flag: " + a);
    console.error("  --cert <CODE> --from <artifact> --accept <file> [--limit=n] [--note=text] [--apply]");
    process.exit(2);
  }
}
if (!RULED) {
  console.error("--ruled-in=<PROMPT-nnn> is required: it is stamped into every item_grounding row as");
  console.error("the ruling that admitted the item, and a wrong one is an unattributable record.");
  process.exit(2);
}
if (!CERT || !FROM || !ACCEPT) {
  console.error("--cert, --from and --accept are all required. The accept list is the authority:");
  console.error("nothing is inserted that it does not name.");
  process.exit(2);
}
const SLUG = CERT.replace(/-/g, "");
/* ============ ORIGIN IS `grounded`, NOT `generated` ============
 *
 * CLAUDE.md s12: `generate-mock-exam` excludes `item_origin = 'generated'` on BOTH modes. An exam-scope
 * secure item written as `generated` would be approved and then never served. The 199 approved AIMS-F
 * grounded items carry `grounded`; that is the value, and the post-conditions assert it. */
const ORIGIN = "grounded";
const STATUS = "pending_review";
const EXAM_SCOPE = true;
const VERDICT = "accept";

/* ---------------------------------------------------------------- the set */
const art = JSON.parse(readFileSync(join(ROOT, FROM), "utf8"));
const items = art.items || [];
const survivors = items.filter((x) => x.verdict === "survivor");
const acc = JSON.parse(readFileSync(join(ROOT, ACCEPT), "utf8"));
const wanted = acc.accepts || acc;
if (!Array.isArray(wanted) || !wanted.length) {
  console.error(ACCEPT + " names no accepts. An empty list is refused rather than treated as none.");
  process.exit(2);
}
/* ============ THE NUMBER COMES FROM THE ACCEPT LIST, NOT FROM THE ARTIFACT ============
 *
 * The survivor list is re-filtered on every read, so a rescue that flips a verdict renumbers it. The
 * director's numbers were read against the list AS IT STOOD, so the accept list carries them and they
 * are reported from there. The artifact position is the fallback, and it says so. */
const posOf = new Map(survivors.map((x, i) => [x.item_id, i + 1]));
const declaredNum = new Map();
for (const w of wanted) {
  if (typeof w !== "string" && w.report_number != null) declaredNum.set(w.item_id, Number(w.report_number));
}
const numberLabel = (id) => declaredNum.has(id) ? "#" + declaredNum.get(id)
  : (posOf.has(id) ? "artifact position " + posOf.get(id) + ", not a director number" : "unnumbered");
const numberOf = { get: (id) => declaredNum.has(id) ? declaredNum.get(id) : null };
/* ============ A REPORT NUMBER IS NOT AN IDENTITY, SO IT IS NOT MATCHED ON ============
 *
 * A number is a position in ONE artifact's survivor list, and that list MOVES. The PROMPT-115 s3
 * rescues flipped eight R2 items from rejected to survivor; re-filtering the artifact then put two of
 * the RESCUED items at positions 11 and 12, which are the numbers the director rejected. Matching on
 * the number refused two items he had just rescued -- and in the other direction R1 #13 and R2 #13 are
 * different items, one of them an accept.
 *
 * So: the match is by item_id, full stop. A rejection entry WITHOUT an item_id cannot be matched
 * safely and is refused rather than guessed at; the number stays in the file as documentation. */
const rejPath = join(ROOT, SLUG + "-DIRECTOR-REJECTIONS.json");
const rejectedIds = new Map();
let rejTotal = 0;
if (existsSync(rejPath)) {
  const rj = JSON.parse(readFileSync(rejPath, "utf8"));
  for (const r of (rj.rejections || [])) {
    rejTotal++;
    if (!r.item_id) {
      console.error("REFUSING: " + rejPath.split(/[\\/]/).pop() + " has a rejection with no `item_id`" +
        (r.report_number != null ? " (report_number " + r.report_number + ", artifact " + r.artifact + ")" : "") +
        ". A report number is a position in a survivor list that moves, so it cannot identify an item.");
      process.exit(2);
    }
    rejectedIds.set(String(r.item_id), r);
  }
}

/* ============ AN ID ALREADY INSERTED IS SKIPPED, LOUDLY ============
 *
 * The staged sequence (one row, then the rest) re-runs the SAME accept list, so the script has to be
 * resumable. A silent skip would hide a double insert, so each skip names the row it found. */
const insPath = join(ROOT, SLUG + "-INSERTED.json");
const already = new Map();
if (existsSync(insPath)) {
  for (const b of (JSON.parse(readFileSync(insPath, "utf8")).batches || [])) {
    for (const r of (b.rows || [])) already.set(r.item_id, r.id);
  }
}

const chosen = [], refused = [], regate = [], skipped = [];
for (const w of wanted) {
  const id = typeof w === "string" ? w : w.item_id;
  const it = items.find((x) => x.item_id === id);
  if (!it) { refused.push({ id, why: "not in " + FROM }); continue; }
  if (already.has(id)) { skipped.push({ id, row: already.get(id) }); continue; }
  const rej = rejectedIds.get(String(id));
  if (rej) {
    refused.push({ id, why: "named in " + SLUG + "-DIRECTOR-REJECTIONS.json (" + rej.artifact +
      " #" + rej.report_number + ", " + rej.ruled_in + ")" }); continue;
  }
  /* A STALE ARTIFACT VERDICT IS NOT TRUSTED EITHER WAY.
   *
   * An accept may name an item the artifact recorded as code-rejected, where the GATE has since
   * changed -- PROMPT-114 s3 narrowed modal-fidelity and PROMPT-116 s1 tightened it again. Such an
   * entry must say `"regate": true`, and the item is then re-gated LIVE: a pass admits it, a failure
   * refuses the batch. The artifact's own verdict is never the authority in that case, and neither is
   * the accept list on its own. */
  if (it.verdict !== "survivor") {
    const spec = typeof w === "string" ? {} : w;
    if (spec.regate !== true) {
      refused.push({ id, why: "artifact verdict is " + it.verdict + " and the accept entry does not say regate:true" });
      continue;
    }
    regate.push({ it, spec });
    continue;
  }
  chosen.push({ it, spec: typeof w === "string" ? {} : w });
}
/* re-gate the named exceptions LIVE, before anything is selected */
if (regate.length) {
  const ctx = await buildGateContext(requireKey(HERE), CERT);
  for (const { it, spec } of regate) {
    const map = ctx.mapByTask.get(ctx.taskIdOfCode.get(it.task_code)) || { primary: [], supporting: [] };
    const v = runCodeGates({ ...it.item }, { passagesByKey: ctx.index, annexGaps: ctx.annexGaps,
      sequenceGaps: [...ctx.sequenceGaps, ...ctx.declaredGaps], cert: CERT, cueCfg: ctx.cueCfg,
      primaryClauses: map.primary, supportingClauses: map.supporting,
      sources: ctx.sources, leak: ctx.leak,
      liveStemsForTask: (ctx.liveByTask && ctx.liveByTask.get(ctx.taskIdOfCode.get(it.task_code))) || [],
      assignedAnchor: it.assigned || null });
    console.log("  RE-GATED " + it.item_id + " (artifact said " + it.verdict + "): passed=" + v.passed +
      (v.failed.length ? " FAILED[" + v.failed.join(",") + "]" : ""));
    if (v.passed) chosen.push({ it, spec });
    else refused.push({ id: it.item_id, why: "re-gated and still fails [" + v.failed.join(",") + "]" });
  }
}
if (refused.length) {
  console.error("REFUSING THE WHOLE BATCH: " + refused.length + " accepted id(s) cannot be inserted.");
  for (const r of refused) console.error("  " + r.id + "  " + r.why);
  console.error("An accept list and the bank disagreeing is a mistake, not a case to work around.");
  process.exit(1);
}
if (skipped.length) {
  console.log("  already inserted, skipped: " + skipped.length);
  for (const k of skipped) console.log("      " + k.id + " -> " + k.row);
}
if (!chosen.length) {
  console.error("Nothing left to insert: all " + wanted.length + " accepted id(s) are already in " +
    SLUG + "-INSERTED.json. An empty batch is refused rather than reported as a success.");
  process.exit(1);
}
const batch = LIMIT ? chosen.slice(0, LIMIT) : chosen;

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const certRows = await getAll(KEY, "certifications?select=id,code&code=eq." + CERT);
if (!certRows.length) { console.error("No certification " + CERT); process.exit(2); }
const cert = certRows[0];
const taskRows = await getAll(KEY, "tasks?select=id,code,bloom_level&certification_id=eq." + cert.id);
const taskByCode = new Map(taskRows.map((t) => [t.code, t]));

/* ---------------------------------------------------------------- the rows */
const rows = [];
for (const { it, spec } of batch) {
  const t = taskByCode.get(it.task_code);
  if (!t) { console.error("task " + it.task_code + " not found on " + CERT); process.exit(2); }
  const o = it.item;
  const ki = (o.options || []).findIndex((x) => x.is_correct === true);
  if (ki < 0) { console.error(it.item_id + ": no option is marked is_correct"); process.exit(2); }
  const base = {
    options: (o.options || []).map((x, i) => ({ id: String.fromCharCode(97 + i), text: x.text })),
    correct_answer: [String.fromCharCode(97 + ki)],
    explanation: o.explanation,
  };
  const shuffled = shuffleOptions({ ...base, question_text: o.question_text });
  rows.push({
    it, spec, task: t,
    row: {
      certification_id: cert.id,
      task_id: t.id,
      language: "en",
      question_text: o.question_text,
      question_type: "single_choice",
      options: shuffled.options,
      correct_answer: shuffled.correct_answer,
      explanation: shuffled.explanation ?? o.explanation,
      status: STATUS,
      pool: "secure",
      visibility: "secure",
      is_exam_scope: EXAM_SCOPE,
      item_origin: ORIGIN,
      bloom_level: t.bloom_level,
      difficulty: 3,
    },
  });
}

/* ============ THE ANCHOR CAP IS CHECKED AT INSERT, NOT ONLY AT GENERATION ============
 *
 * The cap is CAP items per (source, edition, clause) per task, and the generator applies it WITHIN a
 * round. Two rounds, or a round plus a rescue, can each stay under it and still put three items on one
 * clause once both are in the bank. So the census is live grounding PLUS this batch, and the batch is
 * refused rather than trimmed: which item to drop is a content decision. CAP is imported, not retyped.
 * Measured on AIMS-F: task 1.2 ended with eight items on two clauses, four times the cap. */
const liveGrounding = await getAll(KEY, "item_grounding?select=question_id,source_id,edition," +
  "key_support_clause&order=question_id");
const liveRows = await getAll(KEY, "quiz_questions?select=id,task_id,retired_at&certification_id=eq." +
  cert.id + "&language=eq.en&retired_at=is.null&order=id");
const taskOfRow = new Map(liveRows.map((r) => [r.id, r.task_id]));
const capKey = (taskId, src, ed, cl) => taskId + "|" + src + "|" + ed + "|" + String(cl);
const censusNow = new Map();
for (const g of liveGrounding) {
  const t = taskOfRow.get(g.question_id);
  if (!t) continue; /* another certification, or retired */
  const k = capKey(t, g.source_id, g.edition, g.key_support_clause);
  censusNow.set(k, (censusNow.get(k) || 0) + 1);
}
const overCap = [];
for (const r of rows) {
  const k = capKey(r.task.id, r.it.item.source_id, r.it.item.edition, r.it.item.key_support_clause);
  const n = (censusNow.get(k) || 0) + 1;
  censusNow.set(k, n);
  if (n > CAP) {
    overCap.push(r.it.task_code + "  " + r.it.item.source_id + " " + r.it.item.edition + " " +
      r.it.item.key_support_clause + "  would be #" + n + " against a cap of " + CAP +
      "   (" + r.it.item_id + ")");
  }
}
if (overCap.length) {
  console.error("REFUSING THE WHOLE BATCH: " + overCap.length + " item(s) would pass the anchor cap.");
  for (const x of overCap) console.error("  " + x);
  console.error("Which item to drop is a content decision, not a trim this script may make.");
  process.exit(1);
}
console.log("  anchor cap          " + CAP + " per (source, edition, clause) per task: all " + rows.length +
  " item(s) fit, live grounding counted (" + liveGrounding.length + " row(s))");

const keyDist = {};
for (const r of rows) keyDist[r.row.correct_answer[0]] = (keyDist[r.row.correct_answer[0]] || 0) + 1;
console.log("INSERT   " + CERT + "   from " + FROM + "   accept list " + ACCEPT +
  (APPLY ? "   --apply" : "   dry run (default)"));
console.log("  accepted named      " + wanted.length);
console.log("  to insert           " + rows.length + (LIMIT ? "   (--limit=" + LIMIT + ")" : ""));
console.log("  status/pool/vis     " + STATUS + " / secure / secure   is_exam_scope=" + EXAM_SCOPE +
  "   item_origin=" + ORIGIN + "   verdict=" + VERDICT);
console.log("  key after shuffle   " + JSON.stringify(keyDist));
console.log("  rejections file     " + (existsSync(rejPath) ? rejPath.split(/[\\/]/).pop() + " (" + rejTotal +
  " entr(ies), matched by item_id)" : "ABSENT"));
if (!APPLY) {
  const s = rows[0];
  console.log("");
  console.log("  ONE FULL ROW AS IT WOULD BE WRITTEN (" + s.it.item_id + ", " + numberLabel(s.it.item_id) + "):");
  console.log(JSON.stringify(s.row, null, 2).split("\n").map((l) => "    " + l).join("\n"));
  console.log("");
  console.log("  its item_grounding would carry: clause " + s.it.item.key_support_clause +
    ", source " + s.it.item.source_id + " " + s.it.item.edition + ", verdict " + VERDICT);
  console.log("");
  console.log("DRY RUN. Nothing written. Re-run with --apply.");
  process.exit(0);
}

/* ---------------------------------------------------------------- write */
/* ============ THE NEGATIVE HALF IS A CHECKSUM, NOT A COUNT ============
 *
 * "zero rows outside the batch changed" (ruled PROMPT-116 s2). A count passes on a swap -- one row
 * edited and one added reads as +1 either way -- so every pre-existing row is fingerprinted over the
 * columns an insert has no business touching, and the fingerprints are compared afterwards. */
const SNAP_SELECT = "quiz_questions?select=id,question_text,options,correct_answer,explanation,status," +
  "pool,visibility,is_exam_scope,item_origin,task_id,language,retired_at&certification_id=eq." + cert.id +
  "&order=id";
const fingerprint = (r) => createHash("md5").update(JSON.stringify([r.question_text, r.options,
  r.correct_answer, r.explanation, r.status, r.pool, r.visibility, r.is_exam_scope, r.item_origin,
  r.task_id, r.language, r.retired_at])).digest("hex");
const snapBefore = new Map((await getAll(KEY, SNAP_SELECT)).map((r) => [r.id, fingerprint(r)]));
const beforeCount = [...snapBefore.keys()].length;
const post = async (path, body, prefer) => {
  const res = await fetch(REST_URL + "/" + path, { method: "POST",
    headers: { ...H, Prefer: prefer || "return=representation" }, body: JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error(path + ": " + res.status + " " + text.slice(0, 300));
  return text ? JSON.parse(text) : null;
};

const inserted = [];
for (const r of rows) {
  const back = await post("quiz_questions", [r.row]);
  const id = Array.isArray(back) ? back[0].id : back.id;
  inserted.push({ id, ...r });
}
console.log("  inserted " + inserted.length + " row(s)");

const stamp = new Date().toISOString();
const groundingRows = inserted.map(({ id, it, spec }) => ({
  question_id: id,
  key_support_clause: it.item.key_support_clause,
  key_support: it.item.key_support,
  source_id: it.item.source_id,
  edition: it.item.edition,
  gates: it.gates ?? [],
  solver: it.solver ?? null,
  generator: "gen-grounded-items.mjs",
  model: art.model ?? null,
  grounding_family: it.grounding_family ?? it.item.key_support_clause,
  reviewed_by: "director, ruled " + RULED,
  reviewed_at: stamp,
  review_verdict: VERDICT,
  review_note: [spec.note, NOTE].filter(Boolean).join(" | ") || ("accepted from " + FROM),
}));
await post("item_grounding", groundingRows, "return=minimal");
console.log("  wrote " + groundingRows.length + " item_grounding row(s)");

/* ---------------------------------------------------- POST-CONDITIONS */
const ids = inserted.map((x) => x.id);
const backRows = await getAll(KEY, "quiz_questions?select=id,status,pool,visibility,is_exam_scope," +
  "item_origin,language,correct_answer,task_id&id=in.(" + ids.join(",") + ")");
console.log("");
console.log("POST-CONDITIONS");
console.log("  rows read back      " + backRows.length + " of " + ids.length);
const bad = [];
for (const b of backRows) {
  const want = inserted.find((x) => x.id === b.id);
  if (b.status !== STATUS) bad.push(b.id.slice(0, 8) + " status=" + b.status);
  if (b.is_exam_scope !== EXAM_SCOPE) bad.push(b.id.slice(0, 8) + " is_exam_scope=" + b.is_exam_scope);
  if (b.pool !== "secure") bad.push(b.id.slice(0, 8) + " pool=" + b.pool);
  if (b.visibility !== "secure") bad.push(b.id.slice(0, 8) + " visibility=" + b.visibility);
  if (b.language !== "en") bad.push(b.id.slice(0, 8) + " language=" + b.language);
  if (b.item_origin !== ORIGIN) bad.push(b.id.slice(0, 8) + " item_origin=" + b.item_origin);
  if (b.task_id !== want.task.id) bad.push(b.id.slice(0, 8) + " task_id mismatch");
  if (!Array.isArray(b.correct_answer) || b.correct_answer.length !== 1) {
    bad.push(b.id.slice(0, 8) + " correct_answer=" + JSON.stringify(b.correct_answer));
  }
}
console.log("  columns as written  " + (bad.length ? bad.length + " VIOLATION(S)" : "all " + backRows.length + " rows"));
for (const b of bad.slice(0, 10)) console.log("      " + b);

const grounded = await getAll(KEY, "item_grounding?select=question_id,source_id,edition," +
  "key_support_clause,review_verdict,reviewed_by&question_id=in.(" + ids.join(",") + ")");
let gbad = 0;
for (const g of grounded) {
  const want = inserted.find((x) => x.id === g.question_id);
  /* SOURCE AND EDITION ASSERTED, not assumed: a grounding row stamped with the run's standard rather
   * than the item's own is a defect this repository has already made once. */
  if (g.source_id !== want.it.item.source_id || String(g.edition) !== String(want.it.item.edition) ||
    g.review_verdict !== VERDICT) {
    console.log("      GROUNDING: " + g.question_id.slice(0, 8) + " " + g.source_id + " " + g.edition +
      " verdict=" + g.review_verdict); gbad++;
  }
}
console.log("  grounding rows      " + grounded.length + " of " + ids.length +
  ", source+edition+verdict as the item's: " + (gbad ? gbad + " WRONG" : "all"));

/* the NEGATIVE half: the only new English rows are this batch */
const snapAfter = new Map((await getAll(KEY, SNAP_SELECT)).map((r) => [r.id, fingerprint(r)]));
const afterCount = [...snapAfter.keys()].length;
const grew = afterCount - beforeCount;
const inBatch = new Set(ids);
const changed = [], vanished = [], strayNew = [];
for (const [id, fp] of snapBefore) {
  if (!snapAfter.has(id)) { vanished.push(id); continue; }
  if (snapAfter.get(id) !== fp) changed.push(id);
}
for (const id of snapAfter.keys()) if (!snapBefore.has(id) && !inBatch.has(id)) strayNew.push(id);
console.log("  rows on " + CERT + "      " + beforeCount + " -> " + afterCount + "   grew by " + grew +
  (grew === ids.length ? " (exactly this batch)" : "   MISMATCH: expected " + ids.length));
console.log("  pre-existing rows   " + snapBefore.size + " fingerprinted; changed " + changed.length +
  ", vanished " + vanished.length + ", new rows outside the batch " + strayNew.length);
for (const id of [...changed, ...vanished, ...strayNew].slice(0, 10)) console.log("      STRAY " + id);

const recPath = insPath;
const rec = existsSync(recPath) ? JSON.parse(readFileSync(recPath, "utf8")) : { batches: [] };
rec.batches.push({ at: stamp, cert: CERT, from: FROM, accept_list: ACCEPT, note: NOTE,
  ids, rows: inserted.map(({ id, it }) => ({ id, item_id: it.item_id, report_number: numberOf.get(it.item_id),
    task: it.task_code, anchor: it.item.key_support_clause, source: it.item.source_id })) });
writeFileSync(recPath, JSON.stringify(rec, null, 1) + "\n");
console.log("  recorded in " + recPath.split(/[\\/]/).pop());
if (backRows.length !== ids.length || bad.length || gbad || grounded.length !== ids.length ||
  grew !== ids.length || changed.length || vanished.length || strayNew.length) {
  console.error("");
  console.error("POST-CONDITIONS FAILED -- see above.");
  process.exitCode = 2;
}
