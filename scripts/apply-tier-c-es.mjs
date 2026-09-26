/**
 * apply-tier-c-es.mjs -- the approved Tier C Spanish fixes, field by field.
 *
 * WRITES. `--apply`; DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ SCOPE ============
 *
 * es-419 rows only. 25 field edits across 21 items, approved by the director
 * 2026-09-26 with four changes folded in:
 *
 *   #41   `empareja` -> `reconoce`   (empareja means "pairs up")
 *   #309  `del Scrum Master` -> `para el Scrum Master`
 *   #171  identified as c699dee9 (AISM-I); `sistema de valores` -> `sistema de valor`
 *         in the two places that name the service value system
 *   #112 and #231 are HELD, so those rows are edited once, with their Tier B outcome
 *
 * NONE of these changes a key. pt-BR is NOT touched; its siblings are inspected by
 * `check-tier-c-pt-siblings.mjs` and reported.
 *
 * ============ FIELD BY FIELD, AND WHY THE OPTION EDITS ARE SURGICAL ============
 *
 * An option edit rewrites ONE element's `text` inside the options array and asserts
 * every sibling id, order and text is byte-identical afterwards. Rebuilding the
 * array would diff as a whole-block change and hide a sibling that moved -- the
 * checkpoint-grain lesson, applied to an item.
 *
 * ============ THE REVIEW ROW, AND THE HASH IT CANNOT ASK FOR ============
 *
 * Items have NO GATE: nothing reads `item_translation_reviews`, so there is no
 * `expected_review_hashes_item` function to ask, unlike the lesson, task and concept
 * arms after migration 374. `en_hash` is NOT NULL, so a row cannot be written
 * without one.
 *
 * So the hash comes from `itemHash8` in `scripts/lib/item-hash.mjs` -- the same
 * module that produced the 30 existing rows -- and `tr_hash_basis` is `assumed`,
 * matching them. This script is declared in `check-hash-writers`'s
 * REVIEW_RECORDERS for exactly that reason: a recorder computing a hash locally is
 * a finding unless it is declared, and here it is declared WITH the reason, which is
 * that no gate exists to ask.
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
    console.error("unknown flag " + JSON.stringify(a));
    console.error("DRY BY DEFAULT; --apply writes. There is no --dry.");
    process.exitCode = 2; process.exit();
  }
}
const APPLY = process.argv.includes("--apply");

const REVIEWER = "platform owner (the director), bilingual read of the 342 exposed items, 2026-09-26";
const NOTE = "Tier C Spanish slip, corrected field by field. Approved in TIER-C-SPANISH-DRAFTS.md. "
  + "No key changed. Items have no gate, so this row exists only so the next reader can tell a "
  + "reviewed row from one that was never read.";

/** [prefix, field, from, to, why] -- field is question_text | explanation | option:<id> */
const EDITS = [
  ["7312ac33", "option:a", "respuesta numérica confiable", "respuesta numérica segura", "confident -> segura, not confiable"],
  ["64495519", "option:c", "no un incidente de responsabilidad del proveedor.", "no un incidente de responsabilidad del proveedor del servicio.", "vendor vs provider"],
  ["df6bafc6", "option:a", "se transfiere al proveedor del modelo", "se transfiere al proveedor de IA", "vendor vs provider"],
  ["df6bafc6", "explanation", "la transferencia al proveedor no elimina", "la transferencia al proveedor de IA no elimina", "vendor vs provider, same item"],
  ["5fe28afb", "option:d", "requiere disponibilidad antes de cualquier decisión", "requiere preparación antes de cualquier decisión", "readiness -> preparacion"],
  ["c330fb40", "option:b", "Es un componente distintivo del SVS", "Es un componente distinto del SVS", "distinct -> distinto"],
  ["c330fb40", "explanation", "un componente del SVS distintivo y omnipresente", "un componente del SVS distinto y omnipresente", "distinct -> distinto"],
  ["4b5d4ed5", "question_text", "cifras presupuestarias confidenciales", "cifras presupuestarias sensibles", "sensitive != confidential; distractor d depends on it"],
  ["7df0197d", "explanation", "deja a los usuarios sin recursos", "deja a los usuarios sin una vía de recurso", "recourse != recursos"],
  ["c94769f9", "question_text", "¿Qué concepto de Scrum representa de manera más incorrecta este comportamiento?", "¿Qué concepto de Scrum tergiversa más directamente este comportamiento?", "most directly misrepresent"],
  ["f02f62e3", "question_text", "se deferentan silenciosamente a los seniors", "ceden silenciosamente ante los seniors", "se deferentan is not a verb"],
  ["04be5971", "explanation", "malrepresenta su origen", "tergiversa su origen", "malrepresenta is a calque"],
  ["8ce51417", "option:d", "disposición del equipo a autogestirse", "disposición del equipo a autogestionarse", "autogestirse is not a verb"],
  ["6dc29170", "option:a", "Defer al Product Owner", "Remitirlo al Product Owner", "Defer left in English; siblings are infinitives"],
  ["2cc60850", "option:c", "dejando a ninguna persona responsable por cada decisión", "y no deja a nadie responsable de cada decisión", "ungrammatical"],
  ["1a568ec2", "explanation", "la Respeto genuino", "el Respeto genuino", "wrong article"],
  ["499c3a66", "question_text", "están más directamente enraizados en cuál par de ideas:", "¿en cuál par de ideas están más directamente enraizados?", "interrogative lost its marks"],
  ["a6477254", "option:a", "abrir el rango del backlog de la historia", "abrir la posición de la historia en el backlog", "rank != rango"],
  ["41611b9c", "option:b", "asignar a cada elemento un rango numérico", "asignar a cada elemento un orden numérico", "rank != rango"],
  /* the director's change: reconoce, not empareja */
  ["0bf3f292", "option:a", "la herramienta coincide con patrones aprendidos", "la herramienta reconoce patrones aprendidos", "pattern-matching; empareja means pairs up"],
  ["40d5d539", "option:d", "que debe clarificar el Sprint Goal", "que clarifique el Sprint Goal", "inserted debe in the KEY"],
  /* the director's change: para, not del */
  ["5a5917ca", "question_text", "¿Cuál es la acción más apropiada que debe tomar el Scrum Master?", "¿Cuál es la siguiente acción más apropiada para el Scrum Master?", "inserted debe, and `next` was dropped"],
  ["16d3e0c9", "option:d", "Pérdida de habilidades (deskilling), porque", "Pérdida de habilidades, porque", "the English gloss appears only in the key"],
  /* #171, identified by the director as c699dee9 */
  ["c699dee9", "option:c", "tejida en el sistema de valores", "tejida en el sistema de valor", "the ITIL service value system is sistema de valor"],
  ["c699dee9", "explanation", "integrada en todo el sistema de valores", "integrada en todo el sistema de valor", "same, the explanation"],
];

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

