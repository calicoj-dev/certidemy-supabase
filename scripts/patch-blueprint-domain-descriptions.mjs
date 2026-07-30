/**
 * patch-blueprint-domain-descriptions.mjs
 *
 * Makes loadBlueprint carry each domain's description, localized the same way
 * titles already are, so the public certification page can show what a domain
 * actually covers.
 *
 * WHY A SEPARATE READ INSTEAD OF WIDENING loadDomainMastery
 *
 * The domains in this function come from loadDomainMastery, which the dashboard
 * radar also uses - and the file's own CRITICAL CONSISTENCY RULE says the
 * blueprint and the radar must never disagree on a domain's number. Widening a
 * shared function to add a field only one caller needs is how that kind of rule
 * gets eroded. One extra read here is cheaper than a shared change.
 *
 * WHY NO is_provisional FILTER
 *
 * Tempting, and wrong. The flag is ROW-level while the row holds a title and a
 * description that get reviewed independently. On 2026-07-29 the descriptions
 * were re-translated, which marked the whole row provisional - including titles
 * that had been reviewed weeks earlier - and every generated PDF correctly
 * dropped both and fell back to English while the public site kept showing
 * perfect Spanish titles.
 *
 * Adding the filter here would REPRODUCE that fallback on the public site rather
 * than prevent it. The real fix is upstream: either the flag splits per field,
 * or nothing rewrites a row without re-reviewing every field in it. Until then
 * the public loader stays as it is, and this comment is the record of why.
 *
 * FIVE ANCHORED EDITS, ALL VALIDATED BEFORE ANY ARE APPLIED.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:DRY_RUN="1"; node scripts\patch-blueprint-domain-descriptions.mjs
 *   Remove-Item Env:\DRY_RUN; node scripts\patch-blueprint-domain-descriptions.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SRC = "C:/Users/Juan/Documents/certidemy/certidemy-web/lib/blueprint/data.ts";
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

/* ---- 1. the interface field ------------------------------------------ */

const A1_FROM = [
  "export interface BlueprintDomain {",
  "  id: string;",
  "  code: string;",
  "  title: string;",
].join("\n");

const A1_TO = [
  "export interface BlueprintDomain {",
  "  id: string;",
  "  code: string;",
  "  title: string;",
  "  /**",
  "   * What this domain covers, in buyer-facing prose. Null when a domain has",
  "   * none written yet - callers must handle that rather than render an empty",
  "   * panel.",
  "   */",
  "  description: string | null;",
].join("\n");

/* ---- 2. the translated-description map --------------------------- */

const A2_FROM = "  const titleByDomain = new Map<string, string>();";
const A2_TO = [
  "  const titleByDomain = new Map<string, string>();",
  "  const descByDomain = new Map<string, string>();",
].join("\n");

/* ---- 3. widen the domain_translations read ------------------------ */

const A3_FROM = [
  "      const { data: dtData } = await supabase",
  '        .from("domain_translations")',
  '        .select("domain_id, title")',
  "        .in(\"domain_id\", domainIds)",
  '        .eq("language", locale);',
  "      for (const r of (dtData ?? []) as { domain_id: string; title: string }[]) {",
  "        titleByDomain.set(r.domain_id, r.title);",
  "      }",
].join("\n");

const A3_TO = [
  "      const { data: dtData } = await supabase",
  '        .from("domain_translations")',
  '        .select("domain_id, title, description")',
  "        .in(\"domain_id\", domainIds)",
  '        .eq("language", locale);',
  "      for (const r of (dtData ?? []) as {",
  "        domain_id: string;",
  "        title: string;",
  "        description: string | null;",
  "      }[]) {",
  "        titleByDomain.set(r.domain_id, r.title);",
  "        // Per-string fallback, matching titles: a translated row with a null",
  "        // description falls back to English rather than showing nothing.",
  "        if (r.description) descByDomain.set(r.domain_id, r.description);",
  "      }",
].join("\n");

/* ---- 4. read the English base descriptions ------------------------ */

const A4_FROM = "  const tasksByDomain = new Map<string, BlueprintTask[]>();";

const A4_TO = [
  "  // ---- domain descriptions ----",
  "  // Not carried by loadDomainMastery, and that function is shared with the",
  "  // dashboard radar - see the header note on why it is not widened here.",
  "  // Anon-readable, like domains and tasks.",
  "  const baseDescByDomain = new Map<string, string | null>();",
  "  {",
  "    const { data: dRows } = await supabase",
  '      .from("domains")',
  '      .select("id, description")',
  '      .eq("certification_id", certificationId);',
  "    for (const r of (dRows ?? []) as { id: string; description: string | null }[]) {",
  "      baseDescByDomain.set(r.id, r.description);",
  "    }",
  "  }",
  "",
  "  const tasksByDomain = new Map<string, BlueprintTask[]>();",
].join("\n");

/* ---- 5. expose it on the mapped domain --------------------------- */

const A5_FROM = [
  "    title: titleByDomain.get(d.id) ?? d.title,",
  "    weightPct: d.weightPct,",
].join("\n");

const A5_TO = [
  "    title: titleByDomain.get(d.id) ?? d.title,",
  "    description: descByDomain.get(d.id) ?? baseDescByDomain.get(d.id) ?? null,",
  "    weightPct: d.weightPct,",
].join("\n");

const EDITS = [
  ["BlueprintDomain.description", A1_FROM, A1_TO],
  ["descByDomain map", A2_FROM, A2_TO],
  ["domain_translations select", A3_FROM, A3_TO],
  ["English base descriptions read", A4_FROM, A4_TO],
  ["expose description on the domain", A5_FROM, A5_TO],
];

if (!existsSync(SRC)) {
  console.error("blueprint/data.ts not found at " + SRC);
  process.exit(1);
}

let text = readFileSync(SRC, "utf8");
const before = text.length;

console.log("Blueprint domain descriptions " + (DRY_RUN ? "[DRY RUN]" : "[LIVE]") + "\n");

if (text.includes("baseDescByDomain")) {
  console.log("  already patched - 'baseDescByDomain' is present. Nothing to do.");
  process.exit(0);
}

/* ---- phase 1: validate all anchors, touch nothing ------------------- */
let bad = 0;
for (const [label, from] of EDITS) {
  const hits = text.split(from).length - 1;
  if (hits === 1) {
    console.log("  ok   " + label);
  } else {
    console.log("  FAIL " + label + ": anchor found " + hits + " times, expected 1");
    console.log(
      from
        .split("\n")
        .map((l) => "         |" + l.replace(/^ +/, (m) => ".".repeat(m.length)))
        .join("\n"),
    );
    bad += 1;
  }
}
if (bad > 0) {
  console.log("\n" + bad + " anchor(s) did not match. NOTHING written.");
  console.log("Leading spaces show as dots - compare with the source.");
  process.exit(1);
}

/* ---- phase 2: apply -------------------------------------------------- */
for (const [, from, to] of EDITS) {
  text = text.replace(from, to);
}

console.log("\nbytes " + before + " -> " + text.length);

if (DRY_RUN) {
  console.log("\nDRY RUN - nothing written. All five anchors matched.");
} else {
  writeFileSync(SRC, text, { encoding: "utf8" });
  console.log("\nwritten.");
  console.log("");
  console.log("Nothing renders it yet - the certification page and the blueprint");
  console.log("drawer need the field passed through and displayed. `npm run build`");
  console.log("should still pass: the new field is additive.");
}
