#!/usr/bin/env node
/**
 * fix-missing-closers.mjs
 *
 * A widget block ends with "}" and MUST be followed by a "::" closer on its own line.
 * Two AIGRM-I lessons (01-03-risk-vs-harm, 01-05-trustworthy-ai-characteristics) are
 * missing it, so the "}" runs straight into the next "::concept" marker. The parser
 * never sees the section terminate, swallows the following block into the JSON body,
 * and the widget SILENTLY FAILS TO RENDER. A widget that vanishes is worse than one
 * that renders badly - nobody notices it is gone.
 *
 * The pattern is unambiguous: a widget block ends with "}", a checkpoint block ends
 * with "]". So "}" at line start-of-line-end followed immediately by a "::marker" line
 * is ALWAYS a missing closer. Nothing legitimate looks like that.
 *
 * Guarded: reports every file it would touch, writes only on --live, and re-verifies
 * that zero bad boundaries remain afterwards.
 *
 *   node fix-missing-closers.mjs <content-root>          # dry (default)
 *   node fix-missing-closers.mjs <content-root> --live
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.argv[2];
const LIVE = process.argv.includes("--live");
if (!root) {
  console.error("Usage: node fix-missing-closers.mjs <content-root> [--live]");
  process.exit(2);
}

/** A "}" ending a line, then a line that opens a new :: marker, with no "::" closer. */
const BAD = /(\}[ \t]*\r?\n)(::[a-z])/g;

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith(".md")) out.push(p);
  }
  return out;
}

const files = walk(root);
let touched = 0, totalFixes = 0;

for (const f of files) {
  const src = readFileSync(f, "utf8");
  const hits = [...src.matchAll(BAD)];
  if (hits.length === 0) continue;

  const out = src.replace(BAD, (_m, brace, marker) => `${brace}::\n${marker}`);

  // post-condition: no bad boundary may remain
  if (BAD.test(out)) {
    BAD.lastIndex = 0;
    console.error(`ABORT: ${f} still has a bad boundary after the fix. Nothing written.`);
    process.exit(1);
  }
  BAD.lastIndex = 0;

  const rel = path.relative(root, f);
  console.log(`${LIVE ? "fixed " : "would fix"}  ${rel}  (${hits.length} missing closer${hits.length > 1 ? "s" : ""})`);
  for (const h of hits) {
    const nextLine = out.slice(h.index).split("\n").slice(2, 3)[0] ?? "";
    console.log(`             -> inserted "::" before ${nextLine.slice(0, 56)}`);
  }
  if (LIVE) writeFileSync(f, out, "utf8");
  touched++;
  totalFixes += hits.length;
}

console.log(
  `\n${LIVE ? "WROTE" : "DRY"}: ${touched} file(s), ${totalFixes} missing closer(s).` +
    (touched === 0 ? " Nothing to do." : LIVE ? "" : "  Re-run with --live to write."),
);
