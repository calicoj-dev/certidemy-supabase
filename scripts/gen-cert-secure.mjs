/**
 * gen-cert-secure.mjs - fill the SECURE (certification-exam) pool to a
 * per-task target, the cert-exam counterpart to backfill-practice.mjs.
 *
 * For every task in a cert below the secure target in any language, this
 * generates exam-grade questions in English, translates each to es-419 and
 * pt-BR (preserving option ids / correct_answer / type / difficulty exactly),
 * and inserts the trilingual set DIRECTLY into quiz_questions with the secure
 * shape:
 *     pool = 'secure', is_exam_scope = true, status = 'approved',
 *     module_id = null, bloom_level set, shared question_group_id per item.
 *
 * IT DELIBERATELY DOES NOT WRITE question_concepts. The practice engine finds
 * questions by walking question_concepts; linking a secure item there would
 * leak exam content into practice. The secure firewall = no concept link.
 * (Mirrors the hand-authored SM-I secure SQL in migrations 036-041.)
 *
 * ANSWER-CUE NEUTRALITY (added after the bias audit of June 2026): every item
 * is run through scripts/lib/item-cue-guard.mjs before translation. The guard
 * (a) injects length-parity / no-positional-habit / no-rhetorical-tell rules
 * into the system prompt, (b) drops any item whose key dominates on length or
 * shows the absolute-word tell, and (c) deterministically shuffles option order
 * so the correct answer lands in a uniformly random slot. Cues are born in
 * English, so neutralizing the English skeleton before translation makes all
 * three languages inherit a clean item. This is the same control used by
 * backfill-practice.mjs and every future cert.
 *
 * The mock-exam builder (generate-mock-exam) draws the cert exam from
 * pool='secure' + is_exam_scope=true + status='approved' + language, allocates
 * across DOMAINS by weight_pct, and REFUSES to issue a form if any domain is
 * short. A healthy per-task target (default 8) gives every domain margin over
 * its blueprint quota, so forms vary candidate-to-candidate and the allocator
 * never trips.
 *
 * Idempotent: reads current secure counts first and only fills the deficit, so
 * re-running tops up whatever's still short. (Dropped-for-cue items reduce a
 * round's yield; just re-run to top up.)
 *
 * Setup (once): supabase\scripts\.env with:
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *   ANTHROPIC_API_KEY=sk-ant-...
 *
 * Run (one full pass over all tasks):
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:CERT_ID="33333333-3333-3333-3333-333333333333"; $env:MAX_TASKS="0"
 *   node scripts\gen-cert-secure.mjs
 *
 * Optional knobs (env or .env): SECURE_PER_TASK (default 8), CHUNK (8),
 * MAX_TASKS (0=all; note the shared .env may set this to 9 - override per run),
 * TASK_ID (restrict to one task), DRY_RUN (1 = generate + print, no insert),
 * CERT_ID (target cert; defaults to SM-I).
 * Cue-guard knobs: LEN_SPREAD_MAX (default 70), KEY_LEN_MARGIN (default 12).
 *
 * Needs @supabase/supabase-js (installed in supabase\) and Node 18+.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { buildCleanItems, sourceMisconceptions } from "./lib/item-pipeline.mjs";
import { bloomForCert } from "./lib/item-profile.mjs";
import { bloomForTask } from "./lib/item-task-context.mjs";

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
const ANTHROPIC_API_KEY = need("ANTHROPIC_API_KEY");
const CERT_ID = process.env.CERT_ID || "11111111-1111-1111-1111-111111111111"; // SM-I

const PER_TASK = int(process.env.SECURE_PER_TASK, 8);
const CHUNK = int(process.env.CHUNK, 8);
const MAX_TASKS = int(process.env.MAX_TASKS, 0);
const ONLY_TASK = (process.env.TASK_ID || "").trim();
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

const MODEL = "claude-sonnet-4-6";
const LANGS = [
  { code: "es-419", name: "Latin American Spanish" },
  { code: "pt-BR", name: "Brazilian Portuguese" },
];
const SCRUM_NOUNS = [
  "Sprint", "Scrum Master", "Product Owner", "Daily Scrum", "Definition of Done",
  "Sprint Backlog", "Sprint Goal", "Product Backlog", "Product Goal", "Increment",
  "Sprint Review", "Sprint Retrospective", "Sprint Planning", "INVEST",
];
const MAX_ROUNDS_PER_TASK = 3;

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
function int(v, d) {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : d;
}

/**
 * Difficulty -> bloom_level enum, resolved PER CERT TIER (lib/item-profile.mjs).
 * The professional tier keeps the original mapping exactly (<=2 understand, 3 apply,
 * 4+ analyze). The literacy tier can emit 1_remember and is hard-capped at 3_apply.
 * CERT_NAME is module-level and set by main() once the cert row is fetched, so this
 * needs no signature change at the call site.
 */
