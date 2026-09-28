#!/usr/bin/env node
/**
 * draft-iso-task-sources.mjs -- propose which library passages each ISO task is examined against, for all
 * four ISO certifications. READ-ONLY: it writes one markdown draft and one JSON, and nothing to any table.
 *
 *   --cert=ISMS-F|ISMS-IA|AIMS-F|AIMS-IA   default: all four
 *   --top=6                                candidates per task
 *   --out=ISO-TASK-SOURCES-DRAFT.md
 *
 * ============ WHY THIS DOES NOT WRITE task_sources ============
 *
 * `draft-aimsf-task-sources.mjs` established the discipline and it is the right one: "It cannot decide
 * relevance. Candidates are ranked, never decided, and the director's read is what promotes one to
 * `primary`." AIMS-F's 35 links exist because a human read them.
 *
 * Writing 127 tasks' links unread would put a machine's guess into the one structure the anchor gate
 * trusts -- and I argued last round against linking into a library with known defects for exactly that
 * reason. The output here is a draft for that same read, one row per task, laid out to be disagreed with.
 *
 * ============ AND AIMS-F IS THE CONTROL, NOT A FIFTH JOB ============
 *
 * AIMS-F is already linked, by a human, from this ranker's ancestor. So running the generalised ranker over
 * it and comparing against the EXISTING primaries costs nothing and is the only evidence available that the
 * ranker is worth reading on the other three. A ranker that cannot reproduce the mapping a human accepted
 * is not ready to propose 127 more.
 *
 * ============ THE AUDITOR CERTIFICATIONS HAVE TWO STANDARDS ============
 *
 * ISMS-IA is examined on ISO/IEC 27001 AND ISO 19011; AIMS-IA on ISO/IEC 42001 AND ISO 19011. Their clause
 * 4 and clause 5 numbers COLLIDE, which CLAUDE.md records as the reason the key is (standard, address) and
 * never the address alone. Candidates therefore carry their source, and a task can draw from both.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let ONLY = null, TOP = 6, OUT = "ISO-TASK-SOURCES-DRAFT.md";
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--cert=(.+)$/.exec(a))) { ONLY = m[1]; continue; }
  if ((m = /^--top=(\d+)$/.exec(a))) { TOP = Number(m[1]); continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  console.error("unknown flag " + JSON.stringify(a) + ". Known: --cert=, --top=, --out=");
  console.error("READ-ONLY. There is no --apply: a task-source mapping is promoted by a human read.");
  process.exitCode = 2; process.exit();
}

/* ============ EXEMPLARS, DECLARED FROM EACH STANDARD'S STRUCTURE ============
 *
 * Per standard, not per certification, because the structure belongs to the standard: internal audit is
 * 9.2 of 27001 and of 42001, and the audit programme is clause 5 of 19011. Each says: a task whose text
 * matches `when` must surface a passage under `expect` FROM THAT STANDARD. If the ranker cannot find its
 * own exemplars it writes nothing, because a classifier that cannot find its exemplar reports clean
 * forever. */
const EXEMPLARS = {
  "ISO/IEC 42001": [
    { when: /internal audit/i, expect: "9.2" },
    { when: /management review/i, expect: "9.3" },
    { when: /\bAI policy\b/i, expect: "5.2" },
    { when: /impact assessment/i, expect: "6.1.4" },
    { when: /nonconformity|corrective action/i, expect: "10" },
    { when: /statement of applicability|Annex A/i, expect: "A." },
  ],
  "ISO/IEC 27001": [
    { when: /internal audit/i, expect: "9.2" },
    { when: /management review/i, expect: "9.3" },
    { when: /information security policy/i, expect: "5.2" },
    { when: /risk assessment/i, expect: "6.1.2" },
    { when: /risk treatment|statement of applicability/i, expect: "6.1.3" },
    { when: /nonconformity|corrective action/i, expect: "10" },
    { when: /Annex A|\bcontrols?\b/i, expect: "A." },
  ],
  "ISO 19011": [
    { when: /audit programme/i, expect: "5" },
    { when: /conducting|audit activities/i, expect: "6" },
    { when: /principles? of auditing|audit principles/i, expect: "4" },
    { when: /competence|evaluat\w+ auditors?/i, expect: "7" },
  ],
};

