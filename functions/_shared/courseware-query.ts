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

export const RESOURCES = ["certification", "task", "concept", "search", "log", "lesson", "lesson_index", "rubric"] as const;
export type Resource = typeof RESOURCES[number];

/**
 * WHICH RESOURCES COST A SCOPE, AND THE DEFAULT IS "NONE".
 *
 * A map rather than an `if (resource === "lesson")` at the gate, because the
 * question "what does this resource require" is then answerable by reading one
 * object instead of by auditing the handler -- and a resource added to RESOURCES
 * without an entry here is PUBLIC, which is the correct default only because
 * RESOURCES is a closed list reviewed in the same file.
 *
 * lesson_index is deliberately absent. Migration 322: the catalogue is public so
 * a partner can see what exists before paying for it, and it cannot leak a body
 * because the view does not project content_md.
 *
 * MIRRORED IN ../certidemy-web/lib/mcp/courseware-contract.ts, which needs the
 * same map to decide whether to demand a key before calling. Two repos, so no
 * shared module is possible; the pair is named at both ends.
 */
export const SCOPE_FOR_RESOURCE: Readonly<Partial<Record<Resource, string>>> = {
  lesson: "courseware:lessons",
  // Its own key, not folded into courseware:lessons. The rubric is the
  // proprietary half -- the item contract, the grounding and the never-assert
  // list -- and is sold separately from lesson bodies.
  rubric: "courseware:rubric",
};

/** The scope a resource costs, or null if it is public. */
export function requiredScope(resource: Resource): string | null {
  return SCOPE_FOR_RESOURCE[resource] ?? null;
}

// mcp.task, mcp.lesson, mcp.lesson_index and -- since migration 343 --
// mcp.certification carry these three. mcp.concept is English-only, and that
// is a fact about the DATA and not about this list: there is no concept
// translation table under either naming convention here
// (`concept_translations` and `concept_i18n` both absent, measured
// 2026-09-17), and 1,730 concepts is a project rather than a pass.
// MCP-COURSEWARE.md section 5.
/**
 * THE CERTIFICATIONS SERVED, AND THE DATABASE IS THE AUTHORITY.
 *
 * Migration 325 names the same four in the WHERE clause of all five mcp views.
 * Four are NOT served -- the ISO-derived ones, pending the clause-text leak
 * detector IP-POSITION section 6 requires. The four Scrum certifications were
 * held pending a quotation-marking pass and joined on 2026-09-16 (migration 328).
 *
 * THIS LIST TOOK THE CURRICULUM SURFACE DOWN ON 2026-09-16. 328 widened the views
 * to eight; this array still said four; and the cold-start assertion below --
 * which exists to catch exactly that disagreement -- did what it was built to do
 * and REFUSED TO SERVE ANYTHING. Not the four new ones. All eight. A guard whose
 * failure mode is total is correct and is also an outage, and the ordering that
 * avoids it is: widen this FIRST, deploy, then widen the views.
 *
 * THIS LIST IS NOT THE BOUNDARY. The views are. A held certification is absent
 * from them, so if this array were widened by mistake the query would simply
 * return nothing -- the failure is empty, not a leak. What this buys is a 400
 * naming the vocabulary instead of a silent empty result.
 *
 * And it is CHECKED rather than trusted: courseware-read asserts at cold start
 * that `select distinct code from mcp.certification` equals this array, and
 * refuses to serve on a difference. Three copies of a list across two languages
 * and a repository boundary is a mirrored pair; this is the half that can be
 * tested against the database, so it is the half that tests it.
 */
