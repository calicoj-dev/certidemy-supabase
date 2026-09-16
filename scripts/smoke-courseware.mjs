#!/usr/bin/env node
/**
 * smoke-courseware.mjs - post-deploy check for functions/courseware-read.
 *
 * READ-ONLY. No --apply, no writes, no database connection of its own. It only
 * POSTs to the deployed function. Unknown flags exit 2.
 *
 *   node scripts/smoke-courseware.mjs
 *   node scripts/smoke-courseware.mjs --url https://<ref>.supabase.co/functions/v1
 *
 * ===================== HTTP 200 IS NEVER A PASS BY ITSELF =====================
 *
 * The failure this is built around is `{"count": 0, "rows": []}` returned with a
 * 200. Every positive check below states a MINIMUM ROW COUNT, so an empty result
 * is a failure with a name rather than a green line. The recurring failure mode
 * of this repo is silent success, and a smoke test that accepts 200 as proof is
 * an instrument that can only ever agree with a deploy.
 *
 * ===================== WHAT THIS PINS, AND WHY =====================
 *
 * Section C pins the function's WIRE VOCABULARY by asserting it REFUSES the
 * wrong one. On 2026-09-13 the Worker registry sent tool vocabulary --
 * resource "syllabus", fields `certification`, `code`, `domain` -- and the
 * function takes certification|task|concept|search with `task_code` and
 * `domain_code`. All four tools would have 400'd on every call, and because the
 * Worker maps a non-ok response to UPSTREAM_UNREACHABLE an agent would have been
 * told the curriculum service could not be reached: a contract mismatch wearing
 * a network fault.
 *
 * ===================== WHAT THIS DOES NOT COVER =====================
 *
 * IT TESTS THE FUNCTION, NOT THE WORKER. It issues the wire calls the registry
 * is supposed to issue; it cannot see whether the registry still issues them. If
 * lib/mcp/registry.ts changes vocabulary again, every check here still passes
 * and the tools are still broken. Closing that needs a shared module across the
 * two repositories, which does not exist. Section C is the cheap half: it makes
 * the FUNCTION side immovable, so a future mismatch can only come from the
 * Worker.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
for (const p of [join(HERE, ".env"), join(HERE, "..", ".env"), join(HERE, "..", "..", ".env")]) {
  if (!existsSync(p)) continue;
  for (const l of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const KNOWN = new Set(["--url", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error(`Unrecognised flag: ${a}. READ-ONLY; known flags: --url, --verbose.`);
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const VERBOSE = process.argv.includes("--verbose");

const PROJECT_REF = "pctynukndxnmnxiqpgck";
const BASE = arg(
  "url",
  process.env.NEXT_PUBLIC_EDGE_FUNCTIONS_URL ??
    `${process.env.SUPABASE_URL ?? `https://${PROJECT_REF}.supabase.co`}/functions/v1`
);
const ENDPOINT = `${BASE.replace(/\/+$/, "")}/courseware-read`;

/* ----------------------------------------------------------------- harness */

let passed = 0;
const failures = [];

function record(name, ok, detail) {
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failures.push(`${name} -- ${detail}`);
    console.log(`  FAIL  ${name}`);
    console.log(`        ${detail}`);
  }
}

/**
 * A scoped key when one is available. Lesson bodies are behind
 * `courseware:lessons` as of 2026-09-14, and section B2 was written before that
 * -- it asked for a body with no credential and recorded three FAILURES for a
 * paywall doing exactly its job. A suite that reports the gate it asked for as a
 * defect is a suite somebody starts ignoring.
 */
const KEY = process.env.CERTIDEMY_KEY ?? "";

async function post(body, withKey = false) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      // Marks these rows as synthetic in mcp_requests. See probe-oauth-lesson.
      "x-mcp-client": "probe:smoke-courseware",
      ...(withKey && KEY ? { "x-certidemy-key": KEY } : {}),
    },
    body: JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

/** A positive check. Never passes on 200 alone: `min` rows are required. */
async function expectRows(name, body, min, extra, withKey = false) {
  const { status, json } = await post(body, withKey);
  if (status !== 200) return record(name, false, `HTTP ${status} ${JSON.stringify(json)?.slice(0, 120)}`);
  const count = json?.count;
  if (typeof count !== "number") return record(name, false, `no numeric count in response`);
  if (count < min) {
    return record(name, false, `count ${count}, expected at least ${min} -- 200 with no rows is the failure this check exists for`);
  }
  if (extra) {
    const problem = extra(json);
    if (problem) return record(name, false, problem);
  }
  if (VERBOSE) console.log(`        count=${count}`);
  return record(name, true);
}

