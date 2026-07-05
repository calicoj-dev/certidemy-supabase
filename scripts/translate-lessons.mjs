#!/usr/bin/env node
/**
 * translate-lessons.mjs  (cert-agnostic lesson translator)
 *
 * Translates authored ENGLISH lesson markdown into es-419 or pt-BR, one
 * language per run, preserving the lesson DSL EXACTLY. Disk-first: it writes
 * translated .md files next to the English source (under <in>/_i18n/<lang>/),
 * which are then committed and loaded via the CANONICAL loader
 * (supabase/scripts/load-lessons-direct.mjs). It does NOT emit SQL and must NOT
 * be paired with any gen-*-lesson-sql.mjs path (that is the paste-prone route
 * the loader exists to replace).
 *
 * Generalized from the proven SPO-I translator: same validate-by-graft
 * discipline, no cert hardcoded. `--in` and `--lang` are required; nothing in
 * this file names a specific certification.
 *
 * DESIGN: trust nothing the model emits. Every file is VALIDATED against its
 * English source before it is written. If validation fails, the file is skipped
 * and reported (re-run with --only <lesson_id> --force after eyeballing). The
 * LLM supplies prose; the script guarantees structure.
 *
 * VALIDATION MODEL: instead of guessing which JSON keys hold prose, we FREEZE a
 * known set of STRUCTURAL keys (ids, references, enums, numbers, booleans) and
 * treat every other string leaf as translatable. After blanking the prose
 * leaves, source and output JSON must be structurally identical. This covers
 * all widget schemas + the ::checkpoint block, tolerates new prose keys
 * automatically, and still catches a genuinely moved id/correct/type.
 *
 * FROZEN (validated; mismatch => file skipped)
 *   - frontmatter: lesson_id, module_slug, certification_code, lesson_group_id,
 *     order_index, duration_minutes, task_codes, concept_slugs, prerequisites,
 *     authors, status  (everything EXCEPT title, subtitle, preview)
 *   - `language` is FORCED to the target deterministically
 *   - the ::section marker sequence and every "::" closer
 *   - every marker attribute EXCEPT title / caption (those are prose)
 *   - JSON structural keys: id, type, widget, bloom_level, diagram_type, next,
 *     correct, correct_order, depends_on, best_path, concept_slugs, difficulty,
 *     minimum_correct, completion_threshold, x, y, is_correct, allowReuse
 *   - all {glossary="..."} slugs
 *   - highlight-mistake: every span must remain a substring of its (translated) text
 *
 * TRANSLATED
 *   - frontmatter title / subtitle / preview
 *   - body prose, ::concept title=, ::diagram caption=, [label]{glossary=...} labels
 *   - every non-structural JSON string (text, question, explanation, label,
 *     intro, scenario_title, situation, feedback, span, alt_text,
 *     off/on_consequence, reflection_prompt, reflection_answer,
 *     options/items/targets .text, ...)
 *   - Scrum proper nouns + brand names are kept in English
 *
 * USAGE  (run from the certidemy-web repo root)
 *   node ..\supabase\scripts\translate-lessons.mjs --in content\<cert> --lang es-419
 *   node ..\supabase\scripts\translate-lessons.mjs --in content\<cert> --lang pt-BR
 *
 * THEN LOAD (canonical, from the supabase repo root):
 *   $env:CERT_ID="<cert-uuid>"
 *   node scripts\load-lessons-direct.mjs --in <content\<cert>\_i18n\<lang>> --lang <lang> --dry
 *   node scripts\load-lessons-direct.mjs --in <content\<cert>\_i18n\<lang>> --lang <lang>
 *   # NO re-wire needed: translations share the en row's lesson_group_id, so they
 *   # inherit its lesson_concepts / lesson_tasks automatically.
 *
 * FLAGS
 *   --in   <dir>            REQUIRED  (e.g. content\sd-ai-i) — no default, not cert-specific
 *   --lang <es-419|pt-BR>   REQUIRED
 *   --out  <dir>            default <in>\_i18n\<lang>
 *   --env  <path>           default ..\supabase\scripts\.env  (for ANTHROPIC_API_KEY)
 *   --only <lesson_id>      translate just one lesson (smoke test / retry a failure)
 *   --limit <n>             translate only the first n lessons
 *   --force                 overwrite existing output files (default: skip them)
 *   --concurrency <n>       parallel API calls (default 4)
 */

