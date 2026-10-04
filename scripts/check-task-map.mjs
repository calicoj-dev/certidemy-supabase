#!/usr/bin/env node
/**
 * PIPELINE STAGE 2, for ANY certification. READ-ONLY -- no --apply exists.
 *
 * Per in-scope task: the primary passages mapped, how many are EFFECTIVE, the ruled floor, and how
 * many secure items are held. Three outcomes, never two:
 *
 *   at_floor   held >= floor
 *   short      held <  floor, and the map can support more
 *   too_thin   fewer than MIN_EFFECTIVE effective primaries -- a MAP question for the director, not
 *              work. Folding this into `short` would hide it beside tasks that merely need writing.
 *
 * `rollout-shortfall.mjs` is the AIMS-F-specific ancestor of this script: it takes no cert flag and
 * reads AIMSF-SURVIVORS.json. Stage 2 needs a generic one, so nothing here is hard-coded -- the
 * standard and edition come from the task map's own rows, and the floors from TASK-FLOORS-<CERT>.json.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { loadTaskFloors, floorFor } from "./lib/task-floors.mjs";
import { classifyPrimaries, effectivePrimaryControls } from "./lib/effective-primary.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MIN_EFFECTIVE = 3;
let CERT = null;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const m = argv[i].match(/^--cert(?:=(.+))?$/);
  if (m) { CERT = m[1] || argv[++i]; continue; }
  console.error("Unrecognised flag: " + argv[i] + ". Known: --cert <CODE>. READ-ONLY, no --apply.");
  process.exit(2);
}
if (!CERT) { console.error("--cert <CODE> is required."); process.exit(2); }

{
  const c = effectivePrimaryControls({ quiet: true });
  const fails = c.fails || [];
  if (fails.length) { console.error("REFUSING: effective-primary controls fail: " + fails.join("; ")); process.exit(2); }
  console.log("effective-primary controls: " + c.examined + " case(s), all pass");
}

const LANGS = ["en", "es-419", "pt-BR"];
const KEY = requireKey(HERE);
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("No certification " + CERT); process.exit(2); }

const libPath = join(ROOT, "SOURCE-PASSAGES.json");
if (!existsSync(libPath)) { console.error("SOURCE-PASSAGES.json is absent; stage 1 builds it."); process.exit(2); }
const lib = JSON.parse(readFileSync(libPath, "utf8"));

const tasks = (await getAll(KEY, "tasks?select=id,code,is_exam_scope,certification_id&order=code"))
  .filter((t) => t.certification_id === cert.id);
const inScope = tasks.filter((t) => t.is_exam_scope);
const tsRows = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id");
const passRows = await getAll(KEY, "source_passages?select=id,clause,source_id,edition&order=id");
const pById = new Map(passRows.map((r) => [r.id, r]));
/* question_group_id IS SELECTED: `enOf` needs it to find a sibling.s English row, and without it every
 * non-English row counted 0 and reported AIMS-F -- a bank known to be at floor -- as 35 tasks short.
 * Second instance this round of a predicate that cannot see the column it tests. */
const rows = await getAll(KEY, "quiz_questions?select=id,language,pool,status,task_id,retired_at,question_group_id" +
  "&certification_id=eq." + cert.id + "&order=id");
const floors = loadTaskFloors(cert.code);
if (floors.errors.length) {
  console.error("REFUSING: " + floors.source + " has " + floors.errors.length + " problem(s):");
  for (const e of floors.errors) console.error("  " + e);
  process.exit(2);
}

/* the library indexed per (source, edition) so the container test uses the right document's nesting */
const bySrc = new Map();
for (const p of lib.passages) {
  const k = p.source_id + "|" + p.edition;
  if (!bySrc.has(k)) bySrc.set(k, new Map());
  bySrc.get(k).set(String(p.clause), p);
}

