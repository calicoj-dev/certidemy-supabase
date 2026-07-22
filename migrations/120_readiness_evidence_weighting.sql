-- 120_readiness_evidence_weighting.sql
--
-- Replaces v_user_exam_readiness (119) with evidence-weighted coverage.
--
-- WHY 119 WAS WRONG, and the data said so immediately: it reported coverage
-- 1.0000 and a +/-5 band for a learner who had completed 1 of 44 lessons on
-- SD-AI-I. Cause: user_concept_mastery has a row the moment a concept is
-- attempted ONCE, so counting rows measures PRESENCE, not EVIDENCE. Every
-- learner looked fully measured as soon as they touched a cert.
--
-- Observed distribution for a real learner: 100 concepts at exactly 1 attempt,
-- 308 at 3+, tail out to 132. A concept answered once on a 4-option item is
-- close to a coin flip wearing a lab coat; it must not buy the same confidence
-- as one answered five times across spaced reviews.
--
-- EVIDENCE FUNCTION: evidence = least(1.0, attempts / 3.0)
--   1 attempt -> 0.33, 2 -> 0.67, 3+ -> 1.0
-- Three is chosen because below it a single lucky or unlucky answer dominates
-- the estimate on a 4-option item. It is still a chosen constant, but it is a
-- FLOOR with a stated rationale rather than a fitted curve, and it moves only
-- the confidence band.
--
-- ============ THE TRAP THIS DELIBERATELY AVOIDS =============================
-- Evidence weighting is applied to COVERAGE ONLY, never to the point estimate.
-- FSRS resurfaces concepts the learner is WEAK on, so attempts correlate with
-- difficulty. Weighting the predicted score by attempts would let struggling
-- concepts dominate the mean and depress the estimate for a reason that has
-- nothing to do with readiness. The point estimate stays a plain mean of
-- mastery within each domain, weighted only by the blueprint.
-- ============================================================================
--
-- Everything else from 119 is unchanged and still applies: blueprint weighting
-- by domains.weight_pct, unmeasured domains treated as UNKNOWN rather than
-- zero, is_reportable gate at 25% coverage, security_invoker so RLS on
-- user_concept_mastery still governs.
--
-- ASCII only. Idempotent.
--
-- DROP FIRST, DELIBERATELY. create-or-replace CANNOT rename or reorder a view's
-- columns - only rewrite its body - and this renames concepts_measured to
-- concepts_seen, because a mastery row means the concept was SEEN at least
-- once, not that it was meaningfully measured. That naming error is what made
-- 119 wrong, so it is worth correcting rather than preserving.
--
-- Safe to drop: nothing depends on this view yet. loadHomeData still reads
-- pass_predictions and is wired to the view only after this verifies.

drop view if exists public.v_user_exam_readiness;

create view public.v_user_exam_readiness
with (security_invoker = true) as
with scope as (
  select d.certification_id, d.id as domain_id, d.code as domain_code,
         d.weight_pct, tc.concept_id
    from public.domains d
    join public.tasks t on t.domain_id = d.id and coalesce(t.is_exam_scope, true)
    join public.task_concepts tc on tc.task_id = t.id
   where coalesce(d.weight_pct, 0) > 0
   group by 1, 2, 3, 4, 5
),
domain_totals as (
  select certification_id, domain_id, domain_code, weight_pct,
         count(*)::int as concepts_total
    from scope
   group by 1, 2, 3, 4
),
measured as (
  select m.user_id, s.certification_id, s.domain_id,
         count(*)::int as concepts_seen,
         -- EVIDENCE, not row count. Saturates at 3 attempts.
         sum(least(1.0, m.attempts::numeric / 3.0)) as evidence,
         -- Plain mean: deliberately NOT attempts-weighted (see header).
         avg(m.mastery_score) as avg_mastery,
         sum(m.attempts)::int as attempts_total
    from scope s
    join public.user_concept_mastery m on m.concept_id = s.concept_id
   group by 1, 2, 3
),
users_certs as (
  select distinct user_id, certification_id from measured
),
per_domain as (
  select uc.user_id, dt.certification_id, dt.domain_id, dt.domain_code,
         dt.weight_pct, dt.concepts_total,
         coalesce(me.concepts_seen, 0)   as concepts_seen,
         coalesce(me.evidence, 0)        as evidence,
         coalesce(me.attempts_total, 0)  as attempts_total,
         me.avg_mastery
    from users_certs uc
    join domain_totals dt on dt.certification_id = uc.certification_id
    left join measured me
           on me.user_id = uc.user_id and me.domain_id = dt.domain_id
),
rolled as (
  select
    user_id,
    certification_id,
    sum(concepts_total)::int  as concepts_total,
    sum(concepts_seen)::int   as concepts_seen,
    sum(attempts_total)::int  as attempts_total,
    -- Blueprint-weighted, evidence-based coverage.
    round(
      sum(weight_pct * evidence / nullif(concepts_total, 0)) / 100.0
    , 4) as coverage,
    sum(weight_pct * avg_mastery) filter (where avg_mastery is not null)
      as weighted_mastery_sum,
    sum(weight_pct) filter (where avg_mastery is not null)
      as measured_weight,
    (array_agg(domain_code order by avg_mastery asc nulls last))[1]
      as weakest_domain_code,
    min(avg_mastery) as weakest_domain_mastery
  from per_domain
  group by 1, 2
)
select
  user_id,
  certification_id,
  coverage,
  concepts_total,
  concepts_seen,
  attempts_total,
  case when measured_weight > 0
       then round(100 * weighted_mastery_sum / measured_weight, 1)
  end as predicted_score_pct,
  least(45, round(5 + 30 * (1 - coverage), 1)) as confidence_half_pct,
  (coverage >= 0.25 and measured_weight > 0) as is_reportable,
  weakest_domain_code,
  round(weakest_domain_mastery, 3) as weakest_domain_mastery
from rolled;

comment on view public.v_user_exam_readiness is
  'Live blueprint-weighted exam readiness. Coverage is EVIDENCE-weighted (least(1, attempts/3)) so a once-answered concept does not buy full confidence; evidence never touches the point estimate, because FSRS resurfaces weak concepts and attempts therefore correlate with difficulty. security_invoker.';

grant select on public.v_user_exam_readiness to authenticated;

-- Verify - SD-AI-I (1 of 44 lessons) must now show materially lower coverage
-- and a wider band than SM-AI-I (31 of 31):
--   select c.code, r.coverage, r.predicted_score_pct, r.confidence_half_pct,
--          r.is_reportable, r.concepts_seen, r.concepts_total, r.attempts_total,
--          r.weakest_domain_code
--     from public.v_user_exam_readiness r
--     join public.certifications c on c.id = r.certification_id
--    where r.user_id = '<uuid>'
--    order by c.code;
