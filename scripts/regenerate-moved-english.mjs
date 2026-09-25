#!/usr/bin/env node
/**
 * regenerate-moved-english.mjs -- retranslate the rows whose English moved.
 *
 * TWO PHASES, AND THAT SEPARATION IS THE POINT:
 *
 *   --emit <file>   generate, gate, and WRITE THE BATCH TO DISK. No database
 *                   write. This is the artifact a human reviews.
 *   --from <file>   apply THAT EXACT BATCH, re-running every gate on the way
 *                   in, stamping one translation_batch_id across all of it.
 *
 * Unknown flags exit 2. Neither phase writes without its flag.
 *
 * ============ WHY NOT --dry ============
 *
 * CLAUDE.md: "A DRY RUN OF A GENERATOR IS A SAMPLE, NOT A PREVIEW." Every
 * generator in this repository regenerates on each invocation, so the dry run
 * prints one item and the live run writes a different one. AIMS-F task 4.1 was
 * read in full, judged, regenerated, read again, approved -- and the live run
 * produced a THIRD item nobody had seen.
 *
 * So there is no --dry here. `--emit` produces bytes; `--from` applies those
 * bytes. The reviewed artifact and the written artifact are the same object,
 * and an edited spec cannot smuggle anything past the gates because they run
 * again on the way in.
 *
 * ============ WHAT MOVED, AND HOW EACH ROW IS LOCATED ============
 *
 * FIVE ISMS-IA lessons took the 25-word ceiling conversion in English: an
 * over-length blockquote became a SHORT MARKED QUOTATION plus a new paragraph
 * of our own. The translations took neither change, so they still carry the
 * full original quotation -- 5 English words against 56 Spanish, up to 15
 * against 73.
 *
 * The span is located BY ITS EXACT CURRENT TEXT, never by position. Position
 * alignment is what put the first blockquote of `isms-ia-03-01` (a definitions
 * block) where the converted span should have been while this was being
 * scoped. An exact-string FROM with a one-hit assertion cannot do that.
 *
 * ONE SD-AI-I lesson took the 2020-Guide terminology pass: five occurrences of
 * `servant-leader` became `true leader who serves`. Its translations still read
 * `lider servidor` / `lider-servidor`. That is a PINNED TERM, not a free
 * translation -- the 2020 Scrum Guide has published Spanish and Portuguese, and
 * the renderings below are its wording.
 *
 * TWO CONCEPT ROWS: `aia-interested-party-requirements` es-419 and pt-BR, whose
 * English was repaired by fix-aia-interested-party.mjs. Derived from the hash,
 * not from a script list: en_hash <> concept_row_en_hash.
 *
 * ============ ONE BATCH ID ACROSS ALL OF IT ============
 *
 * 372 exists because `created_at` does not move on UPDATE, so a regenerated row
 * is invisible to the query that found the accent batch -- one minute on
 * 2026-09-21 carrying all four accent defects in the corpus. Every row this
 * writes points at one `translation_batches` row holding the spec: source
 * hashes, pinned terms, register rules, generator and model.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { looksLikeLanguage } from "./lib/language-guard.mjs";
import { bothFormsCorrect } from "./lib/accent-classes.mjs";
import { ISO_MS_VOCABULARY, PIN_FULL, PIN_LOAN } from "./lib/item-translation.mjs";

const KNOWN = new Set(["--emit", "--from", "--gate", "--verbose"]);
const argv = process.argv.slice(2);
for (const a of argv) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a);
    console.error("  --emit <file>  generate + gate + write the batch to disk (no DB write)");
    console.error("  --from <file>  apply that batch, re-running every gate");
    process.exit(2);
  }
}
const val = (f) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : ""; };
const EMIT = val("--emit"), FROM = val("--from"), GATE = val("--gate"), VERBOSE = argv.includes("--verbose");
if ([EMIT, FROM, GATE].filter(Boolean).length !== 1) {
  console.error("Exactly one of --emit <file>, --gate <file> or --from <file> is required.");
  console.error("  --gate re-runs every gate on an existing batch and writes nothing.");
  process.exit(2);
}

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AKEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };
const MODEL = "claude-sonnet-4-6";
const GENERATOR = "regenerate-moved-english.mjs";

/* The five ceiling conversions. Slug only -- the span is found by comparing the
 * English and translated blockquotes and taking the one the English trimmed. */
const CEILING_LESSONS = [
  "isms-ia-03-02-what-the-sample-supports",
  "isms-ia-05-03-the-statement-that-survives",
  "isms-ia-04-01-what-the-scope-left-out",
  "isms-ia-04-03-the-whole-of-clause-6",
  "isms-ia-03-01-degree-of-verification",
];

