/**
 * WHERE A KEY MAY ANCHOR, BY CERTIFICATION TIER. One definition, read by the gate that enforces it
 * and by the writer prompt that marks the passages -- so what the writer is told and what the gate
 * refuses cannot drift apart.
 *
 * ============ WHY THE INTERNAL AUDITOR TIER NEEDED ITS OWN RULE ============
 *
 * "IA: normative anchors only" was unworkable and PROMPT-125 s4 measured why: ISO 19011:2026 carries
 * NO `shall` clause at all -- 85 should, 30 informative, 5 can -- and neither does 27002. Applied
 * literally the rule left 10 of 38 ISMS-IA tasks examinable, because audit practice (principles,
 * competence, methods, interviewing, evidence, reporting) exists only in 19011. No normative
 * standard says how to conduct an interview.
 *
 * Ruled PROMPT-126 s1:
 *
 *   - an item about what the ISMS MUST DO keys on a 27001 `shall` passage. For a control question
 *     that means 27001 ANNEX A, not 27002;
 *   - an item about HOW AN AUDIT IS CONDUCTED keys on ISO 19011. Its `should` is its authoritative
 *     voice, so the anchor is valid even though it is not normative;
 *   - 27002 and 27000 are SUPPORT ONLY on IA: distractor support and context, never the key;
 *   - the modal gate stays UNNARROWED. An item on a 19011 anchor states good practice and never
 *     "must" or "is required". That is the misattribution rule and the full gate enforces it.
 *
 * ============ AUDIT-PRACTICE IS COMPUTED, NEVER TYPED ============
 *
 * A task is an audit-practice task when ISO 19011 appears among its PRIMARY passages. The map is the
 * director's own statement of what a task is examined against, so it is the right input -- and it
 * gets every case the ruling names right: 3.5 (interviewing, 19011 A.17) is audit practice, while
 * 5.7 (which audit results clause 9.3 requires) maps only 27001 and is a requirements task even
 * though it sits in the findings domain. A per-domain rule would have got 5.7 wrong.
 */
import { passageKey, labelOf } from "./passage-key.mjs";

export const TIERS = { FOUNDATION: "foundation", INTERNAL_AUDITOR: "internal-auditor", GENERAL: "general" };

/** Read off the certification code, the way the Foundation narrowing already is. */
export function tierOf(cert) {
  const c = String(cert || "");
  if (/-IA$/.test(c)) return TIERS.INTERNAL_AUDITOR;
  if (/-F$/.test(c)) return TIERS.FOUNDATION;
  return TIERS.GENERAL;
}

/** ISO 19011 under any edition. Matched on the source id, never on a mapped clause number. */
export const is19011 = (src) => /^ISO\s*19011\b/i.test(String(src || ""));
/** 27001 proper, including its amendments -- `ISO/IEC 27001` with edition `2022` or `2022/Amd1:2024`. */
export const is27001 = (src) => /^ISO\/IEC\s*27001\b/i.test(String(src || ""));
/** Support-only sources on IA. */
export const isSupportOnlyOnIA = (src) =>
  /^ISO\/IEC\s*27002\b/i.test(String(src || "")) || /^ISO\/IEC\s*27000\b/i.test(String(src || ""));

/**
 * Is this task an audit-practice task? True when ISO 19011 is among its PRIMARY passages.
 * @param primaryClauses array of {source_id, edition, clause}
 */
export function isAuditPracticeTask(primaryClauses) {
  return (primaryClauses || []).some((p) => p && is19011(p.source_id));
}

/**
 * May a KEY anchor on this passage, for this tier and task?
 * @param anchor   {source_id, edition, clause, normative}
 * @param opts     {tier, primaryClauses}
 * @returns {{ok:boolean, why:string}}
 */
export function keyMayAnchor(anchor, { tier, primaryClauses } = {}) {
  const src = anchor && anchor.source_id;
  if (tier !== TIERS.INTERNAL_AUDITOR) {
    /* Foundation and general tiers are UNCHANGED by this ruling: their anchoring is decided by the
     * task map alone (gateAnchorIsPrimary) and by the Foundation modal narrowing. */
    return { ok: true, why: "tier " + String(tier) + ": this rule does not narrow where a key anchors" };
  }
  if (isSupportOnlyOnIA(src)) {
    /* the remedy differs by source, and a message naming 27002 while refusing a 27000 passage reads
     * like the rule is about a document it is not */
    const remedy = /27002/.test(String(src))
      ? "the key for a control question anchors on the matching 27001 Annex A control"
      : "state the definition in your own words and key on the 27001 `shall` clause that uses it";
    return { ok: false,
      why: "IA: " + String(src) + " is SUPPORT ONLY -- distractor support and context, never the " +
        "key. Instead, " + remedy };
  }
  if (is27001(src)) {
    if (anchor.normative === "shall") {
      return { ok: true, why: "IA: a 27001 `shall` passage -- what the ISMS must do" };
    }
    return { ok: false,
      why: "IA: " + labelOf(src, anchor.edition, anchor.clause) + " is 27001 but carries `" +
        String(anchor.normative) + "`, not `shall`. A requirements key anchors on a `shall` passage" };
  }
  if (is19011(src)) {
    if (isAuditPracticeTask(primaryClauses)) {
      return { ok: true,
        why: "IA: ISO 19011 on an audit-practice task -- its `should` is its authoritative voice" };
    }
    return { ok: false,
      why: "IA: ISO 19011 may key only on an AUDIT-PRACTICE task, and this task maps no 19011 primary" };
  }
  return { ok: false,
    why: "IA: " + String(src) + " is not a key-anchorable source on this tier (27001 `shall` for " +
      "requirements, ISO 19011 for audit practice)" };
}

