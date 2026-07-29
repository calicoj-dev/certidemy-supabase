// POST /functions/v1/score-mock-exam
//
// Body: { session_id, answers: [{ question_id, user_answer: string[] }] }
// Auth: Bearer JWT
//
// Grades a completed exam session. Behaviour depends on quiz_sessions.kind:
//
//   kind='mock_exam'  (the Exam Simulator, practice pool)
//     - Feeds concept mastery at REDUCED weight (practice trains the engine).
//     - Writes the rich mock_exam_results analytics row.
//     - Returns full breakdown + Claude study recommendations.
//
//   kind='certification_exam'  (the real, secure-pool exam)
//     - Does NOT feed mastery - the secure exam is inert to the adaptive
//       practice engine (no secure-item signal leaks into mastery).
//     - Does NOT write mock_exam_results.
//     - Writes a credential-ready exam_attempts row, company_id auto-linked to
//       the company sponsoring THIS cert, or null for B2C self-pay.
//     - ON PASS: issues the credential atomically with the attempt.
//
// ============================================================================
// THE FORM IS THE SERVER'S, NOT THE CLIENT'S (migration 163)
// ============================================================================
//
// This function used to grade whatever `answers` array the browser posted, and
// the server kept no record of which items it had served. Therefore:
//
//   SCORE INFLATION. `total` was body.answers.length and score_pct was
//   correct / total. A submission containing one known item scored 1/1 = 100%,
//   cleared the pass mark, and minted a credential whose attempt row recorded
//   total_questions = 1.
//
//   POOL SUBSTITUTION. Nothing verified the submitted question_ids belonged to
//   the secure pool, to this certification, or to this session. Practice-pool
//   ids were accepted - and the simulator openly shows correct answers.
//
//   SESSION REPLAY. Ids from an earlier session were equally acceptable.
//
// All of it was reachable by editing a network request in a browser console
// during a live exam, and the resulting credential verified as genuine on the
// public verification page.
//
// generate-mock-exam now writes exam_session_items - one row per served item,
// in presented order, with the form's language. This function grades THAT list:
//
//   - Every served item is graded. An item the candidate never answered scores
//     incorrect, because it was on their form. (An empty answer set can never
//     equal a non-empty correct set, so this falls out of the comparison.)
//   - `total` is the form size the server assembled.
//   - Submitted items that were never served are IGNORED, not graded. They
//     cannot affect the score, so they are recorded as evidence rather than
//     rejected: rejecting would turn a client bug into a lost voucher.
//   - The form's language comes from the served rows. quiz_sessions has no
//     language column, so this was previously read from the request body and
//     flowed into per-item telemetry AND the credential's locale.
//
// ONE GRADED LIST, USED EVERYWHERE. Telemetry, aggregates and the mastery feed
// all read the same `graded` array. The previous version recomputed is_correct
// independently in the mastery block, which is two implementations of the same
// rule waiting to diverge.
//
// LEGACY PATH. A session with no exam_session_items rows was issued before this
// shipped, so it falls back to the client's list and is flagged
// form_source='client_legacy'. That exists only so an exam in flight at deploy
// time still scores. Once integrity_flags shows no client_legacy rows for a
// full attempt window, DELETE IT - it is the vulnerability, kept alive
// deliberately and briefly.
//
// A FAILED READ IS NOT A FALLBACK. If exam_session_items cannot be read, this
// throws. A transient error is a retry, never a reason to trust the browser.
//
// ISO/IEC 17024 hardening (migration 062):
//   - Per-item telemetry: language, domain_code, presented_order.
//   - Late-submission flag: recorded, never rejected.
//   - JTA version stamp on attempt and credential.
//   - Mark-for-review capture (migration 064).
//
// Integrity telemetry (migration 163): exam_attempts.integrity_flags records
// form source, form size, submission length, unanswered count, items submitted
// but never served, and served items that no longer exist.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";
import { callClaudeJSON } from "../_shared/claude.ts";
import { mockExamFeedbackPrompt, Language } from "../_shared/prompts.ts";
import { updateMastery } from "../_shared/mastery.ts";

// Grace window (seconds) absorbing normal network/processing latency between
// the client hitting zero and the submission landing. Beyond this, the row is
// flagged late (recorded, never rejected).
const LATE_GRACE_SECONDS = 60;

