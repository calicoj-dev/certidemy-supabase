#!/usr/bin/env node
/**
 * The cutover, for any certification: `--cert=<CODE>`. WRITES with `--apply`; dry by default.
 * Unknown flags exit 2. Written for AIMS-F in PROMPT-107 s3 and generalised in PROMPT-120 s4.2.
 *
 * Target pool = approved grounded + the kept authored items. Everything else in the live exam pool is
 * retired with `retired_at`, which `generate-mock-exam` already filters and which no practice surface
 * reads for a secure row (they all filter pool='practice'). Reversible by setting it back to NULL.
 *
 * THE PRE-WRITE GATE IS THE POINT. 20 forms per language must assemble to num_questions under the
 * domain weights, the enemy rule and the stem dedupe. If any domain is short, nothing is written.
 *
 * THE SELECTOR IS TRANSCRIBED, NOT INVENTED: allocateByWeight (generate-mock-exam:596),
 * pickAcrossTasksBalanced (:619), pickBalancedDifficulty (:730), pickByMix (:768). The enemy rule and
 * the stem identity are IMPORTED from the shared modules the function itself imports, so those halves
 * are the real thing rather than a copy.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { enemyKeyOf, enemyReason, markEnemy, enemyRuleControls } from "../functions/_shared/item-rules/enemy-rule.mjs";
import { stemIdentity, stemIdentityControls } from "../functions/_shared/item-rules/stem-identity.mjs";

let APPLY = false, CERT = null, FORMS = 20;
/* ============ --assume-approved: WHAT THE CUTOVER WILL LOOK LIKE AFTER APPROVAL ============
 *
 * Ruled by necessity in PROMPT-121 s4. Target pool = APPROVED grounded + kept, so before the approval
 * step runs the dry run can only ever show the kept set -- 143 rows against a 248-row retire set,
 * which is not the shape anyone is about to apply. The flag treats every grounded row the approval
 * conditions WOULD pass as approved, so the forms gate and the retire counts answer the real
 * question while still writing nothing.
 *
 * REFUSED WITH --apply. A dry run may assume; a write may not. The approval step is what makes it
 * true, and a cutover that acted on an assumption would retire rows against a pool that does not
 * exist yet. */
let ASSUME_APPROVED = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  if (a === "--assume-approved") { ASSUME_APPROVED = true; continue; }
  const m = a.match(/^--(cert|forms)=(.+)$/);
  if (m) { if (m[1] === "cert") CERT = m[2]; else FORMS = Number(m[2]); continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=<CODE>, --forms=<n>, --assume-approved, --apply.");
  process.exit(2);
}

