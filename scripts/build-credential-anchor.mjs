/**
 * build-credential-anchor.mjs
 *
 * Hashes every un-anchored credential, builds a Merkle tree, and records the
 * root with a per-credential inclusion proof.
 *
 * Run from supabase/.
 *
 *   node scripts/build-credential-anchor.mjs --dry
 *   node scripts/build-credential-anchor.mjs
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY in the environment.
 *
 * ============================ NO CHAIN INVOLVED =============================
 *
 * This writes a root to Postgres and stops. Nothing is published anywhere, no
 * wallet exists, no money is spent. Publishing is a separate, later, optional
 * step that fills chain/txid/anchored_at on rows this script created.
 *
 * The tree is worth building without a chain: the leaf alone proves a credential
 * has not changed since it was hashed.
 *
 * ============================ IT HASHES WHAT IS SERVED ======================
 *
 * Each leaf is sha256 of the document FETCHED FROM THE PUBLIC URL, anonymously.
 * Not a document assembled here, not one read from a table -- there is no stored
 * document, open-badge rebuilds and re-signs on every fetch.
 *
 * Hashing what we think will be served would anchor an intention. This anchors
 * what a verifier would actually receive.
 *
 * ANONYMOUSLY, deliberately: the holder's copy carries identifier[] and hashes
 * differently. Only the public copy can be independently re-fetched and
 * re-hashed by a third party, so only the public copy is worth anchoring.
 *
 * ============================ THE HASH CONVENTION ===========================
 *
 * A verifier must reproduce this exactly, so it is stated rather than implied:
 *
 *   leaf      = sha256( utf8 bytes of the document, exactly as served )
 *   internal  = sha256( left32 || right32 )   raw bytes, not hex strings
 *   odd node  = PROMOTED unchanged to the next level, never duplicated
 *   ordering  = leaves sorted by credential_code, ascending
 *
 * Promotion rather than duplication: duplicating the last leaf admits the
 * CVE-2012-2459 ambiguity, where two different leaf sets produce the same root.
 * Sorting by credential_code makes the tree reproducible by anyone holding the
 * same set of documents.
 *
 * ============================ RE-ANCHORING IS CORRECT =======================
 *
 * A credential already anchored is skipped. If one is later CORRECTED -- a name
 * fix re-signs it and material_updated_at moves -- its served bytes change and
 * its old leaf no longer matches.
 *
 * Handling: clear anchor_id on that credential and let the next run pick it up
 * into a new tree. Nothing is falsified. The old anchor still honestly proves
 * the old document existed; the new one proves the current document does. The
 * history simply has two entries, which is what actually happened.
 */
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry");

/**
 * The credential document SHAPE this run hashes.
 *
 * BUMP THIS whenever _shared/ob3.ts changes what is emitted. Adding
 * eddsa-rdfc-2022 changed every credential; anchors built before it would have
 * silently stopped matching. Prior anchors keep their old doc_version and stay
 * honest about what the document looked like then.
 */
const DOC_VERSION = "ob3-dual-proof-2026-08";

const SUPABASE_URL = "https://pctynukndxnmnxiqpgck.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PUBLIC_BASE = "https://credentials.certidemy.com";

