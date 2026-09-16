#!/usr/bin/env node
/**
 * probe-oauth-lesson.mjs - call courseware-read with an OAuth token, not a key.
 *
 * READ-ONLY. No flags. Reads the access token saved by probe-mcp-audience.
 *
 * THIS IS THE LEG THAT HAS NEVER RUN. Every prior lesson read on this platform
 * presented an issuer API key. This presents `x-certidemy-token` and nothing
 * else, so the whole chain under test is new: verifyPartnerToken (ES256, iss,
 * exp, client_id required), mcp.resolve_oauth_caller (329), and the scope check
 * against issuers.mcp_scopes rather than a key's scopes.
 *
 * It prints the refusal as loudly as the success, because a 401 here has five
 * distinguishable causes and the point is which one.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const STATE = join(HERE, ".probe-mcp-audience.json");
if (!existsSync(STATE)) {
  console.error(`no state file at ${STATE}; run probe-mcp-audience --apply first`);
  process.exit(2);
}
const st = JSON.parse(readFileSync(STATE, "utf8"));
const token = st.access_token;
if (!token) {
  console.error("no access_token in the state file. Exchange a code first:");
  console.error("  node scripts/probe-mcp-audience.mjs --code <code>");
  process.exit(2);
}
if (st.token_expires_at && new Date(st.token_expires_at) < new Date()) {
  console.error(`the saved token expired at ${st.token_expires_at}. Exchange a new code.`);
  process.exit(2);
}

const SLUG = process.argv[2] ?? "01-01-what-is-scrum";
const CERT = process.argv[3] ?? "SM-AI-I";
const EP = "https://pctynukndxnmnxiqpgck.supabase.co/functions/v1/courseware-read";

const body = { resource: "lesson", certification: CERT, language: "en", lesson_slug: SLUG };

console.log("");
console.log(`POST ${EP}`);
console.log(`  ${CERT} / ${SLUG}, credential: x-certidemy-token (NO api key)`);
console.log("");

let res;
try {
  res = await fetch(EP, {
    method: "POST",
    headers: { "content-type": "application/json", "x-certidemy-token": token },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });
} catch (e) {
  console.error(`not reached: ${e?.cause?.code ?? e?.name ?? e}`);
  process.exitCode = 1;
}

if (res) {
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* keep the text */ }
  console.log(`HTTP ${res.status}`);
  if (res.ok && json) {
    const blocks = json?.rows?.[0]?.blocks ?? json?.blocks ?? null;
    console.log(`  blocks: ${Array.isArray(blocks) ? blocks.length : "(shape?)"}`);
    if (Array.isArray(blocks)) {
      for (const b of blocks) console.log(`    ::${b.type}  ${String(b.text ?? "").slice(0, 70).replace(/\s+/g, " ")}`);
    }
    console.log("");
    console.log("A LESSON BODY, ON AN OAUTH TOKEN. The second way in works.");
  } else {
    console.log(`  ${text.slice(0, 300)}`);
    console.log("");
    console.log("Refused. The cause is in mcp_requests.error for this request:");
    console.log("  invalid token        -> signature, iss, exp, or client_id absent");
    console.log("  invalid token + log  -> resolve_oauth_caller said client_not_approved / no_binding / issuer_inactive");
    console.log("  not scoped for       -> the binding resolved but issuers.mcp_scopes lacks courseware:lessons");
    process.exitCode = 1;
  }
}
