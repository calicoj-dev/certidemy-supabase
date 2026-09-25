#!/usr/bin/env node
/**
 * record-own-work-review.mjs -- record the review for the own-work attribution fix.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * Same shape as `record-batch1-review.mjs` and the same rule: ASSERT, NEVER
 * STAMP. It writes `lesson_translation_reviews` and touches no `lessons` column
 * -- `en_content_hash` was already set separately, by the prover, which is the
 * only writer allowed to touch it.
 *
 * The review being recorded is the director's read in PROMPT-58: every
 * replacement string there is theirs, quoted verbatim into
 * `fix-own-work-attribution.mjs`, and the substance was checked against
 * HANDOFF-v6_2.md section 2 (the maxim is in neither standard, full-text search,
 * zero hits).
 *
 * WHAT IS ASSERTED BEFORE A ROW IS VOUCHED FOR:
 *
 *   1. the live body still contains the director's replacement for that language;
 *   2. the live body no longer attributes the rule to ISO 19011;
 *   3. en_hash and tr_hash are computed with the functions the REVIEW ARM uses,
 *      which are NOT the same function -- left(md5(en),8) against
 *      public.translation_hash(tr);
 *   4. node's md5 is proved against a known Postgres value first.
 *
 * Any failure refuses every row. A partial clearance that reads as success is
 * the failure this file exists to avoid.
 */
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". DRY BY DEFAULT; --apply to write.");
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");

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
const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };

async function rest(path, init) {
  let last;
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(REST + "/" + path, { ...(init || {}),
        headers: { ...H, ...((init || {}).headers || {}) }, signal: AbortSignal.timeout(45000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 160));
      return t ? JSON.parse(t) : null;
    } catch (e) { last = e; }
    await new Promise((s) => setTimeout(s, 400 * (i + 1)));
  }
  throw last;
}
const trHash = (t) => rest("rpc/translation_hash", { method: "POST", body: JSON.stringify({ p_a: t }) });
const md5_8 = (t) => createHash("md5").update(t, "utf8").digest("hex").slice(0, 8);
const MD5_CONTROL = { slug: "03-03-documented-information", expect: "65c2c508" };

const AIMS = "05-02-aims-internal-audit";
const ISMS = "isms-ia-01-03-objectivity-of-the-assignment";

/* ============ WHICH ROWS A ONE-SENTENCE READ MAY CLEAR ============
 *
 * `05-02` only. Its translated bodies were read in full for batch cda6698a, so
 * the outstanding question was one sentence and PROMPT-58 answered it.
 *
 * `isms-ia-01-03` es and pt have NEVER been reviewed -- zero review rows, part of
 * the 141 never-reviewed population. The director supplied a corrected sentence
 * for them; that is not a review of a 13,000-character lesson. The first run of
 * this script cleared them anyway and both went live on the strength of one
 * paragraph. The rows were deleted and both returned to withheld.
 *
 * A REVIEW ROW IS A CLAIM THAT SOMEONE READ THE TRANSLATION. Recording one
 * because a sentence inside it was corrected makes the gate assert something
 * nobody did, which is the same defect as a clearance script re-stamping a hash:
 * the gate is intact and told what it wants to hear. Their text is now correct
 * and they stay dark until somebody reads them. */
const MAY_CLEAR = new Set([AIMS]);

/* One phrase per (slug, language) that MUST be present -- the distinctive part
 * of the director's replacement, not the whole paragraph, so a later unrelated
 * edit to the same block does not make this refuse for no reason. */
const MUST_CONTAIN = {
  [AIMS + "|es-419"]: "tampoco la menciona ISO 19011",
  [AIMS + "|pt-BR"]: "a ISO 19011 também não a menciona",
  [ISMS + "|es-419"]: "Auditar el propio trabajo es la forma canónica de incumplir el apartado 9.2.2 b)",
  [ISMS + "|pt-BR"]: "Auditar o próprio trabalho é a forma canônica de falhar na Seção 9.2.2 b)",
};
const MUST_NOT_CONTAIN = ["es orientación de ISO 19011", "é orientação da ISO 19011",
  "orientación de la ISO 19011 y no texto", "orientação da ISO 19011, não texto"];

const REVIEWER = "director read (PROMPT-58), own-work attribution";
const NOTE = "The own-work maxim is in neither ISO/IEC 27001 nor ISO 19011:2026 " +
  "(HANDOFF-v6_2.md s2, full-text search, zero hits). Every replacement string is the " +
  "director's, quoted verbatim in fix-own-work-attribution.mjs. G5 clean against each " +
  "lesson's measured clause word.";

