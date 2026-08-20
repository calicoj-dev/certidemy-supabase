/**
 * supabase/functions/_shared/ob3.ts
 *
 * Open Badges 3.0 / W3C Verifiable Credentials — canonicalization, signing,
 * and the four document builders.
 *
 * ============================== WHAT THIS IS ==============================
 *
 * An Open Badge 3.0 is not an image. It is a JSON-LD document, shaped as a W3C
 * Verifiable Credential, cryptographically signed by the issuer. The signature
 * travels INSIDE the file, so a verifier can check it without ever contacting
 * certidemy.com — which is the entire point, and the difference between a
 * credential and a web page about a credential.
 *
 * Nobody assigns identifiers. Every `id` is a URI and an https URL is a valid
 * URI, so the namespace is ours: /issuer, /achievements/<CODE>,
 * /credentials/<CODE>, /status/<n>.
 *
 * ============================== CRYPTOSUITE ================================
 *
 * eddsa-jcs-2022: Ed25519 over JCS-canonicalized JSON (RFC 8785).
 *
 * The alternative, eddsa-rdfc-2022, canonicalizes through RDF dataset
 * normalization — correct, standard, and requiring a JSON-LD processor plus
 * every referenced @context fetched and cached at signing time. JCS is a
 * conformant Data Integrity cryptosuite that sorts keys and serializes; it runs
 * in an edge function with no network calls and no dependency we have not read.
 *
 * The canonicalizer below is JSON.stringify over recursively key-sorted
 * objects. That IS RFC 8785 for the value space we emit: no NaN, no Infinity,
 * no numbers outside the range where JSON.stringify already matches the
 * ES6 Number::toString the RFC requires. Weights like 22.50 arrive from
 * Postgres numeric as JS numbers and serialize as 22.5 — deterministic, which
 * is what canonicalization needs. If this ever has to carry arbitrary numeric
 * input, revisit that assumption instead of assuming it still holds.
 *
 * ============================== CLAIMS DISCIPLINE ==========================
 *
 * Carried verbatim from components/seo/json-ld.tsx, because a signed claim is
 * strictly riskier than the same words in prose:
 *
 *   - NO accreditation claim anywhere. Nothing names a standards body as
 *     endorsing, accrediting or recognizing Certidemy.
 *   - `alignment` carries ALL tasks, including domains at weight 0. The
 *     credential attests the whole job task analysis; the weights describe how
 *     one exam form samples it. Different claims.
 *   - Certification NAME comes from credentials.certification_name, snapshotted
 *     at mint. NOT from the JTA snapshot, whose certification block is frozen at
 *     projection time and deliberately holds pre-rename names (v5.8 §3).
 *   - The competence statement is certification_i18n.claim — the sentence the
 *     credential asserts, and the one field a 17024 credential cannot omit.
 *
 * See CLAIMS-POLICY.md before adding any property that names an external body.
 */

import { effectiveStatus, isSignable, type StatusInput } from "./credential-status.ts";
/*
 * ?bundle-deps IS LOAD-BEARING. A plain esm.sh import of jsonld pulls
 * rdf-canonize-native, which tries to load a .node addon that cannot exist in an
 * edge runtime and fails with "Cannot set properties of null (setting 'path')".
 * ?bundle-deps inlines the pure-JS canonicalizer. Measured at 37.6 ms on a 55 KB
 * credential. Do not simplify this import.
 */
import jsonld from "https://esm.sh/jsonld@8.3.2?bundle-deps";
import { bundledDocumentLoader } from "./ld-contexts.ts";

/* ========================================================================== *
 * Encoding primitives
 * ========================================================================== */

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** base58btc, as required by the multibase 'z' prefix. */
export function base58btc(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";
  const digits: number[] = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = "";
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) out += B58[0];
  for (let i = digits.length - 1; i >= 0; i--) out += B58[digits[i]];
  return out;
}

export function base64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* ========================================================================== *
 * Canonicalization (RFC 8785 JCS)
 * ========================================================================== */

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

function sortDeep(value: Json): Json {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value !== null && typeof value === "object") {
    const out: { [k: string]: Json } = {};
    // RFC 8785 orders by UTF-16 code unit, which is what the default
    // Array.prototype.sort comparator on strings already does.
    for (const k of Object.keys(value).sort()) {
      const v = (value as { [k: string]: Json })[k];
      if (v === undefined) continue;
      out[k] = sortDeep(v);
    }
    return out;
  }
  return value;
}

