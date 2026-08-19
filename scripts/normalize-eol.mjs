#!/usr/bin/env node
/**
 * normalize-eol.mjs
 *
 * Reports mixed line endings in a file, shows the minority lines, and with
 * --apply converts the whole file to the majority convention.
 *
 * WHY THIS EXISTS
 *   Patch scripts in this repo refuse to run on mixed-EOL files, because a
 *   patch that inserts one convention into a file carrying another leaves a
 *   file that is neither, and git then rewrites it on the next checkout and the
 *   diff becomes unreadable. This is the tool that clears that state
 *   deliberately rather than the patch script papering over it.
 *
 *   It PRINTS the minority lines before touching anything. A file with three
 *   CRLF lines among five hundred usually means a script or an editor wrote a
 *   specific block; worth seeing which one before flattening it.
 *
 * USAGE
 *   node scripts/normalize-eol.mjs <path>
 *   node scripts/normalize-eol.mjs <path> --apply
 *
 * Run from anywhere; the path may be relative to the current directory.
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const rel = args.find((a) => !a.startsWith("--"));

if (!rel) {
  console.error("usage: node normalize-eol.mjs <path> [--apply]");
  process.exit(2);
}

const TARGET = resolve(rel);
if (!existsSync(TARGET)) {
  console.error(`ABORT: not found: ${TARGET}`);
  process.exit(1);
}

const bytes = readFileSync(TARGET);
if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
  console.error("ABORT: file carries a BOM. That is a separate problem; fix it first.");
  process.exit(1);
}

const raw = bytes.toString("utf8");
const crlf = (raw.match(/\r\n/g) ?? []).length;
const bare = (raw.match(/(?<!\r)\n/g) ?? []).length;
const strayCr = (raw.match(/\r(?!\n)/g) ?? []).length;

console.log(`file: ${TARGET}`);
console.log(`bytes: ${bytes.length}`);
console.log(`CRLF=${crlf}  bareLF=${bare}  strayCR=${strayCr}`);

if (strayCr > 0) {
  console.error("\nABORT: lone CR bytes present (old-Mac endings). Not handled here.");
  process.exit(1);
}

if (crlf === 0 || bare === 0) {
  console.log("\nAlready consistent. Nothing to do.");
  process.exit(0);
}

const MAJORITY = crlf > bare ? "crlf" : "lf";
const MINORITY = MAJORITY === "crlf" ? "lf" : "crlf";
console.log(`majority: ${MAJORITY.toUpperCase()}   converting ${MINORITY.toUpperCase()} lines`);

/* ---- show the odd ones -------------------------------------------------- */
// Split keeping the terminator so each line can be classified.
const parts = raw.split(/(?<=\n)/);
console.log(`\n${MINORITY.toUpperCase()} lines:`);
let shown = 0;
for (let i = 0; i < parts.length; i++) {
  const p = parts[i];
  if (!p.endsWith("\n")) continue;
  const isCrlf = p.endsWith("\r\n");
  const isMinority = MINORITY === "crlf" ? isCrlf : !isCrlf;
  if (!isMinority) continue;
  shown++;
  if (shown <= 20) {
    const text = p.replace(/\r?\n$/, "");
    console.log(`  ${String(i + 1).padStart(4)}  ${JSON.stringify(text.slice(0, 100))}`);
  }
}
if (shown > 20) console.log(`  ... and ${shown - 20} more`);
console.log(`  total: ${shown}`);

/* ---- convert ------------------------------------------------------------ */
let out = raw.replace(/\r\n/g, "\n");
if (MAJORITY === "crlf") out = out.replace(/\n/g, "\r\n");

const crlfOut = (out.match(/\r\n/g) ?? []).length;
const bareOut = (out.match(/(?<!\r)\n/g) ?? []).length;
console.log(`\nafter: CRLF=${crlfOut}  bareLF=${bareOut}`);

// Line COUNT must not change. Content must not change once endings are ignored.
const linesBefore = raw.replace(/\r\n/g, "\n").split("\n").length;
const linesAfter = out.replace(/\r\n/g, "\n").split("\n").length;
const sameContent = raw.replace(/\r\n/g, "\n") === out.replace(/\r\n/g, "\n");

console.log("\npost-conditions:");
const checks = [
  ["line count unchanged", linesAfter, linesBefore],
  ["content identical ignoring endings", sameContent, true],
  ["result is consistent", (crlfOut === 0 || bareOut === 0), true],
];
let bad = 0;
for (const [name, got, want] of checks) {
  const ok = got === want;
  if (!ok) bad++;
  console.log(`  ${ok ? "OK  " : "FAIL"} ${name}: ${got} (expected ${want})`);
}
if (bad > 0) {
  console.error("\nABORT: post-conditions failed. Nothing written.");
  process.exit(1);
}

if (!APPLY) {
  console.log("\nDRY RUN - nothing written. Re-run with --apply to convert.");
  process.exit(0);
}

copyFileSync(TARGET, TARGET + ".bak");
writeFileSync(TARGET, out, "utf8");
console.log(`\nWROTE ${TARGET}  (backup at ${TARGET}.bak)`);