export const CERTIFICATIONS = [
  "AISM-I", "AIE-I", "AIHR-I", "AIGRM-I",
  "SM-AI-I", "SM-AI-II", "SPO-AI-I", "SD-AI-I",
  // Joined 2026-09-17 with migration 334, once both blueprints measured clean
  // of reproduced ISO clause text. AIMS-F's LESSON BODIES are still mostly
  // withheld by lessons.mcp_servable -- being in this list is being offered,
  // not being complete, and the two are gated in different places on purpose.
  "ISMS-F", "AIMS-F",
  // ==================== LANDS ONLY AFTER MIGRATION 336 ====================
  // AIMS-IA's forty lessons measured clean on 2026-09-17 (0 refused, longest
  // run 9w) but 334 put it in `held`, so every mcp view filtered it out and the
  // certification was unreachable while every one of its rows said servable.
  // 336 admits it.
  //
  // THE ORDER IS NOT INTERCHANGEABLE. Migration first, then this deploy.
  // Deploying this ahead of 336 makes the function ACCEPT `AIMS-IA` and the
  // view return nothing, so a partner is told the certification has no lessons
  // -- a plausible empty answer, which is the failure mode this repo keeps
  // paying for. The other order gives a clean "not served" refusal until the
  // migration lands, which is true at the time it is said.
  "AIMS-IA",
  // ==================== LANDS ONLY AFTER MIGRATION 337 ====================
  // ISMS-IA was the last held certification. 336 kept it out "pending a display
  // mechanism for its 48 blockquoted clause passages"; that mechanism was never
  // needed, because IP-POSITION section 6 was amended to permit clause text
  // that is quoted AND attributed. Its 79 prose runs were recast and its 19
  // bare blockquotes were given a clause address. 0 refused, longest run 9w.
  //
  // SAME ORDER AS 336, for the same reason: migration first, then this deploy.
  // Ahead of the migration the function accepts `ISMS-IA` and the view returns
  // nothing, so a partner is told the certification has no lessons.
  "ISMS-IA",
] as const;
export type Certification = typeof CERTIFICATIONS[number];
export const DEFAULT_CERTIFICATION: Certification = "AISM-I";

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
// `certification` NOW MEANS TWO THINGS AND THE RESOURCES ARE DISJOINT.
// On the five readable resources it names WHICH certification to read. On `log`
// it names the one a caller asked for and was REFUSED, which is stored in
// mcp_requests.refused_certification and never read back as a selector. Same
// word, different question, and no request carries both readings.
const ALLOWED: Record<Resource, string[]> = {
  // `language` added by migration 343. Before it, mcp.certification had no
  // language dimension at all, so a Spanish request was REFUSED rather than
  // answered in English -- a 400 that reads as a bad field name.
  certification: ["resource", "language", "tool", "certification"],
  task: ["resource", "language", "domain_code", "task_code", "limit", "tool", "certification"],
  concept: ["resource", "slug", "task_code", "limit", "tool", "certification"],
  search: ["resource", "query", "language", "limit", "tool", "certification"],
  // The Worker's telemetry-only call. A certification refusal is decided in the
  // Worker's validator, BEFORE any read is attempted, so it never reaches a
  // readable resource -- and "which certifications do partners ask for and get
  // refused" is the most commercially interesting event on this endpoint.
  log: ["resource", "event", "tool", "certification", "language", "auth"],
  // THE ONLY RESOURCE SERVED BY THE HOLDER POOL. mcp_reader has no grant on
  // mcp.lesson, so a misrouted request fails in the database rather than on a
  // branch here.
  lesson: ["resource", "lesson_slug", "language", "tool", "certification"],
  // The catalogue. mcp.lesson_index does not project content_md, so this is
  // readable by mcp_reader and there is no body to withhold.
  lesson_index: ["resource", "language", "module_slug", "limit", "tool", "certification"],
  // THE ITEM-WRITING RUBRIC for one task. Assembled by the handler from the
  // SAME modules the generators use, never a copy -- scripts/check-prompt-parity
  // asserts the served bytes equal the generated bytes.
  //
  // `kind` IS DELIBERATELY NOT ACCEPTED. The assembler takes "practice" or
  // "secure", and the secure profile is a different difficulty contract for the
  // certification exam bank. A partner may have the practice rubric and must not
  // be able to ask for the other one by adding a field, so the choice is made
  // here and not in the request.
  rubric: ["resource", "certification", "task_code", "language", "tool"],
};

export type Args = {
  resource: Resource;
  language: Language;
  domain_code?: string;
  task_code?: string;
  slug?: string;
  query?: string;
  limit: number;
  tool?: string;
  event?: string;
  auth?: string;
  certification?: string;
  lesson_slug?: string;
  module_slug?: string;
};

/** The tools, so `tool` is a closed vocabulary rather than free text. */
export const TOOLS = [
  "search_blueprint", "get_concept", "get_syllabus", "explain_task",
  // Added with the lesson path. Without them a certification refusal from
  // get_lesson logged tool=null and became indistinguishable from a refusal by
  // a tool that does not exist -- the telemetry table's whole purpose is to say
  // WHICH tool a partner reached for and was turned away from.
  "get_lesson", "list_lessons",
  // Added with the rubric resource, 2026-09-19, AND IT WAS MISSED WHEN THAT
  // RESOURCE SHIPPED. RESOURCES, ALLOWED, SCOPE_FOR_RESOURCE and the handler
  // all gained `rubric`; this list did not, so every keyed call 400'd with
  // "tool must be one of" -- the resource worked and the tool could not reach
  // it. TOOLS is a mirrored pair with the Worker's registry across a repository
  // boundary, and nothing compared them until this.
  "get_rubric",
] as const;
export const LOG_EVENTS = ["certification_refused", "auth_refused"] as const;

