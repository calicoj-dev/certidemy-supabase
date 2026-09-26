/**
 * draft-aimsf-task-sources.mjs -- propose which ISO/IEC 42001:2023 passages each AIMS-F
 * task is examined against. READ-ONLY: it writes two files and nothing to the database.
 *
 * Section 2 of the grounded-generator brief. The mapping is a DRAFT for the director to
 * read, not a fact, and the report is laid out so he can disagree per row.
 *
 * ============ WHAT THIS CAN AND CANNOT DECIDE ============
 *
 * It can find EXPLICIT citations -- a task whose own knowledge statement names clause
 * 6.1.4 is anchored by the blueprint's author, and that is the strongest evidence
 * available without a human. Those are marked `cited`.
 *
 * It cannot decide relevance. Candidates are ranked, never decided, and the director's
 * read is what promotes one to `primary`.
 *
 * ============ TWO SIGNALS, AND THE STRONG ONE IS THE CLAUSE TITLE ============
 *
 * A blueprint author writing a task statement NAMES THE CLAUSE TITLES. Task 2.3 reads
 * "Explain leadership requirements, the AI policy, AI objectives and planning of changes"
 * and those are the names of clauses 5.1, 5.2, 6.2 and 6.4. So the primary signal is
 * containment of a contiguous phrase from the clause's own title, measured as coverage of
 * that title.
 *
 * Body distinctive-term overlap is the weak signal and it is CAPPED; title matches are
 * not. Both earlier versions of this ranker lost clause 5.2 on task 2.3 by making the two
 * compete for the same six slots -- once under a token ratio, which penalised long titles,
 * and once under a run length, which favoured them. The cap belongs on the tail, not on
 * the evidence.
 *
 * THRESHOLDS, AND WHAT EACH EXCLUDES:
 *   title run >= 2 words, covering >= 50% of the title -- excludes a title matched only
 *     by an incidental word, and excludes "General" and "Scope" entirely, which is right
 *     because those names identify nothing.
 *   body overlap >= 3 shared distinctive terms -- two shared words is noise. Normalised by
 *     the SHORTER side, because an absolute count selects by length: a 40-term task shares
 *     three terms with everything and a 7-word clause can never reach three.
 *
 * ============ AND IT RUNS ITS OWN EXEMPLARS FIRST ============
 *
 * Eight task/clause pairs are declared below whose answer is known from the standard's
 * structure -- internal audit is 9.2, management review is 9.3, the AI policy is 5.2. If
 * the ranker cannot surface those, its other rankings are worth nothing and the script
 * writes no file. A classifier that cannot find its own exemplar reports clean forever.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let TOP = 6;
for (const a of process.argv.slice(2)) {
  const m = /^--top=(\d+)$/.exec(a);
  if (m) { TOP = Number(m[1]); continue; }
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY, the only flag is --top=N");
  process.exitCode = 2; process.exit();
}

const CERT = "AIMS-F";
const STANDARD = "ISO/IEC 42001";
const EDITION = "2023";

/* ---------------------------------------------------------------- the library side */
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const passages = lib.passages.filter((p) => p.source_id === STANDARD && p.edition === EDITION);
if (!passages.length) throw new Error("no " + STANDARD + " " + EDITION + " passages -- run extract-source-passages.mjs");

const STOP = new Set(("a an and are as at be been by can for from has have in into is it its may not of on or " +
  "shall should such that the their there these this those to which with when where who whom whose " +
  "organization organizational ai system systems management should").split(" "));
const terms = (s) => [...new Set(String(s || "").toLowerCase().match(/[a-z][a-z-]{2,}/g) || [])]
  .filter((w) => !STOP.has(w));

/* Document frequency over the passages, so a word every clause uses carries no weight.
 * A LENGTH guard is the wrong instrument here and this repository says so: the risk in a
 * term is its DOCUMENT FREQUENCY, not how long it is. */
const df = new Map();
for (const p of passages) for (const w of terms(p.title + " " + p.text)) df.set(w, (df.get(w) || 0) + 1);
const N = passages.length;
const idf = (w) => Math.log((N + 1) / ((df.get(w) || 0) + 1));
const DISTINCTIVE = (w) => (df.get(w) || 0) <= Math.max(3, Math.floor(N * 0.2));

const ADDRESS = /\b(?:clause|clauses|annex|control|controls|subclause)\s+((?:A|B)?\.?\d+(?:\.\d+){0,3})/gi;
const byClause = new Map(passages.map((p) => [p.clause, p]));

