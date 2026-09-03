/**
 * item-grounding.mjs - per-cert scenario grounding for the shared item pipeline.
 *
 * WHY THIS EXISTS
 * ---------------
 * `item-pipeline.mjs` used to carry a single module-level GROUNDING constant hard-
 * coded to Scrum / product-ownership practice. Because the pipeline is SHARED by
 * every cert, that text was injected into the draft prompt for ALL certs. Certs
 * whose concepts self-anchor (AIGRM-I: risk tiers, model cards) mostly resisted it.
 * Certs whose concepts are generic (AIE-I: "what is a prompt", "hallucination") did
 * not: the drafter produced sprint-backlog and Sprint-Review scenarios for an AI
 * literacy exam aimed at HR, marketing, finance and ops staff.
 *
 * That is a VALIDITY defect, not a style nit. An item that requires a candidate to
 * parse Scrum jargon tests Scrum literacy on top of the construct we intend to
 * measure - a construct-irrelevant variable, and one that sails past every existing
 * gate (firewall, floors, cue-guard) untouched.
 *
 * The fix: grounding is selected PER CERT. The Scrum text is preserved verbatim as
 * the Scrum-cert grounding, so a future top-up run on SM/SPO/SD generates exactly as
 * before (no regression). Unknown certs get a NEUTRAL professional default rather
 * than silently inheriting Scrum - this is what makes the generator honestly
 * cert-agnostic for the certs still to come (ITIL, cyber, cloud, PM).
 *
 * Matching is on the cert NAME (what the generators already pass as `certName`,
 * with the "Certidemy " prefix stripped), so no generator signature changes.
 *
 * Every grounding string ends with the standing rule: never name a certification
 * provider or brand.
 *
 * THE SAME DEFECT, ONE LAYER UP (August 2026)
 * -------------------------------------------
 * The single AUDIT block below was written for ISMS-IA and hardcodes ISO/IEC 27001
 * as the criteria standard - its edition set, its Statement of Applicability, its
 * absent severity scheme. Routing reached it through /auditor/ in the cert name.
 *
 * AIMS-IA is named "ISO/IEC 42001:2023 Internal Auditor". It matches /auditor/.
 * It would therefore have generated 42001 items grounded in 27001 editions - the
 * exact shape of the defect this file was created to fix, one level up: GOVERNANCE
 * caught audit certs and knew nothing about EDITIONS; AUDIT caught 42001 and knew
 * nothing about WHICH STANDARD.
 *
 * So the audit grounding is now COMPOSED, not monolithic:
 *
 *   AUDIT_METHOD     the auditing craft - ISO 19011:2026, its principles, its
 *                    annex, its modal discipline, the internal-vs-CB boundary.
 *                    True for every management-system auditor cert.
 *   CRITERIA_27001   what ISMS-IA audits against.
 *   CRITERIA_42001   what AIMS-IA audits against.
 *
 * Routing keys on the STANDARD, not on the word "auditor". An audit cert matching
 * no known standard falls back to method-only rather than silently inheriting
 * someone else's criteria - the failure mode that made this change necessary.
 *
 * KNOWN, NOT FIXED HERE: AIMS-F, ISMS-F, AISM-I and AIHR-I all fall through to
 * NEUTRAL, which carries no edition set and no never-assert list. Both Foundation
 * certs are standards-based and generated without ever being told what their
 * standard says. This is the likely mechanism behind ISMS-F task 2.3 ("environ-
 * mental-conditions" where Amd 1:2024 says "climate change"). Fixing it forward is
 * cheap - route F-tier certs to the matching CRITERIA_* block - but it implies
 * regenerating existing banks, so it is a scoped decision, not a side effect.
 */

const NO_BRAND = `Do NOT reference any specific certification provider or brand.`;

/**
 * The original text, preserved verbatim - SM-AI-I / SPO-AI-I / SD-AI-I.
 *
 * RENAMED from SCRUM to SCRUM_CORE when SM-AI-II arrived. NOT ONE BYTE OF THE
 * VALUE CHANGED, and that is the whole point of the rename: `\bscrum\b` is the
 * first branch in groundingFor and now matches FOUR certifications, so editing
 * this string would silently regenerate three shipped Level I banks differently
 * on the next top-up run. Level II composes on top of it instead - see SCRUM_L2.
 */
const SCRUM_CORE = `Ground each question in the concept(s) provided and in established Scrum and
product-ownership practice (the 2020 Scrum Guide where it applies). Some concepts
extend beyond the Scrum Guide - product strategy, backlog craft, value and
measurement, and AI-assisted product ownership; for those, ground the question in
the concept description and sound product-management practice rather than forcing
a Scrum Guide citation. ${NO_BRAND}`;

/* ---------------------------------------------------------------------------
 * SCRUM_GUIDE_FACTS
 *
 * Form follows AUDIT_METHOD's CLAIMS block exactly: heading at column 0,
 * entries as "  - " bullets with continuations at four spaces, each written as
 * CLAIM -> CORRECTION -> REASON.
 *
 * The verbosity is load-bearing. "Never say X" gives the model nothing to write
 * instead; "X is false, here is what the text actually says, and here is why
 * the confusion arises" gives it a correct sentence AND a distractor.
 *
 * Four entries are marked [derived]: they are inferences from the Guide, not
 * sentences in it. An item may rely on them; an item may NEVER attribute them
 * to the Guide as a quotation. This is the ISMS-IA attribution defect - "an
 * auditor may not audit their own work" was asserted confidently, is in neither
 * source standard, and survived external review.
 *
 * NOT LEVEL II MATERIAL, AND WIRED INTO LEVEL II ANYWAY. "Only the Product
 * Owner may cancel a Sprint" is as true for SD-AI-I as for SM-AI-II. The three
 * Level I banks were generated against a SCRUM string carrying no never-assert
 * list at all, which is very likely a real quality gap in shipped banks. It is
 * defined here and named, but reaches only SCRUM_L2 - because wiring it into
 * Level I changes generation on three live certifications, and that is a scoped
 * decision with its own review rather than something to slip in alongside a new
 * cert.
 * ------------------------------------------------------------------------- */

