/**
 * de-cue-checks.mjs - two CODE checks on a de-cue rewrite. Both REVERT to the original.
 *
 * ============ WHY THESE TWO, AND WHY THEY REVERT ============
 *
 * The director read all 24 de-cued items in pilot 4 against their originals. The retry did its job on
 * five of them. It also did three things no gate could see, and two of those are what these check:
 *
 *   IT BROKE ITS OWN NO-ABSOLUTES RULE. Item #2 (task 1.4) came back with absolutes in all three
 *   rewritten distractors -- "entirely separate", "must be surrendered", "offers no practical
 *   overlap" -- where the originals had none. The prompt forbids exactly that, and a prompt rule
 *   nothing checks is a rule the writer breaks when it is convenient.
 *
 *   IT REPLACED REAL REFERENCES WITH INVENTED ONES. Item #22 (task 4.5) had three real Annex A
 *   controls as distractors -- A.8.4, A.8.5, data acquisition -- and came back with invented
 *   processes. That item's whole point was telling real controls apart, so symmetry went up and the
 *   thing it measured went away.
 *
 * REVERT, NEVER REJECT. The original passed every gate and the solver; a failed improvement must not
 * cost a sound item. Same rule as the solver arm of the retry.
 *
 * ============ THE PRINCIPLE THESE ENFORCE ============
 *
 * Reshape a distractor, never replace it: keep the underlying misconception and the thing it names --
 * the same control, clause, actor or step -- and change only its FORM. These two checks are the
 * mechanical half of that. The rest (is the misconception still plausible) is a human read, and the
 * markdown the runner emits is what that read works from.
 */

/* ABSOLUTES, including the multi-word forms the director named. `only` and `all` are here as whole
 * words: "not only" is handled by the caller's widener test in shape-cues, and an absolute ADDED by a
 * rewrite is the subject here regardless of how it reads. */
const ABSOLUTE_PATTERNS = [
  /\bonly\b/i, /\bevery\b/i, /\ball\b/i, /\balways\b/i, /\bnever\b/i, /\bentirely\b/i,
  /\bwholly\b/i, /\bexclusively\b/i, /\bsolely\b/i, /\bany\b/i, /\bno\s+\w+\s+at\s+all\b/i,
  /\bmust\s+be\s+surrendered\b/i, /\boffers\s+no\b/i, /\bwithout\s+exception\b/i,
  /\bin\s+all\s+cases\b/i, /\bunder\s+no\s+circumstances\b/i,
];

const absolutesIn = (text) => ABSOLUTE_PATTERNS
  .filter((re) => re.test(String(text || "")))
  .map((re) => String(re).replace(/^\/\\b|\\b\/i$|^\/|\/i$/g, "").replace(/\\s\+/g, " "));

/**
 * NEW ABSOLUTES: an absolute in the rewrite that was not in the original.
 *
 * Compared PER DISTRACTOR against its own original, not against the option set: an absolute that was
 * always there is the item's business, and one the rewrite introduced is the defect.
 */
export function newAbsolutes(originals, rewrites) {
  const found = [];
  for (let i = 0; i < Math.min(originals.length, rewrites.length); i++) {
    const before = new Set(absolutesIn(originals[i]));
    for (const a of absolutesIn(rewrites[i])) {
      if (!before.has(a)) found.push({ index: i, absolute: a });
    }
  }
  return found;
}

/* A clause or control address. Two shapes: an annex control (A.8.4, B.6.2.6) and a bare clause
 * (6.1.4, 9.2). A lone integer is NOT an address -- "4 options", "clause 4" without a decimal, a
 * count -- so at least one dot is required. */
const ADDRESS = /\b(?:[A-D]\.)?\d+(?:\.\d+){1,3}\b|\b[A-D]\.\d+(?:\.\d+)*\b/g;

const addressesIn = (text) => {
  const out = new Set();
  for (const m of String(text || "").matchAll(ADDRESS)) out.add(m[0]);
  return out;
};

/**
 * CHANGED REFERENCE: an address, or a named Annex control TITLE, present in the original distractor
 * and gone from its rewrite.
 *
 * `controlTitles` is resolved against the LIBRARY by the caller, not typed here -- a hand-written list
 * of control names would go stale the first time a source is re-extracted, and this repository has
 * paid for a typed second copy of a library fact more than once.
 *
 * A title counts only at 12 characters or more AND only if it is a PHRASE -- more than one word.
 * The length floor alone was not enough: ISO/IEC 42001's Annex A has single-word control titles like
 * "Accountability" and "Transparency", which are 14 and 12 characters and are also ordinary nouns. On
 * the first real run that fired a revert on a rewrite whose only sin was not repeating the word
 * "accountability", which is the lexical-proxy error this check was written to avoid.
 *
 * A multi-word title -- "Information deletion", "AI system impact assessment" -- cannot be used
 * casually in a sentence about something else, so it is evidence. A single word is not.
 */
