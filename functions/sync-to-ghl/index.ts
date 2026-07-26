// POST /functions/v1/sync-to-ghl  --  CENSUS-SHARED-v1
//
// Body: { mode: "segment" | "all", userIds?: string[], dryRun: boolean }
// Auth: Bearer JWT -- MUST be a platform_admin.
//
// Pushes Certidemy accounts into GoHighLevel as contacts, tagged by funnel
// stage. Certidemy -> GHL only. The CRM WRITER, built defensively:
//
//   - Matches strictly by EMAIL (upsert), so it can never overwrite an
//     unrelated contact.
//   - Sends name + email ONLY. Never phone/payment/marketing fields -- those
//     are GHL's to own.
//   - Tags are ADDITIVE (POST /contacts/{id}/tags). Existing GHL tags are
//     never touched or removed.
//   - Certidemy's name is authoritative (it's the cert issuer), but a dryRun
//     surfaces every name that WOULD change first, so nothing is silent.
//   - Throttled under GHL's 100-req / 10s burst limit.
//
// dryRun=true writes NOTHING: it searches each contact, classifies
// create/update, lists name mismatches, and returns the exact per-target list
// (email + stage + the tags that would be added) so the operator can eyeball
// precisely who is about to be touched.
//
// AUDIENCE SELECTION -- the safety rule:
//   mode "all"      -> every account with an email. Ignores userIds.
//   mode "segment"  -> ONLY the ids in userIds. Sending mode "segment" with an
//                      empty/missing userIds is a 400, NEVER a silent fallback
//                      to everyone. (It used to fall through to "all", which is
//                      the single most dangerous thing a CRM writer can do.)
//   This is what makes hand-picking a single learner safe: one checked row =>
//   one id => exactly one contact touched.
//
// CENSUS: computed IN-PROCESS via ../_shared/census.ts. It used to be fetched
// by invoking list-users over HTTP, which could never work -- this function
// holds a SERVICE-ROLE client, and list-users authenticates a USER JWT, so the
// invoke was rejected 401 and every push died with "could not load census".
//
// Deploy WITHOUT --no-verify-jwt. This endpoint is admin-only.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  authenticate,
  getServiceClient,
  HttpError,
} from "../_shared/supabase.ts";
import { buildCensus, type CensusUser, type Stage } from "../_shared/census.ts";

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";
const SLUG = "gohighlevel";

// Throttle: stay well under 100 req / 10s. Each contact is up to 3 calls
// (search + upsert + tags). ~130ms between calls => ~8 calls/sec => safe.
const CALL_GAP_MS = 130;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Body {
  mode: "segment" | "all";
  userIds?: string[];
  dryRun: boolean;
}

interface Contact {
  userId: string;
  email: string;
  fullName: string | null;
  stage: Stage;
  certifiedCodes: string[];
  dormant: boolean;
  emailConfirmed: boolean;
}

/** Build the additive Certidemy tag set for one account. */
function tagsFor(c: Contact): string[] {
  const t = [`certidemy-stage:${c.stage.replace(/_/g, "-")}`];
  for (const code of c.certifiedCodes) t.push(`certified:${code}`);
  if (c.dormant) t.push("dormant");
  if (!c.emailConfirmed) t.push("unconfirmed");
  return t;
}

