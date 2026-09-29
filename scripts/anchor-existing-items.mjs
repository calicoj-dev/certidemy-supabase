/**
 * anchor-existing-items.mjs -- can an existing item's key claim be ANCHORED in the passages its
 * task is examined against? MEASUREMENT ONLY.
 *
 * READ-ONLY on the bank. There is no `--apply` and passing one exits 2: an instrument that
 * disagrees with an item must not be able to change it.
 *
 * ============ WHY THIS AND NOT THE SOLVER ============
 *
 * The blind solver was measured against the director's read of 40 AIMS-F items and recalled
 * 5 of his 14 -- and it MISSED A TIER A, `1dddb20e`, the invented "drift incident" control, by
 * reasoning its way to the key from B.6.2.6. A model asked whether it can reach the key will
 * usually find a way to. About 36 percent recall with a missed wrong key does not qualify it as
 * triage.
 *
 * The instrument that works is the one the generator already uses: ANCHOR OR FLAG. The model is
 * not asked whether the item is right. It is asked to produce the SENTENCE that supports the
 * key, copied exactly, from the passages the task is examined against -- and then code checks
 * the pointing:
 *
 *   clause-exists     the named clause is in the library
 *   verbatim          the sentence is really in that passage
 *   modal-fidelity    a "must" claim needs a shall; this is exactly what catches the two
 *                     "can include" -> "must" inflations, ab6263f0 and dd09940d
 *   anchor-is-primary the clause is what the TASK examines, not a neighbour
 *
 * AN ITEM NOBODY CAN ANCHOR IS FLAGGED. A claim with no passage behind it is precisely what
 * `1dddb20e` and `b97b25ea` are -- an invented control and an invented definition. Neither needs
 * a model's opinion; both need somebody to fail to find the sentence.
 *
 * ============ AND THREE STATES, NOT TWO ============
 *
 *   ANCHORED            the pointing holds
 *   FLAGGED             it does not, and the reason names which gate
 *   CANNOT BE CHECKED   the task is on hold (5.5 needs ISO/IEC 42006), or the claim rests on a
 *                       source we do not hold (the EU AI Act). NOT a flag and NOT a pass.
 *
 * Folding the third into FLAGGED would blame an item for a purchasing decision; folding it into
 * ANCHORED would clear an item nothing checked.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { gateClauseExists, gateVerbatim, gateModalFidelity, gateAnchorIsPrimary, normClause,
  groundedGateControls } from "./lib/grounded-gates.mjs";
import { blindPayload, assertBlind, solverUser, solverVerdict, SOLVER_SYSTEM,
  blindSolverControls } from "./lib/blind-solver.mjs";
import { AUDIT480_TIER_A, AUDIT480_TIER_B, AUDIT480_TIER_C, AUDIT480_TIER_D,
  AUDIT480_TIER_E } from "./lib/audit-480-findings.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let CERT = "AIMS-F", PINNED = false, LEGACY_KEYING = false, ALL_SECURE = false;
for (const a of process.argv.slice(2)) {
  const m = /^--cert=(.+)$/.exec(a);
  if (m) { CERT = m[1]; continue; }
  if (a === "--pinned") { PINNED = true; continue; }
  if (a === "--legacy-keying") { LEGACY_KEYING = true; continue; }
  if (a === "--all-secure") { ALL_SECURE = true; continue; }
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY and MEASURE-ONLY.");
  console.error("There is no --apply: an instrument that disagrees with an item must not be able");
  console.error("to change it.");
  process.exitCode = 2; process.exit();
}

/* ---------------------------------------------------------------- controls first */
{
  const g = groundedGateControls(), s = blindSolverControls();
  const fails = [...g.fails, ...s.fails];
  if (fails.length) {
    console.error("REFUSING TO RUN -- the gates' own controls fail:");
    for (const f of fails) console.error("  " + f);
    process.exitCode = 2; process.exit();
  }
  console.log("controls: gates " + g.examined + ", solver " + s.examined + " -- all pass");
}

