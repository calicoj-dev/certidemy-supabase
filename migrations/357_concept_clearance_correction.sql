-- 357_concept_clearance_correction.sql
--
-- Withdraw two clearances 356 granted. Both are serving a meaning defect.
--
-- ============ WHAT 356 GOT WRONG, AND IT WAS THE REASONING ============
--
-- The reviewer found 4 meaning defects. For 3 of them the same concept also
-- landed in the OTHER language's draw, and all 3 siblings were correct. From
-- that the blocking rule was refined to per-certification+language: a defect
-- looked like a property of one rendering rather than of the English.
--
-- THE 3 OBSERVATIONS WERE THE CONCEPTS THAT HAPPENED TO FALL IN BOTH
-- INDEPENDENT DRAWS. That is not a sample of the question being asked; it is a
-- sample of what the draw overlapped on. A targeted check of all 4 blocking
-- slugs against their sibling language returned 2 HITS. The rate is 2 of 4,
-- not 0 of 3.
--
-- Both draws cleared on that reasoning are serving the defect:
--
--   ISMS-F  / pt-BR   risk-acceptance-criteria
--       "os limiares a partir dos quais um risco pode ser retido" -- the same
--       threshold inversion that blocked es-419. Acceptance criteria define
--       the level at or BELOW which a risk may be retained.
--
--   AIMS-IA / es-419  aia-ai-policy-requirements
--       "Este es un requisito de apartado" -- the same mechanical clause
--       substitution that blocked pt-BR, destroying the same contrast between
--       a normative-clause requirement and a selected Annex A control.
--
-- ============ SUPERSEDED, NOT OVERWRITTEN ============
--
-- The instruction was to update these rows from approved to blocked AND not to
-- delete the superseded rows. An UPDATE in place satisfies the first and
-- defeats the second: it erases that a clearance was ever granted, and the
-- next person finds a blocked draw with no sign anything was withdrawn.
--
-- So the approved rows STAY, marked `superseded_at` with a reason, and the
-- blocked verdict arrives as a new row. 356's unique constraint on
-- (certification, language, reviewed_on) cannot express that -- both verdicts
-- carry the same review date -- so it is replaced by a PARTIAL unique index on
-- (certification, language) WHERE superseded_at IS NULL.
--
-- ONE LIVE VERDICT PER DRAW, EVER, AND A READABLE HISTORY BEHIND IT. The
-- partial index is stronger than what it replaces: the old constraint allowed
-- two live verdicts for one draw on two different dates.
--
-- `found_by` records that the 20-row draw did NOT find these. A blocked row
-- with no provenance reads as though the sample caught it, which would leave
-- the sample looking more capable than it is -- the same defect as a review
-- table with no source_gate_ran column.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  v_on     constant date := '2026-09-21';
  v_by     constant text := 'claude-director';
  rec         record;
  n_bad       int;
  n_super     int;
  n_new       int;
  n_reprov    int;
  frozen_before text;
  frozen_after  text;
