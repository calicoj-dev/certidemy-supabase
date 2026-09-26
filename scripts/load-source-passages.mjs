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
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("unknown flag " + JSON.stringify(a));
  console.error("");
  console.error("THIS DIRECTORY HAS TWO OPPOSITE FLAG CONVENTIONS:");
  console.error("  --apply family  dry by default, --apply writes   <- this script");
  console.error("  --dry family    LIVE by default, --dry is safe   (load-lessons-direct.mjs)");
  console.error("A flag someone believed in that silently did nothing is how a loader runs live.");
  process.exitCode = 2; process.exit();
}

/* EVERY EXIT AFTER THE FIRST FETCH IS A RETURN, NOT process.exit(). On Windows,
 * process.exit() with keep-alive sockets still open aborts libuv and the abort REPLACES
 * the exit code, so a caller reads a different number and branches wrongly. CLAUDE.md
 * records it; this script reproduced it on its first run. */
async function main() {
  const KEY = requireKey(HERE);
  const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));

  /* ---------------------------------------------------------------- pre-flight */
  let exists = true;
  try {
    await getAll(KEY, "source_passages?select=source_id&limit=1");
  } catch (e) {
    exists = false;
    console.error("COULD NOT RUN -- public.source_passages is not reachable.");
    console.error("  " + String(e && e.message || e).split("\n")[0]);
    console.error("");
    console.error("Migration 375 has not been applied yet. Hand it to Juan:");
    console.error("  migrations/375_source_passages.sql");
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
  const offVocab = live.filter((r) => !["shall", "should", "can", "informative"].includes(r.normative));
  console.log("  rows with a normative value outside the CHECK        " + offVocab.length);
  if (offVocab.length) throw new Error("the CHECK constraint is not doing its job");
  console.log("");
  console.log("loaded.");

  return 0;
}
process.exitCode = await main();
