#!/usr/bin/env node
/**
 * gen-task-source-read-sample.mjs -- the read sample for the pending task-source proposals.
 *
 * READ-ONLY. No `--apply`, nothing is written to `task_sources`. Unknown flags exit 2.
 *
 *   --n=15      random tasks to draw across the three certifications (default 15)
 *   --seed=7    the draw is DETERMINISTIC, so the sample is reproducible and re-derivable
 *
 * ============ WHY THE DRAW IS SEEDED AND NOT RANDOM ============
 *
 * `Math.random()` would make the sample unreproducible: a second run would draw different tasks and
 * nobody could check which fifteen were read. A stated seed means the exact sample can be regenerated,
 * which is the same reason every count in this repository has to name the predicate that produced it.
 *
 * ============ AND EVERY LOW-CONFIDENCE DECISION, NOT A SAMPLE OF THEM ============
 *
 * The random draw answers "is the general quality acceptable". The low-confidence list answers a
 * different question -- "which decisions does the instrument itself doubt" -- and sampling that would
 * discard the one signal the judgment volunteered. Both sections are here because they are two
 * questions, and 119 low-confidence entries is the honest size of the second.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

let N = 15, SEED = 7;
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--n=(\d+)$/.exec(a))) { N = Number(m[1]); continue; }
  if ((m = /^--seed=(\d+)$/.exec(a))) { SEED = Number(m[1]); continue; }
  console.error("Unrecognised flag: " + a + ". Known: --n=, --seed=. READ-ONLY.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const CERTS = ["ISMS-F", "ISMS-IA", "AIMS-IA"];

/* a small deterministic PRNG -- Date.now() and Math.random() are not used anywhere here */
const rng = (s) => () => {
  s = (s * 1103515245 + 12345) & 0x7fffffff;
  return s / 0x7fffffff;
};

const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const byKey = new Map(lib.passages.map((p) => [p.source_id + "|" + p.clause, p]));

const KEY = requireKey(HERE);
const certRows = await getAll(KEY, "certifications?select=id,code&order=code");
const idOf = new Map(certRows.map((c) => [c.code, c.id]));
const allTasks = await getAll(KEY, "tasks?select=id,certification_id,code,statement&order=code");

const loaded = [];
for (const c of CERTS) {
  const f = join(ROOT, "TASK-SOURCE-PROPOSALS2-" + c + ".json");
  if (!existsSync(f)) {
    console.error("missing " + f + " -- run judge-task-sources2.mjs --cert=" + c + " first.");
    process.exit(2);
  }
  const j = JSON.parse(readFileSync(f, "utf8"));
  const stmt = new Map(allTasks.filter((t) => t.certification_id === idOf.get(c))
    .map((t) => [t.code, t.statement]));
  loaded.push({ cert: c, j, stmt });
}

/* a flat list of every judged task, so the draw is across the three rather than per certification */
const rows = [];
for (const { cert, j, stmt } of loaded) {
  for (const r of j.results || []) {
    rows.push({ cert, task: r.task, statement: stmt.get(r.task) || r.statement || "",
      primary: r.primary || [], dropped: r.dropped || [], state: r.state,
      none_apply: !!r.none_apply, note: r.note, invented: r.invented || [],
      unjudged: r.unjudged || 0, chunkFailures: r.chunk_failures || 0 });
  }
}
const judged = rows.filter((r) => r.state === "judged");
if (!judged.length) { console.error("no judged tasks in the artifacts"); process.exit(2); }

/* the draw */
const next = rng(SEED);
const pool = judged.map((r, i) => ({ r, k: next() * 1000 + i })).sort((a, b) => a.k - b.k);
const drawn = pool.slice(0, Math.min(N, pool.length)).map((x) => x.r)
  .sort((a, b) => a.cert.localeCompare(b.cert) || a.task.localeCompare(b.task, undefined, { numeric: true }));

const md = [];
const p = (s = "") => md.push(s);
const text = (src, cl, n) => String((byKey.get(src + "|" + cl) || {}).text || "(NOT HELD)")
  .replace(/\s+/g, " ").slice(0, n);
const title = (src, cl) => String((byKey.get(src + "|" + cl) || {}).title || "");

