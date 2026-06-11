// POST /functions/v1/generate-study-plan
//
// Body: { certification_id, target_exam_date, daily_minutes }
// Auth: Bearer JWT
//
// Pipeline:
//   1. Load cert catalog (modules, lessons, prerequisites) + the user's current
//      concept mastery + recent mock exam results.
//   2. Ask Claude for personalization (strategy, priorities, coaching copy).
//   3. Run a deterministic scheduler over ONE lesson per lesson group, skipping
//      groups the learner has already completed.
//   4. Persist study_plans + study_plan_items rows.
//   5. Return the schedule + Claude's coaching message.
//
// LANGUAGE NOTE: lessons exist as one row per language, all sharing a
// `lesson_group_id` (the English head's id is the canonical group id). The
// scheduler must work in GROUPS, not rows — otherwise a 25-lesson course
// produces a 75-item plan with each lesson tripled across en/es-419/pt-BR.
// We dedupe to the canonical row (where lesson_group_id = id) before scheduling.
//
// COMPLETION NOTE: completion is also group-keyed. A lesson done in any one
// language counts for the whole group, so we roll up user_lesson_progress by
// lesson_group_id and skip groups already completed.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";
import { callClaudeJSON } from "../_shared/claude.ts";

interface Body {
  certification_id: string;
  target_exam_date: string;  // ISO date
  daily_minutes: number;
}

