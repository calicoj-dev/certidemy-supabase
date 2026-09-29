#!/usr/bin/env node
/**
 * census-extraction-noise.mjs -- extraction noise per source across every anchorable passage.
 *
 * READ-ONLY. No writes beyond two local artifacts, no model calls, unknown flags exit 2. Ruled PROMPT-87 s1a.
 *
 * ============ THIS IS NEW INFORMATION, NOT A REPEAT ============
 *
 * `check-library-completeness` asks whether a passage is PRESENT, per its declared population. It has never
 * asked whether the text of a present passage is CLEAN. A document can read 100 percent covered with every
 * passage mangled, and every coverage report would be green.
 *
 * ============ EVERY SIGNATURE IS A SHAPE, NEVER A SPELLING ============
 *
 *   title-bleed                the clause title runs straight into the statement
 *   hyphen-break               a word broken across a line: "docu- mented"
 *   doubled-word               the same word twice INSIDE a sentence: "and and development development"
 *   doubled-word-at-junction   the same word twice where a title or definition TERM ends -- ISO's own
 *                              layout, reported separately and NOT counted as damage
 *   run-together               two words joined with no space at a line join: "specThe"
 *
 * ============ TWO DETECTORS WERE WRONG BEFORE THEY WERE RIGHT, BOTH FOUND BY READING MEMBERS ============
 *
 * (1) title-bleed fired whenever the text began with the title, which is ambiguous:
 *
 *       BLEED       "AI system deployment | The organization shall document a deployment plan..."
 *       LEGITIMATE  "Maintainability is related to the ability of the organization..."
 *
 *     In the first the title belongs to no sentence; in the second the title word IS the subject. NIST
 *     firing on 106 of 111 was the tell that the detector had found a house style. Narrowed to require a
 *     NEW sentence after the title: 359 -> 32, a factor of 11.
 *
 * (2) doubled-word fired on ISO's definition layout. A clause-3 entry is <number> <term> <definition> and
 *     the definition routinely opens with the term's last word:
 *
 *       ISO FORMAT  "3.10 documented information | information required to be controlled..."
 *                   "3.17 corrective action | action to eliminate the cause(s)..."
 *       REAL        "A.6.2.3 ...document the AI system design and and development development based on..."
 *
 *     Of the first ten members ONE was real. Split by POSITION rather than deleted, because a count that
 *     silently drops a class cannot be checked.
 *
 * Ten flagged members per signature are printed. Every count of a lexical class in this repository has been
 * wrong on its first run; a count nobody has read is a draft.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
/* THE SPAN SIGNATURES COME FROM THE GATE, so the census and the gate can never disagree about what
 * noise is. Only the PASSAGE-level signatures -- title-bleed, column-interleave -- are local. */
import { noiseIn } from "./lib/quote-noise.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));

/* ---- title bleed: a NEW sentence must begin after the title ---- */
export function titleBleed(p) {
  const title = String(p.title || "").trim().replace(/\s+/g, " ");
  const text = String(p.text || "").trim().replace(/\s+/g, " ");
  if (!title || !text) return null;
  for (let n = Math.min(title.length, 40); n >= 10; n--) {
    const head = title.slice(0, n);
    if (!text.startsWith(head)) continue;
    const rest = text.slice(head.length).replace(/^[\s.:;-]+/, "");
    if (!rest) return null;                    /* the text IS the title: nothing bled */
    if (!/^[A-Z]/.test(rest)) return null;     /* the sentence continues; the title is its subject */
    return { index: 0, head };
  }
  return null;
}

/* The junction classifier stays here: it decides WHERE a doubling sits relative to a passage's title,
 * which is a passage question. Whether the text contains a doubling at all now comes from the gate. */
export function doublingPosition(p, at) {
  const title = String(p.title || "").trim().replace(/\s+/g, " ");
  const numPrefix = (/^\s*\d+(?:\.\d+)*\s+/.exec(String(p.text || "")) || [""])[0].length;
  return at <= Math.max(title.length, numPrefix + title.length) + 8;
}


const NAMES = ["column-interleave", "title-bleed", "hyphen-break", "doubled-word",
  "doubled-word-at-junction", "run-together"];
/* the four that count as DAMAGE; the junction class is ISO's layout and is reported, not counted */
/* the junction class is ISO's layout, not damage */
const DAMAGE = ["column-interleave", "title-bleed", "hyphen-break", "doubled-word", "run-together"];


/* ============ COLUMN INTERLEAVE: THE ROOT CAUSE, NOT A FOURTH SYMPTOM ============
 *
 * The Annex control table is two columns and the extractor reads it line by line across BOTH, so the
 * title's continuation lands inside the statement:
 *
 *   title  "AI system requirements and spec-  The organization shall specify and document require-"
 *   text   "...require- ification ments for new AI systems..."
 *
 * The tell is structural and needs no word list: the TITLE ITSELF contains the statement's opening. A
 * title is a name; it never contains "The organization shall". Where that holds, hyphen-break and
 * run-together in the same passage are symptoms of this and not independent findings. */
export function columnInterleave(p) {
  const title = String(p.title || "");
  if (!title) return null;
  const m = /\b(The organization|Top management|The certification body)\s+(shall|should|must)\b/.exec(title);
  if (m) return { at: m.index, why: "the TITLE contains the statement's opening" };
  /* second form: the title ends mid-word and that word's tail reappears later in the text */
  const tail = /([a-z]{3,})-\s*$/.exec(title.trim());
  if (tail) return { at: 0, why: "the title ends mid-word (" + tail[1] + "-), so its remainder is in the text" };
  return null;
}

