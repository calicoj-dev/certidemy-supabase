// POST /functions/v1/generate-mock-exam
//
// Body: { certification_id, mode?: 'simulator' | 'exam', language?: 'en' | 'es-419' | 'pt-BR' }
// Auth: Bearer JWT
//
// Assembles a BLUEPRINT-WEIGHTED exam form:
//   - Pulls num_questions from the cert (e.g. 80 for Certidemy Scrum Master I).
//   - Allocates questions across DOMAINS proportional to domain.weight_pct
//     (largest-remainder rounding so the parts sum exactly to num_questions).
//   - Within each domain, spreads across that domain's tasks and balances
//     difficulty (~30% easy / 50% medium / 20% hard).
//   - Draws from a POOL determined by mode:
//        mode='simulator' -> pool='practice'  (kind='mock_exam')          — practice items
//        mode='exam'      -> pool='secure'    (kind='certification_exam')  — secure items
//   - Serves questions in the learner's LANGUAGE (en / es-419 / pt-BR). The
//     trilingual siblings share group_key, correct_answer and option ids, so
//     scoring is identical regardless of which language form is served.
//   - For a real exam, REFUSES (clear error) if the secure pool cannot fill
//     the blueprint for any domain, rather than silently issuing a malformed
//     form. This guarantees every certification exam is blueprint-valid.
//   - Shuffles final order; never returns correct_answer / difficulty / tags.
//
// VOUCHER GATE (mode='exam' only): a real certification exam requires a
// redeemable voucher assigned to the user for this cert. The attempt is
// CONSUMED at start — issuing the secure form burns one attempt regardless of
// whether the candidate finishes (abandon/disconnect still counts). The
// simulator is always free and ungated. Consumption is atomic and happens
// BEFORE the form is assembled, so we never hand out secure items without
// having charged the attempt.
//
// Scoring is handled by score-mock-exam, which reads quiz_sessions.kind to
// decide credential vs practice behaviour and links voucher_id onto the
// attempt (without consuming again).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { authenticate, getServiceClient, HttpError } from "../_shared/supabase.ts";
import { consumeAttempt } from "../_shared/vouchers.ts";

const SUPPORTED_LANGUAGES = ["en", "es-419", "pt-BR"] as const;
type Language = (typeof SUPPORTED_LANGUAGES)[number];

interface Body {
  certification_id: string;
  mode?: "simulator" | "exam";
  language?: string;
}

interface QuestionRow {
  id: string;
  question_text: string;
  question_type: string;
  options: unknown;
  difficulty: number;
  task_id: string | null;
  domain_id: string | null;
}

