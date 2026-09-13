#!/usr/bin/env node
/**
 * gen-item-translation-review.mjs - one readable document for the es-419 and
 * pt-BR siblings of rewritten QUIZ ITEMS, so a bilingual reviewer marks up prose
 * instead of reading 28 database rows.
 *
 * READ-ONLY. Writes a markdown file and touches no table.
 *
 *   node scripts/gen-item-translation-review.mjs [--spec <file>] [--also <uuid,uuid>] [--out <path>]
 *
 * WHY THIS IS NOT gen-translation-review-doc.mjs. That one reads
 * task_translations and domain_translations - one short statement per row. An
 * item is four or five fields that only mean anything together: a distractor is
 * wrong RELATIVE to a key, and an explanation is about options a reviewer
 * cannot see unless they are on the same page. So the unit here is the GROUP,
 * and every field of it is printed.
 *
 * SECURE FIRST, AND THAT IS THE ONLY ORDERING. A practice item is a study aid;
 * a secure item is what a candidate sits. If a reviewer stops halfway the right
 * half has been read.
 *
 * ------------------------------------------------------------------------
 * THESE ARE NOT ORDINARY TRANSLATIONS AND THE DOCUMENT SAYS SO ON EVERY ROW.
 *
 * Every group here is a REPAIR OF A FALSE ATTRIBUTION. The English was changed
 * because it asserted something a standard does not say, and the repair turns on
 * a distinction the original collapsed:
 *
 *   - "the clause does not enumerate"  - it requires the organization to
 *     DETERMINE issues; it supplies no categories. A translation that renders
 *     this as "the clause lists the relevant issues" has restored the defect.
 *   - "normative STATUS is not requirement MODALITY" - Annex B is normative AND
 *     written in should. A translation that flattens either half, or makes the
 *     two read as the same property, has lost the whole item.
 *   - "9.3.2 CONSIDERS changes rather than requiring currency" - the management
 *     review considers changes in issues; no clause imposes a standing process
 *     or a cadence. A translation that upgrades "considers" to "requires" or
 *     inserts a periodicity has put back the ISO 9001 import that was removed.
 *
 * A FLUENT TRANSLATION THAT SOFTENS ANY OF THESE IS A DEFECT EVEN THOUGH IT
 * READS CORRECTLY, and that is the opposite of what a reader's eye does
 * unprompted. So each group carries a WHAT THIS MUST CARRY line, taken from the
 * rewrite spec's own reason field, and the reviewer is asked to check that
 * before checking the language.
 * ------------------------------------------------------------------------
 *
 * THE HASH IS ON THE ENGLISH, as in the module document. en#xxxxxxxx is the
 * first 8 hex of a sha256 over the English stem, options and explanation
 * together. If the English moves after review, a regenerated document shows a
 * different hash and the approval is STALE rather than carried forward.
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const KNOWN = new Set(["--spec", "--also", "--out"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error(`Unrecognised flag: ${a}. This script is READ-ONLY and takes no --apply.`);
    process.exit(2);
  }
}
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };

const SPEC = resolve(arg("spec", join(ROOT, "rewrites", "prose-defects.json")));
const ALSO = (arg("also", "") || "").split(",").map((s) => s.trim()).filter(Boolean);
const OUT = resolve(arg("out", join(ROOT, `ITEM-TRANSLATION-REVIEW-${new Date().toISOString().slice(0, 10)}.md`)));

const reasons = new Map();
if (existsSync(SPEC)) {
  for (const e of JSON.parse(readFileSync(SPEC, "utf8"))) reasons.set(e.group, e.reason || "");
}
const groups = [...new Set([...reasons.keys(), ...ALSO])];
if (!groups.length) { console.error("No groups. Pass --spec and/or --also."); process.exit(2); }

const db = createClient(
  process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const { data: rows, error } = await db.from("quiz_questions")
  .select("id, question_group_id, language, pool, item_origin, question_text, options, correct_answer, explanation, certification_id, task_id")
  .in("question_group_id", groups).is("retired_at", null);
if (error) { console.error(`READ FAILED: ${error.message}`); process.exit(1); }
if (!rows?.length) { console.error("No live rows for those groups."); process.exit(1); }

const { data: certs } = await db.from("certifications").select("id, code");
const certCode = new Map((certs || []).map((c) => [c.id, c.code]));
const { data: tasks } = await db.from("tasks").select("id, code");
const taskCode = new Map((tasks || []).map((t) => [t.id, t.code]));

const h8 = (s) => createHash("sha256").update(s ?? "", "utf8").digest("hex").slice(0, 8);
const byGroup = new Map();
for (const r of rows) {
  if (!byGroup.has(r.question_group_id)) byGroup.set(r.question_group_id, {});
  byGroup.get(r.question_group_id)[r.language] = r;
}

// SECURE FIRST. Then certification, then task, so a reviewer reads a bank at a
// time rather than hopping between two standards.
const ordered = [...byGroup.entries()]
  .filter(([, g]) => g.en)
  .sort((a, b) => {
    const A = a[1].en, B = b[1].en;
    if ((A.pool === "secure") !== (B.pool === "secure")) return A.pool === "secure" ? -1 : 1;
    const ca = certCode.get(A.certification_id) || "", cb = certCode.get(B.certification_id) || "";
    if (ca !== cb) return ca < cb ? -1 : 1;
    return (taskCode.get(A.task_id) || "").localeCompare(taskCode.get(B.task_id) || "");
  });

const out = [];
const p = (s = "") => out.push(s);
const optLines = (r) => {
  const key = [].concat(r.correct_answer || []);
  return (Array.isArray(r.options) ? r.options : [])
    .map((o) => `  ${key.includes(o.id) ? "**KEY**" : "     "} ${o.id}) ${o.text}`).join("\n");
};

p("# Item translation review");
p("");
p(`**Generated:** ${new Date().toISOString().slice(0, 10)}. Regenerate and re-check the hashes if the English has moved.`);
p("");
p("**Marks:** put `[y]` beside a language line you accept, `[r]` beside one you reject, and write why on the line below. A row with no mark is unread, which is different from accepted.");
p("");
p("---");
p("");
p("## Read for the distinction, not for the fluency");
p("");
p("Every group below is a **repair of a false attribution**. The English was changed because it asserted something a standard does not say, and each repair turns on a distinction the original collapsed. The three that recur:");
p("");
p("- **\"the clause does not enumerate\"** — it requires the organization to *determine* issues and supplies no categories. A translation rendering this as *\"the clause lists the relevant issues\"* has restored the defect.");
p("- **\"normative STATUS is not requirement MODALITY\"** — Annex B is normative *and* written in *should*. Flattening either half, or making the two read as one property, loses the item.");
p("- **\"9.3.2 *considers* changes rather than requiring currency\"** — no clause imposes a standing process or a cadence. Upgrading *considers* to *requires*, or inserting a periodicity, puts back the ISO 9001 import that was removed.");
p("");
p("**A fluent translation that softens any of these is a defect even though it reads correctly.** That is the opposite of what the eye does unprompted, so each group carries a **What this must carry** line. Check that first, then the language.");
p("");
p("---");
p("");

let n = 0, secure = 0;
for (const [grp, g] of ordered) {
  const en = g.en;
  n++;
  if (en.pool === "secure") secure++;
  const hash = h8([en.question_text, JSON.stringify(en.options), en.explanation].join(""));
  const cc = certCode.get(en.certification_id) || "?";
  const tc = taskCode.get(en.task_id) || "?";
  p(`## ${n}. ${cc} ${tc} — **${en.pool.toUpperCase()}** — \`${grp.slice(0, 8)}\` — \`en#${hash}\``);
  p("");
  const why = reasons.get(grp);
  if (why) {
    p(`> **What this must carry.** ${why.replace(/\s+/g, " ").trim()}`);
    p("");
  } else {
    p("> **What this must carry.** Not from the rewrite spec — this group was generated rather than repaired. Read it as an ordinary translation, against the English above.");
    p("");
  }
  p("### English");
  p("");
  p(`**Stem.** ${en.question_text}`);
  p("");
  p("```");
  p(optLines(en));
  p("```");
  p("");
  p(`**Explanation.** ${en.explanation || "_(none)_"}`);
  p("");
  for (const lang of ["es-419", "pt-BR"]) {
    const r = g[lang];
    p(`### ${lang}  \`[ ]\``);
    p("");
    if (!r) { p("_MISSING — this group has no row in this language. That is a dropped sibling, not a translation to review._"); p(""); continue; }
    p(`**Stem.** ${r.question_text}`);
    p("");
    p("```");
    p(optLines(r));
    p("```");
    p("");
    p(`**Explanation.** ${r.explanation || "_(none)_"}`);
    p("");
  }
  p("---");
  p("");
}

p(`**${n} groups, ${secure} secure. ${n * 2} translated rows to read.**`);
p("");
p("A group whose two language lines are both unmarked has not been reviewed. `item_origin='translated'` records how the row was produced, never that anyone read it — there is no column in `quiz_questions` that does, so this document is the only evidence.");

writeFileSync(OUT, out.join("\n"), "utf8");
console.log(`Wrote ${OUT}`);
console.log(`${n} groups (${secure} secure, ${n - secure} practice), ${n * 2} translated rows.`);
console.log("READ-ONLY: no table was touched.");
