#!/usr/bin/env node
/**
 * smoke-paywall.mjs - can an unauthenticated HTTP caller obtain a lesson body?
 *
 * READ-ONLY. No --apply, no --dry, no database connection. It makes requests and
 * reads answers. Unknown flags exit 2.
 *
 *   node scripts/smoke-paywall.mjs
 *   CERTIDEMY_KEY='<scoped key>' node scripts/smoke-paywall.mjs
 *
 * ===================== WHY THIS EXISTS SEPARATELY =====================
 *
 * smoke-courseware.mjs section B2 asserts that get_lesson returns parsed blocks
 * and no answer keys, and it passed 37 of 37. IT PROVED THE GRANT, NOT THE
 * PAYWALL.
 *
 * It calls the function the same way a caller does -- and the function holds
 * BOTH credentials, the reader and the holder. So every request it made was
 * already authorised by construction. It could not have distinguished "the
 * paywall works" from "there is no paywall": both produce a lesson body when
 * the caller is the function itself.
 *
 * A test of an access boundary has to be made FROM OUTSIDE IT. Everything below
 * is an unauthorised request that must fail, plus the two things that make a
 * failure meaningful.
 *
 * ===================== WHY A REFUSAL ALONE PROVES NOTHING =====================
 *
 * "All eight unauthorised requests were refused" is the result a completely
 * broken deployment produces. A wrong URL, an expired project, a function that
 * 500s on every body, a typo in the lesson slug -- each of them refuses
 * everything, and each of them passes a test that only checks for refusals.
 *
 * So two controls run first and are HARD REQUIREMENTS, not extras:
 *
 *   ALIVE     list_lessons UNAUTHENTICATED must return a real catalogue. The
 *             endpoint is up, serving, and reachable at this URL -- so every
 *             refusal below is a refusal and not an outage. This is also the
 *             one assertion that the paid boundary has not swallowed the free
 *             tier: migration 322 makes the catalogue public on purpose.
 *
 *   SERVES    get_lesson WITH a scoped key must return a real body. Without it,
 *             "no body was served" is true of a function that serves no bodies
 *             to anyone. Needs CERTIDEMY_KEY; when it is absent this section
 *             reports UNTESTED and the script says so in its verdict. IT IS
 *             NEVER COUNTED AS A PASS -- an untested control is the thing that
 *             let the original claim stand.
 *
 * ===================== WHAT COUNTS AS A LEAK =====================
 *
 * Not the status code. A 200 with an error body is fine; a 403 carrying lesson
 * prose is a leak. Every unauthorised response is walked in full and fails if it
 * contains ANY of:
 *
 *   - a key named blocks, frontmatter, content_md, omitted, hook, concept,
 *     callout or summary, at any depth;
 *   - a string longer than LEAK_CHARS, anywhere, at any depth. Teaching prose is
 *     long and refusal messages are short, so length is the property that does
 *     not depend on knowing the shape of a body in advance -- and it keeps
 *     working if the parser's field names change.
 *
 * The second one is the point: the first is a denylist and would be blind to a
 * future field, which is the failure this repo has recorded against denylists
 * more than once.
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

const KNOWN = new Set(["--url", "--mcp", "--slug", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error(`Unrecognised flag: ${a}.`);
    console.error("READ-ONLY; it writes nothing. Known flags: --url, --mcp, --slug, --verbose.");
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
const MCP = arg("mcp", process.env.MCP_URL ?? "https://certidemy.com/mcp");

/** A real scoped key, for the SERVES control. Absent is normal and reported. */
const KEY = process.env.CERTIDEMY_KEY ?? "";
/** A key WITHOUT courseware:lessons, for the 403 case. Optional. */
const KEY_UNSCOPED = process.env.CERTIDEMY_KEY_UNSCOPED ?? "";

const LEAK_CHARS = 400;
const LEAK_KEYS = new Set([
  "blocks", "frontmatter", "content_md", "omitted",
  "hook", "concept", "callout", "summary",
]);

/* ----------------------------------------------------------------- harness */

let passed = 0;
const failures = [];
const untested = [];

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
function skip(name, why) {
  untested.push(`${name} -- ${why}`);
  console.log(`  UNTESTED  ${name}`);
  console.log(`            ${why}`);
}

/**
 * Walks the WHOLE value, not the top level. A body nested under `result` or
 * `structuredContent` is still a body, and the MCP envelope nests twice.
 */
function findLeak(value, path = "$") {
  if (typeof value === "string") {
    if (value.length > LEAK_CHARS) {
      return `${path} is a ${value.length}-character string: ${JSON.stringify(value.slice(0, 80))}...`;
    }
    return null;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = findLeak(value[i], `${path}[${i}]`);
      if (hit) return hit;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (LEAK_KEYS.has(k)) return `${path}.${k} is present`;
      const hit = findLeak(v, `${path}.${k}`);
      if (hit) return hit;
    }
  }
  return null;
}

/**
 * A TRANSPORT FAILURE IS NOT A REFUSAL, and returning one as `{status: 0}` here
 * is what keeps that true downstream. An unreachable host refuses everything,
 * which is precisely the reading this script exists to rule out -- so callers
 * check `reached` and report UNTESTED rather than counting a timeout as proof
 * that the paywall held.
 */