interface ClaudePersonalization {
  emphasis_strategy: 'front_load_weak' | 'balanced_sweep' | 'mock_heavy' | 'rapid_review';
  priority_concepts: string[];
  weekly_themes: string[];
  coaching_message: string;
  estimated_readiness_at_exam: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405);

  try {
    const user_id = await authenticate(req);
    const body = await req.json() as Body;
    if (!body.certification_id || !body.target_exam_date || !body.daily_minutes) {
      throw new HttpError(400, 'certification_id, target_exam_date, and daily_minutes are required');
    }
    const exam_date = new Date(body.target_exam_date);
    const start_date = new Date();
    start_date.setHours(0, 0, 0, 0);
    const total_days = Math.max(1, Math.ceil((exam_date.getTime() - start_date.getTime()) / 86_400_000));

    const svc = getServiceClient();

    // 1. Pull catalog.
    const [{ data: cert }, { data: modules }, , { data: concepts }, { data: mastery }] = await Promise.all([
      svc.from('certifications').select('id, code, name, passing_score_pct').eq('id', body.certification_id).single(),
      svc.from('modules').select('id, title, order_index, estimated_minutes').eq('certification_id', body.certification_id).order('order_index'),
      svc.from('module_prerequisites').select('module_id, prerequisite_module_id, strength').in('module_id', []),
      svc.from('concepts').select('id, slug, name, description').eq('certification_id', body.certification_id),
      svc.from('user_concept_mastery').select('concept_id, mastery_score, attempts').eq('user_id', user_id),
    ]);
    if (!cert) throw new HttpError(404, 'certification not found');
    if (!modules || modules.length === 0) throw new HttpError(400, 'no modules in this certification');

    const module_ids = modules.map(m => m.id);
    const { data: prereqs_real } = await svc
      .from('module_prerequisites')
      .select('module_id, prerequisite_module_id, strength')
      .in('module_id', module_ids);

    // Lessons — all language rows; we dedupe to one per group below.
    const { data: lessons_all } = await svc
      .from('lessons')
      .select('id, module_id, title, order_index, estimated_minutes, lesson_group_id, language')
      .in('module_id', module_ids)
      .order('order_index');

    // ---- Dedupe to ONE lesson per group (the canonical head). ----
    // Prefer the row where lesson_group_id = id (English head). Fall back to
    // the first row seen for a group if no head is present (shouldn't happen
    // after migration 010, but defensive).
    const lessons = dedupeByGroup(lessons_all ?? []);

    // ---- Skip groups the learner has already completed (group-aware). ----
    // NOTE: assumes user_lesson_progress(user_id, lesson_id, status) with
    // status 'completed'. If the schema differs, adjust the select + predicate.
    const { data: progress } = await svc
      .from('user_lesson_progress')
      .select('lesson_id, status')
      .eq('user_id', user_id);

    const completed_group_ids = await rollUpCompletedGroups(svc, progress ?? []);
    const remaining_lessons = lessons.filter(
      l => !completed_group_ids.has(l.lesson_group_id ?? l.id)
    );

    // Recent mock exam results for personalization.
    const { data: recent_exams } = await svc
      .from('mock_exam_results')
      .select('score_pct, passed, weakest_concepts, created_at')
      .eq('user_id', user_id)
      .eq('certification_id', body.certification_id)
      .order('created_at', { ascending: false })
      .limit(3);

    // 2. Concept-mastery view for Claude.
    const mastery_by_id = new Map((mastery ?? []).map(m => [m.concept_id, m]));
    const concept_view = (concepts ?? []).map(c => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      mastery: mastery_by_id.get(c.id)?.mastery_score ?? null,
      attempts: mastery_by_id.get(c.id)?.attempts ?? 0,
    }));

    // 3. Personalization.
    const personalization = await getPersonalization({
      cert_name: cert.name,
      cert_code: cert.code,
      passing_score: Number(cert.passing_score_pct),
      target_exam_date: body.target_exam_date,
      total_days,
      daily_minutes: body.daily_minutes,
      concept_view,
      module_titles: modules.map(m => m.title),
      recent_exams: recent_exams ?? [],
    });

    // 4. Deterministic scheduling over remaining (incomplete) lessons.
    const ordered_modules = topoSortModules(modules, prereqs_real ?? []);
    const items = scheduleLessons({
      modules: ordered_modules,
      lessons: remaining_lessons,
      total_days,
      daily_minutes: body.daily_minutes,
      start_date,
    });

    // 5. Persist.
    const { data: plan, error: planErr } = await svc
      .from('study_plans')
      .upsert({
        user_id,
        certification_id: body.certification_id,
        target_exam_date: body.target_exam_date,
        daily_minutes_goal: body.daily_minutes,
        status: 'active',
        coaching_message: personalization.coaching_message,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,certification_id' })
      .select('id')
      .single();
    if (planErr || !plan) throw new Error(`study_plans upsert: ${planErr?.message}`);

    await svc.from('study_plan_items').delete().eq('study_plan_id', plan.id);

    const insert_rows = items.map((it, idx) => ({
      study_plan_id: plan.id,
      item_type: it.kind, // 'lesson' | 'review' | 'mock_exam'
      lesson_id: it.kind === 'lesson' ? it.lesson_id : null,
      module_id: null,
      scheduled_date: it.date,
      order_index: idx,
      status: 'not_started' as const,
    }));

    if (insert_rows.length > 0) {
      const { error: insErr } = await svc.from('study_plan_items').insert(insert_rows);
      if (insErr) throw new Error(`study_plan_items insert: ${insErr.message}`);
    }

    return jsonResponse({
      plan_id: plan.id,
      coaching_message: personalization.coaching_message,
      emphasis_strategy: personalization.emphasis_strategy,
      weekly_themes: personalization.weekly_themes,
      estimated_readiness_at_exam: personalization.estimated_readiness_at_exam,
      total_items: items.length,
      schedule_preview: items.slice(0, 7),
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

// ----- Group dedup + completion rollup -----

interface LessonRow {
  id: string;
  module_id: string;
  title: string;
  order_index: number;
  estimated_minutes: number;
  lesson_group_id: string | null;
  language: string | null;
}

/** Keep one lesson per group: the canonical head (lesson_group_id = id) if
 *  present, else the first row seen for that group. */
function dedupeByGroup(rows: LessonRow[]): LessonRow[] {
  const byGroup = new Map<string, LessonRow>();
  for (const r of rows) {
    const gid = r.lesson_group_id ?? r.id;
    const existing = byGroup.get(gid);
    if (!existing) {
      byGroup.set(gid, r);
    } else if (r.lesson_group_id === r.id && existing.lesson_group_id !== existing.id) {
      // Prefer the canonical head row.
      byGroup.set(gid, r);
    }
  }
  return Array.from(byGroup.values());
}

/** Roll up completed lessons into the set of completed GROUP ids. A lesson
 *  completed in any language marks its whole group complete. */
async function rollUpCompletedGroups(
  svc: ReturnType<typeof getServiceClient>,
  progress: Array<{ lesson_id: string; status: string }>,
): Promise<Set<string>> {
  const completedLessonIds = progress
    .filter(p => p.status === 'completed')
    .map(p => p.lesson_id);
  if (completedLessonIds.length === 0) return new Set();

  // Map those lesson ids → their group ids.
  const { data: rows } = await svc
    .from('lessons')
    .select('id, lesson_group_id')
    .in('id', completedLessonIds);

  const groups = new Set<string>();
  for (const r of (rows ?? []) as Array<{ id: string; lesson_group_id: string | null }>) {
    groups.add(r.lesson_group_id ?? r.id);
  }
  return groups;
}

// ----- Claude personalization call -----

async function getPersonalization(ctx: {
  cert_name: string;
  cert_code: string;
  passing_score: number;
  target_exam_date: string;
  total_days: number;
  daily_minutes: number;
  concept_view: Array<{ slug: string; name: string; description: string | null; mastery: number | null; attempts: number }>;
  module_titles: string[];
  recent_exams: Array<{ score_pct: number; passed: boolean; weakest_concepts: string[]; created_at: string }>;
}): Promise<ClaudePersonalization> {
  const system = `You are a learning strategist for Certidemy, a certification prep platform.
You receive a learner's profile and certification catalog, and produce a high-level
study strategy. You do NOT produce a daily schedule (that's done by code). You DO
produce concept priorities, a strategy label, weekly themes, and short coaching copy.

Output schema (strict JSON):
{
  "emphasis_strategy": "front_load_weak" | "balanced_sweep" | "mock_heavy" | "rapid_review",
  "priority_concepts": string[],
  "weekly_themes": string[],
  "coaching_message": string,
  "estimated_readiness_at_exam": number
}

Strategy guide:
  - "front_load_weak"  : >5 concepts below 0.4 mastery, or a failed recent mock exam
  - "balanced_sweep"   : even mastery distribution, little or no exam history
  - "mock_heavy"       : most concepts above 0.6, or passing recent mock exams
  - "rapid_review"     : less than 14 days to exam, focus on recall over new lessons

Use the mock exam history when present — a failed or low-scoring recent exam is
strong evidence to favor "front_load_weak" and to surface that exam's weakest
concepts near the top of priority_concepts.`;

  const exam_history = ctx.recent_exams.length > 0
    ? `\n\nRecent mock exam results (most recent first):\n${ctx.recent_exams
        .map(e => `  - ${new Date(e.created_at).toISOString().slice(0, 10)}: ${e.score_pct.toFixed(0)}% (${e.passed ? 'passed' : 'not passing'}), weakest: ${(e.weakest_concepts ?? []).join(', ') || 'n/a'}`)
        .join('\n')}`
    : '\n\nNo mock exams taken yet.';

  const user = `Certification: ${ctx.cert_name} (${ctx.cert_code})
Passing score: ${ctx.passing_score}%
Exam date: ${ctx.target_exam_date} (${ctx.total_days} days away)
Daily study budget: ${ctx.daily_minutes} minutes

Modules in this cert (in catalog order):
${ctx.module_titles.map((t, i) => `  ${i + 1}. ${t}`).join('\n')}

Concepts and current mastery (null = never assessed):
${ctx.concept_view.map(c => `  - ${c.slug} (${c.name}): mastery=${c.mastery?.toFixed(2) ?? 'n/a'}, attempts=${c.attempts}`).join('\n')}${exam_history}

Produce the JSON output.`;

  return await callClaudeJSON<ClaudePersonalization>(user, {
    system,
    temperature: 0.3,
    max_tokens: 1200,
  });
}

// ----- Deterministic scheduling -----

interface ScheduleItem {
  kind: 'lesson' | 'review' | 'mock_exam';
  date: string;
  lesson_id?: string;
  module_id?: string;
  title: string;
  minutes: number;
}

function topoSortModules(
  modules: Array<{ id: string; order_index: number; title: string; estimated_minutes: number }>,
  prereqs: Array<{ module_id: string; prerequisite_module_id: string; strength: string }>,
) {
  const by_id = new Map(modules.map(m => [m.id, m]));
  const hard = prereqs.filter(p => p.strength === 'hard');
  const indegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const m of modules) { indegree.set(m.id, 0); adj.set(m.id, []); }
  for (const p of hard) {
    indegree.set(p.module_id, (indegree.get(p.module_id) ?? 0) + 1);
    adj.get(p.prerequisite_module_id)!.push(p.module_id);
  }
  const ready = modules.filter(m => (indegree.get(m.id) ?? 0) === 0).sort((a, b) => a.order_index - b.order_index);
  const out: typeof modules = [];
  while (ready.length > 0) {
    const m = ready.shift()!;
    out.push(m);
    for (const next_id of adj.get(m.id) ?? []) {
      indegree.set(next_id, indegree.get(next_id)! - 1);
      if (indegree.get(next_id) === 0) {
        ready.push(by_id.get(next_id)!);
        ready.sort((a, b) => a.order_index - b.order_index);
      }
    }
  }
  return out;
}

function scheduleLessons(args: {
  modules: Array<{ id: string; title: string; estimated_minutes: number }>;
  lessons: Array<{ id: string; module_id: string; title: string; order_index: number; estimated_minutes: number }>;
  total_days: number;
  daily_minutes: number;
  start_date: Date;
}): ScheduleItem[] {
  const lessons_by_module = new Map<string, typeof args.lessons>();
  for (const l of args.lessons) {
    if (!lessons_by_module.has(l.module_id)) lessons_by_module.set(l.module_id, []);
    lessons_by_module.get(l.module_id)!.push(l);
  }
  for (const arr of lessons_by_module.values()) arr.sort((a, b) => a.order_index - b.order_index);

  const queue: Array<{ lesson: typeof args.lessons[0]; module_title: string }> = [];
  for (const m of args.modules) {
    for (const l of (lessons_by_module.get(m.id) ?? [])) {
      queue.push({ lesson: l, module_title: m.title });
    }
  }

  const items: ScheduleItem[] = [];
  let day_offset = 0;
  let minutes_today = 0;
  const REVIEW_BLOCK_MINUTES = 15;
  const REVIEW_EVERY_N_DAYS = 3;
  const days_with_content = new Set<number>();

  const dateFor = (offset: number) => {
    const d = new Date(args.start_date);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };

  while (queue.length > 0 && day_offset < args.total_days) {
    const next = queue[0];
    const cost = next.lesson.estimated_minutes;
    if (minutes_today + cost > args.daily_minutes) {
      day_offset += 1;
      minutes_today = 0;
      continue;
    }
    items.push({
      kind: 'lesson',
      date: dateFor(day_offset),
      lesson_id: next.lesson.id,
      title: next.lesson.title,
      minutes: cost,
    });
    days_with_content.add(day_offset);
    minutes_today += cost;
    queue.shift();
  }

  for (let d = REVIEW_EVERY_N_DAYS; d < args.total_days; d += REVIEW_EVERY_N_DAYS) {
    if (!days_with_content.has(d)) {
      items.push({ kind: 'review', date: dateFor(d), title: 'FSRS review block', minutes: REVIEW_BLOCK_MINUTES });
    }
  }

  if (args.total_days >= 7) {
    items.push({ kind: 'mock_exam', date: dateFor(args.total_days - 2), title: 'Full mock exam', minutes: 60 });
  }
  if (args.total_days >= 14) {
    items.push({ kind: 'mock_exam', date: dateFor(Math.floor(args.total_days * 0.75)), title: 'Mid-prep mock exam', minutes: 60 });
  }

  items.sort((a, b) => a.date.localeCompare(b.date));
  return items;
}
