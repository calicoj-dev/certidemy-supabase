#!/usr/bin/env node
/**
 * PROMPT-104 s3b: translate ACCEPTED grounded English items into es-419 and pt-BR siblings.
 *
 * WRITES with `--apply`; dry by default. Unknown flags exit 2.
 *   --cert <CODE>       required
 *   --tasks a,b         only these tasks (for the one-task measurement)
 *   --limit N           at most N English items
 *   --out <file>        the artifact (default AIMSF-TRANSLATION-R1.json)
 *
 * SCOPE IS `review_verdict = accept` WITH NO `reserve:` NOTE. A row the director has not accepted is
 * not translated, because every translated word inherits the English's clearance and a reserve is not one.
 *
 * CHECKPOINTED: each English item's translations are appended to <out>.partial.jsonl as they are
 * produced, so a crash does not re-pay for the model calls already made.
 */
import { readFileSync, writeFileSync, appendFileSync, existsSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { translateSystem } from "./lib/item-translation.mjs";
import { graftTranslation, translateUser, translateItemControls } from "./lib/translate-item.mjs";
import { checkPins, PIN_RULES } from "./lib/pin-compliance.mjs";
import { driftInItem, MODAL_BRIEF, modalDriftControls } from "./lib/modal-drift.mjs";
import { explanationOptionRef, explanationOptionRefControls } from "./lib/explanation-option-ref.mjs";

const LANGS = [{ code: "es-419", name: "Latin American Spanish" }, { code: "pt-BR", name: "Brazilian Portuguese" }];
let CERT = null, APPLY = false, ONLY = null, LIMIT = null, OUT = "AIMSF-TRANSLATION-R1.json";
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]; let m;
  if (a === "--apply") { APPLY = true; continue; }
  if (a === "--cert") { CERT = argv[++i]; continue; }
  if ((m = /^--cert=(.+)$/.exec(a))) { CERT = m[1]; continue; }
  if ((m = /^--tasks=(.+)$/.exec(a))) { ONLY = m[1].split(",").map((s) => s.trim()).filter(Boolean); continue; }
  if ((m = /^--limit=(\d+)$/.exec(a))) { LIMIT = Number(m[1]); continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  console.error("Unrecognised flag: " + a);
  console.error("  --cert <CODE> (required), --tasks=a,b, --limit=N, --out=<file>, --apply (dry by default)");
  process.exit(2);
}
if (!CERT) { console.error("--cert is required."); process.exit(2); }

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODEL = process.env.GROUNDED_MODEL || "claude-opus-5";
const AK = process.env.ANTHROPIC_API_KEY ||
  (readFileSync(join(HERE, ".env"), "utf8").match(/^ANTHROPIC_API_KEY=(.+)$/m) || [])[1];
if (!AK) { console.error("ANTHROPIC_API_KEY not found in env or scripts/.env"); process.exit(2); }

/* CONTROLS FIRST. A translation run whose graft is broken writes holes into the bank. */
/* A control suite that reports 0 cases is VACUOUS, not passing -- explanationOptionRefControls returns
 * an ARRAY of cases and my first shim read {fails} off it, printing "0 case(s), all pass". */
for (const [label, c] of [["translate-item", translateItemControls()], ["explanation-option-ref", explanationOptionRefControls()], ["modal-drift", modalDriftControls()]]) {
  const cases = Array.isArray(c) ? [...c] : (c.cases ? [...c.cases] : null);
  const n = cases ? cases.length : (c.examined ?? 0);
  const fails = cases ? cases.filter((x) => x && x.pass === false).map((x) => x.what) : (c.fails || []);
  if (!n) { console.error("REFUSING: " + label + " controls examined NOTHING -- vacuous, not a pass."); process.exit(2); }
  if (fails.length) { console.error("REFUSING: " + label + " controls fail: " + JSON.stringify(fails).slice(0, 240)); process.exit(2); }
  console.log(label + " controls: " + n + " case(s), all pass");
}

