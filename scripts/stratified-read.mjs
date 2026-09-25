#!/usr/bin/env node
/**
 * stratified-read.mjs -- every mechanical check over the never-reviewed
 * translated corpus, reported per generation run, plus the paired sample.
 *
 * READ-ONLY. `--sample <file>` also writes the passage document. Unknown flags
 * exit 2. Nothing is ever fixed here.
 *
 * ============ TWO LAYERS, AND THEY ARE DIFFERENT JOBS ============
 *
 * The CHECKS run over the whole population. They are cheap, they do not get
 * tired, and they catch the defect shapes we already know because we paid for
 * each one: accent classes, modal inflation, `convem que` placement, the CIA
 * collision, the per-span quotation ceiling, the quote-level ratio.
 *
 * The READING runs over a sample, and it is for the shapes we do not know. Half
 * of it is drawn from rows the checks FLAGGED and half from rows they PASSED,
 * and the second half is the one that matters -- it is the only thing that can
 * tell us what the checks miss. A sample drawn only from flagged rows measures
 * the checks, not the corpus.
 *
 * ============ RATES, NOT COUNTS ============
 *
 * Reported per stratum x language as flags per 10,000 characters. Raw counts
 * would rank the strata by which generation run happened to be bigger, which is
 * a fact about our scheduling and not about the text.
 *
 * ============ STRUCTURAL ALIGNMENT IS THE CHEAPEST FINDING HERE ==========
 *
 * These are `baseline` rows: 367 stamped them without establishing that each
 * translation ever tracked its English. So "does this translation have the same
 * SHAPE as its English" -- same blockquotes, same list items, same headings --
 * is a question we can answer with no model and no index, and a mismatch is a
 * finding on its own. A missing section is not a translation defect anybody
 * would find by reading one paragraph.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { looksLikeLanguage } from "./lib/language-guard.mjs";
import { bothFormsCorrect, isCarriedEnglish } from "./lib/accent-classes.mjs";
import { checkModalSentences, checkDefinedTerms, checkRegister, checkClauseVocab,
         registerOf, alignForComparison, controls }
  from "./lib/translation-checks.mjs";

const KNOWN = new Set(["--sample", "--json", "--strata"]);
const argv = process.argv.slice(2);
for (const a of argv) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY; --sample <file>, --json <file>.");
    process.exit(2);
  }
}
const val = (f) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : ""; };
const SAMPLE_OUT = val("--sample"), JSON_OUT = val("--json");

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
/* The A-D fixtures run before anything is measured. A check tuned until it is
 * quiet has been deleted without anybody saying so. */
const broken = controls();
if (broken.length) {
  console.error('FIXTURE FAILURES: ' + broken.join('; '));
  console.error('No verdict printed: a broken checker reports clean.');
  process.exit(2);
}

const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set -- nothing measured, which is not a pass."); process.exit(2); }
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };

/** Paged to exhaustion with a count assertion. A floor is not a total, and the
 *  loop ends on REACHING THE TOTAL, never on a short page. */
async function allRows(path) {
  const rows = [], PAGE = 500;
  let total = null;
  for (let from = 0; ; from += PAGE) {
    let r, last;
    for (let i = 0; i < 6; i++) {
      try {
        r = await fetch(BASE + "/" + path, {
          headers: { ...H, Range: from + "-" + (from + PAGE - 1), Prefer: "count=exact" },
          signal: AbortSignal.timeout(60000),
        });
        if (r.ok) break;
        last = new Error("HTTP " + r.status);
      } catch (e) { last = e; }
      await new Promise((s) => setTimeout(s, 400 * (i + 1)));
    }
    if (!r || !r.ok) throw last || new Error("read failed: " + path);
    const n = Number(String(r.headers.get("content-range") || "").split("/")[1]);
    if (!Number.isFinite(n)) throw new Error("no content-range on " + path);
    total = n;
    const page = await r.json();
    rows.push(...page);
    if (rows.length >= total || !page.length) break;
  }
  if (rows.length !== total) throw new Error("SHORT READ on " + path + ": " + rows.length + " of " + total);
  return rows;
}

