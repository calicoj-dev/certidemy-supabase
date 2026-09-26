/**
 * apply-tier-c-pt.mjs -- the three genuine pt-BR slips.
 *
 * WRITES. `--apply`; DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ THREE, NOT SIX, AND NOT TWENTY-TWO ============
 *
 * The probe flagged six pt-BR siblings. Reading them left three:
 *
 *   669c16fb  #170  `sem recursos` where the English says recourse
 *   d711f047  #171  `sistema de valores` twice, both naming the ITIL service value system
 *   6ff484f7  #224  an inserted `deve` in OPTION D, which is the key
 *
 * Dismissed after reading, and each is worth naming so nobody re-raises it:
 *
 *   7312ac33/pt  #85   CORRECT -- `confiante` for confident, `confiável` for reliable,
 *                      both in the right places. My regex found the correct word.
 *   df6bafc6/pt  #113  `fornecedor do modelo` faithfully renders "the model vendor";
 *                      the qualifier does the disambiguating the Spanish lacked.
 *   b7c850be/pt  #309  CLEAN. The ENGLISH explanation says "The Scrum Master MUST
 *                      escalate", so `deve escalar` is faithful, not inserted. The
 *                      Spanish slip was in the STEM; Portuguese never had it.
 *
 * AND THE STEM OF #224 IS NOT TOUCHED. "O que o Scrum Master deve fazer?" renders
 * "What should the Scrum Master do?", where `deve` is ordinary Portuguese for a
 * deliberative should. One item, two fields, opposite verdicts.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn, REST_URL } from "./_pg.mjs";
import { itemHash8 } from "./lib/item-hash.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (!KNOWN.has(a)) {
    console.error("unknown flag " + JSON.stringify(a) + " -- DRY BY DEFAULT; --apply writes.");
    process.exitCode = 2; process.exit();
  }
}
const APPLY = process.argv.includes("--apply");

const REVIEWER = "platform owner (the director), bilingual read of the 342 exposed items, 2026-09-26";
const NOTE = "Tier C pt-BR slip, corrected field by field after the es-419 pass. Three of six probe "
  + "hits survived a read; the other three were the probe. No key changed. Items have no gate, so "
  + "this row exists only so the next reader can tell a reviewed row from one that was never read.";

const EDITS = [
  ["669c16fb", "explanation", "deixa os usuários sem recursos", "deixa os usuários sem uma via de recurso",
    "#170 recourse != recursos"],
  ["d711f047", "option:c", "integrada ao sistema de valores", "integrada ao sistema de valor",
    "#171 the ITIL service value system is sistema de valor"],
  ["d711f047", "explanation", "incorporada em todo o sistema de valores", "incorporada em todo o sistema de valor",
    "#171 same, the explanation"],
  ["6ff484f7", "option:d", "que ele deve esclarecer o Sprint Goal", "que esclareça o Sprint Goal",
    "#224 inserted modal in the KEY; the English says `remind ... to clarify`"],
];

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

async function patchWithRetry(path, body, tries = 4) {
  let last = null;
  for (let i = 1; i <= tries; i++) {
    try {
      const r = await fetch(REST_URL + "/" + path, {
        method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(body),
      });
      if (r.ok) return r;
      last = r.status + " " + (await r.text()).slice(0, 160);
    } catch (e) { last = String(e && e.message ? e.message : e); }
    if (i < tries) await new Promise((s) => setTimeout(s, 400 * i));
  }
  throw new Error("PATCH " + path + " failed after " + tries + ": " + last);
}

const prefixes = [...new Set(EDITS.map((e) => e[0]))];
const all = await getAll(KEY,
  "quiz_questions?select=id,language,question_group_id,question_text,options,correct_answer,explanation"
  + "&language=eq.pt-BR&status=eq.approved&retired_at=is.null&order=id");

const problems = [];
const resolved = new Map();
for (const p of prefixes) {
  const hits = all.filter((r) => r.id.startsWith(p));
  if (hits.length !== 1) { problems.push(p + " matched " + hits.length + " live pt-BR row(s)"); continue; }
  resolved.set(p, { row: hits[0], next: JSON.parse(JSON.stringify(hits[0])) });
}

for (const [p, field, from, to] of EDITS) {
  const r = resolved.get(p);
  if (!r) continue;
  const label = p + " " + field;
  if (field === "question_text" || field === "explanation") {
    const cur = String(r.next[field] || "");
    const n = cur.split(from).length - 1;
    if (n !== 1) { problems.push(label + ": anchor occurs " + n + " times, expected 1"); continue; }
    r.next[field] = cur.replace(from, to);
  } else if (field.startsWith("option:")) {
    const oid = field.slice(7);
    const arr = r.next.options;
    const idx = Array.isArray(arr) ? arr.findIndex((o) => o && o.id === oid) : -1;
    if (idx < 0) { problems.push(label + ": no option " + oid); continue; }
    const cur = String(arr[idx].text || "");
    const n = cur.split(from).length - 1;
    if (n !== 1) { problems.push(label + ": anchor occurs " + n + " times in option " + oid); continue; }
    arr[idx] = { ...arr[idx], text: cur.replace(from, to) };
  } else problems.push(label + ": unknown field");
}

/* The key must not move, no option added dropped or reordered, and ONLY the declared
 * fields may differ -- the #224 stem in particular must come through untouched. */
