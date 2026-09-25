#!/usr/bin/env node
/**
 * check-word-boundary-regexes.mjs -- `\b` next to a non-ASCII letter is dead
 * code, not a boundary.
 *
 * READ-ONLY. No network, no credential. `--verbose` lists every literal it
 * examined. Unknown flags exit 2. Invariant 13.
 *
 * ============ WHAT THIS CATCHES ============
 *
 * JavaScript's `\b` is defined against [A-Za-z0-9_]. An accented letter is not a
 * word character, so there is NO boundary between a space and an accent -- both
 * are non-word. A pattern like
 *
 *     /\b(deve|<e-acute> obrigatorio)\b/i
 *
 * can never match its second alternative in real prose: it fires only when the
 * accent is preceded by a word character, which never happens. Measured on the
 * live G3 pattern before it was fixed:
 *
 *     "x <e-acute> obrigatorio y"   ->  false
 *     "x<e-acute> obrigatorio y"    ->  true
 *
 * So the alternative had never once been able to fire, in a guard whose whole
 * subject is Portuguese and Spanish. It was found because the SAME guard in the
 * other language worked -- `es obligatorio` begins with an ASCII letter -- and
 * this repository's most reliable detector is one implementation of a property
 * disagreeing with another.
 *
 * THE FIX IS A UNICODE-AWARE LOOKAROUND, not a wider character class:
 *
 *     (?<![\p{L}\p{N}_]) ... (?![\p{L}\p{N}_])   with the `u` flag
 *
 * ============ WHAT IT CANNOT DO ============
 *
 * Static analysis of regex LITERALS. A pattern assembled from variables at
 * runtime is invisible to it -- which is exactly what the repaired G3 now is, so
 * this check cannot see its own motivating case any more. That is stated rather
 * than hidden: the fixture in render-gates.mjs is what covers G3, and this
 * covers everything still written as a literal.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error("Unrecognised flag: " + a); process.exit(2); }
}
const VERBOSE = process.argv.includes("--verbose");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Is this character a letter or digit outside [A-Za-z0-9_]? */
const isNonAsciiWord = (ch) => !!ch && /[\p{L}\p{N}]/u.test(ch) && !/[A-Za-z0-9_]/.test(ch);

/** Regex literals in a source file. Deliberately conservative: a literal must
 *  start at a position where a regex can legally begin, so division is not
 *  mistaken for a pattern. */
function regexLiterals(src) {
  const out = [];
  for (let i = 0; i < src.length; i++) {
    if (src[i] !== "/") continue;
    const before = src.slice(0, i).replace(/\s+$/, "");
    const prev = before[before.length - 1];
    if (prev && !"(,=:[!&|?{};+-*%~^".includes(prev)) continue;
    if (src[i + 1] === "/" || src[i + 1] === "*") continue;
    let j = i + 1, cls = false, body = "";
    for (; j < src.length; j++) {
      const c = src[j];
      if (c === "\\") { body += c + src[j + 1]; j++; continue; }
      if (c === "\n") { body = null; break; }
      if (c === "[") cls = true;
      else if (c === "]") cls = false;
      else if (c === "/" && !cls) break;
      body += c;
    }
    if (body === null || j >= src.length) continue;
    let k = j + 1, flags = "";
    while (k < src.length && /[dgimsuvy]/.test(src[k])) flags += src[k++];
    out.push({ body, flags, index: i });
    i = k - 1;
  }
  return out;
}

/** The first and last literal characters of each alternative in a group, so
 *  `\b(a|<e-acute>b)\b` is judged per alternative rather than on the paren. */
