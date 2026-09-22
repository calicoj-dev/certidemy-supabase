#!/usr/bin/env node
/**
 * apply-reread-clearance.mjs - the 11-row re-read: 2 rewords, then clear.
 *
 * --apply to write. DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ WHAT THIS CLOSES ============
 *
 * The evaluacion and Secao pins edited 11 cleared rows, and migration 364
 * withheld every one of them until a human re-read it. That is the gate
 * working. 9 cleared unchanged; 2 needed a reword.
 *
 * ============ REWORD 1 - PRE-EXISTING, NOT FROM THE PIN ============
 *
 * AIMS-F `ai-risk-criteria` es-419: "deben soportar cuatro cosas". Spanish
 * `soportar` is to endure or withstand; `sustentar` is to support in the sense
 * of upholding. The pt-BR sibling already reads `sustentar`. The pin did not
 * introduce this and would never have surfaced it -- the row was only read
 * because an unrelated edit withheld it.
 *
 * THE RE-READ QUEUE IS THEREFORE A DETECTOR, not just a cost. An edit that
 * forces reviewed text back in front of a human finds defects that predate it.
 *
 * ============ REWORD 2 - A SOURCE-SHAPED DEFECT ============
 *
 * `consistent-repeatable-results`, BOTH LANGUAGES, the same misparse:
 *
 *   en  "what turns the assessment from an opinion into a method"
 *   es  "lo que convierte a la evaluacion de una opinion en un metodo"
 *   pt  "que transforma a avaliacao de uma opiniao em um metodo"
 *
 * English "turn X from Y into Z" has no Romance equivalent. Both translators
 * rendered it with the same structure, and in both the preposition reattaches:
 * it reads as "the assessment OF an opinion" -- a genitive that means nothing
 * here -- rather than "from an opinion". Nothing is mistranslated word for
 * word. The CONSTRUCTION is what fails.
 *
 * THIS IS NOT AN ENGLISH ERROR AND IT IS NOT TWO TRANSLATION ERRORS. It is one
 * source shape that traps both targets identically, which is why it survived
 * independent per-language review: each rendering is defensible alone, and the
 * tell is only visible when the two are read together showing the SAME
 * structural failure. A defect that appears in both languages is evidence
 * about the SOURCE CONSTRUCTION, the way a translation richer than its English
 * is evidence about the English.
 *
 * The repair drops the calque entirely rather than patching the preposition:
 * "deje de ser una opinion y pase a ser un metodo" / "deixar de ser uma
 * opiniao e passar a ser um metodo" -- the Romance way to say it.
 *
 * ============ SCOPE OF THE SPLICE ============
 *
 * The approved replacements end at "metodo". The rows continue ", y es la
 * propiedad que mas a menudo no se cumple" / ", e e a propriedade que mais
 * frequentemente nao e atendida" -- correct, carrying real meaning, and
 * untouched by the defect. The replacement is spliced over the calqued clause
 * only. A retranslation changes what the fix requires and nothing else; every
 * regenerated word is an unreviewed word.
 *
 * ============ AND THE pt ROW IS SERVING RIGHT NOW ============
 *
 * Only es-419 was withheld. Editing pt-BR withholds it too, so it is cleared
 * in the same pass -- 12 rows, not 11.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". DRY BY DEFAULT; --apply to write.");
    console.error("NOTE: some scripts here take --dry and are LIVE without it. This is not one.");
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");

const HERE = dirname(fileURLToPath(import.meta.url));
for (const p of [join(HERE, ".env"), join(HERE, "..", ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };

async function rest(path, init) {
  let last;
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(REST + "/" + path, {
        ...init, headers: { ...H, ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(60000),
      });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 220));
      return t ? JSON.parse(t) : null;
    } catch (e) { last = e; }
  }
  throw new Error(path + ": " + last?.message);
}
const rpc = (fn, args) => rest("rpc/" + fn, { method: "POST", body: JSON.stringify(args) });

async function allRows(path) {
  const out = []; let from = 0, total = null;
  for (;;) {
    let page = null;
    for (let i = 0; i < 8; i++) {
      try {
        const r = await fetch(REST + "/" + path, {
          headers: { ...H, Range: from + "-" + (from + 499), Prefer: "count=exact" },
          signal: AbortSignal.timeout(60000),
        });
        if (!r.ok) throw new Error("HTTP " + r.status + " " + (await r.text()).slice(0, 160));
        total = Number(String(r.headers.get("content-range") || "").split("/")[1]);
        page = await r.json(); break;
      } catch (e) { if (i === 7) throw e; }
    }
    out.push(...page);
    if (page.length < 500) break;
    from += 500;
  }
  if (!Number.isFinite(total)) throw new Error("no content-range on " + path);
  if (out.length !== total) throw new Error("PAGING INCOMPLETE on " + path + ": " + out.length + " of " + total);
  return out;
}

/* ------------------------------------------------------------- the rewords */
const REWORD = [
  {
    cert: "AIMS-F", slug: "ai-risk-criteria", language: "es-419", field: "description",
    kind: "pre-existing, surfaced by the re-read",
    anchor:  "deben soportar cuatro cosas",
    replace: "deben sustentar cuatro cosas",
  },
  {
    cert: "AIMS-F", slug: "consistent-repeatable-results", language: "es-419", field: "description",
    kind: "SOURCE-SHAPED: en 'turn X from Y into Z' has no Romance equivalent",
    anchor:  "Esto es lo que convierte a la evaluación de una opinión en un método",
    replace: "Esto es lo que hace que la evaluación deje de ser una opinión y pase a ser un método",
  },
  {
    cert: "AIMS-F", slug: "consistent-repeatable-results", language: "pt-BR", field: "description",
    kind: "SOURCE-SHAPED: the same misparse, independently produced",
    anchor:  "É isso que transforma a avaliação de uma opinião em um método",
    replace: "É isso que faz a avaliação deixar de ser uma opinião e passar a ser um método",
  },
];

