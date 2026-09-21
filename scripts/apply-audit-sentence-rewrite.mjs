#!/usr/bin/env node
/**
 * apply-audit-sentence-rewrite.mjs - replace the reproduced ISO/IEC 27000
 * audit sentence in three lessons, and correct the two that misattribute it.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * ============ TWO DEFECTS IN ONE SENTENCE ============
 *
 * Three lessons reproduce seventeen contiguous words of ISO/IEC 27000:2018:
 *
 *   "an internal audit is conducted by the organization itself or by an
 *    external party on its behalf"
 *
 * That is over the ten-word leak threshold, so all three groups are withheld
 * from the MCP surface in three languages -- nine rows.
 *
 * AND TWO OF THE THREE CREDIT IT TO ISO 19011:2026, which contains neither
 * half of it. Checked against the PDFs: 27000:2018 carries the whole sentence,
 * 42001:2023 carries "or by an external party on its behalf", and 19011:2026
 * carries nothing of it. The attribution is corrected AS PART OF the rewrite
 * rather than after it, because a rewrite that fixed only the wording would
 * leave the false citation in place and look finished.
 *
 * ============ WHAT CHANGES AND WHAT DOES NOT ============
 *
 * Each replacement scores 0 words of contiguous run against every indexed
 * standard, measured before this script existed. The teaching point is
 * unchanged: an internal audit may be performed by an outside party, and what
 * determines the audit type is who commissioned it and whose criteria apply.
 *
 * ============ THIS WITHHOLDS THE TRANSLATIONS, AND THAT IS CORRECT ============
 *
 * `trg_lessons_clear_mcp_servable` nulls `mcp_scanned_at` and sets
 * `mcp_servable = false` on any `content_md` change, so each edited row leaves
 * the MCP surface until scan-iso-leaks runs again. That is fail-closed and it
 * is also SILENT -- no error, no queue -- which is exactly the trap CLAUDE.md
 * records, so the re-scan is named in this script's own output rather than
 * left to memory.
 *
 * The es-419 and pt-BR rows still carry the TRANSLATED reproduction. The index
 * is monolingual and cannot see it, and these edits do not touch those rows.
 * They need retranslation, and this script says so instead of implying the job
 * is done.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ".");
    console.error("This is the --apply family: dry by default. Known: --apply.");
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");

const HERE = dirname(fileURLToPath(import.meta.url));
for (const p of [join(HERE, ".env"), join(HERE, "..", ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };
async function rest(p, init) {
  let last;
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(BASE + "/" + p, { ...init, headers: { ...H, ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(60000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 200));
      return t ? JSON.parse(t) : null;
    } catch (e) { last = e; }
  }
  throw new Error(p + ": " + last?.message);
}

/* Each edit names the EXACT text it expects to find. An edit that cannot find
 * its anchor is reported and skipped, never applied approximately. */
const EDITS = [
  {
    slug: "05-02-aims-internal-audit", cert: "AIMS-F",
    attribution: "correct already (its = ISO/IEC 42001, which carries the second half)",
    from: "Its definition of audit notes that an internal audit is conducted by the organization itself **or by an external party on its behalf.**",
    to: "A note to its definition of audit allows the work to be done in-house or handed to an outside party engaged to carry it out for you.",
  },
  {
    slug: "isms-ia-01-01-audit-parties", cert: "ISMS-IA",
    attribution: "CORRECTED: ISO 19011:2026 -> ISO/IEC 27000:2018",
    from: "ISO 19011:2026 notes that an internal audit is conducted by the organization itself **or by an external party on its behalf**.",
    to: "ISO/IEC 27000:2018 defines audit, and a note there allows an internal audit to be run in-house or handed to an outside party engaged to carry it out.",
  },
  {
    slug: "aims-ia-01-01-who-commissioned-it", cert: "AIMS-IA",
    /* TWO occurrences, and BOTH are inside checkpoint explanations -- the
     * misattribution is taught as the answer twice in one lesson. The anchor
     * guard found the second; a replace-all with no count would have hidden
     * that there were two. */
    expect: 2,
    attribution: "CORRECTED x2 (both in checkpoint explanations): ISO 19011:2026 -> ISO/IEC 42001",
    from: "ISO 19011:2026 states that an internal audit is conducted by the organization itself or by an external party on its behalf.",
    to: "ISO/IEC 42001 carries the same allowance in its note on audit: the work can be done in-house or handed to an outside party engaged to carry it out.",
  },
  /* ============ THE FIRST PASS FIXED THE PROSE AND MISSED THE ITEMS =======
   *
   * Each of these three lessons carries the sentence TWICE: once in prose and
   * once inside a checkpoint explanation. The first run rewrote the prose, and
   * the leak scan immediately reported AIMS-F still at 13w and ISMS-IA still at
   * 17w -- the instrument caught an incomplete fix that read as finished.
   *
   * The explanation copies word it slightly differently ("may be conducted"),
   * which is why an anchor asserted on the prose wording found exactly one
   * occurrence and was right to. Two anchors, not a looser one. */
  {
    slug: "05-02-aims-internal-audit", cert: "AIMS-F",
    attribution: "correct already; checkpoint explanation copy",
    from: "The definition of audit notes that an internal audit may be conducted by the organization itself or by an external party on its behalf.",
    to: "A note to the definition of audit allows an internal audit to be run in-house or handed to an outside party engaged to carry it out.",
  },
  {
    slug: "isms-ia-01-01-audit-parties", cert: "ISMS-IA",
    attribution: "CORRECTED (checkpoint explanation): ISO 19011:2026 -> ISO/IEC 27000:2018",
    from: "ISO 19011:2026 states that an internal audit is conducted by the organization itself or by an external party on its behalf.",
    to: "ISO/IEC 27000:2018 defines audit, and a note there allows an internal audit to be run in-house or handed to an outside party engaged to carry it out.",
  },
];

