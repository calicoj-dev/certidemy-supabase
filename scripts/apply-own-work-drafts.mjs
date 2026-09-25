#!/usr/bin/env node
/**
 * apply-own-work-drafts.mjs -- the three approved drafts, repo and database, in
 * one run.
 *
 * WRITES. `--apply`; dry by default. Unknown flags exit 2.
 *
 * ============ WHAT LANDS, AND WHY IT MUST BE ONE RUN ============
 *
 * Editing the English task `skills` moves `task_ksa_en_hash`, which BOTH
 * translations are pinned to. So English-alone would make `explain_task` serve
 * English for es and pt until the translations landed. English, es, pt and the
 * review rows go together or not at all.
 *
 * ============ THE REPO IS PART OF THE FIX ============
 *
 * The claim lives in the database AND in three places in the repository. Change
 * only the database and the next regeneration puts it back:
 *
 *   jta/ISMS-F_JTA_generated.md:732   the S line the live task text came from
 *   jta/ISMS-F_JTA_v2.0.md:494        the v2.0 S line (different wording, same claim)
 *   jta/ISMS-F_JTA_v2.0.md:516        the `auditor-objectivity` gloss -- the source
 *                                     of the concept defect as well
 *
 * A FOURTH LOCATION IS DELIBERATELY NOT EDITED. `migrations/171_seed_isms_f.sql`
 * carries the original seed text, and CLAUDE.md is explicit that a migration is a
 * RECORD OF WHAT RAN, not a script anyone executes -- rewriting it would make the
 * record lie about history, and replay from zero has never worked in this
 * repository anyway. It gets an inline marker instead, which is the treatment
 * this repository already prescribes for a superseded record: preserve the
 * wording, append the marker, so the next reader does not copy it forward.
 *
 * ============ CLAUSE WORDS, MEASURED ============
 *
 * PROMPT-63: every non-lesson surface follows its certification's LESSON house
 * word, per level, for new or edited text. Measured over ISMS-F's 49 lesson
 * bodies with `certificationClauseWord`:
 *
 *   es-419  whole  capitulo   unanimous, 6 lessons
 *   es-419  dotted ABSTAINS   only 1 lesson has one
 *   pt-BR   whole  Secao      unanimous, 6 lessons
 *   pt-BR   dotted Secao      unanimous, 5 lessons
 *
 * 9.2.2 b) is DOTTED. So pt takes `Secao`, measured -- which changed the item
 * draft, whose pt had said `clausula`. es ABSTAINS, so each draft's own word
 * stands, exactly as the ruling says. That leaves the item at `clausula` and the
 * concept at `apartado`, which is reported rather than quietly unified: the
 * concept is withheld, so no learner can meet both today.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--apply"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". DRY BY DEFAULT; --apply to write.");
    process.exit(2);
  }
}
const APPLY = process.argv.includes("--apply");
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
const trHash = (t) => rest("rpc/translation_hash", { method: "POST", body: JSON.stringify({ p_a: t }) });
const md5_8 = (t) => createHash("md5").update(t, "utf8").digest("hex").slice(0, 8);

const TASK_ID = "0fe570da-9789-4830-a82f-c76d0c8a9ee3";
const CONCEPT_SLUG = "auditor-objectivity";
const ITEM_GROUP = "352f63bd-965e-4757-98ac-9792e105a86b";

/* ---------------------------------------------------------------- strings */
const SKILLS = {
  en: "explains the purpose of internal audit, and why objectivity and impartiality are properties the audit process must secure rather than a rule about who may audit what.",
  "es-419": "explica el propósito de la auditoría interna y por qué la objetividad y la imparcialidad son propiedades que el proceso de auditoría debe asegurar, no una regla sobre quién puede auditar qué.",
  "pt-BR": "explica a finalidade da auditoria interna e por que a objetividade e a imparcialidade são propriedades que o processo de auditoria deve assegurar, e não uma regra sobre quem pode auditar o quê.",
};
const CONCEPT_DESC = {
  "es-419": "El apartado 9.2.2 pide que los auditores sean seleccionados y las auditorías realizadas de manera que se asegure la objetividad y la imparcialidad, no que nadie pueda auditar su propia área. Ni ISO/IEC 27001 ni ISO 19011 contienen esa prohibición, y leer la convención de la práctica como un requisito es el error habitual.",
  "pt-BR": "A Seção 9.2.2 pede que os auditores sejam selecionados e as auditorias conduzidas de forma a assegurar a objetividade e a imparcialidade, não que ninguém possa auditar a própria área. Nem a ISO/IEC 27001 nem a ISO 19011 contêm essa proibição, e ler a convenção de prática como um requisito é o erro comum.",
};
/* The item explanation: FIRST SENTENCE ONLY. The rest stays byte-identical. */
const EXPL = {
  en: {
    from: "ISO/IEC 27001 requires auditors to be objective and impartial, meaning they must not audit their own work.",
    to: "ISO/IEC 27001 clause 9.2.2 b) requires auditors to be selected and audits conducted so that objectivity and impartiality are ensured; it contains no rule against auditing your own work, which is practice convention rather than standard text. Auditing work you helped design is nonetheless the canonical way of failing the requirement the standard does contain.",
  },
  "es-419": {
    from: "ISO/IEC 27001 requiere que los auditores sean objetivos e imparciales, lo que significa que no deben auditar su propio trabajo.",
    to: "La cláusula 9.2.2 b) de ISO/IEC 27001 exige que los auditores sean seleccionados y las auditorías realizadas de manera que se asegure la objetividad y la imparcialidad; no contiene ninguna regla que prohíba auditar el propio trabajo, que es convención de la práctica y no texto de la norma. Auditar un trabajo que uno ayudó a diseñar es, de todos modos, la forma canónica de incumplir el requisito que la norma sí contiene.",
  },
  "pt-BR": {
    from: "A ISO/IEC 27001 exige que os auditores sejam objetivos e imparciais, o que significa que não devem auditar seu próprio trabalho.",
    to: "A Seção 9.2.2 b) da ISO/IEC 27001 exige que os auditores sejam selecionados e as auditorias conduzidas de forma a assegurar a objetividade e a imparcialidade; ela não contém nenhuma regra que proíba auditar o próprio trabalho, que é convenção de prática e não texto da norma. Auditar um trabalho que se ajudou a projetar é, ainda assim, a forma canônica de falhar no requisito que a norma de fato contém.",
  },
};

