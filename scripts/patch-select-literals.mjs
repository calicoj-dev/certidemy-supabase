/**
 * patch-select-literals.mjs  (v2)
 *
 * Fixes the 16 `deno check` errors in supabase/functions/open-badge/index.ts.
 *
 * ============================== THE PROBLEM ==============================
 *
 * supabase-js infers row types by PARSING the .select() string as a TypeScript
 * string-literal type. A string built by concatenation is not a literal type, so
 * inference fails and the result degrades to `GenericStringError` -- which has
 * none of the properties the code then reads. Every `cred.<field>` access
 * becomes TS2339, and the `as IssuerRow` cast becomes TS2352.
 *
 * MEASURED BASELINE (git stash + deno check on HEAD): 17 errors before any of
 * this session's changes. The `credentials` select has been split across three
 * concatenated lines since it was written, so `cred` has been effectively
 * untyped the whole time. Two further errors -- `signDocument(issuer)` failing
 * because SigningIssuer required a non-null public_key_multibase that IssuerRow
 * declares nullable -- were also pre-existing, and patch-ob3-base-url.mjs
 * removed that field from the interface, fixing them.
 *
 * ============================== THE FIX ==================================
 *
 * Collapse adjacent double-quoted string literals joined by `+` into one
 * literal. Template literals (backticks) are untouched -- the error-message
 * concatenations in this file use those and must keep their line breaks.
 *
 * Long lines are the price. A literal is the only thing supabase-js can type,
 * and a correctly typed row is worth more than an 80-column margin.
 *
 * v2 CHANGE: line endings are DETECTED, not asserted. v1 hard-coded LF, and a
 * `git stash pop` under core.autocrlf=true converted the file to CRLF between
 * writing the script and running it. The guard correctly refused to write; the
 * guard was the thing that was wrong.
 *
 * Usage:  node scripts/patch-select-literals.mjs --dry
 *         node scripts/patch-select-literals.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry");
const PATH = "functions/open-badge/index.ts";

let src = readFileSync(PATH, "utf8");
const before = src.length;

const crCount = (src.match(/\r\n/g) || []).length;
const lfCount = (src.match(/\n/g) || []).length;
const eol = crCount > 0 ? "CRLF" : "LF";
console.log(`  ${PATH}  ${eol}  (${crCount} CRLF / ${lfCount} LF)`);
if (crCount > 0 && crCount !== lfCount) {
  console.error(`ABORT  file has MIXED line endings; fix that first`);
  process.exit(3);
}

// "abc" +\n  "def"   ->   "abcdef"
// Applied repeatedly so a three-piece concatenation collapses in two passes.
const JOIN = /"([^"\\]*)"[ \t]*\+[ \t]*\r?\n[ \t]*"/g;

let joins = 0;
let pass = 0;
for (;;) {
  pass++;
  if (pass > 10) {
    console.error("ABORT  more than 10 passes; regex is not converging");
    process.exit(3);
  }
  const next = src.replace(JOIN, (_m, head) => {
    joins++;
    return `"${head}`;
  });
  if (next === src) break;
  src = next;
}

console.log(`  ${joins} concatenation(s) collapsed in ${pass} pass(es)`);

// Expect exactly 3: issuer select (2 pieces = 1 join) and credentials select
// (3 pieces = 2 joins). More means the regex reached something it should not.
if (joins !== 3) {
  console.error(`ABORT  expected 3 joins, made ${joins}`);
  process.exit(3);
}

// Assert the END STATE: both selects are now single literals.
const CHECKS = [
  `"id, slug, name, site_url, base_url, issuer_url, key_id, public_key_multibase, key_created_at"`,
  `"id, credential_code, user_id, certification_code, holder_name, issued_at, expires_at, status, is_specimen, subject_salt, status_list_index, material_updated_at, jta_version_id"`,
];
for (const needle of CHECKS) {
  if (!src.includes(needle)) {
    console.error(`ABORT  post-check missing: ${needle.slice(0, 70)}...`);
    process.exit(3);
  }
}

const crAfter = (src.match(/\r\n/g) || []).length;
const lfAfter = (src.match(/\n/g) || []).length;
const ok = crCount > 0 ? crAfter === lfAfter : crAfter === 0;
if (!ok) {
  console.error(`ABORT  line endings drifted (${crAfter} CRLF / ${lfAfter} LF, file was ${eol})`);
  process.exit(3);
}

console.log(`  ${before} -> ${src.length} bytes`);

if (DRY) {
  console.log("\nDRY RUN -- nothing written");
  process.exit(2);
}

writeFileSync(PATH, src, "utf8");
console.log("\nwritten " + PATH);
