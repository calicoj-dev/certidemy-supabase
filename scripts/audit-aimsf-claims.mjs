#!/usr/bin/env node
/**
 * audit-aimsf-claims.mjs - every checkable claim in the 154 AIMS-F concept
 * descriptions, verified against the indexed PDFs BEFORE migration 363 lands.
 *
 * READ-ONLY. Fixes nothing. Unknown flags exit 2.
 *
 * ============ WHY THIS EXISTS ============
 *
 * The 154 were written from AIMS-F's own lessons, deliberately, because drawing
 * from the standard is what the leak gate exists to prevent. Then two of those
 * lessons turned out to credit a 17-word ISO/IEC 27000 sentence to ISO
 * 19011:2026, which contains neither half of it -- with all three standards on
 * disk and a citation checker green the whole time, because the checker
 * verified that the ADDRESS existed and never compared the content at it.
 *
 * POSSESSION IS NOT VERIFICATION. Descriptions written from those lessons can
 * have inherited the same class of error, so every claim is checked before the
 * migration runs rather than after.
 *
 * ============ FOUR OUTCOMES, AND NOT-HELD IS ONE OF THEM ============
 *
 *   OK            the address exists and the content corresponds
 *   FAIL          checked and wrong
 *   UNVERIFIABLE  the standard is not on disk, or is a preview
 *   READ          mechanically ambiguous; a human decides
 *
 * A claim about a standard we do not hold is never OK. ISO/IEC 42006 is a
 * PREVIEW -- cover, scope and contents -- so a claim about what it governs is
 * checkable against a contents page and nothing more.
 *
 * ============ THIS SCRIPT'S OWN EXTRACTOR WAS WRONG TWICE ============
 *
 * FIRST it read the TABLE OF CONTENTS. A heading regex anchored on the address
 * matched the contents entry, which comes first, and produced twenty false
 * READs against correct descriptions -- clause 10.1 reported as lacking
 * "suitability, adequacy and effectiveness" when the body clause contains all
 * three. Believed, it would have sent someone to "fix" twenty accurate rows.
 *
 * THEN the fix was applied through a shell heredoc, which COLLAPSED EVERY
 * DOUBLE BACKSLASH: a tab class reached the file as a literal tab and the
 * non-space class as a bare S. Every address then reported NOT FOUND -- 28
 * failures, none of them about content. A transport corrupted the check, which
 * is the mojibake and truncated-paste family from CLAUDE.md pointed at code
 * instead of at SQL.
 *
 * So the parsing here uses NO REGEX ESCAPES AT ALL: line scanning with
 * trimStart() and startsWith() cannot be mangled in transit. The two
 * discriminators are properties of the contents page rather than guesses --
 * a contents line carries DOT LEADERS, and the body heading is the LAST
 * occurrence of the address.
 */
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, pdftotextAvailable, expectedWords, verifyCorpus } from "./lib/citation-index.mjs";

for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) { console.error("Unrecognised flag: " + a + ". READ-ONLY, no flags."); process.exit(2); }
}
if (!pdftotextAvailable()) { console.error("pdftotext is not on PATH."); process.exit(2); }
const corrupt = verifyCorpus();
if (corrupt.length) { console.error("CORPUS CONTROL FAILED:\n  " + corrupt.join("\n  ")); process.exit(1); }

const NL = String.fromCharCode(10);
const norm = (s) => String(s || "").toLowerCase()
  .replace(/[‘’]/g, "'").replace(/[–—]/g, "-")
  .replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();

function pdfText(p) {
  const o = join(mkdtempSync(join(tmpdir(), "ac-")), "t.txt");
  execFileSync("pdftotext", ["-layout", p, o]);
  return readFileSync(o, "utf8").split("\r").join("");
}

const RAW = new Map(), FLAT = new Map();
for (const [key, p] of Object.entries(PDFS)) {
  const t = pdfText(p);
  if (norm(t).split(" ").filter(Boolean).length !== expectedWords(key)) {
    console.error(key + " extraction disagrees with the manifest. Refusing."); process.exit(1);
  }
  RAW.set(key, t);
  FLAT.set(key, " " + norm(t) + " ");
}
const has = (key, phrase) => FLAT.get(key).includes(" " + norm(phrase));

