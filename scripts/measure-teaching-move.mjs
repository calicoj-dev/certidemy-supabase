#!/usr/bin/env node
/**
 * measure-teaching-move.mjs - is the "174 carry no teaching move" figure a
 * property of the text, or of the detector that produced it?
 *
 * READ-ONLY. No flags. Fixes nothing.
 *
 * ============ WHY THIS EXISTS ============
 *
 * The ISMS-F census reported 174 of 192 as definition-shaped, using a lexical
 * list of teaching words. That number is about to decide the scope of a
 * 192-row rewrite, and CLAUDE.md's standing rule is that the same property
 * measured a second, independent way must agree -- a disagreement names a
 * defect in an implementation, and a single detector has nothing to disagree
 * with.
 *
 * Detector 1 (the census) looked for a vocabulary: so, because, rather than,
 * unless, when, must, only, therefore, distinction...
 *
 * Detector 2 (here) looks for a STRUCTURE, deliberately sharing no vocabulary
 * with detector 1 where it can be avoided:
 *
 *   CONTRAST   "X against Y", "not a Y", "does and does not", "vs"
 *   CAUSAL     a "why" or "how" frame -- the description explains rather than
 *              names
 *   NEGATIVE   the row teaches what is NOT the case, which is a teaching move
 *              no glossary performs
 *   GAP        the row names a limit, blind spot or failure mode -- teaching
 *              by boundary
 *
 * A row is TEACHING if either detector fires. The interesting output is the
 * DISAGREEMENT, not the total: those are the rows detector 1 called glosses
 * and detector 2 calls teaching, and they are where a 192-row scope would be
 * rewriting text that is already doing its job.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
}

const HERE = dirname(fileURLToPath(import.meta.url));
for (const p of [join(HERE, ".env"), join(HERE, "..", ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };

async function allRows(path) {
  const out = []; let from = 0, total = null;
  for (;;) {
    const r = await fetch(BASE + "/" + path, { headers: { ...H, Range: from + "-" + (from + 499), Prefer: "count=exact" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    total = Number(String(r.headers.get("content-range") || "").split("/")[1]);
    const page = await r.json(); out.push(...page);
    if (page.length < 500) break; from += 500;
  }
  if (!Number.isFinite(total)) throw new Error("no content-range on " + path);
  if (out.length !== total) throw new Error("PAGING INCOMPLETE: " + out.length + " of " + total);
  return out;
}

/* DETECTOR 1 -- the census's lexical list, reproduced byte-for-byte so the
 * comparison is against what actually produced the 174. */
const TEACH1 = /\b(so|because|which means|rather than|not\b[^.]*\bbut|unlike|whereas|when|if|must|shall|should|cannot|only|therefore|the point|in practice|matters|distinguish|contrast|difference|auditor|candidate|organization must)\b/i;

/* DETECTOR 2 -- structure, not vocabulary. */
const CONTRAST = /\b(\w+\s+against\s+\w+|not a\b|not the\b|does and does not|\bvs\b|versus|instead of|as opposed to|separate\w* from|differs?\b|distinct\w*\b|apart from)/i;
const CAUSAL   = /\b(why|how)\b/i;
const NEGATIVE = /\b(no |never|absent|cannot|does not|are not|is not|stop\w*|fails?\b|gap|limit\w*|blind)/i;
const BOUNDARY = /\b(boundary|boundaries|blind spot|failure mode|erosion|underground|widen\w*|beyond|outside|by construction)\b/i;

const fires2 = (d) => CONTRAST.test(d) || CAUSAL.test(d) || NEGATIVE.test(d) || BOUNDARY.test(d);

/* ============ THE CALIBRATION SET, AND IT DISQUALIFIES BOTH DETECTORS ======
 *
 * A detector is calibrated against text whose verdict is already settled. The
 * settled case here is `security-control` as it now stands -- ratified as the
 * house style precisely because it teaches: it says what a control is FOR and
 * contrasts presence against effect.
 *
 * BOTH DETECTORS CALL IT A GLOSS.
 *
 * Detector 1 wants "but" after its negation and gets "not by whether";
 * detector 2 wants "not a" and gets "not to accept". The row performs the
 * clearest teaching move in the corpus using none of the words either list
 * happens to contain.
 *
 * So the honest finding is not a corrected count. It is that A LEXICAL
 * DETECTOR CANNOT MEASURE WHETHER PROSE TEACHES, and the census's "174 carry
 * no teaching move" is a fact about a word list rather than about the text.
 * The number is withdrawn rather than refined.
 *
 * The detectors are still run below, because their DISAGREEMENT is evidence
 * of a narrower kind: a row both of them call teaching is very likely
 * teaching, and a row neither calls teaching is unresolved rather than
 * condemned. That asymmetry is the only thing a word list can honestly
 * support.
 */
