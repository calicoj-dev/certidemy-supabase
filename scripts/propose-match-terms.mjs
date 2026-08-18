// scripts/propose-match-terms.mjs
//
// Proposes concepts.match_terms candidates FROM OUR OWN LESSON PROSE, for human
// review. Writes a review file; it never touches the database.
//
//   node scripts/propose-match-terms.mjs --cert SM-AI-I --domain D3
//   node scripts/propose-match-terms.mjs --cert SM-AI-I            # all domains
//
// Then: edit the review file, delete what is wrong, and run
//   node scripts/emit-match-terms-sql.mjs --in <file> --migration 226
// which prints a .sql you run in the editor. Propose -> review -> migration,
// the same shape as every other authoring pipeline here.
//
// ===================== WHY LESSONS ARE THE SOURCE =====================
//
// A match term must be what a real document CALLS the concept. Inventing those
// from model knowledge is the attribution failure that produced false
// "ISO 19011 requires..." claims -- the same rule that makes
// drift_rules.authority_citation_id NOT NULL.
//
// Our lessons already teach every concept in plain language, and their HEADINGS
// and BOLD SPANS are literally the topic labels. "Responsibilities of the Scrum
// Master with the Product Owner" is the kind of phrase that appears as an H3 in
// a lesson and as a bullet in a competitor syllabus, while the concept NAME
// stays analytic ("Scrum Master serves the Product Owner").
//
// ==================== THE RISK, STATED PLAINLY ====================
//
// A term that is too generic silently INFLATES a competitor's coverage, and
// unlike every other failure in this engine that one is invisible in the
// output -- it looks like a good result.
//
// So this script proposes and a human disposes. It deliberately over-proposes
// and flags the dangerous ones rather than filtering silently, because a
// candidate you can see and delete is safer than one quietly dropped.

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { getAll, getAllIn, requireKey } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const argv = process.argv.slice(2);
const flag = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i === -1 ? d : argv[i + 1];
};
const certCode = flag("cert", "SM-AI-I");
const domainCode = flag("domain", null);
const outPath =
  flag("out", null) ??
  join(HERE, "..", "..", "fixtures", `match-terms-${certCode}${domainCode ? "-" + domainCode : ""}.json`);

const KEY = requireKey(HERE);
const get = (path) => getAll(KEY, path);

// ------------------------------------------------------------------ pull

const lessonLang = flag("lessonLang", "en");
const [cert] = await get(`certifications?select=id,code&code=eq.${encodeURIComponent(certCode)}`);
if (!cert) throw new Error(`no certification ${certCode}`);

const domains = await get(`domains?select=id,code,title&certification_id=eq.${cert.id}`);
const domainById = new Map(domains.map((d) => [d.id, d]));
const wanted = domainCode ? domains.filter((d) => d.code === domainCode) : domains;
if (wanted.length === 0) throw new Error(`no domain ${domainCode} on ${certCode}`);
const wantedIds = new Set(wanted.map((d) => d.id));

const tasks = await get(
  `tasks?select=id,domain_id,scope_tag&certification_id=eq.${cert.id}`,
);
const concepts = await get(
  `concepts?select=id,slug,name,match_terms&certification_id=eq.${cert.id}&order=slug`,
);
const taskConcepts = await getAllIn(
  KEY, "task_concepts", "task_id,concept_id", "task_id",
  tasks.map((t) => t.id), "&order=concept_id",
);
const lessonConcepts = await getAllIn(
  KEY, "lesson_concepts", "lesson_id,concept_id", "concept_id",
  concepts.map((c) => c.id), "&order=concept_id",
);
const lessonIds = [...new Set(lessonConcepts.map((l) => l.lesson_id))];
// LANGUAGE FILTER. Its absence is why the D3 review file was polluted with
// Spanish and Portuguese candidates against an English blueprint.
const lessons = lessonIds.length
  ? await getAllIn(KEY, "lessons", "id,slug,title,content_md,language", "id", lessonIds,
      `&language=eq.${encodeURIComponent(lessonLang)}`)
  : [];
const lessonById = new Map(lessons.map((l) => [l.id, l]));

// ------------------------------------------------------------- extraction

const STOP = new Set(["the", "and", "of", "for", "to", "in", "a", "an", "with", "on", "by", "as", "is"]);
const toks = (s) =>
  s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 2 && !STOP.has(t));
const stem = (t) => t.replace(/(ings|ing|ies|es|s)$/u, "");

