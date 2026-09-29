/**
 * task-source-roles.mjs -- the director's role rules for `task_sources`, in ONE place.
 *
 * WHY THIS MODULE EXISTS. The rules were written inline in `write-task-sources.mjs`. Re-roling AIMS-F's
 * judge additions needs the identical rules, and a second hand-written copy of one idea diverges -- the
 * divergence would surface as a role differing between certifications for no reason anybody recorded.
 * This repository's own rule: a computation with a stated invariant has exactly one implementation, and
 * the invariant is enforced by there being nowhere else to put it.
 *
 * ============ THE RULES, AS RULED 2026-09-29 ============
 *
 *   1.  high or medium confidence -> primary; low -> supporting.
 *   2a. ISO/IEC 17021-1 clause 10 is DROPPED unless the task is about a certification body's own
 *       management system. This one removes the row; every other rule only demotes.
 *   2b. ISO/IEC 17021-1 and ISO/IEC 42006 are primary ONLY where the task statement is about
 *       certification, certification bodies or the certification cycle.
 *   3.  ISO/IEC 42001 Annex B, and the ISO/IEC 27001 / 27002 clause 0.x introductions, are supporting.
 *
 * Rule 4 (edition resolution) and rule 5 (pair de-duplication) stay in the caller: they are about
 * resolving an ADDRESS to a passage row, not about what role a resolved passage takes.
 *
 * RULE 6 IS GONE, AND ITS REMOVAL IS THE POINT. It forced every AIMS-F judge addition to `supporting`
 * to protect the 150 reviewed links. It did protect them, and it also made 382 supporting rows against
 * 150 primary -- and since the anchoring pass supplied primaries only, 86 sound items were withheld for
 * a bookkeeping reason. Protecting the reviewed links is now done by NOT TOUCHING THEM, which is what
 * was actually wanted, rather than by flattening the role of everything else.
 *
 * ============ THE PREDICATES ARE LEXICAL PROXIES AND THEY ARE ASYMMETRIC ON PURPOSE ============
 *
 * `CERT_SUBJECT` decides primary vs supporting, so its safe error is supporting: broad.
 * `CB_MS_SUBJECT` decides whether a clause survives at all, so its safe error is dropping: narrow.
 *
 * A bare `audit programme` was in CERT_SUBJECT once and it was wrong -- it made ISMS-F 5.2 ("Explain
 * the internal audit programme and its purpose") a certification subject, along with three AIMS-IA
 * tasks, all of which are about the ORGANISATION'S own clause 9.2 programme. The ruling says
 * "certification, certification bodies or the certification cycle" and an internal audit programme is
 * none of the three. It was caught because the verdicts are printed before anything is written.
 */

export const CB_SOURCES = new Set(["ISO/IEC 17021-1", "ISO/IEC 42006"]);

export const CERT_SUBJECT =
  /\b(certification|certifying|certified|certificate|accreditation|accredited|certification body|certification bodies|surveillance\s+audit|recertification|stage\s*[12]|three[-\s]?year)\b/i;

