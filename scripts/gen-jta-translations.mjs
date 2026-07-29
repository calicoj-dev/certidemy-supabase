/**
 * gen-jta-translations.mjs — translate a cert's JTA into es-419 + pt-BR.
 *
 * Fills the sibling translation tables (domain_translations / task_translations,
 * migration 061) with the only rendered JTA fields: domain title + description
 * and task statement. English stays in the base tables and is NEVER written here.
 *
 * CERT-AGNOSTIC: pass CERT_ID; the script reads that cert's domains/tasks and
 * fills what's missing. The SAME script does SM-AI-I, SPO-AI-I, SD-AI-I, and
 * every future cert — only the content differs, never the machinery.
 *
 * IDEMPOTENT: reads existing translations first, only fills the gaps per
 * language. FORCE=1 re-translates + overwrites. DRY_RUN=1 prints, writes nothing.
 *
 * HONESTY: every row is written is_provisional=true — provisional machine
 * translation until a human/SME review flips it. Scrum proper nouns stay in
 * English, matching the question generators.
 *
 * ---------------------------------------------------------------------------
 * ONLY — SCOPE THE RUN (added when migration 162 rewrote the English domain
 * descriptions and nothing else)
 *
 * FORCE is global to a run: it re-translates domains AND tasks. When only one
 * of the two has changed upstream, that is not a convenience, it is data loss —
 * a forced run would have replaced 302 reviewed task statements with fresh
 * machine output because five domain descriptions were edited.
 *
 *   ONLY=domains   domains only, tasks untouched
 *   ONLY=tasks     tasks only, domains untouched
 *   ONLY=all       both (default, previous behaviour)
 *
 * TITLE PRESERVATION. With FORCE on domains, an existing translated title is
 * REUSED rather than re-translated. Domain titles did not change in 162, and
 * re-translating an unchanged string spends money to introduce drift into copy
 * a human already reviewed. Set RETRANSLATE_TITLES=1 to override.
 *
 * WHAT A RUN DOES TO LIVE DOCUMENTS. render-asset filters translations on
 * is_provisional = false, and the flag is row-level. A provisional domain row
 * therefore drops out COMPLETELY — the sheet falls back to the English title as
 * well as the English description. Between this run and the review that flips
 * the flag, Spanish and Portuguese blueprint and JTA sheets render their domain
 * sections in English. That is the pipeline working correctly; it is not a
 * reason to write is_provisional=false, which would put unreviewed machine
 * translation in front of a buyer.
 *
 * CACHING. Neither PDF's cache key currently includes a domain stamp, so
 * flipping the flag back to reviewed will NOT by itself refresh an
 * already-generated sheet. Fix that in render-asset before the flip.
 * ---------------------------------------------------------------------------
 *
 * Setup (once): supabase\scripts\.env with:
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *   ANTHROPIC_API_KEY=sk-ant-...
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:ONLY="domains"; $env:FORCE="1"; $env:DRY_RUN="1"; node scripts\gen-jta-translations.mjs
 *   Remove-Item Env:\DRY_RUN; node scripts\gen-jta-translations.mjs
 *
 * Knobs: CERT_ID (default SM-AI-I), ONLY, CHUNK (25 statements/call), DRY_RUN,
 * FORCE, RETRANSLATE_TITLES. Needs @supabase/supabase-js and Node 18+.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// ---------------------------------------------------------------------------
// Local .env (KEY=VALUE per line) next to this script; real process env wins.
// ---------------------------------------------------------------------------
function loadDotEnv() {
  const here = dirname(fileURLToPath(import.meta.url));
  const path = resolve(here, ".env");
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined || process.env[key] === "") process.env[key] = val;
  }
}
loadDotEnv();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co";
const SERVICE_KEY = need("SUPABASE_SERVICE_ROLE_KEY");
const ANTHROPIC_API_KEY = need("ANTHROPIC_API_KEY");
const CERT_ID = process.env.CERT_ID || "11111111-1111-1111-1111-111111111111"; // SM-AI-I
const CHUNK = int(process.env.CHUNK, 25);
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());
const FORCE = ["1", "true", "yes"].includes((process.env.FORCE || "").toLowerCase());
const RETRANSLATE_TITLES = ["1", "true", "yes"].includes(
  (process.env.RETRANSLATE_TITLES || "").toLowerCase()
);

const ONLY = (process.env.ONLY || "all").toLowerCase();
if (!["all", "domains", "tasks"].includes(ONLY)) {
  console.error(`ONLY must be one of: all | domains | tasks (got "${ONLY}")`);
  process.exit(1);
}
const DO_DOMAINS = ONLY === "all" || ONLY === "domains";
const DO_TASKS = ONLY === "all" || ONLY === "tasks";

const MODEL = "claude-sonnet-4-6";
const LANGS = [
  { code: "es-419", name: "Latin American Spanish" },
  { code: "pt-BR", name: "Brazilian Portuguese" },
];
const SCRUM_NOUNS = [
  "Sprint", "Scrum Master", "Product Owner", "Daily Scrum", "Definition of Done",
  "Sprint Backlog", "Sprint Goal", "Product Backlog", "Product Goal", "Increment",
  "Sprint Review", "Sprint Retrospective", "Sprint Planning", "INVEST", "Scrum Guide",
];

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function need(k) {
  const v = process.env[k];
  if (!v || !v.trim()) {
    console.error(`Missing required env var: ${k}`);
    process.exit(1);
  }
  return v.trim();
}
function int(v, d) {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : d;
}
function chunk(a, n) {
  const out = [];
  for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n));
  return out;
}

// ---------------------------------------------------------------------------
// Claude
// ---------------------------------------------------------------------------
async function rawClaude(system, user, maxTokens) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature: 0.2, // faithful translation, not creative
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${body.slice(0, 500)}`);
  }
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

async function callClaude({ system, user, maxTokens = 8000 }) {
  const text = await rawClaude(system, user, maxTokens);
  try {
    return parseJsonArray(text);
  } catch {
    const repaired = await rawClaude(
      system,
      user +
        "\n\nIMPORTANT: your previous response was not valid JSON. Return ONLY the " +
        "corrected, strictly valid JSON now — no prose, no markdown fences, no trailing commas.",
      maxTokens
    );
    return parseJsonArray(repaired);
  }
}

function parseJsonArray(text) {
  let t = (text || "").trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (!t.startsWith("[")) {
    const a = t.indexOf("[");
    const b = t.lastIndexOf("]");
    if (a !== -1 && b !== -1 && b > a) t = t.slice(a, b + 1);
  }
  return JSON.parse(t);
}

// ---------------------------------------------------------------------------
// Translation: [{id, text}] -> Map(id -> translated text)
// ---------------------------------------------------------------------------
function translateSystem(langName) {
  return `You translate ISO/IEC 17024 certification BLUEPRINT text — job-task-analysis domain titles/descriptions and task statements — from English to ${langName}.
Return a JSON array of the SAME length and order as the input. Each item: {"id":string,"text":string}.
Rules:
  - Translate ONLY "text" into ${langName}. Keep "id" EXACTLY as given.
  - Keep these Scrum proper nouns in English, untranslated: ${SCRUM_NOUNS.join(", ")}.
  - For legislation, render 'statute'/'statutes' as leyes/normas (es) or leis/normas (pt), NEVER estatutos, which reads as corporate bylaws in Latin America and Brazil.
  - Scaling a framework is escalonamento (pt-BR) or escalado (es-419), NEVER escalabilidade/escalabilidad, which mean scalability as a system property.
  - These are formal competency statements, not marketing copy: preserve meaning precisely, keep it concise and professional, no added flourish.
  - Do NOT add, drop, merge, or reorder items.
  - Output strict JSON only — NO prose, NO markdown fences.`;
}

function translateUser(items) {
  return `Translate these ${items.length} strings:\n\n${JSON.stringify(items, null, 2)}\n\nReturn the JSON array now.`;
}

async function translateBatch(langName, items) {
  if (items.length === 0) return new Map();
  const raw = await callClaude({ system: translateSystem(langName), user: translateUser(items) });
  const arr = Array.isArray(raw) ? raw : [];
  const out = new Map();
  for (const o of arr) {
    if (o && typeof o.id === "string" && typeof o.text === "string" && o.text.trim()) {
      out.set(o.id, o.text.trim());
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
async function gather() {
  const { data: certRow, error: ne } = await supabase
    .from("certifications").select("code, name").eq("id", CERT_ID).maybeSingle();
  if (ne) throw new Error(`certifications: ${ne.message}`);
  if (!certRow) throw new Error(`no certification with id ${CERT_ID}`);

  const { data: domains, error: de } = await supabase
    .from("domains").select("id, code, title, description")
    .eq("certification_id", CERT_ID).order("order_index", { ascending: true });
  if (de) throw new Error(`domains: ${de.message}`);

  const { data: tasks, error: te } = await supabase
    .from("tasks").select("id, statement")
    .eq("certification_id", CERT_ID).order("order_index", { ascending: true });
  if (te) throw new Error(`tasks: ${te.message}`);

  const domainIds = (domains || []).map((d) => d.id);
  const taskIds = (tasks || []).map((t) => t.id);

  // `title` is selected so an existing reviewed translation can be REUSED
  // rather than re-translated when only the description changed upstream.
  const { data: dtr } = domainIds.length
    ? await supabase.from("domain_translations")
        .select("domain_id, language, title").in("domain_id", domainIds)
    : { data: [] };
  const { data: ttr } = taskIds.length
    ? await supabase.from("task_translations")
        .select("task_id, language").in("task_id", taskIds)
    : { data: [] };

  const domTitles = new Map();
  for (const r of dtr || []) domTitles.set(`${r.domain_id}|${r.language}`, r.title);

  return {
    certRow,
    domains: domains || [],
    tasks: tasks || [],
    haveDom: new Set((dtr || []).map((r) => `${r.domain_id}|${r.language}`)),
    haveTask: new Set((ttr || []).map((r) => `${r.task_id}|${r.language}`)),
    domTitles,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(
    `JTA translations: cert=${CERT_ID} scope=${ONLY} ` +
    `${DRY_RUN ? "[DRY RUN]" : "[LIVE]"}${FORCE ? " [FORCE]" : ""}`
  );
  const { certRow, domains, tasks, haveDom, haveTask, domTitles } = await gather();
  console.log(`${certRow.code} — ${certRow.name}: ${domains.length} domains, ${tasks.length} tasks\n`);

  const now = () => new Date().toISOString();

  for (const lang of LANGS) {
    console.log(`== ${lang.code} ==`);

    // ---- Domains (title + optional description) ----
    if (!DO_DOMAINS) {
      console.log(`  domains: skipped (ONLY=${ONLY})`);
    } else {
      const domTodo = domains.filter((d) => FORCE || !haveDom.has(`${d.id}|${lang.code}`));
      if (domTodo.length === 0) {
        console.log("  domains: nothing to do");
      } else {
        // Reuse an existing reviewed title unless explicitly told not to.
        const titleTodo = RETRANSLATE_TITLES
          ? domTodo
          : domTodo.filter((d) => !domTitles.get(`${d.id}|${lang.code}`));
        const titleMap = titleTodo.length
          ? await translateBatch(lang.name, titleTodo.map((d) => ({ id: d.id, text: d.title })))
          : new Map();
        if (titleTodo.length < domTodo.length) {
          console.log(`  titles: reusing ${domTodo.length - titleTodo.length} existing translation(s)`);
        }

        const descItems = domTodo
          .filter((d) => d.description && d.description.trim())
          .map((d) => ({ id: d.id, text: d.description }));
        const descMap = descItems.length ? await translateBatch(lang.name, descItems) : new Map();

        const rows = [];
        for (const d of domTodo) {
          const title = titleMap.get(d.id) ?? domTitles.get(`${d.id}|${lang.code}`);
          if (!title) { console.log(`  ! domain ${d.code}: title missing in translation, skipped`); continue; }
          rows.push({
            domain_id: d.id, language: lang.code, title,
            description: descMap.get(d.id) ?? null, is_provisional: true, updated_at: now(),
          });
        }

        if (DRY_RUN) {
          // Every row, not a sample. This output IS the review artifact - pipe
          // it to a file, read it, then run live.
          console.log(`  [dry] ${rows.length} domain rows:`);
          for (const r of rows) {
            const d = domains.find((x) => x.id === r.domain_id);
            console.log(`  --- ${d?.code ?? r.domain_id}`);
            console.log(`      title: ${r.title}`);
            console.log(`      desc : ${r.description ?? "(none)"}`);
          }
        } else if (rows.length) {
          const { error } = await supabase.from("domain_translations")
            .upsert(rows, { onConflict: "domain_id,language" });
          if (error) console.log(`  domain upsert failed: ${error.message}`);
          else console.log(`  domains: wrote ${rows.length} (is_provisional=true)`);
        }
      }
    }

    // ---- Tasks (statement) ----
    if (!DO_TASKS) {
      console.log(`  tasks: skipped (ONLY=${ONLY})`);
    } else {
      const taskTodo = tasks.filter((t) => FORCE || !haveTask.has(`${t.id}|${lang.code}`));
      if (taskTodo.length === 0) {
        console.log("  tasks: nothing to do");
      } else {
        let wrote = 0;
        for (const part of chunk(taskTodo, CHUNK)) {
          const map = await translateBatch(lang.name, part.map((t) => ({ id: t.id, text: t.statement })));
          const rows = [];
          for (const t of part) {
            const statement = map.get(t.id);
            if (!statement) { console.log(`  ! task ${t.id}: statement missing, skipped`); continue; }
            rows.push({ task_id: t.id, language: lang.code, statement, is_provisional: true, updated_at: now() });
          }
          if (DRY_RUN) {
            for (const r of rows) console.log(`  [dry] ${r.statement}`);
            wrote += rows.length;
            continue;
          }
          if (rows.length) {
            const { error } = await supabase.from("task_translations")
              .upsert(rows, { onConflict: "task_id,language" });
            if (error) { console.log(`  task upsert failed: ${error.message}`); break; }
            wrote += rows.length;
          }
        }
        console.log(`  tasks: ${DRY_RUN ? "would write" : "wrote"} ${wrote}`);
      }
    }

    console.log("");
  }

  if (!DRY_RUN && DO_DOMAINS) {
    console.log(
      "Rows are is_provisional=true, so render-asset will OMIT them and the\n" +
      "Spanish/Portuguese sheets fall back to English domain titles and\n" +
      "descriptions until a review flips the flag. That is expected."
    );
  }
  console.log("Done. Re-run to top up; FORCE=1 to overwrite. Review the provisional strings before relying on them.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