export function canonicalize(value: unknown): string {
  return JSON.stringify(sortDeep(value as Json));
}

/**
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

async function sha256(input: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return new Uint8Array(digest);
}

/* ========================================================================== *
 * Signing
 * ========================================================================== */

/** PKCS#8 PEM -> CryptoKey. The key is non-extractable once imported. */
async function importSigningKey(pem: string): Promise<CryptoKey> {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "Ed25519" },
    false, // non-extractable: the key cannot be read back out of the runtime
    ["sign"],
  );
}

export interface SigningIssuer {
  base_url: string;
  slug: string;
  key_id: string;
}

/**
 * Attach a DataIntegrityProof (eddsa-jcs-2022) to a document.
 *
 * Per the cryptosuite: hash the proof options and the document separately, then
 * sign the concatenation proofHash || docHash. Signing the document alone would
 * leave the proof metadata — the date, the key, the purpose — unprotected and
 * substitutable.
 *
 * `created` is passed in rather than read from the clock. It comes from
 * credentials.material_updated_at, so the same credential produces byte-
 * identical output on every fetch and two verifiers comparing copies see the
 * same document. A now() here would make every response unique and uncacheable.
 */
export async function signDocument<T extends Record<string, unknown>>(
  document: T,
  privateKeyPem: string,
  issuer: SigningIssuer,
  created: string,
): Promise<T & { proof: Record<string, unknown>[] }> {
  // MUST match buildIssuerProfile's verificationMethod id exactly, or a
  // verifier resolves the issuer and finds no key by that identifier.
  const verificationMethod =
    `${issuer.base_url}/issuers/${issuer.slug}#${issuer.key_id}`;

  const key = await importSigningKey(privateKeyPem);

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
  ]);

  return {
    ...document,
    proof: [jcsProof, rdfcProof],
  };
}

/* ========================================================================== *
 * Contexts
 * ========================================================================== */

export const VC_CONTEXT = [
  "https://www.w3.org/ns/credentials/v2",
  "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
];

/**
 * The issuer Profile needs one context the credential does not.
 *
 * A Profile publishes verificationMethod at the TOP LEVEL so a verifier can
 * resolve the key. VC v2 defines that term only inside proof, and OB 3.0's
 * Profile class does not define it at all, so under JSON-LD safe mode the whole
 * property is dropped and the document fails validation. The W3C controller
 * context is where verificationMethod and Multikey are defined.
 *
 * DELIBERATELY NOT ADDED TO VC_CONTEXT. The context array is hashed into every
 * credential's proof config; widening the shared constant would change the
 * signed bytes of every document for a term only the Profile uses.
 */
export const PROFILE_CONTEXT = [
  ...VC_CONTEXT,
  "https://www.w3.org/ns/controller/v1",
];

/* ========================================================================== *
 * Document builders
 * ========================================================================== */

export interface IssuerRow {
  id: string;
  slug: string;
  name: string;
  /** Human/marketing host: badge PNGs, criteria pages, verify pages. */
  site_url: string;
  /** Root of the OB3 identifier namespace. Migration 216. */
  base_url: string;
  /**
   * Stored issuer identifier. DERIVED, not authoritative: issuerUrl() computes
   * the same value from base_url + slug. Kept as a column because other readers
   * resolve it directly.
   */
  issuer_url: string;
  key_id: string;
  public_key_multibase: string | null;
  key_created_at: string | null;
}

/**
 * The issuer Profile. Resolves at issuer_url, which is the `id` — so the
 * document is self-describing: fetch the issuer identifier from any credential
 * and you land on the public key that signed it.
 */
/* -------------------------------------------------------------------------- *
 * Identifier namespace
 *
 * Every OB3 identifier is issuer-scoped so a second issuer needs no new route
 * and no code change. Credentials are flat because credential_code carries a
 * UNIQUE constraint across the whole platform.
 * -------------------------------------------------------------------------- */

export function issuerUrl(issuer: IssuerRow): string {
  return `${issuer.base_url}/issuers/${issuer.slug}`;
}

export function achievementUrl(issuer: IssuerRow, certCode: string): string {
  return `${issuerUrl(issuer)}/achievements/${certCode}`;
}