/** Body text at a clause address. No regex escapes; see the header. */
function clauseText(key, addr) {
  const lines = RAW.get(key).split(NL);
  let at = -1;
  for (let i = 0; i < lines.length; i++) {
    /* ============ A HEADING NEED NOT HAVE A SPACE AFTER ITS NUMBER =======
     * ISO/IEC 27001:2022 extracts as "4.1Understanding the organization" --
     * no space -- behind a wide licence-watermark column. Requiring "4.1 "
     * made clauseText return NULL for every clause of that document, and the
     * audit check that consumed it passed on an EMPTY STRING: "27001 clause
     * 4.1 does not mention roles" was a vacuous OK. A check that asks nothing
     * cannot fail. Accept a space OR an immediate capital, and reject a digit
     * or dot so 9.2 does not swallow 9.21. */
    const t = lines[i].trim();
    if (!t.startsWith(addr)) continue;
    const c = t[addr.length];
    if (c === undefined) continue;
    if ((c >= "0" && c <= "9") || c === ".") continue;
    if (!(c === " " || (c >= "A" && c <= "Z"))) continue;
    if (t.includes("....")) continue;
    at = i;
  }
  if (at < 0) return null;
  const depth = addr.split(".").length;
  const out = [lines[at]];
  for (let i = at + 1; i < lines.length && out.length < 140; i++) {
    /* ============ THE STOP CONDITION HAD THE SAME BLIND SPOT ============
     * It took split(" ")[0] as the heading number, which for 27001s
     * "4.2Understanding..." is the whole phrase and therefore not numeric --
     * so the extractor never stopped, ran 140 lines past the clause, and swept
     * clause 5 into clause 4.1. That is how "27001 clause 4.1 mentions role"
     * came out of a clause whose body contains no such word. Scan the leading
     * digits and dots directly instead of trusting a space to be there. */
    const t = lines[i].trim();
    let hl = 0;
    while (hl < t.length && ((t[hl] >= "0" && t[hl] <= "9") || t[hl] === ".")) hl++;
    const head = t.slice(0, hl);
    /* The char after the number must be a CAPITAL, whether or not a space
     * intervenes. Allowing a bare space broke on page furniture like
     * "10            (c) ISO/IEC 2023" -- a page number read as clause 10,
     * which truncated 6.2 to one item and cut role out of 4.1. */
    let k = hl;
    while (k < t.length && t[k] === " ") k++;
    const nx = t[k];
    const numeric = hl > 0 && head !== ".";
    const nextOk = nx !== undefined && nx >= "A" && nx <= "Z";
    if (numeric && nextOk && head.replace(/.$/, "").split(".").length <= depth && !t.includes("....")) break;
    out.push(lines[i]);
  }
  return out.join(NL);
}

/** ISO uses lettered items and dash bullets interchangeably. */
function itemCount(text) {
  if (!text) return 0;
  let n = 0;
  for (const raw of String(text).split(NL)) {
    const t = raw.trimStart();
    if (t.length >= 2 && t[0] >= "a" && t[0] <= "z" && t[1] === ")") n++;
    else if (t.startsWith("-- ")) n++;
  }
  return n;
}

/** Lettered items only, for clauses that carry a lettered and a dash list. */
function letterCount(text) {
  if (!text) return 0;
  let n = 0;
  for (const raw of String(text).split(NL)) {
    const t = raw.trimStart();
    if (t.length >= 2 && t[0] >= "a" && t[0] <= "z" && t[1] === ")") n++;
  }
  return n;
}

