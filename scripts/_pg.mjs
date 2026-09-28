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

/**
 * Rows requested per round trip.
 *
 * THIS NUMBER IS A THROUGHPUT CHOICE AND NOT A CORRECTNESS ONE. Do not reason
 * about it against PostgREST's row cap, and do not lower it believing that
 * makes the loop safe.
 *
 * It used to be both. `getAll` terminated on `page.length < PAGE` with PAGE
 * set to exactly the server's cap, so the loop was correct only because two
 * numbers in two different systems happened to be equal -- and nothing in the
 * program stated the dependency. Lower `db-max-rows` to 500 and every read
 * returns 500, the loop sees 500 < 1000, stops, and SEVEN TABLES TRUNCATE
 * SILENTLY AT ONCE. Lowering PAGE to 500 would not have fixed that; it would
 * have moved the coincidence.
 *
 * Correctness now rests entirely on the count assertion in `getAll` below:
 * the server is asked for the total and the loop must reach it. With that in
 * place PAGE may be any value, and a lowered cap fails loudly on the first
 * table instead of quietly on all of them.
 */
const PAGE = 1000;

/**
 * SUPABASE_SERVICE_ROLE_KEY from the environment, or from a .env beside the
 * supabase folder. It is a secret: never commit it, never print it.
 *
 * THE SCRIPT DIRECTORY ITSELF IS FIRST, AND ITS ABSENCE WAS A REAL BUG.
 * This looked only one and two levels ABOVE scripts/, while the sibling loaders
 * in audit-quotations.mjs and audit-quotations-unmarked.mjs check `scripts/.env`
 * AND the parent. The key on this machine lives in `scripts/.env`, so every
 * _pg.mjs-based script exited 1 with "key not found" on a fresh shell while the
 * scripts beside it worked -- which reads as a credential problem rather than a
 * path problem, and sends the reader to Project Settings instead of to this
 * function. Same list as the siblings now, most specific first.
 */
