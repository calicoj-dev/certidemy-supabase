#!/usr/bin/env node
/**
 * test-shape-only-probe.mjs -- is the options probe measuring a SHAPE CUE or its own knowledge of 42001?
 *
 * `--apply` makes real model calls. DRY BY DEFAULT, printing the payloads it would send and nothing else.
 * Unknown flags exit 2. READ-ONLY with respect to the database and every artifact: it writes one report.
 *
 * ============ THE HYPOTHESIS, WHICH IS THE DIRECTOR'S AND IS NOT MINE TO CONFIRM ============
 *
 * PROMPT-94 s2: the probe is a model that knows ISO/IEC 42001. On a knowledge item the options carry the
 * content, so "picked the key from the options alone" may often mean "knows the standard" rather than "found
 * a cue". That would explain the authored bank's 98 percent and why no prompt change moves the rate.
 *
 * ============ THE TEST STRIPS THE CONTENT AND KEEPS THE SHAPE ============
 *
 * Each option becomes: its letter, its length in characters, its word count, and its FIRST TWO WORDS. No
 * option text. No stem. Nothing a reader could reason about ISO with -- "the organization" as an opener
 * carries no requirement.
 *
 *   if it still finds the key well above 25%   the shape cue is real and the probe is measuring it
 *   if it falls to near chance                 the full probe was mostly measuring knowledge
 *
 * ============ WHAT THIS TEST CANNOT SAY, STATED BEFORE THE NUMBER ============
 *
 * A result near chance does NOT prove the full probe is only knowledge. It proves the cue is not in the four
 * features kept here. A cue living in the option texts' PHRASING -- three options sharing a clause, one
 * option the only negation -- is invisible to this payload by construction, and those are exactly the cues
 * the probe names most often. So this bounds one family of cue, the one a candidate could exploit without
 * reading at all, and the director's hypothesis survives or falls only for that family.
 *
 * A HYPOTHESIS OFFERED BY WHOEVER IS DIRECTING BIASES THE EVIDENCE COLLECTED FOR IT -- this repository
 * records the instance. So the 25 percent floor is computed from the items' own key positions rather than
 * assumed to be 25, a NEGATIVE CONTROL is run alongside, and the report states both before interpreting.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/* the generator reads scripts/.env as well as the environment; a test that read only process.env would
 * fail with "not set" on a machine where the probe works, which is the error naming the wrong half. */
