-- 362_security_control_is_not_a_glossary.sql
--
-- ISMS-F `security-control` read, in full:
--
--     a measure that modifies risk
--
-- That is the harmonised definition of `control`, near-verbatim, live and
-- served to unauthenticated callers over MCP at contractVersion 2. It is
-- replaced with a teaching line.
--
-- ============ THE LEAK GATE SCORED IT ZERO, AND WAS RIGHT TO ============
--
-- scan-iso-leaks seeds at 5 words and refuses at 10, both chosen for lesson
-- bodies of thousands of words. This description is FIVE WORDS. No threshold
-- in that instrument can refuse it.
--
-- AND A PURPOSE-BUILT INSTRUMENT ALSO SCORES IT ZERO, which is the sharper
-- half. ISO/IEC 42001:2023 clause 3.21 IS on disk and DOES define the term:
--
--     control   <risk> measure that MAINTAINS AND/OR modifies risk
--
-- The gloss copied the older ISO/IEC 27000:2018 wording. Three inserted words,
-- and no n-gram of the held edition matches. So the scanner reports 0 against
-- a document it HAS INDEXED -- the blindness is not only sources we do not
-- hold, it is also an edition variant of a source we do.
--
-- A one-line description of a DEFINED TERM must say something the definition
-- does not: the consequence, the distinction, or what a practitioner does with
-- it. A description that could serve as a glossary gloss has failed even at a
-- score of 0, because at this length no gate can see the category.
--
-- The replacement names the decision that produces a control and the test
-- applied to one. It scores 0w/24, coverage 0.00, no run at all.
--
-- ============ THIS WITHHOLDS TWO TRANSLATIONS, DELIBERATELY ============
--
-- 359 keyed concept_translations.en_hash to concept_row_en_hash(concept_id).
-- Changing the English moves that hash, so the two stale renderings --
--   es-419  "una medida que modifica el riesgo"
--   pt-BR   "uma medida que modifica o risco"
-- -- stop matching and fall back to English. Both are already
-- is_provisional = true and therefore were not serving, so nothing a caller
-- sees changes today. Post-condition 3 asserts the gate closed anyway, because
-- "it was already closed" is not the same claim as "this change closes it".
--
-- Note for whoever retranslates them: those two rows are themselves the ISO
-- definition in Spanish and Portuguese, and our index holds only the English
-- editions, so no instrument here could ever have flagged them.
--
-- SIBLINGS ARE NOT TOUCHED. scripts/list-defined-term-glosses.mjs enumerates
-- 23 tier-A and 16 tier-B candidates across nine certifications; that list is a
-- human read, not a sweep, and this migration changes exactly one row.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  v_id        uuid;
  v_cert      uuid;
  v_before    text;
  v_after     text;
  v_rest_b    text;
  v_rest_a    text;
  n           int;
  k_new constant text :=
    'An answer to a risk the organization chose not to accept; judged by whether the risk moved, not by whether the control is present.';
begin

  select c.id into v_cert from public.certifications c where c.code = 'ISMS-F';
  if v_cert is null then raise exception 'ISMS-F not found'; end if;

  select cn.id, cn.description into v_id, v_before
    from public.concepts cn
   where cn.certification_id = v_cert and cn.slug = 'security-control' and cn.retired_at is null;
  if v_id is null then raise exception 'ISMS-F security-control not found or retired'; end if;

  -- ----------------------------------------------- pre-condition
  -- THE GLOSS MUST STILL BE THERE. If someone already fixed it, this migration
  -- is operating on a different database than the one measured, and it must
  -- not overwrite their wording with mine.
  if btrim(v_before) <> 'a measure that modifies risk' then
    raise exception 'security-control does not hold the measured text'
      using detail = 'found: ' || coalesce(v_before, '<null>'),
            hint   = 'Someone has already edited this row. Read it before rerunning.';
  end if;

  -- CHECKSUM of the rows this migration is NOT authorised to change, captured
  -- before. No count and no literal: a count passes on two rows swapping
  -- values, and a literal goes stale the moment anyone writes a concept.
  select md5(string_agg(cn.slug || '|' || cn.name || '|' || coalesce(cn.description, ''), '~' order by cn.slug))
    into v_rest_b
    from public.concepts cn
   where cn.certification_id = v_cert and cn.id <> v_id;

  -- ----------------------------------------------- the change
  update public.concepts set description = k_new where id = v_id;

  -- ===================== POST-CONDITIONS =====================

  -- 1. POSITIVE. The row says what it was told to say.
  select cn.description into v_after from public.concepts cn where cn.id = v_id;
  if v_after is distinct from k_new then
    raise exception 'security-control did not take the new text';
  end if;

  -- 2. NEGATIVE. The retired wording is gone from this row entirely, rather
  --    than merely being no longer the whole of it.
  if v_after ilike '%measure that modifies risk%' then
    raise exception 'the retired gloss survives inside the new description';
  end if;

  -- 3. NEGATIVE, AND THE ONE WORTH ASSERTING. The two stale translations must
  --    now fail the 359 gate. Asserted in BOTH directions: the rows must still
  --    exist (a delete would also satisfy "cannot serve", and would be a
  --    different and worse outcome), and none may match the live hash.
  select count(*) into n from public.concept_translations ct where ct.concept_id = v_id;
  if n <> 2 then
    raise exception 'expected the two translation rows to survive, found %', n;
  end if;
  select count(*) into n
    from public.concept_translations ct
   where ct.concept_id = v_id and ct.en_hash = public.concept_row_en_hash(v_id);
  if n <> 0 then
    raise exception '% stale translation(s) still pass the en_hash gate', n;
  end if;

  -- 4. NEGATIVE. Every other ISMS-F concept is byte-identical to before.
  select md5(string_agg(cn.slug || '|' || cn.name || '|' || coalesce(cn.description, ''), '~' order by cn.slug))
    into v_rest_a
    from public.concepts cn
   where cn.certification_id = v_cert and cn.id <> v_id;
  if v_rest_a is distinct from v_rest_b then
    raise exception 'another ISMS-F concept changed'
      using detail = 'This migration is authorised to touch exactly one row.';
  end if;

  raise notice '362 ok: security-control is a teaching line; 2 translations withheld pending retranslation';
end
$mig$;
