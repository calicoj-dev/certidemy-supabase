/**
 * superseded-wording.mjs -- wording that belonged to a retired edition, refused by code.
 *
 * ============ WHY A LIST AND NOT A LIBRARY ============
 *
 * The 2017 Scrum Guide is deliberately NOT in the source library. A library the
 * generator quotes from must not contain the edition whose wording we are trying to stop
 * it reproducing -- so the 2017 text cannot be the reference that catches 2017 wording,
 * and something else has to.
 *
 * That something is this list, and it exists because the failure is a RECALL failure.
 * The 2017 Guide is far better represented in training data than the 2020 one, so a
 * model asked about Scrum regresses to it. Two audits found exactly that: `66de9c82`
 * ("traumatic and rare"), `c10b3203` (Developers rendered as the Development Team).
 * Retrieval cannot fix a recall failure whose source is absent by design.
 *
 * ============ EACH RULE NAMES WHAT REPLACED IT ============
 *
 * A gate that says "this wording is retired" and stops there sends the writer looking.
 * Every rule carries the 2020 term, so the refusal is actionable in one line.
 *
 * ============ THE ONES THAT ARE NOT LEXICAL ============
 *
 * `self-organizing` and `forecast` are real words the 2020 Guide's subject matter still
 * needs, so a bare string match on them would fire on correct prose. Both are scoped:
 * `self-organizing` fires when it is offered AS THE CURRENT TERM, and `forecast` fires
 * only in the neighbourhood of the Sprint Backlog. This repository has already recorded
 * what an unscoped lexical proxy does -- an exemption for defined terms that excused the
 * reproduction it existed to catch, and a refusal pattern that fired on 37 rows of
 * curriculum because "as an AI" is the subject matter of an AI catalogue.
 *
 * ISO editions are NOT handled here. They are handled by PINNING the edition in the
 * library, which is stronger: a clause either resolves in the pinned edition or it does
 * not, and no word list is involved.
 */

/** A rule fires on `test(text)` and reports `{ id, why, instead }`. */
export const SUPERSEDED_RULES = [
  {
    id: "development-team",
    why: "the 2020 Guide has no Development Team -- one Scrum Team, no sub-teams",
    instead: "Developers",
    test: (t) => /\bdevelopment team\b/i.test(t),
  },
  {
    id: "servant-leader",
    why: "2017 wording; the 2020 Guide describes the Scrum Master as a leader who serves",
    instead: "a leader who serves the Scrum Team and the wider organization",
    test: (t) => /\bservant[- ]leader(s|ship)?\b/i.test(t),
  },
  {
    id: "self-organizing-as-current",
    /* SCOPED, because the concept is not retired -- the TERM is. A lesson may discuss
     * how the wording changed; an item may not present the old term as the current one. */
    why: "the 2020 Guide says self-managing; self-organizing is the 2017 term",
    instead: "self-managing",
    test: (t) => /\bself[- ]organi[sz]ing\b/i.test(t) &&
      !/\b(?:2017|former(?:ly)?|previous(?:ly)?|used to|renamed|no longer|earlier edition)\b/i.test(t),
  },
  {
    id: "one-high-priority-improvement",
    why: "2017 Retrospective wording; the 2020 Guide requires no set number of improvements",
    instead: "the most impactful improvements are addressed as soon as possible",
    test: (t) => /\b(?:at least one|one)\s+high[- ]priority\s+improvement/i.test(t),
  },
  {
    id: "first-days-of-the-sprint",
    why: "2017 Sprint Backlog wording about decomposing work for the first days",
    instead: "the Sprint Backlog is a plan by and for the Developers, updated throughout",
    test: (t) => /\bfirst days? of the sprint\b/i.test(t),
  },
  {
    id: "traumatic",
    why: "2017 wording about Sprint cancellation; the 2020 Guide does not characterise it",
    instead: "only the Product Owner has the authority to cancel the Sprint",
    test: (t) => /\btraumatic\b/i.test(t),
  },
  {
    id: "ten-percent-of-capacity",
    why: "2017 refinement guidance; the 2020 Guide states no percentage",
    instead: "refinement is an ongoing activity with no prescribed share of capacity",
    test: (t) => /\b10\s*%|\bten per\s?cent\b/i.test(t) && /\b(capacity|refine)/i.test(t),
  },
  {
    id: "sprint-backlog-forecast",
    /* SCOPED to the Sprint Backlog. "Forecast" is ordinary English and the 2020 Guide
     * uses it of the Product Backlog's future; it is the SELECTED ITEMS that stopped
     * being called a forecast. */
    why: "2017 called the selected items a forecast; the 2020 Sprint Backlog is the Sprint Goal, the selected items and a plan",
    instead: "the Sprint Backlog: the Sprint Goal, the selected Product Backlog items, and the plan",
    test: (t) => /\bforecast\b/i.test(t) && /\bsprint backlog\b/i.test(t),
  },
  {
    id: "product-backlog-never-complete",
    why: "2017 wording; the 2020 Guide calls the Product Backlog emergent and ordered",
    instead: "an emergent, ordered list of what is needed to improve the product",
    test: (t) => /\bnever complete\b/i.test(t),
  },
];

