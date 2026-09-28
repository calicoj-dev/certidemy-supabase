#!/usr/bin/env node
/**
 * apply-prompt84-b-items.mjs -- the six B findings from the director's read of the 120-item
 * translation sample, corrected field by field.
 *
 * WRITES. `--apply`; DRY BY DEFAULT. Unknown flags exit 2. There is no `--dry`.
 *
 * ============ WHY A THIRD SCRIPT AND NOT AN EDIT TO apply-tier-c-es.mjs ============
 *
 * That script is applied and declared. Reopening a finished, already-run writer to carry a new
 * batch would invalidate the record of what it did, and a reviewer's memory of what they approved
 * is part of that record. This one follows its shape exactly -- staged in memory, validated, abort
 * means nothing was written, key asserted unmoved, options asserted unreordered, only the declared
 * fields allowed to change -- and differs in two ways:
 *
 *   BOTH LANGUAGES. Four es-419 rows and two pt-BR rows, so the language is part of each edit and
 *   the resolver is scoped per language. Tier C was Spanish-only.
 *
 *   THE COLUMNS ARE NAMED. `status`, `visibility` and `is_exam_scope` travel in the PATCH body at
 *   the values just read, and are asserted on read-back. A default cannot apply to an UPDATE, so
 *   this buys nothing against Postgres -- it buys the assertion: these are LIVE SECURE items, and
 *   a patch that silently moved one out of the exam or into a different pool is the failure that
 *   would matter most and would be invisible in a diff of prose.
 *
 * ============ THE SIBLING IS NOT TOUCHED ============
 *
 * Every edit is keyed to ONE row id in ONE language. The es-419 sibling of a pt-BR fix keeps its own
 * wording, and vice versa -- so where the same term defect exists in the other language it stays
 * until the bulk remediation pass, which is a separate ruling with a per-certification count.
 *
 * Two of these items (795e29e2, 1103ec53) are AI Act items whose es-419 siblings very likely carry
 * the same `provider`/`deployer` defect. That is deliberate and is NOT fixed here.
 *
 * ============ PROVENANCE, AND WHY A LOCALLY COMPUTED HASH IS ALLOWED HERE ============
 *
 * One `item_translation_reviews` row per edited item, computed with `itemHash8` and
 * `tr_hash_basis = 'assumed'`, matching the 30 pre-existing rows and the two Tier C recorders.
 *
 * THE ITEM ARM HAS NO GATE: nothing reads `item_translation_reviews`, so there is no
 * `expected_review_hashes_item` to ask and no stored value this computation could contradict. That
 * is the whole justification, it is declared in `check-hash-writers.mjs`, and the moment an item
 * gate exists this script is wrong and must switch to asking it.
 *
 * ============ WHAT IS DELIBERATELY NOT CHANGED ============
 *
 * `Sprint Goal` in 1df3426c stays in English. The house Scrum ruling asks for the official 2020
 * es/pt term with the English in parentheses on first use, and the official Spanish and Portuguese
 * Scrum Guides are NOT ON DISK. Reconstructing an official term from memory is exactly what the
 * ruling forbids, so the Scrum surface waits for the guides.
 *
 * `Compromiso` (capital C) in 1df3426c stays: that IS the Scrum value Commitment, and naming it is
 * how distractor (d) and the explanation identify the error. Only the `trade-off` sense moves to
 * `disyuntiva`.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn } from "./_pg.mjs";
import { itemHash8 } from "./lib/item-hash.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (!KNOWN.has(a)) {
    console.error("unknown flag " + JSON.stringify(a) + ". Known: --apply");
    console.error("DRY BY DEFAULT; --apply writes. There is no --dry.");
    process.exitCode = 2; process.exit();
  }
}
const APPLY = process.argv.includes("--apply");

const REVIEWER = "platform owner (the director), bilingual read of the 120-item translation sample, 2026-09-27";
const NOTE = "PROMPT-84 B finding: terminology corrected field by field. No key changed, no option "
  + "reordered, sibling language untouched. Items have no gate, so this row exists only so the next "
  + "reader can tell a reviewed row from one that was never read.";

/** [prefix, language, field, from, to, why] -- field is question_text | explanation | option:<id> */
const EDITS = [
  /* 9c3c08b0 AIHR-I es: `ranking` and `classification` both became clasificacion, which collapses
   * the distinction the item turns on. Candidate ranking becomes ordenamiento; clasificar is KEPT
   * for in-scope / out-of-scope, which is every other use in the row. */
  ["9c3c08b0", "es-419", "question_text", "herramienta de clasificación de currículums",
    "herramienta de ordenamiento de currículums", "ranking tool, not scope classification"],
  ["9c3c08b0", "es-419", "question_text", "los candidatos clasificados en el cuartil superior",
    "los candidatos ordenados en el cuartil superior", "ranked in the top quartile"],
  ["9c3c08b0", "es-419", "option:b", "siguen la clasificación",
    "siguen el ordenamiento", "follow the ranking, not the scope determination"],

  /* 1df3426c SD-AI-I es: the key's `trade-off` became compromiso, which is the Scrum value
   * Commitment -- and distractor (d) names el Compromiso, so the key and a distractor read as the
   * same concept. */
  ["1df3426c", "es-419", "option:c", "Comunicar el compromiso al Product Owner",
    "Comunicar la disyuntiva al Product Owner", "trade-off is disyuntiva, not the value Commitment"],
  ["1df3426c", "es-419", "explanation", "hacer visibles los compromisos en lugar de",
    "hacer visibles las disyuntivas en lugar de", "same substitution in the explanation"],

  /* 7eb176c5 AIMS-IA es: proveedor is used both for the vendor the model was bought from and for
   * the 42001 provider ROLE the finding turns on. Vendor becomes suministrador. */
  ["7eb176c5", "es-419", "question_text", "de un proveedor, lo vuelve a entrenar",
    "de un suministrador, lo vuelve a entrenar", "vendor, not the provider role"],
  ["7eb176c5", "es-419", "option:c", "dentro del sistema del proveedor",
    "dentro del sistema del suministrador", "vendor"],
  ["7eb176c5", "es-419", "option:d", "reentrenar un modelo de proveedor",
    "reentrenar un modelo de suministrador", "vendor"],

  /* 0e7729eb AIMS-IA es: SGSIA reads as SGSI, the ISMS. The AI management system is SGIA. */
  ["0e7729eb", "es-419", "option:d", "del SGSIA", "del SGIA", "SGSIA reads as SGSI (the ISMS)"],
  ["0e7729eb", "es-419", "explanation", "dentro del SGSIA", "dentro del SGIA", "same"],

  /* 1103ec53 AIGRM-I pt: provider was fornecedor and deployer was implantador. Glossary: prestador
   * and responsavel pela implantacao. The Act's name is not left in English either. */
  ["1103ec53", "pt-BR", "question_text",
    "como implantador sob o Regulamento Europeu de IA (EU AI Act)?",
    "como responsável pela implantação sob o Regulamento da IA da UE?",
    "deployer, plus the Act's own name in Portuguese"],
  ["1103ec53", "pt-BR", "explanation", "Os implantadores devem implementar",
    "Os responsáveis pela implantação devem implementar", "deployer"],
  ["1103ec53", "pt-BR", "explanation", "são obrigações do fornecedor",
    "são obrigações do prestador", "provider is prestador"],
  ["1103ec53", "pt-BR", "explanation", "pertencem ao fornecedor original",
    "pertencem ao prestador original", "provider is prestador"],

  /* 795e29e2 AIGRM-I pt: provider was provedor, deployer was implantadores. The ENGLISH of this
   * item is separately suspect (probable double key, EN-DEFECTS-SAMPLE.md); the terminology fix is
   * independent of that and was ruled for anyway. */
  ["795e29e2", "pt-BR", "question_text", "as obrigações de um provedor",
    "as obrigações de um prestador", "provider is prestador"],
  ["795e29e2", "pt-BR", "option:a", "às dos provedores", "às dos prestadores", "provider"],
  ["795e29e2", "pt-BR", "option:b", "obrigações de provedor sempre que",
    "obrigações de prestador sempre que", "provider"],
  ["795e29e2", "pt-BR", "option:c", "às dos implantadores",
    "às dos responsáveis pela implantação", "deployer"],
  ["795e29e2", "pt-BR", "option:d", "do que os provedores", "do que os prestadores", "provider"],
  ["795e29e2", "pt-BR", "explanation", "atribuídas ao provedor", "atribuídas ao prestador", "provider"],
  ["795e29e2", "pt-BR", "explanation", "equivalentes a provedores ou implantadores",
    "equivalentes a prestadores ou responsáveis pela implantação", "provider and deployer"],
  ["795e29e2", "pt-BR", "explanation", "obrigações de provedor somente se",
    "obrigações de prestador somente se", "provider"],
  ["795e29e2", "pt-BR", "explanation", "o papel de provedor, não o de distribuidor",
    "o papel de prestador, não o de distribuidor", "provider"],
];

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1/";

