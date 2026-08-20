#!/usr/bin/env node
/**
 * test-partner-issuer.mjs
 *
 * Drives the partner issuer lifecycle end to end and asserts specific expected
 * values at every step. No devtools, no hand-built curl, no pasted JWT.
 *
 * WHAT IT PROVES
 *   1. create-partner-issuer refuses a reserved slug            -> 400
 *   2. it refuses a malformed slug                              -> 400
 *   3. it refuses a non-https site_url                          -> 400
 *   4. it creates a DRAFT with a 64-hex verification token      -> 200
 *   5. a second issuer for the same company is refused          -> 409
 *   6. verify fails when the well-known file is absent          -> 422
 *   7. activate refuses an unverified issuer                    -> 422
 *   8. with the file published, verify                          -> verified
 *   9. activate mints a key                                     -> z6Mk...
 *  10. re-activation is refused                                 -> 409
 *  11. the LIVE issuer Profile publishes that same key
 *  12. the published key parses as a 32-byte Ed25519 key
 *
 * Steps 1-7 need nothing published anywhere. A function that refuses correctly
 * is most of the evidence that it works.
 *
 * ============================== RESUMING ==================================
 *
 * Each run creates a FRESH company, so a later run cannot re-use a slug an
 * earlier run reserved: the slug belongs to the earlier company's draft. That
 * is correct, and it makes resuming awkward -- hence --issuer-id.
 *
 *   --issuer-id <uuid>   skip company and draft creation, resume at verify
 *
 * The token is shown ONCE, at creation, and no endpoint returns it again. A
 * resumed draft therefore only works while the well-known file still carries
 * ITS token; otherwise delete the draft and make a new one.
 *
 * ============================== AUTH ======================================
 *
 * Signs in with email and password for a REAL user JWT. The service role key is
 * not usable here: these functions call authenticate(), which resolves a user
 * id, and a service-role token has no user behind it.
 *
 * ============================== ENV =======================================
 *
 *   CERTIDEMY_ADMIN_EMAIL      a platform_admin login
 *   CERTIDEMY_ADMIN_PASSWORD   its password
 *   SUPABASE_ANON_KEY          the public anon key
 *
 * ============================== USAGE =====================================
 *
 *   node scripts/test-partner-issuer.mjs --refusals-only
 *   node scripts/test-partner-issuer.mjs --domain example.org --slug test-partner-01
 *   node scripts/test-partner-issuer.mjs --issuer-id <uuid>
 *   node scripts/test-partner-issuer.mjs --issuer-id <uuid> --activate
 *
 * ACTIVATION IS PERMANENT. --activate is required explicitly and the slug it
 * burns can never be reused or renamed.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pctynukndxnmnxiqpgck.supabase.co";
const FN = `${SUPABASE_URL}/functions/v1`;
const CRED_HOST = "https://credentials.certidemy.com";

const argv = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")
    ? argv[i + 1]
    : fallback;
};
const has = (name) => argv.includes(`--${name}`);

const REFUSALS_ONLY = has("refusals-only");
const DO_ACTIVATE = has("activate");
const RESUME_ID = flag("issuer-id");
const DOMAIN = flag("domain");
const SLUG = flag("slug");
const COMPANY_NAME = flag("company", `Test Partner ${Date.now()}`);

let pass = 0;
let fail = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log(
    `  ${ok ? "PASS" : "FAIL"}  ${name}: ${JSON.stringify(got)}` +
      (ok ? "" : ` (expected ${JSON.stringify(want)})`),
  );
  return ok;
};
const note = (s) => console.log(`        ${s}`);

/* Never process.exit() mid-flow. supabase-js keeps an open handle and Node on
   Windows aborts with a UV assertion before stdout has flushed -- which is how
   an earlier version of this script produced a crash instead of a result. */
function finish(extra) {
  console.log(`\n${pass} passed, ${fail} failed`);
  if (extra) console.log(`\n${extra}`);
  process.exitCode = fail === 0 ? 0 : 1;
}

const email = process.env.CERTIDEMY_ADMIN_EMAIL;
const password = process.env.CERTIDEMY_ADMIN_PASSWORD;
const anonKey = process.env.SUPABASE_ANON_KEY;

