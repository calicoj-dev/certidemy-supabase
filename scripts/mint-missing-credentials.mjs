// mint-missing-credentials.mjs
//
// Mints a credential for every PASSED certification exam attempt that does not
// have one.
//
// WHY THIS EXISTS
// ---------------
// A passed attempt with no credential is a contradiction. The examination
// decision was made by the engine, recorded in exam_attempts, and stamped with
// the JTA version it was assessed against. Only the artifact failed to write.
// Re-sitting the exam would be the wrong remedy: it would discard a valid
// decision and charge the candidate a second seat for a defect that was ours.
//
// This does NOT make a certification decision. It reads one that exam_attempts
// already records, and issues the document that should have been issued at the
// moment of that decision.
//
// FIDELITY TO THE ORIGINAL MINT
// -----------------------------
//   issued_at   = the attempt's submitted_at, NOT now(). The credential is
//                 dated when the person earned it. A credential issued today
//                 for an exam passed in August would misstate the record and
//                 push expiry out by the length of our own outage.
//   expires_at  = issued_at + certifications.validity_days (days, not years --
//                 getFullYear()+1 on 29 February silently rolls to 1 March).
//   locale      = the language of the FORM as served, read from
//                 exam_session_items. Never a request-body claim.
//   holder_name = profiles.certificate_name -> profiles.full_name -> email ->
//                 placeholder. Same order as the scorer.
//   jta_version = carried from the attempt, not re-resolved. Re-resolving would
//                 stamp today's published JTA onto an exam sat against an
//                 earlier one.
//
// KNOWN DEBT: this duplicates the mint block in score-mock-exam. Two copies of
// one rule can diverge. Kept separate deliberately -- the scorer must not grow
// a reconciliation path, and this must not import from an edge function -- but
// if the mint shape changes, both change.
//
// USAGE
//   $env:SUPABASE_URL="https://pctynukndxnmnxiqpgck.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="<service role key>"
//
//   node mint-missing-credentials.mjs                  # dry run, exits 2
//   node mint-missing-credentials.mjs --apply          # writes
//   node mint-missing-credentials.mjs --attempt <uuid> # one attempt only
//
// Dry exits 2 rather than 0 so a skipped apply is visible in $LASTEXITCODE.

import { createClient } from "@supabase/supabase-js";

const URL_ =
  process.env.SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.PROJECT_URL;
const KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_KEY;

if (!URL_ || !KEY) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const ONLY_IDX = process.argv.indexOf("--attempt");
const ONLY = ONLY_IDX !== -1 ? process.argv[ONLY_IDX + 1] : null;

const svc = createClient(URL_, KEY, { auth: { persistSession: false } });

/** Human-friendly credential code, e.g. SM-AI-I-7K2M-9DQ4. No 0/O/1/I. */
function makeCredentialCode(certCode) {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const block = () =>
    Array.from(
      crypto.getRandomValues(new Uint8Array(4)),
      (b) => alphabet[b % alphabet.length],
    ).join("");
  return `${certCode.toUpperCase()}-${block()}-${block()}`;
}