/* A PATCH is not retried blindly on a connect timeout in general -- but this one is idempotent by
 * construction: it writes an exact target value, so a request that landed and lost its response
 * leaves the same bytes a retry would write. Stated because the repo's own rule is that a blind
 * retry on a write is a defect unless the write is idempotent, and here it is. */
async function patchWithRetry(path, body, tries = 4) {
  let last = null;
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(REST + path, {
        method: "PATCH", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("PATCH " + path + " -> " + res.status + " " + (await res.text()).slice(0, 200));
      return;
    } catch (e) {
      last = e;
      if (i < tries) await new Promise((r) => setTimeout(r, 700 * i));
    }
  }
  throw last;
}

const wanted = [...new Set(EDITS.map((e) => e[0] + "|" + e[1]))];
const langs = [...new Set(EDITS.map((e) => e[1]))];
const all = await getAll(KEY,
  "quiz_questions?select=id,certification_id,language,status,visibility,is_exam_scope,pool," +
  "question_text,options,correct_answer,explanation,question_group_id" +
  "&language=in.(" + langs.join(",") + ")&retired_at=is.null&order=id");
const certRows = await getAll(KEY, "certifications?select=id,code&order=code");
const certCode = new Map(certRows.map((c) => [c.id, c.code]));

const problems = [];
const resolved = new Map();
for (const w of wanted) {
  const [p, lang] = w.split("|");
  const hits = all.filter((r) => r.id.startsWith(p) && r.language === lang);
  if (hits.length !== 1) { problems.push(w + " matched " + hits.length + " live row(s)"); continue; }
  resolved.set(w, { row: hits[0], next: JSON.parse(JSON.stringify(hits[0])) });
}