function env(k) {
  try {
    for (const line of readFileSync(join(HERE, ".env"), "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (m && m[1] === k && !process.env[k]) return m[2].replace(/^["']|["']$/g, "").trim();
    }
  } catch { /* no .env */ }
  return process.env[k];
}
const ANTHROPIC_API_KEY = env("ANTHROPIC_API_KEY");
if (!ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY not found"); process.exitCode = 2; process.exit(); }
const MODEL = process.env.GROUNDED_MODEL || "claude-opus-5";

async function claude(system, user, maxTokens = 1800) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
      });
      if (!res.ok) throw new Error("Anthropic " + res.status + ": " + (await res.text()).slice(0, 200));
      const d = await res.json();
      return (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    } catch (e) {
      if (attempt >= 3) throw e;
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }
}
const parseObject = (t) => {
  const s = String(t || ""); const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
};

/* ---------------------------------------------------------------- the findings, all shapes */
const tierOf = new Map();
const put = (cert, id, tier) => { if (cert === CERT) tierOf.set(String(id).slice(0, 8), tier); };
const eat = (node, tier) => {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const r of node) {
      if (Array.isArray(r)) put(r[0], r[1], tier);
      else if (r && typeof r === "object") put(r.cert, r.id, tier);
    }
    return;
  }
  if (typeof node === "object") for (const v of Object.values(node)) eat(v, tier);
};
eat(AUDIT480_TIER_A, "A"); eat(AUDIT480_TIER_B, "B");
eat(AUDIT480_TIER_C, "C"); eat(AUDIT480_TIER_D, "D"); eat(AUDIT480_TIER_E, "E");
const dirAB_ids = [...tierOf].filter(([, t]) => t === "A" || t === "B").map(([k]) => k);
if (dirAB_ids.length < 2) {
  console.error("REFUSING TO RUN: only " + dirAB_ids.length + " Tier A/B finding(s) attached for " +
    CERT + ". The loader has read one shape of three before, twice.");
  process.exitCode = 2; process.exit();
}
console.log("findings for " + CERT + ": " + tierOf.size + " attached, " + dirAB_ids.length + " Tier A/B");

/* ---------------------------------------------------------------- the sample */
const sampleMd = readFileSync(join(ROOT, "AUDIT-SAMPLE.md"), "utf8");
const sampled = [];
for (const line of sampleMd.split(/\r?\n/)) {
  const m = /^###\s+(\d+)\.\s+(\S+)\s+·\s+(\S+)\s+·\s+task\s+(\S+)\s+·\s+`([0-9a-f]{8})`/.exec(line);
  if (m && m[2] === CERT) sampled.push({ n: Number(m[1]), task: m[4], prefix: m[5] });
}
if (!ALL_SECURE && sampled.length !== 40) {
  console.error("parsed " + sampled.length + " " + CERT + " rows from AUDIT-SAMPLE.md, expected 40.");
  console.error("An empty or short parse is a fact about the parser until something proves otherwise.");
  process.exitCode = 2; process.exit();
}

/* ---------------------------------------------------------------- library and the task map */
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const annexGaps = lib.annex_gaps || [];
const seqGaps = lib.sequence_gaps || [];
let declaredGaps = [];
try {
  const compl = JSON.parse(readFileSync(join(ROOT, "LIBRARY-COMPLETENESS.json"), "utf8"));
  declaredGaps = (compl.sources || []).map((s) => ({ holes: s.missing || [] }));
} catch { /* reported below */ }
const passagesByKey = new Map(lib.passages.map((p) => [p.source_id + "|" + p.clause, p]));

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq." + CERT);
const cid = certs[0].id;
const allTasks = await getAll(KEY, "tasks?select=id,certification_id,code,statement&order=code");
const tasks = allTasks.filter((t) => t.certification_id === cid);
const taskById = new Map(tasks.map((t) => [t.id, t]));
const taskIdOfCode = new Map(tasks.map((t) => [t.code, t.id]));

const tsRows = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id");
const pById = new Map((await getAll(KEY, "source_passages?select=id,source_id,edition,clause,title,text,normative&order=id"))
  .map((r) => [r.id, r]));