/* ---------------------------------------------------------------- repo */
const REPO_EDITS = [
  { file: "jta/ISMS-F_JTA_generated.md",
    from: "- **S:** explains the purpose of internal audit, and why objectivity and impartiality mean an auditor does not audit their own work.",
    to: "- **S:** " + SKILLS.en },
  { file: "jta/ISMS-F_JTA_v2.0.md",
    from: "**S:** explains the purpose of internal audit and why an auditor may not audit their own work.",
    to: "**S:** " + SKILLS.en },
  { file: "jta/ISMS-F_JTA_v2.0.md",
    from: "- `auditor-objectivity` - the requirement that auditors do not audit their own work.",
    to: "- `auditor-objectivity` - objectivity and impartiality as properties clause 9.2.2 b) requires of the audit process, not a rule about who may audit." },
  /* MARKER, not a rewrite: a migration records what ran. */
  { file: "migrations/171_seed_isms_f.sql",
    from: "   $$explains the purpose of internal audit and why an auditor may not audit their own work.$$,",
    to: "   -- [SUPERSEDED 2026-09-25. The maxim is in NEITHER ISO/IEC 27001 NOR ISO 19011:2026\n" +
        "   --  (HANDOFF-v6_2.md s2, full-text, zero hits). Corrected in the database and in\n" +
        "   --  jta/ISMS-F_JTA_*.md by scripts/apply-own-work-drafts.mjs. The seed text below is\n" +
        "   --  left as the record of what ran and must not be copied forward.]\n" +
        "   $$explains the purpose of internal audit and why an auditor may not audit their own work.$$," },
];

console.log("");
console.log("OWN-WORK DRAFTS -- repo and database, one run");
console.log("DENOMINATOR: " + REPO_EDITS.length + " repo edit(s), 3 task row(s), 2 concept row(s), 3 item row(s)");
console.log("");

const problems = [];

