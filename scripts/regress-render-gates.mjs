/**
 * regress-render-gates.mjs -- run G1-G7 over text the lesson pipeline has ALREADY
 * ACCEPTED, and report every verdict, so a change to the gates can be diffed
 * against a snapshot rather than argued about.
 *
 * READ-ONLY. Unknown flags exit 2.
 *
 * ============ WHY THIS EXISTS ============
 *
 * `render-gates.mjs` G3 is being repaired: its boundary class was built as
 * `const L = "\p{L}\p{N}_"` inside a STRING literal, where `\p` is not an escape,
 * so the lookarounds guarded against nothing and `deve` matched inside `dever`.
 * The repair also widens DEONTIC_EN, which the item sweep found far narrower than
 * its Spanish and Portuguese siblings.
 *
 * Both changes move verdicts IN BOTH DIRECTIONS: fixing the boundaries removes
 * false fires, widening the English list removes more, and including combining
 * marks could in principle add some. **A new refusal on text the pipeline has
 * already accepted is the dangerous direction** and must be read before the fix
 * lands, because the accepted corpus is the only ground truth available.
 *
 * Usage:
 *   node scripts/regress-render-gates.mjs --snapshot=before.json    (capture)
 *   node scripts/regress-render-gates.mjs --against=before.json     (diff)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { runRenderGates } from "./lib/render-gates.mjs";
/* CHECK A AND CHECK B ARE IN SCOPE TOO, because `translation-checks.mjs` carries
 * a SECOND, INDEPENDENT COPY of the same broken boundary class -- `const LW =
 * "\p{L}\p{N}_"` -- under a comment explaining the very defect it commits. The
 * same repair was written twice and was wrong twice. Both are gates the pipeline
 * runs, so both get the same regression before either is touched. */
import { checkModalSentences, checkDefinedTerms, checkClauseVocab } from "./lib/translation-checks.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KNOWN = new Set(["--snapshot", "--against"]);
for (const a of process.argv.slice(2)) {
  if (!KNOWN.has(a.split("=")[0])) {
    console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY, known: " + [...KNOWN].join(", "));
    process.exitCode = 2; process.exit();
  }
}
const arg = (n, d) => {
  const h = process.argv.slice(2).find((a) => a.startsWith(n + "="));
  return h ? h.slice(n.length + 1) : d;
};
const SNAPSHOT = arg("--snapshot", null);
const AGAINST = arg("--against", null);

const TASK_ID = "0fe570da-9789-4830-a82f-c76d0c8a9ee3";
const CONCEPT_SLUG = "auditor-objectivity";
const ITEM_GROUP = "352f63bd-965e-4757-98ac-9792e105a86b";

const KEY = requireKey(HERE);
const subjects = [];

/* ---- batch cda6698a: the 30 renderings applied on 2026-09-25 ---- */
const batch = JSON.parse(readFileSync(join(ROOT, "BATCH1-FINAL.json"), "utf8"));
for (const r of batch.rows) {
  subjects.push({
    set: "batch-cda6698a", label: r.slug + "/" + r.language + "/block" + r.block_index,
    en: String(r.english_source || ""), tr: String(r.to_block || ""), lang: r.language,
  });
}

/* ---- the own-work corrections: task 5.2 skills, the concept, the item ---- */
const rest = async (p) => getAll(KEY, p);
const taskEn = await rest("tasks?select=id,skills&id=eq." + TASK_ID);
const taskTr = await rest("task_translations?select=id,language,skills&task_id=eq." + TASK_ID + "&order=id");
for (const r of taskTr) {
  subjects.push({ set: "own-work", label: "task-5.2/" + r.language + "/skills",
    en: String(taskEn[0].skills || ""), tr: String(r.skills || ""), lang: r.language });
}
const cRows = await rest("concepts?select=id,slug,name,description,certification_id&slug=eq." + CONCEPT_SLUG);
for (const c of cRows) {
  const tr = await rest("concept_translations?select=id,language,name,description&concept_id=eq." + c.id + "&order=id");
  for (const t of tr) {
    subjects.push({ set: "own-work", label: "concept/" + CONCEPT_SLUG + "/" + t.language,
      en: String(c.description || ""), tr: String(t.description || ""), lang: t.language });
  }
}
const items = await rest("quiz_questions?select=id,language,explanation&question_group_id=eq." + ITEM_GROUP + "&retired_at=is.null&order=id");
const itemEn = items.find((i) => i.language === "en");
for (const i of items) {
  if (i.language === "en") continue;
  subjects.push({ set: "own-work", label: "item/" + ITEM_GROUP.slice(0, 8) + "/" + i.language + "/explanation",
    en: String((itemEn && itemEn.explanation) || ""), tr: String(i.explanation || ""), lang: i.language });
}

