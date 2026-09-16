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
    headers: {
      "content-type": "application/json",
      "x-certidemy-token": token,
      // MARK SYNTHETIC TRAFFIC. These rows land in mcp_requests beside real
      // partner traffic and were distinguishable only by a null `tool` and an
      // IP hash -- which got probe rows read as real evidence three separate
      // times in one session, including a fabricated `kid: "nope"` that was
      // reported back as a JWKS fault.
      //
      // `select ... where client_name is null` is now the filter for real
      // traffic, and it costs one header.
      "x-mcp-client": "probe:oauth-lesson",
    },
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
    // ============ 200 IS NOT THE ANSWER. A BODY IS. ============
    //
    // The first version of this check printed "A LESSON BODY, ON AN OAUTH
    // TOKEN. The second way in works." on a response of `rows: 0` -- an empty
    // result for a lesson slug that does not exist. The authorization had in
    // fact succeeded, so the message was accidentally true and entirely
    // unearned: it would have said the same thing if the gate were open, if the
    // corpus were empty, or if the query were wrong.
    //
    // This is the silent-success failure this repository is largely about,
    // built into the tool written to detect it. So the success path now asserts
    // CONTENT: one row, a non-empty block array, and enough characters that an
    // empty string cannot pass for a lesson.
    const rows = Array.isArray(json?.rows) ? json.rows : [];
    const blocks = Array.isArray(rows[0]?.blocks) ? rows[0].blocks : [];
    const chars = blocks.reduce((n, b) => n + String(b?.text ?? "").length, 0);

    console.log(`  rows: ${rows.length}   blocks: ${blocks.length}   body characters: ${chars}`);
    for (const b of blocks) {
      console.log(`    ::${b.type}  ${String(b.text ?? "").slice(0, 66).replace(/\s+/g, " ")}`);
    }
    console.log("");

    if (rows.length === 1 && blocks.length > 0 && chars > 200) {
      console.log("A LESSON BODY, ON AN OAUTH TOKEN. The second way in works.");
    } else {
      console.log("HTTP 200 AND NO BODY. This is NOT a pass.");
      console.log("  The gate let the request through and the read returned nothing.");
      console.log("  Almost always a lesson_slug that does not exist for this");
      console.log("  certification -- pass a real one as the first argument. It is");
      console.log("  not evidence about authorization in either direction.");
      process.exitCode = 1;
    }
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
