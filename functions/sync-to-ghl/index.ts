// POST /functions/v1/sync-to-ghl
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
// create/update, and lists name mismatches. dryRun=false performs the upsert +
// tag-add and returns a result summary.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";
const SLUG = "gohighlevel";

// Throttle: stay well under 100 req / 10s. Each contact is up to 3 calls
// (search + upsert + tags). ~120ms between calls => ~8 calls/sec => safe.
const CALL_GAP_MS = 130;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Body {
  mode: "segment" | "all";
  userIds?: string[];
  dryRun: boolean;
}

type Stage = "certified" | "seat_unused" | "enrolled_no_seat" | "never_activated";

interface Contact {
  userId: string;
  email: string;
  fullName: string | null;
  stage: Stage;
  certifiedCodes: string[];
  dormant: boolean;
  emailConfirmed: boolean;
}

// Build the additive Certidemy tag set for one account.
function tagsFor(c: Contact): string[] {
  const t = [`certidemy-stage:${c.stage.replace(/_/g, "-")}`];
  for (const code of c.certifiedCodes) t.push(`certified:${code}`);
  if (c.dormant) t.push("dormant");
  if (!c.emailConfirmed) t.push("unconfirmed");
  return t;
}

function splitName(full: string | null): { firstName: string; lastName: string } {
  if (!full) return { firstName: "", lastName: "" };
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  try {
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

    // --- token + location from the Vault-backed store ----------------------
    const { data: row } = await svc
      .from("platform_integrations")
      .select("status, config")
      .eq("slug", SLUG)
      .maybeSingle();
    if (!row || row.status !== "connected") {
      throw new HttpError(400, "GoHighLevel is not connected");
    }
    const locationId = (row.config as { location_id?: string } | null)?.location_id;
    if (!locationId) throw new HttpError(400, "no location_id saved");

    const { data: token, error: tErr } = await svc.rpc("integration_read_token", {
      p_slug: SLUG,
    });
    if (tErr) throw new Error(`integration_read_token: ${tErr.message}`);
    if (!token) throw new HttpError(400, "no token stored");

    const ghlHeaders = {
      Authorization: `Bearer ${token}`,
      Version: GHL_VERSION,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // --- build the contact list from the census (service-role reads) -------
    // Reuse list-users' derivation by invoking it, so the funnel stage here is
    // identical to what the console shows. Then filter to the requested ids.
    const { data: census, error: cErr } = await svc.functions.invoke("list-users", {
      body: {},
    });
    if (cErr || !census?.users) throw new Error("could not load census");

    const wantIds = body.mode === "segment" && body.userIds ? new Set(body.userIds) : null;

    const contacts: Contact[] = (census.users as Array<{
      id: string;
      email: string | null;
      fullName: string | null;
      stage: Stage;
      dormant: boolean;
      emailConfirmed: boolean;
      enrollments: Array<{ code: string; certified: boolean }>;
    }>)
      .filter((u) => u.email && (!wantIds || wantIds.has(u.id)))
      .map((u) => ({
        userId: u.id,
        email: u.email as string,
        fullName: u.fullName,
        stage: u.stage,
        certifiedCodes: u.enrollments.filter((e) => e.certified).map((e) => e.code),
        dormant: u.dormant,
        emailConfirmed: u.emailConfirmed,
      }));

    // ---------------------------------------------------------------------
    // DRY RUN: classify create/update + name mismatches. No writes.
    // ---------------------------------------------------------------------
    if (dryRun) {
      let wouldCreate = 0;
      let wouldUpdate = 0;
      const nameMismatches: Array<{ email: string; ghlName: string; certidemyName: string }> = [];
      const failures: Array<{ email: string; error: string }> = [];

      for (const c of contacts) {
        try {
          const url = new URL(`${GHL_BASE}/contacts/search`);
          url.searchParams.set("locationId", locationId);
          url.searchParams.set("query", c.email);
          const resp = await fetch(url.toString(), { headers: ghlHeaders });
          if (!resp.ok) {
            failures.push({ email: c.email, error: `search ${resp.status}` });
            await sleep(CALL_GAP_MS);
            continue;
          }
          const j = (await resp.json()) as {
            contacts?: Array<{ id: string; email?: string; firstName?: string; lastName?: string }>;
          };
          const existing = (j.contacts ?? []).find(
            (x) => (x.email ?? "").toLowerCase() === c.email.toLowerCase(),
          );
          if (existing) {
            wouldUpdate++;
            const ghlName = `${existing.firstName ?? ""} ${existing.lastName ?? ""}`.trim();
            const certName = (c.fullName ?? "").trim();
            if (certName && ghlName && ghlName.toLowerCase() !== certName.toLowerCase()) {
              nameMismatches.push({ email: c.email, ghlName, certidemyName: certName });
            }
          } else {
            wouldCreate++;
          }
        } catch (e) {
          failures.push({ email: c.email, error: (e as Error).message });
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
      });
    }

    // ---------------------------------------------------------------------
    // REAL PUSH: upsert (name + email only) + additive tags.
    // ---------------------------------------------------------------------
    let created = 0;
    let updated = 0;
    let tagged = 0;
    const failures: Array<{ email: string; error: string }> = [];

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
          failures.push({ email: c.email, error: `upsert ${upsertResp.status}: ${(await upsertResp.text()).slice(0, 160)}` });
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
        await sleep(CALL_GAP_MS);

        // Additive tags.
        if (contactId) {
          const tagResp = await fetch(`${GHL_BASE}/contacts/${contactId}/tags`, {
            method: "POST",
            headers: ghlHeaders,
            body: JSON.stringify({ tags: tagsFor(c) }),
          });
          if (tagResp.ok) tagged++;
          else failures.push({ email: c.email, error: `tags ${tagResp.status}` });
          await sleep(CALL_GAP_MS);
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
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