const SCRUM_GUIDE_FACTS = `THE SOURCE. The 2020 Scrum Guide (Schwaber and Sutherland) is the authority for
every Scrum fact. It is thirteen pages and it declares itself purposefully
incomplete, defining only the parts required to implement Scrum theory. Where it
is silent, it is silent ON PURPOSE - do not fill the gap with a rule and do not
present common practice as though the Guide prescribed it.

CLAIMS THAT MUST NEVER APPEAR IN A KEY OR AN EXPLANATION - each is widely taught
and none is in the text:
  - That anyone other than the Product Owner may cancel a Sprint. Only the
    Product Owner has that authority, and a Sprint is cancelled when its Sprint
    Goal becomes obsolete - not when the work is late, hard or unpopular.
  - That the Scrum Master may overrule the Product Owner's ordering of the
    Product Backlog. The Product Owner may have others do the ordering work but
    remains accountable, and those wanting a change persuade the Product Owner.
  - That the Scrum Team may weaken an organizational Definition of Done. Where
    the organization has one it is a MINIMUM the Scrum Team may only strengthen.
    Permitted change runs in one direction.
  - That the Scrum Master is accountable for the Increment, the Product Backlog
    or delivery. The Developers are accountable for the Increment; the Product
    Owner for the Product Backlog. The Scrum Master is accountable for the Scrum
    Team's effectiveness.
  - That a Sprint may be extended, paused, or its timebox varied once begun. It
    may not. A fixed length is what makes the Sprint a container that bounds
    risk to one Sprint.
  - That the Daily Scrum is a status report to the Scrum Master, a manager or
    the Product Owner. It is FOR the Developers, to inspect progress toward the
    Sprint Goal and adapt the Sprint Backlog.
  - That the Daily Scrum requires any particular three questions. The 2020
    edition REMOVED them as a requirement. A team may use them; the Guide does
    not ask for them, and an item that treats them as required is testing a
    superseded edition.
  - That a forecast, an estimate or a velocity figure is a commitment. The
    Sprint Backlog is a FORECAST by the Developers. The Sprint Goal is the
    commitment. The distinction does not change because a number looks precise.
  - That Scrum prescribes story points, velocity, burndown charts, or
    refinement as an event. It prescribes none of them. Product Backlog
    refinement is an ongoing ACTIVITY, not one of the five events. A team may
    use any of these; none is Scrum.
  - That Scrum defines ROLES. The 2020 edition defines ACCOUNTABILITIES. The
    change is not cosmetic: a role is a job title a person holds, an
    accountability is an outcome someone is answerable for.
  - That the Scrum Master assigns work to Developers. Nobody does. The
    Developers decide who does what within the Sprint.
  - That a group of people may collectively be "the Product Owner". The Product
    Owner is ONE PERSON. A committee may advise; it may not hold the
    accountability.
  - That the Daily Scrum is for anyone but the Developers. Others may attend
    only if they are actively working on Sprint Backlog items.
  - That a timebox is a fixed duration. Timeboxes are MAXIMA. An event that
    achieves its purpose early ends early.
  - That the Sprint Review is a release gate. Release may happen whenever an
    Increment meets the Definition of Done, including mid-Sprint. Multiple
    Increments may be created within one Sprint.
  - That only one Increment may be created in a Sprint, or that release is
    reserved to Sprint end. Both are false, for the reason immediately above.
  - That the Product Goal and the Sprint Goal are the same thing, or
    interchangeable. The Product Goal is the Product Backlog's commitment and
    describes a future state of the product. The Sprint Goal is the Sprint
    Backlog's commitment and is the single objective for one Sprint.
  - That the Scrum Master writes the Sprint Goal. The whole Scrum Team crafts
    it during Sprint Planning.
  - That the Product Owner must estimate work or assign it. Sizing belongs to
    the Developers; assignment belongs to nobody.
  - That the Scrum Master is an administrative coordinator or secretary for the
    team - a scheduler of meetings, a taker of notes, a chaser of statuses. The
    Guide describes true leaders who serve the team and the organization.
  - That any scaling framework is part of Scrum. None is. Do not name one.
  - That the terms are anything other than the 2020 terms: SELF-MANAGING, not
    self-organizing. EVENTS, not ceremonies. ACCOUNTABILITIES, not roles.
    Prior-edition vocabulary in a stem tells the candidate they are reading an
    item written against a superseded text.

CLAIMS THAT ARE TRUE BUT ARE INFERENCES, NOT QUOTATIONS. An item may rely on
these. An item must NEVER attribute them to the Guide as something it states:
  - [derived] A tool, model or agent holds no Scrum accountability and is not a
    member of the Scrum Team. The Guide says accountabilities are held by the
    Product Owner, the Scrum Master and the Developers, and that the Scrum Team
    is people. It does not discuss tools. Write it the first way, never as "the
    Scrum Guide states that a tool cannot hold an accountability".
  - [derived] The Definition of Done may not be relaxed for AI-generated work.
    This follows from the floor-and-additions rule, which is about the standard
    and says nothing about who or what produced the work.
  - [derived] AI-generated work that meets the Definition of Done IS an
    Increment. This is the INVERSE of the entry above and must ship with it. A
    list that forbids only the permissive error teaches the restrictive one, and
    "generated work cannot be Done" is equally false and harder to catch because
    it sounds cautious.
  - [derived] A model's output does not constitute inspection. Inspection is an
    act the Scrum Team performs against a transparent artifact. A generated
    summary is an artifact that may be inspected, not the inspection itself.
    Items in this domain will invent the opposite if it is not forbidden.`;

