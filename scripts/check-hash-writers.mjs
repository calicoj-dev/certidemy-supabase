#!/usr/bin/env node
/**
 * check-hash-writers.mjs - only a generator may write a gate's stored hash.
 *
 * READ-ONLY. No network, no credential, no flags. Exits non-zero on an
 * unclassified writer, so it can gate a build.
 *
 * ============ THE DEFECT THIS EXISTS FOR ============
 *
 * `en_hash` records the English a translation was generated FROM. `tr_hash`
 * records the translated text as reviewed. `mcp.concept` compares both on
 * every read and withholds the row when either has moved.
 *
 * The gate is sound. Every clearance script in this repository walked around
 * it: they RECOMPUTED the hash from the row's current source and wrote it.
 * That makes every row fresh by construction -- including a row whose English
 * moved after the translation was generated -- because the value the gate is
 * about to compare against was just overwritten with the answer it wanted.
 *
 * The gate is never consulted. It is intact and blindfolded.
 *
 * ============ THE RULE, AND WHY IT IS A WRITER LIST ============
 *
 * Stamping is legitimate in exactly one place: the moment a translation is
 * generated, where the caller HOLDS the English it translated from and the
 * hash is a record of that fact. A backfill in a reviewed migration counts,
 * because it is a one-time deliberate assertion with a proof attached.
 *
 * Everywhere else the hash is READ, COMPARED, and the row REFUSED on
 * mismatch. So the check is a writer list: anything that writes and is not
 * declared here has to be classified by a human before the suite goes green.
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) { console.error("Unrecognised flag: " + a + ". READ-ONLY, no flags."); process.exit(2); }
}

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

/* ============ THE GENERATOR LIST, DECLARED IN ONE PLACE ============
 *
 * Every entry names WHY it may write. A file added here without a reason is
 * the next instance of the defect, so the reason is required by the check
 * itself -- an entry with an empty justification fails. */
const GENERATORS = {
  "stamp-proved-provenance.mjs":
    "GENERATOR-CLASS. Writes lessons.en_content_hash and nothing else, and only where it HOLDS " +
    "THE PROOF: it replays every declared English edit BACKWARD over the live body and requires " +
    "translation_hash(reversed) to equal the stored stamp, which an undeclared change anywhere in " +
    "12,000 characters would break. It additionally requires every reversed edit to fall inside a " +
    "block the batch rewrote in that language, because English that moved in an untranslated " +
    "paragraph means the translation does not track it there and the hash equality cannot see that. " +
    "A row failing either test is REFUSED and named. A positive control tampers one byte of a " +
    "replayed English in memory and the run aborts unless that is rejected. This is the second " +
    "writer the column has ever had; 367 was the first.",
  "gen-concept-translations.mjs":
    "GENERATOR. Translates from the English it has just read and stamps en_hash from that same text. " +
    "This is the only moment the hash is a record of something rather than a restatement.",
};

/* ============ DUAL ROLE -- NAMED, NOT HIDDEN ============
 *
 * A script that AUTHORS translated text and also CLEARS rows is the defect in
 * its purest form, because the authoring half supplies an excuse for the
 * clearing half to stamp. Folding one into GENERATORS would hide exactly the
 * shape that needs to stay visible, so it gets its own list and the entry has
 * to say how the two halves are kept apart.
 */
const DUAL_ROLE = {
  "apply-retranslation-review.mjs":
    "AUTHORS 19 translated edits across 14 renderings and stamps tr_hash for THOSE ROWS ONLY, " +
    "from the text it just wrote -- the one moment a hash records something rather than restating it. " +
    "It ASSERTS en_hash is unchanged rather than writing it, because an English-side hash is not its " +
    "to vouch for. Rows it did not edit are not touched.",
  "apply-own-work-drafts.mjs":
    "AUTHORS the own-work corrections (ISMS-F task 5.2 skills in three languages, the " +
    "auditor-objectivity concept in two, one item explanation in three) AND records the task " +
    "review in the same run. The halves are not separable here and that is the DIRECTOR'S " +
    "INSTRUCTION, not a shortcut: editing the English skills moves task_ksa_en_hash, so English " +
    "alone would leave explain_task serving English for es and pt until the translations landed. " +
    "It stamps ONLY rows it wrote, from the text it just wrote -- the one moment a hash records " +
    "something rather than restating it -- and the tr_hash is computed with the gate's own " +
    "formula read out of pg_proc, translation_hash(knowledge, skills, abilities). Its first run " +
    "GUESSED that formula, wrote two rows that could never match and left task 5.2 dark in both " +
    "languages; the run now ASSERTS task_ksa_is_withheld is false afterwards and exits non-zero " +
    "if not. It writes no lessons column and no gate-stored concept hash.",
  "apply-reread-clearance.mjs":
    "AUTHORS three translated rewords and CLEARS twelve rows. The halves are separated " +
    "in code: rows this run wrote are stamped from the text it wrote (provable); every " +
    "other row is READ, COMPARED and REFUSED on mismatch, and a refusal exits non-zero. " +
    "Before the split it stamped all twelve from current content, so the gate was never " +
    "consulted for the nine it had no business vouching for.",
};

