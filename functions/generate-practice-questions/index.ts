// POST /functions/v1/generate-practice-questions
//
// Body: { certification_id, num_questions?: number, target_concept_slugs?: string[], language?: string }
// Auth: Bearer JWT
//
// Generates new PRACTICE questions for the learner's weakest concepts (or an
// explicit concept list). Task-first by design:
//
//   weak concepts -> their tasks -> generate per task -> persist via RPC
//
// task_id is decided SERVER-SIDE (never trusted from the model), and the
// question_concepts links are derived from that task's task_concepts inside a
// single transaction (create_practice_questions, migration 043). This makes a
// generated question structurally identical to a canonical one: reachable by
// the practice engine, linked to exactly the concepts its task is tagged to,
// pool='practice', is_exam_scope=false. There is no way for it to be born an
// orphan.
//
// Language: defaults to 'en'. Trilingual fan-out (one logical question across
// en/es-419/pt-BR sharing a question_group_id) is the next step; today an
// es-419/pt-BR caller still works because fetchConceptPractice falls back to en.
//
// NOTE: status is left at its column default ('approved') — generated
// questions go live immediately, as before. A real review gate must also be
// enforced in the fetch paths (fetchConceptPractice / get-review-batch /
// fetchWeakConceptPractice), so it's tracked separately rather than half-built.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";
import { callClaudeJSON } from "../_shared/claude.ts";

const MAX_TASKS = 4;
const MAX_REF = 4;

interface Body {
  certification_id: string;
  num_questions?: number;
  target_concept_slugs?: string[];
  language?: string;
}

interface GeneratedQuestion {
  question_text: string;
  question_type: 'single_choice' | 'multi_choice' | 'true_false';
  options: Array<{ id: string; text: string }>;
  correct_answer: string[];
  explanation: string;
  difficulty: number; // 1..5
}

interface ConceptLite {
  slug: string;
  name: string;
  description: string;
}

interface PayloadRow {
  certification_id: string;
  task_id: string;
  question_text: string;
  question_type: string;
  options: unknown;
  correct_answer: string[];
  explanation: string;
  difficulty: number;
  language: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const user_id = await authenticate(req);
    const body = await req.json() as Body;
    if (!body.certification_id) throw new HttpError(400, 'certification_id required');
    const n = Math.min(Math.max(body.num_questions ?? 5, 1), 15);
    const language = (body.language && body.language.trim()) || 'en';

    const svc = getServiceClient();

