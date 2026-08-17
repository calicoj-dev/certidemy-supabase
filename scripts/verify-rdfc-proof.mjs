/**
 * verify-rdfc-proof.mjs
 *
 * Verifies BOTH proofs on a credential, independently of the code that signed
 * them.
 *
 * Run from supabase/.
 *
 *   node scripts/verify-rdfc-proof.mjs <credential-url-or-file>
 *   node scripts/verify-rdfc-proof.mjs https://credentials.certidemy.com/credentials/SM-AI-I-ZZMV-JPC8
 *
 * ============================== WHY THIS EXISTS =============================
 *
 * A signature that verifies only against the code that produced it proves
 * nothing. Both halves could share the same wrong assumption -- a canonicalizer
 * that drops a field, a payload assembled in the wrong order -- and agree
 * perfectly with each other while every external verifier rejects the result.
 *
 * That failure is worse than no signature, because it looks correct until
 * somebody who matters checks it.
 *
 * So this script shares NO code with _shared/ob3.ts. It re-derives everything:
 * its own base58 decoder, its own canonicalization call, its own payload
 * assembly straight from the cryptosuite specification, and it fetches the
 * public key OVER THE NETWORK from the issuer document the credential names --
 * exactly as a stranger's verifier would.
 *
 * ============================== WHAT IT CHECKS ==============================
 *
 * For each proof in the set:
 *
 *   1. the proof names a verificationMethod that resolves in the issuer document
 *   2. the published key is a Multikey with the Ed25519 multicodec prefix
 *   3. proofHash || docHash, computed with THAT proof's canonicalizer, verifies
 *      against the published key
 *
 * And across the set:
 *
 *   4. both cryptosuites are present -- eddsa-jcs-2022 AND eddsa-rdfc-2022
 *   5. JCS is first (some consumers read proof[0] blindly)
 *
 * ============================== THE TAMPER TEST =============================
 *
 * With --tamper the script alters one character of the holder's name and
 * re-verifies. BOTH proofs MUST then fail. A proof that still verifies after the
 * document changed is not covering the document, which is the single most
 * dangerous thing a credential can do -- and it is exactly what a canonicalizer
 * silently dropping fields would produce.
 *
 * A green run without --tamper is only half the evidence.
 */

import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import jsonld from "jsonld";

const subtle = webcrypto.subtle;

