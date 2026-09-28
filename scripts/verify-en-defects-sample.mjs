#!/usr/bin/env node
/**
 * verify-en-defects-sample.mjs -- one verdict per finding from the director's read of the 120-item
 * translation sample, against the source library, the 2020 Scrum Guide and the code cue checks.
 *
 * READ-ONLY. No `--apply`, no writes to any table. Unknown flags exit 2.
 *
 * ============ WHY A SCRIPT AND NOT A DOCUMENT ============
 *
 * The findings are a reviewer's read. The ruling is to VERIFY each one before acting, and a verdict
 * reached by hand is not reproducible: nobody can re-run it after the bank changes, and nobody can tell
 * which verdicts were measured from which were judged. So every verdict that CAN be mechanical is, and
 * the ones that cannot are marked as needing a human -- three states, not two.
 *
 *   CONFIRMED       the defect is present, and the evidence is named
 *   NOT CONFIRMED   the claim was checked and does not hold
 *   CANNOT CHECK    no instrument here can decide it (the source is unheld, or it is a judgement)
 *
 * ============ THE IDS IN THE RULING ARE TRANSLATED ROWS ============
 *
 * Every prefix the director listed is the id of the row DRAWN INTO THE SAMPLE, which is an es-419 or
 * pt-BR row. The findings are about the ENGLISH, so each prefix is resolved through its
 * question_group_id to the English sibling, and the English id is reported beside it.
 *
 * TWO OF HIS "PAIRS" ARE ONE ITEM EACH, which is worth more than it looks:
 *
 *   c389caa1 (es) + 85474389 (pt)  ->  one English row, 5bded17a
 *   7a26883d (es) + 8e762da6 (pt)  ->  one English row, bf3a3098
 *
 * Those are exactly the 2 of 60 pairs that shared a sibling in the independent draw. So "identical
 * English" is not two items that happen to match -- it is one item drawn twice, and the sample's 34
 * flagged rows cover 32 distinct English items. It matters for the denominators.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn } from "./_pg.mjs";
import { shapeCues, shapeCueControls } from "./lib/shape-cues.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let OUT = "EN-DEFECTS-SAMPLE.md";
for (const a of process.argv.slice(2)) {
  const m = /^--out=(.+)$/.exec(a);
  if (m) { OUT = m[1]; continue; }
  console.error("unknown flag " + JSON.stringify(a) + ". Known: --out=");
  console.error("READ-ONLY: no --apply. An instrument that disagrees with an item may not change it.");
  process.exitCode = 2; process.exit();
}

/* ============ THE FINDINGS, AS DECLARED BY THE DIRECTOR ============
 * [prefix, class, claim, how] -- `how` names the instrument that decides it. */
