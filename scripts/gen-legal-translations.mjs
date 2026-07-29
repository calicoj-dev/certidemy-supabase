/**
 * gen-legal-translations.mjs — translate the Privacy Policy and Terms of
 * Service into es-419 and pt-BR.
 *
 * WHY THIS MATTERS MORE THAN THE OTHER TRANSLATION WORK. Domain descriptions
 * are marketing. This is a contract: users click "By signing up you agree to
 * our Terms". Colombian and Brazilian users are currently agreeing to a binding
 * document in a language that is not theirs, and in several jurisdictions
 * consumer terms must be in the local language to bind at all.
 *
 * WHAT THIS SCRIPT IS AND IS NOT. It produces a reviewable draft. It does not
 * produce something you can ship. A Colombian and a Brazilian lawyer read the
 * output before it goes live - machine translation of a limitation-of-liability
 * clause is a starting point, not a legal document.
 *
 * PLACEHOLDERS ARE THE CRITICAL CONSTRAINT. The English carries bracketed
 * placeholders - [FULL LEGAL ENTITY NAME], [GOVERNING JURISDICTION], [ADDRESS],
 * the refund-policy insert. A model that helpfully renders [GOVERNING
 * JURISDICTION] as [JURISDICCIÓN APLICABLE] leaves you with three documents
 * where filling in one fact means hunting three different strings, and the one
 * you miss is the one nobody reads until it matters.
 *
 * So every placeholder is extracted from the source, counted, and compared
 * against the translation. A mismatch fails the whole document - nothing is
 * written. This is not a warning; it is a refusal.
 *
 * TEMPERATURE 0, not the 0.2 used elsewhere. Faithfulness is the only virtue
 * here, and a re-run should produce the same text.
 *
 * WHAT IS NEVER TRANSLATED: Certidemy, CertiGlobal, certidemy.com,
 * info@certiglobal.org, GDPR, LGPD, CCPA, and any bracketed placeholder.
 * Section numbering is preserved so the three language versions can be read
 * side by side.
 *
 * ON THE EXTRACTOR. The first cut of this script assumed the LegalDoc literals
 * in content.ts were pure data and evaluated them with a bare `new Function`.
 * They are not: `lastUpdated: LAST_UPDATED` references a module constant, and
 * the run died on a ReferenceError. It now collects every top-level string
 * constant from the file and supplies them as bindings, and reports the
 * offending identifier by name if an unknown one ever appears.
 *
 * OUTPUT: lib/legal/es-419.ts and lib/legal/pt-BR.ts. content.ts is NOT
 * modified - the registry patch is printed at the end for you to apply, so a
 * bad run cannot break the pages that are working today.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:DRY_RUN="1"; node scripts\gen-legal-translations.mjs
 *   Remove-Item Env:\DRY_RUN; node scripts\gen-legal-translations.mjs
 *
 * Knobs: DRY_RUN, ONLY_LANG (es-419 | pt-BR), ONLY_DOC (privacy | terms).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

function loadDotEnv() {
  const here = dirname(fileURLToPath(import.meta.url));
  const path = resolve(here, ".env");
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined || process.env[key] === "") process.env[key] = val;
  }
}
loadDotEnv();

const WEB = "C:/Users/Juan/Documents/certidemy/certidemy-web";
const SRC = `${WEB}/lib/legal/content.ts`;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is required (scripts/.env or environment).");
  process.exit(1);
}
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());
const ONLY_LANG = (process.env.ONLY_LANG || "").trim();
const ONLY_DOC = (process.env.ONLY_DOC || "").trim();
const MODEL = "claude-sonnet-4-6";

const LANGS = [
  { code: "es-419", name: "Latin American Spanish", varSuffix: "Es419", file: "es-419.ts" },
  { code: "pt-BR", name: "Brazilian Portuguese", varSuffix: "PtBr", file: "pt-BR.ts" },
].filter((l) => !ONLY_LANG || l.code === ONLY_LANG);

const DOCS = [
  { kind: "privacy", varName: "privacyEn" },
  { kind: "terms", varName: "termsEn" },
].filter((d) => !ONLY_DOC || d.kind === ONLY_DOC);

/* ------------------------------------------------------------------ */
/* Extract the English object literals from content.ts                 */
/* ------------------------------------------------------------------ */

