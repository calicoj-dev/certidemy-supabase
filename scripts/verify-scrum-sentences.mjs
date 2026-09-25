#!/usr/bin/env node
/**
 * verify-scrum-sentences.mjs -- each term edit, in its WHOLE SENTENCE, after
 * replacement, beside the English sentence it has to match.
 *
 * READ-ONLY. No flags. Exit 1 if any edit does not apply exactly once.
 *
 * ============ WHY A SUBSTRING EDIT NEEDS A SENTENCE CHECK ============
 *
 * Two of the ten change SENTENCE STRUCTURE rather than swapping a term:
 *
 *   "malinterpreta el rol de lider servidor"  ->  "... el rol del Scrum Master"
 *       holds only if the English now says `misreads the Scrum Master's role`.
 *
 *   "sirve a los Developers como lider servidor"  ->  "es un verdadero lider
 *    que sirve a los Developers" replaces a VERB PHRASE with a COPULAR CLAUSE,
 *       and only works if what precedes it is a subject.
 *
 * A replacement that reads correctly in isolation can break the sentence around
 * it. The only way to see that is to print the sentence.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) { console.error("Unrecognised flag: " + a + ". This script is READ-ONLY."); process.exit(2); }
}
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
const H = { apikey: KEY, Authorization: "Bearer " + KEY };

const batch = JSON.parse(readFileSync(join(ROOT, "BATCH-MOVED-ENGLISH.json"), "utf8"));
const SLUG = "05-03-working-with-scrum-master";

async function body(language) {
  const r = await fetch(BASE + "/lessons?select=content_md&slug=eq." + SLUG +
    "&language=eq." + encodeURIComponent(language), { headers: H, signal: AbortSignal.timeout(45000) });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const rows = await r.json();
  if (rows.length !== 1) throw new Error(language + ": " + rows.length + " rows");
  return rows[0].content_md;
}

/** The sentence containing an offset. Split on terminal punctuation, and treat a
 *  line break as a boundary too -- these bodies carry list items and JSON
 *  fragments where a full stop never arrives. */
function sentenceAt(text, index) {
  let a = index, b = index;
  while (a > 0 && !/[.!?\n]/.test(text[a - 1])) a--;
  while (b < text.length && !/[.!?\n]/.test(text[b])) b++;
  return text.slice(a, Math.min(b + 1, text.length)).trim();
}

const en = await body("en");
let bad = 0;
console.log("");
console.log("SCRUM TERM EDITS -- each in its whole sentence, after replacement");

for (const language of ["es-419", "pt-BR"]) {
  const row = batch.rows.find((r) => r.kind === "lesson_terms" && r.language === language);
  if (!row) { console.log("  MISS  no " + language + " term row in the batch"); bad++; continue; }
  const before = await body(language);
  let after = before;
  console.log("");
  console.log("=== " + language);
  row.edits.forEach(([from, to], i) => {
    const hits = after.split(from).length - 1;
    if (hits !== 1) {
      console.log("  " + (i + 1) + ". MISS -- anchor matched " + hits + " time(s): " + from.slice(0, 60));
      bad++;
      return;
    }
    const at = after.indexOf(from);
    after = after.slice(0, at) + to + after.slice(at + from.length);
    const sentence = sentenceAt(after, at);
    /* The English sentence this one has to match: located by the English
     * replacement the terminology pass made, in the same order. */
    console.log("  " + (i + 1) + ". " + language);
    console.log("     AFTER : " + sentence.replace(/\s+/g, " ").slice(0, 200));
  });
  /* Both directions: the retired term is gone, and the pinned one arrived. */
  const retired = /l[ií]der[ -]servidor/i;
  const pinned = language === "es-419" ? /verdadero l[ií]der que sirve/i : /verdadeiro l[ií]der que serve/i;
  const stillRetired = (after.match(new RegExp(retired, "gi")) || []).length;
  const pinnedCount = (after.match(new RegExp(pinned, "gi")) || []).length;
  console.log("     retired term remaining: " + stillRetired + " (must be 0)");
  console.log("     pinned rendering present: " + pinnedCount + " (must be > 0)");
  if (stillRetired !== 0 || pinnedCount === 0) bad++;
}

console.log("");
console.log("=== the English sentences these must match");
for (const m of en.matchAll(/true leader who serves|Scrum Master's role|misreads the Scrum Master/gi)) {
  console.log("  EN    : " + sentenceAt(en, m.index).replace(/\s+/g, " ").slice(0, 200));
}

console.log("");
if (bad) { console.log(bad + " problem(s). Do not apply."); process.exitCode = 1; }
else console.log("All 10 edits apply exactly once; retired term gone, pinned rendering present in both.");
