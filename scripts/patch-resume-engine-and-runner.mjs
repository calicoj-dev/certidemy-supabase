/**
 * patch-resume-engine-and-runner.mjs
 *
 * Two files, five edits:
 *
 *   lib/engine/client.ts   - getActiveExamSession + its arg and result types
 *   components/exam/exam-runner.tsx - accept savedAnswers and hydrate from them
 *
 * Both are inert until mock-exam.tsx passes savedAnswers and calls the endpoint.
 * Nothing changes for a candidate from this patch alone, which is deliberate:
 * a "Resume exam" affordance that navigated to the exam page today would START A
 * NEW EXAM, and on a certification exam that consumes another voucher. Resume
 * detection has to exist before anything links to it.
 *
 * WHY HYDRATION RESTORES ACCRUED TIME TOO
 *
 * timeAccrued is seeded from the saved time_taken_seconds, not reset to zero. If
 * a resumed exam started every item's timer from scratch, the per-item timings
 * would understate how long a candidate actually spent - and those timings are
 * the substrate for person-fit and pre-knowledge analysis. A resume that
 * silently corrupted the timing record would quietly damage the thing the whole
 * telemetry chain exists to support.
 *
 * ALL FIVE ANCHORS ARE VALIDATED BEFORE ANY ARE APPLIED. Partial application
 * across two files is worse than none.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:DRY_RUN="1"; node scripts\patch-resume-engine-and-runner.mjs
 *   Remove-Item Env:\DRY_RUN; node scripts\patch-resume-engine-and-runner.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const WEB = "C:/Users/Juan/Documents/certidemy/certidemy-web";
const CLIENT = WEB + "/lib/engine/client.ts";
const RUNNER = WEB + "/components/exam/exam-runner.tsx";
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

/* ==================================================================== */
/* client.ts                                                            */
/* ==================================================================== */

const C1_FROM = [
  "  /** True for a session issued before form recording shipped (migration 163). */",
  "  legacy_session?: boolean;",
  "  detail?: string;",
  "}",
].join("\n");

const C1_TO = [
  "  /** True for a session issued before form recording shipped (migration 163). */",
  "  legacy_session?: boolean;",
  "  detail?: string;",
  "}",
  "",
  "export interface GetActiveExamSessionArgs {",
  "  /** Narrow to one certification. Omitted returns any open session. */",
  "  certification_id?: string;",
  "}",
  "",
  "export interface ActiveExamSavedAnswer {",
  "  question_id: string;",
  "  user_answer: string[];",
  "  time_taken_seconds: number | null;",
  "  marked_for_review: boolean;",
  "}",
  "",
  "/**",
  " * Four outcomes in one shape, distinguished by which fields are present:",
  " *",
  " *   active: true                 - a live session, with its recorded form and",
  " *                                  whatever the candidate had already saved.",
  " *   active: false                - nothing open.",
  " *   active: false + finalized    - an expired session was just scored from what",
  " *                                  had been persisted. Tell the candidate.",
  " *   active: false + unscoreable  - a session with no recorded form (pre-163).",
  " *                                  Cannot be resumed or scored; an admin closes",
  " *                                  it. Not the candidate's problem to see.",
  " */",
  "export interface GetActiveExamSessionResult {",
  "  active: boolean;",
  "  session_id?: string;",
  '  kind?: "mock_exam" | "certification_exam";',
  "  certification_id?: string;",
  "  certification_code?: string | null;",
  "  certification_name?: string | null;",
  '  language?: "en" | "es-419" | "pt-BR";',
  "  started_at?: string;",
  "  duration_minutes?: number;",
  "  passing_score_pct?: number;",
  "  /** The SERVER's clock. Trust this over anything computed locally. */",
  "  seconds_remaining?: number;",
  "  total_questions?: number;",
  "  /** The recorded form, re-served in presented_order. */",
  "  questions?: MockExamQuestion[];",
  "  saved_answers?: ActiveExamSavedAnswer[];",
  "  /** Recorded items that no longer exist in quiz_questions. */",
  "  missing_items?: number;",
  "  finalized?: {",
  "    session_id: string;",
  "    score_pct: number | null;",
  "    passed: boolean | null;",
  "    total_questions?: number;",
  "    answered_before_abandon?: number;",
  "  };",
  "  unscoreable?: boolean;",
  "  finalize_failed?: boolean;",
  "  detail?: string;",
  "}",
].join("\n");

const C2_FROM = [
  "  saveExamAnswer(args: SaveExamAnswerArgs): Promise<SaveExamAnswerResult> {",
  '    return this.invoke<SaveExamAnswerResult>("save-exam-answer", args);',
  "  }",
].join("\n");

const C2_TO = [
  "  saveExamAnswer(args: SaveExamAnswerArgs): Promise<SaveExamAnswerResult> {",
  '    return this.invoke<SaveExamAnswerResult>("save-exam-answer", args);',
  "  }",
  "",
  "  /**",
  "   * Is there an exam in progress, and what exactly was the candidate looking",
  "   * at? Returns the recorded form plus saved answers for a live session.",
  "   *",
  "   * SIDE EFFECT, DELIBERATELY: if it finds an EXPIRED session it finalises it,",
  "   * scoring whatever had been persisted. That is how an abandoned attempt gets",
  "   * closed - auto-submit at zero needs a browser, and there isn't one. So this",
  "   * is not a pure read, and calling it on mount is what drains the backlog.",
  "   */",
  "  getActiveExamSession(",
  "    args: GetActiveExamSessionArgs = {}",
  "  ): Promise<GetActiveExamSessionResult> {",
  '    return this.invoke<GetActiveExamSessionResult>("get-active-exam-session", args);',
  "  }",
].join("\n");

