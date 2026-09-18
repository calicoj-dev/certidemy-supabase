/**
 * item-cue-guard.mjs - the ENV OVERRIDE for the shared cue guard. No rules here.
 *
 * ============ WHAT THIS FILE IS, AND WHAT IT DELIBERATELY IS NOT ============
 *
 * The guard itself -- CUE_CFG, CUE_NEUTRALITY_RULES, auditItem, shuffleOptions,
 * remapGroupOrder, keyIsStrictLongest, and the blueprint-resolved cueConfigFor --
 * lives in `functions/_shared/item-rules/item-cue-guard.mjs`, where the edge
 * runtime can read it. This file adds ONE thing: the `LEN_SPREAD_MAX` /
 * `KEY_LEN_MARGIN` / `KEY_LEN_PCT` environment override, which is a local
 * debugging affordance for the generator scripts and not a property of any
 * certification.
 *
 * THIS IS NOT A SECOND COPY OF THE RULES, and the distinction is the point of
 * the whole consolidation. Every threshold, every predicate and every string is
 * imported. If this file ever contains a number, it has become the thing it was
 * written to remove.
 *
 * ============ WHY THE ENV READ HAD TO COME OUT OF THE SHARED MODULE ============
 *
 * It was three `process.env` reads AT MODULE SCOPE, so they fired on IMPORT --
 * breaking a Deno caller that never touched the cue config. Measured 2026-09-18:
 * `deno check` passed on all five rule modules and `deno run` died on that one
 * line. It was the only thing between the rules and the edge runtime.
 *
 * An env-tunable threshold is also something an edge function must NOT have:
 * a partner-facing generator whose item guard loosens because of a deployment
 * variable is a guard nobody can reason about. Scripts get the dial; the
 * deployed path gets the declaration.
 *
 * Existing importers are unchanged: `debias-positions.mjs`, `verify-cert.mjs`,
 * `gen-cert-secure.mjs` and `backfill-practice.mjs` all still import
 * `./lib/item-cue-guard.mjs` and still get env support.
 */
import {
  CUE_CFG,
  cueConfigFor as sharedCueConfigFor,
} from "../../functions/_shared/item-rules/item-cue-guard.mjs";

export {
  CUE_CFG,
  CUE_NEUTRALITY_RULES,
  auditItem,
  shuffleOptions,
  remapGroupOrder,
  keyIsStrictLongest,
} from "../../functions/_shared/item-rules/item-cue-guard.mjs";

function int(v, d) {
  const n = parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : d;
}

/**
 * The blueprint-resolved config, with the env override applied on top.
 *
 * `source` keeps its old shape -- "blueprint", "default", or either with
 * "+env(...)" appended -- because callers print it, and a guard that reports
 * "blueprint" while an env var is silently overriding it would be the
 * source-attribution defect this repo has paid for elsewhere.
 */
export function cueConfigFor(examBlueprint) {
  const base = sharedCueConfigFor(examBlueprint);
  const keys = ["LEN_SPREAD_MAX", "KEY_LEN_MARGIN", "KEY_LEN_PCT"];
  const envSet = keys.filter((k) => process.env[k] !== undefined && process.env[k] !== "");
  for (const k of envSet) base[k] = int(process.env[k], base[k]);
  if (envSet.length) base.source = base.source + "+env(" + envSet.join(",") + ")";
  return base;
}
