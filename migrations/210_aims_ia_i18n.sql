-- 210_aims_ia_i18n.sql
--
-- AIMS-IA catalogue claim + long-form description, en / es-419 / pt-BR.
--
-- Fills certification_i18n, which drives two surfaces:
--   claim        the one-line hook on the catalogue card (90-160 chars across
--                the family) - quick and catchy
--   description  the long-form copy on the certification page (288-549 chars
--                across the family) - written to be read and understood
--
-- Without these rows the card renders code and name only, and the page falls
-- back to English silently in Spanish and Portuguese. Both are verify-cert
-- Section 12 failures.
--
-- HOUSE VOICE. Every claim in the family opens "Validates that the holder
-- can..." or "Validates the judgment to...". AIMS-IA follows its ISMS-IA
-- sibling's shape deliberately: the two are the same role against different
-- standards and should read as a recognisable pair.
--
-- THE HOOK. ISMS-IA's claim turns on findings that "survive challenge".
-- AIMS-IA's turns on findings that "rest on requirements the standard actually
-- states" - narrower and sharper, because that is this scheme's distinct
-- competence. A should in Annex B cannot carry a nonconformity; nor can a note,
-- nor anything in ISO 19011. That is what task 5.4 tests and what the whole
-- credential converges on.
--
-- FRAMING. Neither field mentions ISO/IEC 27001. The three differentiators -
-- the AI system impact assessment, role-based scope, and the layered
-- normativity of Annex A and Annex B - are stated as facts about ISO/IEC 42001,
-- not as things another certification does not cover. State what the credential
-- has and does; never state an absence, and never frame a differentiator as a
-- swipe at a sibling product.
--
-- TERMINOLOGY. "sistema de gestion de IA" / "sistema de gestao de IA" spelled
-- out - never a coined acronym, matching the 90 JTA translation rows and the
-- item banks. Clause references follow the family: "apartado" in Spanish,
-- "secao" in Portuguese, verified consistent across AIMS-IA, ISMS-IA, ISMS-F
-- and AIMS-F.
--
-- Run in the Supabase SQL editor.
-- ============================================================================

insert into public.certification_i18n (certification_id, lang, claim, description)
values
  (
    '4818fc03-6da0-4266-9329-0e1ea2ea3fb4',
    'en',
    'Validates that the holder can audit an AI management system against ISO/IEC 42001 and raise findings that rest on requirements the standard actually states.',
    'Level II certification in auditing an AI management system built to ISO/IEC 42001:2023, using ISO 19011:2026 as the audit methodology and ISO/IEC 42001 as the audit criteria. Covers audit programme management, evidence and sampling, testing declared Annex A controls against the Statement of Applicability, and findings through to management review - including the AI system impact assessment as a requirement in its own right, scope that follows from the roles an organization determines toward its AI systems, and the layered normativity of Annex A and Annex B.'
  ),
  (
    '4818fc03-6da0-4266-9329-0e1ea2ea3fb4',
    'es-419',
    'Valida que la persona puede auditar un sistema de gestion de IA frente a ISO/IEC 42001 y plantear hallazgos que se apoyan en requisitos que la norma efectivamente establece.',
    'Certificacion de Nivel II en la auditoria de un sistema de gestion de IA construido conforme a ISO/IEC 42001:2023, usando ISO 19011:2026 como metodologia de auditoria e ISO/IEC 42001 como criterios de auditoria. Cubre la gestion del programa de auditoria, la evidencia y el muestreo, la verificacion de los controles declarados del Anexo A frente a la Declaracion de Aplicabilidad, y los hallazgos hasta la revision por la direccion, incluyendo la evaluacion de impacto del sistema de IA como requisito por derecho propio, el alcance que se deriva de los roles que la organizacion determina respecto de sus sistemas de IA, y la normatividad en capas del Anexo A y el Anexo B.'
  ),
  (
    '4818fc03-6da0-4266-9329-0e1ea2ea3fb4',
    'pt-BR',
    'Valida que a pessoa e capaz de auditar um sistema de gestao de IA em relacao a ISO/IEC 42001 e levantar constatacoes que se apoiam em requisitos que a norma de fato estabelece.',
    'Certificacao de Nivel II na auditoria de um sistema de gestao de IA construido conforme a ISO/IEC 42001:2023, usando a ISO 19011:2026 como metodologia de auditoria e a ISO/IEC 42001 como criterios de auditoria. Cobre a gestao do programa de auditoria, as evidencias e a amostragem, a verificacao dos controles declarados do Anexo A em relacao a Declaracao de Aplicabilidade, e as constatacoes ate a analise critica pela direcao, incluindo a avaliacao de impacto do sistema de IA como requisito por direito proprio, o escopo que decorre dos papeis que a organizacao determina em relacao aos seus sistemas de IA, e a normatividade em camadas do Anexo A e do Anexo B.'
  )
on conflict (certification_id, lang) do update
set claim = excluded.claim,
    description = excluded.description,
    updated_at = now();

-- ============================================================================
-- ACCENTS
-- ============================================================================
-- The rows above are deliberately ASCII. The Supabase SQL editor corrupts
-- multibyte characters on paste, and this file is pasted into it. Run
-- scripts\load-aims-ia-i18n.mjs immediately after this migration to write the
-- correctly accented Spanish and Portuguese through the API, which is the only
-- path that preserves them. The loader carries the same text with accents and
-- upserts on (certification_id, lang).
--
-- Do NOT hand-correct the accents in the SQL editor. That is the exact route
-- that produced the mojibake incidents recorded in earlier handoffs.
-- ============================================================================

-- ============================================================================
-- PROOF
-- ============================================================================

-- 1. Three rows, one per language, both fields populated.
select lang, length(claim) as claim_chars, length(description) as desc_chars
from public.certification_i18n
where certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
order by lang;

-- 2. No coined acronym for "AI management system" in any language.
--    Expect zero rows.
select lang, claim, description
from public.certification_i18n
where certification_id = '4818fc03-6da0-4266-9329-0e1ea2ea3fb4'
  and (claim || ' ' || description) ~ '\y(SGIA|SGSIA|SGI A)\y';

-- 3. Alongside the family, so the voice can be compared at a glance.
select c.code, ci.lang, ci.claim
from public.certification_i18n ci
join public.certifications c on c.id = ci.certification_id
where ci.lang = 'en' and c.code in ('AIMS-IA','ISMS-IA','AIMS-F')
order by c.code;

-- 4. The whole-cert check.
--    Run: node scripts\verify-cert.mjs --cert AIMS-IA --strict
--    Expect both Section 12 claim and description checks to PASS.
