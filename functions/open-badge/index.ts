// GET /functions/v1/open-badge
//
// PUBLIC endpoint (deploy with --no-verify-jwt). Serves the four Open Badges
// 3.0 / W3C Verifiable Credentials documents:
//
//   ?doc=issuer                     -> the issuer Profile + public key
//   ?doc=achievement&cert=AIE-I     -> the Achievement definition
//   ?doc=credential&code=AIE-I-...  -> a holder's SIGNED credential
//   ?doc=status&list=1              -> the Bitstring Status List
//
// ============================== WHY ONE FUNCTION ===========================
//
// Four functions would mean four copies of the issuer lookup and four places
// the signing key is read. The signing path exists once, here.
//
// The canonical public URLs live on certidemy.com (/issuer, /achievements/CODE,
// /credentials/CODE, /status/N) as thin Next.js route handlers that proxy to
// this. Those URLs are the credential identifiers and must never move — a
// credential's `id` is a promise that the document stays fetchable there.
//
// ============================== SECURITY ===================================
//
// - The private key is read via issuer_get_signing_key (service_role only,
//   migration 186) and never leaves this function. Only the signature does.
// - SPECIMENS ARE REFUSED (404). A signed specimen would genuinely verify —
//   it really was signed by Certidemy — and a machine cannot see the amber
//   banner a human sees on the verify page. That is the credential-og fraud
//   vector (v4.5 §3) with a cryptographic guarantee bolted on.
// - Revoked and expired credentials ARE served. Their standing travels in the
//   status list and validUntil. A 404 on a revoked credential tells a verifier
//   nothing and invites them to trust a cached copy.
// - Only `available` certifications get an Achievement document. A draft cert's
//   blueprint is not a published claim.
// - No key -> refuse with 503. An unsigned credential that looks complete is
//   worse than no credential.
//
// ============================== CACHING ====================================
//
// Output is byte-stable: the proof's `created` comes from
// credentials.material_updated_at, not the clock. Two fetches a month apart
// return identical bytes, so these are genuinely cacheable. The status list is
// the exception — it changes on every revocation and is served no-store.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { BADGE_B64 } from "../_shared/badges.ts";
import { bakeCredentialIntoPng, b64ToBytes } from "../_shared/png-bake.ts";
import {
  buildAchievement,
  buildCredential,
  buildIssuerProfile,
  buildStatusBitstring,
  buildStatusListCredential,
  hashSubjectIdentifier,
  isSignable,
  signDocument,
  statusListUrl,
  type AuthoredAlignment,
  type AuthoredResult,
  type IssuerRow,
  type SnapshotDomain,
} from "../_shared/ob3.ts";

/**
 * The issuer slug comes from the request, not a constant, so a partner issuer
 * resolves without a redeploy. Absent -> "certidemy", which is what the existing
 * certidemy.com proxy routes send.
 */
const DEFAULT_ISSUER_SLUG = "certidemy";

/** Credentials are JSON-LD, not plain JSON. Consumers sniff this. */
const LD_JSON = "application/vc+ld+json";

function ldResponse(
  body: unknown,
  cache: string,
  status = 200,
  // The anchor proof is plain JSON, not a verifiable credential. Sending it as
  // application/vc+ld+json would tell a consumer it is one.
  contentType: string = LD_JSON,
): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": `${contentType}; charset=utf-8`,
      "cache-control": cache,
    },
  });
}