const CALIBRATION = [
  ["An answer to a risk the organization chose not to accept; judged by whether the risk moved, not by whether the control is present.",
   "RATIFIED HOUSE STYLE -- teaches by construction"],
  ["How much risk an organization is prepared to seek out or to hold on to, decided deliberately rather than discovered after the fact.",
   "already written in house style"],
  ["a failure to meet a requirement", "bare ISO gloss"],
  ["the risk remaining after treatment", "bare ISO gloss"],
  ["why one certificate does not confer the other", "teaches, by a why-frame"],
  ["fixing the instance against removing the cause", "teaches, by contrast"],
];
console.log("");
console.log("CALIBRATION -- six rows whose verdict is already settled:");
let exemplarMissed = 0;
for (const [t, why] of CALIBRATION) {
  const g1 = TEACH1.test(t), g2 = fires2(t);
  const verdict = (g1 || g2) ? "teaching" : "GLOSS";
  if (why.startsWith("RATIFIED") && verdict === "GLOSS") exemplarMissed++;
  console.log("   d1=" + (g1 ? "Y" : "n") + " d2=" + (g2 ? "Y" : "n") + "  -> " + verdict.padEnd(9) +
              "  " + why);
  console.log("        \"" + t.slice(0, 92) + (t.length > 92 ? "..." : "") + "\"");
}
if (exemplarMissed) {
  console.log("");
  console.log("   ** THE RATIFIED EXEMPLAR SCORES AS A GLOSS ON BOTH DETECTORS. **");
  console.log("   A detector that cannot recognise the text it is meant to select for is");
  console.log("   not measuring the property. The census's 174 is a fact about a word");
  console.log("   list. It is WITHDRAWN, not corrected -- see the header.");
}


const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const rows = (await allRows("concepts?select=id,slug,name,description,certification_id,retired_at"))
  .filter((c) => !c.retired_at && codeOf.get(c.certification_id) === "ISMS-F");

const scored = rows.map((r) => {
  const d = String(r.description || "");
  return { slug: r.slug, d, t1: TEACH1.test(d), t2: fires2(d), len: d.length };
});

const bothGloss = scored.filter((r) => !r.t1 && !r.t2);
const bothTeach = scored.filter((r) => r.t1 && r.t2);
const only1 = scored.filter((r) => r.t1 && !r.t2);
const only2 = scored.filter((r) => !r.t1 && r.t2);

console.log("");
console.log("ISMS-F, " + scored.length + " live descriptions, two independent detectors");
console.log("  BOTH say teaching        " + bothTeach.length);
console.log("  BOTH say gloss           " + bothGloss.length + "   <- the defensible repair population");
console.log("  detector 1 only          " + only1.length);
console.log("  detector 2 only          " + only2.length + "   <- rows the census called glosses and are NOT");
console.log("");
console.log("  census figure (detector 1 alone)   " + (scored.length - scored.filter((r) => r.t1).length) + " glosses");
console.log("  agreed figure (both detectors)    " + bothGloss.length + " glosses");
console.log("  DISAGREEMENT                      " + only2.length + " rows");

console.log("");
console.log("THE " + only2.length + " ROWS DETECTOR 1 MISSED -- these teach, in words it did not list:");
for (const r of only2.sort((a, b) => a.slug.localeCompare(b.slug))) {
  console.log("   " + r.slug.padEnd(36) + r.d.slice(0, 84));
}

console.log("");
console.log("SHORTEST 20 OF THE AGREED GLOSS SET (the hardest rows to rewrite):");
for (const r of [...bothGloss].sort((a, b) => a.len - b.len).slice(0, 20)) {
  console.log("   " + String(r.len).padStart(3) + "  " + r.slug.padEnd(32) + r.d);
}

writeFileSync(join(HERE, "..", "ISMS-F-TEACHING-MOVE.json"), JSON.stringify({
  measured: "2026-09-22",
  total: scored.length,
  both_teach: bothTeach.length, both_gloss: bothGloss.length,
  detector1_only: only1.length, detector2_only: only2.length,
  census_figure: scored.length - scored.filter((r) => r.t1).length,
  agreed_gloss_figure: bothGloss.length,
  detector2_only_rows: only2.map((r) => ({ slug: r.slug, description: r.d })),
  agreed_gloss_rows: bothGloss.map((r) => ({ slug: r.slug, description: r.d, chars: r.len })),
}, null, 2), "utf8");
console.log("");
console.log("wrote ISMS-F-TEACHING-MOVE.json");
