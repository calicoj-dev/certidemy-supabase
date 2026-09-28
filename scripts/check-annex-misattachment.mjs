#!/usr/bin/env node
/**
 * check-annex-misattachment.mjs -- the two-direction witness over every annex-controlled standard we hold.
 *
 * READ-ONLY. No `--apply`. Unknown flags exit 2.
 *
 *   --out=ANNEX-MISATTACHMENT.md
 *
 * ============ WHAT A WITNESS IS, AND WHY EACH STANDARD NEEDS A DIFFERENT ONE ============
 *
 * An annex control's statement is paired with its number BY POSITION in a two-column table, so the failure
 * mode is off-by-one and it is invisible from the extraction alone: the address resolves, the gate passes,
 * and an item quotes the wrong requirement with the library agreeing.
 *
 * A witness is a SECOND DOCUMENT that restates the same control at the same number:
 *
 *   ISO/IEC 27001 Annex A   ->  ISO/IEC 27002's clause of the same number, in the guidance voice
 *   ISO/IEC 42001 Annex A   ->  ISO/IEC 42001's OWN Annex B, which restates each control as B.x.y
 *
 * The 42001 witness is the stronger of the two in one respect: it is the same document, so there is no
 * question of the two standards having drifted. It is weaker in another: Annex B is implementation
 * GUIDANCE, so it elaborates rather than repeats, and a low run against it means less than a low run
 * against 27002.
 *
 * ============ BOTH DIRECTIONS, ALWAYS ============
 *
 * Off-by-one has two directions and the first version of this check looked only forward, which made four
 * of 27001's six live failures read as UNDECIDED. Each control is scored against its own witness and
 * against both neighbours' witnesses; a neighbour beating it is the finding.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let OUT = "ANNEX-MISATTACHMENT.md";
for (const a of process.argv.slice(2)) {
  const m = /^--out=(.+)$/.exec(a);
  if (m) { OUT = m[1]; continue; }
  console.error("unknown flag " + JSON.stringify(a) + ". Known: --out=");
  console.error("READ-ONLY: it verifies an extraction and cannot change one.");
  process.exitCode = 2; process.exit();
}

/* Each subject declares where its witness lives. `sameDoc` means the witness is another annex of the same
 * standard, which changes how a weak match should be read -- stated per subject rather than assumed. */
const SUBJECTS = [
  {
    label: "ISO/IEC 27001:2022 Annex A",
    source: "ISO/IEC 27001", edition: "2022", prefix: "A.",
    witnessSource: "ISO/IEC 27002", witnessEdition: "2022", witnessPrefix: "",
    sameDoc: false,
    note: "27002 states each control at the same number with `should` for `shall`, so a correct statement " +
      "matches it almost word for word.",
  },
  {
    label: "ISO/IEC 42001:2023 Annex A",
    source: "ISO/IEC 42001", edition: "2023", prefix: "A.",
    witnessSource: "ISO/IEC 42001", witnessEdition: "2023", witnessPrefix: "B.",
    sameDoc: true,
    note: "Annex B restates each control as B.x.y, but as implementation GUIDANCE -- it elaborates rather " +
      "than repeats, so a low run is weaker evidence here than against 27002.",
  },
];

const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const norm = (s) => String(s || "").toLowerCase().replace(/\bshall\b/g, "should")
  .replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const runOf = (stmt, other) => {
  if (!other || !stmt) return 0;
  const a = norm(stmt).split(" "), b = norm(other).split(" ");
  const grams = new Set();
  for (let i = 0; i < b.length; i++) grams.add(b.slice(i, i + 4).join(" "));
  let best = 0;
  for (let i = 0; i < a.length; i++) {
    if (!grams.has(a.slice(i, i + 4).join(" "))) continue;
    let n = 4;
    while (i + n < a.length && grams.has(a.slice(i + n - 3, i + n + 1).join(" "))) n++;
    if (n > best) best = n;
  }
  return best;
};

const results = [];
for (const s of SUBJECTS) {
  const own = new Map(lib.passages
    .filter((p) => p.source_id === s.source && p.edition === s.edition &&
      new RegExp("^" + s.prefix.replace(".", "\\.") + "\\d+\\.\\d+$").test(String(p.clause)))
    .map((p) => [String(p.clause), p]));
  const wit = new Map(lib.passages
    .filter((p) => p.source_id === s.witnessSource && p.edition === s.witnessEdition)
    .map((p) => [String(p.clause), p]));
  const tail = (c) => c.slice(s.prefix.length);
  const witFor = (t) => wit.get(s.witnessPrefix + t);
  const shift = (c, d) => {
    const [g, n] = tail(c).split(".").map(Number);
    return n + d >= 1 ? s.prefix + g + "." + (n + d) : null;
  };

  const rows = [];
  for (const [clause, p] of own) {
    const w = witFor(tail(clause));
    if (!w) { rows.push({ clause, state: "NO WITNESS", own: null, nb: null }); continue; }
    const ro = runOf(p.text, w.text);
    const nb = [shift(clause, 1), shift(clause, -1)].filter(Boolean)
      .map((c) => ({ c, r: runOf(p.text, (witFor(tail(c)) || {}).text) }));
    const worst = nb.reduce((m, x) => (x.r > m.r ? x : m), { c: null, r: 0 });
    rows.push({
      clause, title: p.title, state: worst.r >= 6 && worst.r > ro ? "MISATTACHED" : "OK",
      own: ro, nb: worst.r, nbClause: worst.c,
    });
  }
  results.push({ subject: s, rows });
}

