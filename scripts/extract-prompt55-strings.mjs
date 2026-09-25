#!/usr/bin/env node
/**
 * extract-prompt55-strings.mjs -- lift the director's replacement strings out of
 * the prompt text, rather than retyping them.
 *
 * READ-ONLY. `--src <file>` (the recovered prompt), `--out <file>`. Unknown flags
 * exit 2.
 *
 * ============ WHY NOT JUST TYPE THEM ============
 *
 * A byte read-back proves the database holds what the script computed. It cannot
 * prove the script computed what the director wrote -- a transcription slip is
 * invisible to every check downstream of it, because every one of them measures
 * the typed string against itself.
 *
 * So the strings are EXTRACTED from the prompt and never keyed. Accented
 * characters, em dashes and glossary markup all survive by not being retyped,
 * which is the same reasoning as building non-ASCII from escapes: the safest
 * transport is the one nobody hand-copies through.
 *
 * Every extraction asserts a non-empty result under its own anchor, because an
 * extractor that matches nothing returns a clean empty set -- this repository's
 * oldest instrument failure.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--src", "--out"]);
const argv = process.argv.slice(2);
for (const a of argv) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error("Unrecognised flag: " + a); process.exit(2); }
}
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const SRC = val("--src", join(process.env.CLAUDE_JOB_DIR || ".", "tmp", "prompt55_1.txt"));
const OUT = val("--out", "PROMPT-55-STRINGS.json");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

if (!existsSync(SRC)) { console.error("No such prompt source: " + SRC); process.exit(2); }
const src = readFileSync(SRC, "utf8");

/** All `- es:` / `- pt:` bullet payloads under a bold heading anchor. */
function underAnchor(anchor) {
  const i = src.indexOf(anchor);
  if (i < 0) return null;
  /* Stop at the next BLOCK anchor or section heading, not at any bold run --
   * `**03-04 b11.**` is followed by a sentence containing more bold, and an
   * over-eager stop cut the bullets off entirely. The block anchors all name a
   * lesson, so the stop is keyed on that shape. */
  const rest = src.slice(i + anchor.length);
  const stop = rest.search(/\n\*\*(?:\d\d-\d\d|isms-ia|aims-ia)[^\n]*\*\*|\n## |\n\| /);
  return stop < 0 ? rest : rest.slice(0, stop);
}

/** Backticked runs in a chunk, in order. */
const ticks = (chunk) => [...chunk.matchAll(/`([^`]+)`/g)].map((m) => m[1]);

/** A fenced code block in a chunk. */
function fence(chunk) {
  const m = /```[a-z]*\n([\s\S]*?)\n?```/.exec(chunk);
  return m ? m[1] : null;
}

const out = {};
const problems = [];

/** Record `key` from `anchor`, expecting `n` backticked runs per language. */
function bullets(key, anchor) {
  const chunk = underAnchor(anchor);
  if (chunk === null) { problems.push(key + ": anchor not found -- " + anchor); return; }
  for (const lang of ["es", "pt"]) {
    /* Bullets may be indented -- the 05-02 q2 pair sits nested under its own
     * parent bullet, and an anchored `^- ` missed both. */
    const m = new RegExp("^\\s*- " + lang + ":\\s*(.+)$", "m").exec(chunk);
    if (!m) { problems.push(key + "." + lang + ": no bullet under " + anchor); continue; }
    const t = ticks(m[1]);
    if (!t.length) { problems.push(key + "." + lang + ": no backticked string"); continue; }
    out[key + "|" + (lang === "es" ? "es-419" : "pt-BR")] = t;
  }
}

bullets("01-03|14", "**01-03 b14**, against the repaired English:");
bullets("03-02|9", "**03-02 b9:**");
bullets("03-04|2", "**03-04 b2:**");
bullets("03-04|11", "**03-04 b11.**");
bullets("05-02|28|q2", "- **05-02 q2 explanation** (changed, and fixed in §1):");

/* Two are fenced rather than bulleted. */
for (const [key, anchor] of [
  ["02-06|9|pt-BR", "**02-06 b9 pt.**"],
  ["03-01|11|pt-BR", "**03-01 b11 pt.**"],
]) {
  const chunk = underAnchor(anchor);
  if (chunk === null) { problems.push(key + ": anchor not found"); continue; }
  const f = fence(chunk);
  if (f) { out[key] = [f]; continue; }
  const t = ticks(chunk);
  if (!t.length) { problems.push(key + ": neither a fence nor a backticked string"); continue; }
  out[key] = t;
}

/* The isms-ia b16 headings come from PROMPT-56 section 2, which supersedes the
 * PROMPT-55 table row -- an unnumbered reference takes the level of what it
 * points to, and "the same clause" points to 5.2, which is dotted. Declared here
 * with their source named so nobody reads them as PROMPT-55's. */
out["isms-ia-04-02|16|es-419"] = ["**Lo que la política debe ser** - el mismo apartado, incisos e) a g):"];
out["isms-ia-04-02|16|pt-BR"] = ["**O que a política deve ser** - a mesma Seção, itens e) a g):"];
out["_source"] = { prompt55: SRC, note: "isms-ia-04-02 b16 is from PROMPT-56 section 2, not PROMPT-55" };

console.log("");
console.log("PROMPT-55 STRING EXTRACTION");
console.log("DENOMINATOR: " + (Object.keys(out).length - 1) + " target(s) extracted");
console.log("");
for (const [k, v] of Object.entries(out)) {
  if (k === "_source") continue;
  console.log("  " + k.padEnd(24) + v.length + " run(s), " + v.join(" / ").length + " chars");
}
if (problems.length) {
  console.log("");
  console.log("EXTRACTION PROBLEMS -- no file written:");
  for (const p of problems) console.log("  " + p);
  process.exit(2);
}
writeFileSync(join(ROOT, OUT), JSON.stringify(out, null, 2), "utf8");
console.log("");
console.log("  wrote " + OUT);
