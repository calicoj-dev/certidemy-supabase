// scripts/_pg.mjs
//
// Shared PostgREST access for the analyzer scripts. One paginating fetch and one
// credential loader, so neither gets reimplemented four times and drifts.
//
// ===================== WHY THIS FILE EXISTS =====================
//
// PostgREST caps a response at 1000 rows by default AND SAYS NOTHING ABOUT IT.
// You get 1000 rows, HTTP 200, no warning.
//
// verify-invariants.mjs shipped without pagination and fetched 1000 of 1599
// concepts. It then reported the other 599 as having no lesson and no task:
// 606 false failures on completely healthy data, produced by the one tool whose
// entire job is to be believed when it says something is wrong.
//
// A checker that cries wolf is worse than no checker. People learn to dismiss
// it, and then it is silent when something is genuinely broken.
//
// This is the same failure family as `create table if not exists` skipping
// silently and `grep | head` masking an exit code: the operation SUCCEEDS,
// returns something plausible, and the truncation is invisible. The tell is
// always a suspiciously round number.

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const PROJECT_REF = "pctynukndxnmnxiqpgck";
export const REST_URL = `https://${PROJECT_REF}.supabase.co/rest/v1`;

/** PostgREST default page size. */
const PAGE = 1000;

/**
 * SUPABASE_SERVICE_ROLE_KEY from the environment, or from a .env beside the
 * supabase folder. It is a secret: never commit it, never print it.
 */
export function loadKey(scriptDir) {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY;
  for (const c of [join(scriptDir, "..", ".env"), join(scriptDir, "..", "..", ".env")]) {
    if (!existsSync(c)) continue;
    const m = readFileSync(c, "utf8").match(/^\s*SUPABASE_SERVICE_ROLE_KEY\s*=\s*"?([^"\n\r]+)"?/m);
    if (m) return m[1].trim();
  }
  return null;
}

export function requireKey(scriptDir) {
  const key = loadKey(scriptDir);
  if (!key) {
    console.error(
      [
        "SUPABASE_SERVICE_ROLE_KEY not found.",
        "",
        "Set it for this shell only:",
        '  $env:SUPABASE_SERVICE_ROLE_KEY = "<key>"',
        "",
        "Project Settings -> API. It is a secret; do not commit it.",
      ].join("\n"),
    );
    process.exit(1);
  }
  return key;
}

/**
 * Fetch every row for a PostgREST path, following the 1000-row page boundary.
 *
 * ALWAYS include an `order=` in the path for any query that may exceed one page.
 * Without a stable sort, PostgREST does not guarantee page boundaries line up
 * and rows can be duplicated or skipped across pages -- a subtler version of the
 * same silent-wrongness this file exists to prevent.
 */
export async function getAll(key, path) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const res = await fetch(`${REST_URL}/${path}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
        Range: `${from}-${from + PAGE - 1}`,
        "Range-Unit": "items",
      },
    });
    if (!res.ok && res.status !== 206) {
      throw new Error(`${res.status} ${res.statusText} on ${path}\n${await res.text()}`);
    }
    const page = await res.json();
    if (!Array.isArray(page)) {
      throw new Error(`${path} returned ${typeof page}, expected an array`);
    }
    rows.push(...page);
    if (page.length < PAGE) return rows;
    // A server ignoring Range would return page one forever.
    if (from > 500000) throw new Error(`pagination runaway on ${path}`);
  }
}

/**
 * Chunk a list of ids for `in.(...)` filters.
 *
 * A URL has a length limit and 1599 uuids is roughly 60KB, which fails as a
 * request line long before it fails as a query. Chunked at 300 ids, which is
 * about 11KB per request.
 */
export function chunk(ids, size = 300) {
  const out = [];
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size));
  return out;
}

/** getAll across chunked id filters, concatenated. */
export async function getAllIn(key, table, select, column, ids, extra = "") {
  const rows = [];
  for (const part of chunk(ids)) {
    rows.push(
      ...(await getAll(key, `${table}?select=${select}&${column}=in.(${part.join(",")})${extra}`)),
    );
  }
  return rows;
}
