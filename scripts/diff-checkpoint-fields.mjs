#!/usr/bin/env node
/**
 * diff-checkpoint-fields.mjs -- which FIELDS a checkpoint regeneration changed.
 *
 * READ-ONLY. `--spec <file>` (default BATCH1-RETRANSLATION.json), `--md <file>`.
 * Unknown flags exit 2.
 *
 * A checkpoint block is thirty-odd independently translated fields inside one
 * markdown block. Emitting it as a block means a rewrite of one option arrives
 * as a rewrite of everything, and nobody can see which of the thirty moved --
 * so the reviewer either reads all thirty or approves blind. This prints the
 * ones that moved and says how many did not.
 *
 * MACHINE DRIFT IS A SEPARATE VERDICT AND IT IS THE SERIOUS ONE. `correct`,
 * `bloom_level`, `difficulty`, `type` and `concept_slugs` are not translated. A
 * regeneration that moves one has changed what the question TESTS, and no prose
 * gate in this repository would ever report it.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { diffCheckpointFields, checkpointControls, parseCheckpoint } from "./lib/checkpoint-fields.mjs";

const KNOWN = new Set(["--spec", "--md"]);
const argv = process.argv.slice(2);
for (const a of argv) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error("Unrecognised flag: " + a); process.exit(2); }
}
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const SPEC = val("--spec", "BATCH1-RETRANSLATION.json");
const MD = val("--md", "");

const broken = checkpointControls();
if (broken.length) {
  console.error("FIXTURE FAILURES: " + broken.join("; "));
  console.error("No verdict printed: a field grain that pairs the wrong fields is worse than none.");
  process.exit(2);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
if (!existsSync(join(ROOT, SPEC))) { console.error("No such spec: " + SPEC); process.exit(2); }
const spec = JSON.parse(readFileSync(join(ROOT, SPEC), "utf8"));

const rows = spec.rows.filter((r) => parseCheckpoint(r.to_block) || parseCheckpoint(r.from_block));
const out = [];
const push = (s) => { out.push(s); console.log(s); };
const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

push("");
push("CHECKPOINT FIELD DIFF over " + SPEC);
push("DENOMINATOR: " + rows.length + " checkpoint block(s) of " + spec.rows.length + " rendering(s)");
push("");

let totalChanged = 0, totalSame = 0, totalMachine = 0, unreadable = 0;
const perRow = [];
for (const r of rows) {
  const d = diffCheckpointFields(r.from_block, r.to_block);
  const tag = r.slug + " " + r.language + " b" + r.block_index;
  if (!d) {
    /* THIRD STATE. One side did not parse, so "nothing changed" is not
     * available as an answer and is not printed as one. */
    push("  UNREADABLE  " + tag + " -- one side is not a parseable checkpoint");
    unreadable++;
    perRow.push({ tag, unreadable: true });
    continue;
  }
  totalChanged += d.changed.length; totalSame += d.same.length; totalMachine += d.machineDrift.length;
  perRow.push({ tag, d });
  push("  " + tag);
  push("      fields: " + d.total + "   changed: " + d.changed.length +
       "   unchanged: " + d.same.length +
       (d.onlyFrom.length ? "   DROPPED: " + d.onlyFrom.join(",") : "") +
       (d.onlyTo.length ? "   ADDED: " + d.onlyTo.join(",") : ""));
  if (d.machineDrift.length) {
    for (const m of d.machineDrift) push("      MACHINE DRIFT  " + m.path + "  " + m.from + " -> " + m.to);
  }
  for (const c of d.changed) {
    push("      ~ " + c.path);
    push("          was: " + trunc(c.from, 150));
    push("          now: " + trunc(c.to, 150));
  }
}

push("");
push("  changed " + totalChanged + " field(s), left " + totalSame + " unchanged, " +
     totalMachine + " machine drift, " + unreadable + " unreadable");
if (!totalMachine) push("  no question changed what it tests");

if (MD) {
  const md = ["# Checkpoint field diff -- `" + SPEC + "`", "",
    "A `::checkpoint` block is one markdown block and thirty-odd independently translated",
    "fields. Emitted as a block, a rewrite of one option arrives as a rewrite of everything.",
    "Fields pair by **id**, never by position, so a reordered or dropped option is reported",
    "rather than silently compared against its neighbour.", "",
    "| block | fields | changed | unchanged | machine drift |", "|---|---|---|---|---|"];
  for (const p of perRow) {
    if (p.unreadable) { md.push("| `" + p.tag + "` | — | — | — | **unreadable** |"); continue; }
    md.push("| `" + p.tag + "` | " + p.d.total + " | **" + p.d.changed.length + "** | " +
      p.d.same.length + " | " + (p.d.machineDrift.length || "none") + " |");
  }
  md.push("", "**" + totalChanged + " fields changed, " + totalSame + " left alone, " +
    totalMachine + " machine drift.**", "");
  for (const p of perRow) {
    if (p.unreadable || !p.d.changed.length) continue;
    md.push("## `" + p.tag + "`", "");
    for (const c of p.d.changed) {
      md.push("**`" + c.path + "`**", "", "- was: " + c.from, "- now: " + c.to, "");
    }
  }
  writeFileSync(join(ROOT, MD), md.join("\n"), "utf8");
  console.log("");
  console.log("  wrote " + MD);
}