/* A regression over an empty subject list is VACUOUS, not a pass. */
if (!subjects.length) {
  console.error("VACUOUS: no accepted text was assembled. This is not a pass.");
  process.exitCode = 2; process.exit();
}

/* KEYS MUST BE UNIQUE OR THE SNAPSHOT SILENTLY LOSES SUBJECTS. The first run of
 * this harness assembled 38 subjects and wrote 36 keys: two labels collided and
 * overwrote each other, so two accepted renderings were outside the regression
 * while it reported a clean diff. A coverage gap in a check reads as a pass. The
 * index makes the key unique; the assertion is what would have caught it. */
const verdicts = {};
subjects.forEach((s, i) => {
  const out = runRenderGates(s.en, s.tr, s.lang).map((f) => f.gate + ": " + f.detail);
  /* UNALIGNABLE is its own state and is recorded as a verdict, not skipped: a
   * subject that stops being alignable has changed, and a diff that silently
   * drops it would report that as "no change". */
  const modal = checkModalSentences(s.en, s.tr, s.lang);
  out.push(...(modal.unalignable ? ["A: UNALIGNABLE"] : modal.flags.map((f) => "A: " + f.detail)));
  const terms = checkDefinedTerms(s.en, s.tr, s.lang);
  out.push(...(terms.unalignable ? ["B: UNALIGNABLE"] : terms.flags.map((f) => "B: " + f.detail)));
  out.push(...checkClauseVocab(s.tr, s.lang).flags.map((f) => "D: " + f.detail));
  verdicts[String(i).padStart(3, "0") + " " + s.set + " :: " + s.label] = out.sort();
});
if (Object.keys(verdicts).length !== subjects.length) {
  console.error("KEY COLLISION: " + subjects.length + " subjects produced " +
    Object.keys(verdicts).length + " keys. The snapshot would be short.");
  process.exitCode = 2; process.exit();
}

/* Name the collisions that the index is now hiding, so a duplicated subject is
 * visible as a fact about the input rather than silently deduplicated. */
const seenLabel = new Map();
for (const s of subjects) {
  const k = s.set + " :: " + s.label;
  seenLabel.set(k, (seenLabel.get(k) || 0) + 1);
}
const dupes = [...seenLabel].filter(([, n]) => n > 1);

const fired = Object.entries(verdicts).filter(([, v]) => v.length);
console.log("RENDER-GATE REGRESSION over text the pipeline already accepted");
console.log("  subjects            " + subjects.length +
  "   (batch " + subjects.filter((s) => s.set === "batch-cda6698a").length +
  ", own-work " + subjects.filter((s) => s.set === "own-work").length + ")");
console.log("  subjects with a gate finding  " + fired.length);
console.log("  labels appearing more than once " + dupes.length +
  (dupes.length ? "   (kept separate by index, listed below)" : ""));
for (const [k, n] of dupes) console.log("    x" + n + "  " + k);
for (const [k, v] of fired) { console.log("    " + k); for (const x of v) console.log("        " + x); }

if (SNAPSHOT) {
  writeFileSync(join(ROOT, SNAPSHOT), JSON.stringify(verdicts, null, 2) + "\n", "utf8");
  console.log("");
  console.log("wrote snapshot " + SNAPSHOT);
}

if (AGAINST) {
  const p = join(ROOT, AGAINST);
  if (!existsSync(p)) {
    console.error("COULD-NOT-RUN: no snapshot at " + AGAINST + ". This is not a clean diff.");
    process.exitCode = 3; process.exit();
  }
  const before = JSON.parse(readFileSync(p, "utf8"));
  const keys = [...new Set([...Object.keys(before), ...Object.keys(verdicts)])].sort();
  const gone = [], added = [], missing = [];
  for (const k of keys) {
    const b = before[k], a = verdicts[k];
    if (!b || !a) { missing.push(k + (b ? " (subject vanished)" : " (subject is new)")); continue; }
    for (const x of b) if (!a.includes(x)) gone.push([k, x]);
    for (const x of a) if (!b.includes(x)) added.push([k, x]);
  }
  console.log("");
  console.log("DIFF against " + AGAINST);
  console.log("  subjects compared        " + (keys.length - missing.length));
  console.log("  subject set changed      " + missing.length + (missing.length ? "   <- own state" : ""));
  console.log("  findings REMOVED         " + gone.length + "   (the safe direction)");
  console.log("  findings ADDED           " + added.length +
    (added.length ? "   <- NEW REFUSALS ON ACCEPTED TEXT, read before landing" : ""));
  for (const m of missing) console.log("    SUBJECT " + m);
  for (const [k, x] of added) console.log("    ADDED   " + k + "  ::  " + x);
  for (const [k, x] of gone) console.log("    removed " + k + "  ::  " + x);
}
