// scripts/verify-invariants.mjs
//
// PLATFORM-WIDE INVARIANTS. Read-only. Exits non-zero on any failure, so it can
// gate a build.
//
//   node scripts/verify-invariants.mjs
//   node scripts/verify-invariants.mjs --json
//
// Distinct from verify-cert.mjs, which checks ONE certification's internal
// consistency. These are cross-cutting properties that no single certification
// owns, and every one of them was added because it caught something real or
// because its absence let something real through:
//
//   1. CONCEPT COVERAGE -- every concept has a lesson teaching it.
//      Passing today across all 11 certifications. Frozen now precisely BECAUSE
//      it passes: a certification that later ships with untaught concepts would
//      surface in a partner-facing build plan as "no lesson teaches this",
//      promising licensed material that does not exist.
//
//   2. DRIFT RULE SELF-MATCH -- every regex rule matches its own legacy term.
//      Migration 220 shipped rule 11 with \b, which is BACKSPACE in Postgres.
//      The rule was dead and found nothing. The smoke test passed, because a
//      rule that never fires never produces a false positive. ONLY this check
//      can see a dead rule, and a dead rule looks exactly like a clean document.
//
//   3. DRIFT RULE GROUNDING -- every rule cites an authority citation.
//      NOT NULL in the schema, verified here because a rule grounded in model
//      training knowledge rather than standard text is the attribution failure
//      that produced false "ISO 19011 requires..." claims.
//
//   4. BLUEPRINT WEIGHTS -- domain weights sum to 100 per certification.
//      Every divergence computed against a broken blueprint would be
//      confidently wrong.
//
//   5. ORPHAN CONCEPTS -- every concept is reachable from at least one task.
//      An unlinked concept is unreachable from the JTA, so crediting a source
//      with covering it credits something the blueprint does not assert.
//
//   6. MATCH TERM COLLISIONS -- no term is approved for two concepts.
//      One mention would credit both. Silent double-counting, and it inflates a
//      competitor's readiness -- the one failure in this engine that looks like
//      a good result rather than a bug.

import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { getAll, requireKey } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const asJson = process.argv.includes("--json");
const KEY = requireKey(HERE);
const get = (path) => getAll(KEY, path);

const results = [];
/**
 * Paranoia earned the hard way: report the row counts actually fetched. A future
 * truncation would otherwise present as a wall of plausible-looking failures.
 */
const fetched = {};
/**
 * EVERY INVARIANT REPORTS WHAT IT EXAMINED, and a zero denominator is not a
 * pass.
 *
 * `match term uniqueness` printed PASS for as long as it has existed while
 * looking at NOTHING: `match_terms` is deliberately empty platform-wide, so
 * the check has never had a term to collide. It rendered identically to the
 * six invariants beside it, which between them cover 5,000+ rows, and it
 * inflated the apparent coverage of the suite by one seventh.
 *
 * A pass is a claim that something was examined and held. When the denominator
 * is zero, nothing was examined and the claim is empty -- so it gets its own
 * status rather than borrowing the one that means "checked, and fine".
 *
 * VACUOUS does not fail the suite. A check with nothing to look at is not a
 * defect; reporting it as success is.
 */
const record = (name, failures, detail, examined) => {
  if (!Number.isFinite(examined)) {
    throw new Error(`invariant "${name}" reported no denominator -- every check must say what it examined`);
  }
  results.push({
    name,
    pass: failures.length === 0,
    vacuous: examined === 0,
    examined,
    failures,
    detail,
  });
};

// ------------------------------------------------------------------- pull

const certs = await get("certifications?select=id,code,status&order=code");
const certById = new Map(certs.map((c) => [c.id, c]));
const concepts = await get("concepts?select=id,slug,name,certification_id,match_terms&order=id");
const tasks = await get("tasks?select=id,certification_id,domain_id&order=id");
const domains = await get("domains?select=id,code,certification_id,weight_pct&order=id");
const taskConcepts = await get("task_concepts?select=task_id,concept_id&order=concept_id");
const lessonConcepts = await get("lesson_concepts?select=concept_id&order=concept_id");
const rules = await get(
  "drift_rules?select=id,legacy_term,match_mode,pattern,lang,is_active,authority_citation_id",
);

Object.assign(fetched, {
  certifications: certs.length,
  concepts: concepts.length,
  tasks: tasks.length,
  domains: domains.length,
  task_concepts: taskConcepts.length,
  lesson_concepts: lessonConcepts.length,
  drift_rules: rules.length,
});

// ---------------------------------------------- 1. concept coverage

{
  const taught = new Set(lessonConcepts.map((l) => l.concept_id));
  const failures = concepts
    .filter((c) => !taught.has(c.id))
    .map((c) => `${certById.get(c.certification_id)?.code ?? "?"} / ${c.slug}`);
  record("concept coverage", failures, `${concepts.length} concepts across ${certs.length} certifications`, concepts.length);
}

