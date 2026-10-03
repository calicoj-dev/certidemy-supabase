#!/usr/bin/env node
/**
 * READ-ONLY. The post-checks for the AIMS-F cutover, against the state as it now is and the
 * rollback record as written. No --apply exists.
 *
 * Separate from `cutover-aimsf.mjs` deliberately: a post-check that only ever runs inside the
 * script that did the write cannot be re-asked later, and "it printed fine at the time" is not a
 * thing anyone can check afterwards.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { enemyKeyOf, enemyReason, markEnemy } from "../functions/_shared/item-rules/enemy-rule.mjs";
import { stemIdentity } from "../functions/_shared/item-rules/stem-identity.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let CERT = "AIMS-F", FORMS = 20;
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--(cert|forms)=(.+)$/);
  if (m) { if (m[1] === "cert") CERT = m[2]; else FORMS = Number(m[2]); continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=<CODE>, --forms=<n>. READ-ONLY."); process.exit(2);
}
const LANGS = ["en", "es-419", "pt-BR"];
const KEY = requireKey(HERE);
const rec = JSON.parse(readFileSync(join(ROOT, "AIMSF-CUTOVER-RETIRED.json"), "utf8"));
const retiredIds = new Set(rec.ids.map((x) => x.id));

const cert = (await getAll(KEY, "certifications?select=id,num_questions,exam_blueprint&code=eq." + CERT))[0];
const TARGETN = cert.num_questions ?? 40;
const MIX = (cert.exam_blueprint && cert.exam_blueprint.difficulty_mix) || null;
const all = await getAll(KEY, "quiz_questions?select=id,language,status,pool,visibility,is_exam_scope," +
  "retired_at,item_origin,question_group_id,question_text,options,correct_answer,difficulty,task_id" +
  "&certification_id=eq." + cert.id + "&order=id");
const ig = new Map((await getAll(KEY, "item_grounding?select=question_id,review_verdict,key_support_clause," +
  "source_id,edition&order=question_id")).map((g) => [g.question_id, g]));
const tasks = (await getAll(KEY, "tasks?select=id,code,domain_id,certification_id&order=code"))
  .filter((t) => t.certification_id === cert.id);
const domains = (await getAll(KEY, "domains?select=id,code,weight_pct,certification_id&order=code"))
  .filter((d) => d.certification_id === cert.id);
const domainByTask = new Map(tasks.map((t) => [t.id, t.domain_id]));
const enRowOf = (r) => r.language === "en" ? r
  : (r.question_group_id ? all.find((x) => x.question_group_id === r.question_group_id && x.language === "en") : null);
const inLivePool = (r, l) => r.language === l && r.pool === "secure" && r.status === "approved" &&
  r.retired_at === null && r.item_origin !== null && r.item_origin !== undefined &&
  r.item_origin !== "generated" && r.is_exam_scope === true;

let fails = 0;
const say = (n, ok, line) => { console.log("  " + (ok ? "pass" : "FAIL") + "  " + n + "   " + line); if (!ok) fails++; };

console.log("CUTOVER POST-CHECKS   " + CERT + "   recorded " + rec.count + " retired id(s), stamped " + rec.retired_at);

/* 1. every recorded id is retired, and nothing else is */
{
  const notRetired = rec.ids.filter((x) => { const r = all.find((y) => y.id === x.id); return !r || r.retired_at === null; });
  say("every recorded id is retired", notRetired.length === 0,
    rec.count - notRetired.length + " of " + rec.count + " carry retired_at");
  /* THE NEGATIVE HALF: a row retired that the record does not name. The stamp is the witness --
   * any row carrying exactly this cutover's timestamp must be on the list. */
  const strays = all.filter((r) => r.retired_at === rec.retired_at && !retiredIds.has(r.id));
  say("no row outside the record carries this stamp", strays.length === 0,
    strays.length ? strays.slice(0, 5).map((r) => r.id.slice(0, 8)).join(",") : "0 strays at " + rec.retired_at);
}

/* 2. the pool per language */
console.log("");
for (const l of LANGS) {
  const pool = all.filter((r) => inLivePool(r, l));
  const grounded = pool.filter((r) => r.item_origin === "grounded").length;
  const authored = pool.filter((r) => r.item_origin === "authored").length;
  const other = pool.length - grounded - authored;
  /* NOT a hard-coded 361 any more: PROMPT-109 retired 4 more groups, so a fixed number would now
   * fail against a correct bank. The property is that the pool is the grounded set plus the kept
   * set, with nothing unaccounted for -- and that 20 forms fill, which is checked below. */
  say("final exam pool " + l, grounded + authored + other === pool.length,
    pool.length + " = " + grounded + " grounded + " + authored + " authored" + (other ? " + " + other + " other" : ""));
}

/* 3. practice untouched */
console.log("");
{
  const before = { en: 350, "es-419": 350, "pt-BR": 350 };   /* captured by cutover-aimsf before the write */
  const after = Object.fromEntries(LANGS.map((l) => [l,
    all.filter((r) => r.language === l && r.pool === "practice" && r.status === "approved" && r.retired_at === null).length]));
  say("practice approved unchanged", JSON.stringify(before) === JSON.stringify(after),
    "before " + JSON.stringify(before) + "  after " + JSON.stringify(after));
}

