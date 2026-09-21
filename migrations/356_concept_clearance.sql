-- 356_concept_clearance.sql
--
-- The 2026-09-21 concept-translation clearance: 18 draws cleared, 2 held,
-- 4 blocked. And the review table that records what each clearance rests on.
--
-- ============ THE REVIEW IS PER DRAW, NOT PER ROW ============
--
-- `lesson_translation_reviews` and `task_translation_reviews` key on one row
-- because one row was read. THIS CLEARANCE READ 20 ROWS AND CLEARS 2,586, so a
-- per-row review row would assert of 2,566 rows a thing nobody did.
--
-- So the grain is (certification, language) -- the draw -- and the row carries
-- the seed, the sample size, the population and the verbatim claim wording. A
-- reader of any single row can tell what it rests on without finding this file.
--
-- ============ THE CLAIM WORDING IS CARRIED, NOT SUMMARISED ============
--
-- Stored verbatim from CLEARANCE-PLAN.json, and it forbids the summary that
-- would otherwise get written: draws ranged from 9 percent of AISM-I to 43
-- percent of AIE-I, so "8 percent of the corpus" is a number that describes no
-- decision anyone made. It is a column rather than a comment because a comment
-- does not travel with the row someone quotes.
--
-- ============ AIMS-F IS HELD AND THE SAMPLE WAS CLEAN ============
--
-- Both AIMS-F draws returned ZERO translation defects. They are held anyway.
--
-- Census run before this migration, and it is the whole reason:
--
--     AIMS-F concept descriptions          154 of 154 are `<name>` + a fixed
--                                          tail, byte-exact. ZERO real ones.
--     every other certification            largest shared 45-char suffix
--                                          group is 1 or 2 rows
--     AIMS-F tasks knowledge/skills/abil.  35 of 35 populated, avg 655 chars
--     AIMS-F English lessons               35, avg 13,696 chars
--     AIMS-F English items                 631
--
-- THE CONCEPT LAYER IS THE ONLY HOLLOW ONE, and the translations are faithful
-- renderings of a stub. Clearing them would put review provenance behind text
-- that teaches nothing -- an approval that means "somebody checked" attached to
-- 154 placeholders. The held rows exist so the next person cannot clear AIMS-F
-- by looking at a clean sample, because the sample IS clean. That is the trap.
--
-- ============ WHAT THE HASHES GATE ============
--
-- en_hash over the certification's English concepts and tr_hash over that
-- language's translations, both named once as functions so the review and any
-- future gate cannot disagree -- 350's argument. An edit to either side moves
-- its hash and the review goes stale on its own, which is 352's design applied
-- at draw grain.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  v_claim constant text := 'Approved on a sample of 20 rows per certification per language (480 of 3460 read). NOT a full read, and NOT a uniform percentage: draws ranged from 9% (AISM-I, 20 of 226) to 43% (AIE-I, 20 of 47) of a certification. Never state this clearance as a percentage of the corpus.';
  v_seed  constant text := '2026-09-20-concepts';
  v_on    constant date := '2026-09-21';
  v_by    constant text := 'claude-director';
  rec        record;
  n_rows     int;
  n_cleared  int;
  n_draws    int;
  n_bad      int;
  frozen_before text;
  frozen_after  text;
