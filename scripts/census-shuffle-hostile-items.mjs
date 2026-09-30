#!/usr/bin/env node
/**
 * census-shuffle-hostile-items.mjs -- live items whose options must NEVER be reordered.
 *
 * READ-ONLY. No writes, no marking, no flag set anywhere. Unknown flags exit 2.
 *
 * Ruled PROMPT-95 addendum: count these across all twelve certifications and list ten examples. The director
 * has NOT authorised a detector that marks items on its own, so this counts and shows and stops.
 *
 * ============ FIVE CLASSES, AND THEY ARE NOT EQUALLY RELIABLE ============
 *
 *   all-of-the-above     "All of the above" is only true in the position it was written for. Lexical and
 *                        near-certain.
 *   none-of-the-above    same. Lexical and near-certain.
 *   combination          "Both A and B", "A and C only" -- names other options by letter. Lexical.
 *   cross-reference      an option naming another option: "unlike option B, this ...". Lexical.
 *   ordered-scale        every option is a value on ONE dimension -- 30/60/90 days, monthly/quarterly/
 *                        annually. THIS IS THE UNRELIABLE ONE and it is judged on the option SET, never on
 *                        one option: an option containing a number is not a scale, and a detector that
 *                        thought so would fire on most of an ISO bank.
 *
 * Three languages are counted because the addendum's second question is about translations, and a Spanish
 * row saying "Todas las anteriores" is the same defect in a row the English detector cannot see.
 *
 * ============ WHAT A CLEAN RESULT WOULD MEAN ============
 *
 * Nothing, unless the detector can fire. So a POSITIVE CONTROL runs first on synthetic items of each class,
 * and the census refuses to print a count if any control fails -- a zero from a dead detector reads exactly
 * like a zero from a clean bank.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none. This script marks nothing.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));

/* ---------------------------------------------------------------- the detectors */
const ABOVE = {
  en: /\ball\s+of\s+the\s+above\b/i,
  es: /\btodas\s+las\s+(?:anteriores|opciones\s+anteriores)\b/i,
  pt: /\btodas\s+as\s+(?:anteriores|op[cç][õo]es\s+anteriores)\b/i,
};
const NONE = {
  en: /\bnone\s+of\s+the\s+above\b/i,
  es: /\bninguna\s+de\s+las\s+(?:anteriores|opciones)\b/i,
  pt: /\bnenhuma\s+das\s+(?:anteriores|op[cç][õo]es)\b/i,
};
/* "Both A and B", "A and C only", "both of the above" */
const COMBO = [
  /\bboth\s+\(?[A-D]\)?\s+and\s+\(?[A-D]\)?\b/i,
  /\b\(?[A-D]\)?\s+and\s+\(?[A-D]\)?\s+only\b/i,
  /\bboth\s+of\s+the\s+above\b/i,
  /\b(?:tanto|ambas)\s+\(?[A-D]\)?\s+(?:como|y|e)\s+\(?[A-D]\)?\b/i,
];
/* an option naming ANOTHER option by letter. The same boundary lesson as the explanation gate: the letter
 * must be a standalone token, or `option confining` matches. */