export const CB_MS_SUBJECT =
  /\b(certification body'?s?\s+(own\s+)?management\s+system|impartiality\s+committee|competence\s+of\s+(the\s+)?certification\s+body)\b/i;

/**
 * The role a proposed link takes, or a drop.
 * @returns {{drop: true, why: string} | {drop: false, role: "primary"|"supporting", why: string}}
 */
export function roleFor({ source, clause, confidence, statement }) {
  const isCertSubject = CERT_SUBJECT.test(String(statement || ""));
  const isCbMs = CB_MS_SUBJECT.test(String(statement || ""));
  const cl = String(clause || "");

  /* rule 2a runs FIRST because it removes the row; ordering it after a demotion would leave a
   * supporting row for a clause the ruling drops entirely. */
  if (source === "ISO/IEC 17021-1" && /^10(\.|$)/.test(cl) && !isCbMs) {
    return { drop: true, why: "17021-1 clause 10 is the certification body's own management system" };
  }

  let role = confidence === "low" ? "supporting" : "primary";
  let why = "confidence " + (confidence || "?");

  if (CB_SOURCES.has(source) && !isCertSubject && role === "primary") {
    role = "supporting";
    why += "; " + String(source).replace("ISO/IEC ", "") + " on a non-certification task";
  }
  if (source === "ISO/IEC 42001" && /^B(\.|$)/.test(cl) && role === "primary") {
    role = "supporting"; why += "; 42001 Annex B is guidance";
  }
  if ((source === "ISO/IEC 27001" || source === "ISO/IEC 27002") && /^0(\.|$)/.test(cl) &&
      role === "primary") {
    role = "supporting"; why += "; clause 0.x is an introduction";
  }
  return { drop: false, role, why };
}

/**
 * Controls. Called by every importer BEFORE it writes anything, and a failure exits non-zero:
 * a predicate that has silently stopped matching turns this whole module into "everything is
 * supporting", which reports clean and is exactly the shape that withheld 86 items.
 * Returns the number of cases examined, so a caller can tell a pass from a vacuous one.
 */
export function selfTest({ quiet = false } = {}) {
  const cases = [
    /* --- CERT_SUBJECT, both directions --- */
    ["a plainly certification task is a certification subject", true,
      () => CERT_SUBJECT.test("Recognize the certification process - stage 1, stage 2, surveillance")],
    ["certification vs accreditation is a certification subject", true,
      () => CERT_SUBJECT.test("Distinguish certification from accreditation, and the roles of the certification body")],
    ["an unrelated task is not", false,
      () => CERT_SUBJECT.test("Explain awareness and communication requirements")],
    ["an INTERNAL audit programme is not the certification cycle", false,
      () => CERT_SUBJECT.test("Explain the internal audit programme and its purpose.")],
    /* --- CB_MS_SUBJECT, both directions --- */
    ["a CB's own management system is the CB-MS subject", true,
      () => CB_MS_SUBJECT.test("Audit the certification body's own management system")],
    ["an ordinary clause-10 task is not", false,
      () => CB_MS_SUBJECT.test("Apply nonconformity and corrective action")],
    /* --- roleFor: rule 1 --- */
    ["high confidence is primary", true,
      () => roleFor({ source: "ISO/IEC 42001", clause: "6.1.3", confidence: "high",
        statement: "Analyze AI risk treatment" }).role === "primary"],
    ["low confidence is supporting", true,
      () => roleFor({ source: "ISO/IEC 42001", clause: "6.1.3", confidence: "low",
        statement: "Analyze AI risk treatment" }).role === "supporting"],
    /* --- rule 2a, and it must NOT fire where the task IS about a CB's own MS --- */
    ["17021-1 clause 10 drops on an ordinary task", true,
      () => roleFor({ source: "ISO/IEC 17021-1", clause: "10.2", confidence: "high",
        statement: "Apply nonconformity and corrective action" }).drop === true],
    ["17021-1 clause 10 SURVIVES on a CB-management-system task", true,
      () => roleFor({ source: "ISO/IEC 17021-1", clause: "10.2", confidence: "high",
        statement: "Audit the certification body's own management system" }).drop === false],
    /* --- rule 2b, both directions --- */
    ["42006 is supporting on a non-certification task", true,
      () => roleFor({ source: "ISO/IEC 42006", clause: "9.1", confidence: "high",
        statement: "Explain awareness and communication requirements" }).role === "supporting"],
    ["42006 stays primary on a certification task", true,
      () => roleFor({ source: "ISO/IEC 42006", clause: "9.1", confidence: "high",
        statement: "Recognize the certification process - stage 1, stage 2" }).role === "primary"],
    /* --- rule 3, and it must not demote Annex A --- */
    ["42001 Annex B is supporting", true,
      () => roleFor({ source: "ISO/IEC 42001", clause: "B.6.2.6", confidence: "high",
        statement: "Analyze controls" }).role === "supporting"],
    ["42001 Annex A is NOT demoted by the Annex B rule", true,
      () => roleFor({ source: "ISO/IEC 42001", clause: "A.6.2.6", confidence: "high",
        statement: "Analyze controls" }).role === "primary"],
    ["27001 clause 0.x is supporting", true,
      () => roleFor({ source: "ISO/IEC 27001", clause: "0.1", confidence: "high",
        statement: "Explain the standard" }).role === "supporting"],
    ["27001 clause 10 is NOT caught by the clause-0 rule", true,
      () => roleFor({ source: "ISO/IEC 27001", clause: "10.1", confidence: "high",
        statement: "Explain improvement" }).role === "primary"],
  ];
  const fails = [];
  for (const [what, expect, fn] of cases) {
    let got;
    try { got = fn(); } catch (e) { got = "threw: " + e.message; }
    if (got !== expect) fails.push(what + "   expected " + expect + ", got " + got);
  }
  if (!quiet) {
    console.log("task-source-role controls: " + cases.length + " case(s), " + fails.length + " fail");
  }
  if (fails.length) {
    for (const f of fails) console.error("   " + f);
    throw new Error(fails.length + " task-source-role control(s) failed");
  }
  return cases.length;
}