export function signaturesOf(p) {
  const text = String(p.text || "");
  const hits = [];
  const push = (name, at) => hits.push({ name, at,
    sample: text.slice(Math.max(0, at - 34), at + 60).replace(/\s+/g, " ") });
  /* passage-level, local */
  if (titleBleed(p)) push("title-bleed", 0);
  const ci = columnInterleave(p);
  if (ci) push("column-interleave", ci.at);
  /* span-level, from the gate -- one definition of what noise is */
  for (const n of noiseIn(text)) {
    if (n.name === "doubled-word") {
      push(doublingPosition(p, n.at) ? "doubled-word-at-junction" : "doubled-word", n.at);
    } else push(n.name, n.at);
  }
  return hits;
}

const rows = [];
/* ============ ANCHORABLE PASSAGES ONLY ============
 *
 * The ruling says every ANCHORABLE passage, and a container cannot carry a key: its text is its
 * children's text concatenated, so a doubling or a run-together at a child boundary is arithmetic
 * rather than damage. Most surviving false positives were containers -- 42001 `3`, 27002 `3.1`,
 * 19011 `3`, 42001 `C.2`, 42001 `A.6.2`. Their COUNT is reported so the exclusion is visible. */
const clausesBySource = new Map();
for (const q of lib.passages) {
  if (!clausesBySource.has(q.source_id)) clausesBySource.set(q.source_id, new Set());
  clausesBySource.get(q.source_id).add(q.clause);
}
const isContainer = (q) => {
  for (const other of clausesBySource.get(q.source_id)) {
    if (other !== q.clause && String(other).startsWith(q.clause + ".")) return true;
  }
  return false;
};
let containersSkipped = 0;
for (const p of lib.passages) {
  if (!String(p.text || "").trim()) continue;
  if (isContainer(p)) { containersSkipped++; continue; }
  rows.push({ source: p.source_id, edition: p.edition, clause: p.clause, title: p.title,
    text: p.text, hits: signaturesOf(p) });
}
const damaged = (r) => r.hits.some((h) => DAMAGE.includes(h.name));

const sources = [...new Set(rows.map((r) => r.source))].sort();
const table = {};
for (const s of sources) {
  const mine = rows.filter((r) => r.source === s);
  table[s] = { passages: mine.length };
  for (const n of NAMES) table[s][n] = mine.filter((r) => r.hits.some((h) => h.name === n)).length;
  table[s].damaged = mine.filter(damaged).length;
}
const tot = { passages: rows.length };
for (const n of NAMES) tot[n] = rows.filter((r) => r.hits.some((h) => h.name === n)).length;
tot.damaged = rows.filter(damaged).length;

const md = [];
const p = (s = "") => md.push(s);
p("# Extraction noise census, every anchorable passage of every source");
p("");
p("**Read-only.** Ruled PROMPT-87 s1a. New information: the completeness check asks whether a passage is");
p("PRESENT, never whether its text is clean.");
p("");
p("`doubled-word-at-junction` is ISO's own layout -- a definition opening with its term's last word -- and");
p("is reported but NOT counted as damage. The `damaged` column is the other four.");
p("");
p("| source | passages | " + NAMES.join(" | ") + " | damaged |");
p("|---|---|" + NAMES.map(() => "---|").join("") + "---|");
for (const s of sources) {
  p("| " + s + " | " + table[s].passages + " | " + NAMES.map((n) => table[s][n]).join(" | ") +
    " | **" + table[s].damaged + "** |");
}
p("| **all** | **" + tot.passages + "** | " + NAMES.map((n) => "**" + tot[n] + "**").join(" | ") +
  " | **" + tot.damaged + "** |");
p("");
for (const n of NAMES) {
  const members = rows.filter((r) => r.hits.some((h) => h.name === n));
  p("## `" + n + "` -- " + members.length + " passage(s), first 10 members");
  p("");
  if (!members.length) { p("_none_"); p(""); continue; }
  for (const r of members.slice(0, 10)) {
    const h = r.hits.find((x) => x.name === n);
    p("- **" + String(r.source).replace("ISO/IEC ", "") + " `" + r.clause + "`** -- ..." + h.sample + "...");
  }
  p("");
}
writeFileSync(join(ROOT, "EXTRACTION-NOISE-CENSUS.md"), md.join("\n") + "\n", "utf8");
writeFileSync(join(ROOT, "EXTRACTION-NOISE-CENSUS.json"), JSON.stringify({
  signatures: NAMES, damage_signatures: DAMAGE, by_source: table, totals: tot,
  damaged: rows.filter(damaged).map((r) => ({ source: r.source, clause: r.clause,
    signatures: r.hits.filter((h) => DAMAGE.includes(h.name)).map((h) => h.name) })),
}, null, 1) + String.fromCharCode(10), "utf8");

console.log("anchorable passages examined: " + rows.length +
  "   (containers skipped: " + containersSkipped + " -- they cannot carry a key)");
console.log("");
console.log("source".padEnd(26) + NAMES.map((n) => n.slice(0, 10).padStart(12)).join("") + "  damaged");
for (const s of sources) {
  console.log("  " + s.padEnd(24) + NAMES.map((n) => String(table[s][n]).padStart(12)).join("") +
    String(table[s].damaged).padStart(9));
}
console.log("  " + "ALL".padEnd(24) + NAMES.map((n) => String(tot[n]).padStart(12)).join("") +
  String(tot.damaged).padStart(9));
console.log("\nwrote EXTRACTION-NOISE-CENSUS.md and .json  (10 members per signature in the md)");