if (!CERT) {
  /* NO CERTIFICATION DEFAULT (PROMPT-135 s3). This defaulted to a literal, so a caller that
   * forgot --cert operated on a different certification and said nothing. */
  console.error("--cert=<CODE> is required. cutover-aimsf.mjs used to default to a single\n" +
    "certification, which is how the rollback command came to offer AIMS-F after an ISMS-IA cutover.");
  process.exit(2);
}
if (ASSUME_APPROVED && APPLY) {
  console.error("REFUSING: --assume-approved is a DRY-RUN instrument and cannot be combined with");
  console.error("--apply. Run the approval step first; that is what makes the assumption true.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const LANGS = ["en", "es-419", "pt-BR"];
/* ============ THE TWO FILENAMES FOLLOW --cert ============
 *
 * Generalised PROMPT-120 s4.2, not forked. Both were hard-coded to AIMSF in a script that already
 * took `--cert`: the keep list it READ and the rollback file it WRITES. Run on ISMS-F as it stood, it
 * would have read AIMS-F's keep ids -- none of which are ISMS-F rows -- and retired the entire
 * ISMS-F exam pool, then written the rollback under AIMS-F's name and refused to overwrite it.
 *
 * The same defect class as approve-grounded-items' rejections file, found the same way: by pointing a
 * `--cert` script at a second certification and reading what it actually opened. */
const SLUG = CERT.replace(/-/g, "");
const RETIRED_FILE = join(ROOT, SLUG + "-CUTOVER-RETIRED.json");
const SURVIVORS_FILE = join(ROOT, SLUG + "-SURVIVORS.json");

/* ============ A CONTROL SUITE REPORTING ZERO CASES IS VACUOUS, NOT PASSING ============
 *
 * Measured at the ISMS-F dry run: this printed "enemy-rule controls: 0 case(s), all pass" and
 * "stem-identity controls: 0 case(s), all pass" -- and went on. Both modules return an ARRAY of cases,
 * so `c.fails` and `c.cases` are both undefined and the reader found nothing to object to.
 *
 * The two guards this script leans on hardest therefore reported themselves verified by a reader that
 * had not read them. Three shapes are accepted now, and ZERO CASES REFUSES THE RUN.
 */
for (const [label, c] of [["enemy-rule", enemyRuleControls()], ["stem-identity", stemIdentityControls()]]) {
  /* TWO CONTRACTS, AND THEY LOOK ALIKE. enemyRuleControls returns an array of CASE OBJECTS
   * ({what, pass}); stemIdentityControls returns an array of FAILURE STRINGS, empty on success. A
   * reader that assumed one shape reported the other as zero cases -- and reading an empty failure
   * list as "vacuous" is the same mistake in the other direction. So the shape is detected, and the
   * case count comes from `examined` where the suite reports it. */
  const arr = Array.isArray(c) ? c : (c.cases || []);
  const caseObjects = arr.filter((x) => x && typeof x === "object" && "pass" in x);
  const isCaseList = caseObjects.length === arr.length && arr.length > 0;
  const fails = isCaseList ? arr.filter((x) => x.pass === false)
    : (Array.isArray(c) ? arr : (c.fails || []));
  const n = (Array.isArray(c) ? c.examined : c.examined) ?? (isCaseList ? arr.length : null);
  if (n === null || n === 0) {
    console.error("REFUSING: " + label + " controls do not report how many cases they examined, or");
    console.error("examined none. A suite whose case count is unknowable cannot be said to pass, and");
    console.error("this script retires live examination items on the strength of it.");
    process.exit(2);
  }
  if (fails.length) {
    console.error("REFUSING: " + label + " controls fail: " +
      JSON.stringify(fails.map((x) => (x && x.what) || x)).slice(0, 240));
    process.exit(2);
  }
  console.log(label + " controls: " + n + " case(s), all pass");
}

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const cert = (await getAll(KEY, "certifications?select=id,num_questions,exam_blueprint&code=eq." + CERT))[0];
if (!cert) { console.error("No certification " + CERT); process.exit(2); }
const TARGETN = cert.num_questions ?? 40;
const MIX = (cert.exam_blueprint && cert.exam_blueprint.difficulty_mix) || null;

const SEL = "id,language,status,pool,visibility,is_exam_scope,retired_at,item_origin,question_group_id," +
  "question_text,options,options_fixed_order,correct_answer,explanation,difficulty,task_id";
const fetchAll = () => getAll(KEY, "quiz_questions?select=" + SEL + "&certification_id=eq." + cert.id + "&order=id");
let all = await fetchAll();
const ig = new Map((await getAll(KEY, "item_grounding?select=question_id,review_verdict,key_support_clause," +
  "source_id,edition&order=question_id")).map((g) => [g.question_id, g]));
const tasks = (await getAll(KEY, "tasks?select=id,code,domain_id,certification_id&order=code"))
  .filter((t) => t.certification_id === cert.id);
const domains = (await getAll(KEY, "domains?select=id,code,weight_pct,certification_id&order=code"))
  .filter((d) => d.certification_id === cert.id);
const domainByTask = new Map(tasks.map((t) => [t.id, t.domain_id]));

const enRowOf = (r, rows) => r.language === "en" ? r
  : (r.question_group_id ? rows.find((x) => x.question_group_id === r.question_group_id && x.language === "en") : null);

/* generate-mock-exam's mode='exam' candidate filter, transcribed from :303-344. */
/* ============ THE ASSUMPTION REACHES HERE TOO ============
 *
 * `--assume-approved` first touched only the grounded-approved SET, and 2b then reported 774 of 1203
 * target rows "not in the live pool" -- because this filter still demanded `approved`. Half an
 * assumption is worse than none: it produced a number about a pool the run was not simulating.
 *
 * Under the flag a PENDING_REVIEW row counts as live when its group is one approval would promote,
 * which is the whole group including both siblings. */
const ASSUMED_GROUPS = new Set();
const inLivePool = (r, l) => r.language === l && r.pool === "secure" &&
  (r.status === "approved" ||
    (ASSUME_APPROVED && r.status === "pending_review" && r.question_group_id &&
      ASSUMED_GROUPS.has(r.question_group_id))) &&
  r.retired_at === null && r.item_origin !== null && r.item_origin !== undefined &&
  r.item_origin !== "generated" && r.is_exam_scope === true;

/* ============ 1. THE KEPT SET, from the record ============ */
/* A MISSING KEEP LIST IS A REFUSAL, NEVER AN EMPTY ONE. An empty keep set makes every live secure
 * item a retire candidate, which is the one mistake this script must not be able to make quietly. */
if (!existsSync(SURVIVORS_FILE)) {
  console.error("REFUSING: " + SURVIVORS_FILE.split(/[\\/]/).pop() + " does not exist, so the KEPT" +
    " set would be empty and every live secure item a retire candidate.");
  process.exit(2);
}
const surv = JSON.parse(readFileSync(SURVIVORS_FILE, "utf8"));
const KEEP_IDS = surv.keep_ids || [];
console.log("");
console.log("1. KEPT SET   " + SURVIVORS_FILE.split(/[\\/]/).pop() + " keep_ids = " + KEEP_IDS.length + " id(s)");
const enRows = all.filter((r) => r.language === "en");
const keptResolved = [], keptUnresolved = [], keptNoSiblings = [], keptNotLive = [];
for (const kid of KEEP_IDS) {
  const hits = enRows.filter((r) => String(r.id).startsWith(kid));
  if (hits.length !== 1) { keptUnresolved.push({ kid, n: hits.length }); continue; }
  const en = hits[0];
  const sibs = LANGS.filter((l) => l !== "en").map((l) => ({ l,
    row: all.find((x) => x.question_group_id && x.question_group_id === en.question_group_id && x.language === l) }));
  const missing = sibs.filter((s) => !s.row || s.row.status !== "approved" || s.row.retired_at !== null).map((s) => s.l);
  if (!inLivePool(en, "en")) { keptNotLive.push({ kid, status: en.status, pool: en.pool }); continue; }
  if (missing.length) { keptNoSiblings.push({ kid, missing }); continue; }
  keptResolved.push({ kid, en, sibs: sibs.map((s) => s.row) });
}
console.log("   resolved to one live English row, with approved siblings in both languages   " + keptResolved.length);
console.log("   NOT COUNTED -- unresolvable id                                               " + keptUnresolved.length);
console.log("   NOT COUNTED -- English row not in the live exam pool                          " + keptNotLive.length);
console.log("   NOT COUNTED -- missing or unapproved sibling                                  " + keptNoSiblings.length);
for (const k of keptUnresolved) console.log("     unresolvable " + k.kid + " -> " + k.n + " row(s)");
for (const k of keptNotLive) console.log("     not live     " + k.kid + "  status=" + k.status + " pool=" + k.pool);
for (const k of keptNoSiblings) console.log("     no sibling   " + k.kid + "  missing/unapproved: " + k.missing.join(","));
console.log("");
console.log("   KEPT, by id (" + keptResolved.length + "):");
for (let i = 0; i < keptResolved.length; i += 10) {
  console.log("     " + keptResolved.slice(i, i + 10).map((k) => k.kid).join(" "));
}
const keptEnIds = new Set(keptResolved.map((k) => k.en.id));

/* ============ 2. THE RETIRE SET ============ */
/* NOT filtered by `inLivePool`. Defining the target set through the live-pool predicate is how the
 * first version of this script reported "0 unservable" while every grounded row was excluded: the
 * subtraction cannot see a row the filter already dropped. The servability check below is what tests
 * the predicate, so this side must be independent of it. */
const groundedApprovedEn = new Set(enRows.filter((r) => ig.has(r.id) &&
  ig.get(r.id).review_verdict === "accept" && r.retired_at === null &&
  /* under --assume-approved an ACCEPTED grounded row counts even while still pending_review */
  (r.status === "approved" || (ASSUME_APPROVED && r.status === "pending_review")))
  .map((r) => r.id));
console.log("");
if (ASSUME_APPROVED) {
  /* every group approval would promote: an accepted grounded English row, live, not retired. */
  for (const r of enRows) {
    const g = ig.get(r.id);
    if (!g || g.review_verdict !== "accept" || r.retired_at !== null) continue;
    if (r.question_group_id) ASSUMED_GROUPS.add(r.question_group_id);
  }
  console.log("--assume-approved: " + ASSUMED_GROUPS.size + " group(s) treated as approved. NOTHING IS");
  console.log("  WRITTEN and nothing is promoted -- this shows the shape the cutover will have AFTER");
  console.log("  the approval step, which is the only shape worth gating on.");
}
console.log("2. RETIRE SET   live exam pool - approved grounded - kept, per language, siblings with their group");
const retire = [];
for (const l of LANGS) {
  const pool = all.filter((r) => inLivePool(r, l));
  for (const r of pool) {
    const en = enRowOf(r, all);
    if (!en) { retire.push({ r, why: "no English row in its group" }); continue; }
    if (groundedApprovedEn.has(en.id)) continue;
    if (keptEnIds.has(en.id)) continue;
    retire.push({ r, why: "not grounded-approved and not kept" });
  }
}
for (const l of LANGS) {
  const pool = all.filter((r) => inLivePool(r, l)).length;
  const ret = retire.filter((x) => x.r.language === l).length;
  console.log("   " + l.padEnd(7) + " live pool " + String(pool).padStart(4) + "   retire " + String(ret).padStart(4) +
    "   remains " + String(pool - ret).padStart(4));
}

/* ============ 2b. THE TARGET POOL MUST ACTUALLY BE SERVABLE ============
 *
 * The retire set is defined by SUBTRACTION from the live pool, so a target row that the live-pool
 * filter already excludes is invisible to every count below: the arithmetic balances, the gate passes,
 * and the cutover retires the old bank while the new one is served to nobody.
 *
 * Found on the first dry run: all 200 approved grounded rows carry `item_origin = 'generated'`, which
 * `generate-mock-exam` excludes on BOTH modes. Asserted here so it can never pass silently. */
{
  const intended = new Set();
  for (const r of all) {
    if (r.retired_at !== null) continue;
    const en = enRowOf(r, all);
    if (!en) continue;
    if (groundedApprovedEn.has(en.id) || keptEnIds.has(en.id)) intended.add(r.id);
  }
  const unservable = [...intended].map((id) => all.find((r) => r.id === id))
    .filter((r) => r && LANGS.includes(r.language) && !inLivePool(r, r.language));
  console.log("");
  console.log("2b. IS THE TARGET POOL SERVABLE?   intended target rows " + intended.size +
    "   NOT in the live pool " + unservable.length);
  if (unservable.length) {
    const why = (r) => {
      const f = [];
      if (r.pool !== "secure") f.push("pool=" + r.pool);
      if (r.status !== "approved") f.push("status=" + r.status);
      if (r.is_exam_scope !== true) f.push("is_exam_scope=" + r.is_exam_scope);
      if (r.item_origin === null || r.item_origin === undefined) f.push("item_origin IS NULL");
      else if (r.item_origin === "generated") f.push("item_origin='generated'");
      return f.join(", ") || "unknown";
    };
    const tally = new Map();
    for (const r of unservable) { const k = why(r); tally.set(k, (tally.get(k) || 0) + 1); }
    for (const [k, n] of tally) console.log("     " + n + " row(s) excluded by: " + k);
    console.error("");
    console.error("STOPPING BEFORE ANY WRITE. The target pool is not servable, so retiring the old pool");
    console.error("would leave forms drawn from the remainder and the new bank served to nobody.");
    console.error("This is a ruling, not a fix I should pick: admitting these rows means either changing");
    console.error("item_origin on reviewed grounded rows, or changing generate-mock-exam's filter.");
    process.exit(1);
  }
}

/* ============ 3. DUPLICATE STEMS in the FINAL pool ============ */
const finalPool = (l) => all.filter((r) => inLivePool(r, l) && !retire.some((x) => x.r.id === r.id));
const enStemByGroup = new Map();
for (const r of enRows) {
  if (r.question_group_id) {
    enStemByGroup.set(r.question_group_id, String(r.question_text || "").toLowerCase().replace(/\s+/g, " ").trim());
  }
}
console.log("");
console.log("3. DUPLICATE STEMS in the final pool   (stemIdentity, the function's own identity)");
let dupProblem = 0;
for (const l of LANGS) {
  const seen = new Map();
  for (const r of finalPool(l)) {
    const k = stemIdentity(r, enStemByGroup);
    if (!seen.has(k)) seen.set(k, []);
    seen.get(k).push(r);
  }
  const dups = [...seen.entries()].filter(([, v]) => v.length > 1);
  console.log("   " + l.padEnd(7) + " distinct identities " + seen.size + "   identities with >1 row " + dups.length);
  for (const [, v] of dups) {
    dupProblem++;
    console.log("     " + v.map((r) => String(r.id).slice(0, 8)).join(" ") + "   " +
      String(v[0].question_text).replace(/\s+/g, " ").slice(0, 90));
  }
}
if (dupProblem) {
  console.log("   -> a duplicate identity survives into the final pool. Ruled: retire one of the pair.");
}

/* ============ 4. THE PRE-WRITE GATE: 20 forms per language ============ */
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } }
function allocateByWeight(doms, total) {
  const sum = doms.reduce((s, d) => s + d.weight_pct, 0) || 1;
  const floored = doms.map((d) => { const raw = (d.weight_pct / sum) * total;
    return { id: d.id, n: Math.floor(raw), rem: raw - Math.floor(raw) }; });
  let assigned = floored.reduce((s, f) => s + f.n, 0);
  const order = [...floored].sort((a, b) => b.rem - a.rem);
  let i = 0;
  while (assigned < total && order.length > 0) { order[i % order.length].n += 1; assigned += 1; i += 1; }
  return new Map(floored.map((f) => [f.id, f.n]));
}
function pickBalancedDifficulty(pool, quota) {
  const easy = pool.filter((q) => q.difficulty <= 2), medium = pool.filter((q) => q.difficulty === 3),
    hard = pool.filter((q) => q.difficulty >= 4);
  const e = Math.round(quota * 0.3), m = Math.round(quota * 0.5), h = quota - e - m;
  const picked = [...easy.slice(0, e), ...medium.slice(0, m), ...hard.slice(0, h)];
  if (picked.length < quota) {
    const used = new Set(picked.map((p) => p.id));
    for (const q of pool) { if (picked.length >= quota) break; if (!used.has(q.id)) { used.add(q.id); picked.push(q); } }
  }
  return picked.slice(0, quota);
}
function pickByMix(pool, quota, mix) {
  if (!pool.length || !quota) return [];
  const levels = Object.keys(mix).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!levels.length) return pickBalancedDifficulty(pool, quota);
  const sumPct = levels.reduce((s, l) => s + (mix[String(l)] ?? 0), 0) || 1;
  const seats = levels.map((l) => { const raw = ((mix[String(l)] ?? 0) / sumPct) * quota;
    return { level: l, n: Math.floor(raw), rem: raw - Math.floor(raw) }; });
  let assigned = seats.reduce((s, x) => s + x.n, 0);
  const byRem = [...seats].sort((a, b) => b.rem - a.rem);
  let i = 0;
  while (assigned < quota && byRem.length > 0) { byRem[i % byRem.length].n += 1; assigned += 1; i += 1; }
  const byLevel = new Map();
  for (const q of pool) { const d = Number(q.difficulty); if (!byLevel.has(d)) byLevel.set(d, []); byLevel.get(d).push(q); }
  const picked = [], used = new Set();
  for (const s of seats) {
    let taken = 0;
    for (const q of (byLevel.get(s.level) || [])) {
      if (taken >= s.n) break;
      if (used.has(q.id)) continue;
      used.add(q.id); picked.push(q); taken += 1;
    }
  }
  if (picked.length < quota) {
    for (const q of pool) { if (picked.length >= quota) break; if (!used.has(q.id)) { used.add(q.id); picked.push(q); } }
  }
  return picked.slice(0, quota);
}
function pickAcrossTasksBalanced(pool, quota, mix, usedEnemy, usedOptionText) {
  if (!pool.length || !quota) return [];
  const stemShuffled = [...pool]; shuffle(stemShuffled);
  const seenStem = new Set();
  const local = { enemy: new Set(), optionText: new Set() };
  const deduped = [];
  for (const q of stemShuffled) {
    if (seenStem.has(q.dedupe_key)) continue;
    if (enemyReason(q, { enemy: usedEnemy, optionText: usedOptionText })) continue;
    if (enemyReason(q, local)) continue;
    seenStem.add(q.dedupe_key); markEnemy(q, local); deduped.push(q);
  }
  pool = deduped;
  const byTask = new Map();
  for (const q of pool) { const k = q.task_id ?? "none"; if (!byTask.has(k)) byTask.set(k, []); byTask.get(k).push(q); }
  for (const arr of byTask.values()) shuffle(arr);
  const queues = [...byTask.values()]; shuffle(queues);
  const rr = [];
  let added = true;
  while (added) { added = false; for (const q of queues) { const n = q.shift(); if (n) { rr.push(n); added = true; } } }
  const n = Math.min(quota, rr.length);
  const out = mix ? pickByMix(rr, n, mix) : pickBalancedDifficulty(rr, n);
  for (const q of out) markEnemy(q, { enemy: usedEnemy, optionText: usedOptionText });
  return out;
}
const candidatesFor = (l, rows) => rows.filter((r) => inLivePool(r, l) &&
  !retire.some((x) => x.r.id === r.id)).map((q) => ({
    id: q.id, options: q.options, difficulty: q.difficulty, task_id: q.task_id,
    domain_id: q.task_id ? domainByTask.get(q.task_id) ?? null : null,
    dedupe_key: stemIdentity(q, enStemByGroup),
    enemy_key: (() => { const en = enRowOf(q, rows); const g = en ? ig.get(en.id) : null; return g ? enemyKeyOf(g) : null; })(),
  }));

