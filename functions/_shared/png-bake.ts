/**
 * supabase/functions/_shared/png-bake.ts
 *
 * Open Badges 3.0 "baking" -- embedding a signed credential inside the badge
 * PNG, so the image IS the credential rather than a picture of one.
 *
 * ============================== WHAT THE SPEC SAYS ==========================
 *
 * OB 3.0 s10: an iTXt chunk with keyword `openbadgecredential`. Because we use
 * an EMBEDDED PROOF (eddsa-jcs-2022) rather than VC-JWT, the text value is the
 * JSON representation of the OpenBadgeCredential -- not a compact JWS.
 *
 * The spec is explicit on two points and both are load-bearing:
 *
 *   - "Compression MUST NOT be used."  The compression flag and method bytes
 *     are both 0 and the text is stored raw. A gzipped chunk is a valid PNG and
 *     an invalid baked badge.
 *   - "An iTXt chunk with the keyword openbadgecredential MUST NOT appear in a
 *     PNG more than once."  See the note on source images below.
 *
 * ============================== WHY THIS IS WORTH DOING =====================
 *
 * v5.9 s3 recorded the honest boundary: there are three ways a credential
 * reaches an HR system, and we have one -- the holder hands it over. A baked
 * badge is the best possible version of that one. The holder emails or uploads a
 * single image; any OB3-aware system extracts the credential, resolves the
 * issuer, checks the signature and reads the status list, without ever
 * contacting us and without trusting us.
 *
 * That is the same property the embedded proof was chosen for. Baking just puts
 * it in a container people already know how to move around.
 *
 * ============================== SOURCE IMAGES ==============================
 *
 * The badge PNGs in _shared/badges.ts are OUR OWN ARTWORK and have never been
 * baked, so there is no existing openbadgecredential chunk to collide with. This
 * module therefore INSERTS rather than replace-or-insert, and asserts the
 * absence instead of handling it: if a source badge ever arrives pre-baked, that
 * is a supply-chain surprise worth failing on rather than silently overwriting.
 *
 * ============================== SIZE ======================================
 *
 * A Certidemy credential is large -- roughly 55 KB, because `alignment` carries
 * every JTA task with its K/S/A, domain weight and Bloom level. The badge itself
 * is about 21 KB. So a baked Certidemy badge is ~76 KB and is mostly metadata,
 * which is the inverse of what most issuers produce. That is the payload nobody
 * else ships, and it is the point; it is not a bug to be optimised away.
 */

/* -------------------------------------------------------------------------- *
 * CRC-32, as PNG requires (IEEE 802.3, reflected, init 0xFFFFFFFF, final XOR).
 *
 * Table built once per isolate. Written out rather than pulled from a
 * dependency: it is twelve lines, and this file runs in an edge function where
 * every import is a cold-start cost and a thing that can change under us.
 * -------------------------------------------------------------------------- */

let CRC_TABLE: Uint32Array | null = null;

function crcTable(): Uint32Array {
  if (CRC_TABLE) return CRC_TABLE;
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  CRC_TABLE = t;
  return t;
}

function crc32(bytes: Uint8Array): number {
  const t = crcTable();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = t[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/* -------------------------------------------------------------------------- *
 * Chunk construction
 * -------------------------------------------------------------------------- */

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function u32be(n: number): Uint8Array {
  return new Uint8Array([
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff,
  ]);
}

function concat(parts: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/**
 * Build a complete iTXt chunk: length, type, data, CRC.
 *
 * iTXt data layout, per the PNG specification:
 *
 *   keyword             Latin-1, 1-79 bytes
 *   0x00                null separator
 *   compression flag    1 byte -- 0, per OB3
 *   compression method  1 byte -- 0
 *   language tag        null-terminated, empty here
 *   translated keyword  null-terminated, empty here
 *   text                UTF-8, NOT null-terminated
 *
 * The CRC covers the type and the data, and NOT the length field. Getting that
 * wrong produces a file every decoder rejects, which at least fails loudly.
 */
function iTXtChunk(keyword: string, text: string): Uint8Array {
  const enc = new TextEncoder();
  const data = concat([
    enc.encode(keyword),
    new Uint8Array([0x00]), // null separator
    new Uint8Array([0x00]), // compression flag -- MUST be 0
    new Uint8Array([0x00]), // compression method
    new Uint8Array([0x00]), // language tag: empty, terminated
    new Uint8Array([0x00]), // translated keyword: empty, terminated
    enc.encode(text),
  ]);
  const type = enc.encode("iTXt");
  return concat([
    u32be(data.length),
    type,
    data,
    u32be(crc32(concat([type, data]))),
  ]);
}

/* -------------------------------------------------------------------------- *
 * Baking
 * -------------------------------------------------------------------------- */

export class BakeError extends Error {}

/**
 * Insert the credential into the badge PNG.
 *
 * The chunk goes immediately before IEND. IEND is the last chunk in every valid
 * PNG and is always exactly 12 bytes (a zero length, the type, and its CRC), so
 * the insertion point is `length - 12` -- but that is ASSERTED rather than
 * assumed: the type bytes at that offset are checked, and a mismatch throws.
 * Writing a chunk into the middle of an image because the tail was not what we
 * expected would produce a file that is corrupt in a way nothing here would
 * notice.
 *
 * @param png        the raw badge image
 * @param credential the signed OpenBadgeCredential, already serialized
 */
export function bakeCredentialIntoPng(
  png: Uint8Array,
  credential: string,
): Uint8Array {
  if (png.length < 8 + 12) {
    throw new BakeError("badge image is too small to be a PNG");
  }
  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    if (png[i] !== PNG_SIGNATURE[i]) {
      throw new BakeError("badge image is not a PNG");
    }
  }

  // The source artwork must not already carry a credential -- the spec forbids
  // a second openbadgecredential chunk, and a pre-baked source would mean the
  // badge files are not what we think they are.
  const asLatin1 = new TextDecoder("latin1").decode(png);
  if (asLatin1.includes("openbadgecredential")) {
    throw new BakeError(
      "badge image already contains an openbadgecredential chunk",
    );
  }

  const iendAt = png.length - 12;
  if (
    png[iendAt + 4] !== 0x49 || // I
    png[iendAt + 5] !== 0x45 || // E
    png[iendAt + 6] !== 0x4e || // N
    png[iendAt + 7] !== 0x44 //    D
  ) {
    throw new BakeError("PNG does not end with an IEND chunk");
  }

  return concat([
    png.subarray(0, iendAt),
    iTXtChunk("openbadgecredential", credential),
    png.subarray(iendAt),
  ]);
}

/** base64 -> bytes. The badge module stores artwork base64-encoded. */
export function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