/* the pinned-parse record: read under --pinned, written otherwise */
const PARSE_FILE = join(ROOT, "ANCHOR-PARSE-" + CERT + (ALL_SECURE ? "-all-secure" : "") + ".json");
const pinned = new Map();
const parseOut = {};
if (PINNED) {
  if (!existsSync(PARSE_FILE)) {
    console.error("--pinned needs " + PARSE_FILE + ", which does not exist.");
    console.error("Run once WITHOUT --pinned to record the parse, then re-run with it.");
    process.exitCode = 2; process.exit();
  }
  const prior = JSON.parse(readFileSync(PARSE_FILE, "utf8"));
  if (prior.cert !== CERT) {
    console.error("that parse file is for " + prior.cert); process.exitCode = 2; process.exit();
  }
  for (const [k, v] of Object.entries(prior.parses || {})) pinned.set(k, v);
  console.log("PINNED PARSE: " + pinned.size + " persisted anchor(s) from " + prior.recorded +
    " (model " + prior.model + "). No anchoring call will be made.");
}

const mapByTask = new Map();
for (const r of tsRows) {
  if (!mapByTask.has(r.task_id)) mapByTask.set(r.task_id, { primary: [], supporting: [] });
  const p = pById.get(r.passage_id);
  if (p) mapByTask.get(r.task_id)[r.role].push(p);
}
if (!tsRows.length) {
  console.error("REFUSING TO RUN: task_sources is empty, so no anchor could be checked against a");
  console.error("primary passage. Run scripts/write-task-sources.mjs --apply first.");
  process.exitCode = 3; process.exit();
}

const rows = await getAll(KEY,
  "quiz_questions?select=id,task_id,question_text,options,correct_answer,explanation,status,retired_at,pool" +
  "&certification_id=eq." + cid + "&language=eq.en&order=id");

/* ============ --all-secure: THE WHOLE LIVE BANK, NOT THE 40-ITEM SAMPLE ============
 *
 * The sample answers "what is the defect rate". This answers a different question the director asked
 * before a rebuild: WHICH INDIVIDUAL ITEMS SURVIVE. An item is kept only if it anchors cleanly AND
 * the blind solver picks its key, and generation then fills only the shortfall per task -- so the
 * unit has to be every live secure English item, not a sample of them.
 *
 * The sample list is replaced rather than extended: a run over the whole bank includes the 40, and
 * carrying both would double-count them. `sampled` keeps its shape so nothing downstream changes,
 * and the director's tier annotations still attach where a prefix matches. */
if (ALL_SECURE) {
  const live = rows.filter((r) => r.pool === "secure" && r.status === "approved" && !r.retired_at);
  sampled.length = 0;
  let n = 0;
  for (const r of live) {
    const t = taskById.get(r.task_id);
    sampled.push({ n: ++n, task: t ? t.code : "(no task)", prefix: String(r.id).slice(0, 8) });
  }
  const byTask = new Map();
  for (const s of sampled) byTask.set(s.task, (byTask.get(s.task) || 0) + 1);
  console.log("--all-secure: " + sampled.length + " live secure English item(s) across " +
    byTask.size + " task(s) -- the whole bank, not the 40-item sample");
  if (!sampled.length) {
    console.error("no live secure English items for " + CERT + " -- nothing to audit.");
    process.exitCode = 2; process.exit();
  }
}

/* ---------------------------------------------------------------- the ask */
const ANCHOR_SYSTEM = `You are given some passages from a published standard and one
multiple-choice question WITH its key marked.

You are NOT asked whether the item is correct. You are asked to ANCHOR it: find the sentence in
the supplied passages that supports the key, and copy it EXACTLY.

Return ONE JSON object and nothing else:

{
  "key_claim": "one sentence: what the key asserts",
  "key_support_clause": "9.2.2",
  "key_support": "a sentence or clause fragment copied CHARACTER FOR CHARACTER from that passage",
  "rests_on_unheld_source": null,
  "cannot_anchor_reason": null
}

RULES
- Copy "key_support" exactly. Do not tidy it, shorten it, or join two sentences. Code checks it
  against the passage verbatim.
- Use ONLY the supplied passages. They are the ones this task is examined against.
- If no supplied passage supports the key, set "key_support" to null and say why in
  "cannot_anchor_reason". THAT IS A CORRECT AND USEFUL ANSWER. Do not stretch a passage to fit.
- If the key rests on a document that is not among the passages -- the EU AI Act, ISO/IEC 42006,
  ISO/IEC 17021, ITIL, a national law -- name it in "rests_on_unheld_source". That is not a
  defect in the item; it is a source we do not hold.`;