import {
  readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync,
} from "node:fs";
import path from "node:path";

const MODEL = "claude-sonnet-4-6";
const API_URL = "https://api.anthropic.com/v1/messages";

const LANG_NAMES = {
  "es-419": "neutral Latin American Spanish (español latinoamericano, locale es-419)",
  "pt-BR": "Brazilian Portuguese (português do Brasil, locale pt-BR)",
};

// JSON keys whose VALUES are structural (ids / references / enums / numbers /
// booleans) and must be frozen. Any other string value is treated as prose.
const STRUCTURAL = new Set([
  "id", "type", "widget", "bloom_level", "diagram_type", "next",
  "correct", "correct_order", "depends_on", "best_path", "concept_slugs",
  "difficulty", "minimum_correct", "completion_threshold", "x", "y",
  "is_correct", "allowReuse",
]);

// Marker attributes that ARE prose (everything else on a marker is frozen).
const TRANSLATABLE_ATTRS = new Set(["title", "caption"]);

// ---------------------------------------------------------------------------
// args + env
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const a = {
    lang: null, in: null, out: null,
    env: "../supabase/scripts/.env", only: null, limit: 0,
    force: false, concurrency: 4,
  };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--lang") a.lang = argv[++i];
    else if (k === "--in") a.in = argv[++i];
    else if (k === "--out") a.out = argv[++i];
    else if (k === "--env") a.env = argv[++i];
    else if (k === "--only") a.only = argv[++i];
    else if (k === "--limit") a.limit = parseInt(argv[++i], 10) || 0;
    else if (k === "--force") a.force = true;
    else if (k === "--concurrency") a.concurrency = parseInt(argv[++i], 10) || 4;
  }
  if (!a.in) {
    console.error("--in <content-dir> is required (e.g. content\\sd-ai-i). No default: this tool is cert-agnostic.");
    process.exit(1);
  }
  if (!LANG_NAMES[a.lang]) {
    console.error(`--lang must be one of: ${Object.keys(LANG_NAMES).join(", ")}`);
    process.exit(1);
  }
  if (!a.out) a.out = path.join(a.in, "_i18n", a.lang);
  return a;
}

function loadEnvFile(p) {
  const out = {};
  if (!existsSync(p)) return out;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    if (line.trim().startsWith("#")) continue;
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

function getApiKey(envPath) {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const env = loadEnvFile(envPath);
  if (env.ANTHROPIC_API_KEY) return env.ANTHROPIC_API_KEY;
  console.error(
    `No ANTHROPIC_API_KEY in process.env or ${envPath}. ` +
      `Set it or pass --env <path-to-.env>.`
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// fs walk
// ---------------------------------------------------------------------------
function walkMd(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "_i18n") continue; // never re-translate our own output
      out.push(...walkMd(full));
    } else if (name.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// parsing helpers
// ---------------------------------------------------------------------------
function splitFile(text) {
  const m = text.match(/^(\s*---\s*\n)([\s\S]*?)(\n---\s*\n)([\s\S]*)$/);
  if (!m) return null;
  return { open: m[1], fmBlock: m[2], close: m[3], body: m[4] };
}

function fmField(text, key) {
  const p = splitFile(text);
  if (!p) return null;
  const m = p.fmBlock.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, "m"));
  return m ? m[1].trim() : null;
}
const lessonIdOf = (t) => fmField(t, "lesson_id");
const languageOf = (t) => fmField(t, "language");

// Strip the translatable / volatile lines so the rest can be compared verbatim.
function frozenFrontmatter(fmBlock) {
  const lines = fmBlock.split(/\r?\n/);
  const keep = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(title|subtitle|language):/.test(line)) continue;
    if (/^preview:/.test(line)) {
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) i++;
      continue;
    }
    keep.push(line);
  }
  return keep.join("\n").trim();
}

