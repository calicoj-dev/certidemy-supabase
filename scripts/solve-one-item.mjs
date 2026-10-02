#!/usr/bin/env node
/**
 * Run the BLIND solver twice over one stored bank row. READ-ONLY (two model calls, no write).
 * `--cert <CODE> --id <uuid-prefix>`. Unknown flags exit 2.
 * Run two shuffles the options, seeded by the id, so a verdict resting on order cannot survive both.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { gateItemOf, id8, storedItemControls } from "./lib/stored-item.mjs";
import { blindPayload, assertBlind, solverUser, solverVerdict, SOLVER_SYSTEM, blindSolverControls } from "./lib/blind-solver.mjs";

let CERT = null, ID = null;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--cert") { CERT = argv[++i]; continue; }
  if (argv[i] === "--id") { ID = argv[++i]; continue; }
  const m = argv[i].match(/^--(cert|id)=(.+)$/);
  if (m) { if (m[1] === "cert") CERT = m[2]; else ID = m[2]; continue; }
  console.error("Unrecognised flag: " + argv[i] + ". Known: --cert <CODE> --id <uuid-prefix>.");
  process.exit(2);
}
if (!CERT || !ID) { console.error("--cert and --id are both required."); process.exit(2); }

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODEL = process.env.GROUNDED_MODEL || "claude-opus-5";
const AK = process.env.ANTHROPIC_API_KEY ||
  (readFileSync(join(HERE, ".env"), "utf8").match(/^ANTHROPIC_API_KEY=(.+)$/m) || [])[1];
if (!AK) { console.error("ANTHROPIC_API_KEY not found in env or scripts/.env"); process.exit(2); }

for (const [label, c] of [["adapter", storedItemControls()], ["solver", blindSolverControls()]]) {
  if (c.fails.length) { console.error("REFUSING: " + label + " controls fail: " + JSON.stringify(c.fails).slice(0, 300)); process.exit(2); }
  console.log(label + " controls: " + c.examined + " cases, all pass");
}

async function claude(system, user, maxTokens = 1500) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": AK, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
      });
      if (!res.ok) throw new Error("Anthropic " + res.status + ": " + (await res.text()).slice(0, 300));
      const d = await res.json();
      return { text: (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n"), usage: d.usage };
    } catch (e) { if (attempt >= 3) throw e; await new Promise((r) => setTimeout(r, 800 * attempt)); }
  }
}
const parseObject = (t) => {
  const s = String(t || ""); const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b < a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
};

const KEY = requireKey(HERE);
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
const qs = await getAll(KEY, "quiz_questions?select=id,question_text,options,correct_answer,explanation,task_id" +
  "&certification_id=eq." + cert.id + "&language=eq.en&retired_at=is.null&order=id");
const hits = qs.filter((q) => q.id.startsWith(ID));
if (hits.length !== 1) { console.error(ID + " resolves to " + hits.length + " rows"); process.exit(2); }
const row = hits[0];
const g = (await getAll(KEY, "item_grounding?select=question_id,key_support,key_support_clause&order=question_id"))
  .find((x) => x.question_id === row.id);
if (!g) { console.error("no item_grounding row for " + ID); process.exit(2); }

/* The solver sees the task's PRIMARY passages, the same set the generator gives it. */
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const tsRows = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id");
const pById = new Map((await getAll(KEY, "source_passages?select=id,clause&order=id")).map((r) => [r.id, r.clause]));
const wantClauses = new Set(tsRows.filter((r) => r.task_id === row.task_id && r.role === "primary")
  .map((r) => pById.get(r.passage_id)).filter(Boolean));
wantClauses.add(g.key_support_clause);
const ps = lib.passages.filter((p) => p.source_id === g.source_id || true)
  .filter((p) => wantClauses.has(p.clause));
if (!ps.length) { console.error("UNASSERTED: no passages resolved for this task; the solver would be guessing."); process.exit(2); }
console.log("passages given to the solver: " + ps.map((p) => p.clause).join(", "));

const item = gateItemOf({ ...row, key_support: g.key_support, key_support_clause: g.key_support_clause });
const ki = item.options.findIndex((o) => o.is_correct);
const keyLabel = String.fromCharCode(65 + ki);
const payload = blindPayload(item);
assertBlind(payload, item);

const v1 = solverVerdict(parseObject((await claude(SOLVER_SYSTEM, solverUser(payload, ps))).text), keyLabel);

/* RUN TWO: shuffled, seeded by the id so a split is repeatable. */
let seed = parseInt(row.id.replace(/-/g, "").slice(0, 8), 16) || 1;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const opts = payload.options.slice();
for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = opts[i]; opts[i] = opts[j]; opts[j] = t; }
const keyText = (payload.options.find((o) => o.label === keyLabel) || {}).text;
const p2 = { ...payload, options: opts.map((o, i) => ({ label: String.fromCharCode(65 + i), text: o.text })) };
const keyLabel2 = (p2.options.find((o) => o.text === keyText) || {}).label || keyLabel;
assertBlind(p2, item);
const v2 = solverVerdict(parseObject((await claude(SOLVER_SYSTEM, solverUser(p2, ps))).text), keyLabel2);

console.log("");
console.log(id8(row) + "  key was " + keyLabel + " (run 2: " + keyLabel2 + ")");
console.log("  run 1  " + v1.state + "   " + String(v1.reason || "").slice(0, 200));
console.log("  run 2  " + v2.state + "   " + String(v2.reason || "").slice(0, 200));
const agree = v1.state === v2.state;
console.log("");
console.log(agree ? "BOTH RUNS AGREE: " + v1.state
  : "SOLVER SPLIT -- run 1 " + v1.state + ", run 2 " + v2.state + ". A split is not a pass.");
if (!agree || v1.state !== "accepted") process.exitCode = 1;
