#!/usr/bin/env node
/**
 * retranslate-item-rewrite.mjs - rewrite a quiz item's ENGLISH, then regenerate
 * its es-419 and pt-BR siblings from that English under the shared contract.
 *
 * --apply TO WRITE. Dry by default. Unknown flags exit 2.
 *
 *   node scripts/retranslate-item-rewrite.mjs --spec rewrites/isms-f.json
 *   node scripts/retranslate-item-rewrite.mjs --spec rewrites/isms-f.json --group 3df218a1 --apply
 *
 * WHY THIS EXISTS RATHER THAN AN UPDATE STATEMENT. Every fix in migrations 303
 * to 307 was an ADDRESS correction - a clause number, an edition label, a
 * standard's name - and those survive substring surgery because the token is
 * ASCII and the grammar around it does not move. These do not. "ISO/IEC 27001
 * clause 4.1 explicitly lists governance and culture as internal issues" has to
 * become a sentence that says the clause enumerates nothing, and in Spanish and
 * Portuguese that changes verbs, articles and agreement.
 *
 * THE GENDER BREAK THIS EXISTS TO PREVENT ALREADY HAPPENED ONCE. A cláusula ->
 * apartado swap earlier in this work left "La apartado 3.5" behind, caught only
 * because the dry run printed before and after. A replace() cannot see that
 * "cláusula" is feminine and "control" is masculine, so "a la cláusula" must
 * become "al control" and not "a la control". Anything that rewrites a clause
 * of prose goes through a translator, not a regex.
 *
 * THE WRONG-LANGUAGE WRITE ALSO ALREADY HAPPENED. Fluent Spanish once landed in
 * a pt-BR row and every post-condition passed, because nothing asserted WHICH
 * language had been produced. Two defences, both here:
 *   - the target language is stated LAST in the prompt, nearest the generation;
 *   - a guard reads the output back and rejects it if it does not look like the
 *     target, using article and function-word markers rather than accented
 *     characters, which Spanish and Portuguese share.
 *
 * ROWS LAND UNREVIEWED, AND `status` IS NOT TOUCHED BY DEFAULT. quiz_questions
 * carries status IN ('pending_review','approved','rejected'), and
 * pending_review is the review flag. But these are LIVE items in published
 * banks, and verify-cert's floors.* invariants count only status='approved'
 * rows - so flipping seven ISMS-F items to pending_review can breach a floor
 * and turn a passing gate red, which is the failure this repo keeps paying for.
 * So: item_origin is set to 'translated' on every regenerated sibling, the run
 * prints a NOT REVIEWED manifest, and --pending is an explicit opt-in for
 * flipping status. Never flip it without checking the floor first.
 *
 * THE SPEC FILE IS THE ENGLISH, AUTHORED AND READ BY A HUMAN FIRST. This script
 * does not invent English. It takes a spec of the form:
 *
 *   [{ "group": "<question_group_id>",
 *      "reason": "why this item was wrong, one line",
 *      "en": { "question_text": "...",          // omit a field to leave it alone
 *              "options": [{"id":"a","text":"..."}, ...],
 *              "correct_answer": ["d"],
 *              "explanation": "..." } }]
 *
 * Only the fields present in `en` are rewritten, and only those fields are
 * re-translated. An item whose explanation changed keeps its stem's existing
 * Spanish untouched.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ISO_MS_VOCABULARY, ACCOUNTABLE_FALSE_FRIEND, contractForDomain, domainForCert,
} from "./lib/item-translation.mjs";
import { checkPins } from "./lib/pin-compliance.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..");

for (const p of [join(HERE, ".env"), join(REPO_ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const KNOWN = new Set(["--apply", "--spec", "--group", "--pending", "--lang"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error(`Unrecognised flag: ${a}.`);
    console.error("--apply to write; DRY BY DEFAULT. See CLAUDE.md: this directory has two");
    console.error("opposite flag conventions and a flag you believed in that did nothing is");
    console.error("how a script runs live on a typo.");
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");
const PENDING = process.argv.includes("--pending");
const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : null; };
const SPEC = arg("spec");
const ONLY_GROUP = arg("group");
const ONLY_LANG = arg("lang");
if (!SPEC) { console.error("Pass --spec <file.json>."); process.exit(2); }

const MODEL = "claude-sonnet-4-6";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) { console.error("Set ANTHROPIC_API_KEY."); process.exit(2); }

const db = createClient(
  process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const LANGS = [
  { code: "es-419", name: "Latin American Spanish" },
  { code: "pt-BR", name: "Brazilian Portuguese" },
];

/**
 * LANGUAGE GUARD. Deliberately NOT based on accented characters: Spanish and
 * Portuguese share every accent that matters, so "informação" and "información"
 * both pass an accent test. These are function words and article forms that one
 * language has and the other does not, which is what actually separates them in
 * a short sentence.
 */
