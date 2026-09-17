/**
 * lesson-repairs-aimsf.mjs - AIMS-F lesson passages, as data.
 *
 * Sequenced by PASSAGES PER LESSON ASCENDING, because the gate is per
 * lesson_group_id: a lesson with three of four passages fixed is still
 * withheld, so finished lessons are the only unit that converts work into
 * servable content. Seven lessons carry exactly one passage; they are this
 * batch, and they are seven servable lessons for seven edits.
 *
 * Reuse was the wrong axis and was measured to be: scoped to AIMS-F alone, 84
 * of its 105 distinct passages are quoted exactly once and the maximum reuse is
 * four. The corpus-wide leverage curve came from the IA certifications quoting
 * the same clauses as each other, and none of that helps here.
 *
 * ============ FIVE OF THE SEVEN REUSE A BLUEPRINT RECAST ============
 *
 * The blueprint pass repaired the same ISO sentences in `tasks.knowledge` hours
 * earlier, so the wording below is not freshly invented for five of them -- it
 * is the phrasing already checked by the leak index and the obligation guard,
 * applied to a second surface. Cross-surface reuse was not something the
 * per-certification census could see, because it counted passages within
 * lessons only.
 *
 * ============ ENGLISH ONLY, AND THAT IS AN ACCEPTED ASYMMETRY ============
 *
 * The gate keys on the group maximum, and es-419 / pt-BR rows score zero against
 * an English index, so repairing English alone flips the group to servable.
 *
 * That means shipping a lesson whose Spanish and Portuguese still carry ISO's
 * sentence in translation -- invisible to every instrument here. It is the same
 * acceptance already made for the blueprint, made again knowingly, and the
 * translations are queued rather than guessed. The alternative is not shipping
 * AIMS-F courseware at all.
 */

export const REPAIRS = [
  {
    cert: "AIMS-F", slug: "05-06-integrated-audit-programme", address: "42001 definition of audit, note",
    en: {
      before: "an audit can be a **combined audit, combining two or more disciplines.**",
      after: "a single audit may cover two or more disciplines at once -- what the standard calls a **combined audit.**",
    },
  },
  {
    cert: "AIMS-F", slug: "01-02-determining-your-roles", address: "42001 A.10 relationship controls",
    note: "the list reorder already used for tasks.knowledge 4.6",
    en: {
      before: "responsibilities allocated between the organization, its partners, suppliers, customers and third parties",
      after: "responsibilities allocated between the organization and its suppliers, partners, customers and other third parties",
    },
  },
  {
    cert: "AIMS-F", slug: "04-07-control-overlap-with-27001", address: "42001 Annex B, holistic management",
    note: "reorder plus one verb; `should` is held as `should`",
    en: {
      before: "Safety, security, privacy and environmental impact should be managed holistically rather than",
      after: "Security, privacy, safety and environmental impact should be handled as one whole rather than",
    },
  },
  {
    cert: "AIMS-F", slug: "03-08-clause-8-operational-duties", address: "42001 clause 8.4",
    note: "the same recast as tasks.knowledge 3.8 span 2",
    en: {
      before: "Performed in accordance with clause 6.1.4, at planned intervals or when significant changes are proposed to occur.",
      after: "Performed in accordance with clause 6.1.4, on the same trigger as the risk assessment: planned intervals, plus any significant change that is proposed.",
    },
  },
  {
    cert: "AIMS-F", slug: "01-05-drivers-and-what-certification-means", address: "42001 clause 1, scope",
    note: "TWO instances. The second is inside a ::checkpoint JSON block -- not a bank item, and not served over MCP, since courseware-read replaces content_md with PUBLISHED_BLOCKS only. Repaired anyway: a learner reads it in the app, and leaving the two copies saying different things is its own defect.",
    en: {
      before: "**can generate evidence of its responsibility and accountability regarding its role with respect to AI systems.**",
      after: "**can produce evidence that it is responsible and accountable for whatever role it holds around AI systems.**",
    },
    also: [{
      before: '"text": "That the organization can generate evidence of its responsibility and accountability regarding its role with respect to AI systems"',
      after: '"text": "That the organization can produce evidence that it is responsible and accountable for whatever role it holds around AI systems"',
    }],
  },
  {
    cert: "AIMS-F", slug: "05-05-the-certification-route", address: "42001 clause 1, scope",
    note: "the same sentence as 01-05 and tasks.knowledge 1.5 / 5.5",
    en: {
      before: "can generate evidence of its responsibility and accountability regarding its role with respect to AI systems.",
      after: "can produce evidence that it is responsible and accountable for whatever role it holds around AI systems.",
    },
  },
  {
    cert: "AIMS-F", slug: "02-07-risk-versus-impact", address: "42001 clause 6.1.4",
    note: "the same recast as tasks.knowledge 2.7; `requiring` is held",
    en: {
      before: "requiring the organization to **consider the results of the AI system impact assessment in the risk assessment.**",
      after: "requiring the impact assessment's results **to be taken into account when risk is assessed.**",
    },
  },
];