// ---------------------------------------- 2 & 3. drift rule health

{
  // Same Postgres-to-JS translation as regex.ts. NOT \b: JS word boundaries are
  // ASCII-only and fail on a term whose first or last character is accented,
  // which is most of the future es-419 and pt-BR ruleset.
  const W = "\\p{L}\\p{N}_";
  const toJs = (p) =>
    p
      .replace(/\\m/g, `(?<![${W}])`)
      .replace(/\\M/g, `(?![${W}])`)
      .replace(/\\y/g, `(?:(?<![${W}])|(?![${W}]))`);

  const dead = [];
  for (const r of rules.filter((x) => x.is_active && x.match_mode === "regex")) {
    if (!r.pattern) {
      dead.push(`${r.lang} "${r.legacy_term}": regex mode with null pattern`);
      continue;
    }
    try {
      if (!new RegExp(toJs(r.pattern), "iu").test(r.legacy_term)) {
        dead.push(`${r.lang} "${r.legacy_term}": /${r.pattern}/ does not match its own term`);
      }
    } catch (err) {
      dead.push(`${r.lang} "${r.legacy_term}": ${err.message}`);
    }
  }
  record("drift rule self-match", dead, `${rules.filter((r) => r.is_active).length} active rules`, rules.filter((r) => r.is_active).length);

  const ungrounded = rules
    .filter((r) => r.is_active && !r.authority_citation_id)
    .map((r) => `${r.lang} "${r.legacy_term}"`);
  record("drift rule grounding", ungrounded, "every rule cites actual standard text", rules.filter((r) => r.is_active).length);
}

// ------------------------------------------------- 4. blueprint weights

{
  const byCert = new Map();
  for (const d of domains) {
    byCert.set(d.certification_id, (byCert.get(d.certification_id) ?? 0) + Number(d.weight_pct));
  }
  const failures = [];
  for (const [certId, sum] of byCert) {
    if (Math.abs(sum - 100) > 0.01) {
      failures.push(`${certById.get(certId)?.code ?? certId}: weights sum to ${sum}, not 100`);
    }
  }
  record("blueprint weights", failures, `${byCert.size} certifications`, byCert.size);
}

// ------------------------------------------------- 5. orphan concepts

{
  const linked = new Set(taskConcepts.map((t) => t.concept_id));
  const failures = concepts
    .filter((c) => !linked.has(c.id))
    .map((c) => `${certById.get(c.certification_id)?.code ?? "?"} / ${c.slug}`);
  record("concept reachability", failures, "every concept reachable from a task", concepts.length);
}

// --------------------------------------------- 6. match term collisions

{
  const owners = new Map();
  for (const c of concepts) {
    for (const term of c.match_terms ?? []) {
      const key = `${c.certification_id}::${String(term).toLowerCase().replace(/\s+/g, " ")}`;
      const arr = owners.get(key) ?? [];
      arr.push(c.slug);
      owners.set(key, arr);
    }
  }
  const failures = [];
  for (const [key, slugs] of owners) {
    if (slugs.length > 1) {
      failures.push(`"${key.split("::")[1]}" claimed by ${slugs.join(", ")}`);
    }
  }
  const termCount = concepts.reduce((n, c) => n + (c.match_terms?.length ?? 0), 0);
  record("match term uniqueness", failures, `${termCount} terms authored`, termCount);
}

// ----------------------------------------------------------------- report

