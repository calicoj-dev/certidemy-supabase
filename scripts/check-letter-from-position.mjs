#!/usr/bin/env node
/**
 * check-letter-from-position.mjs -- the letters read A, B, C, D whatever order the server sends.
 *
 * READ-ONLY, no network, no credential. Unknown flags exit 2. Ruled PROMPT-95 addendum-2 points 3 and 5.
 *
 * ============ WHAT THIS PROVES, AND WHY IT IS THE WHOLE POINT ============
 *
 * `exam-runner.tsx` used to render the chip letter from `opt.id.toUpperCase()`. Once the server serves options
 * in a per-attempt order with the ids unchanged, that produced two defects at once:
 *
 *   1. the candidate saw the letters SCRAMBLED -- C, A, D, B down the list;
 *   2. the letter still followed the STORED position, so clicking "A" selected id `a` in every attempt and
 *      the shuffle protected nothing.
 *
 * With the letter drawn from the INDEX, the list always reads A, B, C, D and the submitted id is whatever
 * the server put at the clicked position. That is what makes "always answer A" stop working.
 *
 * ============ IT MODELS THE CLIENT, AND SAYS SO ============
 *
 * This is a Node script asserting the RULE the component now implements -- `String.fromCharCode(65 + idx)`
 * for the label, `opt.id` for the submission -- not the rendered DOM. It cannot catch a future edit that
 * changes the component without changing this file. So it also READS the component and asserts the two
 * shapes are present, which is the nearest thing to a wire check available without a browser.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { orderOptionsForAttempt } from "../functions/_shared/item-rules/option-order.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WEB = join(ROOT, "..", "certidemy-web");

let fails = 0;
const ok = (what, cond, detail) => {
  console.log((cond ? "  ok   " : "  FAIL ") + what + (cond ? "" : "   " + detail));
  if (!cond) fails++;
  return cond;
};

/* ---- the client's rule, as the component now implements it ---- */
const renderList = (served) => served.map((o, idx) => ({
  letter: String.fromCharCode(65 + idx),      /* exam-runner.tsx: the chip */
  text: o.text,
  submitsId: o.id,                            /* exam-runner.tsx: toggleOption(opt.id) */
}));
/* the keyboard handler, same rule: a letter resolves to a POSITION */
const pressLetter = (served, letter) => served[letter.toLowerCase().charCodeAt(0) - 97];

/* ---- one REAL item, taken from the artifacts rather than invented ---- */
const FILES = ["AIMSF-R3-REST.json", "AIMSF-R2-REST.json", "AIMSF-ROLLOUT-B2.json"];
let item = null, itemId = null;
for (const f of FILES) {
  const p = join(ROOT, f);
  if (!existsSync(p)) continue;
  const r = (JSON.parse(readFileSync(p, "utf8")).items || []).find((x) => x.verdict === "survivor");
  if (!r) continue;
  const keyIdx = typeof r.item.correct_index === "number"
    ? r.item.correct_index : (r.item.options || []).findIndex((o) => o.is_correct);
  item = {
    stem: r.item.question_text,
    options: r.item.options.map((o, i) => ({ id: String.fromCharCode(97 + i), text: o.text })),
    correct: [String.fromCharCode(97 + keyIdx)],
  };
  itemId = r.item_id || "item-1";
  break;
}
if (!item) { console.error("no artifact item found to test with"); process.exit(2); }
const keyText = item.options.find((o) => o.id === item.correct[0]).text;

console.log("ONE REAL ITEM, TWO SEEDED ORDERS");
console.log("  " + String(item.stem).replace(/\s+/g, " ").slice(0, 100) + "...");
console.log("  stored order: " + item.options.map((o) => o.id + "=" + o.text.slice(0, 22)).join(" | "));
console.log("  the key is id " + item.correct[0]);
console.log("");

const gradesCorrect = (correctIds, givenIds) => {
  const c = new Set(correctIds), g = new Set(givenIds);
  return c.size === g.size && [...c].every((x) => g.has(x));
};

