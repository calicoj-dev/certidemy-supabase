#!/usr/bin/env node
/**
 * pin-glossary-autofix.mjs -- apply the glossary's declared one-to-one substitutions to translated
 * item text.
 *
 * DRY BY DEFAULT. `--apply` to write. Unknown flags exit 2.
 *
 *   --apply            write
 *   --term=<key>       restrict to one term key (default: every term with autofix true)
 *   --cert=<CODE>      restrict to one certification
 *
 * ============ IT IS DRIVEN BY THE GLOSSARY, SO IT CANNOT DRIFT FROM THE LINT ============
 *
 * The lint reports what is wrong and this writes the fix, and both read
 * `scripts/lib/translation-glossary.json` through `translation-term-lint.mjs`. A second hand-written
 * list of terms would agree today and diverge at the first edit -- the defect this repository records
 * as `convem` being in the inflation check's vocabulary and not in the weak list the profile reads.
 *
 * In particular the REGULATION SCOPE is not reimplemented here. A row is eligible only if `lintRow`
 * put the variant in `forbidden` for that row, which is the same predicate the gate blocks on. So a
 * `fornecedor` that is a commercial vendor, or an `implantador` in a row that never mentions the
 * Regulation, is not eligible and this script cannot reach it however its flags are set.
 *
 * ============ A VARIANT WITHOUT A DECLARED TARGET IS REFUSED, NEVER GUESSED ============
 *
 * The house form is ONE string per term and that is not enough to substitute with. `implantadores` is
 * plural against a singular house form; `credenciada` is an adjective against a noun. So the target
 * comes from `autofix_to[lang][variant]`, and a variant with `autofix` true and no declared target
 * stops the run by name. Falling back to the house form is exactly how `entidade credenciada` would
 * become `entidade acreditação`.
 *
 * ============ LONGEST VARIANT FIRST ============
 *
 * `AI Act` is a substring of `EU AI Act`. Applied shortest-first, `EU AI Act` becomes
 * `EU Regulamento da IA da UE`. Variants are sorted by descending length before substitution and a
 * control asserts that exact case.
 *
 * ============ WHAT THIS DOES NOT DO ============
 *
 * It does not touch a review row. `item_translation_reviews` carries `tr_hash`, and migration 352
 * records that it GATES NOTHING -- no view reads it. So an edit here silently staleds the 30 item
 * reviews it touches and nothing anywhere will withhold the row or say so. That is reported per run
 * rather than repaired, because writing a hash from anywhere but the generator path is the defect
 * `check-hash-writers` exists to catch.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
/* REST_URL comes from `_pg.mjs`, which derives it from the project ref. The first version built the
 * URL from `process.env.SUPABASE_URL`, which nothing in this repository sets -- so the write threw
 * `Failed to parse URL from undefined/rest/v1/...` on the first row. Nothing was written, because it
 * failed before the first PATCH rather than partway through, and the row was read back to confirm
 * that rather than assumed. A second source for a value `_pg.mjs` already exports is the duplication
 * this repository keeps paying for. */
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { lintRow } from "./lib/translation-term-lint.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const GLOSSARY = JSON.parse(readFileSync(join(HERE, "lib", "translation-glossary.json"), "utf8"));

let APPLY = false, ONLY_TERM = null, ONLY_CERT = null;
for (const a of process.argv.slice(2)) {
  let m;
  if (a === "--apply") { APPLY = true; continue; }
  if ((m = /^--term=(.+)$/.exec(a))) { ONLY_TERM = m[1]; continue; }
  if ((m = /^--cert=(.+)$/.exec(a))) { ONLY_CERT = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply, --term=, --cert=");
  console.error("DRY BY DEFAULT; --apply to write. NOTE: some scripts here take --dry and are LIVE");
  console.error("without it. This is not one.");
  process.exitCode = 2; process.exit();
}

for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  try {
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* no .env here */ }
}

const LANG_KEY = { "es-419": "es", "pt-BR": "pt" };
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const B = "\\w\\-áéíóúâêôãõçüñ";
const variantRe = (s, caseSensitive) =>
  new RegExp("(?<![" + B + "])" + esc(s) + "(?![" + B + "])", caseSensitive ? "g" : "gi");