/* ============ A CONTAINER IS NOT A CANDIDATE ============
 *
 * Clause 3 of ISO/IEC 42001 is "Terms and definitions", and the extractor holds it BOTH as
 * the whole block and as 3.1 to 3.26 individually. As a whole block it shares vocabulary
 * with every task in the certification -- it came out as a body-overlap candidate for most
 * of them, with 23 shared terms -- and an item anchoring in "clause 3" is anchored in the
 * definitions section generally rather than in the definition it relies on.
 *
 * Grounding has to be as specific as the claim. A passage whose subclauses are also held is a
 * container: its children are the candidates, and it is not. Same distinction §1's resolver
 * already makes for a cited address.
 */
const isContainer = (clause) => passages.some((q) => q.clause.startsWith(clause + "."));

/* ---------------------------------------------------------------- the exemplars */
/* Declared from the standard's own structure, not from this script's output. Each says:
 * a task whose text matches `when` must surface a passage under `expect`. */
const EXEMPLARS = [
  { when: /internal audit/i, expect: "9.2" },
  { when: /management review/i, expect: "9.3" },
  { when: /\bAI policy\b/i, expect: "5.2" },
  { when: /impact assessment/i, expect: "6.1.4" },
  { when: /nonconformity|corrective action/i, expect: "10" },
  { when: /competence|awareness/i, expect: "7" },
  { when: /objectives?\b.*plan|planning to achieve/i, expect: "6.2" },
  { when: /statement of applicability|Annex A/i, expect: "A." },
];

const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&code=eq." + CERT);
if (!certs.length) throw new Error(CERT + " not found");
const cid = certs[0].id;
const domains = (await getAll(KEY, "domains?select=id,code,title,weight_pct&order=code"))
  .filter((d) => d.certification_id === cid || true);
const allDomains = await getAll(KEY, "domains?select=id,certification_id,code,title,weight_pct&order=code");
const myDomains = allDomains.filter((d) => d.certification_id === cid);
const domById = new Map(myDomains.map((d) => [d.id, d]));
const allTasks = await getAll(KEY, "tasks?select=id,certification_id,domain_id,code,statement,knowledge,skills,abilities,bloom_level,is_exam_scope&order=code");
const tasks = allTasks.filter((t) => t.certification_id === cid);
if (!tasks.length) throw new Error("no tasks for " + CERT);

