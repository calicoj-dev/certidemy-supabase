/**
 * patch-gen-jta-ksa-scope.mjs
 *
 * Adds ONLY=ksa to gen-jta-translations.mjs: translates knowledge / skills /
 * abilities into task_translations, without touching statements.
 *
 * ============================================================================
 * UPDATE ONLY, NEVER UPSERT - THIS IS THE WHOLE DESIGN
 * ============================================================================
 *
 * The tasks pass upserts on (task_id, language). A K/S/A payload cannot reuse
 * that: it omits `statement`, so on a row that does not exist yet the upsert
 * would INSERT with a null statement - creating a half-row that looks like a
 * translation and is not.
 *
 * So the K/S/A pass UPDATEs existing rows and reports tasks that have no
 * statement row yet. Same rule, same reason, as save-exam-answer: an upsert
 * rebuilds the defect one layer down.
 *
 * ============================================================================
 * WHY ksa_is_provisional AND NOT is_provisional
 * ============================================================================
 *
 * Migration 165. Writing `is_provisional: true` here would mark 302 already-
 * reviewed task statements unreviewed across two languages, and every generated
 * document would silently fall back to English for them.
 *
 * That is not hypothetical - it happened to domain titles on 2026-07-29 when the
 * descriptions were re-translated, and it took a while to diagnose because
 * nothing broke; the system was being careful about the wrong thing.
 *
 * The payload below names exactly five columns and never `statement` or
 * `is_provisional`. Keep it that way.
 *
 * ============================================================================
 * THREE FIELDS, ADDRESSED SEPARATELY
 * ============================================================================
 *
 * Each task contributes up to three items to the batch, keyed `<id>::k|s|a`, so a
 * model that drops one field does not take the other two with it. A field that
 * comes back missing is written null rather than silently keeping a stale value.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:DRY_RUN="1"; node scripts\patch-gen-jta-ksa-scope.mjs
 *   Remove-Item Env:\DRY_RUN; node scripts\patch-gen-jta-ksa-scope.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SRC =
  "C:/Users/Juan/Documents/certidemy/supabase/scripts/gen-jta-translations.mjs";
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

/* ---- 1. accept the new scope ----------------------------------------- */

const A1_FROM = 'if (!["all", "domains", "tasks"].includes(ONLY)) {';
const A1_TO = 'if (!["all", "domains", "tasks", "ksa"].includes(ONLY)) {';

const A2_FROM =
  '  console.error(`ONLY must be one of: all | domains | tasks (got "${ONLY}")`);';
const A2_TO =
  '  console.error(`ONLY must be one of: all | domains | tasks | ksa (got "${ONLY}")`);';

/* ---- 2. the flag ------------------------------------------------------ */

const A3_FROM = 'const DO_TASKS = ONLY === "all" || ONLY === "tasks";';
const A3_TO = [
  'const DO_TASKS = ONLY === "all" || ONLY === "tasks";',
  "// NOT part of ONLY=all. K/S/A is a separate pass over the same rows, and",
  "// folding it into the default would make every routine run rewrite fields it",
  "// was not asked to touch.",
  'const DO_KSA = ONLY === "ksa";',
].join("\n");

/* ---- 3. read the source fields --------------------------------------- */

const A4_FROM = '.from("tasks").select("id, statement")';
const A4_TO = '.from("tasks").select("id, code, statement, knowledge, skills, abilities")';

/* ---- 4. the pass itself ----------------------------------------------- */

const A5_FROM = [
  '    console.log("");',
  "  }",
  "",
  "  if (!DRY_RUN && DO_DOMAINS) {",
].join("\n");

const KSA_BLOCK = `    // ---- Tasks (knowledge / skills / abilities) ----
    //
    // UPDATE ONLY, never upsert - see the header. A payload omitting \`statement\`
    // would INSERT a null statement on any row that does not exist yet.
    if (!DO_KSA) {
      if (ONLY !== "all") console.log(\`  ksa: skipped (ONLY=\${ONLY})\`);
    } else {
      // Which rows already carry a K/S/A block for this language. Read here
      // rather than reusing haveTask, which only knows about statements.
      const { data: ksaHave } = await supabase
        .from("task_translations")
        .select("task_id")
        .eq("language", lang.code)
        .not("knowledge", "is", null);
      const haveKsa = new Set((ksaHave ?? []).map((r) => \`\${r.task_id}|\${lang.code}\`));

      const ksaTodo = tasks.filter(
        (t) =>
          (t.knowledge || t.skills || t.abilities) &&
          (FORCE || !haveKsa.has(\`\${t.id}|\${lang.code}\`)),
      );

      if (ksaTodo.length === 0) {
        console.log("  ksa: nothing to do");
      } else {
        let wrote = 0;
        let missingRow = 0;
        let failed = 0;

        for (const part of chunk(ksaTodo, CHUNK)) {
          // Three items per task, keyed separately so a dropped field does not
          // take the other two with it.
          const items = [];
          for (const t of part) {
            if (t.knowledge) items.push({ id: \`\${t.id}::k\`, text: t.knowledge });
            if (t.skills) items.push({ id: \`\${t.id}::s\`, text: t.skills });
            if (t.abilities) items.push({ id: \`\${t.id}::a\`, text: t.abilities });
          }
          const map = await translateBatch(lang.name, items);

          for (const t of part) {
            // No statement row means no row to update. Reported, not created.
            if (!haveTask.has(\`\${t.id}|\${lang.code}\`)) {
              missingRow += 1;
              continue;
            }

            // Exactly five columns. Never statement, never is_provisional.
            const patch = { ksa_is_provisional: true, updated_at: now() };
            if (t.knowledge) patch.knowledge = map.get(\`\${t.id}::k\`) ?? null;
            if (t.skills) patch.skills = map.get(\`\${t.id}::s\`) ?? null;
            if (t.abilities) patch.abilities = map.get(\`\${t.id}::a\`) ?? null;

            if (DRY_RUN) {
              console.log(\`  [dry] \${t.code ?? t.id}  K: \${patch.knowledge ?? "-"}\`);
              console.log(\`        \${" ".repeat((t.code ?? "").length)}  S: \${patch.skills ?? "-"}\`);
              console.log(\`        \${" ".repeat((t.code ?? "").length)}  A: \${patch.abilities ?? "-"}\`);
              wrote += 1;
              continue;
            }

            const { error } = await supabase
              .from("task_translations")
              .update(patch)
              .eq("task_id", t.id)
              .eq("language", lang.code);
            if (error) {
              console.log(\`  ! ksa update failed (\${t.code ?? t.id}): \${error.message}\`);
              failed += 1;
              continue;
            }
            wrote += 1;
          }
        }

        console.log(\`  ksa: \${DRY_RUN ? "would write" : "wrote"} \${wrote}\`);
        if (missingRow > 0) {
          console.log(
            \`  ksa: \${missingRow} task(s) have no \${lang.code} statement row - \` +
            \`run ONLY=tasks for this cert first, then re-run ksa\`,
          );
        }
        if (failed > 0) console.log(\`  ksa: \${failed} update(s) failed\`);
      }
    }

`;

