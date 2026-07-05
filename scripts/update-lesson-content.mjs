#!/usr/bin/env node
/**
 * update-lesson-content.mjs  (in-place content_md updater)
 *
 * PROBLEM. load-lessons-direct.mjs only INSERTS new lessons -- it skips any
 * (slug, language) that already exists. When you EDIT an existing lesson's
 * frontmatter/body on disk, there is no path that propagates that change into
 * the DB's lessons.content_md. wire-lessons.mjs then parses the STALE DB
 * content and never sees your edit. This script closes that gap.
 *
 * WHAT IT DOES. For each --file, reads the .md from disk (bytes -> JS string,
 * so em-dashes / curly quotes / nested JSON never break -- same API-write
 * reason the loader exists), finds the EXISTING lessons row by (slug, lang),
 * and UPDATES ONLY content_md (+ title, estimated_minutes if changed). It does
 * NOT touch lesson_group_id, module_id, order_index, join tables, or any other
 * language's row. Idempotent: re-running with unchanged files is a no-op write.
 *
 * It is deliberately narrow -- one or more explicit files, never a bulk walk --
 * so an edit-propagation can't accidentally rewrite content you didn't mean to.
 *
 * USAGE (dry run first, always):
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:CERT_ID="11111111-1111-1111-1111-111111111111"
 *   node scripts\update-lesson-content.mjs --lang en --dry \
 *     --file <abs\path\to\lesson.md> [--file <another.md> ...]
 *   # then live: drop --dry
 *
 * Reads env like the loader: SUPABASE_SERVICE_ROLE_KEY (scripts\.env),
 * NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL. CERT_ID selects the cert (used only
 * to scope the module lookup for a sanity check; the update keys on slug+lang).
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(process.cwd(), "scripts", ".env"),
    path.join(process.cwd(), ".env"),
    path.join(here, ".env"),
    path.join(here, "..", ".env"),
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

// collect all --file values
const files = [];
for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === "--file" && process.argv[i + 1]) files.push(process.argv[i + 1]);
}
function flag(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) return process.argv[i + 1];
  if (i >= 0) return true;
  return def;
}
const LANG = flag("lang", "en");
const DRY = !!flag("dry", false);

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  || process.env.SUPABASE_URL
  || "https://pctynukndxnmnxiqpgck.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!KEY) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY (supabase\\scripts\\.env)."); process.exit(2); }
if (files.length === 0) { console.error("Pass at least one --file <abs path to .md>."); process.exit(2); }

const sb = createClient(URL, KEY, { auth: { persistSession: false } });

function fm(text) {
  const m = text.match(/^\s*---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!m) return null;
  const b = m[1];
  const g = (k) => { const r = b.match(new RegExp(`^${k}:\\s*(.+?)\\s*$`, "m")); return r ? r[1].trim() : null; };
  return {
    lesson_id: g("lesson_id"),
    title: g("title"),
    duration_minutes: g("duration_minutes"),
    language: g("language"),
  };
}

async function main() {
  console.log(`URL: ${URL}`);
  console.log(`Lang: ${LANG}  ${DRY ? "(DRY RUN)" : "(LIVE)"}`);
  console.log(`Files: ${files.length}\n`);

  let updated = 0, unchanged = 0, notfound = 0, bad = 0;
  for (const f of files) {
    if (!existsSync(f)) { console.error(`  ! file not found: ${f}`); bad++; continue; }
    const text = readFileSync(f, "utf8");
    const meta = fm(text);
    if (!meta || !meta.lesson_id) { console.error(`  ! no frontmatter/lesson_id: ${f}`); bad++; continue; }

    const { data: existing, error: selErr } = await sb.from("lessons")
      .select("id, content_md, title, estimated_minutes")
      .eq("slug", meta.lesson_id).eq("language", LANG).maybeSingle();
    if (selErr) { console.error(`  ! select failed ${meta.lesson_id}: ${selErr.message}`); bad++; continue; }
    if (!existing) { console.warn(`  ! no existing row for (${meta.lesson_id}, ${LANG}) -- use the loader for NEW lessons`); notfound++; continue; }

    if (existing.content_md === text) { console.log(`  = unchanged: ${meta.lesson_id}`); unchanged++; continue; }

    const patch = {
      content_md: text,
      title: meta.title ?? existing.title,
      estimated_minutes: meta.duration_minutes ? parseInt(meta.duration_minutes, 10) : existing.estimated_minutes,
    };
    if (DRY) {
      const oldLen = existing.content_md?.length ?? 0;
      console.log(`  would update: ${meta.lesson_id}  (content_md ${oldLen} -> ${text.length} chars)`);
      updated++;
      continue;
    }
    const { error: upErr } = await sb.from("lessons").update(patch).eq("id", existing.id);
    if (upErr) { console.error(`  FAIL ${meta.lesson_id}: ${upErr.message}`); bad++; continue; }
    console.log(`  updated: ${meta.lesson_id}`);
    updated++;
  }
  console.log(`\n${DRY ? "[dry] would update" : "updated"}: ${updated}   unchanged: ${unchanged}   not-found: ${notfound}   errors: ${bad}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
