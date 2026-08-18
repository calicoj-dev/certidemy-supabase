// _shared/analyzer/reader.ts
//
// THE ONE IMPURE MODULE IN THIS FOLDER.
//
// Everything else takes data and returns data. This is the boundary that
// fetches it. engine.ts does NOT import this file and must never be changed to
// -- that separation is what lets the engine be tested in milliseconds against
// local fixtures, and what lets a future external tenant supply a different
// implementation of the same shape.
//
// ============================ THE FIREWALL ============================
//
// The analyzer reads ONLY published artifacts: domains, tasks, concepts,
// task_concepts, and lesson metadata. It must never touch the secure item bank.
//
// Structurally it already cannot -- secure items write no question_concepts, so
// there is no join path from a concept to a secure question. THAT IS NOT THE
// CONTROL. Relying on it means the firewall holds by accident of another
// table's insert behaviour, and would quietly fail the day someone adds a
// concept link to a secure item "just for coverage reporting".
//
// The control is the allowlist below. Every request passes through one function
// that refuses any table not on it. Adding a table is a deliberate, reviewable
// edit; it cannot happen by writing a new query.

import type {
  Blueprint,
  BlueprintConcept,
  BlueprintLesson,
  BlueprintDomain,
  BlueprintTask,
  Lang,
} from "./types.ts";

/**
 * The complete set of relations the analyzer may read. Anything absent is
 * refused at runtime, not at review time.
 *
 * quiz_questions, question_concepts, quiz_attempts and exam_attempts are
 * absent DELIBERATELY and must stay absent. If a future feature seems to need
 * one of them, that feature belongs on the other side of the firewall.
 */
const ALLOWED_TABLES = new Set([
  "certifications",
  "domains",
  "tasks",
  "concepts",
  "task_concepts",
  "lessons",
  "lesson_concepts",
  "modules",
]);

/** Tables that must never be reachable, named so the refusal message is useful. */
const FORBIDDEN_TABLES = new Set([
  "quiz_questions",
  "question_concepts",
  "quiz_attempts",
  "exam_attempts",
  "fsrs_cards",
  "credentials",
]);

export class FirewallViolation extends Error {
  constructor(table: string) {
    super(
      FORBIDDEN_TABLES.has(table)
        ? `FIREWALL: '${table}' is explicitly forbidden to the analyzer. ` +
            `The analyzer reads published artifacts only. If a feature appears to ` +
            `need this table, that feature belongs on the other side of the firewall.`
        : `FIREWALL: '${table}' is not on the analyzer allowlist. ` +
            `Adding a table must be a deliberate edit to ALLOWED_TABLES, not a new query.`,
    );
    this.name = "FirewallViolation";
  }
}

/**
 * THE FIREWALL CHECK, exported so it can be TESTED.
 *
 * It was private inside the reader until it became clear that made the control
 * unprovable -- and an untested control is the same category of problem as a
 * drift rule that never fires: it looks like protection and is not known to be
 * protection. Every read goes through this; a test asserts it refuses.
 */
export function assertTableAllowed(table: string): void {
  if (FORBIDDEN_TABLES.has(table) || !ALLOWED_TABLES.has(table)) {
    throw new FirewallViolation(table);
  }
}

export interface ReaderConfig {
  /** e.g. https://<ref>.supabase.co/rest/v1 */
  restUrl: string;
  /** service_role key. The analyzer tables are RLS-closed with no grants. */
  apiKey: string;
  /** Injected for testability; defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

export class BlueprintReader {
  /** PostgREST default page size. See the note in #select. */
  static readonly PAGE = 1000;

  #restUrl: string;
  #apiKey: string;
  #fetch: typeof fetch;
  /** Every table touched, in order. Attach to a run record for audit. */
  readonly accessLog: string[] = [];