/* ---------------------------------------------------------------- shapes */
const quoteBlocks = (md) => {
  const out = []; let cur = null;
  md.split("\n").forEach((line, i) => {
    if (/^\s*>/.test(line)) { if (!cur) cur = { start: i, lines: [] }; cur.lines.push(line); }
    else if (cur) { out.push(cur); cur = null; }
  });
  if (cur) out.push(cur);
  return out.map((b) => ({ ...b,
    words: b.lines.map((l) => l.replace(/^\s*>\s?/, "").trim()).join(" ").trim().split(/\s+/).filter(Boolean).length }));
};
const structure = (md) => ({
  quotes: quoteBlocks(md).length,
  listItems: (md.match(/^\s*(?:[-*+]|\d+[.)])\s+/gm) || []).length,
  headings: (md.match(/^#{1,6}\s+/gm) || []).length,
  fences: (md.match(/^```/gm) || []).length,
  directives: (md.match(/^::/gm) || []).length,
  paragraphs: md.split(/\n\s*\n/).filter((p) => p.trim()).length,
});

/* ---------------------------------------------------------------- checks */
const ALLOWANCE = { "es-419": 1.338, "pt-BR": 1.278 };   // measured p90 quote ratio
const P95 = { "es-419": 1.563, "pt-BR": 1.461 };
const CEILING = 25;
const CIA = { "es-419": ["integridad", "confidencialidad", "disponibilidad"],
              "pt-BR": ["integridade", "confidencialidade", "disponibilidade"] };
const TR_MOD = {
  "es-419": { ob: /\bdebe(?:n|r[aá]n?)?\b/gi, rec: /\bdeber[ií]a(?:n)?\b/gi },
  "pt-BR": { ob: /\bdeve(?:m|r[aá]o?)?\b/gi, rec: /\b(?:deveria(?:m)?|conv[ée]m que)\b/gi },
};
const count = (re, s) => (s.match(re) || []).length;

function convemPlacement(text) {
  const out = []; const re = /conv[eé]m que/gi; let m;
  while ((m = re.exec(text)) !== null) {
    const before = text.slice(0, m.index).replace(/[*_\s]+$/, "");
    const ok = before === "" || /[>.;:!?—-]$/.test(before) ||
      /(^|\s)(e|mas|porque|pois|portanto|ou|embora|quando|se)$/i.test(before);
    if (!ok) out.push("convem-que not clause-initial");
  }
  return out;
}

function checkRow(en, tr, lang, cert, vocab, certRegister) {
  const flags = [];
  const enS = structure(en), trS = structure(tr);

  /* STRUCTURE first: a missing section is not something a paragraph read finds. */
  for (const k of ["quotes", "listItems", "headings", "fences", "directives"]) {
    if (enS[k] !== trS[k]) flags.push({ check: "structure", detail: k + " en=" + enS[k] + " tr=" + trS[k] });
  }

  /* Accent, floor 3, through the declared classes. */
  const acc = [];
  for (const tok of tr.toLowerCase().match(/[\p{L}]{3,}/gu) || []) {
    if (/[À-ɏ]/.test(tok)) continue;
    const a = vocab.get(tok);
    if (!a || bothFormsCorrect(tok, a)) continue;
    /* A token the row's own ENGLISH carries is a loanword in context, not a
     * dropped accent. `items`, `decision`, `senior`, `record` were 400 of the
     * first 1,000 flags -- cross-language cognates, the class this repository
     * already narrowed 5,569 to 36 over, arriving inside a single row. */
    if (isCarriedEnglish(tok, en)) continue;
    acc.push(tok);
  }
  for (const t of [...new Set(acc)].slice(0, 5)) flags.push({ check: "accent", detail: t });

  /* Modal inflation: English recommends, translation obliges. */
  const enShould = count(/\bshould\b/gi, en), enShall = count(/\b(shall|must)\b/gi, en);
  const trOb = count(TR_MOD[lang].ob, tr), trRec = count(TR_MOD[lang].rec, tr);
  if (enShould > 0 && trRec === 0 && trOb > enShall) {
    flags.push({ check: "modal", detail: "should x" + enShould + ", no weak modal, " + trOb + " obligations vs " + enShall + " en" });
  }

  if (lang === "pt-BR") for (const d of convemPlacement(tr)) flags.push({ check: "convem", detail: d });

  if (/^isms/i.test(cert) && !/\b(integrity|confidentiality|availability)\b/i.test(en)) {
    for (const t of CIA[lang]) {
      if (new RegExp("(^|[^\\p{L}])" + t + "([^\\p{L}]|$)", "iu").test(tr)) {
        flags.push({ check: "cia", detail: t + " with no CIA term in the English" });
      }
    }
  }

  /* Per-span ceiling and quote ratio, aligned by position. */
  const eq = quoteBlocks(en), tq = quoteBlocks(tr);
  const cap = Math.ceil(CEILING * ALLOWANCE[lang]);
  for (let i = 0; i < Math.min(eq.length, tq.length); i++) {
    if (eq[i].words <= CEILING && tq[i].words > cap) {
      flags.push({ check: "ceiling", detail: "span " + (i + 1) + " en=" + eq[i].words + " tr=" + tq[i].words + " cap=" + cap });
    }
    if (eq[i].words >= 15) {
      const ratio = tq[i].words / eq[i].words;
      if (ratio > P95[lang]) {
        flags.push({ check: "ratio", detail: "span " + (i + 1) + " ratio " + ratio.toFixed(2) + " > p95 " + P95[lang] });
      }
    }
  }

  if (!looksLikeLanguage(tr, lang)) flags.push({ check: "language", detail: "does not read as " + lang });

  /* ---- A to D: the checks a human read bought, aligned by SENTENCE ----
   *
   * GUIDANCE is the auditor certifications, where ISO 19011 is the subject and
   * its principles are `should` throughout. There a recommendation rendered as
   * an obligation is a defect; in our own prose it is reported, because we may
   * be firmer about our own advice than ISO is about its guidance. */
  const guidance = /-(IA)$/.test(cert);
  const modal = checkModalSentences(en, tr, lang, { guidance });
  const defined = checkDefinedTerms(en, tr, lang);
  /* Unalignable is a THIRD STATE and is counted as itself. Folding it into
   * "clean" would claim a check that never ran. */
  /* THE ALIGNMENT UNIT IS RECORDED, NOT JUST ITS FAILURE. Requiring equal
   * SENTENCE counts refused A and B on 300 of 917 rows -- a third of the corpus
   * unmeasured on the two checks that found the worst defects. Translation
   * splits and merges sentences; that is normal. A BLOCK is small enough for
   * `should` and `debe` to be the same statement, so the aligner falls back to
   * it, and only a BLOCK mismatch -- the structure finding -- refuses now. */
  if (modal.unalignable) flags.push({ check: "unalignable", detail: "block counts differ; A and B did not run" });
  else flags.push({ check: "_unit", detail: (alignForComparison(en, tr) || {}).unit || "sentence" });
  for (const f of [...modal.flags, ...defined.flags, ...checkRegister(tr, lang, certRegister).flags,
                   ...checkClauseVocab(tr, lang).flags]) {
    flags.push({ check: f.check, detail: f.detail, severity: f.severity });
  }
  return flags;
}

/* ---------------------------------------------------------------- run */
const lessons = await allRows("lessons?select=id,slug,language,lesson_group_id,content_md,created_at,module_id&order=id");
const modules = await allRows("modules?select=id,certification_id&order=id");
const certs = await allRows("certifications?select=id,code&order=id");
const reviews = await allRows("lesson_translation_reviews?select=lesson_id&order=lesson_id");
const reviewed = new Set(reviews.map((r) => r.lesson_id));
const certOfModule = new Map();
const certById = new Map(certs.map((c) => [c.id, c.code]));
for (const m of modules) certOfModule.set(m.id, certById.get(m.certification_id));

const enByGroup = new Map();
for (const l of lessons) if (l.language === "en") enByGroup.set(l.lesson_group_id, l);

/* Accent vocabulary per language, from the corpus. */
const vocab = { "es-419": new Map(), "pt-BR": new Map() };
for (const l of lessons) {
  if (l.language === "en") continue;
  for (const tok of (l.content_md || "").toLowerCase().match(/[\p{L}]{3,}/gu) || []) {
    if (!/[À-ɏ]/.test(tok)) continue;
    const plain = tok.normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (plain !== tok) vocab[l.language].set(plain, tok);
  }
}

/* PER-CERTIFICATION REGISTER, DERIVED FROM THE POPULATION. The ISO
 * certifications address the reader as `usted` and the practitioner ones as
 * `tu`; both are deliberate, so the finding is a row that disagrees with its
 * OWN certification rather than any row carrying `tu`. Computed over every
 * es-419 row, reviewed or not, because the convention is a property of the
 * certification and not of this population. */
const certRegister = new Map();
{
  const tally = new Map();
  for (const l of lessons) {
    if (l.language !== "es-419") continue;
    const cert = certOfModule.get(l.module_id);
    if (!cert) continue;
    const r = registerOf(l.content_md || "");
    if (!r) continue;
    if (!tally.has(cert)) tally.set(cert, { tu: 0, usted: 0 });
    tally.get(cert)[r]++;
  }
  for (const [cert, t] of tally) certRegister.set(cert, t.tu >= t.usted ? "tu" : "usted");
}

const POP = lessons.filter((l) => l.language !== "en" && !reviewed.has(l.id));
const strata = new Map();
const perRow = [];
for (const l of POP) {
  const en = enByGroup.get(l.lesson_group_id);
  if (!en) continue;
  const cert = certOfModule.get(l.module_id) || "?";
  const key = cert + " " + String(l.created_at).slice(0, 10);
  const flags = checkRow(en.content_md, l.content_md, l.language, cert, vocab[l.language], certRegister.get(cert));
  perRow.push({ key, cert, slug: l.slug, language: l.language, chars: l.content_md.length, flags, id: l.id });
  if (!strata.has(key)) strata.set(key, {});
  const s = strata.get(key);
  if (!s[l.language]) s[l.language] = { rows: 0, chars: 0, by: {} };
  s[l.language].rows++;
  s[l.language].chars += l.content_md.length;
  for (const f of flags) s[l.language].by[f.check] = (s[l.language].by[f.check] || 0) + 1;
}

const CHECKS = ["structure", "accent", "modal", "modal-sentence", "defined-term", "register",
                "clause-vocab", "convem", "cia", "ceiling", "ratio", "language", "unalignable"];
console.log("");
console.log("STRATIFIED READ -- mechanical checks over the NEVER-REVIEWED translated corpus");
console.log("DENOMINATOR: " + perRow.length + " row(s) examined, " +
  perRow.reduce((a, r) => a + r.chars, 0).toLocaleString() + " characters");
console.log("");
console.log("  stratum                     lang     rows    chars  " + CHECKS.map((c) => c.slice(0, 6).padStart(7)).join("") + "   flags/10k");
for (const [key, langs] of [...strata.entries()].sort()) {
  for (const [lang, s] of Object.entries(langs).sort()) {
    const total = CHECKS.reduce((a, c) => a + (s.by[c] || 0), 0);
    const rate = (total / (s.chars / 10000)).toFixed(2);
    console.log("  " + key.padEnd(26) + lang.padEnd(8) + String(s.rows).padStart(5) +
      String(s.chars).padStart(9) + "  " +
      CHECKS.map((c) => String(s.by[c] || 0).padStart(7)).join("") + "   " + rate.padStart(8));
  }
}

const artifact = { measured: new Date().toISOString().slice(0, 10), population: perRow.length,
  checks: CHECKS, strata: Object.fromEntries(strata), rows: perRow };
if (JSON_OUT) { writeFileSync(JSON_OUT, JSON.stringify(artifact, null, 2), "utf8"); console.log("\n  wrote " + JSON_OUT); }

/* ---------------------------------------------------------------- sample */
if (SAMPLE_OUT) {
  /* Deterministic, so the sample can be re-derived. No Math.random: a sample
   * nobody can reproduce is a sample nobody can check. */
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  /* ============ ALIGNED BY BLOCK COORDINATE, NEVER BY ORDINAL ============
   *
   * The first version took the Nth paragraph of each body. Two of the 48
   * passages came out misaligned -- one where the Spanish carried a paragraph
   * the English excerpt did not, one where the two halves were from entirely
   * different parts of the lesson. That is the ordinal-alignment defect that
   * put five of twenty excerpts onto checkpoint JSON earlier in the week: an
   * INDEX is not a COORDINATE when the two documents can differ in length.
   *
   * A block coordinate is the (type, ordinal-within-type) pair. Two bodies that
   * carry the same sequence of block types can be aligned on it exactly; two
   * that cannot are exactly the rows the structure check already flags, and
   * this REFUSES to sample them rather than printing a pair that is not a pair.
   */
  const blocks = (md) => md.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean).map((t) => ({
    type: /^::/.test(t) ? "directive" : /^#{1,6}\s/.test(t) ? "heading"
        : /^\s*>/.test(t) ? "quote" : /^```/.test(t) ? "fence"
        : /^\s*(?:[-*+]|\d+[.)])\s/.test(t) ? "list" : "para",
    text: t,
  }));
  const signature = (bs) => bs.map((b) => b.type).join(",");

  /** Three blocks from the same coordinate in both, or null if they do not
   *  align. Null is a RESULT and is reported, not silently skipped. */
  const alignedPassage = (enMd, trMd, seed) => {
    const eb = blocks(enMd), tb = blocks(trMd);
    if (signature(eb) !== signature(tb)) return null;
    const proseAt = eb.map((b, i) => (b.type === "para" && b.text.length > 120 ? i : -1)).filter((i) => i >= 0);
    if (!proseAt.length) return null;
    const start = proseAt[seed % proseAt.length];
    const take = (bs) => bs.slice(start, start + 3).map((b) => b.text).join("\n\n");
    const enP = take(eb), trP = take(tb);
    /* Both halves must carry the same structural markers, or they are not the
     * same passage however well the indices line up. */
    if (signature(eb.slice(start, start + 3)) !== signature(tb.slice(start, start + 3))) return null;
    return { en: enP, tr: trP };
  };
  const out = ["# Stratified read -- paired sample", "",
    "Four ADVERSARIAL passages (from the lessons the checks flagged most) and four RANDOM " +
    "passages (from lessons the checks passed) per stratum and language. The random half is " +
    "the one that can tell us what the checks miss; the adversarial half only measures the checks.",
    "", "Selection is deterministic (FNV-1a over the slug), so this sample can be re-derived.",
    "", "**Nothing here has been changed.**", ""];
  /* `--strata` limits the SAMPLE only. The checks above always run over the
   * whole population -- narrowing what a human reads is a budget decision,
   * narrowing what the machine checks would be a coverage claim. */
  const only = val("--strata") ? val("--strata").split(",").map((x) => x.trim()) : null;
  if (only) {
    const missing = only.filter((o) => ![...strata.keys()].some((k) => k.startsWith(o)));
    if (missing.length) { console.error("  no such stratum: " + missing.join(", ")); process.exit(2); }
    out.splice(5, 0, "Sampled strata: **" + only.join(", ") + "**. The checks above cover all " +
      strata.size + " strata and " + perRow.length + " rows; this document samples the named ones.", "");
  }
  let n = 0;
  const unaligned = [];
  for (const [key] of [...strata.entries()].sort()) {
    if (only && !only.some((o) => key.startsWith(o))) continue;
    for (const lang of ["es-419", "pt-BR"]) {
      const inStratum = perRow.filter((r) => r.key === key && r.language === lang);
      if (!inStratum.length) continue;
      const flagged = inStratum.filter((r) => r.flags.length).sort((a, b) => b.flags.length - a.flags.length).slice(0, 4);
      const clean = inStratum.filter((r) => !r.flags.length).sort((a, b) => hash(a.slug) - hash(b.slug)).slice(0, 4);
      out.push("---", "", "## " + key + " / " + lang,
        "", inStratum.length + " row(s) in this stratum; " + flagged.length + " adversarial, " + clean.length + " random.", "");
      for (const [label, set] of [["ADVERSARIAL", flagged], ["RANDOM", clean]]) {
        for (const r of set) {
          const tr = lessons.find((l) => l.id === r.id);
          const en = enByGroup.get(tr.lesson_group_id);
          const pair = alignedPassage(en.content_md, tr.content_md, hash(r.slug));
          if (!pair) {
            unaligned.push(r.slug + "/" + lang);
            out.push("### " + (++n) + ". " + label + " -- `" + r.slug + "` / " + lang,
              "", "**NOT SAMPLED: the two bodies do not share a block signature.** Printing a pair",
              "that is not a pair is worse than printing nothing -- this row needs the structure",
              "flag read first.", "");
            continue;
          }
          n++;
          out.push("### " + n + ". " + label + " -- `" + r.slug + "` / " + lang);
          out.push("");
          out.push(r.flags.length ? "flags: " + r.flags.map((f) => f.check + " (" + f.detail + ")").join("; ")
                                  : "flags: none -- this is the half that tests the checks");
          out.push("", "**EN**", "", "```", pair.en, "```", "",
            "**" + lang + "**", "", "```", pair.tr, "```", "");
        }
      }
    }
  }
  if (unaligned.length) {
    out.push("---", "", "## Not sampled -- " + unaligned.length + " row(s) whose bodies do not align", "");
    out.push("These carry a different sequence of blocks from their English, so there is no");
    out.push("coordinate at which the two can be compared. They are the structure finding, and a");
    out.push("passage pair would have been fiction.", "");
    for (const u of unaligned) out.push("- `" + u + "`");
    out.push("");
  }
  writeFileSync(SAMPLE_OUT, out.join("\n"), "utf8");
  console.log("  wrote " + SAMPLE_OUT + " -- " + n + " passages, " + unaligned.length + " refused as unalignable");
}
