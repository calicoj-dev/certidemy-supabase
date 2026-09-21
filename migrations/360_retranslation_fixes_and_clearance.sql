-- 360_retranslation_fixes_and_clearance.sql
--
-- Three named fixes, the idoneidad pin, and clearance of five concepts.
--
-- ============ WHAT THE READ FOUND, WHICH WAS NOT THE TRANSLATIONS ============
--
-- 5 of 7 concepts clear. The English repairs in 358 landed in both languages
-- and the attachment ambiguity, the collapsing verb and the two-job word are
-- all gone. That was the job and it worked.
--
-- 4 of 7 ALSO DRIFTED IN TEXT THE ENGLISH EDIT NEVER TOUCHED, including one
-- row whose English description did not change at all. The retranslation
-- regenerated the whole row, so every word moved that the model felt like
-- moving, and a reviewer clearing the requested change silently clears the
-- rest. Every regenerated word is an unreviewed word.
--
-- ============ THE idoneidad PIN, AND WHAT I COULD NOT CHECK ============
--
-- The question was which term the SPANISH ISO 19011 edition uses for
-- "appropriateness". I CANNOT ANSWER THAT: IP-POSITION section 5 records that
-- this project holds the ENGLISH editions only, so nothing here can say what
-- AENOR prints. Saying otherwise would be inventing a citation.
--
-- What is measurable is the house form, and it is not close:
--
--     es-419 idoneidad     2 concepts, 2 tasks, 13 lessons, 79 items   96
--     es-419 pertinencia   2 concepts, 1 task,   3 lessons,  2 items    8
--
-- AND THE TWO CONCEPTS CARRYING pertinencia ARE THE TWO THIS RETRANSLATION
-- JUST CHANGED. Before it, the corpus read about 96 to 6. So this is a REVERT
-- to the established rendering, not a ruling on the standard. If the Spanish
-- edition turns out to say pertinencia, that is a corpus-wide change of 96
-- occurrences and its own decision.
--
-- ============ THE pt ICT NAME GOES BACK TO SINGULAR ============
--
-- English name: "ICT and emerging technology competence". English description:
-- "and emerging technology, to conduct audits". Both singular, and the clause
-- itself is singular. The plural was introduced by the regeneration with no
-- prompting from the source, which puts it in the churn list rather than in a
-- justification.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  n_bad   int;
  n_clear int;
  frozen_before text;
  frozen_after  text;
  five uuid[];
