-- 203_isms_ia_claim_and_public_samples.sql
--
-- THE TWO THINGS BETWEEN A GREEN verify-cert AND A SELLABLE CERTIFICATION.
--
-- CERT-PUBLISH-CHECKLIST opens with the reason this file exists: verify-cert
-- returns "All certs conform. Safe to publish" on a certification that renders
-- a blank catalogue card and shows no sample questions. Every invariant it
-- checks is about assessment integrity. Nothing it checks is about whether the
-- thing can be sold. AIHR-I cost a discovery cycle finding that out.
--
-- ============================================================================
-- 1. CATALOGUE CLAIM - certification_i18n
-- ============================================================================
--
-- The one-line string under the cert in the catalogue picker. Without a row the
-- card renders bare: code and name only.
--
-- The checklist is explicit that this is A SCOPE STATEMENT BOUND TO THE JTA,
-- not marketing copy - it is what a buyer or an assessor holds you to. Every
-- claim in the register opens with "Validates" to preserve the parallel form.
--
-- This one is bound to the five domains: the programme (D2), the fieldwork
-- (D3), the ISMS itself (D4), and the findings (D5), performed by someone whose
-- objectivity and competence are themselves in question (D1). "Survive
-- challenge" is the honest verb - an internal audit finding is contested by the
-- process owner long before any certification body sees it.
--
-- The AI clause is not decoration. Domain 3 covers what an AI-assisted evidence
-- process establishes and what it leaves unverified; domain 4 covers AI systems
-- and AI-derived assets inside the ISMS scope. A claim that omitted it would
-- understate the scope a buyer is purchasing.
--
-- ENGLISH ONLY IN THIS MIGRATION. It is ASCII and safe through the SQL editor.
-- es-419 and pt-BR carry accented characters and go through
-- load-cert-i18n.mjs, because the Supabase SQL editor is this project's known
-- source of double-encoded UTF-8. Precedent: migrations 113 and 151.
--
-- `name` stays NULL for every language: cert names are product identifiers and
-- are not translated, so NULL makes the loader fall back to certifications.name.
--
-- ============================================================================
-- 2. PUBLIC SAMPLES - quiz_questions.visibility
-- ============================================================================
--
-- Six logical items across three languages: 18 rows. Matched on
-- question_group_id so the languages move together.
--
-- ALLOCATION. Blueprint-weighted by domain, largest remainder over six slots:
--
--     D1  12.5%  ->  0.75  ->  1
--     D2  20.0%  ->  1.20  ->  1
--     D3  25.0%  ->  1.50  ->  2
--     D4  25.0%  ->  1.50  ->  1
--     D5  17.5%  ->  1.05  ->  1
--
-- D3 takes the second seat on the remainder tie with D4, by domain order.
--
-- SIX DISTINCT TASKS. The checklist records this as AIHR-I's defect in
-- migration 149, corrected by 150: ranking within a domain puts two picks
-- inside the same task, because each task holds ten practice items. Partition
-- by task, not by domain.
--
-- COGNITIVE MIX. The published profile is 65.6% analyze / 29.4% apply, so six
-- items want roughly four and two. That is what this is.
--
-- WHAT EACH ONE IS DOING, since these are the first six items a prospective
-- candidate ever sees of the bank:
--
--   D1 1.3  The IT security manager assigned to audit supplier relationships he
--           manages. Independence against the reality of a small organization -
--           the dilemma every internal auditor recognises immediately.
--
--   D2 2.2  Scheduling audits in clause-number order. Attacks the "clause order
--           implies priority" misconception head-on, which ISO/IEC 27001's own
--           Introduction disclaims.
--
--   D3 3.3  A screen share against an exported file. What remote evidence
--           actually establishes - distinctively this credential's subject.
--
--   D3 3.8  An AI tool ingesting the risk assessment during a clause 8.2 audit.
--           What the tool established, and what remains unverified.
--
--   D4 4.7  Clause 4.1 conformance after Amendment 1:2024. Visible proof to any
--           buyer who knows the amendment that the content tracks the current
--           edition rather than the 2022 text alone.
--
--   D5 5.3  A nonconformity statement that names the requirement, the evidence
--           and the gap without prescribing the remedy. The discrimination that
--           separates an auditor from someone who has read the standard.
--
-- DELIBERATELY NOT INCLUDED: the D1 task 1.2 cluster. Five strong variants of
-- "the only auditor with the expertise also designed the control", and one
-- independence dilemma in a set of six is enough.
--
-- Resets to private first, so this is a true reselection and re-running cannot
-- accumulate extra public rows. Reference: 150_aihr_i_public_samples.
--
-- Run in the Supabase SQL editor.

