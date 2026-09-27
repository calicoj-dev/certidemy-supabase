#!/usr/bin/env node
/**
 * count-source-citations.mjs - per certification, how many live English secure items
 * cite a source we now HOLD, and how many cite one we still do not.
 *
 * READ-ONLY. No --apply, no --dry, unknown flags exit 2.
 *
 * ============ WHY THIS NUMBER IS THE ONE WORTH HAVING ============
 *
 * The grounded generator refuses to anchor an item in a source the library does not hold, and
 * `gateClauseExists` returns a THIRD state for an address in a document we do not have -- not a
 * pass, not a refusal. So before deciding which certifications the grounded path can reach, the
 * question is not "how good is the bank" but "how much of it rests on something we can check".
 *
 * ============ THE SURFACES SCANNED, AND WHY NOT THE DISTRACTORS ============
 *
 * The stem, the CORRECT option and the explanation. A distractor is supposed to be wrong, so
 * scanning it reports deliberate falsehoods as citations -- the defect that made a misattribution
 * sweep useless until it stopped reading every option.
 *
 * ============ AN INSTRUMENT MATCHES A NAME, NEVER A MEANING ============
 *
 * This counts items that NAME a source. It cannot tell whether the item is about that source, and
 * it cannot see an item that rests on a standard without naming it. Both limits are stated because
 * the number will be read as coverage, and it is not: it is a floor on how many items are
 * checkable and a floor on how many are not.
 *
 * `\bEBM\b` and `\bADA\b` are the two patterns at risk of matching something else, so every match
 * they produce is enumerated rather than counted -- this repository's rule that a count nobody has
 * read is reported as UNREAD.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY, no flags");
  process.exitCode = 2; process.exit();
}

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KEY = requireKey(HERE);

/* The four the director named, in his order. */
const CERTS = ["AIGRM-I", "AIHR-I", "AISM-I", "SPO-AI-I"];

/* ============ HELD IS READ FROM THE LIBRARY, NOT TYPED HERE ============
 *
 * A second list of what we hold would go stale the first time a source is bought, which is the
 * defect this whole repository is organised around. The patterns are the NAMES a bank uses for each
 * source; whether it is held is answered by SOURCE-PASSAGES.json. */
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const heldSources = new Set(lib.passages.map((p) => p.source_id));

const NAMED = [
  { name: "ISO/IEC 42001", re: /42001/ },
  { name: "ISO/IEC 27001", re: /27001/ },
  { name: "ISO/IEC 27002", re: /27002/ },
  { name: "ISO 19011", re: /19011/ },
  { name: "ISO/IEC 42006", re: /42006/ },
  { name: "ISO/IEC 17021-1", re: /17021/ },
  { name: "EU AI Act", re: /EU AI Act|Regulation \(EU\) 2024\/1689|Artificial Intelligence Act|AI Act\b/i },
  { name: "NIST AI RMF", re: /NIST|AI RMF/i },
  { name: "ITIL 4 Foundation", re: /ITIL/i },
  { name: "EBM Guide", re: /Evidence[- ]Based Management|\bEBM\b/ },
  { name: "Scrum Guide", re: /Scrum Guide/i },

  /* NOT HELD, and named by the director. Each is an instrument a live bank cites and no document on
   * disk contains, so an item resting on one cannot be anchored, cannot be gated, and cannot be
   * cleared -- it can only be read by a person. */
  { name: "NYC Local Law 144", re: /Local Law 144|\bLL ?144\b/i, unheld: true },
  { name: "Colorado SB 24-205", re: /SB ?24-?205|Colorado AI Act/i, unheld: true },
  { name: "ADA (Americans with Disabilities Act)", re: /\bADA\b|Americans with Disabilities/, unheld: true },
  /* Found by reading the members of the first run rather than predicted. */
  { name: "GDPR", re: /\bGDPR\b|Regulation \(EU\) 2016\/679/i, unheld: true },
  { name: "EEOC / Title VII", re: /\bEEOC\b|Title VII/i, unheld: true },
  { name: "ISO/IEC 23894", re: /23894/, unheld: true },
  { name: "ISO/IEC 42005", re: /42005/, unheld: true },
  { name: "ISO/IEC 38507", re: /38507/, unheld: true },
];

const isHeld = (n) => heldSources.has(n.name) && !n.unheld;

