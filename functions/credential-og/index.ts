// GET /functions/v1/credential-og?code=SM-AI-I-I-2DUC   (or ?id=<uuid>)
//
// PUBLIC endpoint (deploy with --no-verify-jwt). Renders a 1200x630 branded PNG
// card for a credential, used as the og:image on the /verify/<code> page so a
// pasted link previews as a real credential (LinkedIn/WhatsApp/Slack require a
// raster image — SVG won't render there).
//
// ROBUSTNESS: the per-credential card is rendered at the edge with resvg-wasm.
// If ANYTHING fails (wasm/font fetch, lookup miss, render error), the function
// serves the STATIC branded fallback at /og/credential-fallback.png instead, so
// a shared link never previews broken. Add ?debug=1 to see the underlying error
// text instead of the fallback (for diagnosing the render path once).
//
// Cosmetic only: the AI-ERA chip is derived loosely from the cert code/name
// here (it's a marketing flourish on a share image, not the canonical
// task-level blueprint flag).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import initWasm, { Resvg } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

const SITE_URL = Deno.env.get("PUBLIC_SITE_URL") ?? "https://certidemy.pages.dev";
const FALLBACK_URL = `${SITE_URL}/og/credential-fallback.png`;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const WASM_URL = "https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm";
const FONT_URLS = [
  "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf",
  "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-SemiBold.ttf",
];

let wasmReady: Promise<unknown> | null = null;
function ensureWasm() {
  if (!wasmReady) wasmReady = initWasm(fetch(WASM_URL));
  return wasmReady;
}

let fontsReady: Promise<Uint8Array[]> | null = null;
function loadFonts() {
  if (!fontsReady) {
    fontsReady = Promise.all(
      FONT_URLS.map((u) =>
        fetch(u).then((r) => r.arrayBuffer()).then((b) => new Uint8Array(b))
      )
    );
  }
  return fontsReady;
}

function esc(s: string): string {
  return (s ?? "").replace(
    /[<>&'"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!)
  );
}
function trunc(s: string, n: number): string {
  s = (s ?? "").trim();
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "\u2026" : s;
}

interface CardData {
  holder: string;
  certName: string;
  code: string;
  status: string; // active | revoked | expired
  aiEra: boolean;
}

function buildSvg(c: CardData): string {
  const statusColor =
    c.status === "active" ? "#34d399" : c.status === "revoked" ? "#ff5a4d" : "#968d9b";
  const statusLabel =
    c.status === "active" ? "ACTIVE" : c.status === "revoked" ? "REVOKED" : "EXPIRED";
  const holder = esc(trunc(c.holder, 24));
  const certName = esc(trunc(c.certName, 38));
  const code = esc(c.code);
  const aiChip = c.aiEra
    ? `<rect x="980" y="70" width="148" height="44" rx="10" fill="none" stroke="#ff2d72" stroke-width="2"/>
       <text x="1054" y="100" font-family="Poppins" font-weight="600" font-size="22" letter-spacing="3" fill="#ff8fb3" text-anchor="middle">AI-ERA</text>`
    : "";

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="78%" cy="16%" r="62%">
      <stop offset="0%" stop-color="#ff2d72" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="#ff2d72" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#0c0a0f"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="0" y="0" width="10" height="630" fill="#ff2d72"/>
  <text x="72" y="92" font-family="Poppins" font-weight="600" font-size="30" letter-spacing="8" fill="#f4eff3">CERTIDEMY</text>
  ${aiChip}
  <text x="72" y="262" font-family="Poppins" font-weight="600" font-size="24" letter-spacing="6" fill="#ff8fb3">VERIFIED CREDENTIAL</text>
  <text x="72" y="346" font-family="Poppins" font-weight="600" font-size="64" fill="#ffffff">${holder}</text>
  <text x="72" y="408" font-family="Poppins" font-weight="400" font-size="38" fill="#c9c0cd">${certName}</text>
  <circle cx="84" cy="536" r="6" fill="${statusColor}"/>
  <text x="102" y="544" font-family="Poppins" font-weight="600" font-size="22" letter-spacing="2" fill="${statusColor}">${statusLabel}</text>
  <text x="72" y="592" font-family="Poppins" font-weight="400" font-size="24" fill="#968d9b">${code}</text>
  <text x="1128" y="592" font-family="Poppins" font-weight="600" font-size="24" fill="#c9c0cd" text-anchor="end">certidemy.pages.dev</text>
</svg>`;
}

async function renderPng(c: CardData): Promise<Uint8Array> {
  await ensureWasm();
  const fonts = await loadFonts();
  const resvg = new Resvg(buildSvg(c), {
    font: { fontBuffers: fonts, defaultFontFamily: "Poppins", loadSystemFonts: false },
    fitTo: { mode: "width", value: 1200 },
  });
  return resvg.render().asPng();
}

function pngResponse(png: Uint8Array): Response {
  return new Response(png, {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=300, s-maxage=86400",
      ...corsHeaders,
    },
  });
}

async function fallback(): Promise<Response> {
  try {
    const r = await fetch(FALLBACK_URL);
    if (r.ok) {
      return new Response(await r.arrayBuffer(), {
        headers: { "content-type": "image/png", "cache-control": "public, max-age=300", ...corsHeaders },
      });
    }
  } catch { /* ignore — fall through to redirect */ }
  return new Response(null, { status: 302, headers: { location: FALLBACK_URL, ...corsHeaders } });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";

  try {
    const id = url.searchParams.get("id");
    const code = url.searchParams.get("code");
    const ref = id ?? code;
    if (!ref) return debug ? new Response("no ref", { status: 400 }) : await fallback();

    const svc = getServiceClient();
    let q = svc
      .from("credentials")
      .select(
        "credential_code, holder_name, certification_name, certification_code, status, expires_at"
      );
    q = id && UUID_RE.test(id)
      ? q.eq("id", id)
      : q.eq("credential_code", (code ?? ref).trim().toUpperCase());

    const { data: cred } = await q.maybeSingle();
    if (!cred) return debug ? new Response("not found", { status: 404 }) : await fallback();

    const expired =
      cred.expires_at !== null && new Date(cred.expires_at).getTime() < Date.now();
    const status = expired && cred.status === "active" ? "expired" : cred.status;
    const aiEra =
      /(-AI-|\bAI\b)/i.test(cred.certification_code ?? "") ||
      /\bAI\b/.test(cred.certification_name ?? "");

    const png = await renderPng({
      holder: cred.holder_name,
      certName: cred.certification_name,
      code: cred.credential_code,
      status,
      aiEra,
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
