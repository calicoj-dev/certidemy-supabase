#!/usr/bin/env node
/**
 * measure-clang-narrowing.mjs -- propose a narrower clang rule and MEASURE it before anyone adopts it.
 *
 * READ-ONLY. No `--apply`, nothing is adopted here. Unknown flags exit 2.
 *
 *   --sample=20    members printed for each rule, and for the set the narrowing DROPS
 *   --out=CLANG-NARROWING.md
 *
 * ============ WHY CLANG NEEDS NARROWING AT ALL ============
 *
 * Its first real measurement -- possible only after `keyIndex` learned to read a database row -- is
 * 1790 of 4155 live secure English items, 43 percent, against a module whose header says every rule
 * fires on a minority. The members read as subject vocabulary: "the key echoes `review`", "`product`",
 * "`developer`". A key about a review contains the word review.
 *
 * ============ THE PROPOSED RULE, AND WHAT IT ADDS ============
 *
 * Current: an echoed stem word counts if it is >= 5 characters, not a function word, present in the
 * key and absent from EVERY distractor.
 *
 * Proposed: the same, AND the word must not appear in the TASK STATEMENT or in any CONCEPT NAME linked
 * to the item. The reasoning is the director's: a word that is in the task's own statement is the
 * subject the item is required to be about, so its presence in the key is not a cue, it is the topic.
 *
 * ============ AND IT IS NOT ADOPTED BY THIS SCRIPT ============
 *
 * The rule is adopted only when a read shows the members are real cues. So this prints three sets --
 * what still fires, what the narrowing DROPS, and the rate per certification -- and changes nothing.
 * A narrowing judged by its count alone is a threshold fitted to a number.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn } from "./_pg.mjs";
import { clangCue } from "./lib/shape-cues.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let SAMPLE = 20, OUT = "CLANG-NARROWING.md";
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--sample=(\d+)$/.exec(a))) { SAMPLE = Number(m[1]); continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  console.error("unknown flag " + JSON.stringify(a) + ". Known: --sample=, --out=");
  console.error("READ-ONLY, and it adopts nothing. There is no --apply.");
  process.exitCode = 2; process.exit();
}

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&order=code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const tasks = await getAll(KEY, "tasks?select=id,code,statement&order=id");
const taskById = new Map(tasks.map((t) => [t.id, t]));

const rows = await getAll(KEY, "quiz_questions?select=id,certification_id,task_id,question_text," +
  "options,correct_answer&language=eq.en&status=eq.approved&retired_at=is.null&pool=eq.secure&order=id");

/* Concept names linked to each item, through question_concepts. An `in.()` read, so it cannot be
 * truncated by the row cap. */
const qcs = await getAll(KEY, "question_concepts?select=question_id,concept_id&order=question_id");
const conceptIds = [...new Set(qcs.map((r) => r.concept_id))];
const concepts = conceptIds.length
  ? await getAllIn(KEY, "concepts", "id,name", "id", conceptIds, "&order=id")
  : [];
const conceptName = new Map(concepts.map((c) => [c.id, String(c.name || "")]));
const conceptsByQ = new Map();
for (const r of qcs) {
  if (!conceptsByQ.has(r.question_id)) conceptsByQ.set(r.question_id, []);
  conceptsByQ.get(r.question_id).push(conceptName.get(r.concept_id) || "");
}

const wordsOf = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean);

/* The proposed narrowing, expressed as a FILTER over the words the current rule reported, so the two
 * rules cannot drift: whatever clangCue counts, this removes the topic words from. */
const topicWordsFor = (r) => {
  const t = taskById.get(r.task_id);
  const bag = new Set(wordsOf(t ? t.statement : ""));
  for (const n of conceptsByQ.get(r.id) || []) for (const w of wordsOf(n)) bag.add(w);
  if (t && t.code) bag.add(String(t.code));
  return bag;
};
/* clangCue's message names the echoed words in quotes; they are recovered from it rather than
 * recomputed, which is the same reason the regate reads the recorded artifact: one implementation. */
const echoedWords = (cue) => [...String(cue.cue).matchAll(/"([^"]+)"/g)].map((m) => m[1]);

const firesNow = [], firesNarrow = [], dropped = [];
for (const r of rows) {
  const ids = Array.isArray(r.correct_answer) ? r.correct_answer : [];
  if (ids.length !== 1) continue;
  const c = clangCue(r);
  if (!c) continue;
  const words = echoedWords(c);
  const topic = topicWordsFor(r);
  const surviving = words.filter((w) => !topic.has(w.toLowerCase()));
  const rec = { id: String(r.id).slice(0, 8), cert: codeOf.get(r.certification_id),
    task: (taskById.get(r.task_id) || {}).code || "?", words, surviving,
    topicHit: words.filter((w) => topic.has(w.toLowerCase())) };
  firesNow.push(rec);
  if (surviving.length) firesNarrow.push(rec); else dropped.push(rec);
}

const spread = (list, n) => {
  if (list.length <= n) return list;
  const step = list.length / n;
  return Array.from({ length: n }, (_, i) => list[Math.floor(i * step)]);
};
const perCert = (list) => {
  const m = new Map();
  for (const r of list) m.set(r.cert, (m.get(r.cert) || 0) + 1);
  return m;
};
const now = perCert(firesNow), narrow = perCert(firesNarrow);

