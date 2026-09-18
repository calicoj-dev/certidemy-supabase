#!/usr/bin/env node
/**
 * check-prompt-parity.mjs - do the two generators emit the SAME prompt?
 *
 * READ-ONLY. Flags: --runtime, --verbose. Unknown flags exit 2. No writes.
 *
 * ============ WHY THIS IS THE CHECK THAT MATTERS ============
 *
 * Moving four files into functions/_shared/ makes them SHARED FILES. It does not
 * make them a SINGLE SOURCE. The difference is observable in exactly one way:
 * two implementations, given the same inputs, produce the same string. Anything
 * short of that is a folder layout.
 *
 * Three copies of the item rules existed before this:
 *
 *   scripts/gen-cert-secure.mjs      -> item-pipeline + profile + grounding + task-context
 *   scripts/backfill-practice.mjs    -> the same four, identical imports
 *   functions/generate-practice-questions -> NONE of them, its own inline prompt
 *
 * The third hardcoded the Level I difficulty curve ("aim ~40% level 2, ~40%
 * level 3, ~20% level 4") for EVERY certification, and Scrum proper nouns for
 * every subject, with no grounding, no task block, no cognitive-level directive
 * and no Level II contract. A tier-2 ISO auditing certification was being
 * generated against Scrum-flavoured Level I instructions.
 *
 * ============ AND IT IS THE POSITIVE CONTROL FOR THE MOVE ============
 *
 * CLAUDE.md: a green result carries no information unless something proves the
 * check ran, and an instrument that has never failed is an untested instrument.
 * So this was written BEFORE the consolidation and watched to fail against the
 * three copies. Stage A fails on today's source; stage C refuses to run at all.
 *
 * It is also the only thing that can show the DEPLOYED function reaches the
 * shared module AT RUNTIME. A source import proves the bundler was asked; only
 * a live response proves it answered.
 *
 * ============ WHY STAGE C IS GATED BEHIND STAGE A ============
 *
 * `generate-practice-questions` has no field allowlist -- it casts the body to
 * its interface and ignores what it does not know. So posting `dry_run: true`
 * to a deployment that does not support it does not error: IT GENERATES AND
 * WRITES PRACTICE ITEMS. A check must not be able to write, so stage C runs
 * only once stage A has confirmed from source that dry-run support is deployed,
 * and SKIPS LOUDLY otherwise rather than trying and hoping.
 *
 * That gate is the same rule as "never propose a destructive statement as a way
 * to verify a hypothesis" -- here the verification and the write are one call.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
/* DYNAMIC, so a missing single source is a REPORTED FAILURE rather than an
 * import-time crash. Before the consolidation this module resolves nothing,
 * and "the check exploded" is a worse signal than "there is no one source" --
 * a crash reads as a broken instrument, which is what gets an instrument
 * disabled rather than acted on. */
let assemble = null, MATRIX = [], matrixErr = null;
try {
  const m = await import("./lib/prompt-matrix.mjs");
  assemble = m.assemble; MATRIX = m.MATRIX;
} catch (e) { matrixErr = String(e.message || e).slice(0, 300); }

const KNOWN = new Set(["--runtime", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY. Known: " + [...KNOWN].join(", "));
    process.exit(2);
  }
}
const RUNTIME = process.argv.includes("--runtime");
const VERBOSE = process.argv.includes("--verbose");

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const md5 = (s) => createHash("md5").update(s, "utf8").digest("hex").slice(0, 12);

/* .env, for stage C only. Stages 0, A and B need no credential at all, which
 * is why they run anywhere and why they are the ones in the commit message. */
