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

/** Row count of an arbitrary FILTERED path, or null if the table is absent.
 *
 *  THE SERVER COUNTS; THIS SCRIPT DOES NOT. Fetching rows in order to count
 *  them is how fingerprint 355 came to report "271 cleared" against a true
 *  2,544: PostgREST capped the read at 1,000 of 3,460 rows and returned HTTP
 *  200. A count is never worth a row. */
async function countWhere(path) {
  let last;
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(REST + "/" + path + "&limit=1",
        { headers: { ...H, Prefer: "count=exact" }, signal: AbortSignal.timeout(45000) });
      if (r.status === 404) return null;
      const body = await r.text();
      if (!r.ok) return body.includes("does not exist") ? null : undefined;
      const n = Number(String(r.headers.get("content-range") || "").split("/")[1]);
      /* A count read that yields no count is a dropped read, not a zero. */
      if (!Number.isFinite(n)) throw new Error("no content-range on " + path);
      return n;
    } catch (e) { last = e; }
  }
  throw last;
}

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
/** Full rows from a public table, or null. For fingerprints that need CONTENT
 *  rather than a count -- 344 checks what a blueprint asserts about itself. */
async function rest(path) {
  let last;
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(REST + "/" + path, { headers: H, signal: AbortSignal.timeout(45000) });
      if (!r.ok) return null;
      return await r.json();
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
/** Call a public function through PostgREST. `mcp` is not reachable this way;
 *  `public` is. Returns the parsed body, or undefined if the call FAILED --
 *  distinct from null, which is a legitimate return value here. */
async function rpc(name, args) {
  let last;
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(REST + "/rpc/" + name, {
        method: "POST", headers: { ...H, "content-type": "application/json" },
        body: JSON.stringify(args), signal: AbortSignal.timeout(45000),
      });
      if (!r.ok) return undefined;
      return JSON.parse(await r.text());
    } catch (e) { last = e; }
  }
  throw last;
}

