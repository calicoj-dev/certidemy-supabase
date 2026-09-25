# Web session: edits in `certidemy-web`

Items 1 to 3 are needed before Friday. They are independent of each other and of
anything still running in the supabase repo. Items 4 and 5 are carried, not
urgent, and both are recorded here because a supabase session cannot make them.

---

## Carried, added 2026-09-25 — not before Friday

**4. `get_lesson` should publish `concept_slugs` from `lesson_concepts`, not from
the served body.**

Measured: `concept_slugs` in a lesson body's frontmatter agrees with
`lesson_concepts` on **all 1,387 rows that have frontmatter**, so there is no
divergence to reconcile. The problem is **absence** — 50 rows carry no frontmatter
at all, and on **7 SM-AI-I lessons the English has it and both translations do
not**: `01-01-agile-manifesto`, `01-02-empirical-process-control`,
`02-05-self-management-and-boundaries`, `03-03-the-daily-scrum`,
`03-05-the-sprint-retrospective`, `04-04-increment-and-definition-of-done`,
`05-05-terminology-drift`.

So **`get_lesson` returns no `concept_slugs` for es-419 or pt-BR on those seven
lessons**, and reading that as "this lesson covers no concepts" would be wrong.
Publishing from `lesson_concepts` — the relational truth the coverage invariant,
the blueprint and the readiness roll-up all already read — fixes every case at
once and removes a second copy of the fact rather than adding a third.

**Do not fix it by writing frontmatter into the translated bodies.** A
translated-side edit moves `tr_hash`, so migration 364 would correctly withhold
all 14 rows until a human re-reviewed them: fourteen rows dark and fourteen
reviews spent on a metadata field no reader sees.

Evidence in the supabase repo: `FRONTMATTER-CONCEPTS.json`,
`scripts/measure-frontmatter-concepts.mjs`, and the entry in `OPEN-ITEMS.md`.

**5. `lib/engine/sessions.ts` carries a stale comment.** It says the question bank
is *"currently English-only"*. There are **18,485 translated items live to
learners** (9,245 es-419, 9,240 pt-BR), and `fetchConceptPractice` already filters
on `language`. The code is right and the comment is wrong, which is the kind that
gets believed.

---

## 1. `lib/mcp/courseware-contract.ts` — offer the two new certifications

The connector will not OFFER ISMS-F or AIMS-F until this moves. The function
already accepts them (migration 334 + a deploy on 2026-09-17).

`scripts/check-cross-repo-vocabulary.mjs` reports this as *"web contract emits
8, courseware-query accepts 10"* and **passes** — a validator may know more than
any current sender, so it is safe, and therefore silent. It is a to-do, not a
green light.

Find `export const SUPPORTED_CERTIFICATIONS` (line 78) and add two entries after
`"SD-AI-I",`:

```ts
  "SD-AI-I",
  // Joined 2026-09-17 with migration 334, once both blueprints measured clean
  // of reproduced ISO clause text. AIMS-F's LESSON BODIES are still mostly
  // withheld by lessons.mcp_servable -- being offered is not being complete,
  // and the two are gated in different places on purpose.
  "ISMS-F",
  "AIMS-F",
```

---

## 2. `lib/mcp/registry.ts` — carry the function's `reason`

Around line 281, inside `callCourseware`'s `if (!res.ok)` block. The function now
returns a `reason` alongside `error` on a withheld lesson; nothing reads it yet.

REPLACE:

```ts
    let detail: string | null = null;
    try {
      const j = (await res.json()) as { error?: unknown };
      if (typeof j?.error === "string") detail = j.error.slice(0, 200);
    } catch {
      detail = null;
    }
    throw new CoursewareHttpError(res.status, detail);
```

WITH:

```ts
    let detail: string | null = null;
    let reason: string | null = null;
    try {
      const j = (await res.json()) as { error?: unknown; reason?: unknown };
      // 400 was the only case this was written for, and its message names the
      // field the function refused. A WITHHELD LESSON BODY needs the whole
      // message, not a truncated one: it explains a content state to a partner
      // and ends by telling them not to go and check their credential.
      if (typeof j?.error === "string") detail = j.error.slice(0, 600);
      if (typeof j?.reason === "string") reason = j.reason.slice(0, 60);
    } catch {
      detail = null;
    }
    throw new CoursewareHttpError(res.status, detail, reason);
```