function assemble(l, rows) {
  const candidates = candidatesFor(l, rows);
  const alloc = allocateByWeight(domains, TARGETN);
  const byDomain = new Map();
  for (const q of candidates) { if (!q.domain_id) continue; if (!byDomain.has(q.domain_id)) byDomain.set(q.domain_id, []); byDomain.get(q.domain_id).push(q); }
  const selected = [], chosen = new Set(), shortfalls = [];
  const usedEnemy = new Set(), usedOptionText = new Set();
  for (const d of domains) {
    const quota = alloc.get(d.id) ?? 0;
    if (!quota) continue;
    const poolForDomain = (byDomain.get(d.id) ?? []).filter((q) => !chosen.has(q.id));
    const picked = pickAcrossTasksBalanced(poolForDomain, quota, MIX, usedEnemy, usedOptionText);
    for (const q of picked) { chosen.add(q.id); selected.push(q); }
    if (picked.length < quota) shortfalls.push({ code: d.code, need: quota, have: picked.length });
  }
  return { selected, shortfalls, candidates: candidates.length };
}

console.log("");
console.log("4. PRE-WRITE GATE   " + FORMS + " forms per language, target_count=" + TARGETN +
  ", difficulty_mix=" + (MIX ? JSON.stringify(MIX) : "legacy 30/50/20"));
