-- 176_seed_aims_f.sql
-- AIMS-F  ISO/IEC 42001 Foundation  --  scaffold (Stage 6)
-- Source of truth: AIMS-F_JTA_v1.3.md at commit 9f4b0b8 (Stage 3 closed)
-- Editor-first: paste and run in the Supabase SQL editor, then commit this file.
-- Idempotent: fixed ids + on conflict do update; SECTION 2 wipes only this cert's children.
-- ASCII-only per CERT-SCHEMA-GUIDE.md section 8 (editor corrupts multibyte in large pastes).
--
-- EXPECTED: 1 cert / 1 category / 5 domains / 35 tasks / 154 concepts / 157 links

begin;

-- ============================================================
-- SECTION 0  category  (governance-service-management already exists; no-op upsert keeps this file self-contained)
-- ============================================================
insert into public.cert_categories (slug,label,tagline,sort_order) values
  ('governance-service-management','Certidemy AI Governance & Service Management',
   $$Governing, running, and assuring enterprise AI - responsibly, and by design.$$,4)
on conflict (slug) do update set label=excluded.label, tagline=excluded.tagline, sort_order=excluded.sort_order;

-- ============================================================
-- SECTION 1  certification
-- ============================================================
insert into public.certifications (
  id, code, name, provider, description,
  exam_duration_minutes, passing_score_pct, num_questions,
  difficulty_level, tier, category_slug, sort_order, status,
  max_exam_attempts, attempt_window_months, validity_days
) values (
  'de046fa6-e627-48c1-85d8-9df226d144f4',
  'AIMS-F',
  'ISO/IEC 42001 Foundation',
  'Certidemy',
  $$Competence in the ISO/IEC 42001 AI management system: its clause requirements, its Annex A controls, the AI system impact assessment it requires, and the route to certification. Taught alongside ISO/IEC 27001, because an AI management system is almost always built by the team that already runs an information security management system.$$,
  60, 80.00, 40,
  1, 1, 'governance-service-management', 3, 'draft',
  6, 12, 365
)
on conflict (id) do update set
  code=excluded.code, name=excluded.name, provider=excluded.provider,
  description=excluded.description, exam_duration_minutes=excluded.exam_duration_minutes,
  passing_score_pct=excluded.passing_score_pct, num_questions=excluded.num_questions,
  difficulty_level=excluded.difficulty_level, tier=excluded.tier,
  category_slug=excluded.category_slug, sort_order=excluded.sort_order,
  status=excluded.status, max_exam_attempts=excluded.max_exam_attempts,
  attempt_window_months=excluded.attempt_window_months,
  validity_days=excluded.validity_days, updated_at=now();

-- NOTE: price_usd is NOT NULL default 0 and is deliberately left at the default.
-- NOTE: exam_blueprint (jsonb) stays NULL at scaffold. Set it from the COMPUTED
--       cognitive profile after seeding, never from the JTA's authored table.
-- NOTE: is_published was dropped by migration 069-part-2. CERT-SCHEMA-GUIDE.md
--       section 2 still lists it; the guide is stale, the database is not.

