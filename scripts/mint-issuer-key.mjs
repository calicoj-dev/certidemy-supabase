#!/usr/bin/env node
/**
 * mint-issuer-key.mjs - mint an issuer API key through create-issuer-api-key.
 *
 * OPT INTO WRITING: `--apply`. DRY BY DEFAULT. Unknown flags exit 2.
 * See CLAUDE.md on the two flag conventions in this directory -- this is the
 * --apply family, so running it with no flag POSTs nothing.
 *
 *   node scripts/mint-issuer-key.mjs --issuer <uuid> --name "smoke: serves" \
 *        --scopes credentials:issue,courseware:lessons --env test
 *   node scripts/mint-issuer-key.mjs ... --apply
 *
 * ===================== WHY THIS EXISTS =====================
 *
 * THE CONSOLE CANNOT MINT A SCOPED KEY. components/console/issuing-panel.tsx
 * posts `{ issuer_id, name }` and nothing else, so every key it makes takes the
 * default -- credentials:issue. There is no scope selector. A courseware key
 * therefore has to be requested somewhere that can send a `scopes` array, and
 * this is that somewhere until the console grows one.
 *
 * ===================== THE KEY IS SHOWN ONCE =====================
 *
 * Only sha256(key) and an 8-character prefix are stored. There is no recovery
 * path and this script adds none: the key is printed to stdout and written to
 * no file, no log and no history. If the terminal scrolls it away, revoke and
 * mint again -- that is cheaper than any mechanism for getting it back, and the
 * absence of such a mechanism is what makes the stored row worthless to someone
 * reading the database.
 *
 * ===================== AUTH: NO PROMPT, EVER =====================
 *
 * create-issuer-api-key is verify_jwt = true and calls requireIssuerAccess, so
 * it needs a USER token -- a platform_admin, or a team_admin of a company tied
 * to the issuer. A service-role key cannot stand in: it carries no `sub`, so
 * there is no actor to authorise or to record in admin_actions.
 *
 * THIS PROMPTED FOR A PASSWORD AND THAT WAS THE WRONG SHAPE ON THIS PLATFORM.
 * It used readline with `terminal: true` and echo suppressed. Windows is where
 * this repo is developed, and the shells it is run from -- including every
 * agent-driven one -- hand the process a stdin that is not a TTY. readline then
 * reads EOF instead of keystrokes, so the password arrived as the empty string
 * and the server answered "Invalid login credentials". THE CREDENTIALS WERE
 * NEVER WRONG; the input path never captured any. Tearing the interface down
 * afterwards also tripped a libuv assertion in async.c.
 *
 * A prompt that only works on a TTY this platform does not supply is not a
 * corner case, it is a script that does not run. There is no prompt now.
 *
 * AND SUPABASE_PASSWORD DID NOT EXIST. The header used to say so -- "there is
 * deliberately no SUPABASE_PASSWORD" -- on the argument that an environment
 * variable holding one reaches a shell history file. Setting it therefore did
 * nothing, which is exactly why the blank prompt still appeared with both
 * variables set: SUPABASE_EMAIL was read, SUPABASE_PASSWORD was not.
 *
 * The objection was real and it was aimed at the wrong place. Typing a secret
 * on a command line does reach the history file; putting it in scripts/.env
 * does not, and that file is gitignored (.gitignore line 8) and already holds
 * SUPABASE_SERVICE_ROLE_KEY. So credentials are read from the ENVIRONMENT OR
 * scripts/.env, in that order, and the recommendation is the file.
 *
 * Two ways in, and the first is better:
 *
 *   SUPABASE_USER_JWT               an access token. Nothing here ever sees a
 *                                   password, and the token expires on its own.
 *   SUPABASE_EMAIL + SUPABASE_PASSWORD   a password grant, exchanged for the
 *                                   same kind of token.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * ONE VARIABLE, NAMED, FROM A NAMED FILE -- not the whole-file loader the other
 * scripts in here use.
 *
 * The anon key lives in ../certidemy-web/.env.local. So does SUPABASE_SECRET_KEY.
 * Slurping that file would pull a service-role credential into the memory of a
 * script that has no use for one, and leave it available to every later edit of
 * this file. This needs exactly one value and takes exactly one.
 */
