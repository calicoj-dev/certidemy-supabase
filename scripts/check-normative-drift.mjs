#!/usr/bin/env node
/**
 * check-normative-drift.mjs -- does a repair that avoided reproduction still
 * say what the clause says?
 *
 * READ-ONLY. Takes --json, --verbose, --class <NAME>. Unknown flags exit 2.
 *
 * ============ THE CLASS THIS EXISTS FOR ============
 *
 * The leak gate checks that we do not REPRODUCE a standard. The claims
 * verifier checks that a citation RESOLVES. Neither asks whether the
 * paraphrase still says what the clause says -- and a repair is written under
 * pressure to be different from ISO's words, which is precisely the pressure
 * that moves meaning.
 *
 * Two landed, in English, and were faithfully carried into both translations:
 *
 *   isms-ia-04-02   clause 5.2 g)   "be available to interested parties"
 *                                -> "be OPEN TO interested parties"
 *   isms-ia-04-06   clause 8.2     "at planned intervals OR when"
 *                                -> "at planned intervals AND when"
 *
 * Available-to is a passive obligation to furnish on request; open-to is a
 * different claim. Clause 8.2 gives two independent triggers; AND makes them
 * joint. Both lessons then CONTRADICT THEMSELVES, because the explanatory
 * prose beside the quote still uses the original word.
 *
 * ============ TWO DETECTORS, AND THE SECOND NEEDS NO INDEX ============
 *
 * A. FEATURE DIFF. Modals, conjunctions and quantifiers are counted in the
 *    BEFORE and in the AFTER. A repair may rephrase freely; it may not change
 *    how many obligations, alternatives or universals the sentence carries.
 *
 * B. SELF-CONTRADICTION. Where the repair DROPPED a normative token, is that
 *    token still used elsewhere in the same lesson, about the same clause?
 *    That is the signature both known instances show, and it needs no ISO text
 *    at all -- the lesson disagrees with itself.
 *
 * B is the stronger signal and is reported first. A fires on ordinary
 * rephrasing and is ranked, never presented as a defect list.
 *
 * ============ WHAT IT CANNOT DO ============
 *
 * It cannot read the clause. A repair that changes a modal AND correctly
 * reflects the clause is indistinguishable here from one that drifted; only
 * someone with the standard open can tell. This produces CANDIDATES.
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { reviewBlocks, solid } from "./lib/guide-runs.mjs";

const KNOWN = new Set(["--json", "--verbose"]);
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) continue;
  if (a === "--class") { i++; continue; }
  if (!KNOWN.has(a)) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
}
const JSON_OUT = argv.includes("--json");
const VERBOSE = argv.includes("--verbose");
const ONLY = argv.includes("--class") ? argv[argv.indexOf("--class") + 1] : null;

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
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };

async function allRows(path) {
  const out = []; let from = 0, total = null;
  for (;;) {
    const r = await fetch(BASE + "/" + path, { headers: { ...H, Range: from + "-" + (from + 499), Prefer: "count=exact" } });
    if (!r.ok) throw new Error("HTTP " + r.status + " on " + path);
    total = Number(String(r.headers.get("content-range") || "").split("/")[1]);
    const page = await r.json(); out.push(...page);
    if (out.length >= total || page.length === 0) break;
    from += 500;
  }
  if (out.length !== total) throw new Error("SHORT READ on " + path + ": " + out.length + " of " + total);
  return out;
}

const lc = (s) => String(s || "").toLowerCase().replace(/[*_`>]/g, " ").replace(/\s+/g, " ");
const words = (s) => lc(s).split(/[^a-z0-9']+/).filter(Boolean);
const count = (ws, t) => ws.filter((w) => w === t).length;

/* OBLIGATION STRENGTH. `shall` and `should` are the whole difference between a
 * requirement and a recommendation, and ISO drafting treats them as reserved. */
const MODALS = ["shall", "should", "must", "may", "can", "will"];
/* ALTERNATIVE vs CONJUNCTION -- the 8.2 case. */
const CONJ = ["and", "or"];
/* SCOPE. Dropping or adding a universal changes who a requirement binds. */
const QUANT = ["all", "every", "any", "each", "none", "no", "both", "only", "not"];
/* Terms whose substitution for a near-synonym changes the claim. `available`
 * is here because 5.2 g) is the founding case. */
const TERMS = [
  "available", "open", "accessible", "adequate", "appropriate", "relevant", "necessary",
  "required", "documented", "retained", "maintained", "ensure", "determine", "establish",
  "implement", "monitor", "review", "evaluate", "planned", "intervals", "objective",
  "impartial", "independent", "verify", "validate", "approve", "authorize",
];

