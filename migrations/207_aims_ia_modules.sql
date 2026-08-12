-- 207_aims_ia_modules.sql  |  AIMS-IA - 5 modules, one per domain
--
-- Shape follows ISMS-IA exactly: one module per domain, lesson count equal to the
-- domain's task count. 5 / 7 / 8 / 13 / 7 = 40 lessons, one per task.
--
-- MODULE SLUG IS A SILENT-FAILURE TRAP (CERT-CREATION Stage 6). The slug must
-- equal the lesson folder name minus its NN- prefix, AND the module_slug in every
-- lesson's frontmatter. A mismatch misfiles or drops lessons at load time without
-- erroring. The content directory is therefore:
--
--   certidemy-web/content/aims-ia/01-aia-audit-function/
--   certidemy-web/content/aims-ia/02-aia-audit-programme/
--   certidemy-web/content/aims-ia/03-aia-conducting-the-audit/
--   certidemy-web/content/aims-ia/04-aia-auditing-the-aims/
--   certidemy-web/content/aims-ia/05-aia-findings-and-follow-up/
--
-- MODULES MUST EXIST BEFORE LESSONS LOAD.
--
-- estimated_minutes is 25 per lesson, which is a placeholder proportional to the
-- module's size rather than a measurement. Revisit once lessons are authored.
--
-- If the SQL editor injects text again, apply with:
--   node scripts/load-aims-ia-modules.mjs --dry
--   node scripts/load-aims-ia-modules.mjs
-- ============================================================================

insert into public.modules (certification_id, slug, title, description, order_index, estimated_minutes) values
  ('4818fc03-6da0-4266-9329-0e1ea2ea3fb4', 'aia-audit-function', 'The Audit Function and Its Boundaries',
   'Who the internal auditor is and what governs their work. Establishes ISO 19011:2026 as the audit method and ISO/IEC 42001:2023 as the audit criteria, the seven principles of auditing and how they interact when they pull against one another, and the boundary between a first-party audit and certification-body activity.',
   1, 125),
  ('4818fc03-6da0-4266-9329-0e1ea2ea3fb4', 'aia-audit-programme', 'Managing the Audit Programme',
   'The programme above the individual audit: objectives drawn from context, risks and opportunities to the programme itself, resourcing, the competence an AIMS audit team needs, and the scope that follows from the roles an organization holds toward its AI systems. Covers selecting auditing methods, including remote methods and virtual locations.',
   2, 175),
  ('4818fc03-6da0-4266-9329-0e1ea2ea3fb4', 'aia-conducting-the-audit', 'Conducting the Audit',
   'The individual audit from initiation to completion. Evidence and its verification, sampling and what a sample can support, interviewing the people who do the work, and judging the sufficiency of evidence obtained remotely. This module asks whether the evidence is sound; module 4 asks what it is sound for.',
   3, 200),
  ('4818fc03-6da0-4266-9329-0e1ea2ea3fb4', 'aia-auditing-the-aims', 'Auditing the AIMS Against ISO/IEC 42001',
   'The largest module and where this credential differs from its ISO/IEC 27001 sibling. Testing the management system clause by clause, with the layered normativity of Annex A and Annex B, scope that follows from a role determination, the AI system impact assessment as an artifact distinct from the risk assessment, and the control families whose evidence has no ISO/IEC 27001 counterpart.',
   4, 325),
  ('4818fc03-6da0-4266-9329-0e1ea2ea3fb4', 'aia-findings-and-follow-up', 'Findings, Reporting and Follow-up',
   'Turning evidence into findings that survive challenge. What separates a conformity, a nonconformity and an opportunity for improvement, how a finding links evidence to a requirement without prescribing a remedy, whether a proposed finding is supportable given the normative status of the clause cited, and how corrective action and management review close the loop.',
   5, 175);

-- ============================================================================
-- PROOF
-- ============================================================================

-- 1. Expect 5 modules, order 1 to 5, slugs prefixed aia-.
select slug, title, order_index, estimated_minutes
from public.modules where certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4' order by order_index;

-- 2. Module count against domain count. Expect 5 and 5.
select
  (select count(*) from public.modules where certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4') as modules,
  (select count(*) from public.domains where certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4') as domains;
