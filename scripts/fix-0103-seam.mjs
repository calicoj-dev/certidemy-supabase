#!/usr/bin/env node
/**
 * fix-0103-seam.mjs -- restore the noun a span replacement ate, and the
 * sentence boundary it removed.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * ============ WHAT BROKE ============
 *
 * `apply-rewrites-batch-1.mjs`, committed as `1fe865e`, declared:
 *
 *   from: "assessments at planned intervals, and again whenever a significant
 *          change is proposed or occurs"
 *   to:   "Clause 8.2 sets two independent triggers for a risk assessment: the
 *          planned intervals, or a significant change being proposed or
 *          occurring. Either one is enough on its own"
 *
 * The `from` begins with the word `assessments`, which in the live body was the
 * TAIL of "risk assessments and impact assessments". Replacing it ate the second
 * noun and removed the sentence boundary with it:
 *
 *   ... run risk assessments and impact Clause 8.2 sets two independent ...
 *
 * AIMS-F 01-03 has SERVED that since 2026-09-23.
 *
 * ============ THE ORIGINAL IS DERIVED, NOT RECONSTRUCTED ============
 *
 * The lesson bodies are not in git -- they are rows. But the SCRIPT is, and its
 * `from` string IS the text that was replaced, byte for byte. So the pre-edit
 * sentence was:
 *
 *   "The clause 8 operational requirements run risk assessments and impact
 *    assessments at planned intervals, and again whenever a significant change
 *    is proposed or occurs."
 *
 * and the rewrite's intent was to end that sentence after the two nouns and
 * follow it with the Clause 8.2 explanation. The repair restores exactly the
 * two things the splice destroyed -- the noun `assessments` and the full stop --
 * and invents nothing: no word here is chosen by me.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". DRY BY DEFAULT; --apply to write.");
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
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

const SLUG = "01-03-the-ai-system-life-cycle";
const FROM = "run risk assessments and impact Clause 8.2 sets";
const TO = "run risk assessments and impact assessments. Clause 8.2 sets";

async function rest(path, init) {
  let last;
  for (let k = 0; k < 6; k++) {
    try {
      const r = await fetch(BASE + "/" + path, { ...(init || {}),
        headers: { ...H, ...((init || {}).headers || {}) }, signal: AbortSignal.timeout(45000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 140));
      return t ? JSON.parse(t) : null;
    } catch (e) { last = e; }
    await new Promise((s) => setTimeout(s, 300 * (k + 1)));
  }
  throw last;
}

/* State of the whole group before, so the withholding movement can be stated
 * rather than assumed. Editing the English moves left(md5(content_md),8), which
 * is what both the review arm and 367's provenance arm compare against -- so
 * the translations are EXPECTED to move, and this records where from. */
const before = await rest("lessons?select=id,slug,language,content_md,mcp_servable,mcp_scanned_at," +
  "mcp_iso_longest_run,mcp_scan_sources,en_content_hash&slug=eq." + SLUG + "&order=language");
const en = before.find((r) => r.language === "en");
if (!en) { console.error("no English row for " + SLUG); process.exit(1); }

const hits = en.content_md.split(FROM).length - 1;
console.log("");
console.log("01-03 SEAM REPAIR");
console.log("  anchor occurrences in the live English: " + hits + " (must be 1)");
if (hits !== 1) { console.error("ABORT: anchor is not unique. Nothing written."); process.exit(1); }

const next = en.content_md.replace(FROM, TO);
/* Exactly one word and one full stop longer. A length check is cheap and it
 * catches a replacement that did more than it said. */
const grew = next.length - en.content_md.length;
console.log("  bytes added: " + grew + " (expected " + (TO.length - FROM.length) + ")");
if (grew !== TO.length - FROM.length) { console.error("ABORT: unexpected length change."); process.exit(1); }

console.log("");
console.log("  was:  ... " + FROM + " ...");
console.log("  now:  ... " + TO + " ...");
console.log("");
console.log("  state before, through the gate rather than off the column:");
for (const r of before) {
  console.log("    " + r.language.padEnd(7) + " servable=" + (await rest(
    "rpc/lesson_body_is_servable", { method: "POST", body: JSON.stringify({ p_lesson_id: r.id }) })));
}

if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing written. Re-run with --apply.");
  process.exit(0);
}

const back = await rest("lessons?id=eq." + en.id, {
  method: "PATCH", headers: { Prefer: "return=representation" },
  body: JSON.stringify({ content_md: next }),
});
const after = back[0];

/* BYTE READ-BACK: not "the PATCH returned 200" but "the bytes in the database
 * equal the bytes I computed". */
const ok = [];
ok.push(["bytes match what was computed", after.content_md === next]);
ok.push(["the broken seam is gone", !after.content_md.includes(FROM)]);
ok.push(["the repaired sentence is present", after.content_md.includes(TO)]);
ok.push(["nothing else moved", after.content_md.length === en.content_md.length + grew]);
/* The trigger must have fired: an edited body is unscanned until the scanner
 * runs, and 373 reports that as `unscanned` rather than as reproduction. */
ok.push(["trigger cleared mcp_servable", after.mcp_servable === false]);
ok.push(["trigger cleared mcp_scanned_at", after.mcp_scanned_at === null]);

console.log("");
for (const [label, v] of ok) console.log("  " + (v ? "PASS  " : "FAIL  ") + label);
if (!ok.every(([, v]) => v)) { console.error(""); console.error("Read-back failed."); process.exitCode = 1; }
else {
  console.log("");
  console.log("Written. The English is now UNSCANNED and withheld until scan-iso-leaks runs;");
  console.log("the translations move too, because editing the English moves the hash both the");
  console.log("review arm and 367's provenance arm compare against.");
}
