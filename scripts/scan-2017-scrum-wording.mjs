/**
 * scan-2017-scrum-wording.mjs -- prior-edition Scrum vocabulary across the Scrum family.
 *
 * READ-ONLY. NO MODEL CALL. Text search only. Ruled PROMPT-148 s3.
 *
 *   --certs A,B      default: the four Scrum certifications
 *   --include-retired  also scan retired rows, to show what the retirements removed
 *
 * ============ A RETIRED TERM IS NOT AUTOMATICALLY A DEFECT ============
 *
 * Migration 298 added `retired_vocabulary_intent` for exactly this (the LESSONS field is named
 * teaches_retired_vocabulary; the item column is not): an item whose SUBJECT is that a
 * term was superseded must quote it, and removing it destroys the item. verify-cert's own s8.1 check
 * reports these and says so ("NOISY BY DESIGN, read each"). This scan therefore reports the flag
 * alongside every hit rather than counting hits as errors.
 *
 * `role` and `ceremony` are deliberately NOT scanned: verify-cert already found they are ordinary
 * language as often as the retired usage, and a hard pattern on them failed correct content six
 * times in seven. This scan sticks to terms that are unambiguously 2017-or-earlier.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

const LANGS = ["en", "es-419", "pt-BR"];
let CERTS = ["SM-AI-I", "SM-AI-II", "SPO-AI-I", "SD-AI-I"], INCLUDE_RETIRED = false, m;
for (const a of process.argv.slice(2)) {
  if ((m = /^--certs=(.+)$/.exec(a))) { CERTS = m[1].split(",").map((s) => s.trim()); continue; }
  if (a === "--include-retired") { INCLUDE_RETIRED = true; continue; }
  console.error("scan-2017-scrum-wording: unrecognised flag " + a);
  console.error("  [--certs=A,B] [--include-retired]   READ-ONLY, no model call");
  process.exitCode = 2; process.exit();
}

/* Whole words, case-insensitive. `\b` is unreliable next to accented letters in some engines, so the
 * boundaries are explicit character classes over Unicode letters. */
const B = "(?<![\\p{L}\\p{N}_])";
const E = "(?![\\p{L}\\p{N}_])";
const TERMS = [
  /* ---- the director's list ---- */
  ["en", "Development Team", B + "Development Team" + E],
  ["en", "self-organizing / self-organising", B + "self[-\\s]?organi[sz]ing" + E],
  ["en", "servant-leader / servant leader", B + "servant[-\\s]leader" + E],
  ["es-419", "Equipo de Desarrollo", B + "Equipo de Desarrollo" + E],
  ["es-419", "autoorganizado / auto-organizado", B + "auto[-\\s]?organizad[oa]s?" + E],
  ["es-419", "lider servicial / lider-servidor", B + "l[ií]der[-\\s](servicial|servidor)" + E],
  ["pt-BR", "Time / Equipe de Desenvolvimento", B + "(Time|Equipe) de Desenvolvimento" + E],
  ["pt-BR", "auto-organizado / auto-organizavel", B + "auto[-\\s]?organiz[aá]?(d[oa]s?|vel|veis)" + E],
  ["pt-BR", "lider servidor", B + "l[ií]der[-\\s]servidor" + E],
  /* ---- OTHER 2017-ONLY TERMS, each named ----
   * "three questions": the 2017 Daily Scrum prescribed them; 2020 removed the prescription.
   * "ScrumMaster" as one word: 2017 house style; 2020 writes "Scrum Master".
   * "grooming": Product Backlog grooming, renamed refinement before 2017 and still common in legacy
   *   material.
   * "three roles": 2020 replaced roles with ACCOUNTABILITIES.
   * "Sprint Zero" and "hardening Sprint": never in any edition, and both are legacy practice.
   * "the Development Team commits": 2017 commitment language; 2020 attaches commitments to artifacts. */
  ["en", "three questions (2017 Daily Scrum)", B + "three questions" + E],
  ["en", "ScrumMaster (one word, 2017 style)", B + "ScrumMaster" + E],
  ["en", "grooming (renamed refinement)", B + "groom(ing|ed)?" + E],
  ["en", "three roles (2020: accountabilities)", B + "three roles" + E],
  ["en", "Sprint Zero", B + "Sprint Zero" + E],
  ["en", "hardening Sprint", B + "hardening Sprint" + E],
  ["es-419", "tres preguntas (Daily 2017)", B + "tres preguntas" + E],
  ["es-419", "tres roles (2020: responsabilidades)", B + "tres roles" + E],
  ["es-419", "refinamiento vs grooming", B + "grooming" + E],
  ["pt-BR", "tres perguntas (Daily 2017)", B + "tr[eê]s perguntas" + E],
  ["pt-BR", "tres papeis (2020: responsabilidades)", B + "tr[eê]s pap[eé]is" + E],
  ["pt-BR", "grooming", B + "grooming" + E],
];
const COMPILED = TERMS.map(([lang, name, src]) => ({ lang, name, re: new RegExp(src, "giu") }));

