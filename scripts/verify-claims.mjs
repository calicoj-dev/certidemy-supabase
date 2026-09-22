#!/usr/bin/env node
/**
 * verify-claims.mjs - every claim a row makes, and what verified it.
 *
 * READ-ONLY. Fixes nothing. Exits non-zero if any claim fails or if any
 * positive control fails.
 *
 * ============ WHY NEGATIVE CLAIMS NEED A POSITIVE CONTROL ============
 *
 * A positive claim is verified by FINDING text. A negative claim -- "27001
 * does not say X" -- can only be verified by FAILING to find it, and failing
 * to find something is exactly what a broken search does. That is the
 * vacuous-pass shape this repository keeps paying for: an extractor that
 * returns nothing satisfies the check that consumed it.
 *
 * So every negative claim carries a POSITIVE CONTROL: a phrase from the same
 * document, ideally the same clause, that MUST be found. If the control fails,
 * the absence result is discarded rather than reported -- the search was
 * broken, and a broken search says nothing about the standard.
 *
 * ============ AND ABSENCE IS BOUNDED BY THE INDEX ============
 *
 * "Absent from the indexed standards" is not "absent from ISO". ISO/IEC 17021
 * is NOT on disk, and the phrase this file is most concerned with -- auditors
 * shall not audit their own work -- is 17021 language about CERTIFICATION
 * BODIES. Every negative verdict here states which documents it searched.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, MANIFEST } from "./lib/citation-index.mjs";
import { pdfText, clauseText, NL } from "./lib/iso-locator.mjs";

for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
}
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");

const norm = (s) => String(s || "").toLowerCase()
  .replace(/[‘’]/g, "'").replace(/[–—]/g, "-")
  .replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();

const RAW = new Map(), FLAT = new Map();
for (const [k, p] of Object.entries(PDFS)) {
  const t = pdfText(p);
  RAW.set(k, t);
  FLAT.set(k, " " + norm(t) + " ");
}
const has = (key, phrase) => FLAT.get(key).includes(" " + norm(phrase) + " ") ||
                             FLAT.get(key).includes(" " + norm(phrase));

/* ------------------------------------------------------------- the claims */
const CLAIMS = [
  {
    id: "auditor-objectivity-contradiction",
    row: "ISMS-F / auditor-objectivity",
    claim: "NEGATIVE: no indexed standard states that auditors may not audit their own work.",
    kind: "negative",
    sources: ["19011:2026", "27001:2022", "42001:2023", "27002:2022"],
    absent: ["audit their own work", "auditors shall not audit", "not audit their own",
             "shall not audit their own work", "auditing their own work"],
    /* The control must come from the SAME REGION the claim is about, or it
     * proves only that the file loaded. */
    control: { "19011:2026": "independent of the activity being audited",
               "27001:2022": "ensure objectivity and the impartiality of the audit process",
               "42001:2023": "internal audits at planned intervals",
               "27002:2022": "information security" },
  },
  {
    id: "objectivity-impartiality-9-2-2",
    row: "ISMS-F / auditor-objectivity (replacement basis)",
    claim: "POSITIVE: ISO/IEC 27001:2022 clause 9.2.2 requires the selection of auditors and conduct of audits to ensure objectivity and impartiality.",
    kind: "positive",
    sources: ["27001:2022"],
    present: ["select auditors and conduct audits that ensure objectivity and the impartiality of the audit process"],
  },
  {
    id: "policy-review-5-2",
    row: "AIMS-IA / aia-policy-review-a-2-4",
    claim: "NEGATIVE: ISO/IEC 42001:2023 clause 5.2 says nothing about reviewing the AI policy.",
    kind: "negative-clause-scoped",
    sources: ["42001:2023"],
    clause: "5.2",
    absent: ["reviewed at planned intervals", "shall be reviewed", "review the ai policy", "policy shall be reviewed"],
    control: { "42001:2023": "establish an ai policy" },
  },
  {
    id: "independence-no-prohibition-19011",
    row: "AIMS-IA / aia-independence-wherever-practicable",
    claim: "NEGATIVE: ISO 19011:2026 does not forbid auditing work one has contributed to.",
    kind: "negative",
    sources: ["19011:2026"],
    absent: ["shall not audit", "must not audit", "may not audit", "prohibited from auditing",
             "audit their own work", "auditing work they have"],
    control: { "19011:2026": "auditors should be independent of the activity being audited" },
  },
  {
    id: "independence-no-prohibition-42001-27001",
    row: "AIMS-IA and ISMS-IA independence rows",
    claim: "NEGATIVE: neither ISO/IEC 42001:2023 nor ISO/IEC 27001:2022 forbids auditing work one has contributed to.",
    kind: "negative",
    sources: ["42001:2023", "27001:2022"],
    absent: ["shall not audit", "must not audit", "may not audit", "audit their own work",
             "prohibited from auditing", "own work"],
    control: { "42001:2023": "internal audits at planned intervals",
               "27001:2022": "internal audits at planned intervals" },
  },
  {
    id: "programme-not-audit-9-2",
    row: "ISMS-IA / ia-audit-programme-3-5",
    claim: "POSITIVE: ISO/IEC 27001:2022 clause 9.2 requires an audit PROGRAMME, not a single audit.",
    kind: "positive",
    sources: ["27001:2022"],
    present: ["plan establish implement and maintain an audit programme"],
  },
];

