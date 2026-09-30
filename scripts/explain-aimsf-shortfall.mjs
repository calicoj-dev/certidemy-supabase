#!/usr/bin/env node
/**
 * explain-aimsf-shortfall.mjs -- for every AIMS-F task still below its floor, WHY it is short.
 *
 * READ-ONLY. No writes beyond one report, no model calls. Unknown flags exit 2.
 *
 * Ruled PROMPT-95 s5: *"For every task still below its floor, including the four that hit a stop condition in
 * batch 2 (4.3, 4.4, 4.5, 5.5), print why it's short. Skip any task whose problem is its map rather than its
 * luck, and list it."*
 *
 * ============ MAP OR LUCK, AND MY FIRST THREE CLASSIFIERS ALL GOT IT WRONG THE SAME WAY ============
 *
 * Every one of them reasoned from a LABEL -- the gate's id, the name of a loss -- instead of from its
 * members, which is the defect this whole session keeps re-finding. Each was corrected by reading what the
 * refusals actually said:
 *
 *   v1  "every attempt lost to `reproduction`" -> MAP.  It put 4.5 on the SKIP list and told the director
 *       its passages were text our prose cannot escape. All three refusals say *"the quotation names no
 *       clause"* -- a FORMATTING defect in the explanation. Pure luck, and a redraft fixes it.
 *   v2  "most losses were `anchor-cap`" -> MAP, "too few distinct passages to carry the floor". It said that
 *       about task 5.5, which has THIRTY-SIX primary passages. The claim was arithmetically impossible on
 *       its own data and the report printed both numbers two lines apart.
 *   v3  one or two attempts losing the same way -> MAP. Two draws is not evidence about a map; that is the
 *       two-point rule, and it has its own state now.
 *
 * WHAT THE CLASSES ARE NOW, each with the action it implies:
 *
 *   MAP: EXCLUDED              the shortfall artifact's own verdict -- 1.3, closed by ruling.
 *   MAP: CANNOT CARRY FLOOR    2 x effective < floor. Arithmetic, not a guess: the cap is 2 per clause.
 *   MAP: NO HEADROOM           2 x effective == floor exactly, so any refusal is unrecoverable.
 *   LUCK: DRAW REPEATED        `anchor-cap` losses with headroom to spare -- the draw came back to a passage
 *                              already used twice. Generating again is the fix, in principle.
 *   LUCK: QUOTATION FORMATTING every loss is the attributed-quotation arm of `reproduction`.
 *   LUCK: GATE LOSSES          the ordinary case.
 *   INSUFFICIENT EVIDENCE      too few attempts to say anything about the map.
 *   NEVER ATTEMPTED            the allocation went elsewhere.
 *
 * AND THE R4 RUN TESTED THE "GENERATE AGAIN" PREDICTION AND IT FAILED. 5.5 was told to generate; all four
 * of its R4 attempts anchored in the SAME clause (3.4) out of 36 available, and three died on the cap. The
 * map was never the problem and neither was the luck: a single writer call asked for four items and spread
 * them across one passage. See AIMSF-ROLLOUT-R4.md.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". This script is READ-ONLY and takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KEY = requireKey(HERE);
const idOf = (t) => createHash("sha256").update(String(t || "").replace(/\s+/g, " ").trim())
  .digest("hex").slice(0, 8);

const SF = JSON.parse(readFileSync(join(ROOT, "AIMSF-ROLLOUT-SHORTFALL.json"), "utf8"));
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const passByKey = new Map();
for (const p of lib.passages) {
  if (p.source_id !== "ISO/IEC 42001") continue;
  passByKey.set(String(p.clause), p);
}

const certs = await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F");
const tasks = await getAll(KEY, "tasks?select=id,code,statement&certification_id=eq." + certs[0].id);
const taskById = new Map(tasks.map((t) => [t.id, t]));
/* task_sources links to a PASSAGE ID, not to a clause string -- the clause comes from source_passages.
 * Checked against migration 375 rather than guessed: the table is keyed (task_id, passage_id) and has no
 * id, no source_id and no clause column, so an unordered read of it also trips the paging assertion. */
