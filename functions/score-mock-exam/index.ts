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
//     - Writes a credential-ready exam_attempts row (the durable record that
//       Phase B credentials/verify/badges/vouchers will hang off), with
//       company_id auto-linked to the company sponsoring THIS cert (via
//       company_certifications), or null for B2C self-pay.
//     - Returns score + pass/fail + breakdown (no mastery side effects).
//
// Both close the quiz session with score + pass.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";
import { callClaudeJSON } from "../_shared/claude.ts";
import { mockExamFeedbackPrompt, Language } from "../_shared/prompts.ts";
import { updateMastery } from "../_shared/mastery.ts";

interface Body {
  session_id: string;
  answers: Array<{ question_id: string; user_answer: string[]; time_taken_seconds?: number }>;
  language?: Language;
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
      .select("id, user_id, certification_id, kind, started_at, completed_at")
      .eq("id", body.session_id)
      .single();
    if (sErr || !session) throw new HttpError(404, "session not found");
    if (session.user_id !== user_id) throw new HttpError(403, "not your session");
    if (session.kind !== "mock_exam" && session.kind !== "certification_exam") {
      throw new HttpError(400, "not an exam session");
    }
    if (session.completed_at) throw new HttpError(409, "session already completed");

    const isCertExam = session.kind === "certification_exam";

    // 2. Cert config.
    const { data: cert } = await svc
      .from("certifications")
      .select("code, name, passing_score_pct")
      .eq("id", session.certification_id)
      .single();
    if (!cert) throw new HttpError(404, "cert not found");
    const passing_threshold = Number(cert.passing_score_pct ?? 85);

    // 3. Load questions with correct answers + concept tags.
    const question_ids = body.answers.map((a) => a.question_id);
    const { data: questions } = await svc
      .from("quiz_questions")
      .select("id, correct_answer, difficulty, question_concepts(concept_id, concepts(slug, name))")
      .in("id", question_ids);
    if (!questions) throw new Error("failed to load questions");

    const q_by_id = new Map(questions.map((q: any) => [q.id, q]));

    // 4. Grade + bucket.
    const attempt_rows: any[] = [];
    const per_concept = new Map<string, { name: string; slug: string; attempted: number; correct: number }>();
    const per_difficulty = new Map<number, { attempted: number; correct: number }>();
    let correct_count = 0;

    for (const ans of body.answers) {
      const q = q_by_id.get(ans.question_id) as any;
      if (!q) continue;
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
    }

    // 5. Insert per-question attempts (audit trail for both kinds).
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

      // Credential-ready record. Phase B reads this to mint credentials.
      const { error: aErr } = await svc.from("exam_attempts").insert({
        user_id,
        certification_id: session.certification_id,
        session_id: body.session_id,
        company_id,
        voucher_id: null, // Phase B
        score_pct,
        passed,
        total_questions: total,
        correct_answers: correct_count,
        duration_seconds,
        submitted_at: now.toISOString(),
      });
      if (aErr) throw new Error(`exam_attempts insert: ${aErr.message}`);

      return jsonResponse({
        kind: "certification_exam",
        score_pct,
        passed,
        passing_threshold,
        total_questions: total,
        correct_answers: correct_count,
        duration_seconds,
        // Credential issuance (badge, verify page) is Phase B; for now the
        // authoritative attempt is recorded and the result returned.
        credential_pending: passed,
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
