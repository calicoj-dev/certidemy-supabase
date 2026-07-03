#!/usr/bin/env node
/**
 * load-lessons-direct.mjs  (paste-proof lesson loader)
 *
 * Loads lesson markdown straight into the `lessons` table via the Supabase JS
 * client (@supabase/supabase-js) using .insert() -- NOT raw SQL. This bypasses
 * the two failure modes that broke the SQL-paste path entirely:
 *   1. No clipboard: content is read from disk as bytes and sent over the API.
 *   2. No SQL string parsing: content_md is a JS string, so dollar-quoting,
 *      apostrophes, em-dashes, and nested quotes cannot break anything.
 *
 * It reads lessons exactly like the SQL generator (same frontmatter mapping),
 * resolves module_id by (certification_id, module_slug), and is idempotent:
 * it checks (slug, language) first and skips lessons already present.
 *
 * WHY THIS IS THE GOVERNANCE-GRADE PATH
 * -------------------------------------
 * The Supabase web SQL editor's paste path corrupts complex punctuation in
 * large statements, breaking string literals. Loading via the API (or psql -f)
 * is deterministic and reproducible. This loader is the canonical lesson-load
 * step going forward; the SQL generator remains for audit/versioned record.
 *
 * USAGE
 *   cd C:\Users\Juan\Documents\certidemy\supabase   (has @supabase/supabase-js + scripts\.env)
 *   $env:CERT_ID="44444444-4444-4444-4444-444444444444"
 *   node <path>\load-lessons-direct.mjs --in <content-dir> [--lang en] [--dry]
 *
 * EXAMPLE (all of SD module 2, or all 44 -- idempotent, skips existing)
 *   node load-lessons-direct.mjs --in C:\Users\Juan\Documents\certidemy\certidemy-web\content\sd-ai-i --lang en
 *
 * Reads env: SUPABASE_SERVICE_ROLE_KEY (scripts\.env), NEXT_PUBLIC_SUPABASE_URL
 * or SUPABASE_URL. CERT_ID env selects the cert.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

// RFC 4122 v5 UUID (SHA-1), matching Postgres uuid_generate_v5(namespace, name).
// namespace = the cert uuid; name = the lesson slug. Deterministic: the en row
// and its future es-419/pt-BR siblings all compute the SAME group id from the
// shared slug -- identical to what the SQL generator produced for the other rows.
function uuidV5(name, namespaceUuid) {
  const nsBytes = Buffer.from(namespaceUuid.replace(/-/g, ""), "hex");
  const nameBytes = Buffer.from(name, "utf8");
  const hash = createHash("sha1").update(Buffer.concat([nsBytes, nameBytes])).digest();
  const b = Buffer.from(hash.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.toString("hex");
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;
}

// --- load .env from the supabase/scripts dir (same as wire-lessons) ---
function loadEnv() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(process.cwd(), "scripts", ".env"),
    path.join(process.cwd(), ".env"),
    path.join(here, ".env"),                 // supabase\scripts\.env (next to this script)
    path.join(here, "..", ".env"),           // supabase\.env
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
        const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
      }
    }
  }
}
loadEnv();

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) return process.argv[i + 1];
  if (i >= 0) return true;
  return def;
}

const CERT_ID = process.env.CERT_ID;
const VERIFY_SLUG = process.argv.indexOf("--verify-uuid") >= 0 ? process.argv[process.argv.indexOf("--verify-uuid")+1] : null;
const IN = arg("in");
const LANG = arg("lang", "en");
const DRY = !!arg("dry", false);

if (!CERT_ID) { console.error("Set CERT_ID env (the cert uuid)."); process.exit(2); }
if (!IN) { console.error("Pass --in <content-dir>."); process.exit(2); }

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  || process.env.SUPABASE_URL
  || "https://pctynukndxnmnxiqpgck.supabase.co";  // project ref (deterministic fallback)
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!KEY) {
  console.error("Missing service-role key. Expected SUPABASE_SERVICE_ROLE_KEY in supabase\\scripts\\.env");
  console.error("Looked in cwd, scripts/.env, and next to the script. Set it or run from the supabase repo root.");
  process.exit(2);
}
console.log(`URL: ${URL}`);
console.log(`Key: ${KEY ? "loaded (" + KEY.slice(0,6) + "...)" : "MISSING"}`);

const sb = createClient(URL, KEY, { auth: { persistSession: false } });

if (VERIFY_SLUG) {
  console.log(`Computed group uuid for slug '${VERIFY_SLUG}' with cert ${CERT_ID}:`);
  console.log("  " + uuidV5(VERIFY_SLUG, CERT_ID));
  console.log("Compare against DB:  select lesson_group_id from lessons where slug='" + VERIFY_SLUG + "' and language='en';");
  process.exit(0);
}

function walkMd(dir) {
  const out = [];
  for (const n of readdirSync(dir)) {
    const full = path.join(dir, n);
    if (statSync(full).isDirectory()) out.push(...walkMd(full));
    else if (n.endsWith(".md")) out.push(full);
  }
  return out;
}

function fm(text) {
  const m = text.match(/^\s*---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!m) return null;
  const b = m[1];
  const g = (k) => { const r = b.match(new RegExp(`^${k}:\\s*(.+?)\\s*$`, "m")); return r ? r[1].trim() : null; };
  return {
    lesson_id: g("lesson_id"), module_slug: g("module_slug"), title: g("title"),
    order_index: g("order_index"), duration_minutes: g("duration_minutes"), language: g("language"),
  };
}

async function main() {
  console.log(`Cert:    ${CERT_ID}`);
  console.log(`Content: ${IN}`);
  console.log(`Lang:    ${LANG}  ${DRY ? "(DRY RUN)" : ""}\n`);

  // resolve modules for this cert once: slug -> id
  const { data: mods, error: me } = await sb.from("modules")
    .select("id, slug").eq("certification_id", CERT_ID);
  if (me) { console.error("modules query failed:", me.message); process.exit(1); }
  const modBySlug = new Map(mods.map((m) => [m.slug, m.id]));
  console.log(`Modules in cert: ${mods.length}\n`);

  const files = walkMd(IN);
  let inserted = 0, skipped = 0, missing = 0;

  for (const f of files.sort()) {
    const text = readFileSync(f, "utf8");
    const meta = fm(text);
    if (!meta || !meta.lesson_id || !meta.module_slug) { continue; }
    if ((meta.language ?? "en") !== LANG) continue;

    const module_id = modBySlug.get(meta.module_slug);
    if (!module_id) { console.warn(`  ! no module for slug '${meta.module_slug}' (${meta.lesson_id})`); missing++; continue; }

    // idempotency: skip if (slug, language) already present
    const { data: existing } = await sb.from("lessons")
      .select("id").eq("slug", meta.lesson_id).eq("language", LANG).maybeSingle();
    if (existing) { skipped++; continue; }

    const row = {
      module_id,
      title: meta.title,
      content_md: text,                         // full file, byte-for-byte, as a JS string
      order_index: parseInt(meta.order_index, 10),
      estimated_minutes: meta.duration_minutes ? parseInt(meta.duration_minutes, 10) : 10,
      language: LANG,
      slug: meta.lesson_id,
      lesson_group_id: uuidV5(meta.lesson_id, CERT_ID),  // matches Postgres uuid_generate_v5(cert, slug)
    };

    if (DRY) { console.log(`  would insert: ${meta.lesson_id} (module ${meta.module_slug})`); inserted++; continue; }

    const { error: ie } = await sb.from("lessons").insert(row);
    if (ie) { console.error(`  FAIL ${meta.lesson_id}: ${ie.message}`); continue; }
    console.log(`  inserted: ${meta.lesson_id}`);
    inserted++;
  }

  console.log(`\n${DRY ? "[dry] would insert" : "inserted"}: ${inserted}   skipped(existing): ${skipped}   missing-module: ${missing}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
