-- 355_concept_translations.sql
--
-- `concept_translations`, and the language dimension on `mcp.concept`.
--
-- ============ WHICH CONVENTION, AND WHY ============
--
-- Two exist here and probing one proves nothing about the other:
--
--   *_translations   module, domain, task    key column `language`
--   *_i18n           certification, cert_categories   key column `lang`
--
-- The split is by FUNCTION, not by age. `*_i18n` holds catalogue and marketing
-- copy with no review workflow. `*_translations` holds curriculum content and
-- carries `is_provisional` and `review_status`. Concepts are curriculum, so
-- this table matches `task_translations` column for column -- the same table
-- whose 98-row KSA pass proved the review shape.
--
-- ============ THE VIEW DRIVES OFF THE CONCEPTS, NOT THE TRANSLATIONS ============
--
-- Same shape as 343, which gave mcp.certification its language dimension:
-- cross join the language list, LEFT join the translation, coalesce onto the
-- English base, and expose a flag saying which was used.
--
-- Driving off the translation table instead would make an untranslated concept
-- VANISH for a Spanish caller. That is the defect this table exists to fix, in
-- a new form: today a Spanish caller gets English with no way to know it, and
-- a translation-driven view would give them nothing with no way to know why.
-- `description_is_fallback` is the whole point.
--
-- ============ A PROVISIONAL TRANSLATION IS NOT SERVED ============
--
-- DECIDED HERE, and it is the one thing this migration adds beyond what was
-- asked for. The view joins only `is_provisional = false`.
--
-- The plan for the 1,403 untouched concepts is: translate, sample per
-- certification, then clear. If the view served rows the moment they landed,
-- every partner would read uncleared machine translation during that window --
-- and the sampling step would be reviewing text that had already shipped.
--
-- It also makes `is_provisional` load-bearing rather than decorative. A column
-- that must stay true to be correct, which nothing reads, is the trap CLAUDE.md
-- records against `issuers.mcp_scopes`.
--
-- The cost is stated plainly: until a translation is cleared, a Spanish caller
-- gets English with `description_is_fallback = true`. That is the truth about
-- what they are being served, which is strictly better than today, where they
-- get English and no flag at all.
--
-- ============ match_terms IS NOT HERE, DELIBERATELY ============
--
-- `concepts.match_terms` is empty on all 1,730 rows platform-wide and that is a
-- decision with an argument -- see MATCH-TERMS-DECISION.md. This table does not
-- carry the column. Adding it would reopen that decision by implication and
-- multiply it by three languages, which is the opposite of what the decision
-- says. The decision document is updated to record the new multiplier; nothing
-- about the decision itself changes.
--
-- ============ WHAT THIS DOES NOT DO ============
--
-- CONCEPTS ARE SERVED UNGATED AND STILL ARE. There is no `mcp_servable` on
-- `concepts`, `scan-iso-leaks` reads lessons only, and 90 descriptions carry
-- ISO runs at or above the lesson threshold. Those 90 were read and all 90
-- resolve to KEEP under the IP-POSITION section 6 ruling of 2026-09-20, so
-- nothing here is withheld -- but the ABSENCE OF A GATE is not the same as a
-- gate that passed, and it is recorded as an open question rather than bolted
-- on here. The blocker is that the threshold does not transfer: 10 words is
-- calibrated for 10,000-character lesson bodies, and the median concept
-- description is 9 words, where a 10-word run IS the whole description.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  allowed text[] := array['AISM-I','AIE-I','AIHR-I','AIGRM-I',
                          'SM-AI-I','SM-AI-II','SPO-AI-I','SD-AI-I',
                          'ISMS-F','AIMS-F','AIMS-IA','ISMS-IA'];
  n_concepts int;
  n_rows     int;
  n_lang     int;
  n_bad      int;
  n_fb       int;
  probe_id   uuid;
  probe_ok   boolean;
  probe_err  text;
