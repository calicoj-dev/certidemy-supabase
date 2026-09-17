#!/usr/bin/env node
/**
 * fix-servant-leader-stems.mjs - repair two secure stems that use the retired
 * label as a current descriptor of the role.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * ============ THE DEFECT ============
 *
 * Two SM-AI-I secure, approved, exam-scope stems read
 *
 *     "A servant-leader Scrum Master should:"
 *
 * while THREE ITEMS IN THE SAME SECURE BANK key on that term being retired:
 * "'Servant-leader' is legacy terminology; the 2020 guide uses 'true leader'",
 * "making 'servant-leader' outdated terminology", "it is outdated; the 2020
 * guide uses 'true leader'". A candidate can be marked wrong for believing what
 * another item on the same exam presents as current usage.
 *
 * It is in the STEM, which is the part a candidate must accept as true in order
 * to answer at all -- unlike a distractor, where a retired term may be the
 * misconception under test.
 *
 * ============ WHY THE REPLACEMENT IS NOT INVENTED ============
 *
 * The es-419 and pt-BR siblings ARE ALREADY CORRECT:
 *
 *     es-419  "Un Scrum Master con liderazgo de servicio deberia:"
 *     pt-BR   "Um Scrum Master com lideranca servidora deve:"
 *
 * Both describe the leadership STANCE -- the philosophy the 2020 Guide retained
 * -- rather than the retired role LABEL. So the repair brings English into line
 * with its own siblings instead of inventing a new framing, which is the same
 * argument the terminology pass used for lesson 05-03.
 *
 * "A Scrum Master leading through service should:" mirrors that. The bare
 * alternative -- "A Scrum Master should:" -- removes the stance framing
 * entirely and changes what the item asks.
 *
 * ============ WHY A STEM EDIT AND NOT A RETIREMENT ============
 *
 * Both items sit on task 5.4, which holds EXACTLY 9 secure items per language
 * against a floor of 8. Retiring both takes it to 7 and fails `floors.secure`
 * on SM-AI-I. Retiring one leaves zero margin.
 *
 * Neither item has ever been served: 0 rows in exam_session_items, 0 in
 * quiz_attempts. The control for that is that 222 of SM-AI-I's 1,407 secure
 * items HAVE been served, including 5 of task 5.4's 27 -- so "never served" is
 * a fact about these two, not an artifact of an unused bank. There is no
 * response history to protect and no item statistics to invalidate.
 *
 * ============ WHAT IT DOES NOT TOUCH ============
 *
 * The key, all four options, `correct_answer`, the explanation, `difficulty`,
 * `bloom_level`, `status`, and `bank_revision`. The explanations say "A servant
 * leader serves..." -- the unhyphenated philosophy term, which this bank's own
 * keys assert was RETAINED, so it is correct and stays.
 *
 * `bank_revision` is deliberately NOT bumped: its column comment reserves it
 * for the item-bank GENERATION that produced the item, not for a wording fix.
 *
 * ONE COST, NAMED: "servant-leader" in the stem primes the service-oriented
 * option, which is the key in both. Removing it probably makes both marginally
 * harder. With zero exposures there are no statistics to invalidate -- and no
 * baseline to compare against afterwards either.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". --apply family: dry by default.");
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

const FIND = "A servant-leader Scrum Master should:";
const REPL = "A Scrum Master leading through service should:";

const TARGETS = [
  { group: "3eb5ffb4-2bff-4ca6-a2dd-ba1e8133f55a", id: "fd090cf0-7620-4dbb-97ea-b4797e36a4cf" },
  { group: "7b7d2c15-395a-4049-98a1-d237768b393d", id: "4f8327e8-53c5-49fe-ae7b-f61c097e957c" },
];

/* Frozen per ROW, so the negative half can name the four siblings that must not
 * move rather than inferring it from a total. */
const FROZEN = ["options", "correct_answer", "explanation", "difficulty", "bloom_level",
  "status", "bank_revision", "retired_at", "retired_vocabulary_intent", "is_exam_scope"];
const snap = (q) => JSON.stringify(FROZEN.map((k) => q[k]));

console.log("");
console.log(APPLY ? "MODE: apply" : "MODE: dry -- nothing will be written");
console.log("  \"" + FIND + "\"");
console.log("  \"" + REPL + "\"");
console.log("");

