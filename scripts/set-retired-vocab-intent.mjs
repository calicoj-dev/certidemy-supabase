#!/usr/bin/env node
/**
 * set-retired-vocab-intent.mjs - record a judgement in
 * `quiz_questions.retired_vocabulary_intent`.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * NO CONTENT CHANGE. It writes exactly one column and asserts, after the fact,
 * that `question_text`, `options`, `correct_answer` and `explanation` are
 * byte-identical to what they were before. The exam bank is not touched.
 *
 * ============ THE GROUP IS THE UNIT, NOT THE ROW ============
 *
 * verify-cert reads the exemption PER GROUP -- `question_group_id` binds the
 * en / es-419 / pt-BR siblings, and a re-translated row must not lose an
 * exemption its siblings keep. So this writes every row of a group or none of
 * it, and refuses a group whose rows it cannot enumerate.
 *
 * Group 8592a29a was found with `en = 'quoted'` and both translations `'none'`.
 * That group functions, because the read is per group, but the rows disagree and
 * the column cannot express "partly". It is normalised here.
 *
 * ============ WHAT 'quoted' DOES AND DOES NOT DO TODAY ============
 *
 * NOTHING SUPPRESSES ON THIS FAMILY YET. `RETIRED_HARD` in
 * lib/item-translation.mjs covers `self-organiz*` and `development team` and
 * DOES NOT CONTAIN `servant-leader` in any language. So verify-cert's
 * items.vocabulary check has never flagged one of these items, and setting the
 * flag suppresses no failure that exists.
 *
 * It is still worth writing, for the reason the column exists: it records a
 * judgement that was made. The risk it removes is the FUTURE one -- the day
 * someone adds `servant-leader` to the pattern, sixteen approved secure items
 * light up at once and whoever is on shift has to re-derive this reading under
 * release pressure. The flag is the answer to a question that has already been
 * asked properly.
 *
 * That also means the unmarked ones stay unmarked ON PURPOSE. Two of them are
 * content defects; if the pattern is widened later, they SHOULD fail.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--apply", "--spec"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ".");
    console.error("This is the --apply family: dry by default, --apply writes. Known: --apply, --spec.");
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");

const HERE = dirname(fileURLToPath(import.meta.url));
for (const p of [join(HERE, ".env"), join(HERE, "..", ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SVC) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: SVC, Authorization: "Bearer " + SVC, "content-type": "application/json" };

async function rest(path, init) {
  let last;
  for (let i = 0; i < 12; i++) {
    try {
      const r = await fetch(REST + path, { ...init, headers: { ...H, ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(45000) });
      const t = await r.text();
      if (!r.ok) throw new Error(r.status + " " + t.slice(0, 250));
      return t ? JSON.parse(t) : null;
    } catch (e) { last = e; }
  }
  throw new Error(path + ": " + last?.message);
}

/* ============ THE JUDGEMENT ============
 *
 * Six groups. In every one, the item's SUBJECT is the 2020 terminology change:
 * the retired term appears inside quotation marks or behind an explicit
 * `legacy` / `pre-2020` marker, and the key is a statement about the change.
 * Removing the term destroys the item, which is what migration 298 exists for.
 *
 * FIVE OF THE SIX PUT THE TERM IN SINGLE QUOTES IN THEIR OWN TEXT. That is the
 * structural signature, and it is worth more than any word list: an item testing
 * a retired label has to name the label, and naming it means quoting it. The
 * ones NOT marked here use the term bare, as ordinary description.
 */
