#!/usr/bin/env node
/**
 * audit-unpaged-reads.mjs - every PostgREST read in scripts/ that can be
 * silently truncated at 1,000 rows.
 *
 * READ-ONLY. No network, no credential. Fixes nothing.
 *
 * ============ WHY THIS EXISTS, AND WHY A GREP IS NOT ENOUGH ============
 *
 * PostgREST caps a response at 1,000 rows. It does not error, it does not
 * warn, and it does not care what `limit` you asked for. CLAUDE.md records two
 * instances that printed a floor as a total; a third arrived 2026-09-21, and it
 * was the worst placed of the three:
 *
 *   A script asked which translated rows were already CLEARED, so it could
 *   avoid editing reviewed content. It fetched with `limit=4000`, got 1,000
 *   rows and HTTP 200, and reported "0 cleared rows held". Three ISMS-IA rows,
 *   cleared and serving, were in the 730 it never saw. The cap answered the
 *   question of whether a sweep was safe.
 *
 * A grep for "limit" over-reports badly: most reads here are `id=eq.<uuid>`
 * lookups that cannot exceed one row. So each read is CLASSIFIED:
 *
 *   SAFE-PAGED    the script pages to exhaustion AND asserts against a
 *                 server-side count. The only construction that is correct
 *                 regardless of how the table grows.
 *   SAFE-SCALAR   filtered by an equality on a key, so it cannot return many.
 *   CAPPED        an explicit limit at or under 1,000. Deliberate, and correct
 *                 only while the population stays below it -- which nothing in
 *                 the script asserts.
 *   UNSAFE        limit above 1,000, or no limit and no scalar filter. The
 *                 first is the more dangerous: it LOOKS like the author
 *                 thought about the size and the server ignores it.
 *
 * A page loop with no count assertion is the same bug with more code: it exits
 * on the first short page, and one dropped page in the middle ends it early
 * and silently.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) { console.error("Unrecognised flag: " + a + ". READ-ONLY, no flags."); process.exit(2); }
}

const HERE = dirname(fileURLToPath(import.meta.url));
const files = [];
for (const d of [HERE, join(HERE, "lib")]) {
  for (const f of readdirSync(d)) if (f.endsWith(".mjs") && f !== "audit-unpaged-reads.mjs") files.push(join(d, f));
}

/* A read is a quoted string that names a table or view and a select. */
const READ = /["'`]([a-z_][a-z0-9_]*\?select=[^"'`]*)["'`]/gi;

/* A PAGING HELPER is a function whose body both pages to exhaustion and
 * asserts the row count against the server's. Two idioms are in use here --
 * `Range:` headers (what CLAUDE.md recommends) and `offset=` -- and the first
 * version of this script only knew the second, so it reported four correctly
 * paged files as UNSAFE. The count assertion is required separately: a page
 * loop without one exits on the first short page and a dropped page in the
 * middle ends it early and silently.
 *
 * CREDIT IS PER READ, NOT PER FILE. Crediting a whole file for having a
 * helper somewhere is the coverage-gap-reads-as-a-pass defect: a file with a
 * good helper AND one raw fetch beside it would report clean. A read earns
 * SAFE-PAGED only if the helper's name appears immediately before it. */
const HELPER = /(?:async\s+function|const)\s+([A-Za-z_$][\w$]*)\s*(?:=\s*async\s*)?\(/g;


/* A HELPER BODY ENDS AT THE NEXT HELPER. A fixed 1400-character window spills
 * into the function below, so a plain fetch() wrapper sitting above a real
 * paging helper inherits its machinery and is credited for paging it does not
 * do. Bound the slice at the next definition. */
function bodyOf(src, start) {
  HELPER.lastIndex = start + 1;
  const next = HELPER.exec(src);
  HELPER.lastIndex = 0;
  const end = next ? next.index : src.length;
  return src.slice(start, Math.min(end, start + 2400));
}

const ASSERTS = /SHORT READ|PAGING INCOMPLETE|!==\s*total|<>\s*total|!=\s*total|length\s*!==\s*\w*[Tt]otal/;

function pagingHelpers(src) {
  /* THE PLUMBING MAY BE IN A CALLEE; THE ASSERTION MAY NOT BE. Three helpers
   * here split the Range/content-range fetch into an inner function and keep
   * only the count check in the outer one, so requiring all three markers
   * inside a single body reported three correctly paged scripts as UNSAFE.
   *
   * The count assertion is the discriminator -- a page loop without one exits
   * on the first short page and a dropped page in the middle ends it early
   * and silently -- so THAT is what must appear in the helper itself. The
   * paging machinery is accepted from anywhere in the file. */
  const pages = /Range:/.test(src) || /offset=/.test(src);
  const counts = /content-range/.test(src) && /count=exact/.test(src);
  const names = new Set();
  if (!(pages && counts)) return names;
  for (const h of src.matchAll(HELPER)) {
    if (ASSERTS.test(bodyOf(src, h.index))) names.add(h[1]);
  }
  return names;
}

/* PAGES, BUT DOES NOT ASSERT. A loop that walks Range or offset until a
 * short page cannot be truncated at 1,000 -- but it ends on the FIRST short
 * page, so a page that comes back short for any other reason ends it early
 * and silently. CLAUDE.md: "a page loop with no count assertion is the same
 * bug with more code."
 *
 * This is a THIRD state and it matters that it is not folded into either
 * neighbour. Calling it UNSAFE says it truncates today, which is false and
 * sends someone to fix a working reader. Calling it SAFE-PAGED says the count
 * was checked, which is also false. */
function loosePagingHelpers(src) {
  const names = new Set();
  for (const h of src.matchAll(HELPER)) {
    const body = bodyOf(src, h.index);
    const pages = body.includes("Range:") || body.includes("Range`") || body.includes("offset=");
    const loops = (body.includes("for (") || body.includes("for(") ||
                   body.includes("while (") || body.includes("while(")) &&
                  (body.includes("push(...") || body.includes("push(page"));
    if (pages && loops) names.add(h[1]);
  }
  return names;
}