/** Headings and bold spans: the plain-language topic labels in a lesson. */
function labelsFrom(md) {
  const out = [];
  // HEADINGS ONLY. Bold spans mark emphasis mid-sentence in these lessons, not
  // topic labels, and including them produced candidates like "2020 Scrum Guide
  // removed that as a requirement." -- roughly 97% noise in the D3 run.
  for (const m of md.matchAll(/^#{2,4}\s+(.+?)\s*$/gm)) out.push(m[1]);
  return out
    .map((s) => s.replace(/[`*_[\]()#]/g, "").replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= 6 && s.length <= 70)
    .filter((s) => !/^[\d.\s]+$/.test(s));
}

// A term this short or this common across concepts will credit coverage nobody
// earned. Flagged, never silently dropped.
const GENERIC_MAX_TOKENS = 1;

const conceptTasks = new Map();
for (const tc of taskConcepts) {
  const arr = conceptTasks.get(tc.concept_id) ?? [];
  arr.push(tc.task_id);
  conceptTasks.set(tc.concept_id, arr);
}
const taskById = new Map(tasks.map((t) => [t.id, t]));
const conceptLessons = new Map();
for (const lc of lessonConcepts) {
  const arr = conceptLessons.get(lc.concept_id) ?? [];
  arr.push(lc.lesson_id);
  conceptLessons.set(lc.concept_id, arr);
}

const rows = [];
let noLessons = 0;

for (const c of concepts) {
  const tids = conceptTasks.get(c.id) ?? [];
  const ts = tids.map((id) => taskById.get(id)).filter(Boolean);
  if (!ts.some((t) => wantedIds.has(t.domain_id))) continue;

  const inCoreScope = ts.some((t) => t.scope_tag === "core");
  const nameToks = new Set(toks(c.name).map(stem));

  const candidates = new Map();
  for (const lid of conceptLessons.get(c.id) ?? []) {
    const lesson = lessonById.get(lid);
    if (!lesson?.content_md) continue;
    for (const label of labelsFrom(lesson.content_md)) {
      const lt = new Set(toks(label).map(stem));
      if (lt.size === 0) continue;
      let shared = 0;
      for (const t of lt) if (nameToks.has(t)) shared++;
      // Needs real overlap with the concept, and must not simply BE the name.
      if (shared === 0) continue;
      if (label.toLowerCase() === c.name.toLowerCase()) continue;
      const key = label.toLowerCase();
      if (!candidates.has(key)) {
        candidates.set(key, {
          term: label,
          shared_tokens: shared,
          term_tokens: lt.size,
          from_lesson: lesson.slug,
          risk: lt.size <= GENERIC_MAX_TOKENS ? "TOO GENERIC - probably delete" : null,
        });
      }
    }
  }

  const lessonCount = (conceptLessons.get(c.id) ?? []).length;
  if (lessonCount === 0) noLessons++;

  rows.push({
    slug: c.slug,
    name: c.name,
    domains: [...new Set(ts.filter((t) => t.domain_id).map((t) => domainById.get(t.domain_id)?.code))].sort(),
    in_core_scope: inCoreScope,
    existing_terms: c.match_terms ?? [],
    lessons_teaching: lessonCount,
    approved_terms: [],
    candidates: [...candidates.values()]
      .sort((a, b) => b.shared_tokens - a.shared_tokens || a.term.length - b.term.length)
      .slice(0, 8),
  });
}

const doc = {
  _readme: [
    "REVIEW FILE. Nothing here is applied until you emit and run the migration.",
    "",
    "For each concept: read `candidates`, and COPY the good ones into",
    "`approved_terms`. Anything left in `candidates` is ignored.",
    "",
    "A good term is what a COMPETITOR'S DOCUMENT would print. A bad term is one",
    "generic enough to appear in any syllabus -- that silently inflates their",
    "coverage, and unlike every other failure in this engine, an inflated score",
    "looks like a good result rather than a bug.",
    "",
    "Candidates come from headings and bold spans in OUR lessons. Terms are never",
    "invented; if a concept has no usable candidate, leave approved_terms empty",
    "and it keeps matching on its name alone. That is a fine outcome.",
    "",
    "in_core_scope=false means the concept is reachable only from extended (AI)",
    "tasks. No pure-Scrum course can match it, so terms there buy nothing.",
  ],
  certification: certCode,
  domain: domainCode ?? "all",
  generated_at: new Date().toISOString(),
  concepts: rows,
};

writeFileSync(outPath, JSON.stringify(doc, null, 2), "utf8");

const withCands = rows.filter((r) => r.candidates.length > 0).length;
const core = rows.filter((r) => r.in_core_scope).length;
console.log(`wrote ${rows.length} concepts -> ${outPath}`);
console.log(`  core scope        ${core}`);
console.log(`  have candidates   ${withCands}`);
console.log(`  no candidates     ${rows.length - withCands}  (will match on name alone)`);
if (noLessons > 0) {
  console.log(`\n  WARNING: ${noLessons} concept(s) have no lesson teaching them.`);
  console.log(`  No lesson means no grounded source for a term -- and it may also`);
  console.log(`  mean a coverage hole in the curriculum itself. Worth checking.`);
}
