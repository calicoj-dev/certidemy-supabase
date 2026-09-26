/**
 * apply-0501-translations.mjs -- land the two approved translated spans in
 * es-419 and pt-BR, then record the review so the gate re-opens.
 *
 * WRITES. `--apply`; DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ============ THE DIRECTOR'S TWO CHANGES, 2026-09-26 ============
 *
 * 1. `go wrong` gets the WIDER sense: `empezar a dar problemas` / `começar a dar
 *    problemas`, not `fallar` / `falhar`. The English covers a system that still
 *    works but is no longer the right thing, and *fail* is narrower than that.
 *
 * 2. The monitoring term follows this LESSON's house word, the same rule as the
 *    clause word. MEASURED in the lesson's own bodies, not assumed:
 *
 *      es-419   seguimiento 27   monitoreo 0   (monitorear as a verb 4)
 *      pt-BR    monitoramento 25   acompanhamento 0
 *
 *    So `seguimiento` and `monitoramento` are the house words and the drafts
 *    already carried them. No edit was needed; the measurement is the deliverable.
 *
 * ============ THE HASHES COME FROM THE GATE ============
 *
 * `lesson_translation_reviews` is written with the pair migration 374's
 * `expected_review_hashes_lesson` reports, reached only through
 * `lib/expected-review-hashes.mjs`. The two are NOT the same function --
 * left(md5(en),8) for en_hash and translation_hash(tr) for tr_hash -- which is
 * exactly why a recorder must ask rather than reimplement.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { expectedLessonHashes, assertCleared } from "./lib/expected-review-hashes.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (!KNOWN.has(a)) {
    console.error("unknown flag " + JSON.stringify(a) + " -- DRY BY DEFAULT; --apply writes.");
    process.exitCode = 2; process.exit();
  }
}
const APPLY = process.argv.includes("--apply");
const SLUG = "05-01-aims-monitoring-and-measurement";
const REVIEWER = "platform owner (the director), read of DRAFT-0501-TRANSLATIONS.md, 2026-09-26";

const EDITS = {
  "es-419": [
    { name: "span 1",
      from: "La guía advierte sobre un error específico al elegir criterios de desempeño: la organización debería considerar el desempeño de los sistemas o procesos no basados en IA que ya están en operación y utilizarlos como contexto relevante.",
      to: "ISO/IEC 42001 Anexo B, B.6.2.6 advierte sobre un error específico al elegir criterios de desempeño. Aquello que el sistema de IA desplazó suele seguir funcionando en algún lugar: un flujo de trabajo manual, un motor de reglas, un modelo anterior. Su desempeño debería tratarse como contexto al fijar los criterios.",
      keep: ["criterios de desempeño", "debería", "contexto"] },
    { name: "span 2",
      from: "La guía añade un elemento relacionado que es fácil pasar por alto: cuando los sistemas se utilizan para propósitos distintos a aquellos para los que fueron diseñados, o de maneras que nadie anticipó, debe considerarse si dichos usos son apropiados.",
      to: "B.6.2.6 añade un elemento relacionado que es fácil pasar por alto. Un sistema puede empezar a dar problemas porque las personas comenzaron a usarlo para otra cosa, no porque el modelo haya cambiado: una tarea para la que nunca fue diseñado, o una que nadie previó. Debería considerarse si ese uso sigue siendo apropiado.",
      keep: ["apropiado", "Debería", ", o "] },
  ],
  "pt-BR": [
    { name: "span 1",
      from: "A orientação alerta contra um erro específico na escolha de critérios de desempenho: convém que a organização considere o desempenho de sistemas ou processos não baseados em IA já em operação e os utilize como contexto relevante.",
      to: "ISO/IEC 42001 Anexo B, B.6.2.6 alerta contra um erro específico na escolha de critérios de desempenho. Aquilo que o sistema de IA substituiu normalmente continua funcionando em algum lugar: um fluxo de trabalho manual, um motor de regras, um modelo mais antigo. Convém que seu desempenho seja tratado como contexto ao definir os critérios.",
      keep: ["critérios de desempenho", "Convém que", "contexto"] },
    { name: "span 2",
      from: "A orientação acrescenta um item relacionado que é fácil de ignorar: onde sistemas estão sendo usados para finalidades diferentes daquelas para as quais foram projetados, ou de maneiras que ninguém antecipou, a adequação de tais usos deve ser considerada.",
      to: "B.6.2.6 acrescenta um item relacionado que é fácil de ignorar. Um sistema pode começar a dar problemas porque as pessoas passaram a usá-lo para outra finalidade, não porque o modelo mudou: uma tarefa para a qual nunca foi projetado, ou uma que ninguém previu. Convém que se considere se tal uso continua adequado.",
      keep: ["adequado", "Convém que", ", ou "] },
  ],
};
/* Drift terms must stay out -- the director's word change exists so the paragraph
 * does not borrow the technical term this certification teaches. */
