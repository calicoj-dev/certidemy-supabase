#!/usr/bin/env node
/**
 * verify-unaccent.mjs -- controls for accent-insensitive search.
 *
 * READ-ONLY against the deployed endpoint. Unknown flags exit 2.
 *
 *   --snapshot   record the CURRENT English results to disk. Run BEFORE
 *                deploying, so "English unchanged" is a comparison and not a
 *                recollection.
 *   (no flag)    run every control, including the English comparison if a
 *                snapshot exists.
 *
 * ============ WHY EQUALITY AND NOT NON-EMPTINESS ============
 *
 * A control written as "the unaccented query returns rows" would have PASSED
 * THE BROKEN STATE. `gestion` returned 5 rows where `gestion`-with-accent
 * returns 33 -- five is rows. The worst manifestation of this defect is
 * precisely the one a non-emptiness check cannot see, and it is worse than the
 * zeros because a short result looks like an answer.
 *
 * So every pair asserts the RESULT SETS ARE IDENTICAL: same count, same keys,
 * in the same order. Not "more than before". "More rows returned" is the
 * intended effect of the change and therefore cannot be the evidence that it
 * worked.
 *
 * ============ AND TWO NEGATIVES, BECAUSE WIDENING PASSES A ONE-SIDED CHECK ==
 *
 *   ABSENT       a term that is in no corpus must return ZERO from both forms.
 *                Otherwise "unaccent worked" is indistinguishable from "the
 *                matcher stopped discriminating".
 *
 *   NEAR-MISS    a word differing from a real term by MORE than accents --
 *                `gestor` against `gestion`-with-accent -- must NOT collapse
 *                into it. unaccent strips diacritics and nothing else, and a
 *                control should prove that rather than assume it.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--snapshot"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
}
const SNAPSHOT = process.argv.includes("--snapshot");
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
const SNAP = join(ROOT, "UNACCENT-ENGLISH-BASELINE.json");
const FN = "https://pctynukndxnmnxiqpgck.supabase.co/functions/v1/courseware-read";

/* Non-ASCII is CONSTRUCTED, never typed. A shell ate this exact word during
 * the investigation and produced a convincing false confirmation of a product
 * defect -- the fourth transport surprise of the week. */
const I = String.fromCharCode(0x00ED);   // i acute
const O = String.fromCharCode(0x00F3);   // o acute
const CED = String.fromCharCode(0x00E7); // c cedilla
const ATIL = String.fromCharCode(0x00E3); // a tilde