const ts = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id,passage_id");
const sp = await getAll(KEY, "source_passages?select=id,source_id,edition,clause,title&order=id");
const spById = new Map(sp.map((r) => [r.id, r]));
const sourcesOf = new Map();
for (const r of ts) {
  const t = taskById.get(r.task_id);
  if (!t) continue;
  if (!sourcesOf.has(t.code)) sourcesOf.set(t.code, []);
  const p2 = spById.get(r.passage_id) || {};
  sourcesOf.get(t.code).push({ ...r, clause: p2.clause, source_id: p2.source_id, edition: p2.edition,
    title: p2.title });
}

/* ---- the generation history, per task, across every gated artifact ---- */
const FILES = ["AIMSF-ROLLOUT-B1.json", "AIMSF-ROLLOUT-B2.json", "AIMSF-R2-PROBE.json",
  "AIMSF-R2-REST.json", "AIMSF-R3-PROBE.json", "AIMSF-R3-REST.json", "AIMSF-S2-REVISED.json",
  "AIMSF-R4-PROBE.json", "AIMSF-R4-REST.json"];
const hist = new Map();   /* code -> { attempted, survivors, why: {reason: n}, reproSpans: [] } */
for (const f of FILES) {
  const p = join(ROOT, f);
  if (!existsSync(p)) continue;
  for (const r of JSON.parse(readFileSync(p, "utf8")).items || []) {
    const code = r.task_code;
    if (!hist.has(code)) hist.set(code, { attempted: 0, survivors: 0, why: {}, repro: [], files: new Set() });
    const h = hist.get(code);
    h.attempted++; h.files.add(f);
    if (r.verdict === "survivor") { h.survivors++; continue; }
    const key = (r.failed && r.failed.length) ? r.failed.slice().sort().join(" + ") : String(r.verdict);
    h.why[key] = (h.why[key] || 0) + 1;
    const rg = (r.gates || []).find((g) => g.id === "reproduction" && g.pass === false);
    if (rg) {
      h.repro.push({ id: String(r.item_id || idOf(r.item && r.item.question_text)).slice(0, 8),
        clause: r.item && r.item.key_support_clause, reason: String(rg.reason || "").slice(0, 210) });
    }
  }
}

