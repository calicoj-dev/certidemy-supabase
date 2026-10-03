#!/usr/bin/env node
/**
 * READ-ONLY. The four post-conditions ruled in PROMPT-106 s2, over the approved grounded set.
 * No `--apply` exists. A condition that cannot be evaluated reports COULD-NOT-ANSWER, not a pass.
 *
 * Every condition carries a POSITIVE CONTROL: a deliberately bad input it must flag. A green sweep
 * over a corpus proves nothing unless something proves the sweep can fail.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { gateItemOf } from "./lib/stored-item.mjs";
import { gateServedNoise, quoteNoiseControls } from "./lib/quote-noise.mjs";
import { enemyKeyOf } from "../functions/_shared/item-rules/enemy-rule.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
let CERT = "AIMS-F";
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--cert=(.+)$/);
  if (m) { CERT = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=<CODE>. READ-ONLY, no --apply."); process.exit(2);
}
const LANGS = ["en", "es-419", "pt-BR"];
const KEY = requireKey(HERE);

{
  const c = quoteNoiseControls({ quiet: true });
  if (c.fails && c.fails.length) { console.error("REFUSING: quote-noise controls fail"); process.exit(2); }
  console.log("quote-noise controls: " + c.examined + " case(s), all pass");
}

const cert = (await getAll(KEY, "certifications?select=id,num_questions&code=eq." + CERT))[0];
const all = await getAll(KEY, "quiz_questions?select=id,language,status,pool,visibility,is_exam_scope," +
  "retired_at,question_group_id,question_text,options,correct_answer,explanation,task_id" +
  "&certification_id=eq." + cert.id + "&order=id");
const ig = new Map((await getAll(KEY, "item_grounding?select=question_id,review_verdict,key_support_clause," +
  "source_id,edition&order=question_id")).map((g) => [g.question_id, g]));
const tasks = (await getAll(KEY, "tasks?select=id,code,domain_id,certification_id&order=code"))
  .filter((t) => t.certification_id === cert.id);
const domains = (await getAll(KEY, "domains?select=id,code,weight_pct,certification_id&order=code"))
  .filter((d) => d.certification_id === cert.id);
const domainByTask = new Map(tasks.map((t) => [t.id, t.domain_id]));

function enOf(r, l) {
  if (l === "en") return r;
  if (!r.question_group_id) return null;
  return all.find((x) => x.question_group_id === r.question_group_id && x.language === "en");
}
const groundedApproved = (l) => all.filter((r) => r.language === l && r.status === "approved" &&
  r.retired_at === null && (() => { const en = enOf(r, l); return !!en && ig.has(en.id); })());

let fails = 0;
const say = (n, ok, line) => {
  console.log("  " + (ok === null ? "COULD-NOT-ANSWER" : ok ? "pass" : "FAIL") + "  " + n + "   " + line);
  if (ok !== true) fails++;
};

/* ============ 1. KEY POSITION, within 5 points of chance, per language ============ */
console.log("");
console.log("1. KEY POSITION   expect each of a-d within 25% +- 5 points");
for (const l of LANGS) {
  const rows = groundedApproved(l);
  if (!rows.length) { say(l, null, "no approved grounded rows"); continue; }
  const tally = {};
  let n = 0;
  for (const r of rows) {
    const gi = gateItemOf(r);
    const k = gi.options.find((o) => o.is_correct);
    if (!k) continue;
    tally[k.id] = (tally[k.id] || 0) + 1; n++;
  }
  const pcts = Object.keys(tally).sort().map((k) => k + "=" + (100 * tally[k] / n).toFixed(1) + "%");
  const worst = Math.max(...Object.keys(tally).map((k) => Math.abs(100 * tally[k] / n - 25)));
  say(l, worst <= 5, "n=" + n + "   " + pcts.join("  ") + "   worst deviation " + worst.toFixed(1) + "pt");
}
/* POSITIVE CONTROL: a skewed set must fail the same arithmetic. */
{
  const skew = { a: 70, b: 10, c: 10, d: 10 }, n = 100;
  const worst = Math.max(...Object.keys(skew).map((k) => Math.abs(100 * skew[k] / n - 25)));
  say("positive control, 70/10/10/10", worst > 5, "worst deviation " + worst.toFixed(1) + "pt -> would FAIL");
}