const CROSSREF = /\b(?:option|opci[oó]n|op[cç][aã]o)s?\s*\(?\s*([A-D])(?![A-Za-z])(?!\.\d)/i;

/* ---- ordered scale: judged on the SET ----
 * Every option must reduce to a value on one dimension. Three dimensions are declared; a set mixing them is
 * not a scale. An option carrying prose as well as a value is not a bare value and disqualifies the set --
 * "Within 30 days of the change" is a requirement, not a point on a scale. */
const FREQ = ["daily", "weekly", "monthly", "quarterly", "annually", "yearly", "biannually",
  "diario", "semanal", "mensual", "trimestral", "anual", "semestral",
  "diaria", "semanalmente", "mensalmente", "trimestralmente", "anualmente"];
const DURATION_UNIT = /\b(second|minute|hour|day|week|month|year|dia|d[ií]as|semana|mes|meses|a[nñ]o|ano)s?\b/i;
const isBareNumber = (t) => /^[^0-9]{0,6}[0-9][0-9.,]*\s*(%|percent|por\s*ciento)?[^0-9a-z]{0,3}$/i.test(t.trim());
const isDuration = (t) => {
  const s = t.trim();
  if (s.split(/\s+/).length > 4) return false;          /* prose, not a value */
  return /[0-9]/.test(s) && DURATION_UNIT.test(s);
};
const isDate = (t) => /^\s*(?:[0-9]{4}|[0-9]{1,2}[\/-][0-9]{1,2}[\/-][0-9]{2,4})\s*$/.test(t.trim());
const isFreq = (t) => {
  const s = t.trim().toLowerCase().replace(/[.,;]$/, "");
  if (s.split(/\s+/).length > 3) return false;
  return FREQ.some((f) => s.includes(f));
};
function orderedScale(texts) {
  if (texts.length < 3) return null;                     /* two values are not a scale worth protecting */
  const dims = [
    ["number", texts.every(isBareNumber)],
    ["duration", texts.every(isDuration)],
    ["date", texts.every(isDate)],
    ["frequency", texts.every(isFreq)],
  ].filter(([, v]) => v).map(([k]) => k);
  return dims.length === 1 ? dims[0] : null;
}

function classify(options, lang) {
  const texts = (options || []).map((o) => String((o && o.text) || ""));
  const lk = lang === "es-419" ? "es" : lang === "pt-BR" ? "pt" : "en";
  const hits = [];
  for (const t of texts) {
    if (ABOVE[lk].test(t) || ABOVE.en.test(t)) { hits.push("all-of-the-above"); break; }
  }
  for (const t of texts) {
    if (NONE[lk].test(t) || NONE.en.test(t)) { hits.push("none-of-the-above"); break; }
  }
  for (const t of texts) {
    if (COMBO.some((re) => re.test(t))) { hits.push("combination"); break; }
  }
  for (const t of texts) {
    if (CROSSREF.test(t)) { hits.push("cross-reference"); break; }
  }
  const scale = orderedScale(texts);
  if (scale) hits.push("ordered-scale:" + scale);
  return hits;
}

/* ---------------------------------------------------------------- positive controls */
const CONTROLS = [
  { what: "all of the above", lang: "en", opts: ["A policy", "A register", "All of the above", "None"],
    expect: "all-of-the-above" },
  { what: "none of the above (es)", lang: "es-419",
    opts: ["Una politica", "Un registro", "Ninguna de las anteriores", "Otra"],
    expect: "none-of-the-above" },
  { what: "combination", lang: "en", opts: ["A only", "B only", "Both A and B", "Neither"],
    expect: "combination" },
  { what: "cross reference", lang: "en",
    opts: ["It records the scope", "Unlike option B, it records the roles", "It records both", "It records none"],
    expect: "cross-reference" },
  { what: "ordered scale, durations", lang: "en", opts: ["30 days", "60 days", "90 days", "180 days"],
    expect: "ordered-scale:duration" },
  { what: "ordered scale, frequencies", lang: "en", opts: ["Monthly", "Quarterly", "Annually"],
    expect: "ordered-scale:frequency" },
  { what: "ordered scale, bare numbers", lang: "en", opts: ["1", "2", "3", "4"],
    expect: "ordered-scale:number" },
];
const NEGATIVES = [
  { what: "ISO prose with a clause number is NOT a scale", lang: "en",
    opts: ["Clause 9.2.1 requires an audit programme", "Clause 6.1.3 requires risk treatment",
      "Clause 5.2 requires a policy", "Clause 4.1 requires context"] },
  { what: "one option with a number is NOT a scale", lang: "en",
    opts: ["Retain the results for 3 years", "Discard them after the audit", "Publish them",
      "Send them to the certification body"] },
  { what: "an option naming a CONTROL is not a cross reference", lang: "en",
    opts: ["Annex A control A.6.2.4", "Annex B guidance", "Clause 8.1", "Table A.1"] },
  { what: "durations mixed with prose are NOT a scale", lang: "en",
    opts: ["Within 30 days of the change being proposed", "60 days", "90 days", "Immediately"] },
];
console.log("POSITIVE AND NEGATIVE CONTROLS");
let ctlFail = 0;
for (const c of CONTROLS) {
  const hits = classify(c.opts.map((t) => ({ text: t })), c.lang);
  const ok = hits.includes(c.expect);
  console.log("  " + (ok ? "ok   " : "FAIL ") + c.what + (ok ? "" : "   got [" + hits.join(",") + "]"));
  if (!ok) ctlFail++;
}
for (const c of NEGATIVES) {
  const hits = classify(c.opts.map((t) => ({ text: t })), c.lang);
  const ok = hits.length === 0;
  console.log("  " + (ok ? "ok   " : "FAIL ") + c.what + (ok ? "" : "   fired [" + hits.join(",") + "]"));
  if (!ok) ctlFail++;
}
if (ctlFail) {
  console.error("\nNO COUNT PRINTED: " + ctlFail + " control(s) failed. A zero from a dead detector reads");
  console.error("exactly like a zero from a clean bank.");
  process.exitCode = 2;
  process.exit();
}
console.log("");

/* ---------------------------------------------------------------- the census */
const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&order=code");
const byClass = {}, byCert = {}, examples = [];
let items = 0, rows = 0;
for (const c of certs) {
  byCert[c.code] = { rows: 0, hits: 0 };
  for (const lang of ["en", "es-419", "pt-BR"]) {
    const qs = await getAll(KEY, "quiz_questions?select=id,question_text,options,pool,status,language" +
      "&certification_id=eq." + c.id + "&language=eq." + lang + "&retired_at=is.null&order=id");
    for (const q of qs) {
      rows++; byCert[c.code].rows++;
      const hits = classify(q.options, lang);
      if (!hits.length) continue;
      items++; byCert[c.code].hits++;
      for (const h of hits) byClass[h] = (byClass[h] || 0) + 1;
      if (examples.length < 200) {
        examples.push({ cert: c.code, lang, pool: q.pool, status: q.status, hits,
          stem: String(q.question_text || "").replace(/\s+/g, " ").slice(0, 90),
          opts: (q.options || []).map((o) => String(o.text || "").replace(/\s+/g, " ").slice(0, 60)) });
      }
    }
  }
}
console.log("LIVE ROWS EXAMINED (all 12 certifications, en + es-419 + pt-BR, not retired)");
console.log("  rows examined        " + rows);
console.log("  rows with a hit      " + items + "   (" + (rows ? (items / rows * 100).toFixed(2) : 0) + "%)");
console.log("");
console.log("BY CLASS");
for (const [k, v] of Object.entries(byClass).sort((a, b) => b[1] - a[1])) {
  console.log("  " + String(v).padStart(6) + "  " + k);
}
if (!Object.keys(byClass).length) console.log("  none");
console.log("");
console.log("BY CERTIFICATION");
for (const [k, v] of Object.entries(byCert).sort()) {
  if (!v.hits) continue;
  console.log("  " + k.padEnd(11) + v.hits + " of " + v.rows + " row(s)");
}
if (!Object.values(byCert).some((v) => v.hits)) console.log("  none");
console.log("");
console.log("EXAMPLES, up to 10 -- READ THESE, because every lexical count in this repository has been");
console.log("wrong on its first run and the ordered-scale class is the one to distrust:");
console.log("");
for (const e of examples.slice(0, 10)) {
  console.log("  [" + e.hits.join(", ") + "]  " + e.cert + " / " + e.lang + " / " + e.pool + " / " + e.status);
  console.log("    Q: " + e.stem);
  e.opts.forEach((t, i) => console.log("     " + String.fromCharCode(65 + i) + ") " + t));
  console.log("");
}
console.log("NOTHING WAS MARKED. No flag was written and no detector runs on its own -- ruled.");
