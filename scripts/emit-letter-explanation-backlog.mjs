#!/usr/bin/env node
/**
 * emit-letter-explanation-backlog.mjs -- the 41 served explanations that name an option by letter or position.
 *
 * READ-ONLY apart from one report. No writes to the database, no model calls. Unknown flags exit 2.
 *
 * Ruled PROMPT-96 s3: *"queue them, don't do them now. Practice doesn't shuffle, so their letters are still
 * right. Put them on the backlog with the list."*
 *
 * ============ WHY THEY ARE NOT WRONG TODAY, AND EXACTLY WHEN THEY BECOME WRONG ============
 *
 * An explanation reading *"option b restates the definition of effectiveness"* is CORRECT while the letter
 * the learner saw is `b`. Two independent things have to hold for that:
 *
 *   1. the stored option order is the served order, and
 *   2. the displayed letter comes from that order.
 *
 * Both hold for practice today. `get-review-batch` and `generate-practice-questions` serve `options` through
 * unchanged, and `exam-runner.tsx` renders the letter from the array index (PROMPT-95 addendum-2). **The
 * delivery shuffle deployed for PROMPT-95 s1e applies to `generate-mock-exam` only** -- the exam and
 * simulator path -- so a practice explanation is still describing the option the learner is looking at.
 *
 * THE DAY THAT STOPS BEING TRUE is the day a shuffle reaches the practice path, and the failure would be
 * silent: an explanation confidently naming the wrong option, after the answer, when the learner is most
 * likely to believe it. That is the whole reason this is a queue rather than a note.
 *
 * ============ WHAT THE LIST IS FOR ============
 *
 * The repair is per item and mechanical in shape -- name the option by its CONTENT, which survives any order
 * -- but it is a content edit and every one is a served string. It is not a sweep: this repository records
 * what a bulk substitution over reviewed content costs.
 *
 * The enumeration is the artifact. A count of 41 is commentary until somebody can see which rows.
 */
import { writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { explanationOptionRef, explanationOptionRefControls } from "./lib/explanation-option-ref.mjs";
import { generatorArtifacts } from "./lib/item-disposition.mjs";
import { itemIdOfStem } from "./lib/item-id.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY apart from the report; takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KEY = requireKey(HERE);

/* THE DETECTOR'S OWN CONTROLS FIRST. A backlog built by a detector nobody proved could fire is a list of
 * whatever it happened to match. */
{
  const ctl = explanationOptionRefControls();
  const bad = ctl.filter((c) => !c.pass);
  for (const c of bad) console.error("  CONTROL FAIL " + c.what + "   " + c.detail);
  if (bad.length) { console.error("REFUSING: the detector's controls fail."); process.exit(2); }
  console.log("detector controls: " + ctl.length + " of " + ctl.length + " pass");
}

const certs = (await getAll(KEY, "certifications?select=id,code&order=code"));
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const hits = [];
let examined = 0;
for (const c of certs) {
  const qs = await getAll(KEY, "quiz_questions?select=id,certification_id,task_id,language,pool,status,explanation,item_origin&certification_id=eq." +
    c.id + "&retired_at=is.null&status=in.(approved,pending_review)&order=id");
  for (const q of qs) {
    if (!q.explanation) continue;
    examined++;
    /* THE SHAPE OF THE RETURN IS READ FROM THE MODULE, NOT GUESSED. My first version passed a STRING and
     * read `v.hit` and `v.rule`; it takes an ITEM and returns `{ pass, examined, hits[] }`. It reported
     * 0 of 27,829 -- a clean sweep -- while the census beside it found 41. **A detector whose controls pass
     * and whose CALLER is wrong reports exactly the number nobody checks**, and the only reason this was
     * caught is that another instrument had already answered the same question. */
    const v = explanationOptionRef(q);
    if (!v || v.pass !== false) continue;
    hits.push({ id: q.id, cert: c.code, language: q.language, pool: q.pool, status: q.status,
      origin: q.item_origin, rule: v.hits.map((h) => h.rule).join("+"),
      matched: v.hits.map((h) => h.match).join(" | "),
      head: String(q.explanation).replace(/\s+/g, " ").slice(0, 150) });
  }
}

/* ============ AND THE ARTIFACTS, BECAUSE A DRAFT IS WHERE THE CHEAP FIX IS ============
 *
 * Ruled PROMPT-97 addendum s3: *"re-run it read-only over all grounded items and the live served bank."* This
 * script read the BANK only, so an item awaiting a read was invisible to it -- which is exactly where the
 * director found `29a3ad5f`, and exactly where the repair costs nothing, because the row does not exist yet.
 *
 * Reported as its OWN section rather than merged into the totals: a served explanation is a live defect on the
 * practice path, a draft one is a defect that can still be prevented, and averaging the two would hide which
 * is which. The bank total stays the number it was.
 */
const artifactHits = [];
{
  const insertedStems = new Set(
    (await getAll(KEY, "quiz_questions?select=id,question_text&language=eq.en&retired_at=is.null&order=id"))
      .map((q) => itemIdOfStem(q.question_text)));
  const seen = new Set();
  for (const f of generatorArtifacts(ROOT)) {
    for (const r of (JSON.parse(readFileSync(join(ROOT, f), "utf8")).items || [])) {
      if (r.verdict !== "survivor") continue;
      const id = String(r.item_id || "");
      if (seen.has(id)) continue;
      seen.add(id);
      const v = explanationOptionRef(r.item || {});
      if (!v || v.pass !== false) continue;
      artifactHits.push({ id: id.slice(0, 8), task: r.task_code, file: f,
        inserted: insertedStems.has(itemIdOfStem((r.item || {}).question_text)),
        rule: v.hits.map((h) => h.rule).join("+"), matched: v.hits.map((h) => h.match).join(" | ") });
    }
  }
}

/* ---- group, because the repair is per GROUP: a trilingual sibling set is one edit in three languages ---- */
const byCert = {};
for (const h of hits) {
  byCert[h.cert] = byCert[h.cert] || { total: 0, byPool: {}, byLang: {}, byRule: {} };
  byCert[h.cert].total++;
  byCert[h.cert].byPool[h.pool] = (byCert[h.cert].byPool[h.pool] || 0) + 1;
  byCert[h.cert].byLang[h.language] = (byCert[h.cert].byLang[h.language] || 0) + 1;
  byCert[h.cert].byRule[h.rule] = (byCert[h.cert].byRule[h.rule] || 0) + 1;
}

const md = [];
const p = (s = "") => md.push(s);
p("# Backlog: served explanations that name an option by letter or position");
p("");
p("**Queued, not done. Ruled PROMPT-96 s3.** Read-only: nothing in the bank was changed.");
p("");
p("## Why these are not wrong today, and exactly when they become wrong");
p("");
p("An explanation reading *\"option b restates the definition of effectiveness\"* is CORRECT while the letter");
p("the learner saw is `b`. Two independent things have to hold:");
p("");
p("1. the stored option order is the served order, and");
p("2. the displayed letter comes from that order.");
p("");
p("**Both hold for practice today.** The PROMPT-95 s1e delivery shuffle applies to `generate-mock-exam` only");
p("-- the exam and simulator path. `get-review-batch` serves `options` through unchanged, and the player");
p("renders the letter from the array index. So a practice explanation still describes the option in front of");
p("the learner.");
p("");
p("**The day that stops being true is the day a shuffle reaches the practice path**, and the failure would be");
p("silent: an explanation confidently naming the wrong option, after the answer, when the learner is most");
p("likely to believe it. That is why this is a queue and not a note.");
p("");
p("**The " + (byCert["ZZ-TEST-I"] ? "one" : "zero") + " ZZ-TEST-I hit is the test certification** and is");
p("listed for completeness rather than as work.");
p("");
p("## The repair");
p("");
p("Per item: name the option by its **content**, which survives any order. Mechanical in shape and a content");
p("edit in substance -- every one of these is a string a learner reads. **Not a sweep**: this repository");
p("records what a bulk substitution over reviewed content costs.");
p("");
p("A trilingual sibling set is ONE editorial decision in three languages, so the language column below is the");
p("one to plan against rather than the row count.");
p("");
p("## Summary");
p("");
p("| cert | rows | by pool | by language | by rule |");
p("|---|---|---|---|---|");
const fmt = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + " " + v).join(", ");
for (const [cert, s] of Object.entries(byCert).sort((a, b) => b[1].total - a[1].total)) {
  p("| " + cert + " | **" + s.total + "** | " + fmt(s.byPool) + " | " + fmt(s.byLang) + " | " +
    fmt(s.byRule) + " |");
}
p("| **TOTAL** | **" + hits.length + "** | of " + examined.toLocaleString() +
  " explanations examined | | |");
