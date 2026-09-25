/**
 * declared-english-edits.mjs -- every edit made to an English lesson body since
 * migration 367 stamped `en_content_hash`, in one place.
 *
 * ============ WHY THIS IS A MODULE AND NOT A LITERAL IN TWO SCRIPTS ==========
 *
 * Two consumers need exactly this list and they need it to mean the same thing:
 *
 *   build-batch1-final.mjs   replays the edits FORWARD, to refresh a stale
 *                            english_source so the gates compare against the
 *                            English the translation was actually made from;
 *   stamp-proved-provenance  replays them BACKWARD, to prove the live English
 *                            differs from the stamped English by exactly these
 *                            edits and nothing else.
 *
 * A second hand-written copy of one idea diverges, and the divergence here would
 * surface as a provenance stamp vouching for an English nobody checked. This
 * repository's rule: a computation with a stated invariant has exactly one
 * implementation.
 *
 * ============ WHAT MAY GO IN HERE ============
 *
 * An entry is a claim that a HUMAN-REVIEWED script made this exact substitution
 * to this exact lesson, after 367, and that the script is in git. `by` names it
 * so the claim can be checked rather than believed. Anything not listed here is
 * an UNDECLARED English change, and the backward replay is what detects one: if
 * reversing this list does not reproduce the stamped hash, something else moved.
 *
 * The 2026-09-23 ceiling conversions are deliberately ABSENT. 367 stamped after
 * they landed the same day, so the stamp already records post-conversion English
 * and reversing them would over-shoot.
 */

export const DECLARED_ENGLISH_EDITS = [
  {
    slug: "03-02-awareness-and-communication",
    by: "fix-english-template-sentences.mjs",
    why: "clause 7.4 does not require anyone to use a verb; it uses one",
    from: "Clause 7.4 requires the organization to use the reserved verb **determine**, which imports a recorded decision rather than an impression: what must be decided and written down is which communications are **relevant** to the management system, those inside the organization and those with the world outside it, and names four things it must decide:",
    to: "Clause 7.4 uses the reserved verb **determine**, which imports a recorded decision rather than an impression. What the organization has to decide, and write down, is which communications are **relevant** to the management system, both inside the organization and with the world outside it, and the clause names four things the organization must decide:",
  },
  {
    slug: "03-04-operational-planning-and-control",
    by: "fix-english-template-sentences.mjs",
    why: "clause 8.1 does not require the organization to name obligations; it names them",
    from: "Clause 8.1 requires the organization to name three obligations, of which **implement** is the middle one: the organization plans its processes, implements them, and then controls them, carrying out the actions **determined** under clause 6, and it says how: by establishing [criteria for the processes]{glossary=\"process-criteria\"}, and by implementing control of the processes in accordance with those criteria.",
    to: "Clause 8.1 names three obligations, of which **implement** is the middle one: the organization plans its processes, implements them, and then controls them, carrying out the actions **determined** under clause 6. The clause also says how: by establishing [criteria for the processes]{glossary=\"process-criteria\"}, and by implementing control of the processes in accordance with those criteria.",
  },
  {
    slug: "05-02-aims-internal-audit",
    by: "fix-english-template-sentences.mjs",
    why: "as written the rule IS the failure; the Spanish then said auditing your own work is good practice",
    from: "The own-work rule is the canonical way of failing that and is sound practice, but attributing it to this standard's text is a misattribution.",
    to: "Auditing one's own work is the canonical way of failing that, and a rule against it is sound practice, but attributing that rule to this standard's text is a misattribution.",
  },
  {
    slug: "01-03-the-ai-system-life-cycle",
    by: "fix-0103-seam.mjs",
    why: "a span replacement ate the noun `assessments` and the sentence boundary with it",
    from: "run risk assessments and impact Clause 8.2 sets",
    to: "run risk assessments and impact assessments. Clause 8.2 sets",
  },
];

/** Edits declared for one slug. */
export const editsFor = (slug) => DECLARED_ENGLISH_EDITS.filter((e) => e.slug === slug);

/**
 * Replay the declared edits BACKWARD over a live English body: turn each `to`
 * back into its `from`.
 *
 * Returns `{ ok, text, applied, why }`. Every reversal must hit EXACTLY ONCE --
 * zero means the edit is not in this body, more than one means the anchor is not
 * unique and the result would be ambiguous. Either refuses.
 */
export function reverseDeclaredEdits(slug, liveEnglish) {
  const applied = [];
  let text = liveEnglish;
  for (const e of editsFor(slug)) {
    const n = text.split(e.to).length - 1;
    if (n !== 1) {
      return { ok: false, text: null, applied,
        why: e.by + ": the post-edit text occurs " + n + " time(s), must be exactly 1" };
    }
    text = text.replace(e.to, e.from);
    applied.push(e);
  }
  return { ok: true, text, applied, why: "" };
}

/** Forward replay, for the consumer that refreshes a stale english_source. */
export function applyDeclaredEdits(slug, storedEnglish) {
  const applied = [];
  let text = storedEnglish;
  for (const e of editsFor(slug)) {
    const n = text.split(e.from).length - 1;
    if (n === 0) continue;
    if (n !== 1) {
      return { ok: false, text: null, applied,
        why: e.by + ": the pre-edit text occurs " + n + " time(s), must be 0 or 1" };
    }
    text = text.replace(e.from, e.to);
    applied.push(e);
  }
  return { ok: true, text, applied, why: "" };
}

/** Fixtures. A replay that silently does nothing would vouch for any English. */
export function declaredEditControls() {
  const bad = [];
  const e = DECLARED_ENGLISH_EDITS.find((x) => x.slug === "01-03-the-ai-system-life-cycle");
  if (!e) { bad.push("the 01-03 seam edit is missing"); return bad; }

  const pre = "Prose before. " + e.from + " Prose after.";
  const post = "Prose before. " + e.to + " Prose after.";

  const back = reverseDeclaredEdits(e.slug, post);
  if (!back.ok || back.text !== pre) bad.push("backward replay did not reproduce the pre-edit text");

  const fwd = applyDeclaredEdits(e.slug, pre);
  if (!fwd.ok || fwd.text !== post) bad.push("forward replay did not reproduce the post-edit text");

  /* ROUND TRIP. Forward then backward must return the original byte for byte. */
  const round = reverseDeclaredEdits(e.slug, applyDeclaredEdits(e.slug, pre).text);
  if (!round.ok || round.text !== pre) bad.push("forward then backward is not the identity");

  /* ABSENT must refuse, not silently pass -- a body that does not contain the
   * edit cannot be proved to have received it. */
  const missing = reverseDeclaredEdits(e.slug, "nothing relevant here at all");
  if (missing.ok) bad.push("reversing an edit that is absent should refuse");

  /* DUPLICATED must refuse: two anchors make the reversal ambiguous. */
  const twice = reverseDeclaredEdits(e.slug, post + "\n\n" + post);
  if (twice.ok) bad.push("reversing a non-unique anchor should refuse");

  return bad;
}