const isMiscasing = (variant, house) =>
  Boolean(house) && variant.toLowerCase() === String(house).toLowerCase() && variant !== house;

/** Every term declared auto-fixable, with its per-variant targets, longest variant first. */
function autofixPlan() {
  const out = [];
  for (const [family, fam] of Object.entries(GLOSSARY.families)) {
    for (const t of fam.terms || []) {
      for (const lang of ["es", "pt"]) {
        if (!(t.autofix && t.autofix[lang] === true)) continue;
        if (ONLY_TERM && t.key !== ONLY_TERM) continue;
        /* ============ UNREACHABLE IS NOT THE SAME STATE AS UNDECLARED ============
         *
         * Only a `failure` term ever lands in `forbidden`, so a `flag` term with autofix true can
         * never be eligible however this runs. The first version reported it as a missing TARGET,
         * which names the wrong cause and would send someone to declare a substitution for a term
         * that was deliberately ruled not to have one -- `alto risco` is ordinary Portuguese and was
         * ruled a flag on purpose. Two causes, two messages. */
        if (t.severity !== "failure") {
          console.error("CONTRADICTION in the glossary: " + family + "." + t.key + " is severity `" +
            t.severity + "` and autofix " + lang + " is true.");
          console.error("  A flag-severity term never reaches FORBIDDEN, so this can never fire.");
          console.error("  Set autofix false, or raise the severity -- do not declare a target for it.");
          process.exitCode = 3; process.exit();
        }
        const targets = (t.autofix_to || {})[lang] || {};
        const variants = ((t.forbidden || {})[lang] || []).slice()
          .sort((a, b) => b.length - a.length);
        for (const v of variants) {
          if (!targets[v]) {
            console.error("REFUSED: " + family + "." + t.key + " declares autofix for " + lang +
              " but no target for the variant " + JSON.stringify(v) + ".");
            console.error("  A target is declared in `autofix_to`, never derived from the house form:");
            console.error("  a plural or an adjective would be substituted with a singular noun.");
            process.exitCode = 3; process.exit();
          }
        }
        out.push({ family, key: t.key, lang, scope: fam.scope, variants,
          targets, house: t[lang], caseSensitive: {} });
        const last = out[out.length - 1];
        for (const v of variants) last.caseSensitive[v] = isMiscasing(v, t[lang]);
      }
    }
  }
  return out;
}

/* ============ A PARENTHETICAL GLOSS IS NOT AN INCONSISTENCY ============
 *
 * `Sob o Regulamento Europeu de IA (EU AI Act), ...` names the Act in Portuguese and then gives the
 * well-known English name in brackets, which is what a gloss is for. Substituting it produces
 * `Regulamento Europeu de IA (Regulamento da IA da UE)` -- a tautology, in secure examination content.
 *
 * Found by the 20-row read of the dry run, not by any count. Measured before excluding: **5 of 188
 * occurrences**, every one of them directly after a house-form mention, all on AIGRM-I. The exclusion
 * is stated with what falls inside it rather than left as a silent skip.
 *
 * Note for a separate ruling, not acted on here: those rows say `Regulamento Europeu de IA`, while the
 * glossary's declared house form is `Regulamento da IA da UE`. The corpus carries a second rendering of
 * the house term itself, which is a content question rather than a substitution one. */
