#!/usr/bin/env node
/**
 * apply-hand-edits.mjs - apply a fixed list of literal string edits.
 *
 * `--apply` writes; DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ WHY THIS EXISTS RATHER THAN THE TRANSLATOR ============
 *
 * These are known strings, ruled on by hand. Routing them through
 * `retranslate-repaired-passages` would hand a settled decision back to a model
 * that can only introduce variance -- and in five of the ten cases the guard
 * that would gate the result is the same one that could not certify the line in
 * the first place.
 *
 * So: no model, no guards about WORDING. What is checked instead is that the
 * edit is the one that was asked for:
 *
 *   - the target lesson row exists, in that language
 *   - the `before` string occurs EXACTLY ONCE in the whole body
 *   - the `after` string is not already present (so a re-run is a no-op, not a
 *     double application)
 *   - and after the splice, `before` is gone and `after` is present
 *
 * The one-occurrence rule is the important one. A substring edit applied to a
 * body where it matches twice changes a line nobody looked at, and `content_md`
 * is long enough that nobody would notice.
 *
 * ============ THE THREE ATTRIBUTION EDITS ARE NOT COSMETIC ============
 *
 * A2, A3 and A5 restore a clause designation that the translation dropped. In
 * English those lead-ins attribute a quotation; in Spanish and Portuguese they
 * did not, so a quotation permitted under IP-POSITION section 6 was bare in two
 * of three languages. That is the "editorial half" of section 6 failing in
 * exactly the way section 6 says it can, on rows nothing mechanical was
 * watching -- which is why `check-attribution-parity.mjs` now exists.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--apply", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ".");
    console.error("--apply family: DRY BY DEFAULT. Known: " + [...KNOWN].join(", "));
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
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
async function req(method, path, body) {
  let last;
  for (let i = 0; i < 12; i++) {
    try {
      const r = await fetch(BASE + "/" + path, {
        method, headers: { ...H, ...(method === "PATCH" ? { Prefer: "return=representation" } : {}) },
        body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(60000),
      });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 200));
      return t ? JSON.parse(t) : null;
    } catch (e) { last = e; }
  }
  throw last;
}

/* ------------------------------------------------------------- the edits
 *
 * Ruled on by hand 2026-09-17. `id` is for the report only.
 *
 * A1 and A4 were reviewed and found CORRECT -- they are absent from this list
 * rather than present-and-skipped, so nothing here can apply them by accident.
 * B1 is likewise absent: its flagged modal renders "are not to be used", a
 * prohibition, and the inflation check misread a `can` elsewhere in the
 * paragraph.
 */
const EDITS = [
  /* ---- the three lost attributions ---- */
  { id: "A2", slug: "isms-ia-02-06-testing-the-programme", language: "pt-BR",
    why: "lost attribution: clause 9.2.2 dropped from the lead-in",
    before: "**E o requisito final:**",
    after: "**E o requisito final da cláusula 9.2.2:**" },
  { id: "A3", slug: "isms-ia-04-07-two-sentences", language: "pt-BR",
    why: "lost attribution: ISO/IEC 27001:2022 dropped from the lead-in",
    before: "Seu corpo normativo, na íntegra:",
    after: "Seu corpo normativo, na íntegra, tal como a ISO/IEC 27001:2022 o apresenta agora:" },
  { id: "A5", slug: "isms-ia-04-07-two-sentences", language: "es-419",
    why: "lost attribution: ISO/IEC 27001:2022 dropped from the lead-in",
    before: "Su cuerpo normativo, en su totalidad:",
    after: "Su cuerpo normativo, en su totalidad, tal como la recoge ahora la norma ISO/IEC 27001:2022:" },

  /* ---- the eight modal substitutions ---- */
  { id: "B2", slug: "02-07-roles-and-authorities", language: "pt-BR",
    why: "should -> deve; clause is advice",
    before: "deve ser aquela", after: "deveria ser aquela" },
  { id: "B3", slug: "05-06-certification-and-accreditation", language: "es-419",
    why: "should -> debe",
    before: "debe ser capaz", after: "debería ser capaz" },
  { id: "B4", slug: "05-06-certification-and-accreditation", language: "pt-BR",
    why: "should -> deve",
    before: "deve ser capaz", after: "deveria ser capaz" },
  { id: "B5", slug: "04-03-governing-apparatus-controls", language: "es-419",
    why: "should -> debe",
    /* NARROWED, not loosened. "debe tener" occurs once, but "deberia tener"
     * already appears elsewhere in the same body (the policy-review
     * paragraph), so the ambiguity guard refused -- correctly, since a body
     * holding both forms is one where a global replace could land on the wrong
     * instance if `before` were ever to match twice. Widening the target is the
     * fix; relaxing the guard would have been the other one. */
    before: "siete propiedades que debe tener este mecanismo",
    after: "siete propiedades que debería tener este mecanismo" },
  { id: "B6a", slug: "aims-ia-05-05-a-report-for-someone-not-in-the-room", language: "pt-BR",
    why: "clause 4.5 first should",
    before: "devem exercer", after: "deveriam exercer" },
  { id: "B6b", slug: "aims-ia-05-05-a-report-for-someone-not-in-the-room", language: "pt-BR",
    why: "clause 4.5 second should, same line",
    before: "não devem ser usadas", after: "não deveriam ser usadas" },
  { id: "B7", slug: "aims-ia-03-08-opening-and-closing", language: "es-419",
    why: "should -> debe, and restores the dropped `still`",
    before: "Lo que debe lograr", after: "Lo que aún debería lograr" },
  { id: "B8", slug: "aims-ia-03-08-opening-and-closing", language: "pt-BR",
    why: "should -> deve",
    before: "ainda deve alcançar", after: "ainda deveria alcançar" },

  /* ---- three MORE lost attributions, found by the parity sweep ----
   *
   * Not on the hand-ruled list: `check-attribution-parity.mjs` found them after
   * A2, A3 and A5 had been applied, which is the sweep doing what it was built
   * for. All three render an English clause number as a bare noun -- "a norma",
   * "el apartado", "a secao" -- so the designation the English lead-in carries
   * is absent in the translation and the quotation beneath it is unattributed.
   *
   * The English halves of two of these are attribution edits I made TODAY, so
   * the translation never had the number to keep: the re-translation ran against
   * the new English and rendered "clause 9.1" idiomatically. */
  { id: "C1", slug: "isms-ia-04-01-what-the-scope-left-out", language: "pt-BR",
    why: "parity sweep: clause 4.3 rendered as `a norma`; 6 quotes below it were unattributed",
    before: "É uma determinação que a norma exige que seja feita a partir de entradas declaradas:",
    after: "É uma determinação que a seção 4.3 exige que seja feita a partir de entradas declaradas:" },
  { id: "C2", slug: "isms-ia-04-06-defined-versus-running", language: "es-419",
    why: "parity sweep: clause 9.1 rendered as `el apartado`",
    before: "**Dos oraciones más cierran el apartado:**",
    after: "**Dos oraciones más cierran el apartado 9.1:**" },
  { id: "C3", slug: "isms-ia-04-06-defined-versus-running", language: "pt-BR",
    why: "parity sweep: clause 9.1 rendered as `a seção`",
    before: "**Mais duas frases encerram a seção:**",
    after: "**Mais duas frases encerram a seção 9.1:**" },
];