const QUOTED = [
  { group: "269dc35e-5d7f-4bbb-b0bb-a489ddda6d16",
    why: "stem: a colleague claims the 2020 Guide dropped servant leadership; key states it changed only the term" },
  { group: "90ecdb8f-aaed-4ff1-9012-10e45ed77ca6",
    why: "stem quotes a legacy manual's 'servant-leader'; key states the 2020 Guide replaced it with 'true leader'" },
  { group: "b1530016-da91-4b84-9783-3e3825816aa1",
    why: "stem quotes a pre-2020 study guide; key states it is outdated against 'true leader'" },
  { group: "ea851b51-1853-44b0-8f66-e7cce1cbb613",
    why: "stem asks whether 'true leader who serves' changes behaviour; distractors turn on the retired label" },
  { group: "fb333d2c-b823-4aa2-b747-397eaa442679",
    why: "stem quotes a trainer's 'servant-leader' and a claim it is in the 2020 Guide; key calls it legacy" },
  { group: "ff67e169-e6f8-4d66-8a18-4460e7d5717a",
    why: "stem argues dropping 'servant' granted authority; key identifies the misreading" },
  // Normalisation, not a new judgement: this group was already ruled 'quoted'
  // on its English row and both translations were left at 'none'.
  { group: "8592a29a-e367-4dd0-800a-a201b210c052",
    why: "ALREADY RULED on en; the es-419 and pt-BR siblings are brought into line" },
];

const FROZEN = ["question_text", "options", "correct_answer", "explanation"];
const snap = (q) => JSON.stringify(FROZEN.map((k) => q[k]));

console.log("");
console.log(APPLY ? "MODE: apply" : "MODE: dry -- nothing will be written");
console.log("");

/* THE BASELINE, TAKEN BEFORE ANY WRITE. The negative post-condition below has
 * to distinguish "a group this script marked" from "a group that was already
 * marked", and the first version could not: it asserted that NO SM-AI-I secure
 * group outside its own list reads 'quoted', which is false and was false
 * before this script existed. Six groups carry the flag from the
 * `self-organizing` adjudication of 2026-09-12.
 *
 * It aborted on a true state. That is the guard-at-fault pattern CLAUDE.md
 * records five instances of in one day, and the tell is the same every time:
 * the assertion named a SET when the property was a DELTA. */
const baselineQuoted = new Set(
  (await rest("/quiz_questions?select=question_group_id&pool=eq.secure" +
    "&retired_vocabulary_intent=eq.quoted&certification_id=eq.11111111-1111-1111-1111-111111111111"))
    .map((r) => r.question_group_id),
);
console.log("baseline: " + baselineQuoted.size + " SM-AI-I secure group(s) already 'quoted' before this run");
console.log("");

const before = new Map();
const plan = [];
for (const g of QUOTED) {
  const rows = await rest("/quiz_questions?select=id,language,pool,status,is_exam_scope," +
    "retired_vocabulary_intent,question_text,options,correct_answer,explanation" +
    "&question_group_id=eq." + g.group);
  if (!rows.length) {
    console.error("GROUP " + g.group + " returned no rows. Refusing: a group this script cannot");
    console.error("enumerate is a group it cannot write atomically.");
    process.exit(1);
  }
  for (const r of rows) before.set(r.id, snap(r));
  const need = rows.filter((r) => r.retired_vocabulary_intent !== "quoted");
  plan.push({ ...g, rows, need });
  console.log("GROUP " + g.group);
  console.log("  " + g.why);
  console.log("  rows " + rows.map((r) => r.language + "/" + r.pool + "=" + r.retired_vocabulary_intent).join(" ") +
    "   to change: " + need.length);
}

const toWrite = plan.flatMap((p) => p.need.map((r) => r.id));
console.log("");
console.log(plan.length + " group(s), " + toWrite.length + " row(s) to set to 'quoted'");

if (!APPLY) {
  console.log("");
  console.log("Dry run. Re-run with --apply.");
  process.exit(0);
}
/* NO EARLY EXIT ON AN EMPTY PLAN. This script is idempotent, so a second run
 * has nothing to write -- and the first version exited here, BEFORE its own
 * post-conditions. That is a check that cannot fire: re-running to confirm the
 * state would have printed "Nothing to do" and told you nothing about whether
 * the state is right. The verification below is the point of a second run. */
if (!toWrite.length) {
  console.log("Nothing to write -- already in the intended state. Verifying it anyway.");
}

/* One statement per group, so a partial failure cannot leave a group split --
 * the state this script was partly written to remove. */
