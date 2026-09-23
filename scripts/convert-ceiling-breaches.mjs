#!/usr/bin/env node
/**
 * convert-ceiling-breaches.mjs -- bring the ten over-ceiling attributed
 * quotations under 25 words.
 *
 * WRITES. `--apply`; DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ A CONVERSION IS NOT A TRUNCATION ============
 *
 * A 52-word quotation cut to 25 by deleting its tail is worse teaching than a
 * 20-word quotation plus our own sentence saying what the clause requires. The
 * whole point of the ceiling is that we EXPLAIN rather than DELIVER.
 *
 * So each edit keeps the phrase where the WORDING is the examinable thing --
 * `some degree of verification`, `wherever practicable` -- as a short marked
 * quotation, and moves the rest into our voice, where the sentence carries the
 * distinction a candidate is actually tested on.
 *
 * ============ AND IT MUST NOT BECOME A PARAPHRASE WEARING A QUOTE ==========
 *
 * CLAUDE.md records the failure mode directly: a lesson quotes the clause, the
 * quote reproduces ISO, the repair paraphrases the quote to avoid reproduction,
 * and the result LOOKS like a quotation, is not one, and is wrong in exactly
 * the details a quotation exists to preserve.
 *
 * Two honest shapes, and every edit below is one of them:
 *   - accurately quoted, marked as a quotation, under the ceiling; or
 *   - our own explanation, not wearing the clause's voice.
 *
 * Nothing here paraphrases text that stays inside a blockquote.
 *
 * ============ NORMATIVE PRESERVATION IS ASSERTED, NOT HOPED ============
 *
 * A repair written under pressure to differ from ISO's words is exactly the
 * pressure that moves meaning. Every edit declares the modal, conjunction and
 * defined terms it must preserve, and the post-conditions check them.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSources, norm, assertCanary, SEED } from "./lib/leak-score.mjs";
import { isAttributed, isQuoteLine, QUOTATION_CEILING } from "./lib/iso-segments.mjs";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". DRY BY DEFAULT; --apply to write."); process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };

/* Each edit finds ONE line by a unique fragment and replaces it entirely.
 * `keep` lists tokens that must survive -- modal, conjunction, defined term --
 * because a repair that removes reproduction can quietly alter what the clause
 * requires, and nothing else checks for it. */