export function statusListUrl(issuer: IssuerRow, listNumber: number): string {
  return `${issuerUrl(issuer)}/status/${listNumber}`;
}

export function credentialUrl(issuer: IssuerRow, credentialCode: string): string {
  return `${issuer.base_url}/credentials/${credentialCode}`;
}

export function buildIssuerProfile(issuer: IssuerRow): Record<string, unknown> {
  const doc: Record<string, unknown> = {
    "@context": PROFILE_CONTEXT,
    id: issuerUrl(issuer),
    type: ["Profile"],
    name: issuer.name,
    // The HUMAN site. The Profile identifier lives on the credential host; the
    // organization's home page does not.
    url: issuer.site_url,
  };

  if (issuer.public_key_multibase) {
    doc.verificationMethod = [
      {
        id: `${issuerUrl(issuer)}#${issuer.key_id}`,
        type: "Multikey",
        controller: issuerUrl(issuer),
        publicKeyMultibase: issuer.public_key_multibase,
      },
    ];
  }

  return doc;
}

/** A task as it appears in jta_versions.blueprint_snapshot. */
export interface SnapshotTask {
  code: string;
  statement: string;
  knowledge: string | null;
  skills: string | null;
  abilities: string | null;
  bloom_level: string;
  criticality: string | null;
  is_exam_scope: boolean;
}

export interface SnapshotDomain {
  code: string;
  title: string;
  description: string | null;
  weight_pct: number | string;
  tasks: SnapshotTask[];
}

/**
 * Domains + tasks -> OB 3.0 `alignment` entries.
 *
 * This is the payload. Most issuers put three or four loose skill tags here,
 * because a six-topic syllabus has nothing more granular to offer. Every task
 * carries its code, its domain, its blueprint weight and its cognitive level,
 * and every one of them resolves to a published blueprint anchor.
 *
 * targetCode is "<CERT> <task>" — the same citation form the blueprint page and
 * the schema.org DefinedTerm already use, so one identifier works everywhere.
 */
export function buildAlignment(
  domains: SnapshotDomain[],
  certCode: string,
  siteUrl: string,
): Record<string, unknown>[] {
  const framework = `${siteUrl}/certifications/${certCode.toLowerCase()}#blueprint`;

  return domains.flatMap((d) =>
    (d.tasks ?? []).map((t) => ({
      type: ["Alignment"],
      targetType: "ceasn:Competency",
      targetName: t.statement,
      targetCode: `${certCode} ${t.code}`,
      targetFramework: `${certCode} Job Task Analysis`,
      targetUrl: framework,
      // Non-standard keys are permitted alongside the spec's own and are what
      // makes this payload worth ingesting. A consumer that does not know them
      // ignores them; one that does gets the whole analysis.
      "certidemy:domainCode": d.code,
      "certidemy:domainTitle": d.title,
      "certidemy:domainWeightPct": Number(d.weight_pct),
      "certidemy:cognitiveLevel": t.bloom_level,
      ...(t.criticality ? { "certidemy:criticality": t.criticality } : {}),
      ...(t.knowledge ? { "certidemy:knowledge": t.knowledge } : {}),
      ...(t.skills ? { "certidemy:skills": t.skills } : {}),
      ...(t.abilities ? { "certidemy:abilities": t.abilities } : {}),
    }))
  );
}

/**
 * An alignment authored by hand, from public.achievement_alignments.
 *
 * A certification's alignments are DERIVED from its job task analysis and are
 * the richest payload this platform emits. An achievement with no JTA behind it
 * -- a partner's training-completion badge -- has whatever its author typed.
 * Both are legitimate; they are simply different claims, and the document says
 * which by what it carries.
 */
export interface AuthoredAlignment {
  target_name: string;
  target_url: string;
  target_framework: string | null;
  target_code: string | null;
  target_description: string | null;
  target_type: string | null;
}

/** A result description authored by hand, from public.achievement_results. */
export interface AuthoredResult {
  result_type: string;
  required_value: string | null;
  required_level: string | null;
  value_min: string | null;
  value_max: string | null;
  allowed_values: string[] | null;
}