/* A COUNT HELPER asks the server for a count and never accumulates rows. A
 * read passed to one cannot be truncated, because it fetches nothing -- so
 * classifying it by its literal is wrong twice over: the `&limit=1` is
 * appended at runtime and invisible, and the row cap is irrelevant anyway.
 *
 * This exists because the audit flagged countWhere() -- the FIX for the 355
 * truncation -- as UNSAFE on its own next run. */
function countHelpers(src) {
  const names = new Set();
  for (const h of src.matchAll(HELPER)) {
    const body = bodyOf(src, h.index);
    const asksCount = /count=exact/.test(body) && /content-range/.test(body);
    const keepsRows = /\.push\(\.\.\.|\.push\(page|out\.push|rows\.push/.test(body);
    if (asksCount && !keepsRows) names.add(h[1]);
  }
  return names;
}

/* ============ A HELPER MAY LIVE IN ANOTHER MODULE ============
 *
 * `verify-invariants.mjs` imports getAll() from `_pg.mjs` and every one of its
 * seven reads goes through it. Scanning one file at a time, the classifier saw
 * seven bare literals and reported SEVEN UNSAFE READS against the platform
 * invariant checker -- which pages correctly and was measured fetching all
 * 1,730 concepts.
 *
 * That is this audit's own recurring defect in a third form: it read the
 * LITERAL and not the statement, then the FILE and not the program. An
 * over-reporting guard aimed at the invariant checker is the worst possible
 * false positive, because the conclusion it invites -- "every invariant ever
 * printed was about a subset" -- is alarming enough to act on immediately.
 *
 * So resolve local imports and look for the helper there too. */
function resolveImports(src, fromDir) {
  let extra = "";
  for (const m of src.matchAll(/import\s*\{[^}]*\}\s*from\s*["'](\.[^"']+)["']/g)) {
    try { extra += "\n" + readFileSync(join(fromDir, m[1]), "utf8"); } catch { /* not local */ }
  }
  return extra;
}

/* AND THE CALL SITE MAY NAME AN ALIAS, NOT THE HELPER. verify-invariants does
 *   const get = (path) => getAll(KEY, path);
 * and every read is `get("...")`. Neither the import resolution above nor the
 * helper detector sees that: `get` has no paging body of its own, and the
 * literal is preceded by a name that appears in no helper set.
 *
 * One hop is enough for every alias in this repo, and one hop is all that is
 * offered -- a chain long enough to need two is a thing a human should read. */
function withAliases(src, names) {
  const out = new Set(names);
  for (const m of src.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*([A-Za-z_$][\w$]*)\s*\(/g)) {
    if (out.has(m[2])) out.add(m[1]);
  }
  return out;
}

function scan(src, name, dir) {
  const out = [];
  const withImports = src + (dir ? resolveImports(src, dir) : "");
  const helpers  = withAliases(src, pagingHelpers(withImports));
  const loose    = withAliases(src, loosePagingHelpers(withImports));
  const counters = withAliases(src, countHelpers(withImports));

  for (const m of src.matchAll(READ)) {
    const q = m[1];
    /* Is this literal the argument to a paging helper? */
    const before = src.slice(Math.max(0, m.index - 40), m.index);
    const safePaged = [...helpers].some((h) => before.includes(h + "("));
    const safeCount = [...counters].some((h) => before.includes(h + "("));
    const loosePaged = [...loose].some((h) => before.includes(h + "("));

    /* THE QUERY IS THE STATEMENT, NOT THE LITERAL. A read assembled by
     * concatenation carries its limit and its filters in later fragments:
     *   rest("concept_translations?select=..."
     *        + "&concept_id=in.(" + ids.join(",") + ")&limit=2000")
     * Matching the first literal alone sees no limit and no filter, and calls
     * a bounded read unsafe -- the same half-a-read defect this script is
     * about, committed by the instrument. Read to the end of the statement. */
    const stmtEnd = src.indexOf(";", m.index);
    const stmt = src.slice(m.index, stmtEnd === -1 ? m.index + 600 : stmtEnd);
    const dynamic = /["'`]\s*\+\s*[A-Za-z_$]/.test(stmt);
    const table = q.split("?")[0];
    const lim = /[?&]limit=(\d+)/.exec(stmt);
    const limN = lim ? Number(lim[1]) : null;
    const scalar = /=eq\.(?!\s)[^&"'`]*/.test(stmt) || /=in\.\(/.test(stmt);
    let klass;
    if (safeCount) klass = "SAFE-COUNT";
    else if (safePaged) klass = "SAFE-PAGED";
    else if (loosePaged) klass = "PAGED-NO-ASSERT";
    else if (limN !== null && limN > 1000) klass = "UNSAFE";
    else if (scalar) klass = "SAFE-SCALAR";
    else if (limN !== null) klass = "CAPPED";
    else if (dynamic) klass = "DYNAMIC";
    else klass = "UNSAFE";

    out.push({ file: name, table, klass, limit: limN, dynamic, purpose: purposeOf(src, m.index), query: q.slice(0, 96) });
  }
  return out;
}

/* ============ IS THIS READ COMPUTING A COUNT? ============
 *
 * PAGING A READ THAT SHOULD NEVER HAVE FETCHED IS FIXING THE WRONG LAYER.
 * Fingerprint 355 read 3,460 rows to compute two numbers; paging it correctly
 * would have been seven round trips to produce a figure the server already
 * had in a `content-range` header. The right fix was countWhere(), and the
 * wrong fix -- the one that passes every rule in CLAUDE.md -- was a page loop.
 *
 * So the audit reports PURPOSE beside safety. A read is COUNT-ONLY when every
 * use of its result ends in `.length`: the rows are fetched, measured and
 * discarded.
 *
 * WHAT THIS CANNOT SEE, stated because a heuristic's silence is not evidence:
 * a result passed to a helper that counts it, a `.length` reached through a
 * property or an index, and any use in a file that reassigns the variable.
 * It under-reports, which is the safe direction for a finding that says
 * "these can be deleted". */
function purposeOf(src, at) {
  const lineStart = src.lastIndexOf("\n", at) + 1;
  const stmtEnd = src.indexOf(";", at);
  const stmt = src.slice(lineStart, stmtEnd === -1 ? at + 400 : stmtEnd);

  /* Inline: (await rest(...)).length, or .filter(...).length */
  const tail = src.slice(stmtEnd === -1 ? at : stmtEnd - 40, (stmtEnd === -1 ? at : stmtEnd) + 12);
  if (/\)\s*\)?\s*\.length/.test(tail) || /\.filter\([^)]*\)\s*\.length/.test(stmt)) return "COUNT-ONLY";

  const decl = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/.exec(stmt);
  if (!decl) return "rows";
  const v = decl[1];
  const uses = [...src.matchAll(new RegExp("(?<![\\w$.])" + v.replace(/\$/g, "\\$") + "(?![\\w$])", "g"))]
    .filter((u) => u.index > at);
  if (!uses.length) return "rows";
  const countUse = (u) => {
    const after = src.slice(u.index, u.index + 220);
    return /^[\w$]+\s*\.length/.test(after) ||
           /^[\w$]+\s*\.filter\([^;]*?\)\s*\.length/.test(after);
  };
  return uses.every(countUse) ? "COUNT-ONLY" : "rows";
}

