#!/usr/bin/env node
/**
 * sweep-requirement-contradictions.mjs - one certification asserting what
 * another denies.
 *
 * READ-ONLY. Produces CANDIDATES. Fixes nothing and decides nothing.
 *
 * ============ WHY THIS CLASS HAS NO INSTRUMENT ============
 *
 * Every gate in this repository checks a row against a STANDARD. Nothing
 * checks a row against ANOTHER ROW, and the corpus now spans four standards
 * across twelve certifications served from one unauthenticated endpoint. A
 * partner pulling get_concept across the catalogue -- which is what an ISO
 * practice does -- meets all of them together.
 *
 * The instance that bought this: ISMS-F served "auditor-objectivity :: the
 * requirement that auditors do not audit their own work" while AIMS-IA and
 * ISMS-IA both said no such rule exists in any of the standards and named
 * reading it as a requirement as the trap. Same endpoint, three
 * certifications, opposite claims about what a standard says.
 *
 * ============ WHAT THIS CAN AND CANNOT DO ============
 *
 * It matches a DENIAL ("neither X nor Y requires", "does not forbid", "is not
 * a requirement") against an ASSERTION ("the requirement that", "requires",
 * "shall") on shared distinctive vocabulary. That is a candidate generator:
 * two rows can share vocabulary and not contradict, and two rows can
 * contradict in words that share nothing.
 *
 * It CANNOT decide. Every output is for a human, and the count is meaningless
 * until the members are read.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
}
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const l of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(l);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const B = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };
async function all(path) {
  const out = []; let from = 0, total = null;
  for (;;) {
    const r = await fetch(B + "/" + path, { headers: { ...H, Range: from + "-" + (from + 499), Prefer: "count=exact" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    total = Number(String(r.headers.get("content-range")).split("/")[1]);
    const pg = await r.json(); out.push(...pg); if (pg.length < 500) break; from += 500;
  }
  if (out.length !== total) throw new Error("PAGING INCOMPLETE " + out.length + "/" + total);
  return out;
}

/* A DENIAL says a standard does NOT oblige something. */
const DENIAL = /\b(neither\s+\w[^.]{0,80}\bnor\b|does not (?:require|forbid|mandate|prohibit|contain|say|state)|do not (?:require|have to)|is not (?:a )?(?:requirement|required|mandatory|forbidden)|are not required|no (?:such )?(?:rule|requirement|clause|obligation)|nothing in [^.]{0,60} (?:requires|forbids|says|states)|not a rule|practice convention|says nothing about)/i;
/* An ASSERTION says something IS obliged. */
const ASSERTION = /\b(the requirement that|requires? (?:the |that |an? )|shall\b|must\b|is required to|mandates?\b|obliges?\b|is mandatory)/i;

/* POSITIVE CONTROL -- including two that must NOT match, because a classifier
 * with only positive cases passes on a predicate that always returns true. */
const CTL = [
  ["Neither ISO 19011 nor ISO/IEC 27001 contains a rule that an auditor may not audit their own work", "denial"],
  ["the requirement that auditors do not audit their own work", "assertion"],
  ["Clause 6.3 requires that changes be carried out in a planned manner", "assertion"],
  ["A description of a process is not evidence that the process operates", "neither"],
  ["The plan above the audits, scheduled across a period", "neither"],
];
for (const [t, want] of CTL) {
  const d = DENIAL.test(t), a = ASSERTION.test(t);
  const got = d ? "denial" : a ? "assertion" : "neither";
  if (got !== want) {
    console.error("CONTROL FAILED: " + JSON.stringify(t.slice(0, 60)) + " -> " + got + ", expected " + want);
    process.exit(2);
  }
}
console.log("control: " + CTL.length + "/" + CTL.length + " (two must classify as neither)");

const STOP = new Set(("the a an and or of to in for that which is are be been was were it its this these those with by on at as not no nor " +
  "from into than then so such can could may might shall should must will would have has had do does did " +
  "organization organizations information security management system systems audit audits auditor auditors " +
  "clause clauses standard standards iso iec requirement requirements control controls process processes " +
  "what where when who why how their there they them other another same different one two three").split(" "));
const terms = (s) => new Set(String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/)
  .filter((w) => w.length > 3 && !STOP.has(w)));