let gateFail = 0;
/* ============ WHAT THE DRAW ACTUALLY REACHES, PER DOMAIN (ruled PROMPT-133 s5.2) ============
 *
 * "20 of 20 forms filled" says a form can be built; it does not say how much of the pool the forms
 * reach. A domain whose quota is 10 and whose pool is 10 fills every form with THE SAME TEN ITEMS,
 * which is a pool that passes the gate and teaches the bank. So the distinct items each domain
 * contributes per form are counted across the 20 draws, and the MINIMUM and MEDIAN reported --
 * the minimum because one bad form is the one a candidate sits. */
const perDomainDraw = new Map();   /* lang -> domain code -> [distinct per form] */
const reached = new Map();         /* lang -> domain code -> Set of every id the 20 forms touched */
for (const l of LANGS) {
  const shortByDomain = new Map();
  const drawn = new Map();
  let filled = 0, minSel = Infinity, cands = 0;
  for (let i = 0; i < FORMS; i++) {
    const r = assemble(l, all);
    cands = r.candidates;
    minSel = Math.min(minSel, r.selected.length);
    if (r.selected.length === TARGETN && !r.shortfalls.length) filled++;
    for (const s of r.shortfalls) shortByDomain.set(s.code, (shortByDomain.get(s.code) || 0) + 1);
    const byDom = new Map();
    for (const q of r.selected) {
      const d = domains.find((x) => x.id === q.domain_id);
      const code = d ? d.code : "(no domain)";
      if (!byDom.has(code)) byDom.set(code, new Set());
      byDom.get(code).add(q.id);
    }
    for (const [code, ids] of byDom) {
      if (!drawn.has(code)) drawn.set(code, []);
      drawn.get(code).push(ids.size);
      /* THE UNION ACROSS ALL 20 FORMS. Headroom says the pool is big; this says whether the selector
       * REACHES it. Six distinct items in every form can still be the same six items twenty times. */
      if (!reached.has(l)) reached.set(l, new Map());
      if (!reached.get(l).has(code)) reached.get(l).set(code, new Set());
      for (const id of ids) reached.get(l).get(code).add(id);
    }
  }
  perDomainDraw.set(l, drawn);
  const ok = filled === FORMS;
  if (!ok) gateFail++;
  console.log("   " + l.padEnd(7) + " candidates " + String(cands).padStart(4) + "   forms filled " +
    filled + "/" + FORMS + "   smallest form " + minSel + "   " + (ok ? "ok" : "SHORT") +
    (shortByDomain.size ? "   short by domain " + JSON.stringify(Object.fromEntries(shortByDomain)) : ""));
}

