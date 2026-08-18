/**
 * patch-ots-this-binding.mjs
 *
 * Fixes both OTS scripts: opentimestamps' module functions lose their `this`
 * when destructured.
 *
 * Run from supabase/scripts/anchor/.
 *
 * ============================== THE BUG =====================================
 *
 *   const { stamp } = pkg;
 *   await stamp(detached);
 *   -> Cannot read properties of undefined (reading 'makeMerkleTree')
 *
 * stamp() reaches for makeMerkleTree through `this`. Called as pkg.stamp(...)
 * the receiver is the module and it resolves; destructured, `this` is undefined
 * and it does not.
 *
 * A probe confirmed the export itself is fine -- pkg.stamp is a function and
 * every key is present. Nothing was missing; the call was just detached from its
 * object. So: destructure the CLASSES (DetachedTimestampFile, Ops, Context --
 * they carry no such dependency) and call the FUNCTIONS off the module.
 *
 * The one-liner used to prove the calendars were reachable did exactly this,
 * which is why it worked when the script did not.
 *
 * Usage:  node patch-ots-this-binding.mjs --dry
 *         node patch-ots-this-binding.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry");

const EDITS = [
  {
    file: "ots-submit.mjs",
    changes: [
      {
        name: "import: keep the module object",
        find: `import pkg from "opentimestamps";

const { DetachedTimestampFile, Ops, Context, stamp, info } = pkg;`,
        replace: `import ots from "opentimestamps";

/* CLASSES may be destructured; FUNCTIONS may not. stamp() and info() reach for
   makeMerkleTree through \`this\`, so they must be called as ots.stamp(...) and
   ots.info(...) or the receiver is undefined. */
const { DetachedTimestampFile, Ops, Context } = ots;`,
      },
      { name: "info() call in serializeProof area", find: `  const text = info(detached);`, replace: `  const text = ots.info(detached);` },
      { name: "stamp() call", find: `      await stamp(detached);`, replace: `      await ots.stamp(detached);` },
    ],
  },
  {
    file: "ots-upgrade.mjs",
    changes: [
      {
        name: "import: keep the module object",
        find: `import pkg from "opentimestamps";

const { DetachedTimestampFile, Context, upgrade, info } = pkg;`,
        replace: `import ots from "opentimestamps";

/* CLASSES may be destructured; FUNCTIONS may not -- see ots-submit.mjs. */
const { DetachedTimestampFile, Context } = ots;`,
      },
      { name: "info() call", find: `  const text = info(detached);`, replace: `  const text = ots.info(detached);` },
      { name: "upgrade() call", find: `      await upgrade(detached);`, replace: `      await ots.upgrade(detached);` },
    ],
  },
];

let total = 0;

for (const { file, changes } of EDITS) {
  let src = readFileSync(file, "utf8");
  const before = src.length;

  const cr = (src.match(/\r\n/g) || []).length;
  const lf = (src.match(/\n/g) || []).length;
  if (cr > 0 && cr !== lf) {
    console.error(`ABORT  ${file} has mixed line endings`);
    process.exit(3);
  }
  const toEol = (s) =>
    cr > 0 ? s.replace(/\r?\n/g, "\r\n") : s.replace(/\r\n/g, "\n");

  console.log(`  ${file}  ${cr > 0 ? "CRLF" : "LF"}`);

  for (const c of changes) {
    const find = toEol(c.find);
    const n = src.split(find).length - 1;
    if (n !== 1) {
      console.error(`ABORT  ${file} "${c.name}": matched ${n}, expected 1`);
      process.exit(3);
    }
    src = src.replace(find, toEol(c.replace));
    console.log(`    ok   ${c.name}`);
  }

  /* No bare call to a module function may survive -- that is the whole bug. */
  for (const bad of [/\bawait stamp\(/, /\bawait upgrade\(/, /[^.]\binfo\(detached\)/]) {
    if (bad.test(src)) {
      console.error(`ABORT  ${file}: an unbound module call survives (${bad})`);
      process.exit(3);
    }
  }

  console.log(`    ${before} -> ${src.length} bytes`);
  if (!DRY) writeFileSync(file, src, "utf8");
  total++;
}

console.log(DRY ? `\nDRY RUN -- ${total} file(s) would change` : `\nwritten ${total} file(s)`);
process.exitCode = DRY ? 2 : 0;
