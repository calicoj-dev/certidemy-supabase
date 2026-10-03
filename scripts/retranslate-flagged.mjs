#!/usr/bin/env node
/**
 * Re-translate the lint-flagged side ONLY of this round's items, re-lint, loop until zero pins.
 * WRITES with `--apply`; dry by default. Unknown flags exit 2.
 *
 * SCOPE IS THIS TRANSLATION ROUND. The pins also fire on pre-existing APPROVED rows; those are
 * served content and a separate decision, so this script will not touch a row it did not create.
 *
 * PER LANGUAGE, and only the flagged one: regenerating an unflagged rendering would replace read
 * text with text nobody has read.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { translateSystem } from "./lib/item-translation.mjs";
import { graftTranslation, translateUser, translateItemControls } from "./lib/translate-item.mjs";
import { checkPins, PIN_RULES } from "./lib/pin-compliance.mjs";

const ALL_LANGS = [{ code: "es-419", name: "Latin American Spanish" },
  { code: "pt-BR", name: "Brazilian Portuguese" }];
const MAX_ROUNDS = 3;
let CERT = "AIMS-F", APPLY = false, ART = "AIMSF-TRANSLATION-R1.json", LANGS = ALL_LANGS;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--apply") { APPLY = true; continue; }
  const m = argv[i].match(/^--(cert|in|lang)=(.+)$/);
  if (m) {
    if (m[1] === "cert") CERT = m[2];
    else if (m[1] === "in") ART = m[2];
    else {
      LANGS = ALL_LANGS.filter((l) => l.code === m[2]);
      if (!LANGS.length) { console.error("--lang must be es-419 or pt-BR"); process.exit(2); }
    }
    continue;
  }
  console.error("Unrecognised flag: " + argv[i] + ". Known: --cert=<CODE>, --in=<artifact>, --lang=<code>, --apply.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODEL = process.env.GROUNDED_MODEL || "claude-opus-5";
const AK = process.env.ANTHROPIC_API_KEY ||
  (readFileSync(join(HERE, ".env"), "utf8").match(/^ANTHROPIC_API_KEY=(.+)$/m) || [])[1];
if (!AK) { console.error("ANTHROPIC_API_KEY not found"); process.exit(2); }

const ctl = translateItemControls();
if (ctl.fails.length) { console.error("REFUSING: translate-item controls fail"); process.exit(2); }
console.log("translate-item controls: " + ctl.examined + " case(s), all pass");

const PRICE = { input: 15, output: 75 };
let inTok = 0, outTok = 0, calls = 0;
const usd = () => (inTok / 1e6) * PRICE.input + (outTok / 1e6) * PRICE.output;
async function claude(system, user, maxTokens = 8000) {
  for (let a = 1; ; a++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST",
        headers: { "x-api-key": AK, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }) });
      if (!res.ok) throw new Error("Anthropic " + res.status + ": " + (await res.text()).slice(0, 200));
      const d = await res.json();
      calls++; inTok += d.usage?.input_tokens || 0; outTok += d.usage?.output_tokens || 0;
      return (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    } catch (e) { if (a >= 3) throw e; await new Promise((r) => setTimeout(r, 900 * a)); }
  }
}
const parseArray = (t) => { const s = String(t || ""); const a = s.indexOf("["), b = s.lastIndexOf("]");
  if (a < 0 || b < a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; } };

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const cert = (await getAll(KEY, "certifications?select=id&code=eq." + CERT))[0];
const SEL = "id,question_group_id,language,question_text,question_type,options,correct_answer,explanation," +
  "task_id,status,pool,visibility,is_exam_scope,bloom_level,difficulty";
const fetchRows = () => getAll(KEY, "quiz_questions?select=" + SEL + "&certification_id=eq." + cert.id +
  "&retired_at=is.null&order=id");
let rows = await fetchRows();
const grounding = new Map((await getAll(KEY,
  "item_grounding?select=question_id,review_verdict,review_note&order=question_id")).map((g) => [g.question_id, g]));

const isRoundEn = (r) => {
  if (r.language !== "en") return false;
  const g = grounding.get(r.id);
  return !!g && g.review_verdict === "accept" && !/\breserve:/i.test(String(g.review_note || ""));
};
const pinsOn = (tr, en, lang) => {
  const fields = [["question_text", tr.question_text, en.question_text],
    ["explanation", tr.explanation, en.explanation],
    ...(tr.options || []).map((o) => ["option " + o.id, o.text,
      ((en.options || []).find((x) => x.id === o.id) || {}).text])];
  const hits = [];
  for (const [what, text, enText] of fields) {
    for (const h of checkPins(text, lang, enText) || []) hits.push({ what, rule: h.id, hit: h.hit });
  }
  return hits;
};
const lintLang = (all, LANG) => {
  const byGroup = new Map();
  for (const r of all) {
    if (!r.question_group_id) continue;
    if (!byGroup.has(r.question_group_id)) byGroup.set(r.question_group_id, {});
    byGroup.get(r.question_group_id)[r.language] = r;
  }
  const out = [];
  let checked = 0;
  for (const g of byGroup.values()) {
    if (!g.en || !isRoundEn(g.en) || !g[LANG.code]) continue;
    checked++;
    const hits = pinsOn(g[LANG.code], g.en, LANG.code);
    if (hits.length) out.push({ en: g.en, tr: g[LANG.code], hits });
  }
  return { checked, flagged: out };
};

const art = existsSync(join(ROOT, ART)) ? JSON.parse(readFileSync(join(ROOT, ART), "utf8")) : { items: [] };
const enById = new Map(rows.filter((r) => r.language === "en").map((r) => [r.id, r]));
const heldFlaggedFor = (LANG, all) => {
  const out = [];
  for (const rec of art.items || []) {
    const en = enById.get(rec.en_id);
    if (!en || !isRoundEn(en)) continue;
    if (en.question_group_id &&
      all.some((r) => r.question_group_id === en.question_group_id && r.language === LANG.code)) continue;
    const g = rec.langs && rec.langs[LANG.code];
    if (!g) continue;
    out.push({ en, rec, hits: pinsOn(g, en, LANG.code) });
  }
  return out;
};

const RULE_BRIEF = (LANG) => PIN_RULES.filter((r) => r.langs.includes(LANG.code))
  .map((r) => "- " + r.id + ": " + r.why).join("\n");

/* ---------- dry report, every language, before anything is written ---------- */
const plan = [];
let totalFlagged = 0, totalHeldFlagged = 0;
console.log("");
console.log("THIS ROUND   " + CERT + (APPLY ? "   --apply" : "   dry run (default)"));
for (const LANG of LANGS) {
  const first = lintLang(rows, LANG);
  const held = heldFlaggedFor(LANG, rows);
  const byRule = {};
  for (const f of first.flagged) for (const h of f.hits) byRule[h.rule] = (byRule[h.rule] || 0) + 1;
  console.log("");
  console.log("  " + LANG.code);
  console.log("    inserted siblings linted   " + first.checked);
  console.log("    FLAGGED (inserted)         " + first.flagged.length);
  console.log("    held in the artifact       " + held.length + "   of which flagged " +
    held.filter((h) => h.hits.length).length);
  console.log("    findings by rule           " + JSON.stringify(byRule));
  for (const f of first.flagged.slice(0, 20)) {
    console.log("      " + String(f.tr.id).slice(0, 8) + "  " +
      f.hits.map((h) => h.rule + ":" + h.what + "=" + JSON.stringify(h.hit)).join("  "));
  }
  plan.push({ LANG, first });
  totalFlagged += first.flagged.length;
  totalHeldFlagged += held.filter((h) => h.hits.length).length;
}