/* ---- COVERAGE: the pool against the blueprint, and what the 20 draws reached ---- */
console.log("");
console.log("4b. COVERAGE AGAINST THE EXAM BLUEPRINT   (pool = the dry-run target pool)");
{
  const poolRows = candidatesFor(LANGS[0], all);
  const countByDomain = new Map();
  for (const q of poolRows) {
    const d = domains.find((x) => x.id === q.domain_id);
    const code = d ? d.code : "(no domain)";
    countByDomain.set(code, (countByDomain.get(code) || 0) + 1);
  }
  const alloc = allocateByWeight(domains, TARGETN);
  const med = (xs) => {
    if (!xs || !xs.length) return null;
    const s = [...xs].sort((a, b) => a - b);
    return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  };
  console.log("   domain  weight%  per-form quota   pool items   draw distinct: min / median   headroom");
  for (const d of domains) {
    const pool = countByDomain.get(d.code) || 0;
    const quota = alloc.get(d.id) ?? 0;
    const xs = (perDomainDraw.get(LANGS[0]) || new Map()).get(d.code) || [];
    const mn = xs.length ? Math.min(...xs) : null;
    console.log("   " + String(d.code).padEnd(8) + String(d.weight_pct).padStart(6) +
      String(quota).padStart(15) + String(pool).padStart(13) + "        " +
      String(mn == null ? "-" : mn).padStart(3) + " / " + String(med(xs) ?? "-").padStart(6) +
      "      " + (quota ? (pool - quota) + " spare" : "no quota") +
      "   reached " + ((reached.get(LANGS[0]) || new Map()).get(d.code) || new Set()).size + " of " + pool);
  }
  /* A DOMAIN WHOSE POOL EQUALS ITS QUOTA REUSES EVERY ITEM ON EVERY FORM. Named, not averaged away. */
  const tight = domains.filter((d) => {
    const quota = alloc.get(d.id) ?? 0;
    return quota > 0 && (countByDomain.get(d.code) || 0) <= quota;
  });
  console.log("   domains whose pool is NOT larger than their per-form quota (every form reuses the" +
    " same items): " + (tight.length ? tight.map((d) => d.code).join(", ") : "none"));
  /* and the same numbers for the other two languages, because "counts agree" is a claim to check */
  for (const l of LANGS.slice(1)) {
    const drawn = perDomainDraw.get(l) || new Map();
    const same = domains.every((d) => {
      const a = (perDomainDraw.get(LANGS[0]) || new Map()).get(d.code) || [];
      const b = drawn.get(d.code) || [];
      return a.length === b.length;
    });
    console.log("   " + l + ": draws every domain the same number of times as " + LANGS[0] + ": " +
      (same ? "yes" : "NO"));
  }
}
if (gateFail || dupProblem) {
  console.error("");
  console.error("STOPPING. " + (gateFail ? gateFail + " language(s) could not fill every form. " : "") +
    (dupProblem ? dupProblem + " duplicate identity/ies survive. " : "") + "Nothing written.");
  process.exit(1);
}

