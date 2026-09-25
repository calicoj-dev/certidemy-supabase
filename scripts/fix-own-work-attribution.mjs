#!/usr/bin/env node
/**
 * fix-own-work-attribution.mjs -- the own-work maxim is in NEITHER standard, and
 * three of our texts said it was in ISO 19011.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * ============ THE CLAIM IS FALSE, NOT MERELY INVERTED ============
 *
 * *"An auditor may not audit their own work"* appears in neither ISO/IEC 27001
 * nor ISO 19011:2026. `HANDOFF-v6_2.md` section 2 records the full-text search:
 * zero hits. ISO 19011 clause 4.6 asks for independence wherever practicable
 * and, where that is not possible, every effort to remove bias. That is all.
 *
 * `isms-ia-01-03` teaches that correctly -- *"Neither standard contains the
 * rule"*. AIMS-F `05-02` contradicted it in two places, and ONE OF THEM IS THE
 * GRADED ANSWER:
 *
 *   the callout      "it is guidance from ISO 19011 rather than text in this standard"
 *   q2 option b      "the own-work rule is ISO 19011 guidance"   <- the CORRECT option
 *
 * A misattribution in a distractor teaches nothing. A misattribution in the key
 * marks a learner RIGHT for believing it, and two of our certifications then
 * disagree with each other about what a standard says. That is the larger defect
 * in this lesson; the inversion reported earlier is the smaller one.
 *
 * ============ WHAT THIS SCRIPT DOES NOT DECIDE ============
 *
 * Every replacement string is the director's, quoted verbatim from PROMPT-58.
 * The English edits come from `lib/declared-english-edits.mjs` (seq 5, 6, 7) so
 * the provenance prover replays exactly what was applied -- one list, two
 * directions, no second copy to drift.
 *
 * `isms-ia-01-03` es and pt are withheld by `translation_review` (zero review
 * rows, never reviewed; ISO run 6, provenance current). They are fixed anyway,
 * so they are correct whenever they clear.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { editsFor, declaredEditControls } from "./lib/declared-english-edits.mjs";
import { checkpointFields, replaceCheckpointField, parseCheckpoint } from "./lib/checkpoint-fields.mjs";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". DRY BY DEFAULT; --apply to write.");
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");

const broken = declaredEditControls();
if (broken.length) { console.error("DECLARED-EDIT FIXTURES FAILED: " + broken.join("; ")); process.exit(2); }

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };

async function rest(path, init) {
  let last;
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(REST + "/" + path, { ...(init || {}),
        headers: { ...H, ...((init || {}).headers || {}) }, signal: AbortSignal.timeout(45000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 160));
      return t ? JSON.parse(t) : null;
    } catch (e) { last = e; }
    await new Promise((s) => setTimeout(s, 400 * (i + 1)));
  }
  throw last;
}

const AIMS = "05-02-aims-internal-audit";
const ISMS = "isms-ia-01-03-objectivity-of-the-assignment";

/* Translation edits, verbatim from PROMPT-58. `kind: "tail"` keeps everything up
 * to and including the marker and replaces what follows -- the director's
 * instruction for q2 option b, which keeps each language's own first clause byte
 * for byte rather than retyping it. */