/* ---- PHASE 0: leak-scan the new English item sentence ---- */
let leakVerdict = "NOT RUN";
try {
  const { buildSources, scoreAgainst, ABS_RUN } = await import("./lib/leak-score.mjs");
  const src = buildSources();
  /* THE FIELD IS `maxRun`, AND THE FIRST VERSION READ `r.run`, WHICH DOES NOT
   * EXIST. It reported 0 against every source and printed a clean verdict having
   * measured nothing -- the vacuous pass this repository records more often than
   * any other defect. A POSITIVE CONTROL now runs first: a sentence lifted from
   * an indexed standard must score at or over the floor, or no verdict is
   * printed at all. */
  const CONTROL = "the organization shall select auditors and conduct audits that ensure objectivity and the impartiality of the audit process";
  const runOf = (text) => {
    let worst = 0, worstKey = "";
    for (const [key, s] of src) {
      const r = scoreAgainst(text, key, s);
      const run = Math.max(r.maxRun || 0, r.unionRun || 0);
      if (run > worst) { worst = run; worstKey = key; }
    }
    return { worst, worstKey };
  };
  const ctl = runOf(CONTROL);
  if (ctl.worst < ABS_RUN) {
    throw new Error("POSITIVE CONTROL: a real ISO sentence scored only " + ctl.worst +
      "w, floor " + ABS_RUN + " -- the scanner is not measuring");
  }
  const got = runOf(EXPL.en.to);
  leakVerdict = "longest run " + got.worst + "w" + (got.worstKey ? " against " + got.worstKey : "") +
                ", floor " + ABS_RUN + "   [control: a real ISO sentence scores " + ctl.worst + "w]";
  if (got.worst >= ABS_RUN) problems.push("LEAK: the new English explanation runs " + got.worst + "w against " + got.worstKey);
} catch (e) {
  /* A scan that CANNOT RUN is its own state and is not a pass. */
  leakVerdict = "COULD NOT RUN -- " + String(e.message || e).slice(0, 90);
  problems.push("leak scan could not run; an unmeasured sentence is not a cleared one");
}
console.log("  leak scan, new English explanation: " + leakVerdict);
console.log("  (the index is English-only, so the es and pt sentences are UNMEASURABLE, not clean)");
console.log("");

/* ---- PHASE 1: repo ---- */
const repoStaged = [];
for (const e of REPO_EDITS) {
  const p = join(ROOT, e.file);
  if (!existsSync(p)) { problems.push(e.file + ": not found"); continue; }
  const prior = repoStaged.find((s) => s.file === e.file);
  const base = prior ? prior.next : readFileSync(p, "utf8");
  const n = base.split(e.from).length - 1;
  if (n !== 1) { problems.push(e.file + ": anchor hit " + n + " time(s), must be 1"); continue; }
  const next = base.replace(e.from, e.to);
  if (prior) prior.next = next;
  else repoStaged.push({ file: e.file, path: p, next });
  console.log("  repo  " + e.file.padEnd(38) + "anchor unique");
}

/* ---- PHASE 2: database, staged ---- */
const taskRows = await rest("task_translations?select=id,language,skills&task_id=eq." + TASK_ID);
const taskEn = await rest("tasks?select=id,skills&id=eq." + TASK_ID);
const cRows = await rest("concepts?select=id,slug,certification_id&slug=eq." + CONCEPT_SLUG);
const certs = await rest("certifications?select=id,code");
const ismsF = certs.find((c) => c.code === "ISMS-F");
const concept = cRows.find((c) => c.certification_id === ismsF.id);
if (!concept) problems.push("ISMS-F concept " + CONCEPT_SLUG + " not found");
const cTr = concept ? await rest("concept_translations?select=id,language,name,description&concept_id=eq." + concept.id) : [];
const itemRows = await rest("quiz_questions?select=id,language,explanation&question_group_id=eq." + ITEM_GROUP + "&retired_at=is.null");

if (taskEn[0].skills.includes("audit their own work") === false) problems.push("task English skills no longer carries the claim -- already changed?");
for (const r of taskRows) if (!SKILLS[r.language]) problems.push("no draft for task_tr " + r.language);
for (const r of cTr) if (!CONCEPT_DESC[r.language]) problems.push("no draft for concept " + r.language);
for (const r of itemRows) {
  const e = EXPL[r.language];
  if (!e) { problems.push("no draft for item " + r.language); continue; }
  const n = r.explanation.split(e.from).length - 1;
  if (n !== 1) problems.push("item " + r.language + ": first sentence hit " + n + " time(s), must be 1");
}

const itemReviews = await rest("item_translation_reviews?select=question_id&question_id=in.(" +
  itemRows.map((r) => r.id).join(",") + ")");
console.log("");
console.log("  task translations   " + taskRows.length + "   concept rows " + cTr.length + "   item rows " + itemRows.length);
console.log("  item review rows    " + itemReviews.length +
  (itemReviews.length ? "" : "   -> no approval to invalidate; NOTHING GOES DARK on the item"));