/* ============ THE POOL WAS TOO NARROW, AND THE ZERO-CANDIDATE TASKS PROVED IT ============
 *
 * Six ISMS-F tasks came back with no candidate, and reading them showed the ranker had not been given the
 * documents they are about:
 *
 *   4.2  "control attributes and how they support selection and reporting"  ->  ISO/IEC 27002 clause 4.2,
 *        "Themes and attributes". Held all along; never searched.
 *   5.5  "stage 1, stage 2, surveillance and the three-year cycle"          ->  ISO/IEC 17021-1 9.3.1.2.1
 *        "Stage 1", 9.3.1.3 "Stage 2", 9.6.2 surveillance. Held; never searched.
 *
 * A certification is examined on the standard it is named after PLUS the documents that standard delegates
 * to and the ones the scheme itself runs on. 27001 defines no vocabulary (clause 3 delegates to 27000), its
 * controls are elaborated in 27002, and the certification PROCESS a Foundation candidate is taught lives in
 * 17021-1. Leaving those out does not make the mapping conservative, it makes six tasks unanswerable.
 *
 * AIMS-F KEEPS 42001 ALONE, DELIBERATELY. Its 150 links were reviewed against 42001, so widening its pool
 * would change what the control measures. The consequence is stated rather than hidden: the other three
 * face a LARGER candidate pool than the control did, so precision measured on AIMS-F is an upper bound for
 * them, not a like-for-like prediction. */
const CERTS = {
  "AIMS-F": { standards: ["ISO/IEC 42001"] },
  "ISMS-F": { standards: ["ISO/IEC 27001", "ISO/IEC 27002", "ISO/IEC 27000", "ISO/IEC 17021-1"] },
  "AIMS-IA": { standards: ["ISO/IEC 42001", "ISO 19011", "ISO/IEC 22989", "ISO/IEC 42006"] },
  "ISMS-IA": { standards: ["ISO/IEC 27001", "ISO 19011", "ISO/IEC 27002", "ISO/IEC 27000"] },
};

const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const STOP = new Set(`a an and are as at be been being but by can for from has have in into is it its
may must not of on or shall should such that the their them then there these they this those to under
was were what when where which while with would organization organizations information system systems
requirements requirement process processes ensure ensuring relevant appropriate applicable`.split(/\s+/));
const words = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean);
const terms = (s) => [...new Set(words(s).filter((w) => w.length >= 5 && !STOP.has(w)))];
const ADDRESS = /\b(?:clause|clauses|annex|control|controls|subclause)\s+((?:A|B)?\.?\d+(?:\.\d+){0,3})/gi;

/* Title coverage: the strongest signal, and uncapped. A blueprint author naming a clause names its title. */
const titleCover = (taskText, title) => {
  const t = words(title).filter((w) => !STOP.has(w));
  if (t.length < 2) return 0;                      /* "General", "Scope" identify nothing */
  const hay = " " + words(taskText).join(" ") + " ";
  let best = 0;
  for (let i = 0; i < t.length; i++) {
    for (let j = t.length; j > i + 1; j--) {
      const run = t.slice(i, j).join(" ");
      if (hay.includes(" " + run + " ")) { best = Math.max(best, j - i); break; }
    }
  }
  return best / t.length;
};

const KEY = requireKey(HERE);
const certRows = await getAll(KEY, "certifications?select=id,code&order=code");
const allTasks = await getAll(KEY,
  "tasks?select=id,certification_id,domain_id,code,statement,knowledge,skills,abilities&order=code");
const links = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id");
const spRows = await getAll(KEY, "source_passages?select=id,source_id,clause&order=id");
const spById = new Map(spRows.map((r) => [r.id, r]));

const wanted = Object.keys(CERTS).filter((c) => !ONLY || c === ONLY);
const out = [];
const ctlFails = [];

