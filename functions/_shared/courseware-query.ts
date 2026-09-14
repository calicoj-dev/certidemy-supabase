// functions/_shared/courseware-query.ts
//
// THE PURE HALF OF courseware-read: what it accepts and what SQL it emits.
//
// ===================== WHY THIS IS A SEPARATE MODULE =====================
//
// It lived inside index.ts, which calls serve() at import, so NOTHING COULD
// IMPORT IT AND NOTHING TESTED IT. The only way to exercise the SQL was to
// deploy and call the endpoint.
//
// That gap shipped a defect on 2026-09-14. The v2 search SQL was checked by hand
// against the views and ran correctly -- as `postgres`, with literal values,
// without the driver. The function runs it as `mcp_reader`, with BOUND
// PARAMETERS, through deno-postgres. Three differences, none of them covered by
// the hand check, and the smoke test only sees a 500 with the body "read failed"
// because the handler deliberately returns no internals to an unauthenticated
// caller. Correct of the handler; useless for diagnosis.
//
// Exported here so scripts/repro-courseware-sql.ts can run THE REAL BUILDER
// against the REAL role through the REAL driver, before a deploy rather than
// after one. If this module and the function ever disagree, the function is
// importing this file -- there is no second copy to drift.

export const RESOURCES = ["certification", "task", "concept", "search"] as const;
export type Resource = typeof RESOURCES[number];

// mcp.task and mcp.lesson carry these three; mcp.concept and mcp.certification
// are English-only, which is a fact about the data and not about this list.
// MCP-COURSEWARE.md section 5.
export const LANGUAGES = ["en", "es-419", "pt-BR"] as const;
type Language = typeof LANGUAGES[number];

const DOMAIN_RE = /^D[0-9]{1,2}$/;
const TASK_RE = /^[0-9]{1,2}\.[0-9]{1,2}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG = 100;
const MAX_QUERY = 200;
const MIN_QUERY = 2;
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

// Per resource, exactly the keys it accepts. Anything else is a 400 rather than
// a shrug: an unknown key means the caller believes it is filtering and this
// function is not, which is the failure mode a permissive parser produces
// silently.
const ALLOWED: Record<Resource, string[]> = {
  certification: ["resource"],
  task: ["resource", "language", "domain_code", "task_code", "limit"],
  concept: ["resource", "slug", "task_code", "limit"],
  search: ["resource", "query", "language", "limit"],
};

export type Args = {
  resource: Resource;
  language: Language;
  domain_code?: string;
  task_code?: string;
  slug?: string;
  query?: string;
  limit: number;
};

export function bad(msg: string): never {
  throw new BadRequest(msg);
}
export class BadRequest extends Error {}

export function validateArgs(raw: unknown): Args {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    bad("body must be a JSON object");
  }
  const b = raw as Record<string, unknown>;

  const resource = b.resource;
  if (typeof resource !== "string" || !(RESOURCES as readonly string[]).includes(resource)) {
    bad(`resource must be one of: ${RESOURCES.join(", ")}`);
  }
  const res = resource as Resource;

  for (const key of Object.keys(b)) {
    if (!ALLOWED[res].includes(key)) {
      bad(`unknown field '${key}' for resource '${res}'`);
    }
  }

  let language: Language = "en";
  if (b.language !== undefined) {
    if (typeof b.language !== "string" || !(LANGUAGES as readonly string[]).includes(b.language)) {
      bad(`language must be one of: ${LANGUAGES.join(", ")}`);
    }
    language = b.language as Language;
  }

  let limit = DEFAULT_LIMIT;
  if (b.limit !== undefined) {
    if (typeof b.limit !== "number" || !Number.isInteger(b.limit) || b.limit < 1 || b.limit > MAX_LIMIT) {
      bad(`limit must be an integer between 1 and ${MAX_LIMIT}`);
    }
    limit = b.limit;
  }

  const out: Args = { resource: res, language, limit };

  if (b.domain_code !== undefined) {
    if (typeof b.domain_code !== "string" || !DOMAIN_RE.test(b.domain_code)) {
      bad("domain_code must look like D1");
    }
    out.domain_code = b.domain_code;
  }
  if (b.task_code !== undefined) {
    if (typeof b.task_code !== "string" || !TASK_RE.test(b.task_code)) {
      bad("task_code must look like 1.2");
    }
    out.task_code = b.task_code;
  }
  if (b.slug !== undefined) {
    if (typeof b.slug !== "string" || b.slug.length > MAX_SLUG || !SLUG_RE.test(b.slug)) {
      bad("slug must be lowercase kebab-case");
    }
    out.slug = b.slug;
  }
  if (res === "search") {
    if (typeof b.query !== "string") bad("query is required for resource 'search'");
    const q = b.query.trim();
    // Length only. The value itself never reaches a log line or an error
    // message -- an error quoting the query is a log entry wearing a 400.
    if (q.length < MIN_QUERY || q.length > MAX_QUERY) {
      bad(`query must be between ${MIN_QUERY} and ${MAX_QUERY} characters`);
    }
    out.query = q;
  } else if (b.query !== undefined) {
    bad(`query is only valid for resource 'search'`);
  }

  return out;
}

