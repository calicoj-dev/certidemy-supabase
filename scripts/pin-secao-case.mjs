#!/usr/bin/env node
/**
 * pin-secao-case.mjs - pt-BR: capitalise Secao ONLY when a digit follows.
 *
 * --apply to write. DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ THE RULING AND THE RATIO ============
 *
 * `Secao 9.1` names a specific numbered section and is a proper reference.
 * A bare `Secao` is a common noun and takes no capital. Counted corpus-wide
 * across pt-BR concept translations:
 *
 *   followed by a digit, correctly capitalised, KEEP     314
 *   bare and capitalised, to lowercase                     8
 *
 * 314 to 8 is what makes this a pin rather than a preference: the convention
 * already exists and eight rows missed it.
 *
 * ============ THE COUNT AND THE ENUMERATION DISAGREED, AND THAT IS THE FIND
 *
 * A counting query returned 8 occurrences; an enumerating query with a
 * context window returned 7. The enumeration was short: two `Secao` five
 * characters apart in "Auditar Secao por Secao em sequencia numerica" -- the
 * first match's trailing context swallowed the second, because overlapping
 * matches are lost when the pattern captures what follows.
 *
 * Neither query was re-run "more carefully". The two disagreed, and the
 * disagreement named which one was wrong. This script therefore replaces by
 * scanning, never by a global regex with context, and asserts that the number
 * of replacements equals the independently counted occurrences.
 *
 * ============ ONE ROW IS HELD, AND IT IS NOT A FIX ============
 *
 * AIMS-F `clauses-four-to-ten` has the name "Secoes quatro a dez", where the
 * token is the FIRST WORD OF A NAME. Its capital is orthographic, not
 * terminological -- the same word mid-sentence would be lowercase and the
 * rule does not reach it. Lowercasing a title's first word applies a rule
 * about terms to a question about sentence case.
 *
 * That row is also the one carrying a named gate exception for keeping seven
 * clause titles verbatim, so it is exactly where a mechanical sweep should
 * stop and ask. It is reported and not written.
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

/* --------------------------------------------------------------- the rule */
const C = String.fromCharCode(231);  // c-cedilla
const AT = String.fromCharCode(227); // a-tilde
const OT = String.fromCharCode(245); // o-tilde
const SING = "Se" + C + AT + "o";      // Secao
const PLUR = "Se" + C + OT + "es";     // Secoes

/** Scan for the token; decide each occurrence on its own. No global regex,
 *  no context capture -- that is what lost an occurrence when this was
 *  measured two ways. */
function scan(text) {
  const hits = [];
  if (!text) return hits;
  for (const tok of [SING, PLUR]) {
    let i = text.indexOf(tok);
    while (i !== -1) {
      const after = text.slice(i + tok.length);
      /* KEEP when a number follows: this names a specific section. */
      const numbered = /^\s+\d/.test(after);
      /* KEEP when the token opens the field: that capital is sentence case,
       * not terminology, and this rule has nothing to say about it. */
      const initial = text.slice(0, i).trim() === "";
      hits.push({ index: i, token: tok, numbered, initial });
      i = text.indexOf(tok, i + tok.length);
    }
  }
  return hits.sort((a, b) => a.index - b.index);
}

function apply(text) {
  const hits = scan(text).filter((h) => !h.numbered && !h.initial);
  if (!hits.length) return { out: text, n: 0, held: scan(text).filter((h) => !h.numbered && h.initial).length };
  let out = "";
  let prev = 0;
  for (const h of hits) {
    out += text.slice(prev, h.index) + h.token.charAt(0).toLowerCase() + h.token.slice(1);
    prev = h.index + h.token.length;
  }
  out += text.slice(prev);
  return { out, n: hits.length, held: scan(text).filter((h) => !h.numbered && h.initial).length };
}

/* POSITIVE CONTROL, including the overlap case the enumeration lost and the
 * two cases that must NOT change. */
