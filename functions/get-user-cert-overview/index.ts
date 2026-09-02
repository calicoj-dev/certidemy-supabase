// POST /functions/v1/get-user-cert-overview
//
// Body: { user_id, certification_id }
// Auth: Bearer JWT - MUST be a platform_admin.
//
// One learner's progress in one certification, AGGREGATE ONLY. Backs the
// console People drill-down: click a cert on a user's row, see how far they
// are.
//
// ============================ WHY A SERVICE CLIENT =========================
//
// Measured 2026-09-02: of the seven tables this reads, ONLY `credentials` has
// a platform_admin policy.
//
//   credentials            owner | platform admin reads all | admin updates
//   user_lesson_progress   own | team_admin
//   user_concept_mastery   own | team_admin
//   quiz_sessions          own | team_admin
//   quiz_attempts          own | team_admin
//   exam_attempts          own ONLY
//   user_certifications    own ONLY
//
// A platform_admin querying with their own JWT gets ZERO ROWS on six of seven
// -- not an error, an empty result. The page would render "no progress" for a
// learner who has plenty. So: authenticate and gate the caller, THEN use the
// service client, exactly as get-company-detail does for cross-tenant reads.
//
// The gate is the only thing between a learner JWT and every other learner's
// progress. Do not add a path that reaches the reads without it.
//
// ============================ WHAT NEVER LEAVES ============================
//
// NO score_pct, in any form or under any name. Not exam_attempts.score_pct,
// not quiz_sessions.score_pct, not mock_exam_results. Not correct_answers or
// total_questions either -- those ARE a score, one division apart, and a
// column list that omits `score_pct` while selecting both would be a fig leaf.
//
// NO individual items. No question ids, no per-item right/wrong, no
// quiz_attempts ROW. Practice accuracy is computed by two HEAD counts, so the
// aggregate is derived without a single attempt row crossing the wire.
//
// This mirrors get-company-detail's rule -- "score_pct is never selected,
// never returned" -- and the reason is the same: the score is invisible
// everywhere outside scoring.
//
// ============================ THE MASTERY NUMBER ===========================
//
// weightedMastery is read from `v_user_exam_readiness`, NOT recomputed here.
//
// That view (migrations 119 -> 120 -> 121) already implements the roll-up:
// sum(weight_pct * avg_mastery) over domains WITH a measurement, divided by
// sum(weight_pct) over the same set -- renormalised across scored domains, so
// an unassessed domain neither counts as zero nor dilutes the result.
//
// certidemy-web's lib/dashboard/data.ts loadDomainMastery computes the same
// thing in TypeScript for the learner's own view. PORTING IT TO DENO WOULD
// HAVE BEEN A THIRD COPY OF ONE RULE IN A THIRD LANGUAGE. _shared/census.ts
// exists because that duplication went wrong once already: sync-to-ghl reached
// list-users over HTTP and could never authenticate. One derivation, one
// source. Here the source is the view.
//
// *** A PRE-EXISTING DIVERGENCE, RECORDED AND DELIBERATELY NOT WIDENED ***
//
// The two existing definitions do not agree:
//
//   loadDomainMastery (TS)      counts ALL tasks
//   v_user_exam_readiness (SQL) counts is_exam_scope tasks only,
//                               and skips domains with weight_pct = 0
//
// Measured across every user with mastery rows on 2026-09-02: ONE user in ten
// differs, by 0.0001.
//
//   4406bb9f / 1111...   TS 0.4996   SQL 0.4997
//
// They agree today only because nearly every task is currently exam-scope.
// THAT IS A PROPERTY OF THE DATA, NOT OF THE CODE. The first certification
// with a real body of non-exam-scope tasks will make the learner's dashboard
// and this screen disagree, and nothing will flag it.
//
// This function does not fix that and does not widen it -- it uses the SQL
// definition, which is the one already in the database. Reconciling the two is
// its own task, because changing loadDomainMastery changes what learners see.
//
// ============================ THE ROLL-UP IS RAW 0-1 =======================
//
// The view exposes its roll-up as `predicted_score_pct` (0-100, 1dp). This
// function returns the RAW 0-1 value as `weightedMastery` and does NOT
// re-export the percentage under a new name. Renaming a number to get it past
// a rule while shipping the same value is worse than either shipping it openly
// or leaving it out.
//
// It is not an exam score -- it is mastery x weight -- but it is close enough
// to one that the naming matters.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";

