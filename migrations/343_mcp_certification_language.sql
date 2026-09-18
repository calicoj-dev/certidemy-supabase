-- 343_mcp_certification_language.sql
--
-- Give mcp.certification a language dimension. The translation already exists.
--
-- ============ THE DEFECT IS NOT WHAT IT LOOKED LIKE ============
--
-- Reported as "certifications.description comes back English from the connector
-- even though the site has Spanish". Measured 2026-09-17: it does not come back
-- English in preference to Spanish. The resource CANNOT BE ASKED in Spanish --
-- ALLOWED.certification in functions/_shared/courseware-query.ts is
-- ["resource","tool","certification"], so `language` returns
--
--   400 {"error":"unknown field 'language' for resource 'certification'"}
--
-- English is the only thing the view can express. That is a different bug from
-- a bad fallback, and it needs the column before it needs the allowlist.
--
-- ============ THERE IS NO CONTENT WORK HERE EITHER ============
--
-- The table is `public.certification_i18n`, keyed `lang` -- NOT
-- `certification_translations`. Measured 2026-09-17:
--
--   en       12 rows, description on 12 (5991 chars), claim on 12
--   es-419   12 rows, description on 12 (7198 chars), claim on 12
--   pt-BR    12 rows, description on 12 (6935 chars), claim on 12
--   served certifications with no es-419 row: 0;  with no pt-BR row: 0
--
-- `name` is NULL on all 36 rows, so the coalesce below always resolves to the
-- base column today. It is written anyway rather than omitted: the column
-- exists, the site reads it, and "always null so we skipped it" is one row away
-- from wrong.
--
-- ============ THE COALESCE IS THE SITE'S, NOT A NEW ONE ============
--
-- certidemy-web/lib/certifications/data.ts reads certification_i18n for the
-- active locale and coalesces onto the base columns, with this comment:
--
--   "Coalesce onto the base column so an empty translation never blanks the
--    field."
--
-- Same shape here. The one thing added is `description_is_fallback`, for the
-- reason 338 added `ksa_withheld` and 342 added `module_title_is_fallback`: a
-- caller must be able to tell an untranslated field from a translated one, and
-- a coalesce cannot say which.
--
-- ============ CROSS JOIN, SO A MISSING ROW FALLS BACK RATHER THAN VANISHES ===
--
-- The row set is certifications x LANGUAGES, left joined to the i18n table --
-- not a union driven off certification_i18n. Coverage is complete today, so
-- both shapes return the same 36 rows. They diverge on the case that matters:
-- a certification admitted with no i18n rows. Driven off the i18n table it
-- would return NOTHING for es-419, and the connector would report a
-- certification that does not exist in Spanish. Cross joined it returns the
-- English text with description_is_fallback true, which is the truth.
--
-- THE LANGUAGE LIST IS A SECOND COPY and there is no way to avoid that: a view
-- cannot read a TypeScript constant. The other copy is LANGUAGES in
-- functions/_shared/courseware-query.ts, currently ["en","es-419","pt-BR"].
-- Post-condition 2 asserts the view's distinct languages are exactly those
-- three, so the copies cannot drift without a migration failing.
--
-- `claim` IS DELIBERATELY NOT EXPOSED. It exists in certification_i18n for all
-- 36 rows and has no English base column. Adding a new field to what a
-- partner's agent receives is a product decision, not a translation fix, and
-- this migration is the second half of a bug report. It is one column away
-- whenever that decision is made.
--
-- ============ ORDERING: THIS MIGRATION RUNS BEFORE THE DEPLOY ============
--
-- The function change that adds "language" to ALLOWED.certification and selects
-- the two new columns MUST NOT be deployed until this has run. Ahead of it,
-- `language` and `description_is_fallback` do not exist on mcp.certification
-- and every certification read fails. Same hazard 338 recorded for
-- ksa_withheld, in the same direction.
--
-- ASCII only. One statement. Run in the SQL editor.

do $mig$
declare
  -- Twelve, unchanged from 337.
  allowed text[] := array['AISM-I','AIE-I','AIHR-I','AIGRM-I',
                          'SM-AI-I','SM-AI-II','SPO-AI-I','SD-AI-I',
                          'ISMS-F','AIMS-F','AIMS-IA','ISMS-IA'];
  n      int;
  n_rows int;
  n_lang int;
  n_fb   int;
  n_es   int;
  n_pt   int;
