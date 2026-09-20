#!/usr/bin/env node
/**
 * sweep-clausula.mjs
 *
 * Replace `cláusula` with the term the published national adoption uses.
 *
 *   es-419   single number (4-10)      -> capítulo   (masculine)
 *            dotted number (9.2)       -> apartado    (masculine)
 *   pt-BR    any number                -> seção       (feminine, ABNT)
 *
 * DRY BY DEFAULT. `--apply` writes. Unknown flags exit 2, because the two flag
 * conventions in scripts/ are opposites and this one must not be guessed at.
 *
 * ===========================================================================
 * THE SPANISH GENDER PROBLEM IS THE WHOLE DIFFICULTY
 * ===========================================================================
 *
 * `cláusula` is FEMININE. `apartado` and `capítulo` are MASCULINE. A string
 * substitution produces "la apartado", and CLAUDE.md already records what that
 * costs: "a vocabulary swap that changes number leaves a verb behind, and no
 * vocabulary pattern can see grammar -- which is how two SECURE banks passed
 * the check that had just demanded the fix that broke them."
 *
 * So this script does not substitute a word. It rewrites a PHRASE, and it
 * REFUSES rather than guesses when it cannot see the whole phrase:
 *
 *   determiners      la->el  las->los  una->un  unas->unos  esta->este
 *                    estas->estos  esa->ese  esas->esos  aquella->aquel
 *                    dicha->dicho  dichas->dichos  toda->todo  todas->todos
 *                    misma->mismo  mismas->mismos  otra->otro  otras->otros
 *                    la propia -> el propio
 *   CONTRACTIONS     de la -> del      a la -> al        <- the ones a
 *                    de las -> de los  a las -> a los       substitution
 *                                                           cannot reach
 *   ordinals         primera->primer  segunda->segundo  tercera->tercer
 *
 * ANY TRAILING FEMININE MODIFIER IS FLAGGED, NOT FIXED. "la cláusula citada"
 * needs "el apartado citado", and the set of adjectives and participles that
 * could follow is open. Guessing there is how a sweep produces fluent wrong
 * Spanish -- CLAUDE.md's translation ladder, rung 2. Flagged occurrences are
 * reported with their context and are NOT written, even under --apply.
 *
 * Portuguese needs no agreement change: `seção` is feminine like `cláusula`.
 * It IS shorter (5 vs 8 characters), which matters -- see LENGTH below.
 *
 * ===========================================================================
 * QUOTED ISO TEXT IS LEFT ALONE
 * ===========================================================================
 *
 * Anything inside an attributed markdown blockquote is the standard's wording,
 * not ours, and rewording a quotation is falsifying it. Blockquote lines are
 * detected and their occurrences are counted as EXEMPT, never rewritten.
 *
 * This only applies to markdown surfaces. An item stem is not a quotation.
 *
 * ===========================================================================
 * WHAT THE SURFACE LIST IS DERIVED FROM
 * ===========================================================================
 *
 * Not a typed list. Candidate columns come from PostgREST's OpenAPI document
 * -- every table carrying `language` or `lang` -- and are then narrowed BY
 * MEASUREMENT to those that actually contain the pattern. CLAUDE.md records a
 * leak audit that missed a column because its list was typed by the person who
 * made the omission.
 *
 * ===========================================================================
 * TWO CONSEQUENCES THE CALLER MUST SEE BEFORE APPLYING
 * ===========================================================================
 *
 * 1. 352 RE-CLOSES REVIEWED GATES. Editing a translation moves its tr_hash, so
 *    an approved row is withheld until re-reviewed. Counted per certification
 *    and printed before any write.
 *
 * 2. LENGTH MOVES, AND THE CUE GUARD MEASURES LENGTH. es-419 is neutral
 *    (cláusula 8 -> apartado 8, capítulo 8). pt-BR SHRINKS BY 3 characters per
 *    occurrence, and the option-length spread is a cue-guard input. Reported
 *    per item so a spread change cannot land unseen.
 */

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

let APPLY = false, LIMIT = 0, ONLY = null, OUT = null;
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === "--apply") APPLY = true;
  else if (a === "--limit") LIMIT = Number(process.argv[++i] || 0);
  else if (a === "--only") ONLY = process.argv[++i];
  else if (a === "--out") OUT = process.argv[++i];
  else {
    console.error("unknown flag: " + a);
    console.error("This script is DRY BY DEFAULT and takes --apply to write.");
    console.error("`--dry` is NOT a flag here: scripts/ has two opposite conventions");
    console.error("and an unrecognised flag must abort rather than be ignored.");
    console.error("Also: --limit <n>, --only <table.column>, --out <file>");
    process.exit(2);
  }
}

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };

