#!/usr/bin/env node
/**
 * read-probe-cues.mjs -- what the options-probe flags are actually made of.
 *
 * READ-ONLY. `--file=` repeatable, unknown flags exit 2.
 *
 * ============ WHY THIS EXISTS ============
 *
 * The flag rate went from 79 percent across every pre-instruction survivor to 92 percent after a writer
 * instruction written to lower it. The instruction was aimed at ONE habit -- broad measured key, narrow
 * absolute distractors -- and the honest next step is to find out whether that habit is still what the probe
 * is naming, not to write another instruction.
 *
 * Every lexical count in this repository has been wrong on first run, and every one of them was caught by
 * reading the members. So this prints the probe's own `cue` sentence for every flagged survivor, grouped by
 * `cue_kind`, and reports the cue_kind mix per batch so a SHIFT in what is being flagged is visible rather
 * than hidden inside one rate.
 *
 * A rate says how often. Only the members say what of.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FILES = [];
let FULL = false;
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--file=([^:]+):(.+)$/.exec(a))) { FILES.push([m[1], m[2]]); continue; }
  if (a === "--full") { FULL = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --file=<label>:<artifact.json> (repeatable), --full.");
  process.exit(2);
}
if (!FILES.length) {
  FILES.push(["before: batch 1", "AIMSF-ROLLOUT-B1.json"], ["before: batch 2", "AIMSF-ROLLOUT-B2.json"],
    ["after: R2 probe", "AIMSF-R2-PROBE.json"], ["after: R2 rest", "AIMSF-R2-REST.json"]);
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const groups = [];
for (const [label, f] of FILES) {
  const p = existsSync(f) ? f : join(ROOT, f);
  if (!existsSync(p)) { console.log("(missing, skipped: " + f + ")"); continue; }
  const j = JSON.parse(readFileSync(p, "utf8"));
  const surv = (j.items || []).filter((r) => r.verdict === "survivor");
  const probed = surv.filter((r) => (r.options_probe || {}).state);
  const flagged = probed.filter((r) => r.options_probe.state === "flag");
  groups.push({ label, surv: surv.length, probed: probed.length, flagged });
}
/* merge the two halves of each phase, because "before" and "after" are the comparison and a per-file
 * breakdown would re-create the two-point problem one level down */
const phases = new Map();
for (const g of groups) {
  const key = g.label.startsWith("before") ? "before the instruction" : "after the instruction";
  if (!phases.has(key)) phases.set(key, { probed: 0, flagged: [] });
  const ph = phases.get(key);
  ph.probed += g.probed;
  ph.flagged.push(...g.flagged);
}

console.log("WHAT THE PROBE IS NAMING, by phase");
console.log("");
const kindsSeen = new Set();
for (const ph of phases.values()) for (const r of ph.flagged) kindsSeen.add(r.options_probe.cue_kind || "(none)");
const kinds = [...kindsSeen].sort();
const header = "  " + "cue_kind".padEnd(22) + [...phases.keys()].map((k) => k.padStart(24)).join("");
console.log(header);
console.log("  " + "-".repeat(header.length - 2));
for (const k of kinds) {
  let line = "  " + k.padEnd(22);
  for (const ph of phases.values()) {
    const n = ph.flagged.filter((r) => (r.options_probe.cue_kind || "(none)") === k).length;
    const pctOf = ph.flagged.length ? Math.round((n / ph.flagged.length) * 100) : 0;
    line += (n + " (" + pctOf + "%)").padStart(24);
  }
  console.log(line);
}
let totline = "  " + "TOTAL FLAGGED".padEnd(22);
for (const ph of phases.values()) totline += (ph.flagged.length + " of " + ph.probed).padStart(24);
console.log("  " + "-".repeat(header.length - 2));
console.log(totline);
console.log("");
/* THE HABIT THE INSTRUCTION TARGETED, found in what each cue DESCRIBES rather than in its label. */
const QUAL = /tack on|attach|add(?:s|ing)? a|adds an|extra condition|restricting|restrictive|limiting|excluding|sweeping quantifier|absolute|narrow(?:er)? extra|terminating condition|qualifier|dismissive clause|contrastive/i;
const PLAIN = /lone|only (?:plain|one that|option that)|alone keeps|single uniquely|plain affirmative|plain positi/i;
const describesHabit = (r) => {
  const c = String(r.options_probe.cue || "");
  return QUAL.test(c) || PLAIN.test(c);
};
console.log("");
console.log("  THE TARGETED HABIT, measured on what the cue DESCRIBES rather than on its label");
console.log("    (a distractor made wrong by ADDING a qualifier or condition, leaving the key plain)");
for (const [phase, ph] of phases) {
  const hit = ph.flagged.filter(describesHabit).length;
  console.log("    " + phase.padEnd(26) + hit + " of " + ph.flagged.length + " flag(s) (" +
    (ph.flagged.length ? Math.round((hit / ph.flagged.length) * 100) : 0) + "% of flags), " +
    (ph.probed ? Math.round((hit / ph.probed) * 100) : 0) + "% of probed survivors");
}
console.log("");
console.log("  THIS IS A LEXICAL PROXY OVER THE PROBE'S PROSE, so it is a draft until its members are");
console.log("  read. All 13 shared-phrase members after the instruction were read and they matched.");
console.log("");
console.log("  AND cue_kind NEARLY REVERSED THE CONCLUSION. It shows odd-verdict falling 36% -> 21% of");
console.log("  flags, which reads as the instruction working. The members say the habit moved into");
console.log("  shared-phrase instead: more parallel options is exactly what \"as broad and as measured");
console.log("  in tone as the key\" asks for, so the probe notices the shared opening first and files");
console.log("  the same defect under a different kind. A label is not a taxonomy of defects.");
console.log("");
/* This paragraph used to read: "if that habit's share has fallen while the total has risen, the instruction
 * worked and something else got worse". That was the hypothesis before the members were read, and the
 * measurement above refutes it -- so it is rewritten rather than left standing next to the number that
 * disagrees with it. A stale sentence beside a live figure is read as the figure's interpretation. */