/* The terminology pass. PINNED renderings from the published 2020 Scrum Guide
 * in each language -- not a translation decision this script gets to make. */
const SERVANT = {
  "es-419": [
    ["Es un líder servidor cuyo trabajo es", "Es un verdadero líder que sirve, y su trabajo es"],
    ["como líder servidor sin autoridad", "como un verdadero líder que sirve, sin autoridad"],
    ["El SM es un líder servidor que elimina", "El SM es un verdadero líder que sirve, que elimina"],
    ["malinterpreta el rol de líder servidor", "malinterpreta el rol del Scrum Master"],
    ["sirve a los Developers como líder servidor", "es un verdadero líder que sirve a los Developers"],
  ],
  "pt-BR": [
    ["É um líder-servidor cujo trabalho é", "É um verdadeiro líder que serve, e seu trabalho é"],
    ["como um líder-servidor sem autoridade", "como um verdadeiro líder que serve, sem autoridade"],
    ["O SM é um líder-servidor que remove", "O SM é um verdadeiro líder que serve, que remove"],
    ["distorce o papel de líder-servidor", "distorce o papel do Scrum Master"],
    ["serve os Developers como líder-servidor", "é um verdadeiro líder que serve os Developers"],
  ],
};
const SERVANT_SLUG = "05-03-working-with-scrum-master";
const CONCEPT_SLUGS = ["aia-interested-party-requirements"];
const LANGS = ["es-419", "pt-BR"];

const REGISTER = {
  "es-419": "Latin American Spanish (es-419). ISO sub-items are `apartado`; `clausula` is the house form for clause. Use `idoneidad` for appropriateness, never `pertinencia`.",
  "pt-BR": "Brazilian Portuguese (pt-BR). ISO sections are `Secao` (flat, not two-tier). Use `analise critica` for review, and `adequacao` for appropriateness.",
};

async function rest(path, init) {
  let last;
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(BASE + "/" + path, { ...(init || {}), headers: { ...H, ...((init || {}).headers || {}) }, signal: AbortSignal.timeout(45000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 160));
      return t ? JSON.parse(t) : null;
    } catch (e) { last = e; await new Promise((s) => setTimeout(s, 300 * (i + 1))); }
  }
  throw last;
}

/* ---------------------------------------------------------------- spans */
const quoteBlocks = (md) => {
  const lines = md.split("\n"), out = [];
  let cur = null;
  lines.forEach((line, i) => {
    const isq = /^\s*>/.test(line);
    if (isq) { if (!cur) cur = { start: i, lines: [] }; cur.lines.push(line); }
    else if (cur) { out.push(cur); cur = null; }
  });
  if (cur) out.push(cur);
  return out.map((b) => ({
    ...b,
    text: b.lines.join("\n"),
    words: b.lines.map((l) => l.replace(/^\s*>\s?/, "").trim()).join(" ").trim().split(/\s+/).filter(Boolean).length,
  }));
};

/* ---------------------------------------------------------------- model */
async function translate(englishBlock, language, note) {
  if (!AKEY) throw new Error("ANTHROPIC_API_KEY is not set; cannot generate");
  const system = [
    "You translate curriculum for an ISO/IEC 17024 certification body.",
    "Translate the ENGLISH given into " + REGISTER[language],
    "",
    "RULES THAT ARE NOT STYLE:",
    "- Preserve markdown exactly: blockquote markers, ** emphasis, &nbsp;, list letters.",
    "- MODALS ARE PINNED, NOT TRANSLATED. This is the single most common defect",
    "  in this corpus: English SHOULD becomes translated MUST, and the sentence",
    "  then requires something the standard only recommends.",
    "      shall  -> es-419 `debe`      / pt-BR `deve`",
    "      should -> es-419 `deberia`   / pt-BR `convem que` or `deveria`  NEVER `deve`",
    "      may    -> es-419 `puede`     / pt-BR `pode`",
    "      can    -> es-419 `puede`     / pt-BR `pode`",
    "  ISO 19011 is a GUIDANCE standard: its principles use `should` throughout.",
    "  Rendering one of them as `debe`/`deve` turns a recommendation into a",
    "  requirement an auditor would then look for evidence of.",
    "- Preserve conjunctions. `or` is not `and`.",
    "- Preserve quantifiers: all, every, any, no, not.",
    "- Add NOTHING. Do not explain, expand, or complete a thought the English leaves open.",
    "- Do not lengthen a quotation. If the English quotes six words, quote six.",
    "",
    "PINNED TERMS -- never truncated, never re-rendered:",
    PIN_FULL.join("; "),
    "May stand as loans: " + PIN_LOAN.join("; "),
    "",
    ISO_MS_VOCABULARY,
  ].join("\n");
  const user = (note ? note + "\n\n" : "") +
    "Translate this into " + language + ". Return ONLY the translation, no commentary:\n\n" + englishBlock;
  let last;
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": AKEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: 2000, system, messages: [{ role: "user", content: user }] }),
        signal: AbortSignal.timeout(120000),
      });
      const j = await r.json();
      if (!r.ok) throw new Error("anthropic HTTP " + r.status + " " + JSON.stringify(j).slice(0, 160));
      const text = (j.content || []).filter((c) => c.type === "text").map((c) => c.text).join("").trim();
      if (!text) throw new Error("empty completion");
      return text;
    } catch (e) { last = e; await new Promise((s) => setTimeout(s, 800 * (i + 1))); }
  }
  throw last;
}

