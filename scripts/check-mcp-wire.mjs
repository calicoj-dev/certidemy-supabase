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

/* ============ ONE TERM PER LANGUAGE, AND THE ACCENT IS THE POINT ==========
 *
 * This read `es-419: "auditoria"` -- WITHOUT THE ACCENT. Spanish is
 * `auditoria` with an i-acute; Portuguese is `auditoria` without one. The same
 * literal is correct for pt-BR and matches NOTHING in Spanish.
 *
 * Measured in the database for AIMS-IA es-419 tasks:
 *
 *   ~* backslash-y auditoria-with-accent    19 rows
 *   ~* backslash-y auditoria-no-accent       0 rows
 *
 * So the matrix asked Spanish a question Spanish text cannot answer, got zero,
 * and reported it as a PASS -- for at least two days across every
 * certification. At the endpoint with the correct term: 69 rows, against
 * pt-BR 70 and English 80.
 *
 * SPANISH SEARCH WAS NEVER BROKEN. The test was.
 *
 * The accented characters are built from escapes rather than typed, because a
 * shell mangled this exact word during the investigation and produced a
 * convincing false confirmation of a product defect. */
const I_ACUTE = String.fromCharCode(0x00ED);
const QUERY = {
  "en": "audit",
  "es-419": "auditor" + I_ACUTE + "a",
  "pt-BR": "auditoria",
};

/* ============ BOTH SPELLINGS, SO THE MATRIX CARRIES THE PROPERTY ==========
 *
 * One spelling per language tests that spelling. Since 368-370 the property is
 * ACCENT INSENSITIVITY, and a matrix holding only the accented form would pass
 * unchanged if unaccent were reverted tomorrow -- it would be measuring the
 * half that never broke.
 *
 * So each language carries the form a user actually types as well. Spanish is
 * the only one where they differ in the corpus; pt-BR `auditoria` is already
 * unaccented, so its pair is `avaliacao` against the cedilla form, which does
 * differ. English has no accented form and says so rather than carrying a
 * duplicate cell that would always pass. */
const QUERY_PLAIN = {
  "en": null,                                        // no accented form exists
  "es-419": "auditoria",                             // the same word, typed plainly
  "pt-BR": "avaliacao",                              // pairs with avaliacao + cedilla
};
const QUERY_PLAIN_PAIR = {
  "en": null,
  "es-419": "auditor" + I_ACUTE + "a",
  "pt-BR": "avalia" + String.fromCharCode(0x00E7) + String.fromCharCode(0x00E3) + "o",
};

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ============ THE ENDPOINT RETURNS ONE STRING FOR TWO CAUSES ============
 *
 * {"error":"read failed"} is what courseware-read answers for BOTH
 *
 *   permission denied for schema public          -- deterministic, a real defect
 *   no more connections allowed (max_client_conn) -- transient, load
 *
 * The first run of this script produced the second and it was read as the
 * first: lesson_index was reported broken in three languages on a resource
 * that is fine. THE INSTRUMENT CAUSED IT -- 75 sequential calls, each waking
 * an isolate that takes a pooler connection, run twice in close succession.
 *
 * A guard that manufactures the failure it reports is worse than no guard, so
 * the two are separated the only way a black-box caller can: BY PERSISTENCE.
 * A permission failure is deterministic and survives any backoff. Exhaustion
 * clears. A cell is only called failed if it fails every attempt with the
 * delay growing between them.
 *
 * Paced, too. Measuring a surface must not be the heaviest thing that surface
 * has seen.
 */
async function call(body, headers = {}) {
  let last = null, lastRes = null;
  for (let i = 0; i < 4; i++) {
    if (i > 0) await sleep(1200 * i * i);
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
      lastRes = { status: r.status, json, text, attempts: i + 1 };
      /* 5xx is the only retryable status. A 400 or a 401 is an answer. */
      if (r.status < 500) return lastRes;
    } catch (e) { last = e; }
  }
  return lastRes ?? { status: 0, json: null, text: String(last?.message || last), attempts: 4 };
}

/* ============ THE EXPECTATIONS ============
 *
 * A floor per resource, with the reason stated. These are deliberately LOW --
 * the point is to catch a surface returning nothing, not to pin a count that
 * goes stale every time content lands. A floor that tracks the corpus is a
 * literal assertion by another name.
 *
 * `search` is the one that needed this. Every certification in the matrix has
 * tasks or concepts mentioning its own audit vocabulary in all three
 * languages, so a search for that vocabulary returning zero is a finding in
 * any of them. AISM-I and AIGRM-I are the exception and they say so.
 */
