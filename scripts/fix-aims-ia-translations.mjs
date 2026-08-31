#!/usr/bin/env node
/**
 * fix-aims-ia-translations.mjs - three corrections from the AIMS-IA translation
 * review, written through the API so the accents survive.
 *
 * The Supabase SQL editor corrupts multibyte characters on paste, so corrected
 * Spanish and Portuguese never goes through it. Migration 215 records what
 * changed and why; this applies it. Same split as migration 210.
 *
 * THE THREE
 *
 * 1. pt-BR task 5.2 - "registro" -> "enunciado"
 *    English: "Select the nonconformity STATEMENT that correctly links evidence
 *    to the requirement." The whole task is about how a finding is WORDED -
 *    task 5.2's skills field reads "Choose the statement that does this and no
 *    more." "Registro" is a record, a different artifact, and it points the
 *    candidate at the wrong thing. es-419 got this right with "enunciado".
 *    This is the only one of the three that changes what the task tests.
 *
 * 2. es-419 task 1.1 - "compromiso" -> "encargo"
 * 3. pt-BR  task 1.1 - "engajamento" -> "trabalho"
 *    Both render "audit engagement" as a false friend: "compromiso" and
 *    "engajamento" both read as COMMITMENT in ordinary usage. "Encargo" is the
 *    IAASB term in Spanish and "trabalho" the IBRACON/CFC term in Portuguese.
 *    Neither original misleads on the competence, but both read as
 *    translated-from-English to a practitioner, which is exactly what the
 *    review sheet asks a reviewer to catch.
 *
 * NOT CHANGED, and recorded because it was flagged and then withdrawn:
 *   pt-BR task 3.2 renders "review of documented information" as "analise
 *   critica da informacao documentada". ABNT uses "analise critica" for review
 *   generally across ISO management-system standards, not only for management
 *   review. The rendering is correct usage.
 *
 * Usage:
 *   cd C:\\Users\\Juan\\Documents\\certidemy\\supabase
 *   node scripts\\fix-aims-ia-translations.mjs --dry
 *   node scripts\\fix-aims-ia-translations.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes("--dry");
const CERT_ID = "4818fc03-6da0-4266-9329-0e1ea2ea3fb4";

function loadEnv() {
  const out = {};
  try {
    for (const line of readFileSync(path.join(HERE, ".env"), "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* fall through */ }
  return { ...out, ...process.env };
}
const env = loadEnv();
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_BASE || !KEY) {
  console.error("Missing SUPABASE URL or SUPABASE_SERVICE_ROLE_KEY (scripts/.env)");
  process.exit(1);
}

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

/* Each fix names the word it expects to find. If the text has moved since the
   review, the run aborts rather than overwriting something it has not read. */
const FIXES = [
  {
    task: "5.2",
    lang: "pt-BR",
    expect: "registro",
    statement:
      "Selecionar o enunciado de n\u00e3o conformidade que vincula corretamente a evid\u00eancia ao requisito",
    why: "registro is a record; the task is about how a finding is worded",
  },
  {
    task: "1.1",
    lang: "es-419",
    expect: "compromiso",
    statement:
      "Clasificar un encargo de auditor\u00eda descrito como de primera, segunda o tercera parte y ubicar el \u00e1mbito del auditor interno dentro de \u00e9l",
    why: "compromiso reads as commitment; encargo is the IAASB term",
  },
  {
    task: "1.1",
    lang: "pt-BR",
    expect: "engajamento",
    statement:
      "Classificar um trabalho de auditoria descrito como de primeira, segunda ou terceira parte e situar o \u00e2mbito do auditor interno dentro dele",
    why: "engajamento reads as commitment; trabalho is the IBRACON/CFC term",
  },
];

/* resolve task codes to ids */
const tRes = await fetch(
  `${URL_BASE}/rest/v1/tasks?certification_id=eq.${CERT_ID}&select=id,code`,
  { headers: H }
);
if (!tRes.ok) { console.error(`task lookup failed: ${await tRes.text()}`); process.exit(1); }
const tasks = await tRes.json();
const idFor = Object.fromEntries(tasks.map((t) => [t.code, t.id]));

console.log(`AIMS-IA translation corrections ${DRY ? "[DRY RUN]" : "[LIVE]"}\n`);

let planned = 0;
for (const f of FIXES) {
  const tid = idFor[f.task];
  if (!tid) { console.error(`ABORT: task ${f.task} not found`); process.exit(1); }

  const cur = await fetch(
    `${URL_BASE}/rest/v1/task_translations?task_id=eq.${tid}&language=eq.${encodeURIComponent(f.lang)}&select=statement,is_provisional`,
    { headers: H }
  ).then((r) => r.json());

  if (!cur.length) { console.error(`ABORT: no ${f.lang} row for task ${f.task}`); process.exit(1); }
  const old = cur[0].statement;

  if (!old.includes(f.expect)) {
    if (old === f.statement) { console.log(`  ${f.task}/${f.lang}  already corrected, skipping`); continue; }
    console.error(`ABORT: task ${f.task}/${f.lang} does not contain "${f.expect}" and is not the corrected text.`);
    console.error(`  found: ${old}`);
    process.exit(1);
  }

  console.log(`  ${f.task}/${f.lang}  ${f.why}`);
  console.log(`    -  ${old}`);
  console.log(`    +  ${f.statement}\n`);
  planned++;

  if (!DRY) {
    const up = await fetch(
      `${URL_BASE}/rest/v1/task_translations?task_id=eq.${tid}&language=eq.${encodeURIComponent(f.lang)}`,
      { method: "PATCH", headers: { ...H, Prefer: "return=representation" },
        body: JSON.stringify({ statement: f.statement }) }
    );
    if (!up.ok) { console.error(`  FAILED ${up.status}: ${await up.text()}`); process.exit(1); }
    const [row] = await up.json();
    const bad = /\u00c3|\u00e2\u20ac/.test(row.statement);
    console.log(`    written, ${bad ? "MOJIBAKE DETECTED" : "clean"}\n`);
  }
}

console.log(DRY
  ? `[dry] ${planned} correction(s) would be applied. Re-run without --dry.`
  : `${planned} correction(s) applied.\n\nNext: migration 215 flips all 90 rows to is_provisional = false.`);