/* ---------------------------------------------------------------- gates */
const MODALS = { shall: /\bshall\b/gi, should: /\bshould\b/gi, must: /\bmust\b/gi, may: /\bmay\b/gi, can: /\bcan\b/gi };
const TR_MODALS = {
  "es-419": { obligation: /\bdebe(?:n|r[aá]n?)?\b/gi, recommend: /\bdeber[ií]a(?:n)?\b/gi, may: /\bpuede(?:n)?\b/gi },
  "pt-BR": { obligation: /\bdeve(?:m|r[aá]o?)?\b/gi, recommend: /\bdeveria(?:m)?\b/gi, may: /\bpode(?:m)?\b/gi },
};
const count = (re, s) => (s.match(re) || []).length;

/** Accented vocabulary for a language, built from the corpus. Floor 3, not 4 --
 *  a four-character floor made `nao` unreachable by construction, and `nao` is
 *  the most common accented word in Portuguese. */
function accentGate(text, vocab) {
  const hits = [];
  for (const tok of text.toLowerCase().match(/[\p{L}]{3,}/gu) || []) {
    if (/[À-ɏ]/.test(tok)) continue;
    const accented = vocab.get(tok);
    if (!accented) continue;
    /* THE THREE DECLARED CLASSES WHERE BOTH FORMS ARE CORRECT. The first
     * version of this gate omitted them and fired on all 14 rows -- que/como/
     * cuando are diacritic pairs, trabajo/pode are part-of-speech pairs. That
     * is the 5,569-to-36 finding reimplemented badly, so the classifier is now
     * imported rather than rewritten. */
    if (bothFormsCorrect(tok, accented)) continue;
    hits.push(tok + " -> " + accented);
  }
  return [...new Set(hits)];
}

function driftGate(english, translated, language) {
  const problems = [];
  const tm = TR_MODALS[language];
  const enObligation = count(MODALS.shall, english) + count(MODALS.must, english);
  const enRecommend = count(MODALS.should, english);
  const trObligation = count(tm.obligation, translated);
  const trRecommend = count(tm.recommend, translated);
  if (enObligation > 0 && trObligation === 0) problems.push("obligation modal lost (en " + enObligation + ")");
  if (enRecommend > 0 && trRecommend === 0 && trObligation > enObligation)
    problems.push("recommendation became obligation (should " + enRecommend + ")");
  const enOr = count(/\bor\b/gi, english), enAnd = count(/\band\b/gi, english);
  const trOr = count(language === "es-419" ? /\bo\b|\bu\b/gi : /\bou\b/gi, translated);
  const trAnd = count(language === "es-419" ? /\by\b|\be\b/gi : /\be\b/gi, translated);
  if (enOr > 0 && trOr === 0) problems.push("every `or` disappeared (en " + enOr + ")");
  if (enOr === 0 && enAnd === 0 && (trOr > 0)) problems.push("a conjunction appeared that the English has not");
  for (const q of ["all", "every", "any", "no", "not"]) {
    const n = count(new RegExp("\\b" + q + "\\b", "gi"), english);
    if (n > 0 && translated.trim() === "") problems.push("quantifier `" + q + "` unchecked on empty output");
  }
  return problems;
}

/** The per-span ceiling, on the OUTPUT. English is capped at 25 words; the
 *  language allowance is the measured p90 quote ratio, not a guess:
 *  es-419 1.338 and pt-BR 1.278 over 75 rows per language. */
const ALLOWANCE = { "es-419": 1.338, "pt-BR": 1.278 };
const CEILING = 25;
function ceilingGate(enBlockWords, trBlock, language) {
  const cap = Math.ceil(CEILING * ALLOWANCE[language]);
  const w = trBlock.split("\n").map((l) => l.replace(/^\s*>\s?/, "").trim()).join(" ").trim().split(/\s+/).filter(Boolean).length;
  if (enBlockWords > CEILING) return { w, cap, ok: true, note: "English span itself is over the ceiling; not this batch's subject" };
  return { w, cap, ok: w <= cap, note: "" };
}