interface DomainRow {
  id: string;
  code: string;
  weight_pct: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  try {
    const user_id = await authenticate(req);
    const body = (await req.json()) as Body;
    if (!body.certification_id) throw new HttpError(400, "certification_id required");

    const mode = body.mode === "exam" ? "exam" : "simulator";
    const pool = mode === "exam" ? "secure" : "practice";
    const sessionKind = mode === "exam" ? "certification_exam" : "mock_exam";

    // Resolve and validate language. Default to English. An unknown locale is
    // rejected for a real exam (we will not silently issue an English form to a
    // candidate who requested another language); for the simulator we fall back
    // to English rather than erroring.
    let language: Language = "en";
    if (body.language) {
      if ((SUPPORTED_LANGUAGES as readonly string[]).includes(body.language)) {
        language = body.language as Language;
      } else if (mode === "exam") {
        throw new HttpError(
          400,
          `unsupported language '${body.language}'. Supported: ${SUPPORTED_LANGUAGES.join(", ")}`,
        );
      }
      // simulator + unknown language -> keep English fallback
    }

    const svc = getServiceClient();

    // ====================================================================
    // VOUCHER GATE + CONSUME — real certification exam only.
    // Done BEFORE assembling the form: if the user has no redeemable voucher
    // we refuse without revealing any secure items; if they do, we consume
    // one attempt now (exam start = attempt spent). The consumed voucher id
    // is carried onto the session so the scorer can link it to the attempt.
    // ====================================================================
    let consumed_voucher_id: string | null = null;
    if (mode === "exam") {
      const consumed = await consumeAttempt(svc, user_id, body.certification_id);
      if (!consumed) {
        throw new HttpError(
          403,
          "no exam attempts available. A certification exam requires a voucher " +
            "with remaining attempts. Practice in the Simulator is always free.",
        );
      }
      consumed_voucher_id = consumed.voucher_id;
    }

    // From here, if anything fails for a real exam, the attempt has already
    // been consumed. That is intentional and matches the proctored-exam model
    // (starting burns the attempt). The blueprint-integrity gate below should
    // never trip in production because the secure pool is verified complete;
    // if it ever does, ops can re-issue from the audit trail.

    // 1. Cert config.
    const { data: cert, error: cErr } = await svc
      .from("certifications")
      .select("id, code, name, exam_duration_minutes, passing_score_pct, num_questions")
      .eq("id", body.certification_id)
      .single();
    if (cErr || !cert) throw new HttpError(404, "certification not found");
    const target_count: number = cert.num_questions ?? 40;

    // 2. Blueprint: domains + weights.
    const { data: domainRows, error: dErr } = await svc
      .from("domains")
      .select("id, code, weight_pct")
      .eq("certification_id", body.certification_id)
      .order("order_index", { ascending: true });
    if (dErr || !domainRows || domainRows.length === 0) {
      throw new HttpError(400, "no domains/blueprint for this certification");
    }
    const domains: DomainRow[] = domainRows.map((d: any) => ({
      id: d.id,
      code: d.code,
      weight_pct: Number(d.weight_pct),
    }));

    // 3. task_id -> domain_id (so we can bucket questions by domain).
    const { data: taskRows } = await svc
      .from("tasks")
      .select("id, domain_id")
      .eq("certification_id", body.certification_id);
    const domainByTask = new Map<string, string>(
      (taskRows ?? []).map((t: any) => [t.id, t.domain_id]),
    );

    // 4. Candidate questions for this cert + pool + language.
    const { data: question_rows } = await svc
      .from("quiz_questions")
      .select("id, question_text, question_type, options, difficulty, task_id")
      .eq("certification_id", body.certification_id)
      .eq("pool", pool)
      .eq("language", language)
      .eq("status", "approved")
      .eq("is_exam_scope", true);

    if (!question_rows || question_rows.length === 0) {
      throw new HttpError(
        400,
        mode === "exam"
          ? `no secure questions available in '${language}' — the certification exam pool is empty for this language`
          : `no practice questions available in '${language}' for the simulator`,
      );
    }

    const candidates: QuestionRow[] = question_rows.map((q: any) => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      difficulty: q.difficulty,
      task_id: q.task_id,
      domain_id: q.task_id ? domainByTask.get(q.task_id) ?? null : null,
    }));

    // 5. Blueprint-weighted allocation across domains (largest-remainder).
    const allocation = allocateByWeight(domains, target_count);

    // 6. Bucket candidates by domain.
    const byDomain = new Map<string, QuestionRow[]>();
    for (const q of candidates) {
      if (!q.domain_id) continue;
      if (!byDomain.has(q.domain_id)) byDomain.set(q.domain_id, []);
      byDomain.get(q.domain_id)!.push(q);
    }

    // 7. For each domain, pick its quota; collect shortfalls.
    const selected: QuestionRow[] = [];
    const chosen = new Set<string>();
    const shortfalls: { code: string; need: number; have: number }[] = [];

    for (const d of domains) {
      const quota = allocation.get(d.id) ?? 0;
      if (quota === 0) continue;
      const poolForDomain = (byDomain.get(d.id) ?? []).filter((q) => !chosen.has(q.id));
      const picked = pickAcrossTasksBalanced(poolForDomain, quota);
      for (const q of picked) {
        chosen.add(q.id);
        selected.push(q);
      }
      if (picked.length < quota) {
        shortfalls.push({ code: d.code, need: quota, have: picked.length });
      }
    }

    // 8. Integrity gate for REAL exams: refuse if the blueprint can't be filled.
    if (mode === "exam" && shortfalls.length > 0) {
      const detail = shortfalls
        .map((s) => `${s.code}: need ${s.need}, have ${s.have}`)
        .join("; ");
      throw new HttpError(
        409,
        `secure pool insufficient to assemble a blueprint-valid exam in '${language}' (${detail}). ` +
          `Add secure items to these domains/language before issuing certification exams.`,
      );
    }

    // 9. Simulator only: if practice pool is thin in a domain, top off from
    //    any remaining practice questions so the learner still gets a full form.
    if (mode === "simulator" && selected.length < target_count) {
      const fillers = candidates.filter((q) => !chosen.has(q.id));
      shuffle(fillers);
      for (const q of fillers) {
        if (selected.length >= target_count) break;
        chosen.add(q.id);
        selected.push(q);
      }
    }

    shuffle(selected);
    const finalQuestions = selected.slice(0, target_count);

    // 10. Create the session. For a real exam, stamp the consumed voucher id
    //     so the scorer can link it onto the exam_attempts row.
    const { data: session, error: sErr } = await svc
      .from("quiz_sessions")
      .insert({
        user_id,
        certification_id: body.certification_id,
        module_id: null,
        kind: sessionKind,
        voucher_id: consumed_voucher_id,
        started_at: new Date().toISOString(),
      })
      .select("id, started_at")
      .single();
    if (sErr || !session) throw new Error(`quiz_sessions insert: ${sErr?.message}`);

    return jsonResponse({
      session_id: session.id,
      mode,
      language,
      started_at: session.started_at,
      duration_minutes: cert.exam_duration_minutes ?? 60,
      passing_score_pct: Number(cert.passing_score_pct ?? 85),
      total_questions: finalQuestions.length,
      target_questions: target_count,
      questions: finalQuestions.map((q) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        // difficulty / task / domain deliberately omitted so the client
        // can't infer answer strategies. Used only at scoring time.
      })),
    });
  } catch (err) {
    if (err instanceof HttpError) return jsonResponse({ error: err.message }, err.status);
    console.error(err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

/**
 * Allocate `total` questions across domains proportional to weight_pct,
 * using the largest-remainder method so the parts sum to exactly `total`.
 */
function allocateByWeight(domains: DomainRow[], total: number): Map<string, number> {
  const sumWeight = domains.reduce((s, d) => s + d.weight_pct, 0) || 1;
  const exact = domains.map((d) => ({
    id: d.id,
    raw: (d.weight_pct / sumWeight) * total,
  }));
  const floored = exact.map((e) => ({ id: e.id, n: Math.floor(e.raw), rem: e.raw - Math.floor(e.raw) }));
  let assigned = floored.reduce((s, f) => s + f.n, 0);
  // Distribute the remaining seats to the largest remainders.
  const order = [...floored].sort((a, b) => b.rem - a.rem);
  let i = 0;
  while (assigned < total && order.length > 0) {
    order[i % order.length].n += 1;
    assigned += 1;
    i += 1;
  }
  return new Map(floored.map((f) => [f.id, f.n]));
}

/**
 * Pick `quota` questions from a single domain's pool, spreading across the
 * domain's tasks (round-robin by task) and balancing difficulty ~30/50/20.
 */
function pickAcrossTasksBalanced(pool: QuestionRow[], quota: number): QuestionRow[] {
  if (pool.length === 0 || quota === 0) return [];

  // Group by task, shuffle within each, then round-robin across tasks so a
  // single over-represented task (e.g. 3.9) can't dominate the domain.
  const byTask = new Map<string, QuestionRow[]>();
  for (const q of pool) {
    const key = q.task_id ?? "none";
    if (!byTask.has(key)) byTask.set(key, []);
    byTask.get(key)!.push(q);
  }
  for (const arr of byTask.values()) shuffle(arr);

  const taskQueues = [...byTask.values()];
  shuffle(taskQueues);

  const roundRobin: QuestionRow[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const queue of taskQueues) {
      const next = queue.shift();
      if (next) {
        roundRobin.push(next);
        added = true;
      }
    }
  }

  // Now balance difficulty across the round-robin-ordered list.
  return pickBalancedDifficulty(roundRobin, Math.min(quota, roundRobin.length));
}

function pickBalancedDifficulty(pool: QuestionRow[], quota: number): QuestionRow[] {
  const mix = { easy: 0.3, medium: 0.5, hard: 0.2 };
  const easy = pool.filter((q) => q.difficulty <= 2);
  const medium = pool.filter((q) => q.difficulty === 3);
  const hard = pool.filter((q) => q.difficulty >= 4);

  const e_n = Math.round(quota * mix.easy);
  const m_n = Math.round(quota * mix.medium);
  const h_n = quota - e_n - m_n;

  const picked = [...easy.slice(0, e_n), ...medium.slice(0, m_n), ...hard.slice(0, h_n)];

  // Fill any shortfall (a difficulty band was undersized) from the remainder,
  // preserving the round-robin (task-spread) order.
  if (picked.length < quota) {
    const used = new Set(picked.map((p) => p.id));
    for (const q of pool) {
      if (picked.length >= quota) break;
      if (!used.has(q.id)) {
        used.add(q.id);
        picked.push(q);
      }
    }
  }
  return picked.slice(0, quota);
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
