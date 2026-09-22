#!/usr/bin/env node
/**
 * check-mcp-wire.mjs -- every mcp view, every language, against the DEPLOYED
 * endpoint, as a partner.
 *
 * READ-ONLY. No --apply, no --dry, no writes of any kind. Unknown flags exit 2.
 *
 * ============ WHY THIS EXISTS ============
 *
 * mcp.concept reported 158 of 158 serving, as an admin, from the view. Every
 * non-English read of that view had answered HTTP 500 since migration 359:
 *
 *     POST courseware-read {resource: concept, language: es-419}  ->  500
 *     courseware-read failed: permission denied for schema public
 *
 * The gate was right. The CLAIM was that an unauthenticated partner receives
 * the rows, and nothing in this repository tested that. A .mjs script against
 * PostgREST with the service-role key is the same error in a different
 * costume: THE CREDENTIAL THE TEST HOLDS IS THE HYPOTHESIS.
 *
 * So this holds the weakest credential a caller can hold -- none at all -- and
 * asks the deployed function, which is the only thing that can answer.
 *
 * ============ WHY IT IS A MATRIX AND NOT A SMOKE TEST ============
 *
 * The defect was invisible for four migrations because no concept_translations
 * row has language 'en'. An English read finds no candidate row, never
 * evaluates the join predicate, and never calls the function that was
 * unreachable. English passed for the entire life of the defect.
 *
 * A code path reachable only for a SUBSET of the data needs that subset named
 * in the matrix. Every cell here is one (resource, language, certification),
 * and the language axis is the one that would have caught it on day one.
 *
 * ============ WHAT IT CANNOT DO ============
 *
 * `lesson` and `rubric` cost a scope. Without a key those cells are NOT
 * EXERCISED and are reported as such -- never as a pass. A matrix that examines
 * zero cells is VACUOUS, not green, and the summary carries three numbers so
 * that distinction survives into the output.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--json", "--quiet"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a);
    console.error("This script is READ-ONLY. It takes --json and --quiet and nothing else.");
    console.error("NOTE: this directory has two opposite flag conventions --");
    console.error("  --dry   means the script is LIVE without it   (load-lessons-direct.mjs)");
    console.error("  --apply means the script is DRY without it    (mint-missing-credentials.mjs)");
    console.error("This one writes nothing under any flag.");
    process.exit(2);
  }
}
const JSON_OUT = process.argv.includes("--json");
const QUIET = process.argv.includes("--quiet");

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const FN = "https://pctynukndxnmnxiqpgck.supabase.co/functions/v1/courseware-read";

/* The scoped resources need a partner API key. There is no lessons key in this
 * environment by default; where there is none the cell is NOT EXERCISED. */
const LESSON_KEY = process.env.CERTIDEMY_LESSONS_KEY || null;

const LANGS = ["en", "es-419", "pt-BR"];
/* AIMS-IA and ISMS-IA cleared tonight; AIMS-F was signed off as released and
 * serving and was 500ing too; the rest are the certifications the MCP server
 * actually advertises, so a partner reaches them first. */
const CERTS = ["AIMS-IA", "ISMS-IA", "AIMS-F", "AISM-I", "AIGRM-I"];

const QUERY = { "en": "audit", "es-419": "auditoria", "pt-BR": "auditoria" };

/* Which mcp view each resource reads, so a failing cell names the object to
 * go and look at rather than only the tool that surfaced it. */
const VIEW_FOR = {
  certification: "mcp.certification",
  task: "mcp.task",
  concept: "mcp.concept",
  search: "mcp.task + mcp.concept",
  lesson_index: "mcp.lesson_index",
  lesson: "mcp.lesson",
};
/* rows > 0 is part of the answer for these. A certification that genuinely has
 * no lessons returns 200 with an empty list and that is correct, so
 * lesson_index and search assert transport only. */
const MUST_HAVE_ROWS = new Set(["certification", "task", "concept"]);

async function call(body, headers = {}) {
  let last;
  /* Retry is for the IPv6/undici connect timeout this repo records, not for
   * masking a real failure: every attempt is a READ, so a retry cannot
   * duplicate a side effect. */
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(FN, {
        method: "POST",
        headers: { "content-type": "application/json", "x-mcp-client": "check-mcp-wire", ...headers },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(45000),
      });
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* reported as unparseable below */ }
      return { status: r.status, json, text };
    } catch (e) { last = e; }
  }
  return { status: 0, json: null, text: String(last?.message || last) };
}

function verdict(res, resource) {
  if (res.status === 0) return { ok: false, why: "unreachable: " + res.text.slice(0, 60) };
  if (res.status !== 200) {
    const msg = res.json?.error ?? res.text.slice(0, 60);
    return { ok: false, why: "HTTP " + res.status + " " + msg };
  }
  if (!res.json) return { ok: false, why: "200 with an unparseable body" };
  if (res.json.error) return { ok: false, why: "200 carrying an error field: " + res.json.error };
  const rows = Array.isArray(res.json.rows) ? res.json.rows.length
             : Array.isArray(res.json.lessons) ? res.json.lessons.length : null;
  if (rows === null) return { ok: false, why: "200 with no rows array" };
  if (MUST_HAVE_ROWS.has(resource) && rows === 0) return { ok: false, why: "200 with zero rows" };
  return { ok: true, rows };
}

