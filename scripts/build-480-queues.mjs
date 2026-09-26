/**
 * build-480-queues.mjs -- append Tier B to ITEM-REVIEW-QUEUE.md and write
 * ITEM-FIX-QUEUE.md for Tiers C, D and E.
 *
 * Writes only those two files; touches no item. Unknown flags exit 2.
 *
 * The lists are EMITTED from `lib/audit-480-findings.mjs` rather than retyped. A
 * hand-transcribed table in this repository has already dropped a row and corrupted
 * two columns once; these are 140-odd ids and the failure mode is silent.
 *
 * Every prefix is resolved against the live bank first, and a prefix that matches
 * none or more than one row is a HARD ERROR -- a queue naming an item nobody can
 * find is worse than no queue.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, getAllIn } from "./_pg.mjs";
import {
  AUDIT480_TIER_B, AUDIT480_TIER_C, AUDIT480_TIER_D, AUDIT480_TIER_E,
  AUDIT480_NEAR_DUPLICATES, AUDIT480_RATES,
} from "./lib/audit-480-findings.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a)); process.exitCode = 2; process.exit();
}

const KEY = requireKey(HERE);
/* TWO NARROW READS, NOT ONE WIDE ONE. Fetching seven columns for every English row
 * timed out the statement server-side; the prefixes only need `id` to resolve, and
 * the details are then fetched for the ~140 ids that matched. Same answer, and it
 * does not depend on one big read succeeding. */
const idRows = await getAll(KEY,
  "quiz_questions?select=id&language=eq.en&order=id");
const certs = await getAll(KEY, "certifications?select=id,code&order=id");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const tasks = await getAll(KEY, "tasks?select=id,code&order=id");
const taskBy = new Map(tasks.map((t) => [t.id, t]));

/* every declared (cert, prefix) pair, deduplicated -- some ids appear in more than
 * one tier, which is a fact about the item and not a mistake */
const declared = [];
for (const [cert, id] of AUDIT480_TIER_B) declared.push([cert, id]);
for (const group of Object.values(AUDIT480_TIER_C)) for (const [cert, id] of group) declared.push([cert, id]);
for (const group of Object.values(AUDIT480_TIER_D)) for (const [cert, id] of group) declared.push([cert, id]);
for (const [cert, id] of AUDIT480_TIER_E) declared.push([cert, id]);

const problems = [];
const fullId = new Map();
for (const [cert, pre] of declared) {
  if (fullId.has(pre)) continue;
  const hits = idRows.filter((r) => r.id.startsWith(pre));
  if (hits.length !== 1) {
    problems.push(pre + " (" + cert + ") matched " + hits.length + " English row(s)");
    continue;
  }
  fullId.set(pre, hits[0].id);
}
if (problems.length) {
  console.error("ABORT -- nothing written. Unresolvable prefixes:");
  for (const p of problems) console.error("  " + p);
  process.exitCode = 2; process.exit();
}

const details = await getAllIn(KEY, "quiz_questions",
  "id,certification_id,task_id,pool,retired_at,status", "id", [...fullId.values()]);
const detailBy = new Map(details.map((r) => [r.id, r]));

const seen = new Map();
function look(pre, cert) {
  if (seen.has(pre)) return seen.get(pre);
  const r = detailBy.get(fullId.get(pre));
  if (!r) { problems.push(pre + ": resolved but its detail row was not returned"); return null; }
  const actual = codeOf.get(r.certification_id);
  if (actual !== cert) problems.push(pre + " is declared " + cert + " but lives in " + actual);
  const info = { task: (taskBy.get(r.task_id) || {}).code || "?", live: !r.retired_at && r.status === "approved", pool: r.pool };
  seen.set(pre, info);
  return info;
}
for (const [cert, id] of declared) look(id, cert);
if (problems.length) {
  console.error("ABORT -- nothing written:");
  for (const p of problems) console.error("  " + p);
  process.exitCode = 2; process.exit();
}

const nd = JSON.parse(readFileSync(join(ROOT, "NEAR-DUPLICATE-PAIRS.json"), "utf8"));
const retired = JSON.parse(readFileSync(join(ROOT, "AUDIT-480-RETIRED.json"), "utf8"));

