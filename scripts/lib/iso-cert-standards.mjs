/**
 * iso-cert-standards.mjs -- which published standards each ISO certification is examined against.
 *
 * ============ ONE HOME, BECAUSE TWO INSTRUMENTS READ IT ============
 *
 * `draft-iso-task-sources.mjs` ranks candidates within these standards, and `judge-task-sources2.mjs`
 * builds its complete title list from them. The judge used to read the list out of the ranker's
 * ARTIFACT, which coupled two instruments that share nothing else -- and the coupling bit
 * immediately: widening AIMS-F's pool made the ranker fail its own exemplars and refuse to write, so
 * the judge silently kept running against the OLD scope from the stale artifact.
 *
 * A list two programs need is a module, not a field in one program's output.
 *
 * ============ AIMS-F IS WIDER THAN ITS OWN STANDARD, AND THAT IS THE POINT ============
 *
 * AIMS-F was held at ISO/IEC 42001 alone for months. Task 5.5 is *"describe the certification route
 * and what ISO/IEC 42006 governs"*, and 24 of its reviewed primaries are ISO/IEC 17021-1 and
 * ISO/IEC 42006 addresses. Scoped to 42001 those cannot be proposed however good the judgment is,
 * and they scored as misses against the judgment rather than as a gap in this list.
 *
 * A certification's source set is what it EXAMINES, not the standard it is named after.
 */
export const CERT_STANDARDS = {
  "AIMS-F":  ["ISO/IEC 42001", "ISO/IEC 42006", "ISO/IEC 17021-1"],
  "AIMS-IA": ["ISO/IEC 42001", "ISO 19011", "ISO/IEC 22989", "ISO/IEC 42006"],
  "ISMS-F":  ["ISO/IEC 27001", "ISO/IEC 27002", "ISO/IEC 27000", "ISO/IEC 17021-1"],
  "ISMS-IA": ["ISO/IEC 27001", "ISO 19011", "ISO/IEC 27002", "ISO/IEC 27000"],
};

/** Throws rather than returning undefined: an unknown certification is a typo, not an empty pool. */
export function standardsFor(code) {
  const s = CERT_STANDARDS[code];
  if (!s) {
    throw new Error("no source list declared for " + JSON.stringify(code) +
      ". Known: " + Object.keys(CERT_STANDARDS).join(", "));
  }
  return s.slice();
}