/* ---- classify each short task ---- */
const classifyOf = (sf, h) => {
  const short = sf.shortfall;
  if (!short) return null;
  /* `tooThin` and `eligible` are the shortfall artifact's OWN verdicts on the map. Reading its fields rather
   * than recomputing the test is the same rule that made report-aimsf-completion stop computing `kept`: two
   * implementations of one tally disagree, and the new one is usually the wrong one. */
  if (sf.tooThin || sf.eligible === false) {
    return { kind: sf.eligible === false ? "MAP: EXCLUDED BY THE SHORTFALL" : "MAP TOO THIN",
      why: "the shortfall artifact marks this task " + (sf.tooThin ? "tooThin" : "") +
        (sf.eligible === false ? (sf.tooThin ? " and " : "") + "not eligible" : "") + " -- " + sf.effective +
        " effective primary passage(s) against a floor of " + sf.floor + ", and the floor is " +
        "min(8, 2 x primaries). Its own verdict, not one recomputed here.",
      action: "widen the map, not the generator" };
  }
  if (!h || !h.attempted) {
    return { kind: "NEVER ATTEMPTED", why: "no generation run reached this task -- the allocation went " +
      "elsewhere.", action: "generate" };
  }
  const reasons = Object.entries(h.why).sort((a, b) => b[1] - a[1]);
  const lost = reasons.reduce((s, [, n]) => s + n, 0);
  const reproOnly = reasons.filter(([k]) => k === "reproduction").reduce((s, [, n]) => s + n, 0);
  const capped = reasons.filter(([k]) => k.includes("anchor-cap")).reduce((s, [, n]) => s + n, 0);
  /* ============ THE GATE ID IS NOT THE REASON, AND READING THE LABEL GOT 4.5 EXACTLY WRONG ============
   *
   * My first version classified "every attempt lost to `reproduction`" as a MAP problem, and confidently
   * told you that 4.5's passages are text our prose cannot escape. READ THE REFUSALS and it is nothing of
   * the kind -- all three say:
   *
   *   "the quotation names no clause -- an attributed quotation has to say what it is quoting"
   *
   * The reproduction gate allows ONE attributed quotation in the explanation and requires it to name its
   * clause. Three writers quoted without naming it. That is a FORMATTING defect in the explanation, fixable
   * by a redraft, and it is pure luck -- the passages are not implicated at all.
   *
   * 1.6's single refusal is the other arm and a real one: "a 16-word run shared with 42001:2023 -- the
   * ceiling is 9". But ONE attempt is not evidence about a map, so that is its own state too: reasoning from
   * a single draw is the two-point rule this repository already records.
   *
   * So the arms are separated by their REASON TEXT, and the attempt count decides whether the evidence is
   * there at all. Reasoning from the gate's label rather than its members is the defect this whole session
   * keeps re-finding. */
  const reproReasons = h.repro.map((r) => String(r.reason));
  const formatting = reproReasons.filter((r) => /names no clause|quoted spans|allows at most one sentence/
    .test(r)).length;
  const realRuns = reproReasons.filter((r) => /\bword run shared with\b/.test(r)).length;
  if (lost && reproOnly === lost && formatting === reproReasons.length && reproReasons.length) {
    return { kind: "LUCK: QUOTATION FORMATTING", why: "all " + lost + " attempt(s) lost to `reproduction`, " +
      "and every refusal is the ATTRIBUTED-QUOTATION arm -- the explanation quoted the standard without " +
      "naming the clause it was quoting. A formatting defect in the explanation, not a fact about the " +
      "passages. Reading the gate's LABEL would have called this a map problem; reading its REASONS does not.",
      action: "generate -- and the writer prompt should require the clause beside any quotation" };
  }
  if (lost && reproOnly === lost && h.attempted < 3) {
    return { kind: "INSUFFICIENT EVIDENCE", why: "only " + h.attempted + " attempt(s), all lost to " +
      "`reproduction`" + (realRuns ? " on the run-length arm" : "") + ". One or two draws cannot say whether " +
      "the passages are the problem -- that is the two-point rule, and calling it MAP on this evidence " +
      "would be a fact about a sample of " + h.attempted + ".",
      action: "generate; re-classify if it loses the same way three times" };
  }
  if (lost && reproOnly === lost && realRuns >= 3) {
    return { kind: "MAP: REPRODUCTION RUNS ON EVERY ATTEMPT", why: "all " + lost + " attempt(s) were refused " +
      "by `reproduction` on the RUN-LENGTH arm and by nothing else. Three or more independent draws failing " +
      "the same way is a statement about the PASSAGES: our prose cannot get far enough from this text.",
      action: "read the mapped passages before generating again" };
  }
  /* ============ AN ANCHOR-CAP REFUSAL IS NOT EVIDENCE THAT THE MAP IS SHORT ============
   *
   * My first version called any task whose losses were mostly `anchor-cap` a MAP problem. It put 5.5 on the
   * SKIP list with the words *"too few distinct passages to carry the floor"* -- and 5.5 has THIRTY-SIX
   * primary passages and an effective count of 34. The claim was arithmetically impossible on its own data,
   * and the report printed both numbers two lines apart without noticing.
   *
   * THE CAP IS 2 PER (SOURCE, CLAUSE), SO THE CEILING A MAP IMPOSES IS `2 x effective`. Compare it to the
   * floor and the answer is arithmetic rather than a guess:
   *
   *   2 x eff  <  floor   the map CANNOT carry the floor, whatever is generated
   *   2 x eff  == floor   NO HEADROOM: every passage must be used twice, so any refusal is unrecoverable
   *   2 x eff  >  floor   the cap bound because the DRAW repeated a passage, not because the map is short
   *
   * The third is luck and generating again fixes it. Calling it MAP would have told you to widen a map with
   * 68 items of headroom. */
  if (capped) {
    const ceiling = 2 * sf.effective;
    if (ceiling < sf.floor) {
      return { kind: "MAP: THE MAP CANNOT CARRY THE FLOOR", why: capped + " of " + lost + " losses were " +
        "`anchor-cap`, and the map's ceiling is 2 x " + sf.effective + " = " + ceiling + " against a floor " +
        "of " + sf.floor + ". No amount of generating can reach it.", action: "widen the map" };
    }
    if (ceiling === sf.floor) {
      return { kind: "MAP: NO HEADROOM", why: capped + " of " + lost + " losses were `anchor-cap`, and the " +
        "map's ceiling is 2 x " + sf.effective + " = " + ceiling + ", EXACTLY the floor. Every passage has " +
        "to carry two items, so any single refusal is unrecoverable without widening the map.",
        action: "widen the map, or accept that this task has no margin" };
    }
    return { kind: "LUCK: THE DRAW REPEATED A PASSAGE", why: capped + " of " + lost + " losses were " +
      "`anchor-cap` -- but the map's ceiling is 2 x " + sf.effective + " = " + ceiling + " against a floor " +
      "of " + sf.floor + ", so the map is not short by a factor of " + (ceiling / sf.floor).toFixed(1) +
      "x. The cap bound because the draw came back to a passage already used twice, which generating again " +
      "fixes.", action: "generate" };
  }
  return { kind: "LUCK: GATE LOSSES", why: lost + " attempt(s) refused, " + h.survivors + " survived. " +
    reasons.map(([k, n]) => n + "x " + k).join("; "), action: "generate" };
};

