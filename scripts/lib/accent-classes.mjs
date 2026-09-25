/**
 * accent-classes.mjs -- the three classes where BOTH forms are correct words.
 *
 * ONE IMPLEMENTATION, BECAUSE TWO DIVERGE. These lists were built by reading
 * 5,569 reported "missing accents" down to 36 real candidates -- a factor of
 * 155 -- and every exclusion below is DECLARED BY NAME rather than inferred,
 * because `minimo`/`minimo`-with-accent and `publica`/`publica`-with-accent
 * have exactly the same shape and only one of those pairs is a defect.
 *
 * Extracted from report-missing-accents.mjs on 2026-09-24, when a new accent
 * GATE reimplemented the naive both-forms check and fired on all 14 rows of a
 * regeneration batch: `que -> que`-with-accent, `como -> como`-with-accent,
 * `trabajo -> trabajo`-with-accent. Every one of those is a class this file
 * already knew about. A rule that exists only where it was written is a rule
 * the next caller is free to reinvent badly.
 *
 * Anything OUTSIDE these classes is reported for a human, never judged.
 */
const strip = (w) => w.normalize("NFD").replace(/[̀-ͯ]/g, "");
export { strip };

export const DIACRITIC_PAIRS = new Set([
  "como", "cuando", "donde", "que", "quien", "cual", "cuanto", "mas", "si",
  "el", "tu", "mi", "se", "de", "te", "aun", "solo", "porque", "esta", "este",
  "aquel", "adonde", "aquella", "aquello",
  /* Plurals of the same interrogatives -- the first run missed them and they
   * are the identical class, not a new one. */
  "quienes", "cuales", "cuantos", "cuantas", "cuanta", "cuantos",
  /* Portuguese number agreement: the circumflex marks the PLURAL of the verb.
   * `tem` 39x against `tem`-with-circumflex 10x is singular against plural, not
   * a misspelling -- and the same for `vem`. `nos` is "us"/"in the" against
   * `nos`-with-accent "we". All correct; all surfaced only when the length
   * floor dropped to three. */
  "tem", "vem", "nos", "por", "so", "sao", "esta", "e",
  /* ADDED 2026-09-24, from reading 1,000 flags over the 12M-character corpus.
   * Every one is a pair where BOTH members are correct and common, and every
   * one was missed because the first pass read a sample rather than the
   * population:
   *   hacia   "towards"          / hacia-with-accent  "was doing"   214 hits
   *   estas   "these"            / estas-with-accent  "you are"     128 hits
   *   aquele  "that one"         / aquele-with-crasis "to that one"  48 hits
   *   aquela  the same, feminine                                     45 hits
   * `esta` was already here and `estas` was not, which is the shape of the
   * whole class: a list built from what somebody happened to see. */
  "hacia", "estas", "aquele", "aquela", "aquelas", "aqueles", "essa", "essas",
]);

/* ============ AND A THIRD CLASS: THE ACCENT MARKS PART OF SPEECH ==========
 *
 * `especifica` is "specifies" and `especifica`-with-accent is "specific";
 * `publica` / `valida` / `amplia` / `continua` / `integra` are the same shape,
 * and in Portuguese `pode` is "can" against `pode`-with-circumflex "could".
 * Both members are correct words and the pair is a homograph, not a
 * misspelling.
 *
 * THIS IS NOT MECHANICALLY SEPARABLE FROM A REAL MISSING ACCENT without a
 * dictionary -- `minimo` and `mínimo` have exactly the same shape and only one
 * of them is a word. So these are declared by name, the list says so, and
 * anything outside it is REPORTED FOR A HUMAN rather than judged. A report
 * that guessed here would be the lexical-proxy defect again. */
export const PART_OF_SPEECH_PAIRS = new Set([
  "especifica", "publica", "valida", "amplia", "continua", "integra",
  "pratica", "critica", "duplica", "explicita", "implicita", "pode",
  "termino", "titulo", "calculo", "numero", "circulo", "practica",
  /* ADDED 2026-09-24: `seria` is "would be" against `seria`-with-accent
   * "serious" -- 86 occurrences in pt-BR, every one the conditional. Same shape
   * as `pode` / `pode`-with-circumflex, which was already here. */
  "seria", "serias", "media", "medias", "invalida", "fabrica", "ancora",
]);

/* ============ A FOURTH CLASS THAT IS NOT A LIST ============
 *
 * `items`, `decision`, `senior`, `record`, `formula`, `vision`, `exclusion`,
 * `conclusion` -- 400-odd flags between them, and every one is an ENGLISH WORD
 * sitting in a translated body against its accented Spanish cognate
 * (`items`-with-accent, `decision`-with-accent...). Pooling two languages makes
 * every cognate look like a disagreement; this is that, one layer in, inside a
 * single row.
 *
 * IT CANNOT BE A DECLARED LIST, because the members are whatever English the
 * curriculum happens to carry. But it has a mechanical test that needs no
 * dictionary: **if the token appears in the row's own ENGLISH sibling, it is a
 * carried English term and not a dropped accent.** Derived from the data
 * already in hand, per row, rather than guessed at globally.
 */
export function isCarriedEnglish(token, englishBody) {
  return new RegExp("(^|[^\\p{L}])" + token + "([^\\p{L}]|$)", "iu").test(englishBody);
}
/* A preterite/imperative shape: the two forms differ ONLY in that the accented
 * one carries its accent on the last vowel. Same stem, different tense. */
export function isVerbFormPair(plain, accented) {
  if (plain.length !== accented.length) return false;
  const p = [...plain], a = [...accented];
  let diffAt = -1;
  for (let i = 0; i < p.length; i++) {
    if (p[i] === a[i]) continue;
    if (diffAt >= 0) return false;
    if (strip(a[i]) !== p[i]) return false;
    diffAt = i;
  }
  return diffAt === p.length - 1;
}

/** True when BOTH forms are legitimate: a diacritic pair, a declared
 *  part-of-speech pair, or a preterite/imperative shape. */
export function bothFormsCorrect(plain, accented) {
  if (DIACRITIC_PAIRS.has(plain)) return true;
  if (PART_OF_SPEECH_PAIRS.has(plain)) return true;
  return isVerbFormPair(plain, accented);
}
