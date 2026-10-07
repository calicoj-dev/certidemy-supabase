/**
 * form-assembler.mjs -- THE exam-form selector, in one place.
 *
 * ============ WHY THIS MODULE EXISTS (ruled PROMPT-147 s1) ============
 *
 * These five functions lived inside `cutover-aimsf.mjs`, where they had performed four live
 * cutovers. PROMPT-147 needed the SAME gate -- enemy rule, stem dedupe, difficulty mix -- to decide
 * whether 65 retirements leave 20 of 20 forms assembling, and the cutover's own gate could not be
 * reused as it stood: the cutover's `retire` set is "live pool minus approved grounded minus kept",
 * which for a wholly authored certification like SM-AI-I is the entire pool.
 *
 * Copying the selector into a second script was the alternative, and that is exactly the duplicate
 * definition PROMPT-143's invariant exists to catch -- a second copy that agrees on the day it is
 * written and drifts afterwards. So the functions MOVED here verbatim and both callers import them.
 *
 * STILL TRANSCRIBED, NOT INVENTED: these are `generate-mock-exam`'s own selector --
 * allocateByWeight (:596), pickAcrossTasksBalanced (:619), pickBalancedDifficulty (:730),
 * pickByMix (:768). The enemy rule and the stem identity come from the shared item-rules modules
 * the edge function itself imports, so those halves are the real thing rather than a copy.
 *
 * THE SELECTOR IS STOCHASTIC. `shuffle` uses Math.random, so two runs do not pick the same form.
 * That is the function's own behaviour and is preserved: the gate asks whether a form CAN be built,
 * which is a question about feasibility, not reproducibility. A caller wanting a reproducible draw
 * must seed it itself.
 */
import { enemyReason, markEnemy } from "../../functions/_shared/item-rules/enemy-rule.mjs";

export function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } }

export function allocateByWeight(doms, total) {
  const sum = doms.reduce((s, d) => s + d.weight_pct, 0) || 1;
  const floored = doms.map((d) => { const raw = (d.weight_pct / sum) * total;
    return { id: d.id, n: Math.floor(raw), rem: raw - Math.floor(raw) }; });
  let assigned = floored.reduce((s, f) => s + f.n, 0);
  const order = [...floored].sort((a, b) => b.rem - a.rem);
  let i = 0;
  while (assigned < total && order.length > 0) { order[i % order.length].n += 1; assigned += 1; i += 1; }
  return new Map(floored.map((f) => [f.id, f.n]));
}

export function pickBalancedDifficulty(pool, quota) {
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

export function pickByMix(pool, quota, mix) {
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

export function pickAcrossTasksBalanced(pool, quota, mix, usedEnemy, usedOptionText) {
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

/**
 * One form. `candidates` are already shaped by the caller -- each needs
 * {id, options, difficulty, task_id, domain_id, dedupe_key, enemy_key} -- because WHICH rows are
 * candidates is the caller's question (the cutover excludes its retire set, the retirement planner
 * excludes its own) and HOW they are drawn is this module's.
 */
export function assembleForm({ candidates, domains, targetN, mix }) {
  const alloc = allocateByWeight(domains, targetN);
  const byDomain = new Map();
  for (const q of candidates) {
    if (!q.domain_id) continue;
    if (!byDomain.has(q.domain_id)) byDomain.set(q.domain_id, []);
    byDomain.get(q.domain_id).push(q);
  }
  const selected = [], chosen = new Set(), shortfalls = [];
  const usedEnemy = new Set(), usedOptionText = new Set();
  for (const d of domains) {
    const quota = alloc.get(d.id) ?? 0;
    if (!quota) continue;
    const poolForDomain = (byDomain.get(d.id) ?? []).filter((q) => !chosen.has(q.id));
    const picked = pickAcrossTasksBalanced(poolForDomain, quota, mix, usedEnemy, usedOptionText);
    for (const q of picked) { chosen.add(q.id); selected.push(q); }
    if (picked.length < quota) shortfalls.push({ code: d.code, need: quota, have: picked.length });
  }
  return { selected, shortfalls, candidates: candidates.length };
}

/** Controls. The allocation and the mix are deterministic and are checked; the draw is not. */
export function formAssemblerControls() {
  const cases = [];
  const add = (name, pass) => cases.push({ name, pass: !!pass });
  const doms = [{ id: "a", code: "D1", weight_pct: 50 }, { id: "b", code: "D2", weight_pct: 50 }];
  const alloc = allocateByWeight(doms, 40);
  add("an even split allocates evenly", alloc.get("a") === 20 && alloc.get("b") === 20);
  const odd = allocateByWeight([{ id: "a", code: "D1", weight_pct: 1 },
    { id: "b", code: "D2", weight_pct: 1 }, { id: "c", code: "D3", weight_pct: 1 }], 10);
  add("a remainder is distributed, and the total is exact",
    odd.get("a") + odd.get("b") + odd.get("c") === 10);
  add("zero weight everywhere still totals exactly",
    (() => { const m = allocateByWeight([{ id: "a", code: "D1", weight_pct: 0 }], 7);
      return m.get("a") === 7; })());

  const pool = Array.from({ length: 30 }, (_, i) => ({ id: "q" + i, difficulty: (i % 5) + 1,
    task_id: "t" + (i % 3), domain_id: "a", dedupe_key: "s" + i, enemy_key: null, options: [] }));
  add("pickByMix returns exactly the quota", pickByMix(pool, 10, { 2: 30, 3: 50, 4: 20 }).length === 10);
  add("pickByMix never repeats an item",
    new Set(pickByMix(pool, 10, { 2: 30, 3: 50, 4: 20 }).map((q) => q.id)).size === 10);
  add("pickBalancedDifficulty returns exactly the quota", pickBalancedDifficulty(pool, 12).length === 12);
  add("a quota larger than the pool returns the pool, not a throw",
    pickBalancedDifficulty(pool, 99).length === 30);
  add("an empty pool returns nothing rather than throwing", pickByMix([], 5, { 3: 100 }).length === 0);

  const form = assembleForm({ candidates: pool, domains: [{ id: "a", code: "D1", weight_pct: 100 }],
    targetN: 10, mix: { 2: 30, 3: 50, 4: 20 } });
  add("assembleForm fills its quota from a sufficient pool", form.selected.length === 10);
  add("...with no shortfall reported", form.shortfalls.length === 0);
  add("assembleForm never repeats an item within one form",
    new Set(form.selected.map((q) => q.id)).size === form.selected.length);
  /* STEM DEDUPE: two candidates sharing a dedupe_key must not both be drawn */
  const twins = [
    { id: "x1", difficulty: 3, task_id: "t", domain_id: "a", dedupe_key: "SAME", enemy_key: null, options: [] },
    { id: "x2", difficulty: 3, task_id: "t", domain_id: "a", dedupe_key: "SAME", enemy_key: null, options: [] },
  ];
  add("two candidates with the SAME stem identity yield at most one",
    assembleForm({ candidates: twins, domains: [{ id: "a", code: "D1", weight_pct: 100 }],
      targetN: 2, mix: null }).selected.length === 1);
  add("...and that shows as a shortfall rather than a silent short form",
    assembleForm({ candidates: twins, domains: [{ id: "a", code: "D1", weight_pct: 100 }],
      targetN: 2, mix: null }).shortfalls.length === 1);
  return { cases, examined: cases.length, allPass: cases.every((c) => c.pass) };
}
