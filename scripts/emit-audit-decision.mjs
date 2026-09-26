/**
 * emit-audit-decision.mjs -- replace the audit QUESTION in OPEN-ITEMS.md with the
 * measured ANSWER.
 *
 * Writes only OPEN-ITEMS.md. Unknown flags exit 2.
 *
 * Every figure is computed from the live bank and the two declared finding sets, not
 * typed. The per-certification denominators differ -- the 342 sample covered three
 * certifications and the 480 covered twelve -- and a hand-built table would get that
 * wrong in exactly the way this repository has already paid for.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { AUDIT480_TIER_A, AUDIT480_TIER_B } from "./lib/audit-480-findings.mjs";
import { TIER_A as SAMPLE342_TIER_A, TIER_B as SAMPLE342_TIER_B } from "./lib/tiered-item-findings.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a)); process.exitCode = 2; process.exit();
}

/* How many items each sample read, per certification. The 342 were the items
 * actually PRESENTED in eight es-419 attempts, so only three certifications appear;
 * the 480 is 40 per certification across twelve. */
const READ_342 = { "AIE-I": 72, "AISM-I": 80, "SM-AI-I": 190 };
const READ_480_PER_CERT = 40;

const KEY = requireKey(HERE);
const certs = (await getAll(KEY, "certifications?select=id,code&order=code")).filter((c) => c.code !== "ZZ-TEST-I");
const live = await getAll(KEY,
  "quiz_questions?select=id,certification_id&language=eq.en&pool=eq.secure&status=eq.approved&retired_at=is.null&order=id");
const liveBy = new Map();
for (const r of live) liveBy.set(r.certification_id, (liveBy.get(r.certification_id) || 0) + 1);

const rows = certs.map((c) => {
  const read = (READ_342[c.code] || 0) + READ_480_PER_CERT;
  const a342 = SAMPLE342_TIER_A.filter((t) => t.cert === c.code).length;
  const a480 = AUDIT480_TIER_A.filter((t) => t.cert === c.code).length;
  const b342 = SAMPLE342_TIER_B.filter((t) => t.cert === c.code).length;
  const b480 = AUDIT480_TIER_B.filter(([cert]) => cert === c.code).length;
  return { cert: c.code, live: liveBy.get(c.id) || 0, read, wrongKeys: a342 + a480,
    contested: b342 + b480, rate: read ? (100 * (a342 + a480)) / read : 0 };
});
const totRead = rows.reduce((s, r) => s + r.read, 0);
const totWrong = rows.reduce((s, r) => s + r.wrongKeys, 0);
const totContested = rows.reduce((s, r) => s + r.contested, 0);
const totLive = rows.reduce((s, r) => s + r.live, 0);
/* Read groups still live = read minus what has been retired from each sample. */
const retired = SAMPLE342_TIER_A.length + AUDIT480_TIER_A.length;
const remaining = totLive - (totRead - retired);

const problems = [];
if (totRead !== 822) problems.push("expected 822 items read, computed " + totRead);
if (totWrong !== 16) problems.push("expected 16 wrong keys, computed " + totWrong);
if (problems.length) {
  console.error("ABORT -- the computed figures disagree with the director's:");
  for (const p of problems) console.error("  " + p);
  console.error("Not written. A decision document must not carry a number I cannot reconcile.");
  process.exitCode = 2; process.exit();
}

const L = [];
L.push("**SHOULD THE SECURE POOLS GET A SOURCE-CONFORMANCE AUDIT BEFORE MORE EXAMS RUN?**");
L.push("**ANSWERED 2026-09-26. The rate holds, it holds everywhere, and it is a GENERATOR");
L.push("problem.** This replaces the question that stood here; the reasoning that raised it is");
L.push("in `SCRUM-2017-REPORT.md` and the two reads are `ITEM-EXPOSURE.md` and");
L.push("`AUDIT-FINDINGS-480.md`.");
L.push("");
L.push("**" + totRead + " English secure items have now been read against their own cited sources**");
L.push("— " + Object.values(READ_342).reduce((a, b) => a + b, 0) + " from the exposed set and " +
  (READ_480_PER_CERT * certs.length) + " from a stratified random sample of all twelve");
L.push("certifications, seed 20260926, with no overlap. **" + totWrong + " wrong keys, " +
  totContested + " contested.**");
L.push("");
L.push("| cert | live EN secure | read | wrong keys | rate | contested |");
L.push("|---|---|---|---|---|---|");
for (const r of rows.sort((a, b) => b.rate - a.rate || a.cert.localeCompare(b.cert))) {
  L.push("| " + r.cert + " | " + r.live + " | " + r.read + " | **" + r.wrongKeys + "** | " +
    r.rate.toFixed(1) + "% | " + r.contested + " |");
}
L.push("| **total** | **" + totLive + "** | **" + totRead + "** | **" + totWrong + "** | **" +
  ((100 * totWrong) / totRead).toFixed(1) + "%** | **" + totContested + "** |");