const KEY = requireKey(dirname(fileURLToPath(import.meta.url)));
const certs = await getAll(KEY, "certifications?select=id,code&order=code");
const pubGroups = new Set((await getAll(KEY, "quiz_questions?select=question_group_id&visibility=eq.public&order=id"))
  .map((q) => q.question_group_id));

const rows = [];
for (const code of CERTS) {
  const c = certs.find((x) => x.code === code);
  if (!c) { console.error("no certification " + code); continue; }
  const qs = await getAll(KEY, "quiz_questions?select=id,language,pool,status,retired_at,options," +
    "question_text,explanation,question_group_id,retired_vocabulary_intent,retire_reason" +
    "&certification_id=eq." + c.id + "&order=id");
  for (const q of qs) {
    const isLive = q.retired_at === null && q.status === "approved";
    if (!isLive && !INCLUDE_RETIRED) continue;
    const opts = Array.isArray(q.options) ? q.options : JSON.parse(q.options || "[]");
    const hay = [q.question_text, ...opts.map((o) => o && o.text), q.explanation]
      .filter(Boolean).join("  ");
    for (const t of COMPILED) {
      if (t.lang !== q.language) continue;
      const hits = hay.match(t.re);
      if (!hits) continue;
      rows.push({ cert: code, id: q.id.slice(0, 8), lang: q.language, pool: q.pool,
        live: isLive, term: t.name, n: hits.length,
        flagged: q.retired_vocabulary_intent || "none",
        public: pubGroups.has(q.question_group_id),
        retired_by_us: /^PROMPT-14[78]:/.test(String(q.retire_reason || "")),
        hay });
    }
  }
}

const live = rows.filter((r) => r.live);
console.log("PRIOR-EDITION SCRUM WORDING   " + COMPILED.length + " patterns, whole-word, case-insensitive");
console.log("  scanned: stem + every option + explanation, " + CERTS.join(", "));
console.log("");
console.log("1. HITS ON LIVE ITEMS, per certification x pool x language   (item-term pairs)");
console.log("  cert        pool        " + LANGS.map((l) => l.padStart(9)).join("") + "     total");
for (const code of CERTS) {
  for (const pool of ["secure", "practice"]) {
    const per = LANGS.map((l) => live.filter((r) => r.cert === code && r.pool === pool && r.lang === l).length);
    if (!per.some(Boolean)) continue;
    console.log("  " + code.padEnd(11) + pool.padEnd(11) + per.map((n) => String(n).padStart(9)).join("") +
      String(per.reduce((a, b) => a + b, 0)).padStart(10));
  }
}
console.log("");
console.log("  distinct LIVE items with at least one hit: " + new Set(live.map((r) => r.id)).size);
console.log("  of those, flagged teaches_retired_vocabulary: " +
  new Set(live.filter((r) => r.flagged !== "none").map((r) => r.id)).size);
console.log("");
console.log("2. BY TERM, live only");
const byTerm = new Map();
for (const r of live) byTerm.set(r.term, (byTerm.get(r.term) || 0) + 1);
for (const [t, n] of [...byTerm.entries()].sort((a, b) => b[1] - a[1])) {
  console.log("  " + String(n).padStart(5) + "  " + t);
}
console.log("");
console.log("3. ALREADY RETIRED BY PROMPT-147 / PROMPT-148");
const byUs = rows.filter((r) => r.retired_by_us);
console.log("  item-term pairs on items this work retired: " + byUs.length +
  "   distinct items: " + new Set(byUs.map((r) => r.id)).size);
console.log("");
console.log("4. AMONG THE 72 PUBLIC SAMPLE GROUPS   -- the marketing site");
const pub = live.filter((r) => r.public);
console.log("  item-term pairs: " + pub.length + "   distinct public items: " +
  new Set(pub.map((r) => r.id)).size);
for (const r of pub) {
  console.log("    " + r.cert.padEnd(10) + r.id + " " + r.lang.padEnd(8) + r.pool.padEnd(10) +
    r.term + "   flagged=" + r.flagged);
}
console.log("");
console.log("5. TEN EXAMPLE SENTENCES (our own items, not licensed text)");
const seen = new Set();
let shown = 0;
for (const r of live) {
  if (shown >= 10 || seen.has(r.id)) continue;
  seen.add(r.id);
  const re = COMPILED.find((t) => t.name === r.term).re;
  re.lastIndex = 0;
  const mm = re.exec(r.hay);
  if (!mm) continue;
  const at = mm.index;
  const snip = r.hay.slice(Math.max(0, at - 90), at + 110).replace(/\s+/g, " ").trim();
  shown++;
  console.log("  " + shown + ". " + r.cert + " " + r.id + " " + r.lang + "/" + r.pool +
    "   [" + r.term + "]" + (r.flagged !== "none" ? "   flagged=" + r.flagged : ""));
  console.log("     ..." + snip + "...");
}
