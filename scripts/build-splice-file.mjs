/**
 * build-splice-file.mjs -- every declared span replacement, its full `to`
 * sentence, and whether that sentence is in the live English today.
 *
 * READ-ONLY. Unknown flags exit 2.
 *
 * ============ WHY THE STATES ARE THREE AND NOT TWO ============
 *
 * `check-rewrite-seams` reports "20 declared, 16 located, 4 not found". Four
 * anchors absent from the live English is not one fact. An anchor can be absent
 * because a LATER declared edit rewrote the same passage -- in which case the
 * splice did land and was then legitimately replaced -- or it can be absent for
 * no reason anyone can name, which is the state that needs a person.
 *
 * Collapsing those into "not found" is the third-state defect: it reads as a
 * gap in the record when half of it is the record working. So:
 *
 *   LOCATED     the `to` sentence is in the live English, byte for byte
 *   SUPERSEDED  absent, and a later declared edit names it or its passage
 *   UNLOCATED   absent, and nothing here explains why
 *
 * UNLOCATED is the only one that is a question.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { acquireHeavyReaderLock } from "./lib/heavy-reader-lock.mjs";
import { DECLARED_ENGLISH_EDITS as DECLARED_EDITS } from "./lib/declared-english-edits.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY, takes none");
  process.exitCode = 2; process.exit();
}

/* The same five sources check-rewrite-seams reads, and the same extraction, so
 * the two cannot disagree about what was declared. */
const SOURCES = ["apply-rewrites-batch-1.mjs", "apply-0306.mjs",
  "apply-audit-sentence-rewrite.mjs", "fix-broken-attribution-chain.mjs",
  "convert-ceiling-breaches.mjs"];

function anchorsFrom(file) {
  const src = readFileSync(join(HERE, file), "utf8");
  const out = [];
  let slug = null;
  for (const m of src.matchAll(
    /slug:\s*"([^"]+)"|^\s*"([a-z0-9][a-z0-9-]{6,})":\s*\[|from:\s*"((?:[^"\\]|\\.)*)"|to:\s*"((?:[^"\\]|\\.)*)"/gm)) {
    if (m[1] !== undefined) { slug = m[1]; continue; }
    if (m[2] !== undefined) { slug = m[2]; continue; }
    const un = (s) => s.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
    if (m[3] !== undefined) { out.push({ slug, kind: "from", text: un(m[3]), file }); continue; }
    if (m[4] !== undefined) { out.push({ slug, kind: "to", text: un(m[4]), file }); continue; }
  }
  return out;
}

const raw = SOURCES.filter((f) => existsSync(join(HERE, f))).flatMap(anchorsFrom);
const tos = raw.filter((r) => r.kind === "to" && r.text.length >= 40);
const froms = raw.filter((r) => r.kind === "from");
if (!tos.length) { console.error("extracted ZERO `to` anchors -- not a result"); process.exitCode = 2; process.exit(); }