-- ============================================================================
-- 1. ENGLISH CLAIM
-- ============================================================================

insert into public.certification_i18n (certification_id, lang, name, claim, description)
select c.id, 'en', null,
       'Validates that the holder can plan, conduct and report an internal ISMS audit whose findings survive challenge, including where AI systems sit inside the scope.',
       null
from public.certifications c
where c.code = 'ISMS-IA'
on conflict (certification_id, lang) do update
  set claim = excluded.claim,
      name  = null,
      updated_at = now();

-- ============================================================================
-- 2. RESET, THEN TAG THE SIX
-- ============================================================================

update public.quiz_questions q
set visibility = 'private'
from public.certifications c
where c.id = q.certification_id and c.code = 'ISMS-IA'
  and q.pool = 'practice' and q.visibility = 'public';

update public.quiz_questions q
set visibility = 'public'
from public.certifications c
where c.id = q.certification_id and c.code = 'ISMS-IA'
  and q.pool = 'practice' and q.retired_at is null
  and q.question_group_id in (
    '4dbee56a-7e7f-442e-b0ad-d89639904bff',  -- D1 1.3  independence vs small-org reality
    '7efdbc8b-7480-4f16-b4db-d3e4f54b71dd',  -- D2 2.2  clause order is not priority
    '061e340a-de47-464d-8427-a284051da94b',  -- D3 3.3  screen share vs exported file
    '2fcca2aa-83b2-4e7a-9ca1-24f55a465bca',  -- D3 3.8  what the AI tool left unverified
    '1fab3075-748d-4814-aa27-4d1518e8d6bf',  -- D4 4.7  clause 4.1 after Amd 1:2024
    '1dbd09b3-08cf-415e-8692-f43fa202fb83'   -- D5 5.3  the nonconformity statement
  );

-- ============================================================================
-- PROOF
-- ============================================================================

-- 1. The claim exists in English and reads as intended.
select ci.lang, ci.name, ci.claim
from public.certification_i18n ci
join public.certifications c on c.id = ci.certification_id
where c.code = 'ISMS-IA' order by ci.lang;

-- 2. Eighteen public rows: six groups x three languages. Expect 6/6/6.
select q.language, count(*) as public_items,
       count(distinct q.question_group_id) as groups
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where c.code = 'ISMS-IA' and q.visibility = 'public' and q.retired_at is null
group by q.language order by q.language;

-- 3. Six DISTINCT tasks, weighted across five domains. Expect 6 rows,
--    D3 twice and every other domain once.
select d.code as domain, d.weight_pct, t.code as task, t.bloom_level,
       left(q.question_text, 80) as stem
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
join public.tasks t on t.id = q.task_id
join public.domains d on d.id = t.domain_id
where c.code = 'ISMS-IA' and q.visibility = 'public'
  and q.language = 'en' and q.retired_at is null
order by d.order_index, t.code;

-- 4. THE FIREWALL. No secure item is public, in any cert. Expect 0.
select count(*) as secure_items_exposed
from public.quiz_questions
where pool = 'secure' and visibility <> 'secure' and retired_at is null;

-- 5. Cognitive mix of the six. Expect roughly 4 analyze / 2 apply.
select t.bloom_level, count(*) as n
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
join public.tasks t on t.id = q.task_id
where c.code = 'ISMS-IA' and q.visibility = 'public' and q.language = 'en'
  and q.retired_at is null
group by t.bloom_level order by t.bloom_level;