function anchorUser(item, keyLabel, primary) {
  const src = primary.map((p) =>
    "--- " + p.source_id + " clause " + p.clause + (p.title ? " (" + p.title + ")" : "") +
    "  [this clause is " + p.normative + "] ---\n" + p.text).join("\n\n");
  const opts = item.options.map((o, i) =>
    String.fromCharCode(65 + i) + ") " + o.text + (i === item.options.findIndex((x) => x.is_correct) ? "   <- KEY" : ""));
  return "PASSAGES THIS TASK IS EXAMINED AGAINST\n\n" + src +
    "\n\nITEM\n\n" + item.question_text + "\n\n" + opts.join("\n") +
    (item.explanation ? "\n\nEXPLANATION AS WRITTEN\n" + item.explanation : "");
}

/* ---------------------------------------------------------------- run */
const out = [];
console.log("");
console.log("ANCHOR OR FLAG  --  " + CERT + ", " + sampled.length + " items, measure only");
console.log("");
for (const s of sampled) {
  const hits = rows.filter((r) => String(r.id).startsWith(s.prefix));
  const base = { n: s.n, prefix: s.prefix, director_tier: tierOf.get(s.prefix) || null, task: s.task };
  if (hits.length !== 1) {
    out.push({ ...base, state: "cannot-be-checked",
      reason: "the prefix matched " + hits.length + " live rows (a retired item is expected here)" });
    continue;
  }
  const row = hits[0];
  const t = taskById.get(row.task_id);
  const code = t ? t.code : s.task;
  const map = mapByTask.get(row.task_id) || { primary: [], supporting: [] };

  if (!map.primary.length) {
    out.push({ ...base, task: code, state: "cannot-be-checked",
      reason: "task " + code + " has no primary passages -- it is on HOLD by ruling (5.5 needs " +
        "ISO/IEC 42006 and 17021-1). Nothing could be checked, which is not a pass and not a flag" });
    continue;
  }

  const opts = Array.isArray(row.options) ? row.options : [];
  const ca = row.correct_answer;
  let ki = -1;
  if (Array.isArray(ca) && ca.length) ki = opts.findIndex((o) => o && String(o.id) === String(ca[0]));
  else if (typeof ca === "string") ki = opts.findIndex((o) => o && String(o.id) === ca);
  else if (Number.isInteger(Number(ca))) ki = Number(ca);
  if (!opts.length || ki < 0 || !opts[ki]) {
    out.push({ ...base, task: code, state: "cannot-be-checked",
      reason: "the key could not be resolved: correct_answer=" + JSON.stringify(ca) });
    continue;
  }
  const item = {
    question_text: row.question_text,
    options: opts.map((o, i) => ({ text: String((o && o.text) || ""), is_correct: i === ki })),
    explanation: row.explanation,
  };
  const keyLabel = String.fromCharCode(65 + ki);

  /* ============ THE PARSE IS PINNED, SO A RE-RUN IS A BEFORE/AFTER ============
   *
   * This measure asks a model for each item's anchor on every run, so the GATES' INPUTS move between
   * runs. The last re-run moved five items and only one was the gate change: `87d03b82` re-anchored
   * from B.7.4 to A.7.4 and cleared, and `b965acf2` kept the same clause 6.1.3, quoted a different
   * support sentence, and flipped the other way. An aggregate delta over that is unattributable, and
   * this repository's own rule is to change ONE thing.
   *
   * So each item's parsed anchor is persisted to `ANCHOR-PARSE-<CERT>.json`, and `--pinned` re-gates
   * from it with no model call. A gate change is then measured against identical inputs. The pin
   * file is a RECORD OF A PARSE, not a result: it carries the model and the date, and a run that
   * writes it says so, because a cached input silently reused is its own defect. */
  let parsed = null, err = null;
  if (PINNED) {
    parsed = pinned.get(base.prefix) || null;
    if (!parsed) {
      out.push({ ...base, task: code, state: "cannot-be-checked",
        reason: "--pinned: no persisted parse for this item. Run once without --pinned first." });
      continue;
    }
  } else {
    try { parsed = parseObject(await claude(ANCHOR_SYSTEM, anchorUser(item, keyLabel, map.primary))); }
    catch (e) { err = String(e.message).slice(0, 160); }
    if (parsed) parseOut[base.prefix] = parsed;
  }
  if (!parsed) {
    out.push({ ...base, task: code, state: "cannot-be-checked",
      reason: "the anchoring call " + (err ? "failed: " + err : "returned nothing parseable") });
    continue;
  }
  if (parsed.rests_on_unheld_source) {
    /* ============ "NOT AMONG THE PASSAGES I GAVE YOU" IS NOT "A SOURCE WE DO NOT HOLD" ============
     *
     * The first version took this field at face value and it cost eight real catches. Asked to
     * anchor within a task's PRIMARY passages, the model reports anything outside that set as an
     * unheld source -- and eight of the twelve missed Tier A/B items came back "cannot be
     * checked" with reasons naming ISO/IEC 42001 clause 9.3, clause 7.5, Annex A.7. Those are IN
     * THE LIBRARY. They are simply not what the task examines, which is the off-task finding the
     * anchor gate exists to make, recorded instead as an excuse.
     *
     * So the claim is TESTED against the library rather than believed. If the named source is one
     * the library holds, the item is FLAGGED -- its key rests on a clause this task does not
     * examine. Only a source the library genuinely lacks is cannot-be-checked. */
    const said = String(parsed.rests_on_unheld_source);
    const heldSourceNamed = [...new Set(lib.passages.map((p) => p.source_id))]
      .filter((sid) => {
        const num = (sid.match(/\d{4,5}/) || [])[0];
        return (num && said.includes(num)) || (sid === "Scrum Guide" && /scrum/i.test(said));
      });
    if (heldSourceNamed.length) {
      out.push({ ...base, task: code, state: "flag", kind: "off-task anchor",
        key_claim: parsed.key_claim || null, rests_on: said,
        reason: "the key rests on " + said + " -- the library HOLDS " + heldSourceNamed.join(", ") +
          ", so this is not an unheld source: the clause is not what task " + code + " examines" });
      continue;
    }
    out.push({ ...base, task: code, state: "cannot-be-checked",
      rests_on: said,
      key_claim: parsed.key_claim || null,
      reason: "the key rests on " + said + ", which the library does not hold" });
    continue;
  }
  if (!parsed.key_support || !parsed.key_support_clause) {
    out.push({ ...base, task: code, state: "flag", kind: "no anchor found",
      key_claim: parsed.key_claim || null,
      reason: "no supplied passage supports the key: " +
        (parsed.cannot_anchor_reason || "no reason given") });
    continue;
  }

  /* ---- the same code gates as the generator ---- */
  /* ============ KEYED BY (SOURCE, CLAUSE), BECAUSE A CLAUSE ADDRESS IS NOT A KEY ============
   *
   * This map was keyed on the clause ALONE, so a same-numbered clause from a second standard
   * silently overwrote the first and a gate then compared an anchor against the WRONG document's
   * text. Measured on AIMS-F before the fix -- 7 collisions across 3 tasks:
   *
   *   task 1.4   4.4                      ISO/IEC 27001 vs ISO/IEC 42001
   *   task 3.7   7.1 7.2 7.3 7.4 8.1      ISO/IEC 42001 vs ISO/IEC 27001
   *   task 5.6   9.2.2                    ISO/IEC 42001 vs ISO/IEC 27001
   *
   * The harmonised management-system structure guarantees this for every auditor certification, and
   * this repository already records the rule: the key is (standard, address), never the address.
   *
   * ============ AND THE TASK'S OWN STANDARDS DISAMBIGUATE ============
   *
   * A model naming a bare `7.2` has not said which document. Resolving it needs a preference order,
   * and the task's own linked passages ARE that order: the standard a task actually draws on is the
   * one it means. So a bare address resolves against the sources this task links to, in the order
   * they appear in its map, and a resolution through more than one candidate is RECORDED rather than
   * silently taking the first -- an ambiguity nobody is told about is how the old collisions hid. */
  const primaryClauses = map.primary.map((p) => p.clause);
  const supportingClauses = map.supporting.map((p) => p.clause);
  const taskSources = [...new Set([...map.primary, ...map.supporting].map((p) => p.source_id))];
  const byKeyForSource = new Map();
  for (const p of [...map.primary, ...map.supporting]) {
    byKeyForSource.set(p.source_id + "|" + p.clause, p);
  }
  /* A bare clause is ALSO offered under its plain address, but only where exactly ONE of this
   * task's standards holds it. Where two do, the plain key is deliberately left unset so the gate
   * reports "not in the library" instead of quietly answering from the wrong standard -- a loud
   * refusal beats a silent wrong answer, which is the whole lesson of the view-first deploy. */
  const ambiguous = [];
  if (LEGACY_KEYING) {
    /* ============ THE OLD BEHAVIOUR, KEPT SO THE FIX CAN BE MEASURED ============
     *
     * `--legacy-keying` reproduces exactly what this did before: one entry per clause, LAST WRITE
     * WINS, so a same-numbered clause from a second standard silently replaced the first. It exists
     * only so the keying change can be run against the SAME pinned parse -- one thing changed, which
     * is the only way the delta means anything. It is not a fallback and nothing else uses it. */
    for (const p of [...map.primary, ...map.supporting]) byKeyForSource.set(p.clause, p);
  } else {
    const byClause = new Map();
    for (const p of [...map.primary, ...map.supporting]) {
      if (!byClause.has(p.clause)) byClause.set(p.clause, []);
      if (!byClause.get(p.clause).some((q) => q.source_id === p.source_id)) {
        byClause.get(p.clause).push(p);
      }
    }
    for (const [clause, ps] of byClause) {
      if (ps.length === 1) byKeyForSource.set(clause, ps[0]);
      else ambiguous.push(clause + " (" + ps.map((p) => p.source_id).join(" vs ") + ")");
    }
  }
  /* ============ AND THE ITEM'S OWN CLAUSE FIELD BREAKS A TIE ============
   *
   * Where two of the task's standards hold the same address, the plain key is unset above. But the
   * item usually SAYS which document -- `ISO/IEC 42006 clause 1`, `ISO/IEC 27001 7.2` -- and
   * `normClause` throws that away on its way to the address. So the source is read off the same
   * field and, when it names one of this task's standards, it resolves the tie for THIS item.
   *
   * This is the narrowest fix that leaves the gate contract alone: the gates still look up a plain
   * address, and the call site decides which document that address means. Re-keying the gates
   * themselves would change the generator's credential path and is a separate change. */
  {
    const raw = String((parsed && parsed.key_support_clause) || "");
    const named = taskSources.find((s) => {
      const bare = s.replace(/^ISO(\/IEC)?\s*/, "").replace(/[-:]/g, "[-: ]?");
      return new RegExp("ISO(/IEC)?\\s*" + bare, "i").test(raw);
    });
    if (named) {
      const addr = normClause(raw);
      const p = byKeyForSource.get(named + "|" + addr);
      if (p) byKeyForSource.set(addr, p);
    }
  }
  void taskSources;
  const candidate = { ...item, key_support: parsed.key_support, key_support_clause: parsed.key_support_clause };
  const gates = [
    gateClauseExists(candidate, byKeyForSource, annexGaps, [...seqGaps, ...declaredGaps]),
    gateVerbatim(candidate, byKeyForSource),
    gateModalFidelity(candidate, byKeyForSource),
    gateAnchorIsPrimary(candidate, primaryClauses, supportingClauses),
  ];
  const failed = gates.filter((g) => g.pass === false);
  const unasserted = gates.filter((g) => g.pass === null);

  /* ---- the blind solver, as a SECOND and SEPARATE signal ---- */
  let solver = null;
  try {
    const payload = blindPayload(item);
    assertBlind(payload, item);
    solver = solverVerdict(parseObject(await claude(SOLVER_SYSTEM,
      solverUser(payload, map.primary), 1500)), keyLabel);
  } catch (e) { solver = { state: "could-not-run", reason: String(e.message).slice(0, 140) }; }

  const rec = {
    ...base, task: code,
    key_claim: parsed.key_claim || null,
    anchor: { clause: normClause(parsed.key_support_clause), support: parsed.key_support },
    gates: gates.map((g) => ({ id: g.id, pass: g.pass, reason: g.reason })),
    solver,
    state: failed.length ? "flag" : unasserted.length ? "cannot-be-checked" : "anchored",
    kind: failed.length ? failed.map((g) => g.id).join(", ") : null,
    reason: failed.length ? failed.map((g) => g.id + ": " + g.reason).join("; ")
      : unasserted.length ? unasserted.map((g) => g.id + ": " + g.reason).join("; ")
      : "anchored in " + normClause(parsed.key_support_clause) + ", verbatim, modal consistent",
  };
  out.push(rec);
  console.log("  #" + String(rec.n).padEnd(4) + rec.prefix + "  " + (rec.director_tier || "-") + "  " +
    rec.state.padEnd(18) + (rec.kind ? rec.kind + " -- " : "") + String(rec.reason).slice(0, 72));
}