const EDITS = [
  {
    slug: "isms-ia-03-02-what-the-sample-supports",
    find: "Audit evidence should be verifiable. It should be based on",
    replace:
      "> Audit evidence **should be verifiable**.\n" +
      "\n" +
      "The rest of the evidence-based approach principle explains why sampling is " +
      "inherent to auditing rather than a shortcut taken under pressure. An audit " +
      "runs for a fixed period with limited resources, so what the team examines is " +
      "necessarily a **sample** of what exists - and how well that sampling is done " +
      "governs how much weight the conclusions can bear.",
    keep: ["should", "sample", "verifiable"],
  },
  {
    slug: "isms-ia-05-03-the-statement-that-survives",
    find: "Fair presentation is the obligation to report truthfully and accurately.",
    replace:
      "> Fair presentation is the obligation to **report truthfully and accurately**.\n" +
      "\n" +
      "The principle then names two things a report **should** carry that most " +
      "statements quietly leave out: obstacles that materially got in the way of the " +
      "audit, and disagreements between the team and the auditee that were never " +
      "settled.",
    keep: ["should", "truthfully", "accurately"],
  },
  {
    slug: "isms-ia-03-01-degree-of-verification",
    find: "Only information that can be subject to **some degree of verification**",
    replace:
      "> Only information that can be subject to **some degree of verification** " +
      "should be accepted as audit evidence.\n" +
      "\n" +
      "Clause 6.4.7 then does something a threshold test would not. Where that degree " +
      "is low, it does not tell the auditor to discard the information: it hands them " +
      "a judgement about how much reliance the information can carry, and expects that " +
      "judgement to be professional rather than arbitrary.",
    keep: ["should", "some degree of verification", "audit evidence"],
  },
  {
    slug: "isms-ia-04-05-competence-awareness-documents",
    find: "Documented information **of external origin**, determined by the organization",
    replace:
      "Clause 7.5.3 extends document control to material the organization did not " +
      "write. Anything **of external origin** that it has determined it needs in order " +
      "to plan or operate the ISMS **shall** be **identified as appropriate, and " +
      "controlled** - on the same terms as anything authored inside.",
    keep: ["shall", "of external origin", "controlled"],
  },
  {
    slug: "isms-ia-01-03-objectivity-of-the-assignment",
    find: "Auditors should be independent of the activity being audited **wherever practicable**",
    replace:
      "> Auditors **should be independent** of the activity being audited **wherever " +
      "practicable**.\n" +
      "\n" +
      "The sentence carries a second obligation with no such qualifier attached: in " +
      "all cases the auditor is to act without bias and without any conflict of " +
      "interest. Independence is conditioned on what is practicable. Impartiality is " +
      "not.",
    keep: ["should", "wherever practicable", "bias"],
  },
  {
    slug: "isms-ia-01-03-objectivity-of-the-assignment",
    find: "When it is not possible for internal auditors to be independent",
    replace:
      "Where an internal auditor cannot be independent of what they are auditing, " +
      "ISO 19011:2026 does not forbid the assignment. It requires that **every effort " +
      "should be made to remove bias and encourage objectivity**.",
    keep: ["should", "bias", "objectivity"],
  },
  {
    slug: "isms-ia-04-03-the-whole-of-clause-6",
    find: "**NOTE 2** &nbsp; Annex A contains a list of possible information security controls",
    replace:
      "> **NOTE 2** &nbsp; Annex A contains a list of **possible** information security " +
      "controls.\n" +
      "\n" +
      "The note goes on to direct users to Annex A as a completeness check - a way of " +
      "confirming that nothing necessary was missed, rather than a menu to select " +
      "from.",
    keep: ["possible", "annex a"],
  },
  {
    slug: "isms-ia-04-03-the-whole-of-clause-6",
    find: "**Planning of changes.** When the organization determines the need for changes",
    replace:
      "**Planning of changes.** Where the organization decides its ISMS has to change, " +
      "clause 6.3 requires in a single sentence that **the changes shall be carried " +
      "out in a planned manner**.",
    keep: ["shall", "planned manner"],
  },
  {
    slug: "isms-ia-05-05-fixing-it-and-fixing-it",
    find: "b) evaluate the need for action to eliminate the cause(s) of the nonconformity",
    replace:
      "> b) **evaluate the need for action to eliminate the cause(s)** of the " +
      "nonconformity, so that it is not repeated elsewhere, by:\n" +
      "\n" +
      "The clause names three steps inside that evaluation: reviewing what happened, " +
      "determining what caused it, and asking whether anything similar already exists " +
      "or could arise somewhere else.",
    keep: ["evaluate the need for action", "cause"],
  },
  {
    slug: "isms-ia-04-01-what-the-scope-left-out",
    find: "The organization shall determine the boundaries and applicability of the information security management system to establish its scope.",
    replace:
      "> The organization **shall determine the boundaries and applicability** of the " +
      "ISMS to establish its scope.\n" +
      "\n" +
      "Clause 4.3 then names three inputs the organization is required to consider " +
      "when it does so:",
    keep: ["shall", "boundaries and applicability", "scope"],
  },
];

const sources = buildSources();
assertCanary(sources);

function longest(text) {
  const w = norm(text).split(" ").filter(Boolean);
  let best = 0, bestText = "", bestSrc = "";
  for (const [key, src] of sources) {
    for (let i = 0; i + SEED <= w.length; i++) {
      const cands = src.at.get(w.slice(i, i + SEED).join(" "));
      if (!cands) continue;
      let n = 0;
      for (const p of cands) {
        let k = 0;
        while (i + k < w.length && src.words[p + k] === w[i + k]) k++;
        if (k > n) n = k;
      }
      if (n > best) { best = n; bestText = w.slice(i, i + n).join(" "); bestSrc = key; }
    }
  }
  return { best, bestText, bestSrc };
}

/** The worst attributed-over-ceiling span in a body, the way the gate sees it. */
function worstBreach(md) {
  const lines = String(md || "").split(/\r?\n/);
  let leadIn = "", worst = 0, worstText = "";
  for (const raw of lines) {
    const t = raw.trim();
    if (!t) continue;
    const quote = isQuoteLine(raw);
    const body = quote ? raw.replace(/^\s*>\s?/, "") : raw;
    const r = longest(body);
    if (r.best > worst && isAttributed(raw, leadIn)) { worst = r.best; worstText = r.bestText; }
    if (!quote) leadIn = t;
  }
  return { worst, worstText };
}

const slugs = [...new Set(EDITS.map((e) => e.slug))];
const rows = await (await fetch(
  BASE + "/lessons?select=id,slug,content_md&language=eq.en&slug=in.(" + slugs.join(",") + ")",
  { headers: H })).json();
