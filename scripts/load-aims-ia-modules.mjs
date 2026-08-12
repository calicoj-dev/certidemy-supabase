/**
 * load-aims-ia-modules.mjs - migration 207 through the REST API.
 *
 * Same path and same zero-dependency shape as load-aims-ia-concepts.mjs, because
 * the Supabase SQL editor appends its own text to pastes. The .sql in migrations/
 * is the versioned record; this is the execution path.
 *
 *   node scripts/load-aims-ia-modules.mjs --dry     <- ALWAYS first, exits 2
 *   node scripts/load-aims-ia-modules.mjs
 *
 * Idempotent: skips modules whose slug already exists.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes("--dry");
const die = (m) => { console.error("FAIL: " + m); process.exit(1); };

const env = { ...process.env };
const envPath = join(here, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) die("SUPABASE_SERVICE_ROLE_KEY not set (scripts/.env or environment)");
const BASE = (env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co").replace(/\/+$/, "");
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function get(p) {
  const r = await fetch(`${BASE}/rest/v1/${p}`, { headers: H });
  if (!r.ok) die(`GET ${p} -> ${r.status} ${await r.text()}`);
  return r.json();
}

const data = JSON.parse(readFileSync(join(here, "aims-ia-modules.json"), "utf8"));
const CERT = data.cert;

console.log(`\n== AIMS-IA modules ${DRY ? "(DRY RUN - nothing written)" : "(LIVE)"}`);
console.log(`   cert ${CERT}\n`);

const cert = await get(`certifications?id=eq.${CERT}&select=code,name`);
if (!cert.length) die(`certification ${CERT} not found - run 205 first`);
console.log(`   found ${cert[0].code} - ${cert[0].name}`);

const existing = await get(`modules?certification_id=eq.${CERT}&select=slug`);
const have = new Set(existing.map((m) => m.slug));
const toInsert = data.modules.filter((m) => !have.has(m.slug));
console.log(`   modules present: ${have.size}    to insert: ${toInsert.length}`);
for (const m of toInsert) console.log(`     ${m.order_index}. ${m.slug}  (${m.estimated_minutes} min)`);

if (DRY) { console.log("\n   DRY RUN - nothing written. Re-run without --dry to apply.\n"); process.exit(2); }

if (toInsert.length) {
  const r = await fetch(`${BASE}/rest/v1/modules`, {
    method: "POST", headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify(toInsert.map((m) => ({ certification_id: CERT, ...m }))),
  });
  if (!r.ok) die(`POST modules -> ${r.status} ${await r.text()}`);
}

const final = await get(`modules?certification_id=eq.${CERT}&select=slug,order_index`);
const ok = final.length === 5;
console.log(`\n   RESULT: modules ${final.length} (expect 5)`);
console.log(ok ? "   OK\n" : "   MISMATCH - investigate\n");
process.exit(ok ? 0 : 1);
