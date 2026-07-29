/**
 * patch-engine-save-exam-answer.mjs
 *
 * Adds saveExamAnswer to the Engine client (lib/engine/client.ts) so the exam
 * runner can persist answers during an exam through the same typed wrapper
 * every other edge function call goes through.
 *
 * WHY THROUGH THE ENGINE AND NOT A DIRECT INVOKE. client.ts owns retry policy
 * (one retry on network/5xx, none on auth or validation) and error
 * classification - a 409 from an expired session becomes a ValidationError that
 * does NOT retry, which is exactly the behaviour a save needs. A component
 * calling functions.invoke directly would reimplement all of that, badly.
 *
 * WHY THE RESULT TYPE LIVES IN client.ts. Every other result type is in types.ts
 * and re-exported through index.ts. This one is declared beside its args instead,
 * because the consumer only needs the method's inferred return - and adding a
 * third file to this change buys nothing. If it ever needs importing by name,
 * move it to types.ts then.
 *
 * Two anchored insertions, both verified before writing. Idempotent.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:DRY_RUN="1"; node scripts\patch-engine-save-exam-answer.mjs
 *   Remove-Item Env:\DRY_RUN; node scripts\patch-engine-save-exam-answer.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SRC = "C:/Users/Juan/Documents/certidemy/certidemy-web/lib/engine/client.ts";
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

const ANCHOR_TYPES = [
  "export interface GetExamEligibilityArgs {",
  "  certification_id: string;",
  "}",
].join("\n");

const TYPES = [
  "",
  "export interface SaveExamAnswerArgs {",
  "  session_id: string;",
  "  answers: {",
  "    question_id: string;",
  "    user_answer: string[];",
  "    time_taken_seconds?: number;",
  "    marked_for_review?: boolean;",
  "  }[];",
  "}",
  "",
  "export interface SaveExamAnswerResult {",
  "  /** How many answers the server actually wrote. */",
  "  saved: number;",
  "  /** Answers rejected because they were not in the served form, or malformed. */",
  "  skipped: number;",
  "  /**",
  "   * Seconds left on the SERVER's clock. Browsers throttle timers in",
  "   * background tabs, so a client countdown drifts slow; the runner uses this",
  "   * to correct itself on every save.",
  "   */",
  "  seconds_remaining: number | null;",
  "  /** True when the examination window has closed and nothing was written. */",
  "  expired?: boolean;",
  "  /** True for a session issued before form recording shipped (migration 163). */",
  "  legacy_session?: boolean;",
  "  detail?: string;",
  "}",
].join("\n");

const ANCHOR_METHOD = [
  "  getExamEligibility(args: GetExamEligibilityArgs): Promise<ExamEligibility> {",
  '    return this.invoke<ExamEligibility>("get-exam-eligibility", args);',
  "  }",
].join("\n");

const METHOD = [
  "",
  "  /**",
  "   * Persist in-progress exam answers. Called on answer change (debounced) and",
  "   * flushed when the tab is hidden or unloaded.",
  "   *",
  "   * The server writes only items that were actually served for this session,",
  "   * refuses a completed session, refuses a caller who does not own it, and",
  "   * refuses writes past the examination window. A rejected save is therefore",
  "   * information, not a bug to route around: the runner keeps the answer in",
  "   * state and retries on the next flush.",
  "   */",
  "  saveExamAnswer(args: SaveExamAnswerArgs): Promise<SaveExamAnswerResult> {",
  '    return this.invoke<SaveExamAnswerResult>("save-exam-answer", args);',
  "  }",
].join("\n");

if (!existsSync(SRC)) {
  console.error("client.ts not found at " + SRC);
  process.exit(1);
}

let text = readFileSync(SRC, "utf8");
const before = text.length;

console.log("Engine saveExamAnswer " + (DRY_RUN ? "[DRY RUN]" : "[LIVE]") + "\n");

if (text.includes("saveExamAnswer")) {
  console.log("  already patched - 'saveExamAnswer' is present. Nothing to do.");
  process.exit(0);
}

const edits = [
  ["arg + result types", ANCHOR_TYPES, TYPES],
  ["Engine.saveExamAnswer", ANCHOR_METHOD, METHOD],
];

for (const [label, anchor, insertion] of edits) {
  const hits = text.split(anchor).length - 1;
  if (hits !== 1) {
    console.log("  FAIL " + label + ": anchor found " + hits + " times, expected 1");
    console.log("       looked for:");
    console.log(anchor.split("\n").map((l) => "         " + l).join("\n"));
    process.exit(1);
  }
  text = text.replace(anchor, anchor + insertion);
  console.log("  ok   " + label);
}

console.log("\nbytes " + before + " -> " + text.length);

if (DRY_RUN) {
  console.log("\nDRY RUN - nothing written.");
} else {
  writeFileSync(SRC, text, { encoding: "utf8" });
  console.log("\nwritten. Run `npm run build` - client.ts is typed and the");
  console.log("runner change depends on this landing first.");
}