/**
 * Every top-level `const NAME = "value";` in the file, so a literal that
 * references one can still be evaluated. This is what LAST_UPDATED needed.
 */
function topLevelConsts(text) {
  const out = {};
  const re = /^const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*("(?:[^"\\]|\\.)*")\s*;/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    try {
      out[m[1]] = JSON.parse(m[2]);
    } catch {
      // Not a plain string constant - skip it rather than guess.
    }
  }
  return out;
}

function evalLiteral(text, literal, varName) {
  const consts = topLevelConsts(text);
  const names = Object.keys(consts);
  try {
    return new Function(...names, "return " + literal + ";")(...names.map((n) => consts[n]));
  } catch (e) {
    if (e instanceof ReferenceError) {
      throw new Error(
        "content.ts's " + varName + " references an identifier this extractor cannot resolve: " +
        e.message + ".\nKnown constants: " + (names.join(", ") || "(none)") +
        "\nEither inline the value in content.ts, or extend topLevelConsts()."
      );
    }
    throw e;
  }
}

/**
 * Balanced-brace scan from `const <name>: LegalDoc = {` to its closing brace,
 * skipping braces inside string literals.
 */
function extractLiteral(text, varName) {
  const marker = `const ${varName}: LegalDoc = {`;
  const start = text.indexOf(marker);
  if (start === -1) throw new Error(`could not find "${marker}" in content.ts`);
  const braceStart = start + marker.length - 1;

  let depth = 0;
  let inStr = false;
  let quote = "";
  let esc = false;
  for (let i = braceStart; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (c === "\\") { esc = true; continue; }
      if (c === quote) inStr = false;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { inStr = true; quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        return evalLiteral(text, text.slice(braceStart, i + 1), varName);
      }
    }
  }
  throw new Error(`unbalanced braces reading ${varName}`);
}

/* ------------------------------------------------------------------ */
/* Placeholders                                                        */
/* ------------------------------------------------------------------ */

const PLACEHOLDER_RE = /\[[^\]]+\]/g;

function placeholdersOf(doc) {
  const found = [];
  const visit = (s) => {
    const m = String(s).match(PLACEHOLDER_RE);
    if (m) found.push(...m);
  };
  visit(doc.title);
  for (const p of doc.intro ?? []) visit(p);
  for (const s of doc.sections ?? []) {
    visit(s.heading);
    for (const b of s.body ?? []) visit(b);
  }
  return found;
}

/** Multiset comparison - a placeholder appearing twice must appear twice. */
function comparePlaceholders(src, out) {
  const count = (arr) => arr.reduce((m, k) => m.set(k, (m.get(k) ?? 0) + 1), new Map());
  const a = count(src);
  const b = count(out);
  const problems = [];
  for (const [k, n] of a) {
    const m = b.get(k) ?? 0;
    if (m !== n) problems.push(`${k}: source ${n}, translation ${m}`);
  }
  for (const [k, n] of b) {
    if (!a.has(k)) problems.push(`${k}: not in source, translation ${n}`);
  }
  return problems;
}

/* ------------------------------------------------------------------ */
/* Claude                                                              */
/* ------------------------------------------------------------------ */

function systemPrompt(langName) {
  return `You translate legal documents - a Privacy Policy and Terms of Service for an online certification platform - from English into ${langName}.

This is a binding contract, not marketing copy. Translate for legal register: formal, precise, unambiguous. Do not simplify, summarise, soften, or improve the source. If the English is deliberately cautious, keep it cautious.

ABSOLUTE RULES:
  - Text inside square brackets is a PLACEHOLDER awaiting real data. Reproduce every bracketed string EXACTLY as it appears in English, including the brackets and the English words inside them. Never translate, reword, reorder or reformat a placeholder. Example: [GOVERNING JURISDICTION] stays [GOVERNING JURISDICTION].
  - Never translate: Certidemy, CertiGlobal, certidemy.com, info@certiglobal.org, GDPR, LGPD, CCPA, Google.
  - Keep section numbers exactly as given ("6. Cookies and similar technologies" -> "6. " plus the translated heading).
  - Preserve the typographic quotation marks used in the source.
  - Do not add, drop, merge, split or reorder any string.

You will receive a JSON array of {"id": string, "text": string}. Return a JSON array of the SAME length and order, each item {"id": string, "text": string}, with "id" copied EXACTLY and "text" translated.

Output strict JSON only. No prose, no markdown fences.`;
}