/* Rows the re-read cleared unchanged. Named explicitly: a clearance that
 * enumerates what it cleared can be checked later; one that says "the rest"
 * cannot. */
const CLEARED_UNCHANGED = [
  ["AIMS-F", "es-419", "ai-risk-assessment"],
  ["AIMS-F", "es-419", "ai-system-impact-assessment"],
  ["AIMS-F", "es-419", "aims-scope"],
  ["AIMS-F", "es-419", "disclosure-difference"],
  ["AIMS-F", "es-419", "risk-identification-ai"],
  ["AIMS-F", "es-419", "risk-vs-impact-assessment"],
  ["ISMS-IA", "pt-BR", "ia-clause-order-carries-no-priority"],
  ["ISMS-IA", "pt-BR", "ia-requirement-to-evidence-link"],
  ["ISMS-IA", "pt-BR", "ia-who-monitors-and-who-evaluates"],
];

/* ------------------------------------------------------------------- read */
const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const idOfCode = new Map(certs.map((c) => [c.code, c.id]));
const concepts = await allRows("concepts?select=id,slug,certification_id,retired_at");
const trs = await allRows("concept_translations?select=id,concept_id,language,name,description,is_provisional,tr_hash,en_hash");

const conKey = new Map();
for (const c of concepts) conKey.set(codeOf.get(c.certification_id) + "|" + c.slug, c);
const trKey = new Map();
for (const t of trs) {
  const c = concepts.find((x) => x.id === t.concept_id);
  if (c) trKey.set(codeOf.get(c.certification_id) + "|" + t.language + "|" + c.slug, t);
}

/* ============ THE EXTRACTION MUST BE PROVED BEFORE IT IS TRUSTED ============
 * An anchor that matches nothing reports "already applied" and clears a row
 * nobody fixed. An anchor that matches twice edits a span nobody read. Both
 * are asserted, and a missing anchor is a REFUSAL, not a skip. */
const edits = [];
let alreadyApplied = 0;
for (const r of REWORD) {
  const row = trKey.get(r.cert + "|" + r.language + "|" + r.slug);
  if (!row) { console.error("REFUSING: no row for " + r.cert + " " + r.language + " " + r.slug); process.exit(2); }
  const text = String(row[r.field] ?? "");
  const n = text.split(r.anchor).length - 1;
  if (n === 0) {
    if (text.includes(r.replace)) { alreadyApplied++; console.log("  already applied: " + r.slug + " " + r.language); continue; }
    console.error("REFUSING: anchor not found and replacement not present -- " + r.slug + " " + r.language);
    console.error("  anchor: " + r.anchor);
    console.error("  text:   " + text.slice(0, 200));
    process.exit(2);
  }
  if (n > 1) {
    console.error("REFUSING: anchor appears " + n + " times in " + r.slug + " " + r.language + " -- ambiguous span");
    process.exit(2);
  }
  edits.push({ ...r, id: row.id, before: text, after: text.split(r.anchor).join(r.replace), tr_hash: row.tr_hash });
}

