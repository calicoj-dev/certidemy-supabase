#!/usr/bin/env node
/**
 * build-batch1-final.mjs -- assemble the batch that will actually be written.
 *
 * READ-ONLY (writes a spec file, never the database). `--out <file>`,
 * `--verbose`. Unknown flags exit 2.
 *
 * ============ EVERY BYTE HAS A NAMED ORIGIN ============
 *
 * Zero model calls. Each of the thirty renderings is built by exactly one
 * declared rule, and the rule says where its bytes come from:
 *
 *   EMITTED      the regeneration's text, unchanged
 *   EMITTED+FIX  the regeneration's text with declared one-hit substitutions
 *   STRING       the director's hand-written text, EXTRACTED from the prompt
 *                rather than retyped, merged with the block lines it does not
 *                show
 *   OLD          the existing translation, byte for byte
 *   FIELDWISE    a checkpoint rebuilt from the existing translation, with only
 *                the fields whose ENGLISH moved taking new text
 *
 * The field rule is keyed on the ENGLISH diff, never on what the regeneration
 * changed: a field whose English never moved has no warrant to be rewritten, and
 * writing the old text back discards the drift the regeneration introduced --
 * measured, that is the 01-03 pt `devem ser retomadas` modal, `deriva`->`desvio`
 * and `etapas`->`fases`, none of which needs a hand-fix now.
 *
 * ============ SUBSTITUTIONS ARE DECLARED AND ASSERTED ============
 *
 * Every substitution names its before and after and must hit exactly once. A
 * blind regex over a paragraph is how agreement breaks silently; a one-hit
 * assertion turns a missed or doubled edit into an abort. Each clause-word
 * substitution also records the measurement that justified it, so the record
 * says WHY the director's word was replaced and by what evidence.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkpointFields, replaceCheckpointField, parseCheckpoint } from "./lib/checkpoint-fields.mjs";

const KNOWN = new Set(["--out", "--verbose"]);
const argv = process.argv.slice(2);
for (const a of argv) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error("Unrecognised flag: " + a); process.exit(2); }
}
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const OUT = val("--out", "BATCH1-FINAL.json");
const VERBOSE = argv.includes("--verbose");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const spec = JSON.parse(readFileSync(join(ROOT, "BATCH1-RETRANSLATION.json"), "utf8"));
const STR = JSON.parse(readFileSync(join(ROOT, "PROMPT-55-STRINGS.json"), "utf8"));

/* ------------------------------------------------- refresh english_source ---
 *
 * Eight rows were emitted before three English template sentences and the 01-03
 * seam were repaired, so their `english_source` is the text as it WAS. Two
 * things depend on it and both would be wrong: the gates compare against it, and
 * the apply path refuses any row whose source is no longer in the live English.
 *
 * So it is re-read from the database. THE CONTROL IS THE ROWS THAT DID NOT MOVE:
 * for every unchanged row the refreshed block must be byte-identical to the one
 * already in the spec, which proves the block addressing is right. If it is not,
 * nothing is written -- a refresh that silently grabs the wrong block would
 * hand every gate the wrong English and every verdict would be about nothing.
 */