let CERT_NAME = "";
function bloomFor(difficulty) {
  return bloomForCert(difficulty, CERT_NAME);
}

// ---------------------------------------------------------------------------
// Claude
// ---------------------------------------------------------------------------
async function rawClaude(system, user, maxTokens) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature: 0.7,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${body.slice(0, 500)}`);
  }
  const data = await res.json();
  return (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

async function callClaude({ system, user, maxTokens = 8000 }) {
  const text = await rawClaude(system, user, maxTokens);
  try {
    return parseJsonArray(text);
  } catch {
    // One JSON-repair retry: the model occasionally emits malformed JSON and we
    // don't want to lose an entire batch to a stray comma. (An API/credit error
    // is NOT caught here - it throws from rawClaude and propagates as before.)
    const repaired = await rawClaude(
      system,
      user +
        "\n\nIMPORTANT: your previous response was not valid JSON and failed to parse. " +
        "Return ONLY the corrected, strictly valid JSON now - no prose, no markdown fences, no trailing commas.",
      maxTokens
    );
    return parseJsonArray(repaired);
  }
}

function parseJsonArray(text) {
  let t = (text || "").trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (!t.startsWith("[")) {
    const a = t.indexOf("[");
    const b = t.lastIndexOf("]");
    if (a !== -1 && b !== -1 && b > a) t = t.slice(a, b + 1);
  }
  return JSON.parse(t);
}

// ---------------------------------------------------------------------------
// Translation graft (the English skeleton is authoritative)
// ---------------------------------------------------------------------------
function graftTranslation(enQ, tr) {
  if (!tr || typeof tr !== "object") return null;
  if (typeof tr.question_text !== "string" || tr.question_text.length < 5) return null;
  if (typeof tr.explanation !== "string" || tr.explanation.length < 3) return null;
  if (!Array.isArray(tr.options)) return null;
  const trById = new Map(tr.options.filter((o) => o && o.id).map((o) => [o.id, o.text]));
  const options = [];
  for (const o of enQ.options) {
    const text = trById.get(o.id);
    if (typeof text !== "string" || text.length === 0) return null;
    options.push({ id: o.id, text });
  }
  return {
    question_text: tr.question_text,
    question_type: enQ.question_type,
    options,
    correct_answer: enQ.correct_answer,
    explanation: tr.explanation,
    difficulty: enQ.difficulty,
  };
}

// ---------------------------------------------------------------------------
// Translation
// ---------------------------------------------------------------------------
function translateSystem(langName) {
  return `You translate certification exam questions from English to ${langName}.
Return a JSON array of the SAME length and order as the input. For each item return
an object: {"question_text":string,"options":[{"id":string,"text":string}],"explanation":string}.

