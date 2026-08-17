/**
 * patch-og-typecheck.mjs
 *
 * Clears the 13 `deno check` errors in supabase/functions/credential-og/index.ts.
 *
 * ============================== ERROR 1-12: THE SELECT =======================
 *
 * supabase-js infers row types by PARSING the .select() string as a TypeScript
 * string-literal type. A string built by concatenation is not a literal type, so
 * inference degrades to `GenericStringError` -- which has none of the columns the
 * code then reads. Every `cred.<field>` becomes TS2339.
 *
 * Identical to the defect fixed in open-badge/index.ts earlier tonight. This
 * function's select has been a two-piece concatenation since it was written, so
 * `cred` has never been typed here either.
 *
 * WHY IT MATTERS MORE HERE THAN IT LOOKS: the untyped block is the one that
 * decides whether a card renders the SPECIMEN band. v4.5 s3 records specimens
 * rendering identically to real credentials as a live fraud vector, and that
 * decision reads cred.is_specimen, cred.status and cred.expires_at -- three
 * fields the compiler could not see. A typo in any of them would have been
 * silent, and the failure mode is a demonstration credential that shares as real.
 *
 * The ?cert= and ?generic=1 modes never touch `cred`, so those paths were always
 * clean. The 12 errors are confined to the credential branch.
 *
 * ============================== ERROR 13: THE RESPONSE BODY =================
 *
 *   TS2345  new Response(png, ...)
 *           Uint8Array<ArrayBufferLike> is not assignable to BodyInit
 *
 * Deno 2.x tightened Uint8Array's generic parameter. BodyInit now requires
 * Uint8Array<ArrayBuffer>, and the buffer coming back from resvg's wasm carries
 * ArrayBufferLike because it may be a SharedArrayBuffer as far as the type
 * system knows.
 *
 * This is a type-level problem only -- Response accepts the bytes at runtime and
 * the function has been serving PNGs throughout. But it sits in pngResponse(),
 * which every successful render passes through, so it is the one error here that
 * is on the hot path.
 *
 * Fixed with a narrowing cast at the boundary rather than by changing the
 * signature: the parameter type is honest about what callers pass, and the cast
 * is where the runtime guarantee actually lives. A comment states why, because a
 * bare `as` invites someone to delete it.
 *
 * NOT TOUCHED: `new Response(await r.arrayBuffer(), ...)` at the fallback path
 * and `new Response(null, ...)` at the redirect. arrayBuffer() returns a real
 * ArrayBuffer and null is valid BodyInit; neither appeared in the error list.
 *
 * Anchors built from a codepoint dump of the file, not from terminal output.
 * Fourth anchor-class failure tonight came from doing the opposite.
 *
 * index.ts is LF. Written LF.
 *
 * Usage:  node scripts/patch-og-typecheck.mjs --dry
 *         node scripts/patch-og-typecheck.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry");
const PATH = "functions/credential-og/index.ts";

let src = readFileSync(PATH, "utf8");
const before = src.length;

const cr = (src.match(/\r\n/g) || []).length;
const lf = (src.match(/\n/g) || []).length;
console.log(`  ${PATH}  ${cr > 0 ? "CRLF" : "LF"}  (${cr} CRLF / ${lf} LF)`);
if (cr > 0) {
  console.error("ABORT  expected LF");
  process.exit(3);
}

const EDITS = [
  {
    name: "select becomes one string literal",
    find: `      .select(
        "credential_code, holder_name, certification_name, certification_code, " +
          "status, issued_at, expires_at, locale, is_specimen"
      );`,
    replace: `      // ONE STRING LITERAL, deliberately, however long. supabase-js infers the
      // row type by parsing this as a literal type; a concatenation is not one,
      // and the result degrades to GenericStringError with no columns on it. The
      // block below reads is_specimen, status and expires_at to decide whether
      // this card carries the SPECIMEN band, so those three fields being
      // invisible to the compiler was the riskiest part of an untyped row here.
      .select(
        "credential_code, holder_name, certification_name, certification_code, status, issued_at, expires_at, locale, is_specimen"
      );`,
  },
  {
    name: "Response body cast",
    find: `function pngResponse(png: Uint8Array): Response {
  return new Response(png, {`,
    replace: `function pngResponse(png: Uint8Array): Response {
  // Deno 2.x tightened Uint8Array's generic parameter: BodyInit wants
  // Uint8Array<ArrayBuffer>, and the buffer resvg's wasm hands back is typed
  // ArrayBufferLike because the type system cannot rule out SharedArrayBuffer.
  // Response accepts the bytes at runtime -- it always has -- so the cast is at
  // the boundary where that guarantee lives. Do not delete it to "clean up"; the
  // signature above is the honest description of what callers pass.
  return new Response(png as unknown as BodyInit, {`,
  },
];

for (const e of EDITS) {
  const n = src.split(e.find).length - 1;
  if (n !== 1) {
    console.error(`ABORT  "${e.name}": matched ${n}, expected 1`);
    process.exit(3);
  }
  src = src.replace(e.find, e.replace);
  console.log(`  ok   ${e.name}`);
}

const CHECKS = [
  [
    '"credential_code, holder_name, certification_name, certification_code, status, issued_at, expires_at, locale, is_specimen"',
    true,
  ],
  ["png as unknown as BodyInit", true],
  // No concatenated select fragment may survive.
  ['certification_code, " +', false],
];
for (const [needle, want] of CHECKS) {
  const has = src.includes(needle);
  if (has !== want) {
    console.error(`ABORT  post-check: ${JSON.stringify(needle.slice(0, 60))} present=${has}, want=${want}`);
    process.exit(3);
  }
}
if ((src.match(/\r\n/g) || []).length !== 0) {
  console.error("ABORT  post-check: CRLF appeared");
  process.exit(3);
}

console.log(`\n  ${before} -> ${src.length} bytes`);

if (DRY) {
  console.log("\nDRY RUN -- nothing written");
  process.exit(2);
}

writeFileSync(PATH, src, "utf8");
console.log("\nwritten " + PATH);