/* ============ AN ALREADY-APPLIED EDIT IS ITS OWN STATE, NOT AN ERROR ============
 *
 * The first `--apply` run landed all six rows and then failed inserting the provenance, because the
 * verdict vocabulary is approved|rejected and I sent "corrected". Re-running to recover the
 * provenance then aborted on "anchor occurs 0 times" -- correctly, since the anchors had been
 * replaced by the run that succeeded.
 *
 * So a writer meant to be safe to re-run has to tell "the anchor is gone because I already did this"
 * from "the anchor was never there". `from` absent AND `to` present is DONE; neither present is a
 * real problem. Without that third state a half-finished run can never be completed, only forced. */
const alreadyApplied = [];
for (const [p, lang, field, from, to, why] of EDITS) {
  const r = resolved.get(p + "|" + lang);
  if (!r) continue;
  const label = p + " " + lang + " " + field;
  const stage = (cur, put) => {
    const nFrom = cur.split(from).length - 1;
    if (nFrom === 1) { put(cur.replace(from, to)); return "staged"; }
    if (nFrom === 0 && cur.includes(to)) { alreadyApplied.push(label); return "done"; }
    problems.push(label + ": anchor occurs " + nFrom + " times and the target is " +
      (cur.includes(to) ? "present" : "absent") + " -- expected exactly one anchor");
    return "bad";
  };
  if (field === "question_text" || field === "explanation") {
    stage(String(r.next[field] || ""), (v) => { r.next[field] = v; });
  } else if (field.startsWith("option:")) {
    const oid = field.slice(7);
    const arr = r.next.options;
    if (!Array.isArray(arr)) { problems.push(label + ": options is not an array"); continue; }
    const idx = arr.findIndex((o) => o && o.id === oid);
    if (idx < 0) { problems.push(label + ": no option with id " + oid); continue; }
    stage(String(arr[idx].text || ""), (v) => { arr[idx] = { ...arr[idx], text: v }; });
  } else { problems.push(label + ": unknown field"); }
  void why;
}

