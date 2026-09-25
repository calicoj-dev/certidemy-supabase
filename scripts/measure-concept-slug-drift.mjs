/**
 * measure-concept-slug-drift.mjs -- where does a translated checkpoint block
 * carry different MACHINE fields from its English?
 *
 * READ-ONLY. Unknown flags exit 2.
 *
 * `concept_slugs`, `correct`, `type`, `bloom_level` and `difficulty` are not
 * translated. A regeneration that moves one has changed WHAT THE QUESTION TESTS,
 * and no prose gate would ever report it. Fields pair by ID, never by ordinal.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { acquireHeavyReaderLock } from "./lib/heavy-reader-lock.mjs";
import { parseCheckpoint, checkpointMachine } from "./lib/checkpoint-fields.mjs";
/** The `::checkpoint` blocks of a body, in order, cut from the RAW text.
 *
 *  NOT `blocksOf()`: that helper STRIPS THE DIRECTIVE LINE, so no block it
 *  returns ever begins with `::checkpoint` and a filter on that prefix matches
 *  nothing. The first version of this script did exactly that and reported
 *  VACUOUS -- which is the third-state rule earning its keep, because the same
 *  run would otherwise have printed "0 findings" over 958 lesson pairs and been
 *  believed.
 *
 *  Bodies are CRLF, so every boundary here tolerates an optional carriage
 *  return rather than assuming LF. */
function checkpointBlocks(md) {
  const src = String(md || "");
  const out = [];
  const re = /^::checkpoint\b/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    const rest = src.slice(m.index);
    /* The block ends at a line that is exactly `::`. */
    const close = /\n::\s*(\r?\n|$)/.exec(rest);
    out.push(close ? rest.slice(0, close.index) : rest);
  }
  return out;
}

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY, takes none");
  process.exitCode = 2; process.exit();
}

const KEY = requireKey(HERE);
const release = await acquireHeavyReaderLock("measure-concept-slug-drift");
try {
  /* Lessons are one ROW PER LANGUAGE, siblings joined by `lesson_group_id`.
   * There is no lesson_translations table -- a wrong guess here returns a 404
   * rather than a wrong answer, which is the good kind of failure. */
  const lessons = await getAll(KEY, "lessons?select=id,slug,language,lesson_group_id,content_md&order=id");
  const enBy = new Map();
  for (const l of lessons) if (l.language === "en" && l.lesson_group_id) enBy.set(l.lesson_group_id, l);
  const trs = lessons.filter((l) => l.language !== "en" && l.lesson_group_id);

  const findings = [];
  let pairs = 0, unparsable = 0, blocksCompared = 0;

  for (const t of trs) {
    const en = enBy.get(t.lesson_group_id);
    if (!en) {
      findings.push({ slug: t.slug, lang: t.language, kind: "NO ENGLISH SIBLING",
        detail: "lesson_group_id " + t.lesson_group_id + " has no English row" });
      continue;
    }
    pairs++;
    const ebs = checkpointBlocks(en.content_md);
    const tbs = checkpointBlocks(t.content_md);
    if (ebs.length !== tbs.length) {
      findings.push({ slug: en.slug, lang: t.language, kind: "BLOCK COUNT",
        detail: "english has " + ebs.length + " checkpoint block(s), translation has " + tbs.length });
      continue;
    }
    for (let bi = 0; bi < ebs.length; bi++) {
      /* A block that does not parse returns null, so "no fields changed" is never
       * available as an answer about a block nobody could read. */
      const em = checkpointMachine(ebs[bi]), tm = checkpointMachine(tbs[bi]);
      if (em === null || tm === null) {
        unparsable++;
        findings.push({ slug: en.slug, lang: t.language, kind: "UNPARSABLE",
          detail: "block " + bi + " did not parse on " +
            [em === null ? "english" : null, tm === null ? "translation" : null].filter(Boolean).join(" and ") });
        continue;
      }
      const keys = [...new Set([...em.keys(), ...tm.keys()])].sort();
      for (const k of keys) {
        blocksCompared++;
        const a = em.get(k), b = tm.get(k);
        if (a === undefined || b === undefined) {
          findings.push({ slug: en.slug, lang: t.language, kind: "UNPAIRED",
            detail: "block " + bi + " " + k + " exists only in the " + (a === undefined ? "translation" : "english") });
          continue;
        }
        if (a === b) continue;
        findings.push({ slug: en.slug, lang: t.language, kind: "MACHINE-FIELD DRIFT",
          detail: "block " + bi + " " + k + ": english " + a + " vs translation " + b,
          block: bi, key: k, english: a, translation: b });
      }
    }
  }

  console.log("CHECKPOINT MACHINE-FIELD DRIFT -- read-only");
  console.log("  english/translation lesson pairs   " + pairs);
  console.log("  machine field groups compared      " + blocksCompared);
  console.log("  UNPARSABLE checkpoint blocks       " + unparsable + "   <- own state");
  console.log("  findings                           " + findings.length);
  if (!blocksCompared) console.log("  VACUOUS: nothing was compared");
  console.log("");
  for (const f of findings) console.log("  " + f.kind + "  " + f.slug + " " + f.lang + "\n      " + f.detail);

  const path = join(ROOT, "CONCEPT-SLUG-DRIFT.json");
  writeFileSync(path, JSON.stringify({ pairs, blocksCompared, unparsable, findings }, null, 2) + "\n", "utf8");
  console.log("");
  console.log("wrote " + path);
} finally { release(); }