if (problems.length) {
  console.log("");
  console.log("REFUSING -- nothing written:");
  for (const p of problems) console.log("  " + p);
  process.exitCode = 1;
} else if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing written. Re-run with --apply.");
} else {
  /* ---- repo ---- */
  for (const s of repoStaged) {
    writeFileSync(s.path, s.next, "utf8");
    const back = readFileSync(s.path, "utf8");
    console.log("  " + (back === s.next ? "PASS  " : "FAIL  ") + "repo " + s.file);
  }

  /* ---- task: English FIRST, then both translations, then the reviews ---- */
  const enBack = await rest("tasks?id=eq." + TASK_ID, {
    method: "PATCH", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ skills: SKILLS.en }) });
  console.log("  " + (enBack[0].skills === SKILLS.en ? "PASS  " : "FAIL  ") + "task 5.2 en skills");

  for (const r of taskRows) {
    const b = await rest("task_translations?id=eq." + r.id, {
      method: "PATCH", headers: { Prefer: "return=representation" },
      body: JSON.stringify({ skills: SKILLS[r.language] }) });
    console.log("  " + (b[0].skills === SKILLS[r.language] ? "PASS  " : "FAIL  ") + "task 5.2 " + r.language + " skills");
  }
  const ksaHash = await rest("rpc/task_ksa_en_hash", { method: "POST", body: JSON.stringify({ p_task_id: TASK_ID }) });
  const now = new Date().toISOString();
  const fresh = await rest("task_translations?select=id,language,statement,knowledge,skills,abilities&task_id=eq." + TASK_ID);
  const reviews = [];
  for (const r of fresh) {
    /* THE GATE'S OWN FORMULA, READ OUT OF pg_proc, NOT GUESSED.
     * `task_ksa_is_withheld` compares
     *     r.tr_hash = public.translation_hash(tt.knowledge, tt.skills, tt.abilities)
     * -- three arguments, no statement, no join. The first run of this script
     * invented a newline-joined four-field hash, wrote two review rows that could
     * never match, and left task 5.2 withheld in BOTH languages -- precisely the
     * outcome the one-run design existed to prevent. CLAUDE.md's rule, broken
     * again: recompute with the function that WROTE the value. */
    const tr = await rest("rpc/translation_hash", { method: "POST",
      body: JSON.stringify({ p_a: r.knowledge, p_b: r.skills, p_c: r.abilities }) });
    reviews.push({ task_translation_id: r.id, reviewed_at: now,
      reviewed_by: "director read (PROMPT-63), own-work attribution",
      verdict: "approved", en_hash: ksaHash, tr_hash: tr, tr_hash_basis: "observed",
      basis: "The own-work maxim is in neither ISO/IEC 27001 nor ISO 19011:2026 (HANDOFF-v6_2.md s2, " +
             "full-text, zero hits). Skills rewritten in all three languages in one run so no interval " +
             "serves English-only; statement, knowledge and abilities untouched. No clause number, so no " +
             "clause-word question arises. Repo sources corrected in the same commit." });
  }
  await rest("task_translation_reviews", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(reviews) });
  console.log("  " + reviews.length + " task review row(s) written, en_hash " + ksaHash);
  /* ASSERTED, NOT PRINTED. The entire reason English and both translations land
   * in one run is that nothing serves English-only afterwards. A row still
   * withheld here is THIS RUN FAILING ITS OWN GUARANTEE, and the first run
   * printed exactly that as a neutral line while both languages were dark. */
  let stillDark = 0;
  for (const r of fresh) {
    const w = await rest("rpc/task_ksa_is_withheld", { method: "POST", body: JSON.stringify({ p_tt_id: r.id }) });
    if (w) stillDark++;
    console.log("      " + (w ? "FAIL  " : "ok    ") + "task 5.2 " + r.language + "  withheld=" + w);
  }
  if (stillDark) {
    console.log("");
    console.log("  " + stillDark + " task translation(s) STILL WITHHELD -- explain_task serves English for them.");
    console.log("  This run did not keep its guarantee. Not a neutral outcome.");
    process.exitCode = 1;
  }

  /* ---- concept ---- */
  for (const r of cTr) {
    const b = await rest("concept_translations?id=eq." + r.id, {
      method: "PATCH", headers: { Prefer: "return=representation" },
      body: JSON.stringify({ description: CONCEPT_DESC[r.language] }) });
    console.log("  " + (b[0].description === CONCEPT_DESC[r.language] ? "PASS  " : "FAIL  ") +
      "concept " + CONCEPT_SLUG + " " + r.language + " (stays withheld: is_provisional " + b[0].is_provisional + ")");
  }

  /* ---- item ---- */
  for (const r of itemRows) {
    const e = EXPL[r.language];
    const next = r.explanation.replace(e.from, e.to);
    const b = await rest("quiz_questions?id=eq." + r.id, {
      method: "PATCH", headers: { Prefer: "return=representation" },
      body: JSON.stringify({ explanation: next }) });
    console.log("  " + (b[0].explanation === next ? "PASS  " : "FAIL  ") + "item explanation " + r.language);
  }
  console.log("");
  console.log("Written. The item group has no review rows, so nothing on it went dark.");
}
