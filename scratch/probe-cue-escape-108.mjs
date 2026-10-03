#!/usr/bin/env node
/**
 * READ-ONLY. verify-cert's OWN escape definition (verify-cert.mjs:676-683), computed over the live
 * English pool and over the reconstructed pre-cutover English pool.
 *
 * The question is narrow and matters: the bar is escapes/English-pool > 2.0%. The cutover shrank the
 * English pool from 478 to 363, so an unchanged set of escaping items would read as a HIGHER rate.
 * That would mean the cutover flipped a conformance gate by removing clean items.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "../scripts/_pg.mjs";
import { cueConfigFor } from "../functions/_shared/item-rules/item-cue-guard.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KEY = requireKey(join(HERE, "..", "scripts"));
const rec = JSON.parse(readFileSync(join(ROOT, "AIMSF-CUTOVER-RETIRED.json"), "utf8"));
const retired = new Set(rec.ids.map((x) => x.id));

const cert = (await getAll(KEY, "certifications?select=id,exam_blueprint&code=eq.AIMS-F"))[0];
const cfg = cueConfigFor(cert.exam_blueprint);
const all = await getAll(KEY, "quiz_questions?select=id,language,status,pool,is_exam_scope,retired_at," +
  "item_origin,options,correct_answer&certification_id=eq." + cert.id + "&order=id");

const base = (r) => r.language === "en" && r.pool === "secure" && r.status === "approved" &&
  r.item_origin !== "generated" && r.is_exam_scope === true;
const livePool = all.filter((r) => base(r) && r.retired_at === null);
const prePool = all.filter((r) => base(r) && (r.retired_at === null || retired.has(r.id)));

/* verbatim from verify-cert.mjs:676-683 */
const escapesIn = (rows) => {
  const hits = [];
  for (const q of rows) {
    const keyId = Array.isArray(q.correct_answer) ? q.correct_answer[0] : q.correct_answer;
    const keyLen = (q.options.find((o) => o.id === keyId)?.text || "").length;
    const maxRival = Math.max(0, ...q.options.filter((o) => o.id !== keyId).map((o) => (o.text || "").length));
    if (keyLen <= maxRival || !maxRival) continue;
    const allowed = Math.max(cfg.KEY_LEN_MARGIN, Math.round((cfg.KEY_LEN_PCT / 100) * maxRival));
    if (keyLen - maxRival > allowed) hits.push({ id: q.id, origin: q.item_origin, over: keyLen - maxRival, allowed });
  }
  return hits;
};
const show = (label, rows) => {
  const e = escapesIn(rows);
  const rate = 100 * e.length / Math.max(1, rows.length);
  console.log("  " + label.padEnd(16) + "pool " + String(rows.length).padStart(4) +
    "   escapes " + String(e.length).padStart(3) + "   rate " + rate.toFixed(1) + "%   " +
    (rate > 2.0 ? "FAILS the >2.0% bar" : "passes"));
  return e;
};
console.log("CUE-GUARD ESCAPES   tolerance " + cfg.KEY_LEN_MARGIN + "ch/" + cfg.KEY_LEN_PCT +
  "% from " + cfg.source + "   bar: escapes/pool > 2.0% FAILS");
const liveE = show("live (after)", livePool);
const preE = show("pre-cutover", prePool);
/* THE TRUE BASELINE: before PROMPT-107 the grounded 200 were not servable at all (item_origin was
 * 'generated'), so the pool that last passed this gate had neither the retirements nor the grounded
 * items. Reporting only "pre-cutover" would compare against a pool that never existed. */
const origPool = all.filter((r) => base(r) && (r.retired_at === null || retired.has(r.id)) &&
  r.item_origin !== "grounded");
show("pre-PROMPT-107", origPool);

console.log("");
const byOrigin = {};
for (const e of liveE) byOrigin[e.origin] = (byOrigin[e.origin] || 0) + 1;
console.log("  live escapes by origin      " + JSON.stringify(byOrigin));
const retiredEscapes = preE.filter((e) => retired.has(e.id)).length;
console.log("  escapes the cutover removed " + retiredEscapes);
console.log("  escapes that remain         " + liveE.length);
console.log("");
console.log("  worst live escapes (over allowance, chars):");
for (const e of liveE.sort((x, y) => y.over - x.over)) {
  console.log("    " + e.id.slice(0, 8) + "  " + String(e.origin).padEnd(11) + " over by " + e.over +
    " (allowed " + e.allowed + ")");
}
