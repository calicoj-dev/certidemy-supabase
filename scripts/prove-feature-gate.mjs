#!/usr/bin/env node
/**
 * prove-feature-gate.mjs - make the revocation gate refuse, then work again.
 *
 * WRITES. `--apply` to run for real; dry by default, per the convention in
 * CLAUDE.md. Unknown flags exit 2.
 *
 *   CERTIDEMY_PROBE_KEY=cdk_... node scripts/prove-feature-gate.mjs --apply
 *
 * ============ WHY THIS EXISTS ============
 *
 * Migration 331 turned lesson entitlement from grant-by-exception into
 * revoke-by-exception: a new partner works because NO ROW EXISTS for them, and
 * a row in `company_feature_disables` is what takes it away. 331's own
 * post-conditions proved `mcp.feature_status` in SQL.
 *
 * NOTHING HAD EVER PROVED THE REFUSAL THROUGH THE FUNCTION. The second gate in
 * courseware-read was written, type-checked and deployed without any request
 * ever being refused by it -- and a gate that has never refused anything is
 * indistinguishable from an `if` that cannot fire. Same shape as the eslint
 * config nobody could open and the proconfig predicate that matched no function
 * anywhere: A GREEN RESULT CARRIES NO INFORMATION UNLESS SOMETHING PROVES THE
 * CHECK RAN.
 *
 * ============ THE TWO CREDENTIALS REACH DIFFERENT GATES ============
 *
 * This is the finding the first run produced, and it is why the script takes
 * two credentials rather than one.
 *
 *   OAUTH TOKEN. `mcp.resolve_oauth_caller` (331) computes scopes as the
 *   feature vocabulary MINUS this company's active disables. A disabled feature
 *   is therefore ABSENT FROM THE SCOPE ARRAY, and the refusal happens at the
 *   SCOPE check -- "this credential is not scoped for X". The feature gate
 *   below it never executes on this path.
 *
 *   API KEY. `mcp.resolve_api_key` (323) returns the key's own stored `scopes`
 *   column, which knows nothing about disables and does not change when one is
 *   written. The scope check PASSES. The feature gate is the only thing that
 *   refuses -- "X is unavailable for this issuer".
 *
 * So the two 403s carry DIFFERENT MESSAGES, and that difference is the evidence
 * of which gate fired. Running only the token would have left the feature gate
 * as untested as it was before this script existed, while reporting a pass --
 * because the revocation genuinely works on that path, for another reason.
 *
 * AND IT IS THE KEY PATH THAT MATTERS COMMERCIALLY. A partner holding an issued
 * API key is the caller a revocation has to stop. The token path is stopped by
 * arithmetic; the key path is stopped by this gate and nothing else.
 *
 * ============ THE THREE MEASUREMENTS, AND WHY IT IS THREE ============
 *
 *   1. BEFORE   each credential reads a lesson body          -> 200 + content
 *   2. DISABLED the same credentials, unchanged, are refused -> 403
 *   3. AFTER    restored, both read again                    -> 200 + content
 *
 * Step 3 is not a formality. A refusal proves nothing unless something proves
 * THE ENDPOINT STILL SERVES, because a broken deployment refuses everything --
 * `smoke-paywall.mjs` is the worked example and this follows it. Step 1 is the
 * other control: without it, step 2 could be a credential that never worked, an
 * expired token, or a lesson slug that does not exist.
 *
 * Steps 1 and 3 assert CONTENT, not status. HTTP 200 with `rows: 0` once
 * printed "the second way in works" in probe-oauth-lesson.mjs, and the first
 * run of THIS script hit the same empty result on a slug that does not exist.
 * The content assertion is what caught it.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--apply", "--slug", "--cert", "--issuer", "--feature"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ".");
    console.error("THIS SCRIPT IS THE --apply FAMILY: dry by default, --apply writes.");
    console.error("(The other family in this directory is --dry, which defaults to LIVE.)");
    console.error("The API key is passed as CERTIDEMY_PROBE_KEY in the environment, not as a flag.");
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : d;
};
const APPLY = process.argv.includes("--apply");
const SLUG = arg("slug", "01-01-agile-manifesto");
const CERT = arg("cert", "SM-AI-I");
const ISSUER_SLUG = arg("issuer", "test-partner-02");
const FEATURE = arg("feature", "courseware:lessons");

const HERE = dirname(fileURLToPath(import.meta.url));
const ENV = join(HERE, ".env");
if (existsSync(ENV)) {
  for (const line of readFileSync(ENV, "utf8").split(/\r?\n/)) {
    const m = /^([A-Z_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SVC) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is not set");
  process.exit(2);
}

const BASE = "https://pctynukndxnmnxiqpgck.supabase.co";
const REST = BASE + "/rest/v1";
const EP = BASE + "/functions/v1/courseware-read";

/* ----------------------------------------------------- the two credentials */
const creds = [];
const statePath = join(HERE, ".probe-mcp-audience.json");
if (existsSync(statePath)) {
  const tok = JSON.parse(readFileSync(statePath, "utf8")).access_token;
  if (tok) {
    creds.push({
      kind: "token",
      header: "x-certidemy-token",
      value: tok,
      // What refusing it is expected to look like, and WHY. Asserted, not
      // described: a message that changes is a gate that moved.
      expectGate: "scope",
      expectMsg: "this credential is not scoped for " + FEATURE,
      why: "resolve_oauth_caller subtracts active disables from the scope array",
    });
  }
}
if (process.env.CERTIDEMY_PROBE_KEY) {
  creds.push({
    kind: "key",
    header: "x-certidemy-key",
    value: process.env.CERTIDEMY_PROBE_KEY,
    expectGate: "feature",
    expectMsg: FEATURE + " is unavailable for this issuer",
    why: "resolve_api_key returns the key's stored scopes, which a disable does not touch",
  });
}
if (!creds.length) {
  console.error("No credential. Need scripts/.probe-mcp-audience.json with an access_token,");
  console.error("and/or CERTIDEMY_PROBE_KEY set to a plaintext issuer API key.");
  process.exit(2);
}

