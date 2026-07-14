/**
 * wire-lessons.mjs — project each lesson's frontmatter (concept_slugs,
 * task_codes) into the lesson_concepts and lesson_tasks join tables.
 *
 * THE PROBLEM THIS SOLVES. Lessons store their relationships two ways: as
 * human-authored YAML frontmatter inside content_md (the authoring source of
 * truth), AND as rows in the lesson_concepts / lesson_tasks join tables (what
 * the rest of the system queries — review→lesson links, coverage reports,
 * mastery). Those join rows are a PROJECTION of the frontmatter. If a lesson is
 * inserted without that projection step, its frontmatter is correct but the
 * join tables are empty, so its questions cannot resolve "review where this is
 * covered" and the cert has holes in its traceability matrix. SM-AI-I shipped
 * with 6 unprojected lessons; SPO-AI-I shipped with ALL of them unprojected.
 *
 * This script IS the projection step, made repeatable. It reads every lesson
 * for a cert, parses the frontmatter, resolves concept_slugs→concept ids and
 * task_codes→task ids (scoped to that cert), and writes the join rows —
 * idempotently, so re-running is a safe no-op. Run it after authoring any new
 * lesson, and the traceability matrix is always complete by construction.
 *
 * AUDIT NOTE (17024 framework). The link from an exam item back to the body of
 * knowledge that teaches it is coverage-traceability evidence. This script is
 * the control that keeps that evidence complete: an automated, re-runnable,
 * verifiable projection — not a hand-patched one-off. It also REPORTS any
 * frontmatter slug/code that doesn't resolve to a real concept/task, surfacing
 * authoring errors instead of silently dropping them.
 *
 * Setup (once): supabase\scripts\.env with SUPABASE_SERVICE_ROLE_KEY=...
 * (ANTHROPIC_API_KEY is not needed — this script calls no model.)
 *
 * Run (dry run first, always):
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:CERT_ID="33333333-3333-3333-3333-333333333333"; $env:DRY_RUN="1"
 *   node scripts\wire-lessons.mjs
 *   # then live:
 *   $env:DRY_RUN="0"; node scripts\wire-lessons.mjs
 *
 * Knobs (env or .env):
 *   CERT_ID    target cert (defaults to SM-AI-I 1111…)
 *   DRY_RUN    1 = parse + resolve + print, write nothing
 *   LANG       restrict to one language (default: all of en/es-419/pt-BR)
 *   WEIGHT     lesson_concepts.weight to write (default 1.0)
 *
 * Needs @supabase/supabase-js (installed in supabase\) and Node 18+.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// ---------------------------------------------------------------------------
// Local .env loader (KEY=VALUE), real process env wins over the file.
// ---------------------------------------------------------------------------
function loadDotEnv() {
  const here = dirname(fileURLToPath(import.meta.url));
  const path = resolve(here, ".env");
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined || process.env[key] === "") process.env[key] = val;
  }
}
loadDotEnv();

// ---------------------------------------------------------------------------
// Config.
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co";
const SERVICE_KEY = need("SUPABASE_SERVICE_ROLE_KEY");
const CERT_ID = process.env.CERT_ID || "11111111-1111-1111-1111-111111111111"; // SM-AI-I
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());
const ONLY_LANG = (process.env.LANG || "").trim();
const WEIGHT = numEnv(process.env.WEIGHT, 1.0);

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function need(k) {
  const v = process.env[k];
  if (!v || !v.trim()) {
    console.error(`Missing required env var: ${k}`);
    process.exit(1);
  }
  return v.trim();
}
function numEnv(v, d) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

// ---------------------------------------------------------------------------
// Frontmatter parsing. Lessons open with a YAML block delimited by --- … ---.
// We only need two fields: concept_slugs (a list) and task_codes (a flow or
// block list). We parse just those, tolerantly, without a YAML dependency —
// the shapes are known and uniform (see LESSON_AUTHORING_SPEC §2).
// ---------------------------------------------------------------------------

/** Extract the frontmatter block (between the first two --- lines). */
function extractFrontmatter(contentMd) {
  if (typeof contentMd !== "string") return null;
  const m = contentMd.match(/^\s*---\s*\n([\s\S]*?)\n---\s*(\n|$)/);
  return m ? m[1] : null;
}

