#!/usr/bin/env node
/**
 * gate-concept-descriptions.mjs - score a batch of proposed concept
 * descriptions against the concept-scale leak gate, and prove the batch is
 * complete before reporting anything about it.
 *
 * READ-ONLY. No --apply, no --dry, unknown flags exit 2.
 *
 *   node --dns-result-order=ipv4first scripts/gate-concept-descriptions.mjs \
 *     --file AIMS-F-CONCEPT-DESCRIPTIONS.json --cert AIMS-F
 *
 * ============ THE RULE THIS GATE DOES NOT ENFORCE ============
 *
 * A one-line description of a DEFINED TERM must say something the definition
 * does not. THIS SCRIPT CANNOT CHECK THAT, and it must not be read as though it
 * could. A glossary gloss scores 0 here and is still a defect -- ISMS-F's
 * `security-control` read "a measure that modifies risk" and scored 0 on every
 * seed and every threshold.
 *
 * What this measures is reproduction of INDEXED ENGLISH EDITIONS. See the
 * coverage gaps printed at the top of every report: they are the point.
 *
 * ============ THE ANTI-GLOSS RULE CANNOT BE SATISFIED IN SIX WORDS ==========
 *
 * You cannot state what a definition omits in less space than the definition.
 * That is why these descriptions run 160-258 characters where ISMS-F's run 28
 * to 131, and it is the reason rather than an excuse: the terse house style is
 * what produced 14 tier-A gloss candidates in ISMS-F alone.
 *
 * ============ EXEMPTIONS ARE NAMED, JUSTIFIED AND CAPPED ============
 *
 * An exemption records a REASON, not a suppression. Each carries a ceiling, so
 * a future edit cannot smuggle a longer reproduction in under a slug that was
 * exempted for four words. An exempt row is still printed with its score.
 */
import { readFileSync, existsSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, pdftotextAvailable, expectedWords, verifyCorpus, MANIFEST } from "./lib/citation-index.mjs";

const KNOWN = new Set(["--file", "--cert"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ".");
    console.error("This script is READ-ONLY. It has no --apply and no --dry. Known: --file, --cert.");
    process.exit(2);
  }
}
const argOf = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};

/* ======================= THE EXEMPTION REGISTRY =======================
 *
 * Keyed by slug. `maxRun` is a CEILING, not a waiver: the row is exempt up to
 * that run length and fails above it. `why` is the justification, and it is
 * printed every run so nobody inherits an exemption without its argument.
 *
 * RESTRUCTURING CONTENT TO SATISFY AN INSTRUMENT IS BACKWARDS. Where a
 * description is worse for scoring lower, the instrument yields and records
 * why -- which is the opposite of quietly editing the content until the number
 * comes down, and leaves the decision visible to the next reader.
 */
const TITLE_CLASS = "A TITLE, NOT ITS TEXT. The name of a standard or of a control is catalogue metadata -- it appears in ISO free previews, in every catalogue entry and in any bibliography -- so naming one reproduces nothing that defines it. Same distinction that lets a description name clause titles: a certification cannot teach a control set without saying what the controls are called.";

const EXEMPTIONS = {
  "clauses-four-to-ten": {
    cert: "AIMS-F", maxRun: 8,
    why: "The seven clause titles ARE the concept. A standard's clause titles are its table of contents -- published in ISO's free online preview and in every catalogue entry -- so they are address labels rather than expression. Paraphrasing them would leave a learner unable to match the description to the headings they will actually meet.",
  },
  "ai-partner-role": {
    cert: "AIMS-F", maxRun: 6,
    why: "Four words naming a role category: system integrators and data providers. The category names are the taxonomy the standard establishes and an auditor will use; rewording them would make the description worse at the one job it has.",
  },
  /* ---- TITLE CLASS. A name is catalogue metadata, not the text it labels. ----
   * A standard title and a control title appear in ISO free previews, in every
   * catalogue entry and in any bibliography. Naming one reproduces nothing that
   * DEFINES it -- the same distinction that lets a description name clause
   * titles. A certification cannot teach a control set without saying what the
   * controls are called. */
  "iso-27005-risk": { cert: "ISMS-F", maxRun: 8, why: TITLE_CLASS + " The run IS the title of ISO/IEC 27005." },
  "iso-27002-controls": { cert: "ISMS-F", maxRun: 6, why: TITLE_CLASS + " The run is how ISO/IEC 27002 names what it provides." },
  "iso-42005-impact-assessment": { cert: "AIGRM-I", maxRun: 6, why: TITLE_CLASS + " The run is the subject of ISO/IEC 42005." },
  "cryptographic-controls": { cert: "ISMS-F", maxRun: 6, why: TITLE_CLASS + " The run is the ISO/IEC 27002 control title for cryptography." },
  "supplier-controls": { cert: "ISMS-F", maxRun: 7, why: TITLE_CLASS + " The run is the ISO/IEC 27002 control-theme name for supplier relationships." },
};