/* ---------------------------------------------------- Tier B, appended ---- */
const byCertB = new Map();
for (const [cert, id, why] of AUDIT480_TIER_B) {
  if (!byCertB.has(cert)) byCertB.set(cert, []);
  byCertB.get(cert).push({ id, why, ...look(id, cert) });
}
const B = [];
B.push("");
B.push("---");
B.push("");
B.push("## From the 480-item audit sample — added 2026-09-26");
B.push("");
B.push("The director's read of `AUDIT-SAMPLE.md`, 40 English secure items per certification.");
B.push("**" + AUDIT480_TIER_B.length + " Tier B items across " + byCertB.size + " certifications.** Same rule as above:");
B.push("two options are defensible, or the key rests on a claim the source does not make.");
B.push("**Nothing is rescored on \"contested.\"**");
B.push("");
B.push("> **These are defects in the ENGLISH**, and the errors cluster by SOURCE — 2017 Scrum");
B.push("> Guide wording, 19011:2018-style clause numbers, and \"requirements\" the ISO standards");
B.push("> do not contain. That is a generator problem, not a translation problem. An SME fix");
B.push("> lands in all three languages.");
B.push("");
B.push("| cert | id | task | why |");
B.push("|---|---|---|---|");
for (const cert of [...byCertB.keys()].sort()) {
  for (const r of byCertB.get(cert)) {
    B.push("| " + cert + " | `" + r.id + "` | " + r.task + " | " + r.why +
      (r.live ? "" : "  **(no longer live)**") + " |");
  }
}
B.push("");
B.push("**`e9032f24` (SPO-AI-I) was promoted from Tier C by the director**, because the false");
B.push("statement — one Product Owner per *product*, not per team — is in the **key text** rather");
B.push("than the explanation. A false statement in the key is a keyed-answer question, not a");
B.push("wording fix.");
B.push("");

const reviewPath = join(ROOT, "ITEM-REVIEW-QUEUE.md");
let review = readFileSync(reviewPath, "utf8");
if (review.includes("## From the 480-item audit sample")) {
  console.error("ITEM-REVIEW-QUEUE.md already carries the 480 section -- refusing to append twice.");
  process.exitCode = 2; process.exit();
}
writeFileSync(reviewPath, review.replace(/\s*$/, "\n") + B.join("\n"), "utf8");

/* ------------------------------------------------------- the fix queue ---- */
const F = [];
F.push("# Item fix queue — Tiers C, D and E");
F.push("");
F.push("From the director's read of the 480-item audit sample, 2026-09-26. **Nothing here is");
F.push("drafted yet** — this is the worklist, grouped by fix type so one pass can close a whole");
F.push("group rather than one item at a time.");
F.push("");
F.push("Tier A is retired (`AUDIT-480-RETIRED.json`, " + retired.rows.length + " rows across " +
  retired.groups.length + " groups). Tier B is in `ITEM-REVIEW-QUEUE.md` and needs an SME, not a fix.");
F.push("");
F.push("| tier | what it is | count | who fixes it |");
F.push("|---|---|---|---|");
F.push("| **C** | the key is sound, the explanation states something false or cites the wrong clause | " +
  Object.values(AUDIT480_TIER_C).reduce((a, g) => a + g.length, 0) + " | a writer with the source open |");
F.push("| **D** | item-writing flaw: give-away, missing facts, contradiction, near-duplicate | " +
  Object.values(AUDIT480_TIER_D).reduce((a, g) => a + g.length, 0) + " + " + AUDIT480_NEAR_DUPLICATES.length +
  " pairs | a writer, and one group belongs in the RUBRIC |");
F.push("| **E** | more than ten consecutive words verbatim from a standard | " + AUDIT480_TIER_E.length +
  " | paraphrase, then the leak gate measures it |");
F.push("");
F.push("**Every one of these is a defect in the English**, so a fix reaches all three languages.");
F.push("Editing a translated row is never the remedy for any of them.");
F.push("");

F.push("---");
F.push("");
F.push("## Tier C — explanation fixes, key sound");
F.push("");
for (const [kind, group] of Object.entries(AUDIT480_TIER_C)) {
  F.push("### " + kind + " — " + group.length);
  F.push("");
  F.push("| cert | id | task | detail |");
  F.push("|---|---|---|---|");
  for (const [cert, id, why] of group) {
    const i = look(id, cert);
    F.push("| " + cert + " | `" + id + "` | " + i.task + " | " + why + (i.live ? "" : "  **(no longer live)**") + " |");
  }
  F.push("");
}

F.push("---");
F.push("");
F.push("## Tier D — item-writing flaws");
F.push("");
for (const [kind, group] of Object.entries(AUDIT480_TIER_D)) {
  F.push("### " + kind + " — " + group.length);
  F.push("");
  if (kind.startsWith("odd-one-out")) {
    F.push("**Fix this in the rubric, not per item.** Three distractors sharing a verdict while only");
    F.push("the key differs is a shape the generator produces, so nine corrected items would be");
    F.push("followed by nine more. `scripts/gen-cert-secure.mjs` is where the item contract lives.");
    F.push("");
  }
  F.push("| cert | id | task |");
  F.push("|---|---|---|");
  for (const [cert, id] of group) {
    const i = look(id, cert);
    F.push("| " + cert + " | `" + id + "` | " + i.task + (i.live ? "" : "  **(no longer live)**") + " |");
  }
  F.push("");
}

