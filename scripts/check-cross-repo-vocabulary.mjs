#!/usr/bin/env node
/**
 * check-cross-repo-vocabulary.mjs - compare the word lists the two repos send
 * each other, by reading the other side's source.
 *
 * READ-ONLY. No network, no database, no credential. Unknown flags exit 2.
 *
 * ============ THE CLASS, AND IT HAS HAPPENED THREE TIMES ============
 *
 * One side emits a set of strings. The other side validates a set of strings.
 * Both sides are tested against themselves and both are green. NOTHING COMPARES
 * THE TWO LISTS, because a shared constant cannot cross a repository boundary.
 *
 *   1. THE WIRE VOCABULARY (recorded in CLAUDE.md). `lib/mcp/registry.ts` sent
 *      `resource: "syllabus"` and `code` and `domain`; courseware-read accepted
 *      `certification | task | concept | search`, `task_code`, `domain_code`.
 *      All four courseware tools would have 400'd on every call, reported to the
 *      agent as UPSTREAM_UNREACHABLE -- a contract error wearing a network fault.
 *
 *   2. THE CERTIFICATION LIST (2026-09-16). Migration 328 widened the mcp views
 *      to eight; `CERTIFICATIONS` in courseware-query still said four; the
 *      cold-start equality refused ALL EIGHT and took the curriculum surface
 *      down. No ordering avoided it -- either side moving first broke the other.
 *
 *   3. THE AUTH LABELS (2026-09-16). The Worker sends
 *      `auth?.kind ?? "unresolved"` -- five possible strings. `AUTH_KINDS` was
 *      built from the four `kind` values of the union and did not know about the
 *      fallback. Every auth refusal with no resolution answered 400, so the one
 *      event added to make auth refusals visible was silent for precisely the
 *      refusal that is hardest to diagnose without it.
 *
 * Each was found by a human reading both files side by side. This does that
 * comparison mechanically, which is the only part of it that scales.
 *
 * ============ WHAT IT CANNOT DO ============
 *
 * It reads SOURCE, not behaviour. A list assembled at runtime, spread from
 * another module, or built by a function is invisible to it -- so every
 * extractor below is paired with a control that fails if the extraction came
 * back empty. An extractor that silently matches nothing turns this whole script
 * into a green light, which is the exact failure CLAUDE.md records against
 * check-mcp's fragment extractor.
 *
 * It also cannot see a MEANING mismatch: two lists can agree on strings and
 * disagree on what they denote. That is still a human job.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--web", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ".");
    console.error("READ-ONLY; it writes nothing. Known flags: --web, --verbose.");
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};

const HERE = dirname(fileURLToPath(import.meta.url));
const SUPA = join(HERE, "..");
const WEB = arg("web", join(HERE, "..", "..", "certidemy-web"));
const VERBOSE = process.argv.includes("--verbose");

if (!existsSync(WEB)) {
  console.error(`the web repo is not at ${WEB}`);
  console.error("Pass --web <path>. Both repos must be checked out side by side.");
  process.exit(2);
}

const read = (root, file) => {
  const p = join(root, file);
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf8");
};

/** Every string literal inside the first `name = [ ... ]` array in `src`. */
function arrayLiterals(src, name) {
  if (!src) return null;
  const re = new RegExp(name + "\\s*(?::[^=]*)?=\\s*\\[([\\s\\S]*?)\\]");
  const m = re.exec(src);
  if (!m) return null;
  // Comments stripped FIRST. A commented-out member is not a member, and a
  // sentence inside a comment is not a string literal -- CLAUDE.md records a
  // guard that aborted on the words "no grant to anon" in prose.
  const body = m[1].replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const out = [...body.matchAll(/["'`]([^"'`]+)["'`]/g)].map((x) => x[1]);
  return out.length ? out : null;
}

/** The keys of the `name:` entry inside an object-of-arrays. */
function objectEntryLiterals(src, objName, key) {
  if (!src) return null;
  const obj = new RegExp(objName + "\\s*(?::[^=]*)?=\\s*\\{([\\s\\S]*?)\\n\\};");
  const m = obj.exec(src);
  if (!m) return null;
  const entry = new RegExp("\\b" + key + "\\s*:\\s*\\[([^\\]]*)\\]").exec(m[1]);
  if (!entry) return null;
  const body = entry[1].replace(/\/\/[^\n]*/g, "");
  const out = [...body.matchAll(/["']([^"']+)["']/g)].map((x) => x[1]);
  return out.length ? out : null;
}

const results = [];
const problems = [];
const controls = [];

function control(name, ok, detail) {
  controls.push({ name, ok, detail });
}

/**
 * Compare two sides. `emits` is what one side can send; `accepts` is what the
 * other will take. Extra ACCEPTED values are fine -- a validator may know more
 * than any current sender. Extra EMITTED values are the defect.
 */
function compare(label, emitSide, emits, acceptSide, accepts) {
  control(`${label}: ${emitSide} list extracted`, Array.isArray(emits) && emits.length > 0,
    Array.isArray(emits) ? `${emits.length} value(s)` : "EXTRACTION RETURNED NOTHING");
  control(`${label}: ${acceptSide} list extracted`, Array.isArray(accepts) && accepts.length > 0,
    Array.isArray(accepts) ? `${accepts.length} value(s)` : "EXTRACTION RETURNED NOTHING");
  if (!emits || !accepts) return;

  const missing = emits.filter((v) => !accepts.includes(v));
  results.push({ label, emitSide, acceptSide, emits, accepts, missing });
  if (missing.length) {
    problems.push(
      `${label}: ${emitSide} can emit ${JSON.stringify(missing)} which ${acceptSide} does not accept`,
    );
  }
}

/* ---------------------------------------------------------------- the pairs */

const q = read(SUPA, "functions/_shared/courseware-query.ts");
const contract = read(WEB, "lib/mcp/courseware-contract.ts");
const telemetry = read(WEB, "lib/mcp/telemetry.ts");
const partnerAuth = read(WEB, "lib/mcp/partner-auth.ts");

// 1. AUTH LABELS -- instance 3.
// The Worker's emitted set is the union's `kind` values PLUS the `??` fallback
// in authKindLabel, which is the member that was missed. Extracted separately
// and on purpose: reading only the union is exactly the mistake.
const unionKinds = telemetry && partnerAuth
  ? [...partnerAuth.matchAll(/kind:\s*"([a-z_]+)"/g)].map((m) => m[1])
  : null;
const fallback = telemetry ? /\?\?\s*"([a-z_]+)"/.exec(telemetry)?.[1] ?? null : null;
control("auth: the ?? fallback in authKindLabel was found", fallback !== null,
  fallback ?? "NOT FOUND -- the member that caused instance 3 is invisible");
const emitsAuth = unionKinds
  ? [...new Set([...unionKinds, ...(fallback ? [fallback] : [])])]
  : null;
compare("auth labels", "worker", emitsAuth, "courseware-query", arrayLiterals(q, "AUTH_KINDS"));

// 2. CERTIFICATIONS -- instance 2.
compare("certifications", "web contract", arrayLiterals(contract, "SUPPORTED_CERTIFICATIONS"),
  "courseware-query", arrayLiterals(q, "CERTIFICATIONS"));

// 3. LOG EVENTS. The web side names one in a const and one inline.
//
// SCOPED TO WHAT IS POSTED, NOT TO EVERY `event:` IN THE FILE. The first version
// matched `event:` anywhere in registry.ts and reported
// `auth_refusal_telemetry_rejected` and `..._unreachable` as unaccepted events.
// Those are console.warn LINES about the telemetry call, not telemetry bodies --
// they never reach courseware-read and never should.
//
// It was a false positive, and a false positive is not a harmless over-report
// here: CLAUDE.md records that a guard which cries wolf gets loosened next time,
// and this guard exists to be believed once every few months.
const registrySrc = read(WEB, "lib/mcp/registry.ts") ?? "";
const postedBodies = [...registrySrc.matchAll(/body:\s*JSON\.stringify\(([\s\S]{0,400}?)\),/g)]
  .map((m) => m[1])
  .join("\n");
const webEvents = telemetry
  ? [...new Set([
      ...[...telemetry.matchAll(/AUTH_REFUSED_EVENT\s*=\s*"([a-z_]+)"/g)].map((m) => m[1]),
      ...[...postedBodies.matchAll(/event:\s*"([a-z_]+)"/g)].map((m) => m[1]),
    ])]
  : null;
compare("log events", "worker", webEvents, "courseware-query", arrayLiterals(q, "LOG_EVENTS"));

// 4. LANGUAGES.
compare("languages", "web contract", arrayLiterals(contract, "LANGUAGES"),
  "courseware-query", arrayLiterals(q, "LANGUAGES"));

// 5. THE TELEMETRY BODY KEYS vs the field allowlist -- instance 1's shape.
const bodyKeys = telemetry
  ? [...(/authRefusalEvent[\s\S]*?return\s*\{([\s\S]*?)\};/.exec(telemetry)?.[1] ?? "")
      .matchAll(/^\s*([a-z_]+)\s*:/gm)].map((m) => m[1])
  : null;
compare("auth_refused body keys", "worker", bodyKeys && bodyKeys.length ? bodyKeys : null,
  "ALLOWED.log", objectEntryLiterals(q, "ALLOWED", "log"));

/* ------------------------------------------------------------- self-test */
//
// THE HARNESS MUST BE ABLE TO FAIL. Every comparison above could be green
// because compare() is broken rather than because the vocabularies agree.
{
  const before = problems.length;
  compare("SELF-TEST", "fake-emitter", ["a", "b", "ZZ_NOT_ACCEPTED"], "fake-acceptor", ["a", "b"]);
  const fired = problems.length === before + 1;
  control("SELF-TEST: a known mismatch is reported", fired,
    fired ? "the comparator fires" : "THE COMPARATOR DOES NOT FIRE");
  if (fired) problems.pop();
  results.pop();
}

/* ------------------------------------------------------------------ report */

console.log("");
console.log("CONTROLS -- without these, a green result means nothing");
let controlsFailed = 0;
for (const c of controls) {
  if (!c.ok) controlsFailed++;
  console.log(`  ${c.ok ? "ok  " : "FAIL"}  ${c.name}  -- ${c.detail}`);
}

console.log("");
console.log("VOCABULARIES");
for (const r of results) {
  const flag = r.missing.length ? "FAIL" : "ok  ";
  console.log(`  ${flag}  ${r.label}: ${r.emitSide} emits ${r.emits.length}, ${r.acceptSide} accepts ${r.accepts.length}`);
  if (VERBOSE || r.missing.length) {
    console.log(`          emits:   ${JSON.stringify(r.emits)}`);
    console.log(`          accepts: ${JSON.stringify(r.accepts)}`);
  }
}

console.log("");
if (controlsFailed) {
  console.log(`${controlsFailed} CONTROL(S) FAILED. An extractor matched nothing, so the`);
  console.log("comparisons above are not evidence. Fix the extractor before reading them.");
}
console.log(`problems: ${problems.length}`);
for (const p of problems) console.log(`  X ${p}`);
console.log("");
console.log(problems.length || controlsFailed
  ? "CROSS-REPO VOCABULARY MISMATCH."
  : "Every list one side can emit, the other side accepts.");

process.exitCode = problems.length || controlsFailed ? 1 : 0;
