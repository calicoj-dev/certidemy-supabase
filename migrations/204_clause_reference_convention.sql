-- 204_clause_reference_convention.sql
--
-- ONE OUTLIER AGAINST A CONVENTION NOBODY HAD WRITTEN DOWN, AND ONE ANGLICISM.
--
-- ============================================================================
-- WHAT PROMPTED THIS
-- ============================================================================
--
-- An external review of ISMS-IA's Spanish JTA translations raised what it called
-- the highest-priority finding: the rows mix "capitulo" and "apartado" for
-- clause references, and the cert should pick one and apply it uniformly.
--
-- That reading was wrong, and the data says so unambiguously. Across ISMS-IA's
-- twelve Spanish rows carrying a clause reference:
--
--     apartado  ->  9.2, 9.1, 9.3, 4.1        (subdivisions)
--     capitulo  ->  4, 5, 6, 7, "4 al 10"     (top-level clauses)
--
-- Twelve for twelve, no exceptions. That is the UNE Spanish convention applied
-- correctly, not drift: a numbered top-level clause is a CAPITULO, and anything
-- below the decimal point is an APARTADO of it. The translator got it right and
-- the reviewer read variation as inconsistency because the rule existed only in
-- the output, never in a document.
--
-- The same query across the published family found the convention held there
-- too - with exactly one exception, and it is not in ISMS-IA.
--
-- ============================================================================
-- 1. AIMS-F TASK 3.8 - the real outlier
-- ============================================================================
--
--   es-419: "Aplicar los requisitos operacionales del apartado 8 para la
--            evaluacion y el tratamiento"
--
-- Clause 8 is top-level, so it is a capitulo. AIMS-F's own D3 description gets
-- the same clause right in the same language -- "las obligaciones operacionales
-- del capitulo 8" -- so the cert contradicts itself by one word.
--
-- This is a REVIEWED row on a LIVE certification (is_provisional = false), which
-- is why it is being corrected by targeted UPDATE rather than by re-running the
-- generator. FORCE=1 would replace all 80 of AIMS-F's reviewed rows with fresh
-- machine output to fix one word.
--
-- The trigger from migration 132 fires on the ENGLISH moving, not on a
-- translation being corrected, so this does not flip the row back to
-- provisional. The review that approved this row approved everything else in it;
-- one term is being brought into line with the convention that row already
-- follows everywhere else.
--
-- ============================================================================
-- 2. ISMS-IA TASK 3.5 - an anglicism
-- ============================================================================
--
--   es-419: "Seleccionar la forma de pregunta que elicite evidencia en lugar de
--            confirmacion en una situacion de entrevista determinada."
--
-- "Elicitar" is a calque of the English "elicit". It exists in Spanish, but a
-- practitioner would say "obtener". The task is about interview technique, where
-- the vocabulary should be the one an auditor actually uses out loud.
--
-- The row is still provisional, so this is part of the review pass rather than a
-- correction to approved text.
--
-- ============================================================================
-- WHY SQL AND NOT A SCRIPT
-- ============================================================================
--
-- Both strings carry accented characters, which is normally the mojibake trap.
-- SQL unicode escapes (U&'...' with UESCAPE) travel through the editor intact
-- because they are pure ASCII on the wire - the same technique TERMINOLOGY-POLICY
-- section 7 records for migrations that must carry accented text. The proof
-- queries below check for the double-encoding signature either way.
--
-- Run in the Supabase SQL editor.

-- ============================================================================
-- BEFORE
-- ============================================================================

select c.code, t.code as task, tt.language, tt.is_provisional, tt.statement
from public.task_translations tt
join public.tasks t on t.id = tt.task_id
join public.certifications c on c.id = t.certification_id
where (c.code = 'AIMS-F' and t.code = '3.8' and tt.language = 'es-419')
   or (c.code = 'ISMS-IA' and t.code = '3.5' and tt.language = 'es-419')