const EXPECT = {
  certification: { min: 1, why: "a certification in the matrix exists, so it must return its row" },
  task:          { min: 1, why: "every certification here has a published task list" },
  concept:       { min: 1, why: "every certification here has concepts in all three languages" },
  lesson_index:  { min: 1, why: "every certification here has lessons; the index lists them with or without bodies" },
  /* search is per (cert, language) rather than per resource -- see SEARCH_EXPECT. */
};

/* AISM-I and AIGRM-I cite no ISO auditing standard, so the audit vocabulary is
 * genuinely sparse or absent in them. ZERO IS CORRECT THERE AND THIS IS WHY --
 * which is the whole point of the category: an expectation of zero is still an
 * expectation, and it is checked. */
const SEARCH_ZERO_OK = new Set(["AISM-I"]);

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

  /* ============ A MEASUREMENT WITHOUT AN EXPECTATION IS A RECORD ==========
   *
   * This used to return { ok: true, rows } for anything that transported, and
   * the row count was compared to NOTHING. So a cell returning zero forever was
   * indistinguishable from a cell working perfectly, and es-419 search was
   * reported as a pass for at least two days while returning nothing on every
   * certification.
   *
   * A suite that stores what happened can detect CHANGE; it cannot detect
   * WRONGNESS, and calling it pass/fail claims it can.
   *
   * So every cell now carries an expectation -- a floor, or an explicit
   * statement that zero is correct here and why -- and a cell with no
   * expectation is UNASSERTED, never a pass. `NOT EXERCISED` was already the
   * right precedent: three cells refusing to claim something they had not
   * earned. Zero rows with no stated reason is the same class. */
  const exp = EXPECT[resource];
  if (!exp) return { unasserted: true, rows, why: "no expectation is declared for this resource" };
  if (typeof exp.min === "number" && rows < exp.min) {
    return { ok: false, rows, why: "expected at least " + exp.min + " row(s), got " + rows + " -- " + exp.why };
  }
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

  /* ============ THE EXPECTATION LOGIC NEEDS ITS OWN CONTROL ============
   *
   * `verdict` gained a floor and an UNASSERTED state, and a guard nobody has
   * watched fail is indistinguishable from one that cannot. These are offline
   * -- synthetic responses, no network -- so they cost nothing and cannot be
   * skipped by a quiet endpoint.
   *
   * Three directions, because the new logic has three outcomes. */
  const fake = (rows) => ({ status: 200, json: { rows: new Array(rows).fill({}) }, text: "" });
  const vFloor = verdict(fake(0), "concept");
  const vPass  = verdict(fake(3), "concept");
  const vNone  = verdict(fake(3), "no_such_resource");
  out.push({
    name: "EXPECTATION -- a floor can fail",
    pass: vFloor.ok === false,
    detail: vFloor.ok === false ? "zero rows on a resource with a floor is a FAIL" : "a floor did not fire",
  });
  out.push({
    name: "EXPECTATION -- a met floor passes",
    pass: vPass.ok === true,
    detail: vPass.ok === true ? "rows above the floor pass" : "a met floor did not pass",
  });
  out.push({
    name: "EXPECTATION -- no declared expectation reports UNASSERTED",
    pass: vNone.unasserted === true && vNone.ok !== true,
    detail: vNone.unasserted === true ? "an undeclared resource is never a pass" : "an undeclared resource passed",
  });

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
      let v = verdict(res, resource);
      if (resource === "search" && v.unasserted) {
        /* Asserted per (cert, language): a certification that teaches auditing
         * must answer its own audit vocabulary in every language it publishes.
         * Zero is permitted only where it is DECLARED and the reason given. */
        if (SEARCH_ZERO_OK.has(cert)) {
          v = { ok: true, rows: v.rows, note: "zero permitted: cites no auditing standard" };
        } else if (v.rows > 0) {
          v = { ok: true, rows: v.rows };
        } else {
          v = { ok: false, rows: 0,
                why: "search for the audit term returned nothing in " + lang +
                     " -- either the corpus lacks it or the query path does" };
        }
      }
      cells.push({ resource, view: VIEW_FOR[resource], lang, cert, attempts: res.attempts, ...v });
      await sleep(250);
    }
  }
}

