#!/usr/bin/env node
/**
 * retranslate-module-rejection.mjs - re-translate a module title or description that a
 * human reviewer rejected, from the English, under the shared contract.
 *
 * --apply TO WRITE. Dry by default. Unknown flags exit 2.
 *
 *   node scripts/retranslate-module-rejection.mjs --cert SM-AI-I --module scrum-roles \
 *        --field title --lang es-419 [--apply]
 *
 * WHY THIS EXISTS RATHER THAN A FLAG ON gen-module-translations
 * -------------------------------------------------------------
 * gen-module-translations.mjs is INSERT-ONLY by design: it fills certifications that have
 * no module_translations at all, and skips every module that already has a row. That is
 * the right behaviour for a backfill and useless for a repair, because the row a reviewer
 * rejected already exists. Adding an --overwrite flag there would give one script two
 * jobs - fill the gaps, and replace a specific human-rejected row - and the second wants
 * arguments the first has no use for.
 *
 * This is the same gap retranslate-review-rejection.mjs filled for task statements and
 * domain titles, on the table 295 forgot and 302 caught up.
 *
 * SELECTION IS A PERSON'S, NOT A REGEX'S. The three rejections this was built for:
 *
 *   SM-AI-I  scrum-roles/title        "Scrum Roles" is 2017 vocabulary, and the module's
 *                                     own description already names the three
 *                                     accountabilities correctly - the heading contradicted
 *                                     the text beneath it. THE ENGLISH WAS FIXED FIRST.
 *   SM-AI-II smii-boundaries/description  pt-BR used "papel" for an accountability where
 *                                     the English says "taking their jobs" and es-419's
 *                                     "funcoes" tracked it correctly.
 *   AIGRM-I  ai-lifecycle-accountable-deployment/title  accountable collapsed to
 *                                     responsable / responsavel in BOTH languages, on the
 *                                     certification whose subject is that distinction.
 *
 * No pattern catches any of those. A bilingual reader did.
 *
 * IT LEAVES THE ROW UNREVIEWED, AND THAT IS DELIBERATE
 * -----------------------------------------------------
 * Same rule as retranslate-review-rejection.mjs: "a re-translation has not been reviewed,
 * and the whole point of the flag is that a human compared it to the English. Clearing it
 * here would make the flag mean a script is confident."
 *
 * So a repaired row goes to review_status='unreviewed', is_provisional=true - NOT
 * 'approved'. It is not 'rejected' either: rejected asserts a human read this text and
 * found it wrong, and nobody has read this text. It goes back into the next review
 * document, where a reader who agrees marks it [r].
 *
 * THE OTHER FIELD ON THE ROW IS NOT TOUCHED. review_status is stored per row -
 * (module_id, language) - and covers title AND description, but a rejection is usually
 * about one of them. This writes only the field named by --field and leaves the other
 * exactly as it was.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { domainForCert, contractForDomain } from "./lib/item-translation.mjs";

const KNOWN = new Set(["--apply", "--cert", "--module", "--field", "--lang"]);
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error(`Unrecognised flag: ${a}`);
    console.error("This script opts into WRITING with --apply and is DRY by default.");
    console.error("Other scripts in this repo opt into SAFETY with --dry and are LIVE without it.");
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");
const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : null; };
const CERT = arg("cert"), MODULE = arg("module"), FIELD = arg("field"), LANG = arg("lang");
if (!CERT || !MODULE || !FIELD || !LANG) {
  console.error("Required: --cert <CODE> --module <slug> --field title|description --lang es-419|pt-BR");
  process.exit(2);
}
if (!["title", "description"].includes(FIELD)) { console.error("--field must be title or description"); process.exit(2); }
if (!["es-419", "pt-BR"].includes(LANG)) { console.error("--lang must be es-419 or pt-BR"); process.exit(2); }

for (const p of ["scripts/.env", ".env"]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const db = createClient(process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const LANG_NAMES = { "es-419": "Latin American Spanish", "pt-BR": "Brazilian Portuguese" };

const { data: cert, error: cErr } = await db.from("certifications").select("id, code").eq("code", CERT).single();
if (cErr || !cert) { console.error(`no certification ${CERT}`); process.exit(1); }
const { data: mod, error: mErr } = await db.from("modules")
  .select("id, slug, title, description").eq("certification_id", cert.id).eq("slug", MODULE).single();
if (mErr || !mod) { console.error(`no module ${CERT}/${MODULE}`); process.exit(1); }
const { data: row, error: rErr } = await db.from("module_translations")
  .select("module_id, language, title, description, review_status, is_provisional")
  .eq("module_id", mod.id).eq("language", LANG).single();
if (rErr || !row) { console.error(`no ${LANG} translation row for ${CERT}/${MODULE}`); process.exit(1); }

const english = mod[FIELD];
if (!english) { console.error(`the English ${FIELD} is empty`); process.exit(1); }

const DOMAIN = domainForCert(cert.code);
const CONTRACT = contractForDomain(DOMAIN);
const system = `You translate ${CONTRACT.subject} MODULE headings from English into ${LANG_NAMES[LANG]}.

Return ONLY the translated text. No commentary, no quotes around it, no code fences.

This is a REPAIR. A bilingual reviewer rejected the previous translation of this exact
string. Do not reproduce it - read the English again and render what it says.

CAPITALISATION: Spanish and Portuguese headings take SENTENCE CASE, not English title
case. Capitalise the first word and proper nouns only. "El ciclo de vida de la IA",
never "El Ciclo de Vida de la IA". The rest of this catalogue does this and a repaired
heading that arrives in title case is visibly the odd one out. Added after the first
repair came back title-cased.

${CONTRACT.vocabulary}

The contract above quotes Spanish and Portuguese side by side, at length, and on
its first pt-BR run this script got fluent SPANISH back - a correct translation of
the right English into the wrong language, which every other post-condition passed
because it was fluent, correct and not identical to the rejected text. So the
instruction below is genuinely the last thing in this prompt, with nothing after
it. DO NOT APPEND TO IT - an explanation placed after the instruction puts the
explanation nearest the generation, which is the mistake this note exists about
and which was made once while writing it.

OUTPUT LANGUAGE: ${LANG_NAMES[LANG]} (${LANG}). NOTHING ELSE.`;

console.log(`${CERT}/${MODULE} ${FIELD} ${LANG}   contract: ${DOMAIN}`);
console.log(`  EN        ${english}`);
console.log(`  rejected  ${row[FIELD]}`);

const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    temperature: 0.2,
    system,
    messages: [{ role: "user", content: english }],
  }),
});
if (!res.ok) { console.error(`model call failed: ${res.status} ${await res.text()}`); process.exit(1); }
const out = (await res.json()).content?.[0]?.text?.trim();
if (!out) { console.error("empty response"); process.exit(1); }
console.log(`  repaired  ${out}`);

// POST-CONDITIONS, BOTH DIRECTIONS.
let bad = 0;
if (out === row[FIELD]) { console.error("  ABORT: identical to the rejected text"); bad++; }
if (out === english && FIELD === "title" && !/^[A-Z0-9 &-]+$/.test(english)) {
  console.error("  ABORT: returned the English unchanged"); bad++;
}
if (/^["'`]|["'`]$/.test(out)) { console.error("  ABORT: wrapped in quotes"); bad++; }
if (out.includes("\n")) { console.error("  ABORT: multi-line output for a heading"); bad++; }

// WRONG-LANGUAGE OUTPUT. Added after this script wrote SPANISH into a pt-BR row
// on its third use - "Servir al Product Owner y a la organizacion sin asumir sus
// trabajos" - and every other post-condition passed it, because it was a fluent,
// correct, non-identical translation of the right English. Of the wrong language.
//
// The markers are high-confidence function words and orthography, not vocabulary:
// a Portuguese sentence does not contain " y " or "-cion", and a Spanish one does
// not contain "-cao" or "nao".
const WRONG_LANG = {
  "pt-BR": [/\bci[oó]n(es)?\b|ci[oó]n\s|\by\b|\bal\b|\bla\b|\blos\b|\bsus\b|\bun\b|\bel\b|\buna\b/i, "reads as Spanish"],
  "es-419": [/[cç][aã]o(es|ões)?\b|\bn[aã]o\b|\bdos?\b|\bda\b|\bpelo\b|\bum\b|\buma\b|\bcom\b/i, "reads as Portuguese"],
};
const [wrongRe, wrongWhy] = WRONG_LANG[LANG];
if (wrongRe.test(out)) {
  console.error(`  ABORT: the output ${wrongWhy}, but --lang is ${LANG}`);
  bad++;
}
if (bad) { console.error("NOTHING WRITTEN"); process.exit(1); }

if (!APPLY) { console.log("\n[dry] re-run with --apply"); process.exit(0); }

// Only the named field. review_status goes to 'unreviewed', never 'approved':
// nobody has read this text yet.
const { error: wErr } = await db.from("module_translations")
  .update({ [FIELD]: out, review_status: "unreviewed", is_provisional: true })
  .eq("module_id", mod.id).eq("language", LANG);
if (wErr) { console.error(`write failed: ${wErr.message}`); process.exit(1); }

const { data: after } = await db.from("module_translations")
  .select("title, description, review_status, is_provisional")
  .eq("module_id", mod.id).eq("language", LANG).single();
if (after[FIELD] !== out) { console.error("ABORT: the row does not read back as written"); process.exit(1); }
if (after.review_status !== "unreviewed" || after.is_provisional !== true) {
  console.error(`ABORT: row is ${after.review_status}/${after.is_provisional}, expected unreviewed/true`);
  process.exit(1);
}
const other = FIELD === "title" ? "description" : "title";
if (after[other] !== row[other]) { console.error(`ABORT: the ${other} changed and must not have`); process.exit(1); }
console.log(`  written. review_status=unreviewed - it goes back into the next review document.`);