p("");
p("## Every row, by certification");
p("");
for (const [cert] of Object.entries(byCert).sort((a, b) => b[1].total - a[1].total)) {
  p("### " + cert);
  p("");
  p("| question_id | pool | lang | status | origin | rule | matched | explanation (head) |");
  p("|---|---|---|---|---|---|---|---|");
  for (const h of hits.filter((x) => x.cert === cert)) {
    p("| `" + h.id + "` | " + h.pool + " | " + h.language + " | " + h.status + " | " + (h.origin || "?") +
      " | `" + h.rule + "` | " + JSON.stringify(h.matched) + " | " +
      h.head.replace(/\|/g, "\\|").slice(0, 110) + " |");
  }
  p("");
}
p("## Drafts awaiting a read (not served, and the cheap place to fix one)");
p("");
p("Ruled PROMPT-97 addendum s3. These are artifact survivors, scanned with the same rules. **A draft is not");
p("a live defect** -- no learner can reach it -- so these are kept out of the totals above and reported here,");
p("because the two need different actions: a served row needs a content edit, a draft needs the item rewritten");
p("or dropped before it is inserted.");
p("");
if (!artifactHits.length) {
  p("No artifact survivor names an option by letter, number or position.");
} else {
  p("| item | task | artifact | already inserted? | rule | matched |");
  p("|---|---|---|---|---|---|");
  for (const h of artifactHits) {
    p("| `" + h.id + "` | " + h.task + " | " + h.file + " | " + (h.inserted ? "**yes**" : "no") +
      " | `" + h.rule + "` | " + JSON.stringify(h.matched) + " |");
  }
}
p("");
p("## What this list cannot see");
p("");
p("- an explanation naming an option by a DESCRIPTION of its position (\"the shortest option\", \"the one");
p("  above\") rather than by a letter or an ordinal. The detector matches six declared forms;");
p("- a letter reference inside a lesson body or a checkpoint block, which are different surfaces;");
p("- anything in a retired or rejected row, which is excluded by the read.");
writeFileSync(join(ROOT, "BACKLOG-LETTER-EXPLANATIONS.md"), md.join("\n") + "\n", "utf8");

console.log("");
console.log("SERVED EXPLANATIONS NAMING AN OPTION BY LETTER OR POSITION");
console.log("  examined  " + examined.toLocaleString() + " explanation(s)");
console.log("  hits      " + hits.length);
for (const [cert, s] of Object.entries(byCert).sort((a, b) => b[1].total - a[1].total)) {
  console.log("    " + cert.padEnd(11) + String(s.total).padStart(3) + "   " + fmt(s.byLang));
}
console.log("");
console.log("wrote BACKLOG-LETTER-EXPLANATIONS.md   (every row named; the count is commentary)");
console.log("NOTHING WAS REWRITTEN, as ruled.");
