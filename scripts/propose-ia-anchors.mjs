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

/* ============ A CONTAINER IS NOT A CANDIDATE (ruled PROMPT-136 s3) ============
 *
 * `ISO/IEC 42001:2023 3` ranked top on most thin tasks and is useless as an anchor: it is the WHOLE
 * terms-and-definitions section, 1,346 words concatenated, and it scores high precisely because it
 * contains every term the task statement uses. A key anchored there points at a section, not a rule.
 *
 * THE TEST IS STRUCTURAL, NOT A WORD COUNT. "Only a heading" would miss this one -- its text is long.
 * A clause is a CONTAINER when the library holds at least one clause beneath it in the same (source,
 * edition): `3` is a container because `3.1` is held. That is the same reading of the map CLAUDE.md
 * states -- "A.6's children are held, the heading has no row" -- applied to the case where the
 * heading DOES have a row.
 */
const childIndex = (() => {
  const kids = new Map();
  for (const p of held) {
    const k = p.source_id + "|" + p.edition;
    if (!kids.has(k)) kids.set(k, new Set());
    kids.get(k).add(String(p.clause));
  }
  return kids;
})();
function isContainerClause(p, index = childIndex) {
  const set = index.get(p.source_id + "|" + p.edition);
  if (!set) return false;
  const me = String(p.clause);
  for (const other of set) {
    if (other !== me && other.startsWith(me + ".")) return true;
  }
  return false;
}

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

/* ---- CONTROLS FIRST, both directions. A proposal list nobody checked is a list of guesses. ---- */
{
  const cs = [];
  const add = (what, pass, detail) => cs.push({ what, pass: !!pass, detail });
  const F = (source_id, edition, clause) => ({ source_id, edition, clause });
  add("42001:2023 `3` IS a container (3.1 is held)",
    isContainerClause(F("ISO/IEC 42001", "2023", "3")));
  add("42001:2023 `3.1` is NOT a container",
    isContainerClause(F("ISO/IEC 42001", "2023", "3.1")) === false);
  add("a leaf requirements clause is NOT a container",
    isContainerClause(F("ISO/IEC 42001", "2023", "9.2.2")) === false);
  /* THE PREFIX MUST BE DOTTED: `3` must not swallow `30`, nor `A.1` swallow `A.10`. */
  {
    const idx = new Map([["X|1", new Set(["3", "30", "A.1", "A.10"])]]);
    add("`3` is not a container merely because `30` is held",
      isContainerClause(F("X", "1", "3"), idx) === false);
    add("`A.1` is not a container merely because `A.10` is held",
      isContainerClause(F("X", "1", "A.1"), idx) === false);
    const idx2 = new Map([["X|1", new Set(["3", "3.1"])]]);
    add("...but `3` IS a container when `3.1` is held", isContainerClause(F("X", "1", "3"), idx2));
  }
  add("an unknown (source, edition) is not a container",
    isContainerClause(F("NOPE", "9999", "1")) === false);
  const bad = cs.filter((c) => !c.pass);
  console.log("container controls: " + cs.length + " case(s), " + bad.length + " fail");
  for (const b of bad) console.error("  FAIL " + b.what);
  if (bad.length) { console.error("REFUSING: the container test is wrong, so the proposals would be."); process.exit(2); }
}
let containersSkipped = 0;
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
    if (isContainerClause(p)) { containersSkipped++; continue; }
    const pw = words((p.title || "") + " " + (p.text || ""));
    const hit = pw.filter((x) => w.has(x)).length;
    if (!hit) continue;
    scored.push({ p, score: hit / Math.max(1, w.size) });
  }
  scored.sort((a, b) => b.score - a.score);
  console.log("");
  console.log("  " + t.code + "  keyable now " + keyable(t));
  console.log("      STATEMENT: " + String(t.statement || "(none)"));
  /* ============ AUDIT PRACTICE WITH NO 19011 PRIMARY, SAID OUT LOUD (PROMPT-136 s3) ============
   *
   * ISO 19011 may key only on a task that MAPS a 19011 primary. A task about audit practice that
   * maps none therefore gets no 19011 candidate at all -- and the list would silently look as though
   * 19011 had nothing to offer it. The 19011 candidates are shown SEPARATELY and labelled: they can
   * only key if the director maps a 19011 primary first. */
  const mapsPractice = (byTask.get(t.id) || [])
    .some((r) => r.link_type === "primary" && /^ISO\s*19011/i.test(r.source_id));
  const nineteen = [];
  if (!mapsPractice) {
    for (const p of held) {
      if (!/^ISO\s*19011/i.test(p.source_id)) continue;
      if (have.has(p.source_id + "|" + p.edition + "|" + p.clause)) continue;
      if (isContainerClause(p)) continue;
      const pw = words((p.title || "") + " " + (p.text || ""));
      const hit = pw.filter((x) => w.has(x)).length;
      if (hit) nineteen.push({ p, score: hit / Math.max(1, w.size) });
    }
    nineteen.sort((a, b) => b.score - a.score);
  }
  if (!scored.length) {
    console.log("      NO CANDIDATE a key could rest on today. A MAP question for the director.");
  } else {
    for (const s of scored.slice(0, TOP)) {
      console.log("      " + (s.p.source_id + ":" + s.p.edition + " " + s.p.clause).padEnd(30) +
        " [" + s.p.normative + "]  " + String(s.p.title || "").slice(0, 40).padEnd(40) +
        "  subject " + (s.score * 100).toFixed(0) + "%");
    }
  }
  if (nineteen.length) {
    console.log("      -- AUDIT-PRACTICE CANDIDATES: this task maps NO ISO 19011 primary, so these");
    console.log("         CANNOT key until one is mapped. Listed because the task reads as practice:");
    for (const s of nineteen.slice(0, TOP)) {
      console.log("      " + (s.p.source_id + ":" + s.p.edition + " " + s.p.clause).padEnd(30) +
        " [" + s.p.normative + "]  " + String(s.p.title || "").slice(0, 40).padEnd(40) +
        "  subject " + (s.score * 100).toFixed(0) + "%");
    }
  }
}
console.log("");
console.log("SUBJECT % IS A SORT ORDER, NOT A THRESHOLD. PROMPT-129 measured key-word overlap against");
console.log("the director's own duplicate calls at 8% to 57%: it ranks, it never decides.");
