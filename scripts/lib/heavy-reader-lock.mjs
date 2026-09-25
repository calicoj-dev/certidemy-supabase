/**
 * heavy-reader-lock.mjs -- one corpus-wide reader at a time.
 *
 * ============ WHY THIS IS NOT A NOTE ============
 *
 * On 2026-09-25 the leak rescan and the invariant suite overlapped and the
 * courseware-read endpoint returned 503 `service busy` twenty-two times between
 * 06:21:14 and 06:23:12. Measured from the logs rather than estimated: all 22
 * went to `ua=node` from the workstation running them, and the only non-script
 * callers in a 65-minute window -- pg_net's dispatch jobs and one bingbot fetch
 * -- were served 200 throughout. Nothing reached a partner THIS time.
 *
 * "This time" is the whole problem. The pooler is shared with the live app and
 * the MCP, the ceiling is live isolates times the pool size of 2, and an evicted
 * isolate's connections linger about 100 seconds. Two corpus-wide readers at
 * once can exhaust it, and whether a partner is mid-call when that happens is
 * luck.
 *
 * CLAUDE.md already said to pace. A rule that lives in prose is a rule that gets
 * forgotten by whoever launches the second script -- which is exactly what
 * happened, by the session that had just read the rule. So it is a pre-run check
 * inside the scripts.
 *
 * ============ WAIT, DO NOT REFUSE ============
 *
 * A second heavy reader WAITS for the first. Refusing outright would train
 * people to pass a skip flag, and there is no skip flag here. It gives up only
 * after a long timeout, and then it says who holds the lock and since when --
 * never a bare "could not run".
 *
 * A COULD-NOT-ACQUIRE IS ITS OWN STATE. It is not a pass and it is not a
 * failure of whatever the script was going to measure: the caller is handed a
 * distinct exit code so a wrapper can tell "the gate found nothing" from "the
 * gate never ran".
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const LOCK_DIR = join(tmpdir(), "certidemy-heavy-reader");
const LOCK = join(LOCK_DIR, "corpus-reader.lock");

/** A lock older than this is presumed abandoned -- a killed process leaves no
 *  chance to clean up, and a permanent lock is worse than a shared pooler. The
 *  longest legitimate holder measured is the leak rescan at a few minutes. */
const STALE_AFTER_MS = 20 * 60 * 1000;
const DEFAULT_WAIT_MS = 15 * 60 * 1000;
const POLL_MS = 3000;

/** Concurrency cap for a heavy reader's own in-flight requests. The pooler
 *  ceiling is live isolates x 2; four concurrent callers from one script is well
 *  inside it and still far faster than strictly sequential. */
export const MAX_IN_FLIGHT = 4;

function readLock() {
  try { return JSON.parse(readFileSync(LOCK, "utf8")); } catch { return null; }
}

function alive(pid) {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e && e.code === "EPERM"; }
}

/** True when the lock on disk is not held by anything that still exists. */
function stale(held) {
  if (!held) return true;
  if (!alive(held.pid)) return true;
  return Date.now() - Date.parse(held.since) > STALE_AFTER_MS;
}

/**
 * Take the lock, waiting for whoever holds it.
 *
 * Returns a release function. On timeout it prints who is holding it and exits
 * with code 3 -- distinct from 1 (found something) and 2 (could not look),
 * because "another reader is running" is a third state and folding it into
 * either is the mistake this repository keeps paying for.
 */
export async function acquireHeavyReaderLock(name, opts = {}) {
  const waitMs = opts.waitMs ?? DEFAULT_WAIT_MS;
  const quiet = !!opts.quiet;

  /* A SUITE THAT SPAWNS HEAVY READERS MUST NOT DEADLOCK AGAINST ITS OWN
   * CHILDREN. verify-invariants runs check-refusal-claim and the wire matrix as
   * subprocesses; if the parent holds the lock and the child waits for it, the
   * child waits for its own parent and the whole suite hangs until the timeout.
   *
   * The parent exports HEAVY_READER_LOCK_HELD, which children inherit and treat
   * as already-held. The variable carries the HOLDER'S NAME rather than a bare
   * "1", so a child says whose lock it is running under instead of silently
   * skipping a check that exists to protect production. */
  const inherited = process.env.HEAVY_READER_LOCK_HELD;
  if (inherited) {
    if (!quiet) console.log("  heavy-reader lock: already held by " + inherited + " (inherited); not re-acquiring");
    return () => {};
  }

  mkdirSync(LOCK_DIR, { recursive: true });
  const started = Date.now();
  let announced = false;

  for (;;) {
    const held = readLock();
    if (!held || stale(held)) {
      if (held && !quiet) {
        console.log("  heavy-reader lock: taking over a " +
          (alive(held.pid) ? "stale" : "dead") + " lock from " + held.name + " (pid " + held.pid + ")");
      }
      const mine = { name, pid: process.pid, since: new Date().toISOString() };
      writeFileSync(LOCK, JSON.stringify(mine), "utf8");
      /* Re-read: two starters a millisecond apart both see no lock, and the
       * loser must notice it lost rather than both proceeding. */
      const back = readLock();
      if (!back || back.pid !== process.pid) continue;
      if (!quiet) console.log("  heavy-reader lock: held by " + name + " (pid " + process.pid + ")");
      /* Children inherit it rather than waiting on their own parent. */
      process.env.HEAVY_READER_LOCK_HELD = name;
      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        const cur = readLock();
        if (cur && cur.pid === process.pid) { try { unlinkSync(LOCK); } catch { /* gone already */ } }
      };
      process.on("exit", release);
      return release;
    }

    if (!announced && !quiet) {
      console.log("  heavy-reader lock: WAITING for " + held.name + " (pid " + held.pid +
        ", since " + held.since + ")");
      console.log("      The pooler is shared with the live app and the MCP. Two corpus-wide");
      console.log("      readers at once returned 22 x 503 on 2026-09-25.");
      announced = true;
    }
    if (Date.now() - started > waitMs) {
      console.error("");
      console.error("COULD NOT RUN -- " + held.name + " (pid " + held.pid + ") has held the heavy-reader");
      console.error("  lock since " + held.since + ", longer than this script waited.");
      console.error("  This is NOT a pass and NOT a failure of what it measures: it never ran.");
      process.exit(3);
    }
    await new Promise((s) => setTimeout(s, POLL_MS));
  }
}

/** Run `jobs` with at most `limit` in flight. Heavy readers cap themselves as
 *  well as taking the lock: the lock stops two scripts overlapping, this stops
 *  one script being the heaviest thing the endpoint has seen. */
export async function mapLimited(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

/** Fixtures. A lock that never blocks is the same object as no lock. */
export function heavyReaderLockControls() {
  const bad = [];
  if (!stale(null)) bad.push("a missing lock should read as stale");
  if (!stale({ pid: 999999999, since: new Date().toISOString(), name: "ghost" })) {
    bad.push("a lock held by a dead pid should read as stale");
  }
  if (stale({ pid: process.pid, since: new Date().toISOString(), name: "self" })) {
    bad.push("a fresh lock held by a live pid should NOT read as stale");
  }
  if (!stale({ pid: process.pid, since: new Date(Date.now() - STALE_AFTER_MS - 1000).toISOString(), name: "old" })) {
    bad.push("a lock older than the stale window should read as stale");
  }
  return bad;
}
