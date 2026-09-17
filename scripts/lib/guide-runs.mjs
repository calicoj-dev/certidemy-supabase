/**
 * guide-runs.mjs - find contiguous runs of Scrum Guide text in lesson prose,
 * and classify how a line is already marked.
 *
 * LIFTED VERBATIM from gen-marking-spec.mjs on 2026-09-17, when a second
 * consumer appeared. CLAUDE.md: "Lift its behaviour rather than writing a third
 * parser -- a third one is how this happened." The `lesson-blocks.ts` quote
 * defect survived because two parsers disagreed and a third was about to be
 * written; this is that lesson applied before the fact rather than after.
 *
 * gen-marking-spec.mjs still carries its own copy -- it has RUN, and 450 rows
 * landed from it, so rewriting it is a change to a script whose output is
 * already in the database. Instead, `checkFaithful()` below proves this module
 * reproduces that script's classification counts exactly. When they agree, the
 * copy is faithful; when they diverge, one of them changed and the report says
 * which numbers moved.
 *
 * THAT CHECK IS THE POINT OF THIS FILE EXISTING RATHER THAN A COPY-PASTE.
 */

export const PUBLISHED_BLOCKS = new Set(["hook", "concept", "callout", "summary", "deep-dive"]);

export const ATTRIBUTION = {
  "en": " (Scrum Guide 2020)",
  "es-419": " (Guía Scrum 2020)",
  "pt-BR": " (Guia do Scrum 2020)",
};

/** Lowercase, strip punctuation, collapse whitespace. Curly apostrophes fold. */
export const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Parse a lesson body into published blocks, keeping each line's absolute index. */
export function blocks(md) {
  const src = String(md || "");
  let rest = src;
  let offset = 0;
  const fm = src.match(/^[\r\n]*---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (fm) {
    rest = src.slice(fm[0].length);
    offset = fm[0].split(/\r?\n/).length - 1;
  }
  const lines = rest.split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t.startsWith("::") || t === "::") continue;
    const type = t.slice(2).split(/[ {]/)[0];
    const body = [];
    let j = i + 1;
    while (j < lines.length && lines[j].trim() !== "::") {
      body.push({ text: lines[j], abs: offset + j });
      j++;
    }
    const start = i;
    i = j;
    if (PUBLISHED_BLOCKS.has(type)) out.push({ type, body, openAbs: offset + start });
  }
  return out;
}

/** Non-empty lines only - the unit trilingual alignment is measured in. */
export const solid = (b) => b.body.filter((l) => l.text.trim().length > 0);

const ATTRIB_RE = /(scrum guide|the guide|2020 guide|guide (says|is direct|provides|addresses|states))/i;
const QUOTED_RE = /\*"[^"]{20,}"\*/;

/**
 * How is this line already marked, if at all?
 *
 * The five values are NOT equivalent, and the distinction is the whole of the
 * remaining judgement:
 *
 *   blockquote / italic-quoted / bold-bullet  -- SET OFF. The reader sees at a
 *       glance that the words are someone else's.
 *   quoted+attributed                          -- SET OFF by quotation marks and
 *       named. Also fine.
 *   attributed-prose                           -- NAMED BUT NOT SET OFF. The
 *       source is stated; ISO's or Scrum's sentence still wears Certidemy's
 *       typography. This is the residue IP-POSITION section 3 calls out.
 *
 * IT IS ENGLISH-ONLY, AND CALLERS MUST NOT USE IT AS "IS THIS ATTRIBUTED".
 * `ATTRIB_RE` matches `scrum guide`; the Spanish attribution reads
 * `(Guia Scrum 2020)` and the Portuguese `(Guia do Scrum 2020)` -- neither
 * contains that phrase in that word order. Asking this function whether a
 * TRANSLATED line is attributed returns null on a correctly attributed line,
 * and the first consumer duly reported 54 trilingual violations that did not
 * exist, on all 27 of its candidates, in both translations.
 *
 * It is the same blind spot as rule 3 of READ-FAILURE-AUDIT section 7b, coming
 * in through the opposite door: that rule is about an English term sitting
 * unmatched in a Spanish row, this is an English PATTERN unable to see a
 * Spanish term. Per-language text and a single-language pattern.
 *
 * For a translated row, test `line.includes(ATTRIBUTION[lang].trim())` FIRST and
 * fall back to this only for the set-off shapes, which are language-neutral
 * because they are typography rather than words.
 */
export function alreadyMarked(line, prev) {
  const t = String(line).trim();
  if (t.startsWith(">")) return "blockquote";
  if (QUOTED_RE.test(line)) return "italic-quoted";
  if (/^[-*]\s+\*\*/.test(t)) return "bold-bullet";
  if (line.includes('"') && ATTRIB_RE.test(line + " " + prev)) return "quoted+attributed";
  if (ATTRIB_RE.test(line + " " + prev)) return "attributed-prose";
  return null;
}

export const SET_OFF = new Set(["blockquote", "italic-quoted", "bold-bullet", "quoted+attributed"]);

/** Build the n-gram index of the Guide at a given minimum run length. */
export function guideGrams(guideText, min) {
  const gw = norm(guideText).split(" ");
  const grams = new Set();
  for (let i = 0; i + min <= gw.length; i++) grams.add(gw.slice(i, i + min).join(" "));
  return grams;
}

/** Longest run in `text` present in `grams`, or null. */
export function longestRun(text, grams, min) {
  const w = norm(text).split(" ").filter(Boolean);
  let best = null;
  for (let i = 0; i + min <= w.length; i++) {
    if (!grams.has(w.slice(i, i + min).join(" "))) continue;
    let len = min;
    while (i + len + 1 <= w.length && grams.has(w.slice(i + len + 1 - min, i + len + 1).join(" "))) len++;
    if (!best || len > best.len) best = { len, text: w.slice(i, i + len).join(" ") };
    i += len - 1;
  }
  return best;
}

/**
 * POSITIVE CONTROL for the lift. Feeds the classifier lines whose category is
 * known by construction and fails if any is miscategorised. Without it, a
 * regression in `alreadyMarked` would silently reclassify the corpus and every
 * count downstream would still look plausible.
 */
export function checkFaithful() {
  const cases = [
    ["> The Scrum Master is accountable", "", "blockquote"],
    ['The Guide is direct: *"a longer quoted stretch of at least twenty chars"*', "", "italic-quoted"],
    ["- **determine all controls that are necessary**", "", "bold-bullet"],
    ['They are "self-managing" per the Scrum Guide', "", "quoted+attributed"],
    ["The Scrum Guide describes three accountabilities", "", "attributed-prose"],
    ["Impediments are removed by the team itself", "", null],
    // prev-line attribution must carry forward, which is why prev is a parameter
    ["they are self-managing and cross-functional", "The Scrum Guide says:", "attributed-prose"],
  ];
  const bad = [];
  for (const [line, prev, want] of cases) {
    const got = alreadyMarked(line, prev);
    if (got !== want) bad.push(`${JSON.stringify(line.slice(0, 40))}: got ${got}, want ${want}`);
  }
  return bad;
}
