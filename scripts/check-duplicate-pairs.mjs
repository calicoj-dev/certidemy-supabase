#!/usr/bin/env node
/**
 * READ-ONLY, NO MODEL CALLS. For each DECLARED same-fact pair, does the enemy rule keep the two items
 * off one form?
 *
 * Ruled PROMPT-117 s1: for Foundation, a same-fact item on a different task or with a different
 * scenario is acceptable WHEN the enemy rule separates the pair. A pair it does not separate means the
 * later item is rejected. So the question is answered by the module `generate-mock-exam` imports, not
 * by comparing clause strings here -- a second copy of that normalisation is how the answer drifts from
 * what the assembler actually does.
 *
 * Each side may be LIVE (a uuid or an 8-char item_grounding prefix) or an artifact item id. The script
 * resolves both and says which, because "separated" means nothing if it compared the wrong rows.
 *
 *   --pairs=<file.json>   the declared pairs. Required.
 *   --cert=<CODE>         default ISMS-F
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { enemyKeyOf, enemyReason, markEnemy, freshUsed, optionKeys, OPTION_TEXT_FLOOR,
  enemyRuleControls } from "../functions/_shared/item-rules/enemy-rule.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let PAIRS = null, CERT = "ISMS-F";
for (const a of process.argv.slice(2)) {
  let m = a.match(/^--pairs=(.+)$/); if (m) { PAIRS = m[1]; continue; }
  m = a.match(/^--cert=(.+)$/); if (m) { CERT = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --pairs=<file>, --cert=. READ-ONLY.");
  process.exit(2);
}
if (!PAIRS) { console.error("--pairs=<file.json> is required: the pairs are declared, not guessed."); process.exit(2); }

{
  const c = enemyRuleControls();
  const fails = (Array.isArray(c) ? c : c.cases || []).filter((x) => x && x.pass === false);
  const n = Array.isArray(c) ? c.length : (c.examined ?? 0);
  if (!n) { console.error("REFUSING: the enemy-rule controls examined NOTHING -- vacuous."); process.exit(2); }
  if (fails.length) { console.error("REFUSING: enemy-rule controls fail: " + JSON.stringify(fails.map((x) => x.what))); process.exit(2); }
  console.log("enemy-rule controls: " + n + " case(s), all pass   (option-text floor " + OPTION_TEXT_FLOOR + ")");
}

const spec = JSON.parse(readFileSync(join(ROOT, PAIRS), "utf8"));
const KEY = requireKey(HERE);
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
const liveRows = await getAll(KEY, "quiz_questions?select=id,options,task_id,question_text,status," +
  "retired_at&certification_id=eq." + cert.id + "&language=eq.en&retired_at=is.null&order=id");
const grounding = await getAll(KEY, "item_grounding?select=question_id,source_id,edition," +
  "key_support_clause&order=question_id");
const gByQ = new Map(grounding.map((g) => [g.question_id, g]));
const tasks = await getAll(KEY, "tasks?select=id,code");
const codeOf = new Map(tasks.map((t) => [t.id, t.code]));

/* ============ AN ARTIFACT ITEM ID IS NOT A ROW ID ============
 *
 * Artifact ids are content hashes; a live row has a uuid. `<SLUG>-INSERTED.json` is the only record
 * that joins them, so an already-inserted item is looked up THERE first and read from the database.
 * Without this bridge every inserted item would fall through to the artifact and the comparison would
 * be against the pre-insert copy -- which has the writer's key order, not the shuffled one. */
const SLUG = CERT.replace(/-/g, "");
const rowIdOf = new Map();
{
  const p = join(ROOT, SLUG + "-INSERTED.json");
  if (existsSync(p)) {
    for (const b of (JSON.parse(readFileSync(p, "utf8")).batches || [])) {
      for (const r of (b.rows || [])) rowIdOf.set(r.item_id, r.id);
    }
  }
  console.log("inserted-row bridge: " + rowIdOf.size + " artifact id(s) -> live row(s)");
}

/* every artifact named in the spec, loaded once */
const arts = new Map();
const loadArt = (name) => {
  if (!arts.has(name)) arts.set(name, JSON.parse(readFileSync(join(ROOT, name), "utf8")));
  return arts.get(name);
};

