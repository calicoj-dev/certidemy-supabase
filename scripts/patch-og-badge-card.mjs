/**
 * patch-og-badge-card.mjs  (v3)
 *
 * Rewrites the credential-og card design: the badge, centered, on white.
 *
 * ============================== WHY ==============================
 *
 * The v2 card is a two-column layout in Certidemy's palette -- dark ground,
 * accent rail, holder name, cert name, issued/expires, credential code, our
 * domain. It is a good card and it does not scale.
 *
 * Partner issuers are coming. A partner's badge rendered inside Certidemy's
 * chrome misattributes it at the exact moment it is most visible, and the only
 * ways out are worse: a per-issuer template system, a palette field, a font
 * decision per tenant, and a review process for all of it.
 *
 * Badge-on-white makes the artifact the ISSUER'S. The rule stated to a partner
 * is one sentence -- "upload a 512x512 PNG; we center it on white" -- and there
 * is no mechanism by which their card can come to look like ours.
 *
 * The og:title already carries what the image gave up. It reads
 * "<Cert> (<CODE>) was issued by Certidemy to <Holder>." -- holder, credential
 * and issuer, in text, which is also where a screen reader finds it.
 *
 * NO KEYLINE, NO CARD FRAME. Considered and rejected: a border would define the
 * card's edge against LinkedIn's white feed, but the intent is that the badge
 * appears to float, not that a card contains it. A rectangle drawn around a
 * shaped emblem fights the emblem.
 *
 * ============================== WHAT IS KEPT, AND WHY ========================
 *
 * THE SPECIMEN BAND SURVIVES. v4.5 s3 recorded specimens rendering identically
 * to real credentials as a live fraud vector, and reading is_specimen is why
 * this function exists in its current form. A pure badge card would reopen it:
 * a demonstration credential would share exactly like a real one, and a machine
 * cannot see the amber banner a human sees on the verify page.
 *
 * So: badge on white is the card for an ACTIVE credential. Any other state adds
 * a status band. Revoked matters for the same reason -- someone whose credential
 * was withdrawn should not keep sharing a card that looks intact.
 *
 * ============================== CACHE INVALIDATION ==========================
 *
 * OG_RENDERER_VERSION 2 -> 3, and BOTH callers must move with it or the
 * redesign ships and no crawler ever sees it. The file's own header says so.
 *
 * Found while patching: the ?cert= caller in
 * app/[locale]/(marketing)/certifications/[code]/page.tsx SENDS NO &v= AT ALL.
 * Certification cards have therefore never had a cache-buster, and bumping the
 * version would invalidate credential cards while leaving every certification
 * card serving the old design from LinkedIn's cache for a week. The web-side
 * patch adds it.
 *
 * ============================== TWO FAILURES OF THIS PATCH ===================
 *
 * v1 aborted at edit 6: the anchor matched twice. Not a file problem -- the
 * inserted statusBand() body contained the same two lines the next anchor
 * targeted, so edit 5 created the second match itself. Measured: exactly one
 * occurrence in the original file, at line 222.
 *
 *   RULE: an anchor must be unique in the file AS IT WILL BE WHEN THAT EDIT
 *   RUNS, not as it is on disk. Inserted code is part of the file for every
 *   subsequent anchor.
 *
 * v2 would not parse: a JSDoc comment inside a replacement string used
 * backticks to quote two identifier names, and the replacement string is itself
 * a template literal. The first backtick closed it. Nothing was written.
 *
 *   RULE: no backticks anywhere inside a replacement, including in comments.
 *   Quote identifiers with single quotes in prose.
 *
 * credential-og/index.ts is LF (measured 543/543). Written LF.
 *
 * Usage:  node scripts/patch-og-badge-card.mjs --dry
 *         node scripts/patch-og-badge-card.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry");
const PATH = "functions/credential-og/index.ts";

let src = readFileSync(PATH, "utf8");
const before = src.length;

const cr = (src.match(/\r\n/g) || []).length;
const lf = (src.match(/\n/g) || []).length;
console.log(`  ${PATH}  ${cr > 0 ? "CRLF" : "LF"}  (${cr} CRLF / ${lf} LF)`);
if (cr > 0) {
  console.error("ABORT  expected LF; line endings changed under us");
  process.exit(3);
}

const EDITS = [
  {
    name: "bump renderer version",
    find: `const OG_RENDERER_VERSION = 2;`,
    replace: `// v3: the badge, centered, on white. See patch-og-badge-card.mjs for why.
// BUMP THIS AND BOTH CALLERS TOGETHER:
//   app/[locale]/verify/[id]/page.tsx                        (credential cards)
//   app/[locale]/(marketing)/certifications/[code]/page.tsx  (cert cards)
const OG_RENDERER_VERSION = 3;`,
  },
  {
    name: "palette gains card surface",
    find: `const INK = {
  bg: "#0c0a0f",`,
    replace: `const INK = {
  // v3 card surface. The badge is the subject, so the ground gets out of its
  // way -- and a partner's badge is not framed in our brand.
  card: "#ffffff",
  // Retained for the generic fallback card, which is OURS and stays branded.
  bg: "#0c0a0f",`,
  },
  {
    name: "geometry constants",
    find: `const COL_X = 580;          // right column left edge
const COL_W = 540;          // right column usable width
const BADGE_X = 92;
const BADGE_Y = 100;
const BADGE_S = 400;`,
    replace: `/* v3 geometry. The badge is square and the canvas is 1200x630, so the badge is
   sized off the SHORT axis and centered on both. 470 leaves ~80px of air top and
   bottom, which stops it reading as a cropped image at feed-thumbnail size.

   When a status band is present the badge shifts up by half the band height, so
   the composition stays balanced instead of the badge sitting dead-centre with a
   bar hanging under it. */