let bail = false;
if (!email || !password || !anonKey) {
  console.error("ABORT  set CERTIDEMY_ADMIN_EMAIL, CERTIDEMY_ADMIN_PASSWORD and SUPABASE_ANON_KEY");
  process.exitCode = 2;
  bail = true;
}
if (!bail && !REFUSALS_ONLY && !RESUME_ID && (!DOMAIN || !SLUG)) {
  console.error("ABORT  --domain and --slug required, unless --refusals-only or --issuer-id");
  process.exitCode = 2;
  bail = true;
}

if (!bail) await main();

async function main() {
  const anon = createClient(SUPABASE_URL, anonKey);
  const { data: session, error: authErr } = await anon.auth.signInWithPassword({
    email,
    password,
  });
  if (authErr || !session?.session?.access_token) {
    console.error(`ABORT  sign-in failed: ${authErr?.message ?? "no token"}`);
    process.exitCode = 1;
    return;
  }
  const JWT = session.session.access_token;
  console.log(`signed in as ${email}`);

  const call = async (fn, body) => {
    const res = await fetch(`${FN}/${fn}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${JWT}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    let json = null;
    try {
      json = await res.json();
    } catch { /* a non-JSON body is itself the finding */ }
    return { status: res.status, json };
  };

  let issuerId = RESUME_ID;
  let slug = SLUG;

  if (!RESUME_ID) {
    console.log("\n--- company ---");
    const co = await call("create-company", {
      name: COMPANY_NAME,
      admin_email: `admin+${Date.now()}@example.invalid`,
    });
    if (!check("create-company status", co.status, 200)) {
      console.error(JSON.stringify(co.json, null, 2));
      finish("Cannot continue without a company.");
      return;
    }
    const companyId = co.json?.company?.id;
    note(`company_id ${companyId}`);

    console.log("\n--- refusals (nothing published anywhere) ---");
    const reserved = await call("create-partner-issuer", {
      company_id: companyId, slug: "iso-certified", name: "X",
      site_url: "https://example.invalid", verification_domain: "example.invalid",
    });
    check("reserved slug rejected", reserved.status, 400);
    note(reserved.json?.error ?? "");

    const malformed = await call("create-partner-issuer", {
      company_id: companyId, slug: "Not_A_Slug", name: "X",
      site_url: "https://example.invalid", verification_domain: "example.invalid",
    });
    check("malformed slug rejected", malformed.status, 400);
    note(malformed.json?.error ?? "");

    const httpSite = await call("create-partner-issuer", {
      company_id: companyId, slug: "test-http-site", name: "X",
      site_url: "http://example.invalid", verification_domain: "example.invalid",
    });
    check("non-https site_url rejected", httpSite.status, 400);

    if (REFUSALS_ONLY) {
      finish(`Cleanup: company ${companyId} (no issuer was created).`);
      return;
    }

    console.log("\n--- draft ---");
    const created = await call("create-partner-issuer", {
      company_id: companyId, slug: SLUG, name: COMPANY_NAME,
      site_url: `https://${DOMAIN}`, verification_domain: DOMAIN,
    });
    if (!check("draft created", created.status, 200)) {
      console.error(JSON.stringify(created.json, null, 2));
      finish(
        created.status === 409
          ? "That slug is held by an earlier run's draft. Resume it with\n" +
            "  --issuer-id <uuid>\n" +
            "or delete the draft issuer and pick a new slug. The token is shown\n" +
            "only at creation, so a resumed draft needs the well-known file to\n" +
            "still carry ITS token."
          : `Cleanup: company ${companyId}.`,
      );
      return;
    }
    issuerId = created.json?.issuer?.id;
    const token = created.json?.verification?.file_contents;
    check("status is draft", created.json?.issuer?.status, "draft");
    check("token is 64 hex chars", /^[0-9a-f]{64}$/.test(token ?? ""), true);
    note(`issuer_id ${issuerId}`);
    note(`publish at ${created.json?.verification?.url}`);
    note(`file contents: ${token}`);

    const second = await call("create-partner-issuer", {
      company_id: companyId, slug: `${SLUG}-b`, name: "X",
      site_url: `https://${DOMAIN}`, verification_domain: DOMAIN,
    });
    check("second issuer for same company rejected", second.status, 409);
  } else {
    console.log(`\n--- resuming issuer ${RESUME_ID} ---`);
  }

  console.log("\n--- verification ---");
  const verify = await call("activate-partner-issuer", {
    issuer_id: issuerId,
    mode: "verify",
  });

  if (verify.status !== 200) {
    check("verify refuses without the published file", verify.status, 422);
    note(verify.json?.error ?? "");

    const early = await call("activate-partner-issuer", {
      issuer_id: issuerId, mode: "activate",
    });
    check("activate refuses an unverified issuer", early.status, 422);
    note(early.json?.error ?? "");

    finish(
      "Publish the token at the well-known URL, then re-run with\n" +
        `  --issuer-id ${issuerId}`,
    );
    return;
  }

  check("verify succeeded", verify.json?.status, "verified");
  note(`verified via ${verify.json?.verified_via}`);
  if (!slug) slug = verify.json?.slug;

  if (!DO_ACTIVATE) {
    finish(
      "Stopping before activation. ACTIVATION IS PERMANENT: the slug can never\n" +
        "be reused or renamed. To proceed:\n" +
        `  node scripts/test-partner-issuer.mjs --issuer-id ${issuerId} --activate`,
    );
    return;
  }

  console.log("\n--- activation (PERMANENT) ---");
  const act = await call("activate-partner-issuer", {
    issuer_id: issuerId, mode: "activate",
  });
  if (!check("activation succeeded", act.status, 200)) {
    console.error(JSON.stringify(act.json, null, 2));
    finish();
    return;
  }
  check("status active", act.json?.status, "active");
  slug = act.json?.slug ?? slug;
  const mb = act.json?.public_key_multibase ?? "";
  check("key is multibase base58btc", mb.startsWith("z"), true);
  check("key is the Ed25519 z6Mk form", mb.startsWith("z6Mk"), true);
  check("key length 48", mb.length, 48);

  const again = await call("activate-partner-issuer", {
    issuer_id: issuerId, mode: "activate",
  });
  check("re-activation refused", again.status, 409);

  console.log("\n--- the live issuer Profile, as a stranger sees it ---");
  const profRes = await fetch(`${CRED_HOST}/issuers/${slug}`, {
    headers: { accept: "application/vc+ld+json" },
  });
  if (!check("Profile resolves", profRes.status, 200)) {
    finish("Key minted but the Profile does not resolve. Investigate before issuing anything.");
    return;
  }
  const prof = await profRes.json();
  check("Profile id matches", prof?.id, `${CRED_HOST}/issuers/${slug}`);
  check("Profile is a Profile", prof?.type?.includes?.("Profile"), true);

  const vm = prof?.verificationMethod?.[0];
  check("verificationMethod present", !!vm, true);
  check("published key matches the one minted", vm?.publicKeyMultibase, mb);
  check("key type is Multikey", vm?.type, "Multikey");

  // Parse the published key with OUR OWN decoder, not the encoder that made it.
  const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const b58decode = (s) => {
    const out = [0];
    for (const ch of s) {
      const v = B58.indexOf(ch);
      if (v < 0) throw new Error(`bad base58 char ${ch}`);
      let carry = v;
      for (let i = 0; i < out.length; i++) {
        carry += out[i] * 58;
        out[i] = carry & 0xff;
        carry >>= 8;
      }
      while (carry > 0) {
        out.push(carry & 0xff);
        carry >>= 8;
      }
    }
    for (let i = 0; i < s.length && s[i] === B58[0]; i++) out.push(0);
    return new Uint8Array(out.reverse());
  };

  try {
    const decoded = b58decode((vm?.publicKeyMultibase ?? "z").slice(1));
    check("multicodec prefix is ed01", [decoded[0], decoded[1]], [0xed, 0x01]);
    check("key material is 32 bytes", decoded.length - 2, 32);
    const imported = await crypto.subtle
      .importKey("raw", decoded.slice(2), { name: "Ed25519" }, false, ["verify"])
      .then(() => true)
      .catch((e) => String(e));
    check("published key imports as Ed25519", imported, true);
  } catch (e) {
    check("published key decodes", String(e), "no error");
  }

  finish(`issuer ${slug} is ACTIVE and its key is resolvable by anyone.`);
}