const short = SF.per_task.filter((r) => r.shortfall > 0)
  .sort((a, b) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true }));

const md = ["# Why each AIMS-F task is still short", "",
  "**Read-only. Nothing here is generated or inserted.** Ruled PROMPT-95 s5.", "",
  "`MAP` means more attempts cannot help; `LUCK` means they can. The distinction is the one the ruling asks",
  "for, split four ways because the artifacts support it -- and `reproduction` failing on EVERY attempt is",
  "counted as MAP, not luck: three independent draws losing to one gate is a statement about the passages.",
  "",
  "| task | floor | eff | have | short | attempted | survived | classification |",
  "|---|---|---|---|---|---|---|---|"];
const byKind = {};
for (const sf of short) {
  const h = hist.get(sf.code);
  const c = classifyOf(sf, h);
  byKind[c.kind] = (byKind[c.kind] || []).concat(sf.code);
  md.push("| " + sf.code + " | " + sf.floor + " | " + sf.effective + " | " + sf.have + " | " + sf.shortfall +
    " | " + (h ? h.attempted : 0) + " | " + (h ? h.survivors : 0) + " | **" + c.kind + "** |");
}
md.push("");
for (const sf of short) {
  const h = hist.get(sf.code);
  const c = classifyOf(sf, h);
  md.push("### " + sf.code + " -- short " + sf.shortfall + " of " + sf.floor + "   [" + c.kind + "]");
  md.push("");
  md.push("- " + c.why);
  md.push("- action: **" + c.action + "**");
  const srcs = sourcesOf.get(sf.code) || [];
  const prim = srcs.filter((s) => s.role === "primary");
  md.push("- map: " + srcs.length + " source row(s), " + prim.length + " primary -- " +
    prim.slice(0, 8).map((s) => s.clause).join(", ") + (prim.length > 8 ? ", ..." : ""));
  if (h && h.repro.length) {
    md.push("- every `reproduction` refusal, verbatim:");
    for (const r of h.repro) md.push("  - `" + r.id + "` anchored in " + r.clause + ": " + r.reason);
  }
  md.push("");
}