/* ---------------------------------------------------------------- compare */
const flags = out.filter((o) => o.state === "flag");
const anchored = out.filter((o) => o.state === "anchored");
const unchecked = out.filter((o) => o.state === "cannot-be-checked");
const dirAB = out.filter((o) => o.director_tier === "A" || o.director_tier === "B");
const caught = dirAB.filter((o) => o.state === "flag");
const missed = dirAB.filter((o) => o.state !== "flag");
const extra = flags.filter((o) => !o.director_tier);
const extraLesser = flags.filter((o) => o.director_tier && o.director_tier !== "A" && o.director_tier !== "B");
const solverFlags = out.filter((o) => o.solver && o.solver.state === "rejected");
const solverCaught = dirAB.filter((o) => o.solver && o.solver.state === "rejected");

console.log("");
console.log("RESULT  --  anchor or flag");
console.log("  anchored (the pointing holds)     " + anchored.length);
console.log("  FLAGGED                           " + flags.length);
console.log("  cannot be checked                 " + unchecked.length +
  "   (held task, unheld source, or the key could not be resolved)");
/* ============ HIS 14 ARE TWO DIFFERENT QUESTIONS, AND ONLY ONE IS THE ANCHOR'S ============
 *
 * Five of the twelve AIMS-F Tier B findings are recorded as "contested" -- an arguable second
 * option. That is a defect in the DISTRACTORS, and anchoring cannot see it by construction:
 * the key of a contested item is perfectly well supported, which is why it anchors. The
 * instrument for a second defensible option is the BLIND SOLVER, which is why the ruling keeps
 * both and runs them separately.
 *
 * So recall is reported against BOTH denominators. Against 14 alone it understates what
 * anchoring does; against 9 alone it flatters it. The reason is read off the declaration rather
 * than judged here. */
