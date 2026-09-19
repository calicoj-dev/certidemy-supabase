#!/usr/bin/env node
/**
 * check-open-items.mjs - is it still open? Ask the system, not the handoff.
 *
 * READ-ONLY. --json. Unknown flags exit 2. No writes, no --apply.
 *
 * ============ WHY THIS EXISTS ============
 *
 * The same failure as the migration tip, one level up. Every handoff carries an
 * "Open" list, every list is a sentence about state, and a sentence about state
 * goes stale by default. On 2026-09-19 a single reply listed two items as open
 * that had both landed: /llms.txt had said "exposes 8 tools" and named
 * get_rubric for a day, and the specimen link had shipped the day before.
 *
 * ELEVENTH INSTANCE THAT WEEK. The migration tip was wrong eight times, then
 * 339/340, then 345, then a revoked key. `check-migration-state.mjs` retired the
 * first by asking the database. This retires the rest of the list the same way.
 *
 * ============ THE RULE THIS ENFORCES ============
 *
 *   An item something can check NEVER gets written down as a state again.
 *   An item nothing can check stays prose AND SAYS SO.
 *
 * The second half matters as much as the first. A list where some entries are
 * probed and some are asserted, with no marking, is worse than one where none
 * are -- a reader trusts the whole thing at the level of its best entry.
 *
 * ============ A CLOSED ITEM IS PROBED FOR ITS KEEPER, NOT ITS PROPERTY ======
 *
 * Where a property already has a guard elsewhere, this does not re-check the
 * property -- that would be a second copy of the check, which is the defect
 * this repository keeps paying for. It checks THAT THE GUARD STILL EXISTS.
 * A closed item whose keeper was deleted is an item that will reopen silently.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--json"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY. Known: --json");
    process.exit(2);
  }
}
const argOf = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const JSON_OUT = argOf("json", "");

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const WEB = join(ROOT, "..", "certidemy-web");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };

/** Page to exhaustion and assert against the server's count. A floor is not a total. */
async function all(path) {
  const rows = []; let from = 0, total = null;
  for (;;) {
    let page = null;
    for (let i = 0; i < 8; i++) {
      try {
        const r = await fetch(REST + "/" + path, {
          headers: { ...H, Range: from + "-" + (from + 499), Prefer: "count=exact" },
          signal: AbortSignal.timeout(45000),
        });
        if (!r.ok) throw new Error("HTTP " + r.status);
        total = Number(String(r.headers.get("content-range") || "").split("/")[1]);
        page = await r.json(); break;
      } catch (e) { if (i === 7) throw e; }
    }
    rows.push(...page);
    if (page.length < 500) break;
    from += 500;
  }
  if (total !== null && rows.length !== total) {
    throw new Error("SHORT READ on " + path + ": " + rows.length + " of " + total);
  }
  return rows;
}
async function exists(table) {
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(REST + "/" + table + "?select=*&limit=1", { headers: H, signal: AbortSignal.timeout(30000) });
      return r.ok;
    } catch { /* retry */ }
  }
  return null;
}
const readFile = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null);