/* ================= POSITIVE CONTROL =================
 * A classifier that silently stopped matching would report zero UNSAFE reads
 * and read as a clean bill of health -- the exact failure CLAUDE.md records
 * for check-mcp's fragment extractor and for eslint. So the instrument is fed
 * five sources whose correct classification is known, INCLUDING one that must
 * come back UNSAFE. If any verdict is wrong, nothing is reported at all.
 *
 * `must-fire` is the shape of the defect that bought this script: a limit
 * above the cap, which the server ignores. */
const CONTROL = [
  ["must-fire", 'const r = await rest("concepts?select=id,name&limit=4000");', "UNSAFE"],
  ["no-limit-at-all", 'const r = await rest("concepts?select=id,name");', "UNSAFE"],
  ["scalar", 'const r = await rest("concepts?select=id&slug=eq.pdca-cycle");', "SAFE-SCALAR"],
  ["capped", 'const r = await rest("concepts?select=id,name&limit=500");', "CAPPED"],
  ["paged", "async function all(path) { const rows=[]; let from=0,total=null; for(;;){ const r = await fetch(u,{headers:{Range:from+\"-\"+(from+499),Prefer:\"count=exact\"}}); total=Number(r.headers.get(\"content-range\").split(\"/\")[1]); const page=await r.json(); rows.push(...page); if(page.length<500) break; from+=500; } if(rows.length!==total) throw new Error(\"SHORT READ\"); return rows; }" + String.fromCharCode(10) + "const r = await all(\"concepts?select=id,name\");", "SAFE-PAGED"],
];
for (const [label, src, want] of CONTROL) {
  const got = scan(src, label);
  if (got.length !== 1 || got[0].klass !== want) {
    console.error("POSITIVE CONTROL FAILED: " + label + " classified as "
      + (got.length === 1 ? got[0].klass : got.length + " matches") + ", expected " + want);
    console.error("The classifier is broken. No audit is reported -- a broken instrument reports clean.");
    process.exit(2);
  }
}
console.log("positive control: " + CONTROL.length + "/" + CONTROL.length + " known sources classified correctly");