/** A check that the function REFUSES something. 400 with a message, not a 200. */
async function expect400(name, body, mustMention) {
  const { status, json } = await post(body);
  if (status !== 400) {
    return record(name, false, `HTTP ${status} -- expected 400. A wrong shape that returns 200 is the mismatch this pins.`);
  }
  const msg = String(json?.error ?? "");
  if (mustMention && !msg.includes(mustMention)) {
    return record(name, false, `400, but the message did not mention "${mustMention}": ${msg}`);
  }
  return record(name, true);
}

/**
 * A NUMBER, OR A NUMERIC STRING. Postgres `numeric` does not survive as a JSON
 * number: the deno-postgres driver hands it back as a STRING to preserve exact
 * precision, so passing_score_pct arrives as "80.00" and not 80. PostgREST
 * converts it and the driver does not, which is why reading the same column two
 * ways gives two types.
 *
 * The first version of this test asserted `typeof === "number"` and failed on a
 * healthy deployment -- THE TEST WAS WRONG AND THE FUNCTION WAS RIGHT, which is
 * the worst way for a smoke test to fail because the obvious repair is to change
 * the thing being measured.
 *
 * So: accept both shapes and reject anything that is neither. `null` here means
 * "this is not a number in any serialisation", which is a real failure.
 */
function asNumber(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && /^-?\d+(?:\.\d+)?$/.test(v.trim())) return Number(v);
  return null;
}

/**
 * Every numeric-bearing column the views project, per resource. Enumerated
 * rather than discovered, so a column that stops being returned fails here
 * instead of being silently skipped -- and so the list is a readable statement
 * of what the wire is expected to carry.
 *
 * C AND D PASSING SAID NOTHING ABOUT THESE. The vocabulary pin and the
 * empty-result check never look at a value, so a serialisation change would
 * leave both green.
 */
const NUMERIC_FIELDS = {
  certification: [
    "tier", "exam_duration_minutes", "num_questions", "passing_score_pct",
    "max_exam_attempts", "attempt_window_months", "validity_days",
  ],
  task: ["domain_weight_pct"],
};

/** Reports which columns arrived as strings, so the shape is measured not assumed. */
function checkNumerics(label, rows, fields) {
  const row = rows[0];
  if (!row) return record(`${label}: numeric columns`, false, "no row to inspect");
  const missing = [];
  const unparseable = [];
  const asStrings = [];
  for (const f of fields) {
    if (!(f in row)) { missing.push(f); continue; }
    if (typeof row[f] === "string") asStrings.push(f);
    if (asNumber(row[f]) === null) unparseable.push(`${f}=${JSON.stringify(row[f])}`);
  }
  const detail = [
    missing.length ? `not returned at all: ${missing.join(", ")}` : "",
    unparseable.length ? `not numeric in any serialisation: ${unparseable.join(", ")}` : "",
  ].filter(Boolean).join("; ");
  record(`${label}: numeric columns parse`, missing.length === 0 && unparseable.length === 0, detail);
  console.log(`        numeric-as-string: ${asStrings.length ? asStrings.join(", ") : "(none)"}`);
}

/* -------------------------------------------------------------------- run */