/* ============ the checksum over every row the batch may NOT touch ============ */
const retireIds = new Set(retire.map((x) => x.r.id));
/* JSON PER ROW rather than a delimiter. The first version joined the fields with literal 0x01/0x02
 * bytes: the checksum worked perfectly, so nothing but invariant 10 could see them. JSON escaping is
 * unambiguous without needing a separator byte that cannot occur in the data. */
const canon = (rows) => createHash("sha256").update(rows.filter((r) => !retireIds.has(r.id))
  .map((r) => JSON.stringify([r.id, r.status, r.pool, r.visibility, r.is_exam_scope, r.retired_at,
    r.question_text, r.options, r.correct_answer]))
  .sort().join(String.fromCharCode(10))).digest("hex");
const practiceBefore = Object.fromEntries(LANGS.map((l) => [l,
  all.filter((r) => r.language === l && r.pool === "practice" && r.status === "approved" && r.retired_at === null).length]));
const sumBefore = canon(all);
console.log("");
console.log("   checksum over the " + (all.length - retireIds.size) + " row(s) this batch may NOT touch: " + sumBefore.slice(0, 16));
/* the label follows --cert: it read "AIMS-F practice approved" during an ISMS-F dry run. */
console.log("   " + CERT + " practice approved, before: " + JSON.stringify(practiceBefore));