/** The label the writer prompt puts beside each passage. One computation for prompt and gate. */
export function anchorMarkFor(passage, { tier, primaryClauses, isPrimary } = {}) {
  if (!isPrimary) return "SUPPORT ONLY -- a key may not anchor here";
  const r = keyMayAnchor(passage, { tier, primaryClauses });
  return r.ok ? "KEY MAY ANCHOR HERE" : "SUPPORT ONLY -- " + r.why.replace(/^IA: /, "");
}

/** One line for the writer prompt, stating the tier's rule. Empty for tiers it does not narrow. */
export function tierAnchoringBrief(tier) {
  if (tier !== TIERS.INTERNAL_AUDITOR) return "";
  return [
    "WHERE THE KEY MAY ANCHOR ON THIS CERTIFICATION (Internal Auditor, ruled PROMPT-126 s1):",
    "",
    "- An item about WHAT THE ISMS MUST DO keys on an ISO/IEC 27001 `shall` passage. For a control",
    "  question that is 27001 Annex A, not ISO/IEC 27002.",
    "- An item about HOW AN AUDIT IS CONDUCTED -- principles, programme, competence, methods,",
    "  interviewing, evidence, reporting -- keys on ISO 19011. Its `should` is its authoritative voice.",
    "- ISO/IEC 27002 and ISO/IEC 27000 are SUPPORT ONLY here: use them for distractor support and",
    "  context. A key may never anchor on them.",
    "- ON A 19011 ANCHOR, STATE GOOD PRACTICE, NEVER A REQUIREMENT. Write \"the auditor should\", or",
    "  \"the guidance recommends\". Never \"must\", \"shall\" or \"is required\" -- not even attributed.",
    "  19011 does not impose requirements, and saying it does is the misattribution the gate refuses.",
    "",
    "Each passage below is marked KEY MAY ANCHOR HERE or SUPPORT ONLY. Honour the marks.",
  ].join("\n");
}