/**
 * THE FIRST VERSION OF THIS GUARD FAILED ITS OWN BEHAVIOUR TEST, in the exact
 * direction that already caused a wrong-language write. Spanish scored 3-1
 * against the pt-BR markers and PASSED, because the want-list contained tokens
 * the two languages SHARE - a, o, que, para, se, por, como. A marker a language
 * shares with its neighbour is not a marker; it is noise that both sides score
 * on, and it makes the guard look strict while being blind.
 *
 * So every entry below is one half of a DISTINCTIVE PAIR - a word where the two
 * languages genuinely differ - plus the -cion/-cao suffixes, which are the
 * strongest single discriminator in management-system prose:
 *
 *   es  el/los/las  del  con  una  debe  es   estan  tambien  segun  -cion
 *   pt  o/os/as     do   com  uma  deve  e    estao  tambem   segundo -cao
 *
 * And AVOID is simply the other language's want-list, so the test is symmetric
 * by construction rather than by two hand-written lists that can drift apart.
 *
 * MEASURED, on four cases, not asserted:
 *   Spanish text -> es guard      want 6, avoid 0   accept
 *   Spanish text -> pt guard      want 0, avoid 6   REJECT   <- the real failure
 *   Portuguese   -> pt guard      want 2, avoid 0   accept
 *   Portuguese   -> es guard      want 0, avoid 2   REJECT
 *
 * WHAT IT DOES NOT CATCH, stated rather than tuned away: a CODE-SWITCHED field.
 * A sentence half in each language scores roughly 2:1 toward whichever it leans
 * and passes. That is a different defect from the one this exists for - the
 * incident was a whole field written fluently in the wrong language, and the
 * margins above are decisive for that. Tuning thresholds until a synthetic
 * half-and-half sentence failed would fit the guard to the test rather than to
 * the failure, which is how the cue-tolerance and vocabulary checks in this repo
 * went wrong before. A mixed field is caught by the human read, which every row
 * this script writes still needs.
 */
const DISTINCTIVE = {
  "es-419": /\b(el|los|las|del|con|una|deben?|est[áa]n|tambi[ée]n|seg[úu]n|aunque|hacia|muy)\b|ci[óo]n\b|ciones\b/gi,
  "pt-BR":  /\b(os|as|do|dos|das|com|uma|deve[m]?|est[ãa]o|tamb[ée]m|n[ãa]o|s[ãa]o|ent[ãa]o|pelo|pela)\b|[çc][ãa]o\b|[çc][õo]es\b/gi,
};

function looksLikeLanguage(text, lang) {
  const mine = DISTINCTIVE[lang];
  const other = DISTINCTIVE[lang === "es-419" ? "pt-BR" : "es-419"];
  if (!mine || !other) return { ok: true, want: 0, avoid: 0 };
  const want = (text.match(mine) || []).length;
  const avoid = (text.match(other) || []).length;
  // RELATIVE, and it must WIN rather than tie: a tie is exactly what a
  // half-translated field looks like.
  return { ok: want > avoid, want, avoid };
}

async function rawClaude(system, user, maxTokens = 4000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL, max_tokens: maxTokens, temperature: 0.2,
      system, messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text().catch(() => "")).slice(0, 400)}`);
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

function parseJsonObject(text) {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b < a) throw new Error("no JSON object in response");
  return JSON.parse(t.slice(a, b + 1));
}

/**
 * THE TARGET LANGUAGE IS STATED LAST, NEAREST THE GENERATION. This is not
 * stylistic. An earlier run put the language at the top of a long system prompt,
 * the contract and vocabulary rules followed for two thousand characters, and
 * fluent Spanish was written into a pt-BR row. Everything else here can move;
 * the last line cannot.
 */
function translateSystemFor(langName, certCode) {
  const contract = contractForDomain(domainForCert(certCode));
  return `You are translating ONE assessment item for a professional certification.