/* The full set to clear: every cleared row whose tr_hash is stale AFTER the
 * edits land. Computed from the named lists, never from "whatever is stale" --
 * a blanket re-stamp would silently clear a row nobody read. */
const toClear = [];
for (const [cert, language, slug] of CLEARED_UNCHANGED) {
  const row = trKey.get(cert + "|" + language + "|" + slug);
  if (!row) { console.error("REFUSING: no row for " + cert + " " + language + " " + slug); process.exit(2); }
  toClear.push({ cert, language, slug, id: row.id, reworded: false });
}
for (const e of edits) toClear.push({ cert: e.cert, language: e.language, slug: e.slug, id: e.id, reworded: true });

console.log("");
console.log("RE-READ CLEARANCE");
console.log("  rewords to apply      " + edits.length + (alreadyApplied ? "  (" + alreadyApplied + " already applied)" : ""));
console.log("  rows cleared unchanged " + CLEARED_UNCHANGED.length);
console.log("  rows to re-stamp      " + toClear.length);
console.log("");
for (const e of edits) {
  console.log("  " + e.cert + " " + e.language + "  " + e.slug);
  console.log("    " + e.kind);
  console.log("      - " + e.anchor);
  console.log("      + " + e.replace);
}

/* A checksum of every cleared row this pass must NOT alter. */
const ids = new Set(toClear.map((t) => t.id));
const untouched = trs.filter((t) => !ids.has(t.id)).sort((a, b) => a.id.localeCompare(b.id))
  .map((t) => t.id + "|" + t.name + "|" + t.description + "|" + t.tr_hash + "|" + t.is_provisional);
const untouchedHash = createHash("sha256").update(untouched.join("\n")).digest("hex").slice(0, 16);
console.log("");
console.log("  untouched-row checksum " + untouchedHash + " over " + untouched.length + " row(s)");

const servingBefore = trs.filter((t) => !t.is_provisional &&
  t.tr_hash === null).length; // placeholder, real count read from the view below

writeFileSync(join(HERE, "..", "REREAD-CLEARANCE-PLAN.json"), JSON.stringify({
  generated: "2026-09-22", rewords: edits.map((e) => ({ ...e, before: undefined })),
  clearedUnchanged: CLEARED_UNCHANGED, toClear: toClear.length, untouchedHash,
}, null, 2), "utf8");
console.log("  wrote REREAD-CLEARANCE-PLAN.json");

if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

/* ------------------------------------------------------------------ write */
console.log("");
console.log("APPLYING...");
for (const e of edits) {
  const back = await rest("concept_translations?id=eq." + e.id, {
    method: "PATCH", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ [e.field]: e.after }),
  });
  if (!back?.[0] || back[0][e.field] !== e.after) throw new Error("read-back mismatch on " + e.slug + " " + e.language);
  console.log("  reworded " + e.cert + " " + e.language + " " + e.slug);
}

/* RE-STAMP tr_hash. This is the clearance: the row content is now what a
 * human has read, so the stored hash may record it again. Each row is stamped
 * from ITS OWN current content, read back from the database after the edits --
 * never from the value this script computed before writing. */
const fresh = await allRows("concept_translations?select=id,name,description");
const freshBy = new Map(fresh.map((r) => [r.id, r]));
for (const t of toClear) {
  const row = freshBy.get(t.id);
  const h = await rpc("translation_hash", { p_a: row.name, p_b: row.description });
  const back = await rest("concept_translations?id=eq." + t.id, {
    method: "PATCH", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ tr_hash: h, is_provisional: false }),
  });
  if (!back?.[0] || back[0].tr_hash !== h) throw new Error("tr_hash did not land on " + t.slug + " " + t.language);
}
console.log("  re-stamped tr_hash on " + toClear.length + " row(s)");

/* -------------------------------------------------- the review rows */
/* The review table is certification+language grained, so every affected pair
 * gets a fresh row and its predecessor is SUPERSEDED rather than deleted --
 * the record of what was believed, and when, is the point of the table. */
const PAIRS = [["AIMS-F", "es-419"], ["AIMS-F", "pt-BR"], ["ISMS-IA", "pt-BR"]];
const CLAIM =
  "Re-read of the 11 rows withheld by migration 364 after the evaluacion and Secao-case pins. " +
  "9 cleared unchanged; 2 reworded. ai-risk-criteria es-419 `soportar` -> `sustentar` is PRE-EXISTING, " +
  "not introduced by the pin, and was surfaced only because an unrelated edit forced a re-read. " +
  "consistent-repeatable-results is a SOURCE-SHAPED defect: English `turn X from Y into Z` has no Romance " +
  "equivalent and both translators produced the same misparse, reading as `the assessment OF an opinion`. " +
  "Both languages repaired; the pt-BR row was serving and is included, making 12 rows not 11. " +
  "This clearance covers the re-read rows only -- it does not re-clear the certification.";