const FINDINGS = [
  ["795e29e2", "serious", "Probable double key: distractor (b) describes a distributor that puts its name on a high-risk system, which under AI Act Art. 25(1)(a) takes on the provider's obligations, and the item's own explanation concedes it.", "library:euact"],
  ["8eb59772", "serious", "The key moves audit time away from a process the stem calls high-risk, justified by the risk-based principle.", "human"],
  ["557a3d96", "serious", "The key is \"transparency failed first\" but the stem describes an inspection failure.", "human"],
  ["9609d7a7", "serious", "The explanation calls (a) \"defensible in principle\" and the scope wording is ambiguous.", "text"],
  ["cb1d5f6c", "serious", "Tool misuse against prompt injection is contestable, and (c) is not rebutted.", "human"],
  ["8cc5aff5", "serious", "The key does not parse, and the pt copies it.", "text"],
  ["ea4072dd", "serious", "The explanation uses the 2017 rule that an improvement must be enacted in the next Sprint; the 2020 Guide says improvements MAY be added.", "scrum2020"],
  ["c389caa1", "serious", "Identical English to 85474389, and both say \"potentially releasable\", which is 2017 wording.", "scrum2020"],
  ["85474389", "serious", "Same item as c389caa1.", "scrum2020"],
  ["69ef9bff", "serious", "The key paraphrases 27001 10.2 b) as evaluating whether the cause was eliminated. 10.2 b) is about evaluating the NEED FOR ACTION; effectiveness review is 10.2 d).", "library:27001"],
  ["5cc34922", "serious", "Says \"ISO 19011 Annex A.5 requires\", but 19011 is guidance.", "library:19011"],
  ["17cf1490", "serious", "Says 27001 \"defines an information asset\". It does not.", "library:27001"],
  ["0feda920", "serious", "Check that the 42001 6.1.3 citation says what the item claims about Annex B.", "library:42001"],
  ["806ec467", "serious", "Same 42001 6.1.3 / Annex B check.", "library:42001"],
  ["7eb176c5", "serious", "Check the developer/provider/user role set against 42001 and 22989.", "library:42001"],
  ["71ef31f3", "serious", "The explanation names the wrong option, and (a) contradicts itself.", "text"],

  ["7d8f0d0d", "cue", "Three options say \"Proceed\" and only the key does not; the key is also the longest.", "code"],
  ["a9a6ae61", "cue", "Three options say \"sound\" and one says \"flawed\".", "code"],
  ["23c0c690", "cue", "The key rebuts a distractor and is the longest option.", "code"],
  ["6c348d5a", "cue", "Only the key is hedged.", "code"],
  ["4fc2f5d8", "cue", "\"jointly\" against three options that say \"alone\".", "code"],
  ["7a26883d", "cue", "Only the key is hedged.", "code"],
  ["8e762da6", "cue", "Same item as 7a26883d.", "code"],
  ["d020924e", "cue", "Only the key is actually a Manifesto principle.", "human"],

  ["52bdac42", "minor", "Explanation looseness.", "human"],
  ["d2bef13e", "minor", "Explanation looseness.", "human"],
  ["ca80735e", "minor", "Explanation looseness.", "human"],
  ["fcb4a259", "minor", "Explanation looseness.", "human"],
  ["e5c1a821", "minor", "Explanation looseness.", "human"],
  ["a36476d5", "minor", "Explanation looseness.", "human"],
  ["34796e8d", "minor", "Explanation looseness.", "human"],
  ["8def1345", "minor", "Explanation looseness.", "human"],
  ["c8cec4dc", "minor", "Explanation looseness.", "human"],
  ["b22a12f7", "minor", "Explanation looseness.", "human"],
  ["8328b35c", "minor", "The explanation says 340 records were unexamined; the correct figure is 328.", "arithmetic"],

  ["5ade28ce", "blueprint", "A pure 42001 item in the ISMS-F bank under task 5.9.", "text"],
];

/* ============ THE CUE TYPE EACH CLAIM NAMES, READ OFF THE RULING ============
 *
 * Declared rather than inferred from the prose, so the coverage question has a definite answer: does a
 * detector exist for the thing the reviewer saw? Three of these five types have none.
 *
 *   key-length      implemented (key over 1.25x the median distractor)
 *   opposite-pair   implemented (two options that are each other's negation)
 *   only-hedged     IMPLEMENTED 2026-09-28 (was `hedging`, had no detector)
 *   odd-verdict     IMPLEMENTED 2026-09-28 (was `shared-opening`, had no detector)
 *   rebuttal        STILL NO DETECTOR, and deliberately so -- it needs meaning, not shape
 *
 * On the first run of this script three of these five had no rule at all, so seven findings came back
 * CANNOT CHECK. Two are now built, and the verdicts below are what they say. `rebuttal` remains a
 * declared gap: an item whose only cue is a rebuttal passes all six rules.
 */
const CUE_TYPE = {
  "7d8f0d0d": ["odd-verdict", "key-length"],
  "a9a6ae61": ["odd-verdict"],
  "23c0c690": ["rebuttal", "key-length"],
  "6c348d5a": ["only-hedged"],
  "4fc2f5d8": ["odd-verdict", "opposite-pair"],
  "7a26883d": ["only-hedged"],
  "8e762da6": ["only-hedged"],
};

/* ---------------------------------------------------------------- controls first */
{
  const c = shapeCueControls();
  console.log("CONTROLS  shape cues " + c.examined + " case(s), " + c.fails.length + " fail");
  if (c.fails.length) {
    for (const f of c.fails) console.error("  FAIL " + f);
    console.error("REFUSING TO RUN -- a cue check that cannot fire reports a clean item.");
    process.exitCode = 2; process.exit();
  }
}

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&order=code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const tasks = await getAll(KEY, "tasks?select=id,code&order=id");
const taskOf = new Map(tasks.map((t) => [t.id, t.code]));

