// functions/_shared/api-scopes.ts
//
// The issuer API key scope vocabulary, in one place.
//
// ===================== WHY THIS FILE EXISTS =====================
//
// There were THREE lists and they did not agree. Measured 2026-09-14:
//
//   create-issuer-api-key   credentials:issue, credentials:read, achievements:read
//   migration 322 CHECK     credentials:issue, courseware:lessons
//   actually enforced       credentials:issue, courseware:lessons
//
// The intersection of the first two is ONE scope, and the consequences ran both
// ways:
//
//   1. THE SCOPE THE PAYWALL NEEDS COULD NOT BE MINTED. Asking the console for
//      `courseware:lessons` returned 400 `unknown scope`. The gate was built,
//      the database was ready, and there was no way to issue a key that passed
//      it -- discovered when the paywall smoke test needed one.
//
//   2. TWO SCOPES THE MINTER ACCEPTED COULD NOT BE STORED. credentials:read and
//      achievements:read pass its validator and then violate
//      issuer_api_keys_scope_vocab on the insert, which the function reports as
//      500 "failed to create API key" -- a validation error wearing a server
//      fault, sending the next person to the logs rather than to the scope.
//
// ===================== WHOSE FAULT, PRECISELY =====================
//
// Migration 322 wrote that CHECK and justified it by measuring the ROWS:
// "Every existing row holds credentials:issue only, measured, so nothing is
// invalidated." True, and beside the point. CLAUDE.md states the rule two
// sections above where 322 was written:
//
//   "A backfill covers the rows that exist. Only the writer list covers the
//    rows that do not exist yet."
//
// It is filed there under NOT NULL columns. IT IS THE SAME RULE FOR A CHECK
// CONSTRAINT, and for any constraint at all: a vocabulary derived from what a
// table currently holds says nothing about what its writers can produce. One
// grep of `from("issuer_api_keys")` -- which 322's own header format demands --
// would have found create-issuer-api-key and the two scopes it can emit.
//
// ===================== A SCOPE WITH NO ENFORCER IS NOT A SCOPE =====================
//
// credentials:read and achievements:read are NOT restored here. Nothing in
// either repository reads them -- measured by grep across functions/, scripts/
// and certidemy-web -- and no key has ever held one. A scope that only the
// minter knows about is a restriction a partner is shown and nobody applies,
// which is this platform's recurring failure mode wearing an access-control
// costume: the key looks limited and is not.
//
// Re-adding one is cheap and should happen WITH its enforcer, in the same
// change: add it here, widen issuer_api_keys_scope_vocab, and name the endpoint
// that refuses a key without it.
//
// ===================== THE MIRROR IS IN SQL AND CANNOT IMPORT THIS =====================
//
// `issuer_api_keys_scope_vocab` (migration 322) holds the same list as a CHECK.
// A constraint cannot import a TypeScript module, so this is a genuine mirrored
// pair and both halves are named at both ends. THE DATABASE IS THE AUTHORITY:
// it refuses a bad row whatever code wrote it, and this list exists so the
// refusal arrives as a 400 naming the scope instead of a 23514 wearing a 500.
//
// ===================== "THE DATABASE" IS TWO OBJECTS, NOT ONE ================
//
// [CORRECTED 2026-09-18.] The paragraph above is right and understates it. The
// authority is not one constraint; it is two, and they answer two different
// questions:
//
//   issuer_api_keys_scope_vocab   what may be MINTED                (322)
//   public.mcp_features           what may be USED at request time  (331),
//                                 on the API-key route AND the OAuth one
//
// A scope must be in BOTH. They fail differently, and only the first looks like
// a scope problem:
//
//   missing from the mint CHECK   400 at key creation, naming the scope.
//   missing from mcp_features     THE KEY MINTS AND EVERY CALL IS REFUSED.
//                                 mcp.feature_status returns 'unknown_feature'
//                                 and courseware-read refuses anything but
//                                 'ok'. Reads as an entitlement bug, and the
//                                 scope string is spelled correctly in every
//                                 place a human would think to look.
//
// The second fails CLOSED, which is right, and is the one nobody goes looking
// for. Migration 347 widens both and proves each by attempting a write rather
// than by reading a constraint's text.
//
// ============ AND THIS SECTION SAID THREE, FOR AN HOUR, FOR THE REASON THE
// ============ FILE ABOVE IS ABOUT.
//
// It named `issuers_mcp_scopes_vocab` (329) as a third. THAT CONSTRAINT AND ITS
// COLUMN ARE GONE: migration 331 retired `issuers.mcp_scopes` when
// grant-by-default replaced it, and Postgres dropped the CHECK with the column.
// Confirmed against pg_catalog -- no matching pg_constraint row, no matching
// pg_attribute row -- and `mcp.resolve_oauth_caller` in pg_proc references the
// feature tables and mentions mcp_scopes nowhere.
//
// The claim came from READING MIGRATION 329 AND INFERRING THE COLUMN STILL
// EXISTED. A migration records an intention at a moment; pg_catalog records the
// database. Writing an inventory of the schema from its migration history is
// the same defect as reading the next free migration number from a note instead
// of the folder, and 347 aborted on it.
//
// SO: adding a scope is FOUR places in this repository -- this file,
// SCOPE_FOR_RESOURCE in courseware-query.ts, scripts/mint-issuer-key.mjs, and
// one migration touching both database objects -- plus the console mirror and
// its locale strings in certidemy-web.
// scripts/check-cross-repo-vocabulary.mjs now compares the two repositories'
// lists, which is the half that used to be unguarded. Nothing there can see
// either database object; only the migration can.

/**
 * Every scope that may be granted to an issuer API key, with the single thing
 * that enforces it. An entry with no enforcer does not belong here.
 */
export const API_SCOPES = {
  "credentials:issue": "functions/issue-partner-credential -- mint a credential",
  "courseware:lessons": "functions/courseware-read -- read AISM-I lesson bodies",
  "courseware:rubric": "functions/courseware-read -- read the item-writing rubric for one task",
} as const;

export type ApiScope = keyof typeof API_SCOPES;

/** The vocabulary as a list, in the order the CHECK constraint declares it. */
export const API_SCOPE_NAMES = Object.keys(API_SCOPES) as ApiScope[];

/** The default when a caller names none. Unchanged since migration 232. */
export const DEFAULT_API_SCOPES: ApiScope[] = ["credentials:issue"];

export function isApiScope(s: string): s is ApiScope {
  return Object.prototype.hasOwnProperty.call(API_SCOPES, s);
}

/**
 * The refusal message. It NAMES THE WHOLE VOCABULARY, because the failure this
 * replaces was a caller asking for a real scope, being told it was unknown, and
 * having no way to discover what was known.
 */
export function rejectScope(bad: string): string {
  return (
    `unknown scope "${bad}". Valid scopes are: ${API_SCOPE_NAMES.join(", ")}. ` +
    "This list is also a CHECK constraint on issuer_api_keys, so a scope missing " +
    "from it cannot be stored even if it were accepted here."
  );
}