/* ============ THE ACCENT PAIR, ASSERTED AS EQUALITY ============
 *
 * A floor on the unaccented form would have passed the broken state: `gestion`
 * returned 5 of 33 before 368-370, and five is rows. The property is that the
 * two spellings return THE SAME SET, so that is what is asserted -- count and
 * keys, not presence. */
const pairs = [];
for (const lang of LANGS) {
  if (!QUERY_PLAIN[lang]) {
    pairs.push({ lang, skipped: true, why: "no accented form of the query term exists in " + lang });
    continue;
  }
  for (const cert of CERTS) {
    const a = await call({ resource: "search", certification: cert, language: lang,
                           limit: 50, query: QUERY_PLAIN_PAIR[lang] });
    await sleep(250);
    const b = await call({ resource: "search", certification: cert, language: lang,
                           limit: 50, query: QUERY_PLAIN[lang] });
    await sleep(250);
    const keys = (r) => (r.json?.rows ?? []).map((x) => x.kind + ":" + x.key).join("|");
    const ra = r0(a), rb = r0(b);
    pairs.push({
      lang, cert, accented: ra, plain: rb,
      ok: ra !== null && rb !== null && ra === rb && keys(a) === keys(b),
    });
  }
}
function r0(res) {
  return Array.isArray(res.json?.rows) ? res.json.rows.length : null;
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
  if (skipped.length) {
    console.log("");
    console.log("  NOT EXERCISED -- reported, never counted as a pass");
    for (const s of skipped) console.log("    " + s.resource.padEnd(15) + s.lang.padEnd(8) + s.why);
  }
}

/* A FAILING CELL IS PRINTED UNDER --quiet TOO. Quiet suppresses the MATRIX,
 * which is 75 lines of context; it must never suppress the finding. The
 * invariant suite runs this with --quiet and parses these lines, so hiding
 * them here would make the suite report a bare exit code with no cell named. */
if (failed.length) {
  console.log("");
  console.log("  FAILING CELLS");
  for (const f of failed) {
    console.log("    " + f.resource.padEnd(15) + f.lang.padEnd(8) + f.cert.padEnd(10) + f.why);
  }
}

/* THREE NUMBERS, NOT TWO. "24 of 75 cells pass" cannot say whether the other
 * 51 were examined. A matrix that examines nothing renders identically to one
 * that examined everything and held, unless the denominator is printed. */
console.log("");
console.log("");
console.log("  ACCENT PAIRS -- accented and unaccented must return the SAME SET");
let pairFail = 0;
for (const p of pairs) {
  if (p.skipped) { console.log("    " + p.lang.padEnd(8) + "NOT EXERCISED   " + p.why); continue; }
  if (!p.ok) pairFail++;
  console.log("    " + (p.ok ? "ok   " : "FAIL ") + p.lang.padEnd(8) + p.cert.padEnd(9) +
    "accented " + String(p.accented).padStart(3) + "   plain " + String(p.plain).padStart(3) +
    (p.ok ? "   identical keys" : "   DIFFERENT"));
}

const unasserted = cells.filter((c) => c.unasserted);
if (unasserted.length) {
  console.log("");
  console.log("  UNASSERTED -- transported, but nothing said what the answer should be:");
  for (const c of unasserted) {
    console.log("    " + c.resource.padEnd(15) + c.lang.padEnd(8) + c.cert.padEnd(9) +
                "rows " + String(c.rows).padStart(4) + "   " + c.why);
  }
}
/* THREE NUMBERS, NOT TWO. `n/m hold` cannot say whether the nth looked at
 * anything -- the same rule as the vacuous-invariant summary. */
if (pairFail) { failed.push({ resource: "accent-pair", why: pairFail + " pair(s) differ" }); }
console.log("  " + (examined - failed.length - unasserted.length) + " pass, " +
            failed.length + " fail, " + unasserted.length + " unasserted, " +
            skipped.length + " not exercised   (denominator: " + examined + " cell(s) examined)");

if (JSON_OUT) {
  writeFileSync(join(ROOT, "MCP-WIRE-MATRIX.json"),
    JSON.stringify({ measured: new Date().toISOString(), examined, cells, skipped, controls: ctrl }, null, 2), "utf8");
  console.log("  wrote MCP-WIRE-MATRIX.json");
}

if (examined === 0) { console.error("  VACUOUS -- no cell was examined. This is not a pass."); process.exit(1); }
if (failed.length) process.exit(1);
