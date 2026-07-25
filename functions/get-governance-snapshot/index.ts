// get-governance-snapshot v2 — adds per-cert JTA version HISTORY (with
// blueprint_snapshot) and the full task inventory (code/statement/domain),
// feeding the scheme cards' JTA artifact drawer. Same gate, same shape
// otherwise (v1 fields unchanged).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const caller = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await caller.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const svc = createClient(url, serviceKey);
    const { data: profile } = await svc
      .from("profiles").select("platform_role").eq("id", user.id).maybeSingle();
    if ((profile as { platform_role?: string } | null)?.platform_role !== "platform_admin") {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const [{ data: certs }, { data: domains }, { data: tasks }, { data: jtas }] =
      await Promise.all([
        svc.from("certifications")
          .select("id, code, name, status, passing_score_pct, num_questions, exam_duration_minutes")
          .order("code"),
        svc.from("domains").select("id, certification_id, code, title, weight_pct, order_index"),
        svc.from("tasks").select("id, certification_id, domain_id, code, statement, order_index"),
        svc.from("jta_versions")
          .select("certification_id, version_string, status, created_at, blueprint_snapshot")
          .order("created_at", { ascending: false }),
      ]);

    const certList = (certs ?? []) as {
      id: string; code: string; name: string; status: string;
      passing_score_pct: number; num_questions: number; exam_duration_minutes: number;
    }[];
    const domainList = (domains ?? []) as {
      id: string; certification_id: string; code: string; title: string;
      weight_pct: number; order_index: number;
    }[];
    const domainCodeById = new Map(domainList.map((d) => [d.id, d.code]));
    const taskList = (tasks ?? []) as {
      id: string; certification_id: string; domain_id: string;
      code: string; statement: string; order_index: number;
    }[];
    const taskIdsByCert = new Map<string, string[]>();
    const tasksByCert: Record<string, { code: string; statement: string; domainCode: string }[]> = {};
    for (const c of certList) tasksByCert[c.code] = [];
    for (const t of taskList) {
      const arr = taskIdsByCert.get(t.certification_id) ?? [];
      arr.push(t.id);
      taskIdsByCert.set(t.certification_id, arr);
      const code = certList.find((c) => c.id === t.certification_id)?.code;
      if (code) {
        tasksByCert[code].push({
          code: t.code, statement: t.statement,
          domainCode: domainCodeById.get(t.domain_id) ?? "?",
        });
      }
    }
    for (const code of Object.keys(tasksByCert)) {
      tasksByCert[code].sort((a, b) =>
        a.code.localeCompare(b.code, undefined, { numeric: true })
      );
    }

    const jtaList = (jtas ?? []) as {
      certification_id: string; version_string: string; status: string;
      created_at: string; blueprint_snapshot: unknown;
    }[];
    const latestJta = new Map<string, (typeof jtaList)[number]>();
    const jtaHistory: Record<string, {
      version_string: string; status: string; created_at: string; blueprint_snapshot: unknown;
    }[]> = {};
    for (const c of certList) jtaHistory[c.code] = [];
    for (const j of jtaList) {
      if (!latestJta.has(j.certification_id)) latestJta.set(j.certification_id, j);
      const code = certList.find((c) => c.id === j.certification_id)?.code;
      if (code) jtaHistory[code].push({
        version_string: j.version_string, status: j.status,
        created_at: j.created_at, blueprint_snapshot: j.blueprint_snapshot,
      });
    }

    const LANGS = ["en", "es-419", "pt-BR"];
    const POOLS = ["practice", "secure"];
    const bank: Record<string, Record<string, Record<string, number>>> = {};
    for (const c of certList) {
      const ids = taskIdsByCert.get(c.id) ?? [];
      bank[c.code] = {};
      for (const pool of POOLS) {
        bank[c.code][pool] = {};
        for (const lang of LANGS) {
          if (ids.length === 0) { bank[c.code][pool][lang] = 0; continue; }
          const { count } = await svc
            .from("quiz_questions")
            .select("id", { count: "exact", head: true })
            .in("task_id", ids).eq("pool", pool).eq("language", lang);
          bank[c.code][pool][lang] = count ?? 0;
        }
      }
    }

    const { data: guardRows } = await svc.from("v_governance_guardrails").select("*");
    const guardrails = (guardRows?.[0] ?? {
      practice_marked_secure: null, secure_linked_to_concepts: null,
    }) as { practice_marked_secure: number | null; secure_linked_to_concepts: number | null };

    const [{ data: covSummary }, { data: covTnT }, { data: covTaught }] = await Promise.all([
      svc.from("v_coverage_summary").select("*").limit(100),
      svc.from("v_coverage_tested_not_taught").select("*").limit(100),
      svc.from("v_coverage_taught_not_tested").select("*").limit(100),
    ]);

    const { data: attempts } = await svc
      .from("exam_attempts")
      .select("certification_id, score_pct, passed, late_submission, submitted_at")
      .order("submitted_at", { ascending: false }).limit(2000);
    const tele: Record<string, { attempts: number; passed: number; avgScore: number; late: number }> = {};
    for (const a of (attempts ?? []) as {
      certification_id: string; score_pct: number; passed: boolean; late_submission: boolean;
    }[]) {
      const code = certList.find((c) => c.id === a.certification_id)?.code ?? "?";
      const t = (tele[code] ??= { attempts: 0, passed: 0, avgScore: 0, late: 0 });
      t.attempts++; if (a.passed) t.passed++; if (a.late_submission) t.late++;
      t.avgScore += Number(a.score_pct ?? 0);
    }
    for (const t of Object.values(tele)) t.avgScore = t.attempts ? Math.round(t.avgScore / t.attempts) : 0;

    const { data: credRows } = await svc.from("credentials").select("certification_code, status");
    const credentials: Record<string, { active: number; revoked: number; expired: number }> = {};
    for (const c of (credRows ?? []) as { certification_code: string; status: string }[]) {
      const b = (credentials[c.certification_code] ??= { active: 0, revoked: 0, expired: 0 });
      if (c.status === "active") b.active++;
      else if (c.status === "revoked") b.revoked++;
      else b.expired++;
    }
    const { data: audit } = await svc
      .from("admin_actions")
      .select("action, target_type, reason, created_at")
      .order("created_at", { ascending: false }).limit(12);

    const payload = {
      generatedAt: new Date().toISOString(),
      schemes: certList.map((c) => ({
        code: c.code, name: c.name, status: c.status,
        passingScorePct: c.passing_score_pct, numQuestions: c.num_questions,
        durationMinutes: c.exam_duration_minutes,
        taskCount: (taskIdsByCert.get(c.id) ?? []).length,
        domains: domainList
          .filter((d) => d.certification_id === c.id)
          .sort((a, b) => a.order_index - b.order_index)
          .map((d) => ({ code: d.code, title: d.title, weightPct: Number(d.weight_pct) })),
        jta: latestJta.get(c.id)
          ? {
              version_string: latestJta.get(c.id)!.version_string,
              status: latestJta.get(c.id)!.status,
              created_at: latestJta.get(c.id)!.created_at,
            }
          : null,
      })),
      jtaHistory,
      tasks: tasksByCert,
      bank, guardrails,
      coverage: { summary: covSummary ?? [], testedNotTaught: covTnT ?? [], taughtNotTested: covTaught ?? [] },
      telemetry: tele, credentials, audit: audit ?? [],
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