for (const [cert, lang] of PAIRS) {
  const en = await rpc("concept_en_hash", { p_cert: cert });
  const tr = await rpc("concept_tr_hash", { p_cert: cert, p_lang: lang });
  await rest("concept_translation_reviews?certification=eq." + cert +
             "&language=eq." + encodeURIComponent(lang) + "&superseded_at=is.null", {
    method: "PATCH",
    body: JSON.stringify({
      superseded_at: new Date().toISOString(),
      superseded_reason: "content changed by the 2026-09-22 re-read clearance; hashes re-stamped",
    }),
  });
  await rest("concept_translation_reviews", {
    method: "POST", headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      certification: cert, language: lang, verdict: "approved",
      seed: "2026-09-22-reread", sample_size: toClear.filter((t) => t.cert === cert && t.language === lang).length,
      population: concepts.filter((c) => c.certification_id === idOfCode.get(cert) && !c.retired_at).length,
      reviewed_on: "2026-09-22", reviewed_by: "claude-director",
      en_hash: en, tr_hash: tr, source_gate_ran: true,
      clearance_claim: CLAIM,
      found_by: "targeted re-read of rows withheld by the 364 tr_hash gate, not a sample",
      note: "Sample size here is the number of rows RE-READ, not a draw from the population.",
    }),
  });
  console.log("  review row written: " + cert + " " + lang + "  en=" + en + " tr=" + tr);
}

/* -------------------------------------------------------- post-conditions */
console.log("");
console.log("POST-CONDITIONS");
let fail = 0;
const ok = (l, c, d) => { console.log("  " + (c ? "PASS  " : "FAIL  ") + l + (d ? "   " + d : "")); if (!c) fail++; };

const after = await allRows("concept_translations?select=id,concept_id,language,name,description,is_provisional,tr_hash,en_hash");
const afterBy = new Map(after.map((r) => [r.id, r]));

/* Every cleared row's stored hash matches its content: nothing withheld. */
const stale = [];
for (const r of after) {
  if (r.is_provisional) continue;
  const h = await rpc("translation_hash", { p_a: r.name, p_b: r.description });
  if (h !== r.tr_hash) stale.push(r.id);
}
ok("no cleared row is withheld by a stale tr_hash", stale.length === 0, stale.length + " stale");

ok("every reworded row carries the new text",
   edits.every((e) => afterBy.get(e.id)?.[e.field] === e.after));

/* THE NEGATIVE HALF: the trailing clause the reword must NOT have removed. */
ok("the untouched trailing clause survived both rewords",
   edits.filter((e) => e.slug === "consistent-repeatable-results")
        .every((e) => {
          const t = afterBy.get(e.id)?.description ?? "";
          return t.includes("propiedad que más a menudo") || t.includes("propriedade que mais frequentemente");
        }));

/* THE CALQUE IS GONE FROM BOTH, which is the property the reword is for. */
ok("neither language still reads 'de una opinion en un metodo'",
   edits.filter((e) => e.slug === "consistent-repeatable-results").every((e) => {
     const t = afterBy.get(e.id)?.description ?? "";
     return !t.includes("de una opinión en un método") && !t.includes("de uma opinião em um método");
   }));

const untouchedAfter = after.filter((t) => !ids.has(t.id)).sort((a, b) => a.id.localeCompare(b.id))
  .map((t) => t.id + "|" + t.name + "|" + t.description + "|" + t.tr_hash + "|" + t.is_provisional);
ok("every row outside the clearance is byte-identical",
   createHash("sha256").update(untouchedAfter.join("\n")).digest("hex").slice(0, 16) === untouchedHash);

const live = await allRows("concept_translation_reviews?select=certification,language,verdict,seed,superseded_at&superseded_at=is.null");
ok("exactly one live review row per affected pair",
   PAIRS.every(([c, l]) => live.filter((r) => r.certification === c && r.language === l).length === 1));

console.log("");
if (fail) { console.error(fail + " post-condition(s) FAILED."); process.exit(1); }
console.log("Cleared. " + toClear.length + " row(s) re-stamped, " + PAIRS.length + " review row(s) written.");
