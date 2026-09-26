/**
 * check-retire-feasibility.mjs -- can the five Tier A items be retired without
 * making a secure exam form unassemblable?
 *
 * READ-ONLY. It writes nothing; `retire-tier-a.mjs` does the writing. Unknown
 * flags exit 2.
 *
 * ============ THE BINDING CONSTRAINT IS THE DOMAIN, NOT THE TASK ============
 *
 * `generate-mock-exam` allocates `certifications.num_questions` across DOMAINS
 * proportional to `domains.weight_pct`, largest-remainder so the parts sum
 * exactly, and only then spreads within a domain across its tasks. So a form
 * fails to assemble when a DOMAIN cannot fill its quota. A per-task count is
 * worth reporting -- a task emptied entirely is a coverage hole even when its
 * domain still fills -- but it is not the gate, and checking the wrong unit is
 * this repository's most repeated defect.
 *
 * ============ AND RETIREMENT IS PER GROUP, NOT PER ROW ============
 *
 * The declared ids are the es-419 rows, because those are the rows that were
 * PRESENTED. But `correct_answer` is a MACHINE field: measured across 958 lesson
 * pairs and 18,480 item pairs, it does not drift between siblings. A wrong key is
 * therefore wrong in all three languages, and retiring only the Spanish row would
 * leave the English and Portuguese siblings serving the same wrong key.
 *
 * So the unit is `question_group_id`, and the feasibility check is run PER
 * LANGUAGE because each language has its own secure pool.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { acquireHeavyReaderLock } from "./lib/heavy-reader-lock.mjs";
import { TIER_A, resolvePrefixes } from "./lib/tiered-item-findings.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY, writes nothing");
  process.exitCode = 2; process.exit();
}

const KEY = requireKey(HERE);
const release = await acquireHeavyReaderLock("check-retire-feasibility");
try {
  const certs = await getAll(KEY, "certifications?select=id,code,num_questions,passing_score_pct&order=id");
  const certBy = new Map(certs.map((c) => [c.id, c]));
  const domains = await getAll(KEY, "domains?select=id,code,certification_id,weight_pct&order=id");
  const tasks = await getAll(KEY, "tasks?select=id,code,domain_id,certification_id&order=id");
  const taskBy = new Map(tasks.map((t) => [t.id, t]));

  const live = await getAll(KEY,
    "quiz_questions?select=id,question_group_id,certification_id,language,pool,task_id,correct_answer&status=eq.approved&retired_at=is.null&pool=eq.secure&order=id");

  const tierA = resolvePrefixes(TIER_A, live);
  const groups = [...new Set(tierA.map((t) => t.row.question_group_id))];
  if (groups.some((g) => !g)) { console.error("a Tier A item has no question_group_id -- cannot retire by group"); process.exitCode = 2; process.exit(); }

  /* The rows that retirement would remove: every language of every group. */
  const doomed = live.filter((r) => groups.includes(r.question_group_id));

  /* Confirm the key really is identical across siblings, so "wrong in all three"
   * is measured rather than assumed. */
  const keyDrift = [];
  for (const g of groups) {
    const sibs = doomed.filter((r) => r.question_group_id === g);
    const keys = new Set(sibs.map((r) => JSON.stringify(r.correct_answer)));
    if (keys.size !== 1) keyDrift.push(g + ": " + [...keys].join(" vs "));
  }

  /* Largest-remainder domain quota, the same rule generate-mock-exam applies. */
  function quotas(certId) {
    const c = certBy.get(certId);
    const target = c.num_questions ?? 40;
    const ds = domains.filter((d) => d.certification_id === certId);
    const tot = ds.reduce((s, d) => s + Number(d.weight_pct), 0) || 100;
    const rows = ds.map((d) => {
      const exact = (target * Number(d.weight_pct)) / tot;
      return { d, exact, q: Math.floor(exact), rem: exact - Math.floor(exact) };
    });
    let left = target - rows.reduce((s, r) => s + r.q, 0);
    for (const r of [...rows].sort((a, b) => b.rem - a.rem)) { if (left-- > 0) r.q++; }
    return rows;
  }

  const findings = [];
  const langs = [...new Set(live.map((r) => r.language))].sort();
  const affectedCerts = [...new Set(tierA.map((t) => t.row.certification_id))];

  console.log("RETIREMENT FEASIBILITY -- read-only");
  console.log("  Tier A items            " + tierA.length);
  console.log("  question groups          " + groups.length);
  console.log("  live secure rows they span (all languages)  " + doomed.length);
  console.log("  key identical across siblings in every group: " + (keyDrift.length ? "NO" : "yes"));
  for (const k of keyDrift) console.log("      DRIFT " + k);
  console.log("");

  for (const certId of affectedCerts) {
    const c = certBy.get(certId);
    console.log("=== " + c.code + "   num_questions " + c.num_questions);
    for (const lang of langs) {
      const pool = live.filter((r) => r.certification_id === certId && r.language === lang);
      if (!pool.length) continue;
      const after = pool.filter((r) => !groups.includes(r.question_group_id));
      console.log("  " + lang + ": " + pool.length + " live secure -> " + after.length +
        " after retirement  (removes " + (pool.length - after.length) + ")");
      for (const { d, q } of quotas(certId)) {
        const inDomain = (rows) => rows.filter((r) => {
          const t = taskBy.get(r.task_id);
          return t && t.domain_id === d.id;
        }).length;
        const before = inDomain(pool), now = inDomain(after);
        const ok = now >= q;
        if (before !== now || !ok) {
          console.log("      domain " + d.code.padEnd(6) + " quota " + String(q).padStart(3) +
            "   " + before + " -> " + now + "   " + (ok ? "OK" : "SHORT BY " + (q - now)));
        }
        if (!ok) findings.push({ cert: c.code, lang, domain: d.code, quota: q, after: now, short: q - now });
      }
      /* Per-task, reported because a task emptied is a coverage hole the domain
       * quota cannot see. */
      for (const t of tierA.map((x) => taskBy.get(x.row.task_id)).filter(Boolean)) {
        if (t.certification_id !== certId) continue;
        const b = pool.filter((r) => r.task_id === t.id).length;
        const n = after.filter((r) => r.task_id === t.id).length;
        console.log("      task   " + t.code.padEnd(6) + "                 " + b + " -> " + n +
          (n === 0 ? "   <- TASK EMPTIED" : ""));
        if (n === 0) findings.push({ cert: c.code, lang, task: t.code, emptied: true });
      }
    }
    console.log("");
  }

  console.log(findings.length
    ? "NOT FEASIBLE for " + findings.length + " cert/language/unit combination(s) -- listed above"
    : "FEASIBLE: every domain still fills its quota in every language, and no task is emptied");

  const path = join(ROOT, "RETIRE-FEASIBILITY.json");
  writeFileSync(path, JSON.stringify({ groups, tierA: tierA.map((t) => ({ n: t.n, id: t.id, full: t.full, group: t.row.question_group_id, task: (taskBy.get(t.row.task_id) || {}).code })), keyDrift, findings }, null, 2) + "\n", "utf8");
  console.log("wrote " + path);
  process.exitCode = findings.length ? 1 : 0;
} finally { release(); }
