// POST /functions/v1/generate-mock-exam
//
// Body: { certification_id }
// Auth: Bearer JWT
//
// Builds a mock exam in CertiProf format:
//   - Pulls num_questions from the cert (typically 40)
//   - Stratified sample: ensures every major concept is represented
//   - Balanced difficulty mix (~30% easy, 50% medium, 20% hard)
//   - Shuffles question order
//   - Creates a quiz_sessions row with kind='mock_exam' and starts the timer
//
// The client polls the duration from the cert config and renders a countdown.
// At time-up or submit, call score-mock-exam to grade.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";

interface Body {
  certification_id: string;
}

interface QuestionRow {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  difficulty: number;
  module_id: string | null;
  concept_ids: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const user_id = await authenticate(req);
    const body = await req.json() as Body;
    if (!body.certification_id) throw new HttpError(400, 'certification_id required');

    const svc = getServiceClient();

    // 1. Load cert config.
    const { data: cert, error: cErr } = await svc
      .from('certifications')
      .select('id, code, name, exam_duration_minutes, passing_score_pct, num_questions')
      .eq('id', body.certification_id)
      .single();
    if (cErr || !cert) throw new HttpError(404, 'certification not found');
    const target_count = cert.num_questions ?? 40;

    // 2. Pull all candidate questions for the cert with their concept tags.
    const { data: question_rows } = await svc
      .from('quiz_questions')
      .select('id, question_text, question_type, options, difficulty, module_id, question_concepts(concept_id)')
      .eq('certification_id', body.certification_id);

    if (!question_rows || question_rows.length === 0) {
      throw new HttpError(400, 'no questions available for this certification');
    }

    const candidates: QuestionRow[] = question_rows.map((q: any) => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      difficulty: q.difficulty,
      module_id: q.module_id,
      concept_ids: (q.question_concepts ?? []).map((qc: any) => qc.concept_id),
    }));

    if (candidates.length < target_count) {
      // Allow exam anyway with fewer questions; surface the gap to the client.
      console.warn(`Only ${candidates.length} questions; target was ${target_count}`);
    }

    // 3. Stratified sampling: cover concepts evenly, then balance difficulty.
    const selected = stratifiedSample(candidates, Math.min(target_count, candidates.length));

    // 4. Create the quiz_sessions row.
    const { data: session, error: sErr } = await svc
      .from('quiz_sessions')
      .insert({
        user_id,
        certification_id: body.certification_id,
        module_id: null,
        kind: 'mock_exam',
        started_at: new Date().toISOString(),
      })
      .select('id, started_at')
      .single();
    if (sErr || !session) throw new Error(`quiz_sessions insert: ${sErr?.message}`);

    return jsonResponse({
      session_id: session.id,
      started_at: session.started_at,
      duration_minutes: cert.exam_duration_minutes ?? 60,
      passing_score_pct: Number(cert.passing_score_pct ?? 70),
      total_questions: selected.length,
      questions: selected.map(q => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        // Note: difficulty and concept_ids deliberately omitted from response
        // so the client can't infer answer strategies. They're used at scoring.
      })),
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

/**
 * Stratified sampler.
 *
 * Step 1: For each concept, allocate a quota = round(N * concept_share).
 *         Concept share is concept's question count / total questions in pool.
 *         This naturally weights by how much content covers the concept.
 *
 * Step 2: Within each concept, pick a balanced difficulty mix (≈30/50/20).
 *
 * Step 3: If we end up short (a concept has too few questions), top off with
 *         random fills from unused questions.
 *
 * Step 4: Shuffle the final list.
 */
function stratifiedSample(pool: QuestionRow[], n: number): QuestionRow[] {
  // Bucket by concept.
  const by_concept = new Map<string, QuestionRow[]>();
  const unconcepted: QuestionRow[] = [];
  for (const q of pool) {
    if (q.concept_ids.length === 0) unconcepted.push(q);
    else for (const cid of q.concept_ids) {
      if (!by_concept.has(cid)) by_concept.set(cid, []);
      by_concept.get(cid)!.push(q);
    }
  }

  // Allocate quotas by share of pool.
  const total = pool.length;
  const target_difficulty_mix = { easy: 0.30, medium: 0.50, hard: 0.20 };
  const chosen = new Set<string>();
  const result: QuestionRow[] = [];

  for (const [cid, qs] of by_concept.entries()) {
    const quota = Math.max(1, Math.round((qs.length / total) * n));
    const picked = pickBalancedDifficulty(qs.filter(q => !chosen.has(q.id)), quota, target_difficulty_mix);
    for (const q of picked) {
      if (!chosen.has(q.id)) { chosen.add(q.id); result.push(q); }
      if (result.length >= n) break;
    }
    if (result.length >= n) break;
  }

  // Top off if short.
  if (result.length < n) {
    const fillers = pool.filter(q => !chosen.has(q.id));
    shuffle(fillers);
    for (const q of fillers) {
      if (result.length >= n) break;
      chosen.add(q.id);
      result.push(q);
    }
  }

  shuffle(result);
  return result.slice(0, n);
}

function pickBalancedDifficulty(
  pool: QuestionRow[],
  quota: number,
  mix: { easy: number; medium: number; hard: number },
): QuestionRow[] {
  const easy = pool.filter(q => q.difficulty <= 2);
  const medium = pool.filter(q => q.difficulty === 3);
  const hard = pool.filter(q => q.difficulty >= 4);

  shuffle(easy); shuffle(medium); shuffle(hard);

  const e_n = Math.round(quota * mix.easy);
  const m_n = Math.round(quota * mix.medium);
  const h_n = quota - e_n - m_n;

  const picked = [...easy.slice(0, e_n), ...medium.slice(0, m_n), ...hard.slice(0, h_n)];
  // Fill from any bucket if a target was undersized.
  if (picked.length < quota) {
    const remaining = pool.filter(q => !picked.some(p => p.id === q.id));
    shuffle(remaining);
    picked.push(...remaining.slice(0, quota - picked.length));
  }
  return picked;
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
