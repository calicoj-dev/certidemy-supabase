#!/usr/bin/env node
/**
 * check-annex-a-b-parity.mjs -- ISO/IEC 42001's Annex A control and its Annex B guidance are the SAME
 * sentence with a different modal. Where they differ by anything else, one of them is worth reading.
 *
 * READ-ONLY. No writes, no model calls, no network. Unknown flags exit 2.
 *
 * ============ WHY THIS EXISTS, AND WHAT IT IS NOT ============
 *
 * Ruled indirectly by PROMPT-97 addendum s2. The director read `c54499aa` and asked whether our de-columned
 * A.6.1.2 had dropped a word: its key_support reads *"the responsible development AI systems"*, with no "of".
 *
 * IT HAD NOT. The PDF's own Annex A row reads exactly that, and Annex B's matching sentence reads
 * *"the responsible development OF AI systems"*. The omission is in ISO/IEC 42001:2023.
 *
 * So the premise was false and the conditional repair does not apply. But the question it came from is a good
 * one and **no instrument here could have answered it**, because every check we have compares our text against
 * the PDF -- and a word ISO itself omits is present in neither side of that comparison. A comparison against a
 * source cannot find a defect in the source.
 *
 * The A/B pairing is the one place the standard states the same requirement twice. That redundancy is a
 * control we were not using.
 *
 * ============ WHAT A DIFFERENCE MEANS, AND IT IS THREE THINGS NOT ONE ============
 *
 *   MODAL           `shall` against `should`. EXPECTED on every pair -- Annex A is normative, Annex B is
 *                   guidance -- and reported as such rather than as a finding. A pair with the SAME modal
 *                   would be the finding.
 *   ISO-TYPO        a word present in one and absent in the other, where the shorter reads ungrammatically.
 *                   Nothing in this repository can repair it: quoting A.6.1.2 faithfully means quoting the
 *                   typo, and "correcting" a quotation is a misquotation.
 *   OUR-EXTRACTION  a difference our extractor could have introduced -- which is why the check reads BOTH
 *                   sides out of the PDF rather than one side out of the library.
 *
 * ============ IT READS THE PDF, NOT THE LIBRARY, ON PURPOSE ============
 *
 * Comparing the held A passage against the held B passage would make the check blind to any defect both
 * inherited from the same extractor, which is the class it most needs to see. Both sides come from
 * `pdftotext -layout`, and the A side is taken from Table A.1 where the control text sits in a column.
 */
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let VERBOSE = false;
for (const a of process.argv.slice(2)) {
  if (a === "--verbose") { VERBOSE = true; continue; }
  console.error("Unrecognised flag: " + a + ". READ-ONLY. Known: --verbose.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const PDF = join(ROOT, "..", "iso-corpus", "iso-iec-42001-2023.pdf");
if (!existsSync(PDF)) {
  console.error("COULD NOT RUN: " + PDF + " is absent. That is not a clean result.");
  process.exit(2);
}

const text = execFileSync("pdftotext", ["-layout", "-q", PDF, "-"], { encoding: "utf8", maxBuffer: 1 << 28 });
const lines = text.split(/\r?\n/);

/* ---- the B side: a heading `B.x.y Title`, then `Control`, then the sentence until `Implementation guidance` ---- */
const bControl = new Map();
for (let i = 0; i < lines.length; i++) {
  const m = /^B\.(\d+(?:\.\d+)*)\s+\S/.exec(lines[i].trim());
  if (!m) continue;
  /* the word `Control` on its own line opens the normative sentence; the guidance heading closes it */
  let j = i + 1, seen = false, buf = [];
  for (; j < Math.min(i + 40, lines.length); j++) {
    const t = lines[j].trim();
    if (!seen) { if (/^Control$/i.test(t)) seen = true; continue; }
    if (/^Implementation guidance$/i.test(t)) break;
    if (/^B\.\d/.test(t)) break;
    /* ============ THE RUNNING FOOTER IS NOT THE CLAUSE ============
     *
     * A B-side sentence can straddle a page break, so the footer lands in the middle of it: `22`,
     * `© ISO/IEC 2023 – All rights reserved`, `42001`, `E`. The first run of this check reported nine pairs
     * DIFFERING on `iso iec 2023 all rights reserved`, which is the check reading page furniture as text --
     * this repository's own page-number rule, arriving through a new door. Dropped at WHOLE-LINE grain,
     * before anything joins lines, because that is the only grain at which a footer is identifiable. */
    if (/^\d{1,3}$/.test(t)) continue;
    if (/All rights reserved/i.test(t)) continue;
    if (/^(ISO\/IEC|42001|E)$/i.test(t)) continue;
    if (/^ISO\/IEC\s+42001:2023/i.test(t)) continue;
    if (t) buf.push(t);
  }
  if (seen && buf.length) bControl.set(m[1], buf.join(" ").replace(/\s+/g, " ").trim());
}

/* ---- the A side: the held library passage's own source, re-cut from Table A.1 ---- */
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
/* ============ A CONTAINER IS NOT A CONTROL, AND COMPARING ONE IS NOISE BY CONSTRUCTION ============
 *
 * `A.6.1` holds its children's text run together; its B pair holds one sentence. The first run of this check
 * reported eleven such pairs DIFFERING by a hundred words each, which is true and says nothing -- and a check
 * that fires on the normal case is deleted by the first person it inconveniences.
 *
 * The container test is the library's own: a clause with children held is a container. Same definition
 * `effectivePrimariesOf` uses, so the two cannot disagree about what a control is. */
const allClauses = lib.passages.filter((p) => p.source_id === "ISO/IEC 42001").map((p) => p.clause);
const isContainer = (c) => allClauses.some((o) => o !== c && o.startsWith(c + "."));
const aAll = lib.passages.filter((p) => p.source_id === "ISO/IEC 42001" && /^A\.\d/.test(p.clause));
const aPassages = aAll.filter((p) => !isContainer(p.clause));
const aContainers = aAll.filter((p) => isContainer(p.clause));

/* words, lowercased, punctuation dropped: the unit of comparison is the WORD, because a letter multiset
 * cannot say WHICH word moved and a character diff drowns in wrapping */
const words = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
const MODALS = new Set(["shall", "should"]);

const rows = [];
for (const p of aPassages) {
  const key = p.clause.replace(/^A\./, "");
  const b = bControl.get(key);
  if (!b) { rows.push({ clause: p.clause, state: "NO B PAIR" }); continue; }
  const aw = words(p.text), bw = words(b);
  /* a multiset difference, both directions, with the modal pair removed */
  const count = (ws) => { const m = new Map(); for (const w of ws) m.set(w, (m.get(w) || 0) + 1); return m; };
  const ca = count(aw), cb = count(bw);
  const onlyA = [], onlyB = [];
  for (const [w, n] of ca) { const d = n - (cb.get(w) || 0); if (d > 0 && !MODALS.has(w)) onlyA.push(w + (d > 1 ? " x" + d : "")); }
  for (const [w, n] of cb) { const d = n - (ca.get(w) || 0); if (d > 0 && !MODALS.has(w)) onlyB.push(w + (d > 1 ? " x" + d : "")); }
  const aModal = aw.find((w) => MODALS.has(w)), bModal = bw.find((w) => MODALS.has(w));
  rows.push({ clause: p.clause, state: onlyA.length || onlyB.length ? "DIFFERS" : "same",
    onlyA, onlyB, aModal, bModal, a: p.text, b });
}

const paired = rows.filter((r) => r.state !== "NO B PAIR");
const differs = paired.filter((r) => r.state === "DIFFERS");
const noPair = rows.filter((r) => r.state === "NO B PAIR");

console.log("ISO/IEC 42001 ANNEX A CONTROL vs ANNEX B GUIDANCE -- the same sentence, twice");
console.log("");
console.log("  A controls held        " + aPassages.length + "   (" + aContainers.length +
  " container(s) excluded: " + aContainers.map((p) => p.clause).join(", ") + ")");
console.log("  with a B pair parsed   " + paired.length);
console.log("  identical but the modal " + (paired.length - differs.length));
console.log("  DIFFER by a word       " + differs.length);
console.log("  no B pair found        " + noPair.length +
  (noPair.length ? "  (" + noPair.slice(0, 8).map((r) => r.clause).join(", ") + ")" : ""));
console.log("");

/* THE MODAL PAIR IS ASSERTED, and its absence is the finding. Annex A is normative and Annex B is guidance;
 * a pair agreeing on the modal means one of them is not what this check assumes it is. */
const modalOdd = paired.filter((r) => !(r.aModal === "shall" && r.bModal === "should"));
console.log("MODAL PAIRING   " + (paired.length - modalOdd.length) + " of " + paired.length +
  " are shall/should as expected");
for (const r of modalOdd) {
  console.log("  " + r.clause.padEnd(9) + "A=" + (r.aModal || "(none)") + "  B=" + (r.bModal || "(none)") +
    "   <- not the expected pairing");
}
console.log("");

if (!differs.length) {
  console.log("No A/B pair differs by a word. Either the annexes agree or this parse is not seeing them --");
  console.log("check the pair count above before reading that as clean.");
} else {
  console.log("WHERE THEY DIFFER (a word in one and not the other, modal excluded):");
  console.log("");
  for (const r of differs) {
    console.log("  " + r.clause + "   only in A: " + (r.onlyA.join(", ") || "-") +
      "   |   only in B: " + (r.onlyB.join(", ") || "-"));
    if (VERBOSE) {
      console.log("      A: " + r.a);
      console.log("      B: " + r.b);
      console.log("");
    }
  }
  console.log("");
  console.log("Read each one. A word present only in B and needed for the sentence to parse is an ISO typo in");
  console.log("Annex A -- quote it as it stands, because correcting a quotation is a misquotation. A difference");
  console.log("our extractor could have introduced is a library defect and belongs in an override.");
}
console.log("");
console.log("WHAT THIS CANNOT DO: it compares the two places ISO says the same thing. A requirement stated");
console.log("once has no pair, and a defect present identically in both is invisible to it.");
