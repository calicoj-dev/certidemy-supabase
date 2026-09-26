/**
 * score-0501-translations.mjs -- draft-score the four retranslated 05-01 spans
 * BEFORE they go to the director.
 *
 * READ-ONLY. Writes only the report. Unknown flags exit 2. Nothing is applied.
 *
 * The English landed and re-scanned at 7w. These four spans replace the translated
 * text that still carries the old 12-word reproduction. They are scored the way any
 * rendering is scored -- G1 to G7, Check A, Check B, Check D, the refusal pattern --
 * so a human review runs on text the cheap gates already accept.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runRenderGates } from "./lib/render-gates.mjs";
import { checkModalSentences, checkDefinedTerms, checkClauseVocab } from "./lib/translation-checks.mjs";
import { REFUSAL } from "./lib/refusal-pattern.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a));
  process.exitCode = 2; process.exit();
}

const EN = {
  span1: "ISO/IEC 42001 Annex B, B.6.2.6 warns against a specific error in choosing performance criteria. Whatever the AI system displaced is usually still running somewhere -- a manual workflow, a rule engine, an older model -- and how well it performs should be treated as context when the criteria are set. A model with 88% accuracy sounds mediocre until you learn the manual process it replaced ran at 71%. Absolute numbers without a baseline mislead in both directions.",
  span2: "B.6.2.6 adds a related item that is easy to miss. A system can go wrong because people started pointing it at something else, not because the model moved: a job it was never designed to do, or one nobody foresaw. Whether such a use is still appropriate should itself be considered. That is a monitoring obligation about **use**, not about the model, and no technical metric surfaces it.",
};

const ES1 = "ISO/IEC 42001 Anexo B, B.6.2.6 advierte sobre un error específico al elegir criterios de desempeño. Aquello que el sistema de IA desplazó suele seguir funcionando en algún lugar: un flujo de trabajo manual, un motor de reglas, un modelo anterior. Su desempeño debería tratarse como contexto al fijar los criterios. Un modelo con un 88 % de exactitud parece mediocre hasta que se descubre que el proceso manual que reemplazó operaba al 71 %. Los números absolutos sin una línea de base inducen a error en ambas direcciones.";
const PT1 = "ISO/IEC 42001 Anexo B, B.6.2.6 alerta contra um erro específico na escolha de critérios de desempenho. Aquilo que o sistema de IA substituiu normalmente continua funcionando em algum lugar: um fluxo de trabalho manual, um motor de regras, um modelo mais antigo. Convém que seu desempenho seja tratado como contexto ao definir os critérios. Um modelo com 88% de acurácia parece medíocre até você descobrir que o processo manual que ele substituiu operava a 71%. Números absolutos sem uma linha de base induzem ao erro em ambas as direções.";
const ES2 = "B.6.2.6 añade un elemento relacionado que es fácil pasar por alto. Un sistema puede empezar a fallar porque las personas comenzaron a usarlo para otra cosa, no porque el modelo haya cambiado: una tarea para la que nunca fue diseñado, o una que nadie previó. Debería considerarse si ese uso sigue siendo apropiado. Esa es una obligación de seguimiento sobre el **uso**, no sobre el modelo, y ninguna métrica técnica la hace visible.";
const PT2 = "B.6.2.6 acrescenta um item relacionado que é fácil de ignorar. Um sistema pode falhar porque as pessoas passaram a usá-lo para outra finalidade, não porque o modelo mudou: uma tarefa para a qual nunca foi projetado, ou uma que ninguém previu. Convém que se considere se tal uso continua adequado. Isso é uma obrigação de monitoramento sobre o **uso**, não sobre o modelo, e nenhuma métrica técnica a revela.";

const DRAFTS = [
  { span: "span1", lang: "es-419", to: ES1 },
  { span: "span1", lang: "pt-BR", to: PT1 },
  { span: "span2", lang: "es-419", to: ES2 },
  { span: "span2", lang: "pt-BR", to: PT2 },
];

/* Obligations and terms the rendering must carry. The `or` joining B.6.2.6's TWO
 * cases is in this list because collapsing them would change what the clause asks;
 * the director called that out explicitly. */
const MUST = {
  "span1|es-419": ["criterios de desempeño", "debería", "contexto"],
  "span1|pt-BR": ["critérios de desempenho", "convém que", "contexto"],
  "span2|es-419": ["apropiado", "debería", ", o "],
  "span2|pt-BR": ["adequado", "convém que", ", ou "],
};

/* Drift terms are forbidden: `drift` became `go wrong` precisely so the paragraph
 * does not borrow the technical term this certification teaches. A translation that
 * reintroduces it undoes the change. The strong modals are forbidden for the usual
 * reason -- the English says `should` and B.6.2.6 is guidance. */
const FORBID = {
  "es-419": [/\bderiva\b/i, /\bdesv[ií]o\b/i, /\bdeber[aá]n?\b/i, /\bdebe\b/i, /\btiene que\b/i],
  "pt-BR": [/\bderiva\b/i, /\bdesvio\b/i, /\bdever[aá]\b/i, /\bdeve\b/i, /\btem que\b/i],
};

const out = [];
let bad = 0;
console.log("05-01 RETRANSLATION DRAFTS -- scored, not applied");
console.log("");
for (const d of DRAFTS) {
  const en = EN[d.span];
  const problems = [];
  for (const t of MUST[d.span + "|" + d.lang]) {
    if (!d.to.toLowerCase().includes(t.toLowerCase())) problems.push("missing `" + t.trim() + "`");
  }
  for (const re of FORBID[d.lang]) {
    if (re.test(d.to)) problems.push("carries forbidden `" + re.source + "`");
  }
  if (REFUSAL.test(d.to)) problems.push("matches the model-refusal pattern");

  const gates = runRenderGates(en, d.to, d.lang).map((f) => f.gate + ": " + f.detail);
  const a = checkModalSentences(en, d.to, d.lang);
  const b = checkDefinedTerms(en, d.to, d.lang);
  const dd = checkClauseVocab(d.to, d.lang);
  const flags = [
    ...gates,
    ...(a.unalignable ? ["A: UNALIGNABLE"] : a.flags.map((f) => "A: " + f.detail)),
    ...(b.unalignable ? ["B: UNALIGNABLE"] : b.flags.map((f) => "B: " + f.detail)),
    ...dd.flags.map((f) => "D: " + f.detail),
  ];
  if (problems.length) bad++;
  console.log("  " + d.span + " " + d.lang.padEnd(8) + (problems.length ? "HELD" : "clean"));
  for (const p of problems) console.log("      PROBLEM  " + p);
  for (const f of flags) console.log("      gate     " + f);
  out.push({ ...d, english: en, problems, gate_flags: flags });
}

writeFileSync(join(ROOT, "DRAFT-0501-TRANSLATIONS.json"), JSON.stringify(out, null, 2) + "\n", "utf8");
console.log("");
console.log(bad
  ? "  " + bad + " draft(s) HELD -- do not send"
  : "  all four clean: every obligation kept, no drift term, no modal promotion");
console.log("  wrote DRAFT-0501-TRANSLATIONS.json");
process.exitCode = bad ? 1 : 0;