/* The key must not move, no option added, dropped or reordered, and the three exam-placement columns
 * must be identical. Only the declared fields may differ. */
for (const [w, r] of resolved) {
  const a = r.row, b = r.next;
  const [p, lang] = w.split("|");
  if (JSON.stringify(a.correct_answer) !== JSON.stringify(b.correct_answer)) problems.push(w + ": the KEY changed");
  const ids = (x) => (Array.isArray(x.options) ? x.options.map((o) => o.id) : []);
  if (JSON.stringify(ids(a)) !== JSON.stringify(ids(b))) problems.push(w + ": option ids or order changed");
  for (const col of ["status", "visibility", "is_exam_scope", "pool", "question_group_id"]) {
    if (String(a[col]) !== String(b[col])) problems.push(w + ": " + col + " changed in staging");
  }
  const changed = [];
  if (String(a.question_text || "") !== String(b.question_text || "")) changed.push("question_text");
  if (String(a.explanation || "") !== String(b.explanation || "")) changed.push("explanation");
  const ao = Array.isArray(a.options) ? a.options : [], bo = Array.isArray(b.options) ? b.options : [];
  for (let i = 0; i < ao.length; i++) {
    if (String(ao[i].text || "") !== String(bo[i].text || "")) changed.push("option:" + ao[i].id);
  }
  /* Only fields with an edit still to make are expected to differ. A field whose every edit was
   * already applied stages no change, so demanding one would abort every recovery run. */
  const want = [...new Set(EDITS
    .filter((e) => e[0] === p && e[1] === lang && !alreadyApplied.includes(p + " " + lang + " " + e[2]))
    .map((e) => e[2]))];
  if (JSON.stringify([...new Set(changed)].sort()) !== JSON.stringify([...want].sort())) {
    problems.push(w + ": changed " + [...new Set(changed)].join(",") + " but declared " + want.join(","));
  }
}

console.log(APPLY ? "APPLY -- writing" : "DRY RUN -- nothing will be written");
console.log("  field edits declared   " + EDITS.length);
console.log("  items                  " + wanted.length);
console.log("  resolved               " + resolved.size);
console.log("  already applied        " + alreadyApplied.length + " of " + EDITS.length + " (a re-run after a partial run)");
console.log("");
for (const [w, r] of resolved) {
  const [p, lang] = w.split("|");
  console.log("  " + p + "  " + lang + "  " + (certCode.get(r.row.certification_id) || "?") +
    "   status=" + r.row.status + " visibility=" + r.row.visibility +
    " is_exam_scope=" + r.row.is_exam_scope);
  for (const [, , field, from, to, why] of EDITS.filter((e) => e[0] === p && e[1] === lang)) {
    console.log("      " + field + "   (" + why + ")");
    console.log("        old  " + from);
    console.log("        new  " + to);
  }
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
    " items, no key moved, no option reordered, exam placement unchanged.");
  process.exitCode = 0; process.exit();
}

/* ---- write, read back, then the review rows ---- */
for (const [w, r] of resolved) {
  await patchWithRetry("quiz_questions?id=eq." + r.row.id, {
    question_text: r.next.question_text,
    options: r.next.options,
    explanation: r.next.explanation,
    /* Named rather than inherited. See the header. */
    status: r.row.status,
    visibility: r.row.visibility,
    is_exam_scope: r.row.is_exam_scope,
  });
  void w;
}