const glossExclusions = [];
function isParentheticalGloss(s, index, len) {
  const before = s.slice(Math.max(0, index - 60), index);
  const after = s.slice(index + len, index + len + 3);
  if (!/\(\s*$/.test(before) || !/^\s*\)/.test(after)) return false;
  return /(Regulamento|Reglamento|Lei|Ley)\b[^()]{0,45}$/i.test(before.replace(/\(\s*$/, ""));
}

/** Substitute every declared variant, longest first. Returns the new text and a per-variant count. */
function substitute(text, plan) {
  let s = String(text);
  const counts = {};
  for (const v of plan.variants) {
    const re = variantRe(v, plan.caseSensitive[v]);
    let out = "", last = 0, n = 0, m;
    re.lastIndex = 0;
    while ((m = re.exec(s))) {
      if (isParentheticalGloss(s, m.index, m[0].length)) {
        glossExclusions.push(v);
        continue;                                   /* left exactly as written */
      }
      out += s.slice(last, m.index) + plan.targets[v];
      last = m.index + m[0].length;
      n++;
    }
    if (!n) continue;
    s = out + s.slice(last);
    counts[v] = (counts[v] || 0) + n;
  }
  return { text: s, counts };
}

/* ============ CONTROLS, BOTH DIRECTIONS, BEFORE ANYTHING IS READ OR WRITTEN ============ */
function controls() {
  const fails = [];
  const mk = (variants, targets, cs = {}) => ({ variants: variants.slice().sort((a, b) => b.length - a.length),
    targets, caseSensitive: cs });

  /* longest first: AI Act must not fire inside EU AI Act */
  const act = mk(["AI Act", "EU AI Act"],
    { "AI Act": "Regulamento da IA da UE", "EU AI Act": "Regulamento da IA da UE" });
  const r1 = substitute("O EU AI Act exige registro.", act);
  if (r1.text !== "O Regulamento da IA da UE exige registro.") {
    fails.push("longest-first failed: " + JSON.stringify(r1.text));
  }

  /* the plural takes its own target */
  const dep = mk(["implantador", "implantadores"],
    { implantador: "responsável pela implantação", implantadores: "responsáveis pela implantação" });
  const r2 = substitute("Os implantadores e o implantador.", dep);
  if (r2.text !== "Os responsáveis pela implantação e o responsável pela implantação.") {
    fails.push("plural/singular targets failed: " + JSON.stringify(r2.text));
  }

  /* a mis-casing is case-sensitive, so the CORRECT form is left alone */
  const ac = mk(["SGia", "SGSIA"], { SGia: "SGIA", SGSIA: "SGIA" }, { SGia: true, SGSIA: false });
  const r3 = substitute("El SGIA y el SGia y el SGSIA.", ac);
  if (r3.text !== "El SGIA y el SGIA y el SGIA.") {
    fails.push("mis-casing handling failed: " + JSON.stringify(r3.text));
  }

  /* a word boundary: SGIAX is not SGIA, and implantadores is not implantador */
  const r4 = substitute("SGSIAX permanece.", ac);
  if (r4.text !== "SGSIAX permanece.") fails.push("a variant matched inside a longer word");

  /* NEGATIVE: nothing to do leaves the text byte-identical */
  const r5 = substitute("Texto sem nenhum termo.", ac);
  if (r5.text !== "Texto sem nenhum termo." || Object.keys(r5.counts).length) {
    fails.push("a clean string was modified");
  }
  return fails;
}
{
  const f = controls();
  console.log("substitution controls: 5 case(s), " + f.length + " fail");
  if (f.length) { f.forEach((x) => console.error("   " + x)); process.exitCode = 3; process.exit(); }
}

/* ---------------------------------------------------------------- the corpus */
const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&order=code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const SELECT = "id,certification_id,question_group_id,language,pool,status,visibility,is_exam_scope," +
  "question_text,options,explanation";
const rows = await getAll(KEY, "quiz_questions?select=" + SELECT +
  "&status=eq.approved&retired_at=is.null&language=in.(es-419,pt-BR)&order=id");
const enRows = await getAll(KEY, "quiz_questions?select=" + SELECT +
  "&status=eq.approved&retired_at=is.null&language=eq.en&order=id");
const enByGroup = new Map();
for (const r of enRows) if (r.question_group_id && !enByGroup.has(r.question_group_id)) enByGroup.set(r.question_group_id, r);

const PLANS = autofixPlan();
console.log("");
console.log("AUTOFIXABLE TERMS DECLARED IN THE GLOSSARY");
for (const p of PLANS) console.log("  " + (p.family + "." + p.key).padEnd(30) + p.lang + "   " +
  p.variants.map((v) => v + " -> " + p.targets[v]).join(" | "));

/* ============ ELIGIBILITY IS THE LINT'S OWN FORBIDDEN VERDICT ============ */
const edits = [];
for (const r of rows) {
  const code = codeOf.get(r.certification_id);
  if (!code || (ONLY_CERT && code !== ONLY_CERT)) continue;
  const lk = LANG_KEY[r.language];
  const en = r.question_group_id ? enByGroup.get(r.question_group_id) || null : null;
  const verdict = lintRow(r, code, en);
  if (!verdict.forbidden.length) continue;
  const eligible = PLANS.filter((p) => p.lang === lk &&
    verdict.forbidden.some((f) => f.key === p.key && p.variants.includes(f.variant)));
  if (!eligible.length) continue;

  const next = { question_text: r.question_text, options: r.options, explanation: r.explanation };
  const counts = {};
  let changed = false;
  for (const p of eligible) {
    /* only the variants this row was actually FLAGGED for; a variant the scope rule downgraded
     * to a flag on this row is left alone, which is the whole point of reading the verdict. */
    const flagged = new Set(verdict.forbidden.filter((f) => f.key === p.key).map((f) => f.variant));
    const sub = { ...p, variants: p.variants.filter((v) => flagged.has(v)) };
    if (!sub.variants.length) continue;
    const q = substitute(next.question_text, sub);
    const e = substitute(next.explanation, sub);
    next.question_text = q.text; next.explanation = e.text;
    if (Array.isArray(next.options)) {
      next.options = next.options.map((o) => {
        if (!o || typeof o.text !== "string") return o;
        const s = substitute(o.text, sub);
        for (const [k, v] of Object.entries(s.counts)) counts[k] = (counts[k] || 0) + v;
        return s.text === o.text ? o : { ...o, text: s.text };
      });
    }
    for (const [k, v] of Object.entries(q.counts)) counts[k] = (counts[k] || 0) + v;
    for (const [k, v] of Object.entries(e.counts)) counts[k] = (counts[k] || 0) + v;
  }
  changed = next.question_text !== r.question_text || next.explanation !== r.explanation ||
    JSON.stringify(next.options) !== JSON.stringify(r.options);
  if (changed) edits.push({ row: r, code, next, counts });
}

/* ============ THE CENSUS AGREES WITH THE LINT, OR NOTHING IS WRITTEN ============ */
const lintPath = join(ROOT, "TRANSLATION-LINT.json");
let lintAgrees = "not checked";
try {
  const L = JSON.parse(readFileSync(lintPath, "utf8"));
  const keys = new Set(PLANS.map((p) => p.key));
  const expect = L.findings.filter((f) => f.cls === "forbidden" && keys.has(f.key) &&
    (!ONLY_CERT || f.code === ONLY_CERT) &&
    PLANS.some((p) => p.key === f.key && p.variants.includes(f.variant)))
    .reduce((n, f) => n + f.n, 0);
  const mine = edits.reduce((n, e) => n + Object.values(e.counts).reduce((a, b) => a + b, 0), 0);
  /* The lint counts every forbidden occurrence; this run DELIBERATELY leaves the parenthetical
   * glosses. So the identity is substituted + excluded = lint, and the exclusion is named in it
   * rather than the tolerance being widened -- a gate loosened to accommodate a known skip stops
   * being able to see an unknown one. */
  const skipped = glossExclusions.length;
  lintAgrees = expect === mine + skipped
    ? "yes (" + mine + " substituted + " + skipped + " gloss(es) left = " + expect + ")"
    : "NO: lint " + expect + ", this run " + mine + " + " + skipped + " excluded";
  if (expect !== mine + skipped) {
    console.error("");
    console.error("CENSUS DISAGREES WITH THE LINT -- nothing written.");
    console.error("  lint says " + expect + " occurrence(s); this run substitutes " + mine +
      " and deliberately leaves " + skipped + ".");
    console.error("  Re-run lint-translation-terms.mjs first; if they still disagree, one of the two");
    console.error("  is wrong and a bulk write is the last thing that should happen.");
    process.exitCode = 3; process.exit();
  }
} catch (e) {
  console.error("could not read TRANSLATION-LINT.json to cross-check: " + String(e.message).slice(0, 90));
  console.error("The census agreement is what licenses a bulk write. Run the lint first.");
  process.exitCode = 3; process.exit();
}

/* ---------------------------------------------------------------- report */
const perCell = new Map();
for (const e of edits) {
  for (const [v, n] of Object.entries(e.counts)) {
    /* TAB-joined, not space: a variant can contain spaces (`EU AI Act`), and splitting the key on a
     * space printed it as `EU`. The substitution was right and the report was not, which is the
     * worse of the two to leave -- the report is what gets read before the write is authorised. */
    const k = [e.code, e.row.language, e.row.pool, v].join("\t");
    perCell.set(k, (perCell.get(k) || 0) + n);
  }
}
const occ = edits.reduce((n, e) => n + Object.values(e.counts).reduce((a, b) => a + b, 0), 0);
console.log("");
console.log("PLANNED SUBSTITUTIONS   " + occ + " occurrence(s) across " + edits.length + " row(s)");
console.log("  lint census agrees: " + lintAgrees);
console.log("");
console.log("  certification  language  pool      variant            n");
for (const k of [...perCell.keys()].sort()) {
  const [c, l, p, v] = k.split("\t");
  console.log("  " + c.padEnd(15) + l.padEnd(10) + p.padEnd(10) + v.padEnd(19) + perCell.get(k));
}
const secure = edits.filter((e) => e.row.pool === "secure").length;
console.log("");
console.log("  rows in the SECURE pool: " + secure + " of " + edits.length +
  "   (live examination content)");
const scope = { status: new Set(), visibility: new Set(), is_exam_scope: new Set() };
edits.forEach((e) => { scope.status.add(e.row.status); scope.visibility.add(String(e.row.visibility));
  scope.is_exam_scope.add(String(e.row.is_exam_scope)); });
console.log("  every row written carries status=" + [...scope.status].join("/") +
  "  visibility=" + [...scope.visibility].join("/") +
  "  is_exam_scope=" + [...scope.is_exam_scope].join("/"));

/* item reviews this would stale */
try {
  const revs = await getAll(KEY, "item_translation_reviews?select=question_id,verdict&order=question_id");
  const ids = new Set(edits.map((e) => e.row.id));
  const hit = revs.filter((r) => ids.has(r.question_id));
  console.log("  item_translation_reviews on edited rows: " + hit.length +
    "   THESE GO STALE AND NOTHING READS THEM (migration 352: the table gates nothing)");
} catch (e) {
  console.log("  item_translation_reviews: could not read -- " + String(e.message).slice(0, 60));
}

console.log("");
console.log("SAMPLE, 20 rows, before and after");
for (const e of edits.slice(0, 20)) {
  const v = Object.keys(e.counts)[0];
  /* The window is CENTRED ON THE MATCH. Truncating a sentence at 120 characters from its start put
   * the match past the cut on a long stem, so the preview printed a `-` and a `+` that were
   * identical -- a row being changed, previewed as unchanged. */
  const pick = (t) => {
    const s = String(t).split(/(?<=[.!?])\s+/).find((x) => variantRe(v, false).test(x));
    if (!s) return null;
    const flat = s.trim().replace(/\s+/g, " ");
    const at = flat.search(variantRe(v, false));
    if (at < 0) return flat.slice(0, 120);
    const from = Math.max(0, at - 55);
    return (from ? "..." : "") + flat.slice(from, from + 120) + (from + 120 < flat.length ? "..." : "");
  };
  const before = pick(e.row.question_text) || pick(e.row.explanation) ||
    (Array.isArray(e.row.options) ? e.row.options.map((o) => pick((o && o.text) || "")).find(Boolean) : null);
  if (!before) continue;
  /* THE PLAN MUST MATCH THE ROW'S LANGUAGE. Picking the first plan carrying the variant showed a
   * pt-BR row being given the Spanish target -- `(Reglamento de IA de la UE)` inside Portuguese. The
   * write was always language-correct (it filters on `p.lang === lk`); only this preview was not,
   * which is the worse of the two to leave, because the preview is what authorises the write. */
  const plan = PLANS.find((p) => p.lang === LANG_KEY[e.row.language] && p.variants.includes(v));
  if (!plan) continue;
  const after = substitute(before, { ...plan, variants: [v] }).text;
  console.log("  [" + e.code + " " + e.row.language + " " + e.row.pool.slice(0, 4) + "]");
  console.log("    -  " + before);
  console.log("    +  " + after);
}

if (!APPLY) {
  console.log("");
  console.log("DRY RUN -- nothing written. Re-run with --apply.");
  process.exitCode = 0;
} else {
  /* ---------------------------------------------------------------- write */
  const before = new Map(edits.map((e) => [e.row.id, createHash("sha256")
    .update(JSON.stringify([e.row.question_text, e.row.options, e.row.explanation])).digest("hex")]));
  let wrote = 0;
  for (const e of edits) {
    const res = await fetch(REST_URL + "/quiz_questions?id=eq." + e.row.id, {
      method: "PATCH",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
        Prefer: "return=minimal" },
      body: JSON.stringify({ question_text: e.next.question_text, options: e.next.options,
        explanation: e.next.explanation }),
    });
    if (!res.ok) {
      console.error("WRITE FAILED on " + e.row.id + ": " + res.status + " " +
        (await res.text()).slice(0, 160));
      console.error("  " + wrote + " row(s) were written before this. Stopping.");
      process.exitCode = 4; process.exit();
    }
    wrote++;
  }
  console.log("");
  console.log("wrote " + wrote + " row(s). Reading them back.");

  /* ============ READ BACK, AND ASSERT BOTH DIRECTIONS ============ */
  const after = await getAll(KEY, "quiz_questions?select=" + SELECT +
    "&status=eq.approved&retired_at=is.null&language=in.(es-419,pt-BR)&order=id");
  const byId = new Map(after.map((r) => [r.id, r]));
  const fails = [];
  for (const e of edits) {
    const got = byId.get(e.row.id);
    if (!got) { fails.push("row " + e.row.id + " did not come back"); continue; }
    if (got.question_text !== e.next.question_text ||
        got.explanation !== e.next.explanation ||
        JSON.stringify(got.options) !== JSON.stringify(e.next.options)) {
      fails.push("row " + e.row.id + " does not match what was sent");
    }
    /* ============ THE POST-CONDITION MUST KNOW WHAT THE WRITE DELIBERATELY LEFT ============
     *
     * The first version asserted that no substituted variant survives anywhere in the row, and
     * reported 3 failures on a correct write: those rows carry BOTH a substituted occurrence and a
     * parenthetical gloss the substitution is designed to skip. An assertion that does not share the
     * writer's exclusions calls its own correct behaviour a defect -- and a post-condition that cries
     * wolf is one the next person switches off, taking the real check with it.
     *
     * So a surviving occurrence fails only if it is NOT a gloss, which is the same predicate the
     * writer used. Checked per field, because the gloss test needs the surrounding characters. */
    const outFields = [["q", got.question_text],
      ...(Array.isArray(got.options) ? got.options.map((o, i) => ["o" + i, (o && o.text) || ""]) : []),
      ["x", got.explanation]];
    for (const v of Object.keys(e.counts)) {
      const p = PLANS.find((x) => x.lang === LANG_KEY[got.language] && x.variants.includes(v));
      const re = variantRe(v, p ? p.caseSensitive[v] : false);
      for (const [, text] of outFields) {
        const s = String(text || "");
        let m; re.lastIndex = 0;
        while ((m = re.exec(s))) {
          if (isParentheticalGloss(s, m.index, m[0].length)) continue;
          fails.push("row " + e.row.id + " still contains " + v + " outside a gloss");
        }
      }
    }
    if (got.status !== e.row.status || String(got.visibility) !== String(e.row.visibility) ||
        String(got.is_exam_scope) !== String(e.row.is_exam_scope)) {
      fails.push("row " + e.row.id + " moved status/visibility/is_exam_scope");
    }
  }
  /* the negative half: no row OUTSIDE the edit set moved */
  const edited = new Set(edits.map((e) => e.row.id));
  const beforeOthers = new Map(rows.filter((r) => !edited.has(r.id)).map((r) => [r.id,
    createHash("sha256").update(JSON.stringify([r.question_text, r.options, r.explanation])).digest("hex")]));
  let moved = 0;
  for (const r of after) {
    if (edited.has(r.id)) continue;
    const h = createHash("sha256").update(JSON.stringify([r.question_text, r.options, r.explanation])).digest("hex");
    if (beforeOthers.has(r.id) && beforeOthers.get(r.id) !== h) moved++;
  }
  if (moved) fails.push(moved + " row(s) OUTSIDE the edit set changed");
  console.log("  read-back: " + edits.length + " row(s) checked, " +
    beforeOthers.size + " untouched row(s) checksummed, " + fails.length + " failure(s)");
  if (fails.length) { fails.slice(0, 10).forEach((f) => console.error("   " + f)); process.exitCode = 4; }
  else console.log("  every edited row matches, no variant survives, nothing else moved.");
  void before;
}
