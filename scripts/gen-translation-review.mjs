/* gen-translation-review.mjs
   Renders a cert's JTA translations as a side-by-side review sheet.

   WHY THIS EXISTS
     gen-jta-translations.mjs writes every row is_provisional = true, on purpose:
     the flag is a claim that a human has read the string. verify-cert fails a
     cert whose rows are all provisional, and it should - "reviewed" is not
     something a generator can assert about its own output.

     But nothing rendered the rows in a form anyone could actually review. The
     script's own dry run prints them one language at a time, with no English to
     compare against, which is not review - it is proofreading in the dark.

     This puts the English source next to both translations, one row per line,
     in the order a reader would want them. Read it, or hand it to a second
     reviewer, then flip the flag with the SQL at the bottom of the output.

   WHAT IT COVERS
     domain title + description  (domains -> domain_translations)
     task statement              (tasks   -> task_translations)

     NOT the K/S/A fields. Those carry their own ksa_is_provisional flag, the
     site withholds them until reviewed rather than rendering them provisional
     (lib/blueprint/data.ts), and they are dense enough to deserve their own
     pass. Reviewing them is a separate job with a separate flag.

   CERT-AGNOSTIC. Pass CERT_ID. The same script serves every cert.

   Usage from the supabase repo:
     $env:CERT_ID="<uuid>"
     node scripts/gen-translation-review.mjs > TRANSLATION-REVIEW.md

   Or with an explicit path:
     $env:CERT_ID="<uuid>"; $env:OUT="C:\\path\\review.md"
     node scripts/gen-translation-review.mjs
*/
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  for (const p of [resolve(HERE, ".env"), resolve(HERE, "..", ".env")]) {
    try {
      for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        let v = m[2].trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        if (!process.env[m[1]]) process.env[m[1]] = v;
      }
    } catch {
      /* next candidate */
    }
  }
}
loadEnv();

const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://pctynukndxnmnxiqpgck.supabase.co";
const KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE;
const CERT_ID = process.env.CERT_ID;
const OUT = process.env.OUT || null;

if (!URL || !KEY) {
  console.error("Missing SUPABASE_URL / service key. Expected in scripts/.env.");
  process.exit(1);
}
if (!CERT_ID) {
  console.error("CERT_ID is required. No default - this script is cert-agnostic on purpose.");
  process.exit(1);
}

const db = createClient(URL, KEY, { auth: { persistSession: false } });
const LANGS = ["es-419", "pt-BR"];

function esc(s) {
  return String(s ?? "").replace(/\r?\n/g, " ").trim();
}