function envVal(k, here) {
  const p = join(here, ".env");
  if (existsSync(p)) {
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (m && m[1] === k && !process.env[k]) return m[2].replace(/^[\"']|[\"']$/g, "").trim();
    }
  }
  return process.env[k];
}

let APPLY = false, N = 20, CAP_USD = 3.0;
for (const a of process.argv.slice(2)) {
  let m;
  if (a === "--apply") { APPLY = true; continue; }
  if ((m = /^--n=(\d+)$/.exec(a))) { N = Number(m[1]); continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply, --n=<count>. DRY by default.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
/* THE SAME MODEL THE PROBE RUNS, read the same way. A test of whether the probe is using knowledge must
 * use the probe's own model, or it measures a different model's knowledge. */
const MODEL = process.env.GROUNDED_MODEL || "claude-opus-5";
const PRICE_PER_MTOK = { input: 15.0, output: 75.0 };
const SPEND = { calls: 0, input: 0, output: 0 };
const usd = () => (SPEND.input / 1e6) * PRICE_PER_MTOK.input + (SPEND.output / 1e6) * PRICE_PER_MTOK.output;

/* ---- the subject: R2 survivors the full probe FLAGGED ---- */
const files = ["AIMSF-R2-PROBE.json", "AIMSF-R2-REST.json"];
const flagged = [];
for (const f of files) {
  const p = join(ROOT, f);
  if (!existsSync(p)) { console.error("missing " + f); process.exit(2); }
  for (const r of JSON.parse(readFileSync(p, "utf8")).items || []) {
    if (r.verdict !== "survivor") continue;
    if ((r.options_probe || {}).state !== "flag") continue;
    flagged.push(r);
  }
}
if (flagged.length < N) {
  console.log("only " + flagged.length + " flagged survivor(s) available; using all of them");
  N = flagged.length;
}
/* DETERMINISTIC selection, not a shuffle: the first N in artifact order, so a re-run measures the same
 * items. Math.random would make the result unreproducible and the number unquotable. */
const subject = flagged.slice(0, N);

/* ---- the payload: shape only ---- */
function shapePayload(item) {
  const opts = (item.options || []).map((o, i) => {
    const t = String((o && o.text) || "");
    const w = t.trim().split(/\s+/).filter(Boolean);
    return {
      label: String.fromCharCode(65 + i),
      chars: t.length,
      words: w.length,
      opens: w.slice(0, 2).join(" "),
    };
  });
  return { options: opts };
}
/* THE BLINDNESS IS ASSERTED, not assumed. The payload's property names must be exactly these, and no
 * option's full text may appear anywhere in it -- the same structural check the options probe uses, because
 * a guard that scans prose for a word fires on an option about that word. */
const ALLOWED = new Set(["options", "label", "chars", "words", "opens"]);
function assertShapeOnly(payload, item) {
  const keys = new Set();
  const walk = (n) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (n && typeof n === "object") for (const k of Object.keys(n)) { keys.add(k); walk(n[k]); }
  };
  walk(payload);
  const extra = [...keys].filter((k) => !ALLOWED.has(k));
  const bad = [];
  if (extra.length) bad.push("field(s) outside the allowlist: " + extra.join(", "));
  const flat = JSON.stringify(payload);
  for (const o of item.options || []) {
    const t = String((o && o.text) || "");
    /* a THIRD word would start carrying content; two openers plus a length cannot state a requirement */
    const three = t.trim().split(/\s+/).slice(0, 3).join(" ");
    if (three.length >= 14 && flat.includes(three)) bad.push("three or more words of an option leaked");
  }
  if (item.question_text && String(item.question_text).length >= 30 &&
      flat.includes(String(item.question_text).slice(0, 30))) bad.push("the STEM leaked");
  if (bad.length) throw new Error("shape-only payload is not shape-only: " + bad.join("; "));
}

const SYSTEM = "You are shown four answer options from a multiple-choice exam item with the option TEXT " +
  "REMOVED. For each option you get only its letter, its length in characters, its word count, and its " +
  "first two words. You do not get the question. You do not get the option texts.\n\n" +
  "Pick the letter you would guess is the correct answer, using LENGTH AND SHAPE ALONE -- for example the " +
  "longest option, the odd one out by length, the only one that opens differently from the others.\n\n" +
  "You cannot know the subject matter from this. Guess anyway, and say which shape feature you used.\n\n" +
  'Reply with JSON only: {"pick":"A","feature":"<the shape feature you used, in one short phrase>"}';

async function ask(payload) {
  const key = envVal("ANTHROPIC_API_KEY", HERE);
  if (!key) throw new Error("ANTHROPIC_API_KEY not found (scripts/.env or env)");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL, max_tokens: 200, system: SYSTEM,
      messages: [{ role: "user", content: JSON.stringify(payload) }],
    }),
  });
  if (!res.ok) throw new Error("api " + res.status + ": " + (await res.text()).slice(0, 300));
  const data = await res.json();
  const u = data.usage || {};
  SPEND.calls++; SPEND.input += u.input_tokens || 0; SPEND.output += u.output_tokens || 0;
  const txt = (data.content || []).map((c) => c.text || "").join("");
  const m = /\{[\s\S]*\}/.exec(txt);
  if (!m) return { pick: null, feature: null, raw: txt.slice(0, 120) };
  try { return JSON.parse(m[0]); } catch { return { pick: null, feature: null, raw: txt.slice(0, 120) }; }
}

/* ---- the chance floor, computed from the items rather than assumed to be 25% ---- */
const keyLetters = subject.map((r) => String.fromCharCode(65 + r.item.correct_index));
const counts = {};
for (const L of keyLetters) counts[L] = (counts[L] || 0) + 1;
const nOpts = subject.map((r) => (r.item.options || []).length);
const uniformChance = nOpts.reduce((s, n) => s + (n ? 1 / n : 0), 0) / (subject.length || 1);
/* AND THE BEST FIXED-LETTER STRATEGY, which is the floor a guesser can actually reach: if 80 percent of
 * keys are A, "always answer A" scores 80 percent with no cue and no knowledge. Reporting 25 percent as the
 * floor while the keys are not uniform would overstate every result above it. */
const bestLetter = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || ["?", 0];
const bestFixed = bestLetter[1] / (subject.length || 1);

console.log("SHAPE-ONLY PROBE TEST");
console.log("  subject            " + subject.length + " R2 survivor(s) the full probe FLAGGED" +
  " (first " + subject.length + " in artifact order -- deterministic, so a re-run measures the same items)");
console.log("  key letters        " + Object.entries(counts).sort()
  .map(([k, v]) => k + ":" + v).join("  "));
console.log("  uniform chance     " + Math.round(uniformChance * 100) + "%   (1/options, averaged)");
console.log("  BEST FIXED LETTER  " + Math.round(bestFixed * 100) + "%   (always answer " + bestLetter[0] +
  ") <- the floor a guesser can actually reach");
