#!/usr/bin/env node
/**
 * gen-translation-sample.mjs - a stratified, reproducible sample of SECURE translated items with
 * their English siblings, for a bilingual read.
 *
 * READ-ONLY. It writes one markdown file and touches no table. Unknown flags exit 2.
 *
 *   --seed=<int>      default 4919, RECORDED in the document
 *   --per-cert=<n>    default 5, so 12 certifications x 5 x 2 languages = 120 items
 *   --out=<path>      default TRANSLATION-SAMPLE.md
 *
 * ============ WHY IT IS NOT gen-item-translation-review.mjs ============
 *
 * That script renders the same shape -- group, every field, English beside both languages -- and it
 * is scoped to a REWRITE SPEC: every group in it is a repair of a false attribution, and its header
 * tells the reviewer what each group must carry. Pointing it at a random sample would produce a
 * document whose own framing is false about its contents, which is worse than a second renderer.
 *
 * ============ INDEPENDENT BY DEFAULT, PAIRED ON REQUEST, AND THE DEFAULT ONCE LIED ABOUT ITSELF ====
 *
 * `--paired` draws GROUPS and emits both languages of each, so every item carries its own
 * cross-language control. Without it the draws are INDEPENDENT: the per-stratum seed is
 * `seed XOR hash(cert|language)` and the language is in the hash, so the two languages shuffle
 * differently and land on different groups.
 *
 * THE FIRST VERSION OF THIS HEADER SAID THE SAME GROUP WAS DRAWN IN BOTH LANGUAGES. It was not, and
 * the document said so too: measured on the 2026-09-27 draw, 120 English renderings and 118 distinct,
 * so exactly 2 of 60 pairs shared a sibling. I wrote the pairing rationale and then seeded per
 * language, which is the rationale's own opposite -- and nothing measured it, because the figure the
 * document reported was "English siblings paired: 120 of 120", which counts whether each row FOUND an
 * English sibling and not whether the two languages found the SAME one. A count that looks like the
 * property and is not is worse than no count.
 *
 * The trade-off is real in both directions, so it is a flag rather than a fix:
 *
 *   independent   ~2N distinct groups seen, one rendering each, no contrast
 *   --paired       N distinct groups, two renderings each, every one its own control
 *
 * CLAUDE.md records what independent draws cost -- two cleared draws served a defect rooted in the
 * English, because a source defect traps both renderings and only a contrast shows it. It also
 * records what the independent draw bought here: the English defect rate, which is several times the
 * translation defect rate and was only visible because ~118 distinct English items were read.
 *
 * The English is printed beside both either way: a translation can only be judged against what it
 * translates, and a translation BETTER than its English is evidence about the English.
 *
 * ============ THE SEED IS RECORDED AND THE STRATUM IS PART OF IT ============
 *
 * Each stratum is shuffled with `seed XOR hash(cert|language)`, so one certification's draw does not
 * move when another's population changes. A sample nobody can redraw is an anecdote; a seed recorded
 * only in a terminal is a seed nobody has.
 *
 * ============ READS ARE ORDERED ============
 *
 * `getAll` pages with Range headers, and over a query with no `order by` that returns a different SET
 * each run while the count still matches. This table is 28,000 rows. Every read here carries an
 * explicit order on a unique column, and `_pg.mjs` refuses an unordered multi-page read anyway.
 *
 * ============ THE OUTPUT IS GITIGNORED, DELIBERATELY ============
 *
 * It carries live SECURE examination items and their keys. `TRANSLATION-REVIEW-*.md` is already
 * ignored on the weaker ground of being regenerable; this is the examination bank. It is regenerable
 * in one command, and the command is in the document's own header.
 */
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let SEED = 4919, PER_CERT = 5, OUT = "TRANSLATION-SAMPLE.md", PAIRED = false;
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--seed=(\d+)$/.exec(a))) { SEED = Number(m[1]); continue; }
  if ((m = /^--per-cert=(\d+)$/.exec(a))) { PER_CERT = Number(m[1]); continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  if (a === "--paired") { PAIRED = true; continue; }
  console.error("unknown flag " + JSON.stringify(a) + ". Known: --seed=, --per-cert=, --out=, --paired");
  console.error("This script is READ-ONLY: there is no --apply and no --dry, because it writes nothing.");
  process.exitCode = 2; process.exit();
}

