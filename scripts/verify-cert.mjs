#!/usr/bin/env node
/**
 * verify-cert.mjs - THE conformance gate. One command, any cert, every invariant.
 *
 * WHY THIS EXISTS
 * ---------------
 * Building AIE-I surfaced three latent defects in shared generator code, each of
 * which PASSED every gate we had (firewall, floors, coverage, cue-guard) and would
 * have shipped silently:
 *
 *   1. GROUNDING   - a hardcoded Scrum scenario grounding wrote sprint-backlog
 *                    scenarios into an AI-literacy exam aimed at HR/marketing/ops.
 *                    Construct-irrelevant: it tested Scrum literacy on top of the
 *                    intended construct.
 *   2. TIER        - a hardcoded 30/50/20 difficulty instruction + a bloom mapping
 *                    that made 1_remember unreachable produced a bank at 0% Remember
 *                    / 67% Apply / 7% Analyze against a JTA declaring 44/40/16 with a
 *                    ceiling at Apply. Items existed ABOVE the credential's own
 *                    declared cognitive ceiling.
 *   3. ASSEMBLY    - the exam assembler hardcoded the same 30/50/20 bands, so even a
 *                    corrected pool would have delivered ~50% Apply forms.
 *
 * The common thread: the pipeline documented STAGES but never enforced INVARIANTS.
 * Nothing checked that what a cert SHIPS matches what its scheme document CLAIMS.
 * A credential whose delivered exam contradicts its published blueprint is not
 * defensible under ISO/IEC 17024 - and no amount of prose in a handoff doc catches
 * that. It has to be executable.
 *
 * This script is that executable check. Every row of a scheme document's governance
 * table (§12) is one line of this output. It is simultaneously:
 *   - the auditor's evidence (claims -> live queries, PASS/FAIL, reproducible)
 *   - the governance dashboard's data feed (--json)
 *   - the release gate (non-zero exit blocks a status flip)
 *   - the regression test for the pipeline itself (--all, across every cert)
 *
 * USAGE (from the supabase repo root)
 *   node scripts\verify-cert.mjs --cert AIE-I
 *   node scripts\verify-cert.mjs --all          # every cert; the pipeline regression test
 *   node scripts\verify-cert.mjs --all --json   # machine-readable, for the dashboard
 *   node scripts\verify-cert.mjs --cert AIE-I --strict   # WARN counts as failure
 *
 * EXIT CODES: 0 = all PASS (warnings allowed unless --strict), 1 = at least one FAIL.
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (scripts/.env). Read-only:
 * this script never writes.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { profileFor } from "./lib/item-profile.mjs";

// ---------------------------------------------------------------------------
// env / args
// ---------------------------------------------------------------------------
function loadEnv() {
  for (const p of ["scripts/.env", ".env"]) {
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnv();

const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i !== -1 ? argv[i + 1] : null; };
const has = (k) => argv.includes(k);

const ONLY_CERT = arg("--cert");
const ALL = has("--all");
const JSON_OUT = has("--json");
const STRICT = has("--strict");

if (!ONLY_CERT && !ALL) {
  console.error("Usage: node scripts\\verify-cert.mjs --cert <CODE> | --all  [--json] [--strict]");
  process.exit(2);
}

// SUPABASE_URL is not in scripts/.env - every generator hardcodes the project ref
// as a fallback (see gen-cert-secure.mjs). Match that so this script needs no new env.
const URL = process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY (expected in scripts/.env).");
  process.exit(2);
}
const db = createClient(URL, KEY, { auth: { persistSession: false } });

const LANGS = ["en", "es-419", "pt-BR"];
const BLOOM_RANK = { "1_remember": 1, "2_understand": 2, "3_apply": 3, "4_analyze": 4, "5_evaluate": 5, "6_create": 6 };

// Out-of-domain vocabulary: a candidate must never need knowledge from ANOTHER
// discipline to parse an item. Keyed by tier/family, checked against en items.
const OUT_OF_DOMAIN = {
  // Non-Scrum certs must not carry agile-framework vocabulary.
  // Inflected forms matter: \bsprint\b does NOT match "sprints" (no boundary
  // between t and s), and that is exactly how 6 items passed this gate.
  // NOT velocidad / velocidade: they are the ordinary Spanish and Portuguese
  // words for speed, and 41 AISM-I items use them legitimately (response
  // times, throughput). English "velocity" is safe because the cert never
  // uses it in the plain sense - the cognates are not. Extending an
  // English word list across languages needs this check per term.
  nonScrum: /\b(sprints?|scrums?|product backlogs?|sprint backlogs?|user stor(y|ies|ias?)|definition of done|daily standups?|story points?|velocity)\b/i,
};

// ---------------------------------------------------------------------------
// check harness
// ---------------------------------------------------------------------------
const C = { reset: "\x1b[0m", red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", dim: "\x1b[2m", bold: "\x1b[1m" };
const plain = JSON_OUT;
const paint = (c, s) => (plain ? s : c + s + C.reset);

class Report {
  constructor(code) { this.code = code; this.checks = []; }
  add(id, clause, label, status, detail, evidence) {
    this.checks.push({ id, clause, label, status, detail, evidence: evidence ?? null });
  }
  pass(id, clause, label, detail, ev) { this.add(id, clause, label, "PASS", detail, ev); }
  fail(id, clause, label, detail, ev) { this.add(id, clause, label, "FAIL", detail, ev); }
  warn(id, clause, label, detail, ev) { this.add(id, clause, label, "WARN", detail, ev); }
  skip(id, clause, label, detail) { this.add(id, clause, label, "SKIP", detail, null); }
  get failed() { return this.checks.filter((c) => c.status === "FAIL"); }
  get warned() { return this.checks.filter((c) => c.status === "WARN"); }
  get ok() { return this.failed.length === 0 && (!STRICT || this.warned.length === 0); }
}

const pct = (n, d) => (d ? Math.round((1000 * n) / d) / 10 : 0);

// Largest-remainder allocation (mirrors the exam assembler exactly).
function allocate(weights, total) {
  const sum = weights.reduce((s, w) => s + w.pct, 0) || 1;
  const rows = weights.map((w) => {
    const raw = (w.pct / sum) * total;
    return { key: w.key, n: Math.floor(raw), rem: raw - Math.floor(raw) };
  });
  let assigned = rows.reduce((s, r) => s + r.n, 0);
  const byRem = [...rows].sort((a, b) => b.rem - a.rem);
  let i = 0;
  while (assigned < total && byRem.length) { byRem[i % byRem.length].n += 1; assigned++; i++; }
  return new Map(rows.map((r) => [r.key, r.n]));
}

// ---------------------------------------------------------------------------
// the invariants
// ---------------------------------------------------------------------------
async function verify(cert) {
  const R = new Report(cert.code);
  const id = cert.id;
  const profile = profileFor((cert.name || "").replace(/^Certidemy\s+/i, ""));

  // --- fetch everything once -------------------------------------------------
  // NOTE: tasks.bloom_level and certifications.exam_blueprint. The verifier could not
  // previously SEE either - which is precisely why nothing ever checked that an item
  // tests its task at the level the JTA declares. The data was always there.
  const [{ data: domains }, { data: tasks }, { data: concepts }, { data: modules }, { data: profileRows }] = await Promise.all([
    db.from("domains").select("id, code, weight_pct, order_index").eq("certification_id", id).order("order_index"),
    db.from("tasks").select("id, code, domain_id, is_exam_scope, is_simulation_candidate, bloom_level, statement, order_index").eq("certification_id", id),
    db.from("concepts").select("id, slug").eq("certification_id", id),
    db.from("modules").select("id, slug, order_index").eq("certification_id", id),
    db.from("v_cognitive_profile").select("bloom_level, tasks, pct_of_form").eq("certification_id", id),
  ]);

  const taskIds = (tasks ?? []).map((t) => t.id);
  const modIds = (modules ?? []).map((m) => m.id);

  const { data: tcs } = await db.from("task_concepts").select("task_id, concept_id").in("task_id", taskIds.length ? taskIds : ["00000000-0000-0000-0000-000000000000"]);

  // questions (paged; banks can exceed the default row cap)
  //
  // .order("id") IS LOAD-BEARING. Postgres guarantees NO row order without an explicit
  // ORDER BY, so range(0,999) and range(1000,1999) can overlap: the same row returns on
  // two pages while another is skipped entirely. The total row count still comes out
  // right, so the bug is invisible - but the CONTENTS are wrong, and every downstream
  // count is computed on duplicated and incomplete data.
  //
  // This bit us the moment migration 089 stamped bank_revision on every row: rewriting
  // the whole table scrambled physical heap order, and two certs' secure counts jumped
  // above their true totals. The bug had been latent for months.
  let questions = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await db.from("quiz_questions")
      .select("id, pool, language, task_id, difficulty, bloom_level, options, correct_answer, status, question_group_id, question_text")
      .eq("certification_id", id)
      .is("retired_at", null)   // the verifier verifies what the cert SHIPS. Retired items are not served; they are audited via v_retired_items_evidence.
      .order("id")
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    questions.push(...data);
    if (data.length < 1000) break;
  }

  // Paranoia, cheap: prove the page-join produced no duplicates.
  const uniqIds = new Set(questions.map((q) => q.id));
  if (uniqIds.size !== questions.length) {
    console.error(`  !! FETCH BUG: ${questions.length} rows fetched, ${uniqIds.size} distinct. Pagination is returning duplicates.`);
    process.exitCode = 1;
  }

  const secureIds = questions.filter((q) => q.pool === "secure").map((q) => q.id);
  let leaked = 0;
  for (let i = 0; i < secureIds.length; i += 300) {
    const { count } = await db.from("question_concepts")
      .select("question_id", { count: "exact", head: true })
      .in("question_id", secureIds.slice(i, i + 300));
    leaked += count ?? 0;
  }

  let lessons = [];
  if (modIds.length) {
    const { data } = await db.from("lessons").select("id, module_id, language, slug, lesson_group_id, content_md").in("module_id", modIds);
    lessons = data ?? [];
  }

  const { data: cov } = await db.from("v_coverage_summary").select("*").eq("certification_id", id).maybeSingle();

  // === 1. SCAFFOLD INTEGRITY ================================================
  const wsum = (domains ?? []).reduce((s, d) => s + Number(d.weight_pct), 0);
  Math.abs(wsum - 100) < 0.01
    ? R.pass("scaffold.weights", "§4", "Domain weights sum to 100", `${wsum.toFixed(2)}%`)
    : R.fail("scaffold.weights", "§4", "Domain weights sum to 100", `sum = ${wsum.toFixed(2)}% (must be 100)`);

  const orphanTasks = (tasks ?? []).filter((t) => !(domains ?? []).some((d) => d.id === t.domain_id));
  orphanTasks.length === 0
    ? R.pass("scaffold.tasks", "§5", "Every task belongs to a domain", `${(tasks ?? []).length} tasks`)
    : R.fail("scaffold.tasks", "§5", "Every task belongs to a domain", `${orphanTasks.length} orphaned`, orphanTasks.map((t) => t.code));

  const linkedConcepts = new Set((tcs ?? []).map((x) => x.concept_id));
  const unlinked = (concepts ?? []).filter((c) => !linkedConcepts.has(c.id));
  unlinked.length === 0
    ? R.pass("scaffold.concepts", "§5", "Every concept linked to a task", `${(concepts ?? []).length} concepts / ${(tcs ?? []).length} links`)
    : R.fail("scaffold.concepts", "§5", "Every concept linked to a task", `${unlinked.length} unlinked`, unlinked.map((c) => c.slug));

  // === 2. COVERAGE / NO UNTAUGHT TESTING ====================================
  if (!cov) {
    R.skip("coverage", "§10", "Coverage matrix", "no v_coverage_summary row");
  } else {
    const {
      concepts_total: T,
      concepts_testable: TESTABLE,
      concepts_taught: TT,
      concepts_tested_in_scope: TSI,
      concepts_out_of_scope_only: OOS,
      untaught_testing_violations: V,
    } = cov;

    // Every concept must be TAUGHT - teaching is unbounded by exam scope.
    TT === T
      ? R.pass("coverage.taught", "§10", "All concepts taught", `${TT}/${T}`)
      : R.fail("coverage.taught", "§10", "All concepts taught", `${TT}/${T}`);

    // "All concepts tested" measures tested-vs-TESTABLE. A concept reachable only through
    // an out-of-scope task is not testable by MCQ, and requiring it here would demand
    // something the scheme forbids.
    TSI === TESTABLE
      ? R.pass("coverage.tested", "§10", "All testable concepts tested", `${TSI}/${TESTABLE} in-scope`)
      : R.fail("coverage.tested", "§10", "All testable concepts tested", `${TSI}/${TESTABLE} in-scope`);

    // Taught but not examinable by MCQ: a documented boundary, surfaced as a warning.
    // Taught but not examinable by MCQ. This is a legitimate, DOCUMENTED boundary
    // when the task carrying the concept is above the MCQ ceiling and flagged
    // is_simulation_candidate - the competence is parked for simulation, not
    // dropped. It is only a warning when no such intent is recorded.
    if (OOS > 0) {
      const oosTasks = (tasks ?? []).filter((t) => !t.is_exam_scope);
      const allDeclared = oosTasks.length > 0 && oosTasks.every((t) => t.is_simulation_candidate);
      allDeclared
        ? R.pass("coverage.outOfScopeOnly", "§10", "Concepts outside MCQ reach are declared, not dropped",
            `${OOS} concept(s) taught but not MCQ-examinable, reachable only via task(s) flagged is_simulation_candidate`,
            oosTasks.map((t) => `${t.code} (${t.bloom_level})`))
        : R.warn("coverage.outOfScopeOnly", "§10", "Concepts outside MCQ reach are declared, not dropped",
            `${OOS} taught but not examinable by MCQ, and not every out-of-scope task records simulation intent`);
    }

    V === 0
      ? R.pass("coverage.untaught", "§10", "No untaught testing (17024)", "violations = 0")
      : R.fail("coverage.untaught", "§10", "No untaught testing (17024)", `violations = ${V}`);
  }

  // === 3. SECURE FIREWALL (sacred) ==========================================
  leaked === 0
    ? R.pass("firewall", "§8", "Secure pool carries no concept links", "0 leaked links")
    : R.fail("firewall", "§8", "Secure pool carries no concept links", `${leaked} SECURE ITEMS LEAK INTO PRACTICE`);

  // === 4. ITEM FLOORS (per task, per language) ==============================
  // Only IN-SCOPE tasks carry a floor. A task the JTA excludes from the exam
  // (is_exam_scope = false) is REQUIRED to hold no items - failing it for an empty
  // pool would punish the correct state.
  const inScopeTasks = (tasks ?? []).filter((t) => t.is_exam_scope);
  for (const [pool, floor] of [["secure", 8], ["practice", 10]]) {
    const short = [];
    for (const t of inScopeTasks) {
      for (const lang of LANGS) {
        const n = questions.filter((q) => q.pool === pool && q.language === lang && q.task_id === t.id).length;
        if (n < floor) short.push(`${t.code}/${lang}=${n}`);
      }
    }
    const total = questions.filter((q) => q.pool === pool).length;
    short.length === 0
      ? R.pass(`floors.${pool}`, "§8", `${pool} floor >= ${floor}/task/lang`, `${total} items, all ${inScopeTasks.length} in-scope tasks x3 langs at floor`)
      : R.fail(`floors.${pool}`, "§8", `${pool} floor >= ${floor}/task/lang`, `${short.length} below floor`, short.slice(0, 12));
  }

  // ==========================================================================
  // THE JTA -> ITEM TRACEABILITY CHAIN (invariants 15-18)
  //
  // This is the chain ISO/IEC 17024 actually asks a certification body to demonstrate:
  // the exam measures the competences the job-task analysis declares, at the levels it
  // declares them, and the published blueprint is the truth about the exam.
  //
  // None of it was checkable before, because the verifier never fetched
  // tasks.bloom_level. The declarations were decorative - nothing depended on them
  // being right, so nobody checked whether they were. When we finally did, every one of
  // the five JTAs was internally inconsistent, and three tasks were Bloom 6 (Create)
  // being assessed by multiple choice.
  // ==========================================================================

  // Translations and schema guardrails - fetched after tasks/domains so ids exist.
  const txTaskIds = (tasks ?? []).map((t) => t.id);
  const txDomainIds = (domains ?? []).map((d) => d.id);
  const [{ data: taskTx }, { data: domTx }, { data: guard }] = await Promise.all([
    txTaskIds.length ? db.from("task_translations").select("task_id, language, is_provisional").in("task_id", txTaskIds) : { data: [] },
    txDomainIds.length ? db.from("domain_translations").select("domain_id, language, is_provisional").in("domain_id", txDomainIds) : { data: [] },
    db.from("v_schema_guardrails").select("*").maybeSingle(),
  ]);
  const taskById = new Map((tasks ?? []).map((t) => [t.id, t]));
  const secure = questions.filter((q) => q.pool === "secure");

  // === 15a. EVERY ITEM TRACES TO A TASK =====================================
  // The precondition for the whole chain below, and the one it never checked.
  // The Bloom check does `if (!t) continue` - so an item with no task_id was
  // silently EXCLUDED from verification rather than flagged. An untraceable item
  // cannot be tied to a competence, cannot be allocated to a domain by the form
  // assembler, and under 17024 cannot be defended as measuring anything at all.
  //
  // Not hypothetical: 1,026 AIE-I items were found filed under AISM-I with no
  // task link (migration 123). They passed every gate this verifier had, because
  // every count-based check counted them and every content check skipped them.
  const orphanItems = questions.filter((q) => !q.task_id);
  orphanItems.length === 0
    ? R.pass("jta.itemTraceable", "§9", "Every item traces to a task", `${questions.length} live items, all linked to a task`)
    : R.fail("jta.itemTraceable", "§9", "Every item traces to a task",
        `${orphanItems.length} item(s) carry no task_id - untraceable to any competence, invisible to the Bloom and blueprint checks below`,
        [...new Set(orphanItems.map((q) => `${q.pool}/${q.language}`))].slice(0, 12));


  // === 15. ITEM BLOOM == TASK BLOOM =========================================
  // The core rule. An item's cognitive level EQUALS its task's declared level.
  //   above  -> construct-irrelevant variance: measuring competence never declared.
  //   below  -> construct under-representation: certifying competence never measured.
  // Both are validity failures (Messick). "Easier is safer" is exactly backwards.
  //
  // The SECURE pool is the examination instrument and is held to strict equality.
  // The PRACTICE pool is study material, where scaffolding below the task's level is
  // legitimate teaching - so it is checked only for the ceiling, not for equality.
  const mismatched = [];
  let secureWithTask = 0;
  for (const q of secure) {
    const t = taskById.get(q.task_id);
    if (!t || !t.bloom_level) continue;
    secureWithTask++;
    if (String(q.bloom_level) !== String(t.bloom_level)) {
      const dir = (BLOOM_RANK[q.bloom_level] ?? 0) > (BLOOM_RANK[t.bloom_level] ?? 0) ? "ABOVE" : "below";
      mismatched.push(`${q.language} task ${t.code}: item is ${q.bloom_level}, task declares ${t.bloom_level} (${dir})`);
    }
  }
  if (secureWithTask === 0) {
    R.skip("jta.itemBloom", "§9", "Item cognitive level == task's declared level", "no secure items carry a task");
  } else if (mismatched.length === 0) {
    R.pass("jta.itemBloom", "§9", "Item cognitive level == task's declared level", `${secureWithTask} secure items, all match their task's JTA declaration`);
  } else {
    const aboveN = mismatched.filter((m) => m.endsWith("(ABOVE)")).length;
    R.fail(
      "jta.itemBloom", "§9", "Item cognitive level == task's declared level",
      `${mismatched.length} of ${secureWithTask} (${pct(mismatched.length, secureWithTask)}%) do not match - ${aboveN} test ABOVE their task (construct-irrelevant variance), ${mismatched.length - aboveN} test below (construct under-representation)`,
      [...new Set(mismatched)].slice(0, 12),
    );
  }

  // === 16. MCQ CEILING ON TASKS =============================================
  // Multiple choice cannot validly assess Evaluate or Create. A task declared at 5 or 6
  // must be out of exam scope (simulation only) - otherwise the exam is pretending to
  // measure something the instrument physically cannot reach.
  // (This found SM-AI-I 5.11 at 5_evaluate AND is_exam_scope=true, contradicting its own
  //  JTA's stated ceiling; and three tasks whose skills said "write" / "design" - Bloom 6.)
  const overCeiling = (tasks ?? []).filter(
    (t) => t.is_exam_scope && (BLOOM_RANK[t.bloom_level] ?? 0) > BLOOM_RANK["4_analyze"],
  );
  overCeiling.length === 0
    ? R.pass("jta.mcqCeiling", "§9", "No exam-scope task above the MCQ ceiling (4_analyze)", `${(tasks ?? []).filter((t) => t.is_exam_scope).length} exam-scope tasks`)
    : R.fail("jta.mcqCeiling", "§9", "No exam-scope task above the MCQ ceiling (4_analyze)",
        `${overCeiling.length} task(s) declared above 4_analyze while in exam scope - MCQ cannot validly assess Evaluate or Create`,
        overCeiling.map((t) => `${t.code} (${t.bloom_level}): ${(t.statement || "").slice(0, 54)}`));

  // === 17. BLUEPRINT == THE COMPUTED PROFILE ================================
  // The published claim and the database must be mutually verifying. The blueprint is
  // re-derived here from the LIVE tasks (via v_cognitive_profile, the same view the
  // migration used) and compared with what is stored. Retag a task's bloom, edit a
  // domain weight, or hand-edit the blueprint, and this fails.
  //
  // This is the property 17024 is really asking for: the scheme document cannot silently
  // drift from the exam it describes. Before this, the two had drifted for eight months.
  const stored = cert.exam_blueprint?.cognitive_profile ?? null;
  const live = {};
  for (const r of profileRows ?? []) live[r.bloom_level] = Number(r.pct_of_form);

  if (!stored) {
    R.fail("jta.blueprint", "§9", "Blueprint equals the profile computed from the JTA",
      "no exam_blueprint.cognitive_profile: the exam makes no cognitive claim, so nothing can be verified against it");
  } else if (Object.keys(live).length === 0) {
    R.skip("jta.blueprint", "§9", "Blueprint equals the profile computed from the JTA", "v_cognitive_profile returned nothing");
  } else {
    const keys = [...new Set([...Object.keys(stored), ...Object.keys(live)])].sort();
    const drift = keys
      .map((k) => ({ k, s: Number(stored[k] ?? 0), l: Number(live[k] ?? 0) }))
      .filter((x) => Math.abs(x.s - x.l) > 0.02);   // tolerance = rounding only
    const shape = keys.map((k) => `${k.replace(/^\d_/, "")} ${Number(live[k] ?? 0).toFixed(1)}%`).join(" / ");
    drift.length === 0
      ? R.pass("jta.blueprint", "§9", "Blueprint equals the profile computed from the JTA", shape)
      : R.fail("jta.blueprint", "§9", "Blueprint equals the profile computed from the JTA",
          `${drift.length} level(s) drifted - the published claim and the JTA disagree`,
          drift.map((x) => `${x.k}: blueprint says ${x.s}%, tasks say ${x.l}%`));
  }

  // === 18. THE POOL CAN ACTUALLY FILL A FORM ================================
  // A blueprint the bank cannot satisfy is a promise the exam breaks silently: the
  // assembler falls back, the form drifts off-profile, and nobody is told. Check every
  // (domain x language) has enough approved secure items for its share of the form.
  const nq = cert.num_questions ?? 0;
  if (!domains?.length || !nq) {
    R.skip("jta.formFill", "§9", "Pool can fill a form at the declared profile", "missing domains or num_questions");
  } else {
    const domSeats = allocate(domains.map((d) => ({ key: d.id, pct: Number(d.weight_pct) })), nq);
    const shortfalls = [];
    for (const lang of LANGS) {
      for (const d of domains) {
        const seats = domSeats.get(d.id) ?? 0;
        if (!seats) continue;
        const dTasks = new Set((tasks ?? []).filter((t) => t.domain_id === d.id && t.is_exam_scope).map((t) => t.id));
        const have = secure.filter((q) => q.language === lang && q.status === "approved" && dTasks.has(q.task_id)).length;
        if (have < seats) shortfalls.push(`${lang} ${d.code}: form needs ${seats}, pool has ${have}`);
      }
    }
    shortfalls.length === 0
      ? R.pass("jta.formFill", "§9", "Pool can fill a form at the declared profile", `${nq}-item form, every domain x language covered`)
      : R.fail("jta.formFill", "§9", "Pool can fill a form at the declared profile",
          `${shortfalls.length} shortfall(s) -> forms will silently drift off the published profile`, shortfalls.slice(0, 10));
  }

  // === 7. CONSTRUCT GROUNDING (no out-of-domain vocabulary) =================
  const isScrum = /\bscrum\b/i.test(cert.name || "");
  if (isScrum) {
    R.skip("grounding", "§10", "Construct grounding", "Scrum cert: agile vocabulary IS the construct");
  } else {
    // ALL languages, not just English. The check used to look at en only, so a
    // Spanish or Portuguese item could carry agile vocabulary and never be seen.
    // Scrum terms stay English by platform policy, so one regex serves all three.
    const bad = questions.filter((q) =>
      OUT_OF_DOMAIN.nonScrum.test(`${q.question_text || ""} ${JSON.stringify(q.options || "")}`));
    const enTotal = questions.length;
    const rate = pct(bad.length, enTotal);
    if (bad.length === 0) R.pass("grounding", "§10", "No out-of-domain (agile) vocabulary", `0 / ${enTotal} items, all languages`);
    else if (rate <= 1.0) R.warn("grounding", "§10", "No out-of-domain (agile) vocabulary", `${bad.length} / ${enTotal} (${rate}%) - incidental; verify no KEY depends on it`, bad.slice(0, 5).map((q) => (q.question_text || "").slice(0, 70)));
    else R.fail("grounding", "§10", "No out-of-domain (agile) vocabulary", `${bad.length} / ${enTotal} (${rate}%) - construct-irrelevant load`, bad.slice(0, 5).map((q) => (q.question_text || "").slice(0, 70)));
  }

  // === 8. CUE NEUTRALITY ====================================================
  const en = questions.filter((q) => q.pool === "secure" && q.language === "en" && Array.isArray(q.options) && q.options.length >= 3);
  if (en.length === 0) {
    R.skip("cue", "§8.1", "Answer-cue neutrality", "no secure en items");
  } else {
    // position
    const posCount = [0, 0, 0, 0, 0, 0];
    let longest = 0, visibleTell = 0, marginSum = 0;
    for (const q of en) {
      const keyId = Array.isArray(q.correct_answer) ? q.correct_answer[0] : q.correct_answer;
      const idx = q.options.findIndex((o) => o.id === keyId);
      if (idx >= 0 && idx < 6) posCount[idx]++;
      const keyLen = (q.options.find((o) => o.id === keyId)?.text || "").length;
      const rivals = q.options.filter((o) => o.id !== keyId).map((o) => (o.text || "").length);
      const maxRival = Math.max(0, ...rivals);
      if (keyLen > maxRival) {
        longest++;
        marginSum += keyLen - maxRival;
        if (keyLen - maxRival >= 20) visibleTell++;
      }
    }
    const nOpt = Math.max(...en.map((q) => q.options.length));
    const expected = en.length / nOpt;
    const chi = posCount.slice(0, nOpt).reduce((s, o) => s + Math.pow(o - expected, 2) / expected, 0);
    // chi-square 0.01 crit: 3df=11.34, 2df=9.21, 4df=13.28
    const crit = { 2: 9.21, 3: 11.34, 4: 13.28, 5: 15.09 }[nOpt - 1] ?? 11.34;
    chi <= crit
      ? R.pass("cue.position", "§8.1", "No answer-position bias", `${posCount.slice(0, nOpt).map((n) => pct(n, en.length) + "%").join(" / ")} (chi2=${chi.toFixed(1)} <= ${crit})`)
      : R.fail("cue.position", "§8.1", "No answer-position bias", `${posCount.slice(0, nOpt).join("/")} (chi2=${chi.toFixed(1)} > ${crit})`);

    // LENGTH CUE. The metric must be SCALE-INVARIANT: a 20-char lead on a 280-char
    // option is 3 words out of 40 (invisible); the same lead on a 100-char option is
    // conspicuous. An absolute char threshold therefore punishes certs with longer
    // options and produces false alarms.
    //
    // The principled bar already exists: item-cue-guard's CUE_CFG declares the design
    // tolerance as max(KEY_LEN_MARGIN=5 chars, KEY_LEN_PCT=10% of the longest rival).
    // Anything inside that is cue-neutral BY DESIGN. So the audit measures ESCAPES -
    // items whose key exceeds the guard's own allowance, i.e. items that should never
    // have shipped - rather than re-inventing a threshold.
    const KEY_LEN_MARGIN = 5, KEY_LEN_PCT = 10;
    let escapes = 0, marginPctSum = 0;
    for (const q of en) {
      const keyId = Array.isArray(q.correct_answer) ? q.correct_answer[0] : q.correct_answer;
      const keyLen = (q.options.find((o) => o.id === keyId)?.text || "").length;
      const maxRival = Math.max(0, ...q.options.filter((o) => o.id !== keyId).map((o) => (o.text || "").length));
      if (keyLen <= maxRival || !maxRival) continue;
      const allowed = Math.max(KEY_LEN_MARGIN, Math.round((KEY_LEN_PCT / 100) * maxRival));
      if (keyLen - maxRival > allowed) escapes++;
      marginPctSum += (100 * (keyLen - maxRival)) / maxRival;
    }
    const avgMargin = longest ? Math.round((10 * marginSum) / longest) / 10 : 0;
    const avgMarginPct = longest ? Math.round((10 * marginPctSum) / longest) / 10 : 0;
    const escapeRate = pct(escapes, en.length);
    const strictPct = pct(longest, en.length);
    const detail = `strict-longest ${strictPct}%, mean margin ${avgMargin} chars (${avgMarginPct}% of option), guard escapes ${escapeRate}% (${escapes}/${en.length})`;

    // FAIL only on a real, exploitable cue: items that beat the guard's tolerance, or
    // a strict-longest rate so high the key is findable by "pick the longest" alone.
    if (escapeRate > 2.0) R.fail("cue.length", "§8.1", "Length cue non-diagnostic", `${detail} - items escaped the cue-guard tolerance`);
    else if (strictPct > 50) R.fail("cue.length", "§8.1", "Length cue non-diagnostic", `${detail} - 'pick the longest' beats chance too reliably`);
    else R.pass("cue.length", "§8.1", "Length cue non-diagnostic", detail);
  }

  // === 9. TRILINGUAL INTEGRITY ==============================================
  const qGroups = new Map();
  for (const q of questions) qGroups.set(q.question_group_id, (qGroups.get(q.question_group_id) ?? 0) + 1);
  const badQ = [...qGroups.entries()].filter(([g, n]) => g && n !== 3);
  badQ.length === 0
    ? R.pass("trilingual.items", "§8", "Every question group holds 3 language rows", `${qGroups.size} groups`)
    : R.fail("trilingual.items", "§8", "Every question group holds 3 language rows", `${badQ.length} groups off`, badQ.slice(0, 5).map(([g, n]) => `${g}=${n}`));

  const lGroups = new Map();
  for (const l of lessons) lGroups.set(l.lesson_group_id, (lGroups.get(l.lesson_group_id) ?? 0) + 1);
  const badL = [...lGroups.entries()].filter(([g, n]) => g && n !== 3);
  if (lessons.length === 0) R.skip("trilingual.lessons", "§11", "Lessons trilingual", "no lessons");
  else badL.length === 0
    ? R.pass("trilingual.lessons", "§11", "Every lesson group holds 3 language rows", `${lGroups.size} groups, ${lessons.length} rows`)
    : R.warn("trilingual.lessons", "§11", "Every lesson group holds 3 language rows", `${badL.length} groups not fully localized`, badL.slice(0, 5).map(([g, n]) => `${g}=${n}`));

  // === 10. ENCODING INTEGRITY ===============================================
  const mojibake = lessons.filter((l) => (l.content_md || "").includes("\u00e2\u20ac"));
  mojibake.length === 0
    ? R.pass("encoding", "§11", "No mojibake in lesson content", `${lessons.length} lesson rows clean`)
    : R.fail("encoding", "§11", "No mojibake in lesson content", `${mojibake.length} corrupted`, mojibake.slice(0, 5).map((l) => `${l.language}/${l.slug}`));

  // === 15b. TRANSLATIONS MATCH THE ENGLISH THEY RENDER ======================
  // A provisional row is one whose English source changed after it was approved
  // (trigger trg_invalidate_task_translations, migration 132) or one never
  // reviewed. Either way the published blueprint in that language describes a
  // competence the exam does not measure - construct invalidity for every
  // candidate sitting in that language.
  //
  // This is not hypothetical. Five SM-AI-I statements were translated from
  // wording migration 091 had already superseded; the Spanish blueprint said
  // "Explicar los tres pilares" while the exam measured "Apply the three pillars
  // to diagnose which pillar is broken".
  const txProvisional = [
    ...(taskTx ?? []).filter((r) => r.is_provisional).map((r) => {
      const t = taskById.get(r.task_id);
      return `task ${t ? t.code : r.task_id}/${r.language}`;
    }),
    ...(domTx ?? []).filter((r) => r.is_provisional).map((r) => {
      const d = (domains ?? []).find((x) => x.id === r.domain_id);
      return `domain ${d ? d.code : r.domain_id}/${r.language}`;
    }),
  ];
  const txTotal = (taskTx ?? []).length + (domTx ?? []).length;
  if (txTotal === 0) {
    R.skip("i18n.approved", "§11", "Translations reviewed against current English", "no translations loaded");
  } else {
    txProvisional.length === 0
      ? R.pass("i18n.approved", "§11", "Translations reviewed against current English", `${txTotal} rows, none provisional`)
      : R.fail("i18n.approved", "§11", "Translations reviewed against current English",
          `${txProvisional.length} of ${txTotal} provisional - the English moved, or they were never reviewed`,
          [...new Set(txProvisional)].slice(0, 12));
  }

  // === 15c. THE STATEMENT'S VERB AGREES WITH ITS DECLARED LEVEL =============
  // The task statement is what the credential publishes; bloom_level is what the
  // exam is built to. When they disagree, the blueprint claims one competence and
  // the items measure another - and nothing caught it, because every check
  // compared the DATABASE to ITSELF.
  //
  // 16 tasks across three certs were incoherent while all six certs passed this
  // gate (migration 128). Only unambiguous verbs are mapped: "identify",
  // "recognize" and "determine" legitimately span levels and are skipped. A verb
  // that is not mapped at all is WARNED, not failed - that is how "Present a Done
  // Increment" and "Work with the Product Owner" surface for human eyes.
  // Only verbs whose level is UNAMBIGUOUS. Deliberately absent:
  //   distinguish / differentiate - span 2..4 ("Distinguish Done from looks-done"
  //     is analysis; "Distinguish the types of governance instrument" is not)
  //   identify / recognize / determine / classify / define - same problem
  // A verb that is not here is WARNED, never failed.
  const VERB_RANK = {
    recall: 1, list: 1, state: 1, name: 1,
    explain: 2, describe: 2, summarize: 2, articulate: 2,
    apply: 3, select: 3, choose: 3, match: 3, implement: 3, calculate: 3,
    analyze: 4, analyse: 4, diagnose: 4, trace: 4, deconstruct: 4,
    evaluate: 5, judge: 5, critique: 5, justify: 5,
    create: 6, write: 6, build: 6, design: 6, construct: 6, compose: 6, formulate: 6, draft: 6,
  };
  // Compound statements carry their level in the SECOND verb: "Explain incident and
  // problem management AND SELECT which applies" is Apply, not Understand. Scan the
  // opening word plus any word directly after " and ", and take the highest rank.
  // Scanning every word would misfire on nouns - "a described AI USE case" is not Apply.
  // Cognitive verbs that genuinely span levels. "Distinguish Done from
  // looks-done" is analysis; "Distinguish the types of governance instrument" is
  // comprehension. The declared level governs and the verb proves nothing either
  // way, so these are neither failed nor warned.
  const AMBIGUOUS_VERBS = new Set([
    "distinguish", "differentiate", "identify", "recognize", "recognise",
    "determine", "define", "classify", "characterize", "characterise",
    "interpret", "decide", "assess",
  ]);

  // Verbs from the PROFESSION rather than from Bloom. A job-task analysis is
  // supposed to name competences the way practitioners do - "Refactor safely
  // toward maintainability" is how an engineer says it - while the SKILLS line
  // names what the exam measures ("Refactor without changing behavior; verify
  // with tests"). That division is correct, not a defect, and ISO/IEC 17024 does
  // not require the two to use the same word: it requires the competence to be
  // declared, taught, assessed, and honestly claimed.
  //
  // No regex can read a skills line, so warning on these produced ~100 hits
  // across six certs with zero confirmed defects - and a warning that fires on
  // the correct state teaches people to ignore warnings. They are reviewed by a
  // human against their items instead.
  const DOMAIN_VERBS = new Set([
    "coach", "facilitate", "refactor", "conduct", "run", "own", "share", "give",
    "practice", "collaborate", "keep", "live", "manage", "align", "measure",
    "protect", "verify", "use", "operate", "engage", "surface", "turn", "uphold",
    "translate", "selfmanage", "work", "present", "maintain",
  ]);

  // "Given a described AI system, determine whether it is high-risk" - the
  // competence verb follows the scenario clause, so parse past the opener.
  const SCENARIO_OPENERS = new Set([
    "given", "when", "for", "in", "after", "before", "during", "using", "from", "with",
  ]);
  const norm = (w) => String(w || "").toLowerCase().replace(/[^a-z]/g, "");

  const rankOf = (statement) => {
    let s = String(statement || "").trim();
    if (SCENARIO_OPENERS.has(norm(s.split(/[\s,:]+/)[0]))) {
      // The scenario clause can be closed by a comma OR by a dash-delimited
      // aside: "Given a described situation - including a decision about
      // whether to adopt AI - apply the appropriate guiding principle".
      // Take the LAST such delimiter so a nested aside does not strand us
      // mid-clause; the competence verb is what follows it.
      const parts = s.split(/\s+-\s+|\s+--\s+|,/);
      if (parts.length > 1) {
        const tail = parts[parts.length - 1].trim();
        if (tail) s = tail;
      }
    }
    const words = [s.split(/[\s,:]+/)[0]];
    // Bloom-5 verbs are also ordinary English ("Verify AND EVALUATE AI output"
    // means judge it, not Bloom's Evaluate), so they are only trusted in the
    // LEADING position - never picked up from a trailing "and" clause.
    const AMBIGUOUS_TRAILING = new Set(["evaluate", "judge", "assess", "critique", "use", "trace", "match"]);
    for (const m of s.matchAll(/\band\s+([A-Za-z]+)/g)) {
      if (!AMBIGUOUS_TRAILING.has(norm(m[1]))) words.push(m[1]);
    }
    const found = words.map((w) => VERB_RANK[norm(w)]).filter((r) => r !== undefined);
    return { rank: found.length ? Math.max(...found) : undefined, lead: norm(words[0]) };
  };

  const mismatchedVerbs = [];
  const unknownVerbs = [];
  for (const t of tasks ?? []) {
    const { rank: vr, lead } = rankOf(t.statement);
    if (!lead || AMBIGUOUS_VERBS.has(lead) || DOMAIN_VERBS.has(lead)) continue;
    const tr = BLOOM_RANK[t.bloom_level] ?? 0;
    if (vr === undefined) { unknownVerbs.push(`${t.code} "${lead}"`); continue; }
    // An out-of-scope task is assessed by simulation, which can reach ABOVE the
    // verb's rank. Only exam-scope tasks are held to strict equality.
    const bad = t.is_exam_scope ? vr !== tr : vr > tr;
    if (bad) {
      mismatchedVerbs.push(`${t.code}: verb level ${vr} ("${lead}") vs declared ${t.bloom_level}`);
    }
  }
  if (mismatchedVerbs.length === 0) {
    R.pass("jta.statementVerb", "§9", "Statement verb agrees with declared level", `${(tasks ?? []).length} tasks`);
  } else {
    R.fail("jta.statementVerb", "§9", "Statement verb agrees with declared level",
      `${mismatchedVerbs.length} task(s) publish a verb at a different cognitive level than the exam is built to`,
      mismatchedVerbs.slice(0, 12));
  }
  if (unknownVerbs.length > 0) {
    R.warn("jta.statementVerbUnknown", "§9", "Statement verbs are recognisable Bloom verbs",
      `${unknownVerbs.length} task(s) open with a verb outside the known map - check each names an assessable competence`,
      unknownVerbs.slice(0, 12));
  }

  // === 15d. BLUEPRINT DISPLAY ORDER ========================================
  // order_index is global across a cert in some certs and per-domain in others,
  // so the absolute value proves nothing. What matters is that within a domain,
  // display order equals task-code order. Two SPO-AI-I tasks added after the
  // scaffold sorted FIRST in their domain (migration 131).
  const orderIssues = [];
  for (const d of domains ?? []) {
    const dt = (tasks ?? []).filter((t) => t.domain_id === d.id);
    const byIndex = [...dt].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)).map((t) => t.code);
    const byCode = [...dt].sort((a, b) => {
      const [am, an] = a.code.split(".").map(Number);
      const [bm, bn] = b.code.split(".").map(Number);
      return am - bm || an - bn;
    }).map((t) => t.code);
    byIndex.forEach((code, i) => { if (code !== byCode[i]) orderIssues.push(`${d.code}: ${code} shows at position ${i + 1}, belongs at ${byCode.indexOf(code) + 1}`); });
  }
  orderIssues.length === 0
    ? R.pass("jta.displayOrder", "§4", "Blueprint order matches task-code order", `${(domains ?? []).length} domains`)
    : R.fail("jta.displayOrder", "§4", "Blueprint order matches task-code order",
        `${orderIssues.length} task(s) display out of sequence`, orderIssues.slice(0, 10));

  // === 15e. SCHEMA GUARDRAILS (platform-wide, not per-cert) =================
  // Properties supabase-js cannot otherwise reach. Both of these were real:
  // v_live_items leaked the secure answer key to any authenticated user through
  // PostgREST (126), and quiz_attempts CASCADE meant deleting an item silently
  // destroyed the evidence a candidate had answered it (127).
  if (!guard) {
    R.skip("schema.guardrails", "§8", "Schema guardrails", "v_schema_guardrails not readable");
  } else {
    guard.answer_key_views_exposed === 0
      ? R.pass("schema.answerKeyViews", "§8", "No view exposes correct_answer to a client role", "0 exposed")
      : R.fail("schema.answerKeyViews", "§8", "No view exposes correct_answer to a client role",
          `${guard.answer_key_views_exposed} view(s) emit correct_answer AND are granted to anon/authenticated`);
    guard.attempt_evidence_cascades === 0
      ? R.pass("schema.attemptEvidence", "§8", "Deleting an item cannot destroy attempt evidence", "quiz_attempts FK is RESTRICT")
      : R.fail("schema.attemptEvidence", "§8", "Deleting an item cannot destroy attempt evidence",
          "quiz_attempts.question_id is not RESTRICT - a DELETE would silently remove scored-attempt records");
    if (guard.owner_run_views_granted > 0) {
      R.warn("schema.ownerRunViews", "§8", "Client-granted views run as caller",
        `${guard.owner_run_views_granted} granted view(s) run as owner and bypass RLS - review each is safe`);
    }
  }
  // === 11. EXAM SCOPE =======================================================
  // "(intentional?)" used to be an unanswerable question. is_simulation_candidate
  // answers it: a task excluded from the exam because MCQ cannot validly assess it
  // (typically Bloom 5-6) and parked for simulation is the CORRECT state, not a
  // finding. A warning that fires on the correct state teaches people to ignore
  // warnings. Only an exclusion with no recorded reason is worth flagging.
  const outScope = (tasks ?? []).filter((t) => !t.is_exam_scope);
  const undeclared = outScope.filter((t) => !t.is_simulation_candidate);
  if (outScope.length === 0) {
    R.pass("scope", "§4", "Every out-of-scope task declares its intent", `${(tasks ?? []).length} tasks, all in exam scope`);
  } else if (undeclared.length === 0) {
    R.pass("scope", "§4", "Every out-of-scope task declares its intent",
      `${outScope.length} out of scope, all flagged is_simulation_candidate`,
      outScope.map((t) => `${t.code} (${t.bloom_level})`));
  } else {
    R.warn("scope", "§4", "Every out-of-scope task declares its intent",
      `${undeclared.length} excluded from the exam with no is_simulation_candidate flag - no recorded reason`,
      undeclared.map((t) => t.code));
  }

  // === 12. APPROVED STATUS ==================================================
  const notApproved = questions.filter((q) => q.status !== "approved");
  notApproved.length === 0
    ? R.pass("status", "§8", "All items approved", `${questions.length} items`)
    : R.fail("status", "§8", "All items approved", `${notApproved.length} not approved -> invisible to the assembler`);

  // === 13 + 14. LESSON DSL STRUCTURE ========================================
  // Parse the lesson DSL properly rather than with a regex. The DSL is line-oriented:
  // a section opens on a line starting "::name ..." and closes on a line that is
  // exactly "::". The old regex used a non-greedy [\s\S]*? up to the first "\n::",
  // which silently mis-slices whenever a block is malformed - and that is precisely
  // the case it most needs to get right.
  //
  // INVARIANT 14 - EVERY BLOCK HAS A CLOSER. Two AIGRM-I lessons ended their widget
  // JSON with "}" and ran straight into the next "::concept" with no "::" closer. The
  // renderer never saw the section terminate, so BOTH WIDGETS SILENTLY FAILED TO
  // RENDER, in all three languages, in a live cert. No error, no visual glitch - just
  // a missing exercise nobody noticed. That is the worst failure mode in the system,
  // and it is exactly what an executable invariant is for.
  //
  // INVARIANT 13 - DRAG-MATCH IS STRICTLY 1:1 (n items -> n targets, one each,
  // allowReuse never used). Two reasons:
  //   (a) BUG. On a drop into an occupied target the component evicted the occupant,
  //       so 4 items -> 2 targets could never hold more than 2 placements; allPlaced
  //       never became true and Check never enabled. Those widgets were literally
  //       uncompletable. (Component now degrades gracefully, but the rule stands.)
  //   (b) ASSESSMENT. Sorting 4 items into 2 buckets is 4 coin-flips - a guesser
  //       scores ~50% knowing nothing. Matching 4 items to 4 distinct targets is 24
  //       permutations: you know it or you don't. Only the 1:1 form measures.

  /** Line-based DSL scan. Returns { blocks, unclosed }. */
  function scanLessonDsl(md) {
    const lines = (md || "").split(/\r?\n/);
    const blocks = [];
    const unclosed = [];
    let inFrontmatter = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip YAML frontmatter (--- ... ---) at the very top.
      if (i === 0 && line.trim() === "---") { inFrontmatter = true; continue; }
      if (inFrontmatter) { if (line.trim() === "---") inFrontmatter = false; continue; }

      const open = line.match(/^::([a-z][a-z-]*)(\s.*)?$/);
      if (!open) continue;
      const name = open[1];
      const attrs = open[2] ?? "";
      // Consume until a line that is exactly "::".
      let j = i + 1;
      const body = [];
      let closed = false;
      for (; j < lines.length; j++) {
        if (lines[j].trim() === "::") { closed = true; break; }
        // Another block OPENS before this one closed -> the closer is missing.
        if (/^::[a-z][a-z-]*(\s|$)/.test(lines[j])) break;
        body.push(lines[j]);
      }
      if (!closed) unclosed.push({ name, line: i + 1, attrs: attrs.trim().slice(0, 60) });
      blocks.push({ name, attrs, body: body.join("\n"), closed });
      i = closed ? j : j - 1;
    }
    return { blocks, unclosed };
  }

  const unclosedAll = [];
  const dmBad = [];
  let dmCount = 0;

  for (const l of lessons) {
    const { blocks, unclosed } = scanLessonDsl(l.content_md);
    for (const u of unclosed) {
      unclosedAll.push(`${l.language}/${l.slug}: ::${u.name} at line ${u.line} never closed -> block will NOT render`);
    }
    for (const b of blocks) {
      if (b.name !== "interactive" || !/widget="drag-match"/.test(b.attrs)) continue;
      dmCount++;
      if (!b.closed) continue; // already reported by invariant 14; JSON is unreliable
      let cfg;
      try {
        cfg = JSON.parse(b.body);
      } catch (e) {
        dmBad.push(`${l.language}/${l.slug}: widget JSON does not parse (${String(e.message).slice(0, 50)})`);
        continue;
      }
      const ni = (cfg.items ?? []).length;
      const nt = (cfg.targets ?? []).length;
      const used = Object.values(cfg.correct ?? {});
      const errs = [];
      if (ni !== nt) errs.push(`${ni} items -> ${nt} targets (not 1:1)`);
      if ("allowReuse" in cfg) errs.push("uses allowReuse (banned)");
      if (new Set(used).size !== nt || used.length !== ni) errs.push("targets not used exactly once each");
      if (errs.length) dmBad.push(`${l.language}/${l.slug}: ${errs.join("; ")}`);
    }
  }

  // --- 14: block closers ---
  if (lessons.length === 0) {
    R.skip("lesson.closers", "§11", "Every lesson block has a closer", "no lessons");
  } else {
    unclosedAll.length === 0
      ? R.pass("lesson.closers", "§11", "Every lesson block has a closer", `${lessons.length} lesson rows scanned`)
      : R.fail("lesson.closers", "§11", "Every lesson block has a closer", `${unclosedAll.length} block(s) never close -> they SILENTLY DO NOT RENDER`, unclosedAll);
  }

  // --- 13: drag-match 1:1 ---
  if (dmCount === 0) R.skip("widget.dragmatch", "§11", "drag-match widgets are strictly 1:1", "no drag-match widgets");
  else dmBad.length === 0
    ? R.pass("widget.dragmatch", "§11", "drag-match widgets are strictly 1:1", `${dmCount} widgets, all n->n, no allowReuse`)
    : R.fail("widget.dragmatch", "§11", "drag-match widgets are strictly 1:1", `${dmBad.length} of ${dmCount} are many-to-few (coin-flip sorting, not assessment)`, dmBad);

  return R;
}

