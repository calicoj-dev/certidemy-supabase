/**
 * refusal-pattern.mjs -- has a model answered its operator instead of doing the
 * work, and has that answer been written down as content?
 *
 * A LIB, NOT A SCRIPT. The first attempt put this in `check-model-refusals.mjs`
 * and imported it from the generator; importing a script with top-level code
 * RUNS it, and its own argv validation rejected the importer's flags. A shared
 * rule has to live somewhere with no side effects, or every caller pays for the
 * side effects.
 *
 * ============ NARROW ON PURPOSE ============
 *
 * The first pattern included `as an AI` and `as a language model`. Across the
 * whole catalogue that matched 37 values and EVERY ONE WAS CURRICULUM:
 *
 *     "classified as an AI customer"     "has an AI management system"
 *     "does not qualify as an AI system"
 *     "Como um modelo de linguagem preve a proxima palavra plausivel"
 *
 * This is an AI certification catalogue. `as an AI X` is its subject matter and
 * how a language model predicts the next word is something we TEACH. A guard
 * that fires on the normal case is deleted by the first person it inconveniences,
 * and its deletion takes the real assertion with it.
 *
 * What survives is SECOND-PERSON ADDRESS TO AN OPERATOR, in all three
 * languages -- a model asked to answer in Spanish refuses in Spanish.
 */
export const REFUSAL = new RegExp(
  "(I need the actual" +
  "|you('ve| have) only provided" +
  "|I can(not|'t) translate" +
  "|no puedo traducir" +
  "|n[aã]o (consigo|posso) traduzir" +
  "|necesito el (contenido|texto)" +
  "|preciso do (conte[uú]do|texto)" +
  "|I don't have access to" +
  "|please (share|provide) the (english|full|actual|text|block)" +
  "|the block you want translated" +
  "|podr[ií]as? (proporcionar|compartir) el" +
  "|por favor (comparte|proporcione|compartilhe|forne[cç]a) o" +
  "|I('m| am) (unable|sorry), " +
  "|here is the translation" +
  "|aqu[ií] est[aá] la traducci[oó]n" +
  "|aqui est[aá] a tradu[cç][aã]o)", "i");

/**
 * Two of these are the ACTUAL refusals the batch-1 emit produced, verbatim. A
 * control built from a real instance cannot be quietly tuned away, and the
 * negative fixtures are the exact curriculum sentences the first, wider pattern
 * fired on.
 */
export const REFUSAL_CONTROLS = [
  ["the batch-1 refusal, verbatim",
   "I need the actual English block content to translate. You have only provided the heading.", true],
  ["the second refusal, verbatim",
   "Please share the English block you want translated.", true],
  ["a Spanish refusal",
   "No puedo traducir sin el contenido. Necesito el texto original.", true],
  ["a Portuguese refusal",
   "Nao consigo traduzir isso. Preciso do conteudo em ingles.", true],
  ["AI curriculum prose",
   "The organization has an AI management system classified as an AI customer.", false],
  ["teaching how an LLM works",
   "Como um modelo de linguagem preve a proxima palavra plausivel.", false],
  ["a lesson about availability",
   "Documented information shall be available to the extent necessary.", false],
];

/** Names of the fixtures that behave wrongly, empty when the pattern is sound. */
export function refusalControls() {
  return REFUSAL_CONTROLS.filter(([, t, want]) => REFUSAL.test(t) !== want).map(([n]) => n);
}
