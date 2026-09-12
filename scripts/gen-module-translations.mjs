#!/usr/bin/env node
/**
 * gen-module-translations.mjs - translate a certification's MODULE titles and
 * descriptions into es-419 and pt-BR, and write module_translations.
 *
 * --apply TO WRITE. Dry by default. Unknown flags exit 2.
 *
 *   CERT_ID=... node scripts/gen-module-translations.mjs --lang es-419 [--apply]
 *
 * WHY THIS EXISTS. certidemy-web/scripts/load-module-i18n.mjs is a HARDCODED
 * BACKFILL for four named certifications with the Spanish and Portuguese copy
 * written into the file. It is not a tool; it is a migration in script form, and
 * it cannot be pointed at a fifth certification.
 *
 * Measured 2026-09-11: FIVE certifications have zero module_translations rows -
 * AIMS-F, AIMS-IA, ISMS-IA, SM-AI-II, and none of them is covered by that
 * backfill. Two of the five are `available`. "5 modulos - 0 lecciones" with
 * English module titles is what that looks like to a Spanish candidate.
 *
 * THE CONTRACT IS THE SHARED ONE. This imports RETIRED_VOCABULARY from
 * lib/item-translation.mjs, the same block the item generators and (since
 * today) translate-lessons.mjs use. Module titles are short and look harmless,
 * which is exactly how "equipo de desarrollo" gets into a heading.
 *
 * ROWS LAND is_provisional = true AND review_status = 'unreviewed'. These are
 * AI-drafted and nobody has read them. Migration 295 gave domain and task
 * translations a three-state review flag; module_translations has only the
 * boolean, so the honest thing here is to leave the flag set and say so.
 *
 * SENTENCE CASE, NOT TITLE CASE (TERMINOLOGY-POLICY Rule 16). English module
 * titles are Title Case; Spanish and Portuguese are not. A translator that
 * preserves the capitalisation pattern produces something that reads as a brand
 * name rather than a heading.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { domainForCert, contractForDomain } from "./lib/item-translation.mjs";

const KNOWN = new Set(["--apply", "--lang"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error(`Unrecognised flag: ${a}. --apply to write; dry by default.`);
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");
const li = process.argv.indexOf("--lang");
const LANG = li >= 0 ? process.argv[li + 1] : null;
const LANG_NAMES = { "es-419": "Latin American Spanish", "pt-BR": "Brazilian Portuguese" };
if (!LANG || !LANG_NAMES[LANG]) {
  console.error(`--lang must be one of: ${Object.keys(LANG_NAMES).join(", ")}`);
  process.exit(2);
}

for (const p of ["scripts/.env", ".env"]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const CERT_ID = process.env.CERT_ID;
if (!CERT_ID) { console.error("Set CERT_ID."); process.exit(2); }
const KEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) { console.error("Set ANTHROPIC_API_KEY."); process.exit(2); }

const db = createClient(
  process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { data: modules, error: mErr } = await db
  .from("modules")
  .select("id, slug, title, description, order_index")
  .eq("certification_id", CERT_ID)
  .order("order_index");
if (mErr) { console.error(`modules read failed: ${mErr.message}`); process.exit(1); }
if (!modules || modules.length === 0) { console.error("no modules for this CERT_ID"); process.exit(1); }

const { data: existing, error: eErr } = await db
  .from("module_translations")
  .select("module_id")
  .eq("language", LANG)
  .in("module_id", modules.map((m) => m.id));
if (eErr) { console.error(`existing read failed: ${eErr.message}`); process.exit(1); }
const have = new Set((existing ?? []).map((r) => r.module_id));

const todo = modules.filter((m) => !have.has(m.id));
console.log(`${modules.length} module(s), ${have.size} already translated into ${LANG}, ${todo.length} to do\n`);
if (todo.length === 0) { console.log("nothing to do"); process.exit(0); }

// SAME DEFECT AS translate-lessons.mjs HAD, FIXED THE SAME WAY on 2026-09-12.
// This script interpolated the SCRUM vocabulary contract for every
// certification. Three of the four certifications with zero module_translations
// are ISO - AIMS-F, ISMS-IA and AIMS-IA - so the very next run would have
// translated ISO module headings under Scrum terminology rules.
//
// The domain comes from the certification's own code; anything unlisted gets no
// framework contract rather than the wrong one.
const { data: certRow, error: cErr } = await db
  .from("certifications").select("code").eq("id", CERT_ID).single();
if (cErr || !certRow) { console.error("could not read the certification code"); process.exit(1); }
const DOMAIN = domainForCert(certRow.code);
const CONTRACT = contractForDomain(DOMAIN);
console.log(`Certification ${certRow.code} -> ${DOMAIN} vocabulary contract`);

const system = `You translate ${CONTRACT.subject} MODULE headings from English into ${LANG_NAMES[LANG]}.

Return a JSON array of the SAME length and order as the input. For each module return
{"title":string,"description":string}.

Rules:
  - Translate title and description into natural, professional ${LANG_NAMES[LANG]}.
  - SENTENCE CASE, never Title Case. The English is Title Case because English
    headings are; Spanish and Portuguese headings are not, and preserving the
    pattern makes a heading read as a brand name.
  - Keep these in English, untranslated: Scrum, Sprint, Product Owner, Scrum Master,
    Developers, Scrum Team, Increment, Product Goal, Sprint Goal, Product Backlog,
    Sprint Backlog, Definition of Done, Daily Scrum, Scrum Guide, Certidemy.
  - AI is IA in both languages.
  - A module title is a HEADING. Keep it short - do not expand it into a sentence.

${CONTRACT.vocabulary}

Return the JSON array now, and nothing else.`;

const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    temperature: 0.2,
    system,
    messages: [{
      role: "user",
      content: `Translate these ${todo.length} module headings.\n\n` +
        JSON.stringify(todo.map((m) => ({ title: m.title, description: m.description ?? "" })), null, 2),
    }],
  }),
});
if (!res.ok) { console.error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 400)}`); process.exit(1); }
const payload = await res.json();
let text = (payload.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
if (!text.startsWith("[")) {
  const a = text.indexOf("["), b = text.lastIndexOf("]");
  if (a !== -1 && b > a) text = text.slice(a, b + 1);
}
let out;
try { out = JSON.parse(text); } catch (e) { console.error(`malformed JSON: ${e.message}`); process.exit(1); }

// VALIDATE BEFORE WRITING, so ABORT means nothing was written.
let bad = 0;
if (!Array.isArray(out) || out.length !== todo.length) {
  console.error(`ABORT: expected ${todo.length} objects, got ${Array.isArray(out) ? out.length : typeof out}`);
  process.exit(1);
}
const RETIRED = {
  "es-419": /\b(autoorganiz\w*|ceremonias?|equipo de desarrollo)\b/i,
  "pt-BR": /\b(auto-?organiz\w*|cerim[oô]nias?|(time|equipe) de desenvolvimento)\b/i,
}[LANG];
for (let i = 0; i < out.length; i++) {
  const t = out[i]?.title, d = out[i]?.description;
  const label = todo[i].slug;
  if (typeof t !== "string" || !t.trim()) { console.error(`ABORT ${label}: empty title`); bad++; continue; }
  if (typeof d !== "string") { console.error(`ABORT ${label}: description is not a string`); bad++; continue; }
  if (RETIRED.test(`${t} ${d}`)) { console.error(`ABORT ${label}: retired vocabulary in the output`); bad++; }
  if (t === todo[i].title) { console.error(`ABORT ${label}: title came back unchanged`); bad++; }
  if (t.length > 90) { console.error(`ABORT ${label}: title is ${t.length} chars - a heading, not a sentence`); bad++; }
}
if (bad) { console.error(`\n${bad} problem(s). NOTHING WRITTEN.`); process.exit(1); }

for (let i = 0; i < todo.length; i++) {
  console.log(`  ${todo[i].slug}`);
  console.log(`    EN  ${todo[i].title}`);
  console.log(`    ${LANG.padEnd(3)} ${out[i].title}`);
  console.log(`        ${out[i].description}`);
}

if (!APPLY) {
  console.log(`\n[dry] ${todo.length} row(s) prepared. Re-run with --apply to write.`);
  process.exit(0);
}

let wrote = 0;
for (let i = 0; i < todo.length; i++) {
  const { error, count } = await db.from("module_translations").insert({
    module_id: todo[i].id,
    language: LANG,
    title: out[i].title,
    description: out[i].description || null,
    // AI-drafted, unread. That is what the flag is for.
    is_provisional: true,
  }, { count: "exact" });
  if (error) { console.error(`  write failed ${todo[i].slug}: ${error.message}`); process.exit(1); }
  if (count !== 1) { console.error(`  ${todo[i].slug}: inserted ${count} rows, expected 1`); process.exit(1); }
  wrote++;
}
console.log(`\n  wrote ${wrote} row(s), all is_provisional = true - nobody has read them`);