// Parse ::section markers into ordered records (keyword, attrs, content lines).
function parseSections(body) {
  const lines = body.split(/\r?\n/);
  const secs = [];
  let cur = null;
  let closers = 0;
  for (const line of lines) {
    const open = line.match(/^::([A-Za-z][\w-]*)(.*)$/);
    if (open) {
      const attrs = {};
      for (const m of open[2].matchAll(/(\w+)="([^"]*)"/g)) attrs[m[1]] = m[2];
      cur = { keyword: open[1], attrs, content: [] };
      secs.push(cur);
      continue;
    }
    if (/^::\s*$/.test(line)) { closers++; cur = null; continue; }
    if (cur) cur.content.push(line);
  }
  return { secs, closers };
}

// Deterministic stringify with sorted object keys (tolerates key reordering).
function stable(v) {
  if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
  if (v && typeof v === "object") {
    return "{" + Object.keys(v).sort()
      .map((k) => JSON.stringify(k) + ":" + stable(v[k])).join(",") + "}";
  }
  return JSON.stringify(v);
}

// Freeze structural keys; blank every other string leaf. What remains is pure
// structure, identical between a lesson and a faithful translation of it.
function normalize(v) {
  if (Array.isArray(v)) return v.map(normalize);
  if (v && typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v)) {
      if (STRUCTURAL.has(k)) o[k] = v[k];            // freeze subtree
      else if (typeof v[k] === "string") o[k] = "";  // prose leaf -> blank
      else o[k] = normalize(v[k]);                    // recurse container
    }
    return o;
  }
  return v;
}