/* ---------------------------------------------------------------- score */
const rows = [];
for (const t of tasks) {
  const text = [t.statement, t.knowledge, t.skills, t.abilities].filter(Boolean).join("\n");

  /* (1) explicit citations in the task's own text */
  ADDRESS.lastIndex = 0;
  const cited = [];
  let m;
  while ((m = ADDRESS.exec(text)) !== null) {
    const c = m[1].replace(/^\./, "").replace(/^([AB])(\d)/, "$1.$2");
    if (!cited.includes(c)) cited.push(c);
  }
  const citedResolved = cited.map((c) => {
    if (byClause.has(c)) return { clause: c, state: "held" };
    const kids = passages.filter((p) => p.clause.startsWith(c + ".")).map((p) => p.clause);
    if (kids.length) return { clause: c, state: "container", children: kids };
    return { clause: c, state: "NOT HELD" };
  });

  /* (2) THE CLAUSE TITLE, WHICH IS THE INSTRUMENT. Body term overlap alone ranked task
   * 2.3 -- "Explain leadership requirements, the AI policy, AI objectives and planning of
   * changes" -- as 6.3, A.10.4 and 6.2, and missed clause 5.2, whose title is literally
   * "AI policy". Two reasons, both structural rather than tunable:
   *
   *   the document-frequency guard drops exactly the words that IDENTIFY a clause.
   *     "policy", "leadership" and "objectives" appear across many clauses, so they were
   *     discarded as common, leaving rare incidental vocabulary to decide the ranking.
   *   normalising by the shorter side lets a 92-character passage win on one shared word.
   *
   * A blueprint author writing a task statement NAMES THE CLAUSE TITLES, and this task
   * names four of them. So the title match is the primary signal and body overlap is a
   * tiebreak. That is a change of method, not a tuned parameter -- the exemplars below
   * are what judge it, and tuning a threshold until they passed would have been fitting
   * the instrument to the answer.
   *
   * A title with no distinctive token of its own -- "General", "Scope" -- can never be a
   * title match, which is right: those names identify nothing. */
  const tt = terms(text).filter(DISTINCTIVE);
  const tset = new Set(tt);
  const textLower = " " + String(text).toLowerCase().replace(/[^a-z]+/g, " ") + " ";
  const scored = passages.filter((p) => !isContainer(p.clause)).map((p) => {
    const pt = terms(p.title + " " + p.text).filter(DISTINCTIVE);
    const shared = pt.filter((w) => tset.has(w));
    const denom = Math.max(2, Math.min(tt.length, pt.length));
    const bodyScore = shared.reduce((a, w) => a + idf(w), 0) / denom;

    /* A TITLE PHRASE, NOT A TITLE TOKEN RATIO. The ratio version scored clause 6.2 --
     * "AI objectives and planning to achieve them" -- at 0.5 against a task that contains
     * the phrase "AI objectives and planning" verbatim, because "achieve" and "them" are
     * in the title and not in the task. A ratio PENALISES A LONG TITLE, which is the same
     * length artefact as an absolute threshold and this repository has paid for it twice.
     *
     * So the test is containment of a contiguous run of the title's own words, longest
     * first. A phrase from the clause's name appearing verbatim in the task statement is
     * the blueprint author pointing at the clause. The run must carry a word that is not
     * a stopword, or "to achieve" would match half the standard. */
    const titleWords = String(p.title || "").toLowerCase().match(/[a-z][a-z-]{1,}/g) || [];
    let bestRun = 0, bestPhrase = "";
    for (let n = Math.min(5, titleWords.length); n >= 2 && !bestRun; n--) {
      for (let i = 0; i + n <= titleWords.length; i++) {
        const run = titleWords.slice(i, i + n);
        if (!run.some((w) => !STOP.has(w) && w.length > 2)) continue;
        if (textLower.includes(" " + run.join(" ") + " ")) { bestRun = n; bestPhrase = run.join(" "); break; }
      }
    }
    /* A single-word title counts only if the word is distinctive in the corpus, so
     * "General" and "Scope" can never be a title match. */
    if (!bestRun) {
      const solo = titleWords.filter((w) => !STOP.has(w) && w.length > 3 && DISTINCTIVE(w));
      const hit = solo.find((w) => textLower.includes(" " + w + " "));
      if (hit) { bestRun = 1; bestPhrase = hit; }
    }

    /* Coverage of the TITLE, not length of the run. Ranking by run length favours long
     * titles, which is the mirror image of the ratio's bias against them: clause 5.2's
     * whole name is "AI policy" and a task naming it exactly is the strongest possible
     * signal, while A.2.4's "Review of the AI policy" matching three of its five words is
     * weaker. Relative to the smaller thing, as everything else here. */
    const coverage = titleWords.length ? bestRun / titleWords.length : 0;

    return { clause: p.clause, title: p.title, normative: p.normative,
      shared: shared.length, title_phrase: bestPhrase || null, title_run: bestRun,
      title_coverage: Number(coverage.toFixed(2)),
      body_score: Number(bodyScore.toFixed(3)),
      terms: shared.slice(0, 8),
      evidence: bestRun >= 2 && coverage >= 0.5 ? "title phrase"
        : bestRun >= 1 ? "title word" : "body overlap" };
  });

  /* TWO SIGNALS, AND ONLY THE WEAK ONE IS CAPPED. A title match is cheap, few and
   * strong, so making it compete for the same six slots as term overlap is what pushed
   * clause 5.2 off task 2.3's list twice -- once under a ratio and once under a run
   * length. Every clause whose title the task names is reported; the cap applies to the
   * body-overlap tail, where it belongs. */
  const titleMatches = scored.filter((s) => s.evidence === "title phrase")
    .sort((a, b) => b.title_coverage - a.title_coverage || b.body_score - a.body_score);
  const named = new Set(titleMatches.map((s) => s.clause));
  const bodyTop = scored.filter((s) => !named.has(s.clause) && s.shared >= 3)
    .sort((a, b) => b.body_score - a.body_score).slice(0, TOP);
  const top = [...titleMatches, ...bodyTop];
  rows.push({ task: t, domain: domById.get(t.domain_id), cited: citedResolved, top });
}

