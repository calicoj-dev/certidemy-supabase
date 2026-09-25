#!/usr/bin/env node
/**
 * check-control-bytes.mjs -- no control byte may sit in tracked source.
 *
 * READ-ONLY. No flags. Exit 0 clean, 1 found, 2 could not look.
 *
 * ============ FIVE TIMES IN ONE SESSION ============
 *
 * A bash heredoc halved the backslashes in code being written through it, five
 * separate times on 2026-09-24. Four produced a literal newline inside a string
 * and failed loudly at `node --check`. The fifth did not:
 *
 *     /\b(integrity|confidentiality|availability)\b/i
 *
 * arrived as `/<0x08>(integrity|...)<0x08>/i` -- two literal BACKSPACE bytes.
 * That is valid JavaScript. It parses, it runs, and it silently matches
 * nothing, so the CIA gate would have reported clean on every row forever. It
 * was caught only because a fixture happened to sit next to it and fired.
 *
 * CLAUDE.md already carried the rule -- anything with escapes crosses a shell
 * as a FILE, never as a heredoc. **A rule broken five times in one session is a
 * rule without a guard.** This is the guard, and it costs a directory walk.
 *
 * ============ WHAT IT LOOKS FOR, AND WHY THAT SET ============
 *
 * Any byte below 0x20 that is not tab, LF or CR. Those three are legitimate
 * whitespace; the rest have no business in source and every one of them is
 * either a mangled escape or a paste accident. It also catches 0x7F and the
 * zero-width / BOM characters that survive a copy out of a rendered document.
 *
 * It does NOT look at content or meaning. A file can be full of defects and
 * pass this; that is the point. It answers one question that has a mechanical
 * answer, which is the only kind of question a guard should ask.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) {
    console.error("Unrecognised flag: " + a + ". This script is READ-ONLY and takes none.");
    process.exit(2);
  }
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Below 0x20 except tab/LF/CR, plus DEL, BOM and the zero-width family. */
const FORBIDDEN = (code) =>
  (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) ||
  code === 0x7f || code === 0xfeff || code === 0x200b || code === 0x200c || code === 0x200d;

const NAME = {
  0x00: "NUL", 0x07: "BEL", 0x08: "BACKSPACE", 0x0b: "VTAB", 0x0c: "FORMFEED",
  0x1b: "ESC", 0x7f: "DEL", 0xfeff: "BOM", 0x200b: "ZERO-WIDTH SPACE",
  0x200c: "ZERO-WIDTH NON-JOINER", 0x200d: "ZERO-WIDTH JOINER",
};
const label = (c) => NAME[c] || ("0x" + c.toString(16).padStart(2, "0"));

/* ============ POSITIVE CONTROL ============
 *
 * This guard reports a problem by FINDING something, so a broken version of it
 * reports clean -- the shape this repository has paid for more than any other.
 * The control is synthetic and needs no file on disk. */
function control() {
  const mustFire = [0x08, 0x00, 0x1b, 0x7f, 0xfeff, 0x200b];
  const mustNot = [0x09, 0x0a, 0x0d, 0x20, 0x41, 0xe9, 0x2014];
  const wrong = [
    ...mustFire.filter((c) => !FORBIDDEN(c)).map((c) => "missed " + label(c)),
    ...mustNot.filter((c) => FORBIDDEN(c)).map((c) => "false fire on 0x" + c.toString(16)),
  ];
  return wrong;
}
const broken = control();
if (broken.length) {
  console.error("CONTROL FAILED: " + broken.join(", "));
  console.error("No verdict printed: a broken detector reports clean.");
  process.exit(2);
}