    // 1. Resolve target concepts: explicit list, else weakest, else any.
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
      target_slugs = (any_concepts ?? []).map((c: any) => c.slug);
    }
    if (target_slugs.length === 0) throw new HttpError(400, 'no concepts available for this cert');

    // 2. Target slugs -> concept ids (cert-scoped).
    const { data: concept_rows } = await svc
      .from('concepts')
      .select('id, slug')
      .eq('certification_id', body.certification_id)
      .in('slug', target_slugs);
    if (!concept_rows || concept_rows.length === 0) throw new HttpError(404, 'concepts not found');
    const target_concept_ids = concept_rows.map((c: any) => c.id);

    // 3. Concept ids -> tasks. Tasks are the reachability anchor: a question is
    //    born ON a task, and its concept links are derived from task_concepts.
    const { data: tc_for_targets } = await svc
      .from('task_concepts')
      .select('task_id')
      .in('concept_id', target_concept_ids);
    const task_ids = [...new Set((tc_for_targets ?? []).map((r: any) => r.task_id))].slice(0, MAX_TASKS);
    if (task_ids.length === 0) throw new HttpError(404, 'no tasks linked to target concepts');

    // 4. Full concept set per task (for the prompt + an honest response: the
    //    slugs we report are the ones that will actually be linked).
    const { data: task_concept_rows } = await svc
      .from('task_concepts')
      .select('task_id, concept_id, concepts!inner(slug, name, description)')
      .in('task_id', task_ids);
    const conceptsByTask = new Map<string, ConceptLite[]>();
    const slugsByTask = new Map<string, string[]>();
    for (const r of (task_concept_rows ?? []) as any[]) {
      if (!conceptsByTask.has(r.task_id)) {
        conceptsByTask.set(r.task_id, []);
        slugsByTask.set(r.task_id, []);
      }
      conceptsByTask.get(r.task_id)!.push({
        slug: r.concepts.slug,
        name: r.concepts.name,
        description: r.concepts.description ?? '',
      });
      slugsByTask.get(r.task_id)!.push(r.concepts.slug);
    }

    // 5. Cert metadata for prompt context.
    const { data: cert } = await svc
      .from('certifications')
      .select('code, name, description')
      .eq('id', body.certification_id)
      .single();

    // 6. Generate PER TASK so task_id is server-decided, then validate.
    const per_task = Math.max(1, Math.ceil(n / task_ids.length));
    const payload: PayloadRow[] = [];
    const payload_task: string[] = []; // task_id parallel to payload, for response slugs

    for (const task_id of task_ids) {
      const concepts = conceptsByTask.get(task_id) ?? [];
      if (concepts.length === 0) continue;

      // Style references: PRACTICE pool only, in the target language. Never
      // feed SECURE items to the generator — Claude could mirror exam content
      // into practice.
      const concept_ids_for_task = (task_concept_rows ?? [])
        .filter((r: any) => r.task_id === task_id)
        .map((r: any) => r.concept_id);
      const { data: ref_qcs } = await svc
        .from('question_concepts')
        .select('question_id')
        .in('concept_id', concept_ids_for_task)
        .limit(30);
      const ref_ids = [...new Set((ref_qcs ?? []).map((r: any) => r.question_id))].slice(0, 12);
      const { data: ref_questions } = ref_ids.length > 0
        ? await svc.from('quiz_questions')
          .select('question_text, options, correct_answer, explanation, difficulty')
          .in('id', ref_ids)
          .eq('pool', 'practice')
          .eq('language', language)
          .limit(MAX_REF)
        : { data: [] as any[] };

      const generated = await generateWithClaude({
        cert_code: cert?.code ?? '',
        cert_name: cert?.name ?? '',
        cert_description: cert?.description ?? '',
        language,
        concepts,
        reference_questions: (ref_questions ?? []).map((q: any) => ({
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
        })),
        n: per_task,
      });

      for (const q of generated) {
        if (!validateQuestion(q)) continue;
        payload.push({
          certification_id: body.certification_id,
          task_id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          language,
        });
        payload_task.push(task_id);
        if (payload.length >= n) break;
      }
      if (payload.length >= n) break;
    }

    if (payload.length === 0) throw new Error('no valid questions generated');

    // 7. Atomic, reachability-safe persist. The RPC inserts each question AND
    //    its task-derived question_concepts in one transaction; it also forces
    //    pool='practice' and is_exam_scope=false. Returns ids in payload order.
    const { data: ids, error: rpcErr } = await svc.rpc('create_practice_questions', {
      p_questions: payload,
    });
    if (rpcErr) throw new Error(`persist failed: ${rpcErr.message}`);
    const question_ids: string[] = (ids ?? []) as string[];
    if (question_ids.length === 0) throw new Error('persist returned no ids');

    return jsonResponse({
      generated_count: question_ids.length,
      target_concept_slugs: target_slugs,
      language,
      question_ids,
      questions: question_ids.map((id, idx) => ({
        id,
        question_text: payload[idx]?.question_text,
        difficulty: payload[idx]?.difficulty,
        // The concepts this question is actually linked to (= its task's set).
        concept_slugs: slugsByTask.get(payload_task[idx] ?? '') ?? [],
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
  language: string;
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
  const langName = ({
    'en': 'English',
    'es-419': 'Latin American Spanish',
    'pt-BR': 'Brazilian Portuguese',
  } as Record<string, string>)[ctx.language] ?? ctx.language;

  const system = `You are a certification exam question writer for Certidemy. You write
practice questions in ${langName} that match the style and rigor of the source certification.

Strict requirements for every question:
  - Write ALL learner-facing text (question_text, options, explanation) in ${langName}.
  - Keep Scrum proper nouns in English, untranslated: Sprint, Scrum Master, Product
    Owner, Daily Scrum, Definition of Done, Sprint Backlog, Sprint Goal, Product Backlog,
    Product Goal, Increment, Sprint Review, Sprint Retrospective, Sprint Planning, INVEST.
  - Single unambiguous correct answer (or multiple if question_type is "multi_choice").
  - 4 options for single/multi choice, 2 for true_false.
  - Option IDs are "a", "b", "c", "d" (or "a", "b" for true_false).
  - correct_answer is an array of option IDs.
  - Explanation is 1-3 sentences and references the underlying concept.
  - Difficulty 1=trivial recall, 5=tricky multi-step reasoning. Favor Apply/Analyze
    (difficulty 3-4) over recall: aim ~40% level 2, ~40% level 3, ~20% level 4.

Output schema (strict JSON, top level is an array; NO prose, NO markdown fences):
[
  {
    "question_text": string,
    "question_type": "single_choice" | "multi_choice" | "true_false",
    "options": [{"id": "a", "text": string}, ...],
    "correct_answer": [string, ...],
    "explanation": string,
    "difficulty": 1 | 2 | 3 | 4 | 5
  }
]`;

  const ref_block = ctx.reference_questions.length > 0
    ? `Style reference (existing PRACTICE questions in this cert — match tone, length, rigor):
${ctx.reference_questions.map((q, i) => `[${i + 1}] ${q.question_text}
    Options: ${JSON.stringify(q.options)}
    Correct: ${JSON.stringify(q.correct_answer)}
    Explanation: ${q.explanation ?? ''}
    Difficulty: ${q.difficulty}`).join('\n\n')}`
    : '(no practice reference questions yet — write to the style of typical professional certification exams)';

  const prompt = `Certification: ${ctx.cert_name} (${ctx.cert_code})
${ctx.cert_description}

Generate ${ctx.n} new practice questions that TEST the following concept(s):

${ctx.concepts.map(c => `  - ${c.name}: ${c.description}`).join('\n')}

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
  return true;
}
