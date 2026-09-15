#!/usr/bin/env node
/**
 * probe-mcp-audience.mjs - does a Supabase-issued token bind `aud` to our MCP?
 *
 * OPT INTO WRITING: `--apply` (registering a client is a write to the project's
 * auth config). Dry by default. Unknown flags exit 2.
 *
 * ===================== THE ONE QUESTION =====================
 *
 * The MCP authorization spec, 2026-07-28:
 *
 *   "MCP servers MUST validate that access tokens were issued specifically for
 *    them as the intended audience, according to RFC 8707 Section 2."
 *
 * Supabase Auth has an OAuth 2.1 server and documents it for MCP. What it does
 * NOT document is RFC 8707 -- whether passing `resource=https://certidemy.com/mcp`
 * produces a token whose `aud` is that string.
 *
 * That single fact decides a day of work against a project:
 *
 *   aud === the resource   use Supabase. Add authorization_servers, verify the
 *                          JWT, resolve entitlement from `sub` per call.
 *   aud === something else REPORT WHAT. A project-scoped audience that is at
 *                          least ours is weaker than the MUST and is not nothing
 *                          -- it bounds tokens to this project, just not to this
 *                          resource. Worth knowing exactly.
 *   no flow at all         say where it breaks.
 *
 * ===================== WHY THERE IS NO PROMPT =====================
 *
 * The authorization step needs a human in a browser; nothing here can do it. So
 * this runs in TWO INVOCATIONS and passes state on the command line rather than
 * reading it from a terminal. A readline prompt in this repo reads EOF instead
 * of keystrokes -- Windows shells here, agent-driven ones included, hand the
 * process a stdin that is not a TTY, and the password arrives as "". That cost a
 * session already; see scripts/lib/fn-auth.mjs.
 *
 * Nothing calls process.exit() after a fetch(): exiting while undici holds a
 * keep-alive socket trips a libuv assertion on Windows (src\win\async.c:76).
 */
import { createHash, randomBytes } from "node:crypto";

const KNOWN = new Set(["--apply", "--code", "--verifier", "--client-id", "--redirect"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error(`Unrecognised flag: ${a}.`);
    console.error("This script is the --apply family: it registers a client ONLY with --apply.");
    console.error("Known flags: --apply, --code, --verifier, --client-id, --redirect.");
    process.exit(2);
  }
}
const arg = (k, d = null) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const APPLY = process.argv.includes("--apply");

const REF = "pctynukndxnmnxiqpgck";
const AUTH = `https://${REF}.supabase.co/auth/v1`;
const RESOURCE = "https://certidemy.com/mcp";
const REDIRECT = arg("redirect", "https://certidemy.com/");

const b64url = (b) => b.toString("base64url");
const get = async (url, init) => {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(25000) });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* keep the text */ }
    return { reached: true, status: res.status, json, text };
  } catch (e) {
    return { reached: false, status: 0, json: null, text: "", why: e?.cause?.code ?? e?.name };
  }
};

/** A JWT payload, without verifying it. This probe reads claims; it trusts none. */
const claims = (jwt) => {
  const p = String(jwt).split(".")[1];
  if (!p) return null;
  try { return JSON.parse(Buffer.from(p, "base64url").toString("utf8")); } catch { return null; }
};

