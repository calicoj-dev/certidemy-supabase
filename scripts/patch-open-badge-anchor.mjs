/**
 * patch-open-badge-anchor.mjs
 *
 * Adds `?doc=anchor&code=<CODE>` to open-badge: the Merkle inclusion proof for
 * one credential.
 *
 * Run from supabase/.
 *
 * ============================== WHY IT EXISTS ===============================
 *
 * A verifier hashes the credential document and gets a leaf. To reach the root
 * they need the SIBLING HASHES up the tree -- and those cannot live inside the
 * credential, because the leaf is a hash OF the credential. Putting the proof
 * inside would change the document and invalidate the hash.
 *
 * So the proof is served beside the credential, and this is where from.
 *
 * ============================== IT IS TINY, ON PURPOSE ======================
 *
 * A Merkle proof is one sibling per level of the tree:
 *
 *     2 credentials in the batch  ->  1 sibling
 *     1,000                       ->  10
 *     1,000,000                   ->  20
 *
 * A verifier never sees any other credential. Every sibling is an opaque 32
 * bytes that reveals nothing about whose document produced it -- which is what
 * makes one shared tree across all issuers safe.
 *
 * ============================== NOT SIGNED ==================================
 *
 * Deliberately. A signature would prove Certidemy asserts this proof, which is
 * worth nothing: the proof either recomputes the root or it does not, and the
 * verifier checks that themselves with a hash function. Signing it would invite
 * a reader to trust the assertion instead of doing the arithmetic.
 *
 * The proof's integrity comes from the maths, not from us.
 *
 * ============================== 404 IS A REAL ANSWER ========================
 *
 * A credential with no anchor_id 404s, and that is correct rather than an error
 * to paper over: it was issued after the last batch ran and has not been hashed
 * yet. Specimens have no anchor by construction -- the builder excludes them.
 *
 * open-badge/index.ts is LF. Anchors normalized.
 *
 * Usage:  node scripts/patch-open-badge-anchor.mjs --dry
 *         node scripts/patch-open-badge-anchor.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry");
const PATH = "functions/open-badge/index.ts";

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

const EDITS = [
  {
    name: "anchor branch",
    find: `    /* ------------------------------------------------------------ status -- */`,
    replace: `    /* ------------------------------------------------------------ anchor -- */
    /* The Merkle inclusion proof. NOT a credential and NOT signed -- see the
       patch header. A verifier hashes the credential, combines it with the
       siblings below, and compares the result to what is on chain. */
    if (doc === "anchor") {
      const code = url.searchParams.get("code");
      if (!code) return jsonResponse({ error: "code required" }, 400);

      const { data: cred, error: credErr } = await svc
        .from("credentials")
        .select(
          "credential_code, anchor_leaf, anchor_path, is_specimen, anchor_id, credential_anchors(merkle_root, doc_version, built_at, chain, txid, anchored_at)",
        )
        .eq("credential_code", code.trim().toUpperCase())
        .maybeSingle();

      if (credErr) throw new Error(\`anchor lookup: \${credErr.message}\`);
      if (!cred || cred.is_specimen) {
        return jsonResponse({ error: "not found" }, 404);
      }

      /* No anchor yet is a REAL ANSWER, not a failure: the credential was
         issued after the last batch ran. 404 rather than an empty object, so a
         consumer cannot mistake "not yet hashed" for "hashed to nothing". */
      if (!cred.anchor_id || !cred.anchor_leaf) {
        return jsonResponse({ error: "not anchored yet" }, 404);
      }

      const anchor = cred.credential_anchors as unknown as {
        merkle_root: string;
        doc_version: string;
        built_at: string;
        chain: string | null;
        txid: string | null;
        anchored_at: string | null;
      } | null;

      if (!anchor) throw new Error("anchor row missing for a linked credential");

      return ldResponse(
        {
          credential: \`\${issuer.base_url}/credentials/\${cred.credential_code}\`,
          leaf: cred.anchor_leaf,
          path: cred.anchor_path ?? [],
          root: anchor.merkle_root,
          docVersion: anchor.doc_version,
          builtAt: anchor.built_at,
          /* Null until published. The proof is still useful: it shows the
             document has not changed since it was hashed. What a chain adds is
             a date nobody has to take our word for. */
          chain: anchor.chain,
          txid: anchor.txid,
          anchoredAt: anchor.anchored_at,
          algorithm: {
            leaf: "sha256(utf8 bytes of the credential document as served)",
            node: "sha256(left32 || right32), raw bytes",
            oddNode: "promoted unchanged, never duplicated",
          },
        },
        CACHE_STABLE,
        200,
        "application/json",
      );
    }

    /* ------------------------------------------------------------ status -- */`,
  },
  {
    name: "ldResponse accepts a content type",
    find: `function ldResponse(
  body: unknown,
  cache: string,
  status = 200,
): Response {`,
    replace: `function ldResponse(
  body: unknown,
  cache: string,
  status = 200,
  // The anchor proof is plain JSON, not a verifiable credential. Sending it as
  // application/vc+ld+json would tell a consumer it is one.
  contentType: string = LD_JSON,
): Response {`,
  },
  {
    name: "use the content type parameter",
    find: `      "content-type": \`\${LD_JSON}; charset=utf-8\`,`,
    replace: `      "content-type": \`\${contentType}; charset=utf-8\`,`,
  },
];

for (const e of EDITS) {
  const find = toEol(e.find);
  const n = src.split(find).length - 1;
  if (n !== 1) {
    console.error(`ABORT  "${e.name}": matched ${n}, expected 1`);
    process.exit(3);
  }
  src = src.replace(find, toEol(e.replace));
  console.log(`  ok   ${e.name}`);
}

const CHECKS = [
  ['doc === "anchor"', true],
  ["not anchored yet", true],
  ["contentType: string = LD_JSON", true],
  ['`${contentType}; charset=utf-8`', true],
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

console.log(`\n  ${before} -> ${src.length} bytes`);

if (DRY) {
  console.log("\nDRY RUN -- nothing written");
  process.exit(2);
}

writeFileSync(PATH, src, "utf8");
console.log("\nwritten " + PATH);