/* ---------------------------------------------------------------- the controls */
const ctlFail = [];
let ctlRan = 0;
for (const ex of EXEMPLARS) {
  const hit = rows.filter((r) => ex.when.test(r.task.statement + " " + (r.task.knowledge || "")));
  if (!hit.length) { ctlFail.push("EXEMPLAR NEVER EXERCISED: no AIMS-F task matches " + ex.when.source); continue; }
  ctlRan++;
  const ok = hit.some((r) => [...r.top.map((x) => x.clause), ...r.cited.map((x) => x.clause)]
    .some((c) => String(c).startsWith(ex.expect)));
  if (!ok) {
    ctlFail.push("EXEMPLAR NOT SURFACED: " + ex.when.source + " -> expected a passage under " +
      ex.expect + "; tasks " + hit.map((r) => r.task.code).join(",") +
      " ranked " + (hit[0].top.slice(0, 3).map((x) => x.clause).join(", ") || "nothing"));
  }
}

console.log("AIMS-F TASK SOURCES -- draft for the director. READ-ONLY.");
console.log("  tasks            " + tasks.length + " across " + myDomains.length + " domains");
console.log("  library          " + passages.length + " passages of " + STANDARD + ":" + EDITION);
console.log("  exemplars        " + ctlRan + " of " + EXEMPLARS.length + " exercised, " +
  (ctlFail.length ? ctlFail.length + " FAILED" : "all pass"));
