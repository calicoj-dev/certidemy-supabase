// POST /functions/v1/search-esco-skills   { q, lang }
//
// Auth: Bearer JWT. Any signed-in console user -- this reads a public European
// Commission API and returns nothing about Certidemy.
//
// POST, not GET, although it only reads. authenticate() consumes the request
// body, and on a GET there is none: Deno throws "error reading a body from
// connection" before the handler does anything. Every other function here is
// POST, so this follows rather than special-casing shared auth.
//
// Searches the ESCO skills taxonomy so a partner can attach REAL, recognised
// skills to what they issue.
//
// ============================== WHY A PROXY ==============================
//
// The ESCO API refuses cross-origin browser requests -- it answers 403 to any
// request carrying an Origin header. A browser cannot call it directly, so this
// exists purely to make the call from a server.
//
// It adds ONE thing: a substring-noise filter. ESCO's search matches inside
// words, so "agile" returns "handle fragile items" and "pack fragile items for
// transportation" alongside the two real hits. A picker showing those looks
// broken.
//
// The filter keeps a result only when some word in its title STARTS WITH some
// word of the query, accent-insensitively. That kills fr-agile while keeping
// "Agile development", and lets an unaccented "gestion" match "gestión" and
// "gestionar" -- which is what somebody typing into a search box expects.
//
// It cannot hide a legitimate hit: a real match contains the word.
//
// It does NOT re-rank. ESCO's own ordering is the European Commission's
// judgement about its own vocabulary, and second-guessing that would be
// inventing a taxonomy on top of a taxonomy.
//
// ============================== WHY ESCO AND NOT LIGHTCAST ================
//
// ESCO is openly published and MULTILINGUAL -- every EU language, so Spanish
// and Portuguese come free, matching the three locales this platform serves.
//
// Lightcast's Open Skills is an excellent taxonomy and English-first, built
// from English-language job postings, and access is by request with terms that
// would need reading before its vocabulary could be stored and shown to
// partners. It may be worth adding later as a US labour-market overlay. It is
// not a drop-in second option.
//
// ============================== WHAT THIS IS NOT ==========================
//
// NOT automatic matching. Certidemy tried inferring ESCO skills from its own
// curriculum concepts and the results were confidently wrong -- "Cynefin
// framework" matched "manufacture framework sections", and "Scrum Master serves
// the Product Owner" matched "audio mastering". ESCO describes occupations;
// a certification blueprint describes methodology. They are different
// vocabularies and an algorithm bridging them produces claims nobody made.
//
// A HUMAN PICKS. The issuer chooses which skills their credential attests, and
// that choice is theirs to defend.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, HttpError } from "../_shared/supabase.ts";

const ESCO = "https://ec.europa.eu/esco/api/search";

/**
 * ESCO language codes. It speaks every EU language; these are the three this
 * platform serves. Portuguese is European Portuguese -- ESCO has no pt-BR, and
 * for occupational vocabulary the difference is small enough that showing pt is
 * better than showing English.
 */
const LANGS: Record<string, string> = {
  "en": "en",
  "es-419": "es",
  "es": "es",
  "pt-BR": "pt",
  "pt": "pt",
};

const MAX_RESULTS = 25;
/** Returned to the caller after filtering. */
const KEEP_RESULTS = 12;

/** Lowercase, strip diacritics. "Gestión" and "gestion" are the same word to
 *  somebody typing into a search box. */
function fold(s: string): string {
  return s.normalize("NFD").replace(/\p{Mn}/gu, "").toLowerCase();
}

/**
 * Does this title genuinely match the query, or did ESCO match inside a word?
 *
 * True when some word of the title starts with some word of the query. Tokens
 * under three characters are ignored -- "de", "la", "of" match everything and
 * would defeat the filter.
 */
function isWordMatch(title: string, query: string): boolean {
  const tokens = fold(query).split(/[^\p{L}\p{N}]+/u).filter((t) => t.length >= 3);
  if (tokens.length === 0) return true;
  const words = fold(title).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return tokens.some((t) => words.some((w) => w.startsWith(t)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  try {
    // Signed in is enough. This returns a public European Commission dataset
    // and reveals nothing about who asked -- gating it harder would be
    // ceremony.
    await authenticate(req);

    const body = (await req.json().catch(() => ({}))) as {
      q?: string;
      lang?: string;
    };
    const q = (body.q ?? "").trim();
    const lang = LANGS[body.lang ?? "en"] ?? "en";

    if (q.length < 2) {
      // Not an error. A picker calls this on every keystroke and the first one
      // is always too short.
      return jsonResponse({ ok: true, query: q, results: [] });
    }

    const esco = new URL(ESCO);
    esco.searchParams.set("text", q);
    esco.searchParams.set("language", lang);
    esco.searchParams.set("type", "skill");
    esco.searchParams.set("limit", String(MAX_RESULTS));
    esco.searchParams.set("full", "false");

    /* .text() then JSON.parse, NOT .json().
       The edge runtime failed reading this response body over HTTP/2 --
       "error reading a body from connection" from consumeBody, on a 17 KB
       payload that curl fetches in half a second. Collecting the bytes as text
       first avoids the streaming path that broke, and gives a readable error
       instead of a stack trace if the payload is ever not JSON. */
    const res = await fetch(esco.toString(), {
      headers: {
        accept: "application/json",
        // No transfer compression. ESCO does not compress this response
        // anyway, and asking for none removes a decoding step from a read
        // that has already proven fragile here.
        "accept-encoding": "identity",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.error("esco search failed", res.status);
      throw new HttpError(502, "the skills service did not respond");
    }

    const rawBody = await res.text();
    let found: {
      total?: number;
      _embedded?: { results?: { title?: string; uri?: string }[] };
    };
    try {
      found = JSON.parse(rawBody);
    } catch {
      console.error("esco returned non-json", rawBody.slice(0, 300));
      throw new HttpError(502, "the skills service returned something unexpected");
    }

    const results = (found._embedded?.results ?? [])
      .filter((r) => r.title && r.uri)
      // Substring noise. See the header: ESCO matches inside words.
      .filter((r) => isWordMatch(r.title as string, q))
      .slice(0, KEEP_RESULTS)
      .map((r) => ({
        title: r.title as string,
        /* The ESCO URI, verbatim.
           http:// on purpose -- data.europa.eu URIs are persistent
           IDENTIFIERS, not fetchable pages, and the scheme is part of the
           identifier. Rewriting it to https would produce a string that is no
           longer the thing ESCO published. */
        uri: r.uri as string,
      }));

    return jsonResponse({
      ok: true,
      query: q,
      lang,
      // What ESCO reported, before filtering. The caller may want to say
      // "showing 12 of many" rather than implying these are all of them.
      total: found.total ?? results.length,
      results,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ error: err.message }, err.status);
    }
    console.error(err);
    return jsonResponse({ error: "skill search failed" }, 500);
  }
});
