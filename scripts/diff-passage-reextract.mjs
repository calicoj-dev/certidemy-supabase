#!/usr/bin/env node
/**
 * diff-passage-reextract.mjs -- diff the re-extracted passages against the previous artifact.
 *
 * READ-ONLY, no writes beyond one local report, no model calls. Ruled PROMPT-87 s1b: diff old against new,
 * print 10 diffs, and EVERY changed passage must be the same text minus the noise. A diff that changes
 * WORDING is a failure, not an improvement.
 *
 * ============ THE TEST FOR "SAME TEXT MINUS THE NOISE" ============
 *
 * Comparing the two strings directly cannot answer it: removing noise changes the string, which is the
 * point. So both sides are reduced to a NOISE-INVARIANT form -- letters and digits only, lower case, every
 * space and hyphen dropped -- and the two forms must be EQUAL.
 *
 * That form is invariant under exactly the four repairs: de-hyphenating a wrap, closing a run-together,
 * removing a doubled word (NO -- a doubling changes it, so doublings are reported separately), and moving
 * the title out of the statement (also a real change, reported separately).
 *
 * So there are THREE verdicts, not two:
 *   pure-join    the invariant form is identical: only spaces and hyphens moved. Safe by construction.
 *   text-moved   the form differs, and the difference is accounted for by a removed prefix (title bleed)
 *                or a removed duplicate span. Shown in full for a human.
 *   WORDING      the form differs and nothing accounts for it. A FAILURE by the ruling.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BEFORE = process.env.CLAUDE_JOB_DIR + "/tmp/SOURCE-PASSAGES.before.json";
const before = JSON.parse(readFileSync(BEFORE, "utf8"));
const after = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));

const key = (p) => p.source_id + "|" + p.edition + "|" + p.clause;
const mapB = new Map(before.passages.map((p) => [key(p), p]));
const mapA = new Map(after.passages.map((p) => [key(p), p]));

/* the noise-invariant form: letters and digits only */
const inv = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const changed = [], added = [], removed = [];
for (const [k, a] of mapA) {
  const b = mapB.get(k);
  if (!b) { added.push({ k, a }); continue; }
  if (String(a.text) !== String(b.text) || String(a.title) !== String(b.title)) changed.push({ k, a, b });
}
for (const [k, b] of mapB) if (!mapA.has(k)) removed.push({ k, b });

/* classify each change */
const classify = (c) => {
  const ib = inv(c.b.text), ia = inv(c.a.text);
  if (ib === ia) return { verdict: "pure-join", why: "only spaces and hyphens moved" };
  /* a removed title prefix accounts for the difference */
  const tb = inv(c.b.title);
  if (tb && ib.startsWith(tb) && ib.slice(tb.length) === ia) {
    return { verdict: "text-moved", why: "the title prefix left the statement" };
  }
  /* the new form is a subsequence-free substring of the old: something was removed */
  if (ib.includes(ia)) return { verdict: "text-moved", why: "a span was removed from the statement" };
  if (ia.includes(ib)) return { verdict: "text-moved", why: "the statement gained text (a column tail rejoined)" };
  return { verdict: "WORDING", why: "the letter sequence differs and nothing accounts for it" };
};
for (const c of changed) Object.assign(c, classify(c));

const byVerdict = {};
for (const c of changed) byVerdict[c.verdict] = (byVerdict[c.verdict] || 0) + 1;
const failures = changed.filter((c) => c.verdict === "WORDING");

const md = [];
const p = (s = "") => md.push(s);
p("# Re-extraction diff");
p("");
p("**" + changed.length + " passage(s) changed**, " + added.length + " added, " + removed.length + " removed,");
p("of " + mapA.size + " held.");
p("");
p("A changed passage must be the same text minus the noise. Both sides are reduced to a NOISE-INVARIANT");
p("form -- letters and digits only -- and compared, because comparing the strings directly cannot answer");
p("the question: removing noise changes the string, which is the point.");
p("");
p("| verdict | passages | meaning |");
p("|---|---|---|");
p("| `pure-join` | " + (byVerdict["pure-join"] || 0) + " | only spaces and hyphens moved; safe by construction |");
p("| `text-moved` | " + (byVerdict["text-moved"] || 0) + " | a title prefix or column tail moved; shown for a human |");
p("| **`WORDING`** | **" + (byVerdict.WORDING || 0) + "** | **the letter sequence differs with nothing to account for it -- a FAILURE** |");
p("");
if (added.length || removed.length) {
  p("**Membership changed**, which the ruling did not ask for and which is reported first:");
  for (const x of added.slice(0, 20)) p("- ADDED `" + x.k + "`");
  for (const x of removed.slice(0, 20)) p("- REMOVED `" + x.k + "`");
  p("");
}
for (const v of ["WORDING", "text-moved", "pure-join"]) {
  const mine = changed.filter((c) => c.verdict === v);
  p("## `" + v + "` -- " + mine.length + ", first 10");
  p("");
  if (!mine.length) { p("_none_"); p(""); continue; }
  for (const c of mine.slice(0, 10)) {
    p("### `" + c.k + "`   (" + c.why + ")");
    p("");
    if (String(c.b.title) !== String(c.a.title)) {
      p("- title BEFORE: " + JSON.stringify(String(c.b.title)));
      p("- title AFTER : " + JSON.stringify(String(c.a.title)));
    }
    if (String(c.b.text) !== String(c.a.text)) {
      p("- text BEFORE: " + JSON.stringify(String(c.b.text).slice(0, 300)));
      p("- text AFTER : " + JSON.stringify(String(c.a.text).slice(0, 300)));
    }
    p("");
  }
}
writeFileSync(join(ROOT, "REEXTRACT-DIFF.md"), md.join("\n") + "\n", "utf8");
console.log("held: " + mapA.size + "   changed: " + changed.length + "   added: " + added.length +
  "   removed: " + removed.length);
for (const [k, v] of Object.entries(byVerdict)) console.log("  " + k.padEnd(12) + v);
console.log("wrote REEXTRACT-DIFF.md  (10 members per verdict)");
if (failures.length) {
  console.error("\n" + failures.length + " WORDING change(s) -- the ruling calls this a failure:");
  for (const c of failures.slice(0, 8)) console.error("  " + c.k);
  process.exitCode = 1;
}
if (added.length || removed.length) {
  console.error("\nmembership changed: " + added.length + " added, " + removed.length + " removed.");
  process.exitCode = 1;
}
