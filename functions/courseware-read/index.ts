// POST /functions/v1/courseware-read
//
// PUBLIC endpoint. verify_jwt = false, pinned in config.toml in the same commit
// as this file -- see the block above [functions.courseware-read] for why the
// pin and not the flag.
//
// The read side of the courseware MCP pilot (migrations 315 and 316). ONE
// function, parameterised by `resource`, per MCP-COURSEWARE.md section 3:
//
//   { resource: "certification" }
//   { resource: "task",    language?, domain_code?, task_code?, limit? }
//   { resource: "concept", slug?, task_code?, limit? }
//   { resource: "search",  query, language?, limit? }
//
// ===================== THE ONE PROPERTY THAT MATTERS =====================
//
// THIS FUNCTION MUST NEVER HOLD service_role. MCP-COURSEWARE.md section 2:
// "It would satisfy every query and make migration 315 decorative - the
// boundary would exist in the database and be bypassed by the only thing that
// talks to it."
//
// That is asserted three ways rather than promised once, because a promise in a
// header comment is the weakest form this could take:
//
//   1. STRUCTURALLY, by what is not imported. `_shared/supabase.ts` and its
//      getServiceClient() are absent from this file. There is no client here to
//      hand a key to.
//   2. AT LOAD, by scrubbing the environment. The service-role key and
//      SUPABASE_DB_URL are deleted from this isolate before any handler exists,
//      so a later edit that reaches for either gets undefined rather than a
//      credential. SUPABASE_DB_URL is scrubbed too and is the sharper of the
//      pair: it is a superuser DSN, which is worse than service_role, and it is
//      injected by the platform whether or not anyone asked for it.
//   3. AT THE DATABASE, by asking who we actually are. On the first query of
//      each cold start the connection asserts `current_user = 'mcp_reader'` AND
//      that it has NO select privilege on mcp.lesson. Both must hold or the
//      function serves nothing.
//
// (3) is the only one of the three that can catch a wrong credential, because
// it asks the database instead of the code. It is also the assertion that keeps
// this function from quietly becoming the holder path: the day someone wants
// lesson bodies, this check fails and forces the decision into the open rather
// than letting a changed password widen the boundary in silence.
//
// ===================== VALIDATION IS OWNED HERE =====================
//
// MCP-COURSEWARE.md section 3, stated as the cost of one function rather than
// four: "the function's input surface is wider than any single tool's, so its
// own validation must be real rather than inherited from a tool schema."
//
// So validateArgs below is enforcement, not documentation. It rejects unknown
// keys outright -- an unrecognised field means the caller and this function
// disagree about the contract, and guessing which of them is right is how a
// filter silently stops filtering. Nothing reaching SQL is interpolated; every
// value is a bound parameter.
//
// ===================== LOGGING =====================
//
// THE SEARCH QUERY IS NEVER LOGGED. Only its length. Same rule the credential
// path encodes by logging nothing about a lookup: the caller's search string is
// the caller's business, it can carry anything a partner typed, and a log line
// is a copy of it in a place nobody is treating as content.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

// --------------------------------------------------------------- (2) scrub
//
// Before anything else in this module. Deleting is the point: a later edit that
// calls Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") gets undefined and fails,
// rather than getting a working key and succeeding.
for (const name of [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_URL",
]) {
  try {
    Deno.env.delete(name);
  } catch {
    // Deletion is defence in depth, not the boundary. (1) and (3) hold without
    // it, so a runtime that refuses is not a reason to fail the request.
  }
}

// ------------------------------------------------------------------ config

const DB_USER = "mcp_reader"; // never a variable, never from the environment
const PASSWORD = Deno.env.get("MCP_READER_PASSWORD") ?? "";
const DB_HOST = Deno.env.get("MCP_READER_DB_HOST") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";