p("# Pending task-source proposals: the read sample");
p("");
p("**NOTHING IS IN `task_sources`.** These are proposals from `judge-task-sources2.mjs`, blind, and");
p("they stay proposals until you have read them.");
p("");
p("| certification | tasks judged | primaries proposed | tasks with none | none_apply | low-confidence |");
p("|---|---|---|---|---|---|");
for (const { cert, j } of loaded) {
  const rs = j.results || [];
  p("| " + cert + " | " + rs.filter((r) => r.state === "judged").length + " | " +
    rs.reduce((n, r) => n + ((r.primary || []).length), 0) + " | " +
    rs.filter((r) => r.state === "judged" && !(r.primary || []).length).length + " | " +
    rs.filter((r) => r.none_apply).length + " | " + (j.low_confidence || []).length + " |");
}
p("");
p("**Recall and precision are UNMEASURABLE for all three.** None has a reviewed mapping -- that is why");
p("these are being proposed. The judge's own report said `0.0%` on its first run, which reads as \"found");
p("nothing\" when the truth is \"nothing to compare against\"; it now says so instead.");
p("");
p("The only evidence about quality is AIMS-F, which does have a reviewed mapping: **recall 84.0%,");
p("subject recall 96.2%, corrected precision 93.2%** -- and 17 of its 24 misses are one task whose");
p("reviewed mapping enumerates every leaf of a clause tree. AIMS-F is also the only one of the four");
p("whose proposals were checked against a human's, so it is an upper bound for these three rather than");
p("a like-for-like prediction: they face larger source pools.");
/* ============ THE EIGHT PROPOSALS WRITTEN AGAINST THE WRONG EDITION ============
 *
 * The library holds ISO/IEC 27001 clauses 4.1 and 4.2 in TWO editions -- `2022` and `2022/Amd1:2024`
 * -- and the judge's passage map was keyed on (source, clause) alone, so the amendment won the key.
 * Those proposals were therefore judged against AMENDMENT text when they meant the base clause.
 *
 * The key now includes the edition. These 8 were generated before that and are named here rather than
 * re-running 127 tasks for them: they are a bounded, listed set, and you are reading the proposals
 * anyway. Read the clause, not the change note, when you get to them. */
const AFFECTED = [];
for (const { cert, j } of loaded) {
  for (const r of j.results || []) {
    for (const x of r.primary || []) {
      if (x.source === "ISO/IEC 27001" && (x.clause === "4.1" || x.clause === "4.2")) {
        AFFECTED.push({ cert, task: r.task, clause: x.clause, conf: x.confidence,
          reason: String(x.reason || "") });
      }
    }
  }
}
p("");
p("---");
p("");
p("## The " + AFFECTED.length + " proposals on a two-edition address, and only 2 are wrong");
p("");
p("The library holds ISO/IEC 27001 clauses `4.1` and `4.2` in two editions, `2022` and");
p("`2022/Amd1:2024`. The judge's passage map was keyed on (source, clause) alone, so the AMENDMENT won");
p("the key and the base clause text was unreachable through it. **The key now includes the edition.**");
p("");
p("**Reading the eight corrects my own framing of them.** Six INTENTIONALLY mean the amendment --");
p("ISMS-F 2.3 and ISMS-IA 4.7 are explicitly about the climate-change addition, and their recorded");
p("reasons say so (*\"Amendment 1:2024 adds to 4.1 the requirement to determine whether climate change");
p("is a relevant issue\"*). For those, resolving to the amendment is the right answer.");
p("");
p("Only ISMS-F task 2.2's high-confidence pair meant the BASE clause and was judged against change-note");
p("text. Its medium-confidence pair means the amendment. **The judgment distinguished the two editions");
p("correctly, gave them different reasons and different confidences, and the map collapsed them** -- so");
p("the duplicate was my defect showing through a correct judgment, not a confused one.");
p("");
p("A bounded listed set beats re-running 127 tasks. AIMS-F and AIMS-IA name neither clause.");
p("");
if (AFFECTED.length) {
  p("| certification | task | clause | confidence | the reason as recorded |");
  p("|---|---|---|---|---|");
  for (const a of AFFECTED.sort((x, y) => x.cert.localeCompare(y.cert) ||
    String(x.task).localeCompare(String(y.task), undefined, { numeric: true }))) {
    p("| " + a.cert + " | " + a.task + " | `" + a.clause + "` | " + (a.conf || "?") + " | " +
      a.reason.replace(/\s+/g, " ").slice(0, 130) + " |");
  }
} else {
  p("None -- no proposal in these three names either clause.");
}
p("");
p("---");
p("");
p("## " + drawn.length + " random tasks   (seed " + SEED + ", reproducible: `--seed=" + SEED + " --n=" + N + "`)");
for (const r of drawn) {
  p("");
  p("### " + r.cert + " task " + r.task);
  p("");
  p("> " + String(r.statement).replace(/\s+/g, " "));
  p("");
  if (r.none_apply) {
    p("**none_apply** -- the judgment says no held passage examines this task." +
      (r.note ? " Note: " + r.note : ""));
    continue;
  }
  if (!r.primary.length) { p("**no primary proposed.**" + (r.note ? " Note: " + r.note : "")); continue; }
  p("| source | clause | title | confidence | why |");
  p("|---|---|---|---|---|");
  for (const x of r.primary) {
    p("| " + String(x.source).replace("ISO/IEC ", "").replace("ISO ", "") + " | `" + x.clause +
      "` | " + title(x.source, x.clause).slice(0, 40) + " | " + (x.confidence || "?") + " | " +
      String(x.reason || "").replace(/\s+/g, " ").slice(0, 150) + " |");
  }
  if (r.dropped.length) {
    p("");
    p("*pass 2 dropped " + r.dropped.length + ":* " +
      r.dropped.slice(0, 6).map((d) => "`" + d.clause + "`").join(" ") +
      (r.dropped.length > 6 ? " and " + (r.dropped.length - 6) + " more" : ""));
  }
  if (r.unjudged) {
    p("");
    p("**" + r.unjudged + " pick(s) got NO verdict from pass 2** (" + r.chunkFailures +
      " chunk(s) unanswered). This task is UNDER-MEASURED -- its proposals are a floor.");
  }
}