/** Every Annex A id token in the document, scanned without regex escapes. */
function annexIds(key) {
  const out = new Set();
  const raw = RAW.get(key);
  const isAlnum = (c) => (c >= "0" && c <= "9") || (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === ".";
  for (let i = 0; i + 3 < raw.length; i++) {
    if (raw[i] !== "A" || raw[i + 1] !== ".") continue;
    if (i > 0 && isAlnum(raw[i - 1])) continue;
    let j = i + 2, tok = "A.", dots = 0, digits = 0;
    while (j < raw.length) {
      const c = raw[j];
      if (c >= "0" && c <= "9") { tok += c; digits++; j++; continue; }
      if (c === "." && digits > 0 && j + 1 < raw.length && raw[j + 1] >= "0" && raw[j + 1] <= "9") {
        tok += c; dots++; digits = 0; j++; continue;
      }
      break;
    }
    if (dots >= 1 && digits > 0) out.add(tok);
  }
  return [...out];
}

const R = [];
const add = (slug, claim, verdict, evidence) => R.push({ slug, claim, verdict, evidence });

/* ============ SELF-TEST. The parser must find what is known to be there. ==
 * Every count below depends on these three. If the parser is broken the report
 * is a list of false failures against correct content, which is exactly what
 * the first two versions of this script produced. */
const selfTest = [
  ["clause 5.1 body is found", (clauseText("42001:2023", "5.1") || "").includes("Top management shall demonstrate")],
  ["clause 10.1 body is found", (clauseText("42001:2023", "10.1") || "").toLowerCase().includes("continual improvement")],
  ["Annex A ids are parsed", annexIds("42001:2023").length > 20],
];
const stFail = selfTest.filter((t) => !t[1]);
if (stFail.length) {
  console.error("");
  console.error("PARSER SELF-TEST FAILED -- refusing to report:");
  for (const [name] of stFail) console.error("  " + name);
  console.error("An over-firing extractor turns correct content into a failure report.");
  process.exit(1);
}

/* =================== CLAUSE ADDRESS + WHAT IT CARRIES =================== */

const CLAUSES = [
  ["role-determination-requirement", "4.1", "the organization determines its roles", ["role"]],
  ["scope-boundary-decision", "4.3", "determining the scope", ["scope"]],
  ["top-management-commitment", "5.1", "leadership and commitment", ["leadership", "commitment"]],
  ["conformance-authority", "5.3", "roles, responsibilities and authorities", ["authorit", "conform"]],
  ["ai-risk-criteria", "6.1.1", "AI risk criteria", ["criteria"]],
  ["ai-risk-assessment", "6.1.2", "AI risk assessment process", ["risk assessment", "consequence"]],
  ["ai-risk-treatment", "6.1.3", "AI risk treatment", ["treatment", "statement of applicability"]],
  ["treatment-options", "6.1.3", "treatment options are selected", ["option"]],
  ["ai-system-impact-assessment", "6.1.4", "AI system impact assessment", ["impact"]],
  ["impact-feeds-risk", "6.1.4", "impact results feed the risk assessment", ["risk assessment"]],
  ["ai-objectives", "6.2", "AI objectives and planning to achieve them", ["objective", "measurable", "monitored"]],
  ["planning-of-changes", "6.3", "planning of changes", ["change"]],
  ["competence-does-not-carry", "7.2", "competence", ["competence"]],
  ["awareness-requirement", "7.3", "awareness", ["aware"]],
  ["communication-planning", "7.4", "communication", ["communicat"]],
  ["documented-information", "7.5.1", "documented information", ["documented information"]],
  ["operational-planning-and-control", "8.1", "operational planning and control", ["process", "control"]],
  ["clause-eight-operation", "8.2", "AI risk assessment is performed", ["risk assessment"]],
  ["treatment-plan", "8.3", "treatment implemented and effectiveness verified", ["treatment"]],
  ["ai-system-impact-assessment-84", "8.4", "impact assessment performed at planned intervals", ["impact"]],
  ["monitoring-and-measurement", "9.1", "monitoring, measurement, analysis and evaluation", ["monitor", "measure"]],
  ["management-system-certification-basis", "9.2", "internal audit", ["internal audit"]],
  ["organizational-context", "9.3", "management review", ["management review"]],
  ["review-inputs", "9.3.2", "management review inputs", ["input"]],
  ["review-results", "9.3.3", "management review results", ["result"]],
  ["continual-improvement", "10.1", "continual improvement of suitability, adequacy, effectiveness",
    ["continual improvement", "suitab", "adequa", "effective"]],
  ["nonconformity", "10.2", "nonconformity and corrective action", ["nonconformity", "corrective action"]],
];
/* ============ AN EMPTY EXTRACTION IS A FAILURE, NOT A PASS ============
 *
 * ISO/IEC 27001:2022 extracts as "4.1Understanding the organization" -- no
 * space after the number, behind a licence-watermark column -- so clauseText
 * returned NULL for every clause of that document and the check consuming it
 * scored OK against an empty string. "27001 clause 4.1 does not mention roles"
 * passed because it asked nothing.
 *
 * So every content check now asserts its extraction is non-empty BEFORE
 * evaluating it, and reports EMPTY EXTRACTION as its own verdict. A check that
 * cannot see its subject must never report on it. */
function evaluated(slug, claim, key, addr, fn) {
  const t = addr ? clauseText(key, addr) : RAW.get(key);
  if (t === null || t === undefined) {
    add(slug, claim, "EMPTY EXTRACTION", "clauseText(" + key + ", " + addr + ") returned null -- nothing was examined");
    return null;
  }
  if (String(t).trim().length === 0) {
    add(slug, claim, "EMPTY EXTRACTION", "extraction is empty -- nothing was examined");
    return null;
  }
  return fn(t);
}

for (const [slug, addr, what, terms] of CLAUSES) {
  const t = clauseText("42001:2023", addr);
  if (!t) { add(slug, "42001 clause " + addr + " = " + what, "FAIL", "address NOT FOUND in 42001:2023"); continue; }
  if (!t.trim()) { add(slug, "42001 clause " + addr + " = " + what, "EMPTY EXTRACTION", "nothing was examined"); continue; }
  const flat = " " + norm(t) + " ";
  const missing = terms.filter((x) => !flat.includes(norm(x)));
  add(slug, "42001 clause " + addr + " = " + what, missing.length ? "READ" : "OK",
    missing.length ? "address exists; clause text lacks: " + missing.join(", ")
      : "address exists and carries: " + terms.join(", "));
}

add("climate-change-relevance", "determining whether climate change is a relevant issue is a shall",
  has("42001:2023", "climate change") || has("27001:2022/Amd1", "climate change") ? "OK" : "FAIL",
  "42001 mentions climate change: " + has("42001:2023", "climate change")
    + "; 27001 Amd 1 (the climate action amendment) mentions it: " + has("27001:2022/Amd1", "climate change"));

/* ============================== COUNTS ============================== */

const allIds = annexIds("42001:2023");
const ctrlIds = allIds.filter((id) => !allIds.some((o) => o !== id && o.startsWith(id + ".")));
const cats = [...new Set(ctrlIds.map((x) => x.split(".").slice(0, 2).join(".")))]
  .sort((a, b) => Number(a.split(".")[1]) - Number(b.split(".")[1]));

add("control-count", "Annex A holds 38 controls", ctrlIds.length === 38 ? "OK" : "READ",
  "parsed " + ctrlIds.length + " controls; an id that is a strict prefix of another is a header, not a control");
add("annex-a-structure", "nine categories numbered A.2 to A.10",
  cats.length === 9 && cats[0] === "A.2" && cats[cats.length - 1] === "A.10" ? "OK" : "READ",
  "categories: " + cats.join(", "));
add("annex-a-structure", "A.1 is the annex general clause, not a control group",
  cats.includes("A.1") ? "FAIL" : "OK",
  cats.includes("A.1") ? "A.1 appears as a control category" : "no A.1 control category; numbering starts at A.2");
add("control-count", "A.6 subdivides into A.6.1 and A.6.2, so nine categories carry ten objectives",
  allIds.includes("A.6.1") && allIds.includes("A.6.2") ? "OK" : "READ",
  "A.6.1 " + (allIds.includes("A.6.1") ? "present" : "ABSENT") + ", A.6.2 " + (allIds.includes("A.6.2") ? "present" : "ABSENT"));
add("control-count", "the life cycle category holds nine controls across its two subdivisions",
  ctrlIds.filter((x) => x.startsWith("A.6.")).length === 9 ? "OK" : "READ",
  "A.6 controls parsed: " + ctrlIds.filter((x) => x.startsWith("A.6.")).length);

for (const [slug, cat, n] of [["policy-controls", "A.2", 3], ["internal-organization-controls", "A.3", 2],
  ["resource-controls", "A.4", 5], ["impact-assessment-controls", "A.5", 4],
  ["life-cycle-stage-controls", "A.6.2", 7], ["data-controls", "A.7", 5],
  ["use-of-ai-controls", "A.9", 3], ["third-party-controls", "A.10", 3]]) {
  const got = ctrlIds.filter((x) => x.startsWith(cat + ".")).length;
  add(slug, cat + " holds " + n + " controls", got === n ? "OK" : "READ", "parsed " + got);
}

for (const [slug, addr, n, what] of [
  ["top-management-commitment", "5.1", 8, "demonstrations of leadership"],
  ["conformance-authority", "5.3", 2, "named assignments"],
  ["ai-objectives", "6.2", 7, "properties of an AI objective"],
  ["awareness-requirement", "7.3", 3, "awareness items"],
  ["communication-planning", "7.4", 4, "communication decisions"],
  ["monitoring-and-measurement", "9.1", 4, "determinations"],
  ["review-inputs", "9.3.2", 5, "management review inputs"],
]) {
  const body = clauseText("42001:2023", addr);
  /* 6.2 carries TWO lists: a)-g) are the objective properties, and a dash list
   * is the separate planning determination. Summing them reported 12 against a
   * claimed 7 and the description was right about both -- count them apart. */
  const got = addr === "6.2" ? letterCount(body) : itemCount(body);
  add(slug, "clause " + addr + " lists " + n + " " + what, got === n ? "OK" : "READ",
    "items parsed in " + addr + ": " + got);
}

const ROLES = ["ai provider", "ai producer", "ai customer", "ai partner", "ai subject", "relevant authorit"];
add("ai-producer-role", "six role categories",
  ROLES.every((r) => FLAT.get("42001:2023").includes(norm(r))) ? "OK" : "READ",
  "42001 names: " + ROLES.filter((r) => FLAT.get("42001:2023").includes(norm(r))).join(", "));

/* ========================= ANNEX STATUS ========================= */
for (const [slug, claim, letter, want] of [
  ["annex-a-structure", "Annex A is normative", "A", "normative"],
  ["annex-b-normative", "Annex B is normative", "B", "normative"],
  ["annex-b-normative", "Annex C is informative", "C", "informative"],
  ["sector-application-annex-d", "Annex D is informative", "D", "informative"],
]) {
  /* THE STATUS MARKER IS ON THE LINE AFTER THE HEADING, not beside it:
   *   Annex A
   *   (normative)
   * A neighbourhood window that stopped at the newline reported Annex C as
   * stating neither, when the very next line says (informative). */
  const lines = RAW.get("42001:2023").split(NL);
  let status = null;
  for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].trim() !== "Annex " + letter) continue;
    const nxt = lines[i + 1].trim().toLowerCase();
    if (nxt === "(normative)") status = "normative";
    else if (nxt === "(informative)") status = "informative";
  }
  add(slug, claim, status === want ? "OK" : status ? "FAIL" : "READ",
    status ? "the heading declares (" + status + ")" : "no status line found under the Annex " + letter + " heading");
}