/* ---------------------------------------------- the repair spans */
const modules = readdirSync(HERE).filter((f) => /^lesson-repairs-.*\.mjs$/.test(f));
const spans = [];
for (const f of modules) {
  let mod; try { mod = await import(pathToFileURL(join(HERE, f)).href); } catch { continue; }
  for (const r of mod.REPAIRS ?? []) {
    for (const sp of [r.en, ...(r.also ?? [])]) {
      if (!sp?.before || !sp?.after) continue;
      spans.push({ file: f, cert: r.cert, slug: r.slug, address: r.address, before: sp.before, after: sp.after });
    }
  }
}

/* ---------------------------------------------- A. feature diff */
for (const s of spans) {
  const b = words(s.before), a = words(s.after);
  s.diff = {};
  for (const [kind, list] of [["modal", MODALS], ["conj", CONJ], ["quant", QUANT]]) {
    for (const t of list) {
      const db = count(b, t), da = count(a, t);
      if (db !== da) (s.diff[kind] ??= []).push({ token: t, before: db, after: da });
    }
  }
  s.droppedTerms = TERMS.filter((t) => count(b, t) > 0 && count(a, t) === 0);
  s.addedTerms = TERMS.filter((t) => count(b, t) === 0 && count(a, t) > 0);
}

/* ---------------------------------------------- B. self-contradiction */
const lessons = await allRows("lessons?select=slug,language,content_md");
const enBody = new Map(lessons.filter((l) => l.language === "en").map((l) => [l.slug, lc(l.content_md)]));
/* RAW, not lowercased. lc() strips >, * and _ -- the very markers the shape
 * test reads. Using the normalised body for structure would make every
 * blockquote look like prose. */
const enRaw = new Map(lessons.filter((l) => l.language === "en").map((l) => [l.slug, l.content_md || ""]));

for (const s of spans) {
  s.contradiction = [];
  const body = enBody.get(s.slug);
  if (!body) continue;
  const afterLc = lc(s.after);
  /* The dropped token must still be used SOMEWHERE ELSE in the lesson -- not
   * inside the repaired span itself, which is why the span is removed from the
   * body before looking. */
  const rest = body.split(afterLc).join(" ");
  for (const t of [...s.droppedTerms, ...(s.diff.conj ?? []).filter((d) => d.after === 0).map((d) => d.token)]) {
    const re = new RegExp("(^|[^a-z])" + t + "([^a-z]|$)");
    if (re.test(rest)) s.contradiction.push(t);
  }
}

/* ============ SHAPE: IS THE SPAN A QUOTATION OR OUR EXPLANATION? ============
 *
 * THIS IS THE PRIMARY FILTER AND IT REPLACES THE WORD LISTS AS THE TRIAGE.
 *
 * In something presented as the clause's own words -- blockquoted, lettered
 * "- a)", or introduced by "Clause 8.2 says:" -- every word is ISO's, and
 * changing one is a MISQUOTATION whether or not the meaning survives. In our
 * own prose, plain English is the point and `relevant` -> `bears on` is good
 * writing, not drift.
 *
 * That single distinction sorts the candidate list: the same substitution is a
 * defect in the first shape and an improvement in the second.
 *
 * Determined STRUCTURALLY from the live English body, never from the wording:
 *
 *   blockquote     the line begins with ">"
 *   lettered       the line begins with "- a)" / "a)" / "- 1)" -- the shape ISO
 *                  uses for the sub-requirements of a clause
 *   introduced     the PRECEDING solid line names a clause and ends in a colon,
 *                  or says "says / reads / requires / states" about one
 *
 * Anything else is EXPLANATION-SHAPED. Where the span cannot be located the
 * shape is UNKNOWN and the row says so rather than defaulting to either. */
const CITES = /\b(clause|annex|section|se[cç][aã]o|apartado|cl[aá]usula)\b/i;
const INTROVERB = /\b(says|reads|requires|states|obliges|sets out|lists|defines)\b/i;

