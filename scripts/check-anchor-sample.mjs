/**
 * check-anchor-sample.mjs -- PROMPT-55 section 5: did the audit-sentence
 * rewrite's anchors land?
 *
 * READ-ONLY, no writes. Unknown flags exit 2.
 *
 * Two lessons, two different questions:
 *
 *   aims-ia-01-01-who-commissioned-it   ONE declared edit with `expect: 2` --
 *       the sentence appears twice, both times inside a checkpoint explanation,
 *       so the misattribution was taught as the answer twice in one lesson. Did
 *       BOTH targets land?
 *
 *   isms-ia-01-01-audit-parties         TWO declared edits, prose and checkpoint
 *       explanation, both replacing `ISO 19011:2026` with `ISO/IEC 27000:2018`.
 *       Verdict wanted: landed, differ, or never landed?
 *
 * Three states per target, because "not found" conflates two facts: the `to` is
 * present (LANDED), the `from` is still present (NEVER LANDED), or neither is
 * (DIFFER -- something else rewrote it and the record does not say what).
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY, takes none");
  process.exitCode = 2; process.exit();
}

const TARGETS = [
  { slug: "aims-ia-01-01-who-commissioned-it", expect: 2, where: "both in checkpoint explanations",
    from: "ISO 19011:2026 states that an internal audit is conducted by the organization itself or by an external party on its behalf.",
    to: "ISO/IEC 42001 carries the same allowance in its note on audit: the work can be done in-house or handed to an outside party engaged to carry it out." },
  { slug: "isms-ia-01-01-audit-parties", expect: 1, where: "prose",
    from: "ISO 19011:2026 notes that an internal audit is conducted by the organization itself **or by an external party on its behalf**.",
    to: "ISO/IEC 27000:2018 defines audit, and a note there allows an internal audit to be run in-house or handed to an outside party engaged to carry it out." },
  { slug: "isms-ia-01-01-audit-parties", expect: 1, where: "checkpoint explanation",
    from: "ISO 19011:2026 states that an internal audit is conducted by the organization itself or by an external party on its behalf.",
    to: "ISO/IEC 27000:2018 defines audit, and a note there allows an internal audit to be run in-house or handed to an outside party engaged to carry it out." },
];

/* The SHARED TAIL of every `to` in this family. If the tail is present but the
 * head is not, the rewrite's WORDING landed and its ATTRIBUTION did not -- which
 * is a different fact from "nothing happened" and is the whole finding. */
const TAIL = "allows an internal audit to be run in-house or handed to an outside party engaged to carry it out";

const KEY = requireKey(HERE);
const slugs = [...new Set(TARGETS.map((t) => t.slug))];
const rows = await getAll(KEY,
  "lessons?select=slug,language,content_md,updated_at&language=eq.en&slug=in.(" + slugs.join(",") + ")&order=slug");
const mdBy = new Map(rows.map((r) => [r.slug, r]));

const count = (h, n) => { let c = 0, i = 0; for (;;) { i = h.indexOf(n, i); if (i < 0) break; c++; i += n.length; } return c; };

console.log("ANCHOR SAMPLE -- did the audit-sentence rewrite land?  read-only");
console.log("");
for (const t of TARGETS) {
  const row = mdBy.get(t.slug);
  if (!row) { console.log("  COULD-NOT-ANSWER  " + t.slug + " -- no live English row"); continue; }
  const md = String(row.content_md || "");
  const nTo = count(md, t.to), nFrom = count(md, t.from), nTail = count(md, TAIL);
  let verdict;
  if (nTo >= t.expect) verdict = "LANDED";
  else if (nFrom > 0) verdict = "NEVER LANDED";
  else if (nTail > 0) verdict = "DIFFER (wording landed, attribution did not)";
  else verdict = "DIFFER (neither anchor present)";
  console.log("  " + verdict);
  console.log("      " + t.slug + "  (" + t.where + ", expect " + t.expect + ")");
  console.log("      `to` occurrences   " + nTo);
  console.log("      `from` occurrences " + nFrom);
  console.log("      shared tail        " + nTail);
  console.log("      updated_at         " + row.updated_at);
  if (verdict.startsWith("DIFFER") && nTail > 0) {
    const i = md.indexOf(TAIL);
    console.log("      what is there now:");
    console.log("          ..." + md.slice(Math.max(0, i - 130), i + 40).replace(/\s+/g, " "));
  }
  console.log("");
}
console.log("  19011 mentions / 27000 mentions / 42001 mentions, per lesson:");
for (const s of slugs) {
  const md = String((mdBy.get(s) || {}).content_md || "");
  console.log("      " + s.padEnd(36) + "19011=" + count(md, "19011") +
    "  27000=" + count(md, "27000") + "  42001=" + count(md, "42001"));
}
