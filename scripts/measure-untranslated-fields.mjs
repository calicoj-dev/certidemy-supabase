#!/usr/bin/env node
/**
 * measure-untranslated-fields.mjs -- how many non-English rows carry ENGLISH text, per field.
 *
 * READ-ONLY. No writes, no model calls. Unknown flags exit 2.
 *
 * Ruled PROMPT-99 s1a: *"Count every row bank-wide where `language` != `en` but `explanation` is English...
 * Use the same English-detection the lint uses. Do the same for the stem and options."*
 *
 * ============ THE LINT HAS NO ENGLISH DETECTION, AND SAYING SO IS PART OF THE ANSWER ============
 *
 * `lint-translation-terms.mjs` checks glossary terms and modal fidelity. The nearest thing is
 * `lib/language-guard.mjs`, and it answers a DIFFERENT question: `looksLikeLanguage(text, lang)` separates
 * Spanish from Portuguese, by one half of each distinctive pair, and its own header says accents cannot do it
 * because both languages share them. Nothing in it distinguishes either from English.
 *
 * So there was nothing to reuse, and inventing a lexical English score as the primary test would be the
 * lexical-proxy defect this repository has paid for repeatedly. Two tests instead, strongest first:
 *
 *   IDENTICAL   the non-English field is byte-identical (whitespace-collapsed) to its English SIBLING's same
 *               field. This is not a guess: it is proof the field was never translated. No vocabulary, no
 *               threshold, no language model.
 *   MARKERS     the field differs from English but still scores as English on function words NEITHER Spanish
 *               NOR Portuguese has. Reported SEPARATELY and as CANDIDATES, never folded into the first
 *               number, because a count of a lexical class is a draft until somebody reads its members.
 *
 * A row with no English sibling is UNCOMPARABLE for the first test and is counted as its own state -- an
 * absence is not a pass.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

let JSON_OUT = null;
for (const a of process.argv.slice(2)) {
  const m = /^--json=(.+)$/.exec(a);
  if (m) { JSON_OUT = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". READ-ONLY. Known: --json=<file>.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KEY = requireKey(HERE);

const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();

/* ============ ENGLISH MARKERS: ONE HALF OF A DISTINCTIVE SET, LIKE language-guard DOES ============
 *
 * Every token here is a word English has and NEITHER Spanish NOR Portuguese does. Deliberately NOT included:
 * `a` (an article in both), `o`/`os`/`as`, `no` (Spanish), `e`/`de`/`en`/`para`/`por`/`un`/`sin` -- a marker a
 * language shares with its neighbour is noise both sides score on.
 *
 * The threshold is a COUNT of distinct markers, not a ratio, because an explanation is short and a ratio over
 * a 20-word field swings on one token. Three distinct markers in a Spanish or Portuguese sentence does not
 * happen; one can (`the` appears in quoted English terms, `is` inside `ISO`-adjacent prose is excluded by the
 * word boundary). */
const EN_MARKERS = ["the", "and", "with", "that", "which", "this", "these", "those", "of", "is", "are",
  "was", "were", "be", "been", "it", "its", "they", "their", "there", "when", "where", "while", "because",
  "not", "but", "from", "into", "than", "then", "should", "shall", "must", "may", "can", "will", "would",
  "requires", "required", "ensure", "ensures", "answer", "option", "correct", "incorrect", "wrong"];
const MIN_MARKERS = 3;
function englishMarkerScore(text) {
  const t = " " + norm(text).toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ") + " ";
  const hit = new Set();
  for (const m of EN_MARKERS) if (t.includes(" " + m + " ")) hit.add(m);
  return hit;
}

/* CONTROLS, BOTH DIRECTIONS. A detector nobody proved could fire is a list of whatever it matched. */
{
  const cases = [];
  const ok = (w, p, d = "") => cases.push({ w, p, d });
  ok("real English explanation fires",
    englishMarkerScore("Generative AI generates text by predicting likely outputs, not by executing " +
      "arithmetic, so the analyst must verify the total.").size >= MIN_MARKERS);
  ok("real Spanish explanation does NOT fire",
    englishMarkerScore("La IA generativa genera texto prediciendo resultados probables, no ejecutando " +
      "aritmetica como lo haria una hoja de calculo.").size < MIN_MARKERS,
    [...englishMarkerScore("La IA generativa genera texto prediciendo resultados probables, no ejecutando " +
      "aritmetica como lo haria una hoja de calculo.")].join(","));
  ok("real Portuguese explanation does NOT fire",
    englishMarkerScore("A IA generativa gera texto prevendo saidas provaveis, nao executando aritmetica " +
      "como uma planilha faria.").size < MIN_MARKERS,
    [...englishMarkerScore("A IA generativa gera texto prevendo saidas provaveis, nao executando " +
      "aritmetica como uma planilha faria.")].join(","));
  /* A SPANISH SENTENCE QUOTING AN ENGLISH TERM MUST NOT FIRE -- the corpus is full of them. */
  ok("Spanish quoting an English term does not fire",
    englishMarkerScore('El rol de "Product Owner" y el "Sprint Review" se mantienen en ingles.').size <
      MIN_MARKERS);
  const bad = cases.filter((c) => !c.p);
  for (const c of bad) console.error("  CONTROL FAIL " + c.w + "  " + c.d);
  if (bad.length) { console.error("REFUSING: the English detector's controls fail."); process.exit(2); }
  console.log("English-marker controls: " + cases.length + " of " + cases.length + " pass  (threshold " +
    MIN_MARKERS + " distinct markers)");
}