for (const p of plan) {
  if (!p.need.length) continue;
  await rest("/quiz_questions?question_group_id=eq." + p.group, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ retired_vocabulary_intent: "quoted" }),
  });
  console.log("  set " + p.group);
}

/* ============ POST-CONDITIONS: BOTH DIRECTIONS ============
 *
 * The positive half alone passes on a write that ALSO landed where it should
 * not -- and here "should not" is the whole point, because nine other groups
 * carry the same term and must stay 'none'.
 */
console.log("");
console.log("POST-CONDITIONS");
const checks = [];
const check = (n, ok, d) => { checks.push({ n, ok, d }); console.log("  " + (ok ? "ok  " : "FAIL") + "  " + n + "  -- " + d); };

let allQuoted = true, contentMoved = [];
for (const p of plan) {
  const after = await rest("/quiz_questions?select=id,language,retired_vocabulary_intent," +
    FROZEN.join(",") + "&question_group_id=eq." + p.group);
  if (after.some((r) => r.retired_vocabulary_intent !== "quoted")) allQuoted = false;
  for (const r of after) if (before.get(r.id) !== snap(r)) contentMoved.push(r.id);
}
check("every row of every marked group reads 'quoted'", allQuoted, plan.length + " group(s)");
check("NO CONTENT MOVED -- stem, options, key and explanation byte-identical",
  contentMoved.length === 0,
  contentMoved.length ? "CHANGED: " + contentMoved.join(",") : before.size + " row(s) compared");

/* THE NEGATIVE HALF, AS A DELTA. Permitted = the baseline plus this run's list;
 * anything else acquired the flag while this script was running, which is the
 * over-application the positive half alone would pass on. */
const permitted = new Set([...baselineQuoted, ...QUOTED.map((g) => g.group)]);
const census = await rest("/quiz_questions?select=question_group_id" +
  "&pool=eq.secure&retired_vocabulary_intent=eq.quoted" +
  "&certification_id=eq.11111111-1111-1111-1111-111111111111");
const nowQuoted = new Set(census.map((r) => r.question_group_id));
const stray = [...nowQuoted].filter((g) => !permitted.has(g));
check("no group acquired 'quoted' outside baseline + list",
  stray.length === 0,
  stray.length ? "STRAY: " + stray.join(",") : nowQuoted.size + " quoted group(s), all accounted for");

/* AND THE OTHER DIRECTION OF THE SAME PROPERTY: the nine servant-leader groups
 * NOT adjudicated must still read 'none'. Named individually, because a total
 * cannot tell "left alone" from "swept". */
const HELD = [
  "062d39d5-df62-4342-98e9-10b8931ef550", "17c43c1b-302d-46df-b6c7-134ff1402e3e",
  "3eb5ffb4-2bff-4ca6-a2dd-ba1e8133f55a", "433ea1df-2635-4f9f-8d13-3269d1c5853c",
  "7b7d2c15-395a-4049-98a1-d237768b393d", "970c49be-bf7c-4790-8cc1-fe91213339f1",
  "97694ab6-9e63-4aaa-b711-9d03bcef7e50", "c24a40bd-276a-425c-9df9-9fba73323594",
  "d8516d20-db56-4a25-ae34-4f66991419fa",
];
const heldRows = await rest("/quiz_questions?select=id,question_group_id,retired_vocabulary_intent" +
  "&question_group_id=in.(" + HELD.join(",") + ")");
const heldBad = heldRows.filter((r) => r.retired_vocabulary_intent !== "none");
check("the 9 groups held for a ruling are untouched at 'none'",
  heldBad.length === 0 && heldRows.length > 0,
  heldBad.length ? "MOVED: " + heldBad.map((r) => r.id).join(",") : heldRows.length + " row(s) still 'none'");

const failed = checks.filter((c) => !c.ok);
console.log("");
console.log("passed " + (checks.length - failed.length) + "   failed " + failed.length);
console.log(failed.length ? "POST-CONDITIONS FAILED." : "Intent recorded; content untouched.");
process.exitCode = failed.length ? 1 : 0;