interface Body {
  session_id: string;
  answers: Array<{
    question_id: string;
    user_answer: string[];
    time_taken_seconds?: number;
    marked_for_review?: boolean;
  }>;
  language?: Language;
}

/** One graded item: a served question joined to whatever the candidate sent. */
interface GradedItem {
  question_id: string;
  presented_order: number;
  user_answer: string[];
  time_taken_seconds: number | null;
  marked_for_review: boolean;
  is_correct: boolean;
  answered: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  q: any;
}

/** Human-friendly credential code, e.g. SMPC-7K2M-9DQ4 (no 0/O/1/I). */
function makeCredentialCode(certCode: string): string {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const block = () =>
    Array.from(
      crypto.getRandomValues(new Uint8Array(4)),
      (b) => alphabet[b % alphabet.length]
    ).join("");
  return `${certCode.toUpperCase()}-${block()}-${block()}`;
}

/** Set equality on answer options. An empty submission never matches. */
function isCorrect(correct: string[], given: string[]): boolean {
  const c = new Set(correct);
  const g = new Set(given);
  return c.size === g.size && [...c].every((x) => g.has(x));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  try {
    const user_id = await authenticate(req);
    const body = (await req.json()) as Body;
    if (!body.session_id || !Array.isArray(body.answers)) {
      throw new HttpError(400, "session_id and answers required");
    }

    const svc = getServiceClient();
    const now = new Date();

    // 1. Load session; verify ownership + that it's an exam-type session.
    const { data: session, error: sErr } = await svc
      .from("quiz_sessions")
      .select("id, user_id, certification_id, kind, voucher_id, started_at, completed_at")
      .eq("id", body.session_id)
      .single();
    if (sErr || !session) throw new HttpError(404, "session not found");
    if (session.user_id !== user_id) throw new HttpError(403, "not your session");
    if (session.kind !== "mock_exam" && session.kind !== "certification_exam") {
      throw new HttpError(400, "not an exam session");
    }
    if (session.completed_at) throw new HttpError(409, "session already completed");

    const isCertExam = session.kind === "certification_exam";

    // 2. Cert config. exam_duration_minutes drives the server-side late check.
    const { data: cert } = await svc
      .from("certifications")
      .select("code, name, passing_score_pct, exam_duration_minutes, status")
      .eq("id", session.certification_id)
      .single();
    if (!cert) throw new HttpError(404, "cert not found");
    const passing_threshold = Number(cert.passing_score_pct ?? 85);

    // ====================================================================
    // 3. THE FORM. What the server actually served for this session.
    // ====================================================================
    const { data: servedRows, error: siErr } = await svc
      .from("exam_session_items")
      .select("question_id, presented_order, language")
      .eq("session_id", body.session_id)
      .order("presented_order", { ascending: true });

    if (siErr) {
      // Not a fallback. A read error is a retry, never a reason to trust the
      // browser's list - that is precisely the defect this closes.
      console.error("exam_session_items read failed", siErr);
      throw new Error(`could not read the served form: ${siErr.message}`);
    }

    const served = servedRows ?? [];
    const form_source: "server" | "client_legacy" =
      served.length > 0 ? "server" : "client_legacy";

    if (form_source === "client_legacy") {
      console.warn(
        `session ${body.session_id} has no exam_session_items - grading the ` +
        `client's submission (legacy path). kind=${session.kind}`,
      );
    }

    // The form's language is a server fact when we have it.
    const telemetry_language: string =
      served.length > 0 ? (served[0].language ?? "en") : (body.language ?? "en");

    // What the candidate sent, addressable by question.
    const submitted = new Map(body.answers.map((a) => [a.question_id, a]));

    // The list we grade: served order when known, submission order otherwise.
    const form: Array<{ question_id: string; presented_order: number }> =
      served.length > 0
        ? served.map((s) => ({
            question_id: s.question_id,
            presented_order: s.presented_order,
          }))
        : body.answers.map((a, i) => ({ question_id: a.question_id, presented_order: i }));

    const form_ids = new Set(form.map((f) => f.question_id));

    // Submitted but never served. Cannot affect the score - we grade the form -
    // so this is recorded rather than rejected.
    const unexpected_ids = body.answers
      .map((a) => a.question_id)
      .filter((id) => !form_ids.has(id));

    // 3b. Blueprint lookup so each telemetry row can carry its domain_code.
    //     Best-effort: a missing map degrades to null, never blocks scoring.
    const domainCodeByTask = new Map<string, string | null>();
    try {
      const [{ data: taskRows }, { data: domRows }] = await Promise.all([
        svc.from("tasks").select("id, domain_id").eq("certification_id", session.certification_id),
        svc.from("domains").select("id, code").eq("certification_id", session.certification_id),
      ]);
      const codeByDomain = new Map<string, string>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (domRows ?? []).map((d: any) => [d.id, d.code]),
      );
      for (const t of taskRows ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tr = t as any;
        domainCodeByTask.set(tr.id, codeByDomain.get(tr.domain_id) ?? null);
      }
    } catch (err) {
      console.warn("domain_code map lookup failed (telemetry domain_code will be null):", err);
    }

    // 4. Load the form's questions with correct answers + concept tags.
    const { data: questions } = await svc
      .from("quiz_questions")
      .select("id, correct_answer, difficulty, task_id, question_concepts(concept_id, concepts(slug, name))")
      .in("id", [...form_ids]);
    if (!questions) throw new Error("failed to load questions");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q_by_id = new Map((questions as any[]).map((q) => [q.id, q]));

    // ====================================================================
    // 5. Grade the FORM. One canonical list, read by telemetry, aggregates
    //    and the mastery feed - so no two of them can disagree.
    // ====================================================================
    const graded: GradedItem[] = [];
    let missing_items = 0;

    for (const slot of form) {
      const q = q_by_id.get(slot.question_id);
      if (!q) {
        // A served item that no longer exists in quiz_questions. Excluded from
        // the total rather than scored against the candidate - they should not
        // be penalised for an item we removed - and flagged for investigation.
        missing_items += 1;
        continue;
      }
      const ans = submitted.get(slot.question_id);
      const user_answer = ans?.user_answer ?? [];
      graded.push({
        question_id: slot.question_id,
        presented_order: slot.presented_order,
        user_answer,
        time_taken_seconds: ans?.time_taken_seconds ?? null,
        marked_for_review: ans?.marked_for_review ?? false,
        is_correct: isCorrect(q.correct_answer as string[], user_answer),
        answered: user_answer.length > 0,
        q,
      });
    }

    const unanswered = graded.filter((g) => !g.answered).length;
    const correct_count = graded.filter((g) => g.is_correct).length;
    const total = graded.length;

    // Per-concept and per-difficulty buckets, from the same graded list.
    const per_concept = new Map<
      string,
      { name: string; slug: string; attempted: number; correct: number }
    >();
    const per_difficulty = new Map<number, { attempted: number; correct: number }>();

    for (const g of graded) {
      for (const qc of g.q.question_concepts ?? []) {
        const slug = qc.concepts?.slug ?? qc.concept_id;
        const name = qc.concepts?.name ?? slug;
        if (!per_concept.has(slug)) per_concept.set(slug, { name, slug, attempted: 0, correct: 0 });
        const bucket = per_concept.get(slug)!;
        bucket.attempted += 1;
        if (g.is_correct) bucket.correct += 1;
      }
      const d = g.q.difficulty as number;
      if (!per_difficulty.has(d)) per_difficulty.set(d, { attempted: 0, correct: 0 });
      const dbucket = per_difficulty.get(d)!;
      dbucket.attempted += 1;
      if (g.is_correct) dbucket.correct += 1;
    }

    // 6. Insert per-question attempts. Every served item gets a row, including
    //    ones left unanswered - an item consistently skipped says something
    //    about the item, and it was previously invisible.
    if (graded.length > 0) {
      const attempt_rows = graded.map((g) => ({
        session_id: body.session_id,
        user_id,
        question_id: g.question_id,
        user_answer: g.user_answer,
        is_correct: g.is_correct,
        time_taken_seconds: g.time_taken_seconds,
        attempted_at: now.toISOString(),
        language: telemetry_language,
        domain_code: g.q.task_id ? domainCodeByTask.get(g.q.task_id) ?? null : null,
        presented_order: g.presented_order,
        marked_for_review: g.marked_for_review,
      }));
      const { error } = await svc.from("quiz_attempts").insert(attempt_rows);
      if (error) throw new Error(`quiz_attempts insert: ${error.message}`);
    }

    // 6b. Mastery feed - SIMULATOR ONLY. The secure certification exam is inert
    //     to the adaptive engine (no secure-item signal leakage).
    if (!isCertExam) {
      const EXAM_MASTERY_WEIGHT = 0.5;
      try {
        const all_concept_ids = new Set<string>();
        for (const g of graded) {
          for (const qc of g.q.question_concepts ?? []) {
            if (qc.concept_id) all_concept_ids.add(qc.concept_id);
          }
        }
        const { data: existing_mastery } = await svc
          .from("user_concept_mastery")
          .select("concept_id, mastery_score, attempts, correct, last_seen_at")
          .eq("user_id", user_id)
          .in("concept_id", [...all_concept_ids]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mastery_by_concept = new Map<string, any>(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (existing_mastery ?? []).map((m: any) => [m.concept_id, m]),
        );

        // Reads the SAME graded list as scoring, so mastery cannot disagree
        // with the score. The previous version recomputed is_correct here.
        for (const g of graded) {
          const concept_tags = g.q.question_concepts ?? [];
          const per_concept_weight =
            concept_tags.length > 0 ? EXAM_MASTERY_WEIGHT / concept_tags.length : 0;
          for (const qc of concept_tags) {
            const cid = qc.concept_id;
            if (!cid) continue;
            const prev = mastery_by_concept.get(cid);
            const days_since = prev?.last_seen_at
              ? Math.max(0, (now.getTime() - new Date(prev.last_seen_at).getTime()) / 86_400_000)
              : 0;
            const updated = updateMastery({
              old_mastery: prev?.mastery_score ?? null,
              old_attempts: prev?.attempts ?? 0,
              old_correct: prev?.correct ?? 0,
              is_correct: g.is_correct,
              question_difficulty: g.q.difficulty ?? 3,
              days_since_last_seen: days_since,
              weight: per_concept_weight,
            });
            mastery_by_concept.set(cid, {
              concept_id: cid,
              mastery_score: updated.mastery,
              attempts: updated.attempts,
              correct: updated.correct,
              last_seen_at: now.toISOString(),
            });
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mastery_upserts: any[] = [];
        for (const [cid, m] of mastery_by_concept.entries()) {
          mastery_upserts.push({
            user_id,
            concept_id: cid,
            mastery_score: m.mastery_score,
            attempts: m.attempts,
            correct: m.correct,
            last_seen_at: m.last_seen_at ?? now.toISOString(),
            updated_at: now.toISOString(),
          });
        }
        if (mastery_upserts.length > 0) {
          await svc
            .from("user_concept_mastery")
            .upsert(mastery_upserts, { onConflict: "user_id,concept_id" });
        }
      } catch (err) {
        console.warn("exam mastery feed failed:", err);
      }
    }

    // 7. Aggregates. `total` is the FORM SIZE, not the submission length.
    const score_pct = total > 0 ? (correct_count / total) * 100 : 0;
    const passed = score_pct >= passing_threshold;
    const duration_seconds = Math.round(
      (now.getTime() - new Date(session.started_at).getTime()) / 1000,
    );

    // 7b. Server-side late check (record, never reject).
    const allowed_seconds = (cert.exam_duration_minutes ?? 60) * 60 + LATE_GRACE_SECONDS;
    const late_submission = duration_seconds > allowed_seconds;
    const over_by_seconds = late_submission ? duration_seconds - allowed_seconds : null;

    // 7c. What scoring observed. Evidence for the fraud review, and the signal
    //     for when the legacy path can be deleted.
    const integrity_flags: Record<string, unknown> = {
      form_source,
      form_size: total,
      submitted_count: body.answers.length,
      unanswered,
      unexpected_items: unexpected_ids.length,
      missing_items,
    };
    if (unexpected_ids.length > 0) {
      integrity_flags.unexpected_ids = unexpected_ids.slice(0, 20);
      console.warn(
        `session ${body.session_id}: ${unexpected_ids.length} submitted item(s) ` +
        `were never served. Ignored for scoring, recorded on the attempt.`,
      );
    }
    if (missing_items > 0) {
      console.warn(
        `session ${body.session_id}: ${missing_items} served item(s) no longer ` +
        `exist in quiz_questions. Excluded from the total.`,
      );
    }

    const concept_breakdown = [...per_concept.values()]
      .map((c) => ({ ...c, pct: c.attempted > 0 ? (c.correct / c.attempted) * 100 : 0 }))
      .sort((a, b) => a.pct - b.pct);
    const difficulty_breakdown = [...per_difficulty.entries()]
      .map(([difficulty, b]) => ({
        difficulty,
        ...b,
        pct: b.attempted > 0 ? (b.correct / b.attempted) * 100 : 0,
      }))
      .sort((a, b) => a.difficulty - b.difficulty);
    const weakest_concepts = concept_breakdown.slice(0, 3).map((c) => c.slug);

    // 8. Close the session.
    await svc
      .from("quiz_sessions")
      .update({ completed_at: now.toISOString(), score_pct, passed })
      .eq("id", body.session_id);

    // ====================================================================
    // 9. Branch: real certification exam vs simulator.
    // ====================================================================
    if (isCertExam) {
      // 9a. Resolve the cert's currently-published JTA version.
      let jta_version_id: string | null = null;
      try {
        const { data: ver } = await svc
          .from("jta_versions")
          .select("id")
          .eq("certification_id", session.certification_id)
          .eq("status", "published")
          .maybeSingle();
        jta_version_id = ver?.id ?? null;
      } catch (err) {
        console.warn("jta_version lookup failed (stamp will be null):", err);
      }

      // Auto-link the sponsoring company for THIS cert. Null for B2C self-pay.
      let company_id: string | null = null;
      try {
        const { data: memberships } = await svc
          .from("team_members")
          .select("company_id")
          .eq("user_id", user_id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const myCompanies = (memberships ?? []).map((m: any) => m.company_id);
        if (myCompanies.length > 0) {
          const { data: sponsor } = await svc
            .from("company_certifications")
            .select("company_id")
            .eq("certification_id", session.certification_id)
            .in("company_id", myCompanies)
            .limit(1)
            .maybeSingle();
          company_id = sponsor?.company_id ?? null;
        }
      } catch (err) {
        console.warn("company attribution lookup failed:", err);
      }

      const { data: attempt, error: aErr } = await svc
        .from("exam_attempts")
        .insert({
          user_id,
          certification_id: session.certification_id,
          session_id: body.session_id,
          company_id,
          // Voucher was consumed at exam START (generate-mock-exam). Linked
          // here for the audit trail - no second consume.
          voucher_id: session.voucher_id ?? null,
          score_pct,
          passed,
          total_questions: total,
          correct_answers: correct_count,
          duration_seconds,
          late_submission,
          over_by_seconds,
          jta_version_id,
          integrity_flags,
          submitted_at: now.toISOString(),
        })
        .select("id")
        .single();
      if (aErr) throw new Error(`exam_attempts insert: ${aErr.message}`);

      // ---- Credential issuance (on pass only) ----
      let credential_id: string | null = null;
      let credential_code: string | null = null;

      // Lifecycle guard: only mint when the cert was in a launched state.
      // 'unavailable' is allowed - a freeze blocks new starts, but an attempt
      // already in progress under 'available' completes and mints.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const certStatus = (cert as any).status;
      const mintable = certStatus === "available" || certStatus === "unavailable";

      if (passed && mintable) {
        try {
          const { data: existing } = await svc
            .from("credentials")
            .select("id, credential_code")
            .eq("user_id", user_id)
            .eq("certification_id", session.certification_id)
            .eq("status", "active")
            .maybeSingle();

          if (existing) {
            credential_id = existing.id;
            credential_code = existing.credential_code;
          } else {
            let holder_name = "Certified Professional";
            try {
              const { data: userData } = await svc.auth.admin.getUserById(user_id);
              holder_name =
                (userData?.user?.user_metadata?.full_name as string | undefined) ??
                userData?.user?.email ??
                holder_name;
            } catch (err) {
              console.warn("holder name lookup failed:", err);
            }

            // The credential's locale is the language the FORM was served in -
            // a server-side fact now, not a request-body claim.
            const credential_locale =
              telemetry_language === "es-419" || telemetry_language === "pt-BR"
                ? telemetry_language
                : "en";

            const { data: cred, error: cErr } = await svc
              .from("credentials")
              .insert({
                credential_code: makeCredentialCode(cert.code),
                user_id,
                certification_id: session.certification_id,
                exam_attempt_id: attempt.id,
                holder_name,
                certification_name: cert.name,
                certification_code: cert.code,
                score_pct,
                locale: credential_locale,
                jta_version_id,
                issued_at: now.toISOString(),
                // AI-era credentials expire 1 year after issuance - the
                // coursework tracks a fast-moving field, so recertification
                // keeps the credential honest.
                expires_at: new Date(
                  now.getFullYear() + 1, now.getMonth(), now.getDate(),
                  now.getHours(), now.getMinutes(), now.getSeconds(),
                ).toISOString(),
              })
              .select("id, credential_code")
              .single();

            if (cErr) {
              console.error("credential issuance failed:", cErr);
            } else {
              credential_id = cred.id;
              credential_code = cred.credential_code;
              if (session.voucher_id) {
                const { error: vLinkErr } = await svc
                  .from("vouchers")
                  .update({
                    credential_id: cred.id,
                    status: "redeemed",
                    redeemed_at: now.toISOString(),
                    updated_at: now.toISOString(),
                  })
                  .eq("id", session.voucher_id);
                if (vLinkErr) {
                  console.warn("could not link credential to voucher", vLinkErr);
                }
              }
            }
          }
        } catch (err) {
          console.error("credential issuance error:", err);
        }
      }

      return jsonResponse({
        kind: "certification_exam",
        score_pct,
        passed,
        passing_threshold,
        total_questions: total,
        correct_answers: correct_count,
        duration_seconds,
        credential_id,
        credential_code,
        credential_pending: passed && credential_id === null,
      });
    }

    // ---- Simulator (mock_exam): analytics + recommendations ----
    let recommendations: string[] = [];
    try {
      const language = (body.language ?? telemetry_language) as Language;
      const prompt = `Certification: ${cert.name} (${cert.code})
Mock exam score: ${score_pct.toFixed(1)}% (passing is ${passing_threshold}%) -> ${passed ? "PASSED" : "FAILED"}
Total questions: ${total}, correct: ${correct_count}
Concept performance (worst-first):
${concept_breakdown.map((c) => `  - ${c.name} (${c.slug}): ${c.pct.toFixed(0)}% (${c.correct}/${c.attempted})`).join("\n")}
Difficulty performance:
${difficulty_breakdown.map((d) => `  - level ${d.difficulty}: ${d.pct.toFixed(0)}% (${d.correct}/${d.attempted})`).join("\n")}
Produce the JSON output now.`;
      const claude_result = await callClaudeJSON<{ recommendations: string[] }>(prompt, {
        system: mockExamFeedbackPrompt(language),
        temperature: 0.3,
        max_tokens: 800,
      });
      recommendations = claude_result.recommendations.slice(0, 5);
    } catch (err) {
      console.warn("recommendations fallback:", err);
      recommendations = concept_breakdown
        .filter((c) => c.pct < 60)
        .slice(0, 3)
        .map((c) => `Review the "${c.name}" concept - you scored ${c.pct.toFixed(0)}% on it.`);
      if (recommendations.length === 0) {
        recommendations = ["Keep practicing across all modules to consolidate your knowledge."];
      }
    }

    await svc.from("mock_exam_results").insert({
      session_id: body.session_id,
      user_id,
      certification_id: session.certification_id,
      score_pct,
      passed,
      total_questions: total,
      correct_answers: correct_count,
      duration_seconds,
      concept_breakdown,
      difficulty_breakdown,
      weakest_concepts,
      recommendations,
    });

    return jsonResponse({
      kind: "mock_exam",
      score_pct,
      passed,
      passing_threshold,
      total_questions: total,
      correct_answers: correct_count,
      duration_seconds,
      concept_breakdown,
      difficulty_breakdown,
      weakest_concepts,
      recommendations,
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