/* ---------------------------------------------------------------- live exposure */
const flagged = results.flatMap((r) => r.rows.filter((x) => x.state === "MISATTACHED")
  .map((x) => ({ source: r.subject.source, clause: x.clause })));

const KEY = requireKey(HERE);
let exposure = { item_grounding: [], task_sources: 0, drafts: [] };
if (flagged.length) {
  const clauses = [...new Set(flagged.map((f) => f.clause))];
  const ig = await getAll(KEY, "item_grounding?select=question_id,key_support_clause,source_id&order=question_id");
  exposure.item_grounding = ig.filter((r) => clauses.includes(String(r.key_support_clause)));
  const ts = await getAll(KEY, "task_sources?select=task_id,passage_id&order=task_id");
  const sp = await getAll(KEY, "source_passages?select=id,source_id,clause&order=id");
  const bad = new Set(sp.filter((p) => clauses.includes(String(p.clause))).map((p) => p.id));
  exposure.task_sources = ts.filter((t) => bad.has(t.passage_id)).length;
  if (exposure.item_grounding.length) {
    const ids = exposure.item_grounding.map((r) => r.question_id);
    const q = await getAll(KEY, "quiz_questions?select=id,status,pool,language&order=id");
    exposure.drafts = q.filter((r) => ids.includes(r.id));
  }
}

const md = [];
const p = (s = "") => md.push(s);
p("# Annex control misattachment: the two-direction witness");
p("");
p("`scripts/check-annex-misattachment.mjs`, read-only. Nothing was written.");
p("");
for (const r of results) {
  const ok = r.rows.filter((x) => x.state === "OK").length;
  const bad = r.rows.filter((x) => x.state === "MISATTACHED");
  const none = r.rows.filter((x) => x.state === "NO WITNESS");
  p("## " + r.subject.label);
  p("");
  p("Witness: **" + r.subject.witnessSource + " " + r.subject.witnessEdition +
    (r.subject.witnessPrefix ? " " + r.subject.witnessPrefix + "x.y" : " same number") + "**" +
    (r.subject.sameDoc ? " — the same document" : "") + ". " + r.subject.note);
  p("");
  p("| | |");
  p("|---|---|");
  p("| controls checked | " + (ok + bad.length) + " |");
  p("| OK | " + ok + " |");
  p("| **MISATTACHED** | **" + bad.length + "** |");
  p("| NO WITNESS (not scored, its own state) | " + none.length +
    (none.length ? " — " + none.map((x) => x.clause).join(", ") : "") + " |");
  p("");
  if (bad.length) {
    p("| control | title | own run | neighbour run | neighbour |");
    p("|---|---|---|---|---|");
    for (const x of bad) {
      p("| `" + x.clause + "` | " + (x.title || "-") + " | " + x.own + " | **" + x.nb + "** | " + x.nbClause + " |");
    }
  } else {
    p("No control matches a neighbour better than itself.");
  }
  p("");
  /* The distribution matters as much as the verdict: if most own-runs are low, the witness is weak here
   * and a clean result means less than it looks. */
  const scored = r.rows.filter((x) => x.own !== null);
  const lo = scored.filter((x) => x.own < 6).length;
  p("**How much the clean result is worth:** " + (scored.length - lo) + " of " + scored.length +
    " controls match their own witness at 6 or more words. " + lo + " match at fewer, where the witness " +
    "cannot confirm OR deny the attachment — for those the verdict is the absence of a better neighbour, " +
    "not positive agreement.");
  p("");
}
p("## Live exposure of anything flagged");
p("");
if (!flagged.length) {
  p("Nothing flagged, so nothing to expose.");
} else {
  p("| | |");
  p("|---|---|");
  p("| `item_grounding` rows anchored to a flagged clause | " + exposure.item_grounding.length + " |");
  p("| `task_sources` rows pointing at a flagged passage | " + exposure.task_sources + " |");
  p("| of those items, pending_review drafts | " + exposure.drafts.filter((d) => d.status === "pending_review").length + " |");
  p("| of those items, approved and live | " + exposure.drafts.filter((d) => d.status === "approved").length + " |");
}
p("");
writeFileSync(join(ROOT, OUT), md.join("\n") + "\n", "utf8");

console.log("ANNEX MISATTACHMENT WITNESS");
for (const r of results) {
  const ok = r.rows.filter((x) => x.state === "OK").length;
  const bad = r.rows.filter((x) => x.state === "MISATTACHED").length;
  const none = r.rows.filter((x) => x.state === "NO WITNESS").length;
  const scored = r.rows.filter((x) => x.own !== null);
  console.log("  " + r.subject.label.padEnd(30) + "OK " + String(ok).padStart(3) +
    "   MISATTACHED " + String(bad).padStart(2) + "   no witness " + none +
    "   own>=6: " + scored.filter((x) => x.own >= 6).length + "/" + scored.length);
  for (const x of r.rows.filter((y) => y.state === "MISATTACHED")) {
    console.log("      " + x.clause + ": own " + x.own + " against " + x.nb + " for " + x.nbClause);
  }
}
if (flagged.length) {
  console.log("  exposure: item_grounding " + exposure.item_grounding.length +
    ", task_sources " + exposure.task_sources +
    ", pending_review drafts " + exposure.drafts.filter((d) => d.status === "pending_review").length);
}
console.log("  wrote " + OUT);