interface Body {
  user_id: string;
  certification_id: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ===================== THE CANONICAL LIST OF HARDCODED ORIGINS =============
//
// The public origin is written in FIVE places. This comment is the list, and
// it is self-contained on purpose: it points at no other file, so it cannot
// rot when one of them moves or is written later.
//
//   1. THIS LINE
//   2. certidemy-web  lib/verify/tool-contract.ts          (WebMCP tool output)
//   3. certidemy-web  components/dashboard/command-deck.tsx (learner dashboard)
//   4. supabase       functions/_shared/certificate.ts      (the PDF QR code)
//   5. supabase       migrations/276 -- NOT YET WRITTEN. The credential-
//      issuance trigger will hardcode it too, because a trigger has no
//      environment. When 276 is written it points BACK here rather than
//      copying this list; two lists drift, one does not.
//
// If the domain ever moves: grep 'certidemy.com' and change all of them.
//
// Console tables use a bare /verify/<id> path and inherit the origin from the
// browser, so they are not in this list and need no change.
//
// This is a MUCH weaker constraint than the one in _shared/email-templates.ts,
// where renderIssuance REJECTS any verify_url not starting with
// https://certidemy.com/ and dispatch-emails treats that throw as terminal --
// there, a wrong origin is a silently abandoned email. Here it is a broken
// link in a console, which a human sees immediately.
const SITE_ORIGIN = "https://certidemy.com";

/** Rows a caller must never see; kept as an explicit allow-list per table. */
const SEL_CERT =
  "id, code, name, passing_score_pct, max_exam_attempts, attempt_window_months";
const SEL_ENROLLMENT = "source, status, enrolled_at";
// submitted_at and passed ONLY. score_pct, correct_answers and total_questions
// are all excluded deliberately -- see the header.
const SEL_EXAM = "submitted_at, passed";
const SEL_CREDENTIAL =
  "credential_code, issued_at, expires_at, status, locale";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  try {
    const actor_user_id = await authenticate(req);
    const svc = getServiceClient();

    // ---- gate: platform_admin, before any read of anybody's progress -------
    const { data: actor } = await svc
      .from("profiles")
      .select("platform_role")
      .eq("id", actor_user_id)
      .maybeSingle();

    if ((actor as { platform_role?: string } | null)?.platform_role !== "platform_admin") {
      throw new HttpError(403, "platform_admin required");
    }

    const body = (await req.json().catch(() => ({}))) as Partial<Body>;
    const userId = String(body.user_id ?? "");
    const certId = String(body.certification_id ?? "");
    if (!UUID_RE.test(userId)) throw new HttpError(400, "user_id must be a uuid");
    if (!UUID_RE.test(certId)) throw new HttpError(400, "certification_id must be a uuid");

    // ---- bulk reads. Fixed count, independent of lesson/concept/attempt volume.
    const [
      profileRes,
      certRes,
      enrollRes,
      lessonRes,
      readinessRes,
      domainRes,
      taskRes,
      masteryRes,
      sessionRes,
      examRes,
      credRes,
    ] = await Promise.all([
      svc.from("profiles").select("id, full_name, email").eq("id", userId).maybeSingle(),
      svc.from("certifications").select(SEL_CERT).eq("id", certId).maybeSingle(),
      svc.from("user_certifications").select(SEL_ENROLLMENT).eq("user_id", userId).eq("certification_id", certId).maybeSingle(),
      svc.from("modules").select("id").eq("certification_id", certId),
      svc.from("v_user_exam_readiness").select("coverage, predicted_score_pct, is_reportable, weakest_domain_code, concepts_total, concepts_seen").eq("user_id", userId).eq("certification_id", certId).maybeSingle(),
      svc.from("domains").select("id, code, title, weight_pct, order_index").eq("certification_id", certId).order("order_index", { ascending: true }),
      svc.from("tasks").select("id, domain_id").eq("certification_id", certId).eq("is_exam_scope", true),
      svc.from("user_concept_mastery").select("concept_id, mastery_score").eq("user_id", userId),
      svc.from("quiz_sessions").select("id, started_at, completed_at").eq("user_id", userId).eq("certification_id", certId),
      svc.from("exam_attempts").select(SEL_EXAM).eq("user_id", userId).eq("certification_id", certId).order("submitted_at", { ascending: false }),
      svc.from("credentials").select(SEL_CREDENTIAL).eq("user_id", userId).eq("certification_id", certId).order("issued_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const cert = certRes.data as
      | { id: string; code: string; name: string; passing_score_pct: number | null; max_exam_attempts: number | null; attempt_window_months: number | null }
      | null;
    if (!cert) throw new HttpError(404, "certification not found");

    const profile = profileRes.data as { id: string; full_name: string | null; email: string | null } | null;

    // ---- lessons. Counted by lesson_group_id, NOT by row: a lesson exists
    // once per language (48 rows / 16 groups on AIE-I), and counting rows
    // would report a 16-lesson course as 48 and a bilingual learner as having
    // completed the same lesson twice.
    const moduleIds = ((lessonRes.data ?? []) as { id: string }[]).map((m) => m.id);
    let lessonsTotal = 0;
    let lessonsCompleted = 0;
    let lessonsLastAt: string | null = null;

    if (moduleIds.length > 0) {
      const { data: lessonRows } = await svc
        .from("lessons")
        .select("id, lesson_group_id")
        .in("module_id", moduleIds);
      const rows = (lessonRows ?? []) as { id: string; lesson_group_id: string | null }[];
      const groupByLesson = new Map(rows.map((l) => [l.id, l.lesson_group_id ?? l.id]));
      lessonsTotal = new Set(rows.map((l) => l.lesson_group_id ?? l.id)).size;

      if (rows.length > 0) {
        const { data: progRows } = await svc
          .from("user_lesson_progress")
          .select("lesson_id, status, completed_at, updated_at")
          .eq("user_id", userId)
          .in("lesson_id", rows.map((l) => l.id));
        const done = new Set<string>();
        for (const p of (progRows ?? []) as { lesson_id: string; status: string | null; completed_at: string | null; updated_at: string | null }[]) {
          const stamp = p.completed_at ?? p.updated_at;
          if (stamp && (!lessonsLastAt || stamp > lessonsLastAt)) lessonsLastAt = stamp;
          if (p.status === "completed" || p.completed_at) {
            const g = groupByLesson.get(p.lesson_id);
            if (g) done.add(g);
          }
        }
        lessonsCompleted = done.size;
      }
    }

    // ---- practice. TWO HEAD COUNTS, ZERO ROWS. `count: exact, head: true`
    // returns a number and no body, so accuracy is derived without a single
    // quiz_attempts row -- no question id, no per-item outcome -- crossing the
    // wire. quiz_sessions carries score_pct and passed; neither is selected.
    const sessions = (sessionRes.data ?? []) as { id: string; started_at: string | null; completed_at: string | null }[];
    const sessionIds = sessions.map((s) => s.id);

    let answered = 0;
    let correct = 0;
    if (sessionIds.length > 0) {
      const [{ count: aCount }, { count: cCount }] = await Promise.all([
        svc.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("user_id", userId).in("session_id", sessionIds),
        svc.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("user_id", userId).in("session_id", sessionIds).eq("is_correct", true),
      ]);
      answered = aCount ?? 0;
      correct = cCount ?? 0;
    }

    let practiceLastAt: string | null = null;
    for (const s of sessions) {
      const stamp = s.completed_at ?? s.started_at;
      if (stamp && (!practiceLastAt || stamp > practiceLastAt)) practiceLastAt = stamp;
    }

    // ---- mastery per domain, from the same scope the view uses: exam-scope
    // tasks only. The roll-up itself comes from the view and is not recomputed.
    const domainRows = (domainRes.data ?? []) as { id: string; code: string; title: string; weight_pct: number; order_index: number }[];
    const taskRows = (taskRes.data ?? []) as { id: string; domain_id: string }[];
    const domainByTask = new Map(taskRows.map((t) => [t.id, t.domain_id]));

    let tcRows: { task_id: string; concept_id: string }[] = [];
    if (taskRows.length > 0) {
      const { data } = await svc
        .from("task_concepts")
        .select("task_id, concept_id")
        .in("task_id", taskRows.map((t) => t.id));
      tcRows = (data ?? []) as { task_id: string; concept_id: string }[];
    }

    const conceptsByDomain = new Map<string, Set<string>>();
    for (const tc of tcRows) {
      const d = domainByTask.get(tc.task_id);
      if (!d) continue;
      let set = conceptsByDomain.get(d);
      if (!set) { set = new Set<string>(); conceptsByDomain.set(d, set); }
      set.add(tc.concept_id);
    }

    // Fetched user-wide and matched by membership, so cross-cert rows never
    // land in a domain -- the same reasoning loadDomainMastery documents.
    const scoreByConcept = new Map<string, number>(
      ((masteryRes.data ?? []) as { concept_id: string; mastery_score: number }[])
        .map((m) => [m.concept_id, Number(m.mastery_score)]),
    );

    const domains = domainRows.map((d) => {
      const ids = conceptsByDomain.get(d.id) ?? new Set<string>();
      const scores: number[] = [];
      for (const cid of ids) {
        const s = scoreByConcept.get(cid);
        if (typeof s === "number") scores.push(s);
      }
      return {
        code: d.code,
        title: d.title,
        weightPct: Number(d.weight_pct),
        // Average over ASSESSED concepts only. An unassessed concept is absent
        // evidence, not evidence of zero.
        masteryScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
        assessedCount: scores.length,
        conceptCount: ids.size,
      };
    });

    const readiness = readinessRes.data as
      | { coverage: number | null; predicted_score_pct: number | null; is_reportable: boolean | null; weakest_domain_code: string | null; concepts_total: number | null; concepts_seen: number | null }
      | null;

    // RAW 0-1. The view stores this as predicted_score_pct (0-100); it is
    // divided back rather than re-exported under a new name. See the header.
    const weightedMastery =
      readiness?.predicted_score_pct == null ? null : Number(readiness.predicted_score_pct) / 100;

    // ---- exam. attemptsRemaining is a LIVE calculation, not a subtraction:
    // attempt_window_months means old attempts fall out of the count.
    const examRows = (examRes.data ?? []) as { submitted_at: string | null; passed: boolean | null }[];
    const windowMonths = cert.attempt_window_months ?? 12;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - windowMonths);
    const inWindow = examRows.filter((a) => a.submitted_at && new Date(a.submitted_at) >= cutoff);
    const maxAttempts = cert.max_exam_attempts ?? 6;

    const credential = credRes.data as
      | { credential_code: string; issued_at: string | null; expires_at: string | null; status: string; locale: string | null }
      | null;

    return jsonResponse({
      user: {
        id: userId,
        fullName: profile?.full_name ?? null,
        email: profile?.email ?? null,
      },
      certification: {
        id: cert.id,
        code: cert.code,
        name: cert.name,
        passingScorePct: Number(cert.passing_score_pct ?? 80),
      },
      enrollment: enrollRes.data
        ? {
            enrolledAt: (enrollRes.data as { enrolled_at: string | null }).enrolled_at,
            source: (enrollRes.data as { source: string | null }).source,
            status: (enrollRes.data as { status: string | null }).status,
          }
        : null,
      lessons: {
        completed: lessonsCompleted,
        total: lessonsTotal,
        lastActivityAt: lessonsLastAt,
      },
      practice: {
        sessions: sessions.length,
        questionsAnswered: answered,
        accuracyPct: answered > 0 ? Math.round((correct / answered) * 1000) / 10 : null,
        lastActivityAt: practiceLastAt,
      },
      mastery: {
        domains,
        weightedMastery,
        coverage: readiness?.coverage == null ? null : Number(readiness.coverage),
        isReportable: readiness?.is_reportable ?? false,
        weakestDomainCode: readiness?.weakest_domain_code ?? null,
        conceptsTotal: readiness?.concepts_total ?? null,
        conceptsSeen: readiness?.concepts_seen ?? null,
      },
      exam: {
        attempts: examRows.map((a) => ({ attemptedAt: a.submitted_at, passed: a.passed === true })),
        attemptsUsed: inWindow.length,
        attemptsRemaining: Math.max(0, maxAttempts - inWindow.length),
        windowMonths,
      },
      credential: credential
        ? {
            credentialCode: credential.credential_code,
            issuedAt: credential.issued_at,
            expiresAt: credential.expires_at,
            status: credential.status,
            verifyUrl:
              SITE_ORIGIN + "/" + (credential.locale?.trim() || "en") +
              "/verify/" + credential.credential_code,
          }
        : null,
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
