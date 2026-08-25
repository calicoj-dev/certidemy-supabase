// POST /functions/v1/issue-credential-batch
//
// Body: { issuer_id, achievement_code, batch_label, rows: [{ email, full_name }],
//         issued_at?, expires_at?, is_specimen?, dry_run }
// Auth: Bearer JWT -- platform_admin, or the team_admin of the company that
//       owns THIS issuer. Identical gate to issue-credential-console.
//
// A partner uploads a spreadsheet of recipients and issues one credential each.
//
// ============================== THE BATCH LABEL IS THE WHOLE STORY =========
//
// READ THIS BEFORE CHANGING HOW THE IDEMPOTENCY KEY IS DERIVED.
//
// A 40-row upload that fails at row 27 gets re-uploaded. Without idempotency
// that mints rows 1-26 a second time: permanent rows, revocable but never
// deletable, each consuming a status_list_index from a sequence that only goes
// forward. So every row needs a key that is stable across re-uploads and
// distinct between genuinely different issuances. Three candidates, two of
// which fail:
//
//   A GENERATED ID (uuid per upload) breaks on re-upload. The second attempt
//   generates a new id, every key is fresh, and all 40 rows mint again. It
//   makes each ATTEMPT idempotent, which is not the thing that needs to be.
//
//   FILE CONTENT (a hash of the row, or of the file) breaks the moment someone
//   fixes row 27. Correcting a typo changes that row's key -- correct, it is a
//   different recipient now -- but hashing the whole file changes ALL of them,
//   and even per-row hashing breaks if the fix is to a name column that is part
//   of the hash. The normal repair makes the keys not match.
//
//   A HUMAN LABEL survives both. "ICESI Scrum cohort March 2026" is the same
//   string on the first upload and the fourth, whatever was fixed in between.
//   It is stable because a person means the same thing by it, which is exactly
//   the property a generated id and a content hash each lack.
//
// So the key is derived from (batch_label, achievement_code, email) and the
// partner's own words carry the identity of the batch.
//
// ============================== DERIVED, NEVER SENT ========================
//
// The client sends the LABEL and the ROWS. It does not send keys.
//
// If a client could send keys it could make two different recipients collide --
// silently dropping one person from a cohort, which nobody would notice until
// that person asked where their certificate was -- or send fresh keys every
// time and force duplicate mints, defeating the mechanism entirely. Deriving
// server-side means the only thing a client controls is what it should control:
// which batch this is and who is in it.
//
// Both halves are normalised before they go into the key, because a human
// retyping a label will not reproduce their own capitalisation or spacing.
//
// ============================== dry_run ====================================
//
// dry_run: true does everything except write -- resolves the achievement,
// validates every row, derives every key, and reads which keys already exist.
// It returns the same per-row shape the real run returns.
//
// This is not a convenience. The operator is about to create permanent rows in
// a public credential registry, and the only honest way to show them what will
// happen is to compute it against the same data the real run will use.
//
// The dry run is a READ of a moving target: a concurrent upload can mint
// between the preview and the commit. That is why the unique index exists and
// why _shared/issue.ts handles the conflict rather than trusting this check.
//
// ============================== ONE BAD ROW ================================
//
// A malformed row is an outcome, not an abort. Someone's spreadsheet has a
// trailing comma on line 12 and the other 39 people still earned their
// credential. Every row gets ok / already_exists / invalid with a reason, and
// the batch reports all of them.
//
// ============================== ROW CAP ====================================
//
// 500. The mint loop is sequential -- same reasoning as dispatch-emails, one
// slow call must not be multiplied by concurrency -- and at roughly 40ms per
// row for the insert plus the idempotency read, 500 rows is about 20 seconds,
// inside the edge runtime's budget with room for a slow database. The response
// carries one object per row, so 500 also keeps the JSON body well under a
// megabyte.
//
// It is a cohort size, not a data-migration size. A partner with more than 500
// people in one upload is a conversation, not a bigger constant: that job wants
// a queue and a dispatcher, like email_queue, not one long request.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";
import { requireIssuerAccess } from "../_shared/authorize.ts";
import {
  IssueError,
  issueCredential,
  MAX_RECIPIENT_NAME,
  RECIPIENT_EMAIL_RE,
} from "../_shared/issue.ts";

interface Row {
  email?: string;
  full_name?: string;
}

