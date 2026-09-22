-- 364_concept_translation_tr_hash.sql
--
-- Close the concept-side half of migration 352's gate: a translated row now
-- carries a hash of ITS OWN name and description, and mcp.concept withholds a
-- row whose stored tr_hash no longer matches what the row holds.
--
-- ============ THE GAP, AND IT IS HALF A CHECK ============
--
-- 359 keyed concept_translations.en_hash to concept_row_en_hash, so an English
-- edit re-closes the gate with no human action. That half works and it is the
-- reason AIMS-F's 308 rows could be regenerated safely.
--
-- IT NEVER ASKS WHETHER THE REVIEW IS STILL ABOUT THE CURRENT TRANSLATION.
-- Edit a cleared Spanish description and it keeps serving under an approval
-- that no longer describes it. CLAUDE.md records this as "A HASH GATE PROVES
-- ONLY THE SIDE IT HASHES", records that 352 closed it for lessons and tasks,
-- and records that concepts were left open.
--
-- ============ IT HAS ALREADY COST TWO CORRECT FIXES ============
--
-- Twice in one session the honest answer to "may I edit this reviewed
-- translation" was to decline:
--
--   * 4 bare capitalised "Secao" in three CLEARED ISMS-IA rows, under a
--     ruling that capitalisation follows a digit.
--   * the apreciacion / evaluacion pin, which touches cleared rows in three
--     certifications.
--
-- Both are correct fixes that were held because nothing would re-open the
-- review afterwards. A gate that cannot be re-closed makes reviewed content
-- unmaintainable, which is a worse outcome than the drift it was guarding.
--
-- ============ THE FUNCTION IS 352's, NOT A NEW ONE ============
--
-- public.translation_hash(a, b, c) already hashes up to three translated
-- fields and is what task_ksa_is_withheld compares against. A concept has two,
-- so translation_hash(name, description) is the same instrument at a different
-- grain. Writing a second hashing function here would be the "derive, never
-- duplicate" defect this file already records.
--
-- ============ PER ROW, NOT PER CONCEPT ============
--
-- 359's gate is per concept: an English edit withholds both languages, which
-- is right, because the source moved for both. A TRANSLATION edit moves one
-- rendering only, so editing es-419 must leave pt-BR serving. The proof below
-- asserts exactly that, and it is the property that distinguishes this gate
-- from the one above it.
--
-- ============ THE PROOF ============
--
-- Backfill from current content, so the first run withholds ZERO -- a gate
-- that withholds something on installation cannot be told from a gate that is
-- wrong. Then, inside a sub-block that rolls itself back by raising:
--
--   0 withheld before  ->  edit ONE cleared translated row  ->  exactly that
--   row withholds, its sibling language does not, no other row moves  ->
--   roll back  ->  0 withheld after.
--
-- `rollback to savepoint` is not a plpgsql statement -- 353 aborted on that --
-- so the sub-block's own exception handler IS the savepoint, and variables
-- assigned inside it survive the rollback to carry the evidence out.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  n_rows        int;
  n_null        int;
  n_before      int;
  n_after       int;
  v_id          uuid;
  v_concept     uuid;
  v_lang        text;
  v_sib         text;
  probe_self    int;
  probe_sib     int;
  probe_others  int;
  probe_err     text;
  ok            boolean := false;
