#!/usr/bin/env node
/**
 * fix-ismsia-0406-modal.mjs -- the one OLD span the parity check found.
 *
 * WRITES. `--apply`; DRY BY DEFAULT. Unknown flags exit 2.
 *
 * `isms-ia-04-06-defined-versus-running` pt-BR renders the pre-repair modal:
 *
 *     was:  - e) **quando** os resultados deverao ser analisados e avaliados
 *     now:  - e) **quando** os resultados devem ser analisados e avaliados
 *
 * A WORDING ITEM, NOT A REPRODUCTION. `deverao` is a future indicative where
 * the English says `shall`; `devem` is the ABNT rendering the rest of this
 * corpus uses. Nothing about ISO's expression is at stake, which is why it is
 * fixed here rather than escalated.
 *
 * IT DOES NOT TOUCH A HASH. There is no en_hash on lessons (that is migration
 * 367, proposed), and lesson_translation_reviews has no row for this lesson,
 * so there is no review for this edit to invalidate. If 367 lands, this row
 * will need stamping with the rest.
 */
import { readFileSync, existsSync } from "node:fs";
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

const SLUG = "isms-ia-04-06-defined-versus-running";
const LANG = "pt-BR";
const FROM = "os resultados deverão ser analisados e avaliados";
const TO = "os resultados devem ser analisados e avaliados";

const rows = await (await fetch(
  BASE + "/lessons?select=id,slug,language,content_md&slug=eq." + SLUG + "&language=eq." + encodeURIComponent(LANG),
  { headers: H })).json();
if (rows.length !== 1) { console.error("expected 1 row, got " + rows.length); process.exit(1); }
const row = rows[0];

const hits = row.content_md.split(FROM).length - 1;
const already = row.content_md.split(TO).length - 1;
console.log("");
console.log("  " + SLUG + "  " + LANG);
console.log("  occurrences of the OLD modal : " + hits);
console.log("  occurrences of the NEW modal : " + already);

if (hits === 0) {
  console.log("");
  console.log(already > 0 ? "Already fixed. Nothing to do." : "Neither string present -- the body moved. NOT guessing; stopping.");
  process.exit(0);
}
if (hits !== 1) { console.error("expected exactly 1 occurrence; refusing to sweep " + hits); process.exit(1); }

const next = row.content_md.replace(FROM, TO);
/* The negative half: exactly one character sequence changes and the body is
 * otherwise byte-identical. A replace() that matched more than intended would
 * pass any assertion written only about the target string. */
if (next.length !== row.content_md.length - (FROM.length - TO.length)) {
  console.error("length delta is not the single substitution; refusing"); process.exit(1);
}

if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

const back = await fetch(BASE + "/lessons?id=eq." + row.id, {
  method: "PATCH", headers: { ...H, Prefer: "return=representation" },
  body: JSON.stringify({ content_md: next }),
});
if (!back.ok) { console.error("PATCH failed: HTTP " + back.status + " " + (await back.text()).slice(0, 200)); process.exit(1); }
const after = (await back.json())[0];

console.log("");
console.log("POST-CONDITIONS");
let fail = 0;
const ok = (l, c, d) => { console.log("  " + (c ? "PASS  " : "FAIL  ") + l + (d ? "   " + d : "")); if (!c) fail++; };
ok("the new modal is present", after.content_md.includes(TO));
ok("the old modal is gone", !after.content_md.includes(FROM));
ok("nothing else changed", after.content_md === next, "byte-compared against the intended body");
console.log("");
process.exit(fail ? 1 : 0);