async function main() {
  console.log("");
  console.log("SOURCE CITATIONS IN LIVE ENGLISH SECURE ITEMS");
  console.log("  held per SOURCE-PASSAGES.json: " + [...heldSources].length + " source(s)");
  console.log("");

  const certRows = await getAll(KEY, "certifications?select=id,code");
  const idOf = new Map(certRows.map((c) => [c.code, c.id]));

  const report = [];
  const unheldExamples = new Map();
  for (const code of CERTS) {
    const id = idOf.get(code);
    if (!id) { console.log("  " + code.padEnd(10) + "NOT FOUND in certifications"); continue; }

    /* Live English secure items. `getAll` pages with `Range` and asserts its total against a
     * server-side count, so a short read cannot produce a number here. */
    const items = await getAll(KEY,
      "quiz_questions?select=id,question_text,explanation,options,correct_answer" +
      "&certification_id=eq." + id + "&language=eq.en&pool=eq.secure" +
      "&status=eq.approved&retired_at=is.null");

    let held = 0, unheld = 0, both = 0, neither = 0;
    const perSource = new Map();
    for (const q of items) {
      /* The stem, the KEY and the explanation. The key is found by id, the way score-mock-exam
       * reads it -- `correct_answer` is a string[] of option letters. */
      const keys = Array.isArray(q.correct_answer) ? q.correct_answer : [];
      const opts = Array.isArray(q.options) ? q.options : [];
      const keyText = opts.filter((o) => o && keys.includes(o.id)).map((o) => o.text || "").join(" ");
      const text = [q.question_text || "", keyText, q.explanation || ""].join(" \n ");

      let anyHeld = false, anyUnheld = false;
      for (const n of NAMED) {
        if (!n.re.test(text)) continue;
        perSource.set(n.name, (perSource.get(n.name) || 0) + 1);
        if (isHeld(n)) anyHeld = true;
        else {
          anyUnheld = true;
          if (!unheldExamples.has(n.name)) unheldExamples.set(n.name, []);
          const eg = unheldExamples.get(n.name);
          if (eg.length < 3) eg.push(code + "  " + String(q.question_text || "").replace(/\s+/g, " ").slice(0, 90));
        }
      }
      if (anyHeld && anyUnheld) both++;
      else if (anyHeld) held++;
      else if (anyUnheld) unheld++;
      else neither++;
    }

    console.log("  " + code.padEnd(10) + items.length + " live English secure item(s)");
    console.log("      cite a HELD source only      " + String(held).padStart(5));
    console.log("      cite an UNHELD source only   " + String(unheld).padStart(5));
    console.log("      cite BOTH                    " + String(both).padStart(5));
    console.log("      name no source at all        " + String(neither).padStart(5));
    const rows = [...perSource.entries()].sort((a, b) => b[1] - a[1]);
    for (const [name, n] of rows) {
      const nm = NAMED.find((x) => x.name === name);
      console.log("        " + (isHeld(nm) ? "held  " : "UNHELD") + "  " + name.padEnd(38) + String(n).padStart(5));
    }
    console.log("");
    report.push({ certification: code, items: items.length, held_only: held, unheld_only: unheld,
      both, no_source_named: neither, per_source: Object.fromEntries(rows) });
  }

  /* READ THE MEMBERS. Two of these patterns are short acronyms and the whole point of printing
   * examples is that somebody looks at what the number is made of. */
  console.log("  UNHELD MATCHES, read rather than counted:");
  if (!unheldExamples.size) console.log("    none");
  for (const [name, egs] of unheldExamples) {
    console.log("    " + name);
    for (const e of egs) console.log("      " + e);
  }

  console.log("");
  console.log("  An item naming only UNHELD instruments cannot be anchored, gated or cleared by");
  console.log("  the grounded path. It is not wrong; it is unverifiable by code, and the gate");
  console.log("  reports that as its own state rather than as a refusal.");

  writeFileSync(join(ROOT, "SOURCE-CITATION-COUNTS.json"),
    JSON.stringify({ measured: new Date().toISOString().slice(0, 10), certifications: report }, null, 1) + "\n", "utf8");
  console.log("");
  console.log("wrote SOURCE-CITATION-COUNTS.json");
  return 0;
}
process.exitCode = await main();