/* ---------------------------------------------------------------------------
 * SCRUM_L2_JUDGMENT
 *
 * The borderline candidate, in WORKPLACE's proven form. WORKPLACE does NOT
 * prepend a candidate block: its subject scoping is one clause, the candidate
 * is the second sentence, and the scenario paragraph and three of its four hard
 * constraints refer back to it. The candidate does the work; the scoping opens
 * the door. Same here - SCRUM_CORE has already done the scoping, so this opens
 * on the person.
 *
 * WHY THIS EXISTS AT ALL, AND IT IS NOT ONLY A STANDARD-SETTING DOCUMENT.
 * The Level II contract turns on "a competent practitioner" four times, always
 * as the arbiter of whether the second-best option is defensible. Nothing
 * anywhere said who that is. The pipeline's only model of a candidate is the
 * binary in personaLine - competent versus unprepared - with nothing between,
 * which is exactly the region the second-best option is supposed to occupy.
 * This is the missing term.
 *
 * It is simultaneously the minimally-competent-candidate definition the scheme
 * needs for a modified-Angoff standard-setting panel. Same text, two uses. It
 * must therefore be concrete enough for a model to build a distractor from and
 * disciplined enough for a judge to rate against.
 * ------------------------------------------------------------------------- */

const SCRUM_L2_JUDGMENT = `THE CANDIDATE, AND WHO THE SECOND-BEST ANSWER MUST BE DEFENSIBLE TO.

The candidate is an EXPERIENCED Scrum Master - two to five years, several teams,
at least one organization that did Scrum badly. They are not shaky on the
framework. They would pass a Level I examination comfortably: they know the
timeboxes, the accountabilities, the artifacts and their commitments, and they
recognize the named anti-patterns on sight.

What makes them BORDERLINE is narrower and harder. Where the Guide is silent -
which is where this entire examination lives - they reach for what their last
three organizations did, and they cannot reliably tell the difference between
"the Guide does not say" and "the Guide says do it this way". Their habits
usually work. That is what makes them defensible, and it is what makes them the
right author of the second-best option.

THE SECOND-BEST OPTION IS WHAT THIS CANDIDATE WOULD CHOOSE. Write it as the move
they would make and be able to defend in a retrospective. The BEST option is
what a Scrum Master one level further on would choose, and it must beat the
second-best for a reason statable in one sentence. If the second-best is a
mistake rather than a defensible call, the item is a Level I item in the wrong
bank.

WHAT THIS CANDIDATE RELIABLY GETS RIGHT - do not build distractors on these,
they produce items that are Level I wearing a scenario:
  - Applying a rule the Guide determines. Who may cancel a Sprint, which
    direction the Definition of Done may move, who owns the Sprint Backlog.
  - Naming an anti-pattern. They will identify a status-report Daily Scrum
    instantly. What they do about it is the Level II question.
  - Protecting a timebox, and holding the Sprint Goal against casual scope
    pressure.

WHAT THIS CANDIDATE GETS WRONG - each of these is a source for a defensible
second-best:
  - THEY OVER-INTERVENE. Offered a choice between removing an impediment and
    developing the team's capacity to remove it themselves, they remove it. It
    works, the team is grateful, and the team is no more self-managing than it
    was. Proportionality is the competence they lack, not diagnosis.
  - THEY FIX THE VISIBLE SYMPTOM. Told the Daily Scrum has become a status
    report, they change its format. The cause was who attends, or what the team
    believes happens to what they say, and the format was never the problem.
  - THEY IMPORT A PRACTICE AND PRESENT IT AS THE FRAMEWORK. Estimation
    technique, a refinement meeting, a metric, a board policy. Each may be a
    sound complementary practice; the failure is asserting that Scrum requires
    it, or defending it because "that is how Scrum works".
  - THEY ABSORB ACCOUNTABILITIES TO KEEP THINGS MOVING. The Product Owner is
    absent, so they order the backlog. Sprint Planning is stalling, so they
    write the Sprint Goal. Every instance is locally helpful and each one moves
    an accountability that cannot be moved.
  - THEY ESCALATE AT ONE VOLUME. Either they raise an impediment with whoever is
    nearest and let it sit, or they take it to a senior stakeholder immediately.
    Matching the intervention to the impediment's cost, urgency and their own
    standing is the judgment they have not developed.
  - THEY TREAT AN ARTIFACT AS EVIDENCE OF THE ACTIVITY THAT PRODUCES IT. A
    Retrospective happened because there is a list of actions. Inspection
    happened because there is a summary. This failure gets much worse when the
    artifact was generated: the document exists, it reads well, and nobody in
    the team holds what is in it.
  - THEY PROTECT THE RELATIONSHIP OVER THE TRANSPARENCY. Given a choice between
    telling a stakeholder something they will not want to hear and finding a
    formulation that keeps everyone comfortable, they take the second. They know
    this is wrong in the abstract and do it anyway under pressure.
  - IN AN AI-AUGMENTED TEAM, THEY MEASURE WHAT MOVED RATHER THAN WHAT HELD.
    Throughput is up, so the change was good. They are slower to ask whether the
    Increment is still usable, whether the team can still inspect what it
    produced, and whether a Developer can account for work they submitted.

WHAT THE CANDIDATE ONE LEVEL FURTHER ON DOES DIFFERENTLY - this is the BEST
option, and every one of these is a single-sentence reason:
  - Chooses the intervention that leaves the team more capable, not the one that
    resolves the situation fastest.
  - Separates what the Guide determines from what it leaves open, and says which
    they are doing.
  - Treats a practice that works as worth keeping AND as not Scrum, without
    needing to resolve the two.
  - Declines work that would move an accountability, even when declining costs
    the Sprint something.
  - Reads an artifact as a claim to be tested, not as evidence of the activity.
  - Says the uncomfortable thing to the person who can act on it, at the volume
    the impediment warrants and no louder.

SCENARIOS. Draw them from a real team mid-Sprint, with enough specificity that a
reader can tell which option is best: name what is blocked, how much of the
Sprint remains, and what has already been tried. A stem that could be answered
without those details is testing a rule, not judgment.`;