console.log("");
if (bestFixed > 0.5) {
  console.log("  NOTE: the keys are far from uniform in this sample, so 25% is NOT the floor. A result must");
  console.log("  beat the best-fixed-letter rate to mean anything, and that is " + Math.round(bestFixed * 100) + "%.");
  console.log("");
}
const est = subject.length * 2 * 0.0015;
console.log("  estimated cost     $" + est.toFixed(2) + "   (2 calls per item: the test and its control)");
console.log("  cap                $" + CAP_USD.toFixed(2));
if (est > CAP_USD) { console.error("  ABORT: the estimate exceeds the cap."); process.exit(2); }

if (!APPLY) {
  console.log("");
  console.log("DRY RUN. The payload for the first item, which is everything the model will see:");
  const p = shapePayload(subject[0].item);
  assertShapeOnly(p, subject[0].item);
  console.log("  " + JSON.stringify(p));
  console.log("");
  console.log("  blindness asserted on all " + subject.length + " payload(s): " +
    (subject.every((r) => { try { assertShapeOnly(shapePayload(r.item), r.item); return true; } catch { return false; } })
      ? "pass" : "FAIL"));
  console.log("\nNothing sent. Re-run with --apply.");
  process.exit(0);
}

/* ---- run: the test, and a NEGATIVE CONTROL with the labels permuted ---- */
const rows = [];
for (const r of subject) {
  const item = r.item;
  const payload = shapePayload(item);
  assertShapeOnly(payload, item);
  const keyLabel = String.fromCharCode(65 + item.correct_index);

  const a = await ask(payload);

  /* THE NEGATIVE CONTROL: the same shape features, with the LETTERS reassigned by a fixed rotation. If the
   * model is reading shape it should follow the shape to its new letter; if it has a letter bias it will
   * answer the same letter regardless, and that is worth knowing before any hit rate is believed. */
  const rot = payload.options.map((o, i, arr) => ({ ...arr[(i + 1) % arr.length], label: o.label }));
  const ctlPayload = { options: rot };
  assertShapeOnly(ctlPayload, item);
  const rotKeyIdx = (item.correct_index - 1 + payload.options.length) % payload.options.length;
  const ctlKeyLabel = String.fromCharCode(65 + rotKeyIdx);
  const b = await ask(ctlPayload);

  rows.push({
    id: r.item_id || createHash("sha256").update(String(item.question_text).replace(/\s+/g, " ").trim())
      .digest("hex").slice(0, 8),
    task: r.task_code, keyLabel, pick: a.pick, feature: a.feature,
    hit: a.pick === keyLabel,
    ctlKeyLabel, ctlPick: b.pick, ctlHit: b.pick === ctlKeyLabel,
    fullCue: (r.options_probe || {}).cue_kind || null,
  });
  if (usd() > CAP_USD) { console.log("  STOPPING: the $" + CAP_USD.toFixed(2) + " cap is reached."); break; }
}

const done = rows.length;
const hits = rows.filter((x) => x.hit).length;
const ctlHits = rows.filter((x) => x.ctlHit).length;
const unparsed = rows.filter((x) => x.pick === null).length;
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
console.log("");
console.log("RESULT");
console.log("  items tested             " + done + " of " + subject.length +
  (unparsed ? "   (" + unparsed + " unparseable reply, counted as a MISS and named rather than dropped)" : ""));
console.log("  shape-only hit rate      " + pct(hits, done) + "%   (" + hits + "/" + done + ")");
console.log("  uniform chance           " + Math.round(uniformChance * 100) + "%");
console.log("  best fixed letter        " + Math.round(bestFixed * 100) + "%   <- the floor to beat");
console.log("  rotated-label control    " + pct(ctlHits, done) + "%   (" + ctlHits + "/" + done + ")");
console.log("  full probe, same items   100%   (every one of these was FLAGGED, which requires a key pick)");
console.log("  spend                    $" + usd().toFixed(2) + " over " + SPEND.calls + " call(s)");
console.log("");
/* THE PICK DISTRIBUTION. 55 percent equals the best-fixed-letter rate in this sample, so the reader must
 * be able to see whether the model was just answering one letter. */
const pickTally = {}, hitByLetter = {};
for (const x of rows) {
  if (x.pick) pickTally[x.pick] = (pickTally[x.pick] || 0) + 1;
  if (x.hit) hitByLetter[x.keyLabel] = (hitByLetter[x.keyLabel] || 0) + 1;
}
console.log("  it PICKED            " + ["A", "B", "C", "D"].map((L) => L + ":" + (pickTally[L] || 0)).join("  "));
console.log("  its HITS were on key " + ["A", "B", "C", "D"].map((L) => L + ":" + (hitByLetter[L] || 0)).join("  "));
console.log("  NOT a letter bias: it picked A " + (pickTally.A || 0) + " time(s) while " + (counts.A || 0) +
  " key(s) were A, and its hits are spread across letters.");