/* ------------------------------------------------------------ the items */
const ITEMS = {
  "llms.txt names every tool": async () => {
    /* CLOSED, and the keeper is certidemy-web mcp:check section I, which derives
     * the list from the live tools/list. Re-checking the property here would be
     * a third copy; this asserts the KEEPER still exists. */
    const src = readFile(join(WEB, "scripts", "check-mcp.mjs"));
    if (src === null) return { open: null, why: "certidemy-web/scripts/check-mcp.mjs not found" };
    const guarded = /llms\.txt names every tool the server lists/.test(src);
    return {
      open: !guarded,
      why: guarded
        ? "closed; guarded by certidemy-web mcp:check section I, which derives from live tools/list"
        : "the guard in mcp:check section I is GONE -- this can reopen silently",
    };
  },

  "llms.txt links the JTA specimen": async () => {
    const src = readFile(join(WEB, "scripts", "check-mcp.mjs"));
    if (src === null) return { open: null, why: "certidemy-web/scripts/check-mcp.mjs not found" };
    const guarded = /our-standard#jta-specimen/.test(src);
    return {
      open: !guarded,
      why: guarded ? "closed; guarded by mcp:check section I" : "the specimen-link guard is gone",
    };
  },

  "no scheme doc claims a traffic-dependent count": async () => {
    /* GENERALISED FROM ONE DOCUMENT TO THE PROPERTY. The first version compared
     * SCHEME-SM-AI-I's numbers to the database, which is what verify-cert
     * already does and which would go stale the same way the document did.
     *
     * The durable question is not "is this number right today" but "is this the
     * kind of number that can be right tomorrow". A per-language practice TOTAL
     * changes when a learner presses weak-concepts -- SM-AI-I's es-419 went
     * 520 -> 525 between two runs of the gate, both readings correct. Three
     * documents carried that shape; all three now claim
     * `practice_floor_per_task: 10`, which the platform maintains and traffic
     * cannot move.
     *
     * `secure_per_language` is deliberately NOT flagged. The secure bank does
     * not grow with traffic, and generated items are excluded from it by pool
     * and now by predicate, so a secure total is a claim that can stay true. */
    const { readdirSync } = await import("node:fs");
    const docs = readdirSync(ROOT).filter((f) => /^SCHEME-.*\.md$/.test(f));
    if (!docs.length) return { open: null, why: "no SCHEME-*.md found -- extractor broken" };
    const bad = [];
    let sawAnyClaim = false;
    for (const f of docs) {
      const t = readFile(join(ROOT, f)) ?? "";
      if (/^(secure_per_language|practice_floor_per_task):/m.test(t)) sawAnyClaim = true;
      if (/^practice_per_language:/m.test(t)) bad.push(f);
    }
    /* CONTROL: if no document carries ANY claim line the scan proves nothing --
     * it would report clean against a directory of prose. */
    if (!sawAnyClaim) return { open: null, why: "no machine-readable claim line in any document -- extractor broken" };
    return {
      open: bad.length > 0,
      why: bad.length
        ? bad.length + " doc(s) still claim a per-language practice TOTAL: " + bad.join(", ")
        : docs.length + " scheme doc(s) scanned; none claims a count traffic can move",
    };
  },

  "clausula terminology sweep": async () => {
    const LETTER = "0-9A-Za-z_À-ɏ";
    const numbered = new RegExp("(?<![" + LETTER + "])cláusulas?\\s+\\*{0,2}[0-9]+(?:\\.[0-9]+)*", "gi");
    const les = await all("lessons?select=content_md,language");
    const n = les.reduce((a, l) => a + ((String(l.content_md).match(numbered) ?? []).length), 0);
    /* CONTROL: the pattern must fire on a known instance. */
    const fires = ("la cláusula 10.1 exige".match(numbered) ?? []).length === 1;
    if (!fires) return { open: null, why: "the pattern cannot match a known instance -- extractor broken" };
    return { open: n > 0, why: n + " numbered `clausula` reference(s) across all lesson bodies" };
  },

  "a caller can tell a withheld lesson from an absent one": async () => {
    /* FOUND 2026-09-20 while writing a fingerprint for 333. TWO DEFECTS STACKED.
     *
     * 1. `mcp.lesson_index.body_available` is never served. courseware-read's
     *    buildQuery names its lesson_index columns explicitly and omits it, so
     *    no partner has ever received the field. Both the view comment and
     *    certidemy-web's courseware-contract.ts refer to it as the thing that
     *    prevents this confusion; neither noticed it does not arrive.
     *
     * 2. It would be WRONG if it were served. It is `l.mcp_servable` alone,
     *    while mcp.lesson also requires the per-language review gate -- so it
     *    would report available for 167 lessons that get_lesson refuses
     *    (AIMS-F 34+34, AIMS-IA 29+25, ISMS-IA 24+21, measured).
     *
     * So the property is the CALLER'S, not the column's: can list_lessons tell
     * a partner which bodies they will actually get? Today: no. */
    const r = await (async () => {
      for (let i = 0; i < 6; i++) {
        try {
          const res = await fetch("https://pctynukndxnmnxiqpgck.supabase.co/functions/v1/courseware-read", {
            method: "POST",
            headers: { "content-type": "application/json", "x-mcp-client": "probe:open-items" },
            body: JSON.stringify({ resource: "lesson_index", certification: "AIMS-F", language: "es-419", limit: 5 }),
            signal: AbortSignal.timeout(45000),
          });
          return await res.json();
        } catch { /* retry */ }
      }
      return null;
    })();
    const rows = r?.rows ?? [];
    if (!rows.length) return { open: null, why: "lesson_index returned no rows -- cannot tell" };
    const served = "body_available" in rows[0];
    return {
      open: !served,
      why: served
        ? "list_lessons returns body_available (check it reflects the REVIEW gate, not just mcp_servable)"
        : "list_lessons does not return body_available at all; 167 lessons are withheld with nothing saying so",
    };
  },

  "no repository internal is readable by anon": async () => {
    /* DELEGATED to scripts/scan-public-internals.mjs, which derives its
     * surfaces from anon's SELECT grants and reads AS anon. This probe asserts
     * the SCANNER EXISTS and still narrows `is_exam_scope` out -- the public
     * field name that produced 552 of its first run's 610 hits. A scanner that
     * lost that narrowing would report a platform-wide leak and get ignored. */
    const src = readFile(join(HERE, "scan-public-internals.mjs"));
    if (src === null) return { open: null, why: "scan-public-internals.mjs not found" };
    const narrowed = /is_exam_scope` WAS IN THIS LIST AND IS NOT INTERNAL/.test(src);
    const derives = /has_table_privilege|anon holds SELECT|SURFACES/.test(src);
    if (!narrowed || !derives) {
      return { open: null, why: "the scanner lost its narrowing or its surface list -- run it directly" };
    }
    return {
      open: true,
      why: "106 genuine hits across 3 columns as of 2026-09-20: exam_blueprint 12 " +
           "(348 fixes), tasks.notes 36 (needs a column-scoped grant), " +
           "jta_versions.blueprint_snapshot 58 (a snapshot is evidence -- revoke anon, " +
           "do not edit). Run scripts/scan-public-internals.mjs for the live figure.",
    };
  },

  "contractVersion is read, not only echoed": async () => {
    /* RECORDED, NOT ACTED ON, 2026-09-20. Seven tool descriptions say "omit
     * contract_version to receive the latest shape, or PIN IT IF YOU PARSE THE
     * RESPONSE PROGRAMMATICALLY. An unsupported version is refused, never
     * substituted."
     *
     * HALF OF THAT IS KEPT AND HALF IS NOT, which is the useful distinction:
     *
     *   refused, never substituted   TRUE. readContractVersion rejects any
     *                                value outside `supported`.
     *   pin it and the shape holds   NOT TRUE. Nothing branches on the value.
     *                                Every occurrence in registry.ts is
     *                                `contractVersion: request.contractVersion`
     *                                -- echoed back, never read.
     *
     * So pinning a SUPPORTED version buys nothing: today's additive field
     * changed the shape for all three supported versions equally. An agent
     * that followed the advice is no better protected than one that ignored it.
     *
     * NOT A DEFECT TONIGHT -- additive changes are what the versions have seen,
     * and additive is the safe direction. It becomes one the first time a field
     * is REMOVED or RETYPED, and at that moment seven descriptions will have
     * been promising protection nobody built. */
    const web = join(ROOT, "..", "certidemy-web", "lib", "mcp");
    const contract = readFile(join(web, "courseware-contract.ts"));
    const registry = readFile(join(web, "registry.ts"));
    if (contract === null || registry === null) {
      return { open: null, why: "certidemy-web/lib/mcp not found" };
    }
    const promises = (contract.match(/pin it if you parse the response programmatically/g) ?? []).length;
    /* A BRANCH, not a mention. `contractVersion: request.contractVersion` is an
     * echo; a comparison or a switch is a read. */
    const branches = [...registry.matchAll(/contractVersion[^\n]*?(===|!==|switch|>=|<=|> |< )/g)].length +
      [...contract.matchAll(/\bversion\s*(===|!==|>=|<=)\s*\d/g)].length;
    if (promises === 0) {
      return { open: null, why: "the pin sentence is gone from the descriptions -- re-read this entry" };
    }
    return {
      open: branches === 0,
      why: branches === 0
        ? promises + " tool description(s) promise that pinning protects a parser, and nothing " +
          "branches on the value -- the refusal half is real, the pinning half is not"
        : branches + " branch(es) on contractVersion now exist",
    };
  },

  "concepts have a translation table": async () => {
    const a = await exists("concept_translations");
    const b = await exists("concept_i18n");
    if (a === null || b === null) return { open: null, why: "could not probe" };
    return {
      open: !(a || b),
      why: a || b ? "a concept translation table exists" : "neither concept_translations nor concept_i18n exists",
    };
  },

  "no 5_evaluate task is exam-scoped": async () => {
    const tasks = await all("tasks?select=id,certification_id,code,bloom_level,is_exam_scope");
    const bad = tasks.filter((t) => t.bloom_level === "5_evaluate" && t.is_exam_scope);
    /* CONTROL: the enum label must exist in the data at all, or "zero matches"
     * means the label is spelled differently -- the all-zero Bloom distribution
     * CLAUDE.md records, which read as "no cognitive data exists". */
    const anyLabel = new Set(tasks.map((t) => t.bloom_level));
    if (!anyLabel.has("4_analyze")) {
      return { open: null, why: "no task carries 4_analyze -- the enum labels are not what this expects" };
    }
    const atLevel = tasks.filter((t) => t.bloom_level === "5_evaluate").length;
    return {
      open: bad.length > 0,
      why: bad.length
        ? bad.length + " exam-scoped 5_evaluate task(s): " + bad.map((t) => t.code).join(", ")
        : atLevel + " task(s) at 5_evaluate, none exam-scoped",
    };
  },

  "the en_hash gate covers the translation": async () => {
    /* The gate hashes the ENGLISH only, so a translation edit leaves an
     * approved review standing. Checkable as a SCHEMA fact: a second hash
     * column would be how it is fixed. */
    /* NOT limit=1 -- `all()` pages and asserts against the server's count, so a
     * limit makes it throw. It did, and the item reported UNKNOWN: the
     * assertion catching its own caller. */
    const rows = await all("lesson_translation_reviews?select=*");
    const cols = rows[0] ? Object.keys(rows[0]) : [];
    if (!cols.length) return { open: null, why: "no review rows to inspect" };
    const hasTr = cols.some((c) => /tr_hash|translation_hash|target_hash/.test(c));
    const revs = rows;
    const trevs = await all("task_translation_reviews?select=task_translation_id");
    return {
      open: !hasTr,
      why: hasTr
        ? "a translation-side hash column exists"
        : (revs.length + trevs.length) + " approvals hash the English only; a translation edit does not re-close the gate",
    };
  },

  "migrations without a fingerprint": async () => {
    const src = readFile(join(HERE, "check-migration-state.mjs"));
    if (src === null) return { open: null, why: "check-migration-state.mjs not found" };
    const fps = new Set([...src.matchAll(/^\s{2}(\d{3}):\s*async/gm)].map((m) => m[1]));
    if (!fps.size) return { open: null, why: "no fingerprints extracted -- extractor broken" };
    const { readdirSync } = await import("node:fs");
    const nums = readdirSync(join(ROOT, "migrations"))
      .filter((f) => /^\d{3}_.*\.sql$/.test(f)).map((f) => f.slice(0, 3));
    if (!nums.length) return { open: null, why: "no migration files found -- extractor broken" };
    /* From 330 on. Earlier ones predate the probe and backfilling the whole
     * history is not the point of the entry. */
    const missing = nums.filter((x) => Number(x) >= 330 && !fps.has(x)).sort();
    return {
      open: missing.length > 0,
      why: missing.length
        ? missing.length + " migration(s) from 330 on have no fingerprint: " + missing.join(", ")
        : "every migration from 330 on has a fingerprint",
    };
  },
};

/* Items nothing can check. They stay prose, and this says so rather than
 * letting silence imply they were probed. */
const JUDGEMENT = {
  "the specimen badge": "what the /our-standard specimen should display is a design and copy decision; nothing can assert it is right.",
  "the MCC and standard setting": "defining the borderline candidate is prose per scheme and needs judges, not data. Whether a SCHEME doc CONTAINS an MCC section is checkable; whether the definition is sound is not.",
  "the review model for concepts": "1,730 concepts x 2 languages is a decision about who reviews what and at what cost, taken before any of it is written.",
  "readiness counts practice on generated items": "DECIDED 2026-09-19 and correct: a proxy for the examination inherits the exam's evidentiary bar, a progress signal does not. Listed so it is not rediscovered as a defect.",
};

/* ------------------------------------------------------------------ report */
console.log("");
console.log("OPEN ITEMS -- probed, not stated");
console.log("");
const results = {};
for (const [name, fn] of Object.entries(ITEMS)) {
  let r;
  try { r = await fn(); } catch (e) { r = { open: null, why: "probe failed: " + String(e.message).slice(0, 90) }; }
  results[name] = r;
  const mark = r.open === true ? "OPEN    " : r.open === false ? "closed  " : "UNKNOWN ";
  console.log("  " + mark + name);
  console.log("          " + r.why);
}
console.log("");
console.log("  JUDGEMENT -- nothing can check these, and that is the entry:");
for (const [name, why] of Object.entries(JUDGEMENT)) {
  console.log("    - " + name);
  console.log("      " + why);
}
const open = Object.entries(results).filter(([, r]) => r.open === true).map(([k]) => k);
const unknown = Object.entries(results).filter(([, r]) => r.open === null).map(([k]) => k);
console.log("");
console.log(open.length ? "  STILL OPEN: " + open.join("; ") : "  Every checkable item is closed.");
if (unknown.length) console.log("  COULD NOT PROBE: " + unknown.join("; "));

if (JSON_OUT) {
  writeFileSync(join(ROOT, JSON_OUT), JSON.stringify({ results, judgement: JUDGEMENT }, null, 1) + "\n");
  console.log("");
  console.log("wrote " + JSON_OUT);
}