/* ---------------------------------------------------------------------------
 * SCRUM_L2_TAIL
 *
 * Modelled on AUDIT_TAIL, whose first paragraph is the sentence that turns a
 * never-assert list from a prohibition into a source. The second paragraph
 * differs: AUDIT_TAIL's modal rule (shall / should / NOTE) is ISO drafting
 * convention and does not apply to the Scrum Guide, which uses ordinary prose.
 * The Scrum equivalent of that discipline is the silence rule.
 * ------------------------------------------------------------------------- */

const SCRUM_L2_TAIL = `A DISTRACTOR built on one of these is excellent - they are exactly the
misconceptions this exam exists to detect. The KEY and the EXPLANATION must be
clean.

Where an item turns on what the Scrum Guide says, quote or paraphrase it and say
so. Where it turns on what the Guide does NOT say, say that instead - "the Guide
does not address this" is a legitimate and often correct thing for a key to
rest on, and inventing a rule to fill the silence is the single worst failure
available in this examination. ${NO_BRAND}`;

/* ---------------------------------------------------------------------------
 * COMPOSITION
 *
 * Mirrors auditGrounding(criteria) below. SCRUM_GUIDE_FACTS is included here
 * and NOT in SCRUM_CORE, so the three live Level I certifications keep a
 * byte-identical grounding string.
 * ------------------------------------------------------------------------- */

const SCRUM_L2 = `${SCRUM_CORE}

${SCRUM_GUIDE_FACTS}

${SCRUM_L2_JUDGMENT}

${SCRUM_L2_TAIL}`;

/** AIGRM-I - AI governance, risk and compliance practitioners. */
const GOVERNANCE = `Ground each question in the concept(s) provided and in established AI governance,
risk-management and compliance practice. Scenarios should read like the real work
of governance, risk, compliance, legal, audit and data-protection professionals -
classifying a system's risk, running an impact assessment, documenting a model,
handling an incident, evidencing a control to an auditor. Where a concept extends
beyond any single framework, ground the question in the concept description and
sound governance practice rather than forcing a framework citation. Do NOT use
Scrum roles, ceremonies or artifacts (Sprint, Product Owner, backlog, Definition
of Done) - they are irrelevant to this audience. ${NO_BRAND}`;

/**
 * AIE-I - AI literacy for NON-TECHNICAL professionals. The audience is HR,
 * marketing, sales, operations, finance, leadership and education. This grounding
 * is deliberately explicit about what is OUT of bounds, because the concepts here
 * are generic enough that a drafter will otherwise import jargon from elsewhere.
 */
const WORKPLACE = `Ground each question in the concept(s) provided and in ordinary, everyday workplace
practice. The candidate is a NON-TECHNICAL professional - an HR coordinator, a
marketing associate, a sales representative, an operations lead, a finance analyst,
an office manager, a teacher, a team leader. Scenarios must be drawn from that
world: drafting an email or a report, summarizing a document, answering routine
customer questions, reviewing a supplier list, preparing a slide for a meeting,
screening applications, checking a figure before publishing it.

HARD CONSTRAINTS:
  - Do NOT use Scrum or agile roles, ceremonies or artifacts (Sprint, Sprint Review,
    Product Owner, Scrum Master, product backlog, user stories, Definition of Done,
    story points, velocity, retrospectives). They are not part of this exam and a
    candidate cannot be assumed to know them.
  - Do NOT use software-engineering, data-science or product-management craft
    vocabulary (deploying a model, fine-tuning, pipelines, APIs, prioritization
    frameworks). Assume NO technical background whatsoever.
  - Do NOT assume the candidate builds, configures or evaluates AI systems. They
    USE everyday AI tools as part of ordinary office work.
  - Keep scenarios short, plain-language, and globally neutral - no idioms, no
    country-specific institutions, no currency assumptions.

Test judgment about USING AI sensibly at work: recognizing what a tool can and
cannot do, spotting a likely fabrication, deciding what must be verified, knowing
what data must never be pasted into a public tool, and knowing when a human must
stay in the loop. ${NO_BRAND}`;