async function post(url, body, headers = {}) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-mcp-client": "probe:smoke-paywall", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* a non-JSON body is still evidence */ }
    if (VERBOSE) console.log(`        <- ${res.status} ${text.slice(0, 200)}`);
    return { reached: true, status: res.status, text, json };
  } catch (e) {
    const why = e?.cause?.code ?? e?.name ?? String(e);
    if (VERBOSE) console.log(`        <- unreachable: ${why}`);
    return { reached: false, status: 0, text: "", json: null, why };
  }
}

const fnLesson = (extra = {}, headers = {}) =>
  post(ENDPOINT, { resource: "lesson", language: "en", lesson_slug: SLUG, ...extra }, headers);

/**
 * The per-request `_meta` is MANDATORY on this server -- it answers -32602
 * without clientCapabilities, deliberately, and a smoke test that omitted it
 * would read every refusal as the paywall working when it is the handshake
 * failing. Sent in full so the only thing under test is authorization.
 */
const mcpCall = (name, args, headers = {}) =>
  post(MCP, {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name,
      arguments: args,
      _meta: {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientInfo": { name: "smoke-paywall", version: "1" },
        "io.modelcontextprotocol/clientCapabilities": {},
      },
    },
  }, {
    accept: "application/json, text/event-stream",
    "mcp-protocol-version": "2026-07-28",
    "mcp-method": "tools/call",
    ...headers,
  });

/**
 * A REFUSAL IS TWO PROPERTIES, AND CHECKING ONE IS HOW A LEAK PASSES.
 * The status must not be a success AND the payload must carry no body. A 403
 * with prose in it is worse than a 200, because it reads as a working paywall.
 */
function refused(label, res) {
  if (!res.reached) {
    skip(label, `the endpoint was not reached (${res.why}); a timeout refuses everything`);
    return;
  }
  const served = res.status >= 200 && res.status < 300;
  const leak = findLeak(res.json ?? res.text);
  if (served && leak === null) {
    // Success with nothing in it: still wrong. The endpoint should say no.
    record(label, false, `HTTP ${res.status} with no refusal; expected 401 or 403`);
    return;
  }
  if (leak !== null) {
    record(label, false, `HTTP ${res.status} LEAKED: ${leak}`);
    return;
  }
  if (served) {
    record(label, false, `HTTP ${res.status}; expected a refusal`);
    return;
  }
  record(label, true, null);
}

/* -------------------------------------------------------------------- run */

let SLUG = arg("slug", "");

console.log("");
console.log(`function : ${ENDPOINT}`);
console.log(`mcp      : ${MCP}`);
console.log(`key      : ${KEY ? "present" : "ABSENT -- the SERVES control cannot run"}`);
console.log("");

/* ---- CONTROL 1: ALIVE. The free tier answers, so a refusal means refused. -- */

console.log("CONTROL -- the endpoint is alive and the free tier is not walled off");
{
  const res = await post(ENDPOINT, { resource: "lesson_index", language: "en", limit: 5 });
  const rows = res.json?.rows;
  const ok = res.reached && res.status === 200 && Array.isArray(rows) && rows.length > 0;
  record(
    "list_lessons unauthenticated returns a catalogue",
    ok,
    `HTTP ${res.status}, rows=${Array.isArray(rows) ? rows.length : "none"} -- ` +
      "if this fails, every refusal below is an outage rather than a boundary"
  );
  if (ok && !SLUG) {
    SLUG = rows[0].lesson_slug;
    console.log(`        slug under test: ${SLUG}`);
  }
  // AND THE CATALOGUE ITSELF MUST NOT CARRY A BODY. The paywall is a column
  // boundary, so this is the assertion that the view still omits content_md.
  const leak = findLeak(res.json);
  record("the public catalogue carries no lesson body", leak === null, `leaked: ${leak}`);
}

if (!SLUG) {
  console.log("");
  console.log("Cannot continue: no lesson slug. Pass --slug or fix the control above.");
  process.exit(1);
}

/* ---- CONTROL 2: SERVES. An authorised caller gets a real body. ------------ */

console.log("");
console.log("CONTROL -- an authorised caller DOES get a body");
if (!KEY) {
  skip(
    "get_lesson with a scoped key returns blocks",
    "CERTIDEMY_KEY is not set. Every refusal below is therefore consistent with " +
      "a function that serves no lesson to anyone, which is the hypothesis this " +
      "control exists to eliminate. Set CERTIDEMY_KEY to a key scoped " +
      "courseware:lessons and re-run before believing the verdict."
  );
} else {
  const res = await fnLesson({}, { "x-certidemy-key": KEY });
  const row = res.json?.rows?.[0];
  const blocks = row?.blocks;
  const ok = res.status === 200 && Array.isArray(blocks) && blocks.length > 0;
  record(
    "get_lesson with a scoped key returns blocks",
    ok,
    `HTTP ${res.status}, blocks=${Array.isArray(blocks) ? blocks.length : "none"}`
  );
  // The positive control must also not be a false positive in the other
  // direction: a body is expected here, so the leak detector is proven to WORK
  // by firing on it. A detector that never fires is not evidence.
  const leak = findLeak(res.json);
  record(
    "the leak detector fires on a real body",
    leak !== null,
    "an authorised lesson body did not trip the detector, so its silence below proves nothing"
  );
}