const ids = [...resolved.values()].map((r) => r.row.id);
const back = await getAllIn(KEY, "quiz_questions",
  "id,language,status,visibility,is_exam_scope,pool,question_text,options,correct_answer,explanation",
  "id", ids, "&order=id");
const backBy = new Map(back.map((r) => [r.id, r]));

const post = [];
for (const [w, r] of resolved) {
  const got = backBy.get(r.row.id);
  if (!got) { post.push(w + ": did not read back"); continue; }
  if (String(got.question_text || "") !== String(r.next.question_text || "")) post.push(w + ": stem did not land");
  if (String(got.explanation || "") !== String(r.next.explanation || "")) post.push(w + ": explanation did not land");
  if (JSON.stringify(got.options) !== JSON.stringify(r.next.options)) post.push(w + ": options did not land");
  if (JSON.stringify(got.correct_answer) !== JSON.stringify(r.row.correct_answer)) post.push(w + ": the KEY moved");
  for (const col of ["status", "visibility", "is_exam_scope", "pool"]) {
    if (String(got[col]) !== String(r.row[col])) post.push(w + ": " + col + " moved to " + got[col]);
  }
}
if (post.length) {
  console.error("");
  console.error("WROTE, BUT THE READ-BACK DISAGREES -- do not treat this as applied:");
  for (const x of post) console.error("  " + x);
  process.exitCode = 2; process.exit();
}
console.log("");
console.log("  read back: " + back.length + " of " + ids.length +
  " rows match the staged text, key unmoved, exam placement unchanged");

/* ---- provenance, one row per edited item, idempotent on (question_id, reviewer) ---- */
const enRows = await getAllIn(KEY, "quiz_questions",
  "id,question_group_id,language,question_text,options,correct_answer,explanation",
  "question_group_id", [...new Set([...resolved.values()].map((r) => r.row.question_group_id).filter(Boolean))],
  "&language=eq.en&order=id");
const enBy = new Map(enRows.map((r) => [r.question_group_id, r]));

const already = await getAllIn(KEY, "item_translation_reviews", "question_id,reviewed_by", "question_id", ids);
const haveRow = new Set(already.filter((r) => r.reviewed_by === REVIEWER).map((r) => r.question_id));

const reviews = [];
for (const [w, r] of resolved) {
  if (haveRow.has(r.row.id)) continue;
  const en = enBy.get(r.row.question_group_id);
  if (!en) { console.log("  no English sibling for " + w + " -- review row skipped, reported"); continue; }
  const got = backBy.get(r.row.id);
  reviews.push({
    question_id: r.row.id,
    reviewed_by: REVIEWER,
    en_hash: itemHash8(en),
    tr_hash: itemHash8(got),
    tr_hash_basis: "assumed",
    /* `approved`, because the vocabulary is exactly approved|rejected -- read from
     * `itr_verdict_check` rather than guessed. My first run sent "corrected" and took a 23514 AFTER
     * the text edits had already landed and read back, which is the wrong order: the write that can
     * fail on a closed vocabulary should be validated before the write that cannot be undone.
     * The correction itself is in the note; the verdict is the state the row is now in. */
    verdict: "approved",
    note: NOTE,
  });
}
let inserted = 0;
if (reviews.length) {
  const res = await fetch(REST + "item_translation_reviews", {
    method: "POST", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(reviews),
  });
  if (!res.ok) {
    console.error("review rows FAILED: " + res.status + " " + (await res.text()).slice(0, 300));
    console.error("The text edits ARE applied and read back. Only the provenance rows are missing.");
    process.exitCode = 2; process.exit();
  }
  inserted = (await res.json()).length;
}
const finalRows = await getAllIn(KEY, "item_translation_reviews",
  "question_id,reviewed_by,verdict,tr_hash_basis", "question_id", ids);
const mine = finalRows.filter((r) => r.reviewed_by === REVIEWER);
console.log("  provenance: " + inserted + " review row(s) inserted, " + mine.length +
  " of " + ids.length + " edited items now carry one from this reviewer");
console.log("");
console.log("APPLIED: " + EDITS.length + " field edits across " + resolved.size + " items (" +
  langs.join(", ") + "), siblings untouched.");
