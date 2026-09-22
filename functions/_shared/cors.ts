export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

/**
 * `extra` is optional and additive, so no existing caller changes. It exists
 * for Retry-After on a 503: a status that says "try again" without saying WHEN
 * leaves the caller to guess, and a guessing client retries too fast and
 * deepens the exhaustion it is reacting to.
 */
export function jsonResponse(body: unknown, status = 200, extra?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...(extra ?? {}) },
  });
}