const LANGS = ["es-419", "pt-BR"];

/* mulberry32. A named, tiny, deterministic PRNG rather than Math.random, which is unavailable here and
 * would make the seed a decoration. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const strHash = (s) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
};
/* Fisher-Yates over a COPY, so the caller's order is untouched and the draw is a function of the
 * sorted input and the seed alone. */
function shuffled(list, seed) {
  const a = list.slice();
  const r = rng(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const KEY = requireKey(HERE);

/* ---------------------------------------------------------------- the population */
const certs = await getAll(KEY, "certifications?select=id,code,name&order=code");
if (!certs.length) { console.error("no certifications -- refusing to write an empty sample"); process.exitCode = 3; process.exit(); }

const SELECT = "id,certification_id,task_id,question_group_id,language,question_text,options," +
  "correct_answer,explanation,question_type,difficulty,item_origin";
const POP = "quiz_questions?select=" + SELECT +
  "&pool=eq.secure&status=eq.approved&retired_at=is.null&language=in.(es-419,pt-BR)&order=id";
const pop = await getAll(KEY, POP);

const tasks = await getAll(KEY, "tasks?select=id,code&order=id");
const taskCode = new Map(tasks.map((t) => [t.id, t.code]));
const certByRow = new Map(certs.map((c) => [c.id, c]));

/* ---------------------------------------------------------------- the draw, per stratum */
const strata = [];
let pairedGroups = 0;
for (const c of certs) {
  const byLang = new Map(LANGS.map((l) => [l, pop
    .filter((r) => r.certification_id === c.id && r.language === l)
    .sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0))]));

  if (PAIRED) {
    /* ============ THE UNIT IS THE GROUP, AND THE SEED CANNOT CARRY THE LANGUAGE ============
     *
     * Draw from the groups present in BOTH languages, seed WITHOUT the language, and emit each drawn
     * group in both. Putting the language in the hash is what made the default draw independent while
     * its own header claimed otherwise, so here it is structurally absent rather than merely omitted:
     * one shuffle, one list of groups, both languages read off it. */
    const rowsByGroup = new Map();
    for (const l of LANGS) {
      for (const r of byLang.get(l)) {
        if (!r.question_group_id) continue;
        if (!rowsByGroup.has(r.question_group_id)) rowsByGroup.set(r.question_group_id, new Map());
        rowsByGroup.get(r.question_group_id).set(l, r);
      }
    }
    const complete = [...rowsByGroup.entries()]
      .filter(([, m]) => LANGS.every((l) => m.has(l)))
      .map(([g]) => g)
      .sort();
    const drawnGroups = shuffled(complete, SEED ^ strHash(c.code)).slice(0, PER_CERT);
    pairedGroups += drawnGroups.length;
    for (const lang of LANGS) {
      strata.push({
        cert: c, lang, population: complete.length, paired: true,
        drawn: drawnGroups.map((g) => rowsByGroup.get(g).get(lang)),
      });
    }
    continue;
  }

  for (const lang of LANGS) {
    const inStratum = byLang.get(lang);
    const drawn = shuffled(inStratum, SEED ^ strHash(c.code + "|" + lang)).slice(0, PER_CERT);
    strata.push({ cert: c, lang, population: inStratum.length, paired: false, drawn });
  }
}

/* EMPTY and SHORT are different states and folding them loses the one that matters. A stratum with a
 * population of zero has nothing to sample -- ZZ-TEST-I, the test certification, has no secure
 * translated items at all -- and calling that "drawn short" invites someone to look for five missing
 * items. A stratum with four of five available is genuinely short. */