const FORBID = { "es-419": [/\bderiva\b/i, /\bdesv[ií]o\b/i], "pt-BR": [/\bderiva\b/i, /\bdesvio\b/i] };

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const rest = async (path, init = {}) => {
  const r = await fetch(REST_URL + "/" + path, { ...init, headers: { ...H, ...(init.headers || {}) } });
  if (!r.ok) throw new Error(r.status + " " + r.statusText + " on " + path + "\n" + (await r.text()));
  const t = await r.text();
  return t ? JSON.parse(t) : null;
};
const rpc = (name, args) => rest("rpc/" + name, { method: "POST", body: JSON.stringify(args) });

const rows = await getAll(KEY, "lessons?select=id,slug,language,content_md&slug=eq." + SLUG + "&order=language");
const problems = [];
const staged = [];
for (const lang of ["es-419", "pt-BR"]) {
  const r = rows.find((x) => x.language === lang);
  if (!r) { problems.push("no " + lang + " row"); continue; }
  let body = String(r.content_md);
  let alreadyApplied = 0;
  for (const e of EDITS[lang]) {
    const n = body.split(e.from).length - 1;
    /* RESUMABLE: a span whose `from` is gone and whose `to` is present is already
     * applied. The first run wrote both bodies and then failed on the review insert,
     * so aborting here would strand the rows withheld with no way to finish. An
     * already-applied span is a state, not an error -- but it is only that state if
     * the `to` is actually there, which is asserted rather than assumed. */
    if (n === 0 && body.includes(e.to)) { alreadyApplied++; continue; }
    if (n !== 1) { problems.push(lang + " " + e.name + ": anchor occurs " + n + " times and the replacement is absent"); continue; }
    body = body.replace(e.from, e.to);
    for (const k of e.keep) {
      if (!e.to.includes(k)) problems.push(lang + " " + e.name + ": replacement lost `" + k.trim() + "`");
    }
  }
  for (const re of FORBID[lang]) {
    for (const e of EDITS[lang]) if (re.test(e.to)) problems.push(lang + " " + e.name + ": carries a drift term");
  }
  /* the approved wider sense, asserted */
  const span2 = EDITS[lang][1].to;
  const want = lang === "es-419" ? "empezar a dar problemas" : "começar a dar problemas";
  if (!span2.includes(want)) problems.push(lang + ": span 2 lacks the approved `" + want + "`");
  if (/\bfallar\b|\bfalhar\b/i.test(span2)) problems.push(lang + ": span 2 still uses the narrower fail wording");
  /* the house monitoring word must survive untouched in the body */
  const houseWord = lang === "es-419" ? "seguimiento" : "monitoramento";
  const beforeN = (String(r.content_md).match(new RegExp(houseWord, "gi")) || []).length;
  const afterN = (body.match(new RegExp(houseWord, "gi")) || []).length;
  if (afterN !== beforeN) problems.push(lang + ": the house word `" + houseWord + "` count moved " + beforeN + " -> " + afterN);
  if (body === String(r.content_md) && alreadyApplied !== EDITS[lang].length) {
    problems.push(lang + ": body did not change and not every span was already applied");
  }
  staged.push({ lang, row: r, body, houseWord, houseCount: afterN, alreadyApplied });
}

console.log(APPLY ? "APPLY -- writing both translated rows" : "DRY RUN -- nothing will be written");
for (const s of staged) {
  console.log("  " + s.lang + "  house word `" + s.houseWord + "` x" + s.houseCount +
    "   body " + String(s.row.content_md).length + " -> " + s.body.length + " chars");
}
if (problems.length) {
  console.error("");
  console.error("ABORT -- nothing written:");
  for (const p of problems) console.error("  " + p);
  process.exitCode = 2; process.exit();
}
if (!APPLY) {
  console.log("");
  console.log("  dry run clean: 2 spans per language, wider sense present, no drift term, house word intact.");
  process.exitCode = 0; process.exit();
}