const CARD_W = 1200;
const CARD_H = 630;
const BADGE_S = 470;
const BAND_H = 64;

/* v2 two-column geometry, still used by the retained legacy builders below. */
const COL_X = 580;
const COL_W = 540;
const BADGE_X = 92;
const BADGE_Y = 100;
const BADGE_S_V2 = 400;`,
  },
  {
    name: "insert statusBand + v3 builder, rename v2 builder",
    find: `function buildSvg(c: CardData): string {`,
    replace: `/**
 * Status band, or empty string for an active credential.
 *
 * ACTIVE RENDERS NOTHING. A band reading "ACTIVE" is noise on the common case
 * and trains a reader to ignore the band, which is the one thing it must not do.
 * The band appears only when the credential is NOT simply valid, so its presence
 * is itself the signal.
 *
 * Text is auto-fitted, not fixed. A size chosen against the English string
 * overflows in pt-BR, which is longer -- the trap the holder name hit in v2.
 *
 * The local names here deliberately avoid 't' and 'isSpec': those appear in the
 * retained v2 builder below, and a patch anchor targeting that body must not
 * also match this one.
 */
function statusBand(card: CardData): string {
  if (card.state === "active") return "";
  const dict = T[card.lang];
  const specimen = card.state === "specimen";
  const label = specimen
    ? dict.specimen
    : card.state === "revoked"
      ? dict.revoked
      : dict.expired;
  const bg = specimen ? INK.warn : card.state === "revoked" ? INK.bad : INK.mute;
  const fg = specimen ? INK.warnInk : INK.white;
  const y = CARD_H - BAND_H;
  const size = fitSize(label, CARD_W - 80, 26, 14, 0.62);
  return SVG_BAND(y, bg, fg, size, esc(label));
}

/* Assembled in a helper so the SVG fragment is built with ordinary string
   concatenation. Kept out of the builder body for readability only. */
function SVG_BAND(
  y: number,
  bg: string,
  fg: string,
  size: number,
  label: string,
): string {
  return (
    '<rect x="0" y="' + y + '" width="' + CARD_W + '" height="' + BAND_H +
    '" fill="' + bg + '"/>' +
    '<text x="' + CARD_W / 2 + '" y="' + (y + BAND_H / 2 + size * 0.36) +
    '" text-anchor="middle" font-family="Inter" font-weight="700" font-size="' +
    size + '" letter-spacing="2" fill="' + fg + '">' + label + '</text>'
  );
}

/**
 * A badge centred on white, and nothing else.
 *
 * Everything v2 drew in text -- holder, certification, issued, expires, the
 * credential code, our domain -- is gone from the IMAGE and lives in og:title
 * and og:description, which crawlers read and screen readers reach.
 *
 * No badge on file is not an error. certification_code may be new, or a partner
 * may not have uploaded one. The card falls back to the certification code set
 * large: plain, but not broken -- and a broken link preview is worse than a
 * plain one.
 */
function buildSvg(card: CardData): string {
  const band = statusBand(card);
  const badge = badgeDataUri(card.certCode);
  const shift = band ? -BAND_H / 2 : 0;
  const bx = (CARD_W - BADGE_S) / 2;
  const by = (CARD_H - BADGE_S) / 2 + shift;

  const art = badge
    ? '<image x="' + bx + '" y="' + by + '" width="' + BADGE_S + '" height="' +
      BADGE_S + '" href="' + badge + '" preserveAspectRatio="xMidYMid meet"/>'
    : '<text x="' + CARD_W / 2 + '" y="' + (CARD_H / 2 + shift + 24) +
      '" text-anchor="middle" font-family="Inter" font-weight="700" ' +
      'font-size="72" letter-spacing="4" fill="' + INK.accent + '">' +
      esc(card.certCode) + '</text>';

  return (
    '<svg width="' + CARD_W + '" height="' + CARD_H + '" viewBox="0 0 ' +
    CARD_W + ' ' + CARD_H + '" xmlns="http://www.w3.org/2000/svg" ' +
    'xmlns:xlink="http://www.w3.org/1999/xlink">' +
    '<rect width="' + CARD_W + '" height="' + CARD_H + '" fill="' + INK.card + '"/>' +
    art + band +
    '</svg>'
  );
}

/* v2's two-column card, retained UNREFERENCED so the reasoning in its comments
   is not lost from the file. Delete it once v3 has been through a LinkedIn Post
   Inspector pass on a real credential, a specimen and a revoked one. */
function buildSvgV2Legacy(c: CardData): string {`,
  },
  {
    name: "v2 builder uses its own badge size",
    find: `    ? \`<image x="\${BADGE_X}" y="\${BADGE_Y}" width="\${BADGE_S}" height="\${BADGE_S}" href="\${badge}" preserveAspectRatio="xMidYMid meet"/>\``,
    replace: `    ? \`<image x="\${BADGE_X}" y="\${BADGE_Y}" width="\${BADGE_S_V2}" height="\${BADGE_S_V2}" href="\${badge}" preserveAspectRatio="xMidYMid meet"/>\``,
  },
  {
    name: "certification card",
    find: `function buildCertSvg(code: string, name: string): string {
  const badge = badgeDataUri(code);`,
    replace: `function buildCertSvg(code: string, name: string): string {
  // Same rule as the credential card: one visual standard, one thing to state to
  // a partner. No band -- a certification has no holder and no status. The name
  // parameter is unused now and kept so the caller does not change.
  void name;
  const emblem = badgeDataUri(code);
  const ex = (CARD_W - BADGE_S) / 2;
  const ey = (CARD_H - BADGE_S) / 2;
  const art = emblem
    ? '<image x="' + ex + '" y="' + ey + '" width="' + BADGE_S + '" height="' +
      BADGE_S + '" href="' + emblem + '" preserveAspectRatio="xMidYMid meet"/>'
    : '<text x="' + CARD_W / 2 + '" y="' + (CARD_H / 2 + 24) +
      '" text-anchor="middle" font-family="Inter" font-weight="700" ' +
      'font-size="72" letter-spacing="4" fill="' + INK.accent + '">' +
      esc(code) + '</text>';
  return (
    '<svg width="' + CARD_W + '" height="' + CARD_H + '" viewBox="0 0 ' +
    CARD_W + ' ' + CARD_H + '" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="' + CARD_W + '" height="' + CARD_H + '" fill="' + INK.card + '"/>' +
    art +
    '</svg>'
  );
}

/* v2 certification card, retained unreferenced alongside buildSvgV2Legacy. */
function buildCertSvgV2Legacy(code: string, name: string): string {
  const badge = badgeDataUri(code);`,
  },
];