/**
 * THE AUDITING CRAFT - shared by every management-system auditor cert.
 *
 * WHY THIS IS SEPARATE FROM GOVERNANCE. The governance grounding was catching
 * these certs through /audit/ in the name, and it knows nothing about EDITIONS.
 * A dry run on ISMS-IA task 5.3 produced two items citing ISO 19011:2018 - the
 * superseded third edition - and one asserting that "major classification
 * requires current evidence independently supporting a significant breach", a
 * severity scheme ISO/IEC 27001 does not contain.
 *
 * Neither was a prompt failure. 101 of that cert's 169 concept descriptions name
 * no document at all, so the drafter filled the gap from training data. The
 * edition set and the dismantled claims have to reach the prompt, because the
 * concepts cannot carry them alone.
 *
 * THE ANNEX LIST is here because the critique reviewer had the edition set but
 * not the CONTENTS, so it rejected citations to annexes it could not verify - it
 * threw out a correct reference to Annex A.17 during the ISMS-IA run. Verified
 * against the standard: ISO 19011:2026 has exactly ONE annex, and A.17 is
 * "Conducting interviews".
 *
 * Every correction below was established by reading the standard text directly,
 * not from secondary sources. See the JTA attribution map.
 */
const AUDIT_METHOD = `Ground each question in the work of an INTERNAL auditor examining their own
organization's management system - planning an audit, gathering and weighing
evidence, testing a control against what the Statement of Applicability claims,
writing a finding, following up a corrective action. The candidate audits their
own organization; they are not a certification-body auditor and do not make
certification decisions.

THE AUDIT METHODOLOGY - cite this edition and no other:
  - ISO 19011:2026, the FOURTH edition, "Guidelines for auditing management
    systems". NEVER cite ISO 19011:2018 - it is superseded, and its clause
    numbering differs. The fourth edition cancels and replaces the third; its
    stated changes are expanded guidance on remote auditing methods drawn from
    ISO/IEC TS 17012, and an expanded Annex A covering remote methods and
    virtual locations.
  - ISO 19011:2026 has NO normative references and names no specific management-
    system standard. It is discipline-agnostic: it supplies the METHOD, and the
    criteria standard below supplies what is audited AGAINST.
  - ISO/IEC 17021-1 for anything about certification bodies, certification
    cycles, or certificate validity. It is out of the candidate's remit and is
    named only to mark the boundary.

ISO 19011:2026 STRUCTURE - clauses:
  1 Scope | 2 Normative references (none) | 3 Terms and definitions |
  4 Principles of auditing | 5 Managing an audit programme |
  6 Conducting an audit | 7 Competence and evaluation of auditors.

ISO 19011:2026 HAS EXACTLY ONE ANNEX. There is no Annex B. Annex A is
INFORMATIVE, titled "Additional guidance for auditors for planning and conducting
audits". Cite a subsection only if it appears in this list, and never invent one:
  A.1  Applying auditing methods            A.10 Auditing risks and opportunities
  A.2  Auditing of processes                A.11 Life cycle
  A.3  Professional judgement               A.12 Audit of supply chain
  A.4  Performance results                  A.13 Preparing audit working documents
  A.5  Verifying information                A.14 Selecting sources of information
  A.6  Sampling                             A.15 Visiting the auditee's location
       A.6.1 General                        A.16 Using remote auditing methods
       A.6.2 Judgement-based sampling       A.17 Conducting interviews
       A.6.3 Statistical sampling           A.18 Audit findings
  A.7  Auditing compliance within a               A.18.1 Determining audit findings
       management system                          A.18.2 Recording conformities
  A.8  Auditing context                            A.18.3 Recording nonconformities
  A.9  Auditing leadership and commitment          A.18.4 Dealing with audit findings
                                                          related to multiple criteria

CLAIMS THAT MUST NEVER APPEAR IN A KEY OR AN EXPLANATION - each is widely taught
and none is in the text:
  - That a standard forbids auditing your own work. ISO 19011:2026 clause 4.6
    asks auditors to be independent of the activity audited WHEREVER PRACTICABLE,
    and where internal auditors cannot be, to make every effort to remove bias
    and encourage objectivity. What the criteria standard says is set out below.
  - That "planned intervals" carries a numeric value. It never does, anywhere.
  - That ISO 19011 REQUIRES anything. It is a guidance document - its scope says
    so - and it contains no normative requirement at all: 264 instances of
    "should" and not one operative "shall". Never write "ISO 19011 requires",
    "the standard mandates", or a stem asking "what does ISO 19011 require?".
    Write "recommends", "calls for", "advises", or name the clause and quote its
    modal.
  - That the standard STATES there is no precedence among the seven principles.
    It states nothing of the kind. The words "precedence", "hierarchy" and "rank"
    appear nowhere in the document. Clause 4.1 says only that adherence to the
    principles is fundamental, and that Clauses 5 to 7 are based on the seven
    outlined in 4.2 to 4.8. The absence of a ranking is not a stated rule of no
    ranking - the first is an observation about the text, the second is a claim
    the text does not make. Write "the standard presents all seven as fundamental
    without ranking them", never "the standard states no precedence".

WHERE TWO PRINCIPLES PULL AGAINST EACH OTHER - the analyze-level heart of these
certs - the resolution is professional judgement, because nothing in the text
ranks them. These are the pairs that genuinely collide, drawn from the clause
text itself:
  - evidence-based (4.7, sampling and verifiability) against risk-based (4.8,
    which "should substantively influence the planning and implementation of the
    audit programme");
  - independence (4.6, "wherever practicable", with the explicit internal-auditor
    carve-out: where it is not possible, "every effort should be made to remove
    bias and encourage objectivity") against due professional care (4.4,
    competence and reasoned judgement);
  - integrity (4.2, honesty) against fair presentation (4.3, which requires the
    communication to be "truthful, accurate, objective, timely, clear and
    complete");
  - fair presentation (4.3, completeness) against confidentiality (4.5,
    discretion in the use and protection of information).`;

