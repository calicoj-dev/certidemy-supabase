#!/usr/bin/env node
/**
 * apply-queue-edits.mjs - the edits from the worked bilingual queue.
 *
 * `--apply` writes; DRY BY DEFAULT. Unknown flags exit 2. No model calls.
 *
 * ============ WHAT THIS IS ============
 *
 * The reviewer worked all 58 paragraphs of BILINGUAL-QUEUE.json on 2026-09-17:
 * 43 clean, 15 paragraphs edited. Those 15 arrived as literal OLD/NEW anchors,
 * which is 19 substitutions -- four paragraphs carry two spans on one line.
 *
 * Literal strings, applied literally. Handing a settled human judgement to a
 * model could only introduce variance, and five of these lines sit in the class
 * the language guard cannot certify anyway.
 *
 * ============ WHAT IS CHECKED, SINCE WORDING IS NOT ============
 *
 *   - the row exists, in that language, exactly once
 *   - the `before` occurs EXACTLY ONCE in the whole body
 *   - the `after` is not already present
 *   - after the splice: `before` gone, `after` present
 *   - and the stored row is READ BACK afterwards
 *
 * The one-occurrence rule is the one that matters. A substring edit on a body
 * where it matches twice changes a line nobody looked at, and `content_md` is
 * long enough that nobody would notice.
 *
 * FOUR PARAGRAPHS CARRY TWO SPANS EACH, so edits are grouped by row and applied
 * to one text before a single write. Computing both against the ORIGINAL and
 * writing twice would have the second discard the first -- the multi-span splice
 * defect this repo has already paid for once.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--apply", "--verbose", "--from"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ".");
    console.error("--apply family: DRY BY DEFAULT. Known: " + [...KNOWN].join(", "));
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");
/* --from <file>: a JSON array of {slug, language, before, after}.
 *
 * The list below is the 58-paragraph review of 2026-09-17 and is FINISHED.
 * Later reviews supply a spec file instead of extending it -- same shape as
 * retranslate-item-rewrite.mjs, where the spec is authored and read first and
 * applied second. Every guard in this file applies either way; only the source
 * of the anchors changes. */
const argOf = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const FROM = argOf("from", "");