/* ============ PLACEMENT, NOT PRESENCE ============
 *
 * The modal gate checked that the right TOKEN was present. It was, in all three
 * rows it passed -- and all three were ungrammatical, because `convem que` is
 * not a modal you drop into the modal's slot. It is a CONSTRUCTION:
 *
 *     Convem que [subject] [subjunctive]
 *
 * opening the clause. `As evidencias de auditoria convem que sejam verificaveis`
 * has the token and is not Portuguese.
 *
 * Same shape as every other check this repository has had to sharpen: it asked
 * about a COMPONENT of the property. Presence is a component of placement.
 */
function convemPlacement(text) {
  const problems = [];
  const re = /conv[eé]m que/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    /* Markdown emphasis is not a word. Strip it before asking what precedes. */
    const before = text.slice(0, m.index).replace(/[*_\s]+$/, "");
    const clauseInitial = before === "" ||
      /[>.;:!?—-]$/.test(before) ||
      /(^|\s)(e|mas|porque|pois|portanto|ou|embora|quando|se)$/i.test(before);
    if (!clauseInitial) {
      problems.push("`convem que` is not clause-initial: ..." + before.slice(-46) + " [convem que]");
    }
  }
  return problems;
}

/* ============ THE CIA VOCABULARY IS RESERVED IN AN ISMS COURSE ============
 *
 * `integridad` is INTEGRITY -- one of the three properties the whole
 * certification is built on. The generator reached for it to render
 * `completeness check`, in the one course where that collision costs most. The
 * pt sibling got it right with `completude`, which is how it was caught.
 *
 * Flagged when a CIA term appears in an ISMS lesson and the English it
 * translates carries none of integrity / confidentiality / availability.
 */
const CIA = {
  "es-419": ["integridad", "confidencialidad", "disponibilidad"],
  "pt-BR": ["integridade", "confidencialidade", "disponibilidade"],
};
function ciaCollision(english, translated, language, slug) {
  if (!/^isms/i.test(slug)) return [];
  if (/\b(integrity|confidentiality|availability)\b/i.test(english)) return [];
  const hits = CIA[language].filter((t) => new RegExp("(^|[^\p{L}])" + t + "([^\p{L}]|$)", "iu").test(translated));
  return hits.map((t) => "CIA term `" + t + "` with no integrity/confidentiality/availability in the English");
}

/* Controls for both, on fixtures. The first fixture is the exact text the old
 * gate passed, and it MUST fail. */
function placementControls() {
  const cases = [
    ["> As evidências de auditoria **convém que sejam verificáveis**.", true],
    ["> **Convém que** a evidência de auditoria **seja verificável**.", false],
    ["duas coisas que um relatório **convém que** contenha", true],
    ["Convém que a organização determine os limites.", false],
    ["A norma exige registros, e convém que sejam retidos.", false],
  ];
  let broken = 0;
  for (const [text, shouldFire] of cases) {
    if ((convemPlacement(text).length > 0) !== shouldFire) {
      console.error("PLACEMENT CONTROL FAILED: " + text.slice(0, 60));
      broken++;
    }
  }
  const cia = [
    [["isms-ia-x", "es-419", "a completeness check", "una verificación de integridad"], true],
    [["isms-ia-x", "es-419", "a completeness check", "una verificación de completitud"], false],
    [["isms-ia-x", "es-419", "the integrity of records", "la integridad de los registros"], false],
    [["sm-ai-x", "es-419", "a completeness check", "una verificación de integridad"], false],
  ];
  for (const [[slug, lang, en, tr], shouldFire] of cia) {
    if ((ciaCollision(en, tr, lang, slug).length > 0) !== shouldFire) {
      console.error("CIA CONTROL FAILED: " + slug + " " + tr);
      broken++;
    }
  }
  return broken;
}
if (placementControls()) {
  console.error("");
  console.error("A gate control failed. No verdict printed: a broken checker reports clean.");
  process.exit(2);
}

/* ---------------------------------------------------------------- build */
async function accentVocab(language) {
  /* Words that appear ACCENTED somewhere in this language's corpus. An
   * unaccented occurrence of one of them in new text is a candidate defect. */
  const rows = await rest("lessons?select=content_md&language=eq." + encodeURIComponent(language) + "&limit=1000");
  const m = new Map();
  for (const r of rows) {
    for (const tok of (r.content_md || "").toLowerCase().match(/[\p{L}]{3,}/gu) || []) {
      if (!/[À-ɏ]/.test(tok)) continue;
      const plain = tok.normalize("NFD").replace(/[̀-ͯ]/g, "");
      if (plain !== tok) m.set(plain, tok);
    }
  }
  return m;
}