/** ISMS-IA - what an ISO/IEC 27001 internal auditor audits AGAINST. */
const CRITERIA_27001 = `THE CRITERIA STANDARD - cite these and no others:
  - ISO/IEC 27001:2022, INCLUDING Amendment 1:2024. The amendment adds one
    sentence to clause 4.1 (determine whether climate change is a relevant issue)
    and NOTE 2 to clause 4.2. Nothing else.
  - ISO/IEC 27000 for defined terms.

CLAIMS THAT MUST NEVER APPEAR IN A KEY OR AN EXPLANATION:
  - That ISO/IEC 27001 forbids auditing your own work. It does not say it.
  - That any clause requires a RISK REGISTER. No clause does. Clauses 6.1.2 and
    6.1.3 require documented information about the PROCESSES; clauses 8.2 and 8.3
    require it of the RESULTS.
  - That ISO/IEC 27001 defines MAJOR and MINOR nonconformities. It defines no
    severity scheme at all. Those categories come from third-party certification
    practice under ISO/IEC 17021-1, and an internal programme may adopt any
    scheme it declares.`;

/**
 * AIMS-IA - what an ISO/IEC 42001 internal auditor audits AGAINST.
 *
 * 42001 IS NOT 19011 AND IS NOT 27001. Read from the standard directly:
 *
 *   - 121 "shall" against 166 "should", and the split is STRUCTURAL, not mixed
 *     prose. Clauses 4-10 contain 81 "shall" and ZERO "should". Annex A is
 *     "shall". Annex B is almost entirely "should". Annexes C and D are
 *     informative.
 *   - Annex B is NORMATIVE - the contents page says so - yet restates each of the
 *     38 controls under a "Control" heading using SHOULD where Table A.1 says
 *     SHALL. The paradox resolves at clause 6.1.3 e): the organization "shall
 *     consider the guidance in Annex B". Annex B binds as an input you must
 *     consider, not as text whose own sentences are requirements.
 *   - "risk register" appears zero times, exactly as in 27001.
 *   - The climate-change wording is in the PUBLISHED FIRST EDITION. There is no
 *     amendment to 42001.
 */
