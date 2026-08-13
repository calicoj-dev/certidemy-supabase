#!/usr/bin/env node
/**
 * load-aims-ia-i18n.mjs - write AIMS-IA's catalogue claim and long-form
 * description with correct accents, through the API.
 *
 * WHY THIS EXISTS. Migration 210 carries the same three rows in ASCII, because
 * the Supabase SQL editor corrupts multibyte characters on paste. The .sql is
 * the versioned record; this loader is the execution path for the accented
 * text. Same split as migration 206 and the lesson loaders.
 *
 * Run AFTER 210. Upserts on (certification_id, lang), so running it twice is a
 * no-op and running it before 210 also works.
 *
 * ZERO DEPENDENCIES by design - parses scripts/.env itself and uses built-in
 * fetch, so it cannot fail on a package this repo may not have installed.
 *
 * Usage:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   node scripts\load-aims-ia-i18n.mjs --dry
 *   node scripts\load-aims-ia-i18n.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes("--dry");
const CERT_ID = "4818fc03-6da0-4266-9329-0e1ea2ea3fb4";

// --- env ------------------------------------------------------------------
function loadEnv() {
  const out = {};
  try {
    for (const line of readFileSync(path.join(HERE, ".env"), "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* fall through to process.env */ }
  return { ...out, ...process.env };
}
const env = loadEnv();
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_BASE || !KEY) {
  console.error("Missing SUPABASE URL or SUPABASE_SERVICE_ROLE_KEY (scripts/.env)");
  process.exit(1);
}

// --- the rows, with accents ------------------------------------------------
const ROWS = [
  {
    certification_id: CERT_ID,
    lang: "en",
    claim:
      "Validates that the holder can audit an AI management system against ISO/IEC 42001 and raise findings that rest on requirements the standard actually states.",
    description:
      "Level II certification in auditing an AI management system built to ISO/IEC 42001:2023, using ISO 19011:2026 as the audit methodology and ISO/IEC 42001 as the audit criteria. Covers audit programme management, evidence and sampling, testing declared Annex A controls against the Statement of Applicability, and findings through to management review \u2014 including the AI system impact assessment as a requirement in its own right, scope that follows from the roles an organization determines toward its AI systems, and the layered normativity of Annex A and Annex B.",
  },
  {
    certification_id: CERT_ID,
    lang: "es-419",
    claim:
      "Valida que la persona puede auditar un sistema de gesti\u00f3n de IA frente a ISO/IEC 42001 y plantear hallazgos que se apoyan en requisitos que la norma efectivamente establece.",
    description:
      "Certificaci\u00f3n de Nivel II en la auditor\u00eda de un sistema de gesti\u00f3n de IA construido conforme a ISO/IEC 42001:2023, usando ISO 19011:2026 como metodolog\u00eda de auditor\u00eda e ISO/IEC 42001 como criterios de auditor\u00eda. Cubre la gesti\u00f3n del programa de auditor\u00eda, la evidencia y el muestreo, la verificaci\u00f3n de los controles declarados del Anexo A frente a la Declaraci\u00f3n de Aplicabilidad, y los hallazgos hasta la revisi\u00f3n por la direcci\u00f3n, incluyendo la evaluaci\u00f3n de impacto del sistema de IA como requisito por derecho propio, el alcance que se deriva de los roles que la organizaci\u00f3n determina respecto de sus sistemas de IA, y la normatividad en capas del Anexo A y el Anexo B.",
  },
  {
    certification_id: CERT_ID,
    lang: "pt-BR",
    claim:
      "Valida que a pessoa \u00e9 capaz de auditar um sistema de gest\u00e3o de IA em rela\u00e7\u00e3o \u00e0 ISO/IEC 42001 e levantar constata\u00e7\u00f5es que se apoiam em requisitos que a norma de fato estabelece.",
    description:
      "Certifica\u00e7\u00e3o de N\u00edvel II na auditoria de um sistema de gest\u00e3o de IA constru\u00eddo conforme a ISO/IEC 42001:2023, usando a ISO 19011:2026 como metodologia de auditoria e a ISO/IEC 42001 como crit\u00e9rios de auditoria. Cobre a gest\u00e3o do programa de auditoria, as evid\u00eancias e a amostragem, a verifica\u00e7\u00e3o dos controles declarados do Anexo A em rela\u00e7\u00e3o \u00e0 Declara\u00e7\u00e3o de Aplicabilidade, e as constata\u00e7\u00f5es at\u00e9 a an\u00e1lise cr\u00edtica pela dire\u00e7\u00e3o, incluindo a avalia\u00e7\u00e3o de impacto do sistema de IA como requisito por direito pr\u00f3prio, o escopo que decorre dos pap\u00e9is que a organiza\u00e7\u00e3o determina em rela\u00e7\u00e3o aos seus sistemas de IA, e a normatividade em camadas do Anexo A e do Anexo B.",
  },
];

// --- guard: no coined acronym ---------------------------------------------
const BANNED = /\b(SGIA|SGSIA)\b/;
for (const r of ROWS) {
  if (BANNED.test(`${r.claim} ${r.description}`)) {
    console.error(`ABORT: coined acronym in ${r.lang}`);
    process.exit(1);
  }
}

console.log(`AIMS-IA i18n ${DRY ? "[DRY RUN]" : "[LIVE]"}`);
for (const r of ROWS) {
  console.log(`  ${r.lang.padEnd(7)} claim ${String(r.claim.length).padStart(3)}ch  desc ${String(r.description.length).padStart(3)}ch`);
  console.log(`          ${r.claim}`);
}
if (DRY) {
  console.log("\n[dry] nothing written. Re-run without --dry to upsert 3 rows.");
  process.exit(0);
}

const res = await fetch(`${URL_BASE}/rest/v1/certification_i18n?on_conflict=certification_id,lang`, {
  method: "POST",
  headers: {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=representation",
  },
  body: JSON.stringify(ROWS),
});
const body = await res.text();
if (!res.ok) {
  console.error(`FAILED ${res.status}: ${body}`);
  process.exit(1);
}
const written = JSON.parse(body);
console.log(`\nWrote ${written.length} row(s).`);
for (const r of written) {
  const bad = /\u00c3|\u00e2\u20ac/.test(`${r.claim}${r.description}`);
  console.log(`  ${r.lang.padEnd(7)} ${bad ? "MOJIBAKE DETECTED" : "clean"}`);
}
console.log("\nVerify: select lang, claim from public.certification_i18n where certification_id = '" + CERT_ID + "';");