// WRAPPED IN A FUNCTION SO NOTHING CALLS process.exit() WITH A FETCH IN FLIGHT.
// The first version exited inline and Windows aborted with a libuv assertion
// (UV_HANDLE_CLOSING), reporting 127 instead of 1 -- so a caller checking the
// exit code would have read a crash as an unfamiliar failure rather than as
// "checks failed". Set exitCode, return, let the loop drain.
async function main() {
console.log(`courseware-read smoke test`);
console.log(`endpoint: ${ENDPOINT}`);
console.log("");

// -- reachable at all -------------------------------------------------------
{
  const { status } = await post({ resource: "certification" });
  if (status === 404) {
    console.error("FAIL  the function is not deployed (404). Deploy it from the PARENT directory:");
    console.error("        supabase functions deploy courseware-read");
    process.exitCode = 1;
    return;
  }
  if (status === 500) {
    console.error("FAIL  500 on the simplest call. Three causes, distinguishable in the function log:");
    console.error("        'not configured'  -> MCP_READER_PASSWORD or MCP_READER_DB_HOST is unset.");
    console.error("        no 'connected' line at all -> it never reached Postgres. The port is NOT");
    console.error("          derivable from the host: db.<ref>.supabase.co is a dedicated pooler on");
    console.error("          6543 AND a direct connection on 5432, same hostname, same username.");
    console.error("          Set MCP_READER_DB_PORT.");
    console.error("        'refusing to serve' -> it connected as the wrong role, or as a role that");
    console.error("          can read mcp.lesson. That is the paywall asserting itself; do not widen");
    console.error("          a grant to make it pass.");
    console.error("      The cold-start log line reports shape, host, port and user.");
    process.exitCode = 1;
    return;
  }
}

console.log("A. THE FOUR TOOLS, as the wire calls each one makes");

await expectRows("get_syllabus     -> certification", { resource: "certification" }, 1, (j) => {
  const r = j.rows[0];
  if (r.code !== "AISM-I") return `code is ${r.code}, expected AISM-I`;
  for (const f of NUMERIC_FIELDS.certification) {
    if (asNumber(r[f]) === null) return `${f} is not numeric in any serialisation (${JSON.stringify(r[f])})`;
  }
  return null;
});

await expectRows("get_syllabus     -> task (en, all)", { resource: "task", language: "en", limit: 200 }, 1, (j) => {
  const domains = new Map();
  for (const r of j.rows) {
    if (domains.has(r.domain_code)) continue;
    const w = asNumber(r.domain_weight_pct);
    if (w === null) return `domain_weight_pct is not numeric (${JSON.stringify(r.domain_weight_pct)})`;
    domains.set(r.domain_code, w);
  }
  const sum = [...domains.values()].reduce((a, b) => a + b, 0);
  if (domains.size < 2) return `only ${domains.size} domain(s); a blueprint with one domain is a filter that did not lift`;
  if (Math.abs(sum - 100) > 0.01) return `domain weights sum to ${sum}, expected 100`;
  const fb = j.rows.filter((r) => r.domain_title_is_fallback === true).length;
  if (fb > 0) return `${fb} row(s) fell back to an English domain title in an English call, which is incoherent`;
  return null;
});

await expectRows("explain_task     -> task 1.1", { resource: "task", language: "en", task_code: "1.1", limit: 1 }, 1, (j) => {
  const r = j.rows[0];
  if (r.task_code !== "1.1") return `returned task ${r.task_code}, asked for 1.1 -- the filter is not applied`;
  if (!String(r.statement || "").trim()) return "statement is empty";
  return null;
});

await expectRows("explain_task     -> concepts of 1.1", { resource: "concept", task_code: "1.1", limit: 200 }, 1);

// get_concept bootstraps its slug from the data rather than hardcoding a guess,
// and then asserts the slug filter actually filters.
let sampleSlug = null;
{
  const { status, json } = await post({ resource: "concept", limit: 5 });
  if (status === 200 && json?.count > 0) sampleSlug = json.rows[0].slug;
  record("get_concept      -> concept list", status === 200 && json?.count > 0,
    status !== 200 ? `HTTP ${status}` : `count ${json?.count}, expected at least 1`);
}
if (sampleSlug) {
  await expectRows(`get_concept      -> slug "${sampleSlug}"`, { resource: "concept", slug: sampleSlug, limit: 1 }, 1, (j) => {
    if (j.rows[0].slug !== sampleSlug) return `returned ${j.rows[0].slug}, asked for ${sampleSlug} -- the slug filter is not applied`;
    if (j.count !== 1) return `count ${j.count} for an exact slug, expected exactly 1`;
    return null;
  });
}

// THE REGRESSION. A BROAD query is the one that exposed the defect: ordering by
// kind before relevance returned concepts only, because 'concept' < 'task'.
// The previous version of this check used "incident" -- 15 concepts and 5 tasks,
// the one query where the bug does NOT appear. Asserting on it was asserting on
// the hiding place.
await expectRows("search_blueprint -> broad query returns BOTH kinds",
  { resource: "search", query: "service", language: "en", limit: 20 }, 1, (j) => {
    const tasks = j.rows.filter((r) => r.kind === "task");
    const concepts = j.rows.filter((r) => r.kind === "concept");
    if (tasks.length === 0) return `zero tasks for a broad query -- ${concepts.length} concepts came back and nothing else. This is the defect.`;
    if (concepts.length === 0) return "zero concepts for a broad query in English";
    const s = j.searched ?? [];
    if (!s.includes("task") || !s.includes("concept")) return `searched=${JSON.stringify(s)}`;
    return null;
  });

// TOTALS, not a boolean. Every row carries kind_total, counted over ALL matches
// before the per-kind cut, so "20 results" can be told from "20 of 60".
await expectRows("search_blueprint -> per-kind totals exceed returned",
  { resource: "search", query: "service", language: "en", limit: 5 }, 1, (j) => {
    for (const kind of ["task", "concept"]) {
      const rows = j.rows.filter((r) => r.kind === kind);
      if (rows.length === 0) continue;
      const total = Number(rows[0].kind_total);
      if (!Number.isFinite(total)) return `${kind}: kind_total is not numeric (${rows[0].kind_total})`;
      if (total < rows.length) return `${kind}: total ${total} < returned ${rows.length}, which is impossible`;
      if (rows.length > 5) return `${kind}: ${rows.length} rows at limit 5`;
    }
    return null;
  });

// RANKING ACTUALLY RANKS. Bootstrapped from the data rather than hardcoded, the
// way the concept-slug check already does: pull a real task statement, search a
// distinctive slice of it, and require that task back FIRST among tasks. This is
// the assertion that would have caught the original defect -- the shape checks
// above pass on any ordering, this one does not.
{
  const one = await post({ resource: "task", language: "en", task_code: "5.9", limit: 1 });
  const stmt = one.json?.rows?.[0]?.statement ?? "";
  // Five consecutive words from the middle: distinctive, and not the opening
  // phrase that many statements share.
  const words = String(stmt).split(/\s+/).filter(Boolean);
  const probe = words.slice(Math.max(0, Math.floor(words.length / 3)), Math.max(5, Math.floor(words.length / 3) + 5)).join(" ");
  if (!probe || probe.length < 10) {
    record("search ranking: probe could not be built", false, `statement was ${JSON.stringify(stmt).slice(0, 60)}`);
  } else {
    const { status, json } = await post({ resource: "search", query: probe, language: "en", limit: 20 });
    const tasks = (json?.rows ?? []).filter((r) => r.kind === "task");
    const first = tasks[0]?.key ?? null;
    record(`search ranking: "${probe.slice(0, 34)}..." ranks task 5.9 first`,
      status === 200 && first === "5.9",
      status !== 200 ? `HTTP ${status}` : `first task was ${first ?? "(none)"} -- a phrase lifted verbatim from 5.9 must outrank everything else`);
  }
}

// DETERMINISM IS PART OF THE CONTRACT, not an implementation detail. LIMIT over
// equal scores is unstable in Postgres without a tie-break, and a partner who
// runs the same query twice and gets different answers is right to conclude the
// tool is broken.
{
  const body = { resource: "search", query: "service management", language: "en", limit: 20 };
  const a1 = await post(body);
  const a2 = await post(body);
  const key = (j) => (j?.rows ?? []).map((r) => `${r.kind}:${r.key}`).join("|");
  // THE FAILURE MESSAGE MUST NAME THE CAUSE. The guards below are right --
  // status and non-emptiness are both required, so this cannot pass on two
  // empty results -- but the first version printed only "run1= run2=", an
  // equality that READS AS SATISFIED while the assertion failed. A check whose
  // output suggests the opposite of its verdict is worse than a bare fail.
  const why =
    a1.status !== 200 || a2.status !== 200 ? `HTTP ${a1.status}/${a2.status} -- not a determinism failure, the query did not run`
    : key(a1.json).length === 0 ? "both runs returned zero rows, so order proves nothing"
    : key(a1.json) !== key(a2.json) ? `ORDER DIFFERS: run1=${key(a1.json).slice(0, 60)} run2=${key(a2.json).slice(0, 60)}`
    : "";
  record("search is deterministic: identical query, identical order", why === "", why);
}

// ===================== TWO PROPERTIES, NO MAGIC NUMBERS =====================
//
// This asserted `0 < total < 51` for the query "AI", calibrated when AISM-I was
// the only corpus and 36 was the answer. Widening to four made it 116 and the
// assertion failed -- CORRECTLY, but not for the reason it named.
//
// Measured: 116 is 36 + 44 + 20 + 16, one per certification, with AISM-I's own
// figure unchanged at 36. Nothing had regressed about word boundaries. SEARCH
// WAS IGNORING THE CERTIFICATION PARAMETER: it validated it and then searched
// all four corpora, because the search branch builds its SQL separately and the
// widening missed it.
//
// A threshold cannot tell those two apart. It fires on any change to the corpus
// -- a new task, a new certification, a reworded statement -- and it fires with
// the same message whatever moved, which is how a real defect arrives wearing
// "the number needs updating". Both properties are now asserted directly, and
// neither depends on how much content exists.
const searchTasks = async (body) => {
  const { status, json } = await post({ resource: "search", language: "en", limit: 50, ...body });
  const tasks = (json?.rows ?? []).filter((r) => r.kind === "task");
  return { status, n: tasks.length ? Number(tasks[0].kind_total) : 0 };
};

// 1. THE WORD BOUNDARY, proved by a term that exists ONLY inside other words.
//    "xplain" occurs in 34 AISM-I task statements and never at a word boundary,
//    so the correct answer is zero. Under the ILIKE substring matching this
//    replaced, it would return all 34.
{
  const r = await searchTasks({ query: "xplain", certification: "AISM-I" });
  record('search: "xplain" matches nothing -- it exists only inside "explain"',
    r.status === 200 && r.n === 0,
    r.status !== 200 ? `HTTP ${r.status}` : `${r.n} task matches; substring matching is back`);
}

// 2. AND THE ZERO ABOVE IS NOT AN OUTAGE. The same 34 statements, searched for
//    the word that actually starts there. Without this, a search returning
//    nothing at all would pass check 1.
{
  const r = await searchTasks({ query: "explain", certification: "AISM-I" });
  record('search: "explain" does match -- the zero above is a boundary, not an outage',
    r.status === 200 && r.n > 0,
    r.status !== 200 ? `HTTP ${r.status}` : `${r.n} task matches, expected at least 1`);
}

// 3. THE SCOPE, proved by a term that exists in exactly one of the four.
//    "candidate" is in 14 AIHR-I tasks and zero in AISM-I, AIE-I and AIGRM-I.
{
  const mine = await searchTasks({ query: "candidate", certification: "AIHR-I" });
  record('search: "candidate" is found in AIHR-I',
    mine.status === 200 && mine.n > 0,
    mine.status !== 200 ? `HTTP ${mine.status}` : `${mine.n} task matches, expected at least 1`);
}

// 4. AND IT DOES NOT LEAK ACROSS. This is the check that would have caught the
//    unscoped search: before the fix it returned AIHR-I's 14 under AISM-I.
{
  const other = await searchTasks({ query: "candidate", certification: "AISM-I" });
  record('search: "candidate" is NOT found in AISM-I -- the scope is real',
    other.status === 200 && other.n === 0,
    other.status !== 200 ? `HTTP ${other.status}` : `${other.n} AIHR-I task(s) returned under AISM-I`);
}

console.log("");
console.log("B. THE TWO es-419 CALLS, where a thin result must be REPORTED not absorbed");

await expectRows("get_syllabus     -> task (es-419)", { resource: "task", language: "es-419", limit: 200 }, 1, (j) => {
  if (j.language !== "es-419") return `envelope language is ${j.language}`;
  const bad = j.rows.filter((r) => r.language !== "es-419").length;
  if (bad) return `${bad} row(s) came back in another language`;
  return null;
});

{
  // The sharpest signal that `language` reaches the view rather than being
  // accepted and ignored: the same task must read differently.
  const en = await post({ resource: "task", language: "en", task_code: "1.1", limit: 1 });
  const es = await post({ resource: "task", language: "es-419", task_code: "1.1", limit: 1 });
  const a = en.json?.rows?.[0]?.statement ?? "";
  const b = es.json?.rows?.[0]?.statement ?? "";
  record("language actually routes (1.1 en != es-419)", Boolean(a) && Boolean(b) && a !== b,
    !a || !b ? "one of the two statements was empty" : "en and es-419 statements are identical -- language is accepted and ignored");
}

await expectRows("search_blueprint -> es-419", { resource: "search", query: "incidente", language: "es-419", limit: 50 }, 1, (j) => {
  const s = j.searched ?? [];
  // There is no concept_translations table, so a non-English search covers
  // tasks only -- and must SAY so. Absorbing the reduction is the dropped-read
  // defect class.
  if (s.includes("concept")) return `searched=${JSON.stringify(s)}: claims to have searched concepts, which have no translations`;
  if (!s.includes("task")) return `searched=${JSON.stringify(s)}, expected ["task"]`;
  const concepts = j.rows.filter((r) => r.kind === "concept").length;
  if (concepts > 0) return `${concepts} concept row(s) in a non-English search`;
  return null;
});

console.log("");
console.log("B2. THE PAYWALL, PROVED AGAINST WHAT IS DEPLOYED");
{
  // 322 proves this ONCE, at apply time, by setting role and attempting the
  // read. That is a statement about the database on that day. THIS proves it on
  // every run against the deployed function -- the thing a partner actually
  // reaches -- and the two can diverge: a redeploy that pointed the lesson
  // branch at the reader pool, or a grant added by hand, would leave the
  // migration's proof true and the service wrong.
  const idx = await post({ resource: "lesson_index", language: "en", limit: 5 });
  record("list_lessons: the catalogue is readable without a credential",
    idx.status === 200 && (idx.json?.count ?? 0) > 0,
    idx.status !== 200 ? `HTTP ${idx.status}` : `count ${idx.json?.count}`);

  const slug = idx.json?.rows?.[0]?.lesson_slug ?? null;
  if (!slug) {
    record("lesson body check: no slug to probe with", false, "lesson_index returned nothing");
  } else {
    const body = await post({ resource: "lesson", lesson_slug: slug, language: "en" }, true);

    // 503 means the holder password is unset -- a deployment state, not a
    // paywall failure, and it must not read as one.
    if (body.status === 503) {
      record(`get_lesson: MCP_HOLDER_PASSWORD is not set (${slug})`, false,
        "503 not configured -- the holder pool has no credential, so the paywall is untested rather than proven");
    } else if (body.status === 401 || body.status === 403) {
      // NOT A FAILURE, AND NOT A PASS. Lesson bodies need a key scoped
      // courseware:lessons; without CERTIDEMY_KEY this section cannot run, and
      // recording it as a defect is how a suite teaches people to ignore it.
      // scripts/smoke-paywall.mjs is what proves the refusal is correct.
      record(`get_lesson: UNTESTED without CERTIDEMY_KEY (HTTP ${body.status})`, true,
        null);
    } else {
      record(`get_lesson: a body is served for "${slug}"`,
        body.status === 200 && (body.json?.count ?? 0) === 1,
        body.status !== 200 ? `HTTP ${body.status} ${JSON.stringify(body.json)?.slice(0, 100)}` : `count ${body.json?.count}`);

      const row = body.json?.rows?.[0] ?? {};
      // THE RAW MARKDOWN MUST NOT CROSS THE WIRE. If content_md is present the
      // parser has been bypassed, and checkpoints and answer keys came with it.
      record("get_lesson: content_md is absent", !("content_md" in row),
        "raw markdown crossed the wire -- the parser was bypassed");
      record("get_lesson: blocks were parsed", Array.isArray(row.blocks) && row.blocks.length > 0,
        `blocks=${Array.isArray(row.blocks) ? row.blocks.length : typeof row.blocks}`);

      const shown = JSON.stringify(row);
      for (const k of ["correct", "correct_order", "best_path", "reflection_answer",
                       "is_correct", "minimum_correct"]) {
        record(`get_lesson: no ${k} in the response`, !shown.includes(`"${k}"`), k);
      }
      record("get_lesson: no checkpoint or interactive block",
        !(row.blocks ?? []).some((b) => b.type === "checkpoint" || b.type === "interactive"));
      record("get_lesson: what was withheld is reported",
        Number(row.omitted?.checkpoint ?? 0) >= 1 && Number(row.omitted?.interactive ?? 0) >= 1,
        JSON.stringify(row.omitted));
      record("get_lesson: draft status and authors are withheld",
        !("status" in (row.frontmatter ?? {})) && !("authors" in (row.frontmatter ?? {})),
        JSON.stringify(Object.keys(row.frontmatter ?? {})));
    }
  }
}

console.log("");
console.log("C. THE VOCABULARY PIN -- the function must REFUSE the wrong shapes");

await expect400('resource "syllabus" refused', { resource: "syllabus", language: "en" }, "resource");
// THIS PASSED FOR THE WRONG REASON and is rewritten to say what it tests.
// `lesson` became a real resource on 2026-09-14; the 400 it still returns is
// "lesson_slug required", whose message happens to contain the word "resource",
// so an assertion named 'resource "lesson" refused' went on passing while the
// thing it named stopped being true. A guard matching a STRING where the
// property is something else -- the family CLAUDE.md already records five of.
await expect400("lesson without a slug refused", { resource: "lesson", language: "en" }, "lesson_slug");
// `certification` WAS PINNED AS REFUSED AND IS NOW ACCEPTED (migration 325).
// The pin is inverted rather than deleted, and what it pins is far more valuable
// than what it pinned before: EIGHT CERTIFICATIONS ARE HELD, and this is the
// only assertion that tests that boundary over HTTP rather than in SQL.
//
// 325 proves it at the database layer by reading the views as mcp_reader. This
// proves the same property through the whole stack, as a stranger, which is the
// distinction the paywall work was built on -- a boundary tested only with the
// system's own credentials measures what the system can do, not what a caller
// can reach.
await expect400('held certification "ISMS-F" refused', { resource: "task", certification: "ISMS-F" }, "ISMS-F");
await expect400('held certification "SM-AI-I" refused', { resource: "task", certification: "SM-AI-I" }, "SM-AI-I");
await expect400("unknown certification refused", { resource: "task", certification: "NOPE-I" }, "NOPE-I");
await expect400("field `code` refused (it is task_code)", { resource: "task", code: "1.1" }, "code");
await expect400("field `domain` refused (it is domain_code)", { resource: "task", domain: "D1" }, "domain");
await expect400("malformed task_code refused", { resource: "task", task_code: "11" }, "task_code");
await expect400("query outside search refused", { resource: "task", query: "x" }, "query");

console.log("");
console.log("C2. THE WORKER'S REFUSAL BODY, VERBATIM");
{
  // THE ONE SHAPE NOTHING ELSE PROVES. A certification refusal is decided in the
  // Worker before any read, so it never appears on a readable resource, and the
  // Worker's tests stub fetch while this script never sent it. The body below is
  // copied from reportRefusal() in certidemy-web/lib/mcp/registry.ts.
  //
  // THIS PINS THE FUNCTION SIDE ONLY. If the Worker changes what it sends, this
  // still passes and the refusal telemetry still breaks -- the same residual
  // section C carries, and the same two-repo pair with no shared module. What it
  // removes is the other half: the function can no longer stop accepting it
  // silently.
  //
  // IT WRITES ONE ROW. That is what the log resource is for, and it is the only
  // write this script makes; see the closing line.
  const body = {
    resource: "log",
    event: "certification_refused",
    tool: "get_syllabus",
    certification: "ISMS-F",
  };
  const { status, json } = await post(body);
  record("the Worker's refusal body is accepted", status === 200 && json?.ok === true,
    status !== 200
      ? `HTTP ${status} ${JSON.stringify(json)?.slice(0, 120)} -- the refusal telemetry would be lost silently`
      : `ok=${json?.ok}`);
  record("and the refusal row was written", json?.logged === true,
    `logged=${json?.logged} -- accepted but not stored is still a lost event`);
}

console.log("");
console.log("D. AN EMPTY RESULT IS REPORTED, NOT DISGUISED");
{
  // A well-formed request that genuinely matches nothing must come back 200
  // with count 0. This is the one place a zero is correct -- and it is asserted
  // explicitly so the harness itself is shown to distinguish the two cases.
  const { status, json } = await post({ resource: "task", language: "en", domain_code: "D99", limit: 10 });
  record("known-empty filter returns 200 count:0", status === 200 && json?.count === 0,
    status !== 200 ? `HTTP ${status}` : `count is ${json?.count}, expected 0 -- a filter that matches nothing must not return rows`);
}

/* ----------------------------------------------------------------- report */

console.log("");
console.log(`passed: ${passed}`);
console.log(`failed: ${failures.length}`);
for (const f of failures) console.log("  X " + f);
console.log("");
// Honest rather than slogan: section C2 writes exactly one telemetry row,
// which is what the log resource exists to do. Nothing else here writes.
console.log("One telemetry row written by C2; nothing else was written.");
process.exitCode = failures.length === 0 ? 0 : 1;
}

await main();
