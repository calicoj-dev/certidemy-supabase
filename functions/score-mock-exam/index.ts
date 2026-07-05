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
//     - Does NOT feed mastery — the secure exam is inert to the adaptive
//       practice engine (no secure-item signal leaks into mastery).
//     - Does NOT write mock_exam_results.
//     - Writes a credential-ready exam_attempts row, with company_id
//       auto-linked to the company sponsoring THIS cert (via
//       company_certifications), or null for B2C self-pay.
//     - ON PASS: issues the credential (credentials row) atomically with the
//       attempt — snapshotting holder name and certification name so later
//       renames never rewrite issued history. One active credential per
//       user+cert; a re-pass returns the existing one. The credential also
//       records the exam language as `locale` so the certificate PDF renders
//       in the language the exam was taken in. The response carries
//       credential_id + credential_code so the results screen can link to
//       the public verify page immediately.
//
// Both close the quiz session with score + pass.
//
// ISO/IEC 17024 hardening (migration 062):
//   - Per-item telemetry: each quiz_attempts row now records language,
//     domain_code (D1..D5, resolved question -> task -> domain), and
//     presented_order (position in the assembled form). Item-analysis +
//     standard-setting substrate.
//   - Late-submission flag: the server compares elapsed time to the cert's
//     duration + a grace window and RECORDS lateness on the exam_attempts row
//     (late_submission / over_by_seconds). It does NOT reject — the client
//     auto-submits at zero, so lateness is only ever latency or tampering.
//   - JTA version stamp: the cert's currently-published jta_versions.id is
//     stamped onto exam_attempts and the credential, so /verify renders the
//     exact blueprint the candidate was assessed against.
//   - Mark-for-review capture: each quiz_attempts row records whether the
//     candidate flagged the item during the exam (marked_for_review), making
//     the examination record complete for the reviewer/appeals surface.

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
  answers: Array<{ question_id: string; user_answer: string[]; time_taken_seconds?: number; marked_for_review?: boolean }>;
  language?: Language;
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

    // 2b. Blueprint lookup so each telemetry row can carry its domain_code
    //     (question -> task -> domain). Best-effort: a missing map degrades to
    //     null, never blocks scoring.
    const domainCodeByTask = new Map<string, string | null>();
    try {
      const [{ data: taskRows }, { data: domRows }] = await Promise.all([
        svc.from("tasks").select("id, domain_id").eq("certification_id", session.certification_id),
        svc.from("domains").select("id, code").eq("certification_id", session.certification_id),
      ]);
      const codeByDomain = new Map<string, string>(
        (domRows ?? []).map((d: any) => [d.id, d.code]),
      );
      for (const t of taskRows ?? []) {
        domainCodeByTask.set(t.id, codeByDomain.get(t.domain_id) ?? null);
      }
    } catch (err) {
      console.warn("domain_code map lookup failed (telemetry domain_code will be null):", err);
    }

    // 3. Load questions with correct answers + concept tags + task (for domain_code).
    const question_ids = body.answers.map((a) => a.question_id);
    const { data: questions } = await svc
      .from("quiz_questions")
      .select("id, correct_answer, difficulty, task_id, question_concepts(concept_id, concepts(slug, name))")
      .in("id", question_ids);
    if (!questions) throw new Error("failed to load questions");

    const q_by_id = new Map(questions.map((q: any) => [q.id, q]));

    // Telemetry: the form's presented order is the submitted answer order (the
    // client maps over the assembled question list in order). The language is
    // the form's language; default en.
    const telemetry_language: string = body.language ?? "en";

    // 4. Grade + bucket.
    const attempt_rows: any[] = [];
    const per_concept = new Map<string, { name: string; slug: string; attempted: number; correct: number }>();
    const per_difficulty = new Map<number, { attempted: number; correct: number }>();
    let correct_count = 0;

    body.answers.forEach((ans, presented_order) => {
      const q = q_by_id.get(ans.question_id) as any;
      if (!q) return;
      const correct_set = new Set(q.correct_answer as string[]);
      const user_set = new Set(ans.user_answer);
      const is_correct =
        correct_set.size === user_set.size && [...correct_set].every((x) => user_set.has(x));
      if (is_correct) correct_count += 1;

      attempt_rows.push({
        session_id: body.session_id,
        user_id,
        question_id: ans.question_id,
        user_answer: ans.user_answer,
        is_correct,
        time_taken_seconds: ans.time_taken_seconds ?? null,
        attempted_at: now.toISOString(),
        // --- 17024 telemetry (migration 062) ---
        language: telemetry_language,
        domain_code: q.task_id ? domainCodeByTask.get(q.task_id) ?? null : null,
        presented_order,
        // --- mark-for-review capture (migration 064) ---
        marked_for_review: ans.marked_for_review ?? false,
      });

      for (const qc of q.question_concepts ?? []) {
        const slug = qc.concepts?.slug ?? qc.concept_id;
        const name = qc.concepts?.name ?? slug;
        if (!per_concept.has(slug)) per_concept.set(slug, { name, slug, attempted: 0, correct: 0 });
        const bucket = per_concept.get(slug)!;
        bucket.attempted += 1;
        if (is_correct) bucket.correct += 1;
      }

      const d = q.difficulty as number;
      if (!per_difficulty.has(d)) per_difficulty.set(d, { attempted: 0, correct: 0 });
      const dbucket = per_difficulty.get(d)!;
      dbucket.attempted += 1;
      if (is_correct) dbucket.correct += 1;
    });

    // 5. Insert per-question attempts (audit trail + item telemetry for both kinds).
    if (attempt_rows.length > 0) {
      const { error } = await svc.from("quiz_attempts").insert(attempt_rows);
      if (error) throw new Error(`quiz_attempts insert: ${error.message}`);
    }

    // 5b. Mastery feed — SIMULATOR ONLY. The secure certification exam is
    //     inert to the adaptive engine (no secure-item signal leakage).
    if (!isCertExam) {
      const EXAM_MASTERY_WEIGHT = 0.5;
      try {
        const all_concept_ids = new Set<string>();
        for (const q of questions) {
          for (const qc of ((q as any).question_concepts ?? [])) {
            if (qc.concept_id) all_concept_ids.add(qc.concept_id);
          }
        }
        const { data: existing_mastery } = await svc
          .from("user_concept_mastery")
          .select("concept_id, mastery_score, attempts, correct, last_seen_at")
          .eq("user_id", user_id)
          .in("concept_id", [...all_concept_ids]);
        const mastery_by_concept = new Map(
          (existing_mastery ?? []).map((m: any) => [m.concept_id, m]),
        );

        for (const ans of body.answers) {
          const q = q_by_id.get(ans.question_id) as any;
          if (!q) continue;
          const correct_set = new Set(q.correct_answer as string[]);
          const user_set = new Set(ans.user_answer);
          const is_correct =
            correct_set.size === user_set.size && [...correct_set].every((x) => user_set.has(x));
          const concept_tags = q.question_concepts ?? [];
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
              is_correct,
              question_difficulty: q.difficulty ?? 3,
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

        const mastery_upserts: any[] = [];
        for (const [cid, m] of mastery_by_concept.entries()) {
          mastery_upserts.push({
            user_id,
            concept_id: cid,
            mastery_score: (m as any).mastery_score,
            attempts: (m as any).attempts,
            correct: (m as any).correct,
            last_seen_at: (m as any).last_seen_at ?? now.toISOString(),
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

    // 6. Aggregates.
    const total = attempt_rows.length;
    const score_pct = total > 0 ? (correct_count / total) * 100 : 0;
    const passed = score_pct >= passing_threshold;
    const duration_seconds = Math.round(
      (now.getTime() - new Date(session.started_at).getTime()) / 1000,
    );

    // 6b. Server-side late check (record, never reject). The client auto-submits
    //     at zero, so any excess is latency or tampering — evidence, not a block.
    const allowed_seconds = (cert.exam_duration_minutes ?? 60) * 60 + LATE_GRACE_SECONDS;
    const late_submission = duration_seconds > allowed_seconds;
    const over_by_seconds = late_submission ? duration_seconds - allowed_seconds : null;

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

    // 7. Close the session.
    await svc
      .from("quiz_sessions")
      .update({ completed_at: now.toISOString(), score_pct, passed })
      .eq("id", body.session_id);

    // ====================================================================
    // 8. Branch: real certification exam vs simulator.
    // ====================================================================
    if (isCertExam) {
      // 8a. Resolve the cert's currently-published JTA version, to stamp onto
      //     the attempt + credential (historical blueprint fidelity). Null-safe:
      //     if no version is published yet, the stamp is null and nothing breaks.
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

      // Auto-link the sponsoring company for THIS cert (via company_certifications
      // intersected with the user's team memberships). Null for B2C self-pay.
      let company_id: string | null = null;
      try {
        const { data: memberships } = await svc
          .from("team_members")
          .select("company_id")
          .eq("user_id", user_id);
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

      // Credential-ready record — and capture its id to link the credential.
      const { data: attempt, error: aErr } = await svc
        .from("exam_attempts")
        .insert({
          user_id,
          certification_id: session.certification_id,
          session_id: body.session_id,
          company_id,
          // Voucher was already consumed at exam START (generate-mock-exam).
          // Here we only LINK it onto the attempt for the audit trail — no
          // second consume. Carried via the session.
          voucher_id: session.voucher_id ?? null,
          score_pct,
          passed,
          total_questions: total,
          correct_answers: correct_count,
          duration_seconds,
          // --- 17024 hardening (migration 062) ---
          late_submission,
          over_by_seconds,
          jta_version_id,
          submitted_at: now.toISOString(),
        })
        .select("id")
        .single();
      if (aErr) throw new Error(`exam_attempts insert: ${aErr.message}`);

      // ---- Credential issuance (on pass only) ----
      let credential_id: string | null = null;
      let credential_code: string | null = null;
      // Lifecycle guard: only mint when the cert was in a launched state. An
      // exam should never have STARTED under draft/coming_soon, so if we somehow
      // reach mint there, refuse. (unavailable is allowed: a freeze blocks new
      // starts, but an attempt already in progress under 'available' completes
      // and mints â€” fairer to the candidate, defensible for 17024.)
      const mintable = (cert as any).status === "available" || (cert as any).status === "unavailable";
      if (passed && mintable) {
        try {
          // One active credential per user+cert: return the existing one
          // on a re-pass instead of minting a duplicate.
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
            // Snapshot the holder's name at issuance.
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

            // Record the exam language as the credential's locale, so the
            // certificate PDF renders in the language the exam was taken in.
            // Normalized to the three supported render locales; anything else
            // falls back to English at render time.
            const credential_locale =
              body.language === "es-419" || body.language === "pt-BR"
                ? body.language
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
                // Stamp the same JTA version onto the credential so /verify
                // renders the exact blueprint this credential was earned against.
                jta_version_id,
                issued_at: now.toISOString(),
                // AI-era credentials expire 1 year after issuance — the
                // coursework tracks a fast-moving field, so recertification
                // keeps the credential honest (and is a renewal touchpoint).
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
              // Link the credential back to the voucher it was earned with, so
              // an admin credential-revocation can cascade to the voucher.
              if (session.voucher_id) {
                const { error: vLinkErr } = await svc
                  .from("vouchers")
                  .update({
                    credential_id: cred.id,
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
        // True only if passed but issuance failed (rare) — the attempt row
        // is the durable record either way; ops can re-issue from it.
        credential_pending: passed && credential_id === null,
      });
    }

    // ---- Simulator (mock_exam): analytics + recommendations ----
    const adjusted = score_pct - 5;
    const predicted_real_exam_pass_pct = sigmoid((adjusted - passing_threshold) / 8) * 100;

    let recommendations: string[] = [];
    try {
      const language = body.language ?? "en";
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
        .map((c) => `Review the "${c.name}" concept — you scored ${c.pct.toFixed(0)}% on it.`);
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
      predicted_real_exam_pass_pct,
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
      predicted_real_exam_pass_pct,
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}