/* ============ COVERAGE IS THE INSTRUMENT; THE RUN FLOOR IS NOISE ============
 *
 * MIN_RUN was 6 and is now 4, measured 2026-09-21. The floor of 6 let
 * ISMS-F `risk-identification` through at COVERAGE 1.00 -- "finding,
 * recognizing and describing risks" is five words and all five are present
 * verbatim in an indexed standard. The ENTIRE description is a reproduction,
 * and the gate said nothing because 5 < 6.
 *
 * That is disqualifying for a floor. A threshold that lets a complete
 * reproduction pass because the thing reproduced is short is the scale defect
 * this whole instrument was built to escape, reintroduced one level down.
 *
 * Coverage is what carries the judgement: a run that is most of the text is
 * the text. The run floor exists only to stop a four-word commonplace in a
 * six-word description reading as a finding, and 4 is where it stops being
 * noise rather than where it starts being evidence.
 */
const MIN_RUN = 4, MIN_COV = 0.60, SEED = 4;

/* ------------------------------------------------------------- the index */

if (!pdftotextAvailable()) { console.error("pdftotext is not on PATH."); process.exit(2); }
for (const [k, p] of Object.entries(PDFS)) if (!existsSync(p)) { console.error("MISSING " + k + " at " + p); process.exit(2); }