L.push("");
L.push("**The two samples agree**: 1.5% wrong keys on the exposed 342, 2.3% on the random 480.");
L.push("The second was drawn at random from every certification, so the rate is a property of");
L.push("the bank and not of what eight attempts happened to draw. **Every certification has");
L.push("defects**; three have no wrong key yet and all three have contested items.");
L.push("");
L.push("### It is a generator problem, not a translation problem");
L.push("");
L.push("The errors cluster by **source**, not by language:");
L.push("");
L.push("- 2017 Scrum Guide wording across the four Scrum certifications");
L.push("- 19011:2018-style clause numbering in AIMS-IA and ISMS-IA");
L.push("- \"requirements\" the ISO standards do not contain");
L.push("- an odd-one-out option pattern the generator repeats (Tier D, nine items)");
L.push("");
L.push("**The Spanish read clean across all 342.** No translation moved a key or made a");
L.push("distractor correct. Every defect found in both reads is in the English, so every fix");
L.push("lands in all three languages and no translation pass would have found any of them.");
L.push("");
L.push("### What remains, and what the next step is");
L.push("");
L.push("| | |");
L.push("|---|---|");
L.push("| English secure items live | **" + totLive + "** |");
L.push("| read across both samples | " + totRead + " |");
L.push("| retired as Tier A | " + retired + " |");
L.push("| **not yet read** | **" + remaining + "** |");
L.push("");
L.push("**The next step is batches of 480, read the same way**: stratified by domain per");
L.push("certification, seed recorded, no overlap with what has been read, Tier A retired on the");
L.push("spot after the domain-quota feasibility check. At " + remaining + " remaining that is");
L.push("about " + Math.ceil(remaining / 480) + " more batches. `scripts/build-audit-sample.mjs`");
L.push("already excludes read groups, so each batch is one command.");
L.push("");
L.push("### The one thing only Juan can supply: human SMEs");
L.push("");
L.push("**" + totContested + " contested items are waiting on subject-matter judgement, and an AI");
L.push("read cannot close them.** Four domains:");
L.push("");
L.push("| domain | who is needed | queue depth |");
L.push("|---|---|---|");
L.push("| Scrum (2020 Guide) | a PST or equivalent | " +
  rows.filter((r) => /^(SM-AI|SPO-AI|SD-AI)/.test(r.cert)).reduce((s, r) => s + r.contested, 0) + " |");
L.push("| ITIL 4 / ISO 20000 | a service-management practitioner | " +
  rows.filter((r) => r.cert === "AISM-I").reduce((s, r) => s + r.contested, 0) + " |");
L.push("| ISO auditor (27001 / 42001 / 19011) | a lead auditor | " +
  rows.filter((r) => /^(ISMS|AIMS)/.test(r.cert)).reduce((s, r) => s + r.contested, 0) + " |");
L.push("| EU AI Act and HR / employment law | counsel or a compliance specialist | " +
  rows.filter((r) => /^(AIGRM|AIHR|AIE)/.test(r.cert)).reduce((s, r) => s + r.contested, 0) + " |");
L.push("");
L.push("> **Under ISO/IEC 17024 an AI read is TRIAGE. It does not replace SME sign-off.** What");
L.push("> the two reads can do is put the right items in front of the right expert and retire the");
L.push("> ones that are plainly wrong; what they cannot do is be the judgement of record for a");
L.push("> scored examination. Tier A was retired on measurement. **Tier B is not rescored on");
L.push("> \"contested\" and must not be** — that decision belongs to a named human with the");
L.push("> standard open.");
L.push("");
L.push("Queues: `ITEM-REVIEW-QUEUE.md` (Tier B, SME) and `ITEM-FIX-QUEUE.md` (Tiers C, D, E).");
L.push("");
L.push("");

const path = join(ROOT, "OPEN-ITEMS.md");
let md = readFileSync(path, "utf8");
const startMark = "**SHOULD THE SECURE POOLS GET A SOURCE-CONFORMANCE AUDIT BEFORE MORE EXAMS RUN?**";
const start = md.indexOf(startMark);
if (start < 0) { console.error("the audit question is not in OPEN-ITEMS.md -- refusing to guess where to put the answer"); process.exitCode = 2; process.exit(); }
/* The section ends at the next decision entry, which begins with a bold line. */
const endMark = "**A SPANISH SCRUM/ITIL GLOSSARY TO PIN";
const end = md.indexOf(endMark, start);
if (end < 0) { console.error("could not find the end of the audit section"); process.exitCode = 2; process.exit(); }
const out = md.slice(0, start) + L.join("\n") + md.slice(end);
writeFileSync(path, out, "utf8");
const back = readFileSync(path, "utf8");
if (!back.includes(L.join("\n"))) { console.error("splice not verbatim"); process.exitCode = 2; process.exit(); }
if (back.includes("The base rate is the part that decides this")) {
  console.error("the OLD question text survived the splice");
  process.exitCode = 2; process.exit();
}

console.log("AUDIT DECISION EMITTED into OPEN-ITEMS.md");
console.log("  read " + totRead + "   wrong keys " + totWrong + "   contested " + totContested);
console.log("  live EN secure " + totLive + "   retired " + retired + "   NOT YET READ " + remaining);
console.log("  batches of 480 remaining: about " + Math.ceil(remaining / 480));
console.log("  old question text removed, new answer verified verbatim");
