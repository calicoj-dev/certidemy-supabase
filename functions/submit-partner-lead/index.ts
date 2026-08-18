// ============================================================================
// submit-partner-lead
//   Public, unauthenticated. Accepts the partner enquiry form on the marketing
//   site, validates it, and writes ONE row to public.partner_leads.
//
// CONFIG PIN - READ THIS BEFORE DEPLOYING
//   supabase/config.toml MUST carry:
//
//     [functions.submit-partner-lead]
//     verify_jwt = false
//
//   This is the OB3 rule, not the analyze-curriculum rule. analyze-curriculum
//   pins TRUE because it reads competitor intelligence and a missing pin would
//   EXPOSE it. This one pins FALSE because a visitor has no JWT, and a missing
//   pin is a silent 401 on every submission - the form would look like it
//   worked and no lead would ever arrive. Pin by name either way.
//
// WHY THE DATABASE STILL VALIDATES
//   Everything checked here is ALSO a CHECK constraint on the table. That is
//   deliberate. This layer exists to return a useful 400 instead of a raw
//   Postgres error; the constraints exist because this function is not the only
//   thing that could ever write, and because a failed insert must fail LOUDLY.
//   A swallowed 23514 would hide exactly the bug the constraint is for - the
//   score-mock-exam failure mode of HTTP 200 while storing nothing.
//
// SPAM
//   Two cheap defences, no third-party dependency:
//     - a honeypot field ("website") that a human never sees and never fills
//     - a minimum time-on-form, because scripted posts submit instantly
//   Both fail CLOSED and silently: a bot gets 200 and nothing is written, so
//   it has no signal to tune against. If real spam materialises, the next step
//   is Turnstile or a per-IP limit - not built yet, on purpose.
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ALLOWED_ORIGINS = [
  "https://certidemy.com",
  "https://www.certidemy.com",
  "https://certidemy.pages.dev",
  "http://localhost:3000",
];

const ORG_TYPES = [
  "university",
  "institute",
  "training_center",
  "consultancy",
  "independent",
  "internal_ld",
  "other",
];
const LOCALES = ["en", "es-419", "pt-BR"];

/** Mirrors the table CHECK exactly. */
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const E164_RE = /^\+[1-9][0-9]{6,14}$/;

const MIN_FORM_MS = 2500;

function cors(origin: string | null) {
  const ok = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": ok,
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}
const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), { status, headers: cors(origin) });

const clean = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  return s.slice(0, max);
};

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, origin);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400, origin);
  }

  // ---- spam gates. Both return 200 so a bot learns nothing. ----------------
  if (clean(body.website, 200) !== null) return json({ ok: true }, 200, origin);
  const elapsed = Number(body.elapsedMs);
  if (!Number.isFinite(elapsed) || elapsed < MIN_FORM_MS) {
    return json({ ok: true }, 200, origin);
  }

  // ---- required ------------------------------------------------------------
  const name = clean(body.name, 120);
  const email = clean(body.email, 254);
  if (!name || name.length < 2) return json({ error: "name_required" }, 400, origin);
  if (!email || !EMAIL_RE.test(email)) return json({ error: "email_invalid" }, 400, origin);

  // ---- optional, each normalised to null rather than "" --------------------
  const organization = clean(body.organization, 160);
  const message = clean(body.message, 4000);

  const rawCountry = clean(body.countryAlpha2, 2);
  const country_alpha2 = rawCountry && /^[A-Za-z]{2}$/.test(rawCountry) ? rawCountry.toUpperCase() : null;

  // The client sends the dial code and the number separately; E.164 is
  // assembled HERE so every consumer sees one canonical shape. GHL will not
  // take "+57 300 123 4567".
  const dial = clean(body.dialCode, 8);
  const rawPhone = clean(body.phone, 40);
  let phone_e164: string | null = null;
  if (dial && rawPhone) {
    const joined = `${dial}${rawPhone}`.replace(/[^\d+]/g, "");
    phone_e164 = E164_RE.test(joined) ? joined : null; // unparseable -> drop, never store junk
  }

  const orgTypeRaw = clean(body.orgType, 40);
  const org_type = orgTypeRaw && ORG_TYPES.includes(orgTypeRaw) ? orgTypeRaw : null;

  const localeRaw = clean(body.locale, 10);
  const locale = localeRaw && LOCALES.includes(localeRaw) ? localeRaw : "en";

  const sourceRaw = clean(body.source, 40);
  const source = sourceRaw ?? "home";

  // whatsapp_ok is only meaningful with a number to message.
  const whatsapp_ok = phone_e164 !== null && body.whatsappOk === true;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { error } = await supabase.from("partner_leads").insert({
    name,
    email,
    organization,
    country_alpha2,
    phone_e164,
    whatsapp_ok,
    org_type,
    message,
    locale,
    source,
  });

  if (error) {
    // Loud on purpose. A constraint rejection means the engine refused to store
    // something malformed, and swallowing it would hide the bug the constraint
    // exists to catch. The client shows a retry, not a false success.
    console.error("partner_leads insert failed", error.code, error.message);
    return json({ error: "insert_failed" }, 500, origin);
  }

  // Nothing about the stored row is echoed back - not the id, not the count.
  // A public endpoint that confirms writes is a public endpoint that can be
  // used to probe them.
  return json({ ok: true }, 200, origin);
});
