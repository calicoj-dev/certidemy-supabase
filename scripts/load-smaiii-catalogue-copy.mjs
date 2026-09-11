#!/usr/bin/env node
/**
 * load-smaiii-catalogue-copy.mjs - SM-AI-II's catalogue claim and description,
 * English approved by hand and the two translations produced under the shared contract.
 *
 * --apply TO WRITE. Dry by default. Unknown flags exit 2.
 *
 * WHY A SCRIPT AND NOT SQL. The Spanish and Portuguese carry accents, and CLAUDE.md is
 * explicit: the SQL editor corrupts multibyte characters on paste, so accented text goes
 * through an API-based loader. This is that loader.
 *
 * WHY NOT gen-jta-translations OR A FRESH PROMPT. That script has its own translation
 * prompt and does not read lib/item-translation.mjs. Its SM-AI-II output came back free
 * of retired vocabulary, but by luck rather than by construction - nothing in it forbids
 * "autoorganizado" or "equipo de desarrollo". This script uses translateSystem() from the
 * shared contract and then CHECKS THE OUTPUT against RETIRED_HARD before writing, so a
 * clean result is evidence rather than a coincidence.
 *
 * TWO FIELDS, TWO JOBS, AND THE CARD SHOWS THE CLAIM.
 * certifications/page.tsx:150 renders `claim ?? description` on the catalogue card, and
 * [code]/page.tsx:263 renders the description on the detail page inside a single <p>.
 * So the claim is the scannable line and the description is body copy - and the
 * description's paragraph breaks DO NOT SURVIVE, because that <p> has no
 * whitespace-pre-line. It is written as one flowing paragraph for that reason.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { translateSystem, RETIRED_HARD } from "./lib/item-translation.mjs";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (!KNOWN.has(a)) { console.error(`Unrecognised flag: ${a}. --apply to write; dry by default.`); process.exit(2); }
}
const APPLY = process.argv.includes("--apply");

for (const p of ["scripts/.env", ".env"]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const CERT_ID = "a7f3c9d2-6b14-4e85-9c07-2d5f8a1b3e46";
const KEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) { console.error("Set ANTHROPIC_API_KEY."); process.exit(2); }
const db = createClient(process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

// ---------------------------------------------------------------------------
// THE APPROVED ENGLISH. Signed off 2026-09-11.
// ---------------------------------------------------------------------------
const CLAIM_EN =
  "Validates that the holder exercises Scrum Master judgment where the 2020 Scrum Guide " +
  "is deliberately silent, including where models and agents are part of how the work gets done.";

const DESCRIPTION_EN =
  "The decisions the 2020 Scrum Guide does not make for you. Level II certification in " +
  "Scrum Master judgment: 50 items, 150 minutes, 75% to pass, in English, Latin American " +
  "Spanish and Brazilian Portuguese. Where Level I asks what Scrum determines, this asks " +
  "what you do where it determines nothing — 31 of its 44 tasks have a best answer the " +
  "Guide's own text does not settle, and the scheme publishes that count rather than " +
  "asserting a difficulty gap. Every item presents four options a competent practitioner " +
  "could defend, with one better for a reason statable in a sentence, and the blueprint is " +
  "published before you pay: five domains, 44 tasks, the cognitive profile, the pass mark " +
  "and its reasoning, and the eight failure modes the borderline candidate is defined by. " +
  "One domain, 22.5% of the exam, is where a model in the work system changes the best " +
  "answer. Generated work against the Definition of Done, accountability for code a " +
  "Developer did not write, a Retrospective whose inputs were summarised by a tool. Four of " +
  "its nine tasks would have the same answer without the model — they earn their place " +
  "because generation makes those situations common, not because it changes the judgment. " +
  "The scheme says so, and so does this page.";

const LANGS = [["es-419", "Latin American Spanish"], ["pt-BR", "Brazilian Portuguese"]];

async function claude(system, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 3000, temperature: 0.2, system,
      messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  let t = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (!t.startsWith("[")) { const a = t.indexOf("["), b = t.lastIndexOf("]"); if (a !== -1 && b > a) t = t.slice(a, b + 1); }
  return JSON.parse(t);
}

const out = [{ lang: "en", claim: CLAIM_EN, description: DESCRIPTION_EN }];

for (const [lang, name] of LANGS) {
  // The contract is built for exam items, whose shape is {question_text, options,
  // explanation}. Marketing copy has no options, so the two fields ride in the slots
  // that carry prose: the claim as question_text, the description as explanation. The
  // VOCABULARY half of the contract - which is the reason for using it - applies either
  // way, and an empty options array keeps the graft rules from firing on nothing.
  const payload = [{ question_text: CLAIM_EN, options: [], explanation: DESCRIPTION_EN }];
  const res = await claude(translateSystem(name, "practice"),
    `Translate this 1 entry. It is CATALOGUE MARKETING COPY for a certification, not an
exam question: "question_text" is a one-sentence claim and "explanation" is the
long-form description. Preserve the em dashes and the percentages exactly.

${JSON.stringify(payload, null, 2)}

Return the JSON array now.`);
  const r = Array.isArray(res) ? res[0] : null;
  if (!r || typeof r.question_text !== "string" || typeof r.explanation !== "string") {
    console.error(`ABORT ${lang}: malformed translation`); process.exit(1);
  }
  out.push({ lang, claim: r.question_text.trim(), description: r.explanation.trim() });
}

// --- CHECK BEFORE WRITING. This is the whole reason for the shared contract. ---
let bad = 0;
for (const row of out) {
  const re = RETIRED_HARD[row.lang];
  if (re && re.test(`${row.claim} ${row.description}`)) {
    console.error(`ABORT ${row.lang}: retired vocabulary in the output`); bad++;
  }
  for (const [f, v] of [["claim", row.claim], ["description", row.description]]) {
    if (!v || v.length < 40) { console.error(`ABORT ${row.lang} ${f}: too short (${v?.length ?? 0})`); bad++; }
  }
  if (!/50/.test(row.description) || !/150/.test(row.description) || !/75/.test(row.description)) {
    console.error(`ABORT ${row.lang}: the exam facts did not survive translation`); bad++;
  }
  if (!/22[.,]5/.test(row.description)) { console.error(`ABORT ${row.lang}: D5's weight did not survive`); bad++; }
  if (!/31/.test(row.description) || !/44/.test(row.description)) { console.error(`ABORT ${row.lang}: the 31-of-44 count did not survive`); bad++; }
}
if (bad) { console.error("\nNOTHING WRITTEN"); process.exit(1); }

for (const row of out) {
  console.log(`\n--- ${row.lang} ---  claim ${row.claim.length} chars, description ${row.description.length} chars`);
  console.log(`  CLAIM: ${row.claim}`);
  console.log(`  DESC : ${row.description.slice(0, 200)}...`);
}

if (APPLY) {
  for (const row of out) {
    const { error } = await db.from("certification_i18n")
      .upsert({ certification_id: CERT_ID, lang: row.lang, claim: row.claim, description: row.description },
              { onConflict: "certification_id,lang" });
    if (error) { console.error(`write failed ${row.lang}: ${error.message}`); process.exit(1); }
    console.log(`  written ${row.lang}`);
  }
  console.log("\nAPPLIED 3 languages");
} else {
  console.log("\n[dry] Re-run with --apply to write.");
}