console.log("");
console.log("HAND EDITS -- literal strings, no model, no wording guards");
console.log("  " + EDITS.length + " edit(s) across " +
  new Set(EDITS.map((e) => e.slug + "|" + e.language)).size + " lesson row(s)");
console.log("  mode: " + (APPLY ? "APPLY" : "DRY"));
console.log("");

/* Group by row so two edits on one body are applied to one text and written
 * once -- computing both against the ORIGINAL and writing twice would have the
 * second discard the first. */
const byRow = new Map();
for (const e of EDITS) {
  const k = e.slug + "|" + e.language;
  byRow.set(k, (byRow.get(k) ?? []).concat([e]));
}

const problems = [];
const writes = [];
for (const [k, list] of byRow) {
  const [slug, language] = k.split("|");
  const rows = await req("GET", "lessons?select=id,slug,language,content_md&slug=eq." +
    slug + "&language=eq." + encodeURIComponent(language));
  if (!rows || rows.length !== 1) {
    problems.push(k + ": " + (rows?.length ?? 0) + " row(s) found, expected 1");
    continue;
  }
  let md = rows[0].content_md;
  const applied = [];
  let fail = null;
  for (const e of list) {
    const n = md.split(e.before).length - 1;
    if (n === 0) {
      if (md.includes(e.after)) { applied.push(e.id + " (already done)"); continue; }
      fail = e.id + ": `before` not found -- " + JSON.stringify(e.before.slice(0, 60));
      break;
    }
    if (n > 1) {
      fail = e.id + ": `before` occurs " + n + " times; a substring edit would change a line nobody read";
      break;
    }
    if (md.includes(e.after)) {
      fail = e.id + ": `after` already present while `before` still is -- ambiguous state";
      break;
    }
    md = md.replace(e.before, e.after);
    applied.push(e.id);
  }
  if (fail) { problems.push(k + ": " + fail); continue; }

  /* Post-condition per row, before anything is written. */
  for (const e of list) {
    if (md.includes(e.before) && e.before !== e.after) {
      problems.push(k + ": " + e.id + " -- `before` survives the splice");
    }
    if (!md.includes(e.after)) {
      problems.push(k + ": " + e.id + " -- `after` absent after the splice");
    }
  }
  if (md === rows[0].content_md) { console.log("  --   " + k + "   no change (" + applied.join(", ") + ")"); continue; }
  writes.push({ id: rows[0].id, k, md, applied });
  console.log("  ok   " + k + "   " + applied.join(", "));
}

console.log("");
if (problems.length) {
  console.log(problems.length + " PROBLEM(S). NOTHING WRITTEN.");
  for (const p of problems) console.log("  X " + p);
  process.exit(1);
}
console.log("rows to write: " + writes.length);

if (!APPLY) {
  console.log("");
  console.log("Dry run. Nothing written. Re-run with --apply.");
  process.exit(0);
}

for (const w of writes) {
  await req("PATCH", "lessons?id=eq." + w.id, { content_md: w.md });
}
console.log("");
console.log("wrote " + writes.length + " row(s)");

/* READ BACK. A PATCH that returned 200 is not evidence the text is there --
 * this repo's recurring failure mode is silent success, and the whole point of
 * a literal edit is that it can be verified exactly. */
let bad = 0;
for (const [k, list] of byRow) {
  const [slug, language] = k.split("|");
  const rows = await req("GET", "lessons?select=content_md&slug=eq." + slug +
    "&language=eq." + encodeURIComponent(language));
  const md = rows[0].content_md;
  for (const e of list) {
    if (!md.includes(e.after)) { console.log("  X READBACK " + e.id + ": `after` not in the stored row"); bad++; }
    if (e.before !== e.after && md.includes(e.before)) { console.log("  X READBACK " + e.id + ": `before` still in the stored row"); bad++; }
  }
}
console.log(bad === 0 ? "readback: all " + EDITS.length + " edit(s) present in the stored rows"
                      : "READBACK FAILED on " + bad + " check(s)");
process.exitCode = bad === 0 ? 0 : 1;