if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing written. " + retireIds.size + " row(s) would be retired. Re-run with --apply.");
  process.exit(0);
}

/* ============ 5. WRITE ============ */
if (existsSync(RETIRED_FILE)) {
  console.error("REFUSING: " + RETIRED_FILE + " already exists. A second cutover would overwrite the");
  console.error("rollback list for the first one. Move it aside deliberately.");
  process.exit(2);
}
const STAMP = new Date().toISOString();
writeFileSync(RETIRED_FILE, JSON.stringify({
  cert: CERT, ruled_in: "PROMPT-107 s3", retired_at: STAMP,
  rollback: "node --dns-result-order=ipv4first scripts/rollback-cutover.mjs --apply",
  count: retireIds.size,
  ids: retire.map((x) => ({ id: x.r.id, language: x.r.language, why: x.why })),
}, null, 2) + "\n");
console.log("   wrote " + RETIRED_FILE + " (" + retireIds.size + " id(s)) BEFORE the write");

let wrote = 0;
for (const x of retire) {
  const r = await fetch(REST_URL + "/quiz_questions?id=eq." + x.r.id, { method: "PATCH", headers: H,
    body: JSON.stringify({ retired_at: STAMP, status: x.r.status, visibility: x.r.visibility,
      is_exam_scope: x.r.is_exam_scope }) });
  if (!r.ok) { console.error("   PATCH FAILED " + String(x.r.id).slice(0, 8) + "  " + (await r.text()).slice(0, 140)); continue; }
  wrote++;
}