Rules:
  - Translate question_text, every option's text, and explanation into ${langName}.
  - Keep each option's "id" EXACTLY as given (do not renumber or reorder).
  - Keep these Scrum proper nouns in English, untranslated: ${SCRUM_NOUNS.join(", ")}.
  - Do NOT add, drop, or merge options. Do NOT include correct_answer, difficulty,
    or question_type.
  - Output strict JSON only, NO prose, NO markdown fences.`;
}

function translateUser(enQuestions) {
  const payload = enQuestions.map((q) => ({
    question_text: q.question_text,
    options: q.options.map((o) => ({ id: o.id, text: o.text })),
    explanation: q.explanation,
  }));
  return `Translate these ${payload.length} questions:\n\n${JSON.stringify(payload, null, 2)}\n\nReturn the JSON array now.`;
}

// ---------------------------------------------------------------------------
// Data gathering
// ---------------------------------------------------------------------------
async function gather() {
  const { data: certRow, error: nameErr } = await supabase
    .from("certifications")
    .select("name")
    .eq("id", CERT_ID)
    .maybeSingle();
  if (nameErr) throw new Error(`certifications: ${nameErr.message}`);
  const certName = (certRow?.name || "Scrum certification").replace(/^Certidemy\s+/i, "");

  const { data: conceptRows, error: cErr } = await supabase
    .from("concepts")
    .select("id, slug, name, description")
    .eq("certification_id", CERT_ID);
  if (cErr) throw new Error(`concepts: ${cErr.message}`);
  const conceptById = new Map((conceptRows || []).map((c) => [c.id, c]));
  const conceptIds = [...conceptById.keys()];
  if (conceptIds.length === 0) throw new Error("no concepts for this cert");

  // THE JTA. Every task carries its statement, KSAs and DECLARED cognitive level.
  // The generator never read this table until now - items were written from concept
  // definitions alone, and bloom_level was stamped from an invented difficulty curve.
  const { data: taskRows, error: tErr } = await supabase
    .from("tasks")
    .select("id, code, statement, bloom_level, criticality, knowledge, skills, abilities, is_exam_scope")
    .eq("certification_id", CERT_ID);
  if (tErr) throw new Error(`tasks: ${tErr.message}`);
  const taskById = new Map((taskRows || []).map((t) => [t.id, t]));

  const { data: tcRows, error: tcErr } = await supabase
    .from("task_concepts")
    .select("task_id, concept_id")
    .in("concept_id", conceptIds);
  if (tcErr) throw new Error(`task_concepts: ${tcErr.message}`);
  const conceptsByTask = new Map();
  for (const r of tcRows || []) {
    const c = conceptById.get(r.concept_id);
    if (!c) continue;
    if (!conceptsByTask.has(r.task_id)) conceptsByTask.set(r.task_id, []);
    conceptsByTask.get(r.task_id).push({ slug: c.slug, name: c.name, description: c.description });
  }

  // current SECURE counts per task per language (cert-scoped, paginated).
  const qRows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("quiz_questions")
      .select("task_id, language")
      .eq("certification_id", CERT_ID)
      .eq("pool", "secure")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`quiz_questions: ${error.message}`);
    const batch = data || [];
    qRows.push(...batch);
    if (batch.length < PAGE) break;
  }
  const counts = new Map();
  for (const r of qRows) {
    if (!r.task_id) continue;
    if (!counts.has(r.task_id)) counts.set(r.task_id, { en: 0, "es-419": 0, "pt-BR": 0 });
    const c = counts.get(r.task_id);
    if (r.language in c) c[r.language] += 1;
  }

  return { conceptsByTask, counts, certName, taskById };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(
    `Secure backfill: cert=${CERT_ID} target=${PER_TASK}/lang/task chunk=${CHUNK} ` +
    `${ONLY_TASK ? `task=${ONLY_TASK} ` : ""}${DRY_RUN ? "[DRY RUN]" : "[LIVE]"}`
  );

  const { conceptsByTask, counts, certName, taskById } = await gather();
  CERT_NAME = certName; // tier profile (difficulty + bloom) keys off this
  console.log(`Generating as: "${certName}" exam writer\n`);

  let tasks = [...conceptsByTask.keys()];
  if (ONLY_TASK) tasks = tasks.filter((t) => t === ONLY_TASK);

  const work = [];
  for (const taskId of tasks) {
    const c = counts.get(taskId) || { en: 0, "es-419": 0, "pt-BR": 0 };
    const min = Math.min(c.en, c["es-419"], c["pt-BR"]);
    const need = PER_TASK - min;
    if (need > 0) work.push({ taskId, need, min, c });
  }
  work.sort((a, b) => a.min - b.min);
  const limited = MAX_TASKS > 0 ? work.slice(0, MAX_TASKS) : work;

  const totalNeed = limited.reduce((s, w) => s + w.need, 0);
  console.log(
    `${work.length} task(s) below target; processing ${limited.length}; ` +
    `~${totalNeed} logical questions (x3 languages) to generate.\n`
  );
  if (limited.length === 0) return;

  let inserted = 0;
  for (const w of limited) {
    const concepts = conceptsByTask.get(w.taskId) || [];
    const slugs = concepts.map((c) => c.slug).join(", ");
    console.log(`> task ${w.taskId} [${slugs}] - have min ${w.min}, need ${w.need}`);

    // Stage 1: source the real misconceptions for this task once, reused per round.
    const misconceptions = await sourceMisconceptions({
      callClaude, concepts, certName, log: (m) => console.log(`    ${m}`),
    });

    let remaining = w.need;
    let rounds = 0;
    while (remaining > 0 && rounds < MAX_ROUNDS_PER_TASK) {
      rounds += 1;
      const k = Math.min(remaining, CHUNK);
      // Stages 2-4: draft -> hostile critique-and-revise -> guards + position shuffle.
      const enQs = await buildCleanItems({
        callClaude, concepts, k, certName, kind: "secure", task: taskById.get(w.taskId) || null,
        misconceptions, log: (m) => console.log(`    ${m}`),
      });
      if (enQs.length === 0) {
        console.log("    no clean items this round");
        continue;
      }

      const byLang = { en: enQs };
      let ok = true;
      for (const lang of LANGS) {
        try {
          const raw = await callClaude({
            system: translateSystem(lang.name),
            user: translateUser(enQs),
          });
          const arr = Array.isArray(raw) ? raw : [];
          if (arr.length !== enQs.length) { ok = false; console.log(`    ${lang.code}: count mismatch`); break; }
          const grafted = enQs.map((q, i) => graftTranslation(q, arr[i]));
          if (grafted.some((g) => g === null)) { ok = false; console.log(`    ${lang.code}: graft failed`); break; }
          byLang[lang.code] = grafted;
        } catch (e) {
          ok = false;
          console.log(`    ${lang.code} translate failed: ${e.message}`);
          break;
        }
      }
      if (!ok) continue;

      // Build the trilingual secure rows. Direct insert; NO question_concepts.
      const rows = [];
      for (let i = 0; i < enQs.length; i++) {
        const groupId = globalThis.crypto.randomUUID();
        for (const langCode of ["en", "es-419", "pt-BR"]) {
          const q = byLang[langCode][i];
          rows.push({
            certification_id: CERT_ID,
            task_id: w.taskId,
            module_id: null,
            question_group_id: groupId,
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            // Stamped from the TASK's declared level (the JTA), never from difficulty.
            bloom_level: bloomForTask(taskById.get(w.taskId), bloomFor(q.difficulty)),
            language: langCode,
            pool: "secure",
            is_exam_scope: true,
            status: "approved",
          });
        }
      }

      if (DRY_RUN) {
        console.log(`    [dry] ${enQs.length} logical ok (sample EN: ${enQs[0].question_text.slice(0, 80)}...)`);
        remaining -= enQs.length;
        continue;
      }

      const { data: ins, error: insErr } = await supabase
        .from("quiz_questions")
        .insert(rows)
        .select("id");
      if (insErr) {
        console.log(`    insert failed: ${insErr.message}`);
        break;
      }
      const wrote = (ins || []).length;
      inserted += wrote;
      remaining -= enQs.length;
      console.log(`    +${enQs.length} logical (${wrote} rows) - ${remaining} left for this task`);
    }
    if (remaining > 0) console.log(`    ! task left ${remaining} short after ${rounds} round(s)`);
  }

  console.log(
    `\nDone. ${DRY_RUN ? "Would have written" : "Wrote"} ~${DRY_RUN ? "(dry run)" : inserted} rows. ` +
    `Re-run to top up any tasks left short.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