/* ============ NEGATIVES. One occurrence disproves the claim. ============ */
for (const [slug, claim, key, phrase] of [
  ["pdca-cycle", "42001 never uses the phrase plan-do-check-act", "42001:2023", "plan do check act"],
  ["pdca-cycle", "42001 never uses PDCA", "42001:2023", "pdca"],
  ["management-system-standard", "42001 mandates no fairness metric", "42001:2023", "fairness metric"],
  ["management-system-certification-basis", "42001 does not describe surveillance audits", "42001:2023", "surveillance audit"],
  ["management-system-certification-basis", "42001 does not describe a stage 1 audit", "42001:2023", "stage 1"],
  ["planned-intervals", "42001 names no frequency for planned intervals", "42001:2023", "at least annually"],
  ["aims-vs-model-assurance", "42001 specifies no model architecture", "42001:2023", "model architecture"],
]) {
  const found = has(key, phrase);
  add(slug, claim, found ? "FAIL" : "OK",
    found ? "DISPROVED: the phrase occurs in " + key : "no occurrence of that phrase in " + key);
}

/* THE CLAIM THAT WAS SCORED ON AN EMPTY STRING. It now goes through
 * evaluated(), so a null extraction is EMPTY EXTRACTION rather than OK. */
evaluated("role-determination-requirement", "role determination has no counterpart in ISO/IEC 27001",
  "27001:2022", "4.1", (t) => {
    const hit = t.toLowerCase().includes("role");
    add("role-determination-requirement", "role determination has no counterpart in ISO/IEC 27001",
      hit ? "READ" : "OK",
      (hit ? "27001 clause 4.1 mentions role -- read it" : "27001 clause 4.1 does not mention roles")
        + "  [extraction " + t.trim().length + " chars, non-empty]");
  });
