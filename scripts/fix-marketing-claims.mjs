/**
 * fix-marketing-claims.mjs
 *
 * Second and larger pass over marketing copy after CLAIMS-POLICY. Covers the
 * `home` and `auth` namespaces plus the one `about` key the first pass refused
 * to touch.
 *
 * WHY THERE IS A SECOND PASS. The first sweep - the one I reported as clean -
 * searched for `globally recognized` with a space. The copy says
 * "globally-recognized", hyphenated, and the Spanish and Portuguese say
 * "reconocidas mundialmente" / "reconhecidas mundialmente", a different word
 * order entirely. A Class C claim sat on the home page and both auth pages
 * through a sweep that reported no violations.
 *
 * That is the second time in two days a keyword sweep has certified copy that
 * was not clean. CLAIMS-POLICY §7 now says a clean sweep proves the absence of
 * Class C VOCABULARY and nothing else; the comparative-claim read is a separate
 * step and cannot be automated.
 *
 * ANCHORS ARE KEY-AND-VALUE PAIRS, NOT BARE STRINGS. The first pass tried to
 * replace the bare phrase "Most certifications" and correctly refused: it
 * appeared twice, once in `about.contrastOldLabel` and once inside
 * `home.heroSubhead`. Replacing blind would have silently rewritten landing-page
 * copy nobody had reviewed. Values repeat across namespaces; keys do not.
 *
 * WHAT IS FIXED
 *
 *   Class C - unearned claims
 *     home.subhead, auth.showcase.headline - "globally-recognized certifications"
 *
 *   Class D - unevidenced claims about others
 *     home.heroSubhead        - "Most certifications still pretend AI doesn't exist"
 *     home.diffSectionHeadline- "Built on the work nobody else does"
 *     home.blueprintBody      - "Most providers hide the blueprint behind a paywall"
 *     about.contrastOldLabel  - "Most certifications" as a column header
 *
 *   Overclaim about our own product
 *     home.diff1Title - "AI tutor that can't hallucinate". Grounding reduces
 *     hallucination; it does not make it impossible. The body text directly
 *     underneath already states the honest version, which is the one that
 *     survives contact with a sceptical buyer.
 *
 *   Six untranslated keys
 *     home.tryEyebrow, tryHeadline, blueprintEyebrow, blueprintHeadline,
 *     blueprintBody, blueprintCta rendered in ENGLISH on the Spanish and
 *     Portuguese sites - an entire landing-page section, in the primary market.
 *
 * NOT TOUCHED, AND IT NEEDS A DECISION. The `philosophy` block names PSM I and
 * compares scoring weights with no source, and says lessons are
 * tuned to "whichever exam your employer recognizes". That is Class D on the
 * weights, and it positions Certidemy as preparation for other people's
 * certifications, which contradicts the rest of the page. Combined with two
 * competing hero headline sets (headlineLead/Tail and heroHeadlineLead/Tail) it
 * looks like copy from an earlier product that was never removed. Deleting a
 * section is a positioning decision, not a claims fix.
 *
 * Run:
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   $env:DRY_RUN="1"; node scripts\fix-marketing-claims.mjs
 *   Remove-Item Env:\DRY_RUN; node scripts\fix-marketing-claims.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const WEB = "C:/Users/Juan/Documents/certidemy/certidemy-web/messages";
const DRY_RUN = ["1", "true", "yes"].includes((process.env.DRY_RUN || "").toLowerCase());

/** [label, exact current `"key": "value"`, replacement] */
const EDITS = {
  "en.json": [
    [
      "home.subhead",
      '"subhead": "Adaptive prep for globally-recognized certifications — built for the way you actually learn."',
      '"subhead": "Adaptive prep for certifications built in the open — designed for the way you actually learn."',
    ],
    [
      "home.heroSubhead",
      '"heroSubhead": "Most certifications still pretend AI doesn\'t exist. Certidemy is built for how you actually work now — AI woven through every domain, and every answer grounded in a source you can check."',
      '"heroSubhead": "Certidemy is built for how you actually work now — AI woven through every domain, and every answer grounded in a source you can check."',
    ],
    [
      "home.diffSectionHeadline",
      '"diffSectionHeadline": "Built on the work nobody else does."',
      '"diffSectionHeadline": "Built on work you can inspect."',
    ],
    [
      "home.diff1Title",
      '"diff1Title": "AI tutor that can\'t hallucinate."',
      '"diff1Title": "An AI tutor that cites its sources."',
    ],
    [
      "home.blueprintBody",
      '"blueprintBody": "Every domain, every weight, every task we test — published in full. Most providers hide the blueprint behind a paywall. We lead with ours, because the map is the proof the lessons are real."',
      '"blueprintBody": "Every domain, every weight, every task we test — published in full, before you pay. The map is the proof the lessons are real."',
    ],
    [
      "auth.showcase.headline",
      '"headline": "Adaptive prep for globally-recognized certifications,"',
      '"headline": "Adaptive prep for certifications built in the open,"',
    ],
    [
      "about.contrastOldLabel",
      '"contrastOldLabel": "Most certifications"',
      '"contrastOldLabel": "The old model"',
    ],
  ],
  "es-419.json": [
    [
      "home.subhead",
      '"subhead": "Preparación adaptativa para certificaciones reconocidas mundialmente, construida para la forma en que realmente aprendes."',
      '"subhead": "Preparación adaptativa para certificaciones construidas de forma abierta, diseñada para la forma en que realmente aprendes."',
    ],
    [
      "home.heroSubhead",
      '"heroSubhead": "La mayoría de las certificaciones siguen actuando como si la IA no existiera. Certidemy está hecha para cómo trabajas hoy en realidad: con IA integrada en cada dominio y cada respuesta respaldada por una fuente que puedes verificar."',
      '"heroSubhead": "Certidemy está hecha para cómo trabajas hoy en realidad: con IA integrada en cada dominio y cada respuesta respaldada por una fuente que puedes verificar."',
    ],
    [
      "home.diffSectionHeadline",
      '"diffSectionHeadline": "Construido sobre el trabajo que nadie más hace."',
      '"diffSectionHeadline": "Construido sobre un trabajo que puedes inspeccionar."',
    ],
    [
      "home.diff1Title",
      '"diff1Title": "Un tutor de IA que no puede alucinar."',
      '"diff1Title": "Un tutor de IA que cita sus fuentes."',
    ],
    [
      "home.tryEyebrow",
      '"tryEyebrow": "No brain dumps. No PDFs."',
      '"tryEyebrow": "Sin brain dumps. Sin PDFs."',
    ],
    [
      "home.tryHeadline",
      '"tryHeadline": "Try a real question. Right now."',
      '"tryHeadline": "Prueba una pregunta real. Ahora mismo."',
    ],
    [
      "home.blueprintEyebrow",
      '"blueprintEyebrow": "Total transparency"',
      '"blueprintEyebrow": "Transparencia total"',
    ],
    [
      "home.blueprintHeadline",
      '"blueprintHeadline": "Read the entire blueprint. Before you pay."',
      '"blueprintHeadline": "Lee el blueprint completo. Antes de pagar."',
    ],
    [
      "home.blueprintBody",
      '"blueprintBody": "Every domain, every weight, every task we test — published in full. Most providers hide the blueprint behind a paywall. We lead with ours, because the map is the proof the lessons are real."',
      '"blueprintBody": "Cada dominio, cada peso, cada tarea que evaluamos: publicados por completo, antes de que pagues. El mapa es la prueba de que las lecciones son reales."',
    ],
    [
      "home.blueprintCta",
      '"blueprintCta": "Browse the blueprints"',
      '"blueprintCta": "Explora los blueprints"',
    ],
    [
      "auth.showcase.headline",
      '"headline": "Preparación adaptativa para certificaciones reconocidas a nivel mundial,"',
      '"headline": "Preparación adaptativa para certificaciones construidas de forma abierta,"',
    ],
    [
      "about.contrastOldLabel",
      '"contrastOldLabel": "La mayoría de las certificaciones"',
      '"contrastOldLabel": "El modelo anterior"',
    ],
  ],
  "pt-BR.json": [
    [
      "home.subhead",
      '"subhead": "Preparação adaptativa para certificações reconhecidas mundialmente, criada para a forma como você realmente aprende."',
      '"subhead": "Preparação adaptativa para certificações construídas de forma aberta, criada para a forma como você realmente aprende."',
    ],
    [
      "home.heroSubhead",
      '"heroSubhead": "A maioria das certificações ainda finge que a IA não existe. A Certidemy é feita para como você realmente trabalha hoje: com IA integrada em cada domínio e cada resposta apoiada em uma fonte que você pode verificar."',
      '"heroSubhead": "A Certidemy é feita para como você realmente trabalha hoje: com IA integrada em cada domínio e cada resposta apoiada em uma fonte que você pode verificar."',
    ],
    [
      "home.diffSectionHeadline",
      '"diffSectionHeadline": "Construída sobre o trabalho que ninguém mais faz."',
      '"diffSectionHeadline": "Construída sobre um trabalho que você pode inspecionar."',
    ],
    [
      "home.diff1Title",
      '"diff1Title": "Um tutor de IA que não pode alucinar."',
      '"diff1Title": "Um tutor de IA que cita suas fontes."',
    ],
    [
      "home.tryEyebrow",
      '"tryEyebrow": "No brain dumps. No PDFs."',
      '"tryEyebrow": "Sem brain dumps. Sem PDFs."',
    ],
    [
      "home.tryHeadline",
      '"tryHeadline": "Try a real question. Right now."',
      '"tryHeadline": "Experimente uma questão real. Agora mesmo."',
    ],
    [
      "home.blueprintEyebrow",
      '"blueprintEyebrow": "Total transparency"',
      '"blueprintEyebrow": "Transparência total"',
    ],
    [
      "home.blueprintHeadline",
      '"blueprintHeadline": "Read the entire blueprint. Before you pay."',
      '"blueprintHeadline": "Leia o blueprint completo. Antes de pagar."',
    ],
    [
      "home.blueprintBody",
      '"blueprintBody": "Every domain, every weight, every task we test — published in full. Most providers hide the blueprint behind a paywall. We lead with ours, because the map is the proof the lessons are real."',
      '"blueprintBody": "Cada domínio, cada peso, cada tarefa que avaliamos: publicados por completo, antes de você pagar. O mapa é a prova de que as lições são reais."',
    ],
    [
      "home.blueprintCta",
      '"blueprintCta": "Browse the blueprints"',
      '"blueprintCta": "Explore os blueprints"',
    ],
    [
      "auth.showcase.headline",
      '"headline": "Preparação adaptativa para certificações reconhecidas mundialmente,"',
      '"headline": "Preparação adaptativa para certificações construídas de forma aberta,"',
    ],
    [
      "about.contrastOldLabel",
      '"contrastOldLabel": "A maioria das certificações"',
      '"contrastOldLabel": "O modelo anterior"',
    ],
  ],
};

