/**
 * declared-english-edits.mjs -- every edit made to an English lesson body since
 * migration 367 stamped `en_content_hash`, in one place, in order.
 *
 * ============ WHY THIS IS A MODULE AND NOT A LITERAL IN TWO SCRIPTS ==========
 *
 * Two consumers need exactly this list and they need it to mean the same thing:
 *
 *   build-batch1-final.mjs   replays edits FORWARD, to refresh a stale
 *                            english_source so the gates compare against the
 *                            English the translation was actually made from;
 *   stamp-proved-provenance  replays them BACKWARD, to prove the live English
 *                            differs from the stamped English by exactly these
 *                            edits and nothing else.
 *
 * A second hand-written copy of one idea diverges, and the divergence here would
 * surface as a provenance stamp vouching for an English nobody checked.
 *
 * ============ A STAMP ABSORBS THE EDITS IT WAS PROVED AGAINST ================
 *
 * This is the part the first version got wrong, and it would have been silent.
 *
 * On 2026-09-25 four lessons were stamped `proved` against their post-edit
 * English. Those edits are now INSIDE the stamp. Reversing the whole list after
 * that overshoots: it reconstructs an English two generations old and the hash
 * comparison fails against a database that is perfectly correct -- the literal-
 * assertion failure this repository records four times over, wearing a replay.
 *
 * So the list is ORDERED by `seq` and a consumer reverses a SUFFIX. The prover
 * tries k = 0, 1, 2 ... and accepts the smallest k whose reversed body hashes to
 * the stored stamp. k = 0 means the stamp is already current and there is
 * nothing to prove. No epoch has to be recorded anywhere, because the stamp
 * itself says which suffix is outstanding.
 *
 * ============ WHAT MAY GO IN HERE ============
 *
 * An entry is a claim that a HUMAN-REVIEWED script made this exact substitution
 * to this exact lesson, after 367, and that the script is in git. `by` names it
 * so the claim can be checked rather than believed. Anything not listed is an
 * UNDECLARED English change, and the backward replay is what detects one: if no
 * suffix reproduces the stamped hash, something else moved.
 *
 * The 2026-09-23 ceiling conversions are deliberately ABSENT. 367 stamped after
 * they landed the same day, so the stamp already records post-conversion English.
 *
 * ============ `translatedIn` -- WHO ALREADY TRACKS THIS EDIT ============
 *
 * The provenance proof has two halves: the hash equality shows WHICH edits moved
 * the English, and a second test shows the translation actually followed them.
 * That second test originally read BATCH1-FINAL.json, because the only edits in
 * the list were ones a batch had retranslated.
 *
 * An edit applied OUTSIDE a batch needs somewhere to say the same thing.
 * `translatedIn` lists the languages whose translation of THIS span was updated
 * by the same commit -- so the claim travels with the edit instead of living in
 * an artifact that happens to be lying around, and an edit with no `translatedIn`
 * and no batch block is REFUSED rather than assumed.
 */