/**
 * The auth resolutions the Worker may report on an `auth_refused` event.
 *
 * A VOCABULARY, BECAUSE THIS ENDPOINT IS PUBLIC. Anyone can POST a telemetry
 * body; without this, `auth` is a free text field a stranger writes into a table
 * operators read to decide whether a partner's credential is arriving. Bounding
 * it to four values makes a forged row useless rather than misleading.
 *
 * `ok` and `unavailable` are here even though neither short-circuits today --
 * `unavailable` forwards and `ok` serves -- because the Worker sends what it
 * resolved, and a vocabulary that can only express failure would force a future
 * caller to lie or to be rejected.
 */
export const AUTH_KINDS = [
  "absent",
  "invalid",
  "unavailable",
  "ok",
  // THE FIFTH LABEL, AND THE ONE THAT MADE THE TELEMETRY SILENT.
  //
  // This list was derived from the `kind` values of the Worker's AuthResolution
  // union: four. But the Worker does not send `kind` -- it sends
  // `authKindLabel(auth)`, which is `auth?.kind ?? "unresolved"`. The FIFTH
  // value exists only in that function, for the case where the tool handler was
  // given no resolution at all, and it is a case the pre-flight explicitly
  // short-circuits on.
  //
  // So a refusal with `auth === undefined` posted `auth: "unresolved"`, this
  // validator answered 400, and the event that exists to make auth refusals
  // visible was the one kind of auth refusal that stayed invisible.
  //
  // A MIRRORED PAIR ACROSS A REPOSITORY BOUNDARY, exactly as CLAUDE.md describes
  // it: each half tested against itself and both green. check-mcp-forwarding
  // exercises the Worker's side, these field rules are exercised here, and
  // NOTHING compared the two vocabularies -- the one thing that would have
  // caught it is reading them side by side, which is what finally did.
  //
  // `unresolved` is not merely tolerated. It is worth a row of its own: it means
  // the resolution never ran, which is a different fault from a missing header.
  "unresolved",
  // A REAL MEMBER OF THE UNION, and today unreachable at the refusal call site:
  // the pre-flight short-circuits on absent / invalid / undefined, so a `token`
  // resolution never reports a refusal. It is accepted anyway because the cost
  // of being wrong is asymmetric -- an unknown label is a 400 and a silent event,
  // which is precisely how `unresolved` hid, and this list is cheaper to widen
  // than to rediscover.
  "token",
] as const;
const CERT_CODE_RE = /^[A-Z0-9-]{2,20}$/;

/**
 * EMAIL REDACTION, APPLIED BEFORE ANYTHING IS STORED.
 *
 * Narrow on purpose. A fuzzy "looks like a person" filter would silently eat
 * legitimate queries and corrupt the very signal the log exists to capture.
 * This one case is not hypothetical: this repo's own instrument wrote
 * someone@example.com to disk from a tool whose entire design is that it refuses
 * email addresses, and a search box is the obvious place for someone to type
 * "find John Smith's certification".
 *
 * Migration 317 carries the same pattern as a CHECK constraint, so the redaction
 * is a property of the table and not a habit of one caller.
 */
