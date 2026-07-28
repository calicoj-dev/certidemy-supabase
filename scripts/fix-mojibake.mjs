/**
 * fix-mojibake.mjs
 *
 * Repairs double-encoded UTF-8 in TypeScript/TSX source.
 *
 * WHAT WENT WRONG ORIGINALLY: text that was already UTF-8 got read as
 * Windows-1252 and re-encoded as UTF-8. An em-dash (E2 80 94) becomes the three
 * characters a-circumflex, euro, right-double-quote. A middot (C2 B7) becomes
 * A-circumflex followed by a correct middot.
 *
 * WHY THIS IS NOT COSMETIC: in components/console/gov-flow.tsx the damage is in
 * RENDERED JSX, not comments --
 *
 *     live A· click a stage            (the label above the diagram)
 *     {flow.title} A· {openNode.title} (the drawer header)
 *
 * Those are on screen in the console governance page right now.
 *
 * THE GUARD: this script counts the specific double-encoded SEQUENCES, not
 * stray high characters. A blanket "no \u00E2 remaining" check would be wrong
 * -- a-circumflex is a legitimate Portuguese letter (camara, ranco) and pt-BR
 * strings are all over this codebase. Only the exact sequences are damage.
 * The file is written only if every sequence is resolved.
 *
 * SCOPE: .ts and .tsx only. Lesson markdown is NOT touched -- content lives in
 * the database and has its own repair path (read the actual bytes, guarded
 * byte-replace, push with update-lesson-content.mjs). Mixing the two would
 * conflate a source-code fix with a content migration.
 *
 * Run from either repo root:
 *
 *   node scripts/fix-mojibake.mjs --dry
 *   node scripts/fix-mojibake.mjs
 *
 * Or point it somewhere specific:
 *
 *   node scripts/fix-mojibake.mjs --dry --dir components/console
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, relative } from "node:path";

const DRY = process.argv.includes("--dry");
const dirArgIdx = process.argv.indexOf("--dir");
const ROOT = resolve(
  process.cwd(),
  dirArgIdx > -1 ? process.argv[dirArgIdx + 1] ?? "." : ".",
);

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  ".vercel",
  ".wrangler",
]);

// Each entry: the corrupted sequence, and what it should have been.
// Written as escapes so this file itself can never be the next casualty.
const FIXES = [
  { name: "em dash",            bad: "\u00E2\u20AC\u201D", good: "\u2014" },
  { name: "en dash",            bad: "\u00E2\u20AC\u201C", good: "\u2013" },
  { name: "right single quote", bad: "\u00E2\u20AC\u2122", good: "\u2019" },
  { name: "left double quote",  bad: "\u00E2\u20AC\u0153", good: "\u201C" },
  { name: "right double quote", bad: "\u00E2\u20AC\u009D", good: "\u201D" },
  { name: "ellipsis",           bad: "\u00E2\u20AC\u00A6", good: "\u2026" },
  { name: "bullet",             bad: "\u00E2\u20AC\u00A2", good: "\u2022" },
  { name: "right arrow",        bad: "\u00E2\u2020\u2019", good: "\u2192" },
  { name: "middot",             bad: "\u00C2\u00B7",       good: "\u00B7" },
  { name: "section sign",       bad: "\u00C2\u00A7",       good: "\u00A7" },
  { name: "non-breaking space", bad: "\u00C2\u00A0",       good: "\u00A0" },
  { name: "degree sign",        bad: "\u00C2\u00B0",       good: "\u00B0" },
  { name: "plus-minus",         bad: "\u00C2\u00B1",       good: "\u00B1" },
];

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

function main() {
  const files = walk(ROOT);
  console.log(`scanning ${files.length} .ts/.tsx files under ${ROOT}`);
  console.log(DRY ? "MODE: --dry\n" : "MODE: LIVE\n");

  let touched = 0;
  let totalFixes = 0;
  let blocked = 0;
  const pending = [];

  for (const path of files) {
    const raw = readFileSync(path, "utf8");
    let text = raw;
    const counts = [];

    for (const f of FIXES) {
      const n = text.split(f.bad).length - 1;
      if (n > 0) {
        counts.push(`${f.name} x${n}`);
        text = text.split(f.bad).join(f.good);
      }
    }

    if (counts.length === 0) continue;

    // Guard: every known sequence must be gone from the result. If one
    // survives, the file has a variant this script does not know about and
    // writing a partial repair would make the remainder harder to find.
    const residual = FIXES.filter((f) => text.includes(f.bad));
    const rel = relative(process.cwd(), path);

    if (residual.length > 0) {
      console.error(`BLOCK ${rel}`);
      console.error(
        `      unresolved after pass: ${residual.map((r) => r.name).join(", ")}`,
      );
      blocked++;
      continue;
    }

    const n = counts.reduce((a, c) => a + Number(c.split("x")[1]), 0);
    totalFixes += n;
    touched++;
    console.log(`ok    ${rel}`);
    console.log(`      ${counts.join(", ")}`);

    pending.push({ path, text });
  }

  console.log(
    `\n${touched} file(s), ${totalFixes} sequence(s)${
      blocked ? `, ${blocked} BLOCKED` : ""
    }`,
  );

  if (blocked > 0) {
    console.error("\nBlocked files were not written. Nothing else was either.");
    process.exitCode = 1;
    return;
  }

  if (DRY) {
    console.log("--dry: nothing written.");
    return;
  }

  for (const p of pending) {
    // Written as UTF-8 with no BOM. A BOM here would break any file that also
    // ships to a Deno edge function.
    writeFileSync(p.path, p.text, "utf8");
  }

  console.log(`wrote ${pending.length} file(s).`);
  console.log("\nNext: npm run build, then eyeball /console/governance --");
  console.log("the diagram label and drawer header are the visible ones.");
}

main();