const shapeOf = (body, needle) => {
  const bs = reviewBlocks(body);
  for (let bi = 0; bi < bs.length; bi++) {
    const sol = solid(bs[bi]);
    for (let li = 0; li < sol.length; li++) {
      const t = sol[li].text;
      if (!t.replace(/\s+/g, " ").includes(needle)) continue;
      const trimmed = t.trimStart();
      if (trimmed.startsWith(">")) return "QUOTATION:blockquote";
      if (/^-?\s*(?:\*\*)?[a-z0-9]\)/.test(trimmed)) return "QUOTATION:lettered";

      /* ============ THREE SHAPES THE FIRST VERSION MISSED ============
       *
       * It under-reported quotation by 30 spans, and every miss was a real
       * quotation: it looked for the citation on the PRECEDING line only, and
       * required a closing paren for a list item.
       *
       * TABLE ROW keyed by a clause number -- "| 6.1.2 - define and apply ... |"
       * is a requirements table, which is the clause's words in a grid. */
      if (trimmed.startsWith("|") && /(?:\*\*)?\d+(?:\.\d+)+/.test(trimmed)) return "QUOTATION:table";

      /* CLAUSE-NUMBER ITEM -- "**8.2** - at planned intervals". Same function as
       * a lettered item and no paren anywhere in it. */
      if (/^[-*|]?\s*(?:\*\*)?\d+(?:\.\d+)+(?:\*\*)?\s*[-–—:]/.test(trimmed)) return "QUOTATION:clause-item";

      /* SELF-INTRODUCED -- "Clause 8.2 says at planned intervals ...". The
       * introduction is INSIDE the span, so looking at the previous line finds
       * prose and calls the whole thing explanation. */
      const head = trimmed.slice(0, 90);
      if (CITES.test(head) && INTROVERB.test(head)) return "QUOTATION:self-introduced";

      const prev = li > 0 ? sol[li - 1].text : "";
      if (CITES.test(prev) && (/:\s*$/.test(prev.trim()) || INTROVERB.test(prev))) return "QUOTATION:introduced";
      return "EXPLANATION";
    }
  }
  return "UNKNOWN";
};

for (const s of spans) {
  const body = enRaw.get(s.slug);
  s.shape = body ? shapeOf(body, s.after.replace(/\s+/g, " ").trim()) : "UNKNOWN";
  s.quoted = s.shape.startsWith("QUOTATION");
}

/* ---------------------------------------------- rank */
const flip = (s) => {
  const c = s.diff.conj ?? [];
  const or = c.find((d) => d.token === "or"), and = c.find((d) => d.token === "and");
  return or && and && ((or.before > or.after && and.after > and.before) || (or.after > or.before && and.before > and.after));
};
const modalShift = (s) => (s.diff.modal ?? []).some((d) =>
  (d.token === "shall" || d.token === "should") && d.before !== d.after);

for (const s of spans) {
  s.classes = [];
  if (flip(s)) s.classes.push("CONJUNCTION-FLIP");
  if (modalShift(s)) s.classes.push("MODAL-SHIFT");
  if ((s.diff.quant ?? []).length) s.classes.push("QUANTIFIER");
  if (s.droppedTerms.length && s.addedTerms.length) s.classes.push("TERM-SUBSTITUTION");
  if (s.contradiction.length) s.classes.push("SELF-CONTRADICTION");
}

/* ============ NARROWED, AND THE BROAD COUNT IS KEPT VISIBLE ============
 *
 * The first version called any dropped listed term still used elsewhere a
 * self-contradiction. It fired on 82 of 471 spans -- because "relevant" or
 * "appropriate" reappearing somewhere in a 13,000-character lesson is not a
 * contradiction, it is English. A guard that fires on the normal case is
 * deleted by the first person it inconveniences.
 *
 * The signature both founding cases actually show is narrower: the repair
 * FLIPPED A CONJUNCTION or SUBSTITUTED A LISTED TERM, and the original token is
 * still used elsewhere about the same clause. Both counts are printed, because
 * the narrowing is a judgement and hiding the broad number would hide it. */
const broadContra = spans.filter((s) => s.contradiction.length);
const withContra = spans.filter((s) => s.contradiction.length &&
  (s.classes.includes("CONJUNCTION-FLIP") || s.classes.includes("TERM-SUBSTITUTION")));
const flips = spans.filter((s) => s.classes.includes("CONJUNCTION-FLIP"));
const modals = spans.filter((s) => s.classes.includes("MODAL-SHIFT"));
const quants = spans.filter((s) => s.classes.includes("QUANTIFIER"));
const subs = spans.filter((s) => s.classes.includes("TERM-SUBSTITUTION"));

/* ======================= POSITIVE CONTROL =======================
 *
 * The two instances a human found must each surface. If neither does, the
 * detector has been narrowed past its own founding cases and the list below is
 * worthless -- so nothing is printed. This is the check that stops a guard
 * being tuned until it is quiet. */