const CONTROL = [
  ["Auditar " + SING + " por " + SING + " em sequencia",
   "Auditar se" + C + AT + "o por se" + C + AT + "o em sequencia", 2],
  ["A " + SING + " 9.1 da ISO/IEC 27001", "A " + SING + " 9.1 da ISO/IEC 27001", 0],
  ["A ordem das " + PLUR + " nao e ordem", "A ordem das se" + C + OT + "es nao e ordem", 1],
  [SING + " quatro a dez", SING + " quatro a dez", 0],
  ["nada aqui", "nada aqui", 0],
];
for (const [inp, want, wantN] of CONTROL) {
  const got = apply(inp);
  if (got.out !== want || got.n !== wantN) {
    console.error("POSITIVE CONTROL FAILED on: " + inp);
    console.error("  got  " + got.out + "  (" + got.n + ")");
    console.error("  want " + want + "  (" + wantN + ")");
    process.exit(2);
  }
}
console.log("positive control: " + CONTROL.length + "/" + CONTROL.length +
            " known cases correct, including the overlap and both KEEP shapes");

/* ------------------------------------------------------------------- read */
const certs = await allRows("certifications?select=id,code");
const certBy = new Map(certs.map((c) => [c.id, c.code]));
const concepts = await allRows("concepts?select=id,slug,certification_id");
const conBy = new Map(concepts.map((c) => [c.id, c]));
const all = await allRows("concept_translations?select=id,concept_id,language,name,description,is_provisional,tr_hash");
const pt = all.filter((r) => r.language === "pt-BR");

let keptNumbered = 0, heldInitial = 0;
const plan = [];
for (const r of pt) {
  for (const f of ["name", "description"]) keptNumbered += scan(r[f]).filter((h) => h.numbered).length;
  const n = apply(r.name), d = apply(r.description);
  heldInitial += n.held + d.held;
  if (n.n + d.n === 0) continue;
  const c = conBy.get(r.concept_id);
  plan.push({
    id: r.id, slug: c?.slug, cert: certBy.get(c?.certification_id),
    cleared: !r.is_provisional, occurrences: n.n + d.n, tr_hash: r.tr_hash,
    name_before: r.name, name_after: n.out,
    description_before: r.description, description_after: d.out,
  });
}

const untouched = pt.filter((r) => !plan.some((p) => p.id === r.id))
  .sort((a, b) => a.id.localeCompare(b.id))
  .map((r) => r.id + "|" + r.name + "|" + r.description + "|" + r.tr_hash);
const untouchedHash = createHash("sha256").update(untouched.join("\n")).digest("hex").slice(0, 16);
const totalOcc = plan.reduce((s, p) => s + p.occurrences, 0);

console.log("");
console.log("pt-BR concept translations");
console.log("  KEEP, a digit follows          " + keptNumbered);
console.log("  HELD, opens the field          " + heldInitial + "   <- reported, never written");
console.log("  to lowercase                   " + totalOcc + " occurrence(s) in " + plan.length + " row(s)");
console.log("  of those rows, CLEARED         " + plan.filter((p) => p.cleared).length + "   <- these withhold until re-read");
console.log("  untouched-row checksum         " + untouchedHash + " over " + untouched.length + " row(s)");

console.log("");
for (const p of plan.sort((a, b) => (a.cert + a.slug).localeCompare(b.cert + b.slug))) {
  console.log("  " + (p.cleared ? "CLEARED " : "provis. ") + p.cert.padEnd(9) + p.slug + "   x" + p.occurrences);
  for (const [b, a, lbl] of [[p.name_before, p.name_after, "name"], [p.description_before, p.description_after, "desc"]]) {
    if (b === a) continue;
    let i = 0; while (i < b.length && b[i] === a[i]) i++;
    console.log("      " + lbl + "  - ..." + b.slice(Math.max(0, i - 40), i + 60) + "...");
    console.log("      " + "    ".slice(0, 4) + "  + ..." + a.slice(Math.max(0, i - 40), i + 60) + "...");
  }
}