function makeSalt() {
  return Array.from(
    crypto.getRandomValues(new Uint8Array(16)),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}

function addDays(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY RUN");
  console.log("");

  // ---- issuer ------------------------------------------------------------
  const { data: issuer, error: issErr } = await svc
    .from("issuers")
    .select("id, slug, name")
    .eq("slug", "certidemy")
    .eq("is_active", true)
    .maybeSingle();
  if (issErr) throw new Error(`issuer lookup: ${issErr.message}`);
  if (!issuer) throw new Error("no active issuer configured");
  console.log(`issuer: ${issuer.name} (${issuer.id})`);

  // ---- orphans -----------------------------------------------------------
  let q = svc
    .from("exam_attempts")
    .select(
      "id, user_id, certification_id, session_id, voucher_id, score_pct, submitted_at, jta_version_id",
    )
    .eq("passed", true);
  if (ONLY) q = q.eq("id", ONLY);
  const { data: passedAttempts, error: paErr } = await q;
  if (paErr) throw new Error(`exam_attempts: ${paErr.message}`);

  const { data: linked, error: lErr } = await svc
    .from("credentials")
    .select("exam_attempt_id")
    .not("exam_attempt_id", "is", null);
  if (lErr) throw new Error(`credentials: ${lErr.message}`);
  const haveCredential = new Set((linked ?? []).map((r) => r.exam_attempt_id));

  const orphans = (passedAttempts ?? []).filter((a) => !haveCredential.has(a.id));
  console.log(
    `passed attempts: ${passedAttempts?.length ?? 0}   orphaned: ${orphans.length}`,
  );
  console.log("");

  if (orphans.length === 0) {
    console.log("Nothing to mint.");
    process.exit(APPLY ? 0 : 2);
  }

  let minted = 0;
  let skipped = 0;

  for (const a of orphans) {
    console.log(`--- attempt ${a.id}`);
    console.log(`    scored ${a.score_pct}% at ${a.submitted_at}`);

    // cert
    const { data: cert, error: cErr } = await svc
      .from("certifications")
      .select("id, code, name, status, validity_days")
      .eq("id", a.certification_id)
      .single();
    if (cErr || !cert) {
      console.log(`    SKIP: certification not found`);
      skipped += 1;
      continue;
    }
    // Same lifecycle rule as the scorer: a freeze blocks new starts, but an
    // attempt already sat completes and mints.
    if (cert.status !== "available" && cert.status !== "unavailable") {
      console.log(`    SKIP: cert status "${cert.status}" is not mintable`);
      skipped += 1;
      continue;
    }

    // already holds an active credential for this cert?
    const { data: existing } = await svc
      .from("credentials")
      .select("id, credential_code")
      .eq("user_id", a.user_id)
      .eq("certification_id", a.certification_id)
      .eq("status", "active")
      .maybeSingle();
    if (existing) {
      console.log(
        `    SKIP: holder already has active ${existing.credential_code}`,
      );
      skipped += 1;
      continue;
    }

    // holder name -- scorer's order exactly
    let holder_name = "Certified Professional";
    const { data: prof } = await svc
      .from("profiles")
      .select("certificate_name, full_name")
      .eq("id", a.user_id)
      .maybeSingle();
    const picked =
      prof?.certificate_name?.trim() || prof?.full_name?.trim() || "";
    if (picked) {
      holder_name = picked;
    } else {
      const { data: u } = await svc.auth.admin.getUserById(a.user_id);
      holder_name = u?.user?.email ?? holder_name;
    }

    // locale = the language the FORM was served in
    let locale = "en";
    if (a.session_id) {
      const { data: items } = await svc
        .from("exam_session_items")
        .select("language")
        .eq("session_id", a.session_id)
        .limit(1);
      const lang = items?.[0]?.language ?? "en";
      locale = lang === "es-419" || lang === "pt-BR" ? lang : "en";
    }

    const days = Number(cert.validity_days) > 0 ? Number(cert.validity_days) : 365;
    const row = {
      credential_code: makeCredentialCode(cert.code),
      issuer_id: issuer.id,
      subject_salt: makeSalt(),
      user_id: a.user_id,
      certification_id: a.certification_id,
      exam_attempt_id: a.id,
      holder_name,
      certification_name: cert.name,
      certification_code: cert.code,
      score_pct: a.score_pct,
      locale,
      jta_version_id: a.jta_version_id,
      issued_at: a.submitted_at,
      expires_at: addDays(a.submitted_at, days),
    };

    console.log(`    holder  : ${holder_name}`);
    console.log(`    cert    : ${cert.code} -- ${cert.name}`);
    console.log(`    locale  : ${locale}`);
    console.log(`    code    : ${row.credential_code}`);
    console.log(`    issued  : ${row.issued_at}`);
    console.log(`    expires : ${row.expires_at} (${days}d)`);

    if (!APPLY) {
      console.log(`    (dry run -- not written)`);
      continue;
    }

    const { data: cred, error: insErr } = await svc
      .from("credentials")
      .insert(row)
      .select("id, credential_code")
      .single();
    if (insErr) {
      console.log(`    FAILED: ${insErr.message}`);
      skipped += 1;
      continue;
    }
    console.log(`    MINTED ${cred.credential_code} (${cred.id})`);
    minted += 1;

    // Link the voucher for the audit trail. Status is left alone: it may
    // already read redeemed for a different reason (attempts exhausted), and
    // rewriting redeemed_at would overwrite the record of when that happened.
    if (a.voucher_id) {
      const { error: vErr } = await svc
        .from("vouchers")
        .update({ credential_id: cred.id, updated_at: new Date().toISOString() })
        .eq("id", a.voucher_id)
        .is("credential_id", null);
      if (vErr) console.log(`    voucher link failed: ${vErr.message}`);
      else console.log(`    voucher ${a.voucher_id} linked`);
    }
  }

  console.log("");
  console.log(`minted: ${minted}   skipped: ${skipped}`);
  if (!APPLY) {
    console.log("");
    console.log("DRY RUN -- nothing written. Re-run with --apply.");
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