const CONTROL = ["isms-ia-04-02-demonstrated-not-stated", "isms-ia-04-06-defined-versus-running"];
const controlHits = CONTROL.map((slug) => ({
  slug, classes: [...new Set(spans.filter((s) => s.slug === slug && s.classes.length).flatMap((s) => s.classes))],
}));
console.log("");
console.log("  POSITIVE CONTROL -- the two instances a human found");
for (const c of controlHits) console.log("    " + (c.classes.length ? "FIRES  " : "SILENT ") + c.slug + "   " + c.classes.join(", "));
if (controlHits.some((c) => !c.classes.length)) {
  console.error("");
  console.error("A founding case no longer fires. The detector has been narrowed past its own");
  console.error("evidence and the candidate list is not printed.");
  process.exit(1);
}

console.log("");
console.log("NORMATIVE DRIFT -- candidates, not defects");
console.log("");
console.log("  repair spans examined            " + spans.length);
console.log("");
console.log("  SHAPE -- the primary filter. In a quotation every word is ISO's, so");
console.log("  changing one is a MISQUOTATION whether or not the meaning survives.");
console.log("  In our own prose, plain English is the point.");
{
  const t = {};
  for (const s of spans) t[s.shape] = (t[s.shape] || 0) + 1;
  for (const k of Object.keys(t).sort()) console.log("    " + k.padEnd(24) + t[k]);
  const q = spans.filter((s) => s.quoted).length;
  console.log("    QUOTATION-SHAPED total   " + q + "   EXPLANATION-SHAPED " + spans.filter((s) => s.shape === "EXPLANATION").length);
}
console.log("");
console.log("  SELF-CONTRADICTION, narrowed (strongest)        " + withContra.length);
console.log("    the broad form fired on " + broadContra.length + " -- kept visible because the");
console.log("    narrowing is a judgement, not a measurement");
console.log("  CONJUNCTION-FLIP   (and <-> or)                  " + flips.length);
console.log("  MODAL-SHIFT        (shall / should count moved)  " + modals.length);
console.log("  QUANTIFIER         (all/every/any/no/not moved)  " + quants.length);
console.log("  TERM-SUBSTITUTION  (a listed term swapped)       " + subs.length);
console.log("");
console.log("  A high count in the lower three is EXPECTED -- a repair rephrases, and");
console.log("  rephrasing moves these tokens. They are ranked, never a defect list.");

const show = (title, list, n) => {
  if (!list.length) return;
  console.log("");
  console.log("  ===== " + title + " =====");
  for (const s of list.slice(0, VERBOSE ? 9999 : n)) {
    console.log("");
    console.log("  " + s.cert + "  " + s.slug + "   [" + s.address + "]");
    if (s.contradiction.length) console.log("    still used elsewhere in the lesson: " + s.contradiction.join(", "));
    if ((s.diff.conj ?? []).length) console.log("    conj: " + s.diff.conj.map((d) => d.token + " " + d.before + "->" + d.after).join("  "));
    if ((s.diff.modal ?? []).length) console.log("    modal: " + s.diff.modal.map((d) => d.token + " " + d.before + "->" + d.after).join("  "));
    if (s.droppedTerms.length) console.log("    dropped: " + s.droppedTerms.join(", ") + (s.addedTerms.length ? "   added: " + s.addedTerms.join(", ") : ""));
    console.log("    before: " + s.before.slice(0, 190));
    console.log("    after : " + s.after.slice(0, 190));
  }
  if (!VERBOSE && list.length > n) console.log("");
  if (!VERBOSE && list.length > n) console.log("    ... and " + (list.length - n) + " more (--verbose)");
};

if (!ONLY || ONLY === "SELF-CONTRADICTION") show("SELF-CONTRADICTION", withContra, 10);
if (!ONLY || ONLY === "CONJUNCTION-FLIP") show("CONJUNCTION-FLIP", flips, 10);
if (ONLY === "MODAL-SHIFT") show("MODAL-SHIFT", modals, 20);
if (ONLY === "QUANTIFIER") show("QUANTIFIER", quants, 20);
if (ONLY === "TERM-SUBSTITUTION") show("TERM-SUBSTITUTION", subs, 20);

if (JSON_OUT) {
  writeFileSync(join(ROOT, "NORMATIVE-DRIFT.json"), JSON.stringify({
    measured: new Date().toISOString(), spans: spans.length,
    counts: {
      self_contradiction: withContra.length, conjunction_flip: flips.length,
      modal_shift: modals.length, quantifier: quants.length, term_substitution: subs.length,
    },
    candidates: spans.filter((s) => s.classes.length),
  }, null, 2), "utf8");
  console.log("");
  console.log("  wrote NORMATIVE-DRIFT.json");
}