let files;
try {
  files = execFileSync("git", ["ls-files", "*.mjs", "*.ts", "*.sql"], { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/).filter(Boolean);
} catch (e) {
  console.error("could not list tracked files: " + String(e).slice(0, 90));
  console.error("Nothing was examined, which is not a pass.");
  process.exit(2);
}
if (!files.length) {
  console.error("git listed no .mjs/.ts/.sql files at all -- that cannot be right.");
  process.exit(2);
}

/* ============ DECLARED EXEMPTIONS ============
 *
 * By NAME, with a reason, and never by shape -- a shape-based exemption lets a
 * DIFFERENT thing past, which this repository has paid for three times. An
 * entry here is a claim that somebody looked at that exact byte in that exact
 * file and found it load-bearing.
 */
const EXEMPT = [
  {
    file: "scripts/lib/item-hash.mjs",
    code: 0x00,
    why: "NUL is the FIELD SEPARATOR for the item hash. Deliberate and load-bearing: " +
         "a separator that cannot occur in the content is what stops field text " +
         "forging a boundary, the same reason translation_hash length-prefixes each " +
         "field. Changing it would move every item hash on the platform.",
  },
];
const exemptFor = (rel, code) => EXEMPT.find((e) => e.file === rel && e.code === code);

const findings = [];
let exempted = 0;
for (const rel of files) {
  let text;
  try { text = readFileSync(join(ROOT, rel), "utf8"); } catch { continue; }
  let line = 1;
  for (let i = 0; i < text.length; i++) {
    const c = text.codePointAt(i);
    if (c === 0x0a) { line++; continue; }
    if (!FORBIDDEN(c)) continue;
    if (exemptFor(rel, c)) { exempted++; continue; }
    const from = Math.max(0, i - 34);
    const ctx = text.slice(from, i).replace(/[\r\n]/g, " ");
    findings.push({ rel, line, c, ctx });
  }
}

/* ============ THE THIRD VARIANT: A CONTROL ESCAPE INSIDE A STRING ============
 *
 * The scan above reads BYTES, which is right for a mangled escape: a heredoc
 * halves a backslash and a real 0x08 lands in the file. But JavaScript produces
 * the same byte at RUNTIME from source that is perfectly legal:
 *
 *     "regex literals; \b is ASCII-only"      ->  prints with a BACKSPACE
 *
 * The file holds backslash + b. Nothing is mangled. The string still evaluates
 * to a control character, and the message it belongs to renders wrong wherever
 * it is printed -- which is how invariant 13 shipped describing itself as
 * "regex literals;  is ASCII-only".
 *
 * This is the "mangled escape that still parses" family with the mangling moved
 * from the transport into the language. A byte scan cannot see it by
 * construction, so it is a separate pass over STRING literals only: a regex
 * literal's \b is a word boundary and must not be touched.
 *
 * Reported separately from the byte findings, because the repair is different --
 * these want the escape spelled out in words, not a backslash restored.
 */
const STR_ESCAPES = { b: "BACKSPACE", f: "FORMFEED", v: "VTAB", 0: "NUL" };

/** Blank out comments, keeping line numbers, before looking for string escapes.
 *
 *  COMMENTS MUST BE EXCLUDED, and the reason is the rule this file already
 *  carries one level up: the prose a guard reads can quote the thing it forbids.
 *  Its first run fired three times and ALL THREE were comments -- one in this
 *  file's own explanation of the defect, and two in
 *  `retranslate-repaired-passages.mjs`, where the comment documents a PREVIOUS
 *  instance of exactly this bug and had to spell the escape out to explain it.
 *
 *  A guard that fires on the note describing the defect it prevents is the
 *  migration-290 shape, and it gets deleted by the first person it inconveniences.
 */
/*  LINE-LEVEL, DELIBERATELY. A character-level stripper has to understand regex
 *  literals to know whether a quote opens a string, and the first version did
 *  not: one `/['"]/` earlier in a file desynced everything after it and the
 *  comment lines still reported. A line tracker cannot desync -- it recognises
 *  only a block opener, a block closer, and a line whose first non-space is a
 *  slash-slash or a star. (Spelled out in words: writing the closer inline here
 *  would end this comment, and the zero-width space I first used to avoid that
 *  was caught by the byte scan forty lines up.)
 *
 *  A control escape in live code is never on such a line, so the coverage cost
 *  is nil and the failure mode is bounded. */
/* Built from char codes, never typed: this line was mangled by a heredoc
 * twice while being written, which is the eighth instance of the defect
 * this very file exists to catch. */
const splitLines = (t) => t.split(new RegExp(String.fromCharCode(13) + "?" + String.fromCharCode(10)));
function codeOnLines(src) {
  const out = [];
  let inBlock = false;
  for (const ln of splitLines(src)) {
    let code = "", i = 0, quote = null;
    while (i < ln.length) {
      const c = ln[i], d = ln[i + 1];
      if (inBlock) {
        if (c === "*" && d === "/") { inBlock = false; i += 2; continue; }
        i++; continue;
      }
      if (!quote && c === "/" && d === "*") { inBlock = true; i += 2; continue; }
      if (!quote && c === "/" && d === "/") break;
      if (quote) {
        code += c;
        if (c === "\\") { code += d || ""; i += 2; continue; }
        if (c === quote) quote = null;
        i++; continue;
      }
      if (c === '"' || c === "'") { quote = c; code += c; i++; continue; }
      code += c; i++;
    }
    out.push(code);
  }
  return out;
}

/** Every string-literal escape on a line, ignoring an escaped backslash. */
function escapesOnLine(ln) {
  const out = [];
  for (const m of ln.matchAll(/(["'])((?:[^\\\n]|\\.)*?)\1/g)) {
    for (const e of m[2].matchAll(/\\([bfv0])/g)) {
      let slashes = 0, k = e.index - 1;
      while (k >= 0 && m[2][k] === "\\") { slashes++; k--; }
      if (slashes % 2 === 1) continue;
      out.push({ kind: STR_ESCAPES[e[1]], ctx: m[0].slice(0, 76) });
    }
  }
  return out;
}

/* POSITIVE CONTROL for the string pass. It reports by FINDING, so a broken
 * version reports clean -- and this one has to get the comment exclusion right
 * as well as the escape, because its first run was three false positives. */
{
  const src = [
    'const a = "x \\b y";',           // 0 must fire
    '/* a comment saying "\\b" */',    // 1 must not
    '// another saying "\\b"',         // 2 must not
    'const b = "escaped \\\\b here";', // 3 must not: that is a backslash then b
    'const c = "clean";',              // 4 must not
    '/* opens',                        // 5 block starts
    '   still inside with "\\b"',      // 6 must not
    '*/ const d = "\\v";',             // 7 must fire
  ].join("\n");
  const fired = codeOnLines(src).map((ln) => escapesOnLine(ln).length > 0);
  const want = [true, false, false, false, false, false, false, true];
  const wrongPass = want.map((w, i) => (fired[i] === w ? null : "line " + i + " expected " + w)).filter(Boolean);
  if (wrongPass.length) {
    console.error("STRING-ESCAPE CONTROL FAILED: " + wrongPass.join(", "));
    console.error("No verdict printed: a broken detector reports clean.");
    process.exit(2);
  }
}

const stringEscapes = [];
for (const rel of files) {
  if (rel.endsWith(".sql")) continue;
  let text;
  try { text = readFileSync(join(ROOT, rel), "utf8"); } catch { continue; }
  const code = codeOnLines(text);
  const lines = text.split(/\r?\n/);
  code.forEach((ln, idx) => {
    /* Double- and single-quoted literals only. Template literals and regex
     * literals are skipped: the first rarely carries these and the second needs
     * its \b. A crude quote scan is enough because a false positive here is a
     * message, not a gate. */
    for (const m of ln.matchAll(/(["'])((?:[^\\\n]|\\.)*?)\1/g)) {
      for (const e of m[2].matchAll(/\\([bfv0])/g)) {
        /* `\\b` in source is an escaped backslash then b -- not a control. */
        const at = e.index;
        let slashes = 0, k = at - 1;
        while (k >= 0 && m[2][k] === "\\") { slashes++; k--; }
        if (slashes % 2 === 1) continue;
        stringEscapes.push({ rel, line: idx + 1, kind: STR_ESCAPES[e[1]], ctx: m[0].slice(0, 76) });
      }
    }
  });
}

/* An exemption that no longer matches anything is an exemption nobody removed. */
for (const e of EXEMPT) {
  if (!files.includes(e.file)) console.log("  STALE EXEMPTION: " + e.file + " is no longer tracked");
}

console.log("");
console.log("CONTROL BYTES -- " + files.length + " tracked .mjs/.ts/.sql file(s) examined");
console.log("DENOMINATOR: " + files.length + " file(s) examined");
if (stringEscapes.length) {
  console.log("");
  console.log("  CONTROL ESCAPES INSIDE STRING LITERALS -- legal source, control byte at runtime:");
  for (const e of stringEscapes.slice(0, 20)) {
    console.log("      " + e.kind.padEnd(10) + e.rel + ":" + e.line);
    console.log("          " + e.ctx);
  }
  if (stringEscapes.length > 20) console.log("      ... and " + (stringEscapes.length - 20) + " more");
  console.log("      Spell the escape out in words; a byte scan cannot see these.");
  console.log("");
}
if (!findings.length) {
  console.log("  none. (tab, LF and CR are legitimate and not reported)");
  if (exempted) console.log("  " + exempted + " declared exemption(s) honoured, each with its reason in EXEMPT");
} else {
  for (const f of findings.slice(0, 40)) {
    console.log("  " + label(f.c).padEnd(22) + f.rel + ":" + f.line);
    console.log("        ..." + f.ctx);
  }
  if (findings.length > 40) console.log("  ... and " + (findings.length - 40) + " more");
  console.log("");
  console.log("A control byte in source is a MANGLED ESCAPE, not a typo. The usual cause is a");
  console.log("backslash halved by a shell heredoc: /" + String.fromCharCode(92) + "b/ arriving as a literal backspace parses,");
  console.log("runs, and matches nothing.");
  console.log("");
  console.log("HOUSE RULE: code containing a backslash is written with the file tool, never");
  console.log("through a heredoc.");
  process.exitCode = 1;
}
