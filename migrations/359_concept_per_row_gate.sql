-- 359_concept_per_row_gate.sql
--
-- The concept translation gate, at the grain that can actually gate.
--
-- ============ WHAT 356 GOT WRONG ============
--
-- 356 stored en_hash on the REVIEW row, at (certification, language) grain,
-- and nothing read it. Audited 2026-09-21, and the audit is the useful part:
--
--   lesson_translation_reviews.en_hash   WIRED   lesson_body_is_servable()
--                                                reads it; mcp.lesson calls
--                                                that function in its WHERE
--   task_translation_reviews.en_hash     WIRED   task_ksa_is_withheld() reads
--                                                it; mcp.task calls it
--   352's tr_hash                        WIRED   both functions read it
--                                                alongside en_hash
--
--   concept_translation_reviews.en_hash  RECORDED BUT UNREAD
--
-- Zero lesson reviews and zero task reviews carry a moved hash. The pattern
-- works. 356 departed from it by choosing DRAW grain: a hash over an entire
-- certification cannot gate one row, because editing any concept invalidates
-- every translation in that certification. 358 edited 7 concepts and moved the
-- draw hash for 12 draws covering 1,381 serving rows.
--
-- ============ TWO HASHES, TWO JOBS ============
--
--   PER ROW      gates serving. concept_translations.en_hash is the hash of
--                THAT concept's English at translation time. mcp.concept
--                joins on it, so a row whose English has moved simply fails to
--                join and falls back with description_is_fallback true --
--                exactly how is_provisional already behaves.
--
--   PER DRAW     records provenance and gates NOTHING. It stays on the review
--                row as a statement of what was reviewed, and it now includes
--                RETIREMENT MEMBERSHIP, because SPO-AI-I's hash did not move
--                when 358 retired one of its concepts: the hash covered slug,
--                name and description, and retirement touches none of them.
--                A review that claims a set which no longer exists should say
--                so, and now it does.
--
-- ============ THE PROOF IS THE POINT ============
--
-- The backfill takes the English as it stands, so the gate withholds ZERO on
-- its first run. That is correct and it is also indistinguishable from a gate
-- that is not looking.
--
-- The corpus no longer contains a known instance -- the 14 rows 358
-- invalidated were regenerated against the new English and match it. So the
-- proof MANUFACTURES one: edit a concept inside a sub-block, assert exactly
-- its two rows become withheld and nothing else moves, then roll back by
-- raising and assert zero again.
--
-- `rollback to savepoint` is not a plpgsql statement -- 353 aborted on that --
-- so the sub-block's own exception handler is the savepoint, and variable
-- assignments survive it while database changes do not.
--
-- ============ THE COLLISION GUARD, MEASURED BEFORE RECORDING ============
--
-- Jaccard similarity was the wrong instrument. The true positive scores 0.944
-- and the two known false positives score 0.545 and 0.492; a 0.95 threshold
-- MISSES the true positive and 0.90 fires on 70 pairs. A RATIO cannot separate
-- "two words out of 41" from "thirty words out of sixty" when both land near
-- 0.9. The discriminator is the COUNT of differing tokens, not the proportion.
--
--   rule: differing tokens <= 3 AND union >= 30
--
--     ISMS-IA pair as it was before 358   diff  2, union 41   FIRES
--     AIMS-IA aia-clause-4-1 pair         diff 30             no fire
--     AIMS-IA aia-clause-4-3 pair         diff 30             no fire
--     corpus-wide today                                       0 fires
--     the diff<=3 form WITHOUT the union clause             396 fires
--
-- 3 of 3 known pairs correct, 0 false positives, 0 corpus fires. The union
-- clause is what stops it firing on short descriptions that share most of a
-- small vocabulary.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  n_withheld   int;
  n_withheld2  int;
  n_rows       int;
  n_null       int;
  n_bad        int;
  probe_id     uuid;
  probe_rows   int;
  others_moved int;
  ok           boolean;
  probe_err    text;
  served_before text;
  served_inside text;
