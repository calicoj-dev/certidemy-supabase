#!/usr/bin/env node
/**
 * check-drift-scope-flags.mjs -- controls for retranslate-modal-drift's SCOPE REFUSAL (PROMPT-128 s3).
 *
 * READ-ONLY, and it makes NO model call: every case is run with `--max-usd=0.0001` so the script
 * reaches its scope decision and stops long before it would pay for anything. What is asserted is
 * the EXIT CODE and the scope line, which is where the defect lived.
 *
 * The defect: `--cert X` alone meant the whole certification, and PROMPT-127 repaired 88 fields on
 * live approved authored rows that nobody had asked for. A control per flag, plus the refusal.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, "retranslate-modal-drift.mjs");
/* `process.execPath` is quoted by spawnSync without a shell, which is why shell:true is never used
 * here -- it re-parses the path and dies on `C:\Program Files` (CLAUDE.md s17). */
const run = (args) => {
  const r = spawnSync(process.execPath, ["--dns-result-order=ipv4first", SCRIPT, ...args],
    { encoding: "utf8", cwd: join(HERE, "..") });
  return { code: r.status, out: String(r.stdout || "") + String(r.stderr || "") };
};

const cases = [];
const ok = (what, pass, detail = "") => cases.push({ what, pass, detail });

/* ---- THE REFUSAL: no scope at all ---- */
{
  const r = run(["--cert=ISMS-IA", "--max-usd=0.0001"]);
  ok("no scope flag at all is REFUSED", r.code === 2, "exit " + r.code);
  ok("...and the refusal names all four scopes",
    /--only-new/.test(r.out) && /--kept/.test(r.out) && /--ids=/.test(r.out) && /--all-cert/.test(r.out));
  ok("...and it says the script edits served text",
    /EDITS SERVED TEXT/.test(r.out));
  ok("...and it names the incident rather than just the rule",
    /PROMPT-127 ran this without a scope/.test(r.out));
}
/* ---- EACH FLAG IS ACCEPTED, and names itself in the scope line ---- */
{
  const r = run(["--cert=ISMS-IA", "--max-usd=0.0001", "--only-new"]);
  ok("--only-new is accepted and names its scope", /SCOPE: --only-new/.test(r.out), "exit " + r.code);
}
{
  const r = run(["--cert=ISMS-IA", "--max-usd=0.0001", "--kept"]);
  /* ISMS-IA has a keep list (11 ids), so this resolves rather than refusing */
  ok("--kept is accepted and names its scope", /SCOPE: --kept/.test(r.out), "exit " + r.code);
}
{
  const r = run(["--cert=ISMS-IA", "--max-usd=0.0001", "--ids=eda3a540"]);
  ok("--ids is accepted and names its scope", /SCOPE: --ids/.test(r.out), "exit " + r.code);
}
{
  const r = run(["--cert=ISMS-IA", "--max-usd=0.0001", "--all-cert"]);
  ok("--all-cert is accepted and names itself as the WHOLE certification",
    /SCOPE: --all-cert/.test(r.out) && /WHOLE CERTIFICATION/.test(r.out), "exit " + r.code);
}
/* ---- TWO SCOPES AT ONCE IS A REFUSAL, not a silent precedence ---- */
{
  const r = run(["--cert=ISMS-IA", "--max-usd=0.0001", "--only-new", "--all-cert"]);
  ok("two scope flags together are REFUSED", r.code === 2, "exit " + r.code);
  ok("...and the refusal names both", /--only-new and --all-cert/.test(r.out));
}
/* ---- AN ID THAT RESOLVES TO NOTHING IS A SURPRISE, not an empty run ---- */
{
  const r = run(["--cert=ISMS-IA", "--max-usd=0.0001", "--ids=00000000"]);
  ok("an --ids id that resolves to no live row is REFUSED", r.code === 2, "exit " + r.code);
}
/* ---- and the NEGATIVE half of the whole thing: --cert is still required ---- */
{
  const r = run(["--max-usd=0.0001", "--only-new"]);
  ok("--cert is still required", r.code === 2, "exit " + r.code);
}

let bad = 0;
console.log("DRIFT-REPAIR SCOPE FLAGS -- controls (no model call: every case stops at the scope decision)");
console.log("");
for (const c of cases) {
  console.log("  " + (c.pass ? "pass " : "FAIL ") + c.what + (c.pass ? "" : "   [" + c.detail + "]"));
  if (!c.pass) bad++;
}
console.log("");
console.log("  " + cases.length + " case(s), " + (bad ? bad + " FAIL" : "all pass"));
process.exitCode = bad ? 2 : 0;