export const DECLARED_ENGLISH_EDITS = [
  {
    seq: 1,
    slug: "03-02-awareness-and-communication",
    by: "fix-english-template-sentences.mjs",
    why: "clause 7.4 does not require anyone to use a verb; it uses one",
    from: "Clause 7.4 requires the organization to use the reserved verb **determine**, which imports a recorded decision rather than an impression: what must be decided and written down is which communications are **relevant** to the management system, those inside the organization and those with the world outside it, and names four things it must decide:",
    to: "Clause 7.4 uses the reserved verb **determine**, which imports a recorded decision rather than an impression. What the organization has to decide, and write down, is which communications are **relevant** to the management system, both inside the organization and with the world outside it, and the clause names four things the organization must decide:",
  },
  {
    seq: 2,
    slug: "03-04-operational-planning-and-control",
    by: "fix-english-template-sentences.mjs",
    why: "clause 8.1 does not require the organization to name obligations; it names them",
    from: "Clause 8.1 requires the organization to name three obligations, of which **implement** is the middle one: the organization plans its processes, implements them, and then controls them, carrying out the actions **determined** under clause 6, and it says how: by establishing [criteria for the processes]{glossary=\"process-criteria\"}, and by implementing control of the processes in accordance with those criteria.",
    to: "Clause 8.1 names three obligations, of which **implement** is the middle one: the organization plans its processes, implements them, and then controls them, carrying out the actions **determined** under clause 6. The clause also says how: by establishing [criteria for the processes]{glossary=\"process-criteria\"}, and by implementing control of the processes in accordance with those criteria.",
  },
  {
    seq: 3,
    slug: "05-02-aims-internal-audit",
    by: "fix-english-template-sentences.mjs",
    why: "as written the rule IS the failure; the Spanish then said auditing your own work is good practice",
    from: "The own-work rule is the canonical way of failing that and is sound practice, but attributing it to this standard's text is a misattribution.",
    to: "Auditing one's own work is the canonical way of failing that, and a rule against it is sound practice, but attributing that rule to this standard's text is a misattribution.",
  },
  {
    seq: 4,
    slug: "01-03-the-ai-system-life-cycle",
    by: "fix-0103-seam.mjs",
    why: "a span replacement ate the noun `assessments` and the sentence boundary with it",
    from: "run risk assessments and impact Clause 8.2 sets",
    to: "run risk assessments and impact assessments. Clause 8.2 sets",
  },

  /* ---- 2026-09-25, the own-work attribution. THE CLAIM IS FALSE, NOT MERELY
   * INVERTED: the maxim is in NEITHER ISO/IEC 27001 NOR ISO 19011:2026, searched
   * full-text and recorded in HANDOFF-v6_2.md section 2 as zero hits. 19011
   * clause 4.6 asks for independence wherever practicable and, where that is not
   * possible, every effort to remove bias. `isms-ia-01-03` already teaches that
   * correctly; AIMS-F 05-02 contradicted it in two places, one of them a GRADED
   * ANSWER. ---- */
  {
    seq: 5,
    /* The SAME commit updated the translation of this span in these languages, so
     * a provenance proof may count this edit as tracked for those rows even though
     * no batch block declares it. See `translatedIn` in the header. */
    translatedIn: ["es-419", "pt-BR"],
    slug: "05-02-aims-internal-audit",
    by: "fix-own-work-attribution.mjs",
    why: "the callout attributed the own-work rule to ISO 19011; it is in neither standard",
    from: "The standard's requirement is **objectivity and impartiality of the audit process.** The familiar rule that auditors must not audit their own work is the canonical way of failing that requirement, and it is sound practice — but it is guidance from ISO 19011 rather than text in this standard. Stating it as what ISO/IEC 42001 says is the kind of small misattribution that spreads easily and is worth being precise about.",
    to: "The standard's requirement is **objectivity and impartiality of the audit process.** It does not name the familiar rule that auditors must not audit their own work, and neither does ISO 19011: its independence principle asks for independence wherever practicable and, where that is not possible, every effort to remove bias. Auditing one's own work is the canonical way of failing the requirement, and a rule against it is how audit practice delivers what the standard asks — but stating that rule as what ISO/IEC 42001 says is the kind of small misattribution that spreads easily and is worth being precise about.",
  },
  {
    seq: 6,
    /* The SAME commit updated the translation of this span in these languages, so
     * a provenance proof may count this edit as tracked for those rows even though
     * no batch block declares it. See `translatedIn` in the header. */
    translatedIn: ["es-419", "pt-BR"],
    slug: "05-02-aims-internal-audit",
    by: "fix-own-work-attribution.mjs",
    why: "q2 option b is the CORRECT answer and marked learners right for a false attribution",
    from: "the own-work rule is ISO 19011 guidance",
    to: "the own-work rule is audit practice, not text in either standard",
  },
  {
    seq: 7,
    /* The SAME commit updated the translation of this span in these languages, so
     * a provenance proof may count this edit as tracked for those rows even though
     * no batch block declares it. See `translatedIn` in the header. */
    translatedIn: ["es-419", "pt-BR"],
    slug: "isms-ia-01-03-objectivity-of-the-assignment",
    by: "fix-own-work-attribution.mjs",
    why: "the rule described as the way to fail; the safeguard is not the failure",
    from: "It is a good rule of thumb and the canonical way to fail 9.2.2 b) - but it is not a quotation from either standard, and it should not be presented as one.",
    to: "Auditing your own work is the canonical way to fail 9.2.2 b), and the rule against it is a good rule of thumb - but it is not a quotation from either standard, and it should not be presented as one.",
  },
  {
    seq: 8,
    /* Both translations were retranslated in the same session and reviewed by the
     * director, so this edit is tracked for both rows. */
    translatedIn: ["es-419", "pt-BR"],
    slug: "05-01-aims-monitoring-and-measurement",
    by: "apply-0501-english.mjs",
    why: "a 12-word reproduction of ISO/IEC 42001 Annex B B.6.2.6 withheld all three rows; the clause is now named instead of copied",
    from: "The guidance warns against a specific error in choosing performance criteria: the organization should consider the performance of non-AI systems or processes already in operation and use them as relevant context.",
    to: "ISO/IEC 42001 Annex B, B.6.2.6 warns against a specific error in choosing performance criteria. Whatever the AI system displaced is usually still running somewhere -- a manual workflow, a rule engine, an older model -- and how well it performs should be treated as context when the criteria are set.",
  },
  {
    seq: 9,
    translatedIn: ["es-419", "pt-BR"],
    slug: "05-01-aims-monitoring-and-measurement",
    by: "apply-0501-english.mjs",
    why: "9w of the same clause, inside the drafting margin; `drift` replaced with `go wrong` because drift is a term this certification teaches about the MODEL, not about use",
    from: "The guidance adds a related item that is easy to miss: where systems are being used for purposes other than those they were designed for, or in ways nobody anticipated, whether those uses are appropriate should be considered.",
    to: "B.6.2.6 adds a related item that is easy to miss. A system can go wrong because people started pointing it at something else, not because the model moved: a job it was never designed to do, or one nobody foresaw. Whether such a use is still appropriate should itself be considered.",
  },
];

