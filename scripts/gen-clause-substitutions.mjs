#!/usr/bin/env node
/**
 * gen-clause-substitutions.mjs -- what G5 says each hand-written string should
 * use, per lesson, per language, PER LEVEL.
 *
 * READ-ONLY. `--md <file>` optional. No other flags.
 *
 * The house word is measured from the body MINUS the block being replaced, so a
 * replacement cannot vote for its own spelling, and separately for WHOLE-number
 * and DOTTED references, because the Spanish convention differs by level and a
 * single word per lesson would apply the wrong one to half the references.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { lessonClauseWord, clauseWordCounts, CLAUSE_WORD_FLOOR } from "./lib/render-gates.mjs";

const argv = process.argv.slice(2);
for (const a of argv) {
  if (a.startsWith("--") && a !== "--md") { console.error("Unrecognised flag: " + a); process.exit(2); }
}
const mi = argv.indexOf("--md");
const MD = mi >= 0 && argv[mi + 1] && !argv[mi + 1].startsWith("--") ? argv[mi + 1] : "";

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

/** The clause words PROMPT-55's hand-written strings use, per target. */
const STRINGS = [
  { slug: "01-03-the-ai-system-life-cycle", block: 14, lang: "es-419", wrote: { whole: "cláusula", dotted: "cláusula" } },
  { slug: "01-03-the-ai-system-life-cycle", block: 14, lang: "pt-BR", wrote: { whole: "cláusula", dotted: "cláusula" } },
  { slug: "02-06-the-ai-system-impact-assessment", block: 9, lang: "pt-BR", wrote: { dotted: "cláusula" } },
  { slug: "03-01-resources-and-competence", block: 11, lang: "pt-BR", wrote: { dotted: "Seção" } },
  { slug: "03-02-awareness-and-communication", block: 9, lang: "es-419", wrote: { dotted: "cláusula" } },
  { slug: "03-02-awareness-and-communication", block: 9, lang: "pt-BR", wrote: { dotted: "cláusula" } },
  { slug: "03-04-operational-planning-and-control", block: 2, lang: "es-419", wrote: { whole: "cláusula", dotted: "cláusula" } },
  { slug: "03-04-operational-planning-and-control", block: 2, lang: "pt-BR", wrote: { whole: "Seção", dotted: "Seção" } },
  { slug: "isms-ia-04-02-demonstrated-not-stated", block: 16, lang: "es-419", wrote: { whole: "cláusula" } },
  { slug: "isms-ia-04-02-demonstrated-not-stated", block: 16, lang: "pt-BR", wrote: { whole: "cláusula" } },
];

async function rest(path) {
  let last;
  for (let k = 0; k < 6; k++) {
    try {
      const r = await fetch(BASE + "/" + path, { headers: H, signal: AbortSignal.timeout(45000) });
      if (r.ok) return r.json();
      last = new Error("HTTP " + r.status);
    } catch (e) { last = e; }
    await new Promise((s) => setTimeout(s, 300 * (k + 1)));
  }
  throw last;
}

const spec = JSON.parse(readFileSync(join(ROOT, "BATCH1-RETRANSLATION.json"), "utf8"));
const rows = [];
for (const t of STRINGS) {
  const [row] = await rest("lessons?select=content_md&slug=eq." + t.slug + "&language=eq." + encodeURIComponent(t.lang));
  if (!row) { rows.push({ ...t, error: "no row" }); continue; }
  const blk = spec.rows.find((r) => r.slug === t.slug && r.language === t.lang && r.block_index === t.block);
  const rest0 = blk ? row.content_md.split(blk.from_block).join(" ") : row.content_md;
  const counts = clauseWordCounts(rest0);
  rows.push({
    ...t,
    house: { whole: lessonClauseWord(rest0, t.lang, "whole"), dotted: lessonClauseWord(rest0, t.lang, "dotted") },
    counts,
  });
}

const fmt = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([w, n]) => w + "=" + n).join(" ") || "none";
const out = [];
const push = (s) => { out.push(s); console.log(s); };
push("");
push("G5 SUBSTITUTIONS -- measured, per level, from the body minus the block");
push("  floor: " + CLAUSE_WORD_FLOOR + " occurrences and a clear lead, per level, or the gate abstains");
push("DENOMINATOR: " + rows.length + " hand-written string(s) examined");
push("");
let subs = 0, stands = 0;
for (const r of rows) {
  push("  " + r.slug + "  " + r.lang + "  b" + r.block);
  push("      whole  : " + fmt(r.counts.whole) + "   ->  " + (r.house.whole || "ABSTAIN"));
  push("      dotted : " + fmt(r.counts.dotted) + "   ->  " + (r.house.dotted || "ABSTAIN"));
  for (const lvl of ["whole", "dotted"]) {
    if (!r.wrote[lvl]) continue;
    const want = r.house[lvl];
    if (!want) { push("      " + lvl + ": PROMPT-55 wrote `" + r.wrote[lvl] + "`, gate ABSTAINS, string stands"); stands++; }
    else if (want === r.wrote[lvl]) { push("      " + lvl + ": PROMPT-55 wrote `" + r.wrote[lvl] + "`, matches the lesson"); stands++; }
    else { push("      " + lvl + ": SUBSTITUTE -- PROMPT-55 wrote `" + r.wrote[lvl] + "`, lesson uses `" + want + "`"); subs++; }
  }
}
push("");
push("  substitutions: " + subs + "   strings standing: " + stands);

if (MD) {
  const md = ["# G5 substitutions -- measured, per level", "",
    "The house word is measured from each body MINUS the block being replaced, so a",
    "replacement cannot vote for its own spelling, and separately for WHOLE-number and",
    "DOTTED references. Floor: " + CLAUSE_WORD_FLOOR + " occurrences and a clear lead, per level, or the gate",
    "abstains and the hand-written string stands.", "",
    "| lesson | lang | level | counts in the lesson | house | PROMPT-55 wrote | outcome |",
    "|---|---|---|---|---|---|---|"];
  for (const r of rows) {
    for (const lvl of ["whole", "dotted"]) {
      if (!r.wrote[lvl]) continue;
      const want = r.house[lvl];
      const outcome = !want ? "gate abstains, **string stands**"
        : want === r.wrote[lvl] ? "matches"
        : "**substitute `" + want + "`**";
      md.push("| `" + r.slug + "` b" + r.block + " | " + r.lang + " | " + lvl + " | " +
        fmt(r.counts[lvl]) + " | " + (want || "—") + " | " + r.wrote[lvl] + " | " + outcome + " |");
    }
  }
  md.push("", "**" + subs + " substitutions, " + stands + " strings standing.**", "");
  writeFileSync(join(ROOT, MD), md.join("\n"), "utf8");
  console.log("  wrote " + MD);
}