async function run() {
  /* ---------------------------------------------------- step 3, if resuming */
  const code = arg("code");
  if (code) {
    const verifier = arg("verifier");
    const clientId = arg("client-id");
    if (!verifier || !clientId) {
      console.error("--code needs --verifier and --client-id from the --apply run.");
      process.exitCode = 2;
      return;
    }
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT,
      client_id: clientId,
      code_verifier: verifier,
      // THE WHOLE POINT. RFC 8707 on the TOKEN request as well as the
      // authorization request -- the spec requires both.
      resource: RESOURCE,
    });
    const tok = await get(`${AUTH}/oauth/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!tok.reached) { console.error(`token endpoint unreachable: ${tok.why}`); process.exitCode = 1; return; }
    if (tok.status !== 200) {
      console.error(`token exchange failed: HTTP ${tok.status} ${tok.text.slice(0, 300)}`);
      process.exitCode = 1;
      return;
    }
    const at = tok.json?.access_token;
    const c = claims(at);
    console.log("");
    console.log("access token claims:");
    for (const k of ["iss", "sub", "aud", "exp", "scope", "azp", "client_id", "role"]) {
      if (c && k in c) console.log(`  ${k}: ${JSON.stringify(c[k])}`);
    }
    console.log("");
    const aud = c?.aud;
    const list = Array.isArray(aud) ? aud : aud === undefined ? [] : [aud];
    if (list.includes(RESOURCE)) {
      console.log(`VERDICT: aud IS ${RESOURCE}.`);
      console.log("Use Supabase. Add authorization_servers to the metadata document, verify the");
      console.log("JWT against the JWKS, and resolve entitlement from `sub` on every call.");
    } else if (list.length > 0) {
      console.log(`VERDICT: aud is ${JSON.stringify(aud)} -- NOT the resource.`);
      console.log("Weaker than the MUST. Decide whether that value is stable and OURS enough to");
      console.log("validate against, and write down what it does not protect: a token minted for");
      console.log("any other purpose in this project would carry the same audience.");
    } else {
      console.log("VERDICT: the token carries NO aud claim at all.");
      console.log("There is nothing to validate the audience against. Any token this project");
      console.log("issues would be presentable at the MCP endpoint.");
    }
    return;
  }

  /* ------------------------------------------------------ step 1, discovery */
  console.log("");
  console.log(`authorization server: ${AUTH}`);
  console.log(`resource under test:  ${RESOURCE}`);
  console.log("");

  const asMeta = await get(`${AUTH}/.well-known/oauth-authorization-server`);
  const oidc = await get(`${AUTH}/.well-known/openid-configuration`);
  console.log(`  oauth-authorization-server  HTTP ${asMeta.status} ${asMeta.json?.error_code ?? ""}`);
  console.log(`  openid-configuration        HTTP ${oidc.status}`);

  if (asMeta.status !== 200) {
    console.log("");
    console.log("BLOCKED AT DISCOVERY. The OAuth server is not enabled on this project.");
    console.log("Supabase dashboard -> Authentication -> OAuth Server (or the project's auth");
    console.log("config) -> enable, then re-run this with --apply.");
    console.log("");
    console.log("Note what openid-configuration does meanwhile: it returns 200 and advertises");
    console.log(`${AUTH}/oauth/authorize, which answers 404. A well-formed metadata`);
    console.log("document naming an endpoint that does not work is why this repo does not put");
    console.log("authorization_servers in its own metadata until a token has been decoded.");
    return;
  }

  const registration = asMeta.json?.registration_endpoint ?? `${AUTH}/oauth/clients/register`;
  console.log(`  registration_endpoint       ${registration}`);
  console.log(`  scopes_supported            ${JSON.stringify(asMeta.json?.scopes_supported ?? null)}`);

  if (!APPLY) {
    console.log("");
    console.log("DRY RUN. Nothing was registered. Re-run with --apply to register a probe");
    console.log("client and print the authorization URL.");
    return;
  }

  /* --------------------------------------------- step 2, register + authorize */
  const reg = await get(registration, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: "certidemy-audience-probe",
      redirect_uris: [REDIRECT],
      grant_types: ["authorization_code"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    }),
  });
  if (reg.status !== 200 && reg.status !== 201) {
    console.error(`registration failed: HTTP ${reg.status} ${reg.text.slice(0, 300)}`);
    process.exitCode = 1;
    return;
  }
  const clientId = reg.json?.client_id;
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());

  const url =
    `${AUTH}/oauth/authorize?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT)}` +
    `&code_challenge=${challenge}&code_challenge_method=S256` +
    `&scope=${encodeURIComponent("openid email")}` +
    `&resource=${encodeURIComponent(RESOURCE)}`;

  console.log("");
  console.log(`registered client: ${clientId}`);
  console.log("");
  console.log("1. Open this, sign in with a real Certidemy account, approve:");
  console.log("");
  console.log(`   ${url}`);
  console.log("");
  console.log("2. You land on the redirect with ?code=... in the URL. Run:");
  console.log("");
  console.log(`   node scripts/probe-mcp-audience.mjs --client-id ${clientId} \\`);
  console.log(`     --verifier ${verifier} --code <the code>`);
  console.log("");
  console.log("The probe client stays registered. Remove it from the dashboard when done.");
}

await run();