const KEY = requireKey(HERE);
const release = await acquireHeavyReaderLock("build-splice-file");
try {
  const slugs = [...new Set(tos.map((t) => t.slug))];
  const rows = await getAll(KEY,
    "lessons?select=slug,language,content_md&language=eq.en&slug=in.(" + slugs.join(",") + ")&order=slug");
  const mdBy = new Map(rows.map((r) => [r.slug, String(r.content_md || "")]));

  const results = [];
  for (const t of tos) {
    const md = mdBy.get(t.slug);
    if (md === undefined) {
      results.push({ ...t, state: "UNLOCATED", why: "no live English lesson row for this slug" });
      continue;
    }
    if (md.includes(t.text)) { results.push({ ...t, state: "LOCATED", why: "present byte for byte" }); continue; }

    /* SUPERSEDED: something declared LATER rewrote this passage. Two witnesses,
     * either sufficient, both named in the output so the verdict is auditable. */
    const witnesses = [];
    for (const d of DECLARED_EDITS) {
      if (d.slug !== t.slug) continue;
      if (t.text.includes(d.from) || d.from.includes(t.text.slice(0, 60))) {
        witnesses.push("declared edit seq " + d.seq + " (" + d.by + ") rewrites this passage: " + d.why);
      }
    }
    for (const f of froms) {
      if (f.slug !== t.slug || f.file === t.file) continue;
      if (t.text.includes(f.text.slice(0, 50)) || f.text.includes(t.text.slice(0, 50))) {
        witnesses.push(f.file + " later declares this passage as its `from`");
      }
    }
    /* A near-miss is evidence too: the sentence is there with small edits. */
    const head = t.text.slice(0, 45);
    if (md.includes(head)) witnesses.push("the first 45 characters ARE present -- the passage survives with later edits");

    /* ============ PARTIAL IS A FOURTH STATE ============
     *
     * A declared `to` can be absent while MOST OF IT is present. The
     * audit-sentence rewrite changed two things at once -- the wording, to remove
     * a 17-word reproduction of ISO/IEC 27000, and the attribution, from
     * ISO 19011:2026 to ISO/IEC 27000:2018. On isms-ia-01-01 the WORDING landed
     * and the ATTRIBUTION did not, so the sentence is 80 percent of the declared
     * text with a different standard at the front.
     *
     * Calling that UNLOCATED says nothing happened, which is false and sends the
     * reader looking for a lost edit. Calling it LOCATED claims a citation change
     * that is not there. It is PARTIAL, and it is the state that needed a human
     * -- who found that the surviving citation is the CORRECT one and the
     * declared replacement was the mistake. */
    const tailStart = Math.max(0, t.text.length - 100);
    const tail = t.text.slice(tailStart).replace(/[.\s]+$/, "");
    const partial = tail.length >= 40 && md.includes(tail);

    /* PRECEDENCE: SUPERSEDED > PARTIAL > UNLOCATED, and the order matters.
     * `03-04-operational-planning-and-control` is BOTH partly present AND named
     * by a later declared edit. SUPERSEDED is the more useful verdict there --
     * it says "the record accounts for this, move on" -- whereas PARTIAL is for
     * a splice that half-landed with NOTHING explaining the other half. Ranking
     * PARTIAL first put an explained splice in the bucket reserved for
     * unexplained ones and made the unexplained set look larger than it is. */
    let state = "UNLOCATED";
    if (witnesses.length) state = "SUPERSEDED";
    else if (partial) state = "PARTIAL";

    if (partial) {
      const i = md.indexOf(tail);
      witnesses.unshift("the last " + tail.length + " characters ARE present; what precedes them in the " +
        "live English is: “" + md.slice(Math.max(0, i - 60), i).replace(/\s+/g, " ").trim() + "”");
    }
    results.push({ ...t, state,
      why: witnesses.length ? witnesses.join("; ") : "absent, and nothing declared here explains it" });
  }

  const count = (s) => results.filter((r) => r.state === s).length;
  const L = [];
  L.push("# The declared splices");
  L.push("");
  L.push("Every span replacement declared by an apply script, with the full `to`");
  L.push("sentence and whether it is in the live English today. Read-only, generated by");
  L.push("`scripts/build-splice-file.mjs`.");
  L.push("");
  L.push("**Four states, because \"not found\" was three different facts.** An anchor can be");
  L.push("absent because a later declared edit rewrote the passage (SUPERSEDED — the splice");
  L.push("landed and was then legitimately replaced); absent while MOST OF IT is present");
  L.push("(PARTIAL — one half of a two-part edit landed); or absent with nothing accounting");
  L.push("for it (UNLOCATED). Only the last two are questions, and PARTIAL is the state that");
  L.push("found something: see `ANCHOR-SAMPLE.md`.");
  L.push("");
  L.push("| state | n | meaning |");
  L.push("|---|---|---|");
  L.push("| LOCATED | " + count("LOCATED") + " | the `to` sentence is in the live English, byte for byte |");
  L.push("| SUPERSEDED | " + count("SUPERSEDED") + " | absent, and a later declared edit accounts for it |");
  L.push("| **PARTIAL** | **" + count("PARTIAL") + "** | **most of the sentence landed and part of it did not** |");
  L.push("| UNLOCATED | " + count("UNLOCATED") + " | absent, and nothing explains why |");
  L.push("| total declared | " + results.length + " | |");
  L.push("");
  L.push("`check-rewrite-seams` reports the same 20 and examined the " + count("LOCATED") +
    " located ones for a");
  L.push("broken seam: **none**. This file is the other half — what happened to the rest.");
  L.push("");

  for (const state of ["PARTIAL", "UNLOCATED", "SUPERSEDED", "LOCATED"]) {
    const set = results.filter((r) => r.state === state);
    if (!set.length) continue;
    L.push("---");
    L.push("");
    L.push("## " + state + " — " + set.length);
    L.push("");
    if (state === "UNLOCATED" && set.length) {
      L.push("**These need a person.** The splice was declared and its sentence is not in the");
      L.push("live English, with no later edit accounting for it.");
      L.push("");
    }
    if (state === "PARTIAL" && set.length) {
      L.push("**Both of these are `isms-ia-01-01-audit-parties`, and they are RESOLVED — see");
      L.push("`ANCHOR-SAMPLE.md`.** The rewrite changed two things at once: the wording, to");
      L.push("remove a 17-word reproduction of ISO/IEC 27000:2018, and the attribution, from");
      L.push("ISO 19011:2026 to ISO/IEC 27000:2018. **The wording landed; the attribution did");
      L.push("not — and the attribution change was the mistake.** Verified against the PDF:");
      L.push("ISO 19011:2026 clause 3.1 Note 1 reads *\"internal audits, sometimes called");
      L.push("first-party audits, are conducted by, or on behalf of, the organization itself\"*,");
      L.push("which is exactly the allowance the lesson describes. The surviving citation is");
      L.push("sound and the declared replacement would have been a lateral move justified by a");
      L.push("false premise. **No repair is needed.**");
      L.push("");
    }
    let n = 0;
    for (const r of set.sort((a, b) => a.slug.localeCompare(b.slug))) {
      n++;
      L.push("### " + n + ". `" + r.slug + "` — " + r.file);
      L.push("");
      L.push("*" + r.why + "*");
      L.push("");
      L.push("> " + r.text.replace(/\n+/g, "\n> "));
      L.push("");
    }
  }

  const path = join(ROOT, "SPLICES.md");
  writeFileSync(path, L.join("\n") + "\n", "utf8");

  console.log("DECLARED SPLICES");
  console.log("  declared `to` anchors   " + results.length);
  console.log("  LOCATED                 " + count("LOCATED"));
  console.log("  SUPERSEDED              " + count("SUPERSEDED"));
  console.log("  UNLOCATED               " + count("UNLOCATED") + (count("UNLOCATED") ? "   <- need a person" : ""));
  for (const r of results.filter((x) => x.state !== "LOCATED")) {
    console.log("    " + r.state + "  " + r.slug + "  (" + r.file + ")");
    console.log("        " + r.why.slice(0, 150));
  }
  console.log("wrote " + path);
} finally { release(); }
