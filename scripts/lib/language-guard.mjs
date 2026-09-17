/**
 * language-guard.mjs - is this text actually in the language it claims?
 *
 * LIFTED from retranslate-item-rewrite.mjs when a second consumer appeared.
 * That file's own header records why it exists and why its first version was
 * wrong; the reasoning is reproduced below because it is the part that matters,
 * and a copy without it would be re-derived incorrectly.
 *
 * ============ NOT ACCENTS ============
 *
 * Spanish and Portuguese share every accent that matters -- "informacao" and
 * "informacion" both pass an accent test. What separates them in a short
 * sentence is function words and article forms that one language has and the
 * other does not.
 *
 * ============ AND NOT SHARED TOKENS ============
 *
 * The first version FAILED ITS OWN BEHAVIOUR TEST in the direction that had
 * already caused a wrong-language write: Spanish scored 3-1 against the pt-BR
 * markers and PASSED, because the want-list held tokens the two languages SHARE
 * -- a, o, que, para, se, por, como. A marker a language shares with its
 * neighbour is not a marker. It is noise both sides score on, and it makes a
 * guard look strict while being blind.
 *
 * So every entry is one half of a DISTINCTIVE PAIR, plus the -cion/-cao
 * suffixes, which are the strongest single discriminator in management-system
 * prose:
 *
 *     es   el/los/las   del   con   una   debe   estan   tambien   -cion
 *     pt   o/os/as      do    com   uma   deve   estao   tambem    -cao
 *
 * AVOID is simply the other language's want-list, so the test is symmetric by
 * construction rather than by two hand-written lists that can drift apart.
 *
 * ============ WHAT IT CANNOT DO ============
 *
 * A sentence half in each language scores roughly 2:1 toward whichever it leans
 * and passes. That is a different defect from the one this exists for -- the
 * incident was a whole field written fluently in the WRONG LANGUAGE, and the
 * margins are decisive for that. Tuning thresholds until a synthetic
 * half-and-half sentence failed would fit the guard to the test rather than to
 * the failure, which is how the cue-tolerance and vocabulary checks in this
 * repository went wrong before. A mixed field is caught by the human read.
 */

export const DISTINCTIVE = {
  "es-419": /\b(el|los|las|del|con|una|deben?|est[áa]n|tambi[ée]n|seg[úu]n|aunque|hacia|muy)\b|ci[óo]n\b|ciones\b/gi,
  "pt-BR":  /\b(os|as|do|dos|das|com|uma|deve[m]?|est[ãa]o|tamb[ée]m|n[ãa]o|s[ãa]o|ent[ãa]o|pelo|pela)\b|[çc][ãa]o\b|[çc][õo]es\b/gi,
};

/** { ok, want, avoid }. The target's markers must WIN, not tie. */
export function looksLikeLanguage(text, lang) {
  const mine = DISTINCTIVE[lang];
  const other = DISTINCTIVE[lang === "es-419" ? "pt-BR" : "es-419"];
  if (!mine || !other) return { ok: true, want: 0, avoid: 0 };
  const want = (String(text).match(mine) || []).length;
  const avoid = (String(text).match(other) || []).length;
  // A TIE IS EXACTLY WHAT A HALF-TRANSLATED FIELD LOOKS LIKE, so a tie fails.
  return { ok: want > avoid, want, avoid };
}

/**
 * POSITIVE CONTROL, and it is the four cases the original header records as
 * MEASURED rather than asserted. The second is the real failure: Spanish text
 * offered as Portuguese must be rejected.
 */
export function checkFaithful() {
  const ES = "El Scrum Master debe asegurar que los eventos están definidos según la guía, " +
             "con una descripción del proceso y también de las acciones correctivas.";
  const PT = "O Scrum Master deve garantir que os eventos estão definidos conforme o guia, " +
             "com uma descrição do processo e também das ações corretivas.";
  const cases = [
    [ES, "es-419", true],
    [ES, "pt-BR", false],   // the incident: fluent Spanish written into a pt-BR row
    [PT, "pt-BR", true],
    [PT, "es-419", false],
  ];
  const bad = [];
  for (const [text, lang, want] of cases) {
    const g = looksLikeLanguage(text, lang);
    if (g.ok !== want) {
      bad.push(`${lang}: got ok=${g.ok} (want ${g.want}, avoid ${g.avoid}), expected ${want}`);
    }
  }
  return bad;
}