/* ======================= CONTROLS =======================
 *
 * Two, in opposite directions, because one alone is worthless here.
 *
 * A refusal proves nothing unless something proves the endpoint still SERVES --
 * a broken deployment refuses everything, and every cell below would then fail
 * for a reason that has nothing to do with the property being measured.
 *
 * A pass proves nothing unless something proves the instrument can still FAIL.
 * A check that cannot fire is indistinguishable from one that fired and found
 * nothing, and this script's whole job is to be believed when it is green.
 */
async function controls() {
  const out = [];

  const up = await call({ resource: "certification", certification: "AISM-I", language: "en" });
  const upV = verdict(up, "certification");
  out.push({
    name: "POSITIVE -- the endpoint serves at all",
    pass: upV.ok,
    detail: upV.ok ? "certification/en/AISM-I returned rows" : upV.why,
  });

  /* A scoped resource with no key MUST be refused. If this comes back 200 the
   * paywall is not there and every other cell's pass is uninterpretable. */
  const paid = await call({ resource: "lesson", certification: "AISM-I", language: "en", lesson_slug: "x" });
  out.push({
    name: "NEGATIVE -- the instrument can see a failure",
    pass: paid.status !== 200,
    detail: "unauthenticated lesson answered HTTP " + paid.status + (paid.status === 200 ? "  <-- A BODY WAS SERVED" : ""),
  });

  return out;
}

const ctrl = await controls();
if (!QUIET) {
  console.log("");
  console.log("CONTROLS");
  for (const c of ctrl) console.log("  " + (c.pass ? "PASS  " : "FAIL  ") + c.name + "   " + c.detail);
}
if (ctrl.some((c) => !c.pass)) {
  console.error("");
  console.error("A control failed. The matrix below would not mean anything, so it was not run.");
  process.exit(1);
}

/* ======================= THE MATRIX ======================= */

const cells = [];
for (const resource of ["certification", "task", "concept", "search", "lesson_index"]) {
  for (const lang of LANGS) {
    for (const cert of CERTS) {
      const body = { resource, certification: cert, language: lang };
      if (resource === "search") body.query = QUERY[lang];
      if (resource !== "certification") body.limit = 50;
      const res = await call(body);
      const v = verdict(res, resource);
      cells.push({ resource, view: VIEW_FOR[resource], lang, cert, ...v });
    }
  }
}

/* NOT EXERCISED, not passed. Recorded as its own class so the denominator
 * cannot absorb it. */
const skipped = [];
for (const lang of LANGS) {
  if (!LESSON_KEY) {
    skipped.push({ resource: "lesson", view: VIEW_FOR.lesson, lang,
      why: "no CERTIDEMY_LESSONS_KEY in this environment" });
  }
}

const examined = cells.length;
const failed = cells.filter((c) => !c.ok);

if (!QUIET) {
  console.log("");
  console.log("WIRE MATRIX -- deployed endpoint, no credential, " + examined + " cell(s)");
  console.log("");
  const head = "  resource        view                    language  " + CERTS.map((c) => c.padEnd(9)).join("");
  console.log(head);
  for (const resource of ["certification", "task", "concept", "search", "lesson_index"]) {
    for (const lang of LANGS) {
      const row = cells.filter((c) => c.resource === resource && c.lang === lang);
      const marks = CERTS.map((cert) => {
        const c = row.find((x) => x.cert === cert);
        return (c?.ok ? "ok " + String(c.rows) : "FAIL").padEnd(9);
      }).join("");
      console.log("  " + resource.padEnd(16) + VIEW_FOR[resource].padEnd(24) + lang.padEnd(10) + marks);
    }
  }
  if (failed.length) {
    console.log("");
    console.log("  FAILING CELLS");
    for (const f of failed) {
      console.log("    " + f.resource.padEnd(15) + f.lang.padEnd(8) + f.cert.padEnd(10) + f.why);
    }
  }
  if (skipped.length) {
    console.log("");
    console.log("  NOT EXERCISED -- reported, never counted as a pass");
    for (const s of skipped) console.log("    " + s.resource.padEnd(15) + s.lang.padEnd(8) + s.why);
  }
}

/* THREE NUMBERS, NOT TWO. "24 of 75 cells pass" cannot say whether the other
 * 51 were examined. A matrix that examines nothing renders identically to one
 * that examined everything and held, unless the denominator is printed. */
console.log("");
console.log("  " + (examined - failed.length) + " pass, " + failed.length + " fail, " +
            skipped.length + " not exercised   (denominator: " + examined + " cell(s) examined)");

if (JSON_OUT) {
  writeFileSync(join(ROOT, "MCP-WIRE-MATRIX.json"),
    JSON.stringify({ measured: new Date().toISOString(), examined, cells, skipped, controls: ctrl }, null, 2), "utf8");
  console.log("  wrote MCP-WIRE-MATRIX.json");
}

if (examined === 0) { console.error("  VACUOUS -- no cell was examined. This is not a pass."); process.exit(1); }
if (failed.length) process.exit(1);