const empty = strata.filter((s) => s.population === 0);
const short = strata.filter((s) => s.population > 0 && s.drawn.length < PER_CERT);
const totalDrawn = strata.reduce((n, s) => n + s.drawn.length, 0);

/* ---------------------------------------------------------------- the English siblings
 *
 * Read by group id, an `in.()` filter that cannot be truncated by the row cap. A group with no
 * English row is its own state: it is printed as MISSING rather than dropped, because a sample that
 * silently omits what it could not pair reports a coverage it does not have. */
const groupIds = [...new Set(strata.flatMap((s) => s.drawn.map((r) => r.question_group_id)).filter(Boolean))];
const enRows = groupIds.length
  ? await getAllIn(KEY, "quiz_questions", SELECT, "question_group_id", groupIds,
      "&language=eq.en&order=id")
  : [];
const enByGroup = new Map();
for (const r of enRows) if (!enByGroup.has(r.question_group_id)) enByGroup.set(r.question_group_id, r);

const noGroup = strata.flatMap((s) => s.drawn.filter((r) => !r.question_group_id));
const noEnglish = strata.flatMap((s) => s.drawn.filter((r) => r.question_group_id && !enByGroup.has(r.question_group_id)));

/* ---------------------------------------------------------------- the document */
const md = [];
const p = (s = "") => md.push(s);
const esc = (s) => String(s ?? "").replace(/\r/g, "").trim();

/* ============ THE KEY IS AN ID, READ FROM THE DATA RATHER THAN GUESSED ============
 *
 * `correct_answer` is a jsonb ARRAY OF OPTION IDS -- `["a"]`, or several for a multi-select -- and
 * `options` is an array of `{id, text}`. My first version guessed at an index, a letter, a literal and
 * an `is_correct` flag, and matched none of them: it reported "key not identifiable" on all 240
 * renderings and marked ZERO keys.
 *
 * That is the instrument failing LOUDLY, which is the only reason it did not ship. A version that
 * silently marked nothing would have produced a readable sample in which the key was simply absent --
 * and a reviewer reading four options with no key marked judges the distractors against nothing. So
 * UNIDENTIFIED stays as a third state, per item, printed. */
function optId(o) { return o && typeof o === "object" ? (o.id ?? o.key ?? null) : null; }
function optText(o) { return o && typeof o === "object" ? (o.text ?? o.option ?? o.label ?? JSON.stringify(o)) : o; }

const keyIdsOf = (r) => {
  const opts = Array.isArray(r.options) ? r.options : [];
  const ca = r.correct_answer;
  const ids = Array.isArray(ca) ? ca.map((x) => String(x))
    : typeof ca === "string" ? [ca]
    : [];
  const present = ids.filter((id) => opts.some((o) => String(optId(o)) === id));
  if (!ids.length) return { ids: new Set(), how: "UNIDENTIFIED: correct_answer is neither an array nor a string" };
  if (!present.length) return { ids: new Set(), how: "UNIDENTIFIED: no option carries id " + ids.join(", ") };
  if (present.length < ids.length) {
    return { ids: new Set(present), how: "PARTIAL: " + (ids.length - present.length) + " key id(s) match no option" };
  }
  return { ids: new Set(present), how: present.length > 1 ? "multi-select, " + present.length + " keys" : "ok" };
};

let unidentified = 0, multiSelect = 0, renderings = 0;
const renderItem = (r, label) => {
  const k = keyIdsOf(r);
  renderings++;
  if (k.how.startsWith("UNIDENTIFIED") || k.how.startsWith("PARTIAL")) unidentified++;
  if (k.how.startsWith("multi")) multiSelect++;
  p("**" + label + "**  " + esc(r.question_text));
  p("");
  for (const o of (Array.isArray(r.options) ? r.options : [])) {
    const id = String(optId(o));
    p("- " + (k.ids.has(id) ? "**[KEY]** " : "") + "(" + id + ") " + esc(optText(o)));
  }
  if (!k.how.startsWith("ok") && !k.how.startsWith("multi")) {
    p("- *(" + k.how + " -- reported, not guessed)*");
  }
  if (r.explanation) { p(""); p("*Explanation:* " + esc(r.explanation)); }
  p("");
};

