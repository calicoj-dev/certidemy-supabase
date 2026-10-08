// Pure helpers for the send-auth-email hook: Standard Webhooks verification,
// locale choice, and the confirm link. Kept apart so they can be tested without a server.

import { normalizeLocale, type Locale } from "./email-templates.ts";

const MAX_SKEW_S = 5 * 60;
const LOCALES = ["en", "es-419", "pt-BR"];

// email_action_type -> the OTP type /auth/confirm hands to verifyOtp.
const LINK_TYPE: Record<string, string> = {
  signup: "email",
  recovery: "recovery",
  invite: "invite",
  magiclink: "magiclink",
  email_change: "email_change",
};

function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Standard Webhooks: HMAC-SHA256 over "id.timestamp.body", base64, header "v1,<sig> ...". */
export async function verifySignature(
  secret: string,
  headers: Headers,
  body: string,
  nowS: number = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  const id = headers.get("webhook-id");
  const ts = headers.get("webhook-timestamp");
  const sigHeader = headers.get("webhook-signature");
  if (!id || !ts || !sigHeader) return false;
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Math.abs(nowS - tsNum) > MAX_SKEW_S) return false;

  const keyB64 = secret.replace(/^v1,/, "").replace(/^whsec_/, "");
  const key = await crypto.subtle.importKey(
    "raw", b64ToBytes(keyB64), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${body}`));
  const expected = bytesToB64(new Uint8Array(mac));
  return sigHeader.split(" ").some((part) => {
    const [version, sig] = part.split(",");
    return version === "v1" && typeof sig === "string" && timingSafeEqual(sig, expected);
  });
}

export function pickLocale(redirectTo: string | undefined, preferred: unknown): Locale {
  try {
    const seg = new URL(redirectTo ?? "").pathname.split("/").filter(Boolean)[0] ?? "";
    if (LOCALES.includes(seg)) return seg as Locale;
  } catch { /* no usable redirect_to */ }
  return normalizeLocale(typeof preferred === "string" ? preferred : "en");
}

export function buildLink(
  action: string,
  tokenHash: string | undefined,
  redirectTo: string | undefined,
  locale: Locale,
): string {
  const type = LINK_TYPE[action];
  if (!type || !tokenHash) return "";
  const base = redirectTo && /^https?:\/\//.test(redirectTo)
    ? redirectTo
    : `https://certidemy.com/${locale}/auth/confirm?next=/${locale}/start`;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}token_hash=${encodeURIComponent(tokenHash)}&type=${type}`;
}
