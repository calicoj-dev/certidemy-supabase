#!/usr/bin/env node
/**
 * check-pdftotext-options.mjs -- which scripts pass a pdftotext option the installed build does not have.
 *
 * READ-ONLY: static analysis of source, no PDFs opened, no writes beyond one artifact, unknown flags exit 2.
 *
 * ============ WHY, AND IT IS NOT HYPOTHETICAL ============
 *
 * CLAUDE.md documents the dependency as POPPLER (`choco install poppler`). What is on PATH is Glyph & Cog
 * **Xpdf pdftotext 4.00**, a different program with a different option set. Every script here has been
 * running against the wrong build's manual.
 *
 * `-layout` exists in both, which is why nothing has broken -- but that is luck, not compatibility, and a
 * script reaching for a poppler-only option would fail at the moment somebody needs it.
 *
 * THE OPTION LIST IS READ FROM THE INSTALLED BINARY, never typed. A hand-kept list of what Xpdf supports
 * would be a second copy of a fact the program will tell you, and it would go stale the first time the
 * binary changes.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

/* ---- what the installed binary actually supports, asked rather than assumed ---- */
let help = "";
let version = "unknown";
try {
  help = execFileSync("pdftotext", ["--help"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
} catch (e) {
  help = String((e.stdout || "") + (e.stderr || ""));
}
try {
  const v = execFileSync("pdftotext", ["-v"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  version = String(v).split(/\r?\n/).slice(0, 2).join(" | ");
} catch (e) {
  version = String((e.stdout || "") + (e.stderr || "")).split(/\r?\n/).slice(0, 2).join(" | ");
}
const supported = new Set();
for (const m of help.matchAll(/^\s+(-[A-Za-z][A-Za-z0-9-]*)/gm)) supported.add(m[1]);
if (!supported.size) {
  console.error("REFUSING TO REPORT: could not read any option from `pdftotext --help`, so an");
  console.error("\"unsupported\" verdict would be an artifact of a failed parse, not a finding.");
  process.exit(2);
}
console.log("installed: " + version);
console.log("options the binary advertises: " + supported.size);

/* ---- every option any script passes ---- */
const files = readdirSync(join(ROOT, "scripts")).filter((f) => f.endsWith(".mjs"))
  .concat(readdirSync(join(ROOT, "scripts", "lib")).filter((f) => f.endsWith(".mjs")).map((f) => "lib/" + f));
const rows = [];
for (const f of files) {
  const src = readFileSync(join(ROOT, "scripts", f), "utf8");
  if (!/pdftotext/.test(src)) continue;
  const opts = new Set();
  /* every execFileSync("pdftotext", [ ... ]) argument array in the file */
  for (const m of src.matchAll(/pdftotext"\s*,\s*\[([\s\S]{0,300}?)\]/g)) {
    for (const o of m[1].matchAll(/"(-[A-Za-z][A-Za-z0-9-]*)"/g)) opts.add(o[1]);
  }
  /* A SPREAD ONLY MATTERS INSIDE THE ARGUMENT ARRAY. The first version tested the whole file and
   * flagged verify-cert and verify-citations for "...opts.map(o => o.text)" -- a quiz item's option
   * texts, nothing to do with pdftotext. Two false positives in a report about false confidence. */
  let spreads = false;
  for (const mm of src.matchAll(/pdftotext"\s*,\s*\[([\s\S]{0,300}?)\]/g)) {
    if (/\.\.\./.test(mm[1])) spreads = true;
  }
  rows.push({ file: f, options: [...opts].sort(), spreads,
    unsupported: [...opts].filter((o) => !supported.has(o)).sort() });
}
rows.sort((a, b) => (b.unsupported.length - a.unsupported.length) || a.file.localeCompare(b.file));

const bad = rows.filter((r) => r.unsupported.length);
const md = [];
const p = (s = "") => md.push(s);
p("# pdftotext options, against the build that is actually installed");
p("");
p("**Read-only static analysis.** Ruled PROMPT-89 s2.");
p("");
p("Installed: `" + version.trim() + "`");
p("");
p("CLAUDE.md documents the dependency as **poppler**. This is **Glyph & Cog Xpdf**, a different program");
p("with a different option set. Nothing has broken because `-layout` exists in both -- that is luck, not");
p("compatibility.");
p("");
p("The supported list is read from `pdftotext --help` on this machine, never typed.");
p("");
p("| script | options passed | unsupported | spread args |");
p("|---|---|---|---|");
for (const r of rows) {
  p("| `" + r.file + "` | " + (r.options.join(" ") || "-") + " | " +
    (r.unsupported.length ? "**" + r.unsupported.join(" ") + "**" : "none") + " | " +
    (r.spreads ? "yes -- not statically visible" : "-") + " |");
}
p("");
p("**" + rows.length + " script(s) shell out to pdftotext; " + bad.length + " pass an option this build" +
  " does not advertise.**");
p("");
p("## What this cannot see");
p("");
p("Options built at runtime, or passed through a spread such as `...args`, are invisible to a static");
p("reader. Scripts with a spread are marked; for those, the absence of a finding is not evidence.");
p("");
writeFileSync(join(ROOT, "PDFTOTEXT-OPTIONS.md"), md.join("\n") + "\n", "utf8");
writeFileSync(join(ROOT, "PDFTOTEXT-OPTIONS.json"), JSON.stringify({
  installed: version.trim(), supported: [...supported].sort(), scripts: rows,
}, null, 1) + String.fromCharCode(10), "utf8");

for (const r of rows) {
  console.log("  " + r.file.padEnd(38) + (r.options.join(" ") || "-").padEnd(30) +
    (r.unsupported.length ? "UNSUPPORTED: " + r.unsupported.join(" ") : "ok") +
    (r.spreads ? "   (has a spread)" : ""));
}
console.log("\n" + rows.length + " script(s) use pdftotext; " + bad.length + " pass an unsupported option");
console.log("wrote PDFTOTEXT-OPTIONS.md and .json");