/** One day at the edge; the documents only change when material changes. */
const CACHE_STABLE = "public, max-age=3600, s-maxage=86400";
const CACHE_NEVER = "no-store";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "GET") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  try {
    const url = new URL(req.url);
    const doc = (url.searchParams.get("doc") ?? "issuer").toLowerCase();
    const issuerSlug = (url.searchParams.get("issuer") ?? DEFAULT_ISSUER_SLUG)
      .trim()
      .toLowerCase();
    const svc = getServiceClient();

    // ---- Issuer, always. Every document names it. -----------------------
    const { data: issuerRow, error: issuerErr } = await svc
      .from("issuers")
      .select(
        "id, slug, name, site_url, base_url, issuer_url, key_id, public_key_multibase, key_created_at",
      )
      .eq("slug", issuerSlug)
      .eq("is_active", true)
      .maybeSingle();

    if (issuerErr) throw new Error(`issuer lookup: ${issuerErr.message}`);
    if (!issuerRow) return jsonResponse({ error: "issuer not configured" }, 503);

    const issuer = issuerRow as IssuerRow;
    const siteUrl = issuer.site_url;

    /* ------------------------------------------------------------ issuer -- */

    if (doc === "issuer") {
      return ldResponse(buildIssuerProfile(issuer), CACHE_STABLE);
    }

    /* ------------------------------------------------------- achievement -- */

    if (doc === "achievement") {
      const cert = url.searchParams.get("cert");
      if (!cert) return jsonResponse({ error: "cert required" }, 400);

      // OWNERSHIP, before anything is built. loadAchievement resolves by
      // certification code alone, so without this an issuer could serve another
      // issuer's Achievement under its own namespace with itself as `creator`.
      // The achievements table is the ownership record (migration 231).
      const { data: owned, error: ownedErr } = await svc
        .from("achievements")
        .select("id")
        .eq("issuer_id", issuer.id)
        .eq("code", cert.trim())
        .maybeSingle();
      if (ownedErr) throw new Error(`achievement ownership: ${ownedErr.message}`);
      if (!owned) return jsonResponse({ error: "not found" }, 404);

      const achievement = await loadAchievement(svc, owned.id, issuer);
      if (!achievement) return jsonResponse({ error: "not found" }, 404);

      // The definition is NOT signed. It describes what a certification
      // requires today and is expected to change as the JTA versions; a
      // signature would assert permanence it does not have. What is signed is
      // the credential, which pins its own snapshot of this.
      return ldResponse(achievement, CACHE_STABLE);
    }

    /* -------------------------------------------------------- credential -- */

    /* ?doc=credential returns the JSON-LD document.
       ?doc=baked returns the SAME document embedded in the badge PNG.

       ONE BRANCH, deliberately. Everything below -- the specimen refusal, the
       bearer-token viewer check that decides whether the salted identifier is
       present, and the cache split that keeps the holder's copy out of shared
       caches -- applies identically to both. A parallel branch would be a second
       copy of three rules that must not diverge. */
    if (doc === "credential" || doc === "baked") {
      const code = url.searchParams.get("code");
      if (!code) return jsonResponse({ error: "code required" }, 400);

      const { data: cred, error: credErr } = await svc
        .from("credentials")
        .select(
          "id, credential_code, user_id, issuer_id, achievement_id, holder_email, certification_code, holder_name, issued_at, expires_at, status, is_specimen, subject_salt, status_list_index, material_updated_at, jta_version_id",
        )
        .eq("credential_code", code.trim().toUpperCase())
        .maybeSingle();

      if (credErr) throw new Error(`credential lookup: ${credErr.message}`);
      if (!cred) return jsonResponse({ error: "not found" }, 404);

      // Specimen check FIRST, through the shared rule. Never re-derived here.
      if (!isSignable(cred)) {
        return jsonResponse({ error: "not found" }, 404);
      }

      // ---- THE ISSUER IS THE CREDENTIAL'S OWN, NEVER THE QUERY PARAMETER --
      //
      // Everything below -- the Achievement, the status list, the issuer block
      // and THE SIGNING KEY -- resolves from credentials.issuer_id. Reading it
      // from ?issuer= instead meant any caller could request any credential
      // under any issuer slug and receive a validly-signed document naming an
      // issuer that never issued it. The database triggers that keep issuer_id
      // honest are upstream of this; a document assembled at read time is out
      // of their reach, so the check has to live here.
      const { data: credIssuerRow, error: credIssuerErr } = await svc
        .from("issuers")
        .select(
          "id, slug, name, site_url, base_url, issuer_url, key_id, public_key_multibase, key_created_at",
        )
        .eq("id", cred.issuer_id)
        .maybeSingle();
      if (credIssuerErr) {
        throw new Error(`credential issuer lookup: ${credIssuerErr.message}`);
      }
      if (!credIssuerRow) {
        throw new Error(
          `credential ${cred.credential_code} names issuer ${cred.issuer_id}, ` +
            `which does not exist`,
        );
      }
      const credIssuer = credIssuerRow as IssuerRow;

      const achievement = await loadAchievement(
        svc,
        cred.achievement_id,
        credIssuer,
        cred.jta_version_id,
      );
      if (!achievement) {
        throw new Error(
          `credential ${cred.credential_code} references achievement ` +
            `${cred.achievement_id}, which could not be built`,
        );
      }

      // ---- Who is asking? ------------------------------------------------
      //
      // The subject identifier (salted email hash) goes ONLY to the holder.
      // Everyone else gets a separately-signed document without it — see
      // CredentialInput.subject in _shared/ob3.ts for why.
      //
      // The viewer is established by VERIFYING A BEARER TOKEN here. It is never
      // taken from a query parameter: `?viewer=<uuid>` would let anyone claim
      // to be anyone and would be a straightforward PII disclosure. The proxy
      // route forwards the caller's own Supabase session token; this function
      // asks Supabase Auth who that token belongs to.
      let viewerId: string | null = null;
      const authHeader = req.headers.get("authorization");
      if (authHeader?.toLowerCase().startsWith("bearer ")) {
        const token = authHeader.slice(7).trim();
        // Anon-key calls carry a bearer token too, and it is not a user — a
        // failed lookup simply means "not the holder", which is the safe default.
        const { data: viewer } = await svc.auth.getUser(token);
        viewerId = viewer?.user?.id ?? null;
      }

      const isHolder = viewerId !== null && viewerId === cred.user_id;

      // FROM THE COLUMN, not from auth. credentials.holder_email is snapshotted
      // at mint (migration 231), so the hash a verifier checks today is the one
      // that was computed then -- an account email change must not silently
      // invalidate every identifier a holder has already published. It is also
      // the only source that exists before the account does, which is what an
      // issue-to-email-then-claim credential requires.
      let subject: { identifierHash: string; salt: string } | null = null;
      if (isHolder && cred.holder_email) {
        subject = {
          identifierHash: await hashSubjectIdentifier(
            cred.holder_email,
            cred.subject_salt,
          ),
          salt: cred.subject_salt,
        };
      }

      const statusListId = statusListUrl(credIssuer, 1);

      const unsigned = buildCredential({
        credentialCode: cred.credential_code,
        holderName: cred.holder_name,
        subject,
        issuedAt: cred.issued_at,
        expiresAt: cred.expires_at,
        statusListIndex: cred.status_list_index,
        statusListId,
        achievement,
        issuer: credIssuer,
        siteUrl: credIssuer.site_url,
        jtaVersion: (achievement["certidemy:jtaVersion"] as string) ?? null,
      });

      const privateKey = await readSigningKey(svc, credIssuer.slug);
      if (!privateKey) {
        return jsonResponse(
          { error: "issuer has no signing key; credential cannot be issued" },
          503,
        );
      }

      const signed = await signDocument(
        unsigned,
        privateKey,
        credIssuer,
        // Stable by construction — see the caching note at the top.
        new Date(cred.material_updated_at).toISOString(),
      );

      // CACHING IS VIEWER-DEPENDENT AND THIS MATTERS.
      //
      // The public document is byte-stable and safely cacheable at the edge.
      // The holder document contains the subject identifier and MUST NOT enter
      // a shared cache — a CDN that stored it would serve it to the next
      // anonymous visitor, which is exactly the disclosure this split exists to
      // prevent. `private` keeps it in the holder's own browser only.
      const cache = isHolder ? "private, no-store" : CACHE_STABLE;

      if (doc === "baked") {
        /* Open Badges 3.0 s10 baking. The credential travels INSIDE the image,
           so a holder can email one file and any OB3-aware system extracts it,
           resolves the issuer, checks the signature and reads the status list --
           without contacting us and without trusting us.

           404 rather than a blank image when the artwork is missing: a badge
           file with no badge in it reads as a broken credential, and it is the
           holder who gets blamed when they share it. */
        const art = BADGE_B64[cred.certification_code];
        if (!art) return jsonResponse({ error: "not found" }, 404);

        let baked: Uint8Array;
        try {
          baked = bakeCredentialIntoPng(
            b64ToBytes(art),
            JSON.stringify(signed),
          );
        } catch (err) {
          // A bake failure is ours, not the caller's. Never serve the bare
          // badge as a fallback -- an image that looks like a credential and
          // carries nothing is the worst possible artifact to hand someone.
          console.error("bake failed:", err);
          return jsonResponse({ error: "badge could not be prepared" }, 500);
        }

        // Deno 2.x tightened Uint8Array's generic: BodyInit wants
        // Uint8Array<ArrayBuffer>, and concat() produces ArrayBufferLike.
        // Response accepts the bytes at runtime. Same cast as credential-og.
        return new Response(baked as unknown as BodyInit, {
          status: 200,
          headers: {
            ...corsHeaders,
            "content-type": "image/png",
            // SAME cache semantics as the document. The holder's baked badge
            // carries their salted identifier and must never enter a shared
            // cache -- here it would be inside a file people pass around.
            "cache-control": cache,
            vary: "authorization",
            "content-disposition":
              `attachment; filename="${cred.credential_code}.png"`,
          },
        });
      }

      return ldResponse(signed, cache);
    }

    /* ------------------------------------------------------------ anchor -- */
    /* The Merkle inclusion proof. NOT a credential and NOT signed -- see the
       patch header. A verifier hashes the credential, combines it with the
       siblings below, and compares the result to what is on chain. */
    if (doc === "anchor") {
      const code = url.searchParams.get("code");
      if (!code) return jsonResponse({ error: "code required" }, 400);

      const { data: cred, error: credErr } = await svc
        .from("credentials")
        .select(
          "credential_code, anchor_leaf, anchor_path, is_specimen, anchor_id, credential_anchors(merkle_root, doc_version, built_at, chain, txid, anchored_at, btc_block_hash, btc_block_height)",
        )
        .eq("credential_code", code.trim().toUpperCase())
        .maybeSingle();

      if (credErr) throw new Error(`anchor lookup: ${credErr.message}`);
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
        btc_block_hash: string | null;
        btc_block_height: number | null;
      } | null;

      if (!anchor) throw new Error("anchor row missing for a linked credential");

      return ldResponse(
        {
          credential: `${issuer.base_url}/credentials/${cred.credential_code}`,
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
          /* THE BLOCK, in the form a reader can check independently.

             blockHash is what a block explorer URL takes, and it is the
             explorer-independent artifact: someone running their own node
             needs this and nothing from any website.

             NO EXPLORER URL IS EMITTED. Any explorer is somebody's company,
             and naming one here would make a private party part of the
             verification story for every credential. The client picks a link;
             this returns the fact.

             Null until the OpenTimestamps calendars aggregate into a Bitcoin
             transaction and that transaction confirms -- hours, sometimes a
             day. Null here means pending, not missing. */
          blockHash: anchor.btc_block_hash,
          blockHeight: anchor.btc_block_height,
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

    /* ------------------------------------------------------------ status -- */

    if (doc === "status") {
      const listNumber = Number(url.searchParams.get("list") ?? "1");
      if (!Number.isInteger(listNumber) || listNumber < 1) {
        return jsonResponse({ error: "invalid list" }, 400);
      }

      // Only genuine credentials occupy bits. Specimens are never issued as
      // credentials, so their indices stay 0 and are never consulted.
      const { data: revoked, error: revErr } = await svc
        .from("credentials")
        .select("status_list_index")
        .eq("status", "revoked")
        .eq("issuer_id", issuer.id)
        .eq("is_specimen", false);

      if (revErr) throw new Error(`status list: ${revErr.message}`);

      const indices = (revoked ?? []).map(
        (r: { status_list_index: number }) => r.status_list_index,
      );
      const encodedList = await buildStatusBitstring(indices);

      const unsigned = buildStatusListCredential(
        issuer,
        listNumber,
        encodedList,
        new Date().toISOString(),
      );

      const privateKey = await readSigningKey(svc, issuerSlug);
      if (!privateKey) {
        return jsonResponse({ error: "issuer has no signing key" }, 503);
      }

      // The status list IS signed — otherwise anyone could serve a list of
      // zeroes and un-revoke every credential Certidemy ever withdrew.
      const signed = await signDocument(
        unsigned,
        privateKey,
        issuer,
        unsigned.validFrom as string,
      );

      return ldResponse(signed, CACHE_NEVER);
    }

    return jsonResponse({ error: `unknown doc "${doc}"` }, 400);
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "open badge generation failed" }, 500);
  }
});