/* ---- price, read from the same place the generator reads it ---- */
const PRICE = { input: 15, output: 75 };     /* USD per Mtok, claude-opus-5 */
let inTok = 0, outTok = 0, calls = 0;
const usd = () => (inTok / 1e6) * PRICE.input + (outTok / 1e6) * PRICE.output;
async function claude(system, user, maxTokens = 8000) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": AK, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
      });
      if (!res.ok) throw new Error("Anthropic " + res.status + ": " + (await res.text()).slice(0, 200));
      const d = await res.json();
      calls++; inTok += d.usage?.input_tokens || 0; outTok += d.usage?.output_tokens || 0;
      return (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    } catch (e) { if (attempt >= 3) throw e; await new Promise((r) => setTimeout(r, 900 * attempt)); }
  }
}
const parseArray = (t) => {
  const s = String(t || ""); const a = s.indexOf("["), b = s.lastIndexOf("]");
  if (a < 0 || b < a) return null; try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
};

/* ---- the scope ---- */
const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
const tasks = await getAll(KEY, "tasks?select=id,code&order=code");
const codeOf = new Map(tasks.map((t) => [t.id, t.code]));
const rows = await getAll(KEY, "quiz_questions?select=id,question_group_id,question_text,question_type," +
  "options,correct_answer,explanation,task_id,status,visibility,pool,is_exam_scope,language,difficulty," +
  "item_origin,module_id,bloom_level,bank_revision,retired_vocabulary_intent,options_fixed_order&certification_id=eq." + cert.id + "&retired_at=is.null&order=id");
const grounding = new Map((await getAll(KEY,
  "item_grounding?select=question_id,review_verdict,review_note&order=question_id")).map((g) => [g.question_id, g]));

const en = rows.filter((r) => r.language === "en");
const accepted = en.filter((r) => {
  const g = grounding.get(r.id);
  if (!g || g.review_verdict !== "accept") return false;
  if (/\breserve:/i.test(String(g.review_note || ""))) return false;   /* a reserve is not a clearance */
  return true;
});
/* already-translated English rows are SKIPPED, not re-translated: a second sibling is a duplicate row. */
const sibCount = new Map();
for (const r of rows) {
  if (r.language === "en" || !r.question_group_id) continue;
  if (!sibCount.has(r.question_group_id)) sibCount.set(r.question_group_id, new Set());
  sibCount.get(r.question_group_id).add(r.language);
}
let scope = accepted.filter((r) => {
  const have = r.question_group_id ? (sibCount.get(r.question_group_id) || new Set()) : new Set();
  return !(have.has("es-419") && have.has("pt-BR"));
});
if (ONLY) scope = scope.filter((r) => ONLY.includes(codeOf.get(r.task_id)));
if (LIMIT) scope = scope.slice(0, LIMIT);

console.log("");
console.log("TRANSLATE GROUNDED ITEMS   " + CERT + (APPLY ? "   --apply" : "   dry run (default)"));
console.log("  English rows                " + en.length);
console.log("  accepted (no reserve)       " + accepted.length);
/* counted BEFORE the task/limit filters, or the number conflates "already done" with "out of scope" */
const alreadyBoth = accepted.filter((r) => {
  const have = r.question_group_id ? (sibCount.get(r.question_group_id) || new Set()) : new Set();
  return have.has("es-419") && have.has("pt-BR");
}).length;
console.log("  already have both siblings  " + alreadyBoth);
console.log("  needing translation         " + (accepted.length - alreadyBoth));
console.log("  IN SCOPE                    " + scope.length + (ONLY ? "   tasks " + ONLY.join(",") : "") + (LIMIT ? "   limit " + LIMIT : ""));
if (!scope.length) { console.log("\nNothing to translate."); process.exit(0); }

