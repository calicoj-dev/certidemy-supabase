/**
 * patch-render-asset-preview-url.mjs
 *
 * Adds `preview_url` alongside `url` on every generated asset: the same object,
 * signed WITHOUT a download disposition, so it can render inline in an iframe.
 *
 * ANCHOR NOTE - WHY THE FIRST ATTEMPT FOUND EACH ANCHOR TWICE
 *
 * `asset_type: "jta_sheet",` appears in the asset_downloads INSERT as well as in
 * the response object, at identical indentation. Anchoring on it alone matched
 * both. Each anchor now includes the preceding `filename:` line, which only ever
 * appears in the response.
 *
 * A lesson that generalises: a field name is rarely a unique anchor in a file
 * that both writes a log row and returns a payload describing the same thing.
 *
 * WHY A SECOND URL AND NOT THE SAME ONE
 *
 * createSignedUrl(..., { download: filename }) sets Content-Disposition:
 * attachment. A browser pointed at that URL downloads the file - so an iframe
 * using it triggers a download instead of displaying anything, which is exactly
 * what the preview exists to avoid.
 *
 * The download parameter is a query string and does not affect the signature, so
 * it COULD be stripped client-side. Rejected: that depends on an implementation
 * detail of Supabase's signing, and if it changed the preview would silently
 * start downloading files with nothing in any log. A second explicit signature
 * cannot rot.
 *
 * WHY THE PREVIEW IS EFFECTIVELY FREE
 *
 * The storage path is a content hash. A rep who previews a document and then
 * downloads it renders NOTHING the second time - both hit the same cached object.
 * Same for previewing the blueprint and the JTA to decide which to send: each
 * renders once, ever, until its underlying data changes.
 *
 * So previewing adds no render cost. It adds one signed-URL call, which is a
 * signature computation and no I/O.
 *
 * NOT INCLUDED: specimen_certificate. That branch delegates to
 * get-credential-certificate and returns whatever URL that function signs, so
 * the disposition is not ours to set here.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:DRY_RUN="1"; node scripts\patch-render-asset-preview-url.mjs
 *   Remove-Item Env:\DRY_RUN; node scripts\patch-render-asset-preview-url.mjs
 *
 * Deploy only AFTER the live run reports success.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SRC =
  "C:/Users/Juan/Documents/certidemy/supabase/functions/render-asset/index.ts";
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

/* ---- 1. the helper ---------------------------------------------------- */

const A1_FROM = [
  "/**",
  " * Largest-remainder allocation. VERBATIM PORT of gen-jta-doc.mjs, which itself",
].join("\n");

const A1_TO = [
  "/**",
  " * A second signature for the same object, WITHOUT a download disposition, so a",
  " * console preview can render it inline in an iframe.",
  " *",
  " * The download variant sets Content-Disposition: attachment, which makes a",
  " * browser save the file rather than display it. The download query parameter",
  " * does not affect the signature and could be stripped client-side instead, but",
  " * that relies on an implementation detail: if it changed, previews would",
  " * silently start downloading files with nothing in any log.",
  " *",
  " * Costs a signature computation and no I/O. The object is content-addressed and",
  " * already cached, so a preview followed by a download renders nothing twice.",
  " */",
  "async function signInline(",
  "  // deno-lint-ignore no-explicit-any",
  "  svc: any,",
  "  path: string,",
  "): Promise<string | null> {",
  "  const { data } = await svc.storage",
  "    .from(BUCKET)",
  "    .createSignedUrl(path, SIGNED_URL_TTL);",
  "  return data?.signedUrl ?? null;",
  "}",
  "",
  "/**",
  " * Largest-remainder allocation. VERBATIM PORT of gen-jta-doc.mjs, which itself",
].join("\n");

/* ---- 2..5. one field per asset branch --------------------------------
   Anchored on the filename line + asset_type, because asset_type alone also
   appears in each branch's asset_downloads insert. */

const A2_FROM = [
  "        filename: jtaFilename,",
  '        asset_type: "jta_sheet",',
].join("\n");
const A2_TO = [
  "        filename: jtaFilename,",
  "        preview_url: await signInline(svc, jtaPath),",
  '        asset_type: "jta_sheet",',
].join("\n");

const A3_FROM = [
  "        filename: bpFilename,",
  '        asset_type: "blueprint_sheet",',
].join("\n");
const A3_TO = [
  "        filename: bpFilename,",
  "        preview_url: await signInline(svc, bpPath),",
  '        asset_type: "blueprint_sheet",',
].join("\n");

const A4_FROM = [
  "        filename: briefFilename,",
  '        asset_type: "engine_brief",',
].join("\n");
const A4_TO = [
  "        filename: briefFilename,",
  "        preview_url: await signInline(svc, briefPath),",
  '        asset_type: "engine_brief",',
].join("\n");

const A5_FROM = ["      filename,", '      asset_type: "factsheet",'].join("\n");
const A5_TO = [
  "      filename,",
  "      preview_url: await signInline(svc, path),",
  '      asset_type: "factsheet",',
].join("\n");

const EDITS = [
  ["signInline helper", A1_FROM, A1_TO],
  ["jta_sheet preview_url", A2_FROM, A2_TO],
  ["blueprint_sheet preview_url", A3_FROM, A3_TO],
  ["engine_brief preview_url", A4_FROM, A4_TO],
  ["factsheet preview_url", A5_FROM, A5_TO],
];

if (!existsSync(SRC)) {
  console.error("render-asset/index.ts not found at " + SRC);
  process.exit(1);
}

let text = readFileSync(SRC, "utf8");
const before = text.length;

const isCRLF = text.includes("\r\n");
const nl = (s) => (isCRLF ? s.replace(/\n/g, "\r\n") : s);

console.log("render-asset preview_url " + (DRY_RUN ? "[DRY RUN]" : "[LIVE]"));
console.log("  line endings detected: " + (isCRLF ? "CRLF" : "LF") + "\n");

if (text.includes("signInline")) {
  console.log("  already patched - 'signInline' is present. Nothing to do.");
  process.exit(0);
}

/* ---- phase 1: validate every anchor --------------------------------- */
let bad = 0;
for (const [label, from] of EDITS) {
  const hits = text.split(nl(from)).length - 1;
  if (hits === 1) {
    console.log("  ok   " + label);
  } else {
    console.log("  FAIL " + label + ": anchor found " + hits + " times, expected 1");
    console.log(
      from
        .split("\n")
        .slice(0, 4)
        .map((l) => "         |" + l.replace(/^ +/, (m) => ".".repeat(m.length)))
        .join("\n"),
    );
    bad += 1;
  }
}
if (bad > 0) {
  console.log("\n" + bad + " anchor(s) did not match. NOTHING written.");
  process.exit(1);
}

/* ---- phase 2: apply ------------------------------------------------- */
for (const [, from, to] of EDITS) {
  text = text.replace(nl(from), nl(to));
}

const added = (text.match(/preview_url: await signInline/g) || []).length;
if (added !== 4) {
  console.log(
    "\nFAIL: expected 4 preview_url fields, found " + added + ". Nothing written.",
  );
  process.exit(1);
}

console.log("\nbytes " + before + " -> " + text.length);
console.log("preview_url fields added: " + added + " of 4");

if (DRY_RUN) {
  console.log("\nDRY RUN - nothing written.");
} else {
  writeFileSync(SRC, text, { encoding: "utf8" });
  console.log("\nwritten.");
  console.log("");
  console.log("NOW deploy: supabase functions deploy render-asset");
  console.log("Nothing consumes preview_url yet - the library modal is next.");
}