async function emit(outPath) {
  const batch = { generator: GENERATOR, model: MODEL, kind: "lesson_span",
                  register: REGISTER, pins: { PIN_FULL, PIN_LOAN }, rows: [] };
  const vocab = {};
  for (const lang of LANGS) vocab[lang] = await accentVocab(lang);

  /* ---- the five ceiling conversions ---- */
  for (const slug of CEILING_LESSONS) {
    const rows = await rest("lessons?select=id,slug,language,content_md,lesson_group_id&slug=eq." + slug);
    const en = rows.find((r) => r.language === "en");
    if (!en) throw new Error("no English row for " + slug);
    const enBlocks = quoteBlocks(en.content_md);
    for (const lang of LANGS) {
      const tr = rows.find((r) => r.language === lang);
      if (!tr) throw new Error("no " + lang + " row for " + slug);
      const trBlocks = quoteBlocks(tr.content_md);
      /* The converted span: aligned by index, then CONFIRMED by the shape that
       * defines it -- English within the ceiling, translation far over it. */
      const cands = [];
      for (let i = 0; i < Math.min(enBlocks.length, trBlocks.length); i++) {
        if (enBlocks[i].words <= CEILING && trBlocks[i].words > Math.ceil(CEILING * ALLOWANCE[lang])) {
          cands.push({ i, en: enBlocks[i], tr: trBlocks[i] });
        }
      }
      if (cands.length !== 1) {
        throw new Error(slug + "/" + lang + ": expected exactly 1 converted span, found " + cands.length);
      }
      const { en: enB, tr: trB } = cands[0];
      /* The paragraph the conversion added, immediately after the span. */
      const enLines = en.content_md.split("\n");
      let p = enB.start + enB.lines.length;
      while (p < enLines.length && enLines[p].trim() === "") p++;
      const addedPara = (p < enLines.length && !/^\s*>/.test(enLines[p])) ? enLines[p] : "";
      const source = enB.text + (addedPara ? "\n\n" + addedPara : "");
      const out = await translate(source, lang,
        "This replaces an over-length quotation the English has already trimmed. " +
        "The blockquote must stay a blockquote and must not grow.");
      const parts = out.split(/\n\s*\n/);
      const newBlock = parts[0].trim();
      const newPara = parts.slice(1).join("\n\n").trim();
      batch.rows.push({
        kind: "lesson_span", slug, language: lang, lesson_id: tr.id,
        from_block: trB.text, to_block: newBlock,
        add_paragraph: newPara, add_after_block: true,
        english_source: source, en_block_words: enB.words,
      });
      if (VERBOSE) console.log("  drafted " + slug + "/" + lang);
    }
  }

  /* ---- the terminology pass ---- */
  for (const lang of LANGS) {
    const rows = await rest("lessons?select=id,slug,language,content_md&slug=eq." + SERVANT_SLUG +
      "&language=eq." + encodeURIComponent(lang));
    if (rows.length !== 1) throw new Error(SERVANT_SLUG + "/" + lang + ": " + rows.length + " rows");
    batch.rows.push({ kind: "lesson_terms", slug: SERVANT_SLUG, language: lang, lesson_id: rows[0].id,
                      edits: SERVANT[lang] });
  }

  /* ---- the two concept rows, derived from the hash ---- */
  for (const slug of CONCEPT_SLUGS) {
    const c = await rest("concepts?select=id,slug,name,description&slug=eq." + slug);
    if (c.length !== 1) throw new Error("concept " + slug + ": " + c.length + " rows");
    const ct = await rest("concept_translations?select=id,language,name,description,en_hash&concept_id=eq." + c[0].id);
    for (const lang of LANGS) {
      const row = ct.find((r) => r.language === lang);
      if (!row) throw new Error("concept " + slug + "/" + lang + " missing");
      const src = "NAME: " + c[0].name + "\n\nDESCRIPTION: " + c[0].description;
      const out = await translate(src, lang, "Return exactly two blocks, `NAME:` then `DESCRIPTION:`.");
      const nm = /NAME:\s*([\s\S]*?)\n\s*\n\s*DESCRIPTION:/i.exec(out);
      const ds = /DESCRIPTION:\s*([\s\S]*)$/i.exec(out);
      if (!nm || !ds) throw new Error("concept " + slug + "/" + lang + ": model did not return both blocks");
      batch.rows.push({ kind: "concept_row", slug, language: lang, translation_id: row.id,
                        to_name: nm[1].trim(), to_description: ds[1].trim(),
                        english_source: src });
    }
  }

  /* ---- gates, every row, before anything is written ---- */
  let failed = 0;
  const gateRow = (r) => {
    const problems = [];
    r.ceiling = undefined;
    const text = r.kind === "concept_row" ? r.to_name + "\n" + r.to_description
               : r.kind === "lesson_terms" ? r.edits.map((e) => e[1]).join("\n")
               : r.to_block + "\n" + (r.add_paragraph || "");
    if (!looksLikeLanguage(text, r.language)) problems.push("language guard: does not read as " + r.language);
    if (r.english_source) problems.push(...driftGate(r.english_source, text, r.language));
    const acc = accentGate(text, vocab[r.language]);
    if (acc.length) problems.push("accent (floor 3): " + acc.slice(0, 4).join(", "));
    if (r.language === "pt-BR") problems.push(...convemPlacement(text));
    if (r.english_source) problems.push(...ciaCollision(r.english_source, text, r.language, r.slug));
    if (r.kind === "lesson_span") {
      const c = ceilingGate(r.en_block_words, r.to_block, r.language);
      if (!c.ok) problems.push("per-span ceiling: " + c.w + " words > allowance " + c.cap);
      r.ceiling = c;
    }
    r.gate_problems = problems;
    return problems;
  };

  /* A FAILING ROW IS RETRIED ALONE, AND THE PASSING ROWS ARE NOT TOUCHED.
   * Regenerating the whole batch to fix one row would change the other
   * thirteen -- the generator is not deterministic, which is the reason this
   * script emits bytes rather than printing a preview. The correction is fed
   * back in, because "you inflated a modal" is actionable and "try again" is
   * not. Two attempts, then it stays failed. */
  console.log("");
  console.log("GATES -- " + batch.rows.length + " row(s)");
  for (const r of batch.rows) {
    let problems = gateRow(r);
    for (let attempt = 1; attempt <= 2 && problems.length && r.english_source; attempt++) {
      const note = "A previous attempt was REJECTED by an automated check for: " +
        problems.join("; ") + ". Produce the translation again, correcting exactly that. " +
        "Change nothing else.";
      try {
        const out = await translate(r.english_source, r.language, note);
        if (r.kind === "concept_row") {
          const nm = /NAME:\s*([\s\S]*?)\n\s*\n\s*DESCRIPTION:/i.exec(out);
          const ds = /DESCRIPTION:\s*([\s\S]*)$/i.exec(out);
          if (nm && ds) { r.to_name = nm[1].trim(); r.to_description = ds[1].trim(); }
        } else {
          const parts = out.split(/\n\s*\n/);
          r.to_block = parts[0].trim();
          r.add_paragraph = parts.slice(1).join("\n\n").trim();
        }
        r.retries = attempt;
      } catch { break; }
      problems = gateRow(r);
    }
    if (problems.length) failed++;
    console.log("  " + (problems.length ? "FAIL " : "ok   ") + r.slug.padEnd(42) + r.language +
      (r.ceiling ? "  quote " + r.ceiling.w + "/" + r.ceiling.cap : "") +
      (r.retries ? "  (retried " + r.retries + ")" : ""));
    for (const p of problems) console.log("        " + p);
  }
  if (failed) {
    /* A GATE THAT REJECTS MUST SHOW WHAT IT REJECTED. Otherwise the only way to
     * tell a real defect from an over-firing rule is to regenerate, and a
     * generator produces different text each time -- so the thing you diagnose
     * is never the thing that failed. The rejected draft is written beside the
     * spec, and it is NOT applyable: --from reads the spec path only. */
    const rej = outPath.replace(/\.json$/, "") + ".rejected.json";
    writeFileSync(rej, JSON.stringify(batch, null, 2), "utf8");
    console.log("");
    console.log("ABORT: " + failed + " row(s) failed a gate. NOTHING WRITTEN, no spec emitted.");
    console.log("Rejected draft written to " + rej + " so the failures can be READ.");
    process.exitCode = 1;
    return;
  }
  writeFileSync(outPath, JSON.stringify(batch, null, 2), "utf8");
  console.log("");
  console.log("EMITTED " + outPath + " -- " + batch.rows.length + " row(s), every gate passed.");
  console.log("Nothing was written to the database. Review the file, then --from it.");
}