// ---------------------------------------------------------------------------
// render
// ---------------------------------------------------------------------------
function render(cert, R) {
  const badge = { PASS: paint(C.green, "PASS"), FAIL: paint(C.red, "FAIL"), WARN: paint(C.yellow, "WARN"), SKIP: paint(C.dim, "skip") };
  console.log(`\n${paint(C.bold, `${cert.code}`)} ${paint(C.dim, `- ${cert.name} [${cert.status}]`)}`);
  console.log(paint(C.dim, "-".repeat(78)));
  for (const c of R.checks) {
    console.log(`  ${badge[c.status]}  ${paint(C.dim, c.clause.padEnd(6))} ${c.label.padEnd(48)} ${paint(C.dim, c.detail ?? "")}`);
    if (c.evidence && (c.status === "FAIL" || c.status === "WARN")) {
      for (const e of [].concat(c.evidence).slice(0, 8)) console.log(paint(C.dim, `           - ${e}`));
    }
  }
  const f = R.failed.length, w = R.warned.length;
  const verdict = f > 0 ? paint(C.red, `${f} FAILURE(S)`) : w > 0 ? paint(C.yellow, `PASS with ${w} warning(s)`) : paint(C.green, "ALL INVARIANTS HOLD");
  console.log(paint(C.dim, "-".repeat(78)) + `\n  ${verdict}`);
}