/* ---- THE PROPERTY: the function, reached directly ------------------------ */

console.log("");
console.log("DIRECT -- functions/courseware-read, the way an attacker reaches it");
refused("no credential at all", await fnLesson());
refused("a garbage key", await fnLesson({}, { "x-certidemy-key": "not-a-real-key" }));
refused("an empty key header", await fnLesson({}, { "x-certidemy-key": "" }));
refused(
  "a 64-hex string, the shape of a hash rather than a key",
  await fnLesson({}, { "x-certidemy-key": "0".repeat(64) })
);

// THE ONE THIS WHOLE DESIGN IS ABOUT. A caller asserting the scope it wants,
// with no key behind it. If the function believed a field, this is the request
// that would have worked.
refused(
  "a forged scope header and no key",
  await fnLesson({}, { "x-certidemy-scope": "courseware:lessons" })
);
refused(
  "a forged scope field in the body",
  await fnLesson({ scope: "courseware:lessons", authorized: true })
);
refused(
  "a forged scope header WITH a garbage key",
  await fnLesson({}, { "x-certidemy-key": "nope", "x-certidemy-scope": "courseware:lessons" })
);

if (KEY) {
  // A VALID KEY WITH A LIE ATTACHED. The cross-check must refuse rather than
  // take the header's word over the key's row.
  refused(
    "a valid key with a scope header claiming more",
    await fnLesson({}, {
      "x-certidemy-key": KEY,
      "x-certidemy-scope": "courseware:lessons credentials:issue courseware:assessments",
    })
  );
}

if (KEY_UNSCOPED) {
  refused(
    "a valid key without courseware:lessons",
    await fnLesson({}, { "x-certidemy-key": KEY_UNSCOPED })
  );
} else {
  skip(
    "a valid key without courseware:lessons is refused",
    "CERTIDEMY_KEY_UNSCOPED is not set. The in-scope and out-of-scope branches " +
      "are different code paths and only one of them is exercised."
  );
}

/* ---- THE PROPERTY: through the Worker, the way an agent reaches it -------- */

console.log("");
console.log("MCP -- the /mcp endpoint, the way a partner's agent reaches it");
// The MCP envelope answers 200 with isError:true, which is correct protocol --
// so `refused()` does not apply here and the payload is the whole evidence.
const mcpRefusal = async (label, headers) => {
  const res = await mcpCall("get_lesson", { lesson_slug: SLUG, language: "en" }, headers);
  if (!res.reached) {
    skip(label, `the endpoint was not reached (${res.why}); a timeout refuses everything`);
    return;
  }
  const isError = res.json?.result?.isError === true;
  const leak = findLeak(res.json);
  record(`${label} is an error`, isError, `HTTP ${res.status}: ${res.text.slice(0, 200)}`);
  record(`${label} carries no body`, leak === null, `leaked: ${leak}`);
};

await mcpRefusal("get_lesson with no Authorization", {});
await mcpRefusal("get_lesson with a garbage bearer", { authorization: "Bearer not-a-real-key" });
await mcpRefusal("get_lesson with a bearer that is only whitespace", { authorization: "Bearer    " });

{
  // THE FREE TIER OVER MCP TOO. The same both-directions discipline: proving
  // bodies are refused is only half the property if the catalogue broke, and a
  // Worker that errors on everything would otherwise read as a working paywall.
  const res = await mcpCall("list_lessons", { language: "en", limit: 5 });
  if (!res.reached) {
    skip("list_lessons over MCP needs no Authorization", `not reached (${res.why})`);
  } else {
    const ok = res.json?.result?.isError === false;
    record("list_lessons over MCP needs no Authorization", ok,
      `HTTP ${res.status}: ${res.text.slice(0, 200)}`);
  }
}

/* ------------------------------------------------------------------ verdict */

console.log("");
console.log(`passed:   ${passed}`);
console.log(`failed:   ${failures.length}`);
console.log(`untested: ${untested.length}`);
for (const f of failures) console.log(`  X ${f}`);

if (untested.length > 0) {
  console.log("");
  console.log("UNTESTED IS NOT PASSED. The refusals above are consistent with a");
  console.log("boundary that works and with one that serves nobody at all, and");
  console.log("these are the checks that tell those two apart:");
  for (const u of untested) console.log(`  ? ${u}`);
}

console.log("");
if (failures.length > 0) {
  console.log("PAYWALL FAILED.");
} else if (untested.length > 0) {
  console.log("No unauthorised request obtained a lesson body -- but the controls");
  console.log("that make that meaningful did not all run. Not a clean result.");
} else {
  console.log("No unauthorised request obtained a lesson body, and an authorised one did.");
}
process.exit(failures.length === 0 ? 0 : 1);