/* ============ THE PRECONDITION THIS SCRIPT REFUSES TO RUN WITHOUT ==========
 *
 * `trg_lessons_clear_mcp_servable` fires BEFORE UPDATE on any body change and
 * sets `mcp_servable = false` with `mcp_scanned_at = null`. That is fail-closed
 * and correct -- and it means EVERY ROW THIS SCRIPT WRITES GOES DARK until
 * `scan-iso-leaks` runs over the new text.
 *
 * `scan-iso-leaks` needs the nine indexed ISO PDFs on disk. If they are not
 * here, applying this batch is a ONE-WAY DOOR: ten of the twelve lesson rows
 * are already withheld so nothing changes for them, but SD-AI-I 05-03 es-419
 * and pt-BR are SERVING, and this machine could not bring them back.
 *
 * A script that can take live content dark with no local path to restore it
 * must refuse rather than warn. Checked before any write, never after.
 */
async function canRescan() {
  /* PDFS is citation-index's OWN resolved absolute path per indexed source.
   * Recomputing the corpus directory here would be a second copy of a fact --
   * and the first draft of this guard got it wrong by one directory level,
   * which is exactly how a second copy fails. */
  let PDFS;
  try { ({ PDFS } = await import("./lib/citation-index.mjs")); }
  catch (e) { return { ok: false, why: "citation-index would not load: " + String(e).slice(0, 90) }; }
  if (!PDFS || !Object.keys(PDFS).length) return { ok: false, why: "no indexed sources in the manifest" };
  const { existsSync: ex } = await import("node:fs");
  const missing = Object.entries(PDFS).filter(([, path]) => !ex(path)).map(([k]) => k);
  return missing.length
    ? { ok: false, why: missing.length + " of " + Object.keys(PDFS).length +
        " indexed ISO PDF(s) absent (" + missing.slice(0, 3).join(", ") + (missing.length > 3 ? ", ..." : "") + ")" }
    : { ok: true, why: "" };
}