export const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
export function redactEmails(s: string): string {
  return s.replace(EMAIL_RE, "[email redacted]");
}

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
  if (b.lesson_slug !== undefined) {
    if (typeof b.lesson_slug !== "string" || b.lesson_slug.length > MAX_SLUG || !SLUG_RE.test(b.lesson_slug)) {
      bad("lesson_slug must be lowercase kebab-case");
    }
    out.lesson_slug = b.lesson_slug;
  }
  if (b.module_slug !== undefined) {
    if (typeof b.module_slug !== "string" || b.module_slug.length > MAX_SLUG || !SLUG_RE.test(b.module_slug)) {
      bad("module_slug must be lowercase kebab-case");
    }
    out.module_slug = b.module_slug;
  }
  if (res === "rubric" && out.task_code === undefined) {
    bad("task_code is required for resource 'rubric'");
  }
  if (res === "lesson" && out.lesson_slug === undefined) {
    bad("lesson_slug is required for resource 'lesson'");
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

  if (b.tool !== undefined) {
    if (typeof b.tool !== "string" || !(TOOLS as readonly string[]).includes(b.tool)) {
      bad(`tool must be one of: ${TOOLS.join(", ")}`);
    }
    out.tool = b.tool;
  }

  if (res === "log") {
    if (typeof b.event !== "string" || !(LOG_EVENTS as readonly string[]).includes(b.event)) {
      bad(`event must be one of: ${LOG_EVENTS.join(", ")}`);
    }
    out.event = b.event;

    // REQUIRED FOR auth_refused AND REFUSED EVERYWHERE ELSE. The event exists to
    // record WHICH resolution refused the call; without the kind it is a row
    // saying only that something went wrong, which is what the Worker log
    // already said and the reason this event was added.
    if (b.event === "auth_refused") {
      if (typeof b.auth !== "string" || !(AUTH_KINDS as readonly string[]).includes(b.auth)) {
        bad(`auth must be one of: ${AUTH_KINDS.join(", ")}`);
      }
      out.auth = b.auth;
    } else if (b.auth !== undefined) {
      bad("auth is only valid for event 'auth_refused'");
    }

    if (b.certification !== undefined) {
      if (typeof b.certification !== "string" || !CERT_CODE_RE.test(b.certification)) {
        bad("certification must look like a certification code");
      }
      out.certification = b.certification;
    }
    // The log branch keeps CERT_CODE_RE and NOT the served list: a refusal is
    // interesting precisely when it names something we do not serve, so
    // validating it against what we serve would reject every row worth having.
  } else {
    if (b.event !== undefined) {
      bad("event is only valid for resource 'log'");
    }
    if (b.auth !== undefined) {
      bad("auth is only valid for resource 'log'");
    }
    // THE SERVED CERTIFICATION. Defaulted, never substituted: an unknown code is
    // refused by name rather than quietly answered with AISM-I, which would hand
    // a caller another certification's syllabus under the code they asked for.
    let cert: Certification = DEFAULT_CERTIFICATION;
    if (b.certification !== undefined) {
      if (typeof b.certification !== "string") {
        bad(`certification must be one of: ${CERTIFICATIONS.join(", ")}`);
      }
      const want = (b.certification as string).trim().toUpperCase();
      if (!(CERTIFICATIONS as readonly string[]).includes(want)) {
        // THE MESSAGE NAMES WHAT WAS ASKED FOR, and the echo is gated on shape.
        // A refusal that only lists what IS served cannot be told apart from a
        // refusal of the FIELD -- which is what this endpoint did until 325, and
        // a smoke assertion written against the old message went on passing
        // against the new behaviour for the wrong reason.
        //
        // Echoed only when it looks like a certification code. Arbitrary caller
        // input reaches mcp_requests.error, and a log is not the place to
        // discover that someone sent 400 characters of something else.
        const safe = /^[A-Z0-9-]{1,20}$/.test(want) ? want : "that value";
        bad(`certification ${safe} is not served here; must be one of: ${CERTIFICATIONS.join(", ")}`);
      }
      cert = want as Certification;
    }
    out.certification = cert;
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
    // Telemetry only; the handler returns before reaching here. Present so the
    // switch stays exhaustive and a future caller cannot fall through silently.
    case "log":
      bad("log is not a readable resource");
      break;
    // ASSEMBLED, NOT SELECTED. The rubric is code plus a task read, so the
    // handler answers before reaching here -- the shape `log` established. It
    // then asks THIS function for the `task` query rather than writing a second
    // one, so a column added to explain_task reaches the rubric for free.
    case "rubric":
      bad("rubric is assembled by the handler, not queried");
      break;
    case "certification":
      return {
        q: {
          text:
            "select code, language, name, description, description_is_fallback, " +
            "tier, status, exam_duration_minutes, " +
            "passing_score_pct, num_questions, max_exam_attempts, attempt_window_months, validity_days " +
            // LANGUAGE IS FILTERED, NOT MERELY ACCEPTED. Adding it to ALLOWED
            // without adding it here would take a language, return English,
            // and report 200 -- the "accepted and ignored" failure
            // smoke-courseware pins for `task` ("language actually routes").
            "from mcp.certification where code = $1 and language = $2",
          args: [a.certification!, a.language],
        },
      };

    case "task":
      return {
        q: {
          text:
            "select domain_code, domain_title, domain_title_is_fallback, domain_weight_pct, " +
            "task_code, language, statement, knowledge, skills, abilities, bloom_level, " +
            // ============ WITHHELD IS NOT ABSENT, AND A NULL CANNOT SAY WHICH ==========
            // Migration 338 nulls knowledge/skills/abilities where
            // `ksa_is_provisional` is true: the statement keeps serving and only
            // unreviewed KSA text is withheld. Without this column a caller sees
            // three nulls and cannot tell "never translated" from "translated and
            // held pending review" -- the exact confusion
            // `mcp.lesson_index.body_available` exists to prevent, which this repo
            // has already paid for once.
            //
            // MEASURED CONSEQUENCE, 2026-09-17: ISMS-F serves 49 Spanish and 49
            // Portuguese task rows whose KSAs went null on 338, ~15,700 characters
            // per language, and a partner's agent had been using the Spanish D2 and
            // D3 KSAs days earlier. It now gets nulls with no explanation.
            //
            // Safe to add only because 338 HAS RUN -- ahead of it this column does
            // not exist and every task query would fail.
            "ksa_withheld, " +
            // criticality: added by migration 346. It is the last field of the
            // JTA unit and the only one explain_task could not answer --
            // /our-standard renders it beside statement, KSA and Bloom level,
            // so a model that read the specimen and came here next looked for
            // it and found nothing. 509 of 509 tasks populated, no nulls.
            //
            // ORDERING: 346 MUST RUN FIRST. Ahead of it this column does not
            // exist on mcp.task and every task read fails -- the same hazard
            // 338 recorded for ksa_withheld and 343 for language.
            "criticality, " +
            "is_exam_scope, scope_tag " +
            "from mcp.task " +
            "where certification = $1 " +
            "and language = $2 " +
            "and ($3::text is null or domain_code = $3) " +
            "and ($4::text is null or task_code = $4) " +
            "order by domain_order, task_order " +
            "limit $5",
          args: [a.certification!, a.language, a.domain_code ?? null, a.task_code ?? null, a.limit],
        },
      };

    case "lesson":
      return {
        q: {
          text:
            "select module_slug, module_title, module_title_is_fallback, module_order, " +
            "lesson_slug, lesson_title, " +
            "language, lesson_group_id, lesson_order, estimated_minutes, content_md " +
            "from mcp.lesson where certification = $1 and lesson_slug = $2 and language = $3",
          args: [a.certification!, a.lesson_slug, a.language],
        },
      };

    case "lesson_index":
      return {
        q: {
          text:
            // module_title_is_fallback added by 342: module_title is now the
            // translation where one is approved, and this says when it is not.
            "select module_slug, module_title, module_title_is_fallback, module_order, " +
            "lesson_slug, lesson_title, " +
            "language, lesson_group_id, lesson_order, estimated_minutes " +
            "from mcp.lesson_index " +
            "where certification = $1 and language = $2 " +
            "and ($3::text is null or module_slug = $3) " +
            "order by module_order, lesson_order limit $4",
          args: [a.certification!, a.language, a.module_slug ?? null, a.limit],
        },
      };

    case "concept":
      return {
        q: {
          text:
            "select slug, name, description, task_codes " +
            "from mcp.concept " +
            "where certification = $1 " +
            "and ($2::text is null or slug = $2) " +
            "and ($3::text is null or $3 = any(task_codes)) " +
            "order by slug " +
            "limit $4",
          args: [a.certification!, a.slug ?? null, a.task_code ?? null, a.limit],
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
      // is one certification's tasks and concepts and stays a few hundred rows at
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
      // ===================== $4 IS THE CERTIFICATION =====================
      //
      // SEARCH WAS THE ONE RESOURCE THE WIDENING MISSED. Migration 325 put a
      // certification predicate on certification, task, concept, lesson and
      // lesson_index; this branch builds its SQL separately and was not touched,
      // so `search_blueprint` ACCEPTED the parameter, validated it, and then
      // searched all four corpora regardless.
      //
      // It surfaced as a smoke assertion that looked stale: "116 task matches
      // for AI" against a calibrated 36. Measured, the 116 is 36 + 44 + 20 + 16
      // -- one per certification, AISM-I's own figure unchanged. THE COUNT WAS
      // RIGHT FOR AN UNSCOPED SEARCH AND WRONG FOR WHAT THE TOOL PROMISES: its
      // description says "the examined blueprint of ONE Certidemy
      // certification".
      //
      // A partner would have received another certification's tasks under the
      // code they asked for -- the exact substitution readCertification refuses
      // to make at the front door.
      //
      // Pushed BEFORE the per-term params so termParams, which number themselves
      // from args.length, stay correct without being touched.
      const args: unknown[] = [phrase, a.language, a.limit, a.certification!];
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
        "from mcp.task where certification = $4 and language = $2 " +
        "and (" + anyOf("statement", ksa) + ")";
      const conceptPart =
        " union all " +
        "select 'concept', slug, name, null::text, " +
        score("name", "coalesce(description,'')") + " " +
        "from mcp.concept where certification = $4 " +
        "and (" + anyOf("name", "coalesce(description,'')") + ")";

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