/* ============ THE LIST IS PER SUBJECT, AND APPLYING IT EVERYWHERE REFUSES CORRECT WORK
 *
 * PAID FOR BY THE FIRST PILOT. Two ISO/IEC 42001 items were refused for
 * `development-team`, and both used the phrase as ordinary English:
 *
 *   "A development team evaluates a new AI model only on data drawn from a single region"
 *   "A development team asks whether the AI management system standard tells them..."
 *
 * Neither has anything to do with the Scrum role that was renamed in 2020. Every rule here
 * is about the Scrum Guide, so every rule here belongs to the Scrum certifications -- and
 * the phrase "development team" is a completely normal thing to write in an AI-governance
 * item. A guard that fires on the normal case is deleted by the first person it
 * inconveniences, and its deletion takes the real assertion with it.
 *
 * So the rules carry a SUBJECT and the caller says which subject applies. An unknown
 * certification gets NO rules rather than all of them: silently applying a Scrum word list
 * to an unrecognised certification is how this defect happened in the first place.
 */
const SCRUM_CERTS = new Set(["SM-AI-I", "SM-AI-II", "SPO-AI-I", "SD-AI-I"]);

/** Which subjects' rules apply to a certification. Empty means no rule applies. */
export function subjectsFor(certCode) {
  return SCRUM_CERTS.has(String(certCode || "").toUpperCase()) ? ["scrum-guide"] : [];
}

/**
 * Every rule that fires on `text`.
 *
 * `opts.cert` scopes the rules to that certification. Passing no cert runs EVERY rule,
 * which is right for a corpus-wide report and wrong for a gate -- so the gate passes a
 * cert and this signature makes the difference visible at the call site.
 */
export function supersededIn(text, opts = {}) {
  const t = String(text || "");
  const subjects = opts.cert === undefined ? null : subjectsFor(opts.cert);
  return SUPERSEDED_RULES
    .filter((r) => subjects === null || subjects.includes(r.subject || "scrum-guide"))
    .filter((r) => r.test(t))
    .map((r) => ({ id: r.id, why: r.why, instead: r.instead }));
}

/**
 * CONTROLS, BOTH DIRECTIONS. A word list that fires on correct prose is deleted by the
 * first person it inconveniences, and one that cannot fire on the wording it was written
 * for reports clean forever. Every rule needs a case it MUST catch and the 2020 sentence
 * it MUST NOT -- and the negatives are the half that would otherwise go unwritten.
 */
export function supersededControls() {
  const MUST_FIRE = [
    ["development-team", "The Development Team estimates the work."],
    ["servant-leader", "The Scrum Master is a servant-leader for the team."],
    ["self-organizing-as-current", "Scrum Teams are self-organizing and cross-functional."],
    ["one-high-priority-improvement", "The Sprint Backlog includes at least one high priority improvement."],
    ["first-days-of-the-sprint", "Work planned for the first days of the Sprint is decomposed."],
    ["traumatic", "Sprint cancellations are rare and often traumatic."],
    ["ten-percent-of-capacity", "Refinement consumes no more than 10% of the capacity of the team."],
    ["sprint-backlog-forecast", "The Sprint Backlog is the Developers' forecast of functionality."],
    ["product-backlog-never-complete", "The Product Backlog is never complete."],
  ];
  /* SCOPING, ASSERTED IN BOTH DIRECTIONS. The pilot's false refusals are the positive
   * control for the scoping, and a Scrum item carrying the same phrase MUST still fire --
   * otherwise scoping would just be a way of switching the guard off. */
  const SCOPED = [
    ["AIMS-F", "A development team evaluates a new AI model only on data from one region.", 0],
    ["ISMS-IA", "A development team asks whether the standard sets a threshold.", 0],
    ["SM-AI-I", "The Development Team estimates the work.", 1],
    ["SD-AI-I", "The Development Team owns the Sprint Backlog.", 1],
  ];

  const MUST_NOT_FIRE = [
    "The Developers estimate the work and own the Sprint Backlog.",
    "The Scrum Master serves the Scrum Team and the wider organization.",
    "Scrum Teams are self-managing and cross-functional.",
    /* The scoped rules, tested on the prose they must tolerate. */
    "The 2020 Guide replaced self-organizing with self-managing; formerly the team was self-organizing.",
    "The Product Owner forecasts which Product Backlog items may be ready next quarter.",
    "The Sprint Backlog is the Sprint Goal, the selected items, and a plan for delivering them.",
    "Refinement is ongoing and the Guide prescribes no share of capacity.",
    "Only the Product Owner has the authority to cancel a Sprint.",
    "The Product Backlog is emergent and ordered.",
  ];
  const fails = [];
  for (const [id, text] of MUST_FIRE) {
    const hits = supersededIn(text).map((h) => h.id);
    if (!hits.includes(id)) fails.push("MUST FIRE and did not: " + id + " on " + JSON.stringify(text));
  }
  for (const text of MUST_NOT_FIRE) {
    const hits = supersededIn(text);
    if (hits.length) {
      fails.push("MUST NOT FIRE and did: " + hits.map((h) => h.id).join(",") + " on " + JSON.stringify(text));
    }
  }
  for (const [cert, text, want] of SCOPED) {
    const n = supersededIn(text, { cert }).length;
    if (n !== want) {
      fails.push("SCOPE: " + cert + " expected " + want + " hit(s), got " + n + " on " + JSON.stringify(text));
    }
  }
  return {
    examined: MUST_FIRE.length + MUST_NOT_FIRE.length + SCOPED.length,
    must_fire: MUST_FIRE.length, must_not_fire: MUST_NOT_FIRE.length, scoped: SCOPED.length,
    fails,
  };
}