for (const e of EDITS) {
  const n = src.split(e.find).length - 1;
  if (n !== 1) {
    console.error(`ABORT  "${e.name}": matched ${n}, expected 1`);
    process.exit(3);
  }
  src = src.replace(e.find, e.replace);
  console.log(`  ok   ${e.name}`);
}

const CHECKS = [
  ["OG_RENDERER_VERSION = 3", true],
  ["OG_RENDERER_VERSION = 2;", false],
  ['card: "#ffffff"', true],
  ["function statusBand", true],
  ["function SVG_BAND", true],
  ["function buildSvgV2Legacy", true],
  ["function buildCertSvgV2Legacy", true],
  ["BADGE_S_V2", true],
];
for (const [needle, want] of CHECKS) {
  const has = src.includes(needle);
  if (has !== want) {
    console.error(`ABORT  post-check: ${JSON.stringify(needle)} present=${has}, want=${want}`);
    process.exit(3);
  }
}
for (const fn of ["function buildSvg(", "function buildCertSvg("]) {
  const n = src.split(fn).length - 1;
  if (n !== 1) {
    console.error(`ABORT  post-check: "${fn}" declared ${n} times, expected 1`);
    process.exit(3);
  }
}
if ((src.match(/\r\n/g) || []).length !== 0) {
  console.error("ABORT  post-check: CRLF appeared in an LF file");
  process.exit(3);
}

console.log(`\n  ${before} -> ${src.length} bytes`);

if (DRY) {
  console.log("\nDRY RUN -- nothing written");
  process.exit(2);
}

writeFileSync(PATH, src, "utf8");
console.log("\nwritten " + PATH);