const rows = await rest("lessons?select=id,slug,language,lesson_group_id,content_md" +
  "&slug=in.(" + AIMS + "," + ISMS + ")&order=slug,language");
const enOf = new Map(rows.filter((r) => r.language === "en").map((r) => [r.lesson_group_id, r]));
const targets = rows.filter((r) => r.language !== "en" && MAY_CLEAR.has(r.slug));
const notCleared = rows.filter((r) => r.language !== "en" && !MAY_CLEAR.has(r.slug));

console.log("");
console.log("RECORD THE OWN-WORK REVIEW -- " + targets.length + " translated row(s)");
console.log("  reviewer of record: " + REVIEWER);
console.log("  writes lesson_translation_reviews ONLY; no lessons column is touched");
console.log("DENOMINATOR: " + targets.length + " row(s) examined");
for (const r of notCleared) {
  console.log("  NOT CLEARED  " + (r.slug + " " + r.language).padEnd(48) +
    "text fixed, but never reviewed -- a corrected sentence is not a read of the lesson");
}

{
  const c = rows.find((x) => x.language === "en" && x.slug === MD5_CONTROL.slug);
  const probe = c || (await rest("lessons?select=content_md&language=eq.en&slug=eq." + MD5_CONTROL.slug))[0];
  if (!probe) { console.error("MD5 CONTROL: probe row not found."); process.exit(2); }
  const got = md5_8(probe.content_md);
  if (got !== MD5_CONTROL.expect) {
    console.error("MD5 CONTROL FAILED: computed " + got + ", Postgres gives " + MD5_CONTROL.expect + ".");
    process.exit(2);
  }
  console.log("  md5 control: node and Postgres agree (" + got + ")");
}
console.log("");

const staged = [], problems = [];
for (const r of targets) {
  const tag = r.slug + " " + r.language;
  const en = enOf.get(r.lesson_group_id);
  if (!en) { problems.push(tag + ": no English sibling"); continue; }
  const need = MUST_CONTAIN[r.slug + "|" + r.language];
  if (!need) { problems.push(tag + ": no declared replacement for this row"); continue; }
  if (!r.content_md.includes(need)) { problems.push(tag + ": the director's replacement is NOT in the live body"); continue; }
  const left = MUST_NOT_CONTAIN.filter((x) => r.content_md.includes(x));
  if (left.length) { problems.push(tag + ": still attributes the rule to ISO 19011 " + JSON.stringify(left)); continue; }
  staged.push({ r, en, tag });
}
if (problems.length) {
  console.log("REFUSING -- nothing written:");
  for (const p of problems) console.log("  " + p);
  process.exitCode = 1;
} else {
  for (const s of staged) {
    s.tr_hash = await trHash(s.r.content_md);
    s.en_hash = md5_8(s.en.content_md);
    if (typeof s.tr_hash !== "string" || !/^[0-9a-f]{8}$/.test(s.tr_hash)) {
      problems.push(s.tag + ": translation_hash returned " + JSON.stringify(s.tr_hash));
    }
  }
  if (problems.length) {
    console.log("REFUSING -- a hash could not be computed with the gate's function:");
    for (const p of problems) console.log("  " + p);
    process.exitCode = 1;
  } else {
    for (const s of staged) console.log("  ok    " + s.tag.padEnd(50) + "en " + s.en_hash + "  tr " + s.tr_hash);

    if (!APPLY) {
      console.log("");
      console.log("DRY RUN. Nothing written. Re-run with --apply.");
    } else {
      const now = new Date().toISOString();
      await rest("lesson_translation_reviews", {
        method: "POST", headers: { Prefer: "return=minimal" },
        body: JSON.stringify(staged.map((s) => ({
          lesson_id: s.r.id, reviewed_at: now, reviewed_by: REVIEWER, verdict: "approved",
          en_hash: s.en_hash, tr_hash: s.tr_hash, tr_hash_basis: "observed", note: NOTE,
        }))),
      });
      console.log("");
      console.log("  " + staged.length + " review row(s) written");
      let serving = 0;
      const still = [];
      for (const s of staged) {
        const ok = await rest("rpc/lesson_body_is_servable", {
          method: "POST", body: JSON.stringify({ p_lesson_id: s.r.id }) });
        if (ok) serving++; else still.push(s.tag);
      }
      console.log("  serving now: " + serving + " of " + staged.length);
      for (const t of still) console.log("      still held: " + t);
    }
  }
}