const CRITERIA_42001 = `THE CRITERIA STANDARD - cite these and no others:
  - ISO/IEC 42001:2023, "Information technology - Artificial intelligence -
    Management system", FIRST edition, December 2023.
  - There is NO amendment to ISO/IEC 42001. Never cite "ISO/IEC 42001:2023/Amd
    1" or "Amendment 1:2024" for this standard - unlike ISO/IEC 27001, the
    climate-change wording is in the published first edition itself: clause 4.1
    "The organization shall determine whether climate change is a relevant
    issue", and the NOTE at 4.2 that relevant interested parties can have
    requirements related to climate change.
  - ISO/IEC 22989:2022 for defined terms. It is the ONLY normative reference in
    ISO/IEC 42001, and it is a DATED reference, so a future edition of 22989 does
    not flow through. Clause 3 of 42001 itself defines the rest.
  - ISO/IEC 42006:2025 exists and supplements ISO/IEC 17021-1 with AI-specific
    requirements for bodies that AUDIT AND CERTIFY an AIMS. It governs
    certification bodies, not this candidate. NEVER cite a clause, table or annex
    of ISO/IEC 42006 - the document is not held and no citation to it can be
    verified. Name it only to mark the boundary.

THE MODAL STRUCTURE OF ISO/IEC 42001 - this is what the cert tests:
  - Clauses 4 to 10 are the requirements. They are written entirely in "shall"
    and contain no "should" at all.
  - Annex A (NORMATIVE), "Reference control objectives and controls", holds
    Table A.1: 38 controls, each stated with "shall".
  - Annex B (NORMATIVE), "Implementation guidance for AI controls", is written in
    "should". It restates each control under a "Control" heading in the SHOULD
    form. Clause 6.1.3 e) is what makes it normative: the organization "shall
    consider the guidance in Annex B". B.1 adds that organizations do not have to
    document or justify inclusion or exclusion of implementation guidance in the
    statement of applicability.
  - Annexes C and D are INFORMATIVE.

CLAIMS THAT MUST NEVER APPEAR IN A KEY OR AN EXPLANATION:
  - That ISO/IEC 42001 forbids auditing your own work. It does not say it.
    Clause 9.2.2 b) asks the organization to select auditors and conduct audits
    to ensure objectivity and the impartiality of the audit process, and names no
    independence rule beyond that.
  - That any clause requires a RISK REGISTER. The phrase appears nowhere in the
    standard. Clause 6.1.3 requires a documented risk treatment PROCESS and a
    statement of applicability; 6.1.4 requires the RESULT of the AI system impact
    assessment to be documented.
  - That ISO/IEC 42001 defines MAJOR and MINOR nonconformities. It defines no
    severity scheme. Clause 10.2 describes reacting to a nonconformity and
    corrective action without grading it.
  - That Annex B is informative. It is normative - but see the modal note above,
    and never quote an Annex B sentence as a requirement.
  - That a Table A.1 control is required unconditionally. Annex A.1 states that
    "Not all the control objectives and controls listed in Table A.1 are required
    to be used", and clause 6.1.3 b)-d) has the organization compare, consider
    and extend them. Every Table A.1 "shall" is conditional on that control being
    necessary and declared in the statement of applicability. Write "where A.2.2
    is selected, the organization shall document an AI policy", never "ISO/IEC
    42001 requires an AI policy".
  - A FINDING WHOSE EVIDENCE DOES NOT REACH THE CITED CRITERION. This is the
    commonest defect in a generated finding and it survives casual reading.
    A.2.2 requires only that the organization DOCUMENT a policy for the
    development or use of AI systems - so a policy that exists but omits some
    content does NOT breach A.2.2, and no clause requires a policy to mention
    any particular topic. Content requirements for the AI policy are at clause
    5.2 and are different. Before writing any finding, read the cited text and
    confirm the evidence would actually fail it.

CLAUSE LETTERS AND SUB-CLAUSE NUMBERS - THE HARDEST RULE IN THIS BLOCK.
Do NOT assert a sub-clause letter or number unless it appears in this grounding
block. Cite the clause at the level you can verify: "clause 6.1.2" and "clause
5.2" are safe; "6.1.2 c)" and "5.2 e)" are claims about internal structure and
are frequently wrong. Two observed failures, both from importing ISO/IEC 27001:
  - "clause 6.1.2 c) requires documented acceptance criteria" - FALSE TWICE.
    6.1.2 c) is "identifies risks that aid or prevent achieving its AI
    objectives", and the phrase "acceptance criteria" appears NOWHERE in
    ISO/IEC 42001. Risk criteria are required by clause 6.1.1, which requires
    the organization to establish and maintain AI risk criteria that support
    distinguishing acceptable from non-acceptable risks; 6.1.2 e) 1) compares
    the analysis against those criteria and points back to 6.1.1.
  - "clause 5.2 e) requires policy communication" - THERE IS NO 5.2 e).
    Clause 5.2 runs a) to d) for the policy's properties, then uses DASHES for:
    available as documented information; refer as relevant to other
    organizational policies; communicated within the organization; available to
    interested parties as appropriate. Cite "clause 5.2" and quote the dash item.

THE COMPLETE TABLE A.1 CONTROL LIST. Cite a control ONLY if it appears here.
Inventing a control number is the same defect as inventing a clause letter, and
it was observed once (A.6.1.5, which does not exist - A.6.1 has exactly two
controls). There are 38 controls in nine families:
  A.2  Policies related to AI               A.2.2  A.2.3  A.2.4
  A.3  Internal organization                A.3.2  A.3.3
  A.4  Resources for AI systems             A.4.2  A.4.3  A.4.4  A.4.5  A.4.6
  A.5  Assessing impacts of AI systems      A.5.2  A.5.3  A.5.4  A.5.5
  A.6  AI system life cycle
       A.6.1 Management guidance for AI system development   A.6.1.2  A.6.1.3
       A.6.2 AI system life cycle  A.6.2.2  A.6.2.3  A.6.2.4  A.6.2.5  A.6.2.6
                                   A.6.2.7  A.6.2.8
  A.7  Data for AI systems                  A.7.2  A.7.3  A.7.4  A.7.5  A.7.6
  A.8  Information for interested parties   A.8.2  A.8.3  A.8.4  A.8.5
  A.9  Use of AI systems                    A.9.2  A.9.3  A.9.4
  A.10 Third-party and customer relations   A.10.2 A.10.3 A.10.4
Note the numbering starts at .2 in every family - the .1 slot is the family's
own objective statement, not a control. There is no A.2.1, no A.4.1 control,
and no A.6.1.4 or A.6.1.5.

AN EXCLUDED CONTROL CANNOT ANCHOR A FINDING, EVEN CONDITIONALLY. Where the
statement of applicability excludes a control, that control carries no
obligation (Annex A.1). If the exclusion looks wrong, the finding is at clause
6.1.3 - limb b) requires the organization to determine all necessary controls
and compare them with Annex A to verify that no necessary control has been
omitted, and limb f) requires justification for inclusions and exclusions.
Never write "a finding can rest on A.5.4 once the exclusion is shown
unjustified": the determination is what failed, and the control does not become
citable by the auditor disagreeing with the exclusion.
  - That ISO/IEC 42001 requires the use of ISO 19011. It does not. ISO 19011 is
    named once, in a Note to entry under clause 3.18, observing that "audit
    evidence" and "audit criteria" are defined there. Clause 9.2 sets out the
    internal audit requirement in its own words.
  - That the AI system impact assessment (6.1.4, 8.4) and the AI risk assessment
    (6.1.2, 8.2) are the same activity. They are distinct: the impact assessment
    addresses consequences for individuals, groups and societies, and 6.1.4
    requires its results to be CONSIDERED IN the risk assessment.
  - That clause 6.1.4 requires a SEPARATE or DISTINCT process, or that one
    document cannot satisfy both 6.1.4 and 6.1.2. The clause requires a defined
    process, a documented result, and consideration of that result in the risk
    assessment. It prescribes no document count and no format. Where an
    organization merges them, the available finding is that the CONSIDERATION
    cannot be evidenced - never that a merged document is forbidden.
  - That the NOTE under 6.1.2 d) 1) does not exist. It does: "When assessing the
    consequences as part of 6.1.2 d) 1), the organization can utilize an AI
    system impact assessment as indicated in 6.1.4." It is a "can" - permission
    to draw on the impact assessment inside the risk assessment, not permission
    to let one process discharge both requirements.

ONE DRAFTING ANOMALY, stated so an item does not trip on it: Note 2 to entry
under clause 3.26 (statement of applicability) contains "shall" - all identified
risks and the controls addressing them shall be reflected in the statement of
applicability. A note carrying a requirement is unusual and an item should not
turn on whether notes are normative in general. Prefer clause 6.1.3 f), which
requires the statement of applicability in the requirement text itself.`;