const TR_EDITS = [
  { slug: AIMS, language: "es-419", kind: "block", what: "callout",
    from: "El requisito de la norma es la **objetividad y la imparcialidad del proceso de auditoría.** La regla conocida de que los auditores no deben auditar su propio trabajo es la forma canónica de incumplir ese requisito y es una práctica sólida — pero es orientación de la ISO 19011 y no texto de esta norma. Presentarla como lo que dice ISO/IEC 42001 es el tipo de pequeña atribución incorrecta que se propaga fácilmente y sobre la que vale la pena ser preciso.",
    to: "El requisito de la norma es la **objetividad y la imparcialidad del proceso de auditoría.** La norma no menciona la conocida regla de que los auditores no deben auditar su propio trabajo, y tampoco la menciona ISO 19011: su principio de independencia pide independencia siempre que sea factible y, cuando no lo es, todo el esfuerzo posible por eliminar el sesgo. Auditar el propio trabajo es la forma canónica de incumplir el requisito, y una regla que lo prohíba es la manera en que la práctica de auditoría cumple lo que la norma pide; pero presentar esa regla como lo que dice ISO/IEC 42001 es el tipo de pequeña atribución incorrecta que se propaga con facilidad y sobre la que vale la pena ser preciso." },
  { slug: AIMS, language: "pt-BR", kind: "block", what: "callout",
    from: "O requisito da norma é **objetividade e imparcialidade do processo de auditoria.** A regra conhecida de que os auditores não devem auditar seu próprio trabalho é a forma canônica de falhar esse requisito e é uma boa prática — mas é orientação da ISO 19011, não texto desta norma. Apresentá-la como o que a ISO/IEC 42001 diz é o tipo de pequena atribuição incorreta que se propaga facilmente e merece precisão.",
    to: "O requisito da norma é a **objetividade e a imparcialidade do processo de auditoria.** A norma não menciona a conhecida regra de que os auditores não devem auditar o próprio trabalho, e a ISO 19011 também não a menciona: seu princípio de independência pede independência sempre que praticável e, quando não for, todo o esforço para eliminar o viés. Auditar o próprio trabalho é a forma canônica de falhar nesse requisito, e uma regra que o proíba é como a prática de auditoria entrega o que a norma pede; mas apresentar essa regra como o que diz a ISO/IEC 42001 é o tipo de pequena atribuição incorreta que se espalha facilmente e sobre a qual vale a pena ser preciso." },

  { slug: AIMS, language: "es-419", kind: "field", path: "q2.option.b",
    keepThrough: ";", tail: "la regla del trabajo propio es práctica de auditoría, no texto de ninguna de las dos normas" },
  { slug: AIMS, language: "pt-BR", kind: "field", path: "q2.option.b",
    keepThrough: ";", tail: "a regra do próprio trabalho é prática de auditoria, não texto de nenhuma das duas normas" },

  { slug: ISMS, language: "es-419", kind: "block", what: "callout sentence 2",
    from: "Es una buena regla general y la forma canónica de incumplir el apartado 9.2.2 b), pero no es una cita de ninguna de las dos normas y no debe presentarse como tal.",
    to: "Auditar el propio trabajo es la forma canónica de incumplir el apartado 9.2.2 b), y la regla que lo impide es una buena regla práctica, pero no es una cita de ninguna de las dos normas y no debe presentarse como tal." },
  { slug: ISMS, language: "pt-BR", kind: "block", what: "callout sentence 2",
    from: "É uma boa regra geral e a forma canônica de falhar na Seção 9.2.2 b) — mas não é uma citação de nenhuma das normas, e não deve ser apresentada como tal.",
    to: "Auditar o próprio trabalho é a forma canônica de falhar na Seção 9.2.2 b), e a regra que o impede é uma boa regra prática, mas não é uma citação de nenhuma das duas normas e não deve ser apresentada como tal." },
];

/* English: the SAME entries the provenance prover will replay backward. */
const EN_EDITS = [...editsFor(AIMS).filter((e) => e.seq >= 5), ...editsFor(ISMS)];

const slugs = [AIMS, ISMS];
const rows = await rest("lessons?select=id,slug,language,content_md&slug=in.(" + slugs.join(",") + ")&order=slug,language");
const at = (slug, lang) => rows.find((r) => r.slug === slug && r.language === lang);

console.log("");
console.log("OWN-WORK ATTRIBUTION -- the maxim is in neither standard");
console.log("DENOMINATOR: " + EN_EDITS.length + " English edit(s), " + TR_EDITS.length + " translated edit(s)");
console.log("");

const staged = [], problems = [];

/* MORE THAN ONE EDIT LANDS ON ONE ROW, so every edit is applied to whatever is
 * already staged for that row rather than to the original body. The first version
 * computed each from the original and the two 05-02 English edits overwrote each
 * other -- caught by the post-condition below, which found the other edit's text
 * still present in both staged bodies. Chaining is the fix; the post-condition is
 * why it was visible. */
function stageEdit(row, from, to, label, note) {
  const prior = staged.find((s) => s.row.id === row.id);
  const base = prior ? prior.next : row.content_md;
  const n = base.split(from).length - 1;
  if (n !== 1) { problems.push(label + " (" + note + "): anchor hit " + n + " time(s) in the staged body, must be 1"); return; }
  const next = base.replace(from, to);
  if (prior) { prior.next = next; prior.note += " + " + note; }
  else staged.push({ row, next, label, note });
}

/* ---- English ---- */
for (const e of EN_EDITS) {
  const row = at(e.slug, "en");
  if (!row) { problems.push(e.slug + " en: no row"); continue; }
  stageEdit(row, e.from, e.to, e.slug + " en", "seq " + e.seq);
}

/* ---- Translations ---- */
for (const t of TR_EDITS) {
  const row = at(t.slug, t.language);
  if (!row) { problems.push(t.slug + " " + t.language + ": no row"); continue; }
  const tag = t.slug + " " + t.language;

  if (t.kind === "block") {
    stageEdit(row, t.from, t.to, tag, t.what);
    continue;
  }

  /* A checkpoint FIELD. Keep the text through the marker byte for byte and
   * replace only the tail, then rebuild via replaceCheckpointField so no sibling
   * field can move. */
  const i = row.content_md.indexOf("::checkpoint");
  if (i < 0) { problems.push(tag + ": no checkpoint block"); continue; }
  const blk = row.content_md.slice(i);
  if (!parseCheckpoint(blk)) { problems.push(tag + ": checkpoint did not parse"); continue; }
  const f = (checkpointFields(blk) || []).find((x) => x.path === t.path);
  if (!f) { problems.push(tag + ": no field " + t.path); continue; }
  const cut = f.text.indexOf(t.keepThrough);
  if (cut < 0) { problems.push(tag + " " + t.path + ": marker `" + t.keepThrough + "` not in the field"); continue; }
  const rebuilt = f.text.slice(0, cut + t.keepThrough.length) + " " + t.tail;
  if (rebuilt === f.text) { problems.push(tag + " " + t.path + ": replacement is identical"); continue; }
  const res = replaceCheckpointField(blk, t.path, rebuilt);
  if (!res.ok) { problems.push(tag + " " + t.path + ": " + res.why); continue; }

  const prior = staged.find((s) => s.row.id === row.id);
  const base = prior ? prior.next : row.content_md;
  const oldBlk = base.slice(base.indexOf("::checkpoint"));
  const nextBody = base.slice(0, base.indexOf("::checkpoint")) + res.block;
  if (oldBlk === res.block) { problems.push(tag + ": checkpoint unchanged"); continue; }
  if (prior) prior.next = nextBody;
  else staged.push({ row, next: nextBody, label: tag, note: t.path });
}

