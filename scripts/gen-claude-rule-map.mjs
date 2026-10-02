/**
 * gen-claude-rule-map.mjs -- the completeness check for the 2026-10-01 CLAUDE.md split.
 *
 * READ-ONLY except for the one artifact it writes. Unknown flags exit 2.
 *
 * WHAT IT ANSWERS, and the limit is stated because a map that overclaims is worse than none:
 * it enumerates EVERY rule paragraph in a history file and gives each one a destination. The
 * destination is assigned PER SOURCE SECTION from a declared table, not per paragraph -- so the
 * map proves NOTHING WAS DROPPED FROM A SECTION, and does not prove each individual paragraph
 * has a corresponding line in the new file. That second claim would need 1,559 human judgements
 * and it is not made here.
 *
 * The honest reading of a row: "this paragraph's rule lives in CLAUDE.md <dest>, or is an
 * instance/narrative supporting a rule that does."
 *
 * Per CLAUDE.md: a count is READ before it is reported, so the artifact carries the enumeration
 * and the counts are commentary on it. And every extraction asserts it was non-empty, because a
 * regex that matches nothing turns the whole script green.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..");
const WEB = resolve(REPO, "..", "certidemy-web");

for (const a of process.argv.slice(2)) {
  if (a !== "--apply") {
    console.error(`unknown flag ${a}\n  --apply writes docs/CLAUDE-RULE-MAP.md in both repos; dry by default.`);
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");

/* ---------------------------------------------------------------- destinations

   Declared per history section. "history only" means the section is a record of a
   failure whose rule is either superseded or carried as a single line elsewhere;
   the reason is required, so a dropped section cannot pass as mapped. */

const SUPABASE_DEST = {
  "# Certidemy — supabase":                                        ["CLAUDE.md §1 Layout", ""],
  "## Migrations":                                                 ["CLAUDE.md §4", "the migration-TIP history is superseded: the number is gone and check-migration-state answers it"],
  "## Database rules that were paid for":                          ["CLAUDE.md §5", "the 8 paging rules are in docs/CLAUDE-METHOD.md § Reads that feed a number"],
  "## Edge functions":                                             ["CLAUDE.md §6", "5 probing rules are in docs/CLAUDE-METHOD.md § Probing a live surface"],
  "## Credential identity — immovable":                            ["CLAUDE.md §7", ""],
  "## Email":                                                      ["CLAUDE.md §8", ""],
  "## Partner onboarding":                                         ["CLAUDE.md §9", ""],
  "## Issuing":                                                    ["CLAUDE.md §10", ""],
  "## Generated items: practice, not a readiness signal":           ["CLAUDE.md §12", ""],
  "## The claims discipline":                                      ["CLAUDE.md §11", ""],
  "## Scripts":                                                    ["CLAUDE.md §15", "method rules within it are in docs/CLAUDE-METHOD.md"],
  "## Reading a bank versus sweeping it":                          ["docs/CLAUDE-METHOD.md", "measurement and instrument discipline; CLAUDE.md §16 carries the four that bite most"],
  "## The source library, and what building it cost":              ["CLAUDE.md §14 + docs/CLAUDE-METHOD.md § Source extraction", "23 extractor rules moved; 3 facts kept inline"],
  "## The grounded generator, and the gates that decide":          ["CLAUDE.md §13", ""],
  "## The declared population, and six clauses no gap check could see": ["CLAUDE.md §14 + METHOD § Source extraction", ""],
  "## The gates that decide, and the ones that were wrong about correct items": ["CLAUDE.md §13", ""],
  "## Anchor or flag: the instrument that catches a wrong key":    ["CLAUDE.md §13", ""],
  "## Working style":                                              ["CLAUDE.md §17 + docs/CLAUDE-METHOD.md § Claims and corrections", ""],
  "## YOU RUN EVERY BUILD. JUAN ONLY PUSHES AND DEPLOYS.":         ["CLAUDE.md §2 + §3", ""],
};