/* ============ A RETRY IS SAFE ONLY WHERE THE WRITE IS IDEMPOTENT ============
 *
 * The first --apply run died on ECONNRESET partway through. Nothing had landed --
 * verified by re-running the dry run, which checks all 25 anchors and would have
 * reported any already-replaced text as "anchor occurs 0 times". But the next reset
 * might land halfway, so:
 *
 *   the PATCHes  set an exact body and are idempotent, so they retry
 *   the review INSERT  is not, so it never retries blindly; it inserts only for
 *                      items that do not already carry a row from this reviewer
 *
 * That is the distinction `scripts/lib/fn-auth.mjs` records: a blind retry on a
 * write cannot tell a lost response from a request that never arrived, and on a
 * non-idempotent write it duplicates. */
async function patchWithRetry(path, body, tries = 4) {
  let last = null;
  for (let i = 1; i <= tries; i++) {
    try {
      const r = await fetch(REST_URL + "/" + path, {
        method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(body),
      });
      if (r.ok) return r;
      last = r.status + " " + r.statusText + " " + (await r.text()).slice(0, 200);
    } catch (e) { last = String(e && e.message ? e.message : e); }
    if (i < tries) await new Promise((s) => setTimeout(s, 400 * i));
  }
  throw new Error("PATCH " + path + " failed after " + tries + " attempts: " + last);
}

