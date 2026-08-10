-- 187_seed_isms_ia_cert.sql
-- ISMS-IA — ISO/IEC 27001:2022 Internal Auditor - AI
--
-- The catalogue's FIRST Level II certification.
--
-- Three columns are set explicitly because their defaults are wrong here and
-- would fail silently:
--   tier              defaults to 1. Every prior cert is tier 1, so this is the
--                     first time the default is incorrect. Omitting it records a
--                     Level II credential as Level I, with no error.
--   passing_score_pct defaults to 70.00. The scheme states 75.00.
--   issuer_id         NOT NULL, no default, and ABSENT from CERT-SCHEMA-GUIDE §2.
--                     It arrived with the Open Badges issuer work (185/186), after
--                     the guide was last corrected, so NO prior scaffold migration
--                     is a usable template for a cert insert.
--
-- difficulty_level: every existing cert carries 1, and every existing cert is
-- also tier 1, so the two columns are perfectly correlated and the convention
-- cannot be distinguished from the data. Set to 2 mirroring tier — a null here
-- would be the only null in the column.
--
-- exam_blueprint is NOT set here. Migration 189 computes it from tasks x domains.
-- price_usd stays at its 0 default while status = draft; real before publish.
--
-- Scheme of record: SCHEME-ISMS-IA.md v1.0
-- Job-task analysis: ISMS-IA_JTA_v2.0 (5 domains, 38 tasks, 169 concepts)

insert into public.certifications (
  id,
  code,
  name,
  description,
  category_slug,
  tier,
  difficulty_level,
  sort_order,
  status,
  num_questions,
  passing_score_pct,
  exam_duration_minutes,
  validity_days,
  max_exam_attempts,
  attempt_window_months,
  issuer_id
) values (
  '7c3f1e88-4b2a-4d51-9e6c-2a8f5b3d0417',
  'ISMS-IA',
  'ISO/IEC 27001:2022 Internal Auditor - AI',
  'Level II certification in auditing an information security management system built to ISO/IEC 27001:2022, using ISO 19011:2026 as the audit methodology and ISO/IEC 27001 as the audit criteria. Covers audit programme management, evidence and sampling, testing Annex A controls against the Statement of Applicability, and findings through to management review - including auditing an ISMS whose scope contains AI systems, and the use of AI tooling within the audit itself.',
  'ai-security',
  2,
  2,
  2,
  'draft',
  50,
  75.00,
  90,
  365,
  6,
  12,
  'b2b35e1e-fb05-484d-9065-5deeb400492a'
)
on conflict (id) do nothing;

-- Idempotency note: `on conflict (id) do nothing` means a replay against an
-- existing row changes nothing. If this file is edited after the row exists,
-- the edit must also be applied by a targeted UPDATE in the editor, or the
-- database and the migration will disagree. That happened once already with
-- difficulty_level.

-- Verification
--
-- select code, name, tier, difficulty_level, sort_order, status, num_questions,
--        passing_score_pct, exam_duration_minutes, validity_days, issuer_id
-- from public.certifications where code = 'ISMS-IA';
--
-- Expect: tier 2 | difficulty_level 2 | passing_score_pct 75.00 | status draft
--
-- Sibling check - ISMS-F holds sort_order 1 in ai-security, so 2 does not collide:
--
-- select code, sort_order from public.certifications
-- where category_slug = 'ai-security' order by sort_order;
