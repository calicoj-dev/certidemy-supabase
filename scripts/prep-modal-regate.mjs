#!/usr/bin/env node
/**
 * prep-modal-regate.mjs -- build the inputs for re-gating the 30 provisional items with no model calls.
 *
 * READ-ONLY on the database; writes three local files. Unknown flags exit 2.
 *
 * WHAT IT BUILDS
 *
 *   ANCHOR-PARSE-AIMS-F-all-secure-modal.json   the merged pinned parse (re-run wins per item), with
 *                                               cc3d3b2a RE-ANCHORED to 42001 5.2 as ruled
 *   ANCHOR-OR-FLAG-AIMS-F-merged.json           the merged artifact, used ONLY as --reuse-solver input
 *   AIMSF-MODAL-SUBSET.txt                      the 30 provisional prefixes
 *
 * WHY A MERGED PARSE IS NEEDED. The 30 provisional items come from BOTH runs -- 22 decided by the
 * baseline and 8 by the re-run -- and each run wrote its own parse file. Pointing --pinned at either one
 * alone would silently skip the items it does not carry, and a subset run that quietly covers 22 of 30
 * is the short-read-as-complete shape this repository keeps paying for. Every requested prefix must be
 * present in the merged parse or this aborts.
 *
 * THE RE-ANCHOR IS DATA, NOT A GUESS. cc3d3b2a's key asserts that an AI policy is a REQUIRED management
 * system element. It was anchored at clause 1 (Scope), which carries no obligation, so the gate was
 * right that the anchor could not license the claim -- the anchor was simply the wrong sentence. 5.2's
 * lead-in is the requirement, and the new support is asserted to occur VERBATIM in the passage before it
 * is written, because an anchor that is not in its passage fails the verbatim gate for a new reason.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". This script takes none and writes only local files.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const RD = (n) => JSON.parse(readFileSync(join(ROOT, n), "utf8"));

const baseA = RD("ANCHOR-OR-FLAG-AIMS-F-all-secure.json");
const rerunA = RD("ANCHOR-OR-FLAG-AIMS-F-all-secure-rerun.json");
const baseP = RD("ANCHOR-PARSE-AIMS-F-all-secure.json");
const rerunP = RD("ANCHOR-PARSE-AIMS-F-all-secure-rerun.json");
const surv = RD("AIMSF-SURVIVORS.json");
const lib = RD("SOURCE-PASSAGES.json");

/* ---- the 30 provisional prefixes, taken from the reporter's own output rather than recomputed ---- */
const want = surv.provisional_ids || [];
if (!want.length) throw new Error("AIMSF-SURVIVORS.json lists no provisional items");
console.log("provisional items to re-gate: " + want.length);

/* ---- merged parse, re-run wins ---- */
const parses = { ...(baseP.parses || {}) };
for (const [k, v] of Object.entries(rerunP.parses || {})) parses[k] = v;

/* ---- the ruled re-anchor: cc3d3b2a -> 42001 5.2 ---- */
const TARGET = "cc3d3b2a";
const NEW_CLAUSE = "5.2";
const NEW_SUPPORT = "Top management shall establish an AI policy that:";
{
  const p52 = lib.passages.find((p) => /42001/.test(p.source_id) && p.clause === NEW_CLAUSE);
  if (!p52) throw new Error("42001 clause 5.2 is not in SOURCE-PASSAGES.json");
  const norm = (x) => String(x).replace(/\s+/g, " ").trim();
  if (!norm(p52.text).includes(norm(NEW_SUPPORT))) {
    throw new Error("the new support for " + TARGET + " does not occur verbatim in 42001 5.2 -- " +
      "writing it would fail the verbatim gate for a NEW reason and the re-gate would be unreadable");
  }
  if (!parses[TARGET]) throw new Error(TARGET + " has no pinned parse to re-anchor");
  const before = parses[TARGET];
  parses[TARGET] = {
    ...before,
    key_support_clause: NEW_CLAUSE,
    key_support: NEW_SUPPORT,
    re_anchored: {
      by: "director ruling 2026-09-29",
      from_clause: before.key_support_clause,
      from_support: before.key_support,
      why: "the key asserts that an AI policy is a REQUIRED management system element; clause 1 is " +
        "Scope and carries no obligation, so the gate was right about the anchor and the anchor was " +
        "the wrong sentence. 5.2's lead-in is the requirement.",
    },
  };
  console.log("re-anchored " + TARGET + ": clause " + before.key_support_clause + " -> " + NEW_CLAUSE);
  console.log("  new support verified verbatim in the passage");
}

/* every requested prefix must have a parse, or the re-gate silently covers fewer items */
const missing = want.filter((w) => !parses[w]);
if (missing.length) {
  console.error("ABORT: " + missing.length + " of " + want.length + " provisional item(s) have no " +
    "pinned parse: " + missing.slice(0, 8).join(", "));
  process.exit(2);
}
console.log("all " + want.length + " provisional items have a pinned parse");

writeFileSync(join(ROOT, "ANCHOR-PARSE-AIMS-F-all-secure-modal.json"), JSON.stringify({
  cert: "AIMS-F", model: baseP.model,
  recorded: baseP.recorded + " + " + rerunP.recorded + " (merged, re-run wins)",
  note: "A RECORD OF A PARSE, not a result. Merged from the baseline and the re-run, with cc3d3b2a " +
    "re-anchored to 42001 5.2 by director ruling 2026-09-29. --pinned re-gates from this, no model call.",
  parses,
}, null, 1) + String.fromCharCode(10), "utf8");
console.log("wrote ANCHOR-PARSE-AIMS-F-all-secure-modal.json  (" + Object.keys(parses).length + " parses)");

/* ---- merged artifact, for --reuse-solver only ---- */
const items = new Map();
for (const it of baseA.items) items.set(it.prefix, it);
for (const it of rerunA.items) items.set(it.prefix, it);
const withSolver = [...items.values()].filter((it) => it.solver).length;
writeFileSync(join(ROOT, "ANCHOR-OR-FLAG-AIMS-F-merged.json"), JSON.stringify({
  certification: "AIMS-F",
  note: "MERGED baseline + re-run, re-run wins per item. Used ONLY as --reuse-solver input so a " +
    "re-gate makes no model call. Not a result: read AIMSF-SURVIVORS.md for verdicts.",
  items: [...items.values()],
}, null, 1) + String.fromCharCode(10), "utf8");
console.log("wrote ANCHOR-OR-FLAG-AIMS-F-merged.json  (" + items.size + " items, " +
  withSolver + " carrying a solver verdict)");
const noSolver = want.filter((w) => !(items.get(w) || {}).solver);
if (noSolver.length) {
  console.log("  NOTE: " + noSolver.length + " provisional item(s) carry no recorded solver verdict, so " +
    "the re-gate will record them could-not-run rather than clearing them: " + noSolver.join(", "));
}

writeFileSync(join(ROOT, "AIMSF-MODAL-SUBSET.txt"),
  ["# the 30 provisional (modal-fidelity-only) AIMS-F items, re-gated 2026-09-29",
    "# gate fix: a list item's own `can` no longer preempts the lead-in `shall`",
    ...want.slice().sort()].join(String.fromCharCode(10)) + String.fromCharCode(10), "utf8");
console.log("wrote AIMSF-MODAL-SUBSET.txt  (" + want.length + " prefixes)");
if (!existsSync(join(ROOT, "AIMSF-MODAL-SUBSET.txt"))) throw new Error("the subset file was not written");
