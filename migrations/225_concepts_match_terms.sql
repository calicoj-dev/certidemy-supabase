-- 225_concepts_match_terms.sql
--
-- Adds concepts.match_terms: the surface forms a real document would print,
-- kept separate from the analytic name.
--
-- ====================== WHY, WITH THE NUMBERS ======================
--
-- Coverage of TUV SUD read 19% against a hand score of 49%. Two candidate
-- causes were tested rather than guessed at:
--
--   AI-scope concepts in the denominator (migration 224). Measured: removing
--   extended-only concepts moves TUV from 19% to about 21%. Worth ~2 points.
--
--   PHRASING. Worth the other ~28.
--
-- Our concept names are analytic, because they are JTA artifacts:
--
--   "Scrum Master serves the Product Owner"
--   "Accountability boundaries"
--   "Developer broad definition"
--   "Self-organizing (deprecated)"
--
-- TUV expresses the first as "Responsibilities of the Scrum Master with the
-- Product Owner". Same competence, near-zero overlap on the tokens that
-- distinguish it -- and after the IDF fix, those distinguishing tokens are
-- exactly what the matcher requires. Precision made the mismatch worse.
--
-- Embeddings would not fully solve this either: semantic similarity between a
-- plain course topic and a 6-word analytic phrase is genuinely low, because
-- they are not the same statement.
--
-- ================== THE SEPARATION, AND ITS PRECEDENT ==================
--
-- name        what the concept IS. A JTA artifact. Unchanged, and it should
--             stay analytic -- that precision is why the blueprint is any good.
-- match_terms what a document would CALL it. Matching surface only.
--
-- Exactly the separation drift_rules already makes between legacy_term (what to
-- match) and rationale (what it means). One column carrying both jobs does
-- neither well.
--
-- ====================== AUTHORING DISCIPLINE ======================
--
-- Terms are GROUNDED IN OUR OWN LESSON PROSE, not invented. Each concept's
-- lessons already teach it in the plain language a syllabus would use, and
-- lessons are inside the analyzer firewall allowlist. Inventing surface forms
-- from model knowledge is the same attribution failure that produced false
-- "ISO 19011 requires..." claims.
--
-- Terms are ADDITIVE AND OPTIONAL. The matcher tries the name plus every term
-- and takes the best band, so:
--   * nothing regresses when a concept has no terms
--   * coverage improves monotonically as terms are authored
--   * this can be done domain by domain across several sessions
--
-- A term must be DISCRIMINATING. "team" is not a match term for
-- "Cross-functional team"; "cross-functional" already is. A term so generic it
-- appears in every syllabus credits coverage nobody earned, and over-crediting
-- a competitor is the direction of error that makes the tool worthless.
--
-- ASCII-only. Editor-first.
--
-- Tip before this migration: 224. This is 225.


alter table public.concepts
  add column if not exists match_terms text[] not null default '{}';

comment on column public.concepts.match_terms is
  'Surface forms a real document would print for this concept, for analyzer matching only. Separate from name, which is the analytic JTA artifact and stays analytic. Grounded in our own lesson prose, never invented. Additive and optional: the matcher tries name plus every term and takes the best band, so coverage improves monotonically as terms are authored. Terms must discriminate -- a term generic enough to appear in every syllabus credits coverage nobody earned.';


-- =====================================================================
-- VERIFICATION - run these ONE AT A TIME.
-- =====================================================================

-- 1) column exists, defaulted empty everywhere (expect 0 with terms)
-- select count(*) as concepts_total,
--        count(*) filter (where cardinality(match_terms) > 0) as with_terms
--   from public.concepts;

-- 2) authoring worklist: core-scope concepts with no terms yet, by domain,
--    heaviest domain first. This is the queue.
-- select d.code, d.weight_pct, count(distinct c.id) as needs_terms
--   from public.concepts c
--   join public.task_concepts tc on tc.concept_id = c.id
--   join public.tasks t on t.id = tc.task_id
--   join public.domains d on d.id = t.domain_id
--   join public.certifications cert on cert.id = c.certification_id
--  where cert.code = 'SM-AI-I'
--    and t.scope_tag = 'core'
--    and cardinality(c.match_terms) = 0
--  group by d.code, d.weight_pct, d.order_index
--  order by d.order_index;

-- 3) evidence source for authoring: the lessons that teach a given concept.
--    Read these to find how the concept is actually phrased in plain language.
-- select c.slug, l.slug as lesson_slug, l.title
--   from public.concepts c
--   join public.lesson_concepts lc on lc.concept_id = c.id
--   join public.lessons l on l.id = lc.lesson_id
--   join public.certifications cert on cert.id = c.certification_id
--  where cert.code = 'SM-AI-I'
--    and c.slug = 'sm-serves-po'
--  order by l.slug;