function readVar(file, key) {
  if (!existsSync(file)) return null;
  for (const l of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, "");
  }
  return null;
}

const KNOWN = new Set(["--issuer", "--name", "--scopes", "--env", "--expires-days", "--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error(`Unrecognised flag: ${a}.`);
    console.error("This script is the --apply family: it writes ONLY with --apply and is dry otherwise.");
    console.error("Known flags: --issuer, --name, --scopes, --env, --expires-days, --apply.");
    process.exit(2);
  }
}
const arg = (k, d = null) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const APPLY = process.argv.includes("--apply");

const PROJECT_REF = "pctynukndxnmnxiqpgck";
const SUPABASE_URL = process.env.SUPABASE_URL ?? `https://${PROJECT_REF}.supabase.co`;
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  readVar(join(HERE, ".env"), "NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
  readVar(join(HERE, "..", "..", "certidemy-web", ".env.local"), "NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
  "";

/* ------------------------------------------------------------------ auth */

const ENV_FILE = join(HERE, ".env");
/** Environment first, then scripts/.env. Never a prompt, never a flag: a
 *  credential passed as an argument is a credential in the history file. */
const fromEnvOrFile = (k) => process.env[k] ?? readVar(ENV_FILE, k) ?? null;

const USER_JWT = fromEnvOrFile("SUPABASE_USER_JWT");
const EMAIL = fromEnvOrFile("SUPABASE_EMAIL");
const PASSWORD = fromEnvOrFile("SUPABASE_PASSWORD");

const AUTH_SOURCE = USER_JWT
  ? "SUPABASE_USER_JWT"
  : EMAIL && PASSWORD
  ? `password grant as ${EMAIL}`
  : null;

const AUTH_HELP = [
  "No usable credential. create-issuer-api-key needs a USER token -- a",
  "platform_admin, or a team_admin of a company tied to this issuer.",
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

/**
 * MIRRORED from functions/_shared/api-scopes.ts, which is itself mirrored by the
 * issuer_api_keys_scope_vocab CHECK from migration 322. Three copies in three
 * languages and the database is the authority -- this one exists only so a typo
 * fails here instead of as a 500 from the function.
 */
const SCOPES = ["credentials:issue", "courseware:lessons"];

const issuer = arg("issuer");
const name = arg("name");
const environment = arg("env", "live");
const expiresDays = arg("expires-days");
const scopes = (arg("scopes", "credentials:issue")).split(",").map((s) => s.trim()).filter(Boolean);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* --------------------------------------------------- validate before writing */

const problems = [];
if (!issuer || !UUID_RE.test(issuer)) problems.push("--issuer must be an issuer uuid");
if (!name) problems.push('--name is required (how the key is identified in the console)');
if (environment !== "live" && environment !== "test") problems.push('--env must be live or test');
if (expiresDays !== null && !/^\d+$/.test(expiresDays)) problems.push("--expires-days must be a whole number");
for (const s of scopes) if (!SCOPES.includes(s)) problems.push(`unknown scope "${s}" -- valid: ${SCOPES.join(", ")}`);
if (!ANON) {
  problems.push(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY not found. Looked in the environment, " +
    "scripts/.env, and ../certidemy-web/.env.local."
  );
}
// ONLY WHEN WRITING. A dry run must work with no credential at all -- it exists
// to show what would be sent, and refusing to show that for want of a password
// makes the safe half of the script depend on the secret the unsafe half needs.
if (APPLY && !AUTH_SOURCE) problems.push(AUTH_HELP);
if (problems.length) {
  for (const p of problems) console.error(`  ${p}`);
  process.exit(2);
}

const body = {
  issuer_id: issuer,
  name,
  scopes,
  environment,
  ...(expiresDays === null ? {} : { expires_in_days: Number(expiresDays) }),
};

console.log("");
console.log(`POST ${SUPABASE_URL}/functions/v1/create-issuer-api-key`);
console.log(JSON.stringify(body, null, 2));
console.log("");

if (!APPLY) {
  // SAYS WHETHER --apply WOULD GET AS FAR AS THE MINT. A dry run that reports
  // a well-formed body and then fails on credentials has checked the half that
  // was never in doubt.
  console.log(`auth: ${AUTH_SOURCE ?? "NOT CONFIGURED -- --apply would abort before sending"}`);
  console.log("");
  console.log("DRY RUN. Nothing was sent and no key exists.");
  console.log("Re-run with --apply to mint. The key is printed once and cannot be recovered.");
  console.log("");
  console.log("NOTE: environment is a LABEL, not a restriction. Nothing branches on it --");
  console.log("a cdk_test_ key with credentials:issue mints real credentials.");
  process.exit(0);
}
/* ================================================================= */
/*  EVERYTHING BELOW RUNS INSIDE A FUNCTION, AND NOTHING CALLS        */
/*  process.exit() AFTER A fetch().                                   */
/*                                                                    */
/*  Exiting while undici still holds a keep-alive socket trips a libuv */
/*  assertion on Windows:                                             */
/*                                                                    */
/*    Assertion failed: !(handle->flags & UV_HANDLE_CLOSING),          */
/*    file src\win\async.c, line 76                                   */
/*                                                                    */
/*  It fired on every failed sign-in. It was first read as fallout     */
/*  from the readline prompt; the prompt is gone and IT STILL FIRED,   */
/*  which is what identified the real cause -- process.exit() forcing  */
/*  teardown of handles that are mid-close. The exits BEFORE any fetch */
/*  are untouched and still exit(2): with no open handles there is     */
/*  nothing to tear down, and aborting instantly is the point of them. */
/*                                                                    */
/*  After a fetch the code sets process.exitCode and RETURNS, so the   */
/*  loop drains on its own. The status is identical to the caller and  */
/*  the assertion has nothing to trip on.                              */
/* ================================================================= */

async function run() {
  /* ------------------------------------------------------------------ the JWT */

  console.log(`auth: ${AUTH_SOURCE}`);

  let accessToken = USER_JWT;
  if (!accessToken) {
    const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: ANON, "content-type": "application/json" },
      body: JSON.stringify({ email: EMAIL.trim(), password: PASSWORD }),
    });
    const tokenJson = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenJson.access_token) {
      // The message, never the credential. A failed sign-in that echoes what was
      // sent writes the password into the terminal that was avoiding it.
      const why = tokenJson.error_description ?? tokenJson.msg ?? "";
      console.error(`sign-in failed: HTTP ${tokenRes.status} ${why}`);
      if (/invalid login/i.test(why)) {
        console.error("");
        console.error("Check that SUPABASE_PASSWORD holds the password itself and not an");
        console.error("empty value -- an unset variable reaches this point as the empty");
        console.error("string and the server rejects it exactly like a wrong one.");
      }
      process.exitCode = 1;
      return;
    }
    accessToken = tokenJson.access_token;
  }

  /* ----------------------------------------------------------------- the mint */

  const res = await fetch(`${SUPABASE_URL}/functions/v1/create-issuer-api-key`, {
    method: "POST",
    headers: {
      apikey: ANON,
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const out = await res.json().catch(() => ({}));

  if (!res.ok || !out.api_key) {
    console.error(`mint failed: HTTP ${res.status}`);
    console.error(JSON.stringify(out, null, 2));
    if (res.status === 400 && String(out.error ?? "").includes("unknown scope")) {
      console.error("");
      console.error("If the scope is courseware:lessons, create-issuer-api-key has not been");
      console.error("redeployed since it learned that scope. Deploy it and re-run.");
    }
    process.exitCode = 1;
    return;
  }

  console.log("");
  console.log("=".repeat(70));
  console.log("THE KEY, SHOWN ONCE. It is stored only as a sha256 hash.");
  console.log("=".repeat(70));
  console.log("");
  console.log(out.api_key);
  console.log("");
  console.log(`  id      ${out.key.id}`);
  console.log(`  prefix  ${out.key.prefix}`);
  console.log(`  scopes  ${out.key.scopes.join(", ")}`);
  console.log(`  issuer  ${out.issuer.slug}`);
  console.log("");
  for (const u of out.usage ?? []) {
    console.log(`  ${u.scope} -> ${u.endpoint}`);
    console.log(`      ${u.header}`);
    if (u.note) console.log(`      ${u.note}`);
  }
  console.log("");
  console.log("Nothing was written to a file. Copy it now.");
}

await run();