if (!SERVICE_KEY) {
  console.error("ABORT  SUPABASE_SERVICE_ROLE_KEY not set");
  process.exit(2);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const sha256hex = (buf) => createHash("sha256").update(buf).digest("hex");
const hashPair = (a, b) =>
  createHash("sha256")
    .update(Buffer.concat([Buffer.from(a, "hex"), Buffer.from(b, "hex")]))
    .digest("hex");

/* -------------------------------------------------------------------------- *
 * Which credentials
 *
 * Specimens are EXCLUDED. open-badge 404s them deliberately -- a signed specimen
 * would genuinely verify, and a machine cannot see the amber banner a human sees
 * on the verify page. Anchoring one would be the same mistake in a longer-lived
 * form.
 *
 * Revoked credentials ARE included. Their standing travels in the status list;
 * the document itself is still a real document that really existed, and refusing
 * to anchor it would make the anchor set disagree with what is served.
 * -------------------------------------------------------------------------- */

const { data: rows, error } = await sb
  .from("credentials")
  .select("id, credential_code, issuer_id, material_updated_at")
  .is("anchor_id", null)
  .eq("is_specimen", false)
  .order("credential_code", { ascending: true });

if (error) {
  console.error("ABORT  credential lookup:", error.message);
  process.exit(3);
}
if (!rows || rows.length === 0) {
  console.log("nothing to anchor -- every credential already has an anchor_id");
  // NOT process.exit(0): on Windows that crashes Node with a libuv assertion,
  // because the supabase client still holds an open handle and exit() tears the
  // loop down underneath it. The answer prints, then the process dies with a
  // garbage exit code a scheduler would read as failure.
  process.exitCode = 0;
  await sb.auth.stopAutoRefresh?.();
}

console.log(`  ${rows.length} credential(s) to hash\n`);

/* ------------------------------------------------------------------- leaves */

const leaves = [];
for (const row of rows) {
  const url = `${PUBLIC_BASE}/credentials/${row.credential_code}`;
  let res;
  try {
    res = await fetch(url, { headers: { accept: "application/vc+ld+json" } });
  } catch (err) {
    console.error(`ABORT  ${row.credential_code}: ${err.message}`);
    process.exit(3);
  }
  if (!res.ok) {
    console.error(`ABORT  ${row.credential_code}: HTTP ${res.status}`);
    process.exit(3);
  }

  const text = await res.text();

  /* The document must be intact before it is hashed. Anchoring a truncated or
     error-shaped response would permanently record a fingerprint of garbage. */
  let doc;
  try {
    doc = JSON.parse(text);
  } catch {
    console.error(`ABORT  ${row.credential_code}: response is not JSON`);
    process.exit(3);
  }
  if (!doc.proof || !doc.id || !doc.issuer?.id) {
    console.error(`ABORT  ${row.credential_code}: not a signed credential`);
    process.exit(3);
  }
  const proofs = Array.isArray(doc.proof) ? doc.proof : [doc.proof];
  const suites = proofs.map((p) => p.cryptosuite);
  if (!suites.includes("eddsa-rdfc-2022")) {
    console.error(
      `ABORT  ${row.credential_code}: no eddsa-rdfc-2022 proof -- ` +
        `DOC_VERSION "${DOC_VERSION}" expects the dual-proof shape`,
    );
    process.exit(3);
  }
  if (doc.credentialSubject?.identifier) {
    console.error(
      `ABORT  ${row.credential_code}: fetched the HOLDER copy. ` +
        `Only the public copy is anchorable.`,
    );
    process.exit(3);
  }

  const leaf = sha256hex(Buffer.from(text, "utf8"));
  leaves.push({ ...row, leaf, bytes: text.length });
  console.log(
    `  ${row.credential_code.padEnd(22)} ${String(text.length).padStart(6)} B  ${leaf.slice(0, 16)}...`,
  );
}

/* --------------------------------------------------------------------- tree */

/**
 * Build the tree, recording each leaf's sibling path on the way up.
 *
 * The path is what lets a verifier recompute the root from ONE leaf without
 * seeing any other credential -- which is the property that makes a shared tree
 * across all issuers safe.
 */
function buildTree(leafHashes) {
  const paths = leafHashes.map(() => []);
  let level = leafHashes.slice();
  let indices = leafHashes.map((_, i) => [i]);

  while (level.length > 1) {
    const next = [];
    const nextIndices = [];
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 === level.length) {
        // Odd node: PROMOTED unchanged. Duplicating it would admit the
        // CVE-2012-2459 ambiguity where two leaf sets share a root.
        next.push(level[i]);
        nextIndices.push(indices[i]);
        continue;
      }
      for (const idx of indices[i]) {
        paths[idx].push({ position: "right", hash: level[i + 1] });
      }
      for (const idx of indices[i + 1]) {
        paths[idx].push({ position: "left", hash: level[i] });
      }
      next.push(hashPair(level[i], level[i + 1]));
      nextIndices.push([...indices[i], ...indices[i + 1]]);
    }
    level = next;
    indices = nextIndices;
  }
  return { root: level[0], paths };
}

const { root, paths } = buildTree(leaves.map((l) => l.leaf));

console.log(`\n  merkle root : ${root}`);
console.log(`  leaves      : ${leaves.length}`);
console.log(`  doc_version : ${DOC_VERSION}`);

/* Self-check: every path must recompute the root. A tree that does not verify
   against its own proofs is worse than no tree -- it would be published. */
let bad = 0;
leaves.forEach((l, i) => {
  let h = l.leaf;
  for (const step of paths[i]) {
    h = step.position === "right" ? hashPair(h, step.hash) : hashPair(step.hash, h);
  }
  if (h !== root) {
    console.error(`  FAIL  ${l.credential_code} path does not reach the root`);
    bad++;
  }
});
if (bad > 0) {
  console.error(`\nABORT  ${bad} inclusion proof(s) do not verify`);
  process.exit(3);
}
console.log(`  self-check  : all ${leaves.length} inclusion proof(s) recompute the root`);

if (DRY) {
  console.log("\nDRY RUN -- nothing written");
  process.exit(2);
}

/* -------------------------------------------------------------------- write */

const { data: anchor, error: insErr } = await sb
  .from("credential_anchors")
  .insert({
    merkle_root: root,
    leaf_count: leaves.length,
    doc_version: DOC_VERSION,
  })
  .select("id")
  .single();

if (insErr) {
  console.error("ABORT  anchor insert:", insErr.message);
  process.exit(3);
}

let written = 0;
for (let i = 0; i < leaves.length; i++) {
  const { error: updErr } = await sb
    .from("credentials")
    .update({
      anchor_id: anchor.id,
      anchor_leaf: leaves[i].leaf,
      anchor_path: paths[i],
    })
    .eq("id", leaves[i].id);
  if (updErr) {
    console.error(`ABORT  ${leaves[i].credential_code}: ${updErr.message}`);
    process.exit(3);
  }
  written++;
}

console.log(`\nwritten  anchor ${anchor.id}, ${written} credential(s) linked`);