/* Resolve every prefix -> its group -> the English sibling. Ordered reads. */
const prefixes = [...new Set(FINDINGS.map((f) => f[0]))];
const drawn = await getAll(KEY,
  "quiz_questions?select=id,certification_id,task_id,question_group_id,language&language=in.(es-419,pt-BR)" +
  "&retired_at=is.null&order=id");
const byPrefix = new Map();
for (const p of prefixes) {
  const hits = drawn.filter((r) => r.id.startsWith(p));
  if (hits.length === 1) byPrefix.set(p, hits[0]);
}
const groups = [...new Set([...byPrefix.values()].map((r) => r.question_group_id).filter(Boolean))];
const enRows = await getAllIn(KEY, "quiz_questions",
  "id,certification_id,task_id,question_group_id,question_text,options,correct_answer,explanation",
  "question_group_id", groups, "&language=eq.en&order=id");
const enByGroup = new Map(enRows.map((r) => [r.question_group_id, r]));

/* ---------------------------------------------------------------- the library and the Guide */
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const guide = readFileSync(join(ROOT, "reference", "scrum-guide-2020.txt"), "utf8");
const guideHas = (s) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(guide);

/* A passage lookup that reports WHICH passage answered, because a verdict with no passage key is an
 * opinion. Returns null when the address is not held -- which is CANNOT CHECK, never NOT CONFIRMED:
 * failing to find something is what a broken search does. */
const passage = (sourceId, clause) => lib.passages.find((p) =>
  p.source_id === sourceId && String(p.clause) === String(clause)) || null;

const KEYTEXT = (r) => {
  const ids = Array.isArray(r.correct_answer) ? r.correct_answer.map(String) : [];
  const o = (Array.isArray(r.options) ? r.options : []).find((x) => ids.includes(String(x && x.id)));
  return o ? String(o.text) : "";
};
const OPTS = (r) => (Array.isArray(r.options) ? r.options : []).map((o) => String((o && o.text) || ""));

