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

  "SCHEME-SM-AI-I practice counts": async () => {
    /* verify-cert owns this as a scheme claim; the probe here is the same
     * comparison so the LIST can answer without a 13-certification run.
     *
     * ============ AND THE FIX IS NOT TO UPDATE THE NUMBER ============
     *
     * verify-cert read 520/520/520 on 2026-09-19 and this read 520/525/520 a
     * day later. Both were right: 520 authored per language, plus FIVE
     * generated items written into es-419 by two learner clicks on
     * weak-concepts in between.
     *
     * So a per-language practice TOTAL in a scheme document is a number that
     * changes when a learner presses a button. It cannot be kept true by
     * editing it, and "update the doc to today's figure" -- which a handoff
     * recommended -- would have been stale on arrival.
     *
     * The scheme should claim what is STABLE and actually promised: the floor
     * of 10 practice items per task per language. That is a property the
     * platform maintains; the total is an artifact of traffic. Until the
     * document changes, this stays OPEN and says why. */
    const doc = readFile(join(ROOT, "SCHEME-SM-AI-I.md"));
    if (doc === null) return { open: null, why: "SCHEME-SM-AI-I.md not found" };
    /* ANCHORED ON THE CLAIM LINE the scheme documents carry for verify-cert --
     * `practice_per_language: 525, 535, 520` -- not on prose. The first version
     * scanned for "<number> items", extracted nothing, and reported UNKNOWN
     * rather than "closed". That is the control doing its job. */
    const line = /^practice_per_language:\s*([0-9,\s]+)$/m.exec(doc);
    const claimed = line ? line[1].split(",").map((x) => Number(x.trim())).filter(Number.isFinite) : [];
    const certs = await all("certifications?select=id,code");
    const cid = certs.find((c) => c.code === "SM-AI-I")?.id;
    const tasks = await all("tasks?select=id,certification_id");
    const ids = new Set(tasks.filter((t) => t.certification_id === cid).map((t) => t.id));
    const q = await all("quiz_questions?select=task_id,language,pool,status,retired_at");
    const live = {};
    for (const r of q) {
      if (!ids.has(r.task_id) || r.pool !== "practice" || r.status !== "approved" || r.retired_at) continue;
      live[r.language] = (live[r.language] ?? 0) + 1;
    }
    const actual = ["en", "es-419", "pt-BR"].map((l) => live[l] ?? 0);
    /* CONTROL: if the document yielded no numbers the comparison is vacuous. */
    if (!claimed.length) return { open: null, why: "no counts extracted from the document -- extractor is broken" };
    /* ORDERED comparison: the claim is en, es-419, pt-BR in that order, and a
     * set comparison would pass on a document carrying the right numbers
     * against the wrong languages. */
    const stale = claimed.length !== actual.length || claimed.some((v, i) => v !== actual[i]);
    return {
      open: stale,
      why: "document claims " + claimed.join("/") + "; database has " + actual.join("/") +
           " (en, es-419, pt-BR). A practice TOTAL drifts with learner traffic -- " +
           "claim the per-task floor instead of updating this number",
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