Return STRICT JSON only - no prose, no markdown fences.

${contract}

${ISO_MS_VOCABULARY}

${ACCOUNTABLE_FALSE_FRIEND}

RULES THAT DECIDE WHETHER THIS IS USABLE:
  - Translate MEANING, not words. An item is a measurement instrument: if the
    distractor stops being wrong for the same reason, the item is broken.
  - A clause, annex or control NUMBER is never translated and never reordered
    digit-wise: 6.1.3 stays 6.1.3, A.5.19 stays A.5.19.
  - A standard's designation is never translated: ISO/IEC 27001, ISO/IEC 42001,
    ISO 19011, ISO/IEC 27005.
  - Preserve the modal exactly. "shall" is a requirement, "should" is guidance,
    a NOTE is neither, and a translation that upgrades a should to a must has
    changed what the item tests.
  - Keep option ids EXACTLY as given. Do not reorder options.
  - Match the register of the existing bank: formal, impersonal, no second person.

Return: {"question_text": string|null, "options": [{"id","text"}]|null,
         "explanation": string|null} - null for any field not supplied.

THE TARGET LANGUAGE FOR THIS TRANSLATION IS ${langName.toUpperCase()}. Write every
field in ${langName} and in no other language.`;
}

// --------------------------------------------------------------- run
const specPath = resolve(SPEC);
if (!existsSync(specPath)) { console.error(`Spec not found: ${specPath}`); process.exit(2); }
let spec = JSON.parse(readFileSync(specPath, "utf8"));
if (!Array.isArray(spec)) { console.error("Spec must be a JSON array."); process.exit(2); }
if (ONLY_GROUP) spec = spec.filter((s) => s.group.startsWith(ONLY_GROUP));
if (!spec.length) { console.error("Nothing selected."); process.exit(2); }

console.log(`retranslate-item-rewrite  ${APPLY ? "*** APPLY ***" : "DRY RUN - nothing will be written"}`);
console.log(`spec=${specPath}  groups=${spec.length}  status flip=${PENDING ? "yes (--pending)" : "no"}\n`);

let failures = 0, written = 0;

for (const entry of spec) {
  const { group, reason, en } = entry;
  if (!group || !en || typeof en !== "object") { console.error(`ABORT: malformed spec entry`); process.exit(1); }

  const { data: rows, error } = await db.from("quiz_questions")
    .select("id, language, question_text, options, correct_answer, explanation, certification_id, pool, status")
    .eq("question_group_id", group);
  if (error) { console.error(`READ FAILED ${group}: ${error.message}`); process.exit(1); }
  if (!rows?.length) { console.error(`ABORT: group ${group} has no rows`); process.exit(1); }

  const { data: certRow } = await db.from("certifications").select("code").eq("id", rows[0].certification_id).single();
  const certCode = certRow?.code || "";
  const enRow = rows.find((r) => r.language === "en");
  if (!enRow) { console.error(`ABORT: group ${group} has no English row`); process.exit(1); }

  console.log(`== ${group.slice(0, 8)}  ${certCode}/${rows[0].pool}  ${reason || ""}`);

  const fields = ["question_text", "options", "correct_answer", "explanation"].filter((f) => en[f] !== undefined);
  for (const f of fields) {
    const before = f === "options" ? JSON.stringify(enRow[f]) : String(enRow[f] ?? "");
    const after = f === "options" ? JSON.stringify(en[f]) : String(en[f]);
    console.log(`   en.${f}`);
    console.log(`     before: ${before.slice(0, 150)}`);
    console.log(`     after : ${after.slice(0, 150)}`);
  }

  // ---- English write
  const enPatch = {};
  for (const f of fields) enPatch[f] = en[f];
  if (APPLY) {
    const { error: e2 } = await db.from("quiz_questions").update(enPatch).eq("id", enRow.id);
    if (e2) { console.error(`   WRITE FAILED en: ${e2.message}`); process.exit(1); }
    written++;
  }

  // ---- siblings
  const toTranslate = fields.filter((f) => f !== "correct_answer");
  for (const lang of LANGS) {
    if (ONLY_LANG && lang.code !== ONLY_LANG) continue;
    const row = rows.find((r) => r.language === lang.code);
    if (!row) { console.error(`   ABORT: no ${lang.code} row in group`); process.exit(1); }
    if (!toTranslate.length) {
      // correct_answer only - the key id moved, no prose changed.
      if (APPLY) {
        const { error: e3 } = await db.from("quiz_questions")
          .update({ correct_answer: en.correct_answer }).eq("id", row.id);
        if (e3) { console.error(`   WRITE FAILED ${lang.code}: ${e3.message}`); process.exit(1); }
        written++;
      }
      console.log(`   ${lang.code}: key only, no prose change`);
      continue;
    }

    const payload = {};
    for (const f of toTranslate) payload[f] = en[f];
    let out;
    try {
      out = parseJsonObject(await rawClaude(
        translateSystemFor(lang.name, certCode),
        `Translate these fields. Return the same JSON shape.\n\n${JSON.stringify(payload, null, 2)}`
      ));
    } catch (e) {
      console.error(`   ${lang.code}: TRANSLATION FAILED - ${e.message}`);
      failures++; continue;
    }

    const joined = toTranslate.map((f) => f === "options"
      ? (out.options || []).map((o) => o.text).join(" ")
      : String(out[f] ?? "")).join(" ");
    const g = looksLikeLanguage(joined, lang.code);
    if (!g.ok) {
      console.error(`   ${lang.code}: LANGUAGE GUARD REJECTED (target markers ${g.want}, other-language markers ${g.avoid})`);
      console.error(`     "${joined.slice(0, 140)}"`);
      failures++; continue;
    }
    if (out.options) {
      const ids = (out.options || []).map((o) => o.id).join(",");
      const want = (en.options || row.options || []).map((o) => o.id).join(",");
      if (ids !== want) {
        console.error(`   ${lang.code}: OPTION IDS CHANGED (${ids} vs ${want}) - refusing`);
        failures++; continue;
      }
    }

    // PIN COMPLIANCE, CHECKED ON THE OUTPUT RATHER THAN STATED IN THE PROMPT.
    // ISO_MS_VOCABULARY pins four terms. On 2026-09-13 one of them was violated
    // BY THE RUN THAT CARRIED IT - group 20c4e95d came back saying "apartado"
    // in Portuguese with the apartado pin in its own system prompt. A pin is an
    // instruction; this is the assertion. Same reason the language guard exists:
    // the contract is worthless if nothing reads what came back.
    const pinHits = checkPins(joined, lang.code);
    if (pinHits.length) {
      console.error(`   ${lang.code}: PIN VIOLATION - refusing`);
      for (const h of pinHits) console.error(`     ${h.id}: "${h.hit}" - ${h.why}`);
      failures++; continue;
    }

    console.log(`   ${lang.code}  guard ok (${g.want}/${g.avoid}), pins ok`);
    for (const f of toTranslate) {
      const b = f === "options" ? JSON.stringify(row[f]) : String(row[f] ?? "");
      const a = f === "options" ? JSON.stringify(out[f]) : String(out[f] ?? "");
      console.log(`     ${f} before: ${b.slice(0, 120)}`);
      console.log(`     ${f} after : ${a.slice(0, 120)}`);
    }

    if (APPLY) {
      const patch = { item_origin: "translated" };
      for (const f of toTranslate) if (out[f] != null) patch[f] = out[f];
      if (en.correct_answer !== undefined) patch.correct_answer = en.correct_answer;
      if (PENDING) patch.status = "pending_review";
      const { error: e4 } = await db.from("quiz_questions").update(patch).eq("id", row.id);
      if (e4) { console.error(`   WRITE FAILED ${lang.code}: ${e4.message}`); process.exit(1); }
      written++;
    }
  }
  console.log("");
}

console.log(`${APPLY ? `WROTE ${written} row(s).` : "DRY RUN - nothing written."}`);
if (failures) {
  console.error(`\n${failures} sibling(s) FAILED the guard or the API. Those rows are unchanged.`);
  console.error("A partial group is the worst outcome here - re-run the failed language with --lang.");
}
console.log(`
NOT REVIEWED. Every regenerated sibling is item_origin='translated' and no human
has compared it to the English. quiz_questions has no is_provisional column, so
nothing in the schema records that${PENDING ? "" : " - and status was NOT flipped"}.
Put these groups in front of a bilingual reader before treating them as done:
${spec.map((s) => "  " + s.group).join("\n")}`);
process.exit(failures ? 1 : 0);