begin

  -- ----------------------------------------------- pre-conditions
  -- The table must exist under the name this file claims. It is NOT the
  -- `*_translations` convention every other translation table here uses, and a
  -- probe for `certification_translations` returns 404 -- which is how this was
  -- nearly reported as "certifications have no translation table".
  select count(*) into n
    from information_schema.tables
   where table_schema = 'public' and table_name = 'certification_i18n';
  if n <> 1 then
    raise exception 'public.certification_i18n does not exist';
  end if;

  -- Coverage, both languages, on every served certification. This migration
  -- adds no content: a partial set would serve English under a Spanish request
  -- and the flag would be the only thing saying so.
  select count(*) into n
    from public.certifications c
   where c.code = any (allowed)
     and not exists (
       select 1 from public.certification_i18n ci
        where ci.certification_id = c.id
          and ci.lang = 'es-419'
          and btrim(coalesce(ci.description, '')) <> ''
     );
  if n <> 0 then
    raise exception '% served certification(s) have no es-419 description', n
      using detail = 'Expected 0: all 12 carried es-419 and pt-BR on 2026-09-17.';
  end if;

  select count(*) into n
    from public.certifications c
   where c.code = any (allowed)
     and not exists (
       select 1 from public.certification_i18n ci
        where ci.certification_id = c.id
          and ci.lang = 'pt-BR'
          and btrim(coalesce(ci.description, '')) <> ''
     );
  if n <> 0 then
    raise exception '% served certification(s) have no pt-BR description', n;
  end if;

  -- ----------------------------------------------- the view
  -- Drop and create: a view column cannot be inserted (325's lesson), and this
  -- adds three.
  execute 'drop view if exists mcp.certification';

  execute format($ddl$
    create view mcp.certification
    with (security_barrier = true) as
    select c.code,
           lg.language,
           coalesce(ci.name, c.name) as name,
           coalesce(ci.description, c.description) as description,
           ci.description is null as description_is_fallback,
           c.tier, c.status,
           c.exam_duration_minutes, c.passing_score_pct, c.num_questions,
           c.max_exam_attempts, c.attempt_window_months, c.validity_days
      from public.certifications c
      cross join (values ('en'), ('es-419'), ('pt-BR')) as lg(language)
      left join public.certification_i18n ci
        on ci.certification_id = c.id and ci.lang = lg.language
     where c.code = any (%L::text[])
  $ddl$, allowed);

  -- ------------------------------------------------- comment and grants
  -- A DROP TAKES BOTH, silently. 325, 328, 333, 334, 337 and 342 all restated.
  execute 'comment on view mcp.certification is ' || quote_literal(
    'The certifications this MCP serves. TWELVE as of 337 -- all of them; there is no held set. 343 added the language dimension: name and description come from public.certification_i18n where a row exists, coalesced onto the English base columns, and description_is_fallback says which. claim is deliberately not exposed.');

  execute 'grant select on mcp.certification to mcp_reader, mcp_holder';

  -- ===================== POST-CONDITIONS =====================
  --
  -- AS THE ROLE, because 339 asserted a view property as a superuser and took
  -- explain_task down in two languages. Privilege questions are asked as
  -- mcp_reader; content questions are asked as the migration role, because
  -- mcp_reader has no grant on public.certification_i18n and must not have one.

  -- 1. SHAPE. Twelve certifications x three languages, and no fan-out. A
  --    duplicated i18n row would silently double a certification.
  execute 'set local role mcp_reader';
  select count(*), count(distinct language) into n_rows, n_lang from mcp.certification;
  execute 'reset role';
  if n_rows <> array_length(allowed, 1) * 3 then
    raise exception 'mcp.certification returns % row(s), expected %', n_rows, array_length(allowed, 1) * 3
      using detail = 'A duplicate certification_i18n row fans this out.';
  end if;
  raise notice 'ok: % row(s), % language(s)', n_rows, n_lang;

  -- 2. THE LANGUAGE LIST MATCHES THE FUNCTION'S. The literal above is a second
  --    copy of LANGUAGES in courseware-query.ts and this is what keeps them
  --    from drifting silently.
  execute 'set local role mcp_reader';
  select count(*) into n
    from (select distinct language from mcp.certification) t
   where t.language not in ('en', 'es-419', 'pt-BR');
  execute 'reset role';
  if n_lang <> 3 or n <> 0 then
    raise exception 'mcp.certification exposes % distinct language(s), % outside the expected three', n_lang, n
      using hint = 'LANGUAGES in functions/_shared/courseware-query.ts is the other copy.';
  end if;

  -- 3. POSITIVE HALF. Spanish and Portuguese actually differ from English.
  --    Structural, not transcribed: this file is ASCII only and cannot quote a
  --    Spanish description.
  select count(*) filter (where s.description <> e.description),
         count(*) filter (where p.description <> e.description)
    into n_es, n_pt
    from mcp.certification e
    join mcp.certification s on s.code = e.code and s.language = 'es-419'
    join mcp.certification p on p.code = e.code and p.language = 'pt-BR'
   where e.language = 'en';
  if n_es <> array_length(allowed, 1) or n_pt <> array_length(allowed, 1) then
    raise exception 'only % es-419 and % pt-BR description(s) differ from English, expected % each',
      n_es, n_pt, array_length(allowed, 1)
      using detail = 'A description equal to English means the coalesce fell back.';
  end if;
  raise notice 'ok: % es-419 and % pt-BR descriptions differ from English', n_es, n_pt;

  -- 4. NEGATIVE HALF. Nothing falls back, and English is not labelled a
  --    fallback of itself -- certification_i18n carries an 'en' row for all
  --    twelve, so description_is_fallback must be false everywhere today.
  select count(*) into n_fb from mcp.certification where description_is_fallback;
  if n_fb <> 0 then
    raise exception '% row(s) report description_is_fallback', n_fb
      using detail = 'Coverage was asserted complete above, so the join predicate is wrong.';
  end if;

  -- 5. AND THE ENGLISH TEXT IS STILL THE ENGLISH TEXT. The cross join must not
  --    have changed what an English caller receives.
  select count(*) into n
    from mcp.certification v
    join public.certifications c on c.code = v.code
   where v.language = 'en'
     and (v.description is distinct from coalesce(
            (select ci.description from public.certification_i18n ci
              where ci.certification_id = c.id and ci.lang = 'en'), c.description));
  if n <> 0 then
    raise exception '% English row(s) do not match the English source', n;
  end if;
  raise notice 'ok: English unchanged';

  -- 6. THE PAYWALL IS UNTOUCHED. This migration grants a view to mcp_reader;
  --    assert it did not grant the wrong one.
  if has_table_privilege('mcp_reader', 'mcp.lesson', 'SELECT') then
    raise exception 'mcp_reader can select mcp.lesson -- the paywall is open';
  end if;

  raise notice '343 ok: mcp.certification answers in three languages. DEPLOY courseware-read NEXT.';
end
$mig$;
