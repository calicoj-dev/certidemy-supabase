/**
 * measure-frontmatter-concepts.mjs -- does a lesson body's frontmatter
 * `concept_slugs` agree with the `lesson_concepts` table?
 *
 * READ-ONLY. Unknown flags exit 2.
 *
 * ============ THE TWO SOURCES ============
 *
 * `lesson_concepts` is the relational truth: it is what the concept coverage
 * invariant, the blueprint and the readiness roll-up all read. The frontmatter
 * block at the top of `content_md` is a SECOND COPY of that fact, and this
 * repository's whole thesis is that a second copy goes stale by default.
 *
 * ============ AND ONLY ENGLISH HAS FRONTMATTER ============
 *
 * Measured 2026-09-25: translated lesson rows carry NO frontmatter at all. So a
 * consumer reading `concept_slugs` off the served body gets a list for English
 * and nothing for es-419 or pt-BR -- which is a third state, not an empty list,
 * and reporting it as "no concepts" would be the silent-empty defect this
 * codebase opens with.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { acquireHeavyReaderLock } from "./lib/heavy-reader-lock.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY, takes none");
  process.exitCode = 2; process.exit();
}

/** frontmatter `concept_slugs`, or null when there is no frontmatter at all. */
function frontmatterSlugs(md) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(String(md || ""));
  if (!m) return null;                      // NO FRONTMATTER is its own state
  const body = m[1];
  const at = /(^|\r?\n)concept_slugs:\s*(\r?\n|$)/.exec(body);
  if (!at) return [];                       // frontmatter present, key absent
  const after = body.slice(at.index + at[0].length);
  const out = [];
  for (const ln of after.split(/\r?\n/)) {
    const item = /^\s*-\s+(\S+)\s*$/.exec(ln);
    if (item) { out.push(item[1]); continue; }
    if (/^\s*$/.test(ln)) continue;
    break;                                  // next key
  }
  return out;
}

const KEY = requireKey(HERE);
const release = await acquireHeavyReaderLock("measure-frontmatter-concepts");
try {
  const lessons = await getAll(KEY, "lessons?select=id,slug,language,lesson_group_id,content_md&order=id");
  const lcs = await getAll(KEY, "lesson_concepts?select=lesson_id,concept_id&order=lesson_id");
  const concepts = await getAll(KEY, "concepts?select=id,slug&order=id");
  const slugOf = new Map(concepts.map((c) => [c.id, c.slug]));

  const tableByLesson = new Map();
  for (const lc of lcs) {
    if (!tableByLesson.has(lc.lesson_id)) tableByLesson.set(lc.lesson_id, new Set());
    tableByLesson.get(lc.lesson_id).add(slugOf.get(lc.concept_id));
  }

  /* `lesson_concepts` IS KEYED ON THE ENGLISH LESSON ID. A translated row is a
   * separate `lessons` row with its own id and no `lesson_concepts` entries at
   * all, so comparing it against its OWN id compares against an empty set by
   * construction -- which reported 592 divergences, every one of them the join
   * rather than the data. The comparison is against the ENGLISH SIBLING, found
   * through `lesson_group_id`. */
  const enOfGroup = new Map();
  for (const l of lessons) if (l.language === "en" && l.lesson_group_id) enOfGroup.set(l.lesson_group_id, l);

  let withFm = 0, withoutFm = 0, agree = 0, noAnchor = 0;
  const diverge = [], noFm = [];
  for (const l of lessons) {
    const fm = frontmatterSlugs(l.content_md);
    if (fm === null) { withoutFm++; noFm.push({ slug: l.slug, lang: l.language, id: l.id }); continue; }
    withFm++;
    const anchor = l.language === "en" ? l : enOfGroup.get(l.lesson_group_id);
    if (!anchor) {
      noAnchor++;
      diverge.push({ slug: l.slug, lang: l.language, id: l.id, kind: "NO ENGLISH ANCHOR",
        only_in_frontmatter: [], only_in_table: [], frontmatter: [...new Set(fm)].sort(), table: null });
      continue;
    }
    const t = [...(tableByLesson.get(anchor.id) || new Set())].sort();
    const f = [...new Set(fm)].sort();
    if (JSON.stringify(t) === JSON.stringify(f)) { agree++; continue; }
    diverge.push({ slug: l.slug, lang: l.language, id: l.id, kind: "DIVERGES",
      only_in_frontmatter: f.filter((x) => !t.includes(x)),
      only_in_table: t.filter((x) => !f.includes(x)),
      frontmatter: f, table: t });
  }

  console.log("FRONTMATTER concept_slugs VERSUS lesson_concepts -- read-only");
  console.log("  lesson rows                    " + lessons.length);
  console.log("  WITH frontmatter               " + withFm);
  console.log("  WITHOUT frontmatter            " + withoutFm + "   <- own state, not an empty list");
  console.log("  frontmatter agrees with table  " + agree);
  console.log("  no English anchor              " + noAnchor + "   <- own state");
  console.log("  DIVERGES                       " + (diverge.length - noAnchor));
  const byLangDiv = new Map();
  for (const d of diverge) byLangDiv.set(d.lang, (byLangDiv.get(d.lang) || 0) + 1);
  console.log("      by language: " + ([...byLangDiv].map(([k, v]) => k + "=" + v).join("  ") || "none"));
  if (!withFm) console.log("  VACUOUS: no frontmatter was examined");
  console.log("");
  for (const d of diverge) {
    console.log("  " + d.slug + " " + d.lang);
    if (d.only_in_frontmatter.length) console.log("      only in frontmatter: " + d.only_in_frontmatter.join(", "));
    if (d.only_in_table.length) console.log("      only in lesson_concepts: " + d.only_in_table.join(", "));
  }
  const byLang = new Map();
  for (const n of noFm) byLang.set(n.lang, (byLang.get(n.lang) || 0) + 1);
  console.log("");
  console.log("  rows without frontmatter, by language: " +
    [...byLang].map(([k, v]) => k + "=" + v).join("  "));

  const path = join(ROOT, "FRONTMATTER-CONCEPTS.json");
  writeFileSync(path, JSON.stringify({
    lesson_rows: lessons.length, with_frontmatter: withFm, without_frontmatter: withoutFm,
    agree, diverge, without_frontmatter_by_language: Object.fromEntries(byLang),
    /* THE ENUMERATION IS THE ARTIFACT. A count of rows carrying no frontmatter
     * cannot say whether an English row is among them, and one is the difference
     * between "translations are thin" and "the source is". */
    without_frontmatter_rows: noFm.sort((a, b) => a.slug.localeCompare(b.slug) || a.lang.localeCompare(b.lang)),
  }, null, 2) + "\n", "utf8");
  console.log("");
  console.log("wrote " + path);
} finally { release(); }
