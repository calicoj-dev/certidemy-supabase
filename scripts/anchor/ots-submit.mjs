/**
 * ots-submit.mjs
 *
 * Submits every un-anchored Merkle root to the OpenTimestamps calendars.
 *
 * Run from supabase/scripts/anchor/.
 *
 *   node ots-submit.mjs --dry
 *   node ots-submit.mjs
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY.
 *
 * ============================ WHAT THIS ACTUALLY DOES =======================
 *
 * It hands a 32-byte hash to four independent calendar servers. They aggregate
 * thousands of submissions from everyone into their own Merkle tree, commit ONE
 * root to Bitcoin, and pay the fee themselves. What comes back is a .ots proof:
 * the chain of operations from our hash up toward a Bitcoin block.
 *
 * No wallet. No key. No funds. Nothing of ours on the chain -- which is also why
 * there is no txid to record.
 *
 * ============================ SUBMIT IS NOT ANCHORED ========================
 *
 * Every calendar returns PendingAttestation. That means SUBMITTED, NOT YET IN A
 * BLOCK: they have promised to include the hash, Bitcoin has confirmed nothing.
 *
 * So this script sets ots_proof and LEAVES anchored_at NULL. Only ots-upgrade,
 * hours later, may set it -- and from the Bitcoin block time, never from our own
 * clock. A pending proof presented as a Bitcoin timestamp would be claiming a
 * date that does not exist.
 *
 * ============================ WHAT IS STAMPED ===============================
 *
 * THE RAW 32 BYTES OF THE ROOT, not its hex string.
 *
 * A verifier reads the root from ?doc=anchor as hex, decodes it, and stamps
 * those bytes. Timestamping the 64-character text instead would work but would
 * be a different thing, and anyone verifying independently would get a mismatch
 * with no explanation. Documented here, in migration 228, and in the endpoint,
 * because it is exactly the sort of convention that must be stated rather than
 * inferred.
 *
 * ============================ WHY THIS DIRECTORY EXISTS =====================
 *
 * opentimestamps pulls request@2.88.2, deprecated since 2020, carrying an
 * unpatchable SSRF advisory plus qs/tough-cookie/uuid issues. Its own
 * package.json keeps all of that out of the main supabase tree, which stays at
 * zero vulnerabilities.
 *
 * The form-data override clears both CRITICAL advisories; what remains is
 * moderate. And this runs on a GitHub Actions runner -- a disposable Ubuntu
 * container with no internal endpoints for an SSRF to reach, destroyed when the
 * job ends.
 */
import { createClient } from "@supabase/supabase-js";
import ots from "opentimestamps";

/* CLASSES may be destructured; FUNCTIONS may not. stamp() and info() reach for
   makeMerkleTree through `this`, so they must be called as ots.stamp(...) and
   ots.info(...) or the receiver is undefined. */
const { DetachedTimestampFile, Ops, Context } = ots;

const DRY = process.argv.includes("--dry");
const SUPABASE_URL = "https://pctynukndxnmnxiqpgck.supabase.co";

/** Serialize a stamped DetachedTimestampFile to base64. */
function serializeProof(detached) {
  const ctx = new Context.StreamSerialization();
  detached.serialize(ctx);
  return Buffer.from(ctx.getOutput()).toString("base64");
}

/** Which calendars attested, read out of the proof itself. */
function calendarsFrom(detached) {
  const text = ots.info(detached);
  const found = new Set();
  for (const m of text.matchAll(/PendingAttestation\('([^']+)'\)/g)) {
    found.add(m[1]);
  }
  return [...found];
}

async function main() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error("ABORT  SUPABASE_SERVICE_ROLE_KEY not set");
    return 2;
  }

  const sb = createClient(SUPABASE_URL, serviceKey, {
    // See build-credential-anchor.mjs: the refresh timer aborts Node on exit and
    // a service-role key never refreshes.
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: rows, error } = await sb
    .from("credential_anchors")
    .select("id, merkle_root, leaf_count, built_at")
    .is("ots_proof", null)
    .order("built_at", { ascending: true });

  if (error) {
    console.error("ABORT  anchor lookup:", error.message);
    return 3;
  }
  if (!rows || rows.length === 0) {
    console.log("nothing to submit -- every anchor already has an OTS proof");
    return 0;
  }

  console.log(`  ${rows.length} anchor(s) to submit\n`);

  let submitted = 0;
  for (const row of rows) {
    console.log(`  ${row.merkle_root.slice(0, 16)}...  ${row.leaf_count} leaf/leaves`);

    /* RAW BYTES, not the hex string. See the header. */
    const rootBytes = Buffer.from(row.merkle_root, "hex");
    if (rootBytes.length !== 32) {
      console.error(
        `ABORT  root is ${rootBytes.length} bytes, expected 32 -- not a sha256 hex string`,
      );
      return 3;
    }

    const detached = DetachedTimestampFile.fromBytes(
      new Ops.OpSHA256(),
      rootBytes,
    );

    try {
      await ots.stamp(detached);
    } catch (err) {
      console.error(`ABORT  stamp failed: ${err.message ?? err}`);
      return 3;
    }

    const proof = serializeProof(detached);
    const calendars = calendarsFrom(detached);

    /* A proof with no attestations reached no calendar. Storing it would record
       a submission that never happened, and the upgrade job would wait forever
       for a confirmation nobody promised. */
    if (calendars.length === 0) {
      console.error("ABORT  proof carries no PendingAttestation -- no calendar accepted it");
      return 3;
    }

    console.log(`    proof     ${Buffer.from(proof, "base64").length} bytes`);
    console.log(`    calendars ${calendars.length}`);
    for (const c of calendars) console.log(`      ${c}`);

    if (DRY) {
      console.log("    (dry run -- not stored)\n");
      submitted++;
      continue;
    }

    const { error: updErr } = await sb
      .from("credential_anchors")
      .update({
        ots_proof: proof,
        ots_calendars: calendars,
        chain: "bitcoin-ots",
        /* anchored_at DELIBERATELY UNTOUCHED. The calendars have accepted the
           hash; Bitcoin has confirmed nothing. Only ots-upgrade may set it, and
           only from a block time. */
      })
      .eq("id", row.id);

    if (updErr) {
      console.error(`ABORT  ${row.id}: ${updErr.message}`);
      return 3;
    }
    console.log("    stored\n");
    submitted++;
  }

  if (DRY) {
    console.log(`DRY RUN -- ${submitted} anchor(s) would be stored`);
    console.log("NOTE the stamps above were really submitted to the calendars.");
    console.log("A dry run cannot un-submit; it only skips the database write.");
    return 2;
  }

  console.log(`submitted ${submitted} anchor(s)`);
  console.log("\nPENDING, NOT ANCHORED. Run ots-upgrade.mjs in a few hours;");
  console.log("Bitcoin confirmation is what makes the timestamp real.");
  return 0;
}

process.exitCode = await main();
