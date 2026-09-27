/**
 * load-source-passages.mjs -- insert SOURCE-PASSAGES.json into public.source_passages.
 *
 * `--apply` to write. DRY BY DEFAULT. Unknown flags exit 2, and the error names both
 * flag conventions in this directory, because reading `--apply` and inferring that
 * `--dry` makes it safe is exactly backwards here.
 *
 * ============ IT LOADS THE ARTIFACT, IT DOES NOT RE-EXTRACT ============
 *
 * The pilot, the gates and this loader all read the SAME SOURCE-PASSAGES.json. A second
 * extraction here would be a second implementation of one computation, and the two would
 * diverge -- the divergence surfacing as a verbatim gate that refuses a key quoted
 * correctly from a passage the database spells differently. Run
 * extract-source-passages.mjs first; this moves bytes.
 *
 * ============ THE TABLE MAY NOT EXIST, AND THAT IS ITS OWN STATE ============
 *
 * Migration 375 is applied by Juan in the SQL editor. Until it has run, this script can
 * neither load nor claim to have loaded: it reports COULD NOT RUN and exits 3, which is
 * distinct from both success and a failed load. A step that could not start is not a
 * step that failed.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

let APPLY = false;
let PRUNE = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  /* `--prune` DELETES, so it requires `--apply` and is refused alone: this is the --apply family,
   * where the absence of a flag must never be the thing that makes a destructive run safe. */
  if (a === "--prune") { PRUNE = true; continue; }
  console.error("unknown flag " + JSON.stringify(a));
  console.error("");
  console.error("THIS DIRECTORY HAS TWO OPPOSITE FLAG CONVENTIONS:");
  console.error("  --apply family  dry by default, --apply writes   <- this script");
  console.error("  --dry family    LIVE by default, --dry is safe   (load-lessons-direct.mjs)");
  console.error("A flag someone believed in that silently did nothing is how a loader runs live.");
  process.exitCode = 2; process.exit();
}
if (PRUNE && !APPLY) {
  console.error("--prune DELETES rows and requires --apply. Refusing.");
  console.error("Run without either flag first: the report names every row a prune would remove.");
  process.exitCode = 2; process.exit();
}

/* EVERY EXIT AFTER THE FIRST FETCH IS A RETURN, NOT process.exit(). On Windows,
 * process.exit() with keep-alive sockets still open aborts libuv and the abort REPLACES
 * the exit code, so a caller reads a different number and branches wrongly. CLAUDE.md
 * records it; this script reproduced it on its first run. */
