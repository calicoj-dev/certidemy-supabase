/**
 * patch-exam-form-recording.mjs
 *
 * Adds served-form persistence to generate-mock-exam: after the session row is
 * created, every item in the assembled form is written to exam_session_items
 * with its presented order and the form's language.
 *
 * WHY A PATCH AND NOT A WHOLE FILE. generate-mock-exam is ~450 lines and most of
 * it is blueprint allocation - largest-remainder weighting across domains,
 * round-robin task spread, difficulty stratification. Re-emitting all of that to
 * add one insert risks a transcription error in the part that decides whether
 * every certification exam is blueprint-valid. The anchor is one unique line.
 *
 * WHAT THIS DOES NOT DO. It does not close the vulnerability. Recording the form
 * is half the fix; score-mock-exam must then grade against it rather than the
 * client's submission. Until that ships, forms are recorded and ignored, which
 * is exactly today's behaviour and no worse.
 *
 * FAILURE BEHAVIOUR IS DELIBERATE. If the items insert fails on a real exam, the
 * request throws. The voucher attempt has already been consumed at that point -
 * the same position the existing blueprint-integrity gate occupies, and the
 * existing comment says ops can re-issue from the audit trail. The alternative
 * is worse: a secure form in a candidate's hands that cannot be scored against
 * anything, which is the defect this whole change exists to remove.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:DRY_RUN="1"; node scripts\patch-exam-form-recording.mjs
 *   Remove-Item Env:\DRY_RUN; node scripts\patch-exam-form-recording.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SRC =
  "C:/Users/Juan/Documents/certidemy/supabase/functions/generate-mock-exam/index.ts";
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

/* The anchor: the line immediately after the session insert. Unique in the file. */
const ANCHOR =
  'if (sErr || !session) throw new Error(`quiz_sessions insert: ${sErr?.message}`);';

/* Built without template literals so this file stays paste-safe from a shell. */
const INSERTION = [
  "",
  "    // 10b. Record the SERVED FORM. One row per item, in presented order,",
  "    //      with the form's language. score-mock-exam grades against these",
  "    //      rows instead of the client's submitted array - see migration 163",
  "    //      for what that closes.",
  "    //",
  "    //      Order here is authoritative: finalQuestions is the exact array",
  "    //      returned to the client, so index === the position the candidate",
  "    //      sees, and it matches quiz_attempts.presented_order at scoring.",
  "    const served_rows = finalQuestions.map((q, presented_order) => ({",
  "      session_id: session.id,",
  "      question_id: q.id,",
  "      presented_order,",
  "      language,",
  "    }));",
  "",
  "    const { error: siErr } = await svc",
  "      .from(\"exam_session_items\")",
  "      .insert(served_rows);",
  "",
  "    if (siErr) {",
  "      // A form we cannot record is a form we cannot score honestly. Refuse",
  "      // rather than hand out secure items with no server-side record of",
  "      // what was issued. For a real exam the attempt is already consumed at",
  "      // this point (same position as the blueprint-integrity gate above);",
  "      // ops re-issues from the audit trail.",
  "      console.error(\"exam_session_items insert failed\", siErr);",
  "      throw new Error(",
  "        \"could not record the assembled form (\" + siErr.message + \"). \" +",
  "        \"The exam was not issued.\",",
  "      );",
  "    }",
].join("\n");

if (!existsSync(SRC)) {
  console.error("generate-mock-exam/index.ts not found at " + SRC);
  process.exit(1);
}

let text = readFileSync(SRC, "utf8");
const before = text.length;

console.log("Exam form recording " + (DRY_RUN ? "[DRY RUN]" : "[LIVE]") + "\n");

/* Idempotence: refuse to double-apply. */
if (text.includes("exam_session_items")) {
  console.log("  already patched - 'exam_session_items' is present. Nothing to do.");
  process.exit(0);
}

const hits = text.split(ANCHOR).length - 1;
if (hits !== 1) {
  console.log("  FAIL anchor found " + hits + " times, expected 1");
  console.log("       looked for: " + ANCHOR);
  process.exit(1);
}
console.log("  ok   anchor located");

text = text.replace(ANCHOR, ANCHOR + INSERTION);

/* Sanity: the variables the insertion depends on must exist in the file. */
const needs = ["finalQuestions", "session.id", "let language", "svc"];
let missing = 0;
for (const n of needs) {
  if (!text.includes(n)) {
    console.log("  FAIL expected identifier not found: " + n);
    missing++;
  }
}
if (missing > 0) {
  console.log("\nThe file's shape is not what this patch assumes. Nothing written.");
  process.exit(1);
}
console.log("  ok   dependencies present (finalQuestions, session.id, language, svc)");

console.log("\nbytes " + before + " -> " + text.length);

if (DRY_RUN) {
  console.log("\n--- would insert after the session insert ---");
  console.log(INSERTION);
  console.log("\nDRY RUN - nothing written.");
} else {
  writeFileSync(SRC, text, { encoding: "utf8" });
  console.log("\nwritten.");
  console.log("Deploy: supabase functions deploy generate-mock-exam");
  console.log("");
  console.log("The vulnerability is NOT yet closed. score-mock-exam still grades");
  console.log("the client's submitted array. Forms are now recorded and ignored,");
  console.log("which is today's behaviour and no worse. The enforcement change is next.");
}