// ============ THREE CONNECTION SHAPES, AND THE HOST SETTLES ONE THING ========
//
//   shape              host                                  user              port
//   -----------------  ------------------------------------  ----------------  ----
//   shared pooler      aws-0-<region>.pooler.supabase.com     mcp_reader.<ref>  6543 txn / 5432 session
//   DEDICATED pooler   db.<ref>.supabase.co                   mcp_reader        6543
//   direct             db.<ref>.supabase.co                   mcp_reader        5432
//
// THE USERNAME FORM IS DERIVABLE, AND ONLY FROM THE HOST. Only the SHARED
// pooler qualifies the role with the project ref, because only it multiplexes
// many projects behind one hostname and needs the ref to route. A dedicated
// pooler and a direct connection both answer on a host that already names the
// project, so both take the bare role.
//
// THE PORT IS NOT DERIVABLE, AND ASSUMING OTHERWISE WAS THE BUG. This read
// `IS_POOLER ? 6543 : 5432`, which encodes "a db.<ref> host means a direct
// connection". THIS PROJECT RUNS A DEDICATED POOLER ON db.<ref>.supabase.co:6543
// -- same hostname as a direct connection, same bare username, different port.
// No amount of string inspection separates those two, so the old default sent a
// dedicated-pooler deployment at 5432 and it only worked because the port had
// been set by hand.
//
// THE SHARED/DEDICATED DISTINCTION IS INVISIBLE IN A CONNECTION STRING except by
// the ABSENCE of the ref in the username, which is the kind of negative evidence
// the next reader reconstructs wrongly. It is written down here rather than left
// to be re-derived from a dashboard.
//
// So: 6543 unless told otherwise. Pooled is the right answer for a function that
// lives for one request, and the shape that is now WRONG by default -- a genuine
// direct connection -- is the one Supabase steers away from for serverless
// callers. MCP_READER_DB_PORT overrides for direct or session-mode.
const PROJECT_REF = (SUPABASE_URL.match(/^https:\/\/([a-z0-9]+)\.supabase\./)?.[1]) ?? "";
const IS_SHARED_POOLER = /(^|\.)pooler\.supabase\.com$/i.test(DB_HOST);
const CONN_USER = IS_SHARED_POOLER && PROJECT_REF ? `${DB_USER}.${PROJECT_REF}` : DB_USER;
const PORT_WAS_SET = Deno.env.get("MCP_READER_DB_PORT") !== undefined;
const DB_PORT = Number(Deno.env.get("MCP_READER_DB_PORT") ?? 6543);

/**
 * Which shape we believe we are talking to. Reported, never acted on beyond the
 * two values above -- its whole job is to make a wrong guess ONE LOG LINE rather
 * than a connect timeout with nothing to read.
 */
const CONN_SHAPE = IS_SHARED_POOLER
  ? `shared pooler (${DB_PORT === 5432 ? "session" : "transaction"} mode)`
  : DB_PORT === 6543
    ? "dedicated pooler"
    : DB_PORT === 5432
      ? "direct"
      : "non-standard port";

let pool: Pool | null = null;
function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      user: CONN_USER,
      password: PASSWORD,
      database: "postgres",
      hostname: DB_HOST,
      port: DB_PORT,
      tls: { enabled: true },
    }, 2, true);
  }
  return pool;
}

// ------------------------------------------------------- (3) identity check
//
// Once per cold start, awaited by every request. The pool's credentials are
// fixed at construction, so one connection proving its identity proves it for
// every connection the pool will open.
//
// Both halves are asserted. The positive half alone would pass for a superuser
// impersonating nothing; the negative half is the paywall, and it is the one
// that can contradict the deployment.
let identity: Promise<void> | null = null;
function assertIdentity(): Promise<void> {
  if (!identity) {
    identity = (async () => {
      const conn = await getPool().connect();
      try {
        const r = await conn.queryObject<{
          who: string;
          session_who: string;
          reader_can_read_lessons: boolean;
        }>({
          text:
            "select current_user::text as who, " +
            "session_user::text as session_who, " +
            "has_table_privilege(current_user, 'mcp.lesson', 'SELECT') as reader_can_read_lessons",
          args: [],
        });
        const row = r.rows[0];
        if (!row) throw new Error("identity check returned no row");
        if (row.who !== DB_USER || row.session_who !== DB_USER) {
          throw new Error(
            `connected as ${row.session_who}/${row.who}, expected ${DB_USER} -- refusing to serve`,
          );
        }
        if (row.reader_can_read_lessons) {
          throw new Error(
            "this connection can select mcp.lesson; courseware-read is the reader path and must not -- refusing to serve",
          );
        }
        // ONCE PER COLD START, AND ONLY AFTER THE ASSERTIONS PASS. The port
        // cannot be derived from the host, so the shape below is a BELIEF. This
        // line is what turns a wrong one into something readable instead of a
        // connect timeout with nothing attached. No password, and no secret
        // value -- host, port and role are operational facts.
        console.log(JSON.stringify({
          fn: "courseware-read",
          event: "connected",
          shape: CONN_SHAPE,
          host: DB_HOST,
          port: DB_PORT,
          port_explicit: PORT_WAS_SET,
          user: CONN_USER,
        }));
      } finally {
        conn.release();
      }
    })().catch((e) => {
      identity = null; // a cold start that failed must retry, not cache the failure
      throw e;
    });
  }
  return identity;
}

