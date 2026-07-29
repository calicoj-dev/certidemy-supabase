/**
 * patch-score-merge-saved-answers.mjs
 *
 * Makes score-mock-exam read the answers saved during the exam
 * (exam_session_items, migration 164) and merge them with whatever the client
 * submits.
 *
 * WHY, AND WHAT IT UNLOCKS
 *
 * Migration 163 made the FORM server-authoritative, so a manipulated submission
 * can no longer inflate a score. The answers themselves still arrived from the
 * browser, which left two gaps:
 *
 *   A CRASH STILL COST EVERYTHING. Answers saved to the server were ignored at
 *   scoring, so a dead tab meant a consumed voucher and nothing scored - even
 *   though the work was sitting in the database.
 *
 *   AN ABANDONED ATTEMPT COULD NOT BE CLOSED. Auto-submit at zero needs a
 *   client. No client, no submission, and the attempt sits in_progress forever
 *   with the voucher spent. After this, an EMPTY submission is a valid finalise:
 *   the server has the answers, so it can score with no browser present.
 *
 * THE MERGE RULE, AND WHY CLIENT WINS
 *
 * Per item: if the client submitted an answer for it, that wins. Otherwise the
 * saved answer is used.
 *
 * That is deliberate and it is not a hole. A candidate may change an answer up
 * to the moment they submit, and a save that failed on a flaky connection must
 * not cost them the change. The cheat that mattered - inflating the denominator
 * or substituting items from the practice pool - was closed by grading the
 * recorded FORM, and this does not touch that. Within the form, "the client
 * chose a different option" is just answering.
 *
 * The saved copy is crash recovery, not a tamper check.
 *
 * FOUR ANCHORED EDITS, VALIDATED BEFORE ANY ARE APPLIED. All-or-nothing: a
 * half-patched scorer is worse than an unpatched one, and this script has no
 * business leaving one behind.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:DRY_RUN="1"; node scripts\patch-score-merge-saved-answers.mjs
 *   Remove-Item Env:\DRY_RUN; node scripts\patch-score-merge-saved-answers.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SRC =
  "C:/Users/Juan/Documents/certidemy/supabase/functions/score-mock-exam/index.ts";
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

/* ---- 1. widen the served-form read to include saved answers ---------- */

const A1_FROM = '.select("question_id, presented_order, language")';
const A1_TO =
  '.select("question_id, presented_order, language, user_answer, time_taken_seconds, marked_for_review")';

/* ---- 2. build the merged answer source ------------------------------- */

const A2_FROM = [
  "    // What the candidate sent, addressable by question.",
  "    const submitted = new Map(body.answers.map((a) => [a.question_id, a]));",
].join("\n");

const A2_TO = [
  "    // What the candidate sent, addressable by question.",
  "    const submitted = new Map(body.answers.map((a) => [a.question_id, a]));",
  "",
  "    // What the server saved DURING the exam (migration 164). This is what",
  "    // makes a crash survivable and an empty submission a valid finalise.",
  "    const saved = new Map(",
  "      served",
  "        .filter((s) => s.user_answer !== null && s.user_answer !== undefined)",
  "        .map((s) => [",
  "          s.question_id as string,",
  "          {",
  "            question_id: s.question_id as string,",
  "            user_answer: (s.user_answer ?? []) as string[],",
  "            time_taken_seconds: (s.time_taken_seconds ?? undefined) as number | undefined,",
  "            marked_for_review: (s.marked_for_review ?? false) as boolean,",
  "          },",
  "        ]),",
  "    );",
  "",
  "    // MERGE. The client wins per item when it sent one: a candidate may change",
  "    // an answer up to the moment of submission, and a save that failed on a",
  "    // flaky connection must not cost them that change. The saved copy fills",
  "    // every gap. Neither path can add an item that was not served - the form",
  "    // decides what is graded, and that is what closes the original defect.",
  "    let answers_from_client = 0;",
  "    let answers_from_server = 0;",
  "    const answerFor = (question_id: string) => {",
  "      const fromClient = submitted.get(question_id);",
  "      if (fromClient) {",
  "        answers_from_client += 1;",
  "        return fromClient;",
  "      }",
  "      const fromServer = saved.get(question_id);",
  "      if (fromServer) {",
  "        answers_from_server += 1;",
  "        return fromServer;",
  "      }",
  "      return undefined;",
  "    };",
].join("\n");

/* ---- 3. grade from the merged source -------------------------------- */

const A3_FROM = "      const ans = submitted.get(slot.question_id);";
const A3_TO = "      const ans = answerFor(slot.question_id);";

/* ---- 4. record the merge in integrity_flags -------------------------- */

const A4_FROM = [
  "      unanswered,",
  "      unexpected_items: unexpected_ids.length,",
  "      missing_items,",
  "    };",
].join("\n");

const A4_TO = [
  "      unanswered,",
  "      unexpected_items: unexpected_ids.length,",
  "      missing_items,",
  "      answers_from_client,",
  "      answers_from_server,",
  "      // An empty submission with saved answers present is a server-side",
  "      // finalisation: the candidate's browser never came back, and the",
  "      // attempt was closed from what had been persisted.",
  "      finalized_server_side: body.answers.length === 0 && saved.size > 0,",
  "    };",
].join("\n");

const EDITS = [
  ["served-form read includes saved answers", A1_FROM, A1_TO],
  ["merged answer source", A2_FROM, A2_TO],
  ["grade from merged source", A3_FROM, A3_TO],
  ["integrity_flags records the merge", A4_FROM, A4_TO],
];

if (!existsSync(SRC)) {
  console.error("score-mock-exam/index.ts not found at " + SRC);
  process.exit(1);
}

let text = readFileSync(SRC, "utf8");
const before = text.length;

console.log("Score merge saved answers " + (DRY_RUN ? "[DRY RUN]" : "[LIVE]") + "\n");

if (text.includes("answerFor")) {
  console.log("  already patched - 'answerFor' is present. Nothing to do.");
  process.exit(0);
}

/* ---- phase 1: validate every anchor before touching anything -------- */
let bad = 0;
for (const [label, from] of EDITS) {
  const hits = text.split(from).length - 1;
  if (hits === 1) {
    console.log("  ok   " + label);
  } else {
    console.log("  FAIL " + label + ": anchor found " + hits + " times, expected 1");
    console.log("       looked for:");
    console.log(from.split("\n").map((l) => "         " + l).join("\n"));
    bad += 1;
  }
}
if (bad > 0) {
  console.log("\n" + bad + " anchor(s) did not match. NOTHING written - a half-patched");
  console.log("scorer is worse than an unpatched one.");
  process.exit(1);
}

/* ---- phase 2: apply -------------------------------------------------- */
for (const [, from, to] of EDITS) {
  text = text.replace(from, to);
}

console.log("\nbytes " + before + " -> " + text.length);

if (DRY_RUN) {
  console.log("\nDRY RUN - nothing written. All four anchors matched.");
} else {
  writeFileSync(SRC, text, { encoding: "utf8" });
  console.log("\nwritten.");
  console.log("Deploy: supabase functions deploy score-mock-exam");
}