for (const p of [join(dirname(fileURLToPath(import.meta.url)), ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
async function rest(path) {
  let last;
  for (let k = 0; k < 6; k++) {
    try {
      const r = await fetch(BASE + "/" + path, { headers: { apikey: KEY, Authorization: "Bearer " + KEY },
        signal: AbortSignal.timeout(45000) });
      if (r.ok) return r.json();
      last = new Error("HTTP " + r.status);
    } catch (e) { last = e; }
    await new Promise((s) => setTimeout(s, 300 * (k + 1)));
  }
  throw last;
}
/* THE REFRESH IS THE KNOWN EDIT REPLAYED, NOT A RE-SPLIT.
 *
 * The first version took `blocksOf(live)[block_index]`. That splitter strips the
 * `::directive` header line, so the refreshed English was a line shorter than the
 * block the emitter had used -- and G1, which counts marker lines, fired on SEVEN
 * renderings whose translations nobody had touched. The instrument manufactured
 * the defect it was measuring for, which is this repository's oldest failure and
 * the second time today I have hit it.
 *
 * So the refresh REPLAYS the four English edits that were actually made, on the
 * stored source, preserving its boundaries exactly. Each is declared with the
 * script that applied it, must hit once, and the result is asserted to be present
 * in the live body -- so a wrong replay aborts instead of being believed. */
const EN_EDITS = [
  { slug: "03-02-awareness-and-communication", by: "fix-english-template-sentences.mjs",
    from: "Clause 7.4 requires the organization to use the reserved verb **determine**, which imports a recorded decision rather than an impression: what must be decided and written down is which communications are **relevant** to the management system, those inside the organization and those with the world outside it, and names four things it must decide:",
    to: "Clause 7.4 uses the reserved verb **determine**, which imports a recorded decision rather than an impression. What the organization has to decide, and write down, is which communications are **relevant** to the management system, both inside the organization and with the world outside it, and the clause names four things the organization must decide:" },
  { slug: "03-04-operational-planning-and-control", by: "fix-english-template-sentences.mjs",
    from: "Clause 8.1 requires the organization to name three obligations, of which **implement** is the middle one: the organization plans its processes, implements them, and then controls them, carrying out the actions **determined** under clause 6, and it says how: by establishing [criteria for the processes]{glossary=\"process-criteria\"}, and by implementing control of the processes in accordance with those criteria.",
    to: "Clause 8.1 names three obligations, of which **implement** is the middle one: the organization plans its processes, implements them, and then controls them, carrying out the actions **determined** under clause 6. The clause also says how: by establishing [criteria for the processes]{glossary=\"process-criteria\"}, and by implementing control of the processes in accordance with those criteria." },
  { slug: "05-02-aims-internal-audit", by: "fix-english-template-sentences.mjs",
    from: "The own-work rule is the canonical way of failing that and is sound practice, but attributing it to this standard's text is a misattribution.",
    to: "Auditing one's own work is the canonical way of failing that, and a rule against it is sound practice, but attributing that rule to this standard's text is a misattribution." },
  { slug: "01-03-the-ai-system-life-cycle", by: "fix-0103-seam.mjs",
    from: "run risk assessments and impact Clause 8.2 sets",
    to: "run risk assessments and impact assessments. Clause 8.2 sets" },
];

const { blocksOf } = await import("./lib/translation-checks.mjs");
const liveEn = new Map();
for (const s of [...new Set(spec.rows.map((r) => r.slug))]) {
  const rows = await rest("lessons?select=slug,content_md&language=eq.en&slug=eq." + s);
  if (rows[0]) liveEn.set(s, { body: rows[0].content_md, blocks: blocksOf(rows[0].content_md) });
}
let refreshed = 0, controlOk = 0, boundaryOnly = 0;
const refreshProblems = [];
for (const r of spec.rows) {
  const live = liveEn.get(r.slug);
  if (!live) { refreshProblems.push(r.slug + ": no live English"); continue; }
  /* THE TEST IS PRESENCE IN THE BODY, NOT EQUALITY WITH A SPLITTER'S BLOCK.
   *
   * `blocksOf` delimits a block slightly more narrowly than the emitter did, so
   * comparing against it reported 14 rows changed when only 8 English sources
   * had actually moved. Swapping the other 6 would have handed the gates a
   * SHORTER English than the translation was made from -- G1 counts marker lines,
   * so a block missing its closing fence would have produced a structure finding
   * against text nobody had touched. The instrument would have manufactured the
   * defect it was measuring for. */
  if (live.body.includes(r.english_source)) {
    if (live.blocks[r.block_index] !== r.english_source) boundaryOnly++; else controlOk++;
    continue;
  }
  let next = r.english_source, applied = [];
  for (const e of EN_EDITS) {
    if (e.slug !== r.slug) continue;
    const n = next.split(e.from).length - 1;
    if (n === 0) continue;
    if (n !== 1) { refreshProblems.push(r.slug + " b" + r.block_index + ": English edit hit " + n + " times"); break; }
    next = next.replace(e.from, e.to);
    applied.push(e.by);
  }
  if (!applied.length) {
    refreshProblems.push(r.slug + " b" + r.block_index + " " + r.language +
      ": source is gone from the live English and no declared edit explains it");
    continue;
  }
  if (!live.body.includes(next)) {
    refreshProblems.push(r.slug + " b" + r.block_index + " " + r.language +
      ": replaying " + applied.join(", ") + " did not reproduce text present in the live English");
    continue;
  }
  r.english_source = next;
  refreshed++;
}
if (refreshProblems.length) {
  console.error("");
  console.error("REFRESH FAILED -- nothing built:");
  for (const p of refreshProblems) console.error("  " + p);
  process.exit(2);
}
console.log("");
console.log("  english_source: " + refreshed + " refreshed (the source really moved), " +
  controlOk + " byte-identical to the live block, " + boundaryOnly +
  " still present in the body but delimited differently -- left alone");

/* ---------------------------------------------------------------- rules ---
 *
 * Keyed slug|block|language. Every one of the thirty is present: a rendering
 * with no rule is an abort, never a silent pass-through.
 */
const S = (k) => { const v = STR[k]; if (!v) throw new Error("no extracted string for " + k); return v; };

/* G5 clause-word substitutions, from PROMPT-56 section 1. Each carries the
 * measurement that justified replacing the director's word. */
const G5 = {
  "03-02-awareness-and-communication|9|es-419": {
    why: "PROMPT-55 wrote `cláusula`, lesson uses `apartado` for dotted refs (apartado 3 refs : cláusula 1)",
    subs: [["La cláusula 7.4", "El apartado 7.4"], ["y la cláusula nombra", "y el apartado nombra"]],
  },
  "03-02-awareness-and-communication|9|pt-BR": {
    why: "PROMPT-55 wrote `cláusula`, lesson uses `Seção` for dotted refs (Seção 3 : cláusula 1)",
    subs: [["A Cláusula 7.4", "A Seção 7.4"], ["e a cláusula nomeia", "e a Seção nomeia"]],
  },
  "03-04-operational-planning-and-control|2|es-419": {
    why: "PROMPT-55 wrote `cláusula`, lesson uses `apartado` for dotted refs (apartado 5 : capítulo 1 : cláusula 1); " +
         "the WHOLE-level `cláusula 6` stands because the gate abstains there",
    subs: [["La cláusula 8.1 nombra", "El apartado 8.1 nombra"],
           ["La cláusula indica también cómo", "El apartado indica también cómo"]],
  },
};

/** Apply declared one-hit substitutions, reporting anything beyond noun+article. */
function substitute(text, subs, tag, notes) {
  let t = text;
  for (const [from, to] of subs) {
    const n = t.split(from).length - 1;
    if (n !== 1) throw new Error(tag + ": substitution `" + from + "` hit " + n + " time(s), must be 1");
    t = t.replace(from, to);
    /* Report when more than the noun and its article moved, as PROMPT-56 asks.
     * Only the G5 clause-word substitutions pass a live `notes` array: a title
     * translation legitimately moves every word and is not agreement drift. */
    const fw = from.split(/\s+/), tw = to.split(/\s+/);
    const moved = fw.filter((w, i) => tw[i] !== w).length;
    if (moved > 2) notes.push(tag + ": `" + from + "` -> `" + to + "` moved " + moved + " words");
  }
  return t;
}

const rules = {};
const R = (slug, block, lang, rule) => { rules[slug + "|" + block + "|" + lang] = rule; };

/* --- hand-written prose, merged with the lines the string does not show --- */
R("01-03-the-ai-system-life-cycle", 14, "es-419", { kind: "STRING", key: "01-03|14|es-419" });
R("01-03-the-ai-system-life-cycle", 14, "pt-BR", { kind: "STRING", key: "01-03|14|pt-BR" });
R("03-02-awareness-and-communication", 9, "es-419", { kind: "STRING", key: "03-02|9|es-419" });
R("03-02-awareness-and-communication", 9, "pt-BR", { kind: "STRING", key: "03-02|9|pt-BR" });
R("03-04-operational-planning-and-control", 2, "es-419", { kind: "STRING", key: "03-04|2|es-419" });
R("03-04-operational-planning-and-control", 2, "pt-BR", { kind: "STRING", key: "03-04|2|pt-BR" });
R("03-04-operational-planning-and-control", 11, "es-419", { kind: "STRING", key: "03-04|11|es-419" });
R("03-04-operational-planning-and-control", 11, "pt-BR", { kind: "STRING", key: "03-04|11|pt-BR" });
R("02-06-the-ai-system-impact-assessment", 9, "pt-BR", { kind: "STRING", key: "02-06|9|pt-BR" });
R("isms-ia-04-02-demonstrated-not-stated", 16, "es-419", { kind: "STRING", key: "isms-ia-04-02|16|es-419" });
R("isms-ia-04-02-demonstrated-not-stated", 16, "pt-BR", { kind: "STRING", key: "isms-ia-04-02|16|pt-BR" });

/* --- emitted, unchanged --- */
for (const [slug, block, lang] of [
  ["03-01-resources-and-competence", 11, "es-419"],
  ["03-03-documented-information", 8, "pt-BR"],
  ["03-03-documented-information", 13, "es-419"],
  ["05-02-aims-internal-audit", 16, "es-419"],
  ["isms-ia-04-02-demonstrated-not-stated", 14, "pt-BR"],
  ["isms-ia-04-02-demonstrated-not-stated", 17, "es-419"],
  ["isms-ia-04-02-demonstrated-not-stated", 17, "pt-BR"],
]) R(slug, block, lang, { kind: "EMITTED" });

/* --- emitted with declared fixes --- */
R("02-06-the-ai-system-impact-assessment", 9, "es-419", {
  kind: "EMITTED+FIX", why: "the closing :: was dropped, which leaves a concept block unclosed",
  appendLine: "::",
});
R("03-02-awareness-and-communication", 2, "es-419", {
  kind: "EMITTED+FIX", why: "the directive title was left in English",
  subs: [['title="What awareness requires"', 'title="Qué exige la conciencia"']],
});
R("03-02-awareness-and-communication", 2, "pt-BR", {
  kind: "EMITTED+FIX",
  /* NOT carried English -- the emission translated the title, but to
   * `consciencia`, and G7 pins awareness (the clause 7.3 heading) to
   * `conscientizacao`. The director's ruling restores the old title. */
  why: "G7: awareness is conscientizacao, not consciencia",
  subs: [['title="O que a consciência requer"', 'title="O que a conscientização exige"']],
});
/* TWO G5 SUBSTITUTIONS IN TEXT PROMPT-55 MARKED CLEAN.
 *
 * Both are flagged rather than folded in quietly, because they change text the
 * director approved. The ruling that authorises them is PROMPT-56 section 1 --
 * "the gate wins" -- and both clear the floor on distinct references.
 *
 * isms-ia-04-02 b14 is COMPELLED rather than merely justified. PROMPT-56 section
 * 2 writes b16 as "a mesma Secao", pointing at 5.2. Leaving b14 at "clausula
 * 5.2" would have two adjacent blocks calling the SAME clause two different
 * things -- an inconsistency this batch would have introduced.
 */
R("isms-ia-04-02-demonstrated-not-stated", 14, "pt-BR", {
  kind: "EMITTED+FIX",
  why: "G5: dotted house word is `Seção` (7 distinct refs : 0); b16 already says `a mesma Seção` of this same clause",
  subs: [["cláusula 5.2", "Seção 5.2"]],
});
R("03-03-documented-information", 8, "es-419", {
  kind: "EMITTED+FIX",
  why: "G5: dotted house word is `apartado` (4 distinct refs : capítulo 1)",
  subs: [["La cláusula 7.5.3 rige", "El apartado 7.5.3 rige"]],
});
R("03-03-documented-information", 13, "pt-BR", {
  kind: "EMITTED+FIX", why: "a leading > renders our own prose as a quotation of the standard",
  stripQuote: true,
});
R("05-02-aims-internal-audit", 16, "pt-BR", {
  kind: "EMITTED+FIX", why: "G7: standard is norma, not padrão",
  subs: [["O padrão", "A norma"], ["pelo padrão", "pela norma"]],
});
/* isms-ia-04-02 b14 es needed no substitution after all: the emission already
 * writes `apartado 5.2`, which is this lesson's dotted house word (35 refs : 0).
 * The rule was written expecting `clausula` and the one-hit assertion caught it
 * -- an assertion that must hit exactly once also catches a repair aimed at
 * something already correct. */
R("isms-ia-04-02-demonstrated-not-stated", 14, "es-419", { kind: "EMITTED" });
R("03-01-resources-and-competence", 11, "pt-BR", {
  kind: "EMITTED+PARTIAL", key: "03-01|11|pt-BR", anchor: "Assegurar",
  why: "`sendo adequado` dangles; the directive line and the first two sentences stay as emitted",
});

/* --- checkpoints, field by field, keyed on the English diff --- */
R("01-03-the-ai-system-life-cycle", 21, "es-419", { kind: "FIELDWISE", changed: {} });
R("01-03-the-ai-system-life-cycle", 21, "pt-BR", { kind: "FIELDWISE", changed: {} });
R("05-02-aims-internal-audit", 28, "es-419", {
  kind: "FIELDWISE", changed: { "q2.explanation": S("05-02|28|q2|es-419")[0] },
});
R("05-02-aims-internal-audit", 28, "pt-BR", {
  kind: "FIELDWISE", changed: { "q2.explanation": S("05-02|28|q2|pt-BR")[0] },
});

/* ------------------------------------------------------------------ build */
const notes = [], problems = [];
const outRows = [];
for (const r of spec.rows) {
  const key = r.slug + "|" + r.block_index + "|" + r.language;
  const rule = rules[key];
  if (!rule) { problems.push("NO RULE for " + key); continue; }
  let to = null;
  try {
    if (rule.kind === "EMITTED") to = r.to_block;
    else if (rule.kind === "EMITTED+FIX") {
      to = r.to_block;
      if (rule.subs) to = substitute(to, rule.subs, key, []);
      if (rule.stripQuote) {
        const lines = to.split("\n");
        const n = lines.filter((l) => /^\s*>\s?/.test(l)).length;
        if (!n) throw new Error(key + ": stripQuote found no quoted line");
        to = lines.map((l) => l.replace(/^(\s*)>\s?/, "$1")).join("\n");
      }
      if (rule.appendLine) {
        if (to.split("\n").map((l) => l.trim()).includes(rule.appendLine)) {
          throw new Error(key + ": appendLine `" + rule.appendLine + "` is already present");
        }
        to = to.replace(/\n*$/, "") + "\n" + rule.appendLine;
      }
    } else if (rule.kind === "EMITTED+PARTIAL") {
      const tail = S(rule.key)[0].replace(/^\s*[.…]+\s*/, "");
      const at = r.to_block.indexOf(rule.anchor);
      if (at < 0) throw new Error(key + ": anchor `" + rule.anchor + "` not in the emitted text");
      if (r.to_block.indexOf(rule.anchor, at + 1) >= 0) throw new Error(key + ": anchor is not unique");
      to = r.to_block.slice(0, at) + tail;
    } else if (rule.kind === "STRING") {
      /* A run may itself be several LINES -- the 02-06 and 03-01 strings arrived
       * as fenced blocks that already carry their closing `::`. Comparing run
       * COUNT against English LINE count appended a second one, and G1 caught
       * it. The unit is the line. */
      const runs = S(rule.key).flatMap((x) => x.split("\n"));
      const enLines = r.english_source.split("\n");
      /* Merge: the string supplies its lines in order; any trailing English line
       * the string does not show (a closing ::) is kept from the block. */
      let lines = runs.slice();
      if (enLines.length > runs.length) {
        for (let i = runs.length; i < enLines.length; i++) {
          const keep = enLines[i].trim();
          if (keep === "::" ) lines.push("::");
          else if (keep === "") lines.push("");
          else problems.push(key + ": English line " + i + " has no counterpart and is not a fence: " + keep.slice(0, 60));
        }
      }
      to = lines.join("\n");
      const g = G5[key];
      if (g) { to = substitute(to, g.subs, key, notes); }
    } else if (rule.kind === "FIELDWISE") {
      if (!parseCheckpoint(r.from_block)) throw new Error(key + ": from_block is not a checkpoint");
      to = r.from_block;
      for (const [path, text] of Object.entries(rule.changed)) {
        const res = replaceCheckpointField(to, path, text);
        if (!res.ok) throw new Error(key + " " + path + ": " + res.why);
        to = res.block;
      }
      /* Assert exactly the declared fields differ from the old translation. */
      const a = new Map(checkpointFields(r.from_block).map((f) => [f.path, f.text]));
      const b = new Map(checkpointFields(to).map((f) => [f.path, f.text]));
      const diff = [...a.keys()].filter((p) => a.get(p) !== b.get(p)).sort();
      const want = Object.keys(rule.changed).sort();
      if (diff.join(",") !== want.join(",")) {
        throw new Error(key + ": changed fields " + JSON.stringify(diff) + " != declared " + JSON.stringify(want));
      }
    } else throw new Error(key + ": unknown rule kind " + rule.kind);
  } catch (e) { problems.push(String(e.message || e)); continue; }
  outRows.push({ ...r, to_block: to, build_rule: rule.kind, build_why: rule.why || (G5[key] && G5[key].why) || "" });
}

console.log("");
console.log("BATCH 1 FINAL -- every byte has a named origin, zero model calls");
console.log("DENOMINATOR: " + spec.rows.length + " rendering(s) in, " + outRows.length + " built");
console.log("");
const byKind = {};
for (const r of outRows) byKind[r.build_rule] = (byKind[r.build_rule] || 0) + 1;
for (const [k, n] of Object.entries(byKind).sort()) console.log("  " + k.padEnd(16) + n);
if (notes.length) {
  console.log("");
  console.log("  SUBSTITUTIONS THAT MOVED MORE THAN A NOUN AND ITS ARTICLE:");
  for (const n of notes) console.log("      " + n);
} else {
  console.log("");
  console.log("  every clause-word substitution moved the noun and its article only");
}
if (problems.length) {
  console.log("");
  console.log("PROBLEMS -- nothing written:");
  for (const p of problems) console.log("  " + p);
  process.exit(1);
}
if (VERBOSE) for (const r of outRows) {
  console.log("");
  console.log("  " + r.slug + " " + r.language + " b" + r.block_index + "  [" + r.build_rule + "]");
  console.log("      " + r.to_block.slice(0, 200).replace(/\n/g, "\\n"));
}
writeFileSync(join(ROOT, OUT), JSON.stringify({ ...spec, rows: outRows, built_from: "BATCH1-RETRANSLATION.json" }, null, 2), "utf8");
console.log("");
console.log("  wrote " + OUT);
