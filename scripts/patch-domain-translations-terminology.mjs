/**
 * patch-domain-translations-terminology.mjs
 *
 * Seven surgical corrections to domain_translations, found by reading all 66
 * rows after the 162 re-translation run.
 *
 * WHY NOT ANOTHER FORCE RUN. gen-jta-translations runs at temperature 0.2, so
 * every FORCE pass re-rolls all 66 strings and lands slightly different wording.
 * Four passes in a row is how "lean" became inconsistent INSIDE Portuguese when
 * the first pass had it consistent. Re-running to fix six problems would fix
 * those six and introduce new ones somewhere else. Targeted updates only.
 *
 * WHY NOT THE SQL EDITOR. The Supabase web editor corrupts multibyte characters
 * on paste, and every string here is accented Spanish or Portuguese. Same reason
 * lesson content has always gone through API loaders.
 *
 * ANCHORS MUST MATCH. If a `from` string is absent, or present more than once,
 * this script reports it and writes NOTHING for that row. A replace that
 * silently no-ops while the run reports success is the specific failure this
 * codebase keeps getting caught by; here it is a loud error and a non-zero exit.
 *
 * is_provisional IS NOT TOUCHED. These rows stay provisional. Correcting a
 * terminology slip is not the same as a native speaker having reviewed the copy,
 * and the flag means the latter. render-asset keeps omitting them until someone
 * deliberately flips it.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:DRY_RUN="1"; node scripts\patch-domain-translations-terminology.mjs
 *   Remove-Item Env:\DRY_RUN; node scripts\patch-domain-translations-terminology.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

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

const SUPABASE_URL = process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required (scripts/.env or environment).");
  process.exit(1);
}
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

/**
 * Each edit names the row, the exact substring to replace, and why.
 * The reasons are load-bearing: without them the next person to read a diff
 * has no way to tell a considered terminology decision from a typo fix.
 */
const EDITS = [
  {
    cert: "SPO-AI-I", dom: "D3", lang: "es-419",
    from: "los Desarrolladores",
    to: "los Developers",
    why: "Developers is an accountability name like Scrum Master and Product Owner, kept English everywhere else and in the official LATAM Spanish Scrum Guide. SPO-AI-I was the only cert translating it.",
  },
  {
    cert: "SPO-AI-I", dom: "D3", lang: "pt-BR",
    from: "os Desenvolvedores",
    to: "os Developers",
    why: "Same accountability-name rule as es-419.",
  },
  {
    cert: "SPO-AI-I", dom: "D2", lang: "es-419",
    from: "qué significa Definition of Done cuando",
    to: "qué significa Done cuando",
    why: "The English reads 'what Done means' - the STATE of an increment. Definition of Done is the STANDARD it is measured against. Different concepts; pt-BR got this right.",
  },
  {
    cert: "SPO-AI-I", dom: "D1", lang: "pt-BR",
    from: "pensamento enxuto sobre produtos",
    to: "pensamento lean de produto",
    why: "SM-AI-I and SD-AI-I pt-BR both say 'lean', as does every es-419 row. 'Enxuto' is correct Portuguese for manufacturing but Brazilian agile practice keeps 'lean'. Standardising on the majority so one row moves rather than two.",
  },
  {
    cert: "AIGRM-I", dom: "D4", lang: "es-419",
    from: "la documentación técnica y la trazabilidad",
    to: "la documentación técnica y la procedencia",
    why: "Provenance and traceability are distinct in governance, and AIGRM-I is the one cert where the distinction is examinable. AISM-I and SD-AI-I already use procedencia.",
  },
  {
    cert: "AIGRM-I", dom: "D4", lang: "pt-BR",
    from: "documentação técnica e rastreabilidade de origem",
    to: "documentação técnica e proveniência",
    why: "Same distinction as es-419. AISM-I and SD-AI-I already use proveniência.",
  },
  {
    cert: "AIE-I", dom: "D2", lang: "es-419",
    from: "redacción de instrucciones efectivas",
    to: "redacción de prompts efectivos",
    why: "AIE-I is the entry-level cert where 'prompt' is vocabulary a learner must recognise in the wild. SD-AI-I es-419 already keeps it; the pt-BR row already says 'prompts'.",
  },
];

async function main() {
  console.log(`Terminology patch ${DRY_RUN ? "[DRY RUN]" : "[LIVE]"} - ${EDITS.length} rows\n`);

  const { data: certs, error: ce } = await supabase
    .from("certifications").select("id, code");
  if (ce) throw new Error(`certifications: ${ce.message}`);
  const certId = new Map((certs || []).map((c) => [c.code, c.id]));

  const { data: domains, error: de } = await supabase
    .from("domains").select("id, code, certification_id");
  if (de) throw new Error(`domains: ${de.message}`);

  let ok = 0;
  let failed = 0;

  for (const e of EDITS) {
    const label = `${e.cert} ${e.dom} ${e.lang}`;
    const cid = certId.get(e.cert);
    if (!cid) { console.log(`  FAIL ${label}: no certification with code ${e.cert}`); failed++; continue; }

    const dom = (domains || []).find((d) => d.certification_id === cid && d.code === e.dom);
    if (!dom) { console.log(`  FAIL ${label}: no domain ${e.dom}`); failed++; continue; }

    const { data: row, error: re } = await supabase
      .from("domain_translations")
      .select("id, description")
      .eq("domain_id", dom.id)
      .eq("language", e.lang)
      .maybeSingle();
    if (re) { console.log(`  FAIL ${label}: ${re.message}`); failed++; continue; }
    if (!row) { console.log(`  FAIL ${label}: no translation row`); failed++; continue; }

    const before = row.description || "";
    const hits = before.split(e.from).length - 1;

    if (hits === 0) {
      console.log(`  FAIL ${label}: anchor not found -> "${e.from}"`);
      console.log(`       current: ${before.slice(0, 160)}`);
      failed++;
      continue;
    }
    if (hits > 1) {
      console.log(`  FAIL ${label}: anchor appears ${hits} times, refusing to guess -> "${e.from}"`);
      failed++;
      continue;
    }

    const after = before.replace(e.from, e.to);

    if (DRY_RUN) {
      console.log(`  [dry] ${label}`);
      console.log(`        - ${e.from}`);
      console.log(`        + ${e.to}`);
      ok++;
      continue;
    }

    const { error: ue } = await supabase
      .from("domain_translations")
      .update({ description: after, updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (ue) { console.log(`  FAIL ${label}: update failed - ${ue.message}`); failed++; continue; }

    console.log(`  ok   ${label}: ${e.from} -> ${e.to}`);
    ok++;
  }

  console.log(`\n${DRY_RUN ? "would patch" : "patched"} ${ok}, failed ${failed}`);
  if (failed > 0) {
    console.log("A failed anchor means the row was rewritten since this script was authored.");
    console.log("Re-read the row and update the EDITS entry - do NOT re-run gen-jta-translations to 'fix' it.");
    process.exit(1);
  }
  if (!DRY_RUN) {
    console.log("Rows remain is_provisional=true. render-asset still omits them until a review flips the flag.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
