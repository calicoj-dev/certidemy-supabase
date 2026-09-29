/**
 * definition-boundary.mjs -- has a clause-3 definition passage run past its own end?
 *
 * ============ WHY THIS IS A MODULE AND NOT A COPY ============
 *
 * Two callers need the answer: check-definition-boundaries.mjs, which reports, and promote-thin-maps-93.mjs,
 * which must refuse to promote a clause whose passage is still swallowed. A second implementation of a rule
 * with a stated invariant is how a gate and its report come to disagree, so there is one.
 *
 * ============ LENGTH TRIGGERS THE LOOK. THE SWALLOW SIGNAL DECIDES. ============
 *
 * This distinction cost a run. The promote script's first version cleared a held clause only if its passage
 * was under the 60-word trigger, so after 42001 3.26 was repaired it stayed HELD at 89 words -- and 89 words
 * is the correct entry: the definition plus both of ISO's notes. Length was never the defect. It is the
 * reason to look.
 *
 * So `boundaryVerdict` returns three states, because the question has three answers:
 *
 *   clean       no swallow signal. Under the trigger, or over it and genuinely long.
 *   swallowed   a signal fired. Not promotable, not anchorable.
 *   unknown     the passage is not held, so nothing was examined. Never folded into `clean`.
 */

/** A clause-3 address and nothing else: "3", "3.1", "3.1.2". `A.3.1` is an annex control. */
export const isDefinitionClause = (c) => /^3(?:\.[0-9]+)*$/.test(String(c || ""));

/** The trigger for a look, stated as that and never as a verdict. */
export const WORD_TRIGGER = 60;

export const wordCount = (t) => String(t || "").trim().split(/\s+/).filter(Boolean).length;

/**
 * A container legitimately holds its children's concatenated text, so it is not a swallow.
 * Structural, from what the library holds -- never inferred from length.
 */
export function isDefinitionContainer(clause, clausesOfSameSource) {
  const c = String(clause || "");
  if (!c) return false;
  for (const other of clausesOfSameSource) {
    if (other !== c && String(other).startsWith(c + ".")) return true;
  }
  return false;
}

/**
 * SIGNAL 1 -- a later clause-3 entry inside the text.
 *
 * ISO writes an entry as its number, then the term, then the definition, and the extractor flattens that to
 * "3.17 corrective action ...". An entry that stopped where it should cannot contain its successor in that
 * position. A CROSS-REFERENCE reads "(see 3.4)" or ", 3.4" and is excluded, because a definition citing
 * another is ordinary and would otherwise make every entry suspect.
 */