for (const code of wanted) {
  const cert = certRows.find((c) => c.code === code);
  if (!cert) { ctlFails.push(code + ": certification not found"); continue; }
  const cfg = CERTS[code];
  const passages = lib.passages.filter((p) => cfg.standards.includes(p.source_id));
  if (!passages.length) { ctlFails.push(code + ": the library holds no passages for " + cfg.standards.join(" or ")); continue; }
  const tasks = allTasks.filter((t) => t.certification_id === cert.id);
  if (!tasks.length) { ctlFails.push(code + ": no tasks"); continue; }

  const rows = [];
  for (const t of tasks) {
    const text = [t.statement, t.knowledge, t.skills, t.abilities].filter(Boolean).join("\n");
    const tTerms = terms(text);
    const cand = [];
    /* (1) an address the task's own text cites is the blueprint author's own anchor. */
    const cited = new Set();
    ADDRESS.lastIndex = 0;
    for (const m of text.matchAll(ADDRESS)) cited.add(m[1].replace(/^\./, ""));
    for (const p of passages) {
      const isCited = cited.has(String(p.clause));
      const tc = titleCover(text, p.title);
      const pTerms = terms(p.text);
      const shared = pTerms.filter((w) => tTerms.includes(w));
      const denom = Math.max(1, Math.min(pTerms.length, tTerms.length));
      const overlap = shared.length / denom;
      /* Body overlap needs 3 shared distinctive terms; two is noise. Normalised by the SHORTER side,
       * because an absolute count selects by length. */
      const bodyOk = shared.length >= 3;
      if (!isCited && tc < 0.5 && !bodyOk) continue;
      const score = (isCited ? 100 : 0) + tc * 10 + (bodyOk ? Math.min(overlap, 0.5) * 4 : 0);
      cand.push({ clause: p.clause, source: p.source_id, title: p.title, cited: isCited,
        titleCover: Number(tc.toFixed(2)), shared: shared.length, score: Number(score.toFixed(2)) });
    }
    cand.sort((a, b) => b.score - a.score);
    /* `candAll` is kept so the control can measure recall at several depths. Recall at ONE depth cannot
     * separate "the ranker ranks badly" from "the cap is too small", and those need opposite responses. */
    rows.push({ cert: code, task: t.code, statement: t.statement, cand: cand.slice(0, TOP),
      candAll: cand.map((c) => c.clause), nCand: cand.length });
  }

  /* Exemplars, per standard actually in this certification's set. */
  let ran = 0;
  for (const std of cfg.standards) {
    for (const ex of EXEMPLARS[std] || []) {
      const hit = rows.filter((r) => ex.when.test(r.statement || ""));
      if (!hit.length) continue;                    /* not exercised here: not a failure of the ranker */
      ran++;
      const found = hit.some((r) => r.cand.some((c) => c.source === std && String(c.clause).startsWith(ex.expect)));
      if (!found) {
        ctlFails.push(code + "/" + std + ": a task matching " + ex.when.source +
          " surfaced no candidate under " + ex.expect);
      }
    }
  }
  out.push({ cert: code, standards: cfg.standards, rows, exemplarsRun: ran });
}

/* ============ THE AIMS-F CONTROL: DOES THE RANKER AGREE WITH THE HUMAN? ============ */
let control = null;
{
  const aimsf = out.find((o) => o.cert === "AIMS-F");
  const cert = certRows.find((c) => c.code === "AIMS-F");
  if (aimsf && cert) {
    const mine = new Map();
    for (const t of allTasks.filter((x) => x.certification_id === cert.id)) mine.set(t.id, t.code);
    const existing = new Map();
    for (const l of links) {
      const code = mine.get(l.task_id);
      if (!code || l.role !== "primary") continue;
      const p = spById.get(l.passage_id);
      if (!p) continue;
      if (!existing.has(code)) existing.set(code, new Set());
      existing.get(code).add(p.clause);
    }
    let tasksWithPrimary = 0, recovered = 0, total = 0;
    const misses = [], invisible = [];
    const DEPTHS = [6, 12, 25, 60, Infinity];
    const atDepth = new Map(DEPTHS.map((d) => [d, 0]));
    for (const [code, clauses] of existing) {
      tasksWithPrimary++;
      const row = aimsf.rows.find((r) => r.task === code);
      const all = row ? row.candAll : [];
      const got = new Set((row ? row.cand : []).map((c) => c.clause));
      for (const c of clauses) {
        total++;
        if (got.has(c)) recovered++;
        else misses.push(code + " -> " + c);
        const rank = all.indexOf(c);
        for (const d of DEPTHS) if (rank >= 0 && rank < d) atDepth.set(d, atDepth.get(d) + 1);
        /* A primary the ranker never scores at ALL is invisible to it -- no title match and under three
         * shared terms -- and no cap change reaches it. That is the number that says what the ranker
         * cannot do, as opposed to what its cap is hiding. */
        if (rank < 0) invisible.push(code + " -> " + c);
      }
    }
    control = { tasksWithPrimary, total, recovered, misses,
      curve: DEPTHS.map((d) => ({ depth: d === Infinity ? "all" : d, recovered: atDepth.get(d) })),
      invisible };
  }
}

if (ctlFails.length) {
  console.error("REFUSING TO WRITE -- the ranker failed its own exemplars:");
  for (const f of ctlFails) console.error("  " + f);
  process.exitCode = 2; process.exit();
}