export function buildAuthoredAlignment(
  rows: AuthoredAlignment[],
): Record<string, unknown>[] {
  return rows.map((r) => ({
    type: ["Alignment"],
    targetName: r.target_name,
    targetUrl: r.target_url,
    ...(r.target_type ? { targetType: r.target_type } : {}),
    ...(r.target_code ? { targetCode: r.target_code } : {}),
    ...(r.target_framework ? { targetFramework: r.target_framework } : {}),
    ...(r.target_description
      ? { targetDescription: r.target_description }
      : {}),
  }));
}

export function buildAuthoredResults(
  rows: AuthoredResult[],
  achievementId: string,
): Record<string, unknown>[] {
  return rows.map((r, i) => ({
    id: `${achievementId}#result-${i + 1}`,
    type: ["ResultDescription"],
    name: r.result_type,
    resultType: r.result_type,
    ...(r.required_value !== null ? { requiredValue: r.required_value } : {}),
    ...(r.required_level !== null ? { requiredLevel: r.required_level } : {}),
    ...(r.value_min !== null ? { valueMin: r.value_min } : {}),
    ...(r.value_max !== null ? { valueMax: r.value_max } : {}),
    ...(r.allowed_values && r.allowed_values.length
      ? { allowedValue: r.allowed_values }
      : {}),
  }));
}

export interface AchievementInput {
  /** achievements.code -- the URL segment, NOT necessarily a certification. */
  certCode: string;
  certName: string;
  description: string | null;
  /** certification_i18n.claim — the 17024 competence statement. */
  claim: string | null;
  passingScorePct: number | null;
  numQuestions: number | null;
  validityDays: number | null;
  domains: SnapshotDomain[];
  issuer: IssuerRow;
  siteUrl: string;

  /**
   * OB 3.0 achievementType, from achievements.achievement_type.
   *
   * REQUIRED, not defaulted. This was hardcoded "Certificate" and every
   * certification signed under it understated itself. It is the one
   * machine-readable field distinguishing a certification decision from a
   * course completion, which is exactly what a partner must not be able to
   * blur -- so it is passed explicitly, from a column, every time.
   */
  achievementType: string;

  /**
   * The badge artwork. NULL omits the property entirely rather than pointing
   * at a URL that 404s: a consumer reading `image` expects an image, and an
   * achievement with no artwork is better described as having none.
   */
  imageUrl: string | null;

  /**
   * Where `criteria.id` points. NULL OMITS THE PROPERTY -- there is no
   * fallback, deliberately. The builder cannot know whether a page exists at
   * any guessed URL, and a criteria.id that 404s is worse than none: it claims
   * documentation for what the holder did and then fails to produce it.
   */
  criteriaUrl?: string | null;

  /** achievement_alignments, unioned with anything derived from a JTA. */
  authoredAlignments?: AuthoredAlignment[];

  /** achievement_results, unioned with the exam-parameter result below. */
  authoredResults?: AuthoredResult[];
}

/**
 * The Achievement definition — what the certification requires, independent of
 * any holder. Referenced by every credential awarded for it.
 */
