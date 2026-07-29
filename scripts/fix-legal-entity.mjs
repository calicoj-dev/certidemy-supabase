/**
 * fix-legal-entity.mjs — fill every placeholder in lib/legal/content.ts.
 *
 * FACTS (supplied, transcribed)
 *   Legal entity      : RC Capital Partners LLC
 *   Registered in     : State of New Jersey, United States
 *   Postal address    : 210 Westervelt Ave, North Plainfield, NJ 07060, United States
 *   Brands            : Certidemy and CertiGlobal are both brands of that company
 *   Contact           : info@certidemy.com (replaces info@certiglobal.org)
 *   Payment processing: Shopify, with Stripe for card processing
 *   Email             : Google
 *
 * ESTABLISHED BY INSPECTION
 *   Analytics         : none. A sweep for gtag, Google Tag Manager, Plausible,
 *                       PostHog, Mixpanel, Hotjar, Segment and the Facebook
 *                       pixel returned only unrelated `segment` variables. The
 *                       cookie clause is therefore a statement of fact - only
 *                       necessary cookies run - and no consent banner is owed.
 *   Article 27 rep    : the drafting note was a standalone paragraph, the second
 *                       body string of the controller section. Removing it
 *                       leaves that section complete. It applies only where a
 *                       company offers services to EEA/UK data subjects;
 *                       accessibility is not targeting, and this business
 *                       operates in English, LATAM Spanish and Brazilian
 *                       Portuguese.
 *
 * DRAFTED, NOT TRANSCRIBED - READ THESE TWO
 *
 * Everything above is a fact someone supplied or that inspection settled. The
 * refund clause and the courts clause are different: they are legal positions
 * written here because the document cannot ship with a bracket, and they are
 * conventional rather than authoritative.
 *
 *   Refunds - refundable within 14 days if the voucher is unredeemed;
 *   non-refundable once redeemed, on the reasoning that redemption is the point
 *   at which the examination has been made available. Statutory withdrawal
 *   rights preserved.
 *
 *   Courts - exclusive jurisdiction of New Jersey state and federal courts,
 *   with a carve-out preserving mandatory consumer protections in the user's
 *   country of habitual residence. That carve-out is not politeness: without
 *   it, a clause forcing a Colombian or Brazilian consumer to litigate in New
 *   Jersey is likely unenforceable in their own courts, and asserting it reads
 *   worse than not.
 *
 * The script stamps a comment into content.ts recording that both are
 * unreviewed, so nobody inherits them assuming counsel signed off.
 *
 * ORDER MATTERS. Long specific phrases first, so later general sweeps cannot
 * eat a fragment of one and leave the rest.
 *
 * THE FILE USES \u ESCAPES for typographic quotes and em-dashes, so the patterns
 * here carry literal backslash-u sequences. A pattern written with the real
 * characters would silently match nothing.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:DRY_RUN="1"; node scripts\fix-legal-entity.mjs
 *   Remove-Item Env:\DRY_RUN; node scripts\fix-legal-entity.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SRC = "C:/Users/Juan/Documents/certidemy/certidemy-web/lib/legal/content.ts";
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

const ENTITY = "RC Capital Partners LLC";
const ADDRESS = "210 Westervelt Ave, North Plainfield, NJ 07060, United States";
const BRAND_LINE = " Certidemy and CertiGlobal are brands operated by " + ENTITY + ".";

/* Literal \u escapes as they appear in the file, not the characters. */
const LQ = "\\u201c";
const RQ = "\\u201d";
const EMDASH = "\\u2014";

const REVIEW_STAMP = `

/* ---------------------------------------------------------------------------
 * TWO CLAUSES BELOW ARE UNREVIEWED DRAFTS, filled 2026-07-29 so the documents
 * could ship without brackets. Both are conventional; neither has been read by
 * counsel.
 *
 *   Terms §5  - refunds. Refundable within 14 days while the voucher is
 *               unredeemed; non-refundable after redemption.
 *   Terms §12 - governing law and courts. New Jersey, with a mandatory-consumer
 *               -protection carve-out for users outside the United States.
 *
 * Everything else in this file is transcribed fact: entity, address,
 * jurisdiction of registration, processors, contact. Analytics cookies are
 * stated as absent because a codebase sweep found no analytics of any kind.
 * ------------------------------------------------------------------------- */`;

/**
 * [label, from, to, mode]
 *   mode "one"  - must match exactly once
 *   mode "all"  - replace every occurrence, must match at least once
 *   mode "opt"  - replace every occurrence, zero is acceptable
 */