  constructor(config: ReaderConfig) {
    this.#restUrl = config.restUrl.replace(/\/+$/, "");
    this.#apiKey = config.apiKey;
    this.#fetch = config.fetchImpl ?? fetch;
  }

  /**
   * THE SINGLE CHOKEPOINT. Every read goes through here, so the allowlist
   * cannot be bypassed by writing a query somewhere else in the file.
   */
  async #select<T>(table: string, query: string): Promise<T[]> {
    assertTableAllowed(table);
    this.accessLog.push(table);

    // PAGINATED. PostgREST caps a response at 1000 rows by default and says
    // nothing about it.
    //
    // This bit hard once already: verify-invariants.mjs fetched 1000 of 1599
    // concepts and reported the other 599 as having no lesson and no task --
    // 606 false failures on healthy data, from the tool whose entire job is to
    // be believed when it reports a problem.
    //
    // Here the consequence would be worse and quieter. A truncated blueprint
    // produces a readiness report that under-counts a partner's coverage, and
    // nothing in the output would look wrong. No certification is near 1000
    // concepts today (AISM-I is largest at 226); this is for the day one is.
    const rows: T[] = [];
    for (let from = 0; ; from += BlueprintReader.PAGE) {
      const res = await this.#fetch(`${this.#restUrl}/${table}?${query}`, {
        headers: {
          apikey: this.#apiKey,
          Authorization: `Bearer ${this.#apiKey}`,
          Accept: "application/json",
          Range: `${from}-${from + BlueprintReader.PAGE - 1}`,
          "Range-Unit": "items",
        },
      });
      if (!res.ok && res.status !== 206) {
        throw new Error(`${res.status} ${res.statusText} reading ${table}: ${await res.text()}`);
      }
      const page = (await res.json()) as T[];
      rows.push(...page);
      if (page.length < BlueprintReader.PAGE) return rows;
      // A server ignoring Range would otherwise return page one forever.
      if (from > 200000) throw new Error(`pagination runaway reading ${table}`);
    }
  }

  /**
   * Every certification, for the multi-certification scan.
   *
   * A partner feeds ONE syllabus and is scored against ALL of them -- "your
   * course is 71% ready for SM-AI-I, 22% for SPO-AI-I" -- which is the question
   * a training provider actually has and has never been able to ask anyone.
   * Nearly free: drift, weighting and the gates are computed once on the text;
   * only concept matching is per-certification.
   */
  async listCertifications(): Promise<Array<{ id: string; code: string; name: string; status: string }>> {
    return this.#select<{ id: string; code: string; name: string; status: string }>(
      "certifications",
      "select=id,code,name,status&order=code",
    );
  }

  async loadByCode(code: string, lang: Lang, withLessons = false): Promise<Blueprint> {
    const certs = await this.#select<{ id: string; code: string; name: string }>(
      "certifications",
      `select=id,code,name&code=eq.${encodeURIComponent(code)}`,
    );
    if (certs.length === 0) throw new Error(`no certification with code ${code}`);
    return this.load(certs[0].id, certs[0].code, certs[0].name, lang, withLessons);
  }

  async load(
    certificationId: string,
    code: string,
    title: string,
    lang: Lang,
    withLessons = false,
  ): Promise<Blueprint> {
    const scope = `certification_id=eq.${certificationId}`;

    const [domainRows, taskRows, conceptRows] = await Promise.all([
      this.#select<{ id: string; code: string; title: string; weight_pct: number }>(
        "domains",
        `select=id,code,title,weight_pct&${scope}&order=order_index`,
      ),
      this.#select<{
        id: string;
        domain_id: string;
        code: string;
        statement: string;
        bloom_level: string;
        is_exam_scope: boolean;
        scope_tag: string;
      }>(
        "tasks",
        `select=id,domain_id,code,statement,bloom_level,is_exam_scope,scope_tag&${scope}&order=order_index`,
      ),
      this.#select<{ id: string; slug: string; name: string; match_terms: string[] | null }>(
        "concepts",
        `select=id,slug,name,match_terms&${scope}&order=slug`,
      ),
    ]);

    // task_concepts has no certification_id of its own -- it is scoped through
    // tasks. Filtering by the task ids we already hold keeps the query scoped
    // without a join the REST layer would have to be taught about.
    const taskIds = taskRows.map((t) => t.id);
    const links = taskIds.length
      ? await this.#select<{ task_id: string; concept_id: string }>(
          "task_concepts",
          `select=task_id,concept_id&task_id=in.(${taskIds.join(",")})`,
        )
      : [];

    const conceptTasks = new Map<string, string[]>();
    for (const l of links) {
      const arr = conceptTasks.get(l.concept_id) ?? [];
      arr.push(l.task_id);
      conceptTasks.set(l.concept_id, arr);
    }

    const domains: BlueprintDomain[] = domainRows.map((d) => ({
      id: d.id,
      code: d.code,
      title: d.title,
      weightPct: Number(d.weight_pct),
    }));

    const tasks: BlueprintTask[] = taskRows.map((t) => ({
      id: t.id,
      domainId: t.domain_id,
      code: t.code,
      statement: t.statement,
      bloomLevel: t.bloom_level,
      isExamScope: t.is_exam_scope,
    }));

    // A concept is in CORE scope when at least one task reaching it is core.
    // Reachable only from extended tasks means no course in the base discipline
    // can match it -- that is a structural difference and the differentiator,
    // not a gap in the source.
    const coreTaskIds = new Set(taskRows.filter((t) => t.scope_tag === "core").map((t) => t.id));

    const concepts: BlueprintConcept[] = conceptRows.map((c) => {
      const ids = conceptTasks.get(c.id) ?? [];
      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        matchTerms: c.match_terms ?? [],
        taskIds: ids,
        inCoreScope: ids.some((id) => coreTaskIds.has(id)),
      };
    });

    // Weights that do not sum to 100 mean the blueprint itself is broken, and
    // every divergence computed against it would be quietly wrong. Better to
    // refuse than to report confidently against a bad reference.
    // Lessons scope through modules, not through certification_id. Rather than
    // teach the query layer that join, fetch them by id via lesson_concepts --
    // the same trick used for task_concepts. Language-filtered, because a
    // lesson exists once per language and an en blueprint must not link a
    // pt-BR lesson.
    let lessons: BlueprintLesson[] | undefined;
    if (withLessons && concepts.length > 0) {
      const links = await this.#select<{ lesson_id: string; concept_id: string }>(
        "lesson_concepts",
        `select=lesson_id,concept_id&concept_id=in.(${concepts.map((c) => c.id).join(",")})`,
      );
      const lessonIds = [...new Set(links.map((l) => l.lesson_id))];
      const rows = lessonIds.length
        ? await this.#select<{ id: string; slug: string; title: string; language: string }>(
            "lessons",
            `select=id,slug,title,language&id=in.(${lessonIds.join(",")})&language=eq.${encodeURIComponent(lang)}`,
          )
        : [];
      const byLesson = new Map<string, string[]>();
      for (const l of links) {
        const arr = byLesson.get(l.lesson_id) ?? [];
        arr.push(l.concept_id);
        byLesson.set(l.lesson_id, arr);
      }
      lessons = rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        conceptIds: byLesson.get(r.id) ?? [],
      }));
    }

    const weightSum = domains.reduce((s, d) => s + d.weightPct, 0);
    if (domains.length > 0 && Math.abs(weightSum - 100) > 0.01) {
      throw new Error(
        `blueprint ${code} domain weights sum to ${weightSum}, not 100. ` +
          `Every weight divergence computed against this would be wrong.`,
      );
    }

    return {
      referenceKind: "certidemy_certification",
      referenceId: certificationId,
      lang,
      code,
      title,
      domains,
      tasks,
      concepts,
      lessons,
    };
  }
}