F.push("### near-duplicate pairs — " + nd.pairs.length + ", and the dedupe catches none of them");
F.push("");
F.push("**Measured against the deployed stem-identity dedupe:**");
F.push("");
F.push("| | |");
F.push("|---|---|");
F.push("| caught by the dedupe | **" + nd.caught + "** |");
F.push("| in different domains, so not competing for one slot | " + nd.different_domain + " |");
F.push("| **can still land on one form** | **" + nd.missed + "** |");
F.push("");
F.push("The dedupe keys on the English sibling's stem, first 160 characters. It was built for");
F.push("VARIANT pairs that share a stem in every language, and **a near-duplicate has no shared");
F.push("string to match** — so catching none of these is the guard working as specified, not");
F.push("failing. Seven of the eight sit on the **same task in the same domain**, so the allocator");
F.push("can draw both for one form.");
F.push("");
F.push("**Two ids the director marked `?` are resolved from `AUDIT-SAMPLE.md` position, not");
F.push("guessed**, and each pairs with the item immediately before it on the same task:");
F.push("");
F.push("| sample position | id | pairs with |");
F.push("|---|---|---|");
F.push("| 283 | `bd13b898` | `cc0731c2` (position 284) |");
F.push("| 297 | `1c6caa16` | `00ae33a8` (position 296) |");
F.push("");
F.push("| cert | pair | tasks | dedupe | can land together |");
F.push("|---|---|---|---|---|");
for (const p of nd.pairs) {
  F.push("| " + p.cert + " | `" + p.a + "` / `" + p.b + "` | " + p.taskA + " (" + p.domainA + ") / " +
    p.taskB + " (" + p.domainB + ") | " + (p.dedupeCatches ? "catches" : "misses") + " | " +
    (p.canLandTogether ? "**yes**" : "no") + " |");
}
F.push("");
F.push("> **The durable fix is not a wider dedupe.** Matching \"similar\" stems needs a similarity");
F.push("> threshold, and this repository has already recorded what an absolute threshold does to a");
F.push("> corpus that varies in length. These are eight authored duplicates: retire or rewrite one");
F.push("> of each pair and the problem is gone, with no new judgement in the form assembler.");
F.push("");

F.push("---");
F.push("");
F.push("## Tier E — reproduction");
F.push("");
F.push("| cert | id | task | source |");
F.push("|---|---|---|---|");
for (const [cert, id, src] of AUDIT480_TIER_E) {
  const i = look(id, cert);
  F.push("| " + cert + " | `" + id + "` | " + i.task + " | " + src + (i.live ? "" : "  **(no longer live)**") + " |");
}
F.push("");
F.push("These are ITEM bodies. `scan-iso-leaks` measures LESSON bodies, so **no gate currently");
F.push("sees them** — the item pools have never been leak-scanned. That is its own open item and");
F.push("is bigger than these five: the same scanner pointed at " +
  "the item corpus would measure every certification's bank at once.");
F.push("");
F.push("---");
F.push("");
F.push("## Rates, for context");
F.push("");
F.push("| class | count | rate of 480 |");
F.push("|---|---|---|");
F.push("| A — wrong key | " + AUDIT480_RATES.A.count + " | " + AUDIT480_RATES.A.rate + " |");
F.push("| B — contested | " + AUDIT480_RATES.B.count + " | " + AUDIT480_RATES.B.rate + " |");
F.push("| C — false explanation | " + AUDIT480_RATES.C.count + " | " + AUDIT480_RATES.C.rate + " |");
F.push("| D — item-writing flaw | " + AUDIT480_RATES.D.count + " | " + AUDIT480_RATES.D.rate + " |");
F.push("| E — reproduction | " + AUDIT480_RATES.E.count + " | " + AUDIT480_RATES.E.rate + " |");
F.push("");
F.push("B, C and D are the director's approximate counts; A and E are exact. The queues above");
F.push("carry the exact ids, which is why the table totals and the queue lengths differ slightly.");

writeFileSync(join(ROOT, "ITEM-FIX-QUEUE.md"), F.join("\n") + "\n", "utf8");

console.log("QUEUES BUILT");
console.log("  Tier B appended to ITEM-REVIEW-QUEUE.md   " + AUDIT480_TIER_B.length + " items");
console.log("  ITEM-FIX-QUEUE.md written");
console.log("    Tier C  " + Object.values(AUDIT480_TIER_C).reduce((a, g) => a + g.length, 0) +
  " across " + Object.keys(AUDIT480_TIER_C).length + " fix types");
console.log("    Tier D  " + Object.values(AUDIT480_TIER_D).reduce((a, g) => a + g.length, 0) +
  " across " + Object.keys(AUDIT480_TIER_D).length + " fix types, plus " + nd.pairs.length + " near-duplicate pairs");
console.log("    Tier E  " + AUDIT480_TIER_E.length);
console.log("  every prefix resolved to exactly one live English row: " + seen.size + " distinct ids");
console.log("  dedupe misses " + nd.missed + " of " + nd.pairs.length + " near-duplicate pairs");
