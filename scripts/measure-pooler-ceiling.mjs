#!/usr/bin/env node
/**
 * measure-pooler-ceiling.mjs -- how much reading the catalogue can a partner do.
 *
 * READ-ONLY against the deployed endpoint. Writes nothing. Unknown flags exit 2.
 *
 * ============ WHY ============
 *
 * 75 sequential unauthenticated reads exhausted the pooler and the endpoint
 * answered {"error":"read failed"} -- the same string it uses for a permission
 * defect. That is not an artifact of a test harness. It is the shape of an
 * agent walking the catalogue, and it will be hit by someone who did not mean
 * to.
 *
 * MEASURED, NOT REASONED ABOUT -- AND THE FIRST RUN OF THIS SCRIPT PRODUCED A
 * FINDING THAT DID NOT SURVIVE ITS OWN CONTROL.
 *
 * It reported: 120 unpaced calls fine, then the 180-call catalogue sweep
 * failing 39 times, and concluded that PACING was the variable and that a
 * partner could not read the whole catalogue. Both halves were wrong.
 *
 * Phase B differed from phase A in TWO ways -- pacing AND resource mix -- and
 * in a third nobody had written down: it began 45 seconds after phase A's
 * burst, while every later run got 90. Re-measured with the rest matched:
 *
 *     same 180-call mix, UNPACED,   90s rest    180/180
 *     same 180-call mix, 250ms,     90s rest    180/180
 *     same 180-call mix, 250ms,     90s rest    180/180   (repeat)
 *     same 180-call mix, 250ms,     45s rest    141/180, 37 x 503
 *
 * So the sweep completes, paced or not. What it cannot do is start while a
 * previous burst is still draining. THE VARIABLE IS RECOVERY TIME, and the
 * original phase B was measuring its own predecessor.
 *
 * REST IS NOW PART OF THE METHOD, not something that happens to have elapsed.
 * Every phase is preceded by the same REST_MS, because a phase that inherits
 * the previous phase's pressure is measuring the wrong thing and says so in
 * no way the output can show.
 *
 * ============ WHAT BINDS, STATED SO THE NUMBER CAN BE READ ============
 *
 * courseware-read builds `new Pool({...}, 2, true)` -- two connections per
 * ISOLATE, lazily. Sequential requests do not need more than two connections;
 * they need more than two ISOLATES, and an evicted isolate's connections
 * linger (the pgbouncer log shows `client unexpected eof (age=100s)`).
 *
 * So the bound is LIVE ISOLATES x 2, not requests per second -- which is why
 * 120 unpaced calls against one cheap resource pass (one hot isolate, two
 * connections, reused) and why a burst leaves connections draining for around
 * a minute and a half after it ends.
 *
 * IT ALSO MEANS "TELL PARTNERS TO SLOW DOWN" IS NOT THE FIX AND MAY BE THE
 * OPPOSITE OF IT: a slower client keeps an isolate idle between calls, and an
 * evicted isolate's replacement opens a fresh pool. Measured, pacing changed
 * nothing at 180 calls. The open question is the exact recovery threshold --
 * 45s is not enough and 90s is; the run that would have narrowed it exceeded
 * the time budget and the number is NOT guessed here.
 */
const KNOWN = new Set(["--json", "--skip-a"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY; takes --json and --skip-a.");
    process.exit(2);
  }
}
const SKIP_A = process.argv.includes("--skip-a");

/* THE REST BETWEEN PHASES IS THE CONTROL, not a courtesy. 45s was not enough
 * and produced this script's first, wrong finding; 90s was. */
const REST_MS = 90000;

const FN = "https://pctynukndxnmnxiqpgck.supabase.co/functions/v1/courseware-read";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* NO RETRY ANYWHERE IN THIS SCRIPT. Every other instrument here retries to
 * separate exhaustion from a real defect; this one is MEASURING exhaustion, so
 * a retry would hide the thing being measured. */
async function once(body) {
  try {
    const r = await fetch(FN, {
      method: "POST",
      headers: { "content-type": "application/json", "x-mcp-client": "measure-pooler-ceiling" },
      body: JSON.stringify(body), signal: AbortSignal.timeout(45000),
    });
    const text = await r.text();
    let json = null; try { json = JSON.parse(text); } catch { /* raw below */ }
    return { status: r.status, json, retryAfter: r.headers.get("retry-after") };
  } catch (e) { return { status: 0, json: null, err: String(e?.message || e) }; }
}

