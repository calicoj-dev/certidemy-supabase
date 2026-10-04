#!/usr/bin/env node
/**
 * revise-artifact.mjs -- apply DECLARED revisions to items in a generation artifact, then re-gate and
 * run the blind solver twice. WRITES the artifact with `--apply`; dry by default.
 *
 * Ran the PROMPT-116 s1 re-anchors under its earlier name, `reanchor-artifact.mjs`. Widened rather
 * than copied: a stem rescue and a re-anchor differ only in WHICH declared field moves, and the tail
 * -- gate, solver twice, accept only on accepted/accepted -- must be one implementation or the two
 * paths drift on what counts as a pass.
 *
 * Two kinds of revision, both DECLARED in the spec file, never inferred:
 *
 *   reanchors   a support quote keeps its words and changes the (source, edition, clause) it is
 *               attributed to. REFUSED unless the quote is ALREADY verbatim in the new passage.
 *   edits       a SERVED field is rewritten: `question_text`, `explanation`, or one option's text.
 *               REFUSED unless `from` matches the present value exactly.
 *   requotes    `key_support` is replaced by a DIFFERENT SPAN OF THE SAME PASSAGE -- a short quote
 *               extended to its sentence, or a NOTE swapped for the requirement it sits under.
 *               REFUSED unless the new text is verbatim in the anchored passage.
 *
 * ============ `key_support` IS RE-QUOTED, NEVER REWRITTEN ============
 *
 * PROMPT-111 s0: key_support stays verbatim and nothing else. That rules out rewriting it -- and it
 * does NOT rule out quoting a different span of the same passage, which is what PROMPT-118 s2 asks for
 * twice: a four-word quote extended to the sentence the gate's floor exists to require, and a NOTE
 * swapped for the `shall` sentence it qualifies. Both stay verbatim, and the script PROVES it against
 * the held passage before writing. A `requote` whose text is not in the passage is refused, so this
 * cannot become a back door to authored support. An `edits` entry naming key_support is still an error.
 *
 * An entry may carry `keep_verdict: true` -- the gates run, the solver does NOT, and the item's own
 * recorded `accepted` verdict is kept. Declared per entry, refused where there is no such verdict.
 *
 * ONE ITEM FIRST (standing rule, PROMPT-115): the first item's full solver prompt is printed before
 * any further call.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey } from "./_pg.mjs";
import { buildGateContext } from "./lib/gate-context.mjs";
import { runCodeGates } from "./lib/grounded-gates.mjs";
import { itemIdOfStem } from "./lib/item-id.mjs";
import { blindPayload, assertBlind, solverUser, solverVerdict, SOLVER_SYSTEM,
  blindSolverControls } from "./lib/blind-solver.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let APPLY = false, CERT = "ISMS-F", IN = "ISMSF-R2", SPECFILE = null, PRINTED = false, MAXUSD = 5;
/* ONE ITEM FIRST is a RUN, not a promise: --only=<item_id> narrows the spec to one entry so the first
 * paid call is a single item whose prompt has been read. The spec file stays the record either way. */
let ONLY = null;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  let m = a.match(/^--cert=(.+)$/); if (m) { CERT = m[1]; continue; }
  m = a.match(/^--in=(.+)$/); if (m) { IN = m[1]; continue; }
  m = a.match(/^--spec=(.+)$/); if (m) { SPECFILE = m[1]; continue; }
  m = a.match(/^--max-usd=([0-9.]+)$/); if (m) { MAXUSD = Number(m[1]); continue; }
  m = a.match(/^--only=(.+)$/); if (m) { ONLY = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=, --in=, --spec=, --max-usd=, --only=, --apply");
  console.error("(dry by default -- this family opts into WRITING, CLAUDE.md s15.)");
  process.exit(2);
}
if (!SPECFILE) { console.error("--spec=<file.json> is required: revisions are declared, not guessed."); process.exit(2); }

{
  const c = blindSolverControls();
  if (c.fails.length) { console.error("REFUSING: solver controls fail"); process.exit(2); }
  console.log("solver controls: " + c.examined + " case(s), all pass");
}
const MODEL = process.env.GROUNDED_MODEL || "claude-opus-5";
const PRICE = { input: 15, output: 75 };
const AK = process.env.ANTHROPIC_API_KEY ||
  (readFileSync(join(HERE, ".env"), "utf8").match(/^ANTHROPIC_API_KEY=(.+)$/m) || [])[1];