/* ========================================================================== *
 * Helpers
 * ========================================================================== */

// deno-lint-ignore no-explicit-any
type Svc = any;

async function readSigningKey(svc: Svc, slug: string): Promise<string | null> {
  const { data, error } = await svc.rpc("issuer_get_signing_key", {
    p_slug: slug,
  });
  if (error) throw new Error(`issuer_get_signing_key: ${error.message}`);
  return (data as string | null) ?? null;
}

/**
 * Build the Achievement for a certification.
 *
 * TWO SNAPSHOTS, TWO MOMENTS, BOTH CORRECT (v5.8 §3):
 *
 * When jtaVersionId is given (a credential), domains come from that version's
 * blueprint_snapshot — what the holder was actually assessed against. Reading
 * live rows would silently rewrite every issued credential each time the JTA
 * versions.
 *
 * But the certification NAME comes from the live row, never from the snapshot.
 * AIMS-F's v2.0 snapshot still says "ISO/IEC 42001 Foundation" because
 * migration 180 added edition years afterwards and snapshots are deliberately
 * not rewritten. Taking the name from there would stamp a stale product name
 * onto every signed credential.
 *
 * When jtaVersionId is null (the public definition), domains come from the
 * current published version — the definition describes what the certification
 * requires today.
 */
async function loadAchievement(
  svc: Svc,
  achievementId: string,
  issuer: IssuerRow,
  jtaVersionId?: string | null,
): Promise<Record<string, unknown> | null> {
  const siteUrl = issuer.site_url;

  const { data: ach, error: achErr } = await svc
    .from("achievements")
    .select(
      "id, code, name, description, achievement_type, certification_id, " +
        "criteria_narrative, criteria_url, image_path, status, " +
        "default_validity_days, " +
        "achievement_alignments(target_name, target_url, target_framework, target_code, target_description, target_type, order_index), " +
        "achievement_results(result_type, required_value, required_level, value_min, value_max, allowed_values, order_index)",
    )
    .eq("id", achievementId)
    .maybeSingle();
  if (achErr) throw new Error(`achievement lookup: ${achErr.message}`);
  if (!ach) return null;

  const authoredAlignments = ((ach.achievement_alignments ?? []) as
    (AuthoredAlignment & { order_index: number })[])
    .slice()
    .sort((x, y) => x.order_index - y.order_index);
  const authoredResults = ((ach.achievement_results ?? []) as
    (AuthoredResult & { order_index: number })[])
    .slice()
    .sort((x, y) => x.order_index - y.order_index);

  /* ---------------------------------------------------------------------- *
   * NO CERTIFICATION BEHIND IT -- a partner's own achievement.
   *
   * No JTA, no blueprint snapshot, no competence claim. That is not a lesser
   * document, it is a different one: "attended this course" is a fact about
   * attendance, and dressing it in certification apparatus would be the exact
   * blurring the achievement_type vocabulary exists to prevent.
   * ---------------------------------------------------------------------- */
  if (!ach.certification_id) {
    // A draft achievement's definition is not a published claim. Credentials
    // are exempt for the same reason certifications are: an achievement can be
    // archived after issuance without breaking credentials already in the world.
    if (!jtaVersionId && ach.status !== "active") return null;

    return buildAchievement({
      certCode: ach.code,
      certName: ach.name,
      description: ach.description ?? null,
      claim: ach.criteria_narrative ?? null,
      passingScorePct: null,
      numQuestions: null,
      validityDays: ach.default_validity_days ?? null,
      domains: [],
      issuer,
      siteUrl,
      achievementType: ach.achievement_type,
      imageUrl: ach.image_path ?? null,
      criteriaUrl: ach.criteria_url ?? null,
      authoredAlignments,
      authoredResults,
    });
  }

  /* ---------------------------------------------------------------------- *
   * CERTIFICATION-BACKED -- everything below is the original path, fetched by
   * id rather than by an ilike on the code.
   * ---------------------------------------------------------------------- */
  const { data: cert } = await svc
    .from("certifications")
    .select(
      "id, code, name, description, status, passing_score_pct, num_questions, validity_days",
    )
    .eq("id", ach.certification_id)
    .maybeSingle();

  if (!cert) return null;
  // A draft certification's blueprint is not a published claim. Credentials
  // pass their own jta_version_id and bypass this — a cert can be withdrawn
  // after issuance without breaking credentials already in the world.
  if (!jtaVersionId && cert.status !== "available") return null;

  let snapshotQuery = svc
    .from("jta_versions")
    .select("id, version_string, status, blueprint_snapshot")
    .eq("certification_id", cert.id);

  snapshotQuery = jtaVersionId
    ? snapshotQuery.eq("id", jtaVersionId)
    : snapshotQuery.eq("status", "published").order("created_at", {
      ascending: false,
    }).limit(1);

  const { data: versionRows } = await snapshotQuery;
  const version = (versionRows ?? [])[0];
  if (!version?.blueprint_snapshot) return null;

  const snapshot = version.blueprint_snapshot as {
    domains?: SnapshotDomain[];
  };

  // The English competence statement — the 17024 claim the credential asserts.
  //
  // The column is `lang`, not `language`. An earlier version queried the wrong
  // name and the failure was INVISIBLE: PostgREST returns an error object
  // rather than throwing, `i18n?.claim` on a failed query is undefined, `??`
  // turned it into null, and buildAchievement substituted its generic fallback
  // narrative. Every smoke test passed against a document whose single most
  // important sentence was boilerplate.
  //
  // Hence: the error is checked and thrown, and a published certification with
  // no claim is a hard failure rather than a quiet downgrade. This field is the
  // competence statement a 17024 credential cannot omit (v5.8 §2).
  const { data: i18n, error: i18nErr } = await svc
    .from("certification_i18n")
    .select("claim")
    .eq("certification_id", cert.id)
    .eq("lang", "en")
    .maybeSingle();

  if (i18nErr) {
    throw new Error(`certification_i18n lookup for ${cert.code}: ${i18nErr.message}`);
  }

  const claim = i18n?.claim ?? null;
  if (!claim && cert.status === "available") {
    throw new Error(
      `certification ${cert.code} is available but has no English claim. ` +
        `The claim is the competence statement the credential asserts; ` +
        `emitting a generic narrative in its place would understate the credential.`,
    );
  }

  const achievement = buildAchievement({
    // achievementType from the ROW. Hardcoded "Certificate" until now, which
    // understated every certification this platform has ever signed.
    achievementType: ach.achievement_type,
    // Built from the code, the same way the verify page builds it, so a new
    // certification needs no registration step - drop <CODE>.png into
    // public/badges and the credential carries it.
    imageUrl: `${siteUrl}/badges/${cert.code}.png`,
    criteriaUrl: null,
    authoredAlignments,
    authoredResults,
    certCode: cert.code,
    certName: cert.name, // live row, NOT the snapshot — see the note above
    description: cert.description ?? null,
    claim,
    passingScorePct: cert.passing_score_pct !== null
      ? Number(cert.passing_score_pct)
      : null,
    numQuestions: cert.num_questions ?? null,
    validityDays: cert.validity_days ?? null,
    domains: snapshot.domains ?? [],
    issuer,
    siteUrl,
  });

  if (version.version_string) {
    achievement["certidemy:jtaVersion"] = version.version_string;
  }

  return achievement;
}