/** Controls, both directions, for every arm the ruling names. */
export function tierAnchoringControls() {
  const cases = [];
  const ok = (what, pass) => cases.push({ what, pass });
  const P = (source_id, clause, normative, edition = "2022") => ({ source_id, edition, clause, normative });
  const IA = TIERS.INTERNAL_AUDITOR;
  const practice = [P("ISO 19011", "6.4.7", "should", "2026")];
  const reqs = [P("ISO/IEC 27001", "9.3.2", "shall")];

  ok("tierOf reads -IA", tierOf("ISMS-IA") === IA);
  ok("tierOf reads -F", tierOf("ISMS-F") === TIERS.FOUNDATION);
  ok("tierOf on AIMS-IA is IA too", tierOf("AIMS-IA") === IA);
  ok("tierOf on a scrum code is general", tierOf("SM-AI-I") === TIERS.GENERAL);

  /* ---- the four arms the ruling names ---- */
  ok("IA: a 27002 key is REFUSED",
    !keyMayAnchor(P("ISO/IEC 27002", "5.19", "should"), { tier: IA, primaryClauses: reqs }).ok);
  ok("...and the 27002 refusal names the matching 27001 Annex A control",
    /Annex A/.test(keyMayAnchor(P("ISO/IEC 27002", "5.19", "should"), { tier: IA, primaryClauses: reqs }).why));
  ok("...and the 27000 refusal does NOT talk about 27002 -- it is a vocabulary, not a control set",
    !/27002/.test(keyMayAnchor(P("ISO/IEC 27000", "3.17", "informative", "2018"), { tier: IA, primaryClauses: reqs }).why));
  ok("...and it tells the writer to key on the 27001 clause that uses the term",
    /own words/.test(keyMayAnchor(P("ISO/IEC 27000", "3.17", "informative", "2018"), { tier: IA, primaryClauses: reqs }).why));
  ok("IA: a 27000 key is REFUSED",
    !keyMayAnchor(P("ISO/IEC 27000", "3.17", "informative", "2018"), { tier: IA, primaryClauses: reqs }).ok);
  ok("IA: a 19011 key on an AUDIT-PRACTICE task PASSES",
    keyMayAnchor(P("ISO 19011", "A.17", "should", "2026"), { tier: IA, primaryClauses: practice }).ok);
  ok("IA: a 19011 key on a REQUIREMENTS task is refused",
    !keyMayAnchor(P("ISO 19011", "A.17", "should", "2026"), { tier: IA, primaryClauses: reqs }).ok);
  ok("IA: a 27001 `shall` key PASSES",
    keyMayAnchor(P("ISO/IEC 27001", "9.3.2", "shall"), { tier: IA, primaryClauses: reqs }).ok);
  ok("IA: a 27001 Annex A `shall` key PASSES",
    keyMayAnchor(P("ISO/IEC 27001", "A.5.20", "shall"), { tier: IA, primaryClauses: reqs }).ok);
  ok("IA: a 27001 passage that is NOT `shall` is refused as a requirements key",
    !keyMayAnchor(P("ISO/IEC 27001", "4.2", "can", "2022/Amd1:2024"), { tier: IA, primaryClauses: reqs }).ok);
  ok("IA: the 27001 Amd1 `shall` row PASSES",
    keyMayAnchor(P("ISO/IEC 27001", "4.1", "shall", "2022/Amd1:2024"), { tier: IA, primaryClauses: reqs }).ok);
  ok("IA: an unrelated source is refused",
    !keyMayAnchor(P("ISO/IEC 17021-1", "9.4.2", "shall", "2015"), { tier: IA, primaryClauses: reqs }).ok);

  /* ---- FOUNDATION AND GENERAL ARE UNTOUCHED, which is half the ruling ---- */
  ok("FOUNDATION: a 27002 key is NOT narrowed by this rule",
    keyMayAnchor(P("ISO/IEC 27002", "5.19", "should"), { tier: TIERS.FOUNDATION, primaryClauses: reqs }).ok);
  ok("FOUNDATION: a 19011 key is NOT narrowed either",
    keyMayAnchor(P("ISO 19011", "A.17", "should", "2026"), { tier: TIERS.FOUNDATION, primaryClauses: reqs }).ok);
  ok("GENERAL: not narrowed",
    keyMayAnchor(P("ISO/IEC 27002", "5.19", "should"), { tier: TIERS.GENERAL, primaryClauses: reqs }).ok);

  /* ---- the audit-practice classification ---- */
  ok("a task mapping a 19011 primary is audit-practice", isAuditPracticeTask(practice));
  ok("a task mapping only 27001 is NOT audit-practice", isAuditPracticeTask(reqs) === false);
  ok("a task with no primaries is not audit-practice", isAuditPracticeTask([]) === false);
  ok("a null primary list does not throw", isAuditPracticeTask(null) === false);
  ok("19011 is matched on the SOURCE, not a clause number",
    isAuditPracticeTask([P("ISO/IEC 27001", "19011", "shall")]) === false);

  /* ---- the marks the prompt prints ---- */
  ok("a non-primary passage is SUPPORT ONLY whatever its source",
    /SUPPORT ONLY/.test(anchorMarkFor(P("ISO/IEC 27001", "9.3.2", "shall"),
      { tier: IA, primaryClauses: reqs, isPrimary: false })));
  ok("a primary 27001 shall is marked KEY MAY ANCHOR HERE",
    anchorMarkFor(P("ISO/IEC 27001", "9.3.2", "shall"),
      { tier: IA, primaryClauses: reqs, isPrimary: true }) === "KEY MAY ANCHOR HERE");
  ok("a primary 27002 on IA is marked SUPPORT ONLY",
    /SUPPORT ONLY/.test(anchorMarkFor(P("ISO/IEC 27002", "5.19", "should"),
      { tier: IA, primaryClauses: reqs, isPrimary: true })));
  ok("on FOUNDATION a primary 27002 is still KEY MAY ANCHOR HERE",
    anchorMarkFor(P("ISO/IEC 27002", "5.19", "should"),
      { tier: TIERS.FOUNDATION, primaryClauses: reqs, isPrimary: true }) === "KEY MAY ANCHOR HERE");

  /* ---- the brief ---- */
  ok("the IA brief names 19011 and 27002", /19011/.test(tierAnchoringBrief(IA)) &&
    /27002/.test(tierAnchoringBrief(IA)));
  ok("the IA brief forbids `must` on a 19011 anchor", /never .must./i.test(tierAnchoringBrief(IA)));
  ok("FOUNDATION gets NO brief, so its prompt is unchanged", tierAnchoringBrief(TIERS.FOUNDATION) === "");
  ok("GENERAL gets no brief", tierAnchoringBrief(TIERS.GENERAL) === "");
  void passageKey;
  return { examined: cases.length, fails: cases.filter((c) => !c.pass).map((c) => c.what) };
}