/* ============ REVIEW-ROW RECORDERS ============
 *
 * `concept_translations.en_hash` is THE GATE'S STORED VALUE. Writing it is the
 * defect. `concept_translation_reviews.en_hash` is THE RECORD OF A REVIEW --
 * writing it is the entire point of writing a review row. Same column name,
 * opposite meanings, and the classifier gets the target from the nearest
 * preceding table reference, which is a 900-character heuristic.
 *
 * DECLARED RATHER THAN INFERRED, for the reason the rest of this file exists:
 * a heuristic that silently reclassifies a gate write as a record is exactly
 * the failure mode, and it would be invisible. An entry here is a claim that
 * the script writes hashes ONLY into a review table, and each one names how
 * it treats the gate's copy.
 */
const REVIEW_RECORDERS = {
  /* ============ THE ITEM ARM HAS NO GATE, AND THAT IS THE DECLARATION ============
   *
   * Every other recorder here READS the value the gate will compare against --
   * migration 374 exposes one function per arm for the lesson, task and concept
   * gates, and `lib/expected-review-hashes.mjs` is the only path to them.
   *
   * There is NO such function for items, because NOTHING READS
   * `item_translation_reviews`: the app's fetch path consults no review at all.
   * `en_hash` is nonetheless NOT NULL, so a row cannot be recorded without one.
   *
   * So this recorder computes the pair with `itemHash8` from `lib/item-hash.mjs` --
   * the same module that produced the 30 pre-existing rows -- and sets
   * `tr_hash_basis = 'assumed'`, matching them. That IS a locally computed hash, it
   * is declared here rather than hidden, and the reason it is acceptable is that
   * there is no gate whose value it could contradict. The moment an item gate
   * exists, this declaration becomes wrong and this script must switch to asking
   * it. */
  "apply-tier-c-es.mjs":
    "TIER C SPANISH FIXES, 25 field edits across 22 es-419 items, approved by the director " +
    "2026-09-26. Writes item_translation_reviews ONLY, one row per edited item, so the next " +
    "reader can tell a reviewed row from one that was never read. Computes en_hash/tr_hash with " +
    "itemHash8 because the ITEM ARM HAS NO GATE -- nothing reads this table, so there is no " +
    "expected_review_hashes_item to ask and no stored value the computation could contradict. " +
    "tr_hash_basis is 'assumed', matching the 30 pre-existing rows. Asserts no key moved, no " +
    "option reordered, and that only the declared fields changed; the review insert is made " +
    "idempotent by skipping items that already carry a row from this reviewer.",
  "apply-tier-c-pt.mjs":
    "TIER C pt-BR FIXES, the three slips that survived a read of six probe hits (#170 recourse, " +
    "#171 sistema de valor twice, #224 an inserted modal in option d only -- the stem of the same " +
    "item renders `should` correctly and is asserted untouched). Writes item_translation_reviews " +
    "ONLY. Computes en_hash/tr_hash with itemHash8 for the same reason as apply-tier-c-es.mjs: " +
    "THE ITEM ARM HAS NO GATE, so there is no expected_review_hashes_item to ask and no stored " +
    "value the computation could contradict. The review insert skips items that already carry a " +
    "row from this reviewer, so a re-run cannot duplicate.",
  "clear-ia-translations.mjs":
    "CLEARANCE. Verifies both stored hashes against current content and REFUSES the row on " +
    "mismatch; flips is_provisional only. Writes en_hash/tr_hash into concept_translation_reviews. " +
    "Carries the post-condition 'no hash was written by this run' over every row in scope.",
  "release-aimsf-translations.mjs":
    "CLEARANCE. Asserts every en_hash matches the live English and aborts otherwise -- it READS " +
    "the gate's copy and never assigns it. Writes the pair into the review row it records.",
  "record-own-work-review.mjs":
    "CLEARANCE for the own-work attribution fix. Writes lesson_translation_reviews ONLY. " +
    "Scoped by MAY_CLEAR to 05-02, whose translated bodies were read in full for batch " +
    "cda6698a: isms-ia-01-03 es/pt are fixed but NOT cleared, because a corrected sentence " +
    "is not a read of a 13,000-character lesson and its rows have never been reviewed. " +
    "Asserts the director's replacement is present and the ISO 19011 attribution is gone " +
    "before vouching for any row, and proves its md5 against a known Postgres value.",
  "record-batch1-review.mjs":
    "CLEARANCE for batch cda6698a. Writes lesson_translation_reviews ONLY and touches no lessons " +
    "column -- in particular not en_content_hash, which is why eight of its sixteen rows remain " +
    "provenance_stale afterwards and are reported rather than repaired. Both hashes are computed " +
    "with the functions the REVIEW ARM uses, which are not the same function: left(md5(en),8) for " +
    "en_hash and public.translation_hash(tr) for tr_hash. It refuses the whole batch unless every " +
    "live body still matches the bytes BATCH1-FINAL.json wrote and every english_source is still " +
    "in the live English, and it proves its md5 against a known Postgres value before writing.",
};