/* ============ WHAT COUNTS AS "HELD" (ruled PROMPT-110 s4.2) ============
 *
 * KEPT items (named by the stage-2 audit) plus ACCEPTED GROUNDED items. An old item nothing has
 * audited counts as ZERO.
 *
 * The first version counted every live secure row, and reported ISMS-F as "42 tasks at floor, 0 to
 * generate" over a bank no instrument had looked at. That number was not optimistic, it was empty.
 * AIMS-F only became countable once its survivor audit produced a keep list. */
const SLUG = CERT.replace(/-/g, "");
const keepPath = join(ROOT, SLUG + "-SURVIVORS.json");
const haveAudit = existsSync(keepPath);
const keepPrefixes = haveAudit
  ? new Set((JSON.parse(readFileSync(keepPath, "utf8")).keep_ids || []))
  : new Set();
const ig = new Map((await getAll(KEY, "item_grounding?select=question_id,review_verdict&order=question_id"))
  .map((g) => [g.question_id, g]));
const enOf = (r) => r.language === "en" ? r
  : (r.question_group_id ? rows.find((x) => x.question_group_id === r.question_group_id && x.language === "en") : null);

/** Both directions, and the case PROMPT-110 s4.2 names: an unaudited item is not counted. */
function heldControls() {
  const cases = [];
  const ok = (what, pass) => cases.push({ what, pass });
  const base = { pool: "secure", retired_at: null, status: "approved" };
  ok("an UNAUDITED old item is NOT counted",
    !countsAsHeld(base, { acceptedGrounded: false, auditKept: false }));
  ok("an audit-KEPT item IS counted", countsAsHeld(base, { acceptedGrounded: false, auditKept: true }));
  ok("an ACCEPTED GROUNDED item IS counted", countsAsHeld(base, { acceptedGrounded: true, auditKept: false }));
  ok("a RETIRED kept item is NOT counted",
    !countsAsHeld({ ...base, retired_at: "2026-10-03T00:00:00Z" }, { acceptedGrounded: true, auditKept: true }));
  ok("a PRACTICE kept item is NOT counted (this floor is the secure pool)",
    !countsAsHeld({ ...base, pool: "practice" }, { acceptedGrounded: true, auditKept: true }));
  ok("a REJECTED item is NOT counted even if the audit kept it",
    !countsAsHeld({ ...base, status: "rejected" }, { acceptedGrounded: true, auditKept: true }));
  ok("a pending_review grounded sibling IS counted (it is stock, pre-approval)",
    countsAsHeld({ ...base, status: "pending_review" }, { acceptedGrounded: true, auditKept: false }));
  return { examined: cases.length, fails: cases.filter((c) => !c.pass).map((c) => c.what) };
}

export function countsAsHeld(row, opts) {
  if (!row || row.pool !== "secure" || row.retired_at !== null) return false;
  if (row.status !== "approved" && row.status !== "pending_review") return false;
  /* accepted grounded: its English row carries review_verdict = 'accept' */
  if (opts.acceptedGrounded) return true;
  /* kept by the audit: its English row's uuid prefix is on the keep list */
  if (opts.auditKept) return true;
  return false;
}

const countHeld = (taskId, lang) => rows.filter((r) => {
  if (r.task_id !== taskId || r.language !== lang) return false;
  const en = enOf(r);
  const g = en ? ig.get(en.id) : null;
  const acceptedGrounded = !!g && g.review_verdict === "accept";
  const auditKept = !!en && [...keepPrefixes].some((p) => String(en.id).startsWith(p));
  return countsAsHeld(r, { acceptedGrounded, auditKept });
}).length;

console.log("");
console.log("STAGE 3  TASK MAP AND FLOORS   " + CERT);
console.log("  held counts KEPT + ACCEPTED GROUNDED only. Unaudited old items count as 0.");
{
  const hc = heldControls();
  if (hc.fails.length) { console.error("REFUSING: held controls fail: " + hc.fails.join("; ")); process.exit(2); }
  console.log("  held controls: " + hc.examined + " case(s), all pass");
}
console.log("  keep list: " + (haveAudit ? keepPath.split(/[\\/]/).pop() + "   " + keepPrefixes.size + " id(s)"
  : "ABSENT -- run stage 2 (report-survivors.mjs --cert=" + CERT + "). Every old item counts as 0."));