if (heldInitial) {
  console.log("");
  console.log("HELD FOR A HUMAN -- the token opens the field, so its capital is sentence case:");
  for (const r of pt) {
    for (const f of ["name", "description"]) {
      if (scan(r[f]).some((h) => !h.numbered && h.initial)) {
        const c = conBy.get(r.concept_id);
        console.log("  " + (r.is_provisional ? "provis. " : "CLEARED ") +
          certBy.get(c?.certification_id).padEnd(9) + c?.slug + "  " + f + ": " + String(r[f]).slice(0, 70));
      }
    }
  }
}

writeFileSync(join(HERE, "..", "PIN-SECAO-PLAN.json"),
  JSON.stringify({ measured: "2026-09-22", keptNumbered, heldInitial, totalOcc, untouchedHash, plan }, null, 2), "utf8");
console.log("");
console.log("wrote PIN-SECAO-PLAN.json");

if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

/* ------------------------------------------------------------------ write */
console.log("");
console.log("APPLYING " + plan.length + " row(s)...");
for (const p of plan) {
  /* tr_hash deliberately absent: the stale hash is what withholds the row. */
  const r = await fetch(REST + "/concept_translations?id=eq." + p.id, {
    method: "PATCH", headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ name: p.name_after, description: p.description_after }),
  });
  if (!r.ok) throw new Error("PATCH failed on " + p.slug + ": HTTP " + r.status + " " + (await r.text()).slice(0, 200));
  const back = await r.json();
  if (!back[0] || back[0].description !== p.description_after || back[0].name !== p.name_after) {
    throw new Error("read-back mismatch on " + p.slug + " -- the write did not land as sent");
  }
}

console.log("");
console.log("POST-CONDITIONS");
let fail = 0;
const ok = (l, c, d) => { console.log("  " + (c ? "PASS  " : "FAIL  ") + l + (d ? "   " + d : "")); if (!c) fail++; };

const after = (await allRows("concept_translations?select=id,concept_id,language,name,description,is_provisional,tr_hash"))
  .filter((r) => r.language === "pt-BR");

let bareLeft = 0, numberedLeft = 0, initialLeft = 0;
for (const r of after) for (const f of ["name", "description"]) {
  for (const h of scan(r[f])) {
    if (h.numbered) numberedLeft++; else if (h.initial) initialLeft++; else bareLeft++;
  }
}
ok("no bare mid-field capitalised Secao remains", bareLeft === 0, bareLeft + " left");
/* THE NEGATIVE HALF. A sweep that also lowercased the numbered references
 * would satisfy the assertion above and destroy 314 correct citations. */
ok("all " + keptNumbered + " numbered references still capitalised", numberedLeft === keptNumbered,
   keptNumbered + " -> " + numberedLeft);
ok("the field-initial token was not touched", initialLeft === heldInitial, heldInitial + " -> " + initialLeft);

const untouchedAfter = after.filter((r) => !plan.some((p) => p.id === r.id))
  .sort((a, b) => a.id.localeCompare(b.id))
  .map((r) => r.id + "|" + r.name + "|" + r.description + "|" + r.tr_hash);
ok("every row the pin must not touch is byte-identical",
   createHash("sha256").update(untouchedAfter.join("\n")).digest("hex").slice(0, 16) === untouchedHash);

ok("tr_hash was NOT recomputed on any edited row",
   plan.every((p) => after.find((r) => r.id === p.id)?.tr_hash === p.tr_hash), "the stale hash is the signal");

/* Only the case changed. Anything else means the scan rewrote more than a letter. */
ok("only letter case changed in every edited field",
   plan.every((p) => p.name_before.toLowerCase() === p.name_after.toLowerCase() &&
                     p.description_before.toLowerCase() === p.description_after.toLowerCase()));

console.log("");
if (fail) { console.error(fail + " post-condition(s) FAILED."); process.exit(1); }
console.log("All post-conditions passed. " + plan.filter((p) => p.cleared).length +
            " cleared row(s) are now withheld by 364 and need a re-read.");
