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

async function post(body) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
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
async function expectRows(name, body, min, extra) {
  const { status, json } = await post(body);
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
    console.error("FAIL  500 on the simplest call. Either the secrets are missing or the identity");
    console.error("      assertion refused to serve. Check the function logs: it names which secret");
    console.error("      is absent, and refuses outright if it did not connect as mcp_reader.");
    process.exitCode = 1;
    return;
  }
}

console.log("A. THE FOUR TOOLS, as the wire calls each one makes");

await expectRows("get_syllabus     -> certification", { resource: "certification" }, 1, (j) => {
  const r = j.rows[0];
  if (r.code !== "AISM-I") return `code is ${r.code}, expected AISM-I`;
  for (const f of ["exam_duration_minutes", "num_questions", "passing_score_pct", "validity_days"]) {
    if (typeof r[f] !== "number") return `${f} is not a number (${r[f]})`;
  }
  return null;
});

await expectRows("get_syllabus     -> task (en, all)", { resource: "task", language: "en", limit: 200 }, 1, (j) => {
  const domains = new Map();
  for (const r of j.rows) if (!domains.has(r.domain_code)) domains.set(r.domain_code, Number(r.domain_weight_pct));
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

await expectRows("search_blueprint -> en", { resource: "search", query: "incident", language: "en", limit: 50 }, 1, (j) => {
  const s = j.searched ?? [];
  if (!s.includes("task") || !s.includes("concept")) return `searched=${JSON.stringify(s)}, expected both task and concept in English`;
  return null;
});

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
console.log("C. THE VOCABULARY PIN -- the function must REFUSE the wrong shapes");

await expect400('resource "syllabus" refused', { resource: "syllabus", language: "en" }, "resource");
await expect400('resource "lesson" refused', { resource: "lesson", language: "en" }, "resource");
await expect400("field `certification` refused", { resource: "task", certification: "AISM-I" }, "certification");
await expect400("field `code` refused (it is task_code)", { resource: "task", code: "1.1" }, "code");
await expect400("field `domain` refused (it is domain_code)", { resource: "task", domain: "D1" }, "domain");
await expect400("malformed task_code refused", { resource: "task", task_code: "11" }, "task_code");
await expect400("query outside search refused", { resource: "task", query: "x" }, "query");

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
console.log("READ-ONLY: nothing was written.");
process.exitCode = failures.length === 0 ? 0 : 1;
}

await main();
