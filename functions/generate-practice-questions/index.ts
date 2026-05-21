// POST /functions/v1/generate-practice-questions
//
// Body: { certification_id, num_questions?: number, target_concept_slugs?: string[] }
// Auth: Bearer JWT
//
// If target_concept_slugs is omitted, we auto-pick the user's weakest concepts
// in this cert. Claude generates new questions tailored to those concepts,
// using existing questions as style reference. New questions are persisted with
// a flag so they can be audited / promoted to the canonical bank later.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";
import { callClaudeJSON } from "../_shared/claude.ts";

interface Body {
  certification_id: string;
  num_questions?: number;
  target_concept_slugs?: string[];
}

interface GeneratedQuestion {
  question_text: string;
  question_type: 'single_choice' | 'multi_choice' | 'true_false';
  options: Array<{ id: string; text: string }>;
  correct_answer: string[];
  explanation: string;
  difficulty: number; // 1..5
  concept_slugs: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const user_id = await authenticate(req);
    const body = await req.json() as Body;
    if (!body.certification_id) throw new HttpError(400, 'certification_id required');
    const n = Math.min(Math.max(body.num_questions ?? 5, 1), 15);

    const svc = getServiceClient();

    // 1. Resolve target concepts.
    let target_slugs: string[] = body.target_concept_slugs ?? [];
    if (target_slugs.length === 0) {
      const { data: weak } = await svc
        .from('user_concept_mastery')
        .select('concept_id, mastery_score, concepts!inner(slug, certification_id)')
        .eq('user_id', user_id)
        .eq('concepts.certification_id', body.certification_id)
        .order('mastery_score', { ascending: true })
        .limit(3);
      target_slugs = (weak ?? []).map((r: any) => r.concepts.slug);
    }
    if (target_slugs.length === 0) {
      // No mastery data yet — fall back to any concept in this cert.
      const { data: any_concepts } = await svc
        .from('concepts')
        .select('slug')
        .eq('certification_id', body.certification_id)
        .limit(3);
      target_slugs = (any_concepts ?? []).map(c => c.slug);
    }
    if (target_slugs.length === 0) throw new HttpError(400, 'no concepts available for this cert');

    // 2. Load concept rows + a couple of style-reference questions per concept.
    const { data: concept_rows } = await svc
      .from('concepts')
      .select('id, slug, name, description')
      .eq('certification_id', body.certification_id)
      .in('slug', target_slugs);

    if (!concept_rows || concept_rows.length === 0) throw new HttpError(404, 'concepts not found');

    const concept_ids = concept_rows.map(c => c.id);
    const slug_by_id = new Map(concept_rows.map(c => [c.id, c.slug]));
    const id_by_slug = new Map(concept_rows.map(c => [c.slug, c.id]));

    const { data: ref_qcs } = await svc
      .from('question_concepts')
      .select('question_id, concept_id')
      .in('concept_id', concept_ids)
      .limit(20);

    const ref_question_ids = [...new Set((ref_qcs ?? []).map(r => r.question_id))].slice(0, 6);
    const { data: ref_questions } = ref_question_ids.length > 0
      ? await svc.from('quiz_questions')
        .select('question_text, options, correct_answer, explanation, difficulty')
        .in('id', ref_question_ids)
      : { data: [] as any[] };

    // 3. Fetch cert metadata for context.
    const { data: cert } = await svc
      .from('certifications')
      .select('code, name, description')
      .eq('id', body.certification_id)
      .single();

    // 4. Call Claude.
    const generated = await generateWithClaude({
      cert_code: cert?.code ?? '',
      cert_name: cert?.name ?? '',
      cert_description: cert?.description ?? '',
      concepts: concept_rows.map(c => ({ slug: c.slug, name: c.name, description: c.description ?? '' })),
      reference_questions: (ref_questions ?? []).map((q: any) => ({
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
      })),
      n,
    });

    // 5. Validate + persist.
    const accepted: GeneratedQuestion[] = [];
    for (const q of generated) {
      if (!validateQuestion(q)) continue;
      // Drop concept slugs we don't recognize — keeps the bank clean.
      q.concept_slugs = q.concept_slugs.filter(s => id_by_slug.has(s));
      if (q.concept_slugs.length === 0) continue;
      accepted.push(q);
    }
    if (accepted.length === 0) throw new Error('no valid questions generated');