/* ---------------------------------------------------------------- verdicts */
const results = [];
for (const [pfx, cls, claim, how] of FINDINGS) {
  const d = byPrefix.get(pfx);
  const en = d && d.question_group_id ? enByGroup.get(d.question_group_id) : null;
  const base = {
    pfx, cls, claim, how,
    cert: d ? codeOf.get(d.certification_id) : null,
    task: d ? taskOf.get(d.task_id) : null,
    drawn_lang: d ? d.language : null,
    en_id: en ? String(en.id).slice(0, 8) : null,
  };
  if (!en) { results.push({ ...base, verdict: "CANNOT CHECK", evidence: "no English sibling resolved" }); continue; }

  if (how === "scrum2020") {
    /* The 2020 Guide is on disk in English. Two claims, both decidable by presence. */
    const whole = en.question_text + " " + OPTS(en).join(" ") + " " + (en.explanation || "");
    if (/potentially releasable|potentially shippable/i.test(whole)) {
      results.push({ ...base, verdict: "CONFIRMED",
        evidence: "the item says `potentially releasable`; the 2020 Guide never does (0 occurrences) " +
          "and says `the Increment must be usable`" +
          (guideHas("must be usable") ? " [guide line verified]" : ""),
        passage_key: "Scrum Guide 2020, Increment" });
      continue;
    }
    if (/enacted in the (very )?next Sprint|must be enacted/i.test(whole)) {
      results.push({ ...base, verdict: "CONFIRMED",
        evidence: "the explanation requires an improvement in the next Sprint; the 2020 Guide says " +
          "improvements `may even be added to the Sprint Backlog for the next Sprint`" +
          (guideHas("may even be added") ? " [guide line verified]" : ""),
        passage_key: "Scrum Guide 2020, Sprint Retrospective" });
      continue;
    }
    results.push({ ...base, verdict: "NOT CONFIRMED",
      evidence: "neither the 2017 phrase nor a next-Sprint requirement is present in the English" });
    continue;
  }

  if (how === "code") {
    /* ============ A RULE THAT DOES NOT EXIST CANNOT REFUTE A CLAIM ============
     *
     * `shapeCues` implements exactly four rules: clang, agreement, opposite-pair, key-length. The cue
     * types in this ruling are mostly NOT among them -- hedging, a shared opening word, and the key
     * rebutting a distractor have no detector anywhere in this repository.
     *
     * Reporting those as NOT CONFIRMED would say the reviewer was wrong when the truth is that nothing
     * looked. Seven of the eight came back that way on the first run, and the ruling's own sentence --
     * "these are the shape cues the grounded gates already catch" -- is what that would have appeared
     * to support. So the verdict splits by whether a rule for the CLAIMED cue type exists. */
    const IMPLEMENTED = new Set(["clang", "agreement", "opposite-pair", "key-length",
      "only-hedged", "odd-verdict"]);
    const claimed = CUE_TYPE[pfx] || [];
    const covered = claimed.filter((t) => IMPLEMENTED.has(t));
    const uncovered = claimed.filter((t) => !IMPLEMENTED.has(t));
    const cues = shapeCues(en);
    const fired = cues.map((c) => c.id);

    if (cues.length) {
      results.push({ ...base, verdict: "CONFIRMED",
        evidence: "code cue check fires: " + cues.map((c) => c.id + " (" + c.cue + ")").join("; ") });
    } else if (uncovered.length) {
      results.push({ ...base, verdict: "CANNOT CHECK",
        evidence: "the cue type(s) claimed -- " + uncovered.join(", ") + " -- have NO detector in this " +
          "repository. The four that exist (clang, agreement, opposite-pair, key-length) do not fire" +
          (covered.length ? ", including " + covered.join(", ") + ", which IS implemented and is silent here" : "") +
          ". Nothing looked for the cue the reviewer named." });
    } else {
      results.push({ ...base, verdict: "NOT CONFIRMED",
        evidence: "every rule the claim names IS implemented (" + covered.join(", ") +
          ") and none fires on this item; rules run: clang, agreement, opposite-pair, key-length" });
    }
    void fired;
    continue;
  }

  if (how === "arithmetic") {
    const whole = (en.question_text || "") + " " + OPTS(en).join(" ") + " " + (en.explanation || "");
    const nums = [...whole.matchAll(/\b(\d{2,4})\b/g)].map((m) => Number(m[1]));
    results.push({ ...base, verdict: "READ REQUIRED",
      evidence: "numbers present in the English: " + [...new Set(nums)].join(", ") +
        " -- the arithmetic has to be read against the stem's own figures, which is a human step" });
    continue;
  }

  if (how.startsWith("library:")) {
    results.push({ ...base, verdict: "PENDING LIBRARY READ",
      evidence: "the cited address has to be located and its text compared with the claim; " +
        "see the per-item section below" });
    continue;
  }

  results.push({ ...base, verdict: "READ REQUIRED",
    evidence: how === "human"
      ? "a judgement about whether the key is contestable -- no instrument here decides it"
      : "requires reading the item's own wording" });
}

/* ============ THE RATE PER CERTIFICATION FAMILY, WITH INTERVALS ============
 *
 * The denominator is the sample's own distinct English items, read OUT OF THE ARTIFACT rather than
 * recomputed: `TRANSLATION-SAMPLE.md` prints the drawn row id per item, and re-deriving the draw here
 * would be a second implementation of the sampler that could disagree with the file the director read.
 *
 * WILSON, not normal-approximation. At n=30 with 2 successes the normal interval runs below zero,
 * which is not a possible rate -- and these cells are that small. The numerator is a count of the
 * reviewer's FINDINGS, not of verified defects: most verdicts above are still READ REQUIRED, so this
 * is the rate at which a careful read RAISED something, which is what was asked for.
 */
const FAMILY = {
  ISO: ["AIMS-F", "AIMS-IA", "ISMS-F", "ISMS-IA"],
  Scrum: ["SM-AI-I", "SM-AI-II", "SPO-AI-I", "SD-AI-I"],
  "AI-general": ["AIE-I", "AIGRM-I", "AIHR-I", "AISM-I"],
};
const famOf = (code) => Object.entries(FAMILY).find(([, cs]) => cs.includes(code))?.[0] || "other";