async function main() {
  const { data: cert } = await db
    .from("certifications")
    .select("code, name")
    .eq("id", CERT_ID)
    .maybeSingle();
  if (!cert) {
    console.error("No certification with that id.");
    process.exit(1);
  }

  const [{ data: domains }, { data: tasks }] = await Promise.all([
    db.from("domains").select("id, code, title, description, order_index")
      .eq("certification_id", CERT_ID).order("order_index"),
    db.from("tasks").select("id, code, statement, domain_id")
      .eq("certification_id", CERT_ID).order("code"),
  ]);

  const domIds = (domains ?? []).map((d) => d.id);
  const taskIds = (tasks ?? []).map((t) => t.id);
  const NONE = "00000000-0000-0000-0000-000000000000";

  const [{ data: domTr }, { data: taskTr }] = await Promise.all([
    db.from("domain_translations").select("domain_id, language, title, description, is_provisional")
      .in("domain_id", domIds.length ? domIds : [NONE]),
    db.from("task_translations").select("task_id, language, statement, is_provisional")
      .in("task_id", taskIds.length ? taskIds : [NONE]),
  ]);

  const dKey = (id, l) => `${id}|${l}`;
  const dMap = new Map((domTr ?? []).map((r) => [dKey(r.domain_id, r.language), r]));
  const tMap = new Map((taskTr ?? []).map((r) => [dKey(r.task_id, r.language), r]));

  const provisional =
    (domTr ?? []).filter((r) => r.is_provisional).length +
    (taskTr ?? []).filter((r) => r.is_provisional).length;
  const total = (domTr ?? []).length + (taskTr ?? []).length;

  const L = [];
  L.push(`# Translation review \u2014 ${cert.code}`);
  L.push("");
  L.push(`**${cert.name}**`);
  L.push("");
  L.push(
    `${total} rows, ${provisional} provisional. Rows are machine-translated and marked ` +
      `provisional until a human reads them. The site renders them regardless; the flag ` +
      `is a record of review, not a gate on display.`
  );
  L.push("");
  L.push("**What to check.** Not fluency \u2014 the machine is fluent. Check that the *terms of art* ");
  L.push("are the ones a practitioner in that language would use, that no acronym has been ");
  L.push("invented, and that nothing normative has drifted: a \"should\" rendered as a \"must\", ");
  L.push("a standard's name changed, a clause number moved.");
  L.push("");
  L.push("---");
  L.push("");
  L.push("## Domains");
  L.push("");

  for (const d of domains ?? []) {
    L.push(`### ${d.code} \u2014 title`);
    L.push("");
    L.push(`| | |`);
    L.push(`|---|---|`);
    L.push(`| **en** | ${esc(d.title)} |`);
    for (const l of LANGS) {
      const r = dMap.get(dKey(d.id, l));
      L.push(`| **${l}** | ${r ? esc(r.title) : "_MISSING_"} |`);
    }
    L.push("");
    L.push(`### ${d.code} \u2014 description`);
    L.push("");
    L.push(`| | |`);
    L.push(`|---|---|`);
    L.push(`| **en** | ${esc(d.description)} |`);
    for (const l of LANGS) {
      const r = dMap.get(dKey(d.id, l));
      L.push(`| **${l}** | ${r ? esc(r.description) : "_MISSING_"} |`);
    }
    L.push("");
  }

  L.push("---");
  L.push("");
  L.push("## Task statements");
  L.push("");

  for (const t of tasks ?? []) {
    L.push(`### Task ${t.code}`);
    L.push("");
    L.push(`| | |`);
    L.push(`|---|---|`);
    L.push(`| **en** | ${esc(t.statement)} |`);
    for (const l of LANGS) {
      const r = tMap.get(dKey(t.id, l));
      L.push(`| **${l}** | ${r ? esc(r.statement) : "_MISSING_"} |`);
    }
    L.push("");
  }

  L.push("---");
  L.push("");
  L.push("## After review");
  L.push("");
  L.push("If the rows are sound, flip the flag. Run in the Supabase SQL editor \u2014 this");
  L.push("touches no accented text, so the editor is safe here.");
  L.push("");
  L.push("```sql");
  L.push("update public.domain_translations dt");
  L.push("set is_provisional = false, updated_at = now()");
  L.push("from public.domains d");
  L.push("where d.id = dt.domain_id");
  L.push(`  and d.certification_id = '${CERT_ID}'`);
  L.push("  and dt.is_provisional;");
  L.push("");
  L.push("update public.task_translations tt");
  L.push("set is_provisional = false, updated_at = now()");
  L.push("from public.tasks t");
  L.push("where t.id = tt.task_id");
  L.push(`  and t.certification_id = '${CERT_ID}'`);
  L.push("  and tt.is_provisional;");
  L.push("```");
  L.push("");
  L.push("Then re-run `node scripts/verify-cert.mjs --cert " + cert.code + "`.");
  L.push("");
  L.push("If a row is WRONG, fix that row rather than flipping it. Re-running");
  L.push("gen-jta-translations.mjs with FORCE=1 replaces every row, including the ones");
  L.push("already reviewed, so a targeted UPDATE is the right repair for one bad string.");
  L.push("");
  L.push("**ksa_is_provisional is a separate flag and is NOT touched here.** The K/S/A");
  L.push("fields are withheld from the site until reviewed rather than rendered");
  L.push("provisional, so they carry no display risk and deserve their own pass.");
  L.push("");

  const md = L.join("\n");
  if (OUT) {
    writeFileSync(OUT, md, "utf8");
    console.error(`wrote ${OUT} (${md.length} chars, ${total} rows)`);
  } else {
    process.stdout.write(md);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
