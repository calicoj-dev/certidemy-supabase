#!/usr/bin/env node
/**
 * check-schema-preconditions.mjs -- have the migrations this code REQUIRES run?
 *
 * READ-ONLY. No --apply, no --dry. Unknown flags exit 2.
 *
 * Exit 0 every precondition holds, 1 one is MISSING, 2 one could not be
 * MEASURED. Three states, because "I could not ask" is not "the answer is yes"
 * and it is not "the answer is no" either.
 *
 * ============ WHY THIS SITS IN THE DEPLOY PATH ============
 *
 * `courseware-read` selects `withholding_reason` from `mcp.lesson_index`.
 * Deployed before migration 371 creates that column, every `get_lesson` call
 * answers 400. That is the LOUD half of CLAUDE.md's deploy-order rule, and the
 * rule says to prefer it -- but the rule is about a view change that
 * MULTIPLIES ROWS, where the other order returns wrong answers at HTTP 200.
 * A view that merely GAINS A COLUMN has no silent order: migration first is
 * safe, function first is a total outage. So there is nothing to trade, and
 * "you forgot to run the migration" should be a refusal rather than an outage.
 *
 * ============ ITS LIMIT, STATED HERE AND NOT DISCOVERED LATER ============
 *
 * The reachability gate PARSES the inline SQL, so it cannot be forgotten. This
 * cannot: nothing here reads which COLUMNS the TypeScript selects, so an entry
 * is added by hand in the same commit as the code that needs it. **A missing
 * entry reports clean** -- the shape this repository distrusts most. It is a
 * backstop against forgetting to run a migration, never evidence that the code
 * and the schema agree.
 *
 * ============ WHAT A TELL MUST BE ============
 *
 * A fact ONLY that migration can produce, observable WITHOUT the deploy. Not
 * "the column exists" -- `mcp` is not reachable through PostgREST -- and never
 * a probe of the deployed function, which would make the check circular: the
 * thing being gated cannot be the instrument.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

for (const a of process.argv.slice(2)) {
  if (a.startsWith("--")) {
    console.error("Unrecognised flag: " + a + ". This script is READ-ONLY and takes none.");
    process.exit(2);
  }
}
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is not set -- nothing was measured, which is not a pass.");
  process.exit(2);
}
const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };

async function rpc(name, args) {
  let last;
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(REST + "/rpc/" + name, {
        method: "POST", headers: H, body: JSON.stringify(args),
        signal: AbortSignal.timeout(45000),
      });
      if (!r.ok) return { fail: "HTTP " + r.status };
      return { value: JSON.parse(await r.text()) };
    } catch (e) { last = e; }
  }
  return { fail: String(last).slice(0, 60) };
}

const PRECONDITIONS = [
  {
    migration: 371,
    needs: "mcp.lesson_index.withholding_reason, read by courseware-read's refusal branches",
    /* 371 derives the verdict from the reason and guards the derivation with an
     * existence test, so a nonexistent lesson goes from NULL to FALSE. Nothing
     * else in the schema produces that transition. */
    tell: "lesson_body_is_servable(<nonexistent uuid>) is false, not null",
    probe: async () => {
      const r = await rpc("lesson_body_is_servable",
        { p_lesson_id: "00000000-0000-0000-0000-000000000000" });
      if (r.fail) return { unknown: true, saw: r.fail };
      return { ok: r.value === false, saw: JSON.stringify(r.value) };
    },
  },
];

/* POSITIVE CONTROL. Every probe here reports a migration as MISSING by failing
 * to observe something -- and failing to observe is exactly what a broken probe
 * does. So one synthetic precondition must PASS and one must FAIL, using the
 * same machinery, or this script prints nothing and exits 2.
 *
 * It is built from a fact that cannot change rather than from a live row: the
 * uuid-nil lesson does not exist and never will. */
const CONTROLS = [
  { want: "hold", tell: "control: a bogus rpc arg is answerable at all",
    probe: async () => {
      const r = await rpc("lesson_body_is_servable", { p_lesson_id: "00000000-0000-0000-0000-000000000000" });
      return r.fail ? { unknown: true, saw: r.fail } : { ok: true, saw: JSON.stringify(r.value) };
    } },
  { want: "fail", tell: "control: a function that does not exist must report MISSING",
    probe: async () => {
      const r = await rpc("a_function_that_does_not_exist_371", {});
      return r.fail ? { ok: false, saw: r.fail } : { ok: true, saw: "answered" };
    } },
];

let controlBroken = 0;
for (const c of CONTROLS) {
  let res; try { res = await c.probe(); } catch (e) { res = { unknown: true, saw: String(e).slice(0, 40) }; }
  const held = res.ok === true && !res.unknown;
  if ((c.want === "hold") !== held) {
    console.error("CONTROL FAILED: " + c.tell + " [saw " + res.saw + "]");
    controlBroken++;
  }
}
if (controlBroken) {
  console.error("");
  console.error("The precondition machinery is not working. No verdict is printed, because");
  console.error("a broken checker reports clean.");
  process.exit(2);
}

console.log("  (controls: a reachable rpc answers, an absent one reports missing)");
let missing = 0, unknown = 0;
for (const pc of PRECONDITIONS) {
  let res;
  try { res = await pc.probe(); } catch (e) { res = { unknown: true, saw: String(e).slice(0, 60) }; }
  const mark = res.unknown ? "UNKNOWN" : res.ok ? "ok     " : "MISSING";
  console.log("  " + mark + "  migration " + pc.migration + "  " + pc.tell + "  [saw " + res.saw + "]");
  if (!res.ok || res.unknown) console.log("           needs: " + pc.needs);
  if (res.unknown) unknown++; else if (!res.ok) missing++;
}
if (unknown) process.exitCode = 2;
else if (missing) process.exitCode = 1;
else console.log("  every declared precondition holds (" + PRECONDITIONS.length + " checked)");