console.log("  floors: " + floors.source + "   default " + floors.defaultFloor +
  "   " + floors.overrides.size + " override(s)");
console.log("  in-scope tasks: " + inScope.length + " of " + tasks.length);
console.log("");
/* ============ THE COLUMN SHOWN IS THE COLUMN THE VERDICT USES ============
 *
 * It was held(en) while the state came from the MINIMUM across the three languages. Task 2.1 therefore
 * printed "8   short (need 7 more)" against a floor of 8 -- which reads as a broken instrument, not as
 * "the siblings are not translated yet". A floor is per language, so the binding number is the minimum
 * and the language that sets it is named. */
console.log("  task     mapped  effective  floor  held(en)  held(min)  state");

const summary = { at_floor: 0, short: 0, too_thin: 0, no_map: 0 };
const detail = [];
for (const t of inScope) {
  const mine = tsRows.filter((r) => r.task_id === t.id && r.role === "primary")
    .map((r) => pById.get(r.passage_id)).filter(Boolean);
  if (!mine.length) {
    summary.no_map++;
    detail.push({ code: t.code, state: "NO MAP" });
    console.log("  " + t.code.padEnd(8) + String(0).padStart(6) + String(0).padStart(11) +
      "      -" + "         -" + "  NO PRIMARY PASSAGES MAPPED");
    continue;
  }
  /* group by (source, edition): the container test is per document */
  let effective = 0;
  for (const [k, group] of groupBy(mine, (p) => p.source_id + "|" + p.edition)) {
    const idx = bySrc.get(k) || new Map();
    const all = [...idx.keys()];
    const res = classifyPrimaries(group.map((p) => String(p.clause)), (c) => idx.get(String(c)) || null, all);
    effective += res.filter((r) => r.effective).length;
  }
  const f = floorFor(t.code, floors, effective);
  const held = Object.fromEntries(LANGS.map((l) => [l, countHeld(t.id, l)]));
  const minHeld = Math.min(...LANGS.map((l) => held[l]));
  const tooThin = effective < MIN_EFFECTIVE;
  const state = tooThin ? "too_thin" : (minHeld >= f.floor ? "at_floor" : "short");
  summary[state]++;
  detail.push({ code: t.code, mapped: mine.length, effective, floor: f.floor, why: f.why, held, state });
  const minLang = LANGS.filter((l) => held[l] === minHeld).join(",");
  console.log("  " + t.code.padEnd(8) + String(mine.length).padStart(6) + String(effective).padStart(11) +
    String(f.floor).padStart(7) + String(held.en).padStart(10) + String(minHeld).padStart(11) +
    (minHeld === held.en ? "  " : " (" + minLang + ") ") + state +
    (state === "short" ? " (need " + (f.floor - minHeld) + " more per language)" : "") +
    (tooThin ? " (" + effective + " effective < " + MIN_EFFECTIVE + " -- a MAP question, not work)" : "") +
    (f.why.startsWith("override") ? "   floor " + f.why : ""));
}

function groupBy(arr, keyOf) {
  const m = new Map();
  for (const x of arr) { const k = keyOf(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); }
  return m;
}

console.log("");
console.log("  at_floor  " + summary.at_floor + "   short " + summary.short +
  "   too_thin " + summary.too_thin + "   no map " + summary.no_map);
const toGenerate = detail.filter((d) => d.state === "short")
  .reduce((n, d) => n + (d.floor - Math.min(...LANGS.map((l) => d.held[l]))), 0);
console.log("  items to generate to reach every floor (English): " + toGenerate);
if (summary.no_map) {
  console.log("");
  console.log("  STAGE 3 IS NOT DONE: " + summary.no_map + " in-scope task(s) have no primary passage.");
  console.log("  A task with no map cannot be generated against and cannot be floored.");
}
process.exitCode = summary.no_map ? 1 : 0;
