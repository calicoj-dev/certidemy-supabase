/**
 * scripts/lib/fn-auth.mjs - call a verify_jwt edge function as a real user.
 *
 * ===================== WHY THIS IS A MODULE AND NOT A COPY =====================
 *
 * mint-issuer-key and revoke-issuer-key both need a USER token: both functions
 * are verify_jwt = true and both call requireIssuerAccess, which needs an actor
 * to authorise and to record in admin_actions. A service-role key cannot stand
 * in -- it carries no `sub`.
 *
 * That is an identical forty lines in two scripts, in one repository, which is
 * the mirrored-pair hazard with nothing to justify it. There is no repository
 * boundary here, so there is no reason for two copies. One module, imported.
 *
 * ===================== NO PROMPT, EVER =====================
 *
 * The first version of this read the password from the terminal with readline,
 * echo suppressed. Windows is where this repo is developed and the shells it is
 * run from -- agent-driven ones included -- hand the process a stdin that is not
 * a TTY, so readline read EOF instead of keystrokes and the password arrived as
 * the empty string. The server answered "Invalid login credentials", which is
 * indistinguishable from a wrong password, so the failure pointed at credentials
 * that were correct all along.
 *
 * ===================== NO process.exit() AFTER A fetch() =====================
 *
 * Exiting while undici holds a keep-alive socket trips a libuv assertion on
 * Windows (src\win\async.c line 76). Nothing here exits; callers set
 * process.exitCode and return, and the loop drains on its own. This module
 * throws or returns and never terminates the process.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPTS = join(HERE, "..");
const ENV_FILE = join(SCRIPTS, ".env");
const WEB_ENV = join(SCRIPTS, "..", "..", "certidemy-web", ".env.local");

export const PROJECT_REF = "pctynukndxnmnxiqpgck";

/**
 * ONE VARIABLE, NAMED, FROM A NAMED FILE -- not a whole-file loader.
 *
 * ../certidemy-web/.env.local holds the anon key and SUPABASE_SECRET_KEY.
 * Slurping it would pull a service-role credential into the memory of scripts
 * that have no use for one, and leave it there for every later edit.
 */
export function readVar(file, key) {
  if (!existsSync(file)) return null;
  for (const l of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, "");
  }
  return null;
}

/** Environment first, then scripts/.env. Never a flag: an argument is history. */
const fromEnvOrFile = (k) => process.env[k] ?? readVar(ENV_FILE, k) ?? null;

export const SUPABASE_URL = process.env.SUPABASE_URL ?? `https://${PROJECT_REF}.supabase.co`;

export const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  readVar(ENV_FILE, "NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
  readVar(WEB_ENV, "NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
  "";

const USER_JWT = fromEnvOrFile("SUPABASE_USER_JWT");
const EMAIL = fromEnvOrFile("SUPABASE_EMAIL");
const PASSWORD = fromEnvOrFile("SUPABASE_PASSWORD");

/** What credential WOULD be used, or null. Printed by dry runs. */
export const AUTH_SOURCE = USER_JWT
  ? "SUPABASE_USER_JWT"
  : EMAIL && PASSWORD
  ? `password grant as ${EMAIL}`
  : null;

export const AUTH_HELP = [
  "No usable credential. This function needs a USER token -- a platform_admin,",
  "or a team_admin of a company tied to the issuer.",
  "",
  "Put ONE of these in scripts/.env, which is gitignored:",
  "",
  "  SUPABASE_USER_JWT=eyJ...          preferred; expires on its own",
  "",
  "  SUPABASE_EMAIL=you@example.com",
  "  SUPABASE_PASSWORD=...",
  "",
  "The environment is read first if you would rather export them, but a secret",
  "typed on a command line reaches the shell history file and the .env does not.",
].join("\n");

export function anonMissing() {
  return ANON
    ? null
    : "NEXT_PUBLIC_SUPABASE_ANON_KEY not found. Looked in the environment, " +
      "scripts/.env, and ../certidemy-web/.env.local.";
}

/**
 * Returns { token } or { error }. NEVER throws the credential, and never echoes
 * what was sent -- a failed sign-in that prints its own input writes the
 * password into the terminal that was avoiding it.
 */
/**
 * CONNECT-ERROR RETRY, and it is not optional on this machine.
 *
 * Node 24 undici times out connecting to *.supabase.co intermittently here --
 * the failure CLAUDE.md records, whose tell is that curl succeeds against the
 * same host while node reports UND_ERR_CONNECT_TIMEOUT. Measured 2026-09-18:
 * curl got HTTP 401 from /auth/v1/health and three consecutive bare node
 * fetches to the same URL timed out. Every other script in this repository
 * carries a retry loop for exactly this; this module never did, so it was the
 * one credentialled path that could not get off the ground.
 */
async function fetchRetry(url, init, attempts) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(url, init);
    } catch (e) {
      last = e;
      /* Only a TRANSPORT failure is retried. An HTTP response -- including a
       * 401 or a 500 -- is an answer and is returned to the caller. */
    }
  }
  throw last;
}

export async function getAccessToken() {
  if (USER_JWT) return { token: USER_JWT };
  if (!EMAIL || !PASSWORD) return { error: AUTH_HELP };

  /* Retried freely: a password grant is idempotent. Issuing two tokens because
   * the first response was lost costs nothing. */
  const res = await fetchRetry(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL.trim(), password: PASSWORD }),
  }, 8);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    const why = json.error_description ?? json.msg ?? "";
    let error = `sign-in failed: HTTP ${res.status} ${why}`;
    if (/invalid login/i.test(why)) {
      error +=
        "\n\nCheck that SUPABASE_PASSWORD holds the password itself and not an" +
        "\nempty value -- an unset variable reaches this point as the empty" +
        "\nstring and the server rejects it exactly like a wrong one.";
    }
    return { error };
  }
  return { token: json.access_token };
}

/**
 * POST a JSON body to an edge function as the authenticated user.
 *
 * RETRY IS OPT-IN AND DEFAULTS TO OFF, DELIBERATELY. The callers of this module
 * are `mint-issuer-key` and `revoke-issuer-key` -- writes. A connect timeout
 * cannot be distinguished from a request that arrived, was executed, and whose
 * response was lost, so a blind retry on a mint could mint a SECOND key. That
 * is the failure `lti-mint-key.mjs` refuses by design ("two accidental mints
 * both land in the JWKS"), and a retry here would reintroduce it one layer up.
 *
 * Pass `{ retry: n }` only when the call is a READ. `dry_run: true` on
 * generate-practice-questions is one, and it is why this option exists.
 */
export async function callFunction(name, body, token, opts = {}) {
  const attempts = Number(opts.retry) > 0 ? Number(opts.retry) : 1;
  const res = await fetchRetry(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      apikey: ANON,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  }, attempts);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, json };
}

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