begin

  -- ----------------------------------------------- pre-conditions
  select count(*) into n_rows from public.concept_translations;
  if n_rows = 0 then raise exception 'concept_translations is empty'; end if;

  -- ----------------------------------------------- the per-row hash
  create or replace function public.concept_row_en_hash(p_concept_id uuid)
  returns text language sql stable security definer set search_path = ''
  as $fn$
    select left(md5(replace(coalesce(cp.name, ''), chr(13), '') || '|' ||
                    replace(coalesce(cp.description, ''), chr(13), '')), 16)
      from public.concepts cp where cp.id = p_concept_id
  $fn$;
  comment on function public.concept_row_en_hash(uuid) is
    'Hash of ONE concept''s English name+description. concept_translations.en_hash stores it at translation time and mcp.concept joins on it, so a translation whose English has moved stops being served. The draw-level concept_en_hash is provenance and gates nothing.';
  revoke all on function public.concept_row_en_hash(uuid) from public;
  grant execute on function public.concept_row_en_hash(uuid) to mcp_reader, mcp_holder, service_role;

  alter table public.concept_translations add column if not exists en_hash text;
  comment on column public.concept_translations.en_hash is
    'The English this row was translated from. Set at translation time; compared by mcp.concept on every read. Backfilled by 359 from the English as it stood, so the gate withholds zero on its first run -- the migration proves it can fire by manufacturing an instance in a rolled-back sub-block.';

  -- ----------------------------------------------- backfill
  -- FROM THE ENGLISH AS IT STANDS. The 14 rows 358 invalidated were already
  -- regenerated against the new English and match it; they stay withheld by
  -- is_provisional pending a human read, which is a different gate doing a
  -- different job.
  update public.concept_translations ct
     set en_hash = public.concept_row_en_hash(ct.concept_id)
   where ct.en_hash is null or ct.en_hash is distinct from public.concept_row_en_hash(ct.concept_id);

  select count(*) into n_null from public.concept_translations where en_hash is null;
  if n_null <> 0 then
    raise exception '% row(s) still carry no en_hash after the backfill', n_null;
  end if;

  -- ----------------------------------------------- the draw hash gains retirement
  -- PROVENANCE ONLY. Nothing joins on this. Including retired_at means a
  -- review that claims a set which no longer exists stops matching, which is
  -- what SPO-AI-I needed: 358 retired one of its concepts and its hash did not
  -- move, because the hash covered slug, name and description.
  create or replace function public.concept_en_hash(p_cert text)
  returns text language sql stable security definer set search_path = ''
  as $fn$
    select left(md5(coalesce(string_agg(
             cp.slug || '|' || replace(coalesce(cp.name, ''), chr(13), '') ||
             '|' || replace(coalesce(cp.description, ''), chr(13), '') ||
             '|' || (cp.retired_at is not null)::text,
             chr(10) order by cp.slug), '')), 16)
      from public.concepts cp
      join public.certifications c on c.id = cp.certification_id
     where c.code = p_cert
  $fn$;
  comment on function public.concept_en_hash(text) is
    'PROVENANCE ONLY -- nothing joins on this. A statement of which English set a draw was reviewed against, including RETIREMENT MEMBERSHIP since 359: retiring a concept changes the set a review claims, and before 359 that was invisible. The gate that actually withholds is concept_row_en_hash, per row.';

  -- ----------------------------------------------- the view
  execute format($ddl$
    create or replace view mcp.concept
    with (security_barrier = true) as
    select c.code as certification,
           lg.language,
           co.slug,
           coalesce(ct.name, co.name) as name,
           coalesce(ct.description, co.description) as description,
           ct.description is null as description_is_fallback,
           ( select array_agg(t.code order by t.code)
               from public.task_concepts tc
               join public.tasks t on t.id = tc.task_id
              where tc.concept_id = co.id ) as task_codes
      from public.concepts co
      join public.certifications c on c.id = co.certification_id
      cross join (values ('en'), ('es-419'), ('pt-BR')) as lg(language)
      left join public.concept_translations ct
        on ct.concept_id = co.id
       and ct.language = lg.language
       and ct.is_provisional = false
       and ct.en_hash = public.concept_row_en_hash(co.id)
     where c.code = any (%L::text[])
       and co.retired_at is null
  $ddl$, array['AISM-I','AIE-I','AIHR-I','AIGRM-I','SM-AI-I','SM-AI-II',
               'SPO-AI-I','SD-AI-I','ISMS-F','AIMS-F','AIMS-IA','ISMS-IA']);

  execute 'comment on view mcp.concept is ' || quote_literal(
    'The concepts this MCP serves. A translation is served only when it is cleared (is_provisional false) AND its stored en_hash still matches the concept''s current English -- 359. A row failing either falls back to English with description_is_fallback true. Retired concepts are excluded.');
  execute 'grant select on mcp.concept to mcp_reader, mcp_holder';

  -- ===================== POST-CONDITIONS =====================

  -- 1. BEFORE ANY EDIT: THE GATE WITHHOLDS ZERO. If it withholds anything the
  --    backfill is wrong, and this aborts rather than shipping a gate that
  --    withholds correct rows.
  select count(*) into n_withheld
    from public.concept_translations ct
    join public.concepts cp on cp.id = ct.concept_id
   where not ct.is_provisional
     and ct.en_hash is distinct from public.concept_row_en_hash(cp.id);
  if n_withheld <> 0 then
    raise exception 'the gate withholds % row(s) before any edit -- the backfill is wrong', n_withheld;
  end if;

  -- 2. CAPTURE THE SERVED SET, so "nothing else moved" is a comparison rather
  --    than a count.
  execute 'set local role mcp_reader';
  select md5(coalesce(string_agg(certification || '/' || slug || '/' || language || '/' ||
                                 description_is_fallback::text,
                                 ',' order by certification, slug, language), ''))
    into served_before from mcp.concept;
  execute 'reset role';

  -- 3. THE KNOWN INSTANCE, MANUFACTURED. A gate that only ever reports zero is
  --    indistinguishable from one that is not looking, and the corpus no
  --    longer holds an invalid row. Pick a concept whose translations are
  --    actually SERVING -- editing a provisional one proves nothing, because
  --    is_provisional already withholds it.
  select cp.id into probe_id
    from public.concepts cp
    join public.concept_translations ct on ct.concept_id = cp.id
   where cp.retired_at is null and not ct.is_provisional
   group by cp.id having count(*) = 2
   order by cp.id limit 1;
  if probe_id is null then
    raise exception 'no concept has two serving translations -- the probe cannot fire';
  end if;

  begin
    update public.concepts
       set description = coalesce(description, '') || ' PROBE 359'
     where id = probe_id;

    select count(*) into probe_rows
      from public.concept_translations ct
      join public.concepts cp on cp.id = ct.concept_id
     where not ct.is_provisional
       and ct.en_hash is distinct from public.concept_row_en_hash(cp.id);

    execute 'set local role mcp_reader';
    select md5(coalesce(string_agg(certification || '/' || slug || '/' || language || '/' ||
                                   description_is_fallback::text,
                                   ',' order by certification, slug, language), ''))
      into served_inside from mcp.concept;
    execute 'reset role';

    -- how many rows OTHER than the probe's changed servability
    select count(*) into others_moved
      from public.concept_translations ct
      join public.concepts cp on cp.id = ct.concept_id
     where cp.id <> probe_id
       and not ct.is_provisional
       and ct.en_hash is distinct from public.concept_row_en_hash(cp.id);

    raise exception 'probe rollback' using errcode = 'ZZ999';
  exception
    when sqlstate 'ZZ999' then ok := true;
    when others then ok := false; probe_err := sqlstate || ' ' || sqlerrm;
  end;
  if not ok then
    raise exception 'the gate probe failed: %', probe_err
      using detail = 'The gate could not be exercised, so this migration cannot show it fires.';
  end if;

  -- 4. EXACTLY THE PROBE'S TWO ROWS WERE WITHHELD.
  if probe_rows <> 2 then
    raise exception 'editing one concept withheld % row(s), expected exactly 2', probe_rows
      using detail = 'The gate is either not firing or firing too widely.';
  end if;
  if others_moved <> 0 then
    raise exception '% row(s) on OTHER concepts were withheld by one concept''s edit', others_moved
      using detail = 'This is the draw-grain defect 356 had, reappearing at row grain.';
  end if;
  if served_inside is not distinct from served_before then
    raise exception 'the served set did not change when a serving concept was edited'
      using detail = 'The view is not joining on en_hash.';
  end if;

  -- 5. AFTER THE ROLLBACK: ZERO AGAIN, and the served set is byte-identical to
  --    what it was before the probe. A sub-block that failed to roll back
  --    would have left a real concept description carrying "PROBE 359".
  select count(*) into n_withheld2
    from public.concept_translations ct
    join public.concepts cp on cp.id = ct.concept_id
   where not ct.is_provisional
     and ct.en_hash is distinct from public.concept_row_en_hash(cp.id);
  if n_withheld2 <> 0 then
    raise exception '% row(s) withheld after the rollback -- the probe write survived', n_withheld2;
  end if;
  if exists (select 1 from public.concepts where description like '%PROBE 359%') then
    raise exception 'the probe edit survived its rollback';
  end if;
  execute 'set local role mcp_reader';
  select md5(coalesce(string_agg(certification || '/' || slug || '/' || language || '/' ||
                                 description_is_fallback::text,
                                 ',' order by certification, slug, language), ''))
    into served_inside from mcp.concept;
  execute 'reset role';
  if served_inside is distinct from served_before then
    raise exception 'the served set did not return to its pre-probe state';
  end if;

  -- 6. THE DRAW HASH NOW SEES RETIREMENT. SPO-AI-I retired a concept in 358
  --    and its recorded hash did not move; with retirement in the hash it must
  --    now differ from what the review stored.
  if exists (select 1 from public.concept_translation_reviews r
              where r.certification = 'SPO-AI-I' and r.superseded_at is null
                and r.en_hash = public.concept_en_hash('SPO-AI-I')) then
    raise exception 'SPO-AI-I''s stored draw hash still matches -- retirement is not in the hash';
  end if;

  -- 7. THE COLLISION GUARD, with the numbers that justified it in the header.
  select count(*) into n_bad from (
    select 1
      from (select cp.certification_id, cp.slug,
                   string_to_array(regexp_replace(lower(regexp_replace(coalesce(cp.description,''),
                     '[^a-z0-9 ]', ' ', 'gi')), '\s+', ' ', 'g'), ' ') as toks
              from public.concepts cp
             where coalesce(cp.description,'') <> '' and cp.retired_at is null) a
      join (select cp.certification_id, cp.slug,
                   string_to_array(regexp_replace(lower(regexp_replace(coalesce(cp.description,''),
                     '[^a-z0-9 ]', ' ', 'gi')), '\s+', ' ', 'g'), ' ') as toks
              from public.concepts cp
             where coalesce(cp.description,'') <> '' and cp.retired_at is null) b
        on a.certification_id = b.certification_id and a.slug < b.slug
     where cardinality(array(select unnest(a.toks) union select unnest(b.toks))) >= 30
       and cardinality(array(select unnest(a.toks) union select unnest(b.toks)))
         - cardinality(array(select unnest(a.toks) intersect select unnest(b.toks))) <= 3) t;
  if n_bad <> 0 then
    raise exception '% near-duplicate description pair(s): differ by <= 3 tokens over >= 30', n_bad;
  end if;

  raise notice '359 ok: per-row gate live, 0 withheld, probe withheld exactly 2 and rolled back';
  raise notice 'Draw hash is provenance only and now includes retirement membership.';
end
$mig$;