async function applyFrom(specPath) {
  const guard = await canRescan();
  if (!guard.ok) {
    console.error("");
    console.error("REFUSING TO APPLY -- THE RESCAN PATH IS NOT AVAILABLE HERE.");
    console.error("  " + guard.why);
    console.error("  Every lesson body written here is set mcp_servable=false by the trigger");
    console.error("  and stays withheld until scan-iso-leaks runs over the new text.");
    process.exitCode = 2;
    return;
  }

  /* GATES RUN AGAIN ON THE WAY IN. An edited spec must not be able to smuggle
   * anything past a check the generated one faced. */
  const batch = JSON.parse(readFileSync(specPath, "utf8"));

  /* AND THE SPEC MUST STILL BE ABOUT THE LIVE ENGLISH.
   *
   * A batch is emitted from the English as it stood; then somebody fixes the
   * English, which is the right thing to do and is exactly what happened to
   * eight of these thirty renderings. The emission becomes a faithful
   * translation of a sentence that no longer exists -- well-formed, passing
   * every render gate, and wrong. Nothing about it looks stale.
   *
   * This is the en_hash gate's question asked of a FILE rather than a row. The
   * gate protects the database and nothing protected the artifact beside it, so
   * the check belongs HERE, in the apply path, not in a note: a pre-apply check
   * that is not in the apply path is a rule, and a rule can be forgotten. */
  {
    const slugs = [...new Set(batch.rows.map((r) => r.slug))];
    const liveEn = new Map();
    for (const s of slugs) {
      const rows = await rest("lessons?select=slug,content_md&language=eq.en&slug=eq." + s);
      if (rows[0]) liveEn.set(s, rows[0].content_md);
    }
    const staleRows = [];
    for (const r of batch.rows) {
      if (!r.english_source) continue;
      const body = liveEn.get(r.slug);
      /* Absent English is its own state, not "current". */
      if (body === undefined) { staleRows.push([r, "no English row"]); continue; }
      if (!body.includes(r.english_source)) staleRows.push([r, "English source block has moved"]);
    }
    if (staleRows.length) {
      console.error("");
      console.error("REFUSING TO APPLY -- " + staleRows.length + " of " + batch.rows.length +
        " rendering(s) were generated from English that has since changed.");
      for (const [r, why] of staleRows) {
        console.error("  STALE  " + (r.slug + " " + r.language + " b" + r.block_index).padEnd(52) + why);
      }
      console.error("");
      console.error("  Re-emit those rows. Applying them would write a faithful translation of");
      console.error("  a sentence that is no longer in the lesson.");
      process.exitCode = 2;
      return;
    }
  }
  const vocab = {};
  for (const lang of LANGS) vocab[lang] = await accentVocab(lang);
  let gateFailed = 0;
  for (const r of batch.rows) {
    const problems = [];
    const text = r.kind === "concept_row" ? r.to_name + "\n" + r.to_description
               : r.kind === "lesson_terms" ? r.edits.map((e) => e[1]).join("\n")
               : r.to_block + "\n" + (r.add_paragraph || "");
    if (!looksLikeLanguage(text, r.language)) problems.push("language guard");
    if (r.english_source) problems.push(...driftGate(r.english_source, text, r.language));
    const acc = accentGate(text, vocab[r.language]);
    if (acc.length) problems.push("accent: " + acc.join(", "));
    if (r.language === "pt-BR") problems.push(...convemPlacement(text));
    if (r.english_source) problems.push(...ciaCollision(r.english_source, text, r.language, r.slug));
    if (r.kind === "lesson_span") {
      const c = ceilingGate(r.en_block_words, r.to_block, r.language);
      if (!c.ok) problems.push("per-span ceiling " + c.w + ">" + c.cap);
    }
    if (problems.length) { gateFailed++; console.error("  GATE FAIL " + r.slug + "/" + r.language + ": " + problems.join("; ")); }
  }
  if (gateFailed) { console.error(gateFailed + " row(s) fail on the way in. Nothing written."); process.exitCode = 1; return; }

  /* ONE BATCH ROW FOR ALL OF IT. */
  const spec = { register: batch.register, pins: batch.pins,
                 hand_edited: batch.hand_edited || null,
                 rows: batch.rows.map((r) => ({ slug: r.slug, language: r.language, kind: r.kind })) };
  const made = await rest("translation_batches", {
    method: "POST", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ kind: "lesson_span", generator: batch.generator, model: batch.model,
      spec, note: "English moved: ceiling conversions, the 2020-Guide term pass, one concept repair" }),
  });
  const batchId = made[0].id;
  console.log("");
  console.log("BATCH " + batchId);

  /* Apply, then READ BACK AND BYTE-COMPARE. The write path has never run, so
   * its first run gets the strictest check available: not 'the PATCH returned
   * 200' but 'the bytes in the database equal the bytes I computed'. */
  let bad = 0;
  for (const r of batch.rows) {
    let intended = null, id = null, table = null, patch = null;
    if (r.kind === "concept_row") {
      table = "concept_translations"; id = r.translation_id;
      patch = { name: r.to_name, description: r.to_description, translation_batch_id: batchId };
    } else {
      const cur = await rest("lessons?select=id,content_md&id=eq." + r.lesson_id);
      if (cur.length !== 1) { console.log("  MISS  " + r.slug + "/" + r.language); bad++; continue; }
      let body = cur[0].content_md;
      if (r.kind === "lesson_span") {
        const hits = body.split(r.from_block).length - 1;
        if (hits !== 1) { console.log("  MISS  " + r.slug + "/" + r.language + " from_block matched " + hits); bad++; continue; }
        const at = body.indexOf(r.from_block);
        body = body.slice(0, at) + r.to_block +
               (r.add_paragraph ? "\n\n" + r.add_paragraph : "") +
               body.slice(at + r.from_block.length);
      } else {
        for (const [from, to] of r.edits) {
          const n = body.split(from).length - 1;
          if (n !== 1) { console.log("  MISS  " + r.slug + "/" + r.language + " term matched " + n); bad++; body = null; break; }
          body = body.replace(from, to);
        }
        if (body === null) continue;
      }
      table = "lessons"; id = r.lesson_id; intended = body;
      patch = { content_md: body, translation_batch_id: batchId };
    }
    await rest(table + "?id=eq." + id, { method: "PATCH",
      headers: { Prefer: "return=minimal" }, body: JSON.stringify(patch) });
    const back = await rest(table + "?id=eq." + id +
      (table === "lessons" ? "&select=content_md,translation_batch_id"
                                : "&select=name,description,translation_batch_id"));
    const got = back[0];
    const okBytes = table === "lessons"
      ? got.content_md === intended
      : got.name === r.to_name && got.description === r.to_description;
    const okBatch = got.translation_batch_id === batchId;
    if (!okBytes || !okBatch) bad++;
    console.log("  " + ((okBytes && okBatch) ? "ok   " : "FAIL ") +
      r.slug.padEnd(42) + r.language +
      (okBytes ? "  bytes match" : "  BYTES DIFFER") +
      (okBatch ? ", batch stamped" : ", BATCH NOT STAMPED"));
  }
  console.log("");
  if (bad) { console.log(bad + " row(s) did not verify."); process.exitCode = 1; }
  else console.log("All " + batch.rows.length + " rows written and byte-verified under batch " + batchId);
}

if (EMIT) await emit(EMIT);
if (GATE) await gateOnly(GATE);
if (FROM) await applyFrom(FROM);