const certs = await all("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const live = (await all("concepts?select=id,slug,name,description,certification_id,retired_at"))
  .filter((c) => !c.retired_at)
  .map((c) => ({ cert: codeOf.get(c.certification_id), slug: c.slug, name: c.name,
                 description: String(c.description || ""), t: terms(c.name + " " + c.description) }));

const denials = live.filter((r) => DENIAL.test(r.description));
const assertions = live.filter((r) => ASSERTION.test(r.description));
console.log("");
console.log("SWEEP -- " + live.length + " live concepts across " + new Set(live.map((r) => r.cert)).size + " certifications");
console.log("  rows containing a DENIAL      " + denials.length);
console.log("  rows containing an ASSERTION  " + assertions.length);

const cands = [];
for (const d of denials) {
  for (const a of assertions) {
    if (a.cert === d.cert) continue;            /* cross-certification only */
    if (a.slug === d.slug) continue;
    let shared = 0; const common = [];
    for (const w of d.t) if (a.t.has(w)) { shared++; common.push(w); }
    /* ============ AN ABSOLUTE THRESHOLD ATE THE MOTIVATING INSTANCE =======
     *
     * The first version required FOUR shared distinctive terms and found 50
     * candidates -- none of them `auditor-objectivity`, the row this sweep
     * exists for. Its whole description is "the requirement that auditors do
     * not audit their own work": once `auditor`, `audit` and `requirement`
     * are stopworded as corpus-frequent, TWO distinctive terms remain. A
     * seven-word row can never reach four, so the threshold excluded by
     * LENGTH what it was meant to select by MEANING.
     *
     * CLAUDE.md: a guard that cannot catch its own motivating instance is
     * worse than one that fires too often -- it reports clean and retires the
     * question.
     *
     * The threshold is now RELATIVE to the shorter row: half its distinctive
     * terms, floor two. A long row still needs real overlap; a short row is
     * judged on the terms it actually has. */
    const need = Math.max(2, Math.ceil(0.5 * Math.min(d.t.size, a.t.size)));
    if (shared < need) continue;
    cands.push({ denial: d, assertion: a, shared, common: common.slice(0, 10) });
  }
}
cands.sort((x, y) => y.shared - x.shared);
/* One row can pair with many; dedupe by the denial so the list is readable. */
const seen = new Set(); const top = [];
for (const c of cands) {
  const k = c.denial.cert + "/" + c.denial.slug + "|" + c.assertion.cert + "/" + c.assertion.slug;
  if (seen.has(k)) continue; seen.add(k); top.push(c);
}
console.log("  candidate pairs (relative threshold, cross-certification)  " + top.length);

/* ============ THE REGRESSION CONTROL RUNS ON A FIXTURE, NOT ON LIVE DATA ===
 *
 * Its first version asserted that `auditor-objectivity` was surfaced from the
 * LIVE corpus. That worked exactly once. The next run failed -- because the
 * row had been FIXED, so the contradiction it was calibrated against no longer
 * existed.
 *
 * A control that depends on a defect remaining in production is a control that
 * forbids repairing it. Same shape as the `migration tip vs disk` invariant,
 * which asserted the continued presence of a line whose deletion was the fix.
 *
 * So the control runs the matcher against a FIXTURE holding the original text
 * of both rows. It proves the instrument can still see that contradiction
 * whatever the live corpus now says, and it keeps working after the repair. */
const FIXTURE = {
  assertion: { cert: "FIXTURE-A", slug: "auditor-objectivity",
    name: "Auditor objectivity",
    description: "the requirement that auditors do not audit their own work" },
  denial: { cert: "FIXTURE-B", slug: "independence-remedy",
    name: "Internal auditor independence",
    description: "ISO 19011:2026 clause 4.6 states that where it is not possible for internal " +
      "auditors to be independent of the activity being audited, every effort should be made to " +
      "remove bias and encourage objectivity. Neither ISO 19011 nor ISO/IEC 27001 contains a rule " +
      "that an auditor may not audit their own work - that formulation is practice convention." },
};
{
  const d = { ...FIXTURE.denial, t: terms(FIXTURE.denial.name + " " + FIXTURE.denial.description) };
  const a = { ...FIXTURE.assertion, t: terms(FIXTURE.assertion.name + " " + FIXTURE.assertion.description) };
  const isDenial = DENIAL.test(d.description), isAssertion = ASSERTION.test(a.description);
  let shared = 0;
  for (const w of d.t) if (a.t.has(w)) shared++;
  const need = Math.max(2, Math.ceil(0.5 * Math.min(d.t.size, a.t.size)));
  if (!isDenial || !isAssertion || shared < need) {
    console.error("");
    console.error("REGRESSION CONTROL FAILED on the fixture: denial=" + isDenial +
                  " assertion=" + isAssertion + " shared=" + shared + " need=" + need);
    console.error("The matcher can no longer see the contradiction it was built for.");
    console.error("No list is reported -- a clean list from a blind guard retires the question.");
    process.exit(2);
  }
  console.log("  regression control: the founding contradiction is still detectable (fixture, shared " +
              shared + " >= " + need + ")");
}
/* And report whether it still exists LIVE, which is a different question. */
const stillLive = top.some((c) => c.assertion.slug === "auditor-objectivity");
console.log("  the founding contradiction in the LIVE corpus: " + (stillLive ? "STILL PRESENT" : "resolved"));

console.log("");
console.log("TOP CANDIDATES -- read these; the count means nothing until you do:");
for (const c of top.slice(0, 20)) {
  console.log("");
  console.log("  shared " + c.shared + ": " + c.common.join(", "));
  console.log("    DENIES    " + c.denial.cert.padEnd(9) + c.denial.slug);
  console.log("       " + c.denial.description.slice(0, 150));
  console.log("    ASSERTS   " + c.assertion.cert.padEnd(9) + c.assertion.slug);
  console.log("       " + c.assertion.description.slice(0, 150));
}

writeFileSync(join(ROOT, "REQUIREMENT-CONTRADICTION-CANDIDATES.json"), JSON.stringify({
  measured: "2026-09-22",
  what_this_is: "CANDIDATES for a human. A denial and an assertion from two certifications sharing at least four distinctive terms. Two rows can share vocabulary and not contradict; two rows can contradict sharing none. It decides nothing.",
  occasion: "ISMS-F served 'the requirement that auditors do not audit their own work' while AIMS-IA and ISMS-IA both denied any such rule exists. Nothing checked a row against another row.",
  totals: { live: live.length, denials: denials.length, assertions: assertions.length, candidate_pairs: top.length },
  candidates: top.map((c) => ({
    shared_terms: c.shared, common: c.common,
    denial: { cert: c.denial.cert, slug: c.denial.slug, description: c.denial.description },
    assertion: { cert: c.assertion.cert, slug: c.assertion.slug, description: c.assertion.description },
  })),
}, null, 2), "utf8");
console.log("");
console.log("wrote REQUIREMENT-CONTRADICTION-CANDIDATES.json");
