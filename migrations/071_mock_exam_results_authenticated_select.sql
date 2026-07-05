-- 071_mock_exam_results_authenticated_select.sql
-- Grant the authenticated role SELECT on mock_exam_results so the learner
-- dashboard's direct owner-RLS read (lib/dashboard/data.ts) works. This table
-- is a learner's OWN practice/simulator analytics, gated by owner RLS
-- (auth.uid() = user_id) and read only on their own dashboard, so a full-table
-- grant is correct here -- unlike credentials (a public verify path, where
-- score_pct was excluded), there's no stranger read to defend against.
-- Found via the direct-authed-query grant sweep after Fix F.
grant select on public.mock_exam_results to authenticated;