// --------------------------------------------------------------- validation

const RESOURCES = ["certification", "task", "concept", "search"] as const;
type Resource = typeof RESOURCES[number];

// mcp.task and mcp.lesson carry these three; mcp.concept and mcp.certification
// are English-only, which is a fact about the data and not about this list.
// MCP-COURSEWARE.md section 5.
const LANGUAGES = ["en", "es-419", "pt-BR"] as const;
type Language = typeof LANGUAGES[number];

const DOMAIN_RE = /^D[0-9]{1,2}$/;
const TASK_RE = /^[0-9]{1,2}\.[0-9]{1,2}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG = 100;
const MAX_QUERY = 200;
const MIN_QUERY = 2;
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

// Per resource, exactly the keys it accepts. Anything else is a 400 rather than
// a shrug: an unknown key means the caller believes it is filtering and this
// function is not, which is the failure mode a permissive parser produces
// silently.
const ALLOWED: Record<Resource, string[]> = {
  certification: ["resource"],
  task: ["resource", "language", "domain_code", "task_code", "limit"],
  concept: ["resource", "slug", "task_code", "limit"],
  search: ["resource", "query", "language", "limit"],
};

type Args = {
  resource: Resource;
  language: Language;
  domain_code?: string;
  task_code?: string;
  slug?: string;
  query?: string;
  limit: number;
};

function bad(msg: string): never {
  throw new BadRequest(msg);
}
class BadRequest extends Error {}

function validateArgs(raw: unknown): Args {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    bad("body must be a JSON object");
  }
  const b = raw as Record<string, unknown>;

  const resource = b.resource;
  if (typeof resource !== "string" || !(RESOURCES as readonly string[]).includes(resource)) {
    bad(`resource must be one of: ${RESOURCES.join(", ")}`);
  }
  const res = resource as Resource;

  for (const key of Object.keys(b)) {
    if (!ALLOWED[res].includes(key)) {
      bad(`unknown field '${key}' for resource '${res}'`);
    }
  }

  let language: Language = "en";
  if (b.language !== undefined) {
    if (typeof b.language !== "string" || !(LANGUAGES as readonly string[]).includes(b.language)) {
      bad(`language must be one of: ${LANGUAGES.join(", ")}`);
    }
    language = b.language as Language;
  }

  let limit = DEFAULT_LIMIT;
  if (b.limit !== undefined) {
    if (typeof b.limit !== "number" || !Number.isInteger(b.limit) || b.limit < 1 || b.limit > MAX_LIMIT) {
      bad(`limit must be an integer between 1 and ${MAX_LIMIT}`);
    }
    limit = b.limit;
  }

  const out: Args = { resource: res, language, limit };

  if (b.domain_code !== undefined) {
    if (typeof b.domain_code !== "string" || !DOMAIN_RE.test(b.domain_code)) {
      bad("domain_code must look like D1");
    }
    out.domain_code = b.domain_code;
  }
  if (b.task_code !== undefined) {
    if (typeof b.task_code !== "string" || !TASK_RE.test(b.task_code)) {
      bad("task_code must look like 1.2");
    }
    out.task_code = b.task_code;
  }
  if (b.slug !== undefined) {
    if (typeof b.slug !== "string" || b.slug.length > MAX_SLUG || !SLUG_RE.test(b.slug)) {
      bad("slug must be lowercase kebab-case");
    }
    out.slug = b.slug;
  }
  if (res === "search") {
    if (typeof b.query !== "string") bad("query is required for resource 'search'");
    const q = b.query.trim();
    // Length only. The value itself never reaches a log line or an error
    // message -- an error quoting the query is a log entry wearing a 400.
    if (q.length < MIN_QUERY || q.length > MAX_QUERY) {
      bad(`query must be between ${MIN_QUERY} and ${MAX_QUERY} characters`);
    }
    out.query = q;
  } else if (b.query !== undefined) {
    bad(`query is only valid for resource 'search'`);
  }

  return out;
}

// ------------------------------------------------------------------ queries
//
// Every value is a bound parameter. No identifier and no literal is built from
// caller input, so there is nothing for a quote to escape out of.

type Q = { text: string; args: unknown[] };