// ------------------------------------------- 7. hash writers are declared
//
// A GATE'S STORED VALUE IS WRITTEN ONLY BY THE THING THAT CAN PROVE IT.
// `en_hash` records the English a translation was generated from; `tr_hash`
// records the translated text as reviewed. Every clearance script in this
// repository recomputed them from current source and wrote them, which makes
// every row fresh by construction and means mcp.concept compares against a
// value that was just overwritten with the answer it wanted. The gate stayed
// intact and was never consulted.
//
// The writer set is DECLARED in check-hash-writers.mjs rather than inferred,
// so a new writer fails here and has to be classified deliberately.
{
  const NEWLINE_RE = new RegExp(String.fromCharCode(92) + "r?" + String.fromCharCode(92) + "n");
  const failures = [];
  let examined = 0;
  try {
    const out = execFileSync(process.execPath, [join(HERE, "check-hash-writers.mjs")], {
      encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
    const m = /(\d+) candidate\(s\) examined/.exec(out);
    examined = m ? Number(m[1]) : 0;
  } catch (err) {
    const out = String(err.stdout || "") + String(err.stderr || "");
    const m = /(\d+) candidate\(s\) examined/.exec(out);
    examined = m ? Number(m[1]) : 0;
    for (const line of out.split(NEWLINE_RE)) {
      if (/^\s{2}\S+\.(mjs|sql)\s+\d+ position/.test(line)) failures.push(line.trim());
    }
    if (!failures.length) failures.push("check-hash-writers.mjs exited non-zero: " + out.split(NEWLINE_RE).slice(-4).join(" | "));
  }
  record("hash writers declared", failures,
         "only declared generators write en_hash/tr_hash", examined);
}

// ---------------------------------------------------------------------------
// 8. THE DEPLOYED ENDPOINT SERVES EVERY VIEW IN EVERY LANGUAGE.
//
// Every other invariant here reads the DATABASE with an admin credential. That
// is the right instrument for the properties they assert and it is the wrong
// one for this: mcp.concept reported 158 of 158 serving while every non-English
// read of it answered HTTP 500 from migration 359 onward. The gate was right.
// The claim was that an unauthenticated partner receives the rows, and only the
// deployed function can answer that.
//
// THE CREDENTIAL THE TEST HOLDS IS THE HYPOTHESIS, so this one holds none.
//
// NETWORK, AND THEREFORE VACUOUS WHEN OFFLINE RATHER THAN FAILING. A suite that
// goes red on a train teaches people to read red as normal. Zero cells examined
// is exactly what VACUOUS means and it is the honest rendering: no cell was
// looked at, so nothing is claimed either way.
{
  const NEWLINE_RE = new RegExp(String.fromCharCode(92) + "r?" + String.fromCharCode(92) + "n");
  const failures = [];
  let examined = 0;
  // THE VERDICT COMES FROM THE NUMBER, THE DETAIL FROM THE LINES.
  //
  // This scraped `^\s{4}\S+\s+(en|es-419|pt-BR)\s+...` and called every match a
  // failure. When the accent property was added to the matrix it began printing
  // rows of that exact shape whose first token is **ok** -- so the suite
  // reported `FAIL ... (75 examined)` and listed ten lines that say ok, against
  // a matrix exiting 0 with `75 pass, 0 fail`.
  //
  // An extractor that invents failures is worse than one that misses them: a
  // suite that is permanently red teaches people to read red as normal, which
  // costs more than the check ever returned. The fix is not a better regex --
  // the line shape was never the contract. The summary line is.
  const read = (out) => {
    const m = /denominator: (\d+) cell\(s\) examined/.exec(out);
    examined = m ? Number(m[1]) : 0;
    const v = /(\d+) pass, (\d+) fail, (\d+) unasserted/.exec(out);
    if (!v) return out;                       // no summary: the matrix never finished
    const failed = Number(v[2]), unasserted = Number(v[3]);
    if (!failed && !unasserted) return out;
    // Decorate with whatever lines look like failures, but never let a line
    // CREATE one: if the count says n and nothing scrapes, say so plainly.
    const lines = out.split(NEWLINE_RE).filter((l) =>
      /^\s{4}FAIL\s/.test(l) ||
      (/^\s{4}\S+\s+(en|es-419|pt-BR)\s+\S+\s+\S/.test(l) && !/^\s{4}ok\s/.test(l)));
    failures.push(...(lines.length ? lines.map((l) => l.trim())
      : [failed + " cell(s) failed, " + unasserted + " unasserted; see check-mcp-wire output"]));
    return out;
  };
  try {
    read(execFileSync(process.execPath, ["--dns-result-order=ipv4first", join(HERE, "check-mcp-wire.mjs"), "--quiet"], {
      encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 300000,
    }));
  } catch (err) {
    const out = read(String(err.stdout || "") + String(err.stderr || ""));
    // A control failure means the matrix never ran, so there is nothing to
    // report as a pass OR as a fail -- examined stays 0 and this reads VACUOUS.
    if (!failures.length && examined > 0) {
      failures.push("check-mcp-wire.mjs exited non-zero: " + out.split(NEWLINE_RE).slice(-3).join(" | "));
    }
  }
  record("every mcp view serves on the wire", failures,
         "deployed endpoint, no credential, view x language", examined);
}

// ---------------------------------------------------------------------------
// 9. THE REFUSAL'S CLAIM ABOUT A DIFFERENT ROW.
//
// 371 gave a review-held translation a message saying "the English body is
// available now". True for all 177 rows on the day it shipped, measured by
// hand, and enforced by nothing -- the predicate lived in a COMMENT beside the
// message.
//
// A condition written in a comment is a rule; a condition that runs is a check.
// The same distinction as the deploy gate, and this is the half that was
// missing: if an ISO-held English body ever pairs with a review-held
// translation, the refusal starts lying again in exactly the way 371 fixed.
//
// The denominator is the number of rows that MAKE the claim, not the number of
// lessons -- a check that examined 1,437 rows to test 177 claims would overstate
// what it looked at.
//
// NETWORK, so VACUOUS when offline rather than failing, for the same reason as 8.
{
  const NEWLINE_RE = new RegExp(String.fromCharCode(92) + "r?" + String.fromCharCode(92) + "n");
  const failures = [];
  let examined = 0;
  // Same discipline as 8, and for the same reason: the COUNT is the verdict and
  // the lines are decoration. A scraped line must never be able to invent a
  // failure the script did not report.
  const read = (out) => {
    const m = /DENOMINATOR: (\d+) claim\(s\) examined/.exec(out);
    examined = m ? Number(m[1]) : 0;
    const v = /rows where the claim is FALSE: (\d+)/.exec(out);
    if (!v || Number(v[1]) === 0) return out;
    const lines = out.split(NEWLINE_RE).filter((l) => /^\s{2}FALSE\s+\S/.test(l));
    failures.push(...(lines.length ? lines.map((l) => l.trim())
      : [v[1] + " claim(s) false; see check-refusal-claim output"]));
    return out;
  };
  try {
    read(execFileSync(process.execPath, ["--dns-result-order=ipv4first", join(HERE, "check-refusal-claim.mjs")], {
      encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 300000,
    }));
  } catch (err) {
    const out = read(String(err.stdout || "") + String(err.stderr || ""));
    // UNSOUND or a dead control means nothing was measured: examined stays 0
    // and this reads VACUOUS rather than as a failure it did not observe.
    if (!failures.length && examined > 0) {
      failures.push("check-refusal-claim.mjs exited non-zero: " + out.split(NEWLINE_RE).slice(-3).join(" | "));
    }
  }
  record("refusal claim holds", failures,
         "review-held rows whose English sibling is servable", examined);
}

// ---------------------------------------------------------------------------
// MIGRATION TIP MATCHES THE DISK -- DELETED 2026-09-22. SUCCEEDED, NOT DROPPED.
//
// This asserted that CLAUDE.md carried a parseable
// "Migration tip: NNN. Next free number: NNN." line matching the highest file
// on disk. That line was DELIBERATELY REMOVED from CLAUDE.md, which now says
// so in its own first section: a sentence in a document is a second copy of a
// fact that lives elsewhere, and a second copy goes stale by default. The tip
// was wrong eight times on 2026-09-17 alone.
//
// So the invariant outlived its subject. It asserted the continued presence of
// a line whose deletion WAS the fix, and it failed -- exiting the suite
// non-zero -- against a repository in exactly the intended state. A suite that
// is permanently red teaches people to read red as normal, which costs more
// than this check ever returned.
//
// REPLACED BY `scripts/check-migration-state.mjs`, which does strictly more:
// `ls migrations/` answers the number, and a per-migration fingerprint probed
// against the live database AND the deployed function answers HAS IT RUN --
// the half no file on disk has ever known. A migration with no fingerprint
// reports "no probe" rather than "not run", because silence about a thing is
// not a claim about it.

if (asJson) {
  console.log(JSON.stringify({
    pass: results.every((r) => r.pass),
    held: results.filter((r) => r.pass && !r.vacuous).length,
    vacuous: results.filter((r) => r.vacuous).length,
    failed: results.filter((r) => !r.pass).length,
    results,
  }, null, 2));
} else {
  console.log("PLATFORM INVARIANTS\n");
  console.log(
    "  fetched: " +
      Object.entries(fetched).map(([k, v]) => `${k}=${v}`).join("  ") +
      "\n",
  );
  for (const r of results) {
    const status = !r.pass ? "FAIL   " : r.vacuous ? "VACUOUS" : "pass   ";
    console.log(`  ${status}  ${r.name.padEnd(24)} ${r.detail}  (${r.examined} examined)`);
    // Failures are listed in full up to a limit. A truncated failure list makes
    // people fix the visible ones and re-run, which is slower than showing them.
    for (const f of r.failures.slice(0, 25)) console.log(`          - ${f}`);
    if (r.failures.length > 25) console.log(`          ... ${r.failures.length - 25} more`);
  }
  const failed = results.filter((r) => !r.pass);
  const vacuous = results.filter((r) => r.pass && r.vacuous);
  const held = results.length - failed.length - vacuous.length;
  // THREE COUNTS, NEVER TWO. "6/7 invariants hold" cannot say whether the
  // sixth looked at anything, and that is exactly what this suite was getting
  // wrong: one of the six examined zero rows.
  console.log(`\n${held} pass, ${vacuous.length} vacuous, ${failed.length} fail`);
  if (vacuous.length) {
    console.log("\n  VACUOUS -- examined nothing, so the pass claims nothing:");
    for (const v of vacuous) console.log(`    - ${v.name}: ${v.detail}`);
  }
}

process.exit(results.every((r) => r.pass) ? 0 : 1);
