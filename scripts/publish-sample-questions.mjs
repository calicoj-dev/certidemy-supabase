#!/usr/bin/env node
/**
 * publish-sample-questions.mjs - flip practice items to visibility='public' so they
 * appear as the certification's sample questions.
 *
 * --apply TO WRITE. Dry by default. Unknown flags exit 2.
 *
 *   CERT_ID=... node scripts/publish-sample-questions.mjs --groups <uuid,uuid,...> [--apply]
 *   CERT_ID=... node scripts/publish-sample-questions.mjs --list        (what is public now)
 *
 * WHAT verify-cert REQUIRES, AND WHY EACH HALF EXISTS
 * ---------------------------------------------------
 * `samples.public` wants SIX items per language across SIX DISTINCT TASKS. Six per
 * language because the detail page renders in the candidate's locale and a missing
 * translation means a blank sample rather than a fallback. Six distinct TASKS because
 * two picks inside one task show the candidate one competence twice - that was AIHR-I
 * migration 149, and the check exists because of it.
 *
 * `samples.firewall` wants ZERO secure items with visibility <> 'secure'. THIS SCRIPT
 * REFUSES TO TOUCH A SECURE ROW, and that refusal is the point: a sample is a marketing
 * artifact and the secure pool is the examination. One careless flip would put an exam
 * item on a public page, and nothing downstream would object - the page would simply
 * render it.
 *
 * SAMPLES ARE NOT ONLY A CONFORMANCE ITEM. They are the only items a prospective
 * candidate reads before paying, so they do marketing work as well as demonstrating the
 * format. Choose them for what they show: the domains covered, the item contract, and
 * the competence that distinguishes the credential. That choice is a human's; this
 * script only applies it.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

const KNOWN = new Set(["--apply", "--groups", "--list"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error(`Unrecognised flag: ${a}`);
    console.error("This script opts into WRITING with --apply and is DRY by default.");
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");
const LIST = process.argv.includes("--list");
const gi = process.argv.indexOf("--groups");
const GROUPS = gi >= 0 && process.argv[gi + 1] ? process.argv[gi + 1].split(",").map((s) => s.trim()).filter(Boolean) : [];

for (const p of ["scripts/.env", ".env"]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const CERT_ID = process.env.CERT_ID;
if (!CERT_ID) { console.error("Set CERT_ID."); process.exit(2); }
const db = createClient(process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: tasks } = await db.from("tasks").select("id, code").eq("certification_id", CERT_ID);
const code = new Map((tasks || []).map((t) => [t.id, t.code]));

async function current() {
  const { data } = await db.from("quiz_questions")
    .select("id, language, task_id, pool, question_group_id")
    .eq("certification_id", CERT_ID).eq("visibility", "public").is("retired_at", null);
  return data || [];
}

if (LIST || !GROUPS.length) {
  const pub = await current();
  const byLang = {};
  for (const r of pub) (byLang[r.language] = byLang[r.language] || []).push(code.get(r.task_id));
  console.log(`public now: ${pub.length} rows`);
  for (const [l, t] of Object.entries(byLang)) console.log(`  ${l.padEnd(7)} ${t.length} -> tasks ${[...new Set(t)].sort().join(", ")}`);
  if (!GROUPS.length) { console.log("\nPass --groups <uuid,...> to publish."); process.exit(0); }
}

// --- validate the selection BEFORE writing anything -------------------------
const { data: rows } = await db.from("quiz_questions")
  .select("id, language, task_id, pool, question_group_id, question_text")
  .eq("certification_id", CERT_ID).in("question_group_id", GROUPS).is("retired_at", null);

let bad = 0;
const secure = (rows || []).filter((r) => r.pool === "secure");
if (secure.length) { console.error(`ABORT: ${secure.length} of the selected rows are SECURE. A sample is a marketing artifact; the secure pool is the examination.`); bad++; }
const groups = new Set((rows || []).map((r) => r.question_group_id));
if (groups.size !== GROUPS.length) { console.error(`ABORT: ${GROUPS.length} group ids given, ${groups.size} found`); bad++; }
const en = (rows || []).filter((r) => r.language === "en");
const distinctTasks = new Set(en.map((r) => r.task_id));
if (distinctTasks.size !== en.length) { console.error(`ABORT: ${en.length} items across only ${distinctTasks.size} distinct tasks - the check wants one per task`); bad++; }
for (const g of GROUPS) {
  const n = (rows || []).filter((r) => r.question_group_id === g).length;
  if (n !== 3) { console.error(`ABORT: group ${g.slice(0, 8)} has ${n} language rows, expected 3`); bad++; }
}
if (bad) { console.error("NOTHING WRITTEN"); process.exit(1); }

console.log(`\n${APPLY ? "publishing" : "[dry] would publish"} ${rows.length} rows across ${groups.size} groups:`);
for (const r of en.sort((a, b) => String(code.get(a.task_id)).localeCompare(String(code.get(b.task_id)))))
  console.log(`  task ${String(code.get(r.task_id)).padEnd(5)} ${r.question_text.slice(0, 74)}`);

if (APPLY) {
  const { error } = await db.from("quiz_questions").update({ visibility: "public" }).in("question_group_id", GROUPS);
  if (error) { console.error(error.message); process.exit(1); }
  const pub = await current();
  const per = {};
  for (const r of pub) per[r.language] = (per[r.language] || 0) + 1;
  console.log(`\npublic now: ${Object.entries(per).map(([l, n]) => `${l}=${n}`).join(" ")}, ${new Set(pub.filter((r) => r.language === "en").map((r) => r.task_id)).size} distinct tasks`);
} else {
  console.log("\nRe-run with --apply to write.");
}
