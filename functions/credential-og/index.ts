// GET /functions/v1/credential-og?code=SM-AI-I-I-2DUC   (or ?id=<uuid>)
//
// PUBLIC endpoint (verify_jwt = false). Renders a 1200x630 branded PNG card for
// a credential, used as the og:image on /verify/<code> so a pasted link
// previews as a real credential. LinkedIn, WhatsApp and Slack all require a
// raster; SVG will not render there.
//
// ============================ v2 -- WHAT CHANGED ============================
//
// 1. is_specimen IS NOW READ. v1 selected `status` but not `is_specimen`, and
//    specimens carry status='active' -- so AISM-I-SPEC-0001 rendered with a
//    green dot and the word ACTIVE, visually identical to a real credential.
//    SALES-LIBRARY-SPEC.md s8 names that exact outcome a fraud vector. The
//    verify PAGE branches on status==='specimen' because verify-credential maps
//    the flag on its way out; this function queries the table directly and
//    bypassed that mapping entirely. Two consumers, one derived field, one of
//    them did not know.
//
// 2. FONTS ARE BUNDLED. v1 fetched Poppins from raw.githubusercontent.com at
//    render time -- not a CDN, rate-limited, no uptime commitment, and no
//    guaranteed glyph coverage. A holder named Conceicao or Wrobel was a tofu
//    box on a card headed for LinkedIn. _shared/fonts.ts already carries Inter
//    with Latin Extended-A precisely because certificates carry holder names.
//    Three third-party fetches per cold start became one (the resvg wasm).
//
// 3. BRAND. v1 drew #ff2d72 in Poppins. v3.7 moved the brand to #be185d and
//    fixed certificate.ts and factsheet.ts for exactly this reason; the share
//    card was the last surface still off-palette, and in a different typeface
//    from the certificate it advertises.
//
// 4. THE BADGE. Composited from _shared/badges.ts as a base64 data URI. If the
//    code is unknown, badgeDataUri returns null and the card renders text-only
//    rather than failing -- a degraded card beats a broken link preview.
//
// 5. LOCALE AND EXPIRY. credentials.locale existed and was ignored, so a
//    Brazilian holder's share read VERIFIED CREDENTIAL in English. expires_at
//    was selected and used only to compute status; on the face it is the line
//    that reads as a certification body rather than a course platform.
//
// 6. AI-ERA CHIP DELETED. A hand-typed marketing claim derived by regex from
//    the cert name, on a public artifact. Same thing v3.7 killed when
//    "Proctored Run" became "Exam Run".
//
// 7. NAME AUTO-SHRINK. v1 did trunc(holder, 24), putting an ellipsis mid-name
//    on a share card. certificate.ts solved this with auto-shrink (v3.2 s9);
//    this borrows the approach.
//
// ============================ CACHING -- READ THIS ==========================
//
// LinkedIn caches link previews for ~7 days and there is no purge you control.
// OG_RENDERER_VERSION must be appended to the og:image URL by the caller:
//
//   ${SUPABASE_URL}/functions/v1/credential-og?code=${code}&v=2
//
// The function ignores `v`. It exists solely so that changing this file changes
// the URL, which is the only reliable way to invalidate a crawler cache. BUMP
// OG_RENDERER_VERSION HERE AND IN generateMetadata TOGETHER, or the redesign
// ships and nobody ever sees it.
//
// ROBUSTNESS: if anything fails (wasm fetch, lookup miss, render error) the
// function serves the static fallback at /og/credential-fallback.png so a
// shared link never previews broken. ?debug=1 returns the underlying error
// instead. NOTE: that fallback PNG still advertises certidemy.pages.dev -- the
// retired domain. Regenerate it; it is now a rare path but not a dead one.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { initWasm, Resvg } from "https://esm.sh/@resvg/resvg-wasm@2.6.2?target=deno";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import {
  INTER_REGULAR_B64,
  INTER_SEMIBOLD_B64,
  INTER_BOLD_B64,
  b64ToBytes,
} from "../_shared/fonts.ts";
import { badgeDataUri } from "../_shared/badges.ts";