/* ============ RESOLUTION SAYS WHERE IT FOUND THE ITEM ============
 *
 * A side is live when a quiz_questions row exists whose id starts with the given prefix; otherwise it is
 * looked for in the named artifact. An id that resolves to neither is an error, never an empty pair:
 * two unresolved sides would "separate" perfectly and report clean. */
function resolve(side) {
  const id = String(side.item_id || side);
  const uuid = rowIdOf.get(id) || id;
  const live = liveRows.filter((r) => r.id === uuid || r.id.startsWith(uuid));
  if (live.length > 1) return { error: id + " matches " + live.length + " live rows" };
  if (live.length === 1) {
    const r = live[0];
    const g = gByQ.get(r.id);
    return { where: "live" + (rowIdOf.has(id) ? " (inserted)" : ""), id: r.id, task: codeOf.get(r.task_id), options: r.options,
      enemy_key: enemyKeyOf(g), stem: r.question_text, status: r.status };
  }
  if (!side.artifact) return { error: id + " is not live and no `artifact` is named for it" };
  const j = loadArt(side.artifact);
  const it = (j.items || []).find((x) => x.item_id === id);
  if (!it) return { error: id + " is not in " + side.artifact };
  const o = it.item || {};
  return { where: side.artifact, id, task: it.task_code,
    options: (o.options || []).map((x, i) => ({ id: String.fromCharCode(97 + i), text: x.text })),
    enemy_key: enemyKeyOf({ source_id: o.source_id, edition: o.edition,
      key_support_clause: o.key_support_clause }),
    stem: o.question_text, status: it.verdict };
}

console.log("");
console.log("DECLARED SAME-FACT PAIRS   " + CERT + "   " + (spec.pairs || []).length + " pair(s)");
console.log("  ruled PROMPT-117 s1: separated by the enemy rule = acceptable; not separated = reject the later item");
console.log("");
const results = [];
for (const p of (spec.pairs || [])) {
  const later = resolve(p.later), earlier = resolve(p.earlier);
  const label = (p.label || "") + "  " + String(p.later.item_id || p.later) + " vs " +
    String(p.earlier.item_id || p.earlier);
  if (later.error || earlier.error) {
    console.log("  REFUSED  " + label);
    if (later.error) console.log("      later:   " + later.error);
    if (earlier.error) console.log("      earlier: " + earlier.error);
    results.push({ label, outcome: "could not resolve" });
    continue;
  }
  /* the EARLIER item goes on the form first, then the later one is offered: that is the direction the
   * assembler runs in, and the rule is not symmetric (the option-text arm reads the later item's
   * options against what is already used). Both directions are reported anyway. */
  const u1 = freshUsed(); markEnemy(earlier, u1);
  const forward = enemyReason(later, u1);
  const u2 = freshUsed(); markEnemy(later, u2);
  const backward = enemyReason(earlier, u2);
  const sharedOpts = optionKeys(later.options).filter((k) => optionKeys(earlier.options).includes(k));
  const sep = !!forward && !!backward;
  console.log("  " + (sep ? "SEPARATED" : "NOT SEPARATED") + "   " + label);
  console.log("      later:   task " + later.task + "  " + later.enemy_key + "   [" + later.where + ", " + later.status + "]");
  console.log("      earlier: task " + earlier.task + "  " + earlier.enemy_key + "   [" + earlier.where + ", " + earlier.status + "]");
  console.log("      enemy reason, later after earlier: " + (forward || "NONE -- they could share a form"));
  console.log("      enemy reason, earlier after later: " + (backward || "NONE -- they could share a form"));
  if (sharedOpts.length) console.log("      shared option text(s): " + sharedOpts.length);
  if (later.task === earlier.task) {
    console.log("      SAME TASK: a true restatement is rejected whatever the enemy rule says (PROMPT-117 s1)");
  }
  results.push({ label, outcome: sep ? "separated" : "NOT separated",
    same_task: later.task === earlier.task, later: later.id, earlier: earlier.id });
}

console.log("");
const notSep = results.filter((r) => r.outcome !== "separated");
console.log("  separated " + results.filter((r) => r.outcome === "separated").length + " of " + results.length +
  (notSep.length ? "   NOT SEPARATED: " + notSep.map((r) => r.label).join("; ") : ""));
console.log("  same task: " + results.filter((r) => r.same_task).length);
if (notSep.length) process.exitCode = 1;
