/**
 * load-aims-ia-concepts.mjs - migration 206 through the REST API.
 *
 * WHY THIS EXISTS. The Supabase SQL editor appended three lines of its own to a
 * 560-line paste ("ALTER TABLE any ENABLE ROW LEVEL SECURITY;", a fix template
 * carrying a literal placeholder) - in a fresh tab, twice. The same injection
 * produced an earlier "relation \"a\" does not exist" against SQL that three
 * parsers accepted. This project already keeps API loaders for exactly this
 * reason; concepts belong on the same path.
 *
 * ZERO DEPENDENCIES on purpose - no dotenv, no supabase-js. It parses
 * scripts/.env itself and uses Node's built-in fetch, so it cannot fail on a
 * package this repo may or may not have installed.
 *
 *   node scripts/load-aims-ia-concepts.mjs --dry     <- ALWAYS first, exits 2
 *   node scripts/load-aims-ia-concepts.mjs
 *
 * Idempotent: skips concepts whose slug exists and links already present.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes("--dry");
const die = (m) => { console.error("FAIL: " + m); process.exit(1); };

// --- env, parsed here rather than imported ----------------------------------
const env = { ...process.env };
const envPath = join(here, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} else {
  console.warn("   note: scripts/.env not found, relying on process env");
}
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) die("SUPABASE_SERVICE_ROLE_KEY not set (scripts/.env or environment)");
const BASE = (env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co").replace(/\/+$/, "");

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function get(path) {
  const r = await fetch(`${BASE}/rest/v1/${path}`, { headers: H });
  if (!r.ok) die(`GET ${path} -> ${r.status} ${await r.text()}`);
  return r.json();
}
async function post(table, rows) {
  const r = await fetch(`${BASE}/rest/v1/${table}`, {
    method: "POST", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify(rows),
  });
  if (!r.ok) die(`POST ${table} -> ${r.status} ${await r.text()}`);
}

// --- payload ----------------------------------------------------------------
const data = JSON.parse(readFileSync(join(here, "aims-ia-concepts.json"), "utf8"));
const CERT = data.cert;

console.log(`\n== AIMS-IA concepts ${DRY ? "(DRY RUN - nothing written)" : "(LIVE)"}`);
console.log(`   ${BASE}`);
console.log(`   cert ${CERT}`);
console.log(`   payload: ${data.concepts.length} concepts, ${data.links.length} links\n`);

const cert = await get(`certifications?id=eq.${CERT}&select=id,code,name`);
if (!cert.length) die(`certification ${CERT} not found - run 205 first`);
console.log(`   found ${cert[0].code} - ${cert[0].name}`);

const tasks = await get(`tasks?certification_id=eq.${CERT}&select=id,code`);
if (tasks.length !== 40) die(`expected 40 tasks, found ${tasks.length} - 205 incomplete`);
const taskId = new Map(tasks.map((t) => [t.code, t.id]));
const orphanCodes = [...new Set(data.links.map((l) => l.task))].filter((c) => !taskId.has(c));
if (orphanCodes.length) die(`task codes in payload absent from database: ${orphanCodes.join(", ")}`);

const existing = await get(`concepts?certification_id=eq.${CERT}&select=id,slug`);
const have = new Set(existing.map((c) => c.slug));
const toInsert = data.concepts.filter((c) => !have.has(c.slug));
console.log(`   concepts present: ${have.size}    to insert: ${toInsert.length}`);

if (!DRY && toInsert.length) {
  for (let i = 0; i < toInsert.length; i += 50) {
    await post("concepts", toInsert.slice(i, i + 50).map((c) => ({
      certification_id: CERT, slug: c.slug, name: c.name, description: c.description,
    })));
    console.log(`   inserted ${Math.min(i + 50, toInsert.length)}/${toInsert.length} concepts`);
  }
}

const after = DRY ? existing : await get(`concepts?certification_id=eq.${CERT}&select=id,slug`);
const conceptId = new Map(after.map((c) => [c.slug, c.id]));

const ids = tasks.map((t) => t.id).join(",");
const linkRows = await get(`task_concepts?task_id=in.(${ids})&select=task_id,concept_id`);
const haveLink = new Set(linkRows.map((r) => `${r.task_id}|${r.concept_id}`));

const wanted = [];
for (const l of data.links) {
  const cid = conceptId.get(l.slug);
  if (!cid) { if (!DRY) die(`concept slug missing after insert: ${l.slug}`); continue; }
  const k = `${taskId.get(l.task)}|${cid}`;
  if (!haveLink.has(k)) wanted.push({ task_id: taskId.get(l.task), concept_id: cid });
}
console.log(`   links present:    ${haveLink.size}    to insert: ${DRY ? data.links.length + " (est)" : wanted.length}`);

if (DRY) { console.log("\n   DRY RUN - nothing written. Re-run without --dry to apply.\n"); process.exit(2); }

for (let i = 0; i < wanted.length; i += 100) await post("task_concepts", wanted.slice(i, i + 100));
if (wanted.length) console.log(`   inserted ${wanted.length} links`);

const finalC = await get(`concepts?certification_id=eq.${CERT}&select=id`);
const finalL = await get(`task_concepts?task_id=in.(${ids})&select=task_id`);
const ok = finalC.length === 158 && finalL.length === 158;
console.log(`\n   RESULT: concepts ${finalC.length} (expect 158), links ${finalL.length} (expect 158)`);
console.log(ok ? "   OK\n" : "   MISMATCH - investigate before proceeding\n");
process.exit(ok ? 0 : 1);