/* DNS on this workstation is unreliable against this host. Retry rather than
 * report a transport failure as a gate result: a ConnectTimeoutError in the
 * middle of step 2 would read as "refused", which is the answer we want and
 * therefore the one we must not accept from the wrong cause. */
async function hit(url, init, label) {
  let last;
  for (let i = 0; i < 12; i++) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(45000) });
    } catch (e) {
      last = e;
    }
  }
  throw new Error(label + ": unreachable after 12 attempts (" + (last?.cause?.code ?? last?.name) + ")");
}

const svcHeaders = { apikey: SVC, Authorization: "Bearer " + SVC, "content-type": "application/json" };

async function rest(path, init) {
  const r = await hit(REST + path, { ...init, headers: { ...svcHeaders, ...(init?.headers ?? {}) } }, path);
  const t = await r.text();
  if (!r.ok) throw new Error(path + " -> " + r.status + " " + t.slice(0, 200));
  return t ? JSON.parse(t) : null;
}

/** One lesson read on one credential. Status, content and latency. */
async function readLesson(cred, step) {
  const t0 = Date.now();
  const r = await hit(
    EP,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        [cred.header]: cred.value,
        // Synthetic traffic is marked. Probe rows in mcp_requests were read as
        // real evidence three times in one session before this header existed.
        "x-mcp-client": "probe:feature-gate/" + cred.kind + "/" + step,
      },
      body: JSON.stringify({ resource: "lesson", certification: CERT, language: "en", lesson_slug: SLUG }),
    },
    "lesson:" + cred.kind + ":" + step,
  );
  const ms = Date.now() - t0;
  const text = await r.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch { /* keep the text */ }
  const rows = Array.isArray(json?.rows) ? json.rows : [];
  const blocks = Array.isArray(rows[0]?.blocks) ? rows[0].blocks : [];
  const chars = blocks.reduce((n, b) => n + String(b?.text ?? "").length, 0);
  return {
    status: r.status,
    ms,
    rows: rows.length,
    blocks: blocks.length,
    chars,
    error: String(json?.error ?? text.slice(0, 160)),
  };
}

const checks = [];
const check = (name, ok, detail) => {
  checks.push({ name, ok, detail });
  console.log("  " + (ok ? "ok  " : "FAIL") + "  " + name + "  -- " + detail);
};

console.log("");
console.log("issuer " + ISSUER_SLUG + " / feature " + FEATURE + " / " + CERT + " " + SLUG);
console.log("credentials: " + creds.map((c) => c.kind).join(" + "));
console.log(APPLY ? "MODE: apply -- writes a disable row and removes it again" : "MODE: dry -- nothing will be written");
if (creds.length === 1) {
  console.log("");
  console.log("  ONLY ONE CREDENTIAL. The two reach DIFFERENT gates (see the header),");
  console.log("  so a pass here is evidence about one of them and silent about the other.");
}
console.log("");

const [issuer] = await rest("/issuers?select=id,slug,company_id,status&slug=eq." + ISSUER_SLUG);
if (!issuer) {
  console.error("no issuer " + ISSUER_SLUG);
  process.exit(2);
}
if (!issuer.company_id) {
  console.error("issuer " + ISSUER_SLUG + " has no company_id; the gate keys on the company");
  process.exit(2);
}
console.log("  issuer " + issuer.id + "  company " + issuer.company_id + "  status " + issuer.status);

const pre = await rest(
  "/company_feature_disables?select=feature_key,disabled_at,restored_at&company_id=eq." + issuer.company_id,
);
console.log("  existing disable rows for this company: " + pre.length);
for (const r of pre) {
  console.log("    " + r.feature_key + "  disabled " + r.disabled_at + "  restored " + (r.restored_at ?? "-"));
}
if (pre.find((r) => r.feature_key === FEATURE)) {
  console.error("");
  console.error("A row for " + FEATURE + " already exists on this company. Refusing: this");
  console.error("script would overwrite a real revocation and then delete it, which is a");
  console.error("commercial act disguised as a test. Resolve that row by hand first.");
  process.exit(2);
}