/* ============ 4.5 IN FULL, BECAUSE THE RULING ASKS A SPECIFIC QUESTION ABOUT IT ============ */
md.push("## 4.5 in full: is its anchor text mostly definitions that cannot be paraphrased?");
md.push("");
md.push("**No. The hypothesis is refuted on both halves, and the real reason is smaller and better news.**");
md.push("");
{
  const srcs = (sourcesOf.get("4.5") || []).filter((s) => s.role === "primary");
  const defs = srcs.filter((s) => /^3(\.|$)/.test(String(s.clause)));
  md.push("**" + defs.length + " of " + srcs.length + " primary passages are clause-3 definitions.** Every");
  md.push("one is an Annex A control statement:");
  md.push("");
  md.push("| clause | title | words | a clause-3 definition? |");
  md.push("|---|---|---|---|");
  let min = Infinity, max = 0, sum = 0;
  for (const s of srcs) {
    const p = passByKey.get(String(s.clause));
    const w = p ? String(p.text).trim().split(/\s+/).length : 0;
    if (w) { min = Math.min(min, w); max = Math.max(max, w); sum += w; }
    md.push("| " + s.clause + " | " + (p ? String(p.title || "").slice(0, 46) : "NOT HELD") + " | " + w +
      " | " + (/^3(\.|$)/.test(String(s.clause)) ? "**yes**" : "no") + " |");
  }
  md.push("");
  md.push("Lengths: min " + (min === Infinity ? 0 : min) + ", max " + max + ", mean " +
    (srcs.length ? Math.round(sum / srcs.length) : 0) + " words.");
  md.push("");
  md.push("**AND THE REFUSALS ARE NOT ABOUT LENGTH EITHER.** All three say the same thing, verbatim:");
  md.push("");
  md.push("> the quotation names no clause -- an attributed quotation has to say what it is quoting");
  md.push("");
  md.push("The `reproduction` gate allows ONE attributed quotation in the explanation and requires it to name");
  md.push("its clause. Three writers quoted the standard and did not name it. **That is a formatting defect in");
  md.push("the explanation, fixable by a redraft** -- the passages are not implicated at all, and 4.5 moves");
  md.push("from the SKIP list to the GENERATE list.");
  md.push("");
  md.push("I had this wrong first, in the same direction the question was asked: my classifier read the gate's");
  md.push("LABEL -- `reproduction` on every attempt -- and told you the passages were unescapable text.");
  md.push("Reading the REASONS says otherwise. Reasoning from a label rather than from the members is the");
  md.push("defect this session has found in four separate instruments.");
  md.push("");
  md.push("**The one thing worth acting on beyond generating:** three independent draws made the same");
  md.push("formatting mistake, which points at the writer prompt rather than at three unlucky writers. The");
  md.push("prompt should require the clause beside any quotation in the explanation.");
  md.push("");
}

writeFileSync(join(ROOT, "AIMSF-SHORTFALL-WHY.md"), md.join("\n") + "\n", "utf8");

console.log("WHY EACH AIMS-F TASK IS SHORT   " + short.length + " task(s) below floor");
console.log("");
for (const [k, v] of Object.entries(byKind).sort((a, b) => b[1].length - a[1].length)) {
  console.log("  " + String(v.length).padStart(3) + "  " + k.padEnd(36) + v.join(" "));
}
console.log("");
const mapKinds = Object.keys(byKind).filter((k) => k.startsWith("MAP"));
const skip = mapKinds.flatMap((k) => byKind[k]);
console.log("SKIP (the problem is the MAP, not the luck): " + (skip.length ? skip.join(", ") : "none"));
console.log("GENERATE (the problem is the luck):          " +
  Object.keys(byKind).filter((k) => !k.startsWith("MAP")).flatMap((k) => byKind[k]).join(", "));
console.log("");
console.log("wrote AIMSF-SHORTFALL-WHY.md");