const prefixes = [...new Set(EDITS.map((e) => e[0]))];
const all = await getAll(KEY,
  "quiz_questions?select=id,language,question_group_id,certification_id,question_text,options,correct_answer,explanation&language=eq.es-419&status=eq.approved&retired_at=is.null&order=id");

const problems = [];
const resolved = new Map();
for (const p of prefixes) {
  const hits = all.filter((r) => r.id.startsWith(p));
  if (hits.length !== 1) { problems.push(p + " matched " + hits.length + " live es-419 row(s)"); continue; }
  resolved.set(p, { row: hits[0], next: JSON.parse(JSON.stringify(hits[0])) });
}

/* Stage every edit in memory and validate, so ABORT means nothing was written. */
for (const [p, field, from, to, why] of EDITS) {
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
    if (!Array.isArray(arr)) { problems.push(label + ": options is not an array"); continue; }
    const idx = arr.findIndex((o) => o && o.id === oid);
    if (idx < 0) { problems.push(label + ": no option with id " + oid); continue; }
    const cur = String(arr[idx].text || "");
    const n = cur.split(from).length - 1;
    if (n !== 1) { problems.push(label + ": anchor occurs " + n + " times in option " + oid); continue; }
    arr[idx] = { ...arr[idx], text: cur.replace(from, to) };
  } else { problems.push(label + ": unknown field"); }
  void why;
}

/* The key must not move, and no option may be added, dropped or reordered. */
for (const [p, r] of resolved) {
  const a = r.row, b = r.next;
  if (JSON.stringify(a.correct_answer) !== JSON.stringify(b.correct_answer)) problems.push(p + ": the KEY changed");
  const ids = (x) => (Array.isArray(x.options) ? x.options.map((o) => o.id) : []);
  if (JSON.stringify(ids(a)) !== JSON.stringify(ids(b))) problems.push(p + ": option ids or order changed");
  const changedFields = [];
  if (String(a.question_text || "") !== String(b.question_text || "")) changedFields.push("stem");
  if (String(a.explanation || "") !== String(b.explanation || "")) changedFields.push("explanation");
  const ao = Array.isArray(a.options) ? a.options : [], bo = Array.isArray(b.options) ? b.options : [];
  for (let i = 0; i < ao.length; i++) {
    if (String(ao[i].text || "") !== String(bo[i].text || "")) changedFields.push("option:" + ao[i].id);
  }
  const want = EDITS.filter((e) => e[0] === p).map((e) => e[1] === "question_text" ? "stem" : e[1]);
  if (JSON.stringify([...changedFields].sort()) !== JSON.stringify([...want].sort())) {
    problems.push(p + ": changed fields " + changedFields.join(",") + " but declared " + want.join(","));
  }
}

console.log(APPLY ? "APPLY -- writing es-419 rows" : "DRY RUN -- nothing will be written");
console.log("  field edits declared   " + EDITS.length);
console.log("  items                  " + prefixes.length);
console.log("  resolved               " + resolved.size);
console.log("");
for (const [p, field, from, to, why] of EDITS) {
  console.log("  " + p + "  " + field);
  console.log("      why  " + why);
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
  console.log("  dry run clean: " + EDITS.length + " edits across " + resolved.size +
    " items, no key moved, no option reordered.");
  process.exitCode = 0; process.exit();
}

/* ---- write, byte read-back per field, then the review rows ---- */
const written = [];
for (const [p, r] of resolved) {
  try {
    await patchWithRetry("quiz_questions?id=eq." + r.row.id,
      { question_text: r.next.question_text, options: r.next.options, explanation: r.next.explanation });
  } catch (e) {
    console.error("");
    console.error(String(e.message || e));
    console.error("STOPPED after " + written.length + " of " + resolved.size + " items.");
    console.error("Re-running the DRY RUN reports the true state: any already-applied edit");
    console.error("shows as `anchor occurs 0 times` and aborts, so nothing is guessed.");
    process.exitCode = 1; process.exit();
  }
  written.push(p);
}

