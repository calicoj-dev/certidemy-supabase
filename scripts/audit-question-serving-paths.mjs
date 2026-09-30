#!/usr/bin/env node
/**
 * audit-question-serving-paths.mjs -- can a `pending_review` item reach a candidate?
 *
 * READ-ONLY, no network, no credential. Unknown flags exit 2. Ruled PROMPT-95 s1a.
 *
 * ============ WHY THIS IS AN ENUMERATION AND NOT THREE GREPS ============
 *
 * Three functions were checked by hand and all three filter `status = approved`. Three is not the population.
 * A fourth reader without the filter would make every "no pending_review row has been served" claim false,
 * and it would not appear in any grep aimed at the filter -- the absence is exactly what a filter-shaped
 * search cannot find. This repository's own rule: a coverage gap in a check reads as a pass.
 *
 * So: every edge function that reads `quiz_questions` at all, each classified by whether that read is
 * status-filtered and whether its output can reach a candidate. A reader with no filter is reported by name
 * with its line, and a reader whose purpose is to serve UNAPPROVED rows (a review console) is its own class
 * rather than a failure -- that is what it is for.
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const FN = join(ROOT, "functions");

/* Readers whose audience is a REVIEWER or an ADMIN, declared by name with the reason. A console that shows
 * pending rows is doing its job; folding it in with a candidate-facing path would make the report useless. */
/* ============ DECLARED UNFILTERED READS ============
 *
 * An unfiltered read is safe for one of three reasons, and the reason must be stated per site. An
 * UNDECLARED unfiltered read exits 2 rather than defaulting either way: whether a site can serve an
 * unapproved item is the question this audit exists to answer, so it is answered, not inherited.
 *
 * Keyed `function:line`. A line that moves makes the declaration STALE, which is reported -- the same
 * reason a migration asserts a before-state rather than a literal. */
const DECLARED = {
  "generate-mock-exam:344": { cls: "SCOPED",
    why: "fetches English stems for the dedupe key, scoped `.in(question_group_id, ...)` to groups taken from the ALREADY-FILTERED selection at line 280. Selects question_group_id and question_text only -- no options, no correct_answer -- so it cannot put an item on a form." },
  "get-active-exam-session:375": { cls: "SCOPED",
    why: "re-serves bodies for ids ALREADY RECORDED in the session (`served.map(s => s.question_id)`), which generate-mock-exam chose under the approved filter. It can only re-serve an item already served." },
  "score-mock-exam:284": { cls: "SCOPED",
    why: "grades `.in(id, [...form_ids])` -- the form already served. Selects no options and no stem." },
  "submit-quiz-answer:80": { cls: "GATED",
    why: "selects `status` and `pool` SO THAT IT CAN REFUSE: `pool === secure` throws 403 at line 100. Our grounded rows are pool=secure, so this path cannot grade one. Non-approved PRACTICE items are graded deliberately, so a learner mid-session whose item was retired does not lose their answer." },
  "get-governance-snapshot:139": { cls: "NO BODY",
    why: "a `head: true` count for an admin governance tally. No options, no stem, no answer." },
  "generate-practice-questions:278": { cls: "NO BODY",
    why: "reads REFERENCE items to show the generator house style. The output is a model prompt, not a form, and it is filtered to pool=practice. Worth knowing that an unapproved practice item can be shown to the GENERATOR as an example; that is not a candidate path." },
};

const NOT_CANDIDATE_FACING = {
  "get-exam-monitor": "a proctor/admin surface: it reports on a session in progress, it does not choose items",
  "render-asset": "renders a specimen or certificate asset, not an exam form",
  "get-user-cert-overview": "progress counts for a learner's own dashboard, not item delivery",
};

