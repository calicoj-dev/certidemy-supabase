-- ============================================================================
-- 172_seed_isms_f_modules.sql
-- ISMS-F modules - one per domain, order_index aligned 1:1 to the domains.
-- Cert UUID: 0bb3878a-fb89-455d-a84c-bdb9a26b1643
--
-- Module ids are generated, not patterned (CERT-SCHEMA-GUIDE.md S7 as amended).
-- order_index is what carries domain alignment; the old id pattern was cosmetic.
--
-- slug MUST equal the lesson content folder name minus the NN- prefix, and the
-- module_slug in every lesson's frontmatter. A typo silently misfiles lessons.
-- Content dirs: content/isms-f/01-<slug>/ ... 05-<slug>/
-- estimated_minutes are placeholders; refine at lesson-load time.
-- ============================================================================

insert into public.modules
  (id, certification_id, title, description, order_index, estimated_minutes, slug)
values
  ('ce619426-50f9-4e3f-b455-2b99a1bfb4a4', '0bb3878a-fb89-455d-a84c-bdb9a26b1643', $$Information security fundamentals and the AI-era threat landscape$$, $$The vocabulary floor and the threat picture. Asset, threat, vulnerability, risk and control, and the AI-specific threat surface as a catalogued thing rather than a vague anxiety.$$, 1, 110, 'information-security-fundamentals'),
  ('ed929000-9467-45f7-abe0-5398014ef13c', '0bb3878a-fb89-455d-a84c-bdb9a26b1643', $$The ISMS: context, leadership, scope and policy with AI in the estate$$, $$Clauses 4 and 5 and the management-system model. The signature AI content is scope: browser-accessible AI tooling reaches systems the scope statement never anticipated.$$, 2, 140, 'the-isms-context-and-leadership'),
  ('2a55bca6-4d36-4efe-99ed-1b54a893ae41', '0bb3878a-fb89-455d-a84c-bdb9a26b1643', $$Risk assessment and treatment$$, $$Clauses 6 and 8, the engine of the standard. The Statement of Applicability as a justification record, and why a conventional assessment can return a clean result for an exposed estate.$$, 3, 170, 'risk-assessment-and-treatment'),
  ('d9b082c6-c895-4dd4-8ed0-a23412d372eb', '0bb3878a-fb89-455d-a84c-bdb9a26b1643', $$Annex A controls and the AI weave$$, $$The four themes and the reasoning that selects among them, not a survey of 93 controls. Carries the signature AI content and the explicit null result on physical controls.$$, 4, 200, 'annex-a-controls-and-ai'),
  ('e53370e0-d85b-4cd9-9f89-9403ae7a0637', '0bb3878a-fb89-455d-a84c-bdb9a26b1643', $$Performance evaluation, improvement and certification$$, $$Clauses 9 and 10, and what certification actually is. The AI weave is detection: an AI-related incident frequently leaves no conventional log entry.$$, 5, 140, 'evaluation-improvement-certification')
on conflict (id) do update set
  title = excluded.title, description = excluded.description,
  order_index = excluded.order_index,
  estimated_minutes = excluded.estimated_minutes, slug = excluded.slug;

-- VERIFICATION - expect 5 rows, order_index 1..5, slugs distinct:
-- select order_index, slug, title from public.modules
--  where certification_id='0bb3878a-fb89-455d-a84c-bdb9a26b1643' order by order_index;
--
-- Module/domain alignment - expect 5 rows, every title pair matching:
-- select m.order_index, m.slug, d.code, d.title
--   from public.modules m
--   join public.domains d
--     on d.certification_id=m.certification_id and d.order_index=m.order_index
--  where m.certification_id='0bb3878a-fb89-455d-a84c-bdb9a26b1643' order by m.order_index;