const before = new Map();
const plan = [];
for (const t of TARGETS) {
  const rows = await rest("/quiz_questions?select=id,language,question_text," + FROZEN.join(",") +
    "&question_group_id=eq." + t.group);
  if (rows.length !== 3) {
    console.error("group " + t.group + " has " + rows.length + " rows, expected 3. Refusing.");
    process.exit(1);
  }
  for (const r of rows) before.set(r.id, { snap: snap(r), stem: r.question_text });

  const en = rows.find((r) => r.id === t.id);
  if (!en) { console.error("the named English row is not in its own group. Refusing."); process.exit(1); }
  if (en.language !== "en") { console.error("row " + t.id + " is " + en.language + ", not en. Refusing."); process.exit(1); }

  const done = en.question_text.includes(REPL);
  const has = en.question_text.includes(FIND);
  if (!done && !has) {
    console.error("row " + t.id + " contains NEITHER the old phrase nor the new one.");
    console.error("Refusing: the stem has changed since this script was written.");
    console.error("  " + en.question_text);
    process.exit(1);
  }
  const after = en.question_text.replace(FIND, REPL);
  plan.push({ ...t, rows, en, after, done });

  console.log("GROUP " + t.group.slice(0, 8) + "   en " + t.id.slice(0, 8) + (done ? "   ALREADY DONE" : ""));
  console.log("  -  " + en.question_text);
  console.log("  +  " + after);
  /* The siblings are printed so the reviewer can see the target phrasing that
   * makes this a realignment rather than an invention. */
  for (const r of rows.filter((r) => r.language !== "en").sort((a, b) => a.language.localeCompare(b.language))) {
    console.log("  =  [" + r.language + "] " + r.question_text.slice(-70).trim());
  }
  console.log("");
}

const todo = plan.filter((p) => !p.done);
console.log(todo.length + " row(s) to change");
if (!APPLY) {
  console.log("");
  console.log("Dry run. Re-run with --apply.");
  process.exit(0);
}

for (const p of todo) {
  await rest("/quiz_questions?id=eq." + p.id, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ question_text: p.after }),
  });
  console.log("  wrote " + p.id);
}

/* ===================== POST-CONDITIONS, BOTH DIRECTIONS ===================== */
console.log("");
console.log("POST-CONDITIONS");
const checks = [];
const check = (n, ok, d) => { checks.push({ n, ok, d }); console.log("  " + (ok ? "ok  " : "FAIL") + "  " + n + "  -- " + d); };

let enOk = 0, sibMoved = [], frozenMoved = [], stillRetired = [];
for (const p of plan) {
  const rows = await rest("/quiz_questions?select=id,language,question_text," + FROZEN.join(",") +
    "&question_group_id=eq." + p.group);
  for (const r of rows) {
    if (snap(r) !== before.get(r.id).snap) frozenMoved.push(r.id);
    if (r.id === p.id) {
      if (r.question_text === p.after) enOk++;
      if (r.question_text.includes("servant-leader")) stillRetired.push(r.id);
    } else if (r.question_text !== before.get(r.id).stem) {
      sibMoved.push(r.language + "/" + r.id);
    }
  }
}
check("both English stems read the mirrored phrasing", enOk === 2, enOk + " of 2");
check("neither English stem still says 'servant-leader'", stillRetired.length === 0,
  stillRetired.length ? stillRetired.join(",") : "0");
check("the FOUR translated stems are byte-identical", sibMoved.length === 0,
  sibMoved.length ? "MOVED: " + sibMoved.join(",") : "4 of 4 unchanged");
check("options, key, explanation, difficulty, bloom, status, bank_revision unmoved",
  frozenMoved.length === 0,
  frozenMoved.length ? "MOVED: " + frozenMoved.join(",") : before.size + " row(s) compared");

/* THE FLOOR, MEASURED RATHER THAN ASSUMED. An edit must not move it, and saying
 * so is cheaper than trusting that a PATCH of one column could not. */
const T54 = "4dfef9f9-19cc-49af-8351-ba294e5cc2b1";
const floorRows = await rest("/quiz_questions?select=language&certification_id=eq." +
  "11111111-1111-1111-1111-111111111111&pool=eq.secure&task_id=eq." + T54 +
  "&status=eq.approved&is_exam_scope=is.true");
const per = {};
for (const r of floorRows) per[r.language] = (per[r.language] ?? 0) + 1;
const low = Object.entries(per).filter(([, n]) => n < 8);
check("task 5.4 still at or above the secure floor of 8 per language",
  low.length === 0 && Object.keys(per).length === 3,
  Object.entries(per).map(([l, n]) => l + "=" + n).join("  "));

const failed = checks.filter((c) => !c.ok);
console.log("");
console.log("passed " + (checks.length - failed.length) + "   failed " + failed.length);
console.log(failed.length ? "POST-CONDITIONS FAILED." : "Two stems realigned with their own translations.");
process.exitCode = failed.length ? 1 : 0;
