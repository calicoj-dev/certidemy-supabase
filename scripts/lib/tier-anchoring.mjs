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
/** 42001 proper, including any amendment edition. */
export const is42001 = (src) => /^ISO\/IEC\s*42001\b/i.test(String(src || ""));

/* ============ THE REQUIREMENTS STANDARD COMES FROM THE CERTIFICATION (ruled PROMPT-135 s2) ============
 *
 * THE DEFECT: this module hard-coded ISO/IEC 27001 as THE requirements standard for the Internal
 * Auditor tier. Probed on AIMS-IA before a cent was spent, it REFUSED every ISO/IEC 42001 `shall`
 * key and ALLOWED ISO/IEC 27001 keys -- exactly inverted for an ISO/IEC 42001 certification.
 *
 * THE RULE, STATED ONCE: an Internal Auditor certification keys REQUIREMENT items on its OWN
 * management-system standard's `shall` passages (that standard's Annex A controls included), and
 * AUDIT-PRACTICE items on ISO 19011. Everything else is support only -- which for AIMS-IA means
 * 42001 Annex B (implementation guidance) and the whole 27000 family, and for ISMS-IA means 27002
 * and 27000.
 *
 * AND IT REFUSES WHAT IT DOES NOT KNOW. An unrecognised IA code throws rather than falling back to
 * 27001: a silent default is the defect class behind the rollback command that offered to un-retire
 * a different certification. */
export const REQUIREMENTS_STANDARD = Object.freeze({
  "ISMS": "ISO/IEC 27001",
  "AIMS": "ISO/IEC 42001",
});
export function requirementsStandardFor(cert) {
  const c = String(cert || "").trim().toUpperCase();
  const fam = c.split("-")[0];
  const std = REQUIREMENTS_STANDARD[fam];
  if (!std) {
    throw new Error("tier-anchoring: no requirements standard is declared for certification '" +
      cert + "'. Add it to REQUIREMENTS_STANDARD. It will NOT fall back to ISO/IEC 27001: that " +
      "default is what made AIMS-IA refuse every 42001 key and allow 27001 keys.");
  }
  return std;
}
/** Is this source the certification's OWN requirements standard? */
export const isRequirementsStandard = (src, cert) => {
  const std = requirementsStandardFor(cert);
  return std === "ISO/IEC 27001" ? is27001(src) : is42001(src);
};

/* ============ SUPPORT-ONLY IS RELATIVE TO THE CERTIFICATION TOO ============
 *
 * On ISMS-IA, 27002 and 27000 are support only. On AIMS-IA the 27000 FAMILY ENTIRE is support only
 * -- including 27001, which is another management system's requirements -- and so is 42001 Annex B,
 * which is implementation guidance for an Annex A control and never a requirement.
 *
 * Annex B is matched on the CLAUSE, not the source: it is part of 42001 itself. */