p("# Translation sample: 120 secure items, both languages, English beside each");
p("");
p("Read-only sample for a bilingual read. Nothing was written. **Not committed** -- it carries live");
p("secure examination items and their keys. Regenerate with:");
p("");
p("```");
p("node --dns-result-order=ipv4first scripts/gen-translation-sample.mjs --seed=" + SEED +
  " --per-cert=" + PER_CERT);
p("```");
p("");
p("| | |");
p("|---|---|");
p("| seed | **" + SEED + "** (each stratum uses `seed XOR hash(cert|language)`) |");
p("| stratum | certification x language, " + PER_CERT + " items each |");
p("| population | secure, approved, not retired, es-419 or pt-BR |");
p("| items drawn | " + totalDrawn + " (" + strata.length + " strata) |");
p("| paired English sibling | " + (totalDrawn - noGroup.length - noEnglish.length) + " of " + totalDrawn + " |");
p("");
/* ============ THE PAIRING CLAIM IS MEASURED, NOT ASSERTED ============
 *
 * The first version of this document claimed the same group was drawn in both languages while the seed
 * carried the language and made the draws independent. So the claim is now computed from the draw
 * itself: how many groups appear in both languages. A sentence about a property, printed next to the
 * count of that property, cannot go stale the way the first one did.
 *
 * "English siblings paired: N of N" did NOT catch it, and that is the lesson: it counts whether each
 * row found an English sibling, not whether the two languages found the SAME one. */
const groupsPerLang = new Map(LANGS.map((l) => [l, new Set(strata
  .filter((s) => s.lang === l).flatMap((s) => s.drawn.map((r) => r.question_group_id).filter(Boolean)))]));
const sharedGroups = [...groupsPerLang.get(LANGS[0])].filter((g) => groupsPerLang.get(LANGS[1])?.has(g)).length;
const distinctGroups = new Set([...groupsPerLang.values()].flatMap((s) => [...s])).size;

if (PAIRED) {
  p("**PAIRED: the same group is drawn in both languages**, measured rather than claimed -- **" +
    sharedGroups + " of " + Math.max(1, Math.round(totalDrawn / 2)) + " pairs share a group**, over " +
    distinctGroups + " distinct groups. Every item therefore carries its own cross-language control.");
  p("");
  p("A defect rooted in the ENGLISH traps both renderings, so only a contrast can show it -- which is");
  p("how two independently drawn, cleared draws came to serve one.");
} else {
  p("**INDEPENDENT DRAWS, which is NOT a cross-language control.** The per-stratum seed is");
  p("`seed XOR hash(cert|language)` and the language is in the hash, so the two languages shuffle");
  p("differently: **" + sharedGroups + " of " + Math.max(1, Math.round(totalDrawn / 2)) +
    " pairs share a group**, over " + distinctGroups + " distinct groups.");
  p("");
  p("That buys breadth -- roughly twice as many distinct items read -- and it is structurally blind to");
  p("a defect rooted in the English, because a source defect traps both renderings and only a contrast");
  p("shows it. Pass `--paired` to draw groups instead and get the control at half the breadth.");
}
p("");
p("**A translation that is BETTER than its English is a finding about the English.** An expanded");
p("initialism, a capitalised proper noun, a spelled-out term the English left raw: eleven AIMS-F");
p("concept names were repaired that way by translators and no instrument recorded the disagreement.");
p("");
if (short.length) {
  p("**" + short.length + " stratum(s) could not supply " + PER_CERT + " items** and are drawn short:");
  for (const s of short) p("- " + s.cert.code + " " + s.lang + ": " + s.drawn.length + " of " + s.population + " available");
  p("");
}
if (empty.length) {
  p("**Empty strata, which is not the same as short:** " +
    [...new Set(empty.map((s) => s.cert.code))].join(", ") + " hold no secure translated items at all,");
  p("so there was nothing to draw. " + [...new Set(certs.filter((c) => strata.some((s) => s.cert.id === c.id && s.population > 0)).map((c) => c.code))].length +
    " certifications are represented.");
  p("");
}
if (noGroup.length || noEnglish.length) {
  p("**Unpaired items, printed anyway rather than dropped:** " + noGroup.length +
    " with no `question_group_id`, " + noEnglish.length + " whose group has no English row.");
  p("");
}
p("## Population per stratum");
p("");
p("| certification | es-419 | pt-BR |");
p("|---|---|---|");
for (const c of certs) {
  const es = strata.find((s) => s.cert.id === c.id && s.lang === "es-419");
  const pt = strata.find((s) => s.cert.id === c.id && s.lang === "pt-BR");
  if (!es && !pt) continue;
  p("| " + c.code + " | " + (es ? es.population : 0) + " | " + (pt ? pt.population : 0) + " |");
}
p("");