const back = await getAllIn(KEY, "quiz_questions",
  "id,language,question_group_id,question_text,options,correct_answer,explanation", "id",
  [...resolved.values()].map((r) => r.row.id));
const backBy = new Map(back.map((r) => [r.id, r]));

const post = [];
for (const [p, r] of resolved) {
  const b = backBy.get(r.row.id);
  post.push([p + " body matches byte for byte",
    JSON.stringify({ q: b.question_text, o: b.options, e: b.explanation }) ===
    JSON.stringify({ q: r.next.question_text, o: r.next.options, e: r.next.explanation }),
    "read-back differs"]);
  post.push([p + " key unchanged", JSON.stringify(b.correct_answer) === JSON.stringify(r.row.correct_answer), "key moved"]);
}
for (const [p, field, from] of EDITS) {
  const b = backBy.get(resolved.get(p).row.id);
  const hay = field === "question_text" ? String(b.question_text || "")
    : field === "explanation" ? String(b.explanation || "")
      : String((b.options.find((o) => o.id === field.slice(7)) || {}).text || "");
  post.push([p + " " + field + ": old text gone", !hay.includes(from), "the anchor survived"]);
}

/* review rows -- one per edited item */
const enRows = await getAllIn(KEY, "quiz_questions",
  "id,question_group_id,language,question_text,options,correct_answer,explanation",
  "question_group_id", [...new Set(back.map((r) => r.question_group_id).filter(Boolean))]);
const enBy = new Map();
for (const r of enRows) if (r.language === "en") enBy.set(r.question_group_id, r);

/* NOT IDEMPOTENT, so it is made idempotent: only items without a row from this
 * reviewer get one. A re-run after a partial failure therefore cannot duplicate. */
const already = await getAllIn(KEY, "item_translation_reviews", "question_id,reviewed_by",
  "question_id", [...resolved.values()].map((r) => r.row.id));
const haveRow = new Set(already.filter((r) => r.reviewed_by === REVIEWER).map((r) => r.question_id));

const reviews = [];
for (const [, r] of resolved) {
  const b = backBy.get(r.row.id);
  if (haveRow.has(b.id)) continue;
  const en = enBy.get(b.question_group_id);
  if (!en) { problems.push(r.row.id + ": no English sibling, cannot record en_hash"); continue; }
  reviews.push({
    question_id: b.id, reviewed_by: REVIEWER, verdict: "approved",
    en_hash: itemHash8(en), tr_hash: itemHash8(b), tr_hash_basis: "assumed",
    note: NOTE,
  });
}
let inserted = 0;
if (reviews.length) {
  const rr = await fetch(REST_URL + "/item_translation_reviews", {
    method: "POST", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(reviews),
  });
  if (!rr.ok) { console.error("review insert failed: " + rr.status + "\n" + (await rr.text())); process.exitCode = 1; process.exit(); }
  inserted = (await rr.json()).length;
}
const finalRows = await getAllIn(KEY, "item_translation_reviews", "question_id,reviewed_by",
  "question_id", [...resolved.values()].map((r) => r.row.id));
const mine = finalRows.filter((r) => r.reviewed_by === REVIEWER);
post.push(["a review row per edited item, exactly one", mine.length === resolved.size,
  "this reviewer has " + mine.length + " row(s) for " + resolved.size + " items"]);
post.push(["no duplicate review row", new Set(mine.map((r) => r.question_id)).size === mine.length,
  "an item carries two rows from this reviewer"]);
const rrBack = { length: inserted };

console.log("");
let bad = 0;
for (const [name, ok, msg] of post) {
  if (!ok) { console.log("  FAIL  " + name + "   -- " + msg); bad++; }
}
console.log("  " + (post.length - bad) + " of " + post.length + " post-conditions pass");

writeFileSync(join(ROOT, "TIER-C-APPLIED.json"), JSON.stringify({
  edits: EDITS.length, items: resolved.size, reviews: rrBack.length,
  applied: EDITS.map(([p, f, from, to]) => ({ id: p, field: f, from, to })),
}, null, 2) + "\n", "utf8");
console.log("  wrote TIER-C-APPLIED.json");
process.exitCode = bad ? 1 : 0;