/* The purpose classifier gets its own control, including the two shapes that
 * must NOT be called COUNT-ONLY -- otherwise the finding "these reads can be
 * deleted" would name reads that are actually using their rows. */
const PURPOSE_CONTROL = [
  ['const t = await rest("concepts?select=id");\nconst n = t.length;', "COUNT-ONLY"],
  ['const t = await rest("concepts?select=id");\nconst n = t.filter((r) => r.ok).length;', "COUNT-ONLY"],
  ['const t = await rest("concepts?select=id,name");\nfor (const r of t) console.log(r.name);', "rows"],
  ['const t = await rest("concepts?select=id");\nconst n = t.length; const m = t.map((r) => r.id);', "rows"],
  /* THE 355 SHAPE, kept as a regression case. This is the exact defect that
   * bought the purpose column: rows fetched, counted twice, discarded. If
   * this ever stops reporting COUNT-ONLY the column is decoration. */
  ['const t = await rest("concept_translations?select=concept_id,language,is_provisional");\n'
   + 'const cleared = t.filter((r) => !r.is_provisional).length;\n'
   + 'return { why: t.length + " translation row(s), " + cleared + " cleared" };', "COUNT-ONLY"],
];
for (const [src, want] of PURPOSE_CONTROL) {
  const got = scan(src, "purpose-control");
  if (got.length !== 1 || got[0].purpose !== want) {
    console.error("PURPOSE CONTROL FAILED: expected " + want + ", got " +
      (got.length === 1 ? got[0].purpose : got.length + " matches"));
    console.error("  source: " + src.split("\n")[1]);
    process.exit(2);
  }
}
console.log("purpose control:  " + PURPOSE_CONTROL.length + "/" + PURPOSE_CONTROL.length +
            " known uses classified correctly");

const rows = [];
for (const f of files) rows.push(...scan(readFileSync(f, "utf8"), f.slice(Math.max(f.lastIndexOf("/"), f.lastIndexOf(String.fromCharCode(92))) + 1), f.slice(0, Math.max(f.lastIndexOf("/"), f.lastIndexOf(String.fromCharCode(92))))));

const by = (k) => rows.filter((r) => r.klass === k);
console.log("");
console.log("POSTGREST READS IN scripts/  -- " + rows.length + " read(s) across " + files.length + " file(s)");
for (const k of ["UNSAFE", "CAPPED", "PAGED-NO-ASSERT", "DYNAMIC", "SAFE-SCALAR", "SAFE-COUNT", "SAFE-PAGED"]) {
  console.log("  " + k.padEnd(12) + String(by(k).length).padStart(4));
}