if (!APPLY) {
  console.log("");
  console.log("Dry run. Re-run with --apply to make the gate refuse and then restore it.");
  process.exit(0);
}

/* ------------------------------------------------ 1. BEFORE: it must work */
console.log("");
console.log("1. BEFORE -- no disable row exists, so the default in the schema applies");
const before = {};
for (const c of creds) {
  const r = await readLesson(c, "before");
  before[c.kind] = r;
  console.log(
    "   " + c.kind.padEnd(5) + " HTTP " + r.status + "  " + r.ms + "ms  rows " + r.rows +
    "  blocks " + r.blocks + "  chars " + r.chars,
  );
  check(
    c.kind + ": reads a lesson body before anything is disabled",
    r.status === 200 && r.rows === 1 && r.chars > 200,
    r.status === 200 ? r.chars + " characters" : "HTTP " + r.status + ": " + r.error,
  );
}
if (creds.some((c) => before[c.kind].status !== 200 || before[c.kind].chars <= 200)) {
  console.error("");
  console.error("STOPPING. A credential does not work before anything was disabled, so a");
  console.error("refusal in step 2 would prove nothing. Nothing has been written.");
  process.exit(1);
}

/* --------------------------------------------------- 2. DISABLED: refuse */
console.log("");
console.log("2. DISABLED -- one row inserted, nothing else changed");
await rest("/company_feature_disables", {
  method: "POST",
  headers: { Prefer: "return=representation" },
  body: JSON.stringify({
    company_id: issuer.company_id,
    feature_key: FEATURE,
    reason: "prove-feature-gate.mjs -- synthetic, restored seconds later",
  }),
});

const during = {};
try {
  for (const c of creds) {
    const r = await readLesson(c, "disabled");
    during[c.kind] = r;
    console.log("   " + c.kind.padEnd(5) + " HTTP " + r.status + "  " + r.ms + "ms  " + r.error);
    check(
      c.kind + ": the same credential is now refused",
      r.status === 403,
      r.status === 403 ? r.error : "HTTP " + r.status + " -- nothing refused it",
    );
    // WHICH gate. The message is the only thing that distinguishes them, and a
    // change in it means the refusal moved to a different line of code.
    check(
      c.kind + ": refused at the " + c.expectGate + " gate (" + c.why + ")",
      r.error === c.expectMsg,
      r.error === c.expectMsg ? "exact message" : "expected " + JSON.stringify(c.expectMsg),
    );
  }
} finally {
  /* The restore runs even if step 2 threw. Leaving a partner disabled because
   * a probe crashed is the one outcome this script must not produce. */
  console.log("");
  console.log("3. RESTORED -- restored_at set");
  await rest(
    "/company_feature_disables?company_id=eq." + issuer.company_id + "&feature_key=eq." + FEATURE,
    { method: "PATCH", body: JSON.stringify({ restored_at: new Date().toISOString() }) },
  );
}

for (const c of creds) {
  const r = await readLesson(c, "restored");
  console.log(
    "   " + c.kind.padEnd(5) + " HTTP " + r.status + "  " + r.ms + "ms  rows " + r.rows +
    "  blocks " + r.blocks + "  chars " + r.chars,
  );
  check(
    c.kind + ": the endpoint serves it again",
    r.status === 200 && r.rows === 1 && r.chars > 200,
    r.status === 200 ? r.chars + " characters" : "HTTP " + r.status + ": " + r.error,
  );
  check(
    c.kind + ": the same bytes came back before and after",
    before[c.kind].chars === r.chars,
    before[c.kind].chars + " then " + r.chars,
  );
}

/* The synthetic row is removed. It records a test, not a commercial decision,
 * and `company_feature_disables` is read by humans deciding what a partner is
 * entitled to. The evidence lives in this script's output. */
await rest(
  "/company_feature_disables?company_id=eq." + issuer.company_id + "&feature_key=eq." + FEATURE,
  { method: "DELETE" },
);
const post = await rest("/company_feature_disables?select=feature_key&company_id=eq." + issuer.company_id);
check("the synthetic row is gone", post.length === pre.length, post.length + " row(s), started at " + pre.length);

console.log("");
console.log("LATENCY -- client-side round trip, this workstation's network included.");
console.log("  The gate's OWN cost is `feature_ms` in the function log, which is the only");
console.log("  place it can be read without this workstation's latency on top.");
for (const c of creds) {
  console.log(
    "  " + c.kind.padEnd(5) + " before " + before[c.kind].ms + "ms   disabled " +
    (during[c.kind] ? during[c.kind].ms : "-") + "ms",
  );
}

const failed = checks.filter((c) => !c.ok);
console.log("");
console.log("passed " + (checks.length - failed.length) + "   failed " + failed.length);
for (const f of failed) console.log("  X " + f.name + ": " + f.detail);
console.log(failed.length
  ? "THE GATE IS NOT PROVEN."
  : "Both gates refused a working credential and gave it back. They are gates.");
process.exitCode = failed.length ? 1 : 0;
