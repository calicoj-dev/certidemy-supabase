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

/**
 * The plain-language topic labels in a lesson. TWO FORMATS, AND THE SECOND ONE
 * IS THE ONE THE PLATFORM ACTUALLY USES.
 *
 * This read markdown H2-H4 only, and on 2026-09-13 a run against AISM-I
 * returned candidates for ZERO of 226 concepts. The cause was not the corpus:
 * AISM-I lessons have no markdown headings at ALL. They are authored as YAML
 * frontmatter plus directive blocks -- `::hook`, `::concept title="..."`,
 * `::checkpoint` -- and `::concept title` is the exact structural analogue of
 * the H3 this function was written for.
 *
 * A census of all 479 English lessons then showed it is not an AISM-I quirk.
 * EVERY certification is in the directive format; H2-H4 headings survive in
 * five lessons across three certifications, 14 headings in total, against
 * 1,565 `::concept` titles. So this extractor has been reading ~1% of the
 * available labels platform-wide since it was written.
 *
 * That also re-reads the D3 history in the comment this replaces. Bold spans
 * were enabled, found to be "roughly 97% noise", and disabled. Headings alone
 * gave SM-AI-I four labels in one lesson, so bold spans were not an
 * enrichment -- they were compensation for an extractor pointed at a format
 * the corpus had already left. The noise was real; the diagnosis was not.
 */
function labelsFrom(md) {
  const out = [];
  // Markdown headings: the original format, still present in five lessons.
  for (const m of md.matchAll(/^#{2,4}\s+(.+?)\s*$/gm)) out.push(m[1]);
  // Directive blocks: the current format, every certification.
  for (const m of md.matchAll(/^::concept.*?title="([^"]+)"/gm)) out.push(m[1]);
  // Bold spans stay OFF. They mark emphasis mid-sentence, not topic labels.
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

// PARSE-FAILURE INSTRUMENTATION. See the abort below: these separate "this
// concept has no candidate" from "this script cannot read this format".
const lessonsRead = new Set();
const lessonsWithNoLabel = new Set();
let labelsSeen = 0;

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
    // COUNT PER DISTINCT LESSON, NOT PER CONCEPT VISIT. A lesson is re-read
    // once for every concept it teaches, so accumulating here reported AISM-I
    // as 546 labels from 61 lessons when the true figure is 144 -- the join
    // fan-out, inflating a diagnostic that exists to be believed.
    const firstVisit = !lessonsRead.has(lid);
    lessonsRead.add(lid);
    const labels = labelsFrom(lesson.content_md);
    if (firstVisit) {
      if (labels.length === 0) lessonsWithNoLabel.add(lid);
      labelsSeen += labels.length;
    }
    for (const label of labels) {
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

// =================== ABORT ON A PARSE FAILURE, NOT A WRITE ===================
//
// "no candidates" has TWO causes and they need opposite responses:
//
//   (a) this concept's lessons carry no label overlapping its name. Normal.
//       The concept matches on its name alone, which the readme calls a fine
//       outcome, and it is.
//   (b) THIS SCRIPT CANNOT READ THIS CERTIFICATION'S LESSON FORMAT. Every
//       concept reports (a), the summary line reads "no candidates 226", and
//       nothing anywhere says the extractor never found a single label.
//
// (b) happened on AISM-I on 2026-09-13 and printed as a clean run. It is the
// silent-success shape this repo keeps paying for: the operation completes,
// returns something plausible, and the emptiness is indistinguishable from a
// real answer. A reviewer would have concluded AISM-I's lessons teach nothing
// nameable, which is false -- there are 144 topic labels in those 61 lessons.
//
// So the property is asserted on the LESSONS, not on the candidates: a lesson
// that was successfully read and yielded no label at all is evidence about the
// PARSER. Nothing is written when that evidence is strong.
const readCount = lessonsRead.size;
const blankCount = lessonsWithNoLabel.size;
const blankNames = [...lessonsWithNoLabel].map((id) => lessonById.get(id)?.slug ?? id);

const say = (...a) => console.error(...a);

if (readCount > 0 && labelsSeen === 0) {
  say(`PARSE FAILURE -- nothing written.`);
  say(``);
  say(`Read ${readCount} lesson(s) for ${certCode} and extracted ZERO labels from`);
  say(`all of them. That is not a corpus with no topic labels; it is an extractor`);
  say(`that does not recognise this certification's lesson format.`);
  say(``);
  say(`labelsFrom() understands markdown H2-H4 and ::concept title="...".`);
  say(`Check what these lessons actually use:`);
  for (const n of blankNames.slice(0, 3)) say(`  ${n}`);
  say(``);
  say(`Teach labelsFrom() that format before trusting any output from this run.`);
  process.exit(1);
}

if (readCount > 0 && blankCount * 2 > readCount) {
  say(`PARSE FAILURE -- nothing written.`);
  say(``);
  say(`${blankCount} of ${readCount} lesson(s) read for ${certCode} yielded no label.`);
  say(`A majority of a certification's lessons having no topic label at all means`);
  say(`the extractor is reading a format it only partly understands -- the`);
  say(`remaining ${readCount - blankCount} may be the exception, not the rule.`);
  say(``);
  for (const n of blankNames.slice(0, 6)) say(`  ${n}`);
  process.exit(1);
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
console.log(`  lessons read      ${readCount}, ${labelsSeen} labels extracted`);

// The minority case. Not fatal -- a short lesson can legitimately carry no
// topic label -- but it is the same evidence as the abort above, weaker, and
// it is how a PARTIALLY unrecognised format would present.
if (blankCount > 0) {
  console.log(``);
  console.log(`  NOTE: ${blankCount} of ${readCount} lesson(s) read yielded no label at all.`);
  console.log(`  A label-free lesson is possible; a cluster of them means labelsFrom()`);
  console.log(`  is missing a format this certification uses. Spot-check one:`);
  for (const n of blankNames.slice(0, 3)) console.log(`    ${n}`);
}
if (noLessons > 0) {
  console.log(`\n  WARNING: ${noLessons} concept(s) have no lesson teaching them.`);
  console.log(`  No lesson means no grounded source for a term -- and it may also`);
  console.log(`  mean a coverage hole in the curriculum itself. Worth checking.`);
}
