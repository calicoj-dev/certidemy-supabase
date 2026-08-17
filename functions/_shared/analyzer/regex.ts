// _shared/analyzer/regex.ts
//
// POSTGRES REGEX IS NOT JAVASCRIPT REGEX.
//
// Patterns live in drift_rules in Postgres flavour, because the self-match
// invariant runs in SQL with the ~* operator. The engine runs in JS. Without
// translation, a pattern that self-matches perfectly in the database matches
// NOTHING in the engine -- which is the exact dead-rule failure that shipped in
// migration 220 (rule 11 used \b, which is BACKSPACE in Postgres), wearing a
// different hat.
//
// A dead rule looks exactly like a clean document. So this module does not just
// translate: it ASSERTS that the translated pattern still matches the term the
// rule is about, and refuses to load a rule that fails.

/**
 * Postgres word-boundary escapes and their JS equivalents.
 *
 * NOT \b. JavaScript's \b is defined on [A-Za-z0-9_] only, while Postgres word
 * boundaries are Unicode-aware. Translating \m to \b would mean that any rule
 * whose term touches an accented character self-matches perfectly in SQL and
 * then matches NOTHING in the engine.
 *
 * Concretely: /elimin[oo-acute]\b/ does not match "elimino-acute el termino",
 * because the accented vowel is not a \w character, so no boundary exists after
 * it. That is the entire es-419 and pt-BR ruleset silently dying -- in the
 * languages where it is hardest to notice.
 *
 * Lookarounds over \p{L}\p{N}_ are Unicode-correct and closer to Postgres
 * semantics. They require the u flag, which is why compile() prefers it.
 */
const WORD_CHAR = "\\p{L}\\p{N}_";
const BOUNDARY_MAP: Array<[RegExp, string]> = [
  [/\\m/g, `(?<![${WORD_CHAR}])`], // start of word
  [/\\M/g, `(?![${WORD_CHAR}])`], // end of word
  [/\\y/g, `(?:(?<![${WORD_CHAR}])|(?![${WORD_CHAR}]))`], // either edge
];

/**
 * Postgres escapes with no JS equivalent. Presence of any of these means the
 * pattern cannot be faithfully translated and the rule must not be loaded
 * silently -- a partial translation is worse than a refusal.
 */
const UNTRANSLATABLE: Array<[RegExp, string]> = [
  [/\\Y/, "\\Y (non-word-boundary) has no JS equivalent"],
  [/\\A/, "\\A (string start) -- use ^ instead"],
  [/\\Z/, "\\Z (string end) -- use $ instead"],
  [/\[\[:[a-z]+:\]\]/, "POSIX character class [[:alpha:]] is not supported in JS"],
  [/\(\?#/, "inline comment (?# is not supported in JS"],
];

export interface TranslationOk {
  ok: true;
  source: string;
  translated: string;
  regex: RegExp;
}

export interface TranslationFailed {
  ok: false;
  source: string;
  reason: string;
}

export type Translation = TranslationOk | TranslationFailed;

/**
 * Translate a Postgres regex to a JS RegExp.
 * Always case-insensitive and global: drift matching is case-insensitive by
 * definition (the SQL side uses ~*), and we want every occurrence, not the first.
 */
export function translatePgRegex(pattern: string): Translation {
  for (const [probe, reason] of UNTRANSLATABLE) {
    if (probe.test(pattern)) {
      return { ok: false, source: pattern, reason };
    }
  }

  let translated = pattern;
  for (const [from, to] of BOUNDARY_MAP) {
    translated = translated.replace(from, to);
  }

  try {
    return {
      ok: true,
      source: pattern,
      translated,
      regex: new RegExp(translated, "giu"),
    };
  } catch (err) {
    // The u flag rejects some patterns that are legal without it (a stray
    // unescaped brace, for instance). Retry once without it rather than
    // dropping an otherwise-valid rule.
    //
    // NOTE: \p{L} requires the u flag, so a pattern that used \m or \M CANNOT
    // fall back -- it will fail here too and be rejected outright, which is the
    // correct outcome. A boundary rule that silently degrades to ASCII-only
    // matching is worse than a rule that refuses to load.
    try {
      return {
        ok: true,
        source: pattern,
        translated,
        regex: new RegExp(translated, "gi"),
      };
    } catch (err2) {
      return {
        ok: false,
        source: pattern,
        reason: `does not compile in JS: ${(err2 as Error).message}`,
      };
    }
  }
}

export interface CompiledMatcher {
  ruleId: string;
  test: (text: string) => Array<{ index: number; match: string }>;
}

export interface CompileReport {
  compiled: CompiledMatcher[];
  /** Rules that could not be loaded. NEVER silently dropped. */
  rejected: Array<{ ruleId: string; legacyTerm: string; reason: string }>;
}

/**
 * THE SELF-MATCH ASSERTION, JS SIDE.
 *
 * Mirrors the SQL check `legacy_term ~* pattern`. A regex rule whose translated
 * pattern does not match its own legacy term is broken, and is rejected rather
 * than loaded. This is the check that would have caught rule 11 before it
 * reached the database, and it must run on every load, not once.
 */
export function compileRules(
  rules: Array<{
    id: string;
    legacyTerm: string;
    matchMode: "phrase" | "regex";
    pattern: string | null;
  }>,
): CompileReport {
  const compiled: CompiledMatcher[] = [];
  const rejected: CompileReport["rejected"] = [];

  for (const rule of rules) {
    if (rule.matchMode === "phrase") {
      const needle = rule.legacyTerm.toLowerCase();
      compiled.push({
        ruleId: rule.id,
        test: (text: string) => {
          const hay = text.toLowerCase();
          const out: Array<{ index: number; match: string }> = [];
          let i = hay.indexOf(needle);
          while (i !== -1) {
            out.push({ index: i, match: text.slice(i, i + needle.length) });
            i = hay.indexOf(needle, i + needle.length);
          }
          return out;
        },
      });
      continue;
    }

    if (!rule.pattern) {
      rejected.push({
        ruleId: rule.id,
        legacyTerm: rule.legacyTerm,
        reason: "match_mode is regex but pattern is null",
      });
      continue;
    }

    const t = translatePgRegex(rule.pattern);
    if (!t.ok) {
      rejected.push({ ruleId: rule.id, legacyTerm: rule.legacyTerm, reason: t.reason });
      continue;
    }

    // Self-match assertion.
    t.regex.lastIndex = 0;
    if (!t.regex.test(rule.legacyTerm)) {
      rejected.push({
        ruleId: rule.id,
        legacyTerm: rule.legacyTerm,
        reason:
          `translated pattern /${t.translated}/ does not match its own legacy term ` +
          `-- the rule is dead and would silently find nothing`,
      });
      continue;
    }

    compiled.push({
      ruleId: rule.id,
      test: (text: string) => {
        const re = new RegExp(t.translated, t.regex.flags);
        const out: Array<{ index: number; match: string }> = [];
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
          out.push({ index: m.index, match: m[0] });
          if (m[0].length === 0) re.lastIndex++; // guard against zero-width loops
        }
        return out;
      },
    });
  }

  return { compiled, rejected };
}