begin

  if not exists (select 1 from pg_attribute a join pg_class c on c.oid=a.attrelid
                  join pg_namespace n on n.oid=c.relnamespace and n.nspname='public'
                 where c.relname='concept_translations' and a.attname='en_hash' and not a.attisdropped) then
    raise exception 'concept_translations.en_hash does not exist -- 359 has not run';
  end if;

  select array_agg(cp.id) into five
    from public.concepts cp join public.certifications c on c.id=cp.certification_id
   where (c.code, cp.slug) in (
     ('ISMS-F','tool-misuse'), ('SM-AI-II','complementary-practice'),
     ('AIHR-I','institution-proxy'), ('SD-AI-I','daily-backlog-update'),
     ('AISM-I','keep-it-simple-and-practical'));
  if array_length(five, 1) <> 5 then
    raise exception 'expected 5 concepts to clear, resolved %', coalesce(array_length(five,1), 0);
  end if;

  -- what must not move: every translation row outside the 7 this touches
  select md5(coalesce(string_agg(ct.concept_id::text || ':' || ct.language || ':' ||
                                 coalesce(ct.name,'') || ':' || coalesce(ct.description,'') || ':' ||
                                 ct.is_provisional::text, ',' order by ct.concept_id, ct.language), ''))
    into frozen_before
    from public.concept_translations ct
    join public.concepts cp on cp.id = ct.concept_id
    join public.certifications c on c.id = cp.certification_id
   where (c.code, cp.slug) not in (
     ('ISMS-F','tool-misuse'), ('SM-AI-II','complementary-practice'),
     ('AIHR-I','institution-proxy'), ('SD-AI-I','daily-backlog-update'),
     ('AISM-I','keep-it-simple-and-practical'),
     ('ISMS-IA','ia-ai-evaluation-tools-in-auditor-competence-7-2-3'),
     ('ISMS-IA','ia-ict-and-emerging-technology-competence-7-2-3'));

  -- ------------------------------------------- fix 1: tool-misuse es
  -- pt already says "nao intencionais"; es said "no previstos" (unforeseen)
  -- for the same English word. This is a PRE-EXISTING mismatch the read
  -- caught, not churn -- both renderings carried it before and after.
  update public.concept_translations ct
     set description = replace(ct.description, 'no previstos', 'no intencionados')
    from public.concepts cp, public.certifications c
   where cp.id = ct.concept_id and c.id = cp.certification_id
     and c.code = 'ISMS-F' and cp.slug = 'tool-misuse' and ct.language = 'es-419';

  -- ------------------------------------------- fix 2: institution-proxy pt
  -- CHURN REVERT. The regeneration moved "condicao protegida" to "status
  -- protegido", creating a divergence from es "condicion protegida" that did
  -- not exist before and that the English edit did not ask for.
  update public.concept_translations ct
     set description = replace(ct.description, 'status protegido', 'condicao protegida')
    from public.concepts cp, public.certifications c
   where cp.id = ct.concept_id and c.id = cp.certification_id
     and c.code = 'AIHR-I' and cp.slug = 'institution-proxy' and ct.language = 'pt-BR';

  -- ------------------------------------------- fix 3: keep-it-simple, all churn
  -- Its English DESCRIPTION never changed -- only the name did -- yet three
  -- spans moved across two languages. Every one is reverted.
  update public.concept_translations ct
     set description = 'usar la cantidad minima de pasos para lograr el objetivo; eliminar lo que no agrega valor.'
    from public.concepts cp, public.certifications c
   where cp.id = ct.concept_id and c.id = cp.certification_id
     and c.code = 'AISM-I' and cp.slug = 'keep-it-simple-and-practical' and ct.language = 'es-419';
  update public.concept_translations ct
     set description = 'use o minimo de etapas para atingir o objetivo; elimine o que nao agrega valor.'
    from public.concepts cp, public.certifications c
   where cp.id = ct.concept_id and c.id = cp.certification_id
     and c.code = 'AISM-I' and cp.slug = 'keep-it-simple-and-practical' and ct.language = 'pt-BR';

  -- ------------------------------------------- the idoneidad pin
  update public.concept_translations ct
     set description = regexp_replace(ct.description, 'pertinencia', 'idoneidad', 'gi')
    from public.concepts cp, public.certifications c
   where cp.id = ct.concept_id and c.id = cp.certification_id
     and c.code = 'ISMS-IA' and ct.language = 'es-419'
     and cp.slug in ('ia-ai-evaluation-tools-in-auditor-competence-7-2-3',
                     'ia-ict-and-emerging-technology-competence-7-2-3');

  -- ------------------------------------------- the ICT pt name, back to singular
  update public.concept_translations ct
     set name = 'Competencia em TIC e tecnologia emergente'
    from public.concepts cp, public.certifications c
   where cp.id = ct.concept_id and c.id = cp.certification_id
     and c.code = 'ISMS-IA' and cp.slug = 'ia-ict-and-emerging-technology-competence-7-2-3'
     and ct.language = 'pt-BR';

  -- ------------------------------------------- clear the five
  -- The GATE decides what serves; this only says a human read them. A row
  -- whose en_hash no longer matches stays dark whatever is written here, which
  -- is checked below rather than assumed.
  update public.concept_translations ct
     set is_provisional = false, review_status = 'approved'
   where ct.concept_id = any (five);
  get diagnostics n_clear = row_count;

  -- ===================== POST-CONDITIONS =====================

  -- 1. EXACTLY TEN ROWS CLEARED -- five concepts, two languages.
  if n_clear <> 10 then
    raise exception 'cleared % row(s), expected 10', n_clear;
  end if;

  -- 2. THE TWO HELD CONCEPTS ARE STILL PROVISIONAL. The idoneidad pin and the
  --    name revert are fixes, not a clearance: the term question was answered
  --    from the corpus and NOT from the Spanish edition, which this project
  --    does not hold.
  select count(*) into n_bad
    from public.concept_translations ct
    join public.concepts cp on cp.id = ct.concept_id
    join public.certifications c on c.id = cp.certification_id
   where c.code = 'ISMS-IA'
     and cp.slug in ('ia-ai-evaluation-tools-in-auditor-competence-7-2-3',
                     'ia-ict-and-emerging-technology-competence-7-2-3')
     and not ct.is_provisional;
  if n_bad <> 0 then
    raise exception '% held row(s) were cleared', n_bad;
  end if;

  -- 3. THE GATE AGREES. Every row just cleared must also pass the en_hash
  --    check, or it is marked approved and still dark -- a review row that
  --    claims something the view contradicts.
  select count(*) into n_bad
    from public.concept_translations ct
   where ct.concept_id = any (five)
     and ct.en_hash is distinct from public.concept_row_en_hash(ct.concept_id);
  if n_bad <> 0 then
    raise exception '% cleared row(s) fail the en_hash gate and would stay dark', n_bad;
  end if;

  -- 4. NEGATIVE. Nothing outside the seven moved.
  select md5(coalesce(string_agg(ct.concept_id::text || ':' || ct.language || ':' ||
                                 coalesce(ct.name,'') || ':' || coalesce(ct.description,'') || ':' ||
                                 ct.is_provisional::text, ',' order by ct.concept_id, ct.language), ''))
    into frozen_after
    from public.concept_translations ct
    join public.concepts cp on cp.id = ct.concept_id
    join public.certifications c on c.id = cp.certification_id
   where (c.code, cp.slug) not in (
     ('ISMS-F','tool-misuse'), ('SM-AI-II','complementary-practice'),
     ('AIHR-I','institution-proxy'), ('SD-AI-I','daily-backlog-update'),
     ('AISM-I','keep-it-simple-and-practical'),
     ('ISMS-IA','ia-ai-evaluation-tools-in-auditor-competence-7-2-3'),
     ('ISMS-IA','ia-ict-and-emerging-technology-competence-7-2-3'));
  if frozen_before is distinct from frozen_after then
    raise exception 'a translation outside the seven changed';
  end if;

  -- 5. THE PIN TOOK, ON THE TWO ROWS THIS MIGRATION TOUCHED.
  --
  --    NARROWED. The first version asserted pertinencia appears in ZERO
  --    es-419 concept rows -- a corpus-wide literal over 1,729 rows this
  --    migration has no authority over, which aborts against a correct
  --    database the moment anyone uses the word legitimately somewhere else.
  --    That is the 328 / 345 / 351 / 352 shape.
  --
  --    A POST-CONDITION GUARDS A WRITE. A CHECK SCRIPT WATCHES A PROPERTY.
  --    The corpus-wide term consistency moved to
  --    scripts/sql/check-term-consistency.sql, where a new legitimate use is
  --    a report rather than a failed migration.
  select count(*) into n_bad
    from public.concept_translations ct
    join public.concepts cp on cp.id = ct.concept_id
    join public.certifications c on c.id = cp.certification_id
   where c.code = 'ISMS-IA' and ct.language = 'es-419'
     and cp.slug in ('ia-ai-evaluation-tools-in-auditor-competence-7-2-3',
                     'ia-ict-and-emerging-technology-competence-7-2-3')
     and ct.description ~* '\mpertinencia\M';
  if n_bad <> 0 then
    raise exception '% of the two pinned row(s) still say pertinencia', n_bad;
  end if;
  select count(*) into n_bad
    from public.concept_translations ct
    join public.concepts cp on cp.id = ct.concept_id
    join public.certifications c on c.id = cp.certification_id
   where c.code = 'ISMS-IA' and ct.language = 'es-419'
     and cp.slug in ('ia-ai-evaluation-tools-in-auditor-competence-7-2-3',
                     'ia-ict-and-emerging-technology-competence-7-2-3')
     and ct.description ~* '\midoneidad\M';
  if n_bad <> 2 then
    raise exception 'only % of the two pinned row(s) say idoneidad', n_bad;
  end if;

  -- 6. THE CHURN REVERTS TOOK.
  if exists (select 1 from public.concept_translations ct
               join public.concepts cp on cp.id = ct.concept_id
               join public.certifications c on c.id = cp.certification_id
              where c.code = 'AIHR-I' and cp.slug = 'institution-proxy'
                and ct.language = 'pt-BR' and ct.description ~* 'status protegido') then
    raise exception 'institution-proxy pt still says status protegido';
  end if;
  if exists (select 1 from public.concept_translations ct
               join public.concepts cp on cp.id = ct.concept_id
               join public.certifications c on c.id = cp.certification_id
              where c.code = 'AISM-I' and cp.slug = 'keep-it-simple-and-practical'
                and (ct.description ~* 'aporta valor' or ct.description ~* 'minima cantidad'
                  or ct.description ~* 'alcancar o objetivo')) then
    raise exception 'a keep-it-simple churn edit survived the revert';
  end if;

  -- 7. AS mcp_reader. The five now serve and the two held do not.
  execute 'set local role mcp_reader';
  select count(*) into n_bad from mcp.concept
   where certification = 'ISMS-F' and slug = 'tool-misuse' and language = 'es-419'
     and description_is_fallback;
  execute 'reset role';
  if n_bad <> 0 then
    raise exception 'a cleared concept is still falling back';
  end if;
  execute 'set local role mcp_reader';
  select count(*) into n_bad from mcp.concept
   where certification = 'ISMS-IA' and language = 'es-419'
     and slug = 'ia-ict-and-emerging-technology-competence-7-2-3'
     and not description_is_fallback;
  execute 'reset role';
  if n_bad <> 0 then
    raise exception 'a HELD concept is being served';
  end if;

  raise notice '360 ok: 3 fixes, idoneidad pinned, ICT pt name singular, % row(s) cleared', n_clear;
  raise notice 'The two ISMS-IA concepts stay provisional: the term was settled from the corpus, not the Spanish edition.';
end
$mig$;
