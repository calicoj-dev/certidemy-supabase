/**
 * check-tier-c-pt-siblings.mjs -- does the pt-BR sibling of each Tier C item carry
 * the same slip?
 *
 * READ-ONLY. Reports; fixes nothing. Unknown flags exit 2.
 *
 * The es-419 slips were found by a bilingual read of Spanish. Portuguese was not
 * read, so the honest question is per slip CLASS rather than per string: a
 * vendor/provider collapse, a readiness rendering, `distinct`, `confident`, `rank`,
 * an inserted `deve`. Each probe therefore states what would count as the same slip
 * in Portuguese AND what the correct form is, so a hit can be judged rather than
 * counted.
 *
 * A probe with no hit is reported as CLEAN ONLY IF its positive control fires --
 * that the sibling exists and its text was read at all. Otherwise it is NOT ASKED.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a) + " -- READ-ONLY"); process.exitCode = 2; process.exit();
}

/** [es prefix, label, class, pt regex that would be the SAME slip, the correct pt form] */
const PROBES = [
  ["7312ac33", "#85 confident", "meaning", /\bconfi[áa]vel\b/i, "segura / autoconfiante -- confiável means trustworthy"],
  ["64495519", "#130 vendor/provider", "meaning", /respons(abilidade|ável)[^.]{0,40}\bdo fornecedor\b(?![^.]{0,20}de servi)/i, "fornecedor de IA vs fornecedor do serviço kept apart"],
  ["df6bafc6", "#113 vendor/provider", "meaning", /\bfornecedor do modelo\b/i, "fornecedor de IA"],
  ["5fe28afb", "#119 readiness", "meaning", /\bdisponibilidade\b/i, "preparação -- disponibilidade is availability"],
  ["c330fb40", "#114 distinct", "meaning", /\bdistintivo\b/i, "distinto"],
  ["4b5d4ed5", "#103 sensitive", "meaning", /confidenciai?s?\b[^.]{0,30}or[çc]ament/i, "sensíveis in the stem, confidenciais only for the policy label"],
  ["7df0197d", "#170 recourse", "meaning", /\bsem recursos\b/i, "sem recurso / sem via de recurso"],
  ["c94769f9", "#207 most directly", "meaning", /de (maneira|forma) mais incorreta/i, "deturpa mais diretamente"],
  ["a6477254", "#277 rank", "meaning", /\brange?\b|\bfaixa\b/i, "posição no backlog"],
  ["41611b9c", "#289 rank", "meaning", /\brange?\b|\bfaixa\b/i, "ordem numérica"],
  ["0bf3f292", "#41 pattern-matching", "meaning", /coincide com padr[õo]es/i, "reconhece padrões"],
  ["40d5d539", "#224 inserted modal (KEY)", "modal", /\bdeve\b|\bdever[áa]\b/i, "no modal -- the English says `remind ... to clarify`"],
  ["5a5917ca", "#309 inserted modal", "modal", /\bdeve\b|\bdever[áa]\b/i, "no modal, and `next` must survive"],
  ["16d3e0c9", "#161 key-only gloss", "cue", /\(deskilling\)/i, "no English gloss in the key alone"],
  ["c699dee9", "#171 value system", "meaning", /sistema de valores/i, "sistema de valor"],
  ["f02f62e3", "#25 bad verb", "grammar", /\bdeferent/i, "cedem / deferem"],
  ["04be5971", "#322 calque", "grammar", /malrepresent/i, "deturpa"],
  ["8ce51417", "#328 bad verb", "grammar", /autogest[ií]r/i, "autogerir-se"],
  ["6dc29170", "#336 English imperative", "grammar", /^Defer\b|\bDefer ao\b/i, "Remeter ao / Encaminhar ao"],
  ["2cc60850", "#93 ungrammatical", "grammar", /deixando a (nenhuma|ninguém)/i, "não deixando ninguém"],
  ["1a568ec2", "#184 wrong article", "grammar", /\ba Respeito\b/i, "o Respeito"],
  ["499c3a66", "#187 lost interrogative", "grammar", /par de ideias:\s*$/im, "a question, not a colon"],
];

const KEY = requireKey(HERE);
const es = await getAll(KEY,
  "quiz_questions?select=id,question_group_id,language&language=eq.es-419&status=eq.approved&retired_at=is.null&order=id");
const groupOf = new Map();
for (const [p] of PROBES) {
  const hit = es.filter((r) => r.id.startsWith(p));
  if (hit.length === 1) groupOf.set(p, hit[0].question_group_id);
}
const groups = [...new Set([...groupOf.values()])];
const pt = await getAll(KEY,
  "quiz_questions?select=id,question_group_id,language,question_text,options,explanation&language=eq.pt-BR"
  + "&status=eq.approved&retired_at=is.null&question_group_id=in.(" + groups.join(",") + ")&order=id");
const ptBy = new Map(pt.map((r) => [r.question_group_id, r]));

const rows = [];
for (const [p, label, cls, re, correct] of PROBES) {
  const g = groupOf.get(p);
  const sib = g ? ptBy.get(g) : null;
  if (!sib) { rows.push({ p, label, cls, state: "NOT ASKED", detail: "no live pt-BR sibling" }); continue; }
  const fields = [["stem", String(sib.question_text || "")], ["explanation", String(sib.explanation || "")]];
  for (const o of Array.isArray(sib.options) ? sib.options : []) {
    fields.push(["option:" + o.id, String(o.text || "")]);
  }
  /* positive control: the sibling's text was actually read */
  const chars = fields.reduce((s, [, t]) => s + t.length, 0);
  if (chars < 40) { rows.push({ p, label, cls, state: "NOT ASKED", detail: "sibling text is empty or unread" }); continue; }
  const hits = fields.filter(([, t]) => re.test(t));
  rows.push(hits.length
    ? { p, label, cls, state: "SAME SLIP", correct,
        detail: hits.map(([f, t]) => f + ": ..." + t.replace(/\s+/g, " ").slice(Math.max(0, t.search(re) - 60), (t.search(re) < 0 ? 0 : t.search(re)) + 110) + "...").join("  |  ") }
    : { p, label, cls, state: "clean", detail: "read " + chars + " chars, probe did not match" });
}

console.log("TIER C pt-BR SIBLINGS -- read-only, nothing fixed");
console.log("  probes            " + PROBES.length);
console.log("  SAME SLIP         " + rows.filter((r) => r.state === "SAME SLIP").length);
console.log("  clean             " + rows.filter((r) => r.state === "clean").length);
console.log("  NOT ASKED         " + rows.filter((r) => r.state === "NOT ASKED").length + "   <- own state");
console.log("");
for (const r of rows.filter((x) => x.state === "SAME SLIP")) {
  console.log("  SAME SLIP  " + r.label + "  [" + r.cls + "]  " + r.p);
  console.log("      correct form: " + r.correct);
  console.log("      " + r.detail.slice(0, 400));
}
console.log("");
for (const r of rows.filter((x) => x.state !== "SAME SLIP")) {
  console.log("  " + r.state.padEnd(10) + r.label + "   " + r.detail.slice(0, 90));
}

writeFileSync(join(ROOT, "TIER-C-PT-SIBLINGS.json"), JSON.stringify(rows, null, 2) + "\n", "utf8");
console.log("");
console.log("wrote TIER-C-PT-SIBLINGS.json  -- pt-BR is NOT edited; this is the report");