/* ============ 6. POST-CHECKS ============ */
all = await fetchAll();
const sumAfter = canon(all);
const practiceAfter = Object.fromEntries(LANGS.map((l) => [l,
  all.filter((r) => r.language === l && r.pool === "practice" && r.status === "approved" && r.retired_at === null).length]));
console.log("");
console.log("6. POST-CHECKS");
console.log("   retired " + wrote + " of " + retireIds.size);
let bad = 0;
for (const x of retire) {
  const now = all.find((r) => r.id === x.r.id);
  if (!now || now.retired_at === null) { console.error("   NOT RETIRED: " + String(x.r.id).slice(0, 8)); bad++; }
}
const straySum = sumBefore === sumAfter;
console.log("   untouched-row checksum   " + (straySum ? "UNCHANGED " + sumAfter.slice(0, 16)
  : "CHANGED -- before " + sumBefore.slice(0, 16) + " after " + sumAfter.slice(0, 16)));
console.log("   practice approved after  " + JSON.stringify(practiceAfter) +
  "   " + (JSON.stringify(practiceBefore) === JSON.stringify(practiceAfter) ? "UNCHANGED" : "CHANGED"));
for (const l of LANGS) {
  console.log("   final exam pool, " + l.padEnd(7) + " " + all.filter((r) => inLivePool(r, l)).length);
}
let gateFail2 = 0;
for (const l of LANGS) {
  let filled = 0;
  for (let i = 0; i < FORMS; i++) {
    const r = assemble(l, all);
    if (r.selected.length === TARGETN && !r.shortfalls.length) filled++;
  }
  if (filled !== FORMS) gateFail2++;
  console.log("   post-write assembly, " + l.padEnd(7) + " " + filled + "/" + FORMS);
}
console.log("");
/* ============ THE PRINTED ROLLBACK MUST NAME ITS FILE (fixed PROMPT-134 s1) ============
 *
 * It printed `rollback-cutover.mjs --apply` with no `--file`, and that script's default is
 * AIMSF-CUTOVER-RETIRED.json. Run after the ISMS-IA cutover, the command as printed resolved to
 * AIMS-F's 356 recorded ids and would have UN-RETIRED A DIFFERENT CERTIFICATION'S CUTOVER -- while
 * the line underneath it said it reads the ISMS-IA file. The message and the command disagreed, and
 * the message was the true one.
 *
 * Same defect class as the hard-coded keep list and rollback filename this script already carries a
 * comment about (PROMPT-120 s4.2): a `--cert` script with an AIMS-F default somewhere in it. Found
 * by RUNNING the printed command rather than reading it. */
console.log("ROLLBACK (one command):");
console.log("   node --dns-result-order=ipv4first scripts/rollback-cutover.mjs --file=" +
  RETIRED_FILE.split(/[\\/]/).pop() + " --apply");
console.log("   reads " + RETIRED_FILE + " and sets retired_at = null on exactly those " + retireIds.size + " id(s).");
console.log("   THE --file FLAG IS NOT OPTIONAL: rollback-cutover defaults to AIMS-F's file.");
if (bad || !straySum || gateFail2 || wrote !== retireIds.size ||
  JSON.stringify(practiceBefore) !== JSON.stringify(practiceAfter)) process.exitCode = 2;