begin

  -- ----------------------------------------------- pre-conditions
  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'concept_translations') then
    raise exception 'public.concept_translations does not exist -- 355 has not run';
  end if;
  select count(*) into n_rows from public.concept_translations;
  if n_rows = 0 then
    raise exception 'concept_translations is empty -- nothing to clear';
  end if;
  select count(*) into n_bad from public.concept_translations where not is_provisional;
  if n_bad <> 0 then
    raise exception '% row(s) are already non-provisional -- a clearance has run', n_bad
      using hint = 'This migration assumes it is the first. Re-diagnose before re-running.';
  end if;

  -- ----------------------------------------------- the hashes, named once
  create or replace function public.concept_en_hash(p_cert text)
  returns text language sql stable security definer set search_path = ''
  as $fn$
    select left(md5(coalesce(string_agg(
             cp.slug || '|' || replace(coalesce(cp.name, ''), chr(13), '') ||
             '|' || replace(coalesce(cp.description, ''), chr(13), ''),
             chr(10) order by cp.slug), '')), 16)
      from public.concepts cp
      join public.certifications c on c.id = cp.certification_id
     where c.code = p_cert
  $fn$;

  create or replace function public.concept_tr_hash(p_cert text, p_lang text)
  returns text language sql stable security definer set search_path = ''
  as $fn$
    select left(md5(coalesce(string_agg(
             cp.slug || '|' || replace(coalesce(ct.name, ''), chr(13), '') ||
             '|' || replace(coalesce(ct.description, ''), chr(13), ''),
             chr(10) order by cp.slug), '')), 16)
      from public.concept_translations ct
      join public.concepts cp on cp.id = ct.concept_id
      join public.certifications c on c.id = cp.certification_id
     where c.code = p_cert and ct.language = p_lang
  $fn$;

  comment on function public.concept_en_hash(text) is
    'Hash of a certification''s English concept name+description set. A review keyed on it goes stale when any English concept moves. Named once so the review and any future gate cannot disagree.';
  comment on function public.concept_tr_hash(text, text) is
    'Hash of a certification+language translated concept set. The translation-side half of the gate, 352''s design at draw grain.';

  revoke all on function public.concept_en_hash(text) from public;
  revoke all on function public.concept_tr_hash(text, text) from public;
  grant execute on function public.concept_en_hash(text) to service_role;
  grant execute on function public.concept_tr_hash(text, text) to service_role;

  -- ----------------------------------------------- the review table
  create table if not exists public.concept_translation_reviews (
    id               uuid primary key default gen_random_uuid(),
    certification    text not null,
    language         text not null,
    verdict          text not null,
    seed             text,
    sample_size      int,
    population       int,
    reviewed_on      date not null,
    reviewed_by      text not null,
    en_hash          text not null,
    tr_hash          text not null,
    source_gate_ran  boolean not null default false,
    clearance_claim  text,
    blocking_slugs   text,
    note             text,
    created_at       timestamptz not null default now(),
    constraint ctr_verdict_chk check (verdict in ('approved', 'held', 'blocked', 'rejected')),
    constraint ctr_lang_chk    check (language in ('es-419', 'pt-BR')),
    -- One verdict per draw per review date. A second run of this migration is
    -- already refused by the pre-condition; this refuses a duplicate written
    -- any other way, so a draw can never carry two verdicts for one day.
    constraint ctr_one_per_draw_per_day unique (certification, language, reviewed_on)
  );

  comment on table public.concept_translation_reviews is
    'One row per (certification, language) DRAW, not per translated row. 20 rows were read and 2,586 cleared, so a per-row review would assert of 2,566 rows a thing nobody did. clearance_claim carries the wording verbatim; source_gate_ran records whether the English was checked for adequacy before translation, which is the check AIMS-F did not get.';
  comment on column public.concept_translation_reviews.source_gate_ran is
    'FALSE for every row written by 356: no source-adequacy gate existed when these were translated. That is why AIMS-F shipped 154 stubs into two languages.';

  grant select, insert, update on public.concept_translation_reviews to service_role;

  -- ----------------------------------------------- the verdicts
  -- SOURCE_GATE_RAN IS FALSE ON ALL 24. No source-adequacy check existed when
  -- these were translated; recording it as true anywhere would be the review
  -- table's first lie.
  for rec in select * from (values
    ('AIE-I', 'es-419', 'approved', NULL, NULL),
    ('AIGRM-I', 'es-419', 'approved', NULL, NULL),
    ('AIGRM-I', 'pt-BR', 'approved', NULL, NULL),
    ('AIHR-I', 'es-419', 'approved', NULL, NULL),
    ('AIHR-I', 'pt-BR', 'approved', NULL, NULL),
    ('AIMS-IA', 'es-419', 'approved', NULL, NULL),
    ('AISM-I', 'es-419', 'approved', NULL, NULL),
    ('AISM-I', 'pt-BR', 'approved', NULL, NULL),
    ('ISMS-F', 'pt-BR', 'approved', NULL, NULL),
    ('ISMS-IA', 'pt-BR', 'approved', NULL, NULL),
    ('SD-AI-I', 'es-419', 'approved', NULL, NULL),
    ('SD-AI-I', 'pt-BR', 'approved', NULL, NULL),
    ('SM-AI-I', 'es-419', 'approved', NULL, NULL),
    ('SM-AI-I', 'pt-BR', 'approved', NULL, NULL),
    ('SM-AI-II', 'es-419', 'approved', NULL, NULL),
    ('SM-AI-II', 'pt-BR', 'approved', NULL, NULL),
    ('SPO-AI-I', 'es-419', 'approved', NULL, NULL),
    ('SPO-AI-I', 'pt-BR', 'approved', NULL, NULL),
    ('AIMS-F', 'es-419', 'held', 'HELD: English source descriptions are placeholder boilerplate. Translation is faithful to a stub. Clearing would put review provenance behind text that teaches nothing.', NULL),
    ('AIMS-F', 'pt-BR', 'held', 'HELD: English source descriptions are placeholder boilerplate. Translation is faithful to a stub. Clearing would put review provenance behind text that teaches nothing.', NULL),
    ('AIE-I', 'pt-BR', 'blocked', 'genai-limitations: ''quotations'' rendered ''transcricoes'' (transcriptions). Wrong referent: the model invents fake QUOTES, not transcripts. The es-419 draw of the same concept says ''textos citados'' correctly.', 'genai-limitations'),
    ('AIMS-IA', 'pt-BR', 'blocked', 'aia-ai-policy-requirements: ''Este e um requisito de Secao'' - mechanical clause->Secao substitution landed on a generic use of ''clause''. The concept exists to contrast a CLAUSE requirement (mandatory) with an Annex A control (selected); that contrast is destroyed. Suggest: ''Este e um requisito das secoes normativas e se aplica independentemente de o controle A.2.2 ser ou nao selecionado.''', 'aia-ai-policy-requirements'),
    ('ISMS-F', 'es-419', 'blocked', 'risk-acceptance-criteria: ''los umbrales A PARTIR DE LOS CUALES un riesgo puede retenerse'' states the inverse. Acceptance criteria define the level at or BELOW which a risk may be retained; ''a partir de'' means from the threshold upward. Suggest: ''los umbrales dentro de los cuales''.', 'risk-acceptance-criteria'),
    ('ISMS-IA', 'es-419', 'blocked', 'ia-awareness-clause-7-3: ''las implicaciones de LA NO CONFORMIDAD'' collapses the English ''not conforming'' (the act) into the ISO defined term nonconformity (the finding). In an auditor certification that distinction is examinable. The pt-BR draw of this same concept renders it correctly as ''nao estar em conformidade''. Suggest: ''las implicaciones de no cumplir los requisitos''.', 'ia-awareness-clause-7-3')
  ) as v(cert, lang, verdict, note, slugs)
  loop
    insert into public.concept_translation_reviews
      (certification, language, verdict, seed, sample_size, population,
       reviewed_on, reviewed_by, en_hash, tr_hash, source_gate_ran,
       clearance_claim, blocking_slugs, note)
    select rec.cert, rec.lang, rec.verdict, v_seed, 20,
           (select count(*) from public.concept_translations ct
              join public.concepts cp on cp.id = ct.concept_id
              join public.certifications c on c.id = cp.certification_id
             where c.code = rec.cert and ct.language = rec.lang),
           v_on, v_by,
           public.concept_en_hash(rec.cert),
           public.concept_tr_hash(rec.cert, rec.lang),
           false,
           v_claim, rec.slugs, rec.note;
  end loop;

  -- ----------------------------------------------- what must not move
  -- A CHECKSUM OF EVERY ROW THIS IS NOT AUTHORISED TO CLEAR, captured before
  -- and compared after. Four migrations have aborted against a correct
  -- database on a hardcoded count -- 328's expected 4, 345's 12637, 351's 13,
  -- 352's 98. This carries no number.

  select md5(coalesce(string_agg(
           ct.concept_id::text || ':' || ct.language || ':' || ct.is_provisional::text,
           ',' order by ct.concept_id, ct.language), ''))
    into frozen_before
    from public.concept_translations ct
    join public.concepts cp on cp.id = ct.concept_id
    join public.certifications c on c.id = cp.certification_id
   where not exists (
     select 1 from public.concept_translation_reviews r
      where r.verdict = 'approved' and r.certification = c.code and r.language = ct.language
   );

  -- ----------------------------------------------- the clearance
  update public.concept_translations ct
     set is_provisional = false, review_status = 'approved'
    from public.concepts cp, public.certifications c, public.concept_translation_reviews r
   where cp.id = ct.concept_id
     and c.id = cp.certification_id
     and r.verdict = 'approved'
     and r.certification = c.code
     and r.language = ct.language;
  get diagnostics n_cleared = row_count;

  -- ===================== POST-CONDITIONS =====================

  -- 1. EVERY DRAW HAS A ROW, and the count comes from the data rather than a
  --    literal: 12 certifications x 2 languages, derived.
  select count(*) into n_draws from public.concept_translation_reviews;
  select count(*) into n_bad
    from (select distinct c.code, ct.language
            from public.concept_translations ct
            join public.concepts cp on cp.id = ct.concept_id
            join public.certifications c on c.id = cp.certification_id) t
   where not exists (
     select 1 from public.concept_translation_reviews r
      where r.certification = t.code and r.language = t.language);
  if n_bad <> 0 then
    raise exception '% (certification, language) pair(s) have no review row', n_bad;
  end if;

  -- 2. NEGATIVE, AND IT IS THE ONE THE AUTHORISATION WAS ABOUT. Every row not
  --    in an approved draw is byte-identical to before. A clearance keyed on a
  --    verdict string rather than a join would have cleared everything and
  --    still passed a count check.
  select md5(coalesce(string_agg(
           ct.concept_id::text || ':' || ct.language || ':' || ct.is_provisional::text,
           ',' order by ct.concept_id, ct.language), ''))
    into frozen_after
    from public.concept_translations ct
    join public.concepts cp on cp.id = ct.concept_id
    join public.certifications c on c.id = cp.certification_id
   where not exists (
     select 1 from public.concept_translation_reviews r
      where r.verdict = 'approved' and r.certification = c.code and r.language = ct.language
   );
  if frozen_before is distinct from frozen_after then
    raise exception 'a row outside an approved draw changed'
      using detail = 'Held and blocked draws must stay provisional. Inspect before re-running.';
  end if;

  -- 3. POSITIVE. Every approved draw is fully cleared and nothing in it is left
  --    provisional -- the other direction of check 2.
  select count(*) into n_bad
    from public.concept_translations ct
    join public.concepts cp on cp.id = ct.concept_id
    join public.certifications c on c.id = cp.certification_id
    join public.concept_translation_reviews r
      on r.certification = c.code and r.language = ct.language and r.verdict = 'approved'
   where ct.is_provisional;
  if n_bad <> 0 then
    raise exception '% row(s) in an approved draw are still provisional', n_bad;
  end if;

  -- 4. NEGATIVE, NAMED. AIMS-F stays wholly provisional in both languages. It
  --    is named because its sample was CLEAN and it is the row a future reader
  --    is most likely to clear by mistake.
  select count(*) into n_bad
    from public.concept_translations ct
    join public.concepts cp on cp.id = ct.concept_id
    join public.certifications c on c.id = cp.certification_id
   where c.code = 'AIMS-F' and not ct.is_provisional;
  if n_bad <> 0 then
    raise exception '% AIMS-F row(s) were cleared -- the source is 154 stubs', n_bad;
  end if;
  if not exists (select 1 from public.concept_translation_reviews
                  where certification = 'AIMS-F' and verdict = 'held') then
    raise exception 'AIMS-F has no held review row -- the reason would be lost';
  end if;

  -- 5. NEGATIVE. The four blocked draws stay provisional and each names its
  --    blocking slug, or the block is an assertion with no evidence.
  select count(*) into n_bad
    from public.concept_translation_reviews
   where verdict = 'blocked' and coalesce(blocking_slugs, '') = '';
  if n_bad <> 0 then
    raise exception '% blocked draw(s) name no blocking slug', n_bad;
  end if;

  -- 6. THE CLAIM WORDING IS PRESENT ON EVERY APPROVED ROW AND SAYS WHAT IT
  --    MUST. A clearance whose wording went missing is one someone will restate
  --    as a percentage.
  select count(*) into n_bad
    from public.concept_translation_reviews
   where verdict = 'approved'
     and (clearance_claim is null or clearance_claim not like '%NOT a full read%');
  if n_bad <> 0 then
    raise exception '% approved row(s) carry no usable clearance claim', n_bad;
  end if;

  -- 7. AS mcp_reader, BECAUSE 339 ASSERTED A VIEW PROPERTY AS SUPERUSER AND
  --    TOOK explain_task DOWN IN TWO LANGUAGES FOR TWO HOURS. The view must
  --    now serve a translation for a cleared draw and still fall back for a
  --    held one -- both directions, through the grant the caller actually uses.
  execute 'set local role mcp_reader';
  select count(*) into n_bad
    from mcp.concept
   where certification = 'SPO-AI-I' and language = 'es-419' and description_is_fallback;
  execute 'reset role';
  if n_bad <> 0 then
    raise exception '% SPO-AI-I es-419 concept(s) still fall back after clearance', n_bad;
  end if;

  execute 'set local role mcp_reader';
  select count(*) into n_bad
    from mcp.concept
   where certification = 'AIMS-F' and language = 'es-419' and not description_is_fallback;
  execute 'reset role';
  if n_bad <> 0 then
    raise exception '% AIMS-F es-419 concept(s) are being served -- AIMS-F is held', n_bad;
  end if;

  raise notice '356 ok: % draw(s) recorded, % row(s) cleared', n_draws, n_cleared;
  raise notice 'AIMS-F held in both languages: 154 of 154 English descriptions are stubs.';
  raise notice 'source_gate_ran is FALSE on all % row(s) -- no such gate existed.', n_draws;
end
$mig$;