const reasonOf = new Map();
{
  const eatReason = (node) => {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const r of node) {
        if (Array.isArray(r)) { if (r[0] === CERT) reasonOf.set(String(r[1]).slice(0, 8), String(r[2] || "")); }
        else if (r && typeof r === "object") { if (r.cert === CERT) reasonOf.set(String(r.id).slice(0, 8), String(r.why || "")); }
      }
      return;
    }
    if (typeof node === "object") for (const v of Object.values(node)) eatReason(v);
  };
  for (const t of [AUDIT480_TIER_A, AUDIT480_TIER_B]) eatReason(t);
}
const isContested = (p) => /^contested$/i.test((reasonOf.get(p) || "").trim());
const anchorable = dirAB.filter((o) => !isContested(o.prefix));
const contested = dirAB.filter((o) => isContested(o.prefix));
const caughtAnchorable = anchorable.filter((o) => o.state === "flag");
const solverCaughtContested = contested.filter((o) => o.solver && o.solver.state === "rejected");

console.log("");
console.log("  HIS " + dirAB.length + " FINDINGS ARE TWO QUESTIONS");
console.log("    a named defect in the KEY or its clause   " + anchorable.length +
  "   <- what ANCHOR-OR-FLAG can address");
console.log("    \"contested\": an arguable distractor        " + contested.length +
  "   <- what the BLIND SOLVER is for; the key of a contested item is supported, so it anchors");