for (const [p, r] of resolved) {
  const a = r.row, b = r.next;
  if (JSON.stringify(a.correct_answer) !== JSON.stringify(b.correct_answer)) problems.push(p + ": the KEY changed");
  const ids = (x) => (Array.isArray(x.options) ? x.options.map((o) => o.id) : []);
  if (JSON.stringify(ids(a)) !== JSON.stringify(ids(b))) problems.push(p + ": option ids or order changed");
  const changed = [];
  if (String(a.question_text || "") !== String(b.question_text || "")) changed.push("question_text");
  if (String(a.explanation || "") !== String(b.explanation || "")) changed.push("explanation");
  const ao = Array.isArray(a.options) ? a.options : [], bo = Array.isArray(b.options) ? b.options : [];
  for (let i = 0; i < ao.length; i++) {
    if (String(ao[i].text || "") !== String(bo[i].text || "")) changed.push("option:" + ao[i].id);
  }
  const want = EDITS.filter((e) => e[0] === p).map((e) => e[1]);
  if (JSON.stringify([...changed].sort()) !== JSON.stringify([...want].sort())) {
    problems.push(p + ": changed " + changed.join(",") + " but declared " + want.join(","));
  }
}

console.log(APPLY ? "APPLY -- writing pt-BR rows" : "DRY RUN -- nothing will be written");
console.log("  field edits  " + EDITS.length + "   items " + prefixes.length + "   resolved " + resolved.size);
console.log("");
for (const [p, field, from, to, why] of EDITS) {
  console.log("  " + p + "  " + field + "   " + why);
  console.log("      old  " + from);
  console.log("      new  " + to);
}
if (problems.length) {
  console.error("");
  console.error("ABORT -- nothing written:");
  for (const x of problems) console.error("  " + x);
  process.exitCode = 2; process.exit();
}
if (!APPLY) {
  console.log("");
  console.log("  dry run clean: " + EDITS.length + " edits, " + resolved.size +
    " items, no key moved, no option reordered, #224 stem untouched.");
  process.exitCode = 0; process.exit();
}

for (const [p, r] of resolved) {
  try {
    await patchWithRetry("quiz_questions?id=eq." + r.row.id,
      { question_text: r.next.question_text, options: r.next.options, explanation: r.next.explanation });
  } catch (e) {
    console.error("\n" + String(e.message || e));
    console.error("Re-run the DRY RUN to read the true state; an applied edit shows as `anchor occurs 0 times`.");
    process.exitCode = 1; process.exit();
  }
}

const back = await getAllIn(KEY, "quiz_questions",
  "id,language,question_group_id,question_text,options,correct_answer,explanation", "id",
  [...resolved.values()].map((r) => r.row.id));
const backBy = new Map(back.map((r) => [r.id, r]));