if (!AK) { console.error("ANTHROPIC_API_KEY not found"); process.exit(2); }
let IN_TOK = 0, OUT_TOK = 0, CALLS = 0;
const usd = () => (IN_TOK / 1e6) * PRICE.input + (OUT_TOK / 1e6) * PRICE.output;
async function claude(system, user, maxTokens = 1500) {
  for (let a = 1; ; a++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST",
        headers: { "x-api-key": AK, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }) });
      if (!res.ok) throw new Error("Anthropic " + res.status + ": " + (await res.text()).slice(0, 200));
      const d = await res.json();
      CALLS++; IN_TOK += d.usage?.input_tokens || 0; OUT_TOK += d.usage?.output_tokens || 0;
      return (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    } catch (e) { if (a >= 3) throw e; await new Promise((r) => setTimeout(r, 800 * a)); }
  }
}
const parseObj = (t) => { const s = String(t || ""); const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; } };

const spec = JSON.parse(readFileSync(join(ROOT, SPECFILE), "utf8"));
const art = JSON.parse(readFileSync(join(ROOT, IN), "utf8"));
const items = art.items || [];
const survivors = items.filter((x) => x.verdict === "survivor");
const KEY = requireKey(HERE);
const ctx = await buildGateContext(KEY, CERT);
const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();

/* ---------------------------------------------------------------- the work list */
let work = [
  ...(spec.reanchors || []).map((r) => ({ kind: "reanchor", r })),
  ...(spec.requotes || []).map((r) => ({ kind: "requote", r })),
  ...(spec.edits || []).map((r) => ({ kind: "edit", r })),
];
if (ONLY) {
  const narrowed = work.filter((w) => w.r.item_id === ONLY);
  if (!narrowed.length) { console.error("--only=" + ONLY + " names no entry in " + SPECFILE); process.exit(2); }
  console.log("--only=" + ONLY + ": " + narrowed.length + " of " + work.length + " entr(ies)");
  work = narrowed;
}
if (!work.length) { console.error(SPECFILE + " declares no `reanchors`, `requotes` or `edits`."); process.exit(2); }

console.log("");
console.log("REVISE   " + CERT + "   " + IN + "   " + work.length + " declared revision(s)" +
  (APPLY ? "   --apply" : "   dry run (default)"));