function alternativeEdges(body, from, forward) {
  /* Walk the group starting at `from` (index of "(" when forward). */
  const edges = [];
  let depth = 0, cur = "";
  const step = forward ? 1 : -1;
  let i = from;
  for (; i >= 0 && i < body.length; i += step) {
    const c = body[i];
    if (c === "(" ) { depth += forward ? 1 : -1; if (forward && depth === 1) { cur = ""; continue; } }
    else if (c === ")") { depth += forward ? -1 : 1; if (!forward && depth === 1) { cur = ""; continue; } }
    if (depth === 0) break;
    if (depth === 1 && c === "|") { edges.push(cur); cur = ""; continue; }
    if (depth === 1) {
      if (c === "\\") { i += step; continue; }
      if (forward && cur === "" && body.startsWith("?:", i)) { i += step; continue; }
      if (cur === "") cur = c;
    }
  }
  edges.push(cur);
  return edges.filter(Boolean);
}

let files;
try {
  files = execFileSync("git", ["ls-files", "*.mjs", "*.ts", "*.js"], { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/).filter(Boolean);
} catch (e) {
  console.error("could not list tracked files: " + e.message);
  process.exit(2);
}

/* POSITIVE CONTROL. The classifier must call the real defect a defect and the
 * real repair clean, or it prints nothing. */
const CONTROL_BAD = "\\b(deve|\u00e9 obrigat\u00f3rio)\\b";
const CONTROL_OK = "\\b(deve|obrigatorio)\\b";
function findings(body) {
  const out = [];
  for (let i = 0; i < body.length - 1; i++) {
    if (body[i] !== "\\" || body[i + 1] !== "b") continue;
    /* Leading boundary: what comes after. */
    const after = body[i + 2];
    if (after === "(") {
      for (const e of alternativeEdges(body, i + 2, true)) {
        if (isNonAsciiWord(e)) out.push("`\\b(` then alternative starting `" + e + "`");
      }
    } else if (isNonAsciiWord(after)) out.push("`\\b` then `" + after + "`");
    /* Trailing boundary: what comes before. */
    const before = body[i - 1];
    if (before === ")") {
      for (const e of alternativeEdges(body, i - 1, false)) {
        if (isNonAsciiWord(e)) out.push("alternative ending `" + e + "` then `)\\b`");
      }
    } else if (isNonAsciiWord(before)) out.push("`" + before + "` then `\\b`");
  }
  return [...new Set(out)];
}
if (!findings(CONTROL_BAD).length || findings(CONTROL_OK).length) {
  console.error("POSITIVE CONTROL FAILED -- the classifier does not behave.");
  console.error("  No verdict printed: a broken classifier reports clean.");
  process.exit(2);
}

let examined = 0, hits = 0;
const rows = [];
for (const f of files) {
  let src;
  try { src = readFileSync(join(ROOT, f), "utf8"); } catch { continue; }
  const lits = regexLiterals(src);
  for (const l of lits) {
    examined++;
    const fs2 = findings(l.body);
    if (!fs2.length) continue;
    /* A `u`-flagged pattern still has an ASCII-only \b, so the flag is no
     * defence and is not accepted as one. */
    hits++;
    const line = src.slice(0, l.index).split("\n").length;
    rows.push({ f, line, body: l.body.slice(0, 90), why: fs2.join("; ") });
  }
}

console.log("");
console.log("WORD-BOUNDARY REGEX AUDIT -- `\\b` adjacent to a non-ASCII letter");
console.log("  positive control behaves: the known defect fires, its repair does not");
console.log("DENOMINATOR: " + examined + " regex literal(s) in " + files.length + " tracked file(s)");
console.log("");
if (!rows.length) console.log("  no dead boundaries");
for (const r of rows) {
  console.log("  " + r.f + ":" + r.line);
  console.log("      /" + r.body + "/");
  console.log("      " + r.why);
}
console.log("");
console.log("  " + hits + " literal(s) with a boundary that cannot fire");
console.log("");
console.log("  CANNOT SEE: patterns built from variables at runtime. G3 is now one of");
console.log("  those, so its fixture in render-gates.mjs is what covers it, not this.");
if (VERBOSE) for (const f of files) console.log("  examined " + f);
process.exitCode = hits ? 1 : 0;