Then the class itself, around line 229. REPLACE:

```ts
  status: number;
  detail: string | null;
  constructor(status: number, detail: string | null) {
    super(`courseware-read ${status}`);
    this.name = "CoursewareHttpError";
    this.status = status;
    this.detail = detail;
  }
```

WITH:

```ts
  status: number;
  detail: string | null;
  // `reason` is a stable machine token -- not_found,
  // body_withheld_standard_text, translation_pending_review -- where `detail`
  // is prose for a human. The token is what a log can be grouped by; the prose
  // is what an agent reads.
  reason: string | null;
  constructor(status: number, detail: string | null, reason: string | null = null) {
    super(`courseware-read ${status}`);
    this.name = "CoursewareHttpError";
    this.status = status;
    this.detail = detail;
    this.reason = reason;
  }
```

---

## 3. `lib/mcp/registry.ts` — stop calling a withheld body a server fault

Around line 813, in the `catch` that builds `text`. This is the one that matters.

The current final branch reads:

```ts
          : `The curriculum service rejected this request: ${http.detail ?? `HTTP ${http.status}`}. ` +
            "This is a fault in the server, not in the question -- the request was well formed as a tool call.";
```

A withheld lesson body is **neither**. The request was well formed, the
credential was fine, the server is healthy, and the lesson exists — its body is
just not redistributable, or its translation has not been read yet. Telling an
agent this is a server fault sends its operator to check a deploy.

REPLACE that branch WITH:

```ts
          : http.reason !== null
            // ============ A CONTENT STATE, NOT A FAULT ============
            //
            // courseware-read returns a `reason` only for a lesson body it is
            // deliberately withholding: the body reproduces ISO clause text, or
            // its English was repaired and the translation has not been read
            // yet, or the slug does not exist. Its message is already written
            // for a partner -- it names the lesson, says what is and is not
            // available, and says explicitly that the credential is fine.
            //
            // So it is passed through verbatim. Wrapping it in "rejected this
            // request" or "a fault in the server" would contradict the sentence
            // inside it, which is how the previous wording sent people to check
            // credentials and deploys that were never the problem.
            ? http.detail ?? `The lesson body is not available (${http.reason}).`
          : `The curriculum service rejected this request: ${http.detail ?? `HTTP ${http.status}`}. ` +
            "This is a fault in the server, not in the question -- the request was well formed as a tool call.";
```

And in the `outcome` ternary just above it, so these stop being counted as
rejections:

```ts
      const outcome =
        http === null ? "upstream-unreachable"
        : http.reason !== null ? "lesson-withheld"
        : http.status === 401 || http.status === 403 ? "upstream-unauthorized"
        : http.status >= 500 ? "upstream-error"
        : "upstream-rejected";
```

And add the token to the log object below it:

```ts
          upstreamStatus: http?.status ?? null,
          upstreamDetail: http?.detail ?? null,
          withheldReason: http?.reason ?? null,
```

---

## Why the function returns 404 and not 403

Worth knowing before anyone "tidies" it.

`registry.ts` **discards `http.detail` on 401 and 403** and substitutes a fixed
message ending *"If a key was sent, it may have just been revoked."* A partner
whose Spanish translation is pending review would be sent to rotate a credential
that is perfectly fine — the same misattribution this file already records twice,
arriving through a third door.

404 is the closest honest status that keeps the detail: the BODY is not
available at this address. If the 401/403 branch is ever changed to pass detail
through, the function's status can be revisited — but not before.

---

## To verify after pasting

Against the live function, with a `courseware:lessons` credential:

| request | expect |
|---|---|
| `ISMS-F` / `en` / `02-09-pdca-and-improvement` | a body, 8 blocks |
| `ISMS-F` / `es-419` / same slug | the pending-review sentence, verbatim, no "fault in the server" |
| `AIMS-F` / `en` / `02-06-the-ai-system-impact-assessment` | the reproduces-clause-text sentence |
| `AIMS-F` / `es-419` / `99-99-no-such-lesson` | the not-found sentence pointing at `list_lessons` |

Then `node scripts/check-cross-repo-vocabulary.mjs` in the supabase repo should
read `web contract emits 10, courseware-query accepts 10`.