function buildQuery(a: Args): { q: Q; searched?: string[] } {
  switch (a.resource) {
    case "certification":
      return {
        q: {
          text:
            "select code, name, description, tier, status, exam_duration_minutes, " +
            "passing_score_pct, num_questions, max_exam_attempts, attempt_window_months, validity_days " +
            "from mcp.certification",
          args: [],
        },
      };

    case "task":
      return {
        q: {
          text:
            "select domain_code, domain_title, domain_title_is_fallback, domain_weight_pct, " +
            "task_code, language, statement, knowledge, skills, abilities, bloom_level, " +
            "is_exam_scope, scope_tag " +
            "from mcp.task " +
            "where language = $1 " +
            "and ($2::text is null or domain_code = $2) " +
            "and ($3::text is null or task_code = $3) " +
            "order by domain_order, task_order " +
            "limit $4",
          args: [a.language, a.domain_code ?? null, a.task_code ?? null, a.limit],
        },
      };

    case "concept":
      return {
        q: {
          text:
            "select slug, name, description, task_codes " +
            "from mcp.concept " +
            "where ($1::text is null or slug = $1) " +
            "and ($2::text is null or $2 = any(task_codes)) " +
            "order by slug " +
            "limit $3",
          args: [a.slug ?? null, a.task_code ?? null, a.limit],
        },
      };

    case "search": {
      // MCP-COURSEWARE.md section 5: there is no concept_translations table, so
      // a non-English search covers tasks and KSAs and NOT concepts. That
      // reduction is REPORTED rather than absorbed, for the same reason
      // mcp.task exposes domain_title_is_fallback -- a thinner result the
      // caller cannot detect is the same defect class as a dropped read.
      const withConcepts = a.language === "en";
      const searched = withConcepts ? ["task", "concept"] : ["task"];

      // ===================== WHY THERE IS A SCORE AT ALL =====================
      //
      // This ordered by `kind, key` and truncated at `limit`. 'concept' sorts
      // before 'task', so a broad query returned CONCEPTS ONLY: on AISM-I, "AI"
      // matched 92 concepts and 54 tasks, and at the default limit of 20 a
      // partner received twenty concepts and NOT ONE TASK -- from the tool whose
      // stated job is what a credential examines. It reported truncated:true
      // honestly, which made it worse: correct, self-describing and useless.
      //
      // ============== AND THE MATCHING WAS WRONG UNDERNEATH IT ==============
      //
      // It matched with ILIKE '%term%', which has no notion of a word. "AI"
      // matched inside "expl-AI-n", "dom-AI-n", "avail-AI-ble" -- so task 1.1,
      // "Explain why service management exists", counted as a match for AI. The
      // 92/54 above were themselves inflated: with word boundaries the honest
      // figures are 60 and 36, and every score component fired on every row, so
      // the score could not discriminate even once the ordering was fixed.
      //
      // Matching is now `~* '\y<term>'`: anchored at a WORD BOUNDARY, with any
      // suffix allowed. The leading boundary kills "explain"; the open suffix
      // keeps "incident" matching "incidents" and "AI" matching "AIOps".
      // Deliberately NOT '\y<term>\y', which would lose the plural -- the same
      // morphology trap CLAUDE.md records for the vocabulary patterns. Note a
      // hyphen counts as a boundary, which is wanted here.
      //
      // NOT FULL-TEXT SEARCH, AND THAT IS DELIBERATE. tsvector + GIN is the
      // reflex and buys nothing: a search is CERTIFICATION-SCOPED, so the corpus
      // is 61 tasks and 226 concepts today and stays a few hundred rows at
      // twelve certifications -- the scan is microseconds. It would also cost a
      // per-language regconfig, and to_tsvector(CASE language ...) is not
      // immutable, so indexing means partial indexes per language per table.
      // Real machinery for a performance problem that does not exist. This works
      // identically across en, es-419 and pt-BR and can be replaced by FTS later
      // without touching the tool contract.
      //
      // THE SCALE IS ARBITRARY AND ITS ORDERING IS NOT. A phrase hit in the
      // primary field outranks any number of scattered term hits, because a task
      // whose STATEMENT contains the phrase is what was asked for.
      const rx = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const terms = a.query!.toLowerCase().split(/\s+/).filter((t) => t.length >= 2).slice(0, 8);
      const phrase = "\\y" + rx(a.query!.trim()).replace(/\s+/g, "\\s+");

      // $1 phrase, $2 language, $3 limit, then one param per term.
      const args: unknown[] = [phrase, a.language, a.limit];
      const termParams: string[] = [];
      for (const t of terms) {
        args.push("\\y" + rx(t));
        termParams.push(`$${args.length}`);
      }
      const score = (primary: string, secondary: string) => {
        const parts = [
          `(case when ${primary} ~* $1 then 100 else 0 end)`,
          `(case when ${secondary} ~* $1 then 40 else 0 end)`,
        ];
        for (const p of termParams) {
          parts.push(`(case when ${primary} ~* ${p} then 10 else 0 end)`);
          parts.push(`(case when ${secondary} ~* ${p} then 3 else 0 end)`);
        }
        return parts.join(" + ");
      };
      const anyOf = (primary: string, secondary: string) =>
        [`${primary} ~* $1`, `${secondary} ~* $1`]
          .concat(termParams.flatMap((p) => [`${primary} ~* ${p}`, `${secondary} ~* ${p}`]))
          .join(" or ");

      const ksa =
        "coalesce(knowledge,'') || ' ' || coalesce(skills,'') || ' ' || coalesce(abilities,'')";
      const taskPart =
        "select 'task' as kind, task_code as key, statement as title, domain_code, " +
        score("statement", ksa) + " as score " +
        "from mcp.task where language = $2 and (" + anyOf("statement", ksa) + ")";
      const conceptPart =
        " union all " +
        "select 'concept', slug, name, null::text, " +
        score("name", "coalesce(description,'')") + " " +
        "from mcp.concept where (" + anyOf("name", "coalesce(description,'')") + ")";

      // kind_total is a window count over ALL matches of that kind, computed
      // BEFORE the row_number cut -- so the caller is told how many exist, not
      // how many came back. Without it "20 results" cannot be told apart from
      // "20 results out of 60".
      //
      // THE ORDER BY IS PART OF THE PUBLISHED CONTRACT: score, then key. LIMIT
      // over equal scores is unstable in Postgres without a tie-break, and a
      // partner who runs the same query twice and gets different answers is
      // right to conclude the tool is broken. Changing this later is a contract
      // change, not a tidy-up.
      return {
        q: {
          text:
            "with m as (" + taskPart + (withConcepts ? conceptPart : "") + "), " +
            "r as (select *, count(*) over (partition by kind) as kind_total, " +
            "row_number() over (partition by kind order by score desc, key asc) as rn from m) " +
            "select kind, key, title, domain_code, score, kind_total " +
            "from r where rn <= $3 order by kind, rn",
          args,
        },
        searched,
      };
    }
  }
}