const EDITS = [
  [
    "privacy intro - operator, registration, address",
    "operated by CertiGlobal [FULL LEGAL ENTITY NAME], a company [registered in / with its principal place of business at [ADDRESS]] (the " + LQ + "Company" + RQ + ")",
    "operated by " + ENTITY + ", a limited liability company registered in the State of New Jersey, United States, with its principal place of business at " + ADDRESS + " (the " + LQ + "Company" + RQ + ")",
    "one",
  ],
  [
    "privacy - controller, brands, and removal of the Article 27 note",
    '"The data controller responsible for your personal data is CertiGlobal [FULL LEGAL ENTITY NAME], contactable at info@certiglobal.org.",\n        "[If the Company offers services to individuals in the European Economic Area (EEA) or United Kingdom and is required to appoint a representative under Article 27 GDPR, name that representative here.]",',
    '"The data controller responsible for your personal data is ' + ENTITY + ", contactable at info@certidemy.com." + BRAND_LINE + '",',
    "one",
  ],
  [
    "terms intro - operator + brands",
    "operated by CertiGlobal [FULL LEGAL ENTITY NAME] (" + LQ + "Certidemy" + RQ + ", " + LQ + "we" + RQ + ", " + LQ + "us" + RQ + ", or " + LQ + "our" + RQ + ").",
    "operated by " + ENTITY + " (" + LQ + "Certidemy" + RQ + ", " + LQ + "we" + RQ + ", " + LQ + "us" + RQ + ", or " + LQ + "our" + RQ + ")." + BRAND_LINE,
    "one",
  ],
  [
    "cookies - no analytics run",
    " [If analytics or non-essential cookies are used, describe them here and provide a consent mechanism where required.]",
    " We do not use analytics, advertising, or other non-essential cookies.",
    "one",
  ],
  [
    "refunds (DRAFT)",
    "[Insert your refund policy here " + EMDASH + " for example, whether and when purchases or exam attempts are refundable, and any statutory withdrawal rights for consumers in applicable jurisdictions such as the EU right of withdrawal.]",
    "Examination vouchers may be refunded within 14 days of purchase provided the voucher has not been redeemed. Once a voucher is redeemed, the examination has been made available to you and the purchase is non-refundable. Nothing in this section limits any statutory right of withdrawal or cancellation you may have as a consumer under the law of your country of residence.",
    "one",
  ],
  [
    "courts and consumer carve-out (DRAFT)",
    "[Specify the courts or dispute-resolution mechanism that will have jurisdiction, and any consumer-protection carve-outs that preserve mandatory local rights for users in the EU, Colombia, Brazil, and elsewhere.]",
    "The parties submit to the exclusive jurisdiction of the state and federal courts located in the State of New Jersey, United States. Nothing in this section deprives you of the protection afforded by mandatory provisions of the law of your country of habitual residence.",
    "one",
  ],
  [
    "governing jurisdiction",
    "[GOVERNING JURISDICTION]",
    "the State of New Jersey, United States",
    "all",
  ],
  [
    "entity + postal address",
    "[FULL LEGAL ENTITY NAME AND POSTAL ADDRESS]",
    ENTITY + ", " + ADDRESS,
    "all",
  ],
  [
    "payment processor",
    "[PAYMENT PROCESSOR NAME]",
    "Shopify, which uses Stripe for card processing",
    "all",
  ],
  [
    "email provider",
    "[EMAIL PROVIDER NAME]",
    "Google",
    "all",
  ],
  [
    "any remaining entity placeholder",
    "[FULL LEGAL ENTITY NAME]",
    ENTITY,
    "opt",
  ],
  [
    "any remaining address placeholder",
    "[ADDRESS]",
    ADDRESS,
    "opt",
  ],
  [
    "contact email",
    "info@certiglobal.org",
    "info@certidemy.com",
    "all",
  ],
  [
    "last updated + review stamp",
    'const LAST_UPDATED = "2026-07-06";',
    'const LAST_UPDATED = "2026-07-29";' + REVIEW_STAMP,
    "one",
  ],
];

if (!existsSync(SRC)) {
  console.error(`content.ts not found at ${SRC}`);
  process.exit(1);
}

let text = readFileSync(SRC, "utf8");
const before = text.length;
let failed = 0;
let applied = 0;

console.log(`Legal entity fill ${DRY_RUN ? "[DRY RUN]" : "[LIVE]"}\n`);

for (const [label, from, to, mode] of EDITS) {
  const hits = text.split(from).length - 1;

  if (hits === 0 && mode !== "opt") {
    console.log(`  FAIL ${label}: not found`);
    console.log(`       looked for: ${from.slice(0, 120).replace(/\n/g, "\\n")}${from.length > 120 ? "..." : ""}`);
    failed++;
    continue;
  }
  if (hits > 1 && mode === "one") {
    console.log(`  FAIL ${label}: expected 1 occurrence, found ${hits}`);
    failed++;
    continue;
  }
  if (hits === 0) {
    console.log(`  --   ${label}: none present`);
    continue;
  }

  text = text.split(from).join(to);
  applied += hits;
  console.log(`  ok   ${label}${hits > 1 ? ` (${hits})` : ""}`);
}

console.log(`\nbytes ${before} -> ${text.length}`);

/* ---- residual audit ------------------------------------------------ */
//
// Strips block comments first. The file's own header contains the literal words
// "[BRACKETED PLACEHOLDER]" as an instruction, and reporting that as unfinished
// content would be exactly the kind of false positive that trains people to
// ignore the audit.

const body = text.replace(/\/\*[\s\S]*?\*\//g, "");

console.log("\n-- residual audit (comments excluded) --");
console.log(`CertiGlobal mentions : ${(body.match(/CertiGlobal/g) || []).length}   (2 expected - the brand sentences)`);
console.log(`certiglobal.org      : ${(body.match(/certiglobal\.org/g) || []).length}`);

const placeholders = [...new Set(body.match(/\[[^\]]{3,}\]/g) || [])];
console.log(`brackets remaining   : ${placeholders.length}`);
for (const p of placeholders) console.log(`   ${p.slice(0, 140)}${p.length > 140 ? "..." : ""}`);

if (failed > 0) {
  console.log(`\n${failed} edit(s) failed. Nothing written.`);
  process.exit(1);
}

if (!DRY_RUN) {
  writeFileSync(SRC, text, { encoding: "utf8" });
  console.log(`\nwritten. ${applied} replacement(s).`);
  console.log("Run `npm run build`, then read /en/terms and /en/privacy in the browser.");
  console.log("Read Terms sections 5 and 12 specifically - those are the drafted clauses.");
} else {
  console.log(`\n${applied} replacement(s) would be made.`);
}