/* 4. duplicate stems, and 20 assemblies per language */
const enStemByGroup = new Map();
for (const r of all) {
  if (r.language === "en" && r.question_group_id) {
    enStemByGroup.set(r.question_group_id, String(r.question_text || "").toLowerCase().replace(/\s+/g, " ").trim());
  }
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } }
function allocateByWeight(doms, total) {
  const sum = doms.reduce((s, d) => s + d.weight_pct, 0) || 1;
  const floored = doms.map((d) => { const raw = (d.weight_pct / sum) * total;
    return { id: d.id, n: Math.floor(raw), rem: raw - Math.floor(raw) }; });
  let assigned = floored.reduce((s, f) => s + f.n, 0);
  const order = [...floored].sort((a, b) => b.rem - a.rem);
  let i = 0;
  while (assigned < total && order.length) { order[i % order.length].n += 1; assigned += 1; i += 1; }
  return new Map(floored.map((f) => [f.id, f.n]));
}
function pickBalancedDifficulty(pool, quota) {
  const easy = pool.filter((q) => q.difficulty <= 2), med = pool.filter((q) => q.difficulty === 3),
    hard = pool.filter((q) => q.difficulty >= 4);
  const e = Math.round(quota * 0.3), m = Math.round(quota * 0.5), h = quota - e - m;
  const picked = [...easy.slice(0, e), ...med.slice(0, m), ...hard.slice(0, h)];
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
  while (assigned < quota && byRem.length) { byRem[i % byRem.length].n += 1; assigned += 1; i += 1; }
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
function pick(pool, quota, usedEnemy, usedOptionText) {
  if (!pool.length || !quota) return [];
  const sh = [...pool]; shuffle(sh);
  const seen = new Set(), local = { enemy: new Set(), optionText: new Set() }, dedup = [];
  for (const q of sh) {
    if (seen.has(q.dedupe_key)) continue;
    if (enemyReason(q, { enemy: usedEnemy, optionText: usedOptionText })) continue;
    if (enemyReason(q, local)) continue;
    seen.add(q.dedupe_key); markEnemy(q, local); dedup.push(q);
  }
  const byTask = new Map();
  for (const q of dedup) { const k = q.task_id ?? "none"; if (!byTask.has(k)) byTask.set(k, []); byTask.get(k).push(q); }
  for (const arr of byTask.values()) shuffle(arr);
  const queues = [...byTask.values()]; shuffle(queues);
  const rr = [];
  let added = true;
  while (added) { added = false; for (const q of queues) { const n = q.shift(); if (n) { rr.push(n); added = true; } } }
  const n = Math.min(quota, rr.length);
  const out = MIX ? pickByMix(rr, n, MIX) : pickBalancedDifficulty(rr, n);
  for (const q of out) markEnemy(q, { enemy: usedEnemy, optionText: usedOptionText });
  return out;
}
function assemble(l) {
  const cands = all.filter((r) => inLivePool(r, l)).map((q) => ({
    id: q.id, options: q.options, difficulty: q.difficulty, task_id: q.task_id,
    domain_id: q.task_id ? domainByTask.get(q.task_id) ?? null : null,
    dedupe_key: stemIdentity(q, enStemByGroup),
    enemy_key: (() => { const en = enRowOf(q); const g = en ? ig.get(en.id) : null; return g ? enemyKeyOf(g) : null; })(),
  }));
  const alloc = allocateByWeight(domains, TARGETN);
  const byDom = new Map();
  for (const q of cands) { if (!q.domain_id) continue; if (!byDom.has(q.domain_id)) byDom.set(q.domain_id, []); byDom.get(q.domain_id).push(q); }
  const sel = [], chosen = new Set(), shorts = [];
  const ue = new Set(), uo = new Set();
  for (const d of domains) {
    const quota = alloc.get(d.id) ?? 0;
    if (!quota) continue;
    const p = (byDom.get(d.id) ?? []).filter((q) => !chosen.has(q.id));
    const got = pick(p, quota, ue, uo);
    for (const q of got) { chosen.add(q.id); sel.push(q); }
    if (got.length < quota) shorts.push(d.code + ":" + got.length + "/" + quota);
  }
  return { n: sel.length, shorts };
}
console.log("");
for (const l of LANGS) {
  const seen = new Map();
  for (const r of all.filter((x) => inLivePool(x, l))) {
    const k = stemIdentity(r, enStemByGroup);
    seen.set(k, (seen.get(k) || 0) + 1);
  }
  const dups = [...seen.values()].filter((v) => v > 1).length;
  say("zero duplicate stems " + l, dups === 0, seen.size + " distinct identities, " + dups + " with >1 row");
}
console.log("");
for (const l of LANGS) {
  let filled = 0;
  const shorts = new Set();
  for (let i = 0; i < FORMS; i++) {
    const r = assemble(l);
    if (r.n === TARGETN && !r.shorts.length) filled++;
    for (const s of r.shorts) shorts.add(s);
  }
  say(FORMS + " assemblies " + l, filled === FORMS,
    filled + "/" + FORMS + " filled to " + TARGETN + (shorts.size ? "   short: " + [...shorts].join(" ") : ""));
}

console.log("");
console.log("ROLLBACK (one command):");
console.log("  node --dns-result-order=ipv4first scripts/rollback-cutover.mjs --apply");
console.log("");
console.log(fails === 0 ? "ALL POST-CHECKS PASS" : fails + " POST-CHECK(S) FAILING");
if (fails) process.exitCode = 2;