for (const s of staged) {
  const d = s.next.length - s.row.content_md.length;
  console.log("  ok    " + s.label.padEnd(50) + (d >= 0 ? "+" : "") + d + " bytes   " + s.note);
}
let halted = false;
if (problems.length) {
  console.log("");
  console.log("REFUSING -- nothing written:");
  for (const p of problems) console.log("  " + p);
  /* exitCode, never process.exit: with fetch keep-alive sockets open, exit()
   * aborts libuv on Windows and the abort REPLACES the exit code, so a caller
   * reads a different number. This file already hit that once. */
  process.exitCode = 1; halted = true;
}

/* Every staged body must no longer contain the false attribution. Asserted
 * before the write, because "I replaced the string" and "the claim is gone" are
 * different statements. */
const STILL_FALSE = [
  "is ISO 19011 guidance", "guidance from ISO 19011 rather than text",
  "es orientación de ISO 19011", "é orientação da ISO 19011",
  "orientación de la ISO 19011 y no texto",
];
for (const s of halted ? [] : staged) {
  const left = STILL_FALSE.filter((x) => s.next.includes(x));
  if (left.length) problems.push(s.label + ": still asserts " + JSON.stringify(left));
}
if (!halted && problems.length) {
  console.log("");
  console.log("REFUSING -- a replacement left the false attribution in place:");
  for (const p of problems) console.log("  " + p);
  process.exitCode = 1; halted = true;
}
/* AND EVERY DECLARED EDIT MUST BE PRESENT IN WHAT WILL BE WRITTEN.
 *
 * The absence post-condition above only proves the FALSE text is gone. It cannot
 * prove each intended replacement arrived: when two edits land on one row, a
 * staging bug that silently drops the second leaves the first in place and the
 * absence check still passes. The dry run's own output showed this -- two field
 * edits chained into rows whose note said only "callout", and nothing in the
 * report distinguished "applied" from "skipped".
 *
 * So each edit asserts its own `to` text, positively, in the body that will be
 * PATCHed. A count of staged rows is not a claim about which edits are in them. */
for (const e of halted ? [] : EN_EDITS) {
  const s = staged.find((x) => x.row.slug === e.slug && x.row.language === "en");
  if (!s || !s.next.includes(e.to)) problems.push(e.slug + " en seq " + e.seq + ": the replacement is NOT in the staged body");
}
for (const t of halted ? [] : TR_EDITS) {
  const s = staged.find((x) => x.row.slug === t.slug && x.row.language === t.language);
  const needle = t.kind === "block" ? t.to : t.tail;
  if (!s || !s.next.includes(needle)) {
    problems.push(t.slug + " " + t.language + " (" + (t.what || t.path) + "): the replacement is NOT in the staged body");
  }
}
if (!halted && problems.length) {
  console.log("");
  console.log("REFUSING -- a declared edit is missing from what would be written:");
  for (const p of problems) console.log("  " + p);
  process.exitCode = 1; halted = true;
}
if (!halted) {
  console.log("");
  console.log("  post-condition: no staged body still attributes the rule to ISO 19011");
  console.log("  post-condition: all " + (EN_EDITS.length + TR_EDITS.length) + " declared replacement(s) present in the staged bodies");
}

if (!halted && !APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing written. Re-run with --apply.");
  halted = true;
}

let fail = 0;
if (!halted) {
console.log("");
for (const s of staged) {
  const back = await rest("lessons?id=eq." + s.row.id, {
    method: "PATCH", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ content_md: s.next }),
  });
  const after = back[0];
  const ok = after.content_md === s.next && after.mcp_servable === false && after.mcp_scanned_at === null;
  if (!ok) fail++;
  console.log("  " + (ok ? "PASS  " : "FAIL  ") + s.label.padEnd(50) +
    (after.content_md === s.next ? "bytes match" : "BYTES DIFFER") +
    ", trigger cleared: servable=" + after.mcp_servable + " scanned_at=" + (after.mcp_scanned_at === null));
}
console.log("");
if (fail) { console.log(fail + " row(s) did not read back."); process.exitCode = 1; }
else console.log("All " + staged.length + " written and byte-verified. Every row is now UNSCANNED: rescan required.");
}