/* The tables that can actually exceed 1,000 rows are where this bites. A read
 * of `certifications` capped at 1,000 is harmless; one of quiz_questions is
 * not. Measured populations are named so the list is a priority order rather
 * than an alphabetical one. */
const BIG = { quiz_questions: 27738, concept_translations: 3460, concepts: 1730, lessons: 1437,
  question_concepts: 20000, exam_session_items: 50000, task_translations: 1200, tasks: 500,
  lesson_translation_reviews: 41, modules: 200 };

const unsafeBig = by("UNSAFE").filter((r) => (BIG[r.table] || 0) > 1000);
const cappedBig = by("CAPPED").filter((r) => (BIG[r.table] || 0) > 1000 && (r.limit === null || r.limit < (BIG[r.table] || 0)));

console.log("");
/* THE SPLIT THAT MATTERS MORE THAN THE SAFETY ONE. Of the reads at risk, the
 * ones only computing a count do not need paging -- they need to stop
 * fetching. Paging them is the wrong layer, and it is the fix a careful
 * reading of the paging rule would produce. */
const atRisk = rows.filter((r) => r.klass === "UNSAFE" || r.klass === "CAPPED");
const countOnly = atRisk.filter((r) => r.purpose === "COUNT-ONLY");
console.log("");
console.log("OF THE " + atRisk.length + " UNSAFE + CAPPED READS, WHAT ARE THEY FOR:");
console.log("  COUNT-ONLY, every use ends in .length   " + countOnly.length +
            "   <- countWhere(), not a page loop");
console.log("  genuinely need the rows                 " + (atRisk.length - countOnly.length) +
            "   <- these need paging + a count assertion");
console.log("");
console.log("  count-only reads, by file:");
const cseen = new Set();
for (const r of countOnly.sort((a, b) => a.file.localeCompare(b.file))) {
  const k = r.file + "|" + r.query;
  if (cseen.has(k)) continue;
  cseen.add(k);
  console.log("    " + r.file.padEnd(38) + r.table.padEnd(22) +
    ((BIG[r.table] || 0) > 1000 ? "~" + BIG[r.table] + " rows" : ""));
}

console.log("");
console.log("  of those, against a table KNOWN to exceed 1,000 rows:");
console.log("    UNSAFE  " + unsafeBig.length + "   truncated silently today");
console.log("    CAPPED  " + cappedBig.length + "   correct only while the population stays under the cap");

console.log("");
console.log("===== UNSAFE, BIG TABLE  (fix these)");
const seen = new Set();
for (const r of unsafeBig.sort((a, b) => a.file.localeCompare(b.file))) {
  const k = r.file + "|" + r.query;
  if (seen.has(k)) continue;
  seen.add(k);
  console.log("  " + r.file.padEnd(38) + r.table.padEnd(22) + (r.limit ? "limit=" + r.limit : "no limit"));
  console.log("      " + r.query);
}
console.log("");
console.log("===== CAPPED, BIG TABLE  (read the cap against the population)");
const seen2 = new Set();
for (const r of cappedBig.sort((a, b) => a.file.localeCompare(b.file))) {
  const k = r.file + "|" + r.query;
  if (seen2.has(k)) continue;
  seen2.add(k);
  console.log("  " + r.file.padEnd(38) + r.table.padEnd(22) + "limit=" + r.limit + " vs ~" + BIG[r.table] + " rows");
}

writeFileSync(join(HERE, "..", "UNPAGED-READ-AUDIT.json"), JSON.stringify({
  measured: "2026-09-21",
  files_scanned: files.length, reads_found: rows.length,
  counts: Object.fromEntries(["UNSAFE", "CAPPED", "PAGED-NO-ASSERT", "DYNAMIC", "SAFE-SCALAR", "SAFE-COUNT", "SAFE-PAGED"].map((k) => [k, by(k).length])),
  unsafe_against_big_table: unsafeBig.length,
  capped_against_big_table: cappedBig.length,
  limits: [
    "Static analysis of string literals. A query assembled at runtime from variables is not seen.",
    "SAFE-PAGED is per FILE: a file that pages correctly somewhere is credited everywhere, so it can hide a second unpaged read.",
  ],
  rows,
}, null, 2), "utf8");
console.log("");
console.log("wrote UNPAGED-READ-AUDIT.json");