const HERE = dirname(fileURLToPath(import.meta.url));
for (const p of [join(HERE, ".env"), join(HERE, "..", ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
async function req(method, path, body) {
  let last;
  for (let i = 0; i < 12; i++) {
    try {
      const r = await fetch(BASE + "/" + path, {
        method, headers: H, body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(60000),
      });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 200));
      return t ? JSON.parse(t) : null;
    } catch (e) { last = e; }
  }
  throw last;
}

/* ---------------------------------------------- the reviewer's 19 anchors */
const E = (slug, language, before, after) => ({ slug, language, before, after });
const EDITS = [
  E("aims-ia-02-07-the-programme-audits-itself", "es-419",
    "deberá considerar la importancia de los procesos involucrados y los resultados de auditorías anteriores",
    "deberá sopesar qué tan importantes son los procesos auditados y qué arrojaron las auditorías previas"),

  /* ANCHOR WIDENED, NOT THE EDIT CHANGED. The reviewer's anchor matches TWICE:
   * the concept paragraph at b1l0, which the queue listed and they read, and a
   * checkpoint explanation further down, which it did not. Both render English
   * that was repaired, but only one was reviewed, so only one is touched here
   * and the other is reported. */
  E("aims-ia-03-03-what-the-sample-supports", "es-419",
    "define el muestreo de auditoría con claridad: se aplica cuando no es práctico ni rentable examinar toda la información disponible",
    "define el muestreo de auditoría con claridad: se usa cuando examinar toda la información disponible resulta impracticable o demasiado costoso"),
  E("aims-ia-03-03-what-the-sample-supports", "es-419",
    "para obtener y evaluar evidencia sobre alguna característica de esa población, con el fin de formular una conclusión sobre ella",
    "de modo que se pueda reunir y sopesar evidencia sobre alguna característica suya y extraer una conclusión sobre el conjunto"),

  E("aims-ia-03-03-what-the-sample-supports", "pt-BR",
    "ela ocorre quando não é prático ou economicamente viável examinar todas as informações disponíveis",
    "ela é usada quando examinar todas as informações disponíveis é impraticável ou custoso demais"),
  E("aims-ia-03-03-what-the-sample-supports", "pt-BR",
    "para obter e avaliar evidências sobre alguma característica dessa população, a fim de formar uma conclusão a seu respeito",
    "de modo que evidências sobre alguma característica dela possam ser reunidas e sopesadas, e uma conclusão sobre o todo seja extraída"),

  E("aims-ia-03-04-demonstrated-not-described", "pt-BR",
    "em um processo de auditoria sistemático",
    "em um processo sistemático"),

  E("aims-ia-04-03-leadership-in-artifacts", "es-419",
    "sea **apropiada al propósito** de la organización",
    "**se ajuste al propósito** de la organización"),

  E("aims-ia-04-03-leadership-in-artifacts", "pt-BR",
    "demonstre liderança e comprometimento em relação ao sistema de gestão de IA",
    "evidencie liderança e comprometimento com o sistema de gestão de IA ao"),
  E("aims-ia-04-03-leadership-in-artifacts", "pt-BR",
    "estar **disponível para as partes interessadas, conforme apropriado**",
    "estar **aberta às partes interessadas, quando for pertinente**"),

  /* ANCHOR WIDENED FOR A DIFFERENT REASON. This one also matches twice, and the
   * second is a checkpoint option whose ENGLISH WAS NEVER REPAIRED -- it still
   * reads "assess potential consequences". That translation is faithful to its
   * own English and applying the edit would have made it diverge. The bold
   * marker is what distinguishes the reviewed paragraph. */
  E("aims-ia-04-04-criteria-before-assessment", "es-419",
    "evalúe las posibles consecuencias **para la organización",
    "sopese qué podría seguirse **para la organización"),
  E("aims-ia-04-04-criteria-before-assessment", "es-419",
    "que se derivarían si los riesgos identificados se materializaran",
    "si un riesgo identificado llegara a ocurrir"),

  E("aims-ia-04-04-criteria-before-assessment", "pt-BR",
    "avalie as potenciais consequências **para a organização",
    "sopese o que poderia decorrer **para a organização"),
  E("aims-ia-04-04-criteria-before-assessment", "pt-BR",
    "que resultariam caso os riscos identificados se materializassem",
    "caso um risco identificado viesse a ocorrer"),

  E("aims-ia-04-05-controls-first-annex-a-second", "pt-BR",
    "defina um processo de tratamento de riscos de IA para",
    "estabeleça um processo para tratar o risco de IA que"),

  E("aims-ia-04-06-two-assessments-not-one", "es-419",
    "de la evaluación de impacto del sistema de IA **deberá estar documentado**",
    "de la evaluación **deberá documentarse**"),

  E("aims-ia-04-07-controlled-not-merely-present", "pt-BR",
    "o sistema de gestão de IA da organização inclua",
    "o sistema de gestão de IA contenha"),

  E("aims-ia-04-10-justifying-both-directions", "es-419",
    "**contenga los controles necesarios** y **proporcione justificación para las inclusiones y exclusiones**",
    "**recoja los controles necesarios** y **justifique tanto las inclusiones como las exclusiones**"),

  E("aims-ia-04-13-competence-the-organization-claims", "pt-BR",
    "esteja disponível como evidência de competência",
    "seja mantida como evidência de competência"),

  E("isms-ia-04-02-demonstrated-not-stated", "pt-BR",
    "estar **disponível para as partes interessadas, conforme apropriado**",
    "estar **aberta às partes interessadas, quando for pertinente**"),
];

let EDIT_LIST = EDITS;
if (FROM) {
  if (!existsSync(FROM)) { console.error(FROM + " not found"); process.exit(2); }
  const spec = JSON.parse(readFileSync(FROM, "utf8"));
  const list = Array.isArray(spec) ? spec : (spec.edits ?? []);
  if (!list.length) { console.error("NOT APPLYING: " + FROM + " carries no edits"); process.exit(2); }
  for (const e of list) {
    for (const k of ["slug", "language", "before", "after"]) {
      if (typeof e[k] !== "string" || !e[k]) {
        console.error("NOT APPLYING: an entry in " + FROM + " is missing " + k);
        process.exit(2);
      }
    }
    if (e.before === e.after) {
      console.error("NOT APPLYING: before equals after for " + e.slug + "/" + e.language);
      process.exit(2);
    }
  }
  EDIT_LIST = list.map((e) => E(e.slug, e.language, e.before, e.after));
  console.log("source: " + FROM + " (" + EDIT_LIST.length + " substitution(s))");
}
const rowsTouched = new Set(EDIT_LIST.map((e) => e.slug + "|" + e.language));
console.log("");
console.log("QUEUE EDITS -- literal strings from the worked queue, no model");
console.log("  substitutions " + EDIT_LIST.length + "   rows " + rowsTouched.size);
console.log("  mode: " + (APPLY ? "APPLY" : "DRY"));
console.log("");

const byRow = new Map();
for (const e of EDIT_LIST) {
  const k = e.slug + "|" + e.language;
  byRow.set(k, (byRow.get(k) ?? []).concat([e]));
}

const problems = [], writes = [];
for (const [k, list] of byRow) {
  const [slug, language] = k.split("|");
  const rows = await req("GET", "lessons?select=id,content_md&slug=eq." + slug +
    "&language=eq." + encodeURIComponent(language));
  if (!rows || rows.length !== 1) { problems.push(k + ": " + (rows?.length ?? 0) + " row(s), expected 1"); continue; }

  let md = rows[0].content_md, fail = null;
  const done = [];
  for (const e of list) {
    const n = md.split(e.before).length - 1;
    if (n === 0) {
      if (md.includes(e.after)) { done.push("(already)"); continue; }
      fail = "anchor not present: " + JSON.stringify(e.before.slice(0, 55)); break;
    }
    if (n > 1) { fail = "anchor occurs " + n + " times: " + JSON.stringify(e.before.slice(0, 55)); break; }
    if (md.includes(e.after)) { fail = "replacement already present while anchor still is: " + JSON.stringify(e.after.slice(0, 55)); break; }
    md = md.replace(e.before, e.after);
    done.push("ok");
  }
  if (fail) { problems.push(k + ": " + fail); continue; }
  for (const e of list) {
    if (md.includes(e.before)) problems.push(k + ": anchor survives the splice");
    if (!md.includes(e.after)) problems.push(k + ": replacement absent after the splice");
  }
  if (md === rows[0].content_md) { console.log("  --   " + k + "   no change"); continue; }
  writes.push({ id: rows[0].id, k, md, n: list.length });
  console.log("  ok   " + k.padEnd(56) + list.length + " substitution(s)");
}

console.log("");
if (problems.length) {
  console.log(problems.length + " PROBLEM(S). NOTHING WRITTEN.");
  for (const p of problems) console.log("  X " + p);
  process.exit(1);
}
console.log("rows to write: " + writes.length);
if (!APPLY) {
  console.log("");
  console.log("Dry run. Nothing written. Re-run with --apply.");
  process.exit(0);
}

for (const w of writes) await req("PATCH", "lessons?id=eq." + w.id, { content_md: w.md });
console.log("");
console.log("wrote " + writes.length + " row(s)");

let bad = 0;
for (const [k, list] of byRow) {
  const [slug, language] = k.split("|");
  const rows = await req("GET", "lessons?select=content_md&slug=eq." + slug +
    "&language=eq." + encodeURIComponent(language));
  const md = rows[0].content_md;
  for (const e of list) {
    if (!md.includes(e.after)) { console.log("  X READBACK " + k + ": replacement absent"); bad++; }
    if (md.includes(e.before)) { console.log("  X READBACK " + k + ": anchor still present"); bad++; }
  }
}
console.log(bad === 0
  ? "readback: all " + EDIT_LIST.length + " substitution(s) present in the stored rows"
  : "READBACK FAILED on " + bad + " check(s)");
process.exitCode = bad === 0 ? 0 : 1;
