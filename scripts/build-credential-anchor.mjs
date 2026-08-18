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
 * Not assembled here, not read from a table -- there is no stored document,
 * open-badge rebuilds and re-signs on every fetch. Hashing what we think will be
 * served would anchor an intention; this anchors what a verifier receives.
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
 * ============================ TWO STRUCTURAL FIXES ==========================
 *
 * `autoRefreshToken: false`. Without it the supabase client starts a refresh
 * timer, and process.exit() while that timer is live aborts Node on Windows with
 * `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)`. A service-role key
 * never refreshes, so the timer was pointless as well as harmful.
 *
 * EVERYTHING IS INSIDE main() AND RETURNS. The first version scattered
 * process.exit() through top-level code. A later edit replaced one of them with
 * process.exitCode, which does NOT stop execution -- so the no-op path fell
 * through and printed `merkle root: undefined`, `leaves: 0`, and a self-check
 * claiming all 0 proofs verified. A verification script reporting success on
 * nothing is the exact failure it exists to catch.
 *
 * ============================ RE-ANCHORING IS CORRECT =======================
 *
 * A credential already anchored is skipped. If one is later CORRECTED -- a name
 * fix re-signs it and material_updated_at moves -- its served bytes change and
 * its old leaf no longer matches. Clear anchor_id on that credential and the
 * next run picks it up into a new tree. Nothing is falsified: the old anchor
 * still proves the old document existed, the new one proves the current document
 * does, and the history has two entries because that is what happened.
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
const PUBLIC_BASE = "https://credentials.certidemy.com";

const sha256hex = (buf) => createHash("sha256").update(buf).digest("hex");
const hashPair = (a, b) =>
  createHash("sha256")
    .update(Buffer.concat([Buffer.from(a, "hex"), Buffer.from(b, "hex")]))
    .digest("hex");

/**
 * Build the tree, recording each leaf's sibling path on the way up.
 *
 * The path lets a verifier recompute the root from ONE leaf without seeing any
 * other credential -- the property that makes a shared tree across all issuers
 * safe.
 */
function buildTree(leafHashes) {
  if (leafHashes.length === 0) {
    throw new Error("buildTree called with no leaves");
  }
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

/** Fetch one credential's public document and return its leaf hash. */
async function leafFor(row) {
  const url = `${PUBLIC_BASE}/credentials/${row.credential_code}`;

  let res;
  try {
    res = await fetch(url, { headers: { accept: "application/vc+ld+json" } });
  } catch (err) {
    throw new Error(`${row.credential_code}: ${err.message}`);
  }
  if (!res.ok) {
    throw new Error(`${row.credential_code}: HTTP ${res.status}`);
  }

  const text = await res.text();

  /* The document must be intact before it is hashed. Anchoring a truncated or
     error-shaped response would permanently record a fingerprint of garbage. */
  let doc;
  try {
    doc = JSON.parse(text);
  } catch {
    throw new Error(`${row.credential_code}: response is not JSON`);
  }
  if (!doc.proof || !doc.id || !doc.issuer?.id) {
    throw new Error(`${row.credential_code}: not a signed credential`);
  }

  const proofs = Array.isArray(doc.proof) ? doc.proof : [doc.proof];
  if (!proofs.map((p) => p.cryptosuite).includes("eddsa-rdfc-2022")) {
    throw new Error(
      `${row.credential_code}: no eddsa-rdfc-2022 proof -- DOC_VERSION ` +
        `"${DOC_VERSION}" expects the dual-proof shape`,
    );
  }
  if (doc.credentialSubject?.identifier) {
    throw new Error(
      `${row.credential_code}: fetched the HOLDER copy. Only the public copy ` +
        `is anchorable, and an anonymous fetch returning identifier[] is a ` +
        `disclosure bug worth stopping on.`,
    );
  }

  return { leaf: sha256hex(Buffer.from(text, "utf8")), bytes: text.length };
}

async function main() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error("ABORT  SUPABASE_SERVICE_ROLE_KEY not set");
    return 2;
  }

  const sb = createClient(SUPABASE_URL, serviceKey, {
    // autoRefreshToken: false stops the timer that aborts Node on exit. See the
    // header. A service-role key never refreshes.
    auth: { persistSession: false, autoRefreshToken: false },
  });

  /* Specimens are EXCLUDED. open-badge 404s them deliberately -- a signed
     specimen would genuinely verify, and a machine cannot see the amber banner a
     human sees on the verify page. Anchoring one would be the same mistake in a
     longer-lived form.

     Revoked credentials ARE included. Their standing travels in the status list;
     the document is still a real document that really existed, and skipping it
     would make the anchor set disagree with what is served. */
  const { data: rows, error } = await sb
    .from("credentials")
    .select("id, credential_code, issuer_id, material_updated_at")
    .is("anchor_id", null)
    .eq("is_specimen", false)
    .order("credential_code", { ascending: true });

  if (error) {
    console.error("ABORT  credential lookup:", error.message);
    return 3;
  }

  if (!rows || rows.length === 0) {
    console.log("nothing to anchor -- every credential already has an anchor_id");
    return 0;
  }

  console.log(`  ${rows.length} credential(s) to hash\n`);

  const leaves = [];
  for (const row of rows) {
    let info;
    try {
      info = await leafFor(row);
    } catch (err) {
      console.error(`ABORT  ${err.message}`);
      return 3;
    }
    leaves.push({ ...row, ...info });
    console.log(
      `  ${row.credential_code.padEnd(22)} ${String(info.bytes).padStart(6)} B  ${info.leaf.slice(0, 16)}...`,
    );
  }

  const { root, paths } = buildTree(leaves.map((l) => l.leaf));

  console.log(`\n  merkle root : ${root}`);
  console.log(`  leaves      : ${leaves.length}`);
  console.log(`  doc_version : ${DOC_VERSION}`);

  /* Self-check: every path must recompute the root. A tree that does not verify
     against its own proofs is worse than no tree, because it would be published.
     Asserted against a NON-ZERO leaf count -- "all 0 proofs verified" was
     exactly the false success this script was rewritten to eliminate. */
  if (leaves.length === 0) {
    console.error("ABORT  self-check ran with no leaves");
    return 3;
  }
  let bad = 0;
  leaves.forEach((l, i) => {
    let h = l.leaf;
    for (const step of paths[i]) {
      h = step.position === "right"
        ? hashPair(h, step.hash)
        : hashPair(step.hash, h);
    }
    if (h !== root) {
      console.error(`  FAIL  ${l.credential_code} path does not reach the root`);
      bad++;
    }
  });
  if (bad > 0) {
    console.error(`\nABORT  ${bad} inclusion proof(s) do not verify`);
    return 3;
  }
  console.log(
    `  self-check  : all ${leaves.length} inclusion proof(s) recompute the root`,
  );

  if (DRY) {
    console.log("\nDRY RUN -- nothing written");
    return 2;
  }

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
    return 3;
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
      return 3;
    }
    written++;
  }

  console.log(`\nwritten  anchor ${anchor.id}, ${written} credential(s) linked`);
  return 0;
}

/* Sets the exit code rather than calling process.exit(), so Node closes its
   handles in its own time. With autoRefreshToken off there is nothing left
   running, and the process ends cleanly on its own. */
process.exitCode = await main();
