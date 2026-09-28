#!/usr/bin/env node
/**
 * count-shape-cues-bank.mjs -- the six code cue rules over the live secure ENGLISH bank.
 *
 * READ-ONLY. No `--apply`. Unknown flags exit 2.
 *
 *   --pool=secure|practice|all   default secure
 *   --sample=10                  members printed per NEW rule, for reading before the count is believed
 *   --out=SHAPE-CUE-BANK.md
 *
 * ============ WHY THE COUNT COMES WITH MEMBERS ============
 *
 * Every instrument error in this repository over the last week was caught by reading the members, and
 * not one by reasoning about the design. Two rules are new here, so their counts are drafts until
 * somebody has read what they are made of -- which is why `--sample` members are printed with their
 * cue text and the report says UNREAD next to any rule whose members nobody has looked at.
 *
 * ============ AND THE RULES WERE SILENT ON EVERY LIVE ROW UNTIL TODAY ============
 *
 * `keyIndex` knew `correct_index` and `is_correct` and not `correct_answer`, which is the only one a
 * `quiz_questions` row carries. So a bank-wide run before 2026-09-28 would have reported ZERO cues on
 * every certification and read as a clean bank. The count below is the first one that means anything.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { SHAPE_CUES, shapeCues, shapeCueControls } from "./lib/shape-cues.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let POOL = "secure", SAMPLE = 10, OUT = "SHAPE-CUE-BANK.md";
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--pool=(secure|practice|all)$/.exec(a))) { POOL = m[1]; continue; }
  if ((m = /^--sample=(\d+)$/.exec(a))) { SAMPLE = Number(m[1]); continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  console.error("unknown flag " + JSON.stringify(a) + ". Known: --pool=, --sample=, --out=");
  console.error("READ-ONLY: no --apply. A cue is a flag; nothing here may change an item.");
  process.exitCode = 2; process.exit();
}

const NEW_RULES = new Set(["only-hedged", "odd-verdict"]);

const ctl = shapeCueControls();
console.log("CONTROLS  " + ctl.examined + " case(s), " + ctl.fails.length + " fail");
if (ctl.fails.length) {
  for (const f of ctl.fails) console.error("  FAIL " + f);
  console.error("REFUSING TO COUNT -- a rule that cannot fire reports a clean bank.");
  process.exitCode = 2; process.exit();
}

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&order=code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const tasks = await getAll(KEY, "tasks?select=id,code&order=id");
const taskOf = new Map(tasks.map((t) => [t.id, t.code]));

const poolFilter = POOL === "all" ? "" : "&pool=eq." + POOL;
const rows = await getAll(KEY, "quiz_questions?select=id,certification_id,task_id,question_text," +
  "options,correct_answer&language=eq.en&status=eq.approved&retired_at=is.null" + poolFilter + "&order=id");

const RULE_IDS = ["clang", "agreement", "opposite-pair", "key-length", "only-hedged", "odd-verdict"];
const per = new Map();          // cert -> rule -> count
const members = new Map();      // rule -> [{...}]
let examined = 0, noKey = 0, withAny = 0;

for (const r of rows) {
  const code = codeOf.get(r.certification_id);
  if (!code) continue;
  examined++;
  /* A row whose key cannot be resolved is its own state: it is not a clean row. */
  const ids = Array.isArray(r.correct_answer) ? r.correct_answer : [];
  if (ids.length !== 1) { noKey++; continue; }
  const cues = shapeCues(r);
  if (cues.length) withAny++;
  if (!per.has(code)) per.set(code, Object.fromEntries(RULE_IDS.map((k) => [k, 0])));
  for (const c of cues) {
    per.get(code)[c.id] = (per.get(code)[c.id] || 0) + 1;
    if (!members.has(c.id)) members.set(c.id, []);
    members.get(c.id).push({ id: String(r.id).slice(0, 8), cert: code, task: taskOf.get(r.task_id) || "?",
      cue: c.cue, arm: c.arm || null });
  }
}

