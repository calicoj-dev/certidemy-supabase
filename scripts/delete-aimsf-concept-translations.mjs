#!/usr/bin/env node
/**
 * delete-aimsf-concept-translations.mjs - remove the 308 AIMS-F concept
 * translations that render the template stub.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * ============ WHY DELETE RATHER THAN REPAIR ============
 *
 * Every one of the 308 is a faithful translation of
 *
 *     <name> as required or described by ISO/IEC 42001:2023 and taught in the
 *     AIMS-F blueprint.
 *
 * A correct rendering of a stub is a correct translation of nothing. There is
 * no span to preserve and no drift to review, so the retranslation-scope rule
 * -- diff the old against the new and treat untouched-source drift as its own
 * verdict -- does not apply here: EVERY source changed completely, so every
 * word is expected to move.
 *
 * Repairing in place would also leave `en_hash` pointing at the stub. Deleting
 * and regenerating is the only path that produces rows the 359 gate can ever
 * open.
 *
 * ============ WHAT IS ASSERTED BEFORE ANYTHING IS REMOVED ============
 *
 * The English must already be repaired -- 154 rows, no stub surviving -- or
 * this deletes good translations of good text. And every row being deleted
 * must currently FAIL the gate, which is the evidence that none of them is
 * serving anything to anyone.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". This is the --apply family: dry by default.");
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

const cert = (await rest("certifications?select=id,code&code=eq.AIMS-F"))[0];
if (!cert) { console.error("AIMS-F not found"); process.exit(2); }

const concepts = await rest("concepts?select=id,slug,name,description,retired_at&certification_id=eq." + cert.id + "&limit=1000");
const live = concepts.filter((c) => c.retired_at === null);
const stubs = live.filter((c) => (c.description || "").includes("as required or described by ISO/IEC 42001:2023 and taught in the"));

const ids = live.map((c) => c.id);
const tr = await rest("concept_translations?select=concept_id,language,name,description,en_hash,is_provisional"
  + "&concept_id=in.(" + ids.join(",") + ")&limit=2000");

console.log("");
console.log("PRE-CONDITIONS");
console.log("  live AIMS-F concepts                 " + live.length);
console.log("  English stubs still present          " + stubs.length);
console.log("  translation rows to delete           " + tr.length);

/* THE GATE STATE OF WHAT IS BEING DELETED. A row that currently PASSES the
 * gate is serving, and deleting it silently would remove live content. */
const byId = new Map(live.map((c) => [c.id, c]));
const CR = String.fromCharCode(13);
const { createHash } = await import("node:crypto");
const enHash = (n, d) => createHash("md5")
  .update(String(n ?? "").split(CR).join("") + "|" + String(d ?? "").split(CR).join(""))
  .digest("hex").slice(0, 16);
const passing = tr.filter((r) => {
  const c = byId.get(r.concept_id);
  return c && r.en_hash && r.en_hash === enHash(c.name, c.description);
});
const serving = tr.filter((r) => r.is_provisional === false);
console.log("  of those, currently PASS the gate    " + passing.length);
console.log("  of those, non-provisional (serving)  " + serving.length);

/* A sample of what is going, recorded so the deletion is reviewable after the
 * fact rather than only counted. */
const sample = tr.slice(0, 3).map((r) => ({ language: r.language, name: r.name, description: r.description }));

let fail = 0;
if (live.length !== 154) { console.error("  FAIL expected 154 live concepts"); fail++; }
if (stubs.length !== 0) { console.error("  FAIL " + stubs.length + " English stub(s) remain -- repair the English first"); fail++; }
if (tr.length !== 308) { console.error("  FAIL expected 308 translation rows, found " + tr.length); fail++; }
if (passing.length !== 0) { console.error("  FAIL " + passing.length + " row(s) pass the gate -- these are not placeholders"); fail++; }
if (serving.length !== 0) { console.error("  FAIL " + serving.length + " row(s) are non-provisional"); fail++; }
if (fail) { console.error(""); console.error("Refusing to delete."); process.exit(1); }
console.log("  all pre-conditions hold");

console.log("");
console.log("  sample of what is being deleted:");
for (const s of sample) console.log("    " + s.language + "  " + String(s.description).slice(0, 96));

if (!APPLY) { console.log(""); console.log("Dry run. Nothing deleted. Re-run with --apply."); process.exit(0); }

writeFileSync(join(HERE, "..", "AIMSF-DELETED-TRANSLATIONS.json"),
  JSON.stringify({ deleted: "2026-09-21", rows: tr.length, why: "placeholder renderings of the template stub", sample }, null, 2), "utf8");

await rest("concept_translations?concept_id=in.(" + ids.join(",") + ")", {
  method: "DELETE", headers: { Prefer: "return=minimal" },
});

/* POST-CONDITION: read back rather than trust that DELETE returned no error. */
const after = await rest("concept_translations?select=concept_id&concept_id=in.(" + ids.join(",") + ")&limit=2000");
const others = await rest("concept_translations?select=concept_id&limit=1");
console.log("");
console.log("  AIMS-F translation rows remaining    " + after.length + (after.length === 0 ? "  (all removed)" : "  FAIL"));
console.log("  table still holds rows for others    " + (others.length > 0 ? "yes" : "NO -- something deleted too much"));
process.exitCode = after.length === 0 && others.length > 0 ? 0 : 1;