/** Ask the deployed function. */
async function fn(body, extraHeaders = {}) {
  let last;
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(FN, {
        method: "POST",
        headers: { "content-type": "application/json", "x-mcp-client": "probe:migration-state", ...extraHeaders },
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
  330: async () => {
    /* 329 granted mcp.resolve_oauth_caller to the wrong role and the first
     * OAuth lesson read ever attempted answered 500. 330 fixed the grant.
     *
     * PROBED BEHAVIOURALLY, as a REFUSAL. A bad token must be turned away by
     * the resolver -- 401 -- and not by the resolver failing to run, which is
     * what 329 produced: a 500 wearing a read error. This cannot prove a VALID
     * token resolves (that needs one), and says so rather than implying it. */
    const r = await fn({ resource: "lesson", certification: "AISM-I", lesson_slug: "x" },
      { "x-certidemy-token": "not-a-real-token" });
    const ok = r.status === 401 || r.status === 403;
    return {
      ran: ok,
      why: ok
        ? "an invalid OAuth token is refused " + r.status + " by the resolver, not 500 by a missing grant"
        : "HTTP " + r.status + " -- 329's symptom was a 500 here; the grant may be wrong again",
    };
  },
  331: async () => {
    /* Grant by default, revoke by exception. The vocabulary table and the
     * disables table are both public and readable. */
    const feats = await count("mcp_features");
    const dis = await count("company_feature_disables");
    const ok = feats !== null && feats !== undefined && feats >= 2 &&
      dis !== null && dis !== undefined;
    return {
      ran: ok,
      why: ok ? "mcp_features holds " + feats + " key(s); company_feature_disables exists (" + dis + " row(s))"
              : "mcp_features=" + feats + ", company_feature_disables=" + dis,
    };
  },
  333: async () => {
    /* 332 added mcp_servable and left the views alone; 333 made them enforce
     * it. So the tell is not the column (332 owns that) but that the CATALOGUE
     * reports body_available and that it is not uniformly true -- a gate that
     * admits everything is indistinguishable from no gate. */
    const r = await fn({ resource: "lesson_index", certification: "AIMS-F", language: "es-419", limit: 200 });
    const rows = r.json?.rows ?? [];
    const has = rows.length > 0 && "body_available" in rows[0];
    /* NO `effective` HALF, and the reason is a finding rather than a gap.
     *
     * The first version expected some lesson to report body_available:false and
     * called its absence "the predicate is not being applied". That was wrong
     * twice over. `body_available` is `l.mcp_servable` alone, and every lesson
     * on the platform is currently servable because every corpus passed the ISO
     * leak scan -- so there is nothing for 333's gate to withhold today, which
     * is a clean bill and not a silent failure.
     *
     * It also revealed that `body_available` does NOT mean what its own view
     * comment says it means ("whether mcp.lesson will return this one"): the
     * review gate is in mcp.lesson and not in this column, so 167 lessons are
     * advertised available and refused. That is tracked as its own open item in
     * check-open-items.mjs, not smuggled in here as a migration probe. */
    /* UNKNOWN, NOT "NOT RUN". 333 made the views enforce `mcp_servable`, and
     * that is not observable from outside today: every corpus passed the leak
     * scan, so the predicate has nothing to exclude, and `body_available` --
     * the column that would carry the answer -- is not projected by
     * courseware-read at all (its own open item).
     *
     * Reporting NOT RUN would be a claim that 333 did not run, which is false.
     * Silence about a thing is not a claim about it, and that distinction is
     * the reason this file is trusted where the prose tip was not. */
    if (!has) {
      return {
        ran: null,
        why: "cannot be observed: nothing is currently non-servable, and courseware-read " +
             "does not project body_available. Probeable once that field is served.",
      };
    }
    return { ran: true, why: "lesson_index projects body_available across " + rows.length + " row(s)" };
  },
  334: async () => {
    /* ISMS-F and AIMS-F joined here. Both, not one: a widening that admitted
     * only the certification someone tested is the shape 328 and 336 both had. */
    const a = await fn({ resource: "certification", certification: "ISMS-F" });
    const b = await fn({ resource: "certification", certification: "AIMS-F" });
    const ok = a.status === 200 && b.status === 200;
    return {
      ran: ok,
      why: ok ? "ISMS-F and AIMS-F both reachable"
              : "ISMS-F HTTP " + a.status + ", AIMS-F HTTP " + b.status,
    };
  },
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
  344: async () => {
    /* BOTH DIRECTIONS, because check 1 alone passes on a migration that deleted
     * the provisional marker and added no measurement. */
    const rows = await rest("certifications?select=code,tier,exam_blueprint");
    if (!rows) return { ran: null, why: "could not read certifications" };
    const im = rows.filter((r) => r.exam_blueprint && r.exam_blueprint.item_model);
    const provisional = rows.filter((r) => JSON.stringify(r.exam_blueprint ?? {}).includes("PROVISIONAL"));
    const measured = im.filter((r) => r.exam_blueprint.item_model.cue_tolerance?.measured_over);
    const falseClaim = rows.filter((r) =>
      JSON.stringify(r.exam_blueprint ?? {}).includes("qualification density across options"));
    const unmoved = im.filter((r) => {
      const t = r.exam_blueprint.item_model.cue_tolerance ?? {};
      return t.key_len_margin === 25 && t.key_len_pct === 15 && t.len_spread_max === 100;
    });
    const ok = provisional.length === 0 && falseClaim.length === 0 &&
      im.length === 3 && measured.length === 3 && unmoved.length === 3;
    return {
      ran: ok,
      why: ok
        ? "3 item_model(s), all measured, no provisional marker, no false density claim, tolerance still 25/15/100"
        : "item_model " + im.length + "/3, measured " + measured.length + "/3, tolerance unmoved " +
          unmoved.length + "/3, provisional on " + provisional.length + ", false density claim on " + falseClaim.length,
    };
  },
  345: async () => {
    /* BOTH DIRECTIONS: none live, and the history still there. A retirement
     * that took the attempt rows with it would satisfy the first half. */
    /* RAN asks what 345 DID. EFFECTIVE asks what is true now, and they are
     * different because the writer is still live: weak-concepts persists five
     * items per click, so "zero live generated items" is a state 345 created
     * and the product breaks by design.
     *
     * The first version asserted `live === 0` and `length === 160`, and reported
     * NOT RUN the moment two learners used the feature. That is 340's exact
     * mistake -- a count of an append-only population -- made again two days
     * later, in the fingerprint written by the author who fixed 340's. */
    const rows = await rest("quiz_questions?select=id,retired_at&item_origin=eq.generated&pool=eq.practice");
    if (!rows) return { ran: null, why: "could not read quiz_questions" };
    const retired = rows.filter((r) => r.retired_at).length;
    const live = rows.length - retired;
    const att = await count("quiz_attempts");
    return {
      ran: retired >= 160 && att >= 2249,
      why: retired + " generated practice item(s) retired (345 retired 158 of them), " +
           att + " attempt row(s) preserved",
      effective: live === 0,
      effectiveWhy: live === 0
        ? "no live generated items"
        : live + " generated item(s) written since, by the live weak-concepts route -- " +
          "expected, and they land status='approved' with no review (CERTIDEMY-LEARNER-IA 5.5)",
    };
  },
  346: async () => {
    /* ALL THREE LANGUAGES. A field added to one arm of the union answers in
     * English and vanishes in Spanish, which reads as a translation defect
     * that does not exist -- so an English-only probe would report RAN on the
     * exact failure this migration was written to avoid. */
    const out = {};
    for (const lang of ["en", "es-419", "pt-BR"]) {
      const r = await fn({ resource: "task", certification: "ISMS-F", task_code: "2.1", language: lang });
      out[lang] = r.status === 200 ? (r.json?.rows?.[0]?.criticality ?? null) : "HTTP " + r.status;
    }
    const ok = ["en", "es-419", "pt-BR"].every((l) => typeof out[l] === "string" && !out[l].startsWith("HTTP "));
    return {
      ran: ok,
      why: ok ? "criticality served in all three languages (" +
                [...new Set(Object.values(out))].join(", ") + ")"
              : "criticality per language: " + JSON.stringify(out),
    };
  },
  347: async () => {
    /* mcp_features is the only one of the three scope vocabularies a read-only
     * probe can see. The two CHECK constraints are asserted inside 347 itself,
     * by attempting a write and rolling it back -- the constraint's text is a
     * description and the insert is the behaviour. So this fingerprint proves
     * one third and says so rather than implying all three. */
    const rows = await rest("mcp_features?select=feature_key");
    if (!rows) return { ran: null, why: "could not read mcp_features" };
    const keys = rows.map((r) => r.feature_key);
    const want = ["credentials:issue", "courseware:lessons", "courseware:rubric"];
    const missing = want.filter((k) => !keys.includes(k));
    return {
      ran: missing.length === 0,
      why: missing.length === 0
        ? "mcp_features holds all 3 scope keys (the CHECK constraints are asserted inside 347)"
        : "mcp_features is missing " + JSON.stringify(missing),
    };
  },
  348: async () => {
    /* Over EVERY certification, not the three 348 touched. The defect it fixes
     * came from a leak audit scoped to the prompt surface while the author had
     * hand-written a path into a different public column days earlier. */
    const rows = await rest("certifications?select=code,exam_blueprint");
    if (!rows) return { ran: null, why: "could not read certifications" };
    const withBp = rows.filter((r) => r.exam_blueprint);
    if (!withBp.length) return { ran: null, why: "no blueprints -- extractor broken" };
    const PATH = /(scripts|functions|migrations)\/[a-z0-9_./-]+\.(mjs|ts|sql)/i;
    const INTERNAL = /migration [0-9]{2,3}|CLAUDE\.md|verify-cert|auditItem|bank_revision v/i;
    const bad = withBp.filter((r) => {
      const t = JSON.stringify(r.exam_blueprint);
      return PATH.test(t) || INTERNAL.test(t);
    }).map((r) => r.code);
    return {
      ran: bad.length === 0,
      why: bad.length === 0
        ? withBp.length + " blueprint(s) scanned, none names a repository internal"
        : "repository internals in the blueprint of: " + bad.join(", "),
    };
  },
  349: async () => {
    /* READ AS anon OVER HTTP, which is the only thing this file can do that
     * the migration could not: 349 asserts with `set local role anon`, and
     * that proves the GRANT. This proves the SURFACE. A grant is not exposure
     * and neither is its absence.
     *
     * BOTH DIRECTIONS. "notes is refused" alone passes on a revoke that took
     * the whole table and emptied four pages. */
    const { ANON, SUPABASE_URL } = await import("./lib/fn-auth.mjs");
    const asAnon = async (path) => {
      for (let i = 0; i < 6; i++) {
        try {
          const r = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
            headers: { apikey: ANON, Authorization: "Bearer " + ANON },
            signal: AbortSignal.timeout(45000),
          });
          return { ok: r.ok, status: r.status, body: await r.text() };
        } catch { /* retry */ }
      }
      return { ok: false, status: 0, body: "" };
    };
    const notes = await asAnon("tasks?select=notes&limit=1");
    const keep = await asAnon("tasks?select=id,code,statement,knowledge,skills,abilities,bloom_level,criticality&limit=1");
    const snap = await asAnon("jta_versions?select=blueprint_snapshot&limit=1");
    const notesGone = !notes.ok;
    const keepWorks = keep.ok && (JSON.parse(keep.body || "[]").length > 0);
    const snapGone = !snap.ok;
    const ok = notesGone && keepWorks && snapGone;
    return {
      ran: ok,
      why: ok
        ? "as anon over HTTP: notes refused, jta_versions refused, the blueprint columns still read"
        : "notes refused=" + notesGone + " (HTTP " + notes.status + "), " +
          "blueprint columns readable=" + keepWorks + " (HTTP " + keep.status + "), " +
          "jta_versions refused=" + snapGone + " (HTTP " + snap.status + ")",
    };
  },
  350: async () => {
    /* THE FIELD IS CHECKABLE AGAINST ONE THING: the query it describes.
     * Over HTTP that means comparing the catalogue's claim against what
     * get_lesson does -- which needs a courseware:lessons key. Without one,
     * this probes the half it can and SAYS the other half is untested rather
     * than implying the field is correct.
     *
     * The equality itself is asserted inside 350, as mcp_holder, over every
     * row. This is the surface check, not a second copy of that. */
    const r = await fn({ resource: "lesson_index", certification: "AIMS-F", language: "es-419", limit: 200 });
    const rows = r.json?.rows ?? [];
    if (!rows.length) return { ran: null, why: "lesson_index returned no rows" };
    const projected = "body_available" in rows[0];
    const withheld = rows.filter((x) => x.body_available === false).length;
    const spans = withheld > 0 && withheld < rows.length;
    return {
      ran: projected,
      why: projected
        ? "lesson_index projects body_available; AIMS-F es-419 reports " + withheld +
          " of " + rows.length + " withheld"
        /* SAYS WHICH OF TWO THINGS IS UNKNOWN, rather than picking one. An
         * absent column means 350 has not run, or it has and courseware-read
         * was not deployed; this probe cannot see the view and must not claim
         * to. */
        : "body_available not projected -- either 350 has not run, or it has and " +
          "courseware-read was not redeployed",
      effective: projected && spans,
      effectiveWhy: spans
        ? "both states present, so the field distinguishes rather than being constant"
        : "body_available is constant across " + rows.length + " row(s) -- it was mcp_servable " +
          "alone before 350, which was true everywhere; check 350 ran",
    };
  },
  351: async () => {
    /* RAN asks whether the two rows were repaired. EFFECTIVE asks the question
     * that actually matters -- whether the WRITER works now -- and those are
     * different, because 351 is the cleanup and the deploy was the fix.
     *
     * The writer cannot be proved until someone sits an exam. Until then this
     * says so rather than letting a green row imply it. An unrecorded row
     * appearing later means score-mock-exam regressed or was rolled back, and
     * that is the signal worth catching. */
    const att = await rest("exam_attempts?select=id,submitted_at,jta_version_status,company_id_status");
    const cred = await rest("credentials?select=credential_code,jta_version_status");
    if (!att || !cred) return { ran: null, why: "could not read exam_attempts or credentials" };
    const bad = att.filter((r) => r.jta_version_status === "unrecorded" || r.company_id_status === "unrecorded")
      .map((r) => String(r.id).slice(0, 8))
      .concat(cred.filter((r) => r.jta_version_status === "unrecorded").map((r) => r.credential_code));
    const since = att.filter((r) => r.submitted_at >= "2026-09-20");
    const sinceBad = since.filter((r) => r.jta_version_status === "unrecorded").length;
    return {
      ran: bad.length === 0,
      why: bad.length === 0
        ? att.length + " attempt(s) and " + cred.length + " credential(s), none unrecorded"
        : "still unrecorded: " + bad.join(", "),
      effective: since.length > 0 && sinceBad === 0,
      effectiveWhy: since.length === 0
        ? "no exam sat since the 2026-09-20 redeploy, so the WRITER is still unproven -- " +
          "351 repaired the rows, the deploy is the fix, and nothing has exercised it yet"
        : sinceBad + " of " + since.length + " attempt(s) since the redeploy are unrecorded",
    };
  },
  352: async () => {
    /* BOTH HALVES. "every review carries a tr_hash" passes on a migration that
     * added the column and never wired the gate; "ISMS-F still serves 49/49"
     * passes on one that wired nothing at all. The pair is the check. */
    const l = await rest("lesson_translation_reviews?select=tr_hash,tr_hash_basis");
    const t = await rest("task_translation_reviews?select=tr_hash,tr_hash_basis");
    const i = await rest("item_translation_reviews?select=tr_hash,tr_hash_basis");
    if (!l || !t || !i) {
      /* DISTINGUISH "the column is not there yet" from "the read failed". A
       * PostgREST select naming an absent column 400s exactly like a broken
       * read, and reporting UNKNOWN for a migration that simply has not run
       * sends the reader to check credentials. */
      const plain = await rest("lesson_translation_reviews?select=lesson_id&limit=1");
      return plain
        ? { ran: false, why: "tr_hash does not exist on the review tables -- 352 has not run" }
        : { ran: null, why: "could not read the review tables at all" };
    }
    const nulls = [...l, ...t, ...i].filter((r) => !r.tr_hash).length;
    const bases = [...new Set([...l, ...t, ...i].map((r) => r.tr_hash_basis))].filter(Boolean).sort();
    const total = l.length + t.length + i.length;
    if (nulls > 0) {
      return { ran: false, why: nulls + " of " + total + " review(s) have no tr_hash" };
    }
    /* The gate half, over the endpoint: ISMS-F's translated bodies stay
     * served, and AIMS-F's stay withheld. If the backfilled hash did not match
     * the stored translation, ISMS-F would have gone dark. */
    const ok = await fn({ resource: "lesson_index", certification: "ISMS-F", language: "es-419", limit: 200 });
    const dark = await fn({ resource: "lesson_index", certification: "AIMS-F", language: "es-419", limit: 200 });
    const okRows = ok.json?.rows ?? [], darkRows = dark.json?.rows ?? [];
    const okAvail = okRows.filter((x) => x.body_available).length;
    const darkAvail = darkRows.filter((x) => x.body_available).length;
    const gateHolds = okAvail === okRows.length && okRows.length > 0 &&
      darkAvail > 0 && darkAvail < darkRows.length;
    return {
      ran: true,
      why: total + " review(s) carry tr_hash; bases " + JSON.stringify(bases),
      effective: gateHolds,
      effectiveWhy: gateHolds
        ? "ISMS-F " + okAvail + "/" + okRows.length + " still available, AIMS-F " +
          darkAvail + "/" + darkRows.length + " -- the backfill matched and the gate still withholds"
        : "ISMS-F " + okAvail + "/" + okRows.length + ", AIMS-F " + darkAvail + "/" + darkRows.length +
          " -- a backfilled hash that does not match would show as ISMS-F going dark",
    };
  },
  353: async () => {
    /* RAN vs EFFECTIVE. "the column exists" passes on a migration that added
     * it and no trigger -- which 16 tables in this database demonstrate. The
     * trigger is the property, so EFFECTIVE asks whether any row has actually
     * moved off its created_at, and says UNPROVEN rather than false while no
     * row has been edited since. */
    /* ONE ROW, THE MOST RECENTLY UPDATED. An unpaginated select here returned
     * 1000 and printed it as a total against 1,437 lessons -- the PostgREST cap
     * wearing the costume of an answer, in a fingerprint written the same day
     * that rule was being applied elsewhere. The property is "has the trigger
     * ever fired", and the newest updated_at answers it without a count. */
    const l = await rest("lessons?select=id,created_at,updated_at&order=updated_at.desc&limit=1");
    if (!l) {
      const plain = await rest("lessons?select=id&limit=1");
      return plain
        ? { ran: false, why: "lessons.updated_at does not exist -- 353 has not run" }
        : { ran: null, why: "could not read lessons at all" };
    }
    const q = await rest("quiz_questions?select=id,created_at,updated_at&limit=1");
    if (!q) return { ran: false, why: "quiz_questions.updated_at does not exist -- 353 is half applied" };
    const moved = l.filter((r) => r.updated_at && r.created_at && r.updated_at > r.created_at).length;
    return {
      ran: true,
      why: "lessons and quiz_questions both carry updated_at",
      effective: moved > 0 ? true : null,
      effectiveWhy: moved > 0
        ? "the most recently updated lesson reads updated_at > created_at, so the trigger has fired"
        : "no lesson has been edited since 353, so the TRIGGER is unproven from data -- " +
          "353's own post-condition exercised it in a rolled-back sub-block",
    };
  },
  354: async () => {
    /* The function is granted to service_role only, so this key can call it.
     * BOTH DIRECTIONS: it must return a table that has a trigger AND omit one
     * that carries updated_at without one, or the calling script exempts
     * everything and its gate cannot fire. */
    const rows = await rest("rpc/tables_with_updated_at_trigger", { method: "POST", body: "{}" });
    if (!rows) return { ran: false, why: "tables_with_updated_at_trigger does not exist -- 354 has not run" };
    const names = rows.map((r) => (typeof r === "string" ? r : r.table_name));
    const hasProfiles = names.includes("profiles");
    const omitsUserCerts = !names.includes("user_certifications");
    const omitsMaterial = !names.includes("credentials");
    const ok = hasProfiles && omitsUserCerts && omitsMaterial;
    return {
      ran: true,
      why: names.length + " table(s) reported trigger-maintained",
      effective: ok,
      effectiveWhy: ok
        ? "profiles in, user_certifications out, credentials out -- the assignment predicate holds"
        : "profiles=" + hasProfiles + " user_certifications_omitted=" + omitsUserCerts +
          " credentials_omitted=" + omitsMaterial + " -- credentials present means it matched the substring again",
    };
  },
  355: async () => {
    /* RAN is the table. EFFECTIVE is the view, and the two halves of the view
     * that matter are opposite: nothing vanishes, and nothing uncleared is
     * served. A view driven off the translations would satisfy neither. */
    /* THIS READ WAS TRUNCATED AND THE NUMBER IT PRINTED WAS A FLOOR.
     * It fetched every row to count them: 1,000 of 3,460 came back, HTTP 200,
     * and "271 cleared" was reported against a true 2,544. Measured
     * 2026-09-21. The defect sat inside the probe CLAUDE.md tells everyone to
     * run INSTEAD of trusting a written number -- so the instrument built to
     * replace a stale note was itself printing a wrong one.
     *
     * Neither figure ever needed the rows. Ask the server for both counts. */
    const nRows = await countWhere("concept_translations?select=concept_id");
    if (nRows === null || nRows === undefined) {
      return { ran: false, why: "public.concept_translations does not exist -- 355 has not run" };
    }
    const cleared = await countWhere("concept_translations?select=concept_id&is_provisional=is.false");
    /* LIMIT 200. The first version passed 300, which the function refuses --
     * "limit must be an integer between 1 and 200" -- and then read `rows ??
     * []` off the 400 body, so BOTH languages came back as zero rows and the
     * check reported "a concept VANISHES in Spanish". Nothing vanished: the
     * call never succeeded. A dropped read became an answer, and the message
     * named the most alarming failure it could describe rather than the one it
     * measured -- migration 323 exactly. */
    const three = await fn({ resource: "concept", certification: "ISMS-F", language: "es-419", limit: 200 });
    const en = await fn({ resource: "concept", certification: "ISMS-F", language: "en", limit: 200 });
    /* fn() returns { status, json } and NO `ok` -- checking a field the
     * helper does not return made this branch fire on two successful 200s.
     * Read the envelope that exists, not the one you remember. */
    if (three.status !== 200 || en.status !== 200) {
      return {
        ran: true,
        why: nRows + " translation row(s), " + cleared + " cleared",
        effective: null,
        effectiveWhy: "could not read mcp.concept over the wire (es " + three.status +
          ", en " + en.status + ") -- this says nothing about the view",
      };
    }
    const esRows = three.json?.rows ?? [], enRows = en.json?.rows ?? [];
    /* AND A FAN-OUT IS ITS OWN FAILURE, NAMED SEPARATELY. 355 tripled the
     * view's rows; a caller that omits the language filter sees each concept
     * three times, which is what search_blueprint did on a live endpoint. */
    const esDistinct = new Set(esRows.map((r) => r.slug)).size;
    if (esDistinct !== esRows.length) {
      return {
        ran: true,
        why: nRows + " translation row(s), " + cleared + " cleared",
        effective: false,
        effectiveWhy: esRows.length + " row(s) for " + esDistinct + " distinct concept(s) -- a caller is",
      };
    }
    /* NOTHING VANISHES is the property this table exists for. */
    const sameCount = esRows.length > 0 && esRows.length === enRows.length;
    const flagged = esRows.filter((r) => r.description_is_fallback).length;
    /* While the table is empty every non-English row must be a fallback. Once
     * rows are cleared that stops being true, which is why this compares
     * against the CLEARED COUNT rather than asserting a literal. */
    const consistent = cleared === 0 ? flagged === esRows.length : flagged <= esRows.length;
    return {
      ran: true,
      why: nRows + " translation row(s), " + cleared + " cleared",
      effective: sameCount && consistent,
      effectiveWhy: !sameCount
        ? "es-419 returns " + esRows.length + " concept(s) and en returns " + enRows.length +
          " -- a concept VANISHES in Spanish, which is the defect 355 exists to prevent"
        : cleared === 0
          ? "es-419 returns all " + esRows.length + " concept(s), every one flagged description_is_fallback"
          : cleared + " cleared translation(s); " + flagged + " of " + esRows.length + " still fall back",
    };
  },
  371: async () => {
    /* 371 made mcp.lesson_withholding_reason the primary and derived
     * lesson_body_is_servable from it, because 177 of 183 withheld lessons were
     * refused with "it reproduces clause text from an ISO standard" when the arm
     * actually holding them was the TRANSLATION REVIEW.
     *
     * THE MIGRATION AND THE DEPLOY ARE PROBED SEPARATELY, because they fail
     * differently and a compound claim inherits the credibility of its
     * most-verified part. `ran` is the migration alone; `effective` is the
     * deployed function on the wire.
     *
     * THE MIGRATION TELL IS THE ONE BEHAVIOUR CHANGE 371 DECLARES. Deriving the
     * verdict from the reason would turn a nonexistent lesson from NULL into
     * TRUE -- `reason is null` holds when the reason function selects no rows --
     * so 371 guards it with an existence test and the answer becomes FALSE.
     * Observable through PostgREST, needs no deploy, produced by nothing else. */
    const bogus = await rpc("lesson_body_is_servable",
      { p_lesson_id: "00000000-0000-0000-0000-000000000000" });
    if (bogus === undefined) {
      return { ran: false, why: "could not call lesson_body_is_servable -- says nothing about 371" };
    }
    const ran = bogus === false;
    const why = ran
      ? "a nonexistent lesson reports false, not null -- the verdict is derived from the reason"
      : "a nonexistent lesson reports " + JSON.stringify(bogus) + "; before 371 that is null";

    /* THE WIRE, BOTH DIRECTIONS, and the negative half is the one that matters.
     * A refusal that never mentions ISO would pass a one-sided check while
     * having simply deleted the true message -- so a genuinely reproducing
     * lesson MUST still be refused as reproduction.
     *
     * Subjects chosen from the two arms rather than typed from memory: AIMS-F
     * 05-01 is one of the 6 rows the scanner really withholds (longest run 12,
     * over the floor of 10), and AIMS-F 01-01 es-419 is one of the 177 held for
     * review (longest run 9 -- UNDER the floor, so our own instrument had
     * already measured the ISO claim false on every one of them). */
    /* `lesson` IS A PAID TOOL, so this half needs a courseware:lessons key and
     * ABSTAINS without one rather than scoring the 401. The first version of
     * this cell did not, and reported NOT EFFECTIVE against a function that was
     * simply refusing an anonymous caller correctly. */
    const CK = process.env.CERTIDEMY_API_KEY;
    if (!CK) {
      return { ran, why, effective: null,
        effectiveWhy: "no CERTIDEMY_API_KEY: `lesson` is a paid tool and 401 is not a verdict on 371" };
    }
    const auth = { "x-certidemy-key": CK };
    const review = await fn({ resource: "lesson", certification: "AIMS-F",
      lesson_slug: "01-01-what-an-aims-is", language: "es-419" }, auth);
    const iso = await fn({ resource: "lesson", certification: "AIMS-F",
      lesson_slug: "05-01-aims-monitoring-and-measurement", language: "en" }, auth);
    if (review.status === 401 || iso.status === 401) {
      return { ran, why, effective: null,
        effectiveWhy: "CERTIDEMY_API_KEY was refused 401 -- the key, not 371" };
    }

    /* A REFUSAL THAT DID NOT HAPPEN PROVES NOTHING. If either subject starts
     * serving, the probe has lost it and must say so rather than scoring the
     * silence -- a cell with no expectation is UNASSERTED, never a pass. */
    if (review.status !== 404 || iso.status !== 404) {
      return { ran, why, effective: null,
        effectiveWhy: "subjects no longer refused (review " + review.status + ", iso " +
          iso.status + ") -- cleared or released, so this cell asserts nothing" };
    }
    const rSaysIso = /ISO standard/.test(review.json?.error ?? "");
    const iSaysIso = /ISO standard/.test(iso.json?.error ?? "");
    const rReason = review.json?.reason ?? "(none)";
    const effective = !rSaysIso && iSaysIso && rReason === "translation_pending_review";
    return {
      ran, why, effective,
      effectiveWhy: effective
        ? "the review-held lesson is refused as " + rReason +
          " and the reproducing one still names ISO -- both directions"
        : rSaysIso
          ? "a review-held lesson is STILL told it reproduces ISO; the function predates 371"
          : !iSaysIso
            ? "a genuinely reproducing lesson no longer names ISO -- the true message was deleted"
            : "review-held lesson refused as " + rReason + ", expected translation_pending_review",
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
    /* THREE STATES, NOT TWO. This read `r.effective ? ... : "NOT EFFECTIVE"`,
     * so a cell that ABSTAINED -- `effective: null`, meaning the probe could
     * not reach its subject -- printed as a failure. 355 already returns null
     * when it cannot read the view over the wire, and a transport error has
     * been rendering as "the migration does not work" ever since.
     *
     * The summary below has always used `=== false`, so the two halves of this
     * script disagreed: the list was right and the line was wrong. A guard that
     * manufactures the failure it reports is worse than no guard. */
    const mk = r.effective === true ? "EFFECTIVE    "
             : r.effective === false ? "NOT EFFECTIVE"
             : "UNASSERTED   ";
    console.log("         " + mk + "  " + r.effectiveWhy);
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