begin

  -- ----------------------------------------------- pre-conditions
  select count(*) into n_concepts from public.concepts;
  if n_concepts = 0 then
    raise exception 'no concepts -- refusing to build a translation table for nothing';
  end if;
  if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
              where n.nspname = 'public' and c.relname = 'concept_translations') then
    raise exception 'public.concept_translations already exists -- this migration has run';
  end if;

  -- ----------------------------------------------- the table
  create table public.concept_translations (
    id             uuid primary key default gen_random_uuid(),
    concept_id     uuid not null references public.concepts(id) on delete cascade,
    language       text not null,
    name           text,
    description    text,
    is_provisional boolean not null default true,
    review_status  text not null default 'unreviewed',
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now(),
    constraint concept_translations_lang_chk
      check (language in ('es-419', 'pt-BR')),
    constraint concept_translations_review_chk
      check (review_status in ('unreviewed', 'approved', 'rejected')),
    constraint concept_translations_unique unique (concept_id, language)
  );

  -- English lives in `concepts`, so it is not a translation and the CHECK
  -- above refuses it. The same shape as every other *_translations table.

  comment on table public.concept_translations is
    'Non-English concept name and description. English is public.concepts. A row is not served until is_provisional is false -- see 355. match_terms is deliberately absent; see MATCH-TERMS-DECISION.md.';
  comment on column public.concept_translations.is_provisional is
    'True until a human has cleared this row. mcp.concept ignores provisional rows and falls back to English with description_is_fallback true.';

  create index concept_translations_concept_idx on public.concept_translations(concept_id);

  -- updated_at is maintained by trigger, matching the 19 tables that do so and
  -- not the 16 that leave it to whoever remembers. 353 records why.
  drop trigger if exists trg_concept_translations_set_updated_at on public.concept_translations;
  create trigger trg_concept_translations_set_updated_at
    before update on public.concept_translations
    for each row execute function public.set_updated_at();

  -- Grants. mcp_reader reads the VIEW, never the base table; the view is
  -- security_barrier and owned by the view owner, so no grant is needed here.
  grant select, insert, update, delete on public.concept_translations to service_role;

  -- ----------------------------------------------- the view
  -- DROP AND CREATE, because a column is being inserted mid-list and
  -- `create or replace view` may only append. A DROP takes the grants and the
  -- comment silently, so both are restated below -- 325, 328, 333, 334, 337,
  -- 342 and 343 all had to.
  drop view if exists mcp.concept;

  execute format($ddl$
    create view mcp.concept
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
     where c.code = any (%L::text[])
  $ddl$, allowed);

  execute 'comment on view mcp.concept is ' || quote_literal(
    'The concepts this MCP serves, with a language dimension added by 355. name and description come from public.concept_translations where a CLEARED row exists, coalesced onto the English base, and description_is_fallback says which. A provisional translation is not served: the caller gets English and the flag, rather than uncleared machine translation. An untranslated concept never vanishes.');

  execute 'grant select on mcp.concept to mcp_reader, mcp_holder';

  -- ===================== POST-CONDITIONS =====================

  -- 1. SHAPE. concepts x three languages, no fan-out. The unique constraint
  --    above makes a duplicate impossible, which is why this can assert the
  --    product exactly.
  execute 'set local role mcp_reader';
  select count(*), count(distinct language) into n_rows, n_lang from mcp.concept;
  execute 'reset role';
  select count(*) into n_concepts
    from public.concepts co join public.certifications c on c.id = co.certification_id
   where c.code = any (allowed);
  if n_rows <> n_concepts * 3 then
    raise exception 'mcp.concept returns % row(s), expected % (% concepts x 3)', n_rows, n_concepts * 3, n_concepts;
  end if;
  if n_lang <> 3 then
    raise exception 'mcp.concept exposes % distinct language(s), expected 3', n_lang;
  end if;

  -- 2. THE LANGUAGE LIST MATCHES THE FUNCTION'S. The literal above is a second
  --    copy of LANGUAGES in functions/_shared/courseware-query.ts; this is what
  --    stops them drifting silently, and 343 asserts the same property.
  execute 'set local role mcp_reader';
  select count(*) into n_bad
    from (select distinct language from mcp.concept) t
   where t.language not in ('en', 'es-419', 'pt-BR');
  execute 'reset role';
  if n_bad <> 0 then
    raise exception '% language(s) outside the expected three', n_bad
      using hint = 'LANGUAGES in functions/_shared/courseware-query.ts is the other copy.';
  end if;

  -- 3. NOTHING VANISHES. Every concept appears in every language, which is the
  --    defect this table exists to prevent and the reason the view is driven
  --    off `concepts` rather than off the translations.
  execute 'set local role mcp_reader';
  select count(*) into n_bad
    from (select slug, count(distinct language) k from mcp.concept group by slug) t
   where t.k <> 3;
  execute 'reset role';
  if n_bad <> 0 then
    raise exception '% concept(s) are missing a language row', n_bad;
  end if;

  -- 4. THE TABLE IS EMPTY, SO EVERY NON-ENGLISH ROW IS A FALLBACK, AND THE
  --    FLAG SAYS SO. English must be flagged too -- there is no English
  --    translation row by construction, so `ct.description is null` is true
  --    for en as well, and that is correct: the English description IS the
  --    base, not a translation of it.
  execute 'set local role mcp_reader';
  select count(*) filter (where description_is_fallback) into n_fb from mcp.concept;
  execute 'reset role';
  if n_fb <> n_rows then
    raise exception 'expected every row to be a fallback on an empty table, got % of %', n_fb, n_rows;
  end if;

  -- 5. AND THE NON-FALLBACK PATH WORKS. Checks 1-4 all pass on a view whose
  --    join never matches, which is the branch-that-cannot-run failure
  --    CLAUDE.md records: a path held shut by DATA reads exactly like one that
  --    works. So insert a cleared translation, read it back through the view,
  --    and roll the write back by raising -- `rollback to savepoint` is not a
  --    plpgsql statement, so the sub-block's own handler is the savepoint.
  select id into probe_id from public.concepts order by id limit 1;
  begin
    insert into public.concept_translations
      (concept_id, language, name, description, is_provisional, review_status)
    values (probe_id, 'es-419', 'PROBE NAME 355', 'PROBE DESCRIPTION 355', false, 'approved');
    select count(*) into n_bad
      from mcp.concept
     where language = 'es-419'
       and description = 'PROBE DESCRIPTION 355'
       and description_is_fallback = false;
    if n_bad <> 1 then
      raise exception 'the cleared translation did not reach the view (% row(s))', n_bad;
    end if;
    -- and a PROVISIONAL row must NOT reach it
    update public.concept_translations set is_provisional = true where concept_id = probe_id;
    select count(*) into n_bad
      from mcp.concept
     where language = 'es-419' and description = 'PROBE DESCRIPTION 355';
    if n_bad <> 0 then
      raise exception 'a provisional translation reached the view';
    end if;
    raise exception 'probe rollback' using errcode = 'ZZ999';
  exception
    when sqlstate 'ZZ999' then probe_ok := true;
    when others then probe_ok := false; probe_err := sqlstate || ' ' || sqlerrm;
  end;
  if not probe_ok then
    raise exception 'the view probe failed: %', probe_err
      using detail = 'Neither the served nor the withheld path could be demonstrated.';
  end if;

  -- 6. THE PROBE LEFT NOTHING. A sub-block that failed to roll back would have
  --    left a fake Spanish translation on a real concept.
  select count(*) into n_bad from public.concept_translations;
  if n_bad <> 0 then
    raise exception '% row(s) survived the probe rollback', n_bad;
  end if;

  -- 7. NEGATIVE. mcp_reader reads the view and NOT the base table.
  if has_table_privilege('mcp_reader', 'public.concept_translations', 'SELECT') then
    raise exception 'mcp_reader can select public.concept_translations directly';
  end if;
  if not has_table_privilege('mcp_reader', 'mcp.concept', 'SELECT') then
    raise exception 'mcp_reader lost SELECT on mcp.concept';
  end if;

  raise notice '355 ok: concept_translations created, mcp.concept returns % row(s) across 3 language(s)', n_rows;
  raise notice 'All non-English rows are fallbacks until translations land AND are cleared.';
  raise notice 'CONCEPTS REMAIN UNGATED for ISO leaks -- open question, see the header.';
end
$mig$;