/* Migrations are reviewed SQL, run once, under a named number, and several
 * carry a rolled-back proof that the gate can fire. A backfill there is a
 * deliberate one-time assertion, not a caller walking around the gate. They
 * are listed rather than blanket-exempted so a new one is still visible. */
const MIGRATION_WRITERS = {
  "352_translation_side_hash.sql": "backfill, with tr_hash_basis recording measured vs assumed per row",
  "359_concept_per_row_gate.sql": "backfill of en_hash so the gate withholds 0 on first run; proves it can fire in a rolled-back block",
  "364_concept_translation_tr_hash.sql": "backfill of tr_hash at concept grain; same proof shape",
  "356_concept_clearance.sql": "writes review rows, which carry their own hash columns by design",
  "357_concept_clearance_correction.sql": "correction to 356's review rows",
  "360_retranslation_fixes_and_clearance.sql": "writes review rows",
  "358_english_concept_repair.sql": "repairs English and re-stamps the rows it repaired, in one reviewed statement",
  "362_security_control_is_not_a_glossary.sql": "repairs one English row and re-stamps it",
  "363_aimsf_concept_descriptions.sql": "lands 154 English descriptions and re-stamps them",
  "311_item_translation_reviews.sql": "creates the review table",
  "335_lesson_translation_reviews.sql": "creates the review table",
  "339_task_translation_reviews.sql": "creates the review table",
  "340_bilingual_queue_reviews.sql": "creates review rows",
  "313_canonical_item_hash.sql": "item canonical hash, a different column family",
  "367_lessons_en_content_hash.sql":
    "ADDS en_content_hash and stamps every translated lesson in one reviewed statement. " +
    "The stamp does two jobs and en_content_hash_basis says which: `proved` where the parity " +
    "check confirmed the translation tracks that English, `baseline` where it only establishes " +
    "a point from which the NEXT edit is detected. Refusing to stamp the unproved rows would " +
    "have left their provenance arm unarmed, which was the morning's defect. " +
    "AND IT IS THE ONLY WRITER THIS COLUMN HAS EVER HAD: no script stamps it, so a batch that " +
    "rewrites a translation after its English moved leaves the row provenance_stale with nothing " +
    "to clear it. That is a live gap, not a clean bill -- see INCIDENTS.md 2026-09-25.",
};

/* ============ WHAT COUNTS AS A WRITE ============
 *
 * A write is the column name in a POSITION THAT ASSIGNS: a key in a JS object
 * literal being sent as a body, or a SQL `set`/insert column list. A read --
 * `row.en_hash`, `select=en_hash`, a comparison -- is not.
 *
 * Distinguishing these is the whole job. Matching the bare column name would
 * report every reader as a writer, which is the over-reporting failure that
 * gets a guard deleted. */