/* --------------------------------------------------------------- evaluate */
const results = [];
let failures = 0, controlFailures = 0;

for (const c of CLAIMS) {
  const r = { id: c.id, row: c.row, claim: c.claim, kind: c.kind,
              searched: c.sources, index_note: "absence is bounded by the index below", evidence: [] };

  /* POSITIVE CONTROLS FIRST. If the search cannot find something known to be
   * present, nothing it fails to find means anything. */
  let controlsOk = true;
  if (c.control) {
    for (const [src, phrase] of Object.entries(c.control)) {
      if (!c.sources.includes(src)) continue;
      const found = c.kind === "negative-clause-scoped"
        ? norm(clauseText(RAW.get(src), c.clause) || "").includes(norm(phrase))
        : has(src, phrase);
      r.evidence.push({ control: true, source: src, phrase, found });
      if (!found) { controlsOk = false; controlFailures++; }
    }
  }

  if (!controlsOk) {
    r.verdict = "DISCARDED -- positive control failed, the search proves nothing";
    failures++;
    results.push(r);
    continue;
  }

  if (c.kind === "positive") {
    let all = true;
    for (const p of c.present) {
      const hits = c.sources.filter((s) => has(s, p));
      r.evidence.push({ phrase: p, found_in: hits });
      if (!hits.length) all = false;
    }
    r.verdict = all ? "VERIFIED" : "FAILED -- phrase not found";
    if (!all) failures++;
  } else {
    const hits = [];
    for (const p of c.absent) {
      for (const s of c.sources) {
        const found = c.kind === "negative-clause-scoped"
          ? norm(clauseText(RAW.get(s), c.clause) || "").includes(norm(p))
          : has(s, p);
        if (found) hits.push({ phrase: p, source: s });
      }
    }
    r.evidence.push({ searched_for_absence: c.absent, unexpectedly_found: hits });
    r.verdict = hits.length ? "FAILED -- the phrase IS present" : "VERIFIED ABSENT";
    if (hits.length) failures++;
  }
  results.push(r);
}

/* ----------------------------------------------------------------- report */
console.log("");
console.log("CLAIM VERIFICATION -- " + CLAIMS.length + " claims");
console.log("index: " + Object.keys(PDFS).join(", "));
console.log("NOT INDEXED, so nothing here can speak to it: ISO/IEC 17021, ISO/IEC 17024.");
console.log("");
for (const r of results) {
  console.log("== " + r.id + "   [" + r.row + "]");
  console.log("   " + r.claim);
  console.log("   searched: " + r.searched.join(", "));
  for (const e of r.evidence) {
    if (e.control) console.log("     control  " + (e.found ? "FOUND  " : "MISSING") + "  " + e.source + "  " + JSON.stringify(e.phrase));
  }
  for (const e of r.evidence) {
    if (e.found_in) console.log("     positive " + (e.found_in.length ? "FOUND in " + e.found_in.join(", ") : "NOT FOUND") + "  " + JSON.stringify(e.phrase));
    if (e.searched_for_absence) {
      console.log("     absence  " + e.searched_for_absence.length + " phrase(s) searched; " +
                  (e.unexpectedly_found.length ? "FOUND: " + JSON.stringify(e.unexpectedly_found) : "none present"));
    }
  }
  console.log("   VERDICT: " + r.verdict);
  console.log("");
}
console.log("controls failed: " + controlFailures + "   claims failed: " + failures);

writeFileSync(join(ROOT, "CLAIM-VERIFICATION.json"), JSON.stringify({
  measured: "2026-09-22",
  index: Object.keys(PDFS),
  not_indexed: ["ISO/IEC 17021", "ISO/IEC 17024"],
  coverage_gaps: MANIFEST.open_coverage_gaps,
  rule: "Every NEGATIVE claim carries a positive control from the same document, ideally the same clause. If the control fails the absence result is DISCARDED, because a search that cannot find what is there says nothing about what is not.",
  claims: results, control_failures: controlFailures, claim_failures: failures,
}, null, 2), "utf8");
console.log("wrote CLAIM-VERIFICATION.json");
if (controlFailures || failures) process.exit(1);