// ------------------------------------------------------------------ queries
//
// Every value is a bound parameter. No identifier and no literal is built from
// caller input, so there is nothing for a quote to escape out of.

export type Q = { text: string; args: unknown[] };

export function buildQuery(a: Args): { q: Q; searched?: string[] } {
  switch (a.resource) {
    case "certification":
      return {
        q: {
          text:
            "select code, name, description, tier, status, exam_duration_minutes, " +
            "passing_score_pct, num_questions, max_exam_attempts, attempt_window_months, validity_days " +
            "from mcp.certification",
          args: [],
        },
      };

    case "task":
      return {
        q: {
          text:
            "select domain_code, domain_title, domain_title_is_fallback, domain_weight_pct, " +
            "task_code, language, statement, knowledge, skills, abilities, bloom_level, " +
            "is_exam_scope, scope_tag " +
            "from mcp.task " +
            "where language = $1 " +
            "and ($2::text is null or domain_code = $2) " +
            "and ($3::text is null or task_code = $3) " +
            "order by domain_order, task_order " +
            "limit $4",
          args: [a.language, a.domain_code ?? null, a.task_code ?? null, a.limit],
        },
      };

    case "concept":
      return {
        q: {
          text:
            "select slug, name, description, task_codes " +
            "from mcp.concept " +
            "where ($1::text is null or slug = $1) " +
            "and ($2::text is null or $2 = any(task_codes)) " +
            "order by slug " +
            "limit $3",
          args: [a.slug ?? null, a.task_code ?? null, a.limit],
        },
      };

    case "search": {
      // MCP-COURSEWARE.md section 5: there is no concept_translations table, so
      // a non-English search covers tasks and KSAs and NOT concepts. That
      // reduction is REPORTED rather than absorbed, for the same reason
      // mcp.task exposes domain_title_is_fallback -- a thinner result the
      // caller cannot detect is the same defect class as a dropped read.
      const withConcepts = a.language === "en";
      const searched = withConcepts ? ["task", "concept"] : ["task"];

      // ===================== WHY THERE IS A SCORE AT ALL =====================
      //
      // This ordered by `kind, key` and truncated at `limit`. 'concept' sorts
      // before 'task', so a broad query returned CONCEPTS ONLY: on AISM-I, "AI"
      // matched 92 concepts and 54 tasks, and at the default limit of 20 a
      // partner received twenty concepts and NOT ONE TASK -- from the tool whose
      // stated job is what a credential examines. It reported truncated:true
      // honestly, which made it worse: correct, self-describing and useless.
      //
      // ============== AND THE MATCHING WAS WRONG UNDERNEATH IT ==============
      //
      // It matched with ILIKE '%term%', which has no notion of a word. "AI"
      // matched inside "expl-AI-n", "dom-AI-n", "avail-AI-ble" -- so task 1.1,
      // "Explain why service management exists", counted as a match for AI. The
      // 92/54 above were themselves inflated: with word boundaries the honest
      // figures are 60 and 36, and every score component fired on every row, so
      // the score could not discriminate even once the ordering was fixed.
      //
      // Matching is now `~* '\y<term>'`: anchored at a WORD BOUNDARY, with any
      // suffix allowed. The leading boundary kills "explain"; the open suffix
      // keeps "incident" matching "incidents" and "AI" matching "AIOps".
      // Deliberately NOT '\y<term>\y', which would lose the plural -- the same
      // morphology trap CLAUDE.md records for the vocabulary patterns. Note a
      // hyphen counts as a boundary, which is wanted here.
      //
      // NOT FULL-TEXT SEARCH, AND THAT IS DELIBERATE. tsvector + GIN is the
      // reflex and buys nothing: a search is CERTIFICATION-SCOPED, so the corpus
      // is 61 tasks and 226 concepts today and stays a few hundred rows at
      // twelve certifications -- the scan is microseconds. It would also cost a
      // per-language regconfig, and to_tsvector(CASE language ...) is not
      // immutable, so indexing means partial indexes per language per table.
      // Real machinery for a performance problem that does not exist. This works
      // identically across en, es-419 and pt-BR and can be replaced by FTS later
      // without touching the tool contract.
      //
      // THE SCALE IS ARBITRARY AND ITS ORDERING IS NOT. A phrase hit in the
      // primary field outranks any number of scattered term hits, because a task
      // whose STATEMENT contains the phrase is what was asked for.
      const rx = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const terms = a.query!.toLowerCase().split(/\s+/).filter((t) => t.length >= 2).slice(0, 8);
      const phrase = "\\y" + rx(a.query!.trim()).replace(/\s+/g, "\\s+");

      // $1 phrase, $2 language, $3 limit, then one param per term.
      const args: unknown[] = [phrase, a.language, a.limit];
      const termParams: string[] = [];
      for (const t of terms) {
        args.push("\\y" + rx(t));
        termParams.push(`$${args.length}`);
      }
      const score = (primary: string, secondary: string) => {
        const parts = [
          `(case when ${primary} ~* $1 then 100 else 0 end)`,
          `(case when ${secondary} ~* $1 then 40 else 0 end)`,
        ];
        for (const p of termParams) {
          parts.push(`(case when ${primary} ~* ${p} then 10 else 0 end)`);
          parts.push(`(case when ${secondary} ~* ${p} then 3 else 0 end)`);
        }
        return parts.join(" + ");
      };
      const anyOf = (primary: string, secondary: string) =>
        [`${primary} ~* $1`, `${secondary} ~* $1`]
          .concat(termParams.flatMap((p) => [`${primary} ~* ${p}`, `${secondary} ~* ${p}`]))
          .join(" or ");

      const ksa =
        "coalesce(knowledge,'') || ' ' || coalesce(skills,'') || ' ' || coalesce(abilities,'')";
      const taskPart =
        "select 'task' as kind, task_code as key, statement as title, domain_code, " +
        score("statement", ksa) + " as score " +
        "from mcp.task where language = $2 and (" + anyOf("statement", ksa) + ")";
      const conceptPart =
        " union all " +
        "select 'concept', slug, name, null::text, " +
        score("name", "coalesce(description,'')") + " " +
        "from mcp.concept where (" + anyOf("name", "coalesce(description,'')") + ")";

      // kind_total is a window count over ALL matches of that kind, computed
      // BEFORE the row_number cut -- so the caller is told how many exist, not
      // how many came back. Without it "20 results" cannot be told apart from
      // "20 results out of 60".
      //
      // THE ORDER BY IS PART OF THE PUBLISHED CONTRACT: score, then key. LIMIT
      // over equal scores is unstable in Postgres without a tie-break, and a
      // partner who runs the same query twice and gets different answers is
      // right to conclude the tool is broken. Changing this later is a contract
      // change, not a tidy-up.
      return {
        q: {
          text:
            "with m as (" + taskPart + (withConcepts ? conceptPart : "") + "), " +
            // ::int ON BOTH, AND THE CAST IS THE FIX RATHER THAN A TIDY-UP.
            // count(*) and row_number() return BIGINT; deno-postgres maps bigint
            // to a JS BigInt; JSON.stringify THROWS on BigInt. So the query
            // succeeded -- rows:86, ms:75, both kinds searched -- and the caller
            // got 500 "read failed" purely in serialising a correct result.
            //
            // Cast at the SOURCE so nothing downstream has to know. A serialiser
            // that special-cases BigInt would push the knowledge into every
            // consumer and would still be wrong the next time a count is added.
            //
            // rn is cast too although it is NOT selected: it is safe today only
            // by omission, and adding it to the output later would reproduce this
            // exactly. No column in any of the four views is bigint -- checked
            // against information_schema, they are all smallint or integer -- so
            // these two functions are the only bigint sources that exist here.
            "r as (select *, count(*) over (partition by kind)::int as kind_total, " +
            "row_number() over (partition by kind order by score desc, key asc)::int as rn from m) " +
            "select kind, key, title, domain_code, score, kind_total " +
            "from r where rn <= $3 order by kind, rn",
          args,
        },
        searched,
      };
    }
  }
}