/* ==================================================================== */
/* exam-runner.tsx                                                      */
/* ==================================================================== */

const R1_FROM = [
  "  /** Server session id - required to persist answers. */",
  "  sessionId: string;",
].join("\n");

const R1_TO = [
  "  /** Server session id - required to persist answers. */",
  "  sessionId: string;",
  "  /**",
  "   * Answers already persisted for this session, from",
  "   * get-active-exam-session. Present only on a resume. Seeds answers, marks",
  "   * AND accrued time - see the note on timeAccrued below.",
  "   */",
  "  savedAnswers?: {",
  "    question_id: string;",
  "    user_answer: string[];",
  "    time_taken_seconds: number | null;",
  "    marked_for_review: boolean;",
  "  }[];",
].join("\n");

const R2_FROM = [
  "  sessionId,",
  "  onSubmit,",
].join("\n");

const R2_TO = [
  "  sessionId,",
  "  savedAnswers,",
  "  onSubmit,",
].join("\n");

const R3_FROM = [
  "  const [answers, setAnswers] = useState<Record<string, string[]>>({});",
  "  const [marked, setMarked] = useState<Record<string, boolean>>({});",
].join("\n");

const R3_TO = [
  "  // Seeded from whatever the server already holds for this session. Empty for",
  "  // a fresh exam; on a resume the candidate returns to their own work.",
  "  const [answers, setAnswers] = useState<Record<string, string[]>>(() => {",
  "    const seed: Record<string, string[]> = {};",
  "    for (const a of savedAnswers ?? []) {",
  "      if (Array.isArray(a.user_answer)) seed[a.question_id] = a.user_answer;",
  "    }",
  "    return seed;",
  "  });",
  "  const [marked, setMarked] = useState<Record<string, boolean>>(() => {",
  "    const seed: Record<string, boolean> = {};",
  "    for (const a of savedAnswers ?? []) {",
  "      if (a.marked_for_review) seed[a.question_id] = true;",
  "    }",
  "    return seed;",
  "  });",
].join("\n");

const R4_FROM = [
  "  // Per-question time tracking - when each question was first shown.",
  "  const questionEnteredAt = useRef<Record<string, number>>({});",
  "  const timeAccrued = useRef<Record<string, number>>({});",
].join("\n");

const R4_TO = [
  "  // Per-question time tracking - when each question was first shown.",
  "  const questionEnteredAt = useRef<Record<string, number>>({});",
  "  // Seeded from saved time, NOT reset to zero. A resume that restarted every",
  "  // item's timer would understate how long the candidate actually spent, and",
  "  // those per-item timings are the substrate for person-fit and pre-knowledge",
  "  // analysis. Corrupting the timing record on resume would quietly damage the",
  "  // thing the telemetry exists to support.",
  "  const timeAccrued = useRef<Record<string, number>>(",
  "    Object.fromEntries(",
  "      (savedAnswers ?? [])",
  '        .filter((a) => typeof a.time_taken_seconds === "number")',
  "        .map((a) => [a.question_id, a.time_taken_seconds as number])",
  "    )",
  "  );",
].join("\n");

/* ==================================================================== */

const FILES = [
  [
    CLIENT,
    "lib/engine/client.ts",
    "getActiveExamSession",
    [
      ["arg + result types", C1_FROM, C1_TO],
      ["Engine.getActiveExamSession", C2_FROM, C2_TO],
    ],
  ],
  [
    RUNNER,
    "components/exam/exam-runner.tsx",
    "savedAnswers",
    [
      ["savedAnswers prop type", R1_FROM, R1_TO],
      ["savedAnswers destructure", R2_FROM, R2_TO],
      ["hydrate answers + marks", R3_FROM, R3_TO],
      ["hydrate accrued time", R4_FROM, R4_TO],
    ],
  ],
];

console.log("Resume: engine + runner " + (DRY_RUN ? "[DRY RUN]" : "[LIVE]") + "\n");

/* ---- phase 1: validate everything, touch nothing -------------------- */
const staged = [];
let bad = 0;

for (const [path, label, sentinel, edits] of FILES) {
  if (!existsSync(path)) {
    console.log("  FAIL " + label + ": not found at " + path);
    bad += 1;
    continue;
  }
  let text = readFileSync(path, "utf8");
  console.log("== " + label + " ==");

  if (text.includes(sentinel)) {
    console.log("  --   already patched ('" + sentinel + "' present) - skipping file");
    console.log("");
    continue;
  }

  let ok = true;
  for (const [editLabel, from] of edits) {
    const hits = text.split(from).length - 1;
    if (hits === 1) {
      console.log("  ok   " + editLabel);
    } else {
      console.log("  FAIL " + editLabel + ": anchor found " + hits + " times, expected 1");
      console.log(from.split("\n").map((l) => "         " + l).join("\n"));
      ok = false;
      bad += 1;
    }
  }
  if (ok) {
    for (const [, from, to] of edits) text = text.replace(from, to);
    staged.push([path, label, text]);
  }
  console.log("");
}

if (bad > 0) {
  console.log(bad + " anchor(s) did not match. NOTHING written across either file.");
  process.exit(1);
}

/* ---- phase 2: write -------------------------------------------------- */
if (staged.length === 0) {
  console.log("Nothing to do.");
  process.exit(0);
}

for (const [path, label, text] of staged) {
  if (DRY_RUN) {
    console.log("would write " + label + " (" + text.length + " bytes)");
  } else {
    writeFileSync(path, text, { encoding: "utf8" });
    console.log("wrote " + label);
  }
}

if (!DRY_RUN) {
  console.log("");
  console.log("Run `npm run build`. Both changes are inert until mock-exam.tsx");
  console.log("calls getActiveExamSession and passes savedAnswers - which is next.");
}