let ok = 0;
let failed = 0;

console.log(`Marketing claims ${DRY_RUN ? "[DRY RUN]" : "[LIVE]"}\n`);

for (const [file, edits] of Object.entries(EDITS)) {
  const path = `${WEB}/${file}`;
  if (!existsSync(path)) {
    console.log(`FAIL ${file}: not found`);
    failed += edits.length;
    continue;
  }

  console.log(`== ${file} (${edits.length}) ==`);
  let text = readFileSync(path, "utf8");
  let touched = 0;

  for (const [label, from, to] of edits) {
    const hits = text.split(from).length - 1;
    if (hits !== 1) {
      console.log(`  FAIL ${label}: anchor found ${hits} times`);
      failed++;
      continue;
    }
    text = text.replace(from, to);
    touched++;
    ok++;
    console.log(`  ok   ${label}`);
  }

  if (!DRY_RUN && touched > 0) {
    writeFileSync(path, text, { encoding: "utf8" });
    console.log(`  wrote ${touched}`);
  }
  console.log("");
}

console.log(`${DRY_RUN ? "would change" : "changed"} ${ok}, failed ${failed}`);
if (failed > 0) {
  console.log("An anchor found 0 times means the copy moved; found 2+ means the key");
  console.log("and value pair is not unique. Re-read the file rather than forcing it.");
  process.exit(1);
}
if (!DRY_RUN) {
  console.log("\nRun `npm run build` before committing.");
}
