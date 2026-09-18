#!/usr/bin/env node
/**
 * check-migration-state.mjs - has it RUN? Ask the database, not a note.
 *
 * READ-ONLY. --verbose, --json. Unknown flags exit 2. No writes, no --apply.
 *
 * ============ WHY THIS EXISTS ============
 *
 * CLAUDE.md stated the migration tip in prose. On 2026-09-17 alone that line was
 * wrong EIGHT times, and the number was rarely the wrong half -- the STATUS was.
 * "336 is written and has not run" while 336 had run; "339 and 340 are written
 * and have not run" while both had. A sentence in a file is a second copy of a
 * fact that lives in the database, and a second copy goes stale by default.
 *
 * `ls migrations/ | tail -1` answers "what is the next free number" and has
 * always been reliable, because the folder IS that fact. Nothing answered "has
 * it run", so the answer got written down, and writing it down is what breaks.
 *
 * ============ HOW IT ANSWERS ============
 *
 * Every migration leaves a fingerprint -- a table, a column, a row count, a
 * reachable certification. This probes the fingerprint. It is the same move as
 * "verify against pg_catalog, not against this line", made runnable so nobody
 * has to remember to make it.
 *
 * TWO SURFACES, because the `mcp` schema is not reachable through PostgREST
 * (42501, permission denied for schema mcp):
 *
 *   public tables and columns  -> PostgREST
 *   anything in `mcp`          -> the DEPLOYED FUNCTION, which is also the only
 *                                 way to learn whether the function was
 *                                 redeployed, and is what a partner actually
 *                                 hits
 *
 * ============ WHEN YOU ADD A MIGRATION ============
 *
 * Add its fingerprint to FINGERPRINTS below in the same commit. A migration with
 * no fingerprint reports "no probe" rather than "not run" -- silence about a
 * thing is not a claim about it, and that distinction is the reason this file
 * is trustworthy where the prose line was not.
 */
import { readFileSync, existsSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--verbose", "--json"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY. Known: " + [...KNOWN].join(", "));
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const JSON_OUT = arg("json", "");

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
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
const FN = "https://pctynukndxnmnxiqpgck.supabase.co/functions/v1/courseware-read";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };

/** Row count of a public table, or null if it does not exist. */
async function count(table) {
  let last;
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(REST + "/" + table + "?select=*&limit=1",
        { headers: { ...H, Prefer: "count=exact" }, signal: AbortSignal.timeout(45000) });
      if (r.status === 404) return null;
      const body = await r.text();
      if (!r.ok) return body.includes("does not exist") ? null : undefined;
      return Number(String(r.headers.get("content-range") || "").split("/")[1]);
    } catch (e) { last = e; }
  }
  throw last;
}
/** Does a public table have a column? */
async function hasColumn(table, col) {
  let last;
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(REST + "/" + table + "?select=" + col + "&limit=1",
        { headers: H, signal: AbortSignal.timeout(45000) });
      return r.ok;
    } catch (e) { last = e; }
  }
  throw last;
}
/** Ask the deployed function. */
async function fn(body) {
  let last;
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(FN, {
        method: "POST",
        headers: { "content-type": "application/json", "x-mcp-client": "probe:migration-state" },
        body: JSON.stringify(body), signal: AbortSignal.timeout(45000),
      });
      const t = await r.text();
      let j = null;
      try { j = JSON.parse(t); } catch { /* not json */ }
      return { status: r.status, json: j };
    } catch (e) { last = e; }
  }
  throw last;
}