/* ---- the checkpoint ---- */
const partial = join(ROOT, OUT + ".partial.jsonl");
const done = new Map();
const partialDone = new Map();   /* checkpointed but missing a language: RE-PAID, not skipped */
if (existsSync(partial)) {
  for (const line of readFileSync(partial, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    /* ============ A HALF-DONE ITEM IS NOT DONE ============
     *
     * R3 task 3.8 lost its whole es-419 batch to a count mismatch; the eight records were checkpointed
     * with pt-BR only, and the resume then skipped them because the id was present. A checkpoint that
     * locks in a missing language is worse than no checkpoint: the run reports "incomplete 8" for ever
     * and re-running cannot fix it. So a record counts as done only when BOTH languages are there. */
    try {
      const r = JSON.parse(line);
      if (r && r.langs && LANGS.every((l) => r.langs[l.code])) done.set(r.en_id, r);
      else if (r) partialDone.set(r.en_id, r);
    } catch { /* a torn last line is skipped */ }
  }
  console.log("  checkpoint                  " + done.size + " item(s) complete, not re-paid" +
    (partialDone.size ? ";  " + partialDone.size + " item(s) MISSING A LANGUAGE and re-translated" : ""));
}

/* ============ BATCHED PER TASK, because the SYSTEM PROMPT is the bulk of the input ============
 *
 * One call per item per language measured $0.2010 an item, which projects $40.20 over 200 -- past the
 * $40 cap. The translation contract is ~5,000 tokens and was being re-sent for every single item.
 * `translateUser` already takes an ARRAY, and graftTranslation pairs results back BY POSITION within
 * the batch, so the count is asserted and a mismatch refuses the whole batch rather than mis-pairing.
 * This is how gen-cert-secure has always called it. */
const BATCH = 8;
const byTask = new Map();
for (const row of scope) {
  const code = codeOf.get(row.task_id);
  if (!byTask.has(code)) byTask.set(code, []);
  byTask.get(code).push(row);
}
const results = [];
let n = 0;
for (const [code, taskRows] of [...byTask.entries()].sort()) {
  for (let s = 0; s < taskRows.length; s += BATCH) {
    const batch = taskRows.slice(s, s + BATCH);
    const fresh = batch.filter((r) => !done.has(r.id));
    for (const r of batch.filter((r) => done.has(r.id))) { results.push(done.get(r.id)); n++; }
    if (!fresh.length) continue;
    const recs = fresh.map((row) => ({ en_id: row.id, task: code, group_id: row.question_group_id, langs: {}, errors: [] }));
    for (const lang of LANGS) {
      try {
        /* THE GLOSSARY PINS GO IN THE FIRST-PASS PROMPT, not only in the repair prompt. The pins were
         * enforced by the lint and absent from the instruction, so the model had to guess and a repair
         * round paid for what the brief could have prevented. */
        /* `inserted-cadence` is checked by checkPins but lives OUTSIDE PIN_RULES, so building the
         * brief from PIN_RULES alone left the one rule that changes what the item REQUIRES unstated. */
        const brief = PIN_RULES.filter((r) => r.langs.includes(lang.code))
          .map((r) => "- " + r.id + ": " + r.why).join("\n") +
          /* MODAL FORCE, ruled PROMPT-117 s4. Measured on the 46 ISMS-F items: 11 non-stem sentences
           * stated a requirement where the English hedged, 10 of them pt-BR, one of them inside a
           * QUOTATION of 27002 5.9 -- which misquotes the standard. The rule is stated ONCE, in
           * lib/modal-drift.mjs, so the brief and the measurement cannot disagree. */
          "\n" + MODAL_BRIEF +
          "\n- inserted-cadence: NEVER add a periodicity the English does not state. If the English gives" +
          "\n  no interval, the translation gives none -- no 'periodicamente', 'continuamente', 'de forma" +
          "\n  continua', 'trimestralmente' or 'regularmente'. Adding one changes what the item REQUIRES.";
        const sys = translateSystem(lang.name, "secure") +
          (brief ? "\n\nGLOSSARY PINS -- CORRECTNESS RULES for " + lang.name + ", not preferences:\n" + brief : "");
        const raw = parseArray(await claude(sys, translateUser(fresh)));
        /* THE COUNT IS ASSERTED. graft pairs BY POSITION inside a batch, so a short array would
         * silently translate item 2 as item 1 -- the whole batch is refused instead. */
        if (!Array.isArray(raw) || raw.length !== fresh.length) {
          for (const rec of recs) rec.errors.push(lang.code + ": batch count mismatch (" +
            (Array.isArray(raw) ? raw.length : "not an array") + " for " + fresh.length + ")");
          continue;
        }
        for (const [i, row] of fresh.entries()) {
          const g = graftTranslation(row, raw[i]);
          if (!g) { recs[i].errors.push(lang.code + ": graft failed (an option id or a prose field is missing)"); continue; }
          recs[i].langs[lang.code] = g;
        }
      } catch (e) { for (const rec of recs) rec.errors.push(lang.code + ": " + String(e.message).slice(0, 120)); }
    }
    /* ============ THE CHECKPOINT CARRIES THE SPEND (PROMPT-125 s3) ============
     *
     * The spend happens on the run that MAKES the calls, and the artifact is written by the run
     * that writes the rows -- which resumes from this checkpoint and legitimately spends $0. So
     * every ISMSF-TRANSLATION-*.json records `usd: 0` and the per-round translation cost for a
     * whole certification is unrecoverable. Found closing the ISMS-F book: 304 item-translations
     * with no price on any of them.
     *
     * `usd_cumulative` is the running total at the moment this batch was checkpointed, so the last
     * record in the file is the round's translation spend even if the run is resumed. */
    const soFar = Number(usd().toFixed(4));
    for (const rec of recs) {
      appendFileSync(partial, JSON.stringify({ ...rec, usd_cumulative: soFar }) + "\n", "utf8");
      results.push(rec); n++;
    }
    console.log("  " + String(n).padStart(3) + "/" + scope.length + "  task " + code.padEnd(5) +
      " batch of " + fresh.length + "   both langs: " + recs.filter((r) => r.langs["es-419"] && r.langs["pt-BR"]).length +
      "/" + fresh.length + "   $" + usd().toFixed(2));
  }
}

/* ---- the lint, per language, over what was produced ---- */
const lint = { "es-419": { checked: 0, pins: [], letters: [] }, "pt-BR": { checked: 0, pins: [], letters: [] } };
for (const rec of results) {
  const row = scope.find((r) => r.id === rec.en_id) || en.find((r) => r.id === rec.en_id);
  for (const lang of LANGS) {
    const g = rec.langs[lang.code];
    if (!g) continue;
    lint[lang.code].checked++;
    const fields = [["question_text", g.question_text, row.question_text], ["explanation", g.explanation, row.explanation],
      ...g.options.map((o, i) => ["option " + o.id, o.text, (row.options[i] || {}).text])];
    for (const [what, text, enText] of fields) {
      const hits = checkPins(text, lang.code, enText) || [];
      for (const h of hits) lint[lang.code].pins.push({ id: String(rec.en_id).slice(0, 8), what, rule: h.id, why: String(h.why || "").slice(0, 110), hit: h.hit });
    }
    /* THE EXPLANATION MUST NOT NAME AN OPTION BY LETTER -- the delivery shuffle moves them. */
    const v = explanationOptionRef({ question_text: g.question_text, explanation: g.explanation,
      options: g.options.map((o, i) => ({ text: o.text, is_correct: (row.correct_answer || []).includes(o.id) })) });
    if (v && v.pass === false) lint[lang.code].letters.push({ id: String(rec.en_id).slice(0, 8), reason: String(v.reason).slice(0, 140) });
  }
}

console.log("");
console.log("  LINT");
for (const lang of LANGS) {
  const l = lint[lang.code];
  console.log("    " + lang.code.padEnd(7) + " checked " + String(l.checked).padStart(3) +
    "   pin findings " + String(l.pins.length).padStart(3) + "   letter references " + l.letters.length);
}
for (const lang of LANGS) for (const p of lint[lang.code].pins) {
  console.log("      " + lang.code + "  " + p.id + "  " + p.what.padEnd(14) + " [" + p.rule + "] " + JSON.stringify(p.hit) + "  " + p.why);
}
for (const lang of LANGS) for (const p of lint[lang.code].letters.slice(0, 8)) {
  console.log("      " + lang.code + "  " + p.id + "  LETTER REF  " + p.reason);
}

/* ============ MODAL DRIFT: A REPORT LINE, NOT A GATE ============
 *
 * Ruled PROMPT-117 s4. It reports whether a translated sentence states a requirement the English only
 * recommended. It does NOT withhold the row -- PROMPT-111 s0 rules out new gates for wording nuances,
 * and the fix is the brief above. The members are printed, because the count alone was wrong twice. */
const drift = { "es-419": [], "pt-BR": [] };
let driftExamined = 0, driftUnaligned = 0;
for (const rec of results) {
  const row = scope.find((r) => r.id === rec.en_id) || en.find((r) => r.id === rec.en_id);
  for (const lang of LANGS) {
    const g = rec.langs[lang.code];
    if (!g || !row) continue;
    const r = driftInItem(row, { question_text: g.question_text, explanation: g.explanation,
      options: g.options }, lang.code);
    driftExamined += r.examined; driftUnaligned += r.unaligned.length;
    for (const x of r.findings) drift[lang.code].push({ id: String(rec.en_id).slice(0, 8), ...x });
  }
}
const driftAll = [...drift["es-419"], ...drift["pt-BR"]];
const driftNonStem = driftAll.filter((x) => x.field !== "stem");
console.log("");
console.log("  MODAL DRIFT (report, not a gate)   hedged sentences examined " + driftExamined +
  "   unalignable " + driftUnaligned);
console.log("    findings " + driftAll.length + "   non-stem " + driftNonStem.length +
  "   es-419 " + drift["es-419"].length + "   pt-BR " + drift["pt-BR"].length +
  (driftNonStem.length ? "   TARGET IS 0 NON-STEM (PROMPT-117 s4)" : ""));
for (const x of driftAll.slice(0, 12)) {
  console.log("      " + x.lang + "  " + x.id + "  " + x.field);
  console.log("          en: " + String(x.en).slice(0, 150));
  console.log("          tr: " + String(x.tr).slice(0, 150));
}
if (driftAll.length > 12) console.log("      ... " + (driftAll.length - 12) + " more");

const ok = results.filter((r) => r.langs["es-419"] && r.langs["pt-BR"]);
const broken = results.filter((r) => !(r.langs["es-419"] && r.langs["pt-BR"]));
console.log("");
console.log("  translated both languages   " + ok.length + " of " + results.length);
console.log("  incomplete                  " + broken.length);
for (const b of broken.slice(0, 6)) console.log("      " + String(b.en_id).slice(0, 8) + "  " + b.errors.join("; "));
console.log("  spend                       $" + usd().toFixed(4) + "   (" + calls + " call(s))");
const perItem = ok.length ? usd() / ok.length : 0;
console.log("  per English item            $" + perItem.toFixed(4) + "   (both languages)");

const artifact = { cert: CERT, model: MODEL, generated: results.length, complete: ok.length,
  /* `usd` is what THIS run paid; `usd_round` is what the round cost including the calls a prior
   * run made and checkpointed. A resumed apply pays nothing, so without the second number the
   * artifact claims the round was free. */
  spend: { usd: Number(usd().toFixed(4)), calls, input: inTok, output: outTok, price_per_mtok: PRICE,
    usd_round: Number(Math.max(usd(), ...results.map((r) => Number(r.usd_cumulative) || 0)).toFixed(4)) },
  lint, items: results, emitted_by: "translate-grounded-items.mjs (PROMPT-104 s3b)" };
writeFileSync(join(ROOT, OUT), JSON.stringify(artifact, null, 1), "utf8");
console.log("  wrote " + OUT);

if (!APPLY) {
  console.log("");
  console.log("NOTHING WRITTEN. " + ok.length + " item(s) would get an es-419 and a pt-BR sibling.");
  process.exitCode = 0;
} else {
  /* A LINT-FLAGGED ITEM IS NOT INSERTED. Nine es-419 rows left "ISMS" where the catalogue says SGSI,
   * and two pt-BR rows INVENTED an interval the English does not state -- which changes what the item
   * tests. Inserting a row a gate has already flagged is the known-defect write this repo refuses. */
  const flagged = new Set();
  for (const lang of LANGS) {
    for (const p of lint[lang.code].pins) flagged.add(p.id);
    for (const p of lint[lang.code].letters) flagged.add(p.id);
  }
  const clean = ok.filter((r) => !flagged.has(String(r.en_id).slice(0, 8)));
  const held = ok.filter((r) => flagged.has(String(r.en_id).slice(0, 8)));
  if (held.length) {
    console.log("");
    console.log("  HELD BACK, lint-flagged: " + held.length + " item(s) -- " +
      held.map((r) => String(r.en_id).slice(0, 8)).join(", "));
    console.log("  These are NOT inserted. Re-translate them with the rule named, then re-run.");
  }
  if (broken.length) { console.error("\nREFUSING TO WRITE: " + broken.length + " item(s) did not translate into both languages."); process.exitCode = 2; }
  else {
    let groups = 0, inserted = 0;
    for (const rec of clean) {
      const row = scope.find((r) => r.id === rec.en_id);
      let gid = row.question_group_id;
      if (!gid) {
        gid = globalThis.crypto.randomUUID();
        const r = await fetch(REST_URL + "/quiz_questions?id=eq." + row.id,
          { method: "PATCH", headers: H, body: JSON.stringify({ question_group_id: gid }) });
        if (!r.ok) { console.error("  GROUP PATCH FAILED " + String(row.id).slice(0, 8)); continue; }
        groups++;
      }
      const body = LANGS.map((lang) => ({
        certification_id: cert.id, task_id: row.task_id, module_id: row.module_id,
        question_group_id: gid, language: lang.code,
        question_text: rec.langs[lang.code].question_text,
        question_type: row.question_type,
        options: rec.langs[lang.code].options,
        correct_answer: row.correct_answer,
        explanation: rec.langs[lang.code].explanation,
        difficulty: row.difficulty,
        item_origin: row.item_origin,
        /* MACHINE FIELDS COME FROM THE ENGLISH ROW, NOT A DEFAULT. bloom_level is one: leaving it out
         * tripped a CHECK on 101 of 191 inserts, and a sibling with a different cognitive level is a
         * different question. Same reason for bank_revision and options_fixed_order. */
        bloom_level: row.bloom_level,
        bank_revision: row.bank_revision,
        retired_vocabulary_intent: row.retired_vocabulary_intent,
        options_fixed_order: row.options_fixed_order,
        /* NAMED ON THE WRITE, every one: the English row's own pool, visibility and scope. */
        status: "pending_review", pool: row.pool, visibility: row.visibility, is_exam_scope: row.is_exam_scope,
      }));
      const r2 = await fetch(REST_URL + "/quiz_questions",
        { method: "POST", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify(body) });
      if (!r2.ok) { console.error("  INSERT FAILED " + String(row.id).slice(0, 8) + "  " + (await r2.text()).slice(0, 180)); continue; }
      inserted += (await r2.json()).length;
    }
    /* ---- READ BACK, and both directions ---- */
    const after = await getAll(KEY, "quiz_questions?select=id,question_group_id,language,status,pool,visibility," +
      "is_exam_scope,correct_answer,options,task_id&certification_id=eq." + cert.id + "&retired_at=is.null&order=id");
    const want = new Set(clean.map((r) => r.en_id));
    const gidOf = new Map(after.filter((r) => want.has(r.id)).map((r) => [r.id, r.question_group_id]));
    let good = 0; const bad = [];
    for (const enId of want) {
      const gid = gidOf.get(enId);
      const sibs = after.filter((r) => r.question_group_id === gid && r.language !== "en");
      const enRow = after.find((r) => r.id === enId);
      if (sibs.length !== 2) { bad.push(String(enId).slice(0, 8) + ": " + sibs.length + " sibling(s)"); continue; }
      const wrong = sibs.filter((s) => s.status !== "pending_review" || s.pool !== enRow.pool ||
        s.visibility !== enRow.visibility || s.is_exam_scope !== enRow.is_exam_scope ||
        s.task_id !== enRow.task_id ||
        JSON.stringify(s.correct_answer) !== JSON.stringify(enRow.correct_answer) ||
        s.options.map((o) => o.id).join(",") !== enRow.options.map((o) => o.id).join(","));
      if (wrong.length) { bad.push(String(enId).slice(0, 8) + ": " + wrong.length + " sibling(s) differ on a named column"); continue; }
      good++;
    }
    console.log("");
    console.log("  group ids assigned          " + groups);
    console.log("  sibling rows inserted       " + inserted);
    /* THE DENOMINATOR IS `want`, WHICH IS THE CLEAN SET -- so "40 of 40" is true of what was
     * inserted and silent about what was withheld. The in-scope total goes on the same line, or a
     * reader has to join it to the lint block above by hand. */
    console.log("  READ BACK: English rows with exactly 2 siblings, every named column matching: " +
      good + " of " + want.size + " inserted" +
      (held.length ? "   (" + (want.size + held.length) + " in scope; " + held.length +
        " withheld by the lint and NOT inserted)" : ""));
    for (const b of bad.slice(0, 8)) console.log("      " + b);
    if (good !== want.size) { console.error("POST-CONDITION FAILED."); process.exitCode = 2; }
    else {
      if (existsSync(partial)) renameSync(partial, partial + ".done");
      console.log("  checkpoint retired. Nothing is approved: every sibling is pending_review.");
    }
  }
}