export function buildAchievement(a: AchievementInput): Record<string, unknown> {
  // IDENTIFIER -> base_url. The image and criteria below stay on siteUrl.
  const id = achievementUrl(a.issuer, a.certCode);

  const doc: Record<string, unknown> = {
    "@context": VC_CONTEXT,
    id,
    type: ["Achievement"],
    name: a.certName,
    achievementType: a.achievementType,
    // THE BADGE. Optional in the specification, and the field every consuming
    // platform reads to display anything at all. Without it a holder who imports
    // this credential into LinkedIn or a wallet gets text, while ten badge files
    // sit in the web app rendering only on Certidemy's own verify page.
    //
    // Built from the code, the same way the verify page builds it, so a new
    // certification needs no registration step - drop <CODE>.png into
    // public/badges and the credential carries it.
    //
    // The Achievement document is served live and unsigned, so credentials
    // already issued keep the snapshot they were signed with. Their signatures
    // are untouched; newly issued ones carry the image.
    // The competence statement is the criterion: it is what the holder
    // demonstrated, in one sentence, and it is the field a 17024 credential
    // cannot omit. For an achievement with no certification behind it, the
    // narrative is achievements.criteria_narrative, which migration 234
    // requires to be non-empty before that achievement can go active.
    criteria: {
      // id is OPTIONAL in OB 3.0 and is emitted only when there is a real page
      // behind it. This used to fall back to a Certidemy certifications URL,
      // which exists for our schemes and does NOT exist for a partner's -- so
      // every partner credential carried a 404 inside the signed document,
      // asserting that documentation exists where it does not. The caller now
      // supplies the URL or nothing.
      ...(a.criteriaUrl ? { id: a.criteriaUrl } : {}),
      narrative: a.claim ??
        `Awarded on passing the ${a.certCode} examination against its published blueprint.`,
    },
    creator: {
      id: issuerUrl(a.issuer),
      type: ["Profile"],
      name: a.issuer.name,
    },
  };

  // THE BADGE. Optional in the specification, and the field every consuming
  // platform reads to display anything at all. Without it a holder who imports
  // this credential into LinkedIn or a wallet gets text.
  //
  // Emitted only when there is one. A property pointing at a 404 is worse than
  // an absent property, because a consumer cannot tell the difference until it
  // renders a broken image next to somebody's name.
  if (a.imageUrl) {
    doc.image = { id: a.imageUrl, type: "Image" };
  }

  // A UNION, not a branch. Derived-from-JTA and authored-by-hand are the same
  // property; one list is empty on either path. Emitted only when non-empty --
  // `alignment: []` asserts "aligned to nothing", which is a different and
  // wrong claim.
  const alignment = [
    ...buildAlignment(a.domains, a.certCode, a.siteUrl),
    ...buildAuthoredAlignment(a.authoredAlignments ?? []),
  ];
  if (alignment.length > 0) doc.alignment = alignment;

  if (a.description) doc.description = a.description;

  // Exam parameters as a result description. Published, checkable, and the
  // thing a buyer comparing two credentials actually wants. Unioned with any
  // authored results, so an achievement can carry both a pass mark and a
  // rubric without either builder knowing about the other.
  const results: Record<string, unknown>[] = [];
  if (a.passingScorePct !== null) {
    results.push({
      id: `${id}#result`,
      type: ["ResultDescription"],
      name: "Examination score",
      resultType: "Percent",
      requiredValue: String(a.passingScorePct),
      ...(a.numQuestions ? { "certidemy:formLength": a.numQuestions } : {}),
    });
  }
  results.push(...buildAuthoredResults(a.authoredResults ?? [], id));
  if (results.length > 0) doc.resultDescription = results;

  if (a.validityDays && a.validityDays > 0) {
    doc["certidemy:validityDays"] = a.validityDays;
  }

  return doc;
}

export interface CredentialInput {
  credentialCode: string;
  holderName: string;
  /**
   * Salted hash of the holder's email, and the salt it was computed with.
   *
   * NULL FOR ANONYMOUS VIEWERS. Passing null omits `identifier[]` entirely and
   * produces a different — separately signed — document.
   *
   * Why the split. OB 3.0 verification is hash(email + salt), and the salt must
   * be published or the identifier is decorative: nobody could ever check it.
   * But publishing both makes CONFIRMATION-OF-A-GUESS possible — hash a
   * suspected address with that salt and compare. Extraction is still
   * infeasible; confirmation is not.
   *
   * All six real credentials belong to external learners using personal
   * addresses, so that confirmation is a genuine disclosure about a real person
   * to any stranger holding a verify link. Acceptable to the subject; not to a
   * stranger. So the holder gets it and the public does not.
   *
   * A field CANNOT be stripped after signing — the copy would fail
   * verification. These are two genuinely different documents with two proofs,
   * which is why this is a build-time input rather than a response filter.
   */
  subject: { identifierHash: string; salt: string } | null;
  issuedAt: string;
  expiresAt: string | null;
  statusListIndex: number;
  statusListId: string;
  achievement: Record<string, unknown>;
  issuer: IssuerRow;
  siteUrl: string;
  jtaVersion: string | null;
}

/**
 * The signed credential for one holder. Returned UNSIGNED — the caller attaches
 * the proof, so this stays a pure function and the key never reaches it.
 *
 * `awardedDate` is when the person earned it and never changes. `validFrom` is
 * when THIS document was issued and moves if the material changes — a spelling
 * fix produces a document reading "awarded March, this version issued August",
 * which is exactly right: the achievement history is intact, only the document
 * is new.
 */