/* ------------------------------------------------------------ fingerprints */
const FINGERPRINTS = {
  332: async () => {
    const p = await count("mcp_leak_policy");
    const c = await hasColumn("lessons", "mcp_servable");
    return { ran: p === 1 && c, why: "mcp_leak_policy rows=" + p + ", lessons.mcp_servable=" + c };
  },
  335: async () => {
    const n = await count("lesson_translation_reviews");
    return { ran: n !== null && n !== undefined, why: "lesson_translation_reviews exists, " + n + " row(s)" };
  },
  336: async () => {
    const r = await fn({ resource: "certification", certification: "AIMS-IA" });
    return { ran: r.status === 200 && (r.json?.rows?.length ?? 0) === 1, why: "AIMS-IA reachable: HTTP " + r.status };
  },
  337: async () => {
    const r = await fn({ resource: "certification", certification: "ISMS-IA" });
    return { ran: r.status === 200 && (r.json?.rows?.length ?? 0) === 1, why: "ISMS-IA reachable: HTTP " + r.status };
  },
  338: async () => {
    const r = await fn({ resource: "task", certification: "ISMS-F", task_code: "2.1", language: "en" });
    const has = r.status === 200 && r.json?.rows?.[0] && "ksa_withheld" in r.json.rows[0];
    return { ran: !!has, why: "mcp.task.ksa_withheld returned by the function: " + !!has };
  },
  339: async () => {
    /* RAN and EFFECTIVE are different questions, and 339 is why the distinction
     * is here. Its DDL was in the database and its 98 rows were written -- it
     * RAN -- while every non-English blueprint read answered 500, because the
     * functions it created were not SECURITY DEFINER. For two hours nothing
     * said so: the migration's own post-conditions had passed, as a superuser.
     *
     * So a fingerprint may report both. `ran` asks whether the artifact exists.
     * `effective` asks whether the thing it was FOR works for the party it was
     * for, and it is measured through the deployed endpoint because that queries
     * as mcp_reader. */
    const n = await count("task_translation_reviews");
    const r = await fn({ resource: "task", certification: "ISMS-F", task_code: "2.1", language: "es-419" });
    /* AT LEAST, NOT EXACTLY. See the note on 340. */
    const served = r.status === 200 && r.json?.rows?.[0]?.knowledge != null;
    return {
      ran: n !== null && n !== undefined && n >= 98,
      why: "task_translation_reviews = " + n + " row(s), 339 wrote 98",
      effective: served,
      effectiveWhy: served
        ? "ISMS-F 2.1 es-419 returns knowledge to mcp_reader"
        : "ISMS-F 2.1 es-419 returns HTTP " + r.status + " / knowledge null -- the reviews exist but nothing reaches a partner",
    };
  },
  340: async () => {
    /* AT LEAST 35, NOT EXACTLY 35 -- AND THIS FILE GOT IT WRONG FIRST.
     *
     * The fingerprint read `n === 35`. Six more reviews were recorded the same
     * evening, clearing ISMS-F to 49/49, and 340 immediately reported NOT RUN
     * -- a migration that had run, failing its own probe because later work
     * landed in the table it wrote to.
     *
     * That is the stale-number failure this whole file exists to retire,
     * reintroduced inside the replacement. A count written into a check is a
     * second copy of a fact exactly like a count written into CLAUDE.md; the
     * only difference is that this one runs.
     *
     * A migration that APPENDS is proved by "its rows are there", never by "the
     * table has not grown". An exact count is right only for a table nothing
     * else ever writes to, and this table is written every time somebody
     * reviews a translation -- which is the point of it. */
    const n = await count("lesson_translation_reviews");
    return {
      ran: n !== null && n !== undefined && n >= 35,
      why: "lesson_translation_reviews = " + n + " row(s), 340 wrote 35 of them",
    };
  },
  341: async () => {
    const r = await fn({ resource: "task", certification: "ISMS-F", task_code: "2.1", language: "es-419" });
    const ok = r.status === 200;
    const ksa = ok && r.json?.rows?.[0]?.knowledge != null;
    return {
      ran: ok,
      why: ok ? "non-English task reads HTTP 200, ISMS-F knowledge " + (ksa ? "served" : "NULL")
              : "non-English task reads HTTP " + r.status + " -- 339's functions are still not SECURITY DEFINER",
    };
  },
  342: async () => {
    /* The fingerprint is BEHAVIOURAL, and for this migration it had to be:
     * 342 only changes two view columns, so nothing in `public` moves. The
     * probe that answered "has it run" before the deploy was the OLD function
     * reading the NEW view -- module_title came back Spanish while the
     * function had no knowledge of the join. */
    const r = await fn({ resource: "lesson_index", certification: "ISMS-F", language: "es-419", limit: 200 });
    const rows = r.json?.rows ?? [];
    const fb = rows.filter((x) => x.module_title_is_fallback).length;
    const col = rows.length > 0 && "module_title_is_fallback" in rows[0];
    return {
      ran: col,
      why: col ? "lesson_index projects module_title_is_fallback" : "module_title_is_fallback absent -- 342 has not run, or courseware-read is not deployed",
      effective: col && rows.length > 0 && fb === 0,
      effectiveWhy: fb === 0 ? "ISMS-F es-419: " + rows.length + " row(s), 0 falling back to the English module title"
                             : fb + " of " + rows.length + " es-419 row(s) still serve an English module title",
    };
  },
  343: async () => {
    /* BOTH DIRECTIONS. A language dimension that is accepted and ignored looks
     * identical to one that works, so Spanish must differ from English -- and
     * the no-language default must still return ONE row, because between 343
     * and the deploy the old query returned three. */
    const es = await fn({ resource: "certification", certification: "ISMS-F", language: "es-419" });
    const en = await fn({ resource: "certification", certification: "ISMS-F", language: "en" });
    const bare = await fn({ resource: "certification", certification: "ISMS-F" });
    const accepted = es.status === 200;
    const one = bare.json?.count === 1;
    const routes = accepted && es.json?.rows?.[0]?.description &&
      es.json.rows[0].description !== en.json?.rows?.[0]?.description;
    return {
      ran: accepted && one,
      why: !accepted ? "certification refuses `language`: HTTP " + es.status + " -- 343 has not run or the function is not deployed"
         : !one ? "no-language read returns " + bare.json?.count + " rows, expected 1 -- the view has a language dimension and the deployed function does not filter on it"
         : "certification accepts language and returns one row per language",
      effective: !!routes,
      effectiveWhy: routes ? "es-419 description differs from en -- the language reaches the view"
                           : "es-419 and en descriptions are identical -- language is accepted and ignored",
    };
  },
};

