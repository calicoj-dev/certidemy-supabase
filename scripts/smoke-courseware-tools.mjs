#!/usr/bin/env node
/**
 * smoke-courseware-tools.mjs -- one unauthenticated call per tool, right after
 * a deploy.
 *
 * READ-ONLY. Unknown flags exit 2. Takes about thirty seconds.
 *
 * ============ WHY, AND IT IS NOT PREVENTION ============
 *
 * `extensions.unaccent` took every search down in every language and it was
 * found because background controls happened to be running. One call per tool
 * immediately after `functions deploy` would have found it in seconds.
 *
 * THE THING THAT MAKES AN OUTAGE CHEAP IS NOT PREVENTING EVERY ONE, IT IS
 * NOTICING IN TEN SECONDS RATHER THAN TEN MINUTES. This does not replace the
 * pre-deploy reachability gate; it catches what the gate cannot see, which is
 * everything that is not a privilege.
 *
 * ============ IT PRINTS THE ROLLBACK, NOT ONLY THE ERROR ============
 *
 * A smoke test that fails at 2am and prints a stack trace has told you the
 * wrong thing. The useful output of a failed post-deploy check is the command
 * that puts the previous version back.
 *
 * ============ ENGLISH ONLY, DELIBERATELY ============
 *
 * The point is reachability and transport, not content. A language matrix is
 * `check-mcp-wire.mjs` and it takes minutes. This must be short enough that
 * nobody skips it -- and the outage it was written for hit English too, which
 * is precisely what separated it from a translation-layer fault.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
}
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const FN = "https://pctynukndxnmnxiqpgck.supabase.co/functions/v1/courseware-read";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* One cell per resource. `rows > 0` is part of the assertion for all of them:
 * AIMS-IA has tasks, concepts, lessons and audit vocabulary, so a zero from any
 * of these is a finding. A smoke test that only asserts HTTP 200 would have
 * passed a function returning empty arrays. */
const CELLS = [
  { resource: "certification", body: { certification: "AIMS-IA", language: "en" } },
  { resource: "task",          body: { certification: "AIMS-IA", language: "en", limit: 5 } },
  { resource: "concept",       body: { certification: "AIMS-IA", language: "en", limit: 5 } },
  { resource: "search",        body: { certification: "AIMS-IA", language: "en", limit: 5, query: "audit" } },
  { resource: "lesson_index",  body: { certification: "AIMS-IA", language: "en", limit: 5 } },
];

async function call(body) {
  const started = Date.now();
  try {
    const r = await fetch(FN, {
      method: "POST",
      headers: { "content-type": "application/json", "x-mcp-client": "smoke-courseware-tools" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25000),
    });
    const t = await r.text();
    let j = null; try { j = JSON.parse(t); } catch { /* keep the text */ }
    return { status: r.status, json: j, text: t.slice(0, 160), ms: Date.now() - started };
  } catch (e) {
    return { status: 0, json: null, text: String(e).slice(0, 160), ms: Date.now() - started };
  }
}

console.log("");
console.log("SMOKE -- courseware-read, unauthenticated, English");
let fail = 0;
const failed = [];
for (const c of CELLS) {
  const res = await call({ resource: c.resource, ...c.body });
  const rows = Array.isArray(res.json?.rows) ? res.json.rows.length
             : Array.isArray(res.json?.lessons) ? res.json.lessons.length : null;
  const ok = res.status === 200 && rows !== null && rows > 0;
  if (!ok) { fail++; failed.push(c.resource); }
  console.log("  " + (ok ? "PASS  " : "FAIL  ") + c.resource.padEnd(15) +
    "HTTP " + String(res.status).padEnd(4) +
    (rows === null ? "no rows array" : rows + " row(s)").padEnd(14) +
    String(res.ms) + "ms" + (ok ? "" : "   " + res.text));
  await sleep(300);
}

console.log("");
if (fail) {
  console.log("SMOKE FAILED on: " + failed.join(", "));
  console.log("");
  console.log("  PUT THE PREVIOUS VERSION BACK FIRST. Diagnose after -- diagnosing first is");
  console.log("  how a three-minute outage becomes a thirty-minute one.");
  console.log("");
  console.log("    cd " + ROOT);
  console.log("    git log --oneline -5 -- functions/");
  console.log("    git checkout <last-good-sha> -- functions/");
  console.log("    cd .. && supabase functions deploy courseware-read --dns-resolver https");
  console.log("");
  console.log("  Then re-run this script to confirm service is back before looking at why.");
  process.exit(1);
}
console.log("SMOKE PASSED -- every tool answered 200 with rows.");