-- ============================================================
-- SECTION 2  idempotency reset  (this cert's children only)
-- ============================================================
delete from public.task_concepts tc using public.tasks t
  where tc.task_id = t.id and t.certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4';
delete from public.tasks    where certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4';
delete from public.concepts where certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4';
delete from public.domains  where certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4';

-- ============================================================
-- SECTION 3  domains  (weights sum to 100.0)
-- ============================================================
insert into public.domains (certification_id, code, title, description, weight_pct, order_index)
select 'de046fa6-e627-48c1-85d8-9df226d144f4', v.code, v.title, v.descr, v.wt::numeric, v.oi::int
from (values
  ('D1',$$AI management systems and the AI landscape$$,$$What an AI management system is, the roles an organization can hold, the AI system life cycle, the harmonised structure shared with ISO/IEC 27001, and the regulatory drivers.$$,'15.0',1),
  ('D2',$$Context, leadership and planning$$,$$Clauses 4 to 6: context and interested parties, scope, leadership and the AI policy, AI risk assessment, AI system impact assessment, risk treatment and the Statement of Applicability.$$,'22.5',2),
  ('D3',$$Support and operation$$,$$Clauses 7 and 8: resources and competence, awareness and communication, documented information, operational planning and control, third-party supply, data management, and the clause 8 operational duties.$$,'20.0',3),
  ('D4',$$Annex A controls: structure and selection$$,$$The structure of Annex A and the normative status of Annex B, the relationship to the Statement of Applicability, and selection reasoning across the nine control categories.$$,'25.0',4),
  ('D5',$$Performance evaluation, improvement and certification$$,$$Clauses 9 and 10: monitoring and measurement, internal audit, management review, nonconformity and corrective action, and the route to certification under ISO/IEC 42006.$$,'17.5',5)
) as v(code,title,descr,wt,oi);

-- ============================================================
-- SECTION 4  concepts  (154 distinct)
-- ============================================================
insert into public.concepts (certification_id, slug, name, description)
select 'de046fa6-e627-48c1-85d8-9df226d144f4', v.slug, v.name, v.descr
from (values
  ('ai-management-system',$$AI management system$$,$$AI management system as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('management-system-standard',$$Management system standard$$,$$Management system standard as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('pdca-cycle',$$Pdca cycle$$,$$Pdca cycle as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('management-system-certification-basis',$$Management system certification basis$$,$$Management system certification basis as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('ai-provider-role',$$AI provider role$$,$$AI provider role as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('ai-producer-role',$$AI producer role$$,$$AI producer role as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('ai-customer-role',$$AI customer role$$,$$AI customer role as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('ai-partner-role',$$AI partner role$$,$$AI partner role as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('ai-subject-role',$$AI subject role$$,$$AI subject role as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('role-determination-requirement',$$Role determination requirement$$,$$Role determination requirement as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('role-dependent-applicability',$$Role dependent applicability$$,$$Role dependent applicability as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('ai-system-life-cycle',$$AI system life cycle$$,$$AI system life cycle as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('life-cycle-stages',$$Life cycle stages$$,$$Life cycle stages as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('continuous-learning-behaviour',$$Continuous learning behaviour$$,$$Continuous learning behaviour as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('retraining-and-drift',$$Retraining and drift$$,$$Retraining and drift as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('harmonised-structure',$$Harmonised structure$$,$$Harmonised structure as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('clauses-four-to-ten',$$Clauses four to ten$$,$$Clauses four to ten as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('integrated-management-system',$$Integrated management system$$,$$Integrated management system as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('iso-42001-27001-integration',$$ISO 42001 / 27001 integration$$,$$ISO 42001 / 27001 integration as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('regulatory-driver',$$Regulatory driver$$,$$Regulatory driver as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('eu-ai-act-overview',$$EU AI act overview$$,$$EU AI act overview as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('certification-is-not-compliance',$$Certification is not compliance$$,$$Certification is not compliance as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('voluntary-standard',$$Voluntary standard$$,$$Voluntary standard as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('aims-vs-model-assurance',$$AIMS vs model assurance$$,$$AIMS vs model assurance as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('aims-vs-ethics-framework',$$AIMS vs ethics framework$$,$$AIMS vs ethics framework as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('nist-ai-rmf-relationship',$$NIST AI rmf relationship$$,$$NIST AI rmf relationship as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('sector-application-annex-d',$$Sector application annex d$$,$$Sector application annex d as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('organizational-context',$$Organizational context$$,$$Organizational context as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('internal-external-issues',$$Internal external issues$$,$$Internal external issues as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('interested-parties-ai',$$Interested parties ai$$,$$Interested parties ai as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('climate-change-relevance',$$Climate change relevance$$,$$Climate change relevance as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('affected-individuals',$$Affected individuals$$,$$Affected individuals as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('aims-scope',$$AIMS scope$$,$$AIMS scope as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('scope-boundary-decision',$$Scope boundary decision$$,$$Scope boundary decision as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('third-party-ai-in-scope',$$Third party AI in scope$$,$$Third party AI in scope as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('shadow-ai',$$Shadow ai$$,$$Shadow ai as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('scope-as-documented-information',$$Scope as documented information$$,$$Scope as documented information as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('top-management-commitment',$$Top management commitment$$,$$Top management commitment as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('ai-policy',$$AI policy$$,$$AI policy as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('ai-objectives',$$AI objectives$$,$$AI objectives as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('policy-vs-objective',$$Policy vs objective$$,$$Policy vs objective as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('objectives-measurable',$$Objectives measurable$$,$$Objectives measurable as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('planning-of-changes',$$Planning of changes$$,$$Planning of changes as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('roles-responsibilities-authorities',$$Roles responsibilities authorities$$,$$Roles responsibilities authorities as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('conformance-authority',$$Conformance authority$$,$$Conformance authority as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('performance-reporting-authority',$$Performance reporting authority$$,$$Performance reporting authority as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('ai-risk-assessment',$$AI risk assessment$$,$$AI risk assessment as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('ai-risk-criteria',$$AI risk criteria$$,$$AI risk criteria as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('risk-identification-ai',$$Risk identification ai$$,$$Risk identification ai as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('risk-analysis-and-evaluation',$$Risk analysis and evaluation$$,$$Risk analysis and evaluation as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('consistent-repeatable-results',$$Consistent repeatable results$$,$$Consistent repeatable results as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('ai-system-impact-assessment',$$AI system impact assessment$$,$$AI system impact assessment as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('impact-on-individuals',$$Impact on individuals$$,$$Impact on individuals as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('impact-on-societies',$$Impact on societies$$,$$Impact on societies as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('foreseeable-misuse',$$Foreseeable misuse$$,$$Foreseeable misuse as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('jurisdictional-context',$$Jurisdictional context$$,$$Jurisdictional context as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('impact-assessment-documentation',$$Impact assessment documentation$$,$$Impact assessment documentation as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('risk-vs-impact-assessment',$$Risk vs impact assessment$$,$$Risk vs impact assessment as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('impact-feeds-risk',$$Impact feeds risk$$,$$Impact feeds risk as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('anchoring-difference',$$Anchoring difference$$,$$Anchoring difference as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('disclosure-difference',$$Disclosure difference$$,$$Disclosure difference as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('ai-risk-treatment',$$AI risk treatment$$,$$AI risk treatment as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('treatment-options',$$Treatment options$$,$$Treatment options as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('statement-of-applicability',$$Statement of applicability$$,$$Statement of applicability as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('inclusion-exclusion-justification',$$Inclusion exclusion justification$$,$$Inclusion exclusion justification as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('residual-risk-approval',$$Residual risk approval$$,$$Residual risk approval as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('treatment-plan',$$Treatment plan$$,$$Treatment plan as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('aims-resources',$$AIMS resources$$,$$AIMS resources as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('competence-requirements-ai',$$Competence requirements ai$$,$$Competence requirements ai as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('competence-evidence',$$Competence evidence$$,$$Competence evidence as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('ai-expertise-diversity',$$AI expertise diversity$$,$$AI expertise diversity as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('awareness-requirement',$$Awareness requirement$$,$$Awareness requirement as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('work-under-organizational-control',$$Work under organizational control$$,$$Work under organizational control as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('communication-planning',$$Communication planning$$,$$Communication planning as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('documented-information',$$Documented information$$,$$Documented information as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('creating-and-updating',$$Creating and updating$$,$$Creating and updating as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('control-of-documented-information',$$Control of documented information$$,$$Control of documented information as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('external-origin-documents',$$External origin documents$$,$$External origin documents as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('operational-planning-and-control',$$Operational planning and control$$,$$Operational planning and control as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('process-criteria',$$Process criteria$$,$$Process criteria as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('change-control-ai',$$Change control ai$$,$$Change control ai as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('externally-provided-processes',$$Externally provided processes$$,$$Externally provided processes as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('third-party-ai-supply',$$Third party AI supply$$,$$Third party AI supply as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('supplier-obligations',$$Supplier obligations$$,$$Supplier obligations as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('model-supply-chain',$$Model supply chain$$,$$Model supply chain as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('supplier-documentation',$$Supplier documentation$$,$$Supplier documentation as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('data-for-ai-systems',$$Data for AI systems$$,$$Data for AI systems as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('data-provenance',$$Data provenance$$,$$Data provenance as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('data-quality',$$Data quality$$,$$Data quality as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('data-preparation',$$Data preparation$$,$$Data preparation as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('data-acquisition',$$Data acquisition$$,$$Data acquisition as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('shared-clause-seven-eight',$$Shared clause seven eight$$,$$Shared clause seven eight as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('carry-over-limits',$$Carry over limits$$,$$Carry over limits as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('competence-does-not-carry',$$Competence does not carry$$,$$Competence does not carry as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('clause-eight-operation',$$Clause eight operation$$,$$Clause eight operation as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('planned-intervals',$$Planned intervals$$,$$Planned intervals as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('significant-change-trigger',$$Significant change trigger$$,$$Significant change trigger as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('retained-results',$$Retained results$$,$$Retained results as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('annex-a-structure',$$Annex a structure$$,$$Annex a structure as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('control-categories',$$Control categories$$,$$Control categories as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('control-count',$$Control count$$,$$Control count as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('annex-b-normative',$$Annex b normative$$,$$Annex b normative as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('annex-a-not-exhaustive',$$Annex a not exhaustive$$,$$Annex a not exhaustive as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('soa-annex-a-relationship',$$SoA annex a relationship$$,$$SoA annex a relationship as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('soa-completeness',$$SoA completeness$$,$$SoA completeness as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('exceeding-annex-a',$$Exceeding annex a$$,$$Exceeding annex a as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('policy-controls',$$Policy controls$$,$$Policy controls as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('internal-organization-controls',$$Internal organization controls$$,$$Internal organization controls as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('reporting-of-concerns',$$Reporting of concerns$$,$$Reporting of concerns as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('resource-controls',$$Resource controls$$,$$Resource controls as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('impact-assessment-controls',$$Impact assessment controls$$,$$Impact assessment controls as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('responsible-development-controls',$$Responsible development controls$$,$$Responsible development controls as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('life-cycle-stage-controls',$$Life cycle stage controls$$,$$Life cycle stage controls as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('verification-validation-controls',$$Verification validation controls$$,$$Verification validation controls as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('operation-monitoring-controls',$$Operation monitoring controls$$,$$Operation monitoring controls as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('event-log-controls',$$Event log controls$$,$$Event log controls as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('data-controls',$$Data controls$$,$$Data controls as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('information-for-users',$$Information for users$$,$$Information for users as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('external-reporting-control',$$External reporting control$$,$$External reporting control as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('incident-communication-control',$$Incident communication control$$,$$Incident communication control as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('use-of-ai-controls',$$Use of AI controls$$,$$Use of AI controls as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('human-oversight-guidance',$$Human oversight guidance$$,$$Human oversight guidance as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('intended-use-control',$$Intended use control$$,$$Intended use control as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('third-party-controls',$$Third party controls$$,$$Third party controls as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('customer-controls',$$Customer controls$$,$$Customer controls as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('control-overlap',$$Control overlap$$,$$Control overlap as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('single-control-two-systems',$$Single control two systems$$,$$Single control two systems as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('false-equivalence-controls',$$False equivalence controls$$,$$False equivalence controls as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('monitoring-and-measurement',$$Monitoring and measurement$$,$$Monitoring and measurement as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('what-to-monitor',$$What to monitor$$,$$What to monitor as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('aims-effectiveness-vs-system-performance',$$AIMS effectiveness vs system performance$$,$$AIMS effectiveness vs system performance as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('evidence-of-results',$$Evidence of results$$,$$Evidence of results as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('internal-audit-requirement',$$Internal audit requirement$$,$$Internal audit requirement as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('audit-programme',$$Audit programme$$,$$Audit programme as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('auditor-objectivity',$$Auditor objectivity$$,$$Auditor objectivity as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('audit-criteria-and-scope',$$Audit criteria and scope$$,$$Audit criteria and scope as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('management-review',$$Management review$$,$$Management review as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('review-inputs',$$Review inputs$$,$$Review inputs as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('review-results',$$Review results$$,$$Review results as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('review-records',$$Review records$$,$$Review records as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('nonconformity',$$Nonconformity$$,$$Nonconformity as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('correction-vs-corrective-action',$$Correction vs corrective action$$,$$Correction vs corrective action as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('cause-analysis',$$Cause analysis$$,$$Cause analysis as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('effectiveness-review',$$Effectiveness review$$,$$Effectiveness review as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('continual-improvement',$$Continual improvement$$,$$Continual improvement as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('certification-route',$$Certification route$$,$$Certification route as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('stage-one-stage-two',$$Stage one stage two$$,$$Stage one stage two as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('surveillance-and-recertification',$$Surveillance and recertification$$,$$Surveillance and recertification as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('iso-42006-role',$$ISO 42006 role$$,$$ISO 42006 role as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('accreditation-vs-certification',$$Accreditation vs certification$$,$$Accreditation vs certification as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('integrated-audit-programme',$$Integrated audit programme$$,$$Integrated audit programme as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('shared-evidence',$$Shared evidence$$,$$Shared evidence as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('evidence-that-cannot-be-shared',$$Evidence that cannot be shared$$,$$Evidence that cannot be shared as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$),
  ('auditor-competence-limit',$$Auditor competence limit$$,$$Auditor competence limit as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.$$)
) as v(slug,name,descr);

-- ============================================================
-- SECTION 5  tasks  (35; order_index globally sequential)
-- ============================================================
insert into public.tasks (
  certification_id, domain_id, code, statement,
  criticality, frequency, bloom_level,
  is_exam_scope, is_simulation_candidate,
  knowledge, skills, abilities, order_index
)
select 'de046fa6-e627-48c1-85d8-9df226d144f4', d.id, v.code, v.stmt,
       v.crit::criticality, v.freq::task_frequency, v.bloom::bloom_level,
       true, false,
       v.k, v.s, v.a, v.oi::int
from (values
  ('D1','1.1',$$Explain what an AI management system is and what a management system standard does$$,'high','occasional','2_understand',$$An AIMS is the interrelated elements of an organization - policies, objectives and processes - through which it governs responsible development, provision and use of AI. The standard specifies requirements for that system, not for the technology, and deliberately avoids prescribing management processes. Certification of an organization is possible because ISO/IEC 42006 sets requirements for the bodies that audit and certify an AIMS; ISO/IEC 42001 itself does not describe certification.$$,$$Distinguish a management system requirement from a technical control.$$,$$Systems thinking in preference to tool thinking.$$,1),
  ('D1','1.2',$$Determine the organization's roles with respect to its AI systems$$,'high','occasional','2_understand',$$Determining roles is a requirement, not advice. The role categories are AI providers, AI producers, AI customers, AI partners, AI subjects and relevant authorities, with developers, designers, operators, testers and deployers sitting inside the producer category. One organization can hold several roles at once, and its roles determine which requirements and controls apply and to what extent. Role can also be shaped by data-processing obligations.$$,$$Given a described organization and an AI system, identify which roles apply and what follows for applicability.$$,$$Resistance to the assumption that one label fits a whole organization.$$,2),
  ('D1','1.3',$$Describe the AI system life cycle and why it anchors AIMS obligations$$,'medium','occasional','2_understand',$$Obligations attach across the whole life cycle rather than at release. Systems that learn continuously change their behaviour during use and need specific consideration for that reason. Performance can also shift without continuous learning, through concept or data drift in production data, which is what triggers retraining. ISO/IEC 5338 describes life cycle processes, and the organization may define its own stages.$$,$$Place a described activity at its life-cycle stage.$$,$$Rejection of the deploy-and-forget model.$$,3),
  ('D1','1.4',$$Explain the harmonised structure and how ISO/IEC 42001 sits alongside ISO/IEC 27001 and ISO 9001$$,'high','occasional','2_understand',$$ISO/IEC 42001 applies the harmonised structure - identical clause numbers, titles, text and core definitions - shared with ISO/IEC 27001, ISO 9001 and others, which is what makes integrated implementation practical. Annex D.2 states that integration with other management system standards is essential for responsible development and use of an AI system, and names ISO/IEC 27001 first. The shared structure is also why the differences are the part that needs teaching.$$,$$Identify which clause of ISO/IEC 42001 corresponds to a named ISO/IEC 27001 clause.$$,$$Reuse before rebuild.$$,4),
  ('D1','1.5',$$Explain the regulatory drivers for an AIMS and why certification is not compliance$$,'medium','occasional','2_understand',$$ISO/IEC 42001 is a voluntary standard and certification to it does not by itself establish compliance with any law. Conformity generates evidence of the organization's responsibility and accountability regarding its role with respect to AI systems, which is a narrower claim than compliance. The EU AI Act imposes obligations by risk tier on an independent timetable that has already been amended once.$$,$$Distinguish a claim an AIMS supports from one it does not.$$,$$Precision about what a certificate actually says.$$,5),
  ('D1','1.6',$$Distinguish an AIMS from model-level assurance and from AI ethics frameworks$$,'high','occasional','2_understand',$$The standard specifies no fairness thresholds, evaluation methods, model architectures or testing protocols. It requires a system for deciding those things and for catching them when they fail. The NIST AI Risk Management Framework is referenced as a complementary description of roles across the life cycle rather than a competitor. Annex D addresses sector application and is informative.$$,$$Given a described activity, determine whether it is an AIMS requirement or a technical practice that the AIMS governs.$$,$$Discipline about scope boundaries.$$,6),
  ('D2','2.1',$$Determine the organization's context and interested parties for an AIMS$$,'medium','occasional','3_apply',$$External and internal issues include applicable legal requirements and prohibited uses, regulator guidance, incentives and consequences, cultural and ethical norms, the competitive landscape, contractual obligations and the intended purpose of the systems themselves. Clause 4.1 requires the organization to determine whether climate change is a relevant issue, and clause 4.2 notes that interested parties may have climate-related requirements. Interested parties include those who can perceive themselves affected, which reaches well beyond customers and regulators.$$,$$Given a described organization, identify context issues and interested parties that an information-security-shaped analysis would miss.$$,$$Willingness to count people outside the commercial relationship.$$,7),
  ('D2','2.2',$$Determine the scope of the AI management system$$,'high','occasional','3_apply',$$Scope is determined from the context issues and interested-party requirements, must be available as documented information, and determines the organization's activities with respect to the standard's requirements, controls and objectives. It must account for AI capability the organization did not build, including vendor features, embedded model interfaces and AI inside purchased software. A scope drawn around systems we developed omits most of the estate, and undeclared use is a scope problem before it is a control problem.$$,$$Given an estate description, determine what falls inside the AIMS boundary and justify an exclusion.$$,$$Refusal to let a convenient boundary define the scope.$$,8),
  ('D2','2.3',$$Explain leadership requirements, the AI policy, AI objectives and planning of changes$$,'high','occasional','2_understand',$$Top management must demonstrate leadership rather than delegate it, including integrating AIMS requirements into business processes and supporting other roles to demonstrate leadership in their own areas. The AI policy provides the framework for objectives, commits to meeting applicable requirements and to continual improvement, and must be documented, communicated and available to interested parties as appropriate. Objectives must be measurable where practicable, monitored, communicated and updated, and planning must state what will be done, by whom, when and how results are evaluated. Clause 6.3 adds a short requirement that is easy to miss: where the organization determines a need for changes to the AI management system, those changes are carried out in a planned manner. That concerns changes to the management system itself, distinct from clause 8.1 control of operational changes.$$,$$Distinguish a policy statement from an objective, and a change to the management system from an operational change.$$,$$Expectation that leadership is evidenced rather than asserted.$$,9),
  ('D2','2.4',$$Assign roles, responsibilities and authorities for AI$$,'medium','occasional','2_understand',$$Top management assigns and communicates responsibilities and authorities for relevant roles, and must specifically assign authority for ensuring the AIMS conforms to the standard and for reporting AIMS performance to top management. Areas that typically need named ownership span risk management, impact assessment, resource management, security, safety, privacy, development, performance, human oversight, supplier relationships and data quality across the whole life cycle.$$,$$Identify where an assignment leaves an outcome unowned.$$,$$Insistence that a person, not a system, is accountable.$$,10),
  ('D2','2.5',$$Apply the AI risk assessment process$$,'high','occasional','3_apply',$$AI risk criteria are established and maintained first, and must support distinguishing acceptable from non-acceptable risk, performing assessments, conducting treatment and assessing risk impacts. The process is informed by and aligned with the AI policy and objectives, and is designed so that repeated assessments produce consistent, valid and comparable results. It identifies risks that aid or prevent achieving AI objectives, analyses them to assess potential consequences to the organization, individuals and societies, assesses likelihood where applicable, determines levels of risk, then evaluates against the criteria and prioritises for treatment. Annex C lists candidate objectives and risk sources; ISO/IEC 23894 gives risk management guidance.$$,$$Given a scenario, identify AI-specific risk sources that a generic IT risk assessment would not surface.$$,$$Preference for systematic method over intuition.$$,11),
  ('D2','2.6',$$Apply the AI system impact assessment$$,'high','weekly','3_apply',$$A formal documented process by which impacts on individuals, groups of individuals and societies are identified, evaluated and addressed. It determines the potential consequences of an AI system's deployment, intended use and foreseeable misuse, and takes into account the specific technical and societal context of deployment and applicable jurisdictions. The result must be documented and, where appropriate, may be made available to relevant interested parties. Areas of impact reach the legal position and life opportunities of individuals, physical and psychological well-being, and universal human rights, with specific protection needs for groups such as children, elderly persons, impaired persons and workers. ISO/IEC 42005 gives guidance.$$,$$Given an AI system, identify affected parties and potential impacts including unintended ones.$$,$$Concern for people outside the organization's own interest.$$,12),
  ('D2','2.7',$$Differentiate the AI risk assessment from the AI system impact assessment and determine what a situation requires$$,'high','weekly','4_analyze',$$The two are not parallel and are not distinguished by who is harmed - the risk analysis already assesses consequences to the organization, individuals and societies. The impact assessment is an input, and the link is a requirement: clause 6.1.4 states that the organization shall consider the results of the AI system impact assessment in the risk assessment, with a reciprocal note at clause 6.1.2 permitting its use when assessing consequences. What separates them is four things: anchoring (risk to AI objectives; impact to deployment, intended use and foreseeable misuse), output (risk levels prioritised for treatment; documented consequences), context (risk criteria; technical, societal and jurisdictional context of deployment) and audience (internal; may be released to interested parties). Both are separately required and neither substitutes for the other.$$,$$Given a scenario, determine which assessment is called for, or both, and justify the answer from anchoring and output rather than from who is harmed.$$,$$Refusal to collapse two obligations into one document.$$,13),
  ('D2','2.8',$$Apply AI risk treatment and produce the Statement of Applicability$$,'high','occasional','3_apply',$$Treatment selects appropriate options, determines all controls necessary to implement them, compares those controls against Annex A to verify that no necessary control has been omitted, identifies any additional controls needed beyond Annex A, and considers the Annex B guidance. The Statement of Applicability documents all necessary controls with justification for inclusion and exclusion; legitimate exclusion grounds include the control not being deemed necessary by the risk assessment and not being required by applicable external requirements. All identified risks and the controls established to address them are reflected in the Statement of Applicability. Designated management must approve both the risk treatment plan and the acceptance of residual AI risks.$$,$$Determine a treatment option for a described risk and state what the Statement of Applicability must record.$$,$$Treating documentation as evidence rather than paperwork.$$,14),
  ('D3','3.1',$$Determine resources and competence needs for an AIMS$$,'medium','occasional','3_apply',$$The organization determines and provides the resources needed to establish, implement, maintain and continually improve the AIMS. Competence must be determined for persons doing work under its control that affects AI performance, established on the basis of appropriate education, training or experience, and evidenced by appropriate documented information. Where competence is lacking the organization takes action and evaluates the effectiveness of that action. AI competence spans data science, human oversight roles, trustworthiness specialists and domain experts, and rarely sits in one person; different life-cycle stages need different resources.$$,$$Identify a competence gap from a described team.$$,$$Honesty about what the organization does not know.$$,15),
  ('D3','3.2',$$Explain awareness and communication requirements$$,'low','occasional','2_understand',$$Awareness covers persons doing work under the organization's control, not only employees, and spans the AI policy, their contribution to the effectiveness of the AIMS including the benefits of improved AI performance, and the implications of not conforming with AIMS requirements. Communication must be determined across what will be communicated, when, with whom and how, for both internal and external communications relevant to the AIMS.$$,$$Distinguish awareness from training.$$,$$Treating communication as a designed process.$$,16),
  ('D3','3.3',$$Manage documented information for an AIMS$$,'medium','daily','3_apply',$$Documented information covers what the standard requires plus what the organization determines is necessary for effectiveness, and its extent varies with organization size, process complexity and the competence of persons. Creation and update require appropriate identification and description, format and media, and review and approval for suitability and adequacy. Control ensures availability and suitability for use and adequate protection, and addresses distribution and access, storage and preservation including legibility, control of changes, and retention and disposition. Documented information of external origin determined to be necessary must also be identified and controlled.$$,$$Identify which records a described activity must generate.$$,$$Evidence discipline.$$,17),
  ('D3','3.4',$$Explain operational planning and control$$,'high','daily','2_understand',$$The organization establishes criteria for its processes and implements control in accordance with those criteria, and implements the controls determined during risk treatment that relate to operation of the AIMS. The effectiveness of those controls must be monitored and corrective actions considered where intended results are not achieved. Documented information must be available to the extent necessary to have confidence that processes were carried out as planned. The organization controls planned changes and reviews the consequences of unintended changes, taking action to mitigate adverse effects, and ensures that externally provided processes, products or services relevant to the AIMS are controlled.$$,$$Identify what controlled requires for a described outsourced activity.$$,$$Ownership that does not transfer with the work.$$,18),
  ('D3','3.5',$$Apply the AIMS to AI systems and components obtained from third parties$$,'high','weekly','3_apply',$$Suppliers can provide datasets, machine learning algorithms or models, software components, or an entire AI system for use on its own or as part of another product. Supplier selection, the requirements placed on suppliers and the level of ongoing monitoring and evaluation should follow the type of supplier and the risk posed. The organization documents how supplied systems and components are integrated. Where a supplied component does not perform as intended or produces impacts misaligned with the organization's responsible approach, the organization requires corrective action, and suppliers must deliver appropriate and adequate documentation.$$,$$Determine what a supplier must provide for a described AI dependency.$$,$$Refusal to treat an opaque supplier as out of scope.$$,19),
  ('D3','3.6',$$Explain data management requirements for AI systems$$,'high','weekly','2_understand',$$Data management spans privacy and security implications of the data used, security and safety threats arising from data-dependent development, transparency and explainability including provenance, representativeness of training data against the operational domain of use, and accuracy and integrity. Acquisition records categories and quantity of data needed, sources and their characteristics, data subject demographics and known or potential biases, prior handling, data rights and associated metadata. Provenance records creation, update, transcription, abstraction, validation and transfer of control. Preparation criteria and the methods used must be documented, because failure to prepare data properly can lead to AI system errors.$$,$$Identify a data property that affects AI outcomes but not information security.$$,$$Attention to data as a governed input rather than a stored asset.$$,20),
  ('D3','3.7',$$Analyze which of an existing ISMS's support and operation machinery carries over to an AIMS$$,'high','occasional','4_analyze',$$Because the harmonised structure makes clauses 7 and 8 identical in numbering and title, documented-information control, communication planning and awareness infrastructure largely carry over. Competence does not, because AI competence is a different body of knowledge with different evidence. Operational control carries over in form but not in content, because the processes being controlled are different. Annex D.2 endorses integration and notes that controls relating to information security can be implemented through the organization's existing ISO/IEC 27001 implementation, which is licence to integrate rather than licence to assume. Reusing an ISMS process without re-examining what it now governs is the common integration failure.$$,$$Given a described ISMS, determine which elements extend unchanged, which extend with modification, and which must be built new.$$,$$Skepticism toward reuse that has not been checked.$$,21),
  ('D3','3.8',$$Apply the clause 8 operational requirements for assessment and treatment$$,'high','weekly','3_apply',$$Clause 6 defines the processes; clause 8 requires them to be performed. AI risk assessments are performed at planned intervals or when significant changes are proposed or occur. The AI risk treatment plan is implemented and its effectiveness verified; where risk assessments identify new risks requiring treatment those go back through the treatment process; where treatment options prove ineffective they are reviewed and revalidated and the plan is updated. AI system impact assessments are performed at planned intervals or when significant changes are proposed to occur. Documented information on the results of all three must be retained.$$,$$Given a described change, determine which clause 8 obligations are triggered and what must be retained.$$,$$Treating a defined process as worthless until it is actually run.$$,22),
  ('D4','4.1',$$Explain the structure of Annex A and the status of Annex B$$,'high','occasional','2_understand',$$Annex A is normative and holds 38 controls across nine categories, A.2 to A.10, carrying ten objectives, because A.6 subdivides into A.6.1 and A.6.2 and each carries its own objective statement. That subdivision is why nine objectives is a common miscount. The controls provide a reference for meeting organizational objectives and addressing risks: not all are required to be used, and the organization can design and implement its own. Annex B is also normative and provides implementation guidance for all the controls listed in Annex A, though organizations do not have to document or justify inclusion or exclusion of the implementation guidance in the Statement of Applicability. Annexes C and D are informative.$$,$$Locate a described concern under the correct control category.$$,$$Structure before detail.$$,23),
  ('D4','4.2',$$Explain how Annex A relates to the Statement of Applicability$$,'high','occasional','2_understand',$$The Statement of Applicability documents all necessary controls and the justification for inclusion or exclusion of controls. Organizations may not require all controls listed in Annex A, and may exceed that list with additional controls established by the organization itself. Exclusion is legitimate and must be reasoned rather than silent, and documented justifications may be provided for excluding control objectives in general or for specific AI systems. All identified risks and the risk management measures established to address them must be reflected in the Statement of Applicability.$$,$$Determine whether a described exclusion is adequately justified.$$,$$Completeness over convenience.$$,24),
  ('D4','4.3',$$Select controls for AI policy, internal organization and resources$$,'medium','occasional','3_apply',$$These categories establish the governing apparatus: documenting a policy for the development or use of AI systems, determining where other organizational policies are affected by or apply to AI objectives, reviewing the AI policy at planned intervals, defining and allocating AI roles and responsibilities, putting in place a process to report concerns about the organization's role with respect to an AI system, and identifying and documenting the resources involved - data, tooling, system and computing, and human resources with their competences.$$,$$Given a governance gap, select the control category that addresses it.$$,$$Governance treated as infrastructure.$$,25),
  ('D4','4.4',$$Select controls across impact assessment and the AI system life cycle$$,'high','occasional','3_apply',$$These categories cover establishing a process to assess potential consequences for individuals, groups and societies, documenting and retaining the results, and assessing impacts on individuals and on societies across the life cycle. They also cover identifying objectives for responsible development and defining processes for responsible design and development, and defining criteria and requirements at each life-cycle stage: requirements and specification, design and development documentation, verification and validation measures, a deployment plan and pre-deployment requirements, operation and monitoring, technical documentation for each relevant category of interested party, and event logging - where the control requires the organization to determine at which phases of the life cycle record keeping of event logs should be enabled, with in-use as the stated minimum. That is a determination duty, not a flat logging mandate.$$,$$Place a described life-cycle failure against the control category that would have prevented it.$$,$$Coverage across the whole life rather than the release moment.$$,26),
  ('D4','4.5',$$Select controls for data and for information to interested parties$$,'high','occasional','3_apply',$$Data controls cover defining and implementing data management processes for development, determining details about acquisition and selection, defining data quality requirements and ensuring data meet them, recording provenance over the life cycles of the data and the system, and documenting criteria for selecting data preparation methods. Information controls cover determining and providing the necessary information to users, including that they are interacting with an AI system, how and when to override it, needs for human oversight and relevant information from the impact assessment; providing capabilities for interested parties to report adverse impacts; documenting a plan for communicating incidents to users; and determining obligations to report information about the system to interested parties.$$,$$Determine what a described deployment must disclose and to whom.$$,$$Transparency as a default rather than a concession.$$,27),
  ('D4','4.6',$$Select controls for use of AI systems and for third-party and customer relationships$$,'high','occasional','3_apply',$$The Annex A use controls require the organization to define and document processes for the responsible use of AI systems, to identify and document objectives to guide responsible use, and to ensure the system is used according to its intended uses and accompanying documentation. Relationship controls allocate responsibilities within the AI system life cycle between the organization, its partners, suppliers, customers and third parties, establish a supplier process, and consider customer expectations and needs. The familiar content - fairness, accountability, transparency, explainability, reliability, safety, robustness, privacy, accessibility, and meaningful human oversight with authority to override decisions - is Annex B guidance at B.9.3, which uses should and offers the list as examples rather than a required set. Annex B is normative, so this is not optional reading, but a should and an illustrative list must not be taught as a shall and an exhaustive one. Which controls apply depends on the role held.$$,$$Given an organization's role, determine which control categories apply and which are legitimately excluded.$$,$$Precision about what the organization actually does.$$,28),
  ('D4','4.7',$$Analyze overlap between ISO/IEC 42001 and ISO/IEC 27001 controls$$,'high','occasional','4_analyze',$$Annex D.2 explicitly contemplates implementing controls that partly relate to information security through an existing ISO/IEC 27001 implementation, so genuine overlap exists and should be used. But some obligations look equivalent and are not: an access control protecting a model endpoint is not the obligation to record the provenance of the data that model was trained on. Treating overlap as equivalence produces a Statement of Applicability that passes review while leaving the AI obligation unmet.$$,$$Given a pair of controls, determine whether one implementation satisfies both and justify the answer.$$,$$Suspicion of convenient equivalence.$$,29),
  ('D5','5.1',$$Explain monitoring, measurement, analysis and evaluation for an AIMS$$,'high','daily','2_understand',$$The organization determines what needs to be monitored and measured, the methods to be used to ensure valid results, when monitoring and measuring is performed, and when results are analysed and evaluated, with documented information available as evidence of the results. It must evaluate the performance and the effectiveness of the AI management system. A note to the definition of performance - not a requirement - records that performance refers both to results achieved by using AI systems and results related to the management system itself, and the two are distinct: a well-governed system can perform poorly and a well-performing system can be ungoverned.$$,$$Distinguish a measure of AIMS effectiveness from a model performance metric.$$,$$Measuring the system of governance, not only the technology.$$,30),
  ('D5','5.2',$$Explain the internal audit requirement$$,'medium','occasional','2_understand',$$Internal audits are conducted at planned intervals to provide information on whether the AIMS conforms to the organization's own requirements for it and to the requirements of the standard, and whether it is effectively implemented and maintained. The audit programme covers frequency, methods, responsibilities, planning requirements and reporting, and considers the importance of the processes concerned and the results of previous audits. The organization defines audit objectives, criteria and scope for each audit, selects auditors and conducts audits to ensure objectivity and the impartiality of the audit process, and ensures results are reported to relevant managers. An internal audit may be conducted by the organization itself or by an external party on its behalf.$$,$$Identify an objectivity or impartiality problem in a described audit assignment.$$,$$Independence treated as a structural requirement.$$,31),
  ('D5','5.3',$$Explain management review inputs and results$$,'medium','occasional','2_understand',$$Top management reviews the AIMS at planned intervals to ensure its continuing suitability, adequacy and effectiveness. Inputs are the status of actions from previous reviews, changes in external and internal issues relevant to the AIMS, changes in the needs and expectations of interested parties, information on AIMS performance including trends in nonconformities and corrective actions, monitoring and measurement results and audit results, and opportunities for continual improvement. Results include decisions related to continual improvement opportunities and any need for changes to the AIMS, and must be evidenced by documented information.$$,$$Identify a missing management review input.$$,$$Review treated as a decision forum rather than a formality.$$,32),
  ('D5','5.4',$$Apply nonconformity and corrective action$$,'high','weekly','3_apply',$$When a nonconformity occurs the organization reacts to it, taking action to control and correct it and dealing with the consequences, then evaluates the need for action to eliminate the causes so that it does not recur or occur elsewhere, by reviewing the nonconformity, determining its causes and determining whether similar nonconformities exist or could potentially occur. Any needed action is implemented, the effectiveness of any corrective action taken is reviewed, and changes are made to the AIMS if necessary. Corrective actions must be appropriate to the effects of the nonconformities encountered, and documented information must be available as evidence of the nature of the nonconformities, subsequent actions taken and the results of corrective action. Root cause for an AI failure may sit in data or in a supplier rather than in a process.$$,$$Given a described failure, distinguish the correction from the corrective action.$$,$$Impatience with fixes that do not prevent recurrence.$$,33),
  ('D5','5.5',$$Describe the certification route and what ISO/IEC 42006 governs$$,'high','occasional','2_understand',$$ISO/IEC 42001 says nothing about how certification is conducted; the route belongs to other documents, and stating otherwise is the same error as claiming a certificate validity period from ISO/IEC 27001. ISO/IEC 42006 sets requirements for bodies auditing and certifying an AI management system, including competence, impartiality and audit time. The two-stage initial audit, surveillance and recertification cycle comes from ISO/IEC 17021-1, the generic requirements for bodies providing audit and certification of management systems. What ISO/IEC 42001 does say is that an organization conforming with its requirements can generate evidence of its responsibility and accountability regarding its role with respect to AI systems, which is narrower than a compliance claim. Accreditation assesses the certifier; certification assesses the organization; the two are routinely conflated.$$,$$Distinguish what an accreditation body does from what a certification body does.$$,$$Precision about who is assuring whom.$$,34),
  ('D5','5.6',$$Analyze whether an integrated ISO/IEC 27001 and ISO/IEC 42001 audit programme can share evidence$$,'high','occasional','4_analyze',$$The standard's own definition of audit contemplates a combined audit combining two or more disciplines, and the clause 9 and 10 machinery is shared, so one audit programme, one management review cycle and one nonconformity process can serve both systems. Evidence is a different question: a management review record can cover both, an impact assessment cannot substitute for a risk assessment, and an ISMS internal auditor is not automatically competent to audit an AIMS.$$,$$Given a described integrated programme, determine which evidence serves both systems and which does not.$$,$$Integration where it is real and separation where it is not.$$,35)
) as v(domain_code,code,stmt,crit,freq,bloom,k,s,a,oi)
join public.domains d on d.certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4' and d.code = v.domain_code;

-- ============================================================
-- SECTION 6  task_concepts  (157 links; 3 cross-domain reuse)
-- ============================================================
insert into public.task_concepts (task_id, concept_id)
select t.id, c.id
from (values
  ('1.1','ai-management-system'),
  ('1.1','management-system-standard'),
  ('1.1','pdca-cycle'),
  ('1.1','management-system-certification-basis'),
  ('1.2','ai-provider-role'),
  ('1.2','ai-producer-role'),
  ('1.2','ai-customer-role'),
  ('1.2','ai-partner-role'),
  ('1.2','ai-subject-role'),
  ('1.2','role-determination-requirement'),
  ('1.2','role-dependent-applicability'),
  ('1.3','ai-system-life-cycle'),
  ('1.3','life-cycle-stages'),
  ('1.3','continuous-learning-behaviour'),
  ('1.3','retraining-and-drift'),
  ('1.4','harmonised-structure'),
  ('1.4','clauses-four-to-ten'),
  ('1.4','integrated-management-system'),
  ('1.4','iso-42001-27001-integration'),
  ('1.5','regulatory-driver'),
  ('1.5','eu-ai-act-overview'),
  ('1.5','certification-is-not-compliance'),
  ('1.5','voluntary-standard'),
  ('1.6','aims-vs-model-assurance'),
  ('1.6','aims-vs-ethics-framework'),
  ('1.6','nist-ai-rmf-relationship'),
  ('1.6','sector-application-annex-d'),
  ('2.1','organizational-context'),
  ('2.1','internal-external-issues'),
  ('2.1','interested-parties-ai'),
  ('2.1','climate-change-relevance'),
  ('2.1','affected-individuals'),
  ('2.2','aims-scope'),
  ('2.2','scope-boundary-decision'),
  ('2.2','third-party-ai-in-scope'),
  ('2.2','shadow-ai'),
  ('2.2','scope-as-documented-information'),
  ('2.3','top-management-commitment'),
  ('2.3','ai-policy'),
  ('2.3','ai-objectives'),
  ('2.3','policy-vs-objective'),
  ('2.3','objectives-measurable'),
  ('2.3','planning-of-changes'),
  ('2.4','roles-responsibilities-authorities'),
  ('2.4','conformance-authority'),
  ('2.4','performance-reporting-authority'),
  ('2.5','ai-risk-assessment'),
  ('2.5','ai-risk-criteria'),
  ('2.5','risk-identification-ai'),
  ('2.5','risk-analysis-and-evaluation'),
  ('2.5','consistent-repeatable-results'),
  ('2.6','ai-system-impact-assessment'),
  ('2.6','impact-on-individuals'),
  ('2.6','impact-on-societies'),
  ('2.6','foreseeable-misuse'),
  ('2.6','jurisdictional-context'),
  ('2.6','impact-assessment-documentation'),
  ('2.7','risk-vs-impact-assessment'),
  ('2.7','impact-feeds-risk'),
  ('2.7','anchoring-difference'),
  ('2.7','disclosure-difference'),
  ('2.8','ai-risk-treatment'),
  ('2.8','treatment-options'),
  ('2.8','statement-of-applicability'),
  ('2.8','inclusion-exclusion-justification'),
  ('2.8','residual-risk-approval'),
  ('2.8','treatment-plan'),
  ('3.1','aims-resources'),
  ('3.1','competence-requirements-ai'),
  ('3.1','competence-evidence'),
  ('3.1','ai-expertise-diversity'),
  ('3.2','awareness-requirement'),
  ('3.2','work-under-organizational-control'),
  ('3.2','communication-planning'),
  ('3.3','documented-information'),
  ('3.3','creating-and-updating'),
  ('3.3','control-of-documented-information'),
  ('3.3','external-origin-documents'),
  ('3.4','operational-planning-and-control'),
  ('3.4','process-criteria'),
  ('3.4','change-control-ai'),
  ('3.4','externally-provided-processes'),
  ('3.5','third-party-ai-supply'),
  ('3.5','supplier-obligations'),
  ('3.5','model-supply-chain'),
  ('3.5','supplier-documentation'),
  ('3.6','data-for-ai-systems'),
  ('3.6','data-provenance'),
  ('3.6','data-quality'),
  ('3.6','data-preparation'),
  ('3.6','data-acquisition'),
  ('3.7','iso-42001-27001-integration'),
  ('3.7','shared-clause-seven-eight'),
  ('3.7','carry-over-limits'),
  ('3.7','competence-does-not-carry'),
  ('3.8','clause-eight-operation'),
  ('3.8','planned-intervals'),
  ('3.8','significant-change-trigger'),
  ('3.8','retained-results'),
  ('4.1','annex-a-structure'),
  ('4.1','control-categories'),
  ('4.1','control-count'),
  ('4.1','annex-b-normative'),
  ('4.1','annex-a-not-exhaustive'),
  ('4.2','statement-of-applicability'),
  ('4.2','soa-annex-a-relationship'),
  ('4.2','soa-completeness'),
  ('4.2','exceeding-annex-a'),
  ('4.3','policy-controls'),
  ('4.3','internal-organization-controls'),
  ('4.3','reporting-of-concerns'),
  ('4.3','resource-controls'),
  ('4.4','impact-assessment-controls'),
  ('4.4','responsible-development-controls'),
  ('4.4','life-cycle-stage-controls'),
  ('4.4','verification-validation-controls'),
  ('4.4','operation-monitoring-controls'),
  ('4.4','event-log-controls'),
  ('4.5','data-controls'),
  ('4.5','information-for-users'),
  ('4.5','external-reporting-control'),
  ('4.5','incident-communication-control'),
  ('4.6','use-of-ai-controls'),
  ('4.6','human-oversight-guidance'),
  ('4.6','intended-use-control'),
  ('4.6','third-party-controls'),
  ('4.6','customer-controls'),
  ('4.7','iso-42001-27001-integration'),
  ('4.7','control-overlap'),
  ('4.7','single-control-two-systems'),
  ('4.7','false-equivalence-controls'),
  ('5.1','monitoring-and-measurement'),
  ('5.1','what-to-monitor'),
  ('5.1','aims-effectiveness-vs-system-performance'),
  ('5.1','evidence-of-results'),
  ('5.2','internal-audit-requirement'),
  ('5.2','audit-programme'),
  ('5.2','auditor-objectivity'),
  ('5.2','audit-criteria-and-scope'),
  ('5.3','management-review'),
  ('5.3','review-inputs'),
  ('5.3','review-results'),
  ('5.3','review-records'),
  ('5.4','nonconformity'),
  ('5.4','correction-vs-corrective-action'),
  ('5.4','cause-analysis'),
  ('5.4','effectiveness-review'),
  ('5.4','continual-improvement'),
  ('5.5','certification-route'),
  ('5.5','stage-one-stage-two'),
  ('5.5','surveillance-and-recertification'),
  ('5.5','iso-42006-role'),
  ('5.5','accreditation-vs-certification'),
  ('5.6','integrated-audit-programme'),
  ('5.6','shared-evidence'),
  ('5.6','evidence-that-cannot-be-shared'),
  ('5.6','auditor-competence-limit')
) as v(task_code, concept_slug)
join public.tasks    t on t.certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4' and t.code = v.task_code
join public.concepts c on c.certification_id = 'de046fa6-e627-48c1-85d8-9df226d144f4' and c.slug = v.concept_slug;

commit;

-- ============================================================
-- VERIFICATION  (run separately, one statement)
-- ============================================================
-- select
--   (select count(*) from certifications where id='de046fa6-e627-48c1-85d8-9df226d144f4') as certs,
--   (select count(*) from cert_categories where slug='governance-service-management') as category,
--   (select count(*) from domains   where certification_id='de046fa6-e627-48c1-85d8-9df226d144f4') as domains,
--   (select count(*) from tasks     where certification_id='de046fa6-e627-48c1-85d8-9df226d144f4') as tasks,
--   (select count(*) from concepts  where certification_id='de046fa6-e627-48c1-85d8-9df226d144f4') as concepts,
--   (select count(*) from task_concepts tc join tasks t on t.id=tc.task_id
--      where t.certification_id='de046fa6-e627-48c1-85d8-9df226d144f4') as links;
-- EXPECT: 1 / 1 / 5 / 35 / 154 / 157
--
-- weights must sum to 100.0:
-- select sum(weight_pct) from domains where certification_id='de046fa6-e627-48c1-85d8-9df226d144f4';
--
-- bloom profile (record it; do not tune it):
-- select bloom_level, count(*) from tasks where certification_id='de046fa6-e627-48c1-85d8-9df226d144f4' group by 1 order by 1;