function glossarySlugs(body) {
  return [...body.matchAll(/\{glossary="([^"]+)"\}/g)].map((m) => m[1]).sort();
}

// ---------------------------------------------------------------------------
// validation
// ---------------------------------------------------------------------------
function validate(srcText, outText, lang) {
  const errs = [];
  const src = splitFile(srcText);
  const out = splitFile(outText);
  if (!out) return ["output has no parseable frontmatter"];

  if (frozenFrontmatter(src.fmBlock) !== frozenFrontmatter(out.fmBlock)) {
    errs.push("frontmatter frozen region changed (a non-title/subtitle/preview field moved)");
  }
  if (languageOf(outText) !== lang) {
    errs.push(`language is '${languageOf(outText)}', expected '${lang}'`);
  }

  const sSec = parseSections(src.body);
  const oSec = parseSections(out.body);

  if (sSec.secs.length !== oSec.secs.length) {
    errs.push(`section count ${oSec.secs.length} != ${sSec.secs.length}`);
  }
  if (sSec.closers !== oSec.closers) {
    errs.push(`'::' closer count ${oSec.closers} != ${sSec.closers}`);
  }

  const n = Math.min(sSec.secs.length, oSec.secs.length);
  for (let i = 0; i < n; i++) {
    const s = sSec.secs[i], o = oSec.secs[i];
    if (s.keyword !== o.keyword) {
      errs.push(`section ${i}: keyword '${o.keyword}' != '${s.keyword}'`);
      continue;
    }
    // marker attributes: everything except title/caption must match by value
    const keys = new Set([...Object.keys(s.attrs), ...Object.keys(o.attrs)]);
    for (const k of keys) {
      if (TRANSLATABLE_ATTRS.has(k)) continue;
      if (s.attrs[k] !== o.attrs[k]) {
        errs.push(`section ${i} (${s.keyword}): attr ${k}="${o.attrs[k]}" != "${s.attrs[k]}"`);
      }
    }
    // JSON-bearing sections: structural identity after blanking prose
    if (s.keyword === "interactive" || s.keyword === "checkpoint") {
      let sj, oj;
      try { sj = JSON.parse(s.content.join("\n").trim()); }
      catch { errs.push(`section ${i}: source JSON unparseable (skipping check)`); continue; }
      try { oj = JSON.parse(o.content.join("\n").trim()); }
      catch (e) { errs.push(`section ${i}: output JSON does not parse (${e.message})`); continue; }
      if (stable(normalize(sj)) !== stable(normalize(oj))) {
        errs.push(`section ${i} (${s.keyword}): JSON structure changed (a frozen id/correct/type/ref moved)`);
      }
      // highlight-mistake: each span must remain a substring of the translated text
      if ((o.attrs.widget || "").startsWith("highlight")) {
        const t = typeof oj.text === "string" ? oj.text : "";
        for (const h of (oj.highlights || [])) {
          if (typeof h.span === "string" && !t.includes(h.span)) {
            errs.push(`section ${i} (highlight): span no longer found in text -> "${h.span.slice(0, 50)}..."`);
          }
        }
      }
    }
  }

  const ss = glossarySlugs(src.body), os = glossarySlugs(out.body);
  if (ss.join("|") !== os.join("|")) {
    errs.push(`glossary slugs changed: [${os.join(", ")}] != [${ss.join(", ")}]`);
  }
  return errs;
}

// Deterministically force `language: <lang>` regardless of model output.
function forceLanguage(text, lang) {
  const p = splitFile(text);
  if (!p) return text;
  let fm = p.fmBlock;
  fm = /^language:.*$/m.test(fm)
    ? fm.replace(/^language:.*$/m, `language: ${lang}`)
    : fm + `\nlanguage: ${lang}`;
  return p.open + fm + p.close + p.body;
}

// ---------------------------------------------------------------------------
// model call
// ---------------------------------------------------------------------------
function systemPrompt(lang) {
  const name = LANG_NAMES[lang];
  return `You are an expert localizer of Scrum certification content into ${name}.

You will receive ONE lesson markdown file written in a strict custom DSL. Return the COMPLETE translated file and NOTHING else — no commentary, no code fences.

TRANSLATE into natural, professional ${name}:
- Frontmatter values of: title, subtitle, preview. Keep the YAML keys and the "preview: |" block style.
- All body prose, list items, callouts, summaries.
- The title="..." value on ::concept and ::deep-dive markers, and the caption="..." value on ::diagram markers.
- The bracketed LABEL in [label]{glossary="slug"} — translate the label, keep the slug verbatim.
- Inside JSON blocks, EVERY human-readable display string. Depending on the widget this includes: text, question, explanation, label, intro, scenario_title, situation, feedback, span, alt_text, off_consequence, on_consequence, reflection_prompt, reflection_answer, and the "text" of any options/items/targets entry.

NEVER CHANGE — copy byte-for-byte:
- Every other frontmatter field: lesson_id, module_slug, certification_code, lesson_group_id, order_index, duration_minutes, task_codes, concept_slugs, prerequisites, authors, status. Do NOT translate the "language" field.
- The "---" frontmatter fences, every ::section marker keyword, and every "::" closing line.
- Marker attributes other than title/caption: type="...", widget="...", id="...", concept_slugs="...".
- All glossary slugs inside {glossary="..."}.
- Inside JSON: every value of these keys — id, type, widget, bloom_level, diagram_type, next, difficulty, x, y, is_correct, allowReuse, minimum_correct, completion_threshold, concept_slugs — and the entire contents of correct, correct_order, depends_on, and best_path (these are id references). Keep all arrays in their original order. Output must stay valid JSON.
- Markdown structure: headings, bold/italic, list bullets, links, line breaks.

CRITICAL for the highlight-mistake widget: each entry in "highlights" has a "span" that is a VERBATIM substring of the top-level "text". When you translate "text", translate each "span" to the EXACT corresponding substring of your translated text, so the span can still be found inside it character-for-character.

DO NOT TRANSLATE these Scrum proper nouns / framework terms / acronyms — keep them in English exactly:
Scrum, Sprint, Sprint Planning, Sprint Review, Sprint Retrospective, Sprint Backlog, Sprint Goal, Product Backlog, Product Backlog Item, Product Owner, Scrum Master, Developers, Scrum Team, Increment, Product Goal, Definition of Done, Daily Scrum, Scrum Guide, INVEST, ROI, MVP, DoD, KPI, OKR, TDD, CI, CD, and the brand name Certidemy.

Return only the full file content.`;
}

async function callModel(apiKey, lang, fileText, attempt = 0) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      temperature: 0.2,
      system: systemPrompt(lang),
      messages: [{ role: "user", content: fileText }],
    }),
  });
  if (!res.ok) {
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      return callModel(apiKey, lang, fileText, attempt + 1);
    }
    throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = await res.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text").map((b) => b.text).join("");
  return text.replace(/^```[a-z]*\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim() + "\n";
}

// ---------------------------------------------------------------------------
// concurrency pool
// ---------------------------------------------------------------------------
async function runPool(items, limit, worker) {
  let i = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; await worker(items[idx]); }
  });
  await Promise.all(runners);
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apiKey = getApiKey(args.env);

  let files = walkMd(args.in)
    .map((f) => ({ f, text: readFileSync(f, "utf8") }))
    .filter((x) => (languageOf(x.text) ?? "en") === "en");

  if (args.only) files = files.filter((x) => lessonIdOf(x.text) === args.only);
  if (args.limit > 0) files = files.slice(0, args.limit);

  console.log(`\nTranslating ${files.length} EN lesson(s) -> ${args.lang}`);
  console.log(`  in : ${args.in}`);
  console.log(`  out: ${args.out}`);
  console.log(`  model: ${MODEL}  concurrency: ${args.concurrency}\n`);

  const failed = [];
  let wrote = 0, skipped = 0;

  await runPool(files, args.concurrency, async ({ f, text }) => {
    const rel = path.relative(args.in, f);
    const dest = path.join(args.out, rel);
    const id = lessonIdOf(text);

    if (!args.force && existsSync(dest)) {
      console.log(`  skip (exists)   ${id}`);
      skipped++;
      return;
    }
    try {
      let out = await callModel(apiKey, args.lang, text);
      out = forceLanguage(out, args.lang);
      const errs = validate(text, out, args.lang);
      if (errs.length) {
        console.log(`  FAIL            ${id}`);
        errs.forEach((e) => console.log(`        - ${e}`));
        failed.push(id);
        return;
      }
      mkdirSync(path.dirname(dest), { recursive: true });
      writeFileSync(dest, out, "utf8");
      console.log(`  ok              ${id}  -> ${rel}`);
      wrote++;
    } catch (e) {
      console.log(`  ERROR           ${id}: ${e.message}`);
      failed.push(id);
    }
  });

  console.log(`\nDone. wrote ${wrote}, skipped ${skipped}, failed ${failed.length}.`);
  if (failed.length) {
    console.log(`\nRetry the failures one at a time, e.g.:`);
    console.log(`  node <this> --in ${args.in} --lang ${args.lang} --only ${failed[0]} --force`);
  } else if (wrote > 0) {
    console.log(`\nNext (canonical load, from the supabase repo root):`);
    console.log(`  $env:CERT_ID="<cert-uuid>"`);
    console.log(`  node scripts\\load-lessons-direct.mjs --in ${args.out} --lang ${args.lang} --dry`);
    console.log(`  node scripts\\load-lessons-direct.mjs --in ${args.out} --lang ${args.lang}`);
    console.log(`  (No re-wire: translations share the en lesson_group_id and inherit its links.)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
