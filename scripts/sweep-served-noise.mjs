#!/usr/bin/env node
/**
 * sweep-served-noise.mjs -- does extraction noise already reach candidates?
 *
 * READ-ONLY. No writes beyond two local artifacts, no model calls, unknown flags exit 2. Ruled PROMPT-88 s0.
 *
 * ============ WHY THIS IS THE ONE SWEEP THAT MATTERS FOR A CANDIDATE ============
 *
 * Anchors are internal. Stems, options and PRACTICE explanations are served. So this asks the only
 * candidate-facing version of the question: has noise already reached the bank?
 *
 * A SECURE explanation is examined as internal and reported separately, because migration 378 revokes
 * `explanation` from anon and authenticated and records that every secure row is unreachable. Same text,
 * two severities, decided by one column -- so the column is read, never assumed.
 *
 * Every language is swept, not just English: a translated stem is served too, and a translation is produced
 * from the English, so noise carried into a translation is noise served three times.
 *
 * The count is not believed until members are read: 10 per signature are printed.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { noiseIn, servedFields, NOISE } from "./lib/quote-noise.mjs";

for (const a of process.argv.slice(2)) {
  console.error("Unrecognised flag: " + a + ". READ-ONLY, takes none.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KEY = requireKey(HERE);
const certs = await getAll(KEY, "certifications?select=id,code&order=code");

const SIGS = NOISE.map(([n]) => n);
const perCert = [];
const hits = [];        /* served-field hits: the candidate-facing finding */
const internalHits = [];/* secure explanations: internal, reported apart */
let examinedRows = 0, examinedSpans = 0;

/* one request per certification: 28k rows in one read is a timeout waiting to happen, and a per-cert
 * loop also means a failure names which certification it failed on */
for (const c of certs) {
  const rows = await getAll(KEY, "quiz_questions?select=id,language,question_text,options,explanation," +
    "pool,status,visibility,retired_at&certification_id=eq." + c.id + "&order=id");
  const rec = { cert: c.code, rows: rows.length, spans: 0, rowsWithHit: 0, internalRows: 0 };
  for (const n of SIGS) rec[n] = 0;
  for (const r of rows) {
    examinedRows++;
    const spans = servedFields(r, { pool: r.pool });
    rec.spans += spans.length;
    examinedSpans += spans.length;
    let hitHere = false;
    for (const s of spans) {
      for (const n of noiseIn(s.text)) {
        rec[n.name] = (rec[n.name] || 0) + 1;
        hitHere = true;
        hits.push({ cert: c.code, id: String(r.id).slice(0, 8), lang: r.language, pool: r.pool,
          status: r.status, field: s.what, signature: n.name, matched: n.matched,
          sample: String(s.text).slice(Math.max(0, n.at - 40), n.at + 70).replace(/\s+/g, " ") });
      }
    }
    if (hitHere) rec.rowsWithHit++;
    /* the internal half: a SECURE explanation is not served, and is reported apart rather than ignored */
    if (String(r.pool) === "secure" && r.explanation) {
      const ns = noiseIn(r.explanation);
      if (ns.length) {
        rec.internalRows++;
        internalHits.push({ cert: c.code, id: String(r.id).slice(0, 8), lang: r.language,
          signature: ns[0].name, matched: ns[0].matched });
      }
    }
  }
  perCert.push(rec);
  console.log("  " + c.code.padEnd(10) + String(rows.length).padStart(5) + " rows, " +
    String(rec.spans).padStart(6) + " served spans, " + String(rec.rowsWithHit).padStart(4) +
    " row(s) with a served hit" + (rec.internalRows ? ", " + rec.internalRows + " secure explanation(s)" : ""));
}

const md = [];
const p = (s = "") => md.push(s);
p("# Has extraction noise already reached candidates?");
p("");
p("**Read-only.** Ruled PROMPT-88 s0. Served fields only: stems, options, and PRACTICE explanations.");
p("A secure explanation is not served (migration 378) and is reported separately as internal.");
p("");
p("Every language is swept: a translated stem is served too, and noise carried into a translation is");
p("served three times.");
p("");
p("| certification | rows | served spans | rows with a served hit | " + SIGS.join(" | ") + " |");
p("|---|---|---|---|" + SIGS.map(() => "---|").join(""));
for (const r of perCert) {
  p("| " + r.cert + " | " + r.rows + " | " + r.spans + " | **" + r.rowsWithHit + "** | " +
    SIGS.map((n) => r[n] || 0).join(" | ") + " |");
}
const tot = { rows: examinedRows, spans: examinedSpans, rowsWithHit: perCert.reduce((s, r) => s + r.rowsWithHit, 0) };
for (const n of SIGS) tot[n] = perCert.reduce((s, r) => s + (r[n] || 0), 0);
p("| **all** | **" + tot.rows + "** | **" + tot.spans + "** | **" + tot.rowsWithHit + "** | " +
  SIGS.map((n) => "**" + tot[n] + "**").join(" | ") + " |");
p("");
p("**" + tot.rowsWithHit + " of " + tot.rows + " rows carry noise in a served field.**");
p("");
for (const n of SIGS) {
  const mine = hits.filter((h) => h.signature === n);
  p("## `" + n + "` in a served field -- " + mine.length + " hit(s), first 10");
  p("");
  if (!mine.length) { p("_none_"); p(""); continue; }
  for (const h of mine.slice(0, 10)) {
    p("- **" + h.cert + "** `" + h.id + "` " + h.lang + " " + h.pool + "/" + h.status + " · " + h.field +
      " · matched " + JSON.stringify(h.matched) + " -- ..." + h.sample + "...");
  }
  p("");
}
p("## Internal: secure explanations carrying noise (not served)");
p("");
p(internalHits.length + " row(s). Reported apart because a secure explanation is unreachable to a");
p("candidate; it still corrupts the audit trail and any text gate that reads it.");
p("");
for (const h of internalHits.slice(0, 10)) {
  p("- **" + h.cert + "** `" + h.id + "` " + h.lang + " · " + h.signature + " · " + JSON.stringify(h.matched));
}
p("");
writeFileSync(join(ROOT, "SERVED-NOISE-SWEEP.md"), md.join("\n") + "\n", "utf8");
writeFileSync(join(ROOT, "SERVED-NOISE-SWEEP.json"), JSON.stringify({
  signatures: SIGS, per_cert: perCert, totals: tot,
  served_hits: hits, internal_secure_explanation_hits: internalHits,
}, null, 1) + String.fromCharCode(10), "utf8");
console.log("");
console.log("rows examined      " + examinedRows);
console.log("served spans       " + examinedSpans);
console.log("rows with a hit    " + tot.rowsWithHit);
for (const n of SIGS) console.log("  " + n.padEnd(14) + tot[n]);
console.log("secure explanations carrying noise (internal): " + internalHits.length);
console.log("wrote SERVED-NOISE-SWEEP.md and .json");