/* ------------------------------------------------------------------ report */
const files = readdirSync(join(ROOT, "migrations")).filter((f) => /^\d{3}_.*\.sql$/.test(f)).sort();
const nums = files.map((f) => Number(f.slice(0, 3)));
const highest = Math.max(...nums);

console.log("");
console.log("MIGRATION STATE -- probed, not stated");
console.log("  files on disk      " + files.length + ", highest " + highest);
console.log("  NEXT FREE NUMBER   " + (highest + 1) + "   (the folder is authoritative for this half)");
console.log("");
console.log("  HAS IT RUN -- from the database and the deployed function:");
console.log("");

const results = {};
for (const num of nums.filter((x) => FINGERPRINTS[x]).sort((a, b) => a - b)) {
  let r;
  try { r = await FINGERPRINTS[num](); } catch (e) { r = { ran: null, why: "probe failed: " + String(e).slice(0, 70) }; }
  results[num] = r;
  const mark = r.ran === true ? "RAN    " : r.ran === false ? "NOT RUN" : "UNKNOWN";
  console.log("    " + num + "  " + mark + "  " + r.why);
  if ("effective" in r) {
    console.log("         " + (r.effective ? "EFFECTIVE" : "NOT EFFECTIVE") + "  " + r.effectiveWhy);
  }
}
const unprobed = nums.filter((x) => !FINGERPRINTS[x] && x >= 330);
if (unprobed.length) {
  console.log("");
  console.log("  NO PROBE (silence is not a claim -- add a fingerprint): " + unprobed.join(", "));
}

const notRun = Object.entries(results).filter(([, r]) => r.ran === false).map(([k]) => k);
const ranButDead = Object.entries(results)
  .filter(([, r]) => r.ran === true && r.effective === false).map(([k]) => k);
console.log("");
console.log(notRun.length ? "  OUTSTANDING: " + notRun.join(", ")
                          : "  Every probed migration has run.");
if (ranButDead.length) {
  console.log("  RAN BUT NOT EFFECTIVE: " + ranButDead.join(", ") +
    "   <- the artifact exists and the thing it was for does not work");
}

if (JSON_OUT) {
  writeFileSync(join(ROOT, JSON_OUT), JSON.stringify({ highest, next_free: highest + 1, results, unprobed }, null, 1) + "\n");
  console.log("");
  console.log("wrote " + JSON_OUT);
}