function splitName(
  full: string | null,
): { firstName: string; lastName: string } {
  if (!full) return { firstName: "", lastName: "" };
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

type GhlContact = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

/**
 * Find an existing GHL contact by exact email.
 *
 * GHL exposes two shapes for this and which one a location answers on has
 * shifted across API revisions, so we try both rather than guess:
 *   1. GET  /contacts/?locationId=&query=      (long-standing v2 list+query)
 *   2. POST /contacts/search  { locationId, query }
 * Returns null when not found. Throws only when BOTH shapes fail, and the
 * thrown message carries both status codes so a failure is diagnosable from
 * the preview panel instead of DevTools.
 */
async function findContactByEmail(
  email: string,
  locationId: string,
  headers: Record<string, string>,
): Promise<GhlContact | null> {
  const match = (list: GhlContact[]) =>
    list.find((x) => (x.email ?? "").toLowerCase() === email.toLowerCase()) ??
      null;

  // --- shape 1: GET /contacts/
  let firstStatus = 0;
  try {
    const url = new URL(`${GHL_BASE}/contacts/`);
    url.searchParams.set("locationId", locationId);
    url.searchParams.set("query", email);
    const resp = await fetch(url.toString(), { headers });
    firstStatus = resp.status;
    if (resp.ok) {
      const j = (await resp.json()) as { contacts?: GhlContact[] };
      return match(j.contacts ?? []);
    }
  } catch (e) {
    firstStatus = -1;
    console.error("GET /contacts/ threw:", (e as Error).message);
  }

  await sleep(CALL_GAP_MS);

  // --- shape 2: POST /contacts/search
  const resp2 = await fetch(`${GHL_BASE}/contacts/search`, {
    method: "POST",
    headers,
    body: JSON.stringify({ locationId, query: email, pageLimit: 20 }),
  });
  if (resp2.ok) {
    const j = (await resp2.json()) as { contacts?: GhlContact[] };
    return match(j.contacts ?? []);
  }

  const detail = (await resp2.text()).slice(0, 160);
  throw new Error(
    `search failed (GET ${firstStatus}, POST ${resp2.status}): ${detail}`,
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  try {
    // --- Authorize ----------------------------------------------------------
    const actorId = await authenticate(req);
    const svc = getServiceClient();

    const { data: actorProfile } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", actorId)
      .maybeSingle();

    if (!actorProfile || actorProfile.platform_role !== "platform_admin") {
      throw new HttpError(403, "platform_admin required");
    }

    const body = (await req.json()) as Body;
    const dryRun = body.dryRun !== false; // default to safe

    // --- Audience guard: never let "segment" mean "everyone" ----------------
    const wantIds = body.mode === "all"
      ? null
      : new Set(body.userIds ?? []);

    if (wantIds !== null && wantIds.size === 0) {
      throw new HttpError(
        400,
        "no users selected -- pick at least one row, or use Push all",
      );
    }

    // --- token + location from the Vault-backed store -----------------------
    const { data: row, error: rowErr } = await svc
      .from("platform_integrations")
      .select("status, config")
      .eq("slug", SLUG)
      .maybeSingle();

    if (rowErr) {
      throw new Error(`reading integration row: ${rowErr.message}`);
    }
    if (!row || row.status !== "connected") {
      throw new HttpError(
        400,
        "GoHighLevel is not connected -- connect it in Console > Integrations",
      );
    }

    const locationId = (row.config as { location_id?: string } | null)
      ?.location_id;
    if (!locationId) throw new HttpError(400, "no location_id saved");

    const { data: token, error: tErr } = await svc.rpc(
      "integration_read_token",
      { p_slug: SLUG },
    );
    if (tErr) throw new Error(`integration_read_token: ${tErr.message}`);
    if (!token) {
      throw new HttpError(
        400,
        "no token stored -- reconnect GoHighLevel in Console > Integrations",
      );
    }

    const ghlHeaders: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Version: GHL_VERSION,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // --- Build the contact list from the shared census ----------------------
    let census: { users: CensusUser[] };
    try {
      census = await buildCensus(svc);
    } catch (e) {
      // Surface WHY the census failed, not a bare "could not load census".
      throw new Error(`census build failed: ${(e as Error).message}`);
    }

    const contacts: Contact[] = census.users
      .filter((u) => u.email && (wantIds === null || wantIds.has(u.id)))
      .map((u) => ({
        userId: u.id,
        email: u.email as string,
        fullName: u.fullName,
        stage: u.stage,
        certifiedCodes: u.enrollments.filter((e) => e.certified).map((e) =>
          e.code
        ),
        dormant: u.dormant,
        emailConfirmed: u.emailConfirmed,
      }));

    if (contacts.length === 0) {
      throw new HttpError(
        400,
        "nothing to push -- the selected accounts have no email address",
      );
    }

    // If specific ids were requested, report any that vanished (deleted account,
    // or an account with no email). Silence here would be a lie about coverage.
    const requestedButMissing = wantIds === null
      ? []
      : [...wantIds].filter((id) => !contacts.some((c) => c.userId === id));

    // ---------------------------------------------------------------------
    // DRY RUN: classify create/update + name mismatches. No writes.
    // ---------------------------------------------------------------------
    if (dryRun) {
      let wouldCreate = 0;
      let wouldUpdate = 0;
      const nameMismatches: Array<
        { email: string; ghlName: string; certidemyName: string }
      > = [];
      const failures: Array<{ email: string; error: string }> = [];
      const targets: Array<{
        email: string;
        certidemyName: string | null;
        stage: Stage;
        action: "create" | "update" | "error";
        tags: string[];
      }> = [];

      for (const c of contacts) {
        try {
          const existing = await findContactByEmail(
            c.email,
            locationId,
            ghlHeaders,
          );

          if (existing) {
            wouldUpdate++;
            const ghlName = `${existing.firstName ?? ""} ${
              existing.lastName ?? ""
            }`.trim();
            const certName = (c.fullName ?? "").trim();
            if (
              certName && ghlName &&
              ghlName.toLowerCase() !== certName.toLowerCase()
            ) {
              nameMismatches.push({
                email: c.email,
                ghlName,
                certidemyName: certName,
              });
            }
            targets.push({
              email: c.email,
              certidemyName: c.fullName,
              stage: c.stage,
              action: "update",
              tags: tagsFor(c),
            });
          } else {
            wouldCreate++;
            targets.push({
              email: c.email,
              certidemyName: c.fullName,
              stage: c.stage,
              action: "create",
              tags: tagsFor(c),
            });
          }
        } catch (e) {
          failures.push({ email: c.email, error: (e as Error).message });
          targets.push({
            email: c.email,
            certidemyName: c.fullName,
            stage: c.stage,
            action: "error",
            tags: tagsFor(c),
          });
        }
        await sleep(CALL_GAP_MS);
      }

      return jsonResponse({
        dryRun: true,
        total: contacts.length,
        wouldCreate,
        wouldUpdate,
        tagAdds: contacts.length,
        nameMismatches,
        failures,
        targets,
        requestedButMissing,
      });
    }

    // ---------------------------------------------------------------------
    // REAL PUSH: upsert (name + email only) + additive tags.
    // ---------------------------------------------------------------------
    let created = 0;
    let updated = 0;
    let tagged = 0;
    const failures: Array<{ email: string; error: string }> = [];
    const touched: string[] = [];

    for (const c of contacts) {
      try {
        const { firstName, lastName } = splitName(c.fullName);

        const upsertResp = await fetch(`${GHL_BASE}/contacts/upsert`, {
          method: "POST",
          headers: ghlHeaders,
          body: JSON.stringify({
            locationId,
            email: c.email,
            firstName,
            lastName,
          }),
        });

        if (!upsertResp.ok) {
          failures.push({
            email: c.email,
            error: `upsert ${upsertResp.status}: ${
              (await upsertResp.text()).slice(0, 160)
            }`,
          });
          await sleep(CALL_GAP_MS);
          continue;
        }

        const upserted = (await upsertResp.json()) as {
          contact?: { id?: string };
          new?: boolean;
        };
        const contactId = upserted?.contact?.id;
        if (upserted?.new) created++;
        else updated++;
        touched.push(c.email);

        await sleep(CALL_GAP_MS);

        // Additive tags.
        if (contactId) {
          const tagResp = await fetch(
            `${GHL_BASE}/contacts/${contactId}/tags`,
            {
              method: "POST",
              headers: ghlHeaders,
              body: JSON.stringify({ tags: tagsFor(c) }),
            },
          );
          if (tagResp.ok) {
            tagged++;
          } else {
            failures.push({
              email: c.email,
              error: `tags ${tagResp.status}: ${
                (await tagResp.text()).slice(0, 160)
              }`,
            });
          }
          await sleep(CALL_GAP_MS);
        } else {
          failures.push({
            email: c.email,
            error: "upsert returned no contact id -- tags not applied",
          });
        }
      } catch (e) {
        failures.push({ email: c.email, error: (e as Error).message });
      }
    }

    // Stamp last sync onto the integration row (non-secret bookkeeping).
    await svc
      .from("platform_integrations")
      .update({
        config: {
          ...((row.config as Record<string, unknown>) ?? {}),
          last_sync_at: new Date().toISOString(),
          last_sync_count: created + updated,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("slug", SLUG);

    return jsonResponse({
      dryRun: false,
      total: contacts.length,
      created,
      updated,
      tagged,
      failures,
      touched,
      requestedButMissing,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    console.error("sync-to-ghl failed:", err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