console.log("");
let ready = 0, missing = 0;
const plan = [];
for (const e of EDITS) {
  const rows = await rest("lessons?select=id,slug,language,content_md&language=eq.en&slug=eq." + e.slug);
  if (!rows || rows.length !== 1) {
    console.log("  MISSING  " + e.slug + " -- expected 1 English row, found " + (rows ? rows.length : 0));
    missing++; continue;
  }
  const body = rows[0].content_md;
  const want = e.expect || 1;
  const n = body.split(e.from).length - 1;
  /* ============ ALREADY APPLIED IS NOT THE SAME AS ANCHOR MISSING ========
   * A second run found 0 anchors for the three edits it had already made and
   * refused the whole batch as partial. Absence of the OLD text plus presence
   * of the NEW text is a completed edit; absence of both is a lesson that has
   * moved. Distinguishing them is what makes this rerunnable. */
  const already = body.split(e.to).length - 1;
  if (n === 0 && already >= want) { console.log("  DONE     " + e.cert.padEnd(9) + e.slug + " -- already applied"); continue; }
  if (n !== want) {
    console.log("  ANCHOR   " + e.slug + " -- expected exactly " + want + " occurrence(s) of the anchor, found " + n
      + "; replacement present " + already + " time(s)");
    console.log("           Not applying. Read the lesson; it has moved since this was written.");
    missing++; continue;
  }
  const next = body.split(e.from).join(e.to);
  /* BOTH DIRECTIONS: the new text is present, the old text is gone, and the
   * rest of the body is untouched apart from that one span. */
  const lenDelta = next.length - body.length;
  const expected = (e.to.length - e.from.length) * want;
  if (lenDelta !== expected) {
    console.log("  DELTA    " + e.slug + " -- length moved " + lenDelta + ", expected " + expected); missing++; continue;
  }
  plan.push({ ...e, id: rows[0].id, body, next });
  ready++;
  console.log("  READY    " + e.cert.padEnd(9) + e.slug);
  console.log("           attribution: " + e.attribution);
  console.log("           was: " + e.from);
  console.log("           now: " + e.to);
  console.log("");
}
console.log("  " + ready + " ready, " + missing + " not applicable");

if (!APPLY) {
  console.log("");
  console.log("Dry run. Nothing written. Re-run with --apply.");
  process.exit(missing ? 1 : 0);
}
if (missing) {
  console.error("");
  console.error("Refusing to apply a partial batch: " + missing + " edit(s) could not be anchored.");
  process.exit(1);
}

for (const p of plan) {
  await rest("lessons?id=eq." + p.id, {
    method: "PATCH", headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ content_md: p.next }),
  });
}
console.log("");
console.log("  " + plan.length + " lesson(s) written");

/* POST-CONDITIONS, read back rather than trusting that PATCH returned no error. */
let ok = 0, bad = 0;
for (const p of plan) {
  const back = await rest("lessons?select=content_md,mcp_servable,mcp_scanned_at&id=eq." + p.id);
  const b = back[0].content_md;
  const good = b.includes(p.to) && !b.includes(p.from) && b.length === p.next.length;
  console.log("  " + (good ? "ok  " : "FAIL") + "  " + p.slug
    + "   mcp_servable=" + back[0].mcp_servable + " mcp_scanned_at=" + (back[0].mcp_scanned_at ?? "null"));
  good ? ok++ : bad++;
}
console.log("");
console.log("  verified " + ok + ", failed " + bad);
console.log("");
console.log("STILL OUTSTANDING, and neither is done by this script:");
console.log("  1. RE-SCAN. The edit trigger cleared mcp_servable on every row written, so");
console.log("     these lessons are withheld until scan-iso-leaks --apply runs. Silent by");
console.log("     design: no error, no queue, nothing to notice.");
console.log("  2. RETRANSLATION. The es-419 and pt-BR rows still carry the TRANSLATED");
console.log("     reproduction, which the English-only index cannot see and this script");
console.log("     does not touch.");
process.exitCode = bad ? 1 : 0;