    const inserts = accepted.map(q => ({
      certification_id: body.certification_id,
      module_id: null,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      difficulty: q.difficulty,
    }));
    const { data: inserted, error: insErr } = await svc
      .from('quiz_questions')
      .insert(inserts)
      .select('id');
    if (insErr) throw new Error(`insert failed: ${insErr.message}`);

    // Wire question_concepts.
    const qc_rows: Array<{ question_id: string; concept_id: string }> = [];
    inserted!.forEach((row, idx) => {
      for (const slug of accepted[idx].concept_slugs) {
        const cid = id_by_slug.get(slug);
        if (cid) qc_rows.push({ question_id: row.id, concept_id: cid });
      }
    });
    if (qc_rows.length > 0) await svc.from('question_concepts').insert(qc_rows);

    return jsonResponse({
      generated_count: accepted.length,
      target_concept_slugs: target_slugs,
      question_ids: inserted!.map(r => r.id),
      questions: inserted!.map((row, idx) => ({
        id: row.id,
        question_text: accepted[idx].question_text,
        difficulty: accepted[idx].difficulty,
        concept_slugs: accepted[idx].concept_slugs,
      })),
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

async function generateWithClaude(ctx: {
  cert_code: string;
  cert_name: string;
  cert_description: string;
  concepts: Array<{ slug: string; name: string; description: string }>;
  reference_questions: Array<{
    question_text: string;
    options: any;
    correct_answer: string[];
    explanation: string | null;
    difficulty: number;
  }>;
  n: number;
}): Promise<GeneratedQuestion[]> {
  const system = `You are a certification exam question writer for Certidemy. You produce
practice questions that match the style and rigor of the source certification.

Strict requirements for every question:
  - Single unambiguous correct answer (or multiple if question_type is "multi_choice").
  - 4 options for single/multi choice, 2 for true_false.
  - Option IDs are "a", "b", "c", "d" (or "a","b" for true_false).
  - correct_answer is an array of option IDs.
  - Explanation is 1-3 sentences and references the underlying concept.
  - Difficulty 1=trivial recall, 5=tricky multi-step reasoning.
  - Mix difficulties: ${'~'}40% level 2, ${'~'}40% level 3, ${'~'}20% level 4.
  - concept_slugs must come from the provided concept list — do not invent slugs.

Output schema (strict JSON, top level is an array):
[
  {
    "question_text": string,
    "question_type": "single_choice" | "multi_choice" | "true_false",
    "options": [{"id": "a", "text": string}, ...],
    "correct_answer": [string, ...],
    "explanation": string,
    "difficulty": 1 | 2 | 3 | 4 | 5,
    "concept_slugs": [string, ...]
  },
  ...
]`;

  const ref_block = ctx.reference_questions.length > 0
    ? `Style reference (existing questions in this cert — match their tone, length, and rigor):
${ctx.reference_questions.map((q, i) => `[${i + 1}] ${q.question_text}
    Options: ${JSON.stringify(q.options)}
    Correct: ${JSON.stringify(q.correct_answer)}
    Explanation: ${q.explanation ?? ''}
    Difficulty: ${q.difficulty}`).join('\n\n')}`
    : '(no reference questions yet — write to the style of typical professional certification exams)';

  const prompt = `Certification: ${ctx.cert_name} (${ctx.cert_code})
${ctx.cert_description}

Generate ${ctx.n} new practice questions covering ONLY these concepts:

${ctx.concepts.map(c => `  - ${c.slug} — ${c.name}: ${c.description}`).join('\n')}

${ref_block}

Produce the JSON array now.`;

  return await callClaudeJSON<GeneratedQuestion[]>(prompt, {
    system,
    temperature: 0.7,
    max_tokens: 4096,
  });
}

function validateQuestion(q: any): q is GeneratedQuestion {
  if (!q || typeof q !== 'object') return false;
  if (typeof q.question_text !== 'string' || q.question_text.length < 10) return false;
  if (!['single_choice', 'multi_choice', 'true_false'].includes(q.question_type)) return false;
  if (!Array.isArray(q.options) || q.options.length < 2) return false;
  if (!Array.isArray(q.correct_answer) || q.correct_answer.length === 0) return false;
  const option_ids = new Set(q.options.map((o: any) => o.id));
  if (!q.correct_answer.every((id: string) => option_ids.has(id))) return false;
  if (typeof q.difficulty !== 'number' || q.difficulty < 1 || q.difficulty > 5) return false;
  if (!Array.isArray(q.concept_slugs) || q.concept_slugs.length === 0) return false;
  return true;
}
