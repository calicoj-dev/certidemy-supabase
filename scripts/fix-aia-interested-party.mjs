#!/usr/bin/env node
/**
 * fix-aia-interested-party.mjs -- the one live finding on the UNAUTHENTICATED
 * surface.
 *
 * WRITES. `--apply`; DRY BY DEFAULT. Unknown flags exit 2.
 *
 * `aia-interested-party-requirements` carries ten contiguous words of ISO/IEC
 * 42001:2023 clause 4.2:
 *
 *     "determine the interested parties relevant to the ai management system"
 *
 * Concepts are pulled by anyone -- no key, no account -- which is why this goes
 * ahead of the three lesson findings even though those are longer runs.
 *
 * ============ IT WAS HIDDEN BY A SELECTION RULE, NOT BY THE SKIP ============
 *
 * `score()` kept the highest-COVERAGE unit. This description is 399 characters,
 * so a 10-word run dilutes to coverage 0.17, while the concept NAME -- a
 * defined term at coverage 1.00 -- won the comparison and the run was thrown
 * away. The row reported clean.
 *
 * A ratio is diluted by length and an absolute run is not. That is the whole
 * reason ABS_RUN exists, and ranking units by the diluted half discarded
 * exactly the case the undiluted half was added to catch.
 *
 * ============ THE FRAME, NOT JUST THE WORDS ============
 *
 *     determine the ___ relevant to the ___
 *
 * is the same construction as clause 7.4's "determine the internal and external
 * communications relevant to the AI management system", which fired at 11w in
 * the rewrite batch earlier this evening. It is harmonised MSS boilerplate: the
 * frame recurs across clauses and across standards, and it is the natural way
 * to say the thing, which is why our rewrites keep reaching for it.
 *
 * So the rewrite keeps `determine` -- a reserved term importing a recorded
 * decision -- and puts it in OUR sentence, with the clause's objects named in
 * our own order.
 *
 * Scored before applying: 10w cov 0.17 FIRES  ->  4w cov 0.07 clean.
 *
 * ============ IT COSTS BOTH TRANSLATIONS, DELIBERATELY ============
 *
 * `concept_row_en_hash` covers name and description, so this edit moves the
 * hash and `mcp.concept` withholds the es-419 and pt-BR rows until they are
 * regenerated from the corrected English. Two rows dark against a ten-word
 * reproduction served to anyone: the right trade, and the gate making it
 * rather than a person is the point of the gate.
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

const SLUG = "aia-interested-party-requirements";
const FROM = "ISO/IEC 42001:2023 clause 4.2 requires the organization to determine the interested parties relevant to the AI management system, their relevant requirements, and which of those requirements will be addressed through the management system. The third element is the one most often missing: identifying a requirement without recording whether the AIMS addresses it leaves the determination incomplete.";
const TO = "Clause 4.2 of ISO/IEC 42001:2023 asks for three things, and the third is the one most often missing. The organization must **determine** who its interested parties are, what each of them requires, and which of those requirements the AI management system will actually address. Naming a requirement without recording whether the AIMS answers it leaves the determination incomplete.";
/* The exact ISO run. Asserted gone on its own, because "the new text is
 * present" would pass on a body that still carried the old phrase elsewhere. */
const ISO_RUN = "determine the interested parties relevant to the AI management system";

const rows = await (await fetch(BASE + "/concepts?select=id,slug,name,description&slug=eq." + SLUG, { headers: H })).json();
if (rows.length !== 1) { console.error("expected 1 row, got " + rows.length); process.exit(1); }
const row = rows[0];

console.log("");
console.log("  " + SLUG);
console.log("  current description matches exactly : " + (row.description === FROM));
console.log("  ISO run present                     : " + row.description.includes(ISO_RUN));
if (row.description !== FROM) {
  console.log("");
  console.log(row.description === TO ? "Already applied." : "The description has moved. NOT guessing; stopping.");
  process.exit(row.description === TO ? 0 : 1);
}
if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

const back = await fetch(BASE + "/concepts?id=eq." + row.id, {
  method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify({ description: TO }),
});
if (!back.ok) { console.error("PATCH failed: HTTP " + back.status); process.exit(1); }
const after = (await back.json())[0];

console.log("");
console.log("POST-CONDITIONS");
let fail = 0;
const ok = (l, c, d) => { console.log("  " + (c ? "PASS  " : "FAIL  ") + l + (d ? "   " + d : "")); if (!c) fail++; };
ok("the rewrite is present", after.description === TO);
ok("the ISO run is gone", !after.description.includes(ISO_RUN));
ok("the reserved term survives", /\bdetermine\b/i.test(after.description));
ok("the name is untouched", after.name === row.name);

/* THE NEGATIVE HALF, and it is about the gate rather than the text: both
 * translations must now be WITHHELD, because the English they were generated
 * from has moved. If they still serve, the hash gate is not doing its job. */
const trs = await (await fetch(
  BASE + "/concept_translations?select=language,is_provisional,en_hash&concept_id=eq." + row.id, { headers: H })).json();
const live = await (await fetch(
  BASE + "/rpc/concept_row_en_hash", { method: "POST", headers: H, body: JSON.stringify({ p_concept_id: row.id }) })).json();
for (const t of trs) {
  ok("withheld now: " + t.language, t.en_hash !== live, "stored " + t.en_hash + " vs live " + live);
}
console.log("");
console.log("  Both translations need regenerating from the corrected English, with a spec.");
process.exit(fail ? 1 : 0);
