-- 119_exam_readiness_view.sql
--
-- Exam readiness, DERIVED from what the platform actually measures.
--
-- WHAT IT REPLACES: score-mock-exam computes
--     adjusted = score_pct - 5
--     predicted = sigmoid((adjusted - passing_threshold) / 8) * 100
-- Two magic numbers - a flat 5-point penalty and a slope of 8 - neither from
-- the database nor from evidence. It is a plausible-looking curve, not a
-- measurement, and it only ever fires after a mock exam. pass_predictions has
-- ZERO ROWS because nothing has ever written it.
--
-- For a scheme whose claim is "tested against a JTA, audit-ready by design", a
-- readiness number that is really a hardcoded sigmoid does not survive
-- scrutiny. This computes it from the blueprint instead.
--
-- ============================ THE MODEL =====================================
--
-- 1. BLUEPRINT-WEIGHTED, NOT A FLAT AVERAGE. The exam samples domains by
--    domains.weight_pct. Strong in a 12.5% domain and weak in a 30% domain is
--    NOT ready, and a flat mean hides exactly that.
--
-- 2. COVERAGE IS AS MEANINGFUL AS SCORE. Mastery of 0.9 across 15% of the
--    exam-scope concepts tells you almost nothing. Coverage is reported
--    separately and drives the confidence interval, so a thinly-measured
--    learner sees a WIDE band rather than a falsely precise number.
--
-- 3. UNMEASURED DOMAINS ARE UNKNOWN, NOT ZERO. The predicted score renormalizes
--    over the domains that have been measured. Treating an untouched domain as
--    0% would tell a learner who has studied one domain well that they are
--    failing, which is both wrong and discouraging.
--
-- 4. BELOW A COVERAGE FLOOR IT REPORTS NOTHING. is_reportable = false under 25%
--    coverage. "Not measured yet" is the honest answer; a confident number
--    built on four questions is worse than no number.
--
-- 5. MASTERY MAPS TO EXPECTED SCORE 1:1. mastery_score is the proportion the
--    learner gets right on that concept, so a weighted mean of mastery is a
--    first-order estimate of exam score. This is an ASSUMPTION and it is the
--    one most worth revisiting once real attempt data exists - at that point
--    the honest move is to regress predicted against actual and recalibrate,
--    not to add another invented constant.
--
-- CONFIDENCE INTERVAL: half-width = 5 + 30 * (1 - coverage), clamped at 45.
-- Fully measured -> +/-5 (irreducible: mastery is an estimate too).
-- 25% coverage   -> +/-27.5. The two constants ARE arbitrary, and unlike the
-- old sigmoid they are labelled as such and affect only the band, never the
-- point estimate.
--
-- SCOPE: only tasks with is_exam_scope AND domains with weight_pct > 0.
-- weight_pct is the exam's dark lever; a domain weighted 0 is not on the exam
-- and must not move readiness.
--
-- SECURITY INVOKER: without it the view would run as owner and expose every
-- learner's mastery to every learner. RLS on user_concept_mastery still applies.
--
-- pass_predictions is NOT dropped - it remains the right place for a
-- point-in-time record written at exam time. This view is the live estimate.
--
-- ASCII only. Idempotent.

create or replace view public.v_user_exam_readiness
with (security_invoker = true) as
with scope as (
  -- Distinct exam-scope concepts per weighted domain.
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
         count(*)::int as concepts_measured,
         avg(m.mastery_score) as avg_mastery
    from scope s
    join public.user_concept_mastery m on m.concept_id = s.concept_id
   group by 1, 2, 3
),
users_certs as (
  select distinct user_id, certification_id from measured
),
per_domain as (
  -- Every weighted domain of the cert, whether or not this user has touched it.
  select uc.user_id, dt.certification_id, dt.domain_id, dt.domain_code,
         dt.weight_pct, dt.concepts_total,
         coalesce(me.concepts_measured, 0) as concepts_measured,
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
    sum(concepts_total)::int    as concepts_total,
    sum(concepts_measured)::int as concepts_measured,
    -- Blueprint-weighted coverage: a 30% domain counts more than a 5% one.
    round(
      sum(weight_pct * concepts_measured::numeric / nullif(concepts_total, 0))
      / 100.0
    , 4) as coverage,
    -- Renormalized over measured domains only.
    sum(weight_pct * avg_mastery) filter (where avg_mastery is not null)
      as weighted_mastery_sum,
    sum(weight_pct) filter (where avg_mastery is not null)
      as measured_weight,
    -- Weakest measured domain, for an actionable hint.
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
  concepts_measured,
  case when measured_weight > 0
       then round(100 * weighted_mastery_sum / measured_weight, 1)
  end as predicted_score_pct,
  least(45, round(5 + 30 * (1 - coverage), 1)) as confidence_half_pct,
  -- Under 25% blueprint coverage the estimate is not worth showing.
  (coverage >= 0.25 and measured_weight > 0) as is_reportable,
  weakest_domain_code,
  round(weakest_domain_mastery, 3) as weakest_domain_mastery
from rolled;

comment on view public.v_user_exam_readiness is
  'Live, blueprint-weighted exam readiness for the calling user. Coverage drives the confidence band; is_reportable=false below 25% coverage. security_invoker: RLS on user_concept_mastery still applies.';

grant select on public.v_user_exam_readiness to authenticated;

-- Verify (from the editor auth.uid() is null, so query the base path directly):
--   select * from public.v_user_exam_readiness;   -- empty in the editor, by design
--
-- Sanity-check one user's numbers:
--   select c.code, r.coverage, r.predicted_score_pct, r.confidence_half_pct,
--          r.is_reportable, r.concepts_measured, r.concepts_total,
--          r.weakest_domain_code
--     from public.v_user_exam_readiness r
--     join public.certifications c on c.id = r.certification_id
--    where r.user_id = '<uuid>'
--    order by c.code;