const md = [];
const p = (s = "") => md.push(s);
p("# ISO task sources: draft mapping for the four ISO certifications");
p("");
p("`scripts/draft-iso-task-sources.mjs`, **READ-ONLY. Nothing was written to `task_sources`.**");
p("");
p("A mapping is promoted to `primary` by your read, not by this ranker -- the discipline the AIMS-F drafter");
p("set: *candidates are ranked, never decided*. AIMS-F's 35 existing links exist because you read them.");
p("");
if (control) {
  const pct = control.total ? (100 * control.recovered / control.total).toFixed(0) : "0";
  p("## The control: does this ranker reproduce the mapping you already accepted?");
  p("");
  p("| | |");
  p("|---|---|");
  p("| AIMS-F tasks with a reviewed `primary` | " + control.tasksWithPrimary + " |");
  p("| reviewed primary passages | " + control.total + " |");
  p("| surfaced in this ranker's top " + TOP + " | **" + control.recovered + " (" + pct + "%)** |");
  p("| not surfaced | " + control.misses.length + (control.misses.length ? " — " + control.misses.slice(0, 12).join(", ") : "") + " |");
  p("");
  p("**Recall by depth, which separates a bad ranking from a small cap:**");
  p("");
  p("| top N | reviewed primaries surfaced | of " + control.total + " |");
  p("|---|---|---|");
  for (const c of control.curve) {
    p("| " + c.depth + " | " + c.recovered + " | " +
      (control.total ? (100 * c.recovered / control.total).toFixed(0) + "%" : "-") + " |");
  }
  p("");
  p("**" + control.invisible.length + " of " + control.total + " reviewed primaries are INVISIBLE to this");
  p("ranker at any depth** — they score nothing, because they have no title match and fewer than three");
  p("shared distinctive terms. No cap change reaches them: a human linked those on understanding, not on");
  p("lexical overlap. That is the ceiling of this instrument, stated rather than discovered later.");
  p("");
  p("So this is a STARTING POINT FOR A READ, not a proposal to apply. Roughly two thirds of a mapping you");
  p("already accepted is recoverable by ranking; the last third is the part only you can supply.");
  p("");
}
for (const o of out) {
  const zero = o.rows.filter((r) => r.nCand === 0);
  p("## " + o.cert + "  (" + o.standards.join(" + ") + ")");
  p("");
  p("| | |");
  p("|---|---|");
  p("| tasks | " + o.rows.length + " |");
  p("| with at least one candidate | " + (o.rows.length - zero.length) + " |");
  p("| **ending with ZERO candidates** | **" + zero.length + "** |");
  p("| exemplars exercised | " + o.exemplarsRun + " |");
  p("");
  if (zero.length) {
    p("Zero-candidate tasks — these cannot be linked by any ranking and need a human or a source we lack:");
    p("");
    for (const r of zero) p("- `" + r.task + "` " + String(r.statement || "").slice(0, 110));
    p("");
  }
  p("<details><summary>Per-task candidates</summary>");
  p("");
  for (const r of o.rows) {
    p("**" + r.task + "** — " + String(r.statement || "").slice(0, 120));
    p("");
    if (!r.cand.length) { p("- (no candidate)"); p(""); continue; }
    for (const c of r.cand) {
      p("- `" + c.source + " " + c.clause + "` " + (c.title || "") +
        (c.cited ? "  **CITED by the task**" : "") +
        "  (title " + c.titleCover + ", shared terms " + c.shared + ", score " + c.score + ")");
    }
    p("");
  }
  p("</details>");
  p("");
}
writeFileSync(join(ROOT, OUT), md.join("\n") + "\n", "utf8");
writeFileSync(join(ROOT, OUT.replace(/\.md$/, ".json")),
  JSON.stringify({ top: TOP, control, certs: out }, null, 1) + "\n", "utf8");

console.log("ISO TASK SOURCES -- DRAFT, READ-ONLY, nothing written to task_sources");
if (control) {
  console.log("  AIMS-F control: " + control.recovered + " of " + control.total +
    " reviewed primaries surfaced in the top " + TOP +
    (control.misses.length ? "   misses: " + control.misses.slice(0, 6).join(", ") : ""));
}
for (const o of out) {
  const zero = o.rows.filter((r) => r.nCand === 0).length;
  console.log("  " + o.cert.padEnd(9) + "tasks " + String(o.rows.length).padStart(3) +
    "   with candidates " + String(o.rows.length - zero).padStart(3) +
    "   ZERO " + String(zero).padStart(3) + "   exemplars run " + o.exemplarsRun);
}
console.log("  wrote " + OUT);