/* ---------------------------------------------------------------- base58 -- */
/* Written out rather than imported from _shared/ob3.ts. Sharing the decoder
   would mean a bug in it could cancel itself out between signing and checking. */
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Decode(s) {
  const bytes = [0];
  for (const ch of s) {
    const v = B58.indexOf(ch);
    if (v < 0) throw new Error(`invalid base58 character: ${ch}`);
    let carry = v;
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (let i = 0; i < s.length && s[i] === B58[0]; i++) bytes.push(0);
  return new Uint8Array(bytes.reverse());
}

/* ------------------------------------------------------------ canonicalize */

/** RFC 8785 JCS, re-implemented. */
function jcs(value) {
  const sortDeep = (v) => {
    if (Array.isArray(v)) return v.map(sortDeep);
    if (v !== null && typeof v === "object") {
      const out = {};
      for (const k of Object.keys(v).sort()) {
        if (v[k] === undefined) continue;
        out[k] = sortDeep(v[k]);
      }
      return out;
    }
    return v;
  };
  return JSON.stringify(sortDeep(value));
}

/**
 * URDNA2015. The document loader fetches contexts from the NETWORK, deliberately
 * -- the signer uses bundled copies, and this checks that the bundled ones still
 * agree with what the world actually serves. If they have diverged, this fails
 * and that is the finding.
 */
async function rdfc(value) {
  return await jsonld.canonize(value, {
    algorithm: "URDNA2015",
    format: "application/n-quads",
    safe: true,
  });
}

async function sha256(text) {
  return new Uint8Array(
    await subtle.digest("SHA-256", new TextEncoder().encode(text)),
  );
}

/* ----------------------------------------------------------------- verify - */

async function verifyProof(document, proof, publicKeyBytes) {
  const canon = proof.cryptosuite === "eddsa-jcs-2022" ? jcs : rdfc;

  // The proof configuration is the proof object WITHOUT proofValue, carrying the
  // enclosing document's @context. Straight from the cryptosuite spec.
  const config = { ...proof };
  delete config.proofValue;
  config["@context"] = document["@context"];

  const unsigned = { ...document };
  delete unsigned.proof;

  const proofHash = await sha256(await canon(config));
  const docHash = await sha256(await canon(unsigned));

  const payload = new Uint8Array(proofHash.length + docHash.length);
  payload.set(proofHash, 0);
  payload.set(docHash, proofHash.length);

  if (!proof.proofValue?.startsWith("z")) {
    throw new Error("proofValue is not multibase base58btc ('z' prefix)");
  }
  const sig = base58Decode(proof.proofValue.slice(1));

  const key = await subtle.importKey(
    "raw",
    publicKeyBytes,
    { name: "Ed25519" },
    false,
    ["verify"],
  );
  return await subtle.verify({ name: "Ed25519" }, key, sig, payload);
}

/* ------------------------------------------------------------------- main - */

const ref = process.argv[2];
const TAMPER = process.argv.includes("--tamper");
if (!ref) {
  console.error("usage: node scripts/verify-rdfc-proof.mjs <url|file> [--tamper]");
  process.exit(2);
}

const raw = ref.startsWith("http")
  ? await (await fetch(ref, { headers: { accept: "application/vc+ld+json" } })).text()
  : readFileSync(ref, "utf8");

const credential = JSON.parse(raw);

console.log("credential :", credential.id);
console.log("issuer     :", credential.issuer?.id);

const proofs = Array.isArray(credential.proof)
  ? credential.proof
  : credential.proof
    ? [credential.proof]
    : [];
console.log("proofs     :", proofs.length);
if (proofs.length === 0) {
  console.error("\nFAIL  no proof on this credential");
  process.exit(1);
}

/* The issuer document, FETCHED, exactly as a stranger's verifier would. */
const issuerUrl = credential.issuer?.id;
const issuerDoc = await (
  await fetch(issuerUrl, { headers: { accept: "application/vc+ld+json" } })
).json();

const methods = issuerDoc.verificationMethod ?? [];
console.log("published keys:", methods.length);
console.log("");

let failures = 0;

for (const proof of proofs) {
  const label = (proof.cryptosuite ?? "?").padEnd(16);

  const method = methods.find((m) => m.id === proof.verificationMethod);
  if (!method) {
    console.log(`  FAIL  ${label} verificationMethod not published: ${proof.verificationMethod}`);
    failures++;
    continue;
  }
  if (method.type !== "Multikey") {
    console.log(`  FAIL  ${label} key type is ${method.type}, expected Multikey`);
    failures++;
    continue;
  }

  // Multikey: multibase 'z', then the multicodec prefix 0xed 0x01 for Ed25519.
  const keyBytes = base58Decode(method.publicKeyMultibase.slice(1));
  if (keyBytes[0] !== 0xed || keyBytes[1] !== 0x01) {
    console.log(`  FAIL  ${label} not an Ed25519 multicodec prefix`);
    failures++;
    continue;
  }
  const publicKey = keyBytes.slice(2);

  try {
    const ok = await verifyProof(credential, proof, publicKey);
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${label} signature ${ok ? "verifies" : "DOES NOT VERIFY"}`);
    if (!ok) failures++;
  } catch (err) {
    console.log(`  FAIL  ${label} ${(err.message || err).toString().slice(0, 160)}`);
    failures++;
  }
}

/* --------------------------------------------------------- set-level checks */

console.log("");
const suites = proofs.map((p) => p.cryptosuite);
for (const want of ["eddsa-jcs-2022", "eddsa-rdfc-2022"]) {
  const has = suites.includes(want);
  console.log(`  ${has ? "PASS" : "FAIL"}  proof set contains ${want}`);
  if (!has) failures++;
}
if (proofs.length > 1) {
  const jcsFirst = suites[0] === "eddsa-jcs-2022";
  console.log(`  ${jcsFirst ? "PASS" : "WARN"}  eddsa-jcs-2022 is proof[0]${jcsFirst ? "" : " -- consumers reading proof[0] blindly get RDFC"}`);
}

/* ------------------------------------------------------------ tamper test - */

if (TAMPER) {
  console.log("\n--- TAMPER TEST: one character of the holder's name changed ---");
  const t = JSON.parse(raw);
  const field = "certidemy:holderName";
  if (typeof t[field] !== "string") {
    console.log("  SKIP  no holderName on this credential to alter");
  } else {
    t[field] = t[field].slice(0, -1) + (t[field].slice(-1) === "z" ? "y" : "z");
    let stillValid = 0;
    for (const proof of Array.isArray(t.proof) ? t.proof : [t.proof]) {
      const method = methods.find((m) => m.id === proof.verificationMethod);
      const publicKey = base58Decode(method.publicKeyMultibase.slice(1)).slice(2);
      let ok = false;
      try {
        ok = await verifyProof(t, proof, publicKey);
      } catch {
        ok = false;
      }
      console.log(`  ${ok ? "FAIL" : "PASS"}  ${(proof.cryptosuite ?? "?").padEnd(16)} ${ok ? "STILL VERIFIES AFTER TAMPERING" : "correctly rejects the altered document"}`);
      if (ok) stillValid++;
    }
    if (stillValid > 0) {
      console.log("\n  A proof that survives tampering is NOT covering the document.");
      failures += stillValid;
    }
  }
}

console.log(`\nfailures: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
