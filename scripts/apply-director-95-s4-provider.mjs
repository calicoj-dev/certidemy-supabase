#!/usr/bin/env node
/**
 * apply-director-95-s4-provider.mjs -- add 22989's AI provider to `iso_22989_roles`, as ruled.
 *
 * `--apply` writes `scripts/lib/translation-glossary.json`. DRY BY DEFAULT, printing the entries. Unknown
 * flags exit 2.
 *
 * ============ THE RULING, AND THE OPEN ITEM IT CLOSES ============
 *
 * PROMPT-95 s4: *"For the 22989 role AI provider, pt-BR uses `fornecedor de IA` (the corpus has 65 uses and
 * zero of the alternatives) and es-419 uses `proveedor de IA`. Add these to the `iso_22989_roles` family. The
 * EU AI Act term stays as it is, and it is enforced only in rows about the Regulation, which the lint already
 * scopes."*
 *
 * The family carries an `open_decision` block asking exactly this question and declining to write an entry
 * until it was answered. That block is REPLACED by the ruling, not deleted: a closed decision left looking
 * open invites the next reader to re-open it, and a deleted one leaves the entry with no argument behind it.
 *
 * ============ ONE DETAIL OF THE RULING IS NOT QUITE RIGHT, AND IT CHANGES THE SEVERITY ============
 *
 * *"65 uses and zero of the alternatives"* is right about `prestador de IA`, which is attested ZERO times.
 * It is not right about `provedor de IA`, which the census counts **21** times. Measured now, by
 * `census-22989-role-terms.mjs`, not quoted from a note:
 *
 *   es-419   proveedor de IA      93      suministrador de IA    0
 *   pt-BR    fornecedor de IA     65      provedor de IA        21      prestador de IA   0
 *
 * That matters because the family's OWN severity rule is *"failure where one form is UNANIMOUS (no competing
 * form attested) and appears at least 10 times; flag otherwise"*. Spanish is unanimous at 93, so it is a
 * failure. Portuguese has a competing form attested 21 times, so by the family's own rule it is a FLAG --
 * and writing it as a failure would break a rule this family states about itself in order to enforce a
 * ruling that did not know the 21 were there.
 *
 * So the entry follows the pattern `eu_ai_act` already uses for precisely this split: a `failure` entry and a
 * separate `flag` entry naming the attested competitor. The ruling is applied; the severity is the one the
 * family's stated rule produces.
 *
 * ============ AND `prestador de IA` IS NOT FORBIDDEN HERE, DELIBERATELY ============
 *
 * It is `eu_ai_act`'s REQUIRED pt form. Forbidding it in the 22989 family would put two families scoped to
 * the same certifications in direct contradiction about one word -- which is what the `open_decision` block
 * refused to do, and what the census's collision check exists to catch. The ruling says the Regulation's term
 * stays as it is; it does not say 22989 should refuse it.
 *
 * The remaining contradiction is REAL and is recorded rather than papered over: a pt row that is about the
 * Regulation AND uses `fornecedor de IA` still fails `eu_ai_act`, correctly, because the Regulation's role is
 * `prestador`. A row that is about both framings has to pick one. `regulation_scoped` is what keeps every
 * other row out of that fight.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply. DRY by default.");
  process.exit(2);
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const P = join(ROOT, "scripts", "lib", "translation-glossary.json");
const g = JSON.parse(readFileSync(P, "utf8"));
const fams = g.families || g;
const fam = fams.iso_22989_roles;
if (!fam) { console.error("iso_22989_roles is not in the glossary"); process.exit(2); }

const AUTOFIX_NOTE = "Not auto-fixable. A role name is the subject of the item it appears in, so a bulk " +
  "substitution may only run over a read sample, with the non-role senses excluded by id.";

const NEW = [
  {
    key: "ai_provider",
    en: "AI provider",
    es: "proveedor de IA",
    pt: "fornecedor de IA",
    forbidden: { es: ["suministrador de IA"], pt: [] },
    severity: "failure",
    attested: { "es-419": 93, "pt-BR": 65 },
    note: "DECIDED PROMPT-95 s4. Spanish is UNANIMOUS at 93 occurrences with `suministrador de IA` attested " +
      "zero times, so the family's own severity rule makes it a failure. Portuguese is the ruled form at 65 " +
      "-- but `provedor de IA` is attested 21 times, so pt carries NO forbidden variant at this severity and " +
      "its competitor is handled by the `flag` entry below. Writing pt as a failure would break the rule " +
      "this family states about itself.",
    autofix: { es: false, pt: false },
    autofix_note: AUTOFIX_NOTE,
    enforceable: true,
    forbidden_why: {
      es: ["suministrador de IA -- the COMMERCIAL VENDOR sense. `eu_ai_act`'s vendor entry reserves " +
        "`suministrador` for exactly that, so using it for 22989's role collapses the two."],
      pt: [],
    },
    forbidden_attested: 0,
    forbidden_note: "PREVENTIVE on the Spanish side and catches nothing today by design: `suministrador de " +
      "IA` appears ZERO times. A quiet lint here is NOT evidence the rule worked.",
    clash_declared: "eu_ai_act `provider` forbids pt `fornecedor` at severity failure, and this entry " +
      "requires `fornecedor de IA`. The two do not collide in practice because eu_ai_act's entry is " +
      "`regulation_scoped`: in a row that is not about the Regulation it downgrades to a flag. A pt row that " +
      "IS about the Regulation and uses `fornecedor de IA` still fails there, correctly -- the Regulation's " +
      "role is `prestador`. A row about both framings has to pick one, and that is a content decision, not " +
      "something a lint can resolve.",
  },
  {
    key: "ai_provider-provedor",
    en: "AI provider",
    es: "proveedor de IA",
    pt: "fornecedor de IA",
    forbidden: { es: [], pt: ["provedor de IA"] },
    severity: "flag",
    attested: { "pt-BR": 21 },
    note: "The ATTESTED Portuguese competitor, 21 occurrences against the ruled form's 65. A FLAG rather " +
      "than a failure because the family's severity rule requires unanimity for a failure, and 21 is not " +
      "noise -- blocking a row on a form a quarter of the corpus uses would refuse correct work while the " +
      "displacement is carried out. Same two-entry shape `eu_ai_act` uses for its own `provedor` split.",
    autofix: { es: false, pt: false },
    autofix_note: AUTOFIX_NOTE + " Here the sample matters more than usual: 21 rows is the population, and " +
      "a substitution over them is a readable pass rather than a sweep.",
    enforceable: true,
    forbidden_why: {
      es: [],
      pt: ["provedor de IA -- an attested but non-house rendering. Displaced by the s4 ruling in favour of " +
        "`fornecedor de IA`, which the corpus uses three times as often."],
    },
    forbidden_attested: 21,
    forbidden_note: "CORRECTIVE, not preventive: this one has 21 live occurrences and will fire. That is the " +
      "point, and it is a flag so it reports them rather than blocking them.",
  },
];

const have = new Set((fam.terms || []).map((t) => t.key));
let fails = 0;
console.log("PROMPT-95 s4 -- AI provider for iso_22989_roles");
console.log("");
for (const t of NEW) {
  if (have.has(t.key)) {
    console.error("ABORT: " + t.key + " already exists in iso_22989_roles");
    fails++; continue;
  }
  console.log("  + " + t.key + "   severity " + t.severity);
  console.log("      es " + JSON.stringify(t.es) + "   forbidden " + JSON.stringify(t.forbidden.es));
  console.log("      pt " + JSON.stringify(t.pt) + "   forbidden " + JSON.stringify(t.forbidden.pt));
  console.log("      attested " + JSON.stringify(t.attested));
}
/* ---- the open_decision block must EXIST, or this script is answering a question nobody asked ---- */
if (!fam.provider_is_absent_deliberately) {
  console.error("ABORT: the `provider_is_absent_deliberately` block is not there. Either the entry was " +
    "already added by something else, or this glossary is not the one the ruling is about.");
  fails++;
}
console.log("");
console.log("  - provider_is_absent_deliberately   REPLACED by provider_decided_prompt_95_s4");
console.log("      a closed decision left looking open invites the next reader to re-open it;");
console.log("      a deleted one leaves the entry with no argument behind it.");