const SEEDS = ["session-ONE", "session-TWO"];
const seenOrders = new Set();
for (const s of SEEDS) {
  const served = orderOptionsForAttempt(item.options, [s, itemId]);
  const shown = renderList(served);
  seenOrders.add(served.map((o) => o.id).join(""));
  console.log("  attempt " + s + "   server order " + served.map((o) => o.id).join(",") +
    "   ids at each position");
  for (const row of shown) {
    console.log("     " + row.letter + ")  [submits id " + row.submitsId + "]  " + row.text.slice(0, 62));
  }
  /* 3a. the letters read A, B, C, D top to bottom */
  const letters = shown.map((r) => r.letter).join("");
  ok("letters read " + "ABCD".slice(0, shown.length) + " top to bottom", letters === "ABCD".slice(0, shown.length), letters);
  /* 3b. the submitted id is the one for the TEXT that was clicked */
  const clicked = shown.find((r) => r.text === keyText);
  ok("clicking the key's TEXT submits the key's id",
    clicked && clicked.submitsId === item.correct[0],
    clicked ? "submitted " + clicked.submitsId + ", expected " + item.correct[0] : "the key text is not on screen");
  ok("...and that submission grades correct", clicked && gradesCorrect(item.correct, [clicked.submitsId]));
  /* 3c. the keyboard letter resolves to the SAME option as the chip */
  const viaKey = pressLetter(served, clicked.letter);
  ok("pressing '" + clicked.letter.toLowerCase() + "' selects the same option the chip labels",
    viaKey && viaKey.id === clicked.submitsId,
    viaKey ? "keyboard gave id " + viaKey.id + ", chip says " + clicked.submitsId : "no option at that position");
  console.log("");
}
/* the two attempts must actually differ, or the test is vacuous */
ok("the two attempts produced DIFFERENT server orders (or this proves nothing)", seenOrders.size === 2,
  "both attempts served " + [...seenOrders][0]);

/* ---- POINT 5: with the CURRENT unshuffled order, the display is unchanged ---- */
console.log("POINT 5 -- THE WEB CHANGE ALONE, WITH OPTIONS IN STORED ORDER");
const storedShown = renderList(item.options);
ok("the letters are still A, B, C, D", storedShown.map((r) => r.letter).join("") === "ABCD".slice(0, storedShown.length));
ok("each letter still sits on its own id (A->a, B->b, ...)",
  storedShown.every((r, i) => r.submitsId === String.fromCharCode(97 + i)),
  storedShown.map((r) => r.letter + "->" + r.submitsId).join(" "));
ok("so shipping the web change before the functions displays exactly what it displays today",
  storedShown.map((r) => r.letter + r.submitsId).join("") ===
    item.options.map((o, i) => String.fromCharCode(65 + i) + o.id).join(""));
console.log("");

/* ---- the component really does implement this rule ---- */
console.log("THE COMPONENTS CARRY THE TWO SHAPES");
const SITES = [
  ["components/exam/exam-runner.tsx", "String.fromCharCode(65 + idx)", "toggleOption(opt.id)"],
  ["components/lessons/sections/checkpoint.tsx", "String.fromCharCode(65 + idx)", "toggle(opt.id)"],
  ["components/lessons/widgets/scenario-mcq.tsx", "String.fromCharCode(65 + idx)", "choose(opt)"],
  ["components/marketing/sample-questions.tsx", "String.fromCharCode(65 + idx)", null],
];
for (const [rel, letterShape, idShape] of SITES) {
  const p = join(WEB, rel);
  if (!existsSync(p)) { ok(rel + " exists", false, "not found"); continue; }
  const src = readFileSync(p, "utf8");
  ok(rel + " labels from the position", src.includes(letterShape), "missing " + letterShape);
  if (idShape) ok(rel + " still submits the id", src.includes(idShape), "missing " + idShape);
  ok(rel + " no longer labels from opt.id", !/\{\s*opt\.id\.toUpperCase\(\)\s*\}/.test(src) &&
    !/mark = id\.toUpperCase\(\)/.test(src), "an id-derived label survives");
}
/* and the keyboard handler must resolve by position */
{
  const src = readFileSync(join(WEB, "components/exam/exam-runner.tsx"), "utf8");
  ok("the keyboard handler resolves a letter by POSITION",
    src.includes("opts[key.charCodeAt(0) - 97]"), "it still matches the option id");
  /* ============ THE PROPERTY IS POSITIONAL, NOT LEXICAL ============
   *
   * This asserted the retired lookup was absent from the file, and it FAILED -- because the comment above the
   * fix quotes the old line to say what it used to be, which is what makes the comment readable. Exactly the
   * defect CLAUDE.md records against migration 290: a guard searching for a STRING when the property is a
   * PLACE, tripped by prose that deliberately quotes the thing it forbids.
   *
   * So the retired lookup must not appear as CODE. Comment lines are stripped first, and the comment is left
   * alone rather than the guard editing the content. */
  const codeOnly = src.split(/\r?\n/)
    .filter((l) => {
      const t = l.trim();
      const sl = String.fromCharCode(47), st = String.fromCharCode(42);
      return !(t.startsWith(sl + sl) || t.startsWith(st) || t.startsWith(sl + st));
    })
    .join("\n");
  ok("...and no id-matching lookup survives as CODE (the comment may quote it)",
    !codeOnly.includes("o.id.toLowerCase() === key"), "the id lookup is still live code");
}
console.log("");
console.log(fails ? fails + " assertion(s) FAILED" : "all assertions pass");
console.log("");
console.log("WHAT THIS CANNOT DO: it models the component's RULE, not its rendered DOM. A future edit that");
console.log("changes exam-runner.tsx without changing this file would go unnoticed -- which is why it also");
console.log("reads the component and asserts both shapes are present.");
if (fails) process.exitCode = 1;
