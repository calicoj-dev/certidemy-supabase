/**
 * patch-ob3-rdfc.mjs  (v2)
 *
 * Adds eddsa-rdfc-2022 alongside eddsa-jcs-2022, so `proof` becomes an array of
 * two.
 *
 * Run from supabase/.
 *
 * ============================== WHY ==========================================
 *
 * 1EdTech's Open Badges 3.0 conformance guide names exactly two acceptable proof
 * mechanisms for a Linked Data Proof: the EdDSA suite with eddsa-rdfc-2022, or
 * the ECDSA suite with ecdsa-sd-2023. eddsa-jcs-2022 is a conformant W3C Data
 * Integrity cryptosuite and produces genuinely verifiable credentials -- it is
 * simply not on their list.
 *
 * A verifier that implements only RDFC currently cannot check a Certidemy
 * credential at all. Adding the second proof strictly INCREASES who can verify;
 * it takes nothing away.
 *
 * ============================== DUAL, NOT REPLACED ==========================
 *
 * VCDM 2.0 permits `proof` to be an array (a proof set): several independent
 * proofs over the same document, any one of which a verifier may check.
 *
 * The JCS proof stays. Three reasons, and the third is the real one:
 *
 *   - credential-data-panel verifies JCS today, and a working six-check panel on
 *     a paying customer's credential is not worth breaking for a conformance
 *     target nobody has yet asked for
 *   - JCS needs no JSON-LD processor, so it stays verifiable by anything that
 *     can sort keys and check Ed25519
 *   - IF THE RDFC PATH IS EVER WRONG, the credential remains verifiable. A
 *     single proof is a single point of failure over the one artifact this
 *     product exists to produce.
 *
 * JCS is emitted FIRST: some consumers read proof[0] rather than searching the
 * array for a cryptosuite they support, and JCS is what this platform's own
 * verifier has always checked.
 *
 * ============================== WHAT WAS MEASURED ===========================
 *
 * Before writing any of this, against the real SM-AI-I credential (55 KB, 53
 * alignments):
 *
 *   canonize the credential      37.6 ms, 79,248 bytes of N-Quads
 *   canonize the proof config    547 bytes, 5 triples, JSON-LD safe mode PASS
 *   contexts to bundle           17.5 KB, two documents
 *   network calls at signing     ZERO -- the loader throws on any attempt
 *   import form                  https://esm.sh/jsonld@8.3.2?bundle-deps
 *
 * The import form is not cosmetic. Plain esm.sh imports FAIL: jsonld pulls
 * rdf-canonize-native, which tries to load a .node addon that cannot exist in an
 * edge runtime. ?bundle-deps inlines the pure-JS path.
 *
 * The proof config was checked property by property, because a config that
 * canonicalizes to fewer triples than it has properties yields a signature
 * covering less than it appears to -- a valid-looking proof that protects
 * nothing. All five survive: created, type, cryptosuite, proofPurpose,
 * verificationMethod.
 *
 * ============================== EXISTING CREDENTIALS ========================
 *
 * open-badge rebuilds and re-signs on every fetch, so the one issued credential
 * gains its second proof on deploy. Deliberate: adding a proof only widens who
 * can verify, and the JCS proof it already carries is unchanged.
 *
 * ============================== v1 FAILED ON A BLANK LINE ===================
 *
 * v1's edit 3 spanned signDocument's body and omitted a blank line between the
 * Promise.all block and `const payload`. v2's anchors were built from a
 * codepoint dump of the file as it actually is after the base_url refactor,
 * which had already reformatted the verificationMethod assignment across two
 * lines.
 *
 * The anchor also stops before the "@context is carried..." comment, which
 * contains a real em-dash (U+2014). No comment prose in anchors.
 *
 * ob3.ts is CRLF. Anchors normalized.
 *
 * Usage:  node scripts/patch-ob3-rdfc.mjs --dry
 *         node scripts/patch-ob3-rdfc.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry");
const PATH = "functions/_shared/ob3.ts";

let src = readFileSync(PATH, "utf8");
const before = src.length;

const cr = (src.match(/\r\n/g) || []).length;
const lf = (src.match(/\n/g) || []).length;
console.log(`  ${PATH}  ${cr > 0 ? "CRLF" : "LF"}  (${cr} CRLF / ${lf} LF)`);
if (cr > 0 && cr !== lf) {
  console.error("ABORT  mixed line endings");
  process.exit(3);
}
const eol = cr > 0 ? "\r\n" : "\n";
const toEol = (s) =>
  eol === "\r\n" ? s.replace(/\r?\n/g, "\r\n") : s.replace(/\r\n/g, "\n");

const alreadyPatched = src.includes("eddsa-rdfc-2022");

const EDITS = [
  {
    name: "import jsonld and the bundled contexts",
    find: `import { effectiveStatus, isSignable, type StatusInput } from "./credential-status.ts";`,
    replace: `import { effectiveStatus, isSignable, type StatusInput } from "./credential-status.ts";
/*
 * ?bundle-deps IS LOAD-BEARING. A plain esm.sh import of jsonld pulls
 * rdf-canonize-native, which tries to load a .node addon that cannot exist in an
 * edge runtime and fails with "Cannot set properties of null (setting 'path')".
 * ?bundle-deps inlines the pure-JS canonicalizer. Measured at 37.6 ms on a 55 KB
 * credential. Do not simplify this import.
 */