const results = [];
for (const { kind, r } of work) {
  let it = items.find((x) => x.item_id === r.item_id);
  if (!it) { console.log("  " + r.item_id + "  NOT IN THE ARTIFACT"); results.push({ id: r.item_id, outcome: "not in artifact" }); continue; }
  /* the report number is taken BEFORE any re-assignment replaces the object, or indexOf reports #0 */
  const n = survivors.indexOf(it) + 1;
  const o = { ...it.item };
  let what = kind;

  if (kind === "reanchor") {
    const target = ctx.index.get(r.to.source_id, r.to.edition, String(r.to.clause));
    if (!target) {
      console.log("  " + r.item_id + "  REFUSED: " + r.to.source_id + " " + r.to.clause + " is not held");
      results.push({ id: r.item_id, outcome: "target not held" }); continue;
    }
    /* the quote must ALREADY be verbatim in the new passage, or this is a rewrite wearing a re-anchor */
    const quote = r.what === "key" ? o.key_support
      : (o.distractor_support || []).find((d) => d.index === r.index)?.support;
    if (!quote) { console.log("  " + r.item_id + "  REFUSED: no " + r.what + " quote at index " + r.index);
      results.push({ id: r.item_id, outcome: "no quote" }); continue; }
    if (!norm(target.text).includes(norm(quote))) {
      console.log("  " + r.item_id + "  REFUSED: the existing quote is NOT verbatim in " + r.to.clause);
      results.push({ id: r.item_id, outcome: "quote not in target" }); continue;
    }
    if (r.what === "key") {
      o.key_support_clause = String(r.to.clause);
      o.source_id = r.to.source_id; o.edition = r.to.edition;
    } else {
      o.distractor_support = (o.distractor_support || []).map((d) => d.index === r.index
        ? { ...d, clause: String(r.to.clause), source_id: r.to.source_id, edition: r.to.edition } : d);
    }
    if (r.explanation) o.explanation = r.explanation;
    what = "reanchor " + r.what + (r.index != null ? "[" + r.index + "]" : "") + " -> " + r.to.clause;
  }

  if (kind === "requote") {
    /* THE PASSAGE IS THE AUTHORITY. The new span must be verbatim in the clause the item anchors to
     * (or in the clause the spec re-points the anchor to), normalised only for whitespace -- the same
     * test gateVerbatim applies, run here so a refusal costs nothing. */
    const at = r.to && r.to.clause ? r.to : { source_id: o.source_id, edition: o.edition, clause: o.key_support_clause };
    const target = ctx.index.get(at.source_id, at.edition, String(at.clause));
    if (!target) {
      console.log("  " + r.item_id + "  REFUSED: " + at.source_id + " " + at.clause + " is not held");
      results.push({ id: r.item_id, outcome: "target not held" }); continue;
    }
    if (typeof r.key_support !== "string" || !r.key_support.trim()) {
      console.log("  " + r.item_id + "  REFUSED: a requote must name `key_support`");
      results.push({ id: r.item_id, outcome: "no key_support given" }); continue;
    }
    if (!norm(target.text).includes(norm(r.key_support))) {
      console.log("  " + r.item_id + "  REFUSED: the new key_support is NOT VERBATIM in " +
        at.source_id + " " + at.clause + " -- a requote quotes the passage, it does not author support");
      results.push({ id: r.item_id, outcome: "requote not verbatim" }); continue;
    }
    const wordsBefore = String(o.key_support || "").trim().split(/\s+/).filter(Boolean).length;
    const wordsAfter = r.key_support.trim().split(/\s+/).filter(Boolean).length;
    o.key_support = r.key_support;
    o.key_support_clause = String(at.clause);
    o.source_id = at.source_id; o.edition = at.edition;
    if (r.explanation) o.explanation = r.explanation;
    what = "requote key_support " + wordsBefore + "w -> " + wordsAfter + "w in " + at.clause;
    console.log("  " + r.item_id + "  REQUOTED, verbatim in " + at.source_id + " " + at.clause +
      "   " + wordsBefore + " -> " + wordsAfter + " words");
  }

  if (kind === "edit") {
    /* ============ A DECLARED EDIT NAMES WHAT IT EXPECTS TO FIND ============
     *
     * `from` must match the present value EXACTLY. An edit applied to text that has since changed is a
     * rewrite of something nobody read, and this script's whole purpose is that the revision is the one
     * that was ruled. */
    const FIELDS = new Set(["question_text", "explanation", "option"]);
    if (!FIELDS.has(r.field)) {
      console.log("  " + r.item_id + "  REFUSED: field " + r.field + " is not editable here" +
        (r.field === "key_support" ? " -- key_support stays verbatim (PROMPT-111 s0). Use a `requotes`" +
          " entry, which is checked against the held passage." : ""));
      results.push({ id: r.item_id, outcome: "field not editable" }); continue;
    }
    const present = r.field === "option"
      ? String((o.options || [])[r.option_index]?.text ?? "")
      : String(o[r.field] ?? "");
    /* ALREADY APPLIED IS NOT A REFUSAL. The spec is re-run as the batch advances (one item first,
     * then the rest), so an entry whose `to` is already in place is reported and skipped -- otherwise
     * a resumed run reports a `from` mismatch, which is what a real problem looks like. */
    if (present === r.to) {
      console.log("  " + r.item_id + "  already applied, skipped");
      results.push({ id: r.item_id, outcome: "already applied" }); continue;
    }
    if (present !== r.from) {
      console.log("  " + r.item_id + "  REFUSED: `from` does not match the present " + r.field);
      console.log("      present: " + present.slice(0, 160));
      console.log("      from:    " + String(r.from).slice(0, 160));
      results.push({ id: r.item_id, outcome: "from does not match" }); continue;
    }
    if (r.field === "option") {
      o.options = (o.options || []).map((x, i) => i === r.option_index ? { ...x, text: r.to } : x);
      what = "edit option[" + r.option_index + "]";
    } else {
      o[r.field] = r.to;
      what = "edit " + r.field;
    }
  }

  /* ============ RE-ASSIGNMENT IS DECLARED AND LOUD, NEVER A WAIVER ============
   *
   * `anchor-assignment` asks whether the key anchors where the writer was TOLD to anchor. Where the
   * anchor is a REAL primary passage of the task and only the writer's slot differed, the record is what
   * is wrong. So the spec may re-point the assignment, and doing so is printed. The gate keeps its
   * force: it is still checked, against a corrected assignment, rather than switched off. */
  let reassigned = null;
  if (r.reassign === true) {
    const to = { source_id: r.reassign_to?.source_id ?? r.to?.source_id,
      edition: r.reassign_to?.edition ?? r.to?.edition,
      clause: String(r.reassign_to?.clause ?? r.to?.clause) };
    const inMap = [...(ctx.mapByTask.get(ctx.taskIdOfCode.get(it.task_code))?.primary || []),
      ...(ctx.mapByTask.get(ctx.taskIdOfCode.get(it.task_code))?.supporting || [])]
      .some((p) => p.source_id === to.source_id && String(p.edition) === String(to.edition) &&
        String(p.clause) === to.clause);
    if (!inMap) {
      console.log("  " + r.item_id + "  REFUSED: " + to.source_id + " " + to.clause +
        " is not in task " + it.task_code + "'s map, so it cannot be re-assigned to");
      results.push({ id: r.item_id, outcome: "reassign target not in the task map" }); continue;
    }
    reassigned = { from: it.assigned, to };
    it = { ...it, assigned: to };
    console.log("  " + r.item_id + "  RE-ASSIGNED " + JSON.stringify(reassigned.from) + " -> " +
      JSON.stringify(to) + "   (a primary/supporting passage of task " + it.task_code + ")");
  }

  const map = ctx.mapByTask.get(ctx.taskIdOfCode.get(it.task_code)) || { primary: [], supporting: [] };
  const v = runCodeGates(o, { passagesByKey: ctx.index, annexGaps: ctx.annexGaps,
    sequenceGaps: [...ctx.sequenceGaps, ...ctx.declaredGaps], cert: CERT, cueCfg: ctx.cueCfg,
    primaryClauses: map.primary, supportingClauses: map.supporting,
    sources: ctx.sources, leak: ctx.leak,
    /* AN ALREADY-INSERTED ITEM IS NOT ITS OWN DUPLICATE. e723f8f3 is live, so liveStemsForTask
     * carried its own stem and near-duplicate refused it against itself (PROMPT-122 s1). Excluded by
     * STEM IDENTITY, which is the only join available here -- the artifact has no row id. */
    liveStemsForTask: ((ctx.liveByTask && ctx.liveByTask.get(ctx.taskIdOfCode.get(it.task_code))) || [])
      .filter((x) => itemIdOfStem(x.stem) !== itemIdOfStem(o.question_text)),
    assignedAnchor: it.assigned || null });
  console.log("");
  console.log("  " + r.item_id + " (#" + n + ")   " + what + "   anchor " + o.key_support_clause +
    "   gates passed=" + v.passed +
    (v.failed.length ? " FAILED[" + v.failed.join(",") + "]" : "") +
    (v.unasserted.length ? " UNASSERTED[" + v.unasserted.join(",") + "]" : ""));
  if (!v.passed) {
    for (const g of v.gates.filter((g) => g.pass === false)) {
      console.log("      " + g.id + ": " + String(g.reason || g.detail).replace(/\s+/g, " ").slice(0, 220));
    }
    results.push({ id: r.item_id, outcome: "gates: " + v.failed.join(",") }); continue;
  }
  /* ============ keep_verdict: A REVISION THE DIRECTOR RULED NEEDS NO NEW JUDGEMENT ============
   *
   * Ruled PROMPT-119 s1 for R5 #29, whose stem asked two things while the options answered one. The
   * revision DELETES the unanswered clause and changes nothing else, so there is no new claim for the
   * solver to judge and the recorded verdict is still the verdict the item cleared.
   *
   * IT IS NOT THE DEFAULT, and the reason is in gen-grounded-items: a REVISED item normally needs a new
   * judgement, because a new stem is a new thing to solve. So this path is per-entry, declared, printed,
   * and recorded on the item as `kept_verdict` -- and it REFUSES where there is no verdict to keep,
   * rather than writing an item whose solver field is null.
   *
   * THE GATES STILL RUN. Only the model call is skipped. */
  if (r.keep_verdict === true) {
    const prior = it.solver && it.solver.state;
    if (prior !== "accepted") {
      console.log("    REFUSED: keep_verdict needs a recorded `accepted` solver verdict, found " +
        JSON.stringify(prior));
      results.push({ id: r.item_id, outcome: "keep_verdict with no accepted verdict to keep" });
      continue;
    }
    const target = items.find((x) => x.item_id === r.item_id);
    target.item = o;
    if (reassigned) target.assigned = reassigned.to;
    target.revised = [...(target.revised || []), { kind, what, to: r.to ?? null, reassigned,
      solver: "KEPT: " + prior + " (no new call, PROMPT-119 s1)",
      ruled_in: r.ruled_in || spec._ruled_in || null }];
    target.kept_verdict = { state: prior, why: r.why || "declared keep_verdict" };
    console.log("    VERDICT KEPT  solver " + prior + " (no model call)   $" + usd().toFixed(3));
    results.push({ id: r.item_id, outcome: "accept (verdict kept)", to: what });
    continue;
  }
  if (!APPLY) { results.push({ id: r.item_id, outcome: "dry: gates pass" }); continue; }
  if (usd() > MAXUSD) {
    console.log("    STOPPED: $" + usd().toFixed(2) + " is over the --max-usd ceiling of $" + MAXUSD);
    results.push({ id: r.item_id, outcome: "ceiling reached, not solved" }); continue;
  }

  /* the solver, twice. Passages: the task's map plus the item's own anchor. */
  const want = [...map.primary, ...map.supporting,
    { source_id: o.source_id, edition: o.edition, clause: o.key_support_clause }];
  const seen = new Set(); const ps = [];
  for (const k of want) {
    if (!k || !k.source_id) continue;
    const sig = k.source_id + "|" + k.edition + "|" + k.clause;
    if (seen.has(sig)) continue; seen.add(sig);
    const p = ctx.index.get(k.source_id, k.edition, String(k.clause));
    if (p) ps.push(p);
  }
  if (!ps.length) { console.log("    REFUSED: no passages for the solver"); results.push({ id: r.item_id, outcome: "no passages" }); continue; }
  const bp = blindPayload(o);
  assertBlind(bp, o);
  const ki = (o.options || []).findIndex((x) => x.is_correct === true);
  const keyLabel = String.fromCharCode(65 + ki);
  const prompt = solverUser(bp, ps);
  if (!PRINTED) {
    PRINTED = true;
    console.log("");
    console.log("  ---- FULL SOLVER PROMPT, FIRST ITEM (standing rule, PROMPT-115) ----");
    console.log("  SYSTEM: " + SOLVER_SYSTEM.replace(/\n/g, "\n  "));
    console.log("  USER:   " + prompt.replace(/\n/g, "\n  "));
    console.log("  ---- END PROMPT ----");
    console.log("");
  }
  const s1 = solverVerdict(parseObj(await claude(SOLVER_SYSTEM, prompt)), keyLabel);
  const s2 = solverVerdict(parseObj(await claude(SOLVER_SYSTEM, prompt)), keyLabel);
  const ok = s1.state === s2.state && s1.state === "accepted";
  console.log("    solver " + s1.state + "/" + s2.state + "   " + (ok ? "ACCEPT" : "DROP (a split or a miss is not a pass)") +
    "   $" + usd().toFixed(3));
  if (ok) {
    const target = items.find((x) => x.item_id === r.item_id);
    target.item = o;
    if (reassigned) target.assigned = reassigned.to;
    target.revised = [...(target.revised || []), { kind, what, to: r.to ?? null,
      reassigned, solver: [s1.state, s2.state], ruled_in: r.ruled_in || spec._ruled_in || null }];
    /* a RESCUED item was not a survivor; it becomes one, or the insert's accept list cannot name it */
    if (target.verdict !== "survivor" && r.rescue === true) {
      console.log("    verdict " + target.verdict + " -> survivor (rescued, " +
        (r.ruled_in || spec._ruled_in || "declared in the spec") + ")");
      target.rescued_from_verdict = target.verdict;
      target.verdict = "survivor";
      target.code_passed = true;
      target.failed = [];
    }
    results.push({ id: r.item_id, outcome: "accept", to: r.to?.clause ?? what });
  } else {
    results.push({ id: r.item_id, outcome: "solver " + s1.state + "/" + s2.state });
  }
}

console.log("");
for (const x of results) console.log("  " + x.id + "  " + x.outcome + (x.to ? "   " + x.to : ""));
const tally = {};
for (const x of results) tally[x.outcome.split(":")[0]] = (tally[x.outcome.split(":")[0]] || 0) + 1;
console.log("  " + JSON.stringify(tally));
console.log("  spend $" + usd().toFixed(4) + " over " + CALLS + " call(s), ceiling $" + MAXUSD);
if (APPLY) {
  const rounds = [...(art.revision_rounds || []), { spec: SPECFILE, results }];
  writeFileSync(join(ROOT, IN), JSON.stringify({ ...art, revision_rounds: rounds }, null, 1) + "\n");
  console.log("  wrote " + IN);
} else {
  console.log("");
  console.log("DRY RUN. Nothing written and no solver call made. Re-run with --apply.");
}