order by c.code;

-- ============================================================================
-- 1. AIMS-F 3.8 - apartado 8 -> capitulo 8
-- ============================================================================

update public.task_translations tt
set statement = U&'Aplicar los requisitos operacionales del cap\00ED'
              || U&'tulo 8 para la evaluaci\00F3'
              || U&'n y el tratamiento',
    updated_at = now()
from public.tasks t, public.certifications c
where t.id = tt.task_id
  and c.id = t.certification_id
  and c.code = 'AIMS-F'
  and t.code = '3.8'
  and tt.language = 'es-419';

-- ============================================================================
-- 2. ISMS-IA 3.5 - elicite -> obtenga
-- ============================================================================

update public.task_translations tt
set statement = U&'Seleccionar la forma de pregunta que obtenga evidencia en lugar de confirmaci\00F3'
              || U&'n en una situaci\00F3'
              || U&'n de entrevista determinada.',
    updated_at = now()
from public.tasks t, public.certifications c
where t.id = tt.task_id
  and c.id = t.certification_id
  and c.code = 'ISMS-IA'
  and t.code = '3.5'
  and tt.language = 'es-419';

-- ============================================================================
-- PROOF
-- ============================================================================

-- 1. Both rows read as intended, with accents intact and no mojibake.
select c.code, t.code as task, tt.is_provisional,
       tt.statement,
       tt.statement like '%' || chr(195) || chr(162) || '%' as mojibake
from public.task_translations tt
join public.tasks t on t.id = tt.task_id
join public.certifications c on c.id = t.certification_id
where (c.code = 'AIMS-F' and t.code = '3.8' and tt.language = 'es-419')
   or (c.code = 'ISMS-IA' and t.code = '3.5' and tt.language = 'es-419')
order by c.code;

-- 2. No Spanish row anywhere now says "apartado" of a TOP-LEVEL clause -
--    apartado must always be followed by a number containing a decimal point.
--    Expect 0 rows.
select c.code, t.code as task, tt.statement
from public.task_translations tt
join public.tasks t on t.id = tt.task_id
join public.certifications c on c.id = t.certification_id
where tt.language = 'es-419'
  and tt.statement ~* 'apartado\s+[0-9]+(?![0-9.])'
union all
select c.code, d.code, dt.description
from public.domain_translations dt
join public.domains d on d.id = dt.domain_id
join public.certifications c on c.id = d.certification_id
where dt.language = 'es-419'
  and dt.description ~* 'apartado\s+[0-9]+(?![0-9.])';

-- 3. And the mirror: no "capitulo" of a SUBDIVISION. Expect 0 rows.
select c.code, t.code as task, tt.statement
from public.task_translations tt
join public.tasks t on t.id = tt.task_id
join public.certifications c on c.id = t.certification_id
where tt.language = 'es-419'
  and tt.statement ~* ('cap[' || chr(105) || chr(237) || ']tulo\s+[0-9]+\.[0-9]')
union all
select c.code, d.code, dt.description
from public.domain_translations dt
join public.domains d on d.id = dt.domain_id
join public.certifications c on c.id = d.certification_id
where dt.language = 'es-419'
  and dt.description ~* ('cap[' || chr(105) || chr(237) || ']tulo\s+[0-9]+\.[0-9]');

-- 4. "elicite" is gone from every cert, every language. Expect 0 rows.
select c.code, t.code as task, tt.language, tt.statement
from public.task_translations tt
join public.tasks t on t.id = tt.task_id
join public.certifications c on c.id = t.certification_id
where tt.statement ~* '\melicit';

-- ============================================================================
-- AFTER THIS: the convention goes into TERMINOLOGY-POLICY as Rule 17, so the
-- next reviewer of the next cert does not raise it again. It was discovered by
-- reading the existing translations, not decided fresh - the convention predates
-- the policy that now records it.
-- ============================================================================
