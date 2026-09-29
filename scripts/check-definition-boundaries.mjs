#!/usr/bin/env node
/**
 * check-definition-boundaries.mjs -- every clause-3 definition passage over 60 words, across all sources.
 *
 * READ-ONLY. Unknown flags exit 2. Ruled PROMPT-93 s3: "Any clause-3 definition passage over 60 words gets
 * its boundary checked before it is promoted or anchored."
 *
 * ============ WHY LENGTH IS THE TRIGGER AND NOT THE FINDING ============
 *
 * An ISO definition is one sentence plus its notes. A long clause-3 passage is therefore EVIDENCE that the
 * splitter kept reading past the entry's end and swallowed the entries that follow -- not proof of it. Some
 * definitions genuinely carry several notes and an example.
 *
 * So this reports a SUSPECT list with the evidence that distinguishes the two, and the evidence is the
 * document's own numbering: a definition that has swallowed its neighbours contains a LATER clause-3 number
 * followed by a term. That is a positive signal, not a length heuristic, and it is what separates
 * "3.16 is 111 words of definition plus notes" from "3.16 ran into 3.17".
 *
 * This repository has paid three times for a cutoff chosen to reduce noise, so the 60 is stated as what it
 * is: a trigger for a look, never a verdict. Every passage over it is listed whatever the evidence says.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
/* IMPORTED, not reimplemented: a container is a structural fact about what the library holds, and this
 * module already answers it for the effective-primary count. Two copies would diverge. */
import { isContainer } from "./lib/effective-primary.mjs";
/* SHARED with promote-thin-maps-93.mjs. The two signals live in ONE module so a clause cannot be clean
 * here and swallowed at the gate. */
import { laterEntriesInside, ranPastClause3, headingsOfSource, definitionBoundaryControls }
  from "./lib/definition-boundary.mjs";
import { fileURLToPath } from "node:url";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". This script is READ-ONLY and takes none.");
  process.exit(2);
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const P = join(ROOT, "SOURCE-PASSAGES.json");
if (!existsSync(P)) {
  console.error("SOURCE-PASSAGES.json is absent. Build it with scripts/extract-source-passages.mjs.");
  process.exit(2);
}
const j = JSON.parse(readFileSync(P, "utf8"));
const all = j.passages || j.items || [];
const WORDS = 60;
const words = (t) => String(t || "").trim().split(/\s+/).filter(Boolean).length;

/* A clause-3 address: "3", "3.1", "3.1.2" -- and nothing else. A.3.1 is an annex control, not a definition. */
const isDef = (c) => /^3(?:\.[0-9]+)*$/.test(String(c || ""));

/* ---- the swallow test: does the text contain a LATER clause-3 number followed by a term? ----
 * ISO writes an entry as "3.17\nnonconformity\n..." and the extractor flattens that to "3.17 nonconformity".
 * A definition that stopped where it should cannot contain its successor's number in that position. A
 * cross-reference reads "(see 3.4)" or "3.4]" and is EXCLUDED, because a definition citing another is
 * normal and would otherwise make every entry suspect. */
const swallowed = (clause, text) => laterEntriesInside(clause, text);

/* ---- signal 2: did the passage run out of clause 3 altogether? ----
 * ASKED OF THE DOCUMENT, not guessed: a heading is <number> followed by the opening words of that
 * clause's own declared title, and the titles come from the library. A regex for "a digit then a
 * capitalised word" would fire on ordinary prose and on numbered lists. */
const headingsOf = (sourceKey) =>
  headingsOfSource(all.filter((p) => (p.source_id + "|" + (p.edition || "")) === sourceKey));
/* strictly LATER at the top level: 3.26 swallowing "4 Context" is the case, and a clause-3 sibling is
 * signal 1's business rather than this one's. */
const beyondClause3 = (clause, text, headings) => ranPastClause3(clause, text, headings);

/* every clause the library holds, per source -- the input isContainer needs */
const clausesBySource = new Map();
for (const p of all) {
  const k = p.source_id + "|" + (p.edition || "");
  if (!clausesBySource.has(k)) clausesBySource.set(k, new Set());
  clausesBySource.get(k).add(String(p.clause));
}
const headingCache = new Map();
const rows = [];
for (const p of all) {
  if (!isDef(p.clause)) continue;
  const n = words(p.text);
  if (n <= WORDS) continue;
  const sk = p.source_id + "|" + (p.edition || "");
  if (!headingCache.has(sk)) headingCache.set(sk, headingsOf(sk));
  const beyond = beyondClause3(p.clause, p.text, headingCache.get(sk));
  const container = isContainer(String(p.clause),
    clausesBySource.get(p.source_id + "|" + (p.edition || "")) || new Set());
  rows.push({ src: p.source_id, ed: p.edition || "", clause: p.clause, title: p.title || "",
    n, container, beyond, hits: swallowed(p.clause, p.text), text: p.text });
}
rows.sort((a, b) => b.n - a.n);

