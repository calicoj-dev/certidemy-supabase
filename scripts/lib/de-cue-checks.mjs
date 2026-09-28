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

/* ============ CHECK 3: NO NEW CODE CUE ============
 *
 * A rewrite may not introduce a cue the original did not have. From the director's read of pilot 4:
 * task 2.6 and task 4.1 both went none -> clang, and 2.8 swapped clang -> opposite-pair. Trading one
 * cue for another is not an improvement, and adding one to a clean item is a regression.
 *
 * This is a DELTA use of the cue rules, which is the use they are sound for. Their absolute rates are
 * another matter -- clang fires on 43 percent of the secure bank -- but "a cue appeared where there was
 * none" is a comparison within one item and does not depend on the rate.
 */
export function newCodeCue(cuesBefore, cuesAfter) {
  const before = new Set(cuesBefore || []);
  return [...new Set(cuesAfter || [])].filter((id) => !before.has(id));
}

/* ============ CHECK 4: THE TRIGGERING CUE MUST CLEAR ============
 *
 * A rewrite that leaves the cue it was called for is not worth the plausibility risk it carries. Pilot
 * 4 task 4.3 went clang -> clang: the distractors changed, the cue did not, and the item absorbed a
 * rewrite for nothing.
 */
export function triggerCleared(cuesBefore, cuesAfter) {
  const after = new Set(cuesAfter || []);
  const remaining = [...new Set(cuesBefore || [])].filter((id) => after.has(id));
  return { cleared: remaining.length === 0, remaining };
}

/* ============ CHECK 5: THE LIMITER IS WHAT MAKES A DISTRACTOR WRONG ============
 *
 * A restrictive limiter is often the ENTIRE reason a distractor is false. Drop it and the distractor
 * becomes defensible, which moves the item toward a second correct answer -- the worst failure a
 * distractor rewrite can produce, and invisible to every other check here.
 *
 * Both instances from pilot 4:
 *
 *   3.2 options 2 and 3   "within scope ONCE X"          -> "within scope, AND X"
 *   5.1 option 3          "would close the gap ON ITS OWN" -> "IS the evidence this clause asks for"
 *
 * In the first, `once` made the claim conditional and `and` makes it true. In the second, `on its own`
 * was the whole error and its removal makes the option a correct statement.
 *
 * Compared PER DISTRACTOR against its own original: a limiter elsewhere in the option set is not a
 * substitute for the one this distractor lost.
 */
export const LIMITERS = [
  "only", "once", "alone", "on its own", "instead", "rather than", "without", "until",
  "before", "merely", "solely",
];

/* ============ "OR AN EQUIVALENT" IS HALF THE RULE, AND THE FIRST VERSION DROPPED IT ============
 *
 * The ruling is that the rewrite must keep the limiter OR AN EQUIVALENT. My first implementation fired
 * per LIMITER -- `until` gone means fire -- which reported drift on four items the director's own read
 * kept. Reading the members showed why:
 *
 *   2.7 opt2   "Hold the impact work open UNTIL risk levels have been determined"
 *           -> "Determine the risk levels first, then insert them ... BEFORE treatment planning"
 *
 * `until` left and `before` arrived. The restriction is intact and the check called it a loss. So the
 * unit is the OPTION, not the word: a rewrite carrying ANY limiter from the list has kept an
 * equivalent, and only an option that carries NONE has dropped the restriction.
 *
 * WHAT THIS STILL CANNOT SEE, stated rather than tuned away. Three of the four members carry the
 * restriction in words that are not on any list:
 *
 *   3.4 opt3   "DEFER review ... UNTIL the next audit"  ->  "review ... AT THE NEXT scheduled audit"
 *   3.6 opt2   "parties WITHOUT authorization"          ->  "parties the system HAS NOT authorized"
 *   2.5 opt3   "DEFER ... UNTIL the model is running"   ->  "SHIFT ... OUT OF the analysis"
 *
 * Those read as preserved to me. Extending the list until they pass would be fitting the rule to the
 * expected count -- the error this repository records against every threshold that was adjusted after
 * seeing its result. They are reported as members for a human instead.
 *
 * The one I read as a REAL loss is 2.5 opt1: "with justification for included and excluded controls
 * BEFORE rating risks" -> "justifying included and excluded controls, AND attach it to the analysis".
 * The ordering WAS the error, and the rewrite states no ordering at all.
 */