const post = [];
for (const [p, r] of resolved) {
  const b = backBy.get(r.row.id);
  post.push([p + " byte-for-byte read-back",
    JSON.stringify({ q: b.question_text, o: b.options, e: b.explanation }) ===
    JSON.stringify({ q: r.next.question_text, o: r.next.options, e: r.next.explanation }), "differs"]);
  post.push([p + " key unchanged",
    JSON.stringify(b.correct_answer) === JSON.stringify(r.row.correct_answer), "key moved"]);
}
for (const [p, field, from] of EDITS) {
  const b = backBy.get(resolved.get(p).row.id);
  const hay = field === "explanation" ? String(b.explanation || "")
    : field === "question_text" ? String(b.question_text || "")
      : String((b.options.find((o) => o.id === field.slice(7)) || {}).text || "");
  post.push([p + " " + field + " old text gone", !hay.includes(from), "anchor survived"]);
}
/* The #224 stem specifically: it was flagged by the probe and must NOT have moved. */
const s224 = backBy.get(resolved.get("6ff484f7").row.id);
post.push(["#224 STEM untouched (it renders `should` correctly)",
  String(s224.question_text) === String(resolved.get("6ff484f7").row.question_text), "the stem changed"]);
post.push(["#224 stem still carries its `deve`", /\bdeve\b/i.test(String(s224.question_text)),
  "the stem lost a correct modal"]);

const enRows = await getAllIn(KEY, "quiz_questions",
  "id,question_group_id,language,question_text,options,correct_answer,explanation",
  "question_group_id", [...new Set(back.map((r) => r.question_group_id).filter(Boolean))]);
const enBy = new Map();
for (const r of enRows) if (r.language === "en") enBy.set(r.question_group_id, r);

const already = await getAllIn(KEY, "item_translation_reviews", "question_id,reviewed_by", "question_id",
  [...resolved.values()].map((r) => r.row.id));
const have = new Set(already.filter((r) => r.reviewed_by === REVIEWER).map((r) => r.question_id));
const reviews = [];
for (const [, r] of resolved) {
  const b = backBy.get(r.row.id);
  if (have.has(b.id)) continue;
  const en = enBy.get(b.question_group_id);
  if (!en) { problems.push(b.id + ": no English sibling"); continue; }
  reviews.push({ question_id: b.id, reviewed_by: REVIEWER, verdict: "approved",
    en_hash: itemHash8(en), tr_hash: itemHash8(b), tr_hash_basis: "assumed", note: NOTE });
}
if (reviews.length) {
  const rr = await fetch(REST_URL + "/item_translation_reviews", {
    method: "POST", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(reviews),
  });
  if (!rr.ok) { console.error("review insert failed: " + rr.status + "\n" + (await rr.text())); process.exitCode = 1; process.exit(); }
}
const finalRows = await getAllIn(KEY, "item_translation_reviews", "question_id,reviewed_by", "question_id",
  [...resolved.values()].map((r) => r.row.id));
const mine = finalRows.filter((r) => r.reviewed_by === REVIEWER);
post.push(["one review row per edited item", mine.length === resolved.size,
  mine.length + " row(s) for " + resolved.size + " items"]);
post.push(["no duplicate review row", new Set(mine.map((r) => r.question_id)).size === mine.length, "duplicate"]);

console.log("");
let bad = 0;
for (const [name, ok, msg] of post) { if (!ok) { console.log("  FAIL  " + name + "   -- " + msg); bad++; } }
console.log("  " + (post.length - bad) + " of " + post.length + " post-conditions pass");
writeFileSync(join(ROOT, "TIER-C-PT-APPLIED.json"), JSON.stringify({
  edits: EDITS.length, items: resolved.size,
  applied: EDITS.map(([p, f, from, to]) => ({ id: p, field: f, from, to })),
  dismissed_after_reading: ["#85 7312ac33 correct", "#113 df6bafc6 faithful", "#309 b7c850be English says must"],
}, null, 2) + "\n", "utf8");
console.log("  wrote TIER-C-PT-APPLIED.json");
process.exitCode = bad ? 1 : 0;