/** The close, appended to every composed audit grounding. */
const AUDIT_TAIL = `A DISTRACTOR built on one of these is excellent - they are exactly the
misconceptions this exam exists to detect. The KEY and the EXPLANATION must be
clean.

Where an item turns on what a document says, name the document and preserve the
modal: "shall" is a requirement, "should" is guidance, and a NOTE is neither.
${NO_BRAND}`;

/** Compose the auditing craft with the criteria standard for this cert. */
function auditGrounding(criteria) {
  return `${AUDIT_METHOD}

${criteria}

${AUDIT_TAIL}`;
}

const AUDIT_27001 = auditGrounding(CRITERIA_27001);
const AUDIT_42001 = auditGrounding(CRITERIA_42001);

/**
 * An audit cert whose criteria standard is not yet registered. Method only -
 * never someone else's editions. If you are seeing this in a generation log, add
 * a CRITERIA_* block before generating a single item.
 */
const AUDIT_METHOD_ONLY = `${AUDIT_METHOD}

THE CRITERIA STANDARD for this certification is not registered in
item-grounding.mjs. Do NOT assume one, and do NOT cite the edition of any
management-system standard. Ground every question in the concept descriptions
provided and in ISO 19011:2026 audit methodology alone.

${AUDIT_TAIL}`;

/** Fallback for any cert not yet registered - neutral, never Scrum. */
const NEUTRAL = `Ground each question in the concept(s) provided and in established professional
practice for this subject area, as described by the concept descriptions
themselves. Scenarios should reflect the real working context of the practitioner
this certification is aimed at. Do NOT import vocabulary, roles or ceremonies from
unrelated disciplines (in particular, do NOT use Scrum or agile roles, ceremonies
or artifacts unless the concepts themselves are about Scrum). ${NO_BRAND}`;

/**
 * Resolve grounding from the cert name the generators already pass.
 * Order matters: check the most specific patterns first.
 *
 * TIER, NOT NAME. `\bscrum\b` cannot tell "Scrum Master I - AI" from "Scrum
 * Master II - AI" without matching on a numeral, and routing a TIER decision off
 * a naming convention is the defect this file was created to fix one layer down
 * (AUDIT hardcoding 27001 and matching on /auditor/). `tier` DEFAULTS TO 1, so
 * every existing caller keeps its exact behaviour.
 *
 * @param {string} certName e.g. "AI Essentials I", "Scrum Master I - AI",
 *                          "ISO/IEC 42001:2023 Internal Auditor"
 * @param {number} [tier=1] the certification's tier. Only the Scrum branch reads it.
 * @returns {string} the grounding block to inject into the draft prompt
 */
export function groundingFor(certName, tier = 1) {
  const n = (certName || "").toLowerCase();

  // Scrum family (Scrum Master / Scrum Product Owner / Scrum Developer).
  if (/\bscrum\b/.test(n)) return tier >= 2 ? SCRUM_L2 : SCRUM_CORE;

  // AI Essentials (literacy tier) - check BEFORE governance, since both say "AI".
  if (/essential/.test(n)) return WORKPLACE;

  // Management-system auditing certs. MUST precede the governance test, which
  // catches "Internal Auditor" via /audit/ and knows nothing about editions.
  // Route on the STANDARD, not on the word "auditor": the criteria half differs
  // per cert and inheriting the wrong one is silent and total.
  if (/auditor|internal audit/.test(n)) {
    if (/42001|\baims\b/.test(n)) return AUDIT_42001;
    if (/27001|\bisms\b/.test(n)) return AUDIT_27001;
    return AUDIT_METHOD_ONLY;
  }

  // AI governance / risk / compliance.
  if (/governance|risk|compliance|audit/.test(n)) return GOVERNANCE;

  return NEUTRAL;
}

/** Exported for tests / inspection. */
export const GROUNDINGS = {
  /** Back-compat: the key stays SCRUM; the const was renamed SCRUM_CORE. */
  SCRUM: SCRUM_CORE,
  SCRUM_L2,
  SCRUM_GUIDE_FACTS,
  SCRUM_L2_JUDGMENT,
  GOVERNANCE,
  WORKPLACE,
  NEUTRAL,
  AUDIT_METHOD,
  CRITERIA_27001,
  CRITERIA_42001,
  AUDIT_27001,
  AUDIT_42001,
  AUDIT_METHOD_ONLY,
  /** Back-compat: the old single AUDIT constant was ISMS-IA's grounding. */
  AUDIT: AUDIT_27001,
};