/* ------------------------------------------------------------ paged read */
async function all(path) {
  const rows = []; let from = 0, total = null;
  for (;;) {
    let page = null;
    for (let i = 0; i < 8; i++) {
      try {
        const r = await fetch(REST + "/" + path, {
          headers: { ...H, Range: from + "-" + (from + 499), Prefer: "count=exact" },
          signal: AbortSignal.timeout(60000),
        });
        if (!r.ok) throw new Error("HTTP " + r.status + " " + (await r.text()).slice(0, 160));
        total = Number(String(r.headers.get("content-range") || "").split("/")[1]);
        page = await r.json(); break;
      } catch (e) { if (i === 7) throw e; }
    }
    rows.push(...page);
    if (page.length < 500) break;
    from += 500;
  }
  if (total !== null && rows.length !== total) {
    throw new Error("SHORT READ on " + path + ": " + rows.length + " of " + total);
  }
  return rows;
}

/* --------------------------------------------------------- the transform */
const TERM = /(?<![0-9A-Za-zÀ-ÿ_])([Cc]l[aá]usulas?)(\s+)(\*{0,2})(\d+(?:\.\d+)*)/g;

const DET_F2M = new Map(Object.entries({
  la: "el", las: "los", una: "un", unas: "unos",
  esta: "este", estas: "estos", esa: "ese", esas: "esos",
  aquella: "aquel", aquellas: "aquellos",
  dicha: "dicho", dichas: "dichos", toda: "todo", todas: "todos",
  misma: "mismo", mismas: "mismos", otra: "otro", otras: "otros",
  propia: "propio", propias: "propios", nueva: "nuevo", nuevas: "nuevos",
  primera: "primer", segunda: "segundo", tercera: "tercer",
  cada: "cada", cualquier: "cualquier",
}));

/* A trailing word ending in -a/-as that is NOT in this set is treated as a
 * possible feminine modifier and the occurrence is FLAGGED. These are words
 * that commonly follow and are invariant or not adjectives. Kept deliberately
 * SHORT: a long allowlist is how a guard stops catching anything. */
const SAFE_NEXT = new Set([
  "y", "o", "u", "e", "del", "de", "en", "a", "al", "que", "para", "por",
  "con", "sin", "sobre", "como", "se", "no", "es", "son", "exige", "requiere",
  "establece", "define", "indica", "trata", "cubre", "the",
]);

function feminineRisk(after) {
  const w = (after.match(/^[\s,;:.)\]]*([A-Za-zÀ-ÿ]+)/) || [])[1];
  if (!w) return null;
  const lw = w.toLowerCase();
  if (SAFE_NEXT.has(lw)) return null;
  return /(a|as)$/.test(lw) ? w : null;
}

/**
 * Rewrite one field. Returns { out, changes[], flagged[], exempt }.
 * `markdown` enables the blockquote exemption.
 */