if (!totalFlagged && !totalHeldFlagged) {
  console.log("\nZERO PINS on this round's rows in " + LANGS.map((l) => l.code).join(" and ") + ".");
  process.exit(0);
}
if (!APPLY) {
  console.log("\nDRY RUN. Would re-translate " + totalFlagged + " row(s) in ~" +
    plan.reduce((n, p) => n + Math.ceil(p.first.flagged.length / 8), 0) + " call(s). Re-run with --apply.");
  process.exit(0);
}

/* ---------- repair, per language, flagged rows only ---------- */
for (const p of plan) {
  const LANG = p.LANG;
  let round = 0, remaining = p.first.flagged;
  while (remaining.length && round < MAX_ROUNDS) {
    round++;
    console.log("");
    console.log("  " + LANG.code + " ROUND " + round + ": re-translating " + remaining.length + " row(s)");
    for (let s = 0; s < remaining.length; s += 8) {
      const batch = remaining.slice(s, s + 8);
      const sys = translateSystem(LANG.name, "secure") +
        "\n\nGLOSSARY PINS -- CORRECTNESS RULES for " + LANG.name + ", not preferences:\n" + RULE_BRIEF(LANG) +
        "\n\nThe previous rendering of these items broke one or more of the pins above. Fix the pinned" +
        "\nterms and change nothing else. Keep every option id exactly as given.";
      const raw = parseArray(await claude(sys, translateUser(batch.map((f) => f.en))));
      if (!Array.isArray(raw) || raw.length !== batch.length) {
        console.error("    batch count mismatch (" + (Array.isArray(raw) ? raw.length : "not an array") +
          " for " + batch.length + ") -- batch skipped, nothing patched");
        continue;
      }
      for (const [i, f] of batch.entries()) {
        const g = graftTranslation(f.en, raw[i]);
        if (!g) { console.error("    graft failed " + String(f.tr.id).slice(0, 8)); continue; }
        const r = await fetch(REST_URL + "/quiz_questions?id=eq." + f.tr.id, { method: "PATCH", headers: H,
          body: JSON.stringify({ question_text: g.question_text, options: g.options, explanation: g.explanation,
            status: f.tr.status, pool: f.tr.pool, visibility: f.tr.visibility, is_exam_scope: f.tr.is_exam_scope,
            correct_answer: f.tr.correct_answer, bloom_level: f.tr.bloom_level }) });
        if (!r.ok) console.error("    PATCH FAILED " + String(f.tr.id).slice(0, 8) + "  " + (await r.text()).slice(0, 140));
      }
      console.log("    batch of " + batch.length + "   $" + usd().toFixed(2));
    }
    const re = lintLang(await fetchRows(), LANG);
    console.log("  after round " + round + ": " + re.flagged.length + " row(s) still flagged");
    remaining = re.flagged;
  }
  p.rounds = round;
}

/* ---------- final verdict ---------- */
rows = await fetchRows();
let stillFlagged = 0;
console.log("");
for (const p of plan) {
  const final = lintLang(rows, p.LANG);
  stillFlagged += final.flagged.length;
  console.log("  " + p.LANG.code + "   rounds " + (p.rounds || 0) + " of " + MAX_ROUNDS +
    "   checked " + final.checked + "   STILL FLAGGED " + final.flagged.length);
  for (const f of final.flagged.slice(0, 10)) {
    console.log("      " + String(f.tr.id).slice(0, 8) + "  " +
      f.hits.map((h) => h.rule + "=" + JSON.stringify(h.hit)).join("  "));
  }
}
console.log("  spend           $" + usd().toFixed(4) + "   (" + calls + " call(s))");
if (stillFlagged) { console.error("NOT ZERO PINS."); process.exitCode = 2; }
else console.log("ZERO PINS on this round's rows.");