export function laterEntriesInside(clause, text) {
  const mine = String(clause).split(".").map(Number);
  const hits = [];
  const re = /(?:^|[^0-9.(\[])(3\.[0-9]+(?:\.[0-9]+)*)\s+([a-z][a-z -]{2,40})/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const before = text.slice(Math.max(0, m.index - 12), m.index).toLowerCase();
    if (/see\s*$|,\s*$|and\s*$|\(\s*$|\[\s*$/.test(before)) continue;
    const them = m[1].split(".").map(Number);
    let later = false;
    for (let i = 0; i < Math.max(mine.length, them.length); i++) {
      const a = mine[i] ?? -1, b = them[i] ?? -1;
      if (b > a) { later = true; break; }
      if (b < a) break;
    }
    if (later) hits.push(m[1] + " " + m[2].trim());
  }
  return hits;
}

/**
 * SIGNAL 2 -- the passage ran out of clause 3 altogether.
 *
 * ASKED OF THE DOCUMENT, not guessed. A heading is a clause number followed by the opening words of that
 * clause's OWN declared title, and the titles come from the library. My first version of this check had only
 * signal 1 and reported 42001 3.26 clean while it carried the whole of clause 4.1 -- a regex for "a digit
 * then a capitalised word" would have fired on ordinary prose and on numbered lists instead.
 *
 * @param headings [{clause, needle}] from `headingsOfSource`
 */
export function ranPastClause3(clause, text, headings) {
  const mineTop = Number(String(clause).split(".")[0]);
  const hay = String(text || "");
  const hits = [];
  for (const h of headings) {
    const top = Number(String(h.clause).split(".")[0]);
    if (!Number.isFinite(top) || top <= mineTop) continue;
    if (hay.includes(h.needle)) hits.push(h.needle);
  }
  return hits.sort((a, b) => a.length - b.length);
}

/** Build the heading needles for one source, from the library's own titles. */
export function headingsOfSource(passagesOfSource) {
  const out = [];
  for (const p of passagesOfSource) {
    const t = String(p.title || "").trim();
    if (!t) continue;
    const head = t.split(/\s+/).slice(0, 4).join(" ");
    if (head.length < 8) continue;          /* too short to be distinctive */
    out.push({ clause: String(p.clause), needle: String(p.clause) + " " + head });
  }
  return out;
}

/**
 * The verdict. Three states, and `unknown` is never folded into `clean`.
 *
 * @param passage the held passage, or null/undefined if the library has none
 * @param ctx { clausesOfSameSource: Set<string>, headings: [{clause,needle}] }
 */
export function boundaryVerdict(clause, passage, ctx = {}) {
  if (!passage) {
    return { state: "unknown", words: null, container: false, later: [], beyond: [],
      why: "the library does not hold this clause, so nothing was examined" };
  }
  const text = String(passage.text || "");
  const n = wordCount(text);
  const container = isDefinitionContainer(clause, ctx.clausesOfSameSource || new Set());
  if (container) {
    return { state: "clean", words: n, container: true, later: [], beyond: [],
      why: "a container holds its children's text by design, and the children are held separately" };
  }
  const later = laterEntriesInside(clause, text);
  const beyond = ranPastClause3(clause, text, ctx.headings || []);
  if (later.length || beyond.length) {
    return { state: "swallowed", words: n, container: false, later, beyond,
      why: [later.length ? later.length + " later clause-3 entr" + (later.length === 1 ? "y" : "ies") : null,
        beyond.length ? "ran out of clause 3 at \"" + beyond[0] + "\"" : null].filter(Boolean).join(" AND ") };
  }
  return { state: "clean", words: n, container: false, later: [], beyond: [],
    why: n > WORD_TRIGGER
      ? "over the " + WORD_TRIGGER + "-word trigger and showing no swallow signal -- genuinely long"
      : "under the " + WORD_TRIGGER + "-word trigger" };
}

/* ---------------------------------------------------------------- controls
 * Built from the two real 42001 cases, BOTH SIDES of each repair, because the whole point of this module is
 * that a repaired passage must come back clean while a defective one must not -- and the length-based
 * criterion this replaces got exactly that pair wrong. */
export function definitionBoundaryControls() {
  const out = [];
  const ok = (what, cond, detail) => out.push({ what, pass: !!cond, detail: cond ? null : detail });
  const headings = [{ clause: "4.1", needle: "4.1 Understanding the organization and" }];
  const ctx = { clausesOfSameSource: new Set(["3.16", "3.17", "3.26", "4.1"]), headings };

  /* 3.16 BEFORE: its text was entirely its two successors */
  const before316 = boundaryVerdict("3.16", { text: "3.17 corrective action action to eliminate the " +
    "cause(s) of a nonconformity (3.16) and to prevent recurrence 3.18 audit systematic and independent " +
    "process for obtaining evidence" }, ctx);
  ok("3.16 before the repair is SWALLOWED", before316.state === "swallowed", before316.state);
  /* 3.16 AFTER */
  const after316 = boundaryVerdict("3.16", { text: "nonconformity non-fulfilment of a requirement (3.14)" }, ctx);
  ok("3.16 after the repair is CLEAN", after316.state === "clean", after316.state);

  /* 3.26 BEFORE: correct notes, then the whole of clause 4 */
  const before326 = boundaryVerdict("3.26", { text: "statement of applicability documentation of all " +
    "necessary controls Note 1 to entry: Organizations may not require all controls. 4 Context of the " +
    "organization 4.1 Understanding the organization and its context The organization shall determine" }, ctx);
  ok("3.26 before the repair is SWALLOWED (signal 2, which signal 1 cannot see)",
    before326.state === "swallowed" && before326.beyond.length > 0 && before326.later.length === 0,
    before326.state + " later=" + before326.later.length + " beyond=" + before326.beyond.length);

  /* 3.26 AFTER: 89 words, OVER the trigger, and CLEAN. This is the case the length criterion got wrong. */
  const after326 = boundaryVerdict("3.26", { text: ("statement of applicability documentation of all " +
    "necessary controls and justification for inclusion or exclusion of controls Note 1 to entry: " +
    "Organizations may not require all controls listed in Annex A or may even exceed the list in Annex A " +
    "with additional controls established by the organization itself. Note 2 to entry: All identified risks " +
    "shall be documented by the organization according to the requirements of this document and reflected " +
    "in the statement of applicability with the risk management measures established to address them.") }, ctx);
  ok("3.26 after the repair is CLEAN THOUGH OVER THE TRIGGER", after326.state === "clean",
    after326.state + " at " + after326.words + "w");
  ok("...and it really is over the trigger, or that control proves nothing",
    after326.words > WORD_TRIGGER, after326.words + "w is not over " + WORD_TRIGGER);

  /* a container is clean by construction */
  const cont = boundaryVerdict("3", { text: "3.1 organization person or group 3.2 interested party" },
    { clausesOfSameSource: new Set(["3", "3.1", "3.2"]), headings });
  ok("a container is CLEAN, not swallowed", cont.state === "clean" && cont.container, cont.state);

  /* a cross-reference must not fire signal 1 */
  const xref = boundaryVerdict("3.15", { text: "conformity fulfilment of a requirement (3.14) see 3.16 " +
    "nonconformity for the converse" }, ctx);
  ok("a cross-reference does not fire signal 1", xref.state === "clean", xref.why);

  /* an absent passage is UNKNOWN, never clean */
  const miss = boundaryVerdict("3.99", null, ctx);
  ok("an absent passage is UNKNOWN, never clean", miss.state === "unknown", miss.state);
  return out;
}