const defs = all.filter((p) => isDef(p.clause));
{
  const c = definitionBoundaryControls();
  const bad = c.filter((x) => !x.pass);
  console.log("BOUNDARY CONTROLS  " + (c.length - bad.length) + " of " + c.length + " pass");
  for (const x of bad) console.log("  FAIL " + x.what + "   " + x.detail);
  if (bad.length) { console.error("No list printed: the detector is broken."); process.exit(2); }
  console.log("");
}
console.log("CLAUSE-3 DEFINITION PASSAGES OVER " + WORDS + " WORDS");
console.log("  clause-3 passages held      " + defs.length + " across " +
  new Set(defs.map((p) => p.source_id)).size + " source(s)");
console.log("  over " + WORDS + " words                " + rows.length +
  (defs.length ? "   (" + Math.round((rows.length / defs.length) * 100) + "%)" : ""));
const leaves = rows.filter((r) => !r.container);
console.log("  of those, CONTAINERS        " + rows.filter((r) => r.container).length +
  "   (a container legitimately holds its children's text, and the children are held separately too)");
console.log("  of those, LEAVES            " + leaves.length);
console.log("  LEAVES containing a later clause-3 entry     " + leaves.filter((r) => r.hits.length).length);
console.log("  LEAVES running out of clause 3 altogether    " + leaves.filter((r) => r.beyond.length).length +
  "   <- the signal my first version was blind to; it reported 42001 3.26 clean");
console.log("  LEAVES with EITHER signal                    " +
  leaves.filter((r) => r.hits.length || r.beyond.length).length + "   <- the list worth acting on");
console.log("");
console.log("  The " + WORDS + " is a TRIGGER FOR A LOOK, never a verdict. A definition may genuinely carry");
console.log("  several notes. The evidence that separates the two is the document's own numbering, shown as");
console.log("  SWALLOWED below: a later clause-3 number followed by a term, cross-references excluded.");
console.log("");
for (const r of rows) {
  console.log("  " + String(r.n).padStart(4) + "w  " + r.src + " " + r.ed + " :: " + r.clause +
    (r.title ? "  " + r.title : ""));
  if (r.container) {
    console.log("         CONTAINER -- holds " + r.hits.length + " child entr" +
      (r.hits.length === 1 ? "y" : "ies") + " by design; not a defect");
  } else if (r.hits.length || r.beyond.length) {
    if (r.beyond.length) {
      console.log("         RAN OUT OF CLAUSE 3 at: " + r.beyond[0] +
        (r.beyond.length > 1 ? "   (and " + (r.beyond.length - 1) + " heading(s) inside what follows)" : ""));
    }
  }
  if (!r.container && r.hits.length) {
    console.log("         SWALLOWED: " + r.hits.slice(0, 6).join(" | ") +
      (r.hits.length > 6 ? "  ... and " + (r.hits.length - 6) + " more" : ""));
  }
  if (!r.container && !r.hits.length && !r.beyond.length) {
    console.log("         a LEAF with no later entry inside it -- long, and not evidently a defect");
  }
}
console.log("");
/* a CONTAINER is excluded by construction, not by a judgement about its length */
const bad = rows.filter((r) => (r.hits.length || r.beyond.length) && !r.container);
if (bad.length) {
  console.log("BOUNDARY DEFECTS, " + bad.length + " -- each needs a per-passage override through the diff harness:");
  for (const r of bad) {
    console.log("  " + r.src + " :: " + r.clause + "   " + r.n + "w   " +
      (r.hits.length ? r.hits.length + " later clause-3 entr" + (r.hits.length === 1 ? "y" : "ies") : "") +
      (r.hits.length && r.beyond.length ? " AND " : "") +
      (r.beyond.length ? "ran out of clause 3 at \"" + r.beyond[0] + "\"" : ""));
  }
} else {
  console.log("No LEAF over " + WORDS + " words contains a later clause-3 entry. That is a statement about");
  console.log("THIS test -- a swallow the numbering does not reveal would not appear here.");
}
console.log("");
console.log("REPORT ONLY. Nothing is written. PROMPT-93 s3 fixes 3.16 and 3.26; the rest stand as a list.");
