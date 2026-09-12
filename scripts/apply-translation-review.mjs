#!/usr/bin/env node
/**
 * apply-translation-review.mjs - read a marked-up review document and clear
 * is_provisional for the rows a human approved. Nothing else.
 *
 * --apply TO WRITE. Dry by default. Unknown flags exit 2.
 *
 *   CERT_ID=... node scripts/apply-translation-review.mjs --in jta/<CODE>_TRANSLATION-REVIEW.md [--apply]
 *
 * BUILT ONLY AFTER THE DOCUMENT HAD BEEN USED ONCE. gen-translation-review-doc.mjs
 * shipped without this on purpose: a parser written against a format nobody has marked up
 * is a guess about how people mark things up. The first real review came back 27 approved
 * and 1 rejected, and this parser is written against that file rather than against an
 * imagined one.
 *
 * WHAT IT REFUSES, AND WHY EACH REFUSAL IS THE WHOLE FILE
 * -------------------------------------------------------
 * A partial application is the worst outcome here, because the flag it writes is a claim
 * that a human read something. Every failure below aborts before any write.
 *
 *   A [!] ROW WITH AN EMPTY NOTE. That is an error state, not a rejection - the document
 *   says so in its own instructions. "Not reviewed" and "reviewed and rejected" need
 *   different handling, and a rejection with no reason gives the next person nothing to
 *   act on. One such row refuses the file.
 *
 *   A HASH THAT NO LONGER MATCHES. Each row carries en#xxxxxxxx over the English that was
 *   reviewed. If the statement has been edited since, the tick is attached to text that no
 *   longer exists and approving it would record a review that did not happen. Stale rows
 *   are named and the file is refused.
 *
 *   A ROW THAT RESOLVES TO NO DATABASE ROW, or to more than one. A document out of step
 *   with the schema must not half-apply.
 *
 * THE THIRD STATE WAS BUILT. Migration 295, 2026-09-11. The proposal below is kept as
 * written because it is the argument that earned the column, and because the decision
 * turned on something other than what it predicted. It said to run tier 3 and then
 * decide whether "rejected" stays RARE. It did stay rare - 1 of 28, then 3 of 70, 4.1%
 * across both rounds - AND THAT WAS NOT THE DECIDING FACT.
 *
 * What decided it: the state PERSISTS. 5.7 es-419 was rejected in round one, repaired
 * within the hour, and was still provisional after round two. By then all four of
 * SM-AI-II's provisional rows were re-translations awaiting a re-read and NOT ONE was
 * unreviewed, so the check's own detail line - "the English moved, or they were never
 * reviewed" - was false for every row it was failing on.
 *
 * And rarity argued FOR the column, not against it: a failure reading 71 of 98 gets
 * worked, a failure reading 4 of 98 reads as nearly done and gets deferred, and those
 * four were the highest-risk rows in the set.
 *
 * REJECTED IS STICKY. A re-translation does not clear it; only a human approval does.
 * "Worst thing known about this row until cleared."
 *
 * THE ORIGINAL PROPOSAL, PRESERVED:
 *
 * THE COLUMN IS ONE BOOLEAN CARRYING THREE MEANINGS - A PROPOSAL, DELIBERATELY NOT BUILT
 * ------------------------------------------------------------------------------------
 * After round one, verify-cert's i18n.approved cannot distinguish three states it needs
 * to, and two of them are opposite situations reported identically:
 *
 *   nobody has read anything                          -> FAIL today, and correctly
 *   the highest-consequence rows read, rest marked    -> FAIL today, and WRONGLY
 *   a reviewer REJECTED a row and it is unfixed       -> FAIL today, and correctly
 *   everything read                                   -> PASS
 *
 * Rows two and three are the problem. One is a certification doing the work in priority
 * order with its state honestly recorded; the other is a KNOWN WRONG TRANSLATION STILL
 * BEING SERVED - 5.7 es-419 told Spanish candidates the task was about performance until
 * it was caught. A check that answers "we are 28% through, correctly" and "we have not
 * started" identically removes the incentive to start.
 *
 * THE FIX IS NOT TO SOFTEN THE CHECK TO WARN, because row three must fail. It is that
 * is_provisional cannot express it: one boolean, three meanings, and the check can only
 * be as expressive as the column.
 *
 * WHAT WOULD EARN IT: a review_status of unreviewed | approved | rejected alongside the
 * boolean, and a check that reads
 *
 *     any rejected                     -> FAIL, naming them
 *     none rejected, some unreviewed   -> WARN with the fraction, "27 of 98 reviewed"
 *     all approved                     -> PASS
 *
 * HELD ON PURPOSE UNTIL A SECOND ROUND. One round is not evidence. The question that
 * decides whether "rejected" earns a column is whether it stays RARE - one rejection in
 * 28 rows may be the steady rate or may be the first of many, and hardening schema around
 * a single observation is how a threshold gets set from three banks. Run tier 3, then
 * decide.
 *
 * IT NEVER SETS is_provisional BACK TO TRUE. A [!] or [ ] row is left exactly as it is.
 * Rejection is handled by re-translating and re-reviewing, not by this script, and an
 * unreviewed row is already provisional.
 *
 * [CORRECTED 2026-09-11 BY MIGRATION 295 - the paragraph above no longer describes this
 * script.] A [!] row is NO LONGER left exactly as it is: it now records
 * review_status = 'rejected' and is_provisional = true. A [ ] row is still untouched.
 * The reason the old behaviour was wrong is the whole argument above - leaving a
 * rejection unrecorded is what made "nobody read it" and "a human said it is wrong"
 * indistinguishable. Re-translating is still not this script's job.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const KNOWN = new Set(["--apply", "--in"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error(`Unrecognised flag: ${a}. --apply to write; dry by default.`); process.exit(2); }
}
const APPLY = process.argv.includes("--apply");
const ii = process.argv.indexOf("--in");
const IN = ii >= 0 ? process.argv[ii + 1] : null;
if (!IN || !existsSync(IN)) { console.error("Pass --in <marked-up review document>."); process.exit(2); }

for (const p of ["scripts/.env", ".env"]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const CERT_ID = process.env.CERT_ID;
if (!CERT_ID) { console.error("Set CERT_ID."); process.exit(2); }
const db = createClient(process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const h8 = (s) => createHash("sha256").update(s ?? "", "utf8").digest("hex").slice(0, 8);

// --- parse -----------------------------------------------------------------
const lines = readFileSync(IN, "utf8").split(/\r?\n/);
let kind = null, key = null, hash = null;
const parsed = [];
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.startsWith("## Tier 1")) { kind = "domain"; continue; }
  if (l.startsWith("## Tier 2") || l.startsWith("## Tier 3")) { kind = "task"; continue; }
  if (l.startsWith("## ")) { kind = null; continue; }
  const h = l.match(/^### (\S+)/);
  if (h) { key = h[1]; hash = null; continue; }
  const hm = l.match(/^ {4}en#([0-9a-f]{8})\s*$/);
  if (hm) { hash = hm[1]; continue; }
  const rm = l.match(/^ {4}\[([ x!])\] (\S+)\s+(.*)$/);
  if (!rm || !kind || !key) continue;
  // the NOTE belongs to this row; it is the next NOTE: before the next row
  let note = "";
  for (let j = i + 1; j < lines.length; j++) {
    if (/^ {4}\[/.test(lines[j]) || /^### /.test(lines[j]) || /^## /.test(lines[j])) break;
    const nm = lines[j].match(/^\s*NOTE:\s*(.*)$/);
    if (nm) { note = nm[1].trim(); break; }
  }
  parsed.push({ kind, key, mark: rm[1], lang: rm[2], text: rm[3], note, hash, line: i + 1 });
}

const approved = parsed.filter((r) => r.mark === "x");
const rejected = parsed.filter((r) => r.mark === "!");
const unreviewed = parsed.filter((r) => r.mark === " ");
console.log(`${IN}`);
console.log(`  parsed ${parsed.length} rows: ${approved.length} approved, ${rejected.length} rejected, ${unreviewed.length} unreviewed\n`);

let fatal = 0;

// REFUSAL 1 - a rejection with no reason.
for (const r of rejected) {
  if (!r.note) { console.error(`  REFUSE line ${r.line}: ${r.key} ${r.lang} is [!] with an empty NOTE - that is an error, not a rejection`); fatal++; }
}

// --- resolve against the database ------------------------------------------
const { data: domains } = await db.from("domains").select("id, code, title").eq("certification_id", CERT_ID);
const { data: tasks } = await db.from("tasks").select("id, code, statement").eq("certification_id", CERT_ID);
const domByCode = new Map((domains || []).map((d) => [d.code, d]));
const taskByCode = new Map((tasks || []).map((t) => [t.code, t]));

// SINCE MIGRATION 295 THIS SCRIPT WRITES BOTH MARKS, not just the ticks. A [!]
// row now records review_status = 'rejected' rather than being left alone, which
// is what lets verify-cert tell "nobody read this" from "somebody read it and
// said it is wrong". The refusals below therefore apply to rejections too: a
// rejection recorded against English that has since moved is as wrong as an
// approval recorded against it.
const targets = [];
for (const r of [...approved, ...rejected]) {
  const src = r.kind === "domain" ? domByCode.get(r.key) : taskByCode.get(r.key);
  if (!src) { console.error(`  REFUSE line ${r.line}: ${r.kind} ${r.key} resolves to no row`); fatal++; continue; }
  const english = r.kind === "domain" ? src.title : src.statement;
  // REFUSAL 2 - the English moved after the review.
  if (r.hash && h8(english) !== r.hash) {
    console.error(`  REFUSE line ${r.line}: ${r.key} ${r.lang} reviewed en#${r.hash}, current English is en#${h8(english)} - STALE`);
    fatal++; continue;
  }
  if (!r.hash) { console.error(`  REFUSE line ${r.line}: ${r.key} ${r.lang} carries no hash`); fatal++; continue; }
  targets.push({ ...r, srcId: src.id, status: r.mark === "x" ? "approved" : "rejected" });
}

if (fatal) { console.error(`\n${fatal} refusal(s). NOTHING WRITTEN - the whole file is refused, because a partial application would record a review that did not happen.`); process.exit(1); }

// --- report, then write ----------------------------------------------------
for (const r of rejected) console.log(`  [!] ${r.key.padEnd(6)} ${r.lang.padEnd(7)} REJECTED, stays provisional — ${r.note.slice(0, 80)}`);
for (const r of unreviewed) console.log(`  [ ] ${r.key.padEnd(6)} ${r.lang.padEnd(7)} left unreviewed — nobody marked it`);
const nApp = targets.filter((t) => t.status === "approved").length;
const nRej = targets.filter((t) => t.status === "rejected").length;
console.log(`\n${APPLY ? "writing" : "[dry] would write"} review_status on ${targets.length} row(s): ${nApp} approved, ${nRej} rejected`);

if (APPLY) {
  let wrote = 0;
  for (const t of targets) {
    const table = t.kind === "domain" ? "domain_translations" : "task_translations";
    const col = t.kind === "domain" ? "domain_id" : "task_id";
    // THE TWO COLUMNS ARE KEPT IN STEP HERE, not left to the reader: approved
    // means not provisional, rejected means provisional. Migration 295's
    // post-condition asserts that agreement across every row in both tables.
    const patch = t.status === "approved"
      ? { is_provisional: false, review_status: "approved" }
      : { is_provisional: true, review_status: "rejected" };
    const { error, count } = await db.from(table).update(patch, { count: "exact" })
      .eq(col, t.srcId).eq("language", t.lang);
    if (error) { console.error(`  write failed ${t.key} ${t.lang}: ${error.message}`); process.exit(1); }
    if (count !== 1) { console.error(`  ${t.key} ${t.lang}: updated ${count} rows, expected 1`); process.exit(1); }
    wrote++;
  }
  console.log(`  cleared ${wrote}`);
}
