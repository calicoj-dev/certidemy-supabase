/**
 * gen-ld-contexts.mjs
 *
 * Fetches the JSON-LD @context documents Certidemy credentials reference and
 * writes them into functions/_shared/ld-contexts.data.ts as constants.
 *
 * Run from supabase/.
 *
 * ============================== WHY THIS IS GENERATED =======================
 *
 * eddsa-rdfc-2022 canonicalizes through RDF expansion, so signing resolves every
 * @context URL. Fetching them at signing time would put a third-party network
 * call on the mint path -- where a timeout means a customer pays for an exam and
 * gets nothing -- so they are bundled instead.
 *
 * Generated rather than hand-pasted because these are ~17.5 KB of dense JSON and
 * a single altered character changes what the RDF says, which changes the
 * canonical N-Quads, which changes every signature computed against it.
 *
 * ============================== AFTER REGENERATING ==========================
 *
 * RUN scripts/verify-rdfc-proof.mjs AGAINST AN EXISTING CREDENTIAL.
 *
 * If the signature still verifies, the fetched context was byte-equivalent in
 * meaning. If it does not, the upstream context CHANGED, and every credential
 * signed under the old one is now unverifiable by this code -- which is a
 * decision to make deliberately, not a regeneration to run casually.
 *
 * A new context VERSION (context-3.0.4.json) is a new constant and a new URL,
 * not an edit to this one. Credentials already issued must keep resolving
 * against what they were signed under.
 *
 * Usage:  node scripts/gen-ld-contexts.mjs
 */
import { writeFileSync } from "node:fs";

const OUT = "functions/_shared/ld-contexts.data.ts";

const SOURCES = [
  { name: "VC_V2_CONTEXT", url: "https://www.w3.org/ns/credentials/v2" },
  {
    name: "OB3_CONTEXT",
    url: "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
  },
];

const parts = [];
const summary = [];

for (const { name, url } of SOURCES) {
  const res = await fetch(url, { headers: { accept: "application/ld+json" } });
  if (!res.ok) {
    console.error(`ABORT  ${url} -> ${res.status}`);
    process.exit(3);
  }
  const text = await res.text();

  let doc;
  try {
    doc = JSON.parse(text);
  } catch (err) {
    console.error(`ABORT  ${url} is not JSON: ${err.message}`);
    process.exit(3);
  }
  if (!doc["@context"]) {
    console.error(`ABORT  ${url} has no @context key -- wrong document?`);
    process.exit(3);
  }

  // Re-serialized rather than embedded verbatim: JSON.stringify gives one
  // canonical form, so a diff on this file shows MEANING changes rather than
  // upstream whitespace churn.
  const serialized = JSON.stringify(doc);
  parts.push(
    `export const ${name} = ${serialized} as const;\n`,
  );
  summary.push(`${url}  ${serialized.length} bytes`);
  console.log(`  fetched  ${url}  ${serialized.length} bytes`);
}

const header = `/**
 * supabase/functions/_shared/ld-contexts.data.ts
 *
 * GENERATED. Do not edit by hand.
 *   node scripts/gen-ld-contexts.mjs
 *
 * Bundled JSON-LD @context documents. See ld-contexts.ts for why these are
 * bundled rather than fetched, and for what changing one implies.
 *
 * AFTER REGENERATING, run scripts/verify-rdfc-proof.mjs against an existing
 * credential. A signature that no longer verifies means the upstream context
 * changed meaning, and every credential signed under the old one is affected.
 *
 * Pinned ${new Date().toISOString().slice(0, 10)}:
${summary.map((s) => ` *   ${s}`).join("\n")}
 */

/* deno-fmt-ignore-file */
/* eslint-disable */

`;

writeFileSync(OUT, header + parts.join("\n"), "utf8");
console.log(`\nwritten ${OUT}`);
