/**
 * ots-upgrade.mjs
 *
 * Upgrades pending OpenTimestamps proofs to complete Bitcoin attestations.
 *
 * Run from supabase/scripts/anchor/.
 *
 *   node ots-upgrade.mjs --dry
 *   node ots-upgrade.mjs
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY.
 *
 * ============================ WHY THIS EXISTS ===============================
 *
 * ots-submit leaves every proof carrying PendingAttestation: the calendars have
 * accepted the hash, Bitcoin has confirmed nothing. That state is a promise, not
 * a timestamp.
 *
 * Hours later -- once the calendars' own aggregate root lands in a block -- the
 * proof can be UPGRADED. The calendar hands back the completed path from our
 * hash down to a real Bitcoin block header, and only then does a timestamp
 * exist.
 *
 * THIS SCRIPT IS NOT OPTIONAL. Without it, proofs sit pending forever and the
 * whole anchor claim is a submission receipt rather than a Bitcoin timestamp.
 *
 * ============================ SAFE TO RUN REPEATEDLY ========================
 *
 * A proof that is not yet confirmed simply stays pending and is skipped. Run it
 * hourly, daily, whatever -- it upgrades what is ready and leaves the rest.
 * Confirmation timing is Bitcoin's, not ours; several hours is normal and a day
 * is not alarming.
 *
 * ============================ THE DATE COMES FROM THE BLOCK =================
 *
 * anchored_at is set from the BITCOIN BLOCK TIME carried in the attestation,
 * never from our clock. The entire value of the anchor is a date nobody has to
 * take our word for; writing our own timestamp would quietly hollow that out
 * while looking identical in the database.
 *
 * If the block time cannot be read out of the upgraded proof, the row is left
 * pending rather than stamped with now(). A missing date is honest; a wrong one
 * is not.
 */
import { createClient } from "@supabase/supabase-js";
import ots from "opentimestamps";

/* CLASSES may be destructured; FUNCTIONS may not -- see ots-submit.mjs. */
const { DetachedTimestampFile, Context } = ots;

const DRY = process.argv.includes("--dry");
const SUPABASE_URL = "https://pctynukndxnmnxiqpgck.supabase.co";

function deserializeProof(b64) {
  const bytes = Buffer.from(b64, "base64");
  const ctx = new Context.StreamDeserialization(bytes);
  return DetachedTimestampFile.deserialize(ctx);
}

function serializeProof(detached) {
  const ctx = new Context.StreamSerialization();
  detached.serialize(ctx);
  return Buffer.from(ctx.getOutput()).toString("base64");
}

/**
 * Bitcoin block heights the proof now attests to.
 *
 * A complete attestation reads "verify BitcoinBlockHeaderAttestation(<height>)".
 * Its presence is what distinguishes a real timestamp from a promise.
 */
function bitcoinHeights(detached) {
  const text = ots.info(detached);
  const heights = [];
  for (const m of text.matchAll(/BitcoinBlockHeaderAttestation\((\d+)\)/g)) {
    heights.push(Number(m[1]));
  }
  return heights;
}

/**
 * The block's timestamp, from a public block explorer.
 *
 * Read from the chain rather than assumed, because this date is the whole
 * product. A verifier can check it against any explorer, or their own node.
 */
async function blockTime(height) {
  const hashRes = await fetch(`https://blockstream.info/api/block-height/${height}`);
  if (!hashRes.ok) throw new Error(`block-height ${height}: HTTP ${hashRes.status}`);
  const hash = (await hashRes.text()).trim();

  const blkRes = await fetch(`https://blockstream.info/api/block/${hash}`);
  if (!blkRes.ok) throw new Error(`block ${hash}: HTTP ${blkRes.status}`);
  const blk = await blkRes.json();

  if (typeof blk.timestamp !== "number") {
    throw new Error(`block ${hash}: no timestamp in response`);
  }
  return { hash, iso: new Date(blk.timestamp * 1000).toISOString() };
}

async function main() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error("ABORT  SUPABASE_SERVICE_ROLE_KEY not set");
    return 2;
  }

  const sb = createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: rows, error } = await sb
    .from("credential_anchors")
    .select("id, merkle_root, ots_proof, built_at")
    .not("ots_proof", "is", null)
    .is("ots_upgraded_at", null)
    .order("built_at", { ascending: true });

  if (error) {
    console.error("ABORT  anchor lookup:", error.message);
    return 3;
  }
  if (!rows || rows.length === 0) {
    console.log("nothing pending -- every proof is already upgraded");
    return 0;
  }

  console.log(`  ${rows.length} pending proof(s)\n`);

  let upgraded = 0;
  let stillPending = 0;

  for (const row of rows) {
    const age = Math.round((Date.now() - new Date(row.built_at)) / 3600000);
    console.log(`  ${row.merkle_root.slice(0, 16)}...  submitted ${age}h ago`);

    let detached;
    try {
      detached = deserializeProof(row.ots_proof);
    } catch (err) {
      console.error(`    ABORT  stored proof will not deserialize: ${err.message ?? err}`);
      return 3;
    }

    try {
      await ots.upgrade(detached);
    } catch (err) {
      /* An upgrade attempt on an unconfirmed proof is a normal outcome, not a
         failure. Leave it pending and move on. */
      console.log(`    not ready (${err.message ?? err})\n`);
      stillPending++;
      continue;
    }

    const heights = bitcoinHeights(detached);
    if (heights.length === 0) {
      console.log("    still pending -- no Bitcoin attestation yet\n");
      stillPending++;
      continue;
    }

    /* The EARLIEST block is the honest date: the first moment the hash was
       provably in the chain. Later attestations are additional paths to the
       same fact, not later news. */
    const height = Math.min(...heights);

    let block;
    try {
      block = await blockTime(height);
    } catch (err) {
      /* Rather than stamp our own clock. A missing date is honest; a wrong one
         is worse than none, and this row will be picked up next run. */
      console.error(`    block time unavailable (${err.message ?? err}) -- left pending\n`);
      stillPending++;
      continue;
    }

    console.log(`    CONFIRMED  block ${height}`);
    console.log(`    ${block.iso}`);
    console.log(`    ${block.hash}`);

    if (DRY) {
      console.log("    (dry run -- not stored)\n");
      upgraded++;
      continue;
    }

    const { error: updErr } = await sb
      .from("credential_anchors")
      .update({
        ots_proof: serializeProof(detached),
        ots_upgraded_at: new Date().toISOString(),
        /* FROM THE BLOCK, never from our clock. See the header. */
        anchored_at: block.iso,
        txid: `block:${height}`,
      })
      .eq("id", row.id);

    if (updErr) {
      console.error(`    ABORT  ${row.id}: ${updErr.message}`);
      return 3;
    }
    console.log("    stored\n");
    upgraded++;
  }

  console.log(
    `${upgraded} upgraded, ${stillPending} still pending${DRY ? "  (DRY RUN -- nothing stored)" : ""}`,
  );
  if (stillPending > 0) {
    console.log("Pending is normal. Bitcoin confirmation takes hours; a day is not alarming.");
  }
  return DRY ? 2 : 0;
}

process.exitCode = await main();