const OG_RENDERER_VERSION = 2;

const SITE_URL = Deno.env.get("PUBLIC_SITE_URL") ?? "https://certidemy.com";
const FALLBACK_URL = `${SITE_URL}/og/credential-fallback.png`;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The only remaining third-party fetch. Pinned; do not float the version.
const WASM_URL = "https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm";

/* ------------------------------- palette -------------------------------- */
/* Matches certificate.ts and factsheet.ts after the v3.7 brand move. If the
   brand moves again, all three change together or the family splits again. */
const INK = {
  bg: "#0c0a0f",
  rail: "#be185d",
  accent: "#be185d",
  accentSoft: "#f0a8c4",
  white: "#ffffff",
  soft: "#c9c0cd",
  mute: "#968d9b",
  keyline: "#2a2430",
  ok: "#34d399",
  bad: "#ff5a4d",
  warn: "#f5b544",
  warnInk: "#3a2606",
};

/* --------------------------------- i18n --------------------------------- */
/* Deliberately a local table and not Intl. Deno's ICU coverage for es-419 is
   not something this card should depend on, and a silent fallback to English
   month names is exactly the class of failure this project keeps finding.
   Twelve strings per language is cheaper than the uncertainty. */
type Lang = "en" | "es-419" | "pt-BR";

const T: Record<Lang, Record<string, string>> = {
  en: {
    eyebrow: "VERIFIED CREDENTIAL",
    specimenEyebrow: "SPECIMEN",
    issued: "ISSUED",
    expires: "EXPIRES",
    noExpiry: "No expiry",
    credential: "CREDENTIAL",
    active: "ACTIVE",
    revoked: "REVOKED",
    expired: "EXPIRED",
    specimen: "SPECIMEN \u2014 NOT A CERTIFICATION DECISION",
  },
  "es-419": {
    eyebrow: "CREDENCIAL VERIFICADA",
    specimenEyebrow: "ESP\u00c9CIMEN",
    issued: "EMITIDA",
    expires: "VENCE",
    noExpiry: "Sin vencimiento",
    credential: "CREDENCIAL",
    active: "ACTIVA",
    revoked: "REVOCADA",
    expired: "VENCIDA",
    specimen: "ESP\u00c9CIMEN \u2014 NO ES UNA DECISI\u00d3N DE CERTIFICACI\u00d3N",
  },
  "pt-BR": {
    eyebrow: "CREDENCIAL VERIFICADA",
    specimenEyebrow: "ESP\u00c9CIME",
    issued: "EMITIDA",
    expires: "EXPIRA",
    noExpiry: "Sem expira\u00e7\u00e3o",
    credential: "CREDENCIAL",
    active: "ATIVA",
    revoked: "REVOGADA",
    expired: "EXPIRADA",
    specimen: "ESP\u00c9CIME \u2014 N\u00c3O \u00c9 UMA DECIS\u00c3O DE CERTIFICA\u00c7\u00c3O",
  },
};

const MONTHS: Record<Lang, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  "es-419": ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  "pt-BR": ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
};

function toLang(v: string | null | undefined): Lang {
  return v === "es-419" || v === "pt-BR" ? v : "en";
}

function fmtDate(iso: string | null, lang: Lang): string {
  if (!iso) return T[lang].noExpiry;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return T[lang].noExpiry;
  const day = d.getUTCDate();
  const mon = MONTHS[lang][d.getUTCMonth()];
  const yr = d.getUTCFullYear();
  return lang === "en" ? `${mon} ${day}, ${yr}` : `${day} ${mon} ${yr}`;
}

/* ------------------------------- helpers -------------------------------- */