const WEB_DEST = {
  "# Certidemy — web":                                             ["CLAUDE.md header", ""],
  "## Hard rules":                                                 ["CLAUDE.md §2", ""],
  "## i18n — the active work":                                     ["CLAUDE.md §4", ""],
  "## The claims discipline — this outranks the code":             ["CLAUDE.md §5", ""],
  "## Console access":                                             ["CLAUDE.md §6", ""],
  "## Auth":                                                       ["CLAUDE.md §3 row 17 + §6", "HISTORY ONLY in detail: the verifyOtp/PKCE rule and the two-landings trap are summarised, full text in history"],
  "## Known issues outside the i18n waves":                        ["CLAUDE.md §3 (table, one row each) + §7", ""],
  "## Working style":                                              ["CLAUDE.md §9", ""],
  "## Verify, in order":                                           ["CLAUDE.md §8", ""],
  "## YOU RUN EVERY BUILD. JUAN ONLY PUSHES AND DEPLOYS.":         ["CLAUDE.md §1", ""],
};

/* ------------------------------------------------------------------ extraction */

function leadOf(line) {
  const m = line.match(/^\*\*(.+?)\*\*/);
  if (m) return m[1].replace(/\s+/g, " ").trim();
  return line.replace(/^[-*>|#\s]+/, "").replace(/\s+/g, " ").trim();
}

function enumerate(path, destTable, label) {
  const text = readFileSync(path, "utf8");
  const lines = text.split(/\r?\n/);
  const rows = [];
  let section = null;
  let prevBlank = true;
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^#{1,2} /.test(line)) section = line.trim();
    /* THE UNIT IS THE PARAGRAPH, NOT A LEAD SHAPE, and that took three tries.
       v1 counted bold-lead paragraphs and reported `## Email` and `## The claims discipline` with
       ZERO rules; both carry real rules. v2 added top-level bullets and still reported the claims
       section empty -- it is pure prose with mid-sentence bold. Keying on a SHAPE means every
       shape nobody thought of is invisible, which is this file's own lexical-proxy defect.
       A paragraph start cannot miss a shape. The control is what caught both. */
    if (!inFence) {
      const isBullet = /^[-*] /.test(line);
      const isParaStart = prevBlank && line.trim() !== "" && !/^#{1,6} /.test(line) && !/^\|/.test(line) && !/^```/.test(line);
      if (isBullet || isParaStart) {
        rows.push({ line: i + 1, section, kind: isBullet ? "bullet" : "para", lead: leadOf(line).slice(0, 150) });
      }
    }
    if (/^```/.test(line)) inFence = !inFence;
    prevBlank = line.trim() === "";
  }

  // POSITIVE CONTROL: the extraction must be non-empty, and every section it found
  // must have a declared destination. A section with no entry is a coverage gap that
  // would otherwise report clean.
  if (rows.length === 0) {
    console.error(`EXTRACTION EMPTY for ${label} -- the paragraph pattern matched nothing. Refusing to write.`);
    process.exit(2);
  }
  const seen = [...new Set(rows.map((r) => r.section))];
  const undeclared = seen.filter((s) => !(s in destTable));
  if (undeclared.length) {
    console.error(`UNDECLARED SECTIONS in ${label} -- add a destination for each, or the map overclaims:`);
    for (const s of undeclared) console.error(`  ${s}`);
    process.exit(2);
  }
  // And the reverse: a declared destination with no paragraphs means the table is stale.
  const empty = Object.keys(destTable).filter((s) => !seen.includes(s));
  if (empty.length) {
    console.error(`DECLARED BUT NOT FOUND in ${label} (stale destination table):`);
    for (const s of empty) console.error(`  ${s}`);
    process.exit(2);
  }
  return rows;
}

function render(label, historyPath, rows, destTable) {
  const bySection = new Map();
  for (const r of rows) {
    if (!bySection.has(r.section)) bySection.set(r.section, []);
    bySection.get(r.section).push(r);
  }

  const out = [];
  out.push(`# CLAUDE.md rule map — ${label}`);
  out.push("");
  out.push(`**Generated by \`scripts/gen-claude-rule-map.mjs\` on the 2026-10-01 split.** ${rows.length} rule`);
  out.push(`paragraphs enumerated from \`${historyPath}\`, every one with a destination.`);
  out.push("");
  out.push("> **WHAT THIS PROVES, AND WHAT IT DOES NOT.** Destinations are assigned **per source section**");
  out.push("> from a declared table, not per paragraph. So this map proves **no section was dropped**, and");
  out.push("> it does **not** prove that each individual paragraph has its own line in the new file — that");
  out.push(`> would need ${rows.length} human judgements and the claim is not made here. Read a row as: *this`);
  out.push("> paragraph's rule lives at the destination, or is an instance supporting a rule that does.*");
  out.push(">");
  out.push("> The generator asserts its own extraction was non-empty, that every section it found has a");
  out.push("> declared destination, and that every declared destination was actually found — so a stale");
  out.push("> table or a regex that stops matching exits 2 rather than reporting clean.");
  out.push("");
  out.push("## Section summary");
  out.push("");
  out.push("| history section | paragraphs | destination | note |");
  out.push("|---|---|---|---|");
  for (const [section, rs] of bySection) {
    const [dest, note] = destTable[section];
    out.push(`| ${section.replace(/^#+ /, "")} | ${rs.length} | ${dest} | ${note || "—"} |`);
  }
  out.push("");
  out.push("## Every rule paragraph");
  out.push("");
  for (const [section, rs] of bySection) {
    const [dest] = destTable[section];
    out.push(`### ${section.replace(/^#+ /, "")} → ${dest}`);
    out.push("");
    out.push(`${rs.length} paragraphs.`);
    out.push("");
    for (const r of rs) out.push(`- \`L${r.line}\` ${r.lead}`);
    out.push("");
  }
  return out.join("\n") + "\n";
}

const sRows = enumerate(resolve(REPO, "docs/CLAUDE-HISTORY.md"), SUPABASE_DEST, "supabase");
const wRows = enumerate(resolve(WEB, "docs/CLAUDE-HISTORY.md"), WEB_DEST, "web");

console.log(`supabase: ${sRows.length} rule paragraphs across ${new Set(sRows.map((r) => r.section)).size} sections`);
console.log(`web:      ${wRows.length} rule paragraphs across ${new Set(wRows.map((r) => r.section)).size} sections`);

const sDoc = render("supabase", "docs/CLAUDE-HISTORY.md", sRows, SUPABASE_DEST);
const wDoc = render("certidemy-web", "docs/CLAUDE-HISTORY.md", wRows, WEB_DEST);

if (!APPLY) {
  console.log(`\nDRY RUN -- nothing written. Would write:`);
  console.log(`  ${resolve(REPO, "docs/CLAUDE-RULE-MAP.md")}  (${sDoc.length} chars)`);
  console.log(`  ${resolve(WEB, "docs/CLAUDE-RULE-MAP.md")}  (${wDoc.length} chars)`);
  process.exitCode = 0;
} else {
  writeFileSync(resolve(REPO, "docs/CLAUDE-RULE-MAP.md"), sDoc, "utf8");
  writeFileSync(resolve(WEB, "docs/CLAUDE-RULE-MAP.md"), wDoc, "utf8");
  // read back rather than trusting the write returned without error
  const sBack = readFileSync(resolve(REPO, "docs/CLAUDE-RULE-MAP.md"), "utf8");
  const wBack = readFileSync(resolve(WEB, "docs/CLAUDE-RULE-MAP.md"), "utf8");
  const sN = (sBack.match(/^- `L\d+`/gm) || []).length;
  const wN = (wBack.match(/^- `L\d+`/gm) || []).length;
  if (sN !== sRows.length || wN !== wRows.length) {
    console.error(`READ-BACK FAILED: wrote ${sRows.length}/${wRows.length}, file has ${sN}/${wN}`);
    process.exitCode = 2;
  } else {
    console.log(`\nWRITTEN. read back ${sN} supabase rows, ${wN} web rows.`);
  }
}