p("");
p("---");
p("");
const lows = [];
for (const { cert, j, stmt } of loaded) {
  for (const l of j.low_confidence || []) {
    lows.push({ cert, ...l, statement: stmt.get(l.task) || "" });
  }
}
p("## Every low-confidence decision   (" + lows.length + ")");
p("");
p("Not a sample. These are the decisions the judgment itself flagged as a guess between plausible");
p("options, and the reason says why in each case.");
p("");
p("| certification | task | source | clause | title | why it is a guess |");
p("|---|---|---|---|---|---|");
for (const l of lows.sort((a, b) => a.cert.localeCompare(b.cert) ||
  String(a.task).localeCompare(String(b.task), undefined, { numeric: true }))) {
  p("| " + l.cert + " | " + l.task + " | " +
    String(l.source || "").replace("ISO/IEC ", "").replace("ISO ", "") + " | `" + l.clause +
    "` | " + title(l.source, l.clause).slice(0, 34) + " | " +
    String(l.reason || "").replace(/\s+/g, " ").slice(0, 160) + " |");
}

/* the things that could not be judged at all, reported under their own name */
p("");
p("---");
p("");
p("## Not judged, and not a rejection");
p("");
const bad = rows.filter((r) => r.state !== "judged");
const under = rows.filter((r) => r.unjudged > 0);
if (!bad.length && !under.length) {
  p("Every task in all three certifications was judged and every pass-1 pick got a pass-2 verdict.");
} else {
  for (const r of bad) {
    p("- **" + r.cert + " task " + r.task + "** -- state `" + r.state + "`. Nothing was measured, which");
    p("  is not a pass and not a flag.");
  }
  for (const r of under) {
    p("- **" + r.cert + " task " + r.task + "** -- " + r.unjudged + " of " +
      (r.primary.length + r.dropped.length + r.unjudged) + " picks got no pass-2 verdict (" +
      r.chunkFailures + " chunk(s) unanswered). Its proposals are a FLOOR, not a verdict.");
  }
}
const inv = rows.filter((r) => (r.invented || []).length);
p("");
p("**Addresses the library does not hold**, dropped and never stored: " +
  inv.reduce((n, r) => n + r.invented.length, 0) + " across " + inv.length + " task(s).");
if (inv.length) {
  for (const r of inv.slice(0, 10)) {
    p("- " + r.cert + " " + r.task + ": " + r.invented.slice(0, 5)
      .map((x) => (x.source ? x.source + " " + x.clause : String(x))).join(", "));
  }
}

writeFileSync(join(ROOT, "TASK-SOURCE-READ-SAMPLE.md"), md.join("\n") + "\n", "utf8");
console.log("wrote TASK-SOURCE-READ-SAMPLE.md");
console.log("  " + drawn.length + " random task(s), seed " + SEED + "   low-confidence " + lows.length +
  "   not judged " + bad.length + "   under-measured " + under.length);
void text;