export function changedReference(originals, rewrites, controlTitles = []) {
  const titles = controlTitles
    .map((t) => String(t || "").toLowerCase().trim())
    .filter((t) => t.length >= 12 && /\s/.test(t));
  const found = [];
  for (let i = 0; i < Math.min(originals.length, rewrites.length); i++) {
    const a = String(originals[i] || ""), b = String(rewrites[i] || "");
    for (const addr of addressesIn(a)) {
      if (!addressesIn(b).has(addr)) found.push({ index: i, lost: addr, kind: "address" });
    }
    const al = a.toLowerCase(), bl = b.toLowerCase();
    for (const t of titles) {
      if (al.includes(t) && !bl.includes(t)) found.push({ index: i, lost: t, kind: "control title" });
    }
  }
  return found;
}

/** Both checks, as a revert decision. */
export function deCueRewriteCheck(originals, rewrites, controlTitles = []) {
  const abs = newAbsolutes(originals, rewrites);
  const ref = changedReference(originals, rewrites, controlTitles);
  return {
    revert: abs.length > 0 || ref.length > 0,
    new_absolutes: abs,
    changed_references: ref,
    reason: abs.length || ref.length
      ? [abs.length ? abs.length + " new absolute(s): " + abs.map((x) => x.absolute).join(", ") : null,
         ref.length ? ref.length + " lost reference(s): " + ref.map((x) => x.lost).join(", ") : null]
        .filter(Boolean).join("; ")
      : null,
  };
}

/** Controls, both directions for both checks, from the director's own examples. */
export function deCueCheckControls() {
  const fails = [];
  const fires = (r, label) => { if (!r.revert) fails.push(label + ": expected a revert, got none"); };
  const quiet = (r, label) => { if (r.revert) fails.push(label + ": expected no revert, got " + r.reason); };

  /* #2 (1.4), the absolutes case, in his words. */
  fires(deCueRewriteCheck(
    ["A certification audit and an internal audit serve different purposes and can share evidence",
     "The programme may be combined where scope allows",
     "Surrender of the certificate is one option among several"],
    ["An entirely separate programme is required",
     "The certificate must be surrendered before any transfer",
     "A combined approach offers no practical overlap"]), "new absolutes fire");

  quiet(deCueRewriteCheck(
    ["The programme may be combined where scope allows"],
    ["A combined programme is permitted when the scopes align"]), "no revert on a clean reshape");

  /* An absolute that was ALREADY there is the item's business, not the rewrite's. */
  quiet(deCueRewriteCheck(
    ["Only the certification body may decide"],
    ["Only the certification body is permitted to decide"]), "pre-existing absolute is not new");

  /* #22 (4.5), the lost-reference case. */
  fires(deCueRewriteCheck(
    ["Control A.8.4 on access to source code", "Control A.8.5 on secure authentication"],
    ["A process for reviewing developer permissions", "A procedure for login hardening"]),
    "lost address fires");

  quiet(deCueRewriteCheck(
    ["Control A.8.4 on access to source code"],
    ["Control A.8.4, which governs access to program source code"]), "kept address is quiet");

  /* A control TITLE resolved from the library, lost in the rewrite. */
  fires(deCueRewriteCheck(
    ["The organization applies information deletion to the training corpus"],
    ["The organization removes old records from the training corpus"],
    ["Information deletion", "Data masking", "Access"]), "lost control title fires");

  /* A short "title" must not be able to fire: `Access` is a word, not a reference. */
  quiet(deCueRewriteCheck(
    ["Access is granted by the owner"],
    ["Permission is granted by the owner"],
    ["Access"]), "a sub-12-character title cannot fire");

  /* AND NEITHER CAN A LONG SINGLE WORD. `Accountability` is a real 42001 Annex A control title, 14
   * characters, and also an ordinary noun -- it fired a revert on the first real run against a
   * rewrite whose only sin was not repeating it. A reference has to be a phrase. */
  quiet(deCueRewriteCheck(
    ["The board retains accountability for the outcome"],
    ["The board remains answerable for the outcome"],
    ["Accountability", "Transparency"]), "a long single-word title cannot fire");

  /* An integer is not an address. */
  quiet(deCueRewriteCheck(
    ["The team reviews 4 records each quarter"],
    ["The team reviews a sample of records each quarter"]), "a bare integer is not an address");

  return { examined: 9, fails };
}
