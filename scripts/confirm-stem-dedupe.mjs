/**
 * confirm-stem-dedupe.mjs -- prove no assembled form can carry two items that are
 * the same question, in any language.
 *
 * READ-ONLY. No writes, no sessions, no voucher attempts. Unknown flags exit 2.
 *
 * ============ WHY THIS AND NOT 50 LIVE FORMS PER LANGUAGE ============
 *
 * The obvious confirmation is to call the deployed function 50 times per language
 * for AIE-I and SM-AI-I -- 300 calls -- and look for duplicates. Both modes make
 * that unacceptable:
 *
 *   mode = "exam"       calls consumeAttempt() and BURNS A VOUCHER ATTEMPT. 300
 *                       calls would destroy 300 real entitlements.
 *   mode = "simulator"  writes a quiz_session and one exam_session_items row per
 *                       presented item. 300 calls is ~300 sessions and ~24,000
 *                       item rows, in the exact tables ITEM-EXPOSURE.md reads to
 *                       answer "who has been scored on a translated item".
 *                       Measuring a surface must not be the heaviest thing that
 *                       surface has seen, and it must not corrupt the evidence.
 *
 * So the confirmation is EXHAUSTIVE rather than sampled, which is also stronger.
 * 50 forms sample the space of possible forms; this asserts the property that
 * makes every possible form safe:
 *
 *   for every certification x language x domain, the pool the picker dedupes
 *   contains no two rows sharing a `stemIdentity`.
 *
 * If that holds, no draw from it can carry a duplicate family -- no sampling
 * needed. It imports the SAME module the deployed function imports, so it is
 * testing the deployed rule and not a description of it.
 *
 * ============ AND THE SECOND RISK IS THE OPPOSITE ONE ============
 *
 * A dedupe that catches MORE removes more rows from the pool. In es-419 and pt-BR
 * it now removes rows it previously kept, so a domain could fall below its quota
 * and the form would fail to assemble -- trading a silent integrity defect for a
 * loud outage. Both directions are checked.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { acquireHeavyReaderLock } from "./lib/heavy-reader-lock.mjs";
import { normStem, stemIdentity, dedupeByIdentity, stemIdentityControls }
  from "../functions/_shared/item-rules/stem-identity.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY, takes none");
  process.exitCode = 2; process.exit();
}

/* The module's own fixtures run first. A confirmation built on a broken rule
 * reports clean. */
const ctl = stemIdentityControls();
if (ctl.length) {
  console.error("SHARED-RULE FIXTURES FAILED -- nothing confirmed:");
  for (const c of ctl) console.error("  " + c);
  process.exitCode = 2; process.exit();
}