function esc(s: string): string {
  return (s ?? "").replace(
    /[<>&'"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!)
  );
}

/**
 * Approximate a font size that fits `text` into `maxWidth`, then clamp.
 *
 * resvg gives no text metrics before render, so this estimates from average
 * advance width: Inter runs ~0.55em semibold, ~0.52em regular. The clamp is
 * what matters -- the design has to hold at both extremes, which is the same
 * constraint CERTIFICATE-DESIGN-SPEC.md states for the certificate.
 */
function fitSize(text: string, maxWidth: number, max: number, min: number, em: number): number {
  const len = Math.max(1, (text ?? "").length);
  return Math.max(min, Math.min(max, Math.floor(maxWidth / (len * em))));
}

/** Last-resort clip, only reached if a string overflows even at min size. */
function clip(s: string, maxWidth: number, size: number, em: number): string {
  const fits = Math.floor(maxWidth / (size * em));
  s = (s ?? "").trim();
  return s.length > fits ? s.slice(0, Math.max(1, fits - 1)).trimEnd() + "\u2026" : s;
}

/* --------------------------------- card --------------------------------- */

interface CardData {
  holder: string;
  certName: string;
  certCode: string;
  code: string;
  state: "active" | "specimen" | "revoked" | "expired";
  issuedAt: string | null;
  expiresAt: string | null;
  lang: Lang;
}

const COL_X = 580;          // right column left edge
const COL_W = 540;          // right column usable width
const BADGE_X = 92;
const BADGE_Y = 100;
const BADGE_S = 400;

function buildSvg(c: CardData): string {
  const t = T[c.lang];
  const isSpec = c.state === "specimen";

  const statusColor =
    isSpec ? INK.warn : c.state === "active" ? INK.ok : c.state === "revoked" ? INK.bad : INK.mute;
  const statusLabel =
    isSpec ? t.specimen : c.state === "active" ? t.active : c.state === "revoked" ? t.revoked : t.expired;

  const holderSize = fitSize(c.holder, COL_W, 58, 30, 0.55);
  const holder = esc(clip(c.holder, COL_W, holderSize, 0.55));

  const certSize = fitSize(c.certName, COL_W, 32, 20, 0.52);
  const certName = esc(clip(c.certName, COL_W, certSize, 0.52));

  const badge = badgeDataUri(c.certCode);

  /* A specimen gets an amber pill wide enough to carry a full sentence, not a
     one-word chip. At feed-thumbnail size the word alone is unreadable; the
     bar's colour is what survives scaling, and the sentence is what a person
     who clicks through actually reads.

     The text is AUTO-FITTED. A fixed size sized against the English string
     overflowed the pill in pt-BR, which is longer -- the same trap the holder
     name has, one line down. Any fixed font size on a translated string is a
     bug waiting for a longer language. */
  const specSize = fitSize(statusLabel, COL_W - 40, 19, 12, 0.66);
  const statusBlock = isSpec
    ? `<rect x="${COL_X}" y="478" width="${COL_W}" height="52" rx="8" fill="${INK.warn}"/>
       <text x="${COL_X + 20}" y="${511 + (19 - specSize) * 0.3}" font-family="Inter" font-weight="700" font-size="${specSize}" letter-spacing="1" fill="${INK.warnInk}">${esc(statusLabel)}</text>`
    : `<circle cx="${COL_X + 8}" cy="500" r="7" fill="${statusColor}"/>
       <text x="${COL_X + 28}" y="508" font-family="Inter" font-weight="600" font-size="22" letter-spacing="2" fill="${statusColor}">${esc(statusLabel)}</text>`;

  const badgeBlock = badge
    ? `<image x="${BADGE_X}" y="${BADGE_Y}" width="${BADGE_S}" height="${BADGE_S}" href="${badge}" preserveAspectRatio="xMidYMid meet"/>`
    : "";

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <rect width="1200" height="630" fill="${INK.bg}"/>
  <rect x="0" y="0" width="10" height="630" fill="${INK.rail}"/>

  ${badgeBlock}

  <text x="${COL_X}" y="152" font-family="Inter" font-weight="600" font-size="21" letter-spacing="6" fill="${isSpec ? INK.warn : INK.accentSoft}">${esc(isSpec ? t.specimenEyebrow : t.eyebrow)}</text>

  <text x="${COL_X}" y="${232 + (58 - holderSize) * 0.4}" font-family="Inter" font-weight="700" font-size="${holderSize}" fill="${INK.white}">${holder}</text>
  <text x="${COL_X}" y="292" font-family="Inter" font-weight="400" font-size="${certSize}" fill="${INK.soft}">${certName}</text>

  <line x1="${COL_X}" y1="340" x2="${COL_X + COL_W}" y2="340" stroke="${INK.keyline}" stroke-width="2"/>

  <text x="${COL_X}" y="380" font-family="Inter" font-weight="600" font-size="16" letter-spacing="3" fill="${INK.mute}">${esc(t.issued)}</text>
  <text x="${COL_X}" y="416" font-family="Inter" font-weight="400" font-size="24" fill="${INK.soft}">${esc(fmtDate(c.issuedAt, c.lang))}</text>

  <text x="${COL_X + 280}" y="380" font-family="Inter" font-weight="600" font-size="16" letter-spacing="3" fill="${INK.mute}">${esc(t.expires)}</text>
  <text x="${COL_X + 280}" y="416" font-family="Inter" font-weight="400" font-size="24" fill="${INK.soft}">${esc(fmtDate(c.expiresAt, c.lang))}</text>

  ${statusBlock}

  <line x1="72" y1="558" x2="1128" y2="558" stroke="${INK.keyline}" stroke-width="2"/>
  <text x="72" y="596" font-family="Inter" font-weight="400" font-size="21" fill="${INK.mute}">${esc(c.code)}</text>
  <text x="1128" y="596" font-family="Inter" font-weight="600" font-size="21" fill="${INK.soft}" text-anchor="end">certidemy.com</text>
</svg>`;
}

/* -------------------------------- render -------------------------------- */

let wasmReady: Promise<unknown> | null = null;
function ensureWasm() {
  if (!wasmReady) wasmReady = initWasm(fetch(WASM_URL));
  return wasmReady;
}

/* Decoded once per isolate. Bundled, so no network and no failure mode. */
let fontBuffers: Uint8Array[] | null = null;
function fonts(): Uint8Array[] {
  if (!fontBuffers) {
    fontBuffers = [
      b64ToBytes(INTER_REGULAR_B64),
      b64ToBytes(INTER_SEMIBOLD_B64),
      b64ToBytes(INTER_BOLD_B64),
    ];
  }
  return fontBuffers;
}

/* ---------------------------- generic card ------------------------------ */
/* The static /og/credential-fallback.png is DERIVED FROM THIS, not hand-made.
   The previous fallback was a one-off file that still advertised
   certidemy.pages.dev long after the domain was retired (v3.2 s7 fixed the
   hardcoded domain inside this function's SVG but could not reach a PNG sitting
   in the web repo). A hand-made asset with no relationship to the renderer will
   always rot; a derived one cannot.

   Regenerate with: node scripts/gen-og-fallback.mjs   (from certidemy-web)

   English only, deliberately: this card is served precisely when the credential
   did not resolve, so there is no locale to read. */
function buildGenericSvg(): string {
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${INK.bg}"/>
  <rect x="0" y="0" width="10" height="630" fill="${INK.rail}"/>

  <text x="72" y="112" font-family="Inter" font-weight="600" font-size="30" letter-spacing="8" fill="${INK.white}">CERTIDEMY</text>

  <text x="72" y="286" font-family="Inter" font-weight="600" font-size="22" letter-spacing="6" fill="${INK.accentSoft}">VERIFY A CREDENTIAL</text>

  <text x="72" y="384" font-family="Inter" font-weight="700" font-size="62" fill="${INK.white}">Certification, built</text>
  <text x="72" y="456" font-family="Inter" font-weight="700" font-size="62" fill="${INK.white}">for the age of AI.</text>

  <line x1="72" y1="530" x2="1128" y2="530" stroke="${INK.keyline}" stroke-width="2"/>
  <text x="72" y="576" font-family="Inter" font-weight="400" font-size="24" fill="${INK.mute}">Verify any credential at</text>
  <text x="378" y="576" font-family="Inter" font-weight="600" font-size="24" fill="${INK.soft}">certidemy.com</text>
</svg>`;
}

async function renderSvg(svg: string): Promise<Uint8Array> {
  await ensureWasm();
  const resvg = new Resvg(svg, {
    font: {
      fontBuffers: fonts(),
      defaultFontFamily: "Inter",
      loadSystemFonts: false,
    },
    fitTo: { mode: "width", value: 1200 },
  });
  return resvg.render().asPng();
}

async function renderPng(c: CardData): Promise<Uint8Array> {
  return await renderSvg(buildSvg(c));
}

function pngResponse(png: Uint8Array): Response {
  return new Response(png, {
    headers: {
      "content-type": "image/png",
      // Long TTL is safe because the URL carries OG_RENDERER_VERSION -- a
      // redesign changes the URL rather than needing an invalidation.
      "cache-control": "public, max-age=3600, s-maxage=604800",
      "x-og-renderer-version": String(OG_RENDERER_VERSION),
      ...corsHeaders,
    },
  });
}

async function fallback(): Promise<Response> {
  try {
    const r = await fetch(FALLBACK_URL);
    if (r.ok) {
      return new Response(await r.arrayBuffer(), {
        headers: {
          "content-type": "image/png",
          "cache-control": "public, max-age=300",
          ...corsHeaders,
        },
      });
    }
  } catch {
    /* ignore -- fall through to redirect */
  }
  return new Response(null, { status: 302, headers: { location: FALLBACK_URL, ...corsHeaders } });
}

/* -------------------------------- handler ------------------------------- */

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";

  /* ?generic=1 renders the brand card with no credential. This is the SOURCE
     for /og/credential-fallback.png -- see buildGenericSvg. It is also what a
     crawler gets if it somehow reaches this function with no ref, which is
     better than a 400 in a link preview. */
  if (url.searchParams.get("generic") === "1") {
    try {
      return pngResponse(await renderSvg(buildGenericSvg()));
    } catch (err) {
      console.error("credential-og generic:", err);
      if (debug) {
        return new Response("ERR: " + ((err as Error)?.stack ?? String(err)), {
          status: 500,
          headers: { "content-type": "text/plain" },
        });
      }
      return await fallback();
    }
  }

  try {
    const id = url.searchParams.get("id");
    const code = url.searchParams.get("code");
    const ref = id ?? code;
    if (!ref) return debug ? new Response("no ref", { status: 400 }) : await fallback();

    const svc = getServiceClient();
    let q = svc
      .from("credentials")
      .select(
        "credential_code, holder_name, certification_name, certification_code, " +
          "status, issued_at, expires_at, locale, is_specimen"
      );

    q = id && UUID_RE.test(id)
      ? q.eq("id", id)
      : q.eq("credential_code", (code ?? ref).trim().toUpperCase());

    const { data: cred } = await q.maybeSingle();
    if (!cred) return debug ? new Response("not found", { status: 404 }) : await fallback();

    /* Specimen wins over every other state. A specimen that reads as active is
       a fraud vector; a specimen that reads as expired is merely wrong. Order
       matters here and the ordering is the point. */
    const expired =
      cred.expires_at !== null && new Date(cred.expires_at).getTime() < Date.now();

    const state: CardData["state"] = cred.is_specimen
      ? "specimen"
      : cred.status === "revoked"
        ? "revoked"
        : expired || cred.status === "expired"
          ? "expired"
          : "active";

    const png = await renderPng({
      holder: cred.holder_name ?? "",
      certName: cred.certification_name ?? "",
      certCode: cred.certification_code ?? "",
      code: cred.credential_code ?? "",
      state,
      issuedAt: cred.issued_at ?? null,
      expiresAt: cred.expires_at ?? null,
      lang: toLang(cred.locale),
    });

    return pngResponse(png);
  } catch (err) {
    console.error("credential-og:", err);
    if (debug) {
      return new Response("ERR: " + ((err as Error)?.stack ?? String(err)), {
        status: 500,
        headers: { "content-type": "text/plain" },
      });
    }
    return await fallback();
  }
});
