-- 070_credentials_authenticated_select.sql
-- Grant the authenticated role column-scoped SELECT on credentials so the
-- learner dashboard's owner-RLS query (loadEarnedCredential) can read the
-- caller's own credential. RLS ("owner reads own credentials",
-- auth.uid() = user_id) still does the row filtering; this only lifts the
-- table-level 42501 (permission denied for table). score_pct is deliberately
-- omitted -- a score is never exposed through this path.
grant select (
  id,
  credential_code,
  user_id,
  certification_id,
  exam_attempt_id,
  holder_name,
  certification_name,
  certification_code,
  issued_at,
  expires_at,
  status,
  created_at,
  locale,
  certificate_path,
  credly_badge_id,
  credly_badge_url,
  jta_version_id
) on public.credentials to authenticated;