add("iso-42001-27001-integration", "the AI system impact assessment has no 27001 counterpart",
  has("27001:2022", "impact assessment") ? "READ" : "OK",
  has("27001:2022", "impact assessment") ? "27001 contains the phrase impact assessment -- read it"
    : "27001 does not contain the phrase impact assessment");

/* ===================== CROSS-STANDARD ===================== */
const PREVIEW = "PREVIEW ONLY -- cover, scope and contents of a SINGAPORE STANDARD adoption "
  + "(SS ISO/IEC 42006:2025, IDT). The scope page names the subject; nothing about its requirements is checkable here.";
for (const [slug, claim, why] of [
  ["management-system-certification-basis", "ISO/IEC 42006 governs the bodies that certify an AIMS", PREVIEW],
  ["auditor-competence-limit", "ISO/IEC 42006 sets competence requirements for certification bodies", PREVIEW],
  ["iso-42006-role", "42006 sets competence, impartiality and audit-time requirements", PREVIEW],
  ["management-system-certification-basis", "ISO/IEC 17021-1 carries the two-stage audit and surveillance cycle", "ISO/IEC 17021-1 is not on disk"],
  ["surveillance-and-recertification", "surveillance and recertification come from ISO/IEC 17021-1", "ISO/IEC 17021-1 is not on disk"],
  ["stage-one-stage-two", "stage 1 examines design, stage 2 examines operation", "ISO/IEC 17021-1 is not on disk"],
  ["life-cycle-stages", "ISO/IEC 5338 offers a life cycle process model", "ISO/IEC 5338 is not on disk"],
  ["harmonised-structure", "the harmonised structure is shared with ISO 9001", "ISO 9001 is not on disk"],
  ["nist-ai-rmf-relationship", "NIST AI RMF describes role types across the life cycle", "the NIST AI RMF is not on disk"],
  ["eu-ai-act-overview", "the EU AI Act is risk-tiered, extraterritorial by market placement and phased", "not a standard; no corpus here"],
  ["eu-ai-act-overview", "its timetable has already been amended once", "not a standard; no corpus here"],
  ["aims-vs-ethics-framework", "ISO/IEC 23894 gives AI risk management guidance", "ISO/IEC 23894 is not on disk"],
  ["accreditation-vs-certification", "management system certification is not personnel certification", "ISO/IEC 17024 is not on disk"],
]) add(slug, claim, "UNVERIFIABLE", why);