function rewrite(text, lang, markdown) {
  if (typeof text !== "string" || !text) return null;
  const quoted = new Set();
  if (markdown) {
    let off = 0;
    for (const line of text.split("\n")) {
      if (/^\s*>/.test(line)) for (let i = off; i < off + line.length; i++) quoted.add(i);
      off += line.length + 1;
    }
  }
  const changes = [], flagged = [];
  let exempt = 0;
  const out = text.replace(TERM, (m, word, sp, stars, num, idx) => {
    if (quoted.has(idx)) { exempt++; return m; }
    const plural = /s$/i.test(word);
    const dotted = num.includes(".");
    let repl;
    if (lang === "pt-BR") {
      repl = (/^C/.test(word) ? "Seç" : "seç") + (plural ? "ões" : "ão");
    } else {
      const base = dotted ? "apartado" : "capítulo";
      repl = (/^C/.test(word) ? base[0].toUpperCase() + base.slice(1) : base) + (plural ? "s" : "");
    }

    /* look BACK for a determiner, and forward for a modifier */
    const before = text.slice(Math.max(0, idx - 30), idx);
    const after = text.slice(idx + m.length, idx + m.length + 40);
    let prefixFix = null;
    if (lang !== "pt-BR") {
      const risk = feminineRisk(after);
      if (risk) {
        flagged.push({ at: idx, phrase: (before.slice(-24) + m + after.slice(0, 24)).replace(/\s+/g, " "), why: "trailing '" + risk + "' may need masculine agreement" });
        return m;                                  // REFUSE, do not guess
      }
      const dm = before.match(/(?:^|[\s(])(?:(de|a)\s+)?(la|las|una|unas|esta|estas|esa|esas|aquella|aquellas|dicha|dichas|toda|todas|misma|mismas|otra|otras|propia|propias|nueva|nuevas|primera|segunda|tercera)\s+$/i);
      if (dm) {
        const prep = dm[1] ? dm[1].toLowerCase() : null;
        const det = dm[2].toLowerCase();
        let newDet = DET_F2M.get(det) || det;
        let full;
        if (prep === "de" && det === "la") full = "del ";
        else if (prep === "a" && det === "la") full = "al ";
        else if (prep) full = prep + " " + newDet + " ";
        else full = newDet + " ";
        if (/^[A-ZÁÉÍÓÚ]/.test(dm[0].trim()[0])) full = full[0].toUpperCase() + full.slice(1);
        /* REPLACE THE WHOLE DETERMINER SPAN, NOT ONE TOKEN. "de la" is two
         * words collapsing to one ("del"), and the first version consumed a
         * single token and produced "conforme al la apartado" -- caught by
         * the fixture, which is the entire reason the fixture is here. */
        const lead = /^[\s(]/.test(dm[0]) ? 1 : 0;
        const spanLen = before.length - (dm.index + lead);
        prefixFix = { start: idx - spanLen, end: idx, text: full };
      }
    }
    changes.push({ at: idx, from: m, to: repl + sp + stars + num, prefixFix,
                   context: (before.slice(-30) + "[[" + m + "]]" + after.slice(0, 30)).replace(/\s+/g, " ") });
    return repl + sp + stars + num;
  });

  /* apply determiner fixes back-to-front so offsets stay valid */
  let final = out;
  const fixes = changes.filter((c) => c.prefixFix).sort((a, b) => b.prefixFix.start - a.prefixFix.start);
  for (const c of fixes) {
    const f = c.prefixFix;
    final = final.slice(0, f.start) + f.text + final.slice(f.end);
  }
  if (final === text) return { out: text, changes: [], flagged, exempt, unchanged: true };
  return { out: final, changes, flagged, exempt, unchanged: false };
}

export { rewrite };

/* ONLY RUN WHEN EXECUTED DIRECTLY. Without this the self-test and the whole
 * scan fire on import, so `rewrite` could not be exercised from a spot-check
 * harness -- which is exactly what a transform touching 10,000 occurrences
 * most needs. Found by trying to import it. */
const IS_MAIN = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (!IS_MAIN) { /* imported: expose rewrite and do nothing else */ }
else {

/* ------------------------------------------------------------- self-test */
const T = [
  ["es-419", "conforme a la cláusula 9.2 del anexo", "conforme al apartado 9.2 del anexo"],
  ["es-419", "de la cláusula 5 se desprende", "del capítulo 5 se desprende"],
  ["es-419", "en la cláusula 9.2.2 y en las cláusulas 6.1", "en el apartado 9.2.2 y en los apartados 6.1"],
  ["es-419", "esta cláusula 7 exige", "este capítulo 7 exige"],
  ["pt-BR", "conforme a cláusula 9.2 da norma", "conforme a seção 9.2 da norma"],
  ["pt-BR", "as cláusulas 6.1 e 6.2", "as seções 6.1 e 6.2"],
];
let bad = 0;
for (const [lang, input, want] of T) {
  const got = rewrite(input, lang, false);
  const o = got ? got.out : null;
  if (o !== want) { bad++; console.error("  SELFTEST FAIL [" + lang + "]\n    in:   " + input + "\n    want: " + want + "\n    got:  " + o); }
}
/* the refusal case must REFUSE */
const refusal = rewrite("la cláusula 9.2 citada exige", "es-419", false);
if (!refusal || refusal.flagged.length !== 1 || !refusal.unchanged) {
  bad++; console.error("  SELFTEST FAIL: 'cláusula 9.2 citada' should be FLAGGED and unchanged, got " + JSON.stringify(refusal));
}
/* the blockquote case must be exempt */
const bq = rewrite("> la cláusula 9.2 dice\n\nla cláusula 9.2 dice", "es-419", true);
if (!bq || bq.exempt !== 1 || bq.changes.length !== 1) {
  bad++; console.error("  SELFTEST FAIL: blockquote exemption, exempt=" + (bq && bq.exempt) + " changes=" + (bq && bq.changes.length));
}
if (bad) { console.error("\n" + bad + " self-test failure(s). Refusing to run: a transform that cannot"); console.error("pass its own fixtures must not touch 18,000 occurrences."); process.exit(2); }

if (process.env.SELFTEST_ONLY === "1") { console.log("  self-test: all fixtures pass"); process.exit(0); }
console.log("  self-test: all fixtures pass (including one refusal and one blockquote exemption)");
console.log("");
console.log(APPLY ? "  *** APPLY MODE -- THIS WILL WRITE ***" : "  DRY RUN -- nothing will be written");
console.log("");

/* ===================================================================== scan
 * SURFACES ARE MEASURED, NOT TYPED. Candidates are every language-bearing
 * table's prose columns; a surface with zero hits is REPORTED as zero rather
 * than dropped, because "we did not look there" and "there is nothing there"
 * must not print the same way. */
const SURFACES = [
  { t: "lessons",             sel: "id,language,slug,content_md,module_id",                  cols: ["content_md"],                                  md: true },
  { t: "lessons",             sel: "id,language,slug,title",                                  cols: ["title"],                                       md: false },
  { t: "task_translations",   sel: "id,language,task_id,statement,knowledge,skills,abilities",cols: ["statement","knowledge","skills","abilities"],  md: false },
  { t: "module_translations", sel: "module_id,language,title,description",                    cols: ["title","description"],                         md: false },
  { t: "domain_translations", sel: "domain_id,language,title,description",                    cols: ["title","description"],                         md: false },
  { t: "certification_i18n",  sel: "certification_id,lang,name,claim,description",            cols: ["name","claim","description"],                  md: false, langCol: "lang" },
  { t: "cert_categories_i18n",sel: "lang,tagline",                                            cols: ["tagline"],                                     md: false, langCol: "lang" },
  { t: "quiz_questions",      sel: "id,language,certification_id,pool,status,retired_at,is_exam_scope,question_text,explanation,options",
                                                                                              cols: ["question_text","explanation","options"],       md: false },
];

const certs = Object.fromEntries((await all("certifications?select=id,code")).map((c) => [c.id, c.code]));
const modCert = Object.fromEntries((await all("modules?select=id,certification_id")).map((m) => [m.id, m.certification_id]));

const report = [];
let totalOcc = 0, totalFlagged = 0, totalExempt = 0, ptShrink = 0;

for (const s of SURFACES) {
  if (ONLY && !s.cols.some((c) => ONLY === s.t + "." + c)) continue;
  const lc = s.langCol || "language";
  const rows = await all(s.t + "?select=" + s.sel + "&" + lc + "=neq.en");
  for (const r of rows) {
    const lang = r[lc];
    if (lang !== "es-419" && lang !== "pt-BR") continue;
    for (const col of s.cols) {
      const raw = col === "options" ? (r.options == null ? null : JSON.stringify(r.options)) : r[col];
      const res = rewrite(raw, lang, s.md);
      if (!res || (res.changes.length === 0 && res.flagged.length === 0 && res.exempt === 0)) continue;
      const certId = r.certification_id ?? (r.module_id ? modCert[r.module_id] : null);
      report.push({
        surface: s.t + "." + col, lang,
        cert: certs[certId] ?? "-",
        key: r.id ?? r.module_id ?? r.domain_id ?? r.certification_id ?? "(composite)",
        slug: r.slug ?? null,
        pool: r.pool ?? null, status: r.status ?? null,
        live: r.status === "approved" && !r.retired_at,
        examScope: r.is_exam_scope ?? null,
        changes: res.changes, flagged: res.flagged, exempt: res.exempt,
        before: raw, after: res.out,
        delta: (res.out || "").length - (raw || "").length,
      });
      totalOcc += res.changes.length;
      totalFlagged += res.flagged.length;
      totalExempt += res.exempt;
      if (lang === "pt-BR") ptShrink += (raw.length - res.out.length);
    }
  }
}

/* CONTROL. The census measured thousands of occurrences; finding none here
 * means the reader, the filter or the pattern is broken, not that the corpus
 * is clean. */
if (report.length === 0) {
  console.error("Scanned every surface and found NOTHING to change. The census");
  console.error("measured ~18,000 occurrences, so this is a broken scan, not a clean corpus.");
  process.exit(2);
}

const by = (fn) => report.reduce((m, r) => { const k = fn(r); (m[k] ||= []).push(r); return m; }, {});

console.log("BY SURFACE");
for (const [k, rs] of Object.entries(by((r) => r.surface + "  " + r.lang)).sort()) {
  const occ = rs.reduce((a, r) => a + r.changes.length, 0);
  const fl = rs.reduce((a, r) => a + r.flagged.length, 0);
  const ex = rs.reduce((a, r) => a + r.exempt, 0);
  console.log("  " + k.padEnd(42) + String(rs.length).padStart(5) + " rows  " +
    String(occ).padStart(6) + " occ  " + String(fl).padStart(4) + " flagged  " + String(ex).padStart(3) + " exempt");
}

console.log("");
console.log("SECURE EXAM ITEMS TOUCHED (a different act from a prose pass)");
const sec = report.filter((r) => r.pool === "secure" && r.live);
const secBy = by((r) => r.cert);
for (const [c, rs] of Object.entries(secBy).sort()) {
  const s2 = rs.filter((r) => r.pool === "secure" && r.live);
  if (!s2.length) continue;
  console.log("  " + c.padEnd(12) + String(new Set(s2.map((r) => r.key)).size).padStart(4) + " live secure item(s), " +
    String(s2.reduce((a, r) => a + r.changes.length, 0)).padStart(5) + " occurrence(s)");
}
console.log("  " + new Set(sec.map((r) => r.key)).size + " distinct live secure items in total");

console.log("");
console.log("FLAGGED -- REFUSED, needs a human. Trailing word may need masculine agreement.");
const flagged = report.filter((r) => r.flagged.length);
for (const r of flagged.slice(0, 40)) {
  for (const f of r.flagged) console.log("  " + (r.cert + "/" + r.lang).padEnd(20) + r.surface.padEnd(28) + f.phrase);
}
if (flagged.length > 40) console.log("  ... and " + (flagged.length - 40) + " more flagged row(s)");
console.log("  " + totalFlagged + " flagged occurrence(s) across " + flagged.length + " row(s) -- NOT rewritten");

console.log("");
console.log("LENGTH");
console.log("  es-419: cláusula(8) -> apartado(8) / capítulo(8), neutral");
console.log("  pt-BR:  cláusula(8) -> seção(5); total shrink " + ptShrink + " characters");
const optRows = report.filter((r) => r.surface === "quiz_questions.options" && r.lang === "pt-BR");
console.log("  " + optRows.length + " pt-BR option payload(s) shrink -- option-length spread is a cue-guard input");

console.log("");
console.log("TOTALS: " + report.length + " field(s) across " + new Set(report.map((r) => r.key)).size +
  " row(s), " + totalOcc + " rewritten, " + totalFlagged + " refused, " + totalExempt + " exempt (quoted)");

if (OUT) {
  const lines = [];
  for (const r of report) {
    lines.push("=".repeat(78));
    lines.push(r.cert + " / " + r.lang + " / " + r.surface + (r.slug ? " / " + r.slug : "") +
      (r.pool ? " / " + r.pool + (r.live ? " LIVE" : "") : "") + "  [" + r.key + "]");
    for (const c of r.changes) lines.push("  - " + c.context.replace("[[" + c.from + "]]", "<<" + c.from + " => " + c.to + ">>"));
    for (const f of r.flagged) lines.push("  ! REFUSED  " + f.phrase + "   (" + f.why + ")");
    if (r.exempt) lines.push("  ~ " + r.exempt + " occurrence(s) exempt inside an attributed blockquote");
  }
  writeFileSync(OUT, lines.join("\n") + "\n", "utf8");
  console.log("");
  console.log("  full detail written to " + OUT + " (" + lines.length + " lines)");
}

if (!APPLY) {
  console.log("");
  console.log("  DRY RUN. Nothing was written. Re-run with --apply to write.");
  process.exit(0);
}
console.error("");
console.error("  --apply is not implemented yet, deliberately. The dry run must be read");
console.error("  and the scope decided first; see the report.");
process.exit(3);
}