interface Body {
  issuer_id?: string;
  achievement_code?: string;
  batch_label?: string;
  rows?: Row[];
  issued_at?: string;
  expires_at?: string;
  is_specimen?: boolean;
  dry_run?: boolean;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** See the ROW CAP block in the header. */
const MAX_ROWS = 500;

/** Long enough for "ICESI Scrum Master cohort - March 2026", short enough that
 *  it is a label and not a paragraph pasted into the field. */
const MAX_BATCH_LABEL = 120;

/**
 * Normalise the human half of the key.
 *
 * Case and internal whitespace are exactly what a person fails to reproduce
 * when they retype a label three weeks later, and a key that does not match
 * because of a double space mints the whole cohort again.
 */
function normalizeLabel(v: string): string {
  return v.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * The key. Derived here, never accepted from a caller.
 *
 * achievement_code is in it because the same cohort can be awarded two
 * different things: without it, "March cohort" issuing both a Scrum Master and
 * a Product Owner credential to one person would see the second as a duplicate
 * of the first and silently skip it.
 *
 * Readable rather than hashed, so a support question -- "why did this row not
 * issue" -- is answerable by looking at the column.
 */
function deriveKey(label: string, achievementCode: string, email: string): string {
  return `batch:${normalizeLabel(label)}:${achievementCode.trim()}:${email}`;
}

type Outcome = "ok" | "already_exists" | "invalid";

interface RowResult {
  index: number;
  email: string | null;
  full_name: string | null;
  outcome: Outcome;
  reason: string | null;
  credential_code: string | null;
  credential_id: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  try {
    const actor = await authenticate(req);
    const svc = getServiceClient();

    const body = (await req.json()) as Body;
    const issuerId = body.issuer_id?.trim();
    const achCode = body.achievement_code?.trim();
    const batchLabel = body.batch_label?.trim();
    const dryRun = body.dry_run !== false;

    if (!issuerId || !UUID_RE.test(issuerId)) {
      throw new HttpError(400, "valid issuer_id required");
    }

    // BEFORE anything else in the body is trusted, and before any read of
    // issuer-owned data. Same gate as issue-credential-console.
    const access = await requireIssuerAccess(svc, actor, issuerId);

    if (!achCode) throw new HttpError(400, "achievement_code required");
    if (!batchLabel) throw new HttpError(400, "batch_label required");
    if (batchLabel.length > MAX_BATCH_LABEL) {
      throw new HttpError(
        400,
        `batch_label must be ${MAX_BATCH_LABEL} characters or fewer`,
      );
    }
    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      throw new HttpError(400, "rows must be a non-empty array");
    }
    if (body.rows.length > MAX_ROWS) {
      throw new HttpError(
        400,
        `a batch is at most ${MAX_ROWS} rows; this one has ${body.rows.length}`,
      );
    }

    // Same gate and same reasoning as issue-credential-console: refused rather
    // than ignored, because silently dropping it would report a specimen batch
    // that minted real credentials.
    const wantsSpecimen = body.is_specimen === true;
    if (wantsSpecimen && access.role !== "platform_admin") {
      throw new HttpError(403, "only a platform_admin may issue a specimen");
    }

    /* ------------------------------------------------------ validate ----- */
    // Per row, and never fatal. The keys are derived here so the dry run and
    // the real run compute them the same way -- one implementation, so a
    // preview cannot disagree with what follows it.
    const results: RowResult[] = [];
    const pending: { index: number; email: string; name: string; key: string }[] = [];
    const seenKeys = new Set<string>();

    body.rows.forEach((raw, i) => {
      const email = raw?.email?.trim().toLowerCase() ?? "";
      const name = raw?.full_name?.trim() ?? "";

      const invalid = (reason: string) =>
        results.push({
          index: i,
          email: email || null,
          full_name: name || null,
          outcome: "invalid",
          reason,
          credential_code: null,
          credential_id: null,
        });

      if (!email) return invalid("email is required");
      if (!RECIPIENT_EMAIL_RE.test(email)) return invalid("email is not a valid address");
      if (!name) return invalid("full_name is required");
      if (name.length > MAX_RECIPIENT_NAME) {
        return invalid(`full_name must be ${MAX_RECIPIENT_NAME} characters or fewer`);
      }

      const key = deriveKey(batchLabel, achCode, email);

      // The same address twice in one file. Not an error in the spreadsheet
      // sense, but the second row cannot mint: it derives the identical key.
      // Reported as already_exists rather than silently dropped, so the count
      // the operator sees adds up to the rows they uploaded.
      if (seenKeys.has(key)) {
        return results.push({
          index: i,
          email,
          full_name: name,
          outcome: "already_exists",
          reason: "duplicate of an earlier row in this file",
          credential_code: null,
          credential_id: null,
        });
      }
      seenKeys.add(key);
      pending.push({ index: i, email, name, key });
    });

    /* ------------------------------------------------- already issued ---- */
    // One read for the whole batch rather than one per row. Scoped by issuer:
    // the unique index is (issuer_id, idempotency_key), so a key means nothing
    // outside its issuer.
    const existingByKey = new Map<string, { id: string; credential_code: string }>();
    if (pending.length > 0) {
      const { data: existing, error: exErr } = await svc
        .from("credentials")
        .select("id, credential_code, idempotency_key")
        .eq("issuer_id", issuerId)
        .in("idempotency_key", pending.map((p) => p.key));
      if (exErr) throw new Error(`existing lookup: ${exErr.message}`);
      for (const row of (existing ?? []) as {
        id: string;
        credential_code: string;
        idempotency_key: string;
      }[]) {
        existingByKey.set(row.idempotency_key, {
          id: row.id,
          credential_code: row.credential_code,
        });
      }
    }

    /* ------------------------------------------------------- the work ---- */
    // Resolve the achievement ONCE, before the loop, by minting nothing: a bad
    // achievement code should fail the batch rather than fail 500 rows one at a
    // time. issueCredential re-resolves it per row, which costs an indexed read
    // and keeps this function from having its own copy of that logic.
    const { data: achRow, error: achErr } = await svc
      .from("achievements")
      .select("code, name, status")
      .eq("issuer_id", issuerId)
      .eq("code", achCode)
      .maybeSingle();
    if (achErr) throw new Error(`achievement lookup: ${achErr.message}`);
    if (!achRow) throw new HttpError(404, `no achievement "${achCode}" for this issuer`);
    if (achRow.status !== "active") {
      throw new HttpError(409, `achievement "${achCode}" is ${achRow.status}, not active`);
    }

    let minted = 0;
    let failed = 0;

    for (const p of pending) {
      const already = existingByKey.get(p.key);
      if (already) {
        results.push({
          index: p.index,
          email: p.email,
          full_name: p.name,
          outcome: "already_exists",
          reason: "already issued under this batch label",
          credential_code: already.credential_code,
          credential_id: already.id,
        });
        continue;
      }

      if (dryRun) {
        results.push({
          index: p.index,
          email: p.email,
          full_name: p.name,
          outcome: "ok",
          reason: null,
          credential_code: null,
          credential_id: null,
        });
        continue;
      }

      try {
        const issued = await issueCredential(svc, {
          issuerId,
          achievementCode: achCode,
          recipientEmail: p.email,
          recipientName: p.name,
          displayId: null,
          issuedAt: body.issued_at ?? null,
          expiresAt: body.expires_at ?? null,
          isSpecimen: wantsSpecimen,
          idempotencyKey: p.key,
        });
        // alreadyExisted here means the race the dry run cannot close: another
        // upload minted this row between the lookup above and this insert.
        if (issued.alreadyExisted) {
          results.push({
            index: p.index,
            email: p.email,
            full_name: p.name,
            outcome: "already_exists",
            reason: "issued concurrently by another request",
            credential_code: issued.credentialCode,
            credential_id: issued.id,
          });
        } else {
          minted++;
          results.push({
            index: p.index,
            email: p.email,
            full_name: p.name,
            outcome: "ok",
            reason: null,
            credential_code: issued.credentialCode,
            credential_id: issued.id,
          });
        }
      } catch (err) {
        // ONE ROW, not the batch. A date that fails to parse would fail every
        // row identically and is caught on the first, but an insert fault is
        // this row's alone and the other 499 people still earned theirs.
        failed++;
        const reason = err instanceof IssueError
          ? err.message
          : (err as Error).message;
        console.error(`batch row ${p.index} failed`, reason);
        results.push({
          index: p.index,
          email: p.email,
          full_name: p.name,
          outcome: "invalid",
          reason,
          credential_code: null,
          credential_id: null,
        });
      }
    }

    results.sort((a, b) => a.index - b.index);

    const counts = {
      total: body.rows.length,
      ok: results.filter((r) => r.outcome === "ok").length,
      already_exists: results.filter((r) => r.outcome === "already_exists").length,
      invalid: results.filter((r) => r.outcome === "invalid").length,
    };

    /* ---------------------------------------------------------- audit ---- */
    // Only a real run is an event. A dry run wrote nothing and an audit row
    // saying otherwise would be a record of something that did not happen.
    if (!dryRun) {
      const { error: logErr } = await svc.from("admin_actions").insert({
        actor_user_id: actor,
        action: "issue_credential_batch",
        target_type: "issuer",
        target_id: issuerId,
        reason: null,
        metadata: {
          role: access.role,
          company_id: access.companyId,
          batch_label: batchLabel,
          normalized_batch_label: normalizeLabel(batchLabel),
          achievement_code: achCode,
          is_specimen: wantsSpecimen,
          counts,
          minted,
          failed,
          // Codes only. The per-row emails are in the credentials themselves;
          // repeating a cohort's worth of addresses into an audit row copies
          // the personal data into a second place that nothing prunes.
          credential_codes: results
            .filter((r) => r.outcome === "ok" && r.credential_code)
            .map((r) => r.credential_code),
        },
      });
      if (logErr) console.warn("admin_actions log failed", logErr);
    }

    return jsonResponse({
      ok: true,
      dry_run: dryRun,
      batch_label: batchLabel,
      achievement: { code: achRow.code, name: achRow.name },
      is_specimen: wantsSpecimen,
      counts,
      rows: results,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
