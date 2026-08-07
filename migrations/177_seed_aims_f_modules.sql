-- 177_seed_aims_f_modules.sql
-- AIMS-F  ISO/IEC 42001 Foundation  --  modules (Stage 6, part 2)
-- Run AFTER 176_seed_aims_f.sql.
-- Editor-first. ASCII-only per CERT-SCHEMA-GUIDE.md section 8.
--
-- SLUGS ARE GLOBALLY UNIQUE. modules_slug_unique is a table-wide constraint, not
-- scoped to certification_id. CERT-SCHEMA-GUIDE.md section 6 does not say this;
-- a first attempt at this migration collided with ISMS-F on
-- 'evaluation-improvement-certification'. Every AIMS-F module slug therefore
-- carries an 'aims-' prefix, which is unique by construction.
--
-- order_index aligns 1:1 to domains D1..D5. That shared index is the
-- module -> domain -> tasks -> task_concepts reachability fallback.
--
-- slug MUST equal the lesson content folder name minus the NN- prefix, and the
-- module_slug in every lesson's frontmatter. A slug typo means lessons silently
-- misfile at load. Folders:
--   content/aims-f/01-aims-and-the-ai-landscape/
--   content/aims-f/02-aims-context-and-planning/
--   content/aims-f/03-aims-support-and-operation/
--   content/aims-f/04-aims-annex-a-controls/
--   content/aims-f/05-aims-evaluation-and-certification/
--
-- estimated_minutes is a placeholder; refine to the sum of each module's lesson
-- durations at lesson-load time.

begin;

insert into public.modules (id, certification_id, title, description, order_index, estimated_minutes, slug)
values
  ('de046fa6-0000-0000-0000-000000000001','de046fa6-e627-48c1-85d8-9df226d144f4',
   $$AI management systems and the AI landscape$$,
   $$What an AI management system is and what it is not, the six role categories an organization can hold, the AI system life cycle, the harmonised structure shared with ISO/IEC 27001, and the regulatory drivers behind adoption.$$,
   1, 90, 'aims-and-the-ai-landscape'),

  ('de046fa6-0000-0000-0000-000000000002','de046fa6-e627-48c1-85d8-9df226d144f4',
   $$Context, leadership and planning$$,
   $$Clauses 4 to 6. Context and interested parties, scope, the AI policy and objectives, the AI risk assessment, the AI system impact assessment and how the two relate, risk treatment and the Statement of Applicability.$$,
   2, 135, 'aims-context-and-planning'),

  ('de046fa6-0000-0000-0000-000000000003','de046fa6-e627-48c1-85d8-9df226d144f4',
   $$Support and operation$$,
   $$Clauses 7 and 8. Resources and competence, awareness and communication, documented information, operational planning and control, third-party AI supply, data management, and the clause 8 duty to actually perform what clause 6 defines.$$,
   3, 120, 'aims-support-and-operation'),

  ('de046fa6-0000-0000-0000-000000000004','de046fa6-e627-48c1-85d8-9df226d144f4',
   $$Annex A controls: structure and selection$$,
   $$The 38 controls across nine categories, the normative status of Annex B, the relationship to the Statement of Applicability, and selection reasoning -- including where a single control can serve both an AIMS and an ISMS and where that is a mistake.$$,
   4, 150, 'aims-annex-a-controls'),

  ('de046fa6-0000-0000-0000-000000000005','de046fa6-e627-48c1-85d8-9df226d144f4',
   $$Performance evaluation, improvement and certification$$,
   $$Clauses 9 and 10. Monitoring and measurement, internal audit, management review, nonconformity and corrective action, and the certification route -- which lives in ISO/IEC 42006 and ISO/IEC 17021-1, not in ISO/IEC 42001.$$,
   5, 105, 'aims-evaluation-and-certification')

on conflict (id) do update set
  title=excluded.title, description=excluded.description,
  order_index=excluded.order_index, estimated_minutes=excluded.estimated_minutes,
  slug=excluded.slug;

commit;

-- VERIFICATION (run separately)
-- select count(*) from modules where certification_id='de046fa6-e627-48c1-85d8-9df226d144f4';
-- EXPECT: 5
--
-- module/domain alignment must be 1:1 on order_index:
-- select m.order_index, m.slug, d.code, d.title
-- from modules m
-- join domains d
--   on d.certification_id = m.certification_id and d.order_index = m.order_index
-- where m.certification_id='de046fa6-e627-48c1-85d8-9df226d144f4'
-- order by m.order_index;
-- EXPECT: 5 rows, order_index 1..5, no NULLs on either side