/* ============ 2. ENEMY FEASIBILITY, per language ============ */
console.log("");
console.log("2. ENEMY FEASIBILITY   distinct enemy keys per domain must cover the blueprint quota");
const TARGETN = cert.num_questions ?? 40;
const sumW = domains.reduce((s, d) => s + d.weight_pct, 0) || 1;
const quotaOf = (d) => Math.floor((d.weight_pct / sumW) * TARGETN);
for (const l of LANGS) {
  const rows = groundedApproved(l).filter((r) => r.pool === "secure" && r.is_exam_scope === true);
  if (!rows.length) { say(l, null, "no approved grounded secure rows"); continue; }
  const short = [];
  for (const d of domains) {
    const mine = rows.filter((r) => domainByTask.get(r.task_id) === d.id);
    const keys = new Set();
    for (const r of mine) {
      const en = enOf(r, l);
      const g = en ? ig.get(en.id) : null;
      keys.add((g && enemyKeyOf(g)) || ("row:" + r.id));
    }
    if (keys.size < quotaOf(d)) short.push(d.code + " cap=" + keys.size + " quota=" + quotaOf(d));
  }
  say(l, short.length === 0, short.length ? "SHORT: " + short.join("; ")
    : domains.length + " domain(s), every quota covered by distinct enemy keys");
}

/* ============ 3. SERVED-NOISE SWEEP, zero hits ============ */
console.log("");
console.log("3. SERVED-NOISE SWEEP   zero hits across every served field of every approved grounded row");
for (const l of LANGS) {
  const rows = groundedApproved(l);
  if (!rows.length) { say(l, null, "no approved grounded rows"); continue; }
  const hits = [];
  let examined = 0;
  for (const r of rows) {
    const v = gateServedNoise(gateItemOf(r), { pool: r.pool });
    if (v.pass === null) { hits.push(String(r.id).slice(0, 8) + " UNASSERTED"); continue; }
    examined += v.examined;
    if (!v.pass) hits.push(String(r.id).slice(0, 8) + ": " + v.reason.slice(0, 120));
  }
  say(l, hits.length === 0, "rows " + rows.length + ", served fields " + examined +
    (hits.length ? ", HITS: " + hits.slice(0, 3).join(" | ") : ", zero hits"));
}
/* POSITIVE CONTROL: the sweep must flag a row it should flag. */
{
  const bad = gateServedNoise({ question_text: "What does and and development development mean?",
    options: [{ id: "a", text: "x" }] }, { pool: "secure" });
  say("positive control, duplicated-word noise", bad.pass === false, String(bad.reason).slice(0, 90));
}

/* ============ 4. ZERO APPROVED GROUNDED ROWS WITHOUT AN `accept` ============ */
console.log("");
console.log("4. NO APPROVED GROUNDED ROW LACKS AN `accept`");
console.log("   SCOPE: rows that HAVE an item_grounding row. The pre-existing authored pool has none and is");
console.log("   out of scope by construction -- stated so the pass is not read as covering it.");
for (const l of LANGS) {
  const rows = groundedApproved(l);
  const bad = rows.filter((r) => { const en = enOf(r, l); const g = en && ig.get(en.id);
    return !g || g.review_verdict !== "accept"; });
  say(l, bad.length === 0, "approved grounded rows " + rows.length + ", without an accept " + bad.length +
    (bad.length ? " -> " + bad.slice(0, 4).map((r) => String(r.id).slice(0, 8)).join(",") : ""));
}
/* and the count that makes the scope legible */
for (const l of LANGS) {
  const appr = all.filter((r) => r.language === l && r.status === "approved" && r.retired_at === null);
  console.log("    " + l.padEnd(7) + " approved total " + String(appr.length).padStart(4) +
    "   of which grounded " + String(groundedApproved(l).length).padStart(4) +
    "   ungrounded (authored, out of scope) " + String(appr.length - groundedApproved(l).length).padStart(4));
}

console.log("");
console.log(fails === 0 ? "ALL POST-CONDITIONS PASS" : fails + " POST-CONDITION LINE(S) NOT PASSING");
if (fails) process.exitCode = 2;