const PAIRS = [
  { cert: "AIMS-IA", lang: "es-419", accented: "auditor" + I + "a",      plain: "auditoria" },
  { cert: "AIMS-IA", lang: "es-419", accented: "gesti" + O + "n",        plain: "gestion" },
  { cert: "AIMS-IA", lang: "es-419", accented: "informaci" + O + "n",    plain: "informacion" },
  { cert: "ISMS-IA", lang: "pt-BR",  accented: "avalia" + CED + ATIL + "o", plain: "avaliacao" },
  { cert: "ISMS-IA", lang: "pt-BR",  accented: "se" + CED + ATIL + "o",  plain: "secao" },
];
/* A term in no corpus, in any language. Both forms must return zero. */
const ABSENT = "zzqxwv";
/* Differs from a real term by more than accents. Must not collapse into it. */
const NEAR_MISS = { cert: "AIMS-IA", lang: "es-419", a: "gestor", b: "gesti" + O + "n" };
const EN_CELLS = [
  { cert: "AIMS-IA", q: "audit" }, { cert: "ISMS-IA", q: "audit" },
  { cert: "AIMS-F", q: "audit" },  { cert: "AIGRM-I", q: "audit" },
  { cert: "AIMS-IA", q: "risk" },  { cert: "ISMS-IA", q: "control" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The body goes as a UTF-8 buffer; nothing non-ASCII passes through a shell. */
async function search(cert, lang, query) {
  for (let i = 0; i < 4; i++) {
    if (i > 0) await sleep(1200 * i * i);
    try {
      const r = await fetch(FN, {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8", "x-mcp-client": "verify-unaccent" },
        body: Buffer.from(JSON.stringify({ resource: "search", certification: cert, language: lang, limit: 50, query }), "utf8"),
        signal: AbortSignal.timeout(45000),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j && Array.isArray(j.rows)) {
        return { rows: j.rows.length, keys: j.rows.map((x) => x.kind + ":" + x.key) };
      }
      if (r.status >= 500) continue;
      return { rows: null, error: "HTTP " + r.status + " " + (j?.error ?? "") };
    } catch (e) { if (i === 3) return { rows: null, error: String(e).slice(0, 80) }; }
  }
  return { rows: null, error: "exhausted" };
}

let fail = 0;
const ok = (label, cond, detail) => {
  console.log("  " + (cond ? "PASS  " : "FAIL  ") + label + (detail ? "   " + detail : ""));
  if (!cond) fail++;
};
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

if (SNAPSHOT) {
  const out = {};
  for (const c of EN_CELLS) {
    const r = await search(c.cert, "en", c.q);
    out[c.cert + "|" + c.q] = r;
    await sleep(400);
  }
  writeFileSync(SNAP, JSON.stringify({ measured: new Date().toISOString(), cells: out }, null, 2), "utf8");
  console.log("");
  console.log("Wrote " + SNAP);
  console.log("  " + Object.entries(out).map(([k, v]) => k + "=" + v.rows).join("  "));
  console.log("");
  console.log("  Run WITHOUT --snapshot after deploying to compare.");
  process.exit(0);
}

console.log("");
console.log("VERIFY UNACCENT -- accent-insensitive search");
console.log("");
console.log("EQUALITY -- accented and unaccented must return the SAME SET");
console.log("  (non-emptiness would have passed the broken state: gestion returned 5 of 33)");
for (const p of PAIRS) {
  const a = await search(p.cert, p.lang, p.accented);
  await sleep(400);
  const b = await search(p.cert, p.lang, p.plain);
  await sleep(400);
  if (a.rows === null || b.rows === null) {
    ok(p.lang + " " + p.plain, false, "request failed: " + (a.error || b.error));
    continue;
  }
  ok(p.lang + " " + p.plain.padEnd(12) + " == accented",
     a.rows === b.rows && same(a.keys, b.keys),
     "accented " + a.rows + " rows, plain " + b.rows + " rows" +
     (a.rows === b.rows ? (same(a.keys, b.keys) ? ", identical keys" : ", SAME COUNT BUT DIFFERENT KEYS") : ""));
}

console.log("");
console.log("NEGATIVE -- the matcher must still discriminate");
for (const lang of ["en", "es-419", "pt-BR"]) {
  const r = await search("AIMS-IA", lang, ABSENT);
  await sleep(400);
  ok("absent term returns zero in " + lang, r.rows === 0,
     r.rows === null ? ("request failed: " + r.error) : (r.rows + " rows"));
}
{
  const a = await search(NEAR_MISS.cert, NEAR_MISS.lang, NEAR_MISS.a);
  await sleep(400);
  const b = await search(NEAR_MISS.cert, NEAR_MISS.lang, NEAR_MISS.b);
  await sleep(400);
  ok("a near-miss does not collapse into a real term",
     a.rows !== null && b.rows !== null && !same(a.keys, b.keys),
     "'" + NEAR_MISS.a + "' " + a.rows + " rows vs accented term " + b.rows + " rows");
}

console.log("");
console.log("ENGLISH UNCHANGED -- by count AND by ids");
if (!existsSync(SNAP)) {
  console.log("  UNASSERTED -- no baseline on disk. Run --snapshot BEFORE deploying.");
  console.log("  This is not a pass: without a before, 'unchanged' is a recollection.");
  fail++;
} else {
  const snap = JSON.parse(readFileSync(SNAP, "utf8"));
  console.log("  baseline measured " + snap.measured);
  for (const c of EN_CELLS) {
    const key = c.cert + "|" + c.q;
    const before = snap.cells[key];
    const after = await search(c.cert, "en", c.q);
    await sleep(400);
    if (!before) { ok(key, false, "not in the baseline"); continue; }
    ok(key.padEnd(20),
       before.rows === after.rows && same(before.keys, after.keys),
       before.rows + " -> " + after.rows +
       (before.rows === after.rows && same(before.keys, after.keys) ? ", identical" : "  CHANGED"));
  }
}

console.log("");
if (fail) { console.log("VERIFY UNACCENT FAILED (" + fail + ")."); process.exit(1); }
console.log("VERIFY UNACCENT PASSED. Accented and unaccented return the same set, the");
console.log("matcher still discriminates, and English is byte-identical to its baseline.");
