-- 121_readiness_distinct_totals.sql
--
-- Fixes double-counted concept totals in v_user_exam_readiness.
--
-- THE BUG: concepts_total and concepts_seen were computed as
-- sum(per-domain count). A concept linked to tasks in TWO domains is counted
-- once per domain, so the sum exceeds the true distinct count. SM-AI-I has
-- seven such concepts and reported 112 against an actual 107.
--
-- BLAST RADIUS IS SMALL, and worth stating precisely: coverage and
-- predicted_score_pct are UNAFFECTED. Both are computed per-domain and then
-- weighted by domains.weight_pct - each domain's own denominator is correct,
-- and a concept genuinely does contribute to both domains it is linked to.
-- Only the two SUMMED display columns were wrong. Nothing renders them today;
-- fixed before they reach a screen.
--
-- THE FIX: count distinct concepts at CERT level rather than summing per-domain
-- counts. Two extra CTEs, no change to the weighting maths.
--
-- Note the cert-level distinct count will still differ from
-- `select count(*) from concepts where certification_id = ...` when a cert has
-- out-of-scope tasks or zero-weight domains - the view deliberately counts only
-- what the EXAM draws from, which is the right denominator for readiness.
--
-- ASCII only. Idempotent.

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
-- DISTINCT at cert level: a concept in two domains is still one concept.
cert_totals as (
  select certification_id, count(distinct concept_id)::int as concepts_total
    from scope
   group by 1
),
measured as (
  select m.user_id, s.certification_id, s.domain_id,
         count(*)::int as concepts_seen,
         sum(least(1.0, m.attempts::numeric / 3.0)) as evidence,
         avg(m.mastery_score) as avg_mastery,
         sum(m.attempts)::int as attempts_total
    from scope s
    join public.user_concept_mastery m on m.concept_id = s.concept_id
   group by 1, 2, 3
),
cert_seen as (
  select m.user_id, s.certification_id,
         count(distinct s.concept_id)::int as concepts_seen,
         sum(m.attempts)::int as attempts_total
    from scope s
    join public.user_concept_mastery m on m.concept_id = s.concept_id
   group by 1, 2
),
users_certs as (
  select distinct user_id, certification_id from measured
),
per_domain as (
  select uc.user_id, dt.certification_id, dt.domain_id, dt.domain_code,
         dt.weight_pct, dt.concepts_total,
         coalesce(me.evidence, 0) as evidence,
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
    -- Weighting is per-domain and unchanged; a concept in two domains
    -- legitimately contributes to both.
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
  r.user_id,
  r.certification_id,
  r.coverage,
  ct.concepts_total,
  coalesce(cs.concepts_seen, 0) as concepts_seen,
  coalesce(cs.attempts_total, 0) as attempts_total,
  case when r.measured_weight > 0
       then round(100 * r.weighted_mastery_sum / r.measured_weight, 1)
  end as predicted_score_pct,
  least(45, round(5 + 30 * (1 - r.coverage), 1)) as confidence_half_pct,
  (r.coverage >= 0.25 and r.measured_weight > 0) as is_reportable,
  r.weakest_domain_code,
  round(r.weakest_domain_mastery, 3) as weakest_domain_mastery
from rolled r
join cert_totals ct on ct.certification_id = r.certification_id
left join cert_seen cs
       on cs.user_id = r.user_id and cs.certification_id = r.certification_id;

comment on view public.v_user_exam_readiness is
  'Live blueprint-weighted exam readiness. Coverage is evidence-weighted (least(1, attempts/3)); evidence never touches the point estimate, because FSRS resurfaces weak concepts and attempts therefore correlate with difficulty. Concept totals are DISTINCT at cert level - a concept linked to two domains is one concept, though it correctly contributes to both domains in the weighting. security_invoker.';

grant select on public.v_user_exam_readiness to authenticated;

-- Verify: concepts_total should now be 107 for SM-AI-I, not 112.
--   select c.code, r.coverage, r.predicted_score_pct, r.confidence_half_pct,
--          r.concepts_seen, r.concepts_total, r.attempts_total
--     from public.v_user_exam_readiness r
--     join public.certifications c on c.id = r.certification_id
--    where r.user_id = '<uuid>'
--    order by c.code;
-- coverage and predicted_score_pct must be UNCHANGED from before this migration.