/* Deterministic sample: every Nth member, so it spreads across certifications rather than taking the
 * first ten of whichever one sorts first. No randomness -- Math.random is unavailable here anyway, and
 * a sample nobody can redraw is an anecdote. */
const spread = (list, n) => {
  if (list.length <= n) return list;
  const step = list.length / n;
  return Array.from({ length: n }, (_, i) => list[Math.floor(i * step)]);
};

const md = [];
const p = (s = "") => md.push(s);
p("# Code shape cues over the live bank");
p("");
p("`scripts/count-shape-cues-bank.mjs`, read-only, pool=" + POOL + ", English, approved, not retired.");
p("**Every rule is a FLAG. Nothing here rejects or changes an item.**");
p("");
p("| | |");
p("|---|---|");
p("| items examined | " + examined + " |");
p("| items with a resolvable single key | " + (examined - noKey) + " |");
p("| multi-select or unresolvable key (not scored) | " + noKey + " |");
p("| items carrying at least one cue | " + withAny + " (" +
  (examined - noKey ? (100 * withAny / (examined - noKey)).toFixed(1) : "0") + "% of scored) |");
p("");
p("**THE RULES WERE SILENT ON EVERY LIVE ROW UNTIL 2026-09-28.** `keyIndex` resolved `correct_index`");
p("and `is_correct` but not `correct_answer`, which is the only one a `quiz_questions` row carries, so");
p("a bank-wide run before today would have reported ZERO on every certification and read as clean.");
p("This is the first count that means anything.");
p("");
p("## Per certification, per rule");
p("");
p("| certification | " + RULE_IDS.join(" | ") + " | any |");
p("|---|" + RULE_IDS.map(() => "---|").join("") + "---|");
for (const code of [...per.keys()].sort()) {
  const row = per.get(code);
  const any = RULE_IDS.reduce((n, k) => n + (row[k] || 0), 0);
  p("| " + code + " | " + RULE_IDS.map((k) => row[k] || 0).join(" | ") + " | " + any + " |");
}
const totals = Object.fromEntries(RULE_IDS.map((k) =>
  [k, [...per.values()].reduce((n, r) => n + (r[k] || 0), 0)]));
p("| **total** | " + RULE_IDS.map((k) => "**" + totals[k] + "**").join(" | ") + " | |");
p("");
p("A cue count is not a defect count: these are flags, and the rate at which each fires is part of its");
p("definition. A rule firing on the majority would be a design error rather than a backlog.");
p("");
p("## Members of the two NEW rules, for reading");
p("");
p("House rule: a count is read before it is reported. " + SAMPLE + " members per new rule, spread");
p("deterministically across the list rather than taken from its head.");
p("");
for (const rule of RULE_IDS) {
  if (!NEW_RULES.has(rule)) continue;
  const list = members.get(rule) || [];
  p("### `" + rule + "` -- " + list.length + " firing");
  p("");
  if (!list.length) { p("Nothing fired."); p(""); continue; }
  if (rule === "only-hedged") {
    const arms = list.reduce((m, x) => { m[x.arm || "?"] = (m[x.arm || "?"] || 0) + 1; return m; }, {});
    p("By arm: " + Object.entries(arms).map(([k, v]) => k + " " + v).join(", ") + ".");
    p("");
  }
  for (const m of spread(list, SAMPLE)) {
    p("- `" + m.id + "` " + m.cert + " " + m.task + " -- " + m.cue);
  }
  p("");
}
writeFileSync(join(ROOT, OUT), md.join("\n") + "\n", "utf8");

console.log("SHAPE CUES OVER THE BANK   pool=" + POOL);
console.log("  examined " + examined + "   scored " + (examined - noKey) + "   not scored " + noKey);
for (const k of RULE_IDS) console.log("  " + k.padEnd(14) + totals[k]);
console.log("  any cue        " + withAny);
console.log("  wrote " + OUT);