export const isAnnexB = (clause) => /^B(\.|$)/i.test(String(clause || ""));
export function isSupportOnlyOnIA(src, cert = null, clause = null) {
  const s = String(src || "");
  /* the 27000 family, excluding 27001 which is handled by the requirements test */
  const family27000 = /^ISO\/IEC\s*270(0[02-9]|[1-9]\d)\b/i.test(s) || /^ISO\/IEC\s*27000\b/i.test(s);
  if (family27000) return true;
  if (!cert) return /^ISO\/IEC\s*27002\b/i.test(s) || /^ISO\/IEC\s*27000\b/i.test(s);
  const std = requirementsStandardFor(cert);
  /* another management system's requirements standard is support only here */
  if (std === "ISO/IEC 42001" && is27001(s)) return true;
  if (std === "ISO/IEC 27001" && is42001(s)) return true;
  /* 42001 Annex B is guidance even though its source IS the requirements standard */
  if (std === "ISO/IEC 42001" && is42001(s) && isAnnexB(clause)) return true;
  return false;
}

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
export function keyMayAnchor(anchor, { tier, primaryClauses, cert = null } = {}) {
  const src = anchor && anchor.source_id;
  if (tier !== TIERS.INTERNAL_AUDITOR) {
    /* Foundation and general tiers are UNCHANGED by this ruling: their anchoring is decided by the
     * task map alone (gateAnchorIsPrimary) and by the Foundation modal narrowing. */
    return { ok: true, why: "tier " + String(tier) + ": this rule does not narrow where a key anchors" };
  }
  /* THE CERTIFICATION'S OWN REQUIREMENTS STANDARD (PROMPT-135 s2). `cert` is optional only so the
   * pre-existing callers keep working: without it the standard is ISO/IEC 27001, which is what the
   * rule said for its whole life and is right for ISMS-IA. An AIMS-* caller MUST pass it, and
   * `requirementsStandardFor` throws on a family it does not know rather than falling back. */
  const std = cert ? requirementsStandardFor(cert) : "ISO/IEC 27001";
  const isReq = std === "ISO/IEC 27001" ? is27001 : is42001;
  /* ============ THE WORDING IS BYTE-IDENTICAL ON THE 27001 PATH, DELIBERATELY ============
   *
   * These `why` strings reach the WRITER PROMPT through anchorMarkFor. My first version inserted the
   * certification code and the full standard id, which changed every ISMS-IA mark -- the verdicts
   * were unchanged and the prompt was not, and `prove-ismsia-unmoved.mjs` caught it on 11 passages.
   * The short standard name keeps the 27001 text exactly as it has always read. */
  const sh = std === "ISO/IEC 27001" ? "27001" : "42001";
  if (isSupportOnlyOnIA(src, cert, anchor && anchor.clause)) {
    /* the remedy differs by source, and a message naming 27002 while refusing a 27000 passage reads
     * like the rule is about a document it is not */
    const remedy = /27002/.test(String(src))
      ? "the key for a control question anchors on the matching " + sh + " Annex A control"
      : isAnnexB(anchor && anchor.clause)
        ? "Annex B is implementation GUIDANCE for an Annex A control: key on the control itself"
        : "state the definition in your own words and key on the " + sh + " `shall` clause that uses it";
    return { ok: false,
      why: "IA: " + String(src) + " is SUPPORT ONLY -- distractor support and context, never the " +
        "key. Instead, " + remedy };
  }
  if (isReq(src)) {
    if (anchor.normative === "shall") {
      return { ok: true, why: "IA: a " + sh + " `shall` passage -- what the ISMS must do" };
    }
    return { ok: false,
      why: "IA: " + labelOf(src, anchor.edition, anchor.clause) + " is " + sh + " but carries `" +
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
    why: "IA: " + String(src) + " is not a key-anchorable source on this tier (" + sh +
      " `shall` for requirements, ISO 19011 for audit practice)" };
}

/** The label the writer prompt puts beside each passage. One computation for prompt and gate. */
export function anchorMarkFor(passage, { tier, primaryClauses, isPrimary, cert = null } = {}) {
  if (!isPrimary) return "SUPPORT ONLY -- a key may not anchor here";
  const r = keyMayAnchor(passage, { tier, primaryClauses, cert });
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

  /* ============ THE REQUIREMENTS STANDARD IS THE CERTIFICATION'S (PROMPT-135 s2) ============
   * Every arm the ruling names, for BOTH certifications, plus the refusal. */
  {
    const A = (clause, normative) => ({ source_id: "ISO/IEC 42001", edition: "2023", clause, normative });
    const prac42 = [{ source_id: "ISO 19011", edition: "2026", clause: "6.4.7", normative: "should" }];
    const at = (cert) => (anchor, prim = []) => keyMayAnchor(anchor, { tier: IA, primaryClauses: prim, cert });
    const aims = at("AIMS-IA"), isms = at("ISMS-IA");

    ok("AIMS-IA: a 42001 `shall` key PASSES", aims(A("9.2.2", "shall")).ok);
    ok("AIMS-IA: a 42001 Annex A control key PASSES", aims(A("A.6.2.2", "shall")).ok);
    ok("AIMS-IA: a 42001 ANNEX B key FAILS", aims(A("B.6.2.2", "should")).ok === false);
    ok("...and names Annex B as guidance for the control",
      /Annex B is implementation GUIDANCE/.test(aims(A("B.6.2.2", "should")).why));
    ok("AIMS-IA: a 27001 key FAILS -- another management system's requirements",
      isms === aims ? false : aims(P("ISO/IEC 27001", "9.2.2", "shall")).ok === false);
    ok("AIMS-IA: a 19011 key on an audit-practice task PASSES",
      aims({ source_id: "ISO 19011", edition: "2026", clause: "6.4.7", normative: "should" }, prac42).ok);
    ok("AIMS-IA: a 42001 non-`shall` key FAILS", aims(A("4.1", "should")).ok === false);

    /* MIRRORED, and ISMS-IA MUST NOT MOVE */
    ok("ISMS-IA: a 27001 `shall` key PASSES", isms(P("ISO/IEC 27001", "9.2.2", "shall")).ok);
    ok("ISMS-IA: a 27001 Annex A control key PASSES", isms(P("ISO/IEC 27001", "A.5.12", "shall")).ok);
    ok("ISMS-IA: a 42001 key FAILS -- the other standard", isms(A("9.2.2", "shall")).ok === false);
    ok("ISMS-IA: 27002 still SUPPORT ONLY", isms(P("ISO/IEC 27002", "5.9", "should")).ok === false);
    ok("ISMS-IA: 27000 still SUPPORT ONLY", isms(P("ISO/IEC 27000", "3.1", "n/a", "2018")).ok === false);
    ok("ISMS-IA: a 19011 key on an audit-practice task PASSES",
      isms({ source_id: "ISO 19011", edition: "2026", clause: "6.4.7", normative: "should" }, practice).ok);

    /* OMITTING `cert` KEEPS THE OLD BEHAVIOUR EXACTLY, which is what makes ISMS-IA immovable */
    ok("no cert given: 27001 `shall` passes, as it always did",
      keyMayAnchor(P("ISO/IEC 27001", "9.2.2", "shall"), { tier: IA, primaryClauses: reqs }).ok);

    /* AND AN UNKNOWN IA CERTIFICATION REFUSES RATHER THAN FALLING BACK TO 27001 */
    ok("an unknown IA family THROWS rather than defaulting", (() => {
      try { requirementsStandardFor("QMS-IA"); return false; }
      catch (e) { return /no requirements standard is declared/.test(e.message); }
    })());
    ok("...and the message says it will NOT fall back", (() => {
      try { requirementsStandardFor("ZZZ-IA"); return false; }
      catch (e) { return /NOT fall back/.test(e.message); }
    })());
    ok("the table resolves both known families",
      requirementsStandardFor("ISMS-IA") === "ISO/IEC 27001" &&
      requirementsStandardFor("AIMS-F") === "ISO/IEC 42001");
  }

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