const CERTS = ["AIE-I", "AIGRM-I", "AIHR-I", "AIMS-F", "AIMS-IA", "AISM-I",
               "ISMS-F", "ISMS-IA", "SD-AI-I", "SM-AI-I", "SM-AI-II", "SPO-AI-I"];
const LANGS = ["en", "es-419", "pt-BR"];
const Q = { en: "risk", "es-419": "riesgo", "pt-BR": "risco" };

const report = { phaseA: null, phaseB: null, phaseC: null };

/* ---------------------------------------------------------------- PHASE A */
if (!SKIP_A) {
  console.log("");
  console.log("A. UNPACED, FROM COLD -- sequential calls until the first refusal");
  let first = null, n = 0, statuses = {};
  for (let i = 1; i <= 120; i++) {
    const r = await once({ resource: "certification", certification: CERTS[i % CERTS.length], language: "en" });
    statuses[r.status] = (statuses[r.status] || 0) + 1;
    n = i;
    if (r.status !== 200) {
      first = { at: i, status: r.status, body: r.json, retryAfter: r.retryAfter };
      break;
    }
  }
  if (first) {
    console.log("  first refusal at call " + first.at + "   HTTP " + first.status +
      "   " + JSON.stringify(first.body) + "   Retry-After: " + (first.retryAfter ?? "(absent)"));
  } else {
    console.log("  no refusal in " + n + " unpaced sequential calls");
  }
  console.log("  statuses: " + JSON.stringify(statuses));
  report.phaseA = { calls: n, first, statuses };
  console.log("  resting " + (REST_MS / 1000) + "s before phase B -- MATCHED, see the header");
  await sleep(REST_MS);
}

/* ---------------------------------------------------------------- PHASE B */
console.log("");
if (SKIP_A) await sleep(REST_MS);
console.log("B. A REALISTIC CATALOGUE SWEEP -- 12 certs x 3 languages x 5 public resources, 250ms apart");
{
  const statuses = {}; const failures = [];
  let calls = 0;
  const started = Date.now();
  for (const cert of CERTS) {
    for (const lang of LANGS) {
      for (const resource of ["certification", "task", "concept", "search", "lesson_index"]) {
        const body = { resource, certification: cert, language: lang };
        if (resource === "search") body.query = Q[lang];
        if (resource !== "certification") body.limit = 50;
        const r = await once(body);
        calls++;
        statuses[r.status] = (statuses[r.status] || 0) + 1;
        if (r.status !== 200) failures.push(resource + "/" + lang + "/" + cert + " -> " + r.status);
        await sleep(250);
      }
    }
  }
  const secs = Math.round((Date.now() - started) / 1000);
  console.log("  " + calls + " calls in " + secs + "s   statuses: " + JSON.stringify(statuses));
  if (failures.length) {
    console.log("  FAILURES (" + failures.length + "):");
    for (const f of failures.slice(0, 12)) console.log("    " + f);
    if (failures.length > 12) console.log("    ... and " + (failures.length - 12) + " more");
  } else {
    console.log("  the sweep COMPLETED with no refusal");
  }
  report.phaseB = { calls, seconds: secs, statuses, failures };
}

/* ---------------------------------------------------------------- PHASE C */
console.log("");
console.log("C. RECOVERY -- one call immediately, then after 5s, 15s, 30s");
{
  const marks = [0, 5000, 15000, 30000]; const seen = [];
  for (const m of marks) {
    if (m) await sleep(m - (seen.length ? marks[seen.length - 1] : 0));
    const r = await once({ resource: "certification", certification: "AISM-I", language: "en" });
    seen.push({ after_ms: m, status: r.status });
    console.log("  +" + String(m / 1000).padStart(3) + "s   HTTP " + r.status);
  }
  report.phaseC = seen;
}

if (process.argv.includes("--json")) {
  const { writeFileSync } = await import("node:fs");
  writeFileSync("POOLER-CEILING.json", JSON.stringify(report, null, 2), "utf8");
  console.log("");
  console.log("  wrote POOLER-CEILING.json");
}