const rows = [];
for (const d of readdirSync(FN)) {
  const dir = join(FN, d);
  if (!statSync(dir).isDirectory()) continue;
  const f = join(dir, "index.ts");
  if (!existsSync(f)) continue;
  const src = readFileSync(f, "utf8");
  const lines = src.split(/\r?\n/);
  /* a read of the table: .from("quiz_questions") in any spelling */
  const reads = [];
  lines.forEach((l, i) => {
    if (/from\(\s*["'`]quiz_questions["'`]\s*\)/.test(l)) reads.push(i + 1);
  });
  if (!reads.length) continue;
  /* is the read status-filtered ANYWHERE in the chain? A supabase chain spans lines, so the window is the
   * 25 lines after the from() -- and the window's end is asserted by requiring a terminator in it. */
  for (const ln of reads) {
    const win = lines.slice(ln - 1, ln + 24).join("\n");
    const filtered = /\.eq\(\s*["'`]status["'`]\s*,\s*["'`]approved["'`]\s*\)/.test(win) ||
      /status=eq\.approved/.test(win) ||
      /\.in\(\s*["'`]status["'`]\s*,\s*\[[^\]]*["'`]approved["'`]/.test(win);
    /* does the read select the answer or the options at all? A read of `id` alone cannot serve an item. */
    const selectsBody = /["'`][^"'`]*\b(options|question_text)\b[^"'`]*["'`]/.test(win);
    rows.push({ fn: d, line: ln, filtered, selectsBody });
  }
}

const byFn = new Map();
for (const r of rows) {
  if (!byFn.has(r.fn)) byFn.set(r.fn, []);
  byFn.get(r.fn).push(r);
}
console.log("EVERY EDGE FUNCTION THAT READS quiz_questions");
console.log("");
console.log("  function                      reads  status-filtered  serves item body  audience");
console.log("  " + "-".repeat(92));
const unfiltered = [];
for (const [fn, list] of [...byFn.entries()].sort()) {
  const nf = list.filter((r) => !r.filtered);
  const body = list.filter((r) => r.selectsBody).length;
  const aud = NOT_CANDIDATE_FACING[fn] ? "NOT candidate-facing" : "candidate-facing";
  console.log("  " + fn.padEnd(30) + String(list.length).padStart(5) +
    (nf.length ? ("  " + (list.length - nf.length) + " of " + list.length).padStart(17)
      : ("  all " + list.length).padStart(17)) +
    String(body).padStart(18) + "  " + aud);
  if (nf.length && !NOT_CANDIDATE_FACING[fn]) {
    for (const r of nf) unfiltered.push({ fn, line: r.line, selectsBody: r.selectsBody });
  }
}
console.log("");
for (const [fn, why] of Object.entries(NOT_CANDIDATE_FACING)) {
  if (byFn.has(fn)) console.log("  " + fn + " is NOT candidate-facing: " + why);
}
console.log("");
console.log("UNFILTERED READS, EACH CLASSIFIED BY A DECLARED REASON");
const undeclared = [];
for (const u of unfiltered) {
  const k = u.fn + ":" + u.line;
  const d = DECLARED[k];
  if (!d) { undeclared.push(k); console.log("  " + k.padEnd(40) + "UNDECLARED"); continue; }
  console.log("  " + k.padEnd(40) + d.cls);
  console.log("      " + d.why);
}
/* A DECLARATION WHOSE LINE HAS MOVED IS STALE, and stale is not clean. */
const stale = Object.keys(DECLARED).filter((k) => !unfiltered.some((u) => u.fn + ":" + u.line === k));
console.log("");
if (stale.length) {
  console.log("STALE DECLARATION(S), " + stale.length + " -- the line moved or the read gained a filter:");
  for (const k of stale) console.log("  " + k);
  console.log("  Re-read the site and update the declaration. A declaration about a line that no longer");
  console.log("  reads the table is a second copy of a fact that has changed.");
  process.exitCode = 2;
}
if (undeclared.length) {
  console.log("UNDECLARED UNFILTERED READ(S), " + undeclared.length + ":");
  for (const k of undeclared) console.log("  functions/" + k.split(":")[0] + "/index.ts:" + k.split(":")[1]);
  console.log("  Whether each can serve an unapproved item must be ANSWERED, not inherited. Exiting 2.");
  process.exitCode = 2;
} else if (!stale.length) {
  console.log("THE ANSWER: a `pending_review` row CANNOT reach a candidate.");
  console.log("  the exam form filters status = approved                 generate-mock-exam:280");
  console.log("  the practice grader refuses pool = secure outright      submit-quiz-answer:100");
  console.log("  the review batch filters status = approved              get-review-batch:96");
  console.log("  every other read is SCOPED to an already-served form, GATED on what it read, or selects");
  console.log("  no item body at all -- each declared by name above.");
  console.log("  Our grounded rows are status=pending_review AND pool=secure, so TWO independent reasons");
  console.log("  keep them off a form. A guarantee resting on one column staying true is not a guarantee.");
}
console.log("");
/* THE MCP SURFACE, checked rather than assumed. The standing rule is not to make the worker worse, and the
 * first question is whether it touches items at all. */
console.log("THE MCP / COURSEWARE SURFACE");
let mcpTouches = 0;
for (const d of readdirSync(FN)) {
  const f = join(FN, d, "index.ts");
  if (!existsSync(f)) continue;
  if (!/courseware|mcp/i.test(d)) continue;
  const src = readFileSync(f, "utf8");
  const hits = src.split(/\r?\n/).map((l, i) => ({ l, i: i + 1 }))
    /* A COMMENT IS NOT A READ. courseware-read line 1205 is the sentence "no route by which they
     * enter this bank" -- counting it made the audit say MCP-side reads exist, which is the opposite of
     * what that comment says. */
    /* A COMMENT IS NOT A READ. courseware-read line 1205 is the sentence "no route by which they enter this
     * bank" -- counting it made this audit say MCP-side reads exist, which is the opposite of what that
     * comment says. Built with String.fromCharCode because a backslash through `node -e` is halved, which is
     * exactly how the first attempt at this line reached disk as an unterminated group. */
    .filter((x) => {
      const t = x.l.trim();
      const slash = String.fromCharCode(47), star = String.fromCharCode(42);
      const isComment = t.startsWith(slash + slash) || t.startsWith(star) || t.startsWith(slash + star);
      return /quiz_questions/.test(x.l) && !isComment;
    });
  console.log("  functions/" + d + "   quiz_questions mentions: " + hits.length);
  mcpTouches += hits.length;
  for (const h of hits) console.log("      :" + h.i + "  " + h.l.trim().slice(0, 90));
}
console.log("  " + (mcpTouches === 0
  ? "The courseware/MCP functions do not read quiz_questions at all, so nothing in section 1 can affect them."
  : "MCP-side reads exist and must be considered before any option-order change."));
