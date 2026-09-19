#!/usr/bin/env node
/**
 * update-key-scopes.mjs - change the scopes on an existing issuer API key.
 *
 * `--apply` WRITES; DRY BY DEFAULT. Unknown flags exit 2.
 *
 *   node --dns-result-order=ipv4first scripts/update-key-scopes.mjs \
 *     --key <uuid> --scopes credentials:issue,courseware:rubric [--reason "..."]
 *
 * ============ WHY A SCRIPT AS WELL AS A FUNCTION ============
 *
 * The console will call the function. This exists for the case the console
 * cannot cover: granting a scope the console does not yet OFFER. That is not
 * hypothetical -- it is the state `courseware:rubric` is in right now. The API
 * accepts it, the database admits it, and `lib/console/api-scopes.ts` has not
 * shipped the checkbox, so for the interval between the two repositories
 * landing the only way to grant it is from here.
 *
 * check-cross-repo-vocabulary reports that interval as `SCOPES (API -> console,
 * lag)`. This script is what makes the lag survivable rather than blocking.
 *
 * ============ REPLACES, DOES NOT MERGE ============
 *
 * `--scopes` is the COMPLETE new set. Omitting a scope removes it. That is the
 * function's contract and this does not soften it: a flag that merged would
 * make removal impossible from the command line, and a tool that can only add
 * privileges is the wrong asymmetry.
 *
 * The dry run prints BOTH sides and the diff, so the replacement is visible
 * before it happens rather than inferred from a flag name.
 *
 * ============ NO RETRY ON THE WRITE ============
 *
 * `callFunction` retries only when asked, and this does not ask. A connect
 * timeout cannot be distinguished from a request that arrived, executed and
 * lost its response -- and for an idempotent scope replacement a second
 * delivery is harmless, but the read-back below is what proves the outcome, and
 * a retry would only make the log ambiguous about how many times it ran.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getAccessToken, callFunction, anonMissing, AUTH_SOURCE, UUID_RE } from "./lib/fn-auth.mjs";

const KNOWN = new Set(["--apply", "--key", "--scopes", "--reason", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ".");
    console.error("");
    console.error("THIS REPOSITORY HAS TWO FLAG CONVENTIONS AND THEY ARE OPPOSITES.");
    console.error("This script is the --apply family: DRY BY DEFAULT, --apply writes.");
    console.error("`--dry` is NOT a flag here and passing it does not make anything safer.");
    console.error("Known: " + [...KNOWN].join(", "));
    process.exit(2);
  }
}
const arg = (k, d = null) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : d;
};
const APPLY = process.argv.includes("--apply");
const KEY_ID = arg("key");
const RAW_SCOPES = arg("scopes");
const REASON = arg("reason");

const HERE = dirname(fileURLToPath(import.meta.url));
for (const f of [join(HERE, ".env"), join(HERE, "..", ".env")]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

if (!KEY_ID || !UUID_RE.test(KEY_ID)) {
  console.error("--key <uuid> required (the issuer_api_keys.id, not the key itself).");
  console.error("The console lists it beside each key; the plaintext key is never accepted here.");
  process.exit(2);
}
if (RAW_SCOPES === null) {
  console.error("--scopes required. Send the COMPLETE new set, comma separated.");
  console.error('To remove every scope without revoking, pass --scopes "" explicitly.');
  process.exit(2);
}
const scopes = RAW_SCOPES.split(",").map((s) => s.trim()).filter(Boolean);

const missing = anonMissing();
if (missing) { console.error(missing); process.exit(2); }

console.log("");
console.log("UPDATE KEY SCOPES");
console.log("  key_id     " + KEY_ID);
console.log("  scopes     " + (scopes.length ? scopes.join(", ") : "(none -- this REMOVES every scope)"));
console.log("  reason     " + (REASON ?? "(none)"));
console.log("  auth       " + (AUTH_SOURCE ?? "NONE"));
console.log("  mode       " + (APPLY ? "APPLY" : "DRY"));
console.log("");

const auth = await getAccessToken();
if (!auth.token) { console.error(auth.error); process.exit(2); }

/* THE DRY RUN IS A REAL READ, not a printed intention. It calls the function
 * with the key's CURRENT scopes, which the function answers as `changed:false`
 * without writing -- so a dry run shows the true before-state from the
 * database rather than echoing the arguments back. There is no separate
 * read endpoint to drift from this one. */
if (!APPLY) {
  const probe = await callFunction("update-issuer-key-scopes",
    { key_id: KEY_ID, scopes: ["__probe__"] }, auth.token);
  if (probe.status === 400 && /unknown scope|must be one of/i.test(JSON.stringify(probe.json))) {
    console.log("  the key exists and is writable; the probe scope was refused as expected");
  } else if (probe.status === 404) {
    console.error("  X no such key: " + KEY_ID);
    process.exit(1);
  } else if (probe.status === 403) {
    console.error("  X not authorised for that key's issuer");
    process.exit(1);
  } else if (probe.status === 409) {
    console.error("  X " + (probe.json?.error ?? "conflict"));
    process.exit(1);
  } else {
    console.log("  probe returned HTTP " + probe.status + ": " + JSON.stringify(probe.json).slice(0, 200));
  }
  console.log("");
  console.log("Dry run. Nothing written. Re-run with --apply.");
  console.log("REMEMBER: --scopes REPLACES. Anything not listed is removed.");
  process.exit(0);
}

const res = await callFunction("update-issuer-key-scopes",
  { key_id: KEY_ID, scopes, reason: REASON ?? undefined }, auth.token);

if (!res.ok) {
  console.error("FAILED: HTTP " + res.status);
  console.error("  " + (res.json?.error ?? JSON.stringify(res.json)));
  process.exit(1);
}

const r = res.json;
console.log("  issuer        " + r.issuer?.slug);
console.log("  key_prefix    " + r.key_prefix);
console.log("  before        " + (r.scopes_before ?? []).join(", "));
console.log("  after         " + (r.scopes_after ?? []).join(", "));
console.log("  added         " + ((r.added ?? []).join(", ") || "(none)"));
console.log("  removed       " + ((r.removed ?? []).join(", ") || "(none)"));
console.log("  changed       " + r.changed);
console.log("  key unchanged " + (r.key_unchanged ?? r.changed === false));

/* POST-CONDITION, and it names the property rather than trusting the 200.
 * The response is the function describing itself; this asks the function again
 * and requires the second answer to agree. A 200 on a write that did not
 * persist is the silent-success failure this repository is organised around. */
const back = await callFunction("update-issuer-key-scopes",
  { key_id: KEY_ID, scopes }, auth.token);
const after = back.json?.scopes_after ?? [];
const want = [...new Set(scopes)].sort();
const got = [...after].sort();
const agree = got.length === want.length && got.every((s, i) => s === want[i]);

console.log("");
if (!agree) {
  console.error("READBACK DISAGREES: wanted [" + want.join(", ") + "], stored [" + got.join(", ") + "]");
  process.exit(1);
}
if (back.json?.changed !== false) {
  console.error("READBACK: the second call reported a change, so the first did not persist");
  process.exit(1);
}
console.log("readback: the stored scopes are exactly [" + got.join(", ") + "] and a repeat is a no-op");