/** Edits declared for one slug, in sequence order. */
export const editsFor = (slug) =>
  DECLARED_ENGLISH_EDITS.filter((e) => e.slug === slug).sort((a, b) => a.seq - b.seq);

/**
 * Reverse the LAST `k` declared edits for a slug over a live English body.
 *
 * `k = 0` returns the body untouched, which is the "the stamp is already
 * current" case and must be available as an answer. Every reversal must hit
 * EXACTLY ONCE: zero means the edit is not in this body, more than one means the
 * anchor is ambiguous. Either refuses.
 */
export function reverseLastK(slug, liveEnglish, k) {
  const all = editsFor(slug);
  if (k < 0 || k > all.length) return { ok: false, text: null, applied: [], why: "k out of range" };
  const chosen = all.slice(all.length - k);
  let text = liveEnglish;
  const applied = [];
  /* Newest first: a later edit may sit inside text an earlier one produced. */
  for (const e of [...chosen].reverse()) {
    const n = text.split(e.to).length - 1;
    if (n !== 1) {
      return { ok: false, text: null, applied,
        why: e.by + " (seq " + e.seq + "): the post-edit text occurs " + n + " time(s), must be exactly 1" };
    }
    text = text.replace(e.to, e.from);
    applied.push(e);
  }
  return { ok: true, text, applied, why: "" };
}

/** How many declared edits exist for a slug -- the largest suffix worth trying. */
export const editCount = (slug) => editsFor(slug).length;

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

  /* seq must be unique and dense enough to order unambiguously. */
  const seqs = DECLARED_ENGLISH_EDITS.map((e) => e.seq);
  if (new Set(seqs).size !== seqs.length) bad.push("duplicate seq values -- the order is ambiguous");
  for (const e of DECLARED_ENGLISH_EDITS) {
    if (!e.by || !e.why || !e.from || !e.to) bad.push("seq " + e.seq + " is missing a required field");
    if (e.from === e.to) bad.push("seq " + e.seq + " is a no-op");
  }

  const e = DECLARED_ENGLISH_EDITS.find((x) => x.slug === "01-03-the-ai-system-life-cycle");
  if (!e) { bad.push("the 01-03 seam edit is missing"); return bad; }
  const pre = "Prose before. " + e.from + " Prose after.";
  const post = "Prose before. " + e.to + " Prose after.";

  if (reverseLastK(e.slug, post, 1).text !== pre) bad.push("reverseLastK(1) did not reproduce the pre-edit text");
  if (reverseLastK(e.slug, post, 0).text !== post) bad.push("reverseLastK(0) must be the identity");
  if (applyDeclaredEdits(e.slug, pre).text !== post) bad.push("forward replay did not reproduce the post-edit text");
  if (reverseLastK(e.slug, applyDeclaredEdits(e.slug, pre).text, 1).text !== pre) {
    bad.push("forward then backward is not the identity");
  }
  if (reverseLastK(e.slug, "nothing relevant at all", 1).ok) bad.push("reversing an absent edit should refuse");
  if (reverseLastK(e.slug, post + "\n\n" + post, 1).ok) bad.push("reversing a non-unique anchor should refuse");

  /* SUFFIX ORDER: a lesson with several edits must reverse newest-first, and
   * reversing k must undo exactly the last k. 05-02 carries three. */
  const many = editsFor("05-02-aims-internal-audit");
  if (many.length < 3) bad.push("05-02 should carry at least three declared edits");
  else {
    if (!(many[0].seq < many[1].seq && many[1].seq < many[2].seq)) bad.push("editsFor did not sort by seq");
    const last = many[many.length - 1];
    const body = "X " + last.to + " Y";
    const one = reverseLastK("05-02-aims-internal-audit", body, 1);
    if (!one.ok || one.text !== "X " + last.from + " Y") bad.push("reversing the last 05-02 edit failed");
    if (one.applied.length !== 1 || one.applied[0].seq !== last.seq) {
      bad.push("reverseLastK(1) reversed the wrong edit");
    }
    /* Asking for two when only the newest is present must refuse rather than
     * silently reversing one -- a partial replay would hash to nothing real. */
    if (reverseLastK("05-02-aims-internal-audit", body, 2).ok) {
      bad.push("reverseLastK(2) should refuse when the older edit is absent");
    }
  }
  return bad;
}