const limiterRe = (lim) => new RegExp("(?<![\\w-])" + lim.replace(/ /g, "\\s+") + "(?![\\w-])", "i");
const limitersIn = (t) => LIMITERS.filter((lim) => limiterRe(lim).test(String(t || "")));

export function limiterDropped(originals, rewrites) {
  const found = [];
  for (let i = 0; i < Math.min(originals.length, rewrites.length); i++) {
    const had = limitersIn(originals[i]);
    if (!had.length) continue;
    const kept = limitersIn(rewrites[i]);
    if (kept.length) continue;                 // any limiter is an equivalent
    found.push({ index: i, limiter: had.join(", "), kept: null });
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

  /* ============ CHECKS 3, 4 AND 5, WITH THE PILOT-4 ITEM THAT MOTIVATED EACH ============ */

  /* CHECK 3 -- 2.6 and 4.1 went none -> clang; 2.8 swapped clang -> opposite-pair. */
  if (!newCodeCue([], ["clang"]).length) fails.push("check 3: a cue appearing from none did not fire");
  if (!newCodeCue(["clang"], ["opposite-pair"]).length) fails.push("check 3: a swapped cue did not fire");
  if (newCodeCue(["clang"], ["clang"]).length) fails.push("check 3: an unchanged cue must not count as new");
  if (newCodeCue(["clang", "key-length"], ["clang"]).length) {
    fails.push("check 3: clearing a cue must not read as adding one");
  }

  /* CHECK 4 -- 4.3 went clang -> clang: the rewrite changed the text and not the cue. */
  if (triggerCleared(["clang"], ["clang"]).cleared) fails.push("check 4: an uncleared trigger passed");
  if (!triggerCleared(["clang"], []).cleared) fails.push("check 4: a cleared trigger was reported uncleared");
  if (!triggerCleared(["key-length"], ["clang"]).cleared) {
    fails.push("check 4: the trigger cleared but a DIFFERENT cue appeared -- that is check 3's job, not this one");
  }

  /* CHECK 5 -- the two real drifts, in the director's own words. */
  if (!limiterDropped(["The tool is within scope once the output controls access"],
    ["The tool is within scope, and the output controls access"]).length) {
    fails.push("check 5: pilot 4 task 3.2 -- dropping `once` did not fire");
  }
  if (!limiterDropped(["Reviewing the log would close the gap on its own"],
    ["Reviewing the log is the evidence this clause asks for"]).length) {
    fails.push("check 5: pilot 4 task 5.1 -- dropping `on its own` did not fire");
  }
  if (limiterDropped(["The tool is within scope only once the output controls access"],
    ["Only once the output controls access is the tool within scope"]).length) {
    fails.push("check 5: a limiter that survives a reordering must not fire");
  }
  if (limiterDropped(["The programme may be combined where scope allows"],
    ["A combined programme is permitted when the scopes align"]).length) {
    fails.push("check 5: an option with no limiter must not fire");
  }
  /* OR AN EQUIVALENT -- pilot 4 task 2.7, verbatim. `until` leaves and `before` arrives, so the
   * restriction is intact. Firing here is what made the first version disagree with the read. */
  if (limiterDropped(["Hold the impact work open until risk levels have been determined, then insert those levels into it"],
    ["Determine the risk levels first, then insert them into the impact assessment before treatment planning"]).length) {
    fails.push("check 5: a DIFFERENT limiter in the rewrite must count as the equivalent (task 2.7)");
  }
  /* A limiter in ANOTHER distractor is not a substitute for the one this distractor lost. */
  if (!limiterDropped(["It applies once the model is retrained", "It applies only to new models"],
    ["It applies when the model is retrained", "It applies only to new models"]).length) {
    fails.push("check 5: per-distractor comparison failed -- a sibling's limiter masked a loss");
  }

  /* An integer is not an address. */
  quiet(deCueRewriteCheck(
    ["The team reviews 4 records each quarter"],
    ["The team reviews a sample of records each quarter"]), "a bare integer is not an address");

  return { examined: 23, fails };
}