async function main() {
  const KEY = requireKey(HERE);
  const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));

  /* ---------------------------------------------------------------- pre-flight
   *
   * THE PROBE MUST NOT FIGHT THE PAGER, AND A MALFORMED PROBE IS NOT AN ABSENT TABLE.
   * This asked for `?limit=1` through `getAll`, which pages with `Range` headers -- so
   * PostgREST answered 416 Range Not Satisfiable and the script reported "migration 375 has
   * not been applied yet" against a table holding 676 rows. That message would have sent Juan
   * to re-apply an applied migration: the error named the wrong half of the system, which is
   * the family this repository records for the missing `apikey` header and for IPv6.
   *
   * So the probe is an equality filter that can match nothing -- bounded, no `limit`, no Range
   * conflict -- and only a 404 or a "does not exist" is read as an absent table. Anything else
   * is reported as its own state rather than diagnosed. */
  try {
    await getAll(KEY, "source_passages?select=source_id&source_id=eq.__probe_no_such_source__");
  } catch (e) {
    const msg = String((e && e.message) || e);
    const absent = /\b404\b/.test(msg) || /does not exist/i.test(msg) ||
      /Could not find the table/i.test(msg);
    console.error(absent
      ? "COULD NOT RUN -- public.source_passages does not exist."
      : "COULD NOT RUN -- the pre-flight probe failed for a reason that is NOT an absent table.");
    console.error("  " + msg.split("\n")[0]);
    console.error("");
    if (absent) {
      console.error("Migration 375 has not been applied. Hand it to Juan:");
      console.error("  migrations/375_source_passages.sql");
    } else {
      console.error("Do NOT read this as a missing migration. The table may exist and the probe");
      console.error("may be wrong -- fix the probe, or report the error as it stands.");
    }
    console.error("This is NOT a failed load. Nothing was attempted.");
    return 3;
  }

  /* The rows, exactly as the extractor produced them. `page_hint` is null where the
   * extractor cannot say which page a clause started on -- a number nobody measured would
   * be worse than an absence, because the column exists to let a human find the passage in
   * the PDF and a wrong page sends them to the wrong place. */
  const rows = lib.passages.map((p) => ({
    source_id: p.source_id,
    edition: p.edition,
    clause: p.clause,
    title: p.title || null,
    text: p.text,
    normative: p.normative,
    extracted_from: p.extracted_from,
    page_hint: Number.isInteger(p.page_hint) ? p.page_hint : null,
  }));

  /* ---------------------------------------------------------------- validate first */
  const bad = [];
  for (const r of rows) {
    if (!r.source_id || !r.edition || !r.clause) bad.push(r.clause + ": missing an identity column");
    if (!["shall", "should", "can", "informative"].includes(r.normative)) {
      bad.push(r.source_id + " " + r.clause + ": normative=" + JSON.stringify(r.normative) + " is outside the CHECK");
    }
    if (String(r.text || "").trim().length < 20) {
      bad.push(r.source_id + " " + r.clause + ": text is under the 20-character CHECK");
    }
  }
  const seen = new Set();
  for (const r of rows) {
    const k = r.source_id + "|" + r.edition + "|" + r.clause;
    if (seen.has(k)) bad.push("duplicate identity " + k + " -- the unique index would reject the batch");
    seen.add(k);
  }

  console.log("LOAD SOURCE PASSAGES  " + (APPLY ? "--apply (WILL WRITE)" : "dry run (default)"));
  console.log("  rows in the artifact   " + rows.length);
  console.log("  distinct identities    " + seen.size);
  for (const s of lib.sources || []) {
    console.log("    " + (s.id + " " + s.edition).padEnd(32) + String(s.passages).padStart(4) + " passages");
  }
  if ((lib.annex_gaps || []).length) {
    console.log("  ANNEX GAPS CARRIED IN THE ARTIFACT:");
    for (const g of lib.annex_gaps) {
      console.log("    " + g.source_id + " " + g.edition + "  " + g.held + " of " + g.expected +
        "  not held: " + g.missing.join(" "));
    }
  }
  if (bad.length) {
    console.error("");
    console.error("REFUSING TO LOAD -- validate before writing, so ABORT means nothing was written:");
    for (const b of bad.slice(0, 20)) console.error("  " + b);
    if (bad.length > 20) console.error("  ... and " + (bad.length - 20) + " more");
    return 2;
  }

  if (!APPLY) {
    /* THE STALE-ROW REPORT BELONGS IN THE DRY RUN, and its first version did not have it: the
     * enumeration of what `--prune` would delete printed only on a run that was already writing,
     * so the report you need in order to decide was behind the decision. Reading the live table is
     * read-only and costs one paged fetch. */
    const liveNow = await getAll(KEY, "source_passages?select=source_id,edition,clause");
    const stale = liveNow.filter((r) => !seen.has(r.source_id + "|" + r.edition + "|" + r.clause));
    console.log("");
    console.log("  rows live now                                      " + liveNow.length);
    console.log("  rows in the table this artifact does not describe   " + stale.length);
    for (const r of stale) {
      console.log("      STALE  " + (r.source_id + " " + r.edition).padEnd(30) + r.clause);
    }
    if (stale.length) {
      console.log("    These occupy real addresses and the gates anchor against them.");
      console.log("    --apply --prune removes exactly these, asserting both directions after.");
    }
    console.log("");
    console.log("Nothing written. Re-run with --apply.");
    return 0;
  }

  /* ---------------------------------------------------------------- write */
  /* Idempotent on the natural key, which is NOT the primary key: the table's primary key
   * is `id`, so `merge-duplicates` alone would resolve against that and raise 23505 on the
   * unique index instead. The conflict target has to be named -- the same defect that
   * stopped the concept-translation generator on its first re-run. */
  const CONFLICT = "source_id,edition,clause";
  let wrote = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    let attempt = 0;
    for (;;) {
      attempt++;
      try {
        const res = await fetch(REST_URL + "/source_passages?on_conflict=" + CONFLICT, {
          method: "POST",
          headers: {
            /* BOTH headers, same value. Sending only Authorization answers "No API key
             * found in request", which reads as a wrong credential and is a missing
             * header. */
            apikey: KEY, Authorization: "Bearer " + KEY,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify(batch),
        });
        if (!res.ok) throw new Error(res.status + " " + (await res.text()).slice(0, 300));
        wrote += batch.length;
        break;
      } catch (e) {
        if (attempt >= 4) throw e;
        /* A retry is safe HERE and only here: the write is an upsert on a natural key, so
         * a request that arrived and lost its response leaves the same row. That is the
         * opposite of the key-mint case, where a blind retry can mint a second key. */
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
    console.log("  upserted " + wrote + " / " + rows.length);
  }

  /* ---------------------------------------------------------------- post-conditions */
  const live = await getAll(KEY, "source_passages?select=source_id,edition,clause,normative");
  const liveKeys = new Set(live.map((r) => r.source_id + "|" + r.edition + "|" + r.clause));
  const missing = [...seen].filter((k) => !liveKeys.has(k));
  console.log("");
  console.log("POST-CONDITIONS");
  console.log("  rows in the table      " + live.length);
  console.log("  artifact identities missing from the table   " + missing.length);
  if (missing.length) {
    for (const m of missing.slice(0, 15)) console.log("    " + m);
    throw new Error("load incomplete: " + missing.length + " identities did not land");
  }
  /* The negative half: the table must not contain a normative value outside the
   * vocabulary, and must not have gained rows this artifact does not describe. A count
   * that only checks "everything I sent is there" passes on a table that also holds
   * something nobody sent. */
  const extra = live.filter((r) => !seen.has(r.source_id + "|" + r.edition + "|" + r.clause));
  console.log("  rows in the table this artifact does not describe   " + extra.length +
    (extra.length ? "  <- " + extra.slice(0, 5).map((r) => r.source_id + " " + r.clause).join(", ") : ""));

  /* ============ A STALE ROW OCCUPIES A REAL ADDRESS ============
   *
   * This is an UPSERT, so a row the extractor no longer produces stays in the table for ever. It
   * is not inert: `source_passages` is what the gates anchor against, so a container the extractor
   * has stopped emitting still answers a lookup with its children's text, and 27002's introduction
   * mislabelled into Annex B still answers as B.0.1. That is the junk-at-a-real-address shape, and
   * the address makes it worse than an absence.
   *
   * ENUMERATED, NEVER COUNTED, and opt-in: `--prune` with `--apply`. The report names every row it
   * will delete, and afterwards asserts BOTH directions -- nothing the artifact describes went with
   * it, and nothing it does not describe survived. */
  if (extra.length) {
    for (const r of extra) {
      console.log("      STALE  " + (r.source_id + " " + r.edition).padEnd(30) + r.clause);
    }
    if (!PRUNE) {
      console.log("    Not deleted. Re-run with --apply --prune to remove exactly these.");
    } else {
      let gone = 0;
      for (const r of extra) {
        /* One identity at a time, each fully qualified on the natural key. A single filtered
         * DELETE over a list would be fewer round trips and would delete whatever the filter
         * happened to match; this cannot remove a row it did not name. */
        const q = "source_passages?source_id=eq." + encodeURIComponent(r.source_id) +
          "&edition=eq." + encodeURIComponent(r.edition) +
          "&clause=eq." + encodeURIComponent(r.clause);
        const res = await fetch(REST_URL + "/" + q, {
          method: "DELETE",
          headers: { apikey: KEY, Authorization: "Bearer " + KEY, Prefer: "return=minimal" },
        });
        if (!res.ok) throw new Error("delete failed for " + r.source_id + " " + r.clause + ": " +
          res.status + " " + (await res.text()).slice(0, 160));
        gone++;
      }
      const after = await getAll(KEY, "source_passages?select=source_id,edition,clause");
      const afterKeys = new Set(after.map((r) => r.source_id + "|" + r.edition + "|" + r.clause));
      const lostByPrune = [...seen].filter((k) => !afterKeys.has(k));
      const stillExtra = after.filter((r) => !seen.has(r.source_id + "|" + r.edition + "|" + r.clause));
      console.log("    PRUNED " + gone + " row(s); table now " + after.length);
      console.log("    artifact identities lost to the prune   " + lostByPrune.length);
      console.log("    rows still undescribed                  " + stillExtra.length);
      if (lostByPrune.length) throw new Error("the prune deleted " + lostByPrune.length + " row(s) the artifact describes");
      if (stillExtra.length) throw new Error(stillExtra.length + " undescribed row(s) survived the prune");
    }
  }
  const offVocab = live.filter((r) => !["shall", "should", "can", "informative"].includes(r.normative));
  console.log("  rows with a normative value outside the CHECK        " + offVocab.length);
  if (offVocab.length) throw new Error("the CHECK constraint is not doing its job");
  console.log("");
  console.log("loaded.");

  return 0;
}
process.exitCode = await main();
