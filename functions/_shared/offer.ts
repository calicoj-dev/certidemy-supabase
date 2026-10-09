/**
 * supabase/functions/_shared/offer.ts -- confirm-before-signing helpers (migration 388).
 *
 * MIRRORED PAIR: foldName is copied in certidemy-web lib/issuing/recipient-checks.ts
 * for a PREVIEW only. This copy is the gate; if they disagree, this one decides.
 */

/** Offers stay answerable this long; the column default in 388 says the same. */
export const OFFER_TTL_DAYS = 30;

/** Per call. A cohort is tens of people; 500 is a spreadsheet, not a mailing list. */
export const MAX_OFFERS_PER_CALL = 500;

/** Accents, case and spacing only: "Ana Maria Gonzales" and "ANA MARÍA  GONZALES" fold equal. */
export function foldName(s: string): string {
  return s.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** A change the partner pre-approved: same letters, different accents/case/spacing. */
export function isMinorNameFix(sent: string, requested: string): boolean {
  return requested.trim() !== sent.trim() && foldName(requested) === foldName(sent);
}

/** 256 bits, URL-safe. Only its hash is stored; the raw value lives in the email. */
export function newOfferToken(): string {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  let s = "";
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** A token is 43 base64url characters; anything else is refused before a lookup. */
export const OFFER_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

export const OFFER_LOCALES = ["en", "es-419", "pt-BR"] as const;
export type OfferLocale = typeof OFFER_LOCALES[number];

export function offerLocale(v: unknown): OfferLocale {
  return (OFFER_LOCALES as readonly string[]).includes(String(v)) ? (v as OfferLocale) : "en";
}

/** The only host a confirm link may point at; the email template refuses anything else. */
export function confirmUrl(locale: OfferLocale, token: string): string {
  return `https://certidemy.com/${locale}/accept/${token}`;
}