import jsonld from "https://esm.sh/jsonld@8.3.2?bundle-deps";
import { bundledDocumentLoader } from "./ld-contexts.ts";`,
    skipIf: 'import jsonld from "https://esm.sh/jsonld@8.3.2?bundle-deps";',
  },
  {
    name: "rdfc canonicalizer",
    find: `async function sha256(input: string): Promise<Uint8Array> {`,
    replace: `/**
 * RDF Dataset Canonicalization (URDNA2015) -> N-Quads.
 *
 * What eddsa-rdfc-2022 canonicalizes with, and a genuinely different operation
 * from JCS: the document is EXPANDED as JSON-LD into RDF triples, those triples
 * are canonically ordered by a hashing algorithm, and the result serialized. Two
 * documents differing only in key order, or in which @context alias they use,
 * produce identical N-Quads; JCS would see different bytes.
 *
 * safe: true, deliberately. Under safe mode a term not defined by any context is
 * an ERROR rather than a silent drop. Without it, an undefined property would
 * simply not appear in the N-Quads and the signature would cover a document
 * missing a field nobody noticed was missing -- this codebase's recurring
 * failure shape, here cryptographically blessed.
 *
 * The loader serves only bundled contexts and THROWS on anything else, so
 * signing makes no network call.
 */
async function rdfCanonize(value: unknown): Promise<string> {
  return await jsonld.canonize(value, {
    algorithm: "URDNA2015",
    format: "application/n-quads",
    documentLoader: bundledDocumentLoader,
    safe: true,
  });
}

async function sha256(input: string): Promise<Uint8Array> {`,
    skipIf: "async function rdfCanonize",
  },
  {
    name: "signDocument emits a proof set",
    find: `  const proofConfig: Record<string, unknown> = {
    "@context": (document as Record<string, unknown>)["@context"],
    type: "DataIntegrityProof",
    cryptosuite: "eddsa-jcs-2022",
    created,
    verificationMethod,
    proofPurpose: "assertionMethod",
  };

  const [proofHash, docHash] = await Promise.all([
    sha256(canonicalize(proofConfig)),
    sha256(canonicalize(document)),
  ]);

  const payload = new Uint8Array(proofHash.length + docHash.length);
  payload.set(proofHash, 0);
  payload.set(docHash, proofHash.length);

  const key = await importSigningKey(privateKeyPem);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, key, payload));`,
    replace: `  const key = await importSigningKey(privateKeyPem);

  /**
   * Sign one proof.
   *
   * Both cryptosuites use the same construction -- hash the proof options and
   * the document SEPARATELY, then sign proofHash || docHash -- and differ only
   * in the canonicalizer. Signing the document alone would leave the proof
   * metadata (the date, the key, the purpose) unprotected and substitutable.
   */
  const signOne = async (
    cryptosuite: string,
    canon: (v: unknown) => string | Promise<string>,
  ): Promise<Record<string, unknown>> => {
    const config: Record<string, unknown> = {
      "@context": (document as Record<string, unknown>)["@context"],
      type: "DataIntegrityProof",
      cryptosuite,
      created,
      verificationMethod,
      proofPurpose: "assertionMethod",
    };

    const [proofHash, docHash] = await Promise.all([
      Promise.resolve(canon(config)).then(sha256),
      Promise.resolve(canon(document)).then(sha256),
    ]);

    const payload = new Uint8Array(proofHash.length + docHash.length);
    payload.set(proofHash, 0);
    payload.set(docHash, proofHash.length);

    const sig = new Uint8Array(
      await crypto.subtle.sign({ name: "Ed25519" }, key, payload),
    );

    // @context is carried in the config for hashing but is not part of the
    // emitted proof object: it belongs to the enclosing document.
    delete config["@context"];
    return { ...config, proofValue: "z" + base58btc(sig) };
  };

  /*
   * A PROOF SET: two independent proofs over the same document, either of which
   * a verifier may check. VCDM 2.0 permits this, and 1EdTech's conformance guide
   * requires eddsa-rdfc-2022 or ecdsa-sd-2023 -- neither of which is what this
   * platform originally signed with.
   *
   * JCS IS FIRST, deliberately. Some consumers read proof[0] instead of
   * searching for a cryptosuite they support, and JCS is what this platform's
   * own verifier has always checked. It also means that if the RDFC path is ever
   * wrong, the credential is still verifiable.
   */
  const [jcsProof, rdfcProof] = await Promise.all([
    signOne("eddsa-jcs-2022", canonicalize),
    signOne("eddsa-rdfc-2022", rdfCanonize),
  ]);`,
    skipIf: "const signOne = async (",
  },
  {
    name: "return the proof set",
    find: `  return {
    ...document,
    proof: { ...proofConfig, proofValue: "z" + base58btc(sig) },
  };`,
    replace: `  return {
    ...document,
    proof: [jcsProof, rdfcProof],
  };`,
    skipIf: "proof: [jcsProof, rdfcProof],",
  },
];

for (const e of EDITS) {
  if (e.skipIf && src.includes(e.skipIf)) {
    console.log(`  skip  ${e.name} -- already applied`);
    continue;
  }
  const find = toEol(e.find);
  const n = src.split(find).length - 1;
  if (n !== 1) {
    console.error(`ABORT  "${e.name}": matched ${n}, expected 1`);
    process.exit(3);
  }
  src = src.replace(find, toEol(e.replace));
  console.log(`  ok    ${e.name}`);
}

/* The stale "@context is carried in the proof config..." comment block sits
   between the old signing code and the return, and its em-dash makes it a bad
   anchor. Removed by regex on its own lines instead. */
const STALE = /[ \t]*\/\/ @context is carried in the proof config[^\n]*\r?\n[ \t]*\/\/ emitted proof object[^\n]*\r?\n[ \t]*delete proofConfig\["@context"\];\r?\n\r?\n/;
if (STALE.test(src)) {
  src = src.replace(STALE, "");
  console.log("  ok    removed the stale proofConfig comment and delete");
}

const CHECKS = [
  ["?bundle-deps", true],
  ["async function rdfCanonize", true],
  ['signOne("eddsa-jcs-2022", canonicalize)', true],
  ['signOne("eddsa-rdfc-2022", rdfCanonize)', true],
  ["proof: [jcsProof, rdfcProof]", true],
  // Nothing may reference the removed single-proof variable.
  ["proofConfig", false],
];
for (const [needle, want] of CHECKS) {
  const has = src.includes(needle);
  if (has !== want) {
    console.error(`ABORT  post-check: ${JSON.stringify(needle)} present=${has}, want=${want}`);
    process.exit(3);
  }
}
{
  const crA = (src.match(/\r\n/g) || []).length;
  const lfA = (src.match(/\n/g) || []).length;
  const ok = eol === "\r\n" ? crA === lfA : crA === 0;
  if (!ok) {
    console.error(`ABORT  line endings drifted (${crA} CRLF / ${lfA} LF)`);
    process.exit(3);
  }
}

console.log(`\n  ${before} -> ${src.length} bytes${alreadyPatched ? "  (re-run)" : ""}`);

if (DRY) {
  console.log("\nDRY RUN -- nothing written");
  process.exit(2);
}

writeFileSync(PATH, src, "utf8");
console.log("\nwritten " + PATH);