const bySlug = new Map(rows.map((r) => [r.slug, r]));
if (bySlug.size !== slugs.length) {
  console.error("expected " + slugs.length + " lessons, got " + bySlug.size); process.exit(1);
}

/* ---- DRAFT SCORE, before anything is read or written ---- */
console.log("");
console.log("DRAFT SCORE -- ceiling " + QUOTATION_CEILING + "w");
let bad = 0;
const staged = new Map();
for (const e of EDITS) {
  const row = bySlug.get(e.slug);
  const cur = staged.get(e.slug) ?? row.content_md;
  const lines = cur.split(/\r?\n/);
  const hit = lines.filter((l) => l.includes(e.find));
  if (hit.length !== 1) {
    console.log("  MISS   " + e.slug + "  -- " + hit.length + " lines match the anchor");
    bad++; continue;
  }
  const idx = lines.findIndex((l) => l.includes(e.find));
  const before = longest(lines[idx].replace(/^\s*>\s?/, ""));
  const out = lines.slice();
  out.splice(idx, 1, ...e.replace.split("\n"));
  staged.set(e.slug, out.join("\n"));

  /* Score every line the replacement introduces, because a run in OUR new
   * sentence is exactly the failure this batch exists to avoid. */
  let worstNew = 0, worstNewText = "";
  for (const nl of e.replace.split("\n")) {
    const r = longest(nl.replace(/^\s*>\s?/, ""));
    if (r.best > worstNew) { worstNew = r.best; worstNewText = r.bestText; }
  }
  const ok = worstNew <= QUOTATION_CEILING;
  if (!ok) bad++;
  console.log("  " + (ok ? "ok   " : "FAIL ") + String(before.best).padStart(3) + "w -> " +
    String(worstNew).padStart(3) + "w   " + e.slug.slice(0, 44));
  if (!ok) console.log("         " + worstNewText.slice(0, 130));
}

/* ---- the normative tokens each edit promised to keep ---- */
console.log("");
console.log("NORMATIVE PRESERVATION");
for (const e of EDITS) {
  const missing = e.keep.filter((k) => !norm(e.replace).includes(norm(k)));
  if (missing.length) { console.log("  FAIL  " + e.slug + "  dropped: " + missing.join(", ")); bad++; }
}
if (!EDITS.some((e) => e.keep.some((k) => !norm(e.replace).includes(norm(k))))) {
  console.log("  ok    every declared modal, conjunction and defined term survives");
}

console.log("");
console.log("WHOLE-BODY VERDICT after all edits for each lesson");
for (const slug of slugs) {
  const w = worstBreach(staged.get(slug) ?? bySlug.get(slug).content_md);
  const was = worstBreach(bySlug.get(slug).content_md);
  const ok = w.worst <= QUOTATION_CEILING;
  if (!ok) bad++;
  console.log("  " + (ok ? "ok   " : "FAIL ") + String(was.worst).padStart(3) + "w -> " +
    String(w.worst).padStart(3) + "w   " + slug);
  if (!ok) console.log("         still: " + w.worstText.slice(0, 120));
}

if (bad) { console.log(""); console.log("ABORT: " + bad + " problem(s). Nothing written."); process.exit(1); }
if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

/* ---- A LESSON IS A UNIT OF APPLICATION: all its edits land in one write ---- */
console.log("");
console.log("APPLYING, one write per lesson");
let fail = 0;
for (const slug of slugs) {
  const row = bySlug.get(slug);
  const body = staged.get(slug);
  const r = await fetch(BASE + "/lessons?id=eq." + row.id, {
    method: "PATCH", headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ content_md: body }),
  });
  if (!r.ok) { console.log("  FAIL  " + slug + "  HTTP " + r.status); fail++; continue; }
  const after = (await r.json())[0];
  const w = worstBreach(after.content_md);
  const ok = after.content_md === body && w.worst <= QUOTATION_CEILING;
  console.log("  " + (ok ? "PASS  " : "FAIL  ") + slug + "   worst now " + w.worst + "w");
  if (!ok) fail++;
}
console.log("");
console.log("  The edit trigger has nulled mcp_scanned_at on every row touched, so these");
console.log("  lessons are WITHHELD until scan-iso-leaks runs again. That is fail-closed");
console.log("  and correct, and it is silent -- run the scanner next.");
process.exit(fail ? 1 : 0);