for (const c of certs) {
  const mine = strata.filter((s) => s.cert.id === c.id && s.drawn.length);
  if (!mine.length) continue;
  p("---");
  p("");
  p("# " + c.code + " - " + esc(c.name));
  p("");
  for (const s of mine) {
    p("## " + c.code + " / " + s.lang + "  (" + s.drawn.length + " of " + s.population + ")");
    p("");
    for (const r of s.drawn) {
      const en = r.question_group_id ? enByGroup.get(r.question_group_id) : null;
      p("### task " + (taskCode.get(r.task_id) || "?") + "   item " + String(r.id).slice(0, 8) +
        "   difficulty " + (r.difficulty ?? "?") + "   " + (r.item_origin || "?"));
      p("");
      if (en) renderItem(en, "EN");
      else p("*(no English sibling: " + (r.question_group_id ? "group has no `language = en` row" : "no `question_group_id`") + ")*\n");
      renderItem(r, s.lang.toUpperCase());
      p("verdict: ______   notes: ______________________________________________");
      p("");
    }
  }
}

writeFileSync(join(ROOT, OUT), md.join("\n") + "\n", "utf8");
console.log("TRANSLATION SAMPLE");
console.log("  seed " + SEED + "   per cert " + PER_CERT + "   strata " + strata.length);
console.log("  population read: " + pop.length + " secure translated rows");
/* "English siblings paired" was the phrase that hid an independent draw behind a pairing claim: it
 * counts rows that FOUND an English sibling, never whether the two languages found the SAME group.
 * Renamed to what it measures, with the pairing figure printed beside it so the two cannot be
 * mistaken for each other again. */
console.log("  drawn: " + totalDrawn + "   rows with an English sibling: " +
  (totalDrawn - noGroup.length - noEnglish.length) + " of " + totalDrawn);
console.log("  cross-language pairing: " + sharedGroups + " of " + Math.max(1, Math.round(totalDrawn / 2)) +
  " pairs share a group, over " + distinctGroups + " distinct groups" +
  (PAIRED ? "   (--paired)" : "   (INDEPENDENT draws -- pass --paired for the control)"));
console.log("  renderings with a key marked: " + (renderings - unidentified) + " of " + renderings +
  "   multi-select: " + multiSelect);
if (unidentified) {
  console.log("  " + unidentified + " rendering(s) have NO key marked. A reviewer judging distractors");
  console.log("  against no key is judging them against nothing -- read those rows before circulating.");
  process.exitCode = 1;
}
if (short.length) console.log("  SHORT strata: " + short.map((s) => s.cert.code + "/" + s.lang + " " + s.drawn.length + "/" + s.population).join(", "));
if (empty.length) console.log("  EMPTY strata (nothing to draw): " + [...new Set(empty.map((s) => s.cert.code))].join(", "));
if (noGroup.length) console.log("  no question_group_id: " + noGroup.length);
if (noEnglish.length) console.log("  group has no English row: " + noEnglish.length);
console.log("  wrote " + OUT);
