/**
 * retire-audit-480-tier-a.mjs -- retire the 11 Tier A items from the 480 audit.
 *
 * WRITES. `--apply`; DRY BY DEFAULT. Unknown flags exit 2.
 *
 * Four gates before anything is written, in this order:
 *
 *   1. RESOLVE every prefix to exactly one live English row, then to its group.
 *      Ambiguous or missing is a HARD ERROR, not a skip.
 *   2. FEASIBILITY on the binding unit. `generate-mock-exam` allocates
 *      `num_questions` across DOMAINS by `weight_pct`, so a domain that cannot fill
 *      its quota is what breaks a form. Checked PER LANGUAGE, because each language
 *      has its own pool. An item whose domain would go short is REPORTED AND
 *      SKIPPED rather than dropping the certification's ability to assemble a form.
 *   3. EXPOSURE. These prefixes are ENGLISH rows and the 342 already-read items were
 *      es-419, so an overlap is possible in either direction. Every one of the 11 is
 *      checked against `exam_session_items` in EVERY language, through its group.
 *   4. KEY COHERENCE per group, so "wrong in all three languages" is measured.
 *
 * Retirement is by `question_group_id`, secure pool only, all languages. The
 * practice pool is asserted untouched and the reversal statement is printed.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn, REST_URL } from "./_pg.mjs";
import { acquireHeavyReaderLock } from "./lib/heavy-reader-lock.mjs";
import { AUDIT480_TIER_A, resolve480 } from "./lib/audit-480-findings.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (!KNOWN.has(a)) {
    console.error("unknown flag " + JSON.stringify(a) + " -- DRY BY DEFAULT; --apply writes.");
    process.exitCode = 2; process.exit();
  }
}
const APPLY = process.argv.includes("--apply");
const REASON = "Tier A from the 480-item audit sample, director read 2026-09-26: the key is wrong "
  + "against the item's own cited source. Retired from the secure pool pending a rewrite. "
  + "See AUDIT-FINDINGS-480.md and AUDIT-480-RETIRED.json.";

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

const release = await acquireHeavyReaderLock("retire-audit-480-tier-a");
try {
  const certs = await getAll(KEY, "certifications?select=id,code,num_questions&order=id");
  const certBy = new Map(certs.map((c) => [c.id, c]));
  const domains = await getAll(KEY, "domains?select=id,code,certification_id,weight_pct&order=id");
  const tasks = await getAll(KEY, "tasks?select=id,code,domain_id&order=id");
  const taskBy = new Map(tasks.map((t) => [t.id, t]));

  const liveSecure = await getAll(KEY,
    "quiz_questions?select=id,question_group_id,certification_id,language,pool,task_id,correct_answer&status=eq.approved&retired_at=is.null&pool=eq.secure&order=id");

  /* ---- 1. resolve, hard error on ambiguity ---- */
  const englishSecure = liveSecure.filter((r) => r.language === "en");
  let resolved;
  try {
    resolved = resolve480(AUDIT480_TIER_A, englishSecure);
  } catch (e) {
    console.error(String(e.message || e));
    console.error("");
    console.error("No retirement attempted. A prefix that resolves to nothing would retire nothing");
    console.error("silently, and one that resolves to two would retire the wrong item.");
    process.exitCode = 2; process.exit();
  }
  const problems = [];
  for (const r of resolved) if (!r.row.question_group_id) problems.push(r.prefix + ": no question_group_id");

  /* ---- 4. key coherence per group ---- */
  const groups = [...new Set(resolved.map((r) => r.row.question_group_id))];
  const doomed = liveSecure.filter((r) => groups.includes(r.question_group_id));
  const keyDrift = [];
  for (const g of groups) {
    const sibs = doomed.filter((r) => r.question_group_id === g);
    if (new Set(sibs.map((r) => JSON.stringify(r.correct_answer))).size !== 1) {
      keyDrift.push(g.slice(0, 8) + ": key differs across siblings");
    }
  }

  /* ---- 2. feasibility, per certification x language x domain ---- */
  function quotas(certId) {
    const c = certBy.get(certId);
    const target = c.num_questions ?? 40;
    const ds = domains.filter((d) => d.certification_id === certId);
    const tot = ds.reduce((s, d) => s + Number(d.weight_pct), 0) || 100;
    const qs = ds.map((d) => {
      const exact = (target * Number(d.weight_pct)) / tot;
      return { d, q: Math.floor(exact), rem: exact - Math.floor(exact) };
    });
    let left = target - qs.reduce((s, r) => s + r.q, 0);
    for (const r of [...qs].sort((a, b) => b.rem - a.rem)) { if (left-- > 0) r.q++; }
    return qs;
  }

  const shortfalls = [];
  const langs = ["en", "es-419", "pt-BR"];
  for (const certId of [...new Set(resolved.map((r) => r.row.certification_id))]) {
    for (const lang of langs) {
      const pool = liveSecure.filter((r) => r.certification_id === certId && r.language === lang);
      if (!pool.length) continue;
      const after = pool.filter((r) => !groups.includes(r.question_group_id));
      for (const { d, q } of quotas(certId)) {
        const inD = (rows) => rows.filter((r) => (taskBy.get(r.task_id) || {}).domain_id === d.id).length;
        const now = inD(after);
        if (now < q) {
          shortfalls.push({ cert: certBy.get(certId).code, lang, domain: d.code,
            quota: q, before: inD(pool), after: now });
        }
      }
    }
  }
  /* An item whose domain would go short is SKIPPED, not forced. */
  const shortDomains = new Set(shortfalls.map((s) => s.cert + "|" + s.domain));
  const skipped = resolved.filter((r) => {
    const t = taskBy.get(r.row.task_id);
    const d = t && domains.find((x) => x.id === t.domain_id);
    return d && shortDomains.has(certBy.get(r.row.certification_id).code + "|" + d.code);
  });
  const skipGroups = new Set(skipped.map((r) => r.row.question_group_id));
  const retireGroups = groups.filter((g) => !skipGroups.has(g));
  const target = liveSecure.filter((r) => retireGroups.includes(r.question_group_id));

  /* ---- 3. exposure: was any of the 11 ever presented, in any language? ---- */
  const allGroupRows = await getAllIn(KEY, "quiz_questions", "id,question_group_id,language",
    "question_group_id", groups);
  const idsByGroup = new Map();
  for (const r of allGroupRows) {
    if (!idsByGroup.has(r.question_group_id)) idsByGroup.set(r.question_group_id, []);
    idsByGroup.get(r.question_group_id).push(r);
  }
  const allIds = allGroupRows.map((r) => r.id);
  const presented = await getAllIn(KEY, "exam_session_items",
    "session_id,question_id,language,user_answer", "question_id", allIds);
  const exposure = [];
  if (presented.length) {
    const attempts = await getAll(KEY,
      "exam_attempts?select=id,session_id,certification_id,score_pct,passed,total_questions,correct_answers,submitted_at&order=id");
    const attBySession = new Map(attempts.map((a) => [a.session_id, a]));
    for (const p of presented) {
      const row = allGroupRows.find((r) => r.id === p.question_id);
      const att = attBySession.get(p.session_id);
      exposure.push({
        item: row && row.id.slice(0, 8), language: p.language,
        in_scored_attempt: !!att,
        attempt: att ? att.id : null,
        cert: att ? (certBy.get(att.certification_id) || {}).code : null,
        submitted: att ? String(att.submitted_at).slice(0, 10) : null,
        answer: p.user_answer,
      });
    }
  }

  console.log(APPLY ? "APPLY -- retiring" : "DRY RUN -- nothing will be written");
  console.log("  Tier A declared             " + AUDIT480_TIER_A.length);
  console.log("  resolved to one English row " + resolved.length);
  console.log("  question groups             " + groups.length);
  console.log("  key identical across siblings in every group: " + (keyDrift.length ? "NO" : "yes"));
  for (const k of keyDrift) console.log("      " + k);
  console.log("");
  console.log("FEASIBILITY -- domain quota per language, the unit form assembly binds on");
  console.log("  domains that would fall short  " + shortfalls.length);
  for (const s of shortfalls) {
    console.log("      " + s.cert + " " + s.lang + " " + s.domain + "  quota " + s.quota +
      "  " + s.before + " -> " + s.after);
  }
  console.log("  items SKIPPED because their domain would go short  " + skipped.length);
  for (const r of skipped) console.log("      #" + r.declared.n + " " + r.prefix + " " + r.declared.cert);
  console.log("");
  console.log("EXPOSURE -- was any of the 11 ever presented, in any language?");
  console.log("  presentation rows found  " + exposure.length +
    (exposure.length ? "" : "   <- none of the 11 has ever been served to a candidate"));
  for (const e of exposure) {
    console.log("      " + e.item + " " + e.language + "  scored_attempt=" + e.in_scored_attempt +
      (e.attempt ? "  " + e.cert + " " + e.submitted + "  answered " + JSON.stringify(e.answer) : ""));
  }
  console.log("");
  console.log("TO RETIRE");
  console.log("  groups                 " + retireGroups.length);
  console.log("  live SECURE rows       " + target.length);
  for (const r of resolved.filter((x) => !skipGroups.has(x.row.question_group_id))) {
    const sibs = target.filter((x) => x.question_group_id === r.row.question_group_id);
    console.log("  #" + String(r.declared.n).padEnd(5) + r.declared.cert.padEnd(10) + r.prefix +
      "  " + sibs.length + " row(s): " + sibs.map((s) => s.language).sort().join(", "));
    console.log("        " + r.declared.why.slice(0, 150));
  }

  if (problems.length || keyDrift.length) {
    console.error("");
    console.error("ABORT -- nothing written:");
    for (const p of [...problems, ...keyDrift]) console.error("  " + p);
    process.exitCode = 2; process.exit();
  }

  const beforeSecure = liveSecure.length;
  const beforePractice = (await getAll(KEY,
    "quiz_questions?select=id&status=eq.approved&retired_at=is.null&pool=eq.practice&order=id")).length;

  writeFileSync(join(ROOT, "AUDIT-480-EXPOSURE.json"), JSON.stringify({
    tier_a: AUDIT480_TIER_A.map((t) => ({ n: t.n, id: t.id, cert: t.cert })),
    shortfalls, skipped: skipped.map((r) => ({ n: r.declared.n, id: r.prefix })),
    exposure,
  }, null, 2) + "\n", "utf8");

  if (!APPLY) {
    console.log("");
    console.log("  secure " + beforeSecure + ", practice " + beforePractice + " (must not change)");
    console.log("  dry run clean. --apply retires " + target.length + " row(s).");
    console.log("  wrote AUDIT-480-EXPOSURE.json");
    process.exitCode = 0; process.exit();
  }

  /* ---- write ---- */
  const now = new Date().toISOString();
  const written = [];
  for (const g of retireGroups) {
    const res = await fetch(REST_URL + "/quiz_questions?question_group_id=eq." + g +
      "&pool=eq.secure&retired_at=is.null", {
      method: "PATCH", headers: { ...H, Prefer: "return=representation" },
      body: JSON.stringify({ retired_at: now, retire_reason: REASON }),
    });
    if (!res.ok) { console.error(res.status + "\n" + (await res.text())); process.exitCode = 1; process.exit(); }
    written.push(...(await res.json()).map((r) => ({ id: r.id, language: r.language, group: g })));
  }

  const afterSecure = await getAll(KEY,
    "quiz_questions?select=id,question_group_id,certification_id,language,task_id&status=eq.approved&retired_at=is.null&pool=eq.secure&order=id");
  const afterPractice = await getAll(KEY,
    "quiz_questions?select=id&status=eq.approved&retired_at=is.null&pool=eq.practice&order=id");
  const post = [];
  post.push(["every targeted row is retired",
    afterSecure.filter((r) => retireGroups.includes(r.question_group_id)).length === 0, "some remain live"]);
  post.push(["the secure pool shrank by exactly the target",
    afterSecure.length === beforeSecure - target.length,
    "secure " + beforeSecure + " -> " + afterSecure.length + ", expected -" + target.length]);
  post.push(["THE PRACTICE POOL IS UNTOUCHED", afterPractice.length === beforePractice,
    "practice " + beforePractice + " -> " + afterPractice.length]);
  post.push(["the write returned the rows it claimed", written.length === target.length,
    "returned " + written.length + " for " + target.length]);
  /* RE-ASSERT FEASIBILITY AGAINST THE LIVE POOL, not against the plan.
   * The pre-write check ran on a pool computed in memory; this one asks the
   * database what is actually there now. A post-condition that re-derives its
   * answer from the same arithmetic that authorised the write would assert
   * nothing -- which is what the first draft of this block did. */
  const stillShort = [];
  for (const certId of [...new Set(resolved.map((r) => r.row.certification_id))]) {
    for (const lang of langs) {
      const pool = afterSecure.filter((r) => r.certification_id === certId && r.language === lang);
      if (!pool.length) continue;
      for (const { d, q } of quotas(certId)) {
        const n = pool.filter((r) => (taskBy.get(r.task_id) || {}).domain_id === d.id).length;
        if (n < q) {
          stillShort.push(certBy.get(certId).code + " " + lang + " " + d.code +
            " has " + n + " against quota " + q);
        }
      }
    }
  }
  post.push(["every affected domain still fills its quota, measured on the LIVE pool",
    stillShort.length === 0, stillShort.join("; ")]);

  console.log("");
  let bad = 0;
  for (const [name, ok, msg] of post) {
    console.log("  " + (ok ? "PASS  " : "FAIL  ") + name + (ok ? "" : "   -- " + msg));
    if (!ok) bad++;
  }
  writeFileSync(join(ROOT, "AUDIT-480-RETIRED.json"), JSON.stringify({
    retired_at: now, reason: REASON, groups: retireGroups, rows: written,
    skipped: skipped.map((r) => ({ n: r.declared.n, id: r.prefix })),
    secure_before: beforeSecure, secure_after: afterSecure.length,
    practice_before: beforePractice, practice_after: afterPractice.length,
  }, null, 2) + "\n", "utf8");
  console.log("");
  console.log("  retired " + written.length + " secure row(s) across " + retireGroups.length + " group(s)");
  console.log("  wrote AUDIT-480-RETIRED.json");
  console.log("");
  console.log("  TO REVERSE, one statement:");
  console.log("      update public.quiz_questions set retired_at = null, retire_reason = null");
  console.log("       where question_group_id in (" + retireGroups.map((g) => "'" + g + "'").join(", ") + ")");
  console.log("         and pool = 'secure' and retired_at = '" + now + "';");
  process.exitCode = bad ? 1 : 0;
} finally { release(); }