async function rawClaude(system, user, maxTokens) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature: 0,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${body.slice(0, 500)}`);
  }
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

function parseJsonArray(text) {
  let t = (text || "").trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (!t.startsWith("[")) {
    const a = t.indexOf("[");
    const b = t.lastIndexOf("]");
    if (a !== -1 && b !== -1 && b > a) t = t.slice(a, b + 1);
  }
  return JSON.parse(t);
}

async function translateItems(langName, items) {
  if (items.length === 0) return new Map();
  const user = `Translate these ${items.length} strings:\n\n${JSON.stringify(items, null, 2)}\n\nReturn the JSON array now.`;
  let text = await rawClaude(systemPrompt(langName), user, 8000);
  let arr;
  try {
    arr = parseJsonArray(text);
  } catch {
    text = await rawClaude(
      systemPrompt(langName),
      user + "\n\nIMPORTANT: your previous response was not valid JSON. Return ONLY strictly valid JSON now.",
      8000
    );
    arr = parseJsonArray(text);
  }
  const out = new Map();
  for (const o of Array.isArray(arr) ? arr : []) {
    if (o && typeof o.id === "string" && typeof o.text === "string") out.set(o.id, o.text);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Flatten a doc into addressable strings and rebuild it               */
/* ------------------------------------------------------------------ */

function flatten(doc) {
  const items = [{ id: "title", text: doc.title }];
  (doc.intro ?? []).forEach((p, i) => items.push({ id: `intro.${i}`, text: p }));
  (doc.sections ?? []).forEach((s, si) => {
    items.push({ id: `s${si}.heading`, text: s.heading });
    (s.body ?? []).forEach((b, bi) => items.push({ id: `s${si}.body.${bi}`, text: b }));
  });
  return items;
}

function rebuild(doc, map) {
  const get = (id, fallback) => map.get(id) ?? fallback;
  return {
    title: get("title", doc.title),
    lastUpdated: doc.lastUpdated,
    intro: (doc.intro ?? []).map((p, i) => get(`intro.${i}`, p)),
    sections: (doc.sections ?? []).map((s, si) => ({
      heading: get(`s${si}.heading`, s.heading),
      body: (s.body ?? []).map((b, bi) => get(`s${si}.body.${bi}`, b)),
    })),
  };
}

/** Chunk so each request stays well inside the token budget. */
function chunk(a, n) {
  const out = [];
  for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n));
  return out;
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  console.log(`Legal translations ${DRY_RUN ? "[DRY RUN]" : "[LIVE]"}`);
  if (ONLY_LANG) console.log(`  ONLY_LANG=${ONLY_LANG}`);
  if (ONLY_DOC) console.log(`  ONLY_DOC=${ONLY_DOC}`);
  console.log("");

  const source = readFileSync(SRC, "utf8");
  const english = {};
  for (const d of DOCS) {
    english[d.kind] = extractLiteral(source, d.varName);
    const doc = english[d.kind];
    const ph = placeholdersOf(doc);
    console.log(
      `${d.kind}: ${doc.sections?.length ?? 0} sections, ` +
      `${flatten(doc).length} strings, ${ph.length} placeholder(s), ` +
      `lastUpdated=${doc.lastUpdated ?? "(none)"}`
    );
    for (const p of [...new Set(ph)]) console.log(`   ${p}`);
  }
  console.log("");

  let failed = 0;

  for (const lang of LANGS) {
    console.log(`== ${lang.code} ==`);
    const translated = {};

    for (const d of DOCS) {
      const doc = english[d.kind];
      const items = flatten(doc);
      const map = new Map();

      for (const part of chunk(items, 12)) {
        const got = await translateItems(lang.name, part);
        for (const [k, v] of got) map.set(k, v);
        process.stdout.write(".");
      }
      process.stdout.write("\n");

      const missing = items.filter((i) => !map.has(i.id));
      if (missing.length) {
        console.log(`  FAIL ${d.kind}: ${missing.length} string(s) missing from the response`);
        failed++;
        continue;
      }

      const out = rebuild(doc, map);
      const problems = comparePlaceholders(placeholdersOf(doc), placeholdersOf(out));
      if (problems.length) {
        console.log(`  FAIL ${d.kind}: placeholders altered -`);
        for (const p of problems) console.log(`         ${p}`);
        failed++;
        continue;
      }

      translated[d.kind] = out;
      console.log(`  ok   ${d.kind}: ${items.length} strings, placeholders intact`);
      if (DRY_RUN) {
        console.log(`       title  : ${out.title}`);
        console.log(`       intro0 : ${(out.intro[0] ?? "").slice(0, 160)}...`);
        console.log(`       s0     : ${out.sections[0]?.heading ?? ""}`);
        const last = out.sections[out.sections.length - 1];
        console.log(`       last   : ${last?.heading ?? ""}`);
      }
    }

    if (Object.keys(translated).length !== DOCS.length) {
      console.log(`  ${lang.code}: incomplete, nothing written\n`);
      continue;
    }

    if (!DRY_RUN) {
      const banner =
        `// AUTO-GENERATED by supabase/scripts/gen-legal-translations.mjs\n` +
        `// Source: lib/legal/content.ts (English). Do not hand-edit - regenerate,\n` +
        `// or promote this file to hand-maintained and delete it from the script.\n` +
        `//\n` +
        `// LAWYER-REVIEWED? NO. This is a reviewable draft of a binding contract.\n` +
        `// It must be read by a qualified reviewer for this jurisdiction before it\n` +
        `// is served to users.\n` +
        `//\n` +
        `// Bracketed placeholders are reproduced verbatim from the English and are\n` +
        `// verified identical by the generator. Fill them in all three languages at\n` +
        `// once, or they will diverge.\n\n` +
        `import type { LegalDoc } from "./content";\n\n`;

      const body = DOCS.map((d) => {
        const name = (d.kind === "privacy" ? "privacy" : "terms") + lang.varSuffix;
        return `export const ${name}: LegalDoc = ${JSON.stringify(translated[d.kind], null, 2)};\n`;
      }).join("\n");

      const path = `${WEB}/lib/legal/${lang.file}`;
      writeFileSync(path, banner + body, { encoding: "utf8" });
      console.log(`  wrote lib/legal/${lang.file}`);
    }
    console.log("");
  }

  if (failed > 0) {
    console.log(`\n${failed} document(s) failed. Nothing was written for those.`);
    process.exit(1);
  }

  if (!DRY_RUN) {
    console.log(`
Next: wire them up in lib/legal/content.ts. Replace the registry block at the
bottom with a per-locale lookup, keeping getLegalDoc's signature so the pages
do not change:

  import { privacyEs419, termsEs419 } from "./es-419";
  import { privacyPtBr, termsPtBr } from "./pt-BR";

  const DOCS: Record<LegalKind, Record<string, LegalDoc>> = {
    privacy: { en: privacyEn, "es-419": privacyEs419, "pt-BR": privacyPtBr },
    terms:   { en: termsEn,   "es-419": termsEs419,   "pt-BR": termsPtBr },
  };

  export function getLegalDoc(
    kind: LegalKind,
    locale: string
  ): { doc: LegalDoc; isFallback: boolean } {
    const byLocale = DOCS[kind];
    const doc = byLocale[locale];
    return doc ? { doc, isFallback: false } : { doc: byLocale.en, isFallback: true };
  }

isFallback then means what it says - the locale genuinely has no document -
rather than 'locale is not English'.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
