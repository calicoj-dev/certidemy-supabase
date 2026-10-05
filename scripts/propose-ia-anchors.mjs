#!/usr/bin/env node
/**
 * propose-ia-anchors.mjs -- for every INTERNAL AUDITOR task with no key-anchorable primary or too few,
 * list candidate passages ranked by subject overlap with the task statement.
 *
 * READ-ONLY. No model call, no write, no mapping. It PROPOSES; the director rules. Ruled PROMPT-134 s4.
 *
 * THE CANDIDATE TEST IS THE TIER RULE ITSELF -- `keyMayAnchor` from lib/tier-anchoring.mjs, the same
 * function the gate and the writer prompt consult. A proposal scored by a second definition of
 * "key-anchorable" would offer clauses the gate then refuses, which is the defect this repository
 * keeps paying for.
 *
 * RANKED BY SUBJECT, NOT BY SCORE ALONE. The overlap is a sort order for a human to read, never a
 * threshold: PROMPT-129 measured key-word overlap against the director's own calls and it ranged 8%
 * to 57%, which is no threshold at all. The number is printed so it can be disbelieved.
 *
 *   --cert=<CODE>   required
 *   --min=<n>       propose for tasks under this many effective primaries (default MIN_EFFECTIVE 3)
 *   --top=<n>       candidates per task (default 6)
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { tierOf, keyMayAnchor, TIERS } from "./lib/tier-anchoring.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let CERT = null, MIN = 3, TOP = 6;
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--cert=(.+)$/.exec(a))) { CERT = m[1]; continue; }
  if ((m = /^--min=(\d+)$/.exec(a))) { MIN = Number(m[1]); continue; }
  if ((m = /^--top=(\d+)$/.exec(a))) { TOP = Number(m[1]); continue; }
  console.error("unrecognised flag: " + a + ". Known: --cert=<CODE>, --min=<n>, --top=<n>. READ-ONLY.");
  process.exit(2);
}
if (!CERT) { console.error("--cert is required"); process.exit(2); }
const TIER = tierOf(CERT);
if (TIER !== TIERS.INTERNAL_AUDITOR) {
  console.error("REFUSING: " + CERT + " resolves to tier '" + TIER + "'. This proposer encodes the " +
    "INTERNAL AUDITOR rule and would rank the wrong sources for any other tier.");
  process.exit(2);
}

const KEY = requireKey(HERE);
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
const tasks = (await getAll(KEY, "tasks?select=id,code,statement,domain_id,certification_id&order=code"))
  .filter((t) => t.certification_id === cert.id);
/* task_sources holds (task_id, passage_id, role) and joins to source_passages by id -- it carries no
 * clause of its own. Ordered by (task_id, passage_id) because task_id alone is NOT UNIQUE and an
 * unordered page can return one row twice while the count still matches (gen-grounded-items:640). */
const ts = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id,passage_id");
const passageById = new Map((await getAll(KEY,
  "source_passages?select=id,source_id,edition,clause&order=id")).map((r) => [r.id, r]));
const byTask = new Map();
for (const r of ts) {
  const p = passageById.get(r.passage_id);
  if (!p) continue;
  if (!byTask.has(r.task_id)) byTask.set(r.task_id, []);
  byTask.get(r.task_id).push({ task_id: r.task_id, link_type: r.role,
    source_id: p.source_id, edition: p.edition, clause: p.clause });
}
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const held = lib.passages;

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const STOP = new Set(("the a an and or of to for in on with by is are be as at from that this it its " +
  "which who whom shall should may can will would must not no any all each other than then").split(" "));
const words = (s) => [...new Set(norm(s).split(" "))].filter((w) => w.length > 3 && !STOP.has(w));

/* the primaries a KEY MAY ACTUALLY REST ON, by the tier rule -- not merely the link_type */
const keyable = (t) => {
  const rows = (byTask.get(t.id) || []).filter((r) => r.link_type === "primary");
  const prim = rows.map((r) => r.clause);
  let n = 0;
  for (const r of rows) {
    const p = held.find((x) => x.source_id === r.source_id && String(x.edition) === String(r.edition) &&
      x.clause === r.clause);
    if (!p) continue;
    const v = keyMayAnchor({ source_id: r.source_id, edition: r.edition, clause: r.clause,
      normative: p.normative }, { tier: TIER, primaryClauses: prim, cert: CERT });
    if (v.ok) n++;
  }
  return n;
};

console.log("IA ANCHOR PROPOSALS   " + CERT + "   tier " + TIER + "   READ-ONLY, nothing is mapped");
console.log("  a key may rest on: 42001/27001 `shall`, or ISO 19011 on an audit-practice task.");
console.log("  42001 Annex B and the 27000 family are SUPPORT ONLY on this tier and are not proposed.");
console.log("");

const thin = tasks.filter((t) => keyable(t) < MIN);
console.log(thin.length + " task(s) under " + MIN + " key-anchorable primaries\n");
for (const t of thin) {
  const have = new Set((byTask.get(t.id) || []).map((r) => r.source_id + "|" + r.edition + "|" + r.clause));
  const w = new Set(words(t.statement || t.code));
  const scored = [];
  for (const p of held) {
    if (have.has(p.source_id + "|" + p.edition + "|" + p.clause)) continue;
    const v = keyMayAnchor({ source_id: p.source_id, edition: p.edition, clause: p.clause,
      normative: p.normative }, { tier: TIER, primaryClauses: [p.clause], cert: CERT });
    if (!v.ok) continue;                      /* only clauses a KEY could actually rest on */
    const pw = words((p.title || "") + " " + (p.text || ""));
    const hit = pw.filter((x) => w.has(x)).length;
    if (!hit) continue;
    scored.push({ p, score: hit / Math.max(1, w.size) });
  }
  scored.sort((a, b) => b.score - a.score);
  console.log("  " + t.code + "  keyable now " + keyable(t) +
    "   \"" + String(t.statement || "").slice(0, 86) + "\"");
  if (!scored.length) { console.log("      NO CANDIDATE a key could rest on. A MAP question for the director."); continue; }
  for (const s of scored.slice(0, TOP)) {
    console.log("      " + (s.p.source_id + ":" + s.p.edition + " " + s.p.clause).padEnd(30) +
      " [" + s.p.normative + "]  " + String(s.p.title || "").slice(0, 44).padEnd(44) +
      "  subject " + (s.score * 100).toFixed(0) + "%");
  }
}
console.log("");
console.log("SUBJECT % IS A SORT ORDER, NOT A THRESHOLD. PROMPT-129 measured key-word overlap against");
console.log("the director's own duplicate calls at 8% to 57%: it ranks, it never decides.");
