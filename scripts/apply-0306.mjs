#!/usr/bin/env node
/**
 * apply-0306.mjs -- #4, the one meaning defect in batch 1.
 *
 * WRITES. `--apply`; DRY BY DEFAULT. Unknown flags exit 2.
 *
 * `03-06-data-for-ai-systems`, 42001 A.7. ISO lists three alternatives:
 *
 *     known OR potential biases OR other systematic errors
 *
 * A previous reproduction-repair turned that into two joint requirements:
 *
 *     biases known or suspected, AND other systematic errors
 *
 * Three things any one of which is in scope became two things both required.
 * That is a meaning change, not a register one, and it is the only span in
 * batch 1 of that kind.
 *
 * APPLIED IN ITS OWN WRITE because its lesson was absent from the apply list
 * while the span was approved a prompt earlier. Flagged rather than reconciled
 * -- an instruction that contradicts an earlier ruling is not silently merged
 * by whoever is executing it -- and then ruled on.
 *
 * Draft score: 4w, coverage 0.11, does not fire.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". DRY BY DEFAULT; --apply to write."); process.exit(2);
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

const SLUG = "03-06-data-for-ai-systems";
const FROM = "**including biases known or suspected, and other systematic errors**";
const TO = "**including biases that are known, biases that are merely potential, or other systematic errors** -- any one of the three is in scope, and none of them depends on another being present";

const rows = await (await fetch(BASE + "/lessons?select=id,content_md&language=eq.en&slug=eq." + SLUG, { headers: H })).json();
if (rows.length !== 1) { console.error("expected 1 row, got " + rows.length); process.exit(1); }
const row = rows[0];
const hits = row.content_md.split(FROM).length - 1;
const done = row.content_md.split(TO).length - 1;
console.log("");
console.log("  " + SLUG);
console.log("  occurrences of the joint-requirement text : " + hits);
console.log("  occurrences of the replacement            : " + done);
if (hits === 0) { console.log(""); console.log(done ? "Already applied." : "Span not found -- the body moved. NOT guessing."); process.exit(0); }
if (hits !== 1) { console.error("expected exactly 1; refusing to sweep " + hits); process.exit(1); }

const next = row.content_md.replace(FROM, TO);
if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

const back = await fetch(BASE + "/lessons?id=eq." + row.id, {
  method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify({ content_md: next }),
});
if (!back.ok) { console.error("PATCH failed: " + back.status); process.exit(1); }
const after = (await back.json())[0];

console.log("");
console.log("POST-CONDITIONS");
let fail = 0;
const ok = (l, c) => { console.log("  " + (c ? "PASS  " : "FAIL  ") + l); if (!c) fail++; };
ok("the three alternatives are present", after.content_md.includes(TO));
ok("the joint-requirement text is gone", !after.content_md.includes(FROM));
/* The negative half that matters for THIS defect: the conjunction must read as
 * alternatives. "and other systematic errors" must not survive anywhere. */
ok("no 'and other systematic errors' survives", !after.content_md.includes("and other systematic errors"));
ok("nothing else changed", after.content_md === next);
console.log("");
process.exit(fail ? 1 : 0);
