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
 * ===================== AUTH =====================
 *
 * create-issuer-api-key is verify_jwt = true and calls requireIssuerAccess, so
 * it needs a USER token -- a platform_admin, or a team_admin of a company tied
 * to the issuer. A service-role key cannot stand in: it carries no `sub`, so
 * there is no actor to authorise or to record in admin_actions.
 *
 * The password is read from the terminal with echo off and is never written to
 * a variable that outlives the request. Pass SUPABASE_EMAIL to skip the first
 * prompt; there is deliberately no SUPABASE_PASSWORD, because an environment
 * variable holding one ends up in a shell history file or a process listing.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

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
  console.log("DRY RUN. Nothing was sent and no key exists.");
  console.log("Re-run with --apply to mint. The key is printed once and cannot be recovered.");
  console.log("");
  console.log("NOTE: environment is a LABEL, not a restriction. Nothing branches on it --");
  console.log("a cdk_test_ key with credentials:issue mints real credentials.");
  process.exit(0);
}

/* ------------------------------------------------------------------ the JWT */

function ask(prompt, hidden) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // Echo off: the prompt is written once and keystrokes are swallowed.
      process.stdout.write(prompt);
      rl._writeToOutput = () => {};
      rl.question("", (v) => { rl.close(); process.stdout.write("\n"); resolve(v); });
    } else {
      rl.question(prompt, (v) => { rl.close(); resolve(v); });
    }
  });
}

const email = process.env.SUPABASE_EMAIL ?? (await ask("email: ", false));
const password = await ask("password (not echoed): ", true);

const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: ANON, "content-type": "application/json" },
  body: JSON.stringify({ email: email.trim(), password }),
});
const tokenJson = await tokenRes.json().catch(() => ({}));
if (!tokenRes.ok || !tokenJson.access_token) {
  // The message, never the credential. A failed sign-in that echoes what was
  // sent puts the password in the terminal that was avoiding it.
  console.error(`sign-in failed: HTTP ${tokenRes.status} ${tokenJson.error_description ?? tokenJson.msg ?? ""}`);
  process.exit(1);
}

/* ----------------------------------------------------------------- the mint */

const res = await fetch(`${SUPABASE_URL}/functions/v1/create-issuer-api-key`, {
  method: "POST",
  headers: {
    apikey: ANON,
    authorization: `Bearer ${tokenJson.access_token}`,
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
  process.exit(1);
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