/* THE COLUMN LIST IS THE CENSUS'S SCOPE, AND IT WAS TWO THIRDS OF ONE.
 *
 * `en_hash` and `tr_hash` are the REVIEW arm's hashes. `en_content_hash`, added
 * by 367 and read by the PROVENANCE arm of mcp.lesson_withholding_reason, was
 * outside the scan entirely -- so the census printed "every hash writer is
 * declared" while an entire gate's stored value had no coverage at all.
 *
 * It matters because that is the arm that surfaced on 2026-09-25: eight lesson
 * rows held by `provenance_stale` after their English moved, against a stamp
 * 367 wrote on 2026-09-23. A census that cannot see who writes a column cannot
 * answer who should have re-written it.
 *
 * Note it is not a substring of anything already here -- `en_hash` does not
 * occur inside `en_content_hash` -- so nothing was matching it by accident
 * either. The scope was simply narrower than the claim.
 *
 * `en_content_hash_basis` is NOT a hash and is deliberately absent: it records
 * WHICH JOB a stamp is doing (`proved` against `baseline`), and a CHECK
 * constraint already ties it to the hash's presence. */
const COLS = ["en_hash", "tr_hash", "en_content_hash"];

function writePositions(src, isSql) {
  const hits = [];
  for (const col of COLS) {
    if (isSql) {
      /* AN ASSIGNMENT TARGET CARRIES NO TABLE ALIAS. `set en_hash = x` writes;
       * `r.en_hash = x` compares, wherever it sits. The first version of this
       * matcher looked for `set ... en_hash =` across a whole statement and
       * reported two false positives -- 341 and 350 -- because a plpgsql body
       * opens with `set search_path = ''` and compares `r.en_hash` further
       * down with no semicolon between them. It reported a VIEW PREDICATE as a
       * write, which is the over-reporting that gets a guard deleted.
       *
       * So: the column must be bare (no `alias.`), and must be preceded by a
       * `set` or `,` with no intervening `select`/`where`/`and`/`join`. */
      const re = new RegExp("(?:^|[\\s,])(?:set\\s+|,\\s*)(?<![.\\w])" + col + "\\s*=(?!=)", "gim");
      for (const m of src.matchAll(re)) {
        const before = src.slice(Math.max(0, m.index - 200), m.index).toLowerCase();
        /* `set search_path` then a later comparison is not a set-list. A real
         * set-list has `update` upstream and no `where`/`and` between. */
        const lastUpdate = before.lastIndexOf("update ");
        const lastWhere = Math.max(before.lastIndexOf(" where "), before.lastIndexOf("\n   and "), before.lastIndexOf(" and "));
        if (lastUpdate === -1 || lastWhere > lastUpdate) continue;
        hits.push({ col, at: m.index, how: "sql-assign" });
      }
      const ins = new RegExp("insert\\s+into[^;()]*\\(([^)]*\\b" + col + "\\b[^)]*)\\)", "gis");
      for (const m of src.matchAll(ins)) hits.push({ col, at: m.index, how: "sql-insert" });
    } else {
      /* A JS object key: `en_hash:` or `"en_hash":`, but NOT `.en_hash` and
       * NOT inside a select string. */
      const re = new RegExp("(?<![.\\w])[\"']?" + col + "[\"']?\\s*:", "g");
      for (const m of src.matchAll(re)) {
        const before = src.slice(Math.max(0, m.index - 120), m.index);
        /* A key inside a `select=` literal is a read projection, not a write.
         * A key in a `.map(` building a report object is also not a write --
         * require a body/JSON.stringify/insert nearby. */
        if (/select=[^"'`]*$/.test(before)) continue;
        const ctx = src.slice(Math.max(0, m.index - 400), m.index + 200);
        const isBody = /JSON\.stringify\s*\(\s*\{|body:\s*JSON\.stringify|method:\s*["'](POST|PATCH|PUT)/i.test(ctx);
        /* ============ THE TARGET TABLE IS THE CLASSIFICATION ============
         *
         * `concept_translation_reviews.en_hash` is the RECORD OF A REVIEW: it
         * says which English a human read. Writing it is the whole point of
         * writing a review row, and a clearance that did not write it would
         * record nothing.
         *
         * `concept_translations.en_hash` is the GATE'S STORED VALUE. Writing
         * that outside a generator is the defect.
         *
         * Same column name, opposite meanings, and a classifier blind to the
         * table reports a correct recorder as a defect. That misfire happened
         * on the first run: release-aimsf-translations.mjs clears via
         * is_provisional alone and writes only review rows -- it is clean, and
         * it was reported alongside two scripts that genuinely re-stamp. */
        /* BACKWARDS ONLY. A forward window catches the NEXT statement's table:
         * release-aimsf writes review rows and then PATCHes
         * concept_translations three lines later, so a +300 window resolved the
         * review write to the content table and reported a clean recorder as a
         * defect. The target is fixed by the nearest PRECEDING reference. */
        const near = src.slice(Math.max(0, m.index - 900), m.index);
        const tbl = [...near.matchAll(/(concept_translation_reviews|concept_translations|lesson_translation_reviews|task_translation_reviews|item_translation_reviews)/g)].pop();
        const target = tbl ? tbl[1] : "unknown";
        const isReviewRow = target.endsWith("_reviews");
        hits.push({ col, at: m.index, target, how: isBody ? (isReviewRow ? "review-record" : "js-body") : "js-object" });
      }
    }
  }
  return hits;
}

/* ------------------------------------------------------------------ scan */
const files = [];
for (const f of readdirSync(HERE)) if (f.endsWith(".mjs")) files.push({ path: join(HERE, f), name: f, sql: false });
const migDir = join(ROOT, "migrations");
if (existsSync(migDir)) for (const f of readdirSync(migDir)) if (f.endsWith(".sql")) files.push({ path: join(migDir, f), name: f, sql: true });

const writers = [];
const recorders = [];
let positions = 0;
for (const f of files) {
  if (f.name === "check-hash-writers.mjs") continue;
  const src = readFileSync(f.path, "utf8");
  const hits = writePositions(src, f.sql);
  const real = hits.filter((h) => h.how !== "js-object" && h.how !== "review-record");
  positions += hits.length;
  const recs = hits.filter((h) => h.how === "review-record");
  if (real.length) writers.push({ name: f.name, sql: f.sql, positions: real.length, targets: [...new Set(real.map((h) => h.target))], hows: [...new Set(real.map((h) => h.how))] });
  else if (recs.length) recorders.push({ name: f.name, positions: recs.length, targets: [...new Set(recs.map((h) => h.target))] });
}

/* ============ POSITIVE CONTROL ============
 * A matcher that silently stopped matching would report zero writers and read
 * as a clean bill of health -- the exact failure this repository keeps
 * finding. Known sources, known verdicts, including two that must NOT count. */
const CONTROL = [
  ['await fetch(u, { method: "PATCH", body: JSON.stringify({ tr_hash: h }) });', false, 1],
  ['const rows = await rest("concept_translations?select=id,en_hash,tr_hash");', false, 0],
  ['if (row.en_hash !== live) refuse(row);', false, 0],
  ['update public.concept_translations set tr_hash = public.translation_hash(name, description);', true, 1],
  ['select ct.en_hash from public.concept_translations ct where ct.tr_hash is not null;', true, 0],
];
for (const [src, isSql, want] of CONTROL) {
  const got = writePositions(src, isSql).filter((h) => h.how !== "js-object").length;
  if (got !== want) {
    console.error("POSITIVE CONTROL FAILED on: " + src.slice(0, 64));
    console.error("  detected " + got + " write position(s), expected " + want);
    console.error("A broken matcher reports no writers, which reads as clean. Refusing.");
    process.exit(2);
  }
}
console.log("positive control: " + CONTROL.length + "/" + CONTROL.length +
            " known sources classified correctly (2 readers must NOT count)");

/* ============ AND A NEGATIVE CONTROL AGAINST THE REAL CORPUS ============
 *
 * The synthetic cases above prove the matcher fires. These two prove it does
 * NOT fire where it must not, and they use the actual files rather than a
 * hand-written imitation -- because the imitation is what a careless author
 * gets wrong, and these two are exactly what the first matcher got wrong.
 *
 * 341 defines task_ksa_en_hash; 350 defines a view predicate. Both open with
 * `set search_path = ''` and compare `r.en_hash` downstream with no semicolon
 * between, which is why a statement-wide `set ... en_hash =` search called
 * them writes. Neither writes anything. */
const MUST_NOT_FIRE = ["341_ksa_functions_security_definer.sql", "350_body_available_one_predicate.sql"];
for (const name of MUST_NOT_FIRE) {
  const fp = join(ROOT, "migrations", name);
  if (!existsSync(fp)) continue;
  const n = writePositions(readFileSync(fp, "utf8"), true).length;
  if (n !== 0) {
    console.error("NEGATIVE CONTROL FAILED: " + name + " reported " + n + " write position(s).");
    console.error("It defines a predicate and writes nothing. The matcher is over-firing again.");
    process.exit(2);
  }
}
console.log("negative control: " + MUST_NOT_FIRE.length + "/" + MUST_NOT_FIRE.length +
            " real predicate-only migrations correctly report NO write");

/* ---------------------------------------------------------------- verdict */
const scriptWriters = writers.filter((w) => !w.sql);
const migWriters = writers.filter((w) => w.sql);

console.log("");
console.log("HASH-COLUMN WRITE POSITIONS -- " + positions + " candidate(s) examined across " + files.length + " file(s)");
console.log("  script writers     " + scriptWriters.length);
console.log("  migration writers  " + migWriters.length);

const undeclaredScripts = scriptWriters.filter((w) =>
  !GENERATORS[w.name] && !DUAL_ROLE[w.name] && !REVIEW_RECORDERS[w.name]);

/* A RECORDER MUST BE DECLARED TOO, AND UNTIL NOW IT DID NOT HAVE TO BE.
 *
 * A file whose hash writes ALL target a `*_reviews` table lands in `recorders`
 * rather than `writers`, and the undeclared check only ever looked at `writers`.
 * So a new script writing review hashes passed the census silently -- found when
 * `record-own-work-review.mjs` appeared in the output, was not in
 * REVIEW_RECORDERS, and the run still printed PASS.
 *
 * This file's own header says these are DECLARED RATHER THAN INFERRED, because a
 * heuristic that quietly reclassifies a gate write as a record is the failure
 * mode. The heuristic was doing exactly that for a whole class. */
const undeclaredRecorders = recorders.filter((w) => !REVIEW_RECORDERS[w.name]);

/* ============ A LOCAL HASH FORMULA IS A FINDING ============
 *
 * Migration 374 exposes each gate's own hash expressions, so a writer asks
 * instead of reimplementing. Anything still computing a review or gate hash in
 * JavaScript has a second implementation of somebody else's rule, and this
 * repository has watched that go wrong twice in one day: a lesson clearance
 * recomputed en_hash with translation_hash where the arm uses
 * left(md5(content_md), 8) and reported 41 of 41 rows stale; the own-work apply
 * hashed four newline-joined fields where the task gate hashes three arguments,
 * and ISMS-F task 5.2 went dark in both languages for 44 seconds.
 *
 * Both formulas AGREED with the gate on the day they were written. Agreement is
 * not the property that matters -- having one implementation is.
 *
 * HARD for a declared writer, ADVISORY for anything else, because a script that
 * merely compares a hash it computed is a weaker version of the same hazard and
 * the first person inconvenienced by a hard failure there would delete the rule.
 */
const HASH_COLS = /\b(en_hash|tr_hash|en_content_hash)\b/;
const localFormula = [];
for (const f of files) {
  if (f.sql) continue;
  let src;
  try { src = readFileSync(f.path, "utf8"); } catch { continue; }
  /* Strip block comments: every switched script explains the formula it removed,
   * and a rule that fires on the note describing the defect it prevents is the
   * migration-290 shape. */
  const code = src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
  if (!/createHash\s*\(\s*["']md5["']/.test(code)) continue;
  if (!HASH_COLS.test(code)) continue;
  const declared = !!(GENERATORS[f.name] || DUAL_ROLE[f.name] || REVIEW_RECORDERS[f.name]);
  localFormula.push({ file: f.name, name: f.name, declared });
}
const localFormulaHard = localFormula.filter((x) => x.declared);
if (localFormula.length) {
  console.log("");
  console.log("LOCAL HASH FORMULAS -- ask the 374 helper instead:");
  for (const x of localFormula) {
    console.log("  " + (x.declared ? "FINDING " : "advisory") + "  " + x.file);
  }
} else {
  console.log("");
  console.log("no script computes a review or gate hash locally; every writer asks the 374 helpers");
}
const undeclaredMigs = migWriters.filter((w) => !MIGRATION_WRITERS[w.name]);

console.log("");
console.log("DECLARED GENERATORS (may write):");
for (const [n, why] of Object.entries(GENERATORS)) {
  if (!why || !why.trim()) { console.error("  " + n + " has no justification. Every entry must say why."); process.exit(1); }
  const present = scriptWriters.find((w) => w.name === n);
  console.log("  " + (present ? "writes  " : "NO WRITE") + "  " + n);
  console.log("      " + why);
  if (!present) {
    console.log("      ^ declared but writes nothing today. Not an error -- but if it never");
    console.log("        writes again the declaration should go, or it protects nothing.");
  }
}

console.log("");
console.log("DUAL ROLE (authors text AND clears -- must keep the halves apart):");
for (const [n, why] of Object.entries(DUAL_ROLE)) {
  if (!why || !why.trim()) { console.error("  " + n + " has no justification."); process.exit(1); }
  console.log("  " + n);
  console.log("      " + why);
}

if (recorders.length) {
  console.log("");
  console.log("REVIEW-ROW RECORDERS (write a *_reviews hash -- legitimate, this is the record):");
  for (const r of recorders) console.log("  " + r.name.padEnd(42) + r.positions + " position(s)  " + r.targets.join(","));
}

if (undeclaredRecorders.length) {
  console.log("");
  console.log("UNDECLARED REVIEW-ROW RECORDERS:");
  for (const w of undeclaredRecorders) {
    console.log("  " + w.name.padEnd(42) + w.positions + " position(s)  " + w.targets.join(","));
  }
}
if (undeclaredScripts.length) {
  console.log("");
  console.log("UNDECLARED SCRIPT WRITERS -- classify each before this passes:");
  for (const w of undeclaredScripts) console.log("  " + w.name.padEnd(42) + w.positions + " position(s)  " + w.hows.join(","));
}

if (undeclaredMigs.length) {
  console.log("");
  console.log("UNDECLARED MIGRATION WRITERS:");
  for (const w of undeclaredMigs) console.log("  " + w.name.padEnd(42) + w.positions + " position(s)");
}

writeFileSync(join(ROOT, "HASH-WRITER-CENSUS.json"), JSON.stringify({
  measured: new Date().toISOString().slice(0, 10),
  positions_examined: positions,
  generators: GENERATORS,
  dual_role: DUAL_ROLE,
  review_recorders: REVIEW_RECORDERS,
  migration_writers: MIGRATION_WRITERS,
  script_writers: scriptWriters,
  migration_writers_found: migWriters,
  undeclared_scripts: undeclaredScripts,
  undeclared_recorders: undeclaredRecorders,
  /* Keep the DECLARED flag: a flat name list loses the only thing that separates
   * a finding from an advisory, and that is the whole discriminator here. */
  local_hash_formulas: localFormula.map((w) => ({ file: w.name, declared: w.declared })),
  undeclared_migrations: undeclaredMigs.map((w) => w.name),
}, null, 2), "utf8");

console.log("");
console.log("wrote HASH-WRITER-CENSUS.json");
if (positions === 0) {
  console.error("VACUOUS: zero write positions examined. The matcher is wrong, not the corpus.");
  process.exit(2);
}
if (undeclaredScripts.length || undeclaredMigs.length || undeclaredRecorders.length || localFormulaHard.length) {
  console.error("");
  console.error("FAIL: " + (undeclaredScripts.length + undeclaredMigs.length + undeclaredRecorders.length) +
    " undeclared hash writer(s), " + localFormulaHard.length + " declared writer(s) with a local hash formula.");
  console.error("A hash is written only by something that can PROVE the value -- a generator");
  console.error("holding the source it translated from. Any other caller must READ, COMPARE");
  console.error("and REFUSE the row on mismatch.");
  process.exit(1);
}
console.log("PASS: every hash writer is declared. " + positions + " position(s) examined.");