// ---------------------------------------------------------------------------
(async () => {
  let q = db.from("certifications").select("id, code, name, status, num_questions, passing_score_pct, exam_blueprint, category_slug");
  if (ONLY_CERT) q = q.eq("code", ONLY_CERT);
  const { data: certs, error } = await q.order("code");
  if (error) { console.error(error.message); process.exit(2); }
  if (!certs?.length) { console.error(`No cert found${ONLY_CERT ? ` with code ${ONLY_CERT}` : ""}.`); process.exit(2); }

  const reports = [];
  for (const c of certs) reports.push([c, await verify(c)]);

  if (JSON_OUT) {
    console.log(JSON.stringify({
      generated_at: new Date().toISOString(),
      certs: reports.map(([c, R]) => ({
        code: c.code, name: c.name, status: c.status,
        verdict: R.failed.length ? "FAIL" : R.warned.length ? "WARN" : "PASS",
        checks: R.checks,
      })),
    }, null, 2));
  } else {
    for (const [c, R] of reports) render(c, R);
    const bad = reports.filter(([, R]) => !R.ok);
    console.log("\n" + paint(C.bold, "SUMMARY"));
    for (const [c, R] of reports) {
      const v = R.failed.length ? paint(C.red, "FAIL") : R.warned.length ? paint(C.yellow, "WARN") : paint(C.green, "PASS");
      console.log(`  ${v}  ${c.code.padEnd(10)} ${R.checks.filter((x) => x.status === "PASS").length} pass, ${R.failed.length} fail, ${R.warned.length} warn`);
    }
    console.log(bad.length === 0
      ? "\n" + paint(C.green, "All certs conform. Safe to publish.")
      : "\n" + paint(C.red, `${bad.length} cert(s) with failures - DO NOT publish those until resolved.`));
  }

  process.exit(reports.some(([, R]) => !R.ok) ? 1 : 0);
})();
