#!/usr/bin/env node
/**
 * retranslate-review-rejection.mjs - re-translate a task statement or domain title that a
 * human reviewer rejected, from the English, under the shared contract.
 *
 * --apply TO WRITE. Dry by default. Unknown flags exit 2.
 *
 *   CERT_ID=... node scripts/retranslate-review-rejection.mjs --task 5.7 --lang es-419 [--apply]
 *   CERT_ID=... node scripts/retranslate-review-rejection.mjs --domain D2 --lang pt-BR [--apply]
 *
 * THE COMPANION TO apply-translation-review.mjs. That script clears is_provisional for the
 * rows a reviewer approved and leaves the rejected ones alone; this one is what happens to
 * a rejected row next. It exists as a separate script from
 * retranslate-retired-vocabulary.mjs because that one operates on QUIZ ITEMS and selects
 * by pattern, and these are task_translations and domain_translations selected by a
 * human's judgement.
 *
 * SELECTION IS A PERSON'S, NOT A REGEX'S, AND THAT IS THE POINT. The first rejection this
 * handled was SM-AI-II 5.7 es-419, whose Spanish rendered "throughput" as "rendimiento" -
 * a correct, natural word that reads as PERFORMANCE, which is the other half of the very
 * pair the task exists to separate. No pattern catches that. A bilingual reader did.
 *
 * IT ALWAYS LEAVES THE ROW PROVISIONAL. A re-translation has not been reviewed, and the
 * whole point of is_provisional is that a human compared it to the English. Clearing it
 * here would make the flag mean "a script is confident", which is the failure the flag
 * exists to prevent. The row goes back into the next review document.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { translateSystem, RETIRED_HARD } from "./lib/item-translation.mjs";

const KNOWN = new Set(["--apply", "--task", "--domain", "--lang"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error(`Unrecognised flag: ${a}. --apply to write; dry by default.`); process.exit(2); }
}
const APPLY = process.argv.includes("--apply");
const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : null; };
const TASK = arg("task"), DOMAIN = arg("domain"), LANG = arg("lang");
if ((!TASK && !DOMAIN) || (TASK && DOMAIN)) { console.error("Pass exactly one of --task <code> or --domain <code>."); process.exit(2); }
if (!LANG) { console.error("Pass --lang es-419 | pt-BR."); process.exit(2); }

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
const db = createClient(process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const LANG_NAME = { "es-419": "Latin American Spanish", "pt-BR": "Brazilian Portuguese" };
if (!LANG_NAME[LANG]) { console.error(`Unknown language: ${LANG}`); process.exit(2); }

async function claude(system, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1500, temperature: 0.2, system,
      messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  let t = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (!t.startsWith("[")) { const a = t.indexOf("["), b = t.lastIndexOf("]"); if (a !== -1 && b > a) t = t.slice(a, b + 1); }
  return JSON.parse(t);
}

// --- resolve the source ------------------------------------------------------
let english, srcId, table, col, label, context = "";
if (TASK) {
  const { data } = await db.from("tasks").select("id, statement, skills").eq("certification_id", CERT_ID).eq("code", TASK);
  if (!data || data.length !== 1) { console.error(`ABORT: task ${TASK} resolves to ${data?.length ?? 0} rows`); process.exit(1); }
  english = data[0].statement; srcId = data[0].id; table = "task_translations"; col = "task_id"; label = `task ${TASK}`;
  if (data[0].skills) context = `\nThe competence this statement names, for disambiguation only - do NOT translate this line: ${data[0].skills}`;
} else {
  const { data } = await db.from("domains").select("id, title").eq("certification_id", CERT_ID).eq("code", DOMAIN);
  if (!data || data.length !== 1) { console.error(`ABORT: domain ${DOMAIN} resolves to ${data?.length ?? 0} rows`); process.exit(1); }
  english = data[0].title; srcId = data[0].id; table = "domain_translations"; col = "domain_id"; label = `domain ${DOMAIN}`;
}

const { data: before } = await db.from(table).select(TASK ? "statement" : "title", { head: false }).eq(col, srcId).eq("language", LANG);
if (!before || before.length !== 1) { console.error(`ABORT: ${label} ${LANG} has ${before?.length ?? 0} translation rows, expected 1`); process.exit(1); }
const prev = TASK ? before[0].statement : before[0].title;

// --- translate ---------------------------------------------------------------
const field = TASK ? "statement" : "title";
const out = await claude(translateSystem(LANG_NAME[LANG], "secure"),
  `Translate this 1 entry into ${LANG_NAME[LANG]}. It is a certification BLUEPRINT line that
a candidate reads before paying, not an exam question. Return a JSON array of one object
with the single key "${field}".${context}

${JSON.stringify([{ [field]: english }], null, 2)}

Return the JSON array now.`);
const r = Array.isArray(out) ? out[0] : null;
const next = r && typeof r[field] === "string" ? r[field].trim() : null;
if (!next) { console.error("ABORT: malformed translation"); process.exit(1); }

// --- check before writing ----------------------------------------------------
let bad = 0;
const re = RETIRED_HARD[LANG];
if (re && re.test(next)) { console.error(`ABORT: retired vocabulary in the output`); bad++; }
if (next === prev) { console.error(`ABORT: the re-translation is identical to the one that was rejected`); bad++; }
if (next.length < 15) { console.error(`ABORT: too short (${next.length})`); bad++; }
if (bad) { console.error("NOTHING WRITTEN"); process.exit(1); }

console.log(`${label} · ${LANG}`);
console.log(`  EN        ${english}`);
console.log(`  REJECTED  ${prev}`);
console.log(`  NEW       ${next}`);

if (APPLY) {
  // is_provisional stays TRUE. A re-translation has not been reviewed.
  const patch = { [field]: next, is_provisional: true };
  const { error, count } = await db.from(table).update(patch, { count: "exact" }).eq(col, srcId).eq("language", LANG);
  if (error) { console.error(`write failed: ${error.message}`); process.exit(1); }
  if (count !== 1) { console.error(`updated ${count} rows, expected 1`); process.exit(1); }
  console.log(`\n  written, and left PROVISIONAL - it needs re-reading before it is approved.`);
} else {
  console.log(`\n[dry] Re-run with --apply to write. It will stay provisional either way.`);
}