const A5_TO = KSA_BLOCK + A5_FROM;

/* ---- 5. the closing note ---------------------------------------------- */

const A6_FROM = "  if (!DRY_RUN && DO_DOMAINS) {";
const A6_TO = [
  "  if (!DRY_RUN && DO_KSA) {",
  "    console.log(",
  '      "K/S/A rows are ksa_is_provisional=true. Renderers must OMIT the whole\\n" +',
  '      "K/S/A block for that language until a review flips the flag - a sheet\\n" +',
  '      "mixing translated statements with English knowledge is worse than one\\n" +',
  '      "with no knowledge section at all.\\n\\n" +',
  '      "Statements and their is_provisional flag were NOT touched by this run."',
  "    );",
  "  }",
  "",
  "  if (!DRY_RUN && DO_DOMAINS) {",
].join("\n");

const EDITS = [
  ["accept ONLY=ksa", A1_FROM, A1_TO],
  ["error message", A2_FROM, A2_TO],
  ["DO_KSA flag", A3_FROM, A3_TO],
  ["read knowledge/skills/abilities", A4_FROM, A4_TO],
  ["the ksa pass", A5_FROM, A5_TO],
];

if (!existsSync(SRC)) {
  console.error("gen-jta-translations.mjs not found at " + SRC);
  process.exit(1);
}

let text = readFileSync(SRC, "utf8");
const before = text.length;
const isCRLF = text.includes("\r\n");
const nl = (s) => (isCRLF ? s.replace(/\n/g, "\r\n") : s);

console.log("gen-jta-translations ksa scope " + (DRY_RUN ? "[DRY RUN]" : "[LIVE]"));
console.log("  line endings detected: " + (isCRLF ? "CRLF" : "LF") + "\n");

if (text.includes("DO_KSA")) {
  console.log("  already patched - 'DO_KSA' is present. Nothing to do.");
  process.exit(0);
}

let bad = 0;
for (const [label, from] of EDITS) {
  const hits = text.split(nl(from)).length - 1;
  if (hits === 1) {
    console.log("  ok   " + label);
  } else {
    console.log("  FAIL " + label + ": found " + hits + " times, expected 1");
    console.log(
      from
        .split("\n")
        .slice(0, 4)
        .map((l) => "         |" + l.replace(/^ +/, (m) => ".".repeat(m.length)))
        .join("\n"),
    );
    bad += 1;
  }
}
if (bad > 0) {
  console.log("\n" + bad + " anchor(s) did not match. NOTHING written.");
  process.exit(1);
}

for (const [, from, to] of EDITS) {
  text = text.replace(nl(from), nl(to));
}
// The closing note is applied last: its anchor is inside A5's replacement.
text = text.replace(nl(A6_FROM), nl(A6_TO));

/* The payload must never name statement or is_provisional. */
const ksaStart = text.indexOf("const patch = { ksa_is_provisional");
const ksaEnd = text.indexOf(".eq(\"language\", lang.code);", ksaStart);
const ksaSlice = ksaStart === -1 ? "" : text.slice(ksaStart, ksaEnd);
if (/patch\.statement|is_provisional:\s*true,\s*updated_at.*statement/.test(ksaSlice)) {
  console.log("\nFAIL: the ksa payload references statement. Nothing written.");
  process.exit(1);
}

console.log("\nbytes " + before + " -> " + text.length);
console.log("ksa payload does not touch statement: ok");

if (DRY_RUN) {
  console.log("\nDRY RUN - nothing written. All anchors matched.");
} else {
  writeFileSync(SRC, text, { encoding: "utf8" });
  console.log("\nwritten.");
  console.log("");
  console.log("Dry run one cert before any live run:");
  console.log('  $env:CERT_ID="<uuid>"; $env:ONLY="ksa"; $env:DRY_RUN="1"');
  console.log("  node scripts\\gen-jta-translations.mjs");
}