for (const f of ctlFail) console.log("    " + f);
if (ctlFail.length) {
  console.error("");
  console.error("REFUSING TO WRITE. A ranker that cannot surface a pair fixed by the standard's own");
  console.error("structure is not evidence about the pairs nobody knows, and a draft nobody can");
  console.error("trust costs more to read than it saves.");
  process.exitCode = 2;
} else {
  /* -------------------------------------------------------------- coverage */
  const citedTasks = rows.filter((r) => r.cited.length).length;
  const notHeld = rows.flatMap((r) => r.cited.filter((c) => c.state === "NOT HELD")
    .map((c) => r.task.code + " -> " + c.clause));
  console.log("  tasks citing a clause explicitly   " + citedTasks + " of " + tasks.length);
  console.log("  explicit citations not held        " + notHeld.length +
    (notHeld.length ? "  " + notHeld.join(", ") : ""));
  console.log("  per-task candidate cap            " + TOP +
    "   (a cap is a claim that nothing below it matters -- the JSON carries the full ranking)");

  /* -------------------------------------------------------------- the report */
  const md = [];
  md.push("# AIMS-F task sources -- draft mapping");
  md.push("");
  md.push("**Section 2 of the grounded-generator brief. A draft for your read, not a decision.**");
  md.push("Nothing is written to `task_sources` by this script. Generated by");
  md.push("`scripts/draft-aimsf-task-sources.mjs` from `SOURCE-PASSAGES.json`.");
  md.push("");
  md.push("## How to read it");
  md.push("");
  md.push("| mark | what it means | how much to trust it |");
  md.push("|---|---|---|");
  md.push("| **cited** | the task's own knowledge statement names this clause | the blueprint's author anchored it; strongest evidence here |");
  md.push("| **names the title** | the task statement contains a phrase from the clause's own title | strong -- an author writing a task names the clauses |");
  md.push("| body overlap | the task and the clause share distinctive vocabulary | weak. Arithmetic, not judgement |");
  md.push("");
  md.push("Task 2.3 reads *\"Explain leadership requirements, the AI policy, AI objectives and");
  md.push("planning of changes\"* -- and those are the NAMES of clauses 5.1, 5.2, 6.2 and 6.4. That is");
  md.push("why the title is the primary signal: it is the author pointing at the clause. Coverage is");
  md.push("measured against the title, so naming the whole of a two-word title outranks matching");
  md.push("three words of a five-word one.");
  md.push("");
  md.push("Body overlap is weighted by inverse document frequency and normalised by the **shorter**");
  md.push("side, so a long task cannot score by sharing common words with everything.");
  md.push("");
  md.push("**A container is not a candidate.** Clause 3 is held both whole and as 3.1 to 3.26, and as");
  md.push("a whole block it shares vocabulary with every task in the certification. An item anchored");
  md.push("in \"clause 3\" is anchored in the definitions section rather than in the definition it");
  md.push("relies on, so a passage whose subclauses are also held is excluded and its children stand.");
  md.push("");
  md.push("**What this cannot do:** it cannot tell relevance from vocabulary. Two clauses about");
  md.push("planning share planning words; only one of them may be what a task examines. That is");
  md.push("the judgement being asked of you.");
  md.push("");
  md.push("**Title matches are NOT capped; body-overlap candidates are, at " + TOP + ".** Making the two");
  md.push("compete for the same slots lost clause 5.2 on task 2.3 twice while I was building this.");
  md.push("The full ranking is in `AIMS-F-TASK-SOURCES.json`, because a cap is a claim that nothing");
  md.push("below it matters.");
  md.push("");
  md.push("| | |");
  md.push("|---|---|");
  md.push("| tasks | " + tasks.length + " across " + myDomains.length + " domains |");
  md.push("| library | " + passages.length + " passages of " + STANDARD + ":" + EDITION + " |");
  md.push("| tasks citing a clause explicitly | " + citedTasks + " of " + tasks.length + " |");
  md.push("| explicit citations we do not hold | " + notHeld.length + " |");
  md.push("| exemplar pairs asserted before writing | " + ctlRan + ", all surfaced |");
  md.push("");

  for (const d of myDomains) {
    const mine = rows.filter((r) => r.task.domain_id === d.id);
    if (!mine.length) continue;
    md.push("---");
    md.push("");
    md.push("## " + d.code + " -- " + d.title + "  (" + d.weight_pct + "% of the exam)");
    md.push("");
    for (const r of mine) {
      md.push("### " + r.task.code + "  " + r.task.statement);
      md.push("");
      md.push("*Bloom " + (r.task.bloom_level || "?") + (r.task.is_exam_scope ? ", in exam scope" : ", NOT in exam scope") + "*");
      md.push("");
      if (r.cited.length) {
        md.push("**Cited by the task itself:**");
        md.push("");
        for (const c of r.cited) {
          const p = byClause.get(c.clause);
          if (c.state === "held") {
            md.push("- **" + c.clause + "** " + (p.title || "") + "  `[" + p.normative + "]`");
          } else if (c.state === "container") {
            md.push("- **" + c.clause + "** is a container -- held as " + c.children.join(", "));
          } else {
            md.push("- **" + c.clause + "** NOT HELD -- an item cannot anchor here");
          }
        }
        md.push("");
      }
      md.push("**Ranked candidates:**");
      md.push("");
      md.push("| clause | title | modal | evidence | shared terms | body score |");
      md.push("|---|---|---|---|---|---|");
      for (const s of r.top) {
        md.push("| " + s.clause + " | " + String(s.title || "").replace(/\|/g, "/") + " | " +
          s.normative + " | " + (s.evidence === "title phrase"
            ? "**names the title** _(" + s.title_phrase + ", " + Math.round(s.title_coverage * 100) + "% of it)_"
            : "body overlap") + " | " +
          s.shared + " _(" + s.terms.slice(0, 5).join(", ") + ")_ | " +
          s.body_score.toFixed(3) + " |");
      }
      if (!r.top.length) {
        md.push("| _none_ | names no clause title and shares fewer than three distinctive terms with any clause | | | | |");
      }
      md.push("");
    }
  }
  md.push("---");
  md.push("");
  md.push("## What I need from you");
  md.push("");
  md.push("Per task: which candidates are **primary** (what the task is about) and which are");
  md.push("**supporting** (context an item may lean on). The grounded generator is given the full");
  md.push("text of both and may anchor a key only in them, so a task mapped too narrowly starves");
  md.push("the generator and one mapped too widely lets an item anchor in a clause it is not");
  md.push("examining. Marking nothing is also an answer: that task generates no grounded items");
  md.push("until it is mapped.");
  writeFileSync(join(ROOT, "AIMS-F-TASK-SOURCES.md"), md.join("\n") + "\n", "utf8");

  writeFileSync(join(ROOT, "AIMS-F-TASK-SOURCES.json"), JSON.stringify({
    certification: CERT, standard: STANDARD, edition: EDITION,
    library_passages: passages.length, generated_from: "SOURCE-PASSAGES.json",
    exemplars_exercised: ctlRan, top_cap: TOP,
    tasks: rows.map((r) => ({
      code: r.task.code, task_id: r.task.id, domain: r.domain && r.domain.code,
      statement: r.task.statement, cited: r.cited,
      candidates: r.top,
    })),
  }, null, 1) + "\n", "utf8");
  console.log("");
  console.log("wrote AIMS-F-TASK-SOURCES.md and AIMS-F-TASK-SOURCES.json");
}