console.log("");
console.log("    anchor-or-flag on the " + anchorable.length + " anchorable   " + caughtAnchorable.length + " / " + anchorable.length +
  (caughtAnchorable.length ? "   " + caughtAnchorable.map((o) => o.prefix).join(", ") : ""));
console.log("    blind solver on the " + contested.length + " contested     " + solverCaughtContested.length + " / " + contested.length);

console.log("");
console.log("  AGAINST THE DIRECTOR'S " + dirAB.length + " TIER A/B ITEMS IN THIS SAMPLE");
console.log("    caught by ANCHOR-OR-FLAG        " + caught.length + " / " + dirAB.length +
  (caught.length ? "   " + caught.map((o) => o.prefix).join(", ") : ""));
console.log("    caught by the BLIND SOLVER      " + solverCaught.length + " / " + dirAB.length +
  "   (the second, separate signal)");
console.log("    missed by both                  " +
  dirAB.filter((o) => o.state !== "flag" && !(o.solver && o.solver.state === "rejected")).length);
console.log("");
console.log("  EACH MISS, WITH ITS REASON:");
for (const o of missed) {
  console.log("    #" + o.n + " " + o.prefix + " [" + o.director_tier + "] " + o.state +
    (o.solver ? " / solver " + o.solver.state : ""));
  console.log("        " + String(o.reason).replace(/\s+/g, " ").slice(0, 150));
}
console.log("");
console.log("  FLAGGED AND NOT IN THE DIRECTOR'S LIST  " + extra.length);
for (const o of extra) {
  console.log("    #" + o.n + " " + o.prefix + "  " + (o.kind || "") + " -- " +
    String(o.reason).replace(/\s+/g, " ").slice(0, 110));
}
console.log("  FLAGGED AND CARRYING A LESSER TIER      " + extraLesser.length +
  (extraLesser.length ? "   " + extraLesser.map((o) => "#" + o.n + " " + o.director_tier).join(", ") : ""));