export function loadKey(scriptDir) {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY;
  for (const c of [
    join(scriptDir, ".env"),
    join(scriptDir, "..", ".env"),
    join(scriptDir, "..", "..", ".env"),
  ]) {
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
  /* ============ A PAGED READ WITHOUT AN ORDER IS A DIFFERENT ANSWER EVERY TIME ============
   *
   * Found 2026-09-28, and it is the count assertion's blind spot rather than a failure of it.
   *
   * `Range: 0-999` then `1000-1999` over a query with NO `order by` is unordered pagination:
   * Postgres may return the pages in any order it likes, so a row can appear in two pages while
   * another appears in none. THE COUNT STILL MATCHES -- 28,179 rows collected against 28,179
   * reported -- so the assertion below passes and the SET is silently wrong.
   *
   * Measured on `quiz_questions?select=status`, twice in one minute:
   *
   *     run 1   approved 27764   rejected 415   pending_review  0
   *     run 2   approved 27838   rejected 341   pending_review  0
   *     with &order=id            approved 27899  rejected 248  pending_review 32   (stable, 0 dups)
   *
   * The 32 rows it lost were the ones being looked for. Worse, a caller that builds an id-keyed map
   * from an unordered read gets a map with holes, and `map.get(id)` on a missing row returns
   * undefined -- which every caller here treats as "not applicable" and skips. A dropped read
   * becoming an answer, one level below where this file already guards against it.
   *
   * IT COST A REPORTED FIGURE. The key-exposure exposure counts went from "11 post-retirement
   * attempts, 1 user" to 55 attempts across 3 users once the reads were ordered.
   *
   * SO THE ORDER IS REQUIRED, NOT RECOMMENDED. A note would have to be remembered by every caller;
   * this cannot be. PostgREST has no stable implicit order to fall back on, and picking one here
   * ("append order=id") would be wrong for the tables whose key is not `id`.
   *
   * BUT IT IS REQUIRED ONLY WHERE THE HAZARD EXISTS, WHICH IS BEFORE THE SECOND PAGE. Demanding it
   * of every path fired on 51 call sites, nearly all of them single-row reads bounded by
   * `&id=eq.<uuid>` or `&code=eq.AIMS-F` that never paginate at all -- and a guard that fires on the
   * normal case is deleted by the first person it inconveniences, taking the real assertion with it.
   *
   * A read whose total fits in one page is ordered or not with no consequence: there is no second
   * page for a row to move between. The total arrives in the FIRST response, so the check belongs
   * exactly there -- after page one, before page two. Zero false positives by construction. */
  const rows = [];
  let total = null;

  for (let from = 0; ; from += PAGE) {
    const res = await fetch(`${REST_URL}/${path}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
        Range: `${from}-${from + PAGE - 1}`,
        "Range-Unit": "items",
        // THE TOTAL IS ASKED FOR ON EVERY REQUEST, not only the first. A total
        // that changed under a long read is a concurrent write, and the
        // assertion below should see it rather than compare against a stale
        // figure captured before the first page.
        Prefer: "count=exact",
      },
    });
    if (!res.ok && res.status !== 206) {
      throw new Error(`${res.status} ${res.statusText} on ${path}\n${await res.text()}`);
    }

    // "0-999/1730", or "*/0" for an empty result.
    const range = String(res.headers.get("content-range") || "");
    const said = Number(range.split("/")[1]);
    if (!Number.isFinite(said)) {
      // A count read that yields no count is a DROPPED READ, not a zero. If
      // this ever fires, the server stopped honouring count=exact and every
      // figure downstream would otherwise be a floor wearing the costume of a
      // total.
      throw new Error(`no parseable content-range total on ${path} (got "${range}")`);
    }
    if (total === null) total = said;

    const page = await res.json();
    if (!Array.isArray(page)) {
      throw new Error(`${path} returned ${typeof page}, expected an array`);
    }
    rows.push(...page);

    // TERMINATION IS REACHING THE TOTAL, never "this page looked short". A
    // short page is not evidence of exhaustion -- it is what a lowered row
    // cap, a dropped page and a finished read all look like.
    if (rows.length >= total) break;

    // A SECOND PAGE IS ABOUT TO BE FETCHED, so the order now decides which rows
    // come back. See the header: the count assertion cannot see an unordered
    // read's overlap, because the totals match while the set is wrong. This is
    // the only point at which the hazard becomes real, so it is the only point
    // that refuses.
    if (!/[?&]order=/.test(String(path))) {
      throw new Error(
        `getAll: ${path}\nneeds ${total} rows, which is more than one page of ${PAGE}, and the ` +
          `path has no \`order=\`. Unordered Range pagination can return one row twice and ` +
          `another not at all, and the count assertion cannot see it: the totals match while the ` +
          `SET is wrong. Add an explicit order on a unique column, e.g. \`&order=id\`.`,
      );
    }

    // Stall guard. An empty page before the total is reached cannot make
    // progress, so returning here would return short.
    if (page.length === 0) {
      throw new Error(
        `SHORT READ on ${path}: server returned an empty page at offset ${from} ` +
          `with ${rows.length} of ${total} row(s) collected`,
      );
    }
    if (from > 500000) throw new Error(`pagination runaway on ${path}`);

    // TEST HOOK, and the only reason it exists: a count assertion nobody has
    // watched fail is the same object as a gate nobody has watched fire. Set
    // _PG_TRUNCATE_AFTER_PAGES=1 to cut the loop short and prove the throw.
    const cut = Number(process.env._PG_TRUNCATE_AFTER_PAGES || 0);
    if (cut > 0 && rows.length >= cut * PAGE) break;
  }

  if (rows.length !== total) {
    throw new Error(
      `SHORT READ on ${path}: collected ${rows.length} row(s), server says ${total}`,
    );
  }
  return rows;
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