/* WHETHER 42001 CITES THEM is a different claim, and it IS checkable. */
for (const [slug, token, label] of [
  ["life-cycle-stages", "5338", "ISO/IEC 5338"],
  ["life-cycle-stages", "22989", "ISO/IEC 22989"],
  ["nist-ai-rmf-relationship", "nist", "the NIST AI RMF"],
  ["aims-vs-ethics-framework", "23894", "ISO/IEC 23894"],
  ["sector-application-annex-d", "27001", "ISO/IEC 27001"],
]) {
  const found = FLAT.get("42001:2023").includes(norm(token));
  add(slug, "42001 itself references " + label, found ? "OK" : "FAIL",
    found ? "42001 mentions " + label : "42001 does NOT mention " + label);
}

add("management-system-certification-basis", "42001 itself references ISO/IEC 42006",
  FLAT.get("42001:2023").includes("42006") ? "READ" : "UNVERIFIABLE",
  FLAT.get("42001:2023").includes("42006") ? "42001 mentions 42006 -- read it"
    : "confirmed: 42001 never mentions 42006, so every 42006 claim is uncorroborated from both sides");

/* ============================== REPORT ============================== */
const order = { FAIL: 0, "EMPTY EXTRACTION": 1, READ: 2, UNVERIFIABLE: 3, OK: 4 };
R.sort((a, b) => order[a.verdict] - order[b.verdict] || a.slug.localeCompare(b.slug));
const tally = R.reduce((m, r) => ((m[r.verdict] = (m[r.verdict] || 0) + 1), m), {});
console.log("");
console.log("AUDIT OF THE 154 -- " + R.length + " checkable claims");
console.log("  OK " + (tally.OK || 0) + "   FAIL " + (tally.FAIL || 0)
  + "   EMPTY " + (tally["EMPTY EXTRACTION"] || 0)
  + "   READ " + (tally.READ || 0) + "   UNVERIFIABLE " + (tally.UNVERIFIABLE || 0));
let cur = "";
for (const r of R) {
  if (r.verdict !== cur) { cur = r.verdict; console.log(""); console.log("===== " + cur); }
  console.log("  " + r.slug.padEnd(38) + r.claim);
  console.log("      " + r.evidence);
}
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "AIMSF-CLAIM-AUDIT.json"),
  JSON.stringify({ measured: "2026-09-21", tally, claims: R }, null, 2), "utf8");
console.log("");
console.log("wrote AIMSF-CLAIM-AUDIT.json");