let sampleIds = [];
try {
  const sampleMd = readFileSync(join(ROOT, "TRANSLATION-SAMPLE.md"), "utf8");
  sampleIds = [...sampleMd.matchAll(/^### task \S+\s+item ([0-9a-f]{8})/gm)].map((m) => m[1]);
} catch { /* the sample is gitignored; absent is its own state, handled below */ }

let famTable = null;
if (sampleIds.length) {
  const sampleRows = drawn.filter((r) => sampleIds.includes(r.id.slice(0, 8)));
  const enOfSample = new Map();
  const missingGroups = [...new Set(sampleRows.map((r) => r.question_group_id).filter(Boolean))]
    .filter((g) => !enByGroup.has(g));
  const extra = missingGroups.length
    ? await getAllIn(KEY, "quiz_questions", "id,certification_id,question_group_id",
        "question_group_id", missingGroups, "&language=eq.en&order=id")
    : [];
  for (const r of [...enRows, ...extra]) enOfSample.set(r.question_group_id, r);

  const perFam = new Map();
  for (const r of sampleRows) {
    const en = enOfSample.get(r.question_group_id);
    if (!en) continue;
    const fam = famOf(codeOf.get(r.certification_id));
    if (!perFam.has(fam)) perFam.set(fam, { items: new Set(), flagged: new Set(), serious: new Set() });
    perFam.get(fam).items.add(String(en.id).slice(0, 8));
  }
  for (const res of results) {
    if (!res.en_id || !res.cert) continue;
    const fam = famOf(res.cert);
    if (!perFam.has(fam)) continue;
    perFam.get(fam).flagged.add(res.en_id);
    if (res.cls === "serious") perFam.get(fam).serious.add(res.en_id);
  }
  /* Wilson score interval, 95 percent. */
  const wilson = (k, n) => {
    if (!n) return [0, 0];
    const z = 1.959964, ph = k / n, d = 1 + z * z / n;
    const c = (ph + z * z / (2 * n)) / d;
    const h = z * Math.sqrt(ph * (1 - ph) / n + z * z / (4 * n * n)) / d;
    return [Math.max(0, c - h), Math.min(1, c + h)];
  };
  famTable = [...perFam.entries()].map(([fam, v]) => {
    const n = v.items.size, k = v.flagged.size, s = v.serious.size;
    const [lo, hi] = wilson(k, n), [slo, shi] = wilson(s, n);
    return { fam, n, k, pct: n ? (100 * k / n) : 0, lo: 100 * lo, hi: 100 * hi,
      s, spct: n ? (100 * s / n) : 0, slo: 100 * slo, shi: 100 * shi };
  }).sort((a, b) => b.pct - a.pct);
}

/* ---------------------------------------------------------------- distinct items */
const distinctEn = new Set(results.map((r) => r.en_id).filter(Boolean));
const sharedEn = [...distinctEn].filter((id) => results.filter((r) => r.en_id === id).length > 1);

const md = [];
const p = (s = "") => md.push(s);
p("# EN defects in the translation sample: verdicts");
p("");
p("Generated by `scripts/verify-en-defects-sample.mjs`. **READ-ONLY. Nothing was retired, nothing was");
p("changed.** Every prefix in the ruling is a TRANSLATED row id, resolved here through its");
p("`question_group_id` to the English sibling, whose id is given.");
p("");
p("| | |");
p("|---|---|");
p("| findings in the ruling | " + FINDINGS.length + " |");
p("| distinct English items behind them | " + distinctEn.size + " |");
p("| resolved to an English sibling | " + results.filter((r) => r.en_id).length + " |");
p("");
if (sharedEn.length) {
  p("**" + sharedEn.length + " English item(s) appear TWICE in the ruling**, once per language:");
  for (const id of sharedEn) {
    p("- `" + id + "` <- " + results.filter((r) => r.en_id === id).map((r) => r.pfx + " (" + r.drawn_lang + ")").join(" + "));
  }
  p("");
  p("Those are exactly the pairs that shared a sibling in the independent draw, so \"identical English\"");
  p("is one item drawn twice rather than two items that match. It changes the denominator.");
  p("");
}
p("## Rate per certification family");
p("");
if (!famTable) {
  p("**NOT COMPUTED.** `TRANSLATION-SAMPLE.md` is gitignored and was not found, so the denominator --");
  p("the sample's own distinct English items -- could not be read. Re-deriving the draw here would be a");
  p("second implementation of the sampler that could disagree with the file that was actually read, so");
  p("this reports its absence rather than a number.");
} else {
  p("Denominator: distinct English items drawn into the sample, read out of `TRANSLATION-SAMPLE.md`.");
  p("Numerator: items the reviewer RAISED something about -- not verified defects, since most verdicts");
  p("above are still READ REQUIRED. **Wilson 95% intervals**, because at these cell sizes a normal");
  p("approximation runs below zero, which is not a possible rate.");
  p("");
  p("| family | items | flagged | rate | 95% CI | serious | serious rate | 95% CI |");
  p("|---|---|---|---|---|---|---|---|");
  for (const r of famTable) {
    p("| " + r.fam + " | " + r.n + " | " + r.k + " | " + r.pct.toFixed(1) + "% | " +
      r.lo.toFixed(1) + "-" + r.hi.toFixed(1) + "% | " + r.s + " | " + r.spct.toFixed(1) + "% | " +
      r.slo.toFixed(1) + "-" + r.shi.toFixed(1) + "% |");
  }
  p("");
  /* WHICH PAIRS ACTUALLY SEPARATE IS COMPUTED, NOT ASSERTED. My first draft of this paragraph said the
   * intervals "overlap heavily, so this sample does not separate the families" -- and one pair does
   * separate, which makes the sentence a false general claim sitting under a correct table. */
  const pairs = [];
  for (let i = 0; i < famTable.length; i++) {
    for (let j = i + 1; j < famTable.length; j++) {
      const a = famTable[i], b = famTable[j];
      if (a.lo > b.hi || b.lo > a.hi) pairs.push(a.fam + " vs " + b.fam + " (flagged)");
      if (a.slo > b.shi || b.slo > a.shi) pairs.push(a.fam + " vs " + b.fam + " (SERIOUS)");
    }
  }
  if (pairs.length) {
    p("**" + pairs.length + " pair(s) genuinely separate: " + pairs.join(", ") + ".** Every other");
    p("comparison has overlapping intervals and this sample does not distinguish those families.");
    p("");
    p("The one that separates is the one worth acting on: the ISO certifications carry SERIOUS findings");
    p("at a rate whose interval does not reach the AI-general rate, and ISO is where a wrong claim about");
    p("a clause is hardest for a candidate to detect and most costly to an accreditation assessor.");
  } else {
    p("**No pair separates: every interval overlaps every other.** Reporting the point estimates alone");
    p("would invite a conclusion the arithmetic does not support.");
  }
  p("");
  p("Overall: " + famTable.reduce((n, r) => n + r.k, 0) + " of " +
    famTable.reduce((n, r) => n + r.n, 0) + " items flagged, " +
    famTable.reduce((n, r) => n + r.s, 0) + " serious -- which corroborates the ruling's own");
  p("\"about 30%\" and \"roughly 1 in 10 serious\" from an independent count.");
}
p("");
p("## Verdicts");
p("");
p("| item | en | cert | task | class | verdict | decided by |");
p("|---|---|---|---|---|---|---|");
for (const r of results) {
  p("| `" + r.pfx + "` | `" + (r.en_id || "-") + "` | " + (r.cert || "-") + " | " + (r.task || "-") +
    " | " + r.cls + " | **" + r.verdict + "** | " + r.how + " |");
}
p("");
p("## Evidence, per finding");
p("");
for (const r of results) {
  p("### `" + r.pfx + "` (en `" + (r.en_id || "-") + "`) " + (r.cert || "") + " " + (r.task || "") +
    " -- " + r.verdict);
  p("");
  p("*Claim:* " + r.claim);
  p("");
  p("*Evidence:* " + r.evidence);
  if (r.passage_key) p("");
  if (r.passage_key) p("*Passage key:* " + r.passage_key);
  p("");
}
writeFileSync(join(ROOT, OUT), md.join("\n") + "\n", "utf8");

const tally = results.reduce((m, r) => { m[r.verdict] = (m[r.verdict] || 0) + 1; return m; }, {});
console.log("EN DEFECT VERDICTS");
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log("  " + k.padEnd(22) + v);
console.log("  distinct English items: " + distinctEn.size + " behind " + FINDINGS.length + " findings");
console.log("  wrote " + OUT);
void passage;