/**
 * Parse task_codes. Supports inline flow lists:  task_codes: [1.1, 2.3]
 * and block lists:
 *   task_codes:
 *     - 1.1
 *     - 2.3
 * Codes are normalized to strings ("1.1", "4.10") to match tasks.code.
 */
function parseTaskCodes(fm) {
  const codes = [];
  const inline = fm.match(/^task_codes:\s*\[([^\]]*)\]\s*$/m);
  if (inline) {
    for (const part of inline[1].split(",")) {
      const c = part.trim().replace(/^["']|["']$/g, "");
      if (c) codes.push(c);
    }
    return codes;
  }
  // block list form
  const blockStart = fm.search(/^task_codes:\s*$/m);
  if (blockStart !== -1) {
    const after = fm.slice(blockStart).split(/\n/).slice(1);
    for (const line of after) {
      const m = line.match(/^\s*-\s*(.+?)\s*$/);
      if (!m) break; // first non-list line ends the block
      codes.push(m[1].replace(/^["']|["']$/g, ""));
    }
  }
  return codes;
}

/** Parse concept_slugs. Same two forms as task_codes; slugs are kebab strings. */
function parseConceptSlugs(fm) {
  const slugs = [];
  const inline = fm.match(/^concept_slugs:\s*\[([^\]]*)\]\s*$/m);
  if (inline) {
    for (const part of inline[1].split(",")) {
      const s = part.trim().replace(/^["']|["']$/g, "");
      if (s) slugs.push(s);
    }
    return slugs;
  }
  const blockStart = fm.search(/^concept_slugs:\s*$/m);
  if (blockStart !== -1) {
    const after = fm.slice(blockStart).split(/\n/).slice(1);
    for (const line of after) {
      const m = line.match(/^\s*-\s*(.+?)\s*$/);
      if (!m) break;
      slugs.push(m[1].replace(/^["']|["']$/g, ""));
    }
  }
  return slugs;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(
    `Wire lessons: cert=${CERT_ID} weight=${WEIGHT} ` +
    `${ONLY_LANG ? `lang=${ONLY_LANG} ` : ""}${DRY_RUN ? "[DRY RUN]" : "[LIVE]"}`
  );

  // 1. Resolve the cert's concept slug→id and task code→id maps (cert-scoped).
  const { data: concepts, error: cErr } = await supabase
    .from("concepts")
    .select("id, slug")
    .eq("certification_id", CERT_ID);
  if (cErr) throw new Error(`concepts: ${cErr.message}`);
  const conceptBySlug = new Map((concepts || []).map((c) => [c.slug, c.id]));

  const { data: tasks, error: tErr } = await supabase
    .from("tasks")
    .select("id, code")
    .eq("certification_id", CERT_ID);
  if (tErr) throw new Error(`tasks: ${tErr.message}`);
  const taskByCode = new Map((tasks || []).map((t) => [String(t.code), t.id]));

  console.log(`Resolved ${conceptBySlug.size} concepts, ${taskByCode.size} tasks for this cert.`);

  // 2. Load every lesson for this cert (via its modules), with content_md.
  //    Paginate to be safe against the 1000-row PostgREST cap.
  const { data: modules, error: mErr } = await supabase
    .from("modules")
    .select("id")
    .eq("certification_id", CERT_ID);
  if (mErr) throw new Error(`modules: ${mErr.message}`);
  const moduleIds = (modules || []).map((m) => m.id);
  if (moduleIds.length === 0) throw new Error("no modules for this cert");

  const lessons = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    let q = supabase
      .from("lessons")
      .select("id, lesson_group_id, language, slug, content_md, module_id")
      .in("module_id", moduleIds)
      .order("id")   // load-bearing: unordered .range() overlaps pages
      .range(from, from + PAGE - 1);
    if (ONLY_LANG) q = q.eq("language", ONLY_LANG);
    const { data, error } = await q;
    if (error) throw new Error(`lessons: ${error.message}`);
    const batch = data || [];
    lessons.push(...batch);
    if (batch.length < PAGE) break;
  }
  console.log(`Loaded ${lessons.length} lesson rows.\n`);

  // 3. For each lesson, parse frontmatter → resolve → collect join rows.
  const conceptRows = []; // { lesson_id, concept_id, weight }
  const taskRows = [];    // { lesson_id, task_id }
  const unresolvedConcepts = new Map(); // slug -> count
  const unresolvedTasks = new Map();    // code -> count
  let lessonsNoFrontmatter = 0;

  for (const l of lessons) {
    const fm = extractFrontmatter(l.content_md);
    if (!fm) { lessonsNoFrontmatter += 1; continue; }

    for (const slug of parseConceptSlugs(fm)) {
      const cid = conceptBySlug.get(slug);
      if (!cid) { unresolvedConcepts.set(slug, (unresolvedConcepts.get(slug) || 0) + 1); continue; }
      conceptRows.push({ lesson_id: l.id, concept_id: cid, weight: WEIGHT });
    }
    for (const code of parseTaskCodes(fm)) {
      const tid = taskByCode.get(String(code));
      if (!tid) { unresolvedTasks.set(code, (unresolvedTasks.get(code) || 0) + 1); continue; }
      taskRows.push({ lesson_id: l.id, task_id: tid });
    }
  }

  console.log(
    `Parsed: ${conceptRows.length} concept link(s), ${taskRows.length} task link(s) to ensure.`
  );
  if (lessonsNoFrontmatter > 0) {
    console.log(`  ⚠ ${lessonsNoFrontmatter} lesson row(s) had no parseable frontmatter.`);
  }

  // Surface authoring errors LOUDLY — a frontmatter slug/code that doesn't
  // resolve to a real concept/task is a real problem to fix, not skip silently.
  if (unresolvedConcepts.size > 0) {
    console.log("  ⚠ UNRESOLVED concept_slugs (not in concepts for this cert):");
    for (const [slug, n] of unresolvedConcepts) console.log(`      ${slug}  (×${n})`);
  }
  if (unresolvedTasks.size > 0) {
    console.log("  ⚠ UNRESOLVED task_codes (not in tasks for this cert):");
    for (const [code, n] of unresolvedTasks) console.log(`      ${code}  (×${n})`);
  }

  if (DRY_RUN) {
    console.log(`\n[dry run] would upsert ${conceptRows.length} lesson_concepts + ${taskRows.length} lesson_tasks. No writes.`);
    return;
  }

  // 4. Idempotent writes. Both tables have natural composite keys; upsert with
  //    ignoreDuplicates so re-running only fills gaps and never errors.
  let wroteC = 0, wroteT = 0;
  const CHUNK = 500;

  for (let i = 0; i < conceptRows.length; i += CHUNK) {
    const slice = conceptRows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from("lesson_concepts")
      .upsert(slice, { onConflict: "lesson_id,concept_id", ignoreDuplicates: true });
    if (error) throw new Error(`lesson_concepts upsert: ${error.message}`);
    wroteC += slice.length;
  }
  for (let i = 0; i < taskRows.length; i += CHUNK) {
    const slice = taskRows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from("lesson_tasks")
      .upsert(slice, { onConflict: "lesson_id,task_id", ignoreDuplicates: true });
    if (error) throw new Error(`lesson_tasks upsert: ${error.message}`);
    wroteT += slice.length;
  }

  console.log(`\nDone. Ensured ${wroteC} lesson_concepts + ${wroteT} lesson_tasks (duplicates ignored).`);
  console.log("Re-run any time; it only fills gaps. Verify with the coverage matrix query.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