const norm = (s) => String(s || "").toLowerCase()
  .replace(/[‘’]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
const W = (s) => norm(s).split(" ").filter(Boolean);

const perSource = new Map();
for (const p of Object.values(PDFS)) {
  const o = join(mkdtempSync(join(tmpdir(), "iso-")), "t.txt");
  execFileSync("pdftotext", ["-layout", p, o]);
  const w = W(readFileSync(o, "utf8"));
  const key = Object.entries(PDFS).find(([, v]) => v === p)[0];
  if (w.length !== expectedWords(key)) {
    console.error(key + " extracted " + w.length + " words, manifest says " + expectedWords(key) + ". Refusing.");
    process.exit(1);
  }
  const set = new Set();
  for (let i = 0; i + SEED <= w.length; i++) set.add(w.slice(i, i + SEED).join(" "));
  perSource.set(key, set);
}

/* PER SOURCE. A combined gram set chains a run across two documents through a
 * junction present in neither, which inflates the length into a property of the
 * index rather than of any standard. Measured on the lesson corpus 2026-09-21:
 * four of eight refused groups held no contiguous match in any one standard. */
function score(t) {
  const w = W(t);
  let best = 0, bestText = "", src = "";
  for (const [key, set] of perSource) {
    for (let i = 0; i + SEED <= w.length; i++) {
      if (!set.has(w.slice(i, i + SEED).join(" "))) continue;
      let n = SEED;
      while (i + n + 1 <= w.length && set.has(w.slice(i + n + 1 - SEED, i + n + 1).join(" "))) n++;
      if (n > best) { best = n; bestText = w.slice(i, i + n).join(" "); src = key; }
      i += n - 1;
    }
  }
  return { run: best, tot: w.length, cov: w.length ? best / w.length : 0, hit: bestText, src };
}

/* POSITIVE CONTROL. A known reproduction must fire, or the index is empty and
 * every clean verdict below is worthless. */
const CANARY = "the organization shall determine external and internal issues that are relevant to its purpose";
const cs = score(CANARY);
if (!(cs.run >= MIN_RUN && cs.cov >= MIN_COV)) {
  console.error("POSITIVE CONTROL FAILED: the 27001 clause 4.1 canary scored " + cs.run + "w/" + cs.cov.toFixed(2) + ".");
  console.error("The index is empty or broken. A clean report would mean nothing.");
  process.exit(1);
}

/* ------------------------------------------------------------- the batch */

const HERE = dirname(fileURLToPath(import.meta.url));
for (const p of [join(HERE, ".env"), join(HERE, "..", ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };
const get = async (p) => {
  let last;
  for (let i = 0; i < 10; i++) {
    try {
      const r = await fetch(BASE + "/" + p, { headers: H, signal: AbortSignal.timeout(60000) });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    } catch (e) { last = e; }
  }
  throw new Error(p + ": " + last?.message);
};

const CERT = argOf("cert", "AIMS-F");
const FILE = argOf("file", join(HERE, "..", "AIMS-F-CONCEPT-DESCRIPTIONS.json"));
const batch = JSON.parse(readFileSync(FILE, "utf8"));
const rows = batch.rows.map(([task, slug, name, term, desc]) => ({ task, slug, name, term, desc }));

console.log("");
console.log("INDEX -- " + Object.keys(PDFS).join(", "));
console.log("COVERAGE GAPS -- reproductions of these are UNREACHABLE at any threshold:");
console.log("  ISO/IEC 27000   delegated to by 27001:2022 cl.3 (undated reference)   NOT ON DISK");
console.log("  ISO/IEC 22989   delegated to by 42001:2023 cl.3                       NOT ON DISK");
console.log("  every non-English edition  -- this index is MONOLINGUAL, so a Spanish or");
console.log("  Portuguese rendering of a defined term scores 0 and always has");
console.log("  near-wording from OTHER EDITIONS of an indexed standard is also out of reach");
console.log("");

/* ============ COMPLETENESS, BOTH DIRECTIONS, BEFORE ANY VERDICT ============
 *
 * A batch that silently omits a concept reports a clean run on the rows it
 * happens to contain. Assert the slug sets are EQUAL, not that the batch is
 * non-empty -- a per-subject count says nothing about which subjects. */
const cert = (await get("certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error(CERT + " not found"); process.exit(2); }
const live = (await get("concepts?select=slug,retired_at&certification_id=eq." + cert.id + "&limit=1000"))
  .filter((c) => c.retired_at === null).map((c) => c.slug);
const liveSet = new Set(live), batchSet = new Set(rows.map((r) => r.slug));
const missing = live.filter((s) => !batchSet.has(s));
const extra = [...batchSet].filter((s) => !liveSet.has(s));
const dup = rows.length - batchSet.size;

console.log("COMPLETENESS");
console.log("  live concepts   " + live.length);
console.log("  batch rows      " + rows.length + (dup ? "   " + dup + " DUPLICATE slug(s)" : ""));
console.log("  missing         " + missing.length + (missing.length ? "   " + missing.slice(0, 8).join(", ") : ""));
console.log("  not live        " + extra.length + (extra.length ? "   " + extra.slice(0, 8).join(", ") : ""));
if (missing.length || extra.length || dup) {
  console.error("");
  console.error("BATCH IS NOT THE CORPUS. Refusing to report a verdict on a partial set.");
  process.exit(1);
}

/* ---------------------------------------------------------------- scoring */

const bad = [], exempt = [], fired = [];
let maxRun = 0, minLen = 1e9, maxLenc = 0;
for (const r of rows) {
  r.s = score(r.desc);
  maxRun = Math.max(maxRun, r.s.run);
  minLen = Math.min(minLen, r.desc.length);
  maxLenc = Math.max(maxLenc, r.desc.length);
  if (!/^[\x20-\x7e]*$/.test(r.desc) || !/^[\x20-\x7e]*$/.test(r.name)) bad.push(r);
  const hits = r.s.run >= MIN_RUN && r.s.cov >= MIN_COV;
  const ex = EXEMPTIONS[r.slug];
  if (hits && ex && r.s.run <= ex.maxRun) exempt.push(r);
  else if (hits) fired.push(r);
}

console.log("");
console.log("GATE  seed " + SEED + ", refuse when run >= " + MIN_RUN + " AND coverage >= " + MIN_COV.toFixed(2));
console.log("  positive control   " + cs.run + "w/" + cs.cov.toFixed(2) + "  (27001 cl.4.1 canary fires as it must)");
console.log("  longest run in batch   " + maxRun + "w");
console.log("  description length     " + minLen + "-" + maxLenc + " chars");
console.log("  non-ascii rows         " + bad.length);
console.log("  FIRES                  " + fired.length);
console.log("  exempt (named below)   " + exempt.length);

/* Exemptions are PRINTED WITH THEIR REASON on every run. An exemption nobody
 * re-reads is a suppression with extra steps. */
for (const r of exempt) {
  const ex = EXEMPTIONS[r.slug];
  console.log("");
  console.log("  EXEMPT  " + r.slug + "   " + r.s.run + "w/" + r.s.tot + " cov " + r.s.cov.toFixed(2) + "   ceiling " + ex.maxRun + "w");
  console.log("     matched: \"" + r.s.hit + "\"");
  console.log("     why: " + ex.why);
}
for (const r of fired) {
  console.log("");
  console.log("  FIRES   " + r.slug + "   " + r.s.run + "w/" + r.s.tot + " cov " + r.s.cov.toFixed(2));
  console.log("     matched: \"" + r.s.hit + "\"");
  console.log("     " + r.desc);
}
for (const r of bad) console.log("  NON-ASCII  " + r.slug);

/* ============ DORMANT IS NOT STALE, AND THE DIFFERENCE MATTERS ============
 *
 * STALE   the slug is not in the batch at all. The entry protects nothing.
 * DORMANT the row IS in the batch and does not currently fire. The policy
 *         stands and would become load-bearing if the threshold tightened, so
 *         the reasoning is kept and printed -- but nobody should believe the
 *         exemption is doing work today.
 *
 * Conflating them either deletes a recorded decision or lets a dead entry look
 * like an active waiver. Measured on this script's first run: BOTH registry
 * entries are DORMANT, because those two rows pass on COVERAGE (0.25 and 0.16
 * against a 0.60 floor) rather than on run length. The exemptions were written
 * for a refusal that never happened, and saying so is the honest report.
 */
for (const slug of Object.keys(EXEMPTIONS)) {
  const r = rows.find((x) => x.slug === slug);
  if (!r) {
    /* AN ENTRY FOR ANOTHER CERTIFICATION IS NOT STALE. The registry is
     * corpus-wide and this gate runs one batch at a time; reporting the five
     * ISMS-F and AIGRM-I entries as stale while gating AIMS-F would invite
     * someone to delete five live exemptions -- a guard that cries wolf gets
     * loosened, and its loosening takes the real assertion with it. Only an
     * entry owned by the certification under test can be stale. */
    if (EXEMPTIONS[slug].cert && EXEMPTIONS[slug].cert !== CERT) {
      console.log("  elsewhere         " + slug + "  (owned by " + EXEMPTIONS[slug].cert + ", not under test in this batch)");
    } else {
      console.log("  STALE EXEMPTION   " + slug + " is not in this batch. Remove it.");
    }
    continue;
  }
  if (!(r.s.run >= MIN_RUN && r.s.cov >= MIN_COV)) {
    console.log("");
    console.log("  DORMANT EXEMPTION  " + slug + "   scores " + r.s.run + "w/" + r.s.tot + " cov " + r.s.cov.toFixed(2)
      + ", under the " + MIN_COV.toFixed(2) + " floor, so the gate does not refuse it");
    console.log("     matched: \"" + r.s.hit + "\"");
    console.log("     policy kept: " + EXEMPTIONS[slug].why);
  }
}

console.log("");
const defined = rows.filter((r) => r.term !== "no").length;
console.log("DEFINED TERMS  " + defined + " of " + rows.length + " name a term defined in an indexed or delegated standard.");
console.log("  Those are the rows where the anti-gloss rule does the work the gate cannot.");
console.log("  NOTHING HERE CHECKS THAT RULE. It is a human read, and this script says so");
console.log("  rather than letting a clean score be mistaken for a clean batch.");

console.log("");
console.log(fired.length || bad.length ? "NOT CLEAR." : "Clear on the gate. The anti-gloss judgement is still outstanding.");
process.exitCode = fired.length || bad.length ? 1 : 0;