for (const f of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

let pass = 0;
const fails = [];
const skips = [];
function record(name, ok, detail) {
  if (ok) { pass++; console.log("  PASS  " + name); }
  else { fails.push(name + " -- " + detail); console.log("  FAIL  " + name); console.log("        " + detail); }
}
function skip(name, why) {
  skips.push(name + " -- " + why);
  console.log("  SKIP  " + name);
  console.log("        " + why);
}

console.log("");
console.log("PROMPT PARITY -- one source, or three files in one folder?");
console.log("");

/* ===================================================================== 0
 * CONTROL. The comparator must be able to fail, and must be able to pass.
 * Without this, every green below is consistent with comparing nothing --
 * the empty-regex failure this repo has paid for repeatedly.
 */
console.log("0. CONTROL -- can the comparison fail at all?");
if (!assemble) {
  record("the single rule source is importable", false,
    "scripts/lib/prompt-matrix.mjs could not load: " + matrixErr);
} else {
  const a = assemble();
  const keys = Object.keys(a);
  const sameSame = JSON.stringify(a) === JSON.stringify(assemble());
  record("identical inputs compare EQUAL", sameSame,
    "assemble() is not deterministic; nothing below can mean anything");

  /* Two rows that differ only in tier must differ in prompt. If they do not,
   * the tier is not reaching the prompt and a parity pass would be vacuous. */
  const l1 = a["Scrum Master I - AI | tier 1 | practice"];
  const l2 = a["Scrum Master II - AI | tier 2 | practice"];
  record("tier 1 and tier 2 prompts DIFFER", Boolean(l1 && l2 && l1.system !== l2.system),
    "the tier does not change the assembled prompt, so parity would prove nothing");
  record("secure and practice prompts DIFFER",
    Boolean(a["AI Essentials I | tier 1 | secure"] && a["AI Essentials I | tier 1 | practice"] &&
      a["AI Essentials I | tier 1 | secure"].system !== a["AI Essentials I | tier 1 | practice"].system),
    "kind does not change the prompt");
  record("every matrix row resolves a DISTINCT profile+grounding pair",
    new Set(keys.map((k) => a[k].profile + "|" + a[k].grounding_len)).size >= 4,
    "the matrix exercises fewer than 4 routing branches; add rows");
  if (VERBOSE) for (const k of keys) console.log("        " + md5(a[k].system) + "  " + a[k].profile + "  " + k);
}

/* ===================================================================== A
 * SOURCE. Does the edge function even ASK for the shared rules? A source
 * check, and it says so: it proves the import was written, never that the
 * bundler shipped it or that the code path runs.
 */
console.log("");
console.log("A. SOURCE -- does the edge function import the shared rules?");
const FN = join(ROOT, "functions", "generate-practice-questions", "index.ts");
let stageA = false;
{
  const src = existsSync(FN) ? readFileSync(FN, "utf8") : "";
  record("the function file exists", src.length > 0, FN + " not found");

  const importsRules = /_shared\/item-rules\//.test(src);
  record("imports from _shared/item-rules/", importsRules,
    "no import of the shared rule modules -- this function still carries its own prompt");

  const usesDraftSystem = /draftSystem\s*\(/.test(src);
  record("calls draftSystem()", usesDraftSystem,
    "the shared assembler is not called, so any import is decoration");

  /* THE NEGATIVE HALF, and it is the one that catches a half-done migration:
   * importing the shared module while KEEPING the old hardcoded curve leaves
   * two rules in one file and the old one may still win. */
  const ownCurve = /~40% level 2|aim ~40%|40% level 3, ~20% level 4/.test(src);
  record("no hardcoded difficulty curve remains", !ownCurve,
    "the inline Level I difficulty curve is still in this file");

  const ownSchemaPrompt = /You are a certification exam question writer/.test(src);
  record("no inline system prompt remains", !ownSchemaPrompt,
    "the inline `You are a certification exam question writer` prompt is still here");

  const hasDryRun = /dry_run/.test(src);
  record("declares dry_run support", hasDryRun,
    "no dry_run in the source; stage C cannot be attempted without risking a write");

  stageA = importsRules && usesDraftSystem && !ownCurve && !ownSchemaPrompt && hasDryRun;
}

/* ===================================================================== B
 * CROSS-RUNTIME. The same module, the same inputs, two runtimes.
 */
console.log("");
console.log("B. CROSS-RUNTIME -- Node and Deno, same module, same bytes?");
if (!assemble) {
  skip("cross-runtime parity", "there is no single rule source to run under two runtimes");
} else {
  const nodeOut = JSON.stringify(assemble());
  let denoOut = null, denoErr = null;
  try {
    denoOut = execFileSync("deno", ["run", "--allow-env", "--allow-read", "--node-modules-dir=auto",
      join(HERE, "lib", "prompt-matrix.mjs")], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim();
  } catch (e) { denoErr = String(e.stderr || e.message).slice(0, 400); }

  if (denoErr) {
    record("Deno can execute the rule modules", false, denoErr);
  } else {
    record("Deno can execute the rule modules", true, "");
    const same = nodeOut === denoOut;
    record("Node and Deno produce BYTE-IDENTICAL prompts", same,
      same ? "" : "node " + md5(nodeOut) + " vs deno " + md5(denoOut) +
        " -- the rule modules behave differently under the two runtimes");
    if (!same) {
      const n = JSON.parse(nodeOut), d = JSON.parse(denoOut);
      for (const k of Object.keys(n)) {
        if (JSON.stringify(n[k]) !== JSON.stringify(d[k])) console.log("        differs: " + k);
      }
    }
  }
}

/* ===================================================================== C
 * RUNTIME. The deployed function's own prompt, against Node's.
 */
console.log("");
console.log("C. RUNTIME -- does the DEPLOYED function emit the shared prompt?");
if (!RUNTIME) {
  skip("deployed prompt parity", "--runtime not given (it calls the live function with dry_run)");
} else if (!stageA || !assemble) {
  skip("deployed prompt parity",
    "stage A did not pass. The deployed function has no field allowlist, so posting " +
    "dry_run to a build that does not support it would GENERATE AND WRITE practice " +
    "items. Refusing to attempt it: the verification and the damage would be one call.");
} else {
  const { getAccessToken, callFunction, anonMissing } = await import("./lib/fn-auth.mjs");
  /* getAccessToken returns { token } or { error } -- NOT a string. Passing the
   * object through produced `Bearer [object Object]` and a 401 that read as a
   * deployment fault. The 401 was the safe outcome: the function refused before
   * generating, so nothing was written, which is the only reason a caller bug
   * here was cheap. */
  const missing = anonMissing();
  record("an anon key is available for sign-in", !missing, String(missing));
  const auth = await getAccessToken();
  record("a user token was obtained", Boolean(auth && auth.token),
    String((auth && auth.error) || "no token and no error").slice(0, 120));
  const token = auth && auth.token;
  const row = MATRIX.find((r) => r.certName.includes("42001")) ?? MATRIX[0];
  if (!token) { skip("deployed prompt parity", "no user token; cannot call the function"); }
  else {

  /* Resolve the real ids the function needs, so both sides describe the SAME
   * (certification, task) rather than the same shape. */
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const H = { apikey: KEY, Authorization: "Bearer " + KEY };
  const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
  const certsRes = await fetch(REST + "/certifications?select=id,code,name,tier", { headers: H });
  const certs = certsRes.ok ? await certsRes.json() : null;
  record("certifications are readable", Array.isArray(certs),
    "HTTP " + certsRes.status + " -- is SUPABASE_SERVICE_ROLE_KEY set? " +
    JSON.stringify(certs).slice(0, 160));
  const cert = Array.isArray(certs) ? certs.find((c) => c.name === row.certName) : null;
  record("the matrix certification exists in the database", Boolean(cert),
    "no certification named " + row.certName);

  if (cert) {
    const tasks = await (await fetch(REST +
      "/tasks?select=id,code,statement,bloom_level,criticality,knowledge,skills,abilities&certification_id=eq." +
      cert.id + "&order=code&limit=1", { headers: H })).json();
    const task = tasks[0];
    const r = await callFunction("generate-practice-questions",
      { certification_id: cert.id, dry_run: true, num_questions: 1 }, token, { retry: 8 });
    /* callFunction returns the ENVELOPE { status, ok, json }. The payload is one
     * level down, and reading r.dry_run instead of r.json.dry_run reported a
     * working deployment as a parity failure -- the same wrong-level read as
     * taking rows[0] off a 400 body earlier in this session. */
    const d = (r && r.json) || {};
    if (VERBOSE) console.log("        deployed reported task " + (r && r.task_code) +
      ", tier " + (r && r.tier) + ", rules " + (r && r.rules && r.rules.length) + " chars");

    /* THE RESPONSE MUST PROVE IT WAS A DRY RUN. A build that ignored the flag
     * answers with generated items, and treating that as a parity failure
     * would bury the fact that it just wrote rows. */
    const honoured = r && r.ok && d.dry_run === true && typeof d.rules === "string" &&
      typeof d.system === "string" && d.wrote_nothing === true;
    record("the deployed function HONOURED dry_run", Boolean(honoured),
      "response carries no dry_run:true + rules + system + wrote_nothing. If items " +
      "were written, retire them: " + JSON.stringify(r).slice(0, 200));

    if (honoured) {
      const { draftSystem } = await import("../functions/_shared/item-rules/item-pipeline.mjs");
      /* ASSEMBLE AGAINST THE TASK THE DEPLOYMENT REPORTS, not the one this
       * script picked. The function chooses its own task from the concept
       * links, so requiring them to match tested the wrong thing -- and it
       * FAILED while the rules compared equal, which is what exposed the real
       * finding: draftSystem depends on (kind, certName, tier, bloom_level) and
       * NOT on the statement, so two different tasks at the same Bloom level
       * legitimately produce identical rules.
       *
       * That is also why the prompt assertion below exists. If parity were
       * measured on the rules alone, the task statement and KSA could be absent
       * from the model's input entirely and every check here would still pass --
       * which was the state of the deployed function until this was written. */
      const deployedTask = d.task_id
        ? (await (await fetch(REST + "/tasks?select=id,code,statement,bloom_level," +
            "criticality,knowledge,skills,abilities&id=eq." + d.task_id, { headers: H })).json())[0]
        : task;
      record("the deployment's own task is readable", Boolean(deployedTask),
        "task_id " + d.task_id + " did not resolve");
      /* Compare the RULES, and the task the DEPLOYMENT says it used -- not the
       * one this script guessed. The function picks its own task from the
       * concept links, so comparing against a locally chosen task would compare
       * two different questions and call the difference a parity failure. */
      const mine = draftSystem("practice", d.cert_name ?? cert.name, deployedTask, Number(d.tier ?? cert.tier ?? 1) || 1);
      const same = mine === d.rules;
      record("deployed RULES are BYTE-IDENTICAL to the shared assembly", same,
        same ? "" : "deployed " + md5(d.rules) + " (" + d.rules.length + " chars) vs shared " +
          md5(mine) + " (" + mine.length + " chars)");

      /* THE NEGATIVE HALF. Sharing the rules is worth nothing if the function
       * then appends a second rulebook after them. So the only permitted
       * difference between `rules` and `system` is the language appendix, and
       * it must contain no item rule -- no difficulty curve, no option count. */
      const appendix = d.system.slice(d.rules.length);
      record("system is rules + an appendix, with nothing interleaved",
        d.system.startsWith(d.rules),
        "the deployed system prompt does not begin with the shared rules");
      record("the appendix is small and carries NO item rule",
        appendix.length < 600 && !/level 2|level 3|options|difficulty [1-5]/i.test(appendix),
        "appendix is " + appendix.length + " chars and looks like it restates item rules: " +
        JSON.stringify(appendix.slice(0, 200)));
      record("the deployed rules are not trivially short", d.rules.length > 5000,
        "only " + d.rules.length + " chars -- the grounding block is probably missing");

      /* THE JTA MUST ACTUALLY REACH THE MODEL. The rules are task-independent
       * except through bloom_level, so this is the only assertion that can tell
       * "the task was considered" from "a task object was passed to a function
       * that ignores most of it". */
      const { taskBlock } = await import("../functions/_shared/item-rules/item-task-context.mjs");
      const expectBlock = deployedTask ? taskBlock(deployedTask) : "";
      record("the user prompt carries the shared taskBlock",
        Boolean(expectBlock) && typeof d.prompt === "string" && d.prompt.includes(expectBlock),
        "the deployed prompt does not contain taskBlock(task) for task " + d.task_code);
      record("the user prompt names the task STATEMENT",
        Boolean(deployedTask && deployedTask.statement) && typeof d.prompt === "string" &&
          d.prompt.includes(deployedTask.statement),
        "the task statement is absent from the prompt, so the model is not told what it is measuring");
      if (!same && VERBOSE) {
        for (let i = 0; i < Math.min(mine.length, d.rules.length); i++) {
          if (mine[i] !== d.rules[i]) {
            console.log("        first difference at char " + i);
            console.log("        shared:   ..." + JSON.stringify(mine.slice(Math.max(0, i - 60), i + 60)));
            console.log("        deployed: ..." + JSON.stringify(d.rules.slice(Math.max(0, i - 60), i + 60)));
            break;
          }
        }
      }
    }
  }
}

  }

console.log("");
console.log("passed: " + pass + "   failed: " + fails.length + "   skipped: " + skips.length);
for (const f of fails) console.log("  X " + f);
for (const s of skips) console.log("  - " + s);
console.log("");
console.log(fails.length === 0 && skips.length === 0
  ? "ONE SOURCE: both implementations emit the same prompt."
  : "NOT one source yet.");
process.exitCode = fails.length === 0 ? 0 : 1;