const KEY = requireKey(HERE);
const release = await acquireHeavyReaderLock("confirm-stem-dedupe");
try {
  const certs = await getAll(KEY, "certifications?select=id,code,num_questions&order=id");
  const domains = await getAll(KEY, "domains?select=id,code,certification_id,weight_pct&order=id");
  const tasks = await getAll(KEY, "tasks?select=id,domain_id&order=id");
  const domainByTask = new Map(tasks.map((t) => [t.id, t.domain_id]));

  /* TWO READS, NOT ONE WIDE ONE. Fetching `question_text` for all 27k rows timed
   * out the statement -- it is only needed for the English side, and the identity
   * of a translated row never depends on its own text. Narrower reads, same
   * answer. */
  const rows = await getAll(KEY,
    "quiz_questions?select=id,question_group_id,certification_id,language,pool,task_id&status=eq.approved&retired_at=is.null&order=id");
  const enRows = await getAll(KEY,
    "quiz_questions?select=question_group_id,question_text&language=eq.en&status=eq.approved&retired_at=is.null&order=question_group_id");

  /* The English stem per group -- the same map the function builds. */
  const englishStemByGroup = new Map();
  for (const r of enRows) {
    if (r.question_group_id && r.question_text) {
      englishStemByGroup.set(r.question_group_id, normStem(r.question_text));
    }
  }
  console.log("CONFIRM STEM DEDUPE -- read-only, exhaustive, using the deployed module");
  console.log("  shared-rule fixtures pass (6 real families, both negative controls)");
  console.log("  English stems indexed     " + englishStemByGroup.size + " group(s)");
  console.log("");

  /* Largest-remainder quota, as generate-mock-exam computes it. */
  function quotas(certId, target) {
    const ds = domains.filter((d) => d.certification_id === certId);
    const tot = ds.reduce((s, d) => s + Number(d.weight_pct), 0) || 100;
    const qs = ds.map((d) => {
      const exact = (target * Number(d.weight_pct)) / tot;
      return { d, q: Math.floor(exact), rem: exact - Math.floor(exact) };
    });
    let left = target - qs.reduce((s, r) => s + r.q, 0);
    for (const r of [...qs].sort((a, b) => b.rem - a.rem)) { if (left-- > 0) r.q++; }
    return qs;
  }

  const survivors = [];   // duplicate identities surviving the dedupe -- must be empty
  const shortfalls = [];  // domains that fall below quota BECAUSE of the dedupe
  const removed = [];     // what the dedupe now removes, per cert/lang/pool
  let combos = 0;

  for (const pool of ["secure", "practice"]) {
    for (const c of certs) {
      const target = pool === "secure" ? (c.num_questions ?? 40) : (c.num_questions ?? 40);
      for (const lang of ["en", "es-419", "pt-BR"]) {
        const mine = rows.filter((r) => r.certification_id === c.id && r.language === lang && r.pool === pool);
        if (!mine.length) continue;
        combos++;
        for (const { d, q } of quotas(c.id, target)) {
          const inDomain = mine.filter((r) => domainByTask.get(r.task_id) === d.id);
          if (!inDomain.length) continue;
          const after = dedupeByIdentity(inDomain, englishStemByGroup);
          /* (1) no two survivors share an identity */
          const ids = after.map((r) => stemIdentity(r, englishStemByGroup));
          if (new Set(ids).size !== ids.length) {
            survivors.push({ cert: c.code, lang, pool, domain: d.code });
          }
          /* (2) the domain still fills its quota after the stricter dedupe */
          if (after.length < q) {
            shortfalls.push({ cert: c.code, lang, pool, domain: d.code, quota: q,
              before: inDomain.length, after: after.length });
          }
          if (after.length !== inDomain.length) {
            removed.push({ cert: c.code, lang, pool, domain: d.code,
              removed: inDomain.length - after.length, after: after.length, quota: q });
          }
        }
      }
    }
  }

  console.log("  certification x language x pool combinations examined  " + combos);
  if (!combos) console.log("  VACUOUS: nothing was examined");
  console.log("");
  console.log("(1) DUPLICATE IDENTITIES SURVIVING THE DEDUPE: " + survivors.length +
    (survivors.length ? "  <- a form could carry one" : "   <- no form in any language can carry a duplicate family"));
  for (const s of survivors) console.log("      " + s.cert + " " + s.lang + " " + s.pool + " " + s.domain);

  console.log("");
  console.log("(2) DOMAINS FALLING BELOW QUOTA BECAUSE OF THE STRICTER DEDUPE: " + shortfalls.length +
    (shortfalls.length ? "  <- a form would fail to assemble" : "   <- every domain still fills"));
  for (const s of shortfalls) {
    console.log("      " + s.cert + " " + s.lang + " " + s.pool + " " + s.domain +
      "  quota " + s.quota + "  " + s.before + " -> " + s.after);
  }

  console.log("");
  console.log("WHAT THE DEDUPE NOW REMOVES (rows dropped before the pick)");
  if (!removed.length) console.log("  nothing anywhere -- which would mean the rule is not firing at all");
  const byLang = new Map();
  for (const r of removed) {
    const k = r.lang + " " + r.pool;
    byLang.set(k, (byLang.get(k) || 0) + r.removed);
  }
  for (const [k, n] of [...byLang].sort()) console.log("  " + k.padEnd(18) + n + " row(s)");
  for (const r of removed.filter((x) => x.pool === "secure")) {
    console.log("      " + r.cert.padEnd(10) + r.lang.padEnd(8) + r.domain.padEnd(5) +
      "removes " + r.removed + ", leaves " + r.after + " against quota " + r.quota);
  }

  const path = join(ROOT, "STEM-DEDUPE-CONFIRM.json");
  writeFileSync(path, JSON.stringify({ combos, survivors, shortfalls, removed }, null, 2) + "\n", "utf8");
  console.log("");
  console.log("wrote " + path);
  process.exitCode = (survivors.length || shortfalls.length) ? 1 : 0;
} finally { release(); }