export function buildCredential(c: CredentialInput): Record<string, unknown> {
  const doc: Record<string, unknown> = {
    "@context": VC_CONTEXT,
    id: credentialUrl(c.issuer, c.credentialCode),
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    name: (c.achievement.name as string) ?? c.credentialCode,
    issuer: {
      id: issuerUrl(c.issuer),
      type: ["Profile"],
      name: c.issuer.name,
      url: c.issuer.site_url,
    },
    validFrom: c.issuedAt,
    credentialSubject: {
      type: ["AchievementSubject"],
      // When the person EARNED it. Never changes, even if the document is
      // re-signed after a spelling correction. validFrom above is the same
      // date and stays put for the same reason: a name fix must not make a
      // credential look newly valid.
      awardedDate: c.issuedAt,
      // Present only for the holder. See CredentialInput.subject.
      ...(c.subject
        ? {
          identifier: [
            {
              type: "IdentityObject",
              identityType: "emailAddress",
              hashed: true,
              salt: c.subject.salt,
              identityHash: c.subject.identifierHash,
            },
          ],
        }
        : {}),
      achievement: c.achievement,
    },
    credentialStatus: {
      id: `${c.statusListId}#${c.statusListIndex}`,
      type: "BitstringStatusListEntry",
      statusPurpose: "revocation",
      statusListIndex: String(c.statusListIndex),
      statusListCredential: c.statusListId,
    },
    // The verify page: same credential, human representation.
    "certidemy:humanVerificationUrl": `${c.siteUrl}/verify/${c.credentialCode}`,
    "certidemy:holderName": c.holderName,
  };

  if (c.expiresAt) doc.validUntil = c.expiresAt;
  if (c.jtaVersion) doc["certidemy:jtaVersion"] = c.jtaVersion;

  return doc;
}

/* ========================================================================== *
 * Bitstring Status List
 * ========================================================================== */

/**
 * Build the revocation bitstring: one bit per credential, 1 = revoked.
 *
 * This is why a status change never requires re-signing. A verifier holding a
 * copy from six months ago fetches this list, checks its bit, and sees the
 * revocation — without the credential itself changing by a single byte.
 *
 * Minimum 16KB (131,072 bits) per spec, so a small issuer's list does not leak
 * how many credentials exist by its length alone.
 */
export async function buildStatusBitstring(
  revokedIndices: number[],
  minBits = 131072,
): Promise<string> {
  const maxIndex = revokedIndices.length > 0 ? Math.max(...revokedIndices) : 0;
  const bits = Math.max(minBits, (Math.floor(maxIndex / 8) + 1) * 8);
  const bytes = new Uint8Array(bits / 8);

  for (const idx of revokedIndices) {
    if (idx < 0) continue;
    // Most-significant-bit-first within each byte, per the spec.
    bytes[idx >> 3] |= 0x80 >> (idx & 7);
  }

  const gzipped = new Response(
    new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip")),
  );
  return base64url(new Uint8Array(await gzipped.arrayBuffer()));
}

export function buildStatusListCredential(
  issuer: IssuerRow,
  listNumber: number,
  encodedList: string,
  validFrom: string,
): Record<string, unknown> {
  const id = statusListUrl(issuer, listNumber);
  return {
    // VC_CONTEXT, not credentials/v2 alone: the issuer block below uses the
    // OB 3.0 term "Profile", which is a relative @type reference without the
    // OB3 context and fails JSON-LD safe-mode validation.
    "@context": VC_CONTEXT,
    id,
    type: ["VerifiableCredential", "BitstringStatusListCredential"],
    issuer: { id: issuerUrl(issuer), type: ["Profile"], name: issuer.name },
    validFrom,
    credentialSubject: {
      id: `${id}#list`,
      type: "BitstringStatusList",
      statusPurpose: "revocation",
      encodedList,
    },
  };
}

/* ========================================================================== *
 * Subject identifier
 * ========================================================================== */

/**
 * Salted hash of the holder's email, in the form OB 3.0 specifies:
 * "sha256$" + hex(sha256(email + salt)), email lowercased and trimmed.
 *
 * The email never appears in the credential. A receiving HR system that already
 * holds the employee's address can recompute this and match; a stranger holding
 * the credential cannot recover the address from it.
 */
export async function hashSubjectIdentifier(
  email: string,
  salt: string,
): Promise<string> {
  const digest = await sha256(email.trim().toLowerCase() + salt);
  const hex = Array.from(digest)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `sha256$${hex}`;
}

export { effectiveStatus, isSignable };
export type { StatusInput };