const certs = await getAll(KEY, "certifications?select=id,code&order=code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const qs = await getAll(KEY, "quiz_questions?select=id,certification_id,language,pool,status," +
  "question_group_id,question_text,explanation,options&retired_at=is.null&order=id");
console.log("rows examined (unretired, all languages, all pools): " + qs.length.toLocaleString());

/* English sibling per group */
const enByGroup = new Map();
for (const q of qs) {
  if (q.language === "en" && q.question_group_id) enByGroup.set(q.question_group_id, q);
}
const optText = (o) => (o && (o.text ?? o.label ?? o)) || "";
const optsJoined = (q) => (Array.isArray(q.options) ? q.options.map(optText).join(" | ") : "");

const FIELDS = [
  ["explanation", (q) => q.explanation],
  ["stem", (q) => q.question_text],
  ["options", optsJoined],
];
const out = { identical: {}, markers: {}, uncomparable: {}, examined: 0, per_cert: {} };
const members = { identical: [], markers: [] };
for (const [name] of FIELDS) { out.identical[name] = 0; out.markers[name] = 0; out.uncomparable[name] = 0; }

for (const q of qs) {
  if (q.language === "en") continue;
  out.examined++;
  const en = q.question_group_id ? enByGroup.get(q.question_group_id) : null;
  const cert = codeOf.get(q.certification_id) || "?";
  for (const [name, get] of FIELDS) {
    const mine = norm(get(q));
    if (!mine) continue;
    if (!en) { out.uncomparable[name]++; continue; }
    const theirs = norm(get(en));
    if (theirs && mine === theirs) {
      out.identical[name]++;
      const k = cert + "|" + q.language + "|" + q.pool + "|" + q.status + "|" + name;
      out.per_cert[k] = (out.per_cert[k] || 0) + 1;
      if (members.identical.length < 400) {
        members.identical.push({ id: q.id, cert, language: q.language, pool: q.pool, status: q.status,
          field: name, head: mine.slice(0, 90) });
      }
      continue;
    }
    const sc = englishMarkerScore(mine);
    if (sc.size >= MIN_MARKERS) {
      out.markers[name]++;
      if (members.markers.length < 400) {
        members.markers.push({ id: q.id, cert, language: q.language, pool: q.pool, status: q.status,
          field: name, markers: [...sc].join(","), head: mine.slice(0, 90) });
      }
    }
  }
}

console.log("");
console.log("NON-ENGLISH ROWS EXAMINED   " + out.examined.toLocaleString());
console.log("");
console.log("IDENTICAL TO THE ENGLISH SIBLING -- proof the field was never translated:");
for (const [name] of FIELDS) console.log("  " + name.padEnd(12) + out.identical[name]);
console.log("");
console.log("ENGLISH BY MARKERS, differing from English -- CANDIDATES, not a verdict:");
for (const [name] of FIELDS) console.log("  " + name.padEnd(12) + out.markers[name]);
console.log("");
console.log("NO ENGLISH SIBLING (uncomparable for the identical test, counted as its own state):");
for (const [name] of FIELDS) console.log("  " + name.padEnd(12) + out.uncomparable[name]);

if (Object.keys(out.per_cert).length) {
  console.log("");
  console.log("IDENTICAL, by cert | language | pool | status | field:");
  for (const [k, n] of Object.entries(out.per_cert).sort((a, b) => b[1] - a[1]).slice(0, 40)) {
    console.log("  " + String(n).padStart(5) + "  " + k);
  }
}
const sample = (arr, n) => arr.slice(0, n);
if (members.markers.length) {
  console.log("");
  console.log("MARKER CANDIDATES, first 10 -- READ THESE before quoting the count:");
  for (const m of sample(members.markers, 10)) {
    console.log("  " + m.cert + " " + m.language + " " + m.pool + "/" + m.status + " " + m.field +
      " [" + m.markers + "]");
    console.log("      " + JSON.stringify(m.head));
  }
}
if (JSON_OUT) {
  writeFileSync(join(ROOT, JSON_OUT), JSON.stringify({ ...out, members }, null, 1) + "\n", "utf8");
  console.log("");
  console.log("wrote " + JSON_OUT + "   (the enumeration is the artifact; the count is commentary)");
}
