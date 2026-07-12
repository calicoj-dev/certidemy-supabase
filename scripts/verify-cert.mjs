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
  nonScrum: /\b(sprint|scrum|product backlog|sprint backlog|user stor(y|ies)|definition of done|daily standup|story points?|velocity)\b/i,
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
  const [{ data: domains }, { data: tasks }, { data: concepts }, { data: modules }] = await Promise.all([
    db.from("domains").select("id, code, weight_pct, order_index").eq("certification_id", id).order("order_index"),
    db.from("tasks").select("id, code, domain_id, is_exam_scope").eq("certification_id", id),
    db.from("concepts").select("id, slug").eq("certification_id", id),
    db.from("modules").select("id, slug, order_index").eq("certification_id", id),
  ]);

  const taskIds = (tasks ?? []).map((t) => t.id);
  const modIds = (modules ?? []).map((m) => m.id);

  const { data: tcs } = await db.from("task_concepts").select("task_id, concept_id").in("task_id", taskIds.length ? taskIds : ["00000000-0000-0000-0000-000000000000"]);

  // questions (paged; banks can exceed the default row cap)
  let questions = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await db.from("quiz_questions")
      .select("id, pool, language, task_id, difficulty, bloom_level, options, correct_answer, status, question_group_id, question_text")
      .eq("certification_id", id).range(from, from + 999);
    if (!data || data.length === 0) break;
    questions.push(...data);
    if (data.length < 1000) break;
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
    const { concepts_total: T, concepts_taught: TT, concepts_tested: TS, untaught_testing_violations: V } = cov;
    TT === T
      ? R.pass("coverage.taught", "§10", "All concepts taught", `${TT}/${T}`)
      : R.fail("coverage.taught", "§10", "All concepts taught", `${TT}/${T}`);
    TS === T
      ? R.pass("coverage.tested", "§10", "All concepts tested", `${TS}/${T}`)
      : R.fail("coverage.tested", "§10", "All concepts tested", `${TS}/${T}`);
    V === 0
      ? R.pass("coverage.untaught", "§10", "No untaught testing (17024)", "violations = 0")
      : R.fail("coverage.untaught", "§10", "No untaught testing (17024)", `violations = ${V}`);
  }

  // === 3. SECURE FIREWALL (sacred) ==========================================
  leaked === 0
    ? R.pass("firewall", "§8", "Secure pool carries no concept links", "0 leaked links")
    : R.fail("firewall", "§8", "Secure pool carries no concept links", `${leaked} SECURE ITEMS LEAK INTO PRACTICE`);

  // === 4. ITEM FLOORS (per task, per language) ==============================
  for (const [pool, floor] of [["secure", 8], ["practice", 10]]) {
    const short = [];
    for (const t of tasks ?? []) {
      for (const lang of LANGS) {
        const n = questions.filter((q) => q.pool === pool && q.language === lang && q.task_id === t.id).length;
        if (n < floor) short.push(`${t.code}/${lang}=${n}`);
      }
    }
    const total = questions.filter((q) => q.pool === pool).length;
    short.length === 0
      ? R.pass(`floors.${pool}`, "§8", `${pool} floor >= ${floor}/task/lang`, `${total} items, all ${(tasks ?? []).length} tasks x3 langs at floor`)
      : R.fail(`floors.${pool}`, "§8", `${pool} floor >= ${floor}/task/lang`, `${short.length} below floor`, short.slice(0, 12));
  }

  // === 5. COGNITIVE CEILING =================================================
  const ceilRank = BLOOM_RANK[profile.ceiling] ?? 6;
  const above = questions.filter((q) => q.pool === "secure" && (BLOOM_RANK[q.bloom_level] ?? 0) > ceilRank);
  above.length === 0
    ? R.pass("ceiling", "§6", `No secure item above declared ceiling (${profile.ceiling})`, `tier=${profile.id}, 0 above`)
    : R.fail("ceiling", "§6", `No secure item above declared ceiling (${profile.ceiling})`, `${above.length} items ABOVE ceiling`, [...new Set(above.map((q) => q.bloom_level))]);

  // === 6. BLUEPRINT CONFORMANCE (can the pool fill the declared form?) ======
  const mix = cert.exam_blueprint?.difficulty_mix ?? null;
  const nq = cert.num_questions ?? 0;
  if (!mix) {
    R.warn("blueprint", "§6", "Cognitive blueprint declared", "no exam_blueprint: forms use the legacy 30/50/20 difficulty balance, which is NOT tied to this cert's JTA");
  } else if (!domains?.length || !nq) {
    R.skip("blueprint", "§6", "Cognitive blueprint", "missing domains or num_questions");
  } else {
    const domSeats = allocate(domains.map((d) => ({ key: d.id, pct: Number(d.weight_pct) })), nq);
    const levels = Object.keys(mix).map(Number).sort((a, b) => a - b);
    const shortfalls = [];
    for (const lang of LANGS) {
      for (const d of domains) {
        const seats = domSeats.get(d.id) ?? 0;
        if (!seats) continue;
        const lvlSeats = allocate(levels.map((l) => ({ key: l, pct: mix[String(l)] })), seats);
        const dTasks = new Set((tasks ?? []).filter((t) => t.domain_id === d.id && t.is_exam_scope).map((t) => t.id));
        for (const l of levels) {
          const need = lvlSeats.get(l) ?? 0;
          if (!need) continue;
          const have = questions.filter((q) =>
            q.pool === "secure" && q.language === lang && q.status === "approved" &&
            dTasks.has(q.task_id) && Number(q.difficulty) === l).length;
          if (have < need) shortfalls.push(`${lang} ${d.code} d${l}: need ${need}, have ${have}`);
        }
      }
    }
    shortfalls.length === 0
      ? R.pass("blueprint", "§6", "Pool can fill the declared blueprint (every domain x level x lang)", `${nq}-item form, mix ${levels.map((l) => mix[String(l)] + "%").join("/")}`)
      : R.fail("blueprint", "§6", "Pool can fill the declared blueprint", `${shortfalls.length} shortfall(s) -> forms will silently drift off blueprint`, shortfalls.slice(0, 10));
  }

  // === 7. CONSTRUCT GROUNDING (no out-of-domain vocabulary) =================
  const isScrum = /\bscrum\b/i.test(cert.name || "");
  if (isScrum) {
    R.skip("grounding", "§10", "Construct grounding", "Scrum cert: agile vocabulary IS the construct");
  } else {
    const bad = questions.filter((q) =>
      q.language === "en" &&
      OUT_OF_DOMAIN.nonScrum.test(`${q.question_text || ""} ${JSON.stringify(q.options || "")}`));
    const enTotal = questions.filter((q) => q.language === "en").length;
    const rate = pct(bad.length, enTotal);
    if (bad.length === 0) R.pass("grounding", "§10", "No out-of-domain (agile) vocabulary", `0 / ${enTotal} en items`);
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

  // === 11. EXAM SCOPE =======================================================
  const outScope = (tasks ?? []).filter((t) => !t.is_exam_scope);
  outScope.length === 0
    ? R.pass("scope", "§4", "All tasks in exam scope", `${(tasks ?? []).length} tasks`)
    : R.warn("scope", "§4", "All tasks in exam scope", `${outScope.length} out of scope (intentional?)`, outScope.map((t) => t.code));

  // === 12. APPROVED STATUS ==================================================
  const notApproved = questions.filter((q) => q.status !== "approved");
  notApproved.length === 0
    ? R.pass("status", "§8", "All items approved", `${questions.length} items`)
    : R.fail("status", "§8", "All items approved", `${notApproved.length} not approved -> invisible to the assembler`);

  // === 13. DRAG-MATCH IS STRICTLY 1:1 =======================================
  // A drag-match must be n items -> n targets, exactly one item per target, and must
  // never use allowReuse. Two reasons, and the second is the one that matters:
  //
  //   (a) BUG. The widget places one item per target by default. A many-to-few design
  //       without allowReuse silently OVERRIDES the previous drop - a real, shipped,
  //       learner-facing defect found in AIE-I by clicking through the app.
  //   (b) ASSESSMENT. Sorting 4 items into 2 buckets is 4 independent coin-flips; a
  //       guesser scores ~50% knowing nothing. Matching 4 items to 4 distinct targets
  //       is 24 permutations - you either know it or you don't. Only the 1:1 form is
  //       a real measurement, which is what a credential's exercises have to be.
  //
  // This reads content_md straight from the DB, so no lesson in any cert - including
  // certs not yet built - can reintroduce the pattern without failing this gate.
  const dmBad = [];
  let dmCount = 0;
  for (const l of lessons) {
    const md = l.content_md || "";
    const re = /^::interactive([^\n]*)\n([\s\S]*?)\n::\s*$/gm;
    let m;
    while ((m = re.exec(md)) !== null) {
      if (!/widget="drag-match"/.test(m[1])) continue;
      dmCount++;
      let cfg;
      try { cfg = JSON.parse(m[2]); } catch { dmBad.push(`${l.language}/${l.slug}: unparseable JSON`); continue; }
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
  if (dmCount === 0) R.skip("widget.dragmatch", "§11", "drag-match widgets are strictly 1:1", "no drag-match widgets");
  else dmBad.length === 0
    ? R.pass("widget.dragmatch", "§11", "drag-match widgets are strictly 1:1", `${dmCount} widgets, all n->n, no allowReuse`)
    : R.fail("widget.dragmatch", "§11", "drag-match widgets are strictly 1:1", `${dmBad.length} of ${dmCount} violate the rule (learners will hit drop-override)`, dmBad);

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
