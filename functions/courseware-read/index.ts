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
import { parseLesson } from "../_shared/lesson-blocks.ts";

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
          writable_relations: number;
          served: string | null;
        }>({
          text:
            "select current_user::text as who, " +
            "session_user::text as session_who, " +
            "has_table_privilege(current_user, 'mcp.lesson', 'SELECT') as reader_can_read_lessons, " +
            // BY OID, NOT BY NAME, AND THE DIFFERENCE IS WHY THIS BROKE ONCE.
            //
            // This read `has_table_privilege(current_user, 'public.mcp_requests',
            // 'INSERT')` and every valid request 500'd. Resolving a
            // SCHEMA-QUALIFIED NAME requires USAGE on that schema before any
            // privilege is reported -- LookupExplicitNamespace checks ACL_USAGE
            // and raises 42501 -- and mcp_reader has no USAGE on public, by
            // design. So the assertion could not even ask its question, and the
            // function refused to serve on a property that was in fact true.
            //
            // The `mcp.lesson` check above survives because mcp_reader DOES have
            // USAGE on mcp. Same function, same shape, two schemas: the one
            // without usage is the one that failed.
            //
            // The OID form performs no name resolution, so it is answerable by a
            // role that cannot see the schema. pg_catalog is world-readable, so
            // the scan itself needs nothing.
            //
            // AND IT ASSERTS MORE THAN IT DID BEFORE. The old check said "cannot
            // insert into the log table"; this says "CANNOT INSERT ANYWHERE",
            // which is the property actually claimed for this role -- EXECUTE on
            // one definer function and write access to nothing. 384 relations,
            // once per cold start.
            // SCHEMA net IS EXCLUDED BY NAME, AND THAT IS A RECORDED EXCEPTION
            // RATHER THAN A LOOSENED CHECK.
            //
            // The assertion fired for real on 2026-09-14: mcp_reader could write
            // to TWO relations, net.http_request_queue and net._http_response.
            // pg_net grants ALL on both to PUBLIC and USAGE on schema net to
            // PUBLIC, so every role on this database can enqueue outbound HTTP.
            // The property "mcp_reader can write nothing" was never true and the
            // check was right to refuse.
            //
            // It is not fixed by widening this predicate. pg_net is load-bearing
            // -- dispatch-webhooks and dispatch-emails both call net.http_post
            // every minute -- so revoking PUBLIC is its own migration with its
            // own blast radius. See 319's footer.
            //
            // Excluding ONE NAMED SCHEMA keeps everything this check was for: a
            // grant appearing in public, mcp, or any schema that does not exist
            // yet still refuses to serve. What it no longer does is block on a
            // platform default that is now written down in two places.
            "(select count(*) from pg_class c " +
            "   join pg_namespace ns on ns.oid = c.relnamespace " +
            " where c.relkind in ('r','p','v','m','f') " +
            "   and ns.nspname <> 'net' " +
            "   and has_table_privilege(current_user, c.oid, 'INSERT'))::int as writable_relations, " +
            // WHAT THE DATABASE ACTUALLY SERVES, asked of the database.
            // CERTIFICATIONS in the shared module is a THIRD copy of a list that
            // lives in migration 325's view definitions and in the Worker's
            // contract. Two languages and a repository boundary, so no shared
            // module can close it -- but this half can ask the authority and
            // refuse to serve on a difference, which converts a silent drift
            // into a named failure on the side that can be tested.
            "(select string_agg(code, ',' order by code) from mcp.certification) as served",
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
        if (Number(row.writable_relations) !== 0) {
          throw new Error(
            `this connection can INSERT into ${row.writable_relations} relation(s); mcp_reader must reach ` +
              "the log only through mcp.log_request, whose owner bounds what a defect can write -- refusing to serve",
          );
        }
        // ONCE PER COLD START, AND ONLY AFTER THE ASSERTIONS PASS. The port
        // cannot be derived from the host, so the shape below is a BELIEF. This
        // line is what turns a wrong one into something readable instead of a
        // connect timeout with nothing attached. No password, and no secret
        // value -- host, port and role are operational facts.
        // ============ ASYMMETRIC, AND THE SYMMETRY IS WHAT BROKE PRODUCTION ============
        //
        // This was an equality: `served !== expected` threw. On 2026-09-16
        // migration 328 widened mcp.certification to eight while CERTIFICATIONS
        // still said four, and this line refused to serve ALL EIGHT. The four
        // that had worked for weeks went down with the four being added.
        //
        // AND THERE WAS NO ORDERING THAT AVOIDED IT. Views first: served(8) !=
        // expected(4). Function first: served(4) != expected(8). An equality
        // across a deploy boundary makes a two-copy list unshippable in either
        // direction. The ordering was never the mistake; the predicate was.
        //
        // The two differences are not the same risk and must not share a
        // consequence:
        //
        //   served SUPERSET of expected -- somebody widened the views and this
        //     function has not been deployed yet. The extra certifications are
        //     simply not offered; every one this function knows about still
        //     works. Safe. Log it so nobody hunts for it.
        //
        //   expected NOT SUBSET of served -- this function believes it serves a
        //     certification the views do not carry. Every request for it would
        //     reach a view that filters it out and return an empty result that
        //     looks like an answer. That is the silent-success failure this
        //     repository exists to avoid. REFUSE.
        //
        // What survives from the old check: CERTIFICATIONS stays a literal, so
        // `Certification` stays a compile-time type and parse() keeps returning a
        // narrowed value. Deriving the list from the database would have cost
        // that and bought a widening nobody reviewed.
        const expectedList = [...CERTIFICATIONS].sort();
        const servedList = (row.served ?? "").split(",").map((c) => c.trim()).filter(Boolean).sort();
        const servedSet = new Set(servedList);

        // COMPUTED, NOT ASSUMED. Both directions are named, by code.
        const usable = expectedList.filter((c) => servedSet.has(c));
        const missing = expectedList.filter((c) => !servedSet.has(c));
        const expectedSet = new Set<string>(expectedList);
        const notDeployed = servedList.filter((c) => !expectedSet.has(c));

        if (missing.length > 0) {
          throw new Error(
            `this function expects to serve [${missing.join(", ")}] but mcp.certification ` +
              `does not carry ${missing.length === 1 ? "it" : "them"} -- refusing to serve. ` +
              `A request for ${missing.length === 1 ? "that code" : "those codes"} would read a ` +
              `view that filters it out and return an empty result that looks like an answer. ` +
              `The views serve [${servedList.join(", ")}].`,
          );
        }

        if (notDeployed.length > 0) {
          // Written to be read at 3am by somebody asking why a new certification
          // returns nothing. It names the cause, the effect and the fix, and it
          // does not use the word "mismatch".
          console.warn(JSON.stringify({
            fn: "courseware-read",
            event: "views_widened_function_not_deployed",
            summary:
              `mcp.certification now serves ${notDeployed.length} certification(s) this ` +
              `deployment has never heard of. They are NOT being served and every request ` +
              `for them returns 400. Nothing is broken; this function is behind.`,
            not_served_until_redeploy: notDeployed,
            serving: usable,
            fix: "widen CERTIFICATIONS in functions/_shared/courseware-query.ts and redeploy courseware-read",
          }));
        }

        console.log(JSON.stringify({
          fn: "courseware-read",
          event: "connected",
          certifications: usable,
          behind_by: notDeployed.length ? notDeployed : undefined,
          shape: CONN_SHAPE,
          writable_relations: 0,
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

import {
  type Args,
  CERTIFICATIONS,
  TOOLS,
  bad,
  BadRequest,
  buildQuery,
  redactEmails,
  requiredScope,
  validateArgs,
} from "../_shared/courseware-query.ts";

// ===================== AUTHORIZATION =====================
//
// THIS FUNCTION IS PUBLIC. The Worker is A CALLER OF IT, not a gate in front of
// it: `verify_jwt = false`, and the smoke test has always reached it with curl.
//
// So a design where the Worker checks the key and sends `scope:
// "courseware:lessons"` in the body gives this function NOTHING IT CAN CHECK. A
// field naming a permission is worth exactly what the least trustworthy party
// who can set it is worth, and that party is anyone who can type a JSON object.
// Signing the assertion would only move the question to "who holds the signing
// key", and the answer would be a static secret in two deployments.
//
// SO NO SCOPE IS ACCEPTED FROM ANY CALLER. The presented key is hashed here and
// the DATABASE says what it authorises (migration 323). The answer comes from a
// row keyed by a secret only a real key holder has, which is the only form of
// this that does not reduce to trusting the sender.
//
// THE ORDERING IS PART OF THE PROPERTY. Authorization resolves on the
// mcp_reader pool, which provably cannot select mcp.lesson -- so the credential
// in hand while the decision is being made cannot fetch a body even if the
// decision goes wrong. Only after it passes does the holder pool get used.
//
// The header is x-certidemy-key, matching issue-partner-credential, for the
// reason recorded there: Authorization on this platform means a Supabase JWT
// everywhere else, and the gateway has opinions about it.

class Unauthorized extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "Unauthorized";
    this.status = status;
  }
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface KeyRow {
  key_id: string;
  issuer_id: string;
  scopes: string[];
  key_status: string;
}

/**
 * ON THE READER POOL, DELIBERATELY. See the ordering note above.
 *
 * Returns null for an unknown hash. A revoked or expired key comes back WITH a
 * status so the reason reaches the log -- while the caller gets one message for
 * every failure, because distinguishing "no such key" from "revoked key" tells
 * a prober which of their guesses was once real.
 */
async function resolveKey(presented: string): Promise<KeyRow | null> {
  const conn = await getPool().connect();
  try {
    const r = await conn.queryObject<KeyRow>({
      text:
        "select key_id::text as key_id, issuer_id::text as issuer_id, " +
        "       scopes, key_status " +
        "  from mcp.resolve_api_key($1)",
      args: [await sha256Hex(presented)],
    });
    return r.rows[0] ?? null;
  } finally {
    conn.release();
  }
}

/* ===================== THE SECOND WAY IN: AN OAUTH TOKEN =====================
 *
 * A partner connecting from a chat client holds no API key. They hold a Supabase
 * OAuth access token, obtained through the consent screen that writes
 * `oauth_issuer_bindings` (326).
 *
 * THE GATE STAYS HERE. The Worker forwards the bearer and resolves nothing: it
 * cannot, because 315 and 316 put the boundary in the grant rather than in an
 * `if`, and moving it to application code for one class of caller would undo
 * that. Two ways in, one code path after resolution -- the scope check below is
 * the same check for both.
 *
 * ===================== WHY A DEDICATED HEADER =====================
 *
 * `x-certidemy-token`, sibling to `x-certidemy-key`. NOT `Authorization`: this
 * function is pinned `verify_jwt = false` so the platform would pass one
 * through, but a credential that looks like the platform's own is a credential
 * somebody will eventually validate twice or not at all. The two ways in are
 * visibly two headers.
 *
 * ===================== aud IS NEVER READ =====================
 *
 * `aud` is `"authenticated"` on every token this project issues -- an ordinary
 * browser session and an agent's token carry the identical value, so a check
 * against it passes on everything and LOOKS like a control. MCP-SERVER.md 13.
 *
 * What discriminates is `client_id`: measured 2026-09-16, PRESENT on an OAuth
 * access token and ABSENT from a password-grant session. The password grant does
 * not mint one, so a learner's browser session cannot be presented here as an
 * agent. That claim is required below, and its absence is a refusal.
 */

interface TokenClaims {
  sub: string;
  client_id: string;
}

/**
 * WHY a token was refused. LOG ONLY -- the caller still gets one message.
 *
 * The first version returned `null` for nine distinct causes and the row said
 * `token_invalid` for all of them. Asked "which check rejected it -- signature,
 * iss, exp, or client_id?", the log could not answer, and the answer is the
 * whole point of having the row.
 *
 * The one-message-to-the-caller rule is about what a PROBER learns, and this
 * value never reaches a response body. resolveKey already works this way:
 * keyStatus carries revoked / expired / unknown into the log while the caller
 * gets "invalid API key" for all three. This is the same split, applied to the
 * credential that has nine ways to be wrong instead of three.
 */
type TokenRefusal =
  | "malformed"        // not three segments, or the header/claims are not JSON
  | "bad_alg"          // alg is not ES256, or no kid
  | "unknown_kid"      // kid is absent from the JWKS even after a refetch
  | "bad_signature"    // the signature does not verify against that key
  | "wrong_issuer"     // iss is not this project's auth server
  | "expired"          // exp is missing or in the past
  | "no_client_id"     // an ordinary session token: the discriminator is absent
  | "no_sub";          // no subject to resolve a binding for

interface CallerRow {
  caller_id: string;
  issuer_id: string;
  scopes: string[];
  status: string;
}

const AUTH_ISS = `${Deno.env.get("SUPABASE_URL") ?? ""}/auth/v1`;
const JWKS_URL = `${AUTH_ISS}/.well-known/jwks.json`;

// deno-lint-ignore no-explicit-any
let jwksCache: { at: number; keys: any[] } | null = null;

// deno-lint-ignore no-explicit-any
async function jwks(force = false): Promise<any[]> {
  // A COLD CACHE IS NOT AN EMPTY KEY SET. A failed fetch throws rather than
  // returning [], because [] would make every token unverifiable and read as
  // every token being forged.
  if (!force && jwksCache && Date.now() - jwksCache.at < 10 * 60 * 1000) {
    return jwksCache.keys;
  }
  const res = await fetch(JWKS_URL, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`jwks ${res.status}`);
  const body = await res.json();
  const keys = Array.isArray(body?.keys) ? body.keys : [];
  if (keys.length === 0) throw new Error("jwks returned no keys");
  jwksCache = { at: Date.now(), keys };
  return keys;
}

// `Uint8Array<ArrayBuffer>`, NOT `Uint8Array`. The bare annotation widens the
// buffer to ArrayBufferLike and crypto.subtle rejects it (TS2769). CLAUDE.md
// records this trap under Edge functions; it caught this helper on the first
// type check anyway, which is the difference between a rule being written down
// and being remembered.
const b64url = (seg: string): Uint8Array<ArrayBuffer> => {
  const pad = seg.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
};

/**
 * Verify a Supabase OAuth access token and return the two claims that matter.
 *
 * Returns null for anything that does not verify. ONE ANSWER FOR EVERY CAUSE,
 * for the reason resolveKey gives: distinguishing "bad signature" from "expired"
 * from "no client_id" tells a prober which guess was closest.
 */
async function verifyPartnerToken(
  jwt: string,
): Promise<{ claims: TokenClaims } | { refusal: TokenRefusal }> {
  const parts = jwt.split(".");
  if (parts.length !== 3) return { refusal: "malformed" };

  let header: { alg?: string; kid?: string };
  let claims: Record<string, unknown>;
  try {
    header = JSON.parse(new TextDecoder().decode(b64url(parts[0])));
    claims = JSON.parse(new TextDecoder().decode(b64url(parts[1])));
  } catch {
    return { refusal: "malformed" };
  }
  // ES256 ONLY, AND THE ALGORITHM IS NOT NEGOTIATED BY THE TOKEN. Accepting
  // whatever `alg` says is how a signed token becomes an unsigned one.
  if (header.alg !== "ES256" || !header.kid) return { refusal: "bad_alg" };

  let keyset = await jwks();
  let jwk = keyset.find((k) => k.kid === header.kid);
  if (!jwk) {
    keyset = await jwks(true); // a rotation is not a forgery; refetch once
    jwk = keyset.find((k) => k.kid === header.kid);
  }
  if (!jwk) return { refusal: "unknown_kid" };

  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );
  const ok = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    b64url(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!ok) return { refusal: "bad_signature" };

  if (claims.iss !== AUTH_ISS) return { refusal: "wrong_issuer" };
  const exp = typeof claims.exp === "number" ? claims.exp : 0;
  if (!exp || exp * 1000 <= Date.now()) return { refusal: "expired" };

  // THE DISCRIMINATOR. Absent means a browser session, not an agent.
  const clientId = typeof claims.client_id === "string" ? claims.client_id : "";
  const sub = typeof claims.sub === "string" ? claims.sub : "";
  if (!clientId) return { refusal: "no_client_id" };
  if (!sub) return { refusal: "no_sub" };

  return { claims: { sub, client_id: clientId } };
}

/**
 * Has the platform revoked this feature for the company behind this issuer?
 *
 * ============ TWO GATES, AND THE SECOND IS NOT THE FIRST ============
 *
 * The credential answering "I am scoped for this" and the platform answering
 * "this partner may have it" are different questions with different owners. An
 * API key's `scopes` are the PARTNER narrowing their own automation, chosen at
 * mint time. A disable row is CERTIDEMY revoking a feature, written by a
 * superadmin.
 *
 * Without this call, disabling courseware for a partner leaves every API key
 * they already hold working -- a revocation that appears to succeed and does
 * not, which is the exact failure 331 is shaped around. The superadmin sees the
 * row, the partner keeps reading lessons, and nobody looks again.
 *
 * ============ IT FAILS CLOSED, BECAUSE THE QUESTION FAILS OPEN ============
 *
 * 331's header states the inversion: "is the scope present" fails closed, "is it
 * disabled" fails OPEN, since every way of failing to learn the truth reads as
 * "not disabled". So `mcp.feature_status` returns a STATUS and never an empty
 * row, and this refuses on anything that is not `ok` -- an unknown issuer, an
 * unknown feature, or no row at all. A throw from the query propagates for the
 * same reason; it is never caught into a default of "enabled".
 */
interface FeatureRow {
  enabled: boolean;
  disabled_at: string | null;
  feature_status: string;
}

async function featureEnabled(
  issuerId: string,
  feature: string,
): Promise<{ row: FeatureRow | null; ms: number }> {
  const started = Date.now();
  const conn = await getPool().connect();
  try {
    const r = await conn.queryObject<FeatureRow>({
      text:
        "select enabled, disabled_at::text as disabled_at, feature_status " +
        "  from mcp.feature_status($1::uuid, $2)",
      args: [issuerId, feature],
    });
    return { row: r.rows[0] ?? null, ms: Date.now() - started };
  } finally {
    conn.release();
  }
}

/**
 * The OAuth twin of resolveKey, on the same reader pool and for the same reason.
 * Approval IS manual registration; mcp.resolve_oauth_caller (329) decides.
 */
async function resolveOauthCaller(t: TokenClaims): Promise<CallerRow | null> {
  const conn = await getPool().connect();
  try {
    const r = await conn.queryObject<
      { issuer_id: string | null; scopes: string[] | null; caller_status: string }
    >({
      text:
        "select issuer_id::text as issuer_id, scopes, caller_status " +
        "  from mcp.resolve_oauth_caller($1::uuid, $2::uuid)",
      args: [t.sub, t.client_id],
    });
    const row = r.rows[0];
    if (!row) return null;
    return {
      caller_id: t.sub,
      issuer_id: row.issuer_id ?? "",
      scopes: row.scopes ?? [],
      status: row.caller_status === "active" ? "active" : row.caller_status,
    };
  } finally {
    conn.release();
  }
}

/**
 * The Worker resolves the same key and sends what it found. THIS IS NOT THE
 * GATE and must never become one -- the gate is `derived` above, and it would
 * still hold with the Worker deleted. This compares the two answers.
 *
 * What it catches is drift between two repositories that read the same table:
 * if the Worker starts computing scopes differently, lessons stop being served
 * loudly instead of being served on the wrong basis quietly. A forged header is
 * caught too, but only incidentally -- forging it changes nothing, because the
 * derivation already decided.
 *
 * ABSENT IS FINE. A direct caller holding a real key sends no such header, and
 * that path must keep working; the Worker is a convenience, not a requirement.
 */
function crossCheckAssertedScope(req: Request, derived: string[]): void {
  const asserted = req.headers.get("x-certidemy-scope");
  if (asserted === null) return;
  const a = asserted.split(/[\s,]+/).filter(Boolean).sort().join(" ");
  const d = [...derived].sort().join(" ");
  if (a !== d) {
    throw new Unauthorized(403, "the presented scope does not match the key");
  }
}

// ===================== THE HOLDER POOL =====================
//
// A SECOND CREDENTIAL AND A SECOND ASSERTION, NOT A BRANCH.
//
// "No token, no lesson body" is enforced by which pool a request reaches, and
// the reader pool is provably incapable of the query -- migration 315 gives
// mcp_reader no grant on mcp.lesson and assertIdentity refuses to serve if that
// ever becomes false. An `if` here could be inverted by a refactor; a missing
// grant cannot.
//
// THE ASSERTION IS INVERTED, AND BOTH HALVES MATTER:
//
//   reader  MUST NOT read mcp.lesson   MUST NOT write anywhere
//   holder  MUST     read mcp.lesson   MUST NOT write anywhere
//
// The holder's positive half is the one that is easy to omit, and omitting it
// would mean a misconfigured holder pool serving nothing and reading as an empty
// certification rather than as a broken deployment.
const HOLDER_PASSWORD = Deno.env.get("MCP_HOLDER_PASSWORD") ?? "";

let holderPool: Pool | null = null;
function getHolderPool(): Pool {
  if (!holderPool) {
    holderPool = new Pool({
      user: IS_SHARED_POOLER && PROJECT_REF ? `mcp_holder.${PROJECT_REF}` : "mcp_holder",
      password: HOLDER_PASSWORD,
      database: "postgres",
      hostname: DB_HOST,
      port: DB_PORT,
      tls: { enabled: true },
    }, 2, true);
  }
  return holderPool;
}

let holderIdentity: Promise<void> | null = null;
function assertHolderIdentity(): Promise<void> {
  if (!holderIdentity) {
    holderIdentity = (async () => {
      const conn = await getHolderPool().connect();
      try {
        const r = await conn.queryObject<{
          who: string;
          session_who: string;
          can_read_lessons: boolean;
          writable_relations: number;
        }>({
          text:
            "select current_user::text as who, " +
            "session_user::text as session_who, " +
            "has_table_privilege(current_user, 'mcp.lesson', 'SELECT') as can_read_lessons, " +
            // By OID and excluding schema net, for the same two reasons the
            // reader's does: a schema-qualified name needs USAGE to RESOLVE, and
            // pg_net grants write access to PUBLIC. See 319's footer.
            "(select count(*) from pg_class c " +
            "   join pg_namespace ns on ns.oid = c.relnamespace " +
            " where c.relkind in ('r','p','v','m','f') " +
            "   and ns.nspname <> 'net' " +
            "   and has_table_privilege(current_user, c.oid, 'INSERT'))::int as writable_relations",
          args: [],
        });
        const row = r.rows[0];
        if (!row) throw new Error("holder identity check returned no row");
        if (row.who !== "mcp_holder" || row.session_who !== "mcp_holder") {
          throw new Error(
            `holder pool connected as ${row.session_who}/${row.who}, expected mcp_holder -- refusing to serve`,
          );
        }
        // THE POSITIVE HALF. A holder that cannot read a lesson is a broken
        // deployment, and without this it would present as an empty result.
        if (!row.can_read_lessons) {
          throw new Error(
            "the holder pool cannot select mcp.lesson; it exists to do exactly that -- refusing to serve",
          );
        }
        if (Number(row.writable_relations) !== 0) {
          throw new Error(
            `the holder pool can INSERT into ${row.writable_relations} relation(s); it must reach the log ` +
              "only through mcp.log_request -- refusing to serve",
          );
        }
        console.log(JSON.stringify({
          fn: "courseware-read",
          event: "holder-connected",
          shape: CONN_SHAPE,
          host: DB_HOST,
          port: DB_PORT,
          user: row.who,
          can_read_lessons: true,
          writable_relations: 0,
        }));
      } finally {
        conn.release();
      }
    })().catch((e) => {
      holderIdentity = null; // a failed cold start must retry, not cache the failure
      throw e;
    });
  }
  return holderIdentity;
}

// ------------------------------------------------------------------ logging
//
// ===================== LOGGING MUST NEVER BREAK A READ =====================
//
// Telemetry is not worth a 500 on a working query. Every failure path here
// returns false rather than throwing, and the caller's response is built from
// the read result regardless.
//
// BUT A SILENTLY FAILING LOGGER PRODUCES AN EMPTY TABLE NOBODY QUESTIONS, which
// is the same silent-success family as everything else in this repo. So a
// swallowed error is visible in two places, not one:
//
//   1. a distinct, greppable line -- "courseware-read LOG WRITE FAILED"
//   2. `logged: false` on the REQUEST line itself, every time
//
// The second is what makes an empty table answerable: if the table is empty and
// every request line says logged:true, the write is landing somewhere else; if
// they say logged:false, the reason is on the line above. A counter of
// consecutive failures rides along so a persistent outage is one glance rather
// than a scroll.
//
// It is also TIME-BOUNDED. A hung logger would otherwise delay the response,
// which is "logging breaking a read" by latency rather than by error.
let logFailStreak = 0;

const LOG_SQL =
  "select mcp.log_request($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)";

async function writeLogRow(args: unknown[]): Promise<boolean> {
  try {
    const conn = await getPool().connect();
    try {
      await conn.queryObject({ text: LOG_SQL, args });
    } finally {
      conn.release();
    }
    logFailStreak = 0;
    return true;
  } catch (e) {
    logFailStreak++;
    // Named, not silent. This is the line that explains an empty table.
    console.error(
      `courseware-read LOG WRITE FAILED (${logFailStreak} consecutive): ` +
        (e instanceof Error ? e.message : String(e)),
    );
    return false;
  }
}

/** 1.5s ceiling: past that the telemetry is abandoned, never the response. */
function boundedLog(args: unknown[]): Promise<boolean> {
  return Promise.race([
    writeLogRow(args),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1500)),
  ]);
}

/**
 * The caller identity, weakly and on purpose.
 *
 * NEVER A RAW IP. An HMAC keyed on MCP_LOG_SALT over `ip|YYYY-MM` gives
 * distinct-caller counts within a month and no re-identification across months
 * or from the table alone. Rotating the PERIOD inside the message rotates the
 * hash without rotating the secret.
 *
 * With no salt configured this returns null rather than falling back to
 * something weaker -- a hash with a guessable key is worse than no hash,
 * because it looks like protection.
 *
 * Note what this can and cannot see: courseware-read is called by the Worker,
 * which forwards no client address, so for MCP traffic this hashes CLOUDFLARE'S
 * egress IP. It is only a real caller identity for direct callers of this
 * endpoint. Partner attribution needs the token flow, not this field.
 */
async function callerHash(req: Request): Promise<string | null> {
  const salt = Deno.env.get("MCP_LOG_SALT") ?? "";
  if (!salt) return null;
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  if (!ip) return null;
  const period = new Date().toISOString().slice(0, 7);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(salt),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${ip}|${period}`));
  return Array.from(new Uint8Array(sig).slice(0, 16))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Self-reported by the Worker; display only, never a behaviour decision. */
function clientName(req: Request): string | null {
  const raw = req.headers.get("x-mcp-client");
  if (!raw) return null;
  const clean = raw.replace(/[^\x20-\x7E]/g, "").slice(0, 80).trim();
  return clean.length ? clean : null;
}

// ------------------------------------------------------------------ handler

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  const started = Date.now();
  let args: Args | null = null;
  let caller: string | null = null;
  // Why a key failed, for the LOG only. The caller gets one message for every
  // authorization failure; the operator needs to know it was a revoked key
  // rather than a typo, and that difference must not cross the wire.
  let keyStatus: string | null = null;
  // THE COST OF THE SECOND GATE, ON EVERY PAID REQUEST. Logged rather than
  // assumed to be free: it is an extra query on an already-open pooled
  // connection, and a number in the log is the only thing that will notice it
  // becoming expensive.
  let featureMs: number | null = null;
  let featureStatus: string | null = null;
  // Kept so a REJECTION can still say what was asked for. args is null once
  // validateArgs throws, and that is precisely when the question matters most.
  let rawBody: Record<string, unknown> | null = null;

  // One row per request, whatever the outcome. Assembled as the request
  // proceeds so the catch below can log a rejection with the same shape as a
  // success -- a telemetry table that only records successes answers the
  // easiest question and none of the useful ones.
  const logArgs = (status: number, rows: number | null, error: string | null) => [
    // THE REQUESTED RESOURCE, OR NULL. Never a synthesised value: this is stored
    // verbatim in requested_resource, and writing 'rejected' there would record
    // a resource nobody asked for.
    //
    // The row's `resource` is NOT this. mcp.log_request classifies by OUTCOME --
    // 200 serves a resource, 400 is 'rejected', 5xx is 'failed' -- so the
    // classification lives beside the CHECK that enforces it and cannot drift
    // from the caller's idea of it. See migrations 320 and 321.
    //
    // This once read `args?.resource ?? "log"`, filing every rejection under a
    // resource a caller may genuinely have asked for: indistinguishable from the
    // truth, which is worse than illegible.
    args?.resource ?? rawResource(),
    args?.tool ?? rawTool(),
    args?.language ?? null,
    args?.query ? redactEmails(args.query) : null,
    args?.query ? args.query.length : null,
    args?.slug ?? null,
    args?.task_code ?? null,
    args?.domain_code ?? null,
    args?.limit ?? null,
    null, // contract_version: the Worker's concern, not this function's
    status,
    rows,
    Date.now() - started,
    error,
    args?.resource === "log" ? (args.certification ?? null) : null,
    caller,
    clientName(req),
  ];

  /** The requested resource as a string, however wrong, or null. */
  const rawResource = (): string | null => {
    const v = rawBody?.resource;
    return typeof v === "string" && v.length > 0 ? v.slice(0, 40) : null;
  };
  /** The tool name only if it is one we know; a rejection must not invent one. */
  const rawTool = (): string | null => {
    const v = rawBody?.tool;
    return typeof v === "string" && (TOOLS as readonly string[]).includes(v) ? v : null;
  };

  try {
    if (!PASSWORD || !DB_HOST) {
      // Named without values. Which secret is missing is operational
      // information; neither secret's content is.
      console.error("courseware-read: missing MCP_READER_PASSWORD or MCP_READER_DB_HOST");
      return jsonResponse({ error: "not configured" }, 500);
    }

    const raw = await req.json().catch(() => bad("body must be valid JSON"));
    if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
      rawBody = raw as Record<string, unknown>;
    }
    args = validateArgs(raw);
    caller = await callerHash(req);

    // ============ AUTHORIZATION, DERIVED AND NOT ACCEPTED ============
    //
    // requiredScope is a map in the shared module, so "what does this resource
    // cost" is answered by reading one object rather than by auditing this
    // handler -- and lesson_index is absent from it on purpose: migration 322
    // makes the catalogue public so a partner can see what exists before paying
    // for it.
    const need = requiredScope(args.resource);

    // THE READER POOL ASSERTS FIRST, ON EVERY PATH INCLUDING THE PAID ONE.
    // It is the connection that asks the authorization question, and it is
    // provably unable to act on the answer: 315 and 322 leave mcp_reader with
    // no grant on mcp.lesson. So the credential in hand while the decision is
    // being made cannot fetch a body even if the decision is wrong.
    await assertIdentity();

    if (need) {
      // ============ TWO WAYS IN, ONE PATH AFTER RESOLUTION ============
      //
      // An API key (a partner's own automation) or an OAuth access token (a
      // partner in a chat client). They are resolved by different functions and
      // then STOP BEING DIFFERENT: the scope check, the cross-check and the
      // refusal below are one piece of code, so a way in cannot acquire a
      // weaker gate by being newer.
      const presentedKey = req.headers.get("x-certidemy-key")?.trim() ?? "";
      const presentedTok = req.headers.get("x-certidemy-token")?.trim() ?? "";

      if (!presentedKey && !presentedTok) {
        throw new Unauthorized(
          401,
          "x-certidemy-key or x-certidemy-token header required",
        );
      }
      // BOTH IS A REFUSAL, NOT A PREFERENCE. Picking one silently would make
      // which credential was honoured invisible to the caller and to the log,
      // and a caller who sends two does not know what they are asking for.
      if (presentedKey && presentedTok) {
        throw new Unauthorized(401, "send one credential, not two");
      }

      let grantedScopes: string[];
      // Set by whichever branch resolves; the second gate needs it and both
      // resolvers already return it.
      let grantedIssuer = "";

      if (presentedKey) {
        const key = await resolveKey(presentedKey);
        keyStatus = key ? key.key_status : "unknown";
        // ONE ANSWER FOR FOUR CAUSES -- unknown, revoked, expired, malformed.
        // keyStatus carries the difference to the log and no further.
        if (!key || key.key_status !== "active") {
          throw new Unauthorized(401, "invalid API key");
        }
        grantedScopes = key.scopes ?? [];
        grantedIssuer = key.issuer_id;
        // A REAL PARTNER IDENTITY. caller_hash was an HMAC of the client IP,
        // which for all MCP traffic is Cloudflare's egress address -- the
        // field's own comment says partner attribution needs the token flow.
        // Namespaced `key:` so the two kinds of value cannot be read as one.
        //
        // Only on the paid path: resolving a credential on every public read
        // would add a round trip to the free tier to attribute traffic that is
        // free.
        caller = `key:${key.key_id}`;
      } else {
        // VERIFY BEFORE RESOLVING. An unverified token must never reach a
        // database lookup keyed on claims it carries: `sub` and `client_id` are
        // attacker-controlled until the signature says otherwise.
        let verdict: { claims: TokenClaims } | { refusal: TokenRefusal };
        try {
          verdict = await verifyPartnerToken(presentedTok);
        } catch (e) {
          // A JWKS FETCH THAT FAILED IS NOT A FORGED TOKEN. Refusing is right --
          // we cannot verify -- but the reason belongs in the log, or the next
          // outage reads as every partner's token going bad at once.
          keyStatus = "jwks_unavailable";
          console.error(JSON.stringify({
            fn: "courseware-read",
            event: "token_verification_unavailable",
            detail: String((e as Error)?.message ?? e),
          }));
          throw new Unauthorized(401, "invalid token");
        }
        if ("refusal" in verdict) {
          // The REASON reaches the log; the caller still gets one message.
          keyStatus = `token_${verdict.refusal}`;
          throw new Unauthorized(401, "invalid token");
        }

        const c = await resolveOauthCaller(verdict.claims);
        keyStatus = c ? c.status : "unknown";
        // A STATUS, NOT AN EMPTY ROW -- 329 answers client_not_approved,
        // no_binding, issuer_inactive or active for the same reason
        // resolve_api_key answers revoked and expired. The caller still gets one
        // message; the difference reaches the log.
        if (!c || c.status !== "active") {
          throw new Unauthorized(401, "invalid token");
        }
        grantedScopes = c.scopes ?? [];
        grantedIssuer = c.issuer_id;
        caller = `oauth:${c.caller_id}`;
      }

      // Checked before the scope test, so a header that disagrees with what was
      // resolved is refused whether or not it would have granted anything. It is
      // absent on the token path -- the Worker forwards the bearer and resolves
      // nothing -- and ABSENT IS FINE by construction.
      crossCheckAssertedScope(req, grantedScopes);
      if (!grantedScopes.includes(need)) {
        // The message names the scope and not the credential, because by here
        // the two ways in have stopped being different.
        throw new Unauthorized(403, `this credential is not scoped for ${need}`);
      }

      // ============ THE SECOND GATE ============
      //
      // Asked for BOTH ways in, after they have converged, so a revocation
      // cannot be escaped by choosing a credential. `grantedIssuer` is set by
      // whichever branch resolved above.
      const feat = await featureEnabled(grantedIssuer, need);
      featureMs = feat.ms;
      featureStatus = feat.row ? feat.row.feature_status : "no_row";

      if (!feat.row || feat.row.feature_status !== "ok") {
        // NOT a 403 about the credential. The credential was fine; we could not
        // establish the platform's answer, and the question fails open, so the
        // only safe reading of "could not establish" is refuse.
        throw new Unauthorized(403, `${need} is unavailable for this issuer`);
      }
      if (!feat.row.enabled) {
        // Deliberately the same message. A partner learns the feature is off,
        // not whether it was never enabled or revoked this morning -- the
        // disable row carries that, for the operator.
        throw new Unauthorized(403, `${need} is unavailable for this issuer`);
      }
    }

    // The holder pool asserts the INVERSE of the reader's -- must read lessons,
    // must still write nowhere -- and is reached only after authorization has
    // passed, so a project with no holder password serves the rest normally.
    if (args.resource === "lesson") await assertHolderIdentity();

    // TELEMETRY-ONLY. A certification refusal is decided in the Worker's
    // validator before any read is attempted, so it can never appear on a
    // readable resource -- and it is the most commercially interesting event
    // this endpoint sees. It gets the same row shape and the same
    // never-break-the-caller treatment; there is simply nothing to read.
    if (args.resource === "log") {
      // ============ THE OUTCOME IS THE CLASSIFIER, SO THE STATUS IS THE WRITE ============
      //
      // mcp.log_request derives `resource` from the STATUS, not from the body:
      // 200 stores the resource asked for, anything else stores 'rejected', 5xx
      // stores 'failed'. So the difference between these two events is a number.
      //
      //   certification_refused  200 -> a 'log' row. A partner asked for a
      //                          certification we do not serve. Telemetry about
      //                          demand, not a fault, and it stays what it was.
      //
      //   auth_refused           401 -> a 'rejected' row, with the resolution in
      //                          `error`. A call the Worker turned away before
      //                          this function was ever reached.
      //
      // WHY THIS EVENT EXISTS AT ALL. An auth short-circuit in the Worker wrote
      // nothing anywhere queryable: courseware-read was never called, so
      // mcp_requests had no row, and the only record was a Cloudflare log line.
      // Diagnosing one connector took several rounds of indirect elimination to
      // establish a fact one field states. It is also the one event that matters
      // for a PARTNER, whose Worker logs nobody here will ever read.
      //
      // `event` ALONE WOULD HAVE RECORDED NOTHING. It reaches console.log and no
      // column; adding a name to LOG_EVENTS without changing the status writes a
      // 200 'log' row indistinguishable from a certification refusal.
      const isAuth = args.event === "auth_refused";
      const logged = await boundedLog(
        isAuth ? logArgs(401, null, `auth:${args.auth}`) : logArgs(200, null, null),
      );
      console.log(JSON.stringify({
        fn: "courseware-read",
        resource: "log",
        event: args.event,
        tool: args.tool ?? null,
        refused: args.certification ?? null,
        auth: args.auth ?? null,
        logged,
        ms: Date.now() - started,
      }));
      return jsonResponse({ ok: true, logged });
    }

    // WHICH POOL, DECIDED BY THE RESOURCE AND ENFORCED BY THE DATABASE.
    // mcp_reader holds no grant on mcp.lesson, so a lesson routed to the reader
    // pool fails in Postgres rather than on this line. The line chooses the
    // credential; it does not decide who may read a body.
    const needsHolder = args.resource === "lesson";
    if (needsHolder && !HOLDER_PASSWORD) {
      console.error("courseware-read: lesson requested but MCP_HOLDER_PASSWORD is unset");
      return jsonResponse({ error: "lesson access not configured" }, 503);
    }

    const { q, searched } = buildQuery(args);
    const conn = await (needsHolder ? getHolderPool() : getPool()).connect();
    let rows: Record<string, unknown>[];
    let withheld: { reason: string; message: string } | null = null;
    try {
      const r = await conn.queryObject<Record<string, unknown>>(q);
      rows = r.rows;

      // ============ A WITHHELD BODY IS NOT AN ABSENT ONE ============
      //
      // `mcp.lesson` excludes a lesson whose body reproduces ISO clause text
      // (332/333) and a translation whose English was repaired but which nobody
      // has read yet (335). Both come back as ZERO ROWS -- byte-identical to a
      // slug that does not exist, a language that was never written, or a typo.
      //
      // That is the silent-success shape aimed at the one surface where it costs
      // a partner the most: they ask for a lesson that IS in the catalogue, get
      // an empty result, and conclude the curriculum is thinner than it is.
      //
      // `mcp.lesson_index` carries every lesson with no body and a
      // `body_available` flag, so the three states are distinguishable with one
      // extra query ON THE MISS PATH ONLY. A hit never pays for it.
      //
      //   no index row          -> the lesson genuinely does not exist
      //   body_available false  -> the body reproduces standard text
      //   body_available true   -> mcp.lesson still refused it, which after 335
      //                            can only mean this TRANSLATION is unreviewed
      if (args.resource === "lesson" && rows.length === 0) {
        const probe = await conn.queryObject<{ body_available: boolean }>({
          text:
            "select body_available from mcp.lesson_index " +
            "where certification = $1 and lesson_slug = $2 and language = $3",
          args: [args.certification!, args.lesson_slug, args.language],
        });
        const found = probe.rows[0];
        if (!found) {
          withheld = {
            reason: "not_found",
            message:
              `No lesson '${args.lesson_slug}' in ${args.certification} for ${args.language}. ` +
              "Use list_lessons for the catalogue; it needs no credential.",
          };
        } else if (found.body_available === false) {
          withheld = {
            reason: "body_withheld_standard_text",
            message:
              `The lesson '${args.lesson_slug}' exists and its body is NOT available through this API. ` +
              "It reproduces clause text from an ISO standard, which Certidemy may teach from but may not " +
              "redistribute. This is not a problem with your credential and retrying will not change it. " +
              "The syllabus, tasks and concepts for this certification are fully available.",
          };
        } else {
          withheld = {
            reason: "translation_pending_review",
            message:
              `The lesson '${args.lesson_slug}' exists and its ${args.language} body is not available YET. ` +
              "Its English was recently edited to remove reproduced standard text, and the translation is " +
              "held until a human has confirmed the same text is not present in it. This is not a problem " +
              "with your credential. The English body is available now; the translation will follow.",
          };
        }
      }
    } finally {
      conn.release();
    }

    // ============ THE STATUS IS CHOSEN AROUND THE WORKER, DELIBERATELY ============
    //
    // NOT 403. `certidemy-web/lib/mcp/registry.ts` DISCARDS the function's
    // detail on 401 and 403 and substitutes a fixed message about issuer API
    // keys ending "If a key was sent, it may have just been revoked." A partner
    // whose Spanish translation is pending review would be sent to check, rotate
    // and re-copy a credential that is perfectly fine -- the same misattribution
    // that file already records twice, arriving through a third door.
    //
    // Any other 4xx keeps `http.detail` and puts it in front of the agent. 404
    // is the closest honest reading: the BODY is not available at this address.
    //
    // THE WRAPPER IS STILL WRONG AND THE FIX IS NOT MINE. The Worker will frame
    // this as "The curriculum service rejected this request ... a fault in the
    // server, not in the question", which a withheld body is not. The substance
    // survives; the framing needs a web-side change.
    if (withheld) {
      console.log(JSON.stringify({
        fn: "courseware-read",
        resource: args.resource,
        language: args.language,
        withheld: withheld.reason,
        lesson_slug: args.lesson_slug,
        ms: Date.now() - started,
      }));
      return jsonResponse({ error: withheld.message, reason: withheld.reason }, 404);
    }

    // THE RAW MARKDOWN NEVER LEAVES THIS FUNCTION. content_md is replaced by the
    // parsed shape here, not filtered downstream, so there is no path on which a
    // caller receives the directive source -- and therefore no path on which a
    // ::checkpoint or an ::interactive answer key travels with it.
    if (args.resource === "lesson") {
      rows = rows.map((r) => {
        const { content_md, ...rest } = r as { content_md?: unknown };
        const parsed = parseLesson(String(content_md ?? ""));
        return { ...rest, ...parsed };
      });
    }

    // THE RESPONSE IS BUILT BEFORE THE LOG IS ATTEMPTED, so nothing below can
    // change what the caller receives.
    const body = {
      resource: args.resource,
      language: args.language,
      // FROM THE REQUEST, not a literal. This read `"AISM-I"` while the views
      // were scoped to one certification, which was true and is now the kind of
      // true that stops being true without anything failing.
      certification: args.certification,
      ...(searched ? { searched } : {}),
      count: rows.length,
      rows,
    };

    const logged = await boundedLog(logArgs(200, rows.length, null));

    // THE QUERY IS NEVER HERE. Its length is. `logged` rides on every line so an
    // empty telemetry table is answerable from the function log alone.
    console.log(JSON.stringify({
      fn: "courseware-read",
      resource: args.resource,
      language: args.language,
      ...(args.resource === "search" ? { q_len: args.query!.length, searched } : {}),
      rows: rows.length,
      logged,
      // Null on the free tier -- the second gate runs only where a scope is
      // needed, so a public read pays nothing for it.
      ...(featureMs !== null ? { feature_ms: featureMs, feature_status: featureStatus } : {}),
      ms: Date.now() - started,
    }));

    return jsonResponse(body);
  } catch (e) {
    if (e instanceof Unauthorized) {
      // Logged like any other outcome. WHO WAS TURNED AWAY FROM THE PAID
      // RESOURCE is the most commercially interesting row this table can hold,
      // and a telemetry table that records only successes answers the easiest
      // question and none of the useful ones.
      const detail = keyStatus ? `${e.message} [${keyStatus}]` : e.message;
      const logged = await boundedLog(logArgs(e.status, null, detail));
      console.log(JSON.stringify({
        fn: "courseware-read",
        resource: args?.resource ?? null,
        status: e.status,
        auth: detail,
        logged,
        ms: Date.now() - started,
      }));
      // The body carries e.message, never `detail`: the caller learns that the
      // key did not work, not which of the four reasons applied.
      return jsonResponse({ error: e.message }, e.status);
    }
    if (e instanceof BadRequest) {
      // A rejection is logged too: what callers get WRONG is as much of the
      // feedback loop as what they get right.
      const logged = await boundedLog(logArgs(400, null, e.message));
      console.log(JSON.stringify({
        fn: "courseware-read",
        resource: args?.resource ?? null,
        rejected: e.message,
        logged,
        ms: Date.now() - started,
      }));
      return jsonResponse({ error: e.message }, 400);
    }
    // The caller gets no internals. A failed identity assertion in particular
    // must not tell an unauthenticated caller which role the function holds.
    const msg = e instanceof Error ? e.message : String(e);
    console.error("courseware-read failed:", msg);
    // Best-effort, and deliberately last: if the failure WAS the connection,
    // this will fail too and say so on its own line rather than masking the
    // original error.
    const logged = await boundedLog(logArgs(500, null, msg));
    console.log(JSON.stringify({ fn: "courseware-read", resource: args?.resource ?? null, status: 500, logged }));
    return jsonResponse({ error: "read failed" }, 500);
  }
});