console.log("");
console.log("  THE BLIND SOLVER, AS A SEPARATE SIGNAL  " + solverFlags.length + " rejection(s)");
console.log("  NOT A RATE where the denominator is small: " + dirAB.length + " findings is " +
  dirAB.length + " observations.");

if (!PINNED) {
  /* the parse is recorded as a RECORD, with the model and the date, so a later --pinned run can say
   * what it is re-gating and nobody mistakes a cached input for a result. */
  writeFileSync(PARSE_FILE, JSON.stringify({ cert: CERT, model: MODEL,
    recorded: new Date().toISOString().slice(0, 19) + "Z",
    note: "A RECORD OF A PARSE, not a result. --pinned re-gates from this with no model call.",
    parses: parseOut }, null, 1) + String.fromCharCode(10), "utf8");
  console.log("  recorded " + Object.keys(parseOut).length + " parse(s) to " +
    "ANCHOR-PARSE-" + CERT + ".json");
}
const OUT_NAME = "ANCHOR-OR-FLAG-" + CERT + (LEGACY_KEYING ? "-legacy" : "") +
  (ALL_SECURE ? "-all-secure" : "") + ".json";
writeFileSync(join(ROOT, OUT_NAME), JSON.stringify({
  certification: CERT, model: MODEL, method: "anchor or flag, primary passages only, code gates decide",
  sampled: sampled.length,
  anchored: anchored.length, flagged: flags.length, cannot_be_checked: unchecked.length,
  director_tier_ab: dirAB.length,
  caught_by_anchor: caught.length, caught_by_solver: solverCaught.length,
  anchorable: anchorable.length, contested: contested.length,
  caught_of_anchorable: caughtAnchorable.length, solver_caught_of_contested: solverCaughtContested.length,
  extra_flags: extra.length, extra_lesser_tier: extraLesser.length,
  items: out,
}, null, 1) + "\n", "utf8");
console.log("");
console.log("wrote " + OUT_NAME);