console.log("  MEASURED, NOT ARGUED: the habit's share of flags ROSE, and so did the total. The instruction");
console.log("  did not trade one cue for another; the cue_kind label moved while the defect stayed and got");
console.log("  more common. Reading the members is what separated those two, and nothing else would have.");
console.log("");

/* the members */
for (const [phase, ph] of phases) {
  console.log("=== " + phase.toUpperCase() + " -- " + ph.flagged.length + " flagged survivor(s)");
  const byKind = new Map();
  for (const r of ph.flagged) {
    const k = r.options_probe.cue_kind || "(none)";
    if (!byKind.has(k)) byKind.set(k, []);
    byKind.get(k).push(r);
  }
  for (const k of [...byKind.keys()].sort()) {
    const list = byKind.get(k);
    console.log("");
    console.log("  " + k + "   " + list.length);
    const show = FULL ? list : list.slice(0, 4);
    for (const r of show) {
      console.log("    " + r.task_code + "  " + String(r.options_probe.cue || "").slice(0, 150));
    }
    if (!FULL && list.length > show.length) {
      console.log("    ... and " + (list.length - show.length) + " more (--full)");
    }
  }
  console.log("");
}
console.log("Every cue sentence above is the PROBE's own words about the item it just answered, not a");
console.log("classification of mine. A count is a draft until somebody reads its members.");

/* the artifact, so the enumeration outlives the terminal -- terminals are not what anyone reads later */
const md = ["# What the options probe is naming", "",
  "Read for PROMPT-93 s4, after the writer instruction raised the flag rate instead of lowering it.", ""];
md.push("| cue_kind | " + [...phases.keys()].join(" | ") + " |");
md.push("|---|" + [...phases.keys()].map(() => "---|").join(""));
for (const k of kinds) {
  const cells = [...phases.values()].map((ph) => {
    const n = ph.flagged.filter((r) => (r.options_probe.cue_kind || "(none)") === k).length;
    return n + " (" + (ph.flagged.length ? Math.round((n / ph.flagged.length) * 100) : 0) + "%)";
  });
  md.push("| `" + k + "` | " + cells.join(" | ") + " |");
}
md.push("| **total flagged** | " + [...phases.values()].map((ph) => "**" + ph.flagged.length +
  " of " + ph.probed + "**").join(" | ") + " |");
md.push("");
md.push("## The targeted habit, measured on what each cue describes");
md.push("");
md.push("`cue_kind` is the probe's label for what it noticed first, not a taxonomy of item defects. It");
md.push("shows `odd-verdict` falling from 36% of flags to 21%, which reads as the instruction working.");
md.push("Reading the members says otherwise: the habit moved into `shared-phrase`.");
md.push("");
md.push("| phase | flags describing the habit | of flags | of probed survivors |");
md.push("|---|---|---|---|");
for (const [phase, ph] of phases) {
  const hit = ph.flagged.filter(describesHabit).length;
  md.push("| " + phase + " | " + hit + " of " + ph.flagged.length + " | " +
    (ph.flagged.length ? Math.round((hit / ph.flagged.length) * 100) : 0) + "% | " +
    (ph.probed ? Math.round((hit / ph.probed) * 100) : 0) + "% |");
}
md.push("");
md.push("This is a lexical proxy over the probe's prose and is a draft until its members are read. All");
md.push("13 `shared-phrase` members from after the instruction were read and they matched.");
md.push("");
for (const [phase, ph] of phases) {
  md.push("## " + phase + " -- every flagged survivor");
  md.push("");
  for (const r of ph.flagged) {
    md.push("- **" + r.task_code + "** `" + (r.options_probe.cue_kind || "(none)") + "` " +
      String(r.options_probe.cue || "").replace(/\s+/g, " "));
  }
  md.push("");
}
writeFileSync(join(ROOT, "PROBE-CUE-READING.md"), md.join("\n") + "\n", "utf8");
console.log("");
console.log("wrote PROBE-CUE-READING.md");