if (fails) {
  console.error("");
  console.error("NOTHING WRITTEN. " + fails + " abort condition(s).");
  process.exit(1);
}
if (!APPLY) {
  console.log("");
  console.log("DRY RUN -- nothing written. Re-run with --apply.");
  process.exit(0);
}

fam.terms.push(...NEW);
delete fam.provider_is_absent_deliberately;
fam.provider_decided_prompt_95_s4 = {
  ruled: "2026-09-30, PROMPT-95 s4. 22989's AI provider renders as `fornecedor de IA` in pt-BR and " +
    "`proveedor de IA` in es-419. The EU AI Act term stays as it is and is enforced only in rows about the " +
    "Regulation, which `regulation_scoped` already does.",
  measured_at_the_time: { "es-419": { "proveedor de IA": 93, "suministrador de IA": 0 },
    "pt-BR": { "fornecedor de IA": 65, "provedor de IA": 21, "prestador de IA": 0 } },
  one_correction: "The ruling said `65 uses and zero of the alternatives`. That is right about `prestador " +
    "de IA` (zero) and not about `provedor de IA`, which the census counts 21 times -- so pt is a FLAG under " +
    "this family's own severity rule rather than a failure, and the competitor gets its own entry. The " +
    "ruling is applied; the severity is the one the stated rule produces.",
  prestador_not_forbidden_here: "It is `eu_ai_act`'s required pt form. Forbidding it in this family would " +
    "put two families scoped to the same certifications in direct contradiction about one word, which is " +
    "what this block's predecessor refused to do and what the census's collision check exists to catch.",
};
writeFileSync(P, JSON.stringify(g, null, 2) + "\n", "utf8");
console.log("");
console.log("wrote scripts/lib/translation-glossary.json");
console.log("Now run:  node --dns-result-order=ipv4first scripts/census-22989-role-terms.mjs");
console.log("          node --dns-result-order=ipv4first scripts/check-term-lint-controls.mjs   (if present)");
