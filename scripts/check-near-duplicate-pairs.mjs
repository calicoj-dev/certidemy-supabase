/**
 * check-near-duplicate-pairs.mjs -- can each near-duplicate pair land on one form
 * under the stem-identity dedupe?
 *
 * READ-ONLY. Unknown flags exit 2.
 *
 * ============ THE DEDUPE CATCHES IDENTICAL STEMS, NOT SIMILAR ONES ============
 *
 * `stemIdentity` keys on the ENGLISH sibling's stem, first 160 characters, so it
 * catches a variant pair that shares a stem in every language. It cannot catch two
 * items that ask the same thing in different words -- there is no string to match.
 *
 * A pair can reach one form when all three hold:
 *   1. both rows are live and secure in the same certification
 *   2. both sit in the SAME DOMAIN -- the allocator draws per domain, so two items
 *      in different domains compete for different slots and both landing is normal
 *      rather than a collision
 *   3. the dedupe does not collapse them
 *
 * Condition 2 is the one that is easy to skip. Two near-duplicates in different
 * domains are still poor items, but they are not the same risk: the form was always
 * going to spend a slot in each domain.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { normStem, stemIdentity } from "../functions/_shared/item-rules/stem-identity.mjs";
import { AUDIT480_NEAR_DUPLICATES } from "./lib/audit-480-findings.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY"); process.exitCode = 2; process.exit();
}

/* The four ids the director marked `?`, resolved from AUDIT-SAMPLE.md POSITION
 * rather than guessed. Both pairs sit on the same task, adjacent in the sample. */
const RESOLVED_BY_POSITION = {
  283: { id: "bd13b898", cert: "ISMS-IA", task: "1.2", pairs_with: "cc0731c2" },
  297: { id: "1c6caa16", cert: "ISMS-IA", task: "3.3", pairs_with: "00ae33a8" },
};

const PAIRS = AUDIT480_NEAR_DUPLICATES.map((p) => {
  if (p.b) return { cert: p.cert, a: p.a, b: p.b, resolvedFrom: null };
  const r = RESOLVED_BY_POSITION[p.bSamplePosition];
  if (!r) throw new Error("no resolution for sample position " + p.bSamplePosition);
  if (r.pairs_with !== p.a) throw new Error("position " + p.bSamplePosition + " pairs with " + r.pairs_with + ", not " + p.a);
  return { cert: p.cert, a: p.a, b: r.id, resolvedFrom: "AUDIT-SAMPLE.md position " + p.bSamplePosition };
});

const KEY = requireKey(HERE);
const rows = await getAll(KEY,
  "quiz_questions?select=id,question_group_id,certification_id,language,pool,task_id,question_text,retired_at,status&order=id");
const certs = await getAll(KEY, "certifications?select=id,code&order=id");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const tasks = await getAll(KEY, "tasks?select=id,code,domain_id&order=id");
const taskBy = new Map(tasks.map((t) => [t.id, t]));
const domains = await getAll(KEY, "domains?select=id,code&order=id");
const domCode = new Map(domains.map((d) => [d.id, d.code]));

/* the English stem map the deployed function builds */
const englishStemByGroup = new Map();
for (const r of rows) {
  if (r.language === "en" && r.question_group_id && r.question_text && !r.retired_at && r.status === "approved") {
    englishStemByGroup.set(r.question_group_id, normStem(r.question_text));
  }
}

const one = (pre) => {
  const hits = rows.filter((r) => r.id.startsWith(pre) && r.language === "en");
  if (hits.length !== 1) throw new Error(pre + " matched " + hits.length + " English row(s)");
  return hits[0];
};

const out = [];
let missed = 0, caught = 0, notCoDomain = 0, notLive = 0;
for (const p of PAIRS) {
  const A = one(p.a), B = one(p.b);
  const liveA = !A.retired_at && A.status === "approved" && A.pool === "secure";
  const liveB = !B.retired_at && B.status === "approved" && B.pool === "secure";
  const tA = taskBy.get(A.task_id), tB = taskBy.get(B.task_id);
  const domA = tA && domCode.get(tA.domain_id), domB = tB && domCode.get(tB.domain_id);
  const idA = stemIdentity(A, englishStemByGroup), idB = stemIdentity(B, englishStemByGroup);
  const deduped = idA === idB;
  const sameDomain = !!domA && domA === domB;
  const coReachable = liveA && liveB && sameDomain && !deduped;

  if (!liveA || !liveB) notLive++;
  else if (deduped) caught++;
  else if (!sameDomain) notCoDomain++;
  else missed++;

  out.push({
    cert: p.cert, a: p.a, b: p.b, resolvedFrom: p.resolvedFrom,
    live: liveA && liveB, sameDomain, domainA: domA, domainB: domB,
    taskA: tA && tA.code, taskB: tB && tB.code,
    dedupeCatches: deduped,
    canLandTogether: coReachable,
    stemA: normStem(A.question_text).slice(0, 96),
    stemB: normStem(B.question_text).slice(0, 96),
  });
}

console.log("NEAR-DUPLICATE PAIRS vs THE STEM-IDENTITY DEDUPE -- read-only");
console.log("  pairs declared                      " + PAIRS.length);
console.log("  of which resolved from sample position " + PAIRS.filter((p) => p.resolvedFrom).length);
console.log("");
console.log("  caught by the dedupe                " + caught);
console.log("  different domains, so not competing " + notCoDomain);
console.log("  a member is not live secure         " + notLive);
console.log("  CAN STILL LAND ON ONE FORM          " + missed + "   <- what the dedupe misses");
console.log("");
for (const r of out) {
  console.log("  " + (r.canLandTogether ? "MISSED " : r.dedupeCatches ? "caught " : r.live ? "diff-domain " : "not-live ") +
    r.cert + "  " + r.a + " / " + r.b + (r.resolvedFrom ? "   [" + r.resolvedFrom + "]" : ""));
  console.log("      task " + r.taskA + " (" + r.domainA + ")  vs  task " + r.taskB + " (" + r.domainB + ")" +
    (r.sameDomain ? "   SAME DOMAIN" : "   different domains"));
  console.log("      A: " + r.stemA);
  console.log("      B: " + r.stemB);
}

writeFileSync(join(ROOT, "NEAR-DUPLICATE-PAIRS.json"), JSON.stringify({
  pairs: out, caught, missed, different_domain: notCoDomain, not_live: notLive,
}, null, 2) + "\n", "utf8");
console.log("");
console.log("wrote NEAR-DUPLICATE-PAIRS.json");