const md = [];
const p = (s = "") => md.push(s);
p("# Clang, narrowed: the proposal and its measurement");
p("");
p("`scripts/measure-clang-narrowing.mjs`, read-only. **NOTHING IS ADOPTED HERE.** Ruling A says the");
p("narrowing is adopted only when a read shows the members are real cues, so this prints the members.");
p("");
p("## The rule");
p("");
p("Current: an echoed stem word counts if it is 5+ characters, not a function word, present in the key");
p("and absent from EVERY distractor.");
p("");
p("Proposed: the same, **and the word must not appear in the task statement or in any concept name");
p("linked to the item**. A word in the task's own statement is the subject the item is required to be");
p("about, so its presence in the key is the topic rather than a cue.");
p("");
p("## What it does to the count");
p("");
p("| | items |");
p("|---|---|");
p("| secure English items scored | " + rows.length + " |");
p("| clang fires today | " + firesNow.length + " (" + (100 * firesNow.length / rows.length).toFixed(1) + "%) |");
p("| clang fires under the narrowing | " + firesNarrow.length + " (" +
  (100 * firesNarrow.length / rows.length).toFixed(1) + "%) |");
p("| **dropped by the narrowing** | **" + dropped.length + "** |");
p("");
p("| certification | now | narrowed |");
p("|---|---|---|");
for (const code of [...new Set([...now.keys(), ...narrow.keys()])].sort()) {
  p("| " + code + " | " + (now.get(code) || 0) + " | " + (narrow.get(code) || 0) + " |");
}
p("");
/* ============ TWO FURTHER VARIANTS, MEASURED IN THE SAME RUN ============
 *
 * The topic-word narrowing is not enough -- see the verdict below -- so the two obvious next knobs are
 * measured here rather than proposed blind. Neither is adopted either. */
const atLeast = (n) => firesNarrow.filter((r) => r.surviving.length >= n);
p("## Two further variants");
p("");
p("| rule | items firing | share of the bank |");
p("|---|---|---|");
p("| clang today | " + firesNow.length + " | " + (100 * firesNow.length / rows.length).toFixed(1) + "% |");
p("| + topic words excluded | " + firesNarrow.length + " | " + (100 * firesNarrow.length / rows.length).toFixed(1) + "% |");
p("| + at least 2 echoed words | " + atLeast(2).length + " | " + (100 * atLeast(2).length / rows.length).toFixed(1) + "% |");
p("| + at least 3 echoed words | " + atLeast(3).length + " | " + (100 * atLeast(3).length / rows.length).toFixed(1) + "% |");
p("");
p("**THE VERDICT ON THE PROPOSED RULE: IT IS NOT ENOUGH, AND I AM NOT PROPOSING ITS ADOPTION.**");
p("Excluding task and concept words moves 43.1% to 38.9% -- 172 items of 1790 -- and the members that");
p("survive read exactly like the ones that motivated the narrowing: `review`, `items`, `client`,");
p("`feedback`, `routing`, `director`, `owner`, `developers`. Ordinary scenario vocabulary.");
p("");
p("**The diagnosis is that the rule's premise is wrong, not its threshold.** \"A content word present in");
p("the key and in no distractor\" describes every item whose distractors talk about different things --");
p("which is what good distractors do. Tightening the word list cannot fix a premise.");
p("");
p("**The principled fix is DOCUMENT FREQUENCY, not length or topic membership**, and this repository");
p("already records that exact lesson against the match-terms pipeline: *both guards measure a term's");
p("LENGTH when the risk is its DOCUMENT FREQUENCY*. A word echoed from stem to key is a cue when it is");
p("RARE in the corpus and noise when it is common. That is a real measurement to do -- per-certification");
p("document frequency over stems and options -- and it is the proposal I would bring back, not this one.");
p("");
p("Until then clang stays out of the trigger set and stays in check 3, where the rate does not matter.");
p("");
p("## " + SAMPLE + " members the narrowing DROPS");
p("");
p("These are the ones to read first: if they are topic words, the narrowing is right.");
p("");
for (const r of spread(dropped, SAMPLE)) {
  p("- `" + r.id + "` " + r.cert + " " + r.task + " -- echoed " +
    r.words.map((w) => '"' + w + '"').join(", ") + ", all in the task statement or a concept name");
}
p("");
p("## " + SAMPLE + " members that STILL fire");
p("");
p("If these read as subject vocabulary too, the narrowing is not enough and clang needs a different");
p("rule rather than a tighter one.");
p("");
for (const r of spread(firesNarrow, SAMPLE)) {
  p("- `" + r.id + "` " + r.cert + " " + r.task + " -- echoed " +
    r.surviving.map((w) => '"' + w + '"').join(", ") +
    (r.topicHit.length ? " (topic words removed: " + r.topicHit.map((w) => '"' + w + '"').join(", ") + ")" : ""));
}
p("");
writeFileSync(join(ROOT, OUT), md.join("\n") + "\n", "utf8");

console.log("CLANG NARROWING, MEASURED (nothing adopted)");
console.log("  items scored            " + rows.length);
console.log("  fires today             " + firesNow.length + "  (" + (100 * firesNow.length / rows.length).toFixed(1) + "%)");
console.log("  fires narrowed         " + firesNarrow.length + "  (" + (100 * firesNarrow.length / rows.length).toFixed(1) + "%)");
console.log("  dropped                " + dropped.length);
console.log("  wrote " + OUT);