// ------------------------------------------------------------------ handler

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  const started = Date.now();
  let args: Args | null = null;

  try {
    if (!PASSWORD || !DB_HOST) {
      // Named without values. Which secret is missing is operational
      // information; neither secret's content is.
      console.error("courseware-read: missing MCP_READER_PASSWORD or MCP_READER_DB_HOST");
      return jsonResponse({ error: "not configured" }, 500);
    }

    const raw = await req.json().catch(() => bad("body must be valid JSON"));
    args = validateArgs(raw);

    await assertIdentity();

    const { q, searched } = buildQuery(args);
    const conn = await getPool().connect();
    let rows: Record<string, unknown>[];
    try {
      const r = await conn.queryObject<Record<string, unknown>>(q);
      rows = r.rows;
    } finally {
      conn.release();
    }

    // THE QUERY IS NEVER HERE. Its length is.
    console.log(JSON.stringify({
      fn: "courseware-read",
      resource: args.resource,
      language: args.language,
      ...(args.resource === "search" ? { q_len: args.query!.length, searched } : {}),
      rows: rows.length,
      ms: Date.now() - started,
    }));

    return jsonResponse({
      resource: args.resource,
      language: args.language,
      certification: "AISM-I",
      ...(searched ? { searched } : {}),
      count: rows.length,
      rows,
    });
  } catch (e) {
    if (e instanceof BadRequest) {
      console.log(JSON.stringify({
        fn: "courseware-read",
        resource: args?.resource ?? null,
        rejected: e.message,
        ms: Date.now() - started,
      }));
      return jsonResponse({ error: e.message }, 400);
    }
    // The caller gets no internals. A failed identity assertion in particular
    // must not tell an unauthenticated caller which role the function holds.
    console.error("courseware-read failed:", e instanceof Error ? e.message : String(e));
    return jsonResponse({ error: "read failed" }, 500);
  }
});
