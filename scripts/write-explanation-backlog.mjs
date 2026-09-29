#!/usr/bin/env node
/**
 * write-explanation-backlog.mjs -- record the 5 survivors with soft explanations as a BACKLOG.
 *
 * READ-ONLY on the database; writes one local markdown file. No flags, no model calls.
 *
 * ============ WHY THIS IS A BACKLOG AND NOT A RETIREMENT ============
 *
 * Ruled 2026-09-29: all 20 read survivors have correct keys, five have minor explanation softness, and
 * secure explanations are not served. That last part is the reason the softness has no serving
 * consequence, and it is checked rather than repeated -- migration 378 revokes `quiz_questions.explanation`
 * from anon and authenticated, and records the measurement behind it:
 *
 *   "every secure item carries visibility='secure' which no read policy matches -- so the KEY is
 *    unreachable and so is every secure row"
 *
 * So a soft explanation on a SECURE item is a quality debt on text no candidate can read. It matters when
 * an item is reviewed, retranslated, or promoted to practice -- and a promotion is exactly the event that
 * would turn this list from debt into exposure, which is why it is written down rather than remembered.
 *
 * THE LIST IS THE ARTIFACT, NOT THE COUNT. Each row carries the explanation verbatim so the next reader
 * can see what "soft" meant, rather than trusting a label.
 */
import { writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const rulings = JSON.parse(readFileSync(join(ROOT, "DIRECTOR-RULINGS-AIMSF.json"), "utf8"));
const spec = rulings.survivors.explanation_fidelity_backlog;
const want = spec.prefixes;

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F");
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code,statement&order=code"))
  .filter((t) => t.certification_id === certs[0].id);
const taskOf = new Map(tasks.map((t) => [t.id, t]));
const live = await getAll(KEY, "quiz_questions?select=id,task_id,question_text,options,correct_answer," +
  "explanation,pool,status,visibility,retired_at&certification_id=eq." + certs[0].id +
  "&language=eq.en&order=id");
const rowOf = (p) => live.find((r) => String(r.id).startsWith(p));

/* every named prefix must resolve, or the backlog silently covers fewer items than it claims */
const missing = want.filter((p) => !rowOf(p));
if (missing.length) {
  console.error("ABORT: " + missing.length + " prefix(es) did not match a live AIMS-F English row: " +
    missing.join(", "));
  process.exit(2);
}
console.log("all " + want.length + " prefixes resolved");

const md = [];
const p = (s = "") => md.push(s);
p("# AIMS-F: explanation-fidelity backlog");
p("");
p("**Not a retirement, and not a verdict on any item.** Ruled 2026-09-29 from the director's read of 20");
p("survivors: all 20 have correct keys; these five carry minor explanation softness.");
p("");
p("## Why it has no serving consequence today");
p("");
p("Migration `378_revoke_explanation_and_practice_rpc.sql` revokes `quiz_questions.explanation` from");
p("`anon` and `authenticated`, and records the measurement behind it:");
p("");
p("> every secure item carries `visibility='secure'` which no read policy matches -- so the KEY is");
p("> unreachable and so is every secure row");
p("");
p("So these explanations are text no candidate can read. Checked rather than assumed, and the visibility");
p("of each row is printed below for the same reason.");
p("");
p("**The event that turns this from debt into exposure is a PROMOTION to practice**, where explanations");
p("ARE served to a learner. Anything moving a secure item to the practice pool should clear this list");
p("first -- which is why it is written down instead of remembered.");
p("");
p("## The five");
p("");
const out = [];
for (const pre of want) {
  const r = rowOf(pre);
  const t = taskOf.get(r.task_id);
  const keyIds = Array.isArray(r.correct_answer) ? r.correct_answer : [r.correct_answer];
  const keyText = (r.options.find((o) => keyIds.includes(o.id)) || {}).text || "";
  p("### `" + pre + "`   task " + (t ? t.code : "?") + "   pool `" + r.pool + "`, visibility `" +
    String(r.visibility) + "`, status `" + r.status + "`");
  p("");
  p("*task:* " + String(t ? t.statement : "").replace(/\s+/g, " "));
  p("");
  p("**Q** " + String(r.question_text).replace(/\s+/g, " "));
  p("");
  p("**key** " + String(keyText).replace(/\s+/g, " "));
  p("");
  p("*explanation, verbatim:* " + String(r.explanation || "").replace(/\s+/g, " "));
  p("");
  out.push({ prefix: pre, task: t ? t.code : null, pool: r.pool, visibility: r.visibility,
    status: r.status, explanation: r.explanation });
}
const served = out.filter((x) => x.pool !== "secure" || String(x.visibility) !== "secure");
p("## Assertion");
p("");
p("All five must be secure and non-served for the reasoning above to hold. Measured: " +
  (served.length ? "**" + served.length + " ARE NOT** -- " +
    served.map((x) => x.prefix + " (" + x.pool + "/" + x.visibility + ")").join(", ") +
    ", so the no-consequence argument does NOT cover them and they need attention now."
    : "all five are `secure`/`secure`, so none is served."));
p("");
writeFileSync(join(ROOT, "EXPLANATION-FIDELITY-BACKLOG.md"), md.join("\n") + "\n", "utf8");
console.log("wrote EXPLANATION-FIDELITY-BACKLOG.md");
console.log("secure and non-served: " + (out.length - served.length) + " of " + out.length);
if (served.length) {
  console.error("NOTE: " + served.length + " of the five is/are NOT secure-and-unserved: " +
    served.map((x) => x.prefix).join(", "));
  process.exitCode = 1;
}