begin

  -- ----------------------------------------------- pre-conditions
  select count(*) into n_rows from public.concept_translations;
  if n_rows = 0 then raise exception 'concept_translations is empty'; end if;

  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'translation_hash') then
    raise exception 'public.translation_hash is absent -- 352 has not run';
  end if;

  -- ----------------------------------------------- the column
  alter table public.concept_translations add column if not exists tr_hash text;

  comment on column public.concept_translations.tr_hash is
    'Hash of THIS row name and description, via public.translation_hash. mcp.concept '
    'withholds the row when it no longer matches, so an edit to reviewed translated text '
    're-closes the gate the way an English edit already does. 352 at concept grain.';

  -- BACKFILL FROM CURRENT CONTENT. Every row is stamped with what it holds
  -- right now, so installation changes nothing about what serves.
  update public.concept_translations
     set tr_hash = public.translation_hash(name, description);

  select count(*) into n_null from public.concept_translations where tr_hash is null;
  if n_null <> 0 then
    raise exception '% row(s) carry no tr_hash after the backfill', n_null;
  end if;

  alter table public.concept_translations alter column tr_hash set not null;

  -- ----------------------------------------------- the gate
  -- create or replace keeps security_barrier and every grant. The column list
  -- is unchanged, which is what makes replace legal here -- 325 had to drop
  -- and create because a column moved.
  create or replace view mcp.concept
  with (security_barrier = true) as
  select c.code as certification,
         lg.language,
         co.slug,
         coalesce(ct.name, co.name) as name,
         coalesce(ct.description, co.description) as description,
         ct.description is null as description_is_fallback,
         (select array_agg(t.code order by t.code)
            from public.task_concepts tc
            join public.tasks t on t.id = tc.task_id
           where tc.concept_id = co.id) as task_codes
    from public.concepts co
    join public.certifications c on c.id = co.certification_id
    cross join (values ('en'::text), ('es-419'::text), ('pt-BR'::text)) lg(language)
    left join public.concept_translations ct
           on ct.concept_id = co.id
          and ct.language = lg.language
          and ct.is_provisional = false
          and ct.en_hash = public.concept_row_en_hash(co.id)
          and ct.tr_hash = public.translation_hash(ct.name, ct.description)
   where c.code = any ('{AISM-I,AIE-I,AIHR-I,AIGRM-I,SM-AI-I,SM-AI-II,SPO-AI-I,SD-AI-I,ISMS-F,AIMS-F,AIMS-IA,ISMS-IA}'::text[])
     and co.retired_at is null;

  -- ===================== PHASE 1: NOTHING MOVED =====================
  select count(*) into n_before
    from mcp.concept where language <> 'en' and not description_is_fallback;
  if n_before = 0 then
    raise exception 'no translated concept row serves at all -- the probe below cannot fire';
  end if;

  select count(*) into n_null
    from public.concept_translations ct
   where ct.is_provisional = false
     and ct.tr_hash is distinct from public.translation_hash(ct.name, ct.description);
  if n_null <> 0 then
    raise exception 'the gate withholds % cleared row(s) on installation -- the backfill is wrong', n_null;
  end if;
  raise notice 'phase 1 -- % translated row(s) serve, 0 withheld by the new predicate', n_before;

  -- ===================== PHASE 2: IT FIRES, AND ONLY THERE =====================
  -- A concept whose TWO languages both serve, so the sibling test is real.
  select ct.id, ct.concept_id, ct.language into v_id, v_concept, v_lang
    from public.concept_translations ct
    join public.concepts co on co.id = ct.concept_id
   where ct.is_provisional = false
     and ct.en_hash = public.concept_row_en_hash(co.id)
     and ct.tr_hash = public.translation_hash(ct.name, ct.description)
     and (select count(*) from public.concept_translations s
           where s.concept_id = ct.concept_id and s.is_provisional = false) = 2
   order by ct.id limit 1;
  if v_id is null then
    raise exception 'no concept has two serving translations -- the sibling test cannot fire';
  end if;
  v_sib := case when v_lang = 'es-419' then 'pt-BR' else 'es-419' end;

  begin
    update public.concept_translations
       set description = coalesce(description, '') || ' PROBE'
     where id = v_id;

    select count(*) into probe_self
      from mcp.concept m
      join public.concepts co on co.slug = m.slug
      join public.certifications cc on cc.id = co.certification_id and cc.code = m.certification
     where co.id = v_concept and m.language = v_lang and m.description_is_fallback;

    select count(*) into probe_sib
      from mcp.concept m
      join public.concepts co on co.slug = m.slug
      join public.certifications cc on cc.id = co.certification_id and cc.code = m.certification
     where co.id = v_concept and m.language = v_sib and not m.description_is_fallback;

    select n_before - count(*) into probe_others
      from mcp.concept where language <> 'en' and not description_is_fallback;

    raise exception 'probe rollback' using errcode = 'ZZ999';
  exception
    when sqlstate 'ZZ999' then ok := true;
    when others then probe_err := sqlerrm;
  end;

  if probe_err is not null then
    raise exception 'the gate probe failed: %', probe_err;
  end if;
  if not ok then
    raise exception 'the probe did not roll back -- refusing to leave a probe write behind';
  end if;
  if probe_self <> 1 then
    raise exception 'editing one translated row withheld % row(s) of its own language, expected 1', probe_self;
  end if;
  if probe_sib <> 1 then
    raise exception 'the sibling language stopped serving -- this gate must be PER ROW, not per concept';
  end if;
  if probe_others <> 1 then
    raise exception 'one row edit changed the served set by % row(s), expected exactly 1', probe_others;
  end if;
  raise notice 'phase 2 -- one translated edit withheld exactly 1 row; its sibling language kept serving';

  -- ===================== PHASE 3: THE ROLLBACK HELD =====================
  select count(*) into n_after
    from mcp.concept where language <> 'en' and not description_is_fallback;
  if n_after <> n_before then
    raise exception 'the probe edit survived its rollback: % serving now, % before', n_after, n_before;
  end if;
  select count(*) into n_null
    from public.concept_translations where description like '% PROBE';
  if n_null <> 0 then
    raise exception '% row(s) still carry the probe text', n_null;
  end if;
  raise notice 'phase 3 -- % translated row(s) serve, unchanged, and no probe text survives', n_after;

  -- ===================== NEGATIVE: THE OTHER HALF STILL WORKS ==============
  -- Adding a predicate must not have loosened the one beside it.
  if exists (
    select 1 from public.concept_translations ct
      join public.concepts co on co.id = ct.concept_id
     where ct.is_provisional = false
       and ct.en_hash is distinct from public.concept_row_en_hash(co.id)
       and exists (select 1 from mcp.concept m
                    join public.certifications cc on cc.code = m.certification
                   where m.slug = co.slug and m.language = ct.language
                     and cc.id = co.certification_id and not m.description_is_fallback)) then
    raise exception 'a row with a stale en_hash is serving -- the 359 predicate was weakened';
  end if;

  raise notice '364 ok: tr_hash live at concept grain; en_hash unchanged; 0 rows withheld by installation';
end
$mig$;