/* ---- write, read back, then record the review ---- */
for (const s of staged) {
  await rest("lessons?id=eq." + s.row.id, { method: "PATCH", body: JSON.stringify({ content_md: s.body }) });
}
const back = await getAll(KEY, "lessons?select=id,language,content_md,mcp_servable,mcp_scanned_at&slug=eq." + SLUG + "&order=language");
const post = [];
for (const s of staged) {
  const b = back.find((x) => x.language === s.lang);
  post.push([s.lang + " byte-for-byte read-back", String(b.content_md) === s.body, "differs"]);
  for (const e of EDITS[s.lang]) {
    post.push([s.lang + " " + e.name + " old text gone", !String(b.content_md).includes(e.from), "anchor survived"]);
    post.push([s.lang + " " + e.name + " new text present", String(b.content_md).includes(e.to), "absent"]);
  }
}
const enBack = back.find((x) => x.language === "en");
post.push(["the ENGLISH row was not touched",
  String(enBack.content_md) === String(rows.find((x) => x.language === "en").content_md), "English changed"]);

/* the hashes come from the gate, never from a local formula */
const reviews = [];
for (const s of staged) {
  const want = await expectedLessonHashes(rpc, s.row.id);
  /* NO `language` COLUMN, and it would be redundant: `lessons` is one row per
   * language, so `lesson_id` already identifies which rendering was reviewed. The
   * first run sent one and PostgREST refused the insert -- after the two bodies had
   * already been written, which left the rows withheld rather than wrongly served.
   * Fail-closed, and the reason the write order is bodies-then-review. */
  reviews.push({
    lesson_id: s.row.id, reviewed_at: new Date().toISOString(),
    reviewed_by: REVIEWER, verdict: "approved",
    /* `observed`, not an invented word. `ltr_tr_hash_basis_chk` allows exactly
     * observed | measured | assumed, and the 18 rows from the batch-1 director read
     * use `observed` for precisely this situation: the hash was read from the gate's
     * own function over the live body the reviewer actually read. My first attempt
     * sent `reviewed` and the CHECK constraint refused the insert -- the constraint
     * doing the job a convention could not. */
    en_hash: want.en_hash, tr_hash: want.tr_hash, tr_hash_basis: "observed",
    note: "Two spans retranslated after the English repair removed a 12-word reproduction of "
      + "ISO/IEC 42001 Annex B B.6.2.6. Approved in DRAFT-0501-TRANSLATIONS.md with the wider "
      + "sense for `go wrong` and the lesson's own monitoring house word.",
  });
}
await rest("lesson_translation_reviews", { method: "POST", body: JSON.stringify(reviews) });

/* THE GATE DECIDES, so ask it. A review row is not a clearance. */
const still = await assertCleared(rpc, staged.map((s) => ({ id: s.row.id, label: s.lang, arm: "lesson" })));
post.push(["both translated rows now pass lesson_body_is_servable()", still.length === 0, "still withheld: " + still.join(", ")]);
const enServ = await rpc("lesson_body_is_servable", { p_lesson_id: enBack.id });
post.push(["the English row still serves", enServ === true, "English is " + JSON.stringify(enServ)]);

console.log("");
let bad = 0;
for (const [name, ok, msg] of post) {
  if (!ok) { console.log("  FAIL  " + name + "   -- " + msg); bad++; }
}
console.log("  " + (post.length - bad) + " of " + post.length + " post-conditions pass");
writeFileSync(join(ROOT, "APPLY-0501-TRANSLATIONS.json"), JSON.stringify({
  slug: SLUG, reviewer: REVIEWER,
  house_words: staged.map((s) => ({ lang: s.lang, word: s.houseWord, occurrences: s.houseCount })),
  edits: Object.fromEntries(Object.entries(EDITS).map(([l, es]) => [l, es.map((e) => ({ name: e.name, to: e.to }))])),
}, null, 2) + "\n", "utf8");
console.log("  wrote APPLY-0501-TRANSLATIONS.json");
process.exitCode = bad ? 1 : 0;