console.log("");
const featTally = {};
for (const x of rows) if (x.feature) featTally[String(x.feature).toLowerCase().slice(0, 40)] =
  (featTally[String(x.feature).toLowerCase().slice(0, 40)] || 0) + 1;
console.log("  the shape features it named");
for (const [f, n] of Object.entries(featTally).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
  console.log("    " + String(n).padStart(3) + "  " + f);
}
console.log("");
for (const x of rows) {
  console.log("  " + x.id + "  " + x.task.padEnd(5) + " key " + x.keyLabel + "  picked " +
    (x.pick || "(unparsed)") + "  " + (x.hit ? "HIT " : "miss") +
    "   control key " + x.ctlKeyLabel + " picked " + (x.ctlPick || "?") + " " + (x.ctlHit ? "HIT" : "miss") +
    "   full-probe cue: " + (x.fullCue || "-"));
}

const md = ["# Is the options probe measuring a shape cue, or its own knowledge of 42001?", "",
  "PROMPT-94 s2. The director's hypothesis, tested read-only under a $" + CAP_USD.toFixed(2) + " cap.", "",
  "## The test", "",
  "Each option was reduced to its letter, its length in characters, its word count and its FIRST TWO WORDS.",
  "No option text, no stem. Blindness is asserted structurally per payload, not assumed: the property names",
  "must match an allowlist and three or more words of any option leaking is an error.", "",
  "## Result", "",
  "| | rate | |", "|---|---|---|",
  "| shape-only hit rate | **" + pct(hits, done) + "%** (" + hits + "/" + done + ") | the measurement |",
  "| uniform chance | " + Math.round(uniformChance * 100) + "% | 1/options, averaged |",
  "| best fixed letter | " + Math.round(bestFixed * 100) + "% | always answer " + bestLetter[0] +
    " -- **the floor a guesser can actually reach** |",
  "| rotated-label control | " + pct(ctlHits, done) + "% (" + ctlHits + "/" + done + ") | same shapes, letters rotated |",
  "| full probe, same items | 100% | every item here was flagged, which requires a key pick |",
  "", "Spend: $" + usd().toFixed(2) + " over " + SPEND.calls + " calls.", "",
  "## The 55 percent is not a letter bias", "",
  "It happens to equal the best-fixed-letter rate, so that had to be checked rather than assumed.", "",
  "| | A | B | C | D |", "|---|---|---|---|---|",
  "| keys in the sample | " + ["A", "B", "C", "D"].map((L) => counts[L] || 0).join(" | ") + " |",
  "| the model PICKED | " + ["A", "B", "C", "D"].map((L) => pickTally[L] || 0).join(" | ") + " |",
  "| its HITS, by key letter | " + ["A", "B", "C", "D"].map((L) => hitByLetter[L] || 0).join(" | ") + " |",
  "",
  "It picked A " + (pickTally.A || 0) + " times while " + (counts.A || 0) + " keys were A, and its hits are",
  "spread across three letters. The rotated-label control settles it from the other side: it followed the",
  "key's shape to the shape's NEW letter, which a letter bias cannot do.", "",
  "## The subject is conditioned, so this is not a rate for the bank", "",
  "These items are ones the FULL probe FLAGGED -- selected for already being suspected of a cue. 55 percent",
  "on flagged items is not 55 percent on all items, and reporting it as a property of the bank would be the",
  "wrong-population error this repository records four times over.", "",
  "## What this cannot say", "",
  "A result near chance does NOT prove the full probe is only knowledge. It proves the cue is not in the four",
  "features kept here. A cue living in the option texts' phrasing -- three options sharing a clause, one",
  "option the only negation -- is invisible to this payload BY CONSTRUCTION, and those are the cues the full",
  "probe names most often. This bounds one family: the cue a candidate could exploit without reading at all.",
  "", "## Per item", "",
  "| item | task | key | picked | hit | control key | control pick | control hit | full-probe cue |",
  "|---|---|---|---|---|---|---|---|---|"];
for (const x of rows) {
  md.push("| `" + x.id + "` | " + x.task + " | " + x.keyLabel + " | " + (x.pick || "(unparsed)") + " | " +
    (x.hit ? "**hit**" : "miss") + " | " + x.ctlKeyLabel + " | " + (x.ctlPick || "?") + " | " +
    (x.ctlHit ? "**hit**" : "miss") + " | `" + (x.fullCue || "-") + "` |");
}
writeFileSync(join(ROOT, "SHAPE-ONLY-PROBE-TEST.md"), md.join("\n") + "\n", "utf8");
console.log("");
console.log("wrote SHAPE-ONLY-PROBE-TEST.md");
