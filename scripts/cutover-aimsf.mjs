#!/usr/bin/env node
/**
 * PROMPT-107 s3: the AIMS-F cutover. WRITES with `--apply`; dry by default. Unknown flags exit 2.
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

let APPLY = false, CERT = "AIMS-F", FORMS = 20;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  const m = a.match(/^--(cert|forms)=(.+)$/);
  if (m) { if (m[1] === "cert") CERT = m[2]; else FORMS = Number(m[2]); continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=<CODE>, --forms=<n>, --apply (dry by default).");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const LANGS = ["en", "es-419", "pt-BR"];
const RETIRED_FILE = join(ROOT, "AIMSF-CUTOVER-RETIRED.json");

for (const [label, c] of [["enemy-rule", enemyRuleControls()], ["stem-identity", stemIdentityControls()]]) {
  const fails = c.fails || (c.cases || []).filter((x) => !x.pass);
  if (fails.length) { console.error("REFUSING: " + label + " controls fail"); process.exit(2); }
  console.log(label + " controls: " + (c.examined ?? (c.cases || []).length) + " case(s), all pass");
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
const inLivePool = (r, l) => r.language === l && r.pool === "secure" && r.status === "approved" &&
  r.retired_at === null && r.item_origin !== null && r.item_origin !== undefined &&
  r.item_origin !== "generated" && r.is_exam_scope === true;

/* ============ 1. THE KEPT SET, from the record ============ */
const surv = JSON.parse(readFileSync(join(ROOT, "AIMSF-SURVIVORS.json"), "utf8"));
const KEEP_IDS = surv.keep_ids || [];
console.log("");
console.log("1. KEPT SET   AIMSF-SURVIVORS.json keep_ids = " + KEEP_IDS.length + " id(s)");
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
  ig.get(r.id).review_verdict === "accept" && r.status === "approved" && r.retired_at === null)
  .map((r) => r.id));
console.log("");
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
for (const l of LANGS) {
  const shortByDomain = new Map();
  let filled = 0, minSel = Infinity, cands = 0;
  for (let i = 0; i < FORMS; i++) {
    const r = assemble(l, all);
    cands = r.candidates;
    minSel = Math.min(minSel, r.selected.length);
    if (r.selected.length === TARGETN && !r.shortfalls.length) filled++;
    for (const s of r.shortfalls) shortByDomain.set(s.code, (shortByDomain.get(s.code) || 0) + 1);
  }
  const ok = filled === FORMS;
  if (!ok) gateFail++;
  console.log("   " + l.padEnd(7) + " candidates " + String(cands).padStart(4) + "   forms filled " +
    filled + "/" + FORMS + "   smallest form " + minSel + "   " + (ok ? "ok" : "SHORT") +
    (shortByDomain.size ? "   short by domain " + JSON.stringify(Object.fromEntries(shortByDomain)) : ""));
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
console.log("   AIMS-F practice approved, before: " + JSON.stringify(practiceBefore));

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
console.log("ROLLBACK (one command):");
console.log("   node --dns-result-order=ipv4first scripts/rollback-cutover.mjs --apply");
console.log("   reads " + RETIRED_FILE + " and sets retired_at = null on exactly those " + retireIds.size + " id(s).");
if (bad || !straySum || gateFail2 || wrote !== retireIds.size ||
  JSON.stringify(practiceBefore) !== JSON.stringify(practiceAfter)) process.exitCode = 2;