begin

  -- ----------------------------------------------- pre-conditions
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'concept_translation_reviews') then
    raise exception 'concept_translation_reviews does not exist -- 356 has not run';
  end if;

  -- The two draws must currently be APPROVED and LIVE, or this is not the
  -- state 357 was written for.
  select count(*) into n_bad
    from public.concept_translation_reviews
   where verdict = 'approved'
     and (certification, language) in (('AIMS-IA', 'es-419'), ('ISMS-F', 'pt-BR'));
  if n_bad <> 2 then
    raise exception 'expected 2 approved draws to withdraw, found %', n_bad
      using hint = 'Re-diagnose. Do not widen this migration.';
  end if;

  -- And their rows must currently be SERVING, which is the harm being undone.
  select count(*) into n_bad
    from public.concept_translations ct
    join public.concepts cp on cp.id = ct.concept_id
    join public.certifications c on c.id = cp.certification_id
   where ((c.code = 'AIMS-IA' and ct.language = 'es-419')
       or (c.code = 'ISMS-F'  and ct.language = 'pt-BR'))
     and not ct.is_provisional;
  if n_bad = 0 then
    raise exception 'neither draw is serving -- already corrected, or the diagnosis is wrong';
  end if;
  raise notice 'before -- % row(s) across the two draws are serving', n_bad;

  -- ----------------------------------------------- columns for provenance
  alter table public.concept_translation_reviews add column if not exists found_by text;
  alter table public.concept_translation_reviews add column if not exists superseded_at timestamptz;
  alter table public.concept_translation_reviews add column if not exists superseded_reason text;

  comment on column public.concept_translation_reviews.found_by is
    'How the defect was found, when not by the sampled draw. NULL means the draw found it. The two rows 357 writes say "targeted sibling check" because the 20-row draw did not see these concepts at all.';
  comment on column public.concept_translation_reviews.superseded_at is
    'Set when a verdict is withdrawn. The row STAYS: a clearance that was granted and withdrawn is a fact about this corpus, and a reader who finds only the later verdict cannot tell that anything was reconsidered.';

  -- ONE LIVE VERDICT PER DRAW, EVER. The constraint 356 wrote keyed on
  -- reviewed_on, so it could not hold two verdicts dated the same day -- and it
  -- permitted two LIVE verdicts dated differently, which is worse.
  alter table public.concept_translation_reviews drop constraint if exists ctr_one_per_draw_per_day;
  drop index if exists ctr_one_live_verdict;
  create unique index ctr_one_live_verdict
    on public.concept_translation_reviews (certification, language)
    where superseded_at is null;

  -- ----------------------------------------------- what must not move
  -- CHECKSUM OVER EVERY ROW THIS IS NOT AUTHORISED TO TOUCH. No literal: four
  -- migrations have aborted against a correct database on a hardcoded count.
  select md5(coalesce(string_agg(
           ct.concept_id::text || ':' || ct.language || ':' || ct.is_provisional::text,
           ',' order by ct.concept_id, ct.language), ''))
    into frozen_before
    from public.concept_translations ct
    join public.concepts cp on cp.id = ct.concept_id
    join public.certifications c on c.id = cp.certification_id
   where not ((c.code = 'AIMS-IA' and ct.language = 'es-419')
           or (c.code = 'ISMS-F'  and ct.language = 'pt-BR'));

  -- ----------------------------------------------- withdraw and re-block
  for rec in select * from (values
    ('AIMS-IA', 'es-419', 'aia-ai-policy-requirements', 'aia-ai-policy-requirements: SIBLING DEFECT, found after clearance. es-419 ''Este es un requisito de apartado'' carries the identical mechanical clause-substitution that blocked pt-BR, destroying the same normative-clause vs selected-control contrast. Not sampled in the es-419 draw. Was cleared and SERVING until re-provisioned.', 'targeted sibling check, not the 20-row draw'),
    ('ISMS-F', 'pt-BR', 'risk-acceptance-criteria', 'risk-acceptance-criteria: SIBLING DEFECT, found after clearance. pt-BR ''os limiares A PARTIR DOS QUAIS um risco pode ser retido'' carries the identical inversion that blocked es-419. Not sampled in the pt-BR draw. Was cleared and SERVING until re-provisioned.', 'targeted sibling check, not the 20-row draw')
  ) as v(cert, lang, slugs, note, found)
  loop
    update public.concept_translation_reviews
       set superseded_at = now(),
           superseded_reason = 'Withdrawn by 357. Cleared on the inference that meaning defects are per-row, drawn from 3 both-languages observations; a targeted sibling check on all 4 blocking slugs returned 2 hits. This draw is one of the 2.'
     where certification = rec.cert and language = rec.lang
       and verdict = 'approved' and superseded_at is null;

    insert into public.concept_translation_reviews
      (certification, language, verdict, seed, sample_size, population,
       reviewed_on, reviewed_by, en_hash, tr_hash, source_gate_ran,
       clearance_claim, blocking_slugs, note, found_by)
    select rec.cert, rec.lang, 'blocked', NULL, NULL,
           (select count(*) from public.concept_translations ct
              join public.concepts cp on cp.id = ct.concept_id
              join public.certifications c on c.id = cp.certification_id
             where c.code = rec.cert and ct.language = rec.lang),
           v_on, v_by,
           public.concept_en_hash(rec.cert),
           public.concept_tr_hash(rec.cert, rec.lang),
           false,
           NULL, rec.slugs, rec.note, rec.found;

    update public.concept_translations ct
       set is_provisional = true, review_status = 'unreviewed'
      from public.concepts cp, public.certifications c
     where cp.id = ct.concept_id
       and c.id = cp.certification_id
       and c.code = rec.cert
       and ct.language = rec.lang;
  end loop;

  -- ===================== POST-CONDITIONS =====================

  -- 1. BOTH CLEARANCES ARE WITHDRAWN AND BOTH WITHDRAWALS ARE VISIBLE. The
  --    count comes from the loop's own subject, not from a literal.
  select count(*) into n_super
    from public.concept_translation_reviews
   where verdict = 'approved' and superseded_at is not null
     and (certification, language) in (('AIMS-IA', 'es-419'), ('ISMS-F', 'pt-BR'));
  select count(*) into n_new
    from public.concept_translation_reviews
   where verdict = 'blocked' and superseded_at is null and found_by is not null;
  if n_super <> n_new then
    raise exception 'withdrew % clearance(s) but wrote % blocked row(s)', n_super, n_new;
  end if;
  if n_super = 0 then
    raise exception 'nothing was withdrawn';
  end if;

  -- 2. POSITIVE. Every row in both draws is provisional again.
  select count(*) into n_reprov
    from public.concept_translations ct
    join public.concepts cp on cp.id = ct.concept_id
    join public.certifications c on c.id = cp.certification_id
   where ((c.code = 'AIMS-IA' and ct.language = 'es-419')
       or (c.code = 'ISMS-F'  and ct.language = 'pt-BR'))
     and not ct.is_provisional;
  if n_reprov <> 0 then
    raise exception '% row(s) in the withdrawn draws are still serving', n_reprov;
  end if;

  -- 3. NEGATIVE, AND IT IS THE HALF THE AUTHORISATION WAS ABOUT. Every row
  --    outside the two draws is byte-identical. A re-provision keyed on a
  --    verdict string rather than on (certification, language) would have
  --    re-provisioned the whole corpus and still passed check 2.
  select md5(coalesce(string_agg(
           ct.concept_id::text || ':' || ct.language || ':' || ct.is_provisional::text,
           ',' order by ct.concept_id, ct.language), ''))
    into frozen_after
    from public.concept_translations ct
    join public.concepts cp on cp.id = ct.concept_id
    join public.certifications c on c.id = cp.certification_id
   where not ((c.code = 'AIMS-IA' and ct.language = 'es-419')
           or (c.code = 'ISMS-F'  and ct.language = 'pt-BR'));
  if frozen_before is distinct from frozen_after then
    raise exception 'a row outside the two withdrawn draws changed'
      using detail = 'The 16 remaining cleared draws and the held/blocked rows must be untouched.';
  end if;

  -- 4. NEGATIVE. No draw carries two live verdicts. The partial index enforces
  --    it; this proves the index is the one in force.
  select count(*) into n_bad
    from (select certification, language, count(*) k
            from public.concept_translation_reviews
           where superseded_at is null
           group by certification, language) t
   where t.k > 1;
  if n_bad <> 0 then
    raise exception '% draw(s) carry more than one live verdict', n_bad;
  end if;

  -- 5. NEGATIVE. A blocked row that does not name its slug is an assertion
  --    with no evidence, and the two new rows must say how they were found.
  select count(*) into n_bad
    from public.concept_translation_reviews
   where verdict = 'blocked' and superseded_at is null
     and coalesce(blocking_slugs, '') = '';
  if n_bad <> 0 then
    raise exception '% live blocked draw(s) name no slug', n_bad;
  end if;

  -- 6. AS mcp_reader, BOTH DIRECTIONS, THROUGH THE VIEW A CALLER USES. 339
  --    asserted a view property as superuser and took explain_task down in two
  --    languages for two hours.
  execute 'set local role mcp_reader';
  select count(*) into n_bad
    from mcp.concept
   where ((certification = 'AIMS-IA' and language = 'es-419')
       or (certification = 'ISMS-F'  and language = 'pt-BR'))
     and not description_is_fallback;
  execute 'reset role';
  if n_bad <> 0 then
    raise exception '% withdrawn row(s) are still served by mcp.concept', n_bad;
  end if;

  execute 'set local role mcp_reader';
  select count(*) into n_bad
    from mcp.concept
   where certification = 'SPO-AI-I' and language = 'es-419' and description_is_fallback;
  execute 'reset role';
  if n_bad <> 0 then
    raise exception 'a still-cleared draw stopped serving (% row(s) fell back)', n_bad
      using detail = 'SPO-AI-I es-419 was not this migration''s business.';
  end if;

  raise notice '357 ok: % clearance(s) withdrawn, % blocked row(s) written, % draw(s) re-provisioned',
    n_super, n_new, n_super;
  raise notice 'The superseded approved rows are KEPT. A withdrawn clearance is a fact about this corpus.';
end
$mig$;
