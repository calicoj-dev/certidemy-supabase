-- Standing check: one rendering per pinned source term, per language.
--
-- THIS WAS A POST-CONDITION IN 360 AND IT DID NOT BELONG THERE. Asserting
-- "pertinencia appears in zero es-419 rows" inside a migration is a
-- corpus-wide literal over 1,729 rows that migration had no authority over,
-- and it aborts against a CORRECT database the first time someone uses the
-- word legitimately elsewhere.
--
-- A POST-CONDITION GUARDS A WRITE: it asserts what this statement did and
-- what it left alone, and failing means do not commit. A CHECK SCRIPT WATCHES
-- A PROPERTY: it reports drift across a corpus nobody is writing to right now,
-- and failing means go and look. Four migrations aborted against correct
-- databases -- 328's expected 4, 345's 12637, 351's 13, 352's 98 -- by putting
-- the second kind of question inside the first kind of gate.
--
-- Reports counts. Does not fail. A new legitimate use is a line to read, not
-- a blocked deployment.
with pinned(source_term, lang, preferred, variants) as (values
  ('appropriateness', 'es-419', 'idoneidad',   array['pertinencia']),
  ('accountability',  'es-419', null,          array['rendicion de cuentas','responsabilidad']),
  ('accountability',  'pt-BR',  null,          array['prestacao de contas','responsabilidade'])
), hits as (
  select p.source_term, p.lang, p.preferred, v.variant,
         (select count(*) from public.concept_translations ct
           where ct.language = p.lang
             and (coalesce(ct.name,'') || ' ' || coalesce(ct.description,'')) ~* ('\m' || v.variant || '\M')) as concept_rows
    from pinned p cross join lateral unnest(p.variants || case when p.preferred is null then '{}'::text[] else array[p.preferred] end) as v(variant)
)
select source_term, lang, variant,
       case when variant = preferred then 'PINNED' else 'variant' end as status,
       concept_rows
  from hits
 where concept_rows > 0
 order by source_term, lang, concept_rows desc;